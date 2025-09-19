/**
 * UNIFIED GAME CLIENT
 * Combines all canvas systems into one game engine
 * Like RuneScape/Habbo but for Document Generator
 */

class UnifiedGameClient {
    constructor() {
        // Get canvas elements
        this.gameCanvas = document.getElementById('game-world');
        this.uiCanvas = document.getElementById('ui-overlay');
        this.modalCanvas = document.getElementById('modal-layer');
        
        // Get contexts
        this.gameCtx = this.gameCanvas.getContext('2d');
        this.uiCtx = this.uiCanvas.getContext('2d');
        this.modalCtx = this.modalCanvas.getContext('2d');
        
        // Set canvas sizes
        this.resizeCanvases();
        window.addEventListener('resize', () => this.resizeCanvases());
        
        // Game state
        this.state = {
            connected: false,
            player: {
                id: null,
                x: 400,
                y: 300,
                name: 'Player',
                level: 1,
                hp: 100,
                maxHp: 100,
                mp: 50,
                maxMp: 50,
                energy: 100,
                maxEnergy: 100,
                inventory: new Array(28).fill(null)
            },
            world: {
                players: new Map(),
                npcs: new Map(),
                items: new Map()
            },
            ui: {
                draggedItem: null,
                draggedFrom: null,
                mouseX: 0,
                mouseY: 0
            }
        };
        
        // Layers (integrating existing systems)
        this.layers = {
            world: new WorldLayer(this),
            effects: new EffectsLayer(this),
            ui: new UILayer(this),
            dragDrop: new DragDropLayer(this),
            modal: new ModalLayer(this)
        };
        
        // WebSocket connection
        this.socket = null;
        this.reconnectAttempts = 0;
        
        // Start the game
        this.init();
    }
    
    async init() {
        console.log('🎮 Initializing Unified Game Client...');
        
        // Show loading
        this.updateLoadingStatus('Connecting to server...');
        
        // Setup input handlers
        this.setupInputHandlers();
        
        // Connect to server
        await this.connect();
        
        // Start game loop
        this.startGameLoop();
        
        // Hide loading
        document.getElementById('loading').style.display = 'none';
    }
    
    resizeCanvases() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        [this.gameCanvas, this.uiCanvas, this.modalCanvas].forEach(canvas => {
            canvas.width = width;
            canvas.height = height;
        });
    }
    
    async connect() {
        const wsUrl = 'ws://localhost:8080';
        console.log(`🔌 Connecting to ${wsUrl}...`);
        
        try {
            this.socket = new WebSocket(wsUrl);
            
            this.socket.onopen = () => {
                console.log('✅ Connected to server');
                this.state.connected = true;
                this.updateConnectionStatus('connected', 'Connected');
                
                // Send login packet
                this.sendPacket({
                    type: 'login',
                    name: this.state.player.name,
                    version: '1.0.0'
                });
            };
            
            this.socket.onmessage = (event) => {
                const packet = JSON.parse(event.data);
                this.handlePacket(packet);
            };
            
            this.socket.onclose = () => {
                console.log('❌ Disconnected from server');
                this.state.connected = false;
                this.updateConnectionStatus('disconnected', 'Disconnected');
                
                // Attempt reconnect
                setTimeout(() => {
                    if (this.reconnectAttempts < 5) {
                        this.reconnectAttempts++;
                        this.connect();
                    }
                }, 3000);
            };
            
            this.socket.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
            
        } catch (error) {
            console.error('Failed to connect:', error);
            this.updateConnectionStatus('disconnected', 'Connection failed');
        }
    }
    
    sendPacket(packet) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(packet));
        }
    }
    
    handlePacket(packet) {
        switch (packet.type) {
            case 'login_success':
                this.handleLoginSuccess(packet);
                break;
            case 'player_update':
                this.handlePlayerUpdate(packet);
                break;
            case 'world_update':
                this.handleWorldUpdate(packet);
                break;
            case 'chat_message':
                this.handleChatMessage(packet);
                break;
            case 'inventory_update':
                this.handleInventoryUpdate(packet);
                break;
            default:
                console.warn('Unknown packet type:', packet.type);
        }
    }
    
    handleLoginSuccess(packet) {
        console.log('✅ Login successful:', packet);
        this.state.player.id = packet.playerId;
        this.state.player.x = packet.x;
        this.state.player.y = packet.y;
        
        // Update UI
        this.updatePlayerStats();
    }
    
    handlePlayerUpdate(packet) {
        if (packet.id === this.state.player.id) {
            // Update our player
            Object.assign(this.state.player, packet.data);
            this.updatePlayerStats();
        } else {
            // Update other player
            this.state.world.players.set(packet.id, packet.data);
        }
    }
    
    handleWorldUpdate(packet) {
        // Update world state
        if (packet.players) {
            packet.players.forEach(p => {
                if (p.id !== this.state.player.id) {
                    this.state.world.players.set(p.id, p);
                }
            });
        }
        if (packet.npcs) {
            packet.npcs.forEach(n => this.state.world.npcs.set(n.id, n));
        }
        if (packet.items) {
            packet.items.forEach(i => this.state.world.items.set(i.id, i));
        }
    }
    
    handleChatMessage(packet) {
        this.addChatMessage(packet.sender, packet.message, packet.color);
    }
    
    handleInventoryUpdate(packet) {
        this.state.player.inventory = packet.inventory;
        this.updateInventoryDisplay();
    }
    
    setupInputHandlers() {
        // Keyboard input
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Mouse input
        this.gameCanvas.addEventListener('click', (e) => this.handleClick(e));
        this.gameCanvas.addEventListener('contextmenu', (e) => this.handleRightClick(e));
        this.gameCanvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        
        // Chat input
        const chatInput = document.getElementById('chat-input');
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const message = chatInput.value.trim();
                if (message) {
                    this.sendPacket({
                        type: 'chat',
                        message: message
                    });
                    chatInput.value = '';
                }
            }
        });
        
        // Inventory drag & drop
        this.setupInventoryDragDrop();
    }
    
    setupInventoryDragDrop() {
        const slots = document.querySelectorAll('.inventory-slot');
        
        slots.forEach(slot => {
            slot.addEventListener('dragstart', (e) => {
                const slotIndex = parseInt(slot.dataset.slot);
                const item = this.state.player.inventory[slotIndex];
                if (item) {
                    this.state.ui.draggedItem = item;
                    this.state.ui.draggedFrom = slotIndex;
                    e.dataTransfer.effectAllowed = 'move';
                }
            });
            
            slot.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            });
            
            slot.addEventListener('drop', (e) => {
                e.preventDefault();
                const targetSlot = parseInt(slot.dataset.slot);
                
                if (this.state.ui.draggedItem && this.state.ui.draggedFrom !== null) {
                    // Send item move packet
                    this.sendPacket({
                        type: 'move_item',
                        from: this.state.ui.draggedFrom,
                        to: targetSlot
                    });
                    
                    // Reset drag state
                    this.state.ui.draggedItem = null;
                    this.state.ui.draggedFrom = null;
                }
            });
        });
    }
    
    handleKeyDown(e) {
        switch (e.key) {
            case 'w':
            case 'ArrowUp':
                this.sendPacket({ type: 'move', direction: 'up' });
                break;
            case 's':
            case 'ArrowDown':
                this.sendPacket({ type: 'move', direction: 'down' });
                break;
            case 'a':
            case 'ArrowLeft':
                this.sendPacket({ type: 'move', direction: 'left' });
                break;
            case 'd':
            case 'ArrowRight':
                this.sendPacket({ type: 'move', direction: 'right' });
                break;
        }
    }
    
    handleKeyUp(e) {
        // Handle key release if needed
    }
    
    handleClick(e) {
        const rect = this.gameCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.sendPacket({
            type: 'click',
            x: x,
            y: y,
            button: 'left'
        });
    }
    
    handleRightClick(e) {
        e.preventDefault();
        const rect = this.gameCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.sendPacket({
            type: 'click',
            x: x,
            y: y,
            button: 'right'
        });
    }
    
    handleMouseMove(e) {
        const rect = this.gameCanvas.getBoundingClientRect();
        this.state.ui.mouseX = e.clientX - rect.left;
        this.state.ui.mouseY = e.clientY - rect.top;
    }
    
    startGameLoop() {
        const gameLoop = () => {
            // Update
            this.update();
            
            // Render
            this.render();
            
            // Next frame
            requestAnimationFrame(gameLoop);
        };
        
        gameLoop();
    }
    
    update() {
        // Update each layer
        this.layers.world.update();
        this.layers.effects.update();
        this.layers.ui.update();
    }
    
    render() {
        // Clear canvases
        this.gameCtx.clearRect(0, 0, this.gameCanvas.width, this.gameCanvas.height);
        this.uiCtx.clearRect(0, 0, this.uiCanvas.width, this.uiCanvas.height);
        
        // Render each layer
        this.layers.world.render();
        this.layers.effects.render();
        this.layers.ui.render();
        
        // Render modal if active
        if (this.layers.modal.isActive) {
            this.layers.modal.render();
        }
    }
    
    // UI Helper Methods
    updateLoadingStatus(status) {
        document.getElementById('loading-status').textContent = status;
    }
    
    updateConnectionStatus(className, text) {
        const statusEl = document.getElementById('connection-status');
        const textEl = document.getElementById('status-text');
        statusEl.className = className;
        textEl.textContent = text;
    }
    
    updatePlayerStats() {
        document.getElementById('level').textContent = this.state.player.level;
        document.getElementById('hp').textContent = `${this.state.player.hp}/${this.state.player.maxHp}`;
        document.getElementById('mp').textContent = `${this.state.player.mp}/${this.state.player.maxMp}`;
        document.getElementById('energy').textContent = `${this.state.player.energy}/${this.state.player.maxEnergy}`;
        
        // Update stat bars
        document.querySelector('.health').style.width = `${(this.state.player.hp / this.state.player.maxHp) * 100}%`;
        document.querySelector('.mana').style.width = `${(this.state.player.mp / this.state.player.maxMp) * 100}%`;
        document.querySelector('.energy').style.width = `${(this.state.player.energy / this.state.player.maxEnergy) * 100}%`;
    }
    
    updateInventoryDisplay() {
        const slots = document.querySelectorAll('.inventory-slot');
        
        this.state.player.inventory.forEach((item, index) => {
            const slot = slots[index];
            if (item) {
                slot.textContent = item.icon || '📦';
                slot.draggable = true;
            } else {
                slot.textContent = '';
                slot.draggable = false;
            }
        });
    }
    
    addChatMessage(sender, message, color = 'white') {
        const chatMessages = document.getElementById('chat-messages');
        const messageEl = document.createElement('div');
        messageEl.style.color = color;
        messageEl.textContent = `${sender}: ${message}`;
        chatMessages.appendChild(messageEl);
        
        // Auto-scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Limit messages
        while (chatMessages.children.length > 100) {
            chatMessages.removeChild(chatMessages.firstChild);
        }
    }
}

// Layer Classes (integrating existing systems)

class WorldLayer {
    constructor(game) {
        this.game = game;
        this.ctx = game.gameCtx;
    }
    
    update() {
        // Update world state
    }
    
    render() {
        const ctx = this.ctx;
        const player = this.game.state.player;
        
        // Draw background
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Draw grid
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        for (let x = 0; x < ctx.canvas.width; x += 50) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, ctx.canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < ctx.canvas.height; y += 50) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(ctx.canvas.width, y);
            ctx.stroke();
        }
        
        // Draw items
        this.game.state.world.items.forEach(item => {
            ctx.fillStyle = '#ff0';
            ctx.fillRect(item.x - 5, item.y - 5, 10, 10);
        });
        
        // Draw NPCs
        this.game.state.world.npcs.forEach(npc => {
            ctx.fillStyle = '#0f0';
            ctx.fillRect(npc.x - 10, npc.y - 10, 20, 20);
            ctx.fillStyle = 'white';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(npc.name, npc.x, npc.y - 15);
        });
        
        // Draw other players
        this.game.state.world.players.forEach(otherPlayer => {
            ctx.fillStyle = '#00f';
            ctx.fillRect(otherPlayer.x - 10, otherPlayer.y - 10, 20, 20);
            ctx.fillStyle = 'white';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(otherPlayer.name, otherPlayer.x, otherPlayer.y - 15);
        });
        
        // Draw our player
        ctx.fillStyle = '#f00';
        ctx.fillRect(player.x - 10, player.y - 10, 20, 20);
        ctx.fillStyle = 'white';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(player.name, player.x, player.y - 15);
    }
}

class EffectsLayer {
    constructor(game) {
        this.game = game;
        this.ctx = game.gameCtx;
        this.particles = [];
    }
    
    update() {
        // Update particle effects
        this.particles = this.particles.filter(p => {
            p.life--;
            p.y -= p.velocity;
            p.x += (Math.random() - 0.5) * 2;
            return p.life > 0;
        });
    }
    
    render() {
        const ctx = this.ctx;
        
        // Draw particles
        this.particles.forEach(p => {
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
        });
        ctx.globalAlpha = 1;
    }
    
    addParticle(x, y, color = '#fff') {
        this.particles.push({
            x: x,
            y: y,
            velocity: 2 + Math.random() * 2,
            life: 30,
            maxLife: 30,
            color: color
        });
    }
}

class UILayer {
    constructor(game) {
        this.game = game;
        this.ctx = game.uiCtx;
    }
    
    update() {
        // Update UI state
    }
    
    render() {
        // Render minimap
        this.renderMinimap();
    }
    
    renderMinimap() {
        const minimapCanvas = document.getElementById('minimap');
        const ctx = minimapCanvas.getContext('2d');
        
        // Clear minimap
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, 150, 150);
        
        // Draw minimap content
        ctx.fillStyle = '#0f0';
        ctx.fillRect(70, 70, 10, 10); // Player position
        
        // Draw other players on minimap
        this.game.state.world.players.forEach(player => {
            ctx.fillStyle = '#00f';
            ctx.fillRect(
                (player.x / this.game.gameCanvas.width) * 150,
                (player.y / this.game.gameCanvas.height) * 150,
                3, 3
            );
        });
    }
}

class DragDropLayer {
    constructor(game) {
        this.game = game;
    }
    
    update() {
        // Update drag drop state
    }
    
    render() {
        // Render dragged item at mouse position
        if (this.game.state.ui.draggedItem) {
            const ctx = this.game.uiCtx;
            ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
            ctx.fillRect(
                this.game.state.ui.mouseX - 20,
                this.game.state.ui.mouseY - 20,
                40, 40
            );
        }
    }
}

class ModalLayer {
    constructor(game) {
        this.game = game;
        this.ctx = game.modalCtx;
        this.isActive = false;
    }
    
    show() {
        this.isActive = true;
        this.game.modalCanvas.style.display = 'block';
    }
    
    hide() {
        this.isActive = false;
        this.game.modalCanvas.style.display = 'none';
    }
    
    update() {
        // Update modal state
    }
    
    render() {
        const ctx = this.ctx;
        
        // Draw modal background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Draw modal content
        ctx.fillStyle = '#333';
        ctx.fillRect(
            ctx.canvas.width / 2 - 200,
            ctx.canvas.height / 2 - 150,
            400, 300
        );
    }
}

// Start the game when page loads
window.addEventListener('load', () => {
    window.game = new UnifiedGameClient();
});