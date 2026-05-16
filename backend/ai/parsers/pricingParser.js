/**
 * Parses and validates the raw Gemini response safely.
 * @param {string} rawResponse 
 * @returns {Object} Validated decision object
 */
function parsePricingDecision(rawResponse) {
    try {
        // Strip markdown code blocks if Gemini returns them
        let cleanJsonStr = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        // Find the start and end of JSON if there's any extra text
        const startIdx = cleanJsonStr.indexOf('{');
        const endIdx = cleanJsonStr.lastIndexOf('}');
        if (startIdx !== -1 && endIdx !== -1) {
            cleanJsonStr = cleanJsonStr.slice(startIdx, endIdx + 1);
        }

        const parsed = JSON.parse(cleanJsonStr);
        console.log(`[AGENT-PARSER] Successfully extracted JSON from Gemini response.`);

        // Validation
        if (!['increase', 'decrease', 'maintain'].includes(parsed.decision)) {
            throw new Error("Validation Failed: Invalid decision value.");
        }
        if (typeof parsed.percentage !== 'number') {
            throw new Error("Validation Failed: Invalid percentage value.");
        }
        if (typeof parsed.reason !== 'string' || parsed.reason.trim() === '') {
            throw new Error("Validation Failed: Invalid or missing reason.");
        }

        // Clamp percentage to a safe limit, e.g., max 50% change in one go
        let percentage = parsed.percentage;
        let bounded = false;
        if (percentage > 50) {
            percentage = 50;
            bounded = true;
        }
        if (percentage < 0) {
            percentage = Math.abs(percentage);
        }

        if (bounded) {
            console.log(`[AGENT-PARSER] Bounded dangerous percentage spike from ${parsed.percentage}% to 50%.`);
        } else {
            console.log(`[AGENT-PARSER] Percentage ${percentage}% is within safe bounds.`);
        }

        return {
            decision: parsed.decision,
            percentage: percentage,
            reason: parsed.reason
        };
    } catch (error) {
        console.error("[AGENT-PARSER-ERROR] Failed to parse AI response:", error.message, "\nRaw:", rawResponse);
        throw error;
    }
}

module.exports = {
    parsePricingDecision
};
