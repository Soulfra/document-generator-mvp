#!/usr/bin/env node

/**
 * CAL Real Deployment Service
 * 
 * Replaces fake deployment with actual working deployments:
 * 1. Local Docker containers for immediate preview
 * 2. Local network access (192.168.x.x) for testing on other devices
 * 3. Optional cloud deployment to Vercel/Railway
 * 
 * Features:
 * - Spin up Docker containers for generated apps
 * - Port management and proxy routing
 * - Health checking and auto-restart
 * - Cleanup and resource management
 */

const express = require('express');
const { spawn, exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const { promisify } = require('util');

const execAsync = promisify(exec);

class CALRealDeployment {
    constructor(config = {}) {
        this.config = {
            basePort: config.basePort || 4000,
            maxDeployments: config.maxDeployments || 20,
            deploymentTimeout: config.deploymentTimeout || 300000, // 5 minutes
            cleanupInterval: config.cleanupInterval || 600000, // 10 minutes
            workingDir: config.workingDir || path.join(__dirname, '.deployments'),
            ...config
        };
        
        // Track active deployments
        this.deployments = new Map(); // docId -> deployment info
        this.portPool = new Set();
        
        // Initialize port pool
        for (let i = 0; i < this.config.maxDeployments; i++) {
            this.portPool.add(this.config.basePort + i);
        }
        
        this.app = express();
        this.setupRoutes();
        this.startCleanupWorker();
    }
    
    setupRoutes() {
        this.app.use(express.json());
        
        // Deploy endpoint - replaces the fake one
        this.app.post('/deploy/:docId', this.deployApp.bind(this));
        
        // Get deployment status
        this.app.get('/deploy/:docId/status', this.getDeploymentStatus.bind(this));
        
        // Stop deployment
        this.app.delete('/deploy/:docId', this.stopDeployment.bind(this));
        
        // List all deployments
        this.app.get('/deployments', this.listDeployments.bind(this));
        
        // Proxy to deployed apps
        this.app.use('/app/:docId', this.proxyToApp.bind(this));
        
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                activeDeployments: this.deployments.size,
                availablePorts: this.portPool.size,
                networkIp: this.getLocalNetworkIP()
            });
        });
    }
    
    async deployApp(req, res) {
        const { docId } = req.params;
        
        try {
            console.log(`🚀 Starting real deployment for ${docId}...`);
            
            // Get the generated code from the main service
            const codeResponse = await fetch(`http://localhost:3000/download/${docId}`);
            if (!codeResponse.ok) {
                throw new Error('Generated code not found');
            }
            
            const generatedCode = await codeResponse.json();
            
            // Create deployment directory
            const deploymentDir = path.join(this.config.workingDir, docId);
            await fs.mkdir(deploymentDir, { recursive: true });
            
            // Write generated files to disk
            for (const [filename, content] of Object.entries(generatedCode)) {
                const filePath = path.join(deploymentDir, filename);
                await fs.mkdir(path.dirname(filePath), { recursive: true });
                await fs.writeFile(filePath, content);
            }
            
            // Get available port
            if (this.portPool.size === 0) {
                throw new Error('No available ports for deployment');
            }
            
            const port = Array.from(this.portPool)[0];
            this.portPool.delete(port);
            
            // Create Dockerfile if not present
            await this.ensureDockerfile(deploymentDir, generatedCode);
            
            // Build and run Docker container
            const containerName = `cal-app-${docId}`;
            
            await this.buildDockerImage(deploymentDir, containerName);
            await this.runDockerContainer(containerName, port);
            
            // Wait for app to start
            await this.waitForAppStart(port);
            
            const networkIP = this.getLocalNetworkIP();
            const localUrl = `http://localhost:${port}`;
            const networkUrl = `http://${networkIP}:${port}`;
            
            // Store deployment info
            this.deployments.set(docId, {
                docId,
                containerName,
                port,
                localUrl,
                networkUrl,
                deploymentDir,
                startTime: Date.now(),
                status: 'running'
            });
            
            console.log(`✅ Deployed ${docId} to ${networkUrl}`);
            
            res.json({
                success: true,
                docId,
                urls: {
                    local: localUrl,
                    network: networkUrl,
                    proxy: `http://localhost:${this.config.port || 3005}/app/${docId}`
                },
                port,
                containerName,
                status: 'running',
                message: 'Successfully deployed to local Docker container'
            });
            
        } catch (error) {
            console.error(`❌ Deployment failed for ${docId}:`, error);
            
            res.status(500).json({
                success: false,
                error: error.message,
                docId
            });
        }
    }
    
    async ensureDockerfile(deploymentDir, generatedCode) {
        const dockerfilePath = path.join(deploymentDir, 'Dockerfile');
        
        try {
            await fs.access(dockerfilePath);
            console.log('📄 Using existing Dockerfile');
        } catch {
            // Create basic Dockerfile based on generated code
            let dockerfile = '';
            
            if (generatedCode['package.json']) {
                // Node.js app
                dockerfile = `
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
`.trim();
            } else if (generatedCode['index.html']) {
                // Static HTML app
                dockerfile = `
FROM nginx:alpine

COPY . /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
`.trim();
            } else {
                // Default Node.js
                dockerfile = `
FROM node:18-alpine

WORKDIR /app

COPY . .

# Install dependencies if package.json exists
RUN if [ -f package.json ]; then npm install; fi

EXPOSE 3000

# Try different start commands
CMD if [ -f package.json ]; then npm start; elif [ -f server.js ]; then node server.js; elif [ -f index.js ]; then node index.js; else python3 -m http.server 3000; fi
`.trim();
            }
            
            await fs.writeFile(dockerfilePath, dockerfile);
            console.log('📄 Created Dockerfile');
        }
    }
    
    async buildDockerImage(deploymentDir, containerName) {
        console.log(`🏗️  Building Docker image for ${containerName}...`);
        
        const buildCommand = `docker build -t ${containerName} .`;
        
        const { stdout, stderr } = await execAsync(buildCommand, {
            cwd: deploymentDir,
            timeout: 120000 // 2 minutes
        });
        
        if (stderr && stderr.includes('ERROR') && !stderr.includes('WARNING') && !stderr.includes('DONE')) {
            throw new Error(`Docker build failed: ${stderr}`);
        }
        
        console.log(`✅ Built Docker image: ${containerName}`);
    }
    
    async runDockerContainer(containerName, port) {
        console.log(`🏃 Starting Docker container: ${containerName} on port ${port}...`);
        
        // Stop and remove existing container if it exists
        try {
            await execAsync(`docker stop ${containerName}`);
            await execAsync(`docker rm ${containerName}`);
        } catch {
            // Container doesn't exist, that's fine
        }
        
        const runCommand = `docker run -d --name ${containerName} -p ${port}:3000 --restart unless-stopped ${containerName}`;
        
        const { stdout, stderr } = await execAsync(runCommand);
        
        if (stderr) {
            throw new Error(`Docker run failed: ${stderr}`);
        }
        
        console.log(`✅ Started Docker container: ${containerName}`);
    }
    
    async waitForAppStart(port, maxAttempts = 30) {
        console.log(`⏳ Waiting for app to start on port ${port}...`);
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                const response = await fetch(`http://localhost:${port}`, {
                    signal: AbortSignal.timeout(2000)
                });
                
                if (response.ok) {
                    console.log(`✅ App is responding on port ${port}`);
                    return;
                }
            } catch {
                // App not ready yet
            }
            
            if (attempt < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
        throw new Error(`App failed to start on port ${port} after ${maxAttempts} attempts`);
    }
    
    async getDeploymentStatus(req, res) {
        const { docId } = req.params;
        const deployment = this.deployments.get(docId);
        
        if (!deployment) {
            return res.status(404).json({ error: 'Deployment not found' });
        }
        
        // Check if container is still running
        try {
            const { stdout } = await execAsync(`docker ps -q -f name=${deployment.containerName}`);
            const isRunning = stdout.trim().length > 0;
            
            deployment.status = isRunning ? 'running' : 'stopped';
            
            res.json(deployment);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async stopDeployment(req, res) {
        const { docId } = req.params;
        const deployment = this.deployments.get(docId);
        
        if (!deployment) {
            return res.status(404).json({ error: 'Deployment not found' });
        }
        
        try {
            // Stop and remove Docker container
            await execAsync(`docker stop ${deployment.containerName}`);
            await execAsync(`docker rm ${deployment.containerName}`);
            
            // Remove Docker image
            await execAsync(`docker rmi ${deployment.containerName}`);
            
            // Return port to pool
            this.portPool.add(deployment.port);
            
            // Remove deployment directory
            await execAsync(`rm -rf ${deployment.deploymentDir}`);
            
            // Remove from tracking
            this.deployments.delete(docId);
            
            console.log(`🗑️  Stopped deployment: ${docId}`);
            
            res.json({
                success: true,
                message: 'Deployment stopped and cleaned up',
                docId
            });
            
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async listDeployments(req, res) {
        const deploymentList = Array.from(this.deployments.values()).map(deployment => ({
            docId: deployment.docId,
            status: deployment.status,
            urls: {
                local: deployment.localUrl,
                network: deployment.networkUrl
            },
            uptime: Date.now() - deployment.startTime,
            port: deployment.port
        }));
        
        res.json({
            deployments: deploymentList,
            total: deploymentList.length,
            availablePorts: this.portPool.size
        });
    }
    
    // Simple proxy to deployed apps
    async proxyToApp(req, res) {
        const { docId } = req.params;
        const deployment = this.deployments.get(docId);
        
        if (!deployment || deployment.status !== 'running') {
            return res.status(404).json({ error: 'App not found or not running' });
        }
        
        try {
            const targetUrl = `http://localhost:${deployment.port}${req.path}`;
            const response = await fetch(targetUrl, {
                method: req.method,
                headers: req.headers,
                body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
            });
            
            const data = await response.text();
            res.status(response.status).send(data);
            
        } catch (error) {
            res.status(500).json({ error: 'Failed to proxy request' });
        }
    }
    
    getLocalNetworkIP() {
        const interfaces = os.networkInterfaces();
        
        for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name]) {
                // Skip internal and non-IPv4 addresses
                if (iface.family === 'IPv4' && !iface.internal) {
                    return iface.address;
                }
            }
        }
        
        return 'localhost';
    }
    
    startCleanupWorker() {
        setInterval(async () => {
            console.log('🧹 Running deployment cleanup...');
            
            const now = Date.now();
            const deploymentsToClean = [];
            
            for (const [docId, deployment] of this.deployments) {
                // Clean up deployments older than timeout
                if (now - deployment.startTime > this.config.deploymentTimeout) {
                    deploymentsToClean.push(docId);
                }
            }
            
            for (const docId of deploymentsToClean) {
                try {
                    console.log(`🗑️  Auto-cleaning expired deployment: ${docId}`);
                    await this.stopDeployment({ params: { docId } }, { json: () => {} });
                } catch (error) {
                    console.error(`Failed to clean deployment ${docId}:`, error);
                }
            }
            
        }, this.config.cleanupInterval);
    }
    
    async start(port = 3005) {
        await fs.mkdir(this.config.workingDir, { recursive: true });
        
        this.config.port = port;
        
        return new Promise((resolve, reject) => {
            this.server = this.app.listen(port, '0.0.0.0', () => {
                const networkIP = this.getLocalNetworkIP();
                
                console.log('🚀 CAL REAL DEPLOYMENT SERVICE');
                console.log('==============================');
                console.log('');
                console.log(`🌐 Local: http://localhost:${port}`);
                console.log(`📱 Network: http://${networkIP}:${port}`);
                console.log('');
                console.log('🐳 Docker deployments:');
                console.log(`   • Port range: ${this.config.basePort}-${this.config.basePort + this.config.maxDeployments - 1}`);
                console.log(`   • Max deployments: ${this.config.maxDeployments}`);
                console.log(`   • Auto-cleanup: ${this.config.deploymentTimeout / 60000} minutes`);
                console.log('');
                console.log('📊 API endpoints:');
                console.log(`   • POST /${port}/deploy/:docId - Deploy app`);
                console.log(`   • GET  /${port}/deploy/:docId/status - Check status`);
                console.log(`   • GET  /${port}/deployments - List all`);
                console.log(`   • DELETE /${port}/deploy/:docId - Stop app`);
                console.log('');
                
                resolve();
            });
            
            this.server.on('error', reject);
        });
    }
    
    async stop() {
        console.log('🛑 Stopping all deployments...');
        
        // Stop all deployments
        const deploymentIds = Array.from(this.deployments.keys());
        for (const docId of deploymentIds) {
            try {
                await this.stopDeployment({ params: { docId } }, { json: () => {} });
            } catch (error) {
                console.error(`Failed to stop deployment ${docId}:`, error);
            }
        }
        
        if (this.server) {
            this.server.close();
        }
    }
}

module.exports = CALRealDeployment;

// CLI interface if run directly
if (require.main === module) {
    const deployment = new CALRealDeployment({
        basePort: 4000,
        maxDeployments: 10,
        deploymentTimeout: 600000 // 10 minutes
    });
    
    deployment.start(3005).then(() => {
        console.log('✅ Real deployment service is ready!');
        console.log('');
        console.log('🔗 Integration:');
        console.log('   Replace the fake deploy endpoint in simp-tag.js');
        console.log('   Point /deploy/:docId to http://localhost:3005/deploy/:docId');
        console.log('');
        
    }).catch(error => {
        console.error('❌ Failed to start deployment service:', error);
        process.exit(1);
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Shutting down deployment service...');
        await deployment.stop();
        process.exit(0);
    });
}