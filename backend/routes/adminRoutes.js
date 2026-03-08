const express = require("express");
const router = express.Router();
const { getDashboardStats, getAllUsers, toggleUserStatus } = require("../controllers/adminController");
const { protect, admin } = require("../middleware/authMiddleware");

router.get("/stats", protect, admin, getDashboardStats);
router.get("/users", protect, admin, getAllUsers);
router.put("/users/:id/toggle", protect, admin, toggleUserStatus);

module.exports = router;
