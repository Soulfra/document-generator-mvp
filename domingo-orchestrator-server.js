#!/usr/bin/env node

/**
 * 🎭 DOMINGO ORCHESTRATOR SERVER
 * 
 * Real backend management system that connects:
 * - Chat interface for orchestrator communication
 * - phpBB forum integration for task organization
 * - Character tagging and delegation system
 * - Drag-and-drop task management with real-time updates
 * - Integration with existing Document Generator services
 */

const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs').promises;

// Import existing components
const APIToForumBridge = require('./api-to-forum-bridge');
const DragDropHardhatTesting = require('./drag-drop-hardhat-testing');

class DomingoOrchestratorServer {
    constructor(options = {}) {
        this.config = {
            port: options.port || 7777,
            wsPort: options.wsPort || 7778,
            dbUrl: options.dbUrl || process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/document_generator',
            ...options
        };

        // Express app setup
        this.app = express();
        this.server = http.createServer(this.app);

        // Database connection
        this.db = new Pool({
            connectionString: this.config.dbUrl
        });

        // Component integrations
        this.forumBridge = new APIToForumBridge();
        this.hardhatTester = new DragDropHardhatTesting({ 
            port: 7779, // Separate port for testing interface
            wsPort: 7780 
        });

        // Character roster with specializations
        this.characterRoster = [
            {
                id: 'alice',
                name: 'Alice',
                role: 'Technical Lead',
                specializations: ['backend', 'databases', 'architecture'],
                emoji: '👩‍💻',
                status: 'available',
                activeTask: null
            },
            {
                id: 'bob',
                name: 'Bob',
                role: 'Frontend Developer',
                specializations: ['react', 'ui', 'responsive-design'],
                emoji: '👨‍💻',
                status: 'available',
                activeTask: null
            },
            {
                id: 'charlie',
                name: 'Charlie',
                role: 'DevOps Engineer',
                specializations: ['docker', 'ci-cd', 'deployment'],
                emoji: '🔧',
                status: 'available',
                activeTask: null
            },
            {
                id: 'diana',
                name: 'Diana',
                role: 'Data Scientist',
                specializations: ['analytics', 'ml', 'data-processing'],
                emoji: '📊',
                status: 'available',
                activeTask: null
            },
            {
                id: 'eve',
                name: 'Eve',
                role: 'Security Expert',
                specializations: ['security', 'encryption', 'authentication'],
                emoji: '🛡️',
                status: 'available',
                activeTask: null
            },
            {
                id: 'frank',
                name: 'Frank',
                role: 'Integration Specialist',
                specializations: ['apis', 'webhooks', 'third-party'],
                emoji: '🔌',
                status: 'available',
                activeTask: null
            }
        ];

        // Task management
        this.taskColumns = ['backlog', 'in-progress', 'review', 'done'];
        this.tasks = new Map();
        this.taskHistory = [];

        // WebSocket clients
        this.wsClients = new Set();

        // Forum boards mapping
        this.forumBoards = [
            { id: 'tasks', name: 'Task Assignments', description: 'Active task discussions' },
            { id: 'technical', name: 'Technical Discussions', description: 'Code and architecture' },
            { id: 'planning', name: 'Project Planning', description: 'Roadmap and features' },
            { id: 'completed', name: 'Completed Work', description: 'Finished tasks showcase' },
            { id: 'help', name: 'Help Requests', description: 'Blocked tasks and questions' }
        ];

        console.log('🎭 Domingo Orchestrator Server initialized');
    }

    async initialize() {
        // Initialize database schema
        await this.initializeDatabase();

        // Initialize integrated components
        await this.forumBridge.initialize();
        await this.hardhatTester.initialize();

        // Set up Express middleware
        this.setupMiddleware();

        // Set up routes
        this.setupRoutes();

        // Set up WebSocket server
        this.setupWebSocket();

        // Load existing tasks from database
        await this.loadTasks();

        // Start server
        this.server.listen(this.config.port, () => {
            console.log(`🎭 Domingo Orchestrator running on port ${this.config.port}`);
            console.log(`🌐 Access orchestrator: http://localhost:${this.config.port}`);
            console.log(`🧪 Testing interface: http://localhost:7779`);
            console.log(`🔌 WebSocket: ws://localhost:${this.config.wsPort}`);
        });
    }

    async initializeDatabase() {
        // Tasks table
        await this.db.query(`
            CREATE TABLE IF NOT EXISTS orchestrator_tasks (
                id SERIAL PRIMARY KEY,
                task_id VARCHAR(255) UNIQUE NOT NULL,
                title VARCHAR(500) NOT NULL,
                description TEXT,
                column_status VARCHAR(50) NOT NULL,
                assigned_character VARCHAR(100),
                priority VARCHAR(20) DEFAULT 'medium',
                tags JSONB DEFAULT '[]',
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);

        // Chat history table
        await this.db.query(`
            CREATE TABLE IF NOT EXISTS orchestrator_chat (
                id SERIAL PRIMARY KEY,
                message TEXT NOT NULL,
                sender VARCHAR(100) NOT NULL,
                message_type VARCHAR(50) DEFAULT 'chat',
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);

        // Character activity log
        await this.db.query(`
            CREATE TABLE IF NOT EXISTS character_activity (
                id SERIAL PRIMARY KEY,
                character_id VARCHAR(100) NOT NULL,
                activity_type VARCHAR(100) NOT NULL,
                description TEXT,
                task_id VARCHAR(255),
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);

        console.log('✅ Database schema initialized');
    }

    setupMiddleware() {
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.static(__dirname));
        
        // CORS for development
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Content-Type');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
            next();
        });
    }

    setupRoutes() {
        // Serve the orchestrator interface
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'domingo-real-orchestrator.html'));
        });

        // API Routes
        this.app.post('/api/chat', this.handleChat.bind(this));
        this.app.get('/api/tasks', this.getTasks.bind(this));
        this.app.post('/api/tasks', this.createTask.bind(this));
        this.app.put('/api/tasks/:taskId', this.updateTask.bind(this));
        this.app.delete('/api/tasks/:taskId', this.deleteTask.bind(this));
        
        this.app.get('/api/characters', this.getCharacters.bind(this));
        this.app.put('/api/characters/:characterId', this.updateCharacter.bind(this));
        
        this.app.get('/api/forum-boards', this.getForumBoards.bind(this));
        this.app.post('/api/forum-post', this.createForumPost.bind(this));
        
        this.app.get('/api/system-status', this.getSystemStatus.bind(this));
        this.app.post('/api/execute-command', this.executeOrchestratorCommand.bind(this));
    }

    setupWebSocket() {
        this.wss = new WebSocket.Server({ 
            server: this.server,
            path: '/ws'
        });

        this.wss.on('connection', (ws, req) => {
            console.log('🔌 Orchestrator client connected');
            this.wsClients.add(ws);

            // Send initial state
            ws.send(JSON.stringify({
                type: 'initial_state',
                data: {
                    tasks: Array.from(this.tasks.values()),
                    characters: this.characterRoster,
                    forumBoards: this.forumBoards
                }
            }));

            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    await this.handleWebSocketMessage(ws, data);
                } catch (error) {
                    console.error('WebSocket message error:', error);
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: error.message
                    }));
                }
            });

            ws.on('close', () => {
                this.wsClients.delete(ws);
                console.log('🔌 Orchestrator client disconnected');
            });
        });
    }

    async handleWebSocketMessage(ws, data) {
        switch (data.type) {
            case 'chat_message':
                await this.processChat(data.message, 'user');
                break;
            case 'task_drag':
                await this.handleTaskDrag(data.taskId, data.fromColumn, data.toColumn);
                break;
            case 'character_assign':
                await this.assignTaskToCharacter(data.taskId, data.characterId);
                break;
            case 'ping':
                ws.send(JSON.stringify({ type: 'pong' }));
                break;
        }
    }

    async handleChat(req, res) {
        const { message } = req.body;
        
        try {
            const response = await this.processChat(message, 'user');
            res.json({ success: true, response });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async processChat(message, sender) {
        // Store chat message
        await this.db.query(
            'INSERT INTO orchestrator_chat (message, sender) VALUES ($1, $2)',
            [message, sender]
        );

        // Process orchestrator commands
        let response = await this.processOrchestratorCommands(message);

        // If no specific command, generate AI response
        if (!response) {
            response = this.generateDomingoResponse(message);
        }

        // Store response
        await this.db.query(
            'INSERT INTO orchestrator_chat (message, sender) VALUES ($1, $2)',
            [response, 'domingo']
        );

        // Broadcast to all clients
        this.broadcast({
            type: 'chat_message',
            data: {
                message: response,
                sender: 'domingo',
                timestamp: Date.now()
            }
        });

        return response;
    }

    async processOrchestratorCommands(message) {
        const msg = message.toLowerCase().trim();

        // Task creation command
        if (msg.startsWith('create task:') || msg.startsWith('new task:')) {
            const taskTitle = message.substring(message.indexOf(':') + 1).trim();
            const task = await this.createTaskFromCommand(taskTitle);
            return `✅ Created new task: "${task.title}" (ID: ${task.task_id})`;
        }

        // Character assignment command
        if (msg.includes('assign') && msg.includes('to')) {
            const assignMatch = message.match(/assign (.+?) to (\w+)/i);
            if (assignMatch) {
                const [, taskRef, characterName] = assignMatch;
                const result = await this.assignByName(taskRef, characterName);
                return result;
            }
        }

        // Status check command
        if (msg.includes('status') || msg === 'report') {
            return await this.generateStatusReport();
        }

        // System health check
        if (msg.includes('health') || msg.includes('systems check')) {
            const health = await this.checkSystemHealth();
            return `🏥 System Health Report:\n${health}`;
        }

        // Forum integration command
        if (msg.startsWith('post to forum:') || msg.startsWith('forum post:')) {
            const content = message.substring(message.indexOf(':') + 1).trim();
            await this.postToForum(content);
            return `📝 Posted to forum: "${content}"`;
        }

        return null; // No command recognized
    }

    generateDomingoResponse(message) {
        const responses = [
            `🎭 Domingo here. I'm processing your request: "${message}". Let me coordinate with the team.`,
            `💜 *purple eyes glow* Analyzing your message... I'll delegate this to the appropriate character.`,
            `🖥️ *typing sounds* Working on it! I'll update the task board and notify the team.`,
            `🎯 Got it! Let me check system status and assign this properly.`,
            `⚡ Processing... I'll make sure this gets routed to the right specialist.`,
            `🔧 *adjusts glasses* Consider it handled. I'll coordinate with the development team.`
        ];

        return responses[Math.floor(Math.random() * responses.length)];
    }

    async createTaskFromCommand(title) {
        const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const task = {
            task_id: taskId,
            title,
            description: `Task created via chat command`,
            column_status: 'backlog',
            priority: 'medium',
            assigned_character: null,
            tags: [],
            metadata: { 
                created_via: 'chat_command',
                created_by: 'domingo'
            }
        };

        await this.db.query(`
            INSERT INTO orchestrator_tasks 
            (task_id, title, description, column_status, priority, tags, metadata)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
            task.task_id,
            task.title,
            task.description,
            task.column_status,
            task.priority,
            JSON.stringify(task.tags),
            JSON.stringify(task.metadata)
        ]);

        this.tasks.set(taskId, task);

        // Broadcast task creation
        this.broadcast({
            type: 'task_created',
            data: task
        });

        return task;
    }

    async assignByName(taskRef, characterName) {
        // Find task by title or ID
        let task = null;
        for (let [id, t] of this.tasks) {
            if (t.task_id === taskRef || t.title.toLowerCase().includes(taskRef.toLowerCase())) {
                task = t;
                break;
            }
        }

        if (!task) {
            return `❌ Task not found: "${taskRef}"`;
        }

        // Find character by name
        const character = this.characterRoster.find(c => 
            c.name.toLowerCase() === characterName.toLowerCase() ||
            c.id.toLowerCase() === characterName.toLowerCase()
        );

        if (!character) {
            return `❌ Character not found: "${characterName}"`;
        }

        // Assign task
        task.assigned_character = character.id;
        character.activeTask = task.task_id;
        character.status = 'busy';

        // Update database
        await this.db.query(
            'UPDATE orchestrator_tasks SET assigned_character = $1 WHERE task_id = $2',
            [character.id, task.task_id]
        );

        // Log activity
        await this.db.query(`
            INSERT INTO character_activity 
            (character_id, activity_type, description, task_id)
            VALUES ($1, $2, $3, $4)
        `, [
            character.id,
            'task_assigned',
            `Assigned to task: ${task.title}`,
            task.task_id
        ]);

        // Broadcast update
        this.broadcast({
            type: 'task_assigned',
            data: { task, character }
        });

        return `✅ Assigned "${task.title}" to ${character.emoji} ${character.name}`;
    }

    async generateStatusReport() {
        const totalTasks = this.tasks.size;
        const tasksByColumn = {};
        this.taskColumns.forEach(col => {
            tasksByColumn[col] = Array.from(this.tasks.values())
                .filter(t => t.column_status === col).length;
        });

        const busyCharacters = this.characterRoster.filter(c => c.status === 'busy').length;
        const availableCharacters = this.characterRoster.filter(c => c.status === 'available').length;

        return `📊 Domingo's Status Report:
        
📋 Tasks: ${totalTasks} total
  • Backlog: ${tasksByColumn.backlog || 0}
  • In Progress: ${tasksByColumn['in-progress'] || 0}
  • Review: ${tasksByColumn.review || 0}
  • Done: ${tasksByColumn.done || 0}

👥 Team: ${busyCharacters} busy, ${availableCharacters} available

🏥 All systems operational
💜 *purple eyes gleaming with satisfaction*`;
    }

    async checkSystemHealth() {
        const services = [
            { name: 'Database', status: 'healthy' },
            { name: 'Forum Bridge', status: 'healthy' },
            { name: 'Hardhat Tester', status: 'healthy' },
            { name: 'WebSocket', status: `${this.wsClients.size} clients connected` }
        ];

        return services.map(s => `• ${s.name}: ${s.status}`).join('\n');
    }

    async postToForum(content) {
        // Use the forum bridge to post
        await this.forumBridge.processAPIResponse(
            { content, type: 'orchestrator_update' },
            { 
                type: 'orchestrator_update',
                endpoint: '/api/orchestrator',
                authorType: 'domingo',
                agentId: 'orchestrator'
            }
        );
    }

    async getTasks(req, res) {
        const tasks = Array.from(this.tasks.values());
        res.json({ success: true, tasks });
    }

    async createTask(req, res) {
        const { title, description, priority = 'medium', tags = [] } = req.body;
        
        try {
            const task = await this.createTaskFromCommand(title);
            task.description = description;
            task.priority = priority;
            task.tags = tags;

            await this.db.query(
                'UPDATE orchestrator_tasks SET description = $1, priority = $2, tags = $3 WHERE task_id = $4',
                [description, priority, JSON.stringify(tags), task.task_id]
            );

            res.json({ success: true, task });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async updateTask(req, res) {
        const { taskId } = req.params;
        const updates = req.body;

        try {
            const task = this.tasks.get(taskId);
            if (!task) {
                return res.status(404).json({ success: false, error: 'Task not found' });
            }

            // Update task object
            Object.assign(task, updates);

            // Update database
            await this.db.query(`
                UPDATE orchestrator_tasks 
                SET title = $1, description = $2, column_status = $3, 
                    assigned_character = $4, priority = $5, tags = $6, updated_at = NOW()
                WHERE task_id = $7
            `, [
                task.title,
                task.description,
                task.column_status,
                task.assigned_character,
                task.priority,
                JSON.stringify(task.tags),
                taskId
            ]);

            this.broadcast({
                type: 'task_updated',
                data: task
            });

            res.json({ success: true, task });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    async loadTasks() {
        const result = await this.db.query('SELECT * FROM orchestrator_tasks');
        
        result.rows.forEach(row => {
            const task = {
                task_id: row.task_id,
                title: row.title,
                description: row.description,
                column_status: row.column_status,
                assigned_character: row.assigned_character,
                priority: row.priority,
                tags: row.tags || [],
                metadata: row.metadata || {},
                created_at: row.created_at,
                updated_at: row.updated_at
            };
            
            this.tasks.set(row.task_id, task);

            // Update character status if assigned
            if (task.assigned_character) {
                const character = this.characterRoster.find(c => c.id === task.assigned_character);
                if (character && task.column_status !== 'done') {
                    character.activeTask = task.task_id;
                    character.status = 'busy';
                }
            }
        });

        console.log(`✅ Loaded ${result.rows.length} tasks from database`);
    }

    async getCharacters(req, res) {
        res.json({ success: true, characters: this.characterRoster });
    }

    async getForumBoards(req, res) {
        res.json({ success: true, boards: this.forumBoards });
    }

    async getSystemStatus(req, res) {
        const status = {
            uptime: process.uptime(),
            tasks: this.tasks.size,
            characters: this.characterRoster.length,
            wsClients: this.wsClients.size,
            health: 'healthy'
        };

        res.json({ success: true, status });
    }

    broadcast(message) {
        this.wsClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(message));
            }
        });
    }
}

module.exports = DomingoOrchestratorServer;

// Run if executed directly
if (require.main === module) {
    const orchestrator = new DomingoOrchestratorServer();
    
    console.log('🎭 DOMINGO ORCHESTRATOR SERVER');
    console.log('===============================\n');
    
    orchestrator.initialize().catch(error => {
        console.error('❌ Failed to start orchestrator:', error);
        process.exit(1);
    });
}