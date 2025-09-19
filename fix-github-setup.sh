#!/bin/bash
#
# Fix GitHub Remote Configuration for Document Generator
# This script helps clean up and properly configure your Git setup
#

echo "🔧 DOCUMENT GENERATOR - FIX GITHUB SETUP"
echo "======================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to check current git status
check_git_status() {
    echo -e "${CYAN}📊 Current Git Status:${NC}"
    echo "------------------------"
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        echo -e "${RED}❌ Not a Git repository!${NC}"
        echo "Run 'git init' first"
        exit 1
    fi
    
    # Show current branch
    echo -e "${GREEN}Branch:${NC} $(git branch --show-current)"
    
    # Show remotes
    echo -e "\n${GREEN}Remotes:${NC}"
    git remote -v
    
    # Show status
    echo -e "\n${GREEN}Status:${NC}"
    git status --short
    
    echo ""
}

# Function to fix remote configuration
fix_remote() {
    echo -e "${CYAN}🔧 Fixing Git Remote Configuration...${NC}"
    echo ""
    
    # Check if origin exists
    if git remote | grep -q "^origin$"; then
        echo -e "${YELLOW}⚠️  Remote 'origin' already exists${NC}"
        echo "Current origin URL:"
        git remote get-url origin
        echo ""
        read -p "Do you want to update it? (y/n): " update_remote
        
        if [[ $update_remote == "y" ]]; then
            read -p "Enter new GitHub repository URL: " github_url
            if [[ -n "$github_url" ]]; then
                git remote set-url origin "$github_url"
                echo -e "${GREEN}✅ Updated origin to: $github_url${NC}"
            fi
        fi
    else
        echo "No remote 'origin' found."
        read -p "Enter your GitHub repository URL: " github_url
        
        if [[ -n "$github_url" ]]; then
            git remote add origin "$github_url"
            echo -e "${GREEN}✅ Added origin: $github_url${NC}"
        else
            echo -e "${RED}❌ No URL provided, skipping remote setup${NC}"
        fi
    fi
}

# Function to clean up git configuration
cleanup_git_config() {
    echo -e "\n${CYAN}🧹 Cleaning up Git configuration...${NC}"
    
    # Set user name and email if not set
    if [[ -z "$(git config user.name)" ]]; then
        read -p "Enter your Git username: " git_username
        if [[ -n "$git_username" ]]; then
            git config user.name "$git_username"
            echo -e "${GREEN}✅ Set Git username: $git_username${NC}"
        fi
    else
        echo -e "${GREEN}✅ Git username: $(git config user.name)${NC}"
    fi
    
    if [[ -z "$(git config user.email)" ]]; then
        read -p "Enter your Git email: " git_email
        if [[ -n "$git_email" ]]; then
            git config user.email "$git_email"
            echo -e "${GREEN}✅ Set Git email: $git_email${NC}"
        fi
    else
        echo -e "${GREEN}✅ Git email: $(git config user.email)${NC}"
    fi
    
    # Set default branch name
    git config init.defaultBranch main
    echo -e "${GREEN}✅ Default branch set to: main${NC}"
}

# Function to update Soulfra page
update_soulfra_page() {
    echo -e "\n${CYAN}📄 Updating Soulfra Page...${NC}"
    
    # Create or update Soulfra page
    cat > soulfra-page.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Soulfra - Document Generator Platform</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
            color: #e0e0e0;
            margin: 0;
            padding: 0;
            min-height: 100vh;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        .header {
            text-align: center;
            margin-bottom: 3rem;
        }
        
        .header h1 {
            color: #4ecca3;
            font-size: 3rem;
            margin-bottom: 1rem;
        }
        
        .header p {
            font-size: 1.3rem;
            opacity: 0.9;
        }
        
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            margin: 3rem 0;
        }
        
        .feature-card {
            background: rgba(26, 26, 26, 0.8);
            border: 1px solid #3eb393;
            border-radius: 12px;
            padding: 2rem;
            transition: all 0.3s ease;
        }
        
        .feature-card:hover {
            transform: translateY(-5px);
            border-color: #4ecca3;
            box-shadow: 0 10px 30px rgba(78, 204, 163, 0.2);
        }
        
        .feature-card h3 {
            color: #4ecca3;
            margin-bottom: 1rem;
        }
        
        .cta {
            text-align: center;
            margin-top: 3rem;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(45deg, #4ecca3, #3eb393);
            color: #000;
            padding: 1rem 2rem;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.3s ease;
        }
        
        .cta-button:hover {
            transform: scale(1.05);
            box-shadow: 0 5px 20px rgba(78, 204, 163, 0.4);
        }
        
        .links {
            text-align: center;
            margin-top: 2rem;
            display: flex;
            justify-content: center;
            gap: 2rem;
        }
        
        .links a {
            color: #4ecca3;
            text-decoration: none;
        }
        
        .links a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌟 Soulfra</h1>
            <p>Transform Documents into Living Applications</p>
        </div>
        
        <div class="features">
            <div class="feature-card">
                <h3>📝 Author Studio</h3>
                <p>WordPress-meets-Twinery authoring system for creating interactive content and managing your digital presence.</p>
            </div>
            
            <div class="feature-card">
                <h3>🚀 Document Generator</h3>
                <p>Turn any document into a working MVP in under 30 minutes using AI-powered transformation.</p>
            </div>
            
            <div class="feature-card">
                <h3>🌐 Socket Platform</h3>
                <p>Real-time collaboration and live document processing through WebSocket connections.</p>
            </div>
            
            <div class="feature-card">
                <h3>🤖 AI Agents</h3>
                <p>7 specialized AI agents working together to optimize your documents and workflows.</p>
            </div>
            
            <div class="feature-card">
                <h3>⚔️ ShipRekt Battles</h3>
                <p>Gamified document processing with competitive team battles and rewards.</p>
            </div>
            
            <div class="feature-card">
                <h3>📊 Analytics</h3>
                <p>Track document transformations, AI usage, and platform performance in real-time.</p>
            </div>
        </div>
        
        <div class="cta">
            <a href="./index.html" class="cta-button">Launch Platform</a>
        </div>
        
        <div class="links">
            <a href="./author-studio.html">Author Studio</a>
            <a href="./socket-landing.html">Socket Platform</a>
            <a href="./unified-demo-hub.html">Demo Hub</a>
            <a href="https://github.com/yourusername/document-generator">GitHub</a>
        </div>
    </div>
    
    <script>
        // Auto-update copyright year
        document.addEventListener('DOMContentLoaded', () => {
            const year = new Date().getFullYear();
            const footer = document.createElement('div');
            footer.style.textAlign = 'center';
            footer.style.marginTop = '4rem';
            footer.style.opacity = '0.6';
            footer.innerHTML = `© ${year} Soulfra - Document Generator Platform`;
            document.querySelector('.container').appendChild(footer);
        });
    </script>
</body>
</html>
EOF
    
    echo -e "${GREEN}✅ Created/Updated soulfra-page.html${NC}"
}

# Function to create GitHub Pages index if needed
create_github_pages() {
    echo -e "\n${CYAN}📄 Setting up GitHub Pages...${NC}"
    
    if [[ ! -d "docs" ]]; then
        mkdir -p docs
        echo -e "${GREEN}✅ Created docs directory${NC}"
    fi
    
    # Copy necessary files to docs folder for GitHub Pages
    if [[ -f "soulfra-page.html" ]]; then
        cp soulfra-page.html docs/index.html
        echo -e "${GREEN}✅ Copied soulfra-page.html to docs/index.html${NC}"
    fi
    
    # Copy other necessary files
    for file in author-studio.html socket-landing.html unified-demo-hub.html index.html; do
        if [[ -f "$file" ]]; then
            cp "$file" "docs/"
            echo -e "${GREEN}✅ Copied $file to docs/${NC}"
        fi
    done
}

# Function to test GitHub connection
test_github_connection() {
    echo -e "\n${CYAN}🔗 Testing GitHub connection...${NC}"
    
    if git remote | grep -q "^origin$"; then
        echo "Testing connection to origin..."
        if git ls-remote origin > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Successfully connected to GitHub!${NC}"
            return 0
        else
            echo -e "${RED}❌ Failed to connect to GitHub${NC}"
            echo "Please check:"
            echo "1. Your GitHub repository exists"
            echo "2. You have the correct URL"
            echo "3. You're authenticated (SSH keys or HTTPS credentials)"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️  No origin remote configured${NC}"
        return 1
    fi
}

# Function to create a clean commit
create_clean_commit() {
    echo -e "\n${CYAN}💾 Creating a clean commit...${NC}"
    
    read -p "Do you want to stage all changes? (y/n): " stage_all
    
    if [[ $stage_all == "y" ]]; then
        git add .
        echo -e "${GREEN}✅ Staged all changes${NC}"
    else
        echo "Please stage your changes manually with 'git add'"
        return
    fi
    
    read -p "Enter commit message: " commit_msg
    if [[ -n "$commit_msg" ]]; then
        git commit -m "$commit_msg"
        echo -e "${GREEN}✅ Created commit${NC}"
    fi
}

# Function to push to GitHub
push_to_github() {
    echo -e "\n${CYAN}🚀 Pushing to GitHub...${NC}"
    
    if test_github_connection; then
        read -p "Push to GitHub? (y/n): " do_push
        if [[ $do_push == "y" ]]; then
            git push -u origin main
            echo -e "${GREEN}✅ Pushed to GitHub${NC}"
        fi
    fi
}

# Main execution
main() {
    echo -e "${CYAN}Starting GitHub setup fix...${NC}"
    echo ""
    
    # Check current status
    check_git_status
    
    # Fix remote configuration
    fix_remote
    
    # Clean up git config
    cleanup_git_config
    
    # Update Soulfra page
    update_soulfra_page
    
    # Create GitHub Pages structure
    create_github_pages
    
    # Test connection
    test_github_connection
    
    # Offer to create commit and push
    echo -e "\n${CYAN}📋 Next Steps:${NC}"
    echo "1. Stage your changes with 'git add .'"
    echo "2. Commit with a message: 'git commit -m \"Your message\"'"
    echo "3. Push to GitHub: 'git push -u origin main'"
    echo ""
    
    read -p "Do you want to do this now? (y/n): " do_now
    if [[ $do_now == "y" ]]; then
        create_clean_commit
        push_to_github
    fi
    
    echo -e "\n${GREEN}✅ GitHub setup fix complete!${NC}"
    echo ""
    echo "Your Git repository is now properly configured."
    echo "You can access your Author Studio at: ./author-studio.html"
    echo "Your Soulfra page is at: ./soulfra-page.html"
}

# Run main function
main