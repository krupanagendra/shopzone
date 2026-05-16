const AILog = require("../models/AI_Log");
const { generateContent } = require("./geminiClient");
const coordinator = require("./AgentCoordinator");

/**
 * BaseAgent: A standardized, reusable framework for autonomous AI agents.
 * Provides a unified lifecycle, retry logic, error handling, and audit logging.
 */
class BaseAgent {
    constructor(agentName) {
        this.agentName = agentName;
        this.coordinator = coordinator; // Expose coordinator to subclasses
    }

    /**
     * Executes an AI request with retries and exponential backoff.
     */
    async executeWithRetries(prompt, retries = 3, delay = 1000) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                console.log(`[AGENT-REASONING] [${this.agentName}] Attempt ${attempt} to interact with Gemini API.`);
                const rawResponse = await generateContent(prompt);
                console.log(`[AGENT-REASONING] [${this.agentName}] Gemini Response successfully received.`);
                return rawResponse;
            } catch (error) {
                console.error(`[AGENT-REASONING-ERROR] [${this.agentName}] Attempt ${attempt} failed: ${error.message}`);
                if (attempt === retries) throw error;
                // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, delay * attempt));
            }
        }
    }

    /**
     * Standardized Execution Lifecycle.
     * Ensures all agents follow the same structural flow: 
     * Gather Context -> Coordination -> Generate Prompt -> Execute AI -> Parse JSON -> Execute Tool -> Publish -> Fallback
     */
    async runLifecycle({ jobId, contextData, promptGenerator, parser, toolExecutor, fallbackExecutor, conflictResolver = null }) {
        const startTime = Date.now();
        console.log(`[AGENT-START] [${this.agentName}] Processing job: ${jobId}`);

        let decisionObj = null;
        let finalResult = null;
        let usedFallback = false;

        try {
            // Optional: Cross-Agent Context Sharing before prompt generation
            if (conflictResolver) {
                console.log(`[AGENT-COORDINATION] [${this.agentName}] Engaging AgentCoordinator to resolve multi-agent context.`);
                await conflictResolver(contextData, this.coordinator);
            }

            // 1. Prompt Generation
            const prompt = promptGenerator(contextData);

            // 2. AI Inference
            const rawResponse = await this.executeWithRetries(prompt);

            // 3. Parser Validation
            console.log(`[AGENT-PARSER] [${this.agentName}] Validating AI decision format.`);
            decisionObj = parser(rawResponse);

            // 4. Tool Execution
            console.log(`[AGENT-EXECUTION] [${this.agentName}] Executing validated AI decision.`);
            finalResult = await toolExecutor(decisionObj);

            // Publish decision to Shared Memory automatically
            if (contextData.productId) {
                await this.coordinator.publishDecisionSummary({
                    agentName: this.agentName,
                    productId: contextData.productId,
                    decisionObj: decisionObj,
                    reasoningSummary: `Action completed successfully: ${decisionObj.decision}`
                });
            }

        } catch (error) {
            // 5. Fallback Handling
            console.warn(`[AGENT-FALLBACK] [${this.agentName}] AI execution sequence failed (${error.message}). Activating fallback defensive logic.`);
            usedFallback = true;
            finalResult = await fallbackExecutor();
        }

        console.log(`[AGENT-END] [${this.agentName}] Job ${jobId} completed in ${Date.now() - startTime}ms.`);
        
        return {
            decisionObj,
            finalResult,
            usedFallback
        };
    }

    /**
     * Standardized AI Audit Logging.
     */
    async logDecision({ actionType, entityId, onModel, oldValue, newValue, reason, status = "success" }) {
        await AILog.create({
            agentName: this.agentName,
            actionType,
            entityId,
            onModel,
            oldValue,
            newValue,
            reason,
            status,
            timestamp: new Date()
        });
    }
}

module.exports = BaseAgent;
