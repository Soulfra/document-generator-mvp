# MCP Integration Documentation

## Overview

This document explains how the Model Context Protocol (MCP) integration works in FinishThisIdea, why it's currently disconnected from the agent system, and how to properly implement both MCP and standalone content generation.

## The Problem

We have two separate systems that don't communicate:
1. **Agent System**: Bash-based multi-agent orchestration
2. **MCP System**: Node.js protocol server for AI assistants

These were built independently and never connected, violating our core principle of building complete, integrated systems.

## Current State

### What Works
- Agent coordinator creates worktrees and manages tasks
- MCP server can be started and provides tools to AI assistants
- Both systems work independently

### What's Broken
- Agent system can't call MCP tools
- MCP tools can't be executed directly (they require the protocol)
- No bridge between bash scripts and MCP server
- Missing dependencies (@modelcontextprotocol/sdk)

## How MCP Actually Works

### 1. Protocol Architecture
```
AI Assistant (Cursor/Claude) <--> MCP Server <--> Tools
         ^                            ^              ^
         |                            |              |
    stdio protocol              JavaScript      File System
```

### 2. MCP Server Lifecycle
```bash
# Start MCP server
npm run mcp:start

# Server listens on stdio
# AI assistant connects via .cursorrules
# Tools are exposed through protocol
# Results returned via protocol
```

### 3. Tool Execution Flow
1. AI requests tool via MCP protocol
2. Server validates request
3. Server executes tool function
4. Server returns result via protocol

## The Integration Solution

### Phase 1: Install Dependencies
```bash
npm install @modelcontextprotocol/sdk
```

### Phase 2: Create Standalone Generator
```javascript
// scripts/generate-real-content.js
#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

// Import content generation logic from MCP tool
const { generateEnhancedContent } = require('../.mcp/tools/content-generator-lib');

async function main() {
  const args = process.argv.slice(2);
  const category = args[0];
  const filename = args[1];
  const output = args[2];
  
  if (!category || !filename || !output) {
    console.error('Usage: generate-real-content.js <category> <filename> <output>');
    process.exit(1);
  }
  
  try {
    const content = await generateEnhancedContent(category, filename);
    await fs.mkdir(path.dirname(output), { recursive: true });
    await fs.writeFile(output, content, 'utf8');
    console.log(`Generated ${content.length} bytes of real content`);
  } catch (error) {
    console.error('Failed to generate content:', error);
    process.exit(1);
  }
}

main();
```

### Phase 3: Create MCP Bridge
```javascript
// scripts/agent-mcp-bridge.js
#!/usr/bin/env node

const { spawn } = require('child_process');
const { Client } = require('@modelcontextprotocol/sdk/client');

class AgentMCPBridge {
  async callTool(toolName, args) {
    // Start MCP server if not running
    const server = spawn('node', ['.mcp/server.js'], {
      stdio: ['pipe', 'pipe', 'inherit']
    });
    
    // Create MCP client
    const client = new Client();
    await client.connect(server.stdin, server.stdout);
    
    // Call tool
    const result = await client.callTool(toolName, args);
    
    // Cleanup
    server.kill();
    
    return result;
  }
}

// CLI interface
if (require.main === module) {
  const bridge = new AgentMCPBridge();
  const [tool, ...args] = process.argv.slice(2);
  
  bridge.callTool(tool, args)
    .then(result => {
      console.log(JSON.stringify(result));
      process.exit(0);
    })
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}
```

### Phase 4: Update Agent System
```bash
# In agent-work-real.sh
if [ -f "$PROJECT_ROOT/scripts/generate-real-content.js" ]; then
    echo "Using standalone content generator"
    node "$PROJECT_ROOT/scripts/generate-real-content.js" \
        "$category" "$filename" "$filepath"
elif [ -f "$PROJECT_ROOT/scripts/agent-mcp-bridge.js" ]; then
    echo "Using MCP bridge"
    node "$PROJECT_ROOT/scripts/agent-mcp-bridge.js" \
        create-doc-with-agent \
        --category="$category" \
        --filename="$filename" \
        --output="$filepath"
else
    echo "Using template generator"
    # ... existing template code ...
fi
```

## Testing Strategy

### 1. Unit Tests for Content Generation
```javascript
// tests/unit/content-generation.test.js
describe('Content Generation', () => {
  it('should generate real content, not stubs', async () => {
    const content = await generateContent('operations', 'test');
    expect(content.length).toBeGreaterThan(1000);
    expect(content).not.toContain('TODO');
    expect(content).toContain('## Prerequisites');
  });
});
```

### 2. Integration Test for MCP Bridge
```javascript
// tests/integration/mcp-bridge.test.js
describe('MCP Bridge', () => {
  it('should call MCP tools from agent system', async () => {
    const bridge = new AgentMCPBridge();
    const result = await bridge.callTool('create-doc-with-agent', {
      category: 'test',
      filename: 'mcp-test'
    });
    expect(result.success).toBe(true);
    expect(result.content).toHaveRealContent();
  });
});
```

### 3. E2E Test for Full Workflow
```javascript
// tests/e2e/documentation-workflow.test.js
describe('Documentation Workflow', () => {
  it('should create real documentation through agent system', async () => {
    // Create agent
    const agent = await createAgent('docs');
    
    // Assign task
    await assignTask(agent, 'docs/test/e2e-test.md');
    
    // Wait for completion
    await waitForCompletion(agent);
    
    // Verify content
    const content = await readFile(`worktrees/${agent}/docs/test/e2e-test.md`);
    expect(content).toHaveRealContent();
  });
});
```

## Implementation Checklist

- [ ] Install @modelcontextprotocol/sdk dependency
- [ ] Extract content generation logic into reusable module
- [ ] Create standalone content generator script
- [ ] Create MCP bridge for agent system
- [ ] Update agent-work-real.sh to use new tools
- [ ] Write unit tests for content generation
- [ ] Write integration tests for MCP bridge
- [ ] Write E2E tests for full workflow
- [ ] Update agent-coordinator.sh documentation
- [ ] Test both MCP and standalone paths

## Common Issues and Solutions

### Issue: MCP server won't start
**Solution**: Check if port is already in use, ensure dependencies installed

### Issue: Content still has TODOs
**Solution**: Verify using real generator, not template fallback

### Issue: Agent can't find tools
**Solution**: Check PROJECT_ROOT environment variable is set

### Issue: Tests fail on CI
**Solution**: Mock MCP server for unit tests, use real server for integration

## Best Practices

1. **Always test both paths**: MCP and standalone should produce identical output
2. **Version lock dependencies**: Prevent breaking changes
3. **Monitor content quality**: Automated checks for size and completeness
4. **Log everything**: Debug info for troubleshooting
5. **Fail loudly**: No silent failures or fallbacks to stubs

## Future Improvements

1. **Caching**: Cache generated content to speed up regeneration
2. **Templates**: User-customizable content templates
3. **AI Enhancement**: Use AI to improve generated content
4. **Metrics**: Track generation time and quality scores
5. **Webhooks**: Notify when documentation complete

---

*This documentation represents the complete integration plan for MCP and standalone content generation. Both systems will work together to ensure we always generate real, useful content.*

*Last Updated: 2025-06-26*
*Status: Planning Complete, Implementation Pending*