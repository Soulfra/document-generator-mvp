#!/usr/bin/env node

/**
 * 🧠 SMART FILE MANAGER
 * 
 * Real-time file monitoring with AI-powered similarity detection
 * Swipe interface for keeping/removing files
 * Learning system that remembers your preferences
 * 
 * Uses existing infrastructure:
 * - Document comparison engine
 * - Duplicate detection algorithms
 * - Swipe decision interface
 * - Reasoning systems
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const chokidar = require('chokidar');
const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();

class SmartFileManager {
    constructor() {
        this.port = 3008;
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });
        
        // File monitoring
        this.watchers = new Map();
        this.fileIndex = new Map(); // filename -> metadata
        this.similarityMatrix = new Map(); // file1:file2 -> similarity score
        
        // Learning system
        this.userPreferences = {
            similarityThreshold: 0.85,
            autoActions: new Map(), // pattern -> action
            keepPatterns: new Set(),
            removePatterns: new Set()
        };
        
        // Database for decisions and learning
        this.db = new sqlite3.Database('./file-decisions.db');
        
        // Real-time clients
        this.clients = new Set();
        
        // Processing queue
        this.processingQueue = [];
        this.isProcessing = false;
        
        console.log('🧠 SMART FILE MANAGER');
        console.log('====================');
        console.log('📁 Real-time file monitoring');
        console.log('🔍 AI-powered similarity detection');
        console.log('👆 Swipe decision interface');
        console.log('🤖 Learning user preferences');
    }
    
    async initialize() {
        // Initialize database
        await this.initDatabase();
        
        // Load user preferences
        await this.loadPreferences();
        
        // Setup express routes
        this.setupRoutes();
        
        // Setup WebSocket handlers
        this.setupWebSocket();
        
        // Start monitoring the root directory
        await this.startFileMonitoring();
        
        console.log('✅ Smart File Manager initialized');
    }
    
    async initDatabase() {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                // File metadata table
                this.db.run(`
                    CREATE TABLE IF NOT EXISTS files (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        path TEXT UNIQUE,
                        hash TEXT,
                        size INTEGER,
                        modified INTEGER,
                        created INTEGER,
                        type TEXT,
                        language TEXT,
                        similarity_processed INTEGER DEFAULT 0
                    )
                `);
                
                // Similarity relationships
                this.db.run(`
                    CREATE TABLE IF NOT EXISTS similarities (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        file1_path TEXT,
                        file2_path TEXT,
                        similarity_score REAL,
                        comparison_type TEXT,
                        created INTEGER DEFAULT (strftime('%s', 'now')),
                        UNIQUE(file1_path, file2_path, comparison_type)
                    )
                `);
                
                // User decisions for learning
                this.db.run(`
                    CREATE TABLE IF NOT EXISTS decisions (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        file1_path TEXT,
                        file2_path TEXT,
                        decision TEXT, -- 'keep_both', 'keep_file1', 'keep_file2', 'merge', 'delete_both'
                        similarity_score REAL,
                        reasoning TEXT,
                        timestamp INTEGER DEFAULT (strftime('%s', 'now'))
                    )
                `);
                
                // User preferences
                this.db.run(`
                    CREATE TABLE IF NOT EXISTS preferences (
                        key TEXT PRIMARY KEY,
                        value TEXT,
                        updated INTEGER DEFAULT (strftime('%s', 'now'))
                    )
                `);
                
                resolve();
            });
        });
    }
    
    setupRoutes() {
        this.app.use(express.static('public'));
        this.app.use(express.json());
        
        // Main interface
        this.app.get('/', (req, res) => {
            res.send(this.getSwipeInterface());
        });
        
        // Get file pairs for review
        this.app.get('/api/file-pairs', async (req, res) => {
            try {
                const pairs = await this.getFilePairsForReview();
                res.json(pairs);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Record decision
        this.app.post('/api/decision', async (req, res) => {
            try {
                const { file1, file2, decision, reasoning } = req.body;
                await this.recordDecision(file1, file2, decision, reasoning);
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Get file content for comparison
        this.app.get('/api/file-content/:path(*)', async (req, res) => {
            try {
                const filePath = req.params.path;
                const content = await this.getFilePreview(filePath);
                res.json(content);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Statistics
        this.app.get('/api/stats', async (req, res) => {
            const stats = await this.getStats();
            res.json(stats);
        });
    }
    
    setupWebSocket() {
        this.wss.on('connection', (ws) => {
            this.clients.add(ws);
            console.log('📱 Client connected to Smart File Manager');
            
            // Send current status
            ws.send(JSON.stringify({
                type: 'status',
                data: {
                    filesMonitored: this.fileIndex.size,
                    similarPairs: this.similarityMatrix.size,
                    processingQueue: this.processingQueue.length
                }
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
    
    async startFileMonitoring() {
        const rootPath = process.cwd();
        
        console.log(`📂 Starting file monitoring: ${rootPath}`);
        
        // Initial scan
        await this.scanDirectory(rootPath);
        
        // Watch for changes
        const watcher = chokidar.watch(rootPath, {
            ignored: /(^|[\/\\])\../, // ignore dotfiles
            persistent: true,
            ignoreInitial: true
        });
        
        watcher
            .on('add', (filePath) => this.onFileAdded(filePath))
            .on('change', (filePath) => this.onFileChanged(filePath))
            .on('unlink', (filePath) => this.onFileRemoved(filePath));
        
        this.watchers.set(rootPath, watcher);
    }
    
    async scanDirectory(dirPath, depth = 0) {
        if (depth > 3) return; // Limit recursion
        
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                
                if (this.shouldIgnore(entry.name)) continue;
                
                if (entry.isFile()) {
                    await this.processFile(fullPath);
                } else if (entry.isDirectory()) {
                    await this.scanDirectory(fullPath, depth + 1);
                }
            }
        } catch (error) {
            // Skip directories we can't read
        }
    }
    
    shouldIgnore(filename) {
        const ignorePatterns = [
            'node_modules', '.git', '.DS_Store', 'Thumbs.db',
            '__pycache__', '.pytest_cache', 'dist', 'build'
        ];
        
        return ignorePatterns.some(pattern => filename.includes(pattern));
    }
    
    async processFile(filePath) {
        try {
            const stats = await fs.stat(filePath);
            const content = await fs.readFile(filePath);
            const hash = crypto.createHash('sha256').update(content).digest('hex');
            
            const fileInfo = {
                path: filePath,
                hash,
                size: stats.size,
                modified: stats.mtime.getTime(),
                created: stats.birthtime.getTime(),
                type: this.getFileType(filePath),
                language: this.getLanguage(filePath)
            };
            
            // Store in index
            this.fileIndex.set(filePath, fileInfo);
            
            // Store in database
            await this.storeFileInfo(fileInfo);
            
            // Queue for similarity processing
            this.queueSimilarityCheck(filePath);
            
        } catch (error) {
            console.error(`Error processing file ${filePath}:`, error.message);
        }
    }
    
    getFileType(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const typeMap = {
            '.js': 'javascript', '.ts': 'typescript', '.py': 'python',
            '.md': 'markdown', '.html': 'html', '.css': 'css',
            '.json': 'json', '.yml': 'yaml', '.yaml': 'yaml',
            '.txt': 'text', '.sql': 'sql', '.sh': 'bash'
        };
        return typeMap[ext] || 'unknown';
    }
    
    getLanguage(filePath) {
        return this.getFileType(filePath);
    }
    
    async storeFileInfo(fileInfo) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT OR REPLACE INTO files 
                 (path, hash, size, modified, created, type, language) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [fileInfo.path, fileInfo.hash, fileInfo.size, fileInfo.modified, 
                 fileInfo.created, fileInfo.type, fileInfo.language],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }
    
    queueSimilarityCheck(filePath) {
        if (!this.processingQueue.includes(filePath)) {
            this.processingQueue.push(filePath);
            this.processSimilarityQueue();
        }
    }
    
    async processSimilarityQueue() {
        if (this.isProcessing || this.processingQueue.length === 0) return;
        
        this.isProcessing = true;
        
        try {
            while (this.processingQueue.length > 0) {
                const filePath = this.processingQueue.shift();
                await this.findSimilarFiles(filePath);
                
                // Broadcast progress
                this.broadcast({
                    type: 'processing',
                    data: {
                        file: path.basename(filePath),
                        remaining: this.processingQueue.length
                    }
                });
            }
        } finally {
            this.isProcessing = false;
        }
    }
    
    async findSimilarFiles(filePath) {
        const currentFile = this.fileIndex.get(filePath);
        if (!currentFile) return;
        
        // Compare with all other files of the same type
        for (const [otherPath, otherFile] of this.fileIndex) {
            if (otherPath === filePath) continue;
            if (otherFile.type !== currentFile.type) continue;
            
            const similarity = await this.calculateSimilarity(filePath, otherPath);
            
            if (similarity > 0.7) { // Only store significant similarities
                await this.storeSimilarity(filePath, otherPath, similarity);
                
                // If above threshold, notify for review
                if (similarity > this.userPreferences.similarityThreshold) {
                    this.broadcast({
                        type: 'similar_files_found',
                        data: {
                            file1: path.basename(filePath),
                            file2: path.basename(otherPath),
                            similarity: Math.round(similarity * 100)
                        }
                    });
                }
            }
        }
    }
    
    async calculateSimilarity(file1, file2) {
        try {
            // Use your existing document comparison engine
            const content1 = await fs.readFile(file1, 'utf8');
            const content2 = await fs.readFile(file2, 'utf8');
            
            // Multiple similarity measures
            const exactSim = this.exactSimilarity(content1, content2);
            const textSim = this.textSimilarity(content1, content2);
            const structSim = this.structuralSimilarity(file1, file2);
            
            // Weighted average
            return (exactSim * 0.5) + (textSim * 0.3) + (structSim * 0.2);
            
        } catch (error) {
            return 0;
        }
    }
    
    exactSimilarity(text1, text2) {
        if (text1 === text2) return 1.0;
        
        // Normalize whitespace and compare
        const norm1 = text1.replace(/\s+/g, ' ').trim();
        const norm2 = text2.replace(/\s+/g, ' ').trim();
        
        if (norm1 === norm2) return 0.95;
        
        // Character-level similarity
        const longer = norm1.length > norm2.length ? norm1 : norm2;
        const shorter = norm1.length > norm2.length ? norm2 : norm1;
        
        if (longer.length === 0) return 1.0;
        
        const editDistance = this.levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }
    
    textSimilarity(text1, text2) {
        // Word-based similarity
        const words1 = new Set(text1.toLowerCase().match(/\w+/g) || []);
        const words2 = new Set(text2.toLowerCase().match(/\w+/g) || []);
        
        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);
        
        return union.size > 0 ? intersection.size / union.size : 0;
    }
    
    structuralSimilarity(file1, file2) {
        // Similar file names get bonus points
        const name1 = path.basename(file1).toLowerCase();
        const name2 = path.basename(file2).toLowerCase();
        
        // Remove version numbers and extensions
        const clean1 = name1.replace(/[-_]v?\d+/g, '').replace(/\.[^.]+$/, '');
        const clean2 = name2.replace(/[-_]v?\d+/g, '').replace(/\.[^.]+$/, '');
        
        if (clean1 === clean2) return 0.8;
        
        // Similar directory structure
        const dir1 = path.dirname(file1);
        const dir2 = path.dirname(file2);
        
        if (dir1 === dir2) return 0.3;
        
        return 0;
    }
    
    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }
    
    async storeSimilarity(file1, file2, score) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT OR REPLACE INTO similarities 
                 (file1_path, file2_path, similarity_score, comparison_type) 
                 VALUES (?, ?, ?, 'content')`,
                [file1, file2, score],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }
    
    async getFilePairsForReview() {
        return new Promise((resolve, reject) => {
            this.db.all(
                `SELECT s.*, f1.size as file1_size, f2.size as file2_size
                 FROM similarities s
                 JOIN files f1 ON s.file1_path = f1.path
                 JOIN files f2 ON s.file2_path = f2.path
                 WHERE s.similarity_score > ?
                 AND NOT EXISTS (
                     SELECT 1 FROM decisions d 
                     WHERE d.file1_path = s.file1_path 
                     AND d.file2_path = s.file2_path
                 )
                 ORDER BY s.similarity_score DESC
                 LIMIT 10`,
                [this.userPreferences.similarityThreshold],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }
    
    async recordDecision(file1, file2, decision, reasoning) {
        return new Promise((resolve, reject) => {
            // Get similarity score
            this.db.get(
                'SELECT similarity_score FROM similarities WHERE file1_path = ? AND file2_path = ?',
                [file1, file2],
                (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    const similarity = row ? row.similarity_score : 0;
                    
                    // Record decision
                    this.db.run(
                        `INSERT INTO decisions 
                         (file1_path, file2_path, decision, similarity_score, reasoning) 
                         VALUES (?, ?, ?, ?, ?)`,
                        [file1, file2, decision, similarity, reasoning],
                        (err) => {
                            if (err) reject(err);
                            else {
                                // Learn from decision
                                this.learnFromDecision(file1, file2, decision, similarity);
                                resolve();
                            }
                        }
                    );
                }
            );
        });
    }
    
    learnFromDecision(file1, file2, decision, similarity) {
        // Extract patterns
        const name1 = path.basename(file1);
        const name2 = path.basename(file2);
        
        // Learn naming patterns
        if (decision === 'keep_file1' || decision === 'keep_file2') {
            const preferredFile = decision === 'keep_file1' ? name1 : name2;
            const pattern = this.extractPattern(preferredFile);
            this.userPreferences.keepPatterns.add(pattern);
        }
        
        // Adjust similarity threshold based on decisions
        if (decision === 'keep_both' && similarity > this.userPreferences.similarityThreshold) {
            this.userPreferences.similarityThreshold += 0.05; // Be more strict
        } else if (decision !== 'keep_both' && similarity < this.userPreferences.similarityThreshold) {
            this.userPreferences.similarityThreshold -= 0.05; // Be more lenient
        }
        
        // Save preferences
        this.savePreferences();
    }
    
    extractPattern(filename) {
        // Extract meaningful patterns from filenames
        return filename
            .replace(/\d+/g, '#') // Replace numbers with placeholders
            .replace(/[-_]v?\d+/g, '') // Remove version indicators
            .toLowerCase();
    }
    
    async savePreferences() {
        const prefData = JSON.stringify(this.userPreferences);
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT OR REPLACE INTO preferences (key, value) VALUES (?, ?)',
                ['user_preferences', prefData],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }
    
    async loadPreferences() {
        return new Promise((resolve) => {
            this.db.get(
                'SELECT value FROM preferences WHERE key = ?',
                ['user_preferences'],
                (err, row) => {
                    if (!err && row) {
                        try {
                            this.userPreferences = { ...this.userPreferences, ...JSON.parse(row.value) };
                        } catch (e) {
                            // Use defaults
                        }
                    }
                    resolve();
                }
            );
        });
    }
    
    async getFilePreview(filePath) {
        try {
            const stats = await fs.stat(filePath);
            const content = await fs.readFile(filePath, 'utf8');
            
            return {
                path: filePath,
                name: path.basename(filePath),
                size: stats.size,
                modified: stats.mtime,
                preview: content.slice(0, 1000), // First 1000 chars
                lines: content.split('\n').length,
                type: this.getFileType(filePath)
            };
        } catch (error) {
            throw new Error(`Cannot read file: ${error.message}`);
        }
    }
    
    async getStats() {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT 
                    (SELECT COUNT(*) FROM files) as total_files,
                    (SELECT COUNT(*) FROM similarities WHERE similarity_score > 0.8) as high_similarity,
                    (SELECT COUNT(*) FROM decisions) as decisions_made,
                    (SELECT AVG(similarity_score) FROM similarities) as avg_similarity
            `, (err, rows) => {
                if (err) reject(err);
                else resolve(rows[0]);
            });
        });
    }
    
    // Event handlers
    async onFileAdded(filePath) {
        console.log(`📄 File added: ${path.basename(filePath)}`);
        await this.processFile(filePath);
        
        this.broadcast({
            type: 'file_added',
            data: { path: filePath, name: path.basename(filePath) }
        });
    }
    
    async onFileChanged(filePath) {
        console.log(`📝 File changed: ${path.basename(filePath)}`);
        await this.processFile(filePath);
        
        this.broadcast({
            type: 'file_changed',
            data: { path: filePath, name: path.basename(filePath) }
        });
    }
    
    async onFileRemoved(filePath) {
        console.log(`🗑️ File removed: ${path.basename(filePath)}`);
        this.fileIndex.delete(filePath);
        
        // Remove from database
        this.db.run('DELETE FROM files WHERE path = ?', [filePath]);
        this.db.run('DELETE FROM similarities WHERE file1_path = ? OR file2_path = ?', [filePath, filePath]);
        
        this.broadcast({
            type: 'file_removed',
            data: { path: filePath, name: path.basename(filePath) }
        });
    }
    
    getSwipeInterface() {
        // Return the swipe interface HTML (will create this next)
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Smart File Manager - Swipe Interface</title>
            <style>
                body { margin: 0; padding: 20px; background: #1a1a1a; color: #fff; font-family: Arial, sans-serif; }
                .container { max-width: 800px; margin: 0 auto; }
                .header { text-align: center; margin-bottom: 2rem; }
                .loading { text-align: center; padding: 2rem; }
                .file-pair { background: #333; border-radius: 10px; padding: 20px; margin-bottom: 20px; }
                .similarity-score { background: linear-gradient(45deg, #ff6b6b, #4ecdc4); color: white; padding: 5px 15px; border-radius: 20px; display: inline-block; margin-bottom: 15px; }
                .file-preview { background: #222; padding: 15px; border-radius: 5px; margin: 10px 0; max-height: 200px; overflow-y: auto; }
                .actions { text-align: center; margin-top: 20px; }
                .action-btn { margin: 0 10px; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; }
                .keep-both { background: #4ecdc4; color: white; }
                .keep-left { background: #45b7d1; color: white; }
                .keep-right { background: #96ceb4; color: white; }
                .delete-both { background: #ff6b6b; color: white; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🧠 Smart File Manager</h1>
                    <p>Swipe or click to manage similar files</p>
                    <div id="status">Loading...</div>
                </div>
                <div id="file-pairs">
                    <div class="loading">Finding similar files...</div>
                </div>
            </div>
            
            <script>
                const ws = new WebSocket('ws://localhost:3008');
                
                ws.onmessage = (event) => {
                    const message = JSON.parse(event.data);
                    console.log('WebSocket message:', message);
                    
                    if (message.type === 'status') {
                        document.getElementById('status').textContent = 
                            \`\${message.data.filesMonitored} files monitored, \${message.data.similarPairs} similar pairs found\`;
                    }
                };
                
                // Load file pairs
                fetch('/api/file-pairs')
                    .then(res => res.json())
                    .then(pairs => {
                        const container = document.getElementById('file-pairs');
                        if (pairs.length === 0) {
                            container.innerHTML = '<div class="loading">No similar files found. Great job keeping things organized! 🎉</div>';
                            return;
                        }
                        
                        container.innerHTML = pairs.map(pair => \`
                            <div class="file-pair" id="pair-\${pair.id}">
                                <div class="similarity-score">\${Math.round(pair.similarity_score * 100)}% Similar</div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                                    <div>
                                        <h3>\${pair.file1_path.split('/').pop()}</h3>
                                        <div class="file-preview" id="preview1-\${pair.id}">Loading...</div>
                                        <small>Size: \${pair.file1_size} bytes</small>
                                    </div>
                                    <div>
                                        <h3>\${pair.file2_path.split('/').pop()}</h3>
                                        <div class="file-preview" id="preview2-\${pair.id}">Loading...</div>
                                        <small>Size: \${pair.file2_size} bytes</small>
                                    </div>
                                </div>
                                <div class="actions">
                                    <button class="action-btn keep-both" onclick="makeDecision('\${pair.file1_path}', '\${pair.file2_path}', 'keep_both', \${pair.id})">Keep Both</button>
                                    <button class="action-btn keep-left" onclick="makeDecision('\${pair.file1_path}', '\${pair.file2_path}', 'keep_file1', \${pair.id})">Keep Left</button>
                                    <button class="action-btn keep-right" onclick="makeDecision('\${pair.file1_path}', '\${pair.file2_path}', 'keep_file2', \${pair.id})">Keep Right</button>
                                    <button class="action-btn delete-both" onclick="makeDecision('\${pair.file1_path}', '\${pair.file2_path}', 'delete_both', \${pair.id})">Delete Both</button>
                                </div>
                            </div>
                        \`).join('');
                        
                        // Load previews
                        pairs.forEach(pair => {
                            loadPreview(pair.file1_path, \`preview1-\${pair.id}\`);
                            loadPreview(pair.file2_path, \`preview2-\${pair.id}\`);
                        });
                    });
                
                function loadPreview(filePath, elementId) {
                    fetch(\`/api/file-content/\${encodeURIComponent(filePath)}\`)
                        .then(res => res.json())
                        .then(data => {
                            document.getElementById(elementId).textContent = data.preview;
                        })
                        .catch(err => {
                            document.getElementById(elementId).textContent = 'Error loading preview';
                        });
                }
                
                function makeDecision(file1, file2, decision, pairId) {
                    const reasoning = prompt('Why did you make this decision? (optional)') || '';
                    
                    fetch('/api/decision', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ file1, file2, decision, reasoning })
                    })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            document.getElementById(\`pair-\${pairId}\`).style.opacity = '0.5';
                            document.getElementById(\`pair-\${pairId}\`).innerHTML += '<div style="text-align: center; margin-top: 10px; color: #4ecdc4;">✅ Decision recorded</div>';
                        }
                    });
                }
            </script>
        </body>
        </html>
        `;
    }
    
    start() {
        this.server.listen(this.port, async () => {
            console.log(`\n🚀 Smart File Manager running at http://localhost:${this.port}`);
            console.log('📊 WebSocket connection available for real-time updates');
            console.log('👆 Open the interface to start managing similar files\n');
            
            await this.initialize();
        });
    }
}

// Start the Smart File Manager
const manager = new SmartFileManager();
manager.start();

module.exports = SmartFileManager;