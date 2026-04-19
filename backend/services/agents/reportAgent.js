const Order = require("../../models/Order");
const AILog = require("../../models/AI_Log");
const AgentMemory = require("../../models/AgentMemory");
const { reportQueue } = require("../../queues");
const { controlledAI } = require("../aiService");
const { executeTool } = require("../aiTools");

console.log("[AGENT] Autonomous Report Agent Ready");

reportQueue.process(async (job) => {
  const startTime = Date.now();
  console.log(`[AGENT-START] Generating autonomous strategic report...`);

  try {
    // 1. INPUT & CONTEXT BUILD
    const salesMetrics = await executeTool({ tool: "fetchSalesData", parameters: { days: 7 } });
    
    // 2. MEMORY FETCH
    const pastMemory = await AgentMemory.find({ agentName: "ReportAgent" })
      .sort({ timestamp: -1 })
      .limit(5)
      .lean();

    const promptContext = {
      liveMetrics: salesMetrics,
      historicStrategy: pastMemory.map(m => m.decision.recommendations)
    };

    let reportInsights = { summary: "Operations normal.", recommendations: [] };

    try {
      // 3. AI PLANNING & REASONING 
      const prompt = `Autonomous Analytics Core.
CONTEXT: ${JSON.stringify(promptContext)}
Analyze historic strategies vs current week data. 
Generate a strategic plan, initiate report data aggregation tools, and output clear strategic directions.`;

      const schema = {
        plan: ["Observation", "Deduction", "Action Plan"],
        actions: [{ tool: "generateReportData", parameters: { target: "admin" } }, { tool: "sendEmail", parameters: { template: "report" } }],
        finalDecision: { summary: "Executive text", recommendations: ["string"] }
      };

      const aiResponse = await controlledAI(prompt, schema, { priority: "LOW" });

      // 4. TOOL EXECUTION 
      for (const action of aiResponse.actions || []) {
         await executeTool(action); 
      }

      // 5. VALIDATION
      if (!aiResponse.finalDecision.summary) throw new Error("Validation Error.");
      reportInsights = aiResponse.finalDecision;

      // 6. STORE MEMORY
      await AgentMemory.create({
        agentName: "ReportAgent",
        input: { metrics: salesMetrics },
        decision: reportInsights,
        result: `Successfully formulated and executed strategy.`
      });

    } catch (aiError) {
      console.warn(`[AGENT-FALLBACK] Report Agent Offline. Triggering static report.`);
      // FALLBACK RULE
      reportInsights = { summary: `Total Revenue: $${salesMetrics.revenue}`, recommendations: ["Maintain current pacing."] };
    }

    await AILog.create({ agentName: "ReportAgent", actionType: "STRATEGY_GENERATED", newValue: reportInsights, reason: "Autonomous pipeline complete", status: "success" });

  } catch (fatalError) {
    console.error(`[CRITICAL] Report Process Suppressed:`, fatalError);
  }
});

module.exports = reportQueue;
