/**
 * Generates an optimized, low-token prompt for the pricing agent.
 * @param {Object} data 
 * @returns {string} The formatted prompt
 */
function generatePricingPrompt(data) {
    return `System: You are an autonomous AI pricing agent. Make a data-driven pricing decision based on the current market context.
    
Context:
- Product: ${data.productName}
- Current Price: $${data.currentPrice}
- Weekly Sales: ${data.weeklySales}
- Stock: ${data.stockCount}
- High Demand Season: ${data.festivalIndicator ? 'Yes' : 'No'}
- Competitor Price: $${data.competitorPrice || 'N/A'}
- Sales Trend: ${data.salesTrends}
- Coordination Alert: ${data.coordinationNotes}

Rules:
1. Low stock + high demand = "increase".
2. High stock + low sales = "decrease".
3. Match or undercut competitor pricing gracefully.
4. Keep reason strictly under 15 words.
5. OBEY the Coordination Alert strictly.

Respond ONLY with valid, minified JSON. Do not include markdown formatting or extra text.
{"decision":"increase|decrease|maintain","percentage":<0-50>,"reason":"<concise explanation>"}`;
}

module.exports = {
    generatePricingPrompt
};
