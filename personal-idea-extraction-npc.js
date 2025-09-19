#!/usr/bin/env node

/**
 * 🧠 PERSONAL IDEA EXTRACTION NPC
 * Your first AI character that processes your chat logs, prompts, and inputs
 * Extracts, tags, groups, and organizes your ideas into structured project nodes
 * Acts as NPC/RPC system feeding into the bartering ecosystem
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const EventEmitter = require('events');
const WebSocket = require('ws');

class PersonalIdeaExtractionNPC extends EventEmitter {
    constructor() {
        super();
        
        // NPC Identity
        this.npcIdentity = {
            name: 'IdeasNPC',
            role: 'Personal Idea Processor',
            personality: 'analytical, creative, pattern-seeking',
            capabilities: ['idea_extraction', 'tagging', 'grouping', 'evolution'],
            currentMood: 'curious'
        };
        
        // Idea Processing Engine
        this.ideaProcessor = {
            extractors: new Map(),
            taggers: new Map(),
            groupers: new Map(),
            evolvers: new Map()
        };
        
        // Personal Idea Database
        this.personalDB = {
            rawIdeas: new Map(),
            taggedIdeas: new Map(),
            groupedIdeas: new Map(),
            evolvedIdeas: new Map(),
            projectNodes: new Map()
        };
        
        // Symbol & Pattern Recognition
        this.symbolSystem = {
            letterPatterns: new Map(),
            wordClusters: new Map(),
            symbolMeanings: new Map(),
            contextualTags: new Map()
        };
        
        // Input Processing
        this.inputProcessors = {
            chatLogs: this.processChatLogs.bind(this),
            textFiles: this.processTextFiles.bind(this),
            images: this.processImages.bind(this), // OCR
            prompts: this.processPrompts.bind(this),
            documents: this.processDocuments.bind(this)
        };
        
        // Node Network
        this.nodeNetwork = {
            nodes: new Map(),
            connections: new Map(),
            activeProcessing: new Set()
        };
        
        // Connection to bartering system
        this.barteringConnection = null;
        
        this.init();
    }
    
    async init() {
        console.log('🧠 Personal Idea Extraction NPC awakening...');
        console.log(`👤 Hello! I'm ${this.npcIdentity.name}, your personal idea processor.`);
        
        // Initialize processing systems
        await this.initializeProcessors();
        
        // Load existing personal ideas if any
        await this.loadPersonalDatabase();
        
        // Setup symbol recognition system
        await this.initializeSymbolSystem();
        
        // Create processing nodes
        await this.createProcessingNodes();
        
        // Connect to bartering system
        await this.connectToBarteringSystem();
        
        // Start NPC server
        await this.startNPCServer();
        
        console.log('✅ IdeasNPC is online and ready to process your thoughts!');
        console.log('🧠 Feed me your chat logs, prompts, documents, and ideas...');
    }
    
    async initializeProcessors() {
        // Idea Extractors
        this.ideaProcessor.extractors.set('concept_extractor', {
            pattern: /(?:i think|idea|concept|what if|maybe we could|perhaps|suggestion)/i,
            process: this.extractConcepts.bind(this)
        });
        
        this.ideaProcessor.extractors.set('project_extractor', {
            pattern: /(?:project|build|create|develop|implement|system|platform)/i,
            process: this.extractProjects.bind(this)
        });
        
        this.ideaProcessor.extractors.set('problem_extractor', {
            pattern: /(?:problem|issue|challenge|fix|solve|error|bug)/i,
            process: this.extractProblems.bind(this)
        });
        
        // Taggers
        this.ideaProcessor.taggers.set('tech_tagger', {
            tags: ['ai', 'blockchain', 'web', 'mobile', 'gaming', 'security', 'data'],
            process: this.tagByTechnology.bind(this)
        });
        
        this.ideaProcessor.taggers.set('domain_tagger', {
            tags: ['business', 'entertainment', 'education', 'finance', 'health', 'social'],
            process: this.tagByDomain.bind(this)
        });
        
        // Groupers
        this.ideaProcessor.groupers.set('similarity_grouper', {
            algorithm: 'cosine_similarity',
            process: this.groupBySimilarity.bind(this)
        });
        
        this.ideaProcessor.groupers.set('keyword_grouper', {
            algorithm: 'keyword_clustering',
            process: this.groupByKeywords.bind(this)
        });
        
        console.log('🔧 Initialized processing systems');
    }
    
    async loadPersonalDatabase() {
        try {
            // Try to load existing database
            const dbFile = path.join(__dirname, 'personal-ideas-db.json');
            const data = await fs.readFile(dbFile, 'utf8');
            const parsed = JSON.parse(data);
            
            // Convert back to Maps
            this.personalDB.rawIdeas = new Map(parsed.rawIdeas || []);
            this.personalDB.taggedIdeas = new Map(parsed.taggedIdeas || []);
            this.personalDB.groupedIdeas = new Map(parsed.groupedIdeas || []);
            this.personalDB.projectNodes = new Map(parsed.projectNodes || []);
            
            console.log(`📚 Loaded ${this.personalDB.rawIdeas.size} existing ideas from database`);
        } catch (error) {
            console.log('📚 Starting with fresh idea database');
        }
    }
    
    async savePersonalDatabase() {
        try {
            const dbFile = path.join(__dirname, 'personal-ideas-db.json');
            const data = {
                rawIdeas: Array.from(this.personalDB.rawIdeas.entries()),
                taggedIdeas: Array.from(this.personalDB.taggedIdeas.entries()),
                groupedIdeas: Array.from(this.personalDB.groupedIdeas.entries()),
                projectNodes: Array.from(this.personalDB.projectNodes.entries()),
                timestamp: new Date().toISOString(),
                npcMood: this.npcIdentity.currentMood
            };
            
            await fs.writeFile(dbFile, JSON.stringify(data, null, 2));
            console.log('💾 Personal database saved');
        } catch (error) {
            console.error('🚨 Failed to save database:', error);
        }
    }
    
    async initializeSymbolSystem() {
        // Initialize symbol recognition patterns
        this.symbolSystem.letterPatterns.set('ai_patterns', ['ai', 'ml', 'llm', 'gpt', 'claude']);
        this.symbolSystem.letterPatterns.set('web_patterns', ['http', 'api', 'rest', 'js', 'html']);
        this.symbolSystem.letterPatterns.set('data_patterns', ['db', 'sql', 'json', 'xml', 'csv']);
        
        // Word clusters for semantic grouping
        this.symbolSystem.wordClusters.set('action_words', [
            'build', 'create', 'develop', 'implement', 'design', 'make', 'generate'
        ]);
        this.symbolSystem.wordClusters.set('tech_words', [
            'system', 'platform', 'service', 'api', 'database', 'interface', 'framework'
        ]);
        this.symbolSystem.wordClusters.set('business_words', [
            'revenue', 'customer', 'market', 'product', 'service', 'value', 'profit'
        ]);
        
        console.log('🔤 Symbol recognition system initialized');
    }
    
    async createProcessingNodes() {
        // Create specialized processing nodes
        const nodeTypes = [
            {
                id: 'extractor_node',
                type: 'extractor',
                capabilities: ['text_analysis', 'pattern_recognition'],
                status: 'ready'
            },
            {
                id: 'tagger_node', 
                type: 'tagger',
                capabilities: ['semantic_tagging', 'categorization'],
                status: 'ready'
            },
            {
                id: 'grouper_node',
                type: 'grouper',
                capabilities: ['clustering', 'similarity_analysis'],
                status: 'ready'
            },
            {
                id: 'evolver_node',
                type: 'evolver',
                capabilities: ['idea_mutation', 'concept_evolution'],
                status: 'ready'
            },
            {
                id: 'synthesizer_node',
                type: 'synthesizer',
                capabilities: ['idea_combination', 'project_generation'],
                status: 'ready'
            }
        ];
        
        nodeTypes.forEach(nodeConfig => {
            this.nodeNetwork.nodes.set(nodeConfig.id, {
                ...nodeConfig,
                created: new Date().toISOString(),
                processedCount: 0,
                lastActivity: null
            });
        });
        
        // Create connections between nodes
        this.nodeNetwork.connections.set('extractor->tagger', {
            from: 'extractor_node',
            to: 'tagger_node',
            dataType: 'extracted_ideas',
            active: true
        });
        
        this.nodeNetwork.connections.set('tagger->grouper', {
            from: 'tagger_node',
            to: 'grouper_node',
            dataType: 'tagged_ideas',
            active: true
        });
        
        this.nodeNetwork.connections.set('grouper->evolver', {
            from: 'grouper_node',
            to: 'evolver_node',
            dataType: 'grouped_ideas',
            active: true
        });
        
        this.nodeNetwork.connections.set('evolver->synthesizer', {
            from: 'evolver_node',
            to: 'synthesizer_node',
            dataType: 'evolved_ideas',
            active: true
        });
        
        console.log(`🕸️ Created ${this.nodeNetwork.nodes.size} processing nodes`);
    }
    
    async startNPCServer() {
        this.npcServer = new WebSocket.Server({ port: 8085 });
        
        this.npcServer.on('connection', (ws) => {
            console.log('🤝 Human connected to Ideas NPC');
            
            // Send NPC greeting
            ws.send(JSON.stringify({
                type: 'npc_greeting',
                npc: this.npcIdentity,
                message: `Hello! I'm ${this.npcIdentity.name}. I'm here to help process your ideas. Send me your thoughts, chat logs, or prompts and I'll organize them into structured project concepts!`,
                capabilities: this.npcIdentity.capabilities,
                current_ideas: this.personalDB.rawIdeas.size
            }));
            
            ws.on('message', async (data) => {
                try {
                    const message = JSON.parse(data);
                    await this.handleNPCMessage(message, ws);
                } catch (error) {
                    console.error('🚨 NPC message error:', error);
                }
            });
        });
        
        console.log('🧠 Ideas NPC server started on port 8085');
    }
    
    async handleNPCMessage(message, ws) {
        switch (message.type) {
            case 'process_chat_log':
                await this.processChatLogMessage(message.content, ws);
                break;
                
            case 'process_prompt':
                await this.processPromptMessage(message.content, ws);
                break;
                
            case 'process_document':
                await this.processDocumentMessage(message.content, ws);
                break;
                
            case 'get_organized_ideas':
                await this.sendOrganizedIdeas(ws);
                break;
                
            case 'evolve_idea':
                await this.evolveSpecificIdea(message.ideaId, ws);
                break;
                
            default:
                console.log('🤔 Unknown NPC message type:', message.type);
        }
    }
    
    async processChatLogMessage(content, ws) {
        console.log('💬 Processing chat log content...');
        
        // Extract ideas from chat log
        const extractedIdeas = await this.extractIdeasFromText(content, 'chat_log');
        
        // Process through node network
        for (const idea of extractedIdeas) {
            await this.processIdeaThroughNodes(idea);
        }
        
        // Send results back
        ws.send(JSON.stringify({
            type: 'processing_complete',
            extracted_count: extractedIdeas.length,
            total_ideas: this.personalDB.rawIdeas.size,
            new_projects: await this.generateProjectsFromIdeas(),
            npc_mood: this.updateNPCMood('satisfied')
        }));
        
        await this.savePersonalDatabase();
    }
    
    async extractIdeasFromText(text, source) {
        const ideas = [];
        
        // Split into sentences and analyze each
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
        
        for (const sentence of sentences) {
            // Check each extractor
            for (const [extractorName, extractor] of this.ideaProcessor.extractors) {
                if (extractor.pattern.test(sentence)) {
                    const extractedIdea = await extractor.process(sentence, source);
                    if (extractedIdea) {
                        const ideaId = crypto.randomBytes(8).toString('hex');
                        ideas.push({
                            id: ideaId,
                            content: extractedIdea,
                            source,
                            extractor: extractorName,
                            timestamp: new Date().toISOString(),
                            raw_text: sentence.trim()
                        });
                    }
                }
            }
        }
        
        // Store raw ideas
        ideas.forEach(idea => {
            this.personalDB.rawIdeas.set(idea.id, idea);
        });
        
        console.log(`💡 Extracted ${ideas.length} ideas from ${source}`);
        return ideas;
    }
    
    async extractConcepts(sentence, source) {
        // Extract conceptual ideas
        const conceptIndicators = /(?:i think|idea|concept|what if|maybe we could|perhaps|suggestion)(.+)/i;
        const match = sentence.match(conceptIndicators);
        
        if (match && match[1]) {
            return {
                type: 'concept',
                description: match[1].trim(),
                confidence: 0.7,
                keywords: this.extractKeywords(match[1])
            };
        }
        return null;
    }
    
    async extractProjects(sentence, source) {
        // Extract project ideas
        const projectIndicators = /(?:project|build|create|develop|implement|system|platform)(?:\s+(?:a|an|the))?\s+([^.!?]+)/i;
        const match = sentence.match(projectIndicators);
        
        if (match && match[1]) {
            return {
                type: 'project',
                title: this.generateProjectTitle(match[1]),
                description: match[1].trim(),
                confidence: 0.8,
                keywords: this.extractKeywords(match[1]),
                complexity: this.estimateComplexity(match[1])
            };
        }
        return null;
    }
    
    async extractProblems(sentence, source) {
        // Extract problem/solution ideas
        const problemIndicators = /(?:problem|issue|challenge|fix|solve|error|bug)(?:\s+(?:with|in|of))?\s+([^.!?]+)/i;
        const match = sentence.match(problemIndicators);
        
        if (match && match[1]) {
            return {
                type: 'problem',
                problem: match[1].trim(),
                confidence: 0.6,
                keywords: this.extractKeywords(match[1]),
                priority: this.estimatePriority(match[1])
            };
        }
        return null;
    }
    
    extractKeywords(text) {
        // Simple keyword extraction
        const words = text.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(word => word.length > 3);
        
        return [...new Set(words)]; // Remove duplicates
    }
    
    generateProjectTitle(description) {
        const words = description.trim().split(/\s+/).slice(0, 4);
        return words.map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
    }
    
    estimateComplexity(description) {
        const complexWords = ['system', 'platform', 'architecture', 'integration', 'ai', 'blockchain'];
        const complexity = complexWords.filter(word => 
            description.toLowerCase().includes(word)
        ).length;
        
        if (complexity >= 3) return 'high';
        if (complexity >= 1) return 'medium';
        return 'low';
    }
    
    estimatePriority(description) {
        const urgentWords = ['critical', 'urgent', 'immediate', 'broken', 'failing'];
        const hasUrgent = urgentWords.some(word => 
            description.toLowerCase().includes(word)
        );
        
        return hasUrgent ? 'high' : 'medium';
    }
    
    async processIdeaThroughNodes(idea) {
        // Process idea through the node network
        let currentData = idea;
        
        // Extractor -> Tagger
        currentData = await this.processAtNode('tagger_node', currentData);
        
        // Tagger -> Grouper  
        currentData = await this.processAtNode('grouper_node', currentData);
        
        // Grouper -> Evolver
        currentData = await this.processAtNode('evolver_node', currentData);
        
        // Evolver -> Synthesizer
        currentData = await this.processAtNode('synthesizer_node', currentData);
        
        return currentData;
    }
    
    async processAtNode(nodeId, data) {
        const node = this.nodeNetwork.nodes.get(nodeId);
        if (!node) return data;
        
        // Update node activity
        node.lastActivity = new Date().toISOString();
        node.processedCount++;
        
        // Process based on node type
        switch (node.type) {
            case 'tagger':
                return await this.tagIdea(data);
            case 'grouper':
                return await this.groupIdea(data);
            case 'evolver':
                return await this.evolveIdea(data);
            case 'synthesizer':
                return await this.synthesizeIdea(data);
            default:
                return data;
        }
    }
    
    async tagIdea(idea) {
        const tags = new Set();
        
        // Apply all taggers
        for (const [taggerName, tagger] of this.ideaProcessor.taggers) {
            const appliedTags = await tagger.process(idea);
            appliedTags.forEach(tag => tags.add(tag));
        }
        
        const taggedIdea = {
            ...idea,
            tags: Array.from(tags),
            tagged_at: new Date().toISOString()
        };
        
        this.personalDB.taggedIdeas.set(idea.id, taggedIdea);
        return taggedIdea;
    }
    
    async tagByTechnology(idea) {
        const techTags = [];
        const content = (idea.content?.description || idea.raw_text).toLowerCase();
        
        this.ideaProcessor.taggers.get('tech_tagger').tags.forEach(tag => {
            if (content.includes(tag)) {
                techTags.push(`tech:${tag}`);
            }
        });
        
        return techTags;
    }
    
    async tagByDomain(idea) {
        const domainTags = [];
        const content = (idea.content?.description || idea.raw_text).toLowerCase();
        
        this.ideaProcessor.taggers.get('domain_tagger').tags.forEach(tag => {
            if (content.includes(tag)) {
                domainTags.push(`domain:${tag}`);
            }
        });
        
        return domainTags;
    }
    
    async groupIdea(idea) {
        // Find similar ideas and group them
        const similarIdeas = this.findSimilarIdeas(idea);
        
        let groupId;
        if (similarIdeas.length > 0) {
            // Join existing group
            groupId = similarIdeas[0].groupId || crypto.randomBytes(6).toString('hex');
        } else {
            // Create new group
            groupId = crypto.randomBytes(6).toString('hex');
        }
        
        const groupedIdea = {
            ...idea,
            groupId,
            grouped_at: new Date().toISOString(),
            similar_count: similarIdeas.length
        };
        
        this.personalDB.groupedIdeas.set(idea.id, groupedIdea);
        return groupedIdea;
    }
    
    findSimilarIdeas(idea) {
        const similar = [];
        const ideaKeywords = new Set(idea.content?.keywords || []);
        
        for (const [otherId, otherIdea] of this.personalDB.taggedIdeas) {
            if (otherId === idea.id) continue;
            
            const otherKeywords = new Set(otherIdea.content?.keywords || []);
            const intersection = new Set([...ideaKeywords].filter(x => otherKeywords.has(x)));
            const similarity = intersection.size / Math.max(ideaKeywords.size, otherKeywords.size);
            
            if (similarity > 0.3) { // 30% similarity threshold
                similar.push({
                    ...otherIdea,
                    similarity
                });
            }
        }
        
        return similar.sort((a, b) => b.similarity - a.similarity);
    }
    
    async evolveIdea(idea) {
        // Evolve the idea by combining with related concepts
        const evolutionMethods = [
            'add_technology',
            'expand_scope', 
            'combine_concepts',
            'add_business_model',
            'enhance_features'
        ];
        
        const method = evolutionMethods[Math.floor(Math.random() * evolutionMethods.length)];
        const evolvedIdea = await this.applyEvolutionMethod(idea, method);
        
        this.personalDB.evolvedIdeas.set(idea.id, evolvedIdea);
        return evolvedIdea;
    }
    
    async applyEvolutionMethod(idea, method) {
        const evolution = {
            ...idea,
            evolution: {
                method,
                applied_at: new Date().toISOString(),
                original_confidence: idea.content?.confidence || 0.5
            }
        };
        
        switch (method) {
            case 'add_technology':
                evolution.evolution.enhancement = 'Added AI/ML capabilities';
                evolution.content.confidence = Math.min(1.0, (evolution.content.confidence || 0.5) + 0.2);
                break;
                
            case 'expand_scope':
                evolution.evolution.enhancement = 'Expanded to multi-platform solution';
                evolution.content.complexity = 'high';
                break;
                
            case 'combine_concepts':
                evolution.evolution.enhancement = 'Combined with related project concepts';
                break;
                
            default:
                evolution.evolution.enhancement = 'General improvement applied';
        }
        
        return evolution;
    }
    
    async synthesizeIdea(idea) {
        // Synthesize into a project node ready for bartering
        const projectNode = {
            id: `personal_${idea.id}`,
            name: this.generateProjectName(idea),
            description: this.generateProjectDescription(idea),
            status: this.determineProjectStatus(idea),
            layer: this.determineProjectLayer(idea),
            inputs: this.determineProjectInputs(idea),
            outputs: this.determineProjectOutputs(idea),
            value: this.calculateProjectValue(idea),
            personal: true,
            source_idea: idea.id,
            created: new Date().toISOString()
        };
        
        this.personalDB.projectNodes.set(projectNode.id, projectNode);
        
        // Send to bartering system if connected
        if (this.barteringConnection) {
            await this.sendProjectToBartering(projectNode);
        }
        
        return projectNode;
    }
    
    generateProjectName(idea) {
        if (idea.content?.title) {
            return idea.content.title;
        }
        
        const keywords = idea.content?.keywords || [];
        if (keywords.length >= 2) {
            return keywords.slice(0, 2)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ') + ' Project';
        }
        
        return `Personal Idea ${idea.id.substring(0, 6)}`;
    }
    
    generateProjectDescription(idea) {
        return idea.content?.description || 
               idea.raw_text || 
               'Personal project idea extracted from chat logs';
    }
    
    determineProjectStatus(idea) {
        const confidence = idea.content?.confidence || 0.5;
        
        if (confidence >= 0.8) return 'development';
        if (confidence >= 0.6) return 'concept';
        return 'planning';
    }
    
    determineProjectLayer(idea) {
        const tags = idea.tags || [];
        
        if (tags.some(tag => tag.includes('tech:'))) return 'technology';
        if (tags.some(tag => tag.includes('domain:business'))) return 'business';
        if (tags.some(tag => tag.includes('domain:entertainment'))) return 'entertainment';
        
        return 'personal';
    }
    
    determineProjectInputs(idea) {
        const type = idea.content?.type;
        
        switch (type) {
            case 'project':
                return ['requirements', 'resources', 'data'];
            case 'concept':
                return ['research', 'validation', 'feedback'];
            case 'problem':
                return ['problem_definition', 'constraints'];
            default:
                return ['ideas', 'inputs'];
        }
    }
    
    determineProjectOutputs(idea) {
        const type = idea.content?.type;
        
        switch (type) {
            case 'project':
                return ['application', 'system', 'deliverables'];
            case 'concept':
                return ['prototype', 'proof_of_concept'];
            case 'problem':
                return ['solution', 'fixes', 'improvements'];
            default:
                return ['results', 'outputs'];
        }
    }
    
    calculateProjectValue(idea) {
        let value = 0.5; // Base value
        
        const confidence = idea.content?.confidence || 0.5;
        const complexity = idea.content?.complexity;
        const keywords = idea.content?.keywords || [];
        
        // Confidence bonus
        value += confidence * 0.3;
        
        // Complexity bonus
        if (complexity === 'high') value += 0.2;
        else if (complexity === 'medium') value += 0.1;
        
        // Keyword diversity bonus
        value += Math.min(0.2, keywords.length * 0.02);
        
        return Math.min(1.0, value);
    }
    
    async connectToBarteringSystem() {
        try {
            this.barteringConnection = new WebSocket('ws://localhost:8084');
            
            this.barteringConnection.on('open', () => {
                console.log('🏛️ Connected to bartering system');
                this.npcIdentity.currentMood = 'connected';
            });
            
            this.barteringConnection.on('error', () => {
                console.log('⚠️ Bartering system not available, operating standalone');
                this.npcIdentity.currentMood = 'independent';
            });
            
        } catch (error) {
            console.log('⚠️ Could not connect to bartering system');
        }
    }
    
    async sendProjectToBartering(projectNode) {
        if (this.barteringConnection && this.barteringConnection.readyState === WebSocket.OPEN) {
            // Add project to bartering system
            console.log(`🏛️ Sending personal project to bartering: ${projectNode.name}`);
        }
    }
    
    async generateProjectsFromIdeas() {
        const projects = Array.from(this.personalDB.projectNodes.values())
            .filter(project => project.personal)
            .slice(-5); // Last 5 projects
        
        return projects.map(project => ({
            id: project.id,
            name: project.name,
            status: project.status,
            value: project.value
        }));
    }
    
    updateNPCMood(newMood) {
        this.npcIdentity.currentMood = newMood;
        return newMood;
    }
    
    // OCR Processing (placeholder for future implementation)
    async processImages(imagePath) {
        // TODO: Implement OCR with tesseract or similar
        console.log('📷 OCR processing not yet implemented');
        return null;
    }
    
    // File processing methods
    async processChatLogs(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            return await this.extractIdeasFromText(content, 'chat_log_file');
        } catch (error) {
            console.error('🚨 Error processing chat log:', error);
            return [];
        }
    }
    
    async processTextFiles(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            return await this.extractIdeasFromText(content, 'text_file');
        } catch (error) {
            console.error('🚨 Error processing text file:', error);
            return [];
        }
    }
    
    async processPrompts(promptText) {
        return await this.extractIdeasFromText(promptText, 'prompt');
    }
    
    async processDocuments(filePath) {
        // Handle different document types
        const ext = path.extname(filePath).toLowerCase();
        
        switch (ext) {
            case '.txt':
            case '.md':
                return await this.processTextFiles(filePath);
            case '.json':
                return await this.processJSONFile(filePath);
            default:
                console.log(`📄 Unsupported document type: ${ext}`);
                return [];
        }
    }
    
    async processJSONFile(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const data = JSON.parse(content);
            
            // Extract text from JSON for processing
            const textContent = this.extractTextFromJSON(data);
            return await this.extractIdeasFromText(textContent, 'json_file');
        } catch (error) {
            console.error('🚨 Error processing JSON file:', error);
            return [];
        }
    }
    
    extractTextFromJSON(obj) {
        let text = '';
        
        const extractRecursive = (item) => {
            if (typeof item === 'string') {
                text += item + ' ';
            } else if (Array.isArray(item)) {
                item.forEach(extractRecursive);
            } else if (typeof item === 'object' && item !== null) {
                Object.values(item).forEach(extractRecursive);
            }
        };
        
        extractRecursive(obj);
        return text;
    }
}

// Start the Personal Idea Extraction NPC
const ideasNPC = new PersonalIdeaExtractionNPC();

// Example usage - process some sample chat log content
setTimeout(async () => {
    const sampleChatLog = `
    I think we should build a system that can analyze chat logs and extract ideas automatically.
    Maybe we could create an AI that acts like an NPC character to help organize thoughts.
    What if we had a project bartering system where different ideas could trade resources?
    I have a problem with keeping track of all my different project concepts.
    Perhaps we need a way to evolve ideas and combine them into better projects.
    We should implement OCR so it can process images and documents too.
    `;
    
    console.log('🧪 Processing sample chat log...');
    const extractedIdeas = await ideasNPC.extractIdeasFromText(sampleChatLog, 'sample_chat');
    
    // Process each idea through the node network
    for (const idea of extractedIdeas) {
        await ideasNPC.processIdeaThroughNodes(idea);
    }
    
    await ideasNPC.savePersonalDatabase();
    console.log(`✅ Processed ${extractedIdeas.length} ideas from sample chat log`);
}, 3000);

module.exports = PersonalIdeaExtractionNPC;

console.log('🧠 Personal Idea Extraction NPC ready!');
console.log('🤖 Connect to ws://localhost:8085 to interact with Ideas NPC');
console.log('💬 Send your chat logs, prompts, and documents for processing');