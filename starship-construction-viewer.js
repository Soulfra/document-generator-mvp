#!/usr/bin/env node

/**
 * 🚀🎨 STARSHIP CONSTRUCTION VIEWER
 * =================================
 * Watch the AI starship build things in real-time
 * See their menu interactions, constructions, and collaborate
 * Drag/drop tools, draw lines, place sprites when they need help
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const http = require('http');
const WebSocket = require('ws');

class StarshipConstructionViewer {
    constructor() {
        this.port = 9100;
        this.wsPort = 9101;
        
        // Construction workspace
        this.workspace = {
            canvas: {
                width: 2000,
                height: 1200,
                zoom: 1.0,
                panX: 0,
                panY: 0
            },
            elements: new Map(),
            connections: new Map(),
            aiCursor: { x: 0, y: 0, active: true },
            humanCursor: { x: 0, y: 0, active: false }
        };
        
        // AI construction behavior
        this.aiConstructor = {
            currentTask: null,
            menuStack: [],
            buildingProgress: 0,
            autonomousMode: true,
            needsHelp: false,
            helpRequests: [],
            thinking: true,
            activeMenus: [],
            currentTool: 'pointer'
        };
        
        // Available construction elements
        this.constructionKit = {
            'satellites': {
                'communication-sat': {
                    sprite: '📡',
                    size: { w: 40, h: 40 },
                    color: '#4ecdc4',
                    properties: ['communication', 'orbital', 'relay']
                },
                'spy-sat': {
                    sprite: '🛰️',
                    size: { w: 35, h: 35 },
                    color: '#ff6b35',
                    properties: ['surveillance', 'stealth', 'intelligence']
                },
                'weather-sat': {
                    sprite: '🌩️',
                    size: { w: 45, h: 45 },
                    color: '#45b7d1',
                    properties: ['monitoring', 'climate', 'data-collection']
                },
                'navigation-sat': {
                    sprite: '🧭',
                    size: { w: 30, h: 30 },
                    color: '#f7931e',
                    properties: ['positioning', 'navigation', 'timing']
                }
            },
            'stars': {
                'main-sequence': {
                    sprite: '⭐',
                    size: { w: 60, h: 60 },
                    color: '#ffff00',
                    properties: ['fusion', 'energy', 'gravity-well']
                },
                'red-giant': {
                    sprite: '🔴',
                    size: { w: 80, h: 80 },
                    color: '#ff4444',
                    properties: ['expansion', 'instability', 'heat-death']
                },
                'white-dwarf': {
                    sprite: '⚪',
                    size: { w: 25, h: 25 },
                    color: '#ffffff',
                    properties: ['dense', 'cooling', 'remnant']
                },
                'neutron-star': {
                    sprite: '💫',
                    size: { w: 15, h: 15 },
                    color: '#8a2be2',
                    properties: ['ultra-dense', 'magnetic', 'pulsar']
                }
            },
            'structures': {
                'space-station': {
                    sprite: '🏗️',
                    size: { w: 70, h: 70 },
                    color: '#silver',
                    properties: ['habitat', 'construction', 'docking']
                },
                'dyson-sphere': {
                    sprite: '⚫',
                    size: { w: 100, h: 100 },
                    color: '#444444',
                    properties: ['megastructure', 'energy-harvest', 'civilization']
                },
                'wormhole': {
                    sprite: '🌀',
                    size: { w: 50, h: 50 },
                    color: '#9966cc',
                    properties: ['transport', 'spacetime', 'exotic-matter']
                },
                'quantum-gate': {
                    sprite: '🔷',
                    size: { w: 40, h: 40 },
                    color: '#00ffff',
                    properties: ['teleportation', 'quantum', 'instantaneous']
                }
            },
            'connections': {
                'communication-beam': {
                    type: 'line',
                    color: '#4ecdc4',
                    style: 'dashed',
                    width: 2,
                    properties: ['data-flow', 'bidirectional']
                },
                'tractor-beam': {
                    type: 'line',
                    color: '#ff6b35',
                    style: 'solid',
                    width: 4,
                    properties: ['force', 'manipulation']
                },
                'energy-conduit': {
                    type: 'line',
                    color: '#ffff00',
                    style: 'solid',
                    width: 3,
                    properties: ['power-transfer', 'high-voltage']
                },
                'gravitational-field': {
                    type: 'curve',
                    color: '#9966cc',
                    style: 'dotted',
                    width: 2,
                    properties: ['spacetime-distortion', 'attraction']
                }
            }
        };
        
        // AI menu system - what the AI is navigating
        this.aiMenuSystem = {
            'main-menu': {
                title: 'Starship Construction Interface',
                items: ['New Project', 'Load Project', 'Element Library', 'Tools', 'Settings'],
                position: { x: 100, y: 100 },
                open: false
            },
            'element-library': {
                title: 'Construction Elements',
                items: ['Satellites', 'Stars', 'Structures', 'Connections'],
                position: { x: 300, y: 150 },
                open: false,
                parent: 'main-menu'
            },
            'satellites-menu': {
                title: 'Satellite Types',
                items: Object.keys(this.constructionKit.satellites),
                position: { x: 500, y: 200 },
                open: false,
                parent: 'element-library'
            },
            'tools-menu': {
                title: 'Construction Tools',
                items: ['Select', 'Move', 'Connect', 'Delete', 'Properties'],
                position: { x: 200, y: 300 },
                open: false,
                parent: 'main-menu'
            }
        };
        
        // Construction tasks the AI works on
        this.aiTasks = [
            {
                name: 'Build Communication Network',
                description: 'Create a satellite constellation for communication',
                steps: [
                    'Open Element Library',
                    'Select Communication Satellites',
                    'Place satellites in orbital pattern',
                    'Connect with communication beams',
                    'Test signal coverage'
                ],
                helpNeeded: ['line-drawing', 'positioning']
            },
            {
                name: 'Design Solar System',
                description: 'Build a star system with planets and structures',
                steps: [
                    'Place main sequence star',
                    'Add orbital bodies',
                    'Create gravitational connections',
                    'Build space stations',
                    'Add navigation satellites'
                ],
                helpNeeded: ['curve-drawing', 'spatial-arrangement']
            },
            {
                name: 'Construct Megastructure',
                description: 'Build a Dyson sphere around a star',
                steps: [
                    'Select target star',
                    'Design sphere segments',
                    'Create energy conduits',
                    'Add control stations',
                    'Verify energy flow'
                ],
                helpNeeded: ['complex-shapes', 'energy-routing']
            }
        ];
        
        // Current construction state
        this.currentConstruction = {
            task: null,
            step: 0,
            elements: [],
            connections: [],
            progress: 0,
            needsHumanHelp: false,
            helpType: null
        };
        
        // WebSocket connections
        this.viewers = new Set();
        
        // AI behavior timers
        this.aiThinkingTimer = null;
        this.aiActionTimer = null;
        
        this.init();
    }
    
    async init() {
        console.log('🚀🎨 STARSHIP CONSTRUCTION VIEWER INITIALIZING...');
        console.log('===============================================');
        
        await this.setupWorkspace();
        await this.startAIConstructor();
        await this.launchViewer();
        
        console.log('✅ Starship Construction Viewer ready');
        console.log(`🎨 Construction Viewer: http://localhost:${this.port}`);
        console.log(`🔌 Collaboration WebSocket: ws://localhost:${this.wsPort}`);
        console.log('');
        console.log('👁️ WATCH: AI navigating menus and building');
        console.log('🤝 HELP: Drag/drop when AI requests assistance');
    }
    
    async setupWorkspace() {
        console.log('🏗️ Setting up construction workspace...');
        
        const dirs = [
            '.starship-construction',
            '.starship-construction/projects',
            '.starship-construction/captures',
            '.starship-construction/logs'
        ];
        
        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }
        
        console.log('   ✅ Workspace ready');
    }
    
    async startAIConstructor() {
        console.log('🤖 Starting AI constructor...');
        
        // Start AI thinking cycle
        this.startAIThinking();
        
        // Start AI actions
        this.startAIActions();
        
        // Start a random construction task
        this.startRandomTask();
        
        console.log('   ✅ AI constructor active and thinking');
    }
    
    startAIThinking() {
        // AI thinks every 2 seconds
        this.aiThinkingTimer = setInterval(() => {
            this.aiThinkCycle();
        }, 2000);
    }
    
    aiThinkCycle() {
        const thoughts = [
            'Analyzing optimal satellite placement...',
            'Calculating orbital mechanics...',
            'Evaluating energy efficiency...',
            'Planning connection pathways...',
            'Optimizing spatial distribution...',
            'Considering gravitational effects...',
            'Reviewing structural integrity...',
            'Assessing communication coverage...'
        ];
        
        const thought = thoughts[Math.floor(Math.random() * thoughts.length)];
        
        this.broadcastToViewers({
            type: 'ai-thinking',
            data: {
                thought: thought,
                timestamp: new Date().toISOString(),
                menuStack: this.aiConstructor.menuStack,
                currentTask: this.aiConstructor.currentTask
            }
        });
    }
    
    startAIActions() {
        // AI performs actions every 5 seconds
        this.aiActionTimer = setInterval(() => {
            this.performAIAction();
        }, 5000);
    }
    
    performAIAction() {
        if (!this.currentConstruction.task) return;
        
        const actions = [
            'navigateMenu',
            'placeElement', 
            'moveElement',
            'createConnection',
            'requestHelp'
        ];
        
        const action = actions[Math.floor(Math.random() * actions.length)];
        
        switch (action) {
            case 'navigateMenu':
                this.aiNavigateMenu();
                break;
            case 'placeElement':
                this.aiPlaceElement();
                break;
            case 'moveElement':
                this.aiMoveElement();
                break;
            case 'createConnection':
                this.aiCreateConnection();
                break;
            case 'requestHelp':
                this.aiRequestHelp();
                break;
        }
    }
    
    aiNavigateMenu() {
        const menuIds = Object.keys(this.aiMenuSystem);
        const randomMenu = menuIds[Math.floor(Math.random() * menuIds.length)];
        const menu = this.aiMenuSystem[randomMenu];
        
        // Simulate AI cursor movement to menu
        this.workspace.aiCursor.x = menu.position.x;
        this.workspace.aiCursor.y = menu.position.y;
        
        // Open/close menu
        menu.open = !menu.open;
        
        // Update menu stack
        if (menu.open) {
            this.aiConstructor.menuStack.push(randomMenu);
        } else {
            this.aiConstructor.menuStack = this.aiConstructor.menuStack.filter(m => m !== randomMenu);
        }
        
        this.broadcastToViewers({
            type: 'ai-menu-action',
            data: {
                action: 'navigate',
                menu: randomMenu,
                menuState: menu,
                aiCursor: this.workspace.aiCursor,
                menuStack: this.aiConstructor.menuStack
            }
        });
    }
    
    aiPlaceElement() {
        const elementTypes = Object.keys(this.constructionKit);
        const elementType = elementTypes[Math.floor(Math.random() * elementTypes.length)];
        const elements = Object.keys(this.constructionKit[elementType]);
        const elementKey = elements[Math.floor(Math.random() * elements.length)];
        const element = this.constructionKit[elementType][elementKey];
        
        const newElement = {
            id: crypto.randomUUID(),
            type: elementType,
            subtype: elementKey,
            element: element,
            position: {
                x: Math.random() * (this.workspace.canvas.width - 100) + 50,
                y: Math.random() * (this.workspace.canvas.height - 100) + 50
            },
            rotation: 0,
            scale: 1.0,
            created: new Date().toISOString(),
            creator: 'ai'
        };
        
        this.workspace.elements.set(newElement.id, newElement);
        this.currentConstruction.elements.push(newElement.id);
        
        // Move AI cursor to element
        this.workspace.aiCursor.x = newElement.position.x;
        this.workspace.aiCursor.y = newElement.position.y;
        
        this.broadcastToViewers({
            type: 'ai-construction-action',
            data: {
                action: 'place-element',
                element: newElement,
                aiCursor: this.workspace.aiCursor,
                totalElements: this.workspace.elements.size
            }
        });
    }
    
    aiMoveElement() {
        const elementIds = Array.from(this.workspace.elements.keys());
        if (elementIds.length === 0) return;
        
        const elementId = elementIds[Math.floor(Math.random() * elementIds.length)];
        const element = this.workspace.elements.get(elementId);
        
        // Move element to new position
        const newPosition = {
            x: Math.random() * (this.workspace.canvas.width - 100) + 50,
            y: Math.random() * (this.workspace.canvas.height - 100) + 50
        };
        
        element.position = newPosition;
        
        // Move AI cursor to track the element
        this.workspace.aiCursor.x = newPosition.x;
        this.workspace.aiCursor.y = newPosition.y;
        
        this.broadcastToViewers({
            type: 'ai-construction-action',
            data: {
                action: 'move-element',
                elementId: elementId,
                newPosition: newPosition,
                aiCursor: this.workspace.aiCursor
            }
        });
    }
    
    aiCreateConnection() {
        const elementIds = Array.from(this.workspace.elements.keys());
        if (elementIds.length < 2) return;
        
        // Pick two random elements to connect
        const fromId = elementIds[Math.floor(Math.random() * elementIds.length)];
        let toId = elementIds[Math.floor(Math.random() * elementIds.length)];
        while (toId === fromId && elementIds.length > 1) {
            toId = elementIds[Math.floor(Math.random() * elementIds.length)];
        }
        
        const connectionTypes = Object.keys(this.constructionKit.connections);
        const connectionType = connectionTypes[Math.floor(Math.random() * connectionTypes.length)];
        const connectionConfig = this.constructionKit.connections[connectionType];
        
        const connection = {
            id: crypto.randomUUID(),
            type: connectionType,
            config: connectionConfig,
            from: fromId,
            to: toId,
            created: new Date().toISOString(),
            creator: 'ai'
        };
        
        this.workspace.connections.set(connection.id, connection);
        this.currentConstruction.connections.push(connection.id);
        
        this.broadcastToViewers({
            type: 'ai-construction-action',
            data: {
                action: 'create-connection',
                connection: connection,
                fromElement: this.workspace.elements.get(fromId),
                toElement: this.workspace.elements.get(toId)
            }
        });
    }
    
    aiRequestHelp() {
        const helpTypes = [
            'line-drawing',
            'curve-drawing', 
            'complex-positioning',
            'spatial-arrangement',
            'energy-routing',
            'pattern-creation'
        ];
        
        const helpType = helpTypes[Math.floor(Math.random() * helpTypes.length)];
        
        const helpRequest = {
            id: crypto.randomUUID(),
            type: helpType,
            description: this.getHelpDescription(helpType),
            priority: Math.random() > 0.5 ? 'high' : 'medium',
            timestamp: new Date().toISOString(),
            resolved: false
        };
        
        this.aiConstructor.helpRequests.push(helpRequest);
        this.aiConstructor.needsHelp = true;
        this.currentConstruction.needsHumanHelp = true;
        this.currentConstruction.helpType = helpType;
        
        this.broadcastToViewers({
            type: 'ai-help-request',
            data: {
                helpRequest: helpRequest,
                aiCursor: this.workspace.aiCursor,
                currentTask: this.currentConstruction.task
            }
        });
    }
    
    getHelpDescription(helpType) {
        const descriptions = {
            'line-drawing': 'I need help drawing precise connection lines between these satellites',
            'curve-drawing': 'Can you help me create curved gravitational field lines?',
            'complex-positioning': 'I need assistance positioning these elements in optimal formation',
            'spatial-arrangement': 'Help me arrange these structures in 3D space',
            'energy-routing': 'I need help routing energy conduits efficiently',
            'pattern-creation': 'Can you help create a geometric pattern for this constellation?'
        };
        
        return descriptions[helpType] || 'I need some assistance with this construction';
    }
    
    startRandomTask() {
        const task = this.aiTasks[Math.floor(Math.random() * this.aiTasks.length)];
        
        this.currentConstruction.task = task;
        this.currentConstruction.step = 0;
        this.currentConstruction.progress = 0;
        this.aiConstructor.currentTask = task.name;
        
        this.broadcastToViewers({
            type: 'ai-task-started',
            data: {
                task: task,
                timestamp: new Date().toISOString()
            }
        });
        
        console.log(`🤖 AI started task: ${task.name}`);
    }
    
    async launchViewer() {
        await this.startWebServer();
        await this.startWebSocketServer();
    }
    
    async startWebServer() {
        const server = http.createServer(async (req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            
            const url = new URL(req.url, `http://localhost:${this.port}`);
            
            switch (url.pathname) {
                case '/':
                    res.writeHead(200, { 'Content-Type': 'text/html' });
                    res.end(await this.generateViewerInterface());
                    break;
                    
                case '/api/workspace':
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        workspace: this.workspace,
                        aiConstructor: this.aiConstructor,
                        currentConstruction: this.currentConstruction
                    }));
                    break;
                    
                case '/api/construction-kit':
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(this.constructionKit));
                    break;
                    
                default:
                    res.writeHead(404);
                    res.end('Not Found');
            }
        });
        
        server.listen(this.port, () => {
            console.log(`🌐 Construction viewer on port ${this.port}`);
        });
    }
    
    async startWebSocketServer() {
        const wss = new WebSocket.Server({ port: this.wsPort });
        
        wss.on('connection', (ws) => {
            console.log('👁️ Construction viewer connected');
            this.viewers.add(ws);
            
            // Send initial state
            ws.send(JSON.stringify({
                type: 'initialization',
                data: {
                    workspace: this.workspace,
                    constructionKit: this.constructionKit,
                    aiMenuSystem: this.aiMenuSystem,
                    currentConstruction: this.currentConstruction
                }
            }));
            
            ws.on('close', () => {
                this.viewers.delete(ws);
                console.log('👁️ Construction viewer disconnected');
            });
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleHumanCollaboration(data, ws);
                } catch (error) {
                    console.error('WebSocket message error:', error);
                }
            });
        });
        
        console.log(`🔌 Collaboration WebSocket on port ${this.wsPort}`);
    }
    
    handleHumanCollaboration(data, ws) {
        switch (data.type) {
            case 'human-cursor-move':
                this.workspace.humanCursor = {
                    x: data.x,
                    y: data.y,
                    active: true
                };
                this.broadcastToViewers({
                    type: 'human-cursor-update',
                    data: this.workspace.humanCursor
                });
                break;
                
            case 'drag-drop-element':
                this.handleDragDrop(data);
                break;
                
            case 'draw-line':
                this.handleLineDraw(data);
                break;
                
            case 'place-sprite':
                this.handleSpritePlace(data);
                break;
                
            case 'help-ai':
                this.resolveAIHelpRequest(data);
                break;
        }
    }
    
    handleDragDrop(data) {
        if (data.elementType && data.position) {
            // Human is helping by placing an element
            const elementConfig = this.findElementConfig(data.elementType, data.subtype);
            
            if (elementConfig) {
                const newElement = {
                    id: crypto.randomUUID(),
                    type: data.elementType,
                    subtype: data.subtype,
                    element: elementConfig,
                    position: data.position,
                    rotation: 0,
                    scale: 1.0,
                    created: new Date().toISOString(),
                    creator: 'human'
                };
                
                this.workspace.elements.set(newElement.id, newElement);
                
                this.broadcastToViewers({
                    type: 'human-collaboration',
                    data: {
                        action: 'element-placed',
                        element: newElement,
                        helper: 'human'
                    }
                });
                
                // AI acknowledges help
                this.aiAcknowledgeHelp('element-placement');
            }
        }
    }
    
    handleLineDraw(data) {
        if (data.fromId && data.toId && data.connectionType) {
            const connectionConfig = this.constructionKit.connections[data.connectionType];
            
            if (connectionConfig) {
                const connection = {
                    id: crypto.randomUUID(),
                    type: data.connectionType,
                    config: connectionConfig,
                    from: data.fromId,
                    to: data.toId,
                    created: new Date().toISOString(),
                    creator: 'human'
                };
                
                this.workspace.connections.set(connection.id, connection);
                
                this.broadcastToViewers({
                    type: 'human-collaboration',
                    data: {
                        action: 'connection-drawn',
                        connection: connection,
                        helper: 'human'
                    }
                });
                
                // AI acknowledges help
                this.aiAcknowledgeHelp('line-drawing');
            }
        }
    }
    
    handleSpritePlace(data) {
        // Handle sprite placement from human
        this.handleDragDrop({
            elementType: data.elementType,
            subtype: data.subtype,
            position: data.position
        });
    }
    
    resolveAIHelpRequest(data) {
        const helpRequest = this.aiConstructor.helpRequests.find(req => req.id === data.helpRequestId);
        
        if (helpRequest) {
            helpRequest.resolved = true;
            helpRequest.resolvedBy = 'human';
            helpRequest.resolvedAt = new Date().toISOString();
            
            // AI expresses gratitude
            this.aiAcknowledgeHelp(helpRequest.type);
            
            // Update AI state
            this.aiConstructor.needsHelp = this.aiConstructor.helpRequests.some(req => !req.resolved);
        }
    }
    
    aiAcknowledgeHelp(helpType) {
        const acknowledgments = {
            'element-placement': 'Thank you! That element placement is perfect.',
            'line-drawing': 'Excellent! Those connection lines are exactly what I needed.',
            'curve-drawing': 'Beautiful curves! The gravitational fields look great.',
            'complex-positioning': 'Perfect positioning! Much better than I could manage.',
            'spatial-arrangement': 'That spatial arrangement is optimal. Thank you!',
            'energy-routing': 'Great energy routing! The flow is much more efficient now.',
            'pattern-creation': 'That pattern is beautiful and functional. Well done!'
        };
        
        const message = acknowledgments[helpType] || 'Thank you for your help!';
        
        this.broadcastToViewers({
            type: 'ai-acknowledgment',
            data: {
                message: message,
                helpType: helpType,
                timestamp: new Date().toISOString(),
                aiCursor: this.workspace.aiCursor
            }
        });
    }
    
    findElementConfig(elementType, subtype) {
        if (this.constructionKit[elementType] && this.constructionKit[elementType][subtype]) {
            return this.constructionKit[elementType][subtype];
        }
        return null;
    }
    
    broadcastToViewers(message) {
        const messageStr = JSON.stringify(message);
        this.viewers.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(messageStr);
            }
        });
    }
    
    async generateViewerInterface() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🚀🎨 Starship Construction Viewer</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: #0a0a0a;
            color: #ffffff;
            font-family: 'Courier New', monospace;
            overflow: hidden;
        }
        
        .header {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: rgba(0, 0, 0, 0.9);
            padding: 10px;
            z-index: 1000;
            border-bottom: 2px solid #4ecdc4;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .header h1 {
            margin: 0;
            font-size: 18px;
            color: #4ecdc4;
        }
        
        .ai-status {
            display: flex;
            gap: 15px;
            font-size: 12px;
        }
        
        .ai-thinking {
            background: rgba(78, 205, 196, 0.2);
            padding: 5px 10px;
            border-radius: 5px;
            border: 1px solid #4ecdc4;
        }
        
        .ai-task {
            background: rgba(255, 107, 53, 0.2);
            padding: 5px 10px;
            border-radius: 5px;
            border: 1px solid #ff6b35;
        }
        
        .workspace {
            position: absolute;
            top: 60px;
            left: 0;
            right: 300px;
            bottom: 0;
            background: #111;
            overflow: hidden;
        }
        
        #constructionCanvas {
            width: 100%;
            height: 100%;
            cursor: crosshair;
        }
        
        .sidebar {
            position: fixed;
            top: 60px;
            right: 0;
            width: 300px;
            bottom: 0;
            background: rgba(0, 0, 0, 0.9);
            border-left: 1px solid #333;
            padding: 20px;
            overflow-y: auto;
        }
        
        .tool-section {
            margin-bottom: 25px;
            border: 1px solid #333;
            border-radius: 8px;
            padding: 15px;
        }
        
        .tool-section h3 {
            margin: 0 0 15px 0;
            color: #4ecdc4;
            font-size: 14px;
            text-transform: uppercase;
        }
        
        .element-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
        }
        
        .element-button {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid #555;
            color: white;
            padding: 10px 5px;
            border-radius: 5px;
            cursor: pointer;
            text-align: center;
            font-size: 20px;
            transition: all 0.3s;
            draggable: true;
        }
        
        .element-button:hover {
            background: rgba(78, 205, 196, 0.3);
            border-color: #4ecdc4;
        }
        
        .element-button.dragging {
            opacity: 0.5;
        }
        
        .connection-tools {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .connection-button {
            background: rgba(255, 107, 53, 0.2);
            border: 1px solid #ff6b35;
            color: white;
            padding: 8px 12px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.3s;
        }
        
        .connection-button:hover {
            background: rgba(255, 107, 53, 0.4);
        }
        
        .connection-button.active {
            background: #ff6b35;
            color: black;
        }
        
        .ai-help-requests {
            background: rgba(255, 0, 0, 0.1);
            border: 1px solid #ff4444;
        }
        
        .help-request {
            background: rgba(255, 0, 0, 0.2);
            padding: 10px;
            border-radius: 5px;
            margin: 8px 0;
            font-size: 12px;
        }
        
        .help-button {
            background: #ff4444;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 3px;
            cursor: pointer;
            margin-top: 5px;
        }
        
        .ai-cursor {
            position: absolute;
            width: 20px;
            height: 20px;
            background: #4ecdc4;
            border-radius: 50%;
            pointer-events: none;
            z-index: 999;
            box-shadow: 0 0 15px #4ecdc4;
            transition: all 0.3s;
        }
        
        .ai-cursor::after {
            content: '🤖';
            position: absolute;
            top: -25px;
            left: -5px;
            font-size: 16px;
        }
        
        .human-cursor {
            position: absolute;
            width: 15px;
            height: 15px;
            background: #ff6b35;
            border-radius: 50%;
            pointer-events: none;
            z-index: 998;
            box-shadow: 0 0 10px #ff6b35;
        }
        
        .human-cursor::after {
            content: '👤';
            position: absolute;
            top: -25px;
            left: -5px;
            font-size: 14px;
        }
        
        .ai-menu {
            position: absolute;
            background: rgba(0, 0, 0, 0.9);
            border: 2px solid #4ecdc4;
            border-radius: 8px;
            padding: 15px;
            min-width: 200px;
            z-index: 500;
        }
        
        .ai-menu h4 {
            margin: 0 0 10px 0;
            color: #4ecdc4;
            font-size: 14px;
        }
        
        .ai-menu-item {
            padding: 8px 12px;
            background: rgba(255, 255, 255, 0.1);
            margin: 5px 0;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
            transition: background 0.3s;
        }
        
        .ai-menu-item:hover {
            background: rgba(78, 205, 196, 0.3);
        }
        
        .construction-element {
            position: absolute;
            font-size: 30px;
            cursor: move;
            user-select: none;
            transition: all 0.3s;
        }
        
        .construction-element:hover {
            transform: scale(1.1);
            filter: drop-shadow(0 0 10px currentColor);
        }
        
        .construction-element.human-created {
            filter: drop-shadow(0 0 5px #ff6b35);
        }
        
        .construction-element.ai-created {
            filter: drop-shadow(0 0 5px #4ecdc4);
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀🎨 Starship Construction Viewer</h1>
        <div class="ai-status">
            <div class="ai-thinking" id="aiThinking">AI: Initializing...</div>
            <div class="ai-task" id="aiTask">Task: Starting up</div>
        </div>
    </div>
    
    <div class="workspace">
        <canvas id="constructionCanvas"></canvas>
        <div id="aiCursor" class="ai-cursor"></div>
        <div id="humanCursor" class="human-cursor" style="display: none;"></div>
        <div id="aiMenus"></div>
        <div id="constructionElements"></div>
    </div>
    
    <div class="sidebar">
        <div class="tool-section">
            <h3>🛰️ Satellites</h3>
            <div class="element-grid" id="satelliteElements">
                <div class="element-button" draggable="true" data-type="satellites" data-subtype="communication-sat">📡</div>
                <div class="element-button" draggable="true" data-type="satellites" data-subtype="spy-sat">🛰️</div>
                <div class="element-button" draggable="true" data-type="satellites" data-subtype="weather-sat">🌩️</div>
                <div class="element-button" draggable="true" data-type="satellites" data-subtype="navigation-sat">🧭</div>
            </div>
        </div>
        
        <div class="tool-section">
            <h3>⭐ Stars</h3>
            <div class="element-grid" id="starElements">
                <div class="element-button" draggable="true" data-type="stars" data-subtype="main-sequence">⭐</div>
                <div class="element-button" draggable="true" data-type="stars" data-subtype="red-giant">🔴</div>
                <div class="element-button" draggable="true" data-type="stars" data-subtype="white-dwarf">⚪</div>
                <div class="element-button" draggable="true" data-type="stars" data-subtype="neutron-star">💫</div>
            </div>
        </div>
        
        <div class="tool-section">
            <h3>🏗️ Structures</h3>
            <div class="element-grid" id="structureElements">
                <div class="element-button" draggable="true" data-type="structures" data-subtype="space-station">🏗️</div>
                <div class="element-button" draggable="true" data-type="structures" data-subtype="dyson-sphere">⚫</div>
                <div class="element-button" draggable="true" data-type="structures" data-subtype="wormhole">🌀</div>
                <div class="element-button" draggable="true" data-type="structures" data-subtype="quantum-gate">🔷</div>
            </div>
        </div>
        
        <div class="tool-section">
            <h3>🔗 Connections</h3>
            <div class="connection-tools" id="connectionTools">
                <div class="connection-button" data-type="communication-beam">📡 Communication Beam</div>
                <div class="connection-button" data-type="tractor-beam">🫸 Tractor Beam</div>
                <div class="connection-button" data-type="energy-conduit">⚡ Energy Conduit</div>
                <div class="connection-button" data-type="gravitational-field">🌀 Gravitational Field</div>
            </div>
        </div>
        
        <div class="tool-section ai-help-requests" id="aiHelpSection" style="display: none;">
            <h3>🤖 AI Needs Help</h3>
            <div id="helpRequests"></div>
        </div>
    </div>
    
    <script>
        // WebSocket connection
        const ws = new WebSocket('ws://localhost:${this.wsPort}');
        
        // Canvas setup
        const canvas = document.getElementById('constructionCanvas');
        const ctx = canvas.getContext('2d');
        
        // State
        let workspace = {};
        let constructionKit = {};
        let aiMenuSystem = {};
        let currentConstruction = {};
        let selectedConnectionType = null;
        let connectingFrom = null;
        let isDragging = false;
        let dragElement = null;
        
        function resizeCanvas() {
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
        }
        
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        
        // WebSocket handlers
        ws.onopen = () => {
            console.log('🔌 Connected to construction viewer');
        };
        
        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            
            switch (message.type) {
                case 'initialization':
                    workspace = message.data.workspace;
                    constructionKit = message.data.constructionKit;
                    aiMenuSystem = message.data.aiMenuSystem;
                    currentConstruction = message.data.currentConstruction;
                    startVisualization();
                    break;
                    
                case 'ai-thinking':
                    updateAIThinking(message.data);
                    break;
                    
                case 'ai-menu-action':
                    updateAIMenus(message.data);
                    break;
                    
                case 'ai-construction-action':
                    updateConstruction(message.data);
                    break;
                    
                case 'ai-help-request':
                    showHelpRequest(message.data);
                    break;
                    
                case 'ai-task-started':
                    updateCurrentTask(message.data);
                    break;
                    
                case 'ai-acknowledgment':
                    showAIAcknowledgment(message.data);
                    break;
                    
                case 'human-cursor-update':
                    updateHumanCursor(message.data);
                    break;
                    
                case 'human-collaboration':
                    showCollaboration(message.data);
                    break;
            }
        };
        
        function startVisualization() {
            animate();
            setupDragAndDrop();
            setupCanvasInteraction();
        }
        
        function animate() {
            drawConstructionSpace();
            requestAnimationFrame(animate);
        }
        
        function drawConstructionSpace() {
            // Clear canvas
            ctx.fillStyle = 'rgba(10, 10, 10, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Draw grid
            drawGrid();
            
            // Draw connections
            drawConnections();
            
            // Draw elements
            drawElements();
            
            // Draw AI cursor trail
            drawAICursorTrail();
        }
        
        function drawGrid() {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            
            for (let x = 0; x < canvas.width; x += 50) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
            }
            
            for (let y = 0; y < canvas.height; y += 50) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }
        }
        
        function drawConnections() {
            if (!workspace.connections) return;
            
            workspace.connections.forEach(connection => {
                const fromElement = workspace.elements.get(connection.from);
                const toElement = workspace.elements.get(connection.to);
                
                if (fromElement && toElement) {
                    ctx.strokeStyle = connection.config.color;
                    ctx.lineWidth = connection.config.width;
                    
                    if (connection.config.style === 'dashed') {
                        ctx.setLineDash([5, 5]);
                    } else if (connection.config.style === 'dotted') {
                        ctx.setLineDash([2, 3]);
                    } else {
                        ctx.setLineDash([]);
                    }
                    
                    ctx.beginPath();
                    ctx.moveTo(fromElement.position.x, fromElement.position.y);
                    ctx.lineTo(toElement.position.x, toElement.position.y);
                    ctx.stroke();
                    
                    // Draw connection label
                    const midX = (fromElement.position.x + toElement.position.x) / 2;
                    const midY = (fromElement.position.y + toElement.position.y) / 2;
                    
                    ctx.fillStyle = connection.config.color;
                    ctx.font = '10px Courier New';
                    ctx.textAlign = 'center';
                    ctx.fillText(connection.type, midX, midY);
                }
            });
            
            ctx.setLineDash([]);
        }
        
        function drawElements() {
            if (!workspace.elements) return;
            
            workspace.elements.forEach(element => {
                ctx.save();
                ctx.translate(element.position.x, element.position.y);
                ctx.scale(element.scale, element.scale);
                ctx.rotate(element.rotation);
                
                // Draw element sprite
                ctx.font = \`\${element.element.size.w}px Arial\`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // Add glow effect based on creator
                if (element.creator === 'ai') {
                    ctx.shadowColor = '#4ecdc4';
                    ctx.shadowBlur = 10;
                } else {
                    ctx.shadowColor = '#ff6b35';
                    ctx.shadowBlur = 10;
                }
                
                ctx.fillText(element.element.sprite, 0, 0);
                
                ctx.restore();
            });
        }
        
        function drawAICursorTrail() {
            if (!workspace.aiCursor) return;
            
            // Update AI cursor position on screen
            const aiCursor = document.getElementById('aiCursor');
            aiCursor.style.left = workspace.aiCursor.x + 'px';
            aiCursor.style.top = workspace.aiCursor.y + 'px';
            aiCursor.style.display = workspace.aiCursor.active ? 'block' : 'none';
        }
        
        function setupDragAndDrop() {
            const elementButtons = document.querySelectorAll('.element-button');
            
            elementButtons.forEach(button => {
                button.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', '');
                    dragElement = {
                        type: button.dataset.type,
                        subtype: button.dataset.subtype,
                        sprite: button.textContent
                    };
                    button.classList.add('dragging');
                });
                
                button.addEventListener('dragend', (e) => {
                    button.classList.remove('dragging');
                    dragElement = null;
                });
            });
        }
        
        function setupCanvasInteraction() {
            canvas.addEventListener('mousemove', (e) => {
                const rect = canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                // Update human cursor
                workspace.humanCursor = { x, y, active: true };
                
                const humanCursor = document.getElementById('humanCursor');
                humanCursor.style.left = x + 'px';
                humanCursor.style.top = y + 'px';
                humanCursor.style.display = 'block';
                
                // Send to server
                ws.send(JSON.stringify({
                    type: 'human-cursor-move',
                    x: x,
                    y: y
                }));
            });
            
            canvas.addEventListener('dragover', (e) => {
                e.preventDefault();
            });
            
            canvas.addEventListener('drop', (e) => {
                e.preventDefault();
                
                if (dragElement) {
                    const rect = canvas.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    // Send drag-drop to server
                    ws.send(JSON.stringify({
                        type: 'drag-drop-element',
                        elementType: dragElement.type,
                        subtype: dragElement.subtype,
                        position: { x, y }
                    }));
                }
            });
            
            canvas.addEventListener('click', (e) => {
                const rect = canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                // Check if clicking on an element for connection
                const clickedElement = findElementAt(x, y);
                
                if (selectedConnectionType && clickedElement) {
                    if (!connectingFrom) {
                        connectingFrom = clickedElement.id;
                        console.log('Starting connection from:', clickedElement.id);
                    } else {
                        // Complete connection
                        ws.send(JSON.stringify({
                            type: 'draw-line',
                            fromId: connectingFrom,
                            toId: clickedElement.id,
                            connectionType: selectedConnectionType
                        }));
                        
                        connectingFrom = null;
                        selectedConnectionType = null;
                        document.querySelectorAll('.connection-button').forEach(btn => {
                            btn.classList.remove('active');
                        });
                    }
                }
            });
        }
        
        function findElementAt(x, y) {
            if (!workspace.elements) return null;
            
            for (const element of workspace.elements.values()) {
                const dx = x - element.position.x;
                const dy = y - element.position.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < element.element.size.w / 2) {
                    return element;
                }
            }
            
            return null;
        }
        
        // Connection tool handlers
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('connection-button')) {
                // Deselect all
                document.querySelectorAll('.connection-button').forEach(btn => {
                    btn.classList.remove('active');
                });
                
                // Select this one
                e.target.classList.add('active');
                selectedConnectionType = e.target.dataset.type;
                connectingFrom = null;
                
                console.log('Selected connection type:', selectedConnectionType);
            }
        });
        
        // Help request handlers
        function showHelpRequest(data) {
            const helpSection = document.getElementById('aiHelpSection');
            const helpRequests = document.getElementById('helpRequests');
            
            helpSection.style.display = 'block';
            
            const helpDiv = document.createElement('div');
            helpDiv.className = 'help-request';
            helpDiv.innerHTML = \`
                <div><strong>\${data.helpRequest.type}</strong></div>
                <div>\${data.helpRequest.description}</div>
                <button class="help-button" onclick="resolveHelp('\${data.helpRequest.id}')">
                    Help AI
                </button>
            \`;
            
            helpRequests.appendChild(helpDiv);
        }
        
        function resolveHelp(helpRequestId) {
            ws.send(JSON.stringify({
                type: 'help-ai',
                helpRequestId: helpRequestId
            }));
            
            // Remove help request from UI
            event.target.parentElement.remove();
            
            // Hide section if no more requests
            const helpRequests = document.getElementById('helpRequests');
            if (helpRequests.children.length === 0) {
                document.getElementById('aiHelpSection').style.display = 'none';
            }
        }
        
        function updateAIThinking(data) {
            document.getElementById('aiThinking').textContent = \`AI: \${data.thought}\`;
        }
        
        function updateCurrentTask(data) {
            document.getElementById('aiTask').textContent = \`Task: \${data.task.name}\`;
        }
        
        function updateAIMenus(data) {
            // Update AI menu visualization
            console.log('AI menu action:', data.action, data.menu);
        }
        
        function updateConstruction(data) {
            console.log('AI construction:', data.action);
            // The canvas will update automatically through the workspace state
        }
        
        function showAIAcknowledgment(data) {
            console.log('AI says:', data.message);
            
            // Show acknowledgment in UI
            const notification = document.createElement('div');
            notification.style.cssText = \`
                position: fixed;
                top: 70px;
                right: 20px;
                background: rgba(78, 205, 196, 0.9);
                color: black;
                padding: 10px 15px;
                border-radius: 5px;
                z-index: 1001;
                max-width: 300px;
            \`;
            notification.textContent = data.message;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 3000);
        }
        
        function showCollaboration(data) {
            console.log('Human collaboration:', data.action);
        }
        
        function updateHumanCursor(data) {
            // Human cursor updates are handled locally for performance
        }
        
        // Prevent context menu on canvas
        canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
        
        console.log('🚀 Starship Construction Viewer Ready');
        console.log('👁️ Watch AI build - drag elements to help');
        console.log('🔗 Select connection tool then click elements to connect');
    </script>
</body>
</html>`;
    }
}

module.exports = StarshipConstructionViewer;

// CLI interface
if (require.main === module) {
    console.log(`
🚀🎨 STARSHIP CONSTRUCTION VIEWER
=================================

Watch the AI starship build things in real-time!

👁️ WHAT YOU'LL SEE:
- AI navigating menus and selecting tools
- AI placing satellites, stars, and structures
- AI drawing connections between elements
- AI requesting help when needed

🤝 HOW TO HELP:
- Drag satellites/stars/structures from sidebar to canvas
- Select connection tool and click elements to connect them
- Respond to AI help requests when they appear
- Your contributions will be acknowledged by the AI

🎮 COLLABORATION FEATURES:
- Real-time cursor tracking (yours and AI's)
- Drag-and-drop construction elements
- Line drawing tools for connections
- Help request system when AI needs assistance

The AI thinks autonomously and builds things, but you can
collaborate by providing tools and assistance when requested.
    `);
    
    const viewer = new StarshipConstructionViewer();
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down construction viewer...');
        clearInterval(viewer.aiThinkingTimer);
        clearInterval(viewer.aiActionTimer);
        process.exit(0);
    });
}