# FinishThisIdea System Usage Guide

## Overview

This guide explains how to properly use the FinishThisIdea system with all its components working together seamlessly. Follow this guide to maintain S+ tier standards and maximize productivity.

## Table of Contents

1. [Initial Setup](#initial-setup)
2. [Daily Workflow](#daily-workflow)
3. [Using the Memory System](#using-the-memory-system)
4. [Working with Worktrees](#working-with-worktrees)
5. [MCP Integration](#mcp-integration)
6. [Documentation Workflow](#documentation-workflow)
7. [Quality Assurance](#quality-assurance)
8. [Common Scenarios](#common-scenarios)

## Initial Setup

### 1. First Time Setup

```bash
# Clone the repository
git clone <repository-url>
cd finishthisidea

# Install dependencies
npm install

# Run initial setup
./scripts/setup-everything.sh

# Validate setup
./scripts/validate-mcp.sh
./scripts/cleanup.sh
```

### 2. Configure Your Environment

```bash
# Copy environment template
cp .env.example .env

# Edit with your API keys
vim .env

# Required keys:
# - OPENAI_API_KEY (optional, for advanced features)
# - ANTHROPIC_API_KEY (optional, for Claude features)
# - STRIPE_SECRET_KEY (for payment processing)
```

### 3. Initialize Memory System

```bash
# Run initial memory update
./scripts/memory-update.sh

# Verify memory files created
ls -la .claude/
```

## Daily Workflow

### Morning Routine

1. **Check System Status**
   ```bash
   # Check git status
   git status
   
   # Check worktree status
   ./scripts/worktree-manager.sh status
   
   # Run cleanup check
   ./scripts/cleanup.sh
   
   # Update memory
   ./scripts/memory-update.sh
   ```

2. **Review Todos**
   ```bash
   # Check current todos
   cat .claude/todo.md | grep -A 10 "High Priority"
   
   # Or use your editor
   code .claude/todo.md
   ```

3. **Plan Your Work**
   - Review high-priority todos
   - Decide which worktree to use
   - Update context.md with your focus

### Working Session

1. **Start New Feature**
   ```bash
   # Create new worktree for feature
   ./scripts/worktree-manager.sh new feature ollama-integration
   
   # Navigate to worktree
   cd ../finishthisidea-worktrees/feature-ollama-integration
   
   # Run setup
   ./.worktree-setup.sh
   
   # Start developing
   ```

2. **Documentation Work**
   ```bash
   # Create documentation worktree
   ./scripts/worktree-manager.sh new docs api-reference
   
   # Navigate and work
   cd ../finishthisidea-worktrees/docs-api-reference
   ```

3. **Regular Syncing**
   ```bash
   # Every 2-3 hours, sync with main
   ./scripts/worktree-manager.sh sync <worktree-name>
   ```

### End of Day

1. **Commit Your Work**
   ```bash
   # In your worktree
   git add .
   git commit -m "feat: implement Ollama service integration"
   git push -u origin feature/ollama-integration
   ```

2. **Update Memory**
   ```bash
   # Return to main directory
   cd /path/to/finishthisidea
   
   # Update memory system
   ./scripts/memory-update.sh
   ```

3. **Create PR if Ready**
   ```bash
   # Use GitHub CLI
   gh pr create --title "feat: Add Ollama integration" \
     --body "$(cat .github/pr-template.md)"
   ```

## Using the Memory System

### Understanding .claude Directory

```
.claude/
├── memory.md       # Long-term project memory
├── context.md      # Current session context
├── decisions.md    # Architecture decisions log
├── patterns.md     # Recognized code patterns
├── todo.md         # Dynamic todo tracking
└── snapshots/      # Point-in-time memory snapshots
```

### When to Update Memory

1. **Update context.md**:
   - When starting a new task
   - When switching between worktrees
   - When encountering problems

2. **Update memory.md**:
   - After completing significant features
   - When making architecture decisions
   - At end of each work session

3. **Update decisions.md**:
   - When choosing between alternatives
   - When establishing new patterns
   - When changing architecture

### Memory Commands

```bash
# Quick memory update
./scripts/memory-update.sh

# Manual context update
echo "Working on: API documentation" >> .claude/context.md

# View memory status
cat .claude/stats.md
```

## Working with Worktrees

### Worktree Lifecycle

1. **Create** → 2. **Develop** → 3. **Sync** → 4. **PR** → 5. **Merge** → 6. **Remove**

### Essential Commands

```bash
# List all worktrees
./scripts/worktree-manager.sh list

# Create new worktree
./scripts/worktree-manager.sh new <type> <name>
# Types: feature, docs, fix, chore, refactor

# Sync with main
./scripts/worktree-manager.sh sync <name>

# Merge completed work
./scripts/worktree-manager.sh merge <name>

# Remove after merge
./scripts/worktree-manager.sh remove <name>

# Clean up all merged worktrees
./scripts/worktree-manager.sh clean
```

### Worktree Best Practices

1. **One Task Per Worktree**: Keep focused
2. **Descriptive Names**: `feature-ollama` not `feature-1`
3. **Regular Syncing**: At least daily
4. **Clean After Merge**: Don't leave dead worktrees

## MCP Integration

### Setting Up MCP

```bash
# Validate MCP configuration
./scripts/validate-mcp.sh

# If issues found, run setup
./setup-mcp.sh

# Test MCP server
node .mcp/server.js
```

### Using MCP with Claude Code

1. **Configure Claude Code**:
   - Open Claude Code settings
   - Add project configuration
   - Point to `.mcp/config.json`

2. **Available MCP Features**:
   - Custom prompts in `.mcp/prompts/`
   - Project-aware tools in `.mcp/tools/`
   - Context from `.claude/` directory

3. **Testing MCP**:
   ```bash
   # Run validation
   ./scripts/validate-mcp.sh
   
   # Check integration
   grep -r "finishthisidea" ~/.config/claude/
   ```

## Documentation Workflow

### Documentation Structure

```
docs/
├── 01-overview/        # Start here for vision
├── 02-architecture/    # Technical design
├── 03-services/        # Service specifications (priority!)
├── 04-implementation/  # How to build
├── 05-deployment/      # How to deploy
├── 06-api/            # API reference
├── 07-integrations/   # External integrations
├── 08-operations/     # Running in production
└── 09-troubleshooting/ # Problem solutions
```

### Creating Documentation

1. **Service Specifications** (Priority):
   ```bash
   # Create worktree for docs
   ./scripts/worktree-manager.sh new docs service-specs
   
   # Use template
   cp templates/service-spec.md docs/03-services/new-service.md
   
   # Edit with consistent structure
   ```

2. **Check Progress**:
   ```bash
   # Run documentation status
   node scripts/doc-status.js
   
   # View specific section status
   ls -la docs/03-services/*.md | wc -l
   ```

## Quality Assurance

### Before Every Commit

```bash
# 1. Run cleanup check
./scripts/cleanup.sh

# 2. Check for TODOs
grep -r "TODO\|FIXME" src/

# 3. Run tests (when implemented)
npm test

# 4. Update documentation
# If code changed, docs must change

# 5. Update memory
./scripts/memory-update.sh
```

### S+ Tier Checklist

- [ ] No duplicate files
- [ ] No TODO/FIXME in code
- [ ] Documentation updated
- [ ] Tests passing (when available)
- [ ] Memory system current
- [ ] Clean git status
- [ ] Proper commit message

## Common Scenarios

### Scenario 1: Starting Fresh in the Morning

```bash
# 1. Update main branch
git checkout main
git pull origin main

# 2. Check system status
./scripts/cleanup.sh
./scripts/memory-update.sh

# 3. Review todos
cat .claude/todo.md | head -30

# 4. Start working
./scripts/worktree-manager.sh new feature my-feature
```

### Scenario 2: Switching Between Tasks

```bash
# 1. Commit current work
git add . && git commit -m "WIP: current progress"

# 2. Update memory
echo "Switching from feature-x to docs-y" >> .claude/context.md

# 3. Switch worktree
cd ../finishthisidea-worktrees/docs-y

# 4. Sync if needed
../../finishthisidea/scripts/worktree-manager.sh sync y
```

### Scenario 3: Completing a Feature

```bash
# 1. Final cleanup
./scripts/cleanup.sh

# 2. Create PR
gh pr create

# 3. After merge, remove worktree
./scripts/worktree-manager.sh remove feature-name

# 4. Update memory
./scripts/memory-update.sh
```

### Scenario 4: Handling Conflicts

```bash
# 1. During sync/rebase
git status

# 2. Resolve conflicts in editor
code conflicted-file.ts

# 3. Continue rebase
git add .
git rebase --continue

# 4. Update memory about resolution
echo "Resolved conflict in X by choosing Y approach" >> .claude/decisions.md
```

## Automation Scripts

### Available Scripts

1. **cleanup.sh**: Remove duplicates, check standards
2. **validate-mcp.sh**: Test MCP integration
3. **memory-update.sh**: Update .claude directory
4. **worktree-manager.sh**: Manage git worktrees
5. **setup-everything.sh**: Initial project setup
6. **doc-status.js**: Check documentation progress

### Creating Custom Scripts

Place new scripts in `scripts/` and follow the pattern:

```bash
#!/bin/bash
# script-name.sh - Brief description

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Your script logic here
```

## Tips for Success

1. **Memory First**: Always update memory when context changes
2. **Worktree Discipline**: One task = one worktree
3. **Documentation Driven**: Write docs before code
4. **Regular Cleanup**: Run cleanup.sh daily
5. **Commit Often**: Small, focused commits
6. **Sync Frequently**: Avoid drift from main
7. **Test Everything**: Even if just manual testing
8. **Ask Questions**: Check documentation first

## Troubleshooting

### MCP Not Working
```bash
./scripts/validate-mcp.sh
npm install @modelcontextprotocol/sdk
./setup-mcp.sh
```

### Too Many Untracked Files
```bash
./scripts/cleanup.sh
git status --porcelain | grep "^??" | wc -l
# Review and add to .gitignore
```

### Worktree Conflicts
```bash
git worktree prune
./scripts/worktree-manager.sh clean
```

### Memory Out of Sync
```bash
./scripts/memory-update.sh
# Manually review .claude/context.md
```

## Next Steps

1. Complete service specifications (Priority!)
2. Set up automated testing
3. Configure CI/CD pipeline
4. Create API documentation
5. Build MVP implementation

Remember: **S+ tier standards are not optional**. Every action should improve the codebase.

---

*Last Updated: 2024-01-20*
*Version: 1.0.0*