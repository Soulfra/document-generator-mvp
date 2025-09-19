/**
 * Quick Service Discovery
 * Fast discovery of services, ports, and key documents in the chaos
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class QuickServiceDiscovery {
    constructor() {
        this.projectRoot = process.cwd();
        this.results = {
            timestamp: new Date(),
            services: [],
            ports: [],
            configs: [],
            keyDocuments: [],
            runningProcesses: [],
            issues: [],
            recommendations: []
        };
        
        // Known critical files to check
        this.criticalFiles = [
            'package.json',
            'docker-compose.yml',
            'docker-compose.yaml',
            '.env',
            '.env.example',
            'README.md',
            'index.js',
            'app.js',
            'server.js'
        ];
        
        // Key directories to scan
        this.keyDirectories = [
            '.',
            'mcp',
            'services',
            'FinishThisIdea',
            'FinishThisIdea-Complete',
            'src',
            'apps',
            'backend',
            'api'
        ];
        
        // Known ports from your ecosystem
        this.knownPorts = [
            3000, 3001, 3002, 3003, 3004, // MCP and AI services
            4000, 4001, 4002,             // Unified bridge
            5000, 5432,                   // Flask, PostgreSQL
            6379, 8080, 8081, 8090, 8091, // Redis, Platform, WebSocket, Character movement
            9000, 9001, 9706, 9800,       // MinIO, Casino, Cybersecurity
            9998, 9999, 11434             // Guardian, Sports, Ollama
        ];
    }
    
    async runQuickScan() {
        console.log('🚀 Running quick service discovery...');
        const startTime = Date.now();
        
        try {
            // Quick parallel scans
            await Promise.all([
                this.scanCriticalFiles(),
                this.scanKeyDirectories(), 
                this.checkRunningServices(),
                this.testKnownPorts()
            ]);
            
            // Generate summary
            this.generateSummary();
            
            const duration = Date.now() - startTime;
            console.log(`✅ Quick scan completed in ${duration}ms`);
            
            return this.results;
        } catch (error) {
            console.error('❌ Quick scan failed:', error);
            throw error;
        }
    }
    
    async scanCriticalFiles() {
        console.log('📁 Scanning critical files...');
        
        for (const fileName of this.criticalFiles) {
            const filePath = path.join(this.projectRoot, fileName);
            
            try {
                await fs.access(filePath);
                const stats = await fs.stat(filePath);
                const content = await fs.readFile(filePath, 'utf8');
                
                const analysis = {
                    file: fileName,
                    path: filePath,
                    size: stats.size,
                    lastModified: stats.mtime,
                    type: this.detectFileType(fileName),
                    content: content.length > 1000 ? content.slice(0, 1000) + '...' : content
                };
                
                // Extract important info
                if (fileName === 'package.json') {
                    try {
                        const pkg = JSON.parse(content);
                        analysis.name = pkg.name;
                        analysis.version = pkg.version;
                        analysis.scripts = pkg.scripts;
                        analysis.dependencies = Object.keys(pkg.dependencies || {});
                    } catch (e) {}
                }
                
                if (fileName.includes('docker-compose')) {
                    analysis.services = this.extractDockerServices(content);
                }
                
                if (fileName.startsWith('.env')) {
                    analysis.envVars = this.extractEnvVars(content);
                }
                
                this.results.configs.push(analysis);
            } catch (error) {
                // File doesn't exist, skip
            }
        }
    }
    
    async scanKeyDirectories() {
        console.log('📂 Scanning key directories...');
        
        for (const dir of this.keyDirectories) {
            const dirPath = path.join(this.projectRoot, dir);
            
            try {
                await fs.access(dirPath);
                const entries = await fs.readdir(dirPath);
                
                // Look for service-like files
                const serviceFiles = entries.filter(entry => 
                    entry.includes('service') || 
                    entry.includes('server') || 
                    entry.includes('app') ||
                    entry.includes('api') ||
                    entry.includes('gateway') ||
                    entry.includes('bridge') ||
                    entry === 'index.js'
                );
                
                for (const file of serviceFiles.slice(0, 5)) { // Limit to 5 per directory
                    const filePath = path.join(dirPath, file);
                    
                    try {
                        const stats = await fs.stat(filePath);
                        if (stats.isFile()) {
                            const content = await fs.readFile(filePath, 'utf8');
                            const service = await this.analyzeServiceFile(filePath, content);
                            
                            if (service.isService) {
                                this.results.services.push(service);
                            }
                        }
                    } catch (error) {
                        // Skip files we can't read
                    }
                }
                
                // Look for README files
                const readmeFiles = entries.filter(entry => 
                    entry.toLowerCase().includes('readme')
                );
                
                for (const readme of readmeFiles.slice(0, 3)) {
                    const readmePath = path.join(dirPath, readme);
                    
                    try {
                        const stats = await fs.stat(readmePath);
                        if (stats.isFile()) {
                            const content = await fs.readFile(readmePath, 'utf8');
                            
                            this.results.keyDocuments.push({
                                file: readme,
                                path: readmePath,
                                directory: dir,
                                size: stats.size,
                                preview: content.slice(0, 500)
                            });
                        }
                    } catch (error) {
                        // Skip files we can't read
                    }
                }
                
            } catch (error) {
                // Directory doesn't exist, skip
            }
        }
    }
    
    async analyzeServiceFile(filePath, content) {
        const relativePath = path.relative(this.projectRoot, filePath);
        const fileName = path.basename(filePath);
        
        const service = {
            file: fileName,
            path: relativePath,
            fullPath: filePath,
            isService: false,
            ports: [],
            apis: [],
            frameworks: [],
            type: 'unknown'
        };
        
        // Check if it's a service
        const servicePatterns = [
            /\.listen\s*\(/i,
            /createServer\s*\(/i,
            /express\s*\(/i,
            /fastify\s*\(/i,
            /WebSocket/i,
            /PORT|port.*=|listen.*\d+/i
        ];
        
        service.isService = servicePatterns.some(pattern => pattern.test(content));
        
        if (!service.isService) {
            return service;
        }
        
        // Extract ports
        const portMatches = content.match(/port[:\s=]*(\d+)|listen\s*\(\s*(\d+)|:(\d{4,5})/gi);
        if (portMatches) {
            for (const match of portMatches) {
                const numbers = match.match(/\d+/);
                if (numbers) {
                    const port = parseInt(numbers[0]);
                    if (port > 1000 && port < 65535) {
                        service.ports.push(port);
                    }
                }
            }
        }
        
        // Extract API endpoints
        const apiMatches = content.match(/\.(get|post|put|delete|patch)\s*\(['"`]([^'"`]+)['"`]/gi);
        if (apiMatches) {
            service.apis = apiMatches.slice(0, 10); // Limit to first 10
        }
        
        // Detect frameworks
        const frameworks = {
            'express': /express/i,
            'fastify': /fastify/i,
            'socket.io': /socket\.io/i,
            'ws': /require.*ws/i
        };
        
        for (const [name, pattern] of Object.entries(frameworks)) {
            if (pattern.test(content)) {
                service.frameworks.push(name);
            }
        }
        
        // Determine service type
        service.type = this.guessServiceType(relativePath, content);
        
        return service;
    }
    
    guessServiceType(filePath, content) {
        const path = filePath.toLowerCase();
        const contentLower = content.toLowerCase();
        
        if (path.includes('mcp') || path.includes('template')) return 'template-processor';
        if (path.includes('ai') || contentLower.includes('openai') || contentLower.includes('claude')) return 'ai-service';
        if (path.includes('bridge') || path.includes('gateway')) return 'integration-gateway';
        if (path.includes('character') || path.includes('game')) return 'gaming-service';
        if (path.includes('auth')) return 'authentication';
        if (path.includes('api') || contentLower.includes('express')) return 'api-service';
        
        return 'web-service';
    }
    
    async checkRunningServices() {
        console.log('🔍 Checking running services...');
        
        try {
            // Check Node.js processes
            const { stdout: nodeProcs } = await execAsync('ps aux | grep -i node | grep -v grep || echo "no node processes"');
            const nodeLines = nodeProcs.split('\n').filter(line => line.trim() && !line.includes('no node processes'));
            
            for (const line of nodeLines) {
                const parts = line.trim().split(/\s+/);
                if (parts.length > 10) {
                    this.results.runningProcesses.push({
                        pid: parts[1],
                        cpu: parts[2],
                        mem: parts[3],
                        command: parts.slice(10).join(' ')
                    });
                }
            }
            
            // Check Docker containers
            const { stdout: dockerProcs } = await execAsync('docker ps --format "{{.Names}}\\t{{.Status}}\\t{{.Ports}}" 2>/dev/null || echo "no docker"');
            if (!dockerProcs.includes('no docker')) {
                const dockerLines = dockerProcs.split('\n').filter(line => line.trim());
                
                for (const line of dockerLines) {
                    const [name, status, ports] = line.split('\t');
                    if (name) {
                        this.results.runningProcesses.push({
                            type: 'docker',
                            name: name,
                            status: status,
                            ports: ports || ''
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Failed to check running services:', error.message);
        }
    }
    
    async testKnownPorts() {
        console.log('🌐 Testing known ports...');
        
        const portPromises = this.knownPorts.map(async (port) => {
            try {
                const isOpen = await this.testPort(port);
                this.results.ports.push({
                    port: port,
                    status: isOpen ? 'open' : 'closed',
                    service: this.guessServiceByPort(port)
                });
            } catch (error) {
                this.results.ports.push({
                    port: port,
                    status: 'error',
                    error: error.message
                });
            }
        });
        
        await Promise.all(portPromises);
    }
    
    async testPort(port, timeout = 500) {
        return new Promise((resolve) => {
            const net = require('net');
            const socket = new net.Socket();
            
            const timer = setTimeout(() => {
                socket.destroy();
                resolve(false);
            }, timeout);
            
            socket.on('connect', () => {
                clearTimeout(timer);
                socket.destroy();
                resolve(true);
            });
            
            socket.on('error', () => {
                clearTimeout(timer);
                socket.destroy();
                resolve(false);
            });
            
            socket.connect(port, 'localhost');
        });
    }
    
    guessServiceByPort(port) {
        const portMap = {
            3000: 'MCP Template Processor',
            3001: 'AI API Service',
            3002: 'Analytics Service',
            4000: 'Unified Bridge API',
            4001: 'Unified Bridge WebSocket',
            5000: 'Flask Backend',
            5432: 'PostgreSQL',
            6379: 'Redis',
            8080: 'Platform Hub',
            8090: 'Character Movement',
            8091: 'Widget Integration',
            9000: 'MinIO Storage',
            9001: 'MinIO Console',
            11434: 'Ollama Local AI'
        };
        
        return portMap[port] || `Unknown Service (Port ${port})`;
    }
    
    detectFileType(fileName) {
        if (fileName === 'package.json') return 'npm-config';
        if (fileName.includes('docker-compose')) return 'docker-config';
        if (fileName.startsWith('.env')) return 'environment';
        if (fileName.toLowerCase().includes('readme')) return 'documentation';
        if (fileName.endsWith('.js')) return 'javascript';
        
        return 'unknown';
    }
    
    extractDockerServices(content) {
        const services = [];
        const lines = content.split('\n');
        
        for (const line of lines) {
            if (line.match(/^\s+[a-zA-Z0-9_-]+:\s*$/)) {
                const serviceName = line.trim().replace(':', '');
                services.push(serviceName);
            }
        }
        
        return services;
    }
    
    extractEnvVars(content) {
        const vars = [];
        const lines = content.split('\n');
        
        for (const line of lines) {
            if (line.includes('=') && !line.trim().startsWith('#')) {
                const [key] = line.split('=');
                vars.push(key.trim());
            }
        }
        
        return vars.slice(0, 20); // Limit to first 20
    }
    
    generateSummary() {
        console.log('📊 Generating summary...');
        
        const openPorts = this.results.ports.filter(p => p.status === 'open');
        const runningServices = this.results.services.length;
        const totalDocuments = this.results.keyDocuments.length;
        
        // Generate issues
        if (openPorts.length === 0) {
            this.results.issues.push({
                type: 'no-services-running',
                severity: 'high',
                message: 'No services appear to be running on known ports'
            });
        }
        
        if (runningServices === 0) {
            this.results.issues.push({
                type: 'no-service-files',
                severity: 'medium', 
                message: 'No service files detected in key directories'
            });
        }
        
        // Generate recommendations
        this.results.recommendations.push({
            type: 'start-services',
            priority: 'high',
            message: `Found ${runningServices} potential services. Consider starting core services.`,
            action: 'Run docker-compose up -d or start individual services'
        });
        
        if (totalDocuments > 0) {
            this.results.recommendations.push({
                type: 'organize-docs',
                priority: 'medium',
                message: `Found ${totalDocuments} documentation files that could be organized`,
                action: 'Create a documentation index and cleanup scattered README files'
            });
        }
    }
    
    generateReport() {
        const report = `
# Document Generator Service Discovery Report

**Generated**: ${this.results.timestamp.toLocaleString()}

## 🚀 Services Overview

### Detected Services: ${this.results.services.length}
${this.results.services.map(s => `- **${s.file}** (${s.type}) - Ports: [${s.ports.join(', ')}]`).join('\n')}

### Port Status
${this.results.ports.map(p => `- Port ${p.port}: **${p.status.toUpperCase()}** (${p.service})`).join('\n')}

### Running Processes: ${this.results.runningProcesses.length}
${this.results.runningProcesses.slice(0, 5).map(p => `- ${p.command || p.name} (${p.type || 'node'})`).join('\n')}

## 📁 Configuration Files

${this.results.configs.map(c => `- **${c.file}** - ${c.type} (${(c.size/1024).toFixed(1)}KB)`).join('\n')}

## 📚 Key Documents

${this.results.keyDocuments.map(d => `- **${d.file}** in /${d.directory} (${(d.size/1024).toFixed(1)}KB)`).join('\n')}

## ⚠️ Issues Found

${this.results.issues.map(i => `- **${i.type}**: ${i.message} (${i.severity})`).join('\n')}

## 💡 Recommendations

${this.results.recommendations.map(r => `- **${r.type}**: ${r.message}\n  Action: ${r.action}`).join('\n\n')}

---
*Quick discovery completed in seconds instead of hours!*
`;

        return report;
    }
    
    async saveReport() {
        const reportPath = path.join(this.projectRoot, 'service-discovery-report.md');
        const jsonPath = path.join(this.projectRoot, 'service-discovery-data.json');
        
        await fs.writeFile(reportPath, this.generateReport());
        await fs.writeFile(jsonPath, JSON.stringify(this.results, null, 2));
        
        console.log(`📄 Report saved: ${reportPath}`);
        console.log(`📊 Data saved: ${jsonPath}`);
        
        return { reportPath, jsonPath };
    }
}

// Run if called directly
if (require.main === module) {
    const discovery = new QuickServiceDiscovery();
    
    discovery.runQuickScan()
        .then(async (results) => {
            await discovery.saveReport();
            
            console.log('\n🎉 Quick Discovery Complete!');
            console.log(`Found: ${results.services.length} services, ${results.ports.filter(p => p.status === 'open').length} open ports, ${results.keyDocuments.length} documents`);
            console.log('\n📊 Summary:');
            console.log(discovery.generateReport());
        })
        .catch(error => {
            console.error('❌ Discovery failed:', error);
            process.exit(1);
        });
}

module.exports = QuickServiceDiscovery;