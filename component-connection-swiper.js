#!/usr/bin/env node

/**
 * 🎯 COMPONENT CONNECTION SWIPER
 * 
 * Visual interface for connecting components across layers
 * Combines micro-file-swiper with component discovery engine
 * Provides Tinder-like interface for architectural decisions
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const ComponentDiscoveryEngine = require('./COMPONENT-DISCOVERY-ENGINE.js');

class ComponentConnectionSwiper {
    constructor() {
        this.port = 3009; // Different port from micro-file-swiper
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });
        
        // Initialize discovery engine
        this.discoveryEngine = new ComponentDiscoveryEngine();
        
        // Architecture layers
        this.layers = {
            'grant': { name: 'Grant Layer', description: 'Human-to-AI marketplace', color: '#3498db' },
            'game': { name: 'Game Layer', description: 'Collaborative work like Figma', color: '#2ecc71' },
            'gaming': { name: 'Gaming Layer', description: 'Unity/Unreal/Three.js', color: '#e74c3c' },
            'unknown': { name: 'Unknown Layer', description: 'Needs classification', color: '#95a5a6' }
        };
        
        // State management
        this.isScanning = false;
        this.scanResults = {
            totalFiles: 0,
            processedFiles: 0,
            componentAnalysis: [],
            errors: []
        };
        this.componentPairs = [];
        this.architectureDecisions = [];
        this.clients = new Set();
        this.currentMode = 'discovery'; // discovery, connection, layer-assignment
        
        console.log('🎯 COMPONENT CONNECTION SWIPER');
        console.log('🔗 Visual component connection interface');
        console.log('📊 Layer-aware architectural decisions');
    }
    
    start() {
        this.setupRoutes();
        this.setupWebSocket();
        
        this.server.listen(this.port, (err) => {
            if (err) {
                console.error('❌ Server failed to start:', err);
                process.exit(1);
            }
            
            console.log(`\n✅ Component Connection Swiper running at http://localhost:${this.port}`);
            console.log('🎯 Ready to discover and connect components!');
            console.log('📊 Supports Grant Layer → Game Layer → Gaming Layer workflow\n');
        });
    }
    
    setupRoutes() {
        this.app.use(express.json());
        
        // Main interface
        this.app.get('/', (req, res) => {
            res.send(this.getInterface());
        });
        
        // Start component discovery scan
        this.app.post('/api/discover', (req, res) => {
            if (this.isScanning) {
                return res.json({ error: 'Scan already in progress' });
            }
            
            this.startComponentDiscovery();
            res.json({ success: true, message: 'Component discovery started' });
        });
        
        // Get current status
        this.app.get('/api/status', (req, res) => {
            res.json({
                isScanning: this.isScanning,
                results: this.scanResults,
                pairsReady: this.componentPairs.length,
                mode: this.currentMode,
                layers: this.layers
            });
        });
        
        // Get component pairs for decision
        this.app.get('/api/component-pairs', (req, res) => {
            res.json(this.componentPairs.slice(0, 10)); // Max 10 pairs at a time
        });
        
        // Switch modes (discovery, connection, layer-assignment)
        this.app.post('/api/mode/:mode', (req, res) => {
            const newMode = req.params.mode;
            if (['discovery', 'connection', 'layer-assignment'].includes(newMode)) {
                this.currentMode = newMode;
                res.json({ success: true, mode: this.currentMode });
                this.broadcast({
                    type: 'mode_changed',
                    data: { mode: this.currentMode }
                });
            } else {
                res.status(400).json({ error: 'Invalid mode' });
            }
        });
        
        // Record architecture decision
        this.app.post('/api/decision', (req, res) => {
            try {
                const { component1, component2, decision, reasoning, layer } = req.body;
                
                const architectureDecision = {
                    component1,
                    component2,
                    decision,
                    reasoning,
                    layer,
                    mode: this.currentMode,
                    timestamp: new Date().toISOString(),
                    confidence: this.calculateDecisionConfidence(component1, component2, decision)
                };
                
                this.architectureDecisions.push(architectureDecision);
                
                console.log(`✅ Architecture Decision: ${decision} for ${path.basename(component1?.file || 'unknown')} ↔ ${path.basename(component2?.file || 'unknown')}`);
                
                // Store in architecture training database
                this.storeArchitectureTraining(architectureDecision);
                
                this.broadcast({
                    type: 'decision_recorded',
                    data: {
                        decision,
                        total: this.architectureDecisions.length,
                        mode: this.currentMode
                    }
                });
                
                res.json({ success: true });
            } catch (error) {
                console.error('❌ Decision error:', error);
                res.status(500).json({ error: error.message });
            }
        });
        
        // Get component analysis
        this.app.get('/api/component-analysis/:filename', (req, res) => {
            try {
                const filename = decodeURIComponent(req.params.filename);
                const analysis = this.scanResults.componentAnalysis.find(a => a.file === filename);
                
                if (!analysis) {
                    return res.status(404).json({ error: 'Component not found' });
                }
                
                res.json(analysis);
                
            } catch (error) {
                console.error('❌ Analysis error:', error);
                res.status(500).json({ error: error.message });
            }
        });
        
        // Get architecture decisions history
        this.app.get('/api/decisions', (req, res) => {
            res.json(this.architectureDecisions);
        });
        
        // Export architecture as diagram
        this.app.get('/api/architecture-export', (req, res) => {
            const architecture = this.generateArchitectureDiagram();
            res.json(architecture);
        });
    }
    
    setupWebSocket() {
        this.wss.on('connection', (ws) => {
            this.clients.add(ws);
            console.log('📱 Client connected');
            
            // Send current status
            ws.send(JSON.stringify({
                type: 'status',
                data: {
                    isScanning: this.isScanning,
                    results: this.scanResults,
                    mode: this.currentMode,
                    layers: this.layers
                }
            }));
            
            ws.on('close', () => {
                this.clients.delete(ws);
            });
            
            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
                this.clients.delete(ws);
            });
        });
    }
    
    broadcast(message) {
        const data = JSON.stringify(message);
        this.clients.forEach(client => {
            try {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(data);
                }
            } catch (error) {
                console.error('Broadcast error:', error);
                this.clients.delete(client);
            }
        });
    }
    
    async startComponentDiscovery() {
        console.log('\n🔍 Starting component discovery...');
        
        this.isScanning = true;
        this.scanResults = {
            totalFiles: 0,
            processedFiles: 0,
            componentAnalysis: [],
            errors: []
        };
        this.componentPairs = [];
        
        this.broadcast({
            type: 'discovery_started',
            data: { message: 'Discovering components...' }
        });
        
        setTimeout(() => {
            this.performComponentDiscovery();
        }, 100);
    }
    
    async performComponentDiscovery() {
        try {
            console.log('📁 Finding JavaScript components...');
            
            // Get all JS files
            const allFiles = fs.readdirSync('.');
            const jsFiles = allFiles
                .filter(file => file.endsWith('.js'))
                .filter(file => !file.includes('node_modules'))
                .filter(file => {
                    try {
                        const stats = fs.statSync(file);
                        return stats.isFile() && stats.size > 100; // Must have some content
                    } catch (error) {
                        return false;
                    }
                })
                .slice(0, 50); // Reasonable limit
            
            console.log(`📊 Found ${jsFiles.length} components to analyze`);
            
            this.scanResults.totalFiles = jsFiles.length;
            
            this.broadcast({
                type: 'files_found',
                data: {
                    totalFiles: jsFiles.length,
                    message: `Found ${jsFiles.length} components`
                }
            });
            
            if (jsFiles.length === 0) {
                this.completeDiscovery('No JavaScript components found');
                return;
            }
            
            // Analyze components in batches
            await this.analyzeComponentsInBatches(jsFiles);
            
        } catch (error) {
            console.error('❌ Discovery failed:', error);
            this.scanResults.errors.push(error.message);
            this.completeDiscovery(`Discovery failed: ${error.message}`);
        }
    }
    
    async analyzeComponentsInBatches(files) {
        const analyses = [];
        let processed = 0;
        
        console.log('🔨 Analyzing components in batches of 3...');
        
        const processBatch = async (startIndex) => {
            const batchSize = 3;
            const batch = files.slice(startIndex, startIndex + batchSize);
            
            if (batch.length === 0) {
                this.createComponentPairs(analyses);
                return;
            }
            
            // Analyze batch
            for (const file of batch) {
                try {
                    const analysis = await this.discoveryEngine.analyzeComponent(file);
                    
                    // Enhance with layer detection
                    analysis.suggestedLayer = this.detectComponentLayer(analysis);
                    analysis.synopsis = this.generateComponentSynopsis(analysis);
                    analysis.connectionCandidates = [];
                    
                    analyses.push(analysis);
                    processed++;
                    this.scanResults.processedFiles = processed;
                    
                } catch (error) {
                    console.warn(`⚠️ Cannot analyze ${file}:`, error.message);
                    this.scanResults.errors.push(`${file}: ${error.message}`);
                    processed++;
                }
            }
            
            // Update progress
            const percent = Math.round((processed / files.length) * 100);
            console.log(`📊 Analyzed ${processed}/${files.length} components (${percent}%)`);
            
            this.broadcast({
                type: 'progress',
                data: {
                    processed,
                    total: files.length,
                    percent
                }
            });
            
            // Process next batch
            setTimeout(() => processBatch(startIndex + batchSize), 200);
        };
        
        await processBatch(0);
    }
    
    detectComponentLayer(analysis) {
        // Grant Layer indicators
        if (analysis.features.includes('billing') || 
            analysis.features.includes('authentication') ||
            analysis.endpoints.some(ep => ep.path && ep.path.includes('/api/grant'))) {
            return 'grant';
        }
        
        // Game Layer indicators  
        if (analysis.features.includes('api') ||
            analysis.endpoints.length > 0 ||
            analysis.components.some(c => c.name.includes('Service') || c.name.includes('Manager'))) {
            return 'game';
        }
        
        // Gaming Layer indicators
        if (analysis.file.includes('3d') || 
            analysis.file.includes('game') ||
            analysis.file.includes('visual') ||
            analysis.dependencies.includes('three')) {
            return 'gaming';
        }
        
        return 'unknown';
    }
    
    generateComponentSynopsis(analysis) {
        const parts = [];
        
        // Component type
        if (analysis.components.length > 0) {
            const types = analysis.components.map(c => c.type).filter((v, i, a) => a.indexOf(v) === i);
            parts.push(`${types.join('/')} component`);
        }
        
        // Main features
        if (analysis.features.length > 0) {
            parts.push(`handles ${analysis.features.slice(0, 3).join(', ')}`);
        }
        
        // Exports
        if (analysis.exports.length > 0) {
            parts.push(`exports ${analysis.exports.slice(0, 2).join(', ')}`);
        }
        
        // Ports/endpoints
        if (analysis.ports.length > 0) {
            parts.push(`runs on port ${analysis.ports[0]}`);
        } else if (analysis.endpoints.length > 0) {
            parts.push(`provides ${analysis.endpoints.length} endpoints`);
        }
        
        return parts.join(' • ') || 'JavaScript component';
    }
    
    createComponentPairs(analyses) {
        console.log('🔍 Creating component connection pairs...');
        
        this.scanResults.componentAnalysis = analyses;
        this.componentPairs = [];
        
        let pairId = 0;
        
        // Find potentially related components
        for (let i = 0; i < analyses.length - 1; i++) {
            for (let j = i + 1; j < analyses.length; j++) {
                const comp1 = analyses[i];
                const comp2 = analyses[j];
                
                const relatedness = this.calculateRelatedness(comp1, comp2);
                
                if (relatedness > 0.2) { // Only show potentially related components
                    this.componentPairs.push({
                        id: pairId++,
                        component1: comp1,
                        component2: comp2,
                        relatedness,
                        suggestedConnection: this.suggestConnection(comp1, comp2, relatedness),
                        type: 'potential_connection'
                    });
                    
                    if (this.componentPairs.length >= 20) break; // Limit pairs
                }
            }
            if (this.componentPairs.length >= 20) break;
        }
        
        console.log(`📊 Created ${this.componentPairs.length} potential component connections`);
        
        this.completeDiscovery();
    }
    
    calculateRelatedness(comp1, comp2) {
        let score = 0;
        
        // Same suggested layer
        if (comp1.suggestedLayer === comp2.suggestedLayer && comp1.suggestedLayer !== 'unknown') {
            score += 0.4;
        }
        
        // Shared features
        const sharedFeatures = comp1.features.filter(f => comp2.features.includes(f));
        score += sharedFeatures.length * 0.1;
        
        // Dependency relationship
        if (comp1.dependencies.some(dep => dep.includes(comp2.file.replace('.js', ''))) ||
            comp2.dependencies.some(dep => dep.includes(comp1.file.replace('.js', '')))) {
            score += 0.3;
        }
        
        // Port proximity (similar ports might be related)
        if (comp1.ports.length > 0 && comp2.ports.length > 0) {
            const portDiff = Math.abs(comp1.ports[0] - comp2.ports[0]);
            if (portDiff < 100) {
                score += 0.2;
            }
        }
        
        // Similar naming patterns
        const name1 = path.basename(comp1.file, '.js').toLowerCase();
        const name2 = path.basename(comp2.file, '.js').toLowerCase();
        const commonWords = name1.split(/[-_]/).filter(word => name2.includes(word));
        score += commonWords.length * 0.1;
        
        return Math.min(1.0, score);
    }
    
    suggestConnection(comp1, comp2, relatedness) {
        if (relatedness > 0.7) return 'direct_integration';
        if (relatedness > 0.5) return 'event_bridge';
        if (relatedness > 0.3) return 'loose_coupling';
        return 'explore_connection';
    }
    
    completeDiscovery(errorMessage = null) {
        this.isScanning = false;
        
        const message = errorMessage || 
            `Discovery complete! Found ${this.scanResults.componentAnalysis.length} components, ${this.componentPairs.length} potential connections.`;
            
        console.log(`✅ ${message}`);
        
        this.broadcast({
            type: 'discovery_complete',
            data: {
                success: !errorMessage,
                message,
                componentsAnalyzed: this.scanResults.componentAnalysis.length,
                pairsReady: this.componentPairs.length,
                errors: this.scanResults.errors
            }
        });
    }
    
    calculateDecisionConfidence(comp1, comp2, decision) {
        // Simple confidence calculation based on component analysis
        let confidence = 0.5;
        
        if (comp1 && comp2) {
            // Higher confidence if components are in same layer
            if (comp1.suggestedLayer === comp2.suggestedLayer) confidence += 0.2;
            
            // Higher confidence if they have shared features
            const sharedFeatures = (comp1.features || []).filter(f => (comp2.features || []).includes(f));
            confidence += sharedFeatures.length * 0.1;
        }
        
        return Math.min(1.0, confidence);
    }
    
    storeArchitectureTraining(decision) {
        // Store architecture training data for AI learning
        // This would typically go to a database
        console.log('💾 Storing architecture training:', {
            components: [decision.component1?.file, decision.component2?.file],
            decision: decision.decision,
            confidence: decision.confidence
        });
    }
    
    generateArchitectureDiagram() {
        // Generate visual architecture diagram from decisions
        const layers = {};
        
        this.architectureDecisions.forEach(decision => {
            if (decision.layer && !layers[decision.layer]) {
                layers[decision.layer] = {
                    name: this.layers[decision.layer]?.name || decision.layer,
                    components: [],
                    connections: []
                };
            }
        });
        
        return {
            layers,
            decisions: this.architectureDecisions,
            generatedAt: new Date().toISOString()
        };
    }
    
    getInterface() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎯 Component Connection Swiper</title>
    <script src="https://hammerjs.github.io/dist/hammer.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
            color: white; min-height: 100vh; padding: 20px;
        }
        
        .container { max-width: 800px; margin: 0 auto; }
        
        .header { text-align: center; margin-bottom: 1.5rem; }
        .header h1 { font-size: 2.2rem; margin-bottom: 0.5rem; }
        .subtitle { opacity: 0.9; margin-bottom: 1rem; }
        
        .mode-selector {
            display: flex; justify-content: center; gap: 10px; margin-bottom: 1rem;
        }
        .mode-btn {
            padding: 8px 16px; border: 2px solid rgba(255,255,255,0.3);
            background: transparent; color: white; border-radius: 20px;
            cursor: pointer; transition: all 0.3s ease; font-size: 0.9rem;
        }
        .mode-btn.active {
            background: white; color: #2c3e50; border-color: white;
        }
        .mode-btn:hover:not(.active) {
            border-color: rgba(255,255,255,0.8);
        }
        
        .control-panel { 
            background: rgba(255,255,255,0.1); padding: 20px; 
            border-radius: 15px; margin-bottom: 20px;
            backdrop-filter: blur(10px);
        }
        
        .discover-button { 
            width: 100%; padding: 15px; border: none; border-radius: 10px;
            background: linear-gradient(45deg, #3498db, #2980b9);
            color: white; font-size: 1.1rem; font-weight: bold;
            cursor: pointer; transition: all 0.3s ease;
        }
        .discover-button:hover { transform: translateY(-2px); }
        .discover-button:disabled { 
            background: #666; cursor: not-allowed; transform: none;
        }
        
        .status { 
            margin-top: 15px; padding: 15px; background: rgba(0,0,0,0.2);
            border-radius: 10px; font-family: monospace; font-size: 0.9rem;
        }
        
        .progress-bar { 
            background: rgba(255,255,255,0.2); height: 8px; 
            border-radius: 4px; margin: 10px 0; overflow: hidden;
        }
        .progress-fill { 
            background: linear-gradient(90deg, #3498db, #2980b9);
            height: 100%; width: 0%; transition: width 0.3s ease;
        }
        
        .stats { 
            display: grid; grid-template-columns: repeat(4, 1fr);
            gap: 15px; margin-top: 15px;
        }
        .stat { text-align: center; }
        .stat-number { font-size: 1.3rem; font-weight: bold; }
        .stat-label { font-size: 0.8rem; opacity: 0.8; }
        
        .card-stack { 
            position: relative; height: 550px; margin: 20px 0;
        }
        
        .component-card { 
            position: absolute; width: 100%; height: 100%; 
            background: white; border-radius: 20px; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            color: #333; padding: 25px; cursor: grab;
            overflow: hidden; transition: transform 0.3s ease;
        }
        .component-card:active { cursor: grabbing; }
        .component-card.swiping { transition: none; }
        
        .layer-badge { 
            position: absolute; top: 15px; right: 15px;
            padding: 8px 15px; border-radius: 20px;
            color: white; font-weight: bold; font-size: 0.8rem;
        }
        .layer-badge.grant { background: #3498db; }
        .layer-badge.game { background: #2ecc71; }
        .layer-badge.gaming { background: #e74c3c; }
        .layer-badge.unknown { background: #95a5a6; }
        
        .relatedness-badge {
            position: absolute; top: 15px; left: 15px;
            background: linear-gradient(45deg, #f39c12, #e67e22);
            color: white; padding: 8px 15px; border-radius: 20px;
            font-weight: bold; font-size: 0.8rem;
        }
        
        .component-comparison { 
            display: flex; gap: 20px; margin-top: 60px; 
            height: calc(100% - 120px);
        }
        .component-preview { 
            flex: 1; background: #f8f9fa; padding: 20px; 
            border-radius: 10px; overflow: hidden;
            display: flex; flex-direction: column;
        }
        .component-name { 
            font-weight: bold; margin-bottom: 8px; color: #2c3e50;
            font-size: 1rem; word-break: break-word;
        }
        .component-synopsis { 
            font-size: 0.85rem; color: #7f8c8d; margin-bottom: 12px; 
            font-style: italic; line-height: 1.4;
        }
        .component-meta { 
            font-size: 0.75rem; color: #95a5a6; margin-bottom: 12px;
            display: flex; flex-wrap: wrap; gap: 15px;
        }
        .component-features { 
            font-family: 'Monaco', 'Menlo', monospace; font-size: 0.7rem; 
            background: white; padding: 12px; border-radius: 5px;
            border: 1px solid #e9ecef; flex: 1; overflow-y: auto;
            line-height: 1.4;
        }
        .feature-list {
            margin: 5px 0; padding-left: 10px;
        }
        .feature-list li {
            margin-bottom: 3px; list-style-type: none;
        }
        .feature-list li::before {
            content: "▸ "; color: #3498db; font-weight: bold;
        }
        
        .connection-suggestion {
            background: linear-gradient(45deg, #2ecc71, #27ae60);
            color: white; padding: 12px; border-radius: 8px;
            margin: 10px 0; text-align: center; font-weight: bold;
            font-size: 0.85rem;
        }
        
        .action-hints { 
            position: absolute; font-size: 2.5rem; font-weight: bold;
            opacity: 0; transition: opacity 0.3s ease; pointer-events: none;
        }
        .action-hints.left { 
            left: 20px; top: 50%; transform: translateY(-50%); color: #e74c3c; 
        }
        .action-hints.right { 
            right: 20px; top: 50%; transform: translateY(-50%); color: #27ae60; 
        }
        .action-hints.up { 
            top: 80px; left: 50%; transform: translateX(-50%); color: #f39c12; 
        }
        .action-hints.down { 
            bottom: 80px; left: 50%; transform: translateX(-50%); color: #9b59b6; 
        }
        
        .swipe-controls { 
            position: fixed; bottom: 30px; left: 50%; 
            transform: translateX(-50%); display: flex; gap: 15px;
        }
        .swipe-btn { 
            width: 65px; height: 65px; border-radius: 50%;
            border: none; color: white; font-size: 1.4rem;
            cursor: pointer; transition: all 0.3s ease;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            display: flex; align-items: center; justify-content: center;
        }
        .swipe-btn:hover { transform: scale(1.1); }
        .swipe-btn.reject { background: linear-gradient(45deg, #e74c3c, #c0392b); }
        .swipe-btn.separate { background: linear-gradient(45deg, #f39c12, #e67e22); }
        .swipe-btn.connect { background: linear-gradient(45deg, #27ae60, #229954); }
        .swipe-btn.layer-assign { background: linear-gradient(45deg, #9b59b6, #8e44ad); }
        .swipe-btn:disabled { 
            background: #666 !important; cursor: not-allowed; transform: none !important;
        }
        
        .waiting-state, .error-state { 
            text-align: center; padding: 60px 20px; 
            background: rgba(255,255,255,0.1); border-radius: 20px;
            backdrop-filter: blur(10px);
        }
        
        .error-state { background: rgba(231, 76, 60, 0.2); }
        
        .spinner { 
            width: 40px; height: 40px; margin: 0 auto 20px;
            border: 3px solid rgba(255,255,255,0.3);
            border-top: 3px solid white; border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin { 
            0% { transform: rotate(0deg); } 
            100% { transform: rotate(360deg); } 
        }
        
        .notification { 
            position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
            background: rgba(0,0,0,0.8); color: white; padding: 15px 25px;
            border-radius: 25px; opacity: 0; transition: opacity 0.3s ease;
            z-index: 1000; max-width: 80%; text-align: center;
        }
        .notification.show { opacity: 1; }
        
        .mode-description {
            background: rgba(255,255,255,0.1); padding: 15px;
            border-radius: 10px; margin: 10px 0; font-size: 0.9rem;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 Component Connection Swiper</h1>
            <div class="subtitle">Visual interface for architectural decisions</div>
            
            <div class="mode-selector">
                <button class="mode-btn active" data-mode="discovery" onclick="switchMode('discovery')">
                    🔍 Discovery
                </button>
                <button class="mode-btn" data-mode="connection" onclick="switchMode('connection')">
                    🔗 Connection
                </button>
                <button class="mode-btn" data-mode="layer-assignment" onclick="switchMode('layer-assignment')">
                    📊 Layer Assignment
                </button>
            </div>
            
            <div class="mode-description" id="mode-description">
                Discovery Mode: Find and analyze components in your codebase
            </div>
        </div>
        
        <div class="control-panel">
            <button class="discover-button" id="discover-button" onclick="startDiscovery()">
                🔍 Discover Components
            </button>
            
            <div class="status" id="status">
                ⚡ Ready to discover components across Grant → Game → Gaming layers
            </div>
            
            <div class="progress-bar" style="display: none;" id="progress-bar">
                <div class="progress-fill" id="progress-fill"></div>
            </div>
            
            <div class="stats">
                <div class="stat">
                    <div class="stat-number" id="total-components">0</div>
                    <div class="stat-label">Components</div>
                </div>
                <div class="stat">
                    <div class="stat-number" id="processed-components">0</div>
                    <div class="stat-label">Analyzed</div>
                </div>
                <div class="stat">
                    <div class="stat-number" id="potential-connections">0</div>
                    <div class="stat-label">Connections</div>
                </div>
                <div class="stat">
                    <div class="stat-number" id="decisions-made">0</div>
                    <div class="stat-label">Decisions</div>
                </div>
            </div>
        </div>
        
        <div class="card-stack" id="card-stack">
            <div class="waiting-state">
                <h2>👆 Click "Discover Components" Above</h2>
                <p>Will analyze JavaScript components and suggest connections</p>
                <p style="margin-top: 15px; opacity: 0.8; font-size: 0.9rem;">
                    Grant Layer → Game Layer → Gaming Layer workflow
                </p>
            </div>
        </div>
        
        <div class="swipe-controls">
            <button class="swipe-btn reject" title="No Connection" onclick="swipeLeft()" disabled>❌</button>
            <button class="swipe-btn separate" title="Keep Separate" onclick="swipeUp()" disabled>📄</button>
            <button class="swipe-btn connect" title="Connect Components" onclick="swipeRight()" disabled>🔗</button>
            <button class="swipe-btn layer-assign" title="Assign Layer" onclick="swipeDown()" disabled>📊</button>
        </div>
    </div>
    
    <div class="notification" id="notification"></div>
    
    <script>
        let isScanning = false;
        let componentPairs = [];
        let currentIndex = 0;
        let decisions = [];
        let currentMode = 'discovery';
        let layers = {};
        
        // WebSocket connection
        const ws = new WebSocket('ws://localhost:3009');
        
        const modeDescriptions = {
            discovery: 'Discovery Mode: Find and analyze components in your codebase',
            connection: 'Connection Mode: Decide how components should connect to each other',
            'layer-assignment': 'Layer Assignment Mode: Assign components to Grant/Game/Gaming layers'
        };
        
        ws.onopen = () => {
            console.log('WebSocket connected');
        };
        
        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                handleWebSocketMessage(message);
            } catch (error) {
                console.error('WebSocket message error:', error);
            }
        };
        
        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            showNotification('❌ Connection error - refresh page');
        };
        
        function handleWebSocketMessage(message) {
            switch (message.type) {
                case 'status':
                    updateStatus(message.data);
                    break;
                case 'discovery_started':
                    onDiscoveryStarted(message.data);
                    break;
                case 'files_found':
                    onFilesFound(message.data);
                    break;
                case 'progress':
                    onProgress(message.data);
                    break;
                case 'discovery_complete':
                    onDiscoveryComplete(message.data);
                    break;
                case 'decision_recorded':
                    onDecisionRecorded(message.data);
                    break;
                case 'mode_changed':
                    onModeChanged(message.data);
                    break;
            }
        }
        
        function updateStatus(data) {
            isScanning = data.isScanning;
            currentMode = data.mode || 'discovery';
            layers = data.layers || {};
            updateModeUI();
        }
        
        function onDiscoveryStarted(data) {
            isScanning = true;
            document.getElementById('discover-button').disabled = true;
            document.getElementById('discover-button').textContent = '🔍 Discovering...';
            document.getElementById('status').textContent = data.message;
            document.getElementById('progress-bar').style.display = 'block';
            
            showNotification('🔍 Component discovery started');
        }
        
        function onFilesFound(data) {
            document.getElementById('total-components').textContent = data.totalFiles;
            document.getElementById('status').textContent = data.message;
        }
        
        function onProgress(data) {
            document.getElementById('processed-components').textContent = data.processed;
            document.getElementById('progress-fill').style.width = data.percent + '%';
            document.getElementById('status').textContent = 
                \`Analyzing components... \${data.percent}% complete\`;
        }
        
        function onDiscoveryComplete(data) {
            isScanning = false;
            document.getElementById('discover-button').disabled = false;
            document.getElementById('discover-button').textContent = '🔄 Rediscover';
            document.getElementById('potential-connections').textContent = data.pairsReady;
            
            if (data.success) {
                document.getElementById('status').textContent = data.message;
                showNotification(\`✅ \${data.message}\`);
                
                if (data.pairsReady > 0) {
                    loadComponentPairs();
                } else {
                    showWaitingState('🎉 No related components found to connect!');
                }
            } else {
                document.getElementById('status').textContent = \`❌ \${data.message}\`;
                showNotification(\`❌ \${data.message}\`);
            }
        }
        
        function onDecisionRecorded(data) {
            decisions.push(data);
            document.getElementById('decisions-made').textContent = data.total;
            
            const emoji = {
                'no_connection': '❌',
                'keep_separate': '📄',
                'connect_components': '🔗',
                'assign_layer': '📊'
            }[data.decision] || '✅';
            
            showNotification(\`\${emoji} Decision recorded\`);
        }
        
        function onModeChanged(data) {
            currentMode = data.mode;
            updateModeUI();
        }
        
        function updateModeUI() {
            // Update mode buttons
            document.querySelectorAll('.mode-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.mode === currentMode);
            });
            
            // Update mode description
            document.getElementById('mode-description').textContent = modeDescriptions[currentMode];
        }
        
        async function switchMode(mode) {
            try {
                const response = await fetch(\`/api/mode/\${mode}\`, { method: 'POST' });
                const data = await response.json();
                
                if (data.success) {
                    currentMode = mode;
                    updateModeUI();
                    showNotification(\`Switched to \${mode} mode\`);
                }
            } catch (error) {
                console.error('Failed to switch mode:', error);
                showNotification('❌ Failed to switch mode');
            }
        }
        
        async function startDiscovery() {
            try {
                const response = await fetch('/api/discover', { method: 'POST' });
                const data = await response.json();
                
                if (!data.success) {
                    showNotification(\`❌ \${data.error}\`);
                }
            } catch (error) {
                console.error('Discovery request failed:', error);
                showNotification('❌ Failed to start discovery');
            }
        }
        
        async function loadComponentPairs() {
            try {
                const response = await fetch('/api/component-pairs');
                componentPairs = await response.json();
                
                if (componentPairs.length === 0) {
                    showWaitingState('🎉 No component connections to review!');
                    return;
                }
                
                currentIndex = 0;
                renderCurrentCard();
                enableSwipeControls();
                
            } catch (error) {
                console.error('Failed to load component pairs:', error);
                showNotification('❌ Failed to load component pairs');
            }
        }
        
        function renderCurrentCard() {
            const pair = componentPairs[currentIndex];
            if (!pair) {
                showCompletionState();
                return;
            }
            
            const cardStack = document.getElementById('card-stack');
            cardStack.innerHTML = \`
                <div class="component-card">
                    <div class="layer-badge \${pair.component1.suggestedLayer}">\${layers[pair.component1.suggestedLayer]?.name || 'Unknown Layer'}</div>
                    <div class="relatedness-badge">\${Math.round(pair.relatedness * 100)}% Related</div>
                    
                    <div class="action-hints left">❌</div>
                    <div class="action-hints right">🔗</div>
                    <div class="action-hints up">📄</div>
                    <div class="action-hints down">📊</div>
                    
                    <div class="connection-suggestion">
                        Suggested: \${pair.suggestedConnection.replace(/_/g, ' ')}
                    </div>
                    
                    <div class="component-comparison">
                        <div class="component-preview">
                            <div class="component-name">\${path.basename(pair.component1.file)}</div>
                            <div class="component-synopsis">\${pair.component1.synopsis}</div>
                            <div class="component-meta">
                                <span>Size: \${formatSize(pair.component1.size)}</span>
                                <span>Ports: \${pair.component1.ports.join(', ') || 'None'}</span>
                            </div>
                            <div class="component-features">
                                <strong>Features:</strong>
                                <ul class="feature-list">
                                    \${pair.component1.features.map(f => \`<li>\${f}</li>\`).join('')}
                                </ul>
                                <strong>Exports:</strong>
                                <ul class="feature-list">
                                    \${pair.component1.exports.map(e => \`<li>\${e}</li>\`).join('')}
                                </ul>
                            </div>
                        </div>
                        
                        <div class="component-preview">
                            <div class="component-name">\${path.basename(pair.component2.file)}</div>
                            <div class="component-synopsis">\${pair.component2.synopsis}</div>
                            <div class="component-meta">
                                <span>Size: \${formatSize(pair.component2.size)}</span>
                                <span>Ports: \${pair.component2.ports.join(', ') || 'None'}</span>
                            </div>
                            <div class="component-features">
                                <strong>Features:</strong>
                                <ul class="feature-list">
                                    \${pair.component2.features.map(f => \`<li>\${f}</li>\`).join('')}
                                </ul>
                                <strong>Exports:</strong>
                                <ul class="feature-list">
                                    \${pair.component2.exports.map(e => \`<li>\${e}</li>\`).join('')}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            \`;
            
            setupGestures();
        }
        
        function setupGestures() {
            const cardStack = document.getElementById('card-stack');
            const hammer = new Hammer(cardStack);
            
            hammer.get('swipe').set({ direction: Hammer.DIRECTION_ALL });
            hammer.get('pan').set({ direction: Hammer.DIRECTION_ALL });
            
            hammer.on('pan', (e) => {
                const card = document.querySelector('.component-card');
                if (!card) return;
                
                const deltaX = e.deltaX;
                const deltaY = e.deltaY;
                const rotation = deltaX * 0.1;
                
                card.classList.add('swiping');
                card.style.transform = \`translateX(\${deltaX}px) translateY(\${deltaY}px) rotate(\${rotation}deg)\`;
                
                updateActionHints(deltaX, deltaY);
            });
            
            hammer.on('panend', (e) => {
                const card = document.querySelector('.component-card');
                if (!card) return;
                
                card.classList.remove('swiping');
                
                const threshold = 100;
                const deltaX = e.deltaX;
                const deltaY = e.deltaY;
                
                if (Math.abs(deltaX) > threshold || Math.abs(deltaY) > threshold) {
                    if (Math.abs(deltaX) > Math.abs(deltaY)) {
                        handleSwipe(deltaX > 0 ? 'right' : 'left');
                    } else {
                        handleSwipe(deltaY > 0 ? 'down' : 'up');
                    }
                } else {
                    card.style.transform = '';
                    hideActionHints();
                }
            });
        }
        
        function updateActionHints(deltaX, deltaY) {
            const hints = document.querySelectorAll('.action-hints');
            hints.forEach(hint => hint.style.opacity = '0');
            
            const threshold = 50;
            
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (deltaX > threshold) {
                    document.querySelector('.action-hints.right').style.opacity = Math.min(1, deltaX / 150);
                } else if (deltaX < -threshold) {
                    document.querySelector('.action-hints.left').style.opacity = Math.min(1, Math.abs(deltaX) / 150);
                }
            } else {
                if (deltaY > threshold) {
                    document.querySelector('.action-hints.down').style.opacity = Math.min(1, deltaY / 150);
                } else if (deltaY < -threshold) {
                    document.querySelector('.action-hints.up').style.opacity = Math.min(1, Math.abs(deltaY) / 150);
                }
            }
        }
        
        function hideActionHints() {
            const hints = document.querySelectorAll('.action-hints');
            hints.forEach(hint => hint.style.opacity = '0');
        }
        
        function handleSwipe(direction) {
            const pair = componentPairs[currentIndex];
            if (!pair) return;
            
            let decision;
            
            switch (direction) {
                case 'left':
                    decision = 'no_connection';
                    break;
                case 'right':
                    decision = 'connect_components';
                    break;
                case 'up':
                    decision = 'keep_separate';
                    break;
                case 'down':
                    decision = 'assign_layer';
                    break;
            }
            
            recordDecision(pair, decision);
            animateCardExit(direction);
            
            setTimeout(() => {
                nextCard();
            }, 300);
        }
        
        function animateCardExit(direction) {
            const card = document.querySelector('.component-card');
            if (!card) return;
            
            let transform;
            
            switch (direction) {
                case 'left':
                    transform = 'translateX(-100vw) rotate(-30deg)';
                    break;
                case 'right':
                    transform = 'translateX(100vw) rotate(30deg)';
                    break;
                case 'up':
                    transform = 'translateY(-100vh) rotate(10deg)';
                    break;
                case 'down':
                    transform = 'translateY(100vh) rotate(-10deg)';
                    break;
            }
            
            card.style.transform = transform;
            card.style.opacity = '0';
        }
        
        async function recordDecision(pair, decision) {
            try {
                await fetch('/api/decision', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        component1: pair.component1,
                        component2: pair.component2,
                        decision,
                        reasoning: \`Swipe decision: \${decision} in \${currentMode} mode\`,
                        layer: pair.component1.suggestedLayer
                    })
                });
            } catch (error) {
                console.error('Failed to record decision:', error);
            }
        }
        
        function nextCard() {
            currentIndex++;
            
            if (currentIndex >= componentPairs.length) {
                showCompletionState();
            } else {
                renderCurrentCard();
            }
        }
        
        function enableSwipeControls() {
            const buttons = document.querySelectorAll('.swipe-btn');
            buttons.forEach(btn => btn.disabled = false);
        }
        
        function disableSwipeControls() {
            const buttons = document.querySelectorAll('.swipe-btn');
            buttons.forEach(btn => btn.disabled = true);
        }
        
        function showWaitingState(message) {
            const cardStack = document.getElementById('card-stack');
            cardStack.innerHTML = \`
                <div class="waiting-state">
                    <h2>\${message}</h2>
                    <button onclick="startDiscovery()" style="margin-top: 20px; padding: 10px 20px; background: white; color: #333; border: none; border-radius: 10px; cursor: pointer;">
                        🔄 Discover Again
                    </button>
                </div>
            \`;
            disableSwipeControls();
        }
        
        function showCompletionState() {
            const cardStack = document.getElementById('card-stack');
            cardStack.innerHTML = \`
                <div class="waiting-state">
                    <h2>✨ All Decisions Made!</h2>
                    <p>You processed \${decisions.length} component relationships</p>
                    <button onclick="startDiscovery()" style="margin-top: 20px; padding: 10px 20px; background: white; color: #333; border: none; border-radius: 10px; cursor: pointer;">
                        🔄 Discover Again
                    </button>
                </div>
            \`;
            disableSwipeControls();
        }
        
        function showNotification(message) {
            const notification = document.getElementById('notification');
            notification.textContent = message;
            notification.classList.add('show');
            
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
        }
        
        function formatSize(bytes) {
            if (!bytes) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
        }
        
        // Button handlers
        function swipeLeft() { handleSwipe('left'); }
        function swipeRight() { handleSwipe('right'); }
        function swipeUp() { handleSwipe('up'); }
        function swipeDown() { handleSwipe('down'); }
        
        // Initialize
        updateModeUI();
    </script>
</body>
</html>
        `;
    }
}

// Start the component connection swiper
const swiper = new ComponentConnectionSwiper();
swiper.start();

module.exports = ComponentConnectionSwiper;