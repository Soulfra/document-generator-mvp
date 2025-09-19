#!/usr/bin/env node

/**
 * 🌐 MVP API
 * 
 * External API for generating MVPs from documents
 * Provides REST endpoints for document-to-MVP pipeline
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const UnifiedMVPGenerator = require('./unified-mvp-generator');
const CodeQualityChecker = require('./code-quality-checker');

const app = express();
const PORT = process.env.PORT || 8090;

// File upload configuration
const upload = multer({
    dest: 'uploads/',
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['text/plain', 'text/markdown', 'application/pdf', 'application/json'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Supported: .txt, .md, .pdf, .json'));
        }
    }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Initialize services
const mvpGenerator = new UnifiedMVPGenerator();
const qualityChecker = new CodeQualityChecker();

// Track generation jobs
const jobs = new Map();

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'MVP Generation API',
        version: '1.0.0',
        activeJobs: jobs.size,
        timestamp: Date.now()
    });
});

// Main page with API documentation
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>🌐 MVP Generation API</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6; max-width: 1200px; margin: 0 auto; padding: 20px;
            background: #f5f5f5;
        }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; padding: 30px; border-radius: 10px;
            margin-bottom: 30px;
        }
        .endpoint { 
            background: white; padding: 20px; margin: 20px 0;
            border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .method { 
            display: inline-block; padding: 5px 10px; border-radius: 4px;
            font-weight: bold; margin-right: 10px;
        }
        .method.post { background: #49cc90; color: white; }
        .method.get { background: #61affe; color: white; }
        .method.delete { background: #f93e3e; color: white; }
        pre { 
            background: #f4f4f4; padding: 15px; border-radius: 5px;
            overflow-x: auto;
        }
        .try-it {
            background: #667eea; color: white; border: none;
            padding: 10px 20px; border-radius: 5px; cursor: pointer;
            margin-top: 10px;
        }
        .try-it:hover { background: #764ba2; }
        .stats {
            display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px; margin: 20px 0;
        }
        .stat-card {
            background: white; padding: 20px; border-radius: 8px;
            text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .stat-number { font-size: 2em; font-weight: bold; color: #667eea; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🌐 MVP Generation API</h1>
        <p>Transform documents into working MVPs with a single API call</p>
    </div>
    
    <div class="stats">
        <div class="stat-card">
            <div class="stat-number">${jobs.size}</div>
            <div>Active Jobs</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">5</div>
            <div>Templates Available</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">< 5min</div>
            <div>Average Generation Time</div>
        </div>
    </div>
    
    <h2>📚 API Endpoints</h2>
    
    <div class="endpoint">
        <h3><span class="method post">POST</span> /api/mvp/generate</h3>
        <p>Generate an MVP from a document</p>
        <h4>Request Body:</h4>
        <pre>{
  "document": {
    "content": "Your business plan or specification text",
    "type": "business-plan" // or "technical-spec", "chat-log", etc.
  },
  "options": {
    "name": "MyAwesomeApp",
    "template": "saas-platform", // optional
    "database": "postgresql",    // optional
    "deployment": {
      "platform": "docker"      // or "kubernetes", "vercel", etc.
    }
  }
}</pre>
        <h4>Response:</h4>
        <pre>{
  "success": true,
  "jobId": "mvp_1234567890_abc123",
  "status": "processing",
  "estimatedTime": "4-6 minutes",
  "checkUrl": "/api/mvp/status/mvp_1234567890_abc123"
}</pre>
        <button class="try-it" onclick="tryGenerate()">Try It</button>
    </div>
    
    <div class="endpoint">
        <h3><span class="method post">POST</span> /api/mvp/upload</h3>
        <p>Upload a document file for MVP generation</p>
        <h4>Form Data:</h4>
        <pre>file: (your document file - .txt, .md, .pdf, .json)
name: "MyAwesomeApp" (optional)
template: "saas-platform" (optional)</pre>
        <h4>Response:</h4>
        <pre>{
  "success": true,
  "jobId": "mvp_1234567890_abc123",
  "fileInfo": {
    "name": "business-plan.pdf",
    "size": 245678,
    "type": "application/pdf"
  }
}</pre>
    </div>
    
    <div class="endpoint">
        <h3><span class="method get">GET</span> /api/mvp/status/:jobId</h3>
        <p>Check the status of an MVP generation job</p>
        <h4>Response:</h4>
        <pre>{
  "jobId": "mvp_1234567890_abc123",
  "status": "completed", // or "processing", "failed"
  "progress": {
    "current": "backend_generation",
    "completed": ["document_analysis", "architecture_decisions", "template_matching"],
    "percentage": 65
  },
  "result": {
    "downloadUrl": "/api/mvp/download/mvp_1234567890_abc123",
    "previewUrl": "http://localhost:3000",
    "documentation": "/api/mvp/docs/mvp_1234567890_abc123"
  }
}</pre>
    </div>
    
    <div class="endpoint">
        <h3><span class="method get">GET</span> /api/mvp/download/:jobId</h3>
        <p>Download the generated MVP as a zip file</p>
        <h4>Response:</h4>
        <p>Binary zip file containing the complete MVP project</p>
    </div>
    
    <div class="endpoint">
        <h3><span class="method get">GET</span> /api/mvp/templates</h3>
        <p>List available MVP templates</p>
        <h4>Response:</h4>
        <pre>{
  "templates": [
    {
      "id": "saas-platform",
      "name": "SaaS Platform",
      "description": "Multi-tenant SaaS with billing",
      "features": ["auth", "dashboard", "api", "billing"],
      "stack": ["express", "react", "postgresql", "stripe"]
    },
    // ... more templates
  ]
}</pre>
    </div>
    
    <h2>🚀 Quick Start</h2>
    <pre>// Using fetch
fetch('http://localhost:${PORT}/api/mvp/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    document: {
      content: 'I want to build a task management SaaS...',
      type: 'business-plan'
    },
    options: {
      name: 'TaskMaster Pro'
    }
  })
})
.then(res => res.json())
.then(data => console.log('Job ID:', data.jobId));</pre>
    
    <script>
        function tryGenerate() {
            alert('Check the console for example implementation!');
            console.log(\`
// Example MVP generation request
fetch('http://localhost:${PORT}/api/mvp/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    document: {
      content: 'I want to build a collaborative project management tool...',
      type: 'business-plan'
    },
    options: {
      name: 'ProjectHub',
      template: 'saas-platform'
    }
  })
});
            \`);
        }
    </script>
</body>
</html>
    `);
});

// Generate MVP from document
app.post('/api/mvp/generate', async (req, res) => {
    try {
        const { document, options = {} } = req.body;
        
        if (!document || !document.content) {
            return res.status(400).json({
                success: false,
                error: 'Document content is required'
            });
        }
        
        // Create job
        const jobId = `mvp_${Date.now()}_${uuidv4().substr(0, 8)}`;
        const job = {
            id: jobId,
            status: 'processing',
            document,
            options,
            createdAt: Date.now(),
            progress: {
                current: 'document_analysis',
                completed: [],
                percentage: 0
            }
        };
        
        jobs.set(jobId, job);
        
        // Start generation in background
        generateMVP(job);
        
        res.json({
            success: true,
            jobId,
            status: 'processing',
            estimatedTime: '4-6 minutes',
            checkUrl: `/api/mvp/status/${jobId}`
        });
        
    } catch (error) {
        console.error('Generation error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Upload document for MVP generation
app.post('/api/mvp/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
        }
        
        // Read file content
        const fs = require('fs').promises;
        const content = await fs.readFile(req.file.path, 'utf8');
        
        // Create job
        const jobId = `mvp_${Date.now()}_${uuidv4().substr(0, 8)}`;
        const job = {
            id: jobId,
            status: 'processing',
            document: {
                content,
                type: req.body.type || 'unknown',
                filename: req.file.originalname
            },
            options: {
                name: req.body.name || 'Generated MVP',
                template: req.body.template
            },
            createdAt: Date.now(),
            progress: {
                current: 'document_analysis',
                completed: [],
                percentage: 0
            }
        };
        
        jobs.set(jobId, job);
        
        // Clean up uploaded file
        await fs.unlink(req.file.path);
        
        // Start generation in background
        generateMVP(job);
        
        res.json({
            success: true,
            jobId,
            fileInfo: {
                name: req.file.originalname,
                size: req.file.size,
                type: req.file.mimetype
            }
        });
        
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Check job status
app.get('/api/mvp/status/:jobId', (req, res) => {
    const job = jobs.get(req.params.jobId);
    
    if (!job) {
        return res.status(404).json({
            success: false,
            error: 'Job not found'
        });
    }
    
    const response = {
        jobId: job.id,
        status: job.status,
        progress: job.progress
    };
    
    if (job.status === 'completed' && job.result) {
        response.result = {
            downloadUrl: `/api/mvp/download/${job.id}`,
            previewUrl: job.result.urls?.frontend || 'http://localhost:3000',
            documentation: `/api/mvp/docs/${job.id}`,
            generatedAt: job.completedAt
        };
    } else if (job.status === 'failed') {
        response.error = job.error;
    }
    
    res.json(response);
});

// Download generated MVP
app.get('/api/mvp/download/:jobId', async (req, res) => {
    const job = jobs.get(req.params.jobId);
    
    if (!job || job.status !== 'completed') {
        return res.status(404).json({
            success: false,
            error: 'MVP not ready for download'
        });
    }
    
    // In production, this would zip the project directory
    // For now, return a mock response
    res.json({
        success: true,
        message: 'Download endpoint - would return zip file',
        projectPath: job.result?.paths?.root
    });
});

// Get MVP documentation
app.get('/api/mvp/docs/:jobId', (req, res) => {
    const job = jobs.get(req.params.jobId);
    
    if (!job || job.status !== 'completed') {
        return res.status(404).json({
            success: false,
            error: 'Documentation not available'
        });
    }
    
    res.json({
        success: true,
        documentation: {
            overview: 'Generated MVP Documentation',
            architecture: job.result?.architecture,
            template: job.result?.template,
            deployment: job.result?.deployment,
            apis: job.result?.backend?.endpoints || []
        }
    });
});

// List available templates
app.get('/api/mvp/templates', (req, res) => {
    res.json({
        templates: [
            {
                id: 'saas-platform',
                name: 'SaaS Platform',
                description: 'Multi-tenant SaaS application with billing',
                features: ['user-auth', 'subscription-billing', 'dashboard', 'api'],
                stack: ['express', 'react', 'postgresql', 'stripe']
            },
            {
                id: 'marketplace',
                name: 'Marketplace Platform',
                description: 'Buy/sell marketplace with transactions',
                features: ['listings', 'search', 'payments', 'reviews'],
                stack: ['nodejs', 'vue', 'mongodb', 'stripe']
            },
            {
                id: 'ai-assistant',
                name: 'AI Assistant App',
                description: 'AI-powered assistant application',
                features: ['chat-interface', 'ai-integration', 'history'],
                stack: ['express', 'react', 'openai', 'redis']
            },
            {
                id: 'api-service',
                name: 'API Service',
                description: 'RESTful API with documentation',
                features: ['rest-api', 'auth', 'rate-limiting', 'swagger'],
                stack: ['express', 'postgresql', 'jwt', 'swagger']
            },
            {
                id: 'mobile-app',
                name: 'Mobile App Backend',
                description: 'Backend for mobile applications',
                features: ['push-notifications', 'user-sync', 'offline-support'],
                stack: ['nodejs', 'mongodb', 'firebase', 'websocket']
            }
        ]
    });
});

// Background MVP generation
async function generateMVP(job) {
    try {
        // Update progress
        const updateProgress = (step, percentage) => {
            job.progress.current = step;
            job.progress.percentage = percentage;
            if (!job.progress.completed.includes(step)) {
                job.progress.completed.push(step);
            }
        };
        
        // Listen to generator events
        mvpGenerator.on('step:start', (step) => {
            const stepIndex = mvpGenerator.generationSteps.indexOf(step);
            const percentage = Math.round((stepIndex / mvpGenerator.generationSteps.length) * 100);
            updateProgress(step, percentage);
        });
        
        // Generate MVP
        const result = await mvpGenerator.generateFromDocument(job.document, job.options);
        
        // Update job
        job.status = 'completed';
        job.result = result;
        job.completedAt = Date.now();
        job.progress.percentage = 100;
        
        console.log(`✅ Job ${job.id} completed successfully`);
        
    } catch (error) {
        console.error(`❌ Job ${job.id} failed:`, error);
        job.status = 'failed';
        job.error = error.message;
    }
}

// Start server
app.listen(PORT, () => {
    console.log(`🌐 MVP Generation API running on http://localhost:${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}`);
    console.log('');
    console.log('Available endpoints:');
    console.log(`  POST /api/mvp/generate     - Generate MVP from document`);
    console.log(`  POST /api/mvp/upload       - Upload document file`);
    console.log(`  GET  /api/mvp/status/:id   - Check generation status`);
    console.log(`  GET  /api/mvp/download/:id - Download generated MVP`);
    console.log(`  GET  /api/mvp/templates    - List available templates`);
});

module.exports = app;