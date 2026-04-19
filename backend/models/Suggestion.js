const mongoose = require("mongoose");

const suggestionSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: [true, "Product name is required"],
    trim: true,
  },
  category: {
    type: String,
    required: [true, "Category is required"],
    trim: true,
  },
  description: {
    type: String,
    required: [true, "Description is required"],
    trim: true,
  },
  expectedPrice: {
    type: Number,
    required: [true, "Expected price is required"],
  },
  referenceLink: {
    type: String,
    trim: true,
  },
  customerEmail: {
    type: String,
    required: [true, "Customer email is required"],
    lowercase: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ["pending", "reviewed"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Suggestion", suggestionSchema);
