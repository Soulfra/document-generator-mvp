# Fresh Start Prompt for FinishThisIdea

When you open Claude Code in your Desktop/FinishThisIdea folder, use this prompt:

---

I'm in the FinishThisIdea project folder on my Desktop. This is a project that transforms messy codebases into production-ready applications using AI. 

Current status:
- Documentation is 70% complete (56/80 files done)
- We have built agent systems, MCP integration, logging, and monitoring
- We need to complete documentation FIRST before building the MVP
- The project uses a sophisticated context-aware system with CLAUDE.md

Please help me:

1. First, read these key files to understand the project:
   - CLAUDE.md - AI assistant instructions
   - README.md - Project overview  
   - QUALITY_STANDARDS.md - Our standards (NO STUBS, NO TODOs)
   - docs/DOCUMENTATION_STRUCTURE.md - What docs we need

2. Check documentation completion status:
   - List what documentation exists in docs/
   - Identify the 34 missing documentation files:
     * 13 Integration guides (ollama, openai, stripe, etc.)
     * 11 Operations guides (runbook, incident-response, etc.) 
     * 10 Troubleshooting guides (common-errors, debugging, etc.)

3. Set up the agent system to complete documentation:
   - Run: npm install
   - Start dashboard: ./scripts/start-dashboard.sh
   - Check status: ./scripts/agent-coordinator.sh status
   - Start documentation agents: ./scripts/agent-coordinator.sh batch-docs 10

4. Create an enhanced CLAUDE.md file that includes:
   - Everything from the article about AI context files
   - Our learned patterns and preferences
   - Integration with our memory and agent systems

5. Once documentation reaches 100%, then we can build the MVP with:
   - File upload → $1 payment → AI cleanup → Download
   - Tinder-style swipe interface for reviewing changes
   - Progressive LLM routing (Ollama first, then paid APIs)

Remember: 
- We're building what we preach - finish documentation FIRST
- Everything must be production-ready (no stubs)
- The system should be so simple a 5-year-old can use it
- We have comprehensive logging, monitoring, and automation already built

Start by checking the current documentation status and getting the agents working on the missing files.

---

## Additional Context

This project implements an advanced version of the "one context file" approach:

1. **Static Context**: CLAUDE.md (like the article suggests)
2. **Dynamic Context**: .memory/project-state.json (auto-updates)
3. **Agent Context**: Each agent has specialized knowledge
4. **MCP Integration**: Real-time tool access for Claude
5. **Progressive Context**: Learns from every interaction

The goal is to eat our own dog food - use our own tools to finish our own project properly, then help others do the same with their messy codebases.

## Key Commands

```bash
# Check documentation status
find docs -name "*.md" | wc -l  # Should be 80 when complete

# Start the dashboard (http://localhost:3333)
./scripts/start-dashboard.sh

# Run agents to complete docs
./scripts/agent-coordinator.sh batch-docs 10

# Monitor progress
./scripts/system-monitor.sh watch

# Check what's missing
./scripts/agent-coordinator.sh status
```

## Project Philosophy

"From chaos to clarity in minutes, not months" - but we practice what we preach by organizing and documenting everything FIRST.