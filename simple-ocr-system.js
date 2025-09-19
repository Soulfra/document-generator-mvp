#!/usr/bin/env node

const http = require('http');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class SimpleOCRSystem {
    constructor() {
        this.screenshots = [];
        this.lastCapture = null;
    }
    
    async captureScreen() {
        const timestamp = Date.now();
        const filename = `screenshot-${timestamp}.png`;
        const filepath = path.join('./verification-proof/screenshots', filename);
        
        return new Promise((resolve) => {
            // Use native screen capture
            const cmd = process.platform === 'darwin' ? 
                `screencapture -x "${filepath}"` : 
                `echo "Screenshot simulated on ${process.platform}"`;
                
            exec(cmd, (error) => {
                if (!error && fs.existsSync(filepath)) {
                    this.screenshots.push({
                        timestamp,
                        filepath,
                        size: fs.statSync(filepath).size
                    });
                    this.lastCapture = timestamp;
                    console.log(`📸 Screenshot captured: ${filename}`);
                    resolve({ success: true, filepath, timestamp });
                } else {
                    console.log('📸 Screenshot simulated (no permissions or non-macOS)');
                    resolve({ success: false, simulated: true, timestamp });
                }
            });
        });
    }
    
    getStatus() {
        return {
            running: true,
            screenshots_taken: this.screenshots.length,
            last_capture: this.lastCapture,
            platform: process.platform,
            proof_files: this.screenshots
        };
    }
}

const ocrSystem = new SimpleOCRSystem();

// Take a screenshot every 30 seconds
setInterval(() => {
    ocrSystem.captureScreen();
}, 30000);

// API server
const server = http.createServer((req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (req.url === '/ocr/status') {
        res.writeHead(200);
        res.end(JSON.stringify(ocrSystem.getStatus()));
    } else if (req.url === '/ocr/capture') {
        ocrSystem.captureScreen().then(result => {
            res.writeHead(200);
            res.end(JSON.stringify(result));
        });
    } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
    }
});

server.listen(3007, () => {
    console.log('👁️ Simple OCR System running on port 3007');
    console.log('📸 Taking screenshots every 30 seconds for verification');
});