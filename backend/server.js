
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const { createServer } = require('http');
const WebSocket = require('ws');

// Initialize Express app
const app = express();
const server = createServer(app);
const wss = new WebSocket.Server({ server });

// Configuration
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'production';

// Logger setup
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.simple()
        })
    ]
});

// Security and performance middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));
app.use(compression());

// CORS configuration for GitHub Pages
app.use(cors({
    origin: [
        'https://soulfra.github.io',
        'http://localhost:3000',
        'http://localhost:8080',
        'https://localhost:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-User-ID']
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP'
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        services: {
            api: 'online',
            websocket: wss.clients.size > 0 ? 'active' : 'ready',
            puppeteer: 'available'
        }
    });
});

// Status endpoint for service discovery
app.get('/status', (req, res) => {
    res.json({
        success: true,
        server: 'Document Generator Backend',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        connections: wss.clients.size
    });
});

// Job processing endpoints
app.post('/api/jobs/process', async (req, res) => {
    try {
        logger.info('Processing job application request', { 
            jobURL: req.body.jobURL,
            userProfile: req.body.userProfile?.name
        });

        // Import job processor (will be copied from main project)
        const { processJobApplication } = require('./job-processor');
        
        const result = await processJobApplication(req.body);
        
        res.json({
            success: true,
            data: result,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        logger.error('Job processing error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

app.post('/api/jobs/test-scrape', async (req, res) => {
    try {
        const { jobURL } = req.body;
        logger.info('Testing job scraping for URL:', jobURL);

        // Import scraper (will be copied from main project)
        const { testJobScraping } = require('./job-scraper');
        
        const result = await testJobScraping(jobURL);
        
        res.json({
            success: true,
            data: result,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        logger.error('Scraping test error:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

app.get('/api/jobs/supported-sites', (req, res) => {
    res.json({
        success: true,
        data: {
            sites: [
                { name: 'Workable', supported: true, example: 'company.workable.com' },
                { name: 'LinkedIn', supported: true, example: 'linkedin.com/jobs' },
                { name: 'Indeed', supported: true, example: 'indeed.com/viewjob' },
                { name: 'AngelList', supported: false, example: 'angel.co/jobs' },
                { name: 'Glassdoor', supported: false, example: 'glassdoor.com/job' },
                { name: 'Other Sites', supported: false, example: 'Various job boards' }
            ]
        }
    });
});

// WebSocket handling for real-time updates
wss.on('connection', (ws, req) => {
    logger.info('New WebSocket connection established');
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            logger.info('WebSocket message received:', data.type);
            
            // Handle different message types
            switch (data.type) {
                case 'client_connect':
                    ws.send(JSON.stringify({
                        type: 'welcome',
                        server: 'Document Generator Backend',
                        timestamp: new Date().toISOString()
                    }));
                    break;
                    
                case 'job-subscribe':
                    // Subscribe to job updates
                    ws.jobSession = data.sessionId;
                    break;
                    
                default:
                    logger.warn('Unknown WebSocket message type:', data.type);
            }
        } catch (error) {
            logger.error('WebSocket message error:', error);
        }
    });
    
    ws.on('close', () => {
        logger.info('WebSocket connection closed');
    });
    
    ws.on('error', (error) => {
        logger.error('WebSocket error:', error);
    });
});

// Broadcast progress updates to WebSocket clients
function broadcastJobProgress(sessionId, progress, message) {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN && client.jobSession === sessionId) {
            client.send(JSON.stringify({
                type: 'job-progress',
                sessionId,
                progress,
                message,
                timestamp: new Date().toISOString()
            }));
        }
    });
}

// Export broadcast function for use by job processor
global.broadcastJobProgress = broadcastJobProgress;

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        available: [
            'GET /health',
            'GET /status', 
            'POST /api/jobs/process',
            'POST /api/jobs/test-scrape',
            'GET /api/jobs/supported-sites'
        ]
    });
});

// Error handler
app.use((error, req, res, next) => {
    logger.error('Unhandled error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
    });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
    logger.info(`Document Generator Backend listening on port ${PORT}`);
    logger.info(`Environment: ${NODE_ENV}`);
    logger.info(`WebSocket server ready for connections`);
    logger.info(`Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
        logger.info('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    server.close(() => {
        logger.info('Server closed');
        process.exit(0);
    });
});
