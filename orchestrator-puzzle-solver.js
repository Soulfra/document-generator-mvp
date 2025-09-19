#!/usr/bin/env node

/**
 * 🧩🎯 ORCHESTRATOR PUZZLE SOLVER
 * ==============================
 * 
 * The Ship Captain's Decision Engine:
 * Figures out what to fix next during storms (API limits)
 * Uses XML domain analysis to prioritize repairs
 * Routes around hazards with intelligent fallbacks
 * 
 * Like a seasoned captain navigating treacherous waters,
 * making split-second decisions about where to go next.
 */

const XMLDomainComparisonEngine = require('./xml-domain-comparison-engine');
const DecisionOrchestrator = require('./web-interface/decision-orchestrator');
const fs = require('fs').promises;
const path = require('path');

console.log(`
🧩🎯 ORCHESTRATOR PUZZLE SOLVER 🧩🎯
=====================================
The Ship Captain's Decision Engine
Navigating storms and making repairs
`);

class OrchestratorPuzzleSolver {
    constructor(options = {}) {
        this.config = {
            solverId: `puzzle-solver-${Date.now()}`,
            
            // Storm conditions (API limits)
            stormAwareness: true,
            stormThreshold: 0.8,        // 80% of API limits
            stormFallbackDelay: 5000,   // 5 second delays during storms
            
            // Decision-making parameters
            emergencyMode: false,
            emergencyThreshold: 0.9,    // 90% critical threshold
            repairPrioritization: 'critical-first',
            
            // Puzzle solving configuration
            puzzleComplexity: 'adaptive',
            solutionDepth: 'comprehensive',
            learningFromFailures: true,
            
            // Captain experience settings
            experienceLevel: 'seasoned',    // novice, experienced, seasoned, legendary
            decisionSpeed: 'calculated',     // quick, calculated, methodical
            riskTolerance: 'conservative',   // aggressive, moderate, conservative
            
            ...options
        };
        
        // Initialize subsystems
        this.xmlAnalyzer = new XMLDomainComparisonEngine();
        this.decisionOrchestrator = new DecisionOrchestrator({
            enableMultiCharacterReasoning: true,
            decisionTimeout: this.config.stormFallbackDelay * 2
        });
        
        // Puzzle state tracking
        this.puzzleState = {
            currentPuzzle: null,
            solutionInProgress: false,
            stormConditions: false,
            emergencyActive: false,
            
            // Captain's log
            decisions: [],
            repairs: [],
            navigatedHazards: [],
            lessonsLearned: []
        };
        
        // Storm tracking (API limit monitoring)
        this.stormMonitor = {
            apiUsageTracking: new Map(),
            rateLimitWarnings: new Set(),
            fallbackRoutes: new Map(),
            weatherConditions: 'calm'  // calm, choppy, stormy, hurricane
        };
        
        // Puzzle patterns learned from experience
        this.puzzlePatterns = new Map([
            ['xml-schema-gaps', {
                priority: 1,
                complexity: 'moderate',
                timeToSolve: '30-60 minutes',
                fallbackStrategies: ['manual-schema-generation', 'template-fallback']
            }],
            
            ['api-limit-cascade', {
                priority: 1,
                complexity: 'high',
                timeToSolve: '15-30 minutes',
                fallbackStrategies: ['offline-mode', 'cached-responses', 'alternative-apis']
            }],
            
            ['data-integrity-breach', {
                priority: 1,
                complexity: 'critical',
                timeToSolve: '1-2 hours', 
                fallbackStrategies: ['rollback-and-rebuild', 'emergency-backup']
            }],
            
            ['orchestration-deadlock', {
                priority: 2,
                complexity: 'high',
                timeToSolve: '45 minutes',
                fallbackStrategies: ['restart-services', 'bypass-orchestration']
            }],
            
            ['navigation-route-failure', {
                priority: 2,
                complexity: 'moderate',
                timeToSolve: '20-40 minutes',
                fallbackStrategies: ['alternative-routing', 'manual-failover']
            }]
        ]);
        
        console.log('🧩 Orchestrator Puzzle Solver initialized');
        console.log(`   Solver ID: ${this.config.solverId}`);
        console.log(`   Experience Level: ${this.config.experienceLevel}`);
        console.log(`   Storm Awareness: ${this.config.stormAwareness ? 'Active' : 'Disabled'}`);
        
        this.initialize();
    }
    
    async initialize() {
        console.log('\n⚓ Initializing ship captain systems...');
        
        try {
            // Initialize XML analyzer
            console.log('   🗂️ Starting XML domain analyzer...');
            // xmlAnalyzer initializes itself
            
            // Initialize decision orchestrator  
            console.log('   🎯 Starting decision orchestrator...');
            await this.decisionOrchestrator.initialize();
            
            // Start storm monitoring
            if (this.config.stormAwareness) {
                console.log('   🌪️ Starting storm monitoring...');
                this.startStormMonitoring();
            }
            
            console.log('✅ Ship captain systems ready');
            console.log('🧩 Ready to solve puzzles and navigate storms\n');
            
        } catch (error) {
            console.error('❌ Captain initialization failed:', error.message);
            throw error;
        }
    }
    
    /**
     * Main puzzle solving entry point
     * The captain assesses the situation and decides what to fix first
     */
    async solvePuzzle(puzzleContext = {}) {
        const puzzleId = `puzzle-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        
        console.log('🧩 NEW PUZZLE DETECTED');
        console.log('======================');
        console.log(`   Puzzle ID: ${puzzleId}`);
        console.log(`   Storm Conditions: ${this.stormMonitor.weatherConditions}`);
        console.log(`   Emergency Mode: ${this.config.emergencyMode}\n`);
        
        const solutionStartTime = Date.now();
        
        try {
            // Phase 1: Assess the situation (XML domain analysis)
            console.log('🔍 Phase 1: Situation Assessment...');
            const situationReport = await this.assessSituation(puzzleContext);
            
            // Phase 2: Identify the core puzzle
            console.log('🧩 Phase 2: Puzzle Identification...');
            const puzzleAnalysis = await this.identifyPuzzle(situationReport);
            
            // Phase 3: Check storm conditions (API limits)
            console.log('🌪️ Phase 3: Storm Conditions Check...');
            const stormAnalysis = await this.analyzeStormConditions();
            
            // Phase 4: Generate solution strategy
            console.log('🎯 Phase 4: Solution Strategy Generation...');
            const solutionStrategy = await this.generateSolutionStrategy(
                puzzleAnalysis, 
                stormAnalysis, 
                situationReport
            );
            
            // Phase 5: Execute solution with fallbacks
            console.log('⚙️ Phase 5: Solution Execution...');
            const executionResult = await this.executeSolutionStrategy(solutionStrategy);
            
            // Phase 6: Learn from the experience
            console.log('📚 Phase 6: Learning Integration...');
            await this.integrateLearning(puzzleAnalysis, solutionStrategy, executionResult);
            
            const solutionTime = Date.now() - solutionStartTime;
            
            console.log('\n🎯 PUZZLE SOLVED!');
            console.log('=================');
            console.log(`   Solution Time: ${solutionTime}ms`);
            console.log(`   Strategy: ${solutionStrategy.approach}`);
            console.log(`   Success Rate: ${(executionResult.successRate * 100).toFixed(1)}%`);
            console.log(`   Storm Navigation: ${executionResult.stormNavigation ? 'Success' : 'Not Required'}`);
            
            return {
                puzzleId,
                solved: true,
                solutionTime,
                strategy: solutionStrategy,
                result: executionResult,
                lessonsLearned: this.puzzleState.lessonsLearned.slice(-5) // Last 5 lessons
            };
            
        } catch (error) {
            console.error(`❌ Puzzle solving failed: ${puzzleId}`, error.message);
            
            // Emergency fallback
            const emergencyResult = await this.emergencyFallback(puzzleId, error);
            
            return {
                puzzleId,
                solved: false,
                error: error.message,
                emergencyFallback: emergencyResult
            };
        }
    }
    
    /**
     * Phase 1: Assess the situation using XML domain analysis
     */
    async assessSituation(puzzleContext) {
        console.log('   🗂️ Running XML domain analysis...');
        
        const xmlReport = await this.xmlAnalyzer.analyzeAllDomains();
        const shipStatus = this.xmlAnalyzer.getShipStatus();
        
        console.log(`   🚢 Ship Status: ${shipStatus.overall.toUpperCase()}`);
        console.log(`   🔧 Critical Issues: ${shipStatus.criticalGaps}`);
        console.log(`   ⏱️ Repair Estimate: ${shipStatus.repairEstimate}`);
        
        return {
            xmlReport,
            shipStatus,
            timestamp: Date.now(),
            context: puzzleContext,
            urgency: this.calculateUrgency(shipStatus)
        };
    }
    
    /**
     * Phase 2: Identify the specific puzzle to solve
     */
    async identifyPuzzle(situationReport) {
        console.log('   🧩 Analyzing puzzle patterns...');
        
        // Use the decision orchestrator with enhanced prompt engineering
        const puzzleIdentificationPrompt = this.buildPuzzleIdentificationPrompt(situationReport);
        
        const puzzleAnalysis = await this.decisionOrchestrator.reasoningBus.reason(
            puzzleIdentificationPrompt
        );
        
        // Extract puzzle type and characteristics
        const puzzleType = this.extractPuzzleType(puzzleAnalysis, situationReport);
        const puzzleCharacteristics = this.analyzePuzzleCharacteristics(puzzleType, situationReport);
        
        console.log(`   🎯 Puzzle Type: ${puzzleType}`);
        console.log(`   📊 Complexity: ${puzzleCharacteristics.complexity}`);
        console.log(`   ⚡ Priority: ${puzzleCharacteristics.priority}`);
        
        return {
            type: puzzleType,
            characteristics: puzzleCharacteristics,
            analysis: puzzleAnalysis,
            situationReport,
            confidence: puzzleCharacteristics.identificationConfidence || 0.7
        };
    }
    
    /**
     * Phase 3: Analyze storm conditions (API limits and system stress)
     */
    async analyzeStormConditions() {
        console.log('   🌪️ Checking weather conditions...');
        
        const stormData = {
            weatherConditions: this.stormMonitor.weatherConditions,
            apiUsage: this.getCurrentAPIUsage(),
            rateLimitWarnings: Array.from(this.stormMonitor.rateLimitWarnings),
            systemLoad: await this.getSystemLoad(),
            emergencyConditions: this.detectEmergencyConditions()
        };
        
        // Update weather conditions based on current data
        this.updateWeatherConditions(stormData);
        
        console.log(`   🌪️ Weather: ${stormData.weatherConditions}`);
        console.log(`   📊 API Usage: ${stormData.apiUsage.percentage}%`);
        console.log(`   🚨 Emergency: ${stormData.emergencyConditions ? 'YES' : 'NO'}`);
        
        return stormData;
    }
    
    /**
     * Phase 4: Generate solution strategy with storm navigation
     */
    async generateSolutionStrategy(puzzleAnalysis, stormAnalysis, situationReport) {
        console.log('   🎯 Crafting solution strategy...');
        
        // Build comprehensive strategy prompt
        const strategyPrompt = this.buildStrategyPrompt(
            puzzleAnalysis, 
            stormAnalysis, 
            situationReport
        );
        
        // Use decision orchestrator for strategic thinking
        const strategicAnalysis = await this.decisionOrchestrator.reasoningBus.reason(
            strategyPrompt
        );
        
        // Generate strategy based on analysis
        const baseStrategy = this.extractStrategy(strategicAnalysis);
        
        // Add storm navigation elements
        const stormAwareStrategy = this.addStormNavigation(baseStrategy, stormAnalysis);
        
        // Add fallback routes
        const robustStrategy = this.addFallbackRoutes(stormAwareStrategy, puzzleAnalysis);
        
        console.log(`   🎯 Strategy: ${robustStrategy.approach}`);
        console.log(`   🌪️ Storm Navigation: ${robustStrategy.stormAware ? 'Enabled' : 'Not Needed'}`);
        console.log(`   🛟 Fallbacks: ${robustStrategy.fallbackRoutes.length} routes`);
        
        return robustStrategy;
    }
    
    /**
     * Phase 5: Execute the solution strategy
     */
    async executeSolutionStrategy(strategy) {
        console.log('   ⚙️ Executing solution strategy...');
        
        const executionSteps = strategy.steps || [];
        const executionResults = [];
        let overallSuccess = true;
        let stormNavigation = false;
        
        for (let i = 0; i < executionSteps.length; i++) {
            const step = executionSteps[i];
            
            console.log(`   📋 Step ${i + 1}/${executionSteps.length}: ${step.description}`);
            
            try {
                // Check storm conditions before each step
                if (this.config.stormAwareness && this.isStormyWeather()) {
                    console.log('   🌪️ Storm detected - engaging storm navigation...');
                    stormNavigation = true;
                    await this.navigateStorm(step);
                }
                
                // Execute the step
                const stepResult = await this.executeStep(step);
                executionResults.push(stepResult);
                
                if (!stepResult.success) {
                    console.log(`   ⚠️ Step ${i + 1} partially failed - trying fallback...`);
                    
                    // Try fallback approach
                    const fallbackResult = await this.executeFallback(step, strategy.fallbackRoutes);
                    if (!fallbackResult.success) {
                        overallSuccess = false;
                        break;
                    }
                }
                
            } catch (error) {
                console.error(`   ❌ Step ${i + 1} failed:`, error.message);
                overallSuccess = false;
                break;
            }
        }
        
        const successRate = executionResults.filter(r => r.success).length / executionResults.length;
        
        console.log(`   📊 Execution Success Rate: ${(successRate * 100).toFixed(1)}%`);
        
        return {
            success: overallSuccess,
            successRate,
            stormNavigation,
            results: executionResults,
            finalState: overallSuccess ? 'completed' : 'partial'
        };
    }
    
    /**
     * Phase 6: Integrate learning from the puzzle-solving experience
     */
    async integrateLearning(puzzleAnalysis, strategy, executionResult) {
        console.log('   📚 Integrating lessons learned...');
        
        const lesson = {
            timestamp: Date.now(),
            puzzleType: puzzleAnalysis.type,
            strategy: strategy.approach,
            success: executionResult.success,
            successRate: executionResult.successRate,
            stormConditions: this.stormMonitor.weatherConditions,
            insight: this.extractInsight(puzzleAnalysis, strategy, executionResult)
        };
        
        this.puzzleState.lessonsLearned.push(lesson);
        
        // Update puzzle patterns based on experience
        this.updatePuzzlePatterns(lesson);
        
        console.log(`   💡 Lesson: ${lesson.insight}`);
        
        return lesson;
    }
    
    // Prompt engineering methods
    buildPuzzleIdentificationPrompt(situationReport) {
        return `
🧩 PUZZLE IDENTIFICATION ANALYSIS
==================================

You are a seasoned ship captain analyzing system problems. Based on this situation report, identify the core puzzle that needs solving.

SITUATION REPORT:
-----------------
Ship Status: ${situationReport.shipStatus.overall}
Hull Integrity: ${situationReport.shipStatus.hull}
Navigation Status: ${situationReport.shipStatus.navigation}  
Cargo Status: ${situationReport.shipStatus.cargo}
Crew Readiness: ${situationReport.shipStatus.crew}
Critical Issues: ${situationReport.shipStatus.criticalGaps}
Repair Estimate: ${situationReport.shipStatus.repairEstimate}
Urgency Level: ${situationReport.urgency}

XML ANALYSIS SUMMARY:
--------------------
${JSON.stringify(situationReport.xmlReport.findings, null, 2)}

PUZZLE PATTERNS TO CONSIDER:
---------------------------
- xml-schema-gaps: Missing or broken XML schemas
- api-limit-cascade: API rate limits causing cascading failures  
- data-integrity-breach: Database inconsistencies or corruption
- orchestration-deadlock: Services unable to communicate
- navigation-route-failure: Broken integration pathways

CAPTAIN'S ASSESSMENT REQUIRED:
-----------------------------
1. What is the PRIMARY puzzle causing the most critical problems?
2. What are the secondary puzzles that might need attention?
3. How urgent is this situation on a scale of 1-10?
4. What are the biggest risks if this puzzle isn't solved quickly?
5. Are there any patterns that suggest this puzzle has occurred before?

Provide your analysis in the voice of an experienced ship captain who has navigated many storms and solved countless puzzles at sea.
        `;
    }
    
    buildStrategyPrompt(puzzleAnalysis, stormAnalysis, situationReport) {
        return `
🎯 SOLUTION STRATEGY DEVELOPMENT
================================

Captain, you've identified the puzzle. Now craft a strategy to solve it while navigating current storm conditions.

PUZZLE ANALYSIS:
---------------
Type: ${puzzleAnalysis.type}
Complexity: ${puzzleAnalysis.characteristics.complexity}
Priority: ${puzzleAnalysis.characteristics.priority}
Confidence: ${(puzzleAnalysis.confidence * 100).toFixed(1)}%

STORM CONDITIONS:
----------------
Weather: ${stormAnalysis.weatherConditions}
API Usage: ${stormAnalysis.apiUsage.percentage}% of limits
Rate Limit Warnings: ${stormAnalysis.rateLimitWarnings.length}
Emergency Conditions: ${stormAnalysis.emergencyConditions ? 'YES' : 'NO'}

KNOWN PUZZLE PATTERNS:
---------------------
${this.serializePuzzlePatterns()}

STRATEGY REQUIREMENTS:
---------------------
1. Must work under current storm conditions
2. Should have fallback routes if primary approach fails
3. Must prioritize based on repair queue from XML analysis
4. Should use existing safeguards and not trigger more API limits
5. Must be executable with current crew readiness level

CAPTAIN'S STRATEGIC THINKING:
----------------------------
Given your experience with similar puzzles and current conditions:

1. What is the optimal approach to solve this puzzle?
2. How can we work around the current storm conditions?
3. What fallback strategies should we prepare?
4. What steps should be executed in what order?
5. How can we prevent this puzzle from recurring?
6. What resources and crew assignments are needed?

Develop a comprehensive strategy that a seasoned captain would use to navigate these treacherous waters while solving the core puzzle.
        `;
    }
    
    // Puzzle analysis methods
    extractPuzzleType(puzzleAnalysis, situationReport) {
        const content = puzzleAnalysis.reasoning[0]?.content.toLowerCase() || '';
        
        // Use pattern matching to identify puzzle type
        if (content.includes('xml') || content.includes('schema')) {
            return 'xml-schema-gaps';
        } else if (content.includes('api limit') || content.includes('rate limit')) {
            return 'api-limit-cascade';
        } else if (content.includes('data') || content.includes('integrity')) {
            return 'data-integrity-breach';
        } else if (content.includes('orchestrat') || content.includes('deadlock')) {
            return 'orchestration-deadlock';
        } else if (content.includes('navigation') || content.includes('route')) {
            return 'navigation-route-failure';
        }
        
        // Fallback based on ship status
        if (situationReport.shipStatus.hull === 'critical') {
            return 'xml-schema-gaps';
        } else if (situationReport.shipStatus.navigation === 'critical') {
            return 'navigation-route-failure';
        }
        
        return 'unknown-puzzle';
    }
    
    analyzePuzzleCharacteristics(puzzleType, situationReport) {
        const knownPattern = this.puzzlePatterns.get(puzzleType);
        
        if (knownPattern) {
            return {
                complexity: knownPattern.complexity,
                priority: knownPattern.priority,
                timeToSolve: knownPattern.timeToSolve,
                identificationConfidence: 0.9
            };
        }
        
        // Analyze based on situation if unknown pattern
        return {
            complexity: situationReport.urgency > 0.8 ? 'high' : 'moderate',
            priority: situationReport.shipStatus.criticalGaps > 0 ? 1 : 2,
            timeToSolve: 'unknown',
            identificationConfidence: 0.5
        };
    }
    
    extractStrategy(strategicAnalysis) {
        const content = strategicAnalysis.reasoning[0]?.content || '';
        
        // Extract strategy approach from reasoning
        let approach = 'systematic-repair';
        if (content.includes('emergency')) {
            approach = 'emergency-response';
        } else if (content.includes('fallback')) {
            approach = 'fallback-first';
        } else if (content.includes('bypass')) {
            approach = 'bypass-and-repair';
        }
        
        return {
            approach,
            reasoning: content,
            steps: this.extractSteps(content),
            estimatedTime: this.extractTimeEstimate(content)
        };
    }
    
    addStormNavigation(strategy, stormAnalysis) {
        const stormAware = stormAnalysis.weatherConditions !== 'calm';
        
        if (stormAware) {
            // Add storm navigation modifications
            strategy.stormAware = true;
            strategy.stormDelays = this.config.stormFallbackDelay;
            strategy.stormSafeSteps = this.identifyStormSafeSteps(strategy.steps);
        }
        
        return strategy;
    }
    
    addFallbackRoutes(strategy, puzzleAnalysis) {
        const knownPattern = this.puzzlePatterns.get(puzzleAnalysis.type);
        
        strategy.fallbackRoutes = knownPattern?.fallbackStrategies || [
            'manual-intervention',
            'system-restart',
            'emergency-backup'
        ];
        
        return strategy;
    }
    
    // Execution methods
    async executeStep(step) {
        // Simulate step execution based on type
        const stepType = step.type || 'repair';
        
        switch (stepType) {
            case 'xml-schema-repair':
                return await this.repairXMLSchema(step);
            
            case 'api-limit-bypass':
                return await this.bypassAPILimits(step);
                
            case 'data-integrity-fix':
                return await this.fixDataIntegrity(step);
                
            case 'orchestration-restart':
                return await this.restartOrchestration(step);
                
            default:
                return this.executeGenericStep(step);
        }
    }
    
    async executeFallback(step, fallbackRoutes) {
        console.log(`   🛟 Executing fallback for: ${step.description}`);
        
        for (const fallbackType of fallbackRoutes) {
            try {
                const fallbackResult = await this.executeFallbackType(fallbackType, step);
                if (fallbackResult.success) {
                    return fallbackResult;
                }
            } catch (error) {
                console.warn(`   ⚠️ Fallback ${fallbackType} failed:`, error.message);
            }
        }
        
        return { success: false, reason: 'all-fallbacks-failed' };
    }
    
    async repairXMLSchema(step) {
        console.log(`     🔧 Repairing XML schema: ${step.target}`);
        
        // Simulate XML schema repair
        await this.delay(1000);
        
        return {
            success: true,
            type: 'xml-schema-repair',
            target: step.target,
            duration: 1000
        };
    }
    
    async bypassAPILimits(step) {
        console.log(`     🌪️ Bypassing API limits for: ${step.target}`);
        
        // Add to storm routing
        this.stormMonitor.fallbackRoutes.set(step.target, 'offline-mode');
        
        await this.delay(this.config.stormFallbackDelay);
        
        return {
            success: true,
            type: 'api-limit-bypass',
            target: step.target,
            method: 'offline-mode',
            duration: this.config.stormFallbackDelay
        };
    }
    
    async fixDataIntegrity(step) {
        console.log(`     📦 Fixing data integrity: ${step.target}`);
        
        await this.delay(2000);
        
        return {
            success: true,
            type: 'data-integrity-fix',
            target: step.target,
            duration: 2000
        };
    }
    
    async restartOrchestration(step) {
        console.log(`     👥 Restarting orchestration: ${step.target}`);
        
        await this.delay(3000);
        
        return {
            success: true,
            type: 'orchestration-restart',
            target: step.target,
            duration: 3000
        };
    }
    
    executeGenericStep(step) {
        console.log(`     ⚙️ Executing: ${step.description}`);
        
        return {
            success: Math.random() > 0.2, // 80% success rate
            type: 'generic',
            description: step.description
        };
    }
    
    // Storm navigation methods
    startStormMonitoring() {
        setInterval(() => {
            this.updateAPIUsageTracking();
            this.checkForRateLimitWarnings();
            this.updateWeatherConditions();
        }, 10000); // Check every 10 seconds
        
        console.log('   🌪️ Storm monitoring active');
    }
    
    updateAPIUsageTracking() {
        // Simulate API usage tracking
        const mockUsage = {
            percentage: Math.floor(Math.random() * 100),
            requestsPerMinute: Math.floor(Math.random() * 1000),
            remainingQuota: Math.floor(Math.random() * 10000)
        };
        
        this.stormMonitor.apiUsageTracking.set('current', mockUsage);
        
        // Check for storm conditions
        if (mockUsage.percentage > 80) {
            this.stormMonitor.rateLimitWarnings.add('high-usage-detected');
        }
    }
    
    checkForRateLimitWarnings() {
        const usage = this.stormMonitor.apiUsageTracking.get('current');
        
        if (usage && usage.percentage > this.config.stormThreshold * 100) {
            this.stormMonitor.rateLimitWarnings.add('approaching-limits');
            
            if (usage.percentage > this.config.emergencyThreshold * 100) {
                this.puzzleState.emergencyActive = true;
            }
        }
    }
    
    updateWeatherConditions(stormData = null) {
        if (!stormData) {
            stormData = {
                apiUsage: this.stormMonitor.apiUsageTracking.get('current') || { percentage: 0 },
                rateLimitWarnings: Array.from(this.stormMonitor.rateLimitWarnings),
                emergencyConditions: this.puzzleState.emergencyActive
            };
        }
        
        // Determine weather conditions
        if (stormData.emergencyConditions) {
            this.stormMonitor.weatherConditions = 'hurricane';
        } else if (stormData.apiUsage.percentage > 80) {
            this.stormMonitor.weatherConditions = 'stormy';
        } else if (stormData.apiUsage.percentage > 60) {
            this.stormMonitor.weatherConditions = 'choppy';
        } else {
            this.stormMonitor.weatherConditions = 'calm';
        }
    }
    
    async navigateStorm(step) {
        console.log(`     🌪️ Storm navigation for step: ${step.description}`);
        
        // Apply storm delay
        await this.delay(this.config.stormFallbackDelay);
        
        // Switch to offline mode if possible
        if (step.canRunOffline) {
            step.mode = 'offline';
        }
        
        return true;
    }
    
    isStormyWeather() {
        return this.stormMonitor.weatherConditions === 'stormy' || 
               this.stormMonitor.weatherConditions === 'hurricane';
    }
    
    // Emergency procedures
    async emergencyFallback(puzzleId, error) {
        console.log('🚨 EMERGENCY PROCEDURES ACTIVATED');
        console.log('===================================');
        console.log(`   Puzzle: ${puzzleId}`);
        console.log(`   Error: ${error.message}`);
        
        // Emergency actions
        const emergencyActions = [
            'Switch to offline mode',
            'Activate cached responses', 
            'Bypass non-critical systems',
            'Alert crew for manual intervention',
            'Prepare emergency backup systems'
        ];
        
        console.log('   🛟 Emergency Actions:');
        emergencyActions.forEach((action, i) => {
            console.log(`   ${i + 1}. ${action}`);
        });
        
        return {
            activated: true,
            actions: emergencyActions,
            timestamp: Date.now(),
            status: 'emergency-procedures-active'
        };
    }
    
    // Utility methods
    calculateUrgency(shipStatus) {
        let urgency = 0;
        
        if (shipStatus.overall === 'unseaworthy') urgency += 0.9;
        else if (shipStatus.overall === 'needs-repairs') urgency += 0.6;
        else if (shipStatus.overall === 'seaworthy-with-caution') urgency += 0.3;
        
        if (shipStatus.criticalGaps > 0) urgency += 0.1 * shipStatus.criticalGaps;
        
        return Math.min(urgency, 1.0);
    }
    
    getCurrentAPIUsage() {
        return this.stormMonitor.apiUsageTracking.get('current') || { percentage: 0 };
    }
    
    async getSystemLoad() {
        // Mock system load
        return {
            cpu: Math.random(),
            memory: Math.random(),
            network: Math.random()
        };
    }
    
    detectEmergencyConditions() {
        return this.puzzleState.emergencyActive || 
               this.stormMonitor.rateLimitWarnings.has('critical-failure');
    }
    
    extractSteps(content) {
        // Extract steps from reasoning content
        const stepPattern = /\d+\.\s*([^\n]+)/g;
        const steps = [];
        let match;
        
        while ((match = stepPattern.exec(content)) !== null) {
            steps.push({
                description: match[1].trim(),
                type: this.inferStepType(match[1]),
                canRunOffline: this.canRunOffline(match[1])
            });
        }
        
        return steps.length > 0 ? steps : [
            { description: 'Analyze problem', type: 'analysis', canRunOffline: true },
            { description: 'Apply solution', type: 'repair', canRunOffline: false },
            { description: 'Verify fix', type: 'verification', canRunOffline: true }
        ];
    }
    
    inferStepType(stepDescription) {
        const desc = stepDescription.toLowerCase();
        
        if (desc.includes('xml') || desc.includes('schema')) return 'xml-schema-repair';
        if (desc.includes('api') || desc.includes('limit')) return 'api-limit-bypass';
        if (desc.includes('data') || desc.includes('integrity')) return 'data-integrity-fix';
        if (desc.includes('restart') || desc.includes('orchestrat')) return 'orchestration-restart';
        
        return 'generic';
    }
    
    canRunOffline(stepDescription) {
        const desc = stepDescription.toLowerCase();
        return desc.includes('analyze') || desc.includes('verify') || desc.includes('check');
    }
    
    extractTimeEstimate(content) {
        const timePattern = /(\d+)\s*(minute|hour|second)/gi;
        const match = timePattern.exec(content);
        
        return match ? `${match[1]} ${match[2]}s` : 'estimated 30 minutes';
    }
    
    identifyStormSafeSteps(steps) {
        return steps.filter(step => step.canRunOffline);
    }
    
    async executeFallbackType(fallbackType, step) {
        console.log(`     🛟 Trying ${fallbackType} fallback...`);
        
        await this.delay(500);
        
        return {
            success: Math.random() > 0.3, // 70% success rate for fallbacks
            fallbackType,
            step: step.description
        };
    }
    
    extractInsight(puzzleAnalysis, strategy, executionResult) {
        if (!executionResult.success) {
            return `Puzzle ${puzzleAnalysis.type} requires different approach - ${strategy.approach} was not sufficient`;
        }
        
        if (executionResult.stormNavigation) {
            return `Successfully navigated storm while solving ${puzzleAnalysis.type} - storm procedures work`;
        }
        
        return `${strategy.approach} strategy effective for ${puzzleAnalysis.type} puzzles`;
    }
    
    updatePuzzlePatterns(lesson) {
        const pattern = this.puzzlePatterns.get(lesson.puzzleType);
        
        if (pattern) {
            // Update success rate or characteristics based on lesson
            pattern.lastSuccess = lesson.success;
            pattern.lastAttempt = lesson.timestamp;
        }
    }
    
    serializePuzzlePatterns() {
        return Array.from(this.puzzlePatterns.entries())
            .map(([type, pattern]) => `${type}: ${pattern.complexity} complexity, ${pattern.timeToSolve}`)
            .join('\n');
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Public API
    getStatus() {
        return {
            solverId: this.config.solverId,
            currentPuzzle: this.puzzleState.currentPuzzle,
            stormConditions: this.stormMonitor.weatherConditions,
            emergencyActive: this.puzzleState.emergencyActive,
            puzzlesSolved: this.puzzleState.decisions.length,
            lessonsLearned: this.puzzleState.lessonsLearned.length,
            experienceLevel: this.config.experienceLevel
        };
    }
    
    getNavigationChart() {
        return {
            weatherConditions: this.stormMonitor.weatherConditions,
            apiUsage: this.getCurrentAPIUsage(),
            rateLimitWarnings: Array.from(this.stormMonitor.rateLimitWarnings),
            fallbackRoutes: Object.fromEntries(this.stormMonitor.fallbackRoutes),
            safeHarbors: this.identifySafeHarbors()
        };
    }
    
    identifySafeHarbors() {
        // Identify systems that can run offline during storms
        return [
            'local-templates',
            'cached-responses',
            'offline-analysis',
            'emergency-backup'
        ];
    }
    
    async exportPuzzleLog(outputPath = './puzzle-solving-log.json') {
        const puzzleLog = {
            solver: {
                id: this.config.solverId,
                experienceLevel: this.config.experienceLevel,
                configuration: this.config
            },
            puzzleState: this.puzzleState,
            stormData: {
                currentWeather: this.stormMonitor.weatherConditions,
                apiUsage: this.getCurrentAPIUsage(),
                warnings: Array.from(this.stormMonitor.rateLimitWarnings)
            },
            patterns: Object.fromEntries(this.puzzlePatterns),
            timestamp: new Date().toISOString()
        };
        
        await fs.writeFile(outputPath, JSON.stringify(puzzleLog, null, 2));
        console.log(`📤 Puzzle log exported: ${outputPath}`);
        return outputPath;
    }
    
    async shutdown() {
        console.log('⚓ Captain retiring to quarters...');
        
        // Export final log
        await this.exportPuzzleLog();
        
        // Shutdown subsystems
        if (this.decisionOrchestrator) {
            await this.decisionOrchestrator.shutdown();
        }
        
        console.log('✅ Ship captain systems shutdown complete');
    }
}

module.exports = OrchestratorPuzzleSolver;

// CLI interface
if (require.main === module) {
    console.log('⚓ Starting Orchestrator Puzzle Solver...\n');
    
    const puzzleSolver = new OrchestratorPuzzleSolver({
        experienceLevel: 'seasoned',
        stormAwareness: true,
        emergencyThreshold: 0.85
    });
    
    // Test puzzle solving
    puzzleSolver.solvePuzzle({
        description: 'System showing critical XML schema gaps and API limit warnings',
        urgency: 'high',
        context: 'User reported API limits being hit despite safeguards'
    }).then(async (result) => {
        console.log('\n🎯 PUZZLE SOLVING COMPLETE!');
        console.log('============================');
        
        if (result.solved) {
            console.log(`✅ Puzzle solved successfully!`);
            console.log(`⏱️ Solution time: ${result.solutionTime}ms`);
            console.log(`🎯 Strategy: ${result.strategy.approach}`);
            
            if (result.result.stormNavigation) {
                console.log(`🌪️ Successfully navigated storm conditions!`);
            }
            
            console.log('\n📚 Recent Lessons Learned:');
            result.lessonsLearned.forEach((lesson, i) => {
                console.log(`   ${i + 1}. ${lesson.insight}`);
            });
            
        } else {
            console.log(`❌ Puzzle solving failed: ${result.error}`);
            if (result.emergencyFallback) {
                console.log('🚨 Emergency procedures activated');
            }
        }
        
        // Show navigation chart
        const nav = puzzleSolver.getNavigationChart();
        console.log('\n🧭 Navigation Chart:');
        console.log(`   Weather: ${nav.weatherConditions}`);
        console.log(`   API Usage: ${nav.apiUsage.percentage}%`);
        console.log(`   Safe Harbors: ${nav.safeHarbors.join(', ')}`);
        
        await puzzleSolver.shutdown();
        
    }).catch(async (error) => {
        console.error('\n❌ Critical failure in puzzle solver:', error.message);
        console.log('🚨 Activating emergency procedures...');
        await puzzleSolver.shutdown();
    });
}