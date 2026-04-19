const fetch = globalThis.fetch || require("node-fetch");
const crypto = require("crypto");

// ── GLOBAL AI CONTROL & ANALYTICS STATE ───────────────────────────────────
let activeConcurrentCalls = 0;
const MAX_CONCURRENT_CALLS = 5;
const requestQueue = [];

let circuitTripped = false;
let failedCalls = 0;
const MAX_FAILURES = 5; 
const CIRCUIT_RECOVERY_MS = 60000; 

const aiCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; 

// Metrics
let totalAICalls = 0;
let cacheHits = 0;
let totalFallbackCount = 0;
let totalResponseTimeMs = 0;
const agentUsageStats = { pricing: 0, report: 0, admin: 0, email: 0, stock: 0 };

class AIServiceError extends Error {
  constructor(message, originalError) {
    super(message);
    this.originalError = originalError;
  }
}

setInterval(() => {
  const now = Date.now();
  for (const [key, { expiresAt }] of aiCache.entries()) {
    if (now > expiresAt) aiCache.delete(key);
  }
}, 60000).unref();

const processQueue = () => {
  while (requestQueue.length > 0 && activeConcurrentCalls < MAX_CONCURRENT_CALLS) {
    requestQueue.shift()();
    activeConcurrentCalls++;
  }
};

const controlledAI = async (prompt, schemaDetails, options = {}) => {
  const { priority = "MEDIUM", agentContext = "unknown" } = options;
  const startStamp = Date.now();

  if (priority === "LOW" && requestQueue.length > 5) {
    totalFallbackCount++;
    throw new AIServiceError("System overloaded. LOW priority AI requests dropped automatically.");
  }
  if (circuitTripped) {
    totalFallbackCount++;
    throw new AIServiceError("AI Circuit Breaker Tripped. All LLM calls temporarily blocked safely.");
  }

  const cacheKey = crypto.createHash("md5").update(prompt + JSON.stringify(schemaDetails)).digest("hex");
  if (aiCache.has(cacheKey)) {
    const cached = aiCache.get(cacheKey);
    if (Date.now() < cached.expiresAt) {
      cacheHits++;
      return cached.data;
    }
    aiCache.delete(cacheKey); 
  }

  return new Promise((resolve, reject) => {
    const execute = async () => {
      try {
        if (agentUsageStats[agentContext] !== undefined) agentUsageStats[agentContext]++;
        totalAICalls++;

        const result = await runAIWithRetries(prompt, schemaDetails, options);
        aiCache.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
        
        failedCalls = 0; 
        totalResponseTimeMs += (Date.now() - startStamp);
        resolve(result);
      } catch (err) {
        failedCalls++;
        totalFallbackCount++;
        if (failedCalls >= MAX_FAILURES) {
          circuitTripped = true;
          setTimeout(() => { circuitTripped = false; failedCalls = 0; }, CIRCUIT_RECOVERY_MS);
        }
        reject(err);
      } finally {
        activeConcurrentCalls--;
        processQueue(); 
      }
    };

    if (activeConcurrentCalls < MAX_CONCURRENT_CALLS) {
      activeConcurrentCalls++;
      execute();
    } else {
      if (priority === "HIGH") requestQueue.unshift(execute); else requestQueue.push(execute);
    }
  });
};

const runAIWithRetries = async (prompt, schemaDetails, options) => {
  const { maxRetries = 2, timeoutMs = 8000 } = options;
  let retries = 0;

  const systemPrompt = `You are a strict JSON decision engine. Produce valid JSON mapping this SCHEMA: ${JSON.stringify(schemaDetails)}`;
  const messages = [{ role: "system", content: systemPrompt }, { role: "user", content: prompt }];

  while (retries <= maxRetries) {
    try {
       const raw = await fetchWithTimeout(messages, timeoutMs);
       return parseAIResponse(raw);
    } catch (err) {
       retries++;
       if (retries > maxRetries) throw err;
       await new Promise(r => setTimeout(r, 500 * Math.pow(2, retries)));
    }
  }
};

const fetchWithTimeout = async (messages, timeoutMs) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const PROVIDER = (process.env.CHATBOT_PROVIDER || "groq").toLowerCase();
  
  try {
    if (PROVIDER === "groq") {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.GROQ_API_KEY}` },
        body: JSON.stringify({ model: "llama-3.1-8b-instant", messages, response_format: { type: "json_object" } }),
        signal: controller.signal
      });
      const data = await res.json();
      if(!res.ok) throw new Error(data.error?.message);
      return data.choices[0].message.content;
    }
    throw new Error("Provider missing.");
  } finally {
    clearTimeout(timeoutId);
  }
};

const parseAIResponse = (text) => {
  let raw = text.trim();
  if (raw.startsWith('```json')) raw = raw.substring(7);
  if (raw.startsWith('```')) raw = raw.substring(3);
  if (raw.endsWith('```')) raw = raw.substring(0, raw.length - 3);
  return JSON.parse(raw.trim());
};

const getLiveStats = () => ({
  activeCalls: activeConcurrentCalls,
  queueLength: requestQueue.length,
  cacheSize: aiCache.size,
  circuitBreakerState: circuitTripped ? "BLOCKED" : "OPERATIONAL"
});

const getAnalytics = () => ({
  totalAICalls,
  cacheHits,
  fallbackCount: totalFallbackCount,
  avgResponseTime: totalAICalls > 0 ? (totalResponseTimeMs / totalAICalls).toFixed(2) : 0,
  agentUsageStats
});

module.exports = { controlledAI, getLiveStats, getAnalytics };
