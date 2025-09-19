# Developer Setup Guide: Development Reality Engine
## From Zero to Verified Development in 30 Minutes

**Version:** 1.0.0  
**Date:** 2025-08-12  
**Purpose:** Complete setup guide for developers to start using the Development Reality Engine

---

## Prerequisites

### System Requirements
- **OS**: macOS 10.15+, Ubuntu 20.04+, Windows 10+ (WSL2)
- **Node.js**: 16.0+ (LTS recommended)
- **RAM**: 8GB minimum, 16GB recommended
- **Storage**: 10GB free space for evidence storage
- **Network**: Stable internet for AI services (optional)

### Required Software
```bash
# Check prerequisites
node --version  # Should be 16.0 or higher
npm --version   # Should be 8.0 or higher
git --version   # Should be 2.0 or higher

# Optional but recommended
docker --version  # For containerized deployments
python --version  # For AI integrations
```

## Quick Start (5 Minutes)

### Option 1: NPM Global Install
```bash
# Install DRE globally
npm install -g @dre/cli

# Verify installation
dre --version

# Run initial setup
dre init

# Start using immediately
dre wrap npm test
```

### Option 2: Docker Setup
```bash
# Pull DRE image
docker pull dre/development-reality-engine:latest

# Run with local directory mounted
docker run -it -v $(pwd):/workspace dre/development-reality-engine

# All DRE commands available inside container
dre help
```

### Option 3: Local Development Setup
```bash
# Clone repository
git clone https://github.com/dre/development-reality-engine.git
cd development-reality-engine

# Install dependencies
npm install

# Link CLI globally
npm link

# Verify setup
dre doctor
```

## Detailed Installation

### Step 1: Environment Setup

#### macOS
```bash
# Install Homebrew if needed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node

# Install optional dependencies
brew install --cask chromium  # For visual verification
brew install tesseract        # For OCR capabilities
brew install imagemagick      # For image processing
```

#### Ubuntu/Debian
```bash
# Update package list
sudo apt update

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs

# Install optional dependencies
sudo apt install -y chromium-browser  # For visual verification
sudo apt install -y tesseract-ocr     # For OCR capabilities
sudo apt install -y imagemagick       # For image processing

# For headless environments
sudo apt install -y xvfb  # Virtual display
```

#### Windows (WSL2)
```powershell
# Install WSL2 first
wsl --install

# Inside WSL2, follow Ubuntu instructions above
```

### Step 2: DRE Installation

#### Standard Installation
```bash
# Install DRE globally
npm install -g @dre/cli

# Or use yarn
yarn global add @dre/cli

# Or use pnpm
pnpm add -g @dre/cli
```

#### Development Installation
```bash
# Clone with submodules
git clone --recursive https://github.com/dre/development-reality-engine.git
cd development-reality-engine

# Install all dependencies
npm install

# Build from source
npm run build

# Run tests to verify
npm test

# Link for global usage
npm link
```

### Step 3: Initial Configuration

#### Interactive Setup
```bash
# Run interactive configuration
dre init

# This will prompt for:
# - Evidence storage location
# - AI service preferences
# - Integration options
# - Performance settings
```

#### Manual Configuration
```bash
# Create config directory
mkdir -p ~/.dre

# Generate default config
dre config generate > ~/.dre/config.json

# Edit configuration
dre config edit
```

#### Configuration Options
```json
{
  "evidence": {
    "storage": {
      "path": "~/.dre/evidence",
      "maxSize": "10GB",
      "retention": "30d"
    }
  },
  "verification": {
    "methods": ["visual", "programmatic", "behavioral"],
    "confidence": {
      "threshold": 0.95,
      "consensus": "majority"
    }
  },
  "ai": {
    "primary": "ollama",
    "fallback": ["openai", "anthropic"],
    "ollama": {
      "url": "http://localhost:11434",
      "models": ["codellama:7b", "mistral"]
    }
  },
  "integration": {
    "shell": "auto",
    "ide": ["vscode", "intellij"],
    "ci": ["github", "gitlab", "jenkins"]
  }
}
```

### Step 4: Shell Integration

#### Bash
```bash
# Add to ~/.bashrc
echo 'eval "$(dre shell-init bash)"' >> ~/.bashrc
source ~/.bashrc
```

#### Zsh
```bash
# Add to ~/.zshrc
echo 'eval "$(dre shell-init zsh)"' >> ~/.zshrc
source ~/.zshrc
```

#### Fish
```bash
# Add to ~/.config/fish/config.fish
echo 'dre shell-init fish | source' >> ~/.config/fish/config.fish
source ~/.config/fish/config.fish
```

#### PowerShell
```powershell
# Add to $PROFILE
Add-Content $PROFILE "`nInvoke-Expression (dre shell-init powershell)"
. $PROFILE
```

## First Project Setup

### Initialize DRE in Your Project
```bash
# Navigate to your project
cd my-project

# Initialize DRE
dre project init

# This creates:
# - .dre/config.json (project-specific config)
# - .dre/experiments/ (evidence storage)
# - .gitignore entries (for evidence files)
```

### Configure Project Settings
```bash
# Set project-specific verification levels
dre project config set verification.threshold 0.90

# Configure which commands to auto-wrap
dre project config set auto-wrap.commands "npm test, npm run build, git commit"

# Set evidence retention for this project
dre project config set evidence.retention 7d
```

### Add to Version Control
```bash
# DRE files to commit
git add .dre/config.json
git add .dre/schemas/
git add .dre/templates/

# DRE files to ignore (already in .gitignore)
# .dre/experiments/
# .dre/evidence/
# .dre/cache/
```

## IDE Integration

### VS Code
```bash
# Install extension
dre ide install vscode

# Or manually from marketplace
code --install-extension dre.vscode-development-reality-engine
```

**Features**:
- Automatic verification on save
- Evidence viewer in sidebar
- Inline verification status
- Quick actions for DRE commands

### IntelliJ IDEA
```bash
# Install plugin
dre ide install intellij

# Or from IDE: Settings → Plugins → Search "Development Reality Engine"
```

**Features**:
- Real-time verification feedback
- Evidence inspection tools
- Integrated debugging with evidence
- Git integration with auto-verification

### Sublime Text
```bash
# Install package
dre ide install sublime

# Or via Package Control: "Development Reality Engine"
```

## Basic Usage Examples

### Wrapping Commands
```bash
# Wrap any command for automatic verification
dre wrap npm test
dre wrap python script.py
dre wrap make build

# Or use shortcuts after shell integration
dw npm test  # 'dw' is alias for 'dre wrap'
```

### Verification Options
```bash
# Run with specific verification methods
dre wrap --verify visual,programmatic npm start

# Skip verification for quick operations
dre wrap --no-verify git status

# Set confidence threshold
dre wrap --confidence 0.99 npm run deploy
```

### Evidence Management
```bash
# View recent evidence
dre evidence list

# Inspect specific evidence
dre evidence show [uuid]

# Export evidence package
dre evidence export [uuid] --output evidence.zip

# Clean old evidence
dre evidence clean --older-than 7d
```

## AI Service Setup (Optional)

### Local AI with Ollama
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull required models
ollama pull codellama:7b
ollama pull mistral

# Configure DRE to use Ollama
dre config set ai.primary ollama
dre config set ai.ollama.url http://localhost:11434
```

### Cloud AI Services
```bash
# Configure OpenAI
dre config set ai.openai.key "sk-..."

# Configure Anthropic
dre config set ai.anthropic.key "sk-ant-..."

# Set fallback order
dre config set ai.fallback "['ollama', 'openai', 'anthropic']"
```

### BYOK (Bring Your Own Keys)
```bash
# Use environment variables
export DRE_OPENAI_KEY="sk-..."
export DRE_ANTHROPIC_KEY="sk-ant-..."

# Or user-specific config
dre auth add openai --key "sk-..."
dre auth add anthropic --key "sk-ant-..."
```

## CI/CD Integration

### GitHub Actions
```yaml
# .github/workflows/dre-verify.yml
name: DRE Verification
on: [push, pull_request]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup DRE
        uses: dre/setup-action@v1
        
      - name: Run Verification
        run: |
          dre wrap npm install
          dre wrap npm test
          dre wrap npm run build
          
      - name: Upload Evidence
        uses: actions/upload-artifact@v3
        with:
          name: dre-evidence
          path: .dre/experiments/
```

### GitLab CI
```yaml
# .gitlab-ci.yml
stages:
  - verify
  - build
  - deploy

verify:
  stage: verify
  image: dre/development-reality-engine:latest
  script:
    - dre wrap npm install
    - dre wrap npm test
  artifacts:
    paths:
      - .dre/experiments/
    reports:
      junit: .dre/reports/junit.xml
```

### Jenkins
```groovy
// Jenkinsfile
pipeline {
    agent any
    
    stages {
        stage('Setup') {
            steps {
                sh 'npm install -g @dre/cli'
            }
        }
        
        stage('Verify') {
            steps {
                sh 'dre wrap npm test'
                sh 'dre wrap npm run build'
            }
        }
        
        stage('Evidence') {
            steps {
                archiveArtifacts artifacts: '.dre/experiments/**/*'
                publishHTML([
                    reportDir: '.dre/reports',
                    reportFiles: 'index.html',
                    reportName: 'DRE Evidence Report'
                ])
            }
        }
    }
}
```

## Advanced Configuration

### Performance Tuning
```bash
# Enable parallel processing
dre config set processing.parallel true
dre config set processing.workers 4

# Configure evidence compression
dre config set evidence.compression gzip
dre config set evidence.compression.level 6

# Set memory limits
dre config set memory.max "2GB"
dre config set memory.evidence.cache "500MB"
```

### Security Hardening
```bash
# Enable evidence encryption
dre config set security.encryption.enabled true
dre config set security.encryption.algorithm "AES-256-GCM"

# Configure signing
dre config set security.signing.enabled true
dre config set security.signing.algorithm "RSA-SHA256"

# Set access controls
dre config set security.access.evidence "owner-only"
```

### Custom Integrations
```bash
# Add custom wrapper
dre wrapper add --name "my-build" --command "./build.sh"

# Add custom verifier
dre verifier add --name "security-scan" --script "./security-check.js"

# Add custom evidence collector
dre collector add --name "performance" --script "./perf-collect.js"
```

## Troubleshooting Setup

### Common Issues

#### "Command not found: dre"
```bash
# Check npm global bin path
npm config get prefix

# Add to PATH if needed
export PATH=$PATH:$(npm config get prefix)/bin

# Or reinstall globally
npm uninstall -g @dre/cli
npm install -g @dre/cli
```

#### "Permission denied" errors
```bash
# Fix npm permissions
sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}

# Or use npm-g-nosudo
curl -L https://git.io/npm-g-nosudo | sh
```

#### Dependencies not installing
```bash
# Clear npm cache
npm cache clean --force

# Use different registry
npm install -g @dre/cli --registry https://registry.npmjs.org

# Install with verbose logging
npm install -g @dre/cli --verbose
```

### Verification Commands
```bash
# Run comprehensive health check
dre doctor --comprehensive

# Test all features
dre self-test

# Verify specific component
dre test evidence-collection
dre test verification-engine
dre test ai-integration
```

## Next Steps

### 1. Run Your First Verification
```bash
# Start with a simple command
dre wrap echo "Hello, DRE!"

# View the evidence
dre evidence list
dre evidence show [uuid]
```

### 2. Integrate with Your Workflow
```bash
# Wrap your common commands
alias test="dre wrap npm test"
alias build="dre wrap npm run build"
alias deploy="dre wrap ./deploy.sh"
```

### 3. Explore Advanced Features
```bash
# Multi-modal verification
dre wrap --verify all npm start

# AI-powered analysis
dre analyze --ai [uuid]

# Continuous monitoring
dre monitor start
```

### 4. Join the Community
```bash
# Access community resources
dre community join

# Get help
dre help
dre docs
dre community forum
```

## Quick Reference Card

```bash
# Essential Commands
dre wrap [command]          # Wrap any command with verification
dre evidence list           # List recent evidence
dre evidence show [uuid]    # Inspect specific evidence
dre verify                  # Run verification on last operation
dre doctor                  # Check system health

# Configuration
dre config get [key]        # Get configuration value
dre config set [key] [val]  # Set configuration value
dre config edit             # Open config in editor

# Project Management
dre project init            # Initialize project
dre project status          # Show project verification status
dre project report          # Generate project report

# Debugging
dre debug [uuid]            # Debug specific operation
dre logs                    # Show recent logs
dre troubleshoot            # Interactive troubleshooting
```

## Conclusion

You're now ready to transform your development process with the Development Reality Engine. Start small with wrapping individual commands, then gradually expand to full workflow integration.

**Remember**: DRE enhances your existing workflow - it doesn't replace it. Start with observation mode and let the value guide your adoption pace.

---

**"Welcome to verified development. Your code will thank you."**

*Developer Setup Guide v1.0 - Your journey to scientific software development starts here.*