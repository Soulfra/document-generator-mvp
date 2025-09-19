#!/usr/bin/env node

/**
 * 🎮🔗 CLICKING COMBAT INTEGRATION 🔗🎮
 * 
 * Integrates all clicking combat components:
 * - Clicking Combat Boss System
 * - Cursor Boss Battle Arena
 * - Click Mechanics Engine
 * - Boss Hand AI System
 */

const ClickingCombatBossSystem = require('./clicking-combat-boss-system');
const ClickMechanicsEngine = require('./click-mechanics-engine');
const BossHandAISystem = require('./boss-hand-ai-system');

class ClickingCombatIntegration {
    constructor() {
        console.log('🎮🔗 CLICKING COMBAT INTEGRATION');
        console.log('================================');
        console.log('Connecting all combat systems...');
        console.log('');
        
        this.initializeSystems();
    }
    
    async initializeSystems() {
        console.log('🔧 Initializing integrated combat system...');
        
        try {
            // Initialize core systems
            this.combatSystem = new ClickingCombatBossSystem();
            this.clickEngine = new ClickMechanicsEngine();
            this.aiSystem = new BossHandAISystem();
            
            // Setup system connections
            await this.connectSystems();
            
            // Create integrated combat flow
            await this.setupCombatFlow();
            
            console.log('✅ All systems integrated!');
            
        } catch (error) {
            console.error('❌ Integration failed:', error);
            throw error;
        }
    }
    
    async connectSystems() {
        console.log('\n🔗 Connecting combat systems...');
        
        // Connect click engine to combat system
        this.clickEngine.on('click_processed', (data) => {
            this.combatSystem.processClick(data.sessionId, {
                ...data.result,
                playerId: data.playerId || 'player-001',
                position: data.position || { x: 0, y: 0 },
                timestamp: Date.now()
            });
        });
        
        // Connect combat system to AI
        this.combatSystem.on('combat_started', (data) => {
            const ai = this.aiSystem.createBossAI(
                data.boss,
                this.determineSearchComplexity(data.boss)
            );
            
            console.log(`🤖 AI created for boss: ${data.boss.name}`);
        });
        
        // Connect AI decisions to combat
        this.combatSystem.on('boss_ai_tick', async (data) => {
            const gameState = {
                boss: data.boss,
                playerPosition: data.playerPosition,
                playerId: data.playerId,
                phase: data.boss.phase
            };
            
            const decision = await this.aiSystem.makeDecision(
                data.aiId,
                gameState
            );
            
            if (decision) {
                this.executeBossAction(data.sessionId, decision);
            }
        });
        
        // Connect combat events to AI learning
        this.combatSystem.on('hit_landed', (data) => {
            this.aiSystem.updateAI(data.aiId, {
                type: 'attack_missed',
                playerId: data.playerId,
                position: data.position
            });
        });
        
        console.log('✅ Systems connected');
    }
    
    async setupCombatFlow() {
        console.log('\n⚔️ Setting up integrated combat flow...');
        
        this.combatFlow = {
            // Start a new combat session
            startCombat: async (manufacturingData) => {
                console.log(`\n🎮 Starting integrated combat with ${manufacturingData.type}...`);
                
                // Create boss from manufacturing data
                const boss = await this.combatSystem.createBoss(manufacturingData);
                
                // Start combat session
                const session = await this.combatSystem.startCombat(boss.id);
                
                // Create click session for player
                const clickSession = this.clickEngine.createSession('player-001', {
                    bossId: boss.id,
                    sessionId: session.id
                });
                
                // Create AI for boss
                const ai = this.aiSystem.createBossAI(
                    boss,
                    this.determineSearchComplexity(manufacturingData)
                );
                
                return {
                    combatSession: session,
                    clickSession: clickSession,
                    boss: boss,
                    ai: ai
                };
            },
            
            // Process player click
            processPlayerClick: async (sessionId, clickData) => {
                // Process through click mechanics engine first
                const clickResult = this.clickEngine.processClick(sessionId, {
                    ...clickData,
                    baseDamage: 10,
                    targetData: { weakSpots: this.getWeakSpots(clickData.bossType) }
                });
                
                // Then process through combat system
                const combatResult = await this.combatSystem.processClick(
                    clickData.combatSessionId,
                    {
                        ...clickData,
                        ...clickResult,
                        playerId: 'player-001',
                        targetData: { position: { x: 400, y: 300 } }
                    }
                );
                
                return {
                    click: clickResult,
                    combat: combatResult
                };
            }
        };
        
        console.log('✅ Combat flow configured');
    }
    
    determineSearchComplexity(data) {
        const complexity = data.searchComplexity || data.metadata?.searchComplexity || 0.5;
        
        if (complexity < 0.3) return 'simple';
        if (complexity < 0.6) return 'moderate';
        if (complexity < 0.8) return 'complex';
        return 'extreme';
    }
    
    getWeakSpots(bossType) {
        const weakSpots = {
            'master_hand': [
                { x: 0.5, y: 0.6, radius: 50, name: 'palm' },
                { x: 0.3, y: 0.3, radius: 30, name: 'finger' }
            ],
            'crazy_hand': [
                { x: 0.5, y: 0.9, radius: 40, name: 'wrist' }
            ]
        };
        
        return weakSpots[bossType] || [];
    }
    
    executeBossAction(sessionId, decision) {
        // Execute the AI's decision
        console.log(`🤜 Boss executing: ${decision.action || decision.name}`);
        
        // This would trigger the actual attack in the arena
        this.combatSystem.emit('boss_execute_attack', {
            sessionId,
            decision
        });
    }
    
    // Demo combat
    async runDemoCombat() {
        console.log('\n🎮 RUNNING DEMO COMBAT...');
        
        const demoManufacturing = {
            id: 'demo-entity-001',
            type: 'humanoid',
            name: 'Demo Boss',
            qualityScore: 0.9,
            searchComplexity: 0.7,
            metadata: {
                isSearchGenerated: true,
                searchQuery: 'epic battle boss'
            }
        };
        
        const combat = await this.combatFlow.startCombat(demoManufacturing);
        
        console.log('\n📊 Combat Started:');
        console.log(`  • Boss: ${combat.boss.name}`);
        console.log(`  • Health: ${combat.boss.maxHealth}`);
        console.log(`  • AI Difficulty: ${combat.ai.difficulty}`);
        
        // Simulate some clicks
        console.log('\n🖱️ Simulating player clicks...');
        
        for (let i = 0; i < 5; i++) {
            const clickResult = await this.combatFlow.processPlayerClick(
                combat.clickSession.id,
                {
                    combatSessionId: combat.combatSession.id,
                    bossType: combat.boss.type,
                    position: {
                        x: 400 + Math.random() * 200,
                        y: 300 + Math.random() * 200
                    },
                    targetBounds: {
                        left: 300,
                        top: 200,
                        width: 400,
                        height: 400
                    }
                }
            );
            
            console.log(`  Click ${i + 1}: ${clickResult.click.damage} damage` +
                       (clickResult.click.critical.isCritical ? ' (CRITICAL!)' : ''));
            
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Get final stats
        const stats = this.clickEngine.getSessionStats(combat.clickSession.id);
        console.log('\n📈 Combat Stats:');
        console.log(`  • Total Clicks: ${stats.totalClicks}`);
        console.log(`  • Accuracy: ${stats.accuracy.toFixed(1)}%`);
        console.log(`  • Total Damage: ${stats.totalDamage}`);
        console.log(`  • Highest Combo: ${stats.highestCombo}`);
    }
}

// Export for use
module.exports = ClickingCombatIntegration;

// Run if called directly
if (require.main === module) {
    const integration = new ClickingCombatIntegration();
    
    setTimeout(async () => {
        console.log('\n🎯 CLICKING COMBAT INTEGRATION COMPLETE!');
        console.log('=====================================');
        console.log('✅ Clicking Combat Boss System');
        console.log('✅ Click Mechanics Engine');
        console.log('✅ Boss Hand AI System');
        console.log('✅ All systems connected and integrated');
        
        console.log('\n🎮 FEATURES:');
        console.log('  • Master Hand/Crazy Hand style bosses');
        console.log('  • Advanced clicking mechanics with combos');
        console.log('  • AI that adapts to player behavior');
        console.log('  • Critical hit zones and timing windows');
        console.log('  • Rage and desperation mechanics');
        console.log('  • Manufactured entities become hand bosses');
        
        // Run demo
        await integration.runDemoCombat();
        
    }, 2000);
}