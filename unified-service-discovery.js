#!/usr/bin/env node


/**
 * 🔍 UNIFIED SERVICE DISCOVERY
 * Finally - map what we ACTUALLY have instead of rebuilding!
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const axios = require('axios');

class UnifiedServiceDiscovery {
    constructor() {
        this.basePath = '/Users/matthewmauer/Desktop/Document-Generator';
        this.services = new Map();
        this.launchers = new Map();
        this.infrastructure = new Map();
        this.gamesPlatforms = new Map();
        
        console.log('🔍 UNIFIED SERVICE DISCOVERY');
        console.log('============================');
        console.log('Mapping ALL existing systems...');
    }
    
    async discover() {
        // Discover core infrastructure
        await this.discoverInfrastructure();
        
        // Discover existing launchers
        await this.discoverLaunchers();
        
        // Discover running services
        await this.discoverRunningServices();
        
        // Discover gaming platforms
        await this.discoverGamingPlatforms();
        
        // Discover AI/Enterprise systems
        await this.discoverAIEcosystems();
        
        return this.generateReport();
    }
    
    async discoverInfrastructure() {
        console.log('\n📦 Discovering Infrastructure...');
        
        // Check Docker Compose configurations
        const dockerFiles = [
            'docker-compose.yml',
            'docker-compose.production.yml',
            'FinishThisIdea/docker-compose.yml',
            'FinishThisIdea/docker-compose.unified.yml',
            'FinishThisIdea/docker-compose.multistack.yml'
        ];
        
        for (const file of dockerFiles) {
            const fullPath = path.join(this.basePath, file);
            try {
                await fs.access(fullPath);
                const content = await fs.readFile(fullPath, 'utf8');
                this.infrastructure.set(file, {
                    path: fullPath,
                    status: 'available',
                    services: this.parseDockerServices(content)
                });
                console.log(`  ✅ Found: ${file}`);
            } catch (error) {
                // File doesn't exist, skip
            }
        }
        
        // Check nginx configurations
        const nginxFiles = ['nginx.conf', 'nginx.gaming.conf'];
        for (const file of nginxFiles) {
            const fullPath = path.join(this.basePath, file);
            try {
                await fs.access(fullPath);
                this.infrastructure.set(file, {
                    path: fullPath,
                    status: 'available',
                    type: 'nginx-config'
                });
                console.log(`  ✅ Found: ${file}`);
            } catch (error) {
                // File doesn't exist, skip
            }
        }
        
        // Check Master System Controller
        try {
            const response = await axios.get('http://localhost:9999/api/status', { timeout: 2000 });
            this.infrastructure.set('master-controller', {
                port: 9999,
                status: 'running',
                health: response.data,
                url: 'http://localhost:9999'
            });
            console.log('  ✅ Master System Controller: RUNNING');
        } catch (error) {
            this.infrastructure.set('master-controller', {
                port: 9999,
                status: 'stopped',
                path: path.join(this.basePath, 'master-system-controller.js')
            });
            console.log('  ⚠️  Master System Controller: STOPPED');
        }
    }
    
    async discoverLaunchers() {
        console.log('\n🚀 Discovering Existing Launchers...');
        
        const searchDirs = [
            'FinishThisIdea',
            '.',
        ];
        
        for (const dir of searchDirs) {
            const fullPath = path.join(this.basePath, dir);
            await this.scanForLaunchers(fullPath, dir);
        }
        
        console.log(`  📊 Found ${this.launchers.size} launcher scripts`);
    }
    
    async scanForLaunchers(dirPath, relativePath) {
        try {
            const files = await fs.readdir(dirPath);
            
            for (const file of files) {
                if (file.startsWith('launch-') && file.endsWith('.sh')) {
                    const fullPath = path.join(dirPath, file);
                    const stats = await fs.stat(fullPath);
                    
                    if (stats.isFile()) {
                        this.launchers.set(file, {
                            path: fullPath,
                            directory: relativePath,
                            lastModified: stats.mtime,
                            executable: stats.mode & 0o111
                        });
                    }
                }
            }
        } catch (error) {
            // Directory doesn't exist or can't read, skip
        }
    }
    
    async discoverRunningServices() {
        console.log('\n🔍 Discovering Running Services...');
        
        // Known ports to check
        const knownPorts = [
            3000, 3001, 3002, 3003, 4000, 4444, 5000, 5432, 6379,
            7000, 7090, 7100, 7300, 8000, 8080, 8081, 8085, 8800,
            9000, 9001, 9090, 9200, 9999, 11434
        ];
        
        for (const port of knownPorts) {
            try {
                const response = await axios.get(`http://localhost:${port}/health`, { 
                    timeout: 1000,
                    validateStatus: () => true 
                });
                
                this.services.set(`port-${port}`, {
                    port,
                    status: 'running',
                    health: response.status < 400 ? 'healthy' : 'unhealthy',
                    data: response.data,
                    url: `http://localhost:${port}`
                });
                
                console.log(`  ✅ Port ${port}: ${response.status < 400 ? 'HEALTHY' : 'UNHEALTHY'}`);
                
            } catch (error) {
                // Try basic connection
                try {
                    await axios.get(`http://localhost:${port}`, { timeout: 500 });
                    this.services.set(`port-${port}`, {
                        port,
                        status: 'running',
                        health: 'unknown',
                        url: `http://localhost:${port}`
                    });
                    console.log(`  ⚡ Port ${port}: RUNNING (no health endpoint)`);
                } catch (innerError) {
                    // Port not responding
                }
            }
        }
    }
    
    async discoverGamingPlatforms() {
        console.log('\n🎮 Discovering Gaming Platforms...');
        
        const gamingFiles = [
            'WORKING-GAMING-ENGINE.js',
            'WORKING-PERSISTENT-TYCOON.js',
            'GAMING-PLATFORM-STATUS.html',
            'MASTER-GAMING-PLATFORM.js',
            'FinishThisIdea/game-master-system.js',
            'FinishThisIdea/gaming-engine-bridge.js'
        ];
        
        for (const file of gamingFiles) {
            const fullPath = path.join(this.basePath, file);
            try {
                await fs.access(fullPath);
                this.gamesPlatforms.set(file, {
                    path: fullPath,
                    status: 'available',
                    type: 'gaming-component'
                });
                console.log(`  ✅ Found: ${file}`);
            } catch (error) {
                // File doesn't exist, skip
            }
        }
    }
    
    async discoverAIEcosystems() {
        console.log('\n🤖 Discovering AI Ecosystems...');
        
        // Check FinishThisIdea for AI systems
        const aiPatterns = [
            'ai-ecosystem',
            'enterprise-platform',
            'master-platform',
            'complete-system',
            'unified-system'
        ];
        
        const finishThisIdeaPath = path.join(this.basePath, 'FinishThisIdea');
        try {
            const files = await fs.readdir(finishThisIdeaPath);
            
            for (const file of files) {
                for (const pattern of aiPatterns) {
                    if (file.toLowerCase().includes(pattern)) {
                        const fullPath = path.join(finishThisIdeaPath, file);
                        const stats = await fs.stat(fullPath);
                        
                        if (stats.isFile()) {
                            this.services.set(file, {
                                path: fullPath,
                                type: 'ai-ecosystem',
                                lastModified: stats.mtime,
                                size: stats.size
                            });
                        }
                    }
                }
            }
        } catch (error) {
            console.log('  ⚠️  Could not scan FinishThisIdea directory');
        }
        
        console.log(`  📊 Found ${Array.from(this.services.values()).filter(s => s.type === 'ai-ecosystem').length} AI ecosystem components`);
    }
    
    parseDockerServices(content) {
        const services = [];
        const lines = content.split('\n');
        let currentService = null;
        
        for (const line of lines) {
            const trimmed = line.trim();
            
            if (trimmed.match(/^\w+[-\w]*:$/) && !trimmed.includes('version:') && !trimmed.includes('networks:') && !trimmed.includes('volumes:')) {
                currentService = trimmed.replace(':', '');
                services.push(currentService);
            }
        }
        
        return services;
    }
    
    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                infrastructure: this.infrastructure.size,
                launchers: this.launchers.size,
                runningServices: this.services.size,
                gamingPlatforms: this.gamesPlatforms.size
            },
            infrastructure: Object.fromEntries(this.infrastructure),
            launchers: Object.fromEntries(this.launchers),
            services: Object.fromEntries(this.services),
            gaming: Object.fromEntries(this.gamesPlatforms),
            recommendations: this.generateRecommendations()
        };
        
        return report;
    }
    
    generateRecommendations() {
        const recommendations = [];
        
        // Check if Master Controller is running
        const masterController = this.infrastructure.get('master-controller');
        if (masterController?.status === 'stopped') {
            recommendations.push({
                type: 'critical',
                message: 'Start Master System Controller for unified orchestration',
                action: 'node master-system-controller.js'
            });
        }
        
        // Check for Docker infrastructure
        if (this.infrastructure.has('docker-compose.yml')) {
            recommendations.push({
                type: 'infrastructure',
                message: 'Use existing Docker Compose for infrastructure',
                action: 'docker-compose up -d'
            });
        }
        
        // Check for existing launchers
        if (this.launchers.size > 0) {
            recommendations.push({
                type: 'optimization',
                message: `Found ${this.launchers.size} existing launchers - use instead of rebuilding`,
                action: 'Review launch-*.sh scripts in FinishThisIdea/'
            });
        }
        
        return recommendations;
    }
}

// CLI interface
if (require.main === module) {
    const discovery = new UnifiedServiceDiscovery();
    
    discovery.discover().then(report => {
        console.log('\n📊 DISCOVERY COMPLETE');
        console.log('====================');
        console.log(`Infrastructure components: ${report.summary.infrastructure}`);
        console.log(`Existing launchers: ${report.summary.launchers}`);
        console.log(`Running services: ${report.summary.runningServices}`);
        console.log(`Gaming platforms: ${report.summary.gamingPlatforms}`);
        
        // Save report
        const reportPath = path.join(__dirname, 'service-discovery-report.json');
        fs.writeFile(reportPath, JSON.stringify(report, null, 2))
            .then(() => console.log(`\n💾 Report saved: ${reportPath}`))
            .catch(console.error);
        
        // Show recommendations
        if (report.recommendations.length > 0) {
            console.log('\n💡 RECOMMENDATIONS');
            console.log('==================');
            report.recommendations.forEach((rec, i) => {
                console.log(`${i + 1}. [${rec.type.toUpperCase()}] ${rec.message}`);
                console.log(`   Action: ${rec.action}\n`);
            });
        }
        
    }).catch(console.error);
}

module.exports = UnifiedServiceDiscovery;