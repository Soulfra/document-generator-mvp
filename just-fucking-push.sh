#!/bin/bash
#
# JUST FUCKING PUSH - NO BULLSHIT VERSION
# This actually works using personal access token
#

echo "🚀 JUST FUCKING PUSH - FINAL VERSION"
echo "===================================="
echo ""

# Check if we have a token
if [ ! -f ".github-token" ]; then
    echo "❌ No GitHub token found"
    echo ""
    echo "Get a Personal Access Token:"
    echo "1. Go to https://github.com/settings/tokens"
    echo "2. Click 'Generate new token (classic)'"
    echo "3. Select 'repo' scope"
    echo "4. Copy the token"
    echo ""
    read -p "Paste your GitHub token: " token
    
    if [ -n "$token" ]; then
        echo "$token" > .github-token
        echo "✅ Token saved"
    else
        echo "❌ No token provided, exiting"
        exit 1
    fi
fi

# Load the token
TOKEN=$(cat .github-token)
echo "✅ Using saved GitHub token"

# Add everything
echo "📦 Adding all changes..."
git add . 2>/dev/null || true

# Commit with timestamp
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
echo "💾 Creating commit: Auto-push $TIMESTAMP"
git commit -m "Auto-push: $TIMESTAMP - Document Generator updates" 2>/dev/null || echo "Nothing new to commit"

# Get current remote URL
REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")

if [ -z "$REMOTE_URL" ]; then
    echo "❌ No remote origin found"
    read -p "Enter your GitHub repo URL (https://github.com/user/repo.git): " repo_url
    if [ -n "$repo_url" ]; then
        git remote add origin "$repo_url"
        REMOTE_URL="$repo_url"
        echo "✅ Added remote origin"
    else
        echo "❌ No repo URL provided"
        exit 1
    fi
fi

# Configure remote with token
echo "🔐 Configuring authenticated remote..."
AUTH_URL=$(echo "$REMOTE_URL" | sed "s|https://|https://$TOKEN@|")
git remote set-url origin "$AUTH_URL"

# Push
echo "🚀 Pushing to GitHub..."
if git push -u origin main 2>/dev/null; then
    echo ""
    echo "✅ SUCCESSFULLY PUSHED TO GITHUB!"
    echo "🔗 View at: $(echo $REMOTE_URL | sed 's|\.git||')"
else
    echo ""
    echo "⚠️ Push failed, trying to set upstream..."
    if git push --set-upstream origin main 2>/dev/null; then
        echo "✅ PUSHED WITH UPSTREAM SET!"
    else
        echo "❌ Push still failed. Check your token permissions."
        echo "Make sure your token has 'repo' scope and you have push access."
    fi
fi

# Clean up the auth URL for security
git remote set-url origin "$REMOTE_URL"
echo ""
echo "🔒 Cleaned up authentication from remote URL"