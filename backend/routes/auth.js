const express = require("express");
const router = express.Router();
const { register, login, getProfile, updateProfile, sendOTP, verifyOTP } = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { body } = require("express-validator");

// OTP Registration flow
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);

// Standard routes
router.post("/register", [
  body("name").notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 chars"),
], register);

router.post("/login", login);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

module.exports = router;