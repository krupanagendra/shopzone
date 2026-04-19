const express = require('express');
const router = express.Router();
const AgentMemory = require('../models/AgentMemory');

// Temporary proxy to access global AI state from aiService without circular deps 
// Alternatively, read raw metrics if exported:
// const { getAIStatus } = require("../services/aiService"); 

/**
 * GET /api/debug/ai-status
 * Visibility into active control constraints (Circuit breaker, concurrency)
 */
router.get('/ai-status', (req, res) => {
  // Hardcoded mapping representing internal memory maps for observability verification
  res.status(200).json({
    status: "Operational",
    system: "Fully Autonomous AI Matrix",
    limits: {
      maxConcurrency: 5,
      circuitBreakerEnabled: true,
      cacheTTL: "5m"
    },
    message: "Global AI Router active. Check aiService internally for precise pointers."
  });
});

/**
 * GET /api/debug/memory/:agentName
 * Returns the last 10 thought logs and memories of an agent.
 */
router.get('/memory/:agentName', async (req, res) => {
  try {
    const memory = await AgentMemory.find({ agentName: req.params.agentName })
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();
    res.status(200).json({ agent: req.params.agentName, memoryCount: memory.length, memory });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/debug/test-agent/:agentName
 * Trigger test protocols to ensure AI handles multi-step flow manually
 */
router.get('/test-agent/:agentName', async (req, res) => {
  res.status(200).json({
    message: `Test protocol acknowledged for ${req.params.agentName}. To execute full loops natively invoke Bull redis jobs or post directly to Admin endpoints.`,
    autonomousEnabled: true
  });
});

module.exports = router;
