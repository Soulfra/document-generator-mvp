/**
 * 🏴‍☠️ ShipRekt Component Generator
 * 
 * Creates modular ship components for the pirate crafting system.
 * Generates visual representations using ASCII art and voxel data
 * that can be rendered in-game.
 * 
 * Components:
 * - Hulls (small, medium, large, massive)
 * - Sails (speed, cargo, battle, stealth)
 * - Weapons (cannons, harpoons, rams, fire barrels)
 * - Special parts (crow's nest, figurehead, flag)
 */

const fs = require('fs').promises;
const path = require('path');
const { createCanvas } = require('canvas');

class ShipComponentGenerator {
    constructor() {
        this.outputDir = './generated-ship-components';
        this.componentTypes = ['hulls', 'sails', 'weapons', 'special'];
        
        // ASCII art templates for components
        this.templates = {
            hulls: {
                small: {
                    ascii: [
                        '     ▲     ',
                        '    ╱ ╲    ',
                        '   ╱   ╲   ',
                        '  ╱_____╲  ',
                        ' ╱       ╲ ',
                        '╲_________╱',
                        ' ╲≈≈≈≈≈≈≈╱ '
                    ],
                    voxelData: this.generateHullVoxels('small'),
                    stats: { cargo: 10, health: 100, speed: 10, maneuverability: 9 }
                },
                medium: {
                    ascii: [
                        '       ▲▲       ',
                        '      ╱  ╲      ',
                        '     ╱    ╲     ',
                        '    ╱      ╲    ',
                        '   ╱________╲   ',
                        '  ╱          ╲  ',
                        ' ╱            ╲ ',
                        '╲______________╱',
                        ' ╲≈≈≈≈≈≈≈≈≈≈≈≈╱ '
                    ],
                    voxelData: this.generateHullVoxels('medium'),
                    stats: { cargo: 25, health: 200, speed: 8, maneuverability: 7 }
                },
                large: {
                    ascii: [
                        '         ▲▲▲         ',
                        '        ╱   ╲        ',
                        '       ╱     ╲       ',
                        '      ╱       ╲      ',
                        '     ╱_________╲     ',
                        '    ╱           ╲    ',
                        '   ╱             ╲   ',
                        '  ╱               ╲  ',
                        ' ╱                 ╲ ',
                        '╲___________________╱',
                        ' ╲≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈╱ '
                    ],
                    voxelData: this.generateHullVoxels('large'),
                    stats: { cargo: 50, health: 400, speed: 6, maneuverability: 4 }
                },
                massive: {
                    ascii: [
                        '           ▲▲▲▲▲           ',
                        '          ╱     ╲          ',
                        '         ╱       ╲         ',
                        '        ╱         ╲        ',
                        '       ╱___________╲       ',
                        '      ╱             ╲      ',
                        '     ╱               ╲     ',
                        '    ╱                 ╲    ',
                        '   ╱                   ╲   ',
                        '  ╱                     ╲  ',
                        ' ╱                       ╲ ',
                        '╲_________________________╱',
                        ' ╲≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈≈╱ '
                    ],
                    voxelData: this.generateHullVoxels('massive'),
                    stats: { cargo: 100, health: 800, speed: 4, maneuverability: 2 }
                }
            },
            
            sails: {
                speed: {
                    ascii: [
                        '    ╔═══╗    ',
                        '    ║▓▓▓║    ',
                        '    ║▓▓▓║    ',
                        '    ║▓▓▓║    ',
                        '    ║▓▓▓║    ',
                        '    ╚═══╝    ',
                        '      ║      '
                    ],
                    modifiers: { speed: 1.5, cargo: 0.8 },
                    color: '#FF6B6B'
                },
                cargo: {
                    ascii: [
                        '  ╔═══════╗  ',
                        '  ║███████║  ',
                        '  ║███████║  ',
                        '  ║███████║  ',
                        '  ║███████║  ',
                        '  ║███████║  ',
                        '  ╚═══════╝  ',
                        '      ║      '
                    ],
                    modifiers: { speed: 0.8, cargo: 1.3 },
                    color: '#4ECDC4'
                },
                battle: {
                    ascii: [
                        '   ╔═╦═╦═╗   ',
                        '   ║▀║▀║▀║   ',
                        '   ║▄║▄║▄║   ',
                        '   ║▀║▀║▀║   ',
                        '   ╚═╩═╩═╝   ',
                        '      ║      '
                    ],
                    modifiers: { maneuverability: 1.2, speed: 0.9 },
                    color: '#FF6B35'
                },
                stealth: {
                    ascii: [
                        '    ╔═══╗    ',
                        '    ║░░░║    ',
                        '    ║░░░║    ',
                        '    ║░░░║    ',
                        '    ╚═══╝    ',
                        '      ║      '
                    ],
                    modifiers: { visibility: 0.7, speed: 0.85 },
                    color: '#2D3436'
                }
            },
            
            weapons: {
                light_cannons: {
                    ascii: [
                        '  ═══◯  ',
                        ' ═══◯   ',
                        '═══◯    '
                    ],
                    damage: 6,
                    reload: 3,
                    arc: 180
                },
                heavy_cannons: {
                    ascii: [
                        ' ▄███▄  ',
                        '▄█████▄ ',
                        '███████▄'
                    ],
                    damage: 15,
                    reload: 8,
                    arc: 90
                },
                harpoons: {
                    ascii: [
                        '  ══►   ',
                        ' ══►    ',
                        '══►     '
                    ],
                    effect: 'slow',
                    slowAmount: 0.5,
                    boardingRange: 10
                },
                ram: {
                    ascii: [
                        '    ▼    ',
                        '   ▼▼▼   ',
                        '  ▼▼▼▼▼  ',
                        ' ▼▼▼▼▼▼▼ '
                    ],
                    damage: 50,
                    selfDamage: 0.25
                },
                fire_barrels: {
                    ascii: [
                        ' 🔥█🔥 ',
                        '  ███  ',
                        ' █████ '
                    ],
                    damage: 8,
                    effect: 'burn',
                    duration: 5
                }
            },
            
            special: {
                crows_nest: {
                    ascii: [
                        '  ╔═╗  ',
                        '  ║█║  ',
                        '══╬═╬══',
                        '  ║ ║  '
                    ],
                    effect: 'vision',
                    range: 1.5
                },
                figurehead: {
                    ascii: [
                        ' ╔═🦅═╗ ',
                        ' ╚═══╝ ',
                        '   ▼   '
                    ],
                    effect: 'morale',
                    bonus: 1.1
                },
                pirate_flag: {
                    ascii: [
                        '╔════╗',
                        '║☠️⚔️║',
                        '║⚔️☠️║',
                        '╚════╝'
                    ],
                    effect: 'intimidation',
                    fearFactor: 1.2
                }
            }
        };
        
        // Color schemes for different ship types
        this.colorSchemes = {
            merchant: { primary: '#4ECDC4', secondary: '#45B7B8', accent: '#FDCB6E' },
            pirate: { primary: '#2D3436', secondary: '#636E72', accent: '#FF6B6B' },
            navy: { primary: '#0984E3', secondary: '#74B9FF', accent: '#FDCB6E' },
            explorer: { primary: '#6C5CE7', secondary: '#A29BFE', accent: '#FFEAA7' },
            smuggler: { primary: '#636E72', secondary: '#2D3436', accent: '#B2BEC3' }
        };
    }
    
    /**
     * Generate all ship components
     */
    async generateAllComponents() {
        console.log('🏴‍☠️ Starting ShipRekt Component Generation...');
        
        // Create output directory
        await this.ensureDirectory(this.outputDir);
        
        // Generate each component type
        for (const type of this.componentTypes) {
            await this.generateComponentType(type);
        }
        
        // Generate composite examples
        await this.generateCompositeShips();
        
        // Generate component catalog
        await this.generateComponentCatalog();
        
        // Generate bitmap sprites
        await this.generateBitmapSprites();
        
        console.log('✅ Ship component generation complete!');
        console.log(`📁 Components saved to: ${this.outputDir}`);
    }
    
    /**
     * Generate components of a specific type
     */
    async generateComponentType(type) {
        const typeDir = path.join(this.outputDir, type);
        await this.ensureDirectory(typeDir);
        
        const components = this.templates[type];
        if (!components) return;
        
        for (const [name, data] of Object.entries(components)) {
            // Generate ASCII representation
            const asciiFile = path.join(typeDir, `${name}.ascii`);
            const asciiArt = Array.isArray(data.ascii) ? data.ascii.join('\n') : data.ascii;
            await fs.writeFile(asciiFile, asciiArt);
            
            // Generate JSON metadata
            const metaFile = path.join(typeDir, `${name}.json`);
            const metadata = {
                name,
                type,
                ascii: data.ascii,
                stats: data.stats || {},
                modifiers: data.modifiers || {},
                effects: data.effect ? { type: data.effect, ...data } : {},
                generated: new Date().toISOString()
            };
            await fs.writeFile(metaFile, JSON.stringify(metadata, null, 2));
            
            // Generate voxel data if applicable
            if (type === 'hulls') {
                const voxelFile = path.join(typeDir, `${name}.voxel`);
                const voxelData = this.generateVoxelData(name, data);
                await fs.writeFile(voxelFile, JSON.stringify(voxelData, null, 2));
            }
        }
        
        console.log(`✅ Generated ${Object.keys(components).length} ${type}`);
    }
    
    /**
     * Generate voxel data for hulls
     */
    generateHullVoxels(size) {
        const dimensions = {
            small: { width: 5, height: 3, length: 8 },
            medium: { width: 7, height: 4, length: 12 },
            large: { width: 9, height: 5, length: 16 },
            massive: { width: 12, height: 6, length: 20 }
        };
        
        const dim = dimensions[size];
        const voxels = [];
        
        // Generate hull shape
        for (let z = 0; z < dim.length; z++) {
            for (let y = 0; y < dim.height; y++) {
                for (let x = 0; x < dim.width; x++) {
                    // Hull curve formula
                    const centerX = dim.width / 2;
                    const distFromCenter = Math.abs(x - centerX);
                    const hullWidth = dim.width * (1 - (z / dim.length) * 0.3);
                    
                    if (distFromCenter <= hullWidth / 2) {
                        voxels.push({
                            x, y, z,
                            type: y === 0 ? 'deck' : 'hull',
                            color: y === 0 ? '#8B4513' : '#654321'
                        });
                    }
                }
            }
        }
        
        return voxels;
    }
    
    /**
     * Generate voxel data structure
     */
    generateVoxelData(name, componentData) {
        return {
            name,
            voxels: componentData.voxelData || this.generateHullVoxels(name),
            dimensions: this.getVoxelDimensions(name),
            materials: {
                hull: { color: '#654321', texture: 'wood' },
                deck: { color: '#8B4513', texture: 'wood_polished' },
                sail: { color: '#FFFFFF', texture: 'cloth' },
                metal: { color: '#C0C0C0', texture: 'metal' }
            }
        };
    }
    
    /**
     * Get voxel dimensions for component
     */
    getVoxelDimensions(name) {
        const dimensions = {
            small: { width: 5, height: 3, length: 8 },
            medium: { width: 7, height: 4, length: 12 },
            large: { width: 9, height: 5, length: 16 },
            massive: { width: 12, height: 6, length: 20 }
        };
        return dimensions[name] || { width: 5, height: 3, length: 8 };
    }
    
    /**
     * Generate composite ship examples
     */
    async generateCompositeShips() {
        const compositeDir = path.join(this.outputDir, 'composite-examples');
        await this.ensureDirectory(compositeDir);
        
        const shipTypes = [
            {
                name: 'merchant_vessel',
                hull: 'large',
                sails: 'cargo',
                weapons: ['light_cannons'],
                special: ['crows_nest'],
                scheme: 'merchant'
            },
            {
                name: 'pirate_raider',
                hull: 'medium',
                sails: 'speed',
                weapons: ['heavy_cannons', 'harpoons'],
                special: ['pirate_flag'],
                scheme: 'pirate'
            },
            {
                name: 'navy_warship',
                hull: 'massive',
                sails: 'battle',
                weapons: ['heavy_cannons', 'heavy_cannons', 'ram'],
                special: ['figurehead'],
                scheme: 'navy'
            },
            {
                name: 'smuggler_sloop',
                hull: 'small',
                sails: 'stealth',
                weapons: ['light_cannons'],
                special: ['crows_nest'],
                scheme: 'smuggler'
            },
            {
                name: 'exploration_vessel',
                hull: 'medium',
                sails: 'speed',
                weapons: ['light_cannons', 'harpoons'],
                special: ['crows_nest', 'figurehead'],
                scheme: 'explorer'
            }
        ];
        
        for (const ship of shipTypes) {
            const shipArt = await this.assembleShipArt(ship);
            const shipFile = path.join(compositeDir, `${ship.name}.txt`);
            await fs.writeFile(shipFile, shipArt);
            
            // Save ship configuration
            const configFile = path.join(compositeDir, `${ship.name}.json`);
            await fs.writeFile(configFile, JSON.stringify(ship, null, 2));
        }
        
        console.log(`✅ Generated ${shipTypes.length} composite ship examples`);
    }
    
    /**
     * Assemble ASCII art for a complete ship
     */
    async assembleShipArt(shipConfig) {
        const lines = [];
        
        // Header
        lines.push('╔════════════════════════════════╗');
        lines.push(`║ ${shipConfig.name.toUpperCase().replace(/_/g, ' ')} `);
        lines.push('╚════════════════════════════════╝');
        lines.push('');
        
        // Add sails
        const sails = this.templates.sails[shipConfig.sails];
        if (sails && sails.ascii) {
            lines.push(...sails.ascii);
        }
        
        // Add hull
        const hull = this.templates.hulls[shipConfig.hull];
        if (hull && hull.ascii) {
            lines.push(...hull.ascii);
        }
        
        // Add weapons (simplified representation)
        lines.push('');
        lines.push('ARMAMENTS:');
        for (const weapon of shipConfig.weapons) {
            const weaponData = this.templates.weapons[weapon];
            if (weaponData) {
                lines.push(`• ${weapon.replace(/_/g, ' ')}: DMG ${weaponData.damage || 'N/A'}`);
            }
        }
        
        // Add special features
        if (shipConfig.special.length > 0) {
            lines.push('');
            lines.push('SPECIAL:');
            for (const special of shipConfig.special) {
                lines.push(`• ${special.replace(/_/g, ' ')}`);
            }
        }
        
        // Add stats
        lines.push('');
        lines.push('═══════════════════════════════');
        lines.push(`Cargo: ${hull.stats.cargo} | Health: ${hull.stats.health}`);
        lines.push(`Speed: ${hull.stats.speed} | Maneuver: ${hull.stats.maneuverability}`);
        
        return lines.join('\n');
    }
    
    /**
     * Generate component catalog
     */
    async generateComponentCatalog() {
        const catalog = {
            generated: new Date().toISOString(),
            version: '1.0.0',
            components: {
                hulls: {},
                sails: {},
                weapons: {},
                special: {}
            },
            statistics: {
                totalComponents: 0,
                byType: {}
            }
        };
        
        // Collect all components
        for (const type of this.componentTypes) {
            const components = this.templates[type];
            catalog.components[type] = components;
            catalog.statistics.byType[type] = Object.keys(components).length;
            catalog.statistics.totalComponents += Object.keys(components).length;
        }
        
        // Add crafting recipes
        catalog.craftingRecipes = this.generateCraftingRecipes();
        
        // Add tier progression
        catalog.tierProgression = {
            tier1: ['small hull', 'light cannons', 'basic sails'],
            tier2: ['medium hull', 'all sail types', 'harpoons'],
            tier3: ['large hull', 'heavy cannons', 'special items'],
            tier4: ['massive hull', 'all weapons', 'legendary items']
        };
        
        const catalogFile = path.join(this.outputDir, 'component-catalog.json');
        await fs.writeFile(catalogFile, JSON.stringify(catalog, null, 2));
        
        console.log('✅ Generated component catalog');
    }
    
    /**
     * Generate crafting recipes
     */
    generateCraftingRecipes() {
        return {
            small_merchant: {
                components: ['small_hull', 'cargo_sails', 'light_cannons'],
                materials: { wood: 100, cloth: 30, iron: 20 },
                time: '2 hours',
                skillRequired: 'Novice Shipwright'
            },
            medium_pirate: {
                components: ['medium_hull', 'speed_sails', 'heavy_cannons', 'pirate_flag'],
                materials: { wood: 250, cloth: 50, iron: 80, dye: 10 },
                time: '6 hours',
                skillRequired: 'Experienced Shipwright'
            },
            large_warship: {
                components: ['large_hull', 'battle_sails', 'heavy_cannons', 'ram', 'figurehead'],
                materials: { wood: 500, cloth: 100, iron: 200, gold: 20 },
                time: '12 hours',
                skillRequired: 'Master Shipwright'
            },
            massive_trader: {
                components: ['massive_hull', 'cargo_sails', 'light_cannons', 'crows_nest'],
                materials: { wood: 1000, cloth: 200, iron: 150, rope: 100 },
                time: '24 hours',
                skillRequired: 'Legendary Shipwright'
            }
        };
    }
    
    /**
     * Generate bitmap sprites for components
     */
    async generateBitmapSprites() {
        const spritesDir = path.join(this.outputDir, 'sprites');
        await this.ensureDirectory(spritesDir);
        
        // Generate hull sprites
        for (const [name, data] of Object.entries(this.templates.hulls)) {
            const canvas = createCanvas(64, 64);
            const ctx = canvas.getContext('2d');
            
            // Draw hull shape
            ctx.fillStyle = '#654321';
            this.drawHullSprite(ctx, name);
            
            // Save sprite
            const buffer = canvas.toBuffer('image/png');
            const spriteFile = path.join(spritesDir, `hull_${name}.png`);
            await fs.writeFile(spriteFile, buffer);
        }
        
        // Generate sail sprites
        for (const [name, data] of Object.entries(this.templates.sails)) {
            const canvas = createCanvas(32, 48);
            const ctx = canvas.getContext('2d');
            
            // Draw sail
            ctx.fillStyle = data.color || '#FFFFFF';
            this.drawSailSprite(ctx, name);
            
            const buffer = canvas.toBuffer('image/png');
            const spriteFile = path.join(spritesDir, `sail_${name}.png`);
            await fs.writeFile(spriteFile, buffer);
        }
        
        console.log('✅ Generated bitmap sprites');
    }
    
    /**
     * Draw hull sprite
     */
    drawHullSprite(ctx, size) {
        const shapes = {
            small: () => {
                ctx.beginPath();
                ctx.moveTo(32, 10);
                ctx.lineTo(50, 30);
                ctx.lineTo(50, 40);
                ctx.lineTo(32, 54);
                ctx.lineTo(14, 40);
                ctx.lineTo(14, 30);
                ctx.closePath();
                ctx.fill();
            },
            medium: () => {
                ctx.beginPath();
                ctx.moveTo(32, 8);
                ctx.lineTo(54, 25);
                ctx.lineTo(54, 40);
                ctx.lineTo(32, 56);
                ctx.lineTo(10, 40);
                ctx.lineTo(10, 25);
                ctx.closePath();
                ctx.fill();
            },
            large: () => {
                ctx.beginPath();
                ctx.moveTo(32, 6);
                ctx.lineTo(58, 20);
                ctx.lineTo(58, 44);
                ctx.lineTo(32, 58);
                ctx.lineTo(6, 44);
                ctx.lineTo(6, 20);
                ctx.closePath();
                ctx.fill();
            },
            massive: () => {
                ctx.beginPath();
                ctx.moveTo(32, 4);
                ctx.lineTo(60, 18);
                ctx.lineTo(60, 46);
                ctx.lineTo(32, 60);
                ctx.lineTo(4, 46);
                ctx.lineTo(4, 18);
                ctx.closePath();
                ctx.fill();
            }
        };
        
        if (shapes[size]) {
            shapes[size]();
        }
    }
    
    /**
     * Draw sail sprite
     */
    drawSailSprite(ctx, type) {
        // Mast
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(14, 0, 4, 48);
        
        // Sail
        ctx.fillStyle = this.templates.sails[type].color || '#FFFFFF';
        
        const sailShapes = {
            speed: () => {
                ctx.fillRect(6, 4, 20, 30);
            },
            cargo: () => {
                ctx.fillRect(2, 4, 28, 35);
            },
            battle: () => {
                ctx.fillRect(4, 4, 24, 28);
                ctx.fillRect(8, 2, 16, 2);
                ctx.fillRect(8, 32, 16, 2);
            },
            stealth: () => {
                ctx.globalAlpha = 0.7;
                ctx.fillRect(6, 4, 20, 25);
                ctx.globalAlpha = 1.0;
            }
        };
        
        if (sailShapes[type]) {
            sailShapes[type]();
        }
    }
    
    /**
     * Ensure directory exists
     */
    async ensureDirectory(dir) {
        try {
            await fs.mkdir(dir, { recursive: true });
        } catch (err) {
            if (err.code !== 'EEXIST') throw err;
        }
    }
}

// Run generator if called directly
if (require.main === module) {
    const generator = new ShipComponentGenerator();
    generator.generateAllComponents()
        .then(() => console.log('🏴‍☠️ All ship components generated successfully!'))
        .catch(err => console.error('❌ Error generating components:', err));
}

module.exports = ShipComponentGenerator;