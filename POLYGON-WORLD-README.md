# 🌐🎮 Polygon World Query System

A unified orchestration system for creating, querying, and scaling polygon companion worlds. Perfect for developers who want to build multi-world gaming experiences with 3-4 polygon companion characters.

## 🚀 Quick Start

```bash
# Launch the system
./launch-polygon-world.sh

# Open the developer dashboard
open http://localhost:1337/dashboard
```

## 🎮 Features

- **Multi-World Support**: Create and manage multiple world instances
- **3-4 Polygon Companions**: Simple, efficient companion characters
- **Developer API**: REST, GraphQL, and WebSocket interfaces
- **Real-time Updates**: Live world state streaming
- **Lua Scripting**: Customize companion behaviors
- **1337 Developer Mode**: Advanced features on port 1337
- **World Templates**: Quick-start with predefined world types
- **Scaling Ready**: Built for horizontal scaling

## 📡 API Endpoints

### REST API

```bash
# List all worlds
GET http://localhost:1337/api/worlds

# Create a new world
POST http://localhost:1337/api/worlds
{
  "name": "My Game World",
  "template": "default"
}

# Get world details
GET http://localhost:1337/api/worlds/:worldId

# Create companion
POST http://localhost:1337/api/worlds/:worldId/companions
{
  "type": "scout",
  "name": "Explorer Bot",
  "position": { "x": 0, "y": 5, "z": 0 }
}
```

### 1337 Developer Endpoints

```bash
# Fork an existing world
POST http://localhost:1337/api/1337/fork-world
{
  "sourceWorldId": "world_123",
  "name": "My Fork"
}

# Inject Lua script
POST http://localhost:1337/api/1337/inject-script
{
  "worldId": "world_123",
  "companionId": "companion_456",
  "script": "move_companion()"
}

# Get advanced stats
GET http://localhost:1337/api/1337/world-stats

# Mass spawn entities
POST http://localhost:1337/api/1337/mass-spawn
{
  "worldId": "world_123",
  "entities": [
    { "type": "companion", "name": "Bot 1" },
    { "type": "companion", "name": "Bot 2" }
  ]
}
```

### GraphQL API

Access the GraphQL playground at: http://localhost:1337/graphql

```graphql
# Query worlds
query {
  worlds {
    id
    name
    companions {
      id
      name
      type
      position { x y z }
    }
  }
}

# Create world
mutation {
  createWorld(name: "New World", template: "arena") {
    id
    name
  }
}

# Subscribe to updates
subscription {
  worldUpdates(worldId: "world_123") {
    type
    data
  }
}
```

### WebSocket API

```javascript
const ws = new WebSocket('ws://localhost:1337');

// Subscribe to world
ws.send(JSON.stringify({
  type: 'subscribe_world',
  worldId: 'world_123'
}));

// Send companion command
ws.send(JSON.stringify({
  type: 'companion_command',
  worldId: 'world_123',
  companionId: 'companion_456',
  command: {
    type: 'move',
    target: { x: 10, y: 5, z: 10 }
  }
}));
```

## 🏗️ World Templates

- **default**: Standard world with mixed terrain
- **minimal**: Small world for testing
- **arena**: PvP battle arena
- **creative**: Sandbox with unlimited resources
- **developer**: Debug world with testing tools

## 🤖 Companion Types

Each companion is rendered with 3-4 polygons for efficiency:

- **Scout**: 3 polygons, exploration ability
- **Builder**: 4 polygons, construction ability
- **Mirror**: 3 polygons, replication ability

## 🔧 System Architecture

```
┌─────────────────────┐
│ Developer Dashboard │ Port 1337
└──────────┬──────────┘
           │
┌──────────┴──────────┐
│ Polygon World Query │ Main API
│        API          │
└──────────┬──────────┘
           │
     ┌─────┴─────┬─────────┬──────────┐
     │           │         │          │
┌────┴───┐ ┌────┴───┐ ┌───┴───┐ ┌────┴───┐
│ World  │ │ World  │ │ World │ │ World  │
│Instance│ │Instance│ │Instance│ │Instance│
└────────┘ └────────┘ └───────┘ └────────┘
```

## 📊 Monitoring

The developer dashboard provides real-time monitoring:
- Active worlds and players
- Companion statistics
- API usage metrics
- System health status

## 🚀 Scaling

The system supports horizontal scaling:

1. **Multi-Instance**: Each world runs as an independent instance
2. **Load Balancing**: Distribute worlds across servers
3. **Regional Deployment**: Deploy worlds close to players
4. **Auto-Scaling**: Spawn/despawn worlds based on demand

## 🛠️ Development

### Creating Custom Templates

```javascript
POST http://localhost:1337/api/1337/template
{
  "name": "my-template",
  "config": {
    "size": { "x": 500, "y": 100, "z": 500 },
    "companionTypes": ["scout", "builder"],
    "terrainType": "custom",
    "features": ["my_feature"]
  }
}
```

### Lua Scripting

Companions can be programmed with Lua scripts:

```lua
-- Example companion script
function on_player_nearby(player)
    move_toward(player.position)
    change_color("#00ff00")
end

function on_idle()
    patrol_area()
end
```

## 🔌 Integration

### JavaScript/TypeScript

```javascript
import { PolygonWorldClient } from '@polygon/world-client';

const client = new PolygonWorldClient({
  endpoint: 'http://localhost:1337',
  websocket: 'ws://localhost:1337'
});

// Create world
const world = await client.createWorld({
  name: 'My Game',
  template: 'default'
});

// Spawn companion
const companion = await world.createCompanion({
  type: 'scout',
  name: 'Helper'
});

// Subscribe to updates
world.on('companion_moved', (data) => {
  console.log('Companion moved:', data);
});
```

### Unity Integration

```csharp
using PolygonWorld;

var client = new PolygonWorldClient("http://localhost:1337");
var world = await client.CreateWorld("My Unity World");
var companions = await world.GetCompanions();
```

## 🐛 Troubleshooting

### Port already in use
```bash
./stop-polygon-world.sh
./launch-polygon-world.sh
```

### WebSocket connection failed
- Check firewall settings
- Ensure port 1337 is accessible
- Try using `127.0.0.1` instead of `localhost`

### World not responding
- Check system resources
- Monitor via dashboard
- Restart specific world instance

## 📚 Advanced Usage

### Custom World Builders

Implement your own world generation:

```javascript
class CustomWorldBuilder {
  generateTerrain(size) {
    // Custom terrain generation
  }
  
  placeCompanions(world) {
    // Custom companion placement
  }
}
```

### Event Streaming

Subscribe to all world events:

```javascript
const eventStream = client.streamEvents({
  worlds: ['*'],
  events: ['companion_*', 'player_*', 'world_*']
});

eventStream.on('data', (event) => {
  console.log('Event:', event);
});
```

## 🤝 Contributing

The polygon world system is designed to be extended:

1. Fork the repository
2. Create your feature branch
3. Add your world templates or companion types
4. Submit a pull request

## 📄 License

MIT License - Build whatever you want!

## 🎮 Happy World Building!

Remember: Keep it simple with 3-4 polygons, but make it powerful with smart orchestration!