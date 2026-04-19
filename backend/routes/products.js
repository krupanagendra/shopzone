const express = require("express");
const router = express.Router();
const { getProducts, getProductById, createProduct, updateProduct, deleteProduct, createReview, getCategories, getFeaturedProducts, getSimilarProducts, getReviewSummary } = require("../controllers/productController");
const { protect, admin } = require("../middleware/auth");
const upload = require("../middleware/upload");

router.get("/", getProducts);
router.get("/categories", getCategories);
router.get("/featured", getFeaturedProducts);
router.get("/:id", getProductById);
router.post("/", protect, admin, upload.single("image"), createProduct);
router.put("/:id", protect, admin, upload.single("image"), updateProduct);
router.delete("/:id", protect, admin, deleteProduct);
router.post("/:id/reviews", protect, (req, res, next) => {
    // Accept multipart (with photos) OR JSON (without photos)
    const ct = req.headers["content-type"] || "";
    if (ct.includes("multipart/form-data")) {
        upload.array("photos", 3)(req, res, next);
    } else {
        next();
    }
}, createReview);
router.get("/:id/similar", getSimilarProducts);
router.get("/:id/review-summary", getReviewSummary);

module.exports = router;