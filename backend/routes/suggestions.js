const express = require("express");
const router = express.Router();
const {
  createSuggestion,
  getSuggestions,
  updateSuggestionStatus,
} = require("../controllers/suggestionController");
const { protect, admin } = require("../middleware/auth");

router.route("/")
  .post(createSuggestion)
  .get(protect, admin, getSuggestions);

router.route("/:id")
  .patch(protect, admin, updateSuggestionStatus);

module.exports = router;
