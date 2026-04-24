const express = require("express");
const router = express.Router();
const { createOrder, getOrderById, getMyOrders, getAllOrders, updateOrderStatus, deleteOrder, downloadReceipt } = require("../controllers/orderController");
const { protect, admin } = require("../middleware/auth");

router.post("/", protect, createOrder);
router.get("/mine", protect, getMyOrders);
router.get("/", protect, admin, getAllOrders);
router.get("/:id", protect, getOrderById);
router.get("/:id/receipt", protect, downloadReceipt);
router.put("/:id/status", protect, admin, updateOrderStatus);
router.delete("/:id", protect, admin, deleteOrder);

module.exports = router;
