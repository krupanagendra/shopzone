const crypto = require("crypto");
const Cart = require("../models/Cart");
const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");
const { sendOrderConfirmationEmail } = require("../utils/emailService");

// ── Direct Razorpay API Client ───────────────────────────────────────────────
// We call the Razorpay REST API directly using Node's fetch/axios instead of
// the `razorpay` SDK. The SDK's normalizeError() has a fatal bug that
// causes the process to hang on network errors.

function getRazorpayConfig() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error(
      "Razorpay keys are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env"
    );
  }
  return { key_id, key_secret };
}

/**
 * Create a Razorpay order via direct REST API call.
 * Uses AbortController for hard timeout (covers DNS + connect + response).
 */
async function createRazorpayOrderDirect(orderOptions) {
  const { key_id, key_secret } = getRazorpayConfig();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s hard timeout

  try {
    // Use dynamic import of node-fetch or built-in fetch (Node 18+)
    const https = require("https");
    const data = JSON.stringify(orderOptions);
    const auth = Buffer.from(`${key_id}:${key_secret}`).toString("base64");

    return await new Promise((resolve, reject) => {
      const req = https.request(
        {
          hostname: "api.razorpay.com",
          path: "/v1/orders",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(data),
            Authorization: `Basic ${auth}`,
          },
          timeout: 15000,
          signal: controller.signal,
        },
        (res) => {
          let body = "";
          res.on("data", (chunk) => (body += chunk));
          res.on("end", () => {
            clearTimeout(timeoutId);
            try {
              const parsed = JSON.parse(body);
              if (res.statusCode >= 200 && res.statusCode < 300) {
                resolve(parsed);
              } else {
                const err = new Error(
                  parsed.error?.description || `Razorpay API error (${res.statusCode})`
                );
                err.statusCode = res.statusCode;
                err.razorpayError = parsed.error;
                reject(err);
              }
            } catch (parseErr) {
              reject(new Error(`Invalid response from Razorpay: ${body.substring(0, 200)}`));
            }
          });
        }
      );

      req.on("error", (err) => {
        clearTimeout(timeoutId);
        reject(err);
      });

      req.on("timeout", () => {
        clearTimeout(timeoutId);
        req.destroy();
        reject(Object.assign(new Error("Razorpay API connection timed out"), { code: "TIMEOUT" }));
      });

      req.write(data);
      req.end();
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError" || err.code === "ABORT_ERR") {
      throw Object.assign(new Error("Razorpay API request aborted (timeout)"), { code: "TIMEOUT" });
    }
    throw err;
  }
}

// ── POST /api/payment/create-order ───────────────────────────────────────────
exports.createRazorpayOrder = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const itemsPrice = cart.items.reduce((acc, i) => acc + i.price * i.quantity, 0);
    const shippingPrice = itemsPrice > 8400 ? 0 : 840;
    const taxPrice = parseFloat((0.15 * itemsPrice).toFixed(2));
    const totalPrice = parseFloat((itemsPrice + shippingPrice + taxPrice).toFixed(2));

    const options = {
      amount: Math.round(totalPrice * 100), // Razorpay expects paise
      currency: "INR",
      receipt: `rcpt_${req.user._id.toString().slice(-6)}_${Date.now()}`,
      notes: { userId: req.user._id.toString() },
    };

    console.log("[PAYMENT] Creating Razorpay order:", {
      amount: options.amount,
      currency: options.currency,
    });

    const order = await createRazorpayOrderDirect(options);
    console.log("[PAYMENT] ✅ Razorpay order created:", order.id);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      totalPrice,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("[PAYMENT] ❌ Razorpay order creation error:", error.message);

    let message = "Failed to create payment order";
    let hint = "";

    if (
      error.code === "TIMEOUT" ||
      error.code === "ECONNABORTED" ||
      error.code === "ABORT_ERR" ||
      error.message?.includes("timeout")
    ) {
      message = "Razorpay API timed out (15s). The payment server is unreachable.";
      hint =
        "Check your internet connection. If you're on a restricted network (college/office WiFi), Razorpay API may be blocked. Try using mobile hotspot.";
    } else if (
      error.code === "ENOTFOUND" ||
      error.code === "ECONNREFUSED" ||
      error.code === "EAI_AGAIN"
    ) {
      message = "Cannot reach Razorpay servers (DNS failed).";
      hint = "Check your internet connection. api.razorpay.com must be reachable.";
    } else if (error.statusCode === 401) {
      message = "Invalid Razorpay API keys (401 Unauthorized).";
      hint =
        "Your test keys have expired or are wrong. Generate new ones at https://dashboard.razorpay.com/app/keys and update your .env file.";
    } else if (error.statusCode === 400) {
      message = error.razorpayError?.description || "Bad request to Razorpay";
    } else if (error.statusCode) {
      message = `Razorpay error (${error.statusCode}): ${error.razorpayError?.description || "Unknown"}`;
    } else if (error.message?.includes("Razorpay keys")) {
      message = error.message;
      hint = "Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file";
    }

    res.status(500).json({ message, hint });
  }
};

// ── POST /api/payment/verify ─────────────────────────────────────────────────
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing payment verification details" });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return res.status(500).json({ message: "Razorpay secret key not configured on server" });
    }

    const isDemoMode = process.env.DEMO_PAYMENT_MODE === 'true';

    if (isDemoMode) {
      console.log("[PAYMENT] 🧪 Demo Mode Active: Forcing successful payment verification for order:", razorpay_order_id);
      return res.json({
        success: true,
        message: "Payment verified successfully (Demo Mode)",
        paymentId: razorpay_payment_id || `demo_pay_${Date.now()}`,
        orderId: razorpay_order_id,
        isDemo: true
      });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      console.log("[PAYMENT] ✅ Payment verified:", razorpay_payment_id);
      res.json({
        success: true,
        message: "Payment verified successfully",
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
      });
    } else {
      console.warn("[PAYMENT] ⚠️ Signature mismatch for order:", razorpay_order_id);
      res.status(400).json({
        success: false,
        message: "Payment verification failed — signature mismatch",
      });
    }
  } catch (error) {
    console.error("[PAYMENT] ❌ Payment verification error:", error.message);
    res.status(500).json({ message: "Payment verification error" });
  }
};

// ── GET /api/payment/key ─────────────────────────────────────────────────────
exports.getRazorpayKey = (req, res) => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  if (!keyId) {
    return res.status(500).json({ message: "Razorpay key not configured" });
  }
  res.json({ 
    keyId,
    demoMode: process.env.DEMO_PAYMENT_MODE === 'true'
  });
};

// ── POST /api/payment/create-payment-link ────────────────────────────────────
exports.createPaymentLink = async (req, res) => {
  try {
    const { shippingAddress } = req.body;
    if (!shippingAddress?.fullName || !shippingAddress?.address) {
      return res.status(400).json({ message: "Incomplete shipping address" });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const itemsPrice = cart.items.reduce((acc, i) => acc + i.price * i.quantity, 0);
    const shippingPrice = itemsPrice > 8400 ? 0 : 840;
    const taxPrice = parseFloat((0.15 * itemsPrice).toFixed(2));
    const totalPrice = parseFloat((itemsPrice + shippingPrice + taxPrice).toFixed(2));

    // Create Order in DB
    const order = await Order.create({
      user: req.user._id,
      items: cart.items.map((i) => ({
        product: i.product,
        name: i.name,
        image: i.image,
        price: i.price,
        quantity: i.quantity,
      })),
      shippingAddress,
      paymentMethod: "email_link",
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      isPaid: false,
      status: "pending",
    });

    // Reduce stock (so items are reserved)
    const bulkOps = cart.items.map(item => ({
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { countInStock: -item.quantity, salesLast7Days: item.quantity } }
      }
    }));
    if (bulkOps.length > 0) {
      await Product.bulkWrite(bulkOps);
    }
    
    // Clear Cart
    cart.items = [];
    await cart.save();

    // Call Razorpay Payment Links API
    const { key_id, key_secret } = getRazorpayConfig();
    const https = require("https");
    const user = await User.findById(req.user._id);

    const payload = JSON.stringify({
      amount: Math.round(totalPrice * 100),
      currency: "INR",
      accept_partial: false,
      reference_id: order._id.toString(),
      description: "OmniKart Order #" + String(order._id).slice(-8).toUpperCase(),
      customer: {
        name: user.name,
        email: user.email
      },
      notify: { sms: false, email: false },
      reminder_enable: false
    });

    const auth = Buffer.from(`${key_id}:${key_secret}`).toString("base64");

    const paymentLinkData = await new Promise((resolve, reject) => {
      const reqRP = https.request({
        hostname: "api.razorpay.com",
        path: "/v1/payment_links",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
          Authorization: `Basic ${auth}`,
        }
      }, (resRP) => {
        let body = "";
        resRP.on("data", (chunk) => body += chunk);
        resRP.on("end", () => {
          if (resRP.statusCode >= 200 && resRP.statusCode < 300) resolve(JSON.parse(body));
          else reject(new Error(body));
        });
      });
      reqRP.on("error", reject);
      reqRP.write(payload);
      reqRP.end();
    });

    order.paymentLink = paymentLinkData.short_url;
    order.razorpayOrderId = paymentLinkData.id;
    await order.save();

    // Email sending removed as per requirements

    res.json({ message: "Payment link sent successfully", orderId: order._id });

  } catch (error) {
    console.error("[PAYMENT] ❌ Payment Link Error:", error);
    res.status(500).json({ message: "Failed to create payment link" });
  }
};

// ── POST /api/payment/webhook ────────────────────────────────────────────────
exports.webhookHandler = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) return res.status(500).send("Webhook secret not configured");

    const signature = req.headers["x-razorpay-signature"];
    const bodyString = JSON.stringify(req.body);

    const expectedSignature = crypto.createHmac("sha256", secret).update(bodyString).digest("hex");
    if (signature !== expectedSignature) {
      console.warn("⚠️ Invalid Webhook Signature");
      return res.status(400).send("Invalid signature");
    }

    const event = req.body.event;
    if (event === "payment_link.paid") {
      const paymentEntity = req.body.payload.payment_link.entity;
      const orderId = paymentEntity.reference_id; 

      const order = await Order.findById(orderId).populate("user");
      if (order && !order.isPaid) {
        order.isPaid = true;
        order.paidAt = new Date();
        order.status = "processing";
        order.paymentResult = {
          id: paymentEntity.payment_id || paymentEntity.id,
          status: "completed",
          update_time: new Date().toISOString(),
          email_address: order.user.email
        };
        await order.save();
        console.log(`✅ Webhook: Order ${orderId} marked as Paid`);

        // Send Order Confirmation (with attached PDF)
        try {
          await sendOrderConfirmationEmail({ user: order.user, order });
        } catch (e) {
          console.error("Webhook email generation failed", e);
        }
      }
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).send("Error processing webhook");
  }
};
