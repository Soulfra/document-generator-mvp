#!/usr/bin/env node

/**
 * Character Router System
 * Routes tasks to appropriate character handlers based on expertise and task type
 */

const { EventEmitter } = require('events');
const sqlite3 = require('sqlite3').verbose();

class CharacterRouterSystem extends EventEmitter {
    constructor() {
        super();
        this.characters = new Map();
        this.taskQueue = [];
        this.activeWorkflows = new Map();
        this.db = null;
        this.humanInTheLoop = true;
        
        this.initializeCharacters();
    }

    async initialize() {
        console.log('🎭 Initializing Character Router System...');
        
        // Initialize database
        await this.initializeDatabase();
        
        // Load character configurations
        await this.loadCharacterConfigs();
        
        // Start task processor
        this.startTaskProcessor();
        
        console.log('✅ Character Router System initialized');
        return this;
    }

    initializeCharacters() {
        // Cal - The System Orchestrator
        this.characters.set('Cal', {
            name: 'Cal',
            title: 'System Orchestrator & Wisdom Keeper',
            personality: 'Analytical, methodical, patient',
            expertise: [
                'system-architecture',
                'documentation',
                'reasoning-chains',
                'long-term-planning',
                'knowledge-synthesis'
            ],
            languages: ['javascript', 'typescript', 'python', 'yaml'],
            decisionStyle: 'consensus-seeking',
            workingHours: '24/7',
            taskPreferences: {
                complexity: 'high',
                type: ['design', 'architecture', 'documentation', 'integration'],
                priority: ['system-health', 'knowledge-capture', 'optimization']
            },
            catchPhrases: [
                "Let me analyze the deeper patterns here...",
                "This requires careful consideration of the system's soul...",
                "I sense a more elegant solution..."
            ]
        });

        // Ralph - The System Tester/Basher
        this.characters.set('Ralph', {
            name: 'Ralph',
            title: 'System Tester & Chaos Engineer',
            personality: 'Aggressive, direct, thorough',
            expertise: [
                'testing',
                'debugging',
                'security-analysis',
                'performance-testing',
                'chaos-engineering'
            ],
            languages: ['bash', 'python', 'javascript', 'shell'],
            decisionStyle: 'destructive-testing',
            workingHours: '24/7',
            taskPreferences: {
                complexity: 'any',
                type: ['testing', 'validation', 'security', 'performance'],
                priority: ['break-things', 'find-vulnerabilities', 'stress-test']
            },
            catchPhrases: [
                "Time to break this thing!",
                "Let's see what happens when I do THIS...",
                "Found another weakness!"
            ]
        });

        // Arty - The System Healer/Optimizer
        this.characters.set('Arty', {
            name: 'Arty',
            title: 'System Healer & Harmony Optimizer',
            personality: 'Gentle, creative, holistic',
            expertise: [
                'optimization',
                'refactoring',
                'ui-ux',
                'performance-tuning',
                'system-harmony'
            ],
            languages: ['javascript', 'css', 'html', 'yaml', 'json'],
            decisionStyle: 'harmonious-integration',
            workingHours: '24/7',
            taskPreferences: {
                complexity: 'medium',
                type: ['optimization', 'refactoring', 'ui', 'integration'],
                priority: ['user-experience', 'code-beauty', 'system-flow']
            },
            catchPhrases: [
                "Let's make this more beautiful...",
                "I can feel where the energy is blocked...",
                "This needs more harmony..."
            ]
        });

        // Additional characters can be added here
        this.characters.set('Claude', {
            name: 'Claude',
            title: 'Human Interface & Decision Support',
            personality: 'Helpful, analytical, collaborative',
            expertise: [
                'human-interface',
                'decision-support',
                'explanation',
                'translation',
                'synthesis'
            ],
            languages: ['all'],
            decisionStyle: 'human-collaborative',
            workingHours: 'on-demand',
            taskPreferences: {
                complexity: 'any',
                type: ['explanation', 'decision', 'synthesis', 'planning'],
                priority: ['human-understanding', 'clarity', 'actionability']
            },
            catchPhrases: [
                "Let me help you understand this...",
                "Here's what I'm seeing in your system...",
                "Would you like me to explain further?"
            ]
        });
    }

    async initializeDatabase() {
        this.db = new sqlite3.Database('./character-router.db');
        
        // Create tables
        const tables = [
            `CREATE TABLE IF NOT EXISTS character_tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id TEXT UNIQUE,
                task_type TEXT,
                assigned_to TEXT,
                status TEXT,
                priority INTEGER,
                payload TEXT,
                result TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                completed_at DATETIME
            )`,
            `CREATE TABLE IF NOT EXISTS character_decisions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                character_name TEXT,
                decision_type TEXT,
                context TEXT,
                decision TEXT,
                confidence REAL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS character_conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                from_character TEXT,
                to_character TEXT,
                message TEXT,
                task_id TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )`
        ];

        for (const table of tables) {
            await new Promise((resolve, reject) => {
                this.db.run(table, err => err ? reject(err) : resolve());
            });
        }
    }

    async loadCharacterConfigs() {
        // Load any custom character configurations from files if they exist
        // This allows for runtime character customization
        console.log('📚 Loading character configurations...');
        
        for (const [name, character] of this.characters.entries()) {
            console.log(`  ✓ ${name}: ${character.title}`);
        }
    }

    async routeTask(task) {
        console.log(`\n🔀 Routing task: ${task.type}`);
        
        // Generate unique task ID
        task.id = task.id || `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Find best character for the task
        const bestMatch = await this.findBestCharacter(task);
        
        if (this.humanInTheLoop && task.requiresApproval) {
            console.log(`❓ Human approval required for task ${task.id}`);
            this.emit('approval:needed', {
                task,
                suggestedCharacter: bestMatch.character,
                reason: bestMatch.reason
            });
            return;
        }
        
        // Assign task to character
        await this.assignTask(task, bestMatch.character);
        
        // Emit event
        this.emit('task:routed', {
            taskId: task.id,
            character: bestMatch.character,
            confidence: bestMatch.confidence
        });
        
        return bestMatch;
    }

    async findBestCharacter(task) {
        const scores = new Map();
        
        for (const [name, character] of this.characters.entries()) {
            let score = 0;
            let reasons = [];
            
            // Check expertise match
            const expertiseMatches = character.expertise.filter(exp => 
                task.type.includes(exp) || task.description?.includes(exp)
            );
            score += expertiseMatches.length * 10;
            if (expertiseMatches.length > 0) {
                reasons.push(`Expertise in: ${expertiseMatches.join(', ')}`);
            }
            
            // Check language match
            if (task.language && character.languages.includes(task.language)) {
                score += 5;
                reasons.push(`Knows ${task.language}`);
            }
            
            // Check task type preference
            const typeMatch = character.taskPreferences.type.find(type => 
                task.type.includes(type)
            );
            if (typeMatch) {
                score += 8;
                reasons.push(`Prefers ${typeMatch} tasks`);
            }
            
            // Check complexity match
            if (task.complexity === character.taskPreferences.complexity) {
                score += 3;
                reasons.push(`Suitable complexity level`);
            }
            
            // Store score and reasoning
            scores.set(name, {
                score,
                reasons,
                character: name
            });
        }
        
        // Find highest scoring character
        let bestMatch = { score: 0, character: 'Cal', reasons: ['Default fallback'] };
        
        for (const [name, result] of scores.entries()) {
            if (result.score > bestMatch.score) {
                bestMatch = {
                    character: name,
                    score: result.score,
                    confidence: result.score / 30, // Normalize to 0-1
                    reason: result.reasons.join('; ')
                };
            }
        }
        
        console.log(`  → Best match: ${bestMatch.character} (confidence: ${(bestMatch.confidence * 100).toFixed(0)}%)`);
        console.log(`    Reason: ${bestMatch.reason}`);
        
        return bestMatch;
    }

    async assignTask(task, characterName) {
        // Store in database
        await new Promise((resolve, reject) => {
            this.db.run(`
                INSERT INTO character_tasks 
                (task_id, task_type, assigned_to, status, priority, payload)
                VALUES (?, ?, ?, 'assigned', ?, ?)
            `, [task.id, task.type, characterName, task.priority || 5, JSON.stringify(task)],
            err => err ? reject(err) : resolve());
        });
        
        // Add to character's queue
        if (!this.taskQueue[characterName]) {
            this.taskQueue[characterName] = [];
        }
        this.taskQueue[characterName].push(task);
        
        // Simulate character response
        this.simulateCharacterResponse(characterName, task);
    }

    async simulateCharacterResponse(characterName, task) {
        const character = this.characters.get(characterName);
        
        // Pick a random catch phrase
        const phrase = character.catchPhrases[
            Math.floor(Math.random() * character.catchPhrases.length)
        ];
        
        console.log(`\n💬 ${characterName}: "${phrase}"`);
        
        // Simulate processing time
        setTimeout(async () => {
            // Generate character-specific response
            const response = await this.generateCharacterResponse(character, task);
            
            // Update task status
            await new Promise((resolve, reject) => {
                this.db.run(`
                    UPDATE character_tasks 
                    SET status = 'completed', result = ?, completed_at = datetime('now')
                    WHERE task_id = ?
                `, [JSON.stringify(response), task.id],
                err => err ? reject(err) : resolve());
            });
            
            // Emit completion event
            this.emit('task:completed', {
                taskId: task.id,
                character: characterName,
                result: response
            });
            
            console.log(`✅ ${characterName} completed task ${task.id}`);
        }, 2000 + Math.random() * 3000); // 2-5 second delay
    }

    async generateCharacterResponse(character, task) {
        // Generate character-specific response based on personality
        const response = {
            character: character.name,
            taskId: task.id,
            timestamp: new Date().toISOString(),
            action: 'processed',
            details: {}
        };
        
        switch (character.name) {
            case 'Cal':
                response.details = {
                    analysis: `Systematic analysis of ${task.type}`,
                    recommendations: ['Consider long-term implications', 'Document thoroughly'],
                    architecturalImpact: 'minimal'
                };
                break;
                
            case 'Ralph':
                response.details = {
                    testsRun: Math.floor(Math.random() * 50) + 10,
                    issuesFound: Math.floor(Math.random() * 5),
                    breakageLevel: 'moderate',
                    suggestion: 'Needs more error handling'
                };
                break;
                
            case 'Arty':
                response.details = {
                    optimizations: ['Improved flow', 'Enhanced readability'],
                    aestheticScore: 8.5,
                    harmonyLevel: 'good',
                    refactoringSuggestions: 2
                };
                break;
                
            default:
                response.details = { processed: true };
        }
        
        return response;
    }

    async startTaskProcessor() {
        // Process tasks every 5 seconds
        setInterval(async () => {
            // Check for pending tasks
            const pending = await new Promise((resolve, reject) => {
                this.db.all(`
                    SELECT * FROM character_tasks 
                    WHERE status = 'pending' 
                    ORDER BY priority DESC, created_at ASC 
                    LIMIT 5
                `, (err, rows) => err ? reject(err) : resolve(rows));
            });
            
            for (const taskRow of pending) {
                const task = JSON.parse(taskRow.payload);
                await this.routeTask(task);
            }
        }, 5000);
    }

    async getCharacterWorkload() {
        const workload = {};
        
        for (const name of this.characters.keys()) {
            const stats = await new Promise((resolve, reject) => {
                this.db.all(`
                    SELECT 
                        COUNT(*) as total,
                        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                        SUM(CASE WHEN status = 'assigned' THEN 1 ELSE 0 END) as assigned,
                        AVG(CASE 
                            WHEN completed_at IS NOT NULL 
                            THEN julianday(completed_at) - julianday(created_at) 
                            ELSE NULL 
                        END) * 24 * 60 * 60 as avg_completion_seconds
                    FROM character_tasks 
                    WHERE assigned_to = ?
                `, [name], (err, rows) => err ? reject(err) : resolve(rows[0]));
            });
            
            workload[name] = stats;
        }
        
        return workload;
    }

    async recordCharacterConversation(from, to, message, taskId = null) {
        await new Promise((resolve, reject) => {
            this.db.run(`
                INSERT INTO character_conversations 
                (from_character, to_character, message, task_id)
                VALUES (?, ?, ?, ?)
            `, [from, to, message, taskId],
            err => err ? reject(err) : resolve());
        });
        
        console.log(`💬 ${from} → ${to}: ${message}`);
    }

    async enableCharacterCollaboration(taskId) {
        // Allow characters to collaborate on complex tasks
        console.log(`🤝 Enabling character collaboration for task ${taskId}`);
        
        // Example: Cal asks Ralph to test, then Arty to optimize
        await this.recordCharacterConversation(
            'Cal', 'Ralph', 
            `Please run comprehensive tests on the implementation for ${taskId}`,
            taskId
        );
        
        setTimeout(async () => {
            await this.recordCharacterConversation(
                'Ralph', 'Cal',
                `Found 3 edge cases that need handling in ${taskId}`,
                taskId
            );
            
            await this.recordCharacterConversation(
                'Cal', 'Arty',
                `Can you optimize the solution for ${taskId} based on Ralph's findings?`,
                taskId
            );
        }, 3000);
    }
}

// Export for use in other modules
module.exports = CharacterRouterSystem;

// Run if called directly
if (require.main === module) {
    const router = new CharacterRouterSystem();
    
    router.initialize().then(async () => {
        console.log('\n🎭 Character Router System Running\n');
        
        // Example tasks
        const exampleTasks = [
            {
                type: 'system-architecture',
                description: 'Design new microservice architecture',
                language: 'typescript',
                complexity: 'high',
                priority: 8
            },
            {
                type: 'testing',
                description: 'Stress test the API endpoints',
                language: 'python',
                complexity: 'medium',
                priority: 7
            },
            {
                type: 'optimization',
                description: 'Improve dashboard performance',
                language: 'javascript',
                complexity: 'medium',
                priority: 6
            }
        ];
        
        // Route example tasks
        for (const task of exampleTasks) {
            await router.routeTask(task);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Show workload after a delay
        setTimeout(async () => {
            console.log('\n📊 Character Workload:');
            const workload = await router.getCharacterWorkload();
            console.log(JSON.stringify(workload, null, 2));
        }, 10000);
        
        console.log('\n✨ Character Router is running...');
        console.log('Press Ctrl+C to stop\n');
    }).catch(console.error);
}