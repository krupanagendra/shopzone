const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const User = require("../models/User");
const { sendOrderConfirmationEmail, sendOrderStatusEmail } = require("../utils/emailService");

// ── INR price calculations ────────────────────────────────────────────────────
const calcPrices = (cartItems) => {
  const itemsPrice = cartItems.reduce((acc, i) => acc + i.price * i.quantity, 0);
  const shippingPrice = itemsPrice > 8400 ? 0 : 840;
  const taxPrice = parseFloat((0.15 * itemsPrice).toFixed(2));
  const totalPrice = parseFloat((itemsPrice + shippingPrice + taxPrice).toFixed(2));
  return { itemsPrice, shippingPrice, taxPrice, totalPrice };
};

// ── POST /api/orders ──────────────────────────────────────────────────────────
exports.createOrder = async (req, res) => {
  try {
    const { shippingAddress, paymentResult, razorpayPaymentId, razorpayOrderId, paymentMethod } = req.body;

    // Validate shipping address
    if (!shippingAddress?.fullName || !shippingAddress?.address || !shippingAddress?.city) {
      return res.status(400).json({ message: "Incomplete shipping address" });
    }

    // Get cart
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "No items in cart" });
    }

    const { itemsPrice, shippingPrice, taxPrice, totalPrice } = calcPrices(cart.items);
    const isCOD = paymentMethod === "cod";
    const isPaid = !isCOD;

    // Create order
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
      paymentMethod: isCOD ? "cod" : "razorpay",
      paymentResult: paymentResult || null,
      razorpayPaymentId: razorpayPaymentId || null,
      razorpayOrderId: razorpayOrderId || null,
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      isPaid,
      paidAt: isPaid ? new Date() : null,
      status: "processing",
    });

    // Update stock via bulkWrite (single DB operation, not N individual updates)
    const bulkOps = cart.items.map(item => ({
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { countInStock: -item.quantity, salesLast7Days: item.quantity } }
      }
    }));
    if (bulkOps.length > 0) {
      await Product.bulkWrite(bulkOps);
    }

    // Clear cart
    cart.items = [];
    await cart.save();

    // Send confirmation email (non-blocking)
    try {
      const user = await User.findById(req.user._id).select("name email").lean();
      if (user?.email) {
        sendOrderConfirmationEmail({ user, order }).catch(err => {
          console.error("⚠️  Email send error (order still created):", err.message);
        });
      }
    } catch (emailErr) {
      console.error("⚠️  Email send error (order still created):", emailErr.message);
    }

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET /api/orders/:id ───────────────────────────────────────────────────────
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "name email");
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET /api/orders/mine ──────────────────────────────────────────────────────
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET /api/orders (admin) ───────────────────────────────────────────────────
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate("user", "name email").sort({ createdAt: -1 }).lean();
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── PUT /api/orders/:id/status (admin) ───────────────────────────────────────
exports.updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "name email");
    if (!order) return res.status(404).json({ message: "Order not found" });

    const prevStatus = order.status;
    const newStatus = req.body.status;

    // Prevent invalid status transitions
    if (prevStatus === newStatus) {
      return res.status(400).json({ message: "Order already has this status" });
    }

    order.status = newStatus;

    if (newStatus === "shipped" && !order.shippedAt) {
      order.shippedAt = new Date();
    }

    if (newStatus === "delivered") {
      order.isDelivered = true;
      order.deliveredAt = new Date();
    }

    const updated = await order.save();

    // Send status update email (only if status actually changed)
    if (prevStatus !== newStatus && order.user?.email) {
      sendOrderStatusEmail({
        user: order.user,
        order: updated,
        newStatus,
      }).catch(err => console.error("Status email error:", err.message));
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── DELETE /api/orders/:id (admin) ───────────────────────────────────────────
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json({ message: "Order removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};