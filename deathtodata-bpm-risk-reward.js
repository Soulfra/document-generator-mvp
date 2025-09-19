#!/usr/bin/env node

/**
 * 🎵💀💰 DEATHTODATA BPM RISK/REWARD SYSTEM
 * Faster BPM = Higher Risk = Higher Reward = Higher Death Chance
 * Like Infernal Cape mechanics but for search engines
 */

const EventEmitter = require('events');
const GrooveLayerMusicalSync = require('./groove-layer-musical-sync');

class DeathtodataBPMRiskReward extends EventEmitter {
    constructor() {
        super();
        
        console.log('🎵💀💰 DEATHTODATA BPM RISK/REWARD SYSTEM');
        console.log('==========================================');
        console.log('Speed kills. But it also pays.');
        console.log('Like Infernal Cape: One mistake = Death');
        console.log('');
        
        // BPM ranges and their meanings
        this.bpmRanges = {
            safe: { min: 60, max: 80, name: 'Safe Zone' },
            moderate: { min: 81, max: 120, name: 'Moderate Risk' },
            dangerous: { min: 121, max: 160, name: 'Danger Zone' },
            extreme: { min: 161, max: 180, name: 'Extreme Risk' },
            infernal: { min: 181, max: 200, name: 'Infernal Mode' }
        };
        
        // Current state
        this.state = {
            currentBPM: 60,
            targetBPM: 60,
            acceleration: 0,
            
            // Multipliers
            riskMultiplier: 1.0,
            rewardMultiplier: 1.0,
            deathChance: 0.01,
            
            // Infernal Cape style mechanics
            jadePhase: false,     // Jad phase = instant death attacks
            healersActive: false, // Healers = BPM slowly increases
            waveNumber: 1,        // Current wave (1-63 like Fight Caves)
            
            // Statistics
            deathCount: 0,
            successCount: 0,
            totalRewards: 0,
            longestStreak: 0,
            currentStreak: 0
        };
        
        // Groove layer integration
        this.grooveLayer = null;
        
        // Death mechanics
        this.deathPenalties = {
            respawnTime: 30000,     // 30 seconds base
            lootLoss: 0.5,          // Lose 50% of accumulated rewards
            progressReset: 0.3,     // Reset 30% of progress
            bpmPenalty: 20         // BPM drops by 20 on death
        };
        
        // Reward scaling
        this.rewardScaling = {
            base: 100,
            bpmBonus: 2,           // +2% per BPM over 60
            streakBonus: 5,        // +5% per successful action
            waveBonus: 10,         // +10% per wave completed
            infernalBonus: 100     // +100% in infernal mode
        };
        
        // Initialize timers
        this.timers = {
            bpmUpdate: null,
            deathCheck: null,
            rewardCalculation: null,
            waveProgression: null
        };
    }
    
    async initialize() {
        console.log('🚀 Initializing BPM Risk/Reward System...\n');
        
        try {
            // Initialize groove layer for musical timing
            this.grooveLayer = new GrooveLayerMusicalSync();
            await this.grooveLayer.initialize();
            
            // Start system timers
            this.startTimers();
            
            // Set up event listeners
            this.setupEventListeners();
            
            console.log('✅ BPM Risk/Reward System initialized!');
            console.log(`🎵 Starting BPM: ${this.state.currentBPM}`);
            console.log(`💀 Starting death chance: ${(this.state.deathChance * 100).toFixed(2)}%\n`);
            
            this.emit('system:ready');
            
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            throw error;
        }
    }
    
    setupEventListeners() {
        // Listen for speed change requests
        this.on('speed:increase', (amount) => {
            this.increaseBPM(amount);
        });
        
        this.on('speed:decrease', (amount) => {
            this.decreaseBPM(amount);
        });
        
        // Listen for actions that affect BPM
        this.on('action:performed', (action) => {
            this.handleAction(action);
        });
        
        // Listen for death events
        this.on('death:occurred', (data) => {
            this.handleDeath(data);
        });
    }
    
    startTimers() {
        // BPM update timer (smooth transitions)
        this.timers.bpmUpdate = setInterval(() => {
            this.updateBPM();
        }, 100); // Update every 100ms for smooth transitions
        
        // Death check timer
        this.timers.deathCheck = setInterval(() => {
            this.checkForDeath();
        }, 1000); // Check every second
        
        // Reward calculation timer
        this.timers.rewardCalculation = setInterval(() => {
            this.calculateRewards();
        }, 5000); // Calculate every 5 seconds
        
        // Wave progression timer (like Fight Caves)
        this.timers.waveProgression = setInterval(() => {
            this.progressWave();
        }, 30000); // New wave every 30 seconds
    }
    
    updateBPM() {
        // Smooth BPM transitions
        const diff = this.state.targetBPM - this.state.currentBPM;
        
        if (Math.abs(diff) > 0.1) {
            // Accelerate towards target
            this.state.acceleration = diff * 0.1;
            this.state.currentBPM += this.state.acceleration;
            
            // Clamp to valid range
            this.state.currentBPM = Math.max(60, Math.min(200, this.state.currentBPM));
            
            // Update multipliers based on BPM
            this.updateMultipliers();
            
            // Emit BPM change
            this.emit('bpm:changed', {
                current: this.state.currentBPM,
                target: this.state.targetBPM,
                range: this.getCurrentRange()
            });
        }
    }
    
    updateMultipliers() {
        const bpm = this.state.currentBPM;
        const baseBPM = this.bpmRanges.safe.min;
        
        // Calculate normalized factor (0 to 1)
        const normalizedBPM = (bpm - baseBPM) / (200 - baseBPM);
        
        // Risk multiplier (linear)
        this.state.riskMultiplier = 1 + normalizedBPM * 4; // 1x to 5x
        
        // Reward multiplier (exponential for risk/reward)
        this.state.rewardMultiplier = Math.pow(1 + normalizedBPM * 5, 1.5); // 1x to ~15x
        
        // Death chance (exponential, like Infernal Cape)
        if (bpm <= this.bpmRanges.safe.max) {
            this.state.deathChance = 0.01; // 1% in safe zone
        } else if (bpm <= this.bpmRanges.moderate.max) {
            this.state.deathChance = 0.02 + (normalizedBPM * 0.05); // 2-7%
        } else if (bpm <= this.bpmRanges.dangerous.max) {
            this.state.deathChance = 0.1 + (normalizedBPM * 0.2); // 10-30%
        } else if (bpm <= this.bpmRanges.extreme.max) {
            this.state.deathChance = 0.3 + (normalizedBPM * 0.4); // 30-70%
        } else {
            // Infernal mode
            this.state.deathChance = 0.8 + (normalizedBPM * 0.19); // 80-99%
        }
        
        // Special mechanics at high BPM
        if (bpm >= 160) {
            this.state.jadePhase = true; // Jad mechanics activate
        } else {
            this.state.jadePhase = false;
        }
        
        if (bpm >= 140) {
            this.state.healersActive = true; // Healers make BPM increase
        } else {
            this.state.healersActive = false;
        }
    }
    
    getCurrentRange() {
        const bpm = this.state.currentBPM;
        
        for (const [key, range] of Object.entries(this.bpmRanges)) {
            if (bpm >= range.min && bpm <= range.max) {
                return { key, ...range };
            }
        }
        
        return { key: 'infernal', ...this.bpmRanges.infernal };
    }
    
    increaseBPM(amount = 10) {
        this.state.targetBPM = Math.min(200, this.state.targetBPM + amount);
        
        console.log(`⬆️ BPM increasing to ${this.state.targetBPM}`);
        console.log(`  💀 Death chance: ${(this.state.deathChance * 100).toFixed(2)}%`);
        console.log(`  💰 Reward multiplier: ${this.state.rewardMultiplier.toFixed(2)}x`);
    }
    
    decreaseBPM(amount = 10) {
        this.state.targetBPM = Math.max(60, this.state.targetBPM - amount);
        
        console.log(`⬇️ BPM decreasing to ${this.state.targetBPM}`);
    }
    
    handleAction(action) {
        console.log(`\n🎯 ACTION: ${action.type}`);
        
        // Different actions affect BPM differently
        switch (action.type) {
            case 'search':
                // Searching increases BPM slightly
                this.increaseBPM(5);
                break;
            
            case 'attack':
                // Attacking increases BPM moderately
                this.increaseBPM(10);
                break;
            
            case 'dodge':
                // Dodging increases BPM significantly
                this.increaseBPM(15);
                break;
            
            case 'heal':
                // Healing decreases BPM
                this.decreaseBPM(20);
                break;
            
            case 'defend':
                // Defending slightly decreases BPM
                this.decreaseBPM(5);
                break;
        }
        
        // Check for death on action
        const deathRoll = Math.random();
        if (deathRoll < this.state.deathChance) {
            this.handleDeath({
                action: action.type,
                bpm: this.state.currentBPM,
                deathChance: this.state.deathChance
            });
        } else {
            // Successful action
            this.state.currentStreak++;
            this.state.successCount++;
            
            if (this.state.currentStreak > this.state.longestStreak) {
                this.state.longestStreak = this.state.currentStreak;
            }
            
            // Calculate and award rewards
            const reward = this.calculateActionReward(action);
            this.state.totalRewards += reward;
            
            console.log(`✅ SUCCESS! Reward: ${reward.toFixed(0)}`);
            console.log(`  🔥 Streak: ${this.state.currentStreak}`);
            
            this.emit('action:success', {
                action: action.type,
                reward,
                streak: this.state.currentStreak
            });
        }
    }
    
    calculateActionReward(action) {
        let reward = this.rewardScaling.base;
        
        // BPM bonus
        const bpmBonus = (this.state.currentBPM - 60) * this.rewardScaling.bpmBonus / 100;
        reward *= (1 + bpmBonus);
        
        // Streak bonus
        const streakBonus = this.state.currentStreak * this.rewardScaling.streakBonus / 100;
        reward *= (1 + streakBonus);
        
        // Wave bonus
        const waveBonus = this.state.waveNumber * this.rewardScaling.waveBonus / 100;
        reward *= (1 + waveBonus);
        
        // Infernal bonus
        if (this.state.currentBPM > 180) {
            reward *= (1 + this.rewardScaling.infernalBonus / 100);
        }
        
        // Apply reward multiplier
        reward *= this.state.rewardMultiplier;
        
        // Action-specific multipliers
        const actionMultipliers = {
            'search': 1.0,
            'attack': 1.5,
            'dodge': 2.0,
            'heal': 0.5,
            'defend': 0.7
        };
        
        reward *= actionMultipliers[action.type] || 1.0;
        
        return Math.floor(reward);
    }
    
    checkForDeath() {
        // Passive death chance (increases with BPM)
        const passiveDeathChance = this.state.deathChance * 0.1; // 10% of active chance
        
        if (Math.random() < passiveDeathChance) {
            this.handleDeath({
                reason: 'passive',
                bpm: this.state.currentBPM,
                deathChance: passiveDeathChance
            });
        }
        
        // Healer mechanics (BPM creeps up)
        if (this.state.healersActive) {
            this.state.targetBPM = Math.min(200, this.state.targetBPM + 0.5);
        }
        
        // Jad phase mechanics (random spike damage)
        if (this.state.jadePhase && Math.random() < 0.05) {
            console.log('⚡ JAD ATTACK INCOMING!');
            this.emit('jad:attack', {
                damage: 'instant-kill',
                dodgeWindow: 1000 // 1 second to dodge
            });
        }
    }
    
    handleDeath(deathData) {
        console.log(`\n💀 DEATH! ${deathData.reason || deathData.action}`);
        console.log(`  BPM: ${Math.round(deathData.bpm)}`);
        console.log(`  Death chance was: ${(deathData.deathChance * 100).toFixed(2)}%`);
        
        this.state.deathCount++;
        this.state.currentStreak = 0;
        
        // Apply death penalties
        const lostRewards = Math.floor(this.state.totalRewards * this.deathPenalties.lootLoss);
        this.state.totalRewards -= lostRewards;
        
        console.log(`  Lost ${lostRewards} rewards`);
        console.log(`  Respawn in ${this.deathPenalties.respawnTime / 1000} seconds`);
        
        // Drop BPM
        this.state.targetBPM = Math.max(60, this.state.targetBPM - this.deathPenalties.bpmPenalty);
        
        // Reset wave progress
        this.state.waveNumber = Math.max(1, Math.floor(this.state.waveNumber * (1 - this.deathPenalties.progressReset)));
        
        this.emit('death:occurred', {
            ...deathData,
            penalties: {
                lostRewards,
                respawnTime: this.deathPenalties.respawnTime,
                waveReset: this.state.waveNumber
            }
        });
        
        // Respawn timer
        setTimeout(() => {
            console.log('🔄 RESPAWNED!');
            this.emit('respawn:complete');
        }, this.deathPenalties.respawnTime);
    }
    
    progressWave() {
        if (this.state.currentStreak > 0) {
            this.state.waveNumber++;
            
            console.log(`\n📈 WAVE ${this.state.waveNumber} COMPLETE!`);
            
            // Waves get harder (increase target BPM)
            if (this.state.waveNumber % 5 === 0) {
                this.state.targetBPM = Math.min(200, this.state.targetBPM + 5);
                console.log(`  ⚠️ Difficulty increased! Target BPM: ${this.state.targetBPM}`);
            }
            
            // Special waves (like Jad at wave 63)
            if (this.state.waveNumber === 63) {
                console.log('  🔥 INFERNAL WAVE! JAD SPAWNED!');
                this.state.jadePhase = true;
                this.state.targetBPM = 180;
            }
            
            this.emit('wave:complete', {
                wave: this.state.waveNumber,
                bpm: this.state.currentBPM,
                rewards: this.state.totalRewards
            });
        }
    }
    
    calculateRewards() {
        // Periodic reward calculation based on survival
        if (this.state.currentStreak > 0) {
            const survivalReward = this.rewardScaling.base * 0.2 * this.state.rewardMultiplier;
            this.state.totalRewards += survivalReward;
            
            this.emit('reward:earned', {
                type: 'survival',
                amount: survivalReward,
                total: this.state.totalRewards
            });
        }
    }
    
    // Public API methods
    getStatus() {
        return {
            bpm: {
                current: Math.round(this.state.currentBPM),
                target: this.state.targetBPM,
                range: this.getCurrentRange()
            },
            multipliers: {
                risk: this.state.riskMultiplier.toFixed(2),
                reward: this.state.rewardMultiplier.toFixed(2),
                deathChance: (this.state.deathChance * 100).toFixed(2) + '%'
            },
            stats: {
                deaths: this.state.deathCount,
                successes: this.state.successCount,
                currentStreak: this.state.currentStreak,
                longestStreak: this.state.longestStreak,
                totalRewards: this.state.totalRewards,
                wave: this.state.waveNumber
            },
            mechanics: {
                jadePhase: this.state.jadePhase,
                healersActive: this.state.healersActive
            }
        };
    }
    
    performAction(actionType) {
        this.handleAction({ type: actionType, timestamp: Date.now() });
    }
    
    cleanup() {
        // Clear all timers
        Object.values(this.timers).forEach(timer => {
            if (timer) clearInterval(timer);
        });
    }
}

// Export for use
module.exports = DeathtodataBPMRiskReward;

// Run if called directly
if (require.main === module) {
    const bpmSystem = new DeathtodataBPMRiskReward();
    
    bpmSystem.initialize()
        .then(() => {
            console.log('\n🎮 BPM RISK/REWARD SYSTEM ACTIVE');
            console.log('================================\n');
            
            // Demo actions
            const demoActions = ['search', 'attack', 'dodge', 'search', 'attack'];
            let actionIndex = 0;
            
            setInterval(() => {
                if (actionIndex < demoActions.length) {
                    bpmSystem.performAction(demoActions[actionIndex]);
                    actionIndex++;
                } else {
                    // Random actions after demo
                    const actions = ['search', 'attack', 'dodge', 'heal', 'defend'];
                    const randomAction = actions[Math.floor(Math.random() * actions.length)];
                    bpmSystem.performAction(randomAction);
                }
            }, 3000);
            
            // Status display
            setInterval(() => {
                const status = bpmSystem.getStatus();
                
                console.log('\n📊 SYSTEM STATUS:');
                console.log(`  BPM: ${status.bpm.current} (${status.bpm.range.name})`);
                console.log(`  Risk: ${status.multipliers.risk}x | Reward: ${status.multipliers.reward}x`);
                console.log(`  Death Chance: ${status.multipliers.deathChance}`);
                console.log(`  Wave: ${status.stats.wave} | Streak: ${status.stats.currentStreak}`);
                console.log(`  Total Rewards: ${status.stats.totalRewards}`);
                
                if (status.mechanics.jadePhase) {
                    console.log('  ⚡ JAD PHASE ACTIVE!');
                }
                if (status.mechanics.healersActive) {
                    console.log('  🔺 HEALERS ACTIVE - BPM INCREASING!');
                }
            }, 5000);
        })
        .catch(error => {
            console.error('Failed to start:', error);
            process.exit(1);
        });
}