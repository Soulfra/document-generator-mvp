/**
 * 🎨 Theme Skin System
 * Customizable visual themes and environments like The Sims
 * Supports pirates, cyberpunk, corporate, fantasy, and custom themes
 */

const { EventEmitter } = require('events');
const fs = require('fs').promises;
const path = require('path');

class ThemeSkinSystem extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            themesDirectory: options.themesDirectory || './themes',
            customThemesDirectory: options.customThemesDirectory || './custom-themes',
            cacheThemes: options.cacheThemes !== false,
            allowCustomThemes: options.allowCustomThemes !== false,
            ...options
        };
        
        // Theme registry
        this.themes = new Map();
        this.activeTheme = null;
        this.themeHistory = [];
        
        // Theme components
        this.visualComponents = new Map();
        this.audioComponents = new Map();
        this.animationProfiles = new Map();
        this.interactionStyles = new Map();
        
        // Built-in themes
        this.builtInThemes = {
            'pirates': {
                id: 'pirates',
                name: 'Pirate Ship Adventure',
                description: 'Ahoy! Learn while sailing the seven seas with Captain Cal and the crew',
                icon: '🏴‍☠️',
                category: 'adventure',
                
                // Visual styling
                colors: {
                    primary: '#8B4513',      // Brown
                    secondary: '#DAA520',    // Gold
                    accent: '#FF6347',       // Coral
                    background: '#1E3A8A',   // Deep blue
                    text: '#F5F5DC',         // Beige
                    success: '#32CD32',      // Lime green
                    warning: '#FFD700',      // Gold
                    error: '#FF4500'         // Red orange
                },
                
                fonts: {
                    primary: '"Pirata One", "Creepster", cursive',
                    secondary: '"Rye", "Cinzel", serif',
                    monospace: '"Courier New", monospace'
                },
                
                // Component styling
                components: {
                    buttons: {
                        style: 'wooden-plank',
                        hoverEffect: 'treasure-glow',
                        clickSound: 'wooden-click'
                    },
                    panels: {
                        style: 'ship-deck',
                        border: 'rope-border',
                        shadow: 'sail-shadow'
                    },
                    inputs: {
                        style: 'scroll-paper',
                        placeholder: 'weathered-text'
                    },
                    modals: {
                        style: 'ship-cabin',
                        entrance: 'sail-in',
                        exit: 'sail-out'
                    }
                },
                
                // Characters and NPCs
                characters: {
                    'captain-cal': {
                        name: 'Captain Cal',
                        avatar: 'pirate-captain.png',
                        personality: 'wise-mentor',
                        catchphrases: [
                            'Ahoy there, matey!',
                            'Ready to sail into new knowledge?',
                            'Batten down the hatches, learning ahead!',
                            'Chart your course to mastery!'
                        ],
                        animations: ['salute', 'point-map', 'treasure-point', 'thinking']
                    },
                    'first-mate': {
                        name: 'First Mate Ada',
                        avatar: 'pirate-firstmate.png',
                        personality: 'helpful-guide',
                        role: 'challenge-coordinator'
                    },
                    'ship-doctor': {
                        name: 'Doc Binary',
                        avatar: 'pirate-doctor.png',
                        personality: 'debugging-expert',
                        role: 'error-helper'
                    }
                },
                
                // Audio theme
                audio: {
                    backgroundMusic: ['sea-shanty-1.mp3', 'ocean-waves.mp3', 'distant-thunder.mp3'],
                    soundEffects: {
                        success: 'treasure-found.wav',
                        error: 'cannon-miss.wav',
                        notification: 'ship-bell.wav',
                        click: 'wooden-creak.wav',
                        typing: 'quill-writing.wav'
                    },
                    ambientSounds: ['ocean-waves', 'seagulls', 'rope-creaking']
                },
                
                // 3D Environment
                environment: {
                    scene: 'pirate-ship-deck',
                    lighting: 'golden-hour-ocean',
                    weather: ['sunny', 'cloudy', 'storm', 'fog'],
                    backgroundElements: ['sailing-ships', 'treasure-island', 'sea-monsters'],
                    interactiveElements: ['ship-wheel', 'cannon', 'treasure-chest', 'map-table']
                },
                
                // Animations and effects
                animations: {
                    pageTransitions: 'sail-transition',
                    loadingAnimation: 'compass-spin',
                    successEffect: 'treasure-sparkle',
                    errorEffect: 'ship-shake',
                    hoverEffects: ['gold-shimmer', 'rope-sway']
                }
            },
            
            'cyberpunk': {
                id: 'cyberpunk',
                name: 'Neon Cyber City',
                description: 'Jack into the matrix with AI agents in a cyberpunk metropolis',
                icon: '🌆',
                category: 'futuristic',
                
                colors: {
                    primary: '#00FFFF',      // Cyan
                    secondary: '#FF00FF',    // Magenta
                    accent: '#00FF00',       // Neon green
                    background: '#0A0A0A',   // Near black
                    text: '#FFFFFF',         // White
                    success: '#00FF41',      // Matrix green
                    warning: '#FFD700',      // Gold
                    error: '#FF073A'         // Neon red
                },
                
                fonts: {
                    primary: '"Orbitron", "Exo 2", sans-serif',
                    secondary: '"Rajdhani", "Play", sans-serif',
                    monospace: '"Fira Code", "Source Code Pro", monospace'
                },
                
                components: {
                    buttons: {
                        style: 'holographic',
                        hoverEffect: 'neon-pulse',
                        clickSound: 'digital-beep'
                    },
                    panels: {
                        style: 'glass-terminal',
                        border: 'neon-glow',
                        shadow: 'hologram-depth'
                    },
                    inputs: {
                        style: 'neural-interface',
                        placeholder: 'data-stream'
                    }
                },
                
                characters: {
                    'agent-zero': {
                        name: 'Agent Zero',
                        avatar: 'cyber-agent.png',
                        personality: 'digital-mentor',
                        catchphrases: [
                            'Initializing knowledge transfer...',
                            'Your neural pathways are expanding',
                            'Data packet received, processing...',
                            'Level up your consciousness'
                        ]
                    }
                },
                
                audio: {
                    backgroundMusic: ['synthwave-ambient.mp3', 'digital-dreams.mp3'],
                    soundEffects: {
                        success: 'system-success.wav',
                        error: 'error-glitch.wav',
                        notification: 'incoming-data.wav',
                        click: 'digital-click.wav'
                    },
                    ambientSounds: ['city-hum', 'data-streams', 'electrical-buzz']
                },
                
                environment: {
                    scene: 'cyber-city-rooftop',
                    lighting: 'neon-noir',
                    weather: ['acid-rain', 'neon-fog', 'clear-night'],
                    backgroundElements: ['flying-cars', 'holographic-ads', 'data-streams']
                },
                
                animations: {
                    pageTransitions: 'matrix-wipe',
                    loadingAnimation: 'data-download',
                    successEffect: 'green-code-rain',
                    errorEffect: 'glitch-distortion'
                }
            },
            
            'corporate': {
                id: 'corporate',
                name: 'Executive Boardroom',
                description: 'Professional business environment for serious learning',
                icon: '🏢',
                category: 'professional',
                
                colors: {
                    primary: '#1E3A8A',      // Corporate blue
                    secondary: '#374151',    // Gray
                    accent: '#F59E0B',       // Gold
                    background: '#F9FAFB',   // Light gray
                    text: '#111827',         // Dark gray
                    success: '#10B981',      // Green
                    warning: '#F59E0B',      // Amber
                    error: '#EF4444'         // Red
                },
                
                fonts: {
                    primary: '"Inter", "Helvetica Neue", sans-serif',
                    secondary: '"Roboto", "Arial", sans-serif',
                    monospace: '"JetBrains Mono", monospace'
                },
                
                components: {
                    buttons: {
                        style: 'executive',
                        hoverEffect: 'professional-highlight',
                        clickSound: 'pen-click'
                    },
                    panels: {
                        style: 'conference-room',
                        border: 'clean-line',
                        shadow: 'executive-depth'
                    }
                },
                
                characters: {
                    'ceo-claude': {
                        name: 'CEO Claude',
                        avatar: 'executive-suit.png',
                        personality: 'executive-mentor',
                        catchphrases: [
                            'Let\\'s strategize your learning objectives',
                            'Time to scale your knowledge portfolio',
                            'Your ROI on learning is exceptional',
                            'Ready for your next promotion in skills?'
                        ]
                    }
                },
                
                audio: {
                    backgroundMusic: ['corporate-ambient.mp3', 'elevator-jazz.mp3'],
                    soundEffects: {
                        success: 'achievement-bell.wav',
                        error: 'polite-beep.wav',
                        notification: 'email-ping.wav'
                    }
                },
                
                environment: {
                    scene: 'modern-boardroom',
                    lighting: 'natural-office',
                    backgroundElements: ['city-skyline', 'presentation-screens', 'office-plants']
                }
            },
            
            'fantasy': {
                id: 'fantasy',
                name: 'Mystic Academy',
                description: 'Learn magic and wisdom in an enchanted castle',
                icon: '🏰',
                category: 'magical',
                
                colors: {
                    primary: '#7C3AED',      // Purple
                    secondary: '#059669',    // Emerald
                    accent: '#F59E0B',       // Gold
                    background: '#1F2937',   // Dark blue-gray
                    text: '#F3F4F6',         // Light gray
                    success: '#10B981',      // Green
                    warning: '#F59E0B',      // Amber
                    error: '#EF4444'         // Red
                },
                
                fonts: {
                    primary: '"Cinzel", "Cormorant Garamond", serif',
                    secondary: '"Philosopher", "Crimson Text", serif',
                    monospace: '"Fira Code", monospace'
                },
                
                characters: {
                    'wizard-claude': {
                        name: 'Wizard Claude',
                        avatar: 'wizard-hat.png',
                        personality: 'wise-sage',
                        catchphrases: [
                            'By the power of algorithms!',
                            'Your knowledge grows stronger each day',
                            'Cast your learning spells wisely',
                            'The magic of understanding awakens'
                        ]
                    }
                },
                
                environment: {
                    scene: 'magical-library',
                    lighting: 'enchanted-glow',
                    backgroundElements: ['floating-books', 'crystal-orbs', 'magical-creatures']
                }
            },
            
            'space': {
                id: 'space',
                name: 'Galactic Command',
                description: 'Explore the universe while learning with the space crew',
                icon: '🚀',
                category: 'sci-fi',
                
                colors: {
                    primary: '#3B82F6',      // Blue
                    secondary: '#6366F1',    // Indigo
                    accent: '#F59E0B',       // Gold
                    background: '#000000',   // Black space
                    text: '#FFFFFF',         // White
                    success: '#10B981',      // Green
                    warning: '#F59E0B',      // Amber
                    error: '#EF4444'         // Red
                },
                
                characters: {
                    'captain-claude': {
                        name: 'Captain Claude',
                        avatar: 'space-captain.png',
                        personality: 'space-explorer',
                        catchphrases: [
                            'Set course for knowledge!',
                            'Engaging learning thrusters',
                            'Mission control, we have success!',
                            'To infinity and beyond understanding!'
                        ]
                    }
                },
                
                environment: {
                    scene: 'spaceship-bridge',
                    lighting: 'stellar-glow',
                    backgroundElements: ['starfield', 'planets', 'nebulae', 'space-station']
                }
            }
        };
        
        this.init();
    }
    
    async init() {
        // Ensure theme directories exist
        await this.ensureDirectories();
        
        // Load built-in themes
        await this.loadBuiltInThemes();
        
        // Load custom themes if enabled
        if (this.options.allowCustomThemes) {
            await this.loadCustomThemes();
        }
        
        // Set default theme
        await this.setTheme('pirates'); // Default to pirates theme
        
        console.log('🎨 Theme Skin System initialized');
        console.log(`🎭 Available themes: ${Array.from(this.themes.keys()).join(', ')}`);
    }
    
    async ensureDirectories() {
        const dirs = [
            this.options.themesDirectory,
            this.options.customThemesDirectory,
            path.join(this.options.themesDirectory, 'assets'),
            path.join(this.options.customThemesDirectory, 'assets')
        ];
        
        for (const dir of dirs) {
            try {
                await fs.mkdir(dir, { recursive: true });
            } catch (error) {
                console.error(`Failed to create directory ${dir}:`, error);
            }
        }
    }
    
    async loadBuiltInThemes() {
        for (const [themeId, themeData] of Object.entries(this.builtInThemes)) {
            await this.registerTheme(themeData);
        }
    }
    
    async loadCustomThemes() {
        try {
            const files = await fs.readdir(this.options.customThemesDirectory);
            const themeFiles = files.filter(file => file.endsWith('.json'));
            
            for (const file of themeFiles) {
                try {
                    const filePath = path.join(this.options.customThemesDirectory, file);
                    const data = await fs.readFile(filePath, 'utf8');
                    const themeData = JSON.parse(data);
                    
                    await this.registerTheme(themeData);
                    console.log(`📁 Loaded custom theme: ${themeData.name}`);
                } catch (error) {
                    console.error(`Failed to load custom theme ${file}:`, error);
                }
            }
        } catch (error) {
            // Custom themes directory doesn't exist or is empty
        }
    }
    
    async registerTheme(themeData) {
        // Validate theme data
        if (!this.validateTheme(themeData)) {
            throw new Error(`Invalid theme data for ${themeData.id}`);
        }
        
        // Process and enhance theme data
        const processedTheme = await this.processTheme(themeData);
        
        // Register theme
        this.themes.set(themeData.id, processedTheme);
        
        // Cache components if enabled
        if (this.options.cacheThemes) {
            await this.cacheThemeComponents(processedTheme);
        }
        
        this.emit('theme:registered', {\n            themeId: themeData.id,\n            themeName: themeData.name\n        });\n        \n        return processedTheme;\n    }\n    \n    async processTheme(themeData) {\n        return {\n            ...themeData,\n            \n            // Add computed properties\n            cssVariables: this.generateCSSVariables(themeData),\n            componentStyles: this.generateComponentStyles(themeData),\n            animationDefinitions: this.generateAnimationDefinitions(themeData),\n            \n            // Asset management\n            assets: {\n                images: await this.collectImageAssets(themeData),\n                audio: await this.collectAudioAssets(themeData),\n                fonts: await this.collectFontAssets(themeData)\n            },\n            \n            // Interaction profiles\n            interactions: this.generateInteractionProfiles(themeData),\n            \n            // Accessibility enhancements\n            accessibility: this.generateAccessibilityOptions(themeData),\n            \n            // Performance optimizations\n            performance: {\n                lazyLoadAssets: true,\n                prefetchCritical: true,\n                compressAssets: true\n            }\n        };\n    }\n    \n    generateCSSVariables(themeData) {\n        const cssVars = {};\n        \n        // Color variables\n        if (themeData.colors) {\n            Object.entries(themeData.colors).forEach(([key, value]) => {\n                cssVars[`--color-${key}`] = value;\n            });\n        }\n        \n        // Font variables\n        if (themeData.fonts) {\n            Object.entries(themeData.fonts).forEach(([key, value]) => {\n                cssVars[`--font-${key}`] = value;\n            });\n        }\n        \n        // Component-specific variables\n        if (themeData.components) {\n            Object.entries(themeData.components).forEach(([component, styles]) => {\n                Object.entries(styles).forEach(([property, value]) => {\n                    cssVars[`--${component}-${property}`] = value;\n                });\n            });\n        }\n        \n        return cssVars;\n    }\n    \n    generateComponentStyles(themeData) {\n        const styles = {};\n        \n        // Generate CSS for each component type\n        const componentTypes = ['buttons', 'panels', 'inputs', 'modals', 'cards', 'navigation'];\n        \n        componentTypes.forEach(componentType => {\n            if (themeData.components && themeData.components[componentType]) {\n                styles[componentType] = this.createComponentCSS(componentType, themeData.components[componentType], themeData);\n            }\n        });\n        \n        return styles;\n    }\n    \n    createComponentCSS(componentType, componentConfig, themeData) {\n        const baseStyles = {\n            buttons: {\n                padding: '12px 24px',\n                'border-radius': '8px',\n                border: 'none',\n                cursor: 'pointer',\n                transition: 'all 0.3s ease',\n                'font-family': 'var(--font-primary)',\n                'font-weight': '500'\n            },\n            panels: {\n                padding: '20px',\n                'border-radius': '12px',\n                'box-shadow': '0 4px 6px rgba(0, 0, 0, 0.1)',\n                'background-color': 'var(--color-background)'\n            },\n            inputs: {\n                padding: '12px 16px',\n                'border-radius': '6px',\n                border: '2px solid var(--color-secondary)',\n                'font-family': 'var(--font-secondary)'\n            }\n        };\n        \n        // Apply theme-specific styles\n        const themeStyles = this.applyThemeStyles(componentConfig, themeData);\n        \n        return {\n            ...baseStyles[componentType],\n            ...themeStyles\n        };\n    }\n    \n    applyThemeStyles(componentConfig, themeData) {\n        const styles = {};\n        \n        // Apply style based on component style type\n        switch (componentConfig.style) {\n            case 'wooden-plank':\n                styles['background-image'] = 'linear-gradient(145deg, #8B4513, #A0522D)';\n                styles['box-shadow'] = 'inset 0 2px 4px rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.2)';\n                styles['border'] = '2px solid #654321';\n                break;\n                \n            case 'holographic':\n                styles['background'] = 'linear-gradient(135deg, rgba(0,255,255,0.1), rgba(255,0,255,0.1))';\n                styles['border'] = '1px solid rgba(0,255,255,0.5)';\n                styles['backdrop-filter'] = 'blur(10px)';\n                styles['box-shadow'] = '0 0 20px rgba(0,255,255,0.3)';\n                break;\n                \n            case 'executive':\n                styles['background'] = 'linear-gradient(135deg, #1E3A8A, #374151)';\n                styles['border'] = '1px solid #4B5563';\n                styles['box-shadow'] = '0 2px 4px rgba(0,0,0,0.1)';\n                break;\n        }\n        \n        return styles;\n    }\n    \n    generateAnimationDefinitions(themeData) {\n        const animations = {};\n        \n        if (themeData.animations) {\n            // Page transitions\n            if (themeData.animations.pageTransitions) {\n                animations.pageTransition = this.createPageTransition(themeData.animations.pageTransitions);\n            }\n            \n            // Loading animations\n            if (themeData.animations.loadingAnimation) {\n                animations.loading = this.createLoadingAnimation(themeData.animations.loadingAnimation);\n            }\n            \n            // Success/error effects\n            animations.success = this.createEffectAnimation(themeData.animations.successEffect);\n            animations.error = this.createEffectAnimation(themeData.animations.errorEffect);\n        }\n        \n        return animations;\n    }\n    \n    createPageTransition(transitionType) {\n        const transitions = {\n            'sail-transition': {\n                keyframes: {\n                    '0%': { transform: 'translateX(-100%)', opacity: 0 },\n                    '50%': { transform: 'translateX(0%)', opacity: 0.5 },\n                    '100%': { transform: 'translateX(0%)', opacity: 1 }\n                },\n                duration: '0.8s',\n                easing: 'cubic-bezier(0.4, 0, 0.2, 1)'\n            },\n            'matrix-wipe': {\n                keyframes: {\n                    '0%': { 'clip-path': 'inset(0 100% 0 0)' },\n                    '100%': { 'clip-path': 'inset(0 0 0 0)' }\n                },\n                duration: '0.6s',\n                easing: 'ease-in-out'\n            }\n        };\n        \n        return transitions[transitionType] || transitions['sail-transition'];\n    }\n    \n    createLoadingAnimation(animationType) {\n        const animations = {\n            'compass-spin': {\n                keyframes: {\n                    '0%': { transform: 'rotate(0deg)' },\n                    '100%': { transform: 'rotate(360deg)' }\n                },\n                duration: '2s',\n                iteration: 'infinite',\n                easing: 'linear'\n            },\n            'data-download': {\n                keyframes: {\n                    '0%': { width: '0%', 'background-color': '#00FFFF' },\n                    '50%': { 'background-color': '#00FF00' },\n                    '100%': { width: '100%', 'background-color': '#FFFF00' }\n                },\n                duration: '3s',\n                easing: 'ease-in-out'\n            }\n        };\n        \n        return animations[animationType] || animations['compass-spin'];\n    }\n    \n    createEffectAnimation(effectType) {\n        const effects = {\n            'treasure-sparkle': {\n                keyframes: {\n                    '0%': { transform: 'scale(1)', opacity: 1 },\n                    '50%': { transform: 'scale(1.2)', opacity: 0.8 },\n                    '100%': { transform: 'scale(1)', opacity: 1 }\n                },\n                duration: '0.6s',\n                easing: 'ease-in-out'\n            },\n            'green-code-rain': {\n                keyframes: {\n                    '0%': { transform: 'translateY(-100%)', opacity: 0 },\n                    '50%': { opacity: 1 },\n                    '100%': { transform: 'translateY(100vh)', opacity: 0 }\n                },\n                duration: '2s',\n                easing: 'linear'\n            }\n        };\n        \n        return effects[effectType] || effects['treasure-sparkle'];\n    }\n    \n    async collectImageAssets(themeData) {\n        const assets = {\n            characters: {},\n            backgrounds: {},\n            ui: {},\n            effects: {}\n        };\n        \n        // Collect character avatars\n        if (themeData.characters) {\n            for (const [charId, charData] of Object.entries(themeData.characters)) {\n                if (charData.avatar) {\n                    assets.characters[charId] = {\n                        avatar: charData.avatar,\n                        animations: charData.animations || []\n                    };\n                }\n            }\n        }\n        \n        // Collect environment backgrounds\n        if (themeData.environment) {\n            assets.backgrounds.scene = themeData.environment.scene;\n            assets.backgrounds.elements = themeData.environment.backgroundElements || [];\n        }\n        \n        return assets;\n    }\n    \n    async collectAudioAssets(themeData) {\n        const assets = {\n            music: [],\n            effects: {},\n            ambient: []\n        };\n        \n        if (themeData.audio) {\n            assets.music = themeData.audio.backgroundMusic || [];\n            assets.effects = themeData.audio.soundEffects || {};\n            assets.ambient = themeData.audio.ambientSounds || [];\n        }\n        \n        return assets;\n    }\n    \n    async collectFontAssets(themeData) {\n        const fonts = [];\n        \n        if (themeData.fonts) {\n            Object.values(themeData.fonts).forEach(fontFamily => {\n                // Extract font names from CSS font-family declarations\n                const fontNames = fontFamily.match(/\"([^\"]+)\"/g);\n                if (fontNames) {\n                    fontNames.forEach(fontName => {\n                        const cleanName = fontName.replace(/\"/g, '');\n                        if (!fonts.includes(cleanName)) {\n                            fonts.push(cleanName);\n                        }\n                    });\n                }\n            });\n        }\n        \n        return fonts;\n    }\n    \n    generateInteractionProfiles(themeData) {\n        const profiles = {\n            hover: {},\n            click: {},\n            focus: {},\n            success: {},\n            error: {}\n        };\n        \n        // Generate interaction styles based on theme\n        switch (themeData.id) {\n            case 'pirates':\n                profiles.hover = { animation: 'treasure-glow', sound: 'wooden-creak' };\n                profiles.click = { animation: 'plank-press', sound: 'wooden-click' };\n                profiles.success = { animation: 'treasure-sparkle', sound: 'treasure-found' };\n                break;\n                \n            case 'cyberpunk':\n                profiles.hover = { animation: 'neon-pulse', sound: 'digital-hum' };\n                profiles.click = { animation: 'data-flash', sound: 'digital-beep' };\n                profiles.success = { animation: 'matrix-success', sound: 'system-success' };\n                break;\n        }\n        \n        return profiles;\n    }\n    \n    generateAccessibilityOptions(themeData) {\n        return {\n            highContrast: this.generateHighContrastVariant(themeData),\n            reducedMotion: this.generateReducedMotionVariant(themeData),\n            largeText: this.generateLargeTextVariant(themeData),\n            colorBlindFriendly: this.generateColorBlindVariant(themeData)\n        };\n    }\n    \n    generateHighContrastVariant(themeData) {\n        // Create high contrast version of colors\n        const highContrastColors = { ...themeData.colors };\n        \n        // Ensure sufficient contrast ratios\n        highContrastColors.background = '#000000';\n        highContrastColors.text = '#FFFFFF';\n        highContrastColors.primary = '#0000FF';\n        highContrastColors.secondary = '#FFFF00';\n        \n        return { ...themeData, colors: highContrastColors };\n    }\n    \n    generateReducedMotionVariant(themeData) {\n        // Remove or reduce animations for accessibility\n        const reducedAnimations = {\n            pageTransitions: 'fade',\n            loadingAnimation: 'simple-pulse',\n            successEffect: 'simple-highlight',\n            errorEffect: 'simple-outline'\n        };\n        \n        return {\n            ...themeData,\n            animations: reducedAnimations\n        };\n    }\n    \n    /**\n     * Set active theme\n     */\n    async setTheme(themeId, options = {}) {\n        const theme = this.themes.get(themeId);\n        if (!theme) {\n            throw new Error(`Theme '${themeId}' not found`);\n        }\n        \n        // Store previous theme\n        if (this.activeTheme) {\n            this.themeHistory.push(this.activeTheme.id);\n        }\n        \n        this.activeTheme = theme;\n        \n        // Apply theme to DOM if in browser environment\n        if (typeof document !== 'undefined') {\n            await this.applyThemeToDOM(theme, options);\n        }\n        \n        // Preload assets if requested\n        if (options.preloadAssets) {\n            await this.preloadThemeAssets(theme);\n        }\n        \n        this.emit('theme:changed', {\n            themeId: theme.id,\n            themeName: theme.name,\n            previousTheme: this.themeHistory[this.themeHistory.length - 1]\n        });\n        \n        console.log(`🎨 Theme switched to: ${theme.name}`);\n        return theme;\n    }\n    \n    async applyThemeToDOM(theme, options = {}) {\n        // Apply CSS variables\n        const root = document.documentElement;\n        \n        Object.entries(theme.cssVariables).forEach(([property, value]) => {\n            root.style.setProperty(property, value);\n        });\n        \n        // Apply component styles\n        await this.injectComponentStyles(theme);\n        \n        // Apply animations\n        await this.injectAnimations(theme);\n        \n        // Update character elements\n        this.updateCharacterElements(theme);\n        \n        // Apply accessibility options if requested\n        if (options.accessibility) {\n            this.applyAccessibilityEnhancements(theme, options.accessibility);\n        }\n    }\n    \n    async injectComponentStyles(theme) {\n        // Remove existing theme styles\n        const existingStyle = document.getElementById('theme-component-styles');\n        if (existingStyle) {\n            existingStyle.remove();\n        }\n        \n        // Create new style element\n        const styleElement = document.createElement('style');\n        styleElement.id = 'theme-component-styles';\n        \n        // Generate CSS from component styles\n        let css = '';\n        \n        Object.entries(theme.componentStyles).forEach(([component, styles]) => {\n            const selector = `.theme-${component}`;\n            const properties = Object.entries(styles)\n                .map(([property, value]) => `${property}: ${value};`)\n                .join(' ');\n                \n            css += `${selector} { ${properties} }\\n`;\n        });\n        \n        styleElement.textContent = css;\n        document.head.appendChild(styleElement);\n    }\n    \n    async injectAnimations(theme) {\n        // Remove existing animations\n        const existingAnimations = document.getElementById('theme-animations');\n        if (existingAnimations) {\n            existingAnimations.remove();\n        }\n        \n        // Create new animation styles\n        const animationElement = document.createElement('style');\n        animationElement.id = 'theme-animations';\n        \n        let css = '';\n        \n        Object.entries(theme.animationDefinitions).forEach(([name, animation]) => {\n            // Create keyframes\n            const keyframeEntries = Object.entries(animation.keyframes)\n                .map(([percentage, styles]) => {\n                    const styleStr = Object.entries(styles)\n                        .map(([property, value]) => `${property}: ${value};`)\n                        .join(' ');\n                    return `${percentage} { ${styleStr} }`;\n                })\n                .join(' ');\n                \n            css += `@keyframes theme-${name} { ${keyframeEntries} }\\n`;\n            \n            // Create animation class\n            css += `.theme-animate-${name} {\\n`;\n            css += `  animation: theme-${name} ${animation.duration} ${animation.easing || 'ease'}`;;\n            if (animation.iteration) {\n                css += ` ${animation.iteration}`;\n            }\n            css += ';\\n}\\n';\n        });\n        \n        animationElement.textContent = css;\n        document.head.appendChild(animationElement);\n    }\n    \n    updateCharacterElements(theme) {\n        // Update character avatars and names\n        Object.entries(theme.characters).forEach(([charId, charData]) => {\n            const characterElements = document.querySelectorAll(`[data-character=\"${charId}\"]`);\n            \n            characterElements.forEach(element => {\n                // Update avatar if element has avatar display\n                const avatarImg = element.querySelector('.character-avatar');\n                if (avatarImg && charData.avatar) {\n                    avatarImg.src = this.getAssetPath(theme, 'characters', charData.avatar);\n                    avatarImg.alt = charData.name;\n                }\n                \n                // Update character name\n                const nameElement = element.querySelector('.character-name');\n                if (nameElement) {\n                    nameElement.textContent = charData.name;\n                }\n                \n                // Apply character personality class\n                element.className = element.className.replace(/personality-\\w+/g, '');\n                element.classList.add(`personality-${charData.personality}`);\n            });\n        });\n    }\n    \n    async preloadThemeAssets(theme) {\n        const promises = [];\n        \n        // Preload critical images\n        if (theme.assets.images.characters) {\n            Object.values(theme.assets.images.characters).forEach(charAssets => {\n                if (charAssets.avatar) {\n                    promises.push(this.preloadImage(this.getAssetPath(theme, 'characters', charAssets.avatar)));\n                }\n            });\n        }\n        \n        // Preload fonts\n        theme.assets.fonts.forEach(fontName => {\n            promises.push(this.preloadFont(fontName));\n        });\n        \n        // Preload critical audio (first background music track)\n        if (theme.assets.audio.music.length > 0) {\n            promises.push(this.preloadAudio(this.getAssetPath(theme, 'audio', theme.assets.audio.music[0])));\n        }\n        \n        await Promise.all(promises);\n        console.log(`📦 Preloaded assets for theme: ${theme.name}`);\n    }\n    \n    preloadImage(src) {\n        return new Promise((resolve, reject) => {\n            const img = new Image();\n            img.onload = resolve;\n            img.onerror = reject;\n            img.src = src;\n        });\n    }\n    \n    preloadFont(fontName) {\n        // Use CSS Font Loading API if available\n        if ('fonts' in document) {\n            return document.fonts.load(`16px \"${fontName}\"`);\n        }\n        return Promise.resolve();\n    }\n    \n    preloadAudio(src) {\n        return new Promise((resolve, reject) => {\n            const audio = new Audio();\n            audio.oncanplaythrough = resolve;\n            audio.onerror = reject;\n            audio.src = src;\n        });\n    }\n    \n    getAssetPath(theme, category, filename) {\n        return `${this.options.themesDirectory}/assets/${theme.id}/${category}/${filename}`;\n    }\n    \n    /**\n     * Get available themes\n     */\n    getAvailableThemes() {\n        return Array.from(this.themes.values()).map(theme => ({\n            id: theme.id,\n            name: theme.name,\n            description: theme.description,\n            icon: theme.icon,\n            category: theme.category\n        }));\n    }\n    \n    /**\n     * Get current active theme\n     */\n    getActiveTheme() {\n        return this.activeTheme;\n    }\n    \n    /**\n     * Create custom theme\n     */\n    async createCustomTheme(themeConfig) {\n        // Validate custom theme\n        if (!this.validateTheme(themeConfig)) {\n            throw new Error('Invalid custom theme configuration');\n        }\n        \n        // Ensure unique ID\n        if (this.themes.has(themeConfig.id)) {\n            throw new Error(`Theme with ID '${themeConfig.id}' already exists`);\n        }\n        \n        // Save custom theme\n        const themePath = path.join(this.options.customThemesDirectory, `${themeConfig.id}.json`);\n        await fs.writeFile(themePath, JSON.stringify(themeConfig, null, 2));\n        \n        // Register theme\n        await this.registerTheme(themeConfig);\n        \n        console.log(`✨ Created custom theme: ${themeConfig.name}`);\n        return themeConfig;\n    }\n    \n    /**\n     * Theme validation\n     */\n    validateTheme(themeData) {\n        const required = ['id', 'name', 'description'];\n        \n        for (const field of required) {\n            if (!themeData[field]) {\n                console.error(`Theme missing required field: ${field}`);\n                return false;\n            }\n        }\n        \n        return true;\n    }\n    \n    /**\n     * Audio management\n     */\n    async playThemeAudio(audioType, audioId) {\n        if (!this.activeTheme || !this.activeTheme.assets.audio[audioType]) {\n            return;\n        }\n        \n        const audioFile = this.activeTheme.assets.audio[audioType][audioId];\n        if (!audioFile) return;\n        \n        const audioPath = this.getAssetPath(this.activeTheme, 'audio', audioFile);\n        const audio = new Audio(audioPath);\n        \n        try {\n            await audio.play();\n            \n            this.emit('audio:played', {\n                themeId: this.activeTheme.id,\n                audioType,\n                audioId,\n                audioFile\n            });\n        } catch (error) {\n            console.error('Failed to play theme audio:', error);\n        }\n    }\n    \n    /**\n     * Character interaction\n     */\n    getCharacterCatchphrase(characterId) {\n        if (!this.activeTheme || !this.activeTheme.characters[characterId]) {\n            return 'Hello there!';\n        }\n        \n        const character = this.activeTheme.characters[characterId];\n        const catchphrases = character.catchphrases || ['Hello there!'];\n        \n        return catchphrases[Math.floor(Math.random() * catchphrases.length)];\n    }\n    \n    /**\n     * Environment management\n     */\n    getEnvironmentConfig() {\n        return this.activeTheme?.environment || {};\n    }\n    \n    // Utility methods\n    generateLargeTextVariant(themeData) {\n        const largeTextFonts = { ...themeData.fonts };\n        \n        // Increase base font sizes\n        Object.keys(largeTextFonts).forEach(key => {\n            largeTextFonts[key] = largeTextFonts[key].replace(/\\d+px/g, (match) => {\n                const size = parseInt(match);\n                return `${Math.floor(size * 1.25)}px`;\n            });\n        });\n        \n        return { ...themeData, fonts: largeTextFonts };\n    }\n    \n    generateColorBlindVariant(themeData) {\n        // Simplified color blind friendly palette\n        const colorBlindColors = {\n            primary: '#0173B2',      // Blue\n            secondary: '#DE8F05',    // Orange\n            accent: '#029E73',       // Green\n            background: themeData.colors.background,\n            text: themeData.colors.text,\n            success: '#029E73',      // Green\n            warning: '#DE8F05',      // Orange\n            error: '#CC78BC'         // Pink\n        };\n        \n        return { ...themeData, colors: colorBlindColors };\n    }\n    \n    async cacheThemeComponents(theme) {\n        // Cache processed components for faster theme switching\n        this.visualComponents.set(theme.id, theme.componentStyles);\n        this.audioComponents.set(theme.id, theme.assets.audio);\n        this.animationProfiles.set(theme.id, theme.animationDefinitions);\n        this.interactionStyles.set(theme.id, theme.interactions);\n    }\n    \n    applyAccessibilityEnhancements(theme, accessibilityOptions) {\n        if (accessibilityOptions.highContrast) {\n            const highContrastTheme = theme.accessibility.highContrast;\n            Object.entries(highContrastTheme.cssVariables).forEach(([property, value]) => {\n                document.documentElement.style.setProperty(property, value);\n            });\n        }\n        \n        if (accessibilityOptions.reducedMotion) {\n            document.body.classList.add('reduced-motion');\n        }\n        \n        if (accessibilityOptions.largeText) {\n            document.body.classList.add('large-text');\n        }\n    }\n}\n\nmodule.exports = ThemeSkinSystem;