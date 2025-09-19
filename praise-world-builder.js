#!/usr/bin/env node

// 🙏 PRAISE WORLD BUILDER
// Your praise literally builds the world - speak it into existence
// Voice/chat input → Praise recognition → World generation → Manifestation

const express = require('express');
const WebSocket = require('ws');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class PraiseWorldBuilder {
    constructor() {
        this.app = express();
        this.port = 7890;
        this.wsPort = 7891;
        
        // Praise patterns and their world-building effects
        this.praisePatterns = {
            // Positive reinforcement creates beauty
            amazing: { effect: 'create_wonder', power: 0.8, element: 'light' },
            beautiful: { effect: 'enhance_beauty', power: 0.7, element: 'nature' },
            perfect: { effect: 'crystallize_perfection', power: 0.9, element: 'crystal' },
            wonderful: { effect: 'spawn_magic', power: 0.75, element: 'magic' },
            excellent: { effect: 'strengthen_foundations', power: 0.8, element: 'earth' },
            fantastic: { effect: 'create_fantasy', power: 0.85, element: 'air' },
            brilliant: { effect: 'illuminate_area', power: 0.9, element: 'fire' },
            incredible: { effect: 'expand_possibilities', power: 0.85, element: 'void' },
            awesome: { effect: 'amplify_power', power: 0.8, element: 'energy' },
            'thank you': { effect: 'bless_area', power: 0.95, element: 'divine' },
            love: { effect: 'create_harmony', power: 1.0, element: 'heart' },
            blessed: { effect: 'sanctify_ground', power: 0.9, element: 'holy' },
            grateful: { effect: 'multiply_abundance', power: 0.85, element: 'prosperity' },
            
            // Specific world-building phrases
            'build a': { effect: 'construct_structure', power: 0.7, element: 'creation' },
            'create a': { effect: 'manifest_object', power: 0.8, element: 'genesis' },
            'let there be': { effect: 'divine_creation', power: 1.0, element: 'logos' },
            'i see': { effect: 'reveal_hidden', power: 0.6, element: 'vision' },
            'make it': { effect: 'transform_reality', power: 0.75, element: 'change' },
            'grow': { effect: 'accelerate_growth', power: 0.7, element: 'life' },
            'shine': { effect: 'create_radiance', power: 0.8, element: 'star' },
            'rise': { effect: 'elevate_terrain', power: 0.7, element: 'mountain' },
            'flow': { effect: 'create_rivers', power: 0.65, element: 'water' }
        };
        
        // World state affected by praise
        this.worldState = {
            landmarks: new Map(),
            blessings: new Map(),
            powerNodes: new Map(),
            praiseEnergy: 0,
            manifestations: [],
            divineInterventions: 0,
            harmonyLevel: 0.5,
            creationPower: 1.0
        };
        
        // Praise accumulation
        this.praiseBuffer = [];
        this.praiseMultiplier = 1.0;
        this.consecutivePraise = 0;
        
        // Voice recognition settings
        this.voiceEnabled = false;
        this.voiceConfidence = 0.7;
        
        this.setupWebServer();
        this.setupWebSocket();
        this.startPraiseEngine();
    }
    
    setupWebServer() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        // Praise interface
        this.app.get('/', (req, res) => {
            res.send(this.renderPraiseInterface());
        });
        
        // Submit praise (text)
        this.app.post('/api/praise', async (req, res) => {
            const { praise, source = 'text', intensity = 1.0 } = req.body;
            
            console.log(`🙏 Received praise: "${praise}" (${source})`);
            
            const result = await this.processPraise(praise, source, intensity);
            
            res.json({
                success: true,
                praise,
                effects: result.effects,
                worldChanges: result.worldChanges,
                manifestations: result.manifestations,
                praiseEnergy: this.worldState.praiseEnergy
            });
        });
        
        // Voice praise endpoint
        this.app.post('/api/praise/voice', async (req, res) => {
            const { audioData, transcript, confidence } = req.body;
            
            if (confidence >= this.voiceConfidence && transcript) {
                // Process with voice bonus
                const result = await this.processPraise(transcript, 'voice', 1.5);
                
                res.json({
                    success: true,
                    transcript,
                    confidence,
                    effects: result.effects,
                    voiceBonus: true
                });
            } else {
                res.json({ success: false, reason: 'Low confidence or no transcript' });
            }
        });
        
        // Get world state
        this.app.get('/api/world', (req, res) => {
            res.json({
                landmarks: Array.from(this.worldState.landmarks.entries()),
                blessings: Array.from(this.worldState.blessings.entries()),
                powerNodes: Array.from(this.worldState.powerNodes.entries()),
                praiseEnergy: this.worldState.praiseEnergy,
                harmonyLevel: this.worldState.harmonyLevel,
                manifestations: this.worldState.manifestations.slice(-50),
                stats: {
                    totalLandmarks: this.worldState.landmarks.size,
                    totalBlessings: this.worldState.blessings.size,
                    divineInterventions: this.worldState.divineInterventions,
                    creationPower: this.worldState.creationPower
                }
            });
        });
        
        // Batch praise (for continuous speaking)
        this.app.post('/api/praise/stream', async (req, res) => {
            const { phrases } = req.body;
            
            const results = [];
            for (const phrase of phrases) {
                const result = await this.processPraise(phrase, 'stream', 0.8);
                results.push(result);
            }
            
            res.json({ success: true, processed: results.length, results });
        });
    }
    
    setupWebSocket() {
        this.wss = new WebSocket.Server({ port: this.wsPort });
        
        this.wss.on('connection', (ws) => {
            console.log('🌐 Praise channel opened');
            
            // Send current world state
            ws.send(JSON.stringify({
                type: 'WORLD_STATE',
                data: this.getWorldSnapshot()
            }));
            
            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    
                    if (data.type === 'PRAISE') {
                        const result = await this.processPraise(data.praise, 'websocket', 1.0);
                        
                        // Broadcast to all clients
                        this.broadcast({
                            type: 'PRAISE_EFFECT',
                            praise: data.praise,
                            effects: result.effects,
                            worldChanges: result.worldChanges
                        });
                    }
                } catch (error) {
                    console.error('WebSocket error:', error);
                }
            });
        });
        
        console.log(`🔌 Praise WebSocket on port ${this.wsPort}`);
    }
    
    async processPraise(praiseText, source, intensity) {
        const words = praiseText.toLowerCase().trim().split(/\s+/);
        const effects = [];
        const worldChanges = [];
        const manifestations = [];
        
        // Add to praise buffer
        this.praiseBuffer.push({
            text: praiseText,
            source,
            intensity,
            timestamp: Date.now()
        });
        
        // Check for praise patterns
        for (const [pattern, config] of Object.entries(this.praisePatterns)) {
            if (praiseText.toLowerCase().includes(pattern)) {
                const power = config.power * intensity * this.praiseMultiplier;
                
                effects.push({
                    pattern,
                    effect: config.effect,
                    power,
                    element: config.element
                });
                
                // Apply world effect
                const worldChange = await this.applyWorldEffect(config.effect, power, config.element, praiseText);
                if (worldChange) {
                    worldChanges.push(worldChange);
                }
            }
        }
        
        // Increase praise energy
        this.worldState.praiseEnergy += effects.reduce((sum, e) => sum + e.power, 0);
        
        // Check for consecutive praise bonus
        if (this.praiseBuffer.length >= 2) {
            const recent = this.praiseBuffer.slice(-2);
            if (recent[1].timestamp - recent[0].timestamp < 5000) {
                this.consecutivePraise++;
                this.praiseMultiplier = 1 + (this.consecutivePraise * 0.1);
                
                if (this.consecutivePraise >= 5) {
                    // Divine intervention!
                    const divine = await this.triggerDivineIntervention(praiseText);
                    manifestations.push(divine);
                }
            } else {
                this.consecutivePraise = 0;
                this.praiseMultiplier = 1.0;
            }
        }
        
        // Manifest based on accumulated energy
        if (this.worldState.praiseEnergy >= 10) {
            const manifestation = await this.manifestFromPraise();
            if (manifestation) {
                manifestations.push(manifestation);
                this.worldState.praiseEnergy -= 10;
            }
        }
        
        // Update harmony
        this.updateHarmony(effects.length > 0);
        
        // Send to other systems
        await this.propagatePraise(praiseText, effects);
        
        return { effects, worldChanges, manifestations };
    }
    
    async applyWorldEffect(effectType, power, element, praiseText) {
        const location = this.calculatePraiseLocation(praiseText);
        
        switch (effectType) {
            case 'create_wonder':
                return this.createLandmark('Wonder', location, power, {
                    description: 'A magnificent wonder born from praise',
                    element,
                    radiance: power * 100
                });
                
            case 'enhance_beauty':
                return this.enhanceArea(location, power, {
                    beauty: power * 2,
                    growth: power * 1.5,
                    element
                });
                
            case 'spawn_magic':
                return this.createPowerNode(location, power, {
                    type: 'magic',
                    element,
                    resonance: power * 50
                });
                
            case 'bless_area':
                return this.createBlessing(location, power, {
                    duration: power * 3600, // hours
                    strength: power,
                    element,
                    effects: ['protection', 'growth', 'harmony']
                });
                
            case 'create_harmony':
                this.worldState.harmonyLevel = Math.min(1.0, this.worldState.harmonyLevel + power * 0.2);
                return {
                    type: 'harmony_increase',
                    newLevel: this.worldState.harmonyLevel,
                    location: 'global'
                };
                
            case 'divine_creation':
                // Special case - creates exactly what was spoken
                const creation = this.parseCreationIntent(praiseText);
                return this.manifestCreation(creation, location, power);
                
            case 'construct_structure':
                const structure = this.parseStructureIntent(praiseText);
                return this.buildStructure(structure, location, power);
                
            default:
                return {
                    type: 'general_blessing',
                    location,
                    power,
                    element
                };
        }
    }
    
    createLandmark(type, location, power, attributes) {
        const id = crypto.randomUUID();
        const landmark = {
            id,
            type,
            location,
            power,
            attributes,
            created: Date.now(),
            praiseCount: 1
        };
        
        this.worldState.landmarks.set(id, landmark);
        
        console.log(`🏔️  Created landmark: ${type} at ${JSON.stringify(location)}`);
        
        return {
            type: 'landmark_created',
            landmark
        };
    }
    
    createPowerNode(location, power, attributes) {
        const id = crypto.randomUUID();
        const node = {
            id,
            location,
            power,
            attributes,
            active: true,
            connections: []
        };
        
        // Connect to nearby nodes
        for (const [otherId, otherNode] of this.worldState.powerNodes) {
            const distance = this.calculateDistance(location, otherNode.location);
            if (distance < 100) {
                node.connections.push(otherId);
                otherNode.connections.push(id);
            }
        }
        
        this.worldState.powerNodes.set(id, node);
        
        return {
            type: 'power_node_created',
            node,
            network_size: node.connections.length + 1
        };
    }
    
    createBlessing(location, power, attributes) {
        const id = crypto.randomUUID();
        const blessing = {
            id,
            location,
            power,
            attributes,
            active: true,
            created: Date.now()
        };
        
        this.worldState.blessings.set(id, blessing);
        
        // Affect nearby entities
        const affected = this.applyBlessingEffects(blessing);
        
        return {
            type: 'blessing_created',
            blessing,
            affected
        };
    }
    
    enhanceArea(location, power, enhancements) {
        // Find nearby landmarks to enhance
        const enhanced = [];
        
        for (const [id, landmark] of this.worldState.landmarks) {
            const distance = this.calculateDistance(location, landmark.location);
            if (distance < 50) {
                // Enhance the landmark
                landmark.power *= (1 + power * 0.1);
                landmark.attributes.enhanced = true;
                landmark.attributes.enhancements = {
                    ...landmark.attributes.enhancements,
                    ...enhancements
                };
                landmark.praiseCount++;
                
                enhanced.push(landmark);
            }
        }
        
        return {
            type: 'area_enhanced',
            location,
            enhanced: enhanced.length,
            totalPower: enhanced.reduce((sum, l) => sum + l.power, 0)
        };
    }
    
    async manifestFromPraise() {
        // Use accumulated praise to create something wonderful
        const manifestation = {
            id: crypto.randomUUID(),
            type: 'praise_manifestation',
            form: this.chooseManifestation(),
            power: this.worldState.praiseEnergy,
            location: this.calculateCenterOfPraise(),
            timestamp: Date.now()
        };
        
        this.worldState.manifestations.push(manifestation);
        
        // Send to game world
        await this.sendToGameWorld(manifestation);
        
        console.log(`✨ Manifested: ${manifestation.form}`);
        
        return manifestation;
    }
    
    chooseManifestation() {
        const forms = [
            'Crystal Garden',
            'Floating Island',
            'Rainbow Bridge',
            'Healing Spring',
            'Starlight Grove',
            'Harmony Stones',
            'Blessing Fountain',
            'Ethereal Library',
            'Peace Monument',
            'Joy Beacon'
        ];
        
        // Choose based on praise patterns
        const recentPraise = this.praiseBuffer.slice(-10);
        const elements = new Set();
        
        for (const praise of recentPraise) {
            for (const [pattern, config] of Object.entries(this.praisePatterns)) {
                if (praise.text.toLowerCase().includes(pattern)) {
                    elements.add(config.element);
                }
            }
        }
        
        // More elements = more magical manifestation
        const magicLevel = Math.min(elements.size - 1, forms.length - 1);
        return forms[magicLevel];
    }
    
    async triggerDivineIntervention(praiseText) {
        console.log('🌟 DIVINE INTERVENTION TRIGGERED!');
        
        this.worldState.divineInterventions++;
        
        const intervention = {
            id: crypto.randomUUID(),
            type: 'divine_intervention',
            trigger: praiseText,
            effects: [
                'All landmarks blessed',
                'Harmony maximized',
                'New realm unlocked',
                'Miracles enabled'
            ],
            power: 100,
            timestamp: Date.now()
        };
        
        // Bless everything
        for (const [id, landmark] of this.worldState.landmarks) {
            landmark.power *= 2;
            landmark.attributes.divinelyBlessed = true;
        }
        
        // Max harmony
        this.worldState.harmonyLevel = 1.0;
        
        // Increase creation power
        this.worldState.creationPower *= 2;
        
        return intervention;
    }
    
    parseCreationIntent(praiseText) {
        // Extract what the user wants to create
        const patterns = [
            /create (?:a |an )?(.+)/i,
            /build (?:a |an )?(.+)/i,
            /make (?:a |an )?(.+)/i,
            /let there be (.+)/i,
            /manifest (?:a |an )?(.+)/i
        ];
        
        for (const pattern of patterns) {
            const match = praiseText.match(pattern);
            if (match) {
                return {
                    object: match[1],
                    raw: praiseText
                };
            }
        }
        
        return { object: 'wonder', raw: praiseText };
    }
    
    parseStructureIntent(praiseText) {
        const structures = {
            castle: { type: 'fortress', size: 'large', purpose: 'protection' },
            temple: { type: 'sacred', size: 'medium', purpose: 'worship' },
            garden: { type: 'natural', size: 'variable', purpose: 'beauty' },
            bridge: { type: 'connection', size: 'long', purpose: 'travel' },
            tower: { type: 'vertical', size: 'tall', purpose: 'observation' },
            fountain: { type: 'water', size: 'small', purpose: 'blessing' },
            library: { type: 'knowledge', size: 'large', purpose: 'wisdom' },
            sanctuary: { type: 'haven', size: 'medium', purpose: 'healing' }
        };
        
        for (const [key, config] of Object.entries(structures)) {
            if (praiseText.includes(key)) {
                return { name: key, ...config };
            }
        }
        
        return { name: 'monument', type: 'memorial', size: 'medium', purpose: 'remembrance' };
    }
    
    async manifestCreation(creation, location, power) {
        const manifestation = {
            id: crypto.randomUUID(),
            type: 'divine_creation',
            object: creation.object,
            location,
            power: power * this.worldState.creationPower,
            attributes: {
                spokenIntoExistence: true,
                praiseText: creation.raw,
                divineLight: true
            },
            timestamp: Date.now()
        };
        
        // Add to world
        this.worldState.landmarks.set(manifestation.id, manifestation);
        this.worldState.manifestations.push(manifestation);
        
        // Notify all systems
        await this.broadcastCreation(manifestation);
        
        return {
            type: 'divine_manifestation',
            creation: manifestation
        };
    }
    
    buildStructure(structure, location, power) {
        const building = {
            id: crypto.randomUUID(),
            ...structure,
            location,
            power,
            completed: power > 0.7,
            attributes: {
                praiseBuilt: true,
                construction: power < 0.7 ? 'in_progress' : 'complete'
            }
        };
        
        this.worldState.landmarks.set(building.id, building);
        
        return {
            type: 'structure_built',
            structure: building
        };
    }
    
    calculatePraiseLocation(praiseText) {
        // Use praise content to determine location
        const hash = crypto.createHash('sha256').update(praiseText).digest();
        
        return {
            x: (hash[0] / 255) * 1000 - 500,
            y: (hash[1] / 255) * 1000 - 500,
            z: (hash[2] / 255) * 100
        };
    }
    
    calculateCenterOfPraise() {
        if (this.worldState.landmarks.size === 0) {
            return { x: 0, y: 0, z: 0 };
        }
        
        let sumX = 0, sumY = 0, sumZ = 0;
        
        for (const landmark of this.worldState.landmarks.values()) {
            sumX += landmark.location.x;
            sumY += landmark.location.y;
            sumZ += landmark.location.z || 0;
        }
        
        const count = this.worldState.landmarks.size;
        
        return {
            x: sumX / count,
            y: sumY / count,
            z: sumZ / count
        };
    }
    
    calculateDistance(loc1, loc2) {
        const dx = loc1.x - loc2.x;
        const dy = loc1.y - loc2.y;
        const dz = (loc1.z || 0) - (loc2.z || 0);
        
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    
    applyBlessingEffects(blessing) {
        const affected = [];
        
        // Bless nearby landmarks
        for (const [id, landmark] of this.worldState.landmarks) {
            const distance = this.calculateDistance(blessing.location, landmark.location);
            if (distance < blessing.attributes.power * 50) {
                landmark.attributes.blessed = true;
                landmark.power *= 1.1;
                affected.push(landmark);
            }
        }
        
        return affected;
    }
    
    updateHarmony(positive) {
        if (positive) {
            this.worldState.harmonyLevel = Math.min(1.0, this.worldState.harmonyLevel + 0.01);
        } else {
            this.worldState.harmonyLevel = Math.max(0, this.worldState.harmonyLevel - 0.005);
        }
    }
    
    async propagatePraise(praiseText, effects) {
        // Send to brain layer
        try {
            await fetch('http://localhost:6789/api/body/brain/storyteller', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    data: {
                        type: 'praise',
                        text: praiseText,
                        effects,
                        worldState: this.getWorldSnapshot()
                    }
                })
            });
        } catch (error) {
            // Brain not available
        }
        
        // Send to game world
        try {
            await fetch('http://localhost:8899/api/praise', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ praiseText, effects })
            });
        } catch (error) {
            // Game not available
        }
    }
    
    async sendToGameWorld(manifestation) {
        // Send manifestation to game server
        try {
            await fetch('http://localhost:8899/api/manifestation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(manifestation)
            });
        } catch (error) {
            console.warn('Could not send to game world:', error.message);
        }
    }
    
    async broadcastCreation(creation) {
        this.broadcast({
            type: 'DIVINE_CREATION',
            creation
        });
    }
    
    broadcast(message) {
        const data = JSON.stringify(message);
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    }
    
    getWorldSnapshot() {
        return {
            landmarks: this.worldState.landmarks.size,
            blessings: this.worldState.blessings.size,
            powerNodes: this.worldState.powerNodes.size,
            praiseEnergy: this.worldState.praiseEnergy,
            harmonyLevel: this.worldState.harmonyLevel,
            divineInterventions: this.worldState.divineInterventions,
            recentManifestations: this.worldState.manifestations.slice(-5)
        };
    }
    
    startPraiseEngine() {
        // Clean up old praise
        setInterval(() => {
            const cutoff = Date.now() - 300000; // 5 minutes
            this.praiseBuffer = this.praiseBuffer.filter(p => p.timestamp > cutoff);
        }, 60000);
        
        // Update blessing durations
        setInterval(() => {
            for (const [id, blessing] of this.worldState.blessings) {
                if (blessing.attributes.duration) {
                    blessing.attributes.duration -= 1;
                    if (blessing.attributes.duration <= 0) {
                        this.worldState.blessings.delete(id);
                    }
                }
            }
        }, 1000);
        
        console.log('🙏 Praise engine started');
    }
    
    renderPraiseInterface() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Praise World Builder</title>
    <style>
        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        .praise-input {
            background: rgba(255,255,255,0.9);
            border-radius: 50px;
            padding: 20px;
            display: flex;
            align-items: center;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        #praiseText {
            flex: 1;
            border: none;
            background: none;
            font-size: 20px;
            outline: none;
            color: #333;
        }
        .praise-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 30px;
            padding: 12px 30px;
            font-size: 18px;
            cursor: pointer;
            transition: all 0.3s;
        }
        .praise-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        }
        .world-view {
            background: rgba(255,255,255,0.1);
            border-radius: 20px;
            padding: 30px;
            backdrop-filter: blur(10px);
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: rgba(255,255,255,0.2);
            padding: 20px;
            border-radius: 15px;
            text-align: center;
        }
        .stat-value {
            font-size: 2em;
            font-weight: bold;
            margin: 10px 0;
        }
        .manifestations {
            max-height: 400px;
            overflow-y: auto;
        }
        .manifestation {
            background: rgba(255,255,255,0.1);
            padding: 15px;
            margin: 10px 0;
            border-radius: 10px;
            animation: fadeIn 0.5s;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .voice-btn {
            background: rgba(255,255,255,0.2);
            border: 2px solid white;
            color: white;
            padding: 10px 20px;
            border-radius: 30px;
            margin-left: 10px;
            cursor: pointer;
        }
        .voice-btn.recording {
            background: #ff4444;
            animation: pulse 1s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }
        .praise-examples {
            text-align: center;
            margin: 20px 0;
            font-style: italic;
            opacity: 0.8;
        }
        .harmony-bar {
            height: 20px;
            background: rgba(255,255,255,0.2);
            border-radius: 10px;
            overflow: hidden;
            margin: 20px 0;
        }
        .harmony-fill {
            height: 100%;
            background: linear-gradient(90deg, #00ff88, #00ffff);
            width: 50%;
            transition: width 1s ease;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🙏 PRAISE WORLD BUILDER</h1>
            <p>Your words of praise literally build the world</p>
            <div class="praise-examples">
                Try: "This is beautiful" • "Thank you" • "Create a garden" • "Let there be light"
            </div>
        </div>
        
        <div class="praise-input">
            <input type="text" id="praiseText" placeholder="Speak your praise..." />
            <button class="praise-btn" onclick="sendPraise()">🙏 PRAISE</button>
            <button class="voice-btn" id="voiceBtn" onclick="toggleVoice()">🎤 Voice</button>
        </div>
        
        <div class="world-view">
            <h2>🌍 World State</h2>
            
            <div class="stats">
                <div class="stat-card">
                    <div>Landmarks</div>
                    <div class="stat-value" id="landmarks">0</div>
                </div>
                <div class="stat-card">
                    <div>Blessings</div>
                    <div class="stat-value" id="blessings">0</div>
                </div>
                <div class="stat-card">
                    <div>Praise Energy</div>
                    <div class="stat-value" id="praiseEnergy">0</div>
                </div>
                <div class="stat-card">
                    <div>Divine Interventions</div>
                    <div class="stat-value" id="divineInterventions">0</div>
                </div>
            </div>
            
            <h3>Harmony Level</h3>
            <div class="harmony-bar">
                <div class="harmony-fill" id="harmonyBar"></div>
            </div>
            
            <h3>Recent Manifestations</h3>
            <div class="manifestations" id="manifestations">
                <p style="opacity: 0.6;">Start praising to see manifestations...</p>
            </div>
        </div>
    </div>
    
    <script>
        let ws;
        let recognition;
        let isRecording = false;
        
        // Connect WebSocket
        function connect() {
            ws = new WebSocket('ws://localhost:7891');
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                
                if (data.type === 'WORLD_STATE') {
                    updateWorldView(data.data);
                } else if (data.type === 'PRAISE_EFFECT') {
                    showPraiseEffect(data);
                } else if (data.type === 'DIVINE_CREATION') {
                    showDivineCreation(data.creation);
                }
            };
        }
        
        // Send praise
        async function sendPraise() {
            const praiseText = document.getElementById('praiseText').value;
            if (!praiseText.trim()) return;
            
            try {
                const response = await fetch('/api/praise', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ praise: praiseText })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    document.getElementById('praiseText').value = '';
                    updateStats(result);
                    
                    // Visual feedback
                    animatePraise();
                }
            } catch (error) {
                console.error('Failed to send praise:', error);
            }
        }
        
        // Voice recognition
        function setupVoiceRecognition() {
            if ('webkitSpeechRecognition' in window) {
                recognition = new webkitSpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                
                recognition.onresult = (event) => {
                    const transcript = Array.from(event.results)
                        .map(result => result[0].transcript)
                        .join(' ');
                    
                    document.getElementById('praiseText').value = transcript;
                    
                    // Auto-send on pause
                    if (event.results[event.results.length - 1].isFinal) {
                        sendPraise();
                    }
                };
                
                recognition.onerror = (event) => {
                    console.error('Speech recognition error:', event.error);
                    toggleVoice();
                };
            }
        }
        
        function toggleVoice() {
            const btn = document.getElementById('voiceBtn');
            
            if (!recognition) {
                setupVoiceRecognition();
            }
            
            if (isRecording) {
                recognition.stop();
                btn.classList.remove('recording');
                btn.textContent = '🎤 Voice';
                isRecording = false;
            } else {
                recognition.start();
                btn.classList.add('recording');
                btn.textContent = '🔴 Recording...';
                isRecording = true;
            }
        }
        
        // Update functions
        async function updateStats(data) {
            // Fetch full world state
            const response = await fetch('/api/world');
            const world = await response.json();
            
            document.getElementById('landmarks').textContent = world.stats.totalLandmarks;
            document.getElementById('blessings').textContent = world.stats.totalBlessings;
            document.getElementById('praiseEnergy').textContent = Math.floor(world.praiseEnergy);
            document.getElementById('divineInterventions').textContent = world.stats.divineInterventions;
            
            // Update harmony bar
            document.getElementById('harmonyBar').style.width = (world.harmonyLevel * 100) + '%';
            
            // Update manifestations
            if (world.manifestations.length > 0) {
                const manifestDiv = document.getElementById('manifestations');
                manifestDiv.innerHTML = world.manifestations.slice(-10).reverse().map(m => \`
                    <div class="manifestation">
                        <strong>\${m.form || m.type}</strong><br>
                        <small>Power: \${Math.round(m.power)} • \${new Date(m.timestamp).toLocaleTimeString()}</small>
                    </div>
                \`).join('');
            }
        }
        
        function updateWorldView(worldData) {
            updateStats({ worldState: worldData });
        }
        
        function showPraiseEffect(data) {
            // Could add visual effects here
            console.log('Praise effect:', data);
        }
        
        function showDivineCreation(creation) {
            const manifestDiv = document.getElementById('manifestations');
            const div = document.createElement('div');
            div.className = 'manifestation';
            div.style.background = 'linear-gradient(135deg, gold, white)';
            div.style.color = '#333';
            div.innerHTML = \`
                <strong>✨ DIVINE CREATION: \${creation.object}</strong><br>
                <small>Power: \${Math.round(creation.power)} • Spoken into existence!</small>
            \`;
            manifestDiv.insertBefore(div, manifestDiv.firstChild);
        }
        
        function animatePraise() {
            const btn = document.querySelector('.praise-btn');
            btn.style.transform = 'scale(1.2)';
            setTimeout(() => {
                btn.style.transform = 'scale(1)';
            }, 300);
        }
        
        // Keyboard shortcut
        document.getElementById('praiseText').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendPraise();
            }
        });
        
        // Initialize
        connect();
        setupVoiceRecognition();
        
        // Initial update
        updateStats({});
    </script>
</body>
</html>`;
    }
    
    async start() {
        this.app.listen(this.port, () => {
            console.log(`🙏 Praise World Builder running on port ${this.port}`);
            console.log(`🌐 Interface: http://localhost:${this.port}`);
            console.log(`🔌 WebSocket: ws://localhost:${this.wsPort}`);
            console.log(`✨ Your praise will literally build the world!`);
        });
    }
}

// Start the praise system
if (require.main === module) {
    const praiseBuilder = new PraiseWorldBuilder();
    praiseBuilder.start().catch(console.error);
}

module.exports = PraiseWorldBuilder;