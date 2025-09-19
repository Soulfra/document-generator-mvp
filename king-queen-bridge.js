#!/usr/bin/env node

/**
 * 👑💃 King-Queen Dashboard Bridge
 * 
 * Connects the technical Master System Controller (King) with the 
 * User Journey Orchestrator (Queen) for a complete debugging dance.
 * 
 * Technical metrics meet human experience.
 */

const WebSocket = require('ws');
const express = require('express');
const http = require('http');

class KingQueenBridge {
    constructor() {
        this.app = express();
        this.port = 9998; // Bridge port
        this.kingUrl = 'http://localhost:9999'; // Master Controller
        this.queenConnections = new Set();
        
        // Event mappings: Technical -> Human Impact
        this.eventMappings = {
            // Service Health -> User Experience
            'service_healthy': {
                queen: 'user_happy',
                emotion: 'happy',
                message: 'Everything is working smoothly!'
            },
            'service_degraded': {
                queen: 'user_waiting',
                emotion: 'confused',
                message: 'Things are a bit slow right now...'
            },
            'service_down': {
                queen: 'user_blocked',
                emotion: 'frustrated',
                message: 'Unable to complete action'
            },
            
            // Performance -> Perception
            'response_fast': {
                queen: 'experience_smooth',
                emotion: 'happy',
                message: 'Wow, that was quick!'
            },
            'response_slow': {
                queen: 'experience_laggy',
                emotion: 'confused',
                message: 'Is it still loading?'
            },
            'timeout': {
                queen: 'experience_failed',
                emotion: 'frustrated',
                message: 'It took too long and gave up'
            },
            
            // Errors -> Confusion
            'error_rate_low': {
                queen: 'journey_smooth',
                emotion: 'happy',
                message: 'Smooth sailing'
            },
            'error_rate_high': {
                queen: 'journey_bumpy',
                emotion: 'frustrated',
                message: 'Keeps hitting roadblocks'
            },
            
            // Features -> Value
            'feature_used': {
                queen: 'value_delivered',
                emotion: 'happy',
                message: 'Found what I needed!'
            },
            'feature_error': {
                queen: 'value_blocked',
                emotion: 'frustrated',
                message: "Can't use the feature I need"
            }
        };
        
        // NATO-style complementary tool pairs
        this.toolPairs = {
            'Alpha': { king: 'Analyzer', queen: 'Awareness' },
            'Bravo': { king: 'Backend Monitor', queen: 'Behavior Tracker' },
            'Charlie': { king: 'Container Health', queen: 'Customer Care' },
            'Delta': { king: 'Database Status', queen: 'Data Delight' },
            'Echo': { king: 'Error Logger', queen: 'Empathy Engine' },
            'Foxtrot': { king: 'Feature Flags', queen: 'Feeling Finder' },
            'Golf': { king: 'Gateway Monitor', queen: 'Guidance System' },
            'Hotel': { king: 'Health Checker', queen: 'Happiness Helper' }
        };
        
        this.init();
    }
    
    async init() {
        this.setupExpress();
        this.server = http.createServer(this.app);
        this.setupWebSocket();
        await this.startServer();
        this.connectToKing();
        this.startDanceRoutines();
    }
    
    setupExpress() {
        this.app.use(express.json());
        
        // Bridge status endpoint
        this.app.get('/status', (req, res) => {
            res.json({
                status: 'dancing',
                connections: {
                    king: this.kingConnected || false,
                    queens: this.queenConnections.size
                },
                metrics: this.getDanceMetrics()
            });
        });
        
        // Manual event trigger for testing
        this.app.post('/trigger/:event', (req, res) => {
            const event = req.params.event;
            const data = req.body;
            this.processKingEvent(event, data);
            res.json({ triggered: event, queens: this.queenConnections.size });
        });
    }
    
    setupWebSocket() {
        this.wss = new WebSocket.Server({ server: this.server, path: '/queen-bridge' });
        
        this.wss.on('connection', (ws) => {
            console.log('👸 Queen connected to the dance floor');
            this.queenConnections.add(ws);
            
            // Send welcome message
            ws.send(JSON.stringify({
                type: 'welcome',
                message: 'Ready to dance with the King! 👑💃'
            }));
            
            ws.on('message', (message) => {
                const data = JSON.parse(message);
                this.handleQueenMessage(ws, data);
            });
            
            ws.on('close', () => {
                console.log('👸 Queen left the dance floor');
                this.queenConnections.delete(ws);
            });
        });
    }
    
    async startServer() {
        return new Promise((resolve) => {
            this.server.listen(this.port, () => {
                console.log('🌉 King-Queen Bridge established on port', this.port);
                console.log('👑 Waiting for King at', this.kingUrl);
                console.log('👸 Queens can connect at ws://localhost:' + this.port + '/queen-bridge');
                resolve();
            });
        });
    }
    
    connectToKing() {
        // Poll King's status endpoint
        setInterval(async () => {
            try {
                const response = await fetch(this.kingUrl + '/api/status');
                const status = await response.json();
                this.processKingStatus(status);
                this.kingConnected = true;
            } catch (error) {
                this.kingConnected = false;
                this.notifyQueens({
                    type: 'king_status',
                    connected: false,
                    message: 'King is away from the throne'
                });
            }
        }, 5000);
    }
    
    processKingStatus(status) {
        // Analyze service health and convert to human impact
        const { services, summary } = status;
        
        // Overall system health -> User happiness
        const healthScore = parseFloat(summary.healthPercentage);
        let overallEmotion = 'happy';
        if (healthScore < 30) overallEmotion = 'frustrated';
        else if (healthScore < 70) overallEmotion = 'confused';
        
        this.notifyQueens({
            type: 'system_health',
            score: healthScore,
            emotion: overallEmotion,
            message: this.getHealthMessage(healthScore)
        });
        
        // Check for specific service issues
        services.forEach(service => {
            if (service.status === 'offline' && service.critical) {
                this.processKingEvent('critical_service_down', {
                    service: service.name,
                    impact: 'Users cannot ' + this.getServiceImpact(service.id)
                });
            } else if (service.status === 'unhealthy') {
                this.processKingEvent('service_degraded', {
                    service: service.name,
                    impact: 'Users experiencing issues with ' + this.getServiceImpact(service.id)
                });
            }
        });
    }
    
    getHealthMessage(score) {
        if (score >= 90) return "Everything is perfect! Users are delighted! 🎉";
        if (score >= 70) return "Mostly smooth sailing with minor waves 🌊";
        if (score >= 50) return "Getting bumpy, users might notice issues 😕";
        if (score >= 30) return "Rough waters ahead, many users affected 😟";
        return "Major problems! Users are having a bad time 😭";
    }
    
    getServiceImpact(serviceId) {
        const impacts = {
            'template-processor': 'create new projects',
            'ai-api': 'get AI suggestions',
            'document-parser': 'upload documents',
            'platform-hub': 'access the platform',
            'postgres': 'save their work',
            'redis': 'experience fast loading'
        };
        return impacts[serviceId] || 'use this feature';
    }
    
    processKingEvent(event, data) {
        const mapping = this.eventMappings[event];
        if (!mapping) return;
        
        const queenEvent = {
            type: mapping.queen,
            emotion: mapping.emotion,
            message: mapping.message,
            technicalCause: event,
            details: data,
            timestamp: new Date().toISOString()
        };
        
        this.notifyQueens(queenEvent);
    }
    
    handleQueenMessage(ws, data) {
        switch (data.type) {
            case 'dance_request':
                // Queen wants to sync with King
                this.startDanceSequence(ws);
                break;
            
            case 'user_feedback':
                // Queen reporting user sentiment
                this.processUserFeedback(data);
                break;
            
            case 'friction_detected':
                // Queen found a UX issue
                this.reportFrictionToKing(data);
                break;
        }
    }
    
    startDanceSequence(queenWs) {
        // Synchronized update sequence
        console.log('💃 Starting dance sequence...');
        
        // Get current King status
        fetch(this.kingUrl + '/api/status')
            .then(res => res.json())
            .then(status => {
                // Send choreographed updates
                const sequence = this.createDanceSequence(status);
                let step = 0;
                
                const danceInterval = setInterval(() => {
                    if (step < sequence.length) {
                        queenWs.send(JSON.stringify(sequence[step]));
                        step++;
                    } else {
                        clearInterval(danceInterval);
                        queenWs.send(JSON.stringify({
                            type: 'dance_complete',
                            message: 'Perfect synchronization! 👑💃'
                        }));
                    }
                }, 500);
            });
    }
    
    createDanceSequence(status) {
        const sequence = [];
        const { services } = status;
        
        // Create a choreographed sequence of updates
        services.forEach((service, index) => {
            sequence.push({
                type: 'dance_step',
                step: index + 1,
                service: service.name,
                status: service.status,
                emotion: service.status === 'healthy' ? 'happy' : 'concerned',
                spin: index % 2 === 0 ? 'left' : 'right'
            });
        });
        
        return sequence;
    }
    
    startDanceRoutines() {
        // Regular dance patterns between King and Queen
        
        // Pattern 1: Health Check Waltz (every 30s)
        setInterval(() => {
            this.performHealthWaltz();
        }, 30000);
        
        // Pattern 2: Error Tango (on error detection)
        // Pattern 3: Success Salsa (on successful operations)
        // Pattern 4: Recovery Rumba (after fixing issues)
    }
    
    performHealthWaltz() {
        // Graceful health check dance
        fetch(this.kingUrl + '/api/status')
            .then(res => res.json())
            .then(status => {
                const steps = [
                    { move: 'bow', message: 'Checking system health...' },
                    { move: 'spin', message: `${status.summary.healthy} services dancing smoothly` },
                    { move: 'dip', message: `${status.summary.unhealthy} services need attention` },
                    { move: 'flourish', message: 'Dance complete!' }
                ];
                
                steps.forEach((step, index) => {
                    setTimeout(() => {
                        this.notifyQueens({
                            type: 'waltz_step',
                            ...step
                        });
                    }, index * 1000);
                });
            });
    }
    
    notifyQueens(data) {
        const message = JSON.stringify(data);
        this.queenConnections.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(message);
            }
        });
    }
    
    getDanceMetrics() {
        return {
            connectedQueens: this.queenConnections.size,
            kingConnected: this.kingConnected || false,
            danceRoutines: ['Health Waltz', 'Error Tango', 'Success Salsa'],
            toolPairs: Object.keys(this.toolPairs).length,
            eventsProcessed: this.eventsProcessed || 0
        };
    }
}

// Start the bridge
new KingQueenBridge();

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👑💃 The dance is ending...');
    process.exit(0);
});