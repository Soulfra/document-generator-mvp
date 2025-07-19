# CLAUDE.md - Document Generator AI Assistant Instructions

This file provides instructions and context for Claude Code CLI when working on the Document Generator project - a system that transforms documents into working MVPs using AI.

## 🎯 Project Mission

Transform any document (business plan, specification, chat log) into a working MVP in under 30 minutes using AI-powered code generation, template matching, and automated deployment.

## 🏗️ Project Architecture

```
Document Input → AI Analysis → Template Selection → Code Generation → MVP Output
     ↓               ↓                ↓                   ↓              ↓
  Markdown       Claude/GPT      MCP Templates      Ollama/AI      Docker/Deploy
   PDF/Text      Context          Service           Code Gen       Ready App
   Chat Logs     Extract          Catalog           Scaffold
```

## 📁 Key Project Paths

```
/Users/matthewmauer/Desktop/Document-Generator/
├── mcp/                        # MCP template processor service
├── FinishThisIdea/            # Document parsing and analysis
├── FinishThisIdea-Complete/   # Full platform with AI services
├── templates/                  # Service and MVP templates
├── CLAUDE.*.md                # Specialized memory files
└── docker-compose.yml         # Unified infrastructure
```

## 🔧 Core Services & Ports

- **Template Processor**: http://localhost:3000 (MCP)
- **AI API Service**: http://localhost:3001
- **Analytics Service**: http://localhost:3002
- **Platform Hub**: http://localhost:8080
- **WebSocket**: ws://localhost:8081
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **MinIO (S3)**: localhost:9000
- **Ollama**: http://localhost:11434

## 🚀 Common Commands

### Quick Start
```bash
# One-command setup (creates everything)
./setup-document-generator.sh

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Document Processing
```bash
# Process a document to MVP
./scripts/document-to-mvp.sh "path/to/document.md"

# Process chat logs
./scripts/chatlog-to-app.sh "conversation.json"

# Generate from business plan
./scripts/business-plan-to-saas.sh "plan.pdf"
```

### AI Model Management
```bash
# Pull required Ollama models
docker exec document-generator-ollama ollama pull codellama:7b
docker exec document-generator-ollama ollama pull mistral

# Check AI service health
curl http://localhost:3001/health
```

## 📝 Service-Specific Instructions

### Import specialized instructions based on task:
@CLAUDE.template-processor.md   # Template processing and generation
@CLAUDE.ai-services.md          # AI service integration
@CLAUDE.document-parser.md      # Document parsing and analysis

## 📚 Auto-Documentation System

The system automatically generates comprehensive documentation when components are completed, integrated with the tier-based architecture for persistent knowledge capture.

### Tier-Based Architecture Protection
```
Tier 3: Meta-Documentation    (git-tracked, permanent)
  ↑ symlinks ↑
Tier 2: Working Services      (can be regenerated from Tier 3)
  ↑ symlinks ↑  
Tier 1: Generated Output      (ephemeral, can be deleted safely)
```

### Auto-Documentation Features
- **Automatic Generation**: Docs create when all todos are completed
- **Reasoning Capture**: Extracts decision-making process from development
- **Component Discovery**: AI-searchable documentation with symlinks
- **Git Integration**: Links documentation to actual code changes
- **Multi-Format Output**: Main docs, API docs, reasoning logs, and CLAUDE guides

### Commands
```bash
# Idea management with auto-documentation
idea new "implement feature"      # Create new idea with git branch
idea todo "add specific task"     # Add todos to current idea
idea done 1                       # Mark todo complete (with reasoning)
idea docs:status                  # Check documentation readiness
idea docs:generate               # Generate documentation

# Symlink management
node symlink-manager.js list     # List all symlinks
node symlink-manager.js verify   # Verify symlinks are working
node symlink-manager.js cleanup  # Remove broken symlinks
```

### Integration with Existing System
- **Symlinks**: Auto-created from `/tier-3/templates/` to `/ai-os-clean/`
- **Documentation**: Available at `/docs/` via symlinks
- **Reasoning Database**: SQLite storage for AI reasoning and decisions
- **Git Branches**: Each idea becomes a git branch with complete history

Refer to:
- [AUTO_DOCUMENTATION_GUIDE.md](./FinishThisIdea/docs/AUTO_DOCUMENTATION_GUIDE.md) - Complete usage guide
- [REASONING_CAPTURE_GUIDE.md](./FinishThisIdea/docs/REASONING_CAPTURE_GUIDE.md) - Reasoning system guide
- [ARCHITECTURE_DISCOVERY.md](./FinishThisIdea/ARCHITECTURE_DISCOVERY.md) - Meta-architecture insights

## 🎨 Code Style & Patterns

### Document Processing Pattern
```typescript
// Every document processor follows this pattern
export class DocumentProcessor {
  async process(document: Document): Promise<MVPResult> {
    // 1. Extract context using AI
    const context = await this.extractContext(document);
    
    // 2. Match to appropriate template
    const template = await this.matchTemplate(context);
    
    // 3. Generate code using progressive AI
    const code = await this.generateCode(context, template);
    
    // 4. Package as deployable MVP
    return this.packageMVP(code);
  }
}
```

### AI Service Usage Pattern
```typescript
// Always try local Ollama first, then cloud
const result = await aiRouter.process({
  prompt: buildPrompt(input),
  preferLocal: true,
  fallbackToCloud: true,
  models: ['ollama/codellama', 'anthropic/claude-3', 'openai/gpt-4']
});
```

## 🔍 Key Features to Remember

1. **Progressive AI Enhancement**: Ollama → OpenAI → Anthropic
2. **Real-time Processing**: WebSocket updates during generation
3. **Multi-Format Support**: Markdown, PDF, JSON, chat logs
4. **Template Matching**: Smart selection based on document content
5. **One-Click Deploy**: Docker, Vercel, Railway, AWS
6. **Cost Tracking**: Monitor AI usage and optimize

## 📊 Current Project Status

- ✅ Core infrastructure (Docker, services)
- ✅ Template processor (MCP)
- ✅ AI services integration
- ✅ Document parsing
- 🚧 Unified interface
- 🚧 Deployment automation
- 📋 Additional templates

## 🎯 When Working on This Project

### Always Check First:
1. Is Docker running? (`docker ps`)
2. Are all services healthy? (`docker-compose ps`)
3. Is Ollama responsive? (`curl http://localhost:11434/api/tags`)
4. Any existing errors? (`docker-compose logs --tail=50`)

### Before Making Changes:
1. Check if similar functionality exists in `/mcp`, `/FinishThisIdea*` folders
2. Look for existing templates in `/templates`
3. Review service documentation in respective README files
4. Test with Ollama first before using cloud AI

### Common Tasks:
- **Add new template**: Create in `/templates`, register in processor
- **Improve AI prompts**: Update in service-specific prompt files
- **Add document type**: Extend parser, add context extractor
- **Optimize costs**: Check AI router configuration

## 🐛 Troubleshooting

### Service won't start
```bash
# Check logs
docker-compose logs [service-name]

# Restart specific service
docker-compose restart [service-name]

# Rebuild if needed
docker-compose build --no-cache [service-name]
```

### AI not responding
```bash
# Check Ollama
curl http://localhost:11434/api/tags

# Check API keys in .env
grep -E "ANTHROPIC|OPENAI" .env

# Test AI service directly
curl -X POST http://localhost:3001/ai/test
```

### Database issues
```bash
# Run migrations
docker-compose exec app npm run prisma:migrate

# Reset database (careful!)
docker-compose exec app npm run prisma:reset
```

## 💡 Tips & Best Practices

1. **Use local AI first**: Ollama is free and often sufficient
2. **Cache aggressively**: Redis for API responses, MinIO for generated code
3. **Template reuse**: Check existing templates before creating new ones
4. **Monitor costs**: Track AI API usage in analytics dashboard
5. **Test locally**: Use docker-compose for full environment

## 🔗 Quick Links

- Template Gallery: http://localhost:3000/templates
- AI Service Docs: http://localhost:3001/docs
- Analytics Dashboard: http://localhost:3002
- Platform Hub: http://localhost:8080

## 📚 Additional Resources

- Original Research: `finishthisidea-research.md`
- Technical Spec: `complete_technical_specification.md`
- Business Models: Various `*_model.md` files
- Example Projects: `/examples` directory

---

**Remember**: The goal is to make MVP creation as simple as uploading a document. Every decision should reduce friction and time-to-MVP.

*Last Updated: 2025-06-29*
*Version: 1.0.0*