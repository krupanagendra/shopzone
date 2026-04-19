const User = require("../models/User");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { validationResult } = require("express-validator");

// In-memory OTP store (no extra DB needed)
// { email: { otp, name, password, expiresAt, attempts } }
const otpStore = new Map();

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

// ── Nodemailer transporter (Gmail free SMTP) ──────────────────────────────────
const createTransporter = () => nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD, // Gmail App Password (16 chars)
  },
});

// ── Send OTP email ────────────────────────────────────────────────────────────
const sendOTPEmail = async (email, name, otp) => {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"OmniKart" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "🔐 Your OmniKart Verification Code",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f3f4;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f3f4;padding:40px 20px">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10)">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#131921 0%,#232f3e 100%);padding:36px 40px;text-align:center">
          <h1 style="margin:0;color:#febd69;font-size:28px;font-weight:800;letter-spacing:-0.5px">🏠 OmniKart</h1>
          <p style="margin:8px 0 0;color:#a0aec0;font-size:14px">Email Verification</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px">
          <p style="margin:0 0 8px;color:#4a5568;font-size:16px">Hello <strong style="color:#131921">${name}</strong>,</p>
          <p style="margin:0 0 32px;color:#718096;font-size:15px;line-height:1.6">
            Welcome to OmniKart! Use the verification code below to complete your registration.
          </p>
          <!-- OTP Box -->
          <div style="background:#f7fafc;border:2px dashed #febd69;border-radius:12px;padding:28px;text-align:center;margin-bottom:32px">
            <p style="margin:0 0 8px;color:#718096;font-size:12px;text-transform:uppercase;letter-spacing:2px;font-weight:600">Your Verification Code</p>
            <div style="font-size:48px;font-weight:900;letter-spacing:16px;color:#131921;font-family:'Courier New',monospace;margin:8px 0">${otp}</div>
            <p style="margin:8px 0 0;color:#a0aec0;font-size:13px">⏱️ Valid for <strong>10 minutes</strong></p>
          </div>
          <!-- Demo Notice -->
          <div style="background:#fffbeb;border:1px solid #fbbf24;border-radius:8px;padding:16px;margin-bottom:24px">
            <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6">
              <strong>📌 Important Notice:</strong> This OTP has been generated for the <strong>final year academic project demo</strong> of OmniKart e-commerce platform. 
              This email is sent for educational and demonstration purposes only. 
              <strong>No misuse of this information will occur.</strong> 
              This is a student project and all data is handled responsibly.
            </p>
          </div>
          <p style="margin:0;color:#a0aec0;font-size:13px;line-height:1.6">
            If you didn't request this, please ignore this email. This code expires in 10 minutes.
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f7fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0">
          <p style="margin:0;color:#a0aec0;font-size:12px">© 2026 OmniKart · Final Year Project Demo · No commercial use</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
};

// ── STEP 1: Send OTP — POST /api/auth/send-otp ────────────────────────────────
exports.sendOTP = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate
    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }

    // Check if user already exists
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ message: "An account with this email already exists. Please sign in." });

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP (overwrite if resend)
    otpStore.set(email.toLowerCase(), { otp, name: name.trim(), password, expiresAt, attempts: 0 });

    // Send email
    await sendOTPEmail(email, name.trim(), otp);

    // Cleanup expired entries periodically
    for (const [key, val] of otpStore.entries()) {
      if (Date.now() > val.expiresAt) otpStore.delete(key);
    }

    return res.json({ message: "OTP sent successfully! Please check your email.", email });
  } catch (err) {
    console.error("Send OTP error:", err.message);
    if (err.message.includes("Invalid login") || err.message.includes("Username and Password")) {
      return res.status(500).json({ message: "Email service error. Please check GMAIL_USER and GMAIL_APP_PASSWORD in .env" });
    }
    return res.status(500).json({ message: "Failed to send OTP. Please try again." });
  }
};

// ── STEP 2: Verify OTP & Register — POST /api/auth/verify-otp ────────────────
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required" });

    const stored = otpStore.get(email.toLowerCase());

    // Checks
    if (!stored) return res.status(400).json({ message: "OTP expired or not found. Please request a new one." });
    if (Date.now() > stored.expiresAt) { otpStore.delete(email.toLowerCase()); return res.status(400).json({ message: "OTP has expired. Please request a new one." }); }

    stored.attempts += 1;
    if (stored.attempts > 5) { otpStore.delete(email.toLowerCase()); return res.status(400).json({ message: "Too many incorrect attempts. Please request a new OTP." }); }
    if (stored.otp !== otp.trim()) return res.status(400).json({ message: `Incorrect OTP. ${5 - stored.attempts} attempts remaining.` });

    // OTP correct — create user
    const user = await User.create({ name: stored.name, email: email.toLowerCase(), password: stored.password });
    otpStore.delete(email.toLowerCase());

    return res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (err) {
    console.error("Verify OTP error:", err.message);
    return res.status(500).json({ message: err.message });
  }
};

// ── Login ─────────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    res.json({ _id: user._id, name: user.name, email: user.email, role: user.role, token: generateToken(user._id) });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Register (fallback without OTP — keep for compatibility) ──────────────────
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { name, email, password } = req.body;
  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "User already exists" });
    const user = await User.create({ name, email, password });
    res.status(201).json({ _id: user._id, name: user.name, email: user.email, role: user.role, token: generateToken(user._id) });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// ── Profile ───────────────────────────────────────────────────────────────────
exports.getProfile = async (req, res) => { res.json(req.user); };

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    if (req.body.password) user.password = req.body.password;
    const updated = await user.save();
    res.json({ _id: updated._id, name: updated.name, email: updated.email, role: updated.role, token: generateToken(updated._id) });
  } catch (err) { res.status(500).json({ message: err.message }); }
};