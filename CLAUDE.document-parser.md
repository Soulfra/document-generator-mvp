# CLAUDE.document-parser.md - Document Parsing & Analysis Guide

Specialized instructions for parsing various document formats and extracting actionable insights.

## 📄 Document Parser Overview

The document parser extracts structured information from various formats to enable MVP generation.

```
Input Document → Format Detection → Content Extraction → AI Analysis → Structured Output
      ↓                ↓                   ↓                 ↓              ↓
   PDF/MD/TXT     Identify Type      Parse Content      Extract Info    JSON/Schema
   Chat Logs      Set Strategy       Clean & Split      Find Patterns   Ready for Gen
```

## 🔍 Supported Document Types

### Business Documents
```typescript
interface BusinessDocument {
  types: [
    'business-plan',      // Full business plans
    'pitch-deck',         // Presentation slides
    'executive-summary',  // Brief overviews
    'market-research',    // Analysis docs
    'product-spec',       // PRDs
  ];
  
  extractors: {
    vision: VisionExtractor;
    market: MarketAnalysisExtractor;
    features: FeatureExtractor;
    financials: FinancialExtractor;
  };
}
```

### Technical Documents
```typescript
interface TechnicalDocument {
  types: [
    'api-spec',          // OpenAPI/Swagger
    'system-design',     // Architecture docs
    'database-schema',   // ERDs and schemas
    'requirements-doc',  // Technical requirements
    'user-stories',      // Agile stories
  ];
  
  parsers: {
    openapi: OpenAPIParser;
    markdown: MarkdownParser;
    uml: UMLParser;
    code: CodeBlockParser;
  };
}
```

### Conversation Logs
```typescript
interface ConversationDocument {
  types: [
    'chat-export',       // WhatsApp/Slack exports
    'ai-conversation',   // ChatGPT/Claude logs
    'meeting-notes',     // Transcribed meetings
    'brainstorm-session' // Ideation sessions
  ];
  
  processors: {
    message: MessageParser;
    speaker: SpeakerIdentifier;
    topic: TopicExtractor;
    decision: DecisionFinder;
  };
}
```

## 🛠️ Parsing Pipeline

### 1. Format Detection
```typescript
export class FormatDetector {
  async detect(file: Buffer, filename: string): Promise<DocumentFormat> {
    // Check file extension
    const ext = path.extname(filename).toLowerCase();
    
    // Verify with magic bytes
    const magic = file.slice(0, 8).toString('hex');
    
    // Content analysis for ambiguous cases
    if (ext === '.txt') {
      return this.analyzeTextFormat(file);
    }
    
    return this.formatMap[ext] || 'unknown';
  }
  
  private analyzeTextFormat(content: Buffer): DocumentFormat {
    const text = content.toString('utf-8');
    
    // Check for markdown
    if (text.match(/^#{1,6}\s|^\*\s|^\d+\.\s/m)) {
      return 'markdown';
    }
    
    // Check for JSON
    try {
      JSON.parse(text);
      return 'json';
    } catch {}
    
    // Check for chat patterns
    if (text.match(/^\[\d{2}:\d{2}\]/m)) {
      return 'chat-log';
    }
    
    return 'plain-text';
  }
}
```

### 2. Content Extraction
```typescript
export class ContentExtractor {
  async extract(document: Document): Promise<ExtractedContent> {
    const strategy = this.getStrategy(document.format);
    
    // Format-specific extraction
    const raw = await strategy.extract(document);
    
    // Clean and normalize
    const cleaned = this.cleanContent(raw);
    
    // Split into sections
    const sections = this.splitSections(cleaned);
    
    // Extract metadata
    const metadata = this.extractMetadata(document, sections);
    
    return {
      content: cleaned,
      sections,
      metadata,
      format: document.format
    };
  }
  
  private cleanContent(raw: string): string {
    return raw
      .replace(/\r\n/g, '\n')           // Normalize line endings
      .replace(/\u00A0/g, ' ')          // Replace non-breaking spaces
      .replace(/\u2018|\u2019/g, "'")  // Smart quotes to regular
      .replace(/\u201C|\u201D/g, '"')  // Smart quotes to regular
      .trim();
  }
}
```

### 3. AI-Powered Analysis
```typescript
export class DocumentAnalyzer {
  async analyze(content: ExtractedContent): Promise<Analysis> {
    // Determine document intent
    const intent = await this.detectIntent(content);
    
    // Extract key information based on intent
    const extracted = await this.extractByIntent(content, intent);
    
    // Identify patterns and relationships
    const patterns = await this.findPatterns(extracted);
    
    // Generate structured output
    return this.structureAnalysis(intent, extracted, patterns);
  }
  
  private async detectIntent(content: ExtractedContent): Promise<Intent> {
    const prompt = `
      Analyze this document and determine its primary intent:
      - business_plan: Describing a business idea
      - technical_spec: Technical implementation details
      - product_design: Product features and UX
      - api_documentation: API endpoints and usage
      - project_proposal: Proposing a new project
      
      Document excerpt:
      ${content.content.slice(0, 2000)}
      
      Return only the intent type.
    `;
    
    const result = await this.ai.complete(prompt);
    return result.trim() as Intent;
  }
}
```

## 📊 Specialized Parsers

### PDF Parser
```typescript
export class PDFParser {
  async parse(buffer: Buffer): Promise<ParsedPDF> {
    const pdf = await pdfParse(buffer);
    
    return {
      text: pdf.text,
      pages: pdf.numpages,
      info: pdf.info,
      // Extract tables if present
      tables: await this.extractTables(buffer),
      // Extract images with OCR if needed
      images: await this.extractImages(buffer)
    };
  }
  
  private async extractTables(buffer: Buffer): Promise<Table[]> {
    // Use tabula-js or similar for table extraction
    const tables = await tabula.extractTables(buffer);
    
    return tables.map(table => ({
      headers: table[0],
      rows: table.slice(1),
      context: this.findTableContext(table)
    }));
  }
}
```

### Markdown Parser
```typescript
export class MarkdownParser {
  async parse(content: string): Promise<ParsedMarkdown> {
    // Parse with remark
    const ast = remark().parse(content);
    
    // Extract structure
    const structure = this.extractStructure(ast);
    
    // Find code blocks
    const codeBlocks = this.extractCodeBlocks(ast);
    
    // Extract links and references
    const references = this.extractReferences(ast);
    
    return {
      structure,
      codeBlocks,
      references,
      headings: structure.headings,
      sections: this.buildSections(ast)
    };
  }
  
  private extractCodeBlocks(ast: any): CodeBlock[] {
    const blocks: CodeBlock[] = [];
    
    visit(ast, 'code', (node) => {
      blocks.push({
        language: node.lang || 'text',
        content: node.value,
        lineNumber: node.position.start.line
      });
    });
    
    return blocks;
  }
}
```

### Chat Log Parser
```typescript
export class ChatLogParser {
  async parse(content: string): Promise<ParsedChat> {
    // Detect chat format
    const format = this.detectChatFormat(content);
    
    // Parse messages
    const messages = await this.parseMessages(content, format);
    
    // Identify participants
    const participants = this.extractParticipants(messages);
    
    // Extract topics and decisions
    const analysis = await this.analyzeConversation(messages);
    
    return {
      messages,
      participants,
      topics: analysis.topics,
      decisions: analysis.decisions,
      summary: analysis.summary
    };
  }
  
  private detectChatFormat(content: string): ChatFormat {
    // WhatsApp format
    if (content.match(/^\[\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}:\d{2}\]/m)) {
      return 'whatsapp';
    }
    
    // Slack export
    if (content.includes('"type":"message"')) {
      return 'slack';
    }
    
    // ChatGPT/Claude format
    if (content.match(/^(Human|User|Assistant|AI):/m)) {
      return 'ai-chat';
    }
    
    return 'generic';
  }
}
```

## 🎯 Information Extraction

### Feature Extraction
```typescript
export class FeatureExtractor {
  async extract(content: string): Promise<Feature[]> {
    const prompt = `
      Extract all features/functionalities mentioned in this document.
      For each feature, identify:
      1. Name
      2. Description
      3. Priority (if mentioned)
      4. Technical requirements
      5. User benefit
      
      Return as JSON array.
    `;
    
    const result = await this.ai.complete(prompt + '\n\n' + content);
    return JSON.parse(result);
  }
}
```

### Requirement Extraction
```typescript
export class RequirementExtractor {
  async extract(content: string): Promise<Requirements> {
    // Extract functional requirements
    const functional = await this.extractFunctional(content);
    
    // Extract non-functional requirements
    const nonFunctional = await this.extractNonFunctional(content);
    
    // Extract constraints
    const constraints = await this.extractConstraints(content);
    
    // Extract dependencies
    const dependencies = await this.extractDependencies(content);
    
    return {
      functional,
      nonFunctional,
      constraints,
      dependencies,
      priority: this.prioritizeRequirements(functional)
    };
  }
}
```

## 🔄 Pattern Recognition

### Code Pattern Detection
```typescript
export class PatternDetector {
  detectArchitecturePattern(content: string): ArchitecturePattern {
    const patterns = {
      microservices: /microservice|service.?oriented|distributed/i,
      monolithic: /monolith|single.?application/i,
      serverless: /serverless|lambda|function.?as.?a.?service/i,
      mvc: /model.?view.?controller|mvc/i,
      eventDriven: /event.?driven|pub.?sub|message.?queue/i
    };
    
    const matches = Object.entries(patterns)
      .map(([pattern, regex]) => ({
        pattern,
        score: (content.match(regex) || []).length
      }))
      .filter(m => m.score > 0)
      .sort((a, b) => b.score - a.score);
    
    return matches[0]?.pattern || 'unknown';
  }
}
```

## 💾 Output Generation

### Structured Output Format
```typescript
export interface ParsedDocument {
  // Document metadata
  metadata: {
    format: DocumentFormat;
    title?: string;
    author?: string;
    date?: Date;
    pages?: number;
    wordCount: number;
  };
  
  // Extracted content
  content: {
    summary: string;
    sections: Section[];
    features: Feature[];
    requirements: Requirements;
    architecture?: Architecture;
  };
  
  // Analysis results
  analysis: {
    intent: DocumentIntent;
    complexity: 'simple' | 'moderate' | 'complex';
    completeness: number; // 0-100
    mvpReadiness: number; // 0-100
    missingElements: string[];
  };
  
  // Recommendations
  recommendations: {
    templates: Template[];
    technologies: Technology[];
    nextSteps: string[];
  };
}
```

### Export Formats
```typescript
export class DocumentExporter {
  async export(parsed: ParsedDocument, format: ExportFormat) {
    switch (format) {
      case 'json':
        return JSON.stringify(parsed, null, 2);
      
      case 'yaml':
        return yaml.dump(parsed);
      
      case 'markdown':
        return this.toMarkdown(parsed);
      
      case 'html':
        return this.toHTML(parsed);
      
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }
}
```

## 🚨 Error Handling

### Parsing Errors
```typescript
export class ParsingErrorHandler {
  async handle(error: Error, document: Document): Promise<ParseResult> {
    // Log error for debugging
    console.error('Parsing error:', error, {
      format: document.format,
      size: document.size,
      preview: document.content?.slice(0, 100)
    });
    
    // Try fallback parser
    if (this.hasFallback(document.format)) {
      return this.tryFallback(document);
    }
    
    // Return partial result
    return {
      success: false,
      partial: true,
      content: this.extractWhatWeCan(document),
      error: error.message
    };
  }
}
```

## 📈 Quality Metrics

### Document Quality Score
```typescript
export class QualityScorer {
  score(parsed: ParsedDocument): QualityScore {
    const scores = {
      completeness: this.scoreCompleteness(parsed),
      clarity: this.scoreClarity(parsed),
      structure: this.scoreStructure(parsed),
      technical: this.scoreTechnicalDetail(parsed)
    };
    
    const overall = Object.values(scores)
      .reduce((a, b) => a + b, 0) / Object.keys(scores).length;
    
    return {
      overall,
      ...scores,
      recommendations: this.getRecommendations(scores)
    };
  }
}
```

## 🔍 Best Practices

1. **Handle encodings properly** - Detect and convert character encodings
2. **Set size limits** - Don't try to parse 100MB documents
3. **Cache parsed results** - Same document = same result
4. **Validate before parsing** - Check format and structure
5. **Extract incrementally** - Stream large documents
6. **Preserve formatting** - Keep important structure
7. **Log everything** - For debugging parsing issues

---

*Document Parser: Understanding your ideas, one document at a time*