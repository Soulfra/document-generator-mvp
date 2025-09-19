#!/usr/bin/env node
// color-authority-boss-mapper.js
// Maps boss system to existing Kingdom Authority color scheme
// Creates the "middle layer" where sysadmins see color encoding and authority levels

const EventEmitter = require('events');

class ColorAuthorityBossMapper extends EventEmitter {
    constructor(options = {}) {
        super();
        
        // Kingdom Authority Color Scheme Integration
        this.authorityLevels = {
            'EXILE': {
                color: '#8B0000',          // Dark Red
                rgb: [139, 0, 0],
                hsl: [0, 100, 27],
                name: 'Exile',
                tier: 0,
                bossPermissions: {
                    view: false,
                    create: false,
                    battle: false,
                    vote: false,
                    moderate: false
                },
                bossTypes: [], // Exiles cannot access bosses
                maxBossLevel: 0,
                revenue: 0.00
            },
            
            'PEASANT': {
                color: '#FF0000',          // Red
                rgb: [255, 0, 0],
                hsl: [0, 100, 50],
                name: 'Peasant',
                tier: 1,
                bossPermissions: {
                    view: true,
                    create: false,
                    battle: true,
                    vote: false,
                    moderate: false
                },
                bossTypes: ['training-dummy', 'basic-slime'],
                maxBossLevel: 10,
                revenue: 0.05
            },
            
            'CITIZEN': {
                color: '#0000FF',          // Blue  
                rgb: [0, 0, 255],
                hsl: [240, 100, 50],
                name: 'Citizen',
                tier: 2,
                bossPermissions: {
                    view: true,
                    create: true,
                    battle: true,
                    vote: true,
                    moderate: false
                },
                bossTypes: ['training-dummy', 'basic-slime', 'goblin-warrior', 'forest-wolf'],
                maxBossLevel: 25,
                revenue: 0.10
            },
            
            'MERCHANT': {
                color: '#FFFF00',          // Yellow
                rgb: [255, 255, 0], 
                hsl: [60, 100, 50],
                name: 'Merchant',
                tier: 3,
                bossPermissions: {
                    view: true,
                    create: true,
                    battle: true,
                    vote: true,
                    moderate: false
                },
                bossTypes: ['training-dummy', 'basic-slime', 'goblin-warrior', 'forest-wolf', 'orc-champion', 'crystal-golem'],
                maxBossLevel: 50,
                revenue: 0.15
            },
            
            'KNIGHT': {
                color: '#00FF00',          // Green
                rgb: [0, 255, 0],
                hsl: [120, 100, 50],
                name: 'Knight',
                tier: 4,
                bossPermissions: {
                    view: true,
                    create: true,
                    battle: true,
                    vote: true,
                    moderate: true
                },
                bossTypes: ['training-dummy', 'basic-slime', 'goblin-warrior', 'forest-wolf', 'orc-champion', 'crystal-golem', 'shadow-beast', 'fire-elemental'],
                maxBossLevel: 75,
                revenue: 0.20
            },
            
            'LORD': {
                color: '#800080',          // Purple
                rgb: [128, 0, 128],
                hsl: [300, 100, 25],
                name: 'Lord',
                tier: 5,
                bossPermissions: {
                    view: true,
                    create: true,
                    battle: true,
                    vote: true,
                    moderate: true
                },
                bossTypes: ['*'], // All boss types
                maxBossLevel: 100,
                revenue: 0.25
            },
            
            'KING': {
                color: '#000000',          // Black
                rgb: [0, 0, 0],
                hsl: [0, 0, 0],
                name: 'King',
                tier: 6,
                bossPermissions: {
                    view: true,
                    create: true,
                    battle: true,
                    vote: true,
                    moderate: true,
                    admin: true,
                    system: true
                },
                bossTypes: ['*'], // All boss types + admin bosses
                maxBossLevel: 999,
                revenue: 0.30
            }
        };
        
        // Boss Type Color Mapping (for visual identification)
        this.bossTypeColors = {
            // Basic bosses (accessible to lower tiers)
            'training-dummy': { primary: '#D2B48C', secondary: '#8B7355', difficulty: 'tutorial' },
            'basic-slime': { primary: '#32CD32', secondary: '#228B22', difficulty: 'easy' },
            'goblin-warrior': { primary: '#8B4513', secondary: '#654321', difficulty: 'easy' },
            'forest-wolf': { primary: '#696969', secondary: '#2F4F4F', difficulty: 'easy' },
            
            // Intermediate bosses
            'orc-champion': { primary: '#8B0000', secondary: '#660000', difficulty: 'medium' },
            'crystal-golem': { primary: '#4169E1', secondary: '#191970', difficulty: 'medium' },
            'shadow-beast': { primary: '#2F2F2F', secondary: '#000000', difficulty: 'hard' },
            'fire-elemental': { primary: '#FF4500', secondary: '#DC143C', difficulty: 'hard' },
            
            // Advanced bosses (Knight+ only)
            'ice-dragon': { primary: '#87CEEB', secondary: '#4682B4', difficulty: 'very-hard' },
            'demon-lord': { primary: '#8B0000', secondary: '#000000', difficulty: 'very-hard' },
            'ancient-lich': { primary: '#9400D3', secondary: '#4B0082', difficulty: 'extreme' },
            
            // Admin/System bosses (King only)
            'system-guardian': { primary: '#FFD700', secondary: '#B8860B', difficulty: 'admin' },
            'void-entity': { primary: '#1C1C1C', secondary: '#000000', difficulty: 'system' }
        };
        
        // Color-based battle themes (for visual consistency)
        this.battleThemes = {
            'exile': { bg: '#2B0000', ui: '#4B0000', text: '#FFFFFF' },
            'peasant': { bg: '#2B0000', ui: '#FF0000', text: '#FFFFFF' },
            'citizen': { bg: '#000080', ui: '#0000FF', text: '#FFFFFF' },
            'merchant': { bg: '#808000', ui: '#FFFF00', text: '#000000' },
            'knight': { bg: '#004000', ui: '#00FF00', text: '#000000' },
            'lord': { bg: '#400040', ui: '#800080', text: '#FFFFFF' },
            'king': { bg: '#000000', ui: '#333333', text: '#FFFFFF' }
        };
        
        // Authority-based UI configurations
        this.uiConfigurations = new Map();
        
        // Revenue sharing calculations
        this.revenueCalculator = {
            baseBattleCost: 1.00,
            bossCreationCost: 5.00,
            moderationRevenue: 0.25,
            systemFee: 0.10
        };
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🎨 Color Authority Boss Mapper - Initializing');
        console.log('Integrating Kingdom Authority color scheme with boss system');
        
        // Generate UI configurations for each authority level
        this.generateUIConfigurations();
        
        // Set up color-based routing
        this.setupColorRouting();
        
        // Initialize authority validation
        this.setupAuthorityValidation();
        
        console.log('✅ Color Authority mapping initialized');
        console.log(`🎨 Authority levels: ${Object.keys(this.authorityLevels).length}`);
        console.log(`🎯 Boss types: ${Object.keys(this.bossTypeColors).length}`);
        
        this.emit('mapper:ready');
    }
    
    // Generate UI configurations based on authority colors
    generateUIConfigurations() {
        for (const [authority, config] of Object.entries(this.authorityLevels)) {
            const uiConfig = {
                // Color scheme
                colors: {
                    primary: config.color,
                    rgb: config.rgb,
                    hsl: config.hsl,
                    theme: this.battleThemes[authority.toLowerCase()]
                },
                
                // Permissions-based UI elements
                ui: {
                    showCreateBoss: config.bossPermissions.create,
                    showModeration: config.bossPermissions.moderate,
                    showAdminPanel: config.bossPermissions.admin || false,
                    showSystemTools: config.bossPermissions.system || false
                },
                
                // Available boss types with color coding
                availableBosses: this.getAvailableBossesWithColors(config.bossTypes),
                
                // Battle UI configuration
                battleUI: {
                    maxLevel: config.maxBossLevel,
                    showAdvancedStats: config.tier >= 3,
                    showModTools: config.bossPermissions.moderate,
                    colorTheme: authority.toLowerCase()
                },
                
                // Revenue display
                revenue: {
                    percentage: config.revenue,
                    showEarnings: config.tier >= 2,
                    canWithdraw: config.tier >= 3
                }
            };
            
            this.uiConfigurations.set(authority, uiConfig);
        }
        
        console.log('🖥️  UI configurations generated for all authority levels');
    }
    
    // Get available bosses with color coding for authority level
    getAvailableBossesWithColors(bossTypes) {
        if (bossTypes.includes('*')) {
            // Full access - return all bosses with colors
            return Object.entries(this.bossTypeColors).map(([type, colors]) => ({
                type,
                ...colors,
                accessible: true
            }));
        }
        
        // Limited access - return only permitted bosses
        return bossTypes.map(type => ({
            type,
            ...this.bossTypeColors[type],
            accessible: true
        }));
    }
    
    // Set up color-based routing (middleware style)
    setupColorRouting() {
        this.colorRouter = {
            // Route requests based on authority color
            route: (authorityLevel, request) => {
                const config = this.authorityLevels[authorityLevel];
                if (!config) {
                    return { error: 'Invalid authority level', color: '#FF0000' };
                }
                
                return {
                    authorityLevel,
                    color: config.color,
                    permissions: config.bossPermissions,
                    theme: this.battleThemes[authorityLevel.toLowerCase()],
                    ui: this.uiConfigurations.get(authorityLevel)
                };
            },
            
            // Color-based access control
            checkAccess: (authorityLevel, resource) => {
                const config = this.authorityLevels[authorityLevel];
                if (!config) return false;
                
                switch (resource) {
                    case 'boss-creation':
                        return config.bossPermissions.create;
                    case 'boss-moderation':
                        return config.bossPermissions.moderate;
                    case 'admin-panel':
                        return config.bossPermissions.admin || false;
                    case 'system-tools':
                        return config.bossPermissions.system || false;
                    default:
                        return config.bossPermissions.view;
                }
            }
        };
    }
    
    // Set up authority validation
    setupAuthorityValidation() {
        this.validator = {
            // Validate boss creation permission
            validateBossCreation: (authorityLevel, bossType) => {
                const config = this.authorityLevels[authorityLevel];
                if (!config || !config.bossPermissions.create) {
                    return {
                        valid: false,
                        reason: 'Insufficient authority for boss creation',
                        requiredLevel: 'CITIZEN'
                    };
                }
                
                if (!config.bossTypes.includes(bossType) && !config.bossTypes.includes('*')) {
                    return {
                        valid: false,
                        reason: `Boss type '${bossType}' not available for ${authorityLevel}`,
                        availableTypes: config.bossTypes
                    };
                }
                
                return { valid: true };
            },
            
            // Validate boss battle participation
            validateBattleParticipation: (authorityLevel, bossLevel) => {
                const config = this.authorityLevels[authorityLevel];
                if (!config || !config.bossPermissions.battle) {
                    return {
                        valid: false,
                        reason: 'Insufficient authority for battles',
                        requiredLevel: 'PEASANT'
                    };
                }
                
                if (bossLevel > config.maxBossLevel) {
                    return {
                        valid: false,
                        reason: `Boss level ${bossLevel} exceeds maximum ${config.maxBossLevel} for ${authorityLevel}`,
                        maxLevel: config.maxBossLevel
                    };
                }
                
                return { valid: true };
            },
            
            // Validate moderation actions
            validateModeration: (authorityLevel, action) => {
                const config = this.authorityLevels[authorityLevel];
                if (!config || !config.bossPermissions.moderate) {
                    return {
                        valid: false,
                        reason: 'Insufficient authority for moderation',
                        requiredLevel: 'KNIGHT'
                    };
                }
                
                return { valid: true };
            }
        };
    }
    
    // Public API Methods
    
    // Get UI configuration for authority level
    getUIConfiguration(authorityLevel) {
        const config = this.uiConfigurations.get(authorityLevel);
        if (!config) {
            throw new Error(`Unknown authority level: ${authorityLevel}`);
        }
        
        return {
            ...config,
            timestamp: Date.now(),
            authorityLevel
        };
    }
    
    // Get color scheme for authority level
    getColorScheme(authorityLevel) {
        const config = this.authorityLevels[authorityLevel];
        if (!config) {
            throw new Error(`Unknown authority level: ${authorityLevel}`);
        }
        
        return {
            primary: config.color,
            rgb: config.rgb,
            hsl: config.hsl,
            theme: this.battleThemes[authorityLevel.toLowerCase()],
            name: config.name,
            tier: config.tier
        };
    }
    
    // Get boss type colors
    getBossTypeColors(bossType) {
        const colors = this.bossTypeColors[bossType];
        if (!colors) {
            return {
                primary: '#808080',
                secondary: '#606060',
                difficulty: 'unknown'
            };
        }
        
        return colors;
    }
    
    // Check if authority can access boss type
    canAccessBossType(authorityLevel, bossType) {
        const config = this.authorityLevels[authorityLevel];
        if (!config) return false;
        
        return config.bossTypes.includes(bossType) || config.bossTypes.includes('*');
    }
    
    // Get revenue percentage for authority level
    getRevenuePercentage(authorityLevel) {
        const config = this.authorityLevels[authorityLevel];
        return config ? config.revenue : 0.00;
    }
    
    // Calculate battle cost with authority discount
    calculateBattleCost(authorityLevel, bossLevel) {
        const config = this.authorityLevels[authorityLevel];
        if (!config) return this.revenueCalculator.baseBattleCost;
        
        const baseCost = this.revenueCalculator.baseBattleCost;
        const levelMultiplier = Math.max(1, bossLevel / 10);
        const authorityDiscount = 1 - (config.tier * 0.05); // 5% discount per tier
        
        return Math.round((baseCost * levelMultiplier * authorityDiscount) * 100) / 100;
    }
    
    // Generate color-coded battle report
    generateBattleReport(battleData, authorityLevel) {
        const colors = this.getColorScheme(authorityLevel);
        const bossColors = this.getBossTypeColors(battleData.bossType);
        
        return {
            battleId: battleData.id,
            timestamp: Date.now(),
            
            // Color-coded participants
            participants: battleData.participants.map(participant => ({
                ...participant,
                colors: this.getColorScheme(participant.authorityLevel),
                theme: this.battleThemes[participant.authorityLevel.toLowerCase()]
            })),
            
            // Color-coded boss
            boss: {
                ...battleData.boss,
                colors: bossColors,
                theme: `${bossColors.difficulty}-boss`
            },
            
            // Authority-based view
            viewerConfig: {
                authorityLevel,
                colors,
                canModerate: this.validator.validateModeration(authorityLevel, 'view').valid,
                canParticipate: this.validator.validateBattleParticipation(authorityLevel, battleData.boss.level).valid
            }
        };
    }
    
    // Generate sysadmin color dashboard
    generateSysAdminDashboard() {
        const dashboard = {
            timestamp: Date.now(),
            title: 'Boss System - Authority Color Dashboard',
            
            // Authority level overview with colors
            authorities: Object.entries(this.authorityLevels).map(([level, config]) => ({
                level,
                color: config.color,
                rgb: config.rgb,
                name: config.name,
                tier: config.tier,
                permissions: Object.keys(config.bossPermissions).filter(
                    perm => config.bossPermissions[perm]
                ),
                bossAccess: config.bossTypes.length,
                maxLevel: config.maxBossLevel,
                revenue: `${(config.revenue * 100).toFixed(1)}%`
            })),
            
            // Boss type color mapping
            bossTypes: Object.entries(this.bossTypeColors).map(([type, colors]) => ({
                type,
                primary: colors.primary,
                secondary: colors.secondary,
                difficulty: colors.difficulty,
                accessibleTo: this.getAuthorityLevelsForBoss(type)
            })),
            
            // System statistics
            statistics: {
                totalAuthorityLevels: Object.keys(this.authorityLevels).length,
                totalBossTypes: Object.keys(this.bossTypeColors).length,
                totalBattleThemes: Object.keys(this.battleThemes).length,
                uiConfigurations: this.uiConfigurations.size
            }
        };
        
        return dashboard;
    }
    
    // Get authority levels that can access a boss type
    getAuthorityLevelsForBoss(bossType) {
        return Object.entries(this.authorityLevels)
            .filter(([level, config]) => 
                config.bossTypes.includes(bossType) || config.bossTypes.includes('*')
            )
            .map(([level]) => level);
    }
    
    // Express middleware for color-based routing
    createExpressMiddleware() {
        return (req, res, next) => {
            // Extract authority level from request
            const authorityLevel = req.headers['x-authority-level'] || 
                                 req.user?.authorityLevel || 
                                 'EXILE';
            
            // Get color configuration
            const routing = this.colorRouter.route(authorityLevel, req);
            
            // Attach to request
            req.authority = routing;
            req.colors = routing.color;
            req.theme = routing.theme;
            req.ui = routing.ui;
            
            // Set response headers
            res.setHeader('X-Authority-Color', routing.color);
            res.setHeader('X-Authority-Level', authorityLevel);
            
            next();
        };
    }
    
    // WebSocket color event handler
    createWebSocketHandler() {
        return (ws, request) => {
            const authorityLevel = request.headers['x-authority-level'] || 'EXILE';
            const colors = this.getColorScheme(authorityLevel);
            
            // Send initial color configuration
            ws.send(JSON.stringify({
                type: 'color-config',
                data: {
                    authorityLevel,
                    colors,
                    ui: this.getUIConfiguration(authorityLevel)
                }
            }));
            
            // Handle color-based events
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    
                    if (data.type === 'authority-change') {
                        const newColors = this.getColorScheme(data.newLevel);
                        ws.send(JSON.stringify({
                            type: 'color-update',
                            data: { colors: newColors }
                        }));
                    }
                } catch (error) {
                    console.error('WebSocket color handler error:', error);
                }
            });
        };
    }
}

// Export for system integration
module.exports = ColorAuthorityBossMapper;

// CLI usage and demonstration
if (require.main === module) {
    const mapper = new ColorAuthorityBossMapper();
    
    mapper.on('mapper:ready', () => {
        console.log('\n🎨 COLOR AUTHORITY BOSS MAPPER READY');
        console.log('='.repeat(60));
        console.log('✅ Kingdom Authority color scheme integrated');
        console.log('✅ Boss type color mapping established');  
        console.log('✅ Authority-based UI configurations generated');
        console.log('✅ Revenue sharing calculations configured');
        
        // Demo the system
        console.log('\n📊 SYSADMIN COLOR DASHBOARD');
        console.log('='.repeat(40));
        
        const dashboard = mapper.generateSysAdminDashboard();
        
        console.log('\n👑 Authority Levels:');
        dashboard.authorities.forEach(auth => {
            console.log(`  ${auth.level.padEnd(8)} | ${auth.color} | ${auth.name.padEnd(8)} | Tier ${auth.tier} | Revenue: ${auth.revenue}`);
        });
        
        console.log('\n🎯 Boss Types:');
        dashboard.bossTypes.slice(0, 5).forEach(boss => {
            console.log(`  ${boss.type.padEnd(15)} | ${boss.primary} | ${boss.difficulty.padEnd(10)} | Access: ${boss.accessibleTo.join(', ')}`);
        });
        
        // Demo color routing
        console.log('\n🔀 Color Routing Demo:');
        ['CITIZEN', 'KNIGHT', 'KING'].forEach(level => {
            const ui = mapper.getUIConfiguration(level);
            console.log(`  ${level}: ${ui.colors.primary} - Create: ${ui.ui.showCreateBoss}, Moderate: ${ui.ui.showModeration}`);
        });
        
        console.log('\n🌐 Integration complete - Boss system mapped to Kingdom Authority colors');
    });
}