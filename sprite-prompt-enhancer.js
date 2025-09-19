#!/usr/bin/env node

/**
 * SPRITE PROMPT ENHANCER
 * 
 * Analyzes reference images and creates enhanced AI prompts for sprite generation.
 * Integrates with the Reference Image Fetcher and AI Router to create contextually
 * rich prompts that produce high-quality sprites for the grim reaper husky mascot.
 * 
 * Features:
 * - Visual analysis of reference images for color, composition, style
 * - Contextual prompt building based on mascot personality modes
 * - Integration with existing AI Router and Replicate models
 * - Style consistency management across sprite variations
 * - Prompt optimization for different AI models (FLUX, DALL-E, etc.)
 * - Quality assessment and iteration capabilities
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');

// Import related services
const ReferenceImageFetcher = require('./reference-image-fetcher');
const AIRouter = require('./ai-router');

class SpritePromptEnhancer extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            // Analysis settings
            analysis: {
                enableColorAnalysis: true,
                enableCompositionAnalysis: true,
                enableStyleAnalysis: true,
                enableTextExtraction: false, // OCR for text in images
                dominantColorsCount: 5,
                minColorSignificance: 0.1 // Minimum percentage for dominant colors
            },
            
            // Prompt generation settings
            prompting: {
                baseStyle: 'pixel art',
                targetResolution: '512x512',
                artStyles: {
                    pixel_art: 'detailed pixel art, 16-bit style, crisp edges, retro gaming aesthetic',
                    cartoon: 'cartoon illustration, clean lines, vibrant colors, friendly character design',
                    realistic: 'realistic digital art, high detail, professional illustration',
                    watercolor: 'watercolor painting style, soft edges, artistic brushstrokes',
                    vector: 'vector art, clean geometric shapes, modern design'
                },
                qualityTerms: ['high quality', 'detailed', 'professional', 'clean', 'well-designed'],
                negativePrompts: [
                    'blurry', 'low quality', 'distorted', 'cropped', 'watermark',
                    'text overlay', 'photography', 'real photo', 'amateur',
                    'sketch', 'unfinished', 'messy', 'low resolution'
                ]
            },
            
            // Mascot-specific settings
            mascot: {
                characterTraits: {
                    grim_reaper: {
                        core: 'friendly grim reaper character',
                        accessories: ['cute scythe', 'hood', 'ethereal aura'],
                        mood: 'approachable death god',
                        colors: ['dark gray', 'purple', 'silver', 'ethereal blue']
                    },
                    husky: {
                        core: 'siberian husky dog',
                        features: ['pointed ears', 'blue eyes', 'fluffy tail', 'distinctive markings'],
                        expressions: ['alert', 'friendly', 'intelligent', 'expressive'],
                        colors: ['white', 'gray', 'black', 'blue eyes']
                    },
                    anchor: {
                        core: 'nautical anchor symbol',
                        style: ['maritime', 'naval', 'decorative'],
                        elements: ['chain', 'rope', 'traditional design'],
                        colors: ['navy blue', 'brass', 'rope brown', 'silver']
                    }
                },
                personalityModes: {
                    professional: {
                        descriptors: ['business attire', 'confident pose', 'serious expression', 'formal'],
                        accessories: ['bow tie', 'glasses', 'briefcase'],
                        mood: 'professional and competent'
                    },
                    reaper: {
                        descriptors: ['mystical aura', 'ethereal glow', 'floating pose', 'magical'],
                        accessories: ['scythe', 'hood', 'soul particles', 'purple aura'],
                        mood: 'wise and otherworldly but friendly'
                    },
                    playful: {
                        descriptors: ['energetic pose', 'happy expression', 'bouncy', 'cheerful'],
                        accessories: ['ball', 'toy', 'treats'],
                        mood: 'excited and playful'
                    },
                    wise: {
                        descriptors: ['meditative pose', 'knowing expression', 'calm', 'ancient wisdom'],
                        accessories: ['gems', 'mystical collar', 'soft glow'],
                        mood: 'sage-like and contemplative'
                    }
                }
            },
            
            // AI model configurations
            models: {
                'flux-dev': {
                    maxPromptLength: 500,
                    supportsNegativePrompts: true,
                    preferredAspectRatio: '1:1',
                    optimalPromptStructure: 'subject, style, details, quality'
                },
                'flux-pro': {
                    maxPromptLength: 800,
                    supportsNegativePrompts: true,
                    preferredAspectRatio: '1:1',
                    optimalPromptStructure: 'detailed_subject, artistic_style, composition, lighting, quality'
                },
                'sdxl': {
                    maxPromptLength: 400,
                    supportsNegativePrompts: true,
                    preferredAspectRatio: '1:1',
                    optimalPromptStructure: 'subject, style, quality_terms'
                }
            },
            
            // Cache and storage
            cache: {
                enabled: true,
                ttl: 24 * 60 * 60 * 1000, // 24 hours
                analysisCache: './sprite_analysis_cache',
                promptCache: './sprite_prompt_cache'
            },
            
            ...options
        };
        
        // Initialize services
        this.imageFetcher = null;
        this.aiRouter = null;
        
        // Cache and state
        this.analysisCache = new Map();
        this.promptCache = new Map();
        this.referenceLibrary = new Map();
        
        // Analysis tools
        this.colorAnalyzer = null;
        this.compositionAnalyzer = null;
        
        // Statistics
        this.stats = {
            promptsGenerated: 0,
            referencesAnalyzed: 0,
            cacheHits: 0,
            enhancementIterations: 0,
            successfulGenerations: 0
        };
        
        console.log('✨ Sprite Prompt Enhancer initialized');
        this.initialize();
    }
    
    /**
     * Initialize the prompt enhancement system
     */
    async initialize() {
        try {
            console.log('🚀 Initializing Sprite Prompt Enhancer...');
            
            // Setup directories
            await this.setupDirectories();
            
            // Initialize services
            await this.initializeServices();
            
            // Load cached data
            await this.loadCaches();
            
            // Setup analysis tools
            this.initializeAnalysisTools();
            
            console.log('✅ Sprite Prompt Enhancer ready');
            this.emit('ready');
            
        } catch (error) {
            console.error('❌ Failed to initialize Sprite Prompt Enhancer:', error);
            throw error;
        }
    }
    
    /**
     * Generate enhanced prompt for sprite creation
     */
    async generateEnhancedPrompt(context, options = {}) {
        console.log(`✨ Generating enhanced prompt for: ${context}`);
        
        const promptConfig = {
            mode: options.mode || 'professional', // professional, reaper, playful, wise
            style: options.style || 'pixel_art',
            model: options.model || 'flux-dev',
            includeReferences: options.includeReferences !== false,
            emotionalState: options.emotionalState || 'neutral',
            sceneContext: options.sceneContext || 'standalone',
            qualityLevel: options.qualityLevel || 'high',
            customModifiers: options.customModifiers || []
        };
        
        try {
            // Check cache first
            const cacheKey = this.generatePromptCacheKey(context, promptConfig);
            if (this.promptCache.has(cacheKey)) {
                console.log('  📋 Using cached prompt');
                this.stats.cacheHits++;
                return this.promptCache.get(cacheKey);
            }
            
            // Fetch and analyze reference images if requested
            let referenceAnalysis = null;
            if (promptConfig.includeReferences) {
                console.log('  🔍 Analyzing reference images...');
                referenceAnalysis = await this.analyzeReferenceImages(context, promptConfig);
            }
            
            // Build base prompt components
            const promptComponents = await this.buildPromptComponents(context, promptConfig, referenceAnalysis);
            
            // Assemble final prompt
            const enhancedPrompt = this.assemblePrompt(promptComponents, promptConfig);
            
            // Validate and optimize prompt
            const optimizedPrompt = this.optimizePromptForModel(enhancedPrompt, promptConfig.model);
            
            const result = {
                context,
                mode: promptConfig.mode,
                style: promptConfig.style,
                model: promptConfig.model,
                mainPrompt: optimizedPrompt.main,
                negativePrompt: optimizedPrompt.negative,
                parameters: optimizedPrompt.parameters,
                referenceAnalysis,
                components: promptComponents,
                metadata: {
                    generated: new Date().toISOString(),
                    promptLength: optimizedPrompt.main.length,
                    referencesUsed: referenceAnalysis?.referencesCount || 0,
                    qualityScore: this.calculatePromptQuality(optimizedPrompt)
                }
            };
            
            // Cache the result
            this.promptCache.set(cacheKey, result);
            await this.savePromptCache();
            
            // Update statistics
            this.stats.promptsGenerated++;
            
            console.log(`✅ Enhanced prompt generated (${result.metadata.promptLength} chars)`);
            
            this.emit('prompt_generated', result);
            return result;
            
        } catch (error) {
            console.error(`❌ Failed to generate enhanced prompt for ${context}:`, error);
            throw error;
        }
    }
    
    /**
     * Analyze reference images for prompt enhancement
     */
    async analyzeReferenceImages(context, config) {
        // Check if we need to fetch new references
        if (!this.imageFetcher) {
            console.log('  📥 Initializing image fetcher...');
            this.imageFetcher = new ReferenceImageFetcher();
            await new Promise(resolve => this.imageFetcher.once('ready', resolve));
        }
        
        // Fetch relevant reference images
        let referenceResults;
        switch (context) {
            case 'grim_reaper_husky':
                referenceResults = await this.imageFetcher.fetchGrimReaperReferences(config.style);
                break;
            case 'anchor_nautical':
                referenceResults = await this.imageFetcher.fetchAnchorReferences('nautical');
                break;
            case 'husky_character':
                referenceResults = await this.imageFetcher.fetchHuskyReferences('expressions');
                break;
            default:
                referenceResults = await this.imageFetcher.fetchReferenceImages(context, {
                    style: config.style,
                    maxImages: 10
                });
        }
        
        // Analyze the downloaded images
        const analysis = {
            referencesCount: referenceResults.images.length,
            colorPalettes: [],
            styleCharacteristics: [],
            compositionElements: [],
            dominantThemes: []
        };
        
        for (const image of referenceResults.images.slice(0, 5)) { // Analyze top 5 images
            if (image.localPath) {
                try {
                    const imageAnalysis = await this.analyzeImage(image.localPath);
                    analysis.colorPalettes.push(imageAnalysis.colors);
                    analysis.styleCharacteristics.push(...imageAnalysis.style);
                    analysis.compositionElements.push(...imageAnalysis.composition);
                } catch (error) {
                    console.error(`Error analyzing image ${image.localPath}:`, error.message);
                }
            }
        }
        
        // Aggregate analysis results
        analysis.dominantColors = this.aggregateDominantColors(analysis.colorPalettes);
        analysis.commonStyles = this.aggregateStyleCharacteristics(analysis.styleCharacteristics);
        analysis.keyCompositionElements = this.aggregateCompositionElements(analysis.compositionElements);
        
        this.stats.referencesAnalyzed += referenceResults.images.length;
        
        return analysis;
    }
    
    /**
     * Analyze a single image for visual characteristics
     */
    async analyzeImage(imagePath) {
        const cacheKey = crypto.createHash('md5').update(imagePath).digest('hex');
        
        if (this.analysisCache.has(cacheKey)) {
            return this.analysisCache.get(cacheKey);
        }
        
        try {
            const analysis = {
                colors: [],
                style: [],
                composition: [],
                metadata: {}
            };
            
            // Load image with Sharp
            const image = sharp(imagePath);
            const metadata = await image.metadata();
            analysis.metadata = {
                width: metadata.width,
                height: metadata.height,
                format: metadata.format,
                aspectRatio: metadata.width / metadata.height
            };
            
            // Color analysis
            if (this.config.analysis.enableColorAnalysis) {
                analysis.colors = await this.extractDominantColors(image);
            }
            
            // Style analysis (based on image characteristics)
            if (this.config.analysis.enableStyleAnalysis) {
                analysis.style = await this.analyzeImageStyle(image, metadata);
            }
            
            // Composition analysis
            if (this.config.analysis.enableCompositionAnalysis) {
                analysis.composition = await this.analyzeImageComposition(image, metadata);
            }
            
            // Cache the analysis
            this.analysisCache.set(cacheKey, analysis);
            
            return analysis;
            
        } catch (error) {
            console.error(`Failed to analyze image ${imagePath}:`, error);
            return { colors: [], style: [], composition: [], metadata: {} };
        }
    }
    
    /**
     * Extract dominant colors from an image
     */
    async extractDominantColors(image) {
        try {
            // Get image statistics
            const { dominant } = await image.stats();
            
            // Convert to HSL and categorize colors
            const colors = [];
            
            if (dominant.r !== undefined) {
                const rgb = { r: dominant.r, g: dominant.g, b: dominant.b };
                const hsl = this.rgbToHsl(rgb);
                const colorName = this.categorizeColor(rgb, hsl);
                
                colors.push({
                    rgb: rgb,
                    hsl: hsl,
                    name: colorName,
                    significance: 1.0 // Dominant color has full significance
                });
            }
            
            return colors;
            
        } catch (error) {
            console.error('Color extraction failed:', error);
            return [];
        }
    }
    
    /**
     * Analyze image style characteristics
     */
    async analyzeImageStyle(image, metadata) {
        const styleCharacteristics = [];
        
        // Analyze based on metadata and statistical features
        if (metadata.width <= 256 || metadata.height <= 256) {
            styleCharacteristics.push('pixel_art', 'low_resolution', 'retro');
        } else if (metadata.width >= 1024 || metadata.height >= 1024) {
            styleCharacteristics.push('high_resolution', 'detailed', 'modern');
        }
        
        // Aspect ratio analysis
        const aspectRatio = metadata.width / metadata.height;
        if (Math.abs(aspectRatio - 1.0) < 0.1) {
            styleCharacteristics.push('square_format', 'portrait_style');
        } else if (aspectRatio > 1.5) {
            styleCharacteristics.push('landscape_format', 'wide_composition');
        } else if (aspectRatio < 0.7) {
            styleCharacteristics.push('portrait_format', 'tall_composition');
        }
        
        return styleCharacteristics;
    }
    
    /**
     * Analyze image composition
     */
    async analyzeImageComposition(image, metadata) {
        const compositionElements = [];
        
        // Basic composition analysis based on image properties
        compositionElements.push('centered_subject');
        
        if (metadata.width === metadata.height) {
            compositionElements.push('square_composition');
        }
        
        if (metadata.channels === 4) {
            compositionElements.push('transparent_background');
        } else if (metadata.channels === 3) {
            compositionElements.push('solid_background');
        }
        
        return compositionElements;
    }
    
    /**
     * Build prompt components based on context and analysis
     */
    async buildPromptComponents(context, config, referenceAnalysis) {
        const components = {
            subject: '',
            style: '',
            mood: '',
            details: '',
            colors: '',
            composition: '',
            quality: '',
            technical: ''
        };
        
        // Subject component
        components.subject = this.buildSubjectComponent(context, config);
        
        // Style component
        components.style = this.buildStyleComponent(config.style, referenceAnalysis);
        
        // Mood and personality component
        components.mood = this.buildMoodComponent(config.mode, config.emotionalState);
        
        // Details component
        components.details = this.buildDetailsComponent(context, config, referenceAnalysis);
        
        // Color component
        components.colors = this.buildColorComponent(context, config, referenceAnalysis);
        
        // Composition component
        components.composition = this.buildCompositionComponent(config, referenceAnalysis);
        
        // Quality component
        components.quality = this.buildQualityComponent(config.qualityLevel);
        
        // Technical component
        components.technical = this.buildTechnicalComponent(config);
        
        return components;
    }
    
    /**
     * Build subject component of the prompt
     */
    buildSubjectComponent(context, config) {
        const mascotTraits = this.config.mascot.characterTraits;
        const modeConfig = this.config.mascot.personalityModes[config.mode];
        
        let subject = '';
        
        if (context.includes('grim_reaper')) {
            subject = `${mascotTraits.grim_reaper.core} ${mascotTraits.husky.core}`;
        } else if (context.includes('husky')) {
            subject = mascotTraits.husky.core;
        } else if (context.includes('anchor')) {
            subject = mascotTraits.anchor.core;
        } else {
            subject = 'character mascot';
        }
        
        // Add personality mode descriptors
        if (modeConfig) {
            subject += `, ${modeConfig.mood}`;
        }
        
        return subject;
    }
    
    /**
     * Build style component
     */
    buildStyleComponent(style, referenceAnalysis) {
        let stylePrompt = this.config.prompting.artStyles[style] || style;
        
        if (referenceAnalysis?.commonStyles?.length > 0) {
            const additionalStyles = referenceAnalysis.commonStyles
                .filter(s => !stylePrompt.includes(s))
                .slice(0, 2)
                .join(', ');
            
            if (additionalStyles) {
                stylePrompt += `, ${additionalStyles}`;
            }
        }
        
        return stylePrompt;
    }
    
    /**
     * Build mood component
     */
    buildMoodComponent(mode, emotionalState) {
        const modeConfig = this.config.mascot.personalityModes[mode];
        
        let moodPrompt = '';
        if (modeConfig) {
            moodPrompt = modeConfig.descriptors.join(', ');
            
            if (emotionalState && emotionalState !== 'neutral') {
                moodPrompt += `, ${emotionalState} expression`;
            }
        }
        
        return moodPrompt;
    }
    
    /**
     * Build details component
     */
    buildDetailsComponent(context, config, referenceAnalysis) {
        const mascotTraits = this.config.mascot.characterTraits;
        const modeConfig = this.config.mascot.personalityModes[config.mode];
        
        let details = [];
        
        // Add character-specific features
        if (context.includes('grim_reaper')) {
            details.push(...mascotTraits.grim_reaper.accessories);
        }
        if (context.includes('husky')) {
            details.push(...mascotTraits.husky.features);
        }
        if (context.includes('anchor')) {
            details.push(...mascotTraits.anchor.elements);
        }
        
        // Add mode-specific accessories
        if (modeConfig?.accessories) {
            details.push(...modeConfig.accessories);
        }
        
        // Add reference-derived details
        if (referenceAnalysis?.keyCompositionElements) {
            details.push(...referenceAnalysis.keyCompositionElements.slice(0, 2));
        }
        
        return details.slice(0, 6).join(', '); // Limit to 6 details
    }
    
    /**
     * Build color component
     */
    buildColorComponent(context, config, referenceAnalysis) {
        let colors = [];
        
        // Get base colors for character type
        const mascotTraits = this.config.mascot.characterTraits;
        if (context.includes('grim_reaper')) {
            colors.push(...mascotTraits.grim_reaper.colors);
        }
        if (context.includes('husky')) {
            colors.push(...mascotTraits.husky.colors);
        }
        if (context.includes('anchor')) {
            colors.push(...mascotTraits.anchor.colors);
        }
        
        // Add reference-derived colors
        if (referenceAnalysis?.dominantColors?.length > 0) {
            const refColors = referenceAnalysis.dominantColors
                .slice(0, 2)
                .map(color => color.name);
            colors.push(...refColors);
        }
        
        // Remove duplicates and limit
        colors = [...new Set(colors)].slice(0, 4);
        
        return colors.length > 0 ? `color palette: ${colors.join(', ')}` : '';
    }
    
    /**
     * Build composition component
     */
    buildCompositionComponent(config, referenceAnalysis) {
        let composition = ['centered character', 'clean background'];
        
        if (config.sceneContext !== 'standalone') {
            composition.push('environmental context');
        }
        
        if (referenceAnalysis?.keyCompositionElements) {
            composition.push(...referenceAnalysis.keyCompositionElements.slice(0, 2));
        }
        
        return composition.slice(0, 3).join(', ');
    }
    
    /**
     * Build quality component
     */
    buildQualityComponent(qualityLevel) {
        const qualityTerms = this.config.prompting.qualityTerms;
        
        switch (qualityLevel) {
            case 'high':
                return qualityTerms.slice(0, 3).join(', ');
            case 'medium':
                return qualityTerms.slice(0, 2).join(', ');
            case 'low':
                return qualityTerms[0];
            default:
                return qualityTerms.slice(0, 2).join(', ');
        }
    }
    
    /**
     * Build technical component
     */
    buildTechnicalComponent(config) {
        const modelConfig = this.config.models[config.model];
        
        let technical = [this.config.prompting.targetResolution];
        
        if (modelConfig?.preferredAspectRatio) {
            technical.push(`aspect ratio ${modelConfig.preferredAspectRatio}`);
        }
        
        return technical.join(', ');
    }
    
    /**
     * Assemble final prompt from components
     */
    assemblePrompt(components, config) {
        const modelConfig = this.config.models[config.model];
        const structure = modelConfig?.optimalPromptStructure || 'subject, style, details, quality';
        
        let mainPrompt = '';
        
        // Build prompt based on model's preferred structure
        switch (structure) {
            case 'detailed_subject, artistic_style, composition, lighting, quality':
                mainPrompt = [
                    components.subject,
                    components.details,
                    components.style,
                    components.composition,
                    components.colors,
                    components.mood,
                    components.quality,
                    components.technical
                ].filter(Boolean).join(', ');
                break;
                
            case 'subject, style, details, quality':
                mainPrompt = [
                    components.subject,
                    components.style,
                    components.details,
                    components.mood,
                    components.colors,
                    components.quality
                ].filter(Boolean).join(', ');
                break;
                
            default:
                mainPrompt = [
                    components.subject,
                    components.style,
                    components.details,
                    components.quality
                ].filter(Boolean).join(', ');
        }
        
        // Build negative prompt
        const negativePrompt = this.config.prompting.negativePrompts.join(', ');
        
        return {
            main: mainPrompt,
            negative: negativePrompt,
            components: components
        };
    }
    
    /**
     * Optimize prompt for specific AI model
     */
    optimizePromptForModel(prompt, modelName) {
        const modelConfig = this.config.models[modelName];
        
        if (!modelConfig) {
            return {
                main: prompt.main,
                negative: prompt.negative,
                parameters: {}
            };
        }
        
        // Truncate if too long
        let optimizedMain = prompt.main;
        if (optimizedMain.length > modelConfig.maxPromptLength) {
            optimizedMain = optimizedMain.substring(0, modelConfig.maxPromptLength - 3) + '...';
        }
        
        // Set model-specific parameters
        const parameters = {
            model: modelName,
            width: 512,
            height: 512,
            num_outputs: 1,
            guidance_scale: 7.5,
            num_inference_steps: 25
        };
        
        // Model-specific optimizations
        switch (modelName) {
            case 'flux-pro':
                parameters.guidance_scale = 3.5;
                parameters.num_inference_steps = 28;
                break;
            case 'flux-dev':
                parameters.guidance_scale = 7.5;
                parameters.num_inference_steps = 25;
                break;
            case 'sdxl':
                parameters.guidance_scale = 7.0;
                parameters.num_inference_steps = 30;
                break;
        }
        
        return {
            main: optimizedMain,
            negative: modelConfig.supportsNegativePrompts ? prompt.negative : '',
            parameters: parameters
        };
    }
    
    // Helper methods
    
    generatePromptCacheKey(context, config) {
        const keyData = {
            context,
            mode: config.mode,
            style: config.style,
            model: config.model,
            emotionalState: config.emotionalState,
            sceneContext: config.sceneContext
        };
        return crypto.createHash('md5').update(JSON.stringify(keyData)).digest('hex');
    }
    
    rgbToHsl({r, g, b}) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        
        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        
        return {h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100)};
    }
    
    categorizeColor(rgb, hsl) {
        const {h, s, l} = hsl;
        
        if (l < 20) return 'black';
        if (l > 80 && s < 20) return 'white';
        if (s < 20) return l > 50 ? 'light gray' : 'dark gray';
        
        if (h < 30) return 'red';
        if (h < 60) return 'orange';
        if (h < 90) return 'yellow';
        if (h < 150) return 'green';
        if (h < 210) return 'cyan';
        if (h < 270) return 'blue';
        if (h < 330) return 'purple';
        return 'red';
    }
    
    aggregateDominantColors(colorPalettes) {
        const colorCounts = new Map();
        
        for (const palette of colorPalettes) {
            for (const color of palette) {
                const count = colorCounts.get(color.name) || 0;
                colorCounts.set(color.name, count + 1);
            }
        }
        
        return Array.from(colorCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name, frequency: count }));
    }
    
    aggregateStyleCharacteristics(styleArrays) {
        const styleFreq = new Map();
        
        for (const styles of styleArrays) {
            for (const style of styles) {
                styleFreq.set(style, (styleFreq.get(style) || 0) + 1);
            }
        }
        
        return Array.from(styleFreq.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([style]) => style);
    }
    
    aggregateCompositionElements(compositionArrays) {
        const elementFreq = new Map();
        
        for (const elements of compositionArrays) {
            for (const element of elements) {
                elementFreq.set(element, (elementFreq.get(element) || 0) + 1);
            }
        }
        
        return Array.from(elementFreq.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([element]) => element);
    }
    
    calculatePromptQuality(prompt) {
        let score = 0;
        
        // Length scoring
        if (prompt.main.length > 100 && prompt.main.length < 400) score += 20;
        else if (prompt.main.length > 50) score += 10;
        
        // Specificity scoring
        const specificTerms = ['detailed', 'high quality', 'professional', 'clean'];
        score += specificTerms.filter(term => prompt.main.includes(term)).length * 5;
        
        // Negative prompt scoring
        if (prompt.negative && prompt.negative.length > 20) score += 15;
        
        // Coherence scoring (basic check for comma separation)
        const parts = prompt.main.split(',').map(p => p.trim());
        if (parts.length >= 3 && parts.length <= 8) score += 15;
        
        return Math.min(100, score);
    }
    
    async setupDirectories() {
        const dirs = [
            this.config.cache.analysisCache,
            this.config.cache.promptCache
        ];
        
        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }
    }
    
    async initializeServices() {
        // AI Router will be injected when needed
        console.log('  🔧 Services ready for injection');
    }
    
    initializeAnalysisTools() {
        // Analysis tools are implemented directly in the class methods
        console.log('  🔍 Analysis tools initialized');
    }
    
    async loadCaches() {
        // Load analysis cache
        try {
            const analysisCacheFile = path.join(this.config.cache.analysisCache, 'analysis.json');
            const analysisData = await fs.readFile(analysisCacheFile, 'utf8');
            const analysisCache = JSON.parse(analysisData);
            
            for (const [key, value] of Object.entries(analysisCache)) {
                this.analysisCache.set(key, value);
            }
        } catch {
            // Cache doesn't exist, start fresh
        }
        
        // Load prompt cache
        try {
            const promptCacheFile = path.join(this.config.cache.promptCache, 'prompts.json');
            const promptData = await fs.readFile(promptCacheFile, 'utf8');
            const promptCache = JSON.parse(promptData);
            
            for (const [key, value] of Object.entries(promptCache)) {
                this.promptCache.set(key, value);
            }
        } catch {
            // Cache doesn't exist, start fresh
        }
        
        console.log(`  📋 Loaded ${this.analysisCache.size} analysis entries and ${this.promptCache.size} prompt entries`);
    }
    
    async savePromptCache() {
        try {
            const promptCacheFile = path.join(this.config.cache.promptCache, 'prompts.json');
            const promptData = Object.fromEntries(this.promptCache.entries());
            await fs.writeFile(promptCacheFile, JSON.stringify(promptData, null, 2));
        } catch (error) {
            console.error('Failed to save prompt cache:', error);
        }
    }
    
    /**
     * Get statistics
     */
    getStats() {
        return {
            ...this.stats,
            analysisCacheSize: this.analysisCache.size,
            promptCacheSize: this.promptCache.size
        };
    }
    
    /**
     * Quick API methods for common use cases
     */
    async generateGrimReaperPrompt(mode = 'reaper', style = 'pixel_art') {
        return this.generateEnhancedPrompt('grim_reaper_husky', {
            mode,
            style,
            model: 'flux-dev',
            includeReferences: true
        });
    }
    
    async generateAnchorPrompt(style = 'nautical') {
        return this.generateEnhancedPrompt('anchor_nautical', {
            mode: 'professional',
            style,
            model: 'flux-dev',
            includeReferences: true
        });
    }
    
    async generateHuskyPrompt(mode = 'playful', emotionalState = 'happy') {
        return this.generateEnhancedPrompt('husky_character', {
            mode,
            style: 'pixel_art',
            emotionalState,
            model: 'flux-dev',
            includeReferences: true
        });
    }
}

module.exports = SpritePromptEnhancer;

// Example usage for testing
if (require.main === module) {
    console.log('✨ Testing Sprite Prompt Enhancer...');
    
    const enhancer = new SpritePromptEnhancer();
    
    enhancer.once('ready', async () => {
        console.log('\n🧪 Testing grim reaper prompt generation...');
        
        try {
            const grimReaperPrompt = await enhancer.generateGrimReaperPrompt('reaper', 'pixel_art');
            console.log('Main prompt:', grimReaperPrompt.mainPrompt);
            console.log('Negative prompt:', grimReaperPrompt.negativePrompt);
            console.log('Quality score:', grimReaperPrompt.metadata.qualityScore);
            
            console.log('\n🧪 Testing anchor prompt generation...');
            const anchorPrompt = await enhancer.generateAnchorPrompt('nautical');
            console.log('Main prompt:', anchorPrompt.mainPrompt);
            
            console.log('\n📊 Statistics:');
            console.log(enhancer.getStats());
            
        } catch (error) {
            console.error('❌ Test failed:', error);
        }
    });
}