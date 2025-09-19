#!/usr/bin/env node

/**
 * VISUAL SPRITE GENERATOR
 * 
 * Complete system for generating high-quality mascot sprites using AI.
 * Integrates reference image fetching, prompt enhancement, and AI generation
 * to create actual visual sprites for the grim reaper husky mascot.
 * 
 * Features:
 * - Integration with Reference Image Fetcher and Sprite Prompt Enhancer
 * - AI sprite generation via Replicate FLUX models
 * - Sprite library management and caching
 * - Multiple format support (PNG, JPG, WebP)
 * - Quality control and filtering
 * - Sprite sheet generation for animations
 * - Batch generation capabilities
 * - Integration with existing husky mascot system
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');

// Import related services
const ReferenceImageFetcher = require('./reference-image-fetcher');
const SpritePromptEnhancer = require('./sprite-prompt-enhancer');
const AIRouter = require('./ai-router');

class VisualSpriteGenerator extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            // Output settings
            output: {
                directory: './generated_sprites',
                formats: ['png', 'jpg', 'webp'],
                resolutions: {
                    thumbnail: { width: 128, height: 128 },
                    standard: { width: 512, height: 512 },
                    high: { width: 1024, height: 1024 }
                },
                defaultResolution: 'standard',
                spriteSheets: {
                    enabled: true,
                    directory: './sprite_sheets',
                    maxSpritesPerSheet: 16,
                    padding: 4
                }
            },
            
            // Generation settings
            generation: {
                defaultModel: 'flux-dev',
                fallbackModels: ['flux-pro', 'sdxl'],
                maxRetries: 3,
                retryDelay: 2000,
                batchSize: 4,
                parallelGenerations: 2,
                qualityThreshold: 0.7,
                enableQualityFiltering: true
            },
            
            // Sprite categories and variations
            sprites: {
                categories: {
                    mascot: {
                        grim_reaper_husky: {
                            modes: ['professional', 'reaper', 'playful', 'wise'],
                            emotions: ['neutral', 'happy', 'excited', 'contemplative', 'determined'],
                            accessories: ['scythe', 'hood', 'bow_tie', 'glasses', 'ball'],
                            poses: ['idle', 'walking', 'floating', 'sitting', 'action']
                        },
                        anchor_nautical: {
                            styles: ['traditional', 'decorative', 'vintage', 'modern'],
                            elements: ['chain', 'rope', 'crown', 'banner'],
                            contexts: ['standalone', 'with_ship', 'with_waves', 'emblem']
                        }
                    },
                    expressions: {
                        facial: ['smile', 'wink', 'surprise', 'focus', 'wisdom', 'mischief'],
                        body: ['alert_ears', 'tail_wag', 'head_tilt', 'pounce_ready']
                    },
                    animations: {
                        idle: ['breathing', 'ear_twitch', 'tail_sway'],
                        movement: ['walk_cycle', 'run_cycle', 'float_cycle'],
                        actions: ['scythe_swing', 'soul_collect', 'bark', 'howl']
                    }
                }
            },
            
            // AI model configurations
            models: {
                'flux-dev': {
                    maxConcurrent: 2,
                    timeout: 120000,
                    costPerGeneration: 0.05,
                    preferredForStyles: ['pixel_art', 'cartoon', 'illustration']
                },
                'flux-pro': {
                    maxConcurrent: 1,
                    timeout: 180000,
                    costPerGeneration: 0.12,
                    preferredForStyles: ['realistic', 'detailed', 'professional']
                },
                'sdxl': {
                    maxConcurrent: 3,
                    timeout: 90000,
                    costPerGeneration: 0.03,
                    preferredForStyles: ['artistic', 'stylized', 'creative']
                }
            },
            
            // Quality control
            quality: {
                minScore: 0.6,
                checks: {
                    resolution: true,
                    aspectRatio: true,
                    clarity: true,
                    subjectPresence: true,
                    styleConsistency: true
                },
                autoRetryFailedQuality: true,
                maxQualityRetries: 2
            },
            
            // Cache and storage
            cache: {
                enabled: true,
                ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
                maxSize: 500, // sprites per category
                cleanupInterval: 24 * 60 * 60 * 1000, // 24 hours
                metadataFile: './sprite_metadata.json'
            },
            
            ...options
        };
        
        // Initialize services
        this.imageFetcher = null;
        this.promptEnhancer = null;
        this.aiRouter = null;
        
        // Storage and cache
        this.spriteLibrary = new Map();
        this.generationQueue = [];
        this.isGenerating = false;
        this.activeGenerations = new Map();
        
        // Statistics
        this.stats = {
            totalGenerated: 0,
            successful: 0,
            failed: 0,
            qualityFiltered: 0,
            cacheHits: 0,
            totalCost: 0,
            averageGenerationTime: 0,
            lastGeneration: null
        };
        
        console.log('🎨 Visual Sprite Generator initialized');
        this.initialize();
    }
    
    /**
     * Initialize the sprite generation system
     */
    async initialize() {
        try {
            console.log('🚀 Initializing Visual Sprite Generator...');
            
            // Setup directories
            await this.setupDirectories();
            
            // Initialize services
            await this.initializeServices();
            
            // Load existing sprite library
            await this.loadSpriteLibrary();
            
            // Schedule cache cleanup
            this.scheduleCacheCleanup();
            
            console.log('✅ Visual Sprite Generator ready');
            this.emit('ready');
            
        } catch (error) {
            console.error('❌ Failed to initialize Visual Sprite Generator:', error);
            throw error;
        }
    }
    
    /**
     * Generate a sprite with enhanced prompts and reference images
     */
    async generateSprite(context, options = {}) {
        console.log(`🎨 Generating sprite: ${context}`);
        
        const generationConfig = {
            mode: options.mode || 'professional',
            emotion: options.emotion || 'neutral',
            style: options.style || 'pixel_art',
            model: options.model || this.config.generation.defaultModel,
            resolution: options.resolution || this.config.output.defaultResolution,
            format: options.format || 'png',
            pose: options.pose || 'idle',
            accessories: options.accessories || [],
            useReferences: options.useReferences !== false,
            forceRegenerate: options.forceRegenerate || false,
            qualityLevel: options.qualityLevel || 'high'
        };
        
        const startTime = Date.now();
        
        try {
            // Check cache first
            const cacheKey = this.generateCacheKey(context, generationConfig);
            if (!generationConfig.forceRegenerate && this.spriteLibrary.has(cacheKey)) {
                console.log('  📋 Using cached sprite');
                this.stats.cacheHits++;
                return this.spriteLibrary.get(cacheKey);
            }
            
            // Generate enhanced prompt
            console.log('  ✨ Generating enhanced prompt...');
            const promptResult = await this.generateEnhancedPrompt(context, generationConfig);
            
            // Generate sprite using AI
            console.log('  🤖 Generating sprite with AI...');
            const aiResult = await this.generateWithAI(promptResult, generationConfig);
            
            // Process and validate the generated sprite
            console.log('  🔍 Processing and validating sprite...');
            const processedSprite = await this.processGeneratedSprite(aiResult, generationConfig);
            
            // Quality check
            const qualityScore = await this.assessSpriteQuality(processedSprite);
            
            if (qualityScore < this.config.quality.minScore && this.config.quality.autoRetryFailedQuality) {
                console.log(`  ⚠️  Quality score ${qualityScore} below threshold, retrying...`);
                if (generationConfig._qualityRetries < this.config.quality.maxQualityRetries) {
                    generationConfig._qualityRetries = (generationConfig._qualityRetries || 0) + 1;
                    return this.generateSprite(context, generationConfig);
                }
            }
            
            // Create sprite metadata
            const spriteData = {
                context,
                config: generationConfig,
                prompt: promptResult,
                generated: new Date().toISOString(),
                processingTime: Date.now() - startTime,
                qualityScore,
                localPath: processedSprite.filePath,
                dimensions: processedSprite.dimensions,
                fileSize: processedSprite.fileSize,
                format: processedSprite.format,
                model: generationConfig.model,
                cost: this.calculateGenerationCost(generationConfig.model),
                id: crypto.randomUUID()
            };
            
            // Save sprite and add to library
            this.spriteLibrary.set(cacheKey, spriteData);
            await this.saveSpriteLibrary();
            
            // Update statistics
            this.updateStats(spriteData, true);
            
            console.log(`✅ Sprite generated successfully (${spriteData.processingTime}ms, quality: ${qualityScore})`);
            
            this.emit('sprite_generated', spriteData);
            return spriteData;
            
        } catch (error) {
            console.error(`❌ Failed to generate sprite for ${context}:`, error);
            
            // Update failure stats
            this.stats.failed++;
            this.stats.totalGenerated++;
            
            // Try with fallback model if available
            if (!generationConfig._fallbackAttempt && this.config.generation.fallbackModels.length > 0) {
                console.log('  🔄 Trying with fallback model...');
                generationConfig._fallbackAttempt = true;
                generationConfig.model = this.config.generation.fallbackModels[0];
                return this.generateSprite(context, generationConfig);
            }
            
            throw error;
        }
    }
    
    /**
     * Generate enhanced prompt using the prompt enhancer
     */
    async generateEnhancedPrompt(context, config) {
        if (!this.promptEnhancer) {
            this.promptEnhancer = new SpritePromptEnhancer();
            await new Promise(resolve => this.promptEnhancer.once('ready', resolve));
        }
        
        return this.promptEnhancer.generateEnhancedPrompt(context, {
            mode: config.mode,
            style: config.style,
            model: config.model,
            emotionalState: config.emotion,
            sceneContext: config.pose,
            qualityLevel: config.qualityLevel,
            customModifiers: config.accessories
        });
    }
    
    /**
     * Generate sprite using AI models
     */
    async generateWithAI(promptResult, config) {
        if (!this.aiRouter) {
            this.aiRouter = new AIRouter();
        }
        
        const modelConfig = this.config.models[config.model];
        
        // Prepare generation parameters
        const generationParams = {
            prompt: promptResult.mainPrompt,
            negative_prompt: promptResult.negativePrompt,
            width: this.config.output.resolutions[config.resolution].width,
            height: this.config.output.resolutions[config.resolution].height,
            num_outputs: 1,
            guidance_scale: promptResult.parameters.guidance_scale || 7.5,
            num_inference_steps: promptResult.parameters.num_inference_steps || 25,
            seed: config.seed || Math.floor(Math.random() * 1000000)
        };
        
        // Call AI Router with retries
        let result = null;
        let lastError = null;
        
        for (let attempt = 1; attempt <= this.config.generation.maxRetries; attempt++) {
            try {
                console.log(`  🤖 AI generation attempt ${attempt}/${this.config.generation.maxRetries}`);
                
                result = await this.aiRouter.routeRequest(
                    `Generate sprite: ${promptResult.mainPrompt}`,
                    {
                        model: `replicate:${config.model}`,
                        parameters: generationParams,
                        timeout: modelConfig.timeout
                    }
                );
                
                if (result.success) {
                    break;
                }
                
                throw new Error(result.error);
                
            } catch (error) {
                lastError = error;
                console.error(`  ❌ Attempt ${attempt} failed:`, error.message);
                
                if (attempt < this.config.generation.maxRetries) {
                    await new Promise(resolve => 
                        setTimeout(resolve, this.config.generation.retryDelay * attempt)
                    );
                }
            }
        }
        
        if (!result || !result.success) {
            throw new Error(`AI generation failed after ${this.config.generation.maxRetries} attempts: ${lastError?.message}`);
        }
        
        return result;
    }
    
    /**
     * Process the generated sprite (download, validate, optimize)
     */
    async processGeneratedSprite(aiResult, config) {
        // Get the generated image URL from AI result
        let imageUrl;
        if (Array.isArray(aiResult.result)) {
            imageUrl = aiResult.result[0];
        } else if (typeof aiResult.result === 'string') {
            imageUrl = aiResult.result;
        } else {
            throw new Error('Invalid AI result format');
        }
        
        // Download the generated image
        console.log('  📥 Downloading generated sprite...');
        const axios = require('axios');
        const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 30000
        });
        
        // Process with Sharp
        const image = sharp(response.data);
        const metadata = await image.metadata();
        
        // Generate filename
        const timestamp = Date.now();
        const hash = crypto.createHash('md5').update(response.data).digest('hex').substring(0, 8);
        const filename = `sprite_${timestamp}_${hash}.${config.format}`;
        const filePath = path.join(this.config.output.directory, filename);
        
        // Optimize and save image
        let processedImage;
        const targetRes = this.config.output.resolutions[config.resolution];
        
        switch (config.format) {
            case 'png':
                processedImage = await image
                    .resize(targetRes.width, targetRes.height, { 
                        fit: 'contain', 
                        background: { r: 0, g: 0, b: 0, alpha: 0 } 
                    })
                    .png({ quality: 90, compressionLevel: 6 })
                    .toBuffer();
                break;
                
            case 'jpg':
                processedImage = await image
                    .resize(targetRes.width, targetRes.height, { 
                        fit: 'contain', 
                        background: { r: 255, g: 255, b: 255 } 
                    })
                    .jpeg({ quality: 90 })
                    .toBuffer();
                break;
                
            case 'webp':
                processedImage = await image
                    .resize(targetRes.width, targetRes.height, { 
                        fit: 'contain', 
                        background: { r: 0, g: 0, b: 0, alpha: 0 } 
                    })
                    .webp({ quality: 90 })
                    .toBuffer();
                break;
                
            default:
                throw new Error(`Unsupported format: ${config.format}`);
        }
        
        // Save to disk
        await fs.writeFile(filePath, processedImage);
        
        // Get final metadata
        const finalImage = sharp(processedImage);
        const finalMetadata = await finalImage.metadata();
        
        return {
            filePath,
            originalUrl: imageUrl,
            dimensions: {
                width: finalMetadata.width,
                height: finalMetadata.height
            },
            fileSize: processedImage.length,
            format: config.format,
            processedAt: new Date().toISOString()
        };
    }
    
    /**
     * Assess the quality of a generated sprite
     */
    async assessSpriteQuality(sprite) {
        let score = 0;
        
        try {
            const image = sharp(sprite.filePath);
            const metadata = await image.metadata();
            const stats = await image.stats();
            
            // Resolution scoring
            if (metadata.width >= 512 && metadata.height >= 512) score += 25;
            else if (metadata.width >= 256 && metadata.height >= 256) score += 15;
            else score += 5;
            
            // Aspect ratio scoring (prefer square)
            const aspectRatio = metadata.width / metadata.height;
            if (aspectRatio >= 0.9 && aspectRatio <= 1.1) score += 20;
            else if (aspectRatio >= 0.8 && aspectRatio <= 1.2) score += 10;
            
            // Channel scoring (prefer RGBA for transparency)
            if (metadata.channels === 4) score += 15;
            else if (metadata.channels === 3) score += 10;
            
            // File size scoring (not too small, not too large)
            const fileSizeMB = sprite.fileSize / (1024 * 1024);
            if (fileSizeMB >= 0.1 && fileSizeMB <= 5) score += 15;
            else if (fileSizeMB >= 0.05) score += 5;
            
            // Color variety scoring (based on stats)
            if (stats.channels) {
                const colorVariety = stats.channels.reduce((sum, channel) => 
                    sum + (channel.max - channel.min), 0) / stats.channels.length;
                if (colorVariety > 150) score += 15;
                else if (colorVariety > 100) score += 10;
                else if (colorVariety > 50) score += 5;
            }
            
            // Format bonus
            if (sprite.format === 'png') score += 10; // Best for sprites
            else if (sprite.format === 'webp') score += 5;
            
        } catch (error) {
            console.error('Error assessing sprite quality:', error);
            score = 50; // Default score if assessment fails
        }
        
        return Math.min(100, score) / 100; // Normalize to 0-1
    }
    
    /**
     * Generate multiple sprites in batch
     */
    async generateSpriteSet(context, variations, options = {}) {
        console.log(`🎨 Generating sprite set for ${context}: ${variations.length} variations`);
        
        const results = {
            context,
            variations: [],
            successful: 0,
            failed: 0,
            totalTime: 0,
            averageQuality: 0
        };
        
        const startTime = Date.now();
        
        // Process in batches to avoid overwhelming the API
        const batchSize = options.batchSize || this.config.generation.batchSize;
        
        for (let i = 0; i < variations.length; i += batchSize) {
            const batch = variations.slice(i, i + batchSize);
            const batchPromises = batch.map(async (variation, index) => {
                try {
                    const sprite = await this.generateSprite(context, {
                        ...options,
                        ...variation,
                        _batchIndex: i + index
                    });
                    
                    results.variations.push({
                        variation,
                        sprite,
                        success: true
                    });
                    results.successful++;
                    
                    return sprite;
                    
                } catch (error) {
                    console.error(`Failed to generate variation ${i + index}:`, error.message);
                    
                    results.variations.push({
                        variation,
                        error: error.message,
                        success: false
                    });
                    results.failed++;
                    
                    return null;
                }
            });
            
            // Wait for batch to complete
            await Promise.all(batchPromises);
            
            // Small delay between batches
            if (i + batchSize < variations.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        // Calculate results
        results.totalTime = Date.now() - startTime;
        const successfulSprites = results.variations.filter(v => v.success);
        
        if (successfulSprites.length > 0) {
            results.averageQuality = successfulSprites.reduce((sum, v) => 
                sum + v.sprite.qualityScore, 0) / successfulSprites.length;
        }
        
        console.log(`✅ Sprite set complete: ${results.successful}/${variations.length} successful (${results.totalTime}ms)`);
        
        this.emit('sprite_set_generated', results);
        return results;
    }
    
    /**
     * Generate complete mascot sprite library
     */
    async generateMascotLibrary(mascotType = 'grim_reaper_husky', options = {}) {
        console.log(`🎨 Generating complete mascot library: ${mascotType}`);
        
        const mascotConfig = this.config.sprites.categories.mascot[mascotType];
        if (!mascotConfig) {
            throw new Error(`Unknown mascot type: ${mascotType}`);
        }
        
        const variations = [];
        
        // Generate all mode/emotion combinations
        for (const mode of mascotConfig.modes) {
            for (const emotion of mascotConfig.emotions) {
                for (const pose of mascotConfig.poses) {
                    variations.push({
                        mode,
                        emotion,
                        pose,
                        style: options.style || 'pixel_art',
                        resolution: options.resolution || 'standard'
                    });
                }
            }
        }
        
        console.log(`📊 Generating ${variations.length} mascot variations`);
        
        return this.generateSpriteSet(mascotType, variations, {
            ...options,
            batchSize: 2, // Smaller batches for mascot generation
            qualityLevel: 'high'
        });
    }
    
    /**
     * Create sprite sheet from individual sprites
     */
    async createSpriteSheet(sprites, options = {}) {
        console.log(`📋 Creating sprite sheet from ${sprites.length} sprites`);
        
        if (sprites.length === 0) {
            throw new Error('No sprites provided for sprite sheet');
        }
        
        const sheetConfig = {
            columns: options.columns || Math.ceil(Math.sqrt(sprites.length)),
            padding: options.padding || this.config.output.spriteSheets.padding,
            background: options.background || { r: 0, g: 0, b: 0, alpha: 0 },
            format: options.format || 'png'
        };
        
        // Load all sprite images
        const spriteImages = [];
        let maxWidth = 0;
        let maxHeight = 0;
        
        for (const sprite of sprites) {
            const image = sharp(sprite.localPath || sprite.filePath);
            const metadata = await image.metadata();
            
            spriteImages.push({ image, metadata, sprite });
            maxWidth = Math.max(maxWidth, metadata.width);
            maxHeight = Math.max(maxHeight, metadata.height);
        }
        
        // Calculate sheet dimensions
        const rows = Math.ceil(sprites.length / sheetConfig.columns);
        const spriteWidth = maxWidth + sheetConfig.padding * 2;
        const spriteHeight = maxHeight + sheetConfig.padding * 2;
        const sheetWidth = spriteWidth * sheetConfig.columns;
        const sheetHeight = spriteHeight * rows;
        
        // Create sprite sheet
        const sheet = sharp({
            create: {
                width: sheetWidth,
                height: sheetHeight,
                channels: 4,
                background: sheetConfig.background
            }
        });
        
        // Compose sprites onto sheet
        const composite = [];
        
        for (let i = 0; i < spriteImages.length; i++) {
            const row = Math.floor(i / sheetConfig.columns);
            const col = i % sheetConfig.columns;
            
            const x = col * spriteWidth + sheetConfig.padding;
            const y = row * spriteHeight + sheetConfig.padding;
            
            // Resize sprite to fit cell
            const resizedSprite = await spriteImages[i].image
                .resize(maxWidth, maxHeight, { fit: 'contain', background: sheetConfig.background })
                .toBuffer();
            
            composite.push({
                input: resizedSprite,
                left: x,
                top: y
            });
        }
        
        // Generate output
        const timestamp = Date.now();
        const filename = `spritesheet_${timestamp}.${sheetConfig.format}`;
        const outputPath = path.join(this.config.output.spriteSheets.directory, filename);
        
        await sheet.composite(composite).png().toFile(outputPath);
        
        // Create metadata
        const spriteSheet = {
            filePath: outputPath,
            dimensions: { width: sheetWidth, height: sheetHeight },
            spriteCount: sprites.length,
            spriteSize: { width: maxWidth, height: maxHeight },
            layout: { columns: sheetConfig.columns, rows },
            sprites: sprites.map((sprite, i) => ({
                ...sprite,
                sheetPosition: {
                    x: (i % sheetConfig.columns) * spriteWidth + sheetConfig.padding,
                    y: Math.floor(i / sheetConfig.columns) * spriteHeight + sheetConfig.padding
                }
            })),
            created: new Date().toISOString()
        };
        
        console.log(`✅ Sprite sheet created: ${filename} (${sheetWidth}x${sheetHeight})`);
        
        this.emit('sprite_sheet_created', spriteSheet);
        return spriteSheet;
    }
    
    // Helper methods
    
    generateCacheKey(context, config) {
        const keyData = {
            context,
            mode: config.mode,
            emotion: config.emotion,
            style: config.style,
            resolution: config.resolution,
            pose: config.pose,
            accessories: config.accessories?.sort()
        };
        return crypto.createHash('md5').update(JSON.stringify(keyData)).digest('hex');
    }
    
    calculateGenerationCost(model) {
        return this.config.models[model]?.costPerGeneration || 0.05;
    }
    
    updateStats(spriteData, success) {
        this.stats.totalGenerated++;
        
        if (success) {
            this.stats.successful++;
            this.stats.totalCost += spriteData.cost;
            
            // Update average generation time
            this.stats.averageGenerationTime = 
                (this.stats.averageGenerationTime + spriteData.processingTime) / this.stats.successful;
        } else {
            this.stats.failed++;
        }
        
        this.stats.lastGeneration = new Date().toISOString();
    }
    
    async setupDirectories() {
        const dirs = [
            this.config.output.directory,
            this.config.output.spriteSheets.directory,
            ...Object.keys(this.config.sprites.categories).map(cat => 
                path.join(this.config.output.directory, cat)
            )
        ];
        
        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }
    }
    
    async initializeServices() {
        // Services will be initialized on demand
        console.log('  🔧 Services ready for initialization on demand');
    }
    
    async loadSpriteLibrary() {
        try {
            const metadataFile = this.config.cache.metadataFile;
            const data = await fs.readFile(metadataFile, 'utf8');
            const libraryData = JSON.parse(data);
            
            // Restore sprite library with TTL check
            const now = Date.now();
            for (const [key, sprite] of Object.entries(libraryData)) {
                const spriteAge = now - new Date(sprite.generated).getTime();
                if (spriteAge < this.config.cache.ttl) {
                    this.spriteLibrary.set(key, sprite);
                }
            }
            
            console.log(`  📋 Loaded ${this.spriteLibrary.size} cached sprites`);
        } catch (error) {
            console.log('  📋 Starting with empty sprite library');
        }
    }
    
    async saveSpriteLibrary() {
        try {
            const libraryData = Object.fromEntries(this.spriteLibrary.entries());
            await fs.writeFile(this.config.cache.metadataFile, JSON.stringify(libraryData, null, 2));
        } catch (error) {
            console.error('Failed to save sprite library:', error);
        }
    }
    
    scheduleCacheCleanup() {
        setInterval(() => {
            this.cleanupCache();
        }, this.config.cache.cleanupInterval);
    }
    
    cleanupCache() {
        const now = Date.now();
        let cleaned = 0;
        
        for (const [key, sprite] of this.spriteLibrary.entries()) {
            const spriteAge = now - new Date(sprite.generated).getTime();
            if (spriteAge > this.config.cache.ttl) {
                this.spriteLibrary.delete(key);
                cleaned++;
            }
        }
        
        if (cleaned > 0) {
            console.log(`🧹 Cleaned up ${cleaned} expired sprites`);
        }
    }
    
    /**
     * Get generation statistics
     */
    getStats() {
        return {
            ...this.stats,
            librarySize: this.spriteLibrary.size,
            averageCostPerSprite: this.stats.successful > 0 ? this.stats.totalCost / this.stats.successful : 0,
            successRate: this.stats.totalGenerated > 0 ? this.stats.successful / this.stats.totalGenerated : 0
        };
    }
    
    /**
     * Quick API methods for mascot generation
     */
    async generateGrimReaperSprite(mode = 'reaper', emotion = 'wise') {
        return this.generateSprite('grim_reaper_husky', {
            mode,
            emotion,
            style: 'pixel_art',
            resolution: 'standard'
        });
    }
    
    async generateAnchorSprite(style = 'nautical') {
        return this.generateSprite('anchor_nautical', {
            mode: 'professional',
            style,
            resolution: 'standard'
        });
    }
    
    async generateHuskyExpressionSet(mode = 'playful') {
        const emotions = ['happy', 'excited', 'curious', 'alert', 'sleepy'];
        return this.generateSpriteSet('husky_character', 
            emotions.map(emotion => ({ mode, emotion }))
        );
    }
    
    /**
     * Get sprite from library
     */
    getSprite(context, config) {
        const cacheKey = this.generateCacheKey(context, config);
        return this.spriteLibrary.get(cacheKey);
    }
    
    /**
     * List available sprites
     */
    listSprites(filter = {}) {
        const sprites = Array.from(this.spriteLibrary.values());
        
        if (filter.context) {
            return sprites.filter(s => s.context.includes(filter.context));
        }
        
        if (filter.mode) {
            return sprites.filter(s => s.config.mode === filter.mode);
        }
        
        return sprites;
    }
}

module.exports = VisualSpriteGenerator;

// Example usage for testing
if (require.main === module) {
    console.log('🎨 Testing Visual Sprite Generator...');
    
    const generator = new VisualSpriteGenerator();
    
    generator.once('ready', async () => {
        console.log('\n🧪 Testing grim reaper sprite generation...');
        
        try {
            const grimReaperSprite = await generator.generateGrimReaperSprite('reaper', 'wise');
            console.log('Sprite generated:', grimReaperSprite.localPath);
            console.log('Quality score:', grimReaperSprite.qualityScore);
            
            console.log('\n🧪 Testing sprite set generation...');
            const huskySet = await generator.generateHuskyExpressionSet('playful');
            console.log(`Generated ${huskySet.successful}/${huskySet.variations.length} husky expressions`);
            
            console.log('\n📊 Generation statistics:');
            console.log(generator.getStats());
            
        } catch (error) {
            console.error('❌ Test failed:', error);
        }
    });
}