#!/bin/bash

echo "🧪 GitHub Auth Connection Test"
echo "============================="
echo ""

# Test 1: Check if .env has GitHub credentials
echo "1️⃣ Checking GitHub credentials in .env..."
if [ -f .env ]; then
    GITHUB_ID=$(grep GITHUB_CLIENT_ID .env | cut -d'=' -f2)
    if [[ "$GITHUB_ID" == *"your-github"* ]]; then
        echo "❌ GitHub credentials not configured"
        echo "   Please update .env with your GitHub OAuth app credentials"
    else
        echo "✅ GitHub credentials found"
    fi
else
    echo "❌ No .env file found"
fi
echo ""

# Test 2: Check if OAuth server is running
echo "2️⃣ Checking OAuth server (port 8000)..."
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ OAuth server is running"
    echo "   Dashboard: http://localhost:8000"
else
    echo "❌ OAuth server not running"
    echo "   Start with: node multi-provider-oauth-system.js"
fi
echo ""

# Test 3: Check direct auth server
echo "3️⃣ Checking direct auth server (port 7001)..."
if curl -s http://localhost:7001/health > /dev/null; then
    echo "✅ Direct auth server is running"
else
    echo "❌ Direct auth server not running"
    echo "   Start with: node direct-access-auth.js"
fi
echo ""

# Test 4: Test GitHub OAuth URL
echo "4️⃣ Testing GitHub OAuth endpoint..."
OAUTH_URL="http://localhost:8000/auth/github"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $OAUTH_URL)
if [ "$RESPONSE" = "302" ] || [ "$RESPONSE" = "303" ]; then
    echo "✅ GitHub OAuth endpoint working (redirects to GitHub)"
    echo "   Login URL: $OAUTH_URL"
else
    echo "❌ GitHub OAuth endpoint not responding correctly"
    echo "   Response code: $RESPONSE"
fi
echo ""

# Summary
echo "📋 Summary:"
echo "==========="
echo "1. GitHub Login Page: open portal/github-auth.html"
echo "2. GitHub OAuth URL: http://localhost:8000/auth/github"
echo "3. Dashboard: open portal/dashboard.html"
echo "4. Direct Auth: http://localhost:7001"
echo ""
echo "To start everything: ./start-github-auth.sh"
echo ""