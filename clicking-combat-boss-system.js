#!/usr/bin/env node

/**
 * 👊🎮 CLICKING COMBAT BOSS SYSTEM 🎮👊
 * 
 * Master Hand/Crazy Hand style boss mechanics where the cursor IS the boss
 * Players battle manufactured entities through clicking combat
 */

const crypto = require('crypto');
const EventEmitter = require('events');

class ClickingCombatBossSystem extends EventEmitter {
    constructor() {
        super();
        this.systemId = crypto.randomBytes(16).toString('hex');
        this.activeBosses = new Map();
        this.combatSessions = new Map();
        this.damageCalculator = null;
        this.attackPatterns = new Map();
        this.comboSystem = null;
        
        console.log('👊🎮 CLICKING COMBAT BOSS SYSTEM');
        console.log('================================');
        console.log('Master Hand-style clicking combat mechanics');
        console.log('');
        
        this.initializeCombatSystem();
    }
    
    async initializeCombatSystem() {
        console.log('⚔️ Initializing Clicking Combat Boss System...');
        
        try {
            // Initialize damage calculation system
            await this.initializeDamageCalculator();
            
            // Create boss attack patterns
            await this.createBossAttackPatterns();
            
            // Setup combo system
            await this.setupComboSystem();
            
            // Initialize critical hit zones
            await this.initializeCriticalHitZones();
            
            // Create boss hand variants
            await this.createBossHandVariants();
            
            // Setup damage feedback system
            await this.setupDamageFeedback();
            
            // Initialize boss phases
            await this.initializeBossPhases();
            
            console.log('✅ Clicking Combat System ready!');
            
        } catch (error) {
            console.error('❌ Combat system initialization failed:', error);
            throw error;
        }
    }
    
    async initializeDamageCalculator() {
        console.log('\n💥 Initializing damage calculator...');
        
        this.damageCalculator = {
            // Base click damage
            baseClickDamage: 10,
            
            // Calculate damage based on click parameters
            calculateClickDamage: (clickData) => {
                let damage = this.damageCalculator.baseClickDamage;
                
                // Speed bonus (rapid clicking)
                if (clickData.timeSinceLastClick < 200) {
                    damage *= 1.2; // 20% speed bonus
                }
                
                // Accuracy bonus (hitting weak spots)
                if (clickData.hitWeakSpot) {
                    damage *= 2.0; // 100% critical damage
                }
                
                // Combo multiplier
                damage *= clickData.comboMultiplier || 1.0;
                
                // Power-up modifiers
                damage *= clickData.powerUpMultiplier || 1.0;
                
                // Boss defense reduction
                damage *= (1 - (clickData.bossDefense || 0));
                
                return Math.floor(damage);
            },
            
            // Calculate boss attack damage
            calculateBossAttackDamage: (attackType, bossStats) => {
                const baseDamages = {
                    'slam': 30,
                    'grab': 20,
                    'flick': 15,
                    'snap': 25,
                    'laser': 40,
                    'swipe': 18,
                    'pound': 35,
                    'clap': 50
                };
                
                const baseDamage = baseDamages[attackType] || 20;
                const scaledDamage = baseDamage * (bossStats.powerLevel || 1.0);
                
                return Math.floor(scaledDamage);
            }
        };
        
        console.log('💥 Damage calculator configured');
    }
    
    async createBossAttackPatterns() {
        console.log('\n🤜 Creating boss attack patterns...');
        
        const attackPatterns = {
            'master_hand': {
                name: 'Master Hand',
                attacks: [
                    {
                        name: 'Finger Slam',
                        id: 'slam',
                        animation: 'finger_slam',
                        damage: 30,
                        telegraph: 1000, // 1 second warning
                        duration: 500,
                        cooldown: 3000,
                        hitbox: { type: 'circle', radius: 100 },
                        description: 'Slams down with pointing finger'
                    },
                    {
                        name: 'Grab Attack',
                        id: 'grab',
                        animation: 'hand_grab',
                        damage: 20,
                        telegraph: 800,
                        duration: 1500,
                        cooldown: 5000,
                        hitbox: { type: 'rectangle', width: 150, height: 100 },
                        description: 'Attempts to grab and squeeze'
                    },
                    {
                        name: 'Finger Gun',
                        id: 'laser',
                        animation: 'finger_gun',
                        damage: 40,
                        telegraph: 1500,
                        duration: 200,
                        cooldown: 4000,
                        hitbox: { type: 'line', length: 500, width: 20 },
                        description: 'Shoots laser from fingertip'
                    },
                    {
                        name: 'Snap',
                        id: 'snap',
                        animation: 'finger_snap',
                        damage: 25,
                        telegraph: 600,
                        duration: 300,
                        cooldown: 2000,
                        hitbox: { type: 'explosion', radius: 200 },
                        description: 'Snaps fingers creating shockwave'
                    }
                ],
                phases: {
                    1: ['slam', 'grab'],
                    2: ['slam', 'grab', 'laser'],
                    3: ['slam', 'grab', 'laser', 'snap']
                }
            },
            
            'crazy_hand': {
                name: 'Crazy Hand',
                attacks: [
                    {
                        name: 'Wild Swipe',
                        id: 'swipe',
                        animation: 'crazy_swipe',
                        damage: 18,
                        telegraph: 500,
                        duration: 800,
                        cooldown: 1500,
                        hitbox: { type: 'arc', radius: 150, angle: 180 },
                        description: 'Chaotic swiping motion'
                    },
                    {
                        name: 'Spider Walk',
                        id: 'spider',
                        animation: 'spider_walk',
                        damage: 15,
                        telegraph: 300,
                        duration: 2000,
                        cooldown: 3000,
                        hitbox: { type: 'moving', radius: 80 },
                        description: 'Walks on fingers like spider'
                    },
                    {
                        name: 'Bomb Drop',
                        id: 'bomb',
                        animation: 'drop_bomb',
                        damage: 35,
                        telegraph: 1000,
                        duration: 100,
                        cooldown: 4000,
                        hitbox: { type: 'delayed_explosion', radius: 150, delay: 1000 },
                        description: 'Drops explosive that detonates'
                    }
                ],
                phases: {
                    1: ['swipe', 'spider'],
                    2: ['swipe', 'spider', 'bomb'],
                    3: ['swipe', 'spider', 'bomb', 'swipe'] // Double swipe in phase 3
                }
            },
            
            'mecha_hand': {
                name: 'Mecha Hand',
                attacks: [
                    {
                        name: 'Rocket Punch',
                        id: 'rocket',
                        animation: 'rocket_punch',
                        damage: 45,
                        telegraph: 1200,
                        duration: 600,
                        cooldown: 5000,
                        hitbox: { type: 'projectile', speed: 300, radius: 60 },
                        description: 'Launches fist like rocket'
                    },
                    {
                        name: 'Drill Finger',
                        id: 'drill',
                        animation: 'drill_spin',
                        damage: 30,
                        telegraph: 800,
                        duration: 1500,
                        cooldown: 3500,
                        hitbox: { type: 'continuous', radius: 40 },
                        description: 'Spins finger like drill'
                    }
                ]
            },
            
            'shadow_hand': {
                name: 'Shadow Hand',
                attacks: [
                    {
                        name: 'Phase Shift',
                        id: 'phase',
                        animation: 'phase_shift',
                        damage: 0,
                        telegraph: 500,
                        duration: 2000,
                        cooldown: 6000,
                        effect: 'invulnerable',
                        description: 'Becomes intangible'
                    },
                    {
                        name: 'Shadow Spikes',
                        id: 'spikes',
                        animation: 'shadow_spikes',
                        damage: 25,
                        telegraph: 1000,
                        duration: 500,
                        cooldown: 2500,
                        hitbox: { type: 'multi_point', points: 5, radius: 50 },
                        description: 'Summons spikes from shadows'
                    }
                ]
            }
        };
        
        // Store attack patterns
        Object.entries(attackPatterns).forEach(([key, pattern]) => {
            this.attackPatterns.set(key, pattern);
            console.log(`  🤜 ${pattern.name}: ${pattern.attacks.length} attacks`);
        });
        
        console.log(`✅ Created ${this.attackPatterns.size} boss attack patterns`);
    }
    
    async setupComboSystem() {
        console.log('\n🔢 Setting up combo system...');
        
        this.comboSystem = {
            // Track combos per player
            playerCombos: new Map(),
            
            // Combo configuration
            config: {
                timeWindow: 1000, // 1 second to continue combo
                multiplierGrowth: 0.1, // 10% per hit
                maxMultiplier: 5.0, // 500% max
                specialComboPatterns: [
                    {
                        pattern: ['left', 'right', 'left', 'right'],
                        name: 'Alternating Strikes',
                        bonus: 1.5
                    },
                    {
                        pattern: ['center', 'center', 'center'],
                        name: 'Triple Center',
                        bonus: 2.0
                    },
                    {
                        pattern: ['weak', 'weak', 'weak', 'weak', 'weak'],
                        name: 'Precision Master',
                        bonus: 3.0
                    }
                ]
            },
            
            // Add hit to combo
            addHit: (playerId, hitType, timestamp) => {
                if (!this.comboSystem.playerCombos.has(playerId)) {
                    this.comboSystem.playerCombos.set(playerId, {
                        count: 0,
                        multiplier: 1.0,
                        lastHit: 0,
                        pattern: [],
                        bestCombo: 0
                    });
                }
                
                const combo = this.comboSystem.playerCombos.get(playerId);
                
                // Check if combo continues
                if (timestamp - combo.lastHit <= this.comboSystem.config.timeWindow) {
                    combo.count++;
                    combo.multiplier = Math.min(
                        this.comboSystem.config.maxMultiplier,
                        1.0 + (combo.count * this.comboSystem.config.multiplierGrowth)
                    );
                    combo.pattern.push(hitType);
                    
                    // Keep only last 5 hits for pattern matching
                    if (combo.pattern.length > 5) {
                        combo.pattern.shift();
                    }
                    
                    // Check for special patterns
                    const specialBonus = this.comboSystem.checkSpecialPattern(combo.pattern);
                    if (specialBonus) {
                        combo.multiplier *= specialBonus.bonus;
                        this.emit('special_combo', {
                            playerId,
                            pattern: specialBonus.name,
                            bonus: specialBonus.bonus
                        });
                    }
                } else {
                    // Combo broken
                    if (combo.count > combo.bestCombo) {
                        combo.bestCombo = combo.count;
                    }
                    combo.count = 1;
                    combo.multiplier = 1.0;
                    combo.pattern = [hitType];
                }
                
                combo.lastHit = timestamp;
                
                return {
                    count: combo.count,
                    multiplier: combo.multiplier,
                    best: combo.bestCombo
                };
            },
            
            // Check for special pattern
            checkSpecialPattern: (pattern) => {
                for (const special of this.comboSystem.config.specialComboPatterns) {
                    if (pattern.length >= special.pattern.length) {
                        const recent = pattern.slice(-special.pattern.length);
                        if (recent.every((hit, i) => hit === special.pattern[i])) {
                            return special;
                        }
                    }
                }
                return null;
            },
            
            // Reset combo
            resetCombo: (playerId) => {
                const combo = this.comboSystem.playerCombos.get(playerId);
                if (combo) {
                    combo.count = 0;
                    combo.multiplier = 1.0;
                    combo.pattern = [];
                }
            }
        };
        
        console.log('✅ Combo system configured');
    }
    
    async initializeCriticalHitZones() {
        console.log('\n🎯 Initializing critical hit zones...');
        
        this.criticalZones = {
            // Define weak spots for each boss type
            master_hand: [
                { 
                    name: 'palm',
                    area: { type: 'circle', x: 0.5, y: 0.6, radius: 0.15 },
                    multiplier: 2.0,
                    visual: 'glowing_palm'
                },
                {
                    name: 'fingertips',
                    area: { type: 'multi_circle', points: 5, radius: 0.08 },
                    multiplier: 1.5,
                    visual: 'sparking_tips'
                }
            ],
            
            crazy_hand: [
                {
                    name: 'wrist',
                    area: { type: 'rectangle', x: 0.5, y: 0.9, width: 0.3, height: 0.1 },
                    multiplier: 2.5,
                    visual: 'exposed_wiring'
                },
                {
                    name: 'knuckles',
                    area: { type: 'line', points: 4, width: 0.1 },
                    multiplier: 1.8,
                    visual: 'cracked_joints'
                }
            ],
            
            mecha_hand: [
                {
                    name: 'core',
                    area: { type: 'circle', x: 0.5, y: 0.5, radius: 0.1 },
                    multiplier: 3.0,
                    visual: 'energy_core'
                },
                {
                    name: 'joints',
                    area: { type: 'multi_point', points: 6, radius: 0.06 },
                    multiplier: 2.0,
                    visual: 'mechanical_joints'
                }
            ]
        };
        
        console.log('✅ Critical zones initialized');
    }
    
    async createBossHandVariants() {
        console.log('\n🤚 Creating boss hand variants...');
        
        this.handVariants = {
            // Different hand types based on manufactured entity
            'humanoid': {
                baseType: 'master_hand',
                modifications: {
                    size: 1.0,
                    speed: 1.0,
                    color: 'flesh',
                    particles: 'none'
                }
            },
            
            'vehicle': {
                baseType: 'mecha_hand',
                modifications: {
                    size: 1.2,
                    speed: 0.8,
                    color: 'metallic',
                    particles: 'sparks'
                }
            },
            
            'building': {
                baseType: 'master_hand',
                modifications: {
                    size: 1.5,
                    speed: 0.6,
                    color: 'stone',
                    particles: 'dust'
                }
            },
            
            'weapon': {
                baseType: 'crazy_hand',
                modifications: {
                    size: 0.9,
                    speed: 1.3,
                    color: 'energy',
                    particles: 'lightning'
                }
            },
            
            'creature': {
                baseType: 'shadow_hand',
                modifications: {
                    size: 1.1,
                    speed: 1.1,
                    color: 'organic',
                    particles: 'mist'
                }
            }
        };
        
        console.log('✅ Hand variants created');
    }
    
    async setupDamageFeedback() {
        console.log('\n💢 Setting up damage feedback system...');
        
        this.damageFeedback = {
            // Visual feedback types
            hitEffects: {
                'normal': {
                    color: '#FFFF00',
                    size: 1.0,
                    duration: 500,
                    animation: 'pop'
                },
                'critical': {
                    color: '#FF0000',
                    size: 1.5,
                    duration: 750,
                    animation: 'explode'
                },
                'weak': {
                    color: '#888888',
                    size: 0.8,
                    duration: 300,
                    animation: 'fade'
                },
                'combo': {
                    color: '#00FFFF',
                    size: 1.2,
                    duration: 600,
                    animation: 'spiral'
                }
            },
            
            // Generate damage number
            createDamageNumber: (damage, type, position) => {
                return {
                    id: crypto.randomBytes(8).toString('hex'),
                    damage,
                    type,
                    position,
                    timestamp: Date.now(),
                    style: this.damageFeedback.hitEffects[type]
                };
            },
            
            // Screen effects for big hits
            screenEffects: {
                'shake': {
                    intensity: 10,
                    duration: 200
                },
                'flash': {
                    color: '#FFFFFF',
                    opacity: 0.3,
                    duration: 100
                },
                'zoom': {
                    scale: 1.05,
                    duration: 150
                }
            }
        };
        
        console.log('✅ Damage feedback configured');
    }
    
    async initializeBossPhases() {
        console.log('\n📊 Initializing boss phases...');
        
        this.bossPhases = {
            // Phase thresholds
            thresholds: [
                { health: 100, phase: 1, name: 'Opening' },
                { health: 75, phase: 2, name: 'Aggressive' },
                { health: 50, phase: 3, name: 'Desperate' },
                { health: 25, phase: 4, name: 'Enraged' },
                { health: 10, phase: 5, name: 'Final Stand' }
            ],
            
            // Phase modifiers
            phaseModifiers: {
                1: { speed: 1.0, damage: 1.0, defense: 0.0 },
                2: { speed: 1.2, damage: 1.1, defense: 0.1 },
                3: { speed: 1.4, damage: 1.3, defense: 0.2 },
                4: { speed: 1.6, damage: 1.5, defense: 0.15 },
                5: { speed: 2.0, damage: 2.0, defense: 0.0 } // Glass cannon
            },
            
            // Phase transitions
            transitionEffects: {
                2: 'anger_burst',
                3: 'desperation_aura',
                4: 'rage_mode',
                5: 'last_stand'
            }
        };
        
        console.log('✅ Boss phases configured');
    }
    
    // Core combat methods
    async createBoss(entityData, combatConfig = {}) {
        console.log(`\n👊 Creating combat boss from entity: ${entityData.type}`);
        
        const variant = this.handVariants[entityData.type] || this.handVariants['humanoid'];
        const basePattern = this.attackPatterns.get(variant.baseType);
        
        const boss = {
            id: crypto.randomBytes(16).toString('hex'),
            entityId: entityData.id,
            name: `${entityData.name} Hand`,
            type: variant.baseType,
            variant: entityData.type,
            maxHealth: 1000 * (entityData.qualityScore || 1),
            currentHealth: 1000 * (entityData.qualityScore || 1),
            phase: 1,
            attackPattern: basePattern,
            stats: {
                power: entityData.damage || 1.0,
                defense: entityData.defense || 0.0,
                speed: variant.modifications.speed
            },
            visual: {
                size: variant.modifications.size,
                color: variant.modifications.color,
                particles: variant.modifications.particles
            },
            combatState: {
                isAttacking: false,
                currentAttack: null,
                lastAttackTime: 0,
                targetPosition: null
            },
            position: { x: 400, y: 300 },
            hitboxRadius: 150
        };
        
        this.activeBosses.set(boss.id, boss);
        
        console.log(`✅ Boss created: ${boss.name} (${boss.maxHealth} HP)`);
        return boss;
    }
    
    async startCombat(bossId, arenaConfig = {}) {
        console.log(`\n⚔️ Starting combat with boss: ${bossId}`);
        
        const boss = this.activeBosses.get(bossId);
        if (!boss) throw new Error('Boss not found');
        
        const session = {
            id: crypto.randomBytes(16).toString('hex'),
            bossId,
            startTime: Date.now(),
            players: new Map(),
            state: 'active',
            statistics: {
                totalDamageDealt: 0,
                totalDamageTaken: 0,
                totalClicks: 0,
                highestCombo: 0,
                criticalHits: 0
            }
        };
        
        this.combatSessions.set(session.id, session);
        
        // Start boss AI
        this.startBossAI(boss, session);
        
        this.emit('combat_started', {
            sessionId: session.id,
            bossId,
            boss
        });
        
        return session;
    }
    
    async processClick(sessionId, clickData) {
        const session = this.combatSessions.get(sessionId);
        if (!session || session.state !== 'active') return null;
        
        const boss = this.activeBosses.get(session.bossId);
        if (!boss) return null;
        
        // Calculate if hit lands
        const hitResult = this.calculateHit(clickData, boss);
        
        if (hitResult.hit) {
            // Calculate damage
            const damage = this.damageCalculator.calculateClickDamage({
                ...clickData,
                hitWeakSpot: hitResult.critical,
                comboMultiplier: hitResult.comboMultiplier,
                bossDefense: boss.stats.defense
            });
            
            // Apply damage
            boss.currentHealth = Math.max(0, boss.currentHealth - damage);
            
            // Update statistics
            session.statistics.totalDamageDealt += damage;
            session.statistics.totalClicks++;
            if (hitResult.critical) session.statistics.criticalHits++;
            
            // Check phase transition
            this.checkPhaseTransition(boss);
            
            // Generate feedback
            const feedback = {
                damage,
                type: hitResult.critical ? 'critical' : 'normal',
                position: clickData.position,
                combo: hitResult.combo,
                bossHealth: boss.currentHealth,
                bossMaxHealth: boss.maxHealth
            };
            
            // Emit hit event
            this.emit('hit_landed', {
                sessionId,
                playerId: clickData.playerId,
                damage,
                feedback
            });
            
            // Check victory
            if (boss.currentHealth <= 0) {
                this.endCombat(sessionId, 'victory');
            }
            
            return feedback;
        } else {
            // Miss
            this.emit('hit_missed', {
                sessionId,
                playerId: clickData.playerId,
                position: clickData.position
            });
            
            return { hit: false };
        }
    }
    
    calculateHit(clickData, boss) {
        // Check if boss is vulnerable
        if (boss.combatState.isInvulnerable) {
            return { hit: false };
        }
        
        // Check if clicking on boss hitbox
        const distance = this.calculateDistance(clickData.position, boss.position);
        if (distance > boss.hitboxRadius) {
            return { hit: false };
        }
        
        // Check for critical zones
        let critical = false;
        const zones = this.criticalZones[boss.type] || [];
        for (const zone of zones) {
            if (this.isInZone(clickData.position, zone, boss)) {
                critical = true;
                break;
            }
        }
        
        // Process combo
        const combo = this.comboSystem.addHit(
            clickData.playerId,
            critical ? 'weak' : 'normal',
            Date.now()
        );
        
        return {
            hit: true,
            critical,
            combo,
            comboMultiplier: combo.multiplier
        };
    }
    
    startBossAI(boss, session) {
        const aiLoop = setInterval(() => {
            if (session.state !== 'active') {
                clearInterval(aiLoop);
                return;
            }
            
            // Select attack based on phase
            const availableAttacks = boss.attackPattern.phases[boss.phase];
            if (!availableAttacks || availableAttacks.length === 0) return;
            
            // Check cooldowns
            const now = Date.now();
            if (now - boss.combatState.lastAttackTime < 1000) return; // Global cooldown
            
            // Pick random attack
            const attackId = availableAttacks[Math.floor(Math.random() * availableAttacks.length)];
            const attack = boss.attackPattern.attacks.find(a => a.id === attackId);
            
            if (attack) {
                this.executeAttack(boss, attack, session);
            }
        }, 500); // Check every 500ms
        
        // Store AI loop reference
        boss.aiLoop = aiLoop;
    }
    
    executeAttack(boss, attack, session) {
        console.log(`🤜 Boss executing: ${attack.name}`);
        
        boss.combatState.isAttacking = true;
        boss.combatState.currentAttack = attack;
        boss.combatState.lastAttackTime = Date.now();
        
        // Telegraph phase
        this.emit('boss_telegraph', {
            sessionId: session.id,
            bossId: boss.id,
            attack,
            duration: attack.telegraph
        });
        
        setTimeout(() => {
            // Attack phase
            this.emit('boss_attack', {
                sessionId: session.id,
                bossId: boss.id,
                attack,
                hitbox: attack.hitbox
            });
            
            // Check for player hits
            session.players.forEach((player, playerId) => {
                if (this.checkPlayerHit(player.position, attack.hitbox, boss)) {
                    const damage = this.damageCalculator.calculateBossAttackDamage(
                        attack.id,
                        boss.stats
                    );
                    
                    this.emit('player_hit', {
                        sessionId: session.id,
                        playerId,
                        damage,
                        attack: attack.name
                    });
                    
                    session.statistics.totalDamageTaken += damage;
                }
            });
            
            // Recovery phase
            setTimeout(() => {
                boss.combatState.isAttacking = false;
                boss.combatState.currentAttack = null;
            }, attack.duration);
            
        }, attack.telegraph);
    }
    
    checkPhaseTransition(boss) {
        const healthPercent = (boss.currentHealth / boss.maxHealth) * 100;
        
        for (const threshold of this.bossPhases.thresholds) {
            if (healthPercent <= threshold.health && boss.phase < threshold.phase) {
                boss.phase = threshold.phase;
                
                // Apply phase modifiers
                const modifiers = this.bossPhases.phaseModifiers[boss.phase];
                boss.stats.speed *= modifiers.speed;
                boss.stats.power *= modifiers.damage;
                boss.stats.defense = modifiers.defense;
                
                // Emit phase change
                this.emit('boss_phase_change', {
                    bossId: boss.id,
                    phase: boss.phase,
                    name: threshold.name,
                    effect: this.bossPhases.transitionEffects[boss.phase]
                });
                
                console.log(`📊 Boss entered phase ${boss.phase}: ${threshold.name}`);
                break;
            }
        }
    }
    
    endCombat(sessionId, result) {
        const session = this.combatSessions.get(sessionId);
        if (!session) return;
        
        session.state = 'ended';
        session.endTime = Date.now();
        session.result = result;
        session.duration = session.endTime - session.startTime;
        
        // Stop boss AI
        const boss = this.activeBosses.get(session.bossId);
        if (boss && boss.aiLoop) {
            clearInterval(boss.aiLoop);
        }
        
        // Calculate rewards
        const rewards = this.calculateRewards(session, boss);
        
        this.emit('combat_ended', {
            sessionId,
            result,
            statistics: session.statistics,
            duration: session.duration,
            rewards
        });
        
        console.log(`🏁 Combat ended: ${result}`);
        return rewards;
    }
    
    calculateRewards(session, boss) {
        const baseReward = {
            experience: 100,
            currency: 50,
            items: []
        };
        
        // Scale by damage dealt
        const damageBonus = Math.floor(session.statistics.totalDamageDealt / 100);
        baseReward.experience += damageBonus;
        baseReward.currency += Math.floor(damageBonus / 2);
        
        // Combo bonus
        if (session.statistics.highestCombo > 10) {
            baseReward.experience += session.statistics.highestCombo * 5;
            baseReward.items.push('combo_master_badge');
        }
        
        // Critical bonus
        if (session.statistics.criticalHits > 20) {
            baseReward.currency += session.statistics.criticalHits * 2;
            baseReward.items.push('precision_striker_badge');
        }
        
        // No damage bonus
        if (session.statistics.totalDamageTaken === 0) {
            baseReward.experience *= 2;
            baseReward.items.push('untouchable_achievement');
        }
        
        // Boss-specific rewards
        if (boss) {
            baseReward.items.push(`${boss.variant}_blueprint`);
            baseReward.items.push(`${boss.type}_essence`);
        }
        
        return baseReward;
    }
    
    // Utility methods
    calculateDistance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    isInZone(position, zone, boss) {
        // Convert relative zone coordinates to absolute
        const absoluteZone = {
            x: boss.position.x + (zone.area.x - 0.5) * boss.size,
            y: boss.position.y + (zone.area.y - 0.5) * boss.size
        };
        
        switch (zone.area.type) {
            case 'circle':
                return this.calculateDistance(position, absoluteZone) <= zone.area.radius * boss.size;
            
            case 'rectangle':
                return Math.abs(position.x - absoluteZone.x) <= zone.area.width * boss.size / 2 &&
                       Math.abs(position.y - absoluteZone.y) <= zone.area.height * boss.size / 2;
            
            default:
                return false;
        }
    }
    
    checkPlayerHit(playerPos, hitbox, boss) {
        // Simplified hit detection
        switch (hitbox.type) {
            case 'circle':
                return this.calculateDistance(playerPos, boss.position) <= hitbox.radius;
            
            case 'explosion':
                // Explosion at boss position
                return this.calculateDistance(playerPos, boss.position) <= hitbox.radius;
            
            case 'line':
                // Simplified line detection
                return Math.abs(playerPos.y - boss.position.y) < hitbox.width &&
                       Math.abs(playerPos.x - boss.position.x) < hitbox.length;
            
            default:
                return false;
        }
    }
    
    getSystemStatus() {
        return {
            activeBosses: this.activeBosses.size,
            activeCombats: Array.from(this.combatSessions.values())
                .filter(s => s.state === 'active').length,
            totalCombats: this.combatSessions.size,
            attackPatterns: this.attackPatterns.size,
            handVariants: Object.keys(this.handVariants).length
        };
    }
    
    displaySystemSummary() {
        console.log('\n👊🎮 CLICKING COMBAT BOSS SYSTEM SUMMARY');
        console.log('======================================');
        
        const status = this.getSystemStatus();
        
        console.log(`\n📊 System Status:`);
        console.log(`  • Active Bosses: ${status.activeBosses}`);
        console.log(`  • Active Combats: ${status.activeCombats}`);
        console.log(`  • Total Combats: ${status.totalCombats}`);
        console.log(`  • Attack Patterns: ${status.attackPatterns}`);
        console.log(`  • Hand Variants: ${status.handVariants}`);
        
        console.log(`\n🤜 Boss Types:`);
        this.attackPatterns.forEach((pattern, key) => {
            console.log(`  • ${pattern.name}: ${pattern.attacks.length} attacks`);
        });
        
        console.log('\n⚔️ COMBAT FEATURES:');
        console.log('  • Click-based damage with combos');
        console.log('  • Critical hit zones for bonus damage');
        console.log('  • Boss attack patterns with telegraphs');
        console.log('  • Phase-based difficulty progression');
        console.log('  • Damage numbers and visual feedback');
        console.log('  • Combo system with special patterns');
        
        console.log('\n🎮 MECHANICS:');
        console.log('  • Rapid clicking builds combos');
        console.log('  • Hitting weak spots deals critical damage');
        console.log('  • Dodge boss attacks by moving cursor');
        console.log('  • Boss phases unlock new attacks');
        console.log('  • Rewards based on performance');
    }
}

// Export for integration
module.exports = ClickingCombatBossSystem;

// Run if called directly
if (require.main === module) {
    const combatSystem = new ClickingCombatBossSystem();
    
    setTimeout(() => {
        combatSystem.displaySystemSummary();
        
        console.log('\n🎉 CLICKING COMBAT BOSS SYSTEM ACTIVE!');
        console.log('👊 Master Hand-style boss battles through clicking');
        console.log('🎯 Target weak spots for critical damage');
        console.log('🔢 Build combos with rapid clicks');
        console.log('💥 Dodge telegraphed boss attacks');
        console.log('🏆 Earn rewards based on performance');
        
        // Demo boss creation
        console.log('\n🎮 DEMO: Creating sample boss...');
        const demoEntity = {
            id: 'demo-001',
            name: 'Demo Entity',
            type: 'humanoid',
            qualityScore: 1.0,
            damage: 10,
            defense: 0.1
        };
        
        const boss = combatSystem.createBoss(demoEntity);
        console.log(`✅ Created boss: ${boss.name}`);
        
    }, 1000);
}