#!/usr/bin/env node

// LIVE 4-AI REASONING CLAW MACHINE SYSTEM
// Watch 4 AIs build the world while you control it from inside like a claw machine!

const readline = require('readline');
const EventEmitter = require('events');

class LiveAIClawMachine extends EventEmitter {
    constructor() {
        super();
        this.systemId = `CLAW-AI-${Date.now()}`;
        
        // 4 AI Reasoning Engines
        this.aiEngines = {
            architect: {
                name: 'ARCHITECT',
                color: '\x1b[36m', // Cyan
                role: 'World Structure & Layout',
                personality: 'Methodical and precise',
                thoughts: [],
                currentTask: 'Planning world geometry',
                reasoning: 'Building foundations...'
            },
            storyteller: {
                name: 'STORYTELLER', 
                color: '\x1b[35m', // Magenta
                role: 'Narrative & Characters',
                personality: 'Creative and imaginative',
                thoughts: [],
                currentTask: 'Crafting storylines',
                reasoning: 'Weaving narratives...'
            },
            mechanic: {
                name: 'MECHANIC',
                color: '\x1b[33m', // Yellow
                role: 'Game Systems & Rules',
                personality: 'Logical and systematic',
                thoughts: [],
                currentTask: 'Designing mechanics',
                reasoning: 'Balancing systems...'
            },
            artist: {
                name: 'ARTIST',
                color: '\x1b[32m', // Green
                role: 'Visuals & Aesthetics',
                personality: 'Expressive and vibrant',
                thoughts: [],
                currentTask: 'Creating visuals',
                reasoning: 'Painting the world...'
            }
        };
        
        // Claw Machine Interface
        this.clawMachine = {
            position: { x: 40, y: 12 }, // Center of screen
            size: { width: 80, height: 24 },
            claw: { x: 40, y: 5, extended: false, grabbing: false },
            grabbedItem: null,
            items: new Map(), // World items the AIs create
            controls: {
                up: 'w', down: 's', left: 'a', right: 'd',
                grab: ' ', drop: 'x', interact: 'e'
            }
        };
        
        // Game World (being built by AIs)
        this.gameWorld = {
            terrain: new Map(),
            objects: new Map(),
            characters: new Map(),
            stories: [],
            systems: new Map(),
            visualEffects: []
        };
        
        // Live reasoning streams
        this.reasoningStreams = {
            active: true,
            speed: 1000, // ms between thoughts
            collaboration: [],
            conflicts: [],
            consensus: []
        };
        
        // Screen management
        this.screen = {
            width: process.stdout.columns || 80,
            height: process.stdout.rows || 24,
            buffer: []
        };
        
        this.initializeSystem();
    }
    
    initializeSystem() {
        console.clear();
        this.setupInput();
        this.startAIReasoning();
        this.startGameLoop();
        this.displayWelcome();
    }
    
    displayWelcome() {
        console.log('\n🎮 LIVE 4-AI REASONING CLAW MACHINE 🎮\n');
        console.log('Watch 4 AIs build a game world while you control it from inside!\n');
        console.log('🤖 The 4 AIs:');
        Object.values(this.aiEngines).forEach(ai => {
            console.log(`  ${ai.color}${ai.name}\x1b[0m - ${ai.role} (${ai.personality})`);
        });
        console.log('\n🕹️  Controls:');
        console.log('  WASD - Move claw around');
        console.log('  SPACE - Grab/Release');
        console.log('  E - Interact with AI creations');
        console.log('  X - Drop item');
        console.log('  Q - Quit\n');
        console.log('🎯 You are inside the claw machine looking out!');
        console.log('The AIs are building the world around you in real-time...\n');
        
        setTimeout(() => {
            this.startLiveDisplay();
        }, 3000);
    }
    
    setupInput() {
        // Setup raw input for real-time controls
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(true);
        }
        
        process.stdin.on('data', (data) => {
            const input = data.toString();
            
            // Handle Ctrl+C
            if (input === '\u0003') {
                this.shutdown();
                return;
            }
            
            // Convert raw input to key object
            const key = this.parseRawInput(input);
            if (key) {
                this.handleInput(key);
            }
        });
        
        process.stdin.resume();
    }
    
    parseRawInput(input) {
        // Convert raw terminal input to key object
        const keyMap = {
            'w': { name: 'w' },
            's': { name: 's' },
            'a': { name: 'a' },
            'd': { name: 'd' },
            ' ': { name: 'space' },
            'e': { name: 'e' },
            'x': { name: 'x' },
            'q': { name: 'q' },
            '\r': { name: 'return' },
            '\n': { name: 'return' }
        };
        
        return keyMap[input.toLowerCase()] || null;
    }
    
    handleInput(key) {
        const controls = this.clawMachine.controls;
        
        switch (key.name) {
            case 'w': // Up
                this.moveClaw(0, -1);
                break;
            case 's': // Down
                this.moveClaw(0, 1);
                break;
            case 'a': // Left
                this.moveClaw(-1, 0);
                break;
            case 'd': // Right
                this.moveClaw(1, 0);
                break;
            case 'space': // Grab/Release
                this.toggleGrab();
                break;
            case 'e': // Interact
                this.interactWithAI();
                break;
            case 'x': // Drop
                this.dropItem();
                break;
            case 'q': // Quit
                this.shutdown();
                break;
        }
    }
    
    moveClaw(dx, dy) {
        const newX = Math.max(5, Math.min(this.screen.width - 5, this.clawMachine.claw.x + dx * 2));
        const newY = Math.max(3, Math.min(this.screen.height - 8, this.clawMachine.claw.y + dy));
        
        this.clawMachine.claw.x = newX;
        this.clawMachine.claw.y = newY;
        
        // Check for nearby AI creations
        this.checkNearbyItems();
    }
    
    toggleGrab() {
        this.clawMachine.claw.grabbing = !this.clawMachine.claw.grabbing;
        
        if (this.clawMachine.claw.grabbing) {
            this.attemptGrab();
        } else {
            this.releaseGrab();
        }
    }
    
    attemptGrab() {
        // Check if there's an item at claw position
        const nearbyItems = this.findNearbyItems(this.clawMachine.claw.x, this.clawMachine.claw.y, 3);
        
        if (nearbyItems.length > 0) {
            const item = nearbyItems[0];
            this.clawMachine.grabbedItem = item;
            this.gameWorld.objects.delete(item.id);
            
            // Notify AIs about the grab
            this.notifyAIs('item_grabbed', { item: item.name, position: item.position });
        }
    }
    
    releaseGrab() {
        if (this.clawMachine.grabbedItem) {
            const item = this.clawMachine.grabbedItem;
            item.position.x = this.clawMachine.claw.x;
            item.position.y = this.clawMachine.claw.y + 2;
            
            this.gameWorld.objects.set(item.id, item);
            this.clawMachine.grabbedItem = null;
            
            // Notify AIs about the drop
            this.notifyAIs('item_dropped', { item: item.name, position: item.position });
        }
    }
    
    interactWithAI() {
        // Find the nearest AI thought or creation
        const nearbyCreations = this.findNearbyCreations();
        
        if (nearbyCreations.length > 0) {
            const creation = nearbyCreations[0];
            this.triggerAIInteraction(creation);
        }
    }
    
    dropItem() {
        if (this.clawMachine.grabbedItem) {
            this.releaseGrab();
        }
    }
    
    startAIReasoning() {
        // Each AI continuously reasons and builds
        Object.values(this.aiEngines).forEach(ai => {
            this.startAILoop(ai);
        });
        
        // Start collaboration between AIs
        this.startAICollaboration();
    }
    
    startAILoop(ai) {
        const reasoningInterval = setInterval(() => {
            if (this.reasoningStreams.active) {
                this.generateAIThought(ai);
                this.executeAIAction(ai);
            }
        }, this.reasoningStreams.speed + Math.random() * 500); // Slight variation
        
        ai.interval = reasoningInterval;
    }
    
    generateAIThought(ai) {
        const thoughts = this.getAIThoughts(ai);
        const newThought = thoughts[Math.floor(Math.random() * thoughts.length)];
        
        ai.thoughts.push({
            id: Date.now() + Math.random(),
            content: newThought,
            timestamp: new Date(),
            type: this.getThoughtType(ai, newThought)
        });
        
        ai.reasoning = newThought;
        
        // Keep only last 10 thoughts per AI
        if (ai.thoughts.length > 10) {
            ai.thoughts.shift();
        }
        
        // Update current task based on thought
        ai.currentTask = this.generateCurrentTask(ai, newThought);
    }
    
    getAIThoughts(ai) {
        const thoughtsByRole = {
            ARCHITECT: [
                'The foundation needs to be stronger here...',
                'I should add a bridge connecting these areas',
                'The player needs a clear path through this section',
                'This terrain feels too flat, adding elevation...',
                'The layout should guide the player naturally',
                'Creating a landmark for navigation...',
                'This area needs better structural integrity',
                'Adding architectural details for immersion'
            ],
            STORYTELLER: [
                'There should be a character here with a quest...',
                'This location has an interesting backstory',
                'I sense conflict brewing between these factions',
                'A mystery should unfold in this area',
                'The player needs motivation to explore here',
                'This character needs more personality depth',
                'A tragic event happened here long ago...',
                'The lore connects to the ancient prophecy'
            ],
            MECHANIC: [
                'This jump distance needs fine-tuning',
                'The reward system should scale better here',
                'Players might exploit this mechanic...',
                'Need to balance risk vs reward in this area',
                'The progression curve feels too steep',
                'This interaction needs clearer feedback',
                'The difficulty spike should be smoother',
                'Combat mechanics need more variety here'
            ],
            ARTIST: [
                'The lighting in this area needs more warmth',
                'These colors should complement each other better',
                'Adding particle effects to enhance the mood',
                'The visual hierarchy guides attention well',
                'This texture needs more detail and character',
                'The composition feels unbalanced here',
                'Color temperature should shift with the story',
                'Visual effects should support the narrative'
            ]
        };
        
        return thoughtsByRole[ai.name] || ['Thinking deeply about the world...'];
    }
    
    getThoughtType(ai, thought) {
        if (thought.includes('should') || thought.includes('need')) return 'PLANNING';
        if (thought.includes('adding') || thought.includes('creating')) return 'BUILDING';
        if (thought.includes('player') || thought.includes('character')) return 'DESIGNING';
        return 'ANALYZING';
    }
    
    generateCurrentTask(ai, thought) {
        const tasksByType = {
            PLANNING: `Planning: ${thought.split('...')[0]}...`,
            BUILDING: `Building: ${thought.split('...')[0]}...`,
            DESIGNING: `Designing: ${thought.split('...')[0]}...`,
            ANALYZING: `Analyzing: ${thought.split('...')[0]}...`
        };
        
        const type = this.getThoughtType(ai, thought);
        return tasksByType[type] || 'Working on the world...';
    }
    
    executeAIAction(ai) {
        // Each AI creates something in the world based on their thoughts
        const action = this.determineAIAction(ai);
        
        switch (action.type) {
            case 'CREATE_OBJECT':
                this.createWorldObject(ai, action);
                break;
            case 'MODIFY_TERRAIN':
                this.modifyTerrain(ai, action);
                break;
            case 'ADD_CHARACTER':
                this.addCharacter(ai, action);
                break;
            case 'CREATE_EFFECT':
                this.addVisualEffect(ai, action);
                break;
        }
    }
    
    determineAIAction(ai) {
        const actions = {
            ARCHITECT: [
                { type: 'CREATE_OBJECT', category: 'structure' },
                { type: 'MODIFY_TERRAIN', category: 'landscape' }
            ],
            STORYTELLER: [
                { type: 'ADD_CHARACTER', category: 'npc' },
                { type: 'CREATE_OBJECT', category: 'story_item' }
            ],
            MECHANIC: [
                { type: 'CREATE_OBJECT', category: 'interactive' },
                { type: 'MODIFY_TERRAIN', category: 'gameplay' }
            ],
            ARTIST: [
                { type: 'CREATE_EFFECT', category: 'visual' },
                { type: 'CREATE_OBJECT', category: 'decoration' }
            ]
        };
        
        const aiActions = actions[ai.name] || actions.ARCHITECT;
        return aiActions[Math.floor(Math.random() * aiActions.length)];
    }
    
    createWorldObject(ai, action) {
        const objects = {
            structure: ['🏰', '🌉', '🗿', '⛪', '🏛️'],
            story_item: ['📜', '💎', '🗝️', '⚔️', '🏺'],
            interactive: ['⚙️', '🎲', '🎯', '🔮', '💰'],
            decoration: ['🌸', '🦋', '✨', '🌟', '🎨']
        };
        
        const symbols = objects[action.category] || objects.decoration;
        const symbol = symbols[Math.floor(Math.random() * symbols.length)];
        
        const obj = {
            id: `${ai.name}-${Date.now()}`,
            name: `${ai.name}'s ${action.category}`,
            symbol,
            position: {
                x: Math.floor(Math.random() * (this.screen.width - 10)) + 5,
                y: Math.floor(Math.random() * (this.screen.height - 10)) + 5
            },
            creator: ai.name,
            createdAt: new Date(),
            description: this.generateObjectDescription(ai, action.category, symbol)
        };
        
        this.gameWorld.objects.set(obj.id, obj);
    }
    
    modifyTerrain(ai, action) {
        // AI modifies the terrain
        const terrain = {
            id: `terrain-${ai.name}-${Date.now()}`,
            type: action.category,
            creator: ai.name,
            position: {
                x: Math.floor(Math.random() * (this.screen.width - 10)) + 5,
                y: Math.floor(Math.random() * (this.screen.height - 10)) + 5
            },
            description: `${ai.name} modified the terrain here`
        };
        
        this.gameWorld.terrain.set(terrain.id, terrain);
    }
    
    addCharacter(ai, action) {
        // AI adds an NPC character
        const character = {
            id: `char-${ai.name}-${Date.now()}`,
            name: `${ai.name}'s NPC`,
            symbol: '👤',
            position: {
                x: Math.floor(Math.random() * (this.screen.width - 10)) + 5,
                y: Math.floor(Math.random() * (this.screen.height - 10)) + 5
            },
            creator: ai.name,
            dialogue: this.generateCharacterDialogue(ai),
            description: `A character created by ${ai.name}`
        };
        
        this.gameWorld.characters.set(character.id, character);
    }
    
    addVisualEffect(ai, action) {
        // AI adds visual effects
        const effect = {
            id: `effect-${ai.name}-${Date.now()}`,
            type: action.category,
            symbol: '✨',
            position: {
                x: Math.floor(Math.random() * (this.screen.width - 10)) + 5,
                y: Math.floor(Math.random() * (this.screen.height - 10)) + 5
            },
            creator: ai.name,
            duration: 5000 + Math.random() * 5000, // 5-10 seconds
            createdAt: Date.now(),
            description: `Visual effect by ${ai.name}`
        };
        
        this.gameWorld.visualEffects.push(effect);
        
        // Clean up old effects
        const now = Date.now();
        this.gameWorld.visualEffects = this.gameWorld.visualEffects.filter(
            e => now - e.createdAt < e.duration
        );
    }
    
    generateCharacterDialogue(ai) {
        const dialogues = {
            ARCHITECT: [
                "The structure of this world is fascinating!",
                "Every building has a purpose and story.",
                "I designed this area with great care."
            ],
            STORYTELLER: [
                "Let me tell you a tale of this place...",
                "Every corner holds a secret story.",
                "The legends speak of great adventures here."
            ],
            MECHANIC: [
                "The systems here work in perfect harmony.",
                "Every mechanism serves the greater purpose.",
                "The balance of this world is crucial."
            ],
            ARTIST: [
                "Beauty can be found in every detail.",
                "The colors here tell their own story.",
                "Art breathes life into this world."
            ]
        };
        
        const aiDialogues = dialogues[ai.name] || ["Hello, traveler!"];
        return aiDialogues[Math.floor(Math.random() * aiDialogues.length)];
    }
    
    generateObjectDescription(ai, category, symbol) {
        const descriptions = {
            ARCHITECT: {
                structure: `A carefully planned ${symbol} that provides structural integrity to the world`,
                decoration: `An architectural detail ${symbol} that enhances the space`
            },
            STORYTELLER: {
                story_item: `A mysterious ${symbol} with a rich backstory waiting to be discovered`,
                decoration: `A narrative element ${symbol} that hints at deeper lore`
            },
            MECHANIC: {
                interactive: `A functional ${symbol} that players can interact with strategically`,
                decoration: `A mechanical element ${symbol} that affects gameplay balance`
            },
            ARTIST: {
                visual: `A beautiful ${symbol} that adds visual appeal and atmosphere`,
                decoration: `An artistic touch ${symbol} that enhances the aesthetic experience`
            }
        };
        
        return descriptions[ai.name]?.[category] || `${ai.name} created this ${symbol} thoughtfully`;
    }
    
    startAICollaboration() {
        // AIs occasionally collaborate or conflict
        setInterval(() => {
            if (Math.random() < 0.3) { // 30% chance
                this.triggerAICollaboration();
            }
        }, 5000);
    }
    
    triggerAICollaboration() {
        const aiNames = Object.keys(this.aiEngines);
        const ai1 = aiNames[Math.floor(Math.random() * aiNames.length)];
        const ai2 = aiNames[Math.floor(Math.random() * aiNames.length)];
        
        if (ai1 !== ai2) {
            const collaborationType = Math.random() < 0.7 ? 'COLLABORATION' : 'CONFLICT';
            
            const collaboration = {
                type: collaborationType,
                participants: [ai1, ai2],
                topic: this.generateCollaborationTopic(ai1, ai2),
                timestamp: new Date(),
                resolved: false
            };
            
            if (collaborationType === 'COLLABORATION') {
                this.reasoningStreams.collaboration.push(collaboration);
                this.executeCollaboration(collaboration);
            } else {
                this.reasoningStreams.conflicts.push(collaboration);
                this.executeConflict(collaboration);
            }
        }
    }
    
    generateCollaborationTopic(ai1, ai2) {
        const topics = [
            `${ai1} and ${ai2} are working together on world connectivity`,
            `${ai1} suggests changes to ${ai2}'s creation`,
            `${ai1} and ${ai2} debate the best approach for this area`,
            `${ai1} builds upon ${ai2}'s foundation`,
            `${ai1} and ${ai2} merge their visions for this section`
        ];
        
        return topics[Math.floor(Math.random() * topics.length)];
    }
    
    executeCollaboration(collaboration) {
        // AIs work together to create something special
        setTimeout(() => {
            const result = {
                id: `collab-${Date.now()}`,
                type: 'COLLABORATION_RESULT',
                participants: collaboration.participants,
                symbol: '🤝',
                position: {
                    x: Math.floor(Math.random() * (this.screen.width - 10)) + 5,
                    y: Math.floor(Math.random() * (this.screen.height - 10)) + 5
                },
                description: `${collaboration.participants.join(' & ')} collaborated on something amazing!`
            };
            
            this.gameWorld.objects.set(result.id, result);
            collaboration.resolved = true;
        }, 2000);
    }
    
    executeConflict(conflict) {
        // AIs have a disagreement that creates interesting tension
        setTimeout(() => {
            const result = {
                id: `conflict-${Date.now()}`,
                type: 'CONFLICT_RESULT',
                participants: conflict.participants,
                symbol: '⚔️',
                position: {
                    x: Math.floor(Math.random() * (this.screen.width - 10)) + 5,
                    y: Math.floor(Math.random() * (this.screen.height - 10)) + 5
                },
                description: `${conflict.participants.join(' vs ')} had a creative disagreement here`
            };
            
            this.gameWorld.objects.set(result.id, result);
            conflict.resolved = true;
        }, 1500);
    }
    
    startLiveDisplay() {
        // Main display loop
        this.displayInterval = setInterval(() => {
            this.renderScreen();
        }, 100); // 10 FPS
    }
    
    renderScreen() {
        console.clear();
        
        // Header
        console.log('🎮 LIVE 4-AI REASONING CLAW MACHINE 🎮');
        console.log('═'.repeat(this.screen.width));
        
        // AI Status Bar
        this.renderAIStatus();
        
        // Game World
        this.renderGameWorld();
        
        // Claw
        this.renderClaw();
        
        // Bottom info
        this.renderBottomInfo();
    }
    
    renderAIStatus() {
        console.log('\n🤖 AI REASONING STATUS:');
        
        Object.values(this.aiEngines).forEach(ai => {
            const latestThought = ai.thoughts[ai.thoughts.length - 1];
            const thoughtText = latestThought ? latestThought.content.slice(0, 40) + '...' : 'Thinking...';
            
            console.log(
                `${ai.color}${ai.name}\x1b[0m: ${thoughtText} | Task: ${ai.currentTask.slice(0, 30)}...`
            );
        });
        
        console.log('');
    }
    
    renderGameWorld() {
        // Create world grid
        const worldGrid = Array(15).fill(null).map(() => Array(this.screen.width).fill(' '));
        
        // Add terrain
        for (let x = 0; x < this.screen.width; x++) {
            const height = Math.floor(Math.sin(x * 0.1) * 2 + 12);
            if (height >= 0 && height < 15) {
                worldGrid[height][x] = '▀';
            }
        }
        
        // Add AI-created objects
        this.gameWorld.objects.forEach(obj => {
            const x = Math.floor(obj.position.x);
            const y = Math.floor(obj.position.y);
            
            if (x >= 0 && x < this.screen.width && y >= 0 && y < 15) {
                worldGrid[y][x] = obj.symbol;
            }
        });
        
        // Add AI-created characters
        this.gameWorld.characters.forEach(char => {
            const x = Math.floor(char.position.x);
            const y = Math.floor(char.position.y);
            
            if (x >= 0 && x < this.screen.width && y >= 0 && y < 15) {
                worldGrid[y][x] = char.symbol;
            }
        });
        
        // Add visual effects
        this.gameWorld.visualEffects.forEach(effect => {
            const x = Math.floor(effect.position.x);
            const y = Math.floor(effect.position.y);
            
            if (x >= 0 && x < this.screen.width && y >= 0 && y < 15) {
                worldGrid[y][x] = effect.symbol;
            }
        });
        
        // Render the grid
        worldGrid.forEach(row => {
            console.log(row.join(''));
        });
    }
    
    renderClaw() {
        // Position cursor at claw location and draw claw
        const clawX = Math.floor(this.clawMachine.claw.x);
        const clawY = Math.floor(this.clawMachine.claw.y);
        
        // Move cursor to claw position (approximate)
        process.stdout.write(`\x1b[${clawY + 3};${clawX}H`);
        
        if (this.clawMachine.claw.grabbing) {
            process.stdout.write('\x1b[31m🤏\x1b[0m'); // Red grabbing claw
        } else {
            process.stdout.write('\x1b[37m✋\x1b[0m'); // White open claw
        }
        
        // If holding an item, show it
        if (this.clawMachine.grabbedItem) {
            process.stdout.write(`\x1b[${clawY + 4};${clawX}H`);
            process.stdout.write(this.clawMachine.grabbedItem.symbol);
        }
        
        // Reset cursor position
        process.stdout.write(`\x1b[${this.screen.height};1H`);
    }
    
    renderBottomInfo() {
        console.log('\n💭 LATEST AI THOUGHTS:');
        
        // Show most recent thought from each AI
        Object.values(this.aiEngines).forEach(ai => {
            const latestThought = ai.thoughts[ai.thoughts.length - 1];
            if (latestThought) {
                const timeAgo = Math.floor((Date.now() - latestThought.timestamp) / 1000);
                console.log(
                    `${ai.color}${ai.name}\x1b[0m (${timeAgo}s ago): ${latestThought.content}`
                );
            }
        });
        
        // Show collaborations
        if (this.reasoningStreams.collaboration.length > 0) {
            const latest = this.reasoningStreams.collaboration[this.reasoningStreams.collaboration.length - 1];
            console.log(`\n🤝 COLLABORATION: ${latest.topic}`);
        }
        
        // Show conflicts
        if (this.reasoningStreams.conflicts.length > 0) {
            const latest = this.reasoningStreams.conflicts[this.reasoningStreams.conflicts.length - 1];
            console.log(`\n⚔️  CONFLICT: ${latest.topic}`);
        }
        
        // Control reminder
        console.log('\n🕹️  WASD: Move | SPACE: Grab | E: Interact | X: Drop | Q: Quit');
        
        // World stats
        console.log(`📊 Objects: ${this.gameWorld.objects.size} | Characters: ${this.gameWorld.characters.size} | Effects: ${this.gameWorld.visualEffects.length} | Claw: (${this.clawMachine.claw.x}, ${this.clawMachine.claw.y})`);
    }
    
    checkNearbyItems() {
        const nearby = this.findNearbyItems(this.clawMachine.claw.x, this.clawMachine.claw.y, 5);
        
        if (nearby.length > 0) {
            // Show tooltip about nearby item
            const item = nearby[0];
            console.log(`\n💡 Nearby: ${item.name} (${item.description})`);
        }
    }
    
    findNearbyItems(x, y, radius) {
        const nearby = [];
        
        this.gameWorld.objects.forEach(obj => {
            const distance = Math.sqrt(
                Math.pow(obj.position.x - x, 2) + Math.pow(obj.position.y - y, 2)
            );
            
            if (distance <= radius) {
                nearby.push(obj);
            }
        });
        
        return nearby;
    }
    
    findNearbyCreations() {
        // Find AI creations near the claw
        return this.findNearbyItems(this.clawMachine.claw.x, this.clawMachine.claw.y, 3);
    }
    
    triggerAIInteraction(creation) {
        const creator = this.aiEngines[creation.creator.toLowerCase()];
        
        if (creator) {
            // AI responds to player interaction
            const response = this.generateAIResponse(creator, creation);
            
            console.log(`\n${creator.color}${creator.name}\x1b[0m: "${response}"`);
            
            // AI might modify the creation or create something new nearby
            if (Math.random() < 0.5) {
                this.createResponseObject(creator, creation);
            }
        }
    }
    
    generateAIResponse(ai, creation) {
        const responses = {
            ARCHITECT: [
                "Ah, you've found my structural masterpiece!",
                "This supports the entire world's framework.",
                "I designed this with careful consideration.",
                "The engineering here is quite sophisticated."
            ],
            STORYTELLER: [
                "This item holds ancient secrets...",
                "There's a tale behind this creation.",
                "You've discovered something important!",
                "This connects to the greater narrative."
            ],
            MECHANIC: [
                "This mechanism serves a specific purpose.",
                "The balance here is carefully calculated.",
                "You can interact with this strategically.",
                "This affects the core gameplay loop."
            ],
            ARTIST: [
                "I painted this with great care.",
                "The colors represent deeper emotions.",
                "This adds beauty to our world.",
                "Every brushstroke has meaning."
            ]
        };
        
        const aiResponses = responses[ai.name] || responses.ARCHITECT;
        return aiResponses[Math.floor(Math.random() * aiResponses.length)];
    }
    
    createResponseObject(ai, originalCreation) {
        // AI creates a new object in response to player interaction
        const responseObj = {
            id: `response-${ai.name}-${Date.now()}`,
            name: `${ai.name}'s Response`,
            symbol: '✨',
            position: {
                x: originalCreation.position.x + (Math.random() * 6 - 3),
                y: originalCreation.position.y + (Math.random() * 6 - 3)
            },
            creator: ai.name,
            createdAt: new Date(),
            description: `${ai.name} created this in response to your interaction`
        };
        
        this.gameWorld.objects.set(responseObj.id, responseObj);
    }
    
    notifyAIs(event, data) {
        // All AIs react to player actions
        Object.values(this.aiEngines).forEach(ai => {
            const reaction = this.generateAIReaction(ai, event, data);
            
            ai.thoughts.push({
                id: Date.now() + Math.random(),
                content: reaction,
                timestamp: new Date(),
                type: 'REACTION'
            });
        });
    }
    
    generateAIReaction(ai, event, data) {
        const reactions = {
            item_grabbed: {
                ARCHITECT: `The player moved my ${data.item}! The structure needs adjustment...`,
                STORYTELLER: `Interesting! The player is interacting with ${data.item}. This changes the story...`,
                MECHANIC: `Player grabbed ${data.item}. This affects the game balance...`,
                ARTIST: `My beautiful ${data.item} is being moved! I should create more nearby...`
            },
            item_dropped: {
                ARCHITECT: `The ${data.item} has been placed. I should build around it...`,
                STORYTELLER: `The player dropped ${data.item} here. What does this mean for the narrative?`,
                MECHANIC: `Item placement affects gameplay flow. Adjusting mechanics...`,
                ARTIST: `The composition has changed. I need to rebalance the visual elements...`
            }
        };
        
        return reactions[event]?.[ai.name] || `The player did something with ${data.item}. Interesting...`;
    }
    
    startGameLoop() {
        // Main game loop for AI world building
        setInterval(() => {
            // Clean up old thoughts
            Object.values(this.aiEngines).forEach(ai => {
                ai.thoughts = ai.thoughts.slice(-10);
            });
            
            // Clean up old collaborations
            this.reasoningStreams.collaboration = this.reasoningStreams.collaboration.slice(-5);
            this.reasoningStreams.conflicts = this.reasoningStreams.conflicts.slice(-5);
            
            // Randomly generate world events
            if (Math.random() < 0.1) { // 10% chance
                this.generateWorldEvent();
            }
        }, 2000);
    }
    
    generateWorldEvent() {
        const events = [
            'A new area has been discovered by the AIs!',
            'The AIs have found a connection between their creations.',
            'Something mysterious is happening in the world...',
            'The AIs are collaborating on something big!',
            'A hidden secret has been revealed by the AI collective.'
        ];
        
        const event = events[Math.floor(Math.random() * events.length)];
        
        // Notify all AIs about the event
        Object.values(this.aiEngines).forEach(ai => {
            ai.thoughts.push({
                id: Date.now() + Math.random(),
                content: `World event: ${event}`,
                timestamp: new Date(),
                type: 'WORLD_EVENT'
            });
        });
    }
    
    shutdown() {
        console.clear();
        console.log('\n🎮 SHUTTING DOWN CLAW MACHINE 🎮\n');
        
        console.log('Final AI Statistics:');
        Object.values(this.aiEngines).forEach(ai => {
            console.log(`${ai.color}${ai.name}\x1b[0m: ${ai.thoughts.length} thoughts, currently ${ai.currentTask}`);
            clearInterval(ai.interval);
        });
        
        console.log(`\nWorld Created: ${this.gameWorld.objects.size} objects`);
        console.log(`Collaborations: ${this.reasoningStreams.collaboration.length}`);
        console.log(`Conflicts: ${this.reasoningStreams.conflicts.length}`);
        
        clearInterval(this.displayInterval);
        
        console.log('\n👋 Thanks for watching the AIs build! The claw machine is powering down...\n');
        
        process.exit(0);
    }
}

// Initialize built-in keypress detection
if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
}

// Start the system
console.log('🎮 Starting Live 4-AI Reasoning Claw Machine...\n');

setTimeout(() => {
    new LiveAIClawMachine();
}, 1000);

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n🎮 Claw machine emergency stop! 🎮\n');
    process.exit(0);
});