/**
 * OmniKart Email Service
 * Uses Nodemailer with Gmail SMTP (same credentials as OTP)
 * Handles: Order Confirmation, COD Confirmation, Status Updates
 */
const nodemailer = require("nodemailer");

// ── Create reusable transporter ───────────────────────────────────────────────
const createTransporter = () => {
    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
        },
    });
};

// ── INR formatter ─────────────────────────────────────────────────────────────
const fmt = (n) => `₹${Math.round(n || 0).toLocaleString("en-IN")}`;

// ── Estimated delivery date ───────────────────────────────────────────────────
const getEstimatedDelivery = (paymentMethod, isPrime = false) => {
    const today = new Date();
    const days = isPrime ? 2 : paymentMethod === "cod" ? 7 : 5;
    today.setDate(today.getDate() + days);
    return today.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
};

// ── Build order email HTML ────────────────────────────────────────────────────
const buildOrderEmailHTML = ({ user, order, type = "confirmation" }) => {
    const isCOD = order.paymentMethod === "cod";
    const statusColor = type === "confirmation" ? "#22c55e" : "#3b82f6";
    const statusText = type === "confirmation"
        ? (isCOD ? "Order Placed — Pay on Delivery" : "Order Confirmed & Paid")
        : "Order Status Updated";

    const deliveryDays = isCOD ? "5-7" : "3-5";
    const deliveryType = isCOD ? "Standard (COD)" : "Standard";
    const estDelivery = getEstimatedDelivery(order.paymentMethod);

    const itemsHTML = (order.items || []).map((item) => `
    <tr>
      <td style="padding:12px 8px;border-bottom:1px solid #f1f5f9;">
        <div style="display:flex;align-items:center;gap:12px;">
          <img src="${item.image}" alt="${item.name}"
            style="width:56px;height:56px;object-fit:cover;border-radius:8px;border:1px solid #e2e8f0;"
            onerror="this.src='https://placehold.co/56x56/131921/febd69?text=?'" />
          <div>
            <p style="margin:0;font-weight:600;color:#1e293b;font-size:14px;">${item.name}</p>
            <p style="margin:4px 0 0;color:#64748b;font-size:13px;">Qty: ${item.quantity}</p>
          </div>
        </div>
      </td>
      <td style="padding:12px 8px;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:700;color:#1e293b;font-size:14px;white-space:nowrap;">
        ${fmt(item.price * item.quantity)}
      </td>
    </tr>`).join("");

    const discount = order.discountAmount ? `
    <tr>
      <td style="padding:6px 0;color:#16a34a;font-size:14px;">🏷️ Discount Applied</td>
      <td style="padding:6px 0;color:#16a34a;font-size:14px;text-align:right;font-weight:600;">- ${fmt(order.discountAmount)}</td>
    </tr>` : "";

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>Order Confirmation — OmniKart</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#131921 0%,#232f3e 100%);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#febd69;font-size:28px;font-weight:900;letter-spacing:-0.5px;">🏠 OmniKart</h1>
            <p style="margin:8px 0 0;color:#94a3b8;font-size:14px;">Your one-stop shopping destination</p>
          </td>
        </tr>

        <!-- Status Banner -->
        <tr>
          <td style="background:${statusColor};padding:16px 40px;text-align:center;">
            <p style="margin:0;color:#ffffff;font-size:16px;font-weight:700;">
              ${isCOD ? "📦" : "✅"} ${statusText}
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">

            <!-- Greeting -->
            <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1e293b;">
              Hello, ${user.name}! 👋
            </p>
            <p style="margin:0 0 28px;color:#64748b;font-size:15px;line-height:1.6;">
              ${isCOD
            ? "Your order has been placed successfully! Please keep the payment ready for delivery."
            : "Thank you for your order! Your payment has been confirmed and your order is being processed."}
            </p>

            <!-- Order ID Box -->
            <div style="background:#f8fafc;border:2px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:28px;text-align:center;">
              <p style="margin:0;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:1.5px;font-weight:600;">Order ID</p>
              <p style="margin:8px 0 0;color:#131921;font-size:22px;font-weight:900;font-family:'Courier New',monospace;letter-spacing:2px;">
                #${String(order._id).slice(-8).toUpperCase()}
              </p>
              <p style="margin:6px 0 0;color:#94a3b8;font-size:13px;">
                Placed on ${new Date(order.createdAt || Date.now()).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>

            <!-- Items Table -->
            <h3 style="margin:0 0 16px;font-size:16px;font-weight:700;color:#1e293b;border-bottom:2px solid #f1f5f9;padding-bottom:10px;">
              🛍️ Order Items
            </h3>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <thead>
                <tr style="background:#f8fafc;">
                  <th style="padding:10px 8px;text-align:left;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Product</th>
                  <th style="padding:10px 8px;text-align:right;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Amount</th>
                </tr>
              </thead>
              <tbody>${itemsHTML}</tbody>
            </table>

            <!-- Price Summary -->
            <div style="background:#f8fafc;border-radius:12px;padding:20px;margin-bottom:28px;">
              <h3 style="margin:0 0 16px;font-size:15px;font-weight:700;color:#1e293b;">💰 Order Summary</h3>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:6px 0;color:#64748b;font-size:14px;">Subtotal</td>
                  <td style="padding:6px 0;text-align:right;font-size:14px;color:#1e293b;font-weight:500;">${fmt(order.itemsPrice)}</td>
                </tr>
                ${discount}
                <tr>
                  <td style="padding:6px 0;color:#64748b;font-size:14px;">Shipping</td>
                  <td style="padding:6px 0;text-align:right;font-size:14px;${order.shippingPrice === 0 ? "color:#16a34a;font-weight:600;" : "color:#1e293b;font-weight:500;"}">${order.shippingPrice === 0 ? "FREE" : fmt(order.shippingPrice)}</td>
                </tr>
                <tr>
                  <td style="padding:6px 0;color:#64748b;font-size:14px;">Tax (15%)</td>
                  <td style="padding:6px 0;text-align:right;font-size:14px;color:#1e293b;font-weight:500;">${fmt(order.taxPrice)}</td>
                </tr>
                <tr style="border-top:2px solid #e2e8f0;">
                  <td style="padding:14px 0 6px;font-size:17px;font-weight:800;color:#1e293b;">Total</td>
                  <td style="padding:14px 0 6px;text-align:right;font-size:20px;font-weight:900;color:#131921;">${fmt(order.totalPrice)}</td>
                </tr>
              </table>
            </div>

            <!-- Two Columns: Delivery + Payment -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <!-- Delivery -->
                <td width="48%" style="vertical-align:top;background:#f0fdf4;border-radius:12px;padding:18px;border:1px solid #bbf7d0;">
                  <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#166534;">🚚 Delivery Details</p>
                  <p style="margin:0 0 6px;font-size:13px;color:#374151;">
                    <strong>${order.shippingAddress?.fullName || user.name}</strong>
                  </p>
                  <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">${order.shippingAddress?.address || ""}</p>
                  <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">${order.shippingAddress?.city || ""}, ${order.shippingAddress?.postalCode || ""}</p>
                  <p style="margin:0 0 12px;font-size:13px;color:#6b7280;">${order.shippingAddress?.country || ""}</p>
                  <p style="margin:0 0 4px;font-size:13px;color:#374151;"><strong>Type:</strong> ${deliveryType}</p>
                  <p style="margin:0 0 4px;font-size:13px;color:#374151;"><strong>ETA:</strong> ${deliveryDays} business days</p>
                  <p style="margin:0;font-size:12px;color:#16a34a;font-weight:600;">📅 By ${estDelivery}</p>
                </td>
                <td width="4%"></td>
                <!-- Payment -->
                <td width="48%" style="vertical-align:top;background:${isCOD ? "#fffbeb" : "#eff6ff"};border-radius:12px;padding:18px;border:1px solid ${isCOD ? "#fde68a" : "#bfdbfe"};">
                  <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:${isCOD ? "#92400e" : "#1d4ed8"};">
                    ${isCOD ? "💵 Payment (COD)" : "💳 Payment Details"}
                  </p>
                  <p style="margin:0 0 6px;font-size:13px;color:#374151;">
                    <strong>Method:</strong> ${isCOD ? "Cash on Delivery" : "Online (Razorpay)"}
                  </p>
                  <p style="margin:0 0 6px;font-size:13px;color:#374151;">
                    <strong>Status:</strong>
                    <span style="color:${order.isPaid ? "#16a34a" : "#d97706"};font-weight:600;">
                      ${order.isPaid ? "✅ Paid" : "⏳ Pay on delivery"}
                    </span>
                  </p>
                  ${isCOD ? `<p style="margin:8px 0 0;font-size:12px;color:#92400e;background:#fef3c7;padding:8px;border-radius:6px;">
                    Please keep <strong>${fmt(order.totalPrice)}</strong> ready at the time of delivery.
                  </p>` : `<p style="margin:0;font-size:13px;color:#374151;"><strong>Amount:</strong> ${fmt(order.totalPrice)}</p>`}
                </td>
              </tr>
            </table>

            <!-- Track Order Button -->
            <div style="text-align:center;margin-bottom:28px;">
              <a href="${process.env.CLIENT_URL || "http://localhost:5173"}/order/${order._id}"
                style="display:inline-block;background:#febd69;color:#000000;font-weight:800;font-size:15px;padding:14px 36px;border-radius:10px;text-decoration:none;letter-spacing:0.3px;">
                📦 Track Your Order
              </a>
            </div>

            <!-- Note -->
            <div style="background:#fafafa;border-left:4px solid #febd69;border-radius:0 8px 8px 0;padding:16px;margin-bottom:8px;">
              <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">
                📌 <strong>Note:</strong> This is a demo project order for academic purposes only.
                All transactions are simulated. No real products will be shipped.
              </p>
            </div>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#131921;padding:28px 40px;text-align:center;">
            <p style="margin:0 0 6px;color:#febd69;font-size:16px;font-weight:700;">We appreciate your business! 🙏</p>
            <p style="margin:0 0 16px;color:#94a3b8;font-size:14px;">Happy Shopping! 🛍️</p>
            <p style="margin:0;color:#475569;font-size:12px;">
              © 2026 OmniKart · Final Year Academic Project · No commercial use
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

// ── MAIN: Send order confirmation email ───────────────────────────────────────
const sendOrderConfirmationEmail = async ({ user, order }) => {
    // Validate required fields
    if (!user?.email) {
        console.warn("⚠️  Email skipped: no user email");
        return { success: false, reason: "no_email" };
    }
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        console.warn("⚠️  Email skipped: GMAIL_USER or GMAIL_APP_PASSWORD not set in .env");
        return { success: false, reason: "no_config" };
    }

    try {
        const transporter = createTransporter();
        const isCOD = order.paymentMethod === "cod";
        const subject = isCOD
            ? `📦 Order Placed #${String(order._id).slice(-8).toUpperCase()} — OmniKart`
            : `✅ Order Confirmed #${String(order._id).slice(-8).toUpperCase()} — OmniKart`;

        await transporter.sendMail({
            from: `"OmniKart" <${process.env.GMAIL_USER}>`,
            to: user.email,
            subject,
            html: buildOrderEmailHTML({ user, order }),
        });

        console.log(`✅ Order email sent to ${user.email} for order #${String(order._id).slice(-8).toUpperCase()}`);
        return { success: true };
    } catch (err) {
        // Email failure should NEVER crash the order — just log
        console.error("❌ Order email failed:", err.message);
        return { success: false, reason: err.message };
    }
};

// ── Send order status update email ────────────────────────────────────────────
const sendOrderStatusEmail = async ({ user, order, newStatus }) => {
    if (!user?.email || !process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        return { success: false };
    }

    const statusMessages = {
        processing: { emoji: "⚙️", text: "Your order is being processed", color: "#3b82f6" },
        shipped: { emoji: "🚚", text: "Your order has been shipped!", color: "#8b5cf6" },
        delivered: { emoji: "✅", text: "Your order has been delivered!", color: "#22c55e" },
        cancelled: { emoji: "❌", text: "Your order has been cancelled", color: "#ef4444" },
    };

    const statusInfo = statusMessages[newStatus];
    if (!statusInfo) return { success: false };

    try {
        const transporter = createTransporter();
        await transporter.sendMail({
            from: `"OmniKart" <${process.env.GMAIL_USER}>`,
            to: user.email,
            subject: `${statusInfo.emoji} Order ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)} #${String(order._id).slice(-8).toUpperCase()} — OmniKart`,
            html: buildOrderEmailHTML({ user, order, type: "status" }),
        });
        console.log(`✅ Status email (${newStatus}) sent to ${user.email}`);
        return { success: true };
    } catch (err) {
        console.error("❌ Status email failed:", err.message);
        return { success: false, reason: err.message };
    }
};

// ── Send daily admin report email (with PDF attachment) ───────────────────────
const { generateDailyReportEmailHtml } = require("./emailTemplates");

const sendDailyReportEmail = async (pdfBuffer, reportData = {}) => {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER;

    if (!adminEmail) {
        console.warn("⚠️  Daily report email skipped: ADMIN_EMAIL not set in .env");
        return { success: false, reason: "no_admin_email" };
    }
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        console.warn("⚠️  Daily report email skipped: Gmail credentials not configured");
        return { success: false, reason: "no_config" };
    }

    const today = new Date().toLocaleDateString("en-IN", {
        weekday: "long", day: "numeric", month: "long", year: "numeric"
    });

    try {
        const transporter = createTransporter();
        const mailOptions = {
            from: `"OmniKart AI" <${process.env.GMAIL_USER}>`,
            to: adminEmail,
            subject: `📊 Daily Business Report — OmniKart (${today})`,
            html: generateDailyReportEmailHtml(reportData),
        };

        // Attach PDF only if we have a valid buffer
        if (pdfBuffer && Buffer.isBuffer(pdfBuffer) && pdfBuffer.length > 0) {
            mailOptions.attachments = [{
                filename: `OmniKart_Daily_Report_${new Date().toISOString().slice(0, 10)}.pdf`,
                content: pdfBuffer,
                contentType: "application/pdf",
            }];
        }

        await transporter.sendMail(mailOptions);
        console.log(`✅ [EMAIL] Daily report sent to admin: ${adminEmail}`);
        return { success: true };
    } catch (err) {
        console.error("❌ [EMAIL] Daily report email failed:", err.message);
        return { success: false, reason: err.message };
    }
};

module.exports = { sendOrderConfirmationEmail, sendOrderStatusEmail, sendDailyReportEmail };
