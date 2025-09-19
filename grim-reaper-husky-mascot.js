#!/usr/bin/env node

/**
 * Grim Reaper Husky Mascot System
 * 
 * A sophisticated 3D animated husky character that serves as the fun, friendly 
 * grim reaper mascot for the Document Generator platform. This system extends
 * the existing mascot builder with husky-specific behaviors, grim reaper theming,
 * and AI-powered personality expressions.
 * 
 * Features:
 * - Husky-specific animations (tail wagging, ear movement, head tilting)
 * - Grim reaper theming (cute scythe, ethereal glow, soul collection)
 * - Multiple personality modes (Professional, Reaper, Playful, Wise)
 * - AI-driven expressions based on document content
 * - Integration with Replicate for sprite generation
 * - CalRiven villain dynamic (serious human vs fun husky)
 */

const EventEmitter = require('events');

class GrimReaperHuskyMascot extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Character Design
            character: {
                breed: 'siberian_husky',
                furColors: ['#FFFFFF', '#2F4F4F', '#696969'], // White, dark slate gray, dim gray
                eyeColor: '#00BFFF', // Deep sky blue - piercing husky eyes
                size: 'medium', // Small, medium, large
                build: 'athletic', // Lean, athletic, stocky
                personality: 'wise_playful' // Primary personality trait
            },
            
            // Grim Reaper Elements
            grimReaper: {
                scythe: {
                    enabled: true,
                    style: 'cute', // cute, traditional, ethereal
                    color: '#C0C0C0', // Silver
                    glowEffect: true,
                    size: 'proportional' // small, proportional, large
                },
                cloak: {
                    enabled: true,
                    style: 'hood_only', // full_cloak, hood_only, cape
                    color: '#2F2F2F', // Dark gray
                    transparency: 0.7,
                    flowPhysics: true
                },
                aura: {
                    enabled: true,
                    color: '#9370DB', // Medium purple
                    intensity: 0.3,
                    pulsing: true,
                    particleEffect: 'souls' // souls, mist, sparkles
                },
                soulCollection: {
                    enabled: true,
                    soulColor: '#FFD700', // Gold
                    collectionAnimation: 'gentle_pull',
                    maxSouls: 5 // Floating around the husky
                }
            },
            
            // Personality Modes
            personalityModes: {
                professional: {
                    accessories: ['bow_tie', 'glasses'],
                    stance: 'upright_confident',
                    expressions: ['focused', 'explaining', 'approving'],
                    tailMovement: 'controlled_wag',
                    voiceStyle: 'business_friendly'
                },
                reaper: {
                    accessories: ['scythe', 'hood'],
                    stance: 'mystical_float',
                    expressions: ['wise', 'mysterious', 'gentle_death'],
                    tailMovement: 'ethereal_sway',
                    voiceStyle: 'ancient_wisdom'
                },
                playful: {
                    accessories: ['ball', 'toy_bone'],
                    stance: 'bouncy_ready',
                    expressions: ['excited', 'happy', 'mischievous'],
                    tailMovement: 'energetic_wag',
                    voiceStyle: 'enthusiastic_puppy'
                },
                wise: {
                    accessories: ['ancient_collar', 'mystical_gems'],
                    stance: 'meditation_sit',
                    expressions: ['contemplative', 'knowing', 'patient'],
                    tailMovement: 'calm_sway',
                    voiceStyle: 'sage_mentor'
                }
            },
            
            // Animation Settings
            animations: {
                // Core husky behaviors
                tailWag: {
                    speed: 1.2, // Multiplier
                    intensity: 0.8, // 0-1
                    emotionResponsive: true,
                    physics: true
                },
                earMovement: {
                    alertness: 0.7, // How reactive ears are
                    independentEars: true, // Ears can move separately
                    emotionExpressive: true
                },
                headTilt: {
                    enabled: true,
                    confusion_angle: 25, // degrees
                    curiosity_angle: 15,
                    listening_angle: 30
                },
                breathing: {
                    rate: 1.0, // Breaths per second
                    intensity: 0.3,
                    pantingMode: false // Heavy breathing when excited
                },
                
                // Grim reaper specific
                etherealFloat: {
                    enabled: true,
                    height: 0.1, // Units above ground
                    bobbing: true,
                    speed: 0.5
                },
                soulHarvest: {
                    scytheSwing: 'gentle_arc',
                    duration: 2000, // ms
                    glowIntensification: 1.5
                },
                mysticalGlow: {
                    pulseRate: 0.8, // Hz
                    colorShift: true,
                    intensityRange: [0.2, 0.6]
                }
            },
            
            // AI Integration
            ai: {
                expressionMappingEnabled: true,
                documentResponseEnabled: true,
                emotionAnalysis: true,
                contextAwareness: true,
                replicateIntegration: {
                    enabled: true,
                    spriteGeneration: true,
                    expressionVariants: true,
                    costumeVariations: true
                }
            },
            
            // Physics & Movement
            physics: {
                gravity: 0.8, // Reduced for ethereal feel
                bounce: 0.3,
                friction: 0.7,
                fluidMotion: true,
                tailPhysics: {
                    segments: 8,
                    stiffness: 0.6,
                    damping: 0.8
                },
                earPhysics: {
                    sensitivity: 0.9,
                    recovery: 0.7
                }
            },
            
            // Voice & Sound
            audio: {
                vocalizations: {
                    bark: ['friendly_woof', 'alert_bark', 'playful_yip'],
                    howl: ['mystical_howl', 'soul_call', 'distant_echo'],
                    whine: ['concerned_whine', 'sympathetic_sound'],
                    panting: ['happy_pant', 'excited_breathing']
                },
                soundEffects: {
                    soulCollection: 'ethereal_chime',
                    scytheSwing: 'mystical_whoosh',
                    teleport: 'dimensional_shift',
                    documentSuccess: 'satisfied_woof'
                }
            },
            
            // Integration Points
            integration: {
                customMascotBuilder: true,
                anhkAnimationSystem: true,
                visualSceneGenerator: true,
                htmlVideoRenderer: true,
                documentProcessor: true
            },
            
            ...config
        };
        
        // Character State
        this.state = {
            currentMode: 'professional',
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            animation: 'idle',
            expression: 'neutral',
            emotionalState: {
                happiness: 0.7,
                energy: 0.6,
                focus: 0.8,
                mysticism: 0.4
            },
            
            // Current sprite state
            currentSprite: {
                filePath: null,
                qualityScore: 0,
                generated: null,
                mode: null,
                emotion: null,
                fallbackEmoji: '🐺',
                fallback: true
            },
            
            // Grim reaper state
            reaperState: {
                soulsCollected: 0,
                scytheGlow: 0.3,
                auraIntensity: 0.2,
                etherealMode: false
            },
            
            // Animation state
            animationState: {
                tailWagSpeed: 1.0,
                earPosition: { left: 0, right: 0 },
                headTilt: 0,
                eyeTracking: { x: 0, y: 0 },
                blinkRate: 0.3
            },
            
            // Current context
            context: {
                documentType: null,
                userMood: 'neutral',
                taskComplexity: 'medium',
                urgency: 'normal'
            }
        };
        
        // Animation sequences
        this.animationSequences = this.initializeAnimationSequences();
        
        // AI integration
        this.aiConnector = null;
        
        console.log('🐺💀 Grim Reaper Husky Mascot initialized');
        console.log(`  Personality: ${this.config.character.personality}`);
        console.log(`  Mode: ${this.state.currentMode}`);
        console.log(`  Reaper features: ${this.config.grimReaper.scythe.enabled ? 'Scythe' : ''}${this.config.grimReaper.cloak.enabled ? ' Cloak' : ''}${this.config.grimReaper.aura.enabled ? ' Aura' : ''}`);
        
        this.initialize();
    }
    
    /**
     * Initialize the mascot system
     */
    async initialize() {
        try {
            // Setup 3D character model
            await this.setup3DModel();
            
            // Initialize animation system
            await this.initializeAnimations();
            
            // Setup AI integration
            if (this.config.ai.replicateIntegration.enabled) {
                await this.initializeAIIntegration();
            }
            
            // Setup physics engine
            this.initializePhysics();
            
            // Start idle animations
            this.startIdleAnimations();
            
            console.log('✅ Grim Reaper Husky ready for action');
            this.emit('mascot_ready');
            
        } catch (error) {
            console.error('❌ Failed to initialize husky mascot:', error);
            throw error;
        }
    }
    
    /**
     * Switch personality modes
     */
    async switchMode(mode) {
        if (!this.config.personalityModes[mode]) {
            throw new Error(`Unknown personality mode: ${mode}`);
        }
        
        console.log(`🐺 Switching to ${mode} mode`);
        
        const oldMode = this.state.currentMode;
        this.state.currentMode = mode;
        
        // Transition animation
        await this.playModeTransition(oldMode, mode);
        
        // Update accessories and appearance
        await this.updateAppearanceForMode(mode);
        
        // Adjust animations for new mode
        this.adjustAnimationsForMode(mode);
        
        this.emit('mode_changed', { from: oldMode, to: mode });
    }
    
    /**
     * React to document content with appropriate expressions and animations
     */
    async reactToDocument(documentData) {
        console.log('🐺📄 Reacting to document content');
        
        // Analyze document for emotional content
        const contentAnalysis = this.analyzeDocumentContent(documentData);
        
        // Update context
        this.state.context = {
            documentType: contentAnalysis.type,
            userMood: contentAnalysis.mood,
            taskComplexity: contentAnalysis.complexity,
            urgency: contentAnalysis.urgency
        };
        
        // Choose appropriate reaction
        const reaction = this.selectReactionForContent(contentAnalysis);
        
        // Execute reaction sequence
        await this.executeReactionSequence(reaction);
        
        // Update emotional state
        this.updateEmotionalState(contentAnalysis);
        
        this.emit('document_reaction', { analysis: contentAnalysis, reaction });
    }
    
    /**
     * Perform grim reaper soul collection animation
     */
    async collectDocumentSoul(documentData) {
        console.log('🐺💀 Collecting document soul');
        
        // Switch to reaper mode if not already
        if (this.state.currentMode !== 'reaper') {
            await this.switchMode('reaper');
        }
        
        // Enable ethereal mode
        this.state.reaperState.etherealMode = true;
        
        // Play soul collection sequence
        await this.playAnimationSequence('soul_collection', {
            documentType: documentData.type,
            complexity: documentData.complexity
        });
        
        // Update soul count
        this.state.reaperState.soulsCollected++;
        
        // Glow intensification
        this.state.reaperState.scytheGlow = Math.min(1.0, 
            this.state.reaperState.scytheGlow + 0.1
        );
        
        this.emit('soul_collected', { 
            documentData, 
            totalSouls: this.state.reaperState.soulsCollected 
        });
    }
    
    /**
     * Generate AI-enhanced sprite variations using the Visual Sprite Generator
     */
    async generateAISpriteVariation(prompt, style = 'grim_reaper_husky') {
        if (!this.config.ai.replicateIntegration.enabled) {
            throw new Error('AI integration not enabled');
        }
        
        console.log(`🐺🤖 Generating AI sprite: ${prompt}`);
        
        try {
            // Initialize Visual Sprite Generator if not already done
            if (!this.visualSpriteGenerator) {
                const VisualSpriteGenerator = require('./visual-sprite-generator');
                this.visualSpriteGenerator = new VisualSpriteGenerator();
                await new Promise(resolve => this.visualSpriteGenerator.once('ready', resolve));
            }
            
            // Generate sprite using the enhanced pipeline
            const spriteResult = await this.visualSpriteGenerator.generateSprite('grim_reaper_husky', {
                mode: this.state.currentMode,
                emotion: this.getCurrentEmotion(),
                style: 'pixel_art',
                resolution: 'standard',
                useReferences: true,
                customPrompt: prompt
            });
            
            if (spriteResult) {
                console.log('✅ AI sprite generated successfully');
                console.log(`  📁 Saved to: ${spriteResult.localPath}`);
                console.log(`  🎯 Quality score: ${spriteResult.qualityScore}`);
                
                // Store sprite reference for current state
                this.state.currentSprite = {
                    filePath: spriteResult.localPath,
                    qualityScore: spriteResult.qualityScore,
                    generated: spriteResult.generated,
                    mode: spriteResult.config.mode,
                    emotion: spriteResult.config.emotion
                };
                
                this.emit('ai_sprite_generated', { 
                    prompt, 
                    sprite: spriteResult,
                    mascotState: this.getMascotState()
                });
                
                return spriteResult;
            } else {
                throw new Error('Sprite generation returned null result');
            }
            
        } catch (error) {
            console.error('❌ AI sprite generation failed:', error);
            
            // Fallback to emoji representation
            this.state.currentSprite = {
                filePath: null,
                fallbackEmoji: this.getEmojiForState(),
                fallback: true,
                error: error.message
            };
            
            return null;
        }
    }
    
    /**
     * Express emotion through combined animations
     */
    async expressEmotion(emotion, intensity = 0.7) {
        console.log(`🐺😊 Expressing ${emotion} (intensity: ${intensity})`);
        
        const emotionMapping = {
            happiness: {
                tail: { speed: 1.5, intensity: 0.9 },
                ears: { position: 'perked', movement: 'alert' },
                expression: 'happy_pant',
                sound: 'playful_yip'
            },
            excitement: {
                tail: { speed: 2.0, intensity: 1.0 },
                ears: { position: 'forward', movement: 'twitchy' },
                expression: 'wide_eyes',
                sound: 'excited_bark',
                body: 'bouncy'
            },
            curiosity: {
                tail: { speed: 0.8, intensity: 0.5 },
                ears: { position: 'one_up_one_forward', movement: 'independent' },
                head: { tilt: 25 },
                expression: 'head_tilt_stare',
                sound: 'soft_whine'
            },
            wisdom: {
                tail: { speed: 0.3, intensity: 0.2 },
                ears: { position: 'relaxed', movement: 'calm' },
                expression: 'knowing_look',
                aura: { intensity: 0.5, color: '#9370DB' }
            },
            determination: {
                tail: { speed: 0.6, intensity: 0.7 },
                ears: { position: 'forward', movement: 'focused' },
                expression: 'focused_stare',
                stance: 'ready_position'
            }
        };
        
        const emotionData = emotionMapping[emotion];
        if (emotionData) {
            await this.executeEmotionAnimation(emotionData, intensity);
            this.updateEmotionalStateValue(emotion, intensity);
        }
    }
    
    /**
     * Create a animated trailer scene with the husky mascot
     */
    async createTrailerScene(sceneData) {
        console.log('🐺🎬 Creating trailer scene');
        
        const scene = {
            mascot: this,
            duration: sceneData.duration || 5000,
            background: sceneData.background || 'mystical_office',
            narrative: sceneData.narrative || 'Document transformation',
            
            // Mascot performance
            performance: {
                mode: this.selectModeForScene(sceneData),
                animations: this.selectAnimationsForScene(sceneData),
                expressions: this.selectExpressionsForScene(sceneData),
                dialogue: this.generateDialogueForScene(sceneData)
            },
            
            // Visual effects
            effects: {
                aura: this.calculateAuraForScene(sceneData),
                particles: this.generateParticlesForScene(sceneData),
                lighting: this.calculateLightingForScene(sceneData)
            }
        };
        
        // Execute the scene
        await this.performScene(scene);
        
        this.emit('trailer_scene_created', scene);
        return scene;
    }
    
    // Helper Methods
    
    initializeAnimationSequences() {
        return {
            idle: {
                duration: 3000,
                loop: true,
                keyframes: [
                    { time: 0, tail: 0.3, ears: 'relaxed' },
                    { time: 1500, tail: 0.7, ears: 'alert' },
                    { time: 3000, tail: 0.3, ears: 'relaxed' }
                ]
            },
            soul_collection: {
                duration: 4000,
                loop: false,
                keyframes: [
                    { time: 0, scythe: 'raise', aura: 0.3 },
                    { time: 1000, scythe: 'glow', aura: 0.8 },
                    { time: 2000, scythe: 'swing', aura: 1.0 },
                    { time: 3000, scythe: 'collect', aura: 0.6 },
                    { time: 4000, scythe: 'rest', aura: 0.3 }
                ]
            },
            mode_transition: {
                duration: 2000,
                loop: false,
                customizable: true
            },
            excitement_burst: {
                duration: 1500,
                loop: false,
                keyframes: [
                    { time: 0, tail: 0.5, energy: 0.5 },
                    { time: 500, tail: 1.0, energy: 1.0, sound: 'excited_bark' },
                    { time: 1000, tail: 1.0, energy: 0.8 },
                    { time: 1500, tail: 0.7, energy: 0.6 }
                ]
            }
        };
    }
    
    async setup3DModel() {
        // Initialize 3D model with Three.js
        console.log('  🎭 Setting up 3D husky model');
        
        // This would integrate with your existing Custom Mascot Builder
        this.model = {
            body: this.createHuskyBody(),
            tail: this.createHuskyTail(),
            ears: this.createHuskyEars(),
            eyes: this.createHuskyEyes(),
            accessories: this.createGrimReaperAccessories()
        };
    }
    
    createHuskyBody() {
        return {
            mesh: 'husky_body_mesh',
            material: {
                furTexture: this.generateFurTexture(),
                normalMap: 'husky_normal_map',
                colors: this.config.character.furColors
            },
            skeleton: this.createHuskySkeleton()
        };
    }
    
    createHuskyTail() {
        return {
            segments: this.config.physics.tailPhysics.segments,
            physics: {
                stiffness: this.config.physics.tailPhysics.stiffness,
                damping: this.config.physics.tailPhysics.damping
            },
            animations: {
                wag: this.createTailWagAnimation(),
                position_states: ['down', 'neutral', 'up', 'curled']
            }
        };
    }
    
    createGrimReaperAccessories() {
        const accessories = {};
        
        if (this.config.grimReaper.scythe.enabled) {
            accessories.scythe = {
                model: 'cute_reaper_scythe',
                glow: this.config.grimReaper.scythe.glowEffect,
                color: this.config.grimReaper.scythe.color,
                animations: ['idle', 'raise', 'swing', 'collect']
            };
        }
        
        if (this.config.grimReaper.cloak.enabled) {
            accessories.cloak = {
                model: 'mystical_hood',
                physics: this.config.grimReaper.cloak.flowPhysics,
                transparency: this.config.grimReaper.cloak.transparency
            };
        }
        
        return accessories;
    }
    
    buildSpritePrompt(userPrompt, style) {
        const basePrompt = `${style} of a ${this.config.character.breed} dog`;
        const personalityPrompt = `with ${this.config.character.personality} personality`;
        const reaperPrompt = this.config.grimReaper.scythe.enabled ? 
            'holding a cute mystical scythe' : '';
        const modePrompt = this.getModeDescription(this.state.currentMode);
        
        return `${basePrompt} ${personalityPrompt} ${reaperPrompt} ${modePrompt}, ${userPrompt}, high quality pixel art, cute, professional`;
    }
    
    getModeDescription(mode) {
        const descriptions = {
            professional: 'wearing business attire, confident pose',
            reaper: 'mystical aura, ethereal glow, death god vibes but friendly',
            playful: 'energetic pose, happy expression, playful mood',
            wise: 'sage-like appearance, ancient wisdom, meditative pose'
        };
        
        return descriptions[mode] || '';
    }
    
    analyzeDocumentContent(documentData) {
        // Simple content analysis - in real implementation would use AI
        const wordCount = documentData.content?.split(' ').length || 0;
        const hasNumbers = /\d/.test(documentData.content || '');
        const hasQuestions = /\?/.test(documentData.content || '');
        
        return {
            type: documentData.type || 'unknown',
            mood: hasQuestions ? 'curious' : 'neutral',
            complexity: wordCount > 1000 ? 'high' : wordCount > 300 ? 'medium' : 'low',
            urgency: documentData.urgent ? 'high' : 'normal',
            hasNumbers,
            hasQuestions
        };
    }
    
    selectReactionForContent(analysis) {
        if (analysis.type === 'business_plan') {
            return 'professional_analysis';
        } else if (analysis.hasQuestions) {
            return 'curious_investigation';
        } else if (analysis.complexity === 'high') {
            return 'wise_contemplation';
        } else {
            return 'friendly_acknowledgment';
        }
    }
    
    async executeReactionSequence(reaction) {
        const reactions = {
            professional_analysis: async () => {
                await this.switchMode('professional');
                await this.expressEmotion('determination', 0.8);
                await this.playAnimationSequence('analysis_mode');
            },
            curious_investigation: async () => {
                await this.expressEmotion('curiosity', 0.9);
                await this.playAnimationSequence('head_tilt_investigate');
            },
            wise_contemplation: async () => {
                await this.switchMode('wise');
                await this.expressEmotion('wisdom', 0.7);
                await this.playAnimationSequence('contemplative_sit');
            },
            friendly_acknowledgment: async () => {
                await this.expressEmotion('happiness', 0.6);
                await this.playAnimationSequence('friendly_wag');
            }
        };
        
        const reactionFn = reactions[reaction];
        if (reactionFn) {
            await reactionFn();
        }
    }
    
    /**
     * Get current mascot state for external systems
     */
    getMascotState() {
        return {
            character: this.config.character,
            state: this.state,
            currentAnimation: this.state.animation,
            mode: this.state.currentMode,
            emotionalState: this.state.emotionalState,
            reaperState: this.state.reaperState,
            ready: true
        };
    }
    
    /**
     * Integration point for external animation systems
     */
    getAnimationData() {
        return {
            sequences: this.animationSequences,
            currentState: this.state.animationState,
            physicsConfig: this.config.physics,
            personalityModes: this.config.personalityModes
        };
    }
    
    /**
     * Get current emotional state as a string for sprite generation
     */
    getCurrentEmotion() {
        const emotionalState = this.state.emotionalState;
        
        // Determine primary emotion based on emotional state values
        if (emotionalState.happiness > 0.8) {
            return 'happy';
        } else if (emotionalState.energy > 0.8) {
            return 'excited';
        } else if (emotionalState.focus > 0.8) {
            return 'focused';
        } else if (emotionalState.mysticism > 0.7) {
            return 'mystical';
        } else if (emotionalState.happiness < 0.3) {
            return 'serious';
        } else {
            return 'neutral';
        }
    }
    
    /**
     * Get emoji representation for current state (fallback)
     */
    getEmojiForState() {
        const mode = this.state.currentMode;
        const emotion = this.getCurrentEmotion();
        
        const emojiMap = {
            professional: {
                happy: '🐺😊',
                excited: '🐺⚡',
                focused: '🐺💼',
                serious: '🐺📊',
                neutral: '🐺💼'
            },
            reaper: {
                mystical: '🐺💀✨',
                focused: '🐺💀',
                serious: '🐺💀⚡',
                neutral: '🐺💀',
                happy: '🐺💀😊'
            },
            playful: {
                happy: '🐺😄',
                excited: '🐺🎾',
                neutral: '🐺⚡',
                focused: '🐺🎯'
            },
            wise: {
                mystical: '🐺✨',
                focused: '🐺🧠',
                serious: '🐺📚',
                neutral: '🐺✨',
                happy: '🐺😌'
            }
        };
        
        return emojiMap[mode]?.[emotion] || emojiMap[mode]?.neutral || '🐺';
    }
    
    /**
     * Get current sprite representation (file path or emoji fallback)
     */
    getCurrentSpriteRepresentation() {
        if (this.state.currentSprite.filePath && !this.state.currentSprite.fallback) {
            return {
                type: 'sprite',
                path: this.state.currentSprite.filePath,
                qualityScore: this.state.currentSprite.qualityScore,
                mode: this.state.currentSprite.mode,
                emotion: this.state.currentSprite.emotion
            };
        } else {
            return {
                type: 'emoji',
                emoji: this.state.currentSprite.fallbackEmoji || this.getEmojiForState(),
                fallback: true,
                error: this.state.currentSprite.error
            };
        }
    }
    
    /**
     * Preload sprites for common states
     */
    async preloadCommonSprites() {
        if (!this.config.ai.replicateIntegration.enabled) {
            console.log('🐺 AI integration disabled, using emoji fallbacks');
            return;
        }
        
        console.log('🐺🎨 Preloading common mascot sprites...');
        
        const commonStates = [
            { mode: 'professional', emotion: 'neutral' },
            { mode: 'professional', emotion: 'focused' },
            { mode: 'reaper', emotion: 'mystical' },
            { mode: 'reaper', emotion: 'neutral' },
            { mode: 'playful', emotion: 'happy' },
            { mode: 'playful', emotion: 'excited' },
            { mode: 'wise', emotion: 'neutral' },
            { mode: 'wise', emotion: 'mystical' }
        ];
        
        const preloadPromises = commonStates.map(async (state) => {
            try {
                // Switch to mode temporarily
                const originalMode = this.state.currentMode;
                this.state.currentMode = state.mode;
                
                // Set emotional state
                this.updateEmotionalStateValue(state.emotion, 0.8);
                
                // Generate sprite
                await this.generateAISpriteVariation(`${state.mode} ${state.emotion} grim reaper husky`);
                
                // Restore original mode
                this.state.currentMode = originalMode;
                
                console.log(`  ✅ Preloaded: ${state.mode} ${state.emotion}`);
                
            } catch (error) {
                console.error(`  ❌ Failed to preload ${state.mode} ${state.emotion}:`, error.message);
            }
        });
        
        // Process in batches to avoid overwhelming the API
        const batchSize = 2;
        for (let i = 0; i < preloadPromises.length; i += batchSize) {
            const batch = preloadPromises.slice(i, i + batchSize);
            await Promise.all(batch);
            
            // Small delay between batches
            if (i + batchSize < preloadPromises.length) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
        console.log('✅ Sprite preloading complete');
    }
    
    /**
     * Update emotional state value
     */
    updateEmotionalStateValue(emotion, intensity) {
        switch (emotion) {
            case 'happiness':
            case 'happy':
                this.state.emotionalState.happiness = intensity;
                break;
            case 'excitement':
            case 'excited':
                this.state.emotionalState.energy = intensity;
                break;
            case 'focus':
            case 'focused':
                this.state.emotionalState.focus = intensity;
                break;
            case 'mysticism':
            case 'mystical':
                this.state.emotionalState.mysticism = intensity;
                break;
            case 'wisdom':
            case 'wise':
                this.state.emotionalState.mysticism = intensity;
                this.state.emotionalState.focus = intensity * 0.8;
                break;
            default:
                // Reset to neutral
                this.state.emotionalState.happiness = 0.5;
                this.state.emotionalState.energy = 0.5;
                this.state.emotionalState.focus = 0.6;
                this.state.emotionalState.mysticism = 0.4;
        }
    }
}

module.exports = GrimReaperHuskyMascot;

// Example usage for testing
if (require.main === module) {
    console.log('🐺💀 Testing Grim Reaper Husky Mascot...');
    
    const husky = new GrimReaperHuskyMascot({
        character: {
            personality: 'wise_playful'
        },
        ai: {
            replicateIntegration: {
                enabled: false // Disable for testing
            }
        }
    });
    
    // Test mode switching
    setTimeout(async () => {
        console.log('\n🧪 Testing mode switches...');
        await husky.switchMode('reaper');
        setTimeout(() => husky.switchMode('playful'), 2000);
        setTimeout(() => husky.switchMode('wise'), 4000);
        setTimeout(() => husky.switchMode('professional'), 6000);
    }, 1000);
    
    // Test document reaction
    setTimeout(async () => {
        console.log('\n🧪 Testing document reaction...');
        await husky.reactToDocument({
            type: 'business_plan',
            content: 'This is a comprehensive business plan with financial projections and market analysis.',
            urgent: false
        });
    }, 3000);
    
    // Test emotion expression
    setTimeout(async () => {
        console.log('\n🧪 Testing emotion expressions...');
        await husky.expressEmotion('excitement', 0.9);
        setTimeout(() => husky.expressEmotion('curiosity', 0.7), 2000);
        setTimeout(() => husky.expressEmotion('wisdom', 0.8), 4000);
    }, 5000);
    
    // Test soul collection
    setTimeout(async () => {
        console.log('\n🧪 Testing soul collection...');
        await husky.collectDocumentSoul({
            type: 'boring_document',
            complexity: 'medium'
        });
    }, 8000);
}