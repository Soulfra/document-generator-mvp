const express = require('express');
const { translationMiddleware } = require('./internal-external-translation-bridge');

const app = express();

// Add body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add translation middleware to convert internal formats to external
app.use(translationMiddleware());

// CORS headers for Cloudflare
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// Main endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Document Generator MVP',
    version: '1.0.0',
    status: 'operational',
    message: 'Welcome to Document Generator - Transform documents into MVPs',
    endpoints: {
      health: '/health',
      status: '/api/status',
      demo: '/api/demo'
    },
    deployment: {
      platform: process.env.VERCEL ? 'Vercel' : process.env.CF_PAGES ? 'Cloudflare' : 'Unknown',
      region: process.env.VERCEL_REGION || process.env.CF_REGION || 'Unknown'
    }
  });
});

// Status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'operational',
    platform: 'Document Generator MVP',
    version: '1.0.0',
    features: {
      documentProcessing: 'limited',
      aiIntegration: 'api-only',
      templateGeneration: 'basic'
    },
    limitations: [
      'No local AI models (Ollama) in serverless',
      'No database connections in serverless',
      'Limited file storage',
      'Request timeout limits'
    ],
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// Demo endpoint
app.get('/api/demo', (req, res) => {
  res.json({
    message: 'This is a demo endpoint for serverless deployment',
    capabilities: [
      'Process simple documents',
      'Generate basic templates',
      'API-based AI integration'
    ],
    note: 'For full features, please run locally with Docker'
  });
});

// Process document endpoint (simplified for serverless)
app.post('/api/process', async (req, res) => {
  const { document, type } = req.body;
  
  if (!document) {
    return res.status(400).json({ error: 'Document content required' });
  }
  
  try {
    // Simplified processing for serverless
    const result = {
      processed: true,
      type: type || 'text',
      wordCount: document.split(/\s+/).length,
      preview: document.substring(0, 200) + '...',
      mvpSuggestions: [
        'Create a landing page',
        'Build a simple API',
        'Design a prototype'
      ],
      note: 'This is a simplified demo. Full processing requires local deployment.'
    };
    
    res.json(result);
  } catch (error) {
    console.error('Processing error:', error);
    res.status(500).json({ 
      error: 'Processing failed',
      message: error.message 
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Endpoint ${req.path} not found`,
    availableEndpoints: ['/', '/health', '/api/status', '/api/demo', '/api/process']
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// For Vercel
module.exports = app;

// For local testing
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Serverless app listening on port ${port}`);
  });
}