const mongoose = require("mongoose");

// ── Chat message schema ────────────────────────────────────────────────────
const messageSchema = new mongoose.Schema({
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    intent: { type: String, default: null }, // detected intent
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }], // products shown
});

// ── Chat session schema ────────────────────────────────────────────────────
const chatHistorySchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        sessionId: { type: String, required: true },
        messages: [messageSchema],
        isResolved: { type: Boolean, default: false },    // resolved or escalated
        escalated: { type: Boolean, default: false },    // escalated to human
        language: { type: String, default: "en" },
        totalTokens: { type: Number, default: 0 },
    },
    { timestamps: true }
);

// Index for fast user session lookup
chatHistorySchema.index({ user: 1, sessionId: 1 });
chatHistorySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("ChatHistory", chatHistorySchema);