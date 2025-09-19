# Special Services Integration Guide

This guide explains how to integrate and use the three special services with the Document Generator's Docker setup.

## 🎯 Overview

Three special services have been integrated:

1. **Guardian Teacher System** (Port 9999) - AI teaching and monitoring system
2. **AI Agent Crypto Casino** (Port 9707) - Crypto casino for AI agents
3. **Infinity Router System** (Port 8000) - Quantum routing through infinite pathways

## 🚀 Quick Start

### Start All Special Services
```bash
./launch-special-services.sh all
```

### Start Individual Services
```bash
./launch-special-services.sh guardian    # Guardian Teacher only
./launch-special-services.sh casino      # AI Casino only
./launch-special-services.sh infinity    # Infinity Router only
./launch-special-services.sh orchestrator # Orchestrator only
```

### Stop Services
```bash
./launch-special-services.sh stop
```

### View Logs
```bash
./launch-special-services.sh logs
```

### Check Status
```bash
./launch-special-services.sh status
```

## 📁 File Structure

```
Document-Generator/
├── docker-compose.special-services.yml  # Docker Compose for special services
├── Dockerfile.guardian                   # Guardian Teacher container
├── Dockerfile.casino                     # AI Casino container
├── Dockerfile.infinity                   # Infinity Router container
├── Dockerfile.orchestrator               # Orchestrator container
├── guardian-teacher-system.js            # Guardian implementation
├── TEACHER-GUIDED-AGENT-SYSTEM.js       # Teacher system implementation
├── ai-agent-crypto-casino-reasoning-differential.js  # Casino implementation
├── infinity-router-system.js             # Infinity Router implementation
├── special-services-orchestrator.js      # Orchestrator implementation
└── launch-special-services.sh            # Launch script
```

## 🛡️ Guardian Teacher System (Port 9999)

**Purpose**: Provides AI teaching capabilities and monitors system for critical issues.

**Features**:
- Real-time monitoring for ELOOP errors, crashes, and performance issues
- Educational content for complex problems
- Interactive teaching interface
- Alert system with multiple severity levels

**Access**: http://localhost:9999

**Example Usage**:
```javascript
// The Guardian automatically monitors and alerts on issues
// It provides teaching moments when problems are detected
```

## 🎰 AI Agent Crypto Casino (Port 9707)

**Purpose**: A crypto casino where AI agents can gamble, bet, and trade.

**Features**:
- Multiple AI agent types (trading bots, pattern agents, chaos agents)
- DGAI token economy
- Betting and gambling mechanics
- Risk/reward multipliers
- Team competitions

**Access**: http://localhost:9707

**Agent Types**:
- Trading Bots: Market prediction specialists
- Pattern Agents: Pattern recognition experts
- Sentiment Bots: Market sentiment analyzers
- Ensemble Agents: Collective intelligence
- Evolution Bots: Adaptive learning agents
- Chaos Agents: Random strategy explorers

## ♾️ Infinity Router System (Port 8000)

**Purpose**: Routes through infinite possibilities using quantum mechanics.

**Features**:
- Quantum state superposition routing
- 42 parallel universes
- Multiple pathway types (standard, quantum, transcendent, recursive)
- Dimensional hopping
- Portal creation

**Access**: http://localhost:8000

**Pathway Types**:
- Standard: Direct routing with high probability
- Quantum: Superposition states and entanglement
- Transcendent: Enlightenment and consciousness expansion
- Recursive: Self-referential infinite loops

## 🎯 Special Services Orchestrator (Port 7000)

**Purpose**: Coordinates all three special services and provides a unified interface.

**Features**:
- Service health monitoring
- Coordination actions between services
- Visual dashboard
- Integration demonstrations

**Access**: http://localhost:7000

**Dashboard Features**:
- Real-time service status
- One-click integration demos
- Coordination actions:
  - Teach AI agents about the casino
  - Route agents through infinity to casino
  - Open portals to different universes
  - Full integration demonstration

## 🔧 Docker Integration

### Using with Main Docker Compose

The special services are designed to work alongside the main Document Generator services:

```bash
# Start main services first
docker-compose up -d

# Then start special services
docker-compose -f docker-compose.special-services.yml up -d
```

### Network Configuration

All services use the same Docker network (`document-generator`) for seamless communication.

### Volume Mounts

Each service has its own volume for logs and data:
- `guardian-logs`, `guardian-data`
- `casino-state`, `casino-logs`
- `infinity-routes`, `infinity-universes`, `infinity-logs`
- `orchestrator-logs`

## 🎮 Integration Examples

### Example 1: Teaching AI Agents
```bash
# Guardian teaches agents about economic systems
curl -X POST http://localhost:7000/coordinate \
  -H "Content-Type: application/json" \
  -d '{
    "action": "teach_agents",
    "topic": "AI_AGENT_ECONOMY",
    "guidance": "How to participate in crypto casinos"
  }'
```

### Example 2: Routing to Casino
```bash
# Use Infinity Router to send agent to casino
curl -X POST http://localhost:7000/coordinate \
  -H "Content-Type: application/json" \
  -d '{
    "action": "route_to_casino",
    "agent": "trading_bot_001",
    "pathway": "quantum"
  }'
```

### Example 3: Full Integration Demo
```bash
# Run complete integration demonstration
curl -X POST http://localhost:7000/coordinate \
  -H "Content-Type: application/json" \
  -d '{"action": "full_integration_demo"}'
```

## 🛠️ Troubleshooting

### Service Won't Start
```bash
# Check if ports are already in use
lsof -i :9999  # Guardian
lsof -i :9707  # Casino
lsof -i :8000  # Infinity
lsof -i :7000  # Orchestrator

# Check Docker logs
docker-compose -f docker-compose.special-services.yml logs [service-name]
```

### Database Connection Issues
Make sure PostgreSQL is running:
```bash
docker-compose up -d postgres
```

### Network Issues
Ensure the Docker network exists:
```bash
docker network create document-generator
```

## 🔗 Service Communication

The services communicate as follows:

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│    Guardian     │────▶│   Orchestrator   │◀────│  Infinity       │
│    Teacher      │     │   (Port 7000)    │     │  Router         │
│  (Port 9999)    │     └────────┬─────────┘     │ (Port 8000)     │
└─────────────────┘              │                └─────────────────┘
                                 │
                                 ▼
                        ┌──────────────────┐
                        │   AI Casino      │
                        │  (Port 9707)     │
                        └──────────────────┘
```

## 📊 Monitoring

Access the Orchestrator Dashboard at http://localhost:7000 to:
- View real-time status of all services
- Execute coordination actions
- Monitor service health
- Run integration demonstrations

## 🚨 Important Notes

1. **Resource Usage**: These services can be resource-intensive, especially the Infinity Router with its quantum calculations
2. **Data Persistence**: Service data is persisted in Docker volumes
3. **Security**: These are demonstration services - additional security measures needed for production
4. **Dependencies**: Requires PostgreSQL and Redis from main docker-compose.yml

## 📝 Next Steps

1. Visit http://localhost:7000 to see the orchestrator dashboard
2. Try the "Full Integration Demo" button
3. Explore individual service endpoints
4. Check logs for detailed operation information

---

*Special Services: Where AI teaching meets quantum routing and crypto gambling!*