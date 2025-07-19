# MCP Setup Instructions for FinishThisIdea

## Quick Setup

1. **Run the setup script**:
   ```bash
   ./setup-mcp.sh
   ```

2. **Restart Claude Code**

3. **Test MCP**: Run `claude mcp` in Claude Code

## Manual Setup

If the script doesn't work, manually create the MCP config:

### macOS/Linux
```bash
mkdir -p ~/.config/claude
cat > ~/.config/claude/mcp.json << 'EOF'
{
  "servers": {
    "finishthisidea": {
      "command": "node",
      "args": ["$(pwd)/.mcp/server.js"],
      "cwd": "$(pwd)",
      "env": {
        "NODE_ENV": "development",
        "PROJECT_ROOT": "$(pwd)"
      }
    }
  }
}
EOF
```

### Windows (PowerShell)
```powershell
mkdir -Force "$env:APPDATA\Claude"
@"
{
  "servers": {
    "finishthisidea": {
      "command": "node",
      "args": ["$(pwd)\.mcp\server.js"],
      "cwd": "$(pwd)",
      "env": {
        "NODE_ENV": "development",
        "PROJECT_ROOT": "$(pwd)"
      }
    }
  }
}
"@ | Out-File "$env:APPDATA\Claude\mcp.json"
```

## Available MCP Features

### Prompts
- `cleanup-service` - Generate a code cleanup service
- `api-endpoint` - Create an API endpoint
- `react-component` - Generate a React component
- `test-suite` - Generate tests for code
- `fix-issue` - Fix a specific issue

### Tools
- `generate-service` - Generate a new service from template
- `analyze-code` - Analyze code for issues
- `run-tests` - Run tests for a module
- `deploy` - Deploy to an environment

### Resources
- `file://project-structure` - View project structure
- `file://service-catalog` - List available services
- `file://templates` - Show available templates
- `file://rules` - View project rules

## Troubleshooting

### "No MCP servers configured"
1. Check if config file exists:
   - macOS/Linux: `~/.config/claude/mcp.json`
   - Windows: `%APPDATA%\Claude\mcp.json`

2. Verify the paths in the config are absolute paths to your project

3. Restart Claude Code after creating the config

### Server not responding
1. Test the server: `node .mcp/server.js` (it should wait for input)
2. Check Node.js version: `node --version` (should be >= 18)
3. Ensure MCP SDK is installed: `npm list @modelcontextprotocol/sdk`

## Alternative: Use NPM Scripts

If MCP setup is problematic, you can use the existing npm scripts:

```bash
# Generate documentation index
npm run docs:index

# Check documentation status
npm run docs:status

# Generate a new service
npm run generate-service

# Run the main orchestrator
npm run orchestrate
```

---

For more details, see [docs/07-integrations/mcp.md](docs/07-integrations/mcp.md)