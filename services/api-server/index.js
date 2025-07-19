/**
 * Document Generator API Server - Main entry point
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs').promises;

// Import services
const PipelineOrchestrator = require('./PipelineOrchestrator');
const JobQueue = require('./JobQueue');
const WebSocketManager = require('./WebSocketManager');
const HumanApprovalManager = require('./HumanApprovalManager');
const MonitoringManager = require('./MonitoringManager');
const ErrorRecoveryManager = require('./ErrorRecoveryManager');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize services
const jobQueue = new JobQueue();
const wsManager = new WebSocketManager();
const monitoringManager = new MonitoringManager(jobQueue, wsManager);
const errorRecoveryManager = new ErrorRecoveryManager(jobQueue, wsManager, monitoringManager);
const approvalManager = new HumanApprovalManager(jobQueue, wsManager);
const pipelineOrchestrator = new PipelineOrchestrator(jobQueue, wsManager, approvalManager);

// Setup error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  errorRecoveryManager.handleError(error, { type: 'uncaught_exception' });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  errorRecoveryManager.handleError(new Error(reason), { type: 'unhandled_rejection' });
});

// Middleware
app.use(cors());
app.use(express.json());

// Configure file upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    await fs.mkdir(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const jobId = uuidv4();
    const ext = path.extname(file.originalname);
    cb(null, `${jobId}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.txt', '.md', '.pdf', '.json', '.log', '.zip'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} not supported`));
    }
  }
});

/**
 * Health check endpoint
 */
app.get('/health', async (req, res) => {
  try {
    const health = await monitoringManager.runHealthChecks();
    const stats = await monitoringManager.getSystemStats();
    
    res.status(health.status === 'healthy' ? 200 : 503).json({
      status: health.status,
      service: 'document-generator-api',
      version: '1.0.0',
      uptime: process.uptime(),
      checks: health.checks,
      stats
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

/**
 * Upload document endpoint
 */
app.post('/api/documents/upload', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const jobId = path.basename(req.file.filename, path.extname(req.file.filename));
    
    // Create job
    const job = await jobQueue.createJob({
      id: jobId,
      type: 'document_processing',
      status: 'uploaded',
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      uploadedAt: new Date().toISOString(),
      metadata: {
        analysisType: req.body.analysisType || 'comprehensive',
        generateCode: req.body.generateCode !== 'false',
        deploymentTarget: req.body.deploymentTarget || 'docker'
      }
    });

    console.log(`📄 Document uploaded: ${req.file.originalname} (Job: ${jobId})`);

    res.json({
      success: true,
      jobId,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      status: 'uploaded',
      message: 'Document uploaded successfully',
      nextStep: `/api/documents/${jobId}/process`
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get document status
 */
app.get('/api/documents/:id', async (req, res) => {
  try {
    const job = await jobQueue.getJob(req.params.id);
    
    if (!job) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({
      jobId: job.id,
      status: job.status,
      fileName: job.fileName,
      progress: job.progress || 0,
      currentStep: job.currentStep,
      results: job.results,
      error: job.error,
      createdAt: job.uploadedAt,
      updatedAt: job.updatedAt
    });

  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Start processing document
 */
app.post('/api/documents/:id/process', async (req, res) => {
  try {
    const jobId = req.params.id;
    const job = await jobQueue.getJob(jobId);
    
    if (!job) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (job.status !== 'uploaded') {
      return res.status(400).json({ 
        error: `Cannot process document in status: ${job.status}` 
      });
    }

    // Update job status
    await jobQueue.updateJob(jobId, {
      status: 'queued',
      queuedAt: new Date().toISOString()
    });

    // Start processing asynchronously with monitoring
    const processingStartTime = Date.now();
    monitoringManager.monitorJobProcessing(jobId, processingStartTime);
    
    pipelineOrchestrator.processDocument(jobId).catch(async (error) => {
      console.error(`Processing failed for ${jobId}:`, error);
      
      // Handle error with recovery manager
      await errorRecoveryManager.handleError(error, { jobId, stage: 'processing' });
      
      // Try to retry the job
      const retrySuccess = await errorRecoveryManager.retryJob(jobId, error);
      
      if (!retrySuccess) {
        await jobQueue.updateJob(jobId, {
          status: 'failed',
          error: error.message
        });
      }
    });

    res.json({
      success: true,
      jobId,
      status: 'queued',
      message: 'Document processing started',
      websocket: `/ws/${jobId}`,
      statusUrl: `/api/documents/${jobId}`
    });

  } catch (error) {
    console.error('Process error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get processing results
 */
app.get('/api/documents/:id/results', async (req, res) => {
  try {
    const job = await jobQueue.getJob(req.params.id);
    
    if (!job) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (job.status !== 'completed') {
      return res.status(400).json({ 
        error: `Results not ready. Current status: ${job.status}` 
      });
    }

    res.json({
      jobId: job.id,
      fileName: job.fileName,
      status: 'completed',
      results: job.results,
      processingTime: job.processingTime,
      downloadUrl: `/api/generate/${job.id}/download`
    });

  } catch (error) {
    console.error('Results error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Generate code from requirements
 */
app.post('/api/generate/code', async (req, res) => {
  try {
    const { requirements, options } = req.body;
    
    if (!requirements) {
      return res.status(400).json({ error: 'Requirements not provided' });
    }

    const jobId = uuidv4();
    
    // Create generation job
    const job = await jobQueue.createJob({
      id: jobId,
      type: 'code_generation',
      status: 'queued',
      requirements,
      options: options || {},
      createdAt: new Date().toISOString()
    });

    // Start generation asynchronously
    pipelineOrchestrator.generateCode(jobId, requirements, options).catch(error => {
      console.error(`Code generation failed for ${jobId}:`, error);
      jobQueue.updateJob(jobId, {
        status: 'failed',
        error: error.message
      });
    });

    res.json({
      success: true,
      jobId,
      status: 'queued',
      message: 'Code generation started',
      statusUrl: `/api/generate/${jobId}/status`
    });

  } catch (error) {
    console.error('Generate error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get generation status
 */
app.get('/api/generate/:id/status', async (req, res) => {
  try {
    const job = await jobQueue.getJob(req.params.id);
    
    if (!job) {
      return res.status(404).json({ error: 'Generation job not found' });
    }

    res.json({
      jobId: job.id,
      status: job.status,
      progress: job.progress || 0,
      currentStep: job.currentStep,
      filesGenerated: job.filesGenerated,
      error: job.error
    });

  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Download generated code
 */
app.get('/api/generate/:id/download', async (req, res) => {
  try {
    const job = await jobQueue.getJob(req.params.id);
    
    if (!job) {
      return res.status(404).json({ error: 'Generation job not found' });
    }

    if (job.status !== 'completed') {
      return res.status(400).json({ 
        error: `Code not ready. Current status: ${job.status}` 
      });
    }

    if (!job.outputPath) {
      return res.status(404).json({ error: 'Generated code not found' });
    }

    // Send file
    res.download(job.outputPath, `generated-code-${job.id}.zip`);

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get pending approvals
 */
app.get('/api/approvals', async (req, res) => {
  try {
    const approvals = await approvalManager.getPendingApprovals();
    res.json({
      approvals,
      count: approvals.length
    });
  } catch (error) {
    console.error('Approvals error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get specific approval
 */
app.get('/api/approvals/:id', async (req, res) => {
  try {
    const approval = await approvalManager.getApproval(req.params.id);
    
    if (!approval) {
      return res.status(404).json({ error: 'Approval not found' });
    }

    res.json(approval);
  } catch (error) {
    console.error('Approval error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Respond to approval request
 */
app.post('/api/approvals/:id/respond', async (req, res) => {
  try {
    const { decision, comment, modifications } = req.body;
    
    if (!decision) {
      return res.status(400).json({ error: 'Decision is required' });
    }

    const response = {
      decision,
      comment: comment || '',
      modifications: modifications || {},
      respondedBy: req.body.respondedBy || 'user',
      timestamp: new Date().toISOString()
    };

    const approval = await approvalManager.processApproval(req.params.id, response);
    
    res.json({
      success: true,
      approvalId: req.params.id,
      decision,
      approval
    });

  } catch (error) {
    console.error('Approval response error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * Get approval statistics
 */
app.get('/api/approvals/stats', async (req, res) => {
  try {
    const stats = await approvalManager.getApprovalStats();
    res.json(stats);
  } catch (error) {
    console.error('Approval stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get system monitoring dashboard
 */
app.get('/api/monitoring/dashboard', async (req, res) => {
  try {
    const dashboard = await monitoringManager.getDashboardData();
    res.json(dashboard);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get system alerts
 */
app.get('/api/monitoring/alerts', async (req, res) => {
  try {
    const alerts = monitoringManager.getAlerts({
      level: req.query.level,
      unacknowledged: req.query.unacknowledged === 'true',
      limit: parseInt(req.query.limit) || 50
    });
    res.json({ alerts });
  } catch (error) {
    console.error('Alerts error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Acknowledge alert
 */
app.post('/api/monitoring/alerts/:id/acknowledge', async (req, res) => {
  try {
    const alert = monitoringManager.acknowledgeAlert(req.params.id);
    if (alert) {
      res.json({ success: true, alert });
    } else {
      res.status(404).json({ error: 'Alert not found' });
    }
  } catch (error) {
    console.error('Alert acknowledge error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Trigger manual recovery
 */
app.post('/api/recovery/trigger', async (req, res) => {
  try {
    const { recoveryType, context } = req.body;
    
    if (!recoveryType) {
      return res.status(400).json({ error: 'Recovery type is required' });
    }
    
    const result = await errorRecoveryManager.triggerRecovery(recoveryType, context || {});
    res.json({ success: true, result });
  } catch (error) {
    console.error('Recovery trigger error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get recovery statistics
 */
app.get('/api/recovery/stats', async (req, res) => {
  try {
    const stats = errorRecoveryManager.getRecoveryStats();
    res.json(stats);
  } catch (error) {
    console.error('Recovery stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Perform system health recovery
 */
app.post('/api/recovery/system-health', async (req, res) => {
  try {
    const result = await errorRecoveryManager.performSystemHealthRecovery();
    res.json(result);
  } catch (error) {
    console.error('System health recovery error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * WebSocket endpoint for real-time updates
 */
app.get('/ws/:jobId', (req, res) => {
  res.json({
    message: 'WebSocket endpoint',
    url: `ws://localhost:${PORT}/ws/${req.params.jobId}`,
    events: [
      'processing:started',
      'parsing:progress',
      'analysis:progress',
      'extraction:progress',
      'architecture:progress',
      'generation:progress',
      'processing:completed',
      'processing:failed',
      'approval:requested',
      'approval:responded',
      'approval:timeout'
    ]
  });
});

/**
 * Error handling middleware
 */
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: error.message || 'Internal server error',
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
});

/**
 * Start server
 */
const server = app.listen(PORT, () => {
  console.log(`🚀 Document Generator API Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`📤 Upload endpoint: http://localhost:${PORT}/api/documents/upload`);
});

// Initialize WebSocket server
wsManager.initialize(server);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🔄 Shutting down server...');
  
  server.close(() => {
    console.log('✅ Server closed');
  });
  
  await jobQueue.close();
  wsManager.close();
  
  process.exit(0);
});

module.exports = app;