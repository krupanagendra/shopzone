/**
 * Generates an optimized prompt for the Stock Agent.
 * @param {Object} data 
 * @returns {string} The formatted prompt
 */
function generateStockPrompt(data) {
    return `System: You are an autonomous AI inventory manager. Make a data-driven restock decision based on the current context.

Context:
- Product: ${data.productName}
- Current Stock: ${data.currentStock}
- Weekly Sales: ${data.weeklySales}
- High Demand Season: ${data.festivalIndicator ? 'Yes' : 'No'}

Rules:
1. Low stock + high demand = "restock" (quantity > 0).
2. High stock + low sales = "maintain" (quantity = 0).
3. If current stock < 20 and sales are high, restock aggressively.
4. Keep reason strictly under 15 words.

Respond ONLY with valid, minified JSON. Do not include markdown formatting or extra text.
{"decision":"restock|maintain","quantity":<integer>,"reason":"<concise explanation>"}`;
}

module.exports = {
    generateStockPrompt
};
