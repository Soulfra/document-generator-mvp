# FinishThisIdea Troubleshooting Matrix

## Quick Reference

This matrix provides solutions for common issues organized by category. Find your symptom and follow the solution steps.

## Categories

1. [Memory System Issues](#memory-system-issues)
2. [Git Worktree Problems](#git-worktree-problems)
3. [MCP Integration Issues](#mcp-integration-issues)
4. [Documentation Problems](#documentation-problems)
5. [Quality & Standards Issues](#quality--standards-issues)
6. [Development Environment](#development-environment)
7. [Claude Code Integration](#claude-code-integration)

---

## Memory System Issues

### Symptom: Memory not persisting between sessions

**Cause**: Memory files not being updated or read correctly

**Solution**:
```bash
# 1. Check memory files exist
ls -la .claude/

# 2. Run memory update
./scripts/memory-update.sh

# 3. Verify updates
cat .claude/memory.md | tail -20

# 4. Check git status
git add .claude/
git commit -m "chore: update memory system"
```

### Symptom: Context.md showing outdated information

**Cause**: Automatic update not running

**Solution**:
1. Run manual update: `./scripts/memory-update.sh`
2. Check pre-commit hook: `cat .husky/pre-commit`
3. Ensure hook is executable: `chmod +x .husky/pre-commit`

### Symptom: Memory snapshots not creating

**Cause**: Missing snapshots directory

**Solution**:
```bash
mkdir -p .claude/snapshots
./scripts/memory-update.sh
```

---

## Git Worktree Problems

### Symptom: "fatal: not a valid object name: 'HEAD'"

**Cause**: No commits in repository

**Solution**:
```bash
# Create initial commit
git add .
git commit -m "Initial commit"
```

### Symptom: "fatal: '<path>' already exists"

**Cause**: Directory already exists from previous attempt

**Solution**:
```bash
# Remove old directory
rm -rf ../finishthisidea-worktrees/feature-name

# Try again
./scripts/worktree-manager.sh new feature name
```

### Symptom: Can't sync worktree

**Cause**: Uncommitted changes or conflicts

**Solution**:
```bash
# In worktree directory
git stash
./scripts/worktree-manager.sh sync feature-name
git stash pop
```

### Symptom: Worktree list shows missing directories

**Cause**: Worktrees deleted without proper cleanup

**Solution**:
```bash
# Prune stale worktrees
git worktree prune

# List to verify
git worktree list
```

---

## MCP Integration Issues

### Symptom: "No MCP servers configured" in Claude Code

**Cause**: MCP not properly set up or Claude Code not configured

**Solution**:
1. Run setup script:
   ```bash
   ./setup-mcp.sh
   ```

2. Manually configure Claude Code:
   - Open Claude Code settings
   - Add configuration pointing to `.mcp/config.json`
   - Restart Claude Code

### Symptom: MCP server not starting

**Cause**: Missing dependencies or syntax errors

**Solution**:
```bash
# 1. Check for errors
node .mcp/server.js

# 2. Install dependencies
npm install @modelcontextprotocol/sdk

# 3. Validate configuration
./scripts/validate-mcp.sh
```

### Symptom: MCP not accessing memory system

**Cause**: Server doesn't integrate with .claude directory

**Solution**:
1. Edit `.mcp/server.js` to add memory integration
2. Reference `.claude/` directory in prompts
3. Restart MCP server

---

## Documentation Problems

### Symptom: Documentation progress showing "Unknown"

**Cause**: doc-status.js script not finding files

**Solution**:
```bash
# Check script exists
ls scripts/doc-status.js

# Run manually
node scripts/doc-status.js

# If error, check file paths in script
```

### Symptom: Duplicate documentation files

**Cause**: Multiple versions created without cleanup

**Solution**:
```bash
# Run cleanup
./scripts/cleanup.sh

# Find duplicates manually
find . -name "*.md" -exec basename {} \; | sort | uniq -d
```

### Symptom: Service specifications incomplete

**Cause**: Missing documentation for services

**Solution**:
1. Check what's missing:
   ```bash
   ls docs/03-services/*.md | wc -l
   ```
2. Create missing specs using template
3. Use worktree for documentation work

---

## Quality & Standards Issues

### Symptom: Too many TODO/FIXME markers

**Cause**: Incomplete implementation or stubs

**Solution**:
```bash
# Find all TODOs
grep -r "TODO\|FIXME\|XXX" --include="*.ts" --include="*.js" .

# Address each one or remove if not needed
```

### Symptom: Pre-commit hook failing

**Cause**: Quality checks not passing

**Solution**:
1. Run cleanup: `./scripts/cleanup.sh`
2. Fix any reported issues
3. Update memory: `./scripts/memory-update.sh`
4. Try commit again

### Symptom: Deep directory nesting warnings

**Cause**: Structure exceeds 3 levels

**Solution**:
1. Identify deep paths:
   ```bash
   find . -type d | awk -F/ 'NF > 5'
   ```
2. Refactor structure to be flatter
3. Update imports accordingly

---

## Development Environment

### Symptom: npm install failing

**Cause**: Node version mismatch or corrupted cache

**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Symptom: Scripts not executable

**Cause**: Missing execute permissions

**Solution**:
```bash
# Make all scripts executable
chmod +x scripts/*.sh
chmod +x .husky/*
```

### Symptom: Environment variables not loading

**Cause**: Missing .env file

**Solution**:
```bash
# Copy template
cp .env.example .env

# Edit with your values
vim .env
```

---

## Claude Code Integration

### Symptom: Claude Code not finding project context

**Cause**: MCP not properly configured

**Solution**:
1. Ensure `.mcp/config.json` exists
2. Run validation: `./scripts/validate-mcp.sh`
3. Configure Claude Code to use MCP
4. Restart Claude Code

### Symptom: Prompts not loading

**Cause**: Prompt directory not found or empty

**Solution**:
```bash
# Check prompts exist
ls .mcp/prompts/

# Validate MCP config points to correct directory
cat .mcp/config.json | grep prompts
```

### Symptom: Custom tools not available

**Cause**: Tools not loading or syntax errors

**Solution**:
1. Check tool files: `ls .mcp/tools/`
2. Validate each tool: `node .mcp/tools/tool-name.js`
3. Fix any syntax errors
4. Restart MCP server

---

## Common Error Messages

### "Error: Cannot find module"
**Solution**: Run `npm install` to install dependencies

### "Permission denied"
**Solution**: Check file permissions or use `sudo` if appropriate

### "fatal: not a git repository"
**Solution**: Ensure you're in the correct directory

### "EADDRINUSE: address already in use"
**Solution**: Kill process using the port or use different port

### "command not found"
**Solution**: Ensure script has shebang and is executable

---

## Emergency Procedures

### Complete System Reset
```bash
# 1. Save any important work
git stash

# 2. Clean everything
git clean -fd
npm cache clean --force
rm -rf node_modules

# 3. Reinstall
npm install
./scripts/setup-everything.sh

# 4. Restore work
git stash pop
```

### Memory System Recovery
```bash
# Restore from git history
git checkout HEAD~1 -- .claude/
./scripts/memory-update.sh
```

### Worktree Recovery
```bash
# List all worktrees
git worktree list

# Prune broken ones
git worktree prune

# Remove all worktrees
git worktree list | grep -v main | awk '{print $1}' | xargs -I {} git worktree remove {}
```

---

## Getting Help

If these solutions don't resolve your issue:

1. **Check Logs**: Look for error messages in console
2. **Review Documentation**: Re-read relevant guides
3. **Memory System**: Check `.claude/decisions.md` for past solutions
4. **Git History**: Review commits for when things worked

## Prevention Tips

1. **Regular Maintenance**:
   - Run `./scripts/cleanup.sh` daily
   - Update memory system after major changes
   - Keep documentation current

2. **Before Major Changes**:
   - Create worktree for isolation
   - Make snapshot of current state
   - Document decisions

3. **Quality Gates**:
   - Always run tests before commit
   - Use pre-commit hooks
   - Follow S+ tier standards

---

*Last Updated: 2024-01-20*
*Version: 1.0.0*