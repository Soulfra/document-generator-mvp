#!/usr/bin/env node

/**
 * Symlink Health Monitor & Repair System
 * Scans all symlinks, fixes broken ones, creates missing directories
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class SymlinkHealthMonitor {
    constructor() {
        this.totalSymlinks = 0;
        this.brokenSymlinks = [];
        this.fixedSymlinks = [];
        this.skippedSymlinks = [];
        this.symlinkMap = new Map();
    }

    async initialize() {
        console.log('🔗 Symlink Health Monitor & Repair System');
        console.log('==========================================');
        
        await this.scanAllSymlinks();
        await this.identifyBrokenSymlinks();
        await this.repairSymlinks();
        await this.generateSymlinkReport();
        
        console.log('✅ Symlink health check completed');
        return this;
    }

    async scanAllSymlinks() {
        console.log('🔍 Scanning for all symlinks...');
        
        const findSymlinks = () => {
            return new Promise((resolve) => {
                exec('find . -type l', (error, stdout) => {
                    if (error) {
                        console.log('Error finding symlinks:', error.message);
                        resolve([]);
                        return;
                    }
                    
                    const symlinks = stdout.split('\n')
                        .filter(line => line.trim())
                        .map(link => link.trim());
                    
                    resolve(symlinks);
                });
            });
        };
        
        const symlinks = await findSymlinks();
        this.totalSymlinks = symlinks.length;
        
        console.log(`   Found ${this.totalSymlinks} symlinks to check`);
        
        // Build symlink map
        for (const symlinkPath of symlinks) {
            try {
                const target = fs.readlinkSync(symlinkPath);
                const absoluteTarget = path.resolve(path.dirname(symlinkPath), target);
                
                this.symlinkMap.set(symlinkPath, {
                    target: target,
                    absoluteTarget: absoluteTarget,
                    exists: fs.existsSync(absoluteTarget),
                    isValid: fs.existsSync(symlinkPath) // This checks if symlink resolves
                });
            } catch (error) {
                this.symlinkMap.set(symlinkPath, {
                    target: null,
                    absoluteTarget: null,
                    exists: false,
                    isValid: false,
                    error: error.message
                });
            }
        }
    }

    async identifyBrokenSymlinks() {
        console.log('\n🔍 Identifying broken symlinks...');
        
        this.symlinkMap.forEach((info, symlinkPath) => {
            if (!info.isValid || !info.exists) {
                this.brokenSymlinks.push({
                    path: symlinkPath,
                    target: info.target,
                    absoluteTarget: info.absoluteTarget,
                    reason: !info.exists ? 'target_missing' : 'symlink_broken',
                    error: info.error
                });
            }
        });
        
        console.log(`   Found ${this.brokenSymlinks.length} broken symlinks`);
        
        // Group by reason
        const reasons = {};
        this.brokenSymlinks.forEach(broken => {
            const reason = broken.reason;
            if (!reasons[reason]) reasons[reason] = [];
            reasons[reason].push(broken);
        });
        
        Object.entries(reasons).forEach(([reason, links]) => {
            console.log(`   📊 ${reason}: ${links.length} symlinks`);
        });
    }

    async repairSymlinks() {
        console.log('\n🔧 Repairing broken symlinks...');
        
        if (this.brokenSymlinks.length === 0) {
            console.log('   ✅ No broken symlinks to repair');
            return;
        }
        
        for (const broken of this.brokenSymlinks) {
            const repairResult = await this.repairSymlink(broken);
            
            if (repairResult.success) {
                this.fixedSymlinks.push(broken);
                console.log(`   ✅ Fixed: ${broken.path}`);
            } else {
                this.skippedSymlinks.push(broken);
                console.log(`   ⚠️  Skipped: ${broken.path} (${repairResult.reason})`);
            }
        }
        
        console.log(`   📊 Fixed: ${this.fixedSymlinks.length}, Skipped: ${this.skippedSymlinks.length}`);
    }

    async repairSymlink(broken) {
        try {
            // Strategy 1: Try to create missing target directory/file
            if (broken.reason === 'target_missing' && broken.absoluteTarget) {
                const targetDir = path.dirname(broken.absoluteTarget);
                
                // If target looks like a directory path, try to create it
                if (broken.target.endsWith('/') || !path.extname(broken.absoluteTarget)) {
                    try {
                        fs.mkdirSync(broken.absoluteTarget, { recursive: true });
                        return { success: true, method: 'created_directory' };
                    } catch (error) {
                        // Fall through to other strategies
                    }
                }
                
                // If target looks like a file, try to create parent directory
                try {
                    fs.mkdirSync(targetDir, { recursive: true });
                    
                    // Try to find a similar file in the project
                    const targetName = path.basename(broken.absoluteTarget);
                    const similarFile = await this.findSimilarFile(targetName);
                    
                    if (similarFile) {
                        // Remove broken symlink and create new one
                        fs.unlinkSync(broken.path);
                        fs.symlinkSync(path.relative(path.dirname(broken.path), similarFile), broken.path);
                        return { success: true, method: 'repointed_to_similar' };
                    }
                    
                } catch (error) {
                    // Fall through
                }
            }
            
            // Strategy 2: Remove if it's clearly invalid
            if (broken.path.includes('node_modules') || 
                broken.path.includes('.git/') || 
                broken.target && broken.target.includes('node_modules')) {
                
                fs.unlinkSync(broken.path);
                return { success: true, method: 'removed_invalid' };
            }
            
            // Strategy 3: Try to find the target in common locations
            if (broken.target) {
                const targetName = path.basename(broken.target);
                const possibleLocations = [
                    path.join('.', targetName),
                    path.join('./src', targetName),
                    path.join('./lib', targetName),
                    path.join('./scripts', targetName),
                    path.join('./services', targetName)
                ];
                
                for (const location of possibleLocations) {
                    if (fs.existsSync(location)) {
                        fs.unlinkSync(broken.path);
                        fs.symlinkSync(path.relative(path.dirname(broken.path), location), broken.path);
                        return { success: true, method: 'found_relocated' };
                    }
                }
            }
            
            return { success: false, reason: 'no_repair_strategy' };
            
        } catch (error) {
            return { success: false, reason: error.message };
        }
    }

    async findSimilarFile(targetName) {
        try {
            const result = await new Promise((resolve) => {
                exec(`find . -name "${targetName}" -type f | head -1`, (error, stdout) => {
                    if (error || !stdout.trim()) {
                        resolve(null);
                        return;
                    }
                    resolve(stdout.trim());
                });
            });
            
            return result;
        } catch (error) {
            return null;
        }
    }

    async generateSymlinkReport() {
        console.log('\n📊 Generating symlink health report...');
        
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalSymlinks: this.totalSymlinks,
                brokenSymlinks: this.brokenSymlinks.length,
                fixedSymlinks: this.fixedSymlinks.length,
                skippedSymlinks: this.skippedSymlinks.length,
                healthySymlinks: this.totalSymlinks - this.brokenSymlinks.length
            },
            brokenSymlinks: this.brokenSymlinks.map(broken => ({
                path: broken.path,
                target: broken.target,
                reason: broken.reason,
                error: broken.error
            })),
            fixedSymlinks: this.fixedSymlinks.map(fixed => ({
                path: fixed.path,
                target: fixed.target,
                repairMethod: 'auto_repair'
            })),
            recommendations: this.generateRecommendations()
        };
        
        // Save report
        const reportPath = path.join(__dirname, 'symlink-health-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`   📄 Report saved to: ${reportPath}`);
        console.log(`   📊 Health Score: ${Math.round((report.summary.healthySymlinks / report.summary.totalSymlinks) * 100)}%`);
        
        // Print summary
        console.log('\n📈 Symlink Health Summary:');
        console.log(`   ✅ Healthy: ${report.summary.healthySymlinks}`);
        console.log(`   🔧 Fixed: ${report.summary.fixedSymlinks}`);
        console.log(`   ⚠️  Still Broken: ${report.summary.skippedSymlinks}`);
        console.log(`   📊 Total: ${report.summary.totalSymlinks}`);
        
        return report;
    }

    generateRecommendations() {
        const recommendations = [];
        
        if (this.skippedSymlinks.length > 0) {
            recommendations.push('Review skipped symlinks manually - they may point to important missing files');
        }
        
        if (this.brokenSymlinks.length > 100) {
            recommendations.push('Consider implementing automated symlink management system');
        }
        
        const nodeModulesSymlinks = this.brokenSymlinks.filter(b => 
            b.path.includes('node_modules') || (b.target && b.target.includes('node_modules'))
        );
        
        if (nodeModulesSymlinks.length > 0) {
            recommendations.push('Run npm install to fix node_modules symlinks');
        }
        
        return recommendations;
    }

    async createSymlinkMonitor() {
        console.log('\n👁️  Creating symlink monitor service...');
        
        const monitorScript = `#!/usr/bin/env node

/**
 * Symlink Monitor Service
 * Runs periodic symlink health checks
 */

const SymlinkHealthMonitor = require('./fix-symlinks');

class SymlinkMonitorService {
    constructor() {
        this.monitor = new SymlinkHealthMonitor();
        this.checkInterval = 10 * 60 * 1000; // 10 minutes
        this.running = false;
    }
    
    async start() {
        console.log('🔗 Starting Symlink Monitor Service');
        this.running = true;
        
        // Initial check
        await this.monitor.initialize();
        
        // Periodic checks
        setInterval(async () => {
            if (this.running) {
                console.log('\\n🔄 Running periodic symlink health check...');
                await this.monitor.initialize();
            }
        }, this.checkInterval);
        
        console.log('✅ Symlink Monitor Service started');
    }
    
    stop() {
        this.running = false;
        console.log('🛑 Symlink Monitor Service stopped');
    }
}

if (require.main === module) {
    const service = new SymlinkMonitorService();
    service.start().catch(console.error);
    
    process.on('SIGINT', () => {
        service.stop();
        process.exit(0);
    });
}

module.exports = SymlinkMonitorService;
`;
        
        const monitorPath = path.join(__dirname, 'symlink-monitor-service.js');
        fs.writeFileSync(monitorPath, monitorScript);
        
        console.log(`   📄 Monitor service created: ${monitorPath}`);
    }
}

// Run if called directly
if (require.main === module) {
    const monitor = new SymlinkHealthMonitor();
    
    monitor.initialize().then(async () => {
        await monitor.createSymlinkMonitor();
        
        console.log('\n🎯 Next Steps:');
        console.log('   1. Review symlink-health-report.json');
        console.log('   2. Start symlink-monitor-service.js for ongoing monitoring');
        console.log('   3. Test database connectivity');
        console.log('   4. Create unified service registry');
        
        process.exit(0);
    }).catch(console.error);
}

module.exports = SymlinkHealthMonitor;