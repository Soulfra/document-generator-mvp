#!/usr/bin/env node

/**
 * 🔄 UNIFIED FLOW ORCHESTRATOR
 * 
 * Main orchestrator that manages the complete flow:
 * API Request → MVP Generation → Forum Post → Game Event → Database Storage
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class UnifiedFlowOrchestrator extends EventEmitter {
    constructor() {
        super();
        
        // Initialize all flow components
        this.apiBridge = new (require('./api-to-forum-bridge'))();
        this.forumTransformer = new (require('./forum-to-game-transformer'))();
        this.gamePersistor = new (require('./game-to-database-persistor'))();
        this.mvpGenerator = new (require('./unified-mvp-generator'))();
        this.rlSystem = new (require('./real-game-api-rl-system'))();
        
        // Flow tracking
        this.activeFlows = new Map();
        this.flowHistory = [];
        
        // Statistics
        this.stats = {
            totalFlows: 0,
            successfulFlows: 0,
            failedFlows: 0,
            averageFlowTime: 0,
            flowsByType: {}
        };
        
        // Set up component event listeners
        this.setupEventListeners();
        
        console.log('🔄 Unified Flow Orchestrator initialized');
    }
    
    async initialize() {
        console.log('🚀 Initializing flow components...');
        
        // Initialize all components
        await this.apiBridge.initialize();
        await this.gamePersistor.initialize();
        await this.rlSystem.start();
        
        console.log('✅ All flow components ready');
    }
    
    setupEventListeners() {
        // MVP Generator events
        this.mvpGenerator.on('step:complete', (step, data) => {
            this.updateFlowProgress(data.flowId, 'mvp_generation', step);
        });
        
        // Forum Transformer events
        this.forumTransformer.on('transformation:complete', (data) => {
            this.updateFlowProgress(data.flowId, 'game_transformation', 'complete');
        });
        
        this.forumTransformer.on('quest:started', (quest) => {
            this.emit('flow:quest:started', quest);
        });
        
        this.forumTransformer.on('quest:completed', (quest) => {
            this.emit('flow:quest:completed', quest);
        });
        
        // Game Persistor events
        this.gamePersistor.on('persistence:complete', (data) => {
            this.updateFlowProgress(data.flowId, 'database_persistence', 'complete');
        });
    }
    
    async processCompleteFlow(apiRequest) {
        const flowId = crypto.randomUUID();
        const startTime = Date.now();
        
        console.log(`🚀 Starting complete flow: ${flowId}`);
        
        // Initialize flow tracking
        const flowState = {
            id: flowId,
            startTime,
            request: apiRequest,
            stages: {
                mvp_generation: { status: 'pending', data: null },
                forum_posting: { status: 'pending', data: null },
                game_transformation: { status: 'pending', data: null },
                database_persistence: { status: 'pending', data: null }
            },
            status: 'active',
            errors: []
        };
        
        this.activeFlows.set(flowId, flowState);
        this.emit('flow:started', { flowId, request: apiRequest });
        
        try {
            // Stage 1: MVP Generation
            console.log('📦 Stage 1: Generating MVP...');
            flowState.stages.mvp_generation.status = 'in_progress';
            
            const mvpResult = await this.mvpGenerator.generateFromDocument(
                apiRequest.document,
                { ...apiRequest.options, flowId }
            );
            
            flowState.stages.mvp_generation.status = 'complete';
            flowState.stages.mvp_generation.data = mvpResult;
            
            this.emit('flow:stage:complete', {
                flowId,
                stage: 'mvp_generation',
                data: mvpResult
            });
            
            // Stage 2: Post to Forum
            console.log('💬 Stage 2: Posting to forum...');
            flowState.stages.forum_posting.status = 'in_progress';
            
            const forumData = await this.apiBridge.processAPIResponse(mvpResult, {
                type: 'mvp_generation',
                name: mvpResult.name,
                agentId: apiRequest.agentId || 'flow-orchestrator',
                endpoint: '/api/mvp/generate',
                flowId
            });
            
            if (!forumData.success) {
                throw new Error(`Forum posting failed: ${forumData.error}`);
            }
            
            flowState.stages.forum_posting.status = 'complete';
            flowState.stages.forum_posting.data = forumData;
            
            this.emit('flow:stage:complete', {
                flowId,
                stage: 'forum_posting',
                data: forumData
            });
            
            // Stage 3: Transform to Game Event
            console.log('🎮 Stage 3: Transforming to game event...');
            flowState.stages.game_transformation.status = 'in_progress';
            
            const gameEvent = await this.forumTransformer.transformForumPost({
                ...forumData.forumPost,
                flowId
            });
            
            if (!gameEvent.success) {
                throw new Error(`Game transformation failed: ${gameEvent.error}`);
            }
            
            flowState.stages.game_transformation.status = 'complete';
            flowState.stages.game_transformation.data = gameEvent;
            
            this.emit('flow:stage:complete', {
                flowId,
                stage: 'game_transformation',
                data: gameEvent
            });
            
            // Stage 4: Process in Gaming Layer
            console.log('🎯 Stage 4: Processing in gaming layer...');
            const gameOutcome = await this.processInGamingLayer(gameEvent.gameEvent);
            
            // Stage 5: Persist to Databases
            console.log('💾 Stage 5: Persisting to databases...');
            flowState.stages.database_persistence.status = 'in_progress';
            
            const persistedData = await this.gamePersistor.persistGameEvent(
                { ...gameEvent.gameEvent, flowId },
                gameOutcome
            );
            
            if (!persistedData.success) {
                throw new Error(`Database persistence failed: ${persistedData.error}`);
            }
            
            flowState.stages.database_persistence.status = 'complete';
            flowState.stages.database_persistence.data = persistedData;
            
            this.emit('flow:stage:complete', {
                flowId,
                stage: 'database_persistence',
                data: persistedData
            });
            
            // Stage 6: Learn from the Complete Cycle
            console.log('🧠 Stage 6: Learning from cycle...');
            await this.learnFromCycle({
                flowId,
                api: mvpResult,
                forum: forumData,
                game: gameEvent,
                outcome: gameOutcome,
                persisted: persistedData
            });
            
            // Calculate flow metrics
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            // Update flow state
            flowState.status = 'completed';
            flowState.endTime = endTime;
            flowState.duration = duration;
            
            // Update statistics
            this.updateStatistics(flowState, true);
            
            // Generate flow summary
            const flowSummary = this.generateFlowSummary(flowState);
            
            // Emit completion
            this.emit('flow:completed', {
                flowId,
                duration,
                summary: flowSummary
            });
            
            console.log(`✅ Flow completed successfully in ${duration}ms`);
            
            return {
                success: true,
                flowId,
                duration,
                flow: {
                    mvpId: mvpResult.id,
                    forumPostId: forumData.forumPost.id,
                    gameEventId: gameEvent.gameEvent.id,
                    databaseId: persistedData.relationalId
                },
                completionCertificate: persistedData.certificate,
                summary: flowSummary
            };
            
        } catch (error) {
            console.error(`❌ Flow ${flowId} failed:`, error);
            
            // Update flow state
            flowState.status = 'failed';
            flowState.error = error.message;
            flowState.errors.push({
                stage: this.getCurrentStage(flowState),
                error: error.message,
                timestamp: Date.now()
            });
            
            // Update statistics
            this.updateStatistics(flowState, false);
            
            // Handle flow error
            await this.handleFlowError(flowId, error);
            
            // Emit failure
            this.emit('flow:failed', {
                flowId,
                error: error.message,
                stage: this.getCurrentStage(flowState)
            });
            
            return {
                success: false,
                flowId,
                error: error.message,
                stage: this.getCurrentStage(flowState),
                partialResults: this.extractPartialResults(flowState)
            };
            
        } finally {
            // Move to history
            this.flowHistory.push(flowState);
            this.activeFlows.delete(flowId);
            
            // Keep only last 100 flows in history
            if (this.flowHistory.length > 100) {
                this.flowHistory.shift();
            }
        }
    }
    
    async processInGamingLayer(gameEvent) {
        // Simulate game processing
        // In real implementation, this would dispatch to actual game servers
        
        const processingTime = Math.random() * 5000 + 2000; // 2-7 seconds
        await new Promise(resolve => setTimeout(resolve, processingTime));
        
        // Generate game outcome based on event type
        const outcome = {
            success: Math.random() > 0.1, // 90% success rate
            score: Math.floor(Math.random() * 100),
            endTime: Date.now(),
            
            // Rewards based on event type
            experienceGained: this.calculateExperience(gameEvent),
            goldGained: this.calculateGold(gameEvent),
            itemsGained: this.generateItems(gameEvent),
            
            // Quest tracking
            questCompleted: gameEvent.questId ? Math.random() > 0.3 : false,
            questName: `${gameEvent.type} Quest`,
            objectives: gameEvent.data.actions.map(action => ({
                action,
                completed: true
            })),
            
            // Learning patterns
            patterns: this.detectPatterns(gameEvent)
        };
        
        // Update quest progress if active
        if (gameEvent.questId) {
            this.forumTransformer.updateQuestProgress(
                gameEvent.questId,
                gameEvent.data.actions[0],
                100
            );
        }
        
        return outcome;
    }
    
    calculateExperience(gameEvent) {
        const baseExp = {
            'BUILD_STRUCTURE': 500,
            'EXPLORE_DUNGEON': 300,
            'CONNECT_PORTALS': 200,
            'BOSS_BATTLE': 1000,
            'EQUIP_ITEM': 100
        };
        
        const complexity = {
            'low': 0.5,
            'medium': 1,
            'high': 1.5,
            'epic': 3
        };
        
        const base = baseExp[gameEvent.type] || 100;
        const multiplier = complexity[gameEvent.data.complexity] || 1;
        
        return Math.floor(base * multiplier);
    }
    
    calculateGold(gameEvent) {
        return Math.floor(this.calculateExperience(gameEvent) * 0.5);
    }
    
    generateItems(gameEvent) {
        const items = [];
        
        // Chance for items based on complexity
        const itemChance = {
            'low': 0.2,
            'medium': 0.4,
            'high': 0.6,
            'epic': 0.9
        };
        
        if (Math.random() < (itemChance[gameEvent.data.complexity] || 0.3)) {
            items.push({
                name: `${gameEvent.type} Trophy`,
                type: gameEvent.data.complexity === 'epic' ? 'legendary' : 'rare',
                description: `Earned from ${gameEvent.type}`,
                bonus: `+${Math.floor(Math.random() * 10 + 5)}% efficiency`
            });
        }
        
        return items;
    }
    
    detectPatterns(gameEvent) {
        const patterns = [];
        
        // Detect patterns based on event data
        if (gameEvent.data.entities.length > 5) {
            patterns.push('complex_structure');
        }
        
        if (gameEvent.data.actions.includes('optimize')) {
            patterns.push('optimization_focus');
        }
        
        if (gameEvent.type === 'BUILD_STRUCTURE') {
            patterns.push('builder_pattern');
        }
        
        return patterns;
    }
    
    async learnFromCycle(cycleData) {
        // Analyze the complete cycle for patterns and improvements
        const learningData = {
            flowId: cycleData.flowId,
            mvpComplexity: cycleData.api.architecture?.complexity || 'medium',
            forumEngagement: cycleData.forum.forumPost?.id ? 'posted' : 'failed',
            gameSuccess: cycleData.outcome.success,
            persistenceSuccess: cycleData.persisted.success,
            totalDuration: cycleData.outcome.endTime - cycleData.api.timestamp,
            patterns: [
                ...cycleData.outcome.patterns,
                this.detectFlowPatterns(cycleData)
            ].flat()
        };
        
        // Send to RL system for learning
        try {
            await this.rlSystem.analyzeRLPattern('complete_flow', learningData);
        } catch (error) {
            console.log('⚠️ Learning system unavailable:', error.message);
        }
    }
    
    detectFlowPatterns(cycleData) {
        const patterns = [];
        
        // Fast flow pattern
        if (cycleData.outcome.endTime - cycleData.api.timestamp < 60000) {
            patterns.push('fast_flow');
        }
        
        // High quality pattern
        if (cycleData.outcome.score > 90) {
            patterns.push('high_quality');
        }
        
        // Achievement hunter pattern
        if (cycleData.persisted.newAchievements?.length > 0) {
            patterns.push('achievement_hunter');
        }
        
        return patterns;
    }
    
    async handleFlowError(flowId, error) {
        // Log error for analysis
        console.error(`Flow ${flowId} error:`, error);
        
        // Create error report
        const errorReport = {
            flowId,
            error: error.message,
            stack: error.stack,
            timestamp: Date.now(),
            flowState: this.activeFlows.get(flowId)
        };
        
        // Try to post error to forum
        try {
            const apiBridge = new (require('./api-to-forum-bridge'))();
            await apiBridge.postError(error, {
                type: 'flow_error',
                flowId
            });
        } catch (forumError) {
            console.error('Failed to post error to forum:', forumError);
        }
        
        // Emit error for monitoring
        this.emit('flow:error', errorReport);
    }
    
    updateFlowProgress(flowId, stage, progress) {
        const flow = this.activeFlows.get(flowId);
        if (!flow) return;
        
        if (flow.stages[stage]) {
            flow.stages[stage].progress = progress;
            flow.lastUpdate = Date.now();
            
            this.emit('flow:progress', {
                flowId,
                stage,
                progress,
                flow
            });
        }
    }
    
    updateStatistics(flowState, success) {
        this.stats.totalFlows++;
        
        if (success) {
            this.stats.successfulFlows++;
        } else {
            this.stats.failedFlows++;
        }
        
        // Update flow type statistics
        const flowType = flowState.request?.document?.type || 'unknown';
        this.stats.flowsByType[flowType] = (this.stats.flowsByType[flowType] || 0) + 1;
        
        // Update average flow time
        if (success && flowState.duration) {
            const totalTime = this.stats.averageFlowTime * (this.stats.successfulFlows - 1) + flowState.duration;
            this.stats.averageFlowTime = totalTime / this.stats.successfulFlows;
        }
    }
    
    getCurrentStage(flowState) {
        for (const [stage, data] of Object.entries(flowState.stages)) {
            if (data.status === 'in_progress') {
                return stage;
            }
        }
        return 'unknown';
    }
    
    extractPartialResults(flowState) {
        const results = {};
        
        for (const [stage, data] of Object.entries(flowState.stages)) {
            if (data.status === 'complete' && data.data) {
                results[stage] = data.data;
            }
        }
        
        return results;
    }
    
    generateFlowSummary(flowState) {
        const summary = {
            flowId: flowState.id,
            duration: flowState.duration,
            stages: {},
            highlights: []
        };
        
        // Summarize each stage
        for (const [stage, data] of Object.entries(flowState.stages)) {
            summary.stages[stage] = {
                status: data.status,
                hasData: !!data.data
            };
            
            // Extract highlights
            if (stage === 'mvp_generation' && data.data) {
                summary.highlights.push(`Generated ${data.data.name} MVP`);
            } else if (stage === 'forum_posting' && data.data) {
                summary.highlights.push(`Posted to ${data.data.board} board`);
            } else if (stage === 'game_transformation' && data.data) {
                summary.highlights.push(`Created ${data.data.gameEvent?.type} event`);
            } else if (stage === 'database_persistence' && data.data) {
                if (data.data.newAchievements?.length > 0) {
                    summary.highlights.push(`Unlocked ${data.data.newAchievements.length} achievements`);
                }
            }
        }
        
        return summary;
    }
    
    // Query methods
    getActiveFlows() {
        return Array.from(this.activeFlows.values());
    }
    
    getFlowHistory(limit = 10) {
        return this.flowHistory.slice(-limit);
    }
    
    getStatistics() {
        return {
            ...this.stats,
            successRate: this.stats.totalFlows > 0 ? 
                (this.stats.successfulFlows / this.stats.totalFlows * 100).toFixed(2) + '%' : 
                '0%',
            activeFlows: this.activeFlows.size
        };
    }
}

module.exports = UnifiedFlowOrchestrator;

// Demo if run directly
if (require.main === module) {
    const demo = async () => {
        console.log('🔄 UNIFIED FLOW ORCHESTRATOR DEMO');
        console.log('=================================\n');
        
        const orchestrator = new UnifiedFlowOrchestrator();
        await orchestrator.initialize();
        
        // Listen to flow events
        orchestrator.on('flow:started', (data) => {
            console.log(`\n🚀 Flow started: ${data.flowId}`);
        });
        
        orchestrator.on('flow:stage:complete', (data) => {
            console.log(`✅ Stage complete: ${data.stage}`);
        });
        
        orchestrator.on('flow:completed', (data) => {
            console.log(`\n🎉 Flow completed in ${data.duration}ms`);
            console.log(`📋 Summary:`, data.summary.highlights.join(', '));
        });
        
        // Test API request
        const testRequest = {
            document: {
                content: `# TaskFlow - Project Management SaaS
                
A collaborative project management platform with real-time updates,
task assignments, and team analytics.

Features:
- User authentication
- Project creation
- Task management
- Real-time collaboration
- Analytics dashboard`,
                type: 'business-plan'
            },
            options: {
                name: 'TaskFlow',
                database: 'postgresql'
            },
            agentId: 'demo-agent'
        };
        
        // Process the complete flow
        console.log('📄 Processing document through complete flow...\n');
        const result = await orchestrator.processCompleteFlow(testRequest);
        
        console.log('\n📊 Final Result:');
        console.log(`✅ Success: ${result.success}`);
        console.log(`🆔 Flow ID: ${result.flowId}`);
        console.log(`⏱️ Duration: ${result.duration}ms`);
        
        if (result.success) {
            console.log(`\n🔗 Flow Components:`);
            console.log(`   MVP ID: ${result.flow.mvpId}`);
            console.log(`   Forum Post: ${result.flow.forumPostId}`);
            console.log(`   Game Event: ${result.flow.gameEventId}`);
            console.log(`   Database ID: ${result.flow.databaseId}`);
            
            console.log(`\n📜 Certificate: ${result.completionCertificate.id}`);
        }
        
        // Show statistics
        const stats = orchestrator.getStatistics();
        console.log('\n📈 Orchestrator Statistics:');
        console.log(`   Total Flows: ${stats.totalFlows}`);
        console.log(`   Success Rate: ${stats.successRate}`);
        console.log(`   Average Time: ${Math.round(stats.averageFlowTime)}ms`);
    };
    
    demo().catch(console.error);
}