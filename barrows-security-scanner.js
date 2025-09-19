#!/usr/bin/env node

/**
 * 🏺 BARROWS SECURITY SCANNER
 * Scans for booby traps and security vulnerabilities like checking Barrows crypts in OSRS
 * Detects hidden mechanisms, port conflicts, and dangerous code patterns
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const net = require('net');

class BarrowsSecurityScanner {
    constructor() {
        this.scannerId = crypto.randomUUID();
        this.trapDatabase = new Map();
        this.vulnerabilityMap = new Map();
        
        // BARROWS-style trap detection patterns
        this.trapPatterns = {
            // Port-based traps
            port_conflicts: [
                /listen\(\d+[^,)]*\)/g,
                /port.*=.*\d+/g,
                /:\d{4,5}/g
            ],
            
            // Hidden backdoors
            backdoors: [
                /eval\s*\(/g,
                /exec\s*\(/g,
                /spawn\s*\(/g,
                /child_process/g,
                /require\(['"]child_process['"]\)/g
            ],
            
            // Data exfiltration traps
            data_leaks: [
                /fetch\s*\(/g,
                /axios\./g,
                /http\.request/g,
                /\.post\s*\(/g,
                /\.get\s*\(/g,
                /websocket.*[^127\.0\.0\.1]/g
            ],
            
            // Memory corruption traps
            memory_traps: [
                /buffer\.alloc\(/g,
                /new\s+Buffer\(/g,
                /malloc\(/g,
                /free\(/g
            ],
            
            // Privilege escalation
            privilege_escalation: [
                /sudo/g,
                /setuid/g,
                /process\.setuid/g,
                /root/g,
                /admin/g
            ],
            
            // Time-based booby traps
            time_bombs: [
                /setTimeout.*\d{5,}/g,
                /setInterval.*\d{5,}/g,
                /Date\.now\(\).*>/g,
                /new Date\(\).*>/g
            ],
            
            // Resource exhaustion traps
            resource_bombs: [
                /while\s*\(\s*true\s*\)/g,
                /for\s*\(\s*;;\s*\)/g,
                /setInterval.*0\s*\)/g,
                /new Array\(\d{6,}\)/g
            ]
        };
        
        // Known safe patterns to exclude
        this.safePatterns = [
            /127\.0\.0\.1/g,        // Localhost only
            /localhost/g,           // Local connections
            /console\.log/g,        // Debug logging
            /JSON\.stringify/g,     // Data serialization
            /crypto\.randomUUID/g   // Secure random generation
        ];
        
        console.log(`🏺 Barrows Security Scanner initialized`);
        console.log(`🔍 Scanner ID: ${this.scannerId}`);
        console.log(`⚔️ Ready to detect booby traps and vulnerabilities`);
    }
    
    async scanSystem() {
        console.log('\n🏺 BARROWS SECURITY SCAN INITIATED');
        console.log('⚔️ Checking for booby traps and hidden mechanisms...\n');
        
        const scanResults = {
            scan_id: this.scannerId,
            timestamp: new Date().toISOString(),
            files_scanned: 0,
            traps_detected: 0,
            vulnerabilities_found: [],
            security_score: 0,
            recommendations: []
        };
        
        // Step 1: Scan current directory for suspicious files
        console.log('1. 🔍 Scanning directory for suspicious files...');
        const files = await this.findJavaScriptFiles('./');
        scanResults.files_scanned = files.length;
        
        // Step 2: Analyze each file for booby traps
        console.log('2. 🏺 Analyzing files for Barrows-style traps...');
        for (const file of files) {
            const fileTraps = await this.scanFileForTraps(file);
            if (fileTraps.length > 0) {
                scanResults.traps_detected += fileTraps.length;
                scanResults.vulnerabilities_found.push({
                    file: file,
                    traps: fileTraps
                });
            }
        }
        
        // Step 3: Check active ports for conflicts
        console.log('3. 🔌 Checking active ports for conflicts...');
        const portConflicts = await this.scanPortConflicts();
        if (portConflicts.length > 0) {
            scanResults.vulnerabilities_found.push({
                type: 'port_conflicts',
                conflicts: portConflicts
            });
        }
        
        // Step 4: Analyze memory usage patterns
        console.log('4. 🧠 Analyzing memory usage patterns...');
        const memoryIssues = this.scanMemoryPatterns();
        if (memoryIssues.length > 0) {
            scanResults.vulnerabilities_found.push({
                type: 'memory_issues',
                issues: memoryIssues
            });
        }
        
        // Step 5: Generate security score
        scanResults.security_score = this.calculateSecurityScore(scanResults);
        scanResults.recommendations = this.generateRecommendations(scanResults);
        
        this.displayScanResults(scanResults);
        return scanResults;
    }
    
    async findJavaScriptFiles(directory) {
        const files = [];
        
        const scanDir = (dir) => {
            try {
                const items = fs.readdirSync(dir);
                
                for (const item of items) {
                    const fullPath = path.join(dir, item);
                    const stats = fs.statSync(fullPath);
                    
                    if (stats.isDirectory()) {
                        // Skip node_modules and hidden directories
                        if (!item.startsWith('.') && item !== 'node_modules') {
                            scanDir(fullPath);
                        }
                    } else if (item.endsWith('.js') && !item.includes('node_modules')) {
                        files.push(fullPath);
                    }
                }
            } catch (error) {
                console.warn(`⚠️ Could not scan directory ${dir}: ${error.message}`);
            }
        };
        
        scanDir(directory);
        return files;
    }
    
    async scanFileForTraps(filePath) {
        const traps = [];
        
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const fileName = path.basename(filePath);
            
            console.log(`  🔍 Scanning ${fileName}...`);
            
            // Check each trap pattern category
            for (const [trapType, patterns] of Object.entries(this.trapPatterns)) {
                for (const pattern of patterns) {
                    const matches = content.match(pattern);
                    
                    if (matches && matches.length > 0) {
                        // Check if it's a false positive (safe pattern)
                        const isSafe = this.safePatterns.some(safePattern => 
                            matches.some(match => safePattern.test(match))
                        );
                        
                        if (!isSafe) {
                            traps.push({
                                type: trapType,
                                pattern: pattern.toString(),
                                matches: matches,
                                severity: this.calculateSeverity(trapType),
                                line_estimate: this.estimateLineNumbers(content, matches[0])
                            });
                        }
                    }
                }
            }
            
            // Special checks for specific files
            if (fileName.includes('apple') || fileName.includes('licensing')) {
                const appleTraps = this.scanAppleSpecificTraps(content);
                traps.push(...appleTraps);
            }
            
        } catch (error) {
            console.warn(`⚠️ Could not scan file ${filePath}: ${error.message}`);
        }
        
        return traps;
    }
    
    scanAppleSpecificTraps(content) {
        const traps = [];
        
        // Check for actual Apple credentials or sensitive data
        const sensitivePatterns = [
            /AAPL_.*[Kk]ey/g,
            /apple.*[Pp]assword/g,
            /developer.*[Tt]oken/g,
            /app.*store.*secret/g
        ];
        
        for (const pattern of sensitivePatterns) {
            const matches = content.match(pattern);
            if (matches) {
                traps.push({
                    type: 'sensitive_data_exposure',
                    pattern: pattern.toString(),
                    matches: matches,
                    severity: 'CRITICAL',
                    description: 'Potential Apple credentials or sensitive data detected'
                });
            }
        }
        
        return traps;
    }
    
    async scanPortConflicts() {
        console.log('  🔌 Checking ports 8880-9000 for conflicts...');
        const conflicts = [];
        
        // Check common ports used by our systems
        const portsToCheck = [8880, 8881, 8889, 7778, 9877, 3334, 3000, 3001, 3002, 8080, 8081];
        
        for (const port of portsToCheck) {
            const isInUse = await this.checkPortInUse(port);
            if (isInUse) {
                conflicts.push({
                    port: port,
                    status: 'IN_USE',
                    risk: 'Port conflict potential'
                });
            }
        }
        
        return conflicts;
    }
    
    checkPortInUse(port) {
        return new Promise((resolve) => {
            const server = net.createServer();
            
            server.listen(port, '127.0.0.1', () => {
                server.close(() => resolve(false)); // Port is available
            });
            
            server.on('error', () => {
                resolve(true); // Port is in use
            });
        });
    }
    
    scanMemoryPatterns() {
        const issues = [];
        
        // Check current memory usage
        const memUsage = process.memoryUsage();
        
        if (memUsage.heapUsed > 100 * 1024 * 1024) { // > 100MB
            issues.push({
                type: 'high_memory_usage',
                current_usage: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
                severity: 'MEDIUM'
            });
        }
        
        if (memUsage.external > 50 * 1024 * 1024) { // > 50MB external
            issues.push({
                type: 'high_external_memory',
                external_usage: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
                severity: 'LOW'
            });
        }
        
        return issues;
    }
    
    calculateSeverity(trapType) {
        const severityMap = {
            backdoors: 'CRITICAL',
            data_leaks: 'HIGH',
            privilege_escalation: 'CRITICAL',
            time_bombs: 'HIGH',
            resource_bombs: 'HIGH',
            port_conflicts: 'MEDIUM',
            memory_traps: 'MEDIUM'
        };
        
        return severityMap[trapType] || 'LOW';
    }
    
    estimateLineNumbers(content, match) {
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(match)) {
                return i + 1;
            }
        }
        return 'unknown';
    }
    
    calculateSecurityScore(results) {
        let score = 100; // Start with perfect score
        
        for (const vuln of results.vulnerabilities_found) {
            if (vuln.traps) {
                for (const trap of vuln.traps) {
                    switch (trap.severity) {
                        case 'CRITICAL':
                            score -= 25;
                            break;
                        case 'HIGH':
                            score -= 15;
                            break;
                        case 'MEDIUM':
                            score -= 10;
                            break;
                        case 'LOW':
                            score -= 5;
                            break;
                    }
                }
            }
        }
        
        return Math.max(0, score);
    }
    
    generateRecommendations(results) {
        const recommendations = [];
        
        if (results.traps_detected > 0) {
            recommendations.push('🔒 Review and secure all detected trap patterns');
            recommendations.push('🛡️ Implement input validation and sanitization');
            recommendations.push('🔍 Add security monitoring and alerting');
        }
        
        if (results.vulnerabilities_found.some(v => v.type === 'port_conflicts')) {
            recommendations.push('🔌 Implement dynamic port allocation to avoid conflicts');
            recommendations.push('📋 Document all port usage across services');
        }
        
        if (results.security_score < 80) {
            recommendations.push('⚔️ Immediate security audit recommended');
            recommendations.push('🏺 Consider implementing additional Barrows-style trap detection');
        }
        
        // Always recommend basic security practices
        recommendations.push('🔐 Use environment variables for sensitive configuration');
        recommendations.push('🌐 Ensure all network connections are localhost-only where appropriate');
        recommendations.push('📝 Implement comprehensive logging and monitoring');
        
        return recommendations;
    }
    
    displayScanResults(results) {
        console.log('\n🏺 BARROWS SECURITY SCAN COMPLETE');
        console.log('===============================================');
        console.log(`📊 Files Scanned: ${results.files_scanned}`);
        console.log(`⚠️ Traps Detected: ${results.traps_detected}`);
        console.log(`🛡️ Security Score: ${results.security_score}/100`);
        
        // Security rating
        let rating = '🔴 CRITICAL';
        if (results.security_score >= 90) rating = '🟢 EXCELLENT';
        else if (results.security_score >= 80) rating = '🟡 GOOD';
        else if (results.security_score >= 60) rating = '🟠 FAIR';
        
        console.log(`📈 Security Rating: ${rating}`);
        
        // Detailed vulnerabilities
        if (results.vulnerabilities_found.length > 0) {
            console.log('\n🚨 DETECTED VULNERABILITIES:');
            console.log('----------------------------');
            
            for (const vuln of results.vulnerabilities_found) {
                if (vuln.file) {
                    console.log(`\n📁 File: ${vuln.file}`);
                    for (const trap of vuln.traps) {
                        console.log(`  ⚠️ ${trap.type} (${trap.severity})`);
                        console.log(`    Pattern: ${trap.pattern}`);
                        console.log(`    Matches: ${trap.matches.length}`);
                        if (trap.line_estimate !== 'unknown') {
                            console.log(`    ~Line: ${trap.line_estimate}`);
                        }
                    }
                } else if (vuln.type === 'port_conflicts') {
                    console.log(`\n🔌 Port Conflicts:`);
                    for (const conflict of vuln.conflicts) {
                        console.log(`  Port ${conflict.port}: ${conflict.status}`);
                    }
                }
            }
        }
        
        // Recommendations
        if (results.recommendations.length > 0) {
            console.log('\n💡 SECURITY RECOMMENDATIONS:');
            console.log('-----------------------------');
            for (const rec of results.recommendations) {
                console.log(`  ${rec}`);
            }
        }
        
        console.log('\n🏺 Barrows Security Scan complete! Stay vigilant, adventurer!');
        console.log('===============================================\n');
    }
    
    // Quick scan specific file
    async quickScanFile(filePath) {
        console.log(`🔍 Quick scanning ${filePath} for booby traps...`);
        const traps = await this.scanFileForTraps(filePath);
        
        if (traps.length === 0) {
            console.log('✅ No booby traps detected in this file');
        } else {
            console.log(`⚠️ ${traps.length} potential traps detected:`);
            for (const trap of traps) {
                console.log(`  - ${trap.type} (${trap.severity}): ${trap.matches.length} matches`);
            }
        }
        
        return traps;
    }
}

// CLI interface
if (require.main === module) {
    const scanner = new BarrowsSecurityScanner();
    
    const args = process.argv.slice(2);
    
    if (args.length > 0 && args[0] === 'quick' && args[1]) {
        // Quick scan specific file
        scanner.quickScanFile(args[1]);
    } else {
        // Full system scan
        scanner.scanSystem().then(() => {
            console.log('🏺 Barrows Security Scanner shutting down safely');
            process.exit(0);
        }).catch(error => {
            console.error('❌ Security scan failed:', error);
            process.exit(1);
        });
    }
}

module.exports = BarrowsSecurityScanner;