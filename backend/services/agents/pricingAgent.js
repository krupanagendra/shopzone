const Product = require("../../models/Product");
const AgentMemory = require("../../models/AgentMemory");
const { pricingQueue } = require("../../queues");

// Modular AI imports
const BaseAgent = require("../../ai/BaseAgent");
const { generatePricingPrompt } = require("../../ai/prompts/pricingPrompt");
const { parsePricingDecision } = require("../../ai/parsers/pricingParser");

/**
 * PricingAgent extends the standardized BaseAgent.
 * Handles gathering context, applying business logic boundaries, and delegating 
 * core execution to the BaseAgent lifecycle.
 */
class PricingAgent extends BaseAgent {
    constructor() {
        super("PricingAgent");
    }

    /**
     * Tool: Fetch Sales Analytics
     * Gathers relevant data to construct the context for Gemini AI.
     */
    async fetchSalesAnalytics(targetProduct) {
        let salesTrends = "Stable";
        if (targetProduct.salesLast7Days > 50) salesTrends = "Increasing rapidly";
        else if (targetProduct.salesLast7Days < 5) salesTrends = "Declining";

        const currentMonth = new Date().getMonth();
        const festivalIndicator = (currentMonth === 10 || currentMonth === 11);

        return {
            productId: targetProduct._id,
            productName: targetProduct.name,
            currentPrice: targetProduct.price,
            weeklySales: targetProduct.salesLast7Days || 0,
            stockCount: targetProduct.stock || targetProduct.countInStock || 100,
            festivalIndicator,
            competitorPrice: targetProduct.price * 1.05,
            salesTrends,
            coordinationNotes: "None"
        };
    }

    /**
     * Tool: Update Price
     * Takes the AI decision and computes the new price within safe boundaries.
     */
    updatePrice(targetProduct, decisionObj) {
        const { decision, percentage } = decisionObj;
        let newPrice = targetProduct.price;

        if (decision === 'increase') {
            newPrice = targetProduct.price * (1 + (percentage / 100));
        } else if (decision === 'decrease') {
            newPrice = targetProduct.price * (1 - (percentage / 100));
        }

        const minBounds = targetProduct.minPrice || targetProduct.price * 0.8;
        const maxBounds = targetProduct.maxPrice || targetProduct.price * 1.5;

        return Math.max(minBounds, Math.min(maxBounds, newPrice));
    }
    
    /**
     * Executes the main job logic, triggered by BullMQ.
     */
    async executeJob(job) {
        try {
            // Find evaluatable product
            const products = await Product.find({})
                .select("name price salesLast7Days minPrice maxPrice lastUpdated category countInStock stock")
                .lean();

            const evaluatable = products.filter(p => !p.lastUpdated || (Math.abs(Date.now() - p.lastUpdated) / 36e5) >= 24);
            if (evaluatable.length === 0) {
                console.log(`[AGENT-SKIP] [${this.agentName}] No evaluatable products found for job: ${job.id}`);
                return;
            }

            const targetProduct = evaluatable[0];
            console.log(`[AGENT-TARGET] [${this.agentName}] Selected product for AI evaluation: ${targetProduct.name}`);

            const contextData = await this.fetchSalesAnalytics(targetProduct);

            // BaseAgent automatically handles retries, parsing, and fallbacks cleanly.
            const result = await this.runLifecycle({
                jobId: job.id,
                contextData,
                promptGenerator: generatePricingPrompt,
                parser: parsePricingDecision,
                
                // Engage the coordinator
                conflictResolver: async (context, coordinator) => {
                    const recentStockMem = await coordinator.getRecentAgentDecision("StockAgent", context.productId, 24);
                    const isConflict = coordinator.detectDecisionConflict("increase_price", recentStockMem);
                    if (isConflict) {
                        context.coordinationNotes = `StockAgent recently restocked ${recentStockMem.decision.quantity} units. Moderate your price increases to prioritize clearing inventory.`;
                    }
                },
                
                // Executor for standard AI path
                toolExecutor: async (decisionObj) => {
                    const newPrice = this.updatePrice(targetProduct, decisionObj);
                    const aiReason = `AI Reasoning: ${decisionObj.reason}`;
                    const decisionType = decisionObj.decision;
                    
                    console.log(`[AGENT-EXECUTION] [${this.agentName}] Action: ${decisionType}, Change: ${decisionObj.percentage}%, New Price: $${newPrice}`);

                    return { newPrice, reason: aiReason, decisionType };
                },
                
                // Executor for fallback path
                fallbackExecutor: async () => {
                    let newPrice = targetProduct.price;
                    let aiReason = "";
                    let decisionType = "maintain (fallback)";

                    if (targetProduct.salesLast7Days >= 50) {
                        newPrice = targetProduct.price * 1.10;
                        aiReason = "Rule-based fallback: Sales > 50, increased price.";
                        decisionType = "increase (fallback)";
                    } else if (targetProduct.salesLast7Days <= 5) {
                        newPrice = targetProduct.price * 0.80;
                        aiReason = "Rule-based fallback: Sales < 5, decreased price.";
                        decisionType = "decrease (fallback)";
                    } else {
                        aiReason = "Rule-based fallback: Stable sales, maintaining price.";
                    }

                    console.log(`[AGENT-EXECUTION-FALLBACK] [${this.agentName}] Action: ${decisionType}, New Price: $${newPrice}`);
                    return { newPrice, reason: aiReason, decisionType };
                }
            });

            // Standardized final database mutation and audit logging
            const { newPrice, reason, decisionType } = result.finalResult;
            
            if (newPrice !== targetProduct.price) {
                await Product.findByIdAndUpdate(targetProduct._id, { price: newPrice, lastUpdated: new Date() });
                
                await this.logDecision({
                    actionType: "PRICE_CHANGE",
                    entityId: targetProduct._id,
                    onModel: "Product",
                    oldValue: { price: targetProduct.price, productName: targetProduct.name },
                    newValue: { price: newPrice, decisionType },
                    reason: reason
                });
            }

        } catch (fatalError) {
            console.error(`[CRITICAL] [${this.agentName}] Agent Process Suppressed:`, fatalError);
        }
    }
}

// Instantiate and bind directly to BullMQ worker
const pricingAgentInstance = new PricingAgent();

pricingQueue.process(async (job) => {
    await pricingAgentInstance.executeJob(job);
});

module.exports = pricingQueue;
