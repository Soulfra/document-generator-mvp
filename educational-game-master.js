/**
 * 🎓 Educational Game Master
 * Central orchestrator that transforms any chapter into a complete Scholastic-style educational game
 * Integrates all systems: Discovery, Conversion, Boss Fights, Mini-Games, Progress Tracking, and Dependencies
 */

const ChapterDiscoverySystem = require('./chapter-discovery-system');
const ChapterToGameConverter = require('./chapter-to-game-converter');
const BossFightGenerator = require('./boss-fight-generator');
const MiniGameFactory = require('./mini-game-factory');
const ProgressTrackerSystem = require('./progress-tracker-system');
const DependencyResolver = require('./dependency-resolver');

const { EventEmitter } = require('events');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class EducationalGameMaster extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            rootDirectory: options.rootDirectory || process.cwd(),
            outputDirectory: options.outputDirectory || './educational-games',
            theme: options.theme || 'scholastic_magical',
            autoDiscovery: options.autoDiscovery !== false,
            progressPersistence: options.progressPersistence !== false,
            dependencyEnforcement: options.dependencyEnforcement !== false,
            ...options
        };
        
        // Initialize all subsystems
        this.discoverySystem = new ChapterDiscoverySystem({
            rootDirectory: this.options.rootDirectory,
            deepScan: true,
            dependencyTracking: true
        });
        
        this.gameConverter = new ChapterToGameConverter({
            scholasticTheme: true,
            bossFrequency: 'per_chapter',
            miniGameDensity: 'high'
        });
        
        this.bossFightGenerator = new BossFightGenerator({
            difficultyScaling: 'adaptive',
            narrativeStyle: 'epic',
            phaseCount: 'auto'
        });
        
        this.miniGameFactory = new MiniGameFactory({
            gameStyle: 'educational_fun',
            difficultyAdaptation: true,
            contextAware: true
        });
        
        this.progressTracker = new ProgressTrackerSystem({
            persistentStorage: this.options.progressPersistence,
            storageLocation: path.join(this.options.outputDirectory, 'progress'),
            analyticsEnabled: true
        });
        
        this.dependencyResolver = new DependencyResolver({
            adaptivePathGeneration: true,
            skillBasedOrdering: true,
            difficultyProgression: true
        });
        
        // Game state
        this.chapters = new Map();
        this.gameLibrary = new Map();
        this.learningPaths = new Map();
        this.activeGames = new Map();
        
        // Scholastic themes
        this.scholasticThemes = {
            scholastic_magical: {
                name: 'Magical Learning Academy',
                description: 'Learn through magical adventures and spells',
                colors: {
                    primary: '#4A90E2',
                    secondary: '#F5A623', 
                    accent: '#7ED321',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                },
                characters: {
                    guide: 'Wise Owl Professor',
                    companion: 'Friendly Dragon',
                    narrator: 'Learning Wizard'
                },
                ui_elements: {
                    borders: 'rounded_magical',
                    buttons: 'crystal_style',
                    progress_bars: 'spell_energy',
                    fonts: {
                        title: 'Comic Sans MS',
                        body: 'Arial',
                        accent: 'Fantasy'
                    }
                },
                sounds: {
                    success: 'magical_chime',
                    failure: 'gentle_magic_fail',
                    boss_appear: 'dramatic_magical_entrance',
                    level_up: 'achievement_fanfare'
                }
            },
            
            scholastic_adventure: {
                name: 'Adventure Learning Academy',
                description: 'Explore knowledge through epic quests',
                colors: {
                    primary: '#8B4513',
                    secondary: '#DAA520',
                    accent: '#228B22',
                    background: 'linear-gradient(135deg, #8B4513 0%, #DAA520 100%)'
                },
                characters: {
                    guide: 'Explorer Captain',
                    companion: 'Knowledge Keeper',
                    narrator: 'Adventure Guide'
                },
                ui_elements: {
                    borders: 'adventure_map_style',
                    buttons: 'treasure_chest',
                    progress_bars: 'expedition_progress',
                    fonts: {
                        title: 'Adventure',
                        body: 'Georgia',
                        accent: 'Papyrus'
                    }
                },
                sounds: {
                    success: 'treasure_found',
                    failure: 'gentle_setback',
                    boss_appear: 'boss_challenge_horn',
                    level_up: 'victory_celebration'
                }
            },
            
            scholastic_space: {
                name: 'Galactic Learning Station',
                description: 'Journey through space to discover knowledge',
                colors: {
                    primary: '#000080',
                    secondary: '#00CED1',
                    accent: '#FFD700',
                    background: 'linear-gradient(135deg, #000080 0%, #4B0082 100%)'
                },
                characters: {
                    guide: 'AI Navigation System',
                    companion: 'Alien Knowledge Being',
                    narrator: 'Space Academy Commander'
                },
                ui_elements: {
                    borders: 'futuristic_panels',
                    buttons: 'holographic_interface',
                    progress_bars: 'energy_cells',
                    fonts: {
                        title: 'Orbitron',
                        body: 'Roboto',
                        accent: 'Exo'
                    }
                },
                sounds: {
                    success: 'computer_success',
                    failure: 'system_alert',
                    boss_appear: 'alien_encounter',
                    level_up: 'rank_promotion'
                }
            }
        };
        
        // Setup event listeners
        this.setupEventListeners();
    }
    
    /**
     * Initialize the Educational Game Master
     */
    async initialize() {
        try {
            console.log('🎓 Initializing Educational Game Master...');
            
            // Create output directory
            await fs.mkdir(this.options.outputDirectory, { recursive: true });
            
            // Auto-discover chapters if enabled
            if (this.options.autoDiscovery) {
                await this.discoverAndCatalogChapters();
            }
            
            // Initialize progress tracking
            await this.progressTracker.loadPersistedData?.();
            
            console.log('✅ Educational Game Master initialized');
            this.emit('initialized', {
                chapters: this.chapters.size,
                theme: this.options.theme,
                outputDirectory: this.options.outputDirectory
            });
            
            return true;
            
        } catch (error) {
            console.error('❌ Failed to initialize Educational Game Master:', error);
            this.emit('initialization_error', { error });
            throw error;
        }
    }
    
    /**
     * Discover and catalog all chapters
     */
    async discoverAndCatalogChapters() {
        console.log('🔍 Discovering chapters...');
        
        const discoveryResult = await this.discoverySystem.discoverChapters();
        
        // Store chapters
        for (const chapter of discoveryResult.chapters) {
            this.chapters.set(chapter.id, chapter);
        }
        
        // Build dependency graph
        if (discoveryResult.chapters.length > 0) {
            await this.dependencyResolver.buildDependencyGraph(discoveryResult.chapters);
        }
        
        console.log(`📚 Cataloged ${this.chapters.size} chapters`);
        this.emit('chapters_discovered', { 
            count: this.chapters.size,
            ready: discoveryResult.chapters.filter(c => c.readyForGameConversion.ready).length
        });
        
        return discoveryResult;
    }
    
    /**
     * Transform a single chapter into a complete educational game
     */
    async createGameFromChapter(chapterId, options = {}) {
        try {
            console.log(`🎮 Creating game from chapter: ${chapterId}`);
            
            const chapter = this.chapters.get(chapterId);
            if (!chapter) {
                throw new Error(`Chapter not found: ${chapterId}`);
            }
            
            // Check if chapter is ready for conversion
            if (!chapter.readyForGameConversion.ready && !options.forceConversion) {
                console.warn(`⚠️ Chapter not ready for game conversion: ${chapter.readyForGameConversion.recommendations.join(', ')}`);
                if (!options.continueAnyway) {
                    throw new Error('Chapter not ready for game conversion');
                }
            }
            
            // Apply theme
            const theme = this.scholasticThemes[this.options.theme] || this.scholasticThemes.scholastic_magical;
            
            // Generate comprehensive game
            const gameResult = await this.generateCompleteGame(chapter, theme, options);
            
            // Store in game library
            this.gameLibrary.set(gameResult.id, gameResult);
            
            // Save game files
            await this.saveGameFiles(gameResult);
            
            console.log(`✅ Game created: ${gameResult.name}`);
            this.emit('game_created', gameResult);
            
            return gameResult;
            
        } catch (error) {
            console.error(`❌ Failed to create game from chapter ${chapterId}:`, error);
            this.emit('game_creation_error', { chapterId, error });
            throw error;
        }
    }
    
    /**
     * Generate complete game with all components
     */
    async generateCompleteGame(chapter, theme, options = {}) {
        const gameId = crypto.randomUUID();
        
        console.log('🏗️ Generating complete game components...');
        
        // 1. Convert chapter to game level
        const gameLevelResult = await this.gameConverter.convertChapter(chapter.filePath);
        
        // 2. Generate boss fight
        const bossFight = await this.bossFightGenerator.generateBossFight({
            complexity: chapter.metadata.difficulty,
            domains: [chapter.metadata.skills?.[0] || 'general'],
            skillsTargeted: chapter.metadata.skills || [],
            chapter: chapter.content
        });
        
        // 3. Generate mini-games
        const miniGames = await this.miniGameFactory.generateMiniGames(chapter.content, {
            playerLevel: 'learning',
            skills: chapter.metadata.skills
        });
        
        // 4. Apply Scholastic theme
        const themedGame = this.applyScholasticTheme(gameLevelResult, theme, {
            bossFight,
            miniGames,
            chapter
        });
        
        // 5. Create comprehensive game package
        const completeGame = {
            id: gameId,
            chapterId: chapter.id,
            name: `${theme.name}: ${chapter.content.title}`,
            description: `${theme.description} - ${chapter.content.title}`,
            theme: theme,
            
            // Core components
            gameLevel: gameLevelResult.gameLevel,
            bossFight: bossFight,
            miniGames: miniGames,
            
            // Generated content
            gameLevelHTML: themedGame.html,
            assets: themedGame.assets,
            
            // Educational metadata
            learningObjectives: chapter.educationalElements,
            skills: chapter.metadata.skills || [],
            difficulty: chapter.metadata.difficulty || 'medium',
            estimatedTime: chapter.metadata.estimatedTime || '30 minutes',
            
            // Game metadata
            created: new Date().toISOString(),
            version: '1.0.0',
            playable: true,
            
            // Analytics and tracking
            analytics: {
                timesPlayed: 0,
                averageScore: 0,
                completionRate: 0,
                playerFeedback: []
            }
        };
        
        return completeGame;
    }
    
    /**
     * Apply Scholastic educational theme to game
     */
    applyScholasticTheme(gameLevelResult, theme, components) {
        console.log(`🎨 Applying ${theme.name} theme...`);
        
        // Generate themed HTML
        const themedHTML = this.generateThemedGameHTML(gameLevelResult, theme, components);
        
        // Generate asset list
        const assets = this.generateThemeAssets(theme, components);
        
        return {
            html: themedHTML,
            assets: assets,
            theme: theme
        };
    }
    
    /**
     * Generate themed HTML with Scholastic styling
     */
    generateThemedGameHTML(gameLevelResult, theme, components) {
        const { bossFight, miniGames, chapter } = components;
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎓 ${theme.name}: ${chapter.content.title}</title>
    <style>
        /* ${theme.name} Educational Game Styling */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: '${theme.ui_elements.fonts.body}', Arial, sans-serif;
            background: ${theme.colors.background};
            color: #333;
            line-height: 1.6;
            min-height: 100vh;
        }
        
        .game-header {
            background: rgba(255, 255, 255, 0.95);
            padding: 25px;
            border-bottom: 5px solid ${theme.colors.primary};
            box-shadow: 0 8px 16px rgba(0,0,0,0.15);
            position: relative;
            overflow: hidden;
        }
        
        .game-header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 8px;
            background: linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.secondary}, ${theme.colors.accent});
        }
        
        .game-title {
            font-family: '${theme.ui_elements.fonts.title}', fantasy;
            font-size: 3em;
            color: ${theme.colors.primary};
            text-align: center;
            text-shadow: 3px 3px 6px rgba(0,0,0,0.2);
            margin-bottom: 15px;
            animation: titleGlow 3s ease-in-out infinite alternate;
        }
        
        @keyframes titleGlow {
            from { text-shadow: 3px 3px 6px rgba(0,0,0,0.2); }
            to { text-shadow: 3px 3px 6px ${theme.colors.accent}40; }
        }
        
        .theme-character {
            position: absolute;
            top: 20px;
            right: 30px;
            font-size: 4em;
            opacity: 0.8;
            animation: float 6s ease-in-out infinite;
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
        }
        
        .progress-container {
            background: rgba(255, 255, 255, 0.9);
            padding: 20px;
            border-radius: 15px;
            margin: 20px 0;
            border: 3px solid ${theme.colors.secondary};
        }
        
        .progress-bar {
            width: 100%;
            height: 25px;
            background: #e0e0e0;
            border-radius: 15px;
            overflow: hidden;
            position: relative;
            border: 2px solid ${theme.colors.primary};
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.accent});
            border-radius: 15px;
            width: 0%;
            transition: width 0.5s ease;
            position: relative;
        }
        
        .progress-fill::after {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            animation: shimmer 2s infinite;
        }
        
        @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        
        .xp-display {
            font-size: 1.5em;
            color: ${theme.colors.accent};
            font-weight: bold;
            text-align: center;
            margin: 15px 0;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .game-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 25px;
        }
        
        .chapter-card {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 20px;
            margin: 25px 0;
            padding: 30px;
            box-shadow: 0 12px 24px rgba(0,0,0,0.15);
            border: 4px solid ${theme.colors.primary};
            position: relative;
            overflow: hidden;
            transition: transform 0.3s ease;
        }
        
        .chapter-card:hover {
            transform: translateY(-5px);
        }
        
        .chapter-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 8px;
            background: linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.secondary}, ${theme.colors.accent});
        }
        
        .section-title {
            font-family: '${theme.ui_elements.fonts.title}', fantasy;
            font-size: 2.2em;
            color: ${theme.colors.primary};
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .mini-game-card {
            background: linear-gradient(135deg, ${theme.colors.secondary}20, ${theme.colors.accent}20);
            border: 3px dashed ${theme.colors.primary};
            border-radius: 15px;
            padding: 20px;
            margin: 20px 0;
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
        }
        
        .mini-game-card:hover {
            background: linear-gradient(135deg, ${theme.colors.secondary}30, ${theme.colors.accent}30);
            transform: scale(1.02);
            box-shadow: 0 8px 16px rgba(0,0,0,0.2);
        }
        
        .mini-game-card::before {
            content: '🎮';
            position: absolute;
            top: 10px;
            right: 15px;
            font-size: 2em;
            opacity: 0.7;
        }
        
        .boss-battle-section {
            background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary});
            color: white;
            text-align: center;
            border-radius: 25px;
            padding: 40px;
            margin: 40px 0;
            border: 6px solid ${theme.colors.accent};
            position: relative;
            overflow: hidden;
        }
        
        .boss-battle-section::before {
            content: '⚔️';
            position: absolute;
            top: -30px;
            right: -30px;
            font-size: 8em;
            opacity: 0.2;
            animation: rotate 10s linear infinite;
        }
        
        @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        
        .boss-title {
            font-family: '${theme.ui_elements.fonts.accent}', fantasy;
            font-size: 3em;
            margin-bottom: 20px;
            text-shadow: 3px 3px 6px rgba(0,0,0,0.5);
        }
        
        .game-button {
            background: linear-gradient(45deg, ${theme.colors.secondary}, ${theme.colors.accent});
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 25px;
            font-size: 1.2em;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 6px 12px rgba(0,0,0,0.3);
            font-family: '${theme.ui_elements.fonts.title}', fantasy;
        }
        
        .game-button:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 16px rgba(0,0,0,0.4);
        }
        
        .game-button:active {
            transform: translateY(1px);
        }
        
        .boss-button {
            background: linear-gradient(45deg, #ff6b6b, #ffa500);
            font-size: 1.5em;
            padding: 20px 40px;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        
        .achievement-gallery {
            background: rgba(255, 255, 255, 0.9);
            border-radius: 20px;
            padding: 25px;
            margin: 25px 0;
            border: 3px solid ${theme.colors.accent};
        }
        
        .achievement-badge {
            display: inline-block;
            background: linear-gradient(45deg, ${theme.colors.primary}, ${theme.colors.secondary});
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 1em;
            margin: 8px;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
        }
        
        .achievement-badge:hover {
            transform: scale(1.1);
        }
        
        .skill-meter {
            background: #e0e0e0;
            border-radius: 12px;
            height: 12px;
            margin: 8px 0;
            overflow: hidden;
            border: 2px solid ${theme.colors.primary};
        }
        
        .skill-fill {
            background: linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.accent});
            height: 100%;
            border-radius: 12px;
            transition: width 0.5s ease;
        }
        
        .character-dialogue {
            background: rgba(255, 255, 255, 0.9);
            border: 3px solid ${theme.colors.secondary};
            border-radius: 15px;
            padding: 20px;
            margin: 20px 0;
            position: relative;
            font-style: italic;
        }
        
        .character-dialogue::before {
            content: '"';
            font-size: 3em;
            color: ${theme.colors.primary};
            position: absolute;
            top: -10px;
            left: 15px;
        }
        
        .sound-controls {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
        }
        
        .sound-button {
            background: ${theme.colors.primary};
            color: white;
            border: none;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            font-size: 1.2em;
            cursor: pointer;
            margin: 5px;
            transition: all 0.3s ease;
        }
        
        .sound-button:hover {
            background: ${theme.colors.secondary};
            transform: scale(1.1);
        }
        
        /* Responsive design */
        @media (max-width: 768px) {
            .game-title { font-size: 2em; }
            .section-title { font-size: 1.5em; }
            .boss-title { font-size: 2em; }
            .game-container { padding: 15px; }
            .chapter-card { padding: 20px; }
        }
        
        /* Animation classes */
        .fade-in {
            animation: fadeIn 0.5s ease-in;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .bounce-in {
            animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        
        @keyframes bounceIn {
            0% { transform: scale(0); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
    </style>
</head>
<body>
    <!-- Sound Controls -->
    <div class="sound-controls">
        <button class="sound-button" onclick="toggleMusic()" title="Toggle Music">🎵</button>
        <button class="sound-button" onclick="toggleSFX()" title="Toggle Sound Effects">🔊</button>
    </div>

    <!-- Character Guide -->
    <div class="theme-character">🧙‍♂️</div>

    <!-- Game Header -->
    <div class="game-header">
        <h1 class="game-title">${theme.name}</h1>
        <h2 style="text-align: center; color: ${theme.colors.secondary}; font-family: '${theme.ui_elements.fonts.title}', fantasy;">
            ${chapter.content.title}
        </h2>
        
        <div class="progress-container">
            <div class="xp-display">✨ Experience Points: <span id="currentXP">0</span></div>
            <div class="progress-bar">
                <div class="progress-fill" id="gameProgress"></div>
            </div>
            <div style="text-align: center; margin-top: 10px; font-weight: bold;">
                📚 Learning Adventure Progress
            </div>
        </div>
    </div>

    <div class="game-container">
        <!-- Welcome Message -->
        <div class="character-dialogue fade-in">
            Welcome to ${theme.name}! I'm your ${theme.characters.guide}, and I'll be guiding you through this magical learning adventure. Are you ready to discover the secrets of "${chapter.content.title}"?
        </div>

        <!-- Chapter Introduction -->
        <div class="chapter-card fade-in">
            <h2 class="section-title">📖 Begin Your Adventure</h2>
            <p style="font-size: 1.2em; margin-bottom: 20px;">
                Embark on an epic learning quest through the mysteries of ${chapter.content.title}! 
                Master new skills, overcome challenges, and become a true knowledge champion!
            </p>
            
            <div style="background: rgba(${theme.colors.primary}10); padding: 20px; border-radius: 15px; border-left: 5px solid ${theme.colors.primary};">
                <h4 style="color: ${theme.colors.primary}; margin-bottom: 15px;">🎯 What You'll Master:</h4>
                ${(chapter.metadata.skills || []).map(skill => 
                    `<div style="margin: 10px 0;">🌟 ${skill.replace(/_/g, ' ').toUpperCase()}</div>`
                ).join('')}
            </div>
            
            <button class="game-button" onclick="startLearningAdventure()" style="margin-top: 20px;">
                🚀 Start Your Quest!
            </button>
        </div>

        <!-- Mini-Game Challenges -->
        <div class="chapter-card fade-in">
            <h2 class="section-title">🎮 Learning Challenges</h2>
            <p style="margin-bottom: 25px;">Complete these magical challenges to grow your knowledge and unlock new abilities!</p>
            
            ${miniGames.map((game, index) => `
            <div class="mini-game-card bounce-in" onclick="playMiniGame('${game.id}')" style="animation-delay: ${index * 0.1}s;">
                <h3 style="color: ${theme.colors.primary}; margin-bottom: 10px;">
                    ⭐ ${game.name}
                </h3>
                <p style="margin-bottom: 15px;">${game.description || 'An exciting learning challenge awaits!'}</p>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="background: ${theme.colors.accent}; color: white; padding: 5px 12px; border-radius: 15px; font-size: 0.9em;">
                        ${(typeof game.difficulty === 'string' ? game.difficulty.toUpperCase() : 'MEDIUM')}
                    </span>
                    <span style="color: ${theme.colors.secondary}; font-weight: bold; font-size: 1.1em;">
                        +${game.xpReward || 100} XP ✨
                    </span>
                </div>
            </div>
            `).join('')}
        </div>

        <!-- Boss Battle -->
        <div class="boss-battle-section bounce-in" id="boss-section">
            <h2 class="boss-title">⚔️ EPIC BOSS CHALLENGE</h2>
            <h3 style="margin-bottom: 15px;">${bossFight.name}</h3>
            <p style="font-size: 1.3em; margin-bottom: 25px; opacity: 0.9;">
                ${bossFight.description}
            </p>
            
            <div style="background: rgba(255,255,255,0.15); padding: 20px; border-radius: 15px; margin-bottom: 25px;">
                <h4 style="margin-bottom: 15px;">🗡️ Battle Phases:</h4>
                ${bossFight.phases.map((phase, index) => `
                <div style="margin: 10px 0; text-align: left; padding-left: 20px;">
                    ⚡ Phase ${index + 1}: ${phase.name}
                </div>
                `).join('')}
            </div>
            
            <button class="game-button boss-button" onclick="challengeBoss()" id="boss-challenge-btn" disabled>
                🔒 Complete All Challenges to Face the Boss!
            </button>
            
            <div style="margin-top: 20px; font-size: 1.2em;">
                <strong>🏆 Victory Rewards:</strong> +${bossFight.rewards.xp} XP, 
                Title: "${bossFight.rewards.title}", Special Abilities Unlocked!
            </div>
        </div>

        <!-- Achievement Gallery -->
        <div class="achievement-gallery fade-in">
            <h2 style="color: ${theme.colors.primary}; margin-bottom: 20px;">🏆 Achievement Gallery</h2>
            <div id="achievements-container">
                <span class="achievement-badge" style="opacity: 0.4;">🎯 First Steps</span>
                <span class="achievement-badge" style="opacity: 0.4;">📚 Chapter Master</span>
                <span class="achievement-badge" style="opacity: 0.4;">⚔️ Boss Slayer</span>
                <span class="achievement-badge" style="opacity: 0.4;">🧠 Knowledge Seeker</span>
                <span class="achievement-badge" style="opacity: 0.4;">⚡ Speed Learner</span>
                <span class="achievement-badge" style="opacity: 0.4;">💎 Perfectionist</span>
            </div>
        </div>
    </div>

    <script>
        // Game State
        let gameState = {
            currentXP: 0,
            challengesCompleted: 0,
            totalChallenges: ${miniGames.length},
            bossUnlocked: false,
            achievements: new Set(),
            soundEnabled: true,
            musicEnabled: true
        };

        // Theme-specific settings
        const theme = ${JSON.stringify(theme)};

        // Initialize game
        document.addEventListener('DOMContentLoaded', function() {
            console.log('🎓 ${theme.name} initialized!');
            updateProgress();
            addScrollAnimations();
        });

        function startLearningAdventure() {
            playSound('${theme.sounds.success}');
            showMessage("Welcome to your learning adventure! Let's begin with the challenges!", 'success');
            document.querySelector('.chapter-card:nth-child(3)').scrollIntoView({ behavior: 'smooth' });
        }

        function playMiniGame(gameId) {
            playSound('${theme.sounds.success}');
            console.log('🎮 Starting challenge:', gameId);
            
            // Simulate challenge completion with themed feedback
            setTimeout(() => {
                const xpGained = 100 + Math.floor(Math.random() * 50);
                gameState.currentXP += xpGained;
                gameState.challengesCompleted++;
                
                updateProgress();
                unlockAchievements();
                
                showMessage(\`🌟 Challenge completed! +\${xpGained} XP earned! Magical knowledge flows through you!\`, 'success');
                
                if (gameState.challengesCompleted >= gameState.totalChallenges) {
                    unlockBoss();
                }
            }, 1500);
        }

        function challengeBoss() {
            if (!gameState.bossUnlocked) return;
            
            playSound('${theme.sounds.boss_appear}');
            showMessage('⚔️ The epic boss battle begins! Use everything you\\'ve learned!', 'boss');
            
            // Simulate boss battle
            setTimeout(() => {
                gameState.currentXP += 500;
                updateProgress();
                unlockAchievement('boss-slayer');
                playSound('${theme.sounds.level_up}');
                
                showMessage('🏆 Victory! You have defeated the boss and mastered this chapter! You are now a true ${theme.name} graduate!', 'victory');
            }, 3000);
        }

        function updateProgress() {
            document.getElementById('currentXP').textContent = gameState.currentXP;
            const progressPercent = Math.min((gameState.challengesCompleted / gameState.totalChallenges) * 100, 100);
            document.getElementById('gameProgress').style.width = progressPercent + '%';
        }

        function unlockBoss() {
            gameState.bossUnlocked = true;
            const bossBtn = document.getElementById('boss-challenge-btn');
            bossBtn.disabled = false;
            bossBtn.textContent = '⚔️ Challenge the Mighty Boss!';
            bossBtn.classList.add('pulse');
            
            document.getElementById('boss-section').scrollIntoView({ behavior: 'smooth' });
            showMessage('🔓 The boss chamber is now open! You\\'re ready for the ultimate challenge!', 'unlock');
        }

        function unlockAchievements() {
            const achievements = document.querySelectorAll('.achievement-badge');
            
            if (gameState.challengesCompleted >= 1 && !gameState.achievements.has('first-steps')) {
                unlockAchievement('first-steps', achievements[0]);
            }
            if (gameState.challengesCompleted >= gameState.totalChallenges && !gameState.achievements.has('chapter-master')) {
                unlockAchievement('chapter-master', achievements[1]);
            }
        }

        function unlockAchievement(achievementId, element = null) {
            if (gameState.achievements.has(achievementId)) return;
            
            gameState.achievements.add(achievementId);
            if (element) {
                element.style.opacity = '1';
                element.classList.add('bounce-in');
            }
            
            playSound('${theme.sounds.level_up}');
            showMessage('🏅 Achievement Unlocked!', 'achievement');
        }

        function showMessage(message, type = 'info') {
            const messageDiv = document.createElement('div');
            messageDiv.textContent = message;
            messageDiv.style.cssText = \`
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: \${type === 'success' ? theme.colors.accent : 
                             type === 'boss' ? '#ff6b6b' : 
                             type === 'victory' ? '#ffd700' : theme.colors.primary};
                color: white;
                padding: 20px 30px;
                border-radius: 15px;
                font-size: 1.2em;
                font-weight: bold;
                z-index: 10000;
                box-shadow: 0 8px 16px rgba(0,0,0,0.3);
                animation: bounceIn 0.5s ease;
            \`;
            
            document.body.appendChild(messageDiv);
            
            setTimeout(() => {
                messageDiv.style.animation = 'fadeOut 0.5s ease';
                setTimeout(() => document.body.removeChild(messageDiv), 500);
            }, 3000);
        }

        function addScrollAnimations() {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('fade-in');
                    }
                });
            });

            document.querySelectorAll('.chapter-card, .mini-game-card').forEach(el => {
                observer.observe(el);
            });
        }

        function playSound(soundName) {
            if (!gameState.soundEnabled) return;
            // Sound implementation would go here
            console.log('🔊 Playing sound:', soundName);
        }

        function toggleMusic() {
            gameState.musicEnabled = !gameState.musicEnabled;
            console.log('🎵 Music:', gameState.musicEnabled ? 'ON' : 'OFF');
        }

        function toggleSFX() {
            gameState.soundEnabled = !gameState.soundEnabled;
            console.log('🔊 Sound Effects:', gameState.soundEnabled ? 'ON' : 'OFF');
        }

        // Add CSS animations
        const style = document.createElement('style');
        style.textContent = \`
            @keyframes fadeOut {
                from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
                to { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            }
        \`;
        document.head.appendChild(style);
    </script>
</body>
</html>`;
    }
    
    /**
     * Generate theme assets
     */
    generateThemeAssets(theme, components) {
        return {
            images: [
                `${theme.name.toLowerCase().replace(/\s+/g, '_')}_background.jpg`,
                `${theme.characters.guide.toLowerCase().replace(/\s+/g, '_')}.png`,
                `${theme.characters.companion.toLowerCase().replace(/\s+/g, '_')}.png`,
                'ui_elements_pack.png',
                'achievement_badges.png'
            ],
            audio: [
                `${theme.sounds.success}.mp3`,
                `${theme.sounds.failure}.mp3`,
                `${theme.sounds.boss_appear}.mp3`,
                `${theme.sounds.level_up}.mp3`,
                'background_music.mp3'
            ],
            fonts: [
                theme.ui_elements.fonts.title,
                theme.ui_elements.fonts.accent
            ],
            data: [
                'game_config.json',
                'achievement_definitions.json',
                'skill_progressions.json'
            ]
        };
    }
    
    /**
     * Save game files to disk
     */
    async saveGameFiles(gameResult) {
        try {
            const gameDir = path.join(this.options.outputDirectory, `game_${gameResult.id}`);
            await fs.mkdir(gameDir, { recursive: true });
            
            // Save main game HTML
            await fs.writeFile(
                path.join(gameDir, 'index.html'),
                gameResult.gameLevelHTML
            );
            
            // Save game data
            await fs.writeFile(
                path.join(gameDir, 'game_data.json'),
                JSON.stringify(gameResult, null, 2)
            );
            
            // Save asset list
            await fs.writeFile(
                path.join(gameDir, 'assets.json'),
                JSON.stringify(gameResult.assets, null, 2)
            );
            
            // Create assets directory
            await fs.mkdir(path.join(gameDir, 'assets'), { recursive: true });
            
            console.log(`💾 Game files saved to: ${gameDir}`);
            
            return gameDir;
            
        } catch (error) {
            console.error('❌ Failed to save game files:', error);
            throw error;
        }
    }
    
    /**
     * Generate learning path for a player
     */
    async generatePersonalizedLearningPath(playerId, preferences = {}) {
        try {
            console.log(`📋 Generating learning path for player: ${playerId}`);
            
            // Get player progress
            const player = this.progressTracker.getOrCreatePlayer(playerId);
            
            // Build learner profile
            const learnerProfile = {
                skillLevel: player.level,
                completedChapters: player.chapters_completed,
                skillProgress: player.skills,
                preferredDifficulty: preferences.difficulty || 'gradual',
                skillFocus: preferences.skills || [],
                timeConstraints: preferences.timeConstraints || { maxSessionTime: 60 },
                learningStyle: preferences.learningStyle || 'interactive'
            };
            
            // Generate path
            const learningPath = this.dependencyResolver.generateLearningPath(learnerProfile);
            
            // Store path
            this.learningPaths.set(playerId, learningPath);
            
            console.log(`✅ Learning path generated: ${learningPath.sequence.length} chapters`);
            this.emit('learning_path_generated', { playerId, path: learningPath });
            
            return learningPath;
            
        } catch (error) {
            console.error(`❌ Failed to generate learning path for ${playerId}:`, error);
            throw error;
        }
    }
    
    /**
     * Start game session for a player
     */
    async startGameSession(playerId, chapterId) {
        try {
            console.log(`🎮 Starting game session: ${playerId} → ${chapterId}`);
            
            // Start progress tracking session
            const session = this.progressTracker.startSession(playerId);
            
            // Get game
            const game = this.gameLibrary.get(chapterId) || await this.createGameFromChapter(chapterId);
            
            // Create active game instance
            const activeGame = {
                id: crypto.randomUUID(),
                playerId,
                gameId: game.id,
                chapterId,
                startTime: new Date().toISOString(),
                progress: {
                    miniGamesCompleted: 0,
                    totalMiniGames: game.miniGames.length,
                    bossFightUnlocked: false,
                    bossFightCompleted: false,
                    currentXP: 0,
                    achievements: []
                },
                status: 'active'
            };
            
            this.activeGames.set(activeGame.id, activeGame);
            
            console.log(`✅ Game session started: ${activeGame.id}`);
            this.emit('game_session_started', activeGame);
            
            return activeGame;
            
        } catch (error) {
            console.error(`❌ Failed to start game session:`, error);
            throw error;
        }
    }
    
    /**
     * Setup event listeners for subsystems
     */
    setupEventListeners() {
        // Discovery system events
        this.discoverySystem.on('discovery_complete', (result) => {
            this.emit('chapters_discovered', result);
        });
        
        // Progress tracker events
        this.progressTracker.on('achievement_unlocked', (data) => {
            this.emit('player_achievement', data);
        });
        
        this.progressTracker.on('level_up', (data) => {
            this.emit('player_level_up', data);
        });
        
        // Game converter events
        this.gameConverter.on('chapter_converted', (data) => {
            this.emit('game_level_created', data);
        });
        
        // Boss fight generator events
        this.bossFightGenerator.on('boss_fight_generated', (data) => {
            this.emit('boss_fight_created', data);
        });
        
        // Mini-game factory events
        this.miniGameFactory.on('mini_games_generated', (data) => {
            this.emit('mini_games_created', data);
        });
    }
    
    /**
     * Get comprehensive status report
     */
    getStatus() {
        return {
            chapters: {
                total: this.chapters.size,
                ready: Array.from(this.chapters.values()).filter(c => c.readyForGameConversion.ready).length
            },
            games: {
                library: this.gameLibrary.size,
                active: this.activeGames.size
            },
            players: {
                registered: this.progressTracker.players?.size || 0
            },
            theme: this.options.theme,
            outputDirectory: this.options.outputDirectory,
            lastDiscovery: this.discoverySystem.lastScan
        };
    }
}

module.exports = EducationalGameMaster;

// Example usage
if (require.main === module) {
    const gameMaster = new EducationalGameMaster({
        rootDirectory: process.cwd(),
        outputDirectory: './educational-games-output',
        theme: 'scholastic_magical',
        autoDiscovery: true
    });
    
    gameMaster.initialize()
        .then(async () => {
            console.log('🎓 Educational Game Master ready!');
            
            // Get status
            const status = gameMaster.getStatus();
            console.log('📊 Status:', status);
            
            // If we have chapters, create a game from the first ready one
            const readyChapters = Array.from(gameMaster.chapters.values())
                .filter(c => c.readyForGameConversion.ready);
            
            if (readyChapters.length > 0) {
                console.log(`🎮 Creating game from: ${readyChapters[0].content.title}`);
                const game = await gameMaster.createGameFromChapter(readyChapters[0].id);
                console.log(`✅ Game created: ${game.name}`);
            }
        })
        .catch(error => {
            console.error('❌ Initialization failed:', error);
        });
}