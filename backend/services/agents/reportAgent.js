const Order = require("../../models/Order");
const User = require("../../models/User");
const AILog = require("../../models/AI_Log");
const AgentMemory = require("../../models/AgentMemory");
const { reportQueue } = require("../../queues");
const { controlledAI } = require("../aiService");
const { executeTool } = require("../aiTools");
const { generateReport } = require("../../utils/pdfGenerator");
const { sendDailyReportEmail } = require("../../utils/emailService");

console.log("[AGENT] Autonomous Report Agent Ready");

// ─────────────────────────────────────────────────────────────────────────────
//  CORE REPORT LOGIC — extracted so it can be called directly (without Redis)
//  OR via the Bull queue processor below.
// ─────────────────────────────────────────────────────────────────────────────
const runDailyReport = async () => {
  console.log("[AGENT-START] Generating autonomous strategic report...");

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
      historicStrategy: pastMemory.map(m => m.decision?.recommendations || [])
    };

    let reportInsights = { summary: "Operations normal.", recommendations: ["Maintain current pacing."] };

    try {
      // 3. AI PLANNING & REASONING
      const prompt = `Autonomous Analytics Core.
CONTEXT: ${JSON.stringify(promptContext)}
Analyze historic strategies vs current week data.
Generate a strategic plan, initiate report data aggregation tools, and output clear strategic directions.`;

      const schema = {
        plan: ["Observation", "Deduction", "Action Plan"],
        actions: [{ tool: "generateReportData", parameters: { target: "admin" } }],
        finalDecision: { summary: "Executive text", recommendations: ["string"] }
      };

      const aiResponse = await controlledAI(prompt, schema, { priority: "LOW" });

      // 4. TOOL EXECUTION
      for (const action of aiResponse.actions || []) {
        await executeTool(action);
      }

      // 5. VALIDATION
      if (!aiResponse.finalDecision?.summary) throw new Error("AI Validation Error: missing summary.");
      reportInsights = aiResponse.finalDecision;

      // 6. STORE MEMORY
      await AgentMemory.create({
        agentName: "ReportAgent",
        input: { metrics: salesMetrics },
        decision: reportInsights,
        result: "Successfully formulated and executed strategy."
      });

    } catch (aiError) {
      // Graceful fallback: AI is offline but we still send a report
      console.warn(`[AGENT-FALLBACK] AI offline — sending static report. Reason: ${aiError.message}`);
      reportInsights = {
        summary: `Weekly Revenue: ₹${salesMetrics.revenue || 0} | Orders: ${salesMetrics.orders || 0}`,
        recommendations: ["Maintain current pacing.", "Monitor inventory levels."]
      };
    }

    // 7. GENERATE FULL PDF REPORT & EMAIL
    console.log("[AGENT] Compiling PDF and dispatching email...");
    const reportData = {
      revenue: salesMetrics.revenue || 0,
      totalSales: salesMetrics.orders || 0,
      totalUsers: await User.countDocuments(),
      charts: [],
      tables: [],
      suggestions: reportInsights.recommendations
    };

    // Fetch chart image (non-blocking)
    try {
      const quickChartUrl = `https://quickchart.io/chart?c={type:'bar',data:{labels:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],datasets:[{label:'Sales',data:[12,19,3,5,2,3,9]}]}}`;
      const chartRes = await fetch(quickChartUrl);
      if (chartRes.ok) {
        const buffer = await chartRes.arrayBuffer();
        reportData.charts.push({ title: "Weekly Trend", buffer: Buffer.from(buffer) });
      }
    } catch (chartErr) {
      console.warn("[AGENT] Chart fetch failed (skipping chart):", chartErr.message);
    }

    const pdfBuffer = await generateReport(reportData);
    await sendDailyReportEmail(pdfBuffer, reportData);
    console.log("[AGENT] ✅ Daily report successfully delivered to Admin.");

    // 8. LOG
    await AILog.create({
      agentName: "ReportAgent",
      actionType: "STRATEGY_GENERATED",
      newValue: reportInsights,
      reason: "Autonomous daily pipeline complete",
      status: "success"
    });

  } catch (fatalError) {
    console.error("[CRITICAL] Report pipeline failed:", fatalError.message);
    // Still try to log the failure
    try {
      await AILog.create({
        agentName: "ReportAgent",
        actionType: "STRATEGY_GENERATED",
        newValue: { summary: "Pipeline failed", recommendations: [] },
        reason: fatalError.message,
        status: "failed"
      });
    } catch (_) {}
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  BULL QUEUE PROCESSOR — used when Redis IS available
// ─────────────────────────────────────────────────────────────────────────────
reportQueue.process(async (job) => {
  await runDailyReport();
});

module.exports = { reportQueue, runDailyReport };
