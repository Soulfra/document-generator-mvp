#!/usr/bin/env node

/**
 * 🎨🤖 CLAUDE COLLABORATIVE CANVAS SERVER
 * 
 * WebSocket server for real-time AI collaboration
 * - Multi-AI integration (Claude, GPT, Ollama)
 * - Real-time drawing synchronization
 * - Canvas collaboration endpoints
 * - AI drawing commands and responses
 */

import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import MultiAIProvider from './claude-cli/multi-ai-provider.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ClaudeCanvasServer {
    constructor(port = 9000) {
        this.port = port;
        this.server = null;
        this.wss = null;
        this.clients = new Set();
        this.canvasState = {
            drawings: [],
            lastUpdate: Date.now()
        };
        
        // Initialize AI provider
        this.multiAI = new MultiAIProvider();
        
        this.setupServer();
    }
    
    setupServer() {
        // Create HTTP server
        this.server = createServer((req, res) => {
            this.handleHttpRequest(req, res);
        });
        
        // Create WebSocket server
        this.wss = new WebSocketServer({ server: this.server });
        
        this.wss.on('connection', (ws, req) => {
            console.log('🔗 New client connected');
            this.clients.add(ws);
            
            // Send current canvas state to new client
            ws.send(JSON.stringify({
                type: 'canvas-state',
                state: this.canvasState
            }));
            
            ws.on('message', (data) => {
                this.handleWebSocketMessage(ws, JSON.parse(data.toString()));
            });
            
            ws.on('close', () => {
                console.log('🔌 Client disconnected');
                this.clients.delete(ws);
            });
            
            ws.on('error', (error) => {
                console.error('❌ WebSocket error:', error);
                this.clients.delete(ws);
            });
        });
    }
    
    handleHttpRequest(req, res) {
        const url = new URL(req.url, `http://localhost:${this.port}`);
        
        // Set CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }
        
        switch (url.pathname) {
            case '/':
            case '/canvas':
                this.serveCanvas(res);
                break;
                
            case '/api/ai-status':
                this.handleAIStatus(req, res);
                break;
                
            case '/api/collaborate':
                this.handleCollaboration(req, res);
                break;
                
            case '/api/ai-draw':
                this.handleAIDrawing(req, res);
                break;
                
            default:
                res.writeHead(404);
                res.end('Not Found');
        }
    }
    
    serveCanvas(res) {
        try {
            const canvasPath = join(__dirname, 'claude-collaborative-canvas.html');
            const canvasHtml = readFileSync(canvasPath, 'utf8');
            
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(canvasHtml);
        } catch (error) {
            console.error('❌ Failed to serve canvas:', error);
            res.writeHead(500);
            res.end('Internal Server Error');
        }
    }
    
    async handleAIStatus(req, res) {
        try {
            const status = this.multiAI.getProviderStatus();
            const aiStatus = {};
            
            for (const [key, provider] of Object.entries(status)) {
                aiStatus[key] = provider.available;
            }
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(aiStatus));
        } catch (error) {
            console.error('❌ AI status check failed:', error);
            res.writeHead(500);
            res.end(JSON.stringify({ error: 'Failed to check AI status' }));
        }
    }
    
    async handleCollaboration(req, res) {
        if (req.method !== 'POST') {
            res.writeHead(405);
            res.end('Method Not Allowed');
            return;
        }
        
        try {
            const body = await this.readRequestBody(req);
            const { message, canvasContext } = JSON.parse(body);
            
            console.log('🤝 Collaboration request:', message);
            
            // Get available AIs
            const availableProviders = ['claude', 'gpt', 'ollama']
                .filter(provider => this.multiAI.providers.get(provider).available);
            
            if (availableProviders.length === 0) {
                res.writeHead(503);
                res.end(JSON.stringify({ error: 'No AI providers available' }));
                return;
            }
            
            // Build enhanced prompt with canvas context
            const enhancedPrompt = this.buildCanvasPrompt(message, canvasContext);
            
            // Get collaborative response
            const result = await this.multiAI.collaborativeResponse(enhancedPrompt, availableProviders, {
                maxTokens: 1024
            });
            
            // Broadcast AI responses to all clients
            this.broadcastToClients({
                type: 'collaboration-update',
                message: message,
                responses: result.responses,
                timestamp: Date.now()
            });
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                responses: result.responses.map(({ provider, name, response }) => ({
                    ai: provider,
                    name,
                    response
                }))
            }));
            
        } catch (error) {
            console.error('❌ Collaboration failed:', error);
            res.writeHead(500);
            res.end(JSON.stringify({ error: 'Collaboration failed' }));
        }
    }
    
    async handleAIDrawing(req, res) {
        if (req.method !== 'POST') {
            res.writeHead(405);
            res.end('Method Not Allowed');
            return;
        }
        
        try {
            const body = await this.readRequestBody(req);
            const { prompt, canvasContext } = JSON.parse(body);
            
            console.log('🎨 AI drawing request:', prompt);
            
            // Create drawing-specific prompt
            const drawingPrompt = `
You are an AI assistant that can generate drawing commands for a collaborative canvas.

Canvas Context:
- Width: ${canvasContext?.width || 800}px
- Height: ${canvasContext?.height || 600}px

User Request: "${prompt}"

Please provide drawing commands as a JSON array. Available commands:
- {"type": "line", "startX": 100, "startY": 100, "endX": 200, "endY": 200}
- {"type": "circle", "x": 150, "y": 150, "radius": 50}
- {"type": "text", "text": "Hello", "x": 100, "y": 100, "font": "16px Arial"}

Respond with only the JSON array of commands to draw "${prompt}":`;
            
            // Get response from Claude for drawing commands
            const response = await this.multiAI.askAI('claude', drawingPrompt, {
                maxTokens: 1024
            });
            
            // Try to parse drawing commands
            let drawingCommands = [];
            try {
                // Extract JSON from response
                const jsonMatch = response.match(/\\[.*\\]/s);
                if (jsonMatch) {
                    drawingCommands = JSON.parse(jsonMatch[0]);
                }
            } catch (parseError) {
                console.warn('⚠️  Could not parse AI drawing commands');
                // Fallback: create simple drawing
                drawingCommands = [
                    { type: "text", text: prompt, x: 50, y: 50, font: "16px Arial" }
                ];
            }
            
            // Broadcast drawing to all clients
            this.broadcastToClients({
                type: 'ai-drawing',
                ai: 'claude',
                prompt: prompt,
                commands: drawingCommands,
                timestamp: Date.now()
            });
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                success: true,
                drawingCommands: drawingCommands
            }));
            
        } catch (error) {
            console.error('❌ AI drawing failed:', error);
            res.writeHead(500);
            res.end(JSON.stringify({ error: 'AI drawing failed' }));
        }
    }
    
    buildCanvasPrompt(message, canvasContext) {
        return `You are participating in a collaborative canvas session. Users can draw on a shared canvas while you provide guidance, suggestions, and creative input.

Canvas Context:
- Canvas size: ${canvasContext?.width || 800}x${canvasContext?.height || 600} pixels
- Current state: ${canvasContext ? 'Has existing drawings' : 'Blank canvas'}

User message: "${message}"

Please provide helpful, creative, and collaborative responses. You can:
- Suggest what to draw or add to the canvas
- Provide artistic guidance and techniques
- Collaborate on creative projects
- Help plan visual layouts or designs
- Offer constructive feedback

Your response should be encouraging and collaborative:`;
    }
    
    handleWebSocketMessage(ws, data) {
        switch (data.type) {
            case 'user-drawing':
                // Store drawing data and broadcast to other clients
                this.canvasState.drawings.push({
                    type: 'draw',
                    x: data.x,
                    y: data.y,
                    tool: data.tool,
                    timestamp: data.timestamp,
                    user: 'human'
                });
                
                // Broadcast to other clients (exclude sender)
                this.broadcastToClients(data, ws);
                break;
                
            case 'clear-canvas':
                // Clear canvas state
                this.canvasState.drawings = [];
                this.canvasState.lastUpdate = Date.now();
                
                // Broadcast clear command
                this.broadcastToClients(data, ws);
                break;
                
            case 'request-ai-collaboration':
                this.handleAICollaborationRequest(ws, data);
                break;
        }
    }
    
    async handleAICollaborationRequest(ws, data) {
        try {
            const { message, canvasData } = data;
            
            // Get AI response
            const result = await this.multiAI.collaborativeResponse(message, ['claude'], {
                maxTokens: 512
            });
            
            if (result.responses.length > 0) {
                const response = result.responses[0];
                
                // Send AI response back to requesting client
                ws.send(JSON.stringify({
                    type: 'ai-response',
                    ai: response.provider,
                    message: response.response,
                    timestamp: Date.now()
                }));
            }
            
        } catch (error) {
            console.error('❌ AI collaboration request failed:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'AI collaboration failed',
                timestamp: Date.now()
            }));
        }
    }
    
    broadcastToClients(data, excludeClient = null) {
        const message = JSON.stringify(data);
        
        this.clients.forEach(client => {
            if (client !== excludeClient && client.readyState === 1) { // WebSocket.OPEN = 1
                try {
                    client.send(message);
                } catch (error) {
                    console.error('❌ Failed to send to client:', error);
                    this.clients.delete(client);
                }
            }
        });
    }
    
    readRequestBody(req) {
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', () => {
                resolve(body);
            });
            req.on('error', reject);
        });
    }
    
    start() {
        this.server.listen(this.port, () => {
            console.log(`
🎨🤖 CLAUDE COLLABORATIVE CANVAS SERVER
======================================

🌐 Canvas Interface: http://localhost:${this.port}
📡 WebSocket Server: ws://localhost:${this.port}
🤖 AI Collaboration: Active

Available AIs:
${Array.from(this.multiAI.providers.entries())
    .map(([key, provider]) => `  ${provider.available ? '✅' : '❌'} ${provider.name}`)
    .join('\\n')}

🎯 Ready for collaborative AI canvas sessions!
            `);
        });
    }
    
    stop() {
        if (this.wss) {
            this.wss.close();
        }
        if (this.server) {
            this.server.close();
        }
        console.log('🛑 Canvas server stopped');
    }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
    const port = process.argv[2] ? parseInt(process.argv[2]) : 9000;
    const server = new ClaudeCanvasServer(port);
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\\n\\n🛑 Received interrupt signal');
        server.stop();
        process.exit(0);
    });
    
    process.on('SIGTERM', () => {
        console.log('\\n\\n🛑 Received termination signal');
        server.stop();
        process.exit(0);
    });
    
    server.start();
}

export default ClaudeCanvasServer;