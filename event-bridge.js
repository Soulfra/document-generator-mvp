#!/usr/bin/env node

/**
 * 🌉 EVENT BRIDGE - Connects all systems
 * Routes events between:
 * - Orchestrator (8000)
 * - Sequential Tagging (42001)
 * - Voice of God (55001)
 * - Other services
 */

const WebSocket = require('ws');
const EventEmitter = require('events');

class EventBridge extends EventEmitter {
    constructor() {
        super();
        this.connections = new Map();
        this.eventLog = [];
        
        // Bridge WebSocket server
        this.wss = new WebSocket.Server({ port: 9001 });
        
        console.log('🌉 Event Bridge starting on port 9001...');
        
        // Connect to all services
        this.connectToServices();
        
        // Handle bridge connections
        this.wss.on('connection', (ws) => {
            console.log('✅ New service connected to bridge');
            
            ws.on('message', (message) => {
                const event = JSON.parse(message);
                this.routeEvent(event);
            });
        });
    }
    
    connectToServices() {
        // Connect to Sequential Tagging
        this.connectToService('sequential-tagging', 'ws://localhost:42001');
        
        // Connect to Voice of God (if it has WebSocket)
        this.connectToService('voice-of-god', 'ws://localhost:55001');
        
        // Connect to Orchestrator (if it has WebSocket)
        this.connectToService('orchestrator', 'ws://localhost:8000');
    }
    
    connectToService(name, url) {
        try {
            const ws = new WebSocket(url);
            
            ws.on('open', () => {
                console.log(`✅ Connected to ${name} at ${url}`);
                this.connections.set(name, ws);
            });
            
            ws.on('message', (message) => {
                const event = {
                    source: name,
                    timestamp: new Date().toISOString(),
                    data: JSON.parse(message)
                };
                this.routeEvent(event);
            });
            
            ws.on('error', (err) => {
                console.log(`⚠️  Cannot connect to ${name}: ${err.message}`);
            });
            
        } catch (err) {
            console.log(`⚠️  Failed to connect to ${name}: ${err.message}`);
        }
    }
    
    routeEvent(event) {
        // Log event
        this.eventLog.push(event);
        console.log(`📨 Event from ${event.source}:`, event.data);
        
        // Broadcast to all other services
        this.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(event));
            }
        });
        
        // Emit for local listeners
        this.emit('event', event);
        
        // Special routing rules
        if (event.source === 'sequential-tagging' && event.data.type === 'tag-created') {
            console.log('🏷️  New tag created, notifying storyteller...');
            this.notifyStoryTeller(event);
        }
    }
    
    notifyStoryTeller(event) {
        const storyEvent = {
            type: 'narrate',
            content: `A new sequential tag was born: ${event.data.tag}`,
            source: 'event-bridge',
            originalEvent: event
        };
        
        // Send to Voice of God if connected
        const vog = this.connections.get('voice-of-god');
        if (vog && vog.readyState === WebSocket.OPEN) {
            vog.send(JSON.stringify(storyEvent));
        }
    }
}

// Start the bridge
const bridge = new EventBridge();

// API endpoint for status
const express = require('express');
const app = express();

app.get('/status', (req, res) => {
    res.json({
        connections: Array.from(bridge.connections.keys()),
        eventCount: bridge.eventLog.length,
        recentEvents: bridge.eventLog.slice(-10)
    });
});

app.listen(9002, () => {
    console.log('🌉 Event Bridge API on http://localhost:9002');
});

console.log(`
🌉 EVENT BRIDGE INITIALIZED
==========================
WebSocket: ws://localhost:9001
API: http://localhost:9002/status

Connected Services:
- Sequential Tagging (42001)
- Voice of God (55001)
- Orchestrator (8000)

All events are now bridged!
`);