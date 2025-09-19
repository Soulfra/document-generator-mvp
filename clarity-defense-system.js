#!/usr/bin/env node

/**
 * 🛡️ CLARITY DEFENSE SYSTEM 🛡️
 * 
 * Protects against malicious dependencies, supply chain attacks,
 * and provides cringe-proof validation of all external code
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const vm = require('vm');
const { execSync } = require('child_process');
const https = require('https');

class ClarityDefenseSystem {
    constructor(options = {}) {
        this.rootDir = options.rootDir || process.cwd();
        this.quarantineDir = path.join(this.rootDir, '.clarity-quarantine');
        this.whitelistPath = path.join(this.rootDir, '.clarity-whitelist.json');
        this.blacklistPath = path.join(this.rootDir, '.clarity-blacklist.json');
        
        // Security policies
        this.policies = {
            allowNetworkAccess: false,
            allowFileSystemAccess: false,
            allowChildProcess: false,
            allowNativeModules: false,
            maxExecutionTime: 5000, // 5 seconds
            maxMemoryUsage: 100 * 1024 * 1024 // 100MB
        };
        
        // Known malicious patterns
        this.maliciousPatterns = [
            /eval\s*\(/,
            /Function\s*\(/,
            /require\s*\(\s*'child_process'\s*\)/,
            /process\.env/,
            /process\.exit/,
            /require\s*\(\s*'fs'\s*\)\.unlink/,
            /crypto\s*\.\s*createCipher/,
            /\.exec\s*\(/,
            /\.spawn\s*\(/,
            /new\s+ActiveXObject/,
            /document\.write/,
            /window\.location/,
            /__proto__/,
            /constructor\s*\[/
        ];
        
        // Trusted registries
        this.trustedRegistries = [
            'https://registry.npmjs.org',
            'https://registry.yarnpkg.com'
        ];
        
        // Risk scores
        this.riskScores = new Map();
        this.whitelist = new Set();
        this.blacklist = new Set();
        
        console.log('🛡️ Clarity Defense System initializing...');
    }
    
    async initialize() {
        console.log('\n🔒 Setting up security infrastructure...');
        
        // Create quarantine directory
        await fs.mkdir(this.quarantineDir, { recursive: true });
        
        // Load whitelist/blacklist
        await this.loadLists();
        
        // Initialize sandbox environment
        this.initializeSandbox();
        
        console.log('✅ Defense system ready!');
    }
    
    async loadLists() {
        // Load whitelist
        try {
            const whitelistData = await fs.readFile(this.whitelistPath, 'utf-8');
            const whitelist = JSON.parse(whitelistData);
            whitelist.forEach(pkg => this.whitelist.add(pkg));
            console.log(`   Loaded ${this.whitelist.size} whitelisted packages`);
        } catch (error) {
            // Initialize with known safe packages
            this.initializeWhitelist();
        }
        
        // Load blacklist
        try {
            const blacklistData = await fs.readFile(this.blacklistPath, 'utf-8');
            const blacklist = JSON.parse(blacklistData);
            blacklist.forEach(pkg => this.blacklist.add(pkg));
            console.log(`   Loaded ${this.blacklist.size} blacklisted packages`);
        } catch (error) {
            // Initialize with known malicious packages
            this.initializeBlacklist();
        }
    }
    
    initializeWhitelist() {
        // Core packages that are known to be safe
        const safePackages = [
            'express', 'react', 'vue', 'angular',
            'lodash', 'axios', 'moment', 'dayjs',
            'typescript', 'webpack', 'babel-core',
            'jest', 'mocha', 'eslint', 'prettier',
            'pg', 'mysql', 'mongodb', 'redis',
            'jsonwebtoken', 'bcrypt', 'uuid',
            'dotenv', 'cors', 'helmet', 'compression'
        ];
        
        safePackages.forEach(pkg => this.whitelist.add(pkg));
        console.log(`   Initialized whitelist with ${this.whitelist.size} safe packages`);
    }
    
    initializeBlacklist() {
        // Known malicious or suspicious packages
        const maliciousPackages = [
            'flatmap-stream', 'event-stream@3.3.6',
            'bootstrap-sass@3.4.0', 'babelcli',
            'crossenv', 'cross-env.js', 'd0xed',
            'eslint-scope@3.7.2', 'eslint-config-eslint@5.0.2'
        ];
        
        maliciousPackages.forEach(pkg => this.blacklist.add(pkg));
        console.log(`   Initialized blacklist with ${this.blacklist.size} malicious packages`);
    }
    
    initializeSandbox() {
        // Create isolated VM context for safe code execution
        this.sandboxContext = vm.createContext({
            console: {
                log: () => {},
                error: () => {},
                warn: () => {}
            },
            setTimeout: () => {},
            setInterval: () => {},
            setImmediate: () => {},
            Buffer: Buffer,
            Array: Array,
            Object: Object,
            String: String,
            Number: Number,
            Boolean: Boolean,
            Date: Date,
            Math: Math,
            JSON: JSON
        });
        
        console.log('   Sandbox environment initialized');
    }
    
    async scanDependency(packageName, version = 'latest') {
        console.log(`\n🔍 Scanning ${packageName}@${version}...`);
        
        // Check blacklist first
        if (this.blacklist.has(packageName) || this.blacklist.has(`${packageName}@${version}`)) {
            console.log('❌ Package is blacklisted!');
            return {
                package: packageName,
                version,
                safe: false,
                risk: 'CRITICAL',
                reason: 'Blacklisted package'
            };
        }
        
        // Check whitelist
        if (this.whitelist.has(packageName)) {
            console.log('✅ Package is whitelisted');
            return {
                package: packageName,
                version,
                safe: true,
                risk: 'LOW',
                reason: 'Whitelisted package'
            };
        }
        
        // Perform comprehensive security scan
        const scanResult = await this.performSecurityScan(packageName, version);
        
        // Calculate risk score
        const riskScore = this.calculateRiskScore(scanResult);
        
        // Store result
        this.riskScores.set(`${packageName}@${version}`, riskScore);
        
        return {
            package: packageName,
            version,
            safe: riskScore.level !== 'CRITICAL' && riskScore.level !== 'HIGH',
            risk: riskScore.level,
            score: riskScore.score,
            issues: riskScore.issues,
            recommendation: riskScore.recommendation
        };
    }
    
    async performSecurityScan(packageName, version) {
        const scanResult = {
            packageInfo: {},
            codeAnalysis: {},
            networkAnalysis: {},
            dependencyAnalysis: {},
            maintainerAnalysis: {},
            historyAnalysis: {}
        };
        
        // 1. Fetch package information
        scanResult.packageInfo = await this.fetchPackageInfo(packageName, version);
        
        // 2. Download and analyze package code
        const packagePath = await this.downloadPackage(packageName, version);
        if (packagePath) {
            scanResult.codeAnalysis = await this.analyzeCode(packagePath);
            
            // 3. Analyze network behavior
            scanResult.networkAnalysis = await this.analyzeNetworkBehavior(packagePath);
            
            // 4. Analyze dependencies
            scanResult.dependencyAnalysis = await this.analyzeDependencies(packagePath);
            
            // Clean up
            await this.quarantinePackage(packagePath);
        }
        
        // 5. Analyze maintainer reputation
        scanResult.maintainerAnalysis = await this.analyzeMaintainer(scanResult.packageInfo);
        
        // 6. Analyze version history
        scanResult.historyAnalysis = await this.analyzeHistory(packageName);
        
        return scanResult;
    }
    
    async fetchPackageInfo(packageName, version) {
        try {
            const registryUrl = `https://registry.npmjs.org/${packageName}`;
            
            return new Promise((resolve, reject) => {
                https.get(registryUrl, (res) => {
                    let data = '';
                    
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => {
                        try {
                            const packageData = JSON.parse(data);
                            const versionData = packageData.versions[version] || 
                                              packageData['dist-tags'].latest;
                            
                            resolve({
                                name: packageData.name,
                                version: versionData.version,
                                description: packageData.description,
                                license: packageData.license,
                                author: packageData.author,
                                maintainers: packageData.maintainers,
                                repository: packageData.repository,
                                downloads: packageData.downloads,
                                createdAt: packageData.time.created,
                                modifiedAt: packageData.time.modified
                            });
                        } catch (error) {
                            resolve({ error: 'Failed to parse package data' });
                        }
                    });
                }).on('error', (err) => {
                    resolve({ error: err.message });
                });
            });
            
        } catch (error) {
            return { error: error.message };
        }
    }
    
    async downloadPackage(packageName, version) {
        try {
            const tempDir = path.join(this.quarantineDir, `${packageName}-${version}-${Date.now()}`);
            await fs.mkdir(tempDir, { recursive: true });
            
            // Download package to quarantine
            execSync(`npm pack ${packageName}@${version}`, {
                cwd: tempDir,
                stdio: 'ignore'
            });
            
            // Extract package
            const tarFile = (await fs.readdir(tempDir)).find(f => f.endsWith('.tgz'));
            if (tarFile) {
                execSync(`tar -xzf ${tarFile}`, {
                    cwd: tempDir,
                    stdio: 'ignore'
                });
                
                return path.join(tempDir, 'package');
            }
            
        } catch (error) {
            console.error('   Failed to download package:', error.message);
            return null;
        }
    }
    
    async analyzeCode(packagePath) {
        const analysis = {
            suspiciousPatterns: [],
            dangerousFunctions: [],
            obfuscation: false,
            minified: false,
            totalFiles: 0,
            totalLines: 0
        };
        
        try {
            const files = await this.getJavaScriptFiles(packagePath);
            analysis.totalFiles = files.length;
            
            for (const file of files) {
                const content = await fs.readFile(file, 'utf-8');
                analysis.totalLines += content.split('\n').length;
                
                // Check for suspicious patterns
                for (const pattern of this.maliciousPatterns) {
                    if (pattern.test(content)) {
                        analysis.suspiciousPatterns.push({
                            file: path.relative(packagePath, file),
                            pattern: pattern.toString(),
                            line: this.findLineNumber(content, pattern)
                        });
                    }
                }
                
                // Check for obfuscation
                if (this.isObfuscated(content)) {
                    analysis.obfuscation = true;
                }
                
                // Check if minified
                if (this.isMinified(content)) {
                    analysis.minified = true;
                }
                
                // Check for dangerous functions
                const dangerous = this.findDangerousFunctions(content);
                if (dangerous.length > 0) {
                    analysis.dangerousFunctions.push({
                        file: path.relative(packagePath, file),
                        functions: dangerous
                    });
                }
            }
            
        } catch (error) {
            analysis.error = error.message;
        }
        
        return analysis;
    }
    
    async analyzeNetworkBehavior(packagePath) {
        const analysis = {
            httpRequests: [],
            dnsLookups: [],
            socketConnections: [],
            apiEndpoints: []
        };
        
        try {
            const files = await this.getJavaScriptFiles(packagePath);
            
            for (const file of files) {
                const content = await fs.readFile(file, 'utf-8');
                
                // Find HTTP requests
                const httpPatterns = [
                    /https?:\/\/[^\s'"]+/g,
                    /fetch\s*\(\s*['"]([^'"]+)['"]/g,
                    /axios\.[get|post|put|delete]\s*\(\s*['"]([^'"]+)['"]/g,
                    /request\s*\(\s*['"]([^'"]+)['"]/g
                ];
                
                for (const pattern of httpPatterns) {
                    const matches = content.match(pattern) || [];
                    analysis.httpRequests.push(...matches);
                }
                
                // Find socket connections
                const socketPatterns = [
                    /new\s+WebSocket\s*\(/g,
                    /io\s*\(\s*['"]([^'"]+)['"]/g,
                    /net\.connect/g,
                    /net\.createConnection/g
                ];
                
                for (const pattern of socketPatterns) {
                    if (pattern.test(content)) {
                        analysis.socketConnections.push({
                            file: path.relative(packagePath, file),
                            type: pattern.source
                        });
                    }
                }
            }
            
        } catch (error) {
            analysis.error = error.message;
        }
        
        return analysis;
    }
    
    async analyzeDependencies(packagePath) {
        const analysis = {
            directDependencies: {},
            transitiveDependencies: {},
            suspiciousDependencies: [],
            totalDependencies: 0
        };
        
        try {
            const packageJsonPath = path.join(packagePath, 'package.json');
            const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
            
            // Analyze direct dependencies
            const deps = {
                ...packageJson.dependencies,
                ...packageJson.devDependencies,
                ...packageJson.peerDependencies
            };
            
            analysis.directDependencies = deps;
            analysis.totalDependencies = Object.keys(deps).length;
            
            // Check for suspicious dependency patterns
            for (const [dep, version] of Object.entries(deps)) {
                // Check if dependency is blacklisted
                if (this.blacklist.has(dep)) {
                    analysis.suspiciousDependencies.push({
                        name: dep,
                        version,
                        reason: 'Blacklisted dependency'
                    });
                }
                
                // Check for typosquatting
                if (this.isTyposquatting(dep)) {
                    analysis.suspiciousDependencies.push({
                        name: dep,
                        version,
                        reason: 'Possible typosquatting'
                    });
                }
                
                // Check for unusual version patterns
                if (this.isUnusualVersion(version)) {
                    analysis.suspiciousDependencies.push({
                        name: dep,
                        version,
                        reason: 'Unusual version specification'
                    });
                }
            }
            
        } catch (error) {
            analysis.error = error.message;
        }
        
        return analysis;
    }
    
    async analyzeMaintainer(packageInfo) {
        const analysis = {
            reputation: 'UNKNOWN',
            accountAge: 0,
            otherPackages: 0,
            recentActivity: false,
            verified: false
        };
        
        if (!packageInfo || packageInfo.error) {
            return analysis;
        }
        
        try {
            // Calculate account age
            if (packageInfo.createdAt) {
                const created = new Date(packageInfo.createdAt);
                const now = new Date();
                analysis.accountAge = Math.floor((now - created) / (1000 * 60 * 60 * 24)); // days
            }
            
            // Check recent activity
            if (packageInfo.modifiedAt) {
                const modified = new Date(packageInfo.modifiedAt);
                const daysSinceModified = Math.floor((new Date() - modified) / (1000 * 60 * 60 * 24));
                analysis.recentActivity = daysSinceModified < 180; // Active in last 6 months
            }
            
            // Determine reputation based on age and activity
            if (analysis.accountAge > 365 && analysis.recentActivity) {
                analysis.reputation = 'GOOD';
            } else if (analysis.accountAge > 90) {
                analysis.reputation = 'FAIR';
            } else {
                analysis.reputation = 'NEW';
            }
            
        } catch (error) {
            analysis.error = error.message;
        }
        
        return analysis;
    }
    
    async analyzeHistory(packageName) {
        const analysis = {
            totalVersions: 0,
            recentVersions: [],
            updateFrequency: 'UNKNOWN',
            majorChanges: 0,
            securityUpdates: 0
        };
        
        // This would require more API calls to get full history
        // For now, return basic analysis
        
        return analysis;
    }
    
    calculateRiskScore(scanResult) {
        let score = 0;
        const issues = [];
        
        // Code analysis scoring
        if (scanResult.codeAnalysis.suspiciousPatterns.length > 0) {
            score += scanResult.codeAnalysis.suspiciousPatterns.length * 10;
            issues.push(`Found ${scanResult.codeAnalysis.suspiciousPatterns.length} suspicious patterns`);
        }
        
        if (scanResult.codeAnalysis.dangerousFunctions.length > 0) {
            score += scanResult.codeAnalysis.dangerousFunctions.length * 15;
            issues.push(`Found dangerous functions`);
        }
        
        if (scanResult.codeAnalysis.obfuscation) {
            score += 25;
            issues.push('Code appears to be obfuscated');
        }
        
        // Network analysis scoring
        if (scanResult.networkAnalysis.httpRequests.length > 0) {
            const suspiciousUrls = scanResult.networkAnalysis.httpRequests.filter(url => 
                !url.includes('npmjs.org') && !url.includes('github.com')
            );
            if (suspiciousUrls.length > 0) {
                score += suspiciousUrls.length * 5;
                issues.push(`Makes HTTP requests to ${suspiciousUrls.length} external domains`);
            }
        }
        
        if (scanResult.networkAnalysis.socketConnections.length > 0) {
            score += 20;
            issues.push('Opens socket connections');
        }
        
        // Dependency analysis scoring
        if (scanResult.dependencyAnalysis.suspiciousDependencies.length > 0) {
            score += scanResult.dependencyAnalysis.suspiciousDependencies.length * 20;
            issues.push(`Has ${scanResult.dependencyAnalysis.suspiciousDependencies.length} suspicious dependencies`);
        }
        
        // Maintainer analysis scoring
        if (scanResult.maintainerAnalysis.reputation === 'NEW') {
            score += 10;
            issues.push('Package from new/unverified maintainer');
        }
        
        if (!scanResult.maintainerAnalysis.recentActivity) {
            score += 5;
            issues.push('No recent maintainer activity');
        }
        
        // Determine risk level
        let level = 'LOW';
        let recommendation = 'Safe to use';
        
        if (score >= 50) {
            level = 'CRITICAL';
            recommendation = 'DO NOT USE - High security risk';
        } else if (score >= 30) {
            level = 'HIGH';
            recommendation = 'Use with extreme caution';
        } else if (score >= 15) {
            level = 'MEDIUM';
            recommendation = 'Review carefully before use';
        } else if (score > 0) {
            level = 'LOW';
            recommendation = 'Minor concerns, likely safe';
        }
        
        return {
            score,
            level,
            issues,
            recommendation
        };
    }
    
    // Utility methods
    async getJavaScriptFiles(dir) {
        const files = [];
        
        try {
            const items = await fs.readdir(dir);
            
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = await fs.stat(fullPath);
                
                if (stat.isDirectory() && !item.includes('node_modules')) {
                    const subFiles = await this.getJavaScriptFiles(fullPath);
                    files.push(...subFiles);
                } else if (item.match(/\.(js|mjs|cjs)$/)) {
                    files.push(fullPath);
                }
            }
        } catch (error) {
            // Skip
        }
        
        return files;
    }
    
    isObfuscated(code) {
        // Check for signs of obfuscation
        const obfuscationSigns = [
            code.length > 50000 && code.split('\n').length < 10, // Very long single line
            /[a-zA-Z_$][\w$]{50,}/.test(code), // Very long variable names
            /\\x[0-9a-f]{2}/gi.test(code), // Hex encoding
            /\\u[0-9a-f]{4}/gi.test(code), // Unicode encoding
            code.match(/[_$a-zA-Z]{1,2}/g)?.length > code.length / 100 // Many short variables
        ];
        
        return obfuscationSigns.filter(Boolean).length >= 2;
    }
    
    isMinified(code) {
        const lines = code.split('\n');
        const avgLineLength = code.length / lines.length;
        return lines.length < 10 && avgLineLength > 500;
    }
    
    findDangerousFunctions(code) {
        const dangerous = [];
        const patterns = {
            'eval()': /eval\s*\(/g,
            'Function()': /new\s+Function\s*\(/g,
            'child_process': /require\s*\(\s*['"]child_process['"]\s*\)/g,
            'fs.unlink': /fs\s*\.\s*unlink/g,
            'process.exit': /process\s*\.\s*exit/g
        };
        
        for (const [name, pattern] of Object.entries(patterns)) {
            if (pattern.test(code)) {
                dangerous.push(name);
            }
        }
        
        return dangerous;
    }
    
    findLineNumber(content, pattern) {
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (pattern.test(lines[i])) {
                return i + 1;
            }
        }
        return -1;
    }
    
    isTyposquatting(packageName) {
        // Check for common typosquatting patterns
        const popularPackages = [
            'react', 'express', 'lodash', 'axios', 'webpack',
            'typescript', 'vue', 'angular', 'jquery', 'bootstrap'
        ];
        
        for (const popular of popularPackages) {
            const distance = this.levenshteinDistance(packageName, popular);
            if (distance === 1 || distance === 2) {
                return true;
            }
        }
        
        return false;
    }
    
    levenshteinDistance(a, b) {
        const matrix = [];
        
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[b.length][a.length];
    }
    
    isUnusualVersion(version) {
        // Check for unusual version patterns
        return version.includes('file:') || 
               version.includes('git+') || 
               version.includes('github:') ||
               version === '*' ||
               version === 'latest';
    }
    
    async quarantinePackage(packagePath) {
        try {
            // Move to permanent quarantine with timestamp
            const quarantineName = path.basename(packagePath) + '-' + Date.now();
            const quarantinePath = path.join(this.quarantineDir, 'permanent', quarantineName);
            
            await fs.mkdir(path.dirname(quarantinePath), { recursive: true });
            await fs.rename(packagePath, quarantinePath);
            
            console.log(`   Package quarantined to ${quarantinePath}`);
            
        } catch (error) {
            // If can't move, just delete
            await fs.rm(packagePath, { recursive: true, force: true });
        }
    }
    
    async addToWhitelist(packageName) {
        this.whitelist.add(packageName);
        await this.saveLists();
        console.log(`✅ Added ${packageName} to whitelist`);
    }
    
    async addToBlacklist(packageName) {
        this.blacklist.add(packageName);
        await this.saveLists();
        console.log(`🚫 Added ${packageName} to blacklist`);
    }
    
    async saveLists() {
        await fs.writeFile(
            this.whitelistPath,
            JSON.stringify(Array.from(this.whitelist), null, 2)
        );
        
        await fs.writeFile(
            this.blacklistPath,
            JSON.stringify(Array.from(this.blacklist), null, 2)
        );
    }
    
    async generateSecurityReport() {
        const report = {
            timestamp: new Date().toISOString(),
            scannedPackages: this.riskScores.size,
            riskDistribution: {
                CRITICAL: 0,
                HIGH: 0,
                MEDIUM: 0,
                LOW: 0
            },
            blacklistedPackages: this.blacklist.size,
            whitelistedPackages: this.whitelist.size,
            detailedScans: []
        };
        
        for (const [pkg, score] of this.riskScores) {
            report.riskDistribution[score.level]++;
            report.detailedScans.push({
                package: pkg,
                ...score
            });
        }
        
        const reportPath = path.join(this.rootDir, 'clarity-security-report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`\n📊 Security report saved to ${reportPath}`);
        
        return report;
    }
}

// Export for use as module
module.exports = ClarityDefenseSystem;

// CLI interface
if (require.main === module) {
    const defense = new ClarityDefenseSystem();
    
    console.log('🛡️ CLARITY DEFENSE SYSTEM');
    console.log('========================\n');
    
    const command = process.argv[2];
    const args = process.argv.slice(3);
    
    async function run() {
        await defense.initialize();
        
        switch (command) {
            case 'scan':
                if (args[0]) {
                    const result = await defense.scanDependency(args[0], args[1] || 'latest');
                    console.log('\n📊 Scan Results:');
                    console.log(JSON.stringify(result, null, 2));
                } else {
                    console.log('Usage: node clarity-defense-system.js scan <package> [version]');
                }
                break;
                
            case 'whitelist':
                if (args[0]) {
                    await defense.addToWhitelist(args[0]);
                } else {
                    console.log('Usage: node clarity-defense-system.js whitelist <package>');
                }
                break;
                
            case 'blacklist':
                if (args[0]) {
                    await defense.addToBlacklist(args[0]);
                } else {
                    console.log('Usage: node clarity-defense-system.js blacklist <package>');
                }
                break;
                
            case 'report':
                const report = await defense.generateSecurityReport();
                console.log('\nRisk Distribution:');
                console.log(`  CRITICAL: ${report.riskDistribution.CRITICAL}`);
                console.log(`  HIGH: ${report.riskDistribution.HIGH}`);
                console.log(`  MEDIUM: ${report.riskDistribution.MEDIUM}`);
                console.log(`  LOW: ${report.riskDistribution.LOW}`);
                break;
                
            case 'scan-all':
                console.log('Scanning all dependencies from package.json...');
                try {
                    const packageJson = require(path.join(process.cwd(), 'package.json'));
                    const allDeps = {
                        ...packageJson.dependencies,
                        ...packageJson.devDependencies
                    };
                    
                    for (const [pkg, version] of Object.entries(allDeps)) {
                        await defense.scanDependency(pkg, version);
                    }
                    
                    await defense.generateSecurityReport();
                    
                } catch (error) {
                    console.error('Failed to scan dependencies:', error.message);
                }
                break;
                
            default:
                console.log('Available commands:');
                console.log('  scan <package> [version]  - Scan a specific package');
                console.log('  scan-all                  - Scan all dependencies');
                console.log('  whitelist <package>       - Add package to whitelist');
                console.log('  blacklist <package>       - Add package to blacklist');
                console.log('  report                    - Generate security report');
        }
    }
    
    run().catch(console.error);
}