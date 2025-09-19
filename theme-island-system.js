#!/usr/bin/env node

/**
 * 🏝️🎨 THEME ISLAND & SKIN CUSTOMIZATION SYSTEM
 * Build your own customizable islands with themes and skins
 * 
 * Features:
 * - Personal island builder with real-time collaboration
 * - Theme marketplace (buy/sell/trade)
 * - Skin editor with live preview
 * - Team islands for collaborative projects
 * - Export themes as Docker containers
 */

const EventEmitter = require('events');
const WebSocket = require('ws');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const { createCanvas, loadImage } = require('canvas');
const Dockerode = require('dockerode');

class ThemeIslandSystem extends EventEmitter {
    constructor() {
        super();
        
        // Island registry
        this.islands = new Map(); // islandId -> island data
        this.userIslands = new Map(); // userId -> islandIds[]
        this.teamIslands = new Map(); // teamId -> islandIds[]
        
        // Theme system
        this.themes = new Map(); // themeId -> theme data
        this.skins = new Map(); // skinId -> skin data
        this.customElements = new Map(); // elementId -> element data
        
        // Editor sessions
        this.editorSessions = new Map(); // sessionId -> editor state
        this.collaborators = new Map(); // islandId -> Set of userIds
        
        // Docker client for containerization
        this.docker = new Dockerode();
        
        // Island templates
        this.islandTemplates = {
            'starter': {
                name: 'Starter Island',
                size: { width: 1000, height: 1000 },
                terrain: 'grass',
                elements: ['spawn-point', 'welcome-sign'],
                theme: 'default'
            },
            'tropical': {
                name: 'Tropical Paradise',
                size: { width: 2000, height: 2000 },
                terrain: 'sand',
                elements: ['palm-trees', 'beach', 'tiki-hut'],
                theme: 'tropical'
            },
            'cyber': {
                name: 'Cyber City',
                size: { width: 3000, height: 3000 },
                terrain: 'neon-grid',
                elements: ['data-towers', 'holo-displays', 'cyber-portal'],
                theme: 'cyberpunk'
            },
            'team-hub': {
                name: 'Team Collaboration Hub',
                size: { width: 5000, height: 5000 },
                terrain: 'modular',
                elements: ['meeting-rooms', 'project-boards', 'resource-center'],
                theme: 'professional'
            }
        };
        
        // Theme components
        this.themeComponents = {
            colors: {
                primary: '#3498db',
                secondary: '#2ecc71',
                accent: '#e74c3c',
                background: '#ecf0f1',
                text: '#2c3e50'
            },
            textures: new Map(),
            sounds: new Map(),
            particles: new Map(),
            lighting: {
                ambient: 0.6,
                directional: 0.4,
                shadows: true
            }
        };
        
        // Skin editor tools
        this.editorTools = {
            brush: {
                size: 10,
                opacity: 1.0,
                blend: 'normal'
            },
            eraser: {
                size: 20,
                opacity: 1.0
            },
            colorPicker: {
                color: '#ffffff'
            },
            stamp: {
                pattern: null,
                scale: 1.0
            },
            transform: {
                scale: 1.0,
                rotation: 0,
                flip: { x: false, y: false }
            }
        };
        
        // Real-time connections
        this.connections = new Map(); // userId -> WebSocket
        this.hubConnection = null;
        
        console.log('🏝️ Theme Island System initializing...');
        this.initialize();
    }
    
    async initialize() {
        // Connect to multiplayer hub
        await this.connectToHub();
        
        // Load default themes and skins
        await this.loadDefaults();
        
        // Initialize texture generator
        this.initializeTextureGenerator();
        
        // Start auto-save system
        this.startAutoSave();
        
        console.log('✅ Theme Island System ready');
        console.log('🎨 Available templates:', Object.keys(this.islandTemplates).join(', '));
    }
    
    async connectToHub() {
        try {
            this.hubConnection = new WebSocket('ws://localhost:8888');
            
            this.hubConnection.on('open', () => {
                console.log('🔗 Connected to Multiplayer Hub');
                
                this.hubConnection.send(JSON.stringify({
                    type: 'authenticate',
                    serviceId: 'theme-island',
                    features: ['island-builder', 'theme-editor', 'skin-customization', 'docker-export']
                }));
            });
            
            this.hubConnection.on('message', (data) => {
                const message = JSON.parse(data);
                this.handleHubMessage(message);
            });
            
            this.hubConnection.on('error', (error) => {
                console.error('Hub connection error:', error);
            });
        } catch (error) {
            console.error('Failed to connect to hub:', error);
            setTimeout(() => this.connectToHub(), 5000);
        }
    }
    
    // Island Management
    async createIsland(userId, options = {}) {
        const islandId = crypto.randomUUID();
        const template = this.islandTemplates[options.template || 'starter'];
        
        const island = {
            id: islandId,
            ownerId: userId,
            name: options.name || `${userId}'s Island`,
            created: Date.now(),
            updated: Date.now(),
            
            // Island properties
            size: options.size || template.size,
            terrain: options.terrain || template.terrain,
            theme: options.theme || template.theme,
            
            // Elements and objects
            elements: new Map(),
            objects: [],
            
            // Customization
            customTheme: null,
            customSkins: new Map(),
            
            // Collaboration
            collaborators: new Set([userId]),
            permissions: {
                [userId]: 'owner'
            },
            
            // Stats
            visits: 0,
            rating: 0,
            featured: false
        };
        
        // Add default elements from template
        template.elements.forEach((elementType, index) => {
            const elementId = crypto.randomUUID();
            island.elements.set(elementId, {
                id: elementId,
                type: elementType,
                position: this.getDefaultPosition(index, island.size),
                rotation: 0,
                scale: 1,
                skin: 'default',
                properties: {}
            });
        });
        
        // Store island
        this.islands.set(islandId, island);
        
        // Update user's island list
        if (!this.userIslands.has(userId)) {
            this.userIslands.set(userId, []);
        }
        this.userIslands.get(userId).push(islandId);
        
        // Emit creation event
        this.emit('island-created', island);
        
        // Broadcast to hub
        this.broadcastUpdate({
            type: 'island-created',
            island: this.serializeIsland(island)
        });
        
        return island;
    }
    
    async editIsland(userId, islandId, changes) {
        const island = this.islands.get(islandId);
        if (!island) {
            throw new Error('Island not found');
        }
        
        // Check permissions
        if (!this.hasPermission(userId, island, 'edit')) {
            throw new Error('Permission denied');
        }
        
        // Apply changes
        const previousState = this.serializeIsland(island);
        
        if (changes.name) island.name = changes.name;
        if (changes.terrain) island.terrain = changes.terrain;
        if (changes.theme) island.theme = changes.theme;
        if (changes.size) island.size = changes.size;
        
        island.updated = Date.now();
        
        // Broadcast changes to collaborators
        this.broadcastToIsland(islandId, {
            type: 'island-updated',
            islandId,
            changes,
            userId,
            timestamp: island.updated
        });
        
        // Store undo state
        if (!island.history) island.history = [];
        island.history.push({
            timestamp: Date.now(),
            userId,
            previousState,
            changes
        });
        
        return island;
    }
    
    async addElement(userId, islandId, element) {
        const island = this.islands.get(islandId);
        if (!island) {
            throw new Error('Island not found');
        }
        
        if (!this.hasPermission(userId, island, 'edit')) {
            throw new Error('Permission denied');
        }
        
        const elementId = element.id || crypto.randomUUID();
        const newElement = {
            id: elementId,
            type: element.type,
            position: element.position || { x: 0, y: 0, z: 0 },
            rotation: element.rotation || 0,
            scale: element.scale || 1,
            skin: element.skin || 'default',
            properties: element.properties || {},
            addedBy: userId,
            addedAt: Date.now()
        };
        
        island.elements.set(elementId, newElement);
        island.updated = Date.now();
        
        // Broadcast to collaborators
        this.broadcastToIsland(islandId, {
            type: 'element-added',
            islandId,
            element: newElement,
            userId
        });
        
        return newElement;
    }
    
    // Theme Creation and Editing
    async createTheme(userId, themeData) {
        const themeId = crypto.randomUUID();
        
        const theme = {
            id: themeId,
            creatorId: userId,
            name: themeData.name,
            description: themeData.description,
            created: Date.now(),
            updated: Date.now(),
            
            // Visual properties
            colors: themeData.colors || { ...this.themeComponents.colors },
            textures: new Map(),
            lighting: themeData.lighting || { ...this.themeComponents.lighting },
            
            // Audio
            sounds: new Map(),
            music: themeData.music || null,
            
            // Effects
            particles: new Map(),
            shaders: themeData.shaders || [],
            
            // Metadata
            tags: themeData.tags || [],
            category: themeData.category || 'custom',
            
            // Marketplace
            price: themeData.price || 0,
            currency: themeData.currency || 'FART',
            downloads: 0,
            rating: 0,
            
            // Permissions
            public: themeData.public || false,
            license: themeData.license || 'personal'
        };
        
        this.themes.set(themeId, theme);
        
        // Generate preview
        await this.generateThemePreview(themeId);
        
        this.emit('theme-created', theme);
        
        return theme;
    }
    
    async editTheme(userId, themeId, changes) {
        const theme = this.themes.get(themeId);
        if (!theme) {
            throw new Error('Theme not found');
        }
        
        if (theme.creatorId !== userId) {
            throw new Error('Only theme creator can edit');
        }
        
        // Apply changes
        if (changes.name) theme.name = changes.name;
        if (changes.description) theme.description = changes.description;
        if (changes.colors) Object.assign(theme.colors, changes.colors);
        if (changes.lighting) Object.assign(theme.lighting, changes.lighting);
        if (changes.tags) theme.tags = changes.tags;
        if (changes.price !== undefined) theme.price = changes.price;
        
        theme.updated = Date.now();
        
        // Regenerate preview
        await this.generateThemePreview(themeId);
        
        // Notify theme users
        this.broadcastUpdate({
            type: 'theme-updated',
            themeId,
            changes
        });
        
        return theme;
    }
    
    // Skin Editor
    async createSkinEditSession(userId, targetType, targetId) {
        const sessionId = crypto.randomUUID();
        
        const session = {
            id: sessionId,
            userId,
            targetType, // 'element', 'character', 'vehicle', etc.
            targetId,
            created: Date.now(),
            
            // Canvas state
            canvas: null,
            context: null,
            layers: [],
            activeLayer: 0,
            
            // History for undo/redo
            history: [],
            historyIndex: 0,
            
            // Tools state
            activeTool: 'brush',
            toolSettings: { ...this.editorTools },
            
            // Collaboration
            collaborators: new Set([userId]),
            cursors: new Map() // userId -> cursor position
        };
        
        // Create canvas
        session.canvas = createCanvas(1024, 1024);
        session.context = session.canvas.getContext('2d');
        
        // Initialize with base texture
        await this.loadBaseTexture(session, targetType, targetId);
        
        // Add first layer
        session.layers.push({
            id: crypto.randomUUID(),
            name: 'Layer 1',
            visible: true,
            opacity: 1.0,
            blendMode: 'normal',
            canvas: createCanvas(1024, 1024)
        });
        
        this.editorSessions.set(sessionId, session);
        
        return {
            sessionId,
            canvas: session.canvas.toDataURL()
        };
    }
    
    async applyEditorAction(sessionId, action) {
        const session = this.editorSessions.get(sessionId);
        if (!session) {
            throw new Error('Session not found');
        }
        
        const layer = session.layers[session.activeLayer];
        const ctx = layer.canvas.getContext('2d');
        
        switch (action.tool) {
            case 'brush':
                this.applyBrush(ctx, action, session.toolSettings.brush);
                break;
                
            case 'eraser':
                this.applyEraser(ctx, action, session.toolSettings.eraser);
                break;
                
            case 'fill':
                this.applyFill(ctx, action);
                break;
                
            case 'stamp':
                await this.applyStamp(ctx, action, session.toolSettings.stamp);
                break;
        }
        
        // Update history
        session.history = session.history.slice(0, session.historyIndex + 1);
        session.history.push({
            timestamp: Date.now(),
            action,
            layerId: layer.id
        });
        session.historyIndex++;
        
        // Composite layers
        await this.compositeLayers(session);
        
        // Broadcast to collaborators
        this.broadcastToSession(sessionId, {
            type: 'editor-action',
            action,
            userId: action.userId,
            canvas: session.canvas.toDataURL()
        });
        
        return session.canvas.toDataURL();
    }
    
    applyBrush(ctx, action, settings) {
        ctx.globalAlpha = settings.opacity;
        ctx.globalCompositeOperation = settings.blend;
        ctx.strokeStyle = action.color;
        ctx.lineWidth = settings.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(action.from.x, action.from.y);
        ctx.lineTo(action.to.x, action.to.y);
        ctx.stroke();
    }
    
    applyEraser(ctx, action, settings) {
        ctx.globalAlpha = settings.opacity;
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = settings.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(action.from.x, action.from.y);
        ctx.lineTo(action.to.x, action.to.y);
        ctx.stroke();
    }
    
    // Docker Export
    async exportIslandAsDocker(islandId) {
        const island = this.islands.get(islandId);
        if (!island) {
            throw new Error('Island not found');
        }
        
        // Create Dockerfile content
        const dockerfile = `
FROM node:18-alpine

# Install dependencies
RUN apk add --no-cache \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev

WORKDIR /app

# Copy island data
COPY island.json .
COPY themes/ ./themes/
COPY skins/ ./skins/
COPY assets/ ./assets/

# Install island runtime
RUN npm install express ws canvas three

# Copy server code
COPY server.js .

# Expose port
EXPOSE 3000

# Start island server
CMD ["node", "server.js"]
`;
        
        // Create build context
        const buildContext = await this.createBuildContext(island);
        
        // Build Docker image
        const imageName = `theme-island/${island.id}:latest`;
        
        await new Promise((resolve, reject) => {
            this.docker.buildImage(buildContext, {
                t: imageName,
                dockerfile: 'Dockerfile'
            }, (err, stream) => {
                if (err) return reject(err);
                
                stream.on('data', (data) => {
                    const lines = data.toString().split('\n').filter(l => l);
                    lines.forEach(line => {
                        try {
                            const parsed = JSON.parse(line);
                            if (parsed.stream) {
                                console.log(parsed.stream.trim());
                            }
                        } catch (e) {
                            // Ignore parse errors
                        }
                    });
                });
                
                stream.on('end', resolve);
                stream.on('error', reject);
            });
        });
        
        console.log(`🐳 Docker image created: ${imageName}`);
        
        // Create docker-compose.yml
        const dockerCompose = `
version: '3.8'

services:
  ${island.id}:
    image: ${imageName}
    container_name: island-${island.id}
    ports:
      - "3000:3000"
    environment:
      - ISLAND_ID=${island.id}
      - ISLAND_NAME=${island.name}
    volumes:
      - island-data:/app/data
    restart: unless-stopped

volumes:
  island-data:
`;
        
        return {
            imageName,
            dockerfile,
            dockerCompose
        };
    }
    
    async createBuildContext(island) {
        const tar = require('tar-stream');
        const pack = tar.pack();
        
        // Add Dockerfile
        pack.entry({ name: 'Dockerfile' }, this.generateDockerfile(island));
        
        // Add island data
        pack.entry({ name: 'island.json' }, JSON.stringify(island, null, 2));
        
        // Add server code
        pack.entry({ name: 'server.js' }, this.generateServerCode(island));
        
        // Add theme files
        if (island.customTheme) {
            const theme = this.themes.get(island.customTheme);
            if (theme) {
                pack.entry({ 
                    name: 'themes/custom.json' 
                }, JSON.stringify(theme, null, 2));
            }
        }
        
        // Add skin files
        for (const [skinId, skinData] of island.customSkins) {
            pack.entry({
                name: `skins/${skinId}.png`
            }, skinData);
        }
        
        pack.finalize();
        
        return pack;
    }
    
    generateServerCode(island) {
        return `
const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Load island data
const island = JSON.parse(fs.readFileSync('./island.json', 'utf8'));

// Serve static files
app.use(express.static('public'));

// Island API
app.get('/api/island', (req, res) => {
    res.json(island);
});

app.get('/api/theme', (req, res) => {
    const theme = fs.existsSync('./themes/custom.json') ?
        JSON.parse(fs.readFileSync('./themes/custom.json', 'utf8')) :
        null;
    res.json(theme);
});

// WebSocket for real-time updates
wss.on('connection', (ws) => {
    ws.on('message', (data) => {
        const message = JSON.parse(data);
        
        // Broadcast to all connected clients
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(message));
            }
        });
    });
    
    // Send initial island state
    ws.send(JSON.stringify({
        type: 'island-state',
        island
    }));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(\`Island server running on port \${PORT}\`);
    console.log(\`Island: \${island.name} (ID: \${island.id})\`);
});
`;
    }
    
    // Utility functions
    hasPermission(userId, island, action) {
        const permission = island.permissions[userId];
        
        if (!permission) return false;
        if (permission === 'owner') return true;
        
        const permissionLevels = {
            'view': ['view', 'edit', 'admin', 'owner'],
            'edit': ['edit', 'admin', 'owner'],
            'admin': ['admin', 'owner']
        };
        
        return permissionLevels[action]?.includes(permission) || false;
    }
    
    getDefaultPosition(index, size) {
        // Distribute elements in a grid pattern
        const cols = Math.ceil(Math.sqrt(index + 1));
        const row = Math.floor(index / cols);
        const col = index % cols;
        
        return {
            x: (col + 0.5) * (size.width / cols),
            y: 0,
            z: (row + 0.5) * (size.height / cols)
        };
    }
    
    serializeIsland(island) {
        return {
            id: island.id,
            ownerId: island.ownerId,
            name: island.name,
            size: island.size,
            terrain: island.terrain,
            theme: island.theme,
            elements: Array.from(island.elements.values()),
            objects: island.objects,
            collaborators: Array.from(island.collaborators),
            permissions: island.permissions,
            stats: {
                visits: island.visits,
                rating: island.rating,
                featured: island.featured
            }
        };
    }
    
    async generateThemePreview(themeId) {
        const theme = this.themes.get(themeId);
        if (!theme) return;
        
        const canvas = createCanvas(512, 512);
        const ctx = canvas.getContext('2d');
        
        // Draw preview with theme colors
        const gradient = ctx.createLinearGradient(0, 0, 512, 512);
        gradient.addColorStop(0, theme.colors.primary);
        gradient.addColorStop(0.5, theme.colors.secondary);
        gradient.addColorStop(1, theme.colors.accent);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 512);
        
        // Add some visual elements
        ctx.fillStyle = theme.colors.background;
        ctx.globalAlpha = 0.8;
        
        for (let i = 0; i < 5; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const size = 50 + Math.random() * 100;
            
            ctx.beginPath();
            ctx.arc(x, y, size / 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Add text
        ctx.globalAlpha = 1;
        ctx.fillStyle = theme.colors.text;
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(theme.name, 256, 256);
        
        theme.preview = canvas.toDataURL();
    }
    
    async compositeLayers(session) {
        const ctx = session.context;
        
        // Clear main canvas
        ctx.clearRect(0, 0, 1024, 1024);
        
        // Draw each visible layer
        for (const layer of session.layers) {
            if (!layer.visible) continue;
            
            ctx.globalAlpha = layer.opacity;
            ctx.globalCompositeOperation = layer.blendMode;
            ctx.drawImage(layer.canvas, 0, 0);
        }
        
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
    }
    
    async loadBaseTexture(session, targetType, targetId) {
        // Load appropriate base texture based on target
        const basePath = path.join(__dirname, 'assets', 'textures', targetType);
        
        try {
            const imagePath = path.join(basePath, `${targetId}.png`);
            const image = await loadImage(imagePath);
            session.context.drawImage(image, 0, 0, 1024, 1024);
        } catch (error) {
            // Use default texture if specific one not found
            session.context.fillStyle = '#ffffff';
            session.context.fillRect(0, 0, 1024, 1024);
        }
    }
    
    initializeTextureGenerator() {
        // Procedural texture generation for terrain
        this.textureGenerators = {
            grass: (canvas, ctx) => {
                const imageData = ctx.createImageData(canvas.width, canvas.height);
                const data = imageData.data;
                
                for (let i = 0; i < data.length; i += 4) {
                    const noise = Math.random();
                    data[i] = 50 + noise * 50; // R
                    data[i + 1] = 100 + noise * 50; // G
                    data[i + 2] = 50 + noise * 30; // B
                    data[i + 3] = 255; // A
                }
                
                ctx.putImageData(imageData, 0, 0);
            },
            
            sand: (canvas, ctx) => {
                const imageData = ctx.createImageData(canvas.width, canvas.height);
                const data = imageData.data;
                
                for (let i = 0; i < data.length; i += 4) {
                    const noise = Math.random();
                    data[i] = 194 + noise * 30; // R
                    data[i + 1] = 178 + noise * 30; // G
                    data[i + 2] = 128 + noise * 20; // B
                    data[i + 3] = 255; // A
                }
                
                ctx.putImageData(imageData, 0, 0);
            },
            
            'neon-grid': (canvas, ctx) => {
                ctx.fillStyle = '#000000';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                ctx.strokeStyle = '#00ffff';
                ctx.lineWidth = 2;
                
                const gridSize = 50;
                for (let x = 0; x < canvas.width; x += gridSize) {
                    ctx.beginPath();
                    ctx.moveTo(x, 0);
                    ctx.lineTo(x, canvas.height);
                    ctx.stroke();
                }
                
                for (let y = 0; y < canvas.height; y += gridSize) {
                    ctx.beginPath();
                    ctx.moveTo(0, y);
                    ctx.lineTo(canvas.width, y);
                    ctx.stroke();
                }
            }
        };
    }
    
    startAutoSave() {
        setInterval(() => {
            // Auto-save editor sessions
            this.editorSessions.forEach(async (session, sessionId) => {
                if (Date.now() - session.lastSave > 30000) { // 30 seconds
                    await this.saveEditorSession(sessionId);
                    session.lastSave = Date.now();
                }
            });
            
            // Clean up old sessions
            this.editorSessions.forEach((session, sessionId) => {
                if (Date.now() - session.created > 3600000) { // 1 hour
                    this.editorSessions.delete(sessionId);
                }
            });
        }, 10000); // Every 10 seconds
    }
    
    async saveEditorSession(sessionId) {
        const session = this.editorSessions.get(sessionId);
        if (!session) return;
        
        // Save to temporary file
        const savePath = path.join(__dirname, 'temp', `session-${sessionId}.json`);
        
        const saveData = {
            id: sessionId,
            userId: session.userId,
            targetType: session.targetType,
            targetId: session.targetId,
            layers: session.layers.map(layer => ({
                id: layer.id,
                name: layer.name,
                visible: layer.visible,
                opacity: layer.opacity,
                blendMode: layer.blendMode,
                data: layer.canvas.toDataURL()
            })),
            history: session.history.slice(-50), // Keep last 50 actions
            toolSettings: session.toolSettings
        };
        
        await fs.writeFile(savePath, JSON.stringify(saveData));
    }
    
    handleHubMessage(message) {
        switch (message.type) {
            case 'cross-service-request':
                this.handleCrossServiceRequest(message);
                break;
                
            case 'user-joined':
                // Welcome new user with starter island
                this.createIsland(message.userId, { template: 'starter' });
                break;
        }
    }
    
    async handleCrossServiceRequest(message) {
        const { request, requestId, from } = message;
        
        try {
            let response;
            
            switch (request.action) {
                case 'create-island':
                    response = await this.createIsland(request.userId, request.options);
                    break;
                    
                case 'get-island':
                    response = this.islands.get(request.islandId);
                    break;
                    
                case 'list-islands':
                    response = this.userIslands.get(request.userId) || [];
                    break;
                    
                case 'create-theme':
                    response = await this.createTheme(request.userId, request.themeData);
                    break;
                    
                case 'export-docker':
                    response = await this.exportIslandAsDocker(request.islandId);
                    break;
            }
            
            this.hubConnection.send(JSON.stringify({
                type: 'cross-service-response',
                requestId,
                success: true,
                data: response
            }));
        } catch (error) {
            this.hubConnection.send(JSON.stringify({
                type: 'cross-service-response',
                requestId,
                success: false,
                error: error.message
            }));
        }
    }
    
    broadcastUpdate(update) {
        if (this.hubConnection && this.hubConnection.readyState === WebSocket.OPEN) {
            this.hubConnection.send(JSON.stringify({
                type: 'service-broadcast',
                service: 'theme-island',
                data: update
            }));
        }
    }
    
    broadcastToIsland(islandId, message) {
        const island = this.islands.get(islandId);
        if (!island) return;
        
        island.collaborators.forEach(userId => {
            const ws = this.connections.get(userId);
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(message));
            }
        });
    }
    
    broadcastToSession(sessionId, message) {
        const session = this.editorSessions.get(sessionId);
        if (!session) return;
        
        session.collaborators.forEach(userId => {
            const ws = this.connections.get(userId);
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(message));
            }
        });
    }
    
    async loadDefaults() {
        // Create default themes
        const defaultThemes = [
            {
                id: 'default',
                name: 'Default Theme',
                colors: {
                    primary: '#3498db',
                    secondary: '#2ecc71',
                    accent: '#e74c3c',
                    background: '#ecf0f1',
                    text: '#2c3e50'
                }
            },
            {
                id: 'tropical',
                name: 'Tropical Theme',
                colors: {
                    primary: '#f39c12',
                    secondary: '#27ae60',
                    accent: '#e67e22',
                    background: '#f1c40f',
                    text: '#2c3e50'
                }
            },
            {
                id: 'cyberpunk',
                name: 'Cyberpunk Theme',
                colors: {
                    primary: '#ff00ff',
                    secondary: '#00ffff',
                    accent: '#ffff00',
                    background: '#000000',
                    text: '#ffffff'
                }
            }
        ];
        
        defaultThemes.forEach(theme => {
            this.themes.set(theme.id, {
                ...theme,
                creatorId: 'system',
                created: Date.now(),
                updated: Date.now(),
                public: true,
                price: 0
            });
        });
    }
}

// Export the class
module.exports = ThemeIslandSystem;

// Start the system if run directly
if (require.main === module) {
    const themeSystem = new ThemeIslandSystem();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🏝️ Shutting down Theme Island System...');
        process.exit(0);
    });
}