const mongoose = require("mongoose");

const agentMemorySchema = new mongoose.Schema({
  agentName: { type: String, required: true, index: true },
  input: { type: Object, required: true },
  decision: { type: Object, required: true },
  result: { type: String, required: true },
  performanceScore: { type: Number, default: null }, // Used by AI to learn from strategies
  timestamp: { type: Date, default: Date.now, index: -1 }
});

module.exports = mongoose.model("AgentMemory", agentMemorySchema);
