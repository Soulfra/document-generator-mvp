import { ollama } from './ollama';
import { claude } from './claude';
import { logger } from '../utils/logger';
import { ContextProfile } from '../types/context-profile';

export interface LLMTask {
  type: 'analyze' | 'cleanup' | 'structure' | 'generate';
  input: any;
  options?: {
    preferLocal?: boolean;
    maxCost?: number;
    minConfidence?: number;
    profile?: ContextProfile;
  };
}

export interface LLMResult {
  success: boolean;
  data: any;
  provider: 'ollama' | 'claude' | 'openai';
  confidence: number;
  cost: number;
  duration: number;
}

export class LLMRouter {
  private ollamaAvailable: boolean = false;

  async initialize() {
    // Check Ollama availability
    this.ollamaAvailable = await ollama.isAvailable();
    logger.info('LLM Router initialized', { 
      ollamaAvailable: this.ollamaAvailable,
      claudeAvailable: !!process.env.ANTHROPIC_API_KEY,
    });
  }

  async route(task: LLMTask): Promise<LLMResult> {
    const startTime = Date.now();
    const { preferLocal = true, maxCost = 0.5, minConfidence = 0.7 } = task.options || {};

    // Try Ollama first if available and preferred
    if (this.ollamaAvailable && preferLocal) {
      try {
        const result = await this.processWithOllama(task);
        
        // Check if result meets confidence threshold
        if (result.confidence >= minConfidence) {
          return {
            ...result,
            duration: Date.now() - startTime,
          };
        }
        
        logger.info('Ollama result below confidence threshold, escalating', {
          confidence: result.confidence,
          threshold: minConfidence,
        });
      } catch (error) {
        logger.error('Ollama processing failed, falling back', { error });
      }
    }

    // Fallback to Claude if available
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const result = await this.processWithClaude(task);
        
        // Check cost constraint
        if (result.cost > maxCost) {
          throw new Error(`Cost exceeds limit: $${result.cost} > $${maxCost}`);
        }
        
        return {
          ...result,
          duration: Date.now() - startTime,
        };
      } catch (error) {
        logger.error('Claude processing failed', { error });
        throw error;
      }
    }

    throw new Error('No LLM providers available or all attempts failed');
  }

  private async processWithOllama(task: LLMTask): Promise<LLMResult> {
    let data: any;
    let confidence = 0.8; // Default confidence for Ollama

    switch (task.type) {
      case 'analyze':
        data = await ollama.analyzeCode(task.input.code, task.options?.profile);
        confidence = this.calculateAnalysisConfidence(data);
        break;

      case 'cleanup':
        data = await ollama.cleanupCode(task.input.code, task.input.language, task.options?.profile);
        confidence = this.calculateCleanupConfidence(task.input.code, data);
        break;

      case 'structure':
        data = await ollama.suggestFileStructure(task.input.files);
        confidence = this.calculateStructureConfidence(data);
        break;

      case 'generate':
        data = await ollama.generate(task.input.prompt);
        confidence = 0.7; // Lower confidence for generation tasks
        break;

      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }

    return {
      success: true,
      data,
      provider: 'ollama',
      confidence,
      cost: 0, // Ollama is free
      duration: 0, // Will be set by caller
    };
  }

  private async processWithClaude(task: LLMTask): Promise<LLMResult> {
    let data: any;
    let cost = 0;
    const confidence = 0.95; // High confidence for Claude

    switch (task.type) {
      case 'analyze':
        const analysisResult = await claude.analyzeCode(task.input.code, task.options?.profile);
        data = analysisResult.data;
        cost = analysisResult.cost;
        break;

      case 'cleanup':
        const cleanupResult = await claude.cleanupCode(
          task.input.code, 
          task.input.language,
          task.options?.profile
        );
        data = cleanupResult.data;
        cost = cleanupResult.cost;
        break;

      case 'structure':
        const structureResult = await claude.suggestFileStructure(
          task.input.files
        );
        data = structureResult.data;
        cost = structureResult.cost;
        break;

      case 'generate':
        const generateResult = await claude.generate(task.input.prompt);
        data = generateResult.data;
        cost = generateResult.cost;
        break;

      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }

    return {
      success: true,
      data,
      provider: 'claude',
      confidence,
      cost,
      duration: 0, // Will be set by caller
    };
  }

  private calculateAnalysisConfidence(analysis: any): number {
    // Simple heuristic: more issues and suggestions = higher confidence
    const issueCount = analysis.issues?.length || 0;
    const suggestionCount = analysis.suggestions?.length || 0;
    
    if (issueCount === 0 && suggestionCount === 0) {
      return 0.5; // Low confidence if nothing found
    }
    
    return Math.min(0.9, 0.6 + (issueCount + suggestionCount) * 0.05);
  }

  private calculateCleanupConfidence(original: string, cleaned: string): number {
    // Check if meaningful changes were made
    if (original === cleaned) {
      return 0.3; // Very low confidence if no changes
    }
    
    const changeRatio = Math.abs(original.length - cleaned.length) / original.length;
    
    // Too much change might indicate an error
    if (changeRatio > 0.5) {
      return 0.5;
    }
    
    return 0.8;
  }

  private calculateStructureConfidence(structure: any): number {
    // Check if structure makes sense
    const folders = Object.keys(structure.structure || {});
    
    if (folders.length === 0) {
      return 0.4;
    }
    
    // Good structure has common folders
    const goodFolders = ['src/', 'tests/', 'docs/', 'lib/', 'config/'];
    const matchCount = folders.filter(f => 
      goodFolders.some(gf => f.includes(gf))
    ).length;
    
    return Math.min(0.9, 0.6 + matchCount * 0.1);
  }

  async estimateCost(task: LLMTask): Promise<{ 
    ollama: number; 
    claude: number; 
    recommended: 'ollama' | 'claude';
  }> {
    const estimates = {
      ollama: 0, // Always free
      claude: 0,
      recommended: 'ollama' as 'ollama' | 'claude',
    };

    // Estimate based on task type and input size
    const inputSize = JSON.stringify(task.input).length;
    
    // Claude pricing (rough estimates)
    switch (task.type) {
      case 'analyze':
        estimates.claude = inputSize * 0.00001;
        break;
      case 'cleanup':
        estimates.claude = inputSize * 0.000015;
        break;
      case 'structure':
        estimates.claude = 0.01;
        break;
      case 'generate':
        estimates.claude = inputSize * 0.00002;
        break;
    }

    // Recommend based on complexity
    if (!this.ollamaAvailable) {
      estimates.recommended = 'claude';
    } else if (inputSize > 10000 || task.type === 'generate') {
      estimates.recommended = 'claude';
    }

    return estimates;
  }
}

// Singleton instance
export const llmRouter = new LLMRouter();