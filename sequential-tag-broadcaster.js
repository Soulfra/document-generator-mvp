#!/usr/bin/env node

/**
 * 🔊 SEQUENTIAL TAG BROADCASTER
 * Patches the sequential tagging system to broadcast events
 */

const WebSocket = require('ws');
const http = require('http');

class SequentialTagBroadcaster {
    constructor() {
        this.storytellerWS = null;
        this.orchestratorWS = null;
        
        // Connect to services
        this.connectToServices();
        
        // Monitor sequential tagging
        this.monitorSequentialTags();
        
        console.log('🔊 Sequential Tag Broadcaster initialized');
    }
    
    connectToServices() {
        // Connect to Voice of God Storyteller
        try {
            this.storytellerWS = new WebSocket('ws://localhost:55001');
            this.storytellerWS.on('open', () => {
                console.log('✅ Connected to Voice of God Storyteller');
            });
            this.storytellerWS.on('error', (err) => {
                console.log('⚠️  Could not connect to storyteller:', err.message);
            });
        } catch (err) {
            console.log('⚠️  Storyteller connection failed:', err.message);
        }
        
        // Connect to Orchestrator
        try {
            this.orchestratorWS = new WebSocket('ws://localhost:8000');
            this.orchestratorWS.on('open', () => {
                console.log('✅ Connected to Orchestrator');
            });
            this.orchestratorWS.on('error', (err) => {
                console.log('⚠️  Could not connect to orchestrator:', err.message);
            });
        } catch (err) {
            console.log('⚠️  Orchestrator connection failed:', err.message);
        }
    }
    
    monitorSequentialTags() {
        // Poll sequential tagging API
        setInterval(() => {
            this.checkForNewTags();
        }, 1000);
        
        // Also connect to its WebSocket
        const tagWS = new WebSocket('ws://localhost:42001');
        tagWS.on('open', () => {
            console.log('✅ Connected to Sequential Tagging WebSocket');
        });
        
        tagWS.on('message', (data) => {
            try {
                const event = JSON.parse(data);
                this.broadcastTagEvent(event);
            } catch (err) {
                console.error('Error parsing tag event:', err);
            }
        });
    }
    
    async checkForNewTags() {
        try {
            const response = await fetch('http://localhost:42000/api/collar/sequential-tags');
            const data = await response.json();
            
            if (data.newTags && data.newTags.length > 0) {
                data.newTags.forEach(tag => {
                    this.broadcastTagEvent({
                        type: 'sequential-tag-created',
                        tag: tag,
                        timestamp: new Date().toISOString()
                    });
                });
            }
        } catch (err) {
            // Silent fail - service might not be ready
        }
    }
    
    broadcastTagEvent(event) {
        console.log('📢 Broadcasting tag event:', event);
        
        // Create storyteller-friendly event
        const storyEvent = {
            type: 'narrate',
            source: 'sequential-tagging',
            content: `Sequential tag ${event.tag?.sequence || 'unknown'} emerged from layer ${event.tag?.onion_layer || 1}`,
            data: event
        };
        
        // Send to storyteller
        if (this.storytellerWS && this.storytellerWS.readyState === WebSocket.OPEN) {
            this.storytellerWS.send(JSON.stringify(storyEvent));
        }
        
        // Send to orchestrator
        if (this.orchestratorWS && this.orchestratorWS.readyState === WebSocket.OPEN) {
            this.orchestratorWS.send(JSON.stringify({
                type: 'system-event',
                source: 'sequential-tagging',
                event: event
            }));
        }
    }
}

// Start the broadcaster
const broadcaster = new SequentialTagBroadcaster();

// Simple HTTP endpoint for testing
const server = http.createServer((req, res) => {
    if (req.url === '/test-broadcast') {
        broadcaster.broadcastTagEvent({
            type: 'test',
            tag: { sequence: 999, value: 'test-tag' },
            timestamp: new Date().toISOString()
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'broadcast sent' }));
    } else {
        res.writeHead(404);
        res.end();
    }
});

server.listen(9003, () => {
    console.log('🔊 Broadcaster test endpoint: http://localhost:9003/test-broadcast');
});

console.log(`
🔊 SEQUENTIAL TAG BROADCASTER
=============================
Monitoring: Sequential Tagging (42000/42001)
Broadcasting to:
- Voice of God Storyteller (55001)
- Local Orchestrator (8000)

Test broadcast: curl http://localhost:9003/test-broadcast
`);