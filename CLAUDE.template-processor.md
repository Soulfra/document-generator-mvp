# CLAUDE.template-processor.md - Template Processing Instructions

Specialized instructions for working with the template processing system.

## 🎯 Template Processor Overview

The template processor (from `/mcp`) transforms chat conversations and documents into professional templates with real-time AI reasoning transparency.

## 📁 Template Categories

```
templates/
├── business-ideas/          # Startup & business concepts
├── technical-architecture/  # System design docs
├── ux-ui-design/           # Design documents
├── marketing-growth/       # Marketing plans
├── product-roadmaps/       # Product planning
├── process-optimization/   # Business processes
├── data-analytics/         # Analytics reports
└── content-strategy/       # Content plans
```

## 🔧 Template Processing Pipeline

```typescript
// Template processing flow
export class TemplateProcessor {
  async processDocument(input: DocumentInput): Promise<TemplateOutput> {
    // 1. Extract key insights from document
    const insights = await this.extractInsights(input);
    
    // 2. Determine template category
    const category = await this.categorizeContent(insights);
    
    // 3. Select appropriate template
    const template = await this.selectTemplate(category, insights);
    
    // 4. Generate content with AI
    const content = await this.generateContent(template, insights);
    
    // 5. Format for export
    return this.formatOutput(content, input.exportFormats);
  }
}
```

## 📋 Available Templates

### Business Templates
- `startup-pitch-deck` - YC-style pitch deck
- `business-model-canvas` - BMC template
- `executive-summary` - One-page summary
- `market-analysis` - Market research doc

### Technical Templates
- `technical-spec` - Detailed technical specification
- `api-documentation` - OpenAPI/REST docs
- `architecture-diagram` - System design
- `database-schema` - ERD and schemas

### Development Templates
- `mvp-scaffold` - Basic app structure
- `microservice-template` - Service boilerplate
- `frontend-app` - React/Vue/Angular starter
- `api-backend` - Express/FastAPI backend

## 🤖 AI Enhancement Patterns

### Progressive Enhancement
```typescript
// Start with Ollama, escalate if needed
const generateContent = async (template, insights) => {
  // Try local Ollama first
  let result = await ollama.generate({
    model: 'mistral',
    prompt: buildPrompt(template, insights),
    temperature: 0.7
  });
  
  // If confidence low, try Claude
  if (result.confidence < 0.8) {
    result = await anthropic.generate({
      model: 'claude-3',
      prompt: enhancedPrompt(template, insights)
    });
  }
  
  return result;
};
```

### Template Matching Logic
```typescript
// Smart template selection based on content
const selectTemplate = async (category, insights) => {
  const templates = await getTemplatesForCategory(category);
  
  // Score each template based on content match
  const scores = templates.map(template => ({
    template,
    score: calculateMatchScore(template, insights)
  }));
  
  // Return best match
  return scores.sort((a, b) => b.score - a.score)[0].template;
};
```

## 📤 Export Formats

### Supported Formats
- **PDF** - Professional documents with styling
- **PowerPoint** - Presentation slides
- **Markdown** - Developer-friendly format
- **HTML** - Web-ready with CSS
- **JSON** - Structured data
- **YAML** - Configuration format
- **Notion** - Import-ready format
- **Word** - DOCX with formatting

### Export Configuration
```typescript
export interface ExportConfig {
  format: ExportFormat;
  styling?: {
    theme: 'professional' | 'modern' | 'minimal';
    colors?: ColorScheme;
    fonts?: FontConfig;
  };
  metadata?: {
    author?: string;
    company?: string;
    date?: Date;
  };
}
```

## 🔄 Real-time Processing

### WebSocket Events
```typescript
// Emit processing updates
ws.emit('processing:start', { documentId, totalSteps: 5 });
ws.emit('processing:insight', { insight, confidence });
ws.emit('processing:template-selected', { template, match: 0.92 });
ws.emit('processing:generating', { progress: 0.45 });
ws.emit('processing:complete', { result, exportLinks });
```

### Client Integration
```javascript
// Listen for real-time updates
const ws = new WebSocket('ws://localhost:8081/template-processing');

ws.on('processing:insight', (data) => {
  console.log('Found insight:', data.insight);
  updateUI('insights', data);
});
```

## 💾 Template Storage

### Template Structure
```yaml
# template.yaml
id: startup-pitch-deck
name: Startup Pitch Deck
category: business-ideas
description: YC-style pitch deck template
sections:
  - problem
  - solution
  - market
  - business-model
  - team
  - traction
  - financials
  - ask
prompts:
  problem: "Extract the core problem being solved..."
  solution: "Identify the proposed solution..."
```

### Custom Templates
```typescript
// Register custom template
await templateRegistry.register({
  id: 'custom-template',
  name: 'My Custom Template',
  category: 'custom',
  sections: [...],
  prompts: {...},
  exportFormats: ['pdf', 'notion']
});
```

## 🎨 Template Customization

### Dynamic Sections
```typescript
// Add/remove sections based on content
if (insights.hasFinancialData) {
  template.addSection('financial-projections');
}

if (!insights.hasTeamInfo) {
  template.removeSection('team');
}
```

### Style Customization
```typescript
// Apply custom styling
const styled = await styleEngine.apply(template, {
  brandColors: ['#FF6B6B', '#4ECDC4'],
  font: 'Inter',
  layout: 'modern-minimal'
});
```

## 📊 Quality Metrics

### Template Quality Score
- **Completeness**: All sections filled (0-100%)
- **Relevance**: Content matches template (0-1.0)
- **Clarity**: Readability score (0-100)
- **Structure**: Logical flow (0-1.0)

### Monitoring
```typescript
// Track template usage and quality
await analytics.track('template:processed', {
  templateId: template.id,
  qualityScore: calculateQuality(result),
  processingTime: endTime - startTime,
  exportFormats: formats,
  userSatisfaction: feedback?.rating
});
```

## 🚀 Performance Optimization

### Caching Strategy
```typescript
// Cache template results
const cacheKey = `template:${templateId}:${contentHash}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

// Process and cache
const result = await processTemplate(template, content);
await redis.setex(cacheKey, 3600, JSON.stringify(result));
```

### Parallel Processing
```typescript
// Process multiple sections in parallel
const sections = await Promise.all(
  template.sections.map(section => 
    processSection(section, insights)
  )
);
```

## 🔍 Common Issues & Solutions

### Template Not Matching
```typescript
// Fallback to generic template
if (matchScore < 0.5) {
  console.warn('Low match score, using generic template');
  return getGenericTemplate(category);
}
```

### Export Failures
```typescript
// Retry with simpler format
try {
  return await exportToPDF(content);
} catch (error) {
  console.error('PDF export failed, trying Markdown', error);
  return await exportToMarkdown(content);
}
```

### AI Generation Issues
```typescript
// Handle AI failures gracefully
const content = await generateWithRetry(
  template,
  insights,
  { maxRetries: 3, backoff: 'exponential' }
);
```

## 📚 Template Best Practices

1. **Keep templates focused** - One clear purpose per template
2. **Use clear prompts** - Specific instructions for AI
3. **Version templates** - Track changes over time
4. **Test with examples** - Validate with real documents
5. **Monitor usage** - Track which templates work best

---

*Template processor: Making documents beautiful and functional*