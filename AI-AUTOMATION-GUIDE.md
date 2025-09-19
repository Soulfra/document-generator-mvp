# AI Automation System Guide

This comprehensive guide covers the AI-powered automation system built for the Document Generator project, enabling fully automated development workflows.

## 🚀 Overview

The automation system consists of several interconnected components that work together to provide end-to-end development automation:

1. **AI Git Orchestrator** - Automated git workflow management
2. **Code Transformer Pipeline** - AI-powered code improvements
3. **Multi-Agent Development System** - Parallel AI agents for various tasks
4. **Smart Tagging System** - Semantic versioning and release management
5. **Workflow Templates** - Pre-built workflows for common tasks
6. **Integration Hub** - Central control and monitoring dashboard

## 🤖 Component Details

### AI Git Orchestrator

Monitors your codebase and automatically manages git operations using AI.

**Features:**
- File change detection with intelligent analysis
- AI-generated semantic commit messages
- Automatic branch creation based on features
- Smart commit timing (threshold or staleness based)
- Integration with conventional commits

**Usage:**
```bash
# Start the orchestrator
node ai-git-orchestrator.js

# Dry run mode (preview without committing)
node ai-git-orchestrator.js --dry-run
```

**Configuration:**
```javascript
{
  watchPaths: ['src', 'services', 'components'],
  ignorePatterns: ['node_modules', '.git', 'dist'],
  commitThreshold: 5,  // Auto-commit after 5 changes
  autoCommit: true,
  autoBranch: true
}
```

### Code Transformer Pipeline

Automatically improves code quality using AI-powered transformations.

**Transformations:**
- `improve-naming` - Better variable and function names
- `add-jsdoc` - Generate comprehensive JSDoc comments
- `optimize-logic` - Performance and logic optimizations
- `add-error-handling` - Add proper error handling
- `generate-tests` - Create test files
- `refactor-complex` - Simplify complex code
- `add-types` - Add TypeScript annotations
- `security-scan` - Security improvements
- `performance-optimize` - Performance enhancements

**Usage:**
```bash
# Transform a single file
node code-transformer-pipeline.js src/service.js

# Transform with specific transformations
node code-transformer-pipeline.js src/*.js --transformations improve-naming,add-jsdoc

# Dry run to preview changes
node code-transformer-pipeline.js src/*.js --dry-run
```

### Multi-Agent Development System

Deploys specialized AI agents that work in parallel across different worktrees.

**Agent Types:**
- **Code Agent** - Writes implementation code
- **Test Agent** - Creates comprehensive tests
- **Docs Agent** - Generates documentation
- **Review Agent** - Performs code reviews
- **Security Agent** - Security scanning and fixes
- **Performance Agent** - Performance optimizations
- **Refactor Agent** - Code refactoring

**Features:**
- Parallel execution across worktrees
- Real-time monitoring dashboard
- Automatic task distribution
- Follow-up task generation
- WebSocket coordination

**Usage:**
```bash
# Start the multi-agent system
node multi-agent-dev-system.js

# Access dashboard
open http://localhost:9500
```

### Smart Tagging System

Manages semantic versioning and creates releases with AI-generated notes.

**Features:**
- Analyzes commits to determine version bumps
- Generates changelogs and release notes
- Supports conventional commits
- Multiple tag types (release, prerelease, hotfix, security)
- Automatic version file updates

**Usage:**
```bash
# Analyze repository for version changes
node smart-tagging-system.js analyze

# Create a new tag with release notes
node smart-tagging-system.js tag

# Dry run mode
node smart-tagging-system.js tag --dry-run
```

## 📋 Workflow Templates

Pre-configured workflows that orchestrate all tools for common development tasks.

### Available Workflows

#### 1. Feature Development (`feature-development.yml`)
Complete workflow for developing new features:
- Creates feature branch
- Analyzes specifications
- Generates implementation with agents
- Creates tests and documentation
- Performs code review
- Handles merging and tagging

**Usage:**
```bash
node workflow-orchestrator.js run feature-development \
  feature_name="user-authentication" \
  specification="Implement OAuth2 with social login providers"
```

#### 2. Bug Fix (`bug-fix.yml`)
Automated bug fixing workflow:
- Analyzes bug report
- Reproduces issue
- Performs root cause analysis
- Implements fix
- Adds regression tests
- Creates hotfix if critical

**Usage:**
```bash
node workflow-orchestrator.js run bug-fix \
  issue_id=123 \
  description="Login fails with special characters" \
  severity=high
```

#### 3. Refactoring (`refactor.yml`)
Systematic code refactoring:
- Analyzes code quality
- Creates refactoring plan
- Implements improvements
- Validates behavior preservation
- Updates documentation

**Usage:**
```bash
node workflow-orchestrator.js run refactor \
  target="src/services" \
  goals="readability,performance" \
  scope=moderate
```

#### 4. Documentation (`documentation.yml`)
Automated documentation generation:
- Scans codebase
- Identifies documentation gaps
- Generates API docs, guides, examples
- Creates diagrams and tutorials
- Builds documentation site

**Usage:**
```bash
node workflow-orchestrator.js run documentation \
  target="src" \
  docTypes="api,user-guide,architecture" \
  format=markdown
```

#### 5. Release (`release.yml`)
Complete release automation:
- Prepares release
- Runs all tests
- Generates changelog
- Creates release notes
- Handles deployment
- Updates version numbers

**Usage:**
```bash
node workflow-orchestrator.js run release \
  releaseType=minor \
  targetEnvironment="staging,production"
```

## 🌐 Integration Hub

Central command center for all automation systems with real-time monitoring.

**Features:**
- Live dashboard with metrics
- WebSocket real-time updates
- Task queue management
- Workflow execution
- System status monitoring
- Activity logging

**Usage:**
```bash
# Start Integration Hub
node integration-hub.js

# Custom port
node integration-hub.js --port 9999

# Access dashboard
open http://localhost:8888/dashboard
```

**API Endpoints:**
- `GET /api/status` - System status and metrics
- `GET /api/workflows/templates` - List workflow templates
- `POST /api/workflows/execute` - Execute a workflow
- `POST /api/tasks/transform` - Queue transformation task
- `POST /api/tasks/agent` - Create agent task
- `GET /api/analysis/repository` - Analyze repository

## 🔧 Configuration

### Environment Variables
```bash
# AI providers
OLLAMA_URL=http://localhost:11434
OPENAI_API_KEY=your-key
ANTHROPIC_API_KEY=your-key

# System settings
WORKTREE_BASE=./worktrees
MAX_CONCURRENT_WORKFLOWS=5
COMMIT_THRESHOLD=5
```

### Global Configuration
Create `.automation-config.json`:
```json
{
  "ai": {
    "provider": "ollama",
    "model": "codellama:7b",
    "fallbackToCloud": true
  },
  "git": {
    "autoCommit": true,
    "autoBranch": true,
    "conventionalCommits": true
  },
  "agents": {
    "maxAgents": 8,
    "coordinationPort": 9500
  },
  "workflows": {
    "templatesDir": "./workflow-templates",
    "maxConcurrent": 5
  }
}
```

## 📊 Monitoring & Metrics

The system tracks various metrics:

- **Workflow Metrics**
  - Total workflows executed
  - Success/failure rates
  - Average duration
  - Resource usage

- **Git Metrics**
  - Commits created
  - Branches managed
  - Files changed
  - Code churn

- **Agent Metrics**
  - Tasks completed
  - Lines of code generated
  - Tests written
  - Documentation created

- **Transformation Metrics**
  - Files transformed
  - Improvements made
  - Performance gains
  - Quality scores

## 🚨 Troubleshooting

### Common Issues

1. **Ollama not responding**
   ```bash
   # Check Ollama status
   curl http://localhost:11434/api/tags
   
   # Restart Ollama
   docker restart ollama
   ```

2. **Agent stuck in working state**
   ```bash
   # Check agent logs
   docker logs document-generator-agents
   
   # Restart multi-agent system
   pkill -f multi-agent-dev-system.js
   node multi-agent-dev-system.js
   ```

3. **Workflow failing**
   - Check workflow logs in Integration Hub
   - Verify all required tools are initialized
   - Check for missing dependencies
   - Run with `--dry-run` first

4. **Git operations failing**
   - Ensure clean git status
   - Check branch permissions
   - Verify no merge conflicts
   - Check `.gitignore` patterns

## 🎯 Best Practices

1. **Start Small**
   - Test individual components first
   - Use dry-run mode initially
   - Monitor the first few automated actions

2. **Configure Wisely**
   - Set appropriate commit thresholds
   - Use semantic branch names
   - Configure ignore patterns correctly

3. **Monitor Actively**
   - Use Integration Hub dashboard
   - Check logs regularly
   - Review AI-generated code
   - Validate test coverage

4. **Cost Management**
   - Use local Ollama when possible
   - Cache AI responses
   - Batch operations
   - Monitor API usage

5. **Safety First**
   - Always backup before major operations
   - Use worktrees for experiments
   - Test workflows on sample projects
   - Review automated commits

## 🔗 Integration Examples

### CI/CD Integration
```yaml
# GitHub Actions example
name: AI Automation
on:
  push:
    branches: [main]

jobs:
  ai-review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run AI Code Review
        run: |
          npm install
          node workflow-orchestrator.js run code-review \
            files="${{ github.event.commits[0].modified }}"
```

### Pre-commit Hook
```bash
#!/bin/sh
# .git/hooks/pre-commit

# Run code transformer on staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(js|ts)$')

if [ -n "$STAGED_FILES" ]; then
  node code-transformer-pipeline.js $STAGED_FILES \
    --transformations add-jsdoc,improve-naming
  
  # Re-stage transformed files
  git add $STAGED_FILES
fi
```

### Scheduled Tasks
```javascript
// schedule-automation.js
const cron = require('node-cron');
const { exec } = require('child_process');

// Weekly refactoring
cron.schedule('0 0 * * SUN', () => {
  exec('node workflow-orchestrator.js run refactor target=src scope=minimal');
});

// Daily documentation updates
cron.schedule('0 2 * * *', () => {
  exec('node workflow-orchestrator.js run documentation target=src');
});
```

## 🚀 Getting Started

1. **Initial Setup**
   ```bash
   # Install dependencies
   npm install
   
   # Pull Ollama models
   ollama pull codellama:7b
   ollama pull mistral
   
   # Create config file
   cp .automation-config.example.json .automation-config.json
   ```

2. **Start Core Services**
   ```bash
   # Start Integration Hub
   node integration-hub.js &
   
   # Start Git Orchestrator
   node ai-git-orchestrator.js &
   
   # Start Multi-Agent System
   node multi-agent-dev-system.js &
   ```

3. **Run Your First Workflow**
   ```bash
   # Create a simple feature
   node workflow-orchestrator.js run feature-development \
     feature_name="hello-world" \
     specification="Add a hello world endpoint"
   ```

4. **Monitor Progress**
   - Open http://localhost:8888/dashboard
   - Watch real-time updates
   - Check generated code
   - Review automated commits

## 📚 Additional Resources

- [Workflow Template Reference](./workflow-templates/README.md)
- [Agent Development Guide](./docs/agent-development.md)
- [Custom Workflow Creation](./docs/custom-workflows.md)
- [AI Model Selection](./docs/ai-models.md)
- [Security Considerations](./docs/security.md)

---

**Note**: This system is designed to augment, not replace, human developers. Always review AI-generated code and maintain oversight of automated operations.