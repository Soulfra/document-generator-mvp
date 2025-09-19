#!/usr/bin/env node

/**
 * 🗂️🔍 XML DOMAIN COMPARISON ENGINE
 * ================================
 * 
 * Maritime Engineering for Data Systems:
 * Checks for holes in the ship (XML domain gaps)
 * Identifies what needs patching first (priority repairs)
 * Maps safe navigation routes (working integrations)
 * 
 * Combines Document Comparison + XML Schema Mapping
 * to find gaps in existing domain systems.
 */

const DocumentComparisonEngine = require('./document-comparison-engine');
const XMLSchemaMapper = require('./xml-schema-mapper');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

console.log(`
🗂️🔍 XML DOMAIN COMPARISON ENGINE 🗂️🔍
==========================================
Maritime Engineering for Data Systems
Checking for holes in the ship...
`);

class XMLDomainComparisonEngine {
    constructor() {
        this.documentComparator = new DocumentComparisonEngine();
        this.xmlMapper = new XMLSchemaMapper();
        
        this.config = {
            engineId: `xml-domain-compare-${Date.now()}`,
            analysisDepth: 'comprehensive',
            priorityThreshold: 0.7,
            gapSeverityLevels: ['critical', 'high', 'medium', 'low'],
            repairTimeEstimates: {
                critical: '2-4 hours',
                high: '1-2 hours', 
                medium: '30-60 minutes',
                low: '10-30 minutes'
            }
        };
        
        // Domain analysis state
        this.domainMaps = new Map();
        this.gapAnalysis = new Map();
        this.repairPriorities = new Map();
        this.navigationRoutes = new Map(); // Working integration paths
        
        // Ship integrity status (sailor metaphor)
        this.shipStatus = {
            hull: 'unknown',           // Core XML schemas
            sails: 'unknown',          // Document processing 
            navigation: 'unknown',     // API routing
            cargo: 'unknown',          // Data integrity
            crew: 'unknown'            // System orchestration
        };
        
        this.findings = {
            totalDomains: 0,
            criticalGaps: 0,
            workingIntegrations: 0,
            brokenMappings: 0,
            repairEstimate: '0 hours',
            navigationHazards: []
        };
        
        console.log('🗂️ XML Domain Comparison Engine initialized');
        console.log(`   Engine ID: ${this.config.engineId}`);
        console.log(`   Analysis Depth: ${this.config.analysisDepth}`);
        
        this.initialize();
    }
    
    async initialize() {
        console.log('\n⚓ Initializing maritime engineering systems...');
        
        try {
            // Initialize document comparison engine
            await this.documentComparator.initialize();
            console.log('   📄 Document Comparison Engine ready');
            
            // XML Schema Mapper is initialized in constructor
            console.log('   🗂️ XML Schema Mapper ready');
            
            // Scan existing domain systems
            await this.scanExistingDomains();
            
            console.log('✅ Maritime engineering systems ready');
            console.log('🔍 Ready to check for holes in the ship\n');
            
        } catch (error) {
            console.error('❌ Initialization failed:', error.message);
            throw error;
        }
    }
    
    /**
     * Main analysis: Find all the holes in the ship
     */
    async analyzeAllDomains() {
        console.log('🔍 STARTING COMPREHENSIVE DOMAIN ANALYSIS');
        console.log('==========================================');
        console.log('⚓ Checking hull integrity (XML schemas)');
        console.log('🧭 Mapping navigation routes (API paths)'); 
        console.log('📦 Inspecting cargo holds (data systems)');
        console.log('👥 Checking crew readiness (orchestration)\n');
        
        const analysisStartTime = Date.now();
        
        try {
            // Phase 1: Hull Integrity - Core XML Schema Analysis
            console.log('🔧 Phase 1: Hull Integrity Check...');
            await this.checkHullIntegrity();
            
            // Phase 2: Navigation Routes - API Integration Analysis  
            console.log('🧭 Phase 2: Navigation Route Mapping...');
            await this.mapNavigationRoutes();
            
            // Phase 3: Cargo Hold Inspection - Data System Analysis
            console.log('📦 Phase 3: Cargo Hold Inspection...');
            await this.inspectCargoHolds();
            
            // Phase 4: Crew Readiness - Orchestration Analysis
            console.log('👥 Phase 4: Crew Readiness Assessment...');
            await this.assessCrewReadiness();
            
            // Phase 5: Priority Repair Analysis
            console.log('🛠️ Phase 5: Priority Repair Analysis...');
            await this.analyzePriorityRepairs();
            
            // Phase 6: Generate Ship Status Report
            console.log('📋 Phase 6: Ship Status Report Generation...');
            const shipReport = await this.generateShipStatusReport();
            
            const analysisTime = Date.now() - analysisStartTime;
            
            console.log('\n🎯 DOMAIN ANALYSIS COMPLETE');
            console.log(`   Duration: ${analysisTime}ms`);
            console.log(`   Critical Issues: ${this.findings.criticalGaps}`);
            console.log(`   Repair Estimate: ${this.findings.repairEstimate}`);
            console.log(`   Ship Status: ${this.getOverallShipStatus()}`);
            
            return shipReport;
            
        } catch (error) {
            console.error('❌ Domain analysis failed:', error.message);
            throw error;
        }
    }
    
    /**
     * Phase 1: Check hull integrity (core XML schemas)
     */
    async checkHullIntegrity() {
        console.log('   🔍 Scanning XML schema foundations...');
        
        try {
            // Get XML schema status
            const schemaStatus = await this.xmlMapper.getSchemaStatus();
            
            // Check for missing schemas
            const expectedSchemas = ['agent', 'conversation', 'decision', 'reasoning_session', 'system_event', 'reality_metadata'];
            const missingSchemas = expectedSchemas.filter(schema => 
                !schemaStatus.schemas.includes(schema)
            );
            
            // Check database mappings
            const expectedDatabases = ['sqlite', 'mongodb', 'postgresql', 'redis', 'elasticsearch'];
            const missingDatabases = expectedDatabases.filter(db =>
                !schemaStatus.databases.includes(db)
            );
            
            // Assess hull damage
            const hullDamage = {
                missingSchemas,
                missingDatabases,
                brokenValidations: [],
                severity: this.calculateHullDamageSeverity(missingSchemas, missingDatabases)
            };
            
            // Find broken validation rules
            for (const schema of schemaStatus.schemas) {
                try {
                    const validation = await this.xmlMapper.validateDataAcrossDatabases(schema, { test: 'data' });
                    if (!validation.valid) {
                        hullDamage.brokenValidations.push({
                            schema,
                            errors: validation.results.errors
                        });
                    }
                } catch (error) {
                    hullDamage.brokenValidations.push({
                        schema,
                        errors: [error.message]
                    });
                }
            }
            
            this.shipStatus.hull = hullDamage.severity;
            this.gapAnalysis.set('hull', hullDamage);
            
            console.log(`   🔧 Hull Status: ${hullDamage.severity.toUpperCase()}`);
            console.log(`   📊 Missing Schemas: ${missingSchemas.length}`);
            console.log(`   📊 Missing Databases: ${missingDatabases.length}`);
            console.log(`   📊 Broken Validations: ${hullDamage.brokenValidations.length}`);
            
        } catch (error) {
            console.error('   ❌ Hull integrity check failed:', error.message);
            this.shipStatus.hull = 'critical';
            this.gapAnalysis.set('hull', { severity: 'critical', error: error.message });
        }
    }
    
    /**
     * Phase 2: Map navigation routes (API integrations)
     */
    async mapNavigationRoutes() {
        console.log('   🧭 Mapping safe navigation routes...');
        
        try {
            // Scan for API integration files
            const apiFiles = await this.findAPIFiles();
            
            const routeMap = {
                workingRoutes: [],
                brokenRoutes: [],
                unknownRoutes: [],
                apiLimitRoutes: [],
                fallbackRoutes: []
            };
            
            for (const apiFile of apiFiles) {
                const routeAnalysis = await this.analyzeAPIRoute(apiFile);
                
                if (routeAnalysis.hasRateLimiting && routeAnalysis.hasFallbacks) {
                    routeMap.workingRoutes.push(routeAnalysis);
                } else if (routeAnalysis.hasAPILimitIssues) {
                    routeMap.apiLimitRoutes.push(routeAnalysis);
                } else if (!routeAnalysis.accessible) {
                    routeMap.brokenRoutes.push(routeAnalysis);
                } else {
                    routeMap.unknownRoutes.push(routeAnalysis);
                }
            }
            
            // Assess navigation safety
            const navigationSafety = this.calculateNavigationSafety(routeMap);
            this.shipStatus.navigation = navigationSafety;
            this.navigationRoutes.set('apiRoutes', routeMap);
            
            console.log(`   🧭 Navigation Status: ${navigationSafety.toUpperCase()}`);
            console.log(`   📊 Working Routes: ${routeMap.workingRoutes.length}`);
            console.log(`   📊 Broken Routes: ${routeMap.brokenRoutes.length}`);
            console.log(`   📊 API Limit Issues: ${routeMap.apiLimitRoutes.length}`);
            
        } catch (error) {
            console.error('   ❌ Navigation route mapping failed:', error.message);
            this.shipStatus.navigation = 'critical';
        }
    }
    
    /**
     * Phase 3: Inspect cargo holds (data systems)
     */
    async inspectCargoHolds() {
        console.log('   📦 Inspecting cargo hold integrity...');
        
        try {
            const dataSystemFiles = await this.findDataSystemFiles();
            
            const cargoStatus = {
                secureHolds: [],
                damagedHolds: [],
                leakingHolds: [],
                integrityScore: 0
            };
            
            for (const dataFile of dataSystemFiles) {
                const holdInspection = await this.inspectDataHold(dataFile);
                
                if (holdInspection.integrity > 0.8) {
                    cargoStatus.secureHolds.push(holdInspection);
                } else if (holdInspection.integrity > 0.5) {
                    cargoStatus.damagedHolds.push(holdInspection);
                } else {
                    cargoStatus.leakingHolds.push(holdInspection);
                }
            }
            
            // Calculate overall cargo integrity
            const totalHolds = dataSystemFiles.length;
            if (totalHolds > 0) {
                cargoStatus.integrityScore = cargoStatus.secureHolds.length / totalHolds;
            }
            
            const cargoSafety = this.calculateCargoSafety(cargoStatus);
            this.shipStatus.cargo = cargoSafety;
            this.gapAnalysis.set('cargo', cargoStatus);
            
            console.log(`   📦 Cargo Status: ${cargoSafety.toUpperCase()}`);
            console.log(`   📊 Secure Holds: ${cargoStatus.secureHolds.length}`);
            console.log(`   📊 Damaged Holds: ${cargoStatus.damagedHolds.length}`);
            console.log(`   📊 Leaking Holds: ${cargoStatus.leakingHolds.length}`);
            console.log(`   📊 Integrity Score: ${(cargoStatus.integrityScore * 100).toFixed(1)}%`);
            
        } catch (error) {
            console.error('   ❌ Cargo hold inspection failed:', error.message);
            this.shipStatus.cargo = 'critical';
        }
    }
    
    /**
     * Phase 4: Assess crew readiness (orchestration systems)
     */
    async assessCrewReadiness() {
        console.log('   👥 Assessing crew readiness...');
        
        try {
            const orchestrationFiles = await this.findOrchestrationFiles();
            
            const crewStatus = {
                readyCrew: [],
                trainedCrew: [],
                newCrew: [],
                absentCrew: [],
                overallReadiness: 0
            };
            
            for (const orchFile of orchestrationFiles) {
                const crewMember = await this.assessCrewMember(orchFile);
                
                if (crewMember.readiness > 0.8) {
                    crewStatus.readyCrew.push(crewMember);
                } else if (crewMember.readiness > 0.5) {
                    crewStatus.trainedCrew.push(crewMember);
                } else if (crewMember.readiness > 0.2) {
                    crewStatus.newCrew.push(crewMember);
                } else {
                    crewStatus.absentCrew.push(crewMember);
                }
            }
            
            // Calculate overall crew readiness
            const totalCrew = orchestrationFiles.length;
            if (totalCrew > 0) {
                crewStatus.overallReadiness = (
                    crewStatus.readyCrew.length * 1.0 +
                    crewStatus.trainedCrew.length * 0.7 +
                    crewStatus.newCrew.length * 0.3
                ) / totalCrew;
            }
            
            const crewRating = this.calculateCrewRating(crewStatus);
            this.shipStatus.crew = crewRating;
            this.gapAnalysis.set('crew', crewStatus);
            
            console.log(`   👥 Crew Status: ${crewRating.toUpperCase()}`);
            console.log(`   📊 Ready Crew: ${crewStatus.readyCrew.length}`);
            console.log(`   📊 Trained Crew: ${crewStatus.trainedCrew.length}`);
            console.log(`   📊 New Crew: ${crewStatus.newCrew.length}`);
            console.log(`   📊 Readiness: ${(crewStatus.overallReadiness * 100).toFixed(1)}%`);
            
        } catch (error) {
            console.error('   ❌ Crew readiness assessment failed:', error.message);
            this.shipStatus.crew = 'critical';
        }
    }
    
    /**
     * Phase 5: Analyze priority repairs
     */
    async analyzePriorityRepairs() {
        console.log('   🛠️ Analyzing repair priorities...');
        
        const repairQueue = [];
        
        // Hull repairs (most critical)
        const hullGaps = this.gapAnalysis.get('hull');
        if (hullGaps && hullGaps.severity === 'critical') {
            repairQueue.push({
                area: 'hull',
                priority: 1,
                severity: 'critical',
                description: 'Critical XML schema gaps detected',
                estimatedTime: this.config.repairTimeEstimates.critical,
                repairs: this.generateHullRepairs(hullGaps)
            });
        }
        
        // Navigation repairs (API limits)
        const navRoutes = this.navigationRoutes.get('apiRoutes');
        if (navRoutes && navRoutes.apiLimitRoutes.length > 0) {
            repairQueue.push({
                area: 'navigation',
                priority: 2,
                severity: 'high',
                description: `${navRoutes.apiLimitRoutes.length} API routes hitting rate limits`,
                estimatedTime: this.config.repairTimeEstimates.high,
                repairs: this.generateNavigationRepairs(navRoutes)
            });
        }
        
        // Cargo repairs (data integrity)
        const cargoStatus = this.gapAnalysis.get('cargo');
        if (cargoStatus && cargoStatus.leakingHolds.length > 0) {
            repairQueue.push({
                area: 'cargo',
                priority: 3,
                severity: 'medium',
                description: `${cargoStatus.leakingHolds.length} data systems with integrity issues`,
                estimatedTime: this.config.repairTimeEstimates.medium,
                repairs: this.generateCargoRepairs(cargoStatus)
            });
        }
        
        // Crew training (orchestration improvements)
        const crewStatus = this.gapAnalysis.get('crew');
        if (crewStatus && crewStatus.overallReadiness < 0.7) {
            repairQueue.push({
                area: 'crew',
                priority: 4,
                severity: 'low',
                description: 'Crew training and orchestration improvements needed',
                estimatedTime: this.config.repairTimeEstimates.low,
                repairs: this.generateCrewTraining(crewStatus)
            });
        }
        
        // Sort by priority
        repairQueue.sort((a, b) => a.priority - b.priority);
        
        this.repairPriorities.set('maintenanceQueue', repairQueue);
        
        // Calculate total repair time
        const totalRepairTime = this.calculateTotalRepairTime(repairQueue);
        this.findings.repairEstimate = totalRepairTime;
        this.findings.criticalGaps = repairQueue.filter(r => r.severity === 'critical').length;
        
        console.log(`   🛠️ Priority Repairs: ${repairQueue.length} items`);
        console.log(`   ⏱️ Estimated Repair Time: ${totalRepairTime}`);
        console.log(`   🚨 Critical Issues: ${this.findings.criticalGaps}`);
    }
    
    /**
     * Generate comprehensive ship status report
     */
    async generateShipStatusReport() {
        const report = {
            metadata: {
                engineId: this.config.engineId,
                timestamp: new Date().toISOString(),
                analysisType: 'comprehensive-domain-analysis',
                version: '1.0'
            },
            
            shipStatus: {
                overall: this.getOverallShipStatus(),
                hull: this.shipStatus.hull,
                navigation: this.shipStatus.navigation,
                cargo: this.shipStatus.cargo,
                crew: this.shipStatus.crew,
                seaworthiness: this.calculateSeaworthiness()
            },
            
            findings: {
                totalDomains: this.findings.totalDomains,
                criticalGaps: this.findings.criticalGaps,
                workingIntegrations: this.findings.workingIntegrations,
                brokenMappings: this.findings.brokenMappings,
                repairEstimate: this.findings.repairEstimate,
                navigationHazards: this.findings.navigationHazards
            },
            
            repairPriorities: Array.from(this.repairPriorities.get('maintenanceQueue') || []),
            
            recommendations: this.generateRepairRecommendations(),
            
            nextSteps: this.generateNextSteps(),
            
            gapAnalysis: this.serializeGapAnalysis(),
            
            navigationChart: this.generateNavigationChart()
        };
        
        // Save report to file
        const reportPath = './xml-domain-analysis-report.json';
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`\n📋 Ship Status Report saved: ${reportPath}`);
        
        return report;
    }
    
    // Helper methods for file scanning
    async scanExistingDomains() {
        console.log('   🔍 Scanning existing domain systems...');
        
        const domainPaths = [
            './web-interface/os-ard-components',
            './FinishThisIdea',
            './FinishThisIdea-Complete',
            './xml-schemas',
            './services'
        ];
        
        let totalDomains = 0;
        
        for (const domainPath of domainPaths) {
            try {
                const exists = await this.pathExists(domainPath);
                if (exists) {
                    const files = await this.getFilesRecursively(domainPath);
                    totalDomains += files.length;
                    this.domainMaps.set(domainPath, files);
                }
            } catch (error) {
                console.warn(`   ⚠️ Could not scan ${domainPath}: ${error.message}`);
            }
        }
        
        this.findings.totalDomains = totalDomains;
        console.log(`   📊 Found ${totalDomains} domain files across ${domainPaths.length} areas`);
    }
    
    async findAPIFiles() {
        const apiPatterns = ['*api*', '*client*', '*service*', '*orchestrat*', '*llm*'];
        const apiFiles = [];
        
        for (const [domainPath, files] of this.domainMaps) {
            for (const file of files) {
                const fileName = path.basename(file).toLowerCase();
                const matchesPattern = apiPatterns.some(pattern => 
                    fileName.includes(pattern.replace('*', ''))
                );
                
                if (matchesPattern) {
                    apiFiles.push(file);
                }
            }
        }
        
        return apiFiles;
    }
    
    async findDataSystemFiles() {
        const dataPatterns = ['*database*', '*storage*', '*cache*', '*persistence*', '*xml*'];
        const dataFiles = [];
        
        for (const [domainPath, files] of this.domainMaps) {
            for (const file of files) {
                const fileName = path.basename(file).toLowerCase();
                const matchesPattern = dataPatterns.some(pattern =>
                    fileName.includes(pattern.replace('*', ''))
                );
                
                if (matchesPattern) {
                    dataFiles.push(file);
                }
            }
        }
        
        return dataFiles;
    }
    
    async findOrchestrationFiles() {
        const orchPatterns = ['*orchestrat*', '*decision*', '*reasoning*', '*conductor*'];
        const orchFiles = [];
        
        for (const [domainPath, files] of this.domainMaps) {
            for (const file of files) {
                const fileName = path.basename(file).toLowerCase();
                const matchesPattern = orchPatterns.some(pattern =>
                    fileName.includes(pattern.replace('*', ''))
                );
                
                if (matchesPattern) {
                    orchFiles.push(file);
                }
            }
        }
        
        return orchFiles;
    }
    
    // Analysis helper methods
    async analyzeAPIRoute(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            
            return {
                file: filePath,
                hasRateLimiting: content.includes('rate') && content.includes('limit'),
                hasFallbacks: content.includes('fallback') || content.includes('retry'),
                hasAPILimitIssues: content.includes('api limit') || content.includes('rate limit'),
                hasTimeouts: content.includes('timeout'),
                accessible: true,
                analysis: this.extractAPIMetrics(content)
            };
        } catch (error) {
            return {
                file: filePath,
                hasRateLimiting: false,
                hasFallbacks: false, 
                hasAPILimitIssues: false,
                hasTimeouts: false,
                accessible: false,
                error: error.message
            };
        }
    }
    
    async inspectDataHold(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            
            const integrity = this.calculateDataIntegrity(content);
            
            return {
                file: filePath,
                integrity,
                hasValidation: content.includes('validate') || content.includes('schema'),
                hasErrorHandling: content.includes('catch') || content.includes('error'),
                hasBackups: content.includes('backup') || content.includes('recovery'),
                analysis: this.extractDataMetrics(content)
            };
        } catch (error) {
            return {
                file: filePath,
                integrity: 0,
                error: error.message
            };
        }
    }
    
    async assessCrewMember(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            
            const readiness = this.calculateOrchestrationReadiness(content);
            
            return {
                file: filePath,
                readiness,
                hasDocumentation: content.includes('/**') || content.includes('//'),
                hasErrorHandling: content.includes('try') && content.includes('catch'),
                hasLogging: content.includes('console.log') || content.includes('logger'),
                analysis: this.extractOrchestrationMetrics(content)
            };
        } catch (error) {
            return {
                file: filePath,
                readiness: 0,
                error: error.message
            };
        }
    }
    
    // Calculation helper methods
    calculateHullDamageSeverity(missingSchemas, missingDatabases) {
        const totalMissing = missingSchemas.length + missingDatabases.length;
        
        if (totalMissing === 0) return 'good';
        if (totalMissing <= 2) return 'minor';
        if (totalMissing <= 4) return 'moderate';
        return 'critical';
    }
    
    calculateNavigationSafety(routeMap) {
        const total = routeMap.workingRoutes.length + routeMap.brokenRoutes.length + 
                     routeMap.apiLimitRoutes.length + routeMap.unknownRoutes.length;
        
        if (total === 0) return 'unknown';
        
        const workingRatio = routeMap.workingRoutes.length / total;
        
        if (workingRatio >= 0.8) return 'good';
        if (workingRatio >= 0.6) return 'moderate';
        if (workingRatio >= 0.4) return 'poor';
        return 'critical';
    }
    
    calculateCargoSafety(cargoStatus) {
        if (cargoStatus.integrityScore >= 0.8) return 'good';
        if (cargoStatus.integrityScore >= 0.6) return 'moderate';
        if (cargoStatus.integrityScore >= 0.4) return 'poor';
        return 'critical';
    }
    
    calculateCrewRating(crewStatus) {
        if (crewStatus.overallReadiness >= 0.8) return 'excellent';
        if (crewStatus.overallReadiness >= 0.6) return 'good';
        if (crewStatus.overallReadiness >= 0.4) return 'adequate';
        return 'poor';
    }
    
    calculateDataIntegrity(content) {
        let score = 0;
        
        if (content.includes('validate')) score += 0.2;
        if (content.includes('schema')) score += 0.2;
        if (content.includes('catch') && content.includes('error')) score += 0.2;
        if (content.includes('backup') || content.includes('recovery')) score += 0.2;
        if (content.includes('transaction') || content.includes('atomic')) score += 0.2;
        
        return Math.min(score, 1.0);
    }
    
    calculateOrchestrationReadiness(content) {
        let score = 0;
        
        if (content.includes('/**') || content.includes('//')) score += 0.2;
        if (content.includes('try') && content.includes('catch')) score += 0.3;
        if (content.includes('console.log') || content.includes('logger')) score += 0.2;
        if (content.includes('await') || content.includes('async')) score += 0.2;
        if (content.includes('module.exports')) score += 0.1;
        
        return Math.min(score, 1.0);
    }
    
    getOverallShipStatus() {
        const statuses = [this.shipStatus.hull, this.shipStatus.navigation, 
                         this.shipStatus.cargo, this.shipStatus.crew];
        
        const criticalCount = statuses.filter(s => s === 'critical').length;
        const poorCount = statuses.filter(s => s === 'poor' || s === 'moderate').length;
        
        if (criticalCount > 0) return 'unseaworthy';
        if (poorCount > 2) return 'needs-repairs';
        if (poorCount > 0) return 'seaworthy-with-caution';
        return 'seaworthy';
    }
    
    calculateSeaworthiness() {
        const status = this.getOverallShipStatus();
        const seaworthinessMap = {
            'unseaworthy': 0.2,
            'needs-repairs': 0.5,
            'seaworthy-with-caution': 0.7,
            'seaworthy': 0.9
        };
        
        return seaworthinessMap[status] || 0;
    }
    
    // Repair generation methods
    generateHullRepairs(hullGaps) {
        const repairs = [];
        
        for (const schema of hullGaps.missingSchemas) {
            repairs.push(`Generate missing XML schema: ${schema}.xsd`);
        }
        
        for (const db of hullGaps.missingDatabases) {
            repairs.push(`Configure database mapping: ${db}`);
        }
        
        for (const validation of hullGaps.brokenValidations) {
            repairs.push(`Fix validation for schema: ${validation.schema}`);
        }
        
        return repairs;
    }
    
    generateNavigationRepairs(navRoutes) {
        const repairs = [];
        
        for (const route of navRoutes.apiLimitRoutes) {
            repairs.push(`Add rate limiting safeguards to: ${path.basename(route.file)}`);
        }
        
        for (const route of navRoutes.brokenRoutes) {
            repairs.push(`Fix API integration: ${path.basename(route.file)}`);
        }
        
        return repairs;
    }
    
    generateCargoRepairs(cargoStatus) {
        const repairs = [];
        
        for (const hold of cargoStatus.leakingHolds) {
            repairs.push(`Fix data integrity issues in: ${path.basename(hold.file)}`);
        }
        
        for (const hold of cargoStatus.damagedHolds) {
            repairs.push(`Improve data validation in: ${path.basename(hold.file)}`);
        }
        
        return repairs;
    }
    
    generateCrewTraining(crewStatus) {
        const training = [];
        
        for (const crew of crewStatus.newCrew) {
            training.push(`Add documentation to: ${path.basename(crew.file)}`);
        }
        
        for (const crew of crewStatus.absentCrew) {
            training.push(`Fix orchestration issues in: ${path.basename(crew.file)}`);
        }
        
        return training;
    }
    
    // Utility methods
    calculateTotalRepairTime(repairQueue) {
        const timeMap = {
            'critical': 240,  // 4 hours in minutes
            'high': 90,       // 1.5 hours
            'medium': 45,     // 45 minutes
            'low': 20         // 20 minutes
        };
        
        const totalMinutes = repairQueue.reduce((total, repair) => {
            return total + (timeMap[repair.severity] || 30);
        }, 0);
        
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    }
    
    generateRepairRecommendations() {
        const recommendations = [];
        
        // Hull recommendations
        if (this.shipStatus.hull === 'critical') {
            recommendations.push({
                area: 'hull',
                priority: 'immediate',
                action: 'Generate missing XML schemas and fix database mappings',
                reason: 'Critical data integrity issues detected'
            });
        }
        
        // Navigation recommendations
        if (this.shipStatus.navigation === 'poor' || this.shipStatus.navigation === 'critical') {
            recommendations.push({
                area: 'navigation',
                priority: 'high',
                action: 'Implement API rate limiting and fallback mechanisms',
                reason: 'Multiple API routes hitting rate limits'
            });
        }
        
        return recommendations;
    }
    
    generateNextSteps() {
        const nextSteps = [];
        const repairQueue = this.repairPriorities.get('maintenanceQueue') || [];
        
        if (repairQueue.length > 0) {
            const topPriority = repairQueue[0];
            nextSteps.push(`🚨 IMMEDIATE: ${topPriority.description}`);
            
            if (topPriority.repairs.length > 0) {
                nextSteps.push(`   First Repair: ${topPriority.repairs[0]}`);
            }
        }
        
        if (this.findings.criticalGaps === 0) {
            nextSteps.push('🎯 NEXT: Run orchestrator puzzle solver to prioritize remaining work');
        }
        
        nextSteps.push('📊 STATUS: Monitor ship systems and repeat analysis after repairs');
        
        return nextSteps;
    }
    
    // Serialization helpers
    serializeGapAnalysis() {
        const serialized = {};
        for (const [key, value] of this.gapAnalysis) {
            serialized[key] = value;
        }
        return serialized;
    }
    
    generateNavigationChart() {
        const routes = this.navigationRoutes.get('apiRoutes');
        if (!routes) return {};
        
        return {
            safeRoutes: routes.workingRoutes.map(r => path.basename(r.file)),
            hazardousRoutes: routes.apiLimitRoutes.map(r => path.basename(r.file)),
            unknownRoutes: routes.unknownRoutes.map(r => path.basename(r.file)),
            totalRoutes: routes.workingRoutes.length + routes.brokenRoutes.length + 
                        routes.apiLimitRoutes.length + routes.unknownRoutes.length
        };
    }
    
    extractAPIMetrics(content) {
        return {
            linesOfCode: content.split('\n').length,
            hasAuthentication: content.includes('auth') || content.includes('token'),
            hasRetryLogic: content.includes('retry') || content.includes('attempt'),
            hasLogging: content.includes('log') || content.includes('console')
        };
    }
    
    extractDataMetrics(content) {
        return {
            linesOfCode: content.split('\n').length,
            hasTransactions: content.includes('transaction') || content.includes('commit'),
            hasIndexes: content.includes('index') || content.includes('key'),
            hasConstraints: content.includes('constraint') || content.includes('foreign')
        };
    }
    
    extractOrchestrationMetrics(content) {
        return {
            linesOfCode: content.split('\n').length,
            hasEventHandling: content.includes('on(') || content.includes('emit('),
            hasAsyncPatterns: content.includes('async') || content.includes('await'),
            hasErrorBoundaries: content.includes('try') && content.includes('catch')
        };
    }
    
    // File system utilities
    async pathExists(path) {
        try {
            await fs.access(path);
            return true;
        } catch {
            return false;
        }
    }
    
    async getFilesRecursively(dir) {
        const files = [];
        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                
                if (entry.isDirectory()) {
                    const subFiles = await this.getFilesRecursively(fullPath);
                    files.push(...subFiles);
                } else if (entry.isFile()) {
                    files.push(fullPath);
                }
            }
        } catch (error) {
            // Directory doesn't exist or can't be read
        }
        
        return files;
    }
    
    // Public API
    getShipStatus() {
        return {
            overall: this.getOverallShipStatus(),
            hull: this.shipStatus.hull,
            navigation: this.shipStatus.navigation,
            cargo: this.shipStatus.cargo,
            crew: this.shipStatus.crew,
            seaworthiness: this.calculateSeaworthiness(),
            criticalGaps: this.findings.criticalGaps,
            repairEstimate: this.findings.repairEstimate
        };
    }
    
    getRepairQueue() {
        return this.repairPriorities.get('maintenanceQueue') || [];
    }
    
    async exportAnalysis(outputPath = './xml-domain-analysis-export.json') {
        const fullAnalysis = {
            shipStatus: this.shipStatus,
            findings: this.findings,
            gapAnalysis: this.serializeGapAnalysis(),
            repairPriorities: this.getRepairQueue(),
            navigationRoutes: Object.fromEntries(this.navigationRoutes),
            domainMaps: Object.fromEntries(this.domainMaps),
            timestamp: new Date().toISOString(),
            engineId: this.config.engineId
        };
        
        await fs.writeFile(outputPath, JSON.stringify(fullAnalysis, null, 2));
        console.log(`📤 Analysis exported to: ${outputPath}`);
        return outputPath;
    }
}

module.exports = XMLDomainComparisonEngine;

// CLI interface
if (require.main === module) {
    console.log('⚓ Starting XML Domain Comparison Analysis...\n');
    
    const engine = new XMLDomainComparisonEngine();
    
    engine.analyzeAllDomains().then(async (report) => {
        console.log('\n🎯 ANALYSIS COMPLETE!');
        console.log('==================');
        
        const status = engine.getShipStatus();
        console.log(`🚢 Ship Status: ${status.overall.toUpperCase()}`);
        console.log(`🔧 Hull: ${status.hull}`);
        console.log(`🧭 Navigation: ${status.navigation}`);
        console.log(`📦 Cargo: ${status.cargo}`);
        console.log(`👥 Crew: ${status.crew}`);
        console.log(`⚓ Seaworthiness: ${(status.seaworthiness * 100).toFixed(1)}%`);
        
        if (status.criticalGaps > 0) {
            console.log(`\n🚨 CRITICAL: ${status.criticalGaps} issues need immediate attention!`);
        }
        
        console.log(`⏱️ Estimated Repair Time: ${status.repairEstimate}`);
        
        const repairQueue = engine.getRepairQueue();
        if (repairQueue.length > 0) {
            console.log('\n🛠️ Priority Repairs:');
            repairQueue.slice(0, 3).forEach((repair, i) => {
                console.log(`   ${i + 1}. [${repair.severity.toUpperCase()}] ${repair.description}`);
            });
        }
        
        // Export analysis
        await engine.exportAnalysis();
        
        console.log('\n⚓ Ready for orchestrator puzzle solving phase!');
        
    }).catch(error => {
        console.error('\n❌ Analysis failed:', error.message);
        console.error('🚨 Ship may be taking on water!');
    });
}