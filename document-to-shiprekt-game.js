#!/usr/bin/env node

/**
 * 🏴‍☠️ DOCUMENT TO SHIPREKT GAME CONVERTER
 * Transforms any document into a playable mobile pirate game
 * Integrates with existing Document Generator infrastructure
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

// Import existing services
const documentProcessor = require('./services/document-processor');
const aiService = require('./services/ai-api-client');
// Template processor will be loaded dynamically due to ESM

class DocumentToShipRektGame {
    constructor() {
        this.app = express();
        this.port = process.env.PORT || 8889;
        this.upload = multer({ dest: 'uploads/' });
        this.templateProcessor = null;
        
        // Integration with gaming services
        this.gamingEconomyUrl = 'http://localhost:9706';
        this.chartingEngineUrl = 'http://localhost:9705';
        this.integrationActive = false;
        
        // Game generation templates
        this.gameTemplates = {
            chartBattle: {
                name: 'Chart Battle Arena',
                description: 'Technical docs become trading battlegrounds',
                suitable: ['technical', 'api', 'data', 'analytics']
            },
            treasureHunt: {
                name: 'Treasure Hunt Adventure', 
                description: 'Business plans become treasure maps',
                suitable: ['business', 'strategy', 'roadmap', 'plan']
            },
            fleetBuilder: {
                name: 'Fleet Commander',
                description: 'Knowledge bases become ship fleets',
                suitable: ['wiki', 'knowledge', 'documentation', 'guide']
            },
            tradeEmpire: {
                name: 'Trade Route Empire',
                description: 'Process docs become trade networks',
                suitable: ['process', 'workflow', 'pipeline', 'system']
            }
        };
        
        this.setupRoutes();
        this.setupGamingIntegration();
    }
    
    async init() {
        // Load template processor dynamically
        try {
            const templateProcessorModule = await import('./mcp/template-processor.js');
            this.templateProcessor = templateProcessorModule.default || templateProcessorModule;
            console.log('✅ Template processor loaded');
        } catch (error) {
            console.warn('⚠️  Template processor not available:', error.message);
            // Create a mock template processor
            this.templateProcessor = {
                processTemplate: async (name, context) => ({ processed: true, template: name }),
                getAvailableTemplates: async () => ['default']
            };
        }
        
        // Test gaming service connections
        await this.testGamingConnections();
    }
    
    setupRoutes() {
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        // Main game generation endpoint
        this.app.post('/generate-game', this.upload.single('document'), async (req, res) => {
            try {
                const { file } = req;
                const { gameMode = 'auto' } = req.body;
                
                console.log('🏴‍☠️ SHIPREKT GAME GENERATOR ACTIVATED');
                console.log(`📄 Processing document: ${file.originalname}`);
                
                // Step 1: Process document
                const documentContent = await fs.readFile(file.path, 'utf8');
                const analysis = await this.analyzeDocument(documentContent);
                
                // Step 2: Select game template
                const template = gameMode === 'auto' 
                    ? this.selectBestTemplate(analysis)
                    : this.gameTemplates[gameMode];
                
                console.log(`🎮 Selected game mode: ${template.name}`);
                
                // Step 3: Generate game elements
                const gameElements = await this.generateGameElements(analysis, template);
                
                // Step 4: Enhance with gaming integration
                const enhancedElements = await this.enhanceWithGamingIntegration(gameElements, analysis);
                
                // Step 5: Build mobile game
                const game = await this.buildMobileGame(enhancedElements);
                
                // Step 6: Deploy game
                const deployment = await this.deployGame(game);
                
                res.json({
                    success: true,
                    game: {
                        id: game.id,
                        title: game.title,
                        mode: template.name,
                        url: deployment.url,
                        mobileUrl: deployment.mobileUrl,
                        qrCode: deployment.qrCode
                    },
                    elements: {
                        ships: enhancedElements.ships.length,
                        islands: enhancedElements.islands.length,
                        treasures: enhancedElements.treasures.length,
                        routes: enhancedElements.routes.length
                    },
                    integration: {
                        dgai_economy: this.integrationActive,
                        team_mechanics: true,
                        trinity_reasoning: this.integrationActive
                    }
                });
                
                // Cleanup
                await fs.unlink(file.path);
                
            } catch (error) {
                console.error('❌ Game generation failed:', error);
                res.status(500).json({ error: error.message });
            }
        });
        
        // Game preview endpoint
        this.app.get('/preview/:gameId', async (req, res) => {
            const { gameId } = req.params;
            res.sendFile(path.join(__dirname, 'games', gameId, 'index.html'));
        });
        
        // Main game endpoint
        this.app.get('/games/:gameId', async (req, res) => {
            const { gameId } = req.params;
            res.sendFile(path.join(__dirname, 'games', gameId, 'index.html'));
        });
        
        // Game assets (JS, CSS, etc.)
        this.app.use('/games/:gameId', express.static(path.join(__dirname, 'games')));
        
        // Mobile PWA manifest
        this.app.get('/games/:gameId/manifest.json', async (req, res) => {
            const { gameId } = req.params;
            const game = await this.getGame(gameId);
            
            res.json({
                name: `ShipRekt: ${game.title}`,
                short_name: 'ShipRekt',
                description: game.description,
                display: 'fullscreen',
                orientation: 'landscape',
                theme_color: '#001122',
                background_color: '#000000',
                start_url: `/games/${gameId}`,
                icons: [
                    {
                        src: '/assets/shiprekt-icon-192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: '/assets/shiprekt-icon-512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            });
        });
    }
    
    async analyzeDocument(content) {
        console.log('🔍 Analyzing document with Ollama AI...');
        
        try {
            // Enhanced AI analysis using Ollama
            const prompt = `Analyze this business document and extract key information for MVP generation:

Document Content:
${content.substring(0, 4000)}

Please provide a JSON response with:
1. Core concepts (main business ideas that will become ships)
2. Key data points (important metrics/values that will become treasure)
3. Relationships between entities (connections that will become trade routes)
4. Document structure/sections (will become islands)
5. Difficulty assessment (simple/medium/complex)
6. Theme/domain (business, technical, creative, etc)

Format as valid JSON only with this structure:
{
  "concepts": [{"name": "concept", "type": "business/technical/creative"}],
  "dataPoints": [{"label": "data", "importance": 1-5, "complexity": 1-5}],
  "relationships": [{"from": 0, "to": 1, "type": "depends/creates/supports"}],
  "structure": [{"title": "section", "content_type": "intro/analysis/conclusion"}],
  "difficulty": "simple/medium/complex",
  "theme": "business/technical/creative/general"
}`;

            const ollamaResponse = await fetch('http://localhost:11434/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'codellama:7b',
                    prompt: prompt,
                    stream: false,
                    options: {
                        temperature: 0.7,
                        top_p: 0.9,
                        max_tokens: 2048
                    }
                })
            });

            if (ollamaResponse.ok) {
                const aiResult = await ollamaResponse.json();
                console.log('🤖 Ollama AI response received');
                
                // Try to parse AI response as JSON
                try {
                    const cleanResponse = aiResult.response.replace(/```json|```/g, '').trim();
                    const analysis = JSON.parse(cleanResponse);
                    
                    // Validate and enhance the analysis
                    const enhancedAnalysis = {
                        concepts: Array.isArray(analysis.concepts) ? analysis.concepts : this.extractConcepts(content),
                        dataPoints: Array.isArray(analysis.dataPoints) ? analysis.dataPoints : this.extractDataPoints(content),
                        relationships: Array.isArray(analysis.relationships) ? analysis.relationships : this.extractRelationships(content),
                        structure: Array.isArray(analysis.structure) ? analysis.structure : this.extractStructure(content),
                        difficulty: analysis.difficulty || this.assessDifficulty(content),
                        theme: analysis.theme || this.detectTheme(content),
                        aiPowered: true,
                        model: 'codellama:7b'
                    };
                    
                    console.log(`✅ AI Analysis: ${enhancedAnalysis.concepts.length} concepts, ${enhancedAnalysis.dataPoints.length} data points, ${enhancedAnalysis.structure.length} sections`);
                    return enhancedAnalysis;
                    
                } catch (parseError) {
                    console.warn('⚠️ AI response parsing failed, using fallback analysis:', parseError.message);
                }
            } else {
                console.warn('⚠️ Ollama API request failed, using fallback analysis');
            }
        } catch (error) {
            console.warn('⚠️ Ollama connection failed, using fallback analysis:', error.message);
        }
        
        // Fallback analysis if AI fails
        return this.createFallbackAnalysis(content);
    }
    
    createFallbackAnalysis(content) {
        return {
            concepts: this.extractConcepts(content),
            dataPoints: this.extractDataPoints(content),
            relationships: this.extractRelationships(content),
            structure: this.extractStructure(content),
            difficulty: this.assessDifficulty(content),
            theme: this.detectTheme(content),
            aiPowered: false,
            model: 'fallback'
        };
    }
    
    extractConcepts(content) {
        const concepts = [];
        const businessTerms = content.match(/\b(strategy|business|product|service|market|customer|revenue|growth|innovation|technology|platform|solution)\b/gi) || [];
        
        // Deduplicate and create concept objects
        const uniqueTerms = [...new Set(businessTerms.map(term => term.toLowerCase()))];
        
        uniqueTerms.slice(0, 6).forEach((term, i) => {
            concepts.push({
                name: term.charAt(0).toUpperCase() + term.slice(1),
                type: this.classifyConceptType(term)
            });
        });
        
        // Ensure minimum concepts
        if (concepts.length < 2) {
            concepts.push({ name: 'Core System', type: 'technical' });
            concepts.push({ name: 'User Experience', type: 'business' });
        }
        
        return concepts;
    }
    
    extractDataPoints(content) {
        const dataPoints = [];
        
        // Look for numbers, percentages, metrics
        const numbers = content.match(/\$?[\d,]+\.?\d*%?|\b\d{4}\b/g) || [];
        const metrics = content.match(/\b(users?|customers?|revenue|profit|growth|rate|percentage|million|billion|thousand)\b/gi) || [];
        
        numbers.slice(0, 8).forEach((num, i) => {
            dataPoints.push({
                label: `Metric ${i + 1}: ${num}`,
                importance: Math.floor(Math.random() * 5) + 1,
                complexity: Math.floor(Math.random() * 5) + 1,
                description: `Key business metric: ${num}`
            });
        });
        
        return dataPoints;
    }
    
    extractRelationships(content) {
        // Simple relationship extraction based on common business patterns
        return [
            { from: 0, to: 1, type: 'supports' },
            { from: 1, to: 2, type: 'creates' },
            { from: 2, to: 0, type: 'depends' }
        ];
    }
    
    extractStructure(content) {
        const sections = [];
        const lines = content.split('\n');
        
        let currentSection = null;
        lines.forEach((line, i) => {
            // Look for headers (markdown style or numbered)
            if (line.trim().startsWith('#') || /^\d+\./.test(line.trim()) || line.trim().length > 20 && line.trim().length < 80) {
                if (currentSection) {
                    sections.push(currentSection);
                }
                currentSection = {
                    title: line.replace(/^#+\s*|\d+\.\s*/g, '').trim() || `Section ${sections.length + 1}`,
                    content_type: i < lines.length * 0.3 ? 'intro' : i > lines.length * 0.7 ? 'conclusion' : 'analysis'
                };
            }
        });
        
        if (currentSection) {
            sections.push(currentSection);
        }
        
        // Ensure minimum sections
        if (sections.length === 0) {
            sections.push({ title: 'Introduction', content_type: 'intro' });
            sections.push({ title: 'Main Content', content_type: 'analysis' });
        }
        
        return sections;
    }
    
    assessDifficulty(content) {
        const technicalTerms = (content.match(/\b(API|database|algorithm|architecture|framework|deployment|integration|scalability)\b/gi) || []).length;
        const businessTerms = (content.match(/\b(strategy|market|revenue|customer|analysis|planning)\b/gi) || []).length;
        
        if (technicalTerms > 10 || content.length > 5000) return 'complex';
        if (technicalTerms > 5 || businessTerms > 10 || content.length > 2000) return 'medium';
        return 'simple';
    }
    
    detectTheme(content) {
        const contentLower = content.toLowerCase();
        
        if (contentLower.includes('technical') || contentLower.includes('api') || contentLower.includes('system') || contentLower.includes('architecture')) {
            return 'technical';
        } else if (contentLower.includes('business') || contentLower.includes('strategy') || contentLower.includes('market') || contentLower.includes('revenue')) {
            return 'business';
        } else if (contentLower.includes('creative') || contentLower.includes('design') || contentLower.includes('art') || contentLower.includes('story')) {
            return 'creative';
        }
        
        return 'general';
    }
    
    classifyConceptType(term) {
        const technicalTerms = ['technology', 'platform', 'solution', 'system'];
        const businessTerms = ['strategy', 'business', 'market', 'customer', 'revenue'];
        const creativeTerms = ['innovation', 'product', 'service'];
        
        if (technicalTerms.includes(term.toLowerCase())) return 'technical';
        if (businessTerms.includes(term.toLowerCase())) return 'business';
        if (creativeTerms.includes(term.toLowerCase())) return 'creative';
        
        return 'general';
    }
    
    selectBestTemplate(analysis) {
        // Match document theme to game template
        const theme = analysis.theme.toLowerCase();
        
        if (theme.includes('technical') || theme.includes('api')) {
            return this.gameTemplates.chartBattle;
        } else if (theme.includes('business') || theme.includes('strategy')) {
            return this.gameTemplates.treasureHunt;
        } else if (theme.includes('knowledge') || theme.includes('guide')) {
            return this.gameTemplates.fleetBuilder;
        } else if (theme.includes('process') || theme.includes('workflow')) {
            return this.gameTemplates.tradeEmpire;
        }
        
        // Default to treasure hunt
        return this.gameTemplates.treasureHunt;
    }
    
    async generateGameElements(analysis, template) {
        console.log('⚓ Generating game elements...');
        
        const elements = {
            // Ships from main concepts
            ships: analysis.concepts.map((concept, i) => ({
                id: `ship_${i}`,
                name: concept.name,
                type: this.getShipType(concept),
                stats: {
                    speed: Math.floor(Math.random() * 5) + 3,
                    cannons: Math.floor(Math.random() * 10) + 5,
                    cargo: Math.floor(Math.random() * 20) + 10,
                    crew: Math.floor(Math.random() * 50) + 20
                },
                team: i % 2 === 0 ? 'saveOrSink' : 'dealOrDelete'
            })),
            
            // Islands from document structure
            islands: analysis.structure.map((section, i) => ({
                id: `island_${i}`,
                name: section.title || `Island ${i + 1}`,
                type: this.getIslandType(section),
                position: {
                    x: Math.random() * 1000,
                    y: Math.random() * 800
                },
                resources: this.generateResources(section),
                danger: Math.floor(Math.random() * 5) + 1
            })),
            
            // Treasure from key data points
            treasures: analysis.dataPoints.map((data, i) => ({
                id: `treasure_${i}`,
                name: data.label || `Treasure ${i + 1}`,
                value: data.importance * 1000, // DGAI tokens
                location: `island_${Math.floor(Math.random() * analysis.structure.length)}`,
                difficulty: data.complexity || 3,
                clue: data.description
            })),
            
            // Trade routes from relationships
            routes: analysis.relationships.map((rel, i) => ({
                id: `route_${i}`,
                from: `island_${rel.from}`,
                to: `island_${rel.to}`,
                type: rel.type || 'trade',
                danger: Math.floor(Math.random() * 3) + 1,
                reward: Math.floor(Math.random() * 500) + 100
            }))
        };
        
        return elements;
    }
    
    async enhanceWithGamingIntegration(elements, analysis) {
        console.log('🎮 Enhancing with gaming integration...');
        
        // Enhanced elements with DGAI integration
        const enhanced = { ...elements };
        
        // Add DGAI token values to treasures
        enhanced.treasures = elements.treasures.map(treasure => ({
            ...treasure,
            dgai_value: treasure.value, // Already in DGAI tokens
            tier_requirement: this.calculateTierRequirement(treasure.difficulty),
            team_bonus: {
                saveOrSink: treasure.difficulty <= 3 ? 1.2 : 1.0, // Bonus for safer treasures
                dealOrDelete: treasure.difficulty >= 4 ? 1.4 : 1.0  // Bonus for risky treasures
            }
        }));
        
        // Enhance ships with team mechanics
        enhanced.ships = elements.ships.map(ship => ({
            ...ship,
            team_strategy: ship.team === 'saveOrSink' ? 'defensive' : 'aggressive',
            multipliers: {
                saveOrSink: {
                    defense: 1.3,
                    stability: 1.2,
                    cargo_capacity: 1.1
                },
                dealOrDelete: {
                    speed: 1.4,
                    attack: 1.3,
                    momentum: 1.2
                }
            }[ship.team],
            dgai_earning_rate: ship.team === 'saveOrSink' ? 'steady' : 'volatile'
        }));
        
        // Add trinity reasoning to islands
        enhanced.islands = elements.islands.map(island => ({
            ...island,
            trinity_analysis: {
                save_perspective: `Conservative approach: Focus on ${island.resources.join(', ')}`,
                delete_perspective: `Aggressive approach: High-risk ${island.danger >= 3 ? 'but high-reward' : 'low-reward'} target`,
                market_truth: `Island difficulty: ${island.danger}/5, Resources available: ${island.resources.length}`
            },
            team_preferences: {
                saveOrSink: island.danger <= 2 ? 'preferred' : 'avoid',
                dealOrDelete: island.danger >= 3 ? 'preferred' : 'boring'
            }
        }));
        
        // Enhance routes with team-specific strategies
        enhanced.routes = elements.routes.map(route => ({
            ...route,
            team_strategies: {
                saveOrSink: {
                    approach: 'safe_passage',
                    prep_time: route.danger * 2, // More prep for dangerous routes
                    success_rate: Math.max(0.6, 1 - (route.danger * 0.1))
                },
                dealOrDelete: {
                    approach: 'fast_attack',
                    prep_time: 1, // Always go fast
                    success_rate: Math.max(0.4, 0.8 - (route.danger * 0.05))
                }
            },
            dgai_multiplier: route.danger * 0.5 + 1.0 // Higher risk = higher DGAI rewards
        }));
        
        return enhanced;
    }
    
    calculateTierRequirement(difficulty) {
        const tiers = ['shipwreck', 'sailor', 'navigator', 'captain', 'admiral', 'legend'];
        const index = Math.min(Math.floor(difficulty), tiers.length - 1);
        return tiers[index];
    }
    
    async buildMobileGame(elements) {
        console.log('📱 Building mobile PWA game...');
        
        const gameId = crypto.randomBytes(8).toString('hex');
        const gameDir = path.join(__dirname, 'games', gameId);
        
        // Create game directory
        await fs.mkdir(gameDir, { recursive: true });
        
        // Generate game HTML
        const gameHTML = await this.generateGameHTML(elements, gameId);
        await fs.writeFile(path.join(gameDir, 'index.html'), gameHTML);
        
        // Generate game JavaScript
        const gameJS = await this.generateGameJS(elements, gameId);
        await fs.writeFile(path.join(gameDir, 'game.js'), gameJS);
        
        // Generate service worker for offline play
        const sw = await this.generateServiceWorker(gameId);
        await fs.writeFile(path.join(gameDir, 'sw.js'), sw);
        
        // Copy ShipRekt assets
        await this.copyGameAssets(gameDir);
        
        return {
            id: gameId,
            title: `ShipRekt Adventure ${gameId}`,
            elements,
            path: gameDir
        };
    }
    
    async generateGameHTML(elements, gameId) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>ShipRekt: ${gameId}</title>
    <link rel="manifest" href="/games/${gameId}/manifest.json">
    <meta name="theme-color" content="#001122">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, system-ui;
            background: #001122;
            color: white;
            overflow: hidden;
            touch-action: none;
        }
        
        #game-canvas {
            width: 100vw;
            height: 100vh;
            position: relative;
            background: linear-gradient(to bottom, #001122, #003366);
        }
        
        .ocean {
            position: absolute;
            width: 100%;
            height: 100%;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M0 50 Q 25 40 50 50 T 100 50 L 100 100 L 0 100 Z" fill="%23004488" opacity="0.5"/></svg>');
            animation: waves 3s ease-in-out infinite;
        }
        
        @keyframes waves {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        
        .ship {
            position: absolute;
            width: 60px;
            height: 40px;
            background: #8B4513;
            clip-path: polygon(15% 0%, 85% 0%, 100% 50%, 85% 100%, 15% 100%, 0% 50%);
            transition: all 0.3s ease;
        }
        
        .island {
            position: absolute;
            width: 80px;
            height: 80px;
            background: radial-gradient(circle, #228B22, #006400);
            border-radius: 50%;
            box-shadow: 0 0 20px rgba(0, 100, 0, 0.5);
        }
        
        .treasure {
            position: absolute;
            width: 30px;
            height: 30px;
            background: gold;
            border-radius: 50%;
            box-shadow: 0 0 20px rgba(255, 215, 0, 0.8);
            animation: glitter 2s ease-in-out infinite;
        }
        
        @keyframes glitter {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.2); }
        }
        
        .hud {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            padding: 10px;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .team-score {
            font-size: 1.2em;
            font-weight: bold;
        }
        
        .team-score.save { color: #00ff88; }
        .team-score.deal { color: #ff6666; }
        
        .controls {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 10px;
        }
        
        .control-btn {
            width: 80px;
            height: 80px;
            background: rgba(0, 0, 0, 0.6);
            border: 2px solid #00ff88;
            border-radius: 50%;
            color: white;
            font-size: 2em;
            display: flex;
            align-items: center;
            justify-content: center;
            touch-action: none;
        }
    </style>
</head>
<body>
    <div id="game-canvas">
        <div class="ocean"></div>
        
        <!-- HUD -->
        <div class="hud">
            <div class="team-score save">🛟 SaveOrSink: <span id="save-score">0</span> DGAI</div>
            <div class="timer">⏱️ <span id="timer">5:00</span></div>
            <div class="team-score deal">⚔️ DealOrDelete: <span id="deal-score">0</span> DGAI</div>
        </div>
        
        <!-- Player Info -->
        <div style="position: fixed; top: 60px; left: 10px; background: rgba(0,0,0,0.8); padding: 10px; border-radius: 5px;">
            <div>👤 Player: <span id="player-id">guest</span></div>
            <div>🏆 Tier: <span id="player-tier">shipwreck</span></div>
            <div>💰 Total DGAI: <span id="total-dgai">0</span></div>
        </div>
        
        <!-- Game elements will be added here -->
        <div id="game-world"></div>
        
        <!-- Mobile Controls -->
        <div class="controls">
            <button class="control-btn" id="left">←</button>
            <button class="control-btn" id="fire">⚡</button>
            <button class="control-btn" id="right">→</button>
        </div>
    </div>
    
    <script src="game.js"></script>
    <script>
        // Initialize ShipRekt game
        const game = new ShipRektGame(${JSON.stringify(elements)});
        game.start();
        
        // Register service worker for offline play
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js');
        }
    </script>
</body>
</html>`;
    }
    
    async generateGameJS(elements, gameId) {
        return `// ShipRekt Game Engine with DGAI Integration
class ShipRektGame {
    constructor(elements) {
        this.elements = elements;
        this.canvas = document.getElementById('game-world');
        this.scores = { saveOrSink: 0, dealOrDelete: 0 };
        this.gameTime = 300; // 5 minutes
        this.selectedShip = null;
        this.playerId = 'player_' + Math.random().toString(36).substr(2, 9);
        this.playerTeam = Math.random() > 0.5 ? 'saveOrSink' : 'dealOrDelete';
        this.playerTier = 'shipwreck';
        this.totalDGAI = 0;
        
        this.init();
        this.registerPlayer();
    }
    
    init() {
        // Render islands
        this.elements.islands.forEach(island => {
            const el = document.createElement('div');
            el.className = 'island';
            el.id = island.id;
            el.style.left = island.position.x + 'px';
            el.style.top = island.position.y + 'px';
            el.title = island.name;
            this.canvas.appendChild(el);
        });
        
        // Render ships
        this.elements.ships.forEach(ship => {
            const el = document.createElement('div');
            el.className = 'ship';
            el.id = ship.id;
            el.style.left = Math.random() * 800 + 'px';
            el.style.top = Math.random() * 600 + 'px';
            el.style.background = ship.team === 'saveOrSink' ? '#00ff88' : '#ff6666';
            el.title = ship.name;
            
            el.addEventListener('click', () => this.selectShip(ship));
            this.canvas.appendChild(el);
        });
        
        // Render treasures
        this.elements.treasures.forEach(treasure => {
            const el = document.createElement('div');
            el.className = 'treasure';
            el.id = treasure.id;
            
            // Place on island
            const island = document.getElementById(treasure.location);
            if (island) {
                el.style.left = (parseInt(island.style.left) + 25) + 'px';
                el.style.top = (parseInt(island.style.top) + 25) + 'px';
            }
            
            this.canvas.appendChild(el);
        });
        
        // Setup controls
        this.setupControls();
        
        // Start game timer
        this.startTimer();
        
        // Update player info
        this.updatePlayerInfo();
    }
    
    async registerPlayer() {
        try {
            const response = await fetch('/api/integration/register-player', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    playerId: this.playerId, 
                    teamPreference: this.playerTeam 
                })
            });
            
            const result = await response.json();
            if (result.success) {
                console.log('🎮 Player registered:', result.player);
                this.updatePlayerInfo();
            }
        } catch (error) {
            console.log('⚠️ Using offline mode:', error.message);
        }
    }
    
    updatePlayerInfo() {
        document.getElementById('player-id').textContent = this.playerId;
        document.getElementById('player-tier').textContent = this.playerTier;
        document.getElementById('total-dgai').textContent = this.totalDGAI.toLocaleString();
    }
    
    selectShip(ship) {
        this.selectedShip = ship;
        document.querySelectorAll('.ship').forEach(s => s.style.border = 'none');
        document.getElementById(ship.id).style.border = '2px solid yellow';
    }
    
    moveShip(direction) {
        if (!this.selectedShip) return;
        
        const ship = document.getElementById(this.selectedShip.id);
        const currentLeft = parseInt(ship.style.left);
        const currentTop = parseInt(ship.style.top);
        
        switch(direction) {
            case 'left':
                ship.style.left = Math.max(0, currentLeft - 20) + 'px';
                break;
            case 'right':
                ship.style.left = Math.min(window.innerWidth - 60, currentLeft + 20) + 'px';
                break;
            case 'up':
                ship.style.top = Math.max(0, currentTop - 20) + 'px';
                break;
            case 'down':
                ship.style.top = Math.min(window.innerHeight - 40, currentTop + 20) + 'px';
                break;
        }
        
        // Check for treasure collection
        this.checkTreasureCollection();
    }
    
    checkTreasureCollection() {
        if (!this.selectedShip) return;
        
        const ship = document.getElementById(this.selectedShip.id);
        const shipRect = ship.getBoundingClientRect();
        
        document.querySelectorAll('.treasure').forEach(treasure => {
            const treasureRect = treasure.getBoundingClientRect();
            
            if (this.isColliding(shipRect, treasureRect)) {
                // Collect treasure
                treasure.remove();
                
                // Update score with DGAI integration
                const treasureData = this.elements.treasures.find(t => t.id === treasure.id);
                if (treasureData) {
                    let dgaiEarned = treasureData.dgai_value || treasureData.value;
                    
                    // Apply team bonus
                    if (treasureData.team_bonus && treasureData.team_bonus[this.selectedShip.team]) {
                        dgaiEarned *= treasureData.team_bonus[this.selectedShip.team];
                    }
                    
                    this.scores[this.selectedShip.team] += Math.floor(dgaiEarned);
                    this.totalDGAI += Math.floor(dgaiEarned);
                    
                    this.updateScores();
                    this.updatePlayerInfo();
                    
                    // Show DGAI earned notification
                    this.showDGAINotification(Math.floor(dgaiEarned));
                    
                    console.log('💰 DGAI Earned:', Math.floor(dgaiEarned), 'Team:', this.selectedShip.team);
                }
            }
        });
    }
    
    isColliding(rect1, rect2) {
        return !(rect1.right < rect2.left || 
                 rect1.left > rect2.right || 
                 rect1.bottom < rect2.top || 
                 rect1.top > rect2.bottom);
    }
    
    setupControls() {
        // Mobile controls
        document.getElementById('left').addEventListener('touchstart', () => {
            this.moveShip('left');
        });
        
        document.getElementById('right').addEventListener('touchstart', () => {
            this.moveShip('right');
        });
        
        document.getElementById('fire').addEventListener('touchstart', () => {
            this.fire();
        });
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowLeft': this.moveShip('left'); break;
                case 'ArrowRight': this.moveShip('right'); break;
                case 'ArrowUp': this.moveShip('up'); break;
                case 'ArrowDown': this.moveShip('down'); break;
                case ' ': this.fire(); break;
            }
        });
        
        // Touch swipe controls
        let touchStartX = 0;
        let touchStartY = 0;
        
        this.canvas.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe
                if (deltaX > 0) {
                    this.moveShip('right');
                } else {
                    this.moveShip('left');
                }
            } else {
                // Vertical swipe
                if (deltaY > 0) {
                    this.moveShip('down');
                } else {
                    this.moveShip('up');
                }
            }
        });
    }
    
    fire() {
        if (!this.selectedShip) return;
        
        console.log('⚡ FIRE! Ship:', this.selectedShip.name);
        // Add cannon fire animation and damage calculation
    }
    
    updateScores() {
        document.getElementById('save-score').textContent = this.scores.saveOrSink;
        document.getElementById('deal-score').textContent = this.scores.dealOrDelete;
    }
    
    startTimer() {
        const timerEl = document.getElementById('timer');
        
        const interval = setInterval(() => {
            this.gameTime--;
            
            const minutes = Math.floor(this.gameTime / 60);
            const seconds = this.gameTime % 60;
            timerEl.textContent = minutes + ':' + seconds.toString().padStart(2, '0');
            
            if (this.gameTime <= 0) {
                clearInterval(interval);
                this.endGame();
            }
        }, 1000);
    }
    
    showDGAINotification(amount) {
        const notification = document.createElement('div');
        notification.style.cssText = \`
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: gold;
            color: black;
            padding: 20px;
            border-radius: 10px;
            font-size: 1.5em;
            font-weight: bold;
            z-index: 1000;
            animation: fadeInOut 2s ease-in-out;
        \`;
        notification.textContent = \`+\${amount} DGAI!\`;
        
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);
    }
    
    async endGame() {
        const winner = this.scores.saveOrSink > this.scores.dealOrDelete ? 
                      'SaveOrSink' : 'DealOrDelete';
        
        const gameResult = {
            won: winner === this.playerTeam,
            score: Math.max(this.scores.saveOrSink, this.scores.dealOrDelete),
            team: this.playerTeam,
            duration: 300000, // 5 minutes
            dgai_earned: this.totalDGAI,
            game_mode: 'document_adventure'
        };
        
        // Submit results to economy system
        try {
            const response = await fetch('/api/integration/reward-player', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    playerId: this.playerId, 
                    gameResult 
                })
            });
            
            const result = await response.json();
            if (result.success) {
                console.log('🏆 Rewards processed:', result.rewards);
            }
        } catch (error) {
            console.log('⚠️ Offline rewards:', error.message);
        }
        
        alert(\`Game Over! 
Winner: \${winner} 
Final Score: \${Math.max(this.scores.saveOrSink, this.scores.dealOrDelete)} DGAI
Your Earnings: \${this.totalDGAI} DGAI tokens!
Team: \${this.playerTeam} (\${gameResult.won ? 'Victory!' : 'Better luck next time!'})\`);
    }
    
    start() {
        console.log('🏴‍☠️ ShipRekt Game Started!');
        console.log('Elements:', this.elements);
    }
}`;
    }
    
    async generateServiceWorker(gameId) {
        return `// ShipRekt Service Worker
const CACHE_NAME = 'shiprekt-${gameId}-v1';
const urlsToCache = [
    '/games/${gameId}/',
    '/games/${gameId}/index.html',
    '/games/${gameId}/game.js',
    '/games/${gameId}/manifest.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});`;
    }
    
    async copyGameAssets(gameDir) {
        // Copy ShipRekt assets (icons, sounds, etc)
        // In production, copy from assets directory
        console.log('📦 Copying game assets...');
    }
    
    async deployGame(game) {
        console.log('🚀 Deploying game...');
        
        const baseUrl = `http://localhost:${this.port}`;
        const gameUrl = `${baseUrl}/games/${game.id}`;
        const mobileUrl = `${baseUrl}/games/${game.id}?mobile=true`;
        
        // Generate QR code for mobile access
        const qrCode = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(mobileUrl)}`;
        
        return {
            url: gameUrl,
            mobileUrl,
            qrCode,
            deploymentTime: new Date().toISOString()
        };
    }
    
    async getGame(gameId) {
        // Return default game metadata since we don't store game.json
        return {
            id: gameId,
            title: `ShipRekt Adventure ${gameId}`,
            description: 'Transform documents into playable pirate games',
            created: new Date().toISOString()
        };
    }
    
    getShipType(concept) {
        const types = ['frigate', 'galleon', 'sloop', 'brigantine', 'schooner'];
        return types[Math.floor(Math.random() * types.length)];
    }
    
    getIslandType(section) {
        const types = ['tropical', 'volcanic', 'desert', 'fortress', 'trading_post'];
        return types[Math.floor(Math.random() * types.length)];
    }
    
    generateResources(section) {
        const resources = ['gold', 'rum', 'gunpowder', 'silk', 'spices'];
        const count = Math.floor(Math.random() * 3) + 1;
        return resources.slice(0, count);
    }
    
    setupGamingIntegration() {
        console.log('🎮 Setting up gaming integration...');
        
        // Gaming integration endpoints
        this.app.get('/api/integration/status', async (req, res) => {
            const status = {
                document_generator: true,
                gaming_economy: await this.testConnection(this.gamingEconomyUrl),
                charting_engine: await this.testConnection(this.chartingEngineUrl),
                integration_active: this.integrationActive
            };
            res.json(status);
        });
        
        // Register player with economy system
        this.app.post('/api/integration/register-player', async (req, res) => {
            try {
                const { playerId, teamPreference } = req.body;
                
                if (await this.testConnection(this.gamingEconomyUrl)) {
                    const response = await fetch(`${this.gamingEconomyUrl}/api/gaming-economy/player/register`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ playerId, teamPreference })
                    });
                    
                    const result = await response.json();
                    res.json({ success: true, player: result });
                } else {
                    // Fallback - create local player profile
                    res.json({ 
                        success: true, 
                        player: { id: playerId, team: teamPreference, local: true } 
                    });
                }
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Reward player for completing game
        this.app.post('/api/integration/reward-player', async (req, res) => {
            try {
                const { playerId, gameResult } = req.body;
                
                if (await this.testConnection(this.gamingEconomyUrl)) {
                    const response = await fetch(`${this.gamingEconomyUrl}/api/gaming-economy/player/${playerId}/update`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ gameResult })
                    });
                    
                    const result = await response.json();
                    res.json({ success: true, rewards: result });
                } else {
                    // Fallback - calculate local rewards
                    const baseReward = gameResult.won ? 1000 : 100;
                    res.json({ 
                        success: true, 
                        rewards: { tokens_earned: baseReward, local: true } 
                    });
                }
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        
        // Get trinity analysis for game elements
        this.app.post('/api/integration/trinity-analyze', async (req, res) => {
            try {
                const { chartData, gameContext } = req.body;
                
                if (await this.testConnection(this.chartingEngineUrl)) {
                    const response = await fetch(`${this.chartingEngineUrl}/api/shiprekt/trinity/analyze`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ chartData, gameContext })
                    });
                    
                    const result = await response.json();
                    res.json({ success: true, analysis: result });
                } else {
                    // Fallback - simple analysis
                    res.json({ 
                        success: true, 
                        analysis: { 
                            trinity_decision: 'market_neutral',
                            confidence: 0.5,
                            local: true 
                        } 
                    });
                }
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }
    
    async testGamingConnections() {
        console.log('🔌 Testing gaming service connections...');
        
        const economyConnected = await this.testConnection(this.gamingEconomyUrl);
        const chartingConnected = await this.testConnection(this.chartingEngineUrl);
        
        this.integrationActive = economyConnected && chartingConnected;
        
        console.log(`💰 Gaming Economy: ${economyConnected ? '✅ Connected' : '❌ Offline'}`);
        console.log(`📊 Charting Engine: ${chartingConnected ? '✅ Connected' : '❌ Offline'}`);
        console.log(`🎮 Integration Status: ${this.integrationActive ? '✅ Active' : '⚠️ Fallback Mode'}`);
    }
    
    async testConnection(url) {
        try {
            const response = await fetch(`${url}/health`, { signal: AbortSignal.timeout(1000) });
            return response.ok;
        } catch (error) {
            // Try alternative endpoints
            try {
                if (url.includes('9706')) {
                    const response = await fetch(`${url}/api/gaming-economy/overview`, { signal: AbortSignal.timeout(1000) });
                    return response.ok;
                } else if (url.includes('9705')) {
                    const response = await fetch(`${url}/api/shiprekt/status`, { signal: AbortSignal.timeout(1000) });
                    return response.ok;
                }
            } catch (secondError) {
                return false;
            }
            return false;
        }
    }

    async start() {
        await this.init();
        
        this.app.listen(this.port, () => {
            console.log('🏴‍☠️ DOCUMENT TO SHIPREKT GAME CONVERTER');
            console.log('=========================================');
            console.log(`⚓ Server running at: http://localhost:${this.port}`);
            console.log(`📄 Upload endpoint: POST /generate-game`);
            console.log(`🎮 Preview games at: /games/{gameId}`);
            console.log(`🎯 Integration status: GET /api/integration/status`);
            console.log(`👤 Register player: POST /api/integration/register-player`);
            console.log('\n🚢 Ready to transform documents into pirate adventures!');
        });
    }
}

// Start the service
if (require.main === module) {
    const converter = new DocumentToShipRektGame();
    converter.start().catch(console.error);
}

module.exports = DocumentToShipRektGame;