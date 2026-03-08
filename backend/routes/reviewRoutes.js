const express = require("express");
const router = express.Router();
const { addReview, deleteReview } = require("../controllers/reviewController");
const { protect, admin } = require("../middleware/authMiddleware");

router.post("/:productId", protect, addReview);
router.delete("/:productId/:reviewId", protect, admin, deleteReview);

module.exports = router;
