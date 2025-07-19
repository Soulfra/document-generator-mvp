# CLAUDE.ai-services.md - AI Services Integration Guide

Specialized instructions for integrating and managing AI services in the Document Generator.

## 🤖 AI Service Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   AI Router     │────▶│  Local Ollama   │────▶│  Cloud APIs     │
│  (Decision)     │     │  (First Try)    │     │  (Fallback)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                       │
         └───────────────────────┴───────────────────────┘
                                 │
                        ┌─────────────────┐
                        │  Result Cache   │
                        │    (Redis)      │
                        └─────────────────┘
```

## 🔧 AI Service Configuration

### Service Registry
```typescript
const aiServices = {
  ollama: {
    url: 'http://localhost:11434',
    models: ['codellama:7b', 'mistral', 'llama2'],
    priority: 1,
    costPerToken: 0,
    capabilities: ['code', 'text', 'analysis']
  },
  anthropic: {
    url: 'https://api.anthropic.com',
    models: ['claude-3-opus', 'claude-3-sonnet'],
    priority: 2,
    costPerToken: 0.015,
    capabilities: ['code', 'text', 'analysis', 'vision']
  },
  openai: {
    url: 'https://api.openai.com',
    models: ['gpt-4', 'gpt-3.5-turbo'],
    priority: 3,
    costPerToken: 0.03,
    capabilities: ['code', 'text', 'analysis', 'vision', 'audio']
  }
};
```

## 🎯 Model Selection Strategy

### Progressive Enhancement
```typescript
export class AIRouter {
  async selectModel(task: AITask): Promise<AIModel> {
    // 1. Check task requirements
    const requirements = this.analyzeTask(task);
    
    // 2. Start with cheapest option
    if (requirements.complexity === 'low') {
      return this.ollama.getModel('mistral');
    }
    
    // 3. Escalate based on needs
    if (requirements.needsVision) {
      return this.anthropic.getModel('claude-3-opus');
    }
    
    // 4. Use GPT-4 for complex code generation
    if (requirements.complexity === 'high' && requirements.type === 'code') {
      return this.openai.getModel('gpt-4');
    }
    
    // Default to Ollama codellama
    return this.ollama.getModel('codellama:7b');
  }
}
```

### Cost Optimization
```typescript
// Track and optimize costs
const costTracker = {
  async executeWithBudget(task: AITask, maxCost: number) {
    const estimatedCost = this.estimateCost(task);
    
    if (estimatedCost > maxCost) {
      // Downgrade to cheaper model
      task.model = this.getCheaperAlternative(task.model);
    }
    
    const result = await this.execute(task);
    
    // Track actual cost
    await this.recordCost(task, result.tokensUsed);
    
    return result;
  }
};
```

## 🚀 Ollama Integration

### Model Management
```bash
# Required Ollama models
ollama pull codellama:7b      # Code generation
ollama pull mistral           # General text processing
ollama pull llama2            # Fallback model
ollama pull phi               # Lightweight tasks
```

### Ollama API Patterns
```typescript
// Basic completion
const ollamaComplete = async (prompt: string) => {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    body: JSON.stringify({
      model: 'codellama',
      prompt,
      temperature: 0.7,
      top_p: 0.9,
      stream: false
    })
  });
  
  return response.json();
};

// Streaming response
const ollamaStream = async (prompt: string, onChunk: Function) => {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    body: JSON.stringify({
      model: 'mistral',
      prompt,
      stream: true
    })
  });
  
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    const data = JSON.parse(chunk);
    onChunk(data.response);
  }
};
```

## 🌐 Cloud AI Integration

### Anthropic Claude
```typescript
// Claude integration with retry logic
const claudeClient = {
  async complete(prompt: string, options = {}) {
    return retry(async () => {
      const response = await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options.maxTokens || 4096,
        temperature: options.temperature || 0.7
      });
      
      return response.content[0].text;
    }, {
      retries: 3,
      onRetry: (error) => console.warn('Claude retry:', error)
    });
  }
};
```

### OpenAI GPT
```typescript
// OpenAI with function calling
const openaiClient = {
  async generateCode(specification: string) {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are an expert programmer.' },
        { role: 'user', content: specification }
      ],
      functions: [{
        name: 'generate_code',
        parameters: {
          type: 'object',
          properties: {
            language: { type: 'string' },
            code: { type: 'string' },
            dependencies: { type: 'array' }
          }
        }
      }],
      function_call: { name: 'generate_code' }
    });
    
    return JSON.parse(completion.choices[0].function_call.arguments);
  }
};
```

## 💾 Response Caching

### Cache Strategy
```typescript
class AICache {
  private redis: Redis;
  private ttl = 3600; // 1 hour default
  
  async get(prompt: string, model: string): Promise<string | null> {
    const key = this.generateKey(prompt, model);
    return this.redis.get(key);
  }
  
  async set(prompt: string, model: string, response: string) {
    const key = this.generateKey(prompt, model);
    await this.redis.setex(key, this.ttl, response);
  }
  
  private generateKey(prompt: string, model: string): string {
    const hash = crypto.createHash('sha256')
      .update(`${model}:${prompt}`)
      .digest('hex');
    return `ai:cache:${hash}`;
  }
}
```

## 📊 Performance Monitoring

### Metrics Collection
```typescript
const aiMetrics = {
  async trackRequest(service: string, model: string, metrics: Metrics) {
    await prometheus.observe('ai_request_duration', metrics.duration, {
      service,
      model,
      success: metrics.success
    });
    
    await prometheus.increment('ai_tokens_used', metrics.tokensUsed, {
      service,
      model
    });
    
    await prometheus.observe('ai_request_cost', metrics.cost, {
      service,
      model
    });
  }
};
```

### Health Checks
```typescript
// Service health monitoring
const healthChecks = {
  ollama: async () => {
    try {
      const response = await fetch('http://localhost:11434/api/tags');
      const data = await response.json();
      return { healthy: true, models: data.models };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  },
  
  anthropic: async () => {
    try {
      await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        messages: [{ role: 'user', content: 'test' }],
        max_tokens: 1
      });
      return { healthy: true };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }
};
```

## 🔄 Prompt Engineering

### Document Analysis Prompts
```typescript
const prompts = {
  extractRequirements: (document: string) => `
    Analyze this document and extract:
    1. Core requirements
    2. Technical specifications
    3. User stories
    4. Success criteria
    
    Document:
    ${document}
    
    Return as structured JSON.
  `,
  
  generateCode: (spec: string, language: string) => `
    Generate production-ready ${language} code for:
    ${spec}
    
    Include:
    - Error handling
    - Input validation
    - Documentation
    - Tests
    
    Follow best practices and modern patterns.
  `
};
```

### Prompt Optimization
```typescript
// Optimize prompts for each model
const optimizePrompt = (prompt: string, model: string): string => {
  switch (model) {
    case 'ollama/codellama':
      return `### Instruction:\n${prompt}\n### Response:`;
    
    case 'anthropic/claude':
      return `Human: ${prompt}\n\nAssistant:`;
    
    case 'openai/gpt-4':
      return prompt; // GPT-4 handles raw prompts well
    
    default:
      return prompt;
  }
};
```

## 🛡️ Error Handling

### Graceful Degradation
```typescript
class AIServiceManager {
  async processWithFallback(task: AITask): Promise<AIResult> {
    const services = this.getServicesInOrder();
    
    for (const service of services) {
      try {
        return await service.process(task);
      } catch (error) {
        console.error(`${service.name} failed:`, error);
        
        if (service === services[services.length - 1]) {
          // Last service, no more fallbacks
          throw new Error('All AI services failed');
        }
        
        // Try next service
        continue;
      }
    }
  }
}
```

### Rate Limiting
```typescript
// Implement rate limiting for cloud services
const rateLimiter = {
  anthropic: new RateLimiter({
    tokensPerInterval: 100000,
    interval: 'minute'
  }),
  
  openai: new RateLimiter({
    tokensPerInterval: 150000,
    interval: 'minute'
  })
};
```

## 🔧 BYOK (Bring Your Own Keys)

### Key Management
```typescript
interface UserAIKeys {
  anthropic?: string;
  openai?: string;
  azure?: string;
}

class BYOKManager {
  async setUserKeys(userId: string, keys: UserAIKeys) {
    // Encrypt keys before storage
    const encrypted = await this.encrypt(keys);
    await this.store.set(`user:${userId}:keys`, encrypted);
  }
  
  async getUserClient(userId: string, service: string) {
    const keys = await this.getUserKeys(userId);
    
    if (!keys[service]) {
      throw new Error(`No ${service} key configured`);
    }
    
    return this.createClient(service, keys[service]);
  }
}
```

## 📈 Usage Analytics

### Track AI Usage
```typescript
const usageTracker = {
  async record(userId: string, usage: AIUsage) {
    await db.aiUsage.create({
      data: {
        userId,
        service: usage.service,
        model: usage.model,
        tokensUsed: usage.tokens,
        cost: usage.cost,
        purpose: usage.purpose,
        timestamp: new Date()
      }
    });
    
    // Update user quotas
    await this.updateQuotas(userId, usage);
  }
};
```

## 🚀 Best Practices

1. **Always start with Ollama** - It's free and often sufficient
2. **Cache aggressively** - Same prompts often yield same results
3. **Monitor costs** - Track usage per user/feature
4. **Implement timeouts** - Don't wait forever for responses
5. **Log everything** - For debugging and optimization
6. **Version prompts** - Track what works best
7. **Test fallbacks** - Ensure graceful degradation

---

*AI Services: Making intelligence accessible and affordable*