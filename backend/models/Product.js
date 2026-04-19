const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    photos: [{ type: String }],          // Cloudinary URLs for review photos
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    brand: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0 },
    image: { type: String, required: true },
    countInStock: { type: Number, required: true, default: 0 },
    reviews: [reviewSchema],
    isFeatured: { type: Boolean, default: false },
    // AI Agent fields
    salesLast7Days: { type: Number, default: 0 },
    minPrice: { type: Number },
    maxPrice: { type: Number },
    lastUpdated: { type: Date },
    offer: { type: String, default: "" },
  },
  { timestamps: true }
);

productSchema.index({ name: "text", description: "text", brand: "text" });
productSchema.index({ salesLast7Days: -1 });

module.exports = mongoose.model("Product", productSchema);