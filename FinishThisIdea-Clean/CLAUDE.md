# CLAUDE.md - AI Assistant Instructions

This file provides instructions for Claude, Cursor, GitHub Copilot, and any other AI assistants working on the FinishThisIdea codebase.

## Project Overview

FinishThisIdea is an AI-powered code transformation platform that starts with a $1 cleanup service and scales to a full AI Backend Team as a Service. The platform uses progressive LLM enhancement (Ollama → OpenAI → Anthropic) and a Tinder-style interface for reviewing code changes.

## Critical Rules

### ⛔ RULE 0: READ QUALITY_STANDARDS.md
**MANDATORY**: Before writing ANY code, read and follow QUALITY_STANDARDS.md
- NO STUBS, NO PLACEHOLDERS, NO TODOs
- EVERY file must be production-ready
- MINIMUM 80% test coverage
- Documentation so clear a 5-year-old can understand

### 1. Documentation First
- ALWAYS update documentation when changing code
- Documentation lives in `/docs` with numbered folders (01-09)
- Keep docs in sync with implementation
- Write docs assuming the reader is 5 years old

### 2. No Nested Insanity
- Maximum 3 levels of folder nesting
- If you need more nesting, refactor the architecture
- Feature-based organization over technical grouping
- Clear, descriptive names over clever abbreviations

### 3. Cost Consciousness
- Always try Ollama (local) first
- Only escalate to cloud LLMs when necessary
- Track and report LLM costs in code
- Default to cheaper models for simple tasks

### 4. User Experience First
- Every feature should be swipeable (approve/reject)
- No configuration required for basic usage
- Progressive disclosure of complexity
- Mobile-first, touch-friendly interfaces

### 5. Code Style
```typescript
// YES: Clear, simple, purposeful
export async function cleanupCode(input: string): Promise<string> {
  const cleaned = await processWithOllama(input);
  return cleaned.confidence > 0.8 ? cleaned.result : processWithGPT(input);
}

// NO: Over-engineered, premature abstraction
export class AbstractCodeTransformationFactory implements ITransformable {
  // ... 200 lines of abstraction for 10 lines of logic
}
```

## File Organization

```
finishthisidea/
├── src/
│   ├── mvp-cleanup-service/    # $1 cleanup (Week 1)
│   ├── tinder-ui/              # Swipe interface (Week 2)
│   ├── llm-router/             # AI routing (Week 2)
│   ├── template-engine/        # Service templates (Week 3)
│   └── enterprise/             # Enterprise features (Week 4)
├── docs/
│   ├── 01-overview/            # Vision, mission, roadmap
│   ├── 02-architecture/        # Technical design
│   ├── 03-services/            # Service catalog
│   ├── 04-implementation/      # Week-by-week guides
│   └── ...                     # See DOCUMENTATION_STRUCTURE.md
├── templates/                  # Service templates
├── .mcp/                       # Cursor integration
└── [config files]              # Root-level configs only
```

## Development Workflow

### Starting a New Feature
1. Check the TODO list in code comments
2. Create/update documentation FIRST
3. Write implementation
4. Add tests
5. Update relevant docs
6. Submit PR with clear description

### Making Changes
```bash
# 1. Always start with docs
vi docs/XX-section/feature.md

# 2. Implement the feature
vi src/feature/implementation.ts

# 3. Test thoroughly
npm test src/feature

# 4. Update API docs if needed
vi docs/06-api/api-reference.md
```

## Code Patterns

### Service Implementation
```typescript
// Every service follows this pattern
export class ServiceNameService {
  private llmRouter: LLMRouter;
  
  constructor() {
    this.llmRouter = new LLMRouter({
      // Always include Ollama
      ollama: { enabled: true, models: ['codellama'] },
      // Optional cloud providers
      openai: { enabled: !!process.env.OPENAI_API_KEY },
    });
  }
  
  async process(input: Input): Promise<Result> {
    // 1. Validate
    const validation = await this.validate(input);
    
    // 2. Process with progressive enhancement
    const result = await this.llmRouter.complete({
      prompt: this.buildPrompt(input),
      requireConfidence: 0.8,
    });
    
    // 3. Return swipeable changes
    return this.formatAsChanges(result);
  }
}
```

### API Endpoints
```typescript
// Consistent REST patterns
router.post('/api/service', async (req, res) => {
  // 1. Validate input
  const { error } = validateSchema(req.body);
  if (error) return res.status(400).json({ error });
  
  // 2. Create job
  const job = await createJob(req.body);
  
  // 3. Return immediately
  res.json({
    id: job.id,
    status: 'pending',
    statusUrl: `/api/jobs/${job.id}`,
  });
  
  // 4. Process async
  await jobQueue.add(job);
});
```

### Frontend Components
```tsx
// Every UI component is swipe-aware
export function CodeChange({ change, onSwipe }: Props) {
  return (
    <SwipeableCard onSwipe={onSwipe}>
      <CodeDiff before={change.before} after={change.after} />
      <ConfidenceBar value={change.confidence} />
    </SwipeableCard>
  );
}
```

## Testing Requirements

### Unit Tests
- Minimum 80% coverage
- Test edge cases and errors
- Mock external services
- Use descriptive test names

### Integration Tests
- Test full user flows
- Include payment processing
- Verify file upload/download
- Check LLM fallback logic

### E2E Tests
- Critical paths only
- Upload → Pay → Process → Download
- Swipe interface functionality
- Error recovery

## Common Pitfalls to Avoid

### 1. Over-Engineering
❌ Don't create abstractions before they're needed
❌ Don't add features not in the roadmap
❌ Don't optimize prematurely
✅ Do follow YAGNI (You Aren't Gonna Need It)

### 2. Ignoring Costs
❌ Don't default to expensive LLMs
❌ Don't make unnecessary API calls
❌ Don't store data longer than needed
✅ Do track and minimize costs

### 3. Complex UX
❌ Don't add configuration options
❌ Don't require accounts for basic features
❌ Don't make users think
✅ Do keep it swipeable and simple

### 4. Breaking Changes
❌ Don't change API contracts
❌ Don't rename public methods
❌ Don't alter data structures
✅ Do version APIs properly

## Git Commit Messages

Follow conventional commits:
```
feat: add TypeScript conversion service
fix: handle empty files in cleanup service  
docs: update API reference for v2 endpoints
refactor: extract LLM routing logic
test: add integration tests for payment flow
chore: update dependencies
```

## Pull Request Template

```markdown
## Summary
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Documentation
- [ ] Code comments updated
- [ ] API docs updated
- [ ] User guides updated
```

## Environment Variables

Always use `.env.example` as the source of truth:
```bash
# LLM Providers
OLLAMA_URL=http://localhost:11434
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Services
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
S3_ENDPOINT=http://localhost:9000

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Feature Flags
ENABLE_OLLAMA=true
ENABLE_OPENAI=false
ENABLE_ANTHROPIC=false
```

## Questions to Ask Yourself

Before writing code, ask:
1. Is this the simplest solution?
2. Can users swipe to approve/reject this?
3. Will this work with just Ollama?
4. Is the documentation updated?
5. Does this increase complexity?

## Getting Help

- Check `/docs` first
- Look for similar patterns in codebase
- Ask specific questions with context
- Include error messages and logs
- Reference the week's implementation guide

## AUTOMATED WORKFLOW (NO EXCEPTIONS)

### Documentation Creation
```bash
# ❌ NEVER DO THIS:
Write file directly to docs/

# ✅ ALWAYS DO THIS:
./scripts/agent-coordinator.sh start docs
./scripts/agent-coordinator.sh assign "docs/category/file.md"
```

### Feature Implementation
```bash
# ❌ NEVER: Edit in main branch
# ✅ ALWAYS: Create worktree first
./scripts/create-worktree.sh feature my-feature
```

### Why Automation Matters
1. **Parallel Work**: Multiple agents work simultaneously
2. **Memory Updates**: Happen automatically on commits
3. **Progress Tracking**: Dashboard shows real-time status
4. **Quality Gates**: Tests run automatically
5. **Clean History**: Every change is reviewable

### Quick Commands
- **Status**: `./scripts/agent-coordinator.sh status`
- **Dashboard**: `open http://localhost:3333`
- **Memory Check**: `cat .memory/project-state.json`

### Enforcement
- Git hooks prevent direct main commits
- MCP tools handle workflow automatically
- Dashboard tracks all progress
- Memory updates without manual intervention

**READ**: `.rules/ai-workflow-enforcement.md` for complete details

## Remember

**We're building a tool that helps developers finish their projects. Every decision should make that easier, not harder.**

Keep it simple. Keep it cheap. Keep it swipeable.

**The automation enforces quality. Trust it.**

---

*Last updated: 2025-06-26*
*Version: 1.1.0*