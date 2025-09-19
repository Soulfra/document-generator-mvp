#!/usr/bin/env node

/**
 * 🔍 VERIFICATION LAYER - Bottom Layer Mathematical Verification
 * 
 * The bottom layer that verifies all top-layer decisions mathematically.
 * Issues reports/summaries when verification fails.
 * Handles debugging, exits, and re-entry points.
 * Manages proper archiving/deprecation with resumption capability.
 * 
 * Architecture:
 * - Mathematical verification of Universal Brain outputs
 * - Report generation for failed verifications
 * - Exit/re-entry point management for debugging
 * - Archive management without breaking ladder resumption
 * - Integration with existing systems
 */

const { EventEmitter } = require('events');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

console.log('\n🔍 VERIFICATION LAYER INITIALIZING...');
console.log('====================================');
console.log('🧮 Mathematical verification of top layer');
console.log('📊 Report generation for failures');  
console.log('🚪 Exit/re-entry point management');
console.log('📦 Archive management with resumption');

class VerificationLayer extends EventEmitter {
    constructor(universalBrain) {
        super();
        
        this.universalBrain = universalBrain;
        this.port = 9998; // Verification layer port
        
        // Verification configuration
        this.config = {
            verification_timeout: 30000, // 30 seconds
            max_retry_attempts: 3,
            archive_retention_days: 30,
            verification_algorithms: ['mathematical', 'logical', 'structural'],
            report_formats: ['json', 'markdown', 'xml']
        };
        
        // Verification state
        this.activeVerifications = new Map();
        this.verificationHistory = [];
        this.exitPoints = new Map(); // Debugging exit points
        this.archiveManifest = new Map(); // Archive tracking
        
        // Statistics
        this.stats = {
            total_verifications: 0,
            successful_verifications: 0,
            failed_verifications: 0,
            reports_generated: 0,
            archives_created: 0,
            resumptions_successful: 0
        };
        
        this.initializeVerificationLayer();
    }
    
    async initializeVerificationLayer() {
        console.log('🔍 Setting up verification algorithms...');
        
        // Setup verification algorithms
        this.setupVerificationAlgorithms();
        
        // Setup report generation  
        this.setupReportGeneration();
        
        // Setup exit point management
        this.setupExitPointManagement();
        
        // Setup archive management
        await this.setupArchiveManagement();
        
        // Start verification processing
        this.startVerificationProcessing();
        
        console.log('✅ Verification layer ready for mathematical validation');
    }
    
    setupVerificationAlgorithms() {
        console.log('🧮 Setting up mathematical verification algorithms...');
        
        this.algorithms = {
            // Mathematical verification - check data integrity and logic
            mathematical: {
                name: 'Mathematical Verification',
                weight: 0.4,
                verify: (data) => {
                    return this.performMathematicalVerification(data);
                }
            },
            
            // Logical verification - check reasoning and flow
            logical: {
                name: 'Logical Verification', 
                weight: 0.3,
                verify: (data) => {
                    return this.performLogicalVerification(data);
                }
            },
            
            // Structural verification - check format and completeness
            structural: {
                name: 'Structural Verification',
                weight: 0.3,
                verify: (data) => {
                    return this.performStructuralVerification(data);
                }
            }
        };
        
        console.log('🧮 Verification algorithms ready: ' + Object.keys(this.algorithms).join(', '));
    }
    
    setupReportGeneration() {
        console.log('📊 Setting up report generation system...');
        
        this.reportGenerators = {
            // JSON report - structured data
            json: (verification, failure_details) => {
                return {
                    verification_id: verification.id,
                    timestamp: new Date().toISOString(),
                    status: 'failed',
                    failure_details: failure_details,
                    recommendations: this.generateRecommendations(failure_details),
                    exit_points: this.identifyExitPoints(verification),
                    resumption_strategy: this.createResumptionStrategy(verification)
                };
            },
            
            // Markdown report - human readable
            markdown: (verification, failure_details) => {
                return this.buildMarkdownReport(verification, failure_details);
            },
            
            // XML report - structured for systems
            xml: (verification, failure_details) => {
                return this.buildXMLReport(verification, failure_details);
            }
        };
        
        console.log('📊 Report generators ready: ' + Object.keys(this.reportGenerators).join(', '));
    }
    
    setupExitPointManagement() {
        console.log('🚪 Setting up exit point management...');
        
        this.exitPointTypes = {
            // Debugging exit - for development issues
            debug: {
                name: 'Debug Exit',
                handler: (context) => this.handleDebugExit(context),
                resumption_type: 'debug_resumption'
            },
            
            // Error exit - for runtime errors
            error: {
                name: 'Error Exit',
                handler: (context) => this.handleErrorExit(context),
                resumption_type: 'error_recovery'
            },
            
            // Archive exit - for deprecation 
            archive: {
                name: 'Archive Exit',
                handler: (context) => this.handleArchiveExit(context),
                resumption_type: 'archive_restoration'
            },
            
            // Maintenance exit - for system maintenance
            maintenance: {
                name: 'Maintenance Exit',
                handler: (context) => this.handleMaintenanceExit(context),
                resumption_type: 'maintenance_resumption'
            }
        };
        
        console.log('🚪 Exit point types ready: ' + Object.keys(this.exitPointTypes).join(', '));
    }
    
    async setupArchiveManagement() {
        console.log('📦 Setting up archive management...');
        
        // Ensure archive directories exist
        const archivePaths = [
            './verification-archives',
            './verification-archives/active',
            './verification-archives/deprecated', 
            './verification-archives/resumable'
        ];
        
        for (const archivePath of archivePaths) {
            await fs.mkdir(archivePath, { recursive: true });
        }
        
        // Load existing archive manifest
        try {
            const manifestPath = './verification-archives/manifest.json';
            const manifestData = await fs.readFile(manifestPath, 'utf8');
            const manifest = JSON.parse(manifestData);
            
            // Restore archive manifest
            for (const [key, value] of Object.entries(manifest)) {
                this.archiveManifest.set(key, value);
            }
            
            console.log('📦 Loaded existing archive manifest: ' + this.archiveManifest.size + ' entries');
        } catch (error) {
            console.log('📦 No existing archive manifest found, starting fresh');
        }
    }
    
    startVerificationProcessing() {
        console.log('⚡ Starting verification processing loop...');
        
        // Process verifications every 2 seconds
        setInterval(() => {
            this.processVerifications();
        }, 2000);
        
        // Archive cleanup every hour
        setInterval(() => {
            this.performArchiveCleanup();
        }, 3600000);
    }
    
    async verify(data, context = {}) {
        const verificationId = crypto.randomUUID();
        const startTime = Date.now();
        
        console.log('🔍 Starting verification: ' + verificationId);
        
        const verification = {
            id: verificationId,
            data: data,
            context: context,
            start_time: startTime,
            status: 'processing',
            results: new Map(),
            overall_score: 0,
            failed_algorithms: [],
            exit_points: [],
            archive_candidate: false
        };
        
        this.activeVerifications.set(verificationId, verification);
        this.stats.total_verifications++;
        
        try {
            // Run all verification algorithms
            for (const [algName, algorithm] of Object.entries(this.algorithms)) {
                const algResult = await this.runVerificationAlgorithm(algorithm, data, context);
                verification.results.set(algName, algResult);
                
                if (!algResult.passed) {
                    verification.failed_algorithms.push(algName);
                }
            }
            
            // Calculate overall verification score
            verification.overall_score = this.calculateOverallScore(verification.results);
            
            // Determine if verification passed
            const verificationPassed = verification.overall_score >= 0.7; // 70% threshold
            
            if (verificationPassed) {
                verification.status = 'passed';
                this.stats.successful_verifications++;
                console.log('✅ Verification passed: ' + verificationId + ' (score: ' + verification.overall_score.toFixed(2) + ')');
            } else {
                verification.status = 'failed'; 
                this.stats.failed_verifications++;
                console.log('❌ Verification failed: ' + verificationId + ' (score: ' + verification.overall_score.toFixed(2) + ')');
                
                // Generate failure report
                await this.generateFailureReport(verification);
                
                // Create exit points for debugging
                await this.createExitPoints(verification);
                
                // Consider for archiving
                verification.archive_candidate = true;
            }
            
            verification.end_time = Date.now();
            verification.duration = verification.end_time - verification.start_time;
            
        } catch (error) {
            verification.status = 'error';
            verification.error = error.message;
            console.error('💥 Verification error: ' + verificationId + ' - ' + error.message);
            
            // Create error exit point
            await this.createExitPoint(verification, 'error', { error: error.message });
        }
        
        // Store in history
        this.verificationHistory.push({
            id: verificationId,
            status: verification.status,
            score: verification.overall_score,
            duration: verification.duration,
            timestamp: new Date().toISOString()
        });
        
        // Remove from active after storing results
        setTimeout(() => {
            this.activeVerifications.delete(verificationId);
        }, 60000);
        
        return verification;
    }
    
    async runVerificationAlgorithm(algorithm, data, context) {
        const startTime = Date.now();
        
        try {
            const result = await algorithm.verify(data, context);
            const duration = Date.now() - startTime;
            
            return {
                passed: result.passed || false,
                score: result.score || 0,
                details: result.details || {},
                duration: duration,
                algorithm: algorithm.name
            };
        } catch (error) {
            return {
                passed: false,
                score: 0,
                error: error.message,
                duration: Date.now() - startTime,
                algorithm: algorithm.name
            };
        }
    }
    
    performMathematicalVerification(data) {
        // Mathematical verification logic
        if (!data || typeof data !== 'object') {
            return { passed: false, score: 0, details: { error: 'Invalid data format' } };
        }
        
        let score = 0;
        const details = {};
        
        // Check for required fields
        if (data.result && typeof data.result === 'object') {
            score += 0.3;
            details.structure_valid = true;
        }
        
        // Check for logical consistency
        if (data.intent && data.result) {
            score += 0.3;
            details.intent_result_match = true;
        }
        
        // Check for completeness
        if (data.timestamp && data.processedBy) {
            score += 0.2;
            details.metadata_complete = true;
        }
        
        // Check for mathematical properties
        if (this.validateMathematicalProperties(data)) {
            score += 0.2;
            details.mathematical_properties_valid = true;
        }
        
        return {
            passed: score >= 0.7,
            score: score,
            details: details
        };
    }
    
    performLogicalVerification(data) {
        // Logical verification logic
        let score = 0;
        const details = {};
        
        // Check reasoning flow
        if (data.intent && data.intent.routing) {
            score += 0.4;
            details.routing_logical = true;
        }
        
        // Check character assignment
        if (data.intent && data.intent.character) {
            const character = data.intent.character;
            const domain = data.intent.domain;
            
            // Verify character-domain alignment
            if (this.validateCharacterDomainAlignment(character, domain)) {
                score += 0.3;
                details.character_domain_aligned = true;
            }
        }
        
        // Check result consistency
        if (data.result && data.result.source) {
            score += 0.3;
            details.result_source_consistent = true;
        }
        
        return {
            passed: score >= 0.7,
            score: score,
            details: details
        };
    }
    
    performStructuralVerification(data) {
        // Structural verification logic
        let score = 0;
        const details = {};
        
        // Check required top-level fields
        const requiredFields = ['success', 'intent', 'result', 'timestamp', 'processedBy'];
        const presentFields = requiredFields.filter(field => data.hasOwnProperty(field));
        
        score += (presentFields.length / requiredFields.length) * 0.5;
        details.required_fields_present = presentFields.length + '/' + requiredFields.length;
        
        // Check data types
        if (typeof data.success === 'boolean') {
            score += 0.1;
            details.success_type_valid = true;
        }
        
        if (data.timestamp && new Date(data.timestamp).toString() !== 'Invalid Date') {
            score += 0.1;
            details.timestamp_valid = true;
        }
        
        // Check nested structure
        if (data.intent && typeof data.intent === 'object') {
            score += 0.15;
            details.intent_structure_valid = true;
        }
        
        if (data.result && typeof data.result === 'object') {
            score += 0.15;
            details.result_structure_valid = true;
        }
        
        return {
            passed: score >= 0.7,
            score: score,
            details: details
        };
    }
    
    validateMathematicalProperties(data) {
        // Basic mathematical property validation
        if (data.verificationId && typeof data.verificationId === 'string') {
            // Check if verificationId is a valid UUID
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            return uuidRegex.test(data.verificationId);
        }
        
        return true; // Default to valid if no specific properties to check
    }
    
    validateCharacterDomainAlignment(character, domain) {
        // Character-domain alignment validation
        const alignments = {
            'cal': ['fintech', 'systems', 'database', 'architecture'],
            'arty': ['gaming', 'design', 'visual', 'creative'],
            'ralph': ['infrastructure', 'devops', 'deployment', 'scaling'],
            'vera': ['research', 'ai', 'ml', 'algorithms'],
            'paulo': ['security', 'auth', 'protection', 'compliance'],
            'nash': ['community', 'communication', 'docs', 'support']
        };
        
        return alignments[character] && alignments[character].includes(domain);
    }
    
    calculateOverallScore(results) {
        let weightedScore = 0;
        
        for (const [algName, result] of results) {
            const algorithm = this.algorithms[algName];
            if (algorithm && result.score !== undefined) {
                weightedScore += result.score * algorithm.weight;
            }
        }
        
        return weightedScore;
    }
    
    async generateFailureReport(verification) {
        const reportId = crypto.randomUUID();
        const timestamp = new Date().toISOString();
        
        console.log('📊 Generating failure report: ' + reportId);
        
        // Collect failure details
        const failureDetails = {
            verification_id: verification.id,
            overall_score: verification.overall_score,
            failed_algorithms: verification.failed_algorithms,
            algorithm_results: Object.fromEntries(verification.results),
            recommendations: this.generateRecommendations(verification),
            debugging_info: this.extractDebuggingInfo(verification)
        };
        
        // Generate reports in all formats
        const reports = {};
        for (const [format, generator] of Object.entries(this.reportGenerators)) {
            try {
                reports[format] = generator(verification, failureDetails);
            } catch (error) {
                console.error('Report generation error (' + format + '):', error);
            }
        }
        
        // Save reports to disk
        const reportDir = './verification-archives/reports';
        await fs.mkdir(reportDir, { recursive: true });
        
        for (const [format, report] of Object.entries(reports)) {
            const reportPath = path.join(reportDir, reportId + '.' + format);
            const reportContent = typeof report === 'string' ? report : JSON.stringify(report, null, 2);
            
            try {
                await fs.writeFile(reportPath, reportContent);
            } catch (error) {
                console.error('Failed to save ' + format + ' report:', error);
            }
        }
        
        this.stats.reports_generated++;
        
        return {
            report_id: reportId,
            reports: reports,
            saved_formats: Object.keys(reports)
        };
    }
    
    generateRecommendations(verification) {
        const recommendations = [];
        
        // Analyze failed algorithms
        for (const algName of verification.failed_algorithms) {
            const result = verification.results.get(algName);
            
            switch (algName) {
                case 'mathematical':
                    recommendations.push('Review data structure and mathematical properties');
                    recommendations.push('Ensure all required fields are present and properly typed');
                    break;
                    
                case 'logical':
                    recommendations.push('Check reasoning flow and character-domain alignment');
                    recommendations.push('Verify intent-result consistency');
                    break;
                    
                case 'structural':
                    recommendations.push('Validate data structure and nested object integrity');
                    recommendations.push('Ensure proper timestamp and metadata formatting');
                    break;
            }
        }
        
        // Add general recommendations based on score
        if (verification.overall_score < 0.3) {
            recommendations.push('CRITICAL: Complete system review required');
            recommendations.push('Consider rolling back to previous working version');
        } else if (verification.overall_score < 0.5) {
            recommendations.push('Major issues detected - immediate attention required');
            recommendations.push('Review Universal Brain decision logic');
        } else if (verification.overall_score < 0.7) {
            recommendations.push('Minor issues detected - review and fix before deployment');
        }
        
        return recommendations;
    }
    
    extractDebuggingInfo(verification) {
        return {
            data_preview: JSON.stringify(verification.data).substring(0, 500) + '...',
            context_info: verification.context,
            algorithm_details: Object.fromEntries(verification.results),
            timing_info: {
                start_time: verification.start_time,
                end_time: verification.end_time,
                duration: verification.duration
            }
        };
    }
    
    async createExitPoints(verification) {
        const exitPointId = crypto.randomUUID();
        
        console.log('🚪 Creating exit points for verification: ' + verification.id);
        
        // Determine appropriate exit point type
        let exitType = 'debug'; // default
        
        if (verification.overall_score < 0.3) {
            exitType = 'error';
        } else if (verification.archive_candidate) {
            exitType = 'archive';
        }
        
        await this.createExitPoint(verification, exitType, {
            reason: 'verification_failure',
            score: verification.overall_score,
            failed_algorithms: verification.failed_algorithms
        });
    }
    
    async createExitPoint(verification, exitType, context) {
        const exitPointId = crypto.randomUUID();
        const timestamp = new Date().toISOString();
        
        const exitPoint = {
            id: exitPointId,
            verification_id: verification.id,
            type: exitType,
            context: context,
            created_at: timestamp,
            resumption_strategy: this.createResumptionStrategy(verification, exitType),
            archived: false
        };
        
        this.exitPoints.set(exitPointId, exitPoint);
        
        // Save exit point to disk for persistence
        const exitPointPath = './verification-archives/exit-points/' + exitPointId + '.json';
        await fs.mkdir(path.dirname(exitPointPath), { recursive: true });
        await fs.writeFile(exitPointPath, JSON.stringify(exitPoint, null, 2));
        
        console.log('🚪 Exit point created: ' + exitPointId + ' (type: ' + exitType + ')');
        
        return exitPoint;
    }
    
    createResumptionStrategy(verification, exitType = 'debug') {
        const strategy = {
            resumption_type: this.exitPointTypes[exitType]?.resumption_type || 'generic_resumption',
            steps: [],
            requirements: [],
            estimated_time: '5-10 minutes'
        };
        
        // Add steps based on verification failure
        if (verification.failed_algorithms.includes('mathematical')) {
            strategy.steps.push('Fix mathematical verification issues');
            strategy.steps.push('Validate data structure and types');
            strategy.requirements.push('Data structure review');
        }
        
        if (verification.failed_algorithms.includes('logical')) {
            strategy.steps.push('Review reasoning flow and logic');
            strategy.steps.push('Verify character-domain alignments');
            strategy.requirements.push('Logic flow analysis');
        }
        
        if (verification.failed_algorithms.includes('structural')) {
            strategy.steps.push('Fix structural verification issues'); 
            strategy.steps.push('Ensure proper field formatting');
            strategy.requirements.push('Structure validation');
        }
        
        // Add general resumption steps
        strategy.steps.push('Re-run verification');
        strategy.steps.push('Confirm all algorithms pass');
        strategy.steps.push('Resume normal processing');
        
        return strategy;
    }
    
    async handleDebugExit(context) {
        console.log('🐛 Handling debug exit...');
        
        return {
            exit_handled: true,
            debug_info: context,
            next_steps: ['Review debug information', 'Fix identified issues', 'Resume processing']
        };
    }
    
    async handleErrorExit(context) {
        console.log('💥 Handling error exit...');
        
        return {
            exit_handled: true,
            error_info: context,
            recovery_strategy: 'automatic_retry',
            next_steps: ['Log error details', 'Attempt automatic recovery', 'Escalate if needed']
        };
    }
    
    async handleArchiveExit(context) {
        console.log('📦 Handling archive exit...');
        
        // Create archive entry
        const archiveId = await this.createArchiveEntry(context);
        
        return {
            exit_handled: true,
            archive_id: archiveId,
            next_steps: ['Data archived safely', 'Resumption point created', 'Processing can continue']
        };
    }
    
    async handleMaintenanceExit(context) {
        console.log('🔧 Handling maintenance exit...');
        
        return {
            exit_handled: true,
            maintenance_info: context,
            next_steps: ['System in maintenance mode', 'Complete maintenance tasks', 'Resume normal operation']
        };
    }
    
    async createArchiveEntry(context) {
        const archiveId = crypto.randomUUID();
        const timestamp = new Date().toISOString();
        
        const archiveEntry = {
            id: archiveId,
            context: context,
            created_at: timestamp,
            status: 'active',
            resumption_point: this.createResumptionPoint(context),
            archive_path: './verification-archives/active/' + archiveId + '.json'
        };
        
        // Save archive entry
        await fs.writeFile(archiveEntry.archive_path, JSON.stringify(archiveEntry, null, 2));
        
        // Update manifest
        this.archiveManifest.set(archiveId, {
            created_at: timestamp,
            status: 'active',
            resumption_available: true
        });
        
        // Save updated manifest
        await this.saveArchiveManifest();
        
        this.stats.archives_created++;
        
        console.log('📦 Archive entry created: ' + archiveId);
        
        return archiveId;
    }
    
    createResumptionPoint(context) {
        return {
            resumption_id: crypto.randomUUID(),
            context_snapshot: context,
            resumption_instructions: [
                'Load context from snapshot',
                'Restore previous state',
                'Continue processing from interruption point'
            ],
            compatibility_version: '1.0.0'
        };
    }
    
    async saveArchiveManifest() {
        const manifestPath = './verification-archives/manifest.json';
        const manifest = Object.fromEntries(this.archiveManifest);
        
        await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    }
    
    async performArchiveCleanup() {
        console.log('🧹 Performing archive cleanup...');
        
        const now = Date.now();
        const retentionMs = this.config.archive_retention_days * 24 * 60 * 60 * 1000;
        
        let cleanupCount = 0;
        
        for (const [archiveId, archiveInfo] of this.archiveManifest) {
            const createdAt = new Date(archiveInfo.created_at).getTime();
            const age = now - createdAt;
            
            if (age > retentionMs && archiveInfo.status !== 'protected') {
                await this.archiveEntry(archiveId);
                cleanupCount++;
            }
        }
        
        console.log('🧹 Archive cleanup complete: ' + cleanupCount + ' entries processed');
    }
    
    async archiveEntry(archiveId) {
        const archiveInfo = this.archiveManifest.get(archiveId);
        if (!archiveInfo) return;
        
        // Move from active to deprecated
        const activePath = './verification-archives/active/' + archiveId + '.json';
        const deprecatedPath = './verification-archives/deprecated/' + archiveId + '.json';
        
        try {
            const data = await fs.readFile(activePath);
            await fs.writeFile(deprecatedPath, data);
            await fs.unlink(activePath);
            
            // Update manifest
            archiveInfo.status = 'deprecated';
            archiveInfo.deprecated_at = new Date().toISOString();
            
            await this.saveArchiveManifest();
            
            console.log('📦 Archived entry: ' + archiveId);
        } catch (error) {
            console.error('Archive error for ' + archiveId + ':', error);
        }
    }
    
    processVerifications() {
        // This method is called by interval - currently verification is handled synchronously
        // Could be expanded for async processing queue
    }
    
    buildMarkdownReport(verification, failureDetails) {
        const lines = [];
        
        lines.push('# Verification Failure Report');
        lines.push('');
        lines.push('**Verification ID:** `' + verification.id + '`');
        lines.push('**Timestamp:** ' + new Date().toISOString());
        lines.push('**Overall Score:** ' + verification.overall_score.toFixed(2) + '/1.00');
        lines.push('');
        lines.push('## Failed Algorithms');
        lines.push('');
        
        for (const algName of verification.failed_algorithms) {
            const result = verification.results.get(algName);
            lines.push('### ' + algName.charAt(0).toUpperCase() + algName.slice(1));
            lines.push('- **Score:** ' + (result.score || 0).toFixed(2));
            lines.push('- **Status:** FAILED');
            if (result.error) {
                lines.push('- **Error:** ' + result.error);
            }
            lines.push('');
        }
        
        lines.push('## Recommendations');
        lines.push('');
        for (const rec of failureDetails.recommendations) {
            lines.push('- ' + rec);
        }
        lines.push('');
        lines.push('## Next Steps');
        lines.push('');
        lines.push('1. Review the failed algorithms above');
        lines.push('2. Apply the recommended fixes');
        lines.push('3. Re-run verification');
        lines.push('4. Ensure all algorithms pass before deployment');
        lines.push('');
        lines.push('---');
        lines.push('*Generated by Verification Layer*');
        
        return lines.join('\n');
    }
    
    buildXMLReport(verification, failureDetails) {
        const lines = [];
        
        lines.push('<?xml version="1.0" encoding="UTF-8"?>');
        lines.push('<verification_report>');
        lines.push('  <metadata>');
        lines.push('    <verification_id>' + verification.id + '</verification_id>');
        lines.push('    <timestamp>' + new Date().toISOString() + '</timestamp>');
        lines.push('    <overall_score>' + verification.overall_score.toFixed(2) + '</overall_score>');
        lines.push('    <status>failed</status>');
        lines.push('  </metadata>');
        lines.push('  <failed_algorithms>');
        
        for (const algName of verification.failed_algorithms) {
            const result = verification.results.get(algName);
            lines.push('    <algorithm>');
            lines.push('      <name>' + algName + '</name>');
            lines.push('      <score>' + (result.score || 0).toFixed(2) + '</score>');
            if (result.error) {
                lines.push('      <error>' + result.error + '</error>');
            }
            lines.push('    </algorithm>');
        }
        
        lines.push('  </failed_algorithms>');
        lines.push('  <recommendations>');
        
        for (const rec of failureDetails.recommendations) {
            lines.push('    <recommendation>' + rec + '</recommendation>');
        }
        
        lines.push('  </recommendations>');
        lines.push('</verification_report>');
        
        return lines.join('\n');
    }
    
    getStats() {
        return {
            ...this.stats,
            active_verifications: this.activeVerifications.size,
            exit_points: this.exitPoints.size,
            archive_entries: this.archiveManifest.size,
            success_rate: this.stats.total_verifications > 0 
                ? (this.stats.successful_verifications / this.stats.total_verifications) 
                : 0
        };
    }
}

module.exports = VerificationLayer;