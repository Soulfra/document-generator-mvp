#!/usr/bin/env node

/**
 * 🎯 PRODUCTION FILE SWIPER
 * 
 * Memory-efficient, robust file duplicate detection with smart filtering
 * Focuses on code files, excludes binaries, limits depth, handles large codebases
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const WebSocket = require('ws');
const http = require('http');

class ProductionFileSwiper {
    constructor() {
        this.port = 3008;
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });
        
        // Smart filtering configuration
        this.config = {
            maxDepth: 3,
            maxFileSize: 10 * 1024 * 1024, // 10MB
            batchSize: 25,
            progressSaveInterval: 50,
        };
        
        // File filtering
        this.includeExtensions = new Set([
            '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.h',
            '.md', '.txt', '.json', '.xml', '.html', '.css', '.scss', '.sql',
            '.sh', '.bat', '.yml', '.yaml', '.toml', '.ini', '.cfg'
        ]);
        
        this.excludeDirectories = new Set([
            'node_modules', '.git', '.svn', '.hg', 'dist', 'build', 'out',
            'target', 'bin', 'obj', '__pycache__', '.pytest_cache', 'coverage',
            '.next', '.nuxt', 'vendor', 'bower_components', '.vscode', '.idea',
            'tmp', 'temp', 'cache', 'logs', '.DS_Store', 'Thumbs.db'
        ]);
        
        this.excludePatterns = [
            /^\./, // Hidden files
            /~$/, // Backup files
            /\.bak$/, /\.backup$/, /\.old$/,
            /\.log$/, /\.tmp$/, /\.cache$/,
            /node_modules/, /\.git/, /dist/, /build/
        ];
        
        // Runtime state
        this.fileGroups = new Map(); // hash -> [files]
        this.decisions = [];
        this.processedCount = 0;
        this.skippedCount = 0;
        this.duplicateCount = 0;
        this.clients = new Set();
        this.scanProgress = {
            phase: 'idle', // idle, scanning, processing, complete
            currentPath: '',
            processed: 0,
            found: 0,
            duplicates: 0,
            startTime: null,
            eta: null
        };
        
        console.log('🎯 PRODUCTION FILE SWIPER');
        console.log('🔧 Smart filtering for code files only');
        console.log('📊 Memory-efficient batch processing');
        console.log('🚀 Production-ready duplicate detection');
    }
    
    async start() {
        this.setupRoutes();
        this.setupWebSocket();
        
        this.server.listen(this.port, () => {
            console.log(`\n🚀 Production File Swiper running at http://localhost:${this.port}`);
            console.log('📊 Ready to scan with smart filtering...\n');
            
            // Start scanning immediately with better filtering
            this.startSmartScan();
        });
    }
    
    setupRoutes() {
        this.app.use(express.json());
        
        // Main interface
        this.app.get('/', (req, res) => {
            res.send(this.getInterface());
        });
        
        // Get file pairs for swipe decision
        this.app.get('/api/file-pairs', (req, res) => {
            const pairs = this.getFilePairsForDecision();
            res.json(pairs);
        });
        
        // Record swipe decision
        this.app.post('/api/decision', (req, res) => {
            const { file1, file2, decision, reasoning } = req.body;
            this.recordDecision(file1, file2, decision, reasoning);
            res.json({ success: true });
        });
        
        // Get file preview
        this.app.get('/api/file-content/:path(*)', async (req, res) => {
            try {
                const filePath = req.params.path;
                const content = await this.getFilePreview(filePath);
                res.json(content);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Get scan progress
        this.app.get('/api/progress', (req, res) => {
            res.json(this.scanProgress);
        });
        
        // Control scan (pause/resume/restart)
        this.app.post('/api/scan/:action', (req, res) => {
            const action = req.params.action;
            
            switch (action) {
                case 'pause':
                    this.scanProgress.phase = 'paused';
                    break;
                case 'resume':
                    if (this.scanProgress.phase === 'paused') {
                        this.scanProgress.phase = 'scanning';
                    }
                    break;
                case 'restart':
                    this.restartScan();
                    break;
            }
            
            res.json({ success: true, phase: this.scanProgress.phase });
        });
    }
    
    setupWebSocket() {
        this.wss.on('connection', (ws) => {
            this.clients.add(ws);
            console.log('📱 Client connected');
            
            // Send current progress
            ws.send(JSON.stringify({
                type: 'progress',
                data: this.scanProgress
            }));
            
            ws.on('close', () => {
                this.clients.delete(ws);
            });
        });
    }
    
    broadcast(message) {
        const data = JSON.stringify(message);
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    }
    
    async startSmartScan() {
        console.log('🔍 Starting smart scan with filtering...');
        
        this.scanProgress = {
            phase: 'scanning',
            currentPath: process.cwd(),
            processed: 0,
            found: 0,
            duplicates: 0,
            startTime: Date.now(),
            eta: null
        };
        
        try {
            // Phase 1: Find all relevant files
            const relevantFiles = await this.findRelevantFiles('.');
            
            console.log(`📊 Found ${relevantFiles.length} relevant files (filtered from potentially 58K+)`);
            
            this.scanProgress.phase = 'processing';
            this.scanProgress.found = relevantFiles.length;
            
            this.broadcast({
                type: 'scan_phase',
                data: {
                    phase: 'processing',
                    totalFiles: relevantFiles.length,
                    message: `Processing ${relevantFiles.length} code files...`
                }
            });
            
            // Phase 2: Process files in memory-efficient batches
            await this.processFilesInBatches(relevantFiles);
            
            // Phase 3: Generate duplicate groups
            const duplicateGroups = this.generateDuplicateGroups();
            
            this.scanProgress.phase = 'complete';
            this.scanProgress.duplicates = duplicateGroups.length;
            
            console.log(`\n✅ Scan complete!`);
            console.log(`📊 ${relevantFiles.length} files processed`);
            console.log(`🔍 ${duplicateGroups.length} duplicate groups found`);
            console.log(`⏱️  Scan time: ${((Date.now() - this.scanProgress.startTime) / 1000).toFixed(1)}s`);
            
            this.broadcast({
                type: 'scan_complete',
                data: {
                    totalFiles: relevantFiles.length,
                    duplicateGroups: duplicateGroups.length,
                    scanTime: (Date.now() - this.scanProgress.startTime) / 1000
                }
            });
            
        } catch (error) {
            console.error('❌ Scan failed:', error.message);
            this.scanProgress.phase = 'error';
            this.scanProgress.error = error.message;
            
            this.broadcast({
                type: 'scan_error',
                data: { error: error.message }
            });
        }
    }
    
    async findRelevantFiles(rootPath, currentDepth = 0) {
        const relevantFiles = [];
        
        if (currentDepth > this.config.maxDepth) {
            return relevantFiles;
        }
        
        try {
            const entries = await fs.readdir(rootPath, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(rootPath, entry.name);
                
                // Skip excluded directories and patterns
                if (this.shouldSkipPath(entry.name, fullPath)) {
                    this.skippedCount++;
                    continue;
                }
                
                if (entry.isFile()) {
                    // Check if it's a relevant file type
                    if (this.isRelevantFile(fullPath)) {
                        try {
                            const stats = await fs.stat(fullPath);
                            
                            // Skip files that are too large
                            if (stats.size > this.config.maxFileSize) {
                                this.skippedCount++;
                                continue;
                            }
                            
                            relevantFiles.push({
                                path: fullPath,
                                size: stats.size,
                                modified: stats.mtime
                            });
                            
                        } catch (error) {
                            // Skip files we can't access
                            this.skippedCount++;
                        }
                    } else {
                        this.skippedCount++;
                    }
                } else if (entry.isDirectory()) {
                    // Recursively scan subdirectories
                    const subFiles = await this.findRelevantFiles(fullPath, currentDepth + 1);
                    relevantFiles.push(...subFiles);
                }
                
                // Update progress every 100 files
                if ((relevantFiles.length + this.skippedCount) % 100 === 0) {
                    this.scanProgress.currentPath = fullPath;
                    this.scanProgress.processed = relevantFiles.length + this.skippedCount;
                    
                    this.broadcast({
                        type: 'scan_progress',
                        data: {
                            currentPath: path.basename(fullPath),
                            processed: this.scanProgress.processed,
                            found: relevantFiles.length,
                            skipped: this.skippedCount
                        }
                    });
                }
            }
            
        } catch (error) {
            // Skip directories we can't access
            console.warn(`⚠️ Cannot access: ${rootPath}`);
        }
        
        return relevantFiles;
    }
    
    shouldSkipPath(name, fullPath) {
        // Check excluded directories
        if (this.excludeDirectories.has(name)) {
            return true;
        }
        
        // Check excluded patterns
        for (const pattern of this.excludePatterns) {
            if (pattern.test(name) || pattern.test(fullPath)) {
                return true;
            }
        }
        
        return false;
    }
    
    isRelevantFile(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        
        // Must have an extension we care about
        if (!this.includeExtensions.has(ext)) {
            return false;
        }
        
        const basename = path.basename(filePath).toLowerCase();
        
        // Skip minified files
        if (basename.includes('.min.')) {
            return false;
        }
        
        // Skip test coverage files
        if (basename.includes('coverage') || basename.includes('.spec.') || basename.includes('.test.')) {
            return false;
        }
        
        return true;
    }
    
    async processFilesInBatches(files) {
        const batches = [];
        for (let i = 0; i < files.length; i += this.config.batchSize) {
            batches.push(files.slice(i, i + this.config.batchSize));
        }
        
        console.log(`📦 Processing ${batches.length} batches of ${this.config.batchSize} files each...`);
        
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            
            // Check if scan is paused
            while (this.scanProgress.phase === 'paused') {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            await this.processBatch(batch);
            
            // Update progress
            this.processedCount += batch.length;
            this.scanProgress.processed = this.processedCount;
            
            // Calculate ETA
            const elapsed = Date.now() - this.scanProgress.startTime;
            const rate = this.processedCount / elapsed; // files per ms
            const remaining = files.length - this.processedCount;
            this.scanProgress.eta = remaining > 0 ? remaining / rate : 0;
            
            if (i % 10 === 0) { // Update every 10 batches
                console.log(`📊 Processed ${this.processedCount}/${files.length} files (${Math.round((this.processedCount / files.length) * 100)}%)`);
                
                this.broadcast({
                    type: 'batch_progress',
                    data: {
                        processed: this.processedCount,
                        total: files.length,
                        percent: Math.round((this.processedCount / files.length) * 100),
                        eta: Math.round(this.scanProgress.eta / 1000), // seconds
                        duplicatesFound: Array.from(this.fileGroups.values()).filter(group => group.length > 1).length
                    }
                });
            }
            
            // Small delay to prevent overwhelming the system
            await new Promise(resolve => setTimeout(resolve, 10));
            
            // Force garbage collection every 20 batches
            if (i % 20 === 0 && global.gc) {
                global.gc();
            }
        }
    }
    
    async processBatch(batch) {
        for (const fileInfo of batch) {
            try {
                const hash = await this.getFileHash(fileInfo.path);
                
                if (!this.fileGroups.has(hash)) {
                    this.fileGroups.set(hash, []);
                }
                
                this.fileGroups.get(hash).push({
                    ...fileInfo,
                    hash
                });
                
            } catch (error) {
                // Skip problematic files
                console.warn(`⚠️ Cannot process: ${fileInfo.path}`);
            }
        }
    }
    
    async getFileHash(filePath) {
        try {
            // For code files, create hash from content
            const content = await fs.readFile(filePath, 'utf8');
            
            // Normalize content for better duplicate detection
            const normalized = content
                .replace(/\r\n/g, '\n') // Normalize line endings
                .replace(/\s+$/gm, '') // Remove trailing whitespace
                .trim();
            
            return crypto.createHash('md5').update(normalized).digest('hex');
            
        } catch (error) {
            // If we can't read as text, hash the binary content
            const content = await fs.readFile(filePath);
            return crypto.createHash('md5').update(content).digest('hex');
        }
    }
    
    generateDuplicateGroups() {
        const duplicateGroups = [];
        
        for (const [hash, files] of this.fileGroups) {
            if (files.length > 1) {
                duplicateGroups.push({
                    hash,
                    files: files.sort((a, b) => a.path.localeCompare(b.path)),
                    count: files.length,
                    totalSize: files.reduce((sum, f) => sum + f.size, 0),
                    wastedSpace: files.slice(1).reduce((sum, f) => sum + f.size, 0)
                });
            }
        }
        
        // Sort by wasted space (most wasteful first)
        return duplicateGroups.sort((a, b) => b.wastedSpace - a.wastedSpace);
    }
    
    getFilePairsForDecision() {
        const pairs = [];
        let pairId = 0;
        
        // Get top 20 duplicate groups by wasted space
        const duplicateGroups = this.generateDuplicateGroups().slice(0, 20);
        
        for (const group of duplicateGroups) {
            // Create pairs within each group (just first vs others for simplicity)
            const baseFile = group.files[0];
            
            for (let i = 1; i < group.files.length && pairs.length < 15; i++) {
                pairs.push({
                    id: pairId++,
                    file1_path: baseFile.path,
                    file2_path: group.files[i].path,
                    similarity_score: 1.0, // Exact duplicates
                    type: 'exact_duplicate',
                    wasted_space: group.files[i].size
                });
            }
            
            if (pairs.length >= 15) break;
        }
        
        return pairs;
    }
    
    recordDecision(file1, file2, decision, reasoning) {
        this.decisions.push({
            file1,
            file2,
            decision,
            reasoning,
            timestamp: new Date().toISOString()
        });
        
        console.log(`✅ Decision: ${decision} for ${path.basename(file1)} & ${path.basename(file2)}`);
        
        this.broadcast({
            type: 'decision_recorded',
            data: {
                decision,
                files: [path.basename(file1), path.basename(file2)],
                total_decisions: this.decisions.length
            }
        });
    }
    
    async getFilePreview(filePath) {
        try {
            const stats = await fs.stat(filePath);
            let preview = '';
            
            if (stats.size < 5000) { // 5KB limit for preview
                try {
                    const content = await fs.readFile(filePath, 'utf8');
                    preview = content.slice(0, 800); // First 800 chars
                } catch (error) {
                    preview = 'Binary file or encoding issue';
                }
            } else {
                preview = 'File too large for preview';
            }
            
            return {
                name: path.basename(filePath),
                path: filePath,
                size: stats.size,
                modified: stats.mtime,
                preview,
                lines: preview.split('\n').length,
                type: path.extname(filePath) || 'unknown'
            };
            
        } catch (error) {
            throw new Error(`Cannot read file: ${error.message}`);
        }
    }
    
    restartScan() {
        // Clear existing data
        this.fileGroups.clear();
        this.decisions = [];
        this.processedCount = 0;
        this.skippedCount = 0;
        
        // Restart scan
        this.startSmartScan();
    }
    
    getInterface() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎯 Production File Swiper</title>
    <script src="https://hammerjs.github.io/dist/hammer.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; min-height: 100vh; padding: 20px;
        }
        
        .container { max-width: 600px; margin: 0 auto; }
        
        .header { text-align: center; margin-bottom: 2rem; }
        .header h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
        .header .subtitle { opacity: 0.9; margin-bottom: 1rem; }
        
        .progress-section { 
            background: rgba(255,255,255,0.1); padding: 20px; 
            border-radius: 15px; margin-bottom: 20px;
            backdrop-filter: blur(10px);
        }
        
        .progress-bar { 
            background: rgba(255,255,255,0.2); height: 8px; 
            border-radius: 4px; overflow: hidden; margin: 10px 0;
        }
        .progress-fill { 
            background: linear-gradient(90deg, #4ecdc4, #44a08d);
            height: 100%; transition: width 0.3s ease;
        }
        
        .stats { 
            display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
            gap: 15px; margin-top: 15px;
        }
        .stat { text-align: center; }
        .stat-number { font-size: 1.3rem; font-weight: bold; }
        .stat-label { font-size: 0.8rem; opacity: 0.8; }
        
        .controls { 
            display: flex; gap: 10px; justify-content: center; 
            margin: 20px 0;
        }
        .control-btn { 
            padding: 8px 16px; border: none; border-radius: 20px;
            background: rgba(255,255,255,0.2); color: white;
            cursor: pointer; transition: all 0.3s ease;
        }
        .control-btn:hover { background: rgba(255,255,255,0.3); }
        
        .card-stack { 
            position: relative; height: 500px; 
            margin: 20px 0;
        }
        
        .file-card { 
            position: absolute; width: 100%; height: 100%; 
            background: white; border-radius: 20px; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            color: #333; padding: 20px; cursor: grab;
            overflow: hidden; transition: transform 0.3s ease;
        }
        .file-card:active { cursor: grabbing; }
        .file-card.swiping { transition: none; }
        
        .similarity-badge { 
            background: linear-gradient(45deg, #ff6b6b, #ffd93d);
            color: white; padding: 8px 15px; border-radius: 20px;
            position: absolute; top: 15px; right: 15px;
            font-weight: bold; font-size: 0.9rem;
        }
        
        .file-comparison { 
            display: flex; gap: 15px; margin-top: 50px; 
            height: calc(100% - 120px);
        }
        .file-preview { 
            flex: 1; background: #f8f9fa; padding: 15px; 
            border-radius: 10px; overflow: hidden;
            display: flex; flex-direction: column;
        }
        .file-name { 
            font-weight: bold; margin-bottom: 10px; color: #2c3e50;
            font-size: 0.9rem; word-break: break-all;
        }
        .file-meta { 
            font-size: 0.75rem; color: #7f8c8d; margin-bottom: 10px; 
        }
        .file-content { 
            font-family: 'Monaco', 'Menlo', monospace; font-size: 0.7rem; 
            background: white; padding: 10px; border-radius: 5px;
            border: 1px solid #e9ecef; flex: 1; overflow-y: auto;
            line-height: 1.3;
        }
        
        .reasoning-section {
            background: #f1f3f4; border-radius: 10px; 
            padding: 15px; margin-top: 15px;
        }
        .reasoning-title { 
            font-weight: bold; color: #2c3e50; margin-bottom: 10px; 
            font-size: 0.9rem;
        }
        .reasoning-list { 
            list-style: none; 
        }
        .reasoning-list li { 
            margin-bottom: 5px; padding-left: 15px; 
            position: relative; font-size: 0.8rem; color: #5a6c7d;
        }
        .reasoning-list li::before { 
            content: '•'; position: absolute; left: 0; 
            color: #3498db; font-weight: bold;
        }
        
        .action-hints { 
            position: absolute; font-size: 3rem; font-weight: bold;
            opacity: 0; transition: opacity 0.3s ease; pointer-events: none;
        }
        .action-hints.left { 
            left: 20px; top: 50%; transform: translateY(-50%); color: #e74c3c; 
        }
        .action-hints.right { 
            right: 20px; top: 50%; transform: translateY(-50%); color: #27ae60; 
        }
        .action-hints.up { 
            top: 20px; left: 50%; transform: translateX(-50%); color: #3498db; 
        }
        .action-hints.down { 
            bottom: 20px; left: 50%; transform: translateX(-50%); color: #f39c12; 
        }
        
        .swipe-controls { 
            position: fixed; bottom: 30px; left: 50%; 
            transform: translateX(-50%); display: flex; gap: 15px;
        }
        .swipe-btn { 
            width: 60px; height: 60px; border-radius: 50%;
            border: none; color: white; font-size: 1.3rem;
            cursor: pointer; transition: all 0.3s ease;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        .swipe-btn:hover { transform: scale(1.1); }
        .swipe-btn.reject { background: linear-gradient(45deg, #e74c3c, #c0392b); }
        .swipe-btn.keep-both { background: linear-gradient(45deg, #3498db, #2980b9); }
        .swipe-btn.accept { background: linear-gradient(45deg, #27ae60, #229954); }
        .swipe-btn.auto { background: linear-gradient(45deg, #f39c12, #e67e22); }
        
        .loading, .empty-state, .scanning { 
            text-align: center; padding: 60px 20px; 
            background: rgba(255,255,255,0.1); border-radius: 20px;
            backdrop-filter: blur(10px);
        }
        
        .spinner { 
            width: 40px; height: 40px; margin: 0 auto 20px;
            border: 3px solid rgba(255,255,255,0.3);
            border-top: 3px solid white; border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin { 
            0% { transform: rotate(0deg); } 
            100% { transform: rotate(360deg); } 
        }
        
        .notification { 
            position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
            background: rgba(0,0,0,0.8); color: white; padding: 15px 25px;
            border-radius: 25px; opacity: 0; transition: opacity 0.3s ease;
            z-index: 1000;
        }
        .notification.show { opacity: 1; }
        
        .phase-indicator {
            display: inline-block; padding: 4px 8px; border-radius: 12px;
            font-size: 0.7rem; font-weight: bold; text-transform: uppercase;
        }
        .phase-scanning { background: #3498db; }
        .phase-processing { background: #f39c12; }
        .phase-complete { background: #27ae60; }
        .phase-error { background: #e74c3c; }
        .phase-paused { background: #95a5a6; }
        
        @media (max-width: 600px) {
            .container { padding: 10px; }
            .header h1 { font-size: 2rem; }
            .card-stack { height: 400px; }
            .file-comparison { flex-direction: column; height: auto; }
            .file-preview { min-height: 150px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 File Swiper</h1>
            <div class="subtitle">Production-ready duplicate detection for code files</div>
        </div>
        
        <div class="progress-section">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <strong>Scan Progress</strong>
                <span class="phase-indicator" id="phase-indicator">Initializing</span>
            </div>
            
            <div class="progress-bar">
                <div class="progress-fill" id="progress-fill" style="width: 0%"></div>
            </div>
            
            <div id="progress-text">Starting up...</div>
            
            <div class="stats">
                <div class="stat">
                    <div class="stat-number" id="processed-count">0</div>
                    <div class="stat-label">Processed</div>
                </div>
                <div class="stat">
                    <div class="stat-number" id="found-count">0</div>
                    <div class="stat-label">Code Files</div>
                </div>
                <div class="stat">
                    <div class="stat-number" id="duplicates-count">0</div>
                    <div class="stat-label">Duplicates</div>
                </div>
                <div class="stat">
                    <div class="stat-number" id="decisions-count">0</div>
                    <div class="stat-label">Decisions</div>
                </div>
            </div>
            
            <div class="controls">
                <button class="control-btn" onclick="controlScan('pause')" id="pause-btn">⏸️ Pause</button>
                <button class="control-btn" onclick="controlScan('resume')" id="resume-btn">▶️ Resume</button>
                <button class="control-btn" onclick="controlScan('restart')" id="restart-btn">🔄 Restart</button>
            </div>
        </div>
        
        <div class="card-stack" id="card-stack">
            <div class="scanning">
                <div class="spinner"></div>
                <h2>🔍 Smart Scanning</h2>
                <p>Filtering code files and detecting duplicates...</p>
                <div id="scan-details" style="margin-top: 15px; font-size: 0.9rem; opacity: 0.8;"></div>
            </div>
        </div>
        
        <div class="swipe-controls">
            <button class="swipe-btn reject" title="Delete Both (Swipe Left)" onclick="swipeLeft()">🗑️</button>
            <button class="swipe-btn keep-both" title="Keep Both (Swipe Up)" onclick="swipeUp()">📄</button>
            <button class="swipe-btn accept" title="Keep Better (Swipe Right)" onclick="swipeRight()">✅</button>
            <button class="swipe-btn auto" title="Auto-decide (Swipe Down)" onclick="swipeDown()">🤖</button>
        </div>
    </div>
    
    <div class="notification" id="notification"></div>
    
    <script>
        let filePairs = [];
        let currentIndex = 0;
        let decisions = [];
        let scanProgress = { phase: 'idle' };
        
        // WebSocket connection
        const ws = new WebSocket('ws://localhost:3008');
        
        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            
            switch (message.type) {
                case 'progress':
                    updateProgress(message.data);
                    break;
                case 'scan_phase':
                    updateScanPhase(message.data);
                    break;
                case 'scan_progress':
                    updateScanProgress(message.data);
                    break;
                case 'batch_progress':
                    updateBatchProgress(message.data);
                    break;
                case 'scan_complete':
                    onScanComplete(message.data);
                    break;
                case 'scan_error':
                    onScanError(message.data);
                    break;
                case 'decision_recorded':
                    onDecisionRecorded(message.data);
                    break;
            }
        };
        
        function updateProgress(data) {
            scanProgress = data;
            updateProgressUI();
        }
        
        function updateScanPhase(data) {
            scanProgress.phase = data.phase;
            document.getElementById('scan-details').textContent = data.message || '';
            updateProgressUI();
        }
        
        function updateScanProgress(data) {
            document.getElementById('processed-count').textContent = data.processed || 0;
            document.getElementById('found-count').textContent = data.found || 0;
            document.getElementById('scan-details').textContent = 
                \`Currently scanning: \${data.currentPath || 'Files...'}\`;
        }
        
        function updateBatchProgress(data) {
            const percent = data.percent || 0;
            document.getElementById('progress-fill').style.width = \`\${percent}%\`;
            document.getElementById('processed-count').textContent = data.processed || 0;
            document.getElementById('duplicates-count').textContent = data.duplicatesFound || 0;
            
            const eta = data.eta ? \`ETA: \${data.eta}s\` : '';
            document.getElementById('scan-details').textContent = 
                \`Processing files... \${percent}% complete. \${eta}\`;
        }
        
        function updateProgressUI() {
            const phaseIndicator = document.getElementById('phase-indicator');
            const progressText = document.getElementById('progress-text');
            
            phaseIndicator.className = \`phase-indicator phase-\${scanProgress.phase}\`;
            
            switch (scanProgress.phase) {
                case 'idle':
                    phaseIndicator.textContent = 'Idle';
                    progressText.textContent = 'Ready to scan';
                    break;
                case 'scanning':
                    phaseIndicator.textContent = 'Scanning';
                    progressText.textContent = 'Finding relevant files...';
                    break;
                case 'processing':
                    phaseIndicator.textContent = 'Processing';
                    progressText.textContent = 'Detecting duplicates...';
                    break;
                case 'complete':
                    phaseIndicator.textContent = 'Complete';
                    progressText.textContent = 'Scan complete! Ready for decisions.';
                    break;
                case 'error':
                    phaseIndicator.textContent = 'Error';
                    progressText.textContent = \`Error: \${scanProgress.error}\`;
                    break;
                case 'paused':
                    phaseIndicator.textContent = 'Paused';
                    progressText.textContent = 'Scan paused';
                    break;
            }
        }
        
        function onScanComplete(data) {
            scanProgress.phase = 'complete';
            updateProgressUI();
            
            document.getElementById('progress-fill').style.width = '100%';
            document.getElementById('duplicates-count').textContent = data.duplicateGroups;
            
            showNotification(\`✅ Scan complete! Found \${data.duplicateGroups} duplicate groups in \${data.scanTime.toFixed(1)}s\`);
            
            // Load file pairs for decision making
            setTimeout(loadFilePairs, 1000);
        }
        
        function onScanError(data) {
            scanProgress.phase = 'error';
            scanProgress.error = data.error;
            updateProgressUI();
            showNotification(\`❌ Scan failed: \${data.error}\`);
        }
        
        function onDecisionRecorded(data) {
            decisions.push(data);
            document.getElementById('decisions-count').textContent = data.total_decisions;
            showNotification(\`\${data.decision === 'delete_both' ? '🗑️' : '✅'} Decision recorded\`);
        }
        
        async function controlScan(action) {
            try {
                const response = await fetch(\`/api/scan/\${action}\`, { method: 'POST' });
                const data = await response.json();
                
                if (data.success) {
                    scanProgress.phase = data.phase;
                    updateProgressUI();
                    showNotification(\`Scan \${action}d\`);
                }
            } catch (error) {
                console.error('Control scan error:', error);
            }
        }
        
        async function loadFilePairs() {
            try {
                const response = await fetch('/api/file-pairs');
                filePairs = await response.json();
                
                if (filePairs.length === 0) {
                    showEmptyState();
                } else {
                    await loadFileContents();
                    renderCurrentCard();
                }
                
            } catch (error) {
                console.error('Error loading file pairs:', error);
                showNotification('❌ Error loading file pairs');
            }
        }
        
        async function loadFileContents() {
            for (let pair of filePairs) {
                try {
                    const [content1, content2] = await Promise.all([
                        fetch(\`/api/file-content/\${encodeURIComponent(pair.file1_path)}\`).then(r => r.json()),
                        fetch(\`/api/file-content/\${encodeURIComponent(pair.file2_path)}\`).then(r => r.json())
                    ]);
                    
                    pair.file1_content = content1;
                    pair.file2_content = content2;
                    pair.reasoning = generateReasoning(pair, content1, content2);
                } catch (error) {
                    console.error('Error loading content for pair:', error);
                }
            }
        }
        
        function generateReasoning(pair, content1, content2) {
            const reasons = [];
            
            reasons.push('Files have identical content (exact duplicates)');
            
            const sizeDiff = Math.abs(content1.size - content2.size);
            if (sizeDiff === 0) {
                reasons.push('Identical file sizes confirm duplication');
            }
            
            const name1 = content1.name.toLowerCase();
            const name2 = content2.name.toLowerCase();
            
            if (name1.includes('copy') || name2.includes('copy')) {
                reasons.push('One filename suggests it\\'s a copy');
            }
            
            if (name1.includes('backup') || name2.includes('backup')) {
                reasons.push('One file appears to be a backup');
            }
            
            const ext1 = content1.type;
            const ext2 = content2.type;
            if (ext1 === ext2) {
                reasons.push(\`Both are \${ext1} files with same extension\`);
            }
            
            if (pair.wasted_space) {
                reasons.push(\`Removing duplicate would save \${formatSize(pair.wasted_space)}\`);
            }
            
            return reasons;
        }
        
        function renderCurrentCard() {
            const cardStack = document.getElementById('card-stack');
            const pair = filePairs[currentIndex];
            
            if (!pair) {
                showEmptyState();
                return;
            }
            
            const similarity = Math.round(pair.similarity_score * 100);
            
            cardStack.innerHTML = \`
                <div class="file-card">
                    <div class="similarity-badge">\${similarity}% Match</div>
                    
                    <div class="action-hints left">❌</div>
                    <div class="action-hints right">✅</div>
                    <div class="action-hints up">📄</div>
                    <div class="action-hints down">🤖</div>
                    
                    <div class="file-comparison">
                        <div class="file-preview">
                            <div class="file-name">\${pair.file1_content?.name || 'File 1'}</div>
                            <div class="file-meta">
                                Size: \${formatSize(pair.file1_content?.size || 0)} • 
                                Modified: \${formatDate(pair.file1_content?.modified)} •
                                Type: \${pair.file1_content?.type || 'unknown'}
                            </div>
                            <div class="file-content">\${pair.file1_content?.preview || 'Loading...'}</div>
                        </div>
                        
                        <div class="file-preview">
                            <div class="file-name">\${pair.file2_content?.name || 'File 2'}</div>
                            <div class="file-meta">
                                Size: \${formatSize(pair.file2_content?.size || 0)} • 
                                Modified: \${formatDate(pair.file2_content?.modified)} •
                                Type: \${pair.file2_content?.type || 'unknown'}
                            </div>
                            <div class="file-content">\${pair.file2_content?.preview || 'Loading...'}</div>
                        </div>
                    </div>
                    
                    <div class="reasoning-section">
                        <div class="reasoning-title">🧠 Why these files are duplicates:</div>
                        <ul class="reasoning-list">
                            \${pair.reasoning?.map(reason => \`<li>\${reason}</li>\`).join('') || '<li>Content analysis in progress...</li>'}
                        </ul>
                    </div>
                </div>
            \`;
            
            setupGestures();
        }
        
        function setupGestures() {
            const cardStack = document.getElementById('card-stack');
            const hammer = new Hammer(cardStack);
            
            hammer.get('swipe').set({ direction: Hammer.DIRECTION_ALL });
            hammer.get('pan').set({ direction: Hammer.DIRECTION_ALL });
            
            hammer.on('pan', (e) => {
                const card = document.querySelector('.file-card');
                if (!card) return;
                
                const deltaX = e.deltaX;
                const deltaY = e.deltaY;
                const rotation = deltaX * 0.1;
                
                card.classList.add('swiping');
                card.style.transform = \`translateX(\${deltaX}px) translateY(\${deltaY}px) rotate(\${rotation}deg)\`;
                
                updateActionHints(deltaX, deltaY);
            });
            
            hammer.on('panend', (e) => {
                const card = document.querySelector('.file-card');
                if (!card) return;
                
                card.classList.remove('swiping');
                
                const threshold = 100;
                const deltaX = e.deltaX;
                const deltaY = e.deltaY;
                
                if (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold) {
                    if (Math.abs(deltaX) > Math.abs(deltaY)) {
                        handleSwipe(deltaX > 0 ? 'right' : 'left');
                    } else {
                        handleSwipe(deltaY > 0 ? 'down' : 'up');
                    }
                } else {
                    card.style.transform = '';
                    hideActionHints();
                }
            });
        }
        
        function updateActionHints(deltaX, deltaY) {
            const hints = document.querySelectorAll('.action-hints');
            hints.forEach(hint => hint.style.opacity = '0');
            
            const threshold = 50;
            
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (deltaX > threshold) {
                    document.querySelector('.action-hints.right').style.opacity = Math.min(1, deltaX / 150);
                } else if (deltaX < -threshold) {
                    document.querySelector('.action-hints.left').style.opacity = Math.min(1, Math.abs(deltaX) / 150);
                }
            } else {
                if (deltaY > threshold) {
                    document.querySelector('.action-hints.down').style.opacity = Math.min(1, deltaY / 150);
                } else if (deltaY < -threshold) {
                    document.querySelector('.action-hints.up').style.opacity = Math.min(1, Math.abs(deltaY) / 150);
                }
            }
        }
        
        function hideActionHints() {
            const hints = document.querySelectorAll('.action-hints');
            hints.forEach(hint => hint.style.opacity = '0');
        }
        
        function handleSwipe(direction) {
            const pair = filePairs[currentIndex];
            if (!pair) return;
            
            let decision, message;
            
            switch (direction) {
                case 'left':
                    decision = 'delete_both';
                    message = '🗑️ Marked for deletion';
                    break;
                case 'right':
                    decision = 'keep_better';
                    message = '✅ Keeping better file';
                    break;
                case 'up':
                    decision = 'keep_both';
                    message = '📄 Keeping both files';
                    break;
                case 'down':
                    decision = 'auto_decide';
                    message = '🤖 Auto-decision applied';
                    break;
            }
            
            recordDecision(pair, decision, message);
            animateCardExit(direction);
            
            setTimeout(() => {
                nextCard();
            }, 300);
        }
        
        function animateCardExit(direction) {
            const card = document.querySelector('.file-card');
            if (!card) return;
            
            let transform;
            
            switch (direction) {
                case 'left':
                    transform = 'translateX(-100vw) rotate(-30deg)';
                    break;
                case 'right':
                    transform = 'translateX(100vw) rotate(30deg)';
                    break;
                case 'up':
                    transform = 'translateY(-100vh) rotate(10deg)';
                    break;
                case 'down':
                    transform = 'translateY(100vh) rotate(-10deg)';
                    break;
            }
            
            card.style.transform = transform;
            card.style.opacity = '0';
        }
        
        async function recordDecision(pair, decision, message) {
            showNotification(message);
            
            try {
                await fetch('/api/decision', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        file1: pair.file1_path,
                        file2: pair.file2_path,
                        decision,
                        reasoning: \`Swipe decision: \${decision}\`
                    })
                });
                
            } catch (error) {
                console.error('Error recording decision:', error);
            }
        }
        
        function nextCard() {
            currentIndex++;
            
            if (currentIndex >= filePairs.length) {
                showCompletionState();
            } else {
                renderCurrentCard();
            }
        }
        
        function showNotification(message) {
            const notification = document.getElementById('notification');
            notification.textContent = message;
            notification.classList.add('show');
            
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
        }
        
        function showEmptyState() {
            const cardStack = document.getElementById('card-stack');
            cardStack.innerHTML = \`
                <div class="empty-state">
                    <h2>🎉 No Duplicates Found!</h2>
                    <p>Your codebase is well organized - no duplicate code files detected.</p>
                    <button onclick="controlScan('restart')" style="margin-top: 20px; padding: 10px 20px; background: white; color: #333; border: none; border-radius: 10px; cursor: pointer;">
                        🔄 Scan Again
                    </button>
                </div>
            \`;
        }
        
        function showCompletionState() {
            const cardStack = document.getElementById('card-stack');
            cardStack.innerHTML = \`
                <div class="empty-state">
                    <h2>✨ All Done!</h2>
                    <p>You processed \${decisions.length} duplicate pairs</p>
                    <p>Great job organizing your codebase!</p>
                    <div style="margin-top: 20px;">
                        <button onclick="controlScan('restart')" style="padding: 10px 20px; background: white; color: #333; border: none; border-radius: 10px; cursor: pointer; margin: 5px;">
                            🔄 Scan Again
                        </button>
                        <button onclick="showSummary()" style="padding: 10px 20px; background: rgba(255,255,255,0.2); color: white; border: none; border-radius: 10px; cursor: pointer; margin: 5px;">
                            📊 View Summary
                        </button>
                    </div>
                </div>
            \`;
        }
        
        function showSummary() {
            const deleteCount = decisions.filter(d => d.decision === 'delete_both').length;
            const keepBothCount = decisions.filter(d => d.decision === 'keep_both').length;
            const keepBetterCount = decisions.filter(d => d.decision === 'keep_better').length;
            const autoCount = decisions.filter(d => d.decision === 'auto_decide').length;
            
            alert(\`📊 Decision Summary:
            
🗑️ Delete Both: \${deleteCount}
📄 Keep Both: \${keepBothCount}  
✅ Keep Better: \${keepBetterCount}
🤖 Auto-decide: \${autoCount}

Total Decisions: \${decisions.length}\`);
        }
        
        function formatSize(bytes) {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
        }
        
        function formatDate(dateStr) {
            if (!dateStr) return 'Unknown';
            return new Date(dateStr).toLocaleDateString();
        }
        
        // Control button functions
        function swipeLeft() { handleSwipe('left'); }
        function swipeRight() { handleSwipe('right'); }
        function swipeUp() { handleSwipe('up'); }
        function swipeDown() { handleSwipe('down'); }
        
        // Initialize
        updateProgressUI();
    </script>
</body>
</html>
        `;
    }
}

// Start the production file swiper
const swiper = new ProductionFileSwiper();
swiper.start();

module.exports = ProductionFileSwiper;