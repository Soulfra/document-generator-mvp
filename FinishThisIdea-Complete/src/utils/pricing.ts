interface CostCalculationInput {
  fileSize: number;
  type: 'cleanup' | 'refactor' | 'format' | 'full';
  options: {
    removeComments?: boolean;
    removeConsoleLog?: boolean;
    formatCode?: boolean;
    optimizeImports?: boolean;
    removeDeadCode?: boolean;
    convertToTypeScript?: boolean;
    addTests?: boolean;
    llmProvider?: 'ollama' | 'openai' | 'anthropic' | 'auto';
  };
}

export function calculateCost(input: CostCalculationInput): number {
  const { fileSize, type, options } = input;
  
  // Base cost calculation
  let baseCost = 1.0; // $1 minimum
  
  // File size multiplier (per MB)
  const sizeInMB = fileSize / (1024 * 1024);
  const sizeCost = Math.max(0, (sizeInMB - 1) * 0.50); // $0.50 per MB after first MB
  
  // Type multipliers
  const typeMultipliers = {
    cleanup: 1.0,
    refactor: 1.5,
    format: 0.5,
    full: 2.0,
  };
  
  // Option multipliers
  let optionMultiplier = 1.0;
  if (options.convertToTypeScript) optionMultiplier += 0.5;
  if (options.addTests) optionMultiplier += 0.75;
  if (options.removeDeadCode) optionMultiplier += 0.25;
  
  // LLM provider cost adjustment
  const llmMultipliers = {
    ollama: 0.1, // Much cheaper for local models
    openai: 1.0,
    anthropic: 1.2,
    auto: 1.0,
  };
  
  const finalCost = (baseCost + sizeCost) * typeMultipliers[type] * optionMultiplier * llmMultipliers[options.llmProvider || 'auto'];
  
  return Math.max(1.0, Math.round(finalCost * 100) / 100); // Minimum $1, round to cents
}