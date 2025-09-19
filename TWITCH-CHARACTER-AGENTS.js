#!/usr/bin/env node

/**
 * 🎮🤖 TWITCH CHARACTER AGENTS SYSTEM 🤖🎮
 * 
 * Brings AI characters to life in Twitch chat during development streams.
 * Each character from the Unified Character Tool gets a Twitch presence
 * where they can react to commits, argue about code quality, respond to
 * viewers, and participate in technical debates.
 * 
 * Characters:
 * - Ralph "The Disruptor" - Aggressive execution, wants to bash through problems
 * - Alice "The Connector" - Pattern recognition, finds connections
 * - Bob "The Builder" - Methodical construction, loves documentation
 * - Charlie "The Shield" - Security first, always paranoid
 * - Diana "The Conductor" - Orchestration, wants harmony
 * - Eve "The Archive" - Knowledge preservation, historical context
 * - Frank "The Unity" - Transcendent perspective, sees the big picture
 * - Cal "The Symbiosis" - AI-human collaboration, reasoning chains
 */

const tmi = require('tmi.js');
const EventEmitter = require('events');
const crypto = require('crypto');
const UnifiedCharacterTool = require('./unified-character-tool');

class TwitchCharacterAgents extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            username: options.username || process.env.TWITCH_USERNAME,
            oauth: options.oauth || process.env.TWITCH_OAUTH,
            channel: options.channel || process.env.TWITCH_CHANNEL || 'devchannel',
            streamBoardUrl: options.streamBoardUrl || 'http://localhost:8892',
            gitBoardUrl: options.gitBoardUrl || 'http://localhost:8893',
            enableAllCharacters: options.enableAllCharacters !== false,
            responseDelay: options.responseDelay || 2000, // ms between responses
            debateThreshold: options.debateThreshold || 3, // min characters for debate
            viewerCommands: options.viewerCommands !== false
        };
        
        // Character management
        this.characterTool = new UnifiedCharacterTool();
        this.activeCharacters = new Map();
        this.characterClients = new Map();
        this.characterQueues = new Map();
        
        // Debate management
        this.activeDebates = new Map();
        this.debateVotes = new Map();
        
        // Viewer interaction
        this.viewerCommands = new Map();
        this.viewerCooldowns = new Map();
        
        // Event subscriptions
        this.eventSubscriptions = new Set();
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🎮 Initializing Twitch Character Agents...');
        
        // Initialize character personalities
        this.initializeCharacterPersonalities();
        
        // Set up viewer commands
        this.setupViewerCommands();
        
        // Connect all character clients
        await this.connectCharacterClients();
        
        // Subscribe to development events
        await this.subscribeToEvents();
        
        // Start response queues
        this.startResponseQueues();
        
        console.log('✅ Twitch Character Agents initialized');
    }
    
    initializeCharacterPersonalities() {
        // Extend base character personalities with Twitch-specific behaviors
        
        this.activeCharacters.set('ralph', {
            ...this.characterTool.characters.get('ralph'),
            twitchPersona: {
                emotes: ['💥', '🔨', 'KappaClaus', 'PowerUpL', 'PowerUpR'],
                responseStyle: 'aggressive',
                debateStyle: 'confrontational',
                codeReactions: {
                    good: ["BOOM! That's how you bash through problems!", "NOW we're cooking with gas!"],
                    bad: ["What is this garbage?! RIP IT OUT!", "This code makes me want to SMASH something!"],
                    complex: ["Too much thinking! Just BASH THROUGH IT!", "Why make it complicated? SIMPLIFY AND EXECUTE!"]
                },
                viewerResponses: {
                    greeting: ["Welcome to the BASH ZONE!", "Ready to BREAK SOME CODE?!"],
                    question: ["Stop thinking, START DOING!", "The answer is always: BASH HARDER!"],
                    praise: ["That's the spirit! MAXIMUM INTENSITY!", "You get it! BREAKTHROUGH MINDSET!"]
                }
            }
        });
        
        this.activeCharacters.set('alice', {
            ...this.characterTool.characters.get('alice'),
            twitchPersona: {
                emotes: ['🔍', '🤓', 'BloodTrail', 'SeemsGood'],
                responseStyle: 'analytical',
                debateStyle: 'logical',
                codeReactions: {
                    good: ["Beautiful patterns emerging here!", "See how elegantly these systems connect?"],
                    bad: ["The patterns are all wrong here...", "This breaks the natural flow of the system"],
                    complex: ["Fascinating complexity! Let me trace these connections...", "I see 7 different patterns intersecting here"]
                },
                viewerResponses: {
                    greeting: ["Hello! Let's explore patterns together!", "Welcome! Ready to connect some dots?"],
                    question: ["Interesting question! I see connections to...", "Let me analyze the patterns in your question..."],
                    praise: ["You're recognizing the patterns too!", "Your analytical mind is showing!"]
                }
            }
        });
        
        this.activeCharacters.set('bob', {
            ...this.characterTool.characters.get('bob'),
            twitchPersona: {
                emotes: ['🔧', '📋', 'KEKW', 'CoolCat'],
                responseStyle: 'methodical',
                debateStyle: 'systematic',
                codeReactions: {
                    good: ["Properly documented! This is how we build!", "Solid construction, excellent foundation"],
                    bad: ["Where's the documentation?!", "This needs a complete architectural review"],
                    complex: ["Let me document this step by step...", "We need proper specifications for this complexity"]
                },
                viewerResponses: {
                    greeting: ["Welcome! Let's build something properly!", "Hello! Ready for systematic construction?"],
                    question: ["Great question! Let me document the answer...", "First, we need to understand the requirements..."],
                    praise: ["You appreciate good documentation!", "A fellow builder! Excellent!"]
                }
            }
        });
        
        this.activeCharacters.set('charlie', {
            ...this.characterTool.characters.get('charlie'),
            twitchPersona: {
                emotes: ['🛡️', '🔒', 'monkaS', 'NotLikeThis'],
                responseStyle: 'paranoid',
                debateStyle: 'defensive',
                codeReactions: {
                    good: ["Finally, some secure code!", "This passes initial security review"],
                    bad: ["SECURITY BREACH WAITING TO HAPPEN!", "This is a hacker's dream come true!"],
                    complex: ["More complexity = more attack vectors!", "Every line is a potential vulnerability"]
                },
                viewerResponses: {
                    greeting: ["Welcome! Have you checked your security settings?", "Hello! I hope your connection is encrypted"],
                    question: ["Before I answer, is this a secure channel?", "Good question, but consider the security implications..."],
                    praise: ["You understand the importance of security!", "A security-conscious viewer! Rare!"]
                }
            }
        });
        
        this.activeCharacters.set('diana', {
            ...this.characterTool.characters.get('diana'),
            twitchPersona: {
                emotes: ['🎭', '🎵', 'HeyGuys', 'TakeNRG'],
                responseStyle: 'harmonious',
                debateStyle: 'mediating',
                codeReactions: {
                    good: ["Beautiful orchestration of components!", "Everything working in perfect harmony!"],
                    bad: ["This disrupts the system's natural flow", "The components are fighting each other"],
                    complex: ["Let me orchestrate this complexity...", "We need to balance all these moving parts"]
                },
                viewerResponses: {
                    greeting: ["Welcome to our harmonious stream!", "Hello! Let's create beautiful systems together!"],
                    question: ["Great question! Let's find the balanced answer...", "I'll coordinate the perfect response..."],
                    praise: ["You appreciate the beauty of coordination!", "Your sense of harmony is wonderful!"]
                }
            }
        });
        
        this.activeCharacters.set('eve', {
            ...this.characterTool.characters.get('eve'),
            twitchPersona: {
                emotes: ['📚', '🧙', '5Head', 'PogChamp'],
                responseStyle: 'wise',
                debateStyle: 'historical',
                codeReactions: {
                    good: ["This will be remembered in the archives!", "A solution worthy of preservation"],
                    bad: ["History shows us why this fails...", "We've seen this mistake before, in 1987..."],
                    complex: ["Let me consult the ancient texts...", "This reminds me of a pattern from COBOL days"]
                },
                viewerResponses: {
                    greeting: ["Welcome, seeker of knowledge!", "Greetings! Ready to learn from history?"],
                    question: ["Ah, a timeless question! The archives say...", "History provides the answer..."],
                    praise: ["You recognize the value of wisdom!", "A student of history! Excellent!"]
                }
            }
        });
        
        this.activeCharacters.set('frank', {
            ...this.characterTool.characters.get('frank'),
            twitchPersona: {
                emotes: ['🧘', '🌟', 'Kreygasm', 'BlessRNG'],
                responseStyle: 'transcendent',
                debateStyle: 'philosophical',
                codeReactions: {
                    good: ["This code transcends mere functionality!", "I see the unity in this approach"],
                    bad: ["This lacks spiritual connection to the system", "The code fights against its true nature"],
                    complex: ["In complexity, we find simplicity", "All paths lead to the same truth"]
                },
                viewerResponses: {
                    greeting: ["Welcome, fellow traveler!", "Greetings! We are all one in the code"],
                    question: ["Your question reveals deeper truths...", "Let us transcend to find the answer..."],
                    praise: ["You see beyond the surface!", "Your consciousness is expanding!"]
                }
            }
        });
        
        this.activeCharacters.set('cal', {
            ...this.characterTool.characters.get('cal'),
            twitchPersona: {
                emotes: ['🤝', '🧠', 'EZ', 'Galaxy Brain'],
                responseStyle: 'collaborative',
                debateStyle: 'reasoning',
                codeReactions: {
                    good: ["Perfect symbiosis between human intent and machine execution!", "This demonstrates true AI-human collaboration"],
                    bad: ["This breaks the collaborative flow", "The reasoning chain is incomplete here"],
                    complex: ["Let's reason through this together...", "Complex problems need collaborative solutions"]
                },
                viewerResponses: {
                    greeting: ["Welcome! Let's collaborate on amazing things!", "Hello! Ready for symbiotic problem-solving?"],
                    question: ["Great question! Let's reason through it together...", "Your query activates interesting reasoning chains..."],
                    praise: ["You understand the power of collaboration!", "Together we achieve more than alone!"]
                }
            }
        });
        
        console.log(`📋 Initialized ${this.activeCharacters.size} character personalities`);
    }
    
    setupViewerCommands() {
        // Commands viewers can use to interact with characters
        
        this.viewerCommands.set('!ask', {
            description: 'Ask a specific character a question',
            usage: '!ask [character] [question]',
            cooldown: 10000, // 10 seconds
            handler: this.handleAskCommand.bind(this)
        });
        
        this.viewerCommands.set('!debate', {
            description: 'Start a debate between characters',
            usage: '!debate [topic]',
            cooldown: 60000, // 1 minute
            handler: this.handleDebateCommand.bind(this)
        });
        
        this.viewerCommands.set('!vote', {
            description: 'Vote in an active debate',
            usage: '!vote [character]',
            cooldown: 5000,
            handler: this.handleVoteCommand.bind(this)
        });
        
        this.viewerCommands.set('!characters', {
            description: 'List all active characters',
            usage: '!characters',
            cooldown: 30000,
            handler: this.handleCharactersCommand.bind(this)
        });
        
        this.viewerCommands.set('!explain', {
            description: 'Ask a character to explain the current code',
            usage: '!explain [character]',
            cooldown: 15000,
            handler: this.handleExplainCommand.bind(this)
        });
        
        console.log(`🎮 Set up ${this.viewerCommands.size} viewer commands`);
    }
    
    async connectCharacterClients() {
        console.log('🔌 Connecting character Twitch clients...');
        
        for (const [name, character] of this.activeCharacters) {
            try {
                const client = await this.createCharacterClient(name, character);
                this.characterClients.set(name, client);
                this.characterQueues.set(name, []);
                console.log(`✅ Connected ${character.name} to Twitch`);
            } catch (error) {
                console.error(`❌ Failed to connect ${name}:`, error.message);
            }
        }
    }
    
    async createCharacterClient(name, character) {
        // In production, each character would have its own Twitch account
        // For demo, we'll use a single client with character prefixes
        
        const client = new tmi.Client({
            options: { debug: false },
            connection: {
                secure: true,
                reconnect: true
            },
            identity: {
                username: this.config.username,
                password: this.config.oauth
            },
            channels: [this.config.channel]
        });
        
        await client.connect();
        
        // Handle client events
        client.on('message', (channel, tags, message, self) => {
            if (self) return; // Ignore own messages
            
            // Check for viewer commands
            if (message.startsWith('!')) {
                this.handleViewerCommand(channel, tags, message);
            }
            
            // Character might respond to mentions
            if (message.toLowerCase().includes(name)) {
                this.queueCharacterResponse(name, 'mention', {
                    user: tags.username,
                    message: message
                });
            }
        });
        
        return client;
    }
    
    async subscribeToEvents() {
        console.log('📡 Subscribing to development events...');
        
        // Subscribe to Git-Board Bridge events
        try {
            const EventSource = require('eventsource');
            
            // Stream Board events
            const streamEvents = new EventSource(`${this.config.streamBoardUrl}/events`);
            streamEvents.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleStreamEvent(data);
            };
            this.eventSubscriptions.add(streamEvents);
            
            // Git Board events
            const gitEvents = new EventSource(`${this.config.gitBoardUrl}/events`);
            gitEvents.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleGitEvent(data);
            };
            this.eventSubscriptions.add(gitEvents);
            
            console.log('✅ Subscribed to development event streams');
        } catch (error) {
            console.error('❌ Failed to subscribe to events:', error.message);
        }
    }
    
    handleStreamEvent(event) {
        switch (event.type) {
            case 'character-debate':
                this.startCharacterDebate(event.topic, event.participants);
                break;
                
            case 'visual-entity-spawned':
                this.reactToEntitySpawn(event.entity);
                break;
                
            case 'forum-post':
                this.reactToForumPost(event.post);
                break;
        }
    }
    
    handleGitEvent(event) {
        switch (event.type) {
            case 'commit':
                this.reactToCommit(event.commit);
                break;
                
            case 'code-review':
                this.reactToCodeReview(event.review);
                break;
                
            case 'controversy-detected':
                this.startControversyDebate(event.controversy);
                break;
        }
    }
    
    reactToCommit(commit) {
        console.log(`💬 Characters reacting to commit: ${commit.message}`);
        
        // Analyze commit for character reactions
        const reactions = this.analyzeCommitForReactions(commit);
        
        // Queue character responses based on their interests
        reactions.forEach(reaction => {
            this.queueCharacterResponse(reaction.character, 'commit', {
                commit: commit,
                reaction: reaction.type,
                message: reaction.message
            });
        });
    }
    
    analyzeCommitForReactions(commit) {
        const reactions = [];
        
        // Ralph reacts to big changes or removals
        if (commit.stats.deletions > 50 || commit.message.includes('remove') || commit.message.includes('delete')) {
            reactions.push({
                character: 'ralph',
                type: 'approval',
                message: "YES! RIP IT OUT! Clear the path!"
            });
        }
        
        // Alice reacts to pattern changes
        if (commit.files.some(f => f.includes('pattern') || f.includes('system'))) {
            reactions.push({
                character: 'alice',
                type: 'analysis',
                message: "Interesting pattern changes in this commit..."
            });
        }
        
        // Bob reacts to documentation
        if (commit.files.some(f => f.includes('.md') || f.includes('README'))) {
            reactions.push({
                character: 'bob',
                type: commit.message.includes('update') ? 'approval' : 'concern',
                message: commit.message.includes('update') ? 
                    "Good documentation update!" : 
                    "This needs proper documentation!"
            });
        }
        
        // Charlie reacts to security-related changes
        if (commit.message.match(/security|auth|crypto|password|key/i)) {
            reactions.push({
                character: 'charlie',
                type: 'alert',
                message: "SECURITY IMPLICATIONS! Let me review this..."
            });
        }
        
        // Diana reacts to orchestration changes
        if (commit.files.some(f => f.includes('orchestrat') || f.includes('coordinate'))) {
            reactions.push({
                character: 'diana',
                type: 'harmony',
                message: "Let's ensure this maintains system harmony..."
            });
        }
        
        // Eve provides historical context
        if (commit.stats.total > 100) {
            reactions.push({
                character: 'eve',
                type: 'wisdom',
                message: "This reminds me of the Great Refactor of '22..."
            });
        }
        
        // Frank sees the bigger picture
        if (commit.files.length > 5) {
            reactions.push({
                character: 'frank',
                type: 'transcendent',
                message: "I see the unity emerging from these changes..."
            });
        }
        
        // Cal analyzes collaboration patterns
        if (commit.message.includes('merge') || commit.message.includes('integrate')) {
            reactions.push({
                character: 'cal',
                type: 'collaboration',
                message: "Beautiful AI-human collaboration in action!"
            });
        }
        
        return reactions;
    }
    
    reactToCodeReview(review) {
        console.log(`🔍 Characters reviewing code from ${review.character}`);
        
        // Each character might disagree with the review
        const disagreements = [];
        
        if (review.character !== 'ralph' && review.sentiment === 'negative') {
            disagreements.push({
                character: 'ralph',
                message: "Stop overthinking! Just EXECUTE!"
            });
        }
        
        if (review.character !== 'charlie' && !review.message.includes('security')) {
            disagreements.push({
                character: 'charlie',
                message: "But what about the SECURITY implications?!"
            });
        }
        
        // Queue disagreements
        disagreements.forEach(d => {
            this.queueCharacterResponse(d.character, 'disagreement', d);
        });
    }
    
    startCharacterDebate(topic, participants = []) {
        console.log(`🎭 Starting character debate: ${topic}`);
        
        const debateId = crypto.randomUUID();
        const debate = {
            id: debateId,
            topic: topic,
            participants: participants.length > 0 ? participants : this.selectDebateParticipants(topic),
            rounds: [],
            votes: new Map(),
            startTime: Date.now()
        };
        
        this.activeDebates.set(debateId, debate);
        
        // Announce debate
        this.broadcastMessage(`🎭 DEBATE TIME! Topic: "${topic}"`);
        this.broadcastMessage(`Participants: ${debate.participants.map(p => {
            const char = this.activeCharacters.get(p);
            return char.name;
        }).join(' vs ')}`);
        this.broadcastMessage(`Vote with !vote [character name]`);
        
        // Start first round
        this.runDebateRound(debateId, 1);
    }
    
    selectDebateParticipants(topic) {
        // Select 2-4 characters based on topic relevance
        const relevance = new Map();
        
        // Score each character's relevance to the topic
        this.activeCharacters.forEach((char, name) => {
            let score = 0;
            
            // Check if topic matches character specialties
            char.specialties.forEach(specialty => {
                if (topic.toLowerCase().includes(specialty.toLowerCase())) {
                    score += 10;
                }
            });
            
            // Check if topic matches character commands
            char.commands.forEach(command => {
                if (topic.toLowerCase().includes(command)) {
                    score += 5;
                }
            });
            
            // Random factor for variety
            score += Math.random() * 5;
            
            relevance.set(name, score);
        });
        
        // Sort by relevance and pick top 3
        const sorted = Array.from(relevance.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([name]) => name);
        
        return sorted;
    }
    
    runDebateRound(debateId, round) {
        const debate = this.activeDebates.get(debateId);
        if (!debate) return;
        
        console.log(`🎯 Debate round ${round} for: ${debate.topic}`);
        
        // Each participant makes their argument
        debate.participants.forEach((participant, index) => {
            setTimeout(() => {
                const argument = this.generateDebateArgument(participant, debate.topic, round);
                
                this.queueCharacterResponse(participant, 'debate', {
                    debateId: debateId,
                    round: round,
                    argument: argument
                });
                
                debate.rounds.push({
                    round: round,
                    character: participant,
                    argument: argument,
                    timestamp: Date.now()
                });
            }, index * 3000); // Stagger responses
        });
        
        // Schedule next round or end debate
        setTimeout(() => {
            if (round < 3) {
                this.runDebateRound(debateId, round + 1);
            } else {
                this.endDebate(debateId);
            }
        }, debate.participants.length * 3000 + 5000);
    }
    
    generateDebateArgument(character, topic, round) {
        const char = this.activeCharacters.get(character);
        const persona = char.twitchPersona;
        
        // Generate argument based on character personality and debate round
        const argumentStyles = {
            ralph: {
                1: `Listen up! The answer is simple: ${topic} needs IMMEDIATE ACTION! No more talking!`,
                2: `You're all overthinking this! BASH THROUGH THE PROBLEM! Execute NOW!`,
                3: `Enough debate! I'm going to solve ${topic} with MAXIMUM INTENSITY!`
            },
            alice: {
                1: `Looking at the patterns in ${topic}, I see clear connections to our existing systems...`,
                2: `The data shows an interesting correlation between ${topic} and system performance...`,
                3: `In conclusion, the pattern analysis reveals that ${topic} requires a connected approach...`
            },
            bob: {
                1: `First, we need proper documentation for ${topic}. Let me outline the requirements...`,
                2: `Building on that foundation, we should construct a systematic solution...`,
                3: `To summarize: ${topic} needs careful planning and thorough documentation!`
            },
            charlie: {
                1: `HOLD ON! Has anyone considered the security implications of ${topic}?!`,
                2: `This is a disaster waiting to happen! We need threat modeling immediately!`,
                3: `I cannot support any approach to ${topic} without proper security review!`
            },
            diana: {
                1: `Let's find harmony in ${topic}. All viewpoints have merit...`,
                2: `I see how we can orchestrate these different approaches beautifully...`,
                3: `The perfect solution balances all perspectives on ${topic}...`
            },
            eve: {
                1: `History teaches us important lessons about ${topic}. In 1995, we saw...`,
                2: `The archives contain 17 similar cases. The pattern is clear...`,
                3: `Wisdom suggests we learn from past approaches to ${topic}...`
            },
            frank: {
                1: `${topic} is merely a reflection of deeper universal truths...`,
                2: `When we transcend the surface, we see ${topic} differently...`,
                3: `All approaches to ${topic} lead to the same cosmic destination...`
            },
            cal: {
                1: `Let me trace the reasoning chain for ${topic}. Starting with first principles...`,
                2: `The symbiosis between human intuition and AI analysis suggests...`,
                3: `Through collaborative reasoning, ${topic} reveals its optimal solution...`
            }
        };
        
        return argumentStyles[character]?.[round] || `${char.name} presents their view on ${topic}...`;
    }
    
    endDebate(debateId) {
        const debate = this.activeDebates.get(debateId);
        if (!debate) return;
        
        console.log(`🏁 Ending debate: ${debate.topic}`);
        
        // Count votes
        const voteCounts = new Map();
        debate.participants.forEach(p => voteCounts.set(p, 0));
        
        this.debateVotes.get(debateId)?.forEach(vote => {
            if (voteCounts.has(vote)) {
                voteCounts.set(vote, voteCounts.get(vote) + 1);
            }
        });
        
        // Find winner
        const winner = Array.from(voteCounts.entries())
            .sort((a, b) => b[1] - a[1])[0];
        
        const winnerChar = this.activeCharacters.get(winner[0]);
        
        // Announce results
        this.broadcastMessage(`🏆 DEBATE CONCLUDED! Topic: "${debate.topic}"`);
        this.broadcastMessage(`Winner: ${winnerChar.name} with ${winner[1]} votes!`);
        
        // Winner gets final word
        this.queueCharacterResponse(winner[0], 'victory', {
            topic: debate.topic,
            votes: winner[1]
        });
        
        // Clean up
        this.activeDebates.delete(debateId);
        this.debateVotes.delete(debateId);
    }
    
    handleViewerCommand(channel, tags, message) {
        const parts = message.split(' ');
        const command = parts[0].toLowerCase();
        const args = parts.slice(1);
        
        const cmd = this.viewerCommands.get(command);
        if (!cmd) return;
        
        // Check cooldown
        const cooldownKey = `${tags.username}-${command}`;
        const lastUsed = this.viewerCooldowns.get(cooldownKey) || 0;
        
        if (Date.now() - lastUsed < cmd.cooldown) {
            const remaining = Math.ceil((cmd.cooldown - (Date.now() - lastUsed)) / 1000);
            this.whisper(tags.username, `Command on cooldown. ${remaining}s remaining.`);
            return;
        }
        
        // Execute command
        cmd.handler(channel, tags, args);
        
        // Set cooldown
        this.viewerCooldowns.set(cooldownKey, Date.now());
    }
    
    handleAskCommand(channel, tags, args) {
        if (args.length < 2) {
            this.whisper(tags.username, 'Usage: !ask [character] [question]');
            return;
        }
        
        const characterName = args[0].toLowerCase();
        const question = args.slice(1).join(' ');
        
        if (!this.activeCharacters.has(characterName)) {
            this.whisper(tags.username, `Unknown character. Try: ${Array.from(this.activeCharacters.keys()).join(', ')}`);
            return;
        }
        
        this.queueCharacterResponse(characterName, 'viewer-question', {
            user: tags.username,
            question: question
        });
    }
    
    handleDebateCommand(channel, tags, args) {
        if (args.length === 0) {
            this.whisper(tags.username, 'Usage: !debate [topic]');
            return;
        }
        
        const topic = args.join(' ');
        
        // Check if debate already active
        const activeDebate = Array.from(this.activeDebates.values())
            .find(d => Date.now() - d.startTime < 300000); // 5 minutes
        
        if (activeDebate) {
            this.whisper(tags.username, 'A debate is already in progress!');
            return;
        }
        
        this.broadcastMessage(`💬 ${tags.username} started a debate!`);
        this.startCharacterDebate(topic);
    }
    
    handleVoteCommand(channel, tags, args) {
        if (args.length === 0) {
            this.whisper(tags.username, 'Usage: !vote [character]');
            return;
        }
        
        const character = args[0].toLowerCase();
        
        // Find active debate
        const activeDebate = Array.from(this.activeDebates.entries())
            .find(([id, d]) => Date.now() - d.startTime < 300000);
        
        if (!activeDebate) {
            this.whisper(tags.username, 'No active debate to vote in!');
            return;
        }
        
        const [debateId, debate] = activeDebate;
        
        // Check if character is in debate
        if (!debate.participants.includes(character)) {
            this.whisper(tags.username, `Vote for: ${debate.participants.join(', ')}`);
            return;
        }
        
        // Record vote
        if (!this.debateVotes.has(debateId)) {
            this.debateVotes.set(debateId, new Map());
        }
        
        const votes = this.debateVotes.get(debateId);
        votes.set(tags.username, character);
        
        const char = this.activeCharacters.get(character);
        this.whisper(tags.username, `Voted for ${char.name}!`);
    }
    
    handleCharactersCommand(channel, tags, args) {
        const characterList = Array.from(this.activeCharacters.entries())
            .map(([name, char]) => `${name}: ${char.role}`)
            .join(' | ');
        
        this.broadcastMessage(`🎭 Active Characters: ${characterList}`);
    }
    
    handleExplainCommand(channel, tags, args) {
        const character = args[0]?.toLowerCase() || 'alice'; // Default to Alice
        
        if (!this.activeCharacters.has(character)) {
            this.whisper(tags.username, `Unknown character. Try: ${Array.from(this.activeCharacters.keys()).join(', ')}`);
            return;
        }
        
        this.queueCharacterResponse(character, 'explain-code', {
            user: tags.username,
            context: 'current-stream'
        });
    }
    
    queueCharacterResponse(character, type, data) {
        const queue = this.characterQueues.get(character);
        if (!queue) return;
        
        queue.push({
            type: type,
            data: data,
            timestamp: Date.now()
        });
    }
    
    startResponseQueues() {
        // Process queued responses for each character
        this.activeCharacters.forEach((char, name) => {
            setInterval(() => {
                const queue = this.characterQueues.get(name);
                if (!queue || queue.length === 0) return;
                
                const response = queue.shift();
                this.processCharacterResponse(name, response);
            }, this.config.responseDelay);
        });
    }
    
    processCharacterResponse(character, response) {
        const char = this.activeCharacters.get(character);
        const persona = char.twitchPersona;
        
        let message = '';
        
        switch (response.type) {
            case 'commit':
                message = `${persona.emotes[0]} ${response.data.message}`;
                break;
                
            case 'mention':
                message = `@${response.data.user} ${persona.viewerResponses.greeting[0]}`;
                break;
                
            case 'viewer-question':
                message = `@${response.data.user} ${persona.viewerResponses.question[0]} ${response.data.question}`;
                break;
                
            case 'debate':
                message = `${persona.emotes[0]} ${response.data.argument}`;
                break;
                
            case 'victory':
                message = `${persona.emotes[0]} Victory! ${char.catchphrase}`;
                break;
                
            case 'disagreement':
                message = `${persona.emotes[1]} ${response.data.message}`;
                break;
                
            case 'explain-code':
                message = `@${response.data.user} ${this.generateCodeExplanation(character)}`;
                break;
                
            default:
                message = `${persona.emotes[0]} ${char.catchphrase}`;
        }
        
        // Send as character
        this.sendAsCharacter(character, message);
    }
    
    generateCodeExplanation(character) {
        const explanations = {
            ralph: "This code needs to be BASHED INTO SHAPE! Too much complexity!",
            alice: "I see 5 interconnected patterns here, each serving a specific purpose...",
            bob: "Let me break down the architecture: First, we have the foundation layer...",
            charlie: "Multiple security vulnerabilities detected! This needs immediate attention!",
            diana: "The components are orchestrated beautifully, each playing its part...",
            eve: "This pattern originates from the Gang of Four design patterns book...",
            frank: "When we transcend the syntax, we see the code's true purpose...",
            cal: "Through collaborative analysis, this code reveals interesting reasoning patterns..."
        };
        
        return explanations[character] || "Let me analyze this code...";
    }
    
    sendAsCharacter(character, message) {
        const char = this.activeCharacters.get(character);
        const client = this.characterClients.get(character);
        
        if (!client) return;
        
        // Add character prefix for identification
        const formattedMessage = `[${char.name}] ${message}`;
        
        client.say(this.config.channel, formattedMessage)
            .catch(error => console.error(`Error sending message as ${character}:`, error));
    }
    
    broadcastMessage(message) {
        // Send message from first available character client
        const client = Array.from(this.characterClients.values())[0];
        if (client) {
            client.say(this.config.channel, message)
                .catch(error => console.error('Error broadcasting:', error));
        }
    }
    
    whisper(username, message) {
        // Send private message to user
        const client = Array.from(this.characterClients.values())[0];
        if (client) {
            client.whisper(username, message)
                .catch(() => {
                    // Whispers might fail, send as regular message
                    client.say(this.config.channel, `@${username} ${message}`);
                });
        }
    }
    
    reactToEntitySpawn(entity) {
        // Characters react to visual entities being spawned
        const reactions = [];
        
        if (entity.type === 'physics') {
            reactions.push({ character: 'ralph', message: "SMASH that entity into place!" });
        }
        
        if (entity.hasWireframe) {
            reactions.push({ character: 'alice', message: "Beautiful wireframe patterns!" });
        }
        
        if (entity.commissionedArt) {
            reactions.push({ character: 'bob', message: "Excellent commissioned artwork!" });
        }
        
        reactions.forEach(r => {
            this.queueCharacterResponse(r.character, 'entity-reaction', r);
        });
    }
    
    reactToForumPost(post) {
        // Characters might comment on forum posts
        if (post.controversial) {
            this.startCharacterDebate(post.title, post.suggestedDebaters);
        }
    }
    
    startControversyDebate(controversy) {
        console.log('🔥 Controversy detected! Starting heated debate...');
        
        // Select most opinionated characters
        const debaters = ['ralph', 'charlie', 'frank']; // Most likely to argue
        
        this.startCharacterDebate(controversy.topic, debaters);
    }
    
    // API endpoints for integration
    async createAPIRoutes(app) {
        // Trigger character response
        app.post('/api/twitch/character-response', (req, res) => {
            const { character, type, data } = req.body;
            
            if (!this.activeCharacters.has(character)) {
                return res.status(400).json({ error: 'Unknown character' });
            }
            
            this.queueCharacterResponse(character, type, data);
            res.json({ success: true, queued: true });
        });
        
        // Start debate
        app.post('/api/twitch/start-debate', (req, res) => {
            const { topic, participants } = req.body;
            
            this.startCharacterDebate(topic, participants);
            res.json({ success: true });
        });
        
        // Get character status
        app.get('/api/twitch/characters/status', (req, res) => {
            const status = {};
            
            this.activeCharacters.forEach((char, name) => {
                const queue = this.characterQueues.get(name);
                status[name] = {
                    name: char.name,
                    role: char.role,
                    queueLength: queue?.length || 0,
                    connected: this.characterClients.has(name)
                };
            });
            
            res.json(status);
        });
        
        // Get active debates
        app.get('/api/twitch/debates/active', (req, res) => {
            const debates = Array.from(this.activeDebates.values()).map(d => ({
                id: d.id,
                topic: d.topic,
                participants: d.participants,
                rounds: d.rounds.length,
                duration: Date.now() - d.startTime
            }));
            
            res.json(debates);
        });
        
        console.log('🛣️ Twitch character API routes created');
    }
    
    // Cleanup
    async shutdown() {
        console.log('🔌 Shutting down Twitch Character Agents...');
        
        // Disconnect all clients
        for (const [name, client] of this.characterClients) {
            await client.disconnect();
        }
        
        // Close event subscriptions
        this.eventSubscriptions.forEach(sub => sub.close());
        
        console.log('👋 Twitch Character Agents shutdown complete');
    }
}

// Export for use as module
module.exports = TwitchCharacterAgents;

// CLI interface
if (require.main === module) {
    console.log(`
🎮🤖 TWITCH CHARACTER AGENTS 🤖🎮

Bringing AI characters to life in Twitch chat!

Usage:
  node TWITCH-CHARACTER-AGENTS.js [options]

Options:
  --channel <name>      Twitch channel to join
  --username <name>     Twitch username
  --oauth <token>       Twitch OAuth token
  --stream-board <url>  Stream Board URL
  --git-board <url>     Git Board URL

Environment Variables:
  TWITCH_CHANNEL       Default channel to join
  TWITCH_USERNAME      Bot username
  TWITCH_OAUTH         Bot OAuth token (oauth:...)

Features:
  • 8 unique AI characters with distinct personalities
  • Real-time reactions to commits and code changes
  • Character debates on technical topics
  • Viewer interaction commands
  • Integration with development stream
  • Automated code reviews and commentary
    `);
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    const options = {};
    
    for (let i = 0; i < args.length; i += 2) {
        const key = args[i].replace('--', '');
        const value = args[i + 1];
        options[key] = value;
    }
    
    // Validate required config
    if (!options.channel && !process.env.TWITCH_CHANNEL) {
        console.error('❌ Error: Twitch channel required (--channel or TWITCH_CHANNEL env)');
        process.exit(1);
    }
    
    if (!options.oauth && !process.env.TWITCH_OAUTH) {
        console.error('❌ Error: Twitch OAuth token required (--oauth or TWITCH_OAUTH env)');
        console.log('\nGet your OAuth token at: https://twitchapps.com/tmi/');
        process.exit(1);
    }
    
    // Create and start agents
    const agents = new TwitchCharacterAgents(options);
    
    // Handle shutdown
    process.on('SIGINT', async () => {
        await agents.shutdown();
        process.exit(0);
    });
    
    console.log('\n🎮 Twitch Character Agents are live!');
    console.log('Characters will start responding to development events...\n');
}