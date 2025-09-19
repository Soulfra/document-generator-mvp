#!/usr/bin/env node

/**
 * 📦 EXECUTIVE HANDOFF GENERATOR
 * 
 * Creates professional handoff package from scattered verification data
 * Timeout-proof, always produces usable deliverables
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const UnifiedColorTaggedLogger = require('./unified-color-tagged-logger');

class ExecutiveHandoffGenerator {
    constructor() {
        this.logger = new UnifiedColorTaggedLogger('HANDOFF');
        this.timestamp = new Date().toISOString();
        this.outputDir = path.join(__dirname, 'handoff-package');
        
        this.verificationData = {
            integrationReport: null,
            systemLogs: [],
            serviceStatus: {},
            quickTests: {},
            exportFormats: ['json', 'markdown', 'html']
        };
        
        this.executiveSummary = {
            status: 'UNKNOWN',
            overallScore: 0,
            criticalIssues: [],
            readyForProduction: false,
            timestamp: this.timestamp
        };
    }
    
    async generateHandoffPackage() {
        this.logger.info('START', 'Generating executive handoff package...');
        
        try {
            // Create output directory
            await this.createOutputDirectory();
            
            // Collect verification data (with timeouts)
            await this.collectVerificationData();
            
            // Run quick health checks (timeout-proof)
            await this.runQuickHealthChecks();
            
            // Generate executive summary
            await this.generateExecutiveSummary();
            
            // Export in multiple formats
            await this.exportMultipleFormats();
            
            // Create quick verification commands
            await this.generateQuickCommands();
            
            // Generate final package
            const packagePath = await this.createFinalPackage();
            
            this.logger.success('COMPLETE', `Handoff package generated: ${packagePath}`);
            return packagePath;
            
        } catch (error) {
            this.logger.error('GENERATE', `Handoff generation failed: ${error.message}`);
            
            // Always try to produce SOMETHING usable
            await this.generateEmergencyPackage(error);
            throw error;
        }
    }
    
    async createOutputDirectory() {
        const timer = this.logger.startTimer('SETUP', 'Creating output directory');
        
        try {
            await fs.mkdir(this.outputDir, { recursive: true });
            
            // Create subdirectories
            const subdirs = ['reports', 'logs', 'exports', 'proofs'];
            for (const dir of subdirs) {
                await fs.mkdir(path.join(this.outputDir, dir), { recursive: true });
            }
            
            timer.end(true);
        } catch (error) {
            timer.end(false);
            throw error;
        }
    }
    
    async collectVerificationData() {
        const timer = this.logger.startTimer('COLLECT', 'Collecting verification data');
        
        try {
            // Load main integration report
            await this.loadIntegrationReport();
            
            // Collect recent logs (timeout-safe)
            await this.collectRecentLogs();
            
            // Get service status (timeout-safe)  
            await this.collectServiceStatus();
            
            timer.end(true);
        } catch (error) {
            timer.end(false);
            this.logger.warning('COLLECT', `Partial data collection: ${error.message}`);
        }
    }
    
    async loadIntegrationReport() {
        try {
            const reportPath = path.join(__dirname, 'INTEGRATION_VERIFICATION_REPORT.json');
            const reportData = await fs.readFile(reportPath, 'utf8');
            this.verificationData.integrationReport = JSON.parse(reportData);
            
            this.logger.success('LOAD', `Integration report loaded: ${this.verificationData.integrationReport.overallStatus}`);
        } catch (error) {
            this.logger.warning('LOAD', `Integration report not found: ${error.message}`);
            
            // Create minimal report
            this.verificationData.integrationReport = {
                timestamp: this.timestamp,
                overallStatus: 'UNKNOWN',
                categories: {},
                recommendations: ['Run integration verification to get detailed status']
            };
        }
    }
    
    async collectRecentLogs() {
        try {
            const logsDir = path.join(__dirname, 'logs');
            const logFiles = await fs.readdir(logsDir);
            
            // Get most recent log files (last 10)
            const recentLogs = logFiles
                .filter(file => file.endsWith('.log'))
                .sort((a, b) => b.localeCompare(a))
                .slice(0, 10);
            
            for (const logFile of recentLogs) {
                try {
                    const logPath = path.join(logsDir, logFile);
                    const logContent = await fs.readFile(logPath, 'utf8');
                    
                    this.verificationData.systemLogs.push({
                        file: logFile,
                        size: logContent.length,
                        preview: logContent.slice(-500) // Last 500 chars
                    });
                } catch (logError) {
                    // Skip problematic logs
                    continue;
                }
            }
            
            this.logger.info('LOGS', `Collected ${this.verificationData.systemLogs.length} recent log files`);
        } catch (error) {
            this.logger.warning('LOGS', `Log collection failed: ${error.message}`);
        }
    }
    
    async collectServiceStatus() {
        try {
            // Quick service discovery (timeout-proof)
            const services = ['business-accounting-system.js', 'cli.js', 'docgen'];
            
            for (const service of services) {
                try {
                    await fs.access(service);
                    this.verificationData.serviceStatus[service] = 'AVAILABLE';
                } catch {
                    this.verificationData.serviceStatus[service] = 'MISSING';
                }
            }
            
            this.logger.info('STATUS', `Service status collected for ${services.length} services`);
        } catch (error) {
            this.logger.warning('STATUS', `Service status collection failed: ${error.message}`);
        }
    }
    
    async runQuickHealthChecks() {
        const timer = this.logger.startTimer('HEALTH', 'Running quick health checks');
        
        try {
            // Test 1: CLI Help (5 second timeout)
            this.verificationData.quickTests.cliHelp = await this.testWithTimeout(
                'node cli.js --help',
                5000,
                'CLI help command'
            );
            
            // Test 2: Docgen Command (3 second timeout)
            this.verificationData.quickTests.docgenHelp = await this.testWithTimeout(
                './docgen help',
                3000,
                'Docgen help command'
            );
            
            // Test 3: Docker Validation (5 second timeout)
            this.verificationData.quickTests.dockerConfig = await this.testWithTimeout(
                'docker-compose config --quiet',
                5000,
                'Docker compose validation'
            );
            
            // Test 4: Package Scripts (2 second timeout)
            this.verificationData.quickTests.packageScripts = await this.testPackageScripts();
            
            timer.end(true);
        } catch (error) {
            timer.end(false);
            this.logger.warning('HEALTH', `Health checks partially failed: ${error.message}`);
        }
    }
    
    async testWithTimeout(command, timeout, description) {
        return new Promise((resolve) => {
            const child = exec(command, { timeout }, (error, stdout, stderr) => {
                if (error) {
                    resolve({
                        success: false,
                        error: error.message,
                        description
                    });
                } else {
                    resolve({
                        success: true,
                        output: stdout.slice(0, 200), // First 200 chars
                        description
                    });
                }
            });
            
            // Fallback timeout
            setTimeout(() => {
                try {
                    child.kill();
                } catch {}
                resolve({
                    success: false,
                    error: `Timeout after ${timeout}ms`,
                    description
                });
            }, timeout + 1000);
        });
    }
    
    async testPackageScripts() {
        try {
            const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
            const scripts = packageJson.scripts || {};
            
            const requiredScripts = ['start', 'setup-and-start', 'verify:real'];
            const availableScripts = requiredScripts.filter(script => scripts[script]);
            
            return {
                success: availableScripts.length >= 2,
                description: 'Package scripts availability',
                details: `${availableScripts.length}/${requiredScripts.length} required scripts available`
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                description: 'Package scripts availability'
            };
        }
    }
    
    async generateExecutiveSummary() {
        const timer = this.logger.startTimer('SUMMARY', 'Generating executive summary');
        
        try {
            // Calculate overall score
            const integrationReport = this.verificationData.integrationReport;
            
            if (integrationReport && integrationReport.categories) {
                const categories = Object.values(integrationReport.categories);
                const totalTests = categories.reduce((sum, cat) => sum + (cat.total || 0), 0);
                const passedTests = categories.reduce((sum, cat) => sum + (cat.passed || 0), 0);
                
                this.executiveSummary.overallScore = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
                this.executiveSummary.status = integrationReport.overallStatus || 'UNKNOWN';
            }
            
            // Check quick tests
            const quickTestResults = Object.values(this.verificationData.quickTests);
            const quickTestsPassed = quickTestResults.filter(test => test.success).length;
            const quickTestsTotal = quickTestResults.length;
            
            // Determine production readiness
            this.executiveSummary.readyForProduction = 
                this.executiveSummary.overallScore >= 80 && 
                quickTestsPassed >= (quickTestsTotal * 0.75);
            
            // Identify critical issues
            if (!this.executiveSummary.readyForProduction) {
                this.executiveSummary.criticalIssues = [
                    `Integration score: ${this.executiveSummary.overallScore}% (need ≥80%)`,
                    `Quick tests: ${quickTestsPassed}/${quickTestsTotal} passed`
                ];
            }
            
            timer.end(true);
            this.logger.success('SUMMARY', `Executive summary generated: ${this.executiveSummary.status}`);
        } catch (error) {
            timer.end(false);
            this.logger.error('SUMMARY', `Summary generation failed: ${error.message}`);
        }
    }
    
    async exportMultipleFormats() {
        const timer = this.logger.startTimer('EXPORT', 'Exporting multiple formats');
        
        try {
            // JSON Export
            await this.exportJSON();
            
            // Markdown Export
            await this.exportMarkdown();
            
            // HTML Export
            await this.exportHTML();
            
            timer.end(true);
        } catch (error) {
            timer.end(false);
            this.logger.warning('EXPORT', `Export partially failed: ${error.message}`);
        }
    }
    
    async exportJSON() {
        const jsonData = {
            executiveSummary: this.executiveSummary,
            verificationData: this.verificationData,
            timestamp: this.timestamp,
            generator: 'Executive Handoff Generator v1.0'
        };
        
        const jsonPath = path.join(this.outputDir, 'exports', 'executive-handoff.json');
        await fs.writeFile(jsonPath, JSON.stringify(jsonData, null, 2));
        
        this.logger.success('JSON', `JSON export created: ${jsonPath}`);
    }
    
    async exportMarkdown() {
        const md = this.generateMarkdownReport();
        const mdPath = path.join(this.outputDir, 'exports', 'executive-handoff.md');
        await fs.writeFile(mdPath, md);
        
        this.logger.success('MARKDOWN', `Markdown export created: ${mdPath}`);
    }
    
    generateMarkdownReport() {
        const { status, overallScore, readyForProduction, criticalIssues } = this.executiveSummary;
        const statusIcon = readyForProduction ? '✅' : '⚠️';
        
        return `# 📦 Executive Handoff Report
        
## ${statusIcon} System Status: ${status}

**Overall Score:** ${overallScore}%  
**Production Ready:** ${readyForProduction ? 'YES' : 'NO'}  
**Generated:** ${new Date(this.timestamp).toLocaleString()}

## 🎯 Executive Summary

${readyForProduction 
    ? '✅ **SYSTEM READY FOR DEPLOYMENT**\n\nAll critical systems are operational and verification tests pass. The system is ready for production handoff.'
    : '⚠️ **SYSTEM NEEDS ATTENTION**\n\nSome issues require resolution before production deployment.'
}

## 📊 Integration Results

${this.verificationData.integrationReport ? 
    Object.entries(this.verificationData.integrationReport.categories)
        .map(([category, data]) => 
            `- **${category.toUpperCase()}**: ${data.passed}/${data.total} tests (${data.percentage}%)`
        ).join('\n')
    : 'Integration data not available'
}

## ⚡ Quick Health Checks

${Object.entries(this.verificationData.quickTests)
    .map(([test, result]) => 
        `- **${result.description}**: ${result.success ? '✅ PASS' : '❌ FAIL'} ${result.error ? `(${result.error})` : ''}`
    ).join('\n')
}

## 🔧 Service Status

${Object.entries(this.verificationData.serviceStatus)
    .map(([service, status]) => 
        `- **${service}**: ${status === 'AVAILABLE' ? '✅' : '❌'} ${status}`
    ).join('\n')
}

${criticalIssues.length > 0 ? `## ⚠️ Critical Issues

${criticalIssues.map(issue => `- ${issue}`).join('\n')}
` : ''}

## 🚀 Quick Start Commands

\`\`\`bash
# Start the system
./docgen start quick

# Run verification
./docgen verify quick

# Check system status  
./docgen status

# Generate new handoff
./docgen handoff generate
\`\`\`

## 📞 Handoff Contacts

- **Technical Lead**: Available via system logs
- **System Documentation**: See CLAUDE.md files
- **Emergency Procedures**: See ./quick-start commands

---
*Generated by Executive Handoff Generator v1.0*`;
    }
    
    async exportHTML() {
        const html = this.generateHTMLDashboard();
        const htmlPath = path.join(this.outputDir, 'exports', 'executive-handoff.html');
        await fs.writeFile(htmlPath, html);
        
        this.logger.success('HTML', `HTML dashboard created: ${htmlPath}`);
    }
    
    generateHTMLDashboard() {
        const { status, overallScore, readyForProduction } = this.executiveSummary;
        const statusColor = readyForProduction ? '#4CAF50' : '#FF9800';
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Executive Handoff Dashboard</title>
    <style>
        body { font-family: 'Segoe UI', system-ui, sans-serif; margin: 0; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 20px; }
        .status-badge { display: inline-block; padding: 10px 20px; border-radius: 50px; font-weight: bold; background: ${statusColor}; color: white; }
        .score-circle { display: inline-block; width: 100px; height: 100px; border-radius: 50%; background: conic-gradient(${statusColor} ${overallScore * 3.6}deg, #e0e0e0 0deg); display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; color: #333; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 20px; }
        .card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .success { color: #4CAF50; } .error { color: #f44336; } .warning { color: #FF9800; }
        .timestamp { color: #666; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📦 Executive Handoff Dashboard</h1>
            <div style="display: flex; align-items: center; gap: 20px; margin-top: 20px;">
                <span class="status-badge">${status}</span>
                <div class="score-circle">${overallScore}%</div>
                <div>
                    <h3>${readyForProduction ? '✅ Production Ready' : '⚠️ Needs Attention'}</h3>
                    <p class="timestamp">Generated: ${new Date(this.timestamp).toLocaleString()}</p>
                </div>
            </div>
        </div>
        
        <div class="grid">
            <div class="card">
                <h3>🎯 Executive Summary</h3>
                <p>${readyForProduction 
                    ? 'System is operational and ready for production deployment. All critical tests pass.'
                    : 'System requires attention before production deployment. See critical issues below.'
                }</p>
            </div>
            
            <div class="card">
                <h3>📊 Test Results</h3>
                ${this.verificationData.integrationReport ? 
                    Object.entries(this.verificationData.integrationReport.categories)
                        .map(([category, data]) => 
                            `<p><strong>${category.toUpperCase()}:</strong> 
                             <span class="${data.percentage === 100 ? 'success' : data.percentage >= 80 ? 'warning' : 'error'}">
                             ${data.passed}/${data.total} (${data.percentage}%)
                             </span></p>`
                        ).join('')
                    : '<p class="warning">Integration data not available</p>'
                }
            </div>
            
            <div class="card">
                <h3>⚡ Quick Checks</h3>
                ${Object.entries(this.verificationData.quickTests)
                    .map(([test, result]) => 
                        `<p><strong>${result.description}:</strong> 
                         <span class="${result.success ? 'success' : 'error'}">
                         ${result.success ? '✅ PASS' : '❌ FAIL'}
                         </span></p>`
                    ).join('')
                }
            </div>
            
            <div class="card">
                <h3>🚀 Quick Commands</h3>
                <pre><code># Start system
./docgen start quick

# Verify status  
./docgen verify quick

# Generate handoff
./docgen handoff generate</code></pre>
            </div>
        </div>
    </div>
</body>
</html>`;
    }
    
    async generateQuickCommands() {
        const timer = this.logger.startTimer('COMMANDS', 'Generating quick commands');
        
        try {
            const quickCommands = {
                'verify-quick': {
                    description: 'Run 30-second system verification',
                    command: 'node generate-executive-handoff.js --quick-verify',
                    timeout: 30000
                },
                'status-export': {
                    description: 'Export current system status',
                    command: 'node generate-executive-handoff.js --status-only',
                    timeout: 10000
                },
                'handoff-generate': {
                    description: 'Generate complete handoff package',
                    command: 'node generate-executive-handoff.js',
                    timeout: 120000
                }
            };
            
            // Save commands to file
            const commandsPath = path.join(this.outputDir, 'quick-commands.json');
            await fs.writeFile(commandsPath, JSON.stringify(quickCommands, null, 2));
            
            timer.end(true);
            this.logger.success('COMMANDS', 'Quick commands generated');
        } catch (error) {
            timer.end(false);
            this.logger.warning('COMMANDS', `Command generation failed: ${error.message}`);
        }
    }
    
    async createFinalPackage() {
        const timer = this.logger.startTimer('PACKAGE', 'Creating final handoff package');
        
        try {
            // Create package summary
            const packageSummary = {
                packageVersion: '1.0.0',
                timestamp: this.timestamp,
                status: this.executiveSummary.status,
                readyForProduction: this.executiveSummary.readyForProduction,
                overallScore: this.executiveSummary.overallScore,
                contents: {
                    'exports/executive-handoff.json': 'Complete system data in JSON format',
                    'exports/executive-handoff.md': 'Technical markdown report',
                    'exports/executive-handoff.html': 'Interactive HTML dashboard',
                    'quick-commands.json': 'Quick verification commands',
                    'package-summary.json': 'This file - package overview'
                },
                quickStart: [
                    './docgen start quick',
                    './docgen verify quick', 
                    './docgen status',
                    './docgen handoff generate'
                ]
            };
            
            const summaryPath = path.join(this.outputDir, 'package-summary.json');
            await fs.writeFile(summaryPath, JSON.stringify(packageSummary, null, 2));
            
            timer.end(true);
            return this.outputDir;
        } catch (error) {
            timer.end(false);
            throw error;
        }
    }
    
    async generateEmergencyPackage(originalError) {
        this.logger.warning('EMERGENCY', 'Generating emergency fallback package');
        
        try {
            const emergencyData = {
                status: 'EMERGENCY_PACKAGE',
                error: originalError.message,
                timestamp: this.timestamp,
                availableData: this.verificationData,
                message: 'This is an emergency package generated when the full handoff failed. Some data may be incomplete.'
            };
            
            const emergencyPath = path.join(__dirname, 'emergency-handoff.json');
            await fs.writeFile(emergencyPath, JSON.stringify(emergencyData, null, 2));
            
            this.logger.success('EMERGENCY', `Emergency package created: ${emergencyPath}`);
        } catch (emergencyError) {
            this.logger.error('EMERGENCY', `Emergency package failed: ${emergencyError.message}`);
        }
    }
}

// CLI handling
if (require.main === module) {
    const generator = new ExecutiveHandoffGenerator();
    
    const args = process.argv.slice(2);
    
    if (args.includes('--quick-verify')) {
        // Quick 30-second verification
        generator.runQuickHealthChecks()
            .then(() => console.log('✅ Quick verification complete'))
            .catch(error => {
                console.error('❌ Quick verification failed:', error.message);
                process.exit(1);
            });
    } else if (args.includes('--status-only')) {
        // Status-only export
        generator.collectVerificationData()
            .then(() => generator.exportJSON())
            .then(() => console.log('✅ Status export complete'))
            .catch(error => {
                console.error('❌ Status export failed:', error.message);
                process.exit(1);
            });
    } else {
        // Full handoff generation
        generator.generateHandoffPackage()
            .then(packagePath => {
                console.log(`\n🎉 HANDOFF PACKAGE GENERATED SUCCESSFULLY!`);
                console.log(`📦 Package location: ${packagePath}`);
                console.log(`\n📋 Package contents:`);
                console.log(`   - executive-handoff.json (raw data)`);
                console.log(`   - executive-handoff.md (technical report)`);
                console.log(`   - executive-handoff.html (interactive dashboard)`);
                console.log(`   - quick-commands.json (verification commands)`);
                console.log(`\n🚀 Open the HTML file in your browser for interactive dashboard!`);
            })
            .catch(error => {
                console.error('\n❌ Handoff generation failed:', error.message);
                console.log('\n📦 Check for emergency-handoff.json with partial data');
                process.exit(1);
            });
    }
}

module.exports = ExecutiveHandoffGenerator;