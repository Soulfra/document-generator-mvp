#!/usr/bin/env node

/**
 * Real Connection Mapper
 * Actually tests what's connected vs what's just files sitting there
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const { URL } = require('url');

class RealConnectionMapper {
    constructor() {
        this.codebaseRoot = '/Users/matthewmauer/Desktop/Document-Generator';
        this.connections = new Map();
        this.services = new Map();
        this.files = [];
        this.realConnections = [];
        this.brokenConnections = [];
        
        console.log('🔍 Real Connection Mapper Starting...');
        console.log('🎯 Mission: Find what actually connects vs what just exists');
    }

    async scanCodebase() {
        console.log('\n📊 Scanning codebase for actual connections...');
        
        const files = fs.readdirSync(this.codebaseRoot);
        
        // Get all relevant files
        files.forEach(file => {
            if (file.endsWith('.html') || file.endsWith('.js') || file.endsWith('.json')) {
                const filePath = path.join(this.codebaseRoot, file);
                try {
                    const content = fs.readFileSync(filePath, 'utf8');
                    this.files.push({
                        name: file,
                        path: filePath,
                        content,
                        size: content.length,
                        connections: this.findConnectionsInFile(content)
                    });
                } catch (error) {
                    // Skip files we can't read
                }
            }
        });
        
        console.log(`✅ Scanned ${this.files.length} files`);
    }

    findConnectionsInFile(content) {
        const connections = {
            fileReferences: [],      // src="file.html", href="file.js"
            apiCalls: [],           // fetch(), axios(), XMLHttpRequest
            websockets: [],         // WebSocket connections
            iframes: [],            // iframe src
            imports: [],            // import, require
            databases: [],          // database connections
            ports: [],              // localhost:3000, :8080
            services: []            // service references
        };
        
        // File references
        const fileRefs = content.match(/(src|href)=["']([^"']+)["']/g) || [];
        fileRefs.forEach(ref => {
            const match = ref.match(/(src|href)=["']([^"']+)["']/);
            if (match && !match[2].startsWith('http') && !match[2].startsWith('data:')) {
                connections.fileReferences.push(match[2]);
            }
        });
        
        // API calls
        const apiPatterns = [
            /fetch\s*\(\s*["']([^"']+)["']/g,
            /axios\.[a-z]+\s*\(\s*["']([^"']+)["']/g,
            /\.open\s*\(\s*["'][A-Z]+["']\s*,\s*["']([^"']+)["']/g
        ];
        
        apiPatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                connections.apiCalls.push(match[1]);
            }
        });
        
        // WebSocket connections
        const wsPattern = /new\s+WebSocket\s*\(\s*["']([^"']+)["']/g;
        let wsMatch;
        while ((wsMatch = wsPattern.exec(content)) !== null) {
            connections.websockets.push(wsMatch[1]);
        }
        
        // Iframe sources
        const iframePattern = /<iframe[^>]+src=["']([^"']+)["']/g;
        let iframeMatch;
        while ((iframeMatch = iframePattern.exec(content)) !== null) {
            connections.iframes.push(iframeMatch[1]);
        }
        
        // Port references
        const portPattern = /(localhost|127\.0\.0\.1):(\d+)/g;
        let portMatch;
        while ((portMatch = portPattern.exec(content)) !== null) {
            connections.ports.push(parseInt(portMatch[2]));
        }
        
        // Service references
        const servicePatterns = [
            /stripe/i,
            /websocket/i,
            /database/i,
            /redis/i,
            /postgresql/i,
            /mongodb/i,
            /ollama/i,
            /anthropic/i,
            /openai/i
        ];
        
        servicePatterns.forEach(pattern => {
            if (pattern.test(content)) {
                connections.services.push(pattern.source.replace(/[\/\\]/g, ''));
            }
        });
        
        return connections;
    }

    async testConnections() {
        console.log('\n🔌 Testing actual connections...');
        
        // Collect all unique connections to test
        const allPorts = new Set();
        const allFiles = new Set();
        const allApis = new Set();
        
        this.files.forEach(file => {
            file.connections.ports.forEach(port => allPorts.add(port));
            file.connections.fileReferences.forEach(ref => allFiles.add(ref));
            file.connections.apiCalls.forEach(api => allApis.add(api));
            file.connections.iframes.forEach(iframe => allFiles.add(iframe));
        });
        
        // Test port connections
        console.log(`🔍 Testing ${allPorts.size} port connections...`);
        for (const port of allPorts) {
            const isLive = await this.testPort(port);
            this.connections.set(`port:${port}`, {
                type: 'port',
                target: `localhost:${port}`,
                working: isLive,
                usedBy: this.files.filter(f => f.connections.ports.includes(port)).map(f => f.name)
            });
        }
        
        // Test file references
        console.log(`🔍 Testing ${allFiles.size} file references...`);
        for (const fileRef of allFiles) {
            const exists = this.testFileExists(fileRef);
            this.connections.set(`file:${fileRef}`, {
                type: 'file',
                target: fileRef,
                working: exists,
                usedBy: this.files.filter(f => 
                    f.connections.fileReferences.includes(fileRef) || 
                    f.connections.iframes.includes(fileRef)
                ).map(f => f.name)
            });
        }
        
        // Test API endpoints
        console.log(`🔍 Testing ${allApis.size} API endpoints...`);
        for (const api of allApis) {
            if (api.startsWith('http')) {
                const isLive = await this.testHttpEndpoint(api);
                this.connections.set(`api:${api}`, {
                    type: 'api',
                    target: api,
                    working: isLive,
                    usedBy: this.files.filter(f => f.connections.apiCalls.includes(api)).map(f => f.name)
                });
            }
        }
    }

    async testPort(port) {
        return new Promise((resolve) => {
            const req = http.request({
                hostname: 'localhost',
                port: port,
                method: 'GET',
                timeout: 1000
            }, (res) => {
                resolve(true);
            });
            
            req.on('error', () => resolve(false));
            req.on('timeout', () => resolve(false));
            req.end();
        });
    }

    testFileExists(filePath) {
        try {
            // Handle relative paths
            let fullPath = filePath;
            if (!path.isAbsolute(filePath)) {
                fullPath = path.join(this.codebaseRoot, filePath);
            }
            
            return fs.existsSync(fullPath);
        } catch {
            return false;
        }
    }

    async testHttpEndpoint(url) {
        return new Promise((resolve) => {
            try {
                const urlObj = new URL(url);
                const req = http.request({
                    hostname: urlObj.hostname,
                    port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
                    path: urlObj.pathname + urlObj.search,
                    method: 'HEAD',
                    timeout: 2000
                }, (res) => {
                    resolve(res.statusCode < 400);
                });
                
                req.on('error', () => resolve(false));
                req.on('timeout', () => resolve(false));
                req.end();
            } catch {
                resolve(false);
            }
        });
    }

    analyzeConnectionHealth() {
        console.log('\n📈 Analyzing connection health...');
        
        let workingConnections = 0;
        let brokenConnections = 0;
        let totalConnections = 0;
        
        for (const [key, connection] of this.connections) {
            totalConnections++;
            if (connection.working) {
                workingConnections++;
                this.realConnections.push(connection);
            } else {
                brokenConnections++;
                this.brokenConnections.push(connection);
            }
        }
        
        const healthScore = totalConnections > 0 ? 
            Math.round((workingConnections / totalConnections) * 100) : 0;
        
        return {
            total: totalConnections,
            working: workingConnections,
            broken: brokenConnections,
            healthScore
        };
    }

    generateConnectionMap() {
        console.log('\n🗺️ Generating connection map...');
        
        const health = this.analyzeConnectionHealth();
        
        // Create visual connection map
        const mapData = {
            metadata: {
                scanTime: new Date().toISOString(),
                filesScanned: this.files.length,
                connectionsFound: health.total,
                healthScore: health.healthScore
            },
            
            // What's actually working
            workingConnections: this.realConnections.map(conn => ({
                type: conn.type,
                target: conn.target,
                usedBy: conn.usedBy,
                status: '✅ WORKING'
            })),
            
            // What's broken
            brokenConnections: this.brokenConnections.map(conn => ({
                type: conn.type,
                target: conn.target,
                usedBy: conn.usedBy,
                status: '❌ BROKEN'
            })),
            
            // File dependency graph
            fileDependencies: this.files.map(file => ({
                name: file.name,
                size: file.size,
                dependencies: file.connections.fileReferences.length,
                apis: file.connections.apiCalls.length,
                ports: file.connections.ports.length,
                services: file.connections.services
            })),
            
            // Service inventory
            services: this.getServiceInventory(),
            
            // Recommendations
            recommendations: this.generateRecommendations(health)
        };
        
        return mapData;
    }

    getServiceInventory() {
        const services = new Map();
        
        this.files.forEach(file => {
            file.connections.services.forEach(service => {
                if (!services.has(service)) {
                    services.set(service, {
                        name: service,
                        usedBy: [],
                        status: 'unknown'
                    });
                }
                services.get(service).usedBy.push(file.name);
            });
        });
        
        // Check common service ports
        const servicePortMap = {
            'database': [5432, 3306, 27017],
            'redis': [6379],
            'websocket': [8080, 8081, 3001],
            'api': [3000, 3001, 8000, 8080]
        };
        
        for (const [serviceName, service] of services) {
            const ports = servicePortMap[serviceName.toLowerCase()] || [];
            service.status = ports.some(port => 
                this.connections.get(`port:${port}`)?.working
            ) ? 'running' : 'offline';
        }
        
        return Array.from(services.values());
    }

    generateRecommendations(health) {
        const recommendations = [];
        
        if (health.healthScore < 50) {
            recommendations.push({
                priority: 'HIGH',
                issue: 'More than half of connections are broken',
                solution: 'Start core services and fix file references'
            });
        }
        
        if (health.broken > 0) {
            recommendations.push({
                priority: 'MEDIUM',
                issue: `${health.broken} broken connections found`,
                solution: 'Review broken connections and update references'
            });
        }
        
        // Check for common issues
        const portConnections = Array.from(this.connections.entries())
            .filter(([key]) => key.startsWith('port:'));
        
        if (portConnections.length > 0 && portConnections.every(([,conn]) => !conn.working)) {
            recommendations.push({
                priority: 'HIGH',
                issue: 'No services are running on any ports',
                solution: 'Start your development servers (npm run dev, docker-compose up, etc.)'
            });
        }
        
        const fileConnections = Array.from(this.connections.entries())
            .filter(([key]) => key.startsWith('file:'));
        
        const brokenFiles = fileConnections.filter(([,conn]) => !conn.working);
        if (brokenFiles.length > fileConnections.length * 0.3) {
            recommendations.push({
                priority: 'MEDIUM',
                issue: 'Many file references are broken',
                solution: 'Clean up old references and ensure files exist'
            });
        }
        
        return recommendations;
    }

    printReport() {
        const mapData = this.generateConnectionMap();
        
        console.log('\n' + '='.repeat(80));
        console.log('🗺️  REAL CONNECTION MAP REPORT');
        console.log('='.repeat(80));
        
        console.log(`📊 Overview:`);
        console.log(`   Files Scanned: ${mapData.metadata.filesScanned}`);
        console.log(`   Connections Found: ${mapData.metadata.connectionsFound}`);
        console.log(`   Health Score: ${mapData.metadata.healthScore}%`);
        console.log('');
        
        // Working connections
        if (mapData.workingConnections.length > 0) {
            console.log(`✅ WORKING CONNECTIONS (${mapData.workingConnections.length}):`);
            mapData.workingConnections.forEach(conn => {
                console.log(`   ${conn.type.toUpperCase()}: ${conn.target}`);
                console.log(`      Used by: ${conn.usedBy.join(', ')}`);
            });
            console.log('');
        }
        
        // Broken connections
        if (mapData.brokenConnections.length > 0) {
            console.log(`❌ BROKEN CONNECTIONS (${mapData.brokenConnections.length}):`);
            mapData.brokenConnections.forEach(conn => {
                console.log(`   ${conn.type.toUpperCase()}: ${conn.target}`);
                console.log(`      Used by: ${conn.usedBy.join(', ')}`);
            });
            console.log('');
        }
        
        // Services
        if (mapData.services.length > 0) {
            console.log(`🔧 SERVICE INVENTORY:`);
            mapData.services.forEach(service => {
                const status = service.status === 'running' ? '🟢' : '🔴';
                console.log(`   ${status} ${service.name.toUpperCase()}: ${service.status}`);
                console.log(`      Used by: ${service.usedBy.join(', ')}`);
            });
            console.log('');
        }
        
        // Top connected files
        const topFiles = mapData.fileDependencies
            .sort((a, b) => (b.dependencies + b.apis + b.ports.length) - (a.dependencies + a.apis + a.ports.length))
            .slice(0, 10);
        
        console.log(`📁 MOST CONNECTED FILES:`);
        topFiles.forEach(file => {
            const totalConnections = file.dependencies + file.apis + file.ports.length;
            console.log(`   ${file.name}: ${totalConnections} connections`);
            console.log(`      Files: ${file.dependencies}, APIs: ${file.apis}, Ports: ${file.ports.length}`);
        });
        console.log('');
        
        // Recommendations
        if (mapData.recommendations.length > 0) {
            console.log(`🎯 RECOMMENDATIONS:`);
            mapData.recommendations.forEach(rec => {
                console.log(`   ${rec.priority}: ${rec.issue}`);
                console.log(`      Solution: ${rec.solution}`);
            });
            console.log('');
        }
        
        console.log('🎯 SUMMARY:');
        if (mapData.metadata.healthScore >= 80) {
            console.log('   🟢 System is well connected - most things are working together');
        } else if (mapData.metadata.healthScore >= 50) {
            console.log('   🟡 System is partially connected - some integration work needed');
        } else {
            console.log('   🔴 System is poorly connected - major integration issues');
        }
        
        console.log(`   Next step: ${this.getNextStep(mapData)}`);
        
        return mapData;
    }

    getNextStep(mapData) {
        if (mapData.brokenConnections.length > mapData.workingConnections.length) {
            return 'Fix broken connections before building new features';
        } else if (mapData.services.filter(s => s.status === 'running').length === 0) {
            return 'Start core services (databases, APIs, websockets)';
        } else if (mapData.metadata.healthScore < 70) {
            return 'Focus on connecting existing components';
        } else {
            return 'System is connected - ready for new features';
        }
    }

    async run() {
        console.log('🔍 REAL CONNECTION MAPPER STARTING\n' + '='.repeat(60));
        
        // Step 1: Scan codebase
        await this.scanCodebase();
        
        // Step 2: Test all connections
        await this.testConnections();
        
        // Step 3: Generate and print report
        const mapData = this.printReport();
        
        // Step 4: Save detailed report
        const reportPath = path.join(this.codebaseRoot, 'connection-map-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(mapData, null, 2));
        console.log(`💾 Detailed report saved to: connection-map-report.json`);
        
        return mapData;
    }
}

// Run the connection mapper
if (require.main === module) {
    const mapper = new RealConnectionMapper();
    mapper.run().catch(console.error);
}

module.exports = RealConnectionMapper;