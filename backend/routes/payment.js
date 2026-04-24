const express = require("express");
const router = express.Router();
const { createRazorpayOrder, verifyPayment, getRazorpayKey, createPaymentLink, webhookHandler } = require("../controllers/paymentController");
const { protect } = require("../middleware/auth");

router.post("/create-order", protect, createRazorpayOrder);
router.post("/create-payment-link", protect, createPaymentLink);
router.post("/webhook", webhookHandler);
router.post("/verify", protect, verifyPayment);
router.get("/key", protect, getRazorpayKey);

module.exports = router;
