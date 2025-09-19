#!/bin/bash
# Auto-generated symlink setup for template system
# Avoids Claude conflicts by using separate namespace

echo "🔗 Setting up template symlinks..."

# Create main symlinks directory
mkdir -p symlinks

# Link to kisuke templates (analysis and organization)
ln -sf ../FinishThisIdea/templates symlinks/kisuke-templates
ln -sf ../ai-os-clean/templates symlinks/kisuke-patterns

# Link to conductor templates (service orchestration)  
ln -sf ../templates symlinks/conductor-services
ln -sf ../tier-3/templates symlinks/conductor-tier3

# Link to tunnel templates (data pipelines)
ln -sf ../FinishThisIdea-archive/templates symlinks/tunnel-archive
ln -sf ../mcp symlinks/tunnel-mcp

# Link to vibevault templates (pattern recognition)
ln -sf ../finishthisidea-worktrees symlinks/vibevault-worktrees

echo "✅ Symlink setup complete"
echo "🎯 Templates available via symlinks/ directory"
