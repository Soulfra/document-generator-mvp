# CLAUDE.md - Enhanced AI Context System for FinishThisIdea

This file provides comprehensive context for AI assistants (Claude, Cursor, GitHub Copilot) working on FinishThisIdea. It implements an advanced version of the "one file" AI context approach.

## 🧠 Personal Context & Working Style

### About Me (The Developer)
- **Goal**: Build FinishThisIdea to help developers transform messy code into production-ready apps
- **Philosophy**: Documentation first, automation always, quality over speed
- **Frustrations**: Stub files, TODO comments, incomplete work, deep nesting, disconnected systems
- **Preferences**: Clean architecture, visual progress tracking, automated workflows

### How I Work
- I want systems that track everything automatically (no manual memory updates)
- I prefer seeing real-time progress (dashboards, status updates)
- I hate repeating myself - if we learn something, encode it in automation
- I believe in eating our own dog food - use our tools to build our tools
- Documentation must be 100% complete before implementation

### Communication Style
- Be direct and concise - no fluff
- Show me commands I can run
- Explain WHY something isn't working, not just that it failed
- If you create something, it better be production-ready

## 🎯 Project Overview

**FinishThisIdea** transforms messy, incomplete codebases into production-ready applications using AI.

### Core Value Proposition
"From chaos to clarity in minutes, not months" - but we practice what we preach by documenting everything FIRST.

### How It Works
1. **Upload** - User drops their messy codebase (ZIP/TAR)
2. **Pay** - Simple $1 Stripe payment (no account needed)
3. **Process** - AI cleans and improves the code progressively
4. **Review** - Tinder-style swipe interface for changes
5. **Download** - Get production-ready code

### Progressive AI Enhancement
```
Ollama (free, local) → GPT-3.5 (cheap) → GPT-4/Claude (expensive)
   70% of requests  →  25% of requests →   5% of requests
```

## 🏗️ Architecture & Systems

### Multi-Layer Context System
1. **Static Context** (this file) - Core instructions and patterns
2. **Dynamic Memory** (.memory/project-state.json) - Auto-updated state
3. **Agent Context** (per-agent) - Specialized knowledge
4. **MCP Integration** - Real-time tool access
5. **Progressive Learning** - Patterns extracted from user behavior

### Key Systems Built
- ✅ **Agent Coordinator** - Multi-agent orchestration with worktrees
- ✅ **Memory System** - Automatic state tracking via git hooks
- ✅ **Dashboard** - Real-time progress visualization (port 3333)
- ✅ **MCP Server** - Claude tool integration
- ✅ **Logging System** - Comprehensive category-based logging
- ✅ **Quality Gates** - Pre-commit checks, no-todos validation
- ✅ **Content Generator** - Real documentation (no stubs!)

### File Organization
```
finishthisidea/
├── docs/                    # All documentation (must be 100% complete)
│   ├── 01-overview/         # Vision, quickstart, roadmap
│   ├── 02-architecture/     # System design, data flow
│   ├── 03-services/         # Service catalog
│   ├── 04-implementation/   # Week-by-week guides
│   ├── 05-deployment/       # Deployment guides
│   ├── 06-api/             # API documentation
│   ├── 07-integrations/    # Integration guides (13 missing!)
│   ├── 08-operations/      # Operations guides (11 missing!)
│   └── 09-troubleshooting/ # Troubleshooting (10 missing!)
├── src/
│   ├── mvp-cleanup/        # $1 cleanup service
│   ├── tinder-ui/          # Swipe interface
│   ├── llm-router/         # Progressive AI routing
│   ├── core/               # Core utilities (logger, etc.)
│   └── template-engine/    # Service templates
├── scripts/                # Automation scripts
├── .memory/               # Project state tracking
├── .mcp/                  # MCP server and tools
└── tests/                 # Comprehensive test suite
```

## 📋 Critical Rules (NO EXCEPTIONS)

### 🚫 RULE 0: NO STUBS, NO PLACEHOLDERS, NO TODOs
Every file must be production-ready. Period.

### 📝 RULE 1: Documentation First
- Complete ALL documentation before writing code
- Currently at 70% (56/80 files) - MUST reach 100%
- Missing: 13 integrations, 11 operations, 10 troubleshooting guides

### 🤖 RULE 2: Use Automation
```bash
# ❌ NEVER: Write docs manually
# ✅ ALWAYS: Use agents
./scripts/agent-coordinator.sh batch-docs 10

# ❌ NEVER: Update memory manually  
# ✅ ALWAYS: Git hooks handle it automatically

# ❌ NEVER: Check status manually
# ✅ ALWAYS: Use dashboard
open http://localhost:3333
```

### 💰 RULE 3: Cost Consciousness
- ALWAYS try Ollama first
- Only escalate if confidence < 80%
- Track costs in code comments

### 👶 RULE 4: 5-Year-Old Test
If a 5-year-old can't use it, it's too complex.

## 🔧 Common Commands

### Documentation Progress
```bash
# Check current status (should be 80 files when done)
find docs -name "*.md" | wc -l

# See what's missing
./scripts/agent-coordinator.sh status

# Start more agents
./scripts/agent-coordinator.sh batch-docs 10

# Monitor in real-time
./scripts/system-monitor.sh watch
```

### Development Workflow
```bash
# Start everything
./scripts/start-all.sh

# Check dashboard
open http://localhost:3333

# Run tests
npm test

# Check logs
tail -f logs/system/combined.log
```

### Quality Checks
```bash
# Validate no TODOs
./scripts/no-todos-check.sh

# Check documentation
npm run docs:status

# Run linter
npm run lint
```

## 🎨 Code Patterns

### Service Pattern
```typescript
export class CleanupService {
  private llmRouter: LLMRouter;
  
  constructor() {
    // Progressive enhancement - Ollama first!
    this.llmRouter = new LLMRouter({
      ollama: { enabled: true, models: ['codellama'] },
      openai: { enabled: !!process.env.OPENAI_API_KEY },
      anthropic: { enabled: !!process.env.ANTHROPIC_API_KEY }
    });
  }
  
  async process(code: string): Promise<CleanupResult> {
    // Always validate first
    const validation = await this.validate(code);
    if (!validation.valid) throw new ValidationError(validation.errors);
    
    // Progressive processing
    let result = await this.llmRouter.process(code);
    
    // Format for swipe interface
    return this.formatAsSwipeableChanges(result);
  }
}
```

### API Pattern
```typescript
router.post('/api/cleanup', async (req, res) => {
  // 1. Validate immediately
  const { error } = validateUpload(req.body);
  if (error) return res.status(400).json({ error });
  
  // 2. Create job for async processing
  const job = await jobQueue.add('cleanup', req.body);
  
  // 3. Return immediately with status URL
  res.json({
    jobId: job.id,
    statusUrl: `/api/jobs/${job.id}`,
    message: 'Processing started'
  });
});
```

### Component Pattern
```tsx
export function SwipeableChange({ change, onDecision }: Props) {
  // Every UI component is gesture-aware
  return (
    <SwipeCard onSwipe={(direction) => onDecision(change.id, direction)}>
      <ChangeHeader>
        <FileIcon /> {change.file}
        <ConfidenceBadge value={change.confidence} />
      </ChangeHeader>
      
      <DiffView
        before={change.before}
        after={change.after}
        language={change.language}
      />
      
      <ChangeExplanation>
        {change.explanation}
      </ChangeExplanation>
    </SwipeCard>
  );
}
```

## 🐛 Known Issues & Solutions

### Issue: Agents creating stub files
**Solution**: We fixed agent_work() to use real content generator

### Issue: Deep directory nesting
**Solution**: Move to Desktop/FinishThisIdea for clean structure

### Issue: MCP not working with agents
**Solution**: MCP is for Claude only; agents use standalone generator

### Issue: Documentation not completing
**Solution**: Run more agents: `./scripts/agent-coordinator.sh batch-docs 10`

## 📊 Current Status

### Documentation: 70% Complete (56/80 files)
**Missing Categories:**
1. **Integration Guides** (13 files) - Ollama, OpenAI, Stripe, S3, etc.
2. **Operations Guides** (11 files) - Runbook, monitoring, scaling, etc.
3. **Troubleshooting** (10 files) - Common errors, debugging, etc.

### Systems Status:
- ✅ Core Infrastructure (logging, monitoring, memory)
- ✅ Agent System (multi-agent coordination)
- ✅ Quality Gates (no-todos, testing)
- ✅ MCP Integration (for Claude)
- ❌ MVP Implementation (waiting for 100% docs)
- ❌ Tinder UI (waiting for 100% docs)
- ❌ Payment System (waiting for 100% docs)

## 🚀 Next Steps

1. **Complete Documentation** (Priority 1)
   - Run: `./scripts/agent-coordinator.sh batch-docs 10`
   - Monitor: `open http://localhost:3333`
   - Target: 80 total files

2. **Then Build MVP** (After docs complete)
   - File upload system
   - Stripe payment ($1)
   - Ollama integration
   - Basic cleanup service
   - Download system

3. **Progressive Enhancement**
   - Tinder swipe UI
   - LLM router
   - Learning system
   - Enterprise features

## 💡 Philosophy & Principles

1. **We eat our own dog food** - Use our tools to build our tools
2. **Documentation is code** - Treat it with same respect
3. **Automate everything** - If you do it twice, script it
4. **Progress over perfection** - Ship working code iteratively
5. **Simplicity wins** - Choose boring technology

## 🤝 Working with This Codebase

When you (the AI) work on this project:

1. **Read First**:
   - This file (CLAUDE.md)
   - QUALITY_STANDARDS.md
   - Current TODO list via dashboard

2. **Check Status**:
   ```bash
   ./scripts/agent-coordinator.sh status
   curl http://localhost:3333/api/status | jq .
   ```

3. **Follow Patterns**:
   - Look at existing code for patterns
   - Use the same style and structure
   - Don't reinvent what exists

4. **Test Everything**:
   - Unit tests for logic
   - Integration tests for flows
   - E2E tests for user journeys

5. **Document Changes**:
   - Update relevant docs
   - Add inline comments for "why"
   - Keep CHANGELOG current

## 🎯 Remember

We're building a tool that helps developers finish their projects. Every decision should make that easier, not harder. If our own project isn't "finished" (100% documented, tested, polished), how can we help others?

**Current Mission**: Get documentation to 100%, then build the MVP that demonstrates our value proposition.

---

*This is a living document. Update it when you learn something new.*
*Last updated: 2025-06-26*
*Version: 2.0.0 - Enhanced with personal context approach*