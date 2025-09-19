const SimpleConnector = require('./simple-connector.js');
const MobileIdleTycoon = require('./mobile-idle-tycoon.js');
const express = require('express');
const path = require('path');

console.log('🏴‍☠️ Starting LOCAL ONLY server...\n');

// Initialize with simple connector
const connector = new SimpleConnector();
const game = new MobileIdleTycoon();

// Connect systems locally
connector.connectSystems(game);

// Apply local config
const localConfig = connector.generateLocalConfig();
game.idleMechanics.resourceCap = localConfig.resources.caps.gold;

// Start local game loop
connector.createLocalGameLoop(game);

// Simple Express server
const app = express();
const port = 7779; // Different port to avoid conflicts

app.use(express.json());
app.use(express.static('public'));

// Serve the game HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'mobile-idle-tycoon.html'));
});

// Basic API endpoints
app.get('/api/game/state', (req, res) => {
    res.json(game.getGameState());
});

app.post('/api/building/create', (req, res) => {
    try {
        const { type, x, y, islandId } = req.body;
        const building = game.createBuilding(type, x, y, islandId);
        res.json(building);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/building/:id/collect', (req, res) => {
    try {
        const collected = game.collectResources(req.params.id);
        res.json({ collected });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Start server
app.listen(port, () => {
    console.log(`
🎮 LOCAL GAME SERVER RUNNING!
============================
🏴‍☠️ Play at: http://localhost:${port}
📱 Mobile: Use your computer's IP:${port}
💾 Saves: ./save-data/
🎨 Graphics: Local emoji sprites

Features:
✅ Full game functionality
✅ Offline progression
✅ Local saves
✅ No external dependencies

Press Ctrl+C to stop
`);
});
