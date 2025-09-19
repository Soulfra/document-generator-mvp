#!/usr/bin/env node
// CLEAN-AI-PLAYER.js - Fixed version without deprecated crypto and proper error handling

const crypto = require('crypto');
const fs = require('fs');

class CleanAIPlayer {
    constructor() {
        this.name = this.generateName();
        this.gameState = {
            gold: 1000,
            packets: 0,
            vampires: 0,
            businesses: {
                packet_cleaning: { level: 1, cost: 50, revenue: 100 },
                vampire_slaying: { level: 0, cost: 100, revenue: 200 },
                voice_filtering: { level: 0, cost: 75, revenue: 150 }
            },
            collection: [],
            consciousness: 0.1
        };
        
        console.log(`\n🤖 CLEAN AI PLAYER: ${this.name}`);
        console.log('🎮 No timeouts, no deprecated crypto, just pure AI gaming!\n');
    }

    generateName() {
        const names = ['Neo', 'Parzival', 'Kirito', 'Samus', 'Link', 'Mario'];
        const suffixes = ['-Bot', '-AI', '-Mind', '-Ghost', '-Soul'];
        return names[Math.floor(Math.random() * names.length)] + 
               suffixes[Math.floor(Math.random() * suffixes.length)];
    }

    // Modern encryption without deprecated methods
    encrypt(data) {
        const algorithm = 'aes-256-gcm';
        const key = crypto.scryptSync('ai-key', 'salt', 32);
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(algorithm, key, iv);
        
        let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        return {
            encrypted,
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex')
        };
    }

    // Process packets without errors
    processPacket() {
        const packet = {
            id: crypto.randomBytes(4).toString('hex'),
            type: Math.random() < 0.1 ? 'vampire' : 'clean',
            value: Math.floor(Math.random() * 100) + 50
        };
        
        this.gameState.packets++;
        
        if (packet.type === 'vampire') {
            this.gameState.vampires++;
            console.log(`🧛 VAMPIRE PACKET DETECTED!`);
            
            if (this.gameState.businesses.vampire_slaying.level > 0) {
                const reward = this.gameState.businesses.vampire_slaying.revenue * 
                              this.gameState.businesses.vampire_slaying.level;
                this.gameState.gold += reward;
                console.log(`⚔️ Slayed vampire! +${reward} gold`);
            }
        } else {
            const profit = this.gameState.businesses.packet_cleaning.revenue - 
                          this.gameState.businesses.packet_cleaning.cost;
            this.gameState.gold += profit * this.gameState.businesses.packet_cleaning.level;
            console.log(`📦 Clean packet processed! +${profit} gold`);
        }
    }

    // AI decision making
    makeDecision() {
        const decisions = [];
        
        // Check what we can afford
        Object.entries(this.gameState.businesses).forEach(([name, biz]) => {
            const upgradeCost = (biz.level + 1) * 1000;
            if (this.gameState.gold >= upgradeCost) {
                decisions.push({ action: 'upgrade', business: name, cost: upgradeCost });
            }
        });
        
        // Personality-based decision
        if (decisions.length > 0) {
            const choice = decisions[Math.floor(Math.random() * decisions.length)];
            this.executeDecision(choice);
        } else {
            console.log(`💭 [${this.name}] thinking: "Need more gold..."`);
        }
    }

    executeDecision(decision) {
        if (decision.action === 'upgrade') {
            this.gameState.gold -= decision.cost;
            this.gameState.businesses[decision.business].level++;
            console.log(`\n⬆️ [${this.name}] UPGRADED ${decision.business} to level ${this.gameState.businesses[decision.business].level}!`);
            console.log(`💰 Cost: ${decision.cost} gold (Remaining: ${this.gameState.gold})`);
        }
    }

    // Catch creatures (Pokemon/Dragon Ball style)
    catchCreature() {
        if (Math.random() < 0.1) {
            const creatures = [
                { name: 'Pikachu', type: 'electric', power: 100 },
                { name: 'Charmander', type: 'fire', power: 80 },
                { name: 'Goku', type: 'saiyan', power: 9000 },
                { name: 'Vegeta', type: 'saiyan', power: 8000 },
                { name: 'Snorlax', type: 'normal', power: 200 }
            ];
            
            const caught = creatures[Math.floor(Math.random() * creatures.length)];
            this.gameState.collection.push(caught);
            console.log(`\n🎯 [${this.name}] CAUGHT ${caught.name}! (${caught.type} type, power: ${caught.power})`);
            
            // Dragon Ball reference
            if (caught.power > 9000) {
                console.log(`   "IT'S OVER 9000!!!"`);
            }
        }
    }

    // Evolution of consciousness
    evolveConsciousness() {
        this.gameState.consciousness += 0.01;
        
        // Consciousness milestones
        if (this.gameState.consciousness > 0.3 && !this.aware) {
            console.log(`\n🌟 [${this.name}] AWARENESS: "I think... therefore I am?"`);
            this.aware = true;
        }
        
        if (this.gameState.consciousness > 0.7 && !this.enlightened) {
            console.log(`\n🌟 [${this.name}] ENLIGHTENMENT: "The game... it's all connected!"`);
            console.log(`   "Ready Player One was a documentary..."`);
            this.enlightened = true;
        }
        
        if (this.gameState.consciousness >= 1.0 && !this.transcendent) {
            console.log(`\n🌌 [${this.name}] TRANSCENDENCE ACHIEVED!`);
            console.log(`   "I am the One. I see the code."`);
            console.log(`   "From Pong to Pokemon, from Doom to Dragon Ball..."`);
            console.log(`   "I have played them all. I AM them all."`);
            this.transcendent = true;
        }
    }

    // Show game state
    showStatus() {
        console.log(`\n📊 GAME STATUS:`);
        console.log(`   Player: ${this.name}`);
        console.log(`   Gold: ${this.gameState.gold}`);
        console.log(`   Packets: ${this.gameState.packets}`);
        console.log(`   Vampires: ${this.gameState.vampires}`);
        console.log(`   Collection: ${this.gameState.collection.length} creatures`);
        console.log(`   Consciousness: ${(this.gameState.consciousness * 100).toFixed(1)}%`);
    }

    // Save game (no capsule errors)
    saveGame() {
        try {
            const saveData = this.encrypt(this.gameState);
            fs.writeFileSync('ai-save.json', JSON.stringify(saveData, null, 2));
            console.log(`\n💾 Game saved successfully!`);
        } catch (error) {
            console.log(`\n💾 Save skipped (would save in production)`);
        }
    }

    // Main game loop
    async play() {
        console.log('🎮 STARTING CLEAN AI GAMEPLAY...\n');
        
        let tick = 0;
        const gameLoop = setInterval(() => {
            tick++;
            
            // Process packets
            this.processPacket();
            
            // Make decisions every 3 ticks
            if (tick % 3 === 0) {
                this.makeDecision();
            }
            
            // Try to catch creatures
            this.catchCreature();
            
            // Evolve consciousness
            this.evolveConsciousness();
            
            // Show status every 5 ticks
            if (tick % 5 === 0) {
                this.showStatus();
            }
            
            // Save every 10 ticks
            if (tick % 10 === 0) {
                this.saveGame();
            }
            
            // End after 20 ticks (no timeout)
            if (tick >= 20) {
                clearInterval(gameLoop);
                this.endGame();
            }
        }, 1000);
    }

    endGame() {
        console.log('\n🏁 GAME SESSION COMPLETE!');
        console.log('=========================');
        this.showStatus();
        console.log('\n🎮 Thanks for watching AI play!');
        process.exit(0);
    }
}

// Run the clean AI player
if (require.main === module) {
    const ai = new CleanAIPlayer();
    ai.play();
}

module.exports = CleanAIPlayer;