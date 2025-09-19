#!/usr/bin/env node

/**
 * 🎯 MICRO FILE SWIPER - BULLETPROOF VERSION
 * 
 * Ultra-minimal approach:
 * - Web server starts IMMEDIATELY
 * - Only processes .js files in current directory
 * - Max 100 files total
 * - Manual scan trigger
 * - Real error boundaries
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const WebSocket = require('ws');
const http = require('http');

class MicroFileSwiper {
    constructor() {
        this.port = 3008;
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });
        
        // Ultra-simple state
        this.isScanning = false;
        this.scanResults = {
            totalFiles: 0,
            processedFiles: 0,
            duplicateGroups: [],
            errors: []
        };
        this.filePairs = [];
        this.decisions = [];
        this.clients = new Set();
        
        console.log('🎯 MICRO FILE SWIPER - Bulletproof Edition');
        console.log('⚡ Web server starts immediately');
        console.log('📁 JS files only, manual scan trigger');
    }
    
    start() {
        this.setupRoutes();
        this.setupWebSocket();
        
        this.server.listen(this.port, (err) => {
            if (err) {
                console.error('❌ Server failed to start:', err);
                process.exit(1);
            }
            
            console.log(`\n✅ Web server running at http://localhost:${this.port}`);
            console.log('🎯 Ready! Open browser and click "Start Scan"');
            console.log('📊 Will process max 100 JS files from current directory\n');
        });
    }
    
    setupRoutes() {
        this.app.use(express.json());
        
        // Main interface
        this.app.get('/', (req, res) => {
            res.send(this.getInterface());
        });
        
        // Trigger manual scan
        this.app.post('/api/scan', (req, res) => {
            if (this.isScanning) {
                return res.json({ error: 'Scan already in progress' });
            }
            
            this.startMicroScan();
            res.json({ success: true, message: 'Scan started' });
        });
        
        // Get current status
        this.app.get('/api/status', (req, res) => {
            res.json({
                isScanning: this.isScanning,
                results: this.scanResults,
                pairsReady: this.filePairs.length
            });
        });
        
        // Get file pairs for decision
        this.app.get('/api/file-pairs', (req, res) => {
            res.json(this.filePairs.slice(0, 10)); // Max 10 pairs at a time
        });
        
        // Record decision
        this.app.post('/api/decision', (req, res) => {
            try {
                const { file1, file2, decision, reasoning } = req.body;
                
                this.decisions.push({
                    file1,
                    file2,
                    decision,
                    reasoning,
                    timestamp: new Date().toISOString()
                });
                
                console.log(`✅ Decision: ${decision} for ${path.basename(file1)} vs ${path.basename(file2)}`);
                
                this.broadcast({
                    type: 'decision_recorded',
                    data: {
                        decision,
                        total: this.decisions.length
                    }
                });
                
                res.json({ success: true });
            } catch (error) {
                console.error('❌ Decision error:', error);
                res.status(500).json({ error: error.message });
            }
        });
        
        // Get file content preview
        this.app.get('/api/file-preview/:filename', (req, res) => {
            try {
                const filename = req.params.filename;
                const fullPath = path.resolve(filename);
                
                // Security check - must be in current directory
                if (!fullPath.startsWith(process.cwd())) {
                    return res.status(403).json({ error: 'Access denied' });
                }
                
                if (!fs.existsSync(fullPath)) {
                    return res.status(404).json({ error: 'File not found' });
                }
                
                const stats = fs.statSync(fullPath);
                let preview = '';
                
                if (stats.size < 5000) { // 5KB limit
                    try {
                        const content = fs.readFileSync(fullPath, 'utf8');
                        preview = content.slice(0, 500);
                    } catch (error) {
                        preview = 'Cannot read as text';
                    }
                } else {
                    preview = 'File too large for preview';
                }
                
                res.json({
                    name: path.basename(fullPath),
                    size: stats.size,
                    modified: stats.mtime,
                    preview,
                    lines: preview.split('\n').length
                });
                
            } catch (error) {
                console.error('❌ Preview error:', error);
                res.status(500).json({ error: error.message });
            }
        });
    }
    
    setupWebSocket() {
        this.wss.on('connection', (ws) => {
            this.clients.add(ws);
            console.log('📱 Client connected');
            
            // Send current status
            ws.send(JSON.stringify({
                type: 'status',
                data: {
                    isScanning: this.isScanning,
                    results: this.scanResults
                }
            }));
            
            ws.on('close', () => {
                this.clients.delete(ws);
            });
            
            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
                this.clients.delete(ws);
            });
        });
    }
    
    broadcast(message) {
        const data = JSON.stringify(message);
        this.clients.forEach(client => {
            try {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(data);
                }
            } catch (error) {
                console.error('Broadcast error:', error);
                this.clients.delete(client);
            }
        });
    }
    
    startMicroScan() {
        console.log('\n🔍 Starting micro scan...');
        
        this.isScanning = true;
        this.scanResults = {
            totalFiles: 0,
            processedFiles: 0,
            duplicateGroups: [],
            errors: []
        };
        this.filePairs = [];
        
        this.broadcast({
            type: 'scan_started',
            data: { message: 'Scanning for JS files...' }
        });
        
        // Use setTimeout to make it async but not overwhelming
        setTimeout(() => {
            this.performMicroScan();
        }, 100);
    }
    
    performMicroScan() {
        try {
            // Step 1: Find JS files (synchronous, fast)
            console.log('📁 Finding JS files in current directory...');
            
            const allFiles = fs.readdirSync('.');
            const jsFiles = allFiles
                .filter(file => file.endsWith('.js'))
                .filter(file => !file.includes('node_modules'))
                .filter(file => {
                    try {
                        const stats = fs.statSync(file);
                        return stats.isFile() && stats.size > 0 && stats.size < 1024 * 1024; // 1MB limit
                    } catch (error) {
                        return false;
                    }
                })
                .slice(0, 100); // Hard limit to 100 files
                
            console.log(`📊 Found ${jsFiles.length} JS files to process`);
            
            this.scanResults.totalFiles = jsFiles.length;
            
            this.broadcast({
                type: 'files_found',
                data: {
                    totalFiles: jsFiles.length,
                    message: `Found ${jsFiles.length} JS files`
                }
            });
            
            if (jsFiles.length === 0) {
                this.completeScan('No JS files found in current directory');
                return;
            }
            
            // Step 2: Process files in small batches
            this.processFilesInSmallBatches(jsFiles);
            
        } catch (error) {
            console.error('❌ Scan failed:', error);
            this.scanResults.errors.push(error.message);
            this.completeScan(`Scan failed: ${error.message}`);
        }
    }
    
    processFilesInSmallBatches(files) {
        const fileHashes = new Map();
        let processed = 0;
        
        console.log('🔨 Processing files in batches of 5...');
        
        const processBatch = (startIndex) => {
            const batchSize = 5;
            const batch = files.slice(startIndex, startIndex + batchSize);
            
            if (batch.length === 0) {
                this.findDuplicatesAndComplete(fileHashes);
                return;
            }
            
            // Process batch synchronously for simplicity
            for (const file of batch) {
                try {
                    const content = fs.readFileSync(file, 'utf8');
                    
                    // Normalize content
                    const normalized = content
                        .replace(/\r\n/g, '\n')
                        .replace(/\s+$/gm, '')
                        .trim();
                        
                    const hash = crypto.createHash('md5').update(normalized).digest('hex');
                    
                    if (!fileHashes.has(hash)) {
                        fileHashes.set(hash, []);
                    }
                    
                    fileHashes.get(hash).push({
                        path: file,
                        name: file,
                        hash,
                        size: content.length
                    });
                    
                    processed++;
                    this.scanResults.processedFiles = processed;
                    
                } catch (error) {
                    console.warn(`⚠️ Cannot process ${file}:`, error.message);
                    this.scanResults.errors.push(`${file}: ${error.message}`);
                    processed++;
                }
            }
            
            // Update progress
            const percent = Math.round((processed / files.length) * 100);
            console.log(`📊 Processed ${processed}/${files.length} files (${percent}%)`);
            
            this.broadcast({
                type: 'progress',
                data: {
                    processed,
                    total: files.length,
                    percent
                }
            });
            
            // Process next batch after small delay
            setTimeout(() => processBatch(startIndex + batchSize), 50);
        };
        
        processBatch(0);
    }
    
    findDuplicatesAndComplete(fileHashes) {
        console.log('🔍 Finding duplicate groups...');
        
        // Find duplicate groups
        const duplicateGroups = [];
        for (const [hash, files] of fileHashes) {
            if (files.length > 1) {
                duplicateGroups.push({
                    hash,
                    files,
                    count: files.length
                });
            }
        }
        
        console.log(`📊 Found ${duplicateGroups.length} duplicate groups`);
        
        this.scanResults.duplicateGroups = duplicateGroups;
        
        // Create file pairs for swipe interface
        this.filePairs = [];
        let pairId = 0;
        
        for (const group of duplicateGroups) {
            // Create pairs within each group
            const files = group.files;
            for (let i = 0; i < files.length - 1; i++) {
                for (let j = i + 1; j < files.length; j++) {
                    this.filePairs.push({
                        id: pairId++,
                        file1: files[i],
                        file2: files[j],
                        similarity: 1.0,
                        type: 'exact_duplicate'
                    });
                    
                    if (this.filePairs.length >= 20) break; // Limit pairs
                }
                if (this.filePairs.length >= 20) break;
            }
            if (this.filePairs.length >= 20) break;
        }
        
        this.completeScan();
    }
    
    completeScan(errorMessage = null) {
        this.isScanning = false;
        
        const message = errorMessage || 
            `Scan complete! Found ${this.scanResults.duplicateGroups.length} duplicate groups, ${this.filePairs.length} pairs ready.`;
            
        console.log(`✅ ${message}`);
        
        this.broadcast({
            type: 'scan_complete',
            data: {
                success: !errorMessage,
                message,
                duplicateGroups: this.scanResults.duplicateGroups.length,
                pairsReady: this.filePairs.length,
                errors: this.scanResults.errors
            }
        });
    }
    
    getInterface() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎯 Micro File Swiper</title>
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
        .subtitle { opacity: 0.9; margin-bottom: 1rem; }
        
        .control-panel { 
            background: rgba(255,255,255,0.1); padding: 20px; 
            border-radius: 15px; margin-bottom: 20px;
            backdrop-filter: blur(10px);
        }
        
        .scan-button { 
            width: 100%; padding: 15px; border: none; border-radius: 10px;
            background: linear-gradient(45deg, #4ecdc4, #44a08d);
            color: white; font-size: 1.1rem; font-weight: bold;
            cursor: pointer; transition: all 0.3s ease;
        }
        .scan-button:hover { transform: translateY(-2px); }
        .scan-button:disabled { 
            background: #666; cursor: not-allowed; transform: none;
        }
        
        .status { 
            margin-top: 15px; padding: 15px; background: rgba(0,0,0,0.2);
            border-radius: 10px; font-family: monospace;
        }
        
        .progress-bar { 
            background: rgba(255,255,255,0.2); height: 8px; 
            border-radius: 4px; margin: 10px 0; overflow: hidden;
        }
        .progress-fill { 
            background: linear-gradient(90deg, #4ecdc4, #44a08d);
            height: 100%; width: 0%; transition: width 0.3s ease;
        }
        
        .stats { 
            display: grid; grid-template-columns: repeat(4, 1fr);
            gap: 15px; margin-top: 15px;
        }
        .stat { text-align: center; }
        .stat-number { font-size: 1.3rem; font-weight: bold; }
        .stat-label { font-size: 0.8rem; opacity: 0.8; }
        
        .card-stack { 
            position: relative; height: 500px; margin: 20px 0;
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
            font-size: 1rem; word-break: break-all;
        }
        .file-meta { 
            font-size: 0.8rem; color: #7f8c8d; margin-bottom: 10px; 
        }
        .file-content { 
            font-family: 'Monaco', 'Menlo', monospace; font-size: 0.75rem; 
            background: white; padding: 10px; border-radius: 5px;
            border: 1px solid #e9ecef; flex: 1; overflow-y: auto;
            line-height: 1.4;
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
        .swipe-btn:disabled { 
            background: #666 !important; cursor: not-allowed; transform: none !important;
        }
        
        .waiting-state, .error-state { 
            text-align: center; padding: 60px 20px; 
            background: rgba(255,255,255,0.1); border-radius: 20px;
            backdrop-filter: blur(10px);
        }
        
        .error-state { background: rgba(231, 76, 60, 0.2); }
        
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
            z-index: 1000; max-width: 80%; text-align: center;
        }
        .notification.show { opacity: 1; }
        
        .error-list {
            background: rgba(231, 76, 60, 0.1); border-radius: 10px;
            padding: 15px; margin-top: 15px; max-height: 150px; overflow-y: auto;
        }
        .error-list h4 { color: #e74c3c; margin-bottom: 10px; }
        .error-list ul { list-style: none; }
        .error-list li { 
            margin-bottom: 5px; font-size: 0.8rem; 
            font-family: monospace; opacity: 0.9;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 Micro File Swiper</h1>
            <div class="subtitle">Bulletproof duplicate detection for JavaScript files</div>
        </div>
        
        <div class="control-panel">
            <button class="scan-button" id="scan-button" onclick="startScan()">
                🔍 Start Scan (JS Files Only)
            </button>
            
            <div class="status" id="status">
                ⚡ Ready to scan JavaScript files in current directory
            </div>
            
            <div class="progress-bar" style="display: none;" id="progress-bar">
                <div class="progress-fill" id="progress-fill"></div>
            </div>
            
            <div class="stats">
                <div class="stat">
                    <div class="stat-number" id="total-files">0</div>
                    <div class="stat-label">Total Files</div>
                </div>
                <div class="stat">
                    <div class="stat-number" id="processed-files">0</div>
                    <div class="stat-label">Processed</div>
                </div>
                <div class="stat">
                    <div class="stat-number" id="duplicate-groups">0</div>
                    <div class="stat-label">Duplicates</div>
                </div>
                <div class="stat">
                    <div class="stat-number" id="decisions-made">0</div>
                    <div class="stat-label">Decisions</div>
                </div>
            </div>
            
            <div id="error-section" style="display: none;"></div>
        </div>
        
        <div class="card-stack" id="card-stack">
            <div class="waiting-state">
                <h2>👆 Click "Start Scan" Above</h2>
                <p>Will scan JavaScript files in current directory</p>
                <p style="margin-top: 15px; opacity: 0.8; font-size: 0.9rem;">
                    Max 100 files • Bulletproof processing • Manual trigger
                </p>
            </div>
        </div>
        
        <div class="swipe-controls">
            <button class="swipe-btn reject" title="Delete Both" onclick="swipeLeft()" disabled>🗑️</button>
            <button class="swipe-btn keep-both" title="Keep Both" onclick="swipeUp()" disabled>📄</button>
            <button class="swipe-btn accept" title="Keep Better" onclick="swipeRight()" disabled>✅</button>
            <button class="swipe-btn auto" title="Auto-decide" onclick="swipeDown()" disabled>🤖</button>
        </div>
    </div>
    
    <div class="notification" id="notification"></div>
    
    <script>
        let isScanning = false;
        let filePairs = [];
        let currentIndex = 0;
        let decisions = [];
        
        // WebSocket connection
        const ws = new WebSocket('ws://localhost:3008');
        
        ws.onopen = () => {
            console.log('WebSocket connected');
        };
        
        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                handleWebSocketMessage(message);
            } catch (error) {
                console.error('WebSocket message error:', error);
            }
        };
        
        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            showNotification('❌ Connection error - refresh page');
        };
        
        function handleWebSocketMessage(message) {
            switch (message.type) {
                case 'status':
                    updateStatus(message.data);
                    break;
                case 'scan_started':
                    onScanStarted(message.data);
                    break;
                case 'files_found':
                    onFilesFound(message.data);
                    break;
                case 'progress':
                    onProgress(message.data);
                    break;
                case 'scan_complete':
                    onScanComplete(message.data);
                    break;
                case 'decision_recorded':
                    onDecisionRecorded(message.data);
                    break;
            }
        }
        
        function updateStatus(data) {
            isScanning = data.isScanning;
            updateUI();
        }
        
        function onScanStarted(data) {
            isScanning = true;
            document.getElementById('scan-button').disabled = true;
            document.getElementById('scan-button').textContent = '🔍 Scanning...';
            document.getElementById('status').textContent = data.message;
            document.getElementById('progress-bar').style.display = 'block';
            
            showNotification('🔍 Scan started');
        }
        
        function onFilesFound(data) {
            document.getElementById('total-files').textContent = data.totalFiles;
            document.getElementById('status').textContent = data.message;
            
            if (data.totalFiles === 0) {
                showWaitingState('No JavaScript files found in current directory');
            }
        }
        
        function onProgress(data) {
            document.getElementById('processed-files').textContent = data.processed;
            document.getElementById('progress-fill').style.width = data.percent + '%';
            document.getElementById('status').textContent = 
                \`Processing files... \${data.percent}% complete\`;
        }
        
        function onScanComplete(data) {
            isScanning = false;
            document.getElementById('scan-button').disabled = false;
            document.getElementById('scan-button').textContent = '🔄 Scan Again';
            document.getElementById('duplicate-groups').textContent = data.duplicateGroups;
            
            if (data.success) {
                document.getElementById('status').textContent = data.message;
                showNotification(\`✅ \${data.message}\`);
                
                if (data.pairsReady > 0) {
                    loadFilePairs();
                } else {
                    showWaitingState('🎉 No duplicates found! Your JS files are unique.');
                }
            } else {
                document.getElementById('status').textContent = \`❌ \${data.message}\`;
                showNotification(\`❌ \${data.message}\`);
                showErrorState(data.message, data.errors);
            }
            
            if (data.errors && data.errors.length > 0) {
                showErrors(data.errors);
            }
        }
        
        function onDecisionRecorded(data) {
            decisions.push(data);
            document.getElementById('decisions-made').textContent = data.total;
            
            const emoji = {
                'delete_both': '🗑️',
                'keep_both': '📄',
                'keep_better': '✅',
                'auto_decide': '🤖'
            }[data.decision] || '✅';
            
            showNotification(\`\${emoji} Decision recorded\`);
        }
        
        async function startScan() {
            try {
                const response = await fetch('/api/scan', { method: 'POST' });
                const data = await response.json();
                
                if (!data.success) {
                    showNotification(\`❌ \${data.error}\`);
                }
            } catch (error) {
                console.error('Scan request failed:', error);
                showNotification('❌ Failed to start scan');
            }
        }
        
        async function loadFilePairs() {
            try {
                const response = await fetch('/api/file-pairs');
                filePairs = await response.json();
                
                if (filePairs.length === 0) {
                    showWaitingState('🎉 No duplicates to review!');
                    return;
                }
                
                currentIndex = 0;
                await loadFileContents();
                renderCurrentCard();
                enableSwipeControls();
                
            } catch (error) {
                console.error('Failed to load file pairs:', error);
                showNotification('❌ Failed to load file pairs');
            }
        }
        
        async function loadFileContents() {
            for (let pair of filePairs) {
                try {
                    const [content1, content2] = await Promise.all([
                        fetch(\`/api/file-preview/\${encodeURIComponent(pair.file1.name)}\`).then(r => r.json()),
                        fetch(\`/api/file-preview/\${encodeURIComponent(pair.file2.name)}\`).then(r => r.json())
                    ]);
                    
                    pair.file1.content = content1;
                    pair.file2.content = content2;
                    
                } catch (error) {
                    console.error('Error loading content:', error);
                }
            }
        }
        
        function renderCurrentCard() {
            const pair = filePairs[currentIndex];
            if (!pair) {
                showCompletionState();
                return;
            }
            
            const cardStack = document.getElementById('card-stack');
            cardStack.innerHTML = \`
                <div class="file-card">
                    <div class="similarity-badge">100% Match</div>
                    
                    <div class="action-hints left">❌</div>
                    <div class="action-hints right">✅</div>
                    <div class="action-hints up">📄</div>
                    <div class="action-hints down">🤖</div>
                    
                    <div class="file-comparison">
                        <div class="file-preview">
                            <div class="file-name">\${pair.file1.name}</div>
                            <div class="file-meta">
                                Size: \${formatSize(pair.file1.content?.size || pair.file1.size)} • 
                                Modified: \${formatDate(pair.file1.content?.modified)}
                            </div>
                            <div class="file-content">\${pair.file1.content?.preview || 'Loading...'}</div>
                        </div>
                        
                        <div class="file-preview">
                            <div class="file-name">\${pair.file2.name}</div>
                            <div class="file-meta">
                                Size: \${formatSize(pair.file2.content?.size || pair.file2.size)} • 
                                Modified: \${formatDate(pair.file2.content?.modified)}
                            </div>
                            <div class="file-content">\${pair.file2.content?.preview || 'Loading...'}</div>
                        </div>
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
            
            let decision;
            
            switch (direction) {
                case 'left':
                    decision = 'delete_both';
                    break;
                case 'right':
                    decision = 'keep_better';
                    break;
                case 'up':
                    decision = 'keep_both';
                    break;
                case 'down':
                    decision = 'auto_decide';
                    break;
            }
            
            recordDecision(pair, decision);
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
        
        async function recordDecision(pair, decision) {
            try {
                await fetch('/api/decision', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        file1: pair.file1.path,
                        file2: pair.file2.path,
                        decision,
                        reasoning: \`Swipe decision: \${decision}\`
                    })
                });
            } catch (error) {
                console.error('Failed to record decision:', error);
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
        
        function enableSwipeControls() {
            const buttons = document.querySelectorAll('.swipe-btn');
            buttons.forEach(btn => btn.disabled = false);
        }
        
        function disableSwipeControls() {
            const buttons = document.querySelectorAll('.swipe-btn');
            buttons.forEach(btn => btn.disabled = true);
        }
        
        function showWaitingState(message) {
            const cardStack = document.getElementById('card-stack');
            cardStack.innerHTML = \`
                <div class="waiting-state">
                    <h2>\${message}</h2>
                    <button onclick="startScan()" style="margin-top: 20px; padding: 10px 20px; background: white; color: #333; border: none; border-radius: 10px; cursor: pointer;">
                        🔄 Scan Again
                    </button>
                </div>
            \`;
            disableSwipeControls();
        }
        
        function showErrorState(message, errors) {
            const cardStack = document.getElementById('card-stack');
            cardStack.innerHTML = \`
                <div class="error-state">
                    <h2>❌ Scan Failed</h2>
                    <p>\${message}</p>
                    <button onclick="startScan()" style="margin-top: 20px; padding: 10px 20px; background: white; color: #333; border: none; border-radius: 10px; cursor: pointer;">
                        🔄 Try Again
                    </button>
                </div>
            \`;
            disableSwipeControls();
        }
        
        function showCompletionState() {
            const cardStack = document.getElementById('card-stack');
            cardStack.innerHTML = \`
                <div class="waiting-state">
                    <h2>✨ All Done!</h2>
                    <p>You processed \${decisions.length} duplicate pairs</p>
                    <button onclick="startScan()" style="margin-top: 20px; padding: 10px 20px; background: white; color: #333; border: none; border-radius: 10px; cursor: pointer;">
                        🔄 Scan Again
                    </button>
                </div>
            \`;
            disableSwipeControls();
        }
        
        function showErrors(errors) {
            const errorSection = document.getElementById('error-section');
            if (errors.length > 0) {
                errorSection.style.display = 'block';
                errorSection.innerHTML = \`
                    <div class="error-list">
                        <h4>⚠️ Processing Errors (\${errors.length})</h4>
                        <ul>
                            \${errors.map(error => \`<li>\${error}</li>\`).join('')}
                        </ul>
                    </div>
                \`;
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
        
        function formatSize(bytes) {
            if (!bytes) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
        }
        
        function formatDate(dateStr) {
            if (!dateStr) return 'Unknown';
            return new Date(dateStr).toLocaleDateString();
        }
        
        // Button handlers
        function swipeLeft() { handleSwipe('left'); }
        function swipeRight() { handleSwipe('right'); }
        function swipeUp() { handleSwipe('up'); }
        function swipeDown() { handleSwipe('down'); }
        
        function updateUI() {
            // Update UI based on current state
        }
    </script>
</body>
</html>
        `;
    }
}

// Start the micro file swiper
const swiper = new MicroFileSwiper();
swiper.start();

module.exports = MicroFileSwiper;