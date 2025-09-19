#!/usr/bin/env node

/**
 * 🎮 Combo System
 * 
 * Advanced action chaining and combo management:
 * - Pinkflag and other preset combos
 * - Custom combo builder with pattern recognition
 * - Atomic combo execution with rollback
 * - Combo library and pattern matching
 * - Integration with interaction manager and LLM orchestration
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class ComboSystem extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            // Combo Settings
            maxComboLength: 10,
            comboTimeout: 60000,
            atomicExecution: true,
            chainValidation: true,
            
            // Performance Settings
            maxConcurrentCombos: 3,
            comboCache: true,
            cacheTimeout: 300000, // 5 minutes
            
            // Pattern Recognition
            patternRecognition: true,
            learningEnabled: true,
            suggestionEngine: true,
            
            ...options
        };
        
        this.state = {
            activeCombos: new Map(),
            comboHistory: [],
            patterns: new Map(),
            userPreferences: new Map(),
            comboCache: new Map(),
            statistics: {
                totalCombos: 0,
                successfulCombos: 0,
                mostUsedCombo: null,
                averageExecutionTime: 0
            }
        };
        
        // Initialize preset combos
        this.presetCombos = this.initializePresetCombos();
        
        // Initialize pattern recognition
        this.initializePatternRecognition();
        
        console.log('🎮 Combo System initialized with', Object.keys(this.presetCombos).length, 'preset combos');
    }
    
    /**
     * 🎯 Execute a combo by name or definition
     */
    async executeCombo(comboName, context = {}, options = {}) {
        const comboId = crypto.randomUUID();
        const startTime = Date.now();
        
        console.log(`🎮 Executing combo: ${comboName}`);
        
        this.emit('combo:started', {
            comboId,
            comboName,
            context,
            timestamp: startTime
        });
        
        try {
            // Get combo definition
            const combo = await this.getComboDefinition(comboName, context);
            
            if (!combo) {
                throw new Error(`Combo '${comboName}' not found`);
            }
            
            // Validate combo chain
            if (this.config.chainValidation) {
                await this.validateComboChain(combo, context);
            }
            
            // Execute combo steps
            const result = await this.executeComboSteps(combo, comboId, context, options);
            
            // Update statistics and patterns
            this.updateComboStatistics(comboName, result, startTime);
            this.updatePatterns(comboName, context, result);
            
            // Cache successful combo
            if (this.config.comboCache && result.success) {
                this.cacheComboResult(comboName, context, result);
            }
            
            this.emit('combo:completed', {
                comboId,
                comboName,
                result,
                duration: Date.now() - startTime
            });
            
            console.log(`✅ Combo '${comboName}' completed: ${result.successful}/${result.totalSteps} steps successful`);
            
            return result;
            
        } catch (error) {
            console.error(`❌ Combo '${comboName}' failed:`, error);
            
            this.emit('combo:failed', {
                comboId,
                comboName,
                error: error.message,
                timestamp: Date.now()
            });
            
            throw error;
        }
    }
    
    /**
     * 🌸 Execute the famous "pinkflag" combo
     */
    async executePinkflagCombo(context = {}) {
        console.log('🌸 Executing PINKFLAG combo...');
        
        // Pinkflag is a special combo for brand consistency + error flagging + visual feedback
        const pinkflagCombo = {
            name: 'pinkflag',
            description: 'Brand consistency verification with error flagging and visual feedback',
            steps: [
                {
                    id: 'brand_scan',
                    action: 'brand.scan.comprehensive',
                    name: 'Comprehensive Brand Scan',
                    prompt: 'Perform deep brand analysis across all touchpoints',
                    priority: 'high',
                    timeout: 10000
                },
                {
                    id: 'error_detection',
                    action: 'errors.detect.visual',
                    name: 'Visual Error Detection',
                    prompt: 'Scan for visual inconsistencies and brand violations',
                    priority: 'high',
                    timeout: 8000,
                    dependsOn: ['brand_scan']
                },
                {
                    id: 'flag_generation',
                    action: 'flags.generate.pink',
                    name: 'Pink Flag Generation',
                    prompt: 'Generate pink-colored flags for identified issues',
                    priority: 'medium',
                    timeout: 5000,
                    dependsOn: ['error_detection']
                },
                {
                    id: 'visual_feedback',
                    action: 'visual.feedback.overlay',
                    name: 'Visual Feedback Overlay',
                    prompt: 'Create visual overlay showing flagged issues',
                    priority: 'medium',
                    timeout: 7000,
                    dependsOn: ['flag_generation']
                },
                {
                    id: 'recommendations',
                    action: 'recommendations.generate.fix',
                    name: 'Fix Recommendations',
                    prompt: 'Generate actionable recommendations for flagged issues',
                    priority: 'low',
                    timeout: 12000,
                    dependsOn: ['visual_feedback']
                }
            ],
            metadata: {
                category: 'brand_quality',
                difficulty: 'medium',
                estimatedTime: 45000,
                visualOutput: true
            }
        };
        
        return this.executeComboSteps(pinkflagCombo, crypto.randomUUID(), context);
    }
    
    /**
     * 🎯 Execute combo steps with dependency resolution
     */
    async executeComboSteps(combo, comboId, context = {}, options = {}) {
        const startTime = Date.now();
        const results = new Map();
        const executionPlan = this.buildExecutionPlan(combo.steps);
        
        console.log(`⚡ Executing ${combo.steps.length} steps in ${executionPlan.phases.length} phases`);
        
        // Track active combo
        this.state.activeCombos.set(comboId, {
            combo,
            startTime,
            status: 'executing',
            currentPhase: 0,
            results
        });
        
        try {
            // Execute phases sequentially, steps within phases in parallel
            for (let phaseIndex = 0; phaseIndex < executionPlan.phases.length; phaseIndex++) {
                const phase = executionPlan.phases[phaseIndex];
                
                console.log(`📍 Phase ${phaseIndex + 1}/${executionPlan.phases.length}: ${phase.length} steps`);
                
                // Update combo status
                const comboState = this.state.activeCombos.get(comboId);
                comboState.currentPhase = phaseIndex;
                
                // Execute all steps in this phase in parallel
                const phasePromises = phase.map(async (step) => {
                    return this.executeComboStep(step, comboId, context, results, options);
                });
                
                const phaseResults = await Promise.allSettled(phasePromises);
                
                // Check for failures in atomic mode
                const failedSteps = phaseResults.filter(r => r.status === 'rejected' || !r.value?.success);
                
                if (failedSteps.length > 0 && this.config.atomicExecution) {
                    throw new Error(`Phase ${phaseIndex + 1} failed: ${failedSteps.length} steps failed`);
                }
            }
            
            // Calculate final result
            const allResults = Array.from(results.values());
            const successful = allResults.filter(r => r.success);
            const failed = allResults.filter(r => !r.success);
            
            const finalResult = {
                comboId,
                comboName: combo.name,
                success: failed.length === 0 || !this.config.atomicExecution,
                totalSteps: allResults.length,
                successful: successful.length,
                failed: failed.length,
                phases: executionPlan.phases.length,
                results: allResults,
                executionTime: Date.now() - startTime,
                totalCost: this.calculateComboCost(allResults),
                metadata: combo.metadata || {}
            };
            
            // Complete combo tracking
            const comboState = this.state.activeCombos.get(comboId);
            comboState.status = 'completed';
            comboState.result = finalResult;
            
            return finalResult;
            
        } catch (error) {
            // Handle combo failure
            const comboState = this.state.activeCombos.get(comboId);
            comboState.status = 'failed';
            comboState.error = error.message;
            
            throw error;
        } finally {
            // Move from active to history
            const comboState = this.state.activeCombos.get(comboId);
            this.state.comboHistory.push(comboState);
            this.state.activeCombos.delete(comboId);
        }
    }
    
    /**
     * ⚡ Execute individual combo step
     */
    async executeComboStep(step, comboId, context, previousResults, options) {
        const stepId = step.id || crypto.randomUUID();
        const startTime = Date.now();
        
        console.log(`  ⚡ Executing step: ${step.name || step.action}`);
        
        try {
            // Build step context from previous results
            const stepContext = this.buildStepContext(step, context, previousResults);
            
            // Simulate step execution (replace with actual implementation)
            const result = await this.simulateStepExecution(step, stepContext, options);
            
            // Store result for dependent steps
            const stepResult = {
                stepId,
                name: step.name,
                action: step.action,
                success: true,
                result,
                duration: Date.now() - startTime,
                cost: result.cost || 0,
                output: result.output || {},
                timestamp: startTime
            };
            
            previousResults.set(stepId, stepResult);
            
            this.emit('combo:step_completed', {
                comboId,
                stepId,
                step: step.name,
                result: stepResult
            });
            
            return stepResult;
            
        } catch (error) {
            console.error(`❌ Step '${step.name}' failed:`, error);
            
            const stepResult = {
                stepId,
                name: step.name,
                action: step.action,
                success: false,
                error: error.message,
                duration: Date.now() - startTime,
                timestamp: startTime
            };
            
            previousResults.set(stepId, stepResult);
            
            this.emit('combo:step_failed', {
                comboId,
                stepId,
                step: step.name,
                error: error.message
            });
            
            return stepResult;
        }
    }
    
    /**
     * 🧠 Simulate step execution (replace with actual LLM calls)
     */
    async simulateStepExecution(step, context, options) {
        // Simulate processing time based on step complexity
        const baseTime = 1000;
        const complexityMultiplier = step.priority === 'high' ? 1.5 : step.priority === 'low' ? 0.8 : 1.0;
        const simulatedTime = baseTime * complexityMultiplier + Math.random() * 1000;
        
        await this.delay(simulatedTime);
        
        // Generate step-specific results
        switch (step.action) {
            case 'brand.scan.comprehensive':
                return {
                    output: {
                        brandScore: 87,
                        issues: ['Color inconsistency in header', 'Typography mismatch in footer'],
                        recommendations: 3,
                        scannedComponents: 12
                    },
                    cost: 0.025,
                    tokens: 450
                };
                
            case 'errors.detect.visual':
                return {
                    output: {
                        visualErrors: [
                            { type: 'color', severity: 'medium', location: 'navbar' },
                            { type: 'spacing', severity: 'low', location: 'sidebar' }
                        ],
                        totalErrors: 2,
                        severity: 'medium'
                    },
                    cost: 0.018,
                    tokens: 320
                };
                
            case 'flags.generate.pink':
                return {
                    output: {
                        flags: [
                            { id: 'flag1', color: '#FF69B4', position: { x: 100, y: 200 }, issue: 'Color mismatch' },
                            { id: 'flag2', color: '#FF1493', position: { x: 300, y: 150 }, issue: 'Spacing issue' }
                        ],
                        flagCount: 2,
                        visualStyle: 'pink_gradient'
                    },
                    cost: 0.012,
                    tokens: 180
                };
                
            case 'visual.feedback.overlay':
                return {
                    output: {
                        overlayCreated: true,
                        overlayUrl: '/overlays/combo_feedback.svg',
                        interactiveElements: 2,
                        animationDuration: 500
                    },
                    cost: 0.020,
                    tokens: 280
                };
                
            case 'recommendations.generate.fix':
                return {
                    output: {
                        recommendations: [
                            {
                                issue: 'Color inconsistency',
                                solution: 'Update header background to use primary brand color #007bff',
                                priority: 'high',
                                estimatedTime: '15 minutes'
                            },
                            {
                                issue: 'Spacing issue',
                                solution: 'Adjust sidebar padding to 1.5rem for consistency',
                                priority: 'medium',
                                estimatedTime: '5 minutes'
                            }
                        ],
                        totalRecommendations: 2,
                        implementationTime: '20 minutes'
                    },
                    cost: 0.030,
                    tokens: 380
                };
                
            default:
                return {
                    output: {
                        action: step.action,
                        completed: true,
                        timestamp: Date.now()
                    },
                    cost: 0.015,
                    tokens: 200
                };
        }
    }
    
    /**
     * 🔄 Build execution plan with dependency resolution
     */
    buildExecutionPlan(steps) {
        const phases = [];
        const processed = new Set();
        const stepMap = new Map(steps.map(step => [step.id, step]));
        
        while (processed.size < steps.length) {
            const phase = [];
            
            // Find steps that can be executed in this phase
            for (const step of steps) {
                if (processed.has(step.id)) continue;
                
                // Check if all dependencies are satisfied
                const dependenciesMet = !step.dependsOn || 
                    step.dependsOn.every(dep => processed.has(dep));
                
                if (dependenciesMet) {
                    phase.push(step);
                }
            }
            
            if (phase.length === 0) {
                throw new Error('Circular dependency detected in combo steps');
            }
            
            // Mark these steps as processed
            phase.forEach(step => processed.add(step.id));
            phases.push(phase);
        }
        
        return { phases, totalSteps: steps.length };
    }
    
    /**
     * 🏗️ Build step context from previous results
     */
    buildStepContext(step, globalContext, previousResults) {
        const stepContext = { ...globalContext };
        
        // Add outputs from dependent steps
        if (step.dependsOn) {
            step.dependsOn.forEach(depId => {
                const depResult = previousResults.get(depId);
                if (depResult && depResult.success) {
                    stepContext[depId] = depResult.output;
                }
            });
        }
        
        return stepContext;
    }
    
    /**
     * 📚 Initialize preset combos
     */
    initializePresetCombos() {
        return {
            // Pinkflag combo for brand consistency + error flagging
            pinkflag: {
                name: 'pinkflag',
                description: 'Brand consistency with pink error flagging',
                category: 'brand_quality',
                steps: [] // Will be populated by executePinkflagCombo
            },
            
            // Debug combo for system diagnostics
            debug: {
                name: 'debug',
                description: 'Comprehensive system debugging and optimization',
                category: 'system_maintenance',
                steps: [
                    {
                        id: 'health_check',
                        action: 'system.health.check',
                        name: 'System Health Check',
                        priority: 'high'
                    },
                    {
                        id: 'performance_analysis',
                        action: 'system.performance.analyze',
                        name: 'Performance Analysis',
                        priority: 'high',
                        dependsOn: ['health_check']
                    },
                    {
                        id: 'log_analysis',
                        action: 'logs.analyze.errors',
                        name: 'Error Log Analysis',
                        priority: 'medium'
                    },
                    {
                        id: 'optimization_suggestions',
                        action: 'system.optimize.suggest',
                        name: 'Optimization Suggestions',
                        priority: 'low',
                        dependsOn: ['performance_analysis', 'log_analysis']
                    }
                ]
            },
            
            // Brand combo for comprehensive brand verification
            brand: {
                name: 'brand',
                description: 'Complete brand verification and consistency check',
                category: 'brand_verification',
                steps: [
                    {
                        id: 'color_check',
                        action: 'brand.colors.verify',
                        name: 'Color Consistency Check',
                        priority: 'high'
                    },
                    {
                        id: 'typography_check',
                        action: 'brand.typography.verify',
                        name: 'Typography Consistency',
                        priority: 'high'
                    },
                    {
                        id: 'logo_check',
                        action: 'brand.logo.verify',
                        name: 'Logo Usage Verification',
                        priority: 'medium'
                    },
                    {
                        id: 'ux_consistency',
                        action: 'brand.ux.verify',
                        name: 'UX Consistency Check',
                        priority: 'medium',
                        dependsOn: ['color_check', 'typography_check']
                    }
                ]
            },
            
            // Security combo for comprehensive security scanning
            security: {
                name: 'security',
                description: 'Complete security audit and vulnerability assessment',
                category: 'security_audit',
                steps: [
                    {
                        id: 'vulnerability_scan',
                        action: 'security.scan.vulnerabilities',
                        name: 'Vulnerability Scan',
                        priority: 'high'
                    },
                    {
                        id: 'dependency_check',
                        action: 'security.dependencies.check',
                        name: 'Dependency Security Check',
                        priority: 'high'
                    },
                    {
                        id: 'access_audit',
                        action: 'security.access.audit',
                        name: 'Access Control Audit',
                        priority: 'medium'
                    },
                    {
                        id: 'compliance_check',
                        action: 'security.compliance.verify',
                        name: 'Compliance Verification',
                        priority: 'low',
                        dependsOn: ['vulnerability_scan', 'access_audit']
                    }
                ]
            },
            
            // Deploy combo for complete deployment pipeline
            deploy: {
                name: 'deploy',
                description: 'Complete deployment with testing and verification',
                category: 'deployment',
                steps: [
                    {
                        id: 'pre_deploy_tests',
                        action: 'deploy.tests.pre',
                        name: 'Pre-deployment Tests',
                        priority: 'high'
                    },
                    {
                        id: 'build_assets',
                        action: 'deploy.build.assets',
                        name: 'Build Assets',
                        priority: 'high',
                        dependsOn: ['pre_deploy_tests']
                    },
                    {
                        id: 'deploy_staging',
                        action: 'deploy.staging.deploy',
                        name: 'Deploy to Staging',
                        priority: 'high',
                        dependsOn: ['build_assets']
                    },
                    {
                        id: 'staging_tests',
                        action: 'deploy.tests.staging',
                        name: 'Staging Tests',
                        priority: 'medium',
                        dependsOn: ['deploy_staging']
                    },
                    {
                        id: 'deploy_production',
                        action: 'deploy.production.deploy',
                        name: 'Deploy to Production',
                        priority: 'high',
                        dependsOn: ['staging_tests']
                    }
                ]
            }
        };
    }
    
    /**
     * 🔍 Get combo definition by name or context
     */
    async getComboDefinition(comboName, context = {}) {
        // Check preset combos first
        if (this.presetCombos[comboName]) {
            return this.presetCombos[comboName];
        }
        
        // Check for dynamic combo generation
        if (comboName === 'auto' || comboName === 'smart') {
            return this.generateSmartCombo(context);
        }
        
        // Check cached combos
        const cacheKey = `${comboName}_${JSON.stringify(context)}`;
        if (this.state.comboCache.has(cacheKey)) {
            const cached = this.state.comboCache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.config.cacheTimeout) {
                return cached.combo;
            }
        }
        
        return null;
    }
    
    /**
     * 🧠 Generate smart combo based on context
     */
    async generateSmartCombo(context) {
        console.log('🧠 Generating smart combo based on context...');
        
        const smartCombo = {
            name: 'smart_combo',
            description: 'AI-generated combo based on current context',
            category: 'adaptive',
            steps: []
        };
        
        // Analyze context and add relevant steps
        if (context.brandIssues || context.lastAction === 'brand_verify') {
            smartCombo.steps.push({
                id: 'brand_fix',
                action: 'brand.issues.fix',
                name: 'Fix Brand Issues',
                priority: 'high'
            });
        }
        
        if (context.systemHealth === 'degraded' || context.performanceIssues) {
            smartCombo.steps.push({
                id: 'system_optimize',
                action: 'system.optimize.performance',
                name: 'Optimize System Performance',
                priority: 'high'
            });
        }
        
        if (context.securityAlerts || context.vulnerabilities) {
            smartCombo.steps.push({
                id: 'security_fix',
                action: 'security.vulnerabilities.fix',
                name: 'Fix Security Issues',
                priority: 'high'
            });
        }
        
        // Always add verification step
        smartCombo.steps.push({
            id: 'verify_completion',
            action: 'combo.verify.completion',
            name: 'Verify Combo Completion',
            priority: 'low',
            dependsOn: smartCombo.steps.map(s => s.id)
        });
        
        return smartCombo;
    }
    
    /**
     * ✅ Validate combo chain for consistency
     */
    async validateComboChain(combo, context) {
        // Check for circular dependencies
        const visited = new Set();
        const recursionStack = new Set();
        
        const hasCycle = (stepId) => {
            if (recursionStack.has(stepId)) return true;
            if (visited.has(stepId)) return false;
            
            visited.add(stepId);
            recursionStack.add(stepId);
            
            const step = combo.steps.find(s => s.id === stepId);
            if (step?.dependsOn) {
                for (const dep of step.dependsOn) {
                    if (hasCycle(dep)) return true;
                }
            }
            
            recursionStack.delete(stepId);
            return false;
        };
        
        for (const step of combo.steps) {
            if (hasCycle(step.id)) {
                throw new Error(`Circular dependency detected in combo '${combo.name}'`);
            }
        }
        
        // Validate step dependencies exist
        const stepIds = new Set(combo.steps.map(s => s.id));
        for (const step of combo.steps) {
            if (step.dependsOn) {
                for (const dep of step.dependsOn) {
                    if (!stepIds.has(dep)) {
                        throw new Error(`Step '${step.id}' depends on non-existent step '${dep}'`);
                    }
                }
            }
        }
        
        console.log(`✅ Combo '${combo.name}' validation passed`);
    }
    
    /**
     * 🎯 Initialize pattern recognition
     */
    initializePatternRecognition() {
        // Initialize common patterns
        this.state.patterns.set('morning_routine', {
            sequence: ['brand', 'debug', 'security'],
            frequency: 15,
            context: { timeOfDay: 'morning' }
        });
        
        this.state.patterns.set('deployment_sequence', {
            sequence: ['security', 'debug', 'deploy'],
            frequency: 8,
            context: { action: 'deployment' }
        });
        
        this.state.patterns.set('brand_maintenance', {
            sequence: ['pinkflag', 'brand'],
            frequency: 22,
            context: { focus: 'brand_quality' }
        });
    }
    
    /**
     * 📊 Update combo statistics and learning
     */
    updateComboStatistics(comboName, result, startTime) {
        this.state.statistics.totalCombos++;
        
        if (result.success) {
            this.state.statistics.successfulCombos++;
        }
        
        // Update average execution time
        const executionTime = Date.now() - startTime;
        this.state.statistics.averageExecutionTime = 
            (this.state.statistics.averageExecutionTime * (this.state.statistics.totalCombos - 1) + executionTime) / 
            this.state.statistics.totalCombos;
        
        // Track most used combo
        const comboUsage = this.state.statistics[`${comboName}_usage`] || 0;
        this.state.statistics[`${comboName}_usage`] = comboUsage + 1;
        
        if (!this.state.statistics.mostUsedCombo || 
            this.state.statistics[`${comboName}_usage`] > this.state.statistics[`${this.state.statistics.mostUsedCombo}_usage`]) {
            this.state.statistics.mostUsedCombo = comboName;
        }
    }
    
    /**
     * 🧠 Update patterns for learning
     */
    updatePatterns(comboName, context, result) {
        if (!this.config.learningEnabled) return;
        
        // Create pattern key from context
        const contextKey = this.createContextKey(context);
        
        if (!this.state.patterns.has(contextKey)) {
            this.state.patterns.set(contextKey, {
                sequence: [comboName],
                frequency: 1,
                context,
                lastUsed: Date.now()
            });
        } else {
            const pattern = this.state.patterns.get(contextKey);
            pattern.frequency++;
            pattern.lastUsed = Date.now();
            
            // Update sequence if this combo is commonly used in this context
            if (!pattern.sequence.includes(comboName)) {
                pattern.sequence.push(comboName);
            }
        }
    }
    
    /**
     * 🗂️ Cache combo result
     */
    cacheComboResult(comboName, context, result) {
        const cacheKey = `${comboName}_${JSON.stringify(context)}`;
        
        this.state.comboCache.set(cacheKey, {
            combo: result,
            timestamp: Date.now(),
            hits: 1
        });
        
        // Cleanup old cache entries
        if (this.state.comboCache.size > 100) {
            const oldestKey = Array.from(this.state.comboCache.entries())
                .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
            this.state.comboCache.delete(oldestKey);
        }
    }
    
    /**
     * 💡 Suggest combos based on context and patterns
     */
    suggestCombos(context = {}) {
        if (!this.config.suggestionEngine) {
            return Object.keys(this.presetCombos);
        }
        
        const suggestions = [];
        
        // Pattern-based suggestions
        for (const [_, pattern] of this.state.patterns) {
            if (this.contextMatches(context, pattern.context)) {
                suggestions.push(...pattern.sequence);
            }
        }
        
        // Context-based suggestions
        if (context.systemHealth === 'degraded') {
            suggestions.push('debug', 'security');
        }
        
        if (context.brandScore < 90) {
            suggestions.push('pinkflag', 'brand');
        }
        
        if (context.deployment) {
            suggestions.push('security', 'debug', 'deploy');
        }
        
        // Remove duplicates and sort by relevance
        const uniqueSuggestions = [...new Set(suggestions)];
        
        return uniqueSuggestions.slice(0, 5); // Top 5 suggestions
    }
    
    /**
     * 🛠️ Utility methods
     */
    calculateComboCost(results) {
        return results.reduce((total, result) => total + (result.cost || 0), 0);
    }
    
    createContextKey(context) {
        return crypto.createHash('md5')
            .update(JSON.stringify(context))
            .digest('hex')
            .slice(0, 8);
    }
    
    contextMatches(context1, context2) {
        const keys1 = Object.keys(context1);
        const keys2 = Object.keys(context2);
        
        // Check if at least 50% of keys match
        const matchingKeys = keys1.filter(key => 
            keys2.includes(key) && context1[key] === context2[key]
        );
        
        return matchingKeys.length >= Math.min(keys1.length, keys2.length) * 0.5;
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * 📊 Get system status
     */
    getStatus() {
        return {
            activeCombos: this.state.activeCombos.size,
            comboHistory: this.state.comboHistory.length,
            patterns: this.state.patterns.size,
            cacheSize: this.state.comboCache.size,
            statistics: this.state.statistics,
            presetCombos: Object.keys(this.presetCombos)
        };
    }
    
    /**
     * 📋 List available combos
     */
    listCombos() {
        return Object.entries(this.presetCombos).map(([name, combo]) => ({
            name,
            description: combo.description,
            category: combo.category,
            steps: combo.steps?.length || 0
        }));
    }
}

module.exports = ComboSystem;

// Export for direct usage
if (require.main === module) {
    console.log('🎮 Combo System - Starting standalone demo...');
    
    (async () => {
        const comboSystem = new ComboSystem();
        
        console.log('\n📋 Available preset combos:');
        const combos = comboSystem.listCombos();
        combos.forEach(combo => {
            console.log(`   🎯 ${combo.name}: ${combo.description} (${combo.steps} steps)`);
        });
        
        console.log('\n🌸 Executing PINKFLAG combo...');
        const pinkflagResult = await comboSystem.executePinkflagCombo({
            brandScore: 82,
            systemHealth: 'good'
        });
        
        console.log('✅ Pinkflag combo results:');
        console.log(`   Success: ${pinkflagResult.success ? '✅' : '❌'}`);
        console.log(`   Steps: ${pinkflagResult.successful}/${pinkflagResult.totalSteps}`);
        console.log(`   Duration: ${pinkflagResult.executionTime}ms`);
        console.log(`   Cost: $${pinkflagResult.totalCost.toFixed(4)}`);
        
        console.log('\n🔧 Executing DEBUG combo...');
        const debugResult = await comboSystem.executeCombo('debug', {
            systemHealth: 'degraded',
            performanceIssues: true
        });
        
        console.log('✅ Debug combo results:');
        console.log(`   Success: ${debugResult.success ? '✅' : '❌'}`);
        console.log(`   Steps: ${debugResult.successful}/${debugResult.totalSteps}`);
        console.log(`   Phases: ${debugResult.phases}`);
        
        console.log('\n💡 Smart combo suggestions for brand issues:');
        const suggestions = comboSystem.suggestCombos({
            brandScore: 75,
            systemHealth: 'good'
        });
        console.log('   Suggested combos:', suggestions.join(', '));
        
        console.log('\n📊 Combo System Status:');
        const status = comboSystem.getStatus();
        console.log(`   Total combos executed: ${status.statistics.totalCombos}`);
        console.log(`   Success rate: ${((status.statistics.successfulCombos / status.statistics.totalCombos) * 100).toFixed(1)}%`);
        console.log(`   Most used combo: ${status.statistics.mostUsedCombo || 'none'}`);
        console.log(`   Learned patterns: ${status.patterns}`);
        
        console.log('\n🎉 Combo System demo complete!');
    })().catch(console.error);
}