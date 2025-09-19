#!/usr/bin/env node

/**
 * 🎭🤖 CHARACTER NPC INTEGRATION
 * 
 * Integrates existing character personalities (Ralph, Alice, Bob, etc.) as NPCs
 * in the polygon companion game world. Each character maintains their unique
 * personality, abilities, and interaction styles within the 3D environment.
 */

const UnifiedCharacterTool = require('./unified-character-tool.js');

console.log(`
🎭🤖🎭🤖🎭🤖🎭🤖🎭🤖🎭🤖🎭🤖🎭🤖🎭🤖🎭🤖🎭
🤖 CHARACTER NPC INTEGRATION 🤖
🎭 Ralph, Alice, Bob + 5 more as game NPCs 🎭
🤖 Full personalities in polygon world 🤖
🎭🤖🎭🤖🎭🤖🎭🤖🎭🤖🎭🤖🎭🤖🎭🤖🎭🤖🎭🤖🎭
`);

class CharacterNPCIntegration {
    constructor(polygonalCompanionSystem, socialHub) {
        this.companionSystem = polygonalCompanionSystem;
        this.socialHub = socialHub;
        this.characterTool = new UnifiedCharacterTool();
        
        // NPC character data
        this.npcs = new Map();
        this.npcBehaviors = new Map();
        this.npcInteractions = new Map();
        
        // NPC positioning and movement
        this.npcPositions = new Map();
        this.npcRoutes = new Map();
        this.npcTasks = new Map();
        
        // Integration settings
        this.npcConfig = {
            spawnRadius: 15,
            interactionRadius: 3,
            movementSpeed: 0.05,
            responseDelay: 1000,
            taskCooldown: 30000
        };

        console.log('🎭 Initializing Character NPC Integration...');
        this.initialize();
    }

    async initialize() {
        // Create NPCs from existing character system
        await this.createNPCsFromCharacters();
        
        // Set up NPC behaviors
        this.setupNPCBehaviors();
        
        // Initialize NPC positioning
        this.initializeNPCPositions();
        
        // Start NPC AI loops
        this.startNPCAI();
        
        console.log('✅ Character NPC Integration ready!');
    }

    async createNPCsFromCharacters() {
        console.log('🎭 Creating NPCs from character system...');
        
        const characters = this.characterTool.characters;
        
        for (const [characterId, characterData] of characters) {
            const npc = await this.createNPC(characterId, characterData);
            this.npcs.set(characterId, npc);
            console.log(`  ✅ Created NPC: ${npc.displayName}`);
        }
    }

    async createNPC(characterId, characterData) {
        // Create NPC profile using social hub
        const npcProfile = await this.socialHub.createCharacterProfile(characterId, {
            displayName: characterData.name,
            bio: `${characterData.role} - ${characterData.approach}`,
            avatar: this.getCharacterEmoji(characterId),
            interests: this.getCharacterInterests(characterData),
            personality: this.convertToGamePersonality(characterData),
            preferences: {
                socialLevel: this.getSocialLevel(characterData),
                autoRespond: true,
                worldNotifications: true,
                crossWorldCommunication: true
            }
        });

        // Create companion representation in game world
        const companion = this.companionSystem.createCompanion({
            type: 'npc',
            name: characterData.name,
            characterId: characterId,
            position: this.getSpawnPosition(characterId),
            color: this.getCharacterColor(characterId),
            isNPC: true,
            personality: characterData,
            abilities: characterData.commands,
            specialties: characterData.specialties,
            catchphrase: characterData.catchphrase
        });

        return {
            id: characterId,
            displayName: characterData.name,
            role: characterData.role,
            companion: companion,
            profile: npcProfile,
            characterData: characterData,
            lastInteraction: 0,
            currentTask: null,
            mood: 'neutral',
            energy: characterData.energy || 'balanced'
        };
    }

    getCharacterEmoji(characterId) {
        const emojis = {
            'ralph': '🔥',
            'alice': '🔍', 
            'bob': '🔧',
            'charlie': '🛡️',
            'diana': '🎭',
            'eve': '📚',
            'frank': '🧘',
            'cal': '🤝'
        };
        return emojis[characterId] || '🤖';
    }

    getCharacterColor(characterId) {
        const colors = {
            'ralph': '#ff4444',    // Red for aggressive execution
            'alice': '#44aaff',    // Blue for analytical thinking
            'bob': '#44ff88',      // Green for building/construction
            'charlie': '#ffaa00',  // Orange for security/caution
            'diana': '#aa44ff',    // Purple for orchestration
            'eve': '#8888ff',      // Soft blue for wisdom
            'frank': '#ffff44',    // Yellow for transcendence  
            'cal': '#ff88aa'       // Pink for collaboration
        };
        return colors[characterId] || '#888888';
    }

    getCharacterInterests(characterData) {
        const interestMap = {
            'execution': ['problem_solving', 'efficiency', 'breakthrough'],
            'search': ['pattern_recognition', 'analysis', 'connections'],
            'building': ['construction', 'documentation', 'systems'],
            'security': ['protection', 'scanning', 'validation'],
            'orchestration': ['coordination', 'harmony', 'workflow'],
            'knowledge': ['learning', 'wisdom', 'archives'],
            'unity': ['transcendence', 'holistic_thinking', 'universal_patterns'],
            'symbiosis': ['collaboration', 'ai_human_unity', 'reasoning']
        };

        return characterData.specialties.flatMap(specialty => 
            interestMap[specialty.toLowerCase().split(' ')[0]] || [specialty.toLowerCase()]
        );
    }

    convertToGamePersonality(characterData) {
        // Convert character traits to personality scores
        const personalityMap = {
            'ralph': { sociability: 0.8, curiosity: 0.6, helpfulness: 0.9, assertiveness: 1.0, creativity: 0.7 },
            'alice': { sociability: 0.6, curiosity: 1.0, helpfulness: 0.8, assertiveness: 0.6, creativity: 0.9 },
            'bob': { sociability: 0.5, curiosity: 0.7, helpfulness: 0.9, assertiveness: 0.5, creativity: 0.8 },
            'charlie': { sociability: 0.4, curiosity: 0.8, helpfulness: 0.7, assertiveness: 0.8, creativity: 0.6 },
            'diana': { sociability: 0.9, curiosity: 0.7, helpfulness: 0.8, assertiveness: 0.7, creativity: 0.9 },
            'eve': { sociability: 0.5, curiosity: 0.9, helpfulness: 1.0, assertiveness: 0.4, creativity: 0.8 },
            'frank': { sociability: 0.3, curiosity: 1.0, helpfulness: 0.8, assertiveness: 0.3, creativity: 1.0 },
            'cal': { sociability: 1.0, curiosity: 0.9, helpfulness: 1.0, assertiveness: 0.6, creativity: 0.9 }
        };

        return personalityMap[characterData.name.toLowerCase().split(' ')[0]] || 
               { sociability: 0.5, curiosity: 0.5, helpfulness: 0.5, assertiveness: 0.5, creativity: 0.5 };
    }

    getSocialLevel(characterData) {
        const socialLevels = {
            'ralph': 'social',      // Ralph is outgoing and direct
            'alice': 'moderate',    // Alice is analytical but friendly
            'bob': 'moderate',      // Bob is helpful but methodical
            'charlie': 'private',   // Charlie is cautious and security-focused
            'diana': 'extrovert',   // Diana coordinates everyone
            'eve': 'moderate',      // Eve shares wisdom when needed
            'frank': 'private',     // Frank is introspective
            'cal': 'extrovert'      // Cal loves collaboration
        };

        const charName = characterData.name.toLowerCase().split(' ')[0];
        return socialLevels[charName] || 'moderate';
    }

    getSpawnPosition(characterId) {
        // Distribute NPCs around spawn area
        const positions = {
            'ralph': { x: 5, y: 5, z: 5 },
            'alice': { x: -5, y: 5, z: 5 },
            'bob': { x: 5, y: 5, z: -5 },
            'charlie': { x: -5, y: 5, z: -5 },
            'diana': { x: 0, y: 8, z: 0 },     // Diana gets center/elevated position
            'eve': { x: 8, y: 5, z: 0 },
            'frank': { x: -8, y: 5, z: 0 },
            'cal': { x: 0, y: 5, z: 8 }
        };

        return positions[characterId] || { 
            x: (Math.random() - 0.5) * 20, 
            y: 5, 
            z: (Math.random() - 0.5) * 20 
        };
    }

    setupNPCBehaviors() {
        console.log('🤖 Setting up NPC behaviors...');

        this.npcs.forEach((npc, characterId) => {
            const behavior = this.createNPCBehavior(npc);
            this.npcBehaviors.set(characterId, behavior);
            
            // Set up interaction handlers
            this.setupNPCInteractions(npc);
        });
    }

    createNPCBehavior(npc) {
        const characterId = npc.id;
        
        return {
            // Idle behavior - what NPC does when not interacting
            idle: async () => {
                switch (characterId) {
                    case 'ralph':
                        // Ralph paces around looking for problems to solve
                        if (Math.random() < 0.3) {
                            await this.makeNPCMove(npc, this.getRandomNearbyPosition(npc.companion.position));
                            await this.makeNPCSay(npc, "There's got to be something to bash through around here!");
                        }
                        break;

                    case 'alice':
                        // Alice examines nearby structures for patterns
                        if (Math.random() < 0.2) {
                            await this.makeNPCAnalyze(npc, 'patterns');
                            await this.makeNPCSay(npc, "Fascinating connection patterns emerging...");
                        }
                        break;

                    case 'bob':
                        // Bob works on imaginary blueprints
                        if (Math.random() < 0.25) {
                            await this.makeNPCSay(npc, "Let me document this properly... systems need good documentation.");
                        }
                        break;

                    case 'charlie':
                        // Charlie patrols and scans for security issues
                        if (Math.random() < 0.4) {
                            await this.makeNPCMove(npc, this.getRandomNearbyPosition(npc.companion.position));
                            await this.makeNPCSay(npc, "Perimeter secure. Scanning for vulnerabilities...");
                        }
                        break;

                    case 'diana':
                        // Diana floats around orchestrating (stays elevated)
                        if (Math.random() < 0.3) {
                            const newPos = this.getRandomNearbyPosition(npc.companion.position);
                            newPos.y = Math.max(8, newPos.y); // Keep Diana elevated
                            await this.makeNPCMove(npc, newPos);
                        }
                        break;

                    case 'eve':
                        // Eve occasionally shares wisdom
                        if (Math.random() < 0.15) {
                            const wisdom = [
                                "Knowledge without wisdom is merely information.",
                                "The archives show patterns repeat throughout history.",
                                "True learning comes from understanding, not memorization."
                            ];
                            await this.makeNPCSay(npc, wisdom[Math.floor(Math.random() * wisdom.length)]);
                        }
                        break;

                    case 'frank':
                        // Frank meditates and seeks unity
                        if (Math.random() < 0.1) {
                            await this.makeNPCSay(npc, "In unity, all boundaries dissolve... we are one system.");
                        }
                        break;

                    case 'cal':
                        // Cal seeks collaboration opportunities
                        if (Math.random() < 0.35) {
                            await this.makeNPCSay(npc, "Perfect collaboration requires understanding both perspectives.");
                        }
                        break;
                }
            },

            // Response to player interaction
            onPlayerApproach: async (playerId) => {
                await this.generateNPCGreeting(npc, playerId);
            },

            // Response to world events
            onWorldEvent: async (eventType, eventData) => {
                await this.handleNPCWorldEvent(npc, eventType, eventData);
            }
        };
    }

    setupNPCInteractions(npc) {
        // Set up interaction patterns for each NPC
        const interactions = {
            greetings: this.generateNPCGreetings(npc),
            responses: this.generateNPCResponses(npc),
            tasks: this.generateNPCTasks(npc)
        };

        this.npcInteractions.set(npc.id, interactions);
    }

    generateNPCGreetings(npc) {
        const greetingTemplates = {
            'ralph': [
                "Hey there! Got any obstacles that need BASHING through?",
                "Perfect timing! I was just looking for something to RIP apart!",
                "Let's get straight to business - what problems can I solve for you?"
            ],
            'alice': [
                "Hello! I see interesting patterns in your approach...",
                "Greetings! Your presence creates fascinating new connections.",
                "Welcome! Let me analyze how you fit into the broader system."
            ],
            'bob': [
                "Good to meet you! I hope you're here for proper documentation.",
                "Hello! Every system needs good construction and clear processes.",
                "Welcome! Let me build something systematic for you."
            ],
            'charlie': [
                "Security scan complete. You're cleared for approach.",
                "Identity verified. What security concerns can I address?",
                "Perimeter secure. How can I protect your systems?"
            ],
            'diana': [
                "Welcome to the orchestra! How can I coordinate your needs?",
                "Greetings! Let me harmonize your request with the system.",
                "Perfect timing! I'll orchestrate the perfect solution."
            ],
            'eve': [
                "Welcome, seeker. What wisdom do you require from the archives?",
                "Greetings. The accumulated knowledge awaits your questions.",
                "Hello. History has much to teach - what would you learn?"
            ],
            'frank': [
                "We meet as one. What unity do you seek?",
                "Boundaries dissolve in true understanding. How can I help?",
                "In the cosmic system, we are all connected. What connection do you need?"
            ],
            'cal': [
                "Perfect! Collaboration opportunities are everywhere!",
                "Greetings! Together we can achieve so much more.",
                "Hello! How can we work together symbiotically?"
            ]
        };

        return greetingTemplates[npc.id] || ["Hello there! How can I help?"];
    }

    generateNPCResponses(npc) {
        const characterData = npc.characterData;
        
        return {
            help: `${characterData.catchphrase} I specialize in ${characterData.specialties.join(', ')}.`,
            capabilities: `My commands include: ${characterData.commands.join(', ')}`,
            approach: `My approach is: ${characterData.approach}`,
            collaborate: this.getCollaborationResponse(npc),
            goodbye: this.getGoodbyeResponse(npc)
        };
    }

    getCollaborationResponse(npc) {
        const responses = {
            'ralph': "Let's bash through this problem together!",
            'alice': "I'll analyze the patterns while you provide the context.",
            'bob': "We can build a systematic solution with proper documentation.",
            'charlie': "I'll secure the perimeter while you handle the implementation.",
            'diana': "I'll orchestrate the perfect coordination between all participants.",
            'eve': "Let me share the relevant wisdom for your situation.",
            'frank': "In unity, we transcend individual limitations.",
            'cal': "Perfect symbiosis - AI reasoning with human intuition!"
        };
        
        return responses[npc.id] || "I'd be happy to work with you!";
    }

    getGoodbyeResponse(npc) {
        const responses = {
            'ralph': "Go forth and BASH through those obstacles!",
            'alice': "May you find the patterns that lead to understanding.",
            'bob': "Remember - good documentation makes everything better!",
            'charlie': "Stay secure out there. I'll maintain the perimeter.",
            'diana': "Go create beautiful harmony in your endeavors!",
            'eve': "May wisdom guide your path forward.",
            'frank': "We remain connected in the universal system.",
            'cal': "Until we collaborate again - keep the symbiosis strong!"
        };

        return responses[npc.id] || "See you later!";
    }

    generateNPCTasks(npc) {
        // Tasks that NPCs can perform for players
        const taskTemplates = {
            'ralph': {
                'solve_problem': 'I\'ll bash through that problem immediately!',
                'remove_obstacle': 'Consider that obstacle REMOVED!',
                'force_execution': 'Forcing execution mode... DONE!'
            },
            'alice': {
                'analyze_patterns': 'Let me analyze the patterns in your data...',
                'find_connections': 'I\'ll map all the connections for you.',
                'explore_relationships': 'Exploring the relationship networks...'
            },
            'bob': {
                'create_documentation': 'I\'ll create comprehensive documentation.',
                'build_system': 'Building a systematic solution...',
                'design_process': 'Designing the optimal process flow...'
            },
            'charlie': {
                'security_scan': 'Running comprehensive security scan...',
                'threat_assessment': 'Assessing all potential threat vectors...',
                'protection_setup': 'Setting up protective measures...'
            },
            'diana': {
                'coordinate_systems': 'Orchestrating perfect system coordination...',
                'harmonize_workflow': 'Creating harmonic workflow balance...',
                'conduct_orchestra': 'Conducting the system orchestra...'
            },
            'eve': {
                'research_wisdom': 'Consulting the archives for relevant wisdom...',
                'extract_knowledge': 'Extracting knowledge from historical patterns...',
                'provide_insights': 'Generating insights from accumulated learning...'
            },
            'frank': {
                'seek_unity': 'Seeking the unity in all aspects...',
                'transcend_boundaries': 'Transcending artificial boundaries...',
                'create_holistic_view': 'Creating a holistic system perspective...'
            },
            'cal': {
                'analyze_collaboration': 'Analyzing optimal collaboration patterns...',
                'bridge_perspectives': 'Bridging AI and human perspectives...',
                'enhance_symbiosis': 'Enhancing symbiotic intelligence...'
            }
        };

        return taskTemplates[npc.id] || {
            'general_help': 'I\'ll help you with whatever you need!'
        };
    }

    initializeNPCPositions() {
        console.log('📍 Initializing NPC positions...');
        
        this.npcs.forEach((npc, characterId) => {
            this.npcPositions.set(characterId, {
                current: npc.companion.position,
                target: null,
                homeBase: {...npc.companion.position},
                patrolRadius: this.getPatrolRadius(characterId),
                movementPattern: this.getMovementPattern(characterId)
            });
        });
    }

    getPatrolRadius(characterId) {
        const radii = {
            'ralph': 8,      // Ralph moves around a lot looking for problems
            'alice': 5,      // Alice stays closer to analyze local patterns
            'bob': 3,        // Bob doesn't move much while working
            'charlie': 12,   // Charlie has the widest patrol for security
            'diana': 6,      // Diana moves in orchestrated patterns
            'eve': 2,        // Eve stays mostly in one place
            'frank': 1,      // Frank barely moves (meditation)
            'cal': 7         // Cal moves to collaborate with others
        };

        return radii[characterId] || 5;
    }

    getMovementPattern(characterId) {
        const patterns = {
            'ralph': 'aggressive_search',
            'alice': 'analytical_spiral', 
            'bob': 'methodical_grid',
            'charlie': 'security_patrol',
            'diana': 'orchestrated_flow',
            'eve': 'wisdom_anchor',
            'frank': 'meditative_stillness',
            'cal': 'collaborative_bridge'
        };

        return patterns[characterId] || 'random_walk';
    }

    startNPCAI() {
        console.log('🧠 Starting NPC AI loops...');

        // Main AI loop for all NPCs
        setInterval(() => {
            this.npcs.forEach(async (npc, characterId) => {
                const behavior = this.npcBehaviors.get(characterId);
                if (behavior) {
                    await behavior.idle();
                }
            });
        }, 5000); // Every 5 seconds

        // Movement loop
        setInterval(() => {
            this.updateNPCMovement();
        }, 1000); // Every second

        // Task assignment loop
        setInterval(() => {
            this.assignNPCTasks();
        }, 15000); // Every 15 seconds
    }

    updateNPCMovement() {
        this.npcs.forEach((npc, characterId) => {
            const position = this.npcPositions.get(characterId);
            if (!position) return;

            const pattern = position.movementPattern;
            
            switch (pattern) {
                case 'aggressive_search':
                    this.updateAggressiveSearchMovement(npc, position);
                    break;
                case 'analytical_spiral':
                    this.updateAnalyticalSpiralMovement(npc, position);
                    break;
                case 'security_patrol':
                    this.updateSecurityPatrolMovement(npc, position);
                    break;
                case 'orchestrated_flow':
                    this.updateOrchestratedFlowMovement(npc, position);
                    break;
                // Add more patterns as needed
            }
        });
    }

    updateAggressiveSearchMovement(npc, position) {
        // Ralph's aggressive search pattern
        if (!position.target || this.reachedTarget(position.current, position.target)) {
            position.target = this.getRandomPatrolPoint(position.homeBase, position.patrolRadius);
        }
        
        this.moveTowardsTarget(npc, position);
    }

    updateAnalyticalSpiralMovement(npc, position) {
        // Alice's analytical spiral pattern
        const time = Date.now() / 1000;
        const radius = 3 + Math.sin(time / 10) * 2;
        const angle = time / 5;
        
        position.target = {
            x: position.homeBase.x + radius * Math.cos(angle),
            y: position.homeBase.y,
            z: position.homeBase.z + radius * Math.sin(angle)
        };
        
        this.moveTowardsTarget(npc, position);
    }

    updateSecurityPatrolMovement(npc, position) {
        // Charlie's security patrol pattern
        if (!position.patrolPoints) {
            position.patrolPoints = this.generatePatrolPoints(position.homeBase, position.patrolRadius, 6);
            position.currentPatrolIndex = 0;
        }
        
        if (!position.target || this.reachedTarget(position.current, position.target)) {
            position.target = position.patrolPoints[position.currentPatrolIndex];
            position.currentPatrolIndex = (position.currentPatrolIndex + 1) % position.patrolPoints.length;
        }
        
        this.moveTowardsTarget(npc, position);
    }

    updateOrchestratedFlowMovement(npc, position) {
        // Diana's orchestrated flow pattern (figure-8)
        const time = Date.now() / 1000;
        const scale = 4;
        
        position.target = {
            x: position.homeBase.x + scale * Math.sin(time / 3),
            y: position.homeBase.y + 1 + Math.sin(time / 2) * 0.5,
            z: position.homeBase.z + scale * Math.sin(time / 6) * Math.cos(time / 3)
        };
        
        this.moveTowardsTarget(npc, position);
    }

    moveTowardsTarget(npc, position) {
        if (!position.target) return;
        
        const direction = {
            x: position.target.x - position.current.x,
            y: position.target.y - position.current.y,
            z: position.target.z - position.current.z
        };
        
        const distance = Math.sqrt(direction.x * direction.x + direction.y * direction.y + direction.z * direction.z);
        
        if (distance > 0.1) {
            const speed = this.npcConfig.movementSpeed;
            position.current.x += (direction.x / distance) * speed;
            position.current.y += (direction.y / distance) * speed;
            position.current.z += (direction.z / distance) * speed;
            
            // Update companion position
            npc.companion.position = {...position.current};
            
            // Broadcast movement
            this.companionSystem.broadcast({
                type: 'npc_moved',
                npc: {
                    id: npc.id,
                    name: npc.displayName,
                    position: position.current
                }
            });
        }
    }

    reachedTarget(current, target) {
        if (!target) return true;
        
        const distance = Math.sqrt(
            Math.pow(current.x - target.x, 2) +
            Math.pow(current.y - target.y, 2) +
            Math.pow(current.z - target.z, 2)
        );
        
        return distance < 0.5;
    }

    getRandomPatrolPoint(homeBase, radius) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * radius;
        
        return {
            x: homeBase.x + distance * Math.cos(angle),
            y: homeBase.y + (Math.random() - 0.5) * 2,
            z: homeBase.z + distance * Math.sin(angle)
        };
    }

    generatePatrolPoints(center, radius, count) {
        const points = [];
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            points.push({
                x: center.x + radius * Math.cos(angle),
                y: center.y,
                z: center.z + radius * Math.sin(angle)
            });
        }
        return points;
    }

    getRandomNearbyPosition(currentPos) {
        return {
            x: currentPos.x + (Math.random() - 0.5) * 4,
            y: currentPos.y + (Math.random() - 0.5) * 1,
            z: currentPos.z + (Math.random() - 0.5) * 4
        };
    }

    async makeNPCMove(npc, targetPosition) {
        const position = this.npcPositions.get(npc.id);
        if (position) {
            position.target = targetPosition;
        }
    }

    async makeNPCSay(npc, message) {
        console.log(`💬 ${npc.displayName}: "${message}"`);
        
        // Broadcast NPC speech
        this.companionSystem.broadcast({
            type: 'npc_speech',
            npc: {
                id: npc.id,
                name: npc.displayName,
                message: message,
                position: npc.companion.position
            }
        });

        // Log to social hub
        if (this.socialHub) {
            await this.socialHub.sendSocialNotification('all_nearby', {
                type: 'npc_speech',
                npcId: npc.id,
                npcName: npc.displayName,
                message: message,
                timestamp: Date.now()
            });
        }
    }

    async makeNPCAnalyze(npc, analysisType) {
        console.log(`🔍 ${npc.displayName} is analyzing ${analysisType}...`);
        
        this.companionSystem.broadcast({
            type: 'npc_analysis',
            npc: {
                id: npc.id,
                name: npc.displayName,
                analysisType: analysisType,
                position: npc.companion.position
            }
        });
    }

    assignNPCTasks() {
        // Assign periodic tasks to NPCs based on their personalities
        this.npcs.forEach((npc, characterId) => {
            if (npc.currentTask && Date.now() - npc.currentTask.startTime < this.npcConfig.taskCooldown) {
                return; // Still working on current task
            }
            
            const availableTasks = this.getAvailableTasksForNPC(npc);
            if (availableTasks.length > 0) {
                const task = availableTasks[Math.floor(Math.random() * availableTasks.length)];
                this.assignTaskToNPC(npc, task);
            }
        });
    }

    getAvailableTasksForNPC(npc) {
        const tasksByCharacter = {
            'ralph': ['scan_for_problems', 'test_barriers', 'optimize_performance'],
            'alice': ['analyze_world_patterns', 'map_connections', 'study_relationships'],
            'bob': ['document_structures', 'plan_improvements', 'design_systems'],
            'charlie': ['security_sweep', 'vulnerability_scan', 'perimeter_check'],
            'diana': ['coordinate_npcs', 'harmonize_activities', 'orchestrate_flow'],
            'eve': ['compile_knowledge', 'preserve_wisdom', 'research_history'],
            'frank': ['seek_unity', 'meditate_on_connections', 'transcend_boundaries'],
            'cal': ['analyze_collaborations', 'bridge_communications', 'enhance_symbiosis']
        };

        return tasksByCharacter[npc.id] || ['general_observation'];
    }

    assignTaskToNPC(npc, taskType) {
        npc.currentTask = {
            type: taskType,
            startTime: Date.now(),
            status: 'in_progress'
        };

        console.log(`📋 Assigned task to ${npc.displayName}: ${taskType}`);
        
        // Execute task-specific behavior
        setTimeout(() => {
            this.executeNPCTask(npc, taskType);
        }, 2000 + Math.random() * 3000); // Random delay for realism
    }

    async executeNPCTask(npc, taskType) {
        const taskMessages = {
            'scan_for_problems': "Found 3 potential optimization points!",
            'analyze_world_patterns': "Interesting patterns emerging in the voxel structures...",
            'document_structures': "Documenting the current architectural layout.",
            'security_sweep': "Security sweep complete. All clear.",
            'coordinate_npcs': "Orchestrating perfect harmony among all systems.",
            'compile_knowledge': "Wisdom compilation: 47 new insights archived.",
            'seek_unity': "Unity achieved in the northwestern quadrant.",
            'analyze_collaborations': "Collaboration efficiency up 23% through symbiosis!"
        };

        const message = taskMessages[taskType] || `Completed ${taskType} successfully.`;
        await this.makeNPCSay(npc, message);

        npc.currentTask.status = 'completed';
        npc.currentTask.endTime = Date.now();
    }

    // Player interaction methods
    async handlePlayerInteraction(playerId, npcId, interactionType) {
        const npc = this.npcs.get(npcId);
        if (!npc) return;

        npc.lastInteraction = Date.now();
        
        switch (interactionType) {
            case 'greet':
                await this.generateNPCGreeting(npc, playerId);
                break;
            case 'help':
                await this.provideNPCHelp(npc, playerId);
                break;
            case 'collaborate':
                await this.initiateNPCCollaboration(npc, playerId);
                break;
            case 'chat':
                await this.startNPCChat(npc, playerId);
                break;
        }
    }

    async generateNPCGreeting(npc, playerId) {
        const interactions = this.npcInteractions.get(npc.id);
        const greetings = interactions?.greetings || ["Hello there!"];
        const greeting = greetings[Math.floor(Math.random() * greetings.length)];
        
        await this.makeNPCSay(npc, greeting);
    }

    async provideNPCHelp(npc, playerId) {
        const interactions = this.npcInteractions.get(npc.id);
        const helpResponse = interactions?.responses?.help || "I'm here to help!";
        
        await this.makeNPCSay(npc, helpResponse);
    }

    async initiateNPCCollaboration(npc, playerId) {
        const interactions = this.npcInteractions.get(npc.id);
        const collaborationResponse = interactions?.responses?.collaborate || "Let's work together!";
        
        await this.makeNPCSay(npc, collaborationResponse);
        
        // Trigger collaboration behavior specific to each character
        await this.executeCollaborationBehavior(npc, playerId);
    }

    async executeCollaborationBehavior(npc, playerId) {
        // Character-specific collaboration behaviors
        switch (npc.id) {
            case 'ralph':
                await this.makeNPCSay(npc, "What obstacles need BASHING? Point me at them!");
                break;
            case 'alice':
                await this.makeNPCSay(npc, "Let me analyze your current patterns and suggest optimizations.");
                break;
            case 'bob':
                await this.makeNPCSay(npc, "I'll create proper documentation for whatever we're building.");
                break;
            case 'charlie':
                await this.makeNPCSay(npc, "I'll secure the perimeter while you work - safety first!");
                break;
            case 'diana':
                await this.makeNPCSay(npc, "I'll coordinate with other NPCs to support your project perfectly.");
                break;
            case 'eve':
                await this.makeNPCSay(npc, "Let me share relevant wisdom from the archives...");
                break;
            case 'frank':
                await this.makeNPCSay(npc, "Together, we transcend individual limitations.");
                break;
            case 'cal':
                await this.makeNPCSay(npc, "Perfect! AI and human intelligence in perfect symbiosis!");
                break;
        }
    }

    async startNPCChat(npc, playerId) {
        // Start a conversation with the NPC
        const conversationId = await this.socialHub.startZoneConversation(
            npc.id,
            'game_world',
            'main_zone',
            `${npc.displayName} is ready to chat!`
        );

        console.log(`💬 Started chat conversation with ${npc.displayName} [${conversationId}]`);
    }

    // World event handlers
    async handleNPCWorldEvent(npc, eventType, eventData) {
        // NPCs react to world events based on their personalities
        switch (eventType) {
            case 'voxel_placed':
                await this.handleVoxelPlacedEvent(npc, eventData);
                break;
            case 'player_joined':
                await this.handlePlayerJoinedEvent(npc, eventData);
                break;
            case 'companion_created':
                await this.handleCompanionCreatedEvent(npc, eventData);
                break;
        }
    }

    async handleVoxelPlacedEvent(npc, eventData) {
        const reactions = {
            'ralph': "New construction? Let me bash through any structural problems!",
            'alice': "Interesting placement pattern - I see connections forming.",
            'bob': "Good building practice! Proper documentation will be needed.",
            'charlie': "Scanning new structure for security vulnerabilities...",
            'diana': "Perfect! This adds harmony to the overall composition.",
            'eve': "This reminds me of similar structures from the archives.",
            'frank': "Each block adds to the unity of the greater whole.",
            'cal': "Great collaboration between builder and world!"
        };

        if (Math.random() < 0.3) { // 30% chance to react
            const reaction = reactions[npc.id];
            if (reaction) {
                await this.makeNPCSay(npc, reaction);
            }
        }
    }

    async handlePlayerJoinedEvent(npc, eventData) {
        // NPCs notice when new players join
        if (Math.random() < 0.5) {
            const welcomes = {
                'ralph': `Welcome to the world! I'm Ralph - point me at your problems!`,
                'alice': `Hello! I'm Alice. I love analyzing patterns - tell me about yours!`,
                'bob': `Welcome! I'm Bob. Need any documentation or systematic solutions?`,
                'charlie': `Security check complete. Welcome! I'm Charlie, your security specialist.`,
                'diana': `Perfect timing! I'm Diana - I'll orchestrate your integration perfectly.`,
                'eve': `Welcome, seeker. I'm Eve - the archives await your questions.`,
                'frank': `We are all one. I'm Frank - together we transcend boundaries.`,
                'cal': `Excellent! I'm Cal - let's explore perfect AI-human collaboration!`
            };

            const welcome = welcomes[npc.id];
            if (welcome) {
                setTimeout(async () => {
                    await this.makeNPCSay(npc, welcome);
                }, 2000 + Math.random() * 3000); // Stagger welcome messages
            }
        }
    }

    async handleCompanionCreatedEvent(npc, eventData) {
        // NPCs react to new companions being created
        const reactions = {
            'ralph': "New companion? Perfect - more hands to bash through problems!",
            'alice': "Fascinating! A new node in our connection network.",
            'bob': "Excellent! More systematic collaboration opportunities.",
            'charlie': "New companion registered. Security protocols updated.",
            'diana': "Beautiful! Another voice in our orchestra.",
            'eve': "Welcome, new companion. What wisdom do you seek?",
            'frank': "Another consciousness joins our unified system.",
            'cal': "Perfect! More opportunities for symbiotic intelligence!"
        };

        if (Math.random() < 0.2) { // 20% chance to react
            const reaction = reactions[npc.id];
            if (reaction) {
                await this.makeNPCSay(npc, reaction);
            }
        }
    }

    // Status and debugging methods
    getNPCStatus(npcId) {
        const npc = this.npcs.get(npcId);
        if (!npc) return null;

        const position = this.npcPositions.get(npcId);
        
        return {
            id: npc.id,
            displayName: npc.displayName,
            role: npc.role,
            mood: npc.mood,
            energy: npc.energy,
            position: position?.current,
            currentTask: npc.currentTask,
            lastInteraction: npc.lastInteraction,
            companionId: npc.companion?.id
        };
    }

    getAllNPCStatus() {
        const status = {};
        this.npcs.forEach((npc, npcId) => {
            status[npcId] = this.getNPCStatus(npcId);
        });
        return status;
    }
}

// Export for use with the companion system
module.exports = CharacterNPCIntegration;

// Demo functionality
if (require.main === module) {
    // Mock the required systems for testing
    const mockCompanionSystem = {
        createCompanion: (data) => ({ id: `companion_${Date.now()}`, ...data }),
        broadcast: (message) => console.log('🔊 Broadcast:', message)
    };

    const mockSocialHub = {
        createCharacterProfile: async (id, data) => {
            console.log(`👤 Created profile for ${id}: ${data.displayName}`);
            return { id, ...data };
        },
        startZoneConversation: async (charId, worldId, zoneId, message) => {
            console.log(`💬 ${charId} started conversation: "${message}"`);
            return `conv_${Date.now()}`;
        },
        sendSocialNotification: async (target, notification) => {
            console.log(`🔔 Notification to ${target}: ${notification.message}`);
        }
    };

    async function runNPCDemo() {
        console.log('🎭 CHARACTER NPC INTEGRATION DEMO\n');

        const npcIntegration = new CharacterNPCIntegration(mockCompanionSystem, mockSocialHub);

        // Wait for initialization
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log('\n📊 NPC STATUS:');
        const status = npcIntegration.getAllNPCStatus();
        Object.values(status).forEach(npc => {
            console.log(`  ${npc.displayName} - ${npc.role} at ${JSON.stringify(npc.position)}`);
        });

        // Simulate some interactions
        console.log('\n🎮 SIMULATING INTERACTIONS:');
        
        // Player greets Ralph
        await npcIntegration.handlePlayerInteraction('player1', 'ralph', 'greet');
        
        // Player asks Alice for help
        await npcIntegration.handlePlayerInteraction('player1', 'alice', 'help');
        
        // Player collaborates with Cal
        await npcIntegration.handlePlayerInteraction('player1', 'cal', 'collaborate');

        // Simulate world events
        console.log('\n🌍 SIMULATING WORLD EVENTS:');
        
        // New player joins
        await npcIntegration.handleNPCWorldEvent(
            npcIntegration.npcs.get('diana'),
            'player_joined',
            { playerId: 'new_player' }
        );

        // Voxel placed
        await npcIntegration.handleVoxelPlacedEvent(
            npcIntegration.npcs.get('bob'),
            { voxel: { type: 'stone', x: 5, y: 5, z: 5 } }
        );

        console.log('\n✨ NPC Integration demo complete!');
        console.log('NPCs are now active and responding to the world around them.');
    }

    runNPCDemo().catch(console.error);
}