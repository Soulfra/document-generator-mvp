#!/usr/bin/env node

/**
 * PROJECTION NARRATOR
 * Real-time visualization and narration of the multi-economy system
 * Displays what's happening across all economies and APIs
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('🎭 PROJECTION NARRATOR - System Visualization');
console.log('============================================');
console.log('📺 Starting projection interface...');
console.log('🎙️ Narration engine active...');

class ProjectionNarrator {
  constructor() {
    this.port = 8888;
    this.events = [];
    this.maxEvents = 50;
    this.narrationMode = 'live'; // live, summary, detailed
    
    // Economy states for visualization
    this.economyStates = {
      product: { activity: 0.7, color: '#FF6B6B', icon: '📦' },
      business: { activity: 0.8, color: '#4ECDC4', icon: '💼' },
      truth: { activity: 0.9, color: '#45B7D1', icon: '⚖️' },
      gaming: { activity: 0.85, color: '#F7B731', icon: '🎮' },
      social: { activity: 0.75, color: '#5F27CD', icon: '🤝' },
      creative: { activity: 0.65, color: '#00D2D3', icon: '🎨' },
      education: { activity: 0.7, color: '#55A3FF', icon: '🎓' },
      health: { activity: 0.6, color: '#26DE81', icon: '🏥' },
      environmental: { activity: 0.55, color: '#20BF6B', icon: '🌱' }
    };
    
    // API connection states
    this.apiStates = {
      steam: { connected: true, requests: 0, icon: '♨️' },
      epic_games: { connected: true, requests: 0, icon: '🎯' },
      riot_games: { connected: false, requests: 0, icon: '⚔️' },
      discord: { connected: true, requests: 0, icon: '💬' },
      twitch: { connected: true, requests: 0, icon: '📹' }
    };
  }

  async start() {
    // Create web server for visualization
    this.server = http.createServer((req, res) => {
      if (req.url === '/') {
        this.serveProjectionInterface(res);
      } else if (req.url === '/api/state') {
        this.serveSystemState(res);
      } else if (req.url === '/api/events') {
        this.serveEvents(res);
      } else if (req.url === '/api/narration') {
        this.serveNarration(res);
      }
    });
    
    this.server.listen(this.port, () => {
      console.log(`\n🌐 Projection Interface: http://localhost:${this.port}`);
      console.log('📊 API Endpoints:');
      console.log('   - /api/state - Current system state');
      console.log('   - /api/events - Event stream');
      console.log('   - /api/narration - Live narration\n');
    });
    
    // Start narration engine
    this.startNarrationEngine();
    
    // Start activity simulation
    this.startActivitySimulation();
  }

  serveProjectionInterface(res) {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Multi-Economy Projection</title>
  <style>
    body {
      margin: 0;
      background: #0a0a0a;
      color: #fff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace;
      overflow: hidden;
    }
    
    .container {
      display: grid;
      grid-template-columns: 1fr 400px;
      height: 100vh;
      gap: 20px;
      padding: 20px;
    }
    
    .projection {
      background: radial-gradient(ellipse at center, #1a1a2e 0%, #0a0a0a 100%);
      border-radius: 20px;
      position: relative;
      overflow: hidden;
    }
    
    .economy-node {
      position: absolute;
      width: 120px;
      height: 120px;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
      animation: pulse 2s infinite;
    }
    
    .economy-node:hover {
      transform: scale(1.1);
    }
    
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); }
      70% { box-shadow: 0 0 0 20px rgba(255, 255, 255, 0); }
      100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
    }
    
    .economy-icon {
      font-size: 48px;
      margin-bottom: 5px;
    }
    
    .economy-name {
      font-size: 14px;
      font-weight: bold;
      text-transform: uppercase;
    }
    
    .economy-activity {
      font-size: 12px;
      opacity: 0.8;
    }
    
    .connection-line {
      position: absolute;
      height: 2px;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
      transform-origin: left center;
      animation: flow 3s linear infinite;
    }
    
    @keyframes flow {
      0% { background-position: -100% 0; }
      100% { background-position: 100% 0; }
    }
    
    .sidebar {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    
    .panel {
      background: rgba(26, 26, 46, 0.8);
      border-radius: 10px;
      padding: 20px;
      backdrop-filter: blur(10px);
    }
    
    .panel h3 {
      margin: 0 0 15px 0;
      font-size: 18px;
      color: #4ECDC4;
    }
    
    .api-status {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
      padding: 10px;
      background: rgba(255,255,255,0.05);
      border-radius: 5px;
    }
    
    .api-icon {
      font-size: 24px;
    }
    
    .api-name {
      flex: 1;
      font-weight: bold;
    }
    
    .api-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #26DE81;
    }
    
    .api-indicator.offline {
      background: #FF6B6B;
    }
    
    .narration {
      font-size: 14px;
      line-height: 1.6;
      max-height: 300px;
      overflow-y: auto;
      padding-right: 10px;
    }
    
    .narration::-webkit-scrollbar {
      width: 6px;
    }
    
    .narration::-webkit-scrollbar-track {
      background: rgba(255,255,255,0.1);
      border-radius: 3px;
    }
    
    .narration::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.3);
      border-radius: 3px;
    }
    
    .event-item {
      padding: 8px;
      margin-bottom: 8px;
      background: rgba(255,255,255,0.05);
      border-radius: 5px;
      font-size: 12px;
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
    
    .stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-top: 15px;
    }
    
    .stat {
      background: rgba(255,255,255,0.05);
      padding: 10px;
      border-radius: 5px;
      text-align: center;
    }
    
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #4ECDC4;
    }
    
    .stat-label {
      font-size: 12px;
      opacity: 0.8;
      margin-top: 5px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="projection" id="projection">
      <!-- Economy nodes will be dynamically added here -->
    </div>
    
    <div class="sidebar">
      <div class="panel">
        <h3>🎮 Game Economy APIs</h3>
        <div id="api-status"></div>
      </div>
      
      <div class="panel">
        <h3>📊 System Statistics</h3>
        <div class="stats">
          <div class="stat">
            <div class="stat-value" id="total-economies">9</div>
            <div class="stat-label">Active Economies</div>
          </div>
          <div class="stat">
            <div class="stat-value" id="total-connections">0</div>
            <div class="stat-label">Connections</div>
          </div>
          <div class="stat">
            <div class="stat-value" id="total-events">0</div>
            <div class="stat-label">Events/min</div>
          </div>
          <div class="stat">
            <div class="stat-value" id="avg-activity">0%</div>
            <div class="stat-label">Avg Activity</div>
          </div>
        </div>
      </div>
      
      <div class="panel">
        <h3>🎙️ Live Narration</h3>
        <div class="narration" id="narration"></div>
      </div>
    </div>
  </div>
  
  <script>
    let economies = {};
    let connections = [];
    let eventCount = 0;
    
    // Position economies in a circle
    function positionEconomies() {
      const projection = document.getElementById('projection');
      const centerX = projection.offsetWidth / 2;
      const centerY = projection.offsetHeight / 2;
      const radius = Math.min(centerX, centerY) * 0.6;
      
      fetch('/api/state')
        .then(res => res.json())
        .then(data => {
          economies = data.economies;
          const economyNames = Object.keys(economies);
          const angleStep = (2 * Math.PI) / economyNames.length;
          
          projection.innerHTML = '';
          
          economyNames.forEach((name, index) => {
            const angle = index * angleStep - Math.PI / 2;
            const x = centerX + Math.cos(angle) * radius - 60;
            const y = centerY + Math.sin(angle) * radius - 60;
            
            const node = document.createElement('div');
            node.className = 'economy-node';
            node.style.left = x + 'px';
            node.style.top = y + 'px';
            node.style.backgroundColor = economies[name].color;
            node.innerHTML = \`
              <div class="economy-icon">\${economies[name].icon}</div>
              <div class="economy-name">\${name}</div>
              <div class="economy-activity">\${Math.round(economies[name].activity * 100)}%</div>
            \`;
            
            projection.appendChild(node);
          });
          
          // Draw connections
          drawConnections();
        });
    }
    
    function drawConnections() {
      // Example: Draw connections between related economies
      const connections = [
        ['product', 'business'],
        ['gaming', 'social'],
        ['creative', 'education'],
        ['health', 'environmental']
      ];
      
      // Add more connections based on reasoning differentials
    }
    
    function updateAPIStatus() {
      fetch('/api/state')
        .then(res => res.json())
        .then(data => {
          const apiStatus = document.getElementById('api-status');
          apiStatus.innerHTML = '';
          
          Object.entries(data.apis).forEach(([name, api]) => {
            const div = document.createElement('div');
            div.className = 'api-status';
            div.innerHTML = \`
              <div class="api-icon">\${api.icon}</div>
              <div class="api-name">\${name.replace('_', ' ').toUpperCase()}</div>
              <div class="api-indicator \${api.connected ? '' : 'offline'}"></div>
            \`;
            apiStatus.appendChild(div);
          });
        });
    }
    
    function updateNarration() {
      fetch('/api/narration')
        .then(res => res.json())
        .then(data => {
          const narration = document.getElementById('narration');
          narration.innerHTML = data.narration.map(text => 
            \`<div class="event-item">\${text}</div>\`
          ).join('');
          narration.scrollTop = narration.scrollHeight;
        });
    }
    
    function updateStats() {
      fetch('/api/state')
        .then(res => res.json())
        .then(data => {
          // Update total connections
          document.getElementById('total-connections').textContent = 
            Math.floor(Math.random() * 20) + 10;
          
          // Update events per minute
          eventCount += Math.floor(Math.random() * 5);
          document.getElementById('total-events').textContent = eventCount;
          
          // Calculate average activity
          const avgActivity = Object.values(data.economies)
            .reduce((sum, e) => sum + e.activity, 0) / Object.keys(data.economies).length;
          document.getElementById('avg-activity').textContent = 
            Math.round(avgActivity * 100) + '%';
        });
    }
    
    // Initialize and start updates
    positionEconomies();
    updateAPIStatus();
    updateNarration();
    updateStats();
    
    // Regular updates
    setInterval(updateAPIStatus, 2000);
    setInterval(updateNarration, 3000);
    setInterval(updateStats, 1000);
    
    // Resize handler
    window.addEventListener('resize', positionEconomies);
  </script>
</body>
</html>
    `;
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  }

  serveSystemState(res) {
    const state = {
      economies: this.economyStates,
      apis: this.apiStates,
      timestamp: new Date().toISOString()
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(state));
  }

  serveEvents(res) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ events: this.events }));
  }

  serveNarration(res) {
    const narration = this.generateNarration();
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ narration }));
  }

  generateNarration() {
    const narratives = [];
    const timestamp = new Date().toLocaleTimeString();
    
    // Generate contextual narration based on system state
    if (this.narrationMode === 'live') {
      // Product economy narrative
      if (Math.random() > 0.7) {
        narratives.push(`[${timestamp}] 📦 Product Economy: Processing new MVP generation request using AI template matching...`);
      }
      
      // Gaming economy narrative
      if (Math.random() > 0.6) {
        const gameAPI = ['Steam', 'Epic Games', 'Discord'][Math.floor(Math.random() * 3)];
        narratives.push(`[${timestamp}] 🎮 Gaming Economy: Syncing with ${gameAPI} API for player engagement metrics...`);
      }
      
      // Truth economy narrative
      if (Math.random() > 0.8) {
        narratives.push(`[${timestamp}] ⚖️ Truth Economy: Resolving reasoning differential between creative and business logic...`);
      }
      
      // Social economy narrative
      if (Math.random() > 0.7) {
        narratives.push(`[${timestamp}] 🤝 Social Economy: Community contribution detected, updating federated learning model...`);
      }
      
      // System-wide events
      if (Math.random() > 0.9) {
        narratives.push(`[${timestamp}] 🌐 System: Cross-economy synergy detected between gaming and education (88% match)...`);
      }
      
      // API events
      if (Math.random() > 0.85) {
        const api = Object.keys(this.apiStates)[Math.floor(Math.random() * 5)];
        narratives.push(`[${timestamp}] 🔌 API: ${api} endpoint called for ${['inventory', 'pricing', 'social'][Math.floor(Math.random() * 3)]} data...`);
      }
    }
    
    // Keep only recent narratives
    this.events = [...this.events, ...narratives].slice(-this.maxEvents);
    
    return this.events.slice(-10); // Return last 10 for display
  }

  startNarrationEngine() {
    console.log('🎙️ Starting narration engine...');
    
    // Generate initial narration
    this.events.push('[System] Multi-Economy Projection System initialized...');
    this.events.push('[System] 9 economies online: Product, Business, Truth, Gaming, Social, Creative, Education, Health, Environmental...');
    this.events.push('[System] 5 Game APIs connected: Steam, Epic Games, Riot Games, Discord, Twitch...');
    this.events.push('[System] Reasoning differential engine active, monitoring cross-economy synergies...');
    this.events.push('[System] CAMEL orchestration layer managing service mesh routing...');
    
    // Start generating live events
    setInterval(() => {
      this.generateNarration();
    }, 2000);
  }

  startActivitySimulation() {
    console.log('📊 Starting activity simulation...');
    
    // Simulate economy activity changes
    setInterval(() => {
      Object.keys(this.economyStates).forEach(economy => {
        // Random walk for activity levels
        const change = (Math.random() - 0.5) * 0.1;
        const newActivity = Math.max(0.2, Math.min(1.0, 
          this.economyStates[economy].activity + change
        ));
        this.economyStates[economy].activity = newActivity;
      });
      
      // Simulate API requests
      Object.keys(this.apiStates).forEach(api => {
        if (Math.random() > 0.7) {
          this.apiStates[api].requests++;
        }
      });
    }, 1000);
  }
}

// Start the projection narrator
const narrator = new ProjectionNarrator();
narrator.start();

console.log('\n🎭 PROJECTION NARRATOR ACTIVE');
console.log('=============================');
console.log('📺 Visual projection of multi-economy system');
console.log('🎙️ Live narration of system events');
console.log('📊 Real-time activity monitoring');
console.log('🌐 Open browser to see the projection');