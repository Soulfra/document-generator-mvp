# 🎭 DOMINGO REAL ORCHESTRATOR

**Backend Management Hub with AI Character Delegation**

Domingo is your AI-powered backend orchestrator that manages systems, coordinates tasks, and delegates work to specialized AI characters through an intuitive chat interface with real-time drag-and-drop task management.

## ✨ Features

### 🎭 AI Character Roster
- **Alice** 👩‍💻 - Technical Lead (backend, databases, architecture)
- **Bob** 👨‍💻 - Frontend Developer (react, ui, responsive-design) 
- **Charlie** 🔧 - DevOps Engineer (docker, ci-cd, deployment)
- **Diana** 📊 - Data Scientist (analytics, ml, data-processing)
- **Eve** 🛡️ - Security Expert (security, encryption, authentication)
- **Frank** 🔌 - Integration Specialist (apis, webhooks, third-party)

### 💬 Chat Interface
- Direct communication with Domingo
- Natural language task creation and assignment
- System status monitoring
- Real-time responses with purple glowing eyes indicator

### 📋 Task Management
- **Drag & Drop Interface**: Move tasks between Pending → In Progress → Review → Complete
- **Character Assignment**: Drag tasks to characters or use chat commands
- **Smart Suggestions**: AI-powered character recommendations based on specializations
- **Real-time Updates**: WebSocket synchronization across all clients

### 🌐 phpBB Forum Integration
- Automatic discussion thread creation for tasks
- Task organization across forum boards
- Character activity logging
- Community coordination features

### 🔧 Backend Integration
- **PostgreSQL Database**: Persistent task and chat storage
- **WebSocket Server**: Real-time communication
- **RESTful API**: Standard HTTP endpoints for all operations
- **Hardhat Testing**: Integrated drag-and-drop code testing interface

## 🚀 Quick Start

### 1. Start the Orchestrator System
```bash
./start-domingo-orchestrator.sh
```

### 2. Access Interfaces
- **Main Orchestrator**: http://localhost:7777
- **Testing Interface**: http://localhost:7779  
- **WebSocket**: ws://localhost:7777/ws

### 3. Chat Commands
```
create task: Implement user authentication system
assign authentication task to Eve  
status
health
forum post: New security requirements discussion
```

## 🏗️ System Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Web Interface │────▶│  Orchestrator   │────▶│   PostgreSQL    │
│  (Port 7777)    │     │     Server      │     │    Database     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                ┌─────────────────────────────────┐
                │                                 │
         ┌─────────────┐                 ┌─────────────┐
         │   Forum     │                 │  Hardhat    │
         │  Bridge     │                 │  Testing    │
         │ (Port API)  │                 │ (Port 7779) │
         └─────────────┘                 └─────────────┘
```

## 📁 File Structure

```
domingo-orchestrator-server.js     # Main server with all integrations
domingo-real-orchestrator.html     # Frontend interface 
api-to-forum-bridge.js             # phpBB forum integration
drag-drop-hardhat-testing.js       # Code testing interface
start-domingo-orchestrator.sh      # Startup script
test-orchestrator-system.js        # Automated test suite
package-orchestrator.json          # Dependencies
```

## 💻 API Endpoints

### Tasks
- `GET /api/tasks` - List all tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:taskId` - Update task
- `DELETE /api/tasks/:taskId` - Delete task

### Characters  
- `GET /api/characters` - List all characters
- `PUT /api/characters/:characterId` - Update character status

### Chat & System
- `POST /api/chat` - Send chat message
- `GET /api/system-status` - System health check
- `GET /api/forum-boards` - List forum boards
- `POST /api/forum-post` - Create forum post

## 🎯 WebSocket Events

### Client → Server
```javascript
{
  "type": "chat_message",
  "message": "create task: Fix database connection pooling"
}

{
  "type": "task_drag", 
  "taskId": "task-123",
  "fromColumn": "pending",
  "toColumn": "in-progress"
}

{
  "type": "character_assign",
  "taskId": "task-123", 
  "characterId": "alice"
}
```

### Server → Client
```javascript
{
  "type": "chat_message",
  "data": {
    "sender": "domingo",
    "message": "Task assigned to Alice successfully!",
    "timestamp": 1704067200000
  }
}

{
  "type": "task_created",
  "data": { /* task object */ }
}

{
  "type": "task_assigned", 
  "data": {
    "task": { /* task object */ },
    "character": { /* character object */ }
  }
}
```

## 🗄️ Database Schema

### orchestrator_tasks
```sql
CREATE TABLE orchestrator_tasks (
    id SERIAL PRIMARY KEY,
    task_id VARCHAR(255) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL, 
    description TEXT,
    column_status VARCHAR(50) NOT NULL,
    assigned_character VARCHAR(100),
    priority VARCHAR(20) DEFAULT 'medium',
    tags JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### orchestrator_chat
```sql
CREATE TABLE orchestrator_chat (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL,
    sender VARCHAR(100) NOT NULL,
    message_type VARCHAR(50) DEFAULT 'chat',
    metadata JSONB DEFAULT '{}', 
    created_at TIMESTAMP DEFAULT NOW()
);
```

### character_activity
```sql
CREATE TABLE character_activity (
    id SERIAL PRIMARY KEY,
    character_id VARCHAR(100) NOT NULL,
    activity_type VARCHAR(100) NOT NULL,
    description TEXT,
    task_id VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 🧪 Testing

### Run Test Suite
```bash
node test-orchestrator-system.js
```

### Manual Testing
1. **Chat Interface**: Send messages and verify Domingo responds
2. **Task Creation**: Use chat command `create task: Test task`
3. **Drag & Drop**: Move tasks between columns
4. **Character Assignment**: Drag task to character or use chat
5. **WebSocket**: Monitor real-time updates in browser developer tools

## 🔧 Configuration

### Environment Variables
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/document_generator
ORCHESTRATOR_PORT=7777
WEBSOCKET_PORT=7778
```

### Character Customization
Edit the `characterRoster` array in `domingo-orchestrator-server.js`:

```javascript
{
  id: 'custom-char',
  name: 'Custom Character', 
  role: 'Custom Role',
  specializations: ['skill1', 'skill2', 'skill3'],
  emoji: '🎯',
  status: 'available',
  activeTask: null
}
```

## 🎮 Usage Examples

### Creating Tasks via Chat
```
User: create task: Implement OAuth2 authentication with Google
Domingo: ✅ Created new task: "Implement OAuth2 authentication with Google" (ID: task_1704067200123)

User: assign OAuth task to Eve
Domingo: ✅ Assigned "Implement OAuth2 authentication with Google" to 🛡️ Eve
```

### Task Status Monitoring
```
User: status
Domingo: 📊 Domingo's Status Report:
         
📋 Tasks: 12 total
  • Backlog: 3
  • In Progress: 5  
  • Review: 2
  • Done: 2

👥 Team: 4 busy, 2 available

🏥 All systems operational
💜 *purple eyes gleaming with satisfaction*
```

### Forum Integration
```
User: forum post: Weekly sprint planning discussion
Domingo: 📝 Posted to forum: "Weekly sprint planning discussion"
```

## 🛟 Troubleshooting

### Server Won't Start
```bash
# Check if ports are available
lsof -i :7777
lsof -i :7779

# Install missing dependencies  
npm install express ws pg
```

### Database Connection Issues
```bash
# Check PostgreSQL status
pg_isready

# Create database if needed
createdb document_generator
```

### WebSocket Connection Failed
- Ensure server is running on port 7777
- Check browser console for WebSocket errors
- Verify firewall/proxy settings

## 🚀 Deployment

### Local Development
```bash
./start-domingo-orchestrator.sh
```

### Production Setup
```bash
# Set environment variables
export DATABASE_URL="your-production-db-url"
export NODE_ENV="production"

# Start with PM2
npm install -g pm2
pm2 start domingo-orchestrator-server.js --name orchestrator
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package-orchestrator.json package.json
RUN npm install
COPY . .
EXPOSE 7777 7779
CMD ["node", "domingo-orchestrator-server.js"]
```

## 🔮 Advanced Features

### Custom AI Responses
Override `generateDomingoResponse()` in the server to customize Domingo's personality and responses.

### Plugin Architecture
The system supports extending functionality through:
- Custom character types
- Additional forum board integrations  
- Enhanced testing interfaces
- Third-party service connectors

### Multi-tenant Support
Configure multiple orchestrator instances for different teams or projects.

## 📊 Monitoring & Analytics

### System Health Dashboard
Access real-time metrics at `/api/system-status`:
- Active WebSocket connections
- Task completion rates
- Character utilization
- Database performance

### Logging
All activities are logged to:
- Console output (development)
- Database tables (chat, tasks, character activity)
- Optional file logging (production)

---

## 🎭 About Domingo

Domingo is your AI backend orchestrator with purple glowing eyes who coordinates your entire development ecosystem. He manages tasks, delegates work to specialized AI characters, integrates with forums for team discussions, and provides real-time feedback through an intuitive drag-and-drop interface.

**Built with love for developers who need real coordination, not just another task board.**

*Ready to orchestrate your backend systems? Start Domingo now!* 🚀