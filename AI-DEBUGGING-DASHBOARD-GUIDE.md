# 🧠 Unified AI Debugging Dashboard Guide

## Overview

The Unified AI Debugging Dashboard consolidates multiple AI providers (OpenAI, Anthropic, Gemini, Qwen, Kimi, DeepSeek, Ollama) into a single intelligent system that automatically handles failures, ranks providers by performance, and provides comprehensive debugging capabilities.

## Key Features

### 1. **Multi-Provider Support**
- **OpenAI**: GPT-4, GPT-3.5 Turbo
- **Anthropic**: Claude 3 Opus, Sonnet, Haiku
- **Google Gemini**: Gemini Pro, Pro Vision
- **Qwen**: 72B, 14B, 7B models
- **Kimi**: Chat and Code models
- **DeepSeek**: Coder models (33B, 6.7B)
- **Ollama**: Local models (Llama2, CodeLlama, Mistral, Mixtral)

### 2. **Intelligent Handoff System**
- Automatically switches between providers when one fails
- Ranks providers based on:
  - Success rate
  - Response time
  - Cost efficiency
  - Task-specific performance
  - Recent reliability

### 3. **Real-Time Monitoring**
- Live provider health status
- Success/failure rates
- Response time tracking
- Error pattern analysis
- Cost tracking per provider

### 4. **Debugging Features**
- Full request/response logging
- Error categorization
- Handoff chain visualization
- Performance metrics
- Daily report generation

## Quick Start

### 1. Install Dependencies
```bash
npm install express ws axios uuid
```

### 2. Configure API Keys
Create or update `.env` file:
```env
# Required
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Optional (providers will be disabled if not set)
GOOGLE_API_KEY=...
QWEN_API_KEY=...
KIMI_API_KEY=...
DEEPSEEK_API_KEY=...
```

### 3. Start the Dashboard
```bash
./launch-ai-debugging-dashboard.sh
```

Or directly:
```bash
node unified-ai-debugging-dashboard.js
```

### 4. Access the Dashboard
- **Web UI**: http://localhost:9500
- **WebSocket**: ws://localhost:9501
- **API**: http://localhost:9500/api

## API Endpoints

### Test with Auto-Handoff
```bash
POST /api/test
Content-Type: application/json

{
  "prompt": "Your question or task",
  "taskType": "general|code|debugging|analysis|reasoning",
  "preferredProvider": "openai|anthropic|gemini|etc" // optional
}
```

### Test Specific Provider
```bash
POST /api/test/:provider
Content-Type: application/json

{
  "prompt": "Your question or task",
  "model": "specific-model-name" // optional
}
```

### Get System Status
```bash
GET /api/status

Response:
{
  "providers": [...],
  "debugLog": [...],
  "rankings": [...],
  "errorPatterns": [...],
  "systemHealth": {...}
}
```

### Get Rankings
```bash
GET /api/rankings

Response: Detailed provider rankings with performance metrics
```

### Generate Debug Report
```bash
GET /api/report

Response: Comprehensive system analysis with recommendations
```

## Integration with Business Services

The dashboard integrates with your existing services:

### Business Accounting (Port 3013)
```javascript
const integrator = require('./ai-debugging-service-integrator');

// Process transaction with AI error handling
const result = await integrator.processTransaction({
  date: '2024-01-30',
  amount: 1000,
  category: 'revenue',
  description: 'Client payment'
});
```

### Tax Intelligence (Port 3014)
```javascript
// Calculate taxes with AI assistance
const taxes = await integrator.calculateTaxes({
  income: 100000,
  deductions: ['home-office', 'equipment'],
  cryptoTransactions: [...]
});
```

### Wallet Manager (Port 3015)
```javascript
// Track wallet with intelligent error recovery
const tracking = await integrator.trackWalletAddress({
  address: '0x...',
  chain: 'ethereum',
  label: 'Business Wallet'
});
```

## Task Type Routing

The system intelligently routes requests based on task type:

### Code Tasks
- **Preferred**: DeepSeek, OpenAI, Ollama (CodeLlama)
- **Use for**: Code generation, debugging, refactoring

### Analysis Tasks
- **Preferred**: Anthropic, Gemini
- **Use for**: Business analysis, data interpretation

### Financial Tasks
- **Preferred**: Anthropic, OpenAI
- **Use for**: Tax calculations, financial analysis

### General Tasks
- **Preferred**: Local models first (cost-free)
- **Use for**: General questions, summaries

## Error Handling Strategies

### Rate Limiting
- Automatically switches to another provider
- Implements exponential backoff
- Tracks rate limit patterns

### Timeouts
- Increases timeout on retry
- Switches to faster providers
- Logs slow providers

### Authentication Errors
- Disables the provider
- Notifies about invalid API keys
- Continues with other providers

### Server Errors
- Retries with backoff
- Switches providers after 2 failures
- Logs error patterns

## Cost Optimization

1. **Local Models First**: Ollama models have zero cost
2. **Caching**: Responses are cached for 1 hour
3. **Smart Routing**: Cheaper providers for simple tasks
4. **Budget Limits**: Set daily/hourly cost limits
5. **Usage Tracking**: Monitor costs per provider

## Performance Optimization

1. **Parallel Health Checks**: All providers checked simultaneously
2. **WebSocket Updates**: Real-time dashboard updates
3. **Request Queuing**: Prevents overwhelming providers
4. **Connection Pooling**: Reuses HTTP connections
5. **Response Streaming**: For supported providers

## Debugging Workflow

### 1. Identify Issues
- Check the dashboard for red/yellow indicators
- Review error patterns section
- Look at recent debug logs

### 2. Test Providers
- Use "Test All Providers" to benchmark
- Test specific providers individually
- Compare response times and quality

### 3. Analyze Reports
- Generate debugging report
- Review recommendations
- Check cost analysis

### 4. Optimize Configuration
- Adjust provider priorities
- Update task routing rules
- Set provider-specific limits

## Advanced Configuration

### Custom Provider Addition
```javascript
// In unified-ai-debugging-dashboard.js
const customProvider = {
    name: 'Custom AI',
    models: ['custom-model-1'],
    endpoint: 'https://api.custom.ai/v1/chat',
    headers: { 'Authorization': `Bearer ${process.env.CUSTOM_API_KEY}` },
    maxRetries: 2,
    timeout: 30000,
    costPerToken: 0.001,
    specialties: ['domain-specific']
};
```

### Task Type Configuration
```javascript
// In ai-debugging-config.json
"taskTypeRouting": {
  "custom-task": {
    "preferredProviders": ["custom", "anthropic"],
    "requiredCapabilities": ["specific-capability"]
  }
}
```

## Monitoring & Alerts

### Health Monitoring
- Providers checked every 30 seconds
- Automatic status updates
- Health percentage calculations

### Performance Tracking
- Response time percentiles
- Success rate trends
- Cost projections

### Alert Thresholds
- Provider failure rate > 30%
- System failure rate > 50%
- Response time P95 > 10s
- Hourly cost > $10

## Troubleshooting

### Dashboard Won't Start
```bash
# Check if port is in use
lsof -i :9500

# Check dependencies
npm list express ws axios uuid

# Check logs
node unified-ai-debugging-dashboard.js
```

### Providers Show as Offline
1. Verify API keys in `.env`
2. Check network connectivity
3. Test provider endpoints directly
4. Review error logs in dashboard

### High Error Rates
1. Generate debugging report
2. Check error patterns
3. Review provider-specific errors
4. Adjust retry/timeout settings

### Slow Performance
1. Check provider rankings
2. Disable slow providers
3. Increase local model usage
4. Review task routing rules

## Best Practices

1. **Start with Ollama**: Install local models for zero-cost baseline
2. **Set API Keys Properly**: Use `.env` file, never commit keys
3. **Monitor Daily**: Check dashboard regularly for issues
4. **Review Reports**: Generate weekly analysis reports
5. **Optimize Routing**: Adjust task routing based on performance
6. **Cache Wisely**: Enable caching for repeated queries
7. **Handle Failures**: Let the system handle provider failures
8. **Track Costs**: Monitor spending across providers

## Example Integration Script

```javascript
#!/usr/bin/env node

const axios = require('axios');

async function smartAIRequest(prompt, taskType = 'general') {
    try {
        // Use the debugging dashboard with auto-handoff
        const response = await axios.post('http://localhost:9500/api/test', {
            prompt,
            taskType,
            preferredProvider: null // Let system choose
        });
        
        console.log(`Success! Provider: ${response.data.provider}`);
        console.log(`Response: ${response.data.response}`);
        console.log(`Cost: $${response.data.cost || 0}`);
        console.log(`Latency: ${response.data.latency}ms`);
        
        if (response.data.handoffChain) {
            console.log(`Handoff chain: ${response.data.handoffChain.join(' → ')}`);
        }
        
        return response.data;
        
    } catch (error) {
        console.error('All AI providers failed:', error.message);
        return null;
    }
}

// Example usage
smartAIRequest('Explain quantum computing simply', 'general')
    .then(result => console.log('Done!'));
```

## System Architecture

```
┌─────────────────────┐     ┌─────────────────────┐
│   Your Business     │────▶│   AI Debugging      │
│     Services        │     │    Dashboard        │
└─────────────────────┘     └──────────┬──────────┘
                                       │
                  ┌────────────────────┼────────────────────┐
                  │                    │                    │
           ┌──────▼──────┐      ┌──────▼──────┐     ┌──────▼──────┐
           │   OpenAI    │      │  Anthropic  │     │   Gemini    │
           └─────────────┘      └─────────────┘     └─────────────┘
                  │                    │                    │
           ┌──────▼──────┐      ┌──────▼──────┐     ┌──────▼──────┐
           │    Qwen     │      │    Kimi     │     │  DeepSeek   │
           └─────────────┘      └─────────────┘     └─────────────┘
                                       │
                                ┌──────▼──────┐
                                │   Ollama    │
                                │  (Local)    │
                                └─────────────┘
```

## Future Enhancements

1. **Model Fine-tuning**: Track which models work best for specific tasks
2. **Automated Optimization**: Self-adjusting routing rules
3. **Collaborative Filtering**: Learn from all users' success patterns
4. **Predictive Scaling**: Anticipate load and pre-warm providers
5. **Custom Scoring**: User-defined ranking algorithms
6. **Webhook Integration**: Real-time alerts for critical issues
7. **GraphQL API**: More flexible querying of metrics
8. **Provider Pools**: Multiple accounts per provider for higher limits

---

Remember: The goal is **intelligent automation**. Let the system handle provider selection, error recovery, and optimization while you focus on building your business logic.