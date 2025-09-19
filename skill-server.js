#!/usr/bin/env node

/**
 * 🎮 SKILL SERVER - Local Express server for skill dashboard
 * Provides REST API and WebSocket for real-time updates
 * Runs entirely locally without external dependencies
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const SkillEngine = require('./packages/skill-engine');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, port: 3334 });

// Initialize skill engine
const skillEngine = new SkillEngine();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'web')));

// CORS for local development
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    next();
});

// WebSocket connections
const wsClients = new Set();

wss.on('connection', (ws) => {
    console.log('🔌 New WebSocket connection');
    wsClients.add(ws);
    
    ws.on('close', () => {
        wsClients.delete(ws);
        console.log('🔌 WebSocket disconnected');
    });
    
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

// Broadcast to all WebSocket clients
function broadcast(data) {
    const message = JSON.stringify(data);
    wsClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// Initialize skill engine and set up event listeners
async function initializeServer() {
    await skillEngine.initialize();
    
    // Listen for skill engine events
    skillEngine.on('levelUp', (data) => {
        broadcast({ type: 'levelUp', ...data });
    });
    
    skillEngine.on('skillTrained', (data) => {
        broadcast({ type: 'skillUpdate', skill: skillEngine.playerSkills[data.skillId] });
    });
    
    skillEngine.on('brainrotDecay', (data) => {
        broadcast({ type: 'brainrotDecay', ...data });
    });
    
    skillEngine.on('construction99', (data) => {
        broadcast({ type: 'construction99', ...data });
    });
    
    console.log('✅ Skill engine initialized');
}

// API Routes

// Get all skills
app.get('/skills', (req, res) => {
    const skills = skillEngine.getAllSkills();
    const skillsMap = {};
    
    skills.forEach(skill => {
        skillsMap[skill.id] = skill;
    });
    
    res.json({
        skills: skillsMap,
        focusedSkill: skillEngine.focusedSkill,
        brainrotActive: skillEngine.brainrotTimer !== null
    });
});

// Train a skill
app.post('/train/:skillId', async (req, res) => {
    try {
        const { skillId } = req.params;
        const { xp = 10 } = req.body;
        
        const result = await skillEngine.trainSkill(skillId, xp);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Set focused skill
app.post('/focus/:skillId', async (req, res) => {
    try {
        const { skillId } = req.params;
        await skillEngine.setFocusedSkill(skillId);
        res.json({ success: true, focusedSkill: skillId });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Remove focus
app.post('/unfocus', async (req, res) => {
    await skillEngine.setFocusedSkill(null);
    res.json({ success: true, focusedSkill: null });
});

// Toggle brainrot
app.post('/brainrot/toggle', (req, res) => {
    if (skillEngine.brainrotTimer) {
        skillEngine.stopBrainrot();
        res.json({ success: true, brainrotActive: false });
    } else {
        skillEngine.resumeBrainrot();
        res.json({ success: true, brainrotActive: true });
    }
});

// Get brainrot stats
app.get('/brainrot/stats', (req, res) => {
    if (skillEngine.brainrotSystem) {
        const stats = skillEngine.brainrotSystem.getDecayStats();
        res.json(stats);
    } else {
        res.json({ totalEvents: 0, totalXPLost: 0 });
    }
});

// Calculate bank tab optimization
app.post('/calculate/inventory', (req, res) => {
    if (!skillEngine.calculator) {
        const BankTabCalculator = require('./packages/skill-engine/calculator');
        skillEngine.calculator = new BankTabCalculator();
    }
    
    const { task, items } = req.body;
    const result = skillEngine.calculator.calculateOptimalInventory(task, items);
    res.json(result);
});

// Calculate teleport path
app.post('/calculate/teleport', (req, res) => {
    if (!skillEngine.calculator) {
        const BankTabCalculator = require('./packages/skill-engine/calculator');
        skillEngine.calculator = new BankTabCalculator();
    }
    
    const { start, destination } = req.body;
    const result = skillEngine.calculator.calculateOptimalTeleportPath(start, destination);
    res.json(result);
});

// Quick actions
app.post('/action/train-all', async (req, res) => {
    const results = [];
    
    for (const skillId in skillEngine.skills) {
        try {
            const result = await skillEngine.trainSkill(skillId, 5);
            results.push({ skillId, success: true, ...result });
        } catch (error) {
            results.push({ skillId, success: false, error: error.message });
        }
    }
    
    res.json({ results });
});

app.post('/action/focus-lowest', async (req, res) => {
    const skills = skillEngine.getAllSkills();
    const lowest = skills.reduce((min, skill) => 
        skill.level < min.level ? skill : min
    );
    
    await skillEngine.setFocusedSkill(lowest.id);
    res.json({ success: true, focusedSkill: lowest.id, skillName: lowest.name });
});

// Serve the dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'web', 'skill-dashboard.html'));
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        skills: Object.keys(skillEngine.skills).length,
        wsClients: wsClients.size
    });
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
const PORT = process.env.SKILL_PORT || 3333;

initializeServer().then(() => {
    server.listen(PORT, () => {
        console.log(`
🎮 Skill Dashboard Server Running!
🌐 Dashboard: http://localhost:${PORT}
🔌 WebSocket: ws://localhost:3334
🎯 API: http://localhost:${PORT}/skills

💡 Quick Links:
  - Dashboard: http://localhost:${PORT}
  - Health Check: http://localhost:${PORT}/health
  - All Skills: http://localhost:${PORT}/skills

🎮 Press Ctrl+C to stop the server
        `);
    });
}).catch(error => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🔚 Shutting down skill server...');
    
    // Close WebSocket connections
    wsClients.forEach(client => client.close());
    wss.close();
    
    // Shutdown skill engine
    await skillEngine.shutdown();
    
    // Close HTTP server
    server.close(() => {
        console.log('✅ Server shutdown complete');
        process.exit(0);
    });
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled rejection:', reason);
    process.exit(1);
});