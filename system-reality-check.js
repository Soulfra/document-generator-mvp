#!/usr/bin/env node

/**
 * System Reality Check
 * Shows what's actually working vs what's just impressive-looking files
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class SystemRealityCheck {
    constructor() {
        this.reality = {
            workingServices: [],
            brokenServices: [],
            workingDashboards: [],
            staticDashboards: [],
            workingSymlinks: 0,
            brokenSymlinks: 0,
            workingDatabases: [],
            brokenDatabases: [],
            actualProcesses: [],
            zombieProcesses: []
        };
    }

    async runCompleteCheck() {
        console.log('🔍 SYSTEM REALITY CHECK');
        console.log('=======================');
        console.log('What\'s actually working vs what\'s just sitting there...\n');
        
        await this.checkRunningProcesses();
        await this.checkDatabaseConnections();
        await this.checkSymlinkHealth();
        await this.checkDashboardStatus();
        await this.checkServiceRegistry();
        await this.generateRealityReport();
        
        console.log('✅ Reality check completed');
        return this.reality;
    }

    async checkRunningProcesses() {
        console.log('🔍 Checking what processes are actually running...');
        
        return new Promise((resolve) => {
            exec("ps aux | grep -E 'node.*\\.js|docker' | grep -v grep", (error, stdout) => {
                if (error) {
                    console.log('   ❌ No processes found');
                    resolve();
                    return;
                }
                
                const lines = stdout.split('\n').filter(line => line.trim());
                
                lines.forEach(line => {
                    const parts = line.trim().split(/\s+/);
                    const pid = parts[1];
                    const command = parts.slice(10).join(' ');
                    
                    if (command.includes('node') && command.includes('.js')) {
                        const scriptMatch = command.match(/node\s+([^\s]+\.js)/);
                        const script = scriptMatch ? path.basename(scriptMatch[1]) : 'unknown';
                        
                        const cpu = parseFloat(parts[2]);
                        const memory = parseFloat(parts[3]);
                        
                        if (cpu > 0.1 || memory > 0.1) {
                            this.reality.actualProcesses.push({
                                pid: parseInt(pid),
                                script: script,
                                cpu: cpu,
                                memory: memory,
                                status: 'active'
                            });
                            console.log(`   ✅ ACTIVE: ${script} (PID ${pid}, CPU: ${cpu}%, MEM: ${memory}%)`);
                        } else {
                            this.reality.zombieProcesses.push({
                                pid: parseInt(pid),
                                script: script,
                                cpu: cpu,
                                memory: memory,
                                status: 'zombie'
                            });
                            console.log(`   👻 ZOMBIE: ${script} (PID ${pid}, CPU: ${cpu}%, MEM: ${memory}%)`);
                        }
                    }
                });
                
                console.log(`   📊 Found ${this.reality.actualProcesses.length} active processes, ${this.reality.zombieProcesses.length} zombies`);
                resolve();
            });
        });
    }

    async checkDatabaseConnections() {
        console.log('\n🔍 Checking database connections...');
        
        // Check if we have connectivity reports
        const reportFiles = [
            'database-connectivity-report.json',
            'service-registry-report.json'
        ];
        
        for (const reportFile of reportFiles) {
            const reportPath = path.join(__dirname, reportFile);
            if (fs.existsSync(reportPath)) {
                try {
                    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
                    
                    if (reportFile === 'database-connectivity-report.json') {
                        Object.entries(report.results).forEach(([dbName, result]) => {
                            if (result.connected) {
                                this.reality.workingDatabases.push({
                                    name: dbName,
                                    status: 'connected',
                                    details: result.details
                                });
                                console.log(`   ✅ WORKING: ${dbName} - Connected successfully`);
                            } else {
                                this.reality.brokenDatabases.push({
                                    name: dbName,
                                    status: 'failed',
                                    error: result.error
                                });
                                console.log(`   ❌ BROKEN: ${dbName} - ${result.error}`);
                            }
                        });
                    }
                } catch (error) {
                    console.log(`   ⚠️  Could not parse ${reportFile}: ${error.message}`);
                }
            }
        }
    }

    async checkSymlinkHealth() {
        console.log('\n🔍 Checking symlink health...');
        
        const healthReportPath = path.join(__dirname, 'symlink-health-report.json');
        if (fs.existsSync(healthReportPath)) {
            try {
                const report = JSON.parse(fs.readFileSync(healthReportPath, 'utf8'));
                
                this.reality.workingSymlinks = report.summary.healthySymlinks || 0;
                this.reality.brokenSymlinks = report.summary.skippedSymlinks || 0;
                
                console.log(`   ✅ WORKING: ${this.reality.workingSymlinks} healthy symlinks`);
                console.log(`   ❌ BROKEN: ${this.reality.brokenSymlinks} broken symlinks`);
                console.log(`   📊 Health Score: ${Math.round((this.reality.workingSymlinks / (this.reality.workingSymlinks + this.reality.brokenSymlinks)) * 100)}%`);
                
            } catch (error) {
                console.log(`   ⚠️  Could not parse symlink health report: ${error.message}`);
            }
        } else {
            console.log('   ⚠️  No symlink health report found');
        }
    }

    async checkDashboardStatus() {
        console.log('\n🔍 Checking dashboard status...');
        
        const dashboards = [
            'unified-live-dashboard.html',
            'meta-verification-overlay.html',
            'jarvis-hud-overlay.html',
            'dashboard.html',
            'visual-dashboard.html'
        ];
        
        for (const dashboard of dashboards) {
            const dashboardPath = path.join(__dirname, dashboard);
            if (fs.existsSync(dashboardPath)) {
                const stats = fs.statSync(dashboardPath);
                const content = fs.readFileSync(dashboardPath, 'utf8');
                
                // Check if dashboard has WebSocket connections or API calls
                const hasWebSocket = content.includes('WebSocket') || content.includes('ws://');
                const hasAPICall = content.includes('fetch(') || content.includes('xhr');
                const hasJavaScript = content.includes('<script>') && content.includes('</script>');
                
                if (hasWebSocket || hasAPICall) {
                    this.reality.workingDashboards.push({
                        name: dashboard,
                        size: stats.size,
                        hasWebSocket: hasWebSocket,
                        hasAPICall: hasAPICall,
                        status: 'interactive'
                    });
                    console.log(`   ✅ INTERACTIVE: ${dashboard} (${this.formatBytes(stats.size)})`);
                } else if (hasJavaScript) {
                    this.reality.staticDashboards.push({
                        name: dashboard,
                        size: stats.size,
                        status: 'static_with_js'
                    });
                    console.log(`   📊 STATIC+JS: ${dashboard} (${this.formatBytes(stats.size)})`);
                } else {
                    this.reality.staticDashboards.push({
                        name: dashboard,
                        size: stats.size,
                        status: 'static_html'
                    });
                    console.log(`   📄 STATIC HTML: ${dashboard} (${this.formatBytes(stats.size)})`);
                }
            }
        }
    }

    async checkServiceRegistry() {
        console.log('\n🔍 Checking service registry status...');
        
        const registryPath = path.join(__dirname, 'service-registry-report.json');
        if (fs.existsSync(registryPath)) {
            try {
                const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
                
                if (registry.runningServices) {
                    registry.runningServices.forEach(service => {
                        if (service.status === 'running' && service.pid) {
                            this.reality.workingServices.push({
                                name: service.name,
                                pid: service.pid,
                                startTime: service.startTime,
                                status: 'running'
                            });
                            console.log(`   ✅ RUNNING: ${service.name} (PID ${service.pid})`);
                        } else {
                            this.reality.brokenServices.push({
                                name: service.name,
                                status: service.status || 'unknown',
                                error: 'Not running or no PID'
                            });
                            console.log(`   ❌ BROKEN: ${service.name} (${service.status})`);
                        }
                    });
                }
                
                if (registry.status && registry.status.services) {
                    Object.entries(registry.status.services).forEach(([name, info]) => {
                        if (!info.running) {
                            this.reality.brokenServices.push({
                                name: name,
                                status: 'not_running',
                                required: info.required
                            });
                            console.log(`   ❌ NOT RUNNING: ${name} (required: ${info.required})`);
                        }
                    });
                }
                
            } catch (error) {
                console.log(`   ⚠️  Could not parse service registry: ${error.message}`);
            }
        } else {
            console.log('   ⚠️  No service registry report found');
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    async generateRealityReport() {
        console.log('\n📊 Generating reality report...');
        
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                actuallyWorking: {
                    processes: this.reality.actualProcesses.length,
                    databases: this.reality.workingDatabases.length,
                    dashboards: this.reality.workingDashboards.length,
                    services: this.reality.workingServices.length,
                    symlinks: this.reality.workingSymlinks
                },
                justSittingThere: {
                    zombieProcesses: this.reality.zombieProcesses.length,
                    brokenDatabases: this.reality.brokenDatabases.length,
                    staticDashboards: this.reality.staticDashboards.length,
                    brokenServices: this.reality.brokenServices.length,
                    brokenSymlinks: this.reality.brokenSymlinks
                }
            },
            detailed: this.reality,
            verdict: this.generateVerdict(),
            recommendations: this.generateRecommendations()
        };
        
        const reportPath = path.join(__dirname, 'system-reality-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`   📄 Report saved to: ${reportPath}`);
        this.printSummary(report);
        
        return report;
    }

    generateVerdict() {
        const working = this.reality.actualProcesses.length + 
                       this.reality.workingDatabases.length + 
                       this.reality.workingDashboards.length + 
                       this.reality.workingServices.length;
        
        const broken = this.reality.zombieProcesses.length + 
                      this.reality.brokenDatabases.length + 
                      this.reality.staticDashboards.length + 
                      this.reality.brokenServices.length;
        
        const total = working + broken;
        const workingPercentage = total > 0 ? Math.round((working / total) * 100) : 0;
        
        if (workingPercentage >= 80) {
            return '🎉 IMPRESSIVE AND FUNCTIONAL - Most things actually work!';
        } else if (workingPercentage >= 60) {
            return '👍 DECENT FUNCTIONALITY - Some things work, others need fixing';
        } else if (workingPercentage >= 40) {
            return '⚠️ MIXED BAG - Equal parts working and broken';
        } else if (workingPercentage >= 20) {
            return '😞 MOSTLY BROKEN - Few things actually work';
        } else {
            return '💀 SMOKE AND MIRRORS - Looks impressive but barely functional';
        }
    }

    generateRecommendations() {
        const recommendations = [];
        
        if (this.reality.zombieProcesses.length > 0) {
            recommendations.push(`Kill ${this.reality.zombieProcesses.length} zombie processes using pkill`);
        }
        
        if (this.reality.brokenDatabases.length > 0) {
            recommendations.push('Fix database connections - especially PostgreSQL authentication');
        }
        
        if (this.reality.staticDashboards.length > this.reality.workingDashboards.length) {
            recommendations.push('Convert static dashboards to live dashboards with WebSocket feeds');
        }
        
        if (this.reality.brokenSymlinks > this.reality.workingSymlinks * 0.1) {
            recommendations.push('Run symlink health check and repair broken links');
        }
        
        if (this.reality.brokenServices.length > this.reality.workingServices.length) {
            recommendations.push('Start required services using the unified service registry');
        }
        
        if (recommendations.length === 0) {
            recommendations.push('System is in good shape - focus on optimization and monitoring');
        }
        
        return recommendations;
    }

    printSummary(report) {
        console.log('\n🎯 SYSTEM REALITY SUMMARY');
        console.log('=========================');
        
        console.log('\n✅ ACTUALLY WORKING:');
        console.log(`   🟢 Active Processes: ${report.summary.actuallyWorking.processes}`);
        console.log(`   🟢 Database Connections: ${report.summary.actuallyWorking.databases}`);
        console.log(`   🟢 Interactive Dashboards: ${report.summary.actuallyWorking.dashboards}`);
        console.log(`   🟢 Running Services: ${report.summary.actuallyWorking.services}`);
        console.log(`   🟢 Healthy Symlinks: ${report.summary.actuallyWorking.symlinks}`);
        
        console.log('\n❌ JUST SITTING THERE:');
        console.log(`   🔴 Zombie Processes: ${report.summary.justSittingThere.zombieProcesses}`);
        console.log(`   🔴 Broken Databases: ${report.summary.justSittingThere.brokenDatabases}`);
        console.log(`   🔴 Static Dashboards: ${report.summary.justSittingThere.staticDashboards}`);
        console.log(`   🔴 Broken Services: ${report.summary.justSittingThere.brokenServices}`);
        console.log(`   🔴 Broken Symlinks: ${report.summary.justSittingThere.brokenSymlinks}`);
        
        console.log(`\n🏆 VERDICT: ${report.verdict}`);
        
        console.log('\n💡 RECOMMENDATIONS:');
        report.recommendations.forEach(rec => {
            console.log(`   • ${rec}`);
        });
    }
}

// Run if called directly
if (require.main === module) {
    const checker = new SystemRealityCheck();
    
    checker.runCompleteCheck().then(() => {
        console.log('\n🎯 Reality Check Complete!');
        console.log('   📄 Check system-reality-report.json for full details');
        console.log('   🔧 Follow recommendations to improve functionality');
        
        process.exit(0);
    }).catch(console.error);
}

module.exports = SystemRealityCheck;