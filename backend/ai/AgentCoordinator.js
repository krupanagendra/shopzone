const AgentMemory = require("../models/AgentMemory");

/**
 * AgentCoordinator: A lightweight communication layer for multi-agent synchronization.
 * Facilitates shared short-term memory and prevents conflicting decisions across agents.
 */
class AgentCoordinator {
    /**
     * Publishes a decision summary to the shared memory (MongoDB).
     */
    async publishDecisionSummary({ agentName, productId, decisionObj, reasoningSummary }) {
        try {
            console.log(`[AGENT-SHARED-MEMORY] [${agentName}] Publishing decision summary to memory bank for product ${productId}.`);
            
            await AgentMemory.create({
                agentName,
                input: { productId },
                decision: decisionObj,
                result: reasoningSummary
            });
            
        } catch (error) {
            console.error(`[AGENT-COORDINATION-ERROR] Failed to publish memory: ${error.message}`);
        }
    }

    /**
     * Retrieves recent decisions from other agents for a specific product.
     * Uses a short-term window (e.g., last 24 hours).
     */
    async getRecentAgentDecision(agentName, productId, hours = 24) {
        try {
            console.log(`[AGENT-SHARED-MEMORY] Requesting recent decisions from ${agentName} for product ${productId}.`);
            const cutoffTime = new Date(Date.now() - hours * 3600000);

            const memory = await AgentMemory.findOne({
                agentName: agentName,
                "input.productId": productId,
                timestamp: { $gte: cutoffTime }
            }).sort({ timestamp: -1 }).lean();

            return memory || null;
        } catch (error) {
            console.error(`[AGENT-COORDINATION-ERROR] Failed to fetch recent decision: ${error.message}`);
            return null;
        }
    }

    /**
     * Detects logical conflicts based on the retrieved memories.
     * Prevents agents from acting against each other (e.g. StockAgent restocking while PricingAgent spikes prices causing a sales crash).
     */
    detectDecisionConflict(intendedAction, otherAgentMemory) {
        console.log(`[AGENT-CONFLICT-CHECK] Analyzing potential cross-agent conflicts...`);
        
        if (!otherAgentMemory) return false;

        // Specific Coordination Scenario: Pricing vs Stock
        if (intendedAction === "increase_price" && otherAgentMemory.agentName === "StockAgent") {
            const stockDecision = otherAgentMemory.decision?.decision;
            if (stockDecision === "restock") {
                console.log(`[AGENT-COORDINATION] Conflict detected! StockAgent recently restocked. Sending moderation signal to PricingAgent.`);
                return true;
            }
        }

        return false;
    }
}

// Export a singleton instance
module.exports = new AgentCoordinator();
