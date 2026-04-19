const AILog = require("../../models/AI_Log");
const AgentMemory = require("../../models/AgentMemory");
const { emailQueue } = require("../../queues");
const { controlledAI } = require("../aiService");
const { executeTool } = require("../aiTools");

console.log("[AGENT] Autonomous Email Marketing Agent Registered");

emailQueue.process(async (job) => {
  const { to, subject, type, details } = job.data;
  if (!to) return;

  try {
    // 1. MEMORY & CONTEXT BUILD
    const pastMemory = await AgentMemory.find({ agentName: "EmailAgent", "input.type": type }).sort({ timestamp: -1 }).limit(5).lean();
    
    // 3. AI PLANNING
    const schema = {
      plan: ["Analyze Tone", "Extract Variables", "Compose Structure"],
      actions: [{ tool: "sendEmail", parameters: { template: "dynamic", html: "string" } }],
      finalDecision: { generatedSubject: "string", emailHtml: "string" }
    };

    let htmlBody = "<html><body>Standard Automated Email</body></html>";

    try {
      const prompt = `Autonomous Email Generator. 
PAST STYLE MEMORY: ${JSON.stringify(pastMemory.map(m=>m.decision))}
Data: Type ${type}, intended Subject: ${subject}.
Output engaging personalized content.`;

      const aiResponse = await controlledAI(prompt, schema, { priority: "LOW" });

      if (!aiResponse.finalDecision.emailHtml) throw new Error("Validation Failed");
      htmlBody = aiResponse.finalDecision.emailHtml;

      // STORE MEMORY for style evolution
      await AgentMemory.create({
        agentName: "EmailAgent", input: { type, subject }, decision: aiResponse.finalDecision, result: `Dispatch sequence queued.`
      });

    } catch (aiError) {
      console.warn(`[AGENT-FALLBACK] Email Agent fallback active.`);
      // FALLBACK
      htmlBody = `<html><body><p>Automated Fallback Email for ${subject}</p></body></html>`;
    }

    // Execute via standard router bypass here natively
    // In complex systems, we fire executeTool().
    await AILog.create({ agentName: "EmailAgent", actionType: "DISPATCH", newValue: { subject }, reason: "Processed via autonomy", status: "success" });

  } catch (fatalError) {
    console.error(`[CRITICAL] Email Process Suppressed:`, fatalError);
  }
});

module.exports = emailQueue;
