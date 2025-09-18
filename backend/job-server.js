/**
 * 🚀🔥💼 Job Application Server
 * Real backend with actual API integrations for OpenAI, Anthropic, DeepSeek, and Local LLMs
 * NO MORE MOCK DATA - THIS ACTUALLY WORKS
 */

const express = require('express');
const cors = require('cors');
const puppeteer = require('puppeteer');
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');
const { createServer } = require('http');
const WebSocket = require('ws');

// Load environment variables
require('dotenv').config();

const app = express();
const server = createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('.'));

// Store active processing sessions
const activeSessions = new Map();

// AI API Clients Configuration
const AI_CLIENTS = {
    openai: {
        enabled: !!process.env.OPENAI_API_KEY,
        baseURL: 'https://api.openai.com/v1',
        models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
        headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
        }
    },
    anthropic: {
        enabled: !!process.env.ANTHROPIC_API_KEY,
        baseURL: 'https://api.anthropic.com/v1',
        models: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
        headers: {
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
        }
    },
    deepseek: {
        enabled: !!process.env.DEEPSEEK_API_KEY,
        baseURL: 'https://api.deepseek.com/v1',
        models: ['deepseek-chat', 'deepseek-coder'],
        headers: {
            'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
            'Content-Type': 'application/json'
        }
    },
    ollama: {
        enabled: true, // Always try local first
        baseURL: process.env.OLLAMA_URL || 'http://localhost:11434',
        models: [
            'codellama:7b',
            'mistral:7b', 
            'llama2:7b',
            'phi3:3.8b',
            'wizardcoder:7b',
            'deepseek-coder:6.7b',
            'starcoder:7b',
            'neural-chat:7b',
            'orca-mini:7b',
            'vicuna:7b'
        ]
    }
};

console.log('🤖 AI Services Status:');
Object.entries(AI_CLIENTS).forEach(([service, config]) => {
    console.log(`  ${service.toUpperCase()}: ${config.enabled ? '✅ ENABLED' : '❌ DISABLED'}`);
    if (config.enabled && config.models) {
        console.log(`    Models: ${config.models.slice(0, 3).join(', ')}${config.models.length > 3 ? '...' : ''}`);
    }
});

/**
 * WebSocket connection handler
 */
wss.on('connection', (ws) => {
    console.log('🔌 Client connected via WebSocket');
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('📨 WebSocket message:', data);
        } catch (error) {
            console.error('❌ Invalid WebSocket message:', error);
        }
    });
    
    ws.on('close', () => {
        console.log('🔌 Client disconnected');
    });
});

/**
 * Broadcast progress update to all connected clients
 */
function broadcastProgress(sessionId, status, message, progress) {
    const update = {
        type: 'progress',
        sessionId,
        status,
        message,
        progress,
        timestamp: new Date().toISOString()
    };
    
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(update));
        }
    });
    
    console.log(`📊 [${sessionId}] ${progress}% - ${message}`);
}

/**
 * Real job URL scraping with Puppeteer
 */
async function scrapeJobURL(url) {
    console.log(`🕷️ Scraping job URL: ${url}`);
    
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor'
            ]
        });
        
        const page = await browser.newPage();
        
        // Set realistic headers
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        
        // Navigate to job page
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
        
        // Wait for content to load
        await page.waitForTimeout(2000);
        
        // Extract job data based on site
        const jobData = await page.evaluate((url) => {
            const hostname = new URL(url).hostname;
            
            // Workable scraping
            if (hostname.includes('workable.com')) {
                return {
                    platform: 'Workable',
                    jobTitle: document.querySelector('[data-ui="job-title"], .job-title, h1')?.textContent?.trim() || 'Title not found',
                    company: document.querySelector('[data-ui="company-name"], .company-name, .company')?.textContent?.trim() || 'Company not found',
                    location: document.querySelector('[data-ui="job-location"], .job-location, .location')?.textContent?.trim() || 'Location not found',
                    description: document.querySelector('[data-ui="job-description"], .job-description, .description')?.textContent?.trim() || 'Description not found',
                    requirements: Array.from(document.querySelectorAll('li')).map(li => li.textContent.trim()).filter(text => text.length > 20).slice(0, 10),
                    salary: document.querySelector('[data-ui="salary"], .salary')?.textContent?.trim() || 'Not specified'
                };
            }
            
            // LinkedIn scraping
            if (hostname.includes('linkedin.com')) {
                return {
                    platform: 'LinkedIn',
                    jobTitle: document.querySelector('.top-card-layout__title, .job-title, h1')?.textContent?.trim() || 'Title not found',
                    company: document.querySelector('.topcard__org-name-link, .company-name')?.textContent?.trim() || 'Company not found',
                    location: document.querySelector('.topcard__flavor--bullet, .job-location')?.textContent?.trim() || 'Location not found',
                    description: document.querySelector('.show-more-less-html__markup, .description')?.textContent?.trim() || 'Description not found',
                    requirements: Array.from(document.querySelectorAll('li')).map(li => li.textContent.trim()).filter(text => text.length > 20).slice(0, 10)
                };
            }
            
            // Indeed scraping
            if (hostname.includes('indeed.com')) {
                return {
                    platform: 'Indeed',
                    jobTitle: document.querySelector('[data-testid="jobsearch-JobInfoHeader-title"], h1')?.textContent?.trim() || 'Title not found',
                    company: document.querySelector('[data-testid="inlineHeader-companyName"], .company')?.textContent?.trim() || 'Company not found',
                    location: document.querySelector('[data-testid="job-location"], .location')?.textContent?.trim() || 'Location not found',
                    description: document.querySelector('#jobDescriptionText, .jobsearch-jobDescriptionText')?.textContent?.trim() || 'Description not found',
                    requirements: Array.from(document.querySelectorAll('li')).map(li => li.textContent.trim()).filter(text => text.length > 20).slice(0, 10)
                };
            }
            
            // Generic fallback
            return {
                platform: 'Generic',
                jobTitle: document.querySelector('h1, .title, [class*="title"]')?.textContent?.trim() || 'Title not found',
                company: document.querySelector('[class*="company"], [class*="organization"]')?.textContent?.trim() || 'Company not found',
                location: document.querySelector('[class*="location"], [class*="address"]')?.textContent?.trim() || 'Location not found',
                description: document.querySelector('[class*="description"], [class*="content"], p')?.textContent?.trim() || 'Description not found',
                requirements: Array.from(document.querySelectorAll('li')).map(li => li.textContent.trim()).filter(text => text.length > 20).slice(0, 10)
            };
        }, url);
        
        // Add metadata
        jobData.url = url;
        jobData.scrapedAt = new Date().toISOString();
        jobData.isRealData = true;
        
        console.log(`✅ Successfully scraped job: ${jobData.jobTitle} at ${jobData.company}`);
        return jobData;
        
    } catch (error) {
        console.error('❌ Error scraping job URL:', error);
        
        // Return fallback data with error info
        return {
            url,
            platform: 'Unknown',
            jobTitle: 'Job Title (Scraping Failed)',
            company: 'Company Name (Scraping Failed)',
            location: 'Location (Scraping Failed)',
            description: 'Job description could not be scraped automatically.',
            requirements: ['Manual input required due to scraping failure'],
            scrapingError: error.message,
            isRealData: false,
            scrapedAt: new Date().toISOString()
        };
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

/**
 * Call AI API with intelligent routing
 */
async function callAI(prompt, options = {}) {
    const { 
        preferredService = 'ollama',
        model = null,
        maxTokens = 1000,
        temperature = 0.7,
        useLocal = true
    } = options;
    
    console.log(`🤖 Calling AI: ${preferredService} (local: ${useLocal})`);
    
    // Try local Ollama first if enabled
    if (useLocal && AI_CLIENTS.ollama.enabled) {
        try {
            const result = await callOllama(prompt, model || 'mistral:7b', { maxTokens, temperature });
            if (result && result.length > 50) { // Quality check
                console.log('✅ Ollama response successful');
                return result;
            }
        } catch (error) {
            console.warn('⚠️ Ollama failed, trying cloud APIs:', error.message);
        }
    }
    
    // Try cloud APIs as fallback
    const cloudServices = ['anthropic', 'openai', 'deepseek'].filter(service => 
        AI_CLIENTS[service].enabled
    );
    
    for (const service of cloudServices) {
        try {
            console.log(`🌐 Trying ${service}...`);
            
            if (service === 'anthropic') {
                return await callAnthropic(prompt, model || 'claude-3-sonnet-20240229', { maxTokens, temperature });
            } else if (service === 'openai') {
                return await callOpenAI(prompt, model || 'gpt-4', { maxTokens, temperature });
            } else if (service === 'deepseek') {
                return await callDeepSeek(prompt, model || 'deepseek-chat', { maxTokens, temperature });
            }
        } catch (error) {
            console.warn(`⚠️ ${service} failed:`, error.message);
            continue;
        }
    }
    
    throw new Error('All AI services failed or are disabled');
}

/**
 * Call Ollama local API
 */
async function callOllama(prompt, model = 'mistral:7b', options = {}) {
    const response = await axios.post(`${AI_CLIENTS.ollama.baseURL}/api/generate`, {
        model,
        prompt,
        stream: false,
        options: {
            num_predict: options.maxTokens || 1000,
            temperature: options.temperature || 0.7
        }
    }, {
        timeout: 60000
    });
    
    return response.data.response;
}

/**
 * Call Anthropic Claude API
 */
async function callAnthropic(prompt, model = 'claude-3-sonnet-20240229', options = {}) {
    const response = await axios.post(`${AI_CLIENTS.anthropic.baseURL}/messages`, {
        model,
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7,
        messages: [
            {
                role: 'user',
                content: prompt
            }
        ]
    }, {
        headers: AI_CLIENTS.anthropic.headers,
        timeout: 60000
    });
    
    return response.data.content[0].text;
}

/**
 * Call OpenAI GPT API
 */
async function callOpenAI(prompt, model = 'gpt-4', options = {}) {
    const response = await axios.post(`${AI_CLIENTS.openai.baseURL}/chat/completions`, {
        model,
        messages: [
            {
                role: 'user',
                content: prompt
            }
        ],
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7
    }, {
        headers: AI_CLIENTS.openai.headers,
        timeout: 60000
    });
    
    return response.data.choices[0].message.content;
}

/**
 * Call DeepSeek API
 */
async function callDeepSeek(prompt, model = 'deepseek-chat', options = {}) {
    const response = await axios.post(`${AI_CLIENTS.deepseek.baseURL}/chat/completions`, {
        model,
        messages: [
            {
                role: 'user',
                content: prompt
            }
        ],
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7
    }, {
        headers: AI_CLIENTS.deepseek.headers,
        timeout: 60000
    });
    
    return response.data.choices[0].message.content;
}

/**
 * Generate resume content using AI
 */
async function generateResume(jobData, userProfile) {
    const prompt = `
Generate a professional resume tailored for this job:

Job Title: ${jobData.jobTitle}
Company: ${jobData.company}
Requirements: ${jobData.requirements?.join(', ') || 'Not specified'}

User Profile:
- Name: ${userProfile.name || 'John Doe'}
- Experience: ${userProfile.experience || '5 years in software development'}
- Skills: ${userProfile.skills?.join(', ') || 'JavaScript, Python, React'}

Create a professional resume with these sections:
1. Contact Information
2. Professional Summary (2-3 sentences)
3. Technical Skills (organized by category)
4. Work Experience (2-3 relevant positions)
5. Education
6. Relevant Projects

Format as structured JSON with each section clearly defined. Focus on relevance to the job requirements.
    `.trim();
    
    console.log('📄 Generating resume with AI...');
    const response = await callAI(prompt, { preferredService: 'anthropic', maxTokens: 2000 });
    
    try {
        // Try to parse as JSON first
        return JSON.parse(response);
    } catch {
        // Return structured response if JSON parsing fails
        return {
            content: response,
            sections: ['contact', 'summary', 'skills', 'experience', 'education', 'projects'],
            generatedAt: new Date().toISOString()
        };
    }
}

/**
 * Generate cover letter using AI
 */
async function generateCoverLetter(jobData, userProfile) {
    const prompt = `
Write a professional cover letter for this job application:

Job Title: ${jobData.jobTitle}
Company: ${jobData.company}
Job Description: ${jobData.description?.substring(0, 500) || 'Not available'}

User Background:
- Name: ${userProfile.name || 'John Doe'}
- Experience: ${userProfile.experience || '5 years in software development'}
- Key Skills: ${userProfile.skills?.join(', ') || 'JavaScript, Python, React'}

Requirements:
1. Professional tone appropriate for the company
2. Address specific job requirements mentioned
3. Highlight relevant experience and skills
4. Show enthusiasm for the role and company
5. Include a clear call to action
6. Keep to 3-4 paragraphs, under 400 words

Format as a complete cover letter ready to send.
    `.trim();
    
    console.log('📝 Generating cover letter with AI...');
    const response = await callAI(prompt, { preferredService: 'claude', maxTokens: 1500 });
    
    return {
        content: response,
        wordCount: response.split(' ').length,
        generatedAt: new Date().toISOString()
    };
}

/**
 * Research company using AI
 */
async function researchCompany(companyName, jobData) {
    const prompt = `
Research this company and provide insights for a job application:

Company Name: ${companyName}
Job Context: ${jobData.jobTitle} position
Available Info: ${jobData.description?.substring(0, 300) || 'Limited information available'}

Provide:
1. Company overview and industry
2. Key values and culture
3. Recent news or developments
4. Why someone would want to work there
5. Application tips specific to this company

Format as structured information that can help tailor a job application.
    `.trim();
    
    console.log('🏢 Researching company with AI...');
    const response = await callAI(prompt, { preferredService: 'openai', maxTokens: 1000 });
    
    return {
        research: response,
        researchedAt: new Date().toISOString(),
        source: 'AI Analysis'
    };
}

// API Routes

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
    const status = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
            openai: AI_CLIENTS.openai.enabled,
            anthropic: AI_CLIENTS.anthropic.enabled,
            deepseek: AI_CLIENTS.deepseek.enabled,
            ollama: AI_CLIENTS.ollama.enabled
        },
        activeSessions: activeSessions.size
    };
    
    res.json(status);
});

/**
 * Process job application endpoint
 */
app.post('/api/process-job', async (req, res) => {
    const { jobURL, userProfile = {} } = req.body;
    
    if (!jobURL) {
        return res.status(400).json({ error: 'Job URL is required' });
    }
    
    const sessionId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    activeSessions.set(sessionId, { startedAt: new Date(), status: 'processing' });
    
    try {
        console.log(`🎯 Processing job application: ${sessionId}`);
        
        // Step 1: Scrape job URL
        broadcastProgress(sessionId, 'scraping', 'Scraping job posting...', 20);
        const jobData = await scrapeJobURL(jobURL);
        
        // Step 2: Research company
        broadcastProgress(sessionId, 'researching', 'Researching company...', 40);
        const companyResearch = await researchCompany(jobData.company, jobData);
        
        // Step 3: Generate resume
        broadcastProgress(sessionId, 'generating-resume', 'Generating tailored resume...', 60);
        const resume = await generateResume(jobData, userProfile);
        
        // Step 4: Generate cover letter
        broadcastProgress(sessionId, 'generating-cover', 'Writing cover letter...', 80);
        const coverLetter = await generateCoverLetter(jobData, userProfile);
        
        // Step 5: Finalize package
        broadcastProgress(sessionId, 'finalizing', 'Finalizing application package...', 95);
        
        const applicationPackage = {
            sessionId,
            jobData: {
                ...jobData,
                companyResearch
            },
            documents: {
                resume,
                coverLetter
            },
            userProfile,
            generatedAt: new Date().toISOString(),
            processingTime: Date.now() - activeSessions.get(sessionId).startedAt.getTime()
        };
        
        activeSessions.set(sessionId, { ...activeSessions.get(sessionId), status: 'completed', result: applicationPackage });
        broadcastProgress(sessionId, 'completed', 'Application package ready!', 100);
        
        res.json(applicationPackage);
        
    } catch (error) {
        console.error(`❌ Error processing job ${sessionId}:`, error);
        
        activeSessions.set(sessionId, { ...activeSessions.get(sessionId), status: 'error', error: error.message });
        broadcastProgress(sessionId, 'error', `Error: ${error.message}`, 0);
        
        res.status(500).json({
            error: 'Failed to process job application',
            message: error.message,
            sessionId
        });
    }
});

/**
 * Get session status
 */
app.get('/api/session/:sessionId', (req, res) => {
    const session = activeSessions.get(req.params.sessionId);
    
    if (!session) {
        return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json(session);
});

/**
 * Test AI services
 */
app.post('/api/test-ai', async (req, res) => {
    const { service, prompt = 'Hello, world!' } = req.body;
    
    try {
        const response = await callAI(prompt, { preferredService: service });
        res.json({
            success: true,
            service,
            response: response.substring(0, 200) + (response.length > 200 ? '...' : ''),
            fullLength: response.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            service,
            error: error.message
        });
    }
});

/**
 * Get available AI models
 */
app.get('/api/models', async (req, res) => {
    const models = {};
    
    // Get Ollama models
    if (AI_CLIENTS.ollama.enabled) {
        try {
            const response = await axios.get(`${AI_CLIENTS.ollama.baseURL}/api/tags`);
            models.ollama = response.data.models?.map(m => m.name) || [];
        } catch (error) {
            models.ollama = AI_CLIENTS.ollama.models;
        }
    }
    
    // Add cloud models
    Object.entries(AI_CLIENTS).forEach(([service, config]) => {
        if (service !== 'ollama' && config.enabled && config.models) {
            models[service] = config.models;
        }
    });
    
    res.json(models);
});

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'job-application-dashboard.html'));
});

// Start server
const PORT = process.env.PORT || 3333;
server.listen(PORT, () => {
    console.log(`🚀 Job Application Server running on http://localhost:${PORT}`);
    console.log(`📡 WebSocket server ready for real-time updates`);
    console.log(`🤖 AI Services configured and ready`);
    console.log(`\n🎯 Ready to process job applications!`);
    console.log(`   Open: http://localhost:${PORT}`);
    console.log(`   API:  http://localhost:${PORT}/api/health`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    server.close(() => {
        console.log('✅ Server shut down gracefully');
        process.exit(0);
    });
});

module.exports = { app, server, callAI, scrapeJobURL };