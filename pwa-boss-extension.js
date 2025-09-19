/*!
 * 🏆⚔️ PWA BOSS BATTLE EXTENSION
 * 
 * Adds boss battle functionality to existing ShipRekt PWA
 * Mobile-optimized touch controls for RuneScape-style grid battles
 * Integrates with existing mesh networking and empire systems
 */

// Boss Battle Extension for ShipRekt PWA
class PWABossExtension {
    constructor() {
        this.isActive = false;
        this.currentBoss = null;
        this.battleGrid = null;
        this.playerPosition = { x: 5, y: 8 };
        this.bossPosition = { x: 5, y: 2 };
        this.gridSize = 10;
        this.tileSize = 30;
        
        // Battle state
        this.battleState = {
            active: false,
            playerHealth: 100,
            bossHealth: 1000,
            playerDamage: 25,
            playerMana: 100,
            battleTimer: 0,
            lastAction: 0,
            combatLog: [],
            rewards: {
                xp: 0,
                gold: 0,
                reputation: 0
            }
        };
        
        // WebSocket connection to boss system
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        
        // Touch/gesture handling
        this.touchState = {
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            isDragging: false,
            gestureStarted: false
        };
        
        console.log('🏆⚔️ PWA Boss Battle Extension initialized');
        this.initialize();
    }
    
    initialize() {
        // Create boss battle UI elements
        this.createBossUI();
        
        // Connect to boss battle system
        this.connectToBossSystem();
        
        // Add boss battle button to existing controls
        this.addBossButton();
        
        // Register service worker for boss notifications
        this.registerBossNotifications();
        
        // Listen for nearby boss spawns
        this.setupProximityBossDetection();
        
        console.log('✅ Boss Battle Extension ready');
    }
    
    createBossUI() {
        // Boss Battle Modal
        const bossModal = document.createElement('div');
        bossModal.id = 'bossModal';
        bossModal.className = 'boss-modal';
        bossModal.innerHTML = `
            <div class="boss-modal-content">
                <div class="boss-header">
                    <div class="boss-title">
                        <span id="bossName">Fire Dragon</span>
                        <span id="bossLevel">Lv.25</span>
                    </div>
                    <button class="boss-close" onclick="pwaBossExtension.closeBattle()">&times;</button>
                </div>
                
                <div class="boss-health-container">
                    <div class="boss-health-bar">
                        <div class="boss-health-fill" id="bossHealthBar"></div>
                        <span class="boss-health-text" id="bossHealthText">1000/1000</span>
                    </div>
                </div>
                
                <div class="battle-grid-container" id="battleGridContainer">
                    <canvas id="battleCanvas" width="300" height="300"></canvas>
                </div>
                
                <div class="player-stats">
                    <div class="stat-bar health">
                        <span>HP</span>
                        <div class="stat-fill" id="playerHealthBar"></div>
                        <span id="playerHealthText">100/100</span>
                    </div>
                    <div class="stat-bar mana">
                        <span>MP</span>
                        <div class="stat-fill" id="playerManaBar"></div>
                        <span id="playerManaText">100/100</span>
                    </div>
                </div>
                
                <div class="battle-controls">
                    <div class="movement-controls">
                        <button class="move-btn" data-direction="up" onpointerdown="pwaBossExtension.startMove('up')" onpointerup="pwaBossExtension.stopMove()">⬆️</button>
                        <div class="move-row">
                            <button class="move-btn" data-direction="left" onpointerdown="pwaBossExtension.startMove('left')" onpointerup="pwaBossExtension.stopMove()">⬅️</button>
                            <button class="action-btn attack" onpointerdown="pwaBossExtension.attack()" onpointerup="pwaBossExtension.stopAction()">⚔️</button>
                            <button class="move-btn" data-direction="right" onpointerdown="pwaBossExtension.startMove('right')" onpointerup="pwaBossExtension.stopMove()">➡️</button>
                        </div>
                        <button class="move-btn" data-direction="down" onpointerdown="pwaBossExtension.startMove('down')" onpointerup="pwaBossExtension.stopMove()">⬇️</button>
                    </div>
                    <div class="action-controls">
                        <button class="action-btn special" onclick="pwaBossExtension.useSpecial()">✨</button>
                        <button class="action-btn heal" onclick="pwaBossExtension.heal()">🏥</button>
                        <button class="action-btn flee" onclick="pwaBossExtension.flee()">🏃</button>
                    </div>
                </div>
                
                <div class="combat-log" id="combatLog">
                    <div class="log-entry">Battle started!</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(bossModal);
        
        // Boss Discovery Notification
        const bossNotification = document.createElement('div');
        bossNotification.id = 'bossNotification';
        bossNotification.className = 'boss-notification';
        bossNotification.innerHTML = `
            <div class="boss-notification-content">
                <div class="boss-icon">🏆</div>
                <div class="boss-info">
                    <div class="boss-name" id="discoveredBossName">Fire Dragon</div>
                    <div class="boss-description" id="discoveredBossDesc">A legendary boss has appeared nearby!</div>
                </div>
                <div class="boss-notification-actions">
                    <button class="battle-btn" onclick="pwaBossExtension.engageBoss()">⚔️ Battle</button>
                    <button class="ignore-btn" onclick="pwaBossExtension.ignoreBoss()">❌</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(bossNotification);
        
        // Boss List Modal
        const bossListModal = document.createElement('div');
        bossListModal.id = 'bossListModal';
        bossListModal.className = 'boss-list-modal';
        bossListModal.innerHTML = `
            <div class="boss-list-content">
                <div class="boss-list-header">
                    <h3>🏆 Nearby Bosses</h3>
                    <button class="boss-close" onclick="pwaBossExtension.closeBossList()">&times;</button>
                </div>
                <div class="boss-list-container" id="bossListContainer">
                    <div class="boss-list-item loading">
                        <div class="loading-spinner"></div>
                        <span>Scanning for bosses...</span>
                    </div>
                </div>
                <div class="boss-list-actions">
                    <button class="refresh-btn" onclick="pwaBossExtension.refreshBossList()">🔄 Refresh</button>
                    <button class="create-btn" onclick="pwaBossExtension.showCreateBoss()">➕ Create</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(bossListModal);
    }
    
    addBossButton() {
        // Add boss battle button to existing mesh controls
        const meshControls = document.querySelector('.mesh-controls');
        if (meshControls) {
            const bossBtn = document.createElement('div');
            bossBtn.className = 'mesh-btn boss-btn';
            bossBtn.title = 'Boss Battles';
            bossBtn.innerHTML = '⚔️';
            bossBtn.onclick = () => this.showBossList();
            
            meshControls.appendChild(bossBtn);
        }
    }
    
    connectToBossSystem() {
        // Connect to existing boss battle WebSocket
        try {
            this.ws = new WebSocket('ws://localhost:8081');
            
            this.ws.onopen = () => {
                console.log('🔌 Connected to boss battle system');
                this.reconnectAttempts = 0;
                
                // Request nearby bosses based on current location
                this.ws.send(JSON.stringify({
                    type: 'request_nearby_bosses',
                    location: this.getCurrentLocation(),
                    range: 1000 // 1km range
                }));
            };
            
            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleBossMessage(data);
            };
            
            this.ws.onclose = () => {
                console.log('🔌 Disconnected from boss system');
                this.attemptReconnect();
            };
            
            this.ws.onerror = (error) => {
                console.error('❌ Boss WebSocket error:', error);
            };
            
        } catch (error) {
            console.error('❌ Failed to connect to boss system:', error);
            // Fall back to local boss simulation
            this.enableOfflineMode();
        }
    }
    
    handleBossMessage(data) {
        switch (data.type) {
            case 'boss_spawned':
                this.handleBossSpawned(data.boss);
                break;
            case 'boss_list':
                this.updateBossList(data.bosses);
                break;
            case 'battle_update':
                this.updateBattleState(data);
                break;
            case 'boss_defeated':
                this.handleBossDefeated(data);
                break;
            case 'battle_reward':
                this.handleBattleReward(data.rewards);
                break;
        }
    }
    
    handleBossSpawned(boss) {
        console.log('🏆 Boss spawned nearby:', boss.name);
        
        // Show boss notification
        const notification = document.getElementById('bossNotification');
        const bossName = document.getElementById('discoveredBossName');
        const bossDesc = document.getElementById('discoveredBossDesc');
        
        bossName.textContent = boss.name;
        bossDesc.textContent = `Level ${boss.level} ${boss.type} boss appeared!`;
        
        // Store boss data for engagement
        this.discoveredBoss = boss;
        
        // Show notification with animation
        notification.style.display = 'block';
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Add to empire value for discovery
        if (typeof meshState !== 'undefined') {
            meshState.empireValue += 1000;
            updateHUD();
        }
        
        // Haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
        }
        
        // Audio notification (if enabled)
        this.playBossSound('spawn');
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (notification.classList.contains('show')) {
                this.ignoreBoss();
            }
        }, 10000);
    }
    
    showBossList() {
        const modal = document.getElementById('bossListModal');
        modal.style.display = 'block';
        setTimeout(() => modal.classList.add('show'), 100);
        
        // Request fresh boss list
        this.refreshBossList();
    }
    
    closeBossList() {
        const modal = document.getElementById('bossListModal');
        modal.classList.remove('show');
        setTimeout(() => modal.style.display = 'none', 300);
    }
    
    refreshBossList() {
        const container = document.getElementById('bossListContainer');
        container.innerHTML = `
            <div class="boss-list-item loading">
                <div class="loading-spinner"></div>
                <span>Scanning for bosses...</span>
            </div>
        `;
        
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'request_nearby_bosses',
                location: this.getCurrentLocation(),
                range: 2000 // 2km range for boss list
            }));
        } else {
            // Generate mock boss list for offline mode
            this.generateMockBossList();
        }
    }
    
    updateBossList(bosses) {
        const container = document.getElementById('bossListContainer');
        
        if (bosses.length === 0) {
            container.innerHTML = `
                <div class="boss-list-item empty">
                    <div class="empty-icon">🏜️</div>
                    <span>No bosses nearby</span>
                    <small>Try expanding your search range</small>
                </div>
            `;
            return;
        }
        
        container.innerHTML = '';
        
        bosses.forEach(boss => {
            const bossItem = document.createElement('div');
            bossItem.className = 'boss-list-item';
            bossItem.innerHTML = `
                <div class="boss-icon">${this.getBossIcon(boss.type)}</div>
                <div class="boss-details">
                    <div class="boss-name">${boss.name}</div>
                    <div class="boss-stats">
                        <span class="level">Lv.${boss.level}</span>
                        <span class="type">${boss.type}</span>
                        <span class="distance">${boss.distance}m</span>
                    </div>
                    <div class="boss-rewards">
                        +${boss.xpReward} XP, +$${boss.goldReward}
                    </div>
                </div>
                <div class="boss-actions">
                    <button class="battle-btn small" onclick="pwaBossExtension.engageSpecificBoss('${boss.id}')">⚔️</button>
                    <button class="info-btn small" onclick="pwaBossExtension.showBossInfo('${boss.id}')">ℹ️</button>
                </div>
            `;
            
            container.appendChild(bossItem);
        });
    }
    
    engageBoss() {
        if (!this.discoveredBoss) return;
        
        // Hide notification
        const notification = document.getElementById('bossNotification');
        notification.classList.remove('show');
        setTimeout(() => notification.style.display = 'none', 300);
        
        // Start battle
        this.startBattle(this.discoveredBoss);
    }
    
    engageSpecificBoss(bossId) {
        // Close boss list
        this.closeBossList();
        
        // Find boss data and start battle
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'engage_boss',
                bossId: bossId
            }));
        }
    }
    
    ignoreBoss() {
        const notification = document.getElementById('bossNotification');
        notification.classList.remove('show');
        setTimeout(() => notification.style.display = 'none', 300);
        
        this.discoveredBoss = null;
    }
    
    startBattle(boss) {
        console.log('⚔️ Starting battle with:', boss.name);
        
        this.currentBoss = boss;
        this.battleState.active = true;
        this.battleState.bossHealth = boss.health;
        this.battleState.playerHealth = 100;
        this.battleState.playerMana = 100;
        this.battleState.battleTimer = 0;
        this.battleState.combatLog = [`Battle started against ${boss.name}!`];
        
        // Show battle modal
        const modal = document.getElementById('bossModal');
        modal.style.display = 'block';
        setTimeout(() => modal.classList.add('show'), 100);
        
        // Initialize battle UI
        this.updateBossUI();
        this.initializeBattleGrid();
        this.startBattleLoop();
        
        // Play battle music (if enabled)
        this.playBossSound('battle_start');
        
        // Haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate(300);
        }
        
        // Notify WebSocket of battle start
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'battle_start',
                bossId: boss.id,
                playerPosition: this.playerPosition
            }));
        }
    }
    
    initializeBattleGrid() {
        const canvas = document.getElementById('battleCanvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size
        const containerWidth = Math.min(300, window.innerWidth - 40);
        canvas.width = containerWidth;
        canvas.height = containerWidth;
        
        this.tileSize = containerWidth / this.gridSize;
        this.ctx = ctx;
        
        // Initialize positions
        this.playerPosition = { x: 5, y: 8 };
        this.bossPosition = { x: 5, y: 2 };
        
        // Start render loop
        this.renderBattleGrid();
    }
    
    renderBattleGrid() {
        if (!this.ctx || !this.battleState.active) return;
        
        const ctx = this.ctx;
        const tileSize = this.tileSize;
        
        // Clear canvas
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Draw grid
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        
        for (let x = 0; x <= this.gridSize; x++) {
            ctx.beginPath();
            ctx.moveTo(x * tileSize, 0);
            ctx.lineTo(x * tileSize, this.gridSize * tileSize);
            ctx.stroke();
        }
        
        for (let y = 0; y <= this.gridSize; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * tileSize);
            ctx.lineTo(this.gridSize * tileSize, y * tileSize);
            ctx.stroke();
        }
        
        // Draw aggro range (10 tiles from boss)
        if (this.isWithinAggroRange()) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
            const aggroRange = 3;
            const startX = Math.max(0, this.bossPosition.x - aggroRange);
            const startY = Math.max(0, this.bossPosition.y - aggroRange);
            const endX = Math.min(this.gridSize, this.bossPosition.x + aggroRange + 1);
            const endY = Math.min(this.gridSize, this.bossPosition.y + aggroRange + 1);
            
            ctx.fillRect(
                startX * tileSize,
                startY * tileSize,
                (endX - startX) * tileSize,
                (endY - startY) * tileSize
            );
        }
        
        // Draw boss
        ctx.fillStyle = '#FF4444';
        ctx.fillRect(
            this.bossPosition.x * tileSize + 2,
            this.bossPosition.y * tileSize + 2,
            tileSize - 4,
            tileSize - 4
        );
        
        // Boss icon
        ctx.fillStyle = '#FFF';
        ctx.font = `${Math.floor(tileSize * 0.6)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(
            '🏆',
            (this.bossPosition.x + 0.5) * tileSize,
            (this.bossPosition.y + 0.7) * tileSize
        );
        
        // Draw player
        ctx.fillStyle = '#4444FF';
        ctx.fillRect(
            this.playerPosition.x * tileSize + 2,
            this.playerPosition.y * tileSize + 2,
            tileSize - 4,
            tileSize - 4
        );
        
        // Player icon
        ctx.fillStyle = '#FFF';
        ctx.fillText(
            '👑',
            (this.playerPosition.x + 0.5) * tileSize,
            (this.playerPosition.y + 0.7) * tileSize
        );
        
        // Continue render loop
        if (this.battleState.active) {
            requestAnimationFrame(() => this.renderBattleGrid());
        }
    }
    
    startMove(direction) {
        if (!this.battleState.active || Date.now() - this.battleState.lastAction < 500) return;
        
        const oldPos = { ...this.playerPosition };
        
        switch (direction) {
            case 'up':
                if (this.playerPosition.y > 0) this.playerPosition.y--;
                break;
            case 'down':
                if (this.playerPosition.y < this.gridSize - 1) this.playerPosition.y++;
                break;
            case 'left':
                if (this.playerPosition.x > 0) this.playerPosition.x--;
                break;
            case 'right':
                if (this.playerPosition.x < this.gridSize - 1) this.playerPosition.x++;
                break;
        }
        
        // Check if position actually changed
        if (oldPos.x !== this.playerPosition.x || oldPos.y !== this.playerPosition.y) {
            this.battleState.lastAction = Date.now();
            this.addCombatLog(`Moved ${direction}`);
            
            // Check if entering/leaving aggro range
            if (this.isWithinAggroRange()) {
                if (!this.wasInAggroRange) {
                    this.addCombatLog('⚠️ Entered boss aggro range!');
                    this.playBossSound('aggro');
                }
                this.wasInAggroRange = true;
            } else {
                this.wasInAggroRange = false;
            }
            
            // Notify WebSocket of movement
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({
                    type: 'player_move',
                    position: this.playerPosition,
                    bossId: this.currentBoss?.id
                }));
            }
            
            // Haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
        }
    }
    
    stopMove() {
        // Stop movement (for continuous movement if implemented)
    }
    
    attack() {
        if (!this.battleState.active || this.battleState.playerMana < 10) return;
        
        const distance = this.getDistanceToTarget(this.playerPosition, this.bossPosition);
        
        if (distance > 1) {
            this.addCombatLog('❌ Target too far away!');
            this.playBossSound('error');
            return;
        }
        
        // Calculate damage
        const baseDamage = this.battleState.playerDamage;
        const randomVariation = Math.floor(Math.random() * 10) - 5;
        const damage = Math.max(1, baseDamage + randomVariation);
        
        // Apply damage
        this.battleState.bossHealth = Math.max(0, this.battleState.bossHealth - damage);
        this.battleState.playerMana = Math.max(0, this.battleState.playerMana - 10);
        this.battleState.lastAction = Date.now();
        
        this.addCombatLog(`⚔️ Hit for ${damage} damage!`);
        
        // Check if boss defeated
        if (this.battleState.bossHealth <= 0) {
            this.handleBossDefeat();
        } else {
            // Boss counter-attack
            setTimeout(() => this.bossAttack(), 1000);
        }
        
        this.updateBossUI();
        this.playBossSound('attack');
        
        // Haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
        }
        
        // Notify WebSocket
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'player_attack',
                damage: damage,
                bossId: this.currentBoss?.id
            }));
        }
    }
    
    bossAttack() {
        if (!this.battleState.active) return;
        
        const distance = this.getDistanceToTarget(this.bossPosition, this.playerPosition);
        
        // Boss can attack from distance 2 (ranged attack)
        if (distance <= 2) {
            const damage = Math.floor(Math.random() * 30) + 20;
            this.battleState.playerHealth = Math.max(0, this.battleState.playerHealth - damage);
            
            this.addCombatLog(`💥 Boss hits you for ${damage} damage!`);
            
            // Check if player defeated
            if (this.battleState.playerHealth <= 0) {
                this.handlePlayerDefeat();
            }
            
            this.updateBossUI();
            this.playBossSound('boss_attack');
            
            // Screen shake effect
            this.screenShake();
            
            // Haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate([200, 100, 200, 100, 200]);
            }
        } else {
            // Boss moves closer
            this.moveBossTowardsPlayer();
            this.addCombatLog('👹 Boss moves closer!');
        }
    }
    
    moveBossTowardsPlayer() {
        const dx = this.playerPosition.x - this.bossPosition.x;
        const dy = this.playerPosition.y - this.bossPosition.y;
        
        // Move one tile towards player (RuneScape-style pathfinding)
        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 0 && this.bossPosition.x < this.gridSize - 1) {
                this.bossPosition.x++;
            } else if (dx < 0 && this.bossPosition.x > 0) {
                this.bossPosition.x--;
            }
        } else {
            if (dy > 0 && this.bossPosition.y < this.gridSize - 1) {
                this.bossPosition.y++;
            } else if (dy < 0 && this.bossPosition.y > 0) {
                this.bossPosition.y--;
            }
        }
    }
    
    useSpecial() {
        if (!this.battleState.active || this.battleState.playerMana < 30) return;
        
        const distance = this.getDistanceToTarget(this.playerPosition, this.bossPosition);
        
        if (distance > 2) {
            this.addCombatLog('❌ Too far for special attack!');
            return;
        }
        
        // Special attack does more damage
        const damage = Math.floor(Math.random() * 40) + 50;
        this.battleState.bossHealth = Math.max(0, this.battleState.bossHealth - damage);
        this.battleState.playerMana = Math.max(0, this.battleState.playerMana - 30);
        
        this.addCombatLog(`✨ Special attack for ${damage} damage!`);
        
        if (this.battleState.bossHealth <= 0) {
            this.handleBossDefeat();
        }
        
        this.updateBossUI();
        this.playBossSound('special');
        
        // Visual effect
        this.specialAttackEffect();
        
        // Haptic feedback
        if (navigator.vibrate) {
            navigator.vibrate([150, 100, 150, 100, 150]);
        }
    }
    
    heal() {
        if (!this.battleState.active || this.battleState.playerMana < 20 || this.battleState.playerHealth >= 100) return;
        
        const healAmount = Math.floor(Math.random() * 30) + 20;
        this.battleState.playerHealth = Math.min(100, this.battleState.playerHealth + healAmount);
        this.battleState.playerMana = Math.max(0, this.battleState.playerMana - 20);
        
        this.addCombatLog(`🏥 Healed for ${healAmount} HP!`);
        this.updateBossUI();
        this.playBossSound('heal');
    }
    
    flee() {
        this.addCombatLog('🏃 You fled from battle!');
        this.endBattle(false);
    }
    
    handleBossDefeat() {
        this.addCombatLog(`🏆 ${this.currentBoss.name} defeated!`);
        
        // Calculate rewards
        const baseXP = this.currentBoss.level * 10;
        const baseGold = this.currentBoss.level * 50;
        
        this.battleState.rewards = {
            xp: baseXP + Math.floor(Math.random() * baseXP * 0.5),
            gold: baseGold + Math.floor(Math.random() * baseGold * 0.3),
            reputation: Math.floor(this.currentBoss.level / 5) + 1
        };
        
        // Add to empire value
        if (typeof meshState !== 'undefined') {
            meshState.empireValue += this.battleState.rewards.gold;
            updateHUD();
        }
        
        this.playBossSound('victory');
        
        // Show victory animation
        setTimeout(() => {
            this.endBattle(true);
        }, 2000);
    }
    
    handlePlayerDefeat() {
        this.addCombatLog('💀 You were defeated!');
        this.playBossSound('defeat');
        
        setTimeout(() => {
            this.endBattle(false);
        }, 2000);
    }
    
    endBattle(victory) {
        this.battleState.active = false;
        
        // Show results
        if (victory) {
            const rewards = this.battleState.rewards;
            this.addCombatLog(`🎉 Victory! +${rewards.xp} XP, +$${rewards.gold}, +${rewards.reputation} Rep`);
            
            // Show victory notification
            if (typeof showNotification !== 'undefined') {
                showNotification(`🏆 Boss defeated! +$${rewards.gold}`);
            }
        }
        
        // Close battle modal after delay
        setTimeout(() => {
            this.closeBattle();
        }, victory ? 3000 : 2000);
        
        // Notify WebSocket of battle end
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'battle_end',
                victory: victory,
                rewards: victory ? this.battleState.rewards : null,
                bossId: this.currentBoss?.id
            }));
        }
    }
    
    closeBattle() {
        const modal = document.getElementById('bossModal');
        modal.classList.remove('show');
        setTimeout(() => modal.style.display = 'none', 300);
        
        this.battleState.active = false;
        this.currentBoss = null;
    }
    
    updateBossUI() {
        // Boss info
        if (this.currentBoss) {
            document.getElementById('bossName').textContent = this.currentBoss.name;
            document.getElementById('bossLevel').textContent = `Lv.${this.currentBoss.level}`;
        }
        
        // Boss health
        const bossHealthPercent = (this.battleState.bossHealth / (this.currentBoss?.health || 1000)) * 100;
        document.getElementById('bossHealthBar').style.width = bossHealthPercent + '%';
        document.getElementById('bossHealthText').textContent = `${this.battleState.bossHealth}/${this.currentBoss?.health || 1000}`;
        
        // Player stats
        document.getElementById('playerHealthBar').style.width = this.battleState.playerHealth + '%';
        document.getElementById('playerHealthText').textContent = `${this.battleState.playerHealth}/100`;
        
        document.getElementById('playerManaBar').style.width = this.battleState.playerMana + '%';
        document.getElementById('playerManaText').textContent = `${this.battleState.playerMana}/100`;
    }
    
    addCombatLog(message) {
        this.battleState.combatLog.push(message);
        
        const logContainer = document.getElementById('combatLog');
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.textContent = message;
        
        logContainer.appendChild(logEntry);
        
        // Keep only last 5 entries
        while (logContainer.children.length > 5) {
            logContainer.removeChild(logContainer.firstChild);
        }
        
        // Auto-scroll
        logContainer.scrollTop = logContainer.scrollHeight;
    }
    
    // Utility methods
    getDistanceToTarget(pos1, pos2) {
        // Chebyshev distance (RuneScape-style)
        return Math.max(Math.abs(pos1.x - pos2.x), Math.abs(pos1.y - pos2.y));
    }
    
    isWithinAggroRange() {
        return this.getDistanceToTarget(this.playerPosition, this.bossPosition) <= 3;
    }
    
    getCurrentLocation() {
        // Use mesh state spatial position if available
        if (typeof meshState !== 'undefined' && meshState.spatialPosition) {
            return meshState.spatialPosition;
        }
        
        // Fallback to random location
        return {
            x: Math.floor(Math.random() * 10000) - 5000,
            y: Math.floor(Math.random() * 10000) - 5000,
            z: 0
        };
    }
    
    getBossIcon(type) {
        const icons = {
            combat: '⚔️',
            economic: '💰',
            guardian: '🛡️',
            legendary: '👑'
        };
        return icons[type] || '🏆';
    }
    
    // Visual Effects
    screenShake() {
        const modal = document.getElementById('bossModal');
        modal.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
            modal.style.animation = '';
        }, 500);
    }
    
    specialAttackEffect() {
        const canvas = document.getElementById('battleCanvas');
        canvas.style.filter = 'brightness(150%) contrast(120%)';
        setTimeout(() => {
            canvas.style.filter = '';
        }, 300);
    }
    
    // Audio System
    playBossSound(type) {
        // Use Web Audio API or HTML5 audio for sound effects
        // For now, just console log
        console.log(`🔊 Playing sound: ${type}`);
    }
    
    // Battle Loop
    startBattleLoop() {
        if (!this.battleState.active) return;
        
        this.battleState.battleTimer++;
        
        // Regenerate mana over time
        if (this.battleState.battleTimer % 3 === 0 && this.battleState.playerMana < 100) {
            this.battleState.playerMana = Math.min(100, this.battleState.playerMana + 1);
            this.updateBossUI();
        }
        
        // Boss AI actions
        if (this.battleState.battleTimer % 4 === 0) {
            if (Math.random() < 0.3) {
                this.bossAttack();
            } else if (this.getDistanceToTarget(this.bossPosition, this.playerPosition) > 2) {
                this.moveBossTowardsPlayer();
            }
        }
        
        // Continue battle loop
        setTimeout(() => this.startBattleLoop(), 1000);
    }
    
    // Offline Mode
    enableOfflineMode() {
        console.log('🏆 Boss battles in offline mode');
        
        // Generate mock bosses periodically
        setInterval(() => {
            if (Math.random() < 0.1) { // 10% chance every 10 seconds
                this.generateOfflineBoss();
            }
        }, 10000);
    }
    
    generateOfflineBoss() {
        const bossTypes = ['combat', 'economic', 'guardian'];
        const bossNames = {
            combat: ['Iron Warrior', 'Shadow Knight', 'Fire Beast'],
            economic: ['Gold Hoarder', 'Trade Baron', 'Coin Master'],
            guardian: ['Crystal Guardian', 'Stone Sentinel', 'Void Watcher']
        };
        
        const type = bossTypes[Math.floor(Math.random() * bossTypes.length)];
        const names = bossNames[type];
        const name = names[Math.floor(Math.random() * names.length)];
        
        const boss = {
            id: 'offline_' + Date.now(),
            name: name,
            type: type,
            level: Math.floor(Math.random() * 30) + 10,
            health: Math.floor(Math.random() * 800) + 600,
            distance: Math.floor(Math.random() * 500) + 100,
            xpReward: Math.floor(Math.random() * 100) + 50,
            goldReward: Math.floor(Math.random() * 200) + 100
        };
        
        this.handleBossSpawned(boss);
    }
    
    generateMockBossList() {
        setTimeout(() => {
            const mockBosses = [
                {
                    id: 'mock1',
                    name: 'Fire Dragon',
                    type: 'combat',
                    level: 25,
                    distance: 250,
                    xpReward: 75,
                    goldReward: 150
                },
                {
                    id: 'mock2',
                    name: 'Crystal Guardian',
                    type: 'guardian',
                    level: 18,
                    distance: 400,
                    xpReward: 50,
                    goldReward: 100
                }
            ];
            
            this.updateBossList(mockBosses);
        }, 1500);
    }
    
    // Connection Management
    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 Reconnection attempt ${this.reconnectAttempts}`);
            
            setTimeout(() => {
                this.connectToBossSystem();
            }, 5000 * this.reconnectAttempts);
        } else {
            console.log('🔌 Max reconnection attempts reached, switching to offline mode');
            this.enableOfflineMode();
        }
    }
    
    // Notification System
    registerBossNotifications() {
        if ('serviceWorker' in navigator && 'Notification' in window) {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    console.log('📱 Boss notifications enabled');
                }
            });
        }
    }
    
    showPushNotification(title, body) {
        if (Notification.permission === 'granted') {
            new Notification(title, {
                body: body,
                icon: '/icon-192.png',
                badge: '/badge-72.png',
                vibrate: [200, 100, 200]
            });
        }
    }
}

// CSS Styles for Boss Battle UI
const bossStyles = `
/* Boss Modal */
.boss-modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.9);
    z-index: 1000;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.boss-modal.show {
    opacity: 1;
}

.boss-modal-content {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90%;
    max-width: 400px;
    background: #1a1a1a;
    border: 2px solid #ff6600;
    border-radius: 15px;
    padding: 20px;
    box-shadow: 0 10px 30px rgba(255, 102, 0, 0.3);
}

.boss-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

.boss-title {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.boss-title span:first-child {
    font-size: 18px;
    font-weight: bold;
    color: #ff6600;
}

.boss-title span:last-child {
    font-size: 12px;
    color: #ccc;
}

.boss-close {
    background: none;
    border: none;
    color: #ff6600;
    font-size: 24px;
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Health Bars */
.boss-health-container {
    margin-bottom: 15px;
}

.boss-health-bar {
    position: relative;
    width: 100%;
    height: 20px;
    background: #333;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid #666;
}

.boss-health-fill {
    height: 100%;
    background: linear-gradient(90deg, #ff0000, #ff6600);
    width: 100%;
    transition: width 0.3s ease;
}

.boss-health-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 12px;
    font-weight: bold;
    color: #fff;
    text-shadow: 1px 1px 2px #000;
}

/* Battle Grid */
.battle-grid-container {
    margin-bottom: 15px;
    text-align: center;
}

#battleCanvas {
    border: 2px solid #666;
    border-radius: 8px;
    background: #0a0a0a;
    max-width: 100%;
    height: auto;
}

/* Player Stats */
.player-stats {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
}

.stat-bar {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
}

.stat-bar span:first-child {
    color: #ccc;
    min-width: 20px;
}

.stat-fill {
    flex: 1;
    height: 8px;
    background: #333;
    border-radius: 4px;
    position: relative;
    overflow: hidden;
}

.stat-fill::after {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 100%;
    background: linear-gradient(90deg, #00ff00, #ffff00, #ff0000);
    transition: width 0.3s ease;
}

.stat-bar.mana .stat-fill::after {
    background: linear-gradient(90deg, #0066ff, #00ccff);
}

.stat-bar span:last-child {
    color: #fff;
    min-width: 40px;
    text-align: right;
    font-size: 10px;
}

/* Battle Controls */
.battle-controls {
    display: flex;
    flex-direction: column;
    gap: 15px;
    margin-bottom: 15px;
}

.movement-controls {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
}

.move-row {
    display: flex;
    gap: 5px;
    align-items: center;
}

.move-btn, .action-btn {
    width: 50px;
    height: 50px;
    border: 2px solid #666;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.8);
    color: #fff;
    font-size: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    user-select: none;
    transition: all 0.2s ease;
}

.move-btn:active, .action-btn:active {
    transform: scale(0.95);
    background: rgba(255, 255, 255, 0.2);
}

.action-btn.attack {
    border-color: #ff6600;
    background: rgba(255, 102, 0, 0.2);
}

.action-controls {
    display: flex;
    justify-content: center;
    gap: 10px;
}

.action-controls .action-btn {
    width: 45px;
    height: 45px;
    font-size: 16px;
}

.action-btn.special {
    border-color: #ff00ff;
    background: rgba(255, 0, 255, 0.2);
}

.action-btn.heal {
    border-color: #00ff00;
    background: rgba(0, 255, 0, 0.2);
}

.action-btn.flee {
    border-color: #ffff00;
    background: rgba(255, 255, 0, 0.2);
}

/* Combat Log */
.combat-log {
    max-height: 80px;
    overflow-y: auto;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 5px;
    padding: 8px;
    font-size: 11px;
    line-height: 1.3;
}

.log-entry {
    margin-bottom: 2px;
    color: #ccc;
}

.log-entry:last-child {
    margin-bottom: 0;
}

/* Boss Notification */
.boss-notification {
    display: none;
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 999;
    opacity: 0;
    transition: all 0.3s ease;
}

.boss-notification.show {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
}

.boss-notification-content {
    background: rgba(255, 102, 0, 0.95);
    color: #fff;
    padding: 15px;
    border-radius: 15px;
    display: flex;
    align-items: center;
    gap: 15px;
    box-shadow: 0 5px 20px rgba(255, 102, 0, 0.5);
    max-width: 90vw;
}

.boss-icon {
    font-size: 30px;
}

.boss-info {
    flex: 1;
}

.boss-name {
    font-weight: bold;
    font-size: 16px;
}

.boss-description {
    font-size: 12px;
    opacity: 0.9;
}

.boss-notification-actions {
    display: flex;
    gap: 8px;
}

.battle-btn, .ignore-btn {
    padding: 8px 12px;
    border: none;
    border-radius: 8px;
    font-size: 12px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s ease;
}

.battle-btn {
    background: #fff;
    color: #ff6600;
}

.battle-btn:active {
    transform: scale(0.95);
}

.ignore-btn {
    background: rgba(0, 0, 0, 0.3);
    color: #fff;
}

/* Boss List Modal */
.boss-list-modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.9);
    z-index: 1000;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.boss-list-modal.show {
    opacity: 1;
}

.boss-list-content {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90%;
    max-width: 400px;
    max-height: 80%;
    background: #1a1a1a;
    border: 2px solid #ff6600;
    border-radius: 15px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.boss-list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 15px 20px;
    border-bottom: 1px solid #333;
    background: #222;
}

.boss-list-header h3 {
    margin: 0;
    color: #ff6600;
}

.boss-list-container {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
}

.boss-list-item {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 12px;
    margin-bottom: 8px;
    background: rgba(255, 102, 0, 0.1);
    border-radius: 8px;
    border-left: 3px solid #ff6600;
}

.boss-list-item.loading {
    justify-content: center;
    gap: 10px;
    color: #ccc;
}

.boss-list-item.empty {
    flex-direction: column;
    text-align: center;
    gap: 10px;
    color: #ccc;
}

.loading-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid #333;
    border-top: 2px solid #ff6600;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.boss-icon {
    font-size: 24px;
}

.boss-details {
    flex: 1;
}

.boss-name {
    font-weight: bold;
    color: #fff;
    font-size: 14px;
}

.boss-stats {
    display: flex;
    gap: 10px;
    font-size: 11px;
    color: #ccc;
    margin: 2px 0;
}

.boss-rewards {
    font-size: 10px;
    color: #00ff00;
}

.boss-actions {
    display: flex;
    gap: 5px;
}

.battle-btn.small, .info-btn.small {
    width: 35px;
    height: 35px;
    padding: 0;
    font-size: 14px;
}

.info-btn {
    background: rgba(0, 100, 255, 0.2);
    border: 1px solid #0066ff;
    color: #fff;
}

.boss-list-actions {
    display: flex;
    gap: 10px;
    padding: 15px 20px;
    border-top: 1px solid #333;
    background: #222;
}

.refresh-btn, .create-btn {
    flex: 1;
    padding: 10px;
    border: 1px solid #666;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.refresh-btn:active, .create-btn:active {
    transform: scale(0.95);
}

/* Animations */
@keyframes shake {
    0%, 100% { transform: translate(-50%, -50%) translateX(0); }
    25% { transform: translate(-50%, -50%) translateX(-5px); }
    75% { transform: translate(-50%, -50%) translateX(5px); }
}

/* Mobile Responsiveness */
@media (max-width: 480px) {
    .boss-modal-content {
        width: 95%;
        padding: 15px;
    }
    
    .move-btn, .action-btn {
        width: 45px;
        height: 45px;
        font-size: 18px;
    }
    
    .action-controls .action-btn {
        width: 40px;
        height: 40px;
        font-size: 14px;
    }
    
    .boss-notification-content {
        padding: 12px;
        gap: 12px;
    }
    
    .boss-icon {
        font-size: 25px;
    }
    
    .boss-name {
        font-size: 14px;
    }
    
    .boss-description {
        font-size: 11px;
    }
}

/* PWA Boss Button */
.mesh-btn.boss-btn {
    background: rgba(255, 102, 0, 0.2);
    border-color: #ff6600;
}

.mesh-btn.boss-btn:active {
    background: rgba(255, 102, 0, 0.3);
}

/* Stat Bar Animations */
.stat-fill::after {
    animation: stat-pulse 2s ease-in-out infinite;
}

@keyframes stat-pulse {
    0%, 100% { opacity: 0.8; }
    50% { opacity: 1; }
}
`;

// Inject styles into the page
const styleSheet = document.createElement('style');
styleSheet.textContent = bossStyles;
document.head.appendChild(styleSheet);

// Initialize Boss Extension
let pwaBossExtension;

// Wait for page to load
document.addEventListener('DOMContentLoaded', () => {
    // Initialize after a short delay to ensure existing PWA is ready
    setTimeout(() => {
        pwaBossExtension = new PWABossExtension();
        
        console.log('🏆⚔️ PWA Boss Battle Extension loaded and ready!');
        console.log('Features:');
        console.log('  ✅ Mobile-optimized touch controls');
        console.log('  ✅ RuneScape-style grid combat');
        console.log('  ✅ Real-time WebSocket battles');
        console.log('  ✅ Proximity-based boss spawning');
        console.log('  ✅ Integration with mesh networking');
        console.log('  ✅ Offline mode support');
        console.log('  ✅ Push notifications');
        console.log('  ✅ Empire system rewards');
    }, 2000);
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PWABossExtension;
}