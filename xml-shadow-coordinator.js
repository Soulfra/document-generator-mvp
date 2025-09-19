#!/usr/bin/env node

/**
 * XML SHADOW COORDINATOR
 * Manages the shadow XML layer that coordinates all systems in the unified window
 * Handles inter-service communication and data synchronization
 */

const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const fs = require('fs').promises;

class XMLShadowCoordinator {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });
        this.port = 9999;  // Master coordination port
        
        this.shadowState = {
            unified_window_active: false,
            connected_services: new Map(),
            xml_synchronization: new Map(),
            security_alerts: [],
            leaderboard_data: new Map(),
            threat_level: 'LOW',
            active_players: 47,
            detected_bots: 3,
            reasoning_bots: 2,
            authentication_status: 'locked',
            xml_mapping_complete: true
        };

        this.serviceEndpoints = {
            'voice-auth': 'ws://localhost:9980',
            'xml-mapper': 'ws://localhost:9985',
            'pattern-recognition': 'ws://localhost:9995',
            'character-theater': 'ws://localhost:9992',
            'isometric-map': 'ws://localhost:9990',
            'eloop-diagnostic': 'ws://localhost:9975',
            'ai-orchestration': 'ws://localhost:9970',
            'spectator-arena': 'ws://localhost:9965',
            'lore-database': 'ws://localhost:9960'
        };

        this.initializeShadowCoordination();
        this.setupRoutes();
        this.setupWebSocket();
        this.startServiceHealthMonitoring();
    }

    async initializeShadowCoordination() {
        console.log('🌟 Initializing XML Shadow Coordination System...');
        
        // Initialize leaderboard with test data
        this.initializeLeaderboards();
        
        // Connect to all services
        await this.connectToAllServices();
        
        // Setup XML shadow mapping
        this.setupXMLShadowMapping();
        
        console.log('✅ Shadow coordination system ready');
    }

    initializeLeaderboards() {
        console.log('🏆 Initializing White-Hat Security Leaderboards...');
        
        // Mascot Building XP Leaderboard
        this.shadowState.leaderboard_data.set('mascot_xp', [
            { name: 'Guardian_Master', xp: 15420, type: 'human', verified: true },
            { name: 'BuilderPro_Human', xp: 12350, type: 'human', verified: true },
            { name: '[TEST] ReasoningBot_1', xp: 890, type: 'reasoning_bot', xp_rate: 'intentionally_slow' },
            { name: 'DesignWizard', xp: 8750, type: 'human', verified: true },
            { name: '[TEST] PatternBot_2', xp: 650, type: 'reasoning_bot', xp_rate: 'intentionally_slow' },
            { name: 'FastBuilder999', xp: 25000, type: 'suspicious', flagged: true, threat_level: 'HIGH' }
        ]);

        // Security Detection Score Leaderboard
        this.shadowState.leaderboard_data.set('security_detection', [
            { name: 'ThreatHunter_AI', accuracy: 99.7, type: 'ai_system' },
            { name: 'PatternMaster', accuracy: 98.2, type: 'ai_system' },
            { name: 'BehaviorAnalyst', accuracy: 97.8, type: 'ai_system' }
        ]);

        console.log('🏆 Leaderboards initialized with test bots and suspicious accounts');
    }

    async connectToAllServices() {
        console.log('🔗 Connecting to all subsystem services...');
        
        for (const [serviceName, endpoint] of Object.entries(this.serviceEndpoints)) {
            try {
                const ws = new WebSocket(endpoint);
                
                ws.on('open', () => {
                    console.log(`✅ Connected to ${serviceName}`);
                    this.shadowState.connected_services.set(serviceName, {
                        status: 'connected',
                        endpoint: endpoint,
                        last_ping: new Date(),
                        websocket: ws
                    });
                });

                ws.on('message', (data) => {
                    this.handleServiceMessage(serviceName, data);
                });

                ws.on('error', () => {
                    console.log(`⚠️ ${serviceName} not available - continuing without it`);
                    this.shadowState.connected_services.set(serviceName, {
                        status: 'unavailable',
                        endpoint: endpoint,
                        last_attempt: new Date()
                    });
                });

            } catch (error) {
                console.log(`⚠️ Failed to connect to ${serviceName}: ${error.message}`);
            }
        }
    }

    handleServiceMessage(serviceName, data) {
        try {
            const message = JSON.parse(data);
            
            // Route messages based on service and type
            switch (serviceName) {
                case 'voice-auth':
                    this.handleVoiceAuthMessage(message);
                    break;
                case 'xml-mapper':
                    this.handleXMLMapperMessage(message);
                    break;
                case 'pattern-recognition':
                    this.handlePatternMessage(message);
                    break;
                case 'character-theater':
                    this.handleTheaterMessage(message);
                    break;
                default:
                    this.handleGenericServiceMessage(serviceName, message);
            }

            // Broadcast to all unified window clients
            this.broadcastToUnifiedClients({
                type: 'service_update',
                service: serviceName,
                data: message,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.log(`Invalid message from ${serviceName}:`, error);
        }
    }

    handleVoiceAuthMessage(message) {
        switch (message.type) {
            case 'human_authenticated':
                this.shadowState.authentication_status = 'authenticated';
                this.addSecurityAlert('✅ Guardian voice authenticated - System unlocked');
                break;
            case 'non_human_blocked':
                this.shadowState.authentication_status = 'locked';
                this.addSecurityAlert('🚫 AI-generated voice blocked - Access denied');
                break;
            case 'authentication_expired':
                this.shadowState.authentication_status = 'expired';
                this.addSecurityAlert('⏰ Guardian authentication expired - System locked');
                break;
        }
    }

    handleXMLMapperMessage(message) {
        switch (message.type) {
            case 'xml_completion_finished':
                this.shadowState.xml_mapping_complete = true;
                this.addSecurityAlert('🗺️ XML mapping completion verified');
                break;
            case 'layer_mapping_completed':
                this.addSecurityAlert(`📋 Layer "${message.layer_id}" XML mapping complete`);
                break;
        }
    }

    handlePatternMessage(message) {
        if (message.type === 'suspicious_behavior_detected') {
            this.shadowState.threat_level = message.threat_level || 'MEDIUM';
            this.addSecurityAlert(`⚠️ Suspicious behavior: ${message.description}`);
            
            // Update leaderboard if it's a flagged player
            this.flagSuspiciousPlayer(message.player_name, message.reason);
        }
    }

    handleTheaterMessage(message) {
        if (message.type === 'mascot_xp_gained') {
            this.updateLeaderboardXP(message.player_name, message.xp_gained);
        }
    }

    handleGenericServiceMessage(serviceName, message) {
        // Store the message in XML shadow mapping
        this.shadowState.xml_synchronization.set(serviceName, {
            last_message: message,
            timestamp: new Date().toISOString(),
            status: 'synchronized'
        });
    }

    setupXMLShadowMapping() {
        console.log('🌟 Setting up XML Shadow Mapping...');
        
        // Create XML structure that maps all services
        this.shadowState.xml_shadow_map = {
            unified_window: {
                services: Object.keys(this.serviceEndpoints),
                coordination_active: true,
                real_time_sync: true
            },
            security_layer: {
                authentication: 'voice_required',
                threat_monitoring: 'active',
                bot_detection: 'enabled',
                leaderboard_protection: 'active'
            },
            game_layer: {
                mascot_system: 'active',
                xp_tracking: 'enabled',
                world_building: 'active',
                leaderboards: 'protected'
            },
            ai_layer: {
                reasoning_bots: 'deployed_slow_xp',
                pattern_recognition: 'monitoring',
                behavior_analysis: 'active'
            }
        };

        console.log('🌟 XML Shadow Mapping complete - All systems coordinated');
    }

    addSecurityAlert(message) {
        const alert = {
            timestamp: new Date().toISOString(),
            message: message,
            time_display: new Date().toLocaleTimeString()
        };
        
        this.shadowState.security_alerts.unshift(alert);
        
        // Keep only last 10 alerts
        if (this.shadowState.security_alerts.length > 10) {
            this.shadowState.security_alerts = this.shadowState.security_alerts.slice(0, 10);
        }

        // Broadcast to unified window
        this.broadcastToUnifiedClients({
            type: 'security_alert',
            alert: alert
        });
    }

    flagSuspiciousPlayer(playerName, reason) {
        const mascotLeaderboard = this.shadowState.leaderboard_data.get('mascot_xp');
        const player = mascotLeaderboard.find(p => p.name === playerName);
        
        if (player) {
            player.flagged = true;
            player.threat_level = 'HIGH';
            player.flag_reason = reason;
            
            this.addSecurityAlert(`🚨 Player "${playerName}" flagged: ${reason}`);
        }
    }

    updateLeaderboardXP(playerName, xpGained) {
        const mascotLeaderboard = this.shadowState.leaderboard_data.get('mascot_xp');
        let player = mascotLeaderboard.find(p => p.name === playerName);
        
        if (!player) {
            // New player
            player = {
                name: playerName,
                xp: xpGained,
                type: 'human',
                verified: false
            };
            mascotLeaderboard.push(player);
        } else {
            player.xp += xpGained;
        }

        // Check for suspicious XP gain patterns
        if (xpGained > 1000 && player.type === 'human') {
            this.flagSuspiciousPlayer(playerName, 'Unusual XP gain rate');
        }

        // Sort leaderboard
        mascotLeaderboard.sort((a, b) => b.xp - a.xp);
    }

    startServiceHealthMonitoring() {
        console.log('💓 Starting service health monitoring...');
        
        setInterval(() => {
            // Update player counts with realistic variation
            this.shadowState.active_players = 45 + Math.floor(Math.random() * 10);
            this.shadowState.detected_bots = 2 + Math.floor(Math.random() * 3);
            
            // Simulate threat level changes
            const randomThreat = Math.random();
            if (randomThreat < 0.7) {
                this.shadowState.threat_level = 'LOW';
            } else if (randomThreat < 0.95) {
                this.shadowState.threat_level = 'MEDIUM';
            } else {
                this.shadowState.threat_level = 'HIGH';
            }

            // Broadcast health update
            this.broadcastToUnifiedClients({
                type: 'health_update',
                active_players: this.shadowState.active_players,
                detected_bots: this.shadowState.detected_bots,
                threat_level: this.shadowState.threat_level,
                authentication_status: this.shadowState.authentication_status
            });

        }, 5000);

        // Simulate reasoning bot XP updates (slow)
        setInterval(() => {
            const mascotLeaderboard = this.shadowState.leaderboard_data.get('mascot_xp');
            const reasoningBots = mascotLeaderboard.filter(p => p.type === 'reasoning_bot');
            
            reasoningBots.forEach(bot => {
                // Slow, predictable XP gain for reasoning bots
                const xpGain = 1 + Math.floor(Math.random() * 3);
                bot.xp += xpGain;
                
                this.addSecurityAlert(`🤖 ${bot.name} gained ${xpGain} XP (expected slow rate)`);
            });

        }, 30000); // Every 30 seconds
    }

    setupRoutes() {
        this.app.use(express.json());

        this.app.get('/', (req, res) => {
            res.sendFile(__dirname + '/master-unified-white-hat-system.html');
        });

        this.app.get('/api/shadow-status', (req, res) => {
            res.json({
                unified_window_active: this.shadowState.unified_window_active,
                connected_services: Array.from(this.shadowState.connected_services.entries()),
                xml_mapping_complete: this.shadowState.xml_mapping_complete,
                authentication_status: this.shadowState.authentication_status,
                threat_level: this.shadowState.threat_level,
                active_players: this.shadowState.active_players,
                detected_bots: this.shadowState.detected_bots
            });
        });

        this.app.get('/api/leaderboards', (req, res) => {
            res.json(Object.fromEntries(this.shadowState.leaderboard_data));
        });

        this.app.get('/api/security-alerts', (req, res) => {
            res.json(this.shadowState.security_alerts);
        });

        this.app.post('/api/activate-unified-window', (req, res) => {
            this.shadowState.unified_window_active = true;
            this.addSecurityAlert('🖥️ Unified white-hat interface activated');
            
            res.json({
                status: 'activated',
                message: 'Unified window coordination active'
            });
        });
    }

    setupWebSocket() {
        this.wss.on('connection', (ws) => {
            console.log('🌟 New unified window client connected');
            
            // Send initial state
            ws.send(JSON.stringify({
                type: 'shadow_coordinator_connected',
                initial_state: {
                    authentication_status: this.shadowState.authentication_status,
                    threat_level: this.shadowState.threat_level,
                    active_players: this.shadowState.active_players,
                    detected_bots: this.shadowState.detected_bots,
                    xml_mapping_complete: this.shadowState.xml_mapping_complete,
                    connected_services: Array.from(this.shadowState.connected_services.keys())
                }
            }));

            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleUnifiedWindowMessage(ws, data);
                } catch (e) {
                    console.log('Invalid WebSocket message:', e);
                }
            });
        });
    }

    handleUnifiedWindowMessage(ws, data) {
        switch (data.type) {
            case 'request_leaderboard_update':
                ws.send(JSON.stringify({
                    type: 'leaderboard_data',
                    leaderboards: Object.fromEntries(this.shadowState.leaderboard_data)
                }));
                break;
                
            case 'request_security_status':
                ws.send(JSON.stringify({
                    type: 'security_status',
                    alerts: this.shadowState.security_alerts,
                    threat_level: this.shadowState.threat_level,
                    authentication_status: this.shadowState.authentication_status
                }));
                break;
        }
    }

    broadcastToUnifiedClients(data) {
        const message = JSON.stringify(data);
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }

    start() {
        this.server.listen(this.port, () => {
            console.log(`🌟 XML Shadow Coordinator: http://localhost:${this.port}`);
            console.log('🛡️ Ultimate White-Hat AI Security System Ready');
            console.log('🎮 Game layer, security layer, and AI layer all coordinated');
            console.log(`🏆 Leaderboards active with ${this.shadowState.reasoning_bots} reasoning test bots`);
        });
    }
}

// Start the shadow coordination system
const coordinator = new XMLShadowCoordinator();
coordinator.start();

module.exports = XMLShadowCoordinator;