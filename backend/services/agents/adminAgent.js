const AILog = require("../../models/AI_Log");
const AgentMemory = require("../../models/AgentMemory");
const { controlledAI } = require("../aiService");
const { executeTool } = require("../aiTools");

const adminAgent = async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "Query missing" });

  try {
    // 1. MEMORY & CONTEXT BUILD
    const pastMemory = await AgentMemory.find({ agentName: "AdminAgent" }).sort({ timestamp: -1 }).limit(5).lean();
    const promptContext = { query, pastInteractions: pastMemory.map(m => m.decision) };

    const prompt = `Autonomous Admin Assistant. 
Analyze the admin query. Determine what tool is required to extract the data to satisfy the question.
CONTEXT: ${JSON.stringify(promptContext)}`;

    const schema = {
      plan: ["Understand Intent", "Determine Tools", "Format Response"],
      actions: [{ tool: "string", parameters: { "dynamic": "keys" } }],
      finalDecision: { responseText: "Direct conversational answer based on executed tools." }
    };

    let resultResponse = "Processed query.";

    try {
      // 3. AI PLANNING & Action Structuring
      const aiResponse = await controlledAI(prompt, schema, { priority: "HIGH", timeoutMs: 12000 });

      // 4. TOOL EXECUTION 
      let toolContexts = [];
      for (const action of aiResponse.actions || []) {
         const toolData = await executeTool(action); 
         toolContexts.push(toolData);
      }

      // If tools yielded complex data, a secondary fast pass COULD run here. For zero-latency, we use primary generation.
      resultResponse = aiResponse.finalDecision.responseText;

      await AgentMemory.create({
        agentName: "AdminAgent",
        input: { query },
        decision: aiResponse.finalDecision,
        result: `Answered directly.`
      });

    } catch (aiError) {
      console.warn(`[AGENT-FALLBACK] Admin Agent Offline.`);
      resultResponse = "System is currently busy in Fallback Mode. Standard metrics apply.";
    }

    res.status(200).json({ status: "success", ai_response: resultResponse });

  } catch (fatalError) {
    console.error(`[CRITICAL] Admin Process Suppressed:`, fatalError);
    res.status(500).json({ status: "error", error: "Fatal suppression active." });
  }
};

module.exports = adminAgent;
