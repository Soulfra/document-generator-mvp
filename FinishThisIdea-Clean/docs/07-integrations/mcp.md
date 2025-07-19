# MCP (Model Context Protocol) Integration

## Overview

MCP (Model Context Protocol) enables Claude Code to deeply understand and interact with the FinishThisIdea codebase through custom tools, prompts, and resources. This integration provides context-aware AI assistance specifically tailored to our project.

## Features

### Custom Prompts
- **cleanup-service**: Generate a complete code cleanup service
- **api-endpoint**: Create REST API endpoints with validation
- **react-component**: Generate React components with TypeScript
- **test-suite**: Create comprehensive test suites
- **fix-issue**: Fix specific issues in the codebase

### Project-Aware Tools
- **generate-service**: Create new services from templates
- **analyze-code**: Analyze code for issues and improvements
- **run-tests**: Execute tests for specific modules
- **deploy**: Deploy services to different environments

### Context Resources
- **project-structure**: Current file organization
- **service-catalog**: Available services and descriptions
- **templates**: List of service templates
- **rules**: Coding standards and project rules

## Installation

### 1. Install Dependencies
```bash
npm install --save-dev @modelcontextprotocol/sdk
```

### 2. Run Setup Script
```bash
./setup-mcp.sh
```

This script will:
- Detect your operating system
- Create the Claude configuration directory
- Generate the MCP configuration file
- Test the MCP server
- Provide next steps

### 3. Manual Setup (Alternative)

If you prefer manual setup, create the MCP configuration file:

**macOS/Linux**: `~/.config/claude/mcp.json`
**Windows**: `%APPDATA%\Claude\mcp.json`

```json
{
  "servers": {
    "finishthisidea": {
      "command": "node",
      "args": ["/path/to/finishthisidea/.mcp/server.js"],
      "cwd": "/path/to/finishthisidea",
      "env": {
        "NODE_ENV": "development",
        "PROJECT_ROOT": "/path/to/finishthisidea"
      }
    }
  }
}
```

Replace `/path/to/finishthisidea` with your actual project path.

## Configuration

### MCP Server Configuration

The MCP server is configured in `.mcp/config.json`:

```json
{
  "mcpServers": {
    "finishthisidea": {
      "command": "node",
      "args": [".mcp/server.js"],
      "env": {
        "NODE_ENV": "development",
        "PROJECT_ROOT": "${workspaceFolder}"
      }
    }
  }
}
```

### Available Models

Configure AI model preferences:

```json
{
  "models": {
    "preferred": "claude-3-opus",
    "fallback": "gpt-4",
    "local": "ollama:codellama:13b"
  }
}
```

### Feature Flags

Enable/disable specific features:

```json
{
  "features": {
    "autoComplete": {
      "enabled": true,
      "debounceMs": 300,
      "contextLines": 50
    },
    "codeGeneration": {
      "enabled": true,
      "style": "typescript",
      "includeTests": true
    }
  }
}
```

## Usage

### Using Prompts

1. In Claude Code, type the prompt name:
   ```
   cleanup-service
   ```

2. Provide required arguments:
   - `name`: Service name (e.g., "image-optimizer")
   - `price`: Service price (e.g., "5")

3. Claude will generate a complete service implementation using the template.

### Using Tools

Tools can be invoked through Claude's interface:

```
generate-service --template base-service --name my-service
```

Or through natural language:
"Generate a new API endpoint for user authentication"

### Accessing Resources

Resources provide context about the project:

```
Show me the project structure
What templates are available?
What are the coding rules?
```

## Prompt Templates

### Creating Custom Prompts

Add new prompts in `.mcp/prompts/`:

```markdown
# .mcp/prompts/custom-prompt.md

Generate a {{type}} for {{feature}}

## Requirements
- Use TypeScript
- Include tests
- Follow project conventions

## Template
\`\`\`typescript
// Your template code here
\`\`\`
```

### Prompt Variables

Prompts support variable substitution:
- `{{name}}` - Replaced with user input
- `{{price}}` - Replaced with pricing
- `{{type}}` - Component/service type
- `{{description}}` - Feature description

## Tools Development

### Creating Custom Tools

Add tools to the MCP server in `.mcp/server.js`:

```javascript
// In setupHandlers() method
this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'custom-tool',
      description: 'Description of what this tool does',
      inputSchema: {
        type: 'object',
        properties: {
          param1: { type: 'string', description: 'First parameter' },
          param2: { type: 'number', description: 'Second parameter' }
        },
        required: ['param1']
      }
    }
  ]
}));

// In CallToolRequestSchema handler
case 'custom-tool':
  return await this.customTool(args);
```

### Tool Implementation

```javascript
async customTool(args) {
  // Tool logic here
  const result = await this.processCustomLogic(args);
  
  return {
    content: [
      {
        type: 'text',
        text: `Tool executed successfully: ${result}`
      }
    ]
  };
}
```

## Workflows

### Predefined Workflows

The MCP configuration includes several workflows:

1. **New Service Creation**
   - Select template
   - Configure service
   - Generate code
   - Add tests
   - Update documentation

2. **Code Cleanup**
   - Analyze code
   - Identify issues
   - Apply fixes
   - Validate results
   - Generate report

3. **Deployment**
   - Run tests
   - Build application
   - Deploy to staging
   - Run smoke tests
   - Deploy to production

### Custom Workflows

Add workflows to `.mcp/config.json`:

```json
{
  "workflows": {
    "custom-workflow": {
      "description": "Description of the workflow",
      "steps": [
        "Step 1 description",
        "Step 2 description",
        "Step 3 description"
      ]
    }
  }
}
```

## Troubleshooting

### MCP Not Available

If Claude Code shows "No MCP servers configured":

1. Ensure MCP configuration file exists:
   - macOS/Linux: `~/.config/claude/mcp.json`
   - Windows: `%APPDATA%\Claude\mcp.json`

2. Verify file permissions:
   ```bash
   ls -la ~/.config/claude/mcp.json
   ```

3. Check JSON syntax:
   ```bash
   cat ~/.config/claude/mcp.json | jq .
   ```

4. Restart Claude Code after configuration changes.

### Server Not Starting

If the MCP server fails to start:

1. Test the server manually:
   ```bash
   node .mcp/server.js
   ```

2. Check for missing dependencies:
   ```bash
   npm list @modelcontextprotocol/sdk
   ```

3. Verify Node.js version:
   ```bash
   node --version  # Should be >= 18.0.0
   ```

### Prompts Not Loading

If prompts aren't available:

1. Check prompt files exist:
   ```bash
   ls -la .mcp/prompts/
   ```

2. Verify prompt file format (must be `.md` files)

3. Check file permissions

## Best Practices

### 1. Keep Prompts Focused
- One task per prompt
- Clear variable names
- Include examples

### 2. Tool Naming
- Use descriptive names
- Follow kebab-case convention
- Include action verbs

### 3. Resource Organization
- Group related resources
- Use clear URIs
- Keep resources up-to-date

### 4. Error Handling
- Provide helpful error messages
- Include recovery suggestions
- Log errors for debugging

## Integration with CI/CD

### GitHub Actions

```yaml
name: MCP Validation
on: [push, pull_request]

jobs:
  validate-mcp:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Test MCP server
        run: |
          timeout 10 node .mcp/server.js || true
      
      - name: Validate prompts
        run: |
          for prompt in .mcp/prompts/*.md; do
            echo "Validating $prompt"
            # Add validation logic
          done
```

## Security Considerations

### 1. Environment Variables
- Never commit sensitive data in MCP config
- Use environment variables for secrets
- Validate all user inputs

### 2. File Access
- Restrict file operations to project directory
- Validate file paths
- Use allow-lists for file types

### 3. Command Execution
- Never execute arbitrary commands
- Use predefined, safe operations
- Log all tool executions

## Performance Optimization

### 1. Caching
- Cache project structure
- Reuse compiled templates
- Implement resource TTLs

### 2. Lazy Loading
- Load prompts on demand
- Defer heavy operations
- Use streaming responses

### 3. Resource Management
- Limit concurrent operations
- Implement request queuing
- Monitor memory usage

## Future Enhancements

### Planned Features
1. **Visual prompt builder**
2. **Tool marketplace**
3. **Workflow recorder**
4. **Performance analytics**
5. **Multi-project support**

### Community Contributions
- Submit prompts via PR
- Share custom tools
- Contribute workflows
- Report issues

## Related Documentation

- [Ollama Integration](ollama.md) - Local LLM setup
- [API Documentation](../06-api/README.md) - API endpoints
- [Development Guide](../04-implementation/README.md) - Implementation details
- [Tools Documentation](.mcp/tools/README.md) - Custom tools guide

---

*MCP enables Claude Code to understand your project like a team member would.*