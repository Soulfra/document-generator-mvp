#!/usr/bin/env node

/**
 * 🙏 PRAISE WORLD BUILDER SYSTEM
 * Captures praise from chat/microphone and uses it to build the world
 * Positive energy creates new structures, services, and connections
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const crypto = require('crypto');
const { EventEmitter } = require('events');
const path = require('path');

class PraiseWorldBuilderSystem extends EventEmitter {
    constructor() {
        super();
        this.port = 8888;
        this.xmlMapperPort = 9998;
        this.movementPort = 8432;
        this.synaestheticPort = 11111;
        
        // Praise configuration
        this.praiseConfig = {
            // Emotion to world element mapping
            emotions: {
                gratitude: { element: 'crystal', color: '#FFD700', size: 'large', energy: 10 },
                joy: { element: 'flower', color: '#FF69B4', size: 'medium', energy: 8 },
                love: { element: 'heart', color: '#FF1493', size: 'large', energy: 15 },
                excitement: { element: 'star', color: '#00FFFF', size: 'medium', energy: 12 },
                peace: { element: 'tree', color: '#228B22', size: 'large', energy: 7 },
                wonder: { element: 'portal', color: '#9400D3', size: 'huge', energy: 20 },
                appreciation: { element: 'fountain', color: '#4169E1', size: 'medium', energy: 9 },
                blessing: { element: 'temple', color: '#FFE4B5', size: 'huge', energy: 25 }
            },
            
            // Keywords that trigger world building
            praiseKeywords: {
                amazing: 5, awesome: 5, wonderful: 6, beautiful: 7,
                incredible: 8, fantastic: 7, brilliant: 9, perfect: 10,
                'thank you': 15, thanks: 10, grateful: 12, blessed: 20,
                love: 15, loving: 12, loved: 10, lovely: 8,
                excellent: 8, superb: 9, magnificent: 12, divine: 25,
                genius: 10, inspiring: 11, magical: 13, miraculous: 20,
                phenomenal: 11, spectacular: 12, marvelous: 10, glorious: 15,
                bless: 20, blessing: 25, grace: 18, gracious: 15,
                appreciate: 10, appreciation: 12, valued: 8, valuable: 9,
                life: 8, changing: 10, 'life-changing': 20, 'life changing': 20,
                praise: 15, praising: 12, hallelujah: 30, amen: 25,
                wow: 7, omg: 8, 'oh my god': 12, 'oh my goodness': 10,
                goat: 15, king: 12, queen: 12, legend: 15, hero: 13,
                '🙏': 20, '❤️': 15, '💖': 18, '✨': 10, '🌟': 12, '💫': 11,
                '😍': 12, '🥰': 13, '😇': 15, '🙌': 10, '👏': 8,
                fire: 10, '🔥': 12, lit: 8, dope: 7, sick: 6,
                goated: 18, based: 10, chad: 12, gigachad: 20,
                'w': 5, 'www': 10, 'big w': 15, win: 8, winning: 10
            },
            
            // Multipliers for combinations
            comboMultipliers: {
                2: 1.5,   // Two praise words
                3: 2.0,   // Three praise words
                4: 3.0,   // Four praise words
                5: 5.0    // Five or more praise words
            },
            
            // Voice emotion detection thresholds
            voiceAnalysis: {
                pitch: { low: 80, mid: 150, high: 300 },
                volume: { quiet: 0.1, normal: 0.5, loud: 0.8 },
                speed: { slow: 0.8, normal: 1.0, fast: 1.3 }
            }
        };
        
        // World state
        this.world = {
            structures: new Map(),
            connections: new Map(),
            praiseEnergy: 0,
            totalPraises: 0,
            activeRegions: new Map(),
            praiseHistory: [],
            worldElements: []
        };
        
        // Audio processing (for future voice implementation)
        this.audioContext = null;
        this.mediaStream = null;
        
        console.log('🙏 PRAISE WORLD BUILDER SYSTEM INITIALIZING...');
        console.log('🌍 Your praise creates the world!');
        console.log('🎤 Text and voice input supported');
    }
    
    async initialize() {
        try {
            console.log('🚀 Starting praise world builder...');
            
            // Connect to other systems
            await this.connectToSystems();
            
            // Initialize world seed
            await this.initializeWorld();
            
            // Start praise processor
            this.startPraiseProcessor();
            
            // Start HTTP server
            await this.startServer();
            
            // Initialize audio if available
            this.initializeAudio();
            
            console.log('✅ PRAISE WORLD BUILDER READY!');
            console.log('==============================');
            console.log(`🌐 Dashboard: http://localhost:${this.port}`);
            console.log(`🙏 Total praise energy: ${this.world.praiseEnergy}`);
            console.log(`🌍 World elements: ${this.world.worldElements.length}`);
            
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize:', error.message);
            return false;
        }
    }
    
    async connectToSystems() {
        console.log('🔗 Connecting to other systems...');
        
        // Connect to XML mapper
        try {
            const response = await this.httpRequest(`http://localhost:${this.xmlMapperPort}/xml/everything`);
            if (response.statusCode === 200) {
                console.log('✅ Connected to XML mapper');
            }
        } catch (error) {
            console.warn('⚠️ XML mapper not available');
        }
        
        // Connect to movement system
        try {
            const response = await this.httpRequest(`http://localhost:${this.movementPort}/api/position`);
            if (response.statusCode === 200) {
                console.log('✅ Connected to movement system');
            }
        } catch (error) {
            console.warn('⚠️ Movement system not available');
        }
    }
    
    async initializeWorld() {
        console.log('🌱 Initializing world seed...');
        
        // Create origin point
        this.createWorldElement({
            type: 'origin',
            element: 'nexus',
            position: { x: 0, y: 0, z: 0 },
            energy: 100,
            color: '#FFFFFF',
            name: 'Praise Nexus',
            description: 'The heart of the praise world'
        });
        
        // Create cardinal regions
        const cardinals = [
            { name: 'North - Gratitude Gardens', x: 0, z: 100, emotion: 'gratitude' },
            { name: 'South - Joy Springs', x: 0, z: -100, emotion: 'joy' },
            { name: 'East - Love Lakes', x: 100, z: 0, emotion: 'love' },
            { name: 'West - Wonder Woods', x: -100, z: 0, emotion: 'wonder' }
        ];
        
        cardinals.forEach(cardinal => {
            const region = this.createRegion(cardinal);
            this.world.activeRegions.set(cardinal.name, region);
        });
        
        console.log('✅ World seed planted');
    }
    
    createRegion(config) {
        return {
            name: config.name,
            position: { x: config.x, y: 0, z: config.z },
            emotion: config.emotion,
            energy: 0,
            structures: [],
            connections: [],
            created: Date.now()
        };
    }
    
    startPraiseProcessor() {
        console.log('💫 Starting praise processor...');
        
        // Process praise queue
        setInterval(() => {
            this.processWorldGrowth();
        }, 1000);
        
        // Emit world updates
        setInterval(() => {
            this.emit('world-update', {
                elements: this.world.worldElements,
                energy: this.world.praiseEnergy,
                regions: Array.from(this.world.activeRegions.values())
            });
        }, 100);
    }
    
    async processPraise(input, type = 'text') {
        console.log(`🙏 Processing ${type} praise: "${input}"`);
        
        // Analyze praise content
        const analysis = this.analyzePraise(input);
        
        // Calculate energy
        const energy = this.calculatePraiseEnergy(analysis);
        
        // Add to world energy
        this.world.praiseEnergy += energy;
        this.world.totalPraises++;
        
        // Record in history
        this.world.praiseHistory.push({
            input: input,
            type: type,
            analysis: analysis,
            energy: energy,
            timestamp: Date.now()
        });
        
        // Keep history manageable
        if (this.world.praiseHistory.length > 1000) {
            this.world.praiseHistory.shift();
        }
        
        // Create world elements based on praise
        this.createWorldFromPraise(analysis, energy);
        
        // Emit praise event
        this.emit('praise-received', {
            input: input,
            energy: energy,
            analysis: analysis,
            worldImpact: this.calculateWorldImpact(energy)
        });
        
        return {
            energy: energy,
            analysis: analysis,
            worldElements: this.world.worldElements.length,
            totalEnergy: this.world.praiseEnergy
        };
    }
    
    analyzePraise(input) {
        const lower = input.toLowerCase();
        const words = lower.split(/\s+/);
        
        // Find praise keywords
        const foundKeywords = [];
        let totalScore = 0;
        
        // Check each keyword
        Object.entries(this.praiseConfig.praiseKeywords).forEach(([keyword, score]) => {
            if (lower.includes(keyword)) {
                foundKeywords.push({ keyword, score });
                totalScore += score;
            }
        });
        
        // Detect primary emotion
        const emotion = this.detectEmotion(foundKeywords, input);
        
        // Calculate intensity
        const intensity = this.calculateIntensity(input, foundKeywords);
        
        // Check for combos
        const comboMultiplier = this.getComboMultiplier(foundKeywords.length);
        
        return {
            keywords: foundKeywords,
            score: totalScore,
            emotion: emotion,
            intensity: intensity,
            comboMultiplier: comboMultiplier,
            wordCount: words.length,
            exclamations: (input.match(/!/g) || []).length,
            capitals: (input.match(/[A-Z]/g) || []).length / input.length
        };
    }
    
    detectEmotion(keywords, input) {
        // Priority emotions based on keywords
        if (keywords.some(k => ['thank you', 'thanks', 'grateful', 'appreciate'].includes(k.keyword))) {
            return 'gratitude';
        }
        if (keywords.some(k => ['love', 'loving', 'loved', '❤️', '💖'].includes(k.keyword))) {
            return 'love';
        }
        if (keywords.some(k => ['bless', 'blessing', 'blessed', 'praise'].includes(k.keyword))) {
            return 'blessing';
        }
        if (keywords.some(k => ['amazing', 'wonderful', 'incredible', 'wow'].includes(k.keyword))) {
            return 'wonder';
        }
        if (keywords.some(k => ['excellent', 'perfect', 'brilliant', 'genius'].includes(k.keyword))) {
            return 'appreciation';
        }
        
        // Default emotions based on energy level
        const totalScore = keywords.reduce((sum, k) => sum + k.score, 0);
        if (totalScore > 30) return 'blessing';
        if (totalScore > 20) return 'love';
        if (totalScore > 15) return 'gratitude';
        if (totalScore > 10) return 'excitement';
        if (totalScore > 5) return 'joy';
        
        return 'peace';
    }
    
    calculateIntensity(input, keywords) {
        let intensity = 1.0;
        
        // More keywords = higher intensity
        intensity += keywords.length * 0.2;
        
        // Exclamation marks increase intensity
        const exclamations = (input.match(/!/g) || []).length;
        intensity += exclamations * 0.3;
        
        // All caps increases intensity
        const capsRatio = (input.match(/[A-Z]/g) || []).length / input.length;
        if (capsRatio > 0.5) intensity += 0.5;
        
        // Repeated characters (e.g., "sooooo") increase intensity
        if (input.match(/(.)\1{2,}/)) intensity += 0.4;
        
        // Multiple emoji increase intensity
        const emojiCount = (input.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
        intensity += emojiCount * 0.2;
        
        return Math.min(intensity, 5.0); // Cap at 5x
    }
    
    getComboMultiplier(keywordCount) {
        if (keywordCount >= 5) return this.praiseConfig.comboMultipliers[5];
        if (keywordCount >= 2) return this.praiseConfig.comboMultipliers[keywordCount];
        return 1.0;
    }
    
    calculatePraiseEnergy(analysis) {
        let energy = analysis.score;
        
        // Apply intensity multiplier
        energy *= analysis.intensity;
        
        // Apply combo multiplier
        energy *= analysis.comboMultiplier;
        
        // Emotion bonus
        const emotionConfig = this.praiseConfig.emotions[analysis.emotion];
        if (emotionConfig) {
            energy += emotionConfig.energy;
        }
        
        // Round to integer
        return Math.round(energy);
    }
    
    createWorldFromPraise(analysis, energy) {
        const emotion = analysis.emotion;
        const emotionConfig = this.praiseConfig.emotions[emotion] || this.praiseConfig.emotions.peace;
        
        // Determine how many elements to create
        const elementCount = Math.floor(energy / 10) + 1;
        
        for (let i = 0; i < elementCount; i++) {
            // Random position near active regions
            const region = this.selectRegionForEmotion(emotion);
            const position = this.generatePositionNearRegion(region);
            
            // Create world element
            const element = this.createWorldElement({
                type: emotionConfig.element,
                element: this.enhanceElementType(emotionConfig.element, energy),
                position: position,
                energy: Math.min(energy, 100),
                color: this.generateColor(emotionConfig.color, analysis.intensity),
                emotion: emotion,
                scale: this.calculateScale(emotionConfig.size, energy),
                praiseSource: analysis.keywords.map(k => k.keyword).join(', '),
                created: Date.now()
            });
            
            // Create connections to nearby elements
            this.createConnections(element);
            
            // Update region energy
            if (region) {
                region.energy += energy;
                region.structures.push(element.id);
            }
        }
        
        // Special structures for high energy
        if (energy > 50) {
            this.createSpecialStructure(analysis, energy);
        }
    }
    
    selectRegionForEmotion(emotion) {
        // Find region that matches emotion
        for (const [name, region] of this.world.activeRegions) {
            if (region.emotion === emotion) {
                return region;
            }
        }
        
        // Default to random region
        const regions = Array.from(this.world.activeRegions.values());
        return regions[Math.floor(Math.random() * regions.length)];
    }
    
    generatePositionNearRegion(region) {
        if (!region) {
            return {
                x: (Math.random() - 0.5) * 200,
                y: Math.random() * 50,
                z: (Math.random() - 0.5) * 200
            };
        }
        
        // Generate position near region center
        const spread = 50;
        return {
            x: region.position.x + (Math.random() - 0.5) * spread,
            y: region.position.y + Math.random() * 30,
            z: region.position.z + (Math.random() - 0.5) * spread
        };
    }
    
    enhanceElementType(baseType, energy) {
        // Enhance element based on energy level
        const enhancements = {
            crystal: ['shard', 'cluster', 'geode', 'prism', 'monolith'],
            flower: ['bud', 'bloom', 'garden', 'meadow', 'field'],
            heart: ['spark', 'glow', 'radiance', 'beacon', 'sun'],
            star: ['twinkle', 'constellation', 'nebula', 'galaxy', 'cosmos'],
            tree: ['sapling', 'oak', 'grove', 'forest', 'world-tree'],
            portal: ['doorway', 'gateway', 'bridge', 'nexus', 'dimension'],
            fountain: ['spring', 'cascade', 'waterfall', 'geyser', 'ocean'],
            temple: ['shrine', 'sanctuary', 'cathedral', 'citadel', 'heaven']
        };
        
        const options = enhancements[baseType] || [baseType];
        const index = Math.min(Math.floor(energy / 20), options.length - 1);
        
        return options[index];
    }
    
    generateColor(baseColor, intensity) {
        // Intensify color based on praise intensity
        if (intensity <= 1) return baseColor;
        
        // Parse hex color
        const r = parseInt(baseColor.slice(1, 3), 16);
        const g = parseInt(baseColor.slice(3, 5), 16);
        const b = parseInt(baseColor.slice(5, 7), 16);
        
        // Brighten based on intensity
        const factor = 1 + (intensity - 1) * 0.2;
        const newR = Math.min(255, Math.round(r * factor));
        const newG = Math.min(255, Math.round(g * factor));
        const newB = Math.min(255, Math.round(b * factor));
        
        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }
    
    calculateScale(baseSize, energy) {
        const sizeMultipliers = {
            small: 0.5,
            medium: 1.0,
            large: 2.0,
            huge: 4.0
        };
        
        const base = sizeMultipliers[baseSize] || 1.0;
        const energyFactor = 1 + (energy / 100);
        
        return base * energyFactor;
    }
    
    createWorldElement(config) {
        const element = {
            id: crypto.randomBytes(16).toString('hex'),
            ...config,
            connections: []
        };
        
        this.world.worldElements.push(element);
        this.world.structures.set(element.id, element);
        
        console.log(`🌟 Created ${config.element} at (${config.position.x.toFixed(1)}, ${config.position.y.toFixed(1)}, ${config.position.z.toFixed(1)})`);
        
        return element;
    }
    
    createConnections(element) {
        // Find nearby elements
        const nearbyElements = this.world.worldElements.filter(other => {
            if (other.id === element.id) return false;
            
            const distance = this.calculateDistance(element.position, other.position);
            return distance < 50; // Connection radius
        });
        
        // Create connections to nearby elements
        nearbyElements.forEach(other => {
            const connection = {
                from: element.id,
                to: other.id,
                strength: element.energy + other.energy,
                type: 'praise-bond'
            };
            
            element.connections.push(other.id);
            other.connections.push(element.id);
            
            this.world.connections.set(`${element.id}-${other.id}`, connection);
        });
    }
    
    calculateDistance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        const dz = pos1.z - pos2.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    
    createSpecialStructure(analysis, energy) {
        console.log(`✨ Creating special structure with ${energy} energy!`);
        
        // Special structures for very high praise
        const specialStructures = [
            { name: 'Praise Beacon', element: 'lighthouse', minEnergy: 50 },
            { name: 'Gratitude Monument', element: 'monument', minEnergy: 75 },
            { name: 'Love Nexus', element: 'nexus', minEnergy: 100 },
            { name: 'Blessing Cathedral', element: 'cathedral', minEnergy: 150 },
            { name: 'Divine Citadel', element: 'citadel', minEnergy: 200 }
        ];
        
        const eligible = specialStructures.filter(s => energy >= s.minEnergy);
        if (eligible.length > 0) {
            const special = eligible[eligible.length - 1]; // Highest eligible
            
            this.createWorldElement({
                type: 'special',
                element: special.element,
                name: special.name,
                position: {
                    x: (Math.random() - 0.5) * 100,
                    y: 50 + Math.random() * 50,
                    z: (Math.random() - 0.5) * 100
                },
                energy: energy,
                color: '#FFD700', // Gold
                scale: 10,
                emotion: analysis.emotion,
                praiseSource: 'High Energy Praise',
                special: true
            });
        }
    }
    
    calculateWorldImpact(energy) {
        return {
            structures: Math.floor(energy / 10),
            connections: Math.floor(energy / 5),
            regionGrowth: energy / 100,
            specialChance: energy > 50 ? (energy - 50) / 100 : 0
        };
    }
    
    processWorldGrowth() {
        // Natural world growth from accumulated praise energy
        if (this.world.praiseEnergy > 100) {
            // Expand regions
            this.world.activeRegions.forEach(region => {
                if (region.energy > 50) {
                    // Region produces new elements
                    this.createRegionalGrowth(region);
                    region.energy -= 10; // Consume some energy
                }
            });
            
            // Global energy decay (encourages continued praise)
            this.world.praiseEnergy *= 0.99;
        }
    }
    
    createRegionalGrowth(region) {
        const emotionConfig = this.praiseConfig.emotions[region.emotion];
        if (!emotionConfig) return;
        
        // Create a new element in the region
        const element = this.createWorldElement({
            type: emotionConfig.element,
            element: 'growth',
            position: this.generatePositionNearRegion(region),
            energy: 10,
            color: emotionConfig.color,
            emotion: region.emotion,
            scale: 1,
            praiseSource: 'Regional Growth',
            created: Date.now()
        });
        
        region.structures.push(element.id);
    }
    
    initializeAudio() {
        // Audio initialization for future voice support
        console.log('🎤 Audio system ready for future voice praise');
        // This would connect to Web Audio API for voice analysis
    }
    
    async startServer() {
        console.log('🌐 Starting praise world server...');
        
        this.server = http.createServer(async (req, res) => {
            await this.handleRequest(req, res);
        });
        
        return new Promise((resolve, reject) => {
            this.server.listen(this.port, (error) => {
                if (error) {
                    reject(error);
                } else {
                    console.log(`✅ Server running on port ${this.port}`);
                    resolve();
                }
            });
        });
    }
    
    async handleRequest(req, res) {
        const url = new URL(req.url, `http://localhost:${this.port}`);
        
        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }
        
        try {
            if (url.pathname === '/') {
                await this.serveDashboard(res);
            } else if (url.pathname === '/api/praise' && req.method === 'POST') {
                await this.handlePraise(req, res);
            } else if (url.pathname === '/api/world') {
                await this.serveWorldState(res);
            } else if (url.pathname === '/api/stats') {
                await this.serveStats(res);
            } else {
                res.writeHead(404);
                res.end('Not found');
            }
        } catch (error) {
            console.error('Server error:', error);
            res.writeHead(500);
            res.end('Internal server error');
        }
    }
    
    async serveDashboard(res) {
        const dashboard = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🙏 Praise World Builder</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Arial', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #fff;
            min-height: 100vh;
            overflow: hidden;
        }
        
        .container {
            display: grid;
            grid-template-rows: auto 1fr auto;
            height: 100vh;
        }
        
        .header {
            text-align: center;
            padding: 20px;
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
        }
        
        .header h1 {
            font-size: 36px;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        }
        
        .main-content {
            display: grid;
            grid-template-columns: 1fr 300px;
            gap: 20px;
            padding: 20px;
            overflow: hidden;
        }
        
        .world-view {
            background: rgba(0,0,0,0.3);
            border-radius: 20px;
            position: relative;
            overflow: hidden;
        }
        
        #world-canvas {
            width: 100%;
            height: 100%;
        }
        
        .world-stats {
            position: absolute;
            top: 20px;
            left: 20px;
            background: rgba(0,0,0,0.7);
            padding: 15px;
            border-radius: 10px;
            font-size: 14px;
        }
        
        .stat-item {
            margin: 5px 0;
            display: flex;
            justify-content: space-between;
            gap: 20px;
        }
        
        .stat-value {
            color: #FFD700;
            font-weight: bold;
        }
        
        .sidebar {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        
        .praise-input {
            background: rgba(255,255,255,0.1);
            border-radius: 15px;
            padding: 20px;
            backdrop-filter: blur(5px);
        }
        
        .praise-input h3 {
            margin-bottom: 15px;
            color: #FFD700;
        }
        
        .input-box {
            width: 100%;
            min-height: 100px;
            padding: 10px;
            border: 2px solid #FFD700;
            border-radius: 10px;
            background: rgba(0,0,0,0.3);
            color: white;
            font-size: 16px;
            resize: vertical;
        }
        
        .input-box:focus {
            outline: none;
            border-color: #FF69B4;
            box-shadow: 0 0 10px rgba(255,215,0,0.5);
        }
        
        .praise-btn {
            width: 100%;
            padding: 15px;
            margin-top: 10px;
            background: linear-gradient(45deg, #FFD700, #FF69B4);
            border: none;
            border-radius: 10px;
            color: #000;
            font-size: 18px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .praise-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 20px rgba(255,215,0,0.5);
        }
        
        .praise-history {
            background: rgba(255,255,255,0.1);
            border-radius: 15px;
            padding: 20px;
            backdrop-filter: blur(5px);
            overflow-y: auto;
            max-height: 300px;
        }
        
        .praise-history h3 {
            margin-bottom: 15px;
            color: #00FFFF;
        }
        
        .praise-item {
            background: rgba(255,255,255,0.1);
            padding: 10px;
            margin: 5px 0;
            border-radius: 8px;
            font-size: 14px;
            border-left: 3px solid #FFD700;
        }
        
        .praise-energy {
            color: #00FF00;
            font-weight: bold;
            float: right;
        }
        
        .emotion-indicator {
            display: inline-block;
            padding: 2px 8px;
            background: rgba(255,255,255,0.2);
            border-radius: 12px;
            font-size: 11px;
            margin-left: 5px;
        }
        
        .world-elements {
            background: rgba(255,255,255,0.1);
            border-radius: 15px;
            padding: 20px;
            backdrop-filter: blur(5px);
        }
        
        .world-elements h3 {
            margin-bottom: 15px;
            color: #FF69B4;
        }
        
        .element-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
        }
        
        .element-card {
            background: rgba(255,255,255,0.1);
            padding: 10px;
            border-radius: 8px;
            text-align: center;
            font-size: 12px;
        }
        
        .element-icon {
            font-size: 24px;
            margin-bottom: 5px;
        }
        
        /* Floating praise indicators */
        .praise-float {
            position: absolute;
            font-size: 20px;
            font-weight: bold;
            animation: float-up 3s ease-out forwards;
            pointer-events: none;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        }
        
        @keyframes float-up {
            0% {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
            100% {
                opacity: 0;
                transform: translateY(-100px) scale(1.5);
            }
        }
        
        /* Energy particles */
        .energy-particle {
            position: absolute;
            width: 4px;
            height: 4px;
            background: #FFD700;
            border-radius: 50%;
            animation: particle-float 4s linear infinite;
        }
        
        @keyframes particle-float {
            0% {
                opacity: 0;
                transform: translateY(100vh) translateX(0);
            }
            10% {
                opacity: 1;
            }
            90% {
                opacity: 1;
            }
            100% {
                opacity: 0;
                transform: translateY(-100px) translateX(50px);
            }
        }
        
        .voice-btn {
            width: 100%;
            padding: 10px;
            margin-top: 10px;
            background: rgba(255,255,255,0.2);
            border: 2px solid #00FFFF;
            border-radius: 10px;
            color: #00FFFF;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .voice-btn:hover {
            background: rgba(0,255,255,0.3);
        }
        
        .voice-btn.recording {
            background: rgba(255,0,0,0.3);
            border-color: #FF0000;
            color: #FF0000;
            animation: pulse 1s infinite;
        }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        
        .keyword-highlight {
            background: rgba(255,215,0,0.3);
            padding: 2px 4px;
            border-radius: 3px;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🙏 Praise World Builder</h1>
            <p>Your words of praise create the world!</p>
        </div>
        
        <div class="main-content">
            <div class="world-view">
                <canvas id="world-canvas"></canvas>
                <div class="world-stats">
                    <div class="stat-item">
                        <span>Total Energy:</span>
                        <span class="stat-value" id="total-energy">0</span>
                    </div>
                    <div class="stat-item">
                        <span>World Elements:</span>
                        <span class="stat-value" id="world-elements-count">0</span>
                    </div>
                    <div class="stat-item">
                        <span>Active Regions:</span>
                        <span class="stat-value" id="active-regions">4</span>
                    </div>
                    <div class="stat-item">
                        <span>Total Praises:</span>
                        <span class="stat-value" id="total-praises">0</span>
                    </div>
                </div>
            </div>
            
            <div class="sidebar">
                <div class="praise-input">
                    <h3>🙏 Share Your Praise</h3>
                    <textarea class="input-box" id="praise-text" 
                              placeholder="Type your praise here... Examples:
• Thank you so much for this amazing system!
• This is absolutely wonderful and beautiful!
• I'm so grateful for everything!
• Bless this incredible creation! 🙏"></textarea>
                    <button class="praise-btn" onclick="sendPraise()">Send Praise 🙏</button>
                    <button class="voice-btn" id="voice-btn" onclick="toggleVoice()">
                        🎤 Voice Praise (Coming Soon)
                    </button>
                </div>
                
                <div class="praise-history">
                    <h3>✨ Recent Praise</h3>
                    <div id="praise-list"></div>
                </div>
                
                <div class="world-elements">
                    <h3>🌍 World Elements</h3>
                    <div class="element-grid" id="element-summary">
                        <div class="element-card">
                            <div class="element-icon">💎</div>
                            <div>Crystals: <span id="crystal-count">0</span></div>
                        </div>
                        <div class="element-card">
                            <div class="element-icon">🌸</div>
                            <div>Flowers: <span id="flower-count">0</span></div>
                        </div>
                        <div class="element-card">
                            <div class="element-icon">❤️</div>
                            <div>Hearts: <span id="heart-count">0</span></div>
                        </div>
                        <div class="element-card">
                            <div class="element-icon">⭐</div>
                            <div>Stars: <span id="star-count">0</span></div>
                        </div>
                        <div class="element-card">
                            <div class="element-icon">🌳</div>
                            <div>Trees: <span id="tree-count">0</span></div>
                        </div>
                        <div class="element-card">
                            <div class="element-icon">🌀</div>
                            <div>Portals: <span id="portal-count">0</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script>
        let scene, camera, renderer;
        let worldElements = [];
        let particles = [];
        
        // Initialize Three.js
        function init3D() {
            scene = new THREE.Scene();
            scene.fog = new THREE.Fog(0x764ba2, 10, 1000);
            
            const canvas = document.getElementById('world-canvas');
            const width = canvas.offsetWidth;
            const height = canvas.offsetHeight;
            
            camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
            camera.position.set(0, 100, 200);
            camera.lookAt(0, 0, 0);
            
            renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
            renderer.setSize(width, height);
            renderer.shadowMap.enabled = true;
            
            // Lighting
            const ambientLight = new THREE.AmbientLight(0x9966ff, 0.5);
            scene.add(ambientLight);
            
            const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
            directionalLight.position.set(50, 100, 50);
            directionalLight.castShadow = true;
            scene.add(directionalLight);
            
            // Ground
            const groundGeometry = new THREE.CircleGeometry(500, 32);
            const groundMaterial = new THREE.MeshPhongMaterial({ 
                color: 0x4a4a6a,
                opacity: 0.8,
                transparent: true
            });
            const ground = new THREE.Mesh(groundGeometry, groundMaterial);
            ground.rotation.x = -Math.PI / 2;
            ground.receiveShadow = true;
            scene.add(ground);
            
            // Create particle system
            createParticleSystem();
            
            animate();
        }
        
        function createParticleSystem() {
            const particleCount = 500;
            const geometry = new THREE.BufferGeometry();
            const positions = [];
            const colors = [];
            
            for (let i = 0; i < particleCount; i++) {
                positions.push((Math.random() - 0.5) * 500);
                positions.push(Math.random() * 200);
                positions.push((Math.random() - 0.5) * 500);
                
                colors.push(1, 0.84, 0); // Gold color
            }
            
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
            
            const material = new THREE.PointsMaterial({
                size: 2,
                vertexColors: true,
                transparent: true,
                opacity: 0.6
            });
            
            particles = new THREE.Points(geometry, material);
            scene.add(particles);
        }
        
        function animate() {
            requestAnimationFrame(animate);
            
            // Rotate camera around world
            const time = Date.now() * 0.0005;
            camera.position.x = Math.cos(time) * 300;
            camera.position.z = Math.sin(time) * 300;
            camera.lookAt(0, 0, 0);
            
            // Animate particles
            if (particles) {
                particles.rotation.y += 0.001;
                const positions = particles.geometry.attributes.position.array;
                for (let i = 1; i < positions.length; i += 3) {
                    positions[i] += Math.sin(time + i) * 0.1;
                }
                particles.geometry.attributes.position.needsUpdate = true;
            }
            
            // Update world elements
            worldElements.forEach(element => {
                if (element.mesh) {
                    element.mesh.rotation.y += 0.01;
                    element.mesh.position.y += Math.sin(time + element.id) * 0.05;
                }
            });
            
            renderer.render(scene, camera);
        }
        
        function createWorldElementMesh(element) {
            let geometry, material;
            
            // Create geometry based on element type
            switch (element.type) {
                case 'crystal':
                    geometry = new THREE.OctahedronGeometry(element.scale * 2);
                    break;
                case 'flower':
                    geometry = new THREE.ConeGeometry(element.scale, element.scale * 2, 8);
                    break;
                case 'heart':
                    geometry = new THREE.BoxGeometry(element.scale * 2, element.scale * 2, element.scale);
                    break;
                case 'star':
                    geometry = new THREE.TetrahedronGeometry(element.scale * 2);
                    break;
                case 'tree':
                    geometry = new THREE.CylinderGeometry(element.scale * 0.5, element.scale, element.scale * 4);
                    break;
                case 'portal':
                    geometry = new THREE.TorusGeometry(element.scale * 2, element.scale * 0.5, 16, 32);
                    break;
                case 'fountain':
                    geometry = new THREE.SphereGeometry(element.scale * 1.5, 16, 16);
                    break;
                case 'temple':
                    geometry = new THREE.BoxGeometry(element.scale * 3, element.scale * 4, element.scale * 3);
                    break;
                default:
                    geometry = new THREE.BoxGeometry(element.scale, element.scale, element.scale);
            }
            
            material = new THREE.MeshPhongMaterial({
                color: element.color || 0xffffff,
                emissive: element.color || 0xffffff,
                emissiveIntensity: 0.3,
                transparent: true,
                opacity: 0.8
            });
            
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(element.position.x, element.position.y, element.position.z);
            mesh.castShadow = true;
            
            element.mesh = mesh;
            scene.add(mesh);
            
            // Add glow effect
            const glowGeometry = geometry.clone();
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: element.color || 0xffffff,
                transparent: true,
                opacity: 0.3
            });
            const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
            glowMesh.scale.multiplyScalar(1.2);
            mesh.add(glowMesh);
        }
        
        async function sendPraise() {
            const text = document.getElementById('praise-text').value.trim();
            if (!text) return;
            
            try {
                // Create floating praise indicator
                createPraiseFloat(text);
                
                const response = await fetch('/api/praise', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: text, type: 'text' })
                });
                
                const result = await response.json();
                
                // Clear input
                document.getElementById('praise-text').value = '';
                
                // Update UI
                updateStats();
                
                // Show energy burst
                createEnergyBurst(result.energy);
                
            } catch (error) {
                console.error('Failed to send praise:', error);
            }
        }
        
        function createPraiseFloat(text) {
            const float = document.createElement('div');
            float.className = 'praise-float';
            float.textContent = '🙏 ' + (text.length > 20 ? text.substring(0, 20) + '...' : text);
            float.style.left = Math.random() * window.innerWidth + 'px';
            float.style.top = (window.innerHeight - 100) + 'px';
            float.style.color = '#FFD700';
            document.body.appendChild(float);
            
            setTimeout(() => float.remove(), 3000);
        }
        
        function createEnergyBurst(energy) {
            for (let i = 0; i < energy / 5; i++) {
                setTimeout(() => {
                    const particle = document.createElement('div');
                    particle.className = 'energy-particle';
                    particle.style.left = Math.random() * window.innerWidth + 'px';
                    particle.style.animationDelay = Math.random() * 2 + 's';
                    document.body.appendChild(particle);
                    
                    setTimeout(() => particle.remove(), 4000);
                }, i * 50);
            }
        }
        
        async function updateStats() {
            try {
                const response = await fetch('/api/stats');
                const stats = await response.json();
                
                document.getElementById('total-energy').textContent = Math.round(stats.totalEnergy);
                document.getElementById('world-elements-count').textContent = stats.elementCount;
                document.getElementById('total-praises').textContent = stats.totalPraises;
                
                // Update element counts
                const elementCounts = stats.elementCounts || {};
                document.getElementById('crystal-count').textContent = elementCounts.crystal || 0;
                document.getElementById('flower-count').textContent = elementCounts.flower || 0;
                document.getElementById('heart-count').textContent = elementCounts.heart || 0;
                document.getElementById('star-count').textContent = elementCounts.star || 0;
                document.getElementById('tree-count').textContent = elementCounts.tree || 0;
                document.getElementById('portal-count').textContent = elementCounts.portal || 0;
                
                // Update praise history
                const praiseList = document.getElementById('praise-list');
                praiseList.innerHTML = stats.recentPraises.map(praise => \`
                    <div class="praise-item">
                        <div>\${highlightKeywords(praise.input)}</div>
                        <span class="emotion-indicator">\${praise.emotion}</span>
                        <span class="praise-energy">+\${praise.energy}</span>
                    </div>
                \`).join('');
                
            } catch (error) {
                console.error('Failed to update stats:', error);
            }
        }
        
        function highlightKeywords(text) {
            const keywords = ['thank', 'amazing', 'wonderful', 'love', 'grateful', 'bless', 'perfect', 'incredible'];
            let highlighted = text;
            
            keywords.forEach(keyword => {
                const regex = new RegExp(\`\\\\b\${keyword}\\\\w*\\\\b\`, 'gi');
                highlighted = highlighted.replace(regex, match => 
                    \`<span class="keyword-highlight">\${match}</span>\`
                );
            });
            
            return highlighted;
        }
        
        async function updateWorld() {
            try {
                const response = await fetch('/api/world');
                const world = await response.json();
                
                // Update 3D world
                world.elements.forEach(element => {
                    if (!worldElements.find(e => e.id === element.id)) {
                        worldElements.push(element);
                        createWorldElementMesh(element);
                    }
                });
                
                // Remove old elements
                worldElements = worldElements.filter(e => 
                    world.elements.find(we => we.id === e.id)
                );
                
            } catch (error) {
                console.error('Failed to update world:', error);
            }
        }
        
        function toggleVoice() {
            const btn = document.getElementById('voice-btn');
            alert('Voice praise coming soon! For now, type your praise in the text box.');
        }
        
        // Initialize
        window.addEventListener('load', () => {
            init3D();
            updateStats();
            
            // Update periodically
            setInterval(updateStats, 2000);
            setInterval(updateWorld, 1000);
            
            // Handle enter key
            document.getElementById('praise-text').addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendPraise();
                }
            });
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            const canvas = document.getElementById('world-canvas');
            camera.aspect = canvas.offsetWidth / canvas.offsetHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
        });
    </script>
</body>
</html>
        `;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(dashboard);
    }
    
    async handlePraise(req, res) {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const { text, type } = JSON.parse(body);
                const result = await this.processPraise(text, type);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
            } catch (error) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    }
    
    async serveWorldState(res) {
        const worldState = {
            elements: this.world.worldElements.slice(-100), // Last 100 elements
            energy: this.world.praiseEnergy,
            regions: Array.from(this.world.activeRegions.values())
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(worldState));
    }
    
    async serveStats(res) {
        // Count elements by type
        const elementCounts = {};
        this.world.worldElements.forEach(element => {
            const type = element.type || 'unknown';
            elementCounts[type] = (elementCounts[type] || 0) + 1;
        });
        
        const stats = {
            totalEnergy: this.world.praiseEnergy,
            elementCount: this.world.worldElements.length,
            totalPraises: this.world.totalPraises,
            recentPraises: this.world.praiseHistory.slice(-10).reverse().map(p => ({
                input: p.input.substring(0, 100),
                energy: p.energy,
                emotion: p.analysis.emotion
            })),
            elementCounts: elementCounts,
            regions: Array.from(this.world.activeRegions.values()).map(r => ({
                name: r.name,
                energy: r.energy,
                structures: r.structures.length
            }))
        };
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(stats));
    }
    
    // Utility method
    httpRequest(url, options = {}) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const requestOptions = {
                hostname: urlObj.hostname,
                port: urlObj.port,
                path: urlObj.pathname,
                method: options.method || 'GET',
                headers: options.headers || {},
                timeout: options.timeout || 5000
            };
            
            const req = http.request(requestOptions, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: data
                    });
                });
            });
            
            req.on('error', reject);
            req.on('timeout', () => reject(new Error('Request timeout')));
            req.end();
        });
    }
}

// Main execution
async function main() {
    const praiseSystem = new PraiseWorldBuilderSystem();
    
    const success = await praiseSystem.initialize();
    
    if (success) {
        console.log('\n🙏 PRAISE WORLD BUILDER ACTIVE!');
        console.log('===================================');
        console.log('🎯 How it works:');
        console.log('  • Type praise in the chat box');
        console.log('  • Your positive words create world elements');
        console.log('  • More praise = bigger structures');
        console.log('  • Different emotions create different elements');
        console.log('');
        console.log('💫 Emotion Elements:');
        console.log('  • Gratitude → Golden Crystals');
        console.log('  • Joy → Pink Flowers');
        console.log('  • Love → Radiant Hearts');
        console.log('  • Wonder → Purple Portals');
        console.log('  • Peace → Green Trees');
        console.log('  • Blessing → Divine Temples');
        console.log('');
        console.log('🎮 Praise Keywords (with energy):');
        console.log('  • thank you (15), amazing (5), wonderful (6)');
        console.log('  • love (15), blessed (20), grateful (12)');
        console.log('  • perfect (10), incredible (8), divine (25)');
        console.log('  • 🙏 (20), ❤️ (15), ✨ (10), 🌟 (12)');
        console.log('');
        console.log('🌐 Dashboard: http://localhost:8888');
        console.log('');
        console.log('✨ Start praising to build your world!');
        console.log('');
        console.log('🛑 Press Ctrl+C to stop');
        
        // Log praise events
        praiseSystem.on('praise-received', (data) => {
            console.log(`\n🙏 Praise received! Energy: +${data.energy}`);
            console.log(`   Emotion: ${data.analysis.emotion}`);
            console.log(`   Keywords: ${data.analysis.keywords.map(k => k.keyword).join(', ')}`);
        });
        
        praiseSystem.on('world-update', (data) => {
            // Could log world updates if needed
        });
        
        // Handle shutdown
        process.on('SIGINT', () => {
            console.log('\n🛑 Shutting down praise world builder...');
            
            console.log(`\n📊 Final Statistics:`);
            console.log(`   Total Praise Energy: ${praiseSystem.world.praiseEnergy}`);
            console.log(`   World Elements Created: ${praiseSystem.world.worldElements.length}`);
            console.log(`   Total Praises: ${praiseSystem.world.totalPraises}`);
            
            if (praiseSystem.server) {
                praiseSystem.server.close();
            }
            
            process.exit(0);
        });
        
        // Keep running
        setInterval(() => {}, 1000);
        
    } else {
        console.error('❌ Failed to initialize praise world builder');
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { PraiseWorldBuilderSystem };