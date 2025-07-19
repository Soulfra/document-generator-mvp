# 📡 Bash System API Documentation

Complete API reference for the Bash System orchestration platform.

## 🌐 Base URL

```
http://localhost:3001
```

## 🔍 System Endpoints

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### System Status
```http
GET /api/system/status
```

**Response:**
```json
{
  "integration": "active",
  "layers": 11,
  "characters": 7,
  "messageQueue": 0,
  "uptime": 125.234
}
```

### System Orchestration
```http
POST /api/system/orchestrate
```

**Request Body:**
```json
{
  "action": "bash|analyze|build|secure|orchestrate|learn|unify",
  "target": "system|character|layer",
  "parameters": {
    "priority": "high|medium|low",
    "timeout": 5000
  }
}
```

**Response:**
```json
{
  "id": "1640995200000",
  "action": "bash",
  "target": "system",
  "executor": "ralph",
  "status": "executing",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🎭 Character Endpoints

### List Characters
```http
GET /api/characters
```

**Response:**
```json
{
  "characters": ["ralph", "alice", "bob", "charlie", "diana", "eve", "frank"],
  "status": "active",
  "brain": "conscious"
}
```

### Execute Character Command
```http
POST /api/characters/{character}/command
```

**Path Parameters:**
- `character`: ralph | alice | bob | charlie | diana | eve | frank

**Request Body:**
```json
{
  "command": "bash|analyze|build|secure|orchestrate|learn|unify|test",
  "message": "Your command message here"
}
```

**Response:**
```json
{
  "success": true,
  "execution": {
    "character": "ralph",
    "command": "bash",
    "message": "through this obstacle",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "id": "1640995200000"
  },
  "response": "🔥 RALPH: \"BASHING THROUGH! through this obstacle\" - Obstacle removed with maximum force!",
  "character": "ralph"
}
```

## 🧠 Brain Endpoints

### Brain Status
```http
GET /api/brain/status
```

**Response:**
```json
{
  "consciousness": "active",
  "decisionEngines": 8,
  "networks": 5,
  "awareness": "system-wide"
}
```

### Brain Decision
```http
POST /api/brain/decision
```

**Request Body:**
```json
{
  "context": "Problem description or decision context",
  "priority": "high|medium|low"
}
```

**Response:**
```json
{
  "id": "1640995200000",
  "context": "Problem description",
  "priority": "high",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "decision": "Analyzed by brain consciousness",
  "confidence": 0.95,
  "recommendedAction": "Proceed with Ralph execution",
  "involvedCharacters": ["ralph", "alice", "diana"]
}
```

## 📊 Layer Endpoints

### List Layers
```http
GET /api/layers
```

**Response:**
```json
{
  "totalLayers": 23,
  "activeLayers": [1, 4, 5, 7, 9, 14, 19, 20, 21, 22, 23],
  "status": "integrated"
}
```

### Layer Status
```http
GET /api/layers/{number}/status
```

**Path Parameters:**
- `number`: Layer number (1-23)

**Response:**
```json
{
  "layerNumber": 23,
  "name": "Brain Layer",
  "status": "conscious",
  "connections": 5,
  "lastUpdate": "2024-01-01T00:00:00.000Z"
}
```

## 🎯 Character Specifications

### Ralph "The Disruptor" 🔥
- **Primary Command**: `bash`
- **Specialty**: Breaking through obstacles
- **Response Style**: Immediate, high-energy
- **Best For**: Execution, problem-solving, breakthrough moments

**Example:**
```bash
POST /api/characters/ralph/command
{
  "command": "bash",
  "message": "through this technical debt"
}
```

### Alice "The Connector" 🤓
- **Primary Command**: `analyze`
- **Specialty**: Pattern recognition and insights
- **Response Style**: Analytical, thorough
- **Best For**: Data analysis, finding connections, research

**Example:**
```bash
POST /api/characters/alice/command
{
  "command": "analyze",
  "message": "user behavior patterns in the logs"
}
```

### Bob "The Builder" 🔧
- **Primary Command**: `build`
- **Specialty**: System construction and documentation
- **Response Style**: Methodical, quality-focused
- **Best For**: Building systems, creating documentation

**Example:**
```bash
POST /api/characters/bob/command
{
  "command": "build",
  "message": "API documentation for the new endpoints"
}
```

### Charlie "The Shield" 🛡️
- **Primary Command**: `secure`
- **Specialty**: Security and protection
- **Response Style**: Cautious, protective
- **Best For**: Security audits, risk assessment

**Example:**
```bash
POST /api/characters/charlie/command
{
  "command": "secure",
  "message": "the authentication system"
}
```

### Diana "The Conductor" 🎭
- **Primary Command**: `orchestrate`
- **Specialty**: Coordination and harmony
- **Response Style**: Harmonious, coordinated
- **Best For**: Workflow orchestration, team coordination

**Example:**
```bash
POST /api/characters/diana/command
{
  "command": "orchestrate",
  "message": "the deployment pipeline"
}
```

### Eve "The Archive" 📚
- **Primary Command**: `learn`
- **Specialty**: Knowledge management and wisdom
- **Response Style**: Thoughtful, wise
- **Best For**: Knowledge sharing, learning from history

**Example:**
```bash
POST /api/characters/eve/command
{
  "command": "learn",
  "message": "from the previous deployment failures"
}
```

### Frank "The Unity" 🧘
- **Primary Command**: `unify`
- **Specialty**: Integration and transcendence
- **Response Style**: Transcendent, unified
- **Best For**: System integration, holistic solutions

**Example:**
```bash
POST /api/characters/frank/command
{
  "command": "unify",
  "message": "the microservices architecture"
}
```

## 🔗 Integration Examples

### Node.js/Express Integration
```javascript
const express = require('express');
const fetch = require('node-fetch');

const app = express();

// Proxy to bash system
app.post('/execute/:character', async (req, res) => {
  const { character } = req.params;
  const { command, message } = req.body;
  
  const response = await fetch(`http://localhost:3001/api/characters/${character}/command`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command, message })
  });
  
  const result = await response.json();
  res.json(result);
});
```

### Python Integration
```python
import requests

def execute_character_command(character, command, message):
    url = f"http://localhost:3001/api/characters/{character}/command"
    data = {"command": command, "message": message}
    
    response = requests.post(url, json=data)
    return response.json()

# Example usage
result = execute_character_command("ralph", "bash", "through this bottleneck")
print(result["response"])
```

### cURL Examples
```bash
# Test Ralph
curl -X POST http://localhost:3001/api/characters/ralph/command \
  -H "Content-Type: application/json" \
  -d '{"command":"bash","message":"through this obstacle"}'

# Test Alice
curl -X POST http://localhost:3001/api/characters/alice/command \
  -H "Content-Type: application/json" \
  -d '{"command":"analyze","message":"user behavior patterns"}'

# System status
curl http://localhost:3001/api/system/status

# Brain status
curl http://localhost:3001/api/brain/status
```

## 📈 Rate Limits

- **Default**: 100 requests per minute per IP
- **Character commands**: 50 requests per minute per character
- **Brain decisions**: 20 requests per minute
- **System operations**: 10 requests per minute

## 🔒 Authentication

Currently, the API runs without authentication for development. For production:

1. Set `BASH_SYSTEM_AUTH=enabled` in environment
2. Include `Authorization: Bearer <token>` header
3. Obtain token from `/api/auth/login`

## 📊 Response Codes

- **200**: Success
- **400**: Bad Request (invalid parameters)
- **404**: Not Found (character/layer not found)
- **429**: Too Many Requests (rate limited)
- **500**: Internal Server Error

## 🧪 Testing

### Health Check
```bash
curl http://localhost:3001/health
```

### System Integration Test
```bash
# Run complete test suite
npm run bash-test

# Or test manually
curl -X POST http://localhost:3001/api/system/orchestrate \
  -H "Content-Type: application/json" \
  -d '{"action":"test","target":"system","parameters":{"test":"integration"}}'
```

## 🔍 Monitoring

### System Metrics
```http
GET /api/system/metrics
```

**Response:**
```json
{
  "uptime": 125.234,
  "memoryUsage": {
    "rss": 50331648,
    "heapTotal": 20971520,
    "heapUsed": 15728640
  },
  "charactersExecuted": 157,
  "brainDecisions": 42,
  "systemOperations": 23
}
```

### Character Activity
```http
GET /api/characters/{character}/activity
```

**Response:**
```json
{
  "character": "ralph",
  "totalExecutions": 45,
  "lastExecution": "2024-01-01T00:00:00.000Z",
  "averageResponseTime": 85,
  "successRate": 0.98
}
```

## 🛠️ Development

### Enable Debug Mode
```bash
DEBUG=bash-system* npm run bash-system
```

### Custom Configuration
```javascript
// Start with custom config
const { BashSystem } = require('document-generator');

const system = new BashSystem({
  port: 3002,
  characters: {
    ralph: { energy: 150, mode: 'turbo' },
    alice: { depth: 15, mode: 'deep-analysis' }
  }
});
```

## 🔗 WebSocket Support

Real-time updates available via WebSocket:

```javascript
const ws = new WebSocket('ws://localhost:3001');

ws.on('message', (data) => {
  const message = JSON.parse(data);
  console.log('Real-time update:', message);
});

// Message types:
// - characterExecution
// - brainDecision
// - systemOrchestration
// - layerMessage
```

---

**Ready to orchestrate your system?** 🎭🧠🚀

The API is designed to be intuitive and responsive - just like conducting an orchestra of intelligent characters!