#!/usr/bin/env node

/**
 * 📊 Handoff Results Collector
 * 
 * Collects all verification results and generates a comprehensive
 * handoff summary for 3rd party verification.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class HandoffResultsCollector {
    constructor() {
        this.timestamp = new Date();
        this.results = {
            summary: {},
            phase1: {},
            phase2: {},
            phase3: {},
            files: [],
            verification: {}
        };
        this.collectionId = this.generateId();
    }

    generateId() {
        return crypto.randomBytes(8).toString('hex');
    }

    log(message, type = 'info') {
        const colors = {
            green: '\x1b[32m',
            yellow: '\x1b[33m',
            red: '\x1b[31m',
            blue: '\x1b[34m',
            reset: '\x1b[0m'
        };

        const timestamp = new Date().toLocaleTimeString();
        switch (type) {
            case 'success':
                console.log(`${colors.green}✅ [${timestamp}] ${message}${colors.reset}`);
                break;
            case 'error':
                console.log(`${colors.red}❌ [${timestamp}] ${message}${colors.reset}`);
                break;
            case 'warning':
                console.log(`${colors.yellow}⚠️  [${timestamp}] ${message}${colors.reset}`);
                break;
            default:
                console.log(`${colors.blue}ℹ️  [${timestamp}] ${message}${colors.reset}`);
        }
    }

    findFiles(pattern) {
        const files = fs.readdirSync('.')
            .filter(file => {
                if (pattern.includes('*')) {
                    const regexPattern = pattern.replace(/\*/g, '.*');
                    return new RegExp(regexPattern).test(file);
                }
                return file === pattern;
            });
        return files;
    }

    readJsonFile(filename) {
        try {
            if (fs.existsSync(filename)) {
                const content = fs.readFileSync(filename, 'utf8');
                return JSON.parse(content);
            }
        } catch (error) {
            this.log(`Failed to read ${filename}: ${error.message}`, 'warning');
        }
        return null;
    }

    readTextFile(filename) {
        try {
            if (fs.existsSync(filename)) {
                return fs.readFileSync(filename, 'utf8');
            }
        } catch (error) {
            this.log(`Failed to read ${filename}: ${error.message}`, 'warning');
        }
        return null;
    }

    collectPhase1Results() {
        this.log('Collecting Phase 1 baseline results...');
        
        // Find baseline results
        const baselineFiles = this.findFiles('soulfra-baseline-results-*.json');
        if (baselineFiles.length > 0) {
            const latestBaseline = baselineFiles[baselineFiles.length - 1];
            const baselineData = this.readJsonFile(latestBaseline);
            
            if (baselineData) {
                this.results.phase1 = {
                    file: latestBaseline,
                    systemHealth: baselineData.systemHealth,
                    testsPassingCount: baselineData.testsPassingCount,
                    testsTotalCount: baselineData.testsTotalCount,
                    soulfraScore: baselineData.soulfraScore,
                    criticalFailures: baselineData.criticalFailures || [],
                    timestamp: baselineData.timestamp
                };
                this.log(`Found baseline: ${latestBaseline}`, 'success');
            }
        } else {
            this.log('No baseline results found', 'warning');
            this.results.phase1.error = 'No baseline results found';
        }
    }

    collectPhase2Results() {
        this.log('Collecting Phase 2 integration results...');
        
        // Find integration test results
        const integrationData = this.readJsonFile('integration-test-results.json');
        if (integrationData) {
            this.results.phase2 = {
                file: 'integration-test-results.json',
                testsRun: integrationData.testsRun,
                testsPassed: integrationData.testsPassed,
                testsFailed: integrationData.testsFailed,
                successRate: integrationData.successRate,
                criticalFailures: integrationData.failedTests || [],
                timestamp: integrationData.timestamp
            };
            this.log('Found integration results', 'success');
        } else {
            this.log('No integration results found', 'warning');
            this.results.phase2.error = 'No integration results found';
        }
    }

    collectPhase3Results() {
        this.log('Collecting Phase 3 verification results...');
        
        // Documentation test results
        const docTestFiles = this.findFiles('doc-test-report-*.json');
        if (docTestFiles.length > 0) {
            const latestDocTest = docTestFiles[docTestFiles.length - 1];
            const docTestData = this.readJsonFile(latestDocTest);
            
            if (docTestData) {
                this.results.phase3.documentationTests = {
                    file: latestDocTest,
                    scriptsExtracted: docTestData.scriptsExtracted,
                    scriptsPassed: docTestData.scriptsPassed,
                    successRate: docTestData.successRate,
                    timestamp: docTestData.timestamp
                };
            }
        }
        
        // Reproducibility test results
        const reproducibilityFiles = this.findFiles('reproducibility-report-*.json');
        if (reproducibilityFiles.length > 0) {
            const latestReproducibility = reproducibilityFiles[reproducibilityFiles.length - 1];
            const reproducibilityData = this.readJsonFile(latestReproducibility);
            
            if (reproducibilityData) {
                this.results.phase3.reproducibilityTests = {
                    file: latestReproducibility,
                    iterations: reproducibilityData.iterations,
                    uniqueResults: reproducibilityData.uniqueResults,
                    reproducibilityScore: reproducibilityData.reproducibilityScore,
                    timestamp: reproducibilityData.timestamp
                };
            }
        }
        
        // QR verification results
        const qrManifestFiles = this.findFiles('phase3-qr-manifest-*.json');
        if (qrManifestFiles.length > 0) {
            const latestQrManifest = qrManifestFiles[qrManifestFiles.length - 1];
            const qrData = this.readJsonFile(latestQrManifest);
            
            if (qrData) {
                this.results.phase3.qrVerification = {
                    file: latestQrManifest,
                    totalCodes: qrData.qrCodes ? qrData.qrCodes.length : 0,
                    categories: qrData.qrCodes ? this.categorizeQrCodes(qrData.qrCodes) : {},
                    verificationPage: qrData.verificationPage,
                    timestamp: qrData.timestamp
                };
            }
        }
        
        this.log('Phase 3 collection complete', 'success');
    }

    categorizeQrCodes(qrCodes) {
        const categories = {};
        qrCodes.forEach(qr => {
            const category = qr.category || 'unknown';
            if (!categories[category]) categories[category] = 0;
            categories[category]++;
        });
        return categories;
    }

    collectFileManifest() {
        this.log('Building file manifest...');
        
        const importantFiles = [
            // Phase outputs
            'soulfra-baseline-results-*.json',
            'integration-test-results.json',
            'doc-test-report-*.json',
            'reproducibility-report-*.json',
            'phase3-qr-manifest-*.json',
            'phase3-qr-verification-*.html',
            
            // Documentation
            'README-HANDOFF.md',
            'QUICK-START-HANDOFF.md',
            'PHASE-3-COMPLETION-REPORT.md',
            
            // Scripts
            'soulfra-baseline-analysis.js',
            'execute-reproducibility-test.js',
            'generate-phase3-qr-codes-fixed.js',
            'run-all-phases.sh',
            'verify-prerequisites.js'
        ];
        
        importantFiles.forEach(pattern => {
            const files = this.findFiles(pattern);
            files.forEach(file => {
                try {
                    const stats = fs.statSync(file);
                    this.results.files.push({
                        name: file,
                        size: stats.size,
                        modified: stats.mtime,
                        type: this.getFileType(file)
                    });
                } catch (error) {
                    // File might not exist, skip it
                }
            });
        });
        
        this.log(`Found ${this.results.files.length} important files`, 'success');
    }

    getFileType(filename) {
        if (filename.endsWith('.json')) return 'data';
        if (filename.endsWith('.md')) return 'documentation';
        if (filename.endsWith('.js')) return 'script';
        if (filename.endsWith('.sh')) return 'script';
        if (filename.endsWith('.html')) return 'report';
        return 'unknown';
    }

    generateSummary() {
        this.log('Generating verification summary...');
        
        // Calculate overall metrics
        const phase1Health = this.results.phase1.systemHealth || '0%';
        const phase2Health = this.results.phase2.successRate || '0%';
        const phase3Reproducibility = this.results.phase3.reproducibilityTests?.reproducibilityScore || '0%';
        
        this.results.summary = {
            collectionId: this.collectionId,
            timestamp: this.timestamp.toISOString(),
            totalPhases: 3,
            phasesCompleted: this.countCompletedPhases(),
            
            // Key metrics
            initialSystemHealth: phase1Health,
            finalSystemHealth: phase2Health,
            reproducibilityScore: phase3Reproducibility,
            
            // Critical metrics
            criticalFailuresFixed: this.countCriticalFailuresFixed(),
            qrCodesGenerated: this.results.phase3.qrVerification?.totalCodes || 0,
            totalFilesGenerated: this.results.files.length,
            
            // Status
            verificationComplete: this.isVerificationComplete(),
            thirdPartyReady: this.isThirdPartyReady()
        };
    }

    countCompletedPhases() {
        let completed = 0;
        if (this.results.phase1.systemHealth) completed++;
        if (this.results.phase2.successRate) completed++;
        if (this.results.phase3.qrVerification) completed++;
        return completed;
    }

    countCriticalFailuresFixed() {
        const phase1Failures = this.results.phase1.criticalFailures?.length || 0;
        const phase2Failures = this.results.phase2.criticalFailures?.length || 0;
        return Math.max(0, phase1Failures - phase2Failures);
    }

    isVerificationComplete() {
        return this.results.phase1.systemHealth &&
               this.results.phase2.successRate &&
               this.results.phase3.qrVerification;
    }

    isThirdPartyReady() {
        return this.isVerificationComplete() &&
               this.results.phase3.qrVerification?.totalCodes > 0 &&
               this.results.files.length > 5;
    }

    generateReport() {
        const reportData = {
            metadata: {
                generatedAt: this.timestamp.toISOString(),
                collectionId: this.collectionId,
                version: '1.0.0'
            },
            ...this.results
        };
        
        // Generate JSON report
        const jsonFilename = `handoff-verification-summary-${this.collectionId}.json`;
        fs.writeFileSync(jsonFilename, JSON.stringify(reportData, null, 2));
        this.log(`Generated JSON report: ${jsonFilename}`, 'success');
        
        // Generate HTML report
        const htmlFilename = `handoff-verification-report-${this.collectionId}.html`;
        const htmlContent = this.generateHtmlReport(reportData);
        fs.writeFileSync(htmlFilename, htmlContent);
        this.log(`Generated HTML report: ${htmlFilename}`, 'success');
        
        return { jsonFilename, htmlFilename };
    }

    generateHtmlReport(data) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document Generator - Handoff Verification Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 40px; line-height: 1.6; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #28a745; }
        .metric.warning { border-left-color: #ffc107; }
        .metric.error { border-left-color: #dc3545; }
        .metric-value { font-size: 24px; font-weight: bold; color: #333; }
        .metric-label { color: #666; font-size: 14px; }
        .phase { margin-bottom: 30px; padding: 20px; border: 1px solid #dee2e6; border-radius: 8px; }
        .phase h3 { margin-top: 0; color: #495057; }
        .status { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .status.success { background: #d4edda; color: #155724; }
        .status.warning { background: #fff3cd; color: #856404; }
        .status.error { background: #f8d7da; color: #721c24; }
        .files { margin-top: 20px; }
        .file-list { max-height: 200px; overflow-y: auto; background: #f8f9fa; padding: 10px; border-radius: 4px; }
        .verification-ready { background: #d4edda; padding: 15px; border-radius: 8px; margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #dee2e6; }
        th { background: #f8f9fa; font-weight: 600; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Document Generator - Handoff Verification Report</h1>
        <p>Collection ID: ${data.metadata.collectionId} | Generated: ${new Date(data.metadata.generatedAt).toLocaleString()}</p>
    </div>

    <div class="summary">
        <div class="metric ${data.summary.verificationComplete ? 'success' : 'error'}">
            <div class="metric-value">${data.summary.phasesCompleted}/3</div>
            <div class="metric-label">Phases Completed</div>
        </div>
        <div class="metric">
            <div class="metric-value">${data.summary.finalSystemHealth}</div>
            <div class="metric-label">System Health</div>
        </div>
        <div class="metric">
            <div class="metric-value">${data.summary.reproducibilityScore}</div>
            <div class="metric-label">Reproducibility</div>
        </div>
        <div class="metric">
            <div class="metric-value">${data.summary.qrCodesGenerated}</div>
            <div class="metric-label">QR Codes Generated</div>
        </div>
    </div>

    ${data.summary.thirdPartyReady ? 
        '<div class="verification-ready"><strong>✅ Third Party Verification Ready</strong><br>All verification components are available and QR codes have been generated.</div>' : 
        '<div class="status error">⚠️ Third Party Verification Not Ready</div>'}

    <div class="phase">
        <h3>📋 Phase 1: Baseline Analysis</h3>
        ${data.phase1.systemHealth ? `
            <p><span class="status success">COMPLETED</span></p>
            <table>
                <tr><th>Metric</th><th>Value</th></tr>
                <tr><td>System Health</td><td>${data.phase1.systemHealth}</td></tr>
                <tr><td>Tests Passing</td><td>${data.phase1.testsPassingCount}/${data.phase1.testsTotalCount}</td></tr>
                <tr><td>Soulfra Score</td><td>${data.phase1.soulfraScore}/100</td></tr>
                <tr><td>Critical Failures</td><td>${data.phase1.criticalFailures.length}</td></tr>
            </table>
        ` : '<p><span class="status error">NOT COMPLETED</span></p>'}
    </div>

    <div class="phase">
        <h3>🔧 Phase 2: Integration Testing</h3>
        ${data.phase2.successRate ? `
            <p><span class="status success">COMPLETED</span></p>
            <table>
                <tr><th>Metric</th><th>Value</th></tr>
                <tr><td>Success Rate</td><td>${data.phase2.successRate}</td></tr>
                <tr><td>Tests Passed</td><td>${data.phase2.testsPassed}/${data.phase2.testsRun}</td></tr>
                <tr><td>Critical Failures</td><td>${data.phase2.criticalFailures.length}</td></tr>
            </table>
        ` : '<p><span class="status error">NOT COMPLETED</span></p>'}
    </div>

    <div class="phase">
        <h3>✅ Phase 3: Verification & QR Generation</h3>
        ${data.phase3.qrVerification ? `
            <p><span class="status success">COMPLETED</span></p>
            <table>
                <tr><th>Component</th><th>Status</th></tr>
                <tr><td>Documentation Tests</td><td>${data.phase3.documentationTests ? data.phase3.documentationTests.successRate : 'N/A'}</td></tr>
                <tr><td>Reproducibility</td><td>${data.phase3.reproducibilityTests ? data.phase3.reproducibilityTests.reproducibilityScore : 'N/A'}</td></tr>
                <tr><td>QR Codes</td><td>${data.phase3.qrVerification.totalCodes} generated</td></tr>
            </table>
        ` : '<p><span class="status error">NOT COMPLETED</span></p>'}
    </div>

    <div class="files">
        <h3>📁 Generated Files (${data.files.length})</h3>
        <div class="file-list">
            ${data.files.map(file => `
                <div style="margin: 5px 0;">
                    <strong>${file.name}</strong> 
                    <span style="color: #666;">(${file.type}, ${(file.size / 1024).toFixed(1)}KB)</span>
                </div>
            `).join('')}
        </div>
    </div>

    <div style="margin-top: 40px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
        <h3>🎯 Next Steps</h3>
        <ol>
            <li>Review all generated QR codes for verification</li>
            <li>Run independent verification using the handoff package</li>
            <li>Compare your results with the provided baseline</li>
            <li>Report any discrepancies or issues</li>
        </ol>
    </div>
</body>
</html>`;
    }

    async run() {
        console.log('📊 Document Generator - Handoff Results Collector');
        console.log('================================================\n');
        
        this.log(`Starting collection with ID: ${this.collectionId}`);
        
        try {
            // Collect results from all phases
            this.collectPhase1Results();
            this.collectPhase2Results();
            this.collectPhase3Results();
            this.collectFileManifest();
            
            // Generate summary
            this.generateSummary();
            
            // Generate reports
            const reports = this.generateReport();
            
            // Print final summary
            console.log('\n' + '='.repeat(50));
            console.log('📊 COLLECTION SUMMARY');
            console.log('='.repeat(50));
            console.log(`Collection ID: ${this.collectionId}`);
            console.log(`Phases Completed: ${this.results.summary.phasesCompleted}/3`);
            console.log(`System Health: ${this.results.summary.initialSystemHealth} → ${this.results.summary.finalSystemHealth}`);
            console.log(`Reproducibility: ${this.results.summary.reproducibilityScore}`);
            console.log(`QR Codes: ${this.results.summary.qrCodesGenerated}`);
            console.log(`Files Generated: ${this.results.summary.totalFilesGenerated}`);
            console.log(`Third Party Ready: ${this.results.summary.thirdPartyReady ? '✅ Yes' : '❌ No'}`);
            
            console.log('\n📄 Reports Generated:');
            console.log(`  • ${reports.jsonFilename} (Machine-readable)`);
            console.log(`  • ${reports.htmlFilename} (Human-readable)`);
            
            if (this.results.summary.thirdPartyReady) {
                this.log('🎉 Handoff package is complete and ready for 3rd party verification!', 'success');
            } else {
                this.log('⚠️  Handoff package may be incomplete. Check the warnings above.', 'warning');
            }
            
        } catch (error) {
            this.log(`Collection failed: ${error.message}`, 'error');
            process.exit(1);
        }
    }
}

// Run the collector
if (require.main === module) {
    const collector = new HandoffResultsCollector();
    collector.run().catch(error => {
        console.error(`❌ Collection failed: ${error.message}`);
        process.exit(1);
    });
}

module.exports = HandoffResultsCollector;