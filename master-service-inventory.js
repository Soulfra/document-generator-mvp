/**
 * Master Service Inventory System
 * Comprehensive catalog of all running services, APIs, and ports in the Document Generator ecosystem
 * Scans the entire project structure and maps the chaos into organized information
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

/**
 * Service Discovery and Inventory Manager
 */
class MasterServiceInventory {
    constructor() {
        this.projectRoot = process.cwd();
        this.inventory = {
            services: new Map(),
            ports: new Map(),
            apis: new Map(),
            documents: new Map(),
            configs: new Map(),
            containers: new Map(),
            processes: new Map(),
            lastScan: null,
            scanResults: {
                totalFiles: 0,
                servicesFound: 0,
                portsFound: 0,
                apisFound: 0,
                documentsFound: 0,
                configsFound: 0
            }
        };
        
        this.scanPatterns = {
            serviceFiles: [
                '**/*service*.js',
                '**/*server*.js',
                '**/*api*.js',
                '**/*app.js',
                '**/index.js',
                '**/*daemon*.js',
                '**/*worker*.js',
                '**/*orchestrator*.js',
                '**/*gateway*.js',
                '**/*bridge*.js',
                '**/*hub*.js'
            ],
            configFiles: [
                '**/package.json',
                '**/docker-compose*.yml',
                '**/Dockerfile*',
                '**/.env*',
                '**/config*.js',
                '**/config*.json',
                '**/settings*.json',
                '**/nginx*.conf',
                '**/apache*.conf'
            ],
            documentFiles: [
                '**/*.md',
                '**/*.txt',
                '**/*.pdf',
                '**/*.doc',
                '**/*.docx',
                '**/*.html',
                '**/*.xml',
                '**/*.json',
                '**/*.csv',
                '**/*.xlsx'
            ],
            portPatterns: [
                /port\s*[:=]\s*(\d+)/gi,
                /PORT\s*[:=]\s*(\d+)/gi,
                /listen\s+(\d+)/gi,
                /localhost:(\d+)/gi,
                /127\.0\.0\.1:(\d+)/gi,
                /:(\d{2,5})/g
            ]
        };
        
        this.knownServices = {
            // Document Processing
            'flask-backend': { port: 5000, type: 'document-processor', status: 'unknown' },
            'mcp-template-processor': { port: 3000, type: 'template-generator', status: 'unknown' },
            'ai-api-service': { port: 3001, type: 'ai-orchestrator', status: 'unknown' },
            'analytics-service': { port: 3002, type: 'analytics', status: 'unknown' },
            'llm-orchestration': { port: 3003, type: 'ai-router', status: 'unknown' },
            'privacy-scanner': { port: 3004, type: 'compliance', status: 'unknown' },
            
            // Infrastructure
            'postgresql': { port: 5432, type: 'database', status: 'unknown' },
            'redis': { port: 6379, type: 'cache', status: 'unknown' },
            'minio': { port: 9000, type: 'storage', status: 'unknown' },
            'minio-console': { port: 9001, type: 'storage-ui', status: 'unknown' },
            'ollama': { port: 11434, type: 'ai-local', status: 'unknown' },
            
            // Ecosystem Services
            'unified-bridge': { port: 4000, type: 'integration-hub', status: 'unknown' },
            'character-movement': { port: 8090, type: 'gaming', status: 'unknown' },
            'widget-integration': { port: 8091, type: 'ui-widget', status: 'unknown' },
            'network-service': { port: 3333, type: 'networking', status: 'unknown' },
            'service-registry': { port: 5555, type: 'discovery', status: 'unknown' },
            'internet-gateway': { port: 6666, type: 'gateway', status: 'unknown' },
            
            // Gaming & Entertainment
            'cybersecurity-gaming': { port: 9800, type: 'gaming', status: 'unknown' },
            'espn-sports-hub': { port: 9999, type: 'sports', status: 'unknown' },
            'ai-casino': { port: 9706, type: 'gaming', status: 'unknown' },
            'guardian-teacher': { port: 9998, type: 'education', status: 'unknown' }
        };
        
        this.documentTypes = {
            'README': 'documentation',
            'SPEC': 'technical-specification',
            'API': 'api-documentation',
            'CONFIG': 'configuration',
            'LOG': 'logging',
            'TEST': 'testing',
            'DEPLOY': 'deployment',
            'SECURITY': 'security',
            'BUSINESS': 'business-plan',
            'ARCHITECTURE': 'system-design',
            'GUIDE': 'user-documentation'
        };
    }
    
    /**
     * Run comprehensive system scan
     */
    async runComprehensiveScan() {
        console.log('🔍 Starting comprehensive system scan...');
        const startTime = Date.now();
        
        try {
            // Reset inventory
            this.resetInventory();
            
            // Parallel scanning for performance
            const scanPromises = [
                this.scanForServices(),
                this.scanForConfigs(),
                this.scanForDocuments(),
                this.scanRunningProcesses(),
                this.scanDockerContainers(),
                this.scanNetworkPorts()
            ];
            
            await Promise.all(scanPromises);
            
            // Cross-reference and validate
            await this.crossReferenceData();
            
            // Generate insights
            this.generateInsights();
            
            this.inventory.lastScan = new Date();
            const duration = Date.now() - startTime;
            
            console.log(`✅ Comprehensive scan completed in ${duration}ms`);
            console.log(`📊 Found: ${this.inventory.scanResults.servicesFound} services, ${this.inventory.scanResults.portsFound} ports, ${this.inventory.scanResults.documentsFound} documents`);
            
            return this.inventory;
        } catch (error) {
            console.error('❌ Scan failed:', error);
            throw error;
        }
    }
    
    /**
     * Reset inventory for fresh scan
     */
    resetInventory() {
        this.inventory.services.clear();
        this.inventory.ports.clear();
        this.inventory.apis.clear();
        this.inventory.documents.clear();
        this.inventory.configs.clear();
        this.inventory.containers.clear();
        this.inventory.processes.clear();
        this.inventory.scanResults = {
            totalFiles: 0,
            servicesFound: 0,
            portsFound: 0,
            apisFound: 0,
            documentsFound: 0,
            configsFound: 0
        };
    }
    
    /**
     * Scan for service files and analyze them
     */
    async scanForServices() {
        console.log('🔍 Scanning for services...');
        
        for (const pattern of this.scanPatterns.serviceFiles) {
            const files = await this.findFiles(pattern);
            
            for (const file of files) {
                try {
                    const analysis = await this.analyzeServiceFile(file);
                    if (analysis.isService) {
                        this.inventory.services.set(file, analysis);
                        this.inventory.scanResults.servicesFound++;
                    }
                } catch (error) {
                    console.error(`Failed to analyze ${file}:`, error.message);
                }
            }
        }
    }
    
    /**
     * Analyze individual service file
     */
    async analyzeServiceFile(filePath) {
        const content = await fs.readFile(filePath, 'utf8');
        const relativePath = path.relative(this.projectRoot, filePath);
        
        const analysis = {
            filePath: relativePath,
            fullPath: filePath,
            isService: false,
            type: 'unknown',
            ports: [],
            apis: [],
            dependencies: [],
            frameworks: [],
            database: null,
            websockets: false,
            authentication: false,
            documentation: null,
            lastModified: (await fs.stat(filePath)).mtime
        };
        
        // Check if it's actually a service
        const serviceIndicators = [
            /app\.listen\s*\(/i,
            /server\.listen\s*\(/i,
            /express\s*\(/i,
            /createServer\s*\(/i,
            /fastify\s*\(/i,
            /koa\s*\(/i,
            /WebSocket/i,
            /Socket\.IO/i
        ];
        
        analysis.isService = serviceIndicators.some(pattern => pattern.test(content));
        
        if (!analysis.isService) {
            return analysis;
        }
        
        // Extract ports
        for (const pattern of this.scanPatterns.portPatterns) {
            const matches = content.matchAll(pattern);
            for (const match of matches) {
                const port = parseInt(match[1]);
                if (port && port > 1000 && port < 65535) {
                    analysis.ports.push(port);
                    
                    // Register port in inventory
                    if (!this.inventory.ports.has(port)) {
                        this.inventory.ports.set(port, []);
                    }
                    this.inventory.ports.get(port).push(relativePath);
                    this.inventory.scanResults.portsFound++;
                }
            }
        }
        
        // Extract API endpoints
        const apiPatterns = [
            /app\.(get|post|put|delete|patch)\s*\(['"`]([^'"`]+)['"`]/gi,
            /router\.(get|post|put|delete|patch)\s*\(['"`]([^'"`]+)['"`]/gi,
            /\.route\s*\(['"`]([^'"`]+)['"`]/gi
        ];
        
        for (const pattern of apiPatterns) {
            const matches = content.matchAll(pattern);
            for (const match of matches) {
                const endpoint = match[2] || match[1];
                if (endpoint && endpoint.startsWith('/')) {
                    analysis.apis.push(endpoint);
                    
                    // Register API in inventory
                    this.inventory.apis.set(endpoint, {
                        service: relativePath,
                        method: match[1]?.toUpperCase() || 'GET'
                    });
                    this.inventory.scanResults.apisFound++;
                }
            }
        }
        
        // Detect frameworks
        const frameworkPatterns = {
            'express': /require\s*\(['"`]express['"`]\)/i,
            'fastify': /require\s*\(['"`]fastify['"`]\)/i,
            'koa': /require\s*\(['"`]koa['"`]\)/i,
            'socket.io': /require\s*\(['"`]socket\.io['"`]\)/i,
            'ws': /require\s*\(['"`]ws['"`]\)/i,
            'axios': /require\s*\(['"`]axios['"`]\)/i,
            'mongoose': /require\s*\(['"`]mongoose['"`]\)/i,
            'sequelize': /require\s*\(['"`]sequelize['"`]\)/i,
            'prisma': /require\s*\(['"`]@prisma\/client['"`]\)/i
        };
        
        for (const [framework, pattern] of Object.entries(frameworkPatterns)) {
            if (pattern.test(content)) {
                analysis.frameworks.push(framework);
            }
        }
        
        // Detect service type
        analysis.type = this.detectServiceType(relativePath, content, analysis);
        
        // Detect WebSockets
        analysis.websockets = /WebSocket|socket\.io|ws/i.test(content);
        
        // Detect authentication
        analysis.authentication = /jwt|passport|auth|login|token/i.test(content);
        
        // Look for related documentation
        analysis.documentation = await this.findRelatedDocumentation(filePath);
        
        return analysis;
    }
    
    /**
     * Detect service type based on path and content
     */
    detectServiceType(filePath, content, analysis) {
        const pathLower = filePath.toLowerCase();
        
        // Document processing services
        if (pathLower.includes('document') || pathLower.includes('pdf') || pathLower.includes('upload')) {
            return 'document-processor';
        }
        
        // AI/ML services
        if (pathLower.includes('ai') || pathLower.includes('llm') || pathLower.includes('claude') || pathLower.includes('openai')) {
            return 'ai-service';
        }
        
        // Gaming services
        if (pathLower.includes('game') || pathLower.includes('character') || pathLower.includes('widget')) {
            return 'gaming';
        }
        
        // Template services
        if (pathLower.includes('template') || pathLower.includes('mcp')) {
            return 'template-generator';
        }
        
        // API gateways
        if (pathLower.includes('gateway') || pathLower.includes('bridge') || pathLower.includes('orchestrator')) {
            return 'integration-hub';
        }
        
        // Authentication services
        if (pathLower.includes('auth') || analysis.authentication) {
            return 'authentication';
        }
        
        // Analytics
        if (pathLower.includes('analytics') || pathLower.includes('metrics')) {
            return 'analytics';
        }
        
        // Storage services
        if (pathLower.includes('storage') || pathLower.includes('vault') || pathLower.includes('ipfs')) {
            return 'storage';
        }
        
        return 'web-service';
    }
    
    /**
     * Find related documentation for a service
     */
    async findRelatedDocumentation(serviceFile) {
        const dir = path.dirname(serviceFile);
        const serviceName = path.basename(serviceFile, '.js');
        
        const potentialDocs = [
            path.join(dir, 'README.md'),
            path.join(dir, `${serviceName}.md`),
            path.join(dir, 'docs', 'README.md'),
            path.join(dir, '..', 'README.md')
        ];
        
        for (const docPath of potentialDocs) {
            try {
                await fs.access(docPath);
                return path.relative(this.projectRoot, docPath);
            } catch {
                // File doesn't exist, continue
            }
        }
        
        return null;
    }
    
    /**
     * Scan for configuration files
     */
    async scanForConfigs() {
        console.log('🔍 Scanning for configurations...');
        
        for (const pattern of this.scanPatterns.configFiles) {
            const files = await this.findFiles(pattern);
            
            for (const file of files) {
                try {
                    const analysis = await this.analyzeConfigFile(file);
                    this.inventory.configs.set(file, analysis);
                    this.inventory.scanResults.configsFound++;
                } catch (error) {
                    console.error(`Failed to analyze config ${file}:`, error.message);
                }
            }
        }
    }
    
    /**
     * Analyze configuration file
     */
    async analyzeConfigFile(filePath) {
        const content = await fs.readFile(filePath, 'utf8');
        const relativePath = path.relative(this.projectRoot, filePath);
        const fileName = path.basename(filePath);
        
        const analysis = {
            filePath: relativePath,
            fullPath: filePath,
            type: this.detectConfigType(fileName),
            ports: [],
            services: [],
            environment: [],
            dependencies: {},
            lastModified: (await fs.stat(filePath)).mtime
        };
        
        // Extract ports from config
        for (const pattern of this.scanPatterns.portPatterns) {
            const matches = content.matchAll(pattern);
            for (const match of matches) {
                const port = parseInt(match[1]);
                if (port && port > 1000 && port < 65535) {
                    analysis.ports.push(port);
                }
            }
        }
        
        // Parse specific config types
        if (fileName === 'package.json') {
            try {
                const pkg = JSON.parse(content);
                analysis.dependencies = {
                    production: pkg.dependencies || {},
                    development: pkg.devDependencies || {}
                };
                analysis.scripts = pkg.scripts || {};
                analysis.name = pkg.name;
                analysis.version = pkg.version;
            } catch (error) {
                console.error('Failed to parse package.json:', error);
            }
        }
        
        if (fileName.startsWith('docker-compose')) {
            analysis.services = this.extractDockerServices(content);
        }
        
        if (fileName.startsWith('.env')) {
            analysis.environment = this.extractEnvironmentVars(content);
        }
        
        return analysis;
    }
    
    /**
     * Detect configuration file type
     */
    detectConfigType(fileName) {
        if (fileName === 'package.json') return 'npm-package';
        if (fileName.startsWith('docker-compose')) return 'docker-compose';
        if (fileName.startsWith('Dockerfile')) return 'dockerfile';
        if (fileName.startsWith('.env')) return 'environment';
        if (fileName.includes('nginx')) return 'nginx-config';
        if (fileName.includes('apache')) return 'apache-config';
        if (fileName.includes('config')) return 'application-config';
        return 'unknown-config';
    }
    
    /**
     * Extract Docker services from docker-compose file
     */
    extractDockerServices(content) {
        const services = [];
        const servicePattern = /^\s*([a-zA-Z0-9_-]+):\s*$/gm;
        const matches = content.matchAll(servicePattern);
        
        for (const match of matches) {
            const serviceName = match[1];
            if (!['version', 'services', 'volumes', 'networks'].includes(serviceName)) {
                services.push(serviceName);
            }
        }
        
        return services;
    }
    
    /**
     * Extract environment variables
     */
    extractEnvironmentVars(content) {
        const vars = [];
        const lines = content.split('\n');
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
                const [key] = trimmed.split('=');
                vars.push(key);
            }
        }
        
        return vars;
    }
    
    /**
     * Scan for documents
     */
    async scanForDocuments() {
        console.log('🔍 Scanning for documents...');
        
        for (const pattern of this.scanPatterns.documentFiles) {
            const files = await this.findFiles(pattern);
            
            for (const file of files) {
                try {
                    const analysis = await this.analyzeDocumentFile(file);
                    this.inventory.documents.set(file, analysis);
                    this.inventory.scanResults.documentsFound++;
                } catch (error) {
                    console.error(`Failed to analyze document ${file}:`, error.message);
                }
            }
        }
    }
    
    /**
     * Analyze document file
     */
    async analyzeDocumentFile(filePath) {
        const stats = await fs.stat(filePath);
        const relativePath = path.relative(this.projectRoot, filePath);
        const fileName = path.basename(filePath);
        const extension = path.extname(filePath).toLowerCase();
        
        const analysis = {
            filePath: relativePath,
            fullPath: filePath,
            fileName: fileName,
            extension: extension,
            type: this.detectDocumentType(fileName, relativePath),
            size: stats.size,
            lastModified: stats.mtime,
            isReadme: /readme/i.test(fileName),
            isConfig: /config|settings/i.test(fileName),
            isApi: /api/i.test(fileName),
            isSpec: /spec|specification/i.test(fileName)
        };
        
        // Try to extract content preview for text files
        if (['.md', '.txt', '.json', '.js', '.html'].includes(extension)) {
            try {
                const content = await fs.readFile(filePath, 'utf8');
                analysis.preview = content.slice(0, 500);
                analysis.lines = content.split('\n').length;
                analysis.words = content.split(/\s+/).length;
            } catch (error) {
                // File might be binary or inaccessible
                analysis.preview = null;
            }
        }
        
        return analysis;
    }
    
    /**
     * Detect document type
     */
    detectDocumentType(fileName, relativePath) {
        const fileUpper = fileName.toUpperCase();
        const pathUpper = relativePath.toUpperCase();
        
        for (const [keyword, type] of Object.entries(this.documentTypes)) {
            if (fileUpper.includes(keyword) || pathUpper.includes(keyword)) {
                return type;
            }
        }
        
        // Check by location
        if (pathUpper.includes('DOCS')) return 'documentation';
        if (pathUpper.includes('TEST')) return 'testing';
        if (pathUpper.includes('CONFIG')) return 'configuration';
        if (pathUpper.includes('DEPLOY')) return 'deployment';
        if (pathUpper.includes('SECURITY')) return 'security';
        
        return 'general-document';
    }
    
    /**
     * Scan running processes
     */
    async scanRunningProcesses() {
        console.log('🔍 Scanning running processes...');
        
        try {
            // Get all Node.js processes
            const { stdout: nodeProcesses } = await execAsync('ps aux | grep -i node | grep -v grep');
            const nodeLines = nodeProcesses.split('\n').filter(line => line.trim());
            
            for (const line of nodeLines) {
                const process = this.parseProcessLine(line);
                if (process) {
                    this.inventory.processes.set(process.pid, process);
                }
            }
            
            // Get processes listening on ports
            const { stdout: listeningPorts } = await execAsync('lsof -i -P -n | grep LISTEN || netstat -tlnp 2>/dev/null | grep LISTEN || true');
            const portLines = listeningPorts.split('\n').filter(line => line.trim());
            
            for (const line of portLines) {
                const portInfo = this.parsePortLine(line);
                if (portInfo) {
                    // Cross-reference with known services
                    this.crossReferencePortProcess(portInfo);
                }
            }
        } catch (error) {
            console.error('Failed to scan processes:', error.message);
        }
    }
    
    /**
     * Parse process line from ps output
     */
    parseProcessLine(line) {
        const parts = line.trim().split(/\s+/);
        if (parts.length < 11) return null;
        
        return {
            pid: parts[1],
            cpu: parts[2],
            mem: parts[3],
            command: parts.slice(10).join(' '),
            isNodeProcess: parts.slice(10).join(' ').includes('node')
        };
    }
    
    /**
     * Parse port line from lsof/netstat output
     */
    parsePortLine(line) {
        const portMatch = line.match(/:(\d+)\s/);
        if (!portMatch) return null;
        
        const port = parseInt(portMatch[1]);
        return {
            port: port,
            line: line.trim(),
            isListening: line.includes('LISTEN')
        };
    }
    
    /**
     * Cross-reference port with processes
     */
    crossReferencePortProcess(portInfo) {
        const port = portInfo.port;
        
        // Check if this port matches any known services
        for (const [serviceName, serviceInfo] of Object.entries(this.knownServices)) {
            if (serviceInfo.port === port) {
                serviceInfo.status = portInfo.isListening ? 'running' : 'stopped';
                serviceInfo.processInfo = portInfo;
            }
        }
    }
    
    /**
     * Scan Docker containers
     */
    async scanDockerContainers() {
        console.log('🔍 Scanning Docker containers...');
        
        try {
            const { stdout: containers } = await execAsync('docker ps -a --format "{{.ID}}\\t{{.Names}}\\t{{.Image}}\\t{{.Status}}\\t{{.Ports}}" || true');
            const containerLines = containers.split('\n').filter(line => line.trim());
            
            for (const line of containerLines) {
                const container = this.parseContainerLine(line);
                if (container) {
                    this.inventory.containers.set(container.id, container);
                }
            }
        } catch (error) {
            console.error('Failed to scan Docker containers:', error.message);
        }
    }
    
    /**
     * Parse Docker container line
     */
    parseContainerLine(line) {
        const parts = line.split('\t');
        if (parts.length < 4) return null;
        
        return {
            id: parts[0],
            name: parts[1],
            image: parts[2],
            status: parts[3],
            ports: parts[4] || '',
            isRunning: parts[3].includes('Up')
        };
    }
    
    /**
     * Scan network ports
     */
    async scanNetworkPorts() {
        console.log('🔍 Scanning network ports...');
        
        // Test known ports for connectivity
        for (const [serviceName, serviceInfo] of Object.entries(this.knownServices)) {
            try {
                const isAccessible = await this.testPortConnectivity(serviceInfo.port);
                serviceInfo.accessible = isAccessible;
                if (isAccessible && serviceInfo.status === 'unknown') {
                    serviceInfo.status = 'running';
                }
            } catch (error) {
                serviceInfo.accessible = false;
                if (serviceInfo.status === 'unknown') {
                    serviceInfo.status = 'stopped';
                }
            }
        }
    }
    
    /**
     * Test if a port is accessible
     */
    async testPortConnectivity(port, timeout = 1000) {
        return new Promise((resolve) => {
            const net = require('net');
            const socket = new net.Socket();
            
            const timer = setTimeout(() => {
                socket.destroy();
                resolve(false);
            }, timeout);
            
            socket.setTimeout(timeout);
            socket.on('connect', () => {
                clearTimeout(timer);
                socket.destroy();
                resolve(true);
            });
            
            socket.on('timeout', () => {
                clearTimeout(timer);
                socket.destroy();
                resolve(false);
            });
            
            socket.on('error', () => {
                clearTimeout(timer);
                socket.destroy();
                resolve(false);
            });
            
            socket.connect(port, 'localhost');
        });
    }
    
    /**
     * Cross-reference all collected data
     */
    async crossReferenceData() {
        console.log('🔍 Cross-referencing data...');
        
        // Match services to known services by port
        for (const [filePath, serviceData] of this.inventory.services.entries()) {
            for (const port of serviceData.ports) {
                for (const [knownName, knownService] of Object.entries(this.knownServices)) {
                    if (knownService.port === port) {
                        serviceData.knownServiceName = knownName;
                        knownService.sourceFile = filePath;
                        knownService.detectedFrameworks = serviceData.frameworks;
                    }
                }
            }
        }
        
        // Cross-reference configs with services
        for (const [configPath, configData] of this.inventory.configs.entries()) {
            if (configData.type === 'docker-compose') {
                // Link docker services to known services
                for (const serviceName of configData.services) {
                    if (this.knownServices[serviceName]) {
                        this.knownServices[serviceName].dockerService = serviceName;
                        this.knownServices[serviceName].dockerComposeFile = configPath;
                    }
                }
            }
        }
    }
    
    /**
     * Generate insights and recommendations
     */
    generateInsights() {
        console.log('🧠 Generating insights...');
        
        const insights = {
            summary: {
                totalServices: this.inventory.services.size,
                runningServices: Object.values(this.knownServices).filter(s => s.status === 'running').length,
                totalPorts: this.inventory.ports.size,
                totalDocuments: this.inventory.documents.size,
                totalConfigs: this.inventory.configs.size
            },
            issues: [],
            recommendations: [],
            clusters: this.identifyServiceClusters()
        };
        
        // Identify issues
        const stoppedServices = Object.entries(this.knownServices)
            .filter(([name, info]) => info.status === 'stopped')
            .map(([name]) => name);
        
        if (stoppedServices.length > 0) {
            insights.issues.push({
                type: 'stopped-services',
                severity: 'medium',
                message: `${stoppedServices.length} services are not running`,
                services: stoppedServices
            });
        }
        
        // Check for port conflicts
        const portConflicts = [];
        for (const [port, services] of this.inventory.ports.entries()) {
            if (services.length > 1) {
                portConflicts.push({ port, services });
            }
        }
        
        if (portConflicts.length > 0) {
            insights.issues.push({
                type: 'port-conflicts',
                severity: 'high',
                message: 'Multiple services configured for same ports',
                conflicts: portConflicts
            });
        }
        
        // Generate recommendations
        insights.recommendations.push({
            type: 'documentation',
            priority: 'high',
            message: 'Create service documentation for undocumented services',
            action: 'Generate README files for services missing documentation'
        });
        
        insights.recommendations.push({
            type: 'monitoring',
            priority: 'medium',
            message: 'Set up service health monitoring',
            action: 'Implement health check endpoints for all services'
        });
        
        this.inventory.insights = insights;
    }
    
    /**
     * Identify service clusters and relationships
     */
    identifyServiceClusters() {
        const clusters = {
            'document-processing': [],
            'ai-services': [],
            'gaming': [],
            'infrastructure': [],
            'web-services': []
        };
        
        for (const [filePath, serviceData] of this.inventory.services.entries()) {
            const clusterType = this.mapServiceToCluster(serviceData.type);
            clusters[clusterType].push({
                file: filePath,
                type: serviceData.type,
                ports: serviceData.ports
            });
        }
        
        return clusters;
    }
    
    /**
     * Map service type to cluster
     */
    mapServiceToCluster(type) {
        const mapping = {
            'document-processor': 'document-processing',
            'template-generator': 'document-processing',
            'ai-service': 'ai-services',
            'ai-orchestrator': 'ai-services',
            'gaming': 'gaming',
            'integration-hub': 'infrastructure',
            'authentication': 'infrastructure',
            'storage': 'infrastructure',
            'database': 'infrastructure'
        };
        
        return mapping[type] || 'web-services';
    }
    
    /**
     * Find files matching pattern
     */
    async findFiles(pattern) {
        try {
            // Use direct filesystem walking instead of glob for better compatibility
            const files = await this.walkDirectory(this.projectRoot, pattern);
            return files;
        } catch (error) {
            console.error(`Failed to find files for pattern ${pattern}:`, error.message);
            return [];
        }
    }
    
    /**
     * Walk directory recursively to find matching files
     */
    async walkDirectory(dir, pattern, results = []) {
        try {
            const entries = await fs.readdir(dir);
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry);
                
                // Skip certain directories
                if (['node_modules', '.git', 'dist', 'build', '.next'].includes(entry)) {
                    continue;
                }
                
                try {
                    const stat = await fs.stat(fullPath);
                    
                    if (stat.isDirectory()) {
                        await this.walkDirectory(fullPath, pattern, results);
                    } else if (stat.isFile()) {
                        // Simple pattern matching
                        if (this.matchesPattern(entry, pattern)) {
                            results.push(fullPath);
                        }
                    }
                } catch (error) {
                    // Skip files we can't access
                    continue;
                }
            }
        } catch (error) {
            // Skip directories we can't access
        }
        
        return results;
    }
    
    /**
     * Simple pattern matching
     */
    matchesPattern(filename, pattern) {
        // Convert glob pattern to regex
        const regex = pattern
            .replace(/\*\*\//g, '') // Remove directory wildcards
            .replace(/\*/g, '.*')   // Convert * to .*
            .replace(/\./g, '\\.')  // Escape dots
            .replace(/\?/g, '.');   // Convert ? to .
        
        const regexPattern = new RegExp(`^${regex}$`, 'i');
        return regexPattern.test(filename);
    }
    
    /**
     * Export inventory as JSON
     */
    exportInventory() {
        const exportData = {
            lastScan: this.inventory.lastScan,
            scanResults: this.inventory.scanResults,
            services: Object.fromEntries(this.inventory.services),
            knownServices: this.knownServices,
            ports: Object.fromEntries(this.inventory.ports),
            apis: Object.fromEntries(this.inventory.apis),
            documents: Object.fromEntries(this.inventory.documents),
            configs: Object.fromEntries(this.inventory.configs),
            containers: Object.fromEntries(this.inventory.containers),
            processes: Object.fromEntries(this.inventory.processes),
            insights: this.inventory.insights
        };
        
        return JSON.stringify(exportData, null, 2);
    }
    
    /**
     * Generate HTML dashboard
     */
    generateDashboard() {
        const services = Object.entries(this.knownServices);
        const runningCount = services.filter(([_, info]) => info.status === 'running').length;
        const stoppedCount = services.filter(([_, info]) => info.status === 'stopped').length;
        
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document Generator - Service Inventory</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
        .stat-card { background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .stat-number { font-size: 2em; font-weight: bold; color: #007AFF; }
        .services-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
        .service-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .service-status { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; }
        .status-running { background: #34C759; color: white; }
        .status-stopped { background: #FF3B30; color: white; }
        .status-unknown { background: #8E8E93; color: white; }
        .port-tag { display: inline-block; background: #007AFF; color: white; padding: 2px 6px; border-radius: 3px; font-size: 0.8em; margin-right: 5px; }
        h1 { margin: 0; color: #333; }
        h2 { color: #666; margin-top: 0; }
        h3 { color: #333; margin-bottom: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Document Generator Service Inventory</h1>
            <p>Last updated: ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${services.length}</div>
                <div>Total Services</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" style="color: #34C759">${runningCount}</div>
                <div>Running</div>
            </div>
            <div class="stat-card">
                <div class="stat-number" style="color: #FF3B30">${stoppedCount}</div>
                <div>Stopped</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${this.inventory.scanResults.documentsFound}</div>
                <div>Documents Found</div>
            </div>
        </div>
        
        <h2>🔧 Services Overview</h2>
        <div class="services-grid">
            ${services.map(([name, info]) => `
                <div class="service-card">
                    <h3>${name}</h3>
                    <span class="service-status status-${info.status}">${info.status.toUpperCase()}</span>
                    <div style="margin: 10px 0;">
                        <span class="port-tag">:${info.port}</span>
                        <span style="color: #666; font-size: 0.9em;">${info.type}</span>
                    </div>
                    ${info.sourceFile ? `<div style="font-size: 0.8em; color: #666;">Source: ${info.sourceFile}</div>` : ''}
                    ${info.accessible !== undefined ? `<div style="font-size: 0.8em; color: ${info.accessible ? '#34C759' : '#FF3B30'};">Network: ${info.accessible ? 'Accessible' : 'Not Accessible'}</div>` : ''}
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;
    }
    
    /**
     * Save inventory to files
     */
    async saveInventory() {
        const outputDir = path.join(this.projectRoot, 'inventory-output');
        await fs.mkdir(outputDir, { recursive: true });
        
        // Save JSON data
        const jsonPath = path.join(outputDir, 'service-inventory.json');
        await fs.writeFile(jsonPath, this.exportInventory());
        
        // Save HTML dashboard
        const htmlPath = path.join(outputDir, 'service-dashboard.html');
        await fs.writeFile(htmlPath, this.generateDashboard());
        
        console.log(`📁 Inventory saved to:`);
        console.log(`   JSON: ${jsonPath}`);
        console.log(`   Dashboard: ${htmlPath}`);
        
        return { jsonPath, htmlPath };
    }
}

// CLI interface
if (require.main === module) {
    const inventory = new MasterServiceInventory();
    
    inventory.runComprehensiveScan()
        .then(async () => {
            const files = await inventory.saveInventory();
            console.log('\n✅ Service inventory complete!');
            console.log('🌐 Open the dashboard to view results:');
            console.log(`   file://${files.htmlPath}`);
        })
        .catch(error => {
            console.error('❌ Inventory failed:', error);
            process.exit(1);
        });
}

module.exports = MasterServiceInventory;