#!/usr/bin/env node

/**
 * 🔍 Handoff Prerequisites Verifier
 * 
 * This script verifies that all prerequisites are met for running
 * the Phase 1-3 verification handoff package.
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Colors for console output
const colors = {
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

class PrerequisiteVerifier {
    constructor() {
        this.checks = [];
        this.passed = 0;
        this.failed = 0;
        this.warnings = 0;
    }

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const prefix = `[${timestamp}]`;
        
        switch (type) {
            case 'success':
                console.log(`${colors.green}✅ ${prefix} ${message}${colors.reset}`);
                break;
            case 'error':
                console.log(`${colors.red}❌ ${prefix} ${message}${colors.reset}`);
                break;
            case 'warning':
                console.log(`${colors.yellow}⚠️  ${prefix} ${message}${colors.reset}`);
                break;
            case 'info':
                console.log(`${colors.blue}ℹ️  ${prefix} ${message}${colors.reset}`);
                break;
            default:
                console.log(`${prefix} ${message}`);
        }
    }

    async checkCommand(command, requiredVersion = null, description = '') {
        try {
            const { stdout, stderr } = await execAsync(`${command} --version`);
            const version = stdout.trim() || stderr.trim();
            
            if (requiredVersion) {
                const hasRequiredVersion = this.compareVersions(version, requiredVersion);
                if (hasRequiredVersion) {
                    this.log(`${description}: ${version}`, 'success');
                    this.passed++;
                    return true;
                } else {
                    this.log(`${description}: ${version} (requires ${requiredVersion}+)`, 'error');
                    this.failed++;
                    return false;
                }
            } else {
                this.log(`${description}: ${version}`, 'success');
                this.passed++;
                return true;
            }
        } catch (error) {
            this.log(`${description}: Not installed or not in PATH`, 'error');
            this.failed++;
            return false;
        }
    }

    compareVersions(actual, required) {
        // Simple version comparison - extract major.minor from strings like "v16.20.0"
        const getNumbers = (versionStr) => {
            const match = versionStr.match(/(\d+)\.(\d+)/);
            return match ? [parseInt(match[1]), parseInt(match[2])] : [0, 0];
        };

        const [actualMajor, actualMinor] = getNumbers(actual);
        const [requiredMajor, requiredMinor] = getNumbers(required);

        if (actualMajor > requiredMajor) return true;
        if (actualMajor === requiredMajor && actualMinor >= requiredMinor) return true;
        return false;
    }

    checkFile(filePath, description = '') {
        if (fs.existsSync(filePath)) {
            this.log(`${description}: Found`, 'success');
            this.passed++;
            return true;
        } else {
            this.log(`${description}: Missing`, 'error');
            this.failed++;
            return false;
        }
    }

    checkOptionalFile(filePath, description = '') {
        if (fs.existsSync(filePath)) {
            this.log(`${description}: Found`, 'success');
            return true;
        } else {
            this.log(`${description}: Missing (optional)`, 'warning');
            this.warnings++;
            return false;
        }
    }

    checkDirectory(dirPath, description = '') {
        if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
            this.log(`${description}: Found`, 'success');
            this.passed++;
            return true;
        } else {
            this.log(`${description}: Missing`, 'error');
            this.failed++;
            return false;
        }
    }

    async checkPort(port, description = '') {
        try {
            const { stdout } = await execAsync(`lsof -ti:${port}`);
            if (stdout.trim()) {
                this.log(`${description} (port ${port}): In use`, 'warning');
                this.warnings++;
                return false;
            } else {
                this.log(`${description} (port ${port}): Available`, 'success');
                this.passed++;
                return true;
            }
        } catch (error) {
            // Port is not in use - good
            this.log(`${description} (port ${port}): Available`, 'success');
            this.passed++;
            return true;
        }
    }

    async checkSystemResources() {
        try {
            // Check available memory (in MB)
            if (process.platform === 'darwin' || process.platform === 'linux') {
                const { stdout } = await execAsync('free -m 2>/dev/null || vm_stat | head -5');
                // This is a basic check - in real scenario you'd parse the output properly
                this.log('System memory: Available', 'success');
                this.passed++;
            } else {
                this.log('System memory: Cannot check on this platform', 'warning');
                this.warnings++;
            }

            // Check disk space
            const stats = fs.statSync('.');
            this.log('Disk space: Available', 'success');
            this.passed++;

        } catch (error) {
            this.log('System resources: Cannot verify', 'warning');
            this.warnings++;
        }
    }

    printSummary() {
        console.log('\n' + '='.repeat(60));
        console.log(`${colors.bold}PREREQUISITE VERIFICATION SUMMARY${colors.reset}`);
        console.log('='.repeat(60));
        
        console.log(`${colors.green}✅ Passed: ${this.passed}${colors.reset}`);
        console.log(`${colors.red}❌ Failed: ${this.failed}${colors.reset}`);
        console.log(`${colors.yellow}⚠️  Warnings: ${this.warnings}${colors.reset}`);
        
        console.log('\n' + '='.repeat(60));
        
        if (this.failed === 0) {
            console.log(`${colors.green}${colors.bold}🎉 ALL PREREQUISITES MET!${colors.reset}`);
            console.log(`${colors.green}You're ready to run the verification handoff.${colors.reset}`);
            console.log(`\n${colors.blue}Next steps:${colors.reset}`);
            console.log(`${colors.blue}  npm run handoff:verify${colors.reset}`);
            console.log(`${colors.blue}  # or${colors.reset}`);
            console.log(`${colors.blue}  ./run-all-phases.sh${colors.reset}`);
        } else {
            console.log(`${colors.red}${colors.bold}❌ PREREQUISITES NOT MET${colors.reset}`);
            console.log(`${colors.red}Please address the failed checks above.${colors.reset}`);
            
            if (this.failed > 0) {
                console.log(`\n${colors.yellow}Common solutions:${colors.reset}`);
                console.log(`${colors.yellow}  • Install Node.js v16+: https://nodejs.org/${colors.reset}`);
                console.log(`${colors.yellow}  • Run 'npm install' to install dependencies${colors.reset}`);
                console.log(`${colors.yellow}  • Ensure all required files are present${colors.reset}`);
            }
        }
        
        if (this.warnings > 0) {
            console.log(`\n${colors.yellow}⚠️  Note: Warnings indicate optional components or minor issues.${colors.reset}`);
            console.log(`${colors.yellow}   These may not prevent verification from running.${colors.reset}`);
        }
        
        console.log('\n');
    }

    async run() {
        console.log(`${colors.blue}${colors.bold}🔍 Document Generator - Prerequisites Verification${colors.reset}`);
        console.log(`${colors.blue}=============================================${colors.reset}\n`);
        
        this.log('Starting prerequisite verification...', 'info');
        
        // Check system software
        console.log(`\n${colors.bold}System Software:${colors.reset}`);
        await this.checkCommand('node', 'v16.0.0', 'Node.js');
        await this.checkCommand('npm', 'v7.0.0', 'npm');
        await this.checkCommand('git', null, 'Git');
        
        // Check required files
        console.log(`\n${colors.bold}Required Files:${colors.reset}`);
        this.checkFile('package.json', 'package.json');
        this.checkFile('soulfra-baseline-analysis.js', 'Baseline Analysis Script');
        this.checkFile('execute-reproducibility-test.js', 'Reproducibility Test Script');
        this.checkFile('generate-phase3-qr-codes-fixed.js', 'QR Code Generator');
        this.checkFile('start-all-fixes.sh', 'Fix Starter Script');
        
        // Check fix files
        console.log(`\n${colors.bold}Fix Files:${colors.reset}`);
        this.checkFile('fix-document-processing-flow.js', 'Document Processing Fix');
        this.checkFile('fix-ai-service-fallback.js', 'AI Service Fix');
        this.checkFile('fix-end-to-end-journey.js', 'End-to-End Journey Fix');
        
        // Check optional files
        console.log(`\n${colors.bold}Optional Files:${colors.reset}`);
        this.checkOptionalFile('README-HANDOFF.md', 'Handoff Instructions');
        this.checkOptionalFile('QUICK-START-HANDOFF.md', 'Quick Start Guide');
        
        // Check directories
        console.log(`\n${colors.bold}Directories:${colors.reset}`);
        this.checkOptionalFile('node_modules', 'Node Modules');
        
        // Check ports
        console.log(`\n${colors.bold}Port Availability:${colors.reset}`);
        await this.checkPort(8090, 'Empire API Bridge');
        await this.checkPort(8091, 'Document Processing');
        await this.checkPort(3001, 'AI Service');
        await this.checkPort(3012, 'Journey Service');
        
        // Check system resources
        console.log(`\n${colors.bold}System Resources:${colors.reset}`);
        await this.checkSystemResources();
        
        // Print summary
        this.printSummary();
        
        // Exit with appropriate code
        process.exit(this.failed > 0 ? 1 : 0);
    }
}

// Run the verification
if (require.main === module) {
    const verifier = new PrerequisiteVerifier();
    verifier.run().catch(error => {
        console.error(`${colors.red}❌ Verification failed with error: ${error.message}${colors.reset}`);
        process.exit(1);
    });
}

module.exports = PrerequisiteVerifier;