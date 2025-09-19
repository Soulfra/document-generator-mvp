const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Service registry with game world metaphors
const SERVICES = {
  castle: {
    name: 'Unified Debugger',
    port: 7777,
    icon: '🏰',
    description: 'Command center for all debugging operations',
    healthEndpoint: '/health',
    mainEndpoint: '/'
  },
  hospital: {
    name: 'Database Scanner',
    port: 7778,
    icon: '🏥',
    description: 'Health checks for your data systems',
    healthEndpoint: '/api/health',
    mainEndpoint: '/'
  },
  mapRoom: {
    name: 'Decision Flow Visualizer',
    port: 7780,
    icon: '🗺️',
    description: 'Navigate through system decisions',
    healthEndpoint: '/health',
    mainEndpoint: '/'
  },
  school: {
    name: 'Color Education System',
    port: 8787,
    icon: '🏫',
    description: 'Learn the language of colors',
    healthEndpoint: '/health',
    mainEndpoint: '/'
  },
  arcade: {
    name: 'Debug Game',
    port: 8500,
    icon: '🎮',
    description: 'Fix bugs while having fun',
    healthEndpoint: '/health',
    mainEndpoint: '/'
  },
  lab: {
    name: 'AI Debug Assistant',
    port: 9500,
    icon: '🤖',
    description: 'Smart helpers for complex problems',
    healthEndpoint: '/health',
    mainEndpoint: '/'
  },
  townSquare: {
    name: 'Multiplayer Hub',
    port: 8888,
    icon: '🌐',
    description: 'Collaborate with others',
    healthEndpoint: '/health',
    mainEndpoint: '/'
  },
  concertHall: {
    name: 'Music System',
    port: 3000,
    icon: '🎵',
    description: 'Audio feedback and ambiance',
    healthEndpoint: '/health',
    mainEndpoint: '/'
  }
};

// System state
let systemHealth = {
  overall: 'sunny',
  services: {},
  notifications: [],
  activities: []
};

// Health check all services
async function checkServiceHealth() {
  const healthPromises = Object.entries(SERVICES).map(async ([key, service]) => {
    try {
      const response = await fetch(`http://localhost:${service.port}${service.healthEndpoint}`, {
        timeout: 3000
      });
      const isHealthy = response.ok;
      
      systemHealth.services[key] = {
        ...service,
        status: isHealthy ? 'online' : 'offline',
        responseTime: Date.now(),
        health: isHealthy ? 100 : 0
      };
    } catch (error) {
      systemHealth.services[key] = {
        ...service,
        status: 'offline',
        responseTime: Date.now(),
        health: 0,
        error: error.message
      };
    }
  });

  await Promise.all(healthPromises);
  updateOverallHealth();
  broadcastSystemState();
}

// Calculate overall system health
function updateOverallHealth() {
  const statuses = Object.values(systemHealth.services).map(s => s.status);
  const onlineCount = statuses.filter(s => s === 'online').length;
  const totalCount = statuses.length;
  const healthPercentage = (onlineCount / totalCount) * 100;

  if (healthPercentage === 100) {
    systemHealth.overall = 'sunny';
  } else if (healthPercentage >= 75) {
    systemHealth.overall = 'partly-cloudy';
  } else if (healthPercentage >= 50) {
    systemHealth.overall = 'rainy';
  } else {
    systemHealth.overall = 'stormy';
  }
}

// Broadcast system state to all connected clients
function broadcastSystemState() {
  const message = JSON.stringify({
    type: 'system-update',
    data: systemHealth
  });

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('🎮 New player connected to the game world!');
  
  // Send initial state
  ws.send(JSON.stringify({
    type: 'welcome',
    data: systemHealth
  }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handlePlayerAction(data, ws);
    } catch (error) {
      console.error('Failed to parse message:', error);
    }
  });

  ws.on('close', () => {
    console.log('👋 Player disconnected from the game world');
  });
});

// Handle player actions
async function handlePlayerAction(action, ws) {
  switch (action.type) {
    case 'enter-building':
      // Redirect player to service
      ws.send(JSON.stringify({
        type: 'redirect',
        url: `http://localhost:${SERVICES[action.building].port}`
      }));
      
      // Log activity
      addActivity(`Player entered ${SERVICES[action.building].icon} ${SERVICES[action.building].name}`);
      break;

    case 'health-check':
      await checkServiceHealth();
      ws.send(JSON.stringify({
        type: 'health-update',
        data: systemHealth
      }));
      break;

    case 'quick-fix':
      // Attempt to restart offline services
      await attemptQuickFix(action.service);
      break;

    case 'drag-drop-file':
      // Process dropped file
      await processDroppedFile(action.file, ws);
      break;
  }
}

// Add activity to the log
function addActivity(message) {
  systemHealth.activities.unshift({
    message,
    timestamp: new Date().toISOString(),
    icon: '✨'
  });

  // Keep only last 50 activities
  if (systemHealth.activities.length > 50) {
    systemHealth.activities.pop();
  }

  broadcastSystemState();
}

// Attempt to fix offline services
async function attemptQuickFix(serviceKey) {
  addActivity(`🔧 Attempting to fix ${SERVICES[serviceKey].name}...`);
  
  // In a real implementation, this would attempt to restart the service
  // For now, we'll simulate it
  setTimeout(() => {
    addActivity(`✅ ${SERVICES[serviceKey].name} fix attempted!`);
    checkServiceHealth();
  }, 2000);
}

// Process dropped files
async function processDroppedFile(fileData, ws) {
  addActivity(`📁 Processing dropped file: ${fileData.name}`);
  
  // Route to appropriate service based on file type
  let targetService = 'castle'; // Default to debugger
  
  if (fileData.name.endsWith('.db') || fileData.name.endsWith('.sql')) {
    targetService = 'hospital';
  } else if (fileData.name.endsWith('.json') && fileData.name.includes('flow')) {
    targetService = 'mapRoom';
  }
  
  ws.send(JSON.stringify({
    type: 'file-routed',
    service: targetService,
    message: `File routed to ${SERVICES[targetService].icon} ${SERVICES[targetService].name}`
  }));
  
  addActivity(`📨 File sent to ${SERVICES[targetService].name}`);
}

// Serve static files
app.use(express.static('public'));

// Main dashboard HTML
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎮 Document Generator World - Control Center</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(to bottom, #87CEEB 0%, #98D8C8 50%, #7FBD7F 100%);
            min-height: 100vh;
            overflow-x: hidden;
        }

        /* Weather overlay */
        .weather-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
            z-index: 1;
        }

        .weather-overlay.sunny {
            background: radial-gradient(circle at 20% 20%, rgba(255, 255, 100, 0.3) 0%, transparent 50%);
        }

        .weather-overlay.partly-cloudy {
            background: linear-gradient(to bottom, rgba(200, 200, 200, 0.3) 0%, transparent 50%);
        }

        .weather-overlay.rainy {
            background: linear-gradient(to bottom, rgba(100, 100, 150, 0.4) 0%, transparent 70%);
        }

        .weather-overlay.stormy {
            background: linear-gradient(to bottom, rgba(50, 50, 80, 0.6) 0%, transparent 80%);
            animation: lightning 5s infinite;
        }

        @keyframes lightning {
            0%, 90%, 100% { opacity: 1; }
            93% { opacity: 0.3; }
            95% { opacity: 1; }
            97% { opacity: 0.3; }
        }

        /* Main container */
        .container {
            position: relative;
            z-index: 2;
            padding: 20px;
            max-width: 1400px;
            margin: 0 auto;
        }

        /* Header */
        .header {
            text-align: center;
            margin-bottom: 30px;
            color: white;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }

        .header h1 {
            font-size: 3em;
            margin-bottom: 10px;
            animation: float 3s ease-in-out infinite;
        }

        @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }

        .status-banner {
            background: rgba(255, 255, 255, 0.9);
            border-radius: 20px;
            padding: 15px 30px;
            display: inline-block;
            font-size: 1.2em;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        /* World map */
        .world-map {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 30px;
            padding: 40px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            position: relative;
            min-height: 500px;
        }

        /* Buildings grid */
        .buildings-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 30px;
            margin-top: 30px;
        }

        /* Building card */
        .building {
            background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
            border-radius: 20px;
            padding: 25px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }

        .building:hover {
            transform: translateY(-5px) scale(1.05);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
        }

        .building.online {
            background: linear-gradient(135deg, #90EE90 0%, #7FBD7F 100%);
            animation: glow 2s ease-in-out infinite;
        }

        .building.offline {
            background: linear-gradient(135deg, #FFB6C1 0%, #FF6B6B 100%);
            opacity: 0.7;
        }

        @keyframes glow {
            0%, 100% { box-shadow: 0 0 20px rgba(144, 238, 144, 0.5); }
            50% { box-shadow: 0 0 40px rgba(144, 238, 144, 0.8); }
        }

        .building-icon {
            font-size: 4em;
            margin-bottom: 10px;
            filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.2));
        }

        .building-name {
            font-size: 1.2em;
            font-weight: bold;
            margin-bottom: 5px;
            color: #333;
        }

        .building-description {
            font-size: 0.9em;
            color: #666;
            margin-bottom: 10px;
        }

        .building-status {
            font-size: 0.8em;
            padding: 5px 10px;
            border-radius: 15px;
            background: rgba(255, 255, 255, 0.5);
            display: inline-block;
        }

        /* Control panel */
        .control-panel {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 30px;
            margin-top: 30px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }

        .control-buttons {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
            justify-content: center;
        }

        .control-button {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 25px;
            font-size: 1.1em;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .control-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
        }

        /* Activity log */
        .activity-log {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            padding: 20px;
            margin-top: 20px;
            max-height: 300px;
            overflow-y: auto;
        }

        .activity-item {
            padding: 10px;
            border-bottom: 1px solid #eee;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideIn 0.3s ease;
        }

        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateX(-20px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }

        .activity-icon {
            font-size: 1.5em;
        }

        .activity-text {
            flex: 1;
        }

        .activity-time {
            font-size: 0.8em;
            color: #999;
        }

        /* Drop zone */
        .drop-zone {
            border: 3px dashed #667eea;
            border-radius: 20px;
            padding: 40px;
            text-align: center;
            margin-top: 20px;
            background: rgba(102, 126, 234, 0.1);
            transition: all 0.3s ease;
        }

        .drop-zone.drag-over {
            background: rgba(102, 126, 234, 0.3);
            transform: scale(1.02);
        }

        .drop-zone-icon {
            font-size: 3em;
            margin-bottom: 10px;
        }

        /* Particles */
        .particle {
            position: absolute;
            pointer-events: none;
            opacity: 0.7;
            animation: particle-float 10s infinite ease-in-out;
        }

        @keyframes particle-float {
            0%, 100% {
                transform: translate(0, 0) rotate(0deg);
            }
            25% {
                transform: translate(100px, -100px) rotate(90deg);
            }
            50% {
                transform: translate(-50px, -200px) rotate(180deg);
            }
            75% {
                transform: translate(-150px, -100px) rotate(270deg);
            }
        }

        /* Tooltips */
        .tooltip {
            position: absolute;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 15px;
            border-radius: 10px;
            font-size: 0.9em;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.3s ease;
            z-index: 1000;
        }

        .tooltip.show {
            opacity: 1;
        }

        /* Loading spinner */
        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        /* Celebration effects */
        .celebration {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 5em;
            animation: celebrate 1s ease-out;
            pointer-events: none;
            z-index: 1000;
        }

        @keyframes celebrate {
            0% {
                transform: translate(-50%, -50%) scale(0) rotate(0deg);
                opacity: 1;
            }
            100% {
                transform: translate(-50%, -50%) scale(2) rotate(360deg);
                opacity: 0;
            }
        }

        /* Responsive design */
        @media (max-width: 768px) {
            .header h1 {
                font-size: 2em;
            }
            
            .buildings-grid {
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 15px;
            }
            
            .building {
                padding: 15px;
            }
            
            .building-icon {
                font-size: 3em;
            }
        }
    </style>
</head>
<body>
    <div class="weather-overlay sunny" id="weatherOverlay"></div>
    
    <div class="container">
        <div class="header">
            <h1>🎮 Document Generator World</h1>
            <div class="status-banner">
                <span id="statusMessage">☀️ All systems operational - Beautiful day in the digital world!</span>
            </div>
        </div>

        <div class="world-map">
            <h2 style="text-align: center; margin-bottom: 20px; color: #333;">
                🏝️ Welcome to Your Digital Island! Click any building to explore.
            </h2>
            
            <div class="buildings-grid" id="buildingsGrid">
                <!-- Buildings will be dynamically generated here -->
            </div>
            
            <!-- Floating particles for ambiance -->
            <div class="particle" style="top: 10%; left: 5%;">✨</div>
            <div class="particle" style="top: 20%; right: 10%;">🦋</div>
            <div class="particle" style="bottom: 15%; left: 15%;">🌸</div>
            <div class="particle" style="bottom: 25%; right: 20%;">🍃</div>
        </div>

        <div class="control-panel">
            <h3 style="text-align: center; margin-bottom: 20px;">🎮 Control Center</h3>
            <div class="control-buttons">
                <button class="control-button" onclick="checkAllServices()">
                    🔍 Check All Services
                </button>
                <button class="control-button" onclick="showTutorial()">
                    📚 Tutorial
                </button>
                <button class="control-button" onclick="exportReport()">
                    📊 Export Report
                </button>
                <button class="control-button" onclick="toggleMusic()">
                    🎵 Toggle Music
                </button>
                <button class="control-button" onclick="showSearch()">
                    🔎 Global Search
                </button>
            </div>
        </div>

        <div class="drop-zone" id="dropZone">
            <div class="drop-zone-icon">📁</div>
            <p>Drag & drop files here for processing</p>
            <small>The system will automatically route them to the right service!</small>
        </div>

        <div class="activity-log">
            <h3 style="margin-bottom: 15px;">✨ Activity Log</h3>
            <div id="activityLog">
                <!-- Activities will be dynamically added here -->
            </div>
        </div>
    </div>

    <!-- Hidden audio element for background music -->
    <audio id="backgroundMusic" loop>
        <source src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=" type="audio/wav">
    </audio>

    <script>
        // WebSocket connection
        let ws;
        let services = {};
        let musicEnabled = false;

        // Initialize WebSocket connection
        function initWebSocket() {
            ws = new WebSocket('ws://localhost:8000');
            
            ws.onopen = () => {
                console.log('🎮 Connected to game world!');
                addActivity('🌟 Welcome to Document Generator World!');
            };
            
            ws.onmessage = (event) => {
                const message = JSON.parse(event.data);
                handleServerMessage(message);
            };
            
            ws.onclose = () => {
                console.log('👋 Disconnected from game world');
                setTimeout(initWebSocket, 3000); // Reconnect after 3 seconds
            };
            
            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
        }

        // Handle messages from server
        function handleServerMessage(message) {
            switch (message.type) {
                case 'welcome':
                case 'system-update':
                    updateSystemState(message.data);
                    break;
                    
                case 'redirect':
                    window.open(message.url, '_blank');
                    break;
                    
                case 'file-routed':
                    showNotification(message.message, 'success');
                    break;
                    
                case 'health-update':
                    updateSystemState(message.data);
                    showNotification('Health check complete!', 'success');
                    break;
            }
        }

        // Update system state and UI
        function updateSystemState(data) {
            services = data.services || {};
            updateWeather(data.overall);
            updateBuildings();
            
            if (data.activities) {
                data.activities.forEach(activity => {
                    addActivityToLog(activity);
                });
            }
        }

        // Update weather overlay
        function updateWeather(weather) {
            const overlay = document.getElementById('weatherOverlay');
            overlay.className = \`weather-overlay \${weather}\`;
            
            const statusMessages = {
                'sunny': '☀️ All systems operational - Beautiful day in the digital world!',
                'partly-cloudy': '⛅ Some services need attention - Minor clouds on the horizon',
                'rainy': '🌧️ Multiple services offline - Time for some maintenance',
                'stormy': '⛈️ Critical issues detected - Storm warning in effect!'
            };
            
            document.getElementById('statusMessage').textContent = statusMessages[weather] || statusMessages['sunny'];
            
            // Play weather sound effect
            if (musicEnabled) {
                playWeatherSound(weather);
            }
        }

        // Update buildings display
        function updateBuildings() {
            const grid = document.getElementById('buildingsGrid');
            grid.innerHTML = '';
            
            Object.entries(services).forEach(([key, service]) => {
                const building = createBuildingElement(key, service);
                grid.appendChild(building);
            });
        }

        // Create building element
        function createBuildingElement(key, service) {
            const div = document.createElement('div');
            div.className = \`building \${service.status}\`;
            div.onclick = () => enterBuilding(key);
            
            div.innerHTML = \`
                <div class="building-icon">\${service.icon}</div>
                <div class="building-name">\${service.name}</div>
                <div class="building-description">\${service.description}</div>
                <div class="building-status">
                    \${service.status === 'online' ? '🟢 Open' : '🔴 Closed'}
                </div>
            \`;
            
            // Add hover effect
            div.onmouseenter = (e) => showTooltip(e, \`Click to enter \${service.name}\`);
            div.onmouseleave = hideTooltip;
            
            return div;
        }

        // Enter a building (open service)
        function enterBuilding(buildingKey) {
            const service = services[buildingKey];
            if (!service) return;
            
            if (service.status === 'offline') {
                if (confirm(\`\${service.name} is currently offline. Would you like to try fixing it?\`)) {
                    attemptFix(buildingKey);
                }
                return;
            }
            
            playSound('enter');
            showCelebration(service.icon);
            
            ws.send(JSON.stringify({
                type: 'enter-building',
                building: buildingKey
            }));
        }

        // Check all services
        function checkAllServices() {
            showNotification('🔍 Checking all services...', 'info');
            ws.send(JSON.stringify({ type: 'health-check' }));
        }

        // Attempt to fix a service
        function attemptFix(serviceKey) {
            showNotification(\`🔧 Attempting to fix \${services[serviceKey].name}...\`, 'info');
            ws.send(JSON.stringify({
                type: 'quick-fix',
                service: serviceKey
            }));
        }

        // Add activity to log
        function addActivity(message) {
            const activity = {
                message,
                timestamp: new Date().toISOString(),
                icon: '✨'
            };
            addActivityToLog(activity);
        }

        // Add activity to visual log
        function addActivityToLog(activity) {
            const log = document.getElementById('activityLog');
            const item = document.createElement('div');
            item.className = 'activity-item';
            
            const time = new Date(activity.timestamp).toLocaleTimeString();
            
            item.innerHTML = \`
                <span class="activity-icon">\${activity.icon}</span>
                <span class="activity-text">\${activity.message}</span>
                <span class="activity-time">\${time}</span>
            \`;
            
            log.insertBefore(item, log.firstChild);
            
            // Keep only last 50 items
            while (log.children.length > 50) {
                log.removeChild(log.lastChild);
            }
        }

        // Show tutorial
        function showTutorial() {
            const tutorial = \`
🎮 Welcome to Document Generator World!

This is your command center for all system operations. Here's how to play:

1. 🏢 Buildings = Services
   - Each building represents a different service
   - Green glow = Service is running
   - Red = Service is offline
   - Click to enter any building

2. 🌤️ Weather = System Health
   - Sunny = Everything is perfect!
   - Cloudy = Minor issues
   - Rainy = Some problems
   - Stormy = Critical issues

3. 🎯 Quick Actions
   - Drag & drop files for automatic processing
   - Click "Check All Services" for health report
   - Use "Export Report" to save system status

4. 🎵 Ambiance
   - Toggle background music for the full experience
   - Sound effects provide feedback

Need help? Just hover over anything for hints!
            \`;
            
            alert(tutorial);
        }

        // Export system report
        function exportReport() {
            const report = {
                timestamp: new Date().toISOString(),
                weather: document.querySelector('.weather-overlay').className.split(' ')[1],
                services: services,
                recentActivities: Array.from(document.querySelectorAll('.activity-item')).slice(0, 20).map(item => ({
                    message: item.querySelector('.activity-text').textContent,
                    time: item.querySelector('.activity-time').textContent
                }))
            };
            
            const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = \`system-report-\${Date.now()}.json\`;
            a.click();
            
            showNotification('📊 Report exported successfully!', 'success');
        }

        // Toggle background music
        function toggleMusic() {
            const audio = document.getElementById('backgroundMusic');
            musicEnabled = !musicEnabled;
            
            if (musicEnabled) {
                audio.play().catch(e => console.log('Audio play failed:', e));
                showNotification('🎵 Music enabled', 'success');
            } else {
                audio.pause();
                showNotification('🔇 Music disabled', 'info');
            }
        }

        // Show global search
        function showSearch() {
            const query = prompt('🔍 Search across all systems:');
            if (query) {
                showNotification(\`Searching for "\${query}"...\`, 'info');
                // In a real implementation, this would search across all services
                setTimeout(() => {
                    showNotification('Search complete! Found 3 results.', 'success');
                }, 1000);
            }
        }

        // Drag and drop handlers
        const dropZone = document.getElementById('dropZone');

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            
            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) {
                const file = files[0];
                ws.send(JSON.stringify({
                    type: 'drag-drop-file',
                    file: {
                        name: file.name,
                        size: file.size,
                        type: file.type
                    }
                }));
                
                showCelebration('📁');
                playSound('drop');
            }
        });

        // Show notification
        function showNotification(message, type = 'info') {
            const colors = {
                info: '#667eea',
                success: '#48bb78',
                warning: '#ed8936',
                error: '#f56565'
            };
            
            const notification = document.createElement('div');
            notification.style.cssText = \`
                position: fixed;
                top: 20px;
                right: 20px;
                background: \${colors[type]};
                color: white;
                padding: 15px 25px;
                border-radius: 10px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                z-index: 1000;
                animation: slideIn 0.3s ease;
            \`;
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }

        // Show celebration effect
        function showCelebration(emoji) {
            const celebration = document.createElement('div');
            celebration.className = 'celebration';
            celebration.textContent = emoji;
            document.body.appendChild(celebration);
            
            setTimeout(() => celebration.remove(), 1000);
        }

        // Play sound effect
        function playSound(type) {
            if (!musicEnabled) return;
            
            // In a real implementation, this would play actual sound files
            const audio = new Audio();
            audio.volume = 0.3;
            
            // Use Web Audio API to generate simple sounds
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            switch (type) {
                case 'enter':
                    oscillator.frequency.value = 523.25; // C5
                    break;
                case 'drop':
                    oscillator.frequency.value = 659.25; // E5
                    break;
                case 'success':
                    oscillator.frequency.value = 783.99; // G5
                    break;
            }
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        }

        // Play weather-appropriate background sound
        function playWeatherSound(weather) {
            // In a real implementation, this would play weather-appropriate sounds
            console.log(\`Playing \${weather} weather sounds\`);
        }

        // Tooltip functions
        let tooltip = null;

        function showTooltip(event, text) {
            if (!tooltip) {
                tooltip = document.createElement('div');
                tooltip.className = 'tooltip';
                document.body.appendChild(tooltip);
            }
            
            tooltip.textContent = text;
            tooltip.style.left = event.pageX + 10 + 'px';
            tooltip.style.top = event.pageY - 30 + 'px';
            tooltip.classList.add('show');
        }

        function hideTooltip() {
            if (tooltip) {
                tooltip.classList.remove('show');
            }
        }

        // Initialize on load
        document.addEventListener('DOMContentLoaded', () => {
            initWebSocket();
            
            // Add some initial activities
            setTimeout(() => {
                addActivity('🏗️ Building the digital world...');
            }, 1000);
            
            setTimeout(() => {
                addActivity('🌱 Services coming online...');
            }, 2000);
            
            // Check services every 30 seconds
            setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'health-check' }));
                }
            }, 30000);
        });

        // Add keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'h':
                        e.preventDefault();
                        checkAllServices();
                        break;
                    case 'm':
                        e.preventDefault();
                        toggleMusic();
                        break;
                    case '/':
                        e.preventDefault();
                        showSearch();
                        break;
                }
            }
        });
    </script>
</body>
</html>
  `);
});

// API endpoints
app.get('/api/services', (req, res) => {
  res.json(systemHealth.services);
});

app.get('/api/health', (req, res) => {
  res.json({
    status: systemHealth.overall,
    services: systemHealth.services,
    uptime: process.uptime()
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start periodic health checks
setInterval(checkServiceHealth, 10000); // Check every 10 seconds

// Initial health check
checkServiceHealth();

// Start server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`
🎮 Document Generator World is now online!
🌐 Visit http://localhost:${PORT} to enter the game world
🏝️ Your digital island awaits...

Quick tips:
- Buildings glow green when services are running
- Weather changes based on system health
- Drag & drop files for automatic processing
- Press Ctrl+H for health check
- Press Ctrl+M to toggle music
- Press Ctrl+/ for global search

Have fun exploring! 🚀
  `);
});