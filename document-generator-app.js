#!/usr/bin/env node

/**
 * FOCUSED DOCUMENT GENERATOR - ONE THING THAT ACTUALLY WORKS
 * Upload document → AI analysis → Template selection → Working MVP
 * No chaos, no duplicates, just results.
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { createAuthMiddleware } = require('./auth-middleware-unified');

const app = express();
const PORT = 4000;

// Initialize auth middleware
const auth = createAuthMiddleware('document-generator', {
  authServiceUrl: 'http://localhost:8888'
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    // Accept text files, markdown, PDFs, etc.
    const allowedTypes = /\.(txt|md|pdf|doc|docx|json)$/i;
    if (allowedTypes.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Only text, markdown, PDF, and document files allowed'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

app.use(express.json());
app.use(express.static('public'));

// Optional auth for all routes
app.use(auth.optionalAuth());

// Track processed documents and MVPs
const processedDocuments = [];
const generatedMVPs = [];

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    service: 'Document Generator',
    processed: processedDocuments.length,
    mvps: generatedMVPs.length,
    timestamp: Date.now()
  });
});

// Main interface
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>📄→🚀 Document Generator</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
    }
    .title {
      font-size: 2.5rem;
      color: #333;
      margin-bottom: 10px;
    }
    .subtitle {
      color: #666;
      font-size: 1.1rem;
    }
    .upload-area {
      border: 3px dashed #667eea;
      border-radius: 15px;
      padding: 60px 20px;
      text-align: center;
      background: #f8f9ff;
      margin-bottom: 30px;
      transition: all 0.3s ease;
      cursor: pointer;
    }
    .upload-area:hover {
      background: #f0f2ff;
      border-color: #5a67d8;
    }
    .upload-area.dragover {
      background: #e6f3ff;
      border-color: #3182ce;
    }
    .upload-icon {
      font-size: 3rem;
      margin-bottom: 20px;
    }
    .upload-text {
      font-size: 1.2rem;
      color: #4a5568;
      margin-bottom: 10px;
    }
    .upload-hint {
      color: #718096;
      font-size: 0.9rem;
    }
    .file-input {
      display: none;
    }
    .process-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 15px 30px;
      border-radius: 10px;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      width: 100%;
      margin-bottom: 20px;
      transition: transform 0.2s;
    }
    .process-btn:hover {
      transform: translateY(-2px);
    }
    .process-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
      transform: none;
    }
    .progress {
      display: none;
      text-align: center;
      margin: 20px 0;
    }
    .progress-bar {
      width: 100%;
      height: 8px;
      background: #e2e8f0;
      border-radius: 4px;
      overflow: hidden;
      margin: 10px 0;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea, #764ba2);
      width: 0%;
      transition: width 0.3s ease;
      animation: progress-shine 2s infinite;
    }
    @keyframes progress-shine {
      0% { background-position: -200px 0; }
      100% { background-position: 200px 0; }
    }
    .result {
      display: none;
      padding: 20px;
      background: #f0fff4;
      border: 1px solid #9ae6b4;
      border-radius: 10px;
      margin-top: 20px;
    }
    .mvp-card {
      background: white;
      padding: 20px;
      border-radius: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      margin: 10px 0;
    }
    .mvp-name {
      font-size: 1.3rem;
      font-weight: 600;
      color: #2d3748;
      margin-bottom: 10px;
    }
    .mvp-url {
      background: #667eea;
      color: white;
      padding: 10px 15px;
      border-radius: 8px;
      text-decoration: none;
      display: inline-block;
      font-weight: 500;
      transition: background 0.2s;
    }
    .mvp-url:hover {
      background: #5a67d8;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 20px;
      margin-top: 30px;
    }
    .stat-card {
      text-align: center;
      padding: 20px;
      background: #f7fafc;
      border-radius: 10px;
    }
    .stat-number {
      font-size: 2rem;
      font-weight: bold;
      color: #667eea;
    }
    .stat-label {
      color: #4a5568;
      font-size: 0.9rem;
      margin-top: 5px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">📄→🚀 Document Generator</h1>
      <p class="subtitle">Transform any document into a working MVP in minutes</p>
    </div>
    
    <div class="upload-area" onclick="document.getElementById('fileInput').click()">
      <div class="upload-icon">📄</div>
      <div class="upload-text">Drop your document here or click to browse</div>
      <div class="upload-hint">Supports: .txt, .md, .pdf, .doc, .docx, .json</div>
    </div>
    
    <input type="file" id="fileInput" class="file-input" accept=".txt,.md,.pdf,.doc,.docx,.json">
    
    <button class="process-btn" id="processBtn" onclick="processDocument()" disabled>
      🚀 Generate MVP from Document
    </button>
    
    <div class="progress" id="progress">
      <div>Processing your document...</div>
      <div class="progress-bar">
        <div class="progress-fill" id="progressFill"></div>
      </div>
      <div id="progressText">Analyzing document...</div>
    </div>
    
    <div class="result" id="result">
      <h3>🎉 MVP Generated Successfully!</h3>
      <div id="mvpDetails"></div>
    </div>
    
    <div class="stats">
      <div class="stat-card">
        <div class="stat-number" id="processedCount">${processedDocuments.length}</div>
        <div class="stat-label">Documents Processed</div>
      </div>
      <div class="stat-card">
        <div class="stat-number" id="mvpCount">${generatedMVPs.length}</div>
        <div class="stat-label">MVPs Generated</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">~5 min</div>
        <div class="stat-label">Avg Processing Time</div>
      </div>
    </div>
  </div>
  
  <script>
    let selectedFile = null;
    
    // File input handling
    document.getElementById('fileInput').addEventListener('change', function(e) {
      selectedFile = e.target.files[0];
      if (selectedFile) {
        document.querySelector('.upload-text').textContent = selectedFile.name;
        document.getElementById('processBtn').disabled = false;
      }
    });
    
    // Drag and drop
    const uploadArea = document.querySelector('.upload-area');
    
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
      uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
      
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        selectedFile = files[0];
        document.querySelector('.upload-text').textContent = selectedFile.name;
        document.getElementById('processBtn').disabled = false;
      }
    });
    
    // Process document
    async function processDocument() {
      if (!selectedFile) return;
      
      // Show progress
      document.getElementById('progress').style.display = 'block';
      document.getElementById('result').style.display = 'none';
      document.getElementById('processBtn').disabled = true;
      
      const formData = new FormData();
      formData.append('document', selectedFile);
      
      try {
        // Step 1: Upload and analyze
        updateProgress(20, 'Uploading document...');
        
        const uploadResponse = await fetch('/api/process', {
          method: 'POST',
          body: formData
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Upload failed');
        }
        
        const data = await uploadResponse.json();
        
        // Step 2: Generate MVP
        updateProgress(60, 'Generating MVP...');
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        updateProgress(100, 'Complete!');
        
        // Show result
        setTimeout(() => {
          document.getElementById('progress').style.display = 'none';
          document.getElementById('result').style.display = 'block';
          
          document.getElementById('mvpDetails').innerHTML = \`
            <div class="mvp-card">
              <div class="mvp-name">\${data.mvp.name}</div>
              <p>Template: \${data.mvp.template}</p>
              <p>Files Generated: \${data.mvp.files}</p>
              <a href="\${data.mvp.url}" target="_blank" class="mvp-url">
                🚀 Open MVP: \${data.mvp.url}
              </a>
            </div>
          \`;
          
          // Update stats
          document.getElementById('processedCount').textContent = parseInt(document.getElementById('processedCount').textContent) + 1;
          document.getElementById('mvpCount').textContent = parseInt(document.getElementById('mvpCount').textContent) + 1;
          
          document.getElementById('processBtn').disabled = false;
        }, 1000);
        
      } catch (error) {
        document.getElementById('progress').style.display = 'none';
        alert('Error: ' + error.message);
        document.getElementById('processBtn').disabled = false;
      }
    }
    
    function updateProgress(percent, text) {
      document.getElementById('progressFill').style.width = percent + '%';
      document.getElementById('progressText').textContent = text;
    }
  </script>
</body>
</html>
  `);
});

// Process document API
app.post('/api/process', auth.requireAuth(), upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No document uploaded' });
    }
    
    console.log(`📄 Processing document: ${req.file.originalname}`);
    
    // Read the uploaded document
    const documentPath = req.file.path;
    const content = fs.readFileSync(documentPath, 'utf8');
    
    // Step 1: Analyze with AI API
    console.log('🤖 Analyzing document with AI...');
    const analysisResponse = await fetch('http://localhost:3001/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: content,
        type: 'business_plan',
        options: {
          extractFeatures: true,
          generateSummary: true,
          identifyRequirements: true
        }
      })
    });
    
    let analysis = null;
    if (analysisResponse.ok) {
      const analysisData = await analysisResponse.json();
      analysis = analysisData.analysis;
    } else {
      console.warn('AI analysis failed, using fallback');
      analysis = {
        summary: content.substring(0, 200) + '...',
        features: ['core-functionality', 'user-interface', 'data-management'],
        complexity: 'moderate'
      };
    }
    
    // Step 2: Select appropriate template
    const template = selectTemplate(content, analysis);
    
    // Step 3: Generate MVP with template processor
    console.log(`🎨 Generating MVP with ${template} template...`);
    const mvpResponse = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateId: template,
        projectName: req.file.originalname.replace(/\\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, '-').toLowerCase(),
        customizations: {
          features: analysis.features || ['basic-functionality'],
          theme: 'modern',
          description: analysis.summary || 'Generated from uploaded document'
        }
      })
    });
    
    if (!mvpResponse.ok) {
      throw new Error('MVP generation failed');
    }
    
    const mvpData = await mvpResponse.json();
    
    if (!mvpData.success || !mvpData.mvp) {
      throw new Error('MVP generation returned invalid response');
    }
    
    // Record the processing
    const processedDoc = {
      id: Date.now(),
      filename: req.file.originalname,
      analysisBy: analysisResponse.ok ? 'AI' : 'fallback',
      template: template,
      mvp: mvpData.mvp,
      timestamp: new Date().toISOString()
    };
    
    processedDocuments.push(processedDoc);
    generatedMVPs.push(mvpData.mvp);
    
    // Clean up uploaded file
    fs.unlinkSync(documentPath);
    
    console.log(`✅ MVP generated: ${mvpData.mvp.name} on port ${mvpData.mvp.port}`);
    
    res.json({
      success: true,
      document: {
        name: req.file.originalname,
        size: req.file.size,
        analysis: analysis
      },
      mvp: mvpData.mvp,
      processedBy: analysisResponse.ok ? 'AI' : 'fallback'
    });
    
  } catch (error) {
    console.error('Document processing error:', error);
    res.status(500).json({ 
      error: 'Document processing failed', 
      message: error.message 
    });
  }
});

// Get processed documents
app.get('/api/documents', (req, res) => {
  res.json({
    processed: processedDocuments,
    mvps: generatedMVPs,
    total: processedDocuments.length
  });
});

// Helper function to select appropriate template
function selectTemplate(content, analysis) {
  const contentLower = content.toLowerCase();
  
  // Marketplace indicators
  if (contentLower.includes('marketplace') || 
      contentLower.includes('buy') && contentLower.includes('sell') ||
      contentLower.includes('platform') && contentLower.includes('users')) {
    return 'marketplace';
  }
  
  // API service indicators
  if (contentLower.includes('api') || 
      contentLower.includes('service') && contentLower.includes('endpoint') ||
      contentLower.includes('integration')) {
    return 'api-service';
  }
  
  // Gaming indicators
  if (contentLower.includes('game') || 
      contentLower.includes('player') ||
      contentLower.includes('level') ||
      contentLower.includes('score')) {
    return 'gaming-platform';
  }
  
  // AI/Assistant indicators
  if (contentLower.includes('ai') || 
      contentLower.includes('assistant') ||
      contentLower.includes('chat') ||
      contentLower.includes('intelligence')) {
    return 'ai-assistant';
  }
  
  // Default to SaaS platform
  return 'saas-platform';
}

// Start the focused Document Generator
app.listen(PORT, () => {
  console.log(`
📄→🚀 FOCUSED DOCUMENT GENERATOR STARTED!
📍 URL: http://localhost:${PORT}
✅ Ready to transform documents into working MVPs
🎯 One thing that actually works - no chaos!

Upload a document and watch it become a real MVP in minutes.
  `);
});

module.exports = app;