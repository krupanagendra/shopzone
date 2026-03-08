const express = require("express");
const router = express.Router();
const { getStats, getAllUsers, deleteUser, updateUserRole } = require("../controllers/adminController");
const { protect, admin } = require("../middleware/auth");

router.get("/stats", protect, admin, getStats);
router.get("/users", protect, admin, getAllUsers);
router.delete("/users/:id", protect, admin, deleteUser);
router.put("/users/:id/role", protect, admin, updateUserRole);

module.exports = router;
