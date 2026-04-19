const Suggestion = require("../models/Suggestion");

// @desc    Create new product suggestion
// @route   POST /api/suggestions
// @access  Public
exports.createSuggestion = async (req, res) => {
  try {
    const { productName, category, description, expectedPrice, referenceLink, customerEmail } = req.body;

    // Save suggestion to MongoDB
    const suggestion = await Suggestion.create({
      productName,
      category,
      description,
      expectedPrice,
      referenceLink,
      customerEmail,
    });

    res.status(201).json({
      success: true,
      message: "Thank you! Your suggestion has been received and will be considered shortly by our team.",
      data: suggestion,
    });
  } catch (error) {
    console.error("Suggestion Error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to submit suggestion",
    });
  }
};

// @desc    Get all suggestions
// @route   GET /api/suggestions
// @access  Private/Admin
exports.getSuggestions = async (req, res) => {
  try {
    const suggestions = await Suggestion.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: suggestions.length,
      data: suggestions,
    });
  } catch (error) {
    console.error("Fetch Suggestions Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// @desc    Update suggestion status
// @route   PATCH /api/suggestions/:id
// @access  Private/Admin
exports.updateSuggestionStatus = async (req, res) => {
  try {
    const suggestion = await Suggestion.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status || "reviewed" },
      { new: true, runValidators: true }
    );

    if (!suggestion) {
      return res.status(404).json({
        success: false,
        message: "Suggestion not found",
      });
    }

    res.status(200).json({
      success: true,
      data: suggestion,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
