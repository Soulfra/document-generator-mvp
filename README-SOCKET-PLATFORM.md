# 🚀 Document Generator - Socket Platform

**Simple. Fast. Live.**

Transform documents into working solutions through real-time WebSocket connections.

## ⚡ Quick Start

```bash
# One command - that's it
./start-socket-platform.sh
```

Then visit: **http://localhost:8080**

## 🎯 What This Is

A **socket-first platform** where users visit your website and experience the Document Generator through live WebSocket connections. No complex distributions, no age verification, no onboarding flows - just pure document transformation.

## 🌐 Architecture

```
Your Website → WebSocket Connection → Live Document Processing
     ↓                    ↓                      ↓
Landing Page         Real-time Socket      Transform Documents
Socket Connect       Collaboration         Progressive Features
```

## 📁 Core Files

- **`socket-landing.html`** - Clean entry point with socket connection
- **`socket-server.js`** - WebSocket server for live document processing
- **`start-socket-platform.sh`** - One-command launcher
- **`unified-demo-hub.html`** - Main platform interface (socket-connected)

## 🎨 Brand Colors

- **Primary**: `#4ecca3` (teal/aqua green)
- **Secondary**: `#3eb393` (darker teal)  
- **Dark Base**: `#1a1a1a` (very dark gray)
- **Medium**: `#2a2a2a` (medium dark gray)
- **Accent**: `#ffd700` (gold)
- **Error**: `#e94560` (red)

## 🔌 Socket Features

### Real-Time Document Processing
```javascript
// Users upload documents through socket
socket.send(JSON.stringify({
    type: 'document_upload',
    filename: 'business-plan.md',
    content: documentContent
}));

// Receive live processing updates
socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'document_processing') {
        updateProgress(data.progress);
    }
};
```

### Live Collaboration
```javascript
// Real-time collaboration updates
socket.send(JSON.stringify({
    type: 'collaboration_update',
    data: {
        cursor: { x: 100, y: 200 },
        selection: 'paragraph-3',
        user: 'user-123'
    }
}));
```

### Progressive Feature Unlocking
```javascript
// Features unlock as users engage
socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'feature_unlocked') {
        enableFeature(data.feature);
    }
};
```

## 🎮 User Flow

1. **Visit your website** - Clean landing page loads
2. **Click "Connect Live"** - Establishes WebSocket connection
3. **Enter platform** - Redirects to unified demo hub
4. **Start creating** - Upload documents, get live transformations
5. **Collaborate** - Work with others in real-time
6. **Unlock features** - Progressive enhancement through usage

## 🚀 Deployment

### Local Development
```bash
./start-socket-platform.sh
```

### Production
```bash
# Set environment variables
export HTTP_PORT=80
export WS_PORT=443
export HOST=yourdomain.com

# Start server
node socket-server.js
```

### Docker (Optional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8080 8081
CMD ["node", "socket-server.js"]
```

## 📡 Socket API

### Connection
- **WebSocket URL**: `ws://localhost:8081`
- **HTTP Interface**: `http://localhost:8080`

### Message Types

#### Client → Server
- `client_connect` - Initial connection
- `enter_platform` - Request platform access
- `document_upload` - Upload document for processing
- `document_process` - Start document transformation
- `join_room` - Join collaboration room
- `collaboration_update` - Real-time collaboration data

#### Server → Client  
- `welcome` - Connection established
- `document_processing` - Processing progress updates
- `document_processed` - Processing complete
- `collaboration_update` - Real-time collaboration data
- `platform_redirect` - Redirect to main platform

## 🔍 Endpoints

- **`/`** - Landing page
- **`/status`** - Server status (JSON)
- **`/api/documents`** - List active documents
- **`/api/rooms`** - List collaboration rooms

## 🎯 Goals & Vision

### Timeline-Driven Development
- **Phase 1**: Basic socket connection and document upload
- **Phase 2**: Real-time collaboration features  
- **Phase 3**: Progressive feature unlocking
- **Phase 4**: Advanced AI-powered transformations

### Socket-First Features
- Live document transformation
- Real-time collaboration
- Progressive enhancement
- Community-driven feature additions
- Timeline-based goals and achievements

## 🛠️ Requirements

- **Node.js 16+** - JavaScript runtime
- **ws package** - WebSocket library (auto-installed)

That's it. No Python, no Docker, no complex dependencies.

## 🎉 What You Get

- **Clean entry point** - No complex verification flows
- **Live connections** - Real-time document processing
- **Collaboration ready** - Multi-user support built-in
- **Progressive features** - Unlock capabilities through usage
- **Timeline focus** - Goals and milestones drive development

## 🌟 Next Steps

1. Run `./start-socket-platform.sh`
2. Visit http://localhost:8080
3. Click "Connect Live"
4. Start transforming documents!

---

**Document Generator Socket Platform** - Making document transformation simple, fast, and collaborative.

*Version: 1.0.0*  
*Focus: Socket-first, real-time, progressive*