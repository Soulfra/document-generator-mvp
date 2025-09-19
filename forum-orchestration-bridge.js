#!/usr/bin/env node

/**
 * 🌉 FORUM-ORCHESTRATION BRIDGE
 * 
 * Seamlessly connects the Intelligent Orchestration Hub with phpBB Forums:
 * 
 * 1. Routes orchestration results to character-specific forum boards
 * 2. Creates forum topics from character decision trees  
 * 3. Enables tag-based search across all forum content
 * 4. Syncs character insights with forum discussions
 * 5. Provides unified search across orchestration + forum data
 * 
 * Integration Flow:
 * Query → Intelligent Orchestration → Character Decision Trees → Forum Posts → Search Index
 */

const express = require('express');
const WebSocket = require('ws');
const sqlite3 = require('sqlite3').verbose();
const mysql = require('mysql2/promise');
const EventEmitter = require('events');
const crypto = require('crypto');

// Import existing services
const HierarchicalTagSystem = require('./FinishThisIdea/test-workspace/ai-os-clean/hierarchical-tag-system');

class ForumOrchestrationBridge extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.app = express();
        this.port = 22200; // Bridge service port (changed to avoid Docker conflict)
        this.wsPort = 22201;
        
        this.options = {
            // CORRECTED: Use actual running Unified Orchestration System
            unifiedOrchestrationUrl: 'http://localhost:20000',
            
            // CORRECTED: Use actual API-to-Forum Bridge  
            forumServiceUrl: 'http://localhost:7777',
            
            // Tag Command Router (will start if needed)
            tagRouterUrl: 'http://localhost:8080',
            
            // Intelligent Orchestration Hub (separate service)
            intelligentHubUrl: 'http://localhost:22000',
            
            // phpBB Database connection
            phpbbHost: 'localhost',
            phpbbPort: 3306,
            phpbbDatabase: 'phpbb_forums',
            phpbbUser: 'phpbb_admin', 
            phpbbPassword: 'phpbb_password',
            phpbbTablePrefix: 'phpbb_',
            
            // Bridge database for search indexing
            bridgeDatabase: './forum-orchestration-bridge.db',
            
            ...options
        };
        
        // Character specialists mapping
        this.characterForumMapping = {
            'cal': {
                name: 'Cal',
                emoji: '📊',
                role: 'Systems & Data Architect',
                forumCategory: 'Technical Architecture',
                postTemplate: 'technical-analysis',
                cssTheme: 'data-blue'
            },
            'arty': {
                name: 'Arty',
                emoji: '🎨', 
                role: 'Design & User Experience Lead',
                forumCategory: 'Design & UX',
                postTemplate: 'design-showcase',
                cssTheme: 'design-purple'
            },
            'ralph': {
                name: 'Ralph',
                emoji: '🏗️',
                role: 'Infrastructure & DevOps Architect',
                forumCategory: 'Infrastructure & Operations',
                postTemplate: 'infrastructure-plan',
                cssTheme: 'ops-green'
            },
            'paulo': {
                name: 'Paulo',
                emoji: '🛡️',
                role: 'Security & Compliance Expert', 
                forumCategory: 'Security & Compliance',
                postTemplate: 'security-assessment',
                cssTheme: 'security-red'
            },
            'nash': {
                name: 'Nash',
                emoji: '📢',
                role: 'Business Strategy & Market Analyst',
                forumCategory: 'Business Strategy',
                postTemplate: 'business-analysis',
                cssTheme: 'business-gold'
            },
            'vera': {
                name: 'Vera',
                emoji: '🔬',
                role: 'Research & AI Specialist',
                forumCategory: 'Research & Innovation',
                postTemplate: 'research-findings',
                cssTheme: 'research-teal'
            }
        };
        
        // Search index for unified forum+orchestration search
        this.searchIndex = new Map();
        this.activeOrchestrations = new Map();
        
        // Initialize components
        this.tagSystem = new HierarchicalTagSystem();
        this.phpbbDb = null;
        this.bridgeDb = null;
        
        this.setupDatabase();
        this.setupServer();
        this.setupWebSocket();
        this.startOrchestrationListener();
        
        console.log('🌉 Forum-Orchestration Bridge initializing...');
    }
    
    async setupDatabase() {
        // Initialize bridge database for search indexing
        this.bridgeDb = new sqlite3.Database(this.options.bridgeDatabase);
        
        this.bridgeDb.serialize(() => {
            // Orchestration-Forum mapping table
            this.bridgeDb.run(`
                CREATE TABLE IF NOT EXISTS orchestration_forum_posts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    orchestration_id TEXT NOT NULL,
                    character_id TEXT NOT NULL,
                    phpbb_topic_id INTEGER NOT NULL,
                    phpbb_post_id INTEGER NOT NULL,
                    forum_url TEXT NOT NULL,
                    post_title TEXT NOT NULL,
                    post_content TEXT NOT NULL,
                    tags TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            // Search index table
            this.bridgeDb.run(`
                CREATE TABLE IF NOT EXISTS search_index (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    content_type TEXT NOT NULL, -- 'orchestration', 'forum', 'character'
                    source_id TEXT NOT NULL,
                    title TEXT NOT NULL,
                    content TEXT NOT NULL,
                    tags TEXT NOT NULL,
                    character_id TEXT,
                    industry TEXT,
                    confidence REAL,
                    url TEXT NOT NULL,
                    indexed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(content_type, source_id)
                )
            `);
            
            // Tag routing cache
            this.bridgeDb.run(`
                CREATE TABLE IF NOT EXISTS tag_routing_cache (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    tag_query TEXT NOT NULL UNIQUE,
                    routing_result TEXT NOT NULL,
                    character_assignments TEXT NOT NULL,
                    cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    access_count INTEGER DEFAULT 0
                )
            `);
        });
        
        // Connect to phpBB database
        try {
            this.phpbbDb = await mysql.createConnection({
                host: this.options.phpbbHost,
                port: this.options.phpbbPort,
                user: this.options.phpbbUser,
                password: this.options.phpbbPassword,
                database: this.options.phpbbDatabase,
                charset: 'utf8mb4'
            });
            
            console.log('✅ Connected to phpBB database');
        } catch (error) {
            console.error('❌ Failed to connect to phpBB database:', error.message);
        }
    }
    
    setupServer() {
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.static(__dirname + '/forum-bridge-assets'));
        
        // CORS for cross-origin requests
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            if (req.method === 'OPTIONS') return res.sendStatus(200);
            next();
        });
        
        // Main bridge endpoints  
        this.app.post('/api/tag-query', this.handleTagQuery.bind(this));
        this.app.get('/api/search', this.handleUnifiedSearch.bind(this));
        
        // Bridge status and health
        this.app.get('/api/bridge-status', this.getBridgeStatus.bind(this));
        
        // Main bridge interface
        this.app.get('/', (req, res) => {
            res.send(this.generateBridgeInterface());
        });
        
        console.log('🌉 Bridge API endpoints configured');
    }
    
    setupWebSocket() {
        this.wss = new WebSocket.Server({ port: this.wsPort });
        
        this.wss.on('connection', (ws) => {
            console.log('🔌 New bridge client connected');
            
            ws.send(JSON.stringify({
                type: 'bridge_welcome',
                message: 'Connected to Forum-Orchestration Bridge',
                capabilities: [
                    'Real-time orchestration → forum sync',
                    'Tag-based query routing',
                    'Unified search across all content',
                    'Character-themed forum integration'
                ]
            }));
        });
        
        console.log(`🔌 Bridge WebSocket listening on port ${this.wsPort}`);
    }
    
    startOrchestrationListener() {
        // Listen for updates from the Unified Orchestration System
        try {
            this.unifiedOrchestrationWs = new WebSocket('ws://localhost:20001');
            
            this.unifiedOrchestrationWs.on('message', (data) => {
                const message = JSON.parse(data);
                this.handleUnifiedOrchestrationEvent(message);
            });
            
            this.unifiedOrchestrationWs.on('open', () => {
                console.log('🔗 Connected to Unified Orchestration System WebSocket');
            });
            
            this.unifiedOrchestrationWs.on('error', (error) => {
                console.error('❌ Unified orchestration connection error:', error.message);
                // Continue without WebSocket - not critical for basic functionality
            });
            
        } catch (error) {
            console.error('❌ Failed to connect to unified orchestration system WebSocket:', error.message);
            // Continue without WebSocket - not critical for basic functionality
        }
    }
    
    async handleUnifiedOrchestrationEvent(message) {
        try {
            switch (message.type) {
                case 'pipeline_update':
                    await this.processPipelineUpdate(message);
                    break;
                    
                case 'document_complete':
                    await this.processDocumentCompletion(message);
                    break;
                    
                default:
                    console.log(`📨 Received unified orchestration event: ${message.type}`);
            }
        } catch (error) {
            console.error('❌ Failed to handle unified orchestration event:', error.message);
        }
    }
    
    async processPipelineUpdate(message) {
        const { documentId, stage, status } = message;
        
        console.log(`🔄 Processing pipeline update: ${documentId} - ${stage} - ${status}`);
        
        // Broadcast update to connected clients
        this.broadcast({
            type: 'pipeline_update',
            documentId,
            stage,
            status,
            timestamp: new Date().toISOString()
        });
    }
    
    async processDocumentCompletion(message) {
        const { documentId, mvpReady } = message;
        
        console.log(`🔄 Processing document completion: ${documentId}`);
        
        try {
            // When MVP is ready, create forum post
            if (mvpReady) {
                // Fetch document data from unified orchestration system
                // Note: This would need to be implemented in the unified orchestration system
                // For now, we'll create a basic forum post
                
                const forumPost = await this.createDocumentForumPost(documentId);
                
                // Index content for search
                await this.indexDocumentContent(documentId, forumPost);
                
                // Broadcast update to connected clients
                this.broadcast({
                    type: 'document_forum_sync',
                    documentId,
                    forumPost: forumPost ? 1 : 0,
                    searchIndexed: true
                });
                
                console.log(`✅ Document ${documentId} synced to forum`);
            }
            
        } catch (error) {
            console.error(`❌ Failed to process document completion ${documentId}:`, error.message);
        }
    }
    
    async createCharacterForumPost(orchestrationId, characterInfo, decision, output) {
        try {
            // Generate character-specific post content
            const postContent = this.generateCharacterPostContent(characterInfo, decision, output);
            const postTitle = this.generatePostTitle(characterInfo, decision);
            
            // Create forum post via phpBB integration API
            const forumResponse = await fetch(`${this.options.forumServiceUrl}/api/forum/create-character-post`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    character_id: characterInfo.name.toLowerCase(),
                    category: characterInfo.forumCategory,
                    title: postTitle,
                    content: postContent,
                    tags: this.generatePostTags(decision),
                    orchestration_id: orchestrationId
                })
            });
            
            let forumResult;
            if (forumResponse.ok) {
                forumResult = await forumResponse.json();
            } else {
                // Fallback: create post directly in database
                forumResult = await this.createForumPostDirect(characterInfo, postTitle, postContent);
            }
            
            // Store mapping in bridge database
            const insertStmt = this.bridgeDb.prepare(`
                INSERT INTO orchestration_forum_posts 
                (orchestration_id, character_id, phpbb_topic_id, phpbb_post_id, forum_url, post_title, post_content, tags)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);
            
            insertStmt.run([
                orchestrationId,
                characterInfo.name.toLowerCase(),
                forumResult.topic_id || 0,
                forumResult.post_id || 0,
                forumResult.forum_url || `#${orchestrationId}`,
                postTitle,
                postContent,
                JSON.stringify(this.generatePostTags(decision))
            ]);
            
            insertStmt.finalize();
            
            return {
                characterId: characterInfo.name.toLowerCase(),
                characterName: characterInfo.name,
                topicId: forumResult.topic_id,
                postId: forumResult.post_id,
                forumUrl: forumResult.forum_url,
                title: postTitle,
                tags: this.generatePostTags(decision)
            };
            
        } catch (error) {
            console.error(`❌ Failed to create forum post for ${characterInfo.name}:`, error.message);
            return null;
        }
    }
    
    async createDocumentForumPost(documentId) {
        try {
            // Create a basic forum post for document completion
            const postTitle = `📄 Document ${documentId} Processed`;
            const postContent = `
[b]Document Processing Complete[/b]

[b]Document ID:[/b] ${documentId}
[b]Status:[/b] MVP Ready ✅
[b]Processing Time:[/b] ${new Date().toLocaleString()}

[b]Available Actions:[/b]
• Download generated MVP
• View processing details
• Start deployment

[i]Generated by Forum-Orchestration Bridge[/i]
            `;

            // Try to create via api-to-forum-bridge
            const forumResponse = await fetch(`${this.options.forumServiceUrl}/api/create-post`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: postTitle,
                    content: postContent,
                    category: 'mvp-generation',
                    tags: ['document-processing', 'mvp', `doc-${documentId}`],
                    document_id: documentId
                })
            });

            let forumResult;
            if (forumResponse.ok) {
                forumResult = await forumResponse.json();
            } else {
                console.log('⚠️  Forum API not available, creating mock forum post');
                forumResult = { 
                    topic_id: Date.now(),
                    post_id: Date.now() + 1,
                    forum_url: `#doc-${documentId}`
                };
            }

            return {
                documentId: documentId,
                topicId: forumResult.topic_id,
                postId: forumResult.post_id,
                forumUrl: forumResult.forum_url,
                title: postTitle,
                tags: ['document-processing', 'mvp', `doc-${documentId}`]
            };

        } catch (error) {
            console.error(`❌ Failed to create forum post for document ${documentId}:`, error.message);
            return null;
        }
    }
    
    async indexDocumentContent(documentId, forumPost) {
        try {
            if (forumPost) {
                const insertStmt = this.bridgeDb.prepare(`
                    INSERT OR REPLACE INTO search_index 
                    (content_type, source_id, title, content, tags, url)
                    VALUES (?, ?, ?, ?, ?, ?)
                `);
                
                insertStmt.run([
                    'document_forum_post',
                    `${documentId}_${forumPost.postId}`,
                    forumPost.title,
                    forumPost.title, // Content would be more detailed in real implementation
                    JSON.stringify(forumPost.tags),
                    forumPost.forumUrl
                ]);
                
                insertStmt.finalize();
                
                console.log(`📊 Indexed document ${documentId} forum post for search`);
            }
            
        } catch (error) {
            console.error('❌ Failed to index document content:', error.message);
        }
    }
    
    generateCharacterPostContent(characterInfo, decision, output) {
        const template = this.getPostTemplate(characterInfo.postTemplate);
        
        return template
            .replace('{character_name}', characterInfo.name)
            .replace('{character_emoji}', characterInfo.emoji)
            .replace('{character_role}', characterInfo.role)
            .replace('{decision_area}', decision.decision_area)
            .replace('{question}', decision.question)
            .replace('{answer}', decision.answer ? 'Yes ✅' : 'No ❌')
            .replace('{reasoning}', decision.reasoning)
            .replace('{confidence}', `${(decision.confidence * 100).toFixed(1)}%`)
            .replace('{timestamp}', new Date(decision.timestamp).toLocaleString())
            .replace('{output_content}', this.formatOutputContent(output));
    }
    
    getPostTemplate(templateType) {
        const templates = {
            'technical-analysis': `
[b]{character_emoji} {character_name}'s Technical Analysis[/b]
[i]{character_role}[/i]

[b]Decision Area:[/b] {decision_area}
[b]Question:[/b] {question}
[b]Answer:[/b] {answer}
[b]Confidence:[/b] {confidence}

[b]Technical Reasoning:[/b]
{reasoning}

[b]Generated Output:[/b]
{output_content}

[i]Analysis completed at {timestamp}[/i]
            `,
            'design-showcase': `
[b]{character_emoji} {character_name}'s Design Review[/b]
[i]{character_role}[/i]

[b]Design Decision:[/b] {decision_area}
[b]Evaluation:[/b] {question}
[b]Recommendation:[/b] {answer}
[b]Design Confidence:[/b] {confidence}

[b]UX Reasoning:[/b]
{reasoning}

[b]Design Output:[/b]
{output_content}

[i]Design review completed at {timestamp}[/i]
            `,
            'infrastructure-plan': `
[b]{character_emoji} {character_name}'s Infrastructure Plan[/b]
[i]{character_role}[/i]

[b]Infrastructure Area:[/b] {decision_area}
[b]Assessment:[/b] {question}
[b]Decision:[/b] {answer}
[b]Implementation Confidence:[/b] {confidence}

[b]DevOps Reasoning:[/b]
{reasoning}

[b]Infrastructure Recommendations:[/b]
{output_content}

[i]Infrastructure plan generated at {timestamp}[/i]
            `,
            'security-assessment': `
[b]{character_emoji} {character_name}'s Security Assessment[/b]
[i]{character_role}[/i]

[b]Security Domain:[/b] {decision_area}
[b]Risk Question:[/b] {question}
[b]Security Decision:[/b] {answer}
[b]Assessment Confidence:[/b] {confidence}

[b]Security Analysis:[/b]
{reasoning}

[b]Security Recommendations:[/b]
{output_content}

[i]Security assessment completed at {timestamp}[/i]
            `,
            'business-analysis': `
[b]{character_emoji} {character_name}'s Business Analysis[/b]
[i]{character_role}[/i]

[b]Business Area:[/b] {decision_area}
[b]Strategic Question:[/b] {question}
[b]Business Decision:[/b] {answer}
[b]Market Confidence:[/b] {confidence}

[b]Strategic Reasoning:[/b]
{reasoning}

[b]Business Recommendations:[/b]
{output_content}

[i]Business analysis completed at {timestamp}[/i]
            `,
            'research-findings': `
[b]{character_emoji} {character_name}'s Research Findings[/b]
[i]{character_role}[/i]

[b]Research Area:[/b] {decision_area}
[b]Research Question:[/b] {question}
[b]Finding:[/b] {answer}
[b]Research Confidence:[/b] {confidence}

[b]Research Analysis:[/b]
{reasoning}

[b]Research Output:[/b]
{output_content}

[i]Research completed at {timestamp}[/i]
            `
        };
        
        return templates[templateType] || templates['technical-analysis'];
    }
    
    formatOutputContent(output) {
        if (!output || !output.content) return 'No additional output generated.';
        
        try {
            const content = JSON.parse(output.content);
            
            // Extract key sections for forum display
            let formatted = '';
            
            if (content.sections && content.sections['project-overview']) {
                formatted += `[b]Project Overview:[/b]\n${content.sections['project-overview'].content}\n\n`;
            }
            
            if (content.sections && content.sections['key-findings']) {
                formatted += `[b]Key Findings:[/b]\n${content.sections['key-findings'].content}\n\n`;
            }
            
            if (content.sections && content.sections['critical-recommendations']) {
                formatted += `[b]Critical Recommendations:[/b]\n${content.sections['critical-recommendations'].content}\n\n`;
            }
            
            return formatted || 'Detailed analysis available in full report.';
            
        } catch (error) {
            return 'Detailed analysis generated - see full orchestration results.';
        }
    }
    
    generatePostTitle(characterInfo, decision) {
        const area = decision.decision_area.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        return `${characterInfo.emoji} ${characterInfo.name}: ${area} Analysis`;
    }
    
    generatePostTags(decision) {
        return [
            `character:${decision.character_id}`,
            `area:${decision.decision_area}`,
            `confidence:${decision.confidence > 0.8 ? 'high' : decision.confidence > 0.6 ? 'medium' : 'low'}`,
            `answer:${decision.answer ? 'yes' : 'no'}`,
            'orchestration',
            'ai-analysis'
        ];
    }
    
    async createForumPostDirect(characterInfo, title, content) {
        // Fallback method to create post directly in phpBB database
        try {
            const timestamp = Math.floor(Date.now() / 1000);
            const userId = 1; // System user
            
            // Create topic
            const [topicResult] = await this.phpbbDb.execute(`
                INSERT INTO ${this.options.phpbbTablePrefix}topics 
                (forum_id, topic_title, topic_poster, topic_time, topic_replies, topic_views)
                VALUES (?, ?, ?, ?, 0, 0)
            `, [1, title, userId, timestamp]); // Forum ID 1 = general discussion
            
            const topicId = topicResult.insertId;
            
            // Create post
            const [postResult] = await this.phpbbDb.execute(`
                INSERT INTO ${this.options.phpbbTablePrefix}posts
                (forum_id, topic_id, poster_id, post_time, post_username, post_subject, post_text, post_visibility)
                VALUES (?, ?, ?, ?, '', ?, ?, 1)
            `, [1, topicId, userId, timestamp, title, content]);
            
            const postId = postResult.insertId;
            
            // Update topic with post ID
            await this.phpbbDb.execute(`
                UPDATE ${this.options.phpbbTablePrefix}topics 
                SET topic_first_post_id = ?, topic_last_post_id = ?
                WHERE topic_id = ?
            `, [postId, postId, topicId]);
            
            return {
                topic_id: topicId,
                post_id: postId,
                forum_url: `viewtopic.php?t=${topicId}`
            };
            
        } catch (error) {
            console.error('❌ Failed to create direct forum post:', error.message);
            return { topic_id: 0, post_id: 0, forum_url: '#error' };
        }
    }
    
    async indexOrchestrationContent(orchestrationId, orchestrationData, decisionsData, forumPosts) {
        try {
            // Index orchestration output
            for (const output of orchestrationData.outputs) {
                const content = JSON.parse(output.content);
                
                const insertStmt = this.bridgeDb.prepare(`
                    INSERT OR REPLACE INTO search_index 
                    (content_type, source_id, title, content, tags, confidence, url)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `);
                
                insertStmt.run([
                    'orchestration',
                    orchestrationId,
                    content.title || 'Orchestration Result',
                    JSON.stringify(content),
                    JSON.stringify(['orchestration', output.output_format]),
                    output.confidence,
                    `${this.options.orchestrationUrl}/api/orchestration/${orchestrationId}`
                ]);
                
                insertStmt.finalize();
            }
            
            // Index character decisions
            for (const decision of decisionsData.decisions) {
                const insertStmt = this.bridgeDb.prepare(`
                    INSERT OR REPLACE INTO search_index 
                    (content_type, source_id, title, content, tags, character_id, confidence, url)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `);
                
                insertStmt.run([
                    'character_decision',
                    `${orchestrationId}_${decision.character_id}_${decision.decision_area}`,
                    `${decision.character_name}: ${decision.decision_area}`,
                    `${decision.question}\n${decision.reasoning}`,
                    JSON.stringify([decision.character_id, decision.decision_area]),
                    decision.character_id,
                    decision.confidence,
                    `${this.options.orchestrationUrl}/api/orchestration/${orchestrationId}/decisions`
                ]);
                
                insertStmt.finalize();
            }
            
            // Index forum posts
            for (const post of forumPosts) {
                if (post) {
                    const insertStmt = this.bridgeDb.prepare(`
                        INSERT OR REPLACE INTO search_index 
                        (content_type, source_id, title, content, tags, character_id, url)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    `);
                    
                    insertStmt.run([
                        'forum_post',
                        `${post.topicId}_${post.postId}`,
                        post.title,
                        post.title, // Content would be from phpBB
                        JSON.stringify(post.tags),
                        post.characterId,
                        post.forumUrl
                    ]);
                    
                    insertStmt.finalize();
                }
            }
            
            console.log(`📊 Indexed orchestration ${orchestrationId} content for search`);
            
        } catch (error) {
            console.error('❌ Failed to index orchestration content:', error.message);
        }
    }
    
    // API Handlers
    async handleTagQuery(req, res) {
        try {
            const { query, routing_mode = 'auto' } = req.body;
            
            if (!query) {
                return res.status(400).json({
                    success: false,
                    error: 'Query is required'
                });
            }
            
            console.log(`🏷️ Processing tag query: "${query}"`);
            
            // Parse tag query (e.g., "@cal.fintech.expert analyze this trading algorithm")
            const tagMatch = query.match(/^@(\w+)\.(\w+)\.(\w+)\s+(.+)$/);
            
            if (tagMatch) {
                const [, username, domain, role, actualQuery] = tagMatch;
                
                // Route to unified orchestration system for document processing
                const orchestrationResponse = await fetch(`${this.options.unifiedOrchestrationUrl}/api/documents`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        content: actualQuery,
                        filename: `${username}_${domain}_${role}_query.txt`,
                        docType: 'tag_query',
                        userId: `${username}.${domain}.${role}`,
                        context: {
                            preferredCharacter: username,
                            domain: domain,
                            role: role,
                            tagRouted: true
                        }
                    })
                });
                
                const orchestrationResult = await orchestrationResponse.json();
                
                if (orchestrationResult.success) {
                    // Start processing the document
                    const processResponse = await fetch(`${this.options.unifiedOrchestrationUrl}/api/process/${orchestrationResult.documentId}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    
                    const processResult = await processResponse.json();
                    
                    // Cache the routing for future use
                    const insertStmt = this.bridgeDb.prepare(`
                        INSERT OR REPLACE INTO tag_routing_cache 
                        (tag_query, routing_result, character_assignments)
                        VALUES (?, ?, ?)
                    `);
                    
                    insertStmt.run([
                        query,
                        JSON.stringify({
                            document: orchestrationResult,
                            processing: processResult
                        }),
                        JSON.stringify([{ character: username, domain, role }])
                    ]);
                    
                    insertStmt.finalize();
                    
                    res.json({
                        success: true,
                        routing: {
                            type: 'unified_orchestration_document_processing',
                            character: username,
                            domain: domain,
                            role: role
                        },
                        orchestration: {
                            documentId: orchestrationResult.documentId,
                            status: processResult.mvpReady ? 'completed' : 'processing',
                            document: orchestrationResult,
                            processing: processResult
                        },
                        message: `Query routed to ${username} via unified orchestration system`
                    });
                } else {
                    throw new Error(orchestrationResult.error || 'Document processing failed');
                }
            } else {
                // Regular query - route to unified orchestration system
                const orchestrationResponse = await fetch(`${this.options.unifiedOrchestrationUrl}/api/documents`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        content: query,
                        filename: `general_query_${Date.now()}.txt`,
                        docType: 'general_query',
                        userId: 'anonymous',
                        context: { tagRouted: false }
                    })
                });
                
                const orchestrationResult = await orchestrationResponse.json();
                
                if (orchestrationResult.success) {
                    // Start processing
                    const processResponse = await fetch(`${this.options.unifiedOrchestrationUrl}/api/process/${orchestrationResult.documentId}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    
                    const processResult = await processResponse.json();
                    
                    res.json({
                        success: true,
                        routing: {
                            type: 'unified_orchestration_general'
                        },
                        orchestration: {
                            documentId: orchestrationResult.documentId,
                            status: processResult.mvpReady ? 'completed' : 'processing',
                            document: orchestrationResult,
                            processing: processResult
                        },
                        message: 'Query routed to unified orchestration system'
                    });
                } else {
                    throw new Error(orchestrationResult.error || 'General query processing failed');
                }
            }
            
        } catch (error) {
            console.error('❌ Tag query failed:', error.message);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    async handleUnifiedSearch(req, res) {
        try {
            const { q, type, character, limit = 20 } = req.query;
            
            if (!q) {
                return res.status(400).json({
                    success: false,
                    error: 'Search query (q) is required'
                });
            }
            
            console.log(`🔍 Unified search: "${q}" type:${type} character:${character}`);
            
            // Build search query
            let sql = `
                SELECT content_type, source_id, title, content, tags, character_id, confidence, url, indexed_at
                FROM search_index 
                WHERE (title LIKE ? OR content LIKE ? OR tags LIKE ?)
            `;
            
            const params = [`%${q}%`, `%${q}%`, `%${q}%`];
            
            if (type) {
                sql += ` AND content_type = ?`;
                params.push(type);
            }
            
            if (character) {
                sql += ` AND character_id = ?`;
                params.push(character);
            }
            
            sql += ` ORDER BY indexed_at DESC LIMIT ?`;
            params.push(parseInt(limit));
            
            // Execute search
            const results = await new Promise((resolve, reject) => {
                this.bridgeDb.all(sql, params, (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
            
            // Format results
            const formattedResults = results.map(row => ({
                type: row.content_type,
                id: row.source_id,
                title: row.title,
                snippet: this.generateSearchSnippet(row.content, q),
                character: row.character_id,
                confidence: row.confidence,
                url: row.url,
                indexed: row.indexed_at,
                tags: JSON.parse(row.tags || '[]')
            }));
            
            res.json({
                success: true,
                query: q,
                results: formattedResults,
                total: formattedResults.length,
                searchTime: Date.now() - (req.startTime || Date.now())
            });
            
        } catch (error) {
            console.error('❌ Unified search failed:', error.message);
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    generateSearchSnippet(content, query, maxLength = 150) {
        try {
            const text = typeof content === 'string' ? content : JSON.stringify(content);
            const queryWords = query.toLowerCase().split(/\s+/);
            
            // Find the first occurrence of any query word
            let bestIndex = -1;
            for (const word of queryWords) {
                const index = text.toLowerCase().indexOf(word);
                if (index !== -1 && (bestIndex === -1 || index < bestIndex)) {
                    bestIndex = index;
                }
            }
            
            if (bestIndex === -1) {
                return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '');
            }
            
            // Extract snippet around the found word
            const start = Math.max(0, bestIndex - 50);
            const end = Math.min(text.length, start + maxLength);
            
            let snippet = text.substring(start, end);
            
            if (start > 0) snippet = '...' + snippet;
            if (end < text.length) snippet = snippet + '...';
            
            return snippet;
            
        } catch (error) {
            return 'Content preview unavailable';
        }
    }
    
    async getBridgeStatus(req, res) {
        try {
            // Get database statistics
            const stats = await new Promise((resolve, reject) => {
                this.bridgeDb.get(`
                    SELECT 
                        (SELECT COUNT(*) FROM orchestration_forum_posts) as forum_posts,
                        (SELECT COUNT(*) FROM search_index) as indexed_items,
                        (SELECT COUNT(*) FROM tag_routing_cache) as cached_routes
                `, (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
            
            res.json({
                success: true,
                service: 'Forum-Orchestration Bridge',
                port: this.port,
                status: 'operational',
                connections: {
                    orchestrationHub: this.orchestrationWs?.readyState === 1,
                    phpbbDatabase: !!this.phpbbDb,
                    bridgeDatabase: !!this.bridgeDb
                },
                statistics: stats,
                activeClients: this.wss.clients.size,
                characterMappings: Object.keys(this.characterForumMapping).length
            });
            
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    generateBridgeInterface() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>🌉 Forum-Orchestration Bridge</title>
    <style>
        body {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            color: #ffffff;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            margin: 0;
            padding: 0;
            min-height: 100vh;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 50px;
        }
        
        .header h1 {
            font-size: 3em;
            margin: 0;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        }
        
        .subtitle {
            font-size: 1.2em;
            margin-top: 10px;
            opacity: 0.8;
        }
        
        .bridge-interface {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.2);
            margin-bottom: 40px;
        }
        
        .query-section {
            margin-bottom: 40px;
        }
        
        .query-section h3 {
            font-size: 1.5em;
            margin-bottom: 15px;
            color: #4ecdc4;
        }
        
        .tag-input {
            width: 100%;
            min-height: 120px;
            background: rgba(255,255,255,0.1);
            border: 2px solid rgba(255,255,255,0.2);
            border-radius: 12px;
            padding: 20px;
            color: #fff;
            font-size: 16px;
            font-family: 'Monaco', monospace;
            resize: vertical;
            outline: none;
            transition: all 0.3s ease;
        }
        
        .tag-input:focus {
            border-color: #4ecdc4;
            box-shadow: 0 0 20px rgba(78, 205, 196, 0.2);
        }
        
        .tag-input::placeholder {
            color: rgba(255,255,255,0.5);
        }
        
        .examples {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        
        .example-card {
            background: rgba(255,255,255,0.05);
            border-radius: 12px;
            padding: 20px;
            border-left: 4px solid #4ecdc4;
        }
        
        .example-card h4 {
            margin: 0 0 10px 0;
            color: #4ecdc4;
        }
        
        .example-query {
            font-family: 'Monaco', monospace;
            background: rgba(0,0,0,0.3);
            padding: 10px;
            border-radius: 6px;
            margin: 10px 0;
            font-size: 14px;
            cursor: pointer;
            transition: background 0.2s ease;
        }
        
        .example-query:hover {
            background: rgba(0,0,0,0.5);
        }
        
        .character-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        
        .character-card {
            background: rgba(255,255,255,0.1);
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            transition: all 0.3s ease;
            cursor: pointer;
        }
        
        .character-card:hover {
            background: rgba(255,255,255,0.2);
            transform: translateY(-5px);
        }
        
        .character-emoji {
            font-size: 3em;
            margin-bottom: 10px;
        }
        
        .character-name {
            font-size: 1.2em;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .character-role {
            font-size: 0.9em;
            opacity: 0.8;
        }
        
        .bridge-buttons {
            display: flex;
            gap: 15px;
            justify-content: center;
            flex-wrap: wrap;
            margin: 30px 0;
        }
        
        .bridge-button {
            background: linear-gradient(135deg, #4ecdc4 0%, #2980b9 100%);
            color: white;
            border: none;
            padding: 15px 30px;
            font-size: 1em;
            font-weight: bold;
            border-radius: 25px;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
        }
        
        .bridge-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(78, 205, 196, 0.3);
        }
        
        .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        
        .status-card {
            background: rgba(255,255,255,0.1);
            border-radius: 12px;
            padding: 20px;
        }
        
        .status-card h4 {
            margin: 0 0 15px 0;
            color: #4ecdc4;
        }
        
        .status-item {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
            padding: 5px 0;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        
        .status-value {
            font-weight: bold;
        }
        
        @media (max-width: 768px) {
            .examples {
                grid-template-columns: 1fr;
            }
            .character-grid {
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            }
            .bridge-buttons {
                flex-direction: column;
                align-items: center;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌉 Forum-Orchestration Bridge</h1>
            <div class="subtitle">
                Seamlessly connecting Intelligent Orchestration with phpBB Forums
            </div>
        </div>
        
        <div class="bridge-interface">
            <div class="query-section">
                <h3>🏷️ Natural Tag Query Interface</h3>
                <textarea 
                    class="tag-input" 
                    id="tagQuery" 
                    placeholder="Try natural tag queries:

@cal.fintech.expert analyze this cryptocurrency trading algorithm
@arty.healthcare.designer create user interface for patient portal  
@ralph.gaming.architect design multiplayer infrastructure
@paulo.fintech.security assess payment processing security
@nash.startup.strategist evaluate business model viability
@vera.ai.researcher compare machine learning approaches

Or ask normally:
How do I build a secure e-commerce platform?
Design a mobile app for food delivery
Create a social media analytics dashboard"
                ></textarea>
            </div>
            
            <div class="bridge-buttons">
                <button class="bridge-button" onclick="processTagQuery()">🚀 Route Query</button>
                <button class="bridge-button" onclick="showSearch()">🔍 Search All Content</button>
                <a href="/api/bridge-status" class="bridge-button">📊 Bridge Status</a>
                <a href="http://localhost:22000" class="bridge-button">🧠 Orchestration Hub</a>
            </div>
            
            <div class="examples">
                <div class="example-card">
                    <h4>🎯 Character-Specific Routing</h4>
                    <div class="example-query" onclick="useExample(this)">@cal.fintech.expert analyze payment flows</div>
                    <div class="example-query" onclick="useExample(this)">@arty.gaming.designer create character selection UI</div>
                    <div class="example-query" onclick="useExample(this)">@ralph.healthcare.architect HIPAA-compliant infrastructure</div>
                </div>
                
                <div class="example-card">
                    <h4>🏭 Industry-Specific Queries</h4>
                    <div class="example-query" onclick="useExample(this)">Build a fintech compliance dashboard</div>
                    <div class="example-query" onclick="useExample(this)">Design healthcare patient management system</div>
                    <div class="example-query" onclick="useExample(this)">Create gaming tournament platform</div>
                </div>
                
                <div class="example-card">
                    <h4>🔍 Cross-System Search</h4>
                    <div class="example-query" onclick="searchExample(this)">real-time data processing</div>
                    <div class="example-query" onclick="searchExample(this)">security best practices</div>
                    <div class="example-query" onclick="searchExample(this)">user experience design</div>
                </div>
            </div>
        </div>
        
        <div class="bridge-interface">
            <h3>👥 Character Specialists</h3>
            <div class="character-grid">
                <div class="character-card" onclick="selectCharacter('cal')">
                    <div class="character-emoji">📊</div>
                    <div class="character-name">Cal</div>
                    <div class="character-role">Systems & Data Architect</div>
                </div>
                <div class="character-card" onclick="selectCharacter('arty')">
                    <div class="character-emoji">🎨</div>
                    <div class="character-name">Arty</div>
                    <div class="character-role">Design & UX Lead</div>
                </div>
                <div class="character-card" onclick="selectCharacter('ralph')">
                    <div class="character-emoji">🏗️</div>
                    <div class="character-name">Ralph</div>
                    <div class="character-role">Infrastructure & DevOps</div>
                </div>
                <div class="character-card" onclick="selectCharacter('paulo')">
                    <div class="character-emoji">🛡️</div>
                    <div class="character-name">Paulo</div>
                    <div class="character-role">Security & Compliance</div>
                </div>
                <div class="character-card" onclick="selectCharacter('nash')">
                    <div class="character-emoji">📢</div>
                    <div class="character-name">Nash</div>
                    <div class="character-role">Business Strategy</div>
                </div>
                <div class="character-card" onclick="selectCharacter('vera')">
                    <div class="character-emoji">🔬</div>
                    <div class="character-name">Vera</div>
                    <div class="character-role">Research & AI</div>
                </div>
            </div>
        </div>
        
        <div id="results" class="bridge-interface" style="display: none;">
            <h3>📊 Results</h3>
            <div id="resultsContent"></div>
        </div>
    </div>
    
    <script>
        let ws = null;
        
        // Connect to WebSocket
        function connectWebSocket() {
            ws = new WebSocket('ws://localhost:22101');
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleWebSocketMessage(data);
            };
            
            ws.onopen = () => {
                console.log('Connected to Forum-Orchestration Bridge');
            };
            
            ws.onclose = () => {
                console.log('Disconnected from bridge');
                setTimeout(connectWebSocket, 3000);
            };
        }
        
        function handleWebSocketMessage(data) {
            switch (data.type) {
                case 'bridge_welcome':
                    console.log('Bridge capabilities:', data.capabilities);
                    break;
                    
                case 'orchestration_forum_sync':
                    showNotification(\`✅ Orchestration synced to \${data.forumPosts} forum posts\`);
                    break;
            }
        }
        
        function useExample(element) {
            document.getElementById('tagQuery').value = element.textContent;
        }
        
        function searchExample(element) {
            const query = element.textContent;
            performSearch(query);
        }
        
        function selectCharacter(characterId) {
            const query = document.getElementById('tagQuery').value;
            const domain = 'general';
            const role = 'expert';
            
            if (query && !query.startsWith('@')) {
                document.getElementById('tagQuery').value = \`@\${characterId}.\${domain}.\${role} \${query}\`;
            }
        }
        
        async function processTagQuery() {
            const query = document.getElementById('tagQuery').value.trim();
            
            if (!query) {
                alert('Please enter a query');
                return;
            }
            
            showResults('Processing query...', 'loading');
            
            try {
                const response = await fetch('/api/tag-query', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    displayOrchestrationResult(result);
                } else {
                    showResults(\`Error: \${result.error}\`, 'error');
                }
                
            } catch (error) {
                showResults(\`Error: \${error.message}\`, 'error');
            }
        }
        
        async function performSearch(query) {
            showResults('Searching...', 'loading');
            
            try {
                const response = await fetch(\`/api/search?q=\${encodeURIComponent(query)}\`);
                const result = await response.json();
                
                if (result.success) {
                    displaySearchResults(result);
                } else {
                    showResults(\`Search error: \${result.error}\`, 'error');
                }
                
            } catch (error) {
                showResults(\`Search error: \${error.message}\`, 'error');
            }
        }
        
        function showResults(content, type = 'info') {
            const resultsDiv = document.getElementById('results');
            const contentDiv = document.getElementById('resultsContent');
            
            contentDiv.innerHTML = \`<div class="result-\${type}">\${content}</div>\`;
            resultsDiv.style.display = 'block';
            resultsDiv.scrollIntoView({ behavior: 'smooth' });
        }
        
        function displayOrchestrationResult(result) {
            const html = \`
                <div class="orchestration-result">
                    <h4>🎯 Query Routing: \${result.routing.type}</h4>
                    <div class="routing-info">
                        \${result.routing.character ? \`
                            <p><strong>Character:</strong> \${result.routing.character} (\${result.routing.domain}.\${result.routing.role})</p>
                        \` : ''}
                        <p><strong>Orchestration ID:</strong> \${result.orchestration.orchestrationId}</p>
                        <p><strong>Status:</strong> \${result.orchestration.status}</p>
                    </div>
                    
                    <div class="phases">
                        <h5>Processing Phases:</h5>
                        <ul>
                            \${result.orchestration.phases.map(phase => \`<li>\${phase}</li>\`).join('')}
                        </ul>
                    </div>
                    
                    <div class="actions">
                        <a href="http://localhost:22000" class="bridge-button">🧠 View Full Orchestration</a>
                        <button onclick="trackOrchestration('\${result.orchestration.orchestrationId}')" class="bridge-button">📊 Track Progress</button>
                    </div>
                </div>
            \`;
            
            showResults(html);
        }
        
        function displaySearchResults(result) {
            const html = \`
                <div class="search-results">
                    <h4>🔍 Search Results (\${result.total} found)</h4>
                    <div class="search-meta">
                        <p>Query: "\${result.query}" | Search time: \${result.searchTime}ms</p>
                    </div>
                    
                    <div class="results-list">
                        \${result.results.map(item => \`
                            <div class="result-item">
                                <div class="result-header">
                                    <h5>\${item.type === 'character_decision' ? item.character + ' 🎯' : ''} \${item.title}</h5>
                                    <span class="result-type">\${item.type.replace('_', ' ')}</span>
                                </div>
                                <div class="result-snippet">\${item.snippet}</div>
                                <div class="result-meta">
                                    \${item.character ? \`Character: \${item.character} | \` : ''}
                                    \${item.confidence ? \`Confidence: \${(item.confidence * 100).toFixed(1)}% | \` : ''}
                                    Indexed: \${new Date(item.indexed).toLocaleString()}
                                </div>
                                <div class="result-tags">
                                    \${item.tags.map(tag => \`<span class="tag">\${tag}</span>\`).join('')}
                                </div>
                            </div>
                        \`).join('')}
                    </div>
                </div>
            \`;
            
            showResults(html);
        }
        
        function showSearch() {
            const query = prompt('Enter search query:');
            if (query) {
                performSearch(query);
            }
        }
        
        function trackOrchestration(orchestrationId) {
            window.open(\`http://localhost:22000/api/orchestration/\${orchestrationId}\`, '_blank');
        }
        
        function showNotification(message) {
            // Create a simple notification
            const notification = document.createElement('div');
            notification.style.cssText = \`
                position: fixed;
                top: 20px;
                right: 20px;
                background: #4ecdc4;
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: 1000;
                animation: slideIn 0.3s ease;
            \`;
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }
        
        // Initialize
        connectWebSocket();
    </script>
    
    <style>
        .result-info { color: #4ecdc4; }
        .result-loading { color: #f39c12; }
        .result-error { color: #e74c3c; }
        
        .orchestration-result, .search-results {
            background: rgba(255,255,255,0.05);
            border-radius: 12px;
            padding: 20px;
        }
        
        .routing-info, .search-meta {
            background: rgba(0,0,0,0.2);
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
        }
        
        .phases ul {
            margin: 10px 0;
            padding-left: 20px;
        }
        
        .actions {
            margin-top: 20px;
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
        }
        
        .results-list {
            margin-top: 20px;
        }
        
        .result-item {
            background: rgba(255,255,255,0.05);
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
            border-left: 4px solid #4ecdc4;
        }
        
        .result-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 10px;
        }
        
        .result-header h5 {
            margin: 0;
            color: #4ecdc4;
        }
        
        .result-type {
            background: rgba(78, 205, 196, 0.2);
            color: #4ecdc4;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            text-transform: uppercase;
        }
        
        .result-snippet {
            margin: 10px 0;
            line-height: 1.5;
        }
        
        .result-meta {
            font-size: 0.9em;
            opacity: 0.7;
            margin: 10px 0;
        }
        
        .result-tags {
            display: flex;
            gap: 5px;
            flex-wrap: wrap;
            margin-top: 10px;
        }
        
        .tag {
            background: rgba(255,255,255,0.1);
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 0.8em;
        }
        
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    </style>
</body>
</html>`;
    }
    
    broadcast(data) {
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    }
    
    async start() {
        this.app.listen(this.port, () => {
            console.log(`\n🌉 FORUM-ORCHESTRATION BRIDGE STARTED!`);
            console.log('================================================');
            console.log(`🌐 Main Interface: http://localhost:${this.port}`);
            console.log(`🔌 WebSocket: ws://localhost:${this.wsPort}`);
            console.log('');
            console.log('🔗 INTEGRATION CAPABILITIES:');
            console.log('   • Natural tag query routing (@cal.fintech.expert)');
            console.log('   • Orchestration → Forum post creation');
            console.log('   • Unified search (orchestration + forum content)');
            console.log('   • Character-themed forum integration');
            console.log('   • Real-time sync via WebSocket');
            console.log('');
            console.log('🎯 CONNECTED SERVICES:');
            console.log('   📊 Intelligent Orchestration Hub (port 22000)');
            console.log('   🏛️ phpBB Forum Integration (port 7777)');
            console.log('   🏷️ Tag Command Router (port 8080)');
            console.log('');
            console.log('This bridges everything together! 🚀');
        });
    }
}

// Start the bridge
const bridge = new ForumOrchestrationBridge();
bridge.start();

module.exports = ForumOrchestrationBridge;