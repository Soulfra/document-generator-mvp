# Sovereign Agent Service

Autonomous AI agents with persistent identities, reasoning capabilities, and human conductor oversight for document-to-MVP generation.

## 🎯 Overview

The Sovereign Agent Service provides a complete ecosystem of autonomous AI agents that can:
- **Process documents** with human oversight into working MVPs
- **Fork child processes** for true autonomous execution
- **Maintain persistent memory** and emotional states
- **Collaborate with human conductors** through approval workflows
- **Generate end-to-end solutions** from chat logs or documents

## 🏗️ Architecture

```
Human Conductor ←→ Sovereign Agents ←→ Document Pipeline
       ↓                   ↓                    ↓
   Approval UI         Agent Pool          Template/Code Gen
   WebSocket          Process Forks        MVP Generation
```

### Core Components

- **SovereignAgent**: Main agent class with process forking and reasoning
- **SovereignAgentWorker**: Child process for autonomous execution
- **HumanConductorInterface**: Complete conductor control panel
- **DocumentAgentBridge**: Connects agents to document processing pipeline
- **Database Layer**: SQLite with JSON fallback for persistence

## 🚀 Quick Start

### With Docker (Recommended)
```bash
# Start all Document Generator services including sovereign agents
docker-compose up -d

# Check service health
curl http://localhost:8085/health

# List available agents
curl http://localhost:8085/api/sovereign/agents
```

### Local Development
```bash
cd services/sovereign-agents
npm install
npm start
```

## 📡 API Endpoints

### Agent Management
- `GET /api/sovereign/agents` - List all agents
- `POST /api/sovereign/agents` - Create new agent
- `GET /api/sovereign/agents/:id` - Get agent details
- `POST /api/sovereign/agents/:id/tasks` - Send task to agent

### Document Processing
- `POST /api/sovereign/process-document` - Process document with agents
- `GET /api/sovereign/sessions/:id` - Get processing session status

### Human Conductor
- `GET /api/sovereign/conductor/pending` - Get pending approvals
- `POST /api/sovereign/conductor/approve` - Approve agent action
- `POST /api/sovereign/conductor/reject` - Reject agent action

### Real-time Updates
- `WebSocket ws://localhost:8085` - Real-time agent status and approval requests

## 🧪 Testing

### Automated Testing
```bash
# Run comprehensive integration tests
./test-sovereign-integration.sh

# Test API endpoints only
./test-api-endpoints.sh
```

### Manual Testing
```bash
# Process a test document
curl -X POST http://localhost:8085/api/sovereign/process-document \
  -H "Content-Type: application/json" \
  -d '{
    "documentContent": "# My SaaS Idea\nBuild a user management system...",
    "documentType": "markdown"
  }'

# WebSocket connection (requires wscat)
wscat -c ws://localhost:8085
```

## 🎭 Agent Types

### Default Agents
1. **DocumentAnalyzer_Prime** - Analyzes documents and extracts requirements
2. **TemplateSelector_Alpha** - Selects appropriate templates based on analysis
3. **CodeGenerator_Beta** - Generates MVP code from templates and requirements

### Custom Agents
Create custom agents with specific personalities and capabilities:

```javascript
const agent = new SovereignAgent({
  name: 'CustomAgent_Gamma',
  personality: {
    creativity: 0.8,
    analytical: 0.9,
    collaborative: 0.7
  },
  capabilities: {
    specialFeature: true,
    reasoning: true
  },
  autonomyLevel: 6
});
```

## 🎮 Human Conductor Interface

The conductor interface allows humans to:
- **Monitor agent behavior** in real-time
- **Approve/reject agent decisions** based on confidence levels
- **Pause/resume agents** for maintenance
- **View agent memory and reasoning** sessions
- **Emergency stop** all agents if needed

## 🔄 Integration

### With Document Generator Pipeline
- Agents automatically process documents through the MCP template system
- Real-time coordination with template processor and code generation services
- End-to-end MVP creation with human approval gates

### With External Services
- **Ollama**: Local AI inference (preferred)
- **OpenAI/Anthropic**: Cloud AI fallback
- **Template Processor**: MCP template selection
- **Database**: Persistent agent memory and session storage

## 📊 Monitoring

### Health Checks
- Service health: `http://localhost:8085/health`
- Agent status: Individual agent health monitoring
- Database connectivity: Automatic fallback to file-based storage

### Metrics
- Document processing success rate
- Agent approval/rejection rates
- Average processing times
- Human conductor response times

## 🔧 Configuration

### Environment Variables
- `PORT`: Service port (default: 8085)
- `DATABASE_PATH`: SQLite database path
- `DATA_DIR`: File-based database fallback directory
- `OLLAMA_BASE_URL`: Local AI service URL
- `ANTHROPIC_API_KEY`: Cloud AI fallback
- `OPENAI_API_KEY`: Cloud AI fallback

### Agent Configuration
Agents can be configured with:
- **Personality traits**: Creativity, analytical thinking, collaboration
- **Autonomy levels**: 1-10 scale of independent decision making
- **Capabilities**: Specific skills and permissions
- **Approval requirements**: When human oversight is needed

## 🚨 Troubleshooting

### Common Issues
1. **Service won't start**: Check Docker and port availability
2. **Database errors**: Service falls back to file-based storage automatically
3. **Agent not responding**: Check process forking and IPC communication
4. **Approval timeouts**: Verify WebSocket connections

### Debug Commands
```bash
# Check service logs
docker-compose logs sovereign-agents

# Test database connectivity
curl http://localhost:8085/api/sovereign/agents

# Check agent processes
docker exec -it document-generator-sovereign-agents ps aux
```

## 🌟 Features

- ✅ **Autonomous Agent Execution** with process forking
- ✅ **Human-in-the-Loop** approval workflows
- ✅ **Persistent Agent Memory** and emotional states
- ✅ **Real-time WebSocket** updates
- ✅ **Document-to-MVP Pipeline** integration
- ✅ **Database Fallback** (SQLite → JSON files)
- ✅ **Multi-AI Backend** (Ollama → Cloud AI)
- ✅ **Docker Integration** with health checks

---

**Ready to conduct your sovereign agents!** 🎭✨