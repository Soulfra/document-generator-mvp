#!/usr/bin/env node

/**
 * 🎯 TEMPLATE MATCHING ENGINE
 * Matches NLP intents to appropriate templates
 * Generates content based on templates and parameters
 */

const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');
const sqlite3 = require('sqlite3').verbose();

class TemplateMatchingEngine extends EventEmitter {
    constructor() {
        super();
        
        this.port = 7784;
        this.dbPath = path.join(__dirname, 'templates.db');
        
        // Template categories
        this.categories = {
            '3d-objects': {
                name: '3D Objects',
                description: 'Boats, buildings, vehicles, characters',
                generator: this.generate3DObject.bind(this)
            },
            'music-profiles': {
                name: 'Music Profiles', 
                description: 'Spotify wrapped, music compatibility',
                generator: this.generateMusicProfile.bind(this)
            },
            'events': {
                name: 'Events',
                description: 'Concerts, meetups, verified fan experiences',
                generator: this.generateEvent.bind(this)
            },
            'profiles': {
                name: 'User Profiles',
                description: 'Soulfra profiles, personal spaces',
                generator: this.generateProfile.bind(this)
            },
            'games': {
                name: 'Games',
                description: 'Interactive experiences, mini-games',
                generator: this.generateGame.bind(this)
            }
        };
        
        // Template library
        this.templates = new Map();
        
        // Matching statistics
        this.stats = {
            templatesLoaded: 0,
            matchesFound: 0,
            contentGenerated: 0,
            errors: 0
        };
        
        console.log('🎯 Template Matching Engine initializing...');
        this.initialize();
    }
    
    async initialize() {
        // Initialize database
        await this.initializeDatabase();
        
        // Load templates
        await this.loadTemplates();
        
        // Start API server
        this.startServer();
        
        console.log('✅ Template Matching Engine ready!');
    }
    
    async initializeDatabase() {
        this.db = new sqlite3.Database(this.dbPath);
        
        await this.runQuery(`
            CREATE TABLE IF NOT EXISTS templates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                type TEXT NOT NULL,
                description TEXT,
                parameters JSON,
                preview_url TEXT,
                usage_count INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        await this.runQuery(`
            CREATE TABLE IF NOT EXISTS template_matches (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                intent_type TEXT,
                template_id INTEGER,
                confidence REAL,
                matched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (template_id) REFERENCES templates(id)
            )
        `);
        
        console.log('💾 Template database initialized');
    }
    
    runQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve(this);
            });
        });
    }
    
    async loadTemplates() {
        // Load built-in templates
        const builtInTemplates = [
            // 3D Objects
            {
                name: 'Pirate Ship',
                category: '3d-objects',
                type: 'boat',
                description: 'Customizable pirate ship with weapons',
                parameters: {
                    size: ['small', 'medium', 'large'],
                    armaments: ['cannons', 'ballistas', 'harpoons'],
                    features: ['mast', 'sails', 'crow_nest', 'plank'],
                    style: ['weathered', 'pristine', 'ghostly', 'steampunk']
                }
            },
            {
                name: 'Medieval Castle',
                category: '3d-objects',
                type: 'building',
                description: 'Fortified castle with defensive structures',
                parameters: {
                    size: ['keep', 'fortress', 'citadel'],
                    defenses: ['walls', 'moat', 'towers', 'gates'],
                    style: ['stone', 'wood', 'fantasy', 'ruined']
                }
            },
            {
                name: 'Character Creator',
                category: '3d-objects',
                type: 'character',
                description: 'Customizable 3D character',
                parameters: {
                    race: ['human', 'elf', 'dwarf', 'orc'],
                    class: ['warrior', 'mage', 'rogue', 'ranger'],
                    equipment: ['armor', 'weapons', 'accessories']
                }
            },
            
            // Music Profiles
            {
                name: 'Spotify Wrapped Clone',
                category: 'music-profiles',
                type: 'wrapped',
                description: 'Personal music summary visualization',
                parameters: {
                    timeframe: ['weekly', 'monthly', 'yearly'],
                    metrics: ['top_songs', 'top_artists', 'genres', 'minutes_listened'],
                    style: ['classic', 'neon', 'minimal', 'animated']
                }
            },
            {
                name: 'Music Compatibility',
                category: 'music-profiles',
                type: 'compatibility',
                description: 'Compare music tastes between users',
                parameters: {
                    users: 2,
                    comparison: ['genres', 'artists', 'energy', 'mood'],
                    visualization: ['venn', 'radar', 'heatmap']
                }
            },
            
            // Events
            {
                name: 'Concert Verification',
                category: 'events',
                type: 'concert',
                description: 'Verified fan system for concerts',
                parameters: {
                    verification: ['qr_code', 'nfc', 'facial'],
                    perks: ['early_entry', 'meet_greet', 'exclusive_merch'],
                    integration: ['ticketmaster', 'eventbrite', 'custom']
                }
            },
            {
                name: 'P2P Meetup',
                category: 'events',
                type: 'meetup',
                description: 'Peer-to-peer verification for meetups',
                parameters: {
                    method: ['qr_code', 'bluetooth', 'sound_beacon'],
                    features: ['chat', 'location_share', 'group_finder']
                }
            },
            
            // Profiles
            {
                name: 'Soulfra Profile',
                category: 'profiles',
                type: 'soulfra',
                description: 'Personal profile with integrations',
                parameters: {
                    sections: ['bio', 'music', 'games', 'achievements'],
                    integrations: ['spotify', 'discord', 'steam', 'twitter'],
                    theme: ['dark', 'light', 'custom']
                }
            },
            
            // Games
            {
                name: 'Rhythm Battle',
                category: 'games',
                type: 'music-game',
                description: 'Music-based battle game',
                parameters: {
                    mode: ['solo', 'versus', 'coop'],
                    difficulty: ['easy', 'medium', 'hard', 'expert'],
                    music_source: ['spotify', 'soundcloud', 'local']
                }
            }
        ];
        
        // Insert templates into database
        for (const template of builtInTemplates) {
            await this.addTemplate(template);
        }
        
        // Load all templates from database
        await this.refreshTemplateCache();
        
        console.log(`📚 Loaded ${this.templates.size} templates`);
    }
    
    async addTemplate(template) {
        const existing = await this.getQuery(
            'SELECT id FROM templates WHERE name = ? AND category = ?',
            [template.name, template.category]
        );
        
        if (!existing) {
            await this.runQuery(
                `INSERT INTO templates (name, category, type, description, parameters) 
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    template.name,
                    template.category,
                    template.type,
                    template.description,
                    JSON.stringify(template.parameters)
                ]
            );
        }
    }
    
    async refreshTemplateCache() {
        const templates = await this.allQuery('SELECT * FROM templates');
        
        this.templates.clear();
        
        for (const template of templates) {
            this.templates.set(template.id, {
                ...template,
                parameters: JSON.parse(template.parameters || '{}')
            });
        }
        
        this.stats.templatesLoaded = this.templates.size;
    }
    
    getQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }
    
    allQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
    
    async matchTemplate(intentData) {
        console.log('🔍 Matching template for intent:', intentData.intent.type);
        
        const matches = [];
        
        // Score each template based on intent match
        for (const [id, template] of this.templates) {
            const score = this.calculateMatchScore(intentData, template);
            
            if (score > 0.5) {
                matches.push({
                    template,
                    score,
                    confidence: score
                });
            }
        }
        
        // Sort by score
        matches.sort((a, b) => b.score - a.score);
        
        // Record match
        if (matches.length > 0) {
            const bestMatch = matches[0];
            await this.recordMatch(intentData.intent.type, bestMatch.template.id, bestMatch.confidence);
            
            // Update usage count
            await this.runQuery(
                'UPDATE templates SET usage_count = usage_count + 1 WHERE id = ?',
                [bestMatch.template.id]
            );
            
            this.stats.matchesFound++;
        }
        
        return matches;
    }
    
    calculateMatchScore(intentData, template) {
        let score = 0;
        
        // Intent type matching
        if (intentData.intent.type === 'creation' && template.category === '3d-objects') {
            score += 0.3;
        } else if (intentData.intent.type === 'music' && template.category === 'music-profiles') {
            score += 0.5;
        } else if (intentData.intent.type === 'event' && template.category === 'events') {
            score += 0.5;
        } else if (intentData.intent.type === 'profile' && template.category === 'profiles') {
            score += 0.5;
        }
        
        // Entity matching
        if (intentData.entities) {
            // Check object type match
            if (intentData.entities.objects?.includes(template.type)) {
                score += 0.3;
            }
            
            // Check for specific keywords
            const templateKeywords = [
                template.name.toLowerCase(),
                template.type.toLowerCase(),
                template.description.toLowerCase()
            ].join(' ');
            
            const inputKeywords = JSON.stringify(intentData.entities).toLowerCase();
            
            if (templateKeywords.includes('boat') && inputKeywords.includes('boat')) {
                score += 0.2;
            }
            if (templateKeywords.includes('spotify') && inputKeywords.includes('spotify')) {
                score += 0.3;
            }
            if (templateKeywords.includes('verified') && inputKeywords.includes('verif')) {
                score += 0.2;
            }
        }
        
        // AI suggestion boost
        if (intentData.suggestions?.some(s => s.template === template.name.toLowerCase().replace(/\s+/g, '-'))) {
            score += 0.2;
        }
        
        return Math.min(score, 1.0);
    }
    
    async recordMatch(intentType, templateId, confidence) {
        await this.runQuery(
            'INSERT INTO template_matches (intent_type, template_id, confidence) VALUES (?, ?, ?)',
            [intentType, templateId, confidence]
        );
    }
    
    async generateContent(templateId, parameters = {}) {
        console.log(`🏗️ Generating content with template ${templateId}`);
        
        const template = this.templates.get(templateId);
        if (!template) {
            throw new Error(`Template ${templateId} not found`);
        }
        
        // Get the category generator
        const category = this.categories[template.category];
        if (!category || !category.generator) {
            throw new Error(`No generator for category ${template.category}`);
        }
        
        try {
            // Generate content using category-specific generator
            const content = await category.generator(template, parameters);
            
            this.stats.contentGenerated++;
            
            this.emit('contentGenerated', {
                template,
                parameters,
                content
            });
            
            return content;
            
        } catch (error) {
            this.stats.errors++;
            throw error;
        }
    }
    
    // Category-specific generators
    
    async generate3DObject(template, parameters) {
        console.log('🎨 Generating 3D object:', template.name);
        
        const content = {
            type: '3d-model',
            template: template.name,
            model: {
                format: 'gltf',
                vertices: [],
                faces: [],
                materials: [],
                animations: []
            },
            customization: {},
            preview: null
        };
        
        // Apply parameters
        if (template.type === 'boat' && parameters.features) {
            content.model.components = [];
            
            if (parameters.features.includes('mast')) {
                content.model.components.push({
                    name: 'mast',
                    type: 'cylinder',
                    position: [0, 5, 0],
                    scale: [0.5, 10, 0.5]
                });
            }
            
            if (parameters.features.includes('armaments') || parameters.features.includes('cannon')) {
                content.model.components.push({
                    name: 'cannons',
                    type: 'array',
                    count: 8,
                    positions: 'deck_sides'
                });
            }
        }
        
        // Generate preview
        content.preview = this.generate3DPreview(content.model);
        
        // Create interactive viewer
        content.viewer = this.create3DViewer(content.model);
        
        return content;
    }
    
    async generateMusicProfile(template, parameters) {
        console.log('🎵 Generating music profile:', template.name);
        
        const content = {
            type: 'music-profile',
            template: template.name,
            data: {
                timeframe: parameters.timeframe || 'yearly',
                metrics: {}
            },
            visualization: null,
            sharing: {}
        };
        
        // Generate mock data (would connect to Spotify API)
        if (template.type === 'wrapped') {
            content.data.metrics = {
                topSongs: [
                    { name: 'Song 1', artist: 'Artist 1', plays: 127 },
                    { name: 'Song 2', artist: 'Artist 2', plays: 98 },
                    { name: 'Song 3', artist: 'Artist 3', plays: 87 },
                    { name: 'Song 4', artist: 'Artist 4', plays: 76 },
                    { name: 'Song 5', artist: 'Artist 5', plays: 65 }
                ],
                topArtists: [
                    { name: 'Artist 1', minutes: 1420 },
                    { name: 'Artist 2', minutes: 980 },
                    { name: 'Artist 3', minutes: 750 }
                ],
                topGenres: [
                    { name: 'Electronic', percentage: 35 },
                    { name: 'Hip Hop', percentage: 25 },
                    { name: 'Rock', percentage: 20 }
                ],
                totalMinutes: 52840
            };
        }
        
        // Create visualization
        content.visualization = this.createMusicVisualization(content.data);
        
        // Generate sharing options
        content.sharing = {
            qrCode: this.generateQRCode(content),
            socialMedia: this.generateSocialCards(content),
            embedCode: this.generateEmbedCode(content)
        };
        
        return content;
    }
    
    async generateEvent(template, parameters) {
        console.log('🎫 Generating event:', template.name);
        
        const content = {
            type: 'event',
            template: template.name,
            event: {
                id: this.generateEventId(),
                verification: parameters.method || 'qr_code',
                features: []
            },
            verification: null
        };
        
        // Generate verification system
        if (template.type === 'concert') {
            content.verification = {
                qrCode: this.generateEventQR(content.event.id),
                nfcData: this.generateNFCData(content.event.id),
                perks: parameters.perks || ['early_entry']
            };
        }
        
        // P2P features
        if (template.type === 'meetup') {
            content.event.features = [
                'proximity_detection',
                'secure_handshake',
                'verified_badge'
            ];
        }
        
        return content;
    }
    
    async generateProfile(template, parameters) {
        console.log('👤 Generating profile:', template.name);
        
        const content = {
            type: 'profile',
            template: template.name,
            profile: {
                sections: parameters.sections || ['bio', 'music'],
                integrations: parameters.integrations || [],
                theme: parameters.theme || 'dark'
            },
            page: null
        };
        
        // Generate profile page
        content.page = this.generateProfilePage(content.profile);
        
        return content;
    }
    
    async generateGame(template, parameters) {
        console.log('🎮 Generating game:', template.name);
        
        const content = {
            type: 'game',
            template: template.name,
            game: {
                mode: parameters.mode || 'solo',
                difficulty: parameters.difficulty || 'medium',
                config: {}
            },
            launcher: null
        };
        
        // Generate game launcher
        content.launcher = this.generateGameLauncher(content.game);
        
        return content;
    }
    
    // Helper functions
    
    generate3DPreview(model) {
        // Generate base64 preview image
        return `<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
            <rect width="200" height="200" fill="#1a1a1a"/>
            <text x="100" y="100" text-anchor="middle" fill="#fff" font-family="Arial">
                3D Model Preview
            </text>
        </svg>`;
    }
    
    create3DViewer(model) {
        // Generate Three.js viewer code
        return `
<!DOCTYPE html>
<html>
<head>
    <title>3D Model Viewer</title>
    <script src="https://cdn.jsdelivr.net/npm/three@0.150.0/build/three.min.js"></script>
</head>
<body style="margin: 0; overflow: hidden;">
    <script>
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer();
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);
        
        // Add model components
        ${model.components?.map(comp => `
        const ${comp.name} = new THREE.Mesh(
            new THREE.${comp.type === 'cylinder' ? 'CylinderGeometry' : 'BoxGeometry'}(1, 1, 1),
            new THREE.MeshBasicMaterial({ color: 0x00ff00 })
        );
        scene.add(${comp.name});
        `).join('')}
        
        camera.position.z = 20;
        
        function animate() {
            requestAnimationFrame(animate);
            renderer.render(scene, camera);
        }
        animate();
    </script>
</body>
</html>`;
    }
    
    createMusicVisualization(data) {
        // Generate interactive music visualization
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Music Profile</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
        }
        .container { max-width: 800px; margin: 0 auto; }
        .metric { 
            background: rgba(255,255,255,0.1);
            padding: 20px;
            margin: 10px 0;
            border-radius: 10px;
        }
        .song { margin: 10px 0; }
        .bar { 
            background: rgba(255,255,255,0.5);
            height: 20px;
            border-radius: 10px;
            margin: 5px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Your Music Wrapped</h1>
        <div class="metric">
            <h2>Top Songs</h2>
            ${data.metrics.topSongs?.map(song => `
            <div class="song">
                ${song.name} - ${song.artist} (${song.plays} plays)
                <div class="bar" style="width: ${(song.plays / data.metrics.topSongs[0].plays) * 100}%"></div>
            </div>
            `).join('') || ''}
        </div>
        <div class="metric">
            <h2>Total Listening Time</h2>
            <h3>${Math.floor((data.metrics.totalMinutes || 0) / 60)} hours</h3>
        </div>
    </div>
</body>
</html>`;
    }
    
    generateQRCode(content) {
        // Generate QR code for sharing
        const data = JSON.stringify({
            type: content.type,
            id: Math.random().toString(36).substring(7),
            timestamp: Date.now()
        });
        
        return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(data)}`;
    }
    
    generateSocialCards(content) {
        return {
            twitter: `Share your music profile: ${content.template}`,
            facebook: `Check out my music wrapped!`,
            instagram: `#MusicWrapped #${content.template.replace(/\s+/g, '')}`
        };
    }
    
    generateEmbedCode(content) {
        return `<iframe src="${content.visualization}" width="800" height="600" frameborder="0"></iframe>`;
    }
    
    generateEventId() {
        return `EVT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    }
    
    generateEventQR(eventId) {
        return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${eventId}`;
    }
    
    generateNFCData(eventId) {
        return {
            type: 'event_verification',
            id: eventId,
            protocol: 'ndef',
            data: Buffer.from(eventId).toString('base64')
        };
    }
    
    generateProfilePage(profile) {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Soulfra Profile</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            background: #0a0a0a;
            color: #fff;
            margin: 0;
        }
        .header {
            background: linear-gradient(45deg, #ff006e, #8338ec);
            padding: 40px;
            text-align: center;
        }
        .content {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .section {
            background: #1a1a1a;
            padding: 20px;
            margin: 20px 0;
            border-radius: 10px;
        }
        .integration {
            display: inline-block;
            margin: 10px;
            padding: 10px 20px;
            background: #2a2a2a;
            border-radius: 20px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>My Soulfra Profile</h1>
    </div>
    <div class="content">
        ${profile.sections.map(section => `
        <div class="section">
            <h2>${section.charAt(0).toUpperCase() + section.slice(1)}</h2>
            <p>Content for ${section} section</p>
        </div>
        `).join('')}
        
        <div class="section">
            <h2>Connected Services</h2>
            ${profile.integrations.map(service => `
            <span class="integration">${service}</span>
            `).join('')}
        </div>
    </div>
</body>
</html>`;
    }
    
    generateGameLauncher(game) {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Game Launcher</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: #000;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
        }
        .launcher {
            text-align: center;
            background: #1a1a1a;
            padding: 40px;
            border-radius: 20px;
        }
        button {
            background: #00ff88;
            color: #000;
            border: none;
            padding: 20px 40px;
            font-size: 20px;
            border-radius: 10px;
            cursor: pointer;
            margin: 10px;
        }
        button:hover {
            background: #00cc6a;
        }
    </style>
</head>
<body>
    <div class="launcher">
        <h1>Rhythm Battle</h1>
        <p>Mode: ${game.mode}</p>
        <p>Difficulty: ${game.difficulty}</p>
        <button onclick="startGame()">Start Game</button>
    </div>
    <script>
        function startGame() {
            alert('Game starting... Connect your music source!');
        }
    </script>
</body>
</html>`;
    }
    
    startServer() {
        const express = require('express');
        const app = express();
        
        app.use(express.json());
        app.use(express.static(__dirname)); // Serve generated content
        
        // Match template endpoint
        app.post('/match', async (req, res) => {
            try {
                const { intentData } = req.body;
                
                if (!intentData) {
                    return res.status(400).json({ error: 'No intent data provided' });
                }
                
                const matches = await this.matchTemplate(intentData);
                res.json({ matches });
                
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Generate content endpoint
        app.post('/generate', async (req, res) => {
            try {
                const { templateId, parameters } = req.body;
                
                if (!templateId) {
                    return res.status(400).json({ error: 'No template ID provided' });
                }
                
                const content = await this.generateContent(templateId, parameters);
                res.json({ content });
                
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // List templates endpoint
        app.get('/templates', async (req, res) => {
            const templates = Array.from(this.templates.values());
            res.json({ templates });
        });
        
        // Get template by ID
        app.get('/templates/:id', (req, res) => {
            const template = this.templates.get(parseInt(req.params.id));
            
            if (!template) {
                return res.status(404).json({ error: 'Template not found' });
            }
            
            res.json({ template });
        });
        
        // Statistics endpoint
        app.get('/stats', (req, res) => {
            res.json(this.stats);
        });
        
        app.listen(this.port, () => {
            console.log(`🌐 Template Matching Engine API running on port ${this.port}`);
        });
    }
}

// Export
module.exports = TemplateMatchingEngine;

// Run if called directly
if (require.main === module) {
    const engine = new TemplateMatchingEngine();
    
    // Example usage
    setTimeout(async () => {
        console.log('\n🎯 Example template matching...\n');
        
        // Simulate intent data from NLP processor
        const exampleIntent = {
            intent: { type: 'creation', confidence: 0.8 },
            entities: {
                objects: ['boat'],
                attributes: ['armaments', 'mast'],
                custom: { purpose: 'roughsparks network' }
            }
        };
        
        const matches = await engine.matchTemplate(exampleIntent);
        console.log('Matches found:', matches.length);
        
        if (matches.length > 0) {
            console.log('\nGenerating content with best match...');
            const content = await engine.generateContent(
                matches[0].template.id,
                { features: ['mast', 'armaments'] }
            );
            console.log('Content generated:', content.type);
        }
    }, 2000);
    
    console.log(`
🎯 TEMPLATE MATCHING ENGINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Matches intents to templates
Generates content dynamically
Tracks usage and effectiveness

API Endpoints:
- POST /match - Match intent to templates  
- POST /generate - Generate content
- GET /templates - List all templates
- GET /stats - View statistics

http://localhost:7784
    `);
}