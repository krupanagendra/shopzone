const express = require('express');
const router = express.Router();
const UserProfile = require('../models/UserProfile');
const Product = require('../models/Product');
const { getLiveStats, getAnalytics, controlledAI } = require('../services/aiService');

// 1. GET /api/ai/analytics (DASHBOARD)
router.get('/analytics', (req, res) => {
  res.json(getAnalytics());
});

// 2. GET /api/debug/ai-live (REAL-TIME WS/POLL)
router.get('/live-status', (req, res) => {
  res.json(getLiveStats());
});

// 3. POST /api/ai/recommend (PERSONALIZATION)
router.post('/recommend', async (req, res) => {
  const { userId } = req.body;
  
  try {
    const profile = await UserProfile.findOne({ user: userId }).populate('viewedProducts', 'name category price').lean();
    if (!profile) return res.json({ recommendations: [] });

    const context = {
      viewed: profile.viewedProducts.map(p => p.name),
      categories: profile.purchasedCategories
    };

    const prompt = `AI Personalization Engine. Context: ${JSON.stringify(context)}. 
Extract top category interests and output logic logic flow.`;

    const schema = {
      plan: ["Analyze history", "Compute cluster"],
      actions: [{ tool: "getGenericProducts", parameters: { "categorySearch": "string" } }],
      finalDecision: { recommendedCategories: ["string"], reason: "string" }
    };

    const aiRes = await controlledAI(prompt, schema, { priority: "HIGH" });
    const recommendedCats = aiRes.finalDecision.recommendedCategories;
    
    // Convert AI predicted categories back to DB products
    const products = await Product.find({ category: { $in: recommendedCats } }).limit(4).lean();
    res.json({ recommendations: products, reasoning: aiRes.finalDecision.reason });

  } catch (error) {
    // Graceful fallback natively inside API
    const defaultData = await Product.find().sort({ salesLast7Days: -1 }).limit(4);
    res.json({ recommendations: defaultData, reasoning: "Fallback to trending items." });
  }
});

module.exports = router;
