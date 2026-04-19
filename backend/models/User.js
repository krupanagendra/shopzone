const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    avatar: { type: String, default: "" },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],

    // Prime
    isPremium: { type: Boolean, default: false },
    primeTier: { type: String, enum: ["silver", "gold", "platinum"], default: null },
    premiumSince: { type: Date, default: null },

    // Scratch card
    scratchCardUsed: { type: Boolean, default: false },  // one-time per user
    scratchCoupon: { type: String, default: null },  // coupon code awarded
    scratchDiscount: { type: Number, default: 0 },  // % discount awarded

    // Referral system
    referralCode: { type: String, unique: true, sparse: true }, // user's own code
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    referralCount: { type: Number, default: 0 },     // how many they referred
    referralCredits: { type: Number, default: 0 },     // ₹ credits earned
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  // Auto-generate referral code on first save
  if (!this.referralCode) {
    this.referralCode = (this.name.slice(0, 4).toUpperCase().replace(/[^A-Z]/g, "X") +
      Math.random().toString(36).slice(2, 6).toUpperCase());
  }
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = async function (pw) {
  return bcrypt.compare(pw, this.password);
};

module.exports = mongoose.model("User", userSchema);