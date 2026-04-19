const express = require("express");
const router = express.Router();
const adminAgent = require("../services/agents/adminAgent");
const AILog = require("../models/AI_Log");
// const { protect, admin } = require("../middleware/auth"); // Can add later, keeping raw for testing

router.post("/query", adminAgent);

router.get("/logs", async (req, res) => {
  try {
    const logs = await AILog.find().sort({ timestamp: -1 }).limit(100);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

module.exports = router;
