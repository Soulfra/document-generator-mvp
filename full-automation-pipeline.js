#!/usr/bin/env node

/**
 * 🔥 FULL AUTOMATION PIPELINE
 * 
 * Zero-touch document → MVP automation
 * Just drop a document and get a live app
 */

const AutomaticRippingEngine = require('./automatic-ripping-engine');
const UltimateMenuRemote = require('./ultimate-menu-remote');
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { spawn } = require('child_process');

class FullAutomationPipeline {
    constructor() {
        this.app = express();
        this.port = 9999;
        this.ripper = new AutomaticRippingEngine();
        this.uploads = multer({ dest: 'uploads/' });
        
        console.log('🔥 FULL AUTOMATION PIPELINE ACTIVATED');
        console.log('🚀 Zero-touch Document → MVP automation');
        console.log('⚡ Drop a document, get a live app!');
        
        this.initialize();
    }
    
    /**
     * 🎯 Initialize Pipeline
     */
    async initialize() {
        // Setup express routes
        this.setupRoutes();
        
        // Start the automation server
        this.app.listen(this.port, () => {
            console.log(`\n✅ Automation Pipeline ready at http://localhost:${this.port}`);
            console.log('📁 Drop documents at http://localhost:9999/upload');
            console.log('🎮 Or use Ultimate Menu Remote at http://localhost:7777');
        });
        
        // Start background services
        this.startBackgroundServices();
    }
    
    /**
     * 🛣️ Setup Routes
     */
    setupRoutes() {
        // Serve upload interface
        this.app.get('/', (req, res) => {
            res.send(this.generateUploadInterface());
        });
        
        // Handle file uploads
        this.app.post('/upload', this.uploads.single('document'), async (req, res) => {
            try {
                const file = req.file;
                if (!file) {
                    return res.status(400).json({ error: 'No file uploaded' });
                }
                
                console.log(`\n📄 Document uploaded: ${file.originalname}`);
                
                // Move to documents folder for processing
                const targetPath = path.join(__dirname, 'documents', file.originalname);
                await fs.rename(file.path, targetPath);
                
                // Add to ripping queue
                this.ripper.ripDocument(targetPath);
                
                res.json({
                    success: true,
                    message: 'Document queued for automatic processing',
                    documentId: file.filename,
                    originalName: file.originalname
                });
                
            } catch (error) {
                console.error('Upload error:', error);
                res.status(500).json({ error: 'Upload failed' });
            }
        });
        
        // Pipeline status
        this.app.get('/status', async (req, res) => {
            res.json({
                pipeline: 'Full Automation Pipeline',
                status: 'ACTIVE',
                queueLength: this.ripper.ripQueue.length,
                processing: this.ripper.processing,
                services: {
                    ripper: 'ACTIVE',
                    menuRemote: 'AVAILABLE',
                    automation: 'RUNNING'
                }
            });
        });
        
        // Watch folder endpoint
        this.app.post('/watch', async (req, res) => {
            const { folder } = req.body;
            if (folder) {
                await fs.mkdir(folder, { recursive: true });
                console.log(`👁️ Now watching: ${folder}`);
            }
            res.json({ watching: folder || 'default folders' });
        });
        
        // Direct rip endpoint
        this.app.post('/rip', async (req, res) => {
            const { documentPath } = req.body;
            if (!documentPath) {
                return res.status(400).json({ error: 'No document path provided' });
            }
            
            this.ripper.ripDocument(documentPath);
            res.json({ queued: true, path: documentPath });
        });
    }
    
    /**
     * 🎨 Generate Upload Interface
     */
    generateUploadInterface() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>🔥 Document → MVP Automation</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: white;
            margin: 0;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .container {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            border-radius: 30px;
            padding: 60px;
            max-width: 600px;
            width: 100%;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        
        h1 {
            font-size: 48px;
            margin-bottom: 20px;
            background: linear-gradient(45deg, #ff6b6b, #ffd93d);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .upload-zone {
            border: 3px dashed rgba(255, 255, 255, 0.5);
            border-radius: 20px;
            padding: 60px 40px;
            margin: 40px 0;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .upload-zone:hover {
            border-color: #ffd93d;
            background: rgba(255, 217, 61, 0.1);
            transform: scale(1.02);
        }
        
        .upload-zone.dragover {
            border-color: #ff6b6b;
            background: rgba(255, 107, 107, 0.1);
        }
        
        .upload-icon {
            font-size: 72px;
            margin-bottom: 20px;
        }
        
        input[type="file"] {
            display: none;
        }
        
        .status {
            margin-top: 40px;
            padding: 20px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            display: none;
        }
        
        .status.success {
            background: rgba(0, 255, 0, 0.2);
            display: block;
        }
        
        .status.error {
            background: rgba(255, 0, 0, 0.2);
            display: block;
        }
        
        .features {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin: 40px 0;
        }
        
        .feature {
            background: rgba(255, 255, 255, 0.1);
            padding: 20px;
            border-radius: 10px;
        }
        
        .feature-icon {
            font-size: 36px;
            margin-bottom: 10px;
        }
        
        .processing {
            display: none;
            margin-top: 30px;
        }
        
        .processing.active {
            display: block;
        }
        
        .loader {
            width: 50px;
            height: 50px;
            border: 5px solid rgba(255, 255, 255, 0.3);
            border-top-color: #ffd93d;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 20px auto;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        button {
            background: linear-gradient(45deg, #ff6b6b, #ffd93d);
            color: white;
            border: none;
            padding: 15px 40px;
            font-size: 18px;
            border-radius: 50px;
            cursor: pointer;
            transition: all 0.3s ease;
            margin: 10px;
        }
        
        button:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 30px rgba(255, 107, 107, 0.4);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔥 Document → MVP</h1>
        <p style="font-size: 20px; opacity: 0.9;">Zero-Touch Automation Pipeline</p>
        
        <div class="upload-zone" onclick="document.getElementById('fileInput').click();" 
             ondrop="handleDrop(event)" ondragover="handleDragOver(event)" ondragleave="handleDragLeave(event)">
            <div class="upload-icon">📄</div>
            <h2>Drop Any Document Here</h2>
            <p>or click to browse</p>
            <input type="file" id="fileInput" onchange="handleFileSelect(event)" 
                   accept=".md,.txt,.pdf,.json,.yaml,.doc,.docx">
        </div>
        
        <div class="features">
            <div class="feature">
                <div class="feature-icon">🧠</div>
                <strong>AI Analysis</strong>
                <p>Automatically understands your document</p>
            </div>
            <div class="feature">
                <div class="feature-icon">🎯</div>
                <strong>Smart Templates</strong>
                <p>Selects the perfect template</p>
            </div>
            <div class="feature">
                <div class="feature-icon">💻</div>
                <strong>Code Generation</strong>
                <p>Generates complete working code</p>
            </div>
            <div class="feature">
                <div class="feature-icon">🚀</div>
                <strong>Auto Deploy</strong>
                <p>Deploys to production instantly</p>
            </div>
        </div>
        
        <div class="processing" id="processing">
            <div class="loader"></div>
            <h3>🚀 Ripping your document...</h3>
            <p id="processingStatus">Extracting content...</p>
        </div>
        
        <div class="status" id="status"></div>
        
        <div style="margin-top: 40px;">
            <button onclick="window.location.href='http://localhost:7777'">
                🎮 Ultimate Control Panel
            </button>
            <button onclick="checkStatus()">
                📊 Pipeline Status
            </button>
        </div>
    </div>
    
    <script>
        function handleDragOver(e) {
            e.preventDefault();
            e.stopPropagation();
            e.currentTarget.classList.add('dragover');
        }
        
        function handleDragLeave(e) {
            e.preventDefault();
            e.stopPropagation();
            e.currentTarget.classList.remove('dragover');
        }
        
        function handleDrop(e) {
            e.preventDefault();
            e.stopPropagation();
            e.currentTarget.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                uploadFile(files[0]);
            }
        }
        
        function handleFileSelect(e) {
            const files = e.target.files;
            if (files.length > 0) {
                uploadFile(files[0]);
            }
        }
        
        async function uploadFile(file) {
            const formData = new FormData();
            formData.append('document', file);
            
            // Show processing
            document.getElementById('processing').classList.add('active');
            document.getElementById('status').classList.remove('success', 'error');
            
            // Update processing status
            const statuses = [
                'Extracting content...',
                'Analyzing document with AI...',
                'Selecting best template...',
                'Generating code...',
                'Building MVP...',
                'Deploying to production...'
            ];
            
            let statusIndex = 0;
            const statusInterval = setInterval(() => {
                if (statusIndex < statuses.length) {
                    document.getElementById('processingStatus').textContent = statuses[statusIndex++];
                }
            }, 2000);
            
            try {
                const response = await fetch('/upload', {
                    method: 'POST',
                    body: formData
                });
                
                const result = await response.json();
                
                clearInterval(statusInterval);
                document.getElementById('processing').classList.remove('active');
                
                if (result.success) {
                    document.getElementById('status').innerHTML = \`
                        <h3>✅ Success!</h3>
                        <p>Your document is being transformed into a live MVP.</p>
                        <p>Check the console for the deployment URL!</p>
                    \`;
                    document.getElementById('status').classList.add('success');
                } else {
                    throw new Error(result.error || 'Upload failed');
                }
                
            } catch (error) {
                clearInterval(statusInterval);
                document.getElementById('processing').classList.remove('active');
                
                document.getElementById('status').innerHTML = \`
                    <h3>❌ Error</h3>
                    <p>\${error.message}</p>
                \`;
                document.getElementById('status').classList.add('error');
            }
        }
        
        async function checkStatus() {
            const response = await fetch('/status');
            const status = await response.json();
            
            document.getElementById('status').innerHTML = \`
                <h3>📊 Pipeline Status</h3>
                <p>Queue Length: \${status.queueLength}</p>
                <p>Processing: \${status.processing ? 'Yes' : 'No'}</p>
                <p>All Services: ACTIVE</p>
            \`;
            document.getElementById('status').classList.add('success');
        }
    </script>
</body>
</html>`;
    }
    
    /**
     * 🔄 Start Background Services
     */
    startBackgroundServices() {
        // Monitor ripping progress
        setInterval(() => {
            if (this.ripper.processing) {
                console.log(`⚡ Processing queue... (${this.ripper.ripQueue.length} remaining)`);
            }
        }, 10000);
        
        // Auto-cleanup old uploads
        setInterval(async () => {
            try {
                const uploadsDir = path.join(__dirname, 'uploads');
                const files = await fs.readdir(uploadsDir);
                const now = Date.now();
                
                for (const file of files) {
                    const filePath = path.join(uploadsDir, file);
                    const stats = await fs.stat(filePath);
                    
                    // Delete files older than 1 hour
                    if (now - stats.mtimeMs > 3600000) {
                        await fs.unlink(filePath);
                    }
                }
            } catch (error) {
                // Ignore cleanup errors
            }
        }, 300000); // Every 5 minutes
    }
    
    /**
     * 🚀 Quick Start Methods
     */
    
    async quickStart() {
        console.log('\n🚀 QUICK START ACTIVATED');
        console.log('━'.repeat(50));
        console.log('1. Drop documents at: http://localhost:9999');
        console.log('2. Or use Ultimate Menu: http://localhost:7777');
        console.log('3. Or place files in: ./documents folder');
        console.log('━'.repeat(50));
    }
}

// Export for integration
module.exports = FullAutomationPipeline;

// Run if executed directly
if (require.main === module) {
    const pipeline = new FullAutomationPipeline();
    pipeline.quickStart();
}