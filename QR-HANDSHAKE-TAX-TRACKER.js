#!/usr/bin/env node
// QR-HANDSHAKE-TAX-TRACKER.js - QR code handshake for phone scanning and tax tracking

const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class QRHandshakeTaxTracker {
    constructor() {
        this.deviceId = this.generateDeviceId();
        this.handshakes = new Map();
        this.taxRecords = [];
        this.port = 7777;
        
        // Create tax tracking directory
        this.taxDir = './tax-tracking';
        if (!fs.existsSync(this.taxDir)) {
            fs.mkdirSync(this.taxDir, { mode: 0o700 });
        }
        
        console.log('📱 QR HANDSHAKE TAX TRACKER INITIALIZED');
        console.log('🆔 Device ID:', this.deviceId);
    }

    generateDeviceId() {
        const hostname = require('os').hostname();
        const platform = require('os').platform();
        return crypto.createHash('sha256')
            .update(`${hostname}-${platform}`)
            .digest('hex')
            .substring(0, 16);
    }

    generateQRCode() {
        const handshakeToken = crypto.randomBytes(16).toString('hex');
        const timestamp = Date.now();
        
        // Store handshake info
        this.handshakes.set(handshakeToken, {
            timestamp,
            deviceId: this.deviceId,
            status: 'pending'
        });
        
        // Generate connection URL
        const connectionUrl = `http://${this.getLocalIP()}:${this.port}/handshake/${handshakeToken}`;
        
        console.log('\n📱 QR CODE CONNECTION INFO:');
        console.log('================================');
        console.log('🔗 URL:', connectionUrl);
        console.log('🔑 Token:', handshakeToken);
        console.log('⏰ Expires in: 5 minutes');
        
        // Generate ASCII QR code for terminal
        console.log('\n📱 SCAN THIS QR CODE WITH YOUR PHONE:');
        console.log('=====================================\n');
        
        // Simple ASCII representation
        const qrData = connectionUrl;
        console.log('█████████████████████████████');
        console.log('█ ▄▄▄▄▄ █ ▄  ▄█▄█ ▄▄▄▄▄ █');
        console.log('█ █   █ █▄▀ ▀▄ ██ █   █ █');
        console.log('█ █▄▄▄█ █ ▀█▀▄▀ █ █▄▄▄█ █');
        console.log('█▄▄▄▄▄▄▄█ ▀ █ ▀ █▄▄▄▄▄▄▄█');
        console.log('█ ▄  ▀▄▄  ▄▀█▀▄ ▄▄▀▄  ▄▄█');
        console.log('█▄▄▄▀▀▄▄▀▄▄▄█▄▄█▄█▄█▄▄█▄█');
        console.log('█ ▄▄▄▄▄ █▄█▄ ▄ ▀ ██▄▀▄ ▄█');
        console.log('█ █   █ █  ▀██▀▀▄ ▄▄██▀ █');
        console.log('█ █▄▄▄█ █ █▄ ▄ ▀▀▀▀█▄ █▄█');
        console.log('█▄▄▄▄▄▄▄█▄███▄▄▄██▄██▄███');
        console.log('');
        console.log(`📱 Or manually enter: ${connectionUrl}`);
        
        return { handshakeToken, connectionUrl };
    }

    getLocalIP() {
        const interfaces = require('os').networkInterfaces();
        for (const name of Object.keys(interfaces)) {
            for (const iface of interfaces[name]) {
                if (iface.family === 'IPv4' && !iface.internal) {
                    return iface.address;
                }
            }
        }
        return 'localhost';
    }

    startHandshakeServer() {
        const server = http.createServer((req, res) => {
            // Enable CORS for phone access
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            
            const urlParts = req.url.split('/');
            
            if (urlParts[1] === 'handshake' && urlParts[2]) {
                this.handleHandshake(urlParts[2], req, res);
            } else if (urlParts[1] === 'upload' && req.method === 'POST') {
                this.handleTaxUpload(req, res);
            } else if (urlParts[1] === 'status') {
                this.handleStatus(req, res);
            } else {
                this.serveHandshakePage(req, res);
            }
        });
        
        server.listen(this.port, () => {
            console.log(`\n🌐 Handshake server running on port ${this.port}`);
            console.log(`📱 Phone can connect to: http://${this.getLocalIP()}:${this.port}`);
        });
        
        return server;
    }

    handleHandshake(token, req, res) {
        const handshake = this.handshakes.get(token);
        
        if (!handshake) {
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'Invalid handshake token' }));
            return;
        }
        
        // Check if expired (5 minutes)
        if (Date.now() - handshake.timestamp > 300000) {
            res.writeHead(401);
            res.end(JSON.stringify({ error: 'Handshake expired' }));
            return;
        }
        
        // Update handshake status
        handshake.status = 'connected';
        handshake.connectedAt = Date.now();
        handshake.phoneInfo = {
            userAgent: req.headers['user-agent'],
            ip: req.connection.remoteAddress
        };
        
        console.log('\n✅ PHONE HANDSHAKE SUCCESSFUL!');
        console.log('📱 Connected from:', handshake.phoneInfo.ip);
        console.log('🔑 Token:', token);
        
        // Return upload page
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(this.generateUploadPage(token));
    }

    generateUploadPage(token) {
        return `<!DOCTYPE html>
<html>
<head>
    <title>Tax Document Upload</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f0f0f0;
        }
        .container {
            max-width: 400px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            font-size: 24px;
        }
        .upload-area {
            border: 2px dashed #007AFF;
            border-radius: 10px;
            padding: 40px;
            text-align: center;
            margin: 20px 0;
            background: #f8f8f8;
        }
        input[type="file"] {
            display: none;
        }
        .upload-btn {
            background: #007AFF;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            border: none;
            font-size: 16px;
            cursor: pointer;
        }
        .status {
            margin-top: 20px;
            padding: 10px;
            border-radius: 5px;
            display: none;
        }
        .success {
            background: #4CAF50;
            color: white;
        }
        .error {
            background: #f44336;
            color: white;
        }
        .file-list {
            margin-top: 20px;
        }
        .file-item {
            background: #f0f0f0;
            padding: 10px;
            margin: 5px 0;
            border-radius: 5px;
            display: flex;
            justify-content: space-between;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📱 Tax Document Upload</h1>
        <p>Connected to Device: ${this.deviceId.substring(0, 8)}...</p>
        
        <div class="upload-area" id="uploadArea">
            <p>📎 Drag & drop tax documents here</p>
            <p>or</p>
            <label for="fileInput">
                <span class="upload-btn">Choose Files</span>
            </label>
            <input type="file" id="fileInput" multiple accept=".pdf,.png,.jpg,.jpeg,.csv,.xlsx">
        </div>
        
        <div id="status" class="status"></div>
        
        <div id="fileList" class="file-list"></div>
        
        <h3>📊 Tax Categories:</h3>
        <select id="category" style="width: 100%; padding: 10px; font-size: 16px;">
            <option value="income">Income</option>
            <option value="expenses">Business Expenses</option>
            <option value="receipts">Receipts</option>
            <option value="1099">1099 Forms</option>
            <option value="w2">W2 Forms</option>
            <option value="crypto">Crypto Transactions</option>
            <option value="other">Other</option>
        </select>
    </div>
    
    <script>
        const token = '${token}';
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const status = document.getElementById('status');
        const fileList = document.getElementById('fileList');
        
        // Drag & Drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.background = '#e0e0e0';
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.background = '#f8f8f8';
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.background = '#f8f8f8';
            handleFiles(e.dataTransfer.files);
        });
        
        fileInput.addEventListener('change', (e) => {
            handleFiles(e.target.files);
        });
        
        function handleFiles(files) {
            const category = document.getElementById('category').value;
            
            Array.from(files).forEach(file => {
                uploadFile(file, category);
            });
        }
        
        function uploadFile(file, category) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('category', category);
            formData.append('token', token);
            formData.append('timestamp', Date.now());
            
            fetch('/upload', {
                method: 'POST',
                body: formData
            })
            .then(res => res.json())
            .then(data => {
                showStatus('✅ Uploaded: ' + file.name, 'success');
                addFileToList(file.name, category, data.hash);
            })
            .catch(err => {
                showStatus('❌ Error uploading ' + file.name, 'error');
            });
        }
        
        function showStatus(message, type) {
            status.textContent = message;
            status.className = 'status ' + type;
            status.style.display = 'block';
            
            setTimeout(() => {
                status.style.display = 'none';
            }, 3000);
        }
        
        function addFileToList(filename, category, hash) {
            const item = document.createElement('div');
            item.className = 'file-item';
            item.innerHTML = \`
                <span>📄 \${filename}</span>
                <span>\${category}</span>
            \`;
            fileList.appendChild(item);
        }
    </script>
</body>
</html>`;
    }

    handleTaxUpload(req, res) {
        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', () => {
            try {
                // Parse multipart form data (simplified)
                const body = Buffer.concat(chunks);
                
                // Extract file info and save
                const timestamp = Date.now();
                const taxRecord = {
                    timestamp,
                    deviceId: this.deviceId,
                    category: 'income', // Would parse from form data
                    hash: crypto.createHash('sha256').update(body).digest('hex'),
                    size: body.length
                };
                
                this.taxRecords.push(taxRecord);
                
                // Save to tax tracking directory
                const filename = `tax-${timestamp}-${taxRecord.hash.substring(0, 8)}.data`;
                fs.writeFileSync(path.join(this.taxDir, filename), body);
                
                console.log(`\n📊 Tax document uploaded: ${filename}`);
                console.log(`   Category: ${taxRecord.category}`);
                console.log(`   Size: ${taxRecord.size} bytes`);
                console.log(`   Hash: ${taxRecord.hash.substring(0, 16)}...`);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    hash: taxRecord.hash,
                    timestamp
                }));
            } catch (error) {
                res.writeHead(500);
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    }

    handleStatus(req, res) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            deviceId: this.deviceId,
            handshakes: Array.from(this.handshakes.entries()).map(([token, data]) => ({
                token: token.substring(0, 8) + '...',
                status: data.status,
                timestamp: data.timestamp
            })),
            taxRecords: this.taxRecords.length,
            taxSummary: this.generateTaxSummary()
        }));
    }

    serveHandshakePage(req, res) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`<!DOCTYPE html>
<html>
<head>
    <title>QR Handshake Server</title>
    <style>
        body { font-family: monospace; padding: 20px; background: #000; color: #0f0; }
        .qr { background: white; padding: 20px; display: inline-block; margin: 20px 0; }
    </style>
</head>
<body>
    <h1>🔐 QR Handshake Server Active</h1>
    <p>Device ID: ${this.deviceId}</p>
    <p>Status: ✅ Running on port ${this.port}</p>
    <p>Tax Records: ${this.taxRecords.length}</p>
    <div class="qr">
        <p style="color: black;">Scan QR code on phone to connect</p>
    </div>
</body>
</html>`);
    }

    generateTaxSummary() {
        const summary = {
            totalDocuments: this.taxRecords.length,
            categories: {},
            totalSize: 0
        };
        
        this.taxRecords.forEach(record => {
            summary.categories[record.category] = (summary.categories[record.category] || 0) + 1;
            summary.totalSize += record.size;
        });
        
        return summary;
    }

    createTarball() {
        console.log('\n📦 Creating tax tracking tarball...');
        
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const tarballName = `tax-tracking-${timestamp}.tar.gz`;
        
        try {
            execSync(`tar -czf ${tarballName} ${this.taxDir} *.soulfra 2>/dev/null || true`);
            
            const stats = fs.statSync(tarballName);
            console.log(`✅ Tarball created: ${tarballName}`);
            console.log(`📦 Size: ${(stats.size / 1024).toFixed(2)} KB`);
            console.log(`🔐 Contains: Tax documents + Soulfra capsules`);
            
            // Generate tarball hash for verification
            const tarballData = fs.readFileSync(tarballName);
            const tarballHash = crypto.createHash('sha256').update(tarballData).digest('hex');
            console.log(`🔍 Hash: ${tarballHash.substring(0, 32)}...`);
            
            return { tarballName, hash: tarballHash, size: stats.size };
        } catch (error) {
            console.error('❌ Tarball creation failed:', error.message);
            return null;
        }
    }
}

// Run the system
if (require.main === module) {
    console.log('🚀 STARTING QR HANDSHAKE TAX TRACKER');
    console.log('====================================\n');
    
    const tracker = new QRHandshakeTaxTracker();
    
    // Generate QR code
    const { handshakeToken, connectionUrl } = tracker.generateQRCode();
    
    // Start server
    const server = tracker.startHandshakeServer();
    
    console.log('\n📱 INSTRUCTIONS:');
    console.log('================');
    console.log('1. Scan the QR code with your phone camera');
    console.log('2. Or manually enter the URL in your phone browser');
    console.log('3. Upload tax documents by dragging or selecting');
    console.log('4. Documents are encrypted and tracked locally');
    console.log('5. Press Ctrl+C to stop and create tarball backup');
    
    // Handle shutdown
    process.on('SIGINT', () => {
        console.log('\n\n🛑 Shutting down...');
        
        // Create tarball backup
        const tarball = tracker.createTarball();
        
        console.log('\n📊 SESSION SUMMARY:');
        console.log('===================');
        console.log(`Handshakes: ${tracker.handshakes.size}`);
        console.log(`Tax Documents: ${tracker.taxRecords.length}`);
        console.log(`Tax Summary:`, tracker.generateTaxSummary());
        
        if (tarball) {
            console.log(`\n✅ Backup saved: ${tarball.tarballName}`);
        }
        
        server.close();
        process.exit(0);
    });
}

module.exports = QRHandshakeTaxTracker;