import { LLMRouter } from '@finishthisidea/llm-router';
import { Storage } from '../utils/storage';
import { Database } from '../database';
import { logger } from '../utils/logger';
import { 
  {{pascalCase name}}Config,
  ProcessOptions,
  ProcessResult,
  ValidationResult 
} from '../types/{{kebabCase name}}.types';

export class {{pascalCase name}}Service {
  private llmRouter: LLMRouter;
  private storage: Storage;
  private config: {{pascalCase name}}Config;

  constructor(config?: Partial<{{pascalCase name}}Config>) {
    this.config = {
      {{#each defaultConfig}}
      {{@key}}: {{this}},
      {{/each}}
      ...config,
    };
    
    this.llmRouter = new LLMRouter({
      providers: [
        {{#if useOllama}}
        {
          name: 'ollama',
          endpoint: process.env.OLLAMA_URL || 'http://localhost:11434',
          models: {{json ollamaModels}},
          priority: 1,
        },
        {{/if}}
        {{#if useOpenAI}}
        {
          name: 'openai',
          apiKey: process.env.OPENAI_API_KEY,
          models: {{json openaiModels}},
          priority: 2,
        },
        {{/if}}
        {{#if useAnthropic}}
        {
          name: 'anthropic',
          apiKey: process.env.ANTHROPIC_API_KEY,
          models: {{json anthropicModels}},
          priority: 3,
        },
        {{/if}}
      ],
      routing: {
        strategy: '{{routingStrategy}}',
        localFirst: {{localFirst}},
        maxCost: {{maxCost}},
      },
    });
    
    this.storage = new Storage({
      provider: '{{storageProvider}}',
      bucket: process.env.STORAGE_BUCKET || '{{name}}-storage',
    });
  }

  /**
   * Validate input data before processing
   */
  async validate(data: any): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    {{#each validationRules}}
    // {{this.description}}
    if ({{this.condition}}) {
      {{this.severity}}s.push('{{this.message}}');
    }
    {{/each}}
    
    // Check file size if applicable
    if (data.file) {
      const fileSize = await this.storage.getFileSize(data.file);
      if (fileSize > this.config.maxFileSize * 1024 * 1024) {
        errors.push(`File size ${fileSize} exceeds maximum ${this.config.maxFileSize}MB`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Main processing logic
   */
  async process(data: any, options: ProcessOptions = {}): Promise<ProcessResult> {
    const { onProgress } = options;
    const startTime = Date.now();
    
    try {
      // Step 1: Validate input (10%)
      await onProgress?.(10, 'Validating input');
      const validation = await this.validate(data);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
      
      // Step 2: Pre-process data (20%)
      await onProgress?.(20, 'Pre-processing data');
      const preprocessed = await this.preprocess(data);
      
      // Step 3: Main AI processing (60%)
      await onProgress?.(30, 'Processing with AI');
      const aiResult = await this.processWithAI(preprocessed, {
        onProgress: async (percent) => {
          // Map AI progress from 30-80%
          const mappedPercent = 30 + (percent * 0.5);
          await onProgress?.(mappedPercent, 'AI processing');
        },
      });
      
      // Step 4: Post-process results (80%)
      await onProgress?.(80, 'Post-processing results');
      const postprocessed = await this.postprocess(aiResult);
      
      // Step 5: Generate output (90%)
      await onProgress?.(90, 'Generating output');
      const output = await this.generateOutput(postprocessed);
      
      // Step 6: Save results (100%)
      await onProgress?.(95, 'Saving results');
      const savedResult = await this.saveResults(output);
      
      await onProgress?.(100, 'Complete');
      
      const endTime = Date.now();
      
      return {
        success: true,
        data: savedResult,
        metadata: {
          processingTime: endTime - startTime,
          aiProvider: aiResult.provider,
          model: aiResult.model,
          tokensUsed: aiResult.tokens,
          cost: aiResult.cost,
        },
        warnings: validation.warnings,
      };
      
    } catch (error) {
      logger.error('Processing failed:', error);
      throw error;
    }
  }

  /**
   * Pre-process input data
   */
  private async preprocess(data: any): Promise<any> {
    {{#if hasPreprocessing}}
    {{preprocessingLogic}}
    {{else}}
    // Default: return data as-is
    return data;
    {{/if}}
  }

  /**
   * Process with AI using progressive enhancement
   */
  private async processWithAI(data: any, options: any): Promise<any> {
    const prompt = this.buildPrompt(data);
    
    const result = await this.llmRouter.complete({
      prompt,
      maxTokens: {{maxTokens}},
      temperature: {{temperature}},
      systemPrompt: `{{systemPrompt}}`,
      options: {
        requireConfidence: {{minConfidence}},
        hybridThreshold: {{hybridThreshold}},
      },
    });
    
    return {
      ...result,
      processed: this.parseAIResponse(result.content),
    };
  }

  /**
   * Build prompt for AI processing
   */
  private buildPrompt(data: any): string {
    return `{{basePrompt}}

Input Data:
${JSON.stringify(data, null, 2)}

{{additionalInstructions}}`;
  }

  /**
   * Parse AI response
   */
  private parseAIResponse(content: string): any {
    {{#if customParser}}
    {{customParserLogic}}
    {{else}}
    try {
      // Try to parse as JSON first
      return JSON.parse(content);
    } catch {
      // Return as plain text if not JSON
      return { result: content };
    }
    {{/if}}
  }

  /**
   * Post-process AI results
   */
  private async postprocess(result: any): Promise<any> {
    {{#if hasPostprocessing}}
    {{postprocessingLogic}}
    {{else}}
    return result.processed;
    {{/if}}
  }

  /**
   * Generate final output
   */
  private async generateOutput(data: any): Promise<any> {
    {{#if customOutput}}
    {{outputGenerationLogic}}
    {{else}}
    return {
      format: '{{outputFormat}}',
      content: data,
      timestamp: new Date().toISOString(),
    };
    {{/if}}
  }

  /**
   * Save results to storage
   */
  private async saveResults(output: any): Promise<any> {
    const filename = `{{name}}-${Date.now()}.{{outputExtension}}`;
    
    const url = await this.storage.upload({
      filename,
      content: output.format === 'json' 
        ? JSON.stringify(output.content, null, 2)
        : output.content,
      contentType: '{{outputContentType}}',
    });
    
    // Save metadata to database
    const job = await Database.jobs.update({
      where: { id: output.jobId },
      data: {
        outputUrl: url,
        completedAt: new Date(),
        status: 'completed',
      },
    });
    
    return {
      url,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      ...output,
    };
  }
}