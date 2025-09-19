#!/usr/bin/env node

/**
 * 🔍 GAME VERIFICATION SERVICE
 * 
 * Monitors game health, validates AI behavior, tracks performance,
 * and ensures everything is actually working (not fake!)
 */

const EventEmitter = require('events');
const WebSocket = require('ws');
const GamePersistenceService = require('./game-persistence-service');

class GameVerificationService extends EventEmitter {
    constructor(config = {}) {
        super();
        
        // Configuration
        this.config = {
            monitoringPort: config.monitoringPort || 9102,
            checkInterval: config.checkInterval || 5000, // 5 seconds
            alertThresholds: {
                fps: 30,
                aiResponseTime: 1000, // ms
                chunkLoadTime: 500, // ms
                memoryUsage: 80, // percent
                errorRate: 0.05 // 5%
            },
            ...config
        };
        
        // Services
        this.persistence = new GamePersistenceService(config);
        
        // Monitoring data
        this.metrics = {
            startTime: Date.now(),
            totalPlayers: 0,
            activePlayers: 0,
            totalAIAgents: 0,
            activeAIAgents: 0,
            totalChunks: 0,
            loadedChunks: 0,
            totalBlocks: 0,
            modifiedBlocks: 0,
            fps: [],
            aiActions: [],
            errors: [],
            performance: {
                cpu: 0,
                memory: 0,
                networkLatency: 0
            }
        };
        
        // Verification results
        this.verificationResults = {
            lastCheck: null,
            gameRunning: false,
            databaseConnected: false,
            aiSystemActive: false,
            physicsEngineActive: false,
            multiplayerActive: false,
            issues: []
        };
        
        // WebSocket for real-time monitoring
        this.wss = null;
        this.connectedClients = new Set();
        
        // Monitoring intervals
        this.monitoringInterval = null;
        this.verificationInterval = null;
    }
    
    /**
     * Initialize verification service
     */
    async init() {
        console.log('🔍 Initializing Game Verification Service...');
        
        try {
            // Initialize persistence service
            await this.persistence.init();
            this.verificationResults.databaseConnected = true;
            
            // Setup WebSocket server
            this.setupWebSocketServer();
            
            // Start monitoring
            this.startMonitoring();
            
            // Start verification checks
            this.startVerificationChecks();
            
            console.log('✅ Game Verification Service initialized');
            
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize verification service:', error);
            this.verificationResults.issues.push({
                type: 'initialization',
                message: error.message,
                timestamp: new Date()
            });
            throw error;
        }
    }
    
    /**
     * Setup WebSocket server for real-time monitoring
     */
    setupWebSocketServer() {
        this.wss = new WebSocket.Server({ 
            port: this.config.monitoringPort 
        });
        
        this.wss.on('connection', (ws) => {
            console.log('📊 Monitoring client connected');
            this.connectedClients.add(ws);
            
            // Send initial state
            ws.send(JSON.stringify({
                type: 'initial-state',
                metrics: this.metrics,
                verification: this.verificationResults
            }));
            
            ws.on('close', () => {
                this.connectedClients.delete(ws);
                console.log('📊 Monitoring client disconnected');
            });
            
            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
            });
        });
        
        console.log(`📊 Monitoring WebSocket server running on port ${this.config.monitoringPort}`);
    }
    
    /**
     * Start monitoring game metrics
     */
    startMonitoring() {
        this.monitoringInterval = setInterval(() => {
            this.collectMetrics();
        }, 1000); // Collect every second
        
        console.log('📊 Started game monitoring');
    }
    
    /**
     * Start verification checks
     */
    startVerificationChecks() {
        this.verificationInterval = setInterval(async () => {
            await this.performVerificationCheck();
        }, this.config.checkInterval);
        
        console.log('🔍 Started verification checks');
    }
    
    /**
     * Collect game metrics
     */
    async collectMetrics() {
        try {
            // Get active game stats from database
            const gameStats = await this.persistence.getActiveGameStats();
            
            if (gameStats.length > 0) {
                const totalStats = gameStats.reduce((acc, stat) => ({
                    players: acc.players + (stat.player_count || 0),
                    agents: acc.agents + (stat.ai_agent_count || 0),
                    chunks: acc.chunks + (stat.loaded_chunks || 0),
                    structures: acc.structures + (stat.structure_count || 0)
                }), { players: 0, agents: 0, chunks: 0, structures: 0 });
                
                this.metrics.activePlayers = totalStats.players;
                this.metrics.activeAIAgents = totalStats.agents;
                this.metrics.loadedChunks = totalStats.chunks;
            }
            
            // Get AI behavior summary
            const aiBehavior = await this.persistence.getAIBehaviorSummary();
            this.metrics.aiActions = aiBehavior.map(agent => ({
                name: agent.agent_name,
                personality: agent.personality,
                behavior: agent.current_behavior,
                actionCount: agent.total_actions,
                conversations: agent.conversation_count,
                health: agent.health,
                energy: agent.energy,
                lastUpdate: agent.last_updated
            }));
            
            // Broadcast metrics to connected clients
            this.broadcastMetrics();
            
        } catch (error) {
            console.error('Error collecting metrics:', error);
            this.metrics.errors.push({
                type: 'metric-collection',
                message: error.message,
                timestamp: new Date()
            });
        }
    }
    
    /**
     * Perform comprehensive verification check
     */
    async performVerificationCheck() {
        console.log('🔍 Performing verification check...');
        
        const results = {
            timestamp: new Date(),
            checks: []
        };
        
        // Check 1: Database connectivity
        const dbCheck = await this.verifyDatabaseConnection();
        results.checks.push(dbCheck);
        
        // Check 2: Game engine status
        const engineCheck = await this.verifyGameEngine();
        results.checks.push(engineCheck);
        
        // Check 3: AI system status
        const aiCheck = await this.verifyAISystem();
        results.checks.push(aiCheck);
        
        // Check 4: Physics engine
        const physicsCheck = await this.verifyPhysicsEngine();
        results.checks.push(physicsCheck);
        
        // Check 5: World persistence
        const persistenceCheck = await this.verifyWorldPersistence();
        results.checks.push(persistenceCheck);
        
        // Check 6: Performance metrics
        const performanceCheck = await this.verifyPerformance();
        results.checks.push(performanceCheck);
        
        // Update verification results
        this.updateVerificationResults(results);
        
        // Log results
        this.logVerificationResults(results);
        
        // Alert if issues found
        this.checkForAlerts(results);
        
        return results;
    }
    
    /**
     * Verify database connection
     */
    async verifyDatabaseConnection() {
        const check = {
            name: 'Database Connection',
            status: 'unknown',
            details: {}
        };
        
        try {
            const client = await this.persistence.pool.connect();
            const result = await client.query('SELECT COUNT(*) FROM game_sessions');
            client.release();
            
            check.status = 'healthy';
            check.details = {
                connected: true,
                sessionCount: parseInt(result.rows[0].count),
                poolSize: this.persistence.pool.totalCount,
                idleConnections: this.persistence.pool.idleCount
            };
        } catch (error) {
            check.status = 'unhealthy';
            check.details = {
                connected: false,
                error: error.message
            };
        }
        
        return check;
    }
    
    /**
     * Verify game engine status
     */
    async verifyGameEngine() {
        const check = {
            name: 'Game Engine',
            status: 'unknown',
            details: {}
        };
        
        try {
            // Check if any active game sessions exist
            const activeSessions = await this.persistence.getActiveGameStats();
            
            if (activeSessions.length > 0) {
                check.status = 'healthy';
                check.details = {
                    running: true,
                    activeSessions: activeSessions.length,
                    totalPlayers: activeSessions.reduce((sum, s) => sum + s.player_count, 0),
                    totalChunks: activeSessions.reduce((sum, s) => sum + s.loaded_chunks, 0)
                };
            } else {
                check.status = 'idle';
                check.details = {
                    running: false,
                    message: 'No active game sessions'
                };
            }
        } catch (error) {
            check.status = 'unhealthy';
            check.details = {
                running: false,
                error: error.message
            };
        }
        
        return check;
    }
    
    /**
     * Verify AI system
     */
    async verifyAISystem() {
        const check = {
            name: 'AI System',
            status: 'unknown',
            details: {}
        };
        
        try {
            const aiBehavior = await this.persistence.getAIBehaviorSummary();
            
            if (aiBehavior.length > 0) {
                // Check if agents are active (updated recently)
                const recentlyActive = aiBehavior.filter(agent => {
                    const lastUpdate = new Date(agent.last_updated);
                    const minutesAgo = (Date.now() - lastUpdate) / 1000 / 60;
                    return minutesAgo < 5; // Active in last 5 minutes
                });
                
                check.status = recentlyActive.length > 0 ? 'healthy' : 'warning';
                check.details = {
                    totalAgents: aiBehavior.length,
                    activeAgents: recentlyActive.length,
                    behaviors: aiBehavior.map(a => ({
                        name: a.agent_name,
                        behavior: a.current_behavior,
                        actions: a.total_actions
                    }))
                };
            } else {
                check.status = 'idle';
                check.details = {
                    message: 'No AI agents found'
                };
            }
        } catch (error) {
            check.status = 'unhealthy';
            check.details = {
                error: error.message
            };
        }
        
        return check;
    }
    
    /**
     * Verify physics engine
     */
    async verifyPhysicsEngine() {
        const check = {
            name: 'Physics Engine',
            status: 'unknown',
            details: {}
        };
        
        try {
            // Check recent block modifications (indicates physics interactions)
            const client = await this.persistence.pool.connect();
            const result = await client.query(`
                SELECT COUNT(*) as count, 
                       MAX(timestamp) as last_modification
                FROM block_modifications
                WHERE timestamp > NOW() - INTERVAL '5 minutes'
            `);
            client.release();
            
            const modCount = parseInt(result.rows[0].count);
            const lastMod = result.rows[0].last_modification;
            
            if (modCount > 0) {
                check.status = 'healthy';
                check.details = {
                    active: true,
                    recentModifications: modCount,
                    lastActivity: lastMod
                };
            } else {
                check.status = 'idle';
                check.details = {
                    active: false,
                    message: 'No recent physics interactions'
                };
            }
        } catch (error) {
            check.status = 'unhealthy';
            check.details = {
                error: error.message
            };
        }
        
        return check;
    }
    
    /**
     * Verify world persistence
     */
    async verifyWorldPersistence() {
        const check = {
            name: 'World Persistence',
            status: 'unknown',
            details: {}
        };
        
        try {
            const client = await this.persistence.pool.connect();
            
            // Check chunk saves
            const chunkResult = await client.query(`
                SELECT COUNT(*) as total_chunks,
                       COUNT(DISTINCT session_id) as sessions_with_chunks,
                       MAX(last_modified) as last_save
                FROM world_chunks
            `);
            
            // Check player progress saves
            const progressResult = await client.query(`
                SELECT COUNT(*) as total_saves,
                       MAX(updated_at) as last_update
                FROM player_progress
                WHERE updated_at > NOW() - INTERVAL '1 hour'
            `);
            
            client.release();
            
            const totalChunks = parseInt(chunkResult.rows[0].total_chunks);
            const recentSaves = parseInt(progressResult.rows[0].total_saves);
            
            if (totalChunks > 0 || recentSaves > 0) {
                check.status = 'healthy';
                check.details = {
                    chunksStored: totalChunks,
                    recentPlayerSaves: recentSaves,
                    lastChunkSave: chunkResult.rows[0].last_save,
                    lastProgressSave: progressResult.rows[0].last_update
                };
            } else {
                check.status = 'warning';
                check.details = {
                    message: 'No recent persistence activity'
                };
            }
        } catch (error) {
            check.status = 'unhealthy';
            check.details = {
                error: error.message
            };
        }
        
        return check;
    }
    
    /**
     * Verify performance metrics
     */
    async verifyPerformance() {
        const check = {
            name: 'Performance',
            status: 'unknown',
            details: {}
        };
        
        try {
            // Get recent performance metrics
            const client = await this.persistence.pool.connect();
            const result = await client.query(`
                SELECT metric_type, AVG(value) as avg_value, COUNT(*) as count
                FROM performance_metrics
                WHERE timestamp > NOW() - INTERVAL '5 minutes'
                GROUP BY metric_type
            `);
            client.release();
            
            const metrics = {};
            result.rows.forEach(row => {
                metrics[row.metric_type] = {
                    average: parseFloat(row.avg_value),
                    sampleCount: parseInt(row.count)
                };
            });
            
            // Check FPS if available
            if (metrics.fps) {
                const avgFps = metrics.fps.average;
                if (avgFps < this.config.alertThresholds.fps) {
                    check.status = 'warning';
                    check.details.lowFps = true;
                } else {
                    check.status = 'healthy';
                }
            } else {
                check.status = 'unknown';
            }
            
            check.details.metrics = metrics;
            
        } catch (error) {
            check.status = 'unhealthy';
            check.details = {
                error: error.message
            };
        }
        
        return check;
    }
    
    /**
     * Update verification results
     */
    updateVerificationResults(results) {
        this.verificationResults.lastCheck = results.timestamp;
        this.verificationResults.issues = [];
        
        // Reset all flags
        this.verificationResults.gameRunning = false;
        this.verificationResults.databaseConnected = false;
        this.verificationResults.aiSystemActive = false;
        this.verificationResults.physicsEngineActive = false;
        
        // Update based on check results
        results.checks.forEach(check => {
            if (check.name === 'Database Connection' && check.status === 'healthy') {
                this.verificationResults.databaseConnected = true;
            }
            if (check.name === 'Game Engine' && check.status === 'healthy') {
                this.verificationResults.gameRunning = true;
            }
            if (check.name === 'AI System' && check.status === 'healthy') {
                this.verificationResults.aiSystemActive = true;
            }
            if (check.name === 'Physics Engine' && check.status === 'healthy') {
                this.verificationResults.physicsEngineActive = true;
            }
            
            // Collect issues
            if (check.status === 'unhealthy' || check.status === 'warning') {
                this.verificationResults.issues.push({
                    check: check.name,
                    status: check.status,
                    details: check.details,
                    timestamp: results.timestamp
                });
            }
        });
        
        // Broadcast updated results
        this.broadcastVerification();
    }
    
    /**
     * Log verification results
     */
    logVerificationResults(results) {
        console.log('\n📋 VERIFICATION RESULTS:');
        console.log('========================');
        
        results.checks.forEach(check => {
            const statusEmoji = {
                healthy: '✅',
                warning: '⚠️',
                unhealthy: '❌',
                idle: '💤',
                unknown: '❓'
            }[check.status] || '❓';
            
            console.log(`${statusEmoji} ${check.name}: ${check.status.toUpperCase()}`);
            
            if (check.status === 'unhealthy' || check.status === 'warning') {
                console.log(`   Details:`, check.details);
            }
        });
        
        console.log('========================\n');
    }
    
    /**
     * Check for alerts
     */
    checkForAlerts(results) {
        const criticalIssues = results.checks.filter(c => c.status === 'unhealthy');
        const warnings = results.checks.filter(c => c.status === 'warning');
        
        if (criticalIssues.length > 0) {
            console.error('🚨 CRITICAL ISSUES DETECTED:');
            criticalIssues.forEach(issue => {
                console.error(`   - ${issue.name}: ${JSON.stringify(issue.details)}`);
            });
            
            this.emit('critical-alert', { issues: criticalIssues });
        }
        
        if (warnings.length > 0) {
            console.warn('⚠️  WARNINGS:');
            warnings.forEach(warning => {
                console.warn(`   - ${warning.name}: ${JSON.stringify(warning.details)}`);
            });
            
            this.emit('warning-alert', { warnings });
        }
    }
    
    /**
     * Broadcast metrics to connected clients
     */
    broadcastMetrics() {
        const message = JSON.stringify({
            type: 'metrics-update',
            metrics: this.metrics,
            timestamp: new Date()
        });
        
        this.connectedClients.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(message);
            }
        });
    }
    
    /**
     * Broadcast verification results
     */
    broadcastVerification() {
        const message = JSON.stringify({
            type: 'verification-update',
            verification: this.verificationResults,
            timestamp: new Date()
        });
        
        this.connectedClients.forEach(ws => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(message);
            }
        });
    }
    
    /**
     * Record game metric
     */
    async recordMetric(sessionId, metricType, value, metadata = {}) {
        try {
            await this.persistence.logPerformanceMetric(
                sessionId,
                metricType,
                value,
                metadata
            );
            
            // Update local metrics
            if (metricType === 'fps') {
                this.metrics.fps.push(value);
                // Keep last 60 samples
                if (this.metrics.fps.length > 60) {
                    this.metrics.fps.shift();
                }
            }
        } catch (error) {
            console.error('Error recording metric:', error);
        }
    }
    
    /**
     * Get verification summary
     */
    getVerificationSummary() {
        return {
            uptime: Date.now() - this.metrics.startTime,
            metrics: this.metrics,
            verification: this.verificationResults,
            health: this.calculateHealthScore()
        };
    }
    
    /**
     * Calculate overall health score
     */
    calculateHealthScore() {
        let score = 100;
        
        if (!this.verificationResults.databaseConnected) score -= 30;
        if (!this.verificationResults.gameRunning) score -= 20;
        if (!this.verificationResults.aiSystemActive) score -= 20;
        if (!this.verificationResults.physicsEngineActive) score -= 10;
        
        // Deduct for issues
        score -= this.verificationResults.issues.length * 5;
        
        return Math.max(0, score);
    }
    
    /**
     * Cleanup
     */
    async cleanup() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        
        if (this.verificationInterval) {
            clearInterval(this.verificationInterval);
        }
        
        if (this.wss) {
            this.wss.close();
        }
        
        await this.persistence.cleanup();
        
        console.log('🔚 Game Verification Service shut down');
    }
}

// Export
module.exports = GameVerificationService;

// Run if main
if (require.main === module) {
    const service = new GameVerificationService();
    
    service.init().then(() => {
        console.log('🔍 Game Verification Service running...');
        console.log(`📊 Monitoring dashboard: ws://localhost:${service.config.monitoringPort}`);
        
        // Perform initial check
        setTimeout(() => {
            service.performVerificationCheck();
        }, 2000);
        
    }).catch(console.error);
    
    // Handle shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down...');
        await service.cleanup();
        process.exit(0);
    });
}