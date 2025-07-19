#!/usr/bin/env node

/**
 * Document Generator Web Interface
 * Real-time human-in-the-loop document processing
 */

const express = require('express');
const WebSocket = require('ws');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

class DocumentGeneratorWebInterface {
  constructor(port = 8080) {
    this.port = port;
    this.app = express();
    this.server = null;
    this.wss = null;
    this.clients = new Set();
    this.processingJobs = new Map();
  }

  async initialize() {
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
    this.setupFileUpload();
    
    return this;
  }

  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.static('public'));
    this.app.use('/uploads', express.static('uploads'));
  }

  setupFileUpload() {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        const uploadDir = './uploads';
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
      },
      filename: (req, file, cb) => {
        const timestamp = Date.now();
        const ext = path.extname(file.originalname);
        cb(null, `doc-${timestamp}${ext}`);
      }
    });

    this.upload = multer({
      storage,
      limits: {
        fileSize: 500 * 1024 * 1024 // 500MB
      },
      fileFilter: (req, file, cb) => {
        const allowedTypes = [
          'text/plain',
          'application/pdf',
          'text/markdown',
          'application/json',
          'text/csv'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Unsupported file type'));
        }
      }
    });
  }

  setupRoutes() {
    // Main interface
    this.app.get('/', (req, res) => {
      res.send(this.getMainHTML());
    });

    // Upload document
    this.app.post('/api/upload', this.upload.single('document'), (req, res) => {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const jobId = `job-${Date.now()}`;
      const job = {
        id: jobId,
        filename: req.file.originalname,
        filepath: req.file.path,
        size: req.file.size,
        status: 'uploaded',
        createdAt: new Date(),
        stages: []
      };

      this.processingJobs.set(jobId, job);
      
      res.json({
        jobId,
        message: 'File uploaded successfully',
        filename: req.file.originalname,
        size: req.file.size
      });
    });

    // Start processing
    this.app.post('/api/process/:jobId', async (req, res) => {
      const jobId = req.params.jobId;
      const job = this.processingJobs.get(jobId);
      
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      job.status = 'processing';
      this.broadcast('jobUpdate', job);
      
      // Start processing pipeline
      this.startProcessing(job);
      
      res.json({ message: 'Processing started', jobId });
    });

    // Get job status
    this.app.get('/api/jobs/:jobId', (req, res) => {
      const job = this.processingJobs.get(req.params.jobId);
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }
      res.json(job);
    });

    // List all jobs
    this.app.get('/api/jobs', (req, res) => {
      const jobs = Array.from(this.processingJobs.values());
      res.json(jobs);
    });

    // Human approval endpoint
    this.app.post('/api/approve/:jobId/:stageId', (req, res) => {
      const { jobId, stageId } = req.params;
      const { approved, feedback } = req.body;
      
      const job = this.processingJobs.get(jobId);
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      const stage = job.stages.find(s => s.id === stageId);
      if (!stage) {
        return res.status(404).json({ error: 'Stage not found' });
      }

      stage.approved = approved;
      stage.feedback = feedback;
      stage.approvedAt = new Date();

      this.broadcast('approvalUpdate', { jobId, stageId, approved, feedback });
      
      // Continue processing if approved
      if (approved) {
        this.continueProcessing(job, stageId);
      }

      res.json({ message: 'Approval recorded' });
    });

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date(),
        jobs: this.processingJobs.size,
        clients: this.clients.size
      });
    });
  }

  setupWebSocket() {
    this.server = this.app.listen(this.port, () => {
      console.log(`🌐 Document Generator Web Interface running on http://localhost:${this.port}`);
    });

    this.wss = new WebSocket.Server({ server: this.server });

    this.wss.on('connection', (ws) => {
      console.log('👤 Client connected');
      this.clients.add(ws);

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleWebSocketMessage(ws, data);
        } catch (error) {
          console.error('Invalid WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        console.log('👤 Client disconnected');
        this.clients.delete(ws);
      });

      // Send current jobs on connection
      const jobs = Array.from(this.processingJobs.values());
      ws.send(JSON.stringify({ type: 'initialJobs', jobs }));
    });
  }

  handleWebSocketMessage(ws, data) {
    switch (data.type) {
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
      
      case 'getJobs':
        const jobs = Array.from(this.processingJobs.values());
        ws.send(JSON.stringify({ type: 'jobs', jobs }));
        break;
        
      default:
        console.log('Unknown WebSocket message type:', data.type);
    }
  }

  broadcast(type, data) {
    const message = JSON.stringify({ type, data });
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  async startProcessing(job) {
    console.log(`🚀 Starting processing for job: ${job.id}`);
    
    const stages = [
      { id: 'analysis', name: 'Document Analysis', needsApproval: false },
      { id: 'requirements', name: 'Requirements Extraction', needsApproval: true },
      { id: 'architecture', name: 'Architecture Design', needsApproval: true },
      { id: 'code', name: 'Code Generation', needsApproval: true },
      { id: 'packaging', name: 'MVP Packaging', needsApproval: false }
    ];

    job.stages = stages.map(stage => ({
      ...stage,
      status: 'pending',
      startedAt: null,
      completedAt: null,
      approved: null
    }));

    this.broadcast('jobUpdate', job);

    // Process each stage
    for (const stage of job.stages) {
      await this.processStage(job, stage);
    }

    job.status = 'completed';
    job.completedAt = new Date();
    this.broadcast('jobUpdate', job);
  }

  async processStage(job, stage) {
    console.log(`📋 Processing stage: ${stage.name} for job: ${job.id}`);
    
    stage.status = 'processing';
    stage.startedAt = new Date();
    this.broadcast('stageUpdate', { jobId: job.id, stage });

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

    if (stage.needsApproval) {
      stage.status = 'awaiting_approval';
      stage.completedAt = new Date();
      
      // Generate mock results for approval
      stage.results = this.generateStageResults(stage.id);
      
      this.broadcast('approvalNeeded', { 
        jobId: job.id, 
        stage,
        message: `Human approval needed for ${stage.name}`
      });
      
      // Wait for approval (in real implementation, this would be event-driven)
      await this.waitForApproval(job.id, stage.id);
    } else {
      stage.status = 'completed';
      stage.completedAt = new Date();
      stage.results = this.generateStageResults(stage.id);
    }

    this.broadcast('stageUpdate', { jobId: job.id, stage });
  }

  generateStageResults(stageId) {
    const mockResults = {
      analysis: {
        type: 'Business Plan',
        complexity: 'Medium',
        confidence: 0.87,
        keyTopics: ['SaaS Platform', 'User Management', 'Payment Processing']
      },
      requirements: {
        functional: [
          'User registration and authentication',
          'Dashboard with analytics',
          'Payment integration',
          'Admin panel'
        ],
        technical: [
          'React.js frontend',
          'Node.js backend',
          'PostgreSQL database',
          'Docker deployment'
        ]
      },
      architecture: {
        pattern: 'Microservices',
        components: ['API Gateway', 'User Service', 'Payment Service', 'Analytics Service'],
        database: 'PostgreSQL with Redis cache',
        deployment: 'Docker containers on AWS'
      },
      code: {
        frontend: 'React.js with TypeScript',
        backend: 'Node.js with Express',
        database: 'PostgreSQL with Prisma ORM',
        tests: 'Jest unit tests included'
      },
      packaging: {
        dockerfiles: 'Generated',
        deploymentScripts: 'Ready',
        documentation: 'Complete',
        readyToDeploy: true
      }
    };

    return mockResults[stageId] || { status: 'completed' };
  }

  async waitForApproval(jobId, stageId) {
    return new Promise((resolve) => {
      const checkApproval = () => {
        const job = this.processingJobs.get(jobId);
        const stage = job.stages.find(s => s.id === stageId);
        
        if (stage.approved !== null) {
          resolve(stage.approved);
        } else {
          setTimeout(checkApproval, 1000);
        }
      };
      
      checkApproval();
    });
  }

  async continueProcessing(job, stageId) {
    console.log(`✅ Stage ${stageId} approved for job ${job.id}, continuing...`);
    // Processing continues automatically in the pipeline
  }

  getMainHTML() {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document Generator - Transform Documents into MVPs</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; margin-bottom: 30px; border-radius: 12px; }
        .upload-area { background: white; border: 2px dashed #ddd; border-radius: 12px; padding: 60px 20px; text-align: center; margin-bottom: 30px; transition: all 0.3s; }
        .upload-area:hover { border-color: #667eea; background: #f8f9ff; }
        .upload-area.dragover { border-color: #667eea; background: #e8f2ff; }
        .jobs-container { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .job-card { border: 1px solid #eee; border-radius: 8px; padding: 20px; margin-bottom: 15px; }
        .job-header { display: flex; justify-content: between; align-items: center; margin-bottom: 15px; }
        .status { padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
        .status.uploaded { background: #e3f2fd; color: #1976d2; }
        .status.processing { background: #fff3e0; color: #f57c00; }
        .status.completed { background: #e8f5e8; color: #388e3c; }
        .progress-bar { width: 100%; height: 8px; background: #eee; border-radius: 4px; overflow: hidden; margin: 10px 0; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #667eea, #764ba2); transition: width 0.3s; }
        .stages { margin-top: 15px; }
        .stage { display: flex; justify-content: space-between; align-items: center; padding: 10px; margin: 5px 0; border-radius: 6px; background: #f9f9f9; }
        .stage.processing { background: #fff3e0; }
        .stage.completed { background: #e8f5e8; }
        .stage.awaiting_approval { background: #ffebee; }
        .approval-section { background: #f5f5f5; padding: 15px; border-radius: 8px; margin-top: 10px; }
        .btn { padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; transition: all 0.3s; }
        .btn-primary { background: #667eea; color: white; }
        .btn-success { background: #4caf50; color: white; }
        .btn-danger { background: #f44336; color: white; }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
        .hidden { display: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎭 Document Generator</h1>
            <p>Transform any document into a working MVP with AI and human oversight</p>
        </div>

        <div class="upload-area" id="uploadArea">
            <h3>📄 Upload Your Document</h3>
            <p>Drop files here or click to browse</p>
            <p><small>Supports: Chat logs, PDFs, Markdown, Business plans (up to 500MB)</small></p>
            <input type="file" id="fileInput" style="display: none;" accept=".txt,.log,.pdf,.md,.json,.csv">
            <div id="uploadProgress" class="hidden">
                <div class="progress-bar">
                    <div class="progress-fill" id="uploadProgressBar"></div>
                </div>
                <p id="uploadStatus">Uploading...</p>
            </div>
        </div>

        <div class="jobs-container">
            <h2>📋 Processing Jobs</h2>
            <div id="jobsList">
                <p>No jobs yet. Upload a document to get started!</p>
            </div>
        </div>
    </div>

    <script>
        class DocumentGeneratorUI {
            constructor() {
                this.ws = null;
                this.jobs = new Map();
                this.initializeWebSocket();
                this.setupEventListeners();
            }

            initializeWebSocket() {
                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                this.ws = new WebSocket(\`\${protocol}//\${window.location.host}\`);
                
                this.ws.onopen = () => console.log('WebSocket connected');
                this.ws.onmessage = (event) => this.handleWebSocketMessage(JSON.parse(event.data));
                this.ws.onclose = () => setTimeout(() => this.initializeWebSocket(), 3000);
            }

            handleWebSocketMessage(message) {
                switch (message.type) {
                    case 'initialJobs':
                        message.jobs.forEach(job => this.jobs.set(job.id, job));
                        this.renderJobs();
                        break;
                    case 'jobUpdate':
                        this.jobs.set(message.data.id, message.data);
                        this.renderJobs();
                        break;
                    case 'stageUpdate':
                        const job = this.jobs.get(message.data.jobId);
                        if (job) {
                            const stageIndex = job.stages.findIndex(s => s.id === message.data.stage.id);
                            if (stageIndex !== -1) {
                                job.stages[stageIndex] = message.data.stage;
                                this.renderJobs();
                            }
                        }
                        break;
                    case 'approvalNeeded':
                        this.showApprovalDialog(message.data);
                        break;
                }
            }

            setupEventListeners() {
                const uploadArea = document.getElementById('uploadArea');
                const fileInput = document.getElementById('fileInput');

                uploadArea.addEventListener('click', () => fileInput.click());
                uploadArea.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    uploadArea.classList.add('dragover');
                });
                uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
                uploadArea.addEventListener('drop', (e) => {
                    e.preventDefault();
                    uploadArea.classList.remove('dragover');
                    this.handleFiles(e.dataTransfer.files);
                });

                fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));
            }

            async handleFiles(files) {
                if (files.length === 0) return;
                
                const file = files[0];
                const formData = new FormData();
                formData.append('document', file);

                this.showUploadProgress(true);

                try {
                    const response = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData
                    });

                    const result = await response.json();
                    
                    if (response.ok) {
                        this.showUploadProgress(false);
                        await this.startProcessing(result.jobId);
                    } else {
                        alert('Upload failed: ' + result.error);
                        this.showUploadProgress(false);
                    }
                } catch (error) {
                    alert('Upload error: ' + error.message);
                    this.showUploadProgress(false);
                }
            }

            showUploadProgress(show) {
                const progress = document.getElementById('uploadProgress');
                const uploadArea = document.getElementById('uploadArea');
                
                if (show) {
                    progress.classList.remove('hidden');
                    uploadArea.style.pointerEvents = 'none';
                } else {
                    progress.classList.add('hidden');
                    uploadArea.style.pointerEvents = 'auto';
                }
            }

            async startProcessing(jobId) {
                try {
                    const response = await fetch(\`/api/process/\${jobId}\`, {
                        method: 'POST'
                    });
                    
                    if (!response.ok) {
                        const error = await response.json();
                        alert('Failed to start processing: ' + error.error);
                    }
                } catch (error) {
                    alert('Processing error: ' + error.message);
                }
            }

            renderJobs() {
                const jobsList = document.getElementById('jobsList');
                
                if (this.jobs.size === 0) {
                    jobsList.innerHTML = '<p>No jobs yet. Upload a document to get started!</p>';
                    return;
                }

                jobsList.innerHTML = Array.from(this.jobs.values()).map(job => this.renderJob(job)).join('');
            }

            renderJob(job) {
                const progress = this.calculateProgress(job);
                
                return \`
                    <div class="job-card">
                        <div class="job-header">
                            <h3>\${job.filename}</h3>
                            <span class="status \${job.status}">\${job.status.toUpperCase()}</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: \${progress}%"></div>
                        </div>
                        <p><strong>Size:</strong> \${(job.size / 1024 / 1024).toFixed(2)} MB</p>
                        <p><strong>Created:</strong> \${new Date(job.createdAt).toLocaleString()}</p>
                        
                        \${job.stages ? this.renderStages(job) : ''}
                    </div>
                \`;
            }

            renderStages(job) {
                return \`
                    <div class="stages">
                        <h4>Processing Stages:</h4>
                        \${job.stages.map(stage => this.renderStage(job.id, stage)).join('')}
                    </div>
                \`;
            }

            renderStage(jobId, stage) {
                let approvalSection = '';
                
                if (stage.status === 'awaiting_approval') {
                    approvalSection = \`
                        <div class="approval-section">
                            <h5>Human Approval Required</h5>
                            \${stage.results ? '<pre>' + JSON.stringify(stage.results, null, 2) + '</pre>' : ''}
                            <button class="btn btn-success" onclick="app.approve('\${jobId}', '\${stage.id}', true)">✅ Approve</button>
                            <button class="btn btn-danger" onclick="app.approve('\${jobId}', '\${stage.id}', false)">❌ Reject</button>
                        </div>
                    \`;
                }

                return \`
                    <div class="stage \${stage.status}">
                        <span>\${stage.name}</span>
                        <span>\${this.getStageIcon(stage.status)} \${stage.status.replace('_', ' ').toUpperCase()}</span>
                    </div>
                    \${approvalSection}
                \`;
            }

            getStageIcon(status) {
                const icons = {
                    pending: '⏳',
                    processing: '🔄',
                    completed: '✅',
                    awaiting_approval: '👤'
                };
                return icons[status] || '❓';
            }

            calculateProgress(job) {
                if (!job.stages) return 0;
                
                const completed = job.stages.filter(s => s.status === 'completed').length;
                return (completed / job.stages.length) * 100;
            }

            async approve(jobId, stageId, approved) {
                const feedback = approved ? '' : prompt('Please provide feedback for rejection:');
                
                try {
                    const response = await fetch(\`/api/approve/\${jobId}/\${stageId}\`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ approved, feedback })
                    });

                    if (!response.ok) {
                        const error = await response.json();
                        alert('Approval failed: ' + error.error);
                    }
                } catch (error) {
                    alert('Approval error: ' + error.message);
                }
            }

            showApprovalDialog(data) {
                // Could implement a modal here for better UX
                console.log('Approval needed:', data);
            }
        }

        const app = new DocumentGeneratorUI();
    </script>
</body>
</html>`;
  }
}

// Start server if run directly
if (require.main === module) {
  const webInterface = new DocumentGeneratorWebInterface();
  webInterface.initialize();
}

module.exports = DocumentGeneratorWebInterface;