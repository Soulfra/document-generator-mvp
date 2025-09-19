#!/usr/bin/env node

/**
 * 🎭 MULTI-PROTOCOL BROADCAST ORCHESTRATOR
 * Coordinates all broadcast systems: Solidity events → Rust engine → Flask API → External services
 */

const { ethers } = require('ethers');
const WebSocket = require('ws');
const axios = require('axios');
const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

// ANSI colors for beautiful console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    const timestamp = new Date().toISOString();
    console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

class BroadcastOrchestrator extends EventEmitter {
    constructor(config) {
        super();
        this.config = {
            blockchain: {
                rpc: config.blockchain?.rpc || 'ws://127.0.0.1:8545',
                blameChainContract: config.blockchain?.blameChainContract || '0x0000000000000000000000000000000000000003',
                broadcasterContract: config.blockchain?.broadcasterContract || '0x0000000000000000000000000000000000000004'
            },
            services: {
                rustEngine: config.services?.rustEngine || 'http://localhost:8080',
                flaskApi: config.services?.flaskApi || 'http://localhost:5002'
            },
            external: {
                discord: config.external?.discord || [],
                slack: config.external?.slack || [],
                telegram: config.external?.telegram || null,
                github: config.external?.github || null,
                email: config.external?.email || null
            },
            features: {
                autoRelay: config.features?.autoRelay !== false,
                eventFiltering: config.features?.eventFiltering !== false,
                rateLimiting: config.features?.rateLimiting !== false,
                persistence: config.features?.persistence !== false
            }
        };

        this.connections = {
            blockchain: null,
            rustEngine: null,
            flaskApi: null
        };

        this.metrics = {
            totalEvents: 0,
            broadcastsSent: 0,
            broadcastsFailed: 0,
            connectionsActive: 0,
            uptime: Date.now()
        };

        this.eventBuffer = [];
        this.rateLimit = new Map(); // For rate limiting per channel
        
        log('🎭 Broadcast Orchestrator initialized', 'cyan');
    }

    /**
     * Start the orchestrator and connect to all services
     */
    async start() {
        log('🚀 Starting Broadcast Orchestrator...', 'bright');

        try {
            // Connect to blockchain
            await this.connectBlockchain();
            
            // Connect to services
            await this.connectServices();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Start background tasks
            this.startBackgroundTasks();
            
            log('✅ Broadcast Orchestrator fully operational!', 'green');
            
            // Emit startup event
            this.emit('orchestrator:started', {
                timestamp: new Date(),
                config: this.config,
                connections: Object.keys(this.connections).filter(k => this.connections[k])
            });

            return true;
        } catch (error) {
            log(`❌ Failed to start orchestrator: ${error.message}`, 'red');
            throw error;
        }
    }

    /**
     * Connect to blockchain and listen for events
     */
    async connectBlockchain() {
        try {
            log('🔗 Connecting to blockchain...', 'yellow');

            // Connect via WebSocket for real-time events
            const provider = new ethers.providers.WebSocketProvider(this.config.blockchain.rpc);
            
            // Test connection
            const network = await provider.getNetwork();
            log(`✅ Connected to blockchain: Chain ID ${network.chainId}`, 'green');

            // Setup contract listeners if contracts are deployed
            if (this.config.blockchain.blameChainContract !== '0x0000000000000000000000000000000000000003') {
                await this.setupContractListeners(provider);
            } else {
                log('⚠️ Using mock contract addresses - will simulate events', 'yellow');
                this.simulateBlockchainEvents();
            }

            this.connections.blockchain = provider;
            this.metrics.connectionsActive++;

        } catch (error) {
            log(`❌ Blockchain connection failed: ${error.message}`, 'red');
            // Continue without blockchain - use simulation mode
            this.simulateBlockchainEvents();
        }
    }

    /**
     * Setup contract event listeners
     */
    async setupContractListeners(provider) {
        log('📡 Setting up contract event listeners...', 'yellow');

        // BlameChain contract events
        const blameChainAbi = [
            "event BlameAssigned(uint256 indexed blameId, address indexed initiator, address[] blamedParties, string component, string action, uint256 severity)",
            "event DeveloperSuspended(address indexed developer, uint256 reputation, string reason)",
            "event SystemSuspended(string indexed system, string reason, uint256 timestamp)"
        ];

        const blameChainContract = new ethers.Contract(
            this.config.blockchain.blameChainContract,
            blameChainAbi,
            provider
        );

        // Listen for blame events
        blameChainContract.on('BlameAssigned', (blameId, initiator, blamedParties, component, action, severity, event) => {
            const blameEvent = {
                type: 'blame_assigned',
                blameId: blameId.toString(),
                initiator,
                blamedParties,
                component,
                action,
                severity: severity.toNumber(),
                blockNumber: event.blockNumber,
                transactionHash: event.transactionHash,
                timestamp: new Date()
            };

            log(`🚨 Blame event detected: ID ${blameId} | Severity ${severity} | Component: ${component}`, 'red');
            this.processEvent(blameEvent);
        });

        // Listen for suspension events
        blameChainContract.on('DeveloperSuspended', (developer, reputation, reason, event) => {
            const suspensionEvent = {
                type: 'developer_suspended',
                developer,
                reputation: reputation.toNumber(),
                reason,
                blockNumber: event.blockNumber,
                transactionHash: event.transactionHash,
                timestamp: new Date()
            };

            log(`⛔ Developer suspended: ${developer} | Reputation: ${reputation}`, 'red');
            this.processEvent(suspensionEvent);
        });

        log('✅ Contract listeners setup complete', 'green');
    }

    /**
     * Simulate blockchain events for demo purposes
     */
    simulateBlockchainEvents() {
        log('🎭 Starting blockchain event simulation...', 'yellow');

        const eventTypes = [
            {
                type: 'blame_assigned',
                weight: 0.7,
                generator: () => ({
                    type: 'blame_assigned',
                    blameId: Math.floor(Math.random() * 10000).toString(),
                    initiator: `0x${Math.random().toString(16).substring(2, 42)}`,
                    blamedParties: [`0x${Math.random().toString(16).substring(2, 42)}`],
                    component: ['frontend', 'backend', 'database', 'smart_contract', 'api'][Math.floor(Math.random() * 5)],
                    action: ['bug_introduced', 'security_breach', 'performance_degradation', 'deployment_failure'][Math.floor(Math.random() * 4)],
                    severity: Math.floor(Math.random() * 10) + 1,
                    blockNumber: Math.floor(Math.random() * 1000000),
                    transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`,
                    timestamp: new Date()
                })
            },
            {
                type: 'developer_suspended',
                weight: 0.2,
                generator: () => ({
                    type: 'developer_suspended',
                    developer: `0x${Math.random().toString(16).substring(2, 42)}`,
                    reputation: Math.floor(Math.random() * 500),
                    reason: ['Low reputation score', 'Multiple blame assignments', 'Security violations'][Math.floor(Math.random() * 3)],
                    blockNumber: Math.floor(Math.random() * 1000000),
                    transactionHash: `0x${Math.random().toString(16).substring(2, 66)}`,
                    timestamp: new Date()
                })
            },
            {
                type: 'system_alert',
                weight: 0.1,
                generator: () => ({
                    type: 'system_alert',
                    system: ['BlameChain', 'MetaverseRegistry', 'DuoTracker'][Math.floor(Math.random() * 3)],
                    alertType: ['overload', 'failure', 'maintenance', 'upgrade'][Math.floor(Math.random() * 4)],
                    severity: Math.floor(Math.random() * 10) + 1,
                    message: 'System alert generated for demonstration purposes',
                    timestamp: new Date()
                })
            }
        ];

        // Generate events at random intervals
        const generateEvent = () => {
            const rand = Math.random();
            let cumulativeWeight = 0;
            
            for (const eventType of eventTypes) {
                cumulativeWeight += eventType.weight;
                if (rand <= cumulativeWeight) {
                    const event = eventType.generator();
                    this.processEvent(event);
                    break;
                }
            }

            // Schedule next event (every 5-30 seconds)
            setTimeout(generateEvent, (Math.random() * 25000) + 5000);
        };

        // Start generating events
        setTimeout(generateEvent, 2000);
    }

    /**
     * Connect to internal services (Rust engine, Flask API)
     */
    async connectServices() {
        log('🔧 Connecting to internal services...', 'yellow');

        // Test Rust engine connection
        try {
            const rustResponse = await axios.get(`${this.config.services.rustEngine}/health`);
            log('✅ Rust engine connected', 'green');
            this.connections.rustEngine = true;
            this.metrics.connectionsActive++;
        } catch (error) {
            log('⚠️ Rust engine not available', 'yellow');
        }

        // Test Flask API connection
        try {
            const flaskResponse = await axios.get(`${this.config.services.flaskApi}/api/health`);
            log('✅ Flask API connected', 'green');
            this.connections.flaskApi = true;
            this.metrics.connectionsActive++;
        } catch (error) {
            log('⚠️ Flask API not available', 'yellow');
        }
    }

    /**
     * Process incoming blockchain events
     */
    async processEvent(event) {
        this.metrics.totalEvents++;
        
        log(`📨 Processing event: ${event.type} | Severity: ${event.severity || 'N/A'}`, 'cyan');

        // Add to event buffer
        this.eventBuffer.push({
            ...event,
            id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
            processed: false
        });

        // Determine broadcast channels based on event type and severity
        const channels = this.determineBroadcastChannels(event);
        
        // Send to appropriate channels
        for (const channel of channels) {
            await this.broadcastToChannel(event, channel);
        }

        // Store event if persistence is enabled
        if (this.config.features.persistence) {
            this.persistEvent(event);
        }

        // Emit processed event
        this.emit('event:processed', event);
    }

    /**
     * Determine which channels to broadcast to based on event properties
     */
    determineBroadcastChannels(event) {
        const channels = ['websocket']; // Always broadcast via WebSocket
        
        const severity = event.severity || 1;
        
        // High severity events go to more channels
        if (severity >= 7) {
            channels.push('discord', 'slack', 'email');
        } else if (severity >= 5) {
            channels.push('slack');
        }

        // Specific event types
        if (event.type === 'developer_suspended') {
            channels.push('email', 'slack');
        }

        if (event.type === 'system_alert' && severity >= 8) {
            channels.push('discord', 'slack', 'email', 'telegram');
        }

        return [...new Set(channels)]; // Remove duplicates
    }

    /**
     * Broadcast event to specific channel
     */
    async broadcastToChannel(event, channel) {
        if (this.config.features.rateLimiting && this.isRateLimited(channel)) {
            log(`⏰ Rate limited: ${channel}`, 'yellow');
            return;
        }

        try {
            const message = this.formatEventMessage(event, channel);
            
            switch (channel) {
                case 'websocket':
                    await this.broadcastWebSocket(event, message);
                    break;
                case 'discord':
                    await this.broadcastDiscord(event, message);
                    break;
                case 'slack':
                    await this.broadcastSlack(event, message);
                    break;
                case 'email':
                    await this.broadcastEmail(event, message);
                    break;
                case 'telegram':
                    await this.broadcastTelegram(event, message);
                    break;
                case 'http_webhook':
                    await this.broadcastWebhook(event, message);
                    break;
                default:
                    log(`⚠️ Unknown channel: ${channel}`, 'yellow');
            }

            this.metrics.broadcastsSent++;
            this.updateRateLimit(channel);
            
        } catch (error) {
            log(`❌ Broadcast failed for ${channel}: ${error.message}`, 'red');
            this.metrics.broadcastsFailed++;
        }
    }

    /**
     * Format event message for specific channel
     */
    formatEventMessage(event, channel) {
        const severityEmoji = {
            1: 'ℹ️', 2: 'ℹ️', 3: '⚠️', 4: '⚠️', 5: '🚨',
            6: '🚨', 7: '🔥', 8: '🔥', 9: '💥', 10: '💥'
        };

        const emoji = severityEmoji[event.severity] || '📢';
        
        switch (event.type) {
            case 'blame_assigned':
                return `${emoji} **BLAME ALERT #${event.blameId}**\n` +
                       `Developer: \`${event.blamedParties[0]}\`\n` +
                       `Component: \`${event.component}\`\n` +
                       `Action: \`${event.action}\`\n` +
                       `Severity: **${event.severity}/10**\n` +
                       `Time: ${event.timestamp.toISOString()}`;

            case 'developer_suspended':
                return `⛔ **DEVELOPER SUSPENDED**\n` +
                       `Address: \`${event.developer}\`\n` +
                       `Reputation: **${event.reputation}**\n` +
                       `Reason: ${event.reason}\n` +
                       `Time: ${event.timestamp.toISOString()}`;

            case 'system_alert':
                return `${emoji} **SYSTEM ALERT**\n` +
                       `System: \`${event.system}\`\n` +
                       `Type: \`${event.alertType}\`\n` +
                       `Severity: **${event.severity}/10**\n` +
                       `Message: ${event.message}\n` +
                       `Time: ${event.timestamp.toISOString()}`;

            default:
                return `📨 **EVENT**: ${event.type}\n` +
                       `Details: ${JSON.stringify(event, null, 2)}`;
        }
    }

    /**
     * Broadcast via WebSocket (through Flask API)
     */
    async broadcastWebSocket(event, message) {
        if (!this.connections.flaskApi) return;

        try {
            await axios.post(`${this.config.services.flaskApi}/api/broadcast`, {
                message: message,
                channels: ['websocket'],
                priority: event.severity || 3,
                metadata: {
                    event_type: event.type,
                    event_id: event.id,
                    severity: event.severity,
                    room: 'broadcast'
                }
            });

            log(`📡 WebSocket broadcast sent: ${event.type}`, 'green');
        } catch (error) {
            throw new Error(`WebSocket broadcast failed: ${error.message}`);
        }
    }

    /**
     * Broadcast to Discord
     */
    async broadcastDiscord(event, message) {
        const webhooks = this.config.external.discord;
        if (!webhooks || webhooks.length === 0) return;

        for (const webhook of webhooks) {
            try {
                const embed = {
                    title: `BlameChain Alert: ${event.type}`,
                    description: message,
                    color: Math.min((event.severity || 1) * 1000000, 16777215),
                    timestamp: event.timestamp.toISOString(),
                    fields: [
                        {
                            name: "Event ID",
                            value: event.id || "N/A",
                            inline: true
                        },
                        {
                            name: "Severity",
                            value: `${event.severity || 1}/10`,
                            inline: true
                        }
                    ]
                };

                await axios.post(webhook, {
                    embeds: [embed],
                    username: "BlameChain Bot"
                });

                log(`🎮 Discord broadcast sent: ${event.type}`, 'green');
            } catch (error) {
                throw new Error(`Discord broadcast failed: ${error.message}`);
            }
        }
    }

    /**
     * Broadcast to Slack
     */
    async broadcastSlack(event, message) {
        const webhooks = this.config.external.slack;
        if (!webhooks || webhooks.length === 0) return;

        for (const webhook of webhooks) {
            try {
                const attachment = {
                    color: event.severity >= 7 ? "danger" : event.severity >= 5 ? "warning" : "good",
                    title: `BlameChain Alert: ${event.type}`,
                    text: message,
                    fields: [
                        {
                            title: "Severity",
                            value: `${event.severity || 1}/10`,
                            short: true
                        },
                        {
                            title: "Time",
                            value: event.timestamp.toISOString(),
                            short: true
                        }
                    ],
                    footer: "BlameChain Orchestrator",
                    ts: Math.floor(event.timestamp.getTime() / 1000)
                };

                await axios.post(webhook, {
                    attachments: [attachment]
                });

                log(`💬 Slack broadcast sent: ${event.type}`, 'green');
            } catch (error) {
                throw new Error(`Slack broadcast failed: ${error.message}`);
            }
        }
    }

    /**
     * Broadcast via Email (placeholder)
     */
    async broadcastEmail(event, message) {
        log(`📧 Email broadcast (simulated): ${event.type}`, 'yellow');
        // Would implement actual email sending here
    }

    /**
     * Broadcast via Telegram (placeholder)
     */
    async broadcastTelegram(event, message) {
        log(`📱 Telegram broadcast (simulated): ${event.type}`, 'yellow');
        // Would implement actual Telegram bot sending here
    }

    /**
     * Broadcast via HTTP webhook
     */
    async broadcastWebhook(event, message) {
        log(`📬 HTTP webhook broadcast (simulated): ${event.type}`, 'yellow');
        // Would implement actual webhook sending here
    }

    /**
     * Rate limiting logic
     */
    isRateLimited(channel) {
        if (!this.config.features.rateLimiting) return false;

        const now = Date.now();
        const limit = this.rateLimit.get(channel);
        
        if (!limit) return false;
        
        // 1 message per 5 seconds per channel
        return (now - limit.lastSent) < 5000;
    }

    updateRateLimit(channel) {
        this.rateLimit.set(channel, {
            lastSent: Date.now(),
            count: (this.rateLimit.get(channel)?.count || 0) + 1
        });
    }

    /**
     * Persist event to file (simple JSON storage)
     */
    persistEvent(event) {
        try {
            const eventFile = path.join(__dirname, 'broadcast-events.jsonl');
            const eventLine = JSON.stringify({
                ...event,
                persisted_at: new Date().toISOString()
            }) + '\n';
            
            fs.appendFileSync(eventFile, eventLine);
        } catch (error) {
            log(`⚠️ Failed to persist event: ${error.message}`, 'yellow');
        }
    }

    /**
     * Setup general event listeners
     */
    setupEventListeners() {
        this.on('event:processed', (event) => {
            log(`✅ Event processed: ${event.type} | ID: ${event.id}`, 'green');
        });

        this.on('broadcast:sent', (channel, event) => {
            log(`📤 Broadcast sent: ${channel} | Event: ${event.type}`, 'blue');
        });

        // Graceful shutdown
        process.on('SIGINT', () => {
            log('🛑 Shutting down orchestrator...', 'yellow');
            this.shutdown();
        });
    }

    /**
     * Start background tasks
     */
    startBackgroundTasks() {
        // Metrics reporting every 30 seconds
        setInterval(() => {
            const uptimeMinutes = Math.floor((Date.now() - this.metrics.uptime) / 1000 / 60);
            log(`📊 Metrics: ${this.metrics.totalEvents} events | ${this.metrics.broadcastsSent} sent | ${this.metrics.broadcastsFailed} failed | ${uptimeMinutes}m uptime`, 'magenta');
        }, 30000);

        // Cleanup old events from buffer every 5 minutes
        setInterval(() => {
            const oldLength = this.eventBuffer.length;
            this.eventBuffer = this.eventBuffer.slice(-1000); // Keep last 1000 events
            if (oldLength > 1000) {
                log(`🧹 Cleaned event buffer: ${oldLength - 1000} events removed`, 'yellow');
            }
        }, 300000);
    }

    /**
     * Get current status and metrics
     */
    getStatus() {
        return {
            status: 'operational',
            uptime: Date.now() - this.metrics.uptime,
            metrics: this.metrics,
            connections: this.connections,
            eventBuffer: {
                length: this.eventBuffer.length,
                recent: this.eventBuffer.slice(-5)
            },
            config: {
                ...this.config,
                external: Object.keys(this.config.external).reduce((acc, key) => {
                    acc[key] = this.config.external[key] ? 'configured' : 'not configured';
                    return acc;
                }, {})
            }
        };
    }

    /**
     * Shutdown orchestrator gracefully
     */
    async shutdown() {
        log('🔄 Graceful shutdown initiated...', 'yellow');
        
        // Close blockchain connection
        if (this.connections.blockchain && this.connections.blockchain.removeAllListeners) {
            this.connections.blockchain.removeAllListeners();
        }

        // Save final metrics
        if (this.config.features.persistence) {
            const status = this.getStatus();
            fs.writeFileSync(
                path.join(__dirname, 'orchestrator-final-status.json'),
                JSON.stringify(status, null, 2)
            );
        }

        log('✅ Orchestrator shutdown complete', 'green');
        process.exit(0);
    }
}

// Configuration
const config = {
    blockchain: {
        rpc: process.env.BLOCKCHAIN_RPC || 'ws://127.0.0.1:8545',
        blameChainContract: process.env.BLAMECHAIN_CONTRACT || '0x0000000000000000000000000000000000000003',
        broadcasterContract: process.env.BROADCASTER_CONTRACT || '0x0000000000000000000000000000000000000004'
    },
    services: {
        rustEngine: process.env.RUST_ENGINE_URL || 'http://localhost:8080',
        flaskApi: process.env.FLASK_API_URL || 'http://localhost:5002'
    },
    external: {
        discord: process.env.DISCORD_WEBHOOKS ? process.env.DISCORD_WEBHOOKS.split(',') : [],
        slack: process.env.SLACK_WEBHOOKS ? process.env.SLACK_WEBHOOKS.split(',') : [],
        telegram: process.env.TELEGRAM_BOT_TOKEN || null,
        github: process.env.GITHUB_WEBHOOK || null,
        email: process.env.EMAIL_CONFIG ? JSON.parse(process.env.EMAIL_CONFIG) : null
    },
    features: {
        autoRelay: true,
        eventFiltering: true,
        rateLimiting: true,
        persistence: true
    }
};

// Main execution
async function main() {
    log('🎭 Starting Multi-Protocol Broadcast Orchestrator...', 'bright');
    
    const orchestrator = new BroadcastOrchestrator(config);
    
    // Setup API endpoint for status
    const express = require('express');
    const app = express();
    
    app.get('/status', (req, res) => {
        res.json(orchestrator.getStatus());
    });
    
    app.get('/metrics', (req, res) => {
        res.json(orchestrator.metrics);
    });
    
    app.listen(3001, () => {
        log('📊 Status API listening on http://localhost:3001', 'blue');
    });
    
    // Start orchestrator
    await orchestrator.start();
    
    // Keep alive
    process.on('SIGTERM', () => orchestrator.shutdown());
    process.on('SIGINT', () => orchestrator.shutdown());
}

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        log(`💥 Fatal error: ${error.message}`, 'red');
        console.error(error);
        process.exit(1);
    });
}

module.exports = { BroadcastOrchestrator };