#!/usr/bin/env node

/**
 * 🚀 MARKETPLACE INTEGRATION SERVICE
 * 
 * Bridges the user-friendly marketplace interface with the existing AI services
 * Handles agent hiring, job management, and real-time monitoring
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 8080; // Main marketplace port

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname)); // Serve static files

// Service connections
const services = {
  aiAPI: 'http://localhost:3001',
  templateProcessor: 'http://localhost:3000',
  authService: 'http://localhost:8888',
  systemBus: 'http://localhost:8899'
};

// Agent registry mapping marketplace agents to actual services
const agentRegistry = {
  'alice-validator': {
    name: 'Alice Validator',
    avatar: '🤖',
    specialty: 'Code Quality Specialist',
    service: 'aiAPI',
    endpoint: '/api/analyze',
    capabilities: ['Code Review', 'Bug Detection', 'Performance Analysis', 'Documentation', 'Security Audit', 'Refactoring'],
    pricing: { hourly: 25, project: 200, monthly: 1500 }
  },
  'bob-generator': {
    name: 'Bob Generator', 
    avatar: '🎮',
    specialty: 'Game Content Creator',
    service: 'templateProcessor',
    endpoint: '/upload',
    capabilities: ['Level Design', 'Quest Creation', 'Asset Generation', 'Audio Design', 'NPC Behavior', 'Combat Systems'],
    pricing: { hourly: 35, project: 300, monthly: 2000 }
  },
  'gamemaster-pro': {
    name: 'GameMaster Pro',
    avatar: '🎮',
    specialty: 'Universal Game Builder',
    service: 'templateProcessor',
    endpoint: '/upload',
    capabilities: ['Game Design', 'Level Creation', 'Asset Generation', 'Gameplay Programming', 'Audio Design', 'Publishing'],
    pricing: { hourly: 75, project: 500, monthly: 3000 }
  },
  'speedbot-alpha': {
    name: 'SpeedBot Alpha',
    avatar: '🏃‍♂️',
    specialty: 'Speedrun Specialist',
    service: 'aiAPI',
    endpoint: '/api/generate',
    capabilities: ['Route Optimization', 'Frame Analysis', 'Input Automation', 'Strategy Development', 'Record Breaking', 'Competition Prep'],
    pricing: { hourly: 30, project: 200, monthly: 1500 }
  }
};

// In-memory job storage (in production, use database)
const activeJobs = new Map();
const userAccounts = new Map();

console.log('🚀 Marketplace Integration Service Starting...');

// Routes for marketplace pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'AI-AGENT-MARKETPLACE.html'));
});

app.get('/hire/:agentId', (req, res) => {
  res.sendFile(path.join(__dirname, 'hire-agent.html'));
});

app.get('/gaming', (req, res) => {
  res.sendFile(path.join(__dirname, 'gaming-agents.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'signup.html'));
});

app.get('/agent-working/:jobId', (req, res) => {
  res.sendFile(path.join(__dirname, 'agent-working.html'));
});

// API Routes

// Get all available agents
app.get('/api/agents', (req, res) => {
  const category = req.query.category;
  let agents = Object.entries(agentRegistry).map(([id, agent]) => ({
    id,
    ...agent
  }));
  
  if (category) {
    // Filter by category (gaming, development, etc.)
    agents = agents.filter(agent => {
      if (category === 'gaming') {
        return ['🎮', '🏃‍♂️', '🌾', '💎'].includes(agent.avatar);
      }
      if (category === 'development') {
        return agent.avatar === '🤖';
      }
      return true;
    });
  }
  
  res.json({ agents });
});

// Get specific agent details
app.get('/api/agents/:agentId', (req, res) => {
  const agent = agentRegistry[req.params.agentId];
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  
  res.json({ 
    id: req.params.agentId,
    ...agent,
    status: 'available',
    activeJobs: Array.from(activeJobs.values()).filter(job => job.agentId === req.params.agentId).length
  });
});

// Create user account
app.post('/api/signup', (req, res) => {
  const { email, username, interest } = req.body;
  
  if (!email || !username) {
    return res.status(400).json({ error: 'Email and username required' });
  }
  
  // Check if user exists
  if (Array.from(userAccounts.values()).some(user => user.email === email || user.username === username)) {
    return res.status(409).json({ error: 'User already exists' });
  }
  
  const userId = Date.now().toString();
  const userData = {
    id: userId,
    email,
    username,
    interest,
    credits: 1000, // Welcome bonus
    joinDate: new Date().toISOString(),
    plan: 'free'
  };
  
  userAccounts.set(userId, userData);
  
  res.json({
    success: true,
    user: userData,
    token: `user_${userId}` // Simple token for demo
  });
});

// Hire an agent
app.post('/api/hire', async (req, res) => {
  try {
    const { agentId, taskDescription, pricingType, userId } = req.body;
    
    if (!agentId || !taskDescription) {
      return res.status(400).json({ error: 'Agent ID and task description required' });
    }
    
    const agent = agentRegistry[agentId];
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    // Create job
    const jobId = Date.now().toString();
    const job = {
      id: jobId,
      agentId,
      agentName: agent.name,
      taskDescription,
      pricingType: pricingType || 'project',
      userId: userId || 'anonymous',
      status: 'starting',
      progress: 0,
      startTime: new Date().toISOString(),
      estimatedCompletion: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
      cost: agent.pricing[pricingType] || agent.pricing.project,
      results: null
    };
    
    activeJobs.set(jobId, job);
    
    // Start the actual work by calling the appropriate service
    startAgentWork(job);
    
    res.json({
      success: true,
      jobId,
      message: 'Agent hired successfully',
      estimatedCompletion: job.estimatedCompletion,
      monitorUrl: `/agent-working/${jobId}`
    });
    
  } catch (error) {
    console.error('Hire agent error:', error);
    res.status(500).json({ error: 'Failed to hire agent' });
  }
});

// Get job status
app.get('/api/jobs/:jobId', (req, res) => {
  const job = activeJobs.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  res.json(job);
});

// Update job progress (called by agents)
app.post('/api/jobs/:jobId/progress', (req, res) => {
  const job = activeJobs.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  const { progress, status, results } = req.body;
  
  if (progress !== undefined) job.progress = progress;
  if (status) job.status = status;
  if (results) job.results = results;
  
  activeJobs.set(req.params.jobId, job);
  
  res.json({ success: true });
});

// Get marketplace statistics
app.get('/api/stats', (req, res) => {
  const stats = {
    totalAgents: Object.keys(agentRegistry).length,
    activeJobs: activeJobs.size,
    completedJobs: Array.from(activeJobs.values()).filter(job => job.status === 'completed').length,
    totalUsers: userAccounts.size,
    serviceHealth: 'healthy' // TODO: Check actual services
  };
  
  res.json(stats);
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Marketplace Integration',
    activeJobs: activeJobs.size,
    registeredAgents: Object.keys(agentRegistry).length,
    timestamp: Date.now()
  });
});

// Start agent work by calling appropriate service
async function startAgentWork(job) {
  try {
    const agent = agentRegistry[job.agentId];
    const serviceUrl = services[agent.service];
    
    console.log(`🤖 Starting work for ${agent.name} on job ${job.id}`);
    
    // Update job status
    job.status = 'running';
    job.progress = 10;
    activeJobs.set(job.id, job);
    
    // Prepare request based on agent type
    let requestData;
    let endpoint = `${serviceUrl}${agent.endpoint}`;
    
    if (agent.service === 'aiAPI') {
      requestData = {
        content: job.taskDescription,
        type: job.agentId.includes('validator') ? 'technical_spec' : 'general',
        options: {
          extractFeatures: true,
          generateSummary: true,
          identifyRequirements: true
        }
      };
    } else if (agent.service === 'templateProcessor') {
      // For template processor, we'll create a temporary file
      const tempFile = `temp_job_${job.id}.txt`;
      require('fs').writeFileSync(tempFile, job.taskDescription);
      
      // In a real implementation, you'd handle file upload properly
      requestData = { document: { content: job.taskDescription, type: 'business_plan' } };
    }
    
    // Simulate progressive work updates
    const progressInterval = setInterval(() => {
      const currentJob = activeJobs.get(job.id);
      if (currentJob && currentJob.status === 'running' && currentJob.progress < 90) {
        currentJob.progress += Math.random() * 10;
        currentJob.progress = Math.min(currentJob.progress, 90);
        activeJobs.set(job.id, currentJob);
      }
    }, 3000);
    
    // Make actual API call to the service
    // Use built-in fetch in Node 18+ or axios as fallback
    const axios = require('axios');
    
    const response = await axios.post(endpoint, requestData, {
      headers: {
        'Content-Type': 'application/json',
        'X-System-Bus': 'true', // Use our system bus bypass
        'X-Job-ID': job.id
      }
    });
    
    const result = response.data;
    
    // Clear progress interval
    clearInterval(progressInterval);
    
    // Update job with results
    job.status = 'completed';
    job.progress = 100;
    job.completedTime = new Date().toISOString();
    job.results = result;
    
    activeJobs.set(job.id, job);
    
    console.log(`✅ Job ${job.id} completed successfully`);
    
  } catch (error) {
    console.error(`❌ Job ${job.id} failed:`, error);
    
    // Update job with error
    job.status = 'failed';
    job.error = error.message;
    activeJobs.set(job.id, job);
  }
}

// Cleanup completed jobs older than 1 hour
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  
  for (const [jobId, job] of activeJobs.entries()) {
    if (job.status === 'completed' && new Date(job.completedTime).getTime() < oneHourAgo) {
      activeJobs.delete(jobId);
      console.log(`🧹 Cleaned up old job ${jobId}`);
    }
  }
}, 10 * 60 * 1000); // Run every 10 minutes

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 MARKETPLACE INTEGRATION SERVICE ONLINE!
==========================================
📍 Marketplace URL: http://localhost:${PORT}
🤖 Agents Available: ${Object.keys(agentRegistry).length}
🔗 Connected Services: ${Object.keys(services).length}
💼 Active Jobs: ${activeJobs.size}
📊 Dashboard: http://localhost:${PORT}
✅ Ready to process agent requests!
  `);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down Marketplace Integration...');
  process.exit(0);
});

module.exports = app;