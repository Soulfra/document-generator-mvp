#!/usr/bin/env node

/**
 * 🎵 FEEDBACK LAYER 🎵
 * 
 * Wire color/audio/haptic feedback to service responses
 * Uses existing color systems, audio patterns, and haptic feedback
 */

const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

class FeedbackLayer extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.dataDir = path.join(process.cwd(), 'feedback-layer-data');
        this.configPath = path.join(this.dataDir, 'feedback-config.json');
        
        // Connect to existing feedback systems
        this.existingSystems = {
            colorGames: './color-coded-education-system.js',
            mobileInterface: './mobile-color-games-interface.js',
            harmonyBuilder: './harmony-builder.js', // Assumed to exist
            audioSystem: './audio-feedback-system.js' // Assumed to exist
        };
        
        // Color feedback mappings
        this.colorFeedback = {
            success: {
                primary: '#4ADE80',    // Green
                secondary: '#10B981',  // Emerald
                accent: '#6EE7B7',     // Light green
                gradient: 'linear-gradient(135deg, #10B981, #4ADE80)'
            },
            error: {
                primary: '#F87171',    // Red
                secondary: '#DC2626',  // Dark red
                accent: '#FCA5A5',     // Light red
                gradient: 'linear-gradient(135deg, #DC2626, #F87171)'
            },
            warning: {
                primary: '#FBBF24',    // Yellow
                secondary: '#F59E0B',  // Amber
                accent: '#FEF3C7',     // Light yellow
                gradient: 'linear-gradient(135deg, #F59E0B, #FBBF24)'
            },
            info: {
                primary: '#60A5FA',    // Blue
                secondary: '#2563EB',  // Dark blue
                accent: '#DBEAFE',     // Light blue
                gradient: 'linear-gradient(135deg, #2563EB, #60A5FA)'
            },
            progress: {
                primary: '#8B5CF6',    // Purple
                secondary: '#7C3AED',  // Dark purple
                accent: '#DDD6FE',     // Light purple
                gradient: 'linear-gradient(135deg, #7C3AED, #8B5CF6)'
            },
            neutral: {
                primary: '#6B7280',    // Gray
                secondary: '#4B5563',  // Dark gray
                accent: '#E5E7EB',     // Light gray
                gradient: 'linear-gradient(135deg, #4B5563, #6B7280)'
            }
        };
        
        // Audio feedback patterns (frequencies and durations)
        this.audioFeedback = {
            success: {
                type: 'chord',
                frequencies: [261.63, 329.63, 392.00], // C Major chord
                duration: 500,
                volume: 0.3,
                envelope: 'smooth'
            },
            error: {
                type: 'dissonance',
                frequencies: [220, 233.08], // A and Bb (dissonant)
                duration: 300,
                volume: 0.4,
                envelope: 'sharp'
            },
            warning: {
                type: 'sequence',
                frequencies: [440, 523.25, 440], // A, C, A
                duration: 200,
                volume: 0.25,
                envelope: 'pulse'
            },
            info: {
                type: 'tone',
                frequencies: [523.25], // C
                duration: 150,
                volume: 0.2,
                envelope: 'soft'
            },
            progress: {
                type: 'ascending',
                frequencies: [261.63, 293.66, 329.63, 349.23], // C D E F
                duration: 100,
                volume: 0.15,
                envelope: 'gentle'
            },
            level_up: {
                type: 'fanfare',
                frequencies: [523.25, 659.25, 783.99, 1046.50], // C E G C
                duration: 800,
                volume: 0.4,
                envelope: 'celebration'
            }
        };
        
        // Haptic feedback patterns (from mobile interface)
        this.hapticFeedback = {
            success: { pattern: [100, 50, 100], intensity: 0.6 },
            error: { pattern: [150, 100, 150], intensity: 1.0 },
            warning: { pattern: [50, 50, 50, 50, 50], intensity: 0.4 },
            info: { pattern: [25], intensity: 0.3 },
            progress: { pattern: [30, 20, 30], intensity: 0.5 },
            level_up: { pattern: [200, 100, 200, 100, 300], intensity: 0.8 },
            tap: { pattern: [15], intensity: 0.3 },
            hold: { pattern: [100], intensity: 0.4 },
            swipe: { pattern: [50, 30, 50], intensity: 0.5 }
        };
        
        // Service response → feedback type mapping
        this.serviceFeedbackMap = {
            // Gaming responses
            'game-started': { color: 'info', audio: 'info', haptic: 'tap' },
            'game-completed': { color: 'success', audio: 'success', haptic: 'success' },
            'game-failed': { color: 'error', audio: 'error', haptic: 'error' },
            'score-achieved': { color: 'progress', audio: 'progress', haptic: 'progress' },
            'level-completed': { color: 'success', audio: 'level_up', haptic: 'level_up' },
            'pattern-matched': { color: 'success', audio: 'success', haptic: 'tap' },
            'pattern-failed': { color: 'warning', audio: 'warning', haptic: 'error' },
            
            // Story responses
            'story-started': { color: 'info', audio: 'info', haptic: 'tap' },
            'chapter-completed': { color: 'success', audio: 'level_up', haptic: 'level_up' },
            'choice-made': { color: 'progress', audio: 'info', haptic: 'tap' },
            
            // Testing responses
            'test-started': { color: 'info', audio: 'info', haptic: 'tap' },
            'question-correct': { color: 'success', audio: 'success', haptic: 'tap' },
            'question-incorrect': { color: 'error', audio: 'error', haptic: 'error' },
            'test-completed': { color: 'success', audio: 'level_up', haptic: 'success' },
            
            // System responses
            'service-connected': { color: 'success', audio: 'info', haptic: 'tap' },
            'service-error': { color: 'error', audio: 'error', haptic: 'error' },
            'loading': { color: 'progress', audio: null, haptic: null },
            'action-completed': { color: 'success', audio: 'success', haptic: 'success' },
            
            // Boss battle responses
            'boss-encountered': { color: 'warning', audio: 'warning', haptic: 'warning' },
            'boss-defeated': { color: 'success', audio: 'level_up', haptic: 'level_up' },
            'boss-attack': { color: 'error', audio: 'error', haptic: 'error' },
            
            // Quest responses
            'quest-started': { color: 'info', audio: 'info', haptic: 'tap' },
            'quest-completed': { color: 'success', audio: 'level_up', haptic: 'level_up' },
            'objective-completed': { color: 'progress', audio: 'progress', haptic: 'progress' }
        };
        
        // Active feedback sessions
        this.activeFeedback = new Map();
        
        console.log('🎵 Feedback Layer initializing...');
    }
    
    async initialize() {
        console.log('🎨 Setting up feedback systems...');
        
        // Create data directory
        await fs.mkdir(this.dataDir, { recursive: true });
        
        // Load existing configuration
        await this.loadConfiguration();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize audio context (browser only)
        this.setupAudioContext();
        
        console.log('✅ Feedback layer ready!');
    }
    
    async loadConfiguration() {
        try {
            const configData = await fs.readFile(this.configPath, 'utf-8');
            const config = JSON.parse(configData);
            
            // Merge with existing configurations
            Object.assign(this.colorFeedback, config.colorFeedback || {});
            Object.assign(this.audioFeedback, config.audioFeedback || {});
            Object.assign(this.hapticFeedback, config.hapticFeedback || {});
            Object.assign(this.serviceFeedbackMap, config.serviceFeedbackMap || {});
            
            console.log('   Loaded feedback configuration');
        } catch (error) {
            console.log('   No existing configuration found, using defaults');
            await this.saveConfiguration();
        }
    }
    
    async saveConfiguration() {
        const config = {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            colorFeedback: this.colorFeedback,
            audioFeedback: this.audioFeedback,
            hapticFeedback: this.hapticFeedback,
            serviceFeedbackMap: this.serviceFeedbackMap
        };
        
        await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
    }
    
    setupEventListeners() {
        // Listen for service responses
        this.on('service-response', this.handleServiceResponse.bind(this));
        this.on('user-action', this.handleUserAction.bind(this));
        this.on('system-event', this.handleSystemEvent.bind(this));
        
        console.log('   Set up feedback event listeners');
    }
    
    setupAudioContext() {
        // Browser-only audio setup
        if (typeof window !== 'undefined' && window.AudioContext) {
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                console.log('   Audio context initialized');
            } catch (error) {
                console.log('   Audio not available in this environment');
            }
        }
    }
    
    // Core feedback methods
    async handleServiceResponse(data) {
        const { userId, service, action, response, success = true } = data;
        
        // Determine feedback type based on response
        const feedbackType = this.determineFeedbackType(action, response, success);
        
        // Generate feedback
        const feedback = await this.generateFeedback(userId, feedbackType, {
            service,
            action,
            response,
            timestamp: new Date()
        });
        
        // Emit feedback for UI consumption
        this.emit('feedback-generated', { userId, feedback });
        
        console.log(`🎵 Generated ${feedbackType} feedback for ${userId} (${service}.${action})`);
    }
    
    determineFeedbackType(action, response, success) {
        // Check specific action mapping first
        if (this.serviceFeedbackMap[action]) {
            return action;
        }
        
        // Check response content for clues
        if (response && typeof response === 'object') {
            if (response.error) return 'service-error';
            if (response.score !== undefined) return 'score-achieved';
            if (response.level !== undefined) return 'level-completed';
            if (response.completed) return 'action-completed';
        }
        
        // Default based on success
        return success ? 'action-completed' : 'service-error';
    }
    
    async generateFeedback(userId, feedbackType, context) {
        const mapping = this.serviceFeedbackMap[feedbackType] || {
            color: 'neutral',
            audio: 'info',
            haptic: 'tap'
        };
        
        const feedback = {
            userId,
            type: feedbackType,
            timestamp: context.timestamp,
            color: this.generateColorFeedback(mapping.color),
            audio: this.generateAudioFeedback(mapping.audio),
            haptic: this.generateHapticFeedback(mapping.haptic),
            context
        };
        
        // Store active feedback
        this.activeFeedback.set(`${userId}-${Date.now()}`, feedback);
        
        return feedback;
    }
    
    generateColorFeedback(colorType) {
        const colors = this.colorFeedback[colorType] || this.colorFeedback.neutral;
        
        return {
            type: colorType,
            primary: colors.primary,
            secondary: colors.secondary,
            accent: colors.accent,
            gradient: colors.gradient,
            css: {
                backgroundColor: colors.primary,
                borderColor: colors.secondary,
                color: this.getContrastColor(colors.primary),
                background: colors.gradient
            },
            animation: {
                pulse: `0 0 20px ${colors.primary}`,
                glow: `0 0 30px ${colors.accent}`,
                border: `2px solid ${colors.secondary}`
            }
        };
    }
    
    generateAudioFeedback(audioType) {
        if (!audioType || !this.audioFeedback[audioType]) {
            return null;
        }
        
        const audio = this.audioFeedback[audioType];
        
        return {
            type: audioType,
            frequencies: audio.frequencies,
            duration: audio.duration,
            volume: audio.volume,
            envelope: audio.envelope,
            playable: this.audioContext !== undefined,
            webAudioAPI: this.createWebAudioInstructions(audio)
        };
    }
    
    generateHapticFeedback(hapticType) {
        if (!hapticType || !this.hapticFeedback[hapticType]) {
            return null;
        }
        
        const haptic = this.hapticFeedback[hapticType];
        
        return {
            type: hapticType,
            pattern: haptic.pattern,
            intensity: haptic.intensity,
            supported: 'vibrate' in navigator,
            instructions: {
                navigator: `navigator.vibrate([${haptic.pattern.join(', ')}])`,
                intensity: haptic.intensity
            }
        };
    }
    
    createWebAudioInstructions(audio) {
        // Generate Web Audio API code for playing the sound
        return {
            setup: `
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
            `,
            play: `
                oscillator.frequency.setValueAtTime(${audio.frequencies[0]}, audioContext.currentTime);
                gainNode.gain.setValueAtTime(${audio.volume}, audioContext.currentTime);
                oscillator.start();
                oscillator.stop(audioContext.currentTime + ${audio.duration / 1000});
            `
        };
    }
    
    getContrastColor(hexColor) {
        // Simple contrast calculation
        const r = parseInt(hexColor.slice(1, 3), 16);
        const g = parseInt(hexColor.slice(3, 5), 16);
        const b = parseInt(hexColor.slice(5, 7), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        return luminance > 0.5 ? '#000000' : '#FFFFFF';
    }
    
    // User interaction handlers
    async handleUserAction(data) {
        const { userId, action, element, gesture } = data;
        
        let feedbackType = 'tap'; // Default
        
        if (gesture) {
            feedbackType = gesture; // swipe, hold, etc.
        } else if (action) {
            feedbackType = action; // click, submit, etc.
        }
        
        const feedback = await this.generateFeedback(userId, feedbackType, {
            action,
            element,
            gesture,
            timestamp: new Date()
        });
        
        this.emit('feedback-generated', { userId, feedback });
    }
    
    async handleSystemEvent(data) {
        const { userId, eventType, details } = data;
        
        const feedback = await this.generateFeedback(userId, eventType, {
            eventType,
            details,
            timestamp: new Date()
        });
        
        this.emit('feedback-generated', { userId, feedback });
    }
    
    // Public API methods
    async triggerFeedback(userId, feedbackType, context = {}) {
        return this.generateFeedback(userId, feedbackType, {
            ...context,
            timestamp: new Date()
        });
    }
    
    getFeedbackForAction(action) {
        return this.serviceFeedbackMap[action] || null;
    }
    
    getColorPalette(colorType) {
        return this.colorFeedback[colorType] || this.colorFeedback.neutral;
    }
    
    getAudioPattern(audioType) {
        return this.audioFeedback[audioType] || null;
    }
    
    getHapticPattern(hapticType) {
        return this.hapticFeedback[hapticType] || null;
    }
    
    // Integration helpers
    generateUIFeedbackCSS() {
        let css = `
            /* Feedback Layer Generated CSS */
            
            .feedback-success {
                background: ${this.colorFeedback.success.gradient};
                color: ${this.getContrastColor(this.colorFeedback.success.primary)};
                box-shadow: ${this.colorFeedback.success.primary} 0 0 20px;
            }
            
            .feedback-error {
                background: ${this.colorFeedback.error.gradient};
                color: ${this.getContrastColor(this.colorFeedback.error.primary)};
                box-shadow: ${this.colorFeedback.error.primary} 0 0 20px;
            }
            
            .feedback-warning {
                background: ${this.colorFeedback.warning.gradient};
                color: ${this.getContrastColor(this.colorFeedback.warning.primary)};
                box-shadow: ${this.colorFeedback.warning.primary} 0 0 20px;
            }
            
            .feedback-info {
                background: ${this.colorFeedback.info.gradient};
                color: ${this.getContrastColor(this.colorFeedback.info.primary)};
                box-shadow: ${this.colorFeedback.info.primary} 0 0 20px;
            }
            
            .feedback-progress {
                background: ${this.colorFeedback.progress.gradient};
                color: ${this.getContrastColor(this.colorFeedback.progress.primary)};
                box-shadow: ${this.colorFeedback.progress.primary} 0 0 20px;
            }
            
            @keyframes feedback-pulse {
                0% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.05); opacity: 0.8; }
                100% { transform: scale(1); opacity: 1; }
            }
            
            .feedback-active {
                animation: feedback-pulse 0.3s ease-in-out;
            }
        `;
        
        return css;
    }
    
    generateMobileIntegrationCode() {
        return `
            // Mobile Feedback Integration
            class MobileFeedback {
                static async trigger(type, context = {}) {
                    const feedback = await feedbackLayer.triggerFeedback('mobile-user', type, context);
                    
                    // Apply color feedback
                    if (feedback.color) {
                        document.body.style.setProperty('--feedback-color', feedback.color.primary);
                        document.body.classList.add('feedback-active');
                        setTimeout(() => document.body.classList.remove('feedback-active'), 300);
                    }
                    
                    // Trigger haptic feedback
                    if (feedback.haptic && feedback.haptic.supported) {
                        navigator.vibrate(feedback.haptic.pattern);
                    }
                    
                    // Play audio feedback
                    if (feedback.audio && feedback.audio.playable) {
                        // Execute Web Audio API code
                        eval(feedback.audio.webAudioAPI.setup);
                        eval(feedback.audio.webAudioAPI.play);
                    }
                    
                    return feedback;
                }
            }
        `;
    }
    
    generateFeedbackReport() {
        const report = {
            totalFeedbackTypes: Object.keys(this.serviceFeedbackMap).length,
            colorTypes: Object.keys(this.colorFeedback).length,
            audioTypes: Object.keys(this.audioFeedback).length,
            hapticTypes: Object.keys(this.hapticFeedback).length,
            activeFeedback: this.activeFeedback.size,
            capabilities: {
                color: true,
                audio: this.audioContext !== undefined,
                haptic: typeof navigator !== 'undefined' && 'vibrate' in navigator
            }
        };
        
        return report;
    }
}

// Export for use as module
module.exports = FeedbackLayer;

// CLI interface
if (require.main === module) {
    const feedback = new FeedbackLayer();
    
    console.log('🎵 FEEDBACK LAYER');
    console.log('================\n');
    
    const command = process.argv[2];
    const args = process.argv.slice(3);
    
    async function run() {
        await feedback.initialize();
        
        switch (command) {
            case 'test':
                if (args[0]) {
                    const feedbackType = args[0];
                    const result = await feedback.triggerFeedback('test-user', feedbackType);
                    
                    console.log(`🎵 Generated ${feedbackType} feedback:`);
                    console.log(JSON.stringify(result, null, 2));
                } else {
                    console.log('Usage: node feedback-layer.js test <feedback-type>');
                    console.log('Available types:', Object.keys(feedback.serviceFeedbackMap).join(', '));
                }
                break;
                
            case 'colors':
                console.log('🎨 Color Palette:\n');
                Object.entries(feedback.colorFeedback).forEach(([type, colors]) => {
                    console.log(`${type}:`);
                    console.log(`  Primary: ${colors.primary}`);
                    console.log(`  Secondary: ${colors.secondary}`);
                    console.log(`  Accent: ${colors.accent}`);
                    console.log();
                });
                break;
                
            case 'audio':
                console.log('🔊 Audio Patterns:\n');
                Object.entries(feedback.audioFeedback).forEach(([type, audio]) => {
                    console.log(`${type}:`);
                    console.log(`  Type: ${audio.type}`);
                    console.log(`  Frequencies: ${audio.frequencies.join(', ')} Hz`);
                    console.log(`  Duration: ${audio.duration}ms`);
                    console.log();
                });
                break;
                
            case 'haptic':
                console.log('📳 Haptic Patterns:\n');
                Object.entries(feedback.hapticFeedback).forEach(([type, haptic]) => {
                    console.log(`${type}:`);
                    console.log(`  Pattern: [${haptic.pattern.join(', ')}]ms`);
                    console.log(`  Intensity: ${haptic.intensity}`);
                    console.log();
                });
                break;
                
            case 'css':
                console.log('🎨 Generated CSS:\n');
                console.log(feedback.generateUIFeedbackCSS());
                break;
                
            case 'mobile':
                console.log('📱 Mobile Integration Code:\n');
                console.log(feedback.generateMobileIntegrationCode());
                break;
                
            case 'report':
                const report = feedback.generateFeedbackReport();
                
                console.log('📊 Feedback Layer Report:\n');
                console.log(`Total Feedback Types: ${report.totalFeedbackTypes}`);
                console.log(`Color Types: ${report.colorTypes}`);
                console.log(`Audio Types: ${report.audioTypes}`);
                console.log(`Haptic Types: ${report.hapticTypes}`);
                console.log();
                
                console.log('Capabilities:');
                Object.entries(report.capabilities).forEach(([cap, available]) => {
                    console.log(`  ${cap}: ${available ? '✅' : '❌'}`);
                });
                break;
                
            default:
                console.log('Available commands:');
                console.log('  test <type>    - Test feedback generation');
                console.log('  colors         - Show color palette');
                console.log('  audio          - Show audio patterns');
                console.log('  haptic         - Show haptic patterns');
                console.log('  css            - Generate UI CSS');
                console.log('  mobile         - Show mobile integration code');
                console.log('  report         - Show system report');
                console.log();
                console.log('Example: node feedback-layer.js test success');
        }
    }
    
    run().catch(console.error);
}