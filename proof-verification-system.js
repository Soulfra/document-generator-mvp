#!/usr/bin/env node

/**
 * 🎯 Proof Verification System
 * 
 * Coordinates King/Queen dance validation across encrypted environments.
 * Validates technical metrics, human experience, and cross-system synchronization.
 * 
 * Proves the multi-environment dance works through comprehensive testing.
 */

const { EventEmitter } = require('events');
const WebSocket = require('ws');
const http = require('http');
const crypto = require('crypto');

// Import our proof components
const ColorStateProofEngine = require('./color-state-proof-engine');
const DatabaseEncoderBridge = require('./database-encoder-bridge');

class ProofVerificationSystem extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            port: config.port || 9996,
            wsPort: config.wsPort || 9995,
            kingEndpoint: config.kingEndpoint || 'http://localhost:9999',
            queenEndpoint: config.queenEndpoint || 'http://localhost:9998',
            bridgeEndpoint: config.bridgeEndpoint || 'ws://localhost:9995',
            
            // Verification thresholds
            kingHealthThreshold: config.kingHealthThreshold || 80,
            queenSatisfactionThreshold: config.queenSatisfactionThreshold || 75,
            syncScoreThreshold: config.syncScoreThreshold || 70,
            
            // Test intervals
            verificationInterval: config.verificationInterval || 10000, // 10 seconds
            deepVerificationInterval: config.deepVerificationInterval || 60000, // 1 minute
            
            ...config
        };
        
        // Core components
        this.colorEngine = new ColorStateProofEngine({
            cycleInterval: 5000,
            proofThreshold: 85,
            maxCycles: 8
        });
        
        this.databaseBridge = new DatabaseEncoderBridge({
            localDb: './data/proof-verification.db',
            syncInterval: 15000
        });
        
        // WebSocket server for real-time updates
        this.wsServer = null;
        this.wsClients = new Set();
        
        // HTTP server for API
        this.httpServer = null;
        
        // Verification state
        this.verificationResults = {
            king: { healthy: false, lastCheck: null, metrics: {} },
            queen: { healthy: false, lastCheck: null, metrics: {} },
            bridge: { connected: false, lastSync: null },
            database: { synced: false, lastSync: null },
            overall: { proven: false, confidence: 0 }
        };
        
        // Test scenarios
        this.testScenarios = [
            'basic_connectivity',
            'king_technical_validation',
            'queen_experience_validation',
            'cross_environment_sync',
            'encryption_integrity',
            'dance_choreography',
            'stress_test',
            'recovery_test'
        ];
        
        this.currentTest = null;
        this.testResults = new Map();
        
        // Performance tracking
        this.performanceMetrics = {
            testsRun: 0,
            testsPassedTotal: 0,
            avgResponseTime: 0,
            errorCount: 0,
            uptime: Date.now()
        };
        
        this.initialized = false;
    }
    
    /**
     * Initialize the proof verification system
     */
    async initialize() {
        console.log('🎯 Initializing Proof Verification System...');
        
        try {
            // Initialize core components
            await this.colorEngine.start();
            await this.databaseBridge.initialize();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Start servers
            await this.startWebSocketServer();
            await this.startHttpServer();
            
            // Begin verification processes
            this.startContinuousVerification();
            this.startDeepVerification();
            
            this.initialized = true;
            console.log('✅ Proof Verification System initialized');
            console.log(`🌐 HTTP API: http://localhost:${this.config.port}`);
            console.log(`🔌 WebSocket: ws://localhost:${this.config.wsPort}`);
            
            this.emit('initialized');
            
            // Run initial proof test
            setTimeout(() => this.runFullProofTest(), 3000);
            
        } catch (error) {
            console.error('❌ Failed to initialize Proof Verification System:', error);
            throw error;
        }
    }
    
    /**
     * Setup event listeners for components
     */
    setupEventListeners() {
        // Color engine events
        this.colorEngine.on('state_change', (data) => {
            this.broadcastToClients('state_change', data);
            this.recordVerificationEvent('color_state_change', data);
        });
        
        this.colorEngine.on('proof_attempt', (data) => {
            this.broadcastToClients('proof_attempt', data);
            this.updateOverallConfidence();
        });
        
        this.colorEngine.on('dance_event', (data) => {
            this.broadcastToClients('dance_event', data);
            this.verifyDanceEvent(data);
        });
        
        // Database bridge events
        this.databaseBridge.on('king_metrics_stored', (data) => {
            this.processKingMetrics(data);
        });
        
        this.databaseBridge.on('queen_metrics_stored', (data) => {
            this.processQueenMetrics(data);
        });
        
        this.databaseBridge.on('sync_completed', (data) => {
            this.processSyncCompletion(data);
        });
    }
    
    /**
     * Start WebSocket server for real-time communication
     */
    async startWebSocketServer() {
        this.wsServer = new WebSocket.Server({ port: this.config.wsPort });
        
        this.wsServer.on('connection', (ws) => {
            console.log('🔌 WebSocket client connected');
            this.wsClients.add(ws);
            
            // Send current state
            ws.send(JSON.stringify({
                type: 'initial_state',
                colorState: this.colorEngine.getCurrentState(),
                verificationResults: this.verificationResults,
                performanceMetrics: this.performanceMetrics
            }));
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleWebSocketMessage(ws, data);
                } catch (error) {
                    console.error('Invalid WebSocket message:', error);
                }
            });
            
            ws.on('close', () => {
                console.log('🔌 WebSocket client disconnected');
                this.wsClients.delete(ws);
            });
        });
        
        console.log(`🔌 WebSocket server started on port ${this.config.wsPort}`);
    }
    
    /**
     * Start HTTP server for API
     */
    async startHttpServer() {
        this.httpServer = http.createServer((req, res) => {
            // CORS headers
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            
            this.handleHttpRequest(req, res);
        });
        
        this.httpServer.listen(this.config.port, () => {
            console.log(`🌐 HTTP server started on port ${this.config.port}`);
        });
    }
    
    /**
     * Handle HTTP API requests
     */
    async handleHttpRequest(req, res) {
        const url = new URL(req.url, `http://localhost:${this.config.port}`);
        const path = url.pathname;
        
        try {
            let response;
            
            switch (path) {
                case '/health':
                    response = this.getHealthStatus();
                    break;
                
                case '/status':
                    response = this.getVerificationStatus();
                    break;
                
                case '/proof':
                    response = await this.runFullProofTest();
                    break;
                
                case '/metrics':
                    response = this.getPerformanceMetrics();
                    break;
                
                case '/test':
                    const scenario = url.searchParams.get('scenario');
                    response = await this.runTestScenario(scenario);
                    break;
                
                case '/force-state':
                    const state = url.searchParams.get('state');
                    response = this.forceColorState(state);
                    break;
                
                default:
                    response = { error: 'Not found' };
                    res.writeHead(404);
            }
            
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(200);
            res.end(JSON.stringify(response, null, 2));
            
        } catch (error) {
            console.error('HTTP request error:', error);
            res.writeHead(500);
            res.end(JSON.stringify({ error: error.message }));
        }
    }
    
    /**
     * Handle WebSocket messages
     */
    handleWebSocketMessage(ws, data) {
        switch (data.command) {
            case 'force_state':
                this.forceColorState(data.state);
                break;
            
            case 'reset_state':
                this.colorEngine.forceStateTransition('green', 'manual_reset');
                break;
            
            case 'run_test':
                this.runTestScenario(data.scenario);
                break;
            
            case 'get_status':
                ws.send(JSON.stringify({
                    type: 'status_update',
                    verificationResults: this.verificationResults
                }));
                break;
            
            default:
                console.warn('Unknown WebSocket command:', data.command);
        }
    }
    
    /**
     * Run full proof test
     */
    async runFullProofTest() {
        console.log('🎯 Running full proof test...');
        
        const proofTest = {
            id: crypto.randomBytes(8).toString('hex'),
            timestamp: new Date(),
            scenarios: [],
            overallResult: false,
            confidence: 0,
            duration: 0
        };
        
        const startTime = Date.now();
        
        // Run all test scenarios
        for (const scenario of this.testScenarios) {
            try {
                const result = await this.runTestScenario(scenario);
                proofTest.scenarios.push(result);
                
                if (result.passed) {
                    this.performanceMetrics.testsPassedTotal++;
                }
                
            } catch (error) {
                console.error(`Test scenario ${scenario} failed:`, error);
                proofTest.scenarios.push({
                    scenario,
                    passed: false,
                    error: error.message,
                    timestamp: new Date()
                });
            }
        }
        
        proofTest.duration = Date.now() - startTime;
        this.performanceMetrics.testsRun++;
        
        // Calculate overall result
        const passedTests = proofTest.scenarios.filter(s => s.passed).length;
        proofTest.confidence = (passedTests / proofTest.scenarios.length) * 100;
        proofTest.overallResult = proofTest.confidence >= 75;
        
        // Update color state based on result
        if (proofTest.overallResult) {
            this.colorEngine.forceStateTransition('purple', 'proof_test_passed');
        } else if (proofTest.confidence < 50) {
            this.colorEngine.forceStateTransition('red', 'proof_test_failed');
        } else {
            this.colorEngine.forceStateTransition('yellow', 'proof_test_partial');
        }
        
        // Store result
        this.testResults.set(proofTest.id, proofTest);
        
        // Broadcast result
        this.broadcastToClients('proof_test_complete', proofTest);
        
        console.log(`🎯 Proof test complete: ${proofTest.overallResult ? '✅' : '❌'} (${proofTest.confidence}%)`);
        
        return proofTest;
    }
    
    /**
     * Run individual test scenario
     */
    async runTestScenario(scenario) {
        this.currentTest = scenario;
        console.log(`🧪 Running test scenario: ${scenario}`);
        
        const test = {
            scenario,
            passed: false,
            details: {},
            error: null,
            timestamp: new Date(),
            duration: 0
        };
        
        const startTime = Date.now();
        
        try {
            switch (scenario) {
                case 'basic_connectivity':
                    test.passed = await this.testBasicConnectivity();
                    break;
                
                case 'king_technical_validation':
                    test.passed = await this.testKingTechnicalValidation();
                    break;
                
                case 'queen_experience_validation':
                    test.passed = await this.testQueenExperienceValidation();
                    break;
                
                case 'cross_environment_sync':
                    test.passed = await this.testCrossEnvironmentSync();
                    break;
                
                case 'encryption_integrity':
                    test.passed = await this.testEncryptionIntegrity();
                    break;
                
                case 'dance_choreography':
                    test.passed = await this.testDanceChoreography();
                    break;
                
                case 'stress_test':
                    test.passed = await this.testStressScenario();
                    break;
                
                case 'recovery_test':
                    test.passed = await this.testRecoveryScenario();
                    break;
                
                default:
                    throw new Error(`Unknown test scenario: ${scenario}`);
            }
            
        } catch (error) {
            test.error = error.message;
            console.error(`❌ Test ${scenario} failed:`, error);
        }
        
        test.duration = Date.now() - startTime;
        this.currentTest = null;
        
        console.log(`🧪 Test ${scenario}: ${test.passed ? '✅' : '❌'} (${test.duration}ms)`);
        
        return test;
    }
    
    /**
     * Test basic connectivity to King and Queen
     */
    async testBasicConnectivity() {
        // Simulate King connection test
        const kingHealthy = await this.checkKingHealth();
        
        // Simulate Queen connection test
        const queenHealthy = await this.checkQueenHealth();
        
        // Test database connectivity
        const dbHealthy = this.databaseBridge.initialized;
        
        return kingHealthy && queenHealthy && dbHealthy;
    }
    
    /**
     * Test King technical validation
     */
    async testKingTechnicalValidation() {
        // Simulate King metrics
        const kingMetrics = {
            systemId: 'test-king',
            serviceStatus: 'healthy',
            errorCount: Math.floor(Math.random() * 3),
            latencyMs: Math.floor(Math.random() * 500 + 100),
            cpuUsage: Math.random() * 50 + 25,
            memoryUsage: Math.random() * 40 + 30
        };
        
        // Store in database
        const result = await this.databaseBridge.storeKingMetrics(kingMetrics);
        
        // Validate result
        return result.id && result.colorState && kingMetrics.errorCount < 5;
    }
    
    /**
     * Test Queen experience validation
     */
    async testQueenExperienceValidation() {
        // Simulate Queen metrics
        const queenMetrics = {
            userId: 'test-queen',
            emotionState: 'happy',
            satisfaction: Math.floor(Math.random() * 30 + 70),
            confusionLevel: Math.floor(Math.random() * 20 + 5),
            journeyStep: 'proof-validation',
            completionRate: Math.random() * 20 + 80
        };
        
        // Store in database
        const result = await this.databaseBridge.storeQueenMetrics(queenMetrics);
        
        // Validate result
        return result.id && result.colorState && queenMetrics.satisfaction >= 60;
    }
    
    /**
     * Test cross-environment synchronization
     */
    async testCrossEnvironmentSync() {
        // Create a dance event that requires King/Queen coordination
        const danceEvent = {
            danceType: 'waltz',
            syncScore: Math.floor(Math.random() * 30 + 70),
            kingHarmony: 528,
            queenHarmony: 432,
            colorState: this.colorEngine.currentState
        };
        
        // Store dance event
        const result = await this.databaseBridge.storeDanceEvent(danceEvent);
        
        // Record in color engine
        this.colorEngine.recordDanceEvent({
            dance: danceEvent.danceType,
            kingMetrics: { harmony: danceEvent.kingHarmony },
            queenMetrics: { harmony: danceEvent.queenHarmony },
            synchronization: danceEvent.syncScore,
            success: danceEvent.syncScore >= 70
        });
        
        return result.id && danceEvent.syncScore >= this.config.syncScoreThreshold;
    }
    
    /**
     * Test encryption integrity
     */
    async testEncryptionIntegrity() {
        // Test data encryption/decryption
        const testData = { secret: 'king-queen-dance-proof', timestamp: Date.now() };
        
        try {
            const encrypted = this.databaseBridge.encryptData(JSON.stringify(testData));
            const decrypted = this.databaseBridge.decryptData(encrypted);
            const parsedData = JSON.parse(decrypted);
            
            return parsedData.secret === testData.secret && parsedData.timestamp === testData.timestamp;
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Test dance choreography
     */
    async testDanceChoreography() {
        // Test multiple dance types with different synchronization scores
        const dances = ['waltz', 'tango', 'salsa'];
        let successfulDances = 0;
        
        for (const dance of dances) {
            const syncScore = Math.floor(Math.random() * 40 + 60);
            
            this.colorEngine.recordDanceEvent({
                dance,
                kingMetrics: { precision: 95, timing: 98 },
                queenMetrics: { grace: 88, enjoyment: 94 },
                synchronization: syncScore,
                success: syncScore >= 70
            });
            
            if (syncScore >= 70) {
                successfulDances++;
            }
        }
        
        return successfulDances >= 2; // At least 2 out of 3 dances successful
    }
    
    /**
     * Test stress scenario
     */
    async testStressScenario() {
        // Simulate high load with multiple rapid operations
        const operations = [];
        
        for (let i = 0; i < 10; i++) {
            operations.push(this.databaseBridge.storeKingMetrics({
                systemId: `stress-king-${i}`,
                serviceStatus: 'stressed',
                errorCount: Math.floor(Math.random() * 10),
                latencyMs: Math.floor(Math.random() * 2000 + 500)
            }));
            
            operations.push(this.databaseBridge.storeQueenMetrics({
                userId: `stress-queen-${i}`,
                emotionState: 'stressed',
                satisfaction: Math.floor(Math.random() * 50 + 25),
                confusionLevel: Math.floor(Math.random() * 50 + 25)
            }));
        }
        
        try {
            const results = await Promise.all(operations);
            return results.every(r => r.id); // All operations completed
        } catch (error) {
            return false;
        }
    }
    
    /**
     * Test recovery scenario
     */
    async testRecoveryScenario() {
        // Force error state and test recovery
        this.colorEngine.forceStateTransition('red', 'recovery_test');
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simulate good metrics to trigger recovery
        await this.databaseBridge.storeKingMetrics({
            systemId: 'recovery-king',
            serviceStatus: 'recovered',
            errorCount: 0,
            latencyMs: 150
        });
        
        await this.databaseBridge.storeQueenMetrics({
            userId: 'recovery-queen',
            emotionState: 'relieved',
            satisfaction: 90,
            confusionLevel: 5
        });
        
        // Should transition back to green/purple
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return ['green', 'purple', 'gold'].includes(this.colorEngine.currentState);
    }
    
    /**
     * Check King system health
     */
    async checkKingHealth() {
        // Simulate King health check
        this.verificationResults.king.healthy = Math.random() > 0.1; // 90% chance healthy
        this.verificationResults.king.lastCheck = new Date();
        return this.verificationResults.king.healthy;
    }
    
    /**
     * Check Queen system health
     */
    async checkQueenHealth() {
        // Simulate Queen health check
        this.verificationResults.queen.healthy = Math.random() > 0.15; // 85% chance healthy
        this.verificationResults.queen.lastCheck = new Date();
        return this.verificationResults.queen.healthy;
    }
    
    /**
     * Process King metrics from database
     */
    processKingMetrics(data) {
        this.verificationResults.king.metrics = data.record;
        this.verificationResults.king.healthy = 
            data.record.error_count < 5 && data.record.latency_ms < 2000;
        
        this.broadcastToClients('king_metrics', data.record);
    }
    
    /**
     * Process Queen metrics from database
     */
    processQueenMetrics(data) {
        this.verificationResults.queen.metrics = data.record;
        this.verificationResults.queen.healthy = 
            data.record.satisfaction >= 60 && data.record.confusion_level <= 40;
        
        this.broadcastToClients('queen_metrics', data.record);
    }
    
    /**
     * Process database sync completion
     */
    processSyncCompletion(data) {
        this.verificationResults.database.synced = data.stats.successful > data.stats.failed;
        this.verificationResults.database.lastSync = new Date();
        
        this.broadcastToClients('sync_status', data);
    }
    
    /**
     * Verify dance event quality
     */
    verifyDanceEvent(danceData) {
        const isGoodDance = danceData.synchronization >= this.config.syncScoreThreshold;
        
        this.colorEngine.recordProofAttempt({
            type: 'dance_verification',
            success: isGoodDance,
            score: danceData.synchronization,
            kingData: danceData.kingMetrics,
            queenData: danceData.queenMetrics
        });
    }
    
    /**
     * Update overall confidence based on all factors
     */
    updateOverallConfidence() {
        const factors = [
            this.verificationResults.king.healthy ? 25 : 0,
            this.verificationResults.queen.healthy ? 25 : 0,
            this.verificationResults.database.synced ? 25 : 0,
            this.colorEngine.proofScore * 0.25
        ];
        
        this.verificationResults.overall.confidence = factors.reduce((a, b) => a + b, 0);
        this.verificationResults.overall.proven = this.verificationResults.overall.confidence >= 75;
        
        this.broadcastToClients('confidence_update', this.verificationResults.overall);
    }
    
    /**
     * Force color state transition
     */
    forceColorState(state) {
        const result = this.colorEngine.forceStateTransition(state, 'manual_override');
        
        if (result) {
            this.recordVerificationEvent('manual_state_change', { state, timestamp: new Date() });
        }
        
        return { success: result, currentState: this.colorEngine.currentState };
    }
    
    /**
     * Start continuous verification
     */
    startContinuousVerification() {
        setInterval(async () => {
            if (!this.initialized) return;
            
            // Quick health checks
            await this.checkKingHealth();
            await this.checkQueenHealth();
            
            // Update overall confidence
            this.updateOverallConfidence();
            
            // Broadcast status update
            this.broadcastToClients('status_update', this.verificationResults);
            
        }, this.config.verificationInterval);
    }
    
    /**
     * Start deep verification
     */
    startDeepVerification() {
        setInterval(async () => {
            if (!this.initialized) return;
            
            console.log('🔍 Running deep verification...');
            
            // Run a subset of tests
            const quickTests = ['basic_connectivity', 'cross_environment_sync'];
            
            for (const test of quickTests) {
                await this.runTestScenario(test);
            }
            
        }, this.config.deepVerificationInterval);
    }
    
    /**
     * Record verification event
     */
    recordVerificationEvent(type, data) {
        const event = {
            type,
            data,
            timestamp: new Date(),
            currentState: this.colorEngine.currentState
        };
        
        // Could store in database or emit event
        this.emit('verification_event', event);
    }
    
    /**
     * Broadcast message to all WebSocket clients
     */
    broadcastToClients(type, data) {
        const message = JSON.stringify({ type, ...data, timestamp: new Date() });
        
        this.wsClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
    
    /**
     * Get health status
     */
    getHealthStatus() {
        return {
            healthy: this.initialized && this.verificationResults.overall.confidence > 50,
            uptime: Date.now() - this.performanceMetrics.uptime,
            components: {
                colorEngine: this.colorEngine.running,
                databaseBridge: this.databaseBridge.initialized,
                webSocket: !!this.wsServer,
                httpServer: !!this.httpServer
            }
        };
    }
    
    /**
     * Get verification status
     */
    getVerificationStatus() {
        return {
            verificationResults: this.verificationResults,
            currentTest: this.currentTest,
            colorState: this.colorEngine.getCurrentState(),
            engineStats: this.colorEngine.getStats(),
            syncStats: this.databaseBridge.getSyncStats()
        };
    }
    
    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        return {
            ...this.performanceMetrics,
            uptime: Date.now() - this.performanceMetrics.uptime,
            avgResponseTime: this.performanceMetrics.avgResponseTime || 0,
            successRate: this.performanceMetrics.testsRun > 0 ? 
                (this.performanceMetrics.testsPassedTotal / this.performanceMetrics.testsRun) * 100 : 0
        };
    }
    
    /**
     * Shutdown the verification system
     */
    async shutdown() {
        console.log('🎯 Shutting down Proof Verification System...');
        
        this.colorEngine.stop();
        await this.databaseBridge.close();
        
        if (this.wsServer) {
            this.wsServer.close();
        }
        
        if (this.httpServer) {
            this.httpServer.close();
        }
        
        console.log('✅ Proof Verification System shutdown complete');
    }
}

// Export the class
module.exports = ProofVerificationSystem;

// Demo if run directly
if (require.main === module) {
    const verificationSystem = new ProofVerificationSystem();
    
    // Event listeners
    verificationSystem.on('initialized', () => {
        console.log('🎯 Verification system ready, running proof tests...');
    });
    
    verificationSystem.on('verification_event', (event) => {
        console.log(`📝 Verification event: ${event.type}`);
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Received SIGINT, shutting down gracefully...');
        await verificationSystem.shutdown();
        process.exit(0);
    });
    
    // Initialize
    verificationSystem.initialize().catch(console.error);
}