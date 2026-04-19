const express = require("express");
const router = express.Router();
const controller = require("../controllers/chatbotController");
const { protect } = require("../middleware/auth");

// All routes protected — user must be logged in
router.use(protect);

// ── Main chat endpoint ────────────────────────────────────────────────────
// POST /api/chatbot/message
// Body: { message: string, sessionId: string }
router.post("/message", controller.sendMessage);

// ── Translation endpoint ──────────────────────────────────────────────────
// POST /api/chatbot/translate
// Body: { text: string }
router.post("/translate", controller.translate);

// ── Chat history endpoint ─────────────────────────────────────────────────
// GET /api/chatbot/history?sessionId=xxx
router.get("/history", controller.getHistory);

// ── Escalate to human support ─────────────────────────────────────────────
// POST /api/chatbot/escalate
// Body: { sessionId: string }
router.post("/escalate", controller.escalate);

module.exports = router;