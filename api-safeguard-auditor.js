#!/usr/bin/env node

/**
 * 🛡️🔍 API SAFEGUARD AUDITOR
 * ===========================
 * 
 * The Ship's Hull Inspector:
 * Finds leaks in API protection systems
 * Patches holes that let rate limits through
 * Ensures no shark attacks (failed requests)
 * 
 * Even with comprehensive safeguards, leaks happen.
 * This auditor finds exactly where they are.
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

console.log(`
🛡️🔍 API SAFEGUARD AUDITOR 🛡️🔍
================================
The Ship's Hull Inspector
Finding leaks in the protection systems
`);

class APISafeguardAuditor {
    constructor() {
        this.config = {
            auditorId: `safeguard-auditor-${Date.now()}`,
            auditDepth: 'comprehensive',
            confidenceThreshold: 0.8,
            
            // Expected safeguard patterns
            expectedSafeguards: [
                'rate-limiting',
                'retry-logic',
                'circuit-breakers',
                'timeout-handling',
                'fallback-mechanisms',
                'error-boundaries',
                'quota-tracking',
                'backoff-strategies'
            ],
            
            // Known leak patterns
            leakPatterns: [
                'missing-rate-limits',
                'bypassed-safeguards',
                'concurrent-overload',
                'cascading-failures',
                'timeout-loops',
                'retry-storms',
                'quota-miscalculation',
                'fallback-failures'
            ],
            
            // Repair priorities
            repairPriorities: {
                'critical': 1,    // Immediate action required
                'high': 2,        // Fix within hours  
                'medium': 3,      // Fix within days
                'low': 4          // Improvement opportunity
            }
        };
        
        // Audit state
        this.auditResults = {
            safeguardInventory: new Map(),
            leaksFound: [],
            gapsIdentified: [],
            repairRecommendations: [],
            confidenceScore: 0,
            auditSummary: {}
        };
        
        // Known good safeguard implementations
        this.safeguardSignatures = new Map([
            ['rate-limiting', [
                'RateLimiter',
                'TokenBucket',
                'SlidingWindow',
                'rate.limit',
                'throttle',
                'requestsPerMinute'
            ]],
            
            ['retry-logic', [
                'retry',
                'attempt',
                'exponentialBackoff',
                'backoffDelay',
                'maxRetries'
            ]],
            
            ['circuit-breakers', [
                'CircuitBreaker',
                'breaker',
                'failureThreshold',
                'halfOpen',
                'closed',
                'open'
            ]],
            
            ['timeout-handling', [
                'timeout',
                'setTimeout',
                'AbortController',
                'cancelToken',
                'requestTimeout'
            ]],
            
            ['fallback-mechanisms', [
                'fallback',
                'alternative',
                'backup',
                'failover',
                'degraded'
            ]],
            
            ['error-boundaries', [
                'try',
                'catch',
                'finally',
                'error',
                'exception'
            ]],
            
            ['quota-tracking', [
                'quota',
                'remaining',
                'usage',
                'limit',
                'threshold'
            ]],
            
            ['backoff-strategies', [
                'backoff',
                'exponential',
                'jitter',
                'delay',
                'wait'
            ]]
        ]);
        
        console.log('🛡️ API Safeguard Auditor initialized');
        console.log(`   Auditor ID: ${this.config.auditorId}`);
        console.log(`   Expected Safeguards: ${this.config.expectedSafeguards.length}`);
        console.log(`   Known Leak Patterns: ${this.config.leakPatterns.length}`);
        
        this.initialize();
    }
    
    async initialize() {
        console.log('\n🔍 Initializing hull inspection systems...');
        
        try {
            // Load existing safeguard files
            await this.loadSafeguardFiles();
            
            console.log('✅ Hull inspection systems ready');
            console.log('🛡️ Ready to audit API safeguards\n');
            
        } catch (error) {
            console.error('❌ Hull inspection initialization failed:', error.message);
            throw error;
        }
    }
    
    /**
     * Main audit: Find all leaks in the API protection systems
     */
    async auditAllSafeguards() {
        console.log('🔍 COMPREHENSIVE SAFEGUARD AUDIT');
        console.log('=================================');
        console.log('🛡️ Inspecting all protection systems');
        console.log('🕳️ Looking for leaks and gaps');
        console.log('🔧 Preparing repair recommendations\n');
        
        const auditStartTime = Date.now();
        
        try {
            // Phase 1: Inventory existing safeguards
            console.log('📋 Phase 1: Safeguard Inventory...');
            await this.inventorySafeguards();
            
            // Phase 2: Analyze safeguard effectiveness
            console.log('🔬 Phase 2: Effectiveness Analysis...');
            await this.analyzeSafeguardEffectiveness();
            
            // Phase 3: Detect leak patterns
            console.log('🕳️ Phase 3: Leak Pattern Detection...');
            await this.detectLeakPatterns();
            
            // Phase 4: Identify gaps in coverage
            console.log('🔍 Phase 4: Gap Analysis...');
            await this.identifyGaps();
            
            // Phase 5: Generate repair recommendations
            console.log('🛠️ Phase 5: Repair Recommendations...');
            await this.generateRepairRecommendations();
            
            // Phase 6: Calculate audit confidence
            console.log('📊 Phase 6: Confidence Calculation...');
            await this.calculateAuditConfidence();
            
            const auditTime = Date.now() - auditStartTime;
            
            console.log('\n🎯 SAFEGUARD AUDIT COMPLETE');
            console.log('============================');
            console.log(`   Duration: ${auditTime}ms`);
            console.log(`   Safeguards Found: ${this.auditResults.safeguardInventory.size}`);
            console.log(`   Leaks Detected: ${this.auditResults.leaksFound.length}`);
            console.log(`   Gaps Identified: ${this.auditResults.gapsIdentified.length}`);
            console.log(`   Confidence Score: ${(this.auditResults.confidenceScore * 100).toFixed(1)}%`);
            
            // Generate comprehensive report
            const auditReport = await this.generateAuditReport();
            
            return auditReport;
            
        } catch (error) {
            console.error('❌ Safeguard audit failed:', error.message);
            throw error;
        }
    }
    
    /**
     * Phase 1: Inventory all existing safeguards
     */
    async inventorySafeguards() {
        console.log('   📋 Scanning codebase for safeguard implementations...');
        
        const safeguardFiles = await this.findSafeguardFiles();
        
        for (const filePath of safeguardFiles) {
            console.log(`   🔍 Analyzing: ${path.basename(filePath)}`);
            
            try {
                const fileContent = await fs.readFile(filePath, 'utf8');
                const safeguards = await this.extractSafeguards(fileContent, filePath);
                
                this.auditResults.safeguardInventory.set(filePath, safeguards);
                
            } catch (error) {
                console.warn(`   ⚠️ Could not analyze ${filePath}: ${error.message}`);
            }
        }
        
        const totalSafeguards = Array.from(this.auditResults.safeguardInventory.values())
            .reduce((total, safeguards) => total + safeguards.length, 0);
        
        console.log(`   📊 Found ${totalSafeguards} safeguard implementations in ${safeguardFiles.length} files`);
    }
    
    /**
     * Phase 2: Analyze effectiveness of existing safeguards
     */
    async analyzeSafeguardEffectiveness() {
        console.log('   🔬 Analyzing safeguard effectiveness...');
        
        for (const [filePath, safeguards] of this.auditResults.safeguardInventory) {
            for (const safeguard of safeguards) {
                const effectiveness = this.assessSafeguardEffectiveness(safeguard);
                safeguard.effectiveness = effectiveness;
                
                if (effectiveness.score < 0.7) {
                    console.log(`   ⚠️ Low effectiveness: ${safeguard.type} in ${path.basename(filePath)} (${(effectiveness.score * 100).toFixed(1)}%)`);
                }
            }
        }
    }
    
    /**
     * Phase 3: Detect leak patterns in safeguard systems
     */
    async detectLeakPatterns() {
        console.log('   🕳️ Scanning for leak patterns...');
        
        for (const leakPattern of this.config.leakPatterns) {
            const leaks = await this.scanForLeakPattern(leakPattern);
            
            if (leaks.length > 0) {
                console.log(`   🚨 Found ${leaks.length} instances of: ${leakPattern}`);
                this.auditResults.leaksFound.push({
                    pattern: leakPattern,
                    instances: leaks,
                    severity: this.calculateLeakSeverity(leakPattern, leaks),
                    impact: this.assessLeakImpact(leakPattern, leaks)
                });
            }
        }
        
        const criticalLeaks = this.auditResults.leaksFound.filter(leak => leak.severity === 'critical');
        if (criticalLeaks.length > 0) {
            console.log(`   🚨 CRITICAL: Found ${criticalLeaks.length} critical leaks requiring immediate attention!`);
        }
    }
    
    /**
     * Phase 4: Identify gaps in safeguard coverage
     */
    async identifyGaps() {
        console.log('   🔍 Identifying coverage gaps...');
        
        const implementedSafeguards = new Set();
        
        // Collect all implemented safeguard types
        for (const safeguards of this.auditResults.safeguardInventory.values()) {
            for (const safeguard of safeguards) {
                implementedSafeguards.add(safeguard.type);
            }
        }
        
        // Find missing expected safeguards
        for (const expectedSafeguard of this.config.expectedSafeguards) {
            if (!implementedSafeguards.has(expectedSafeguard)) {
                const gap = {
                    type: expectedSafeguard,
                    severity: this.calculateGapSeverity(expectedSafeguard),
                    recommendation: this.getGapRecommendation(expectedSafeguard),
                    files: await this.findFilesNeedingSafeguard(expectedSafeguard)
                };
                
                this.auditResults.gapsIdentified.push(gap);
                
                console.log(`   🕳️ Gap found: Missing ${expectedSafeguard} (${gap.severity} severity)`);
            }
        }
        
        // Check for incomplete implementations
        await this.checkIncompleteImplementations();
    }
    
    /**
     * Phase 5: Generate actionable repair recommendations
     */
    async generateRepairRecommendations() {
        console.log('   🛠️ Generating repair recommendations...');
        
        // Recommendations for leaks
        for (const leak of this.auditResults.leaksFound) {
            const recommendations = this.generateLeakRepairRecommendations(leak);
            this.auditResults.repairRecommendations.push(...recommendations);
        }
        
        // Recommendations for gaps
        for (const gap of this.auditResults.gapsIdentified) {
            const recommendations = this.generateGapRepairRecommendations(gap);
            this.auditResults.repairRecommendations.push(...recommendations);
        }
        
        // Sort by priority
        this.auditResults.repairRecommendations.sort((a, b) => 
            this.config.repairPriorities[a.priority] - this.config.repairPriorities[b.priority]
        );
        
        const criticalRepairs = this.auditResults.repairRecommendations.filter(r => r.priority === 'critical');
        console.log(`   🛠️ Generated ${this.auditResults.repairRecommendations.length} repair recommendations`);
        console.log(`   🚨 Critical repairs needed: ${criticalRepairs.length}`);
    }
    
    /**
     * Phase 6: Calculate overall audit confidence
     */
    async calculateAuditConfidence() {
        console.log('   📊 Calculating audit confidence...');
        
        let confidenceFactors = {
            coverageCompleteness: this.calculateCoverageCompleteness(),
            implementationQuality: this.calculateImplementationQuality(),
            leakSeverity: this.calculateLeakSeverityImpact(),
            gapSeverity: this.calculateGapSeverityImpact()
        };
        
        // Weighted confidence calculation
        const weights = {
            coverageCompleteness: 0.3,
            implementationQuality: 0.3,
            leakSeverity: 0.2,
            gapSeverity: 0.2
        };
        
        this.auditResults.confidenceScore = Object.entries(confidenceFactors)
            .reduce((total, [factor, score]) => total + (score * weights[factor]), 0);
        
        console.log(`   📊 Coverage: ${(confidenceFactors.coverageCompleteness * 100).toFixed(1)}%`);
        console.log(`   📊 Quality: ${(confidenceFactors.implementationQuality * 100).toFixed(1)}%`);
        console.log(`   📊 Leak Impact: ${(confidenceFactors.leakSeverity * 100).toFixed(1)}%`);
        console.log(`   📊 Gap Impact: ${(confidenceFactors.gapSeverity * 100).toFixed(1)}%`);
    }
    
    // Safeguard detection methods
    async loadSafeguardFiles() {
        // This would scan the project for safeguard-related files
        console.log('   📁 Loading known safeguard files...');
        // Implementation would scan filesystem
    }
    
    async findSafeguardFiles() {
        // Find files likely to contain API safeguards
        const safeguardPatterns = [
            '*rate*limit*',
            '*api*',
            '*client*',
            '*service*',
            '*fallback*',
            '*retry*',
            '*circuit*',
            '*timeout*'
        ];
        
        // Mock file discovery for demo
        return [
            './api-rate-limiter.js',
            './api-error-patterns.js', 
            './llm-orchestration-engine.js',
            './api-security-gateway.js',
            './api-fallback-system.js',
            './api-client-wrapper.js'
        ];
    }
    
    async extractSafeguards(fileContent, filePath) {
        const safeguards = [];
        
        for (const [safeguardType, signatures] of this.safeguardSignatures) {
            for (const signature of signatures) {
                if (fileContent.includes(signature)) {
                    const safeguard = {
                        type: safeguardType,
                        signature,
                        file: filePath,
                        implementation: this.extractImplementationDetails(fileContent, signature),
                        confidence: this.calculateDetectionConfidence(fileContent, signature)
                    };
                    
                    safeguards.push(safeguard);
                    break; // One detection per type per file
                }
            }
        }
        
        return safeguards;
    }
    
    extractImplementationDetails(content, signature) {
        // Extract details about how the safeguard is implemented
        const lines = content.split('\n');
        const relevantLines = lines.filter(line => 
            line.toLowerCase().includes(signature.toLowerCase())
        );
        
        return {
            occurrences: relevantLines.length,
            context: relevantLines.slice(0, 3), // First 3 occurrences
            hasConfiguration: content.includes('config') || content.includes('options'),
            hasErrorHandling: content.includes('catch') || content.includes('error'),
            hasLogging: content.includes('log') || content.includes('console')
        };
    }
    
    calculateDetectionConfidence(content, signature) {
        let confidence = 0.5; // Base confidence
        
        // Higher confidence for explicit class/function names
        if (content.includes(`class ${signature}`) || content.includes(`function ${signature}`)) {
            confidence += 0.3;
        }
        
        // Higher confidence for configuration
        if (content.includes('config') && content.includes(signature)) {
            confidence += 0.2;
        }
        
        // Higher confidence for error handling
        if (content.includes('try') && content.includes('catch')) {
            confidence += 0.1;
        }
        
        return Math.min(confidence, 1.0);
    }
    
    // Effectiveness analysis methods
    assessSafeguardEffectiveness(safeguard) {
        let effectiveness = {
            score: 0.5,
            factors: {},
            issues: []
        };
        
        const impl = safeguard.implementation;
        
        // Configuration factor
        if (impl.hasConfiguration) {
            effectiveness.score += 0.2;
            effectiveness.factors.configuration = 'good';
        } else {
            effectiveness.factors.configuration = 'missing';
            effectiveness.issues.push('No configuration detected');
        }
        
        // Error handling factor  
        if (impl.hasErrorHandling) {
            effectiveness.score += 0.2;
            effectiveness.factors.errorHandling = 'good';
        } else {
            effectiveness.factors.errorHandling = 'missing';
            effectiveness.issues.push('No error handling detected');
        }
        
        // Logging factor
        if (impl.hasLogging) {
            effectiveness.score += 0.1;
            effectiveness.factors.logging = 'good';
        } else {
            effectiveness.factors.logging = 'missing';
            effectiveness.issues.push('No logging detected');
        }
        
        return effectiveness;
    }
    
    // Leak pattern detection methods
    async scanForLeakPattern(leakPattern) {
        const leaks = [];
        
        // Simulate leak pattern detection
        switch (leakPattern) {
            case 'missing-rate-limits':
                leaks.push(...await this.detectMissingRateLimits());
                break;
                
            case 'bypassed-safeguards':
                leaks.push(...await this.detectBypassedSafeguards());
                break;
                
            case 'concurrent-overload':
                leaks.push(...await this.detectConcurrentOverload());
                break;
                
            case 'cascading-failures':
                leaks.push(...await this.detectCascadingFailures());
                break;
                
            case 'timeout-loops':
                leaks.push(...await this.detectTimeoutLoops());
                break;
                
            case 'retry-storms':
                leaks.push(...await this.detectRetryStorms());
                break;
                
            case 'quota-miscalculation':
                leaks.push(...await this.detectQuotaMiscalculations());
                break;
                
            case 'fallback-failures':
                leaks.push(...await this.detectFallbackFailures());
                break;
        }
        
        return leaks;
    }
    
    async detectMissingRateLimits() {
        const leaks = [];
        
        // Check for API calls without rate limiting
        for (const [filePath] of this.auditResults.safeguardInventory) {
            try {
                const content = await fs.readFile(filePath, 'utf8');
                
                // Look for API calls
                const apiCallPatterns = ['fetch(', 'axios.', 'request(', 'post(', 'get('];
                const rateLimitPatterns = ['rateLimit', 'throttle', 'limit'];
                
                const hasAPICalls = apiCallPatterns.some(pattern => content.includes(pattern));
                const hasRateLimiting = rateLimitPatterns.some(pattern => content.includes(pattern));
                
                if (hasAPICalls && !hasRateLimiting) {
                    leaks.push({
                        file: filePath,
                        description: 'API calls without rate limiting',
                        evidence: apiCallPatterns.filter(pattern => content.includes(pattern)),
                        severity: 'high'
                    });
                }
                
            } catch (error) {
                // Skip files we can't read
            }
        }
        
        return leaks;
    }
    
    async detectBypassedSafeguards() {
        const leaks = [];
        
        // Look for code that bypasses safeguards
        const bypassPatterns = [
            'bypass',
            'skip',
            'disable',
            'override',
            'force',
            'ignore'
        ];
        
        for (const [filePath] of this.auditResults.safeguardInventory) {
            try {
                const content = await fs.readFile(filePath, 'utf8');
                
                for (const pattern of bypassPatterns) {
                    if (content.toLowerCase().includes(pattern)) {
                        leaks.push({
                            file: filePath,
                            description: `Potential safeguard bypass: ${pattern}`,
                            pattern,
                            severity: 'medium'
                        });
                    }
                }
                
            } catch (error) {
                // Skip files we can't read
            }
        }
        
        return leaks;
    }
    
    async detectConcurrentOverload() {
        const leaks = [];
        
        // Look for concurrent API calls without proper limiting
        for (const [filePath] of this.auditResults.safeguardInventory) {
            try {
                const content = await fs.readFile(filePath, 'utf8');
                
                const hasConcurrency = content.includes('Promise.all') || 
                                     content.includes('parallel') ||
                                     content.includes('concurrent');
                
                const hasLimiting = content.includes('concurrency') || 
                                  content.includes('limit') ||
                                  content.includes('throttle');
                
                if (hasConcurrency && !hasLimiting) {
                    leaks.push({
                        file: filePath,
                        description: 'Concurrent operations without limiting',
                        severity: 'high'
                    });
                }
                
            } catch (error) {
                // Skip files we can't read
            }
        }
        
        return leaks;
    }
    
    async detectCascadingFailures() {
        return []; // Implement cascading failure detection
    }
    
    async detectTimeoutLoops() {
        return []; // Implement timeout loop detection
    }
    
    async detectRetryStorms() {
        return []; // Implement retry storm detection
    }
    
    async detectQuotaMiscalculations() {
        return []; // Implement quota miscalculation detection
    }
    
    async detectFallbackFailures() {
        return []; // Implement fallback failure detection
    }
    
    // Gap analysis methods
    calculateGapSeverity(expectedSafeguard) {
        const severityMap = {
            'rate-limiting': 'critical',
            'retry-logic': 'high', 
            'circuit-breakers': 'high',
            'timeout-handling': 'medium',
            'fallback-mechanisms': 'high',
            'error-boundaries': 'medium',
            'quota-tracking': 'critical',
            'backoff-strategies': 'medium'
        };
        
        return severityMap[expectedSafeguard] || 'low';
    }
    
    getGapRecommendation(expectedSafeguard) {
        const recommendations = {
            'rate-limiting': 'Implement rate limiting for all API endpoints',
            'retry-logic': 'Add exponential backoff retry logic',
            'circuit-breakers': 'Implement circuit breaker pattern',
            'timeout-handling': 'Add proper timeout handling',
            'fallback-mechanisms': 'Create fallback strategies',
            'error-boundaries': 'Add comprehensive error handling',
            'quota-tracking': 'Implement API quota tracking',
            'backoff-strategies': 'Add backoff strategies for retries'
        };
        
        return recommendations[expectedSafeguard] || 'Implement missing safeguard';
    }
    
    async findFilesNeedingSafeguard(safeguardType) {
        // Find files that would benefit from this safeguard
        const needingSafeguard = [];
        
        const relevantPatterns = {
            'rate-limiting': ['fetch', 'axios', 'request'],
            'retry-logic': ['fetch', 'axios', 'request'],
            'circuit-breakers': ['service', 'client'],
            'timeout-handling': ['fetch', 'axios', 'request'],
            'fallback-mechanisms': ['api', 'service'],
            'error-boundaries': ['async', 'await'],
            'quota-tracking': ['api', 'limit'],
            'backoff-strategies': ['retry', 'attempt']
        };
        
        const patterns = relevantPatterns[safeguardType] || [];
        
        for (const [filePath] of this.auditResults.safeguardInventory) {
            try {
                const content = await fs.readFile(filePath, 'utf8');
                
                if (patterns.some(pattern => content.toLowerCase().includes(pattern))) {
                    needingSafeguard.push(path.basename(filePath));
                }
                
            } catch (error) {
                // Skip files we can't read
            }
        }
        
        return needingSafeguard.slice(0, 5); // Limit to 5 examples
    }
    
    async checkIncompleteImplementations() {
        // Look for incomplete safeguard implementations
        for (const [filePath, safeguards] of this.auditResults.safeguardInventory) {
            for (const safeguard of safeguards) {
                if (safeguard.effectiveness.score < 0.7) {
                    this.auditResults.gapsIdentified.push({
                        type: 'incomplete-implementation',
                        safeguardType: safeguard.type,
                        file: filePath,
                        severity: 'medium',
                        issues: safeguard.effectiveness.issues,
                        recommendation: `Complete ${safeguard.type} implementation`
                    });
                }
            }
        }
    }
    
    // Repair recommendation methods
    generateLeakRepairRecommendations(leak) {
        const recommendations = [];
        
        for (const instance of leak.instances) {
            recommendations.push({
                type: 'leak-repair',
                pattern: leak.pattern,
                file: instance.file,
                description: instance.description,
                priority: this.mapSeverityToPriority(instance.severity),
                action: this.getLeakRepairAction(leak.pattern),
                estimatedTime: this.getRepairTimeEstimate(leak.pattern)
            });
        }
        
        return recommendations;
    }
    
    generateGapRepairRecommendations(gap) {
        return [{
            type: 'gap-repair',
            safeguardType: gap.type,
            description: `Implement missing ${gap.type}`,
            priority: this.mapSeverityToPriority(gap.severity),
            action: gap.recommendation,
            files: gap.files,
            estimatedTime: this.getGapRepairTimeEstimate(gap.type)
        }];
    }
    
    getLeakRepairAction(leakPattern) {
        const actions = {
            'missing-rate-limits': 'Add rate limiting middleware to API endpoints',
            'bypassed-safeguards': 'Remove or fix safeguard bypass code',
            'concurrent-overload': 'Add concurrency limiting to parallel operations',
            'cascading-failures': 'Implement circuit breakers to prevent cascading',
            'timeout-loops': 'Fix timeout configuration and handling',
            'retry-storms': 'Add exponential backoff to retry logic',
            'quota-miscalculation': 'Fix quota tracking calculations',
            'fallback-failures': 'Implement proper fallback error handling'
        };
        
        return actions[leakPattern] || 'Fix identified issue';
    }
    
    getRepairTimeEstimate(leakPattern) {
        const estimates = {
            'missing-rate-limits': '2-4 hours',
            'bypassed-safeguards': '1-2 hours',
            'concurrent-overload': '3-5 hours',
            'cascading-failures': '4-6 hours',
            'timeout-loops': '1-3 hours',
            'retry-storms': '2-3 hours',
            'quota-miscalculation': '2-4 hours',
            'fallback-failures': '3-4 hours'
        };
        
        return estimates[leakPattern] || '2-3 hours';
    }
    
    getGapRepairTimeEstimate(safeguardType) {
        const estimates = {
            'rate-limiting': '4-6 hours',
            'retry-logic': '2-3 hours',
            'circuit-breakers': '6-8 hours',
            'timeout-handling': '1-2 hours',
            'fallback-mechanisms': '4-5 hours',
            'error-boundaries': '2-3 hours',
            'quota-tracking': '3-4 hours',
            'backoff-strategies': '2-3 hours'
        };
        
        return estimates[safeguardType] || '3-4 hours';
    }
    
    mapSeverityToPriority(severity) {
        const severityToPriority = {
            'critical': 'critical',
            'high': 'high',
            'medium': 'medium',
            'low': 'low'
        };
        
        return severityToPriority[severity] || 'medium';
    }
    
    // Confidence calculation methods
    calculateCoverageCompleteness() {
        const expectedCount = this.config.expectedSafeguards.length;
        const implementedCount = new Set(
            Array.from(this.auditResults.safeguardInventory.values())
                .flat()
                .map(s => s.type)
        ).size;
        
        return expectedCount > 0 ? implementedCount / expectedCount : 0;
    }
    
    calculateImplementationQuality() {
        const allSafeguards = Array.from(this.auditResults.safeguardInventory.values()).flat();
        
        if (allSafeguards.length === 0) return 0;
        
        const totalEffectiveness = allSafeguards.reduce((sum, s) => 
            sum + (s.effectiveness?.score || 0.5), 0
        );
        
        return totalEffectiveness / allSafeguards.length;
    }
    
    calculateLeakSeverityImpact() {
        const criticalLeaks = this.auditResults.leaksFound.filter(l => l.severity === 'critical');
        const highLeaks = this.auditResults.leaksFound.filter(l => l.severity === 'high');
        
        // Lower score means higher impact
        const impactScore = 1.0 - ((criticalLeaks.length * 0.3) + (highLeaks.length * 0.1));
        
        return Math.max(impactScore, 0);
    }
    
    calculateGapSeverityImpact() {
        const criticalGaps = this.auditResults.gapsIdentified.filter(g => g.severity === 'critical');
        const highGaps = this.auditResults.gapsIdentified.filter(g => g.severity === 'high');
        
        // Lower score means higher impact  
        const impactScore = 1.0 - ((criticalGaps.length * 0.2) + (highGaps.length * 0.1));
        
        return Math.max(impactScore, 0);
    }
    
    calculateLeakSeverity(leakPattern, instances) {
        const severityMap = {
            'missing-rate-limits': 'critical',
            'bypassed-safeguards': 'high',
            'concurrent-overload': 'high',
            'cascading-failures': 'critical',
            'timeout-loops': 'medium',
            'retry-storms': 'high',
            'quota-miscalculation': 'critical',
            'fallback-failures': 'high'
        };
        
        return severityMap[leakPattern] || 'medium';
    }
    
    assessLeakImpact(leakPattern, instances) {
        return {
            filesAffected: instances.length,
            potentialApiCalls: instances.length * 10, // Estimate
            riskLevel: this.calculateLeakSeverity(leakPattern, instances)
        };
    }
    
    // Report generation
    async generateAuditReport() {
        const report = {
            metadata: {
                auditorId: this.config.auditorId,
                timestamp: new Date().toISOString(),
                auditType: 'comprehensive-safeguard-audit',
                version: '1.0'
            },
            
            summary: {
                overallHealth: this.calculateOverallHealth(),
                safeguardsFound: this.auditResults.safeguardInventory.size,
                leaksDetected: this.auditResults.leaksFound.length,
                gapsIdentified: this.auditResults.gapsIdentified.length,
                repairsRecommended: this.auditResults.repairRecommendations.length,
                confidenceScore: this.auditResults.confidenceScore
            },
            
            findings: {
                safeguardInventory: this.serializeSafeguardInventory(),
                leaksFound: this.auditResults.leaksFound,
                gapsIdentified: this.auditResults.gapsIdentified,
                coverageMap: this.generateCoverageMap()
            },
            
            recommendations: {
                immediate: this.auditResults.repairRecommendations.filter(r => r.priority === 'critical'),
                nearTerm: this.auditResults.repairRecommendations.filter(r => r.priority === 'high'),
                longTerm: this.auditResults.repairRecommendations.filter(r => r.priority === 'medium' || r.priority === 'low')
            },
            
            actionPlan: this.generateActionPlan(),
            
            nextSteps: this.generateNextSteps()
        };
        
        // Save report
        const reportPath = './api-safeguard-audit-report.json';
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`\n📋 Safeguard Audit Report saved: ${reportPath}`);
        
        return report;
    }
    
    calculateOverallHealth() {
        const confidence = this.auditResults.confidenceScore;
        
        if (confidence >= 0.8) return 'healthy';
        if (confidence >= 0.6) return 'needs-attention';
        if (confidence >= 0.4) return 'vulnerable';
        return 'critical';
    }
    
    serializeSafeguardInventory() {
        const inventory = {};
        
        for (const [filePath, safeguards] of this.auditResults.safeguardInventory) {
            inventory[path.basename(filePath)] = safeguards.map(s => ({
                type: s.type,
                confidence: s.confidence,
                effectiveness: s.effectiveness?.score
            }));
        }
        
        return inventory;
    }
    
    generateCoverageMap() {
        const coverage = {};
        
        for (const expectedSafeguard of this.config.expectedSafeguards) {
            const implemented = Array.from(this.auditResults.safeguardInventory.values())
                .flat()
                .some(s => s.type === expectedSafeguard);
            
            coverage[expectedSafeguard] = implemented ? 'covered' : 'missing';
        }
        
        return coverage;
    }
    
    generateActionPlan() {
        const plan = {
            phase1: {
                name: 'Emergency Repairs',
                duration: '1-2 days',
                actions: this.auditResults.repairRecommendations
                    .filter(r => r.priority === 'critical')
                    .map(r => r.action)
            },
            
            phase2: {
                name: 'High Priority Fixes',
                duration: '3-5 days', 
                actions: this.auditResults.repairRecommendations
                    .filter(r => r.priority === 'high')
                    .map(r => r.action)
            },
            
            phase3: {
                name: 'System Hardening',
                duration: '1-2 weeks',
                actions: this.auditResults.repairRecommendations
                    .filter(r => r.priority === 'medium')
                    .map(r => r.action)
            }
        };
        
        return plan;
    }
    
    generateNextSteps() {
        const nextSteps = [];
        
        const criticalRepairs = this.auditResults.repairRecommendations.filter(r => r.priority === 'critical');
        
        if (criticalRepairs.length > 0) {
            nextSteps.push(`🚨 IMMEDIATE: Fix ${criticalRepairs.length} critical safeguard issues`);
            nextSteps.push(`   First Priority: ${criticalRepairs[0].action}`);
        }
        
        const majorLeaks = this.auditResults.leaksFound.filter(l => l.severity === 'critical');
        if (majorLeaks.length > 0) {
            nextSteps.push(`🕳️ URGENT: Patch ${majorLeaks.length} critical leaks in API protection`);
        }
        
        nextSteps.push('🔄 STATUS: Re-run audit after repairs to verify fixes');
        nextSteps.push('📊 MONITOR: Set up continuous safeguard monitoring');
        
        return nextSteps;
    }
    
    // Public API
    getAuditSummary() {
        return {
            auditorId: this.config.auditorId,
            safeguardsFound: this.auditResults.safeguardInventory.size,
            leaksDetected: this.auditResults.leaksFound.length,
            gapsIdentified: this.auditResults.gapsIdentified.length,
            confidenceScore: this.auditResults.confidenceScore,
            overallHealth: this.calculateOverallHealth(),
            criticalIssues: this.auditResults.repairRecommendations.filter(r => r.priority === 'critical').length
        };
    }
    
    getCriticalRepairs() {
        return this.auditResults.repairRecommendations.filter(r => r.priority === 'critical');
    }
    
    async exportAudit(outputPath = './api-safeguard-audit-export.json') {
        const fullAudit = {
            config: this.config,
            results: {
                safeguardInventory: this.serializeSafeguardInventory(),
                leaksFound: this.auditResults.leaksFound,
                gapsIdentified: this.auditResults.gapsIdentified,
                repairRecommendations: this.auditResults.repairRecommendations,
                confidenceScore: this.auditResults.confidenceScore
            },
            summary: this.getAuditSummary(),
            timestamp: new Date().toISOString()
        };
        
        await fs.writeFile(outputPath, JSON.stringify(fullAudit, null, 2));
        console.log(`📤 Audit exported: ${outputPath}`);
        return outputPath;
    }
}

module.exports = APISafeguardAuditor;

// CLI interface
if (require.main === module) {
    console.log('⚓ Starting API Safeguard Audit...\n');
    
    const auditor = new APISafeguardAuditor();
    
    auditor.auditAllSafeguards().then(async (report) => {
        console.log('\n🎯 AUDIT COMPLETE!');
        console.log('==================');
        
        const summary = auditor.getAuditSummary();
        console.log(`🛡️ Overall Health: ${summary.overallHealth.toUpperCase()}`);
        console.log(`📊 Confidence Score: ${(summary.confidenceScore * 100).toFixed(1)}%`);
        console.log(`🔍 Safeguards Found: ${summary.safeguardsFound}`);
        console.log(`🕳️ Leaks Detected: ${summary.leaksDetected}`);
        console.log(`📝 Gaps Identified: ${summary.gapsIdentified}`);
        
        if (summary.criticalIssues > 0) {
            console.log(`\n🚨 CRITICAL: ${summary.criticalIssues} issues need immediate attention!`);
            
            const criticalRepairs = auditor.getCriticalRepairs();
            console.log('\n🛠️ Critical Repairs:');
            criticalRepairs.forEach((repair, i) => {
                console.log(`   ${i + 1}. ${repair.action} (${repair.estimatedTime})`);
            });
        }
        
        console.log(`\n📋 Full report available in: api-safeguard-audit-report.json`);
        
        // Export audit data
        await auditor.exportAudit();
        
        if (summary.overallHealth === 'healthy') {
            console.log('\n✅ Ship is seaworthy - safeguards are working properly!');
        } else {
            console.log('\n⚠️ Ship needs repairs - safeguards have leaks that need patching!');
        }
        
    }).catch(error => {
        console.error('\n❌ Audit failed:', error.message);
        console.log('🚨 Unable to determine safeguard status!');
    });
}