/**
 * AI ROUTER - Intelligent LLM Provider Routing
 * 
 * Routes requests between different LLM providers based on:
 * - User tier (internal gets Ollama-first routing)
 * - BYOK (Bring Your Own Keys) support
 * - Cost optimization
 * - Performance requirements
 * - Provider availability
 */

import { logger } from '../../utils/logger';
import { presenceLogger } from '../../monitoring/presence-logger';

// Import LLM providers (will need to adapt from original)
// import { ollama } from '../../llm/ollama';
// import { claude } from '../../llm/claude';
// import { openai } from '../../llm/openai';

export interface AIRequest {
  keyInfo: any;
  options?: {
    preferLocal?: boolean;
    maxCost?: number;
    minConfidence?: number;
    timeout?: number;
    model?: string;
  };
}

export interface CodeAnalysisRequest extends AIRequest {
  code: string;
  language?: string;
  profile?: any;
}

export interface CodeCleanupRequest extends AIRequest {
  code: string;
  language?: string;
  profile?: any;
}

export interface StructureRequest extends AIRequest {
  files: string[];
  projectType?: string;
}

export interface GenerationRequest extends AIRequest {
  prompt: string;
  type?: 'code' | 'docs' | 'tests' | 'comments';
}

export interface AIResult {
  success: boolean;
  data: any;
  provider: 'ollama' | 'claude' | 'openai' | 'byok';
  model?: string;
  confidence: number;
  cost: number;
  tokens?: {
    input: number;
    output: number;
  };
  reasoning?: string;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: 'ollama' | 'claude' | 'openai' | 'byok';
  cost_per_token: number;
  capabilities: string[];
  context_length: number;
  available: boolean;
}

export class AIRouter {
  private ollamaAvailable: boolean = false;
  private claudeAvailable: boolean = false;
  private openaiAvailable: boolean = false;
  private availableModels: ModelInfo[] = [];

  async initialize() {
    // Check provider availability
    this.ollamaAvailable = await this.checkOllamaAvailability();
    this.claudeAvailable = !!process.env.ANTHROPIC_API_KEY;
    this.openaiAvailable = !!process.env.OPENAI_API_KEY;
    
    // Initialize available models
    await this.refreshAvailableModels();
    
    logger.info('AI Router initialized', {
      ollama: this.ollamaAvailable,
      claude: this.claudeAvailable,
      openai: this.openaiAvailable,
      models: this.availableModels.length
    });
  }

  private async checkOllamaAvailability(): Promise<boolean> {
    try {
      // Mock Ollama check - would actually hit Ollama API
      const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
      // const response = await fetch(`${ollamaUrl}/api/tags`);
      // return response.ok;
      
      // For now, assume available if URL is set
      return !!process.env.OLLAMA_URL || process.env.NODE_ENV === 'development';
    } catch (error) {
      logger.warn('Ollama not available', { error: error.message });
      return false;
    }
  }

  async refreshAvailableModels(): Promise<void> {
    this.availableModels = [];

    // Add Ollama models if available
    if (this.ollamaAvailable) {
      this.availableModels.push(
        {
          id: 'codellama:7b',
          name: 'Code Llama 7B',
          provider: 'ollama',
          cost_per_token: 0,
          capabilities: ['code_analysis', 'code_cleanup', 'code_generation'],
          context_length: 4096,
          available: true
        },
        {
          id: 'deepseek-coder:6.7b',
          name: 'DeepSeek Coder 6.7B',
          provider: 'ollama',
          cost_per_token: 0,
          capabilities: ['code_analysis', 'code_cleanup', 'code_generation'],
          context_length: 16384,
          available: true
        }
      );
    }

    // Add Claude models if available
    if (this.claudeAvailable) {
      this.availableModels.push(
        {
          id: 'claude-3-haiku-20240307',
          name: 'Claude 3 Haiku',
          provider: 'claude',
          cost_per_token: 0.000025,
          capabilities: ['code_analysis', 'code_cleanup', 'code_generation', 'documentation'],
          context_length: 200000,
          available: true
        },
        {
          id: 'claude-3-sonnet-20240229',
          name: 'Claude 3 Sonnet',
          provider: 'claude',
          cost_per_token: 0.000075,
          capabilities: ['code_analysis', 'code_cleanup', 'code_generation', 'documentation', 'architecture'],
          context_length: 200000,
          available: true
        }
      );
    }

    // Add OpenAI models if available
    if (this.openaiAvailable) {
      this.availableModels.push(
        {
          id: 'gpt-3.5-turbo',
          name: 'GPT-3.5 Turbo',
          provider: 'openai',
          cost_per_token: 0.0000015,
          capabilities: ['code_analysis', 'code_cleanup', 'code_generation'],
          context_length: 16385,
          available: true
        },
        {
          id: 'gpt-4-turbo-preview',
          name: 'GPT-4 Turbo',
          provider: 'openai',
          cost_per_token: 0.00003,
          capabilities: ['code_analysis', 'code_cleanup', 'code_generation', 'architecture'],
          context_length: 128000,
          available: true
        }
      );
    }
  }

  async getAvailableModels(keyInfo: any): Promise<ModelInfo[]> {
    // Filter models based on user tier
    let availableToUser = [...this.availableModels];

    // Internal users get everything
    if (keyInfo.tier === 'internal') {
      return availableToUser;
    }

    // BYOK users get their own models + free models
    if (keyInfo.tier === 'byok') {
      // Would check for user's custom API keys here
      return availableToUser.filter(model => 
        model.cost_per_token === 0 || keyInfo.customKeys?.[model.provider]
      );
    }

    // Free tier only gets free models
    if (keyInfo.tier === 'free') {
      availableToUser = availableToUser.filter(model => model.cost_per_token === 0);
    }

    return availableToUser;
  }

  async analyzeCode(request: CodeAnalysisRequest): Promise<AIResult> {
    const { code, language, profile, keyInfo, options = {} } = request;
    
    // Choose best model for code analysis
    const model = await this.selectModel({
      task: 'code_analysis',
      inputSize: code.length,
      keyInfo,
      options
    });

    const startTime = Date.now();
    
    try {
      let result: any;
      let cost = 0;
      let confidence = 0;

      // Route to appropriate provider
      switch (model.provider) {
        case 'ollama':
          result = await this.processWithOllama('analyze', { code, language, profile });
          confidence = 0.8;
          cost = 0;
          break;
          
        case 'claude':
          result = await this.processWithClaude('analyze', { code, language, profile });
          confidence = 0.95;
          cost = this.calculateCost(code, model);
          break;
          
        case 'openai':
          result = await this.processWithOpenAI('analyze', { code, language, profile });
          confidence = 0.9;
          cost = this.calculateCost(code, model);
          break;
          
        default:
          throw new Error(`Unsupported provider: ${model.provider}`);
      }

      // Log successful processing
      await presenceLogger.logUserPresence('ai_processing', {
        userId: keyInfo.userId,
        sessionId: keyInfo.keyId,
        metadata: {
          task: 'analyze',
          provider: model.provider,
          model: model.id,
          inputSize: code.length,
          cost,
          confidence,
          duration: Date.now() - startTime
        }
      });

      return {
        success: true,
        data: result,
        provider: model.provider,
        model: model.id,
        confidence,
        cost,
        reasoning: `Used ${model.name} for code analysis (tier: ${keyInfo.tier})`
      };

    } catch (error) {
      logger.error('Code analysis failed', { 
        error: error.message, 
        model: model.id, 
        provider: model.provider 
      });
      
      // Try fallback if available
      if (options.preferLocal && model.provider !== 'ollama' && this.ollamaAvailable) {
        logger.info('Falling back to Ollama for code analysis');
        return this.analyzeCode({
          ...request,
          options: { ...options, preferLocal: false }
        });
      }
      
      throw error;
    }
  }

  async cleanupCode(request: CodeCleanupRequest): Promise<AIResult> {
    const { code, language, profile, keyInfo, options = {} } = request;
    
    // Choose best model for code cleanup
    const model = await this.selectModel({
      task: 'code_cleanup',
      inputSize: code.length,
      keyInfo,
      options
    });

    const startTime = Date.now();
    
    try {
      let result: any;
      let cost = 0;
      let confidence = 0;

      // Route to appropriate provider
      switch (model.provider) {
        case 'ollama':
          result = await this.processWithOllama('cleanup', { code, language, profile });
          confidence = this.calculateCleanupConfidence(code, result);
          cost = 0;
          break;
          
        case 'claude':
          result = await this.processWithClaude('cleanup', { code, language, profile });
          confidence = 0.95;
          cost = this.calculateCost(code, model);
          break;
          
        case 'openai':
          result = await this.processWithOpenAI('cleanup', { code, language, profile });
          confidence = 0.9;
          cost = this.calculateCost(code, model);
          break;
          
        default:
          throw new Error(`Unsupported provider: ${model.provider}`);
      }

      // Log successful processing
      await presenceLogger.logUserPresence('ai_processing', {
        userId: keyInfo.userId,
        sessionId: keyInfo.keyId,
        metadata: {
          task: 'cleanup',
          provider: model.provider,
          model: model.id,
          inputSize: code.length,
          cost,
          confidence,
          duration: Date.now() - startTime
        }
      });

      return {
        success: true,
        data: result,
        provider: model.provider,
        model: model.id,
        confidence,
        cost,
        reasoning: `Used ${model.name} for code cleanup (tier: ${keyInfo.tier})`
      };

    } catch (error) {
      logger.error('Code cleanup failed', { 
        error: error.message, 
        model: model.id, 
        provider: model.provider 
      });
      
      // Try fallback if available
      if (options.preferLocal && model.provider !== 'ollama' && this.ollamaAvailable) {
        logger.info('Falling back to Ollama for code cleanup');
        return this.cleanupCode({
          ...request,
          options: { ...options, preferLocal: false }
        });
      }
      
      throw error;
    }
  }

  async suggestStructure(request: StructureRequest): Promise<AIResult> {
    const { files, projectType, keyInfo, options = {} } = request;
    
    // Structure suggestions work better with larger context models
    const model = await this.selectModel({
      task: 'structure_analysis',
      inputSize: files.join('').length,
      keyInfo,
      options,
      preferLargeContext: true
    });

    const startTime = Date.now();
    
    try {
      let result: any;
      let cost = 0;

      // Route to appropriate provider
      switch (model.provider) {
        case 'ollama':
          result = await this.processWithOllama('structure', { files, projectType });
          cost = 0;
          break;
          
        case 'claude':
          result = await this.processWithClaude('structure', { files, projectType });
          cost = this.calculateCost(files.join(''), model);
          break;
          
        case 'openai':
          result = await this.processWithOpenAI('structure', { files, projectType });
          cost = this.calculateCost(files.join(''), model);
          break;
          
        default:
          throw new Error(`Unsupported provider: ${model.provider}`);
      }

      return {
        success: true,
        data: result,
        provider: model.provider,
        model: model.id,
        confidence: 0.85,
        cost,
        reasoning: `Used ${model.name} for structure analysis (tier: ${keyInfo.tier})`
      };

    } catch (error) {
      logger.error('Structure suggestion failed', { 
        error: error.message, 
        model: model.id, 
        provider: model.provider 
      });
      throw error;
    }
  }

  async generate(request: GenerationRequest): Promise<AIResult> {
    const { prompt, type, keyInfo, options = {} } = request;
    
    // Choose best model for generation
    const model = await this.selectModel({
      task: 'generation',
      inputSize: prompt.length,
      keyInfo,
      options
    });

    const startTime = Date.now();
    
    try {
      let result: any;
      let cost = 0;

      // Route to appropriate provider
      switch (model.provider) {
        case 'ollama':
          result = await this.processWithOllama('generate', { prompt, type });
          cost = 0;
          break;
          
        case 'claude':
          result = await this.processWithClaude('generate', { prompt, type });
          cost = this.calculateCost(prompt, model);
          break;
          
        case 'openai':
          result = await this.processWithOpenAI('generate', { prompt, type });
          cost = this.calculateCost(prompt, model);
          break;
          
        default:
          throw new Error(`Unsupported provider: ${model.provider}`);
      }

      return {
        success: true,
        data: result,
        provider: model.provider,
        model: model.id,
        confidence: 0.85,
        cost,
        reasoning: `Used ${model.name} for generation (tier: ${keyInfo.tier})`
      };

    } catch (error) {
      logger.error('Generation failed', { 
        error: error.message, 
        model: model.id, 
        provider: model.provider 
      });
      throw error;
    }
  }

  async estimateCost(params: any): Promise<any> {
    const { task, input, keyInfo, options } = params;
    
    const estimates: any = {
      ollama: 0, // Always free
      claude: 0,
      openai: 0,
      recommended: 'ollama'
    };

    // Get input size
    const inputSize = typeof input === 'string' ? input.length : JSON.stringify(input).length;
    
    // Calculate estimates for each provider
    const claudeModel = this.availableModels.find(m => m.provider === 'claude');
    if (claudeModel) {
      estimates.claude = this.calculateCost(input, claudeModel);
    }
    
    const openaiModel = this.availableModels.find(m => m.provider === 'openai');
    if (openaiModel) {
      estimates.openai = this.calculateCost(input, openaiModel);
    }

    // Recommend based on tier and input complexity
    if (keyInfo.tier === 'internal') {
      estimates.recommended = 'ollama';
    } else if (inputSize > 50000) {
      estimates.recommended = 'claude'; // Better for large inputs
    } else if (keyInfo.tier === 'free') {
      estimates.recommended = 'ollama';
    } else {
      estimates.recommended = estimates.claude < estimates.openai ? 'claude' : 'openai';
    }

    return estimates;
  }

  private async selectModel(params: {
    task: string;
    inputSize: number;
    keyInfo: any;
    options: any;
    preferLargeContext?: boolean;
  }): Promise<ModelInfo> {
    const { task, inputSize, keyInfo, options, preferLargeContext = false } = params;
    
    // Get available models for this user
    const userModels = await this.getAvailableModels(keyInfo);
    
    // Filter by capability
    const capableModels = userModels.filter(model => {
      const taskMap: any = {
        'code_analysis': 'code_analysis',
        'code_cleanup': 'code_cleanup',
        'structure_analysis': 'architecture',
        'generation': 'code_generation'
      };
      
      return model.capabilities.includes(taskMap[task] || task);
    });

    if (capableModels.length === 0) {
      throw new Error(`No capable models available for task: ${task}`);
    }

    // For internal users, prefer Ollama if available
    if (keyInfo.tier === 'internal' && options.preferLocal !== false) {
      const ollamaModel = capableModels.find(m => m.provider === 'ollama');
      if (ollamaModel) {
        return ollamaModel;
      }
    }

    // For large inputs, prefer models with larger context
    if (inputSize > 50000 || preferLargeContext) {
      const largeContextModels = capableModels
        .filter(m => m.context_length > 50000)
        .sort((a, b) => b.context_length - a.context_length);
      
      if (largeContextModels.length > 0) {
        return largeContextModels[0];
      }
    }

    // For cost-conscious users, prefer cheaper models
    if (keyInfo.tier === 'free' || options.maxCost < 0.05) {
      const freeModels = capableModels.filter(m => m.cost_per_token === 0);
      if (freeModels.length > 0) {
        return freeModels[0];
      }
    }

    // Default: return the first capable model
    return capableModels[0];
  }

  private calculateCost(input: string, model: ModelInfo): number {
    // Rough token estimation (1 token ≈ 4 characters for English)
    const estimatedTokens = Math.ceil(input.length / 4);
    return estimatedTokens * model.cost_per_token;
  }

  private calculateCleanupConfidence(original: string, cleaned: string): number {
    if (original === cleaned) {
      return 0.3; // Low confidence if no changes
    }
    
    const changeRatio = Math.abs(original.length - cleaned.length) / original.length;
    
    // Too much change might indicate an error
    if (changeRatio > 0.5) {
      return 0.5;
    }
    
    return 0.8;
  }

  // Mock implementations - would be replaced with actual provider calls
  private async processWithOllama(task: string, params: any): Promise<any> {
    // Mock Ollama processing
    logger.info('Processing with Ollama', { task, params: Object.keys(params) });
    
    switch (task) {
      case 'analyze':
        return {
          issues: ['Mock issue 1', 'Mock issue 2'],
          suggestions: ['Mock suggestion 1'],
          complexity: 'medium',
          quality_score: 0.8
        };
      case 'cleanup':
        return {
          cleaned_code: params.code + '\n// Cleaned by Ollama',
          changes_made: ['Added semicolons', 'Fixed indentation'],
          improvement_score: 0.15
        };
      case 'structure':
        return {
          suggested_structure: {
            'src/': ['main.js', 'utils.js'],
            'tests/': ['main.test.js'],
            'docs/': ['README.md']
          },
          reasoning: 'Standard project structure'
        };
      case 'generate':
        return {
          generated_content: `// Generated by Ollama\n// ${params.prompt}\nfunction example() {\n  return "Hello World";\n}`,
          explanation: 'Generated example function'
        };
      default:
        throw new Error(`Unknown task: ${task}`);
    }
  }

  private async processWithClaude(task: string, params: any): Promise<any> {
    // Mock Claude processing - would call actual Claude API
    logger.info('Processing with Claude', { task, params: Object.keys(params) });
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    switch (task) {
      case 'analyze':
        return {
          issues: ['Detailed issue 1', 'Detailed issue 2', 'Performance concern'],
          suggestions: ['Detailed suggestion 1', 'Architectural improvement'],
          complexity: 'medium-high',
          quality_score: 0.85,
          security_issues: [],
          performance_issues: ['Memory allocation concern']
        };
      case 'cleanup':
        return {
          cleaned_code: params.code.replace(/\s+/g, ' ').trim() + '\n// Enhanced by Claude',
          changes_made: ['Optimized imports', 'Improved variable naming', 'Added type hints'],
          improvement_score: 0.25,
          explanation: 'Applied best practices and optimizations'
        };
      case 'structure':
        return {
          suggested_structure: {
            'src/': {
              'components/': ['Header.jsx', 'Footer.jsx'],
              'services/': ['api.js', 'auth.js'],
              'utils/': ['helpers.js']
            },
            'tests/': {
              'unit/': ['components.test.js'],
              'integration/': ['api.test.js']
            },
            'docs/': ['README.md', 'API.md']
          },
          reasoning: 'Modern React project structure with separation of concerns'
        };
      case 'generate':
        return {
          generated_content: `// Generated by Claude\n// ${params.prompt}\n\nfunction sophisticatedExample(input) {\n  // Validate input\n  if (!input) {\n    throw new Error('Input is required');\n  }\n  \n  // Process and return\n  return \`Processed: \${input}\`;\n}`,
          explanation: 'Generated robust function with error handling'
        };
      default:
        throw new Error(`Unknown task: ${task}`);
    }
  }

  private async processWithOpenAI(task: string, params: any): Promise<any> {
    // Mock OpenAI processing - would call actual OpenAI API
    logger.info('Processing with OpenAI', { task, params: Object.keys(params) });
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    switch (task) {
      case 'analyze':
        return {
          issues: ['OpenAI detected issue 1', 'Code smell detected'],
          suggestions: ['Refactor suggestion', 'Performance optimization'],
          complexity: 'medium',
          quality_score: 0.82
        };
      case 'cleanup':
        return {
          cleaned_code: params.code + '\n// Optimized by OpenAI',
          changes_made: ['Simplified logic', 'Removed redundancy'],
          improvement_score: 0.20
        };
      case 'structure':
        return {
          suggested_structure: {
            'app/': ['main.py', 'config.py'],
            'tests/': ['test_main.py'],
            'requirements.txt': null
          },
          reasoning: 'Python project structure'
        };
      case 'generate':
        return {
          generated_content: `# Generated by OpenAI\n# ${params.prompt}\n\ndef smart_function(data):\n    \"\"\"Process data intelligently.\"\"\"\n    return [item for item in data if item]`,
          explanation: 'Generated Pythonic solution'
        };
      default:
        throw new Error(`Unknown task: ${task}`);
    }
  }

  isOllamaAvailable(): boolean {
    return this.ollamaAvailable;
  }
}