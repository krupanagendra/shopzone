const mongoose = require("mongoose");

const aiLogSchema = new mongoose.Schema({
  agentName: {
    type: String,
    required: true,
  },
  actionType: {
    type: String,
    required: true,
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "onModel"
  },
  onModel: {
    type: String,
    enum: ["Product", "Order", "User"]
  },
  oldValue: {
    type: mongoose.Schema.Types.Mixed,
  },
  newValue: {
    type: mongoose.Schema.Types.Mixed,
  },
  reason: {
    type: String,
  },
  status: {
    type: String,
    enum: ["success", "failure", "pending"],
    default: "success"
  },
  timestamp: {
    type: Date,
    default: Date.now,
  }
});

aiLogSchema.index({ timestamp: -1 });
aiLogSchema.index({ agentName: 1, timestamp: -1 });

module.exports = mongoose.model("AI_Log", aiLogSchema);
