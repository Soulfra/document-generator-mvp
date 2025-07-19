"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateCost = calculateCost;
function calculateCost(input) {
    const { fileSize, type, options } = input;
    let baseCost = 1.0;
    const sizeInMB = fileSize / (1024 * 1024);
    const sizeCost = Math.max(0, (sizeInMB - 1) * 0.50);
    const typeMultipliers = {
        cleanup: 1.0,
        refactor: 1.5,
        format: 0.5,
        full: 2.0,
    };
    let optionMultiplier = 1.0;
    if (options.convertToTypeScript)
        optionMultiplier += 0.5;
    if (options.addTests)
        optionMultiplier += 0.75;
    if (options.removeDeadCode)
        optionMultiplier += 0.25;
    const llmMultipliers = {
        ollama: 0.1,
        openai: 1.0,
        anthropic: 1.2,
        auto: 1.0,
    };
    const finalCost = (baseCost + sizeCost) * typeMultipliers[type] * optionMultiplier * llmMultipliers[options.llmProvider || 'auto'];
    return Math.max(1.0, Math.round(finalCost * 100) / 100);
}
//# sourceMappingURL=pricing.js.map