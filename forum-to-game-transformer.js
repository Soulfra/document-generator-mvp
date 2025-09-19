#!/usr/bin/env node

/**
 * 🎮 FORUM TO GAME TRANSFORMER
 * 
 * Transforms forum posts into game events
 * Decrypts content and dispatches to appropriate gaming layers
 */

const EventEmitter = require('events');

class ForumToGameTransformer extends EventEmitter {
    constructor() {
        super();
        
        this.apiBridge = require('./api-to-forum-bridge');
        this.encryptHandler = require('./encrypted-prompt-handler');
        this.portManager = require('./empire-port-manager');
        
        // Game event types mapped to gaming layers
        this.eventMappings = {
            // Code generation = Building structures in 3D
            'code_generation': {
                eventType: 'BUILD_STRUCTURE',
                layer: '3d',
                port: 7000,
                visuals: {
                    effect: 'construction',
                    particles: 'sparks',
                    sound: 'building.wav'
                }
            },
            
            // Data analysis = Exploring dungeons in 2.5D
            'data_analysis': {
                eventType: 'EXPLORE_DUNGEON',
                layer: '2.5d',
                port: 7500,
                visuals: {
                    effect: 'fog_reveal',
                    particles: 'dust',
                    sound: 'explore.wav'
                }
            },
            
            // API integration = Connecting portals in 2D
            'api_integration': {
                eventType: 'CONNECT_PORTALS',
                layer: '2d',
                port: 8000,
                visuals: {
                    effect: 'portal_link',
                    particles: 'energy',
                    sound: 'portal.wav'
                }
            },
            
            // MVP generation = Epic boss battle across all layers
            'mvp_generation': {
                eventType: 'BOSS_BATTLE',
                layer: 'multi',
                port: 8500,
                visuals: {
                    effect: 'epic_summon',
                    particles: 'fire_ice',
                    sound: 'boss_music.wav'
                }
            },
            
            // Template selection = Choosing equipment
            'template_selection': {
                eventType: 'EQUIP_ITEM',
                layer: '2d',
                port: 8000,
                visuals: {
                    effect: 'item_glow',
                    particles: 'sparkle',
                    sound: 'equip.wav'
                }
            },
            
            // Todo workflow game events
            'todo_created': {
                eventType: 'QUEST_INITIATED',
                layer: '2d',
                port: 8000,
                visuals: {
                    effect: 'quest_marker',
                    particles: 'sparkle',
                    sound: 'quest_start.wav'
                }
            },
            
            'todo_analysis': {
                eventType: 'WISDOM_CONSULTATION',
                layer: '2.5d',
                port: 7500,
                visuals: {
                    effect: 'oracle_glow',
                    particles: 'wisdom_motes',
                    sound: 'insight.wav'
                }
            },
            
            'todo_feedback': {
                eventType: 'KNOWLEDGE_GAINED',
                layer: '2.5d',
                port: 7500,
                visuals: {
                    effect: 'knowledge_orb',
                    particles: 'enlightenment',
                    sound: 'wisdom_gain.wav'
                }
            },
            
            'todo_progress': {
                eventType: 'QUEST_PROGRESS',
                layer: '2d',
                port: 8000,
                visuals: {
                    effect: 'progress_bar',
                    particles: 'achievement',
                    sound: 'progress.wav'
                }
            },
            
            'todo_completed': {
                eventType: 'QUEST_COMPLETED',
                layer: 'multi',
                port: 8500,
                visuals: {
                    effect: 'victory_celebration',
                    particles: 'confetti',
                    sound: 'victory.wav'
                }
            },
            
            'todo_blocked': {
                eventType: 'OBSTACLE_ENCOUNTERED',
                layer: '2.5d',
                port: 7500,
                visuals: {
                    effect: 'warning_pulse',
                    particles: 'caution',
                    sound: 'obstacle.wav'
                }
            },
            
            // External LLM workflow events
            'llm_consultation': {
                eventType: 'ANCIENT_WISDOM_RITUAL',
                layer: '3d',
                port: 7000,
                visuals: {
                    effect: 'mystical_portal',
                    particles: 'arcane_energy',
                    sound: 'mystical_chant.wav'
                }
            },
            
            'feedback_loop_active': {
                eventType: 'COMMUNICATION_NETWORK',
                layer: '2d',
                port: 8000,
                visuals: {
                    effect: 'network_links',
                    particles: 'data_streams',
                    sound: 'network_hum.wav'
                }
            }
        };
        
        // Quest tracking
        this.activeQuests = new Map();
        
        console.log('🎮 Forum to Game Transformer initialized');
    }
    
    async transformForumPost(forumPost) {
        console.log(`🔄 Transforming forum post: ${forumPost.title}`);
        
        try {
            // 1. Decrypt the forum content
            const decrypted = await this.decryptForumContent(forumPost);
            
            if (!decrypted.success) {
                throw new Error(`Decryption failed: ${decrypted.error}`);
            }
            
            // 2. Analyze content type and intent
            const contentAnalysis = this.analyzeContent(decrypted.data);
            
            // 3. Create game event based on content type
            const gameEvent = await this.createGameEvent(contentAnalysis, decrypted.data);
            
            // 4. Add quest tracking
            this.trackQuest(gameEvent);
            
            // 5. Dispatch to appropriate gaming layer
            const dispatchResult = await this.dispatchToGaming(gameEvent);
            
            // 6. Emit transformation complete event
            this.emit('transformation:complete', {
                forumPost,
                gameEvent,
                dispatchResult
            });
            
            console.log(`✅ Transformed to game event: ${gameEvent.type} on ${gameEvent.layer} layer`);
            
            return {
                success: true,
                gameEvent,
                dispatchResult,
                questId: gameEvent.questId
            };
            
        } catch (error) {
            console.error('❌ Forum to game transformation failed:', error);
            
            // Create error event
            const errorEvent = this.createErrorEvent(forumPost, error);
            await this.dispatchToGaming(errorEvent);
            
            return {
                success: false,
                error: error.message,
                errorEvent
            };
        }
    }
    
    async decryptForumContent(forumPost) {
        // Extract mapping ID from forum post
        const mappingIdMatch = forumPost.content.match(/Mapping ID: (.+)/);
        
        if (!mappingIdMatch) {
            // Try to decrypt directly if no mapping
            return this.directDecrypt(forumPost);
        }
        
        // Use API bridge to decrypt
        const bridge = new this.apiBridge();
        return await bridge.decryptForumPost(forumPost.id);
    }
    
    directDecrypt(forumPost) {
        // Attempt to extract and decrypt inline content
        try {
            const encryptedMatch = forumPost.content.match(/```encrypted\n(.+)\n```/s);
            
            if (encryptedMatch) {
                const encryptedData = JSON.parse(encryptedMatch[1]);
                const decrypted = this.encryptHandler.decryptPrompt(encryptedData);
                
                return {
                    success: true,
                    data: JSON.parse(decrypted)
                };
            }
            
            // No encrypted content, use raw
            return {
                success: true,
                data: {
                    type: 'general',
                    content: forumPost.content,
                    title: forumPost.title
                }
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    analyzeContent(decryptedData) {
        // Determine content type and complexity
        const analysis = {
            type: decryptedData.type || 'general',
            complexity: 'medium',
            entities: [],
            actions: [],
            resources: []
        };
        
        // Analyze complexity based on content
        if (decryptedData.mvp) {
            analysis.complexity = 'epic';
            analysis.entities.push('MVP', 'Architecture', 'Template');
            analysis.actions.push('generate', 'deploy', 'test');
            analysis.resources = Object.keys(decryptedData.mvp);
        } else if (decryptedData.code) {
            analysis.complexity = 'high';
            analysis.entities.push('Code', 'Framework', 'Dependencies');
            analysis.actions.push('write', 'compile', 'run');
            analysis.resources = [decryptedData.code.language];
        } else if (decryptedData.api) {
            analysis.complexity = 'medium';
            analysis.entities.push('API', 'Endpoints', 'Integration');
            analysis.actions.push('connect', 'authenticate', 'query');
        }
        
        return analysis;
    }
    
    async createGameEvent(analysis, data) {
        const mapping = this.eventMappings[analysis.type] || this.eventMappings['data_analysis'];
        
        const gameEvent = {
            id: crypto.randomUUID(),
            type: mapping.eventType,
            layer: mapping.layer,
            port: mapping.port,
            timestamp: Date.now(),
            questId: `QUEST_${Date.now()}`,
            
            // Game data
            data: {
                original: data,
                analysis,
                complexity: analysis.complexity,
                entities: analysis.entities,
                actions: analysis.actions
            },
            
            // Visual effects
            visuals: mapping.visuals,
            
            // Player/Agent info
            player: {
                id: data.agentId || 'system',
                type: data.authorType || 'ai_agent',
                level: this.calculateLevel(analysis.complexity)
            },
            
            // Rewards
            rewards: this.calculateRewards(analysis),
            
            // Game mechanics
            mechanics: {
                health: 100,
                mana: 100,
                stamina: 100,
                experience: 0
            }
        };
        
        // Add specific game mechanics based on type
        if (mapping.eventType === 'BUILD_STRUCTURE') {
            gameEvent.building = {
                type: data.code?.framework || 'generic',
                materials: analysis.resources,
                blueprint: data.code?.structure || {}
            };
        } else if (mapping.eventType === 'EXPLORE_DUNGEON') {
            gameEvent.dungeon = {
                depth: analysis.entities.length,
                monsters: this.generateMonsters(analysis),
                treasure: analysis.resources
            };
        } else if (mapping.eventType === 'CONNECT_PORTALS') {
            gameEvent.portals = {
                source: data.api?.source || 'origin',
                destination: data.api?.target || 'destination',
                energy: analysis.complexity === 'high' ? 1000 : 500
            };
        } else if (mapping.eventType === 'BOSS_BATTLE') {
            gameEvent.boss = {
                name: data.mvp?.name || 'The Architect',
                health: 10000,
                phases: 3,
                abilities: analysis.actions,
                loot: this.generateBossLoot(data.mvp)
            };
        }
        
        return gameEvent;
    }
    
    calculateLevel(complexity) {
        const levels = {
            'low': 1,
            'medium': 5,
            'high': 10,
            'epic': 20
        };
        return levels[complexity] || 1;
    }
    
    calculateRewards(analysis) {
        const baseRewards = {
            experience: 100 * analysis.entities.length,
            gold: 50 * analysis.actions.length,
            items: []
        };
        
        // Add special items based on complexity
        if (analysis.complexity === 'epic') {
            baseRewards.items.push({
                name: 'Epic Blueprint',
                type: 'legendary',
                bonus: '+50% build speed'
            });
            baseRewards.experience *= 10;
            baseRewards.gold *= 10;
        } else if (analysis.complexity === 'high') {
            baseRewards.items.push({
                name: 'Rare Component',
                type: 'rare',
                bonus: '+25% efficiency'
            });
            baseRewards.experience *= 5;
            baseRewards.gold *= 5;
        }
        
        return baseRewards;
    }
    
    generateMonsters(analysis) {
        const monsters = [];
        
        for (let i = 0; i < analysis.entities.length; i++) {
            monsters.push({
                name: `Data ${analysis.entities[i]}`,
                health: 100 + (i * 50),
                damage: 10 + (i * 5),
                loot: {
                    experience: 50,
                    gold: 25,
                    items: Math.random() > 0.7 ? ['data_crystal'] : []
                }
            });
        }
        
        return monsters;
    }
    
    generateBossLoot(mvpData) {
        if (!mvpData) return [];
        
        return [
            {
                name: `${mvpData.name} Blueprint`,
                type: 'legendary',
                description: 'Complete architectural plans'
            },
            {
                name: 'Template Mastery Scroll',
                type: 'epic',
                description: `Grants knowledge of ${mvpData.template}`
            },
            {
                name: 'Deployment Crystal',
                type: 'rare',
                description: 'Instantly deploy any project'
            }
        ];
    }
    
    trackQuest(gameEvent) {
        const quest = {
            id: gameEvent.questId,
            name: `${gameEvent.type} Quest`,
            description: `Complete the ${gameEvent.type} challenge`,
            objectives: gameEvent.data.actions.map(action => ({
                action,
                completed: false,
                progress: 0
            })),
            rewards: gameEvent.rewards,
            startTime: Date.now(),
            status: 'active'
        };
        
        this.activeQuests.set(quest.id, quest);
        
        // Emit quest started event
        this.emit('quest:started', quest);
        
        return quest;
    }
    
    async dispatchToGaming(gameEvent) {
        try {
            // Get the appropriate port for this game layer
            const port = await this.portManager.requestPort(
                gameEvent.layer,
                `game_${gameEvent.type}`
            );
            
            // Create dispatch package
            const dispatchPackage = {
                event: gameEvent,
                routing: {
                    layer: gameEvent.layer,
                    port: port || gameEvent.port,
                    protocol: 'websocket'
                },
                metadata: {
                    dispatchTime: Date.now(),
                    transformer: 'forum-to-game',
                    version: '1.0.0'
                }
            };
            
            // Emit to gaming layer
            this.emit('dispatch:gaming', dispatchPackage);
            
            // Log dispatch
            console.log(`📤 Dispatched ${gameEvent.type} to ${gameEvent.layer} layer on port ${port}`);
            
            return {
                success: true,
                port,
                layer: gameEvent.layer,
                eventId: gameEvent.id
            };
            
        } catch (error) {
            console.error('❌ Dispatch failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    createErrorEvent(forumPost, error) {
        return {
            id: crypto.randomUUID(),
            type: 'ERROR_ENCOUNTER',
            layer: '2d',
            port: 8000,
            timestamp: Date.now(),
            data: {
                forumPost,
                error: error.message,
                stack: error.stack
            },
            visuals: {
                effect: 'error_flash',
                particles: 'smoke',
                sound: 'error.wav'
            },
            rewards: {
                experience: 10,
                gold: 5,
                items: [{
                    name: 'Bug Report',
                    type: 'common',
                    description: 'Document this error for debugging'
                }]
            }
        };
    }
    
    // Get quest status
    getQuestStatus(questId) {
        return this.activeQuests.get(questId);
    }
    
    // Update quest progress
    updateQuestProgress(questId, objective, progress) {
        const quest = this.activeQuests.get(questId);
        if (!quest) return false;
        
        const obj = quest.objectives.find(o => o.action === objective);
        if (obj) {
            obj.progress = progress;
            obj.completed = progress >= 100;
            
            // Check if quest is complete
            if (quest.objectives.every(o => o.completed)) {
                quest.status = 'completed';
                quest.completedTime = Date.now();
                
                this.emit('quest:completed', quest);
            }
            
            return true;
        }
        
        return false;
    }
}

module.exports = ForumToGameTransformer;

// Demo if run directly
if (require.main === module) {
    const crypto = require('crypto');
    
    const demo = async () => {
        console.log('🎮 FORUM TO GAME TRANSFORMER DEMO');
        console.log('=================================\n');
        
        const transformer = new ForumToGameTransformer();
        
        // Listen to events
        transformer.on('quest:started', (quest) => {
            console.log(`\n🎯 Quest Started: ${quest.name}`);
            console.log(`📋 Objectives: ${quest.objectives.map(o => o.action).join(', ')}`);
        });
        
        transformer.on('dispatch:gaming', (package) => {
            console.log(`\n📤 Dispatching to Gaming Layer:`);
            console.log(`   Layer: ${package.routing.layer}`);
            console.log(`   Port: ${package.routing.port}`);
            console.log(`   Event: ${package.event.type}`);
        });
        
        // Test forum post (MVP generation)
        const testForumPost = {
            id: 123,
            title: '🚀 New MVP Generated: TaskFlow',
            content: `## 🚀 New MVP Generated: TaskFlow

**Posted by:** API Bridge Bot
**Time:** 2024-01-15 10:30:00
**Type:** mvp_generation

### Summary
Welcome, brave entrepreneur! You're embarking on an epic quest: developing your e-commerce platform and sales infrastructure.

### Details
- **Endpoint:** /api/mvp/generate
- **Privacy Level:** high
- **Data Protected:** No

### Reference
\`\`\`
Mapping ID: 2024-01-15T10:30:00.000Z
\`\`\``,
            author_id: 'api-bridge',
            board: 'mvp-showcase'
        };
        
        // Transform the forum post
        const result = await transformer.transformForumPost(testForumPost);
        
        console.log('\n📊 Transformation Result:');
        console.log(`✅ Success: ${result.success}`);
        console.log(`🎮 Game Event: ${result.gameEvent?.type}`);
        console.log(`🌍 Layer: ${result.gameEvent?.layer}`);
        console.log(`🏆 Rewards: ${result.gameEvent?.rewards.experience} XP, ${result.gameEvent?.rewards.gold} Gold`);
        
        if (result.gameEvent?.boss) {
            console.log(`\n👾 Boss Battle: ${result.gameEvent.boss.name}`);
            console.log(`❤️ Boss Health: ${result.gameEvent.boss.health}`);
            console.log(`⚔️ Phases: ${result.gameEvent.boss.phases}`);
        }
        
        // Check quest status
        if (result.questId) {
            const quest = transformer.getQuestStatus(result.questId);
            console.log(`\n📜 Quest Status: ${quest.status}`);
        }
    };
    
    demo().catch(console.error);
}