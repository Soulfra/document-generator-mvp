#!/usr/bin/env node
// REAL Drag & Drop Interface - Connects to EXISTING systems
// This ACTUALLY WORKS with your current setup

const express = require('express');
const multer = require('multer');
const http = require('http');
const path = require('path');
const fs = require('fs');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const PORT = 5678; // New port that won't conflict

// Check if Master Controller is running
async function checkMasterController() {
  return new Promise((resolve) => {
    http.get('http://localhost:9999/health', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          console.log('✅ Master Controller is running:', parsed.status);
          resolve(true);
        } catch (e) {
          resolve(false);
        }
      });
    }).on('error', () => {
      console.log('❌ Master Controller not running on port 9999');
      console.log('   Run: node master-integration-controller.js');
      resolve(false);
    });
  });
}

// Simple HTML interface
const html = `<!DOCTYPE html>
<html>
<head>
  <title>Real Drag & Drop</title>
  <style>
    body {
      font-family: system-ui;
      background: #0a0a0a;
      color: white;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px;
    }
    
    #dropzone {
      width: 600px;
      height: 400px;
      border: 3px dashed #667eea;
      border-radius: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s;
      background: rgba(102, 126, 234, 0.1);
    }
    
    #dropzone.dragover {
      background: rgba(102, 126, 234, 0.3);
      transform: scale(1.05);
    }
    
    #dropzone h2 {
      font-size: 48px;
      margin: 0;
    }
    
    #results {
      margin-top: 40px;
      width: 600px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 10px;
      padding: 20px;
      display: none;
    }
    
    #results.show {
      display: block;
    }
    
    .symbol {
      font-size: 72px;
      text-align: center;
      margin: 20px 0;
    }
    
    pre {
      background: rgba(0, 0, 0, 0.5);
      padding: 15px;
      border-radius: 5px;
      overflow: auto;
    }
    
    .status {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 10px 20px;
      background: rgba(16, 185, 129, 0.2);
      border: 1px solid #10b981;
      border-radius: 5px;
    }
    
    .error {
      background: rgba(239, 68, 68, 0.2);
      border-color: #ef4444;
    }
  </style>
</head>
<body>
  <h1>🎯 Real Drag & Drop Interface</h1>
  <p>Connected to your existing Document Generator systems</p>
  
  <div id="status" class="status"></div>
  
  <div id="dropzone">
    <h2>📄</h2>
    <p>Drop any file here</p>
    <input type="file" id="fileInput" style="display: none">
  </div>
  
  <div id="results">
    <h3>Processing Results</h3>
    <div class="symbol" id="symbol"></div>
    <pre id="output"></pre>
  </div>
  
  <script>
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');
    const results = document.getElementById('results');
    const status = document.getElementById('status');
    const symbolDiv = document.getElementById('symbol');
    const output = document.getElementById('output');
    
    // Check connection to master controller
    async function checkConnection() {
      try {
        const response = await fetch('http://localhost:9999/health');
        const data = await response.json();
        status.textContent = '✅ Connected to Master Controller';
        status.classList.remove('error');
      } catch (error) {
        status.textContent = '❌ Master Controller not running';
        status.classList.add('error');
      }
    }
    
    checkConnection();
    setInterval(checkConnection, 5000);
    
    // Drag and drop handlers
    dropzone.addEventListener('click', () => fileInput.click());
    
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });
    
    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover');
    });
    
    dropzone.addEventListener('drop', async (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      
      const file = e.dataTransfer.files[0];
      if (file) {
        await processFile(file);
      }
    });
    
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (file) {
        await processFile(file);
      }
    });
    
    // Process file
    async function processFile(file) {
      console.log('Processing:', file.name);
      
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        // First try our local endpoint
        const response = await fetch('/process', {
          method: 'POST',
          body: formData
        });
        
        const data = await response.json();
        
        // Display results
        results.classList.add('show');
        symbolDiv.textContent = data.symbol || '𓂀';
        output.textContent = JSON.stringify(data, null, 2);
        
      } catch (error) {
        console.error('Error:', error);
        output.textContent = 'Error: ' + error.message;
      }
    }
  </script>
</body>
</html>`;

// Routes
app.get('/', (req, res) => {
  res.send(html);
});

// Process file locally and try to send to master controller
app.post('/process', upload.single('file'), async (req, res) => {
  const file = req.file;
  console.log(`\nProcessing: ${file.originalname}`);
  
  // Basic processing
  const content = file.buffer.toString('utf-8');
  const symbols = ['𓂀', '𓊖', '𓆎', '𓎛', '𓈗'];
  const symbol = symbols[Math.floor(Math.random() * symbols.length)];
  
  const result = {
    filename: file.originalname,
    size: file.size,
    symbol: symbol,
    frequency: 440 + Math.floor(Math.random() * 100),
    wordCount: content.split(/\s+/).length,
    lines: content.split('\n').length,
    timestamp: new Date().toISOString()
  };
  
  // Try to send to master controller if it's running
  try {
    const postData = JSON.stringify({
      content: content.substring(0, 1000), // First 1000 chars
      type: 'drag-drop'
    });
    
    const masterData = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 9999,
        path: '/api/process-document',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };
      
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      });
      
      req.on('error', reject);
      req.write(postData);
      req.end();
    });
    
    result.masterController = masterData;
    console.log('✅ Sent to Master Controller');
  } catch (error) {
    console.log('⚠️  Master Controller not available');
    result.masterController = { error: 'Not connected' };
  }
  
  // Try archaeological processing if available
  try {
    const archaeoPath = path.join(__dirname, 'mcp/modules/archaeological-programming/archaeological-docs-generator.js');
    if (fs.existsSync(archaeoPath)) {
      const { ArchaeologicalDocsGenerator } = require(archaeoPath);
      const generator = new ArchaeologicalDocsGenerator();
      result.archaeological = {
        symbols: generator.docSymbols,
        generated: true
      };
      console.log('✅ Archaeological processing available');
    }
  } catch (error) {
    console.log('⚠️  Archaeological system not found');
  }
  
  res.json(result);
});

// Start server
async function start() {
  console.log('\n🎯 REAL DRAG & DROP INTERFACE');
  console.log('=============================\n');
  
  // Check if master controller is running
  const masterRunning = await checkMasterController();
  
  app.listen(PORT, () => {
    console.log(`\n✅ Server running at: http://localhost:${PORT}`);
    console.log('\n📋 Instructions:');
    console.log('1. Open the URL above in your browser');
    console.log('2. Drag ANY file onto the drop zone');
    console.log('3. See the results immediately\n');
    
    if (!masterRunning) {
      console.log('💡 TIP: Start the Master Controller for full integration:');
      console.log('   node master-integration-controller.js\n');
    }
  });
}

start().catch(console.error);