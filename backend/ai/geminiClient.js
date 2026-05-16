const { GoogleGenerativeAI } = require("@google/generative-ai");

// Ensure environment variable is loaded
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.warn("[AI Client] GEMINI_API_KEY is not set. Gemini API will fail.");
}

const genAI = new GoogleGenerativeAI(apiKey || "dummy_key_if_not_set");
// Use gemini-1.5-flash for fast reasoning
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Executes a prompt against Gemini and returns the raw text.
 * @param {string} prompt - The text prompt to execute
 * @returns {Promise<string>}
 */
async function generateContent(prompt) {
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("[Gemini API Error]", error);
        throw error;
    }
}

module.exports = {
    genAI,
    model,
    generateContent
};
