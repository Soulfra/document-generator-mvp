#!/usr/bin/env node

/**
 * Railway Backend Setup Script
 * 
 * This script prepares and deploys your Document Generator backend to Railway,
 * solving the "how can you fetch these" connection problem.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up Railway Backend for Document Generator...');

// 1. Create backend directory structure
const backendDir = path.join(__dirname, 'backend');
if (!fs.existsSync(backendDir)) {
    fs.mkdirSync(backendDir);
    console.log('✅ Created backend directory');
}

// 2. Create Railway-optimized package.json
const backendPackage = {
    name: "document-generator-backend",
    version: "1.0.0",
    description: "Backend API for Document Generator MVP",
    main: "server.js",
    scripts: {
        start: "node server.js",
        dev: "nodemon server.js",
        build: "echo 'No build step required'",
        postinstall: "echo 'Backend ready for Railway'"
    },
    dependencies: {
        express: "^4.21.2",
        cors: "^2.8.5",
        helmet: "^7.0.0",
        compression: "^1.7.4",
        "express-rate-limit": "^7.1.5",
        dotenv: "^16.3.1",
        axios: "^1.6.0",
        cheerio: "^1.0.0-rc.12",
        puppeteer: "^21.6.1",
        "puppeteer-extra": "^3.3.6",
        "puppeteer-extra-plugin-stealth": "^2.11.2",
        "puppeteer-extra-plugin-adblocker": "^2.13.6",
        ws: "^8.14.2",
        multer: "^1.4.5-lts.1",
        winston: "^3.11.0",
        "node-cron": "^3.0.3",
        pg: "^8.16.3",
        redis: "^4.6.12",
        ollama: "^0.4.9"
    },
    engines: {
        node: ">=18.0.0"
    },
    repository: {
        type: "git",
        url: "https://github.com/Soulfra/document-generator-mvp.git"
    }
};

fs.writeFileSync(
    path.join(backendDir, 'package.json'), 
    JSON.stringify(backendPackage, null, 2)
);
console.log('✅ Created Railway-optimized package.json');

// 3. Create main server file
const serverCode = `
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
    logger.info(\`Document Generator Backend listening on port \${PORT}\`);
    logger.info(\`Environment: \${NODE_ENV}\`);
    logger.info(\`WebSocket server ready for connections\`);
    logger.info(\`Health check: http://localhost:\${PORT}/health\`);
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
`;

fs.writeFileSync(path.join(backendDir, 'server.js'), serverCode);
console.log('✅ Created main server.js file');

// 4. Copy essential files from main project
const filesToCopy = [
    'job-server.js',
    'ENHANCED-JOB-PROCESSOR.js'
];

filesToCopy.forEach(file => {
    const source = path.join(__dirname, file);
    const dest = path.join(backendDir, file);
    
    if (fs.existsSync(source)) {
        fs.copyFileSync(source, dest);
        console.log(`✅ Copied ${file}`);
    } else {
        console.log(`⚠️  ${file} not found, will need to be created`);
    }
});

// 5. Create job processor module for Railway
const jobProcessorCode = `
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');

// Configure Puppeteer with stealth mode
puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

async function processJobApplication(jobData) {
    const sessionId = 'session_' + Date.now();
    
    try {
        // Broadcast progress if available
        if (global.broadcastJobProgress) {
            global.broadcastJobProgress(sessionId, 10, 'Starting job processing...');
        }
        
        // Step 1: Scrape job posting
        let jobInfo = {};
        if (jobData.jobURL) {
            jobInfo = await scrapeJobPosting(jobData.jobURL);
            if (global.broadcastJobProgress) {
                global.broadcastJobProgress(sessionId, 30, 'Job posting scraped successfully');
            }
        } else {
            jobInfo = {
                jobTitle: 'Position from Manual Description',
                company: 'Unknown Company',
                description: jobData.manualDescription,
                requirements: []
            };
        }
        
        // Step 2: Generate resume
        if (global.broadcastJobProgress) {
            global.broadcastJobProgress(sessionId, 50, 'Generating tailored resume...');
        }
        
        const resume = await generateResume(jobData.userProfile, jobInfo);
        
        // Step 3: Generate cover letter
        if (global.broadcastJobProgress) {
            global.broadcastJobProgress(sessionId, 70, 'Writing cover letter...');
        }
        
        const coverLetter = await generateCoverLetter(jobData.userProfile, jobInfo);
        
        // Step 4: Finalize
        if (global.broadcastJobProgress) {
            global.broadcastJobProgress(sessionId, 100, 'Application package ready!');
        }
        
        return {
            sessionId,
            jobData: jobInfo,
            documents: {
                resume,
                coverLetter
            },
            generatedAt: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('Job processing error:', error);
        if (global.broadcastJobProgress) {
            global.broadcastJobProgress(sessionId, 0, 'Error: ' + error.message);
        }
        throw error;
    }
}

async function scrapeJobPosting(jobURL) {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-features=VizDisplayCompositor'
        ]
    });
    
    try {
        const page = await browser.newPage();
        
        // Set realistic headers
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        await page.setViewport({ width: 1366, height: 768 });
        
        await page.goto(jobURL, { waitUntil: 'networkidle0', timeout: 30000 });
        
        // Extract job information
        const jobInfo = await page.evaluate(() => {
            // Generic selectors that work on most job sites
            const titleSelectors = ['h1', '.job-title', '[data-testid="job-title"]', '.jobtitle'];
            const companySelectors = ['.company', '.company-name', '[data-testid="company-name"]'];
            const descSelectors = ['.job-description', '.description', '.job-details'];
            
            function findBySelectors(selectors) {
                for (const selector of selectors) {
                    const element = document.querySelector(selector);
                    if (element) return element.textContent.trim();
                }
                return '';
            }
            
            return {
                jobTitle: findBySelectors(titleSelectors) || 'Unknown Position',
                company: findBySelectors(companySelectors) || 'Unknown Company',
                description: findBySelectors(descSelectors) || 'No description found',
                location: document.querySelector('.location, .job-location')?.textContent.trim() || 'Unknown Location',
                platform: window.location.hostname
            };
        });
        
        return jobInfo;
        
    } finally {
        await browser.close();
    }
}

async function generateResume(userProfile, jobInfo) {
    // Simple template-based resume generation
    // In production, this would use AI services
    
    const resume = {
        header: {
            name: userProfile.name,
            email: userProfile.email
        },
        summary: \`Experienced professional with expertise in \${userProfile.skills?.slice(0, 3).join(', ') || 'various technologies'}. Seeking opportunities in \${jobInfo.jobTitle} role.\`,
        experience: userProfile.experience,
        skills: userProfile.skills?.join(', ') || '',
        education: userProfile.education,
        content: \`
\${userProfile.name}
\${userProfile.email}

PROFESSIONAL SUMMARY
Experienced professional with expertise in \${userProfile.skills?.slice(0, 3).join(', ') || 'various technologies'}. Seeking opportunities in \${jobInfo.jobTitle} role at \${jobInfo.company}.

EXPERIENCE
\${userProfile.experience}

SKILLS
\${userProfile.skills?.join(', ') || ''}

EDUCATION
\${userProfile.education || ''}
        \`.trim()
    };
    
    return resume;
}

async function generateCoverLetter(userProfile, jobInfo) {
    const coverLetter = {
        content: \`
Dear Hiring Manager,

I am writing to express my strong interest in the \${jobInfo.jobTitle} position at \${jobInfo.company}. With my background in \${userProfile.skills?.slice(0, 2).join(' and ') || 'technology'}, I am confident I would be a valuable addition to your team.

\${userProfile.experience}

I am particularly excited about this opportunity because \${jobInfo.company} has a strong reputation in the industry. My skills in \${userProfile.skills?.slice(0, 3).join(', ') || 'various technologies'} align well with your requirements.

I would welcome the opportunity to discuss how my experience can contribute to your team's success.

Best regards,
\${userProfile.name}
        \`.trim()
    };
    
    return coverLetter;
}

async function testJobScraping(jobURL) {
    try {
        const jobInfo = await scrapeJobPosting(jobURL);
        return {
            ...jobInfo,
            tested: true,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        throw new Error(\`Scraping failed: \${error.message}\`);
    }
}

module.exports = {
    processJobApplication,
    testJobScraping,
    scrapeJobPosting
};
`;

fs.writeFileSync(path.join(backendDir, 'job-processor.js'), jobProcessorCode);
console.log('✅ Created job-processor.js');

// 6. Create Railway deployment files
const nixpacks = {
    build: {
        env: {
            NODE_ENV: "production"
        }
    },
    start: {
        cmd: "node server.js"
    }
};

fs.writeFileSync(path.join(backendDir, 'nixpacks.toml'), 
    Object.entries(nixpacks).map(([key, value]) => 
        `[${key}]\n` + Object.entries(value).map(([k, v]) => 
            typeof v === 'string' ? `${k} = "${v}"` : `${k} = ${JSON.stringify(v)}`
        ).join('\n')
    ).join('\n\n')
);
console.log('✅ Created nixpacks.toml for Railway');

// 7. Create Dockerfile for alternative deployment
const dockerfile = `
FROM node:18-slim

# Install latest chrome dev package and fonts to support major charsets (Chinese, Japanese, Arabic, Hebrew, Thai and a few others)
RUN apt-get update \\
    && apt-get install -y wget gnupg \\
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \\
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \\
    && apt-get update \\
    && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \\
      --no-install-recommends \\
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

# Add user so we don't need --no-sandbox.
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \\
    && mkdir -p /home/pptruser/Downloads \\
    && chown -R pptruser:pptruser /home/pptruser \\
    && chown -R pptruser:pptruser /app

USER pptruser

CMD ["node", "server.js"]
`;

fs.writeFileSync(path.join(backendDir, 'Dockerfile'), dockerfile);
console.log('✅ Created Dockerfile');

// 8. Create deployment script
const deployScript = `#!/bin/bash
# Railway Deployment Script

echo "🚀 Deploying Document Generator Backend to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Install with: npm install -g @railway/cli"
    exit 1
fi

# Navigate to backend directory
cd backend

# Initialize Railway project if needed
if [ ! -f "railway.json" ]; then
    echo "📋 Initializing Railway project..."
    railway init document-generator-backend
fi

# Deploy to Railway
echo "🚀 Deploying to Railway..."
railway up

echo "✅ Deployment complete!"
echo "🌐 Your backend will be available at: https://document-generator-backend.up.railway.app"
echo "🔗 Update your frontend to use this URL for API calls"
`;

fs.writeFileSync(path.join(__dirname, 'deploy-to-railway.sh'), deployScript);
fs.chmodSync(path.join(__dirname, 'deploy-to-railway.sh'), '755');
console.log('✅ Created deployment script');

// Summary
console.log('\n🎉 Railway Backend Setup Complete!');
console.log('\n📋 Next Steps:');
console.log('1. Install Railway CLI: npm install -g @railway/cli');
console.log('2. Login to Railway: railway login');
console.log('3. Deploy backend: ./deploy-to-railway.sh');
console.log('4. Update frontend config with Railway URL');
console.log('\n🔗 This solves the "how can you fetch these" problem by providing');
console.log('   a clear API endpoint for your GitHub Pages frontend to connect to!');