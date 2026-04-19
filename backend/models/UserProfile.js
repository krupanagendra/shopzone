const mongoose = require("mongoose");

const userProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  viewedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  purchasedCategories: [{ type: String }],
  lastActive: { type: Date, default: Date.now }
});

module.exports = mongoose.model("UserProfile", userProfileSchema);
