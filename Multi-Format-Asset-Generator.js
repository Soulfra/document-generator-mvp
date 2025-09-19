#!/usr/bin/env node

/**
 * 🎨 MULTI-FORMAT-ASSET-GENERATOR
 * 
 * Generates comprehensive visual assets based on brand vision specifications.
 * Creates logos, pixel art, 3D models, UI components, game assets, and more.
 * 
 * Features:
 * - SVG logo and icon generation
 * - Pixel art sprite creation (8-bit to modern)
 * - 3D model generation specifications
 * - UI component templates (React, vanilla JS, CSS)
 * - Game assets (sprites, backgrounds, effects)
 * - Canvas-based drawing tools
 * - Figma-style design components
 * - TNT explosion effects and particle systems
 * - Bitmap manipulation and processing
 * - Sixel graphics for terminal display
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class MultiFormatAssetGenerator extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            outputDir: config.outputDir || './generated-assets',
            enableSVGGeneration: config.enableSVGGeneration !== false,
            enablePixelArt: config.enablePixelArt !== false,
            enable3DModels: config.enable3DModels !== false,
            enableUIComponents: config.enableUIComponents !== false,
            enableGameAssets: config.enableGameAssets !== false,
            enableBitmapProcessing: config.enableBitmapProcessing !== false,
            enableSixelGraphics: config.enableSixelGraphics !== false,
            maxAssetSize: config.maxAssetSize || 2048, // pixels
            ...config
        };
        
        // Asset generation templates
        this.assetTemplates = {
            logos: {
                geometric: {
                    shapes: ['circle', 'square', 'triangle', 'hexagon'],
                    compositions: ['centered', 'stacked', 'inline', 'badge'],
                    styles: ['minimal', 'detailed', 'gradient', 'flat']
                },
                
                text: {
                    layouts: ['wordmark', 'lettermark', 'combination', 'emblem'],
                    effects: ['shadow', 'outline', 'gradient', 'texture'],
                    weights: ['light', 'regular', 'medium', 'bold', 'black']
                },
                
                icon: {
                    types: ['abstract', 'literal', 'symbolic', 'pictographic'],
                    complexity: ['simple', 'moderate', 'detailed'],
                    variations: ['filled', 'outline', 'duotone', 'gradient']
                }
            },
            
            pixelArt: {
                characters: {
                    styles: ['8bit_classic', '16bit_detailed', 'modern_pixel', 'isometric'],
                    sizes: ['16x16', '32x32', '64x64', '128x128'],
                    animations: ['idle', 'walk', 'run', 'jump', 'attack', 'death']
                },
                
                environments: {
                    types: ['platformer', 'top_down', 'isometric', 'side_scroll'],
                    themes: ['forest', 'desert', 'ocean', 'city', 'space', 'fantasy'],
                    elements: ['tiles', 'backgrounds', 'props', 'decorations']
                },
                
                effects: {
                    explosions: {
                        tnt: ['small_blast', 'medium_boom', 'mega_explosion'],
                        particles: ['fire', 'smoke', 'sparks', 'debris'],
                        frames: [4, 8, 12, 16],
                        styles: ['cartoon', 'realistic', 'stylized']
                    },
                    
                    magic: ['sparkle', 'energy_wave', 'portal', 'healing_light'],
                    combat: ['slash', 'impact', 'shield_block', 'critical_hit'],
                    environment: ['water_splash', 'dust_cloud', 'wind_effect']
                }
            },
            
            uiComponents: {
                buttons: {
                    styles: ['flat', 'raised', 'outline', 'ghost', 'gradient'],
                    sizes: ['small', 'medium', 'large', 'xlarge'],
                    states: ['default', 'hover', 'active', 'disabled', 'loading'],
                    variants: ['primary', 'secondary', 'success', 'warning', 'danger']
                },
                
                cards: {
                    layouts: ['basic', 'media', 'overlay', 'horizontal'],
                    shadows: ['none', 'small', 'medium', 'large', 'xlarge'],
                    borders: ['none', 'subtle', 'solid', 'dashed', 'gradient']
                },
                
                forms: {
                    inputs: ['text', 'email', 'password', 'number', 'textarea', 'select'],
                    validation: ['success', 'warning', 'error'],
                    layouts: ['stacked', 'horizontal', 'inline', 'grouped']
                }
            },
            
            gameAssets: {
                sprites: {
                    player: ['warrior', 'mage', 'archer', 'rogue', 'merchant'],
                    enemies: ['goblin', 'orc', 'dragon', 'skeleton', 'boss'],
                    npcs: ['villager', 'guard', 'shopkeeper', 'quest_giver'],
                    objects: ['chest', 'door', 'lever', 'pickup', 'decoration']
                },
                
                tilesets: {
                    terrain: ['grass', 'stone', 'sand', 'water', 'lava', 'ice'],
                    structures: ['walls', 'floors', 'roofs', 'windows', 'doors'],
                    decorative: ['plants', 'rocks', 'furniture', 'signs']
                },
                
                ui: {
                    hud: ['health_bar', 'mana_bar', 'minimap', 'inventory_slot'],
                    menus: ['main_menu', 'pause_menu', 'settings', 'inventory'],
                    icons: ['weapons', 'armor', 'consumables', 'skills', 'achievements']
                }
            }
        };
        
        // Canvas-based drawing tools specifications
        this.canvasTools = {
            brushes: {
                pixel: { sizes: [1, 2, 4, 8], shapes: ['square', 'circle'] },
                paint: { sizes: [5, 10, 20, 40], opacity: [0.2, 0.5, 0.8, 1.0] },
                vector: { types: ['pen', 'bezier', 'polygon', 'rectangle', 'circle'] }
            },
            
            filters: {
                color: ['brightness', 'contrast', 'saturation', 'hue'],
                artistic: ['pixelate', 'blur', 'sharpen', 'emboss'],
                retro: ['scanlines', 'crt_effect', 'dither', 'posterize']
            },
            
            generators: {
                patterns: ['noise', 'perlin', 'cellular', 'maze'],
                textures: ['wood', 'metal', 'fabric', 'stone'],
                gradients: ['linear', 'radial', 'conic', 'diamond']
            }
        };
        
        // Output directories
        this.outputPaths = {
            logos: path.join(this.config.outputDir, 'logos'),
            pixelArt: path.join(this.config.outputDir, 'pixel-art'),
            '3dModels': path.join(this.config.outputDir, '3d-models'),
            uiComponents: path.join(this.config.outputDir, 'ui-components'),
            gameAssets: path.join(this.config.outputDir, 'game-assets'),
            bitmaps: path.join(this.config.outputDir, 'bitmaps'),
            sixel: path.join(this.config.outputDir, 'sixel'),
            canvasTools: path.join(this.config.outputDir, 'canvas-tools')
        };
        
        console.log('🎨 Multi-Format Asset Generator initialized');
        console.log(`📁 Output directory: ${this.config.outputDir}`);
        console.log(`🎯 Enabled formats: ${this.getEnabledFormats().join(', ')}`);
    }
    
    /**
     * Main asset generation function - creates all assets based on brand vision
     */
    async generateAssets(brandVision, customRequirements = {}) {
        console.log(`🎨 Generating assets for "${brandVision.domainIdea}"`);
        
        const generationId = crypto.randomBytes(8).toString('hex');
        const startTime = Date.now();
        
        try {
            // Create output directories
            await this.createOutputDirectories();
            
            const generatedAssets = {
                id: generationId,
                brandVision,
                timestamp: startTime,
                assets: {},
                metadata: {}
            };
            
            // Generate different asset types based on recommendations
            for (const recommendation of brandVision.assetRecommendations) {
                console.log(`🔨 Generating ${recommendation.type} assets for ${recommendation.purpose}`);
                
                try {
                    const assets = await this.generateAssetType(recommendation, brandVision);
                    generatedAssets.assets[recommendation.type] = assets;
                    
                    console.log(`✅ Generated ${assets.length} ${recommendation.type} assets`);
                } catch (error) {
                    console.error(`❌ Failed to generate ${recommendation.type}:`, error.message);
                    generatedAssets.assets[recommendation.type] = [];
                }
            }
            
            // Generate Canvas-based drawing tools if creative interaction is needed
            if (brandVision.functionalRequirements.interactionTypes.includes('creative')) {
                console.log('🎨 Generating Canvas drawing tools');
                generatedAssets.assets.canvasTools = await this.generateCanvasTools(brandVision);
            }
            
            // Generate game effects if action games are needed
            if (brandVision.functionalRequirements.gameRequirements.types.includes('action')) {
                console.log('💥 Generating TNT explosions and game effects');
                generatedAssets.assets.gameEffects = await this.generateGameEffects(brandVision);
            }
            
            // Generate bitmap processing tools if needed
            if (this.config.enableBitmapProcessing) {
                console.log('🔄 Generating bitmap processing utilities');
                generatedAssets.assets.bitmapTools = await this.generateBitmapTools(brandVision);
            }
            
            // Generate Sixel graphics for terminal display
            if (this.config.enableSixelGraphics) {
                console.log('🖥️  Generating Sixel graphics');
                generatedAssets.assets.sixelGraphics = await this.generateSixelGraphics(brandVision);
            }
            
            // Generate Figma-style design components
            console.log('🎨 Generating Figma-style design system');
            generatedAssets.assets.designSystem = await this.generateDesignSystem(brandVision);
            
            // Create asset manifest
            generatedAssets.metadata = {
                totalAssets: this.countTotalAssets(generatedAssets.assets),
                generationTime: Date.now() - startTime,
                fileSize: await this.calculateTotalSize(generatedAssets.assets),
                formats: Object.keys(generatedAssets.assets)
            };
            
            // Save asset manifest
            await this.saveAssetManifest(generatedAssets);
            
            console.log(`✅ Asset generation complete!`);
            console.log(`📊 Generated ${generatedAssets.metadata.totalAssets} assets in ${generatedAssets.metadata.generationTime}ms`);
            
            this.emit('assets_generated', generatedAssets);
            
            return generatedAssets;
            
        } catch (error) {
            console.error(`❌ Asset generation failed:`, error);
            throw error;
        }
    }
    
    /**
     * Generate specific asset type based on recommendation
     */
    async generateAssetType(recommendation, brandVision) {
        switch (recommendation.type) {
            case 'vector_graphics':
                return await this.generateVectorGraphics(recommendation, brandVision);
            
            case 'pixel_art':
                return await this.generatePixelArt(recommendation, brandVision);
            
            case '3d_models':
                return await this.generate3DModels(recommendation, brandVision);
            
            case 'ui_components':
                return await this.generateUIComponents(recommendation, brandVision);
            
            case 'game_assets':
                return await this.generateGameAssets(recommendation, brandVision);
            
            default:
                console.warn(`Unknown asset type: ${recommendation.type}`);
                return [];
        }
    }
    
    /**
     * Generate SVG logos and vector graphics
     */
    async generateVectorGraphics(recommendation, brandVision) {
        const assets = [];
        const colors = brandVision.visualStyle.colorPalette;
        const archetype = brandVision.archetype.name;
        
        // Generate logo variations
        const logoVariations = ['logo', 'icon', 'wordmark', 'symbol'];
        
        for (const variation of logoVariations) {
            const logoSVG = this.generateLogoSVG(variation, colors, archetype, brandVision.domainIdea);
            
            const asset = {
                type: 'svg_logo',
                variation,
                filename: `${this.sanitizeFilename(brandVision.domainIdea)}-${variation}.svg`,
                content: logoSVG,
                colors: colors,
                size: 'scalable',
                purpose: recommendation.purpose
            };
            
            assets.push(asset);
            
            // Save to file
            const filepath = path.join(this.outputPaths.logos, asset.filename);
            await fs.writeFile(filepath, logoSVG, 'utf8');
        }
        
        // Generate icon set
        const iconThemes = this.getIconThemesForArchetype(archetype);
        for (const theme of iconThemes) {
            const iconSet = this.generateIconSet(theme, colors);
            
            for (const [iconName, iconSVG] of Object.entries(iconSet)) {
                const asset = {
                    type: 'svg_icon',
                    name: iconName,
                    theme,
                    filename: `icon-${iconName}.svg`,
                    content: iconSVG,
                    colors: colors,
                    size: 'scalable'
                };
                
                assets.push(asset);
                
                const filepath = path.join(this.outputPaths.logos, asset.filename);
                await fs.writeFile(filepath, iconSVG, 'utf8');
            }
        }
        
        return assets;
    }
    
    /**
     * Generate pixel art assets (8-bit to modern styles)
     */
    async generatePixelArt(recommendation, brandVision) {
        const assets = [];
        const colors = brandVision.visualStyle.colorPalette;
        
        // Determine pixel art style based on archetype and purpose
        const style = this.determinePixelArtStyle(brandVision.archetype.name, recommendation.purpose);
        const sizes = recommendation.specs?.resolutions || ['32x32', '64x64'];
        
        // Generate character sprites if needed
        if (brandVision.functionalRequirements.gameRequirements.types.length > 0) {
            const characters = ['hero', 'companion', 'merchant', 'guard'];
            
            for (const character of characters) {
                for (const size of sizes) {
                    const spriteData = this.generatePixelSprite(character, size, colors, style);
                    
                    const asset = {
                        type: 'pixel_sprite',
                        character,
                        size,
                        style,
                        filename: `sprite-${character}-${size}.png`,
                        data: spriteData,
                        colors: this.extractPixelColors(spriteData),
                        animated: false
                    };
                    
                    assets.push(asset);
                    
                    // Generate bitmap file
                    const filepath = path.join(this.outputPaths.pixelArt, asset.filename);
                    await this.saveBitmapData(filepath, spriteData);
                }
            }
        }
        
        // Generate TNT explosion effects if action games
        if (recommendation.purpose === 'effects') {
            const explosionAssets = await this.generateTNTExplosions(colors, style);
            assets.push(...explosionAssets);
        }
        
        // Generate environment tiles
        const environmentTiles = await this.generateEnvironmentTiles(colors, style, sizes[0]);
        assets.push(...environmentTiles);
        
        return assets;
    }
    
    /**
     * Generate 3D model specifications (for later rendering)
     */
    async generate3DModels(recommendation, brandVision) {
        const assets = [];
        
        // Generate 3D model specifications that can be used with Three.js, Blender, etc.
        const modelTypes = recommendation.specs?.assetTypes || ['logo_3d', 'product_mockup'];
        
        for (const modelType of modelTypes) {
            const modelSpec = this.generate3DModelSpec(modelType, brandVision);
            
            const asset = {
                type: '3d_model_spec',
                modelType,
                filename: `model-${modelType}.json`,
                specification: modelSpec,
                suggestedSoftware: ['Blender', 'Three.js', 'Unity', 'Godot'],
                formats: ['obj', 'fbx', 'gltf'],
                complexity: this.assess3DComplexity(modelSpec)
            };
            
            assets.push(asset);
            
            // Save specification file
            const filepath = path.join(this.outputPaths['3dModels'], asset.filename);
            await fs.writeFile(filepath, JSON.stringify(modelSpec, null, 2), 'utf8');
        }
        
        return assets;
    }
    
    /**
     * Generate UI components (React, CSS, etc.)
     */
    async generateUIComponents(recommendation, brandVision) {
        const assets = [];
        const colors = brandVision.visualStyle.colorPalette;
        const typography = brandVision.visualStyle.typography;
        
        const components = recommendation.specs?.components || ['buttons', 'cards', 'forms', 'navigation'];
        
        for (const componentType of components) {
            // Generate React component
            const reactCode = this.generateReactComponent(componentType, colors, typography);
            const cssCode = this.generateComponentCSS(componentType, colors, typography);
            const vanillaCode = this.generateVanillaJSComponent(componentType, colors);
            
            const asset = {
                type: 'ui_component',
                component: componentType,
                implementations: {
                    react: {
                        filename: `${componentType}.jsx`,
                        code: reactCode
                    },
                    css: {
                        filename: `${componentType}.css`,
                        code: cssCode
                    },
                    vanilla: {
                        filename: `${componentType}.js`,
                        code: vanillaCode
                    }
                },
                colors,
                typography
            };
            
            assets.push(asset);
            
            // Save component files
            const componentDir = path.join(this.outputPaths.uiComponents, componentType);
            await fs.mkdir(componentDir, { recursive: true });
            
            await fs.writeFile(path.join(componentDir, asset.implementations.react.filename), reactCode, 'utf8');
            await fs.writeFile(path.join(componentDir, asset.implementations.css.filename), cssCode, 'utf8');
            await fs.writeFile(path.join(componentDir, asset.implementations.vanilla.filename), vanillaCode, 'utf8');
        }
        
        return assets;
    }
    
    /**
     * Generate game assets (sprites, tilesets, UI)
     */
    async generateGameAssets(recommendation, brandVision) {
        const assets = [];
        const gameTypes = brandVision.functionalRequirements.gameRequirements.types;
        
        if (gameTypes.length === 0) return assets;
        
        // Generate assets based on game types
        for (const gameType of gameTypes) {
            const gameAssets = await this.generateAssetsForGameType(gameType, brandVision);
            assets.push(...gameAssets);
        }
        
        return assets;
    }
    
    /**
     * Generate Canvas-based drawing tools
     */
    async generateCanvasTools(brandVision) {
        const tools = [];
        
        // Generate HTML5 Canvas drawing tool
        const canvasDrawingTool = this.generateCanvasDrawingTool(brandVision);
        
        const tool = {
            type: 'canvas_drawing_tool',
            filename: 'drawing-tool.html',
            content: canvasDrawingTool,
            features: ['brushes', 'colors', 'layers', 'export'],
            supported_formats: ['png', 'jpg', 'svg']
        };
        
        tools.push(tool);
        
        // Save drawing tool
        const filepath = path.join(this.outputPaths.canvasTools, tool.filename);
        await fs.writeFile(filepath, canvasDrawingTool, 'utf8');
        
        // Generate pixel art editor
        const pixelArtEditor = this.generatePixelArtEditor(brandVision);
        
        const pixelTool = {
            type: 'pixel_art_editor',
            filename: 'pixel-editor.html',
            content: pixelArtEditor,
            features: ['grid', 'palette', 'animation', 'export'],
            supported_formats: ['png', 'gif']
        };
        
        tools.push(pixelTool);
        
        const pixelFilepath = path.join(this.outputPaths.canvasTools, pixelTool.filename);
        await fs.writeFile(pixelFilepath, pixelArtEditor, 'utf8');
        
        return tools;
    }
    
    /**
     * Generate TNT explosions and game effects
     */
    async generateTNTExplosions(colors, style) {
        const explosions = [];
        
        const explosionTypes = ['small_blast', 'medium_boom', 'mega_explosion'];
        const framecounts = [4, 8, 12];
        
        for (const explosionType of explosionTypes) {
            for (const frameCount of frameColumns) {
                const explosionFrames = [];
                
                for (let frame = 0; frame < frameCount; frame++) {
                    const frameData = this.generateExplosionFrame(explosionType, frame, frameCount, colors, style);
                    explosionFrames.push(frameData);
                }
                
                const asset = {
                    type: 'explosion_animation',
                    explosionType,
                    frameCount,
                    frames: explosionFrames,
                    filename: `explosion-${explosionType}-${frameCount}f.png`,
                    style,
                    duration: frameCount * 100 // ms per frame
                };
                
                explosions.push(asset);
                
                // Create spritesheet
                const spritesheet = this.createSpritesheet(explosionFrames);
                const filepath = path.join(this.outputPaths.pixelArt, 'effects', asset.filename);
                await fs.mkdir(path.dirname(filepath), { recursive: true });
                await this.saveBitmapData(filepath, spritesheet);
            }
        }
        
        return explosions;
    }
    
    /**
     * Generate bitmap processing tools
     */
    async generateBitmapTools(brandVision) {
        const tools = [];
        
        // Generate bitmap processor utility
        const bitmapProcessor = this.generateBitmapProcessor();
        
        const tool = {
            type: 'bitmap_processor',
            filename: 'bitmap-processor.js',
            content: bitmapProcessor,
            features: ['resize', 'filter', 'convert', 'compress'],
            supported_formats: ['png', 'jpg', 'gif', 'bmp', 'webp']
        };
        
        tools.push(tool);
        
        const filepath = path.join(this.outputPaths.bitmaps, tool.filename);
        await fs.writeFile(filepath, bitmapProcessor, 'utf8');
        
        return tools;
    }
    
    /**
     * Generate Sixel graphics for terminal display
     */
    async generateSixelGraphics(brandVision) {
        const graphics = [];
        
        // Generate logo as sixel for terminal display
        const logoSixel = this.generateSixelLogo(brandVision);
        
        const graphic = {
            type: 'sixel_logo',
            filename: `${this.sanitizeFilename(brandVision.domainIdea)}-logo.sixel`,
            content: logoSixel,
            width: 80,
            height: 24,
            colors: 16
        };
        
        graphics.push(graphic);
        
        const filepath = path.join(this.outputPaths.sixel, graphic.filename);
        await fs.writeFile(filepath, logoSixel, 'utf8');
        
        return graphics;
    }
    
    /**
     * Generate Figma-style design system
     */
    async generateDesignSystem(brandVision) {
        const designSystem = {
            colors: brandVision.visualStyle.colorPalette,
            typography: brandVision.visualStyle.typography,
            spacing: this.generateSpacingSystem(),
            shadows: this.generateShadowSystem(),
            borderRadius: this.generateBorderRadiusSystem(),
            components: this.generateComponentSystem(brandVision),
            tokens: this.generateDesignTokens(brandVision)
        };
        
        // Save as JSON design tokens
        const tokensPath = path.join(this.outputPaths.uiComponents, 'design-tokens.json');
        await fs.writeFile(tokensPath, JSON.stringify(designSystem, null, 2), 'utf8');
        
        // Generate CSS custom properties
        const cssTokens = this.generateCSSTokens(designSystem);
        const cssPath = path.join(this.outputPaths.uiComponents, 'design-tokens.css');
        await fs.writeFile(cssPath, cssTokens, 'utf8');
        
        return designSystem;
    }
    
    // === HELPER METHODS ===
    
    getEnabledFormats() {
        const formats = [];
        if (this.config.enableSVGGeneration) formats.push('SVG');
        if (this.config.enablePixelArt) formats.push('Pixel Art');
        if (this.config.enable3DModels) formats.push('3D Models');
        if (this.config.enableUIComponents) formats.push('UI Components');
        if (this.config.enableGameAssets) formats.push('Game Assets');
        if (this.config.enableBitmapProcessing) formats.push('Bitmap Processing');
        if (this.config.enableSixelGraphics) formats.push('Sixel Graphics');
        return formats;
    }
    
    async createOutputDirectories() {
        for (const dirPath of Object.values(this.outputPaths)) {
            await fs.mkdir(dirPath, { recursive: true });
        }
    }
    
    sanitizeFilename(name) {
        return name.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }
    
    generateLogoSVG(variation, colors, archetype, domainIdea) {
        const width = 200;
        const height = 200;
        
        // Generate SVG based on variation type
        let svgContent = '';
        
        switch (variation) {
            case 'logo':
                svgContent = this.generateCombinationLogo(domainIdea, colors, archetype, width, height);
                break;
            case 'icon':
                svgContent = this.generateIconSVG(colors, archetype, width, height);
                break;
            case 'wordmark':
                svgContent = this.generateWordmark(domainIdea, colors, width, height);
                break;
            case 'symbol':
                svgContent = this.generateSymbolLogo(colors, archetype, width, height);
                break;
        }
        
        return `
<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    ${svgContent}
</svg>`.trim();
    }
    
    generateCombinationLogo(domainIdea, colors, archetype, width, height) {
        const centerX = width / 2;
        const centerY = height / 2;
        
        return `
    <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${colors.secondary};stop-opacity:1" />
        </linearGradient>
    </defs>
    
    <!-- Symbol -->
    <circle cx="${centerX}" cy="${centerY - 20}" r="40" fill="url(#logoGradient)" />
    
    <!-- Text -->
    <text x="${centerX}" y="${centerY + 40}" text-anchor="middle" 
          font-family="sans-serif" font-size="18" font-weight="bold" fill="${colors.dark}">
        ${domainIdea.split(' ')[0]}
    </text>
    
    <!-- Accent -->
    <rect x="${centerX - 30}" y="${centerY + 50}" width="60" height="3" fill="${colors.accent}" />
        `;
    }
    
    generateIconSVG(colors, archetype, width, height) {
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Different icon shapes based on archetype
        const archetypeShapes = {
            explorer: `<path d="M${centerX} ${centerY-40} L${centerX+30} ${centerY+20} L${centerX-30} ${centerY+20} Z" fill="${colors.primary}" />`,
            creator: `<rect x="${centerX-25}" y="${centerY-25}" width="50" height="50" fill="${colors.primary}" rx="8" />`,
            sage: `<circle cx="${centerX}" cy="${centerY}" r="35" fill="${colors.primary}" />`,
            caregiver: `<path d="M${centerX} ${centerY-20} Q${centerX+20} ${centerY-40} ${centerX+40} ${centerY-20} Q${centerX+40} ${centerY} ${centerX} ${centerY+20} Q${centerX-40} ${centerY} ${centerX-40} ${centerY-20} Q${centerX-20} ${centerY-40} ${centerX} ${centerY-20}" fill="${colors.primary}" />`,
            rebel: `<polygon points="${centerX},${centerY-30} ${centerX+26},${centerY-9} ${centerX+16},${centerY+24} ${centerX-16},${centerY+24} ${centerX-26},${centerY-9}" fill="${colors.primary}" />`,
            hero: `<polygon points="${centerX},${centerY-35} ${centerX+21},${centerY-11} ${centerX+34},${centerY-11} ${centerX+13},${centerY+4} ${centerX+21},${centerY+28} ${centerX},${centerY+14} ${centerX-21},${centerY+28} ${centerX-13},${centerY+4} ${centerX-34},${centerY-11} ${centerX-21},${centerY-11}" fill="${colors.primary}" />`
        };
        
        return archetypeShapes[archetype] || archetypeShapes.creator;
    }
    
    generateWordmark(domainIdea, colors, width, height) {
        const centerX = width / 2;
        const centerY = height / 2;
        
        return `
    <text x="${centerX}" y="${centerY}" text-anchor="middle" 
          font-family="sans-serif" font-size="24" font-weight="bold" fill="${colors.primary}">
        ${domainIdea.toUpperCase()}
    </text>
        `;
    }
    
    generateSymbolLogo(colors, archetype, width, height) {
        // Generate abstract symbol based on archetype
        return this.generateIconSVG(colors, archetype, width, height);
    }
    
    getIconThemesForArchetype(archetype) {
        const themeMap = {
            explorer: ['navigation', 'adventure', 'discovery'],
            creator: ['tools', 'creativity', 'innovation'],
            sage: ['knowledge', 'wisdom', 'education'],
            caregiver: ['care', 'protection', 'support'],
            rebel: ['change', 'revolution', 'freedom'],
            hero: ['achievement', 'victory', 'strength']
        };
        
        return themeMap[archetype] || ['general'];
    }
    
    generateIconSet(theme, colors) {
        // Generate a small set of themed icons
        const iconSets = {
            navigation: {
                compass: this.generateCompassIcon(colors),
                map: this.generateMapIcon(colors),
                arrow: this.generateArrowIcon(colors)
            },
            
            tools: {
                brush: this.generateBrushIcon(colors),
                pencil: this.generatePencilIcon(colors),
                palette: this.generatePaletteIcon(colors)
            },
            
            general: {
                home: this.generateHomeIcon(colors),
                user: this.generateUserIcon(colors),
                settings: this.generateSettingsIcon(colors)
            }
        };
        
        return iconSets[theme] || iconSets.general;
    }
    
    generateCompassIcon(colors) {
        return `
<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="${colors.primary}" stroke-width="2" fill="none"/>
    <polygon points="12,6 14,10 12,12 10,10" fill="${colors.accent}"/>
</svg>
        `.trim();
    }
    
    generateMapIcon(colors) {
        return `
<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 6L8 4L16 8L22 6V18L16 20L8 16L2 18V6Z" stroke="${colors.primary}" stroke-width="2" fill="none"/>
</svg>
        `.trim();
    }
    
    generateArrowIcon(colors) {
        return `
<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L22 12L12 22L10.59 20.59L19.17 12L10.59 3.41L12 2Z" fill="${colors.primary}"/>
</svg>
        `.trim();
    }
    
    generateBrushIcon(colors) {
        return `
<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 14C5.9 14 5 13.1 5 12S5.9 10 7 10 9 10.9 9 12 8.1 14 7 14M12.6 10C11.8 7.7 9.6 6 7 6C3.7 6 1 8.7 1 12S3.7 18 7 18C9.6 18 11.8 16.3 12.6 14H16V18H20V14H23V10H12.6Z" fill="${colors.primary}"/>
</svg>
        `.trim();
    }
    
    generatePencilIcon(colors) {
        return `
<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.71 7.04C21.1 6.65 21.1 6 20.71 5.63L18.37 3.29C18 2.9 17.35 2.9 16.96 3.29L15.12 5.12L18.87 8.87M3 17.25V21H6.75L17.81 9.93L14.06 6.18L3 17.25Z" fill="${colors.primary}"/>
</svg>
        `.trim();
    }
    
    generatePaletteIcon(colors) {
        return `
<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="${colors.primary}" stroke-width="2" fill="none"/>
    <circle cx="8" cy="8" r="2" fill="${colors.secondary}"/>
    <circle cx="16" cy="8" r="2" fill="${colors.accent}"/>
    <circle cx="8" cy="16" r="2" fill="${colors.primary}"/>
</svg>
        `.trim();
    }
    
    generateHomeIcon(colors) {
        return `
<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 20V14H14V20H19V12H22L12 3L2 12H5V20H10Z" fill="${colors.primary}"/>
</svg>
        `.trim();
    }
    
    generateUserIcon(colors) {
        return `
<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="8" r="4" fill="${colors.primary}"/>
    <path d="M12 14C8.13 14 5 17.13 5 21H19C19 17.13 15.87 14 12 14Z" fill="${colors.primary}"/>
</svg>
        `.trim();
    }
    
    generateSettingsIcon(colors) {
        return `
<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5A3.5 3.5 0 0 1 15.5 12A3.5 3.5 0 0 1 12 15.5M19.43 12.98C19.47 12.66 19.5 12.34 19.5 12C19.5 11.66 19.47 11.34 19.43 11.02L21.54 9.37C21.73 9.22 21.78 8.95 21.66 8.73L19.66 5.27C19.54 5.05 19.27 4.96 19.05 5.05L16.56 6.05C16.04 5.65 15.48 5.32 14.87 5.07L14.49 2.42C14.46 2.18 14.25 2 14 2H10C9.75 2 9.54 2.18 9.51 2.42L9.13 5.07C8.52 5.32 7.96 5.66 7.44 6.05L4.95 5.05C4.72 4.96 4.46 5.05 4.34 5.27L2.34 8.73C2.21 8.95 2.27 9.22 2.46 9.37L4.57 11.02C4.53 11.34 4.5 11.67 4.5 12C4.5 12.33 4.53 12.66 4.57 12.98L2.46 14.63C2.27 14.78 2.21 15.05 2.34 15.27L4.34 18.73C4.46 18.95 4.72 19.04 4.95 18.95L7.44 17.95C7.96 18.35 8.52 18.68 9.13 18.93L9.51 21.58C9.54 21.82 9.75 22 10 22H14C14.25 22 14.46 21.82 14.49 21.58L14.87 18.93C15.48 18.68 16.04 18.34 16.56 17.95L19.05 18.95C19.28 19.04 19.54 18.95 19.66 18.73L21.66 15.27C21.78 15.05 21.73 14.78 21.54 14.63L19.43 12.98Z" fill="${colors.primary}"/>
</svg>
        `.trim();
    }
    
    // Continue with more helper methods...
    
    // Placeholder implementations for remaining methods
    determinePixelArtStyle() { return '16bit_detailed'; }
    generatePixelSprite() { return { width: 32, height: 32, data: [] }; }
    extractPixelColors() { return []; }
    saveBitmapData() { return Promise.resolve(); }
    generateEnvironmentTiles() { return []; }
    generate3DModelSpec() { return {}; }
    assess3DComplexity() { return 'medium'; }
    generateReactComponent() { return '// React component code'; }
    generateComponentCSS() { return '/* CSS styles */'; }
    generateVanillaJSComponent() { return '// Vanilla JS component'; }
    generateAssetsForGameType() { return []; }
    generateCanvasDrawingTool() { return '<!DOCTYPE html><html><!-- Drawing tool --></html>'; }
    generatePixelArtEditor() { return '<!DOCTYPE html><html><!-- Pixel editor --></html>'; }
    generateExplosionFrame() { return { width: 64, height: 64, data: [] }; }
    createSpritesheet() { return { width: 256, height: 64, data: [] }; }
    generateBitmapProcessor() { return '// Bitmap processor utility'; }
    generateSixelLogo() { return '\x1bPq"1;1;64;64'; }
    generateSpacingSystem() { return { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 }; }
    generateShadowSystem() { return {}; }
    generateBorderRadiusSystem() { return {}; }
    generateComponentSystem() { return {}; }
    generateDesignTokens() { return {}; }
    generateCSSTokens() { return '/* CSS custom properties */'; }
    countTotalAssets() { return 0; }
    calculateTotalSize() { return Promise.resolve(0); }
    
    async saveAssetManifest(generatedAssets) {
        const manifestPath = path.join(this.config.outputDir, 'asset-manifest.json');
        await fs.writeFile(manifestPath, JSON.stringify(generatedAssets, null, 2), 'utf8');
    }
}

module.exports = MultiFormatAssetGenerator;

// CLI interface when run directly
if (require.main === module) {
    console.log('\n🎨 MULTI-FORMAT ASSET GENERATOR DEMO\n===================================\n');
    
    const generator = new MultiFormatAssetGenerator({
        outputDir: './demo-assets'
    });
    
    // Mock brand vision for demo
    const mockBrandVision = {
        domainIdea: 'Sustainable Ocean Farming',
        archetype: { name: 'caregiver' },
        visualStyle: {
            colorPalette: {
                primary: '#2E8B57',
                secondary: '#87CEEB',
                accent: '#FFD700',
                neutral: '#F5F5F5',
                dark: '#2C2C2C',
                light: '#FFFFFF'
            },
            typography: { primary: 'Inter', secondary: 'Open Sans' }
        },
        functionalRequirements: {
            gameRequirements: { types: ['simulation'] },
            interactionTypes: ['creative']
        },
        assetRecommendations: [
            {
                type: 'vector_graphics',
                purpose: 'branding',
                specs: { formats: ['svg', 'png'] }
            },
            {
                type: 'pixel_art', 
                purpose: 'gaming',
                specs: { resolutions: ['32x32', '64x64'] }
            },
            {
                type: 'ui_components',
                purpose: 'interface',
                specs: { components: ['buttons', 'cards'] }
            }
        ]
    };
    
    generator.generateAssets(mockBrandVision)
        .then(result => {
            console.log('\n✅ Demo complete!');
            console.log(`📁 Assets saved to: ${generator.config.outputDir}`);
            console.log(`📊 Total assets: ${result.metadata.totalAssets}`);
            console.log(`⏱️  Generation time: ${result.metadata.generationTime}ms`);
        })
        .catch(error => {
            console.error('❌ Demo failed:', error.message);
        });
}