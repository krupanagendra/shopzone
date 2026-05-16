/**
 * Parses and validates the raw Gemini response for Stock Agent safely.
 * @param {string} rawResponse 
 * @returns {Object} Validated decision object
 */
function parseStockDecision(rawResponse) {
    try {
        let cleanJsonStr = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        const startIdx = cleanJsonStr.indexOf('{');
        const endIdx = cleanJsonStr.lastIndexOf('}');
        if (startIdx !== -1 && endIdx !== -1) {
            cleanJsonStr = cleanJsonStr.slice(startIdx, endIdx + 1);
        }

        const parsed = JSON.parse(cleanJsonStr);
        console.log(`[AGENT-PARSER] Successfully extracted JSON from Gemini response.`);

        // Validation
        if (!['restock', 'maintain'].includes(parsed.decision)) {
            throw new Error("Validation Failed: Invalid decision value.");
        }
        if (typeof parsed.quantity !== 'number' || !Number.isInteger(parsed.quantity)) {
            throw new Error("Validation Failed: Invalid quantity value.");
        }
        if (typeof parsed.reason !== 'string' || parsed.reason.trim() === '') {
            throw new Error("Validation Failed: Invalid or missing reason.");
        }

        // Clamp quantity to a safe limit, e.g., max 500 restock in one go
        let quantity = parsed.quantity;
        let bounded = false;
        
        if (quantity < 0) quantity = 0;
        
        if (quantity > 500) {
            quantity = 500;
            bounded = true;
        }

        if (bounded) {
            console.log(`[AGENT-PARSER] Bounded dangerous restock spike from ${parsed.quantity} to 500.`);
        } else {
            console.log(`[AGENT-PARSER] Restock quantity ${quantity} is within safe bounds.`);
        }

        return {
            decision: parsed.decision,
            quantity: quantity,
            reason: parsed.reason
        };
    } catch (error) {
        console.error("[AGENT-PARSER-ERROR] Failed to parse AI response:", error.message, "\nRaw:", rawResponse);
        throw error;
    }
}

module.exports = {
    parseStockDecision
};
