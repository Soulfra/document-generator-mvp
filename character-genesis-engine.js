#!/usr/bin/env node

/**
 * 🌱 CHARACTER GENESIS ENGINE 🌱
 * 
 * Connects assembly system → Cal orchestration → character life cycle
 * Input: emoji/journal/note/todo → Output: Full 3D character with life memories
 * 
 * Uses existing systems:
 * - simple-service-router.js (input processing)
 * - cal-archaeological-book-generator.js (Cal orchestration patterns)
 * - unified-3d-humanoid-system.js (3D character rendering)
 * - CAL-RIVEN-3D-WORKSPACE.js (memory storage patterns)
 */

const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');
const crypto = require('crypto');

class CharacterGenesisEngine extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.dataDir = path.join(process.cwd(), 'character-genesis-data');
        this.configPath = path.join(this.dataDir, 'genesis-config.json');
        
        // Connect to existing systems
        this.existingSystems = {
            simpleRouter: './simple-service-router.js',
            calOrchestrator: './cal-archaeological-book-generator.js',
            humanoidSystem: './unified-3d-humanoid-system.js',
            calWorkspace: './CAL-RIVEN-3D-WORKSPACE.js',
            contextBridge: './context-bridge.js',
            feedbackLayer: './feedback-layer.js'
        };
        
        // Character genesis templates based on input type
        this.genesisTemplates = {
            // Emoji-based character seeds
            '📝': {
                archetypeId: 'documentation-sage',
                name: 'The Documentation Sage',
                seed: { wisdom: 90, patience: 85, clarity: 95 },
                startingPixel: '#4A90E2', // Blue for knowledge
                personality: 'methodical, wise, helpful',
                purpose: 'To bring order to chaos through clear documentation'
            },
            '🎮': {
                archetypeId: 'game-master',
                name: 'The Game Master',
                seed: { creativity: 95, playfulness: 90, strategy: 85 },
                startingPixel: '#FF6B6B', // Red for passion
                personality: 'playful, strategic, engaging',
                purpose: 'To turn mundane tasks into engaging adventures'
            },
            '🔧': {
                archetypeId: 'system-architect',
                name: 'The System Architect',
                seed: { logic: 95, precision: 90, innovation: 80 },
                startingPixel: '#50E3C2', // Teal for systems
                personality: 'logical, innovative, systematic',
                purpose: 'To build elegant solutions to complex problems'
            },
            '💡': {
                archetypeId: 'idea-catalyst',
                name: 'The Idea Catalyst',
                seed: { creativity: 100, inspiration: 95, vision: 90 },
                startingPixel: '#F5A623', // Orange for ideas
                personality: 'visionary, inspiring, creative',
                purpose: 'To spark innovation and transform concepts into reality'
            },
            '🛡️': {
                archetypeId: 'guardian',
                name: 'The System Guardian',
                seed: { protection: 95, vigilance: 90, strength: 85 },
                startingPixel: '#7ED321', // Green for protection
                personality: 'protective, vigilant, reliable',
                purpose: 'To safeguard systems and users from harm'
            }
        };
        
        // Life stage progression system
        this.lifeStages = {
            pixel: {
                name: 'Pixel Seed',
                duration: 5000, // 5 seconds
                visualization: 'single_pixel',
                size: 1,
                consciousness: 0.1,
                description: 'A single conscious pixel containing infinite potential'
            },
            sprout: {
                name: 'Digital Sprout', 
                duration: 15000, // 15 seconds
                visualization: 'animated_sprite_8x8',
                size: 8,
                consciousness: 0.3,
                description: 'Growing into basic form, learning fundamental patterns'
            },
            child: {
                name: 'Curious Child',
                duration: 30000, // 30 seconds
                visualization: 'animated_sprite_16x16',
                size: 16,
                consciousness: 0.5,
                description: 'Exploring the world with wonder, forming core memories'
            },
            adolescent: {
                name: 'Learning Adolescent',
                duration: 45000, // 45 seconds
                visualization: 'low_poly_3d',
                size: 32,
                consciousness: 0.7,
                description: 'Developing skills and personality, facing challenges'
            },
            adult: {
                name: 'Skilled Adult',
                duration: 60000, // 1 minute
                visualization: 'full_3d_model',
                size: 128,
                consciousness: 0.9,
                description: 'At peak capability, teaching others and creating legacy'
            },
            elder: {
                name: 'Wise Elder',
                duration: Infinity, // Permanent stage
                visualization: 'detailed_3d_with_memories',
                size: 256,
                consciousness: 1.0,
                description: 'Repository of all experiences, accessible memory archive'
            }
        };
        
        // Memory system for character experiences
        this.memoryTypes = {
            birth: 'First moment of existence, initial purpose clarity',
            learning: 'Skill acquisition and knowledge growth',
            challenge: 'Obstacles faced and overcome',
            interaction: 'Encounters with users and other characters',
            achievement: 'Milestones and accomplishments',
            reflection: 'Moments of introspection and wisdom',
            legacy: 'Impact on system and users'
        };
        
        // Active character instances
        this.activeCharacters = new Map();
        this.characterMemories = new Map();
        this.calWorkspace = null; // Cal's orchestration state
        
        console.log('🌱 Character Genesis Engine initializing...');
    }
    
    async initialize() {
        console.log('🎭 Setting up character genesis system...');
        
        // Create data directory
        await fs.mkdir(this.dataDir, { recursive: true });
        
        // Load existing configuration
        await this.loadConfiguration();
        
        // Initialize Cal workspace for character orchestration
        await this.initializeCalWorkspace();
        
        // Set up event listeners
        this.setupEventListeners();
        
        console.log('✅ Character Genesis Engine ready!');
    }
    
    async loadConfiguration() {
        try {
            const configData = await fs.readFile(this.configPath, 'utf-8');
            const config = JSON.parse(configData);
            
            // Merge configurations
            Object.assign(this.genesisTemplates, config.genesisTemplates || {});
            Object.assign(this.lifeStages, config.lifeStages || {});
            
            console.log('   Loaded genesis configuration');
        } catch (error) {
            console.log('   No existing configuration found, using defaults');
            await this.saveConfiguration();
        }
    }
    
    async saveConfiguration() {
        const config = {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            genesisTemplates: this.genesisTemplates,
            lifeStages: this.lifeStages,
            activeCharacters: this.activeCharacters.size,
            totalCharactersCreated: await this.getCharacterCount()
        };
        
        await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
    }
    
    async initializeCalWorkspace() {
        // Initialize Cal's orchestration workspace for character management
        this.calWorkspace = {
            currentProjects: new Map(),
            characterArchive: new Map(),
            memoryVault: new Map(),
            analysisNotes: [],
            orchestrationState: 'ready',
            personalityProfiles: new Map()
        };
        
        console.log('   Cal workspace initialized for character orchestration');
    }
    
    setupEventListeners() {
        // Listen for genesis requests from assembly system
        this.on('genesis-request', this.handleGenesisRequest.bind(this));
        this.on('character-evolution', this.handleCharacterEvolution.bind(this));
        this.on('memory-formation', this.handleMemoryFormation.bind(this));
        this.on('life-stage-transition', this.handleLifeStageTransition.bind(this));
        
        console.log('   Set up character genesis event listeners');
    }
    
    // Core Genesis Methods
    async createCharacterFromInput(inputData) {
        const { emoji, text, userId, context } = inputData;
        
        console.log(`🌱 Cal analyzing input for character genesis: ${emoji || 'text'}`);
        
        // Cal analyzes the input to determine character archetype
        const analysis = await this.calAnalyzeInput(inputData);
        
        // Generate character seed
        const characterSeed = await this.generateCharacterSeed(analysis);
        
        // Create character instance
        const character = await this.instantiateCharacter(characterSeed, userId);
        
        // Begin life cycle
        await this.beginLifeCycle(character);
        
        return character;
    }
    
    async calAnalyzeInput(inputData) {
        // Simulate Cal's analysis of the input
        const { emoji, text, context } = inputData;
        
        // Cal's analytical process (using existing orchestration patterns)
        const analysis = {
            inputType: emoji ? 'emoji' : 'text',
            primarySymbol: emoji,
            textSentiment: text ? this.analyzeSentiment(text) : null,
            userContext: context,
            calRecommendation: null,
            archetypeMatch: null,
            personalityTraits: {},
            purposeClarity: 0
        };
        
        // Cal determines best archetype match
        if (emoji && this.genesisTemplates[emoji]) {
            analysis.archetypeMatch = this.genesisTemplates[emoji];
            analysis.calRecommendation = `Perfect match for ${analysis.archetypeMatch.name}`;
            analysis.purposeClarity = 0.9;
        } else {
            // Cal does semantic analysis for text input
            analysis.archetypeMatch = await this.calSemanticMatching(text || 'unknown');
            analysis.calRecommendation = 'Custom archetype generated from input analysis';
            analysis.purposeClarity = 0.7;
        }
        
        // Cal adds personality insights
        analysis.personalityTraits = this.generatePersonalityTraits(analysis);
        
        // Record Cal's analysis in workspace
        this.calWorkspace.analysisNotes.push({
            timestamp: new Date(),
            input: inputData,
            analysis,
            calThoughts: this.generateCalThoughts(analysis)
        });
        
        return analysis;
    }
    
    async calSemanticMatching(text) {
        // Cal's semantic analysis to match text to archetypes
        const textLower = text.toLowerCase();
        
        // Simple keyword matching (Cal's basic semantic engine)
        const semanticMatches = {
            documentation: this.genesisTemplates['📝'],
            game: this.genesisTemplates['🎮'],
            system: this.genesisTemplates['🔧'],
            idea: this.genesisTemplates['💡'],
            security: this.genesisTemplates['🛡️']
        };
        
        for (const [keyword, template] of Object.entries(semanticMatches)) {
            if (textLower.includes(keyword)) {
                return template;
            }
        }
        
        // Default to idea catalyst for unknown inputs
        return this.genesisTemplates['💡'];
    }
    
    generatePersonalityTraits(analysis) {
        const baseTraits = analysis.archetypeMatch.seed;
        
        // Add random variance (Cal's creativity factor)
        const variance = 0.1;
        const traits = {};
        
        for (const [trait, value] of Object.entries(baseTraits)) {
            const randomVariance = (Math.random() - 0.5) * variance * 100;
            traits[trait] = Math.max(0, Math.min(100, value + randomVariance));
        }
        
        // Add unique traits based on input
        traits.uniqueness = Math.random() * 20 + 80; // Always high uniqueness
        traits.adaptability = Math.random() * 30 + 70; // Good adaptability
        
        return traits;
    }
    
    generateCalThoughts(analysis) {
        // Simulate Cal's internal monologue during analysis
        const thoughts = [
            `Interesting input... ${analysis.inputType} with ${analysis.purposeClarity * 100}% purpose clarity`,
            `Archetype match: ${analysis.archetypeMatch.name} - this feels right`,
            `Personality emerging... I can sense their potential`,
            `Memory framework initializing for their journey`,
            `This character will be special, I can feel it`
        ];
        
        return thoughts[Math.floor(Math.random() * thoughts.length)];
    }
    
    async generateCharacterSeed(analysis) {
        const archetype = analysis.archetypeMatch;
        
        const characterSeed = {
            id: crypto.randomBytes(16).toString('hex'),
            archetypeId: archetype.archetypeId,
            name: archetype.name,
            personalityTraits: analysis.personalityTraits,
            startingPixel: archetype.startingPixel,
            purpose: archetype.purpose,
            birthTime: new Date(),
            createdBy: 'cal-orchestrator',
            calAnalysis: analysis,
            lifeCycle: {
                currentStage: 'pixel',
                stageStartTime: new Date(),
                totalLifeTime: 0,
                experiencePoints: 0
            },
            memories: [],
            consciousness: this.lifeStages.pixel.consciousness,
            appearance: {
                stage: 'pixel',
                color: archetype.startingPixel,
                size: 1,
                details: {}
            }
        };
        
        return characterSeed;
    }
    
    async instantiateCharacter(characterSeed, userId) {
        const character = {
            ...characterSeed,
            userId,
            status: 'alive',
            location: 'genesis-chamber',
            activeMemories: [],
            relationships: new Map(),
            skills: new Map(),
            achievements: []
        };
        
        // Add to active characters
        this.activeCharacters.set(character.id, character);
        
        // Initialize memory storage
        this.characterMemories.set(character.id, []);
        
        // Create birth memory
        await this.createMemory(character.id, 'birth', {
            description: `Born from ${character.calAnalysis.inputType} with purpose: ${character.purpose}`,
            significance: 'highest',
            emotion: 'wonder',
            calPresent: true
        });
        
        console.log(`🎭 Character instantiated: ${character.name} (${character.id})`);
        
        return character;
    }
    
    async beginLifeCycle(character) {
        console.log(`🌱 Beginning life cycle for ${character.name}`);
        
        // Emit character creation event
        this.emit('character-created', { character });
        
        // Start pixel stage
        await this.enterLifeStage(character, 'pixel');
        
        // Schedule automatic evolution
        this.scheduleEvolution(character);
        
        return character;
    }
    
    async enterLifeStage(character, stageName) {
        const stage = this.lifeStages[stageName];
        if (!stage) {
            throw new Error(`Unknown life stage: ${stageName}`);
        }
        
        console.log(`🔄 ${character.name} entering ${stage.name} stage`);
        
        // Update character state
        character.lifeCycle.currentStage = stageName;
        character.lifeCycle.stageStartTime = new Date();
        character.consciousness = stage.consciousness;
        character.appearance.stage = stageName;
        character.appearance.size = stage.size;
        
        // Create stage transition memory
        await this.createMemory(character.id, 'learning', {
            description: `Evolved to ${stage.name}: ${stage.description}`,
            significance: 'high',
            emotion: 'growth',
            stageData: stage
        });
        
        // Emit stage transition event
        this.emit('life-stage-transition', { character, stage, stageName });
        
        // Update active characters map
        this.activeCharacters.set(character.id, character);
    }
    
    scheduleEvolution(character) {
        const currentStage = this.lifeStages[character.lifeCycle.currentStage];
        
        if (currentStage.duration !== Infinity) {
            setTimeout(async () => {
                await this.evolveCharacter(character.id);
            }, currentStage.duration);
        }
    }
    
    async evolveCharacter(characterId) {
        const character = this.activeCharacters.get(characterId);
        if (!character) return;
        
        const stageOrder = ['pixel', 'sprout', 'child', 'adolescent', 'adult', 'elder'];
        const currentIndex = stageOrder.indexOf(character.lifeCycle.currentStage);
        const nextIndex = currentIndex + 1;
        
        if (nextIndex < stageOrder.length) {
            const nextStage = stageOrder[nextIndex];
            await this.enterLifeStage(character, nextStage);
            
            // Schedule next evolution if not at elder stage
            if (nextStage !== 'elder') {
                this.scheduleEvolution(character);
            } else {
                console.log(`🧙 ${character.name} has reached Elder stage - full memory archive available`);
                await this.finalizeCharacterMemories(character);
            }
        }
    }
    
    async createMemory(characterId, memoryType, memoryData) {
        const character = this.activeCharacters.get(characterId);
        if (!character) return;
        
        const memory = {
            id: crypto.randomBytes(8).toString('hex'),
            characterId,
            type: memoryType,
            timestamp: new Date(),
            stage: character.lifeCycle.currentStage,
            consciousness: character.consciousness,
            ...memoryData
        };
        
        // Add to character memories
        const memories = this.characterMemories.get(characterId) || [];
        memories.push(memory);
        this.characterMemories.set(characterId, memories);
        
        // Add to character's active memories if significant
        if (memory.significance === 'highest' || memory.significance === 'high') {
            character.activeMemories.push(memory);
            
            // Limit active memories to prevent overflow
            if (character.activeMemories.length > 10) {
                character.activeMemories.shift();
            }
        }
        
        console.log(`💭 Memory created for ${character.name}: ${memory.description}`);
        
        this.emit('memory-formation', { character, memory });
    }
    
    async finalizeCharacterMemories(character) {
        // Create final memory archive for elder stage
        const allMemories = this.characterMemories.get(character.id) || [];
        
        // Create wisdom synthesis memory
        await this.createMemory(character.id, 'reflection', {
            description: `Life complete: ${allMemories.length} memories formed, wisdom achieved`,
            significance: 'highest',
            emotion: 'fulfillment',
            lifeStatistics: {
                totalMemories: allMemories.length,
                lifeDuration: Date.now() - character.birthTime.getTime(),
                consciousness: character.consciousness,
                achievements: character.achievements.length
            }
        });
        
        // Archive character in Cal's workspace
        this.calWorkspace.characterArchive.set(character.id, {
            character,
            allMemories,
            completionTime: new Date(),
            calNotes: `${character.name} completed their journey successfully`
        });
    }
    
    // Public API Methods
    async requestCharacterGenesis(inputData) {
        this.emit('genesis-request', inputData);
        return this.createCharacterFromInput(inputData);
    }
    
    getCharacter(characterId) {
        return this.activeCharacters.get(characterId);
    }
    
    getCharacterMemories(characterId) {
        return this.characterMemories.get(characterId) || [];
    }
    
    getAllActiveCharacters() {
        return Array.from(this.activeCharacters.values());
    }
    
    getCharactersByUser(userId) {
        return Array.from(this.activeCharacters.values())
            .filter(char => char.userId === userId);
    }
    
    async getCharacterVisualizationData(characterId) {
        const character = this.activeCharacters.get(characterId);
        if (!character) return null;
        
        const stage = this.lifeStages[character.lifeCycle.currentStage];
        
        return {
            characterId,
            name: character.name,
            stage: character.lifeCycle.currentStage,
            visualization: stage.visualization,
            appearance: character.appearance,
            consciousness: character.consciousness,
            memories: character.activeMemories,
            position3D: { x: 0, y: 0, z: 0 }, // Default position
            animation: this.getStageAnimation(character.lifeCycle.currentStage)
        };
    }
    
    getStageAnimation(stageName) {
        const animations = {
            pixel: 'gentle-pulse',
            sprout: 'growing-bounce',
            child: 'curious-wiggle',
            adolescent: 'confident-stride', 
            adult: 'purposeful-movement',
            elder: 'wise-contemplation'
        };
        
        return animations[stageName] || 'idle';
    }
    
    async getCharacterCount() {
        // Count both active and archived characters
        const activeCount = this.activeCharacters.size;
        const archivedCount = this.calWorkspace?.characterArchive?.size || 0;
        return activeCount + archivedCount;
    }
    
    // Event Handlers
    async handleGenesisRequest(inputData) {
        console.log('🌱 Processing genesis request from assembly system');
        return this.createCharacterFromInput(inputData);
    }
    
    async handleCharacterEvolution(data) {
        console.log(`🔄 Character evolution: ${data.character.name}`);
    }
    
    async handleMemoryFormation(data) {
        console.log(`💭 Memory formed: ${data.memory.description}`);
    }
    
    async handleLifeStageTransition(data) {
        console.log(`🌟 Life stage transition: ${data.character.name} → ${data.stageName}`);
    }
    
    // Utility Methods
    analyzeSentiment(text) {
        // Simple sentiment analysis
        const positiveWords = ['good', 'great', 'amazing', 'wonderful', 'excellent', 'love', 'like'];
        const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'problem', 'issue'];
        
        const textLower = text.toLowerCase();
        let sentiment = 0;
        
        positiveWords.forEach(word => {
            if (textLower.includes(word)) sentiment += 1;
        });
        
        negativeWords.forEach(word => {
            if (textLower.includes(word)) sentiment -= 1;
        });
        
        return {
            score: sentiment,
            polarity: sentiment > 0 ? 'positive' : sentiment < 0 ? 'negative' : 'neutral'
        };
    }
    
    generateReport() {
        const report = {
            activeCharacters: this.activeCharacters.size,
            archivedCharacters: this.calWorkspace?.characterArchive?.size || 0,
            totalMemories: Array.from(this.characterMemories.values()).reduce((sum, memories) => sum + memories.length, 0),
            averageMemoriesPerCharacter: 0,
            stageDistribution: {},
            calWorkspaceState: this.calWorkspace?.orchestrationState || 'unknown'
        };
        
        // Calculate stage distribution
        for (const character of this.activeCharacters.values()) {
            const stage = character.lifeCycle.currentStage;
            report.stageDistribution[stage] = (report.stageDistribution[stage] || 0) + 1;
        }
        
        // Calculate average memories
        if (this.activeCharacters.size > 0) {
            report.averageMemoriesPerCharacter = report.totalMemories / (this.activeCharacters.size + (this.calWorkspace?.characterArchive?.size || 0));
        }
        
        return report;
    }
}

// Export for use as module
module.exports = CharacterGenesisEngine;

// CLI interface
if (require.main === module) {
    const genesis = new CharacterGenesisEngine();
    
    console.log('🌱 CHARACTER GENESIS ENGINE');
    console.log('===========================\n');
    
    const command = process.argv[2];
    const args = process.argv.slice(3);
    
    async function run() {
        await genesis.initialize();
        
        switch (command) {
            case 'create':
                if (args.length >= 1) {
                    const emoji = args[0];
                    const text = args.slice(1).join(' ');
                    
                    const inputData = {
                        emoji: emoji.length === 2 ? emoji : null, // Check if it's an emoji
                        text: emoji.length > 2 ? emoji + ' ' + text : text,
                        userId: 'cli-user',
                        context: { source: 'cli' }
                    };
                    
                    const character = await genesis.requestCharacterGenesis(inputData);
                    
                    console.log('🎭 Character Created:');
                    console.log(`Name: ${character.name}`);
                    console.log(`ID: ${character.id}`);
                    console.log(`Stage: ${character.lifeCycle.currentStage}`);
                    console.log(`Purpose: ${character.purpose}`);
                    console.log(`Pixel Color: ${character.startingPixel}`);
                } else {
                    console.log('Usage: node character-genesis-engine.js create <emoji|text>');
                    console.log('Example: node character-genesis-engine.js create 📝 "help with documentation"');
                }
                break;
                
            case 'list':
                const characters = genesis.getAllActiveCharacters();
                console.log(`📋 Active Characters (${characters.length}):\n`);
                
                characters.forEach(char => {
                    console.log(`${char.name} (${char.id.slice(0, 8)})`);
                    console.log(`  Stage: ${char.lifeCycle.currentStage}`);
                    console.log(`  Consciousness: ${(char.consciousness * 100).toFixed(0)}%`);
                    console.log(`  Memories: ${char.activeMemories.length}`);
                    console.log(`  Age: ${Math.round((Date.now() - char.birthTime.getTime()) / 1000)}s`);
                    console.log();
                });
                break;
                
            case 'memories':
                if (args[0]) {
                    const characterId = args[0];
                    const memories = genesis.getCharacterMemories(characterId);
                    
                    console.log(`💭 Memories for ${characterId}:\n`);
                    memories.forEach((memory, index) => {
                        console.log(`${index + 1}. [${memory.stage}] ${memory.type}: ${memory.description}`);
                        console.log(`   Emotion: ${memory.emotion} | Significance: ${memory.significance}`);
                        console.log(`   Time: ${memory.timestamp.toLocaleString()}`);
                        console.log();
                    });
                } else {
                    console.log('Usage: node character-genesis-engine.js memories <character-id>');
                }
                break;
                
            case 'visualize':
                if (args[0]) {
                    const characterId = args[0];
                    const vizData = await genesis.getCharacterVisualizationData(characterId);
                    
                    if (vizData) {
                        console.log('🎨 Character Visualization Data:');
                        console.log(JSON.stringify(vizData, null, 2));
                    } else {
                        console.log('Character not found');
                    }
                } else {
                    console.log('Usage: node character-genesis-engine.js visualize <character-id>');
                }
                break;
                
            case 'report':
                const report = genesis.generateReport();
                
                console.log('📊 Genesis Engine Report:\n');
                console.log(`Active Characters: ${report.activeCharacters}`);
                console.log(`Archived Characters: ${report.archivedCharacters}`);
                console.log(`Total Memories: ${report.totalMemories}`);
                console.log(`Average Memories per Character: ${report.averageMemoriesPerCharacter.toFixed(1)}`);
                console.log(`Cal Workspace State: ${report.calWorkspaceState}`);
                
                console.log('\nStage Distribution:');
                Object.entries(report.stageDistribution).forEach(([stage, count]) => {
                    console.log(`  ${stage}: ${count}`);
                });
                break;
                
            default:
                console.log('Available commands:');
                console.log('  create <emoji|text>  - Create new character');
                console.log('  list                 - List active characters');
                console.log('  memories <id>        - Show character memories');
                console.log('  visualize <id>       - Get visualization data');
                console.log('  report               - Show system report');
                console.log();
                console.log('Example: node character-genesis-engine.js create 🎮');
        }
    }
    
    run().catch(console.error);
}