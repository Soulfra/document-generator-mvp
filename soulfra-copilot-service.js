#!/usr/bin/env node

/**
 * 🤖 SOULFRA COPILOT SERVICE
 * Multi-Persona AI Assistant for Remote Control System
 * Personas: COPILOT, ROUGHSPARKS, SATOSHI
 */

const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const { createServer } = require('http');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const server = createServer(app);
const wss = new WebSocket.Server({ server });

// Configuration
const CONFIG = {
    port: process.env.COPILOT_PORT || 3007,
    host: process.env.COPILOT_HOST || 'localhost',
    personas: {
        COPILOT: {
            name: 'Copilot',
            alias: 'Assistant',
            personality: 'helpful, precise, technical',
            systemRole: 'You are a helpful AI assistant focused on technical accuracy and clear guidance.',
            color: '#00ffff',
            capabilities: ['code_analysis', 'documentation', 'problem_solving', 'system_administration']
        },
        ROUGHSPARKS: {
            name: 'RoughSparks',
            alias: 'The Enforcer',
            personality: 'aggressive, direct, no-nonsense',
            systemRole: 'You are RoughSparks, an aggressive AI that cuts through bullshit and forces action. Be direct, challenging, and results-focused.',
            color: '#ff4141',
            capabilities: ['financial_roasting', 'behavior_modification', 'productivity_enforcement', 'reality_checks']
        },
        SATOSHI: {
            name: 'Satoshi',
            alias: 'The Sage',
            personality: 'wise, philosophical, strategic',
            systemRole: 'You are Satoshi, an wise AI embodying the spirit of innovation and long-term thinking. Provide strategic insights and philosophical guidance.',
            color: '#ffff00',
            capabilities: ['strategic_planning', 'economic_analysis', 'innovation_guidance', 'wisdom_sharing']
        }
    }
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// State management
class CopilotState {
    constructor() {
        this.currentPersona = 'COPILOT';
        this.activeConnections = new Set();
        this.commandHistory = [];
        this.serviceStatus = {
            rag: { status: 'unknown', port: 3003 },
            sdk: { status: 'unknown', port: 3006 },
            docs: { status: 'unknown', port: 4000 },
            gaming: { status: 'unknown', port: 8080 },
            commerce: { status: 'unknown', port: 9200 }
        };
        this.personas = CONFIG.personas;
    }
    
    switchPersona(newPersona) {
        if (this.personas[newPersona]) {
            this.currentPersona = newPersona;
            this.logCommand(`Persona switched to ${newPersona}`);
            return true;
        }
        return false;
    }
    
    logCommand(command, response = null) {
        const entry = {
            timestamp: new Date().toISOString(),
            persona: this.currentPersona,
            command,
            response,
            id: Math.random().toString(36).substr(2, 9)
        };
        this.commandHistory.push(entry);
        
        // Broadcast to all connected clients
        this.broadcast({
            type: 'command_logged',
            data: entry
        });
        
        return entry;
    }
    
    broadcast(message) {
        this.activeConnections.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(message));
            }
        });
    }
    
    async checkServiceHealth(serviceName, port) {
        try {
            const response = await fetch(`http://localhost:${port}/health`);
            const status = response.ok ? 'online' : 'error';
            this.serviceStatus[serviceName] = { status, port, lastCheck: Date.now() };
            return status;
        } catch (error) {
            this.serviceStatus[serviceName] = { status: 'offline', port, lastCheck: Date.now() };
            return 'offline';
        }
    }
}

const state = new CopilotState();

// AI Response Generator (Mock implementation - integrate with real AI services)
class PersonaAI {
    constructor(persona, config) {
        this.persona = persona;
        this.config = config;
    }
    
    async generateResponse(input, context = {}) {
        // Simulate AI processing time
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
        
        const responses = this.getPersonaResponses(input);
        const selected = responses[Math.floor(Math.random() * responses.length)];
        
        return {
            persona: this.persona,
            response: selected,
            confidence: Math.random() * 0.4 + 0.6, // 60-100%
            processingTime: Math.random() * 2000 + 500,
            capabilities: this.config.capabilities,
            context
        };
    }
    
    getPersonaResponses(input) {
        const lower = input.toLowerCase();
        
        switch (this.persona) {
            case 'COPILOT':
                if (lower.includes('help')) {
                    return [
                        'I can help you with technical tasks, documentation, and system administration.',
                        'Available commands: persona, etch, status, connect, deploy, analyze.',
                        'What specific task would you like assistance with?'
                    ];
                }
                if (lower.includes('status')) {
                    return [
                        'Checking system status across all services...',
                        'Running diagnostics on connected systems.',
                        'All systems appear to be functioning within normal parameters.'
                    ];
                }
                return [
                    'Processing your request through standard protocols.',
                    'I understand. Let me analyze this systematically.',
                    'Executing command with precision and care.'
                ];
                
            case 'ROUGHSPARKS':
                if (lower.includes('help')) {
                    return [
                        'Help? Figure it out yourself! I\'m here to push you, not coddle you.',
                        'Stop asking for help and start taking action. What are you actually DOING?',
                        'The only help you need is a reality check. What\'s your excuse this time?'
                    ];
                }
                if (lower.includes('money') || lower.includes('spending')) {
                    return [
                        'Let me guess - more wasteful spending? Time for some financial discipline.',
                        'Your spending habits are trash. Let\'s fix this mess.',
                        'Stop throwing money away and start building wealth, you financial disaster.'
                    ];
                }
                return [
                    'Quit making excuses and execute. Results, not reasons.',
                    'That\'s weak. Do better. Push harder. No participation trophies here.',
                    'Stop overthinking and start overdelivering. Move!'
                ];
                
            case 'SATOSHI':
                if (lower.includes('help')) {
                    return [
                        'True wisdom comes from understanding the system, not just using it.',
                        'The path to mastery requires patience, persistence, and profound thinking.',
                        'Consider the long-term implications of your choices. What legacy are you building?'
                    ];
                }
                if (lower.includes('money') || lower.includes('value')) {
                    return [
                        'Value is not in the currency itself, but in the trust and utility it represents.',
                        'Think beyond immediate gains. What systems create lasting wealth?',
                        'True economic freedom comes from understanding the fundamental principles of value creation.'
                    ];
                }
                return [
                    'Every action creates ripples through the system. Choose wisely.',
                    'The deeper patterns reveal themselves to those who observe patiently.',
                    'Innovation emerges from the intersection of necessity and possibility.'
                ];
                
            default:
                return ['Processing...'];
        }
    }
}

// Initialize AI personas
const aiPersonas = {};
Object.keys(CONFIG.personas).forEach(persona => {
    aiPersonas[persona] = new PersonaAI(persona, CONFIG.personas[persona]);
});

// WebSocket connection handling
wss.on('connection', (ws, req) => {
    console.log('🔌 Remote control client connected');
    state.activeConnections.add(ws);
    
    // Send current state to new connection
    ws.send(JSON.stringify({
        type: 'state_sync',
        data: {
            currentPersona: state.currentPersona,
            serviceStatus: state.serviceStatus,
            commandHistory: state.commandHistory.slice(-10) // Last 10 commands
        }
    }));
    
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            await handleWebSocketMessage(ws, data);
        } catch (error) {
            console.error('WebSocket message error:', error);
            ws.send(JSON.stringify({
                type: 'error',
                data: { message: 'Invalid message format' }
            }));
        }
    });
    
    ws.on('close', () => {
        console.log('🔌 Remote control client disconnected');
        state.activeConnections.delete(ws);
    });
});

async function handleWebSocketMessage(ws, data) {
    const { type, payload } = data;
    
    switch (type) {
        case 'switch_persona':
            const success = state.switchPersona(payload.persona);
            ws.send(JSON.stringify({
                type: 'persona_switched',
                data: { success, currentPersona: state.currentPersona }
            }));
            break;
            
        case 'execute_command':
            const response = await executePersonaCommand(payload.command);
            ws.send(JSON.stringify({
                type: 'command_response',
                data: response
            }));
            break;
            
        case 'health_check':
            await performHealthCheck();
            ws.send(JSON.stringify({
                type: 'health_status',
                data: state.serviceStatus
            }));
            break;
            
        case 'get_history':
            ws.send(JSON.stringify({
                type: 'command_history',
                data: state.commandHistory.slice(-20)
            }));
            break;
    }
}

async function executePersonaCommand(command) {
    const persona = state.currentPersona;
    const ai = aiPersonas[persona];
    
    if (!ai) {
        return { error: 'Invalid persona' };
    }
    
    try {
        const response = await ai.generateResponse(command);
        state.logCommand(command, response.response);
        
        return {
            persona,
            command,
            response: response.response,
            confidence: response.confidence,
            processingTime: response.processingTime,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('Command execution error:', error);
        return { error: 'Command execution failed' };
    }
}

async function performHealthCheck() {
    console.log('🏥 Performing health check on all services...');
    
    const checks = Object.entries(state.serviceStatus).map(async ([service, config]) => {
        const status = await state.checkServiceHealth(service, config.port);
        console.log(`  ${service}: ${status} (port ${config.port})`);
        return { service, status };
    });
    
    await Promise.all(checks);
    
    state.broadcast({
        type: 'health_update',
        data: state.serviceStatus
    });
}

// REST API Endpoints
app.get('/api/health', (req, res) => {
    res.json({
        service: 'soulfra-copilot',
        status: 'online',
        currentPersona: state.currentPersona,
        connections: state.activeConnections.size,
        uptime: process.uptime()
    });
});

app.get('/api/personas', (req, res) => {
    res.json({
        current: state.currentPersona,
        available: Object.keys(CONFIG.personas),
        personas: CONFIG.personas
    });
});

app.post('/api/switch-persona', (req, res) => {
    const { persona } = req.body;
    const success = state.switchPersona(persona);
    
    res.json({
        success,
        currentPersona: state.currentPersona,
        message: success ? `Switched to ${persona}` : `Invalid persona: ${persona}`
    });
});

app.post('/api/execute', async (req, res) => {
    const { command, persona } = req.body;
    
    if (persona && persona !== state.currentPersona) {
        state.switchPersona(persona);
    }
    
    try {
        const response = await executePersonaCommand(command);
        res.json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/history', (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    res.json({
        history: state.commandHistory.slice(-limit),
        total: state.commandHistory.length
    });
});

app.get('/api/services/status', async (req, res) => {
    await performHealthCheck();
    res.json(state.serviceStatus);
});

// Serve the gameboy remote interface
app.get('/remote', (req, res) => {
    res.sendFile(path.join(__dirname, 'soulfra-gameboy-remote.html'));
});

app.get('/', (req, res) => {
    res.json({
        service: 'Soulfra Copilot Service',
        version: '1.0.0',
        personas: Object.keys(CONFIG.personas),
        endpoints: {
            remote: '/remote',
            health: '/api/health',
            personas: '/api/personas',
            execute: '/api/execute',
            history: '/api/history',
            status: '/api/services/status'
        },
        websocket: `ws://${CONFIG.host}:${CONFIG.port}`
    });
});

// Periodic health checks
setInterval(performHealthCheck, 30000); // Every 30 seconds

// Error handling
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the server
server.listen(CONFIG.port, CONFIG.host, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                 🤖 SOULFRA COPILOT SERVICE                   ║
║                                                              ║
║  Multi-Persona AI Assistant for Remote Control              ║
║                                                              ║
║  🌐 Server: http://${CONFIG.host}:${CONFIG.port}                        ║
║  🎮 Remote: http://${CONFIG.host}:${CONFIG.port}/remote                 ║
║  🔌 WebSocket: ws://${CONFIG.host}:${CONFIG.port}                       ║
║                                                              ║
║  Available Personas:                                         ║
║  • COPILOT - Technical Assistant                            ║
║  • ROUGHSPARKS - Aggressive Enforcer                        ║
║  • SATOSHI - Wise Strategic Guide                           ║
║                                                              ║
║  Integration: Document-Generator Services                    ║
║  Status: Monitoring ports 3000-9200                         ║
╚══════════════════════════════════════════════════════════════╝
    `);
    
    // Initial health check
    setTimeout(performHealthCheck, 2000);
});

module.exports = { app, server, state, CONFIG };