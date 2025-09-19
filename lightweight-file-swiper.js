#!/usr/bin/env node

/**
 * 🎯 LIGHTWEIGHT FILE SWIPER
 * Memory-efficient file management with swipe decisions
 * Focuses on most common duplicates first
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const WebSocket = require('ws');
const http = require('http');

class LightweightFileSwiper {
    constructor() {
        this.port = 3008;
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });
        
        // Memory-efficient storage
        this.fileGroups = new Map(); // hash -> [files]
        this.decisions = [];
        this.processedCount = 0;
        this.clients = new Set();
        
        console.log('🎯 LIGHTWEIGHT FILE SWIPER');
        console.log('📁 Memory-efficient duplicate detection');
        console.log('👆 Swipe to manage similar files');
    }
    
    async start() {
        this.setupRoutes();
        this.setupWebSocket();
        
        this.server.listen(this.port, async () => {
            console.log(`\n🚀 File Swiper running at http://localhost:${this.port}`);
            console.log('📊 Processing files in memory-efficient batches...\n');
            
            // Start scanning in background
            this.scanForDuplicates();
        });
    }
    
    setupRoutes() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
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
    }
    
    setupWebSocket() {
        this.wss.on('connection', (ws) => {
            this.clients.add(ws);
            console.log('📱 Client connected');
            
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
    
    async scanForDuplicates() {
        console.log('🔍 Scanning for exact duplicates (hash-based)...');
        
        const batchSize = 100;
        let totalFiles = 0;
        
        try {
            await this.scanDirectory('.', batchSize);
            
            // Find duplicate groups
            const duplicateGroups = Array.from(this.fileGroups.entries())
                .filter(([hash, files]) => files.length > 1)
                .sort((a, b) => b[1].length - a[1].length); // Most duplicates first
            
            console.log(`\n✅ Scan complete!`);
            console.log(`📊 Found ${duplicateGroups.length} groups of duplicates`);
            console.log(`📁 Total files processed: ${totalFiles}`);
            
            this.broadcast({
                type: 'scan_complete',
                duplicateGroups: duplicateGroups.length,
                totalFiles
            });
            
        } catch (error) {
            console.error('❌ Scan failed:', error.message);
        }
    }
    
    async scanDirectory(dirPath, batchSize) {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        let batch = [];
        
        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);
            
            // Skip problematic directories
            if (this.shouldSkip(entry.name)) continue;
            
            if (entry.isFile()) {
                batch.push(fullPath);
                
                if (batch.length >= batchSize) {
                    await this.processBatch(batch);
                    batch = [];
                    
                    // Give other processes a chance
                    await new Promise(resolve => setTimeout(resolve, 10));
                }
            } else if (entry.isDirectory()) {
                try {
                    await this.scanDirectory(fullPath, batchSize);
                } catch (error) {
                    // Skip inaccessible directories
                }
            }
        }
        
        // Process remaining files
        if (batch.length > 0) {
            await this.processBatch(batch);
        }
    }
    
    shouldSkip(name) {
        const skipPatterns = [
            'node_modules', '.git', '.DS_Store', 'dist', 'build',
            '__pycache__', '.pytest_cache', 'coverage'
        ];
        return skipPatterns.some(pattern => name.includes(pattern)) || name.startsWith('.');
    }
    
    async processBatch(files) {
        for (const file of files) {
            try {
                const hash = await this.getFileHash(file);
                
                if (!this.fileGroups.has(hash)) {
                    this.fileGroups.set(hash, []);
                }
                this.fileGroups.get(hash).push(file);
                
                this.processedCount++;
                
                if (this.processedCount % 50 === 0) {
                    console.log(`📊 Processed ${this.processedCount} files...`);
                    
                    this.broadcast({
                        type: 'progress',
                        processed: this.processedCount,
                        duplicatesFound: Array.from(this.fileGroups.values())
                            .filter(group => group.length > 1).length
                    });
                }
                
            } catch (error) {
                // Skip problematic files
            }
        }
    }
    
    async getFileHash(filePath) {
        const stats = await fs.stat(filePath);
        
        // For small files, hash content
        if (stats.size < 1024 * 1024) { // 1MB
            const content = await fs.readFile(filePath);
            return crypto.createHash('md5').update(content).digest('hex');
        }
        
        // For large files, hash size + name (fast approximation)
        const nameHash = crypto.createHash('md5')
            .update(path.basename(filePath) + stats.size)
            .digest('hex');
        return `large_${nameHash}`;
    }
    
    getFilePairsForDecision() {
        const pairs = [];
        let pairId = 0;
        
        // Get groups with most duplicates first
        const sortedGroups = Array.from(this.fileGroups.entries())
            .filter(([hash, files]) => files.length > 1)
            .sort((a, b) => b[1].length - a[1].length)
            .slice(0, 20); // Limit to top 20 groups
        
        for (const [hash, files] of sortedGroups) {
            // Create pairs within each group
            for (let i = 0; i < files.length - 1; i++) {
                pairs.push({
                    id: pairId++,
                    file1_path: files[i],
                    file2_path: files[i + 1],
                    similarity_score: 1.0, // Exact duplicates
                    type: 'exact_duplicate'
                });
                
                if (pairs.length >= 10) break; // Limit pairs for performance
            }
            if (pairs.length >= 10) break;
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
        
        console.log(`✅ Decision recorded: ${decision} for ${path.basename(file1)} & ${path.basename(file2)}`);
        
        this.broadcast({
            type: 'decision_recorded',
            decision,
            files: [path.basename(file1), path.basename(file2)]
        });
    }
    
    async getFilePreview(filePath) {
        const stats = await fs.stat(filePath);
        let preview = '';
        
        try {
            if (stats.size < 10000) { // 10KB limit
                const content = await fs.readFile(filePath, 'utf8');
                preview = content.slice(0, 500);
            } else {
                preview = 'File too large for preview';
            }
        } catch (error) {
            preview = 'Binary file or read error';
        }
        
        return {
            name: path.basename(filePath),
            size: stats.size,
            modified: stats.mtime,
            preview,
            lines: preview.split('\n').length,
            type: path.extname(filePath) || 'unknown'
        };
    }
    
    getInterface() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎯 File Swiper</title>
    <script src="https://hammerjs.github.io/dist/hammer.min.js"></script>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0; padding: 20px; color: white; min-height: 100vh;
        }
        .container { max-width: 500px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 2rem; }
        .header h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
        .stats { 
            display: flex; justify-content: space-around; 
            background: rgba(255,255,255,0.1); padding: 15px; 
            border-radius: 15px; margin-bottom: 20px;
            backdrop-filter: blur(10px);
        }
        .stat { text-align: center; }
        .stat-number { font-size: 1.5rem; font-weight: bold; }
        .stat-label { font-size: 0.8rem; opacity: 0.8; }
        
        .card-stack { position: relative; height: 500px; }
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
        
        .file-comparison { display: flex; gap: 15px; margin-top: 50px; }
        .file-preview { 
            flex: 1; background: #f8f9fa; padding: 15px; 
            border-radius: 10px; max-height: 300px; overflow-y: auto;
        }
        .file-name { font-weight: bold; margin-bottom: 10px; color: #2c3e50; }
        .file-meta { font-size: 0.8rem; color: #7f8c8d; margin-bottom: 10px; }
        .file-content { 
            font-family: 'Monaco', monospace; font-size: 0.7rem; 
            background: white; padding: 10px; border-radius: 5px;
            border: 1px solid #e9ecef; max-height: 150px; overflow-y: auto;
        }
        
        .action-hints { 
            position: absolute; font-size: 4rem; font-weight: bold;
            opacity: 0; transition: opacity 0.3s ease; pointer-events: none;
        }
        .action-hints.left { left: 20px; top: 50%; transform: translateY(-50%); color: #e74c3c; }
        .action-hints.right { right: 20px; top: 50%; transform: translateY(-50%); color: #27ae60; }
        .action-hints.up { top: 20px; left: 50%; transform: translateX(-50%); color: #3498db; }
        .action-hints.down { bottom: 20px; left: 50%; transform: translateX(-50%); color: #f39c12; }
        
        .controls { 
            position: fixed; bottom: 30px; left: 50%; 
            transform: translateX(-50%); display: flex; gap: 15px;
        }
        .control-btn { 
            width: 60px; height: 60px; border-radius: 50%;
            border: none; color: white; font-size: 1.5rem;
            cursor: pointer; transition: all 0.3s ease;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        .control-btn:hover { transform: scale(1.1); }
        .control-btn.reject { background: linear-gradient(45deg, #e74c3c, #c0392b); }
        .control-btn.keep-both { background: linear-gradient(45deg, #3498db, #2980b9); }
        .control-btn.accept { background: linear-gradient(45deg, #27ae60, #229954); }
        .control-btn.auto { background: linear-gradient(45deg, #f39c12, #e67e22); }
        
        .loading, .empty-state { 
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
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        
        .notification { 
            position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
            background: rgba(0,0,0,0.8); color: white; padding: 15px 25px;
            border-radius: 25px; opacity: 0; transition: opacity 0.3s ease;
        }
        .notification.show { opacity: 1; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 File Swiper</h1>
            <p>Swipe to organize duplicate files</p>
            
            <div class="stats">
                <div class="stat">
                    <div class="stat-number" id="processed-count">0</div>
                    <div class="stat-label">Processed</div>
                </div>
                <div class="stat">
                    <div class="stat-number" id="remaining-count">0</div>
                    <div class="stat-label">Remaining</div>
                </div>
                <div class="stat">
                    <div class="stat-number" id="duplicates-found">0</div>
                    <div class="stat-label">Duplicates</div>
                </div>
            </div>
        </div>
        
        <div class="card-stack" id="card-stack">
            <div class="loading">
                <div class="spinner"></div>
                <h2>Scanning for duplicates...</h2>
                <p>This may take a moment for large codebases</p>
            </div>
        </div>
        
        <div class="controls">
            <button class="control-btn reject" title="Delete Both (Swipe Left)" onclick="swipeLeft()">🗑️</button>
            <button class="control-btn keep-both" title="Keep Both (Swipe Up)" onclick="swipeUp()">📄</button>
            <button class="control-btn accept" title="Keep Better (Swipe Right)" onclick="swipeRight()">✅</button>
            <button class="control-btn auto" title="Auto-decide (Swipe Down)" onclick="swipeDown()">🤖</button>
        </div>
    </div>
    
    <div class="notification" id="notification"></div>
    
    <script>
        let filePairs = [];
        let currentIndex = 0;
        let decisions = [];
        
        // WebSocket connection
        const ws = new WebSocket('ws://localhost:3008');
        
        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            
            if (message.type === 'progress') {
                document.getElementById('processed-count').textContent = message.processed;
                document.getElementById('duplicates-found').textContent = message.duplicatesFound;
            } else if (message.type === 'scan_complete') {
                loadFilePairs();
                showNotification(\`✅ Found \${message.duplicateGroups} groups of duplicates\`);
            } else if (message.type === 'decision_recorded') {
                showNotification(\`\${message.decision === 'delete_both' ? '🗑️' : '✅'} Decision recorded\`);
            }
        };
        
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
                
                updateStats();
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
            
            if (pair.type === 'exact_duplicate') {
                reasons.push('Files are exact duplicates (identical content)');
            }
            
            const sizeDiff = Math.abs(content1.size - content2.size);
            if (sizeDiff === 0) {
                reasons.push('Identical file sizes');
            } else if (sizeDiff < 100) {
                reasons.push('Very similar file sizes');
            }
            
            const name1 = content1.name.toLowerCase();
            const name2 = content2.name.toLowerCase();
            
            if (name1.includes('copy') || name2.includes('copy')) {
                reasons.push('One file appears to be a copy');
            }
            
            if (name1.includes('backup') || name2.includes('backup')) {
                reasons.push('One file appears to be a backup');
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
                                Modified: \${formatDate(pair.file1_content?.modified)}
                            </div>
                            <div class="file-content">\${pair.file1_content?.preview || 'Loading...'}</div>
                        </div>
                        
                        <div class="file-preview">
                            <div class="file-name">\${pair.file2_content?.name || 'File 2'}</div>
                            <div class="file-meta">
                                Size: \${formatSize(pair.file2_content?.size || 0)} • 
                                Modified: \${formatDate(pair.file2_content?.modified)}
                            </div>
                            <div class="file-content">\${pair.file2_content?.preview || 'Loading...'}</div>
                        </div>
                    </div>
                    
                    <div style="margin-top: 20px; padding: 15px; background: #f1f3f4; border-radius: 10px;">
                        <strong>🧠 Why these files match:</strong>
                        <ul style="margin: 10px 0; padding-left: 20px;">
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
                
                decisions.push({ pair, decision });
                
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
            
            updateStats();
        }
        
        function updateStats() {
            document.getElementById('remaining-count').textContent = filePairs.length - currentIndex;
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
                    <h2>🎉 All done!</h2>
                    <p>No duplicate files found. Your codebase is well organized!</p>
                    <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: white; border: none; border-radius: 10px; cursor: pointer;">
                        Scan Again
                    </button>
                </div>
            \`;
        }
        
        function showCompletionState() {
            const cardStack = document.getElementById('card-stack');
            cardStack.innerHTML = \`
                <div class="empty-state">
                    <h2>✨ Session Complete!</h2>
                    <p>You processed \${decisions.length} file pairs</p>
                    <p>Great job organizing your files!</p>
                    <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: white; border: none; border-radius: 10px; cursor: pointer;">
                        Start New Session
                    </button>
                </div>
            \`;
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
        
        // Auto-load when page loads
        setTimeout(loadFilePairs, 2000);
    </script>
</body>
</html>
        `;
    }
}

// Start the system
const swiper = new LightweightFileSwiper();
swiper.start();