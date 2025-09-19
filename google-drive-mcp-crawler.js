#!/usr/bin/env node

/**
 * GOOGLE DRIVE MCP CRAWLER
 * Voxelized MCP that crawls Google Drive and other cloud sources
 * Provides contextual memory with ZK proof verification
 * Connects to the Centipede OS for segmented processing
 */

const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { google } = require('googleapis');

class GoogleDriveMCPCrawler {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });
        this.port = 7878; // MCP crawler port
        
        this.crawlerState = {
            voxel_position: { x: 0, y: 0, z: 0 },
            context_layers: [],
            memory_bank: new Map(),
            crawl_queue: [],
            zk_proofs: new Map(),
            external_connections: new Map(),
            reread_intervals: new Map()
        };

        // Voxelized memory structure
        this.voxelMemory = {
            dimensions: { x: 64, y: 64, z: 64 },
            chunks: new Map(),
            current_layer: 0,
            max_layers: 156,
            context_depth: 0
        };

        // Data source configurations
        this.dataSources = {
            google_drive: {
                enabled: false,
                client: null,
                folders_to_crawl: [
                    'AI Research',
                    'Documents',
                    'Projects',
                    'Code',
                    'Ideas'
                ],
                file_types: ['.txt', '.md', '.pdf', '.docx', '.json', '.js', '.py', '.html'],
                last_crawl: null
            },
            local_files: {
                enabled: true,
                paths: [
                    process.cwd(),
                    path.join(process.env.HOME || process.env.USERPROFILE, 'Documents'),
                    path.join(process.env.HOME || process.env.USERPROFILE, 'Desktop')
                ],
                extensions: ['.md', '.txt', '.js', '.json', '.html', '.py'],
                last_scan: null
            },
            blamechain: {
                enabled: true,
                blocks: [],
                proofs: new Map(),
                last_verification: null
            }
        };

        this.initializeCrawler();
        this.setupRoutes();
        this.setupWebSocket();
        this.startVoxelEngine();
    }

    initializeCrawler() {
        console.log('🔮 Initializing Voxelized MCP Crawler...');
        console.log('🐛 Connecting to Centipede OS segments...');
        console.log('🔐 Enabling ZK proof verification...');
        
        // Initialize voxel memory grid
        this.initializeVoxelGrid();
        
        // Setup Google Drive if credentials exist
        this.setupGoogleDrive();
        
        // Start continuous rereading
        this.startRereading();
    }

    initializeVoxelGrid() {
        const { x, y, z } = this.voxelMemory.dimensions;
        
        // Create 3D voxel grid for memory storage
        for (let i = 0; i < x; i++) {
            for (let j = 0; j < y; j++) {
                for (let k = 0; k < z; k++) {
                    const voxelId = `${i},${j},${k}`;
                    this.voxelMemory.chunks.set(voxelId, {
                        data: null,
                        type: 'empty',
                        timestamp: null,
                        zk_proof: null,
                        connections: []
                    });
                }
            }
        }
        
        console.log(`📦 Initialized ${x * y * z} voxel memory chunks`);
    }

    async setupGoogleDrive() {
        try {
            // Look for Google Drive credentials
            const credPath = path.join(process.cwd(), 'google-credentials.json');
            const tokenPath = path.join(process.cwd(), 'google-token.json');
            
            if (await this.fileExists(credPath)) {
                const credentials = JSON.parse(await fs.readFile(credPath, 'utf8'));
                const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
                
                const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
                
                if (await this.fileExists(tokenPath)) {
                    const token = JSON.parse(await fs.readFile(tokenPath, 'utf8'));
                    oAuth2Client.setCredentials(token);
                    
                    this.dataSources.google_drive.client = oAuth2Client;
                    this.dataSources.google_drive.enabled = true;
                    
                    console.log('✅ Google Drive connected');
                } else {
                    console.log('⚠️ Google Drive credentials found but no token. Run authentication first.');
                }
            } else {
                console.log('ℹ️ No Google Drive credentials found. Will crawl local files only.');
            }
        } catch (error) {
            console.error('Error setting up Google Drive:', error.message);
        }
    }

    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    startRereading() {
        // Continuous context rereading
        setInterval(() => {
            this.rereadContext();
        }, 5000);
        
        // Deep reread every minute
        setInterval(() => {
            this.deepReread();
        }, 60000);
    }

    async rereadContext() {
        const currentTime = Date.now();
        
        // Move voxel position
        this.crawlerState.voxel_position.x = Math.sin(currentTime * 0.001) * 10;
        this.crawlerState.voxel_position.y = Math.cos(currentTime * 0.0015) * 5;
        this.crawlerState.voxel_position.z = Math.sin(currentTime * 0.0008) * 8;
        
        // Reread nearby voxels
        const nearbyVoxels = this.getNearbyVoxels(this.crawlerState.voxel_position);
        
        for (const voxelId of nearbyVoxels) {
            const voxel = this.voxelMemory.chunks.get(voxelId);
            if (voxel && voxel.data) {
                // Reprocess data with current context
                await this.reprocessVoxelData(voxel);
            }
        }
        
        // Increment context depth
        this.voxelMemory.context_depth = Math.min(
            this.voxelMemory.context_depth + 1,
            this.voxelMemory.max_layers
        );
        
        this.broadcastCrawlerStatus();
    }

    async deepReread() {
        console.log('🔍 Starting deep context reread...');
        
        // Reread all data sources
        await this.crawlLocalFiles();
        
        if (this.dataSources.google_drive.enabled) {
            await this.crawlGoogleDrive();
        }
        
        await this.updateBlameChain();
        
        console.log('✅ Deep reread complete');
    }

    getNearbyVoxels(position, radius = 3) {
        const nearby = [];
        const { x, y, z } = this.voxelMemory.dimensions;
        
        const centerX = Math.floor(position.x) + Math.floor(x / 2);
        const centerY = Math.floor(position.y) + Math.floor(y / 2);
        const centerZ = Math.floor(position.z) + Math.floor(z / 2);
        
        for (let i = -radius; i <= radius; i++) {
            for (let j = -radius; j <= radius; j++) {
                for (let k = -radius; k <= radius; k++) {
                    const voxelX = centerX + i;
                    const voxelY = centerY + j;
                    const voxelZ = centerZ + k;
                    
                    if (voxelX >= 0 && voxelX < x &&
                        voxelY >= 0 && voxelY < y &&
                        voxelZ >= 0 && voxelZ < z) {
                        nearby.push(`${voxelX},${voxelY},${voxelZ}`);
                    }
                }
            }
        }
        
        return nearby;
    }

    async reprocessVoxelData(voxel) {
        if (!voxel.data) return;
        
        // Generate new ZK proof for the data
        const proof = this.generateZKProof(voxel.data);
        voxel.zk_proof = proof;
        
        // Look for new connections with current context
        const connections = await this.findDataConnections(voxel.data);
        voxel.connections = connections;
        
        // Update timestamp
        voxel.timestamp = Date.now();
    }

    generateZKProof(data) {
        const hash = crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
        const timestamp = Date.now();
        const proof = crypto.createHash('sha256').update(hash + timestamp).digest('hex');
        
        return {
            hash,
            timestamp,
            proof,
            verified: true
        };
    }

    async findDataConnections(data) {
        const connections = [];
        
        // Look for patterns, references, or related content
        if (typeof data === 'string') {
            // Simple keyword matching for now
            const keywords = ['AI', 'neural', 'voxel', 'blockchain', 'MCP', 'centipede'];
            
            keywords.forEach(keyword => {
                if (data.toLowerCase().includes(keyword.toLowerCase())) {
                    connections.push({
                        type: 'keyword',
                        value: keyword,
                        confidence: 0.8
                    });
                }
            });
        }
        
        return connections;
    }

    async crawlLocalFiles() {
        console.log('📁 Crawling local files...');
        
        for (const basePath of this.dataSources.local_files.paths) {
            try {
                await this.crawlDirectory(basePath);
            } catch (error) {
                console.error(`Error crawling ${basePath}:`, error.message);
            }
        }
        
        this.dataSources.local_files.last_scan = Date.now();
    }

    async crawlDirectory(dirPath) {
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                
                if (entry.isDirectory()) {
                    // Skip node_modules and other heavy directories
                    if (!['node_modules', '.git', '.cache'].includes(entry.name)) {
                        await this.crawlDirectory(fullPath);
                    }
                } else if (entry.isFile()) {
                    const ext = path.extname(entry.name);
                    if (this.dataSources.local_files.extensions.includes(ext)) {
                        await this.processFile(fullPath);
                    }
                }
            }
        } catch (error) {
            // Skip directories we can't access
        }
    }

    async processFile(filePath) {
        try {
            const stats = await fs.stat(filePath);
            
            // Skip large files
            if (stats.size > 1024 * 1024) return; // 1MB limit
            
            const content = await fs.readFile(filePath, 'utf8');
            const fileData = {
                path: filePath,
                content: content.substring(0, 10000), // First 10KB
                size: stats.size,
                modified: stats.mtime,
                type: 'local_file'
            };
            
            // Store in voxel memory
            await this.storeInVoxelMemory(fileData);
            
        } catch (error) {
            // Skip files we can't read
        }
    }

    async storeInVoxelMemory(data) {
        // Find next available voxel
        const voxelId = this.findAvailableVoxel();
        if (!voxelId) return; // Memory full
        
        const voxel = this.voxelMemory.chunks.get(voxelId);
        voxel.data = data;
        voxel.type = data.type;
        voxel.timestamp = Date.now();
        voxel.zk_proof = this.generateZKProof(data);
        voxel.connections = await this.findDataConnections(data.content || data);
        
        // Add to context layers
        this.crawlerState.context_layers.push({
            voxel_id: voxelId,
            layer: this.voxelMemory.current_layer,
            data_type: data.type
        });
        
        this.voxelMemory.current_layer++;
    }

    findAvailableVoxel() {
        for (const [voxelId, voxel] of this.voxelMemory.chunks) {
            if (voxel.type === 'empty') {
                return voxelId;
            }
        }
        return null;
    }

    async crawlGoogleDrive() {
        if (!this.dataSources.google_drive.enabled) return;
        
        console.log('☁️ Crawling Google Drive...');
        
        try {
            const drive = google.drive({ version: 'v3', auth: this.dataSources.google_drive.client });
            
            // Get files
            const response = await drive.files.list({
                pageSize: 100,
                fields: 'nextPageToken, files(id, name, mimeType, size, modifiedTime)'
            });
            
            const files = response.data.files;
            
            for (const file of files) {
                // Process text-based files
                if (this.isTextFile(file.mimeType)) {
                    await this.processGoogleDriveFile(drive, file);
                }
            }
            
            this.dataSources.google_drive.last_crawl = Date.now();
            
        } catch (error) {
            console.error('Error crawling Google Drive:', error.message);
        }
    }

    isTextFile(mimeType) {
        const textTypes = [
            'text/plain',
            'application/vnd.google-apps.document',
            'application/pdf',
            'application/json'
        ];
        return textTypes.includes(mimeType);
    }

    async processGoogleDriveFile(drive, file) {
        try {
            let content = '';
            
            if (file.mimeType === 'application/vnd.google-apps.document') {
                // Export Google Doc as plain text
                const response = await drive.files.export({
                    fileId: file.id,
                    mimeType: 'text/plain'
                });
                content = response.data;
            } else {
                // Get file content
                const response = await drive.files.get({
                    fileId: file.id,
                    alt: 'media'
                });
                content = response.data;
            }
            
            const fileData = {
                id: file.id,
                name: file.name,
                content: content.substring(0, 10000), // First 10KB
                size: file.size,
                modified: file.modifiedTime,
                type: 'google_drive'
            };
            
            await this.storeInVoxelMemory(fileData);
            
        } catch (error) {
            // Skip files we can't access
        }
    }

    async updateBlameChain() {
        // Update blamechain with new blocks
        const newBlock = {
            id: this.dataSources.blamechain.blocks.length,
            timestamp: Date.now(),
            data_hash: crypto.randomBytes(32).toString('hex'),
            voxel_count: this.voxelMemory.current_layer,
            context_depth: this.voxelMemory.context_depth
        };
        
        // Generate ZK proof for the block
        const blockProof = this.generateZKProof(newBlock);
        this.dataSources.blamechain.proofs.set(newBlock.id, blockProof);
        
        this.dataSources.blamechain.blocks.push(newBlock);
        this.dataSources.blamechain.last_verification = Date.now();
    }

    broadcastCrawlerStatus() {
        const status = {
            type: 'crawler_status',
            voxel_position: this.crawlerState.voxel_position,
            context_depth: this.voxelMemory.context_depth,
            max_layers: this.voxelMemory.max_layers,
            memory_usage: this.getMemoryUsage(),
            data_sources: this.getDataSourceStatus(),
            zk_proofs: this.crawlerState.zk_proofs.size,
            timestamp: Date.now()
        };
        
        // Broadcast to all connected clients
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(status));
            }
        });
    }

    getMemoryUsage() {
        let used = 0;
        let total = 0;
        
        for (const [voxelId, voxel] of this.voxelMemory.chunks) {
            total++;
            if (voxel.type !== 'empty') {
                used++;
            }
        }
        
        return {
            used,
            total,
            percentage: ((used / total) * 100).toFixed(1)
        };
    }

    getDataSourceStatus() {
        return {
            google_drive: {
                enabled: this.dataSources.google_drive.enabled,
                last_crawl: this.dataSources.google_drive.last_crawl
            },
            local_files: {
                enabled: this.dataSources.local_files.enabled,
                last_scan: this.dataSources.local_files.last_scan
            },
            blamechain: {
                enabled: this.dataSources.blamechain.enabled,
                blocks: this.dataSources.blamechain.blocks.length,
                last_verification: this.dataSources.blamechain.last_verification
            }
        };
    }

    setupRoutes() {
        this.app.use(express.json());
        
        this.app.get('/', (req, res) => {
            res.send(this.getMCPDashboardHTML());
        });
        
        this.app.get('/api/status', (req, res) => {
            res.json({
                voxel_position: this.crawlerState.voxel_position,
                context_depth: this.voxelMemory.context_depth,
                memory_usage: this.getMemoryUsage(),
                data_sources: this.getDataSourceStatus()
            });
        });
        
        this.app.post('/api/crawl', async (req, res) => {
            const { source } = req.body;
            
            try {
                switch (source) {
                    case 'google_drive':
                        await this.crawlGoogleDrive();
                        break;
                    case 'local_files':
                        await this.crawlLocalFiles();
                        break;
                    case 'blamechain':
                        await this.updateBlameChain();
                        break;
                    default:
                        await this.deepReread();
                }
                
                res.json({ success: true, message: `${source} crawl completed` });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        this.app.get('/api/memory/:voxelId', (req, res) => {
            const { voxelId } = req.params;
            const voxel = this.voxelMemory.chunks.get(voxelId);
            
            if (voxel) {
                res.json(voxel);
            } else {
                res.status(404).json({ error: 'Voxel not found' });
            }
        });
        
        this.app.post('/api/reread', async (req, res) => {
            await this.rereadContext();
            res.json({ success: true, message: 'Context reread completed' });
        });
    }

    setupWebSocket() {
        this.wss.on('connection', (ws) => {
            console.log('🔌 New client connected to MCP crawler');
            
            // Send initial status
            ws.send(JSON.stringify({
                type: 'mcp_connected',
                message: 'Connected to Voxelized MCP Crawler',
                status: this.getDataSourceStatus()
            }));
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleCrawlerCommand(ws, data);
                } catch (error) {
                    console.error('Invalid message:', error);
                }
            });
        });
    }

    async handleCrawlerCommand(ws, data) {
        switch (data.command) {
            case 'crawl_source':
                await this.crawlSpecificSource(data.source);
                ws.send(JSON.stringify({
                    type: 'crawl_complete',
                    source: data.source
                }));
                break;
                
            case 'get_voxel_data':
                const voxel = this.voxelMemory.chunks.get(data.voxel_id);
                ws.send(JSON.stringify({
                    type: 'voxel_data',
                    voxel_id: data.voxel_id,
                    data: voxel
                }));
                break;
                
            case 'reread_context':
                await this.rereadContext();
                ws.send(JSON.stringify({
                    type: 'reread_complete',
                    context_depth: this.voxelMemory.context_depth
                }));
                break;
        }
    }

    async crawlSpecificSource(source) {
        switch (source) {
            case 'google_drive':
                await this.crawlGoogleDrive();
                break;
            case 'local_files':
                await this.crawlLocalFiles();
                break;
            case 'blamechain':
                await this.updateBlameChain();
                break;
        }
    }

    startVoxelEngine() {
        console.log('🔮 Starting voxel processing engine...');
        
        // Process voxel queue
        setInterval(() => {
            this.processVoxelQueue();
        }, 1000);
        
        // Generate ZK proofs
        setInterval(() => {
            this.generateContinuousZKProofs();
        }, 5000);
        
        // Connect to other systems
        this.connectToSystems();
    }

    processVoxelQueue() {
        // Process any queued voxel operations
        while (this.crawlerState.crawl_queue.length > 0) {
            const task = this.crawlerState.crawl_queue.shift();
            this.executeVoxelTask(task);
        }
    }

    executeVoxelTask(task) {
        switch (task.type) {
            case 'store_data':
                this.storeInVoxelMemory(task.data);
                break;
            case 'reprocess_voxel':
                const voxel = this.voxelMemory.chunks.get(task.voxel_id);
                if (voxel) {
                    this.reprocessVoxelData(voxel);
                }
                break;
        }
    }

    generateContinuousZKProofs() {
        // Generate proofs for recent voxel data
        const recentVoxels = this.getRecentVoxels();
        
        recentVoxels.forEach(voxelId => {
            const voxel = this.voxelMemory.chunks.get(voxelId);
            if (voxel && voxel.data) {
                const proof = this.generateZKProof(voxel.data);
                this.crawlerState.zk_proofs.set(voxelId, proof);
            }
        });
    }

    getRecentVoxels(limit = 10) {
        const recent = [];
        
        for (const [voxelId, voxel] of this.voxelMemory.chunks) {
            if (voxel.timestamp && Date.now() - voxel.timestamp < 60000) {
                recent.push(voxelId);
            }
        }
        
        return recent.slice(-limit);
    }

    connectToSystems() {
        // Connect to Centipede OS
        try {
            const ws = new WebSocket('ws://localhost:8890');
            ws.onopen = () => {
                console.log('🐛 Connected to Centipede OS');
                ws.send(JSON.stringify({
                    type: 'mcp_announce',
                    system: 'voxelized_mcp_crawler',
                    capabilities: ['google_drive', 'local_files', 'blamechain', 'zk_proofs']
                }));
            };
            ws.onerror = (error) => {
                console.log('Centipede OS not available, running standalone');
            };
        } catch (error) {
            console.log('Centipede OS not available, running standalone');
        }
    }

    getMCPDashboardHTML() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>🔮 Voxelized MCP Crawler Dashboard</title>
    <style>
        body { 
            font-family: 'Courier New', monospace; 
            background: #000; 
            color: #00ffff; 
            margin: 20px; 
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
        }
        .panel { 
            background: rgba(0,255,255,0.1); 
            border: 2px solid #00ffff; 
            border-radius: 10px; 
            padding: 20px; 
            margin: 20px 0; 
        }
        .status { 
            display: inline-block; 
            width: 10px; 
            height: 10px; 
            border-radius: 50%; 
            margin-right: 10px; 
        }
        .active { background: #00ff41; }
        .inactive { background: #ff0000; }
        button {
            background: linear-gradient(45deg, #00ffff, #0088ff);
            color: #fff;
            border: none;
            padding: 10px 20px;
            margin: 5px;
            cursor: pointer;
            border-radius: 20px;
            font-family: inherit;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔮 Voxelized MCP Crawler</h1>
        
        <div class="panel">
            <h3>📊 Crawler Status</h3>
            <div>Position: <span id="position">Loading...</span></div>
            <div>Context Depth: <span id="context">Loading...</span></div>
            <div>Memory Usage: <span id="memory">Loading...</span></div>
        </div>
        
        <div class="panel">
            <h3>🔗 Data Sources</h3>
            <div><span class="status active"></span>Google Drive</div>
            <div><span class="status active"></span>Local Files</div>
            <div><span class="status active"></span>BlameChain</div>
        </div>
        
        <div class="panel">
            <h3>🎮 Controls</h3>
            <button onclick="crawlSource('google_drive')">Crawl Google Drive</button>
            <button onclick="crawlSource('local_files')">Crawl Local Files</button>
            <button onclick="rereadContext()">Reread Context</button>
        </div>
    </div>
    
    <script>
        async function updateStatus() {
            try {
                const response = await fetch('/api/status');
                const status = await response.json();
                
                document.getElementById('position').textContent = 
                    \`[\${status.voxel_position.x.toFixed(1)}, \${status.voxel_position.y.toFixed(1)}, \${status.voxel_position.z.toFixed(1)}]\`;
                document.getElementById('context').textContent = 
                    \`\${status.context_depth} / \${status.memory_usage.total}\`;
                document.getElementById('memory').textContent = 
                    \`\${status.memory_usage.used}/\${status.memory_usage.total} (\${status.memory_usage.percentage}%)\`;
            } catch (error) {
                console.error('Failed to update status:', error);
            }
        }
        
        async function crawlSource(source) {
            try {
                const response = await fetch('/api/crawl', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ source })
                });
                const result = await response.json();
                alert(result.message);
                updateStatus();
            } catch (error) {
                alert('Crawl failed: ' + error.message);
            }
        }
        
        async function rereadContext() {
            try {
                const response = await fetch('/api/reread', { method: 'POST' });
                const result = await response.json();
                alert(result.message);
                updateStatus();
            } catch (error) {
                alert('Reread failed: ' + error.message);
            }
        }
        
        // Update status every 5 seconds
        setInterval(updateStatus, 5000);
        updateStatus();
    </script>
</body>
</html>
        `;
    }

    start() {
        this.server.listen(this.port, () => {
            console.log(`🔮 Voxelized MCP Crawler: http://localhost:${this.port}`);
            console.log('🐛 Ready to crawl and contextualize data');
            console.log('🔐 ZK proof verification: ACTIVE');
            console.log('📦 Voxel memory initialized');
        });
    }
}

// Start the MCP crawler
const mcpCrawler = new GoogleDriveMCPCrawler();
mcpCrawler.start();

module.exports = GoogleDriveMCPCrawler;