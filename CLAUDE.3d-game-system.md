# CLAUDE.3d-game-system.md - 3D Game System Documentation

## 🎮 System Overview

The 3D Game System is a comprehensive voxel-based gaming platform with AI agents, real-time persistence, and monitoring capabilities. Built as part of the Document Generator project to demonstrate how documents can be transformed into playable experiences.

## 📋 Version History

### v1.0.0 (2025-01-30)
- Initial 3D game engine implementation
- A* pathfinding for AI agents (fixes spinning behavior)
- PostgreSQL database integration
- Real-time monitoring dashboard
- WebSocket support for multiplayer
- Auto-save functionality
- Performance tracking

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Browser                            │
├─────────────────┬──────────────────┬────────────────────────────┤
│ Game Launcher   │ 3D Game Engine   │ Monitoring Dashboard       │
│ (Port 8888)     │ (Three.js)       │ (Port 9103)                │
└────────┬────────┴──────────┬───────┴────────────┬───────────────┘
         │                   │                    │
         ▼                   ▼                    ▼
┌────────────────────────────────────────────────────────────────┐
│                    Backend Services                             │
├─────────────────┬──────────────────┬───────────────────────────┤
│ Game Server     │ Verification     │ AI Behavior System        │
│ (Node.js)       │ Service          │ (A* Pathfinding)          │
│                 │ (Port 9102)      │                           │
└────────┬────────┴──────────┬───────┴────────────┬──────────────┘
         │                   │                    │
         ▼                   ▼                    ▼
┌────────────────────────────────────────────────────────────────┐
│                    Data Layer                                   │
├─────────────────┬──────────────────┬───────────────────────────┤
│ PostgreSQL      │ Redis Cache      │ MinIO Storage             │
│ (Port 5432)     │ (Port 6379)      │ (Port 9000)              │
└─────────────────┴──────────────────┴───────────────────────────┘
```

## 🔧 Core Components

### 1. Unified 3D Game Engine (`unified-3d-game-engine.js`)

**Purpose**: Core voxel-based game engine with physics and world generation

**Key Features**:
- Procedural world generation using Perlin noise
- Chunk-based world loading (16x128x16 blocks per chunk)
- Physics engine with gravity and collision detection
- Mining and building mechanics
- Inventory management
- Real-time lighting and shadows

**Integration Points**:
```javascript
// Initialize game engine
const gameEngine = new Unified3DGameEngine();
gameEngine.init({
    containerId: 'game-container',
    worldSeed: 12345,
    renderDistance: 3
});

// Connect to persistence
gameEngine.connectPersistence(persistenceService);

// Add AI agents
gameEngine.addAIAgent(aiAgent);
```

### 2. Enhanced AI Behavior System (`enhanced-ai-behavior-system.js`)

**Purpose**: Intelligent NPC behavior with pathfinding and goals

**Key Features**:
- A* pathfinding algorithm (prevents spinning)
- 6 behavior types: idle, explore, gather, build, socialize, trade
- Context-aware dialogue system
- Goal-oriented decision making
- Personality traits affect behavior

**Implementation Details**:
```javascript
// A* Pathfinding implementation
findPath(start, end) {
    const openSet = [this.createNode(start)];
    const closedSet = new Set();
    
    while (openSet.length > 0) {
        // Find node with lowest f score
        let current = openSet[0];
        let currentIndex = 0;
        
        for (let i = 1; i < openSet.length; i++) {
            if (openSet[i].f < current.f) {
                current = openSet[i];
                currentIndex = i;
            }
        }
        
        // Path found!
        if (this.isAtTarget(current.position, end)) {
            return this.reconstructPath(current);
        }
        
        // Move to closed set
        openSet.splice(currentIndex, 1);
        closedSet.add(this.positionKey(current.position));
        
        // Check neighbors
        const neighbors = this.getNeighbors(current.position);
        for (const neighbor of neighbors) {
            const key = this.positionKey(neighbor);
            if (closedSet.has(key)) continue;
            
            const tentativeG = current.g + 1;
            const node = this.createNode(neighbor, current, tentativeG, end);
            
            const existingIndex = openSet.findIndex(n => 
                this.positionKey(n.position) === key
            );
            
            if (existingIndex === -1) {
                openSet.push(node);
            } else if (tentativeG < openSet[existingIndex].g) {
                openSet[existingIndex] = node;
            }
        }
    }
    
    return []; // No path found
}
```

### 3. Game Persistence Service (`game-persistence-service.js`)

**Purpose**: Handles saving and loading game state to PostgreSQL

**Database Operations**:
- Auto-saves every 30 seconds
- Saves player position, inventory, health
- Tracks world modifications
- Logs AI behavior for analysis
- Records performance metrics

**Key Methods**:
```javascript
// Save player progress
await persistenceService.savePlayerProgress(playerId, sessionId, {
    position: player.position,
    inventory: player.inventory,
    health: player.health,
    experience: player.experience
});

// Save world chunk
await persistenceService.saveWorldChunk(sessionId, chunkId, chunkData);

// Track AI action
await persistenceService.trackAIAction(agentId, action, context);
```

### 4. Game Verification Service (`game-verification-service.js`)

**Purpose**: Monitors game health and validates operations

**Features**:
- WebSocket server on port 9102
- Real-time health checks
- Performance monitoring
- Anomaly detection
- Database connection validation

**Verification Checks**:
1. Database connectivity
2. Game engine status
3. AI system health
4. Physics engine validation
5. Multiplayer connectivity

### 5. Game Monitoring Dashboard (`game-monitoring-dashboard.html`)

**Purpose**: Real-time visualization of game metrics

**Dashboard Panels**:
- System Status (health score, service checks)
- Game Metrics (players, AI agents, chunks)
- AI Behavior (agent activities, goals)
- World Overview (chunk visualization)
- Performance (FPS chart, latency)
- System Logs (events, errors)
- Game Chat (player/NPC conversations)

## 📊 Database Schema

### Core Tables

```sql
-- Game Sessions
CREATE TABLE game_sessions (
    id UUID PRIMARY KEY,
    session_name VARCHAR(255),
    game_mode VARCHAR(50),
    world_seed INTEGER,
    created_at TIMESTAMP
);

-- Players
CREATE TABLE players (
    id UUID PRIMARY KEY,
    username VARCHAR(100) UNIQUE,
    created_at TIMESTAMP
);

-- AI Agents
CREATE TABLE ai_agents (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES game_sessions(id),
    name VARCHAR(100),
    personality JSONB,
    current_behavior VARCHAR(50)
);

-- World Chunks
CREATE TABLE world_chunks (
    id UUID PRIMARY KEY,
    session_id UUID REFERENCES game_sessions(id),
    chunk_x INTEGER,
    chunk_z INTEGER,
    chunk_data JSONB,
    modified_at TIMESTAMP
);
```

## 🚀 Launch Scripts

### Basic Launch
```bash
./launch-enhanced-3d-game.sh
```

### Verified Launch (with monitoring)
```bash
./launch-verified-3d-game.sh
```

### Individual Services
```bash
# Start verification service
node game-verification-service.js

# Start monitoring dashboard
python3 -m http.server 9103

# Initialize database
node init-game-database.js
```

## 🔄 Integration Flow

1. **Document Input** → Game content generation
2. **AI Analysis** → NPC personality and dialogue
3. **Template Matching** → Game mode selection
4. **World Generation** → Procedural terrain
5. **Persistence** → Save to PostgreSQL
6. **Monitoring** → Real-time dashboard

## 📝 Prompt Engineering Guide

### System Prompts for Game Content

```javascript
// Generate NPC from document
const npcPrompt = `
Analyze this document and create an NPC character:
- Extract personality traits
- Generate appropriate dialogue
- Define behavioral patterns
- Create backstory

Document: ${documentContent}
Return as JSON with: name, personality, dialogues, goals
`;

// Generate world features
const worldPrompt = `
Based on this document, suggest world features:
- Terrain types and biomes
- Points of interest
- Resource distribution
- Environmental hazards

Document: ${documentContent}
Return as structured world configuration
`;
```

### Prompt Reverse Engineering

To understand how the AI generates game content:

1. **Capture AI Decisions**
   ```javascript
   // Log AI reasoning
   aiAgent.on('decision', (data) => {
       logger.log('ai-reasoning', {
           agent: data.agentId,
           input: data.worldState,
           decision: data.chosenAction,
           reasoning: data.internalProcess
       });
   });
   ```

2. **Analyze Patterns**
   - What triggers specific behaviors?
   - How does context affect decisions?
   - What makes dialogue feel natural?

3. **Optimize Prompts**
   - Test variations
   - Measure player engagement
   - Refine based on feedback

## 🎯 Development Roadmap

### Phase 1: Core Systems (✅ Complete)
- [x] 3D voxel engine
- [x] AI pathfinding
- [x] Database persistence
- [x] Monitoring dashboard
- [x] Verification service

### Phase 2: Gameplay Enhancement (🚧 In Progress)
- [ ] Multiplayer synchronization
- [ ] Crafting system
- [ ] Combat mechanics
- [ ] Quest system
- [ ] Achievement tracking

### Phase 3: Content Generation (📋 Planned)
- [ ] Document-to-quest pipeline
- [ ] AI-generated dungeons
- [ ] Dynamic story events
- [ ] Procedural NPCs from text
- [ ] Voice synthesis integration

### Phase 4: Platform Integration (🔮 Future)
- [ ] Mobile PWA support
- [ ] Cloud save sync
- [ ] Social features
- [ ] Mod support
- [ ] Workshop integration

## 🐛 Troubleshooting

### Common Issues

1. **AI Agents Spinning**
   - Fixed with A* pathfinding
   - Check `enhanced-ai-behavior-system.js`

2. **Database Connection Failed**
   ```bash
   # Ensure PostgreSQL is running
   docker-compose up -d postgres
   
   # Check connection
   psql postgresql://postgres:postgres@localhost:5432/document_generator
   ```

3. **Game Not Saving**
   - Check persistence service logs
   - Verify database permissions
   - Ensure auto-save is enabled

4. **Performance Issues**
   - Reduce render distance
   - Lower chunk size
   - Enable performance mode

## 💡 Best Practices

1. **Version Control**
   - Tag releases: `git tag v1.0.0`
   - Document changes in CHANGELOG
   - Use semantic versioning

2. **Testing**
   - Test AI behaviors in isolation
   - Verify database operations
   - Monitor performance metrics

3. **Documentation**
   - Update when adding features
   - Include code examples
   - Document integration points

## 🔗 Related Documentation

- Main Project: `CLAUDE.md`
- AI Services: `CLAUDE.ai-services.md`
- Document Parser: `CLAUDE.document-parser.md`
- Auto-Documentation: `FinishThisIdea/docs/AUTO_DOCUMENTATION_GUIDE.md`

---

*3D Game System: Where documents become worlds*
*Version: 1.0.0 | Last Updated: 2025-01-30*