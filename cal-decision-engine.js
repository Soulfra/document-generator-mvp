#!/usr/bin/env node
/**
 * 🧠⚙️ CAL DECISION ENGINE
 * 
 * The brain that decides what CAL should build next based on vault analysis
 * Uses AI-driven decision making to prioritize component packaging
 * 
 * Features:
 * - Intelligent build prioritization based on confidence and utility
 * - Resource optimization and scheduling
 * - Dynamic adaptation based on build success/failure
 * - Integration opportunity detection
 * - Natural language reasoning for decision explanations
 */

const EventEmitter = require('events');
const CalKnowledgeProcessor = require('./cal-knowledge-processor.js');
const CalComponentPackager = require('./cal-component-packager.js');

class CalDecisionEngine extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            decisionInterval: config.decisionInterval || 30000, // 30 seconds
            maxConcurrentBuilds: config.maxConcurrentBuilds || 3,
            resourceThreshold: config.resourceThreshold || 0.8,
            priorityWeights: {
                confidence: 0.4,
                utility: 0.3,
                urgency: 0.2,
                feasibility: 0.1
            },
            adaptiveLearning: config.adaptiveLearning !== false,
            explainDecisions: config.explainDecisions !== false,
            ...config
        };
        
        // Core components
        this.knowledgeProcessor = new CalKnowledgeProcessor(config);
        this.componentPackager = new CalComponentPackager(config);
        
        // Decision state
        this.buildQueue = [];
        this.activeBuildsCubes = new Map();
        this.buildHistory = [];
        this.decisionLogs = [];
        
        // Learning and adaptation
        this.successPatterns = new Map();
        this.failurePatterns = new Map();
        this.buildPerformance = new Map();
        this.resourceUsage = new Map();
        
        // Decision criteria
        this.currentContext = {
            timeOfDay: 'morning',
            systemLoad: 0.0,
            availableResources: 1.0,
            recentFailures: 0,
            userPriorities: []
        };
        
        // Statistics
        this.stats = {
            decisionsTodate: 0,
            successfulBuilds: 0,
            failedBuilds: 0,
            totalBuildTime: 0,
            averageDecisionTime: 0,
            adaptationCount: 0,
            lastDecision: null
        };
        
        console.log('🧠 CAL Decision Engine initialized');
    }
    
    /**
     * Initialize the decision engine
     */
    async initialize() {
        console.log('🔄 Initializing CAL Decision Engine...');
        
        try {
            // Initialize components
            await this.knowledgeProcessor.initialize();
            await this.componentPackager.initialize();
            
            // Load historical data if available
            await this.loadHistoricalData();
            
            // Start decision loop if auto-mode
            if (this.config.autoMode !== false) {
                this.startDecisionLoop();
            }
            
            console.log('✅ Decision Engine ready!');
            console.log(`⚙️  Decision interval: ${this.config.decisionInterval}ms`);
            console.log(`🔄 Max concurrent builds: ${this.config.maxConcurrentBuilds}`);
            
            this.emit('ready', this.stats);
            return this;
            
        } catch (error) {
            console.error('❌ Failed to initialize Decision Engine:', error);
            throw error;
        }
    }
    
    /**
     * Make a decision about what to build next
     */
    async makeDecision(context = {}) {
        const startTime = Date.now();
        console.log('🤔 Making build decision...');
        
        // Update context
        this.updateContext(context);
        
        // Get available components
        const components = this.knowledgeProcessor.getBuildableComponents();
        const recommendations = this.knowledgeProcessor.getBuildRecommendations();
        
        if (components.length === 0) {
            return {
                decision: 'no_action',
                reason: 'No buildable components found',
                confidence: 0
            };
        }
        
        // Generate build candidates
        const candidates = await this.generateBuildCandidates(components, recommendations);
        
        // Score each candidate
        const scoredCandidates = await this.scoreCandidates(candidates);
        
        // Select best candidate
        const selected = this.selectCandidate(scoredCandidates);
        
        // Create decision record
        const decision = {
            id: this.generateDecisionId(),
            timestamp: new Date(),
            candidate: selected,
            context: { ...this.currentContext },
            reasoning: this.explainDecision(selected, scoredCandidates),
            confidence: selected ? selected.totalScore : 0,
            decisionTime: Date.now() - startTime
        };
        
        // Record decision
        this.decisionLogs.push(decision);
        this.stats.decisionsTodate++;
        this.stats.averageDecisionTime = (this.stats.averageDecisionTime * (this.stats.decisionsTodate - 1) + decision.decisionTime) / this.stats.decisionsTodate;
        this.stats.lastDecision = decision.timestamp;
        
        console.log(`✅ Decision made in ${decision.decisionTime}ms: ${decision.candidate ? decision.candidate.action : 'no_action'}`);
        
        if (this.config.explainDecisions) {
            console.log(`💭 Reasoning: ${decision.reasoning}`);
        }
        
        this.emit('decision', decision);
        
        return decision;
    }
    
    /**
     * Execute a decision (actually build the component)
     */
    async executeDecision(decision) {
        if (!decision.candidate) {
            console.log('⏸️  No action to execute');
            return { success: false, reason: 'No action specified' };
        }
        
        const buildId = this.generateBuildId();
        const startTime = Date.now();
        
        console.log(`🚀 Executing decision: ${decision.candidate.action} (Build ID: ${buildId})`);
        
        // Add to active builds
        this.activeBuildsCubes.set(buildId, {
            id: buildId,
            decision: decision,
            startTime: startTime,
            status: 'building',
            component: decision.candidate.component || decision.candidate.components
        });
        
        try {
            let result;
            
            if (decision.candidate.action === 'build_component') {
                result = await this.componentPackager.createPackage(
                    decision.candidate.component.id,
                    decision.candidate.options
                );
            } else if (decision.candidate.action === 'build_integration') {
                result = await this.componentPackager.createIntegratedPackage(
                    decision.candidate.components.map(c => c.id),
                    decision.candidate.options
                );
            }
            
            // Record successful build
            const buildTime = Date.now() - startTime;
            const buildRecord = {
                id: buildId,
                success: true,
                buildTime,
                result,
                decision,
                timestamp: new Date()
            };
            
            this.buildHistory.push(buildRecord);
            this.activeBuildsCubes.delete(buildId);
            this.stats.successfulBuilds++;
            this.stats.totalBuildTime += buildTime;
            
            // Learn from success
            await this.learnFromSuccess(buildRecord);
            
            console.log(`✅ Build completed successfully in ${buildTime}ms: ${result.name}`);
            
            this.emit('build_success', buildRecord);
            
            return { success: true, result, buildTime };
            
        } catch (error) {
            // Record failed build
            const buildTime = Date.now() - startTime;
            const buildRecord = {
                id: buildId,
                success: false,
                buildTime,
                error: error.message,
                decision,
                timestamp: new Date()
            };
            
            this.buildHistory.push(buildRecord);
            this.activeBuildsCubes.delete(buildId);
            this.stats.failedBuilds++;
            
            // Learn from failure
            await this.learnFromFailure(buildRecord);
            
            console.error(`❌ Build failed after ${buildTime}ms:`, error.message);
            
            this.emit('build_failure', buildRecord);
            
            return { success: false, error: error.message, buildTime };
        }
    }
    
    /**
     * Generate build candidates from components and recommendations
     */
    async generateBuildCandidates(components, recommendations) {
        const candidates = [];
        
        // Standalone component builds
        for (const component of components) {
            candidates.push({
                action: 'build_component',
                component,
                type: 'standalone',
                description: `Build ${component.name} as standalone package`,
                estimated_effort: this.estimateEffort(component),
                dependencies: component.dependencies.length,
                fileCount: component.files.length
            });
        }
        
        // Integration builds from recommendations
        for (const recommendation of recommendations) {
            if (recommendation.type === 'integration') {
                const compA = this.knowledgeProcessor.getComponent(recommendation.components[0]);
                const compB = this.knowledgeProcessor.getComponent(recommendation.components[1]);
                
                if (compA && compB) {
                    candidates.push({
                        action: 'build_integration',
                        components: [compA, compB],
                        type: 'integration',
                        description: recommendation.description,
                        estimated_effort: recommendation.effort,
                        compatibility: recommendation.compatibility,
                        sharedDependencies: recommendation.sharedDependencies || 0
                    });
                }
            }
        }
        
        return candidates;
    }
    
    /**
     * Score each build candidate
     */
    async scoreCandidates(candidates) {
        const scoredCandidates = [];
        
        for (const candidate of candidates) {
            const scores = {
                confidence: this.scoreConfidence(candidate),
                utility: await this.scoreUtility(candidate),
                urgency: this.scoreUrgency(candidate),
                feasibility: this.scoreFeasibility(candidate)
            };
            
            // Calculate weighted total score
            const totalScore = Object.entries(scores).reduce((total, [criterion, score]) => {
                return total + (score * this.config.priorityWeights[criterion]);
            }, 0);
            
            scoredCandidates.push({
                ...candidate,
                scores,
                totalScore,
                ranking: 0 // Will be set after sorting
            });
        }
        
        // Sort by total score and assign rankings
        scoredCandidates.sort((a, b) => b.totalScore - a.totalScore);
        scoredCandidates.forEach((candidate, index) => {
            candidate.ranking = index + 1;
        });
        
        return scoredCandidates;
    }
    
    /**
     * Score confidence for a candidate
     */
    scoreConfidence(candidate) {
        if (candidate.type === 'standalone') {
            return candidate.component.confidence;
        } else if (candidate.type === 'integration') {
            // Average confidence of integrated components
            const avgConfidence = candidate.components.reduce((sum, comp) => sum + comp.confidence, 0) / candidate.components.length;
            // Boost by compatibility score
            return avgConfidence * (candidate.compatibility || 0.5);
        }
        return 0.5;
    }
    
    /**
     * Score utility (how useful this would be)
     */
    async scoreUtility(candidate) {
        let utilityScore = 0;
        
        // Base utility by type
        if (candidate.component?.type === 'api' || candidate.component?.type === 'auth') {
            utilityScore += 0.8; // High utility types
        } else if (candidate.component?.type === 'frontend') {
            utilityScore += 0.7; // Medium-high utility
        } else if (candidate.component?.type === 'gaming' || candidate.component?.type === 'ai') {
            utilityScore += 0.6; // Medium utility
        } else {
            utilityScore += 0.4; // Default utility
        }
        
        // Boost for files that are ready for deployment
        if (candidate.component?.packaging.deployment) {
            utilityScore += 0.1;
        }
        
        // Boost for components with documentation
        if (candidate.component?.files.some(f => f.name.endsWith('.md'))) {
            utilityScore += 0.1;
        }
        
        // Integration bonus
        if (candidate.type === 'integration') {
            utilityScore += 0.2;
        }
        
        return Math.min(utilityScore, 1.0);
    }
    
    /**
     * Score urgency (how soon this should be built)
     */
    scoreUrgency(candidate) {
        let urgencyScore = 0;
        
        // Smaller components are more urgent (quicker wins)
        if (candidate.fileCount && candidate.fileCount < 10) {
            urgencyScore += 0.3;
        } else if (candidate.fileCount && candidate.fileCount < 50) {
            urgencyScore += 0.2;
        }
        
        // Low effort tasks are more urgent
        if (candidate.estimated_effort === 'low') {
            urgencyScore += 0.4;
        } else if (candidate.estimated_effort === 'medium') {
            urgencyScore += 0.2;
        }
        
        // Recent failures reduce urgency
        if (this.currentContext.recentFailures > 2) {
            urgencyScore *= 0.8;
        }
        
        // High system load reduces urgency
        if (this.currentContext.systemLoad > 0.7) {
            urgencyScore *= 0.7;
        }
        
        return Math.min(urgencyScore, 1.0);
    }
    
    /**
     * Score feasibility (how likely this is to succeed)
     */
    scoreFeasibility(candidate) {
        let feasibilityScore = 0.7; // Base feasibility
        
        // High confidence components are more feasible
        if (candidate.scores?.confidence > 0.8) {
            feasibilityScore += 0.2;
        }
        
        // Fewer dependencies are more feasible
        if (candidate.dependencies < 5) {
            feasibilityScore += 0.1;
        } else if (candidate.dependencies > 15) {
            feasibilityScore -= 0.2;
        }
        
        // Learn from historical patterns
        const similarBuilds = this.buildHistory.filter(build => 
            build.decision.candidate.type === candidate.type
        );
        
        if (similarBuilds.length > 0) {
            const successRate = similarBuilds.filter(b => b.success).length / similarBuilds.length;
            feasibilityScore = (feasibilityScore + successRate) / 2;
        }
        
        return Math.max(0.1, Math.min(feasibilityScore, 1.0));
    }
    
    /**
     * Select the best candidate
     */
    selectCandidate(scoredCandidates) {
        if (scoredCandidates.length === 0) {
            return null;
        }
        
        // Check if we have resource constraints
        if (this.activeBuildsCubes.size >= this.config.maxConcurrentBuilds) {
            console.log('⏸️  Resource constraint: Too many active builds');
            return null;
        }
        
        if (this.currentContext.availableResources < this.config.resourceThreshold) {
            console.log('⏸️  Resource constraint: Low available resources');
            return null;
        }
        
        // Return top candidate
        return scoredCandidates[0];
    }
    
    /**
     * Explain a decision in natural language
     */
    explainDecision(selected, candidates) {
        if (!selected) {
            return 'No suitable build candidates found or resource constraints prevent execution';
        }
        
        const reasons = [];
        
        // Main selection reason
        reasons.push(`Selected ${selected.description} (rank #${selected.ranking})`);
        
        // Score breakdown
        const topScoreType = Object.entries(selected.scores)
            .sort((a, b) => b[1] - a[1])[0];
        reasons.push(`Highest in ${topScoreType[0]} (${Math.round(topScoreType[1] * 100)}%)`);
        
        // Context factors
        if (selected.estimated_effort === 'low') {
            reasons.push('Low effort for quick win');
        }
        
        if (selected.type === 'integration') {
            reasons.push(`High compatibility (${Math.round(selected.compatibility * 100)}%)`);
        }
        
        if (candidates.length > 1) {
            reasons.push(`Outscored ${candidates.length - 1} other candidates`);
        }
        
        return reasons.join('; ');
    }
    
    /**
     * Learn from successful builds
     */
    async learnFromSuccess(buildRecord) {
        if (!this.config.adaptiveLearning) return;
        
        const pattern = this.extractSuccessPattern(buildRecord);
        const key = pattern.key;
        
        if (this.successPatterns.has(key)) {
            const existing = this.successPatterns.get(key);
            existing.count++;
            existing.avgBuildTime = (existing.avgBuildTime * (existing.count - 1) + buildRecord.buildTime) / existing.count;
        } else {
            this.successPatterns.set(key, {
                pattern,
                count: 1,
                avgBuildTime: buildRecord.buildTime,
                firstSeen: new Date()
            });
        }
        
        this.stats.adaptationCount++;
        
        console.log(`📚 Learned from success: ${key}`);
    }
    
    /**
     * Learn from failed builds
     */
    async learnFromFailure(buildRecord) {
        if (!this.config.adaptiveLearning) return;
        
        const pattern = this.extractFailurePattern(buildRecord);
        const key = pattern.key;
        
        if (this.failurePatterns.has(key)) {
            const existing = this.failurePatterns.get(key);
            existing.count++;
        } else {
            this.failurePatterns.set(key, {
                pattern,
                count: 1,
                firstSeen: new Date()
            });
        }
        
        // Adjust future scoring for similar patterns
        this.adjustFutureScoring(pattern);
        
        this.stats.adaptationCount++;
        
        console.log(`📚 Learned from failure: ${key}`);
    }
    
    /**
     * Start the automated decision loop
     */
    startDecisionLoop() {
        console.log('🔄 Starting automated decision loop...');
        
        const loop = async () => {
            try {
                const decision = await this.makeDecision();
                
                if (decision.candidate && decision.confidence > 0.5) {
                    await this.executeDecision(decision);
                }
            } catch (error) {
                console.error('❌ Decision loop error:', error.message);
            }
            
            // Schedule next decision
            setTimeout(loop, this.config.decisionInterval);
        };
        
        // Start the loop
        setTimeout(loop, 1000);
    }
    
    /**
     * Update current context
     */
    updateContext(contextUpdate) {
        this.currentContext = {
            ...this.currentContext,
            ...contextUpdate,
            timestamp: new Date()
        };
        
        // Update system metrics
        this.currentContext.systemLoad = this.activeBuildsCubes.size / this.config.maxConcurrentBuilds;
        this.currentContext.recentFailures = this.buildHistory
            .filter(b => !b.success && (Date.now() - b.timestamp.getTime()) < 300000) // Last 5 minutes
            .length;
    }
    
    /**
     * Utility functions
     */
    estimateEffort(component) {
        if (component.files.length < 5) return 'low';
        if (component.files.length < 20) return 'medium';
        return 'high';
    }
    
    extractSuccessPattern(buildRecord) {
        return {
            key: `${buildRecord.decision.candidate.type}-${buildRecord.decision.candidate.estimated_effort}`,
            type: buildRecord.decision.candidate.type,
            effort: buildRecord.decision.candidate.estimated_effort,
            fileCount: buildRecord.decision.candidate.fileCount,
            dependencies: buildRecord.decision.candidate.dependencies
        };
    }
    
    extractFailurePattern(buildRecord) {
        return {
            key: `${buildRecord.decision.candidate.type}-${buildRecord.error}`,
            type: buildRecord.decision.candidate.type,
            error: buildRecord.error,
            fileCount: buildRecord.decision.candidate.fileCount
        };
    }
    
    adjustFutureScoring(pattern) {
        // This would adjust scoring weights based on failure patterns
        // Implementation would depend on specific pattern analysis
    }
    
    generateDecisionId() {
        return `decision-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    }
    
    generateBuildId() {
        return `build-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    }
    
    async loadHistoricalData() {
        // Placeholder for loading historical decision data
        console.log('📚 Historical data loaded (placeholder)');
    }
    
    /**
     * Get current status
     */
    getStatus() {
        return {
            stats: this.stats,
            activeBuildsCubes: this.activeBuildsCubes.size,
            queueLength: this.buildQueue.length,
            context: this.currentContext,
            recentDecisions: this.decisionLogs.slice(-5)
        };
    }
    
    /**
     * Get build history
     */
    getBuildHistory() {
        return this.buildHistory;
    }
    
    /**
     * Get decision logs
     */
    getDecisionLogs() {
        return this.decisionLogs;
    }
}

// CLI interface
if (require.main === module) {
    const engine = new CalDecisionEngine({ autoMode: false });
    
    engine.initialize()
        .then(async () => {
            const args = process.argv.slice(2);
            
            if (args.includes('--decide')) {
                console.log('🤔 Making a single decision...');
                const decision = await engine.makeDecision();
                
                if (decision.candidate) {
                    console.log(`\n💡 Decision: ${decision.candidate.description}`);
                    console.log(`🎯 Confidence: ${Math.round(decision.confidence * 100)}%`);
                    console.log(`💭 Reasoning: ${decision.reasoning}`);
                    
                    if (args.includes('--execute')) {
                        console.log('\n🚀 Executing decision...');
                        const result = await engine.executeDecision(decision);
                        if (result.success) {
                            console.log(`✅ Execution successful: ${result.result.name}`);
                        } else {
                            console.log(`❌ Execution failed: ${result.error}`);
                        }
                    }
                } else {
                    console.log('⏸️  No action recommended at this time');
                }
            } else if (args.includes('--status')) {
                const status = engine.getStatus();
                console.log('\n📊 Decision Engine Status:');
                console.log(`Decisions made: ${status.stats.decisionsTodate}`);
                console.log(`Successful builds: ${status.stats.successfulBuilds}`);
                console.log(`Failed builds: ${status.stats.failedBuilds}`);
                console.log(`Active builds: ${status.activeBuildsCubes}`);
                console.log(`Average decision time: ${Math.round(status.stats.averageDecisionTime)}ms`);
            } else if (args.includes('--history')) {
                const history = engine.getBuildHistory();
                console.log(`\n📈 Build History (${history.length} builds):`);
                history.slice(-10).forEach((build, i) => {
                    const status = build.success ? '✅' : '❌';
                    console.log(`${status} ${build.id}: ${build.decision.candidate.description} (${build.buildTime}ms)`);
                });
            } else {
                console.log(`
🧠 CAL Decision Engine

Usage: node cal-decision-engine.js [options]

Options:
  --decide     Make a single decision
  --execute    Execute the decision (use with --decide)
  --status     Show engine status
  --history    Show build history

Examples:
  node cal-decision-engine.js --decide --execute
  node cal-decision-engine.js --status
  
Current Configuration:
  Decision interval: ${engine.config.decisionInterval}ms
  Max concurrent builds: ${engine.config.maxConcurrentBuilds}
  Adaptive learning: ${engine.config.adaptiveLearning ? 'enabled' : 'disabled'}
                `);
            }
        })
        .catch(console.error);
}

module.exports = CalDecisionEngine;