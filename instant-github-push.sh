#!/bin/bash
#
# INSTANT GITHUB PUSH - FUCK THE MANUAL BULLSHIT
# This uses your existing auth to push NOW
#

echo "🚀 INSTANT PUSH - NO QUESTIONS ASKED"
echo "===================================="
echo ""

# Just fucking do it
git add . 2>/dev/null || true

# Create a commit with timestamp
TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
git commit -m "Auto-push: $TIMESTAMP - Document Generator updates" 2>/dev/null || echo "Nothing to commit"

# Try to push with stored credentials
echo "🚀 Pushing to GitHub..."

# First try with any existing auth
git push -u origin main 2>/dev/null && {
    echo "✅ PUSHED SUCCESSFULLY!"
    exit 0
}

# If that failed, try using the OAuth token if available
if [ -f ".cookies.json" ]; then
    TOKEN=$(cat .cookies.json | grep -o '"github_token":"[^"]*' | cut -d'"' -f4)
    if [ -n "$TOKEN" ]; then
        REMOTE_URL=$(git remote get-url origin)
        AUTH_URL=$(echo $REMOTE_URL | sed "s|https://|https://$TOKEN@|")
        git remote set-url origin "$AUTH_URL"
        git push -u origin main && {
            echo "✅ PUSHED WITH OAUTH TOKEN!"
            exit 0
        }
    fi
fi

# Try personal access token
if [ -f ".github-token" ]; then
    TOKEN=$(cat .github-token)
    REMOTE_URL=$(git remote get-url origin)
    AUTH_URL=$(echo $REMOTE_URL | sed "s|https://|https://$TOKEN@|")
    git remote set-url origin "$AUTH_URL"
    git push -u origin main && {
        echo "✅ PUSHED WITH PERSONAL TOKEN!"
        exit 0
    }
fi

# Last resort - use auto-github-push.js
echo "🔄 Trying auto-push script..."
node auto-github-push.js