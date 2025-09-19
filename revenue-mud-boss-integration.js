#!/usr/bin/env node

/**
 * 🎮⚔️ REVENUE MUD BOSS INTEGRATION
 * Connects boss battles, loot system, and multi-currency economy to the Revenue MUD
 * Enables viewer participation and autonomous agent combat
 */

const BossBattleSystem = require('./boss-battle-system.js');
const GamingEconomySystem = require('./gaming-economy-system.js');
const SonarBossDetector = require('./sonar-boss-detector.js');
const HardwareOrchestrator = require('./hardware-orchestrator.js');

class RevenueMUDBossIntegration {
    constructor(mudEngine, streamLayer) {
        this.mudEngine = mudEngine;
        this.streamLayer = streamLayer;
        
        // Initialize gaming systems
        this.bossSystem = new BossBattleSystem(mudEngine, streamLayer);
        this.economy = new GamingEconomySystem();
        this.sonar = new SonarBossDetector(this.bossSystem, mudEngine);
        this.hardware = new HardwareOrchestrator();
        
        // Boss spawn locations and triggers
        this.bossSpawnPoints = new Map([
            ['debug_chamber', { 
                bosses: ['bug_hydra', 'data_dragon'], 
                spawnChance: 0.3,
                lastSpawn: 0
            }],
            ['cal_shrine', { 
                bosses: ['cal_nightmare'], 
                spawnChance: 0.5,
                lastSpawn: 0
            }],
            ['repository_core', { 
                bosses: ['merge_conflict', 'data_dragon'], 
                spawnChance: 0.4,
                lastSpawn: 0
            }],
            ['terminal_nexus', { 
                bosses: ['cal_nightmare', 'bug_hydra'], 
                spawnChance: 0.2,
                lastSpawn: 0
            }]
        ]);
        
        // Player currency wallets
        this.playerWallets = new Map();
        
        this.setupIntegration();
        console.log('⚔️💰 Boss Integration System loaded');
    }
    
    setupIntegration() {
        // Hook into MUD player actions to trigger boss spawns
        this.mudEngine.on('player_action', (data) => {
            this.checkBossSpawnTrigger(data);
        });
        
        // Hook into room exploration
        this.mudEngine.on('room_entered', (playerId, roomId) => {
            this.handleRoomEntry(playerId, roomId);
        });
        
        // Listen for boss battle events
        this.bossSystem.on('boss_spawned', (battle) => {
            this.announceBossSpawn(battle);
            this.triggerHardwareBossSpawn(battle);
        });
        
        this.bossSystem.on('player_rewards', (rewardData) => {
            this.distributePlayerRewards(rewardData);
        });
        
        this.bossSystem.on('viewer_rewards', (rewardData) => {
            this.distributeViewerRewards(rewardData);
        });
        
        this.bossSystem.on('battle_event', (eventData) => {
            this.handleBattleHardwareEffects(eventData);
        });
        
        // Add new MUD commands
        this.addBossCommands();
        
        // Add economic commands
        this.addEconomyCommands();
    }
    
    checkBossSpawnTrigger(actionData) {
        const { playerId, action, roomId, params } = actionData;
        
        // Check if room has boss spawn potential
        const spawnPoint = this.bossSpawnPoints.get(roomId);
        if (!spawnPoint) return;
        
        // Cooldown check (5 minutes between spawns)
        const now = Date.now();
        if (now - spawnPoint.lastSpawn < 300000) return;
        
        // Trigger conditions
        let shouldSpawn = false;
        
        switch (action) {
            case 'look':
                // Rare chance on room inspection
                shouldSpawn = Math.random() < 0.05;
                break;
                
            case 'emacs':
                // Higher chance when using emacs commands
                shouldSpawn = Math.random() < 0.15;
                break;
                
            case 'debug':
                // High chance in debug actions
                shouldSpawn = Math.random() < 0.25;
                break;
                
            case 'cal_summon':
                // Always spawn boss when Cal is summoned
                shouldSpawn = true;
                break;
                
            default:
                // General action spawn chance
                shouldSpawn = Math.random() < spawnPoint.spawnChance * 0.1;
        }
        
        if (shouldSpawn) {
            // Select random boss from spawn point
            const availableBosses = spawnPoint.bosses;
            const selectedBoss = availableBosses[Math.floor(Math.random() * availableBosses.length)];
            
            // Spawn boss
            const battle = this.bossSystem.spawnBoss(roomId, selectedBoss, `player_action:${action}`);
            spawnPoint.lastSpawn = now;
            
            console.log(`⚔️ Boss spawned: ${selectedBoss} in ${roomId} (triggered by ${action})`);
        }
    }
    
    handleRoomEntry(playerId, roomId) {
        const player = this.mudEngine.players.get(playerId);
        if (!player) return;
        
        // Initialize player wallet if needed
        if (!this.playerWallets.has(playerId)) {
            this.playerWallets.set(playerId, {
                bits: 10,      // Starting bits
                tokens: 0,     // Premium currency
                coins: 100,    // Starting coins
                shards: 0      // Rare currency
            });
        }
        
        // Check for loot spawns in room
        this.checkLootSpawns(playerId, roomId);
        
        // Check for active bosses in room
        const activeBosses = Array.from(this.bossSystem.activeBattles.values())
            .filter(battle => battle.boss.roomId === roomId && battle.status === 'active');
        
        if (activeBosses.length > 0) {
            // Auto-join player to boss battle
            const battle = activeBosses[0];
            try {
                this.bossSystem.joinBattle(battle.boss.id, playerId, {
                    name: player.name,
                    health: 100,
                    maxHealth: 100,
                    damage: 15
                });
                
                this.mudEngine.sendToPlayer(playerId, {
                    type: 'boss_encounter',
                    message: `🚨 You've entered an active boss battle! ${battle.boss.name} is here!`,
                    boss: battle.boss,
                    commands: ['!attack', '!defend', '!flee']
                });
            } catch (error) {
                console.error('Failed to join boss battle:', error);
            }
        }
    }
    
    checkLootSpawns(playerId, roomId) {
        // 5% chance for loot to spawn when entering room
        if (Math.random() < 0.05) {
            const loot = this.economy.generateLootDrop(1, 0);
            
            // Add loot to room
            if (!this.mudEngine.rooms.get(roomId).loot) {
                this.mudEngine.rooms.get(roomId).loot = [];
            }
            this.mudEngine.rooms.get(roomId).loot.push(loot);
            
            this.mudEngine.sendToPlayer(playerId, {
                type: 'loot_spawn',
                message: `✨ You spot something glinting: ${loot.name}!`,
                loot: loot,
                commands: ['!take ' + loot.id]
            });
            
            // Notify stream if rare
            if (loot.rarity === 'rare' || loot.rarity === 'epic' || loot.rarity === 'legendary') {
                if (this.streamLayer) {
                    this.streamLayer.broadcastToOverlays({
                        type: 'rare_loot_spawn',
                        player: this.mudEngine.players.get(playerId).name,
                        loot: loot,
                        room: roomId
                    });
                }
            }
        }
    }
    
    announceBossSpawn(battle) {
        const boss = battle.boss;
        
        // Notify all players in room
        this.mudEngine.broadcastToRoom(boss.roomId, {
            type: 'boss_spawn_alert',
            message: `🚨 BOSS ALERT! ${boss.spawnMessage}`,
            boss: {
                name: boss.name,
                level: boss.level,
                health: boss.health,
                maxHealth: boss.maxHealth
            },
            commands: ['!join', '!attack', '!info']
        });
        
        // Notify stream viewers
        if (this.streamLayer) {
            this.streamLayer.broadcastToOverlays({
                type: 'boss_spawn_announcement',
                boss: boss,
                message: `BOSS BATTLE: ${boss.name} has spawned! Viewers can help with !cheer, !heal, !sabotage`,
                viewerCommands: ['!cheer <bits>', '!heal', '!sabotage', '!buff']
            });
        }
        
        console.log(`📢 Boss announcement: ${boss.name} in ${boss.roomId}`);
    }
    
    distributePlayerRewards(rewardData) {
        const { playerId, playerName, rewards, loot } = rewardData;
        
        // Add currency to player wallet
        const wallet = this.playerWallets.get(playerId);
        if (wallet && rewards) {
            Object.entries(rewards).forEach(([currency, amount]) => {
                wallet[currency] = (wallet[currency] || 0) + amount;
            });
        }
        
        // Add loot to player inventory
        const player = this.mudEngine.players.get(playerId);
        if (player && loot && loot.length > 0) {
            if (!player.inventory) player.inventory = [];
            player.inventory.push(...loot);
        }
        
        // Send reward notification
        this.mudEngine.sendToPlayer(playerId, {
            type: 'boss_victory_rewards',
            message: `🏆 Victory! You earned: ${this.formatCurrencyRewards(rewards)}`,
            rewards: rewards,
            loot: loot,
            newWallet: wallet
        });
        
        console.log(`💰 Rewards distributed to ${playerName}:`, rewards);
    }
    
    distributeViewerRewards(rewardData) {
        const { viewerId, viewerName, rewards } = rewardData;
        
        // In a real system, this would update viewer's account
        // For now, just notify stream
        if (this.streamLayer) {
            this.streamLayer.broadcastToOverlays({
                type: 'viewer_reward',
                viewer: viewerName,
                rewards: rewards,
                message: `${viewerName} earned rewards for helping in battle!`
            });
        }
        
        console.log(`🎁 Viewer rewards for ${viewerName}:`, rewards);
    }
    
    addBossCommands() {
        // Join boss battle
        this.mudEngine.addCommand('join', (playerId, params) => {
            const player = this.mudEngine.players.get(playerId);
            if (!player) return;
            
            const roomId = player.currentRoom;
            const activeBosses = Array.from(this.bossSystem.activeBattles.values())
                .filter(battle => battle.boss.roomId === roomId && battle.status === 'active');
            
            if (activeBosses.length === 0) {
                return this.mudEngine.sendToPlayer(playerId, {
                    type: 'error',
                    message: 'No active boss battles in this room!'
                });
            }
            
            const battle = activeBosses[0];
            try {
                this.bossSystem.joinBattle(battle.boss.id, playerId, {
                    name: player.name,
                    health: 100,
                    maxHealth: 100,
                    damage: 15
                });
                
                return this.mudEngine.sendToPlayer(playerId, {
                    type: 'battle_join_success',
                    message: `⚔️ You joined the battle against ${battle.boss.name}!`
                });
            } catch (error) {
                return this.mudEngine.sendToPlayer(playerId, {
                    type: 'error',
                    message: error.message
                });
            }
        });
        
        // Attack boss
        this.mudEngine.addCommand('attack', (playerId, params) => {
            const player = this.mudEngine.players.get(playerId);
            if (!player) return;
            
            const roomId = player.currentRoom;
            const activeBosses = Array.from(this.bossSystem.activeBattles.values())
                .filter(battle => battle.boss.roomId === roomId && battle.status === 'active');
            
            if (activeBosses.length === 0) {
                return this.mudEngine.sendToPlayer(playerId, {
                    type: 'error',
                    message: 'No boss to attack here!'
                });
            }
            
            const battle = activeBosses[0];
            const attackType = params.type || 'basic';
            
            try {
                const result = this.bossSystem.attackBoss(battle.boss.id, playerId, attackType);
                
                return this.mudEngine.sendToPlayer(playerId, {
                    type: 'attack_result',
                    message: `⚔️ You deal ${result.damage} damage! Boss health: ${result.bossHealth || 'DEFEATED'}`,
                    result: result
                });
            } catch (error) {
                return this.mudEngine.sendToPlayer(playerId, {
                    type: 'error',
                    message: error.message
                });
            }
        });
        
        // Boss status
        this.mudEngine.addCommand('boss', (playerId, params) => {
            const player = this.mudEngine.players.get(playerId);
            if (!player) return;
            
            const roomId = player.currentRoom;
            const activeBosses = Array.from(this.bossSystem.activeBattles.values())
                .filter(battle => battle.boss.roomId === roomId && battle.status === 'active');
            
            if (activeBosses.length === 0) {
                return this.mudEngine.sendToPlayer(playerId, {
                    type: 'boss_status',
                    message: 'No active boss battles here.'
                });
            }
            
            const battle = activeBosses[0];
            const boss = battle.boss;
            const healthPercent = Math.floor((boss.health / boss.maxHealth) * 100);
            
            return this.mudEngine.sendToPlayer(playerId, {
                type: 'boss_status',
                message: `🐉 ${boss.name} (Level ${boss.level})\n` +
                        `❤️ Health: ${boss.health}/${boss.maxHealth} (${healthPercent}%)\n` +
                        `👥 Players: ${battle.players.size}\n` +
                        `⏱️ Duration: ${Math.floor((Date.now() - battle.startTime) / 1000)}s`,
                boss: boss,
                battle: {
                    players: battle.players.size,
                    duration: Date.now() - battle.startTime
                }
            });
        });
    }
    
    addEconomyCommands() {
        // Wallet status
        this.mudEngine.addCommand('wallet', (playerId, params) => {
            const wallet = this.playerWallets.get(playerId);
            if (!wallet) {
                this.playerWallets.set(playerId, { bits: 10, tokens: 0, coins: 100, shards: 0 });
                return this.mudEngine.sendToPlayer(playerId, {
                    type: 'wallet_created',
                    message: '💳 Wallet created! You start with 10 bits and 100 coins.'
                });
            }
            
            const wealth = this.economy.calculateTotalWealth(wallet);
            
            return this.mudEngine.sendToPlayer(playerId, {
                type: 'wallet_status',
                message: `💰 Your Wallet:\n` +
                        `🔷 Bits: ${wallet.bits}\n` +
                        `🪙 Tokens: ${wallet.tokens}\n` +
                        `🪙 Coins: ${wallet.coins}\n` +
                        `💎 Soul Shards: ${wallet.shards}\n` +
                        `📊 Wealth Tier: ${wealth.wealthTier} (${wealth.formatted} coins total)`,
                wallet: wallet,
                wealth: wealth
            });
        });
        
        // Exchange currency
        this.mudEngine.addCommand('exchange', (playerId, params) => {
            if (!params.amount || !params.from || !params.to) {
                return this.mudEngine.sendToPlayer(playerId, {
                    type: 'error',
                    message: 'Usage: exchange <amount> <from> <to>\nExample: exchange 100 coins bits'
                });
            }
            
            const wallet = this.playerWallets.get(playerId);
            if (!wallet) {
                return this.mudEngine.sendToPlayer(playerId, {
                    type: 'error',
                    message: 'You need a wallet first! Use "wallet" command.'
                });
            }
            
            const amount = parseInt(params.amount);
            if (wallet[params.from] < amount) {
                return this.mudEngine.sendToPlayer(playerId, {
                    type: 'error',
                    message: `Insufficient ${params.from}! You have ${wallet[params.from]}.`
                });
            }
            
            try {
                const exchange = this.economy.exchangeCurrency(amount, params.from, params.to);
                
                // Update wallet
                wallet[params.from] -= amount;
                wallet[params.to] = (wallet[params.to] || 0) + exchange.to.amount - exchange.fee;
                
                return this.mudEngine.sendToPlayer(playerId, {
                    type: 'exchange_success',
                    message: `💱 Exchanged ${exchange.from.amount} ${exchange.from.currency} → ${exchange.to.amount} ${exchange.to.currency} (Fee: ${exchange.fee})`,
                    exchange: exchange,
                    newWallet: wallet
                });
            } catch (error) {
                return this.mudEngine.sendToPlayer(playerId, {
                    type: 'error',
                    message: error.message
                });
            }
        });
        
        // Take loot
        this.mudEngine.addCommand('take', (playerId, params) => {
            const player = this.mudEngine.players.get(playerId);
            if (!player) return;
            
            const room = this.mudEngine.rooms.get(player.currentRoom);
            if (!room || !room.loot || room.loot.length === 0) {
                return this.mudEngine.sendToPlayer(playerId, {
                    type: 'error',
                    message: 'No loot to take here!'
                });
            }
            
            const lootId = params.item;
            const lootIndex = room.loot.findIndex(l => l.id === lootId || l.name.includes(lootId));
            
            if (lootIndex === -1) {
                return this.mudEngine.sendToPlayer(playerId, {
                    type: 'error',
                    message: 'Loot not found!'
                });
            }
            
            const loot = room.loot.splice(lootIndex, 1)[0];
            
            // Add to player inventory
            if (!player.inventory) player.inventory = [];
            player.inventory.push(loot);
            
            // Add currency value to wallet
            const wallet = this.playerWallets.get(playerId);
            if (wallet && loot.value) {
                Object.entries(loot.value).forEach(([currency, amount]) => {
                    wallet[currency] = (wallet[currency] || 0) + amount;
                });
            }
            
            return this.mudEngine.sendToPlayer(playerId, {
                type: 'loot_taken',
                message: `✨ You obtained: ${loot.name} (${loot.rarity})!\n` +
                        `💰 Value: ${this.formatCurrencyRewards(loot.value)}`,
                loot: loot,
                newWallet: wallet
            });
        });
        
        // Sonar command
        this.mudEngine.addCommand('sonar', (playerId, params) => {
            const contacts = this.sonar.getActiveContacts();
            const assessment = this.sonar.getThreatAssessment();
            
            if (contacts.length === 0) {
                return this.mudEngine.sendToPlayer(playerId, {
                    type: 'sonar_scan',
                    message: '📡 Sonar sweep complete. No contacts detected.\n\n' +
                            'All clear in your vicinity.'
                });
            }
            
            const contactList = contacts.map(contact => {
                const threat = contact.signature.threat.toUpperCase();
                const distance = Math.floor(contact.distance);
                return `• ${contact.name} - ${threat} (${distance}m)`;
            }).join('\n');
            
            return this.mudEngine.sendToPlayer(playerId, {
                type: 'sonar_scan',
                message: `📡 Sonar sweep complete. ${contacts.length} contacts detected:\n\n` +
                        contactList +
                        `\n\n🎯 Threat Assessment: ${assessment.threatScore} (${assessment.totalContacts} total contacts)`,
                contacts: contacts,
                assessment: assessment
            });
        });
    }
    
    // Viewer participation handler
    handleViewerAction(viewerId, viewerName, action, parameter, platform) {
        // Find active boss battles
        const activeBattles = Array.from(this.bossSystem.activeBattles.values())
            .filter(battle => battle.status === 'active');
        
        if (activeBattles.length === 0) {
            return { error: 'No active boss battles for viewers to join!' };
        }
        
        // Use first active battle
        const battle = activeBattles[0];
        
        return this.bossSystem.viewerParticipate(
            battle.boss.id,
            viewerId,
            viewerName,
            action,
            parameter
        );
    }
    
    formatCurrencyRewards(rewards) {
        if (!rewards) return 'none';
        
        const parts = [];
        Object.entries(rewards).forEach(([currency, amount]) => {
            if (amount > 0) {
                const symbol = this.economy.currencies[currency]?.symbol || currency;
                parts.push(`${symbol} ${amount}`);
            }
        });
        
        return parts.join(', ') || 'none';
    }
    
    // Hardware effect methods
    async triggerHardwareBossSpawn(battle) {
        const boss = battle.boss;
        
        console.log(`⚡ Triggering hardware effects for boss spawn: ${boss.name}`);
        
        try {
            // Boss-specific hardware effects
            const hardwareEffects = this.getBossHardwareEffects(boss);
            
            // Execute spawn sequence
            await this.hardware.executePhysicalAction('boss_battle_effect', {
                effectType: 'spawn',
                boss: boss,
                intensity: 1.0
            });
            
            // Boss-specific Arduino commands
            for (const effect of hardwareEffects.spawn) {
                await this.hardware.executePhysicalAction('arduino_command', {
                    deviceId: 'arduino_*',
                    command: effect.command,
                    commandParams: effect.params
                });
            }
            
            console.log(`✅ Hardware boss spawn effects completed for ${boss.name}`);
            
        } catch (error) {
            console.error('❌ Hardware boss spawn failed:', error.message);
        }
    }
    
    async handleBattleHardwareEffects(eventData) {
        const { bossId, event } = eventData;
        const battle = this.bossSystem.activeBattles.get(bossId);
        
        if (!battle) return;
        
        console.log(`⚡ Hardware effect for battle event: ${event.type}`);
        
        try {
            switch (event.type) {
                case 'player_attack':
                    await this.handlePlayerAttackHardware(battle, event.data);
                    break;
                    
                case 'boss_attack':
                    await this.handleBossAttackHardware(battle, event.data);
                    break;
                    
                case 'boss_defeated':
                    await this.handleBossDefeatHardware(battle, event.data);
                    break;
                    
                case 'viewer_action':
                    await this.handleViewerActionHardware(battle, event.data);
                    break;
            }
            
        } catch (error) {
            console.error(`❌ Hardware effect failed for ${event.type}:`, error.message);
        }
    }
    
    async handlePlayerAttackHardware(battle, eventData) {
        const { damage, attackType } = eventData;
        const healthPercent = battle.boss.health / battle.boss.maxHealth;
        
        // Flash effects based on damage
        const intensity = Math.min(1.0, damage / 50); // Scale intensity
        const color = attackType === 'critical' ? 'orange' : 'yellow';
        
        await this.hardware.executePhysicalAction('arduino_command', {
            deviceId: 'arduino_*',
            command: 'LED_FLASH',
            commandParams: { 
                color: color, 
                count: 1, 
                duration: 100 + (damage * 2)
            }
        });
        
        // Show health bar update
        await this.hardware.executePhysicalAction('arduino_command', {
            deviceId: 'arduino_*',
            command: 'BOSS_DAMAGE',
            commandParams: { 
                healthPercent: healthPercent,
                damage: damage
            }
        });
        
        // Buzzer feedback
        const frequency = 800 + (damage * 10);
        await this.hardware.executePhysicalAction('arduino_command', {
            deviceId: 'arduino_*',
            command: 'BUZZER_BEEP',
            commandParams: { 
                frequency: frequency, 
                duration: 150 
            }
        });
    }
    
    async handleBossAttackHardware(battle, eventData) {
        const { ability, totalDamage } = eventData;
        
        // Boss attack effects - more dramatic
        await this.hardware.executePhysicalAction('arduino_command', {
            deviceId: 'arduino_*',
            command: 'LED_PULSE',
            commandParams: { 
                color: 'red', 
                intensity: 255 
            }
        });
        
        // Vibration effect for boss attacks
        await this.hardware.executePhysicalAction('arduino_command', {
            deviceId: 'gaming_controller_1',
            command: 'VIBRATE',
            commandParams: { 
                intensity: Math.min(100, totalDamage * 2), 
                duration: 300 
            }
        });
        
        // Servo "recoil" effect
        await this.hardware.executePhysicalAction('arduino_command', {
            deviceId: 'arduino_*',
            command: 'SERVO_MOVE',
            commandParams: { 
                angle: 45, 
                duration: 200 
            }
        });
        
        // Return servo to center
        setTimeout(async () => {
            await this.hardware.executePhysicalAction('arduino_command', {
                deviceId: 'arduino_*',
                command: 'SERVO_MOVE',
                commandParams: { 
                    angle: 90, 
                    duration: 500 
                }
            });
        }, 500);
    }
    
    async handleBossDefeatHardware(battle, eventData) {
        const { bossName, duration, loot } = eventData;
        
        console.log(`🏆 Victory hardware sequence for ${bossName}!`);
        
        // Epic victory sequence
        await this.hardware.executePhysicalAction('arduino_command', {
            deviceId: 'arduino_*',
            command: 'VICTORY',
            commandParams: { 
                message: `${bossName} defeated!`,
                duration: 8000
            }
        });
        
        // Revenue gain effect for loot
        if (loot && loot.length > 0) {
            for (let i = 0; i < loot.length; i++) {
                setTimeout(async () => {
                    await this.hardware.executePhysicalAction('arduino_command', {
                        deviceId: 'arduino_*',
                        command: 'BUZZER_BEEP',
                        commandParams: { 
                            frequency: 1200 + (i * 200), 
                            duration: 300 
                        }
                    });
                }, i * 400);
            }
        }
    }
    
    async handleViewerActionHardware(battle, eventData) {
        const { action, viewerName } = eventData;
        
        // Viewer participation effects
        switch (action) {
            case 'cheer':
                await this.hardware.executePhysicalAction('arduino_command', {
                    deviceId: 'arduino_*',
                    command: 'LED_FLASH',
                    commandParams: { 
                        color: 'gold', 
                        count: 2, 
                        duration: 100 
                    }
                });
                break;
                
            case 'heal':
                await this.hardware.executePhysicalAction('arduino_command', {
                    deviceId: 'arduino_*',
                    command: 'LED_PULSE',
                    commandParams: { 
                        color: 'green', 
                        intensity: 200 
                    }
                });
                break;
                
            case 'sabotage':
                await this.hardware.executePhysicalAction('arduino_command', {
                    deviceId: 'arduino_*',
                    command: 'LED_FLASH',
                    commandParams: { 
                        color: 'purple', 
                        count: 3, 
                        duration: 150 
                    }
                });
                break;
                
            case 'buff':
                await this.hardware.executePhysicalAction('arduino_command', {
                    deviceId: 'arduino_*',
                    command: 'LED_RAINBOW',
                    commandParams: { 
                        duration: 2000, 
                        brightness: 0.8 
                    }
                });
                break;
        }
    }
    
    getBossHardwareEffects(boss) {
        // Define hardware effects for different bosses
        const effects = {
            'cal_nightmare': {
                spawn: [
                    { command: 'LED_PULSE', params: { color: '#ff0066', intensity: 255 } },
                    { command: 'BUZZER_BEEP', params: { frequency: 666, duration: 500 } }
                ],
                attack: [
                    { command: 'LED_FLASH', params: { color: 'red', count: 3, duration: 200 } }
                ],
                defeat: [
                    { command: 'LED_RAINBOW', params: { duration: 5000, brightness: 1.0 } }
                ]
            },
            'data_dragon': {
                spawn: [
                    { command: 'LED_PULSE', params: { color: '#00ff00', intensity: 255 } },
                    { command: 'SERVO_MOVE', params: { angle: 180, duration: 2000 } }
                ],
                attack: [
                    { command: 'LED_FLASH', params: { color: 'cyan', count: 5, duration: 100 } }
                ],
                defeat: [
                    { command: 'LED_RAINBOW', params: { duration: 8000, brightness: 1.0 } }
                ]
            },
            'bug_hydra': {
                spawn: [
                    { command: 'LED_PULSE', params: { color: '#ff9900', intensity: 200 } },
                    { command: 'BUZZER_BEEP', params: { frequency: 300, duration: 800 } }
                ],
                attack: [
                    { command: 'LED_FLASH', params: { color: 'orange', count: 2, duration: 150 } }
                ],
                defeat: [
                    { command: 'VICTORY', params: { message: 'Bugs squashed!', duration: 3000 } }
                ]
            },
            'merge_conflict': {
                spawn: [
                    { command: 'LED_PULSE', params: { color: '#ffff00', intensity: 255 } },
                    { command: 'VIBRATE', params: { intensity: 80, duration: 1000 } }
                ],
                attack: [
                    { command: 'LED_FLASH', params: { color: 'yellow', count: 4, duration: 100 } }
                ],
                defeat: [
                    { command: 'LED_RAINBOW', params: { duration: 6000, brightness: 0.9 } }
                ]
            }
        };
        
        return effects[boss.name] || effects['cal_nightmare']; // Default to Cal effects
    }
    
    // Get system status
    getIntegrationStatus() {
        return {
            activeBosses: this.bossSystem.activeBattles.size,
            totalPlayers: this.playerWallets.size,
            economyStats: this.economy.getEconomyStats(),
            bossStats: this.bossSystem.getGlobalStats(),
            spawnPoints: Object.fromEntries(this.bossSpawnPoints)
        };
    }
}

module.exports = RevenueMUDBossIntegration;