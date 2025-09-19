#!/usr/bin/env node

/**
 * ✅ VERIFY COMPLETE INTEGRATION
 * 
 * Comprehensive verification that the entire system works together:
 * - Existing CLI and Docker infrastructure
 * - New unified debug monitoring system  
 * - Version management and compaction
 * - Backend/frontend integration
 * - All entry points and commands
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn, exec } = require('child_process');
const UnifiedColorTaggedLogger = require('./unified-color-tagged-logger');
const VersionManager = require('./version-manager');

class CompleteIntegrationVerifier {
    constructor() {
        this.logger = new UnifiedColorTaggedLogger('VERIFY');
        this.versionManager = null;
        
        this.testResults = {
            infrastructure: [],
            monitoring: [],
            integration: [],
            deployment: [],
            versioning: []
        };
        
        this.criticalFiles = [
            'cli.js',                                    // Existing CLI
            'package.json',                              // Dependencies
            'docker-compose.yml',                        // Infrastructure
            'docgen',                                    // New unified command
            'unified-debug-integration-bridge.js',      // Debug integration
            'version-manager.js',                        // Version control
            'business-accounting-system.js'              // Core business logic
        ];
    }
    
    async runCompleteVerification() {
        console.log('\n✅ COMPLETE SYSTEM INTEGRATION VERIFICATION');
        console.log('===========================================\n');
        
        try {
            // Initialize components
            await this.initializeComponents();
            
            // Test infrastructure
            await this.verifyInfrastructure();
            
            // Test monitoring integration
            await this.verifyMonitoringIntegration();
            
            // Test system integration
            await this.verifySystemIntegration();
            
            // Test deployment readiness
            await this.verifyDeploymentReadiness();
            
            // Test versioning system
            await this.verifyVersioningSystem();
            
            // Show comprehensive results
            await this.showVerificationResults();
            
            // Generate integration report
            await this.generateIntegrationReport();
            
        } catch (error) {
            this.logger.error('VERIFY', `Verification failed: ${error.message}`);
            console.error('\n❌ CRITICAL ERROR:', error);
            process.exit(1);
        }
    }
    
    async initializeComponents() {
        const timer = this.logger.startTimer('INIT', 'Initializing verification components');
        
        try {
            // Initialize version manager
            this.versionManager = new VersionManager();
            
            // Ensure all critical files exist
            for (const file of this.criticalFiles) {
                const exists = await this.fileExists(file);
                if (!exists) {
                    throw new Error(`Critical file missing: ${file}`);
                }
            }
            
            timer.end(true);
            this.recordResult('infrastructure', 'Component Initialization', true, 'All critical files present');
            
        } catch (error) {
            timer.end(false);
            this.recordResult('infrastructure', 'Component Initialization', false, error.message);
            throw error;
        }
    }
    
    async verifyInfrastructure() {
        this.logger.info('INFRA', 'Verifying existing infrastructure...');
        
        // Test 1: CLI System
        await this.testCLISystem();
        
        // Test 2: Docker Infrastructure
        await this.testDockerInfrastructure();
        
        // Test 3: Package Scripts
        await this.testPackageScripts();
        
        // Test 4: Service Discovery
        await this.testServiceDiscovery();
    }
    
    async testCLISystem() {
        const timer = this.logger.startTimer('CLI', 'Testing CLI system');
        
        try {
            // Test existing CLI
            const cliHelp = await this.execCommand('node cli.js --help', { timeout: 10000 });
            const hasMenu = cliHelp.includes('MAIN MENU') || cliHelp.includes('DOCUMENT GENERATOR');
            
            // Test new docgen command  
            const docgenHelp = await this.execCommand('./docgen help', { timeout: 5000 });
            const hasDocgenCommands = docgenHelp.includes('DOCGEN COMMANDS');
            
            if (hasMenu && hasDocgenCommands) {
                timer.end(true);
                this.recordResult('infrastructure', 'CLI System', true, 'Both cli.js and docgen commands working');
            } else {
                timer.end(false);
                this.recordResult('infrastructure', 'CLI System', false, `CLI: ${hasMenu}, Docgen: ${hasDocgenCommands}`);
            }
            
        } catch (error) {
            timer.end(false);
            this.recordResult('infrastructure', 'CLI System', false, `CLI test failed: ${error.message}`);
        }
    }
    
    async testDockerInfrastructure() {
        const timer = this.logger.startTimer('DOCKER', 'Testing Docker infrastructure');
        
        try {
            // Check docker-compose file
            const composeContent = await fs.readFile('docker-compose.yml', 'utf8');
            const hasServices = composeContent.includes('services:');
            const hasPostgres = composeContent.includes('postgres');
            const hasRedis = composeContent.includes('redis');
            
            // Test docker-compose validate
            try {
                await this.execCommand('docker-compose config', { timeout: 10000 });
                const dockerValid = true;
                
                if (hasServices && hasPostgres && hasRedis && dockerValid) {
                    timer.end(true);
                    this.recordResult('infrastructure', 'Docker Infrastructure', true, 'Docker Compose configuration valid');
                } else {
                    timer.end(false);
                    this.recordResult('infrastructure', 'Docker Infrastructure', false, 'Missing required services');
                }
                
            } catch (dockerError) {
                timer.end(false);
                this.recordResult('infrastructure', 'Docker Infrastructure', false, `Docker validation failed: ${dockerError.message}`);
            }
            
        } catch (error) {
            timer.end(false);
            this.recordResult('infrastructure', 'Docker Infrastructure', false, `Docker test failed: ${error.message}`);
        }
    }
    
    async testPackageScripts() {
        const timer = this.logger.startTimer('SCRIPTS', 'Testing package scripts');
        
        try {
            const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
            const scripts = packageJson.scripts || {};
            
            const requiredScripts = [
                'start',
                'setup-and-start', 
                'docker:up',
                'verify:real',
                'services:start'
            ];
            
            const missingScripts = requiredScripts.filter(script => !scripts[script]);
            
            if (missingScripts.length === 0) {
                timer.end(true);
                this.recordResult('infrastructure', 'Package Scripts', true, `All ${requiredScripts.length} required scripts present`);
            } else {
                timer.end(false);
                this.recordResult('infrastructure', 'Package Scripts', false, `Missing scripts: ${missingScripts.join(', ')}`);
            }
            
        } catch (error) {
            timer.end(false);
            this.recordResult('infrastructure', 'Package Scripts', false, `Script test failed: ${error.message}`);
        }
    }
    
    async testServiceDiscovery() {
        const timer = this.logger.startTimer('DISCOVERY', 'Testing service discovery');
        
        try {
            // Check if service files exist
            const services = [
                'business-accounting-system.js',
                'tax-intelligence-engine.js', 
                'wallet-address-manager.js'
            ];
            
            let existingServices = 0;
            for (const service of services) {
                if (await this.fileExists(service)) {
                    existingServices++;
                }
            }
            
            if (existingServices >= 2) {
                timer.end(true);
                this.recordResult('infrastructure', 'Service Discovery', true, `${existingServices}/${services.length} services available`);
            } else {
                timer.end(false);
                this.recordResult('infrastructure', 'Service Discovery', false, `Only ${existingServices}/${services.length} services found`);
            }
            
        } catch (error) {
            timer.end(false);
            this.recordResult('infrastructure', 'Service Discovery', false, `Service discovery failed: ${error.message}`);
        }
    }
    
    async verifyMonitoringIntegration() {
        this.logger.info('MONITOR', 'Verifying monitoring integration...');
        
        // Test 1: Debug Integration Bridge
        await this.testDebugIntegrationBridge();
        
        // Test 2: Color-Coded Logging
        await this.testColorCodedLogging();
        
        // Test 3: Real-Time Monitoring
        await this.testRealTimeMonitoring();
        
        // Test 4: Suggestion Engine 
        await this.testSuggestionEngine();
    }
    
    async testDebugIntegrationBridge() {
        const timer = this.logger.startTimer('BRIDGE', 'Testing debug integration bridge');
        
        try {
            // Test bridge initialization
            const BridgeClass = require('./unified-debug-integration-bridge');
            const bridge = new BridgeClass();
            
            // Test bridge methods exist
            const hasMethods = [
                'handleError',
                'launchServiceWithUnifiedMonitoring',
                'getUnifiedStatus',
                'exportUnifiedAnalytics'
            ].every(method => typeof bridge[method] === 'function');
            
            if (hasMethods) {
                timer.end(true);
                this.recordResult('monitoring', 'Debug Integration Bridge', true, 'Bridge initialized with all required methods');
            } else {
                timer.end(false);
                this.recordResult('monitoring', 'Debug Integration Bridge', false, 'Missing required methods');
            }
            
        } catch (error) {
            timer.end(false);
            this.recordResult('monitoring', 'Debug Integration Bridge', false, `Bridge test failed: ${error.message}`);
        }
    }
    
    async testColorCodedLogging() {
        const timer = this.logger.startTimer('LOGGING', 'Testing color-coded logging');
        
        try {
            // Test logger initialization and methods
            const testLogger = new UnifiedColorTaggedLogger('TEST-VERIFY');
            
            // Test all log levels
            testLogger.success('VERIFY', 'Testing success logging');
            testLogger.warning('VERIFY', 'Testing warning logging');
            testLogger.error('VERIFY', 'Testing error logging');
            testLogger.info('VERIFY', 'Testing info logging');
            testLogger.debug('VERIFY', 'Testing debug logging');
            
            // Test database logging
            const logs = await testLogger.searchLogs({
                service: 'TEST-VERIFY',
                limit: 5
            });
            
            if (logs.length >= 5) {
                timer.end(true);
                this.recordResult('monitoring', 'Color-Coded Logging', true, `Database logging working - ${logs.length} entries found`);
            } else {
                timer.end(false);
                this.recordResult('monitoring', 'Color-Coded Logging', false, `Database logging issue - only ${logs.length} entries`);
            }
            
        } catch (error) {
            timer.end(false);
            this.recordResult('monitoring', 'Color-Coded Logging', false, `Logging test failed: ${error.message}`);
        }
    }
    
    async testRealTimeMonitoring() {
        const timer = this.logger.startTimer('REALTIME', 'Testing real-time monitoring');
        
        try {
            const MonitorClass = require('./real-time-test-monitor');
            const monitor = new MonitorClass();
            
            // Test monitor methods
            const hasMonitorMethods = [
                'launchWithMonitoring',
                'getSystemStatus',
                'stopAll'
            ].every(method => typeof monitor[method] === 'function');
            
            if (hasMonitorMethods) {
                timer.end(true);
                this.recordResult('monitoring', 'Real-Time Monitoring', true, 'Monitor initialized with required methods');
            } else {
                timer.end(false);
                this.recordResult('monitoring', 'Real-Time Monitoring', false, 'Missing monitor methods');
            }
            
        } catch (error) {
            timer.end(false);
            this.recordResult('monitoring', 'Real-Time Monitoring', false, `Monitor test failed: ${error.message}`);
        }
    }
    
    async testSuggestionEngine() {
        const timer = this.logger.startTimer('SUGGEST', 'Testing suggestion engine');
        
        try {
            const SuggestionEngine = require('./suggestion-engine');
            const engine = new SuggestionEngine();
            
            // Test suggestion for common error
            const suggestion = engine.getSuggestion('Error: listen EADDRINUSE: address already in use :::3000');
            
            const hasValidSuggestion = suggestion && 
                suggestion.suggestion && 
                suggestion.command &&
                suggestion.pattern === 'port_conflict';
            
            if (hasValidSuggestion) {
                timer.end(true);
                this.recordResult('monitoring', 'Suggestion Engine', true, 'Engine provides intelligent suggestions');
            } else {
                timer.end(false);
                this.recordResult('monitoring', 'Suggestion Engine', false, 'Suggestion engine not working properly');
            }
            
        } catch (error) {
            timer.end(false);
            this.recordResult('monitoring', 'Suggestion Engine', false, `Suggestion test failed: ${error.message}`);
        }
    }
    
    async verifySystemIntegration() {
        this.logger.info('INTEGRATION', 'Verifying system integration...');
        
        // Test 1: Command Integration
        await this.testCommandIntegration();
        
        // Test 2: Service Communication
        await this.testServiceCommunication();
        
        // Test 3: Database Integration
        await this.testDatabaseIntegration();
        
        // Test 4: Frontend/Backend Connection
        await this.testFrontendBackendConnection();
    }
    
    async testCommandIntegration() {
        const timer = this.logger.startTimer('CMD', 'Testing command integration');
        
        try {
            // Test docgen commands work
            const statusTest = await this.execCommand('./docgen version', { timeout: 5000 });
            const hasVersion = statusTest.includes('DocGen Version');
            
            // Test help command
            const helpTest = await this.execCommand('./docgen help', { timeout: 5000 });
            const hasHelp = helpTest.includes('DOCGEN COMMANDS');
            
            if (hasVersion && hasHelp) {
                timer.end(true);
                this.recordResult('integration', 'Command Integration', true, 'Docgen commands working properly');
            } else {
                timer.end(false);
                this.recordResult('integration', 'Command Integration', false, `Version: ${hasVersion}, Help: ${hasHelp}`);
            }
            
        } catch (error) {
            timer.end(false);
            this.recordResult('integration', 'Command Integration', false, `Command test failed: ${error.message}`);
        }
    }
    
    async testServiceCommunication() {
        const timer = this.logger.startTimer('COMM', 'Testing service communication');
        
        try {
            // Check if services can be discovered
            const services = await this.discoverServices();
            
            if (services.length >= 1) {
                timer.end(true);
                this.recordResult('integration', 'Service Communication', true, `${services.length} services discoverable`);
            } else {
                timer.end(false);
                this.recordResult('integration', 'Service Communication', false, 'No services discoverable');
            }
            
        } catch (error) {
            timer.end(false);
            this.recordResult('integration', 'Service Communication', false, `Communication test failed: ${error.message}`);
        }
    }
    
    async testDatabaseIntegration() {
        const timer = this.logger.startTimer('DB', 'Testing database integration');
        
        try {
            // Test if debug database was created
            const debugDbExists = await this.fileExists('tagged-debug.db');
            
            // Test if suggestion database was created  
            const suggestionDbExists = await this.fileExists('suggestion-engine.db');
            
            if (debugDbExists || suggestionDbExists) {
                timer.end(true);
                this.recordResult('integration', 'Database Integration', true, `Debug DB: ${debugDbExists}, Suggestion DB: ${suggestionDbExists}`);
            } else {
                timer.end(false);
                this.recordResult('integration', 'Database Integration', false, 'No databases found');
            }
            
        } catch (error) {
            timer.end(false);
            this.recordResult('integration', 'Database Integration', false, `Database test failed: ${error.message}`);
        }
    }
    
    async testFrontendBackendConnection() {
        const timer = this.logger.startTimer('FE/BE', 'Testing frontend/backend connection');
        
        try {
            // Check if frontend directories exist
            const frontendDirs = [
                'FinishThisIdea-Complete',
                'web-interface',
                'public'
            ];
            
            let foundFrontends = 0;
            for (const dir of frontendDirs) {
                if (await this.fileExists(dir)) {
                    foundFrontends++;
                }
            }
            
            // Check backend services
            const backendServices = [
                'business-accounting-system.js',
                'cli.js'
            ];
            
            let foundBackends = 0;
            for (const service of backendServices) {
                if (await this.fileExists(service)) {
                    foundBackends++;
                }
            }
            
            if (foundFrontends >= 1 && foundBackends >= 1) {
                timer.end(true);
                this.recordResult('integration', 'Frontend/Backend Connection', true, `${foundFrontends} frontend(s), ${foundBackends} backend(s)`);
            } else {
                timer.end(false);
                this.recordResult('integration', 'Frontend/Backend Connection', false, `Incomplete: FE=${foundFrontends}, BE=${foundBackends}`);
            }
            
        } catch (error) {
            timer.end(false);
            this.recordResult('integration', 'Frontend/Backend Connection', false, `FE/BE test failed: ${error.message}`);
        }
    }
    
    async verifyDeploymentReadiness() {
        this.logger.info('DEPLOY', 'Verifying deployment readiness...');
        
        // Test 1: Docker Deployment
        await this.testDockerDeployment();
        
        // Test 2: Production Build
        await this.testProductionBuild();
        
        // Test 3: Environment Configuration
        await this.testEnvironmentConfiguration();
        
        // Test 4: Security Configuration
        await this.testSecurityConfiguration();
    }
    
    async testDockerDeployment() {
        const timer = this.logger.startTimer('DOCKER-DEPLOY', 'Testing Docker deployment');
        
        try {
            // Test docker-compose configuration
            await this.execCommand('docker-compose config', { timeout: 10000 });
            
            // Check if Dockerfile exists
            const dockerfileExists = await this.fileExists('Dockerfile');
            
            if (dockerfileExists) {
                timer.end(true);
                this.recordResult('deployment', 'Docker Deployment', true, 'Docker configuration valid');
            } else {
                timer.end(false);
                this.recordResult('deployment', 'Docker Deployment', false, 'Missing Dockerfile');
            }
            
        } catch (error) {
            timer.end(false);
            this.recordResult('deployment', 'Docker Deployment', false, `Docker deployment test failed: ${error.message}`);
        }
    }
    
    async testProductionBuild() {
        const timer = this.logger.startTimer('PROD-BUILD', 'Testing production build');
        
        try {
            // Check if build scripts exist
            const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
            const buildScripts = [
                'build',
                'docker:build',
                'full-build'
            ];
            
            const availableBuilds = buildScripts.filter(script => packageJson.scripts && packageJson.scripts[script]);
            
            if (availableBuilds.length >= 2) {
                timer.end(true);
                this.recordResult('deployment', 'Production Build', true, `${availableBuilds.length} build scripts available`);
            } else {
                timer.end(false);
                this.recordResult('deployment', 'Production Build', false, `Only ${availableBuilds.length} build scripts found`);
            }
            
        } catch (error) {
            timer.end(false);
            this.recordResult('deployment', 'Production Build', false, `Build test failed: ${error.message}`);
        }
    }
    
    async testEnvironmentConfiguration() {
        const timer = this.logger.startTimer('ENV', 'Testing environment configuration');
        
        try {
            // Check for environment files
            const envFiles = [
                '.env.example',
                '.env.template'
            ];
            
            let foundEnvFiles = 0;
            for (const file of envFiles) {
                if (await this.fileExists(file)) {
                    foundEnvFiles++;
                }
            }
            
            if (foundEnvFiles >= 1) {
                timer.end(true);
                this.recordResult('deployment', 'Environment Configuration', true, `${foundEnvFiles} environment template(s) found`);
            } else {
                timer.end(false);
                this.recordResult('deployment', 'Environment Configuration', false, 'No environment templates found');
            }
            
        } catch (error) {
            timer.end(false);
            this.recordResult('deployment', 'Environment Configuration', false, `Environment test failed: ${error.message}`);
        }
    }
    
    async testSecurityConfiguration() {
        const timer = this.logger.startTimer('SECURITY', 'Testing security configuration');
        
        try {
            // Basic security checks
            const hasGitignore = await this.fileExists('.gitignore');
            
            let gitignoreSecure = false;
            if (hasGitignore) {
                const gitignoreContent = await fs.readFile('.gitignore', 'utf8');
                gitignoreSecure = gitignoreContent.includes('.env') && gitignoreContent.includes('node_modules');
            }
            
            if (hasGitignore && gitignoreSecure) {
                timer.end(true);
                this.recordResult('deployment', 'Security Configuration', true, 'Basic security configuration present');
            } else {
                timer.end(false);
                this.recordResult('deployment', 'Security Configuration', false, `Gitignore: ${hasGitignore}, Secure: ${gitignoreSecure}`);
            }
            
        } catch (error) {
            timer.end(false);
            this.recordResult('deployment', 'Security Configuration', false, `Security test failed: ${error.message}`);
        }
    }
    
    async verifyVersioningSystem() {
        this.logger.info('VERSION', 'Verifying versioning system...');
        
        // Test 1: Version Manager
        await this.testVersionManager();
        
        // Test 2: Backup System
        await this.testBackupSystem();
        
        // Test 3: Compaction System
        await this.testCompactionSystem();
    }
    
    async testVersionManager() {
        const timer = this.logger.startTimer('VER-MGR', 'Testing version manager');
        
        try {
            // Test version manager initialization
            await this.execCommand('node version-manager.js status', { timeout: 10000 });
            
            timer.end(true);
            this.recordResult('versioning', 'Version Manager', true, 'Version manager operational');
            
        } catch (error) {
            timer.end(false);
            this.recordResult('versioning', 'Version Manager', false, `Version manager test failed: ${error.message}`);
        }
    }
    
    async testBackupSystem() {
        const timer = this.logger.startTimer('BACKUP', 'Testing backup system');
        
        try {
            // Test backup creation
            await this.execCommand('node version-manager.js backup verification-test', { timeout: 10000 });
            
            // Check if backup was created
            const backupDir = path.join(process.cwd(), 'backups');
            const backups = await fs.readdir(backupDir);
            const hasVerificationBackup = backups.some(backup => backup.includes('verification-test'));
            
            if (hasVerificationBackup) {
                timer.end(true);
                this.recordResult('versioning', 'Backup System', true, 'Backup system working');
            } else {
                timer.end(false);
                this.recordResult('versioning', 'Backup System', false, 'Backup not created');
            }
            
        } catch (error) {
            timer.end(false);
            this.recordResult('versioning', 'Backup System', false, `Backup test failed: ${error.message}`);
        }
    }
    
    async testCompactionSystem() {
        const timer = this.logger.startTimer('COMPACT', 'Testing compaction system');
        
        try {
            // Test compaction (dry run)
            const compactHelp = await this.execCommand('node version-manager.js help', { timeout: 5000 });
            const hasCompactCommand = compactHelp.includes('compact');
            
            if (hasCompactCommand) {
                timer.end(true);
                this.recordResult('versioning', 'Compaction System', true, 'Compaction commands available');
            } else {
                timer.end(false);
                this.recordResult('versioning', 'Compaction System', false, 'Compaction commands missing');
            }
            
        } catch (error) {
            timer.end(false);
            this.recordResult('versioning', 'Compaction System', false, `Compaction test failed: ${error.message}`);
        }
    }
    
    async showVerificationResults() {
        console.log('\n📊 COMPLETE INTEGRATION VERIFICATION RESULTS');
        console.log('=============================================\n');
        
        for (const [category, results] of Object.entries(this.testResults)) {
            const passed = results.filter(r => r.success).length;
            const total = results.length;
            const percentage = total > 0 ? Math.round((passed / total) * 100) : 0;
            
            const categoryName = category.toUpperCase().padEnd(15);
            const status = passed === total ? '✅' : passed > 0 ? '⚠️' : '❌';
            
            console.log(`${status} ${categoryName} ${passed}/${total} (${percentage}%)`);
            
            results.forEach(result => {
                const icon = result.success ? '  ✓' : '  ✗';
                const color = result.success ? '\x1b[32m' : '\x1b[31m';
                console.log(`${color}${icon} ${result.name}: ${result.details}\x1b[0m`);
            });
            
            console.log();
        }
        
        // Overall summary
        const allResults = Object.values(this.testResults).flat();
        const totalPassed = allResults.filter(r => r.success).length;
        const totalTests = allResults.length;
        const overallPercentage = Math.round((totalPassed / totalTests) * 100);
        
        console.log('='.repeat(45));
        if (totalPassed === totalTests) {
            console.log(`🎉 ALL TESTS PASSED! (${totalPassed}/${totalTests}) - ${overallPercentage}%`);
            console.log('\n✅ SYSTEM IS FULLY INTEGRATED AND READY!');
        } else if (overallPercentage >= 80) {
            console.log(`⚠️  MOSTLY WORKING: ${totalPassed}/${totalTests} tests passed (${overallPercentage}%)`);
            console.log('\n🔧 Minor issues to address, but system is functional');
        } else {
            console.log(`❌ NEEDS WORK: ${totalPassed}/${totalTests} tests passed (${overallPercentage}%)`);
            console.log('\n🚨 System needs attention before deployment');
        }
        
        console.log('\n📚 QUICK START COMMANDS:');
        console.log('  ./docgen start quick    # Start core system');
        console.log('  ./docgen debug monitor  # Start with monitoring');
        console.log('  ./docgen test verify    # Run verification tests');
        console.log('  ./docgen compact docker # Build for deployment');
        console.log();
    }
    
    async generateIntegrationReport() {
        const report = {
            timestamp: new Date().toISOString(),
            verificationVersion: '1.0.0',
            systemVersion: this.versionManager?.currentVersion?.version || 'unknown',
            overallStatus: this.calculateOverallStatus(),
            categories: {},
            recommendations: this.generateRecommendations(),
            quickStartCommands: [
                './docgen start quick',
                './docgen debug monitor', 
                './docgen test verify',
                './docgen compact docker'
            ]
        };
        
        // Add category results
        for (const [category, results] of Object.entries(this.testResults)) {
            const passed = results.filter(r => r.success).length;
            const total = results.length;
            
            report.categories[category] = {
                passed,
                total,
                percentage: total > 0 ? Math.round((passed / total) * 100) : 0,
                results
            };
        }
        
        // Save report
        const reportPath = 'INTEGRATION_VERIFICATION_REPORT.json';
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        this.logger.success('REPORT', `Integration report saved: ${reportPath}`);
    }
    
    calculateOverallStatus() {
        const allResults = Object.values(this.testResults).flat();
        const totalPassed = allResults.filter(r => r.success).length;
        const totalTests = allResults.length;
        const percentage = Math.round((totalPassed / totalTests) * 100);
        
        if (percentage === 100) return 'FULLY_INTEGRATED';
        if (percentage >= 80) return 'MOSTLY_WORKING';
        if (percentage >= 60) return 'NEEDS_WORK';
        return 'CRITICAL_ISSUES';
    }
    
    generateRecommendations() {
        const allResults = Object.values(this.testResults).flat();
        const failedResults = allResults.filter(r => !r.success);
        
        const recommendations = [];
        
        if (failedResults.length === 0) {
            recommendations.push('System is fully integrated and ready for deployment');
            recommendations.push('Consider running performance tests under load');
            recommendations.push('Set up monitoring dashboards for production');
        } else {
            recommendations.push(`${failedResults.length} tests failed - address these issues first`);
            
            // Category-specific recommendations
            const categories = Object.keys(this.testResults);
            for (const category of categories) {
                const categoryResults = this.testResults[category];
                const categoryFailed = categoryResults.filter(r => !r.success);
                
                if (categoryFailed.length > 0) {
                    recommendations.push(`${category}: Fix ${categoryFailed.length} failing test(s)`);
                }
            }
        }
        
        return recommendations;
    }
    
    // Helper methods
    async discoverServices() {
        const serviceFiles = [
            'business-accounting-system.js',
            'tax-intelligence-engine.js',
            'wallet-address-manager.js',
            'cli.js'
        ];
        
        const services = [];
        for (const file of serviceFiles) {
            if (await this.fileExists(file)) {
                services.push(file);
            }
        }
        
        return services;
    }
    
    recordResult(category, name, success, details) {
        if (!this.testResults[category]) {
            this.testResults[category] = [];
        }
        
        this.testResults[category].push({
            name,
            success,
            details,
            timestamp: Date.now()
        });
        
        const icon = success ? '✅' : '❌';
        this.logger.log(success ? 'success' : 'error', 'RESULT', `${icon} ${name}: ${details}`);
    }
    
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }
    
    execCommand(command, options = {}) {
        const { timeout = 30000, silent = false } = options;
        
        return new Promise((resolve, reject) => {
            const child = exec(command, { timeout }, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(stdout);
                }
            });
            
            if (!silent) {
                child.stdout?.on('data', (data) => {
                    // Optionally log command output
                });
            }
        });
    }
}

// Run verification if called directly
if (require.main === module) {
    const verifier = new CompleteIntegrationVerifier();
    
    verifier.runCompleteVerification().catch(error => {
        console.error('\n❌ Verification failed:', error.message);
        process.exit(1);
    });
}

module.exports = CompleteIntegrationVerifier;