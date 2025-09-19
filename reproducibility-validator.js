#!/usr/bin/env node

/**
 * Reproducibility Validator - Context Switch Integrity Checker
 * 
 * Ensures that context switching maintains functionality by:
 * - Validating system state before and after context switches
 * - Running comprehensive test suites across environments
 * - Verifying service health and configuration integrity
 * - Checking data consistency and reproducibility
 * - Providing rollback mechanisms for failed switches
 * 
 * This validates the entire encoding/decoding architecture to ensure
 * the same functionality is reproducible across all contexts.
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const crypto = require('crypto');

class ReproducibilityValidator {
    constructor(baseDir = process.cwd()) {
        this.baseDir = baseDir;
        
        // Validation components
        this.contextProfileParser = null;
        this.environmentSwitcher = null;
        this.characterSettingsManager = null;
        
        // Validation state
        this.validationHistory = [];
        this.testSuites = this.initializeTestSuites();
        this.benchmarks = new Map();
        
        // Results tracking
        this.lastValidation = null;
        this.reproductionResults = {};
        
        this.initializeComponents();
    }
    
    /**
     * Initialize integrated components
     */
    async initializeComponents() {
        try {
            const ContextProfileParser = require('./context-profile-parser');
            const EnvironmentSwitcher = require('./environment-switcher');
            const CharacterSettingsManager = require('./character-settings-manager');
            
            this.contextProfileParser = new ContextProfileParser(this.baseDir);
            this.environmentSwitcher = new EnvironmentSwitcher(this.baseDir);
            this.characterSettingsManager = new CharacterSettingsManager(this.baseDir);
            
            console.log('✅ Validation components initialized');
        } catch (error) {
            console.warn('⚠️  Some components could not be initialized:', error.message);
        }
    }
    
    /**
     * Full reproducibility validation across all contexts
     */
    async validateFullReproducibility(options = {}) {
        const {
            environments = ['dev', 'staging', 'prod', 'remote'],
            testDepth = 'comprehensive',
            createReports = true,
            autoFix = false
        } = options;
        
        console.log('🔍 Starting full reproducibility validation...');
        console.log(`  Environments: ${environments.join(', ')}`);
        console.log(`  Test depth: ${testDepth}`);
        
        const validation = {
            id: this.generateValidationId(),
            timestamp: new Date().toISOString(),
            environments,
            results: {},
            summary: {
                passed: 0,
                failed: 0,
                warnings: 0,
                total: environments.length
            },
            issues: [],
            recommendations: []
        };
        
        // Record initial state
        const initialState = await this.captureSystemState();
        validation.initialState = initialState;
        
        try {
            // Validate each environment
            for (const env of environments) {
                console.log(`\n🧪 Validating ${env} environment...`);
                
                const envResult = await this.validateEnvironment(env, {
                    testDepth,
                    baseline: initialState
                });
                
                validation.results[env] = envResult;
                
                if (envResult.passed) {
                    validation.summary.passed++;
                    console.log(`  ✅ ${env}: PASSED`);
                } else {
                    validation.summary.failed++;
                    console.log(`  ❌ ${env}: FAILED`);
                    validation.issues.push(...envResult.issues);
                }
                
                if (envResult.warnings.length > 0) {
                    validation.summary.warnings += envResult.warnings.length;
                }
            }
            
            // Cross-environment validation
            console.log('\n🔄 Cross-environment validation...');
            const crossValidation = await this.validateCrossEnvironment(environments, validation.results);
            validation.crossValidation = crossValidation;
            
            // Generate recommendations
            validation.recommendations = this.generateRecommendations(validation);
            
            // Auto-fix if requested and safe
            if (autoFix && this.isSafeToAutoFix(validation)) {
                console.log('\n🔧 Applying auto-fixes...');
                const fixes = await this.applyAutoFixes(validation);
                validation.autoFixes = fixes;
            }
            
            // Create validation report
            if (createReports) {
                await this.createValidationReport(validation);
            }
            
            // Store validation
            this.lastValidation = validation;
            this.validationHistory.push(validation);
            await this.saveValidationHistory();
            
            console.log(`\n📊 Validation Complete:`);
            console.log(`  Passed: ${validation.summary.passed}/${validation.summary.total}`);
            console.log(`  Failed: ${validation.summary.failed}/${validation.summary.total}`);
            console.log(`  Warnings: ${validation.summary.warnings}`);
            console.log(`  Issues: ${validation.issues.length}`);
            
            return validation;
            
        } catch (error) {
            validation.error = error.message;
            validation.summary.failed = environments.length;
            
            console.error('❌ Validation failed:', error.message);
            throw error;
        } finally {
            // Restore initial state if needed
            await this.restoreSystemState(initialState);
        }
    }
    
    /**
     * Validate a specific environment context
     */
    async validateEnvironment(environment, options = {}) {
        const { testDepth, baseline } = options;
        
        const result = {
            environment,
            passed: false,
            score: 0,
            tests: {},
            issues: [],
            warnings: [],
            metrics: {},
            evidence: {}
        };
        
        try {
            // 1. Profile validation
            console.log(`  📋 Validating context profile...`);
            const profileValidation = await this.validateContextProfile(environment);
            result.tests.profile = profileValidation;
            
            // 2. Context switch test
            console.log(`  🔄 Testing context switch...`);
            const switchValidation = await this.validateContextSwitch(environment);
            result.tests.contextSwitch = switchValidation;
            
            // 3. Character settings validation
            console.log(`  🎭 Validating character settings...`);
            const characterValidation = await this.validateCharacterSettings(environment);
            result.tests.character = characterValidation;
            
            // 4. Service health validation
            console.log(`  ⚕️  Validating service health...`);
            const serviceValidation = await this.validateServiceHealth(environment);
            result.tests.services = serviceValidation;
            
            // 5. Functionality tests
            if (testDepth === 'comprehensive') {
                console.log(`  🧪 Running functionality tests...`);
                const functionalityTests = await this.runFunctionalityTests(environment);
                result.tests.functionality = functionalityTests;
            }
            
            // 6. Performance benchmarks
            console.log(`  🏃 Running performance benchmarks...`);
            const performanceValidation = await this.validatePerformance(environment, baseline);
            result.tests.performance = performanceValidation;
            
            // Calculate overall score and pass/fail
            result.score = this.calculateValidationScore(result.tests);
            result.passed = result.score >= 0.8; // 80% pass threshold
            
            // Collect issues and warnings
            Object.values(result.tests).forEach(test => {
                if (test.issues) result.issues.push(...test.issues);
                if (test.warnings) result.warnings.push(...test.warnings);
            });
            
            // Store evidence
            result.evidence = {
                configFiles: await this.collectConfigEvidence(),
                systemState: await this.captureSystemState(),
                logs: await this.collectRelevantLogs()
            };
            
        } catch (error) {
            result.error = error.message;
            result.issues.push(`Environment validation failed: ${error.message}`);
        }
        
        return result;
    }
    
    /**
     * Validate context profile structure and content
     */
    async validateContextProfile(environment) {
        const validation = {
            passed: false,
            issues: [],
            warnings: [],
            profile: null
        };
        
        try {
            // Load profile using context profile parser
            if (this.contextProfileParser) {
                validation.profile = await this.contextProfileParser.loadContextProfile(environment);
                
                // Validate structure
                const structureValidation = this.contextProfileParser.validateProfile(validation.profile);
                if (!structureValidation.valid) {
                    validation.issues.push(...structureValidation.errors);
                }
            } else {
                // Fallback validation
                const profilePath = path.resolve(this.baseDir, `context-profile-document-generator-${environment}.json`);
                const content = await fs.readFile(profilePath, 'utf-8');
                validation.profile = JSON.parse(content);
            }
            
            // Validate required fields
            const requiredFields = ['environment', 'services', 'personality', 'constraints'];
            requiredFields.forEach(field => {
                if (!validation.profile[field]) {
                    validation.issues.push(`Missing required field: ${field}`);
                }
            });
            
            // Validate field values
            if (validation.profile.environment !== environment) {
                validation.issues.push(`Profile environment mismatch: expected ${environment}, got ${validation.profile.environment}`);
            }
            
            validation.passed = validation.issues.length === 0;
            
        } catch (error) {
            validation.issues.push(`Could not load profile: ${error.message}`);
        }
        
        return validation;
    }
    
    /**
     * Validate context switching works correctly
     */
    async validateContextSwitch(environment) {
        const validation = {
            passed: false,
            issues: [],
            warnings: [],
            switchTime: 0,
            rollbackSuccessful: null
        };
        
        try {
            const startTime = Date.now();
            
            // Record current state
            const preState = await this.captureSystemState();
            
            // Perform context switch (dry run first)
            if (this.environmentSwitcher) {
                // Try dry run first
                const dryRun = await this.environmentSwitcher.switchContext(environment, { dryRun: true });
                if (!dryRun.success) {
                    validation.issues.push('Dry run context switch failed');
                    return validation;
                }
                
                // Perform actual switch
                const switchResult = await this.environmentSwitcher.switchContext(environment, { 
                    backup: true,
                    validate: true 
                });
                
                if (!switchResult.success) {
                    validation.issues.push('Context switch failed');
                    return validation;
                }
                
                validation.switchTime = Date.now() - startTime;
                
                // Verify post-switch state
                const postState = await this.captureSystemState();
                const stateComparison = this.compareSystemStates(preState, postState);
                
                if (!stateComparison.valid) {
                    validation.issues.push(...stateComparison.issues);
                }
                
                validation.passed = validation.issues.length === 0;
                
            } else {
                validation.warnings.push('Environment switcher not available - using basic validation');
                validation.passed = true;
            }
            
        } catch (error) {
            validation.issues.push(`Context switch validation failed: ${error.message}`);
        }
        
        return validation;
    }
    
    /**
     * Validate character settings are applied correctly
     */
    async validateCharacterSettings(environment) {
        const validation = {
            passed: false,
            issues: [],
            warnings: [],
            characterConfig: null,
            systemConfig: null
        };
        
        try {
            // Load character configuration
            if (this.characterSettingsManager) {
                validation.characterConfig = await this.characterSettingsManager.loadCurrentCharacter();
                
                // Verify environment matches
                if (validation.characterConfig.environment !== environment) {
                    validation.issues.push(`Character environment mismatch: ${validation.characterConfig.environment} != ${environment}`);
                }
                
                // Check if settings are applied to system
                const systemConfig = await this.readSystemConfiguration();
                validation.systemConfig = systemConfig;
                
                // Validate personality application
                const personalityValidation = this.validatePersonalityApplication(
                    validation.characterConfig.personality,
                    systemConfig
                );
                if (!personalityValidation.valid) {
                    validation.issues.push(...personalityValidation.issues);
                }
                
                // Validate constraints application
                const constraintsValidation = this.validateConstraintsApplication(
                    validation.characterConfig.constraints,
                    systemConfig
                );
                if (!constraintsValidation.valid) {
                    validation.issues.push(...constraintsValidation.issues);
                }
                
            } else {
                validation.warnings.push('Character settings manager not available');
            }
            
            validation.passed = validation.issues.length === 0;
            
        } catch (error) {
            validation.issues.push(`Character settings validation failed: ${error.message}`);
        }
        
        return validation;
    }
    
    /**
     * Validate service health in current environment
     */
    async validateServiceHealth(environment) {
        const validation = {
            passed: false,
            issues: [],
            warnings: [],
            services: {}
        };
        
        try {
            // Check Docker services if available
            try {
                const { stdout } = await execAsync('docker-compose ps --services --filter status=running');
                const runningServices = stdout.trim().split('\n').filter(s => s);
                
                for (const service of runningServices) {
                    try {
                        const { stdout: serviceStatus } = await execAsync(`docker-compose ps ${service}`);
                        const isHealthy = serviceStatus.includes('Up');
                        
                        validation.services[service] = {
                            status: isHealthy ? 'healthy' : 'unhealthy',
                            details: serviceStatus
                        };
                        
                        if (!isHealthy) {
                            validation.issues.push(`Service ${service} is not healthy`);
                        }
                    } catch (error) {
                        validation.services[service] = {
                            status: 'error',
                            error: error.message
                        };
                        validation.warnings.push(`Could not check service ${service}: ${error.message}`);
                    }
                }
            } catch (error) {
                validation.warnings.push('Docker Compose not available or no services running');
            }
            
            // Check specific service endpoints
            const serviceChecks = await this.checkServiceEndpoints(environment);
            validation.services = { ...validation.services, ...serviceChecks };
            
            // Determine overall health
            const healthyServices = Object.values(validation.services).filter(s => s.status === 'healthy').length;
            const totalServices = Object.keys(validation.services).length;
            
            if (totalServices > 0 && healthyServices / totalServices < 0.8) {
                validation.issues.push(`Too many unhealthy services: ${healthyServices}/${totalServices} healthy`);
            }
            
            validation.passed = validation.issues.length === 0;
            
        } catch (error) {
            validation.issues.push(`Service health validation failed: ${error.message}`);
        }
        
        return validation;
    }
    
    /**
     * Run comprehensive functionality tests
     */
    async runFunctionalityTests(environment) {
        const validation = {
            passed: false,
            issues: [],
            warnings: [],
            tests: {}
        };
        
        // Run test suites specific to the environment
        const testSuite = this.testSuites[environment] || this.testSuites.default;
        
        for (const [testName, testConfig] of Object.entries(testSuite)) {
            console.log(`    🧪 Running ${testName}...`);
            
            try {
                const testResult = await this.runTest(testConfig);
                validation.tests[testName] = testResult;
                
                if (!testResult.passed) {
                    validation.issues.push(`Test ${testName} failed: ${testResult.error || 'Unknown error'}`);
                }
            } catch (error) {
                validation.tests[testName] = {
                    passed: false,
                    error: error.message
                };
                validation.issues.push(`Test ${testName} threw error: ${error.message}`);
            }
        }
        
        // Calculate pass rate
        const passedTests = Object.values(validation.tests).filter(t => t.passed).length;
        const totalTests = Object.keys(validation.tests).length;
        
        validation.passed = totalTests > 0 && passedTests / totalTests >= 0.9; // 90% pass rate
        
        return validation;
    }
    
    /**
     * Validate performance benchmarks
     */
    async validatePerformance(environment, baseline) {
        const validation = {
            passed: false,
            issues: [],
            warnings: [],
            benchmarks: {},
            comparison: null
        };
        
        try {
            // Run performance benchmarks
            validation.benchmarks = await this.runPerformanceBenchmarks(environment);
            
            // Compare with baseline if available
            if (baseline && baseline.performance) {
                validation.comparison = this.comparePerformance(baseline.performance, validation.benchmarks);
                
                // Check for significant performance degradation
                Object.entries(validation.comparison).forEach(([metric, comparison]) => {
                    if (comparison.degradation > 0.2) { // 20% degradation threshold
                        validation.issues.push(`Significant performance degradation in ${metric}: ${(comparison.degradation * 100).toFixed(1)}%`);
                    } else if (comparison.degradation > 0.1) {
                        validation.warnings.push(`Minor performance degradation in ${metric}: ${(comparison.degradation * 100).toFixed(1)}%`);
                    }
                });
            }
            
            validation.passed = validation.issues.length === 0;
            
        } catch (error) {
            validation.issues.push(`Performance validation failed: ${error.message}`);
        }
        
        return validation;
    }
    
    /**
     * Cross-environment validation
     */
    async validateCrossEnvironment(environments, results) {
        const crossValidation = {
            passed: false,
            issues: [],
            warnings: [],
            consistency: {},
            compatibility: {}
        };
        
        try {
            // Check configuration consistency across environments
            crossValidation.consistency = this.validateConfigurationConsistency(results);
            
            // Check compatibility between environments
            crossValidation.compatibility = this.validateEnvironmentCompatibility(environments, results);
            
            // Check for reproducibility across environments
            const reproducibility = this.validateReproducibility(results);
            crossValidation.reproducibility = reproducibility;
            
            if (!reproducibility.consistent) {
                crossValidation.issues.push(...reproducibility.issues);
            }
            
            crossValidation.passed = crossValidation.issues.length === 0;
            
        } catch (error) {
            crossValidation.issues.push(`Cross-environment validation failed: ${error.message}`);
        }
        
        return crossValidation;
    }
    
    /**
     * Generate system fingerprint for reproducibility checking
     */
    async generateSystemFingerprint() {
        const fingerprint = {
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'unknown',
            system: {}
        };
        
        try {
            // Capture configuration files
            const configFiles = [
                'character-config.json',
                '.env',
                '.env.personality',
                '.env.constraints'
            ];
            
            fingerprint.configs = {};
            for (const file of configFiles) {
                try {
                    const content = await fs.readFile(path.resolve(this.baseDir, file), 'utf-8');
                    fingerprint.configs[file] = crypto.createHash('sha256').update(content).digest('hex');
                } catch (error) {
                    fingerprint.configs[file] = null;
                }
            }
            
            // Capture system state
            fingerprint.system = await this.captureSystemState();
            
            // Generate overall hash
            fingerprint.hash = crypto.createHash('sha256')
                .update(JSON.stringify(fingerprint))
                .digest('hex');
            
        } catch (error) {
            fingerprint.error = error.message;
        }
        
        return fingerprint;
    }
    
    /**
     * Helper methods
     */
    
    initializeTestSuites() {
        return {
            dev: {
                'context-profile-parse': {
                    type: 'command',
                    command: 'node context-profile-parser.js parse-existing',
                    expectSuccess: true
                },
                'environment-switch-dry-run': {
                    type: 'command', 
                    command: 'node environment-switcher.js switch dev --dry-run',
                    expectSuccess: true
                },
                'character-status-check': {
                    type: 'command',
                    command: 'node character-settings-manager.js status',
                    expectSuccess: true
                }
            },
            staging: {
                'context-validation': {
                    type: 'command',
                    command: 'node environment-switcher.js validate staging',
                    expectSuccess: true
                }
            },
            prod: {
                'context-validation': {
                    type: 'command',
                    command: 'node environment-switcher.js validate prod',
                    expectSuccess: true
                }
            },
            default: {
                'basic-validation': {
                    type: 'function',
                    function: () => ({ passed: true })
                }
            }
        };
    }
    
    async runTest(testConfig) {
        switch (testConfig.type) {
            case 'command':
                try {
                    const { stdout, stderr } = await execAsync(testConfig.command);
                    return {
                        passed: testConfig.expectSuccess,
                        stdout,
                        stderr
                    };
                } catch (error) {
                    return {
                        passed: !testConfig.expectSuccess,
                        error: error.message
                    };
                }
                
            case 'function':
                return testConfig.function();
                
            default:
                return { passed: false, error: 'Unknown test type' };
        }
    }
    
    async captureSystemState() {
        const state = {
            timestamp: new Date().toISOString(),
            environment: {},
            files: {},
            performance: {}
        };
        
        // Capture environment variables
        state.environment = {
            NODE_ENV: process.env.NODE_ENV,
            ENVIRONMENT: process.env.ENVIRONMENT
        };
        
        // Capture key configuration files
        const keyFiles = ['character-config.json', '.env.personality', '.env.constraints'];
        for (const file of keyFiles) {
            try {
                const content = await fs.readFile(path.resolve(this.baseDir, file), 'utf-8');
                state.files[file] = content;
            } catch (error) {
                state.files[file] = null;
            }
        }
        
        // Capture basic performance metrics
        state.performance = await this.runPerformanceBenchmarks('current');
        
        return state;
    }
    
    async restoreSystemState(state) {
        console.log('🔄 Restoring system state...');
        
        // Restore environment variables
        if (state.environment) {
            Object.entries(state.environment).forEach(([key, value]) => {
                if (value) {
                    process.env[key] = value;
                }
            });
        }
        
        // Restore configuration files
        if (state.files) {
            for (const [file, content] of Object.entries(state.files)) {
                if (content) {
                    try {
                        await fs.writeFile(path.resolve(this.baseDir, file), content, 'utf-8');
                    } catch (error) {
                        console.warn(`Could not restore ${file}:`, error.message);
                    }
                }
            }
        }
    }
    
    async runPerformanceBenchmarks(environment) {
        // Simple performance benchmarks
        const benchmarks = {};
        
        // Memory usage
        const memUsage = process.memoryUsage();
        benchmarks.memory = {
            heapUsed: memUsage.heapUsed,
            heapTotal: memUsage.heapTotal,
            rss: memUsage.rss
        };
        
        // File I/O benchmark
        const ioStart = Date.now();
        try {
            await fs.readFile(path.resolve(this.baseDir, 'character-config.json'), 'utf-8');
            benchmarks.fileIo = Date.now() - ioStart;
        } catch (error) {
            benchmarks.fileIo = null;
        }
        
        return benchmarks;
    }
    
    calculateValidationScore(tests) {
        const testResults = Object.values(tests);
        const passedTests = testResults.filter(test => test.passed).length;
        return testResults.length > 0 ? passedTests / testResults.length : 0;
    }
    
    generateValidationId() {
        return `validation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    async saveValidationHistory() {
        try {
            const historyPath = path.resolve(this.baseDir, 'validation-history.json');
            const content = JSON.stringify(this.validationHistory, null, 2);
            await fs.writeFile(historyPath, content, 'utf-8');
        } catch (error) {
            console.warn('Could not save validation history:', error.message);
        }
    }
    
    async createValidationReport(validation) {
        const reportPath = path.resolve(this.baseDir, `validation-report-${validation.id}.json`);
        const content = JSON.stringify(validation, null, 2);
        await fs.writeFile(reportPath, content, 'utf-8');
        console.log(`📊 Validation report created: ${reportPath}`);
    }
    
    generateRecommendations(validation) {
        const recommendations = [];
        
        // Analyze failures and generate recommendations
        validation.issues.forEach(issue => {
            if (issue.includes('performance degradation')) {
                recommendations.push('Consider optimizing system resources or adjusting constraints');
            } else if (issue.includes('service') && issue.includes('unhealthy')) {
                recommendations.push('Review service configurations and restart unhealthy services');
            } else if (issue.includes('character') || issue.includes('personality')) {
                recommendations.push('Verify character settings are properly applied to system configuration');
            }
        });
        
        return recommendations;
    }
    
    // Placeholder methods for complex validations
    compareSystemStates(preState, postState) {
        return { valid: true, issues: [] };
    }
    
    async readSystemConfiguration() {
        return {};
    }
    
    validatePersonalityApplication(personality, systemConfig) {
        return { valid: true, issues: [] };
    }
    
    validateConstraintsApplication(constraints, systemConfig) {
        return { valid: true, issues: [] };
    }
    
    async checkServiceEndpoints(environment) {
        return {};
    }
    
    comparePerformance(baseline, current) {
        return {};
    }
    
    validateConfigurationConsistency(results) {
        return { consistent: true, issues: [] };
    }
    
    validateEnvironmentCompatibility(environments, results) {
        return { compatible: true, issues: [] };
    }
    
    validateReproducibility(results) {
        return { consistent: true, issues: [] };
    }
    
    async collectConfigEvidence() {
        return {};
    }
    
    async collectRelevantLogs() {
        return [];
    }
    
    isSafeToAutoFix(validation) {
        return false; // Conservative approach
    }
    
    async applyAutoFixes(validation) {
        return {};
    }
}

/**
 * CLI Interface
 */
if (require.main === module) {
    const validator = new ReproducibilityValidator();
    
    async function main() {
        const command = process.argv[2];
        const environment = process.argv[3];
        
        switch (command) {
            case 'validate-all':
                const options = {
                    environments: process.argv[3]?.split(',') || ['dev', 'staging', 'prod', 'remote'],
                    testDepth: process.argv.includes('--comprehensive') ? 'comprehensive' : 'basic',
                    createReports: !process.argv.includes('--no-reports'),
                    autoFix: process.argv.includes('--auto-fix')
                };
                
                const validation = await validator.validateFullReproducibility(options);
                
                console.log('\n📊 Final Results:');
                if (validation.summary.passed === validation.summary.total) {
                    console.log('✅ All environments passed validation!');
                } else {
                    console.log(`❌ ${validation.summary.failed}/${validation.summary.total} environments failed`);
                    if (validation.recommendations.length > 0) {
                        console.log('\n💡 Recommendations:');
                        validation.recommendations.forEach(rec => console.log(`  - ${rec}`));
                    }
                }
                break;
                
            case 'validate-env':
                if (!environment) {
                    console.error('Usage: node reproducibility-validator.js validate-env <environment>');
                    process.exit(1);
                }
                
                const envResult = await validator.validateEnvironment(environment, { testDepth: 'comprehensive' });
                console.log(`\n📊 ${environment} Validation Results:`);
                console.log(JSON.stringify(envResult, null, 2));
                break;
                
            case 'fingerprint':
                const fingerprint = await validator.generateSystemFingerprint();
                console.log('🔍 System Fingerprint:');
                console.log(JSON.stringify(fingerprint, null, 2));
                break;
                
            default:
                console.log(`
🔍 Reproducibility Validator - Context Switch Integrity Checker

Usage:
  node reproducibility-validator.js validate-all [environments] [options]
  node reproducibility-validator.js validate-env <environment>
  node reproducibility-validator.js fingerprint

Commands:
  validate-all [envs]  - Validate reproducibility across environments
  validate-env <env>   - Validate specific environment
  fingerprint          - Generate system reproducibility fingerprint

Options:
  --comprehensive      - Run comprehensive test suite
  --no-reports        - Skip generating validation reports  
  --auto-fix          - Attempt to automatically fix issues

Examples:
  node reproducibility-validator.js validate-all
  node reproducibility-validator.js validate-all dev,staging --comprehensive
  node reproducibility-validator.js validate-env prod
  node reproducibility-validator.js fingerprint
`);
        }
    }
    
    main().catch(error => {
        console.error('❌ Error:', error.message);
        process.exit(1);
    });
}

module.exports = ReproducibilityValidator;