#!/bin/bash
# 🚀 Document Generator Easy Aliases
# Add these to your ~/.bashrc or ~/.zshrc for super easy access

alias easy="node easy.js"
alias workflow="node workflow-runner.js" 
alias discover="node MasterDiscoveryOrchestrator.js"

# Super quick shortcuts
alias dg-setup="node easy.js setup"
alias dg-test="node easy.js test"
alias dg-deploy="node easy.js deploy"
alias dg-status="node easy.js status"
alias dg-find="node easy.js find"
alias dg-debug="node easy.js debug"

# Document processing
alias doc2mvp="node easy.js doc"

echo "🎯 Document Generator aliases loaded!"
echo "Try: easy setup, dg-test, doc2mvp ./mydoc.md"
