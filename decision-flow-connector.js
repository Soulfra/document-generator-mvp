#!/usr/bin/env node

import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'http';
import { Tone } from 'tone';

class DecisionFlowConnector {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocketServer({ port: 7781 });
    
    this.decisions = new Map();
    this.flows = new Map();
    this.connections = new Map();
    this.quantumPaths = new Map();
    this.musicalPatterns = new Map();
    
    // Decision type configurations
    this.decisionTypes = {
      critical: { color: '#FF0000', icon: '🚨', chord: ['C4', 'E4', 'G4', 'B4'] },
      important: { color: '#FF8800', icon: '⚠️', chord: ['D4', 'F#4', 'A4'] },
      normal: { color: '#FFFF00', icon: '📍', chord: ['E4', 'G#4', 'B4'] },
      optional: { color: '#00FF00', icon: '🌿', chord: ['F4', 'A4', 'C5'] },
      experimental: { color: '#800080', icon: '🔬', chord: ['G4', 'Bb4', 'D5', 'F5'] }
    };
    
    // Gaming metaphors
    this.gameElements = {
      crossroads: { icon: '🚸', sound: 'pluck' },
      powerMove: { icon: '⚡', sound: 'synth' },
      treasure: { icon: '💎', sound: 'bell' },
      bossBattle: { icon: '🐉', sound: 'distortion' },
      bridge: { icon: '🌉', sound: 'pad' }
    };
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
    this.connectToServices();
    this.initializeAudio();
  }
  
  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.static('public'));
  }
  
  setupRoutes() {
    // Main visualization page
    this.app.get('/', (req, res) => {
      res.send(this.generateVisualizationHTML());
    });
    
    // API endpoints
    this.app.get('/api/decisions', (req, res) => {
      res.json(Array.from(this.decisions.values()));
    });
    
    this.app.get('/api/flows', (req, res) => {
      res.json(Array.from(this.flows.values()));
    });
    
    this.app.post('/api/decision', (req, res) => {
      const decision = this.createDecision(req.body);
      res.json(decision);
    });
    
    this.app.post('/api/flow', (req, res) => {
      const flow = this.createFlow(req.body);
      res.json(flow);
    });
    
    this.app.post('/api/batch-analyze', (req, res) => {
      const analysis = this.batchAnalyzeDecisions(req.body.decisions);
      res.json(analysis);
    });
    
    this.app.get('/api/quantum-paths/:decisionId', (req, res) => {
      const paths = this.calculateQuantumPaths(req.params.decisionId);
      res.json(paths);
    });
    
    this.app.post('/api/play-decision/:decisionId', (req, res) => {
      this.playDecisionSound(req.params.decisionId);
      res.json({ playing: true });
    });
  }
  
  setupWebSocket() {
    this.wss.on('connection', (ws) => {
      console.log('WebSocket client connected');
      
      // Send initial state
      ws.send(JSON.stringify({
        type: 'init',
        decisions: Array.from(this.decisions.values()),
        flows: Array.from(this.flows.values())
      }));
      
      ws.on('message', (message) => {
        const data = JSON.parse(message);
        this.handleWebSocketMessage(ws, data);
      });
      
      ws.on('close', () => {
        console.log('WebSocket client disconnected');
      });
    });
  }
  
  handleWebSocketMessage(ws, data) {
    switch (data.type) {
      case 'create-decision':
        const decision = this.createDecision(data.payload);
        this.broadcast({ type: 'decision-created', decision });
        break;
        
      case 'connect-decisions':
        const connection = this.connectDecisions(data.from, data.to, data.connectionType);
        this.broadcast({ type: 'connection-created', connection });
        break;
        
      case 'play-flow':
        this.playFlowSequence(data.flowId);
        break;
        
      case 'analyze-path':
        const analysis = this.analyzeDecisionPath(data.path);
        ws.send(JSON.stringify({ type: 'path-analysis', analysis }));
        break;
    }
  }
  
  connectToServices() {
    // Connect to UnifiedDecisionDebugger
    this.connectToDebugger();
    
    // Connect to BulkDatabaseScanner
    this.connectToScanner();
    
    // Connect to AI Debugging Dashboard
    this.connectToAIDashboard();
    
    // Load patterns from COLOR-CODED-EDUCATION-SYSTEM
    this.loadEducationPatterns();
  }
  
  async connectToDebugger() {
    try {
      const response = await fetch('http://localhost:7777/api/decisions');
      const decisions = await response.json();
      
      decisions.forEach(decision => {
        this.decisions.set(decision.id, {
          ...decision,
          type: this.categorizeDecision(decision),
          position: this.calculatePosition(decision),
          connections: []
        });
      });
      
      console.log(`Loaded ${decisions.length} decisions from debugger`);
    } catch (error) {
      console.error('Failed to connect to UnifiedDecisionDebugger:', error);
    }
  }
  
  async connectToScanner() {
    try {
      const response = await fetch('http://localhost:7778/api/scan-results');
      const scanData = await response.json();
      
      // Process scan data to enrich decisions
      this.enrichDecisionsWithScanData(scanData);
    } catch (error) {
      console.error('Failed to connect to BulkDatabaseScanner:', error);
    }
  }
  
  async connectToAIDashboard() {
    try {
      const response = await fetch('http://localhost:9500/api/debug-logs');
      const debugLogs = await response.json();
      
      // Extract decision patterns from debug logs
      this.extractDecisionPatterns(debugLogs);
    } catch (error) {
      console.error('Failed to connect to AI Debugging Dashboard:', error);
    }
  }
  
  loadEducationPatterns() {
    // Simulate loading patterns from COLOR-CODED-EDUCATION-SYSTEM.js
    this.educationPatterns = {
      learning: { color: '#00FF00', progression: 'linear' },
      understanding: { color: '#0088FF', progression: 'exponential' },
      mastery: { color: '#FF00FF', progression: 'logarithmic' }
    };
  }
  
  initializeAudio() {
    this.synths = {
      pluck: new Tone.PluckSynth().toDestination(),
      synth: new Tone.Synth().toDestination(),
      bell: new Tone.MetalSynth().toDestination(),
      distortion: new Tone.FMSynth().toDestination(),
      pad: new Tone.PolySynth().toDestination()
    };
    
    this.reverb = new Tone.Reverb(2).toDestination();
    this.delay = new Tone.Delay(0.3, 0.5).toDestination();
  }
  
  createDecision(data) {
    const id = `decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const type = this.categorizeDecision(data);
    
    const decision = {
      id,
      ...data,
      type,
      timestamp: new Date().toISOString(),
      position: data.position || this.calculatePosition(data),
      connections: [],
      metadata: {
        icon: this.gameElements.crossroads.icon,
        color: this.decisionTypes[type].color,
        chord: this.decisionTypes[type].chord
      }
    };
    
    this.decisions.set(id, decision);
    this.playDecisionSound(id);
    
    return decision;
  }
  
  createFlow(data) {
    const id = `flow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const flow = {
      id,
      ...data,
      decisions: data.decisions || [],
      connections: data.connections || [],
      timestamp: new Date().toISOString(),
      metadata: {
        totalDecisions: data.decisions.length,
        criticalPath: this.findCriticalPath(data.decisions),
        musicalPattern: this.generateMusicalPattern(data.decisions)
      }
    };
    
    this.flows.set(id, flow);
    return flow;
  }
  
  connectDecisions(fromId, toId, connectionType = 'normal') {
    const connection = {
      id: `conn_${Date.now()}`,
      from: fromId,
      to: toId,
      type: connectionType,
      strength: this.calculateConnectionStrength(fromId, toId),
      metadata: {
        icon: this.gameElements.bridge.icon,
        color: this.getConnectionColor(connectionType)
      }
    };
    
    this.connections.set(connection.id, connection);
    
    // Update decision connections
    const fromDecision = this.decisions.get(fromId);
    const toDecision = this.decisions.get(toId);
    
    if (fromDecision && toDecision) {
      fromDecision.connections.push({ to: toId, type: connectionType });
      toDecision.connections.push({ from: fromId, type: connectionType });
    }
    
    return connection;
  }
  
  calculateQuantumPaths(decisionId) {
    const decision = this.decisions.get(decisionId);
    if (!decision) return null;
    
    const paths = [];
    const visited = new Set();
    
    // Recursive path finder with quantum superposition
    const findPaths = (currentId, path = [], probability = 1.0) => {
      if (visited.has(currentId)) return;
      visited.add(currentId);
      
      const current = this.decisions.get(currentId);
      if (!current) return;
      
      path.push({
        id: currentId,
        decision: current,
        probability
      });
      
      if (current.connections.length === 0) {
        paths.push({
          path: [...path],
          totalProbability: probability,
          outcome: this.predictOutcome(path)
        });
      } else {
        // Quantum split - explore all possible paths
        current.connections.forEach(conn => {
          const branchProbability = this.calculateBranchProbability(conn);
          findPaths(conn.to, [...path], probability * branchProbability);
        });
      }
      
      visited.delete(currentId);
    };
    
    findPaths(decisionId);
    
    return {
      decisionId,
      paths,
      quantumState: this.calculateQuantumState(paths),
      timeline: this.generateTimeline(paths)
    };
  }
  
  batchAnalyzeDecisions(decisionIds) {
    const decisions = decisionIds.map(id => this.decisions.get(id)).filter(Boolean);
    
    return {
      totalDecisions: decisions.length,
      patterns: this.findCommonPatterns(decisions),
      optimizations: this.suggestOptimizations(decisions),
      templates: this.extractTemplates(decisions),
      metrics: {
        averageComplexity: this.calculateAverageComplexity(decisions),
        commonOutcomes: this.findCommonOutcomes(decisions),
        bottlenecks: this.identifyBottlenecks(decisions)
      }
    };
  }
  
  playDecisionSound(decisionId) {
    const decision = this.decisions.get(decisionId);
    if (!decision) return;
    
    const chord = decision.metadata.chord;
    const synthType = this.gameElements[decision.metadata.icon]?.sound || 'synth';
    const synth = this.synths[synthType];
    
    // Play chord progression
    chord.forEach((note, index) => {
      setTimeout(() => {
        synth.triggerAttackRelease(note, '8n');
      }, index * 100);
    });
  }
  
  playFlowSequence(flowId) {
    const flow = this.flows.get(flowId);
    if (!flow) return;
    
    const pattern = flow.metadata.musicalPattern;
    let time = 0;
    
    pattern.forEach(step => {
      setTimeout(() => {
        this.playDecisionSound(step.decisionId);
      }, time);
      time += step.duration;
    });
  }
  
  categorizeDecision(decision) {
    // Logic to categorize decision based on content
    if (decision.critical || decision.priority === 'high') return 'critical';
    if (decision.important || decision.priority === 'medium') return 'important';
    if (decision.optional || decision.priority === 'low') return 'optional';
    if (decision.experimental || decision.type === 'experiment') return 'experimental';
    return 'normal';
  }
  
  calculatePosition(decision) {
    // Calculate position based on decision relationships
    return {
      x: Math.random() * 800 + 100,
      y: Math.random() * 600 + 100
    };
  }
  
  findCriticalPath(decisions) {
    // Implement critical path finding algorithm
    return decisions.filter(d => d.type === 'critical').map(d => d.id);
  }
  
  generateMusicalPattern(decisions) {
    return decisions.map((decision, index) => ({
      decisionId: decision.id,
      note: decision.metadata.chord[0],
      duration: 500,
      velocity: 0.8
    }));
  }
  
  calculateConnectionStrength(fromId, toId) {
    // Calculate connection strength based on decision relationships
    return Math.random() * 0.5 + 0.5;
  }
  
  getConnectionColor(type) {
    const colors = {
      strong: '#FF0000',
      medium: '#FF8800',
      weak: '#FFFF00',
      optional: '#00FF00'
    };
    return colors[type] || '#888888';
  }
  
  calculateBranchProbability(connection) {
    return connection.strength || 0.5;
  }
  
  predictOutcome(path) {
    // Predict outcome based on decision path
    const lastDecision = path[path.length - 1];
    return {
      type: 'success',
      probability: Math.random() * 0.3 + 0.7,
      icon: this.gameElements.treasure.icon
    };
  }
  
  calculateQuantumState(paths) {
    return {
      superposition: paths.length > 1,
      entanglement: this.findEntangledPaths(paths),
      coherence: this.calculateCoherence(paths)
    };
  }
  
  generateTimeline(paths) {
    return paths.map(p => ({
      path: p.path.map(step => step.id),
      duration: p.path.length * 1000,
      probability: p.totalProbability
    }));
  }
  
  findCommonPatterns(decisions) {
    const patterns = {};
    decisions.forEach(d => {
      const pattern = `${d.type}_${d.connections.length}`;
      patterns[pattern] = (patterns[pattern] || 0) + 1;
    });
    return patterns;
  }
  
  suggestOptimizations(decisions) {
    const optimizations = [];
    
    // Check for redundant decisions
    const similar = this.findSimilarDecisions(decisions);
    if (similar.length > 0) {
      optimizations.push({
        type: 'merge_similar',
        decisions: similar,
        impact: 'high'
      });
    }
    
    // Check for bottlenecks
    const bottlenecks = this.identifyBottlenecks(decisions);
    if (bottlenecks.length > 0) {
      optimizations.push({
        type: 'parallelize',
        decisions: bottlenecks,
        impact: 'medium'
      });
    }
    
    return optimizations;
  }
  
  extractTemplates(decisions) {
    const templates = [];
    
    // Group decisions by pattern
    const groups = this.groupByPattern(decisions);
    
    Object.entries(groups).forEach(([pattern, group]) => {
      if (group.length >= 3) {
        templates.push({
          pattern,
          decisions: group,
          template: this.createTemplate(group)
        });
      }
    });
    
    return templates;
  }
  
  broadcast(data) {
    this.wss.clients.forEach(client => {
      if (client.readyState === 1) {
        client.send(JSON.stringify(data));
      }
    });
  }
  
  generateVisualizationHTML() {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Decision Flow Connector</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', monospace;
      background: #0a0a0a;
      color: #00ff00;
      overflow: hidden;
    }
    
    #canvas {
      width: 100vw;
      height: 100vh;
      position: relative;
      background: radial-gradient(circle at center, #001122 0%, #000000 100%);
    }
    
    .decision-node {
      position: absolute;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 32px;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 0 20px currentColor;
      animation: pulse 2s infinite;
    }
    
    .decision-node:hover {
      transform: scale(1.2);
      box-shadow: 0 0 40px currentColor;
    }
    
    .connection-line {
      position: absolute;
      height: 2px;
      transform-origin: left center;
      box-shadow: 0 0 10px currentColor;
      animation: flow 3s linear infinite;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 0.8; }
      50% { opacity: 1; }
    }
    
    @keyframes flow {
      0% { background-position: 0% 0%; }
      100% { background-position: 100% 0%; }
    }
    
    .quantum-cloud {
      position: absolute;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(128, 0, 255, 0.3) 0%, transparent 70%);
      pointer-events: none;
      animation: quantum 4s ease-in-out infinite;
    }
    
    @keyframes quantum {
      0%, 100% { transform: scale(1); opacity: 0.3; }
      50% { transform: scale(1.5); opacity: 0.1; }
    }
    
    #controls {
      position: fixed;
      top: 20px;
      left: 20px;
      background: rgba(0, 0, 0, 0.8);
      padding: 20px;
      border: 1px solid #00ff00;
      border-radius: 5px;
      z-index: 1000;
    }
    
    button {
      background: #001122;
      color: #00ff00;
      border: 1px solid #00ff00;
      padding: 10px 20px;
      margin: 5px;
      cursor: pointer;
      border-radius: 3px;
      font-family: inherit;
      transition: all 0.3s ease;
    }
    
    button:hover {
      background: #00ff00;
      color: #001122;
      box-shadow: 0 0 20px #00ff00;
    }
    
    #info {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.8);
      padding: 20px;
      border: 1px solid #00ff00;
      border-radius: 5px;
      max-width: 400px;
    }
    
    .metric {
      display: flex;
      justify-content: space-between;
      margin: 5px 0;
      padding: 5px;
      background: rgba(0, 255, 0, 0.1);
    }
    
    #audio-visualizer {
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 100px;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2px;
    }
    
    .frequency-bar {
      width: 4px;
      background: #00ff00;
      transition: height 0.1s ease;
    }
  </style>
</head>
<body>
  <div id="canvas"></div>
  
  <div id="controls">
    <h3>🎮 Decision Flow Controls</h3>
    <button onclick="createDecision()">Create Decision 🚸</button>
    <button onclick="connectMode()">Connect Mode 🌉</button>
    <button onclick="playFlow()">Play Flow 🎵</button>
    <button onclick="analyzeQuantum()">Quantum Analysis 🔬</button>
    <button onclick="batchAnalyze()">Batch Analyze 📊</button>
  </div>
  
  <div id="info">
    <h3>📊 Flow Metrics</h3>
    <div class="metric">
      <span>Total Decisions:</span>
      <span id="totalDecisions">0</span>
    </div>
    <div class="metric">
      <span>Active Flows:</span>
      <span id="activeFlows">0</span>
    </div>
    <div class="metric">
      <span>Quantum Paths:</span>
      <span id="quantumPaths">0</span>
    </div>
    <div class="metric">
      <span>Connection Strength:</span>
      <span id="connectionStrength">0%</span>
    </div>
  </div>
  
  <div id="audio-visualizer"></div>
  
  <script src="https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.js"></script>
  <script>
    const ws = new WebSocket('ws://localhost:7781');
    const canvas = document.getElementById('canvas');
    let decisions = new Map();
    let connections = new Map();
    let selectedNode = null;
    let connectingMode = false;
    
    // Initialize audio visualizer
    const visualizer = document.getElementById('audio-visualizer');
    for (let i = 0; i < 32; i++) {
      const bar = document.createElement('div');
      bar.className = 'frequency-bar';
      bar.style.height = '10px';
      visualizer.appendChild(bar);
    }
    
    ws.onopen = () => {
      console.log('Connected to Decision Flow Server');
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleServerMessage(data);
    };
    
    function handleServerMessage(data) {
      switch (data.type) {
        case 'init':
          data.decisions.forEach(d => {
            decisions.set(d.id, d);
            renderDecision(d);
          });
          updateMetrics();
          break;
          
        case 'decision-created':
          decisions.set(data.decision.id, data.decision);
          renderDecision(data.decision);
          updateMetrics();
          break;
          
        case 'connection-created':
          connections.set(data.connection.id, data.connection);
          renderConnection(data.connection);
          updateMetrics();
          break;
      }
    }
    
    function renderDecision(decision) {
      const node = document.createElement('div');
      node.className = 'decision-node';
      node.id = decision.id;
      node.style.left = decision.position.x + 'px';
      node.style.top = decision.position.y + 'px';
      node.style.color = decision.metadata.color;
      node.style.borderColor = decision.metadata.color;
      node.textContent = decision.metadata.icon;
      
      node.onclick = () => handleNodeClick(decision);
      
      // Add quantum cloud effect for experimental decisions
      if (decision.type === 'experimental') {
        const cloud = document.createElement('div');
        cloud.className = 'quantum-cloud';
        cloud.style.width = '200px';
        cloud.style.height = '200px';
        cloud.style.left = (decision.position.x - 60) + 'px';
        cloud.style.top = (decision.position.y - 60) + 'px';
        canvas.appendChild(cloud);
      }
      
      canvas.appendChild(node);
    }
    
    function renderConnection(connection) {
      const from = decisions.get(connection.from);
      const to = decisions.get(connection.to);
      
      if (!from || !to) return;
      
      const line = document.createElement('div');
      line.className = 'connection-line';
      line.style.backgroundColor = connection.metadata.color;
      
      const dx = to.position.x - from.position.x;
      const dy = to.position.y - from.position.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * 180 / Math.PI;
      
      line.style.width = length + 'px';
      line.style.left = (from.position.x + 40) + 'px';
      line.style.top = (from.position.y + 40) + 'px';
      line.style.transform = \`rotate(\${angle}deg)\`;
      
      // Animated gradient for flow
      line.style.background = \`linear-gradient(90deg, 
        \${connection.metadata.color} 0%, 
        \${connection.metadata.color}88 50%, 
        \${connection.metadata.color} 100%)\`;
      line.style.backgroundSize = '200% 100%';
      
      canvas.appendChild(line);
    }
    
    function handleNodeClick(decision) {
      if (connectingMode && selectedNode) {
        // Create connection
        ws.send(JSON.stringify({
          type: 'connect-decisions',
          from: selectedNode.id,
          to: decision.id,
          connectionType: 'normal'
        }));
        
        selectedNode = null;
        connectingMode = false;
        
        // Visual feedback
        playConnectionSound();
      } else if (connectingMode) {
        selectedNode = decision;
        document.getElementById(decision.id).style.boxShadow = '0 0 50px #ffffff';
      } else {
        // Play decision sound
        fetch(\`/api/play-decision/\${decision.id}\`, { method: 'POST' });
        
        // Show decision info
        showDecisionInfo(decision);
      }
    }
    
    function createDecision() {
      const types = ['critical', 'important', 'normal', 'optional', 'experimental'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      ws.send(JSON.stringify({
        type: 'create-decision',
        payload: {
          name: \`Decision \${Date.now()}\`,
          type: type,
          position: {
            x: Math.random() * (window.innerWidth - 200) + 100,
            y: Math.random() * (window.innerHeight - 200) + 100
          }
        }
      }));
    }
    
    function connectMode() {
      connectingMode = !connectingMode;
      document.body.style.cursor = connectingMode ? 'crosshair' : 'default';
    }
    
    function playFlow() {
      // Find a random flow or create one from current decisions
      const decisionIds = Array.from(decisions.keys());
      if (decisionIds.length > 0) {
        ws.send(JSON.stringify({
          type: 'play-flow',
          flowId: 'current'
        }));
        
        // Visual feedback
        animateFlow();
      }
    }
    
    function analyzeQuantum() {
      const decisionIds = Array.from(decisions.keys());
      if (decisionIds.length > 0) {
        const randomId = decisionIds[Math.floor(Math.random() * decisionIds.length)];
        
        fetch(\`/api/quantum-paths/\${randomId}\`)
          .then(res => res.json())
          .then(data => {
            console.log('Quantum paths:', data);
            visualizeQuantumPaths(data);
          });
      }
    }
    
    function batchAnalyze() {
      const decisionIds = Array.from(decisions.keys());
      
      fetch('/api/batch-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decisions: decisionIds })
      })
        .then(res => res.json())
        .then(data => {
          console.log('Batch analysis:', data);
          showAnalysisResults(data);
        });
    }
    
    function updateMetrics() {
      document.getElementById('totalDecisions').textContent = decisions.size;
      document.getElementById('activeFlows').textContent = connections.size;
      document.getElementById('quantumPaths').textContent = 
        Array.from(decisions.values()).filter(d => d.type === 'experimental').length;
      
      const avgStrength = Array.from(connections.values())
        .reduce((sum, c) => sum + (c.strength || 0.5), 0) / (connections.size || 1);
      document.getElementById('connectionStrength').textContent = 
        Math.round(avgStrength * 100) + '%';
    }
    
    function playConnectionSound() {
      // Simple connection sound using Tone.js
      const synth = new Tone.Synth().toDestination();
      synth.triggerAttackRelease('C5', '16n');
      setTimeout(() => synth.triggerAttackRelease('E5', '16n'), 100);
      setTimeout(() => synth.triggerAttackRelease('G5', '16n'), 200);
    }
    
    function animateFlow() {
      const bars = document.querySelectorAll('.frequency-bar');
      let time = 0;
      
      const animate = () => {
        bars.forEach((bar, i) => {
          const height = Math.sin(time + i * 0.5) * 40 + 50;
          bar.style.height = height + 'px';
        });
        
        time += 0.1;
        if (time < Math.PI * 4) {
          requestAnimationFrame(animate);
        }
      };
      
      animate();
    }
    
    function visualizeQuantumPaths(data) {
      // Create visual representation of quantum paths
      data.paths.forEach((path, index) => {
        setTimeout(() => {
          path.path.forEach((step, stepIndex) => {
            setTimeout(() => {
              const node = document.getElementById(step.id);
              if (node) {
                node.style.animation = 'pulse 0.5s ease';
                setTimeout(() => {
                  node.style.animation = 'pulse 2s infinite';
                }, 500);
              }
            }, stepIndex * 200);
          });
        }, index * 1000);
      });
    }
    
    function showDecisionInfo(decision) {
      console.log('Decision info:', decision);
      // Could show a modal or update the info panel
    }
    
    function showAnalysisResults(analysis) {
      console.log('Analysis results:', analysis);
      // Could show detailed analysis in a modal
    }
    
    // Initialize metrics
    updateMetrics();
  </script>
</body>
</html>
    `;
  }
  
  enrichDecisionsWithScanData(scanData) {
    // Enrich decisions with database scan results
    scanData.forEach(scan => {
      const relatedDecisions = Array.from(this.decisions.values())
        .filter(d => d.name.includes(scan.keyword) || d.description?.includes(scan.keyword));
      
      relatedDecisions.forEach(decision => {
        decision.scanData = scan;
        decision.enriched = true;
      });
    });
  }
  
  extractDecisionPatterns(debugLogs) {
    // Extract patterns from debug logs
    const patterns = new Map();
    
    debugLogs.forEach(log => {
      if (log.type === 'decision' || log.message.includes('decision')) {
        const pattern = this.extractPattern(log.message);
        patterns.set(pattern.id, pattern);
      }
    });
    
    this.debugPatterns = patterns;
  }
  
  extractPattern(message) {
    // Simple pattern extraction
    return {
      id: `pattern_${Date.now()}`,
      type: 'debug',
      content: message,
      timestamp: new Date().toISOString()
    };
  }
  
  findSimilarDecisions(decisions) {
    const similar = [];
    
    decisions.forEach((d1, i) => {
      decisions.slice(i + 1).forEach(d2 => {
        if (this.calculateSimilarity(d1, d2) > 0.8) {
          similar.push([d1.id, d2.id]);
        }
      });
    });
    
    return similar;
  }
  
  calculateSimilarity(d1, d2) {
    // Simple similarity calculation
    if (d1.type === d2.type && d1.connections.length === d2.connections.length) {
      return 0.9;
    }
    return 0.3;
  }
  
  identifyBottlenecks(decisions) {
    return decisions
      .filter(d => d.connections.length > 5)
      .map(d => d.id);
  }
  
  groupByPattern(decisions) {
    const groups = {};
    
    decisions.forEach(d => {
      const pattern = `${d.type}_${d.connections.length}`;
      if (!groups[pattern]) groups[pattern] = [];
      groups[pattern].push(d);
    });
    
    return groups;
  }
  
  createTemplate(group) {
    return {
      type: group[0].type,
      connectionCount: group[0].connections.length,
      commonAttributes: this.findCommonAttributes(group)
    };
  }
  
  findCommonAttributes(group) {
    // Find attributes common to all decisions in group
    return {
      type: group[0].type,
      hasMetadata: group.every(d => d.metadata)
    };
  }
  
  findEntangledPaths(paths) {
    // Find paths that share decisions
    const entangled = [];
    
    paths.forEach((p1, i) => {
      paths.slice(i + 1).forEach((p2, j) => {
        const shared = p1.path.filter(s1 => 
          p2.path.some(s2 => s2.id === s1.id)
        );
        
        if (shared.length > 0) {
          entangled.push({
            paths: [i, i + j + 1],
            sharedDecisions: shared.map(s => s.id)
          });
        }
      });
    });
    
    return entangled;
  }
  
  calculateCoherence(paths) {
    // Calculate quantum coherence of paths
    if (paths.length === 0) return 0;
    
    const totalProbability = paths.reduce((sum, p) => sum + p.totalProbability, 0);
    return Math.min(1, totalProbability / paths.length);
  }
  
  calculateAverageComplexity(decisions) {
    if (decisions.length === 0) return 0;
    
    const totalComplexity = decisions.reduce((sum, d) => {
      const complexity = d.connections.length * (d.type === 'critical' ? 2 : 1);
      return sum + complexity;
    }, 0);
    
    return totalComplexity / decisions.length;
  }
  
  findCommonOutcomes(decisions) {
    const outcomes = {};
    
    decisions.forEach(d => {
      const outcome = d.outcome || 'unknown';
      outcomes[outcome] = (outcomes[outcome] || 0) + 1;
    });
    
    return outcomes;
  }
  
  start() {
    const PORT = 7780;
    this.server.listen(PORT, () => {
      console.log(`
╔═══════════════════════════════════════════════════════════╗
║            Decision Flow Connector Started!               ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  🎮 Gaming Metaphors:                                     ║
║     • Crossroads = Decision Points 🚸                    ║
║     • Power Moves = Actions ⚡                           ║
║     • Treasure = Outcomes 💎                             ║
║     • Boss Battles = Blockers 🐉                         ║
║     • Bridges = Dependencies 🌉                          ║
║                                                           ║
║  🎨 Color-Coded Paths:                                    ║
║     • Critical = Red (#FF0000)                            ║
║     • Important = Orange (#FF8800)                        ║
║     • Normal = Yellow (#FFFF00)                           ║
║     • Optional = Green (#00FF00)                          ║
║     • Experimental = Purple (#800080)                     ║
║                                                           ║
║  🎵 Musical Feedback:                                     ║
║     • Each decision plays unique chords                   ║
║     • Path selection creates melodies                     ║
║     • Conflicts produce dissonance                        ║
║     • Success brings harmonic resolution                  ║
║                                                           ║
║  🔬 Quantum Features:                                     ║
║     • Parallel decision paths                             ║
║     • Superposition visualization                         ║
║     • Probability clouds                                  ║
║     • Timeline splitting                                  ║
║                                                           ║
║  📡 Connections:                                          ║
║     • UnifiedDecisionDebugger: Port 7777                 ║
║     • BulkDatabaseScanner: Port 7778                     ║
║     • AI Debugging Dashboard: Port 9500                  ║
║     • WebSocket: Port 7781                               ║
║                                                           ║
║  🌐 Access Points:                                        ║
║     • Main Interface: http://localhost:${PORT}            ║
║     • WebSocket: ws://localhost:7781                     ║
║     • API: http://localhost:${PORT}/api/*                 ║
║                                                           ║
║  Ready to visualize your decision flows! 🚀               ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);
    });
  }
}

// Start the system
const connector = new DecisionFlowConnector();
connector.start();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down Decision Flow Connector...');
  process.exit(0);
});

export default DecisionFlowConnector;