#!/usr/bin/env node

/**
 * PURPLE PULSE WORD ENGINE
 * 
 * Dynamic word animation system that creates pulsing purple words
 * emanating from the center of the vortex with different behaviors
 * based on word type and story context
 */

const EventEmitter = require('events');

class PurplePulseWordEngine extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            baseColor: '#8a2be2', // Purple
            glowIntensity: 20,
            pulseRate: 2000, // milliseconds between pulses
            wordCategories: {
                action: ['CLICK', 'ACTIVATE', 'TRANSFORM', 'EXTRACT', 'DECODE'],
                concept: ['VORTEX', 'MATRIX', 'SPHERE', 'DREAM', 'REALITY'],
                story: ['NARRATIVE', 'TALE', 'SAGA', 'CHRONICLE', 'LEGEND'],
                game: ['QUEST', 'LEVEL', 'BOSS', 'LOOT', 'SPAWN'],
                tech: ['ALGORITHM', 'BINARY', 'QUANTUM', 'NEURAL', 'CYBER']
            },
            behaviors: {
                spiral: { pattern: 'spiral', speed: 'slow', glow: 'intense' },
                burst: { pattern: 'radial', speed: 'fast', glow: 'flash' },
                wave: { pattern: 'sine', speed: 'medium', glow: 'pulse' },
                orbit: { pattern: 'circular', speed: 'constant', glow: 'steady' },
                cascade: { pattern: 'waterfall', speed: 'accelerating', glow: 'fade' }
            },
            ...config
        };
        
        this.activeWords = new Map();
        this.wordHistory = [];
        this.storyContext = null;
        this.isActive = false;
        
        console.log('💜 Purple Pulse Word Engine initialized');
    }
    
    /**
     * Start the word pulse engine
     */
    start() {
        this.isActive = true;
        this.pulseInterval = setInterval(() => {
            if (this.isActive) {
                this.generatePulseWord();
            }
        }, this.config.pulseRate);
        
        console.log('⚡ Word pulse engine started');
        this.emit('engine:started');
    }
    
    /**
     * Stop the word pulse engine
     */
    stop() {
        this.isActive = false;
        if (this.pulseInterval) {
            clearInterval(this.pulseInterval);
        }
        
        console.log('🛑 Word pulse engine stopped');
        this.emit('engine:stopped');
    }
    
    /**
     * Generate a new pulse word with behavior
     */
    generatePulseWord() {
        // Select category based on context
        const category = this.selectWordCategory();
        const words = this.config.wordCategories[category];
        const word = words[Math.floor(Math.random() * words.length)];
        
        // Select behavior based on category
        const behavior = this.selectBehavior(category, word);
        
        // Create word object
        const pulseWord = {
            id: `word_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            text: word,
            category,
            behavior,
            position: { x: 0, y: 0 }, // Start from center
            velocity: this.calculateInitialVelocity(behavior),
            color: this.generateWordColor(category),
            size: this.calculateWordSize(word, category),
            glow: this.config.glowIntensity,
            lifespan: this.calculateLifespan(behavior),
            created: Date.now(),
            metadata: {
                storyRelevance: this.calculateStoryRelevance(word),
                gameIdea: this.generateGameIdea(word, category)
            }
        };
        
        this.activeWords.set(pulseWord.id, pulseWord);
        this.wordHistory.push(pulseWord);
        
        // Emit word creation event
        this.emit('word:created', pulseWord);
        
        // Schedule word removal
        setTimeout(() => {
            this.removeWord(pulseWord.id);
        }, pulseWord.lifespan);
        
        return pulseWord;
    }
    
    /**
     * Select word category based on current context
     */
    selectWordCategory() {
        if (this.storyContext) {
            // Context-aware selection
            if (this.storyContext.includes('game')) return 'game';
            if (this.storyContext.includes('tech')) return 'tech';
            if (this.storyContext.includes('story')) return 'story';
        }
        
        // Random selection with weights
        const weights = {
            action: 25,
            concept: 30,
            story: 20,
            game: 15,
            tech: 10
        };
        
        const total = Object.values(weights).reduce((a, b) => a + b, 0);
        let random = Math.random() * total;
        
        for (const [category, weight] of Object.entries(weights)) {
            random -= weight;
            if (random <= 0) return category;
        }
        
        return 'concept'; // Default
    }
    
    /**
     * Select behavior based on category and word
     */
    selectBehavior(category, word) {
        const behaviorMap = {
            action: ['burst', 'spiral'],
            concept: ['orbit', 'wave'],
            story: ['cascade', 'wave'],
            game: ['burst', 'spiral', 'orbit'],
            tech: ['cascade', 'spiral']
        };
        
        const possibleBehaviors = behaviorMap[category] || Object.keys(this.config.behaviors);
        const behaviorName = possibleBehaviors[Math.floor(Math.random() * possibleBehaviors.length)];
        
        return {
            name: behaviorName,
            ...this.config.behaviors[behaviorName]
        };
    }
    
    /**
     * Calculate initial velocity based on behavior
     */
    calculateInitialVelocity(behavior) {
        const baseSpeed = {
            slow: 1,
            medium: 2,
            fast: 3,
            constant: 1.5,
            accelerating: 1
        };
        
        const speed = baseSpeed[behavior.speed] || 1;
        const angle = Math.random() * Math.PI * 2;
        
        switch (behavior.pattern) {
            case 'spiral':
                return {
                    x: Math.cos(angle) * speed,
                    y: Math.sin(angle) * speed,
                    angle: angle,
                    spiral: 0.1
                };
            
            case 'radial':
                return {
                    x: Math.cos(angle) * speed * 2,
                    y: Math.sin(angle) * speed * 2
                };
            
            case 'sine':
                return {
                    x: speed,
                    y: 0,
                    amplitude: 50,
                    frequency: 0.05
                };
            
            case 'circular':
                return {
                    radius: 100,
                    angle: angle,
                    angleSpeed: speed * 0.02
                };
            
            case 'waterfall':
                return {
                    x: (Math.random() - 0.5) * speed,
                    y: -speed,
                    gravity: 0.1
                };
            
            default:
                return { x: speed, y: 0 };
        }
    }
    
    /**
     * Generate word color based on category
     */
    generateWordColor(category) {
        const colorMap = {
            action: '#ff00ff', // Magenta
            concept: '#8a2be2', // Blue Violet
            story: '#9370db', // Medium Purple
            game: '#ba55d3', // Medium Orchid
            tech: '#9932cc'  // Dark Orchid
        };
        
        return colorMap[category] || this.config.baseColor;
    }
    
    /**
     * Calculate word size based on importance
     */
    calculateWordSize(word, category) {
        const baseSize = 18;
        const lengthModifier = Math.max(0.8, Math.min(1.2, 1 + (word.length - 6) * 0.05));
        const categoryModifier = {
            action: 1.2,
            concept: 1.1,
            story: 1.0,
            game: 1.15,
            tech: 0.95
        };
        
        return Math.floor(baseSize * lengthModifier * (categoryModifier[category] || 1));
    }
    
    /**
     * Calculate lifespan based on behavior
     */
    calculateLifespan(behavior) {
        const baseLifespan = 4000; // 4 seconds
        const speedModifier = {
            slow: 1.5,
            medium: 1.0,
            fast: 0.7,
            constant: 1.2,
            accelerating: 0.8
        };
        
        return baseLifespan * (speedModifier[behavior.speed] || 1);
    }
    
    /**
     * Calculate story relevance score
     */
    calculateStoryRelevance(word) {
        if (!this.storyContext) return 0.5;
        
        // Simple relevance scoring
        const contextWords = this.storyContext.toLowerCase().split(/\s+/);
        const wordLower = word.toLowerCase();
        
        // Direct match
        if (contextWords.includes(wordLower)) return 1.0;
        
        // Partial match
        const partialMatch = contextWords.some(cw => 
            cw.includes(wordLower) || wordLower.includes(cw)
        );
        if (partialMatch) return 0.8;
        
        // Thematic match
        const themes = {
            tech: ['algorithm', 'binary', 'quantum', 'neural', 'cyber'],
            game: ['quest', 'level', 'boss', 'loot', 'spawn'],
            story: ['narrative', 'tale', 'saga', 'chronicle', 'legend']
        };
        
        for (const [theme, themeWords] of Object.entries(themes)) {
            if (themeWords.includes(wordLower) && contextWords.some(cw => themes[theme].includes(cw))) {
                return 0.7;
            }
        }
        
        return 0.3;
    }
    
    /**
     * Generate game idea snippet based on word
     */
    generateGameIdea(word, category) {
        const ideaTemplates = {
            action: [
                `${word} mechanic where players must time their actions`,
                `Power-up that allows instant ${word} ability`,
                `Boss phase triggered by ${word} action`
            ],
            concept: [
                `${word}-themed world with unique physics`,
                `${word} as the central game mechanic`,
                `Puzzle game based on ${word} manipulation`
            ],
            story: [
                `Quest line involving the ${word} of ancient times`,
                `${word} mode where players create their own adventures`,
                `Character driven by mysterious ${word}`
            ],
            game: [
                `${word} system with progressive difficulty`,
                `Multiplayer ${word} competitions`,
                `${word} customization options`
            ],
            tech: [
                `${word}-powered game engine feature`,
                `${word} simulation gameplay`,
                `Hacking mini-game using ${word}`
            ]
        };
        
        const templates = ideaTemplates[category] || [`Game featuring ${word}`];
        return templates[Math.floor(Math.random() * templates.length)];
    }
    
    /**
     * Update word positions based on behavior
     */
    updateWordPositions() {
        const now = Date.now();
        
        for (const [id, word] of this.activeWords) {
            const age = now - word.created;
            const progress = age / word.lifespan;
            
            switch (word.behavior.pattern) {
                case 'spiral':
                    word.velocity.angle += word.velocity.spiral;
                    word.position.x += Math.cos(word.velocity.angle) * word.velocity.x;
                    word.position.y += Math.sin(word.velocity.angle) * word.velocity.y;
                    break;
                
                case 'radial':
                    word.position.x += word.velocity.x;
                    word.position.y += word.velocity.y;
                    break;
                
                case 'sine':
                    word.position.x += word.velocity.x;
                    word.position.y = Math.sin(word.position.x * word.velocity.frequency) * word.velocity.amplitude;
                    break;
                
                case 'circular':
                    word.velocity.angle += word.velocity.angleSpeed;
                    word.position.x = Math.cos(word.velocity.angle) * word.velocity.radius;
                    word.position.y = Math.sin(word.velocity.angle) * word.velocity.radius;
                    break;
                
                case 'waterfall':
                    word.velocity.y += word.velocity.gravity;
                    word.position.x += word.velocity.x;
                    word.position.y += word.velocity.y;
                    break;
            }
            
            // Update glow based on behavior
            switch (word.behavior.glow) {
                case 'pulse':
                    word.glow = this.config.glowIntensity * (0.5 + 0.5 * Math.sin(age * 0.005));
                    break;
                case 'fade':
                    word.glow = this.config.glowIntensity * (1 - progress);
                    break;
                case 'flash':
                    word.glow = this.config.glowIntensity * (progress < 0.2 ? 2 : 1);
                    break;
                case 'intense':
                    word.glow = this.config.glowIntensity * 1.5;
                    break;
            }
            
            // Emit position update
            this.emit('word:updated', word);
        }
    }
    
    /**
     * Remove word from active set
     */
    removeWord(wordId) {
        const word = this.activeWords.get(wordId);
        if (word) {
            this.activeWords.delete(wordId);
            this.emit('word:removed', word);
        }
    }
    
    /**
     * Set story context for word generation
     */
    setStoryContext(context) {
        this.storyContext = context;
        console.log(`📖 Story context updated: ${context}`);
        this.emit('context:updated', context);
    }
    
    /**
     * Get active words for rendering
     */
    getActiveWords() {
        return Array.from(this.activeWords.values());
    }
    
    /**
     * Get word statistics
     */
    getStatistics() {
        const stats = {
            activeWords: this.activeWords.size,
            totalGenerated: this.wordHistory.length,
            categoryDistribution: {},
            averageLifespan: 0,
            topWords: {}
        };
        
        // Calculate category distribution
        for (const word of this.wordHistory) {
            stats.categoryDistribution[word.category] = 
                (stats.categoryDistribution[word.category] || 0) + 1;
        }
        
        // Calculate average lifespan
        if (this.wordHistory.length > 0) {
            const totalLifespan = this.wordHistory.reduce((sum, word) => sum + word.lifespan, 0);
            stats.averageLifespan = totalLifespan / this.wordHistory.length;
        }
        
        // Find top words
        const wordCounts = {};
        for (const word of this.wordHistory) {
            wordCounts[word.text] = (wordCounts[word.text] || 0) + 1;
        }
        stats.topWords = Object.entries(wordCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .reduce((obj, [word, count]) => ({ ...obj, [word]: count }), {});
        
        return stats;
    }
    
    /**
     * Extract story elements from word patterns
     */
    extractStoryElements() {
        const recentWords = this.wordHistory.slice(-20);
        const storyElements = {
            themes: new Set(),
            actions: [],
            concepts: [],
            gameIdeas: []
        };
        
        for (const word of recentWords) {
            storyElements.themes.add(word.category);
            
            if (word.category === 'action') {
                storyElements.actions.push(word.text);
            } else if (word.category === 'concept') {
                storyElements.concepts.push(word.text);
            }
            
            if (word.metadata.gameIdea) {
                storyElements.gameIdeas.push(word.metadata.gameIdea);
            }
        }
        
        return {
            themes: Array.from(storyElements.themes),
            actions: storyElements.actions,
            concepts: storyElements.concepts,
            gameIdeas: [...new Set(storyElements.gameIdeas)], // Unique ideas
            narrative: this.generateNarrative(storyElements)
        };
    }
    
    /**
     * Generate narrative from story elements
     */
    generateNarrative(elements) {
        if (elements.actions.length === 0 || elements.concepts.length === 0) {
            return "The vortex swirls with untold possibilities...";
        }
        
        const action = elements.actions[Math.floor(Math.random() * elements.actions.length)];
        const concept = elements.concepts[Math.floor(Math.random() * elements.concepts.length)];
        
        const templates = [
            `In a world of ${concept}, heroes must ${action} to survive.`,
            `The ${concept} beckons, calling for those brave enough to ${action}.`,
            `When ${concept} meets reality, only those who ${action} will prevail.`,
            `The ancient ${concept} awaits those who dare to ${action}.`
        ];
        
        return templates[Math.floor(Math.random() * templates.length)];
    }
}

// Export for use in other systems
module.exports = PurplePulseWordEngine;

// Run standalone demo if called directly
if (require.main === module) {
    const engine = new PurplePulseWordEngine({
        pulseRate: 1000 // Faster for demo
    });
    
    console.log('\n💜 PURPLE PULSE WORD ENGINE DEMO');
    console.log('================================\n');
    
    // Set up event listeners
    engine.on('word:created', (word) => {
        console.log(`✨ Created: ${word.text} (${word.category}) - ${word.behavior.name} behavior`);
        console.log(`   Position: (${word.position.x.toFixed(1)}, ${word.position.y.toFixed(1)})`);
        console.log(`   Game Idea: ${word.metadata.gameIdea}`);
    });
    
    engine.on('word:removed', (word) => {
        console.log(`💨 Removed: ${word.text}`);
    });
    
    // Start engine
    engine.start();
    
    // Set story context after 3 seconds
    setTimeout(() => {
        engine.setStoryContext('epic game quest with quantum technology');
    }, 3000);
    
    // Update positions periodically
    setInterval(() => {
        engine.updateWordPositions();
    }, 50);
    
    // Show statistics after 10 seconds
    setTimeout(() => {
        console.log('\n📊 ENGINE STATISTICS:');
        console.log(JSON.stringify(engine.getStatistics(), null, 2));
        
        console.log('\n📖 STORY EXTRACTION:');
        console.log(JSON.stringify(engine.extractStoryElements(), null, 2));
    }, 10000);
    
    // Stop after 15 seconds
    setTimeout(() => {
        engine.stop();
        console.log('\n✅ Demo complete!');
        process.exit(0);
    }, 15000);
}