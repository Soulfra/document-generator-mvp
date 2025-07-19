# S+ Tier Development Standards

## Overview

This document defines the S+ tier standards for the FinishThisIdea project. These are non-negotiable requirements that ensure our codebase maintains the highest quality, organization, and developer experience.

## Core Principles

### 1. Zero Tolerance for Mess
- **NO duplicate files** - Every file has ONE location
- **NO zombie code** - If it's not used, it's deleted
- **NO broken references** - All links and imports work
- **NO uncommitted chaos** - Git status should be clean

### 2. Memory & Context
- **ALWAYS maintain context** - Use .claude directory
- **ALWAYS document decisions** - Record why, not just what
- **ALWAYS track progress** - Todo list is source of truth
- **ALWAYS preserve knowledge** - Memory persists across sessions

### 3. Modular Development
- **USE git worktrees** - Isolate features and experiments
- **USE proper branching** - Never work directly on main
- **USE atomic commits** - One change, one commit
- **USE meaningful messages** - Explain the why

## Directory Structure

```
finishthisidea/
├── .claude/                 # Memory system (REQUIRED)
│   ├── memory.md           # Project memory
│   ├── context.md          # Current context
│   ├── decisions.md        # Architecture decisions
│   ├── patterns.md         # Recognized patterns
│   └── todo.md             # Dynamic todo tracking
├── .mcp/                   # Model Context Protocol
│   ├── config.json         # MCP configuration
│   ├── server.js           # MCP server
│   ├── prompts/            # Prompt templates
│   └── tools/              # Custom tools
├── worktrees/              # Git worktree management
│   ├── init-worktree.md    # Initialize worktree
│   ├── new-worktree.md     # Create feature worktree
│   ├── merge-worktree.md   # Merge completed work
│   ├── pr-worktree.md      # Create PR from worktree
│   ├── sync-worktree.md    # Sync with main
│   └── remove-worktree.md  # Clean up worktree
├── scripts/                # Automation (REQUIRED)
│   ├── cleanup.sh          # Remove duplicates
│   ├── validate-mcp.sh     # Test MCP functionality
│   ├── validate-docs.sh    # Check documentation
│   ├── memory-update.sh    # Update .claude memory
│   └── worktree.sh         # Manage worktrees
├── src/                    # Source code
├── docs/                   # Documentation
├── templates/              # Service templates
└── [config files]          # Root configs only
```

## File Organization Rules

### 1. No Duplicates Policy
- One README.md per directory maximum
- One source of truth for each concept
- Use symlinks if multiple access points needed
- Regular duplicate scanning with cleanup.sh

### 2. Naming Conventions
```
✅ GOOD                      ❌ BAD
user-service.ts              UserService.ts
api-gateway/                 APIGateway/
test-utils.spec.ts          testUtils.test.js
deploy-production.sh         DEPLOY_PROD.sh
```

### 3. Import Hierarchy
```typescript
// 1. Node built-ins
import { readFile } from 'fs/promises';

// 2. External dependencies
import express from 'express';
import { z } from 'zod';

// 3. Internal absolute imports
import { UserService } from '@/services/user';

// 4. Relative imports (same module only)
import { validateEmail } from './utils';
```

## Documentation Standards

### 1. Documentation First
- Write docs BEFORE implementation
- Update docs WITH implementation
- Review docs AFTER implementation

### 2. Documentation Structure
```
docs/
├── 01-overview/       # Vision, mission, quickstart
├── 02-architecture/   # Technical design
├── 03-services/       # Service specifications
├── 04-implementation/ # How to build
├── 05-deployment/     # How to deploy
├── 06-api/           # API reference
├── 07-integrations/  # External integrations
├── 08-operations/    # Running in production
└── 09-troubleshooting/ # Fixing problems
```

### 3. Documentation Requirements
- Every service has a specification
- Every API has complete documentation
- Every integration has a guide
- Every problem has a solution

## Git Workflow Standards

### 1. Worktree Usage
```bash
# Create feature worktree
git worktree add -b feature/new-service ../worktrees/new-service

# Work in isolation
cd ../worktrees/new-service
# ... make changes ...

# Create PR when ready
gh pr create --base main

# Clean up after merge
git worktree remove ../worktrees/new-service
```

### 2. Commit Standards
```
feat: add user authentication service
fix: resolve memory leak in template engine
docs: update API documentation for v2
refactor: extract LLM routing logic
test: add integration tests for payment flow
chore: update dependencies
style: format code with prettier
perf: optimize database queries
```

### 3. Branch Protection
- Main branch is protected
- All changes via PR
- Requires review
- Must pass tests
- Must update docs

## Memory System Standards

### 1. .claude Directory
**Required Files:**
- `memory.md` - What to remember across sessions
- `context.md` - Current working context
- `decisions.md` - Why we made choices
- `patterns.md` - Recognized code patterns
- `todo.md` - Current todo state

### 2. Memory Updates
- Update after significant changes
- Record all architectural decisions
- Track patterns for reuse
- Maintain context continuity

### 3. Memory Integration
- MCP reads from .claude
- Scripts update .claude
- Git hooks validate .claude
- CI/CD uses .claude

## Testing Standards

### 1. Test Coverage
- Minimum 80% coverage
- 100% for critical paths
- Integration tests required
- E2E for user journeys

### 2. Test Organization
```
__tests__/
├── unit/           # Unit tests
├── integration/    # Integration tests
├── e2e/           # End-to-end tests
└── fixtures/      # Test data
```

### 3. Test Naming
```typescript
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data', () => {});
    it('should reject duplicate emails', () => {});
    it('should hash passwords securely', () => {});
  });
});
```

## Code Quality Standards

### 1. No Stubs Policy
```typescript
// ❌ NEVER DO THIS
function implementLater() {
  // TODO: implement this
  throw new Error('Not implemented');
}

// ✅ ALWAYS DO THIS
function processPayment(amount: number): Promise<PaymentResult> {
  // Full implementation or don't commit
}
```

### 2. Type Safety
- TypeScript strict mode enabled
- No `any` types without justification
- All inputs validated with Zod
- Return types always specified

### 3. Error Handling
```typescript
// Every error is handled
try {
  const result = await riskyOperation();
  return { success: true, data: result };
} catch (error) {
  logger.error('Operation failed', { error, context });
  return { success: false, error: error.message };
}
```

## Automation Requirements

### 1. Required Scripts
Every project MUST have:
- `cleanup.sh` - Remove duplicates and organize
- `validate.sh` - Check all standards
- `memory-update.sh` - Update .claude files
- `test-all.sh` - Run complete test suite

### 2. Git Hooks
```bash
# .git/hooks/pre-commit
./scripts/validate.sh || exit 1
./scripts/memory-update.sh

# .git/hooks/pre-push
./scripts/test-all.sh || exit 1
```

### 3. CI/CD Integration
- All scripts run in CI
- Memory system validated
- Documentation checked
- No duplicates allowed

## Monitoring Standards

### 1. Health Checks
- MCP server status
- Memory system integrity
- Documentation completeness
- No duplicate files

### 2. Regular Audits
Weekly:
- Run cleanup.sh
- Update memory.md
- Review todo list
- Check for duplicates

### 3. Metrics
Track:
- Documentation coverage
- Test coverage
- Memory accuracy
- Duplicate count (should be 0)

## Enforcement

### 1. Automated Checks
- Pre-commit hooks enforce standards
- CI/CD blocks non-compliant code
- Regular automated audits
- Alerts for violations

### 2. Manual Reviews
- PR reviews check standards
- Documentation reviews
- Architecture reviews
- Memory system reviews

### 3. Consequences
- Non-compliant code is rejected
- Repeated violations = retraining
- Standards are non-negotiable
- Quality over speed

## Getting Started

1. Run initial setup:
   ```bash
   ./scripts/setup-standards.sh
   ```

2. Validate current state:
   ```bash
   ./scripts/validate.sh
   ```

3. Fix any issues:
   ```bash
   ./scripts/cleanup.sh
   ```

4. Update memory:
   ```bash
   ./scripts/memory-update.sh
   ```

## Remember

**S+ Tier is not a goal, it's a requirement.**

Every line of code, every file, every commit must meet these standards. No exceptions, no excuses, no compromises.

---

*Standards Version: 1.0.0*
*Last Updated: 2024-01-20*
*Next Review: Monthly*