const Product = require("../../models/Product");
const AgentMemory = require("../../models/AgentMemory");
const { stockQueue } = require("../../queues");

// Modular AI imports
const BaseAgent = require("../../ai/BaseAgent");
const { generateStockPrompt } = require("../../ai/prompts/stockPrompt");
const { parseStockDecision } = require("../../ai/parsers/stockParser");

/**
 * StockAgent extends the standardized BaseAgent.
 * Evaluates inventory bounds and autonomously restocks via AI or fallback.
 */
class StockAgent extends BaseAgent {
    constructor() {
        super("StockAgent");
    }

    /**
     * Tool: Fetch Inventory Context
     * Gathers relevant data to construct the context for Gemini AI.
     */
    async fetchInventoryContext(targetProduct) {
        const currentMonth = new Date().getMonth();
        // Nov/Dec are high-demand festival months
        const festivalIndicator = (currentMonth === 10 || currentMonth === 11);

        return {
            productId: targetProduct._id,
            productName: targetProduct.name,
            currentStock: targetProduct.countInStock || 0,
            weeklySales: targetProduct.salesLast7Days || 0,
            festivalIndicator
        };
    }

    /**
     * Tool: Update Stock
     * Takes the AI decision and computes the new inventory safely.
     */
    updateStock(targetProduct, decisionObj) {
        const { decision, quantity } = decisionObj;
        let newStock = targetProduct.countInStock || 0;

        if (decision === 'restock') {
            newStock += quantity;
        }

        return newStock;
    }
    
    /**
     * Executes the main job logic, triggered by BullMQ.
     */
    async executeJob(job) {
        try {
            // Find products that are running low in stock (< 100)
            const products = await Product.find({ countInStock: { $lt: 100 } })
                .select("name countInStock salesLast7Days lastUpdated category")
                .lean();

            if (products.length === 0) {
                console.log(`[AGENT-SKIP] [${this.agentName}] No low stock products found for job: ${job.id}`);
                return;
            }

            // Pick the first target product to avoid overwhelming the system
            const targetProduct = products[0];
            console.log(`[AGENT-TARGET] [${this.agentName}] Selected product for AI evaluation: ${targetProduct.name}`);

            const contextData = await this.fetchInventoryContext(targetProduct);

            // BaseAgent automatically handles retries, parsing, and fallbacks cleanly.
            const result = await this.runLifecycle({
                jobId: job.id,
                contextData,
                promptGenerator: generateStockPrompt,
                parser: parseStockDecision,
                
                // Executor for standard AI path
                toolExecutor: async (decisionObj) => {
                    const newStock = this.updateStock(targetProduct, decisionObj);
                    const aiReason = `AI Reasoning: ${decisionObj.reason}`;
                    const decisionType = decisionObj.decision;
                    
                    console.log(`[AGENT-EXECUTION] [${this.agentName}] Action: ${decisionType}, Quantity added: ${decisionObj.quantity}, New Stock: ${newStock}`);

                    return { newStock, reason: aiReason, decisionType };
                },
                
                // Executor for fallback path
                fallbackExecutor: async () => {
                    let newStock = targetProduct.countInStock || 0;
                    let aiReason = "";
                    let decisionType = "maintain (fallback)";

                    // Fallback logic
                    if (targetProduct.countInStock < 20) {
                        // Hardcoded default fallback restock amount
                        newStock += 100;
                        aiReason = "Rule-based fallback: Stock critically low (<20), adding 100 default.";
                        decisionType = "restock (fallback)";
                    } else {
                        aiReason = "Rule-based fallback: Stock adequate, maintaining.";
                    }

                    console.log(`[AGENT-EXECUTION-FALLBACK] [${this.agentName}] Action: ${decisionType}, New Stock: ${newStock}`);
                    return { newStock, reason: aiReason, decisionType };
                }
            });

            // Standardized final database mutation and audit logging
            const { newStock, reason, decisionType } = result.finalResult;
            
            if (newStock !== targetProduct.countInStock) {
                await Product.findByIdAndUpdate(targetProduct._id, { countInStock: newStock });
                
                await this.logDecision({
                    actionType: "STOCK_REPLENISH",
                    entityId: targetProduct._id,
                    onModel: "Product",
                    oldValue: { stock: targetProduct.countInStock, productName: targetProduct.name },
                    newValue: { stock: newStock, decisionType },
                    reason: reason
                });
            }

        } catch (fatalError) {
            console.error(`[CRITICAL] [${this.agentName}] Agent Process Suppressed:`, fatalError);
        }
    }
}

// Instantiate and bind directly to BullMQ worker
const stockAgentInstance = new StockAgent();

stockQueue.process(async (job) => {
    await stockAgentInstance.executeJob(job);
});

module.exports = stockQueue;
