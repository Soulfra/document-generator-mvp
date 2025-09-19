/**
 * 🗣️🔤🎵 Linguistic Interaction System
 * Vowel/consonant variations and platform allegiance Easter eggs
 * Where Language Evolves with Interaction™
 */

class LinguisticInteractionSystem {
    constructor() {
        this.currentMode = '.ey';
        this.platformAllegiance = null;
        this.linguisticProfile = null;
        this.voicePattern = null;
        
        // .ey system variations (3 iterations)
        this.vowelModes = {
            '.ey': {
                name: 'Standard',
                description: 'Normal interaction speed',
                timing: 1.0,
                pitch: 1.0,
                personality: 'balanced',
                responseStyle: 'measured',
                emojiSpeed: 'normal',
                characterBehavior: {
                    animationSpeed: 1.0,
                    reactionDelay: 200,
                    attentionSpan: 5000
                }
            },
            '.eey': {
                name: 'Extended',
                description: 'Slow, thoughtful responses',
                timing: 1.5,
                pitch: 0.9,
                personality: 'contemplative',
                responseStyle: 'verbose',
                emojiSpeed: 'slow',
                characterBehavior: {
                    animationSpeed: 0.7,
                    reactionDelay: 500,
                    attentionSpan: 10000
                }
            },
            '.eyy': {
                name: 'Quick',
                description: 'Fast, twitchy responses',
                timing: 0.6,
                pitch: 1.1,
                personality: 'energetic',
                responseStyle: 'brief',
                emojiSpeed: 'fast',
                characterBehavior: {
                    animationSpeed: 1.8,
                    reactionDelay: 50,
                    attentionSpan: 2000
                }
            }
        };

        // Platform battle system
        this.platformBattles = {
            appleGoogle: {
                name: 'Creative Alliance',
                emojis: ['🍎', '🔍'],
                color: '#4285F4',
                values: ['privacy', 'ecosystem', 'design'],
                rivals: ['microsoftOpenAI'],
                traits: {
                    precision: 0.9,
                    creativity: 0.8,
                    openness: 0.6
                }
            },
            microsoftOpenAI: {
                name: 'Enterprise Intelligence',
                emojis: ['🪟', '🤖'],
                color: '#00BCF2',
                values: ['productivity', 'ai', 'enterprise'],
                rivals: ['appleGoogle'],
                traits: {
                    productivity: 0.9,
                    intelligence: 0.8,
                    compatibility: 0.7
                }
            },
            neutral: {
                name: 'Independent',
                emojis: ['🌐', '⚖️'],
                color: '#888888',
                values: ['freedom', 'choice', 'balance'],
                rivals: [],
                traits: {
                    flexibility: 0.9,
                    adaptability: 0.8,
                    neutrality: 1.0
                }
            }
        };

        // Linguistic patterns based on interaction
        this.interactionPatterns = {
            mouse: {
                consonantStrength: 0.8,
                vowelLength: 1.0,
                rhythm: 'steady',
                textTransform: 'precise'
            },
            touch: {
                consonantStrength: 0.6,
                vowelLength: 1.2,
                rhythm: 'flowing',
                textTransform: 'smooth'
            },
            keyboard: {
                consonantStrength: 1.0,
                vowelLength: 0.8,
                rhythm: 'staccato',
                textTransform: 'sharp'
            },
            voice: {
                consonantStrength: 0.5,
                vowelLength: 1.5,
                rhythm: 'melodic',
                textTransform: 'fluid'
            }
        };

        // Phonetic transformations
        this.phoneticRules = {
            vowelExpansion: {
                'a': ['a', 'aa', 'aaa'],
                'e': ['e', 'ee', 'eee'],
                'i': ['i', 'ii', 'iii'],
                'o': ['o', 'oo', 'ooo'],
                'u': ['u', 'uu', 'uuu'],
                'y': ['y', 'yy', 'yyy']
            },
            consonantModulation: {
                soft: ['b', 'd', 'g', 'v', 'z', 'j', 'w', 'l', 'r', 'm', 'n'],
                hard: ['p', 't', 'k', 'f', 's', 'ch', 'h', 'x'],
                mixed: ['c', 'q', 'y']
            }
        };

        // Easter egg triggers
        this.easterEggPatterns = {
            'apple': () => this.triggerAllegiance('appleGoogle'),
            'google': () => this.triggerAllegiance('appleGoogle'),
            'microsoft': () => this.triggerAllegiance('microsoftOpenAI'),
            'openai': () => this.triggerAllegiance('microsoftOpenAI'),
            'linux': () => this.triggerAllegiance('neutral'),
            'vim': () => this.activateVimMode(),
            'emacs': () => this.activateEmacsMode()
        };

        this.init();
    }

    init() {
        console.log('🗣️ Initializing Linguistic Interaction System...');
        
        // Detect platform preference
        this.detectPlatformAllegiance();
        
        // Setup interaction listeners
        this.setupInteractionListeners();
        
        // Initialize voice pattern detection
        this.initializeVoicePatterns();
        
        // Start linguistic processing
        this.startLinguisticEngine();
        
        console.log('✅ Linguistic system ready - .ey mode active');
    }

    detectPlatformAllegiance() {
        const ua = navigator.userAgent || '';
        const platform = navigator.platform || '';
        
        // Detect based on user agent
        if (/iPhone|iPad|Mac/i.test(ua) || /Mac/i.test(platform)) {
            this.platformAllegiance = 'appleGoogle';
        } else if (/Windows/i.test(ua) || /Win/i.test(platform)) {
            this.platformAllegiance = 'microsoftOpenAI';
        } else if (/Android/i.test(ua) && /Chrome/i.test(ua)) {
            this.platformAllegiance = 'appleGoogle';
        } else if (/Linux/i.test(ua)) {
            this.platformAllegiance = 'neutral';
        } else {
            this.platformAllegiance = 'neutral';
        }

        console.log(`🏁 Platform allegiance: ${this.platformAllegiance}`);
        this.showAllegianceBadge();
    }

    showAllegianceBadge() {
        const alliance = this.platformBattles[this.platformAllegiance];
        if (!alliance) return;

        const badge = document.createElement('div');
        badge.className = 'platform-allegiance-badge';
        badge.innerHTML = `
            <span class="alliance-emojis">${alliance.emojis.join('')}</span>
            <span class="alliance-name">${alliance.name}</span>
        `;
        badge.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: ${alliance.color}33;
            border: 2px solid ${alliance.color};
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-family: var(--font-mono);
            font-size: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
            z-index: 1000;
            animation: slideInLeft 0.5s ease;
            cursor: pointer;
        `;

        badge.addEventListener('click', () => {
            this.showPlatformBattleDialog();
        });

        document.body.appendChild(badge);

        // Auto-hide after 5 seconds
        setTimeout(() => {
            badge.style.animation = 'fadeOut 0.5s ease forwards';
            setTimeout(() => badge.remove(), 500);
        }, 5000);
    }

    setupInteractionListeners() {
        // Text input monitoring
        document.addEventListener('input', (e) => {
            if (e.target.matches('input, textarea')) {
                this.analyzeTextInput(e.target.value);
            }
        });

        // Keystroke pattern detection
        let keyBuffer = '';
        let keyTimer;
        
        document.addEventListener('keydown', (e) => {
            keyBuffer += e.key.toLowerCase();
            
            clearTimeout(keyTimer);
            keyTimer = setTimeout(() => {
                this.analyzeKeystrokePattern(keyBuffer);
                keyBuffer = '';
            }, 1000);
        });

        // Voice command simulation (for demo)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'v') {
                this.simulateVoiceCommand();
            }
        });

        // Mode switching
        document.addEventListener('dblclick', () => {
            this.cycleVowelMode();
        });
    }

    analyzeTextInput(text) {
        // Check for easter eggs
        Object.keys(this.easterEggPatterns).forEach(pattern => {
            if (text.toLowerCase().includes(pattern)) {
                this.easterEggPatterns[pattern]();
            }
        });

        // Analyze linguistic patterns
        const analysis = {
            vowelRatio: this.calculateVowelRatio(text),
            averageWordLength: this.calculateAverageWordLength(text),
            rhythm: this.detectTextRhythm(text),
            emotion: this.detectEmotion(text)
        };

        // Adjust mode based on typing pattern
        if (analysis.averageWordLength < 3 && analysis.rhythm === 'rapid') {
            this.setVowelMode('.eyy');
        } else if (analysis.averageWordLength > 7 && analysis.rhythm === 'slow') {
            this.setVowelMode('.eey');
        }

        this.emitLinguisticUpdate('textAnalysis', analysis);
    }

    calculateVowelRatio(text) {
        const vowels = text.match(/[aeiouAEIOU]/g) || [];
        const consonants = text.match(/[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]/g) || [];
        return vowels.length / (vowels.length + consonants.length) || 0;
    }

    calculateAverageWordLength(text) {
        const words = text.split(/\s+/).filter(w => w.length > 0);
        if (words.length === 0) return 0;
        return words.reduce((sum, word) => sum + word.length, 0) / words.length;
    }

    detectTextRhythm(text) {
        const words = text.split(/\s+/);
        if (words.length < 5) return 'normal';
        
        const variance = this.calculateLengthVariance(words);
        
        if (variance < 2) return 'steady';
        if (variance < 5) return 'normal';
        if (variance < 10) return 'varied';
        return 'erratic';
    }

    calculateLengthVariance(words) {
        const lengths = words.map(w => w.length);
        const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
        const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avg, 2), 0) / lengths.length;
        return Math.sqrt(variance);
    }

    detectEmotion(text) {
        // Simple emotion detection based on punctuation and caps
        const exclamations = (text.match(/!/g) || []).length;
        const questions = (text.match(/\?/g) || []).length;
        const caps = (text.match(/[A-Z]/g) || []).length / text.length;
        
        if (exclamations > 2 || caps > 0.5) return 'excited';
        if (questions > 1) return 'curious';
        if (text.includes('...')) return 'thoughtful';
        return 'neutral';
    }

    analyzeKeystrokePattern(pattern) {
        // Detect typing speed and rhythm
        const speed = pattern.length;
        
        if (speed > 20) {
            // Fast typing
            this.adjustToTypingSpeed('fast');
        } else if (speed < 5) {
            // Slow typing
            this.adjustToTypingSpeed('slow');
        }
    }

    adjustToTypingSpeed(speed) {
        const modeMap = {
            fast: '.eyy',
            normal: '.ey',
            slow: '.eey'
        };
        
        this.setVowelMode(modeMap[speed] || '.ey');
    }

    cycleVowelMode() {
        const modes = Object.keys(this.vowelModes);
        const currentIndex = modes.indexOf(this.currentMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        
        this.setVowelMode(modes[nextIndex]);
        this.showModeIndicator();
    }

    setVowelMode(mode) {
        if (this.currentMode === mode) return;
        
        this.currentMode = mode;
        const modeConfig = this.vowelModes[mode];
        
        console.log(`🔤 Vowel mode changed: ${mode} - ${modeConfig.description}`);
        
        // Update document styles
        document.documentElement.style.setProperty('--linguistic-timing', modeConfig.timing);
        document.documentElement.style.setProperty('--linguistic-pitch', modeConfig.pitch);
        
        // Emit mode change
        this.emitLinguisticUpdate('modeChange', {
            mode,
            config: modeConfig
        });
    }

    showModeIndicator() {
        const modeConfig = this.vowelModes[this.currentMode];
        
        const indicator = document.createElement('div');
        indicator.className = 'vowel-mode-indicator';
        indicator.innerHTML = `
            <div class="mode-label">${this.currentMode}</div>
            <div class="mode-name">${modeConfig.name}</div>
            <div class="mode-desc">${modeConfig.description}</div>
        `;
        indicator.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(139, 0, 255, 0.95);
            color: white;
            padding: 20px 30px;
            border-radius: 15px;
            font-family: var(--font-mono);
            text-align: center;
            z-index: 10000;
            animation: modePopIn 0.3s ease;
        `;

        document.body.appendChild(indicator);

        setTimeout(() => {
            indicator.style.animation = 'modePopOut 0.3s ease forwards';
            setTimeout(() => indicator.remove(), 300);
        }, 1500);
    }

    transformText(text, mode = this.currentMode) {
        const modeConfig = this.vowelModes[mode];
        if (!modeConfig) return text;

        // Apply vowel transformations
        let transformed = text;
        
        if (mode === '.eey') {
            // Extend vowels
            transformed = transformed.replace(/([aeiou])/gi, '$1$1');
        } else if (mode === '.eyy') {
            // Shorten and make snappy
            transformed = transformed.replace(/([aeiou])\1+/gi, '$1');
            transformed = transformed.replace(/\s+/g, ' ');
        }

        return transformed;
    }

    initializeVoicePatterns() {
        // Simulate voice pattern detection
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            console.log('🎤 Voice recognition available');
            this.voiceEnabled = true;
        } else {
            console.log('🎤 Voice recognition not available');
            this.voiceEnabled = false;
        }
    }

    simulateVoiceCommand() {
        // Simulate different voice patterns
        const patterns = ['slow', 'fast', 'melodic', 'robotic'];
        const pattern = patterns[Math.floor(Math.random() * patterns.length)];
        
        console.log(`🎤 Simulated voice pattern: ${pattern}`);
        
        const modeMap = {
            slow: '.eey',
            fast: '.eyy',
            melodic: '.ey',
            robotic: '.eyy'
        };
        
        this.setVowelMode(modeMap[pattern] || '.ey');
    }

    triggerAllegiance(allegiance) {
        if (this.platformAllegiance === allegiance) return;
        
        const oldAlliance = this.platformBattles[this.platformAllegiance];
        const newAlliance = this.platformBattles[allegiance];
        
        console.log(`🏁 Switching allegiance: ${this.platformAllegiance} → ${allegiance}`);
        
        // Show battle animation
        this.showPlatformBattle(oldAlliance, newAlliance);
        
        this.platformAllegiance = allegiance;
    }

    showPlatformBattle(oldAlliance, newAlliance) {
        const battle = document.createElement('div');
        battle.className = 'platform-battle';
        battle.innerHTML = `
            <div class="battle-stage">
                <div class="alliance old-alliance">
                    <div class="alliance-emojis">${oldAlliance.emojis.join('')}</div>
                    <div class="alliance-label">${oldAlliance.name}</div>
                </div>
                <div class="versus">⚔️</div>
                <div class="alliance new-alliance">
                    <div class="alliance-emojis">${newAlliance.emojis.join('')}</div>
                    <div class="alliance-label">${newAlliance.name}</div>
                </div>
            </div>
        `;

        // Add styles inline for simplicity
        battle.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 100000;
        `;

        const stage = battle.querySelector('.battle-stage');
        stage.style.cssText = `
            display: flex;
            align-items: center;
            gap: 50px;
            font-family: var(--font-mono);
            animation: battleZoom 0.5s ease;
        `;

        const alliances = battle.querySelectorAll('.alliance');
        alliances.forEach(alliance => {
            alliance.style.cssText = `
                text-align: center;
                animation: battleBounce 1s ease infinite;
            `;
        });

        battle.querySelector('.alliance-emojis').style.fontSize = '48px';
        battle.querySelector('.versus').style.cssText = `
            font-size: 64px;
            animation: versusRotate 1s ease infinite;
        `;

        document.body.appendChild(battle);

        // Remove after animation
        setTimeout(() => {
            battle.style.animation = 'fadeOut 0.5s ease forwards';
            setTimeout(() => battle.remove(), 500);
        }, 2000);
    }

    showPlatformBattleDialog() {
        // Show current platform stats and allow switching
        const dialog = document.createElement('div');
        dialog.className = 'platform-dialog';
        
        const currentAlliance = this.platformBattles[this.platformAllegiance];
        
        dialog.innerHTML = `
            <div class="dialog-content">
                <h3>Platform Allegiance</h3>
                <div class="current-alliance">
                    <div class="alliance-emojis">${currentAlliance.emojis.join('')}</div>
                    <div class="alliance-name">${currentAlliance.name}</div>
                    <div class="alliance-values">Values: ${currentAlliance.values.join(', ')}</div>
                </div>
                <div class="alliance-options">
                    ${Object.entries(this.platformBattles).map(([key, alliance]) => `
                        <button class="alliance-option ${key === this.platformAllegiance ? 'active' : ''}" 
                                data-alliance="${key}">
                            ${alliance.emojis.join('')} ${alliance.name}
                        </button>
                    `).join('')}
                </div>
                <button class="close-dialog">✕</button>
            </div>
        `;

        // Style the dialog
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(20, 20, 20, 0.95);
            border: 2px solid var(--soulfra-quantum);
            border-radius: 15px;
            padding: 30px;
            color: white;
            font-family: var(--font-mono);
            z-index: 100001;
            min-width: 300px;
        `;

        document.body.appendChild(dialog);

        // Add interactivity
        dialog.querySelectorAll('.alliance-option').forEach(btn => {
            btn.addEventListener('click', () => {
                this.triggerAllegiance(btn.dataset.alliance);
                dialog.remove();
            });
        });

        dialog.querySelector('.close-dialog').addEventListener('click', () => {
            dialog.remove();
        });
    }

    startLinguisticEngine() {
        // Process stream titles and content
        setInterval(() => {
            document.querySelectorAll('.stream-title, .current-game').forEach(element => {
                if (!element.dataset.linguisticProcessed) {
                    const original = element.textContent;
                    element.dataset.originalText = original;
                    element.dataset.linguisticProcessed = 'true';
                    
                    // Apply linguistic transformation
                    element.textContent = this.transformText(original);
                }
            });
        }, 1000);
    }

    // Special modes
    activateVimMode() {
        console.log('🎮 Vim mode activated - hjkl for navigation!');
        document.body.style.cursor = 'none';
        // Could implement vim-style navigation
    }

    activateEmacsMode() {
        console.log('🎮 Emacs mode activated - Ctrl+X Ctrl+C to exit!');
        // Could implement emacs-style keybindings
    }

    // Event emitters
    emitLinguisticUpdate(type, data) {
        const event = new CustomEvent('linguisticUpdate', {
            detail: {
                type,
                data,
                currentMode: this.currentMode,
                platformAllegiance: this.platformAllegiance,
                timestamp: Date.now()
            }
        });
        document.dispatchEvent(event);
    }

    // Public API
    getCurrentMode() {
        return this.vowelModes[this.currentMode];
    }

    getPlatformAllegiance() {
        return this.platformBattles[this.platformAllegiance];
    }

    transform(text) {
        return this.transformText(text);
    }
}

// Add required CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInLeft {
        from {
            transform: translateX(-100px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes fadeOut {
        to {
            opacity: 0;
            transform: scale(0.9);
        }
    }
    
    @keyframes modePopIn {
        from {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0;
        }
        to {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
        }
    }
    
    @keyframes modePopOut {
        to {
            transform: translate(-50%, -50%) scale(1.2);
            opacity: 0;
        }
    }
    
    @keyframes battleZoom {
        from {
            transform: scale(0) rotate(180deg);
        }
        to {
            transform: scale(1) rotate(0deg);
        }
    }
    
    @keyframes battleBounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-20px); }
    }
    
    @keyframes versusRotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    
    .platform-allegiance-badge:hover {
        transform: scale(1.1);
        cursor: pointer;
    }
    
    .alliance-option {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.3);
        color: white;
        padding: 10px 20px;
        margin: 5px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .alliance-option:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: scale(1.05);
    }
    
    .alliance-option.active {
        background: var(--soulfra-quantum);
        border-color: var(--soulfra-reality);
    }
    
    .close-dialog {
        position: absolute;
        top: 10px;
        right: 10px;
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    /* Apply linguistic timing to animations */
    * {
        animation-duration: calc(1s * var(--linguistic-timing, 1));
    }
`;
document.head.appendChild(style);

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LinguisticInteractionSystem;
} else {
    window.LinguisticInteractionSystem = LinguisticInteractionSystem;
}

console.log('🗣️🔤🎵 Linguistic Interaction System loaded - .ey mode active!');