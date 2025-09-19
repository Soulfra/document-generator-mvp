#!/usr/bin/env node

/**
 * 🎮🎨 GAME BOY SPRITE BRIDGE
 * 
 * Connects the SoulFra Sprite Editor V3 with the Game Boy Eyeball Emulator
 * Enables real-time sprite loading, character agent control, and AI orchestration
 * 
 * Features:
 * - Real-time sprite → Game Boy conversion
 * - Character agent automation
 * - WebSocket communication
 * - ROM generation from sprites
 * - AI-controlled gameplay
 */

const EventEmitter = require('events');
const WebSocket = require('ws');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Import existing components
const GameBoyEyeballEmulator = require('./gameboy-eyeball-emulator.js');
const MasterAsyncOrchestrator = require('./MASTER-ASYNC-ORCHESTRATOR.js');

class GameBoySpritebridge extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            port: options.port || 8082,
            gameBoyPort: options.gameBoyPort || 8083,
            spriteEditorPort: options.spriteEditorPort || 8084,
            enableAI: options.enableAI !== false,
            enableCharacterAgents: options.enableCharacterAgents !== false,
            autoLoadSprites: options.autoLoadSprites !== false,
            ...options
        };
        
        // Game Boy emulator instance
        this.gameboy = new GameBoyEyeballEmulator({
            fps: 60,
            scale: 4,
            eyeTrackingEnabled: true
        });
        
        // Character orchestrator for AI control
        this.orchestrator = this.config.enableCharacterAgents ? 
            new MasterAsyncOrchestrator() : null;
        
        // WebSocket servers
        this.wss = null;
        this.clients = new Map();
        
        // Sprite management
        this.spriteBank = new Map();
        this.currentSprites = [];
        this.activeDomain = 'white';
        
        // ROM generation
        this.romTemplates = new Map();
        this.generatedROMs = new Map();
        
        // AI control state
        this.aiControlled = false;
        this.currentAgent = null;
        this.automationQueue = [];
        
        // Game Boy color palette for sprite conversion
        this.gbPalette = [
            [0x9B, 0xBC, 0x0F], // Lightest green
            [0x8B, 0xAC, 0x0F], // Light green  
            [0x30, 0x62, 0x30], // Dark green
            [0x0F, 0x38, 0x0F]  // Darkest green
        ];
        
        this.init();
    }
    
    async init() {
        console.log('🎮 Starting Game Boy Sprite Bridge...');
        
        // Initialize WebSocket server
        await this.startWebSocketServer();
        
        // Initialize Game Boy emulator
        await this.initializeGameBoy();
        
        // Load ROM templates
        await this.loadROMTemplates();
        
        // Start character agent integration if enabled
        if (this.config.enableCharacterAgents) {
            await this.initializeCharacterAgents();
        }
        
        // Set up event handlers
        this.setupEventHandlers();
        
        console.log(`🎮 Game Boy Sprite Bridge running on port ${this.config.port}`);
        console.log(`🎯 Game Boy WebSocket: ws://localhost:${this.config.gameBoyPort}`);
        console.log(`🎨 Sprite Editor Bridge: ws://localhost:${this.config.spriteEditorPort}`);
        
        this.emit('ready');
    }
    
    async startWebSocketServer() {
        this.wss = new WebSocket.Server({ 
            port: this.config.port,
            perMessageDeflate: false
        });
        
        this.wss.on('connection', (ws, req) => {
            const clientId = this.generateClientId();
            const clientType = req.url?.includes('gameboy') ? 'gameboy' : 
                              req.url?.includes('sprite') ? 'sprite-editor' : 'unknown';
            
            const client = {
                id: clientId,
                type: clientType,
                ws: ws,
                lastSeen: Date.now(),
                metadata: {}
            };
            
            this.clients.set(clientId, client);
            
            console.log(`🔗 Client connected: ${clientType} (${clientId})`);
            
            // Send welcome message
            ws.send(JSON.stringify({
                type: 'connection',
                clientId: clientId,
                serverType: 'gameboy-sprite-bridge',
                capabilities: [
                    'sprite-loading',
                    'rom-generation', 
                    'ai-control',
                    'character-agents',
                    'real-time-sync'
                ]
            }));
            
            ws.on('message', (data) => {
                this.handleWebSocketMessage(client, data);
            });
            
            ws.on('close', () => {
                this.clients.delete(clientId);
                console.log(`🔗 Client disconnected: ${clientType} (${clientId})`);
            });
            
            ws.on('error', (error) => {
                console.error(`🔗 WebSocket error for ${clientType}:`, error);
                this.clients.delete(clientId);
            });
        });
    }
    
    async initializeGameBoy() {
        // Load a default ROM or create one
        const defaultROM = await this.createDefaultROM();
        await this.gameboy.loadROM(defaultROM);
        
        // Set up Game Boy event handlers
        this.gameboy.on('frame', (frameData) => {
            this.broadcastGameBoyFrame(frameData);
        });
        
        this.gameboy.on('button-press', (button) => {
            this.broadcastGameBoyInput(button, true);
        });
        
        this.gameboy.on('button-release', (button) => {
            this.broadcastGameBoyInput(button, false);
        });
        
        console.log('🎮 Game Boy emulator initialized');
    }
    
    async loadROMTemplates() {
        const templatesDir = path.join(__dirname, 'gameboy-rom-templates');
        
        try {
            const templateFiles = await fs.readdir(templatesDir);
            
            for (const file of templateFiles) {
                if (file.endsWith('.json')) {
                    const templatePath = path.join(templatesDir, file);
                    const templateData = JSON.parse(await fs.readFile(templatePath, 'utf8'));
                    const templateName = path.basename(file, '.json');
                    
                    this.romTemplates.set(templateName, templateData);
                    console.log(`📦 Loaded ROM template: ${templateName}`);
                }
            }
        } catch (error) {
            console.log('📦 No ROM templates directory found, creating default templates...');
            await this.createDefaultROMTemplates();
        }
    }
    
    async createDefaultROMTemplates() {
        const templatesDir = path.join(__dirname, 'gameboy-rom-templates');
        await fs.mkdir(templatesDir, { recursive: true });
        
        // Sprite Display Template
        const spriteDisplayTemplate = {
            name: 'Sprite Display',
            description: 'Simple ROM for displaying sprites',
            type: 'display',
            rom_size: '32KB',
            ram_size: '8KB',
            header: {
                title: 'SPRITE_DISPLAY',
                manufacturer: 'SOULFRA',
                cgb_flag: 0x80,
                sgb_flag: 0x00,
                cart_type: 0x00,
                rom_size: 0x01,
                ram_size: 0x02
            },
            code_sections: {
                init: 'LD SP, $FFFE\\nDI\\nLD A, $91\\nLDH [$40], A',
                main_loop: 'JP main_loop',
                vblank: 'RETI',
                sprite_data_start: 0x8000,
                sprite_data_size: 0x2000
            }
        };
        
        // Game Template with Sprite Character
        const gameTemplate = {
            name: 'Sprite Character Game',
            description: 'Simple game using sprite as player character',
            type: 'game',
            rom_size: '32KB',
            ram_size: '8KB',
            header: {
                title: 'SPRITE_GAME',
                manufacturer: 'SOULFRA',
                cgb_flag: 0x80,
                sgb_flag: 0x00,
                cart_type: 0x00,
                rom_size: 0x01,
                ram_size: 0x02
            },
            gameplay: {
                player_sprite_slot: 0,
                player_x: 80,
                player_y: 72,
                movement_speed: 1,
                collision_detection: true,
                background_tiles: 'simple_grid'
            }
        };
        
        await fs.writeFile(
            path.join(templatesDir, 'sprite-display.json'),
            JSON.stringify(spriteDisplayTemplate, null, 2)
        );
        
        await fs.writeFile(
            path.join(templatesDir, 'sprite-game.json'),
            JSON.stringify(gameTemplate, null, 2)
        );
        
        this.romTemplates.set('sprite-display', spriteDisplayTemplate);
        this.romTemplates.set('sprite-game', gameTemplate);
        
        console.log('📦 Created default ROM templates');
    }
    
    async initializeCharacterAgents() {
        if (!this.orchestrator) return;
        
        // Connect character agents to Game Boy controls
        this.orchestrator.on('character-action', (agentId, action, data) => {
            this.handleCharacterAction(agentId, action, data);
        });
        
        // Set up AI control protocols
        this.setupCharacterGameBoyMappings();
        
        console.log('🤖 Character agents initialized for Game Boy control');
    }
    
    setupCharacterGameBoyMappings() {
        // Map character agents to Game Boy controls
        this.characterMappings = {
            'alice_validator': {
                controls: ['A', 'B'], // Binary controls
                behavior: 'precise',
                priority: 'validation'
            },
            'bob_generator': {
                controls: ['UP', 'DOWN', 'LEFT', 'RIGHT'], // Movement
                behavior: 'random',
                priority: 'exploration'
            },
            'charlie_decider': {
                controls: ['START', 'SELECT'], // Menu controls
                behavior: 'strategic',
                priority: 'decisions'
            },
            'cal_riven': {
                controls: ['A', 'B', 'UP', 'DOWN'], // Combat
                behavior: 'aggressive',
                priority: 'combat'
            },
            'pokemon_trainer': {
                controls: ['A', 'B', 'START'], // Pokemon-style
                behavior: 'patient',
                priority: 'training'
            }
        };
    }
    
    setupEventHandlers() {
        // Sprite editor events
        this.on('sprite-loaded', this.handleSpriteLoaded.bind(this));
        this.on('sprite-updated', this.handleSpriteUpdated.bind(this));
        this.on('rom-generation-request', this.handleROMGenerationRequest.bind(this));
        
        // Game Boy events
        this.on('gameboy-ready', this.handleGameBoyReady.bind(this));
        this.on('ai-control-request', this.handleAIControlRequest.bind(this));
        
        // Character agent events
        if (this.orchestrator) {
            this.on('character-takeover', this.handleCharacterTakeover.bind(this));
            this.on('automation-queue', this.handleAutomationQueue.bind(this));
        }
    }
    
    handleWebSocketMessage(client, data) {
        try {
            const message = JSON.parse(data);
            
            switch (message.type) {
                case 'load-sprite':
                    this.handleLoadSprite(client, message.data);
                    break;
                    
                case 'generate-rom':
                    this.handleGenerateROM(client, message.data);
                    break;
                    
                case 'gameboy-input':
                    this.handleGameBoyInput(client, message.data);
                    break;
                    
                case 'ai-control':
                    this.handleAIControl(client, message.data);
                    break;
                    
                case 'sprite-bank-update':
                    this.handleSpriteBankUpdate(client, message.data);
                    break;
                    
                case 'character-agent-control':
                    this.handleCharacterAgentControl(client, message.data);
                    break;
                    
                case 'request-gameboy-state':
                    this.sendGameBoyState(client);
                    break;
                    
                default:
                    console.log(`🔗 Unknown message type: ${message.type}`);
            }
        } catch (error) {
            console.error('🔗 Error processing WebSocket message:', error);
            client.ws.send(JSON.stringify({
                type: 'error',
                message: 'Invalid message format'
            }));
        }
    }
    
    async handleLoadSprite(client, spriteData) {
        try {
            console.log(`🎨 Loading sprite from ${client.type} client...`);
            
            // Convert sprite data to Game Boy format
            const gbSprite = await this.convertSpriteToGameBoy(spriteData);
            
            // Store in sprite bank
            const spriteId = this.generateSpriteId(spriteData);
            this.spriteBank.set(spriteId, {
                original: spriteData,
                gameboy: gbSprite,
                metadata: {
                    created: new Date().toISOString(),
                    domain: spriteData.domainMetadata?.domain || this.activeDomain,
                    source: client.type
                }
            });
            
            // Load into Game Boy if auto-load is enabled
            if (this.config.autoLoadSprites) {
                await this.loadSpriteIntoGameBoy(gbSprite);
            }
            
            // Broadcast to all clients
            this.broadcast({
                type: 'sprite-loaded',
                spriteId: spriteId,
                metadata: {
                    domain: spriteData.domainMetadata?.domain || this.activeDomain,
                    size: `${spriteData.width}x${spriteData.height}`,
                    frames: spriteData.animation?.frameCount || 1
                }
            });
            
            // Respond to sender
            client.ws.send(JSON.stringify({
                type: 'sprite-load-success',
                spriteId: spriteId,
                gameboyData: gbSprite
            }));
            
            this.emit('sprite-loaded', spriteId, gbSprite);
            
        } catch (error) {
            console.error('🎨 Error loading sprite:', error);
            client.ws.send(JSON.stringify({
                type: 'sprite-load-error',
                error: error.message
            }));
        }
    }
    
    async convertSpriteToGameBoy(spriteData) {
        console.log('🎨 Converting sprite to Game Boy format...');
        
        const gbSprite = {
            width: spriteData.width,
            height: spriteData.height,
            frames: [],
            metadata: spriteData.domainMetadata || {}
        };
        
        // Process each layer and frame
        for (const layer of spriteData.layers) {
            if (!layer.visible) continue;
            
            for (let frameIndex = 0; frameIndex < layer.frames.length; frameIndex++) {
                const frame = layer.frames[frameIndex];
                
                // Decode base64 frame data
                const frameData = new Uint8ClampedArray(
                    atob(frame.data).split('').map(char => char.charCodeAt(0))
                );
                
                // Convert to Game Boy 4-color palette
                const gbFrameData = this.convertToGameBoyPalette(
                    frameData, 
                    spriteData.width, 
                    spriteData.height
                );
                
                // Convert to 8x8 tiles (Game Boy format)
                const tiles = this.convertToTiles(gbFrameData, spriteData.width, spriteData.height);
                
                gbSprite.frames.push({
                    tileData: tiles,
                    paletteData: this.gbPalette,
                    timestamp: frame.timestamp
                });
            }
        }
        
        return gbSprite;
    }
    
    convertToGameBoyPalette(imageData, width, height) {
        const result = [];
        
        for (let i = 0; i < imageData.length; i += 4) {
            const r = imageData[i];
            const g = imageData[i + 1];
            const b = imageData[i + 2];
            const a = imageData[i + 3];
            
            if (a === 0) {
                result.push(0); // Transparent
            } else {
                // Convert to grayscale and map to Game Boy palette
                const gray = (r * 0.299 + g * 0.587 + b * 0.114);
                
                if (gray < 64) result.push(0);      // Darkest
                else if (gray < 128) result.push(1); // Dark
                else if (gray < 192) result.push(2); // Light
                else result.push(3);                 // Lightest
            }
        }
        
        return result;
    }
    
    convertToTiles(pixelData, width, height) {
        const tiles = [];
        const tilesX = Math.ceil(width / 8);
        const tilesY = Math.ceil(height / 8);
        
        for (let tileY = 0; tileY < tilesY; tileY++) {
            for (let tileX = 0; tileX < tilesX; tileX++) {
                const tile = [];
                
                // Extract 8x8 tile
                for (let y = 0; y < 8; y++) {
                    for (let x = 0; x < 8; x++) {
                        const pixelX = tileX * 8 + x;
                        const pixelY = tileY * 8 + y;
                        
                        if (pixelX < width && pixelY < height) {
                            const pixelIndex = pixelY * width + pixelX;
                            tile.push(pixelData[pixelIndex] || 0);
                        } else {
                            tile.push(0); // Padding
                        }
                    }
                }
                
                tiles.push(tile);
            }
        }
        
        return tiles;
    }
    
    async loadSpriteIntoGameBoy(gbSprite) {
        // Load sprite data into Game Boy emulator
        // This would typically involve writing to VRAM
        console.log('🎮 Loading sprite into Game Boy emulator...');
        
        // For now, we'll store it and make it available to the emulator
        this.currentSprites.push(gbSprite);
        
        // Notify Game Boy emulator
        if (this.gameboy && this.gameboy.loadSprites) {
            await this.gameboy.loadSprites([gbSprite]);
        }
        
        // Broadcast update
        this.broadcast({
            type: 'gameboy-sprite-loaded',
            spriteCount: this.currentSprites.length
        });
    }
    
    async handleGenerateROM(client, request) {
        try {
            console.log(`🎮 Generating ROM: ${request.template || 'default'}`);
            
            const template = this.romTemplates.get(request.template || 'sprite-display');
            if (!template) {
                throw new Error(`ROM template not found: ${request.template}`);
            }
            
            // Generate ROM with current sprites
            const rom = await this.generateROM(template, request.sprites || this.currentSprites);
            
            // Store generated ROM
            const romId = this.generateROMId(template, rom);
            this.generatedROMs.set(romId, {
                rom: rom,
                template: template,
                sprites: request.sprites || this.currentSprites,
                generated: new Date().toISOString()
            });
            
            // Load into Game Boy if requested
            if (request.autoLoad !== false) {
                await this.gameboy.loadROM(rom);
            }
            
            // Respond with ROM data
            client.ws.send(JSON.stringify({
                type: 'rom-generated',
                romId: romId,
                template: template.name,
                size: rom.length,
                autoLoaded: request.autoLoad !== false
            }));
            
            this.broadcast({
                type: 'rom-available',
                romId: romId,
                template: template.name
            });
            
        } catch (error) {
            console.error('🎮 ROM generation error:', error);
            client.ws.send(JSON.stringify({
                type: 'rom-generation-error',
                error: error.message
            }));
        }
    }
    
    async generateROM(template, sprites) {
        console.log(`🎮 Generating ROM from template: ${template.name}`);
        
        // Create basic ROM structure
        const romSize = this.parseROMSize(template.rom_size);
        const rom = new Uint8Array(romSize);
        
        // ROM Header (0x0100-0x014F)
        this.writeROMHeader(rom, template.header);
        
        // Entry point (0x0100-0x0103)
        rom[0x0100] = 0x00; // NOP
        rom[0x0101] = 0xC3; // JP
        rom[0x0102] = 0x50; // Low byte of jump address (0x0150)
        rom[0x0103] = 0x01; // High byte of jump address
        
        // Nintendo logo (0x0104-0x0133) - Required for Game Boy
        this.writeNintendoLogo(rom);
        
        // Game code starts at 0x0150
        let codeOffset = 0x0150;
        
        // Write initialization code
        codeOffset = this.writeInitCode(rom, codeOffset, template);
        
        // Write sprite data
        codeOffset = this.writeSpriteData(rom, codeOffset, sprites);
        
        // Write main game loop
        codeOffset = this.writeMainLoop(rom, codeOffset, template);
        
        console.log(`🎮 ROM generated: ${rom.length} bytes, code size: ${codeOffset - 0x0150} bytes`);
        return rom;
    }
    
    writeROMHeader(rom, header) {
        // Title (0x0134-0x0143)
        const title = header.title.substring(0, 16).padEnd(16, '\\0');
        for (let i = 0; i < title.length; i++) {
            rom[0x0134 + i] = title.charCodeAt(i);
        }
        
        // CGB flag (0x0143)
        rom[0x0143] = header.cgb_flag || 0x80;
        
        // Manufacturer code (0x013F-0x0142)
        const manufacturer = (header.manufacturer || 'SOULFRA').substring(0, 4);
        for (let i = 0; i < manufacturer.length; i++) {
            rom[0x013F + i] = manufacturer.charCodeAt(i);
        }
        
        // SGB flag (0x0146)
        rom[0x0146] = header.sgb_flag || 0x00;
        
        // Cartridge type (0x0147)
        rom[0x0147] = header.cart_type || 0x00;
        
        // ROM size (0x0148)
        rom[0x0148] = header.rom_size || 0x01;
        
        // RAM size (0x0149)
        rom[0x0149] = header.ram_size || 0x02;
        
        // Calculate and write checksum (0x014D)
        let checksum = 0;
        for (let i = 0x0134; i <= 0x014C; i++) {
            checksum = (checksum - rom[i] - 1) & 0xFF;
        }
        rom[0x014D] = checksum;
    }
    
    writeNintendoLogo(rom) {
        // Nintendo logo bitmap (required for Game Boy)
        const nintendoLogo = [
            0xCE, 0xED, 0x66, 0x66, 0xCC, 0x0D, 0x00, 0x0B,
            0x03, 0x73, 0x00, 0x83, 0x00, 0x0C, 0x00, 0x0D,
            0x00, 0x08, 0x11, 0x1F, 0x88, 0x89, 0x00, 0x0E,
            0xDC, 0xCC, 0x6E, 0xE6, 0xDD, 0xDD, 0xD9, 0x99,
            0xBB, 0xBB, 0x67, 0x63, 0x6E, 0x0E, 0xEC, 0xCC,
            0xDD, 0xDC, 0x99, 0x9F, 0xBB, 0xB9, 0x33, 0x3E
        ];
        
        for (let i = 0; i < nintendoLogo.length; i++) {
            rom[0x0104 + i] = nintendoLogo[i];
        }
    }
    
    writeInitCode(rom, offset, template) {
        // Basic Game Boy initialization
        const initCode = [
            0x31, 0xFE, 0xFF, // LD SP, $FFFE
            0xF3,             // DI (disable interrupts)
            0x3E, 0x91,       // LD A, $91
            0xE0, 0x40,       // LDH [$40], A (LCDC)
            0x3E, 0x83,       // LD A, $83
            0xE0, 0x47,       // LDH [$47], A (BGP - background palette)
            0x3E, 0xE4,       // LD A, $E4
            0xE0, 0x48,       // LDH [$48], A (OBP0 - object palette 0)
            0xFB              // EI (enable interrupts)
        ];
        
        for (let i = 0; i < initCode.length; i++) {
            rom[offset + i] = initCode[i];
        }
        
        return offset + initCode.length;
    }
    
    writeSpriteData(rom, offset, sprites) {
        console.log(`🎨 Writing ${sprites.length} sprites to ROM at offset ${offset.toString(16)}`);
        
        // Write sprite tile data to VRAM area in ROM
        for (const sprite of sprites) {
            for (const frame of sprite.frames) {
                for (const tile of frame.tileData) {
                    // Convert 4-color palette to Game Boy tile format
                    for (let row = 0; row < 8; row++) {
                        let byte1 = 0, byte2 = 0;
                        
                        for (let col = 0; col < 8; col++) {
                            const pixelIndex = row * 8 + col;
                            const pixel = tile[pixelIndex] || 0;
                            
                            if (pixel & 1) byte1 |= (1 << (7 - col));
                            if (pixel & 2) byte2 |= (1 << (7 - col));
                        }
                        
                        if (offset < rom.length - 2) {
                            rom[offset++] = byte1;
                            rom[offset++] = byte2;
                        }
                    }
                }
            }
        }
        
        return offset;
    }
    
    writeMainLoop(rom, offset, template) {
        // Simple main loop that displays sprites
        const mainLoop = [
            // Wait for VBlank
            0xE0, 0x41,       // LDH [$41], A (STAT)
            0xF0, 0x44,       // LDH A, [$44] (LY)
            0xFE, 0x90,       // CP $90
            0x20, 0xFA,       // JR NZ, -6
            
            // Simple game logic here
            0x18, 0xF6        // JR -10 (loop back)
        ];
        
        for (let i = 0; i < mainLoop.length && offset < rom.length; i++) {
            rom[offset + i] = mainLoop[i];
        }
        
        return offset + mainLoop.length;
    }
    
    parseROMSize(sizeStr) {
        const size = sizeStr.toLowerCase();
        if (size.includes('32kb')) return 32 * 1024;
        if (size.includes('64kb')) return 64 * 1024;
        if (size.includes('128kb')) return 128 * 1024;
        if (size.includes('256kb')) return 256 * 1024;
        return 32 * 1024; // Default
    }
    
    async handleAIControl(client, request) {
        if (!this.config.enableAI) {
            client.ws.send(JSON.stringify({
                type: 'ai-control-error',
                error: 'AI control disabled'
            }));
            return;
        }
        
        console.log(`🤖 AI control request: ${request.action}`);
        
        switch (request.action) {
            case 'enable':
                this.aiControlled = true;
                this.currentAgent = request.agent || 'alice_validator';
                this.startAIControl();
                break;
                
            case 'disable':
                this.aiControlled = false;
                this.currentAgent = null;
                this.stopAIControl();
                break;
                
            case 'switch-agent':
                this.currentAgent = request.agent;
                this.notifyAgentSwitch();
                break;
                
            case 'queue-action':
                this.automationQueue.push(request.data);
                break;
        }
        
        client.ws.send(JSON.stringify({
            type: 'ai-control-status',
            enabled: this.aiControlled,
            agent: this.currentAgent,
            queueLength: this.automationQueue.length
        }));
    }
    
    startAIControl() {
        console.log(`🤖 Starting AI control with agent: ${this.currentAgent}`);
        
        if (this.orchestrator && this.currentAgent) {
            // Start the character agent
            this.orchestrator.startCharacter(this.currentAgent);
            
            // Set up periodic AI actions
            this.aiControlInterval = setInterval(() => {
                this.performAIAction();
            }, 100); // 10 FPS AI actions
        }
        
        this.broadcast({
            type: 'ai-control-started',
            agent: this.currentAgent
        });
    }
    
    stopAIControl() {
        console.log('🤖 Stopping AI control');
        
        if (this.aiControlInterval) {
            clearInterval(this.aiControlInterval);
            this.aiControlInterval = null;
        }
        
        if (this.orchestrator && this.currentAgent) {
            this.orchestrator.stopCharacter(this.currentAgent);
        }
        
        this.broadcast({
            type: 'ai-control-stopped'
        });
    }
    
    performAIAction() {
        if (!this.aiControlled || !this.currentAgent) return;
        
        const mapping = this.characterMappings[this.currentAgent];
        if (!mapping) return;
        
        // Simple AI behavior based on character type
        const action = this.generateAIAction(mapping);
        
        if (action) {
            this.gameboy.pressButton(action.button);
            
            // Release button after a short delay
            setTimeout(() => {
                this.gameboy.releaseButton(action.button);
            }, 50);
            
            this.broadcast({
                type: 'ai-action',
                agent: this.currentAgent,
                action: action
            });
        }
    }
    
    generateAIAction(mapping) {
        const availableControls = mapping.controls;
        
        // Simple random action for now
        // In a real implementation, this would use the character's AI logic
        if (Math.random() < 0.1) { // 10% chance per frame
            const randomControl = availableControls[Math.floor(Math.random() * availableControls.length)];
            
            return {
                button: randomControl,
                behavior: mapping.behavior,
                timestamp: Date.now()
            };
        }
        
        return null;
    }
    
    // Utility functions
    generateClientId() {
        return crypto.randomBytes(8).toString('hex');
    }
    
    generateSpriteId(spriteData) {
        const hash = crypto.createHash('md5');
        hash.update(JSON.stringify(spriteData));
        return hash.digest('hex').substring(0, 16);
    }
    
    generateROMId(template, rom) {
        const hash = crypto.createHash('md5');
        hash.update(template.name + rom.length);
        return hash.digest('hex').substring(0, 16);
    }
    
    broadcast(message) {
        const data = JSON.stringify(message);
        this.clients.forEach(client => {
            if (client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(data);
            }
        });
    }
    
    broadcastGameBoyFrame(frameData) {
        this.broadcast({
            type: 'gameboy-frame',
            frame: Array.from(frameData),
            timestamp: Date.now()
        });
    }
    
    broadcastGameBoyInput(button, pressed) {
        this.broadcast({
            type: 'gameboy-input',
            button: button,
            pressed: pressed,
            timestamp: Date.now()
        });
    }
    
    sendGameBoyState(client) {
        client.ws.send(JSON.stringify({
            type: 'gameboy-state',
            state: {
                isRunning: this.gameboy.isRunning,
                currentSprites: this.currentSprites.length,
                aiControlled: this.aiControlled,
                currentAgent: this.currentAgent,
                availableROMs: Array.from(this.generatedROMs.keys()),
                spriteBank: Array.from(this.spriteBank.keys())
            }
        }));
    }
    
    // Event handlers
    handleCharacterAction(agentId, action, data) {
        if (this.aiControlled && this.currentAgent === agentId) {
            // Convert character action to Game Boy input
            this.translateCharacterActionToGameBoy(agentId, action, data);
        }
    }
    
    translateCharacterActionToGameBoy(agentId, action, data) {
        const mapping = this.characterMappings[agentId];
        if (!mapping) return;
        
        // Map character-specific actions to Game Boy buttons
        let button = null;
        
        switch (action) {
            case 'move':
                if (data.direction === 'up') button = 'UP';
                else if (data.direction === 'down') button = 'DOWN';
                else if (data.direction === 'left') button = 'LEFT';
                else if (data.direction === 'right') button = 'RIGHT';
                break;
                
            case 'action':
                button = 'A';
                break;
                
            case 'secondary':
                button = 'B';
                break;
                
            case 'menu':
                button = 'START';
                break;
                
            case 'select':
                button = 'SELECT';
                break;
        }
        
        if (button && mapping.controls.includes(button)) {
            this.gameboy.pressButton(button);
            setTimeout(() => this.gameboy.releaseButton(button), 100);
        }
    }
    
    async createDefaultROM() {
        // Create a simple default ROM that displays a test pattern
        const rom = new Uint8Array(32 * 1024);
        
        // Basic ROM header
        this.writeROMHeader(rom, {
            title: 'SOULFRA_DEFAULT',
            manufacturer: 'SOUL',
            cgb_flag: 0x80,
            cart_type: 0x00,
            rom_size: 0x01,
            ram_size: 0x02
        });
        
        // Nintendo logo
        this.writeNintendoLogo(rom);
        
        // Entry point
        rom[0x0100] = 0x00; // NOP
        rom[0x0101] = 0xC3; // JP
        rom[0x0102] = 0x50; // Low byte
        rom[0x0103] = 0x01; // High byte
        
        // Simple initialization at 0x0150
        const init = [
            0x31, 0xFE, 0xFF, // LD SP, $FFFE
            0xF3,             // DI
            0x3E, 0x91,       // LD A, $91
            0xE0, 0x40,       // LDH [$40], A
            0x18, 0xFE        // JR -2 (infinite loop)
        ];
        
        for (let i = 0; i < init.length; i++) {
            rom[0x0150 + i] = init[i];
        }
        
        return rom;
    }
}

// Export the bridge
module.exports = GameBoySpritebridge;

// CLI usage
if (require.main === module) {
    const bridge = new GameBoySpritebridge({
        port: process.env.GAMEBOY_BRIDGE_PORT || 8082,
        enableAI: process.env.ENABLE_AI !== 'false',
        enableCharacterAgents: process.env.ENABLE_CHARACTER_AGENTS !== 'false',
        autoLoadSprites: process.env.AUTO_LOAD_SPRITES !== 'false'
    });
    
    bridge.on('ready', () => {
        console.log('🎮🎨 Game Boy Sprite Bridge is ready!');
        console.log('📡 WebSocket server running');
        console.log('🎯 Game Boy emulator initialized');
        console.log('🤖 AI character agents ready');
        console.log('');
        console.log('Connect your sprite editor to: ws://localhost:8082/sprite');
        console.log('Connect Game Boy clients to: ws://localhost:8082/gameboy');
    });
    
    bridge.on('error', (error) => {
        console.error('🔥 Bridge error:', error);
        process.exit(1);
    });
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\\n🛑 Shutting down Game Boy Sprite Bridge...');
        bridge.stopAIControl();
        process.exit(0);
    });
}