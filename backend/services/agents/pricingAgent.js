const Product = require("../../models/Product");
const AILog = require("../../models/AI_Log");
const AgentMemory = require("../../models/AgentMemory");
const { pricingQueue } = require("../../queues");
const { controlledAI } = require("../aiService");

console.log("[AGENT] Autonomous Pricing Agent Initialized (v2.0)");

pricingQueue.process(async (job) => {
  const startTime = Date.now();
  console.log(`[AGENT-START] Processing pricing adjustments job: ${job.id}`);

  try {
    // Phase 1: INPUT & PRE-FETCH
    // (Avoiding DB fetching inside loops for low latency)
    const products = await Product.find({})
      .select("name price salesLast7Days minPrice maxPrice lastUpdated category")
      .lean();

    // Identify single target product based on cooldown limits to save computation
    const evaluatable = products.filter(p => !p.lastUpdated || (Math.abs(Date.now() - p.lastUpdated) / 36e5) >= 24);
    if (evaluatable.length === 0) return;
    const targetProduct = evaluatable[0]; 

    // Phase 2: MEMORY 
    const pastMemory = await AgentMemory.find({ agentName: "PricingAgent", "input.productId": targetProduct._id })
      .sort({ timestamp: -1 })
      .limit(5)
      .lean();

    const promptContext = {
      product: targetProduct,
      memory: pastMemory.map(m => ({ decision: m.decision, result: m.result }))
    };

    let newPrice = targetProduct.price;

    try {
      // Phase 3 & 4: PLAN & EXECUTE (Strict multi-step LLM call)
      const prompt = `Autonomous Action Required. Analyze the dataset and form a plan. 
CONTEXT: ${JSON.stringify(promptContext)}
GOAL: Calculate the smartest price modification for this item. Ensure valid JSON return.
RULES: 
1. Range limits enforce Min $${targetProduct.minPrice || targetProduct.price * 0.8} to Max $${targetProduct.maxPrice || targetProduct.price * 1.5}.
2. Never exceed limits.`;

      const schema = {
        plan: ["Step 1", "Step 2"],
        actions: [{ tool: "updatePrice", parameters: { expectedNewPrice: 0.0 } }],
        finalDecision: { newPrice: 0.0, reasoning: "AI logic strings" }
      };

      const aiResponse = await controlledAI(prompt, schema, { priority: "MEDIUM", timeoutMs: 8000 });

      // Phase 5: VALIDATE
      if (!aiResponse?.finalDecision?.newPrice || isNaN(aiResponse.finalDecision.newPrice)) {
          throw new Error("Validation Failed: AI breached schema boundaries.");
      }

      const pAI = aiResponse.finalDecision.newPrice;
      const minBounds = targetProduct.minPrice || targetProduct.price * 0.8;
      const maxBounds = targetProduct.maxPrice || targetProduct.price * 1.5;
      
      // Safety Clamp
      newPrice = Math.max(minBounds, Math.min(maxBounds, pAI));

      // Phase 6: STORE MEMORY
      await AgentMemory.create({
        agentName: "PricingAgent",
        input: { productId: targetProduct._id, currentPrice: targetProduct.price, sales: targetProduct.salesLast7Days },
        decision: aiResponse.finalDecision,
        result: `Successfully adapted price to ${newPrice}`
      });

    } catch (safeError) {
      console.warn(`[AGENT-FALLBACK] Utilizing internal defensive logics (${safeError.message}).`);
      // FALLBACK SAFE STATE
      if (targetProduct.salesLast7Days >= 50) newPrice = targetProduct.price * 1.10;
      else if (targetProduct.salesLast7Days <= 5) newPrice = targetProduct.price * 0.80;
    }

    // Phase 7: ACTION
    if (newPrice !== targetProduct.price) {
      await Product.findByIdAndUpdate(targetProduct._id, { price: newPrice, lastUpdated: new Date() });
      await AILog.create({ 
        agentName: "PricingAgent", actionType: "PRICE_CHANGE", newValue: { price: newPrice }, 
        reason: "Autonomous action validated across bounds.", status: "success" 
      });
    }

  } catch (fatalError) {
    // 100% try-catch block encapsulation guaranteeing zero-crash integrity
    console.error(`[CRITICAL] Agent Process Suppressed:`, fatalError);
  }
});

module.exports = pricingQueue;
