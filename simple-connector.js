#!/usr/bin/env node

/**
 * SIMPLE CONNECTOR - Connect existing systems without API calls
 * Extracts only what we need from each system for local-only operation
 */

class SimpleConnector {
    constructor() {
        // Extract only the features we need from each system
        this.devilFruits = this.getSimpleDevilFruits();
        this.shipComponents = this.getSimpleShipComponents();
        this.buildingTypes = this.getSimpleBuildingTypes();
        
        console.log('🔌 Simple Connector initialized - NO API CALLS');
    }
    
    // Simplified Devil Fruits - just the game mechanics, no API abilities
    getSimpleDevilFruits() {
        return {
            GOMU_GOMU: {
                name: 'Rubber-Rubber Fruit',
                type: 'Paramecia',
                gameBonus: { defense: 2, speed: 1.5 },
                description: 'Bounce back from attacks'
            },
            MERA_MERA: {
                name: 'Flame-Flame Fruit',
                type: 'Logia',
                gameBonus: { attack: 3, production: 1.2 },
                description: 'Burn through enemies'
            },
            YAMI_YAMI: {
                name: 'Dark-Dark Fruit',
                type: 'Logia',
                gameBonus: { stealth: 5, loot: 1.5 },
                description: 'Hide in darkness'
            },
            HITO_HITO_NIKA: {
                name: 'Human-Human Fruit Model: Nika',
                type: 'Mythical Zoan',
                gameBonus: { all_stats: 2, happiness: 100 },
                description: 'Legendary transformation'
            }
        };
    }
    
    // Simplified ship components - just the visual and stats
    getSimpleShipComponents() {
        return {
            hulls: {
                small: { hp: 100, capacity: 50, sprite: '⛵' },
                medium: { hp: 200, capacity: 150, sprite: '🚢' },
                large: { hp: 500, capacity: 500, sprite: '🛳️' }
            },
            sails: {
                basic: { speed: 5, sprite: '◣' },
                advanced: { speed: 10, sprite: '◣◢' },
                legendary: { speed: 20, sprite: '☠️' }
            },
            weapons: {
                cannons: { damage: 10, range: 5, sprite: '💣' },
                harpoons: { damage: 15, range: 3, sprite: '🔱' },
                rockets: { damage: 25, range: 8, sprite: '🚀' }
            }
        };
    }
    
    // Simplified building types - no external graphics generation
    getSimpleBuildingTypes() {
        return {
            // Resource buildings
            goldMine: {
                name: 'Gold Mine',
                cost: { wood: 100 },
                production: { gold: 10 },
                sprite: '⛏️',
                color: '#FFD700'
            },
            lumberMill: {
                name: 'Lumber Mill',
                cost: { gold: 150 },
                production: { wood: 8 },
                sprite: '🪵',
                color: '#8B4513'
            },
            
            // Defense buildings
            cannonTower: {
                name: 'Cannon Tower',
                cost: { gold: 1000, wood: 500 },
                defense: 50,
                damage: 25,
                sprite: '🗼',
                color: '#696969'
            },
            
            // Special buildings
            devilFruitTree: {
                name: 'Devil Fruit Tree',
                cost: { gold: 10000 },
                special: 'grants_random_fruit',
                sprite: '🌳',
                color: '#9400D3'
            }
        };
    }
    
    // Connect systems together locally
    connectSystems(mobileIdleTycoon) {
        console.log('🔗 Connecting systems locally...');
        
        // Replace complex economy with simple version
        if (mobileIdleTycoon.onePieceEconomy) {
            mobileIdleTycoon.onePieceEconomy = {
                devilFruits: this.devilFruits,
                shipRektOnboarding: (userData) => {
                    // Simple local onboarding
                    return {
                        character: {
                            id: Date.now().toString(),
                            name: userData.name || 'Pirate',
                            ship: { status: 'WRECKED', health: 10 },
                            inventory: { gold: 500, wood: 500 }
                        },
                        contract: {
                            address: 'local-' + Date.now(),
                            pay: (amount) => {
                                console.log(`Local payment: ${amount} gold`);
                                return { success: true, newTier: 'PIRATE' };
                            }
                        }
                    };
                }
            };
        }
        
        // Replace complex ShipRekt with simple version
        if (mobileIdleTycoon.shipRektEngine) {
            mobileIdleTycoon.shipRektEngine = {
                shipComponents: this.shipComponents,
                generateShipName: () => {
                    const prefixes = ['SS', 'HMS', 'Flying', 'Black'];
                    const names = ['Pearl', 'Revenge', 'Dragon', 'Storm'];
                    return `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${names[Math.floor(Math.random() * names.length)]}`;
                }
            };
        }
        
        // Override AI graphics generation with local sprites
        if (mobileIdleTycoon.generateAIGraphics) {
            const originalGenerate = mobileIdleTycoon.generateAIGraphics;
            mobileIdleTycoon.generateAIGraphics = async (prompt, type) => {
                console.log(`🎨 Using local sprite instead of AI for: ${prompt}`);
                
                // Return data URL with emoji/ASCII art
                const sprites = {
                    building: '🏗️',
                    ship: '🚢',
                    character: '🏴‍☠️',
                    island: '🏝️'
                };
                
                return `data:text/plain,${sprites[type] || '❓'}`;
            };
        }
        
        console.log('✅ Systems connected locally - no external dependencies');
    }
    
    // Generate a complete game config without external deps
    generateLocalConfig() {
        return {
            game: {
                title: 'Pirate Islands Clash - Local Edition',
                version: '1.0.0-local'
            },
            features: {
                ai_graphics: false,
                external_api: false,
                wallet_integration: false,
                local_save: true
            },
            resources: {
                starting: {
                    gold: 1000,
                    wood: 1000,
                    cannons: 50,
                    rum: 100
                },
                caps: {
                    gold: 100000,
                    wood: 50000,
                    cannons: 10000,
                    rum: 20000
                }
            },
            gameplay: {
                offline_rate: 0.5,
                online_rate: 1.0,
                battle_cooldown: 300000, // 5 minutes
                building_instant: true    // No wait times locally
            }
        };
    }
    
    // Create a simple game loop without external services
    createLocalGameLoop(game) {
        console.log('🎮 Starting local game loop...');
        
        // Resource production every second
        setInterval(() => {
            if (game.gameState && game.gameState.buildings) {
                game.processProduction();
            }
        }, 1000);
        
        // Auto-save every 30 seconds (local only)
        setInterval(() => {
            if (game.saveGame) {
                game.saveGame().catch(err => {
                    console.error('Local save failed:', err);
                });
            }
        }, 30000);
        
        console.log('✅ Local game loop running');
    }
}

// Export for use
module.exports = SimpleConnector;

// CLI interface
if (require.main === module) {
    console.log('🔌 Simple Connector Test Mode');
    
    const connector = new SimpleConnector();
    const config = connector.generateLocalConfig();
    
    console.log('\n📋 Local Configuration:');
    console.log(JSON.stringify(config, null, 2));
    
    console.log('\n🏴‍☠️ Available Devil Fruits:');
    Object.entries(connector.devilFruits).forEach(([key, fruit]) => {
        console.log(`  ${fruit.name} - ${fruit.description}`);
    });
    
    console.log('\n🚢 Ship Components:');
    console.log('  Hulls:', Object.keys(connector.shipComponents.hulls).join(', '));
    console.log('  Sails:', Object.keys(connector.shipComponents.sails).join(', '));
    console.log('  Weapons:', Object.keys(connector.shipComponents.weapons).join(', '));
    
    console.log('\n🏗️ Building Types:');
    Object.entries(connector.buildingTypes).forEach(([key, building]) => {
        console.log(`  ${building.sprite} ${building.name}`);
    });
    
    console.log('\n✅ Simple Connector ready for local-only operation');
}