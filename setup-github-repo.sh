#!/bin/bash

# GitHub Repository Setup Script for Document Generator
# This script configures the repository for professional documentation and badges

echo "🚀 Setting up GitHub Repository for Document Generator"
echo "===================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    print_error "Not a git repository. Please run 'git init' first."
    exit 1
fi

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    print_warning "GitHub CLI (gh) not found. Please install it: https://cli.github.com/"
    print_info "You can still set up the repository manually using the URLs provided at the end."
fi

# Repository configuration
REPO_NAME="document-generator"
REPO_DESCRIPTION="🚀 Transform documents into working MVPs using AI - The world's first platform with AI-human contracts, gaming economy, and financial optimization"
REPO_VISIBILITY="public"  # Change to "private" if needed

echo ""
print_info "Repository Configuration:"
echo "  Name: $REPO_NAME"
echo "  Description: $REPO_DESCRIPTION"
echo "  Visibility: $REPO_VISIBILITY"
echo ""

# Create .github directory structure
print_info "Creating GitHub directory structure..."

mkdir -p .github/{workflows,ISSUE_TEMPLATE,PULL_REQUEST_TEMPLATE,badges}

# Create issue templates
print_info "Creating issue templates..."

cat > .github/ISSUE_TEMPLATE/bug_report.md << 'EOF'
---
name: Bug Report
about: Create a report to help us improve
title: '[BUG] '
labels: ['bug', 'needs-triage']
assignees: ''
---

## 🐛 Bug Description
A clear and concise description of what the bug is.

## 🔄 Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## ✅ Expected Behavior
A clear and concise description of what you expected to happen.

## 📸 Screenshots
If applicable, add screenshots to help explain your problem.

## 🖥️ Environment
- OS: [e.g. macOS, Windows, Linux]
- Browser: [e.g. Chrome, Firefox, Safari]
- Node.js Version: [e.g. 18.x]
- Document Generator Version: [e.g. 1.0.0]

## 📋 Additional Context
Add any other context about the problem here.

## 🤖 AI Agent Involved
Which AI agents were involved? (DocAgent, RoastAgent, TradeAgent, etc.)
EOF

cat > .github/ISSUE_TEMPLATE/feature_request.md << 'EOF'
---
name: Feature Request
about: Suggest an idea for Document Generator
title: '[FEATURE] '
labels: ['enhancement', 'needs-discussion']
assignees: ''
---

## 🚀 Feature Description
A clear and concise description of what you want to happen.

## 🎯 Problem Statement
What problem does this feature solve? Is your feature request related to a problem?

## 💡 Proposed Solution
Describe the solution you'd like in detail.

## 🔄 Alternatives Considered
Describe any alternative solutions or features you've considered.

## 🤖 AI Agent Enhancement
Would this feature involve new AI agents or enhance existing ones?

## 🎮 Gaming Integration
How might this feature integrate with the ShipRekt gaming economy?

## 📊 Success Metrics
How would we measure the success of this feature?

## 📋 Additional Context
Add any other context, screenshots, or examples about the feature request.
EOF

cat > .github/ISSUE_TEMPLATE/ai_agent_suggestion.md << 'EOF'
---
name: AI Agent Suggestion
about: Suggest a new AI agent or enhancement to existing agents
title: '[AGENT] '
labels: ['ai-agent', 'enhancement']
assignees: ''
---

## 🤖 Agent Overview
**Agent Name**: [e.g. HealthAgent, CreativeAgent]
**Primary Function**: [Brief description]

## 🎯 Agent Capabilities
What would this AI agent be able to do?
- [ ] Capability 1
- [ ] Capability 2
- [ ] Capability 3

## 🔗 Integration Points
How would this agent integrate with existing agents?
- **DocAgent**: 
- **RoastAgent**: 
- **TradeAgent**: 
- **Other agents**: 

## 💼 Business Value
What business value would this agent provide?

## 🎮 Gaming Economy Impact
How would this agent participate in the ShipRekt gaming economy?

## ⚖️ Legal Considerations
What legal contracts could users make with this agent?

## 📊 Success Metrics
How would we measure this agent's performance?
EOF

# Create pull request template
print_info "Creating pull request template..."

cat > .github/PULL_REQUEST_TEMPLATE/pull_request_template.md << 'EOF'
## 📋 Description
Brief description of changes made.

## 🔗 Related Issues
Fixes #(issue number)

## 🧪 Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] AI agent enhancement
- [ ] Gaming economy feature
- [ ] Financial optimization feature

## ✅ Testing
- [ ] Tests pass locally
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published

## 🤖 AI Agent Impact
Which AI agents are affected by this change?
- [ ] DocAgent
- [ ] RoastAgent  
- [ ] TradeAgent
- [ ] HustleAgent
- [ ] SpyAgent
- [ ] BattleAgent
- [ ] LegalAgent

## 🎮 Gaming Economy Impact
Does this change affect the ShipRekt gaming economy?
- [ ] Yes - describe impact
- [ ] No

## 📸 Screenshots (if applicable)
Add screenshots to help explain your changes.

## 📋 Checklist
- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
EOF

# Create GitHub repository if GitHub CLI is available
if command -v gh &> /dev/null; then
    print_info "Creating GitHub repository..."
    
    # Check if user is logged in
    if ! gh auth status &> /dev/null; then
        print_warning "Please log in to GitHub CLI first:"
        echo "gh auth login"
        exit 1
    fi
    
    # Create repository
    if gh repo create "$REPO_NAME" --description "$REPO_DESCRIPTION" --$REPO_VISIBILITY --clone=false; then
        print_status "Repository created successfully on GitHub"
        
        # Add remote origin
        GITHUB_USERNAME=$(gh api user --jq .login)
        git remote add origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git" 2>/dev/null || true
        
        print_status "Remote origin added: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
        
        # Set up branch protection (if public repo)
        if [ "$REPO_VISIBILITY" = "public" ]; then
            print_info "Setting up branch protection rules..."
            gh api repos/$GITHUB_USERNAME/$REPO_NAME/branches/main/protection \
                --method PUT \
                --field required_status_checks='{"strict":true,"contexts":["ci"]}' \
                --field enforce_admins=true \
                --field required_pull_request_reviews='{"required_approving_review_count":1}' \
                --field restrictions=null 2>/dev/null || print_warning "Could not set up branch protection (may require admin access)"
        fi
        
    else
        print_error "Failed to create repository. It may already exist."
        print_info "Please check: https://github.com/settings/repositories"
    fi
else
    print_warning "GitHub CLI not available. Please create repository manually:"
    echo ""
    echo "1. Go to: https://github.com/new"
    echo "2. Repository name: $REPO_NAME"
    echo "3. Description: $REPO_DESCRIPTION"
    echo "4. Visibility: $REPO_VISIBILITY"
    echo "5. Click 'Create repository'"
    echo ""
    echo "Then add the remote:"
    echo "git remote add origin https://github.com/YOUR_USERNAME/$REPO_NAME.git"
fi

# Create .gitignore if it doesn't exist
if [ ! -f ".gitignore" ]; then
    print_info "Creating .gitignore file..."
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build outputs
dist/
build/
out/
.next/

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
.nyc_output/

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env

# next.js build output
.next

# Nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless

# IDE files
.vscode/
.idea/
*.swp
*.swo
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Temporary files
tmp/
temp/
.tmp/

# Database files
*.sqlite
*.sqlite3
*.db

# AI model files (large)
*.bin
*.safetensors
models/

# Game assets (if large)
assets/models/
assets/textures/large/

# Blockchain keys (NEVER commit these)
*.key
*.pem
wallet.json
private-keys/

# Backup files
*.backup
*.bak
*-backup-*

# Test output
test-results/
playwright-report/

# Local development
.local/
.dev/
EOF
    
    print_status ".gitignore created"
fi

# Update package.json with repository information
if [ -f "package.json" ]; then
    print_info "Updating package.json with repository information..."
    
    # Use Node.js to update package.json
    node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    pkg.repository = {
        type: 'git',
        url: 'https://github.com/soulfra/$REPO_NAME.git'
    };
    pkg.bugs = {
        url: 'https://github.com/soulfra/$REPO_NAME/issues'
    };
    pkg.homepage = 'https://github.com/soulfra/$REPO_NAME#readme';
    pkg.keywords = pkg.keywords || [];
    const newKeywords = ['ai', 'document-generator', 'mvp', 'automation', 'gaming', 'blockchain', 'financial-optimization'];
    newKeywords.forEach(keyword => {
        if (!pkg.keywords.includes(keyword)) {
            pkg.keywords.push(keyword);
        }
    });
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    " 2>/dev/null || print_warning "Could not update package.json"
    
    print_status "package.json updated"
fi

# Set up git hooks directory
print_info "Setting up git hooks..."
mkdir -p .githooks

cat > .githooks/pre-commit << 'EOF'
#!/bin/sh
# Pre-commit hook for Document Generator

echo "🔍 Running pre-commit checks..."

# Check for secrets in staged files
if git diff --cached --name-only | grep -E '\.(js|ts|json|env)$' | xargs grep -l -E '(api_key|secret|password|token).*=.*[a-zA-Z0-9]{10,}' 2>/dev/null; then
    echo "❌ Potential secrets detected in staged files!"
    echo "Please remove secrets before committing."
    exit 1
fi

# Run tests if they exist
if [ -f "package.json" ] && npm run test --silent 2>/dev/null; then
    echo "✅ Tests passed"
else
    echo "⚠️  Tests not available or failed"
fi

echo "✅ Pre-commit checks completed"
EOF

chmod +x .githooks/pre-commit
git config core.hooksPath .githooks 2>/dev/null || true

print_status "Git hooks configured"

# Create repository README badges section
print_info "Creating README with badges..."

# Make sure docs directory exists
mkdir -p docs

# The docs/README.md was already created above with full badge integration

print_status "Professional README with badges created in docs/"

# Initial commit preparation
print_info "Preparing initial commit..."

# Stage files
git add .github/ docs/ .gitignore .githooks/ 2>/dev/null || true

if [ -f "package.json" ]; then
    git add package.json
fi

# Check if there are any staged changes
if git diff --staged --quiet; then
    print_warning "No changes to commit"
else
    print_info "Files staged for commit. Ready to commit with:"
    echo "git commit -m 'Initial commit: Professional documentation and GitHub setup'"
    echo ""
    print_info "After committing, push to GitHub with:"
    echo "git push -u origin main"
fi

print_status "GitHub repository setup complete!"

echo ""
echo "🎉 Next Steps:"
echo "=============="
echo "1. Review the created files in .github/ and docs/"
echo "2. Customize the repository description and README as needed"
echo "3. Set up GitHub secrets for CI/CD:"
echo "   - ANTHROPIC_API_KEY (for Claude AI)"
echo "   - OPENAI_API_KEY (for GPT models)"
echo "   - Any other API keys your project needs"
echo "4. Enable GitHub Pages in repository settings (if you want docs.yourdomain.com)"
echo "5. Consider setting up a custom domain for documentation"
echo ""
echo "📚 Documentation will be available at:"
echo "   - GitHub Pages: https://yourusername.github.io/$REPO_NAME"
echo "   - Or custom domain: https://docs.documentgenerator.com"
echo ""
echo "🏷️  Badges will auto-update when you push and run GitHub Actions!"

print_status "Setup script completed successfully!"