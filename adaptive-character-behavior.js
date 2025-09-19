/**
 * 🎮🧠💫 Adaptive Character Behavior System
 * Characters that adapt to device type, user patterns, and interaction methods
 * Where Reality Adapts to You™
 */

class AdaptiveCharacterBehavior {
    constructor() {
        this.deviceProfile = null;
        this.interactionMethod = null;
        this.attentionPattern = 'normal';
        this.behaviorHistory = [];
        this.characterStates = new Map();
        this.lastInteraction = Date.now();
        
        // ADHD-like attention patterns
        this.attentionPatterns = {
            hyperfocus: {
                name: 'Hyperfocus',
                duration: 300000, // 5 min bursts
                switchRate: 0.1,
                animationSpeed: 0.5,
                particleCount: 5,
                description: 'Locked onto single stream'
            },
            scattered: {
                name: 'Scattered',
                duration: 30000, // 30 sec bursts
                switchRate: 0.9,
                animationSpeed: 2.0,
                particleCount: 20,
                description: 'Jumping between streams rapidly'
            },
            fidgety: {
                name: 'Fidgety',
                duration: 60000, // 1 min cycles
                switchRate: 0.5,
                animationSpeed: 1.5,
                particleCount: 10,
                description: 'Constant micro-movements'
            },
            normal: {
                name: 'Normal',
                duration: 120000, // 2 min average
                switchRate: 0.3,
                animationSpeed: 1.0,
                particleCount: 8,
                description: 'Balanced attention'
            }
        };

        // Device-specific behaviors
        this.deviceBehaviors = {
            mouse: {
                precision: 'high',
                gestureType: 'click',
                hoverEnabled: true,
                feedbackDelay: 100,
                cursorStyle: 'precise',
                animations: ['hover-glow', 'click-ripple', 'trail-follow']
            },
            touch: {
                precision: 'medium',
                gestureType: 'tap',
                hoverEnabled: false,
                feedbackDelay: 50,
                touchRadius: 44, // iOS standard
                animations: ['tap-burst', 'swipe-trail', 'pinch-zoom']
            },
            keyboard: {
                precision: 'instant',
                gestureType: 'key',
                hoverEnabled: false,
                feedbackDelay: 0,
                shortcuts: true,
                animations: ['key-flash', 'focus-ring', 'type-ahead']
            },
            vision: {
                precision: 'spatial',
                gestureType: 'gaze',
                hoverEnabled: true,
                feedbackDelay: 200,
                spatialDepth: true,
                animations: ['gaze-highlight', 'hand-track', 'depth-shift']
            },
            gamepad: {
                precision: 'analog',
                gestureType: 'button',
                hoverEnabled: false,
                feedbackDelay: 0,
                rumbleEnabled: true,
                animations: ['button-press', 'stick-direction', 'trigger-squeeze']
            }
        };

        // Character personality traits
        this.personalities = {
            energetic: {
                baseSpeed: 1.5,
                reactivity: 0.9,
                curiosity: 0.8,
                restlessness: 0.7,
                emojis: ['⚡', '🚀', '💥', '🔥', '✨']
            },
            calm: {
                baseSpeed: 0.7,
                reactivity: 0.3,
                curiosity: 0.5,
                restlessness: 0.2,
                emojis: ['🌊', '☁️', '🍃', '💤', '🧘']
            },
            playful: {
                baseSpeed: 1.2,
                reactivity: 0.8,
                curiosity: 0.9,
                restlessness: 0.6,
                emojis: ['🎮', '🎨', '🎯', '🎪', '🎭']
            },
            focused: {
                baseSpeed: 1.0,
                reactivity: 0.5,
                curiosity: 0.4,
                restlessness: 0.1,
                emojis: ['🎯', '🔍', '📊', '💡', '🧠']
            }
        };

        this.init();
    }

    async init() {
        console.log('🧠 Initializing Adaptive Character Behavior System...');
        
        // Detect initial device and interaction method
        await this.detectDevice();
        this.detectInteractionMethod();
        
        // Start behavior monitoring
        this.startBehaviorTracking();
        
        // Initialize character states for each domain
        this.initializeCharacters();
        
        console.log('✅ Character behavior system ready');
    }

    async detectDevice() {
        const ua = navigator.userAgent || '';
        const platform = navigator.platform || '';
        
        this.deviceProfile = {
            // Basic device detection
            isMobile: /Mobile|Android|iPhone|iPad/i.test(ua),
            isTablet: /iPad|Android.*Tablet/i.test(ua),
            isDesktop: !(/Mobile|Android|iPhone|iPad/i.test(ua)),
            isTouchDevice: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
            
            // Platform detection
            isIOS: /iPhone|iPad|iPod/i.test(ua),
            isAndroid: /Android/i.test(ua),
            isMac: /Mac/i.test(platform),
            isWindows: /Win/i.test(platform),
            
            // Special devices
            isVisionPro: /VisionPro/i.test(ua) || window.xr?.isSessionSupported?.('immersive-ar'),
            
            // Screen info
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
            pixelRatio: window.devicePixelRatio || 1,
            
            // Capabilities
            hasGyroscope: 'DeviceOrientationEvent' in window,
            hasAccelerometer: 'DeviceMotionEvent' in window,
            hasGamepad: 'getGamepads' in navigator,
            hasWebcam: navigator.mediaDevices?.getUserMedia !== undefined,
            
            // Performance hints
            reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
            lowPowerMode: navigator.getBattery ? (await navigator.getBattery()).level < 0.2 : false
        };

        console.log('📱 Device detected:', this.deviceProfile);
        return this.deviceProfile;
    }

    detectInteractionMethod() {
        // Start with default based on device
        if (this.deviceProfile.isTouchDevice && this.deviceProfile.isMobile) {
            this.setInteractionMethod('touch');
        } else if (this.deviceProfile.isVisionPro) {
            this.setInteractionMethod('vision');
        } else {
            this.setInteractionMethod('mouse');
        }

        // Listen for actual interaction to confirm/update
        this.setupInteractionListeners();
    }

    setupInteractionListeners() {
        // Mouse detection
        document.addEventListener('mousemove', () => {
            if (this.interactionMethod !== 'mouse') {
                this.setInteractionMethod('mouse');
            }
        }, { once: true });

        // Touch detection
        document.addEventListener('touchstart', () => {
            this.setInteractionMethod('touch');
        }, { once: true });

        // Keyboard detection
        document.addEventListener('keydown', () => {
            if (this.interactionMethod !== 'keyboard') {
                this.previousMethod = this.interactionMethod;
                this.setInteractionMethod('keyboard');
            }
        });

        // Gamepad detection
        window.addEventListener('gamepadconnected', (e) => {
            console.log('🎮 Gamepad connected:', e.gamepad.id);
            this.setInteractionMethod('gamepad');
        });

        // Vision Pro gesture detection (when available)
        if (window.HandTrackingAPI) {
            window.HandTrackingAPI.ongesture = () => {
                this.setInteractionMethod('vision');
            };
        }
    }

    setInteractionMethod(method) {
        if (this.interactionMethod !== method) {
            this.interactionMethod = method;
            console.log(`🎯 Interaction method changed to: ${method}`);
            
            // Update all characters with new interaction method
            this.updateAllCharacters();
            
            // Emit event for other systems
            this.emitBehaviorChange('interaction', method);
        }
    }

    startBehaviorTracking() {
        // Track interaction frequency
        this.interactionTracker = setInterval(() => {
            const timeSinceLastInteraction = Date.now() - this.lastInteraction;
            
            // Detect attention pattern changes
            if (timeSinceLastInteraction < 5000) {
                this.adjustAttentionPattern('active');
            } else if (timeSinceLastInteraction > 30000) {
                this.adjustAttentionPattern('idle');
            }
            
            // Clean old history
            this.behaviorHistory = this.behaviorHistory.filter(
                entry => Date.now() - entry.timestamp < 300000 // Keep 5 min
            );
        }, 1000);

        // Track focus changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.adjustAttentionPattern('away');
            } else {
                this.adjustAttentionPattern('returned');
            }
        });

        // Track rapid clicking/tapping (fidgety behavior)
        let clickCount = 0;
        let clickTimer;
        
        document.addEventListener('click', () => {
            clickCount++;
            clearTimeout(clickTimer);
            
            clickTimer = setTimeout(() => {
                if (clickCount > 5) {
                    this.adjustAttentionPattern('fidgety');
                } else if (clickCount === 1) {
                    this.adjustAttentionPattern('focused');
                }
                clickCount = 0;
            }, 2000);
        });
    }

    adjustAttentionPattern(trigger) {
        const patterns = {
            active: () => {
                if (this.behaviorHistory.filter(e => e.type === 'switch').length > 10) {
                    return 'scattered';
                }
                return 'normal';
            },
            idle: () => 'hyperfocus',
            away: () => 'normal',
            returned: () => 'fidgety',
            fidgety: () => 'fidgety',
            focused: () => 'hyperfocus'
        };

        const newPattern = patterns[trigger]?.() || 'normal';
        
        if (this.attentionPattern !== newPattern) {
            console.log(`🎯 Attention pattern changed: ${this.attentionPattern} → ${newPattern}`);
            this.attentionPattern = newPattern;
            this.updateAllCharacters();
        }

        this.recordBehavior('attention', { trigger, pattern: newPattern });
    }

    initializeCharacters() {
        const domains = ['red', 'orange', 'yellow', 'green', 'white', 'blue', 'indigo', 'violet', 'black'];
        const personalityTypes = Object.keys(this.personalities);

        domains.forEach((domain, index) => {
            // Assign personality based on domain
            const personality = personalityTypes[index % personalityTypes.length];
            
            this.characterStates.set(domain, {
                domain,
                personality,
                state: 'idle',
                energy: 1.0,
                position: { x: 0, y: 0 },
                velocity: { x: 0, y: 0 },
                animations: [],
                lastUpdate: Date.now()
            });
        });
    }

    updateAllCharacters() {
        this.characterStates.forEach((character, domain) => {
            this.updateCharacterBehavior(domain);
        });
    }

    updateCharacterBehavior(domain) {
        const character = this.characterStates.get(domain);
        if (!character) return;

        const personality = this.personalities[character.personality];
        const behavior = this.deviceBehaviors[this.interactionMethod];
        const attention = this.attentionPatterns[this.attentionPattern];

        // Calculate behavior modifiers
        const speedModifier = personality.baseSpeed * attention.animationSpeed;
        const reactivityModifier = personality.reactivity * (1 + attention.switchRate);

        // Update character state
        character.behaviorModifiers = {
            speed: speedModifier,
            reactivity: reactivityModifier,
            particleCount: Math.floor(attention.particleCount * personality.curiosity),
            animations: behavior.animations,
            restlessness: personality.restlessness * attention.animationSpeed
        };

        // Emit update event
        this.emitCharacterUpdate(domain, character);
    }

    recordBehavior(type, data) {
        this.behaviorHistory.push({
            type,
            data,
            timestamp: Date.now(),
            interactionMethod: this.interactionMethod,
            attentionPattern: this.attentionPattern
        });

        this.lastInteraction = Date.now();
    }

    // Event emitters for integration
    emitBehaviorChange(type, value) {
        const event = new CustomEvent('behaviorChange', {
            detail: { type, value, timestamp: Date.now() }
        });
        document.dispatchEvent(event);
    }

    emitCharacterUpdate(domain, character) {
        const event = new CustomEvent('characterUpdate', {
            detail: { domain, character, timestamp: Date.now() }
        });
        document.dispatchEvent(event);
    }

    // Public API
    getCharacterState(domain) {
        return this.characterStates.get(domain);
    }

    getAttentionPattern() {
        return this.attentionPatterns[this.attentionPattern];
    }

    getDeviceProfile() {
        return this.deviceProfile;
    }

    getInteractionMethod() {
        return this.interactionMethod;
    }

    getBehaviorInsights() {
        const recentBehaviors = this.behaviorHistory.slice(-50);
        
        return {
            dominantInteraction: this.interactionMethod,
            currentAttention: this.attentionPattern,
            switchFrequency: recentBehaviors.filter(b => b.type === 'switch').length / 50,
            activeTime: Date.now() - this.lastInteraction,
            behaviorProfile: this.analyzeBehaviorProfile(recentBehaviors)
        };
    }

    analyzeBehaviorProfile(behaviors) {
        // Simple behavior profiling
        const profile = {
            explorer: behaviors.filter(b => b.type === 'hover').length / behaviors.length,
            clicker: behaviors.filter(b => b.type === 'click').length / behaviors.length,
            switcher: behaviors.filter(b => b.type === 'switch').length / behaviors.length,
            focuser: behaviors.filter(b => b.type === 'focus').length / behaviors.length
        };

        // Determine dominant behavior
        const dominant = Object.entries(profile)
            .sort(([,a], [,b]) => b - a)[0][0];

        return { ...profile, dominant };
    }

    // Cleanup
    destroy() {
        clearInterval(this.interactionTracker);
        // Remove event listeners
        document.removeEventListener('mousemove', this.detectInteractionMethod);
        document.removeEventListener('touchstart', this.detectInteractionMethod);
        document.removeEventListener('keydown', this.detectInteractionMethod);
    }
}

// Export for use in streaming platform
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdaptiveCharacterBehavior;
} else {
    window.AdaptiveCharacterBehavior = AdaptiveCharacterBehavior;
}

console.log('🎮🧠💫 Adaptive Character Behavior System loaded');