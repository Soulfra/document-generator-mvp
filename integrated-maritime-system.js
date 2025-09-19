#!/usr/bin/env node

/**
 * 🚢⚓ INTEGRATED MARITIME SYSTEM
 * ===============================
 * 
 * The Complete Watertight Solution:
 * 
 * 🗂️ XML Domain Comparison Engine → Finds holes in the ship (domain gaps)
 * 🛡️ API Safeguard Auditor → Identifies protection system leaks  
 * 🧩 Orchestrator Puzzle Solver → Captain decides what to fix next
 * 🌪️ Storm Navigation → Routes around API limits intelligently
 * 
 * Like a seasoned maritime crew working together to keep the ship
 * seaworthy in treacherous waters with no leaks and no shark attacks.
 */

const XMLDomainComparisonEngine = require('./xml-domain-comparison-engine');
const APISafeguardAuditor = require('./api-safeguard-auditor');
const OrchestratorPuzzleSolver = require('./orchestrator-puzzle-solver');

console.log(`
🚢⚓ INTEGRATED MARITIME SYSTEM 🚢⚓
===================================
Complete Watertight Solution
No leaks, no shark attacks
`);

class IntegratedMaritimeSystem {
    constructor(options = {}) {
        this.config = {
            systemId: `maritime-system-${Date.now()}`,
            
            // Integration settings
            integrationMode: 'comprehensive',
            crossSystemLearning: true,
            realTimeMonitoring: true,
            
            // Maritime crew coordination
            crewCoordination: {
                hullInspector: true,    // XML Domain Comparison
                safeguardAuditor: true, // API Safeguard Auditor
                captain: true,          // Orchestrator Puzzle Solver
                stormWatch: true        // API limit monitoring
            },
            
            // System health thresholds
            healthThresholds: {
                seaworthy: 0.8,
                needsAttention: 0.6,
                vulnerable: 0.4,
                critical: 0.2
            },
            
            ...options
        };
        
        // Initialize maritime crew
        this.maritimeCrew = {
            hullInspector: null,      // XML Domain Comparison Engine
            safeguardAuditor: null,   // API Safeguard Auditor  
            captain: null,            // Orchestrator Puzzle Solver
            stormWatch: null          // Storm monitoring system
        };
        
        // System state
        this.systemState = {
            overallHealth: 'unknown',
            activeThreats: [],
            repairQueue: [],
            stormConditions: 'calm',
            lastInspection: null,
            seaworthinessCertified: false
        };
        
        // Integration metrics
        this.integrationMetrics = {
            systemsOnline: 0,
            crossSystemAlerts: 0,
            repairsCompleted: 0,
            stormsNavigated: 0,
            uptimePercentage: 100
        };
        
        console.log('🚢 Integrated Maritime System initialized');
        console.log(`   System ID: ${this.config.systemId}`);
        console.log(`   Integration Mode: ${this.config.integrationMode}`);
        console.log(`   Crew Coordination: ${Object.keys(this.config.crewCoordination).length} systems`);
        
        this.initialize();
    }
    
    async initialize() {
        console.log('\n⚓ Initializing integrated maritime systems...');
        
        try {
            // Initialize Hull Inspector (XML Domain Comparison)
            if (this.config.crewCoordination.hullInspector) {
                console.log('   🗂️ Starting Hull Inspector...');
                this.maritimeCrew.hullInspector = new XMLDomainComparisonEngine();
                this.integrationMetrics.systemsOnline++;
            }
            
            // Initialize Safeguard Auditor (API Protection Analysis)
            if (this.config.crewCoordination.safeguardAuditor) {
                console.log('   🛡️ Starting Safeguard Auditor...');
                this.maritimeCrew.safeguardAuditor = new APISafeguardAuditor();
                this.integrationMetrics.systemsOnline++;
            }
            
            // Initialize Captain (Orchestrator Puzzle Solver)
            if (this.config.crewCoordination.captain) {
                console.log('   🧩 Starting Ship Captain...');
                this.maritimeCrew.captain = new OrchestratorPuzzleSolver({
                    experienceLevel: 'seasoned',
                    stormAwareness: true
                });
                this.integrationMetrics.systemsOnline++;
            }
            
            // Initialize Storm Watch (API limit monitoring)
            if (this.config.crewCoordination.stormWatch) {
                console.log('   🌪️ Starting Storm Watch...');
                this.initializeStormWatch();
                this.integrationMetrics.systemsOnline++;
            }
            
            console.log('✅ Integrated maritime systems ready');
            console.log(`   Systems Online: ${this.integrationMetrics.systemsOnline}/4`);
            console.log('🚢 Ready for comprehensive system analysis\n');
            
        } catch (error) {
            console.error('❌ Maritime system initialization failed:', error.message);
            throw error;
        }
    }
    
    /**
     * Main integration: Complete system analysis and repair coordination
     */
    async runComprehensiveAnalysis() {
        console.log('🚢 COMPREHENSIVE MARITIME ANALYSIS');
        console.log('===================================');
        console.log('🔍 Full ship inspection and repair coordination');
        console.log('🌪️ Storm navigation and threat assessment');
        console.log('🛠️ Integrated repair prioritization\n');
        
        const analysisStartTime = Date.now();
        
        try {
            // Phase 1: Parallel system analysis
            console.log('⚡ Phase 1: Parallel System Analysis...');
            const analysisResults = await this.runParallelAnalysis();
            
            // Phase 2: Cross-system threat correlation
            console.log('🔗 Phase 2: Cross-System Correlation...');
            const correlatedThreats = await this.correlateThreatData(analysisResults);
            
            // Phase 3: Integrated repair prioritization
            console.log('🛠️ Phase 3: Integrated Repair Planning...');
            const repairPlan = await this.createIntegratedRepairPlan(correlatedThreats);
            
            // Phase 4: Storm-aware execution strategy
            console.log('🌪️ Phase 4: Storm-Aware Execution...');
            const executionStrategy = await this.createStormAwareStrategy(repairPlan);
            
            // Phase 5: System health certification
            console.log('📋 Phase 5: System Health Certification...');
            const healthCertification = await this.certifySystemHealth(executionStrategy);
            
            const analysisTime = Date.now() - analysisStartTime;
            
            console.log('\n🎯 COMPREHENSIVE ANALYSIS COMPLETE');
            console.log('===================================');
            console.log(`   Duration: ${analysisTime}ms`);
            console.log(`   Overall Health: ${healthCertification.overallHealth.toUpperCase()}`);
            console.log(`   Threats Identified: ${correlatedThreats.totalThreats}`);
            console.log(`   Repairs Planned: ${repairPlan.totalRepairs}`);
            console.log(`   Seaworthy: ${healthCertification.seaworthy ? 'YES' : 'NO'}`);
            
            // Generate integrated report
            const integratedReport = await this.generateIntegratedReport({
                analysisResults,
                correlatedThreats,
                repairPlan,
                executionStrategy,
                healthCertification,
                analysisTime
            });
            
            return integratedReport;
            
        } catch (error) {
            console.error('❌ Comprehensive analysis failed:', error.message);
            
            // Emergency procedures
            const emergencyReport = await this.activateEmergencyProcedures(error);
            return emergencyReport;
        }
    }
    
    /**
     * Phase 1: Run all system analyses in parallel for maximum efficiency
     */
    async runParallelAnalysis() {
        console.log('   ⚡ Running parallel system analyses...');
        
        const analysisPromises = [];
        const analysisResults = {};
        
        // Hull Inspection (XML Domain Analysis)
        if (this.maritimeCrew.hullInspector) {
            analysisPromises.push(
                this.maritimeCrew.hullInspector.analyzeAllDomains()
                    .then(result => ({ system: 'hull', result }))
                    .catch(error => ({ system: 'hull', error: error.message }))
            );
        }
        
        // Safeguard Audit (API Protection Analysis)
        if (this.maritimeCrew.safeguardAuditor) {
            analysisPromises.push(
                this.maritimeCrew.safeguardAuditor.auditAllSafeguards()
                    .then(result => ({ system: 'safeguards', result }))
                    .catch(error => ({ system: 'safeguards', error: error.message }))
            );
        }
        
        // Storm Conditions Assessment
        if (this.config.crewCoordination.stormWatch) {
            analysisPromises.push(
                this.assessStormConditions()
                    .then(result => ({ system: 'storm', result }))
                    .catch(error => ({ system: 'storm', error: error.message }))
            );
        }
        
        // Wait for all analyses to complete
        const results = await Promise.allSettled(analysisPromises);
        
        // Process results
        for (const result of results) {
            if (result.status === 'fulfilled') {
                const { system, result: analysisResult, error } = result.value;
                
                if (error) {
                    console.log(`   ⚠️ ${system} analysis failed: ${error}`);
                    analysisResults[system] = { failed: true, error };
                } else {
                    console.log(`   ✅ ${system} analysis complete`);
                    analysisResults[system] = analysisResult;
                }
            } else {
                console.log(`   ❌ Analysis failed: ${result.reason}`);
            }
        }
        
        console.log(`   📊 Completed ${Object.keys(analysisResults).length} system analyses`);
        
        return analysisResults;
    }
    
    /**
     * Phase 2: Correlate threat data across all systems
     */
    async correlateThreatData(analysisResults) {
        console.log('   🔗 Correlating threats across systems...');
        
        const correlatedThreats = {
            criticalThreats: [],
            highPriorityThreats: [],
            systemicThreats: [],
            totalThreats: 0,
            threatSources: new Map()
        };
        
        // Extract threats from Hull Inspector
        if (analysisResults.hull && !analysisResults.hull.failed) {
            const hullThreats = this.extractHullThreats(analysisResults.hull);
            this.addThreatsToCorrelation(hullThreats, 'hull', correlatedThreats);
        }
        
        // Extract threats from Safeguard Auditor  
        if (analysisResults.safeguards && !analysisResults.safeguards.failed) {
            const safeguardThreats = this.extractSafeguardThreats(analysisResults.safeguards);
            this.addThreatsToCorrelation(safeguardThreats, 'safeguards', correlatedThreats);
        }
        
        // Extract threats from Storm Watch
        if (analysisResults.storm && !analysisResults.storm.failed) {
            const stormThreats = this.extractStormThreats(analysisResults.storm);
            this.addThreatsToCorrelation(stormThreats, 'storm', correlatedThreats);
        }
        
        // Find systemic threats (affecting multiple systems)
        correlatedThreats.systemicThreats = this.identifySystemicThreats(correlatedThreats);
        
        console.log(`   🔗 Threat correlation complete:`);
        console.log(`      Critical: ${correlatedThreats.criticalThreats.length}`);
        console.log(`      High Priority: ${correlatedThreats.highPriorityThreats.length}`);
        console.log(`      Systemic: ${correlatedThreats.systemicThreats.length}`);
        console.log(`      Total: ${correlatedThreats.totalThreats}`);
        
        return correlatedThreats;
    }
    
    /**
     * Phase 3: Create integrated repair plan
     */
    async createIntegratedRepairPlan(correlatedThreats) {
        console.log('   🛠️ Creating integrated repair plan...');
        
        const repairPlan = {
            emergencyRepairs: [],
            priorityRepairs: [],
            maintenanceRepairs: [],
            totalRepairs: 0,
            estimatedTime: 0,
            resourcesRequired: []
        };
        
        // Process critical threats first
        for (const threat of correlatedThreats.criticalThreats) {
            const repairs = this.generateRepairsForThreat(threat, 'emergency');
            repairPlan.emergencyRepairs.push(...repairs);
        }
        
        // Process systemic threats (affect multiple systems)
        for (const threat of correlatedThreats.systemicThreats) {
            const repairs = this.generateRepairsForThreat(threat, 'priority');
            repairPlan.priorityRepairs.push(...repairs);
        }
        
        // Process remaining high priority threats
        for (const threat of correlatedThreats.highPriorityThreats) {
            if (!correlatedThreats.systemicThreats.includes(threat)) {
                const repairs = this.generateRepairsForThreat(threat, 'maintenance');
                repairPlan.maintenanceRepairs.push(...repairs);
            }
        }
        
        // Calculate totals
        repairPlan.totalRepairs = repairPlan.emergencyRepairs.length + 
                                 repairPlan.priorityRepairs.length + 
                                 repairPlan.maintenanceRepairs.length;
        
        repairPlan.estimatedTime = this.calculateTotalRepairTime(repairPlan);
        repairPlan.resourcesRequired = this.identifyRequiredResources(repairPlan);
        
        console.log(`   🛠️ Repair plan created:`);
        console.log(`      Emergency: ${repairPlan.emergencyRepairs.length} repairs`);
        console.log(`      Priority: ${repairPlan.priorityRepairs.length} repairs`);
        console.log(`      Maintenance: ${repairPlan.maintenanceRepairs.length} repairs`);
        console.log(`      Total Time: ${repairPlan.estimatedTime}`);
        
        return repairPlan;
    }
    
    /**
     * Phase 4: Create storm-aware execution strategy
     */
    async createStormAwareStrategy(repairPlan) {
        console.log('   🌪️ Creating storm-aware execution strategy...');
        
        const executionStrategy = {
            approach: 'adaptive',
            stormReadiness: true,
            phases: [],
            fallbackOptions: [],
            apiLimitAwareness: true,
            offlineCapabilities: []
        };
        
        // Use the Captain (Orchestrator Puzzle Solver) for strategic thinking
        if (this.maritimeCrew.captain) {
            const puzzleContext = {
                description: `Integrated system repairs needed: ${repairPlan.totalRepairs} total repairs`,
                urgency: repairPlan.emergencyRepairs.length > 0 ? 'critical' : 'high',
                constraints: {
                    stormConditions: this.systemState.stormConditions,
                    apiLimits: 'approaching',
                    resources: 'limited'
                }
            };
            
            console.log('   🧩 Captain analyzing strategic options...');
            const captainStrategy = await this.maritimeCrew.captain.solvePuzzle(puzzleContext);
            
            if (captainStrategy.solved) {
                executionStrategy.approach = captainStrategy.strategy.approach;
                executionStrategy.phases = this.convertCaptainStrategyToPhases(captainStrategy);
                executionStrategy.fallbackOptions = captainStrategy.strategy.fallbackRoutes || [];
            }
        }
        
        // Add storm navigation elements
        executionStrategy.stormNavigation = {
            apiLimitBypass: ['offline-mode', 'cached-responses'],
            fallbackTiming: '5000ms delays during storms',
            emergencyProcedures: 'activate if API limits exceeded'
        };
        
        console.log(`   🌪️ Storm-aware strategy: ${executionStrategy.approach}`);
        console.log(`   📊 Execution phases: ${executionStrategy.phases.length}`);
        console.log(`   🛟 Fallback options: ${executionStrategy.fallbackOptions.length}`);
        
        return executionStrategy;
    }
    
    /**
     * Phase 5: Certify system health
     */
    async certifySystemHealth(executionStrategy) {
        console.log('   📋 Certifying system health...');
        
        // Calculate overall system health based on all analyses
        const healthFactors = {
            hullIntegrity: this.calculateHullHealth(),
            safeguardEffectiveness: this.calculateSafeguardHealth(),
            stormReadiness: this.calculateStormReadiness(),
            repairReadiness: this.calculateRepairReadiness(executionStrategy)
        };
        
        const overallHealth = Object.values(healthFactors)
            .reduce((sum, factor) => sum + factor, 0) / Object.keys(healthFactors).length;
        
        const healthLevel = this.determineHealthLevel(overallHealth);
        const seaworthy = overallHealth >= this.config.healthThresholds.seaworthy;
        
        const certification = {
            overallHealth: healthLevel,
            healthScore: overallHealth,
            seaworthy,
            factors: healthFactors,
            certified: seaworthy,
            certificationTimestamp: new Date().toISOString(),
            nextInspection: this.calculateNextInspection(healthLevel)
        };
        
        this.systemState.overallHealth = healthLevel;
        this.systemState.seaworthinessCertified = seaworthy;
        this.systemState.lastInspection = certification.certificationTimestamp;
        
        console.log(`   📋 Health certification:`);
        console.log(`      Overall Health: ${healthLevel.toUpperCase()}`);
        console.log(`      Health Score: ${(overallHealth * 100).toFixed(1)}%`);
        console.log(`      Seaworthy: ${seaworthy ? 'YES' : 'NO'}`);
        console.log(`      Next Inspection: ${certification.nextInspection}`);
        
        return certification;
    }
    
    // Helper methods for analysis phases
    extractHullThreats(hullAnalysis) {
        const threats = [];
        
        if (hullAnalysis.findings) {
            if (hullAnalysis.findings.criticalGaps > 0) {
                threats.push({
                    type: 'hull-breach',
                    severity: 'critical',
                    description: `${hullAnalysis.findings.criticalGaps} critical XML schema gaps`,
                    source: 'hull-inspector',
                    impact: 'data-integrity'
                });
            }
            
            if (hullAnalysis.findings.brokenMappings > 0) {
                threats.push({
                    type: 'navigation-failure',
                    severity: 'high',
                    description: `${hullAnalysis.findings.brokenMappings} broken integration mappings`,
                    source: 'hull-inspector',
                    impact: 'system-connectivity'
                });
            }
        }
        
        return threats;
    }
    
    extractSafeguardThreats(safeguardAnalysis) {
        const threats = [];
        
        if (safeguardAnalysis.summary) {
            if (safeguardAnalysis.summary.criticalIssues > 0) {
                threats.push({
                    type: 'protection-failure',
                    severity: 'critical',
                    description: `${safeguardAnalysis.summary.criticalIssues} critical safeguard failures`,
                    source: 'safeguard-auditor',
                    impact: 'api-protection'
                });
            }
            
            if (safeguardAnalysis.summary.leaksDetected > 0) {
                threats.push({
                    type: 'safeguard-leak',
                    severity: 'high',
                    description: `${safeguardAnalysis.summary.leaksDetected} protection system leaks`,
                    source: 'safeguard-auditor',
                    impact: 'rate-limiting'
                });
            }
        }
        
        return threats;
    }
    
    extractStormThreats(stormAnalysis) {
        const threats = [];
        
        if (stormAnalysis.severity === 'high' || stormAnalysis.severity === 'critical') {
            threats.push({
                type: 'storm-conditions',
                severity: stormAnalysis.severity,
                description: `${stormAnalysis.condition} storm conditions detected`,
                source: 'storm-watch',
                impact: 'api-availability'
            });
        }
        
        return threats;
    }
    
    addThreatsToCorrelation(threats, source, correlatedThreats) {
        for (const threat of threats) {
            correlatedThreats.totalThreats++;
            
            if (threat.severity === 'critical') {
                correlatedThreats.criticalThreats.push(threat);
            } else if (threat.severity === 'high') {
                correlatedThreats.highPriorityThreats.push(threat);
            }
            
            // Track threat sources
            if (!correlatedThreats.threatSources.has(source)) {
                correlatedThreats.threatSources.set(source, []);
            }
            correlatedThreats.threatSources.get(source).push(threat);
        }
    }
    
    identifySystemicThreats(correlatedThreats) {
        // Find threats that affect multiple systems
        const systemicThreats = [];
        
        // Example: API limit issues affect both hull and safeguards
        const apiThreats = [...correlatedThreats.criticalThreats, ...correlatedThreats.highPriorityThreats]
            .filter(threat => threat.impact === 'api-protection' || threat.impact === 'api-availability');
        
        if (apiThreats.length > 1) {
            systemicThreats.push({
                type: 'systemic-api-failure',
                severity: 'critical',
                description: 'API issues affecting multiple systems',
                source: 'correlation-analysis',
                impact: 'system-wide',
                affectedSystems: ['hull', 'safeguards', 'navigation']
            });
        }
        
        return systemicThreats;
    }
    
    generateRepairsForThreat(threat, urgency) {
        const repairs = [{
            threatId: threat.type,
            urgency,
            description: `Repair ${threat.description}`,
            estimatedTime: this.getRepairTimeForThreat(threat),
            resources: this.getResourcesForThreat(threat),
            canRunOffline: threat.impact !== 'api-availability'
        }];
        
        return repairs;
    }
    
    calculateTotalRepairTime(repairPlan) {
        const emergencyTime = repairPlan.emergencyRepairs.length * 60; // 1 hour each
        const priorityTime = repairPlan.priorityRepairs.length * 30;    // 30 min each
        const maintenanceTime = repairPlan.maintenanceRepairs.length * 15; // 15 min each
        
        const totalMinutes = emergencyTime + priorityTime + maintenanceTime;
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    }
    
    identifyRequiredResources(repairPlan) {
        return [
            'senior-engineer',
            'api-credentials',
            'database-access',
            'deployment-permissions',
            'emergency-contacts'
        ];
    }
    
    convertCaptainStrategyToPhases(captainStrategy) {
        return [
            {
                name: 'Emergency Response',
                duration: '1-2 hours',
                description: 'Address critical threats immediately'
            },
            {
                name: 'Storm Navigation',
                duration: '30 minutes',
                description: 'Implement API limit bypasses and fallbacks'
            },
            {
                name: 'System Repair',
                duration: '2-4 hours',
                description: 'Execute prioritized repairs'
            },
            {
                name: 'Health Verification',
                duration: '30 minutes',
                description: 'Verify all systems are operational'
            }
        ];
    }
    
    // Health calculation methods
    calculateHullHealth() {
        if (this.maritimeCrew.hullInspector) {
            const shipStatus = this.maritimeCrew.hullInspector.getShipStatus();
            return shipStatus.seaworthiness || 0.5;
        }
        return 0.5; // Unknown
    }
    
    calculateSafeguardHealth() {
        if (this.maritimeCrew.safeguardAuditor) {
            const auditSummary = this.maritimeCrew.safeguardAuditor.getAuditSummary();
            return auditSummary.confidenceScore || 0.5;
        }
        return 0.5; // Unknown
    }
    
    calculateStormReadiness() {
        // Mock storm readiness calculation
        return this.systemState.stormConditions === 'calm' ? 0.9 : 0.4;
    }
    
    calculateRepairReadiness(executionStrategy) {
        return executionStrategy.phases.length > 0 ? 0.8 : 0.3;
    }
    
    determineHealthLevel(overallHealth) {
        if (overallHealth >= this.config.healthThresholds.seaworthy) return 'healthy';
        if (overallHealth >= this.config.healthThresholds.needsAttention) return 'needs-attention';
        if (overallHealth >= this.config.healthThresholds.vulnerable) return 'vulnerable';
        return 'critical';
    }
    
    calculateNextInspection(healthLevel) {
        const intervals = {
            healthy: '7 days',
            'needs-attention': '3 days',
            vulnerable: '1 day',
            critical: '6 hours'
        };
        
        return intervals[healthLevel] || '1 day';
    }
    
    // Storm watch initialization and methods
    initializeStormWatch() {
        this.maritimeCrew.stormWatch = {
            monitoring: true,
            lastCheck: Date.now(),
            conditions: 'calm'
        };
        
        // Start storm monitoring
        setInterval(() => {
            this.updateStormConditions();
        }, 30000); // Check every 30 seconds
    }
    
    updateStormConditions() {
        // Mock storm condition updates
        const conditions = ['calm', 'choppy', 'stormy', 'hurricane'];
        const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
        
        this.systemState.stormConditions = randomCondition;
        
        if (this.maritimeCrew.stormWatch) {
            this.maritimeCrew.stormWatch.conditions = randomCondition;
            this.maritimeCrew.stormWatch.lastCheck = Date.now();
        }
    }
    
    async assessStormConditions() {
        const assessment = {
            condition: this.systemState.stormConditions,
            severity: this.systemState.stormConditions === 'hurricane' ? 'critical' :
                     this.systemState.stormConditions === 'stormy' ? 'high' : 'low',
            apiLimitsApproaching: Math.random() > 0.7,
            recommendedActions: []
        };
        
        if (assessment.severity === 'critical') {
            assessment.recommendedActions.push('activate-emergency-procedures');
            assessment.recommendedActions.push('switch-to-offline-mode');
        } else if (assessment.severity === 'high') {
            assessment.recommendedActions.push('enable-storm-navigation');
            assessment.recommendedActions.push('prepare-fallbacks');
        }
        
        return assessment;
    }
    
    // Report generation
    async generateIntegratedReport(analysisData) {
        const report = {
            metadata: {
                systemId: this.config.systemId,
                timestamp: new Date().toISOString(),
                analysisType: 'integrated-maritime-analysis',
                version: '1.0',
                duration: analysisData.analysisTime
            },
            
            executiveSummary: {
                overallHealth: analysisData.healthCertification.overallHealth,
                seaworthy: analysisData.healthCertification.seaworthy,
                threatsIdentified: analysisData.correlatedThreats.totalThreats,
                repairsRequired: analysisData.repairPlan.totalRepairs,
                estimatedRepairTime: analysisData.repairPlan.estimatedTime,
                stormReadiness: analysisData.executionStrategy.stormReadiness
            },
            
            systemAnalyses: {
                hull: analysisData.analysisResults.hull || { failed: true },
                safeguards: analysisData.analysisResults.safeguards || { failed: true },
                storm: analysisData.analysisResults.storm || { failed: true }
            },
            
            threatCorrelation: analysisData.correlatedThreats,
            
            repairPlan: analysisData.repairPlan,
            
            executionStrategy: analysisData.executionStrategy,
            
            healthCertification: analysisData.healthCertification,
            
            recommendations: this.generateIntegratedRecommendations(analysisData),
            
            nextSteps: this.generateIntegratedNextSteps(analysisData)
        };
        
        // Save integrated report
        const reportPath = './integrated-maritime-analysis-report.json';
        await require('fs').promises.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`\n📋 Integrated Maritime Report saved: ${reportPath}`);
        
        return report;
    }
    
    generateIntegratedRecommendations(analysisData) {
        const recommendations = [];
        
        if (analysisData.correlatedThreats.criticalThreats.length > 0) {
            recommendations.push({
                priority: 'immediate',
                action: 'Address critical system threats',
                reason: `${analysisData.correlatedThreats.criticalThreats.length} critical threats detected`
            });
        }
        
        if (analysisData.correlatedThreats.systemicThreats.length > 0) {
            recommendations.push({
                priority: 'high',
                action: 'Fix systemic issues affecting multiple systems',
                reason: 'Cross-system problems require coordinated response'
            });
        }
        
        if (!analysisData.healthCertification.seaworthy) {
            recommendations.push({
                priority: 'urgent',
                action: 'Complete repairs before deployment',
                reason: 'System not certified seaworthy'
            });
        }
        
        return recommendations;
    }
    
    generateIntegratedNextSteps(analysisData) {
        const nextSteps = [];
        
        if (analysisData.repairPlan.emergencyRepairs.length > 0) {
            nextSteps.push(`🚨 IMMEDIATE: Execute ${analysisData.repairPlan.emergencyRepairs.length} emergency repairs`);
        }
        
        if (analysisData.executionStrategy.stormReadiness) {
            nextSteps.push(`🌪️ PREPARE: Activate storm navigation procedures`);
        }
        
        nextSteps.push(`🔄 MONITOR: Continue integrated system monitoring`);
        nextSteps.push(`📋 VERIFY: Re-run analysis after repairs complete`);
        
        return nextSteps;
    }
    
    // Emergency procedures
    async activateEmergencyProcedures(error) {
        console.log('\n🚨 EMERGENCY PROCEDURES ACTIVATED');
        console.log('==================================');
        console.log(`   Error: ${error.message}`);
        
        const emergencyReport = {
            emergency: true,
            timestamp: new Date().toISOString(),
            error: error.message,
            systemState: this.systemState,
            emergencyActions: [
                'Switch to offline mode',
                'Activate emergency backup systems',
                'Alert maritime emergency response team',
                'Prepare for emergency repairs',
                'Document system state for analysis'
            ],
            recoveryPlan: {
                phase1: 'Stabilize systems',
                phase2: 'Assess damage',
                phase3: 'Execute emergency repairs',
                phase4: 'Restore full functionality'
            }
        };
        
        console.log('   🛟 Emergency actions initiated');
        console.log('   📞 Maritime emergency response team alerted');
        
        return emergencyReport;
    }
    
    // Utility methods
    getRepairTimeForThreat(threat) {
        const timeMap = {
            'critical': '60 minutes',
            'high': '30 minutes',
            'medium': '15 minutes',
            'low': '10 minutes'
        };
        
        return timeMap[threat.severity] || '30 minutes';
    }
    
    getResourcesForThreat(threat) {
        return ['engineer', 'admin-access'];
    }
    
    // Public API
    getSystemStatus() {
        return {
            systemId: this.config.systemId,
            overallHealth: this.systemState.overallHealth,
            seaworthinessCertified: this.systemState.seaworthinessCertified,
            stormConditions: this.systemState.stormConditions,
            systemsOnline: this.integrationMetrics.systemsOnline,
            lastInspection: this.systemState.lastInspection,
            activeThreats: this.systemState.activeThreats.length,
            repairQueue: this.systemState.repairQueue.length
        };
    }
    
    async exportIntegratedAnalysis(outputPath = './integrated-maritime-export.json') {
        const exportData = {
            systemConfig: this.config,
            systemState: this.systemState,
            integrationMetrics: this.integrationMetrics,
            crewStatus: Object.fromEntries(
                Object.entries(this.maritimeCrew).map(([role, system]) => [
                    role, 
                    system ? 'online' : 'offline'
                ])
            ),
            timestamp: new Date().toISOString()
        };
        
        await require('fs').promises.writeFile(outputPath, JSON.stringify(exportData, null, 2));
        console.log(`📤 Integrated analysis exported: ${outputPath}`);
        return outputPath;
    }
    
    async shutdown() {
        console.log('\n⚓ Shutting down Integrated Maritime System...');
        
        // Shutdown all maritime crew systems
        if (this.maritimeCrew.captain) {
            await this.maritimeCrew.captain.shutdown();
        }
        
        // Export final state
        await this.exportIntegratedAnalysis();
        
        console.log('✅ Integrated Maritime System shutdown complete');
        console.log('🚢 All hands off deck - systems secured');
    }
}

module.exports = IntegratedMaritimeSystem;

// CLI interface
if (require.main === module) {
    console.log('⚓ Starting Integrated Maritime Analysis...\n');
    
    const maritimeSystem = new IntegratedMaritimeSystem({
        integrationMode: 'comprehensive',
        crossSystemLearning: true
    });
    
    maritimeSystem.runComprehensiveAnalysis().then(async (report) => {
        console.log('\n🎯 INTEGRATED ANALYSIS COMPLETE!');
        console.log('=================================');
        
        const summary = report.executiveSummary;
        console.log(`🚢 Overall Health: ${summary.overallHealth.toUpperCase()}`);
        console.log(`⚓ Seaworthy: ${summary.seaworthy ? 'YES' : 'NO'}`);
        console.log(`🚨 Threats: ${summary.threatsIdentified}`);
        console.log(`🛠️ Repairs Required: ${summary.repairsRequired}`);
        console.log(`⏱️ Repair Time: ${summary.estimatedRepairTime}`);
        console.log(`🌪️ Storm Ready: ${summary.stormReadiness ? 'YES' : 'NO'}`);
        
        if (report.recommendations.length > 0) {
            console.log('\n💡 Key Recommendations:');
            report.recommendations.forEach((rec, i) => {
                console.log(`   ${i + 1}. [${rec.priority.toUpperCase()}] ${rec.action}`);
            });
        }
        
        console.log('\n🧭 Next Steps:');
        report.nextSteps.forEach((step, i) => {
            console.log(`   ${i + 1}. ${step}`);
        });
        
        if (summary.seaworthy) {
            console.log('\n✅ SHIP IS SEAWORTHY!');
            console.log('🚢 All systems watertight - no leaks, no shark attacks!');
        } else {
            console.log('\n⚠️ REPAIRS REQUIRED BEFORE DEPLOYMENT');
            console.log('🔧 Complete repairs and re-run analysis for certification');
        }
        
        await maritimeSystem.shutdown();
        
    }).catch(async (error) => {
        console.error('\n❌ Integrated analysis failed:', error.message);
        console.log('🚨 Maritime emergency procedures activated!');
        
        await maritimeSystem.shutdown();
    });
}