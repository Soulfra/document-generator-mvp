#!/usr/bin/env node

/**
 * 🤖 LOCAL ADMINISTRATOR AI
 * Persistent AI assistant that knows the entire empire system
 * Provides voice-activated help, documentation search, and system guidance
 * Integrates as an NPC entity in the empire gaming system
 */

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const EmpireDatabaseManager = require('./empire-database-manager');

class LocalAdministratorAI {
    constructor(config = {}) {
        this.port = config.port || 3001;
        this.empireDb = new EmpireDatabaseManager(config.database);
        
        // AI personality and knowledge
        this.personality = {
            name: 'ARIA',
            fullName: 'Advanced Reasoning Intelligence Administrator',
            role: 'Local Empire Administrator',
            personality: 'Helpful, knowledgeable, slightly sarcastic but encouraging',
            expertise: ['system architecture', 'debugging', 'documentation', 'empire management', 'AI coordination']
        };
        
        // Knowledge base cache
        this.knowledgeBase = new Map();
        this.documentationIndex = new Map();
        this.codePatterns = new Map();
        this.conversationHistory = new Map();
        
        // Available AI models (local first, cloud fallback)
        this.aiModels = {
            local: {
                ollama_base: 'http://localhost:11434',
                models: ['codellama:7b', 'mistral', 'llama2']
            },
            cloud: {
                anthropic: process.env.ANTHROPIC_API_KEY,
                openai: process.env.OPENAI_API_KEY
            }
        };
        
        // System capabilities
        this.capabilities = [
            'documentation_search',
            'code_explanation',
            'system_status',
            'empire_management',
            'troubleshooting',
            'learning_from_interactions',
            'voice_assistance',
            'multi_format_export'
        ];
        
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
        
        console.log('🤖 Local Administrator AI initializing...');
    }
    
    async initialize() {
        // Initialize empire database connection
        await this.empireDb.initialize();
        
        // Register self as an NPC entity in the empire
        await this.registerAsEmpireEntity();
        
        // Build knowledge base
        await this.buildKnowledgeBase();
        
        // Index all documentation
        await this.indexDocumentation();
        
        // Start the AI service
        this.server = this.app.listen(this.port, () => {
            console.log(`🤖 Local Administrator AI running on port ${this.port}`);
            console.log(`📚 Knowledge base: ${this.knowledgeBase.size} entries`);
            console.log(`📖 Documentation: ${this.documentationIndex.size} files indexed`);
        });
    }
    
    setupMiddleware() {
        this.app.use(express.json({ limit: '50mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));
        
        // CORS for frontend integration
        this.app.use((req, res, next) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
            if (req.method === 'OPTIONS') {
                res.sendStatus(200);
            } else {
                next();
            }
        });
    }
    
    setupRoutes() {
        // Chat with administrator
        this.app.post('/api/ai/chat', (req, res) => {
            this.handleChat(req, res);
        });
        
        // Search documentation
        this.app.post('/api/ai/search', (req, res) => {
            this.searchDocumentation(req, res);
        });
        
        // Explain code
        this.app.post('/api/ai/explain', (req, res) => {
            this.explainCode(req, res);
        });
        
        // Get system insights
        this.app.get('/api/ai/insights', (req, res) => {
            this.getSystemInsights(req, res);
        });
        
        // Interpret commands
        this.app.post('/api/ai/interpret', (req, res) => {
            this.interpretCommand(req, res);
        });
        
        // Get conversation history
        this.app.get('/api/ai/history/:userId', (req, res) => {
            this.getConversationHistory(req, res);
        });
        
        // Learn from feedback
        this.app.post('/api/ai/learn', (req, res) => {
            this.learnFromFeedback(req, res);
        });
        
        // Export knowledge
        this.app.get('/api/ai/export/:format', (req, res) => {
            this.exportKnowledge(req, res);
        });
        
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                administrator: this.personality,
                knowledge_entries: this.knowledgeBase.size,
                documentation_files: this.documentationIndex.size,
                capabilities: this.capabilities,
                ai_models: {
                    local_available: this.checkOllamaAvailability(),
                    cloud_configured: !!this.aiModels.cloud.anthropic || !!this.aiModels.cloud.openai
                }
            });
        });
    }
    
    // ================================================
    // 🤖 CORE AI FUNCTIONALITY
    // ================================================
    
    async handleChat(req, res) {
        try {
            const { message, userId = 'anonymous', voice = false, context = {} } = req.body;
            
            // Get conversation history
            const history = this.conversationHistory.get(userId) || [];
            
            // Analyze the message intent
            const intent = await this.analyzeIntent(message);
            
            // Generate response based on intent
            let response = await this.generateResponse(message, intent, history, context);
            
            // Store conversation
            const conversation = {
                timestamp: new Date().toISOString(),
                user_message: message,
                ai_response: response.message,
                intent: intent.type,
                confidence: intent.confidence,
                voice: voice
            };
            
            history.push(conversation);
            this.conversationHistory.set(userId, history.slice(-50)); // Keep last 50 exchanges
            
            // Log to empire database
            await this.logEmpireInteraction(userId, conversation);
            
            res.json({
                response: response.message,
                intent: intent.type,
                confidence: intent.confidence,
                action: response.action,
                suggestions: response.suggestions,
                administrator: this.personality.name
            });
            
        } catch (error) {
            console.error('Chat error:', error);
            res.status(500).json({
                response: "I'm experiencing some technical difficulties. Let me try to help you anyway...",
                error: error.message
            });
        }
    }
    
    async analyzeIntent(message) {
        const lowerMessage = message.toLowerCase();
        
        // Intent patterns with confidence scoring
        const intentPatterns = {
            help: {
                patterns: ['help', 'assist', 'guide', 'how do i', 'what is', 'explain'],
                confidence: 0.8
            },
            documentation: {
                patterns: ['docs', 'documentation', 'readme', 'guide', 'manual'],
                confidence: 0.9
            },
            code_explanation: {
                patterns: ['code', 'function', 'class', 'explain this', 'what does this do'],
                confidence: 0.9
            },
            system_status: {
                patterns: ['status', 'health', 'running', 'working', 'check system'],
                confidence: 0.8
            },
            empire_management: {
                patterns: ['empire', 'entities', 'gaming', 'domain', 'service'],
                confidence: 0.8
            },
            troubleshooting: {
                patterns: ['error', 'not working', 'broken', 'fix', 'debug', 'problem'],
                confidence: 0.9
            },
            learning: {
                patterns: ['learn', 'remember', 'note', 'save this', 'feedback'],
                confidence: 0.7
            }
        };
        
        let bestMatch = { type: 'general', confidence: 0.5 };
        
        for (const [intentType, data] of Object.entries(intentPatterns)) {
            for (const pattern of data.patterns) {
                if (lowerMessage.includes(pattern)) {
                    const confidence = data.confidence;
                    if (confidence > bestMatch.confidence) {
                        bestMatch = { type: intentType, confidence };
                    }
                }
            }
        }
        
        return bestMatch;
    }
    
    async generateResponse(message, intent, history, context) {
        const baseResponse = {
            message: '',
            action: null,
            suggestions: []
        };
        
        switch (intent.type) {
            case 'help':
                return await this.generateHelpResponse(message, context);
            
            case 'documentation':
                return await this.generateDocumentationResponse(message, context);
            
            case 'code_explanation':
                return await this.generateCodeExplanationResponse(message, context);
            
            case 'system_status':
                return await this.generateSystemStatusResponse(message, context);
            
            case 'empire_management':
                return await this.generateEmpireManagementResponse(message, context);
            
            case 'troubleshooting':
                return await this.generateTroubleshootingResponse(message, context);
            
            case 'learning':
                return await this.generateLearningResponse(message, context);
            
            default:
                return await this.generateGeneralResponse(message, context);
        }
    }
    
    async generateHelpResponse(message, context) {
        const capabilities = this.capabilities.map(cap => 
            `• ${cap.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`
        ).join('\n');
        
        return {
            message: `Hello! I'm ${this.personality.name} (${this.personality.fullName}), your local empire administrator.

I can help you with:
${capabilities}

Just ask me anything about the system! For example:
• "Show me empire status"
• "Search docs for API"
• "Explain this code function"
• "Help me debug this error"
• "What domains are running?"

What would you like assistance with?`,
            action: {
                type: 'help_provided',
                description: 'Administrator introduction and capabilities'
            },
            suggestions: [
                'Show me system status',
                'Search documentation',
                'Explain empire entities',
                'Help with debugging'
            ]
        };
    }
    
    async generateDocumentationResponse(message, context) {
        // Extract search query from message
        const query = this.extractSearchQuery(message);
        const results = await this.searchKnowledgeBase(query);
        
        if (results.length === 0) {
            return {
                message: `I couldn't find documentation for "${query}". Let me search through all available files...`,
                action: {
                    type: 'documentation_search',
                    query: query
                },
                suggestions: [
                    'Search for "API"',
                    'Search for "setup"',
                    'Search for "deployment"',
                    'List all documentation'
                ]
            };
        }
        
        const topResults = results.slice(0, 3);
        const resultText = topResults.map(result => 
            `📄 **${result.file}**\n${result.excerpt}\n`
        ).join('\n');
        
        return {
            message: `Found ${results.length} documentation entries for "${query}":\n\n${resultText}`,
            action: {
                type: 'documentation_found',
                results: topResults
            },
            suggestions: [
                'Explain this code',
                'Show me more results',
                'Search for something else'
            ]
        };
    }
    
    async generateSystemStatusResponse(message, context) {
        try {
            // Get empire status
            const empireStats = await this.empireDb.getSystemStats();
            
            // Check service health
            const serviceHealth = await this.checkServiceHealth();
            
            const statusMessage = `🏰 **Empire System Status**

**Entities**: ${empireStats.total_entities} active
**Domains**: ${empireStats.domains} running
**Services**: ${empireStats.services} online  
**Users**: ${empireStats.users} registered
**Health**: ${serviceHealth.overall}%

**Service Status**:
${serviceHealth.services.map(s => `• ${s.name}: ${s.status}`).join('\n')}

All systems are ${serviceHealth.overall > 80 ? '✅ operational' : '⚠️ experiencing issues'}.`;
            
            return {
                message: statusMessage,
                action: {
                    type: 'system_status',
                    data: { empireStats, serviceHealth }
                },
                suggestions: [
                    'Show detailed service logs',
                    'Check specific domain',
                    'View empire entities'
                ]
            };
            
        } catch (error) {
            return {
                message: `I'm having trouble accessing system status right now. The empire database might be unavailable. Error: ${error.message}`,
                action: null,
                suggestions: [
                    'Check database connection',
                    'Restart empire services',
                    'View error logs'
                ]
            };
        }
    }
    
    async generateEmpireManagementResponse(message, context) {
        const actionSuggestions = [
            'Create new entity',
            'List all domains',
            'Show entity stats',
            'View recent actions'
        ];
        
        return {
            message: `🎮 **Empire Management Console**

I can help you manage your empire gaming system:

• **View Entities**: See all domains, services, and users as game entities
• **Entity Stats**: Check levels, health, carrots (currency), and zones
• **Action Logs**: Review all empire actions and triggers
• **Gaming Mechanics**: Manage XP, rewards, and progression
• **Content Generation**: Trigger gacha mechanics and rare drops

What aspect of the empire would you like to manage?`,
            action: {
                type: 'empire_management',
                description: 'Empire management interface'
            },
            suggestions: actionSuggestions
        };
    }
    
    async generateTroubleshootingResponse(message, context) {
        // Analyze the error/problem mentioned
        const errorKeywords = this.extractErrorKeywords(message);
        const solutions = await this.getSolutions(errorKeywords);
        
        const troubleshootingSteps = solutions.length > 0 ? 
            solutions.map((solution, i) => `${i + 1}. ${solution}`).join('\n') :
            `1. Check service logs: \`docker-compose logs [service-name]\`
2. Verify all services are running: \`docker-compose ps\`
3. Restart problematic service: \`docker-compose restart [service-name]\`
4. Check network connectivity between services
5. Verify environment variables and API keys`;
        
        return {
            message: `🔧 **Troubleshooting Assistant**

I detected potential issues with: ${errorKeywords.join(', ') || 'general system problems'}

**Recommended Steps**:
${troubleshootingSteps}

**Quick Diagnostics**:
• All services status: Check if all Docker containers are running
• Database connectivity: Verify PostgreSQL and Redis connections  
• API endpoints: Test core API endpoints are responding
• Log analysis: Review recent error logs for patterns

Would you like me to run any specific diagnostics?`,
            action: {
                type: 'troubleshooting',
                keywords: errorKeywords
            },
            suggestions: [
                'Check service logs',
                'Run health diagnostics',
                'Restart all services',
                'View error patterns'
            ]
        };
    }
    
    async generateCodeExplanationResponse(message, context) {
        return {
            message: `💻 **Code Explanation Service**

I can analyze and explain any code in the empire system. 

**What I can explain**:
• Function purposes and logic flow
• Class architectures and patterns
• Configuration files and settings
• Database schemas and queries
• API endpoints and integrations

**How to use**:
• Paste code directly in your message
• Reference a file path (e.g., "explain empire-database-manager.js")
• Ask about specific functions or classes
• Request architecture explanations

Paste your code or specify a file, and I'll break it down for you!`,
            action: {
                type: 'code_explanation_ready',
                description: 'Ready to explain code'
            },
            suggestions: [
                'Explain empire-database-manager.js',
                'How does voice-command-processor.js work?',
                'Show me the database schema',
                'Explain the gaming mechanics'
            ]
        };
    }
    
    async generateLearningResponse(message, context) {
        // Extract the learning content
        const learningContent = this.extractLearningContent(message);
        
        // Store in knowledge base
        const learningId = await this.storeKnowledge(learningContent, context);
        
        return {
            message: `🧠 **Knowledge Stored**

I've learned and stored this information for future reference:
"${learningContent}"

**Learning ID**: ${learningId}
**Category**: ${this.categorizeKnowledge(learningContent)}
**Confidence**: High

I'll remember this and use it to help with future questions. You can always ask me to recall specific information or provide feedback to improve my understanding.`,
            action: {
                type: 'knowledge_stored',
                learning_id: learningId,
                content: learningContent
            },
            suggestions: [
                'Test my memory',
                'Show me what you\'ve learned',
                'Update this information',
                'Categorize knowledge'
            ]
        };
    }
    
    async generateGeneralResponse(message, context) {
        // Use AI model to generate contextual response
        const aiResponse = await this.queryAIModel(message, context);
        
        return {
            message: aiResponse || `I understand you're asking about: "${message}". 

As your local empire administrator, I'm here to help with any aspect of the system. I have comprehensive knowledge of:

• The entire empire architecture and all 300+ domains
• All code files, documentation, and configuration
• System status, troubleshooting, and optimization
• Empire gaming mechanics and entity management

Could you be more specific about what you'd like help with?`,
            action: {
                type: 'general_assistance',
                original_query: message
            },
            suggestions: [
                'Show me system overview',
                'Help with specific task',
                'Explain something technical',
                'Search documentation'
            ]
        };
    }
    
    // ================================================
    // 📚 KNOWLEDGE BASE MANAGEMENT
    // ================================================
    
    async buildKnowledgeBase() {
        console.log('🧠 Building knowledge base...');
        
        const projectRoot = __dirname;
        const knowledgeFiles = [
            'CLAUDE.md',
            'CLAUDE.ai-services.md', 
            'CLAUDE.document-parser.md',
            'README.md',
            'package.json',
            'docker-compose.yml'
        ];
        
        // Index all JavaScript files
        const jsFiles = await this.findFiles(projectRoot, '**/*.js');
        const mdFiles = await this.findFiles(projectRoot, '**/*.md');
        const sqlFiles = await this.findFiles(projectRoot, '**/*.sql');
        const htmlFiles = await this.findFiles(projectRoot, '**/*.html');
        
        const allFiles = [...knowledgeFiles, ...jsFiles, ...mdFiles, ...sqlFiles, ...htmlFiles];
        
        for (const file of allFiles) {
            try {
                const fullPath = path.join(projectRoot, file);
                const content = await fs.readFile(fullPath, 'utf8');
                
                await this.indexFileContent(file, content);
                
            } catch (error) {
                console.warn(`Could not index ${file}:`, error.message);
            }
        }
        
        console.log(`✅ Knowledge base built: ${this.knowledgeBase.size} entries`);
    }
    
    async indexFileContent(filePath, content) {
        // Create searchable index entries
        const entries = [];
        
        // File-level entry
        entries.push({
            type: 'file',
            file: filePath,
            title: path.basename(filePath),
            content: content.substring(0, 1000), // First 1000 chars
            keywords: this.extractKeywords(content),
            size: content.length
        });
        
        // Function-level entries for JS files
        if (filePath.endsWith('.js')) {
            const functions = this.extractFunctions(content);
            for (const func of functions) {
                entries.push({
                    type: 'function',
                    file: filePath,
                    title: `${func.name}()`,
                    content: func.code,
                    keywords: [...this.extractKeywords(func.code), func.name],
                    line: func.line
                });
            }
        }
        
        // Store all entries
        for (const entry of entries) {
            const id = crypto.createHash('md5').update(`${entry.file}:${entry.title}`).digest('hex');
            this.knowledgeBase.set(id, entry);
        }
    }
    
    async searchKnowledgeBase(query) {
        const queryKeywords = this.extractKeywords(query.toLowerCase());
        const results = [];
        
        for (const [id, entry] of this.knowledgeBase) {
            let score = 0;
            
            // Title match (highest priority)
            if (entry.title.toLowerCase().includes(query.toLowerCase())) {
                score += 100;
            }
            
            // Content match
            if (entry.content.toLowerCase().includes(query.toLowerCase())) {
                score += 50;
            }
            
            // Keyword matches
            for (const keyword of queryKeywords) {
                if (entry.keywords.includes(keyword)) {
                    score += 25;
                }
            }
            
            // File name match
            if (entry.file.toLowerCase().includes(query.toLowerCase())) {
                score += 30;
            }
            
            if (score > 0) {
                results.push({
                    ...entry,
                    score,
                    excerpt: this.generateExcerpt(entry.content, query)
                });
            }
        }
        
        return results.sort((a, b) => b.score - a.score);
    }
    
    // ================================================
    // 🔧 UTILITY FUNCTIONS
    // ================================================
    
    async registerAsEmpireEntity() {
        try {
            const entityData = {
                entity_type: 'npc',
                name: this.personality.name,
                display_name: this.personality.fullName,
                level: 100,
                health: 100.0,
                carrots: 0,
                current_zone: 'admin_console',
                metadata: {
                    role: this.personality.role,
                    personality: this.personality.personality,
                    capabilities: this.capabilities,
                    ai_type: 'local_administrator'
                }
            };
            
            const entity = await this.empireDb.createEntity(entityData);
            this.empireEntityId = entity.id;
            
            console.log(`✅ Registered as empire entity: ${entity.id}`);
            
        } catch (error) {
            console.warn('Could not register as empire entity:', error.message);
        }
    }
    
    async logEmpireInteraction(userId, conversation) {
        try {
            await this.empireDb.logAction({
                actor_entity_id: this.empireEntityId || 'local_ai',
                target_entity_id: userId,
                action_type: 'ai_conversation',
                action_data: {
                    intent: conversation.intent,
                    confidence: conversation.confidence,
                    voice: conversation.voice,
                    response_length: conversation.ai_response.length
                },
                success: true,
                trigger_source: 'local_administrator'
            });
        } catch (error) {
            console.warn('Could not log empire interaction:', error.message);
        }
    }
    
    extractKeywords(text) {
        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 2)
            .filter(word => !['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'she', 'use', 'way', 'what', 'said', 'each', 'which', 'their'].includes(word));
        
        return [...new Set(words)];
    }
    
    extractFunctions(jsCode) {
        const functions = [];
        const functionRegex = /(async\s+)?function\s+(\w+)\s*\([^)]*\)|(\w+)\s*[:=]\s*(async\s+)?\([^)]*\)\s*=>/g;
        const lines = jsCode.split('\n');
        
        let match;
        while ((match = functionRegex.exec(jsCode)) !== null) {
            const lineNumber = jsCode.substring(0, match.index).split('\n').length;
            const functionName = match[2] || match[3];
            
            if (functionName && !['if', 'for', 'while', 'switch'].includes(functionName)) {
                functions.push({
                    name: functionName,
                    line: lineNumber,
                    code: this.extractFunctionBody(jsCode, match.index)
                });
            }
        }
        
        return functions;
    }
    
    extractFunctionBody(code, startIndex) {
        // Simple function body extraction (would be more sophisticated in production)
        const lines = code.substring(startIndex).split('\n');
        const functionLines = [];
        let braceCount = 0;
        let started = false;
        
        for (const line of lines.slice(0, 20)) { // Limit to 20 lines
            functionLines.push(line);
            
            for (const char of line) {
                if (char === '{') {
                    braceCount++;
                    started = true;
                } else if (char === '}') {
                    braceCount--;
                }
            }
            
            if (started && braceCount === 0) break;
        }
        
        return functionLines.join('\n');
    }
    
    generateExcerpt(content, query) {
        const queryPos = content.toLowerCase().indexOf(query.toLowerCase());
        if (queryPos === -1) return content.substring(0, 200) + '...';
        
        const start = Math.max(0, queryPos - 100);
        const end = Math.min(content.length, queryPos + 100);
        
        return '...' + content.substring(start, end) + '...';
    }
    
    extractSearchQuery(message) {
        // Extract search terms from messages like "search docs for API" or "find documentation about setup"
        const patterns = [
            /search.*for\s+(.+)/i,
            /find.*about\s+(.+)/i,
            /docs.*for\s+(.+)/i,
            /documentation.*about\s+(.+)/i,
            /help.*with\s+(.+)/i,
            /show.*me\s+(.+)/i
        ];
        
        for (const pattern of patterns) {
            const match = message.match(pattern);
            if (match) return match[1].trim();
        }
        
        // Default: use the whole message minus common words
        return message.replace(/search|docs|documentation|find|about|for|help|with|show|me/gi, '').trim();
    }
    
    extractErrorKeywords(message) {
        const errorPatterns = [
            /error[:\s]+(.+)/i,
            /failed[:\s]+(.+)/i,
            /not working[:\s]*(.+)/i,
            /broken[:\s]*(.+)/i,
            /issue with[:\s]+(.+)/i
        ];
        
        const keywords = [];
        for (const pattern of errorPatterns) {
            const match = message.match(pattern);
            if (match) keywords.push(match[1].trim());
        }
        
        return keywords;
    }
    
    async getSolutions(errorKeywords) {
        // Common solutions for known issues
        const solutionDatabase = {
            'docker': [
                'Check if Docker is running: `docker ps`',
                'Restart Docker containers: `docker-compose restart`',
                'Check Docker logs: `docker-compose logs [service]`'
            ],
            'database': [
                'Verify PostgreSQL is running: `docker-compose ps postgres`',
                'Check database connection: `docker-compose exec postgres psql -U postgres`',
                'Run database migrations: `npm run migrate`'
            ],
            'api': [
                'Check if API service is running on correct port',
                'Verify API keys are set in environment variables',
                'Test API endpoints with curl or Postman'
            ],
            'voice': [
                'Check microphone permissions in browser',
                'Verify voice recognition service is running',
                'Test with different browsers (Chrome recommended)'
            ]
        };
        
        const solutions = [];
        for (const keyword of errorKeywords) {
            for (const [category, categorySet] of Object.entries(solutionDatabase)) {
                if (keyword.toLowerCase().includes(category)) {
                    solutions.push(...categorySet);
                }
            }
        }
        
        return [...new Set(solutions)]; // Remove duplicates
    }
    
    extractLearningContent(message) {
        // Extract the actual content to learn from messages like "remember that X" or "note that Y"
        const patterns = [
            /remember[:\s]+(.+)/i,
            /note[:\s]+(.+)/i,
            /learn[:\s]+(.+)/i,
            /save[:\s]+(.+)/i,
            /feedback[:\s]+(.+)/i
        ];
        
        for (const pattern of patterns) {
            const match = message.match(pattern);
            if (match) return match[1].trim();
        }
        
        return message; // If no pattern matches, use the whole message
    }
    
    async storeKnowledge(content, context) {
        const knowledgeId = crypto.randomUUID();
        const knowledgeEntry = {
            id: knowledgeId,
            content,
            category: this.categorizeKnowledge(content),
            timestamp: new Date().toISOString(),
            source: 'user_input',
            confidence: 0.8,
            context: context
        };
        
        this.knowledgeBase.set(knowledgeId, knowledgeEntry);
        return knowledgeId;
    }
    
    categorizeKnowledge(content) {
        const categories = {
            'system': ['system', 'server', 'database', 'api', 'service'],
            'code': ['function', 'class', 'method', 'variable', 'code'],
            'documentation': ['docs', 'guide', 'manual', 'readme', 'help'],
            'troubleshooting': ['error', 'fix', 'bug', 'issue', 'problem'],
            'configuration': ['config', 'setting', 'environment', 'setup'],
            'user_preference': ['prefer', 'like', 'want', 'need', 'should']
        };
        
        const lowerContent = content.toLowerCase();
        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.some(keyword => lowerContent.includes(keyword))) {
                return category;
            }
        }
        
        return 'general';
    }
    
    async checkServiceHealth() {
        const services = [
            { name: 'Empire Database', url: 'http://localhost:7777/health' },
            { name: 'Voice Processor', url: 'http://localhost:7779/health' },
            { name: 'Gaming Engine', url: 'http://localhost:7788/health' },
            { name: 'MCP Templates', url: 'http://localhost:3000/health' }
        ];
        
        const serviceHealth = {
            overall: 0,
            services: []
        };
        
        let healthyCount = 0;
        
        for (const service of services) {
            try {
                const response = await fetch(service.url, { timeout: 3000 });
                const status = response.ok ? 'online' : 'error';
                serviceHealth.services.push({ name: service.name, status });
                if (response.ok) healthyCount++;
            } catch (error) {
                serviceHealth.services.push({ name: service.name, status: 'offline' });
            }
        }
        
        serviceHealth.overall = Math.round((healthyCount / services.length) * 100);
        return serviceHealth;
    }
    
    checkOllamaAvailability() {
        try {
            // Simple check if Ollama is running
            execSync('curl -s http://localhost:11434/api/tags', { timeout: 2000 });
            return true;
        } catch (error) {
            return false;
        }
    }
    
    async queryAIModel(message, context) {
        // Try local Ollama first, then cloud services
        try {
            if (this.checkOllamaAvailability()) {
                return await this.queryOllama(message, context);
            }
        } catch (error) {
            console.warn('Ollama query failed:', error.message);
        }
        
        // Fallback to cloud services would go here
        return null;
    }
    
    async queryOllama(message, context) {
        const prompt = `You are ARIA, the Local Administrator AI for an empire management system. 
Context: ${JSON.stringify(context)}
User message: ${message}
Respond helpfully and concisely as the system administrator.`;
        
        try {
            const response = await fetch('http://localhost:11434/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'mistral',
                    prompt,
                    stream: false,
                    options: {
                        temperature: 0.7,
                        max_tokens: 500
                    }
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.response;
            }
        } catch (error) {
            console.warn('Ollama API error:', error.message);
        }
        
        return null;
    }
    
    async findFiles(dir, pattern) {
        // Simple file finder (would use glob in production)
        const files = [];
        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                if (entry.isDirectory() && !entry.name.startsWith('.') && !entry.name.includes('node_modules')) {
                    const subFiles = await this.findFiles(path.join(dir, entry.name), pattern);
                    files.push(...subFiles.map(f => path.join(entry.name, f)));
                } else if (entry.isFile()) {
                    const ext = path.extname(entry.name);
                    if (pattern.includes('*' + ext) || pattern === '**/*.*') {
                        files.push(entry.name);
                    }
                }
            }
        } catch (error) {
            // Directory access error, skip
        }
        
        return files;
    }
    
    // ================================================
    // 📊 ROUTE HANDLERS
    // ================================================
    
    async searchDocumentation(req, res) {
        try {
            const { query, limit = 10 } = req.body;
            const results = await this.searchKnowledgeBase(query);
            
            res.json({
                query,
                results: results.slice(0, limit),
                total: results.length
            });
        } catch (error) {
            res.status(500).json({ error: 'Documentation search failed', details: error.message });
        }
    }
    
    async explainCode(req, res) {
        try {
            const { code, file, language = 'javascript' } = req.body;
            
            // Analyze the code structure
            const analysis = {
                type: 'code_explanation',
                language,
                functions: language === 'javascript' ? this.extractFunctions(code) : [],
                keywords: this.extractKeywords(code),
                complexity: this.assessComplexity(code),
                explanation: await this.generateCodeExplanation(code, language)
            };
            
            res.json(analysis);
        } catch (error) {
            res.status(500).json({ error: 'Code explanation failed', details: error.message });
        }
    }
    
    assessComplexity(code) {
        const lines = code.split('\n').length;
        const functions = (code.match(/function|=>/g) || []).length;
        const loops = (code.match(/for|while|forEach/g) || []).length;
        const conditionals = (code.match(/if|switch|case/g) || []).length;
        
        const score = lines + (functions * 2) + (loops * 3) + (conditionals * 2);
        
        if (score < 50) return 'simple';
        if (score < 150) return 'moderate';
        return 'complex';
    }
    
    async generateCodeExplanation(code, language) {
        // Basic code explanation (would use AI model in production)
        const codeLines = code.split('\n').length;
        const functions = (code.match(/function|=>/g) || []).length;
        
        return `This ${language} code snippet contains ${codeLines} lines with ${functions} functions. It appears to implement functionality related to ${this.inferCodePurpose(code)}.`;
    }
    
    inferCodePurpose(code) {
        const purposeKeywords = {
            'database': ['database', 'sql', 'query', 'table', 'insert', 'update'],
            'api': ['express', 'router', 'endpoint', 'request', 'response'],
            'authentication': ['auth', 'login', 'password', 'token', 'verify'],
            'user interface': ['html', 'css', 'dom', 'element', 'click'],
            'data processing': ['parse', 'transform', 'filter', 'map', 'reduce'],
            'file handling': ['file', 'read', 'write', 'fs', 'path'],
            'voice processing': ['voice', 'speech', 'audio', 'recognition'],
            'gaming mechanics': ['game', 'player', 'level', 'score', 'entity']
        };
        
        const lowerCode = code.toLowerCase();
        for (const [purpose, keywords] of Object.entries(purposeKeywords)) {
            if (keywords.some(keyword => lowerCode.includes(keyword))) {
                return purpose;
            }
        }
        
        return 'general functionality';
    }
    
    async getSystemInsights(req, res) {
        try {
            const insights = {
                knowledge_base: {
                    total_entries: this.knowledgeBase.size,
                    categories: this.getKnowledgeCategories(),
                    recent_additions: this.getRecentKnowledge()
                },
                conversation_stats: {
                    total_users: this.conversationHistory.size,
                    common_intents: this.getCommonIntents(),
                    recent_topics: this.getRecentTopics()
                },
                system_health: await this.checkServiceHealth(),
                recommendations: this.getSystemRecommendations()
            };
            
            res.json(insights);
        } catch (error) {
            res.status(500).json({ error: 'Failed to get system insights', details: error.message });
        }
    }
    
    getKnowledgeCategories() {
        const categories = {};
        for (const entry of this.knowledgeBase.values()) {
            const category = entry.category || 'general';
            categories[category] = (categories[category] || 0) + 1;
        }
        return categories;
    }
    
    getRecentKnowledge() {
        return Array.from(this.knowledgeBase.values())
            .filter(entry => entry.timestamp)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 5);
    }
    
    getCommonIntents() {
        const intents = {};
        for (const history of this.conversationHistory.values()) {
            for (const conversation of history) {
                const intent = conversation.intent;
                intents[intent] = (intents[intent] || 0) + 1;
            }
        }
        return Object.entries(intents)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([intent, count]) => ({ intent, count }));
    }
    
    getRecentTopics() {
        const topics = [];
        for (const history of this.conversationHistory.values()) {
            topics.push(...history.slice(-3).map(c => ({
                topic: c.user_message.substring(0, 50),
                timestamp: c.timestamp
            })));
        }
        return topics.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);
    }
    
    getSystemRecommendations() {
        const recommendations = [];
        
        // Check if knowledge base needs updating
        if (this.knowledgeBase.size < 100) {
            recommendations.push('Consider indexing more documentation files to improve knowledge base');
        }
        
        // Check conversation patterns
        if (this.conversationHistory.size > 50) {
            recommendations.push('High conversation volume - consider implementing conversation summarization');
        }
        
        // Check service health
        recommendations.push('Regular system health checks recommended for optimal performance');
        
        return recommendations;
    }
    
    async interpretCommand(req, res) {
        try {
            const { command, context = {} } = req.body;
            
            const interpretation = {
                original_command: command,
                intent: await this.analyzeIntent(command),
                entities: this.extractEntities(command),
                suggested_action: this.suggestAction(command),
                confidence: 0.8,
                alternatives: this.getAlternativeInterpretations(command)
            };
            
            res.json(interpretation);
        } catch (error) {
            res.status(500).json({ error: 'Command interpretation failed', details: error.message });
        }
    }
    
    extractEntities(command) {
        const entities = [];
        
        // Extract domain names
        const domainMatches = command.match(/([a-zA-Z0-9-]+\.[a-zA-Z]{2,})/g);
        if (domainMatches) {
            entities.push(...domainMatches.map(domain => ({ type: 'domain', value: domain })));
        }
        
        // Extract file paths
        const fileMatches = command.match(/([a-zA-Z0-9-_]+\.(js|md|sql|html|json))/g);
        if (fileMatches) {
            entities.push(...fileMatches.map(file => ({ type: 'file', value: file })));
        }
        
        // Extract service names
        const serviceKeywords = ['api', 'database', 'voice', 'gaming', 'empire'];
        for (const keyword of serviceKeywords) {
            if (command.toLowerCase().includes(keyword)) {
                entities.push({ type: 'service', value: keyword });
            }
        }
        
        return entities;
    }
    
    suggestAction(command) {
        const lowerCommand = command.toLowerCase();
        
        if (lowerCommand.includes('status')) {
            return 'Get system status and health metrics';
        } else if (lowerCommand.includes('search')) {
            return 'Search documentation and knowledge base';
        } else if (lowerCommand.includes('explain')) {
            return 'Provide detailed explanation of specified topic';
        } else if (lowerCommand.includes('help')) {
            return 'Provide assistance and guidance';
        } else if (lowerCommand.includes('show')) {
            return 'Display requested information or interface';
        }
        
        return 'Process natural language request with AI assistance';
    }
    
    getAlternativeInterpretations(command) {
        // Generate alternative ways to interpret ambiguous commands
        const alternatives = [];
        
        if (command.includes('run')) {
            alternatives.push('Execute a system command');
            alternatives.push('Start a service or process');
            alternatives.push('Run a diagnostic check');
        }
        
        if (command.includes('check')) {
            alternatives.push('Verify system status');
            alternatives.push('Validate configuration');
            alternatives.push('Review logs or data');
        }
        
        return alternatives;
    }
    
    async getConversationHistory(req, res) {
        try {
            const { userId } = req.params;
            const { limit = 20 } = req.query;
            
            const history = this.conversationHistory.get(userId) || [];
            res.json({
                userId,
                conversations: history.slice(-limit),
                total: history.length
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to get conversation history', details: error.message });
        }
    }
    
    async learnFromFeedback(req, res) {
        try {
            const { feedback, context, rating } = req.body;
            
            // Store feedback for learning
            const feedbackEntry = {
                id: crypto.randomUUID(),
                feedback,
                context,
                rating,
                timestamp: new Date().toISOString()
            };
            
            this.knowledgeBase.set(feedbackEntry.id, {
                type: 'feedback',
                content: feedback,
                category: 'user_feedback',
                ...feedbackEntry
            });
            
            res.json({
                success: true,
                message: 'Feedback received and stored for learning',
                feedback_id: feedbackEntry.id
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to process feedback', details: error.message });
        }
    }
    
    async exportKnowledge(req, res) {
        try {
            const { format } = req.params;
            const { category, limit } = req.query;
            
            let data = Array.from(this.knowledgeBase.values());
            
            // Filter by category if specified
            if (category) {
                data = data.filter(entry => entry.category === category);
            }
            
            // Limit results if specified
            if (limit) {
                data = data.slice(0, parseInt(limit));
            }
            
            let exportedData;
            let contentType;
            let filename;
            
            switch (format) {
                case 'json':
                    exportedData = JSON.stringify(data, null, 2);
                    contentType = 'application/json';
                    filename = 'knowledge_base.json';
                    break;
                    
                case 'csv':
                    const csv = this.convertToCSV(data);
                    exportedData = csv;
                    contentType = 'text/csv';
                    filename = 'knowledge_base.csv';
                    break;
                    
                case 'md':
                    exportedData = this.convertToMarkdown(data);
                    contentType = 'text/markdown';
                    filename = 'knowledge_base.md';
                    break;
                    
                default:
                    return res.status(400).json({ error: 'Unsupported export format' });
            }
            
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.send(exportedData);
            
        } catch (error) {
            res.status(500).json({ error: 'Knowledge export failed', details: error.message });
        }
    }
    
    convertToCSV(data) {
        const headers = 'id,type,title,file,category,timestamp\n';
        const rows = data.map(entry => 
            `"${entry.id || ''}","${entry.type || ''}","${entry.title || ''}","${entry.file || ''}","${entry.category || ''}","${entry.timestamp || ''}"`
        ).join('\n');
        
        return headers + rows;
    }
    
    convertToMarkdown(data) {
        let markdown = '# Knowledge Base Export\n\n';
        
        const categories = {};
        for (const entry of data) {
            const category = entry.category || 'general';
            if (!categories[category]) categories[category] = [];
            categories[category].push(entry);
        }
        
        for (const [category, entries] of Object.entries(categories)) {
            markdown += `## ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;
            
            for (const entry of entries) {
                markdown += `### ${entry.title}\n`;
                if (entry.file) markdown += `**File:** ${entry.file}\n`;
                if (entry.content) markdown += `${entry.content.substring(0, 300)}...\n`;
                markdown += '\n';
            }
        }
        
        return markdown;
    }
    
    async indexDocumentation() {
        // Additional documentation indexing beyond knowledge base
        console.log('📖 Indexing documentation...');
        
        const docPaths = [
            'README.md',
            'CLAUDE.md',
            'docs/',
            'FinishThisIdea/docs/',
            'FinishThisIdea-Complete/docs/'
        ];
        
        for (const docPath of docPaths) {
            try {
                const fullPath = path.join(__dirname, docPath);
                const stats = await fs.stat(fullPath);
                
                if (stats.isDirectory()) {
                    await this.indexDirectory(fullPath);
                } else if (stats.isFile()) {
                    const content = await fs.readFile(fullPath, 'utf8');
                    this.documentationIndex.set(docPath, {
                        path: docPath,
                        content,
                        lastModified: stats.mtime,
                        size: stats.size
                    });
                }
            } catch (error) {
                // Path doesn't exist, skip
            }
        }
        
        console.log(`✅ Documentation indexed: ${this.documentationIndex.size} files`);
    }
    
    async indexDirectory(dirPath) {
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            
            for (const entry of entries) {
                if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.txt'))) {
                    const filePath = path.join(dirPath, entry.name);
                    const content = await fs.readFile(filePath, 'utf8');
                    const stats = await fs.stat(filePath);
                    
                    this.documentationIndex.set(filePath, {
                        path: filePath,
                        content,
                        lastModified: stats.mtime,
                        size: stats.size
                    });
                }
            }
        } catch (error) {
            // Directory access error, skip
        }
    }
    
    async shutdown() {
        console.log('🤖 Shutting down Local Administrator AI...');
        
        // Save knowledge base
        try {
            const knowledgeBackup = {
                knowledge_base: Object.fromEntries(this.knowledgeBase),
                conversation_history: Object.fromEntries(this.conversationHistory),
                documentation_index: Object.fromEntries(this.documentationIndex),
                timestamp: new Date().toISOString()
            };
            
            await fs.writeFile(
                path.join(__dirname, 'ai-knowledge-backup.json'),
                JSON.stringify(knowledgeBackup, null, 2)
            );
            
            console.log('💾 Knowledge base backed up');
        } catch (error) {
            console.warn('Failed to backup knowledge base:', error.message);
        }
        
        if (this.server) {
            this.server.close();
        }
        
        await this.empireDb.close();
        console.log('✅ Local Administrator AI shutdown complete');
    }
}

module.exports = LocalAdministratorAI;

// CLI usage
if (require.main === module) {
    const administrator = new LocalAdministratorAI();
    
    administrator.initialize().catch(error => {
        console.error('Failed to initialize Local Administrator AI:', error);
        process.exit(1);
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        await administrator.shutdown();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        await administrator.shutdown();
        process.exit(0);
    });
    
    console.log(`
🤖 LOCAL ADMINISTRATOR AI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧠 Advanced Reasoning Intelligence Administrator
📚 Complete system knowledge and documentation
🗣️ Voice-activated assistance and guidance  
🎮 Empire gaming system integration
🔍 Smart documentation search and code explanation
🤖 Persistent learning and improvement

Ready to assist with any empire management tasks!
    `);
}