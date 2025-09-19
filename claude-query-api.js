#!/usr/bin/env node

/**
 * CLAUDE QUERY API
 * REST endpoints for Claude to query character data with special commands
 * Supports @, #, !, ? symbol-based queries and overlay instructions
 */

const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const crypto = require('crypto');

class ClaudeQueryAPI {
    constructor() {
        this.app = express();
        this.port = 42006;
        
        // Database pool
        this.dbPool = null;
        
        // API key validation
        this.validApiKeys = new Set([
            'claude-dev-key-' + crypto.createHash('md5').update('local-dev').digest('hex').substring(0, 16),
            process.env.CLAUDE_API_KEY
        ].filter(Boolean));
        
        // Query types supported
        this.queryTypes = {
            character: 'Query character information',
            dialogue: 'Query character dialogues and conversations', 
            quest: 'Query character quests and objectives',
            overlay: 'Query overlay configurations and events',
            mention: 'Query @ mentions of characters',
            action: 'Query ! actions and commands',
            tag: 'Query # tagged content',
            query: 'Query ? help requests and questions'
        };
        
        console.log('🤖 Claude Query API initializing...');
        this.initialize();
    }
    
    async initialize() {
        try {
            // Connect to database
            await this.connectDatabase();
            
            // Setup middleware
            this.setupMiddleware();
            
            // Setup routes
            this.setupRoutes();
            
            // Start server
            this.app.listen(this.port, () => {
                console.log(`🤖 Claude Query API running on http://localhost:${this.port}`);
                console.log(`📋 Available query types: ${Object.keys(this.queryTypes).join(', ')}`);
                console.log(`🔑 API keys configured: ${this.validApiKeys.size}`);
            });
            
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            process.exit(1);
        }
    }
    
    async connectDatabase() {
        this.dbPool = await mysql.createPool({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'economic_engine',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
        
        console.log('📊 Database connected');
    }
    
    setupMiddleware() {
        // CORS
        this.app.use(cors({
            origin: ['http://localhost:3000', 'http://localhost:8080', 'http://localhost:42002'],
            credentials: true
        }));
        
        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        
        // Request logging
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} ${req.method} ${req.path} - Claude Query`);
            next();
        });
        
        // API key validation middleware
        this.app.use('/api/claude', this.validateApiKey.bind(this));
    }
    
    validateApiKey(req, res, next) {
        const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
        
        if (!apiKey) {
            return res.status(401).json({
                error: 'API key required',
                message: 'Include X-API-Key header or Authorization Bearer token'
            });
        }
        
        // Hash the provided key for comparison
        const hashedKey = crypto.createHash('md5').update(apiKey).digest('hex').substring(0, 16);
        const fullKey = 'claude-dev-key-' + hashedKey;
        
        if (!this.validApiKeys.has(apiKey) && !this.validApiKeys.has(fullKey)) {
            return res.status(403).json({
                error: 'Invalid API key',
                message: 'Provided API key is not authorized'
            });
        }
        
        req.apiKey = apiKey;
        next();
    }
    
    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'Claude Query API',
                timestamp: new Date().toISOString()
            });
        });
        
        // API documentation
        this.app.get('/api/claude/docs', (req, res) => {
            res.json({
                version: '1.0.0',
                description: 'Claude Query API for character data access',
                authentication: 'X-API-Key header required',
                endpoints: {
                    '/api/claude/query': 'POST - Execute structured queries',
                    '/api/claude/character/:id': 'GET - Get character summary',
                    '/api/claude/dialogue/:characterId': 'GET - Get character dialogues',
                    '/api/claude/quest/:characterId': 'GET - Get character quests',
                    '/api/claude/mentions/:characterName': 'GET - Get mentions of character',
                    '/api/claude/actions/:characterId': 'GET - Get character actions (!)',
                    '/api/claude/tags/:tag': 'GET - Get content with tag (#)',
                    '/api/claude/queries/:characterId': 'GET - Get character queries (?)',
                    '/api/claude/overlay/:characterId': 'GET - Get overlay configurations'
                },
                queryTypes: this.queryTypes,
                symbolSupport: {
                    '@': 'Mentions - Find references to characters',
                    '#': 'Tags - Find categorized content',
                    '!': 'Actions - Find commands and actions',
                    '?': 'Queries - Find questions and help requests'
                }
            });
        });
        
        // Main query endpoint
        this.app.post('/api/claude/query', this.handleStructuredQuery.bind(this));
        
        // Character endpoints
        this.app.get('/api/claude/character/:id', this.getCharacterSummary.bind(this));
        this.app.get('/api/claude/dialogue/:characterId', this.getCharacterDialogues.bind(this));
        this.app.get('/api/claude/quest/:characterId', this.getCharacterQuests.bind(this));
        
        // Symbol-based endpoints
        this.app.get('/api/claude/mentions/:characterName', this.getMentions.bind(this));
        this.app.get('/api/claude/actions/:characterId', this.getActions.bind(this));
        this.app.get('/api/claude/tags/:tag', this.getTaggedContent.bind(this));
        this.app.get('/api/claude/queries/:characterId', this.getQueries.bind(this));
        
        // Overlay system
        this.app.get('/api/claude/overlay/:characterId', this.getOverlayData.bind(this));
        
        // Search endpoints
        this.app.get('/api/claude/search', this.searchContent.bind(this));
        
        // Error handling
        this.app.use((error, req, res, next) => {
            console.error('Claude API Error:', error);
            
            // Log query for analytics
            this.logQuery(req, null, error.message, Date.now() - req.startTime);
            
            res.status(error.status || 500).json({
                error: error.message || 'Internal server error',
                code: error.code || 'SERVER_ERROR'
            });
        });
    }
    
    async handleStructuredQuery(req, res) {
        const startTime = Date.now();
        
        try {
            const { query, type, filters = {}, limit = 100 } = req.body;
            
            if (!query) {
                return res.status(400).json({ error: 'Query text required' });
            }
            
            let result;
            const queryLower = query.toLowerCase();
            
            // Route based on query content or type
            if (type === 'character' || queryLower.includes('character')) {
                result = await this.queryCharacters(query, filters, limit);
            } else if (type === 'dialogue' || queryLower.includes('dialogue') || queryLower.includes('said')) {
                result = await this.queryDialogues(query, filters, limit);
            } else if (type === 'quest' || queryLower.includes('quest') || queryLower.includes('!')) {
                result = await this.queryQuests(query, filters, limit);
            } else if (type === 'mention' || queryLower.includes('@')) {
                result = await this.queryMentions(query, filters, limit);
            } else if (type === 'action' || queryLower.includes('action')) {
                result = await this.queryActions(query, filters, limit);
            } else if (type === 'tag' || queryLower.includes('#')) {
                result = await this.queryTags(query, filters, limit);
            } else {
                // General search
                result = await this.generalSearch(query, filters, limit);
            }
            
            // Log successful query
            await this.logQuery(req, result.length || 0, null, Date.now() - startTime);
            
            res.json({
                query,
                type: type || 'auto-detected',
                results: result,
                count: result.length,
                executionTime: Date.now() - startTime
            });
            
        } catch (error) {
            console.error('Structured query error:', error);
            await this.logQuery(req, 0, error.message, Date.now() - startTime);
            res.status(500).json({ error: error.message });
        }
    }
    
    async queryCharacters(query, filters, limit) {
        const conditions = ['c.is_active = TRUE'];
        const params = [];
        
        // Add filters
        if (filters.lineage) {
            conditions.push('c.lineage = ?');
            params.push(filters.lineage);
        }
        
        if (filters.minQuality) {
            conditions.push('c.quality_score >= ?');
            params.push(filters.minQuality);
        }
        
        // Add search term
        if (query && query !== 'all') {
            conditions.push('(c.character_name LIKE ? OR c.lineage LIKE ?)');
            params.push(`%${query}%`, `%${query}%`);
        }
        
        params.push(limit);
        
        const [characters] = await this.dbPool.execute(`
            SELECT 
                c.id,
                c.character_name,
                c.genetic_hash,
                c.lineage,
                c.generation,
                c.quality_score,
                c.created_at,
                JSON_EXTRACT(c.traits, '$') as traits,
                JSON_EXTRACT(c.stats, '$') as stats,
                COUNT(DISTINCT cd.id) as dialogue_count,
                COUNT(DISTINCT cq.id) as quest_count,
                MAX(cd.created_at) as last_dialogue
            FROM characters c
            LEFT JOIN character_dialogues cd ON c.id = cd.character_id
            LEFT JOIN character_quests cq ON c.id = cq.character_id
            WHERE ${conditions.join(' AND ')}
            GROUP BY c.id
            ORDER BY c.created_at DESC
            LIMIT ?
        `, params);
        
        return characters.map(char => ({
            ...char,
            traits: JSON.parse(char.traits || '{}'),
            stats: JSON.parse(char.stats || '{}'),
            summary: `${char.character_name} is a ${char.lineage} character (Generation ${char.generation}) with ${char.dialogue_count} dialogues and ${char.quest_count} quests.`
        }));
    }
    
    async queryDialogues(query, filters, limit) {
        const conditions = ['1=1'];
        const params = [];
        
        // Add filters
        if (filters.characterId) {
            conditions.push('cd.character_id = ?');
            params.push(filters.characterId);
        }
        
        if (filters.dialogueType) {
            conditions.push('cd.dialogue_type = ?');
            params.push(filters.dialogueType);
        }
        
        if (filters.hasSymbols) {
            conditions.push('cd.symbols IS NOT NULL AND cd.symbols != ""');
        }
        
        // Add search term
        if (query && query !== 'all') {
            conditions.push('(cd.content LIKE ? OR cd.dialogue_type LIKE ?)');
            params.push(`%${query}%`, `%${query}%`);
        }
        
        params.push(limit);
        
        const [dialogues] = await this.dbPool.execute(`
            SELECT 
                cd.*,
                c.character_name,
                c.lineage,
                JSON_EXTRACT(cd.mentions, '$') as mentions,
                JSON_EXTRACT(cd.tags, '$') as tags,
                JSON_EXTRACT(cd.actions, '$') as actions,
                JSON_EXTRACT(cd.queries, '$') as queries
            FROM character_dialogues cd
            JOIN characters c ON cd.character_id = c.id
            WHERE ${conditions.join(' AND ')}
            ORDER BY cd.created_at DESC
            LIMIT ?
        `, params);
        
        return dialogues.map(dialogue => ({
            ...dialogue,
            mentions: JSON.parse(dialogue.mentions || '[]'),
            tags: JSON.parse(dialogue.tags || '[]'),
            actions: JSON.parse(dialogue.actions || '[]'),
            queries: JSON.parse(dialogue.queries || '[]'),
            summary: `${dialogue.character_name} ${dialogue.dialogue_type}: "${dialogue.content.substring(0, 100)}${dialogue.content.length > 100 ? '...' : ''}" (${dialogue.symbols || 'no symbols'})`
        }));
    }
    
    async getCharacterSummary(req, res) {
        try {
            const characterId = parseInt(req.params.id);
            
            const [characters] = await this.dbPool.execute(`
                SELECT * FROM claude_character_query WHERE character_id = ?
            `, [characterId]);
            
            if (characters.length === 0) {
                return res.status(404).json({ error: 'Character not found' });
            }
            
            const character = characters[0];
            
            res.json({
                character: {
                    ...character,
                    recent_dialogues: JSON.parse(character.recent_dialogues || '[]'),
                    active_quests: JSON.parse(character.active_quests || '[]'),
                    stats: JSON.parse(character.stats || '{}'),
                    traits: JSON.parse(character.traits || '{}')
                },
                claudeContext: {
                    queryTime: new Date().toISOString(),
                    suggestions: [
                        `Get recent dialogues: /api/claude/dialogue/${characterId}`,
                        `Get active quests: /api/claude/quest/${characterId}`,
                        `Get mentions: /api/claude/mentions/${character.character_name}`
                    ]
                }
            });
            
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async getMentions(req, res) {
        try {
            const characterName = req.params.characterName;
            const limit = parseInt(req.query.limit) || 50;
            
            const [mentions] = await this.dbPool.execute(`
                SELECT 
                    cd.*,
                    c.character_name as mentioned_by,
                    c.lineage,
                    JSON_EXTRACT(cd.mentions, '$') as all_mentions
                FROM character_dialogues cd
                JOIN characters c ON cd.character_id = c.id
                WHERE JSON_CONTAINS(cd.mentions, JSON_QUOTE(?))
                ORDER BY cd.created_at DESC
                LIMIT ?
            `, [characterName, limit]);
            
            res.json({
                characterName,
                mentions: mentions.map(m => ({
                    ...m,
                    all_mentions: JSON.parse(m.all_mentions || '[]'),
                    summary: `${m.mentioned_by} mentioned ${characterName}: "${m.content.substring(0, 100)}..."`
                })),
                count: mentions.length
            });
            
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async getActions(req, res) {
        try {
            const characterId = parseInt(req.params.characterId);
            const limit = parseInt(req.query.limit) || 50;
            
            const [actions] = await this.dbPool.execute(`
                SELECT 
                    cd.*,
                    c.character_name,
                    JSON_EXTRACT(cd.actions, '$') as parsed_actions
                FROM character_dialogues cd
                JOIN characters c ON cd.character_id = c.id
                WHERE cd.character_id = ? 
                AND cd.dialogue_type = 'action'
                AND JSON_LENGTH(cd.actions) > 0
                ORDER BY cd.created_at DESC
                LIMIT ?
            `, [characterId, limit]);
            
            res.json({
                characterId,
                actions: actions.map(a => ({
                    ...a,
                    parsed_actions: JSON.parse(a.parsed_actions || '[]'),
                    summary: `${a.character_name} performed actions: ${JSON.parse(a.parsed_actions || '[]').map(act => act.action).join(', ')}`
                })),
                count: actions.length
            });
            
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async getOverlayData(req, res) {
        try {
            const characterId = parseInt(req.params.characterId);
            
            // Get active overlays for character
            const [overlays] = await this.dbPool.execute(`
                SELECT 
                    ce.*,
                    oc.config_name,
                    oc.default_icon,
                    oc.default_color,
                    oc.default_position,
                    oc.default_animation
                FROM character_events ce
                LEFT JOIN overlay_configs oc ON ce.overlay_config_id = oc.id
                WHERE ce.character_id = ?
                AND ce.trigger_overlay = TRUE
                AND ce.overlay_shown_at IS NULL
                ORDER BY ce.created_at DESC
                LIMIT 10
            `, [characterId]);
            
            // Get active quests with overlay data
            const [quests] = await this.dbPool.execute(`
                SELECT 
                    id,
                    quest_name,
                    quest_type,
                    status,
                    overlay_data
                FROM character_quests
                WHERE character_id = ?
                AND status = 'active'
                ORDER BY started_at DESC
            `, [characterId]);
            
            res.json({
                characterId,
                activeOverlays: overlays.map(o => ({
                    ...o,
                    event_data: JSON.parse(o.event_data || '{}'),
                    overlay: {
                        icon: o.default_icon,
                        color: o.default_color,
                        position: o.default_position,
                        animation: o.default_animation
                    }
                })),
                questOverlays: quests.map(q => ({
                    ...q,
                    overlay_data: JSON.parse(q.overlay_data || '{}')
                })),
                claudeInstructions: {
                    display: 'Show these overlays on the character',
                    update: 'POST to mark overlays as shown',
                    types: 'Icons: !, ?, @, #, achievements, status effects'
                }
            });
            
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    
    async logQuery(req, resultCount, error, responseTime) {
        try {
            const hashedApiKey = crypto.createHash('sha256').update(req.apiKey || 'unknown').digest('hex').substring(0, 32);
            
            await this.dbPool.execute(`
                INSERT INTO claude_queries 
                (query_type, query_text, query_params, result_count, response_time_ms, api_key_used)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [
                req.body?.type || req.path,
                req.body?.query || req.path,
                JSON.stringify(req.body || {}),
                resultCount || 0,
                responseTime || 0,
                hashedApiKey
            ]);
        } catch (logError) {
            console.error('Failed to log query:', logError);
        }
    }
    
    async shutdown() {
        console.log('🤖 Claude Query API shutting down...');
        
        if (this.dbPool) {
            await this.dbPool.end();
        }
    }
}

// Start the service
const queryAPI = new ClaudeQueryAPI();

// Handle shutdown
process.on('SIGINT', async () => {
    await queryAPI.shutdown();
    process.exit(0);
});

module.exports = ClaudeQueryAPI;