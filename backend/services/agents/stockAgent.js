const Product = require("../../models/Product");
const AILog = require("../../models/AI_Log");
const AgentMemory = require("../../models/AgentMemory");
const { stockQueue } = require("../../queues");
const { controlledAI } = require("../aiService");
const { executeTool } = require("../aiTools");

console.log("[AGENT] Autonomous Stock Agent Enrolled In Queue");

stockQueue.process(async (job) => {
  const startTime = Date.now();
  console.log(`[AGENT-START] Processing autonomous stock allocations...`);

  try {
    // 1. INPUT & CONTEXT BUILD
    const inventoryData = await executeTool({ tool: "getLowStockProducts", parameters: { threshold: 100 } });
    if (!inventoryData.products || inventoryData.products.length === 0) return;

    // Pick top target to process autonomously to avoid overwhelming prompt
    const targetProduct = inventoryData.products[0];

    // 2. MEMORY FETCH
    const pastMemory = await AgentMemory.find({ agentName: "StockAgent", "input.productId": targetProduct._id })
      .sort({ timestamp: -1 })
      .limit(5)
      .lean();

    const promptContext = {
      product: targetProduct,
      recentDecisions: pastMemory.map(m => ({ decision: m.decision, result: m.result }))
    };

    let newStock = targetProduct.countInStock;

    try {
      // 3. AI PLANNING & REASONING (Multi-step)
      const prompt = `Autonomous Stock Manager Node.
Context: ${JSON.stringify(promptContext)}
Action: Decide the precise inventory restock integer based on sales velocity and memory.
Rule: Zero sales should restock to minimum safe bounds (100). High sales should double buffer.`;

      const schema = {
        plan: ["Logic sequence string", "Additional context observation"],
        actions: [{ tool: "updateStock", parameters: { productId: "string", newStock: 0 } }],
        finalDecision: { recommendedStock: 0, strategyReason: "string" }
      };

      const aiResponse = await controlledAI(prompt, schema, { priority: "MEDIUM" });

      // 4. TOOL EXECUTION (Iterate through chosen actions)
      if (aiResponse.actions && aiResponse.actions.length > 0) {
        for (const action of aiResponse.actions) {
           await executeTool(action); // Actually performs the tool logic
        }
      }

      // 5. VALIDATION
      if (!aiResponse.finalDecision.recommendedStock || isNaN(aiResponse.finalDecision.recommendedStock)) {
        throw new Error("Validation Failed: AI failed to structure valid stock numbers.");
      }
      newStock = aiResponse.finalDecision.recommendedStock;

      // 6. STORE MEMORY
      await AgentMemory.create({
        agentName: "StockAgent",
        input: { productId: targetProduct._id, currentStock: targetProduct.countInStock, sales: targetProduct.salesLast7Days },
        decision: aiResponse.finalDecision,
        result: `Autonomously modified inventory to ${newStock} via plan execution.`
      });

    } catch (aiError) {
      console.warn(`[AGENT-FALLBACK] Utilizing internal defensive stock logic (${aiError.message}).`);
      // FALLBACK RULE: Absolute safe floor
      newStock = 100;
    }

    // Direct Action applied securely if action wrapper missed or during fallback
    if (newStock !== targetProduct.countInStock) {
      await Product.findByIdAndUpdate(targetProduct._id, { countInStock: newStock });
      await AILog.create({ agentName: "StockAgent", actionType: "AI_RESTOCK", newValue: { stock: newStock }, reason: "Autonomous execution.", status: "success" });
    }

  } catch (fatalError) {
    console.error(`[CRITICAL] Stock Process Suppressed:`, fatalError);
  }
});

module.exports = stockQueue;
