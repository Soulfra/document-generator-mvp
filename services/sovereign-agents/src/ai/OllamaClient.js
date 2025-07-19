/**
 * Ollama Client - Local AI processing integration
 */

const EventEmitter = require('events');
const fetch = require('node-fetch');

class OllamaClient extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      baseUrl: options.baseUrl || 'http://localhost:11434',
      defaultModel: options.defaultModel || 'mistral',
      timeout: options.timeout || 30000,
      maxRetries: options.maxRetries || 3,
      ...options
    };

    this.models = new Map();
    this.requestQueue = [];
    this.processing = false;
    this.metrics = {
      requestCount: 0,
      successCount: 0,
      errorCount: 0,
      averageResponseTime: 0,
      totalTokensProcessed: 0
    };
  }

  /**
   * Initialize Ollama client and check available models
   */
  async initialize() {
    try {
      console.log('🤖 Initializing Ollama client...');
      
      // Check if Ollama is running
      const isRunning = await this.healthCheck();
      if (!isRunning) {
        throw new Error('Ollama service not available');
      }

      // Load available models
      await this.loadAvailableModels();

      console.log('✅ Ollama client initialized successfully');
      
      this.emit('initialized', {
        modelsAvailable: this.models.size,
        baseUrl: this.options.baseUrl
      });

      return true;

    } catch (error) {
      console.error('❌ Failed to initialize Ollama client:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Check if Ollama service is healthy
   */
  async healthCheck() {
    try {
      const response = await fetch(`${this.options.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Load available models from Ollama
   */
  async loadAvailableModels() {
    try {
      const response = await fetch(`${this.options.baseUrl}/api/tags`);
      const data = await response.json();

      this.models.clear();
      
      if (data.models) {
        for (const model of data.models) {
          this.models.set(model.name, {
            name: model.name,
            size: model.size,
            modified: model.modified_at,
            family: model.details?.family || 'unknown',
            capabilities: this.getModelCapabilities(model.name)
          });
        }
      }

      console.log(`📋 Loaded ${this.models.size} Ollama models:`, Array.from(this.models.keys()));

    } catch (error) {
      console.error('❌ Failed to load models:', error);
      throw error;
    }
  }

  /**
   * Get model capabilities based on name
   */
  getModelCapabilities(modelName) {
    const capabilities = {
      textGeneration: true,
      codeGeneration: false,
      analysis: true,
      reasoning: false,
      specialization: 'general'
    };

    if (modelName.includes('codellama') || modelName.includes('code')) {
      capabilities.codeGeneration = true;
      capabilities.specialization = 'code';
    }

    if (modelName.includes('llama2') || modelName.includes('llama-2')) {
      capabilities.reasoning = true;
      capabilities.specialization = 'reasoning';
    }

    if (modelName.includes('mistral')) {
      capabilities.analysis = true;
      capabilities.reasoning = true;
      capabilities.specialization = 'analysis';
    }

    return capabilities;
  }

  /**
   * Generate completion using Ollama
   */
  async generate(prompt, options = {}) {
    const startTime = Date.now();
    this.metrics.requestCount++;

    try {
      const model = options.model || this.selectBestModel(options.task);
      
      if (!this.models.has(model)) {
        throw new Error(`Model '${model}' not available. Available models: ${Array.from(this.models.keys()).join(', ')}`);
      }

      console.log(`🧠 Generating with ${model}...`);

      const requestBody = {
        model,
        prompt,
        temperature: options.temperature || 0.7,
        top_p: options.top_p || 0.9,
        max_tokens: options.max_tokens || 2048,
        stream: false,
        ...options.modelParams
      };

      const response = await this.makeRequest('/api/generate', requestBody);
      
      const duration = Date.now() - startTime;
      this.updateMetrics(duration, true);

      const result = {
        text: response.response,
        model: response.model,
        tokens: this.estimateTokens(prompt + response.response),
        duration,
        done: response.done,
        metadata: {
          eval_count: response.eval_count,
          eval_duration: response.eval_duration,
          prompt_eval_count: response.prompt_eval_count,
          prompt_eval_duration: response.prompt_eval_duration
        }
      };

      this.emit('generation:completed', {
        model,
        tokens: result.tokens,
        duration,
        success: true
      });

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      this.updateMetrics(duration, false);
      
      console.error(`❌ Ollama generation failed:`, error);
      
      this.emit('generation:failed', {
        error: error.message,
        duration,
        model: options.model
      });

      throw error;
    }
  }

  /**
   * Stream generation from Ollama
   */
  async generateStream(prompt, options = {}, onChunk) {
    const model = options.model || this.selectBestModel(options.task);
    
    console.log(`🌊 Streaming generation with ${model}...`);

    const requestBody = {
      model,
      prompt,
      temperature: options.temperature || 0.7,
      stream: true,
      ...options.modelParams
    };

    try {
      const response = await fetch(`${this.options.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(this.options.timeout)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.response) {
              fullResponse += data.response;
              onChunk(data.response, data);
            }
          } catch (e) {
            // Skip invalid JSON lines
          }
        }
      }

      return {
        text: fullResponse,
        model,
        done: true
      };

    } catch (error) {
      console.error('❌ Streaming generation failed:', error);
      throw error;
    }
  }

  /**
   * Select best model for task
   */
  selectBestModel(task = 'general') {
    if (this.models.size === 0) {
      return this.options.defaultModel;
    }

    // Prioritize models based on task
    const taskPreferences = {
      'code': ['codellama', 'code'],
      'analysis': ['mistral', 'llama2'],
      'reasoning': ['llama2', 'mistral'],
      'general': ['mistral', 'llama2', 'codellama']
    };

    const preferred = taskPreferences[task] || taskPreferences.general;
    
    for (const preference of preferred) {
      for (const [modelName] of this.models) {
        if (modelName.includes(preference)) {
          return modelName;
        }
      }
    }

    // Return first available model
    return Array.from(this.models.keys())[0] || this.options.defaultModel;
  }

  /**
   * Make HTTP request to Ollama API
   */
  async makeRequest(endpoint, body, retries = 0) {
    try {
      const response = await fetch(`${this.options.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.options.timeout)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();

    } catch (error) {
      if (retries < this.options.maxRetries) {
        console.warn(`⚠️ Ollama request failed, retrying... (${retries + 1}/${this.options.maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retries + 1)));
        return this.makeRequest(endpoint, body, retries + 1);
      }
      throw error;
    }
  }

  /**
   * Estimate token count (rough approximation)
   */
  estimateTokens(text) {
    // Rough estimation: 1 token ≈ 4 characters for English
    return Math.ceil(text.length / 4);
  }

  /**
   * Update performance metrics
   */
  updateMetrics(duration, success) {
    if (success) {
      this.metrics.successCount++;
    } else {
      this.metrics.errorCount++;
    }

    // Update rolling average response time
    const totalRequests = this.metrics.successCount + this.metrics.errorCount;
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (totalRequests - 1) + duration) / totalRequests;
  }

  /**
   * Get available models
   */
  getAvailableModels() {
    return Array.from(this.models.entries()).map(([name, info]) => ({
      name,
      ...info
    }));
  }

  /**
   * Get client metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      modelsAvailable: this.models.size,
      isConnected: this.models.size > 0,
      baseUrl: this.options.baseUrl
    };
  }

  /**
   * Test model with simple prompt
   */
  async testModel(modelName = null) {
    const model = modelName || this.selectBestModel();
    const testPrompt = "Hello! Please respond with 'OK' to confirm you're working.";

    try {
      const result = await this.generate(testPrompt, { 
        model, 
        max_tokens: 10,
        temperature: 0.1
      });

      return {
        success: true,
        model,
        response: result.text,
        duration: result.duration,
        tokens: result.tokens
      };

    } catch (error) {
      return {
        success: false,
        model,
        error: error.message
      };
    }
  }

  /**
   * Pull model from Ollama registry
   */
  async pullModel(modelName) {
    console.log(`📥 Pulling model: ${modelName}...`);

    try {
      const response = await fetch(`${this.options.baseUrl}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName }),
        signal: AbortSignal.timeout(300000) // 5 minutes for model pull
      });

      if (!response.ok) {
        throw new Error(`Failed to pull model: ${response.statusText}`);
      }

      // Reload models after pull
      await this.loadAvailableModels();

      console.log(`✅ Model pulled successfully: ${modelName}`);
      return true;

    } catch (error) {
      console.error(`❌ Failed to pull model ${modelName}:`, error);
      throw error;
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    console.log('🧹 Cleaning up Ollama client...');
    this.models.clear();
    this.requestQueue = [];
    this.removeAllListeners();
  }
}

module.exports = OllamaClient;