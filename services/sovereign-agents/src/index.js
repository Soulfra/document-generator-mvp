/**
 * Sovereign Agent Service - Main Entry Point
 * 
 * Provides REST API and WebSocket endpoints for sovereign agent orchestration
 */

const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const winston = require('winston');
require('dotenv').config();

// Import services
const SovereignOrchestrationDatabase = require('./services/SovereignOrchestrationDatabase');
const SovereignAgent = require('./services/SovereignAgent');
const HumanConductorInterface = require('./services/HumanConductorInterface');
const FileBasedDatabase = require('./services/FileBasedDatabase');
const DocumentAgentBridge = require('./services/DocumentAgentBridge');
const CryptoDeviceIdentity = require('./services/CryptoDeviceIdentity');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: '/app/logs/sovereign-agents.log' })
  ]
});

// Create Express app
const app = express();
const server = http.createServer(app);

// Configure middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize database
let database;
const initDatabase = async () => {
  try {
    // Try SQLite first
    database = new SovereignOrchestrationDatabase({
      dbPath: process.env.DATABASE_PATH || '/app/data/sovereign-agents.db'
    });
    await database.initialize();
    logger.info('SQLite database initialized');
  } catch (error) {
    logger.warn('SQLite initialization failed, using file-based database', error);
    // Fallback to file-based
    database = new FileBasedDatabase({
      dataDir: process.env.DATA_DIR || '/app/data'
    });
    await database.initialize();
    logger.info('File-based database initialized');
  }
  return database;
};

// Agent pool management
const agentPool = new Map();
const conductorInterfaces = new Map();

// WebSocket server for real-time updates
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  logger.info('New WebSocket connection');
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      await handleWebSocketMessage(ws, data);
    } catch (error) {
      logger.error('WebSocket message error:', error);
      ws.send(JSON.stringify({ error: error.message }));
    }
  });
  
  ws.on('close', () => {
    logger.info('WebSocket connection closed');
  });
});

// WebSocket message handler
async function handleWebSocketMessage(ws, data) {
  switch (data.type) {
    case 'subscribe':
      // Subscribe to agent updates
      ws.agentId = data.agentId;
      break;
    case 'conductor:approve':
      // Handle conductor approval
      await handleConductorApproval(ws, data);
      break;
    case 'conductor:reject':
      // Handle conductor rejection
      await handleConductorRejection(ws, data);
      break;
    default:
      ws.send(JSON.stringify({ error: 'Unknown message type' }));
  }
}

// Broadcast updates to WebSocket clients
function broadcastUpdate(agentId, update) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && 
        (!client.agentId || client.agentId === agentId)) {
      client.send(JSON.stringify(update));
    }
  });
}

// API Routes

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'sovereign-agents',
    agents: agentPool.size,
    uptime: process.uptime()
  });
});

// List all agents
app.get('/api/sovereign/agents', async (req, res) => {
  try {
    const agents = await database.getAllSovereignAgents();
    const agentStatuses = [];
    
    for (const agent of agents) {
      const poolAgent = agentPool.get(agent.id);
      const status = poolAgent ? await poolAgent.getStatus() : {
        id: agent.id,
        name: agent.name,
        status: 'offline',
        emotionalState: agent.emotional_state
      };
      agentStatuses.push(status);
    }
    
    res.json({ agents: agentStatuses });
  } catch (error) {
    logger.error('Error listing agents:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new agent
app.post('/api/sovereign/agents', async (req, res) => {
  try {
    const { name, personality, capabilities, autonomyLevel } = req.body;
    
    const agent = new SovereignAgent({
      name,
      personality,
      capabilities,
      autonomyLevel,
      database,
      aiServiceManager: createAIServiceManager()
    });
    
    await agent.initialize();
    agentPool.set(agent.id, agent);
    
    // Set up event listeners
    setupAgentEventListeners(agent);
    
    res.json({
      id: agent.id,
      name: agent.name,
      status: 'initialized'
    });
  } catch (error) {
    logger.error('Error creating agent:', error);
    res.status(500).json({ error: error.message });
  }
});

// Process document with sovereign agents
app.post('/api/sovereign/process-document', async (req, res) => {
  try {
    const { documentPath, documentContent, documentType, userId } = req.body;
    
    // Create document bridge
    const bridge = new DocumentAgentBridge({
      database,
      agentPool,
      aiServiceManager: createAIServiceManager()
    });
    
    await bridge.initialize();
    
    // Process document
    const result = await bridge.processDocument({
      path: documentPath,
      content: documentContent,
      type: documentType,
      userId
    });
    
    res.json(result);
  } catch (error) {
    logger.error('Error processing document:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get agent details
app.get('/api/sovereign/agents/:agentId', async (req, res) => {
  try {
    const agent = agentPool.get(req.params.agentId);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    const status = await agent.getStatus();
    const memory = await agent.getMemory();
    const sessions = await agent.getReasoningSessions(10);
    
    res.json({
      status,
      memory,
      recentSessions: sessions
    });
  } catch (error) {
    logger.error('Error getting agent details:', error);
    res.status(500).json({ error: error.message });
  }
});

// Send task to agent
app.post('/api/sovereign/agents/:agentId/tasks', async (req, res) => {
  try {
    const agent = agentPool.get(req.params.agentId);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    const { description, context } = req.body;
    
    // Fork process if not already forked
    if (!agent.childProcess) {
      await agent.forkProcess();
    }
    
    const taskId = await agent.sendTask(description, context);
    
    res.json({
      taskId,
      agentId: agent.id,
      status: 'submitted'
    });
  } catch (error) {
    logger.error('Error sending task to agent:', error);
    res.status(500).json({ error: error.message });
  }
});

// Conductor approval endpoint
app.post('/api/sovereign/conductor/approve', async (req, res) => {
  try {
    const { sessionId, agentId, conductorId, reasoning } = req.body;
    
    const agent = agentPool.get(agentId);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    await agent.approveAction(sessionId, conductorId, reasoning);
    
    res.json({
      sessionId,
      agentId,
      status: 'approved'
    });
  } catch (error) {
    logger.error('Error approving action:', error);
    res.status(500).json({ error: error.message });
  }
});

// Conductor rejection endpoint
app.post('/api/sovereign/conductor/reject', async (req, res) => {
  try {
    const { sessionId, agentId, conductorId, reasoning } = req.body;
    
    const agent = agentPool.get(agentId);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }
    
    await agent.rejectAction(sessionId, conductorId, reasoning);
    
    res.json({
      sessionId,
      agentId,
      status: 'rejected'
    });
  } catch (error) {
    logger.error('Error rejecting action:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get reasoning session details
app.get('/api/sovereign/sessions/:sessionId', async (req, res) => {
  try {
    const session = await database.getReasoningSession(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json(session);
  } catch (error) {
    logger.error('Error getting session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get pending approvals
app.get('/api/sovereign/conductor/pending', async (req, res) => {
  try {
    const pendingApprovals = await database.getPendingApprovals();
    res.json({ approvals: pendingApprovals });
  } catch (error) {
    logger.error('Error getting pending approvals:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper functions

function setupAgentEventListeners(agent) {
  agent.on('approvalNeeded', (data) => {
    logger.info('Approval needed:', data);
    broadcastUpdate(agent.id, {
      type: 'approvalNeeded',
      ...data
    });
  });
  
  agent.on('statusUpdate', (data) => {
    broadcastUpdate(agent.id, {
      type: 'statusUpdate',
      ...data
    });
  });
  
  agent.on('emotionalStateUpdate', (data) => {
    broadcastUpdate(agent.id, {
      type: 'emotionalStateUpdate',
      ...data
    });
  });
  
  agent.on('taskCompleted', (data) => {
    broadcastUpdate(agent.id, {
      type: 'taskCompleted',
      ...data
    });
  });
}

function createAIServiceManager() {
  // Mock AI service manager for now
  // In production, this would connect to Ollama and cloud AI services
  return {
    async query(prompt, options = {}) {
      // Simulate AI response
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 500));
      
      return {
        text: `AI response to: ${prompt.substring(0, 50)}...`,
        cost: 0.001,
        tokensUsed: Math.floor(prompt.length / 4)
      };
    }
  };
}

async function handleConductorApproval(ws, data) {
  const { sessionId, agentId, conductorId, reasoning } = data;
  
  const agent = agentPool.get(agentId);
  if (!agent) {
    ws.send(JSON.stringify({ error: 'Agent not found' }));
    return;
  }
  
  await agent.approveAction(sessionId, conductorId, reasoning);
  
  ws.send(JSON.stringify({
    type: 'approvalConfirmed',
    sessionId,
    agentId
  }));
}

async function handleConductorRejection(ws, data) {
  const { sessionId, agentId, conductorId, reasoning } = data;
  
  const agent = agentPool.get(agentId);
  if (!agent) {
    ws.send(JSON.stringify({ error: 'Agent not found' }));
    return;
  }
  
  await agent.rejectAction(sessionId, conductorId, reasoning);
  
  ws.send(JSON.stringify({
    type: 'rejectionConfirmed',
    sessionId,
    agentId
  }));
}

// Initialize default agents with crypto device identities
async function initializeDefaultAgents() {
  logger.info('🔐 Initializing sovereign agents with crypto device identities...');
  
  // Initialize crypto device identity system
  const cryptoIdentity = new CryptoDeviceIdentity({
    cryptoSecret: process.env.AGENT_CRYPTO_SECRET,
    fingerprintSalt: process.env.AGENT_DEVICE_FINGERPRINT_SALT,
    uuidNamespace: process.env.AGENT_UUID_NAMESPACE
  });

  const defaultAgents = [
    {
      name: 'DocumentAnalyzer_Prime',
      personality: { analytical: 0.9, creative: 0.6, collaborative: 0.8 },
      capabilities: { documentAnalysis: true, reasoning: true },
      autonomyLevel: 7,
      networkRole: 'analyzer'
    },
    {
      name: 'TemplateSelector_Alpha',
      personality: { systematic: 0.8, innovative: 0.7, cautious: 0.6 },
      capabilities: { templateSelection: true, reasoning: true },
      autonomyLevel: 6,
      networkRole: 'selector'
    },
    {
      name: 'CodeGenerator_Beta',
      personality: { precise: 0.9, creative: 0.8, persistent: 0.7 },
      capabilities: { codeGeneration: true, reasoning: true },
      autonomyLevel: 5,
      networkRole: 'generator'
    }
  ];
  
  // Generate crypto identities for all agents
  logger.info('🎭 Generating cryptographic identities for sovereign agents...');
  const agentIdentities = await cryptoIdentity.generateSovereignAgentIdentities(
    defaultAgents.reduce((acc, agent) => {
      acc[agent.name] = agent;
      return acc;
    }, {})
  );
  
  for (const config of defaultAgents) {
    try {
      // Get the crypto identity for this agent
      const identity = agentIdentities[config.name];
      
      const agent = new SovereignAgent({
        ...config,
        id: identity.agentUUID, // Use crypto-generated UUID
        cryptoIdentity: identity,
        database,
        aiServiceManager: createAIServiceManager()
      });
      
      await agent.initialize();
      agentPool.set(agent.id, agent);
      setupAgentEventListeners(agent);
      
      logger.info(`✅ Initialized sovereign agent: ${agent.name}`);
      logger.info(`   🔑 UUID: ${identity.agentUUID}`);
      logger.info(`   🏠 Device: ${identity.deviceFingerprint.substring(0, 12)}...`);
      logger.info(`   🔗 Blockchain Address: ${identity.blockchainReadiness.address}`);
      
    } catch (error) {
      logger.error(`❌ Error initializing sovereign agent ${config.name}:`, error);
    }
  }
  
  logger.info(`🎼 Sovereign agent orchestra initialized with ${agentPool.size} agents`);
  logger.info('🎭 "Conductor of orchestration with soul-like agents" ready!');
}

// Start server
async function startServer() {
  try {
    // Initialize database
    await initDatabase();
    
    // Initialize default agents
    await initializeDefaultAgents();
    
    // Start listening
    const PORT = process.env.PORT || 8085;
    server.listen(PORT, () => {
      logger.info(`Sovereign Agent Service running on port ${PORT}`);
      logger.info(`WebSocket available on ws://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  // Terminate all agents
  for (const [id, agent] of agentPool) {
    await agent.terminateAgent('system', 'Service shutdown');
  }
  
  // Close database
  if (database) {
    await database.close();
  }
  
  // Close server
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Start the service
startServer();