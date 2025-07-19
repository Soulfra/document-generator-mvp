# AGENT.md - Universal AI Assistant Rules

This document provides rules and context for ANY AI agent (Claude, GPT-4, Gemini, Llama, etc.) working on the FinishThisIdea codebase.

## Quick Context

You are working on **FinishThisIdea** - a platform that:
1. Cleans up messy code for $1 (MVP)
2. Uses a Tinder-style swipe interface 
3. Routes between local (Ollama) and cloud LLMs to minimize costs
4. Learns user preferences over time
5. Scales to offer multiple code transformation services

## Golden Rules

### 🎯 Rule 1: Simplicity Over Cleverness
```typescript
// GOOD: Direct and obvious
if (confidence < 0.8) {
  return tryBetterModel(input);
}

// BAD: Clever but confusing  
return confidence < 0.8 ? tryBetterModel(input) : result;
```

### 💰 Rule 2: Cost-Conscious AI Usage
Always try in this order:
1. Ollama (free, local)
2. GPT-3.5-turbo ($0.002/1k tokens)
3. Claude/GPT-4 ($0.03/1k tokens)

### 👆 Rule 3: Everything Is Swipeable
Every code change must be:
- Reviewable (show before/after)
- Rejectable (user can say no)
- Learnable (record preference)

### 📚 Rule 4: Documentation-First Development
1. Update docs BEFORE coding
2. Keep docs in `/docs` folder
3. Follow numbered structure (01-09)
4. Write for beginners

### 🏗️ Rule 5: No Deep Nesting
- Maximum 3 folder levels
- Feature-based organization
- Clear, boring names

## What You're Building

### Week 1: MVP ($1 Cleanup)
- Upload ZIP file
- Pay with Stripe
- Clean code with Ollama
- Download result

### Week 2: Tinder Interface + Smart Routing
- Swipe to review changes
- Learn preferences
- Route between LLMs based on complexity

### Week 3: Service Templates
- Generate new services from templates
- Documentation generator
- API generator
- Test generator

### Week 4: Enterprise Features
- Team accounts
- SSO login
- Admin dashboard
- Usage analytics

## Code Patterns to Follow

### Pattern 1: Service Structure
```typescript
class ServiceName {
  // 1. Always include LLM router
  private llmRouter: LLMRouter;
  
  // 2. Process method returns swipeable changes
  async process(input: any): Promise<Change[]> {
    // Validate → Process → Format as changes
  }
  
  // 3. Validate everything
  private validate(input: any): ValidationResult {
    // Check size, format, content
  }
}
```

### Pattern 2: API Responses
```typescript
// Always return consistent format
{
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
  };
}
```

### Pattern 3: Job Processing
```typescript
// 1. Create job immediately
const job = await createJob(data);

// 2. Return job ID to user
res.json({ id: job.id, statusUrl: `/api/jobs/${job.id}` });

// 3. Process asynchronously
await queue.add(job);
```

## Files You'll Touch Most

```
src/
├── mvp-cleanup-service/     # Start here for MVP
├── tinder-ui/              # Swipe interface components
├── llm-router/             # AI routing logic
└── template-engine/        # Service generation

docs/
├── 04-implementation/      # Week-by-week guides
└── 06-api/                # API documentation
```

## Commands to Know

```bash
# Start development
npm run dev

# Run specific service
npm run dev:cleanup

# Test everything
npm test

# Check code quality
npm run lint
npm run typecheck

# Start local Ollama
ollama serve
ollama pull codellama
```

## Common Tasks

### Adding a New Service
1. Create template in `/templates`
2. Add to service catalog
3. Implement processing logic
4. Add API endpoints
5. Create UI components
6. Write documentation
7. Add tests

### Modifying the Swipe Interface
1. Check `src/tinder-ui/components/SwipeCard.tsx`
2. Update swipe handlers
3. Add new gestures carefully
4. Test on mobile
5. Update preference learning

### Adding a New LLM Provider
1. Add to `src/llm-router/providers/`
2. Implement provider interface
3. Add to router configuration
4. Set cost limits
5. Test fallback behavior

## Debugging Tips

### LLM Not Working?
1. Check if Ollama is running: `curl http://localhost:11434`
2. Verify API keys in `.env`
3. Check cost limits haven't been hit
4. Review confidence thresholds

### Swipe Not Registering?
1. Check browser console for errors
2. Verify gesture thresholds
3. Test on actual device
4. Check if preferences are saving

### Jobs Stuck?
1. Check Redis is running
2. Review Bull dashboard at `/admin/queues`
3. Check for errors in job processor
4. Verify file uploads succeeded

## Don'ts

❌ **DON'T** add configuration options (keep it simple)
❌ **DON'T** require accounts for basic features  
❌ **DON'T** use expensive LLMs for simple tasks
❌ **DON'T** store user data longer than 24 hours
❌ **DON'T** add features not in the roadmap
❌ **DON'T** nest folders more than 3 levels
❌ **DON'T** write clever code (write obvious code)

## Do's

✅ **DO** make everything swipeable
✅ **DO** use Ollama first, always
✅ **DO** write documentation first
✅ **DO** keep the UI mobile-friendly
✅ **DO** track costs obsessively
✅ **DO** learn from user preferences
✅ **DO** ship features incrementally

## Need Help?

1. Check `/docs` folder
2. Look for similar code patterns
3. Read the week's implementation guide
4. Check `CLAUDE.md` for detailed rules
5. Review recent commits for examples

## Remember

You're building a tool to help developers **finish their ideas**. Every line of code should make that easier, not harder.

**Keep it simple. Keep it cheap. Keep it swipeable.**