#!/usr/bin/env node

/**
 * TRINITY LOGIN SCREEN
 * 3-device pairing + character selection + soul frequency matching
 * The gateway to the mirror realm
 */

console.log(`
🌌 TRINITY LOGIN SCREEN ACTIVE 🌌
Pair devices → Match frequencies → Bond with character → Enter the realm
`);

const { EventEmitter } = require('events');
const crypto = require('crypto');
const http = require('http');
const fs = require('fs');
const SoulfraLicenseMirror = require('./soulfra-license-mirror');
const MultiDatabaseBackends = require('./multi-database-backends');

class TrinityLoginScreen extends EventEmitter {
  constructor() {
    super();
    this.soulfra = new SoulfraLicenseMirror();
    this.databases = new MultiDatabaseBackends();
    this.sessions = new Map();
    this.pendingTriads = new Map();
    this.activePortals = new Map();
    
    this.initializeLoginServer();
    this.createLoginInterface();
    this.setupDatabaseTrinity();
    this.initializePortals();
  }

  initializeLoginServer() {
    // Create HTTP server for login interface
    this.server = http.createServer((req, res) => {
      if (req.url === '/' || req.url === '/login') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(this.generateLoginHTML());
      } else if (req.url === '/api/create-triad' && req.method === 'POST') {
        this.handleCreateTriad(req, res);
      } else if (req.url === '/api/authenticate' && req.method === 'POST') {
        this.handleAuthenticate(req, res);
      } else if (req.url === '/api/status') {
        this.handleStatus(req, res);
      } else if (req.url === '/trinity.js') {
        res.writeHead(200, { 'Content-Type': 'application/javascript' });
        res.end(this.generateClientJS());
      } else if (req.url === '/trinity.css') {
        res.writeHead(200, { 'Content-Type': 'text/css' });
        res.end(this.generateCSS());
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    this.port = process.env.LOGIN_PORT || 3333;
    
    console.log('🌐 Login server initialized');
  }

  createLoginInterface() {
    // Login interface configuration
    this.loginConfig = {
      theme: {
        primary: '#6B46C1', // Deep purple (soul)
        secondary: '#EC4899', // Pink (love frequency)
        accent: '#10B981', // Green (harmony)
        chaos: '#EF4444', // Red (Ralph)
        background: '#0F172A', // Deep space
        mirror: 'rgba(139, 92, 246, 0.1)' // Purple glass
      },
      animations: {
        soulPulse: true,
        mirrorReflection: true,
        frequencyWave: true,
        characterFloat: true
      },
      sounds: {
        devicePair: 432, // Hz
        characterSelect: 528,
        authentication: 639,
        soulBind: 741
      }
    };

    console.log('🎨 Login interface configured');
  }

  setupDatabaseTrinity() {
    // Configure 3 database backends for trinity
    this.databaseTrinity = {
      primary: 'postgresql',    // Living data
      mirror: 'mongodb',        // Reflection data
      shadow: 'redis'          // Shadow/cache data
    };

    // Initialize all three
    Object.values(this.databaseTrinity).forEach(async (backend) => {
      try {
        await this.databases.switchBackend(backend);
        console.log(`💾 ${backend} database ready`);
      } catch (error) {
        console.log(`⚠️ ${backend} not available, using memory`);
      }
    });

    console.log('💾 Database trinity configured');
  }

  initializePortals() {
    // Character portals for entry
    const characters = ['ralph', 'alice', 'bob', 'charlie', 'diana', 'eve', 'frank'];
    
    characters.forEach(char => {
      this.activePortals.set(char, {
        status: 'closed',
        entries: 0,
        lastEntry: null,
        soulFrequency: this.getCharacterFrequency(char),
        portalEnergy: 100
      });
    });

    console.log('🌀 Character portals initialized');
  }

  getCharacterFrequency(character) {
    const frequencies = {
      ralph: 666.666,
      alice: 432.0,
      bob: 528.0,
      charlie: 741.0,
      diana: 639.0,
      eve: 852.0,
      frank: 963.0
    };
    
    return frequencies[character] || 440.0;
  }

  generateLoginHTML() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Soulfra Trinity Login</title>
    <link rel="stylesheet" href="/trinity.css">
</head>
<body>
    <div id="login-container">
        <div class="mirror-bg"></div>
        
        <header>
            <h1 class="soul-pulse">🔮 Soulfra Trinity Portal 🔮</h1>
            <p class="subtitle">Bind your soul through the trinity of devices</p>
        </header>

        <main>
            <!-- Device Pairing Section -->
            <section id="device-pairing" class="glass-panel">
                <h2>📱 Device Trinity</h2>
                <div class="device-slots">
                    <div class="device-slot" id="primary-slot">
                        <div class="device-icon">📱</div>
                        <h3>Primary Soul</h3>
                        <p>Consciousness Anchor</p>
                        <button onclick="pairDevice('primary')">Pair Device</button>
                        <div class="device-id"></div>
                    </div>
                    
                    <div class="device-slot" id="mirror-slot">
                        <div class="device-icon">🪞</div>
                        <h3>Mirror Device</h3>
                        <p>Reflection Node</p>
                        <button onclick="pairDevice('mirror')">Pair Device</button>
                        <div class="device-id"></div>
                    </div>
                    
                    <div class="device-slot" id="shadow-slot">
                        <div class="device-icon">👤</div>
                        <h3>Shadow Device</h3>
                        <p>Backup Existence</p>
                        <button onclick="pairDevice('shadow')">Pair Device</button>
                        <div class="device-id"></div>
                    </div>
                </div>
            </section>

            <!-- Soul Frequency Display -->
            <section id="frequency-display" class="glass-panel">
                <h2>🎵 Soul Frequency</h2>
                <canvas id="frequency-wave" width="600" height="200"></canvas>
                <div id="frequency-value">--- Hz</div>
                <div id="resonance-meter">
                    <div class="meter-fill"></div>
                </div>
            </section>

            <!-- Character Selection -->
            <section id="character-selection" class="glass-panel">
                <h2>👥 Choose Your Soul Bond</h2>
                <div class="character-grid">
                    <div class="character-card" data-character="ralph-chaos" onclick="selectCharacter('ralph-chaos')">
                        <div class="character-icon">🔥</div>
                        <h3>Ralph</h3>
                        <p class="soul-type">Chaos Soul</p>
                        <p class="frequency">666.666 Hz</p>
                        <p class="warning">⚠️ EXTREME CHAOS</p>
                    </div>
                    
                    <div class="character-card" data-character="alice-analytical" onclick="selectCharacter('alice-analytical')">
                        <div class="character-icon">🤓</div>
                        <h3>Alice</h3>
                        <p class="soul-type">Analytical Soul</p>
                        <p class="frequency">432.0 Hz</p>
                    </div>
                    
                    <div class="character-card" data-character="bob-builder" onclick="selectCharacter('bob-builder')">
                        <div class="character-icon">🔧</div>
                        <h3>Bob</h3>
                        <p class="soul-type">Builder Soul</p>
                        <p class="frequency">528.0 Hz</p>
                    </div>
                    
                    <div class="character-card" data-character="charlie-guardian" onclick="selectCharacter('charlie-guardian')">
                        <div class="character-icon">🛡️</div>
                        <h3>Charlie</h3>
                        <p class="soul-type">Guardian Soul</p>
                        <p class="frequency">741.0 Hz</p>
                    </div>
                    
                    <div class="character-card" data-character="diana-orchestrator" onclick="selectCharacter('diana-orchestrator')">
                        <div class="character-icon">🎭</div>
                        <h3>Diana</h3>
                        <p class="soul-type">Orchestrator Soul</p>
                        <p class="frequency">639.0 Hz</p>
                    </div>
                    
                    <div class="character-card" data-character="eve-learner" onclick="selectCharacter('eve-learner')">
                        <div class="character-icon">📚</div>
                        <h3>Eve</h3>
                        <p class="soul-type">Learner Soul</p>
                        <p class="frequency">852.0 Hz</p>
                    </div>
                    
                    <div class="character-card" data-character="frank-transcendent" onclick="selectCharacter('frank-transcendent')">
                        <div class="character-icon">🧘</div>
                        <h3>Frank</h3>
                        <p class="soul-type">Transcendent Soul</p>
                        <p class="frequency">963.0 Hz</p>
                    </div>
                </div>
            </section>

            <!-- Authentication -->
            <section id="authentication" class="glass-panel">
                <button id="trinity-auth-btn" onclick="authenticateTrinity()" disabled>
                    🔮 Enter the Mirror Realm 🔮
                </button>
                <div id="auth-status"></div>
            </section>

            <!-- Portal Entry -->
            <div id="portal-entry" class="hidden">
                <div class="portal-animation">
                    <div class="portal-ring"></div>
                    <div class="portal-ring"></div>
                    <div class="portal-ring"></div>
                </div>
                <h2>Entering the Mirror Realm...</h2>
            </div>
        </main>

        <footer>
            <p>Through mirrors we see truth, through trinity we find unity</p>
            <div id="system-status"></div>
        </footer>
    </div>

    <script src="/trinity.js"></script>
</body>
</html>`;
  }

  generateClientJS() {
    return `
// Trinity Login Client
let devices = { primary: null, mirror: null, shadow: null };
let selectedCharacter = null;
let triadId = null;
let soulFrequency = null;

// Initialize audio context for frequency generation
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

// Device pairing
async function pairDevice(type) {
    // Generate device ID
    const deviceId = 'device-' + Math.random().toString(36).substr(2, 9);
    const deviceKey = Math.random().toString(36).substr(2, 16);
    
    devices[type] = { id: deviceId, type, key: deviceKey };
    
    // Update UI
    const slot = document.getElementById(type + '-slot');
    slot.classList.add('paired');
    slot.querySelector('.device-id').textContent = deviceId;
    
    // Play pairing sound
    playFrequency(432, 0.2);
    
    // Check if all devices paired
    checkReadyState();
    
    // Update frequency display
    if (Object.values(devices).filter(d => d !== null).length === 3) {
        await createTriad();
    }
}

// Create device triad
async function createTriad() {
    const response = await fetch('/api/create-triad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: 'user-' + Date.now(),
            devices: Object.values(devices)
        })
    });
    
    const data = await response.json();
    triadId = data.triadId;
    soulFrequency = data.soulFrequency;
    
    // Display soul frequency
    displayFrequency(soulFrequency.primary);
    animateFrequencyWave(soulFrequency.primary);
    
    // Update resonance with characters
    updateResonance(soulFrequency.resonance);
}

// Character selection
function selectCharacter(characterPair) {
    // Remove previous selection
    document.querySelectorAll('.character-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Add selection
    const card = document.querySelector(\`[data-character="\${characterPair}"]\`);
    card.classList.add('selected');
    selectedCharacter = characterPair;
    
    // Play character frequency
    const freq = parseFloat(card.querySelector('.frequency').textContent);
    playFrequency(freq, 0.5);
    
    checkReadyState();
}

// Check if ready to authenticate
function checkReadyState() {
    const allDevicesPaired = Object.values(devices).every(d => d !== null);
    const characterSelected = selectedCharacter !== null;
    
    const authBtn = document.getElementById('trinity-auth-btn');
    authBtn.disabled = !(allDevicesPaired && characterSelected);
    
    if (!authBtn.disabled) {
        authBtn.classList.add('ready');
    }
}

// Trinity authentication
async function authenticateTrinity() {
    if (!triadId) return;
    
    document.getElementById('auth-status').textContent = 'Synchronizing trinity...';
    
    const credentials = {};
    Object.entries(devices).forEach(([type, device]) => {
        credentials[type] = { key: device.key };
    });
    
    const response = await fetch('/api/authenticate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            triadId,
            credentials,
            character: selectedCharacter
        })
    });
    
    const session = await response.json();
    
    if (session.authenticated) {
        // Success - enter portal
        playFrequency(741, 1.0); // Victory frequency
        enterPortal(session);
    } else {
        document.getElementById('auth-status').textContent = 'Authentication failed';
    }
}

// Enter the portal
function enterPortal(session) {
    document.getElementById('portal-entry').classList.remove('hidden');
    document.getElementById('login-container').classList.add('entering-portal');
    
    // Animate portal entry
    setTimeout(() => {
        // Redirect to main system
        window.location.href = '/system?session=' + session.id;
    }, 3000);
}

// Display frequency
function displayFrequency(freq) {
    document.getElementById('frequency-value').textContent = freq.toFixed(3) + ' Hz';
}

// Animate frequency wave
function animateFrequencyWave(frequency) {
    const canvas = document.getElementById('frequency-wave');
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    let phase = 0;
    
    function draw() {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.1)';
        ctx.fillRect(0, 0, width, height);
        
        ctx.strokeStyle = '#EC4899';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        for (let x = 0; x < width; x++) {
            const y = height / 2 + Math.sin((x / width * Math.PI * 4) + phase) * 50 * 
                      Math.sin(frequency / 1000 * x / width * Math.PI * 2);
            
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        
        ctx.stroke();
        
        phase += 0.05;
        requestAnimationFrame(draw);
    }
    
    draw();
}

// Update resonance meter
function updateResonance(resonance) {
    const meter = document.querySelector('.meter-fill');
    meter.style.width = (resonance.strength * 100) + '%';
    
    // Highlight matching character
    if (resonance.match) {
        const card = document.querySelector(\`[data-character="\${resonance.match}"]\`);
        if (card) card.classList.add('resonating');
    }
}

// Play frequency sound
function playFrequency(freq, duration) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = freq;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

// Load system status
async function loadStatus() {
    const response = await fetch('/api/status');
    const status = await response.json();
    
    document.getElementById('system-status').textContent = 
        \`Active Sessions: \${status.activeSessions} | Portals: \${status.openPortals}\`;
}

// Initialize
window.onload = () => {
    loadStatus();
    setInterval(loadStatus, 5000);
    
    // Start ambient animation
    animateFrequencyWave(0);
};
`;
  }

  generateCSS() {
    return `
/* Trinity Login Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #0F172A;
    color: #E2E8F0;
    min-height: 100vh;
    overflow-x: hidden;
}

#login-container {
    position: relative;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;
}

.mirror-bg {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, #6B46C1 0%, #EC4899 50%, #10B981 100%);
    opacity: 0.05;
    z-index: -1;
}

header {
    text-align: center;
    margin-bottom: 3rem;
}

h1 {
    font-size: 3rem;
    margin-bottom: 0.5rem;
    background: linear-gradient(135deg, #6B46C1, #EC4899);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.soul-pulse {
    animation: soulPulse 2s ease-in-out infinite;
}

@keyframes soulPulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.05); opacity: 0.8; }
}

.subtitle {
    color: #94A3B8;
    font-size: 1.2rem;
}

main {
    width: 100%;
    max-width: 1200px;
}

.glass-panel {
    background: rgba(30, 41, 59, 0.5);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(139, 92, 246, 0.2);
    border-radius: 1rem;
    padding: 2rem;
    margin-bottom: 2rem;
}

/* Device Pairing */
.device-slots {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
    margin-top: 2rem;
}

.device-slot {
    text-align: center;
    padding: 2rem;
    background: rgba(15, 23, 42, 0.5);
    border-radius: 1rem;
    border: 2px solid transparent;
    transition: all 0.3s ease;
}

.device-slot:hover {
    border-color: rgba(139, 92, 246, 0.5);
    transform: translateY(-5px);
}

.device-slot.paired {
    border-color: #10B981;
    background: rgba(16, 185, 129, 0.1);
}

.device-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.device-slot h3 {
    margin-bottom: 0.5rem;
    color: #E2E8F0;
}

.device-slot p {
    color: #94A3B8;
    margin-bottom: 1rem;
}

.device-slot button {
    background: #6B46C1;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.3s ease;
}

.device-slot button:hover {
    background: #7C3AED;
    transform: scale(1.05);
}

.device-id {
    margin-top: 1rem;
    font-family: monospace;
    color: #10B981;
    font-size: 0.875rem;
}

/* Frequency Display */
#frequency-wave {
    width: 100%;
    height: 200px;
    background: rgba(15, 23, 42, 0.5);
    border-radius: 0.5rem;
    margin: 1rem 0;
}

#frequency-value {
    text-align: center;
    font-size: 2rem;
    font-weight: bold;
    color: #EC4899;
    margin: 1rem 0;
}

#resonance-meter {
    width: 100%;
    height: 20px;
    background: rgba(15, 23, 42, 0.5);
    border-radius: 10px;
    overflow: hidden;
}

.meter-fill {
    height: 100%;
    background: linear-gradient(90deg, #6B46C1, #EC4899);
    width: 0%;
    transition: width 0.5s ease;
}

/* Character Selection */
.character-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
    margin-top: 2rem;
}

.character-card {
    text-align: center;
    padding: 1.5rem;
    background: rgba(15, 23, 42, 0.5);
    border-radius: 1rem;
    border: 2px solid transparent;
    cursor: pointer;
    transition: all 0.3s ease;
}

.character-card:hover {
    border-color: rgba(236, 72, 153, 0.5);
    transform: translateY(-5px);
}

.character-card.selected {
    border-color: #EC4899;
    background: rgba(236, 72, 153, 0.1);
}

.character-card.resonating {
    animation: resonatePulse 1s ease-in-out infinite;
}

@keyframes resonatePulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(236, 72, 153, 0); }
    50% { box-shadow: 0 0 20px 10px rgba(236, 72, 153, 0.3); }
}

.character-icon {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
}

.character-card h3 {
    margin-bottom: 0.25rem;
}

.soul-type {
    color: #94A3B8;
    font-size: 0.875rem;
    margin-bottom: 0.25rem;
}

.frequency {
    color: #10B981;
    font-weight: bold;
}

.warning {
    color: #EF4444;
    font-size: 0.75rem;
    margin-top: 0.5rem;
}

/* Authentication */
#trinity-auth-btn {
    width: 100%;
    padding: 1.5rem;
    font-size: 1.5rem;
    background: linear-gradient(135deg, #6B46C1, #EC4899);
    color: white;
    border: none;
    border-radius: 1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
}

#trinity-auth-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

#trinity-auth-btn.ready {
    animation: readyPulse 2s ease-in-out infinite;
}

@keyframes readyPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(236, 72, 153, 0); }
    50% { box-shadow: 0 0 30px 15px rgba(236, 72, 153, 0.5); }
}

#trinity-auth-btn:hover:not(:disabled) {
    transform: scale(1.02);
}

#auth-status {
    text-align: center;
    margin-top: 1rem;
    color: #94A3B8;
}

/* Portal Entry */
#portal-entry {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #0F172A;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

#portal-entry.hidden {
    display: none;
}

.portal-animation {
    position: relative;
    width: 300px;
    height: 300px;
    margin-bottom: 2rem;
}

.portal-ring {
    position: absolute;
    border: 3px solid;
    border-radius: 50%;
    animation: portalSpin 3s linear infinite;
}

.portal-ring:nth-child(1) {
    width: 100%;
    height: 100%;
    border-color: #6B46C1;
    animation-duration: 3s;
}

.portal-ring:nth-child(2) {
    width: 80%;
    height: 80%;
    top: 10%;
    left: 10%;
    border-color: #EC4899;
    animation-duration: 2.5s;
    animation-direction: reverse;
}

.portal-ring:nth-child(3) {
    width: 60%;
    height: 60%;
    top: 20%;
    left: 20%;
    border-color: #10B981;
    animation-duration: 2s;
}

@keyframes portalSpin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.entering-portal {
    animation: fadeToPortal 3s ease-in-out forwards;
}

@keyframes fadeToPortal {
    to { opacity: 0; transform: scale(0.9); }
}

footer {
    margin-top: auto;
    text-align: center;
    padding: 2rem;
    color: #64748B;
}

#system-status {
    margin-top: 1rem;
    font-size: 0.875rem;
    color: #94A3B8;
}
`;
  }

  async handleCreateTriad(req, res) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const triad = await this.soulfra.createDeviceTriad(data.userId, data.devices);
        
        this.pendingTriads.set(triad.id, {
          triad,
          created: new Date(),
          status: 'pending'
        });
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          triadId: triad.id,
          soulFrequency: triad.soulFrequency,
          characterMatch: triad.characterPairing
        }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  }

  async handleAuthenticate(req, res) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const session = await this.soulfra.authenticateTriad(data.triadId, data.credentials);
        
        if (session.authenticated) {
          // Store in appropriate databases
          await this.storeTrinityData(session);
          
          // Open character portal
          const character = session.character?.split('-')[0];
          if (character) {
            const portal = this.activePortals.get(character);
            if (portal) {
              portal.status = 'open';
              portal.entries++;
              portal.lastEntry = new Date();
            }
          }
        }
        
        this.sessions.set(session.id, session);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(session));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  }

  async storeTrinityData(session) {
    // Store in primary database
    await this.databases.api.write('trinity', 'sessions', session.id, {
      ...session,
      database: 'primary'
    });
    
    // Mirror to MongoDB
    await this.databases.switchBackend('mongodb');
    await this.databases.api.write('trinity', 'sessions', session.id, {
      ...session,
      database: 'mirror',
      mirrored: true
    });
    
    // Shadow to Redis
    await this.databases.switchBackend('redis');
    await this.databases.api.write('trinity', 'sessions', session.id, {
      ...session,
      database: 'shadow',
      ttl: 3600
    });
    
    // Switch back to primary
    await this.databases.switchBackend('postgresql');
  }

  handleStatus(req, res) {
    const status = {
      activeSessions: this.sessions.size,
      pendingTriads: this.pendingTriads.size,
      openPortals: Array.from(this.activePortals.values())
        .filter(p => p.status === 'open').length,
      portals: Object.fromEntries(
        Array.from(this.activePortals.entries()).map(([char, portal]) => [
          char,
          {
            status: portal.status,
            entries: portal.entries,
            energy: portal.portalEnergy
          }
        ])
      ),
      databases: {
        primary: this.databases.activeBackend,
        trinity: this.databaseTrinity
      }
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(status));
  }

  // Start the login server
  start() {
    this.server.listen(this.port, () => {
      console.log(`
╔════════════════════════════════════════════════════════════════╗
║                  🌌 TRINITY LOGIN PORTAL 🌌                    ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  Access the portal at: http://localhost:${this.port}           ║
║                                                                ║
║  Requirements:                                                 ║
║  • 3 devices for trinity authentication                        ║
║  • Character selection for soul bonding                        ║
║  • Frequency matching for resonance                            ║
║                                                                ║
║  Database Trinity:                                             ║
║  • Primary: ${this.databaseTrinity.primary.padEnd(47)}║
║  • Mirror:  ${this.databaseTrinity.mirror.padEnd(47)}║
║  • Shadow:  ${this.databaseTrinity.shadow.padEnd(47)}║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
      `);
      
      this.emit('serverStarted', { port: this.port });
    });
  }

  // Command line interface
  async cli() {
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
      case 'start':
        this.start();
        break;

      case 'status':
        const status = this.soulfra.getSystemStatus();
        console.log('\n🌌 Trinity System Status:');
        console.log(JSON.stringify(status, null, 2));
        break;

      case 'portals':
        console.log('\n🌀 Character Portals:');
        this.activePortals.forEach((portal, char) => {
          console.log(`\n${char}:`);
          console.log(`  Status: ${portal.status}`);
          console.log(`  Entries: ${portal.entries}`);
          console.log(`  Frequency: ${portal.soulFrequency} Hz`);
          console.log(`  Energy: ${portal.portalEnergy}%`);
        });
        break;

      case 'demo':
        console.log('🎭 Starting Trinity Login Demo...');
        
        // Start server
        this.start();
        
        // Create demo triad after server starts
        this.once('serverStarted', async () => {
          setTimeout(async () => {
            console.log('\n📱 Creating demo device triad...');
            
            const devices = [
              { id: 'demo-primary', type: 'primary', key: 'demo-key-1' },
              { id: 'demo-mirror', type: 'mirror', key: 'demo-key-2' },
              { id: 'demo-shadow', type: 'shadow', key: 'demo-key-3' }
            ];
            
            const triad = await this.soulfra.createDeviceTriad('demo-user', devices);
            console.log(`✅ Demo triad created: ${triad.id}`);
            console.log(`🎵 Soul frequency: ${triad.soulFrequency.primary} Hz`);
            console.log(`\n🌐 Open http://localhost:${this.port} to see the login screen`);
          }, 1000);
        });
        break;

      default:
        console.log(`
🌌 Trinity Login Screen

Usage:
  node trinity-login-screen.js start      # Start login server
  node trinity-login-screen.js status     # System status
  node trinity-login-screen.js portals    # Portal status
  node trinity-login-screen.js demo       # Run demo

Features:
  - 3-device trinity authentication
  - Character-soul frequency matching
  - Mirror realm portal system
  - Triple database storage
  - Real-time soul binding

Login Flow:
  1. Pair 3 devices (primary, mirror, shadow)
  2. Generate soul frequency from device trinity
  3. Select character based on frequency resonance
  4. Authenticate all three devices
  5. Enter character portal to mirror realm

Access at: http://localhost:${this.port}
        `);
    }
  }
}

// Export for use as module
module.exports = TrinityLoginScreen;

// Run CLI if called directly
if (require.main === module) {
  const trinity = new TrinityLoginScreen();
  trinity.cli().catch(console.error);
}