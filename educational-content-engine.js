#!/usr/bin/env node
/**
 * 📚🎮 EDUCATIONAL CONTENT ENGINE
 * Transforms OSRS wiki knowledge into real-time teaching moments
 * AI gets smarter through community knowledge sharing and gameplay explanations
 */

const EventEmitter = require('events');
const WebSocket = require('ws');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class EducationalContentEngine extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Wiki and community data sources
            dataSources: {
                osrsWiki: {
                    enabled: true,
                    apiUrl: 'https://oldschool.runescape.wiki/api.php',
                    cacheTimeout: 3600000, // 1 hour
                    maxConcurrentRequests: 5
                },
                reddit: {
                    enabled: true,
                    apiUrl: 'https://www.reddit.com/r/2007scape',
                    cacheTimeout: 1800000, // 30 minutes
                    subreddits: ['2007scape', 'ironscape', 'OSRSProTips']
                },
                community: {
                    enabled: true,
                    forumScraping: false, // Disabled for compliance
                    userContributions: true
                }
            },
            
            // Educational modes
            teachingModes: {
                'beginner-tutorial': {
                    name: 'Beginner Tutorial Mode',
                    description: 'Basic game mechanics with step-by-step explanations',
                    detailLevel: 'comprehensive',
                    audience: 'new-players',
                    knowledgeDepth: 1,
                    pacingSpeed: 'slow'
                },
                'intermediate-strategy': {
                    name: 'Intermediate Strategy Mode', 
                    description: 'Advanced techniques and optimization strategies',
                    detailLevel: 'detailed',
                    audience: 'experienced-players',
                    knowledgeDepth: 2,
                    pacingSpeed: 'moderate'
                },
                'advanced-analysis': {
                    name: 'Advanced Analysis Mode',
                    description: 'Deep mechanics analysis and meta discussions',
                    detailLevel: 'expert',
                    audience: 'veterans',
                    knowledgeDepth: 3,
                    pacingSpeed: 'fast'
                },
                'customer-service-training': {
                    name: 'Customer Service Training Mode',
                    description: 'Real-world skills development through game scenarios',
                    detailLevel: 'practical',
                    audience: 'learners',
                    knowledgeDepth: 2,
                    pacingSpeed: 'educational'
                },
                'financial-literacy': {
                    name: 'Financial Literacy Mode',
                    description: 'GP management as real-world financial education',
                    detailLevel: 'applied',
                    audience: 'students',
                    knowledgeDepth: 2,
                    pacingSpeed: 'instructional'
                }
            },
            
            // Knowledge processing
            knowledgeProcessing: {
                aiExplanationEngine: true,
                contextAwareness: true,
                personalizedLearning: true,
                adaptiveComplexity: true,
                communityValidation: true
            },
            
            // Educational features  
            educationalFeatures: {
                realTimeExplanations: true,
                interactiveTutorials: true,
                skillAssessments: true,
                progressTracking: true,
                certificationSystem: true,
                peerLearning: true
            },
            
            // Social impact tracking
            socialImpact: {
                electricityJustification: true,
                learningGoalsRequired: true,
                educationalOutcomes: true,
                communityContribution: true,
                skillDevelopmentTracking: true
            },
            
            // Integration with existing systems
            integration: {
                runeliteController: {
                    enabled: true,
                    port: process.env.RUNELITE_PORT || 8095
                },
                headphoneBridge: {
                    enabled: true,
                    port: process.env.HEADPHONE_WS_PORT || 9903
                },
                streamingRouter: {
                    enabled: true,
                    port: process.env.STREAMING_PORT || 9900
                },
                wsPort: process.env.EDUCATIONAL_WS_PORT || 9906
            },
            
            ...config
        };
        
        // Knowledge databases
        this.wikiKnowledge = new Map();
        this.communityInsights = new Map();
        this.learningProgress = new Map();
        this.explanationHistory = new Map();
        
        // Educational state
        this.currentMode = 'beginner-tutorial';
        this.activeStudents = new Map();
        this.teachingSession = null;
        this.knowledgeNetwork = new Map();
        
        // Real-time explanation engine
        this.explanationQueue = [];
        this.pendingExplanations = new Map();
        this.explanationCache = new Map();
        
        // Community contribution tracking
        this.contributionScores = new Map();
        this.verifiedKnowledge = new Map();
        this.crowdsourcedExplanations = new Map();
        
        // Connections
        this.wsServer = null;
        this.connectedClients = new Set();
        this.runeliteConnection = null;
        this.streamingConnection = null;
        this.headphoneConnection = null;
        
        console.log('📚 Educational Content Engine initializing...');
        this.initialize();
    }
    
    async initialize() {
        try {
            // Load initial knowledge base
            await this.loadKnowledgeBase();
            
            // Start community data collection
            if (this.config.dataSources.reddit.enabled) {
                this.startCommunityDataCollection();
            }
            
            // Initialize AI explanation engine
            this.initializeExplanationEngine();
            
            // Start WebSocket server
            await this.startWebSocketServer();
            
            // Connect to existing systems
            await this.connectToSystems();
            
            // Start educational session management
            this.startSessionManagement();
            
            // Start social impact tracking
            if (this.config.socialImpact.electricityJustification) {
                this.startSocialImpactTracking();
            }
            
            console.log('✅ Educational Content Engine ready');
            console.log(`🎓 Available teaching modes: ${Object.keys(this.config.teachingModes).join(', ')}`);
            console.log(`🔗 WebSocket server: ws://localhost:${this.config.integration.wsPort}`);
            
            this.emit('ready');
            
        } catch (error) {
            console.error('❌ Failed to initialize Educational Content Engine:', error.message);
            throw error;
        }
    }
    
    // ==================== KNOWLEDGE BASE MANAGEMENT ====================
    
    async loadKnowledgeBase() {
        console.log('📖 Loading OSRS knowledge base...');
        
        try {
            // Load cached wiki data if available
            const cacheFile = path.join(__dirname, 'cache', 'wiki-knowledge.json');
            if (fs.existsSync(cacheFile)) {
                const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
                console.log(`📚 Loaded ${Object.keys(cached).length} cached wiki articles`);
                
                for (const [key, data] of Object.entries(cached)) {
                    this.wikiKnowledge.set(key, data);
                }
            }
            
            // Load essential articles for immediate use
            await this.loadEssentialArticles();
            
            console.log('✅ Knowledge base loaded successfully');
            
        } catch (error) {
            console.warn('⚠️ Could not load full knowledge base:', error.message);
            console.log('📋 Continuing with basic knowledge...');
        }
    }
    
    async loadEssentialArticles() {
        const essentialTopics = [
            'Combat', 'Trading', 'Skills', 'Quests', 'Grand Exchange',
            'Player versus player', 'Banking', 'Prayer', 'Magic', 'Ranged',
            'Customer support', 'Game mechanics', 'Economics'
        ];
        
        for (const topic of essentialTopics) {
            try {
                const article = await this.fetchWikiArticle(topic);
                if (article) {
                    this.wikiKnowledge.set(topic.toLowerCase(), {
                        title: topic,
                        content: article.content,
                        lastUpdated: Date.now(),
                        source: 'osrs-wiki',
                        verified: true
                    });
                    
                    // Add small delay to respect API limits
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            } catch (error) {
                console.warn(`⚠️ Could not load article: ${topic}`, error.message);
            }
        }
    }
    
    async fetchWikiArticle(title) {
        try {
            const response = await axios.get(this.config.dataSources.osrsWiki.apiUrl, {
                params: {
                    action: 'query',
                    format: 'json',
                    titles: title,
                    prop: 'extracts',
                    exintro: true,
                    explaintext: true,
                    exsectionformat: 'plain'
                },
                timeout: 10000
            });
            
            const pages = response.data.query?.pages;
            if (pages) {
                const page = Object.values(pages)[0];
                if (page && !page.missing) {
                    return {
                        title: page.title,
                        content: page.extract,
                        pageId: page.pageid
                    };
                }
            }
            
            return null;
            
        } catch (error) {
            console.error(`❌ Wiki API error for "${title}":`, error.message);
            return null;
        }
    }
    
    // ==================== COMMUNITY DATA COLLECTION ====================
    
    startCommunityDataCollection() {
        console.log('🌐 Starting community data collection...');
        
        // Collect Reddit insights periodically
        setInterval(() => {
            this.collectRedditInsights();
        }, this.config.dataSources.reddit.cacheTimeout);
        
        // Initial collection
        this.collectRedditInsights();
    }
    
    async collectRedditInsights() {
        try {
            for (const subreddit of this.config.dataSources.reddit.subreddits) {
                const insights = await this.fetchRedditInsights(subreddit);
                if (insights.length > 0) {
                    this.communityInsights.set(subreddit, {
                        insights,
                        lastUpdated: Date.now(),
                        source: 'reddit'
                    });
                    
                    console.log(`📊 Collected ${insights.length} insights from r/${subreddit}`);
                }
                
                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        } catch (error) {
            console.warn('⚠️ Community data collection error:', error.message);
        }
    }
    
    async fetchRedditInsights(subreddit) {
        try {
            // Using Reddit's JSON API (no authentication required for public posts)
            const response = await axios.get(`https://www.reddit.com/r/${subreddit}/hot.json`, {
                params: { limit: 25 },
                headers: { 'User-Agent': 'OSRSEducationalBot/1.0' },
                timeout: 10000
            });
            
            const posts = response.data?.data?.children || [];
            const insights = [];
            
            for (const post of posts) {
                const data = post.data;
                
                // Filter for educational/helpful content
                if (this.isEducationalContent(data.title, data.selftext)) {
                    insights.push({
                        title: data.title,
                        content: data.selftext,
                        score: data.score,
                        comments: data.num_comments,
                        url: data.url,
                        created: data.created_utc,
                        topics: this.extractTopics(data.title + ' ' + data.selftext)
                    });
                }
            }
            
            return insights;
            
        } catch (error) {
            console.warn(`⚠️ Reddit API error for r/${subreddit}:`, error.message);
            return [];
        }
    }
    
    isEducationalContent(title, content) {
        const educationalKeywords = [
            'guide', 'tutorial', 'tip', 'how to', 'learn', 'beginner',
            'strategy', 'method', 'efficient', 'optimal', 'training',
            'explain', 'help', 'question', 'advice', 'recommendation'
        ];
        
        const text = (title + ' ' + content).toLowerCase();
        return educationalKeywords.some(keyword => text.includes(keyword));
    }
    
    extractTopics(text) {
        const gameTopics = [
            'combat', 'trading', 'skilling', 'questing', 'pvm', 'pvp',
            'slayer', 'fishing', 'mining', 'woodcutting', 'farming',
            'cooking', 'prayer', 'magic', 'ranged', 'agility',
            'grand exchange', 'flipping', 'money making', 'banking'
        ];
        
        const lowerText = text.toLowerCase();
        return gameTopics.filter(topic => lowerText.includes(topic));
    }
    
    // ==================== EXPLANATION ENGINE ====================
    
    initializeExplanationEngine() {
        console.log('🧠 Initializing AI explanation engine...');
        
        // Process explanation queue
        setInterval(() => {
            this.processExplanationQueue();
        }, 500);
        
        // Update explanation cache
        setInterval(() => {
            this.updateExplanationCache();
        }, 30000);
    }
    
    async generateExplanation(gameAction, context = {}) {
        const explanationId = crypto.randomBytes(8).toString('hex');
        
        try {
            console.log(`🎓 Generating explanation for: ${gameAction.action}`);
            
            // Get relevant wiki knowledge
            const wikiContext = this.getRelevantWikiKnowledge(gameAction);
            
            // Get community insights
            const communityContext = this.getRelevantCommunityInsights(gameAction);
            
            // Generate explanation based on current teaching mode
            const explanation = await this.createExplanation(gameAction, wikiContext, communityContext, context);
            
            // Cache the explanation
            this.explanationCache.set(this.generateCacheKey(gameAction), explanation);
            
            // Track explanation in history
            this.explanationHistory.set(explanationId, {
                gameAction,
                explanation,
                context,
                timestamp: new Date(),
                mode: this.currentMode
            });
            
            this.emit('explanation-generated', {
                explanationId,
                gameAction,
                explanation,
                mode: this.currentMode
            });
            
            return explanation;
            
        } catch (error) {
            console.error('❌ Explanation generation error:', error.message);
            return this.getFallbackExplanation(gameAction);
        }
    }
    
    getRelevantWikiKnowledge(gameAction) {
        const relevantTopics = this.identifyRelevantTopics(gameAction);
        const knowledge = [];
        
        for (const topic of relevantTopics) {
            const wikiData = this.wikiKnowledge.get(topic);
            if (wikiData) {
                knowledge.push({
                    topic,
                    content: wikiData.content.substring(0, 500), // Limit content length
                    verified: wikiData.verified
                });
            }
        }
        
        return knowledge;
    }
    
    getRelevantCommunityInsights(gameAction) {
        const insights = [];
        
        for (const [subreddit, data] of this.communityInsights.entries()) {
            const relevantInsights = data.insights.filter(insight => 
                this.isInsightRelevant(insight, gameAction)
            );
            
            insights.push(...relevantInsights.map(insight => ({
                ...insight,
                source: subreddit,
                relevanceScore: this.calculateRelevanceScore(insight, gameAction)
            })));
        }
        
        // Sort by relevance and take top 3
        return insights
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, 3);
    }
    
    identifyRelevantTopics(gameAction) {
        const actionTopicMap = {
            'attack': ['combat', 'player versus player'],
            'eat': ['combat', 'food'],
            'bank': ['banking', 'game mechanics'],
            'trade': ['trading', 'grand exchange'],
            'quest': ['quests', 'game mechanics'],
            'skill': ['skills', 'training'],
            'move': ['game mechanics', 'navigation'],
            'pray': ['prayer', 'combat'],
            'spell': ['magic', 'combat'],
            'teleport': ['magic', 'transportation']
        };
        
        const actionType = gameAction.action.toLowerCase();
        const topics = [];
        
        // Find direct matches
        for (const [key, relatedTopics] of Object.entries(actionTopicMap)) {
            if (actionType.includes(key)) {
                topics.push(...relatedTopics);
            }
        }
        
        // Add general topics if no specific match
        if (topics.length === 0) {
            topics.push('game mechanics');
        }
        
        return [...new Set(topics)]; // Remove duplicates
    }
    
    isInsightRelevant(insight, gameAction) {
        const actionText = gameAction.action.toLowerCase();
        const insightText = (insight.title + ' ' + insight.content).toLowerCase();
        
        // Simple relevance check - could be enhanced with NLP
        const commonWords = actionText.split(' ').filter(word => 
            word.length > 3 && insightText.includes(word)
        );
        
        return commonWords.length > 0 || insight.topics.some(topic => actionText.includes(topic));
    }
    
    calculateRelevanceScore(insight, gameAction) {
        let score = 0;
        
        // Reddit score factor
        score += Math.log(insight.score + 1) * 0.1;
        
        // Topic relevance
        const actionText = gameAction.action.toLowerCase();
        score += insight.topics.filter(topic => actionText.includes(topic)).length * 2;
        
        // Freshness factor
        const ageInDays = (Date.now() - insight.created * 1000) / (1000 * 60 * 60 * 24);
        score += Math.max(0, 7 - ageInDays) * 0.5;
        
        return score;
    }
    
    async createExplanation(gameAction, wikiContext, communityContext, context) {
        const mode = this.config.teachingModes[this.currentMode];
        
        let explanation = {
            action: gameAction.action,
            basicExplanation: this.generateBasicExplanation(gameAction, wikiContext),
            detailedAnalysis: null,
            communityInsights: null,
            practicalTips: null,
            learningObjectives: null,
            skillsTransfer: null,
            mode: this.currentMode,
            timestamp: new Date()
        };
        
        // Add detail based on teaching mode
        if (mode.detailLevel === 'comprehensive' || mode.detailLevel === 'detailed') {
            explanation.detailedAnalysis = this.generateDetailedAnalysis(gameAction, wikiContext);
        }
        
        if (mode.detailLevel === 'expert' || mode.audience === 'experienced-players') {
            explanation.communityInsights = this.generateCommunityInsights(communityContext);
        }
        
        // Add educational elements for learning modes
        if (this.currentMode === 'customer-service-training') {
            explanation.skillsTransfer = this.generateCustomerServiceSkills(gameAction);
            explanation.learningObjectives = this.generateLearningObjectives(gameAction, 'customer-service');
        }
        
        if (this.currentMode === 'financial-literacy') {
            explanation.skillsTransfer = this.generateFinancialSkills(gameAction);
            explanation.learningObjectives = this.generateLearningObjectives(gameAction, 'financial');
        }
        
        // Add practical tips
        explanation.practicalTips = this.generatePracticalTips(gameAction, communityContext);
        
        return explanation;
    }
    
    generateBasicExplanation(gameAction, wikiContext) {
        if (wikiContext.length > 0) {
            const primaryContext = wikiContext[0];
            return `${gameAction.action}: ${primaryContext.content.substring(0, 200)}...`;
        }
        
        return `Performing ${gameAction.action} - a common OSRS action with strategic implications.`;
    }
    
    generateDetailedAnalysis(gameAction, wikiContext) {
        const analysis = {
            mechanicsExplanation: 'Detailed game mechanics behind this action',
            strategyImplications: 'How this action fits into optimal strategies',
            riskAssessment: 'Potential risks and mitigation strategies',
            efficiencyNotes: 'Tips for maximum efficiency'
        };
        
        // Customize based on wiki context
        if (wikiContext.length > 0) {
            analysis.wikiReference = wikiContext[0].topic;
            analysis.mechanicsExplanation = wikiContext[0].content.substring(0, 300);
        }
        
        return analysis;
    }
    
    generateCommunityInsights(communityContext) {
        if (communityContext.length === 0) return null;
        
        return {
            topInsights: communityContext.map(insight => ({
                title: insight.title,
                summary: insight.content.substring(0, 150),
                source: insight.source,
                score: insight.score
            })),
            communityConsensus: 'General community opinion on this action',
            proTips: 'Advanced tips from experienced players'
        };
    }
    
    generateCustomerServiceSkills(gameAction) {
        const skillsMap = {
            'trade': {
                skills: ['Negotiation', 'Trust building', 'Fair dealing'],
                explanation: 'Trading in OSRS teaches negotiation and trust-building skills valuable in customer service',
                realWorldApplication: 'These skills transfer to handling customer complaints and building relationships'
            },
            'help': {
                skills: ['Active listening', 'Problem solving', 'Empathy'],
                explanation: 'Helping other players develops active listening and problem-solving abilities',
                realWorldApplication: 'Direct correlation to customer support scenarios and issue resolution'
            },
            'explain': {
                skills: ['Clear communication', 'Patience', 'Teaching ability'],
                explanation: 'Explaining game mechanics develops clear communication and teaching skills',
                realWorldApplication: 'Essential for customer education and support documentation'
            }
        };
        
        const actionType = gameAction.action.toLowerCase();
        for (const [key, skillData] of Object.entries(skillsMap)) {
            if (actionType.includes(key)) {
                return skillData;
            }
        }
        
        return {
            skills: ['Problem solving', 'Decision making'],
            explanation: 'All OSRS actions develop problem-solving and decision-making abilities',
            realWorldApplication: 'These core skills are fundamental to excellent customer service'
        };
    }
    
    generateFinancialSkills(gameAction) {
        const financialSkillsMap = {
            'buy': {
                skills: ['Budgeting', 'Value assessment', 'Market analysis'],
                explanation: 'GP purchases teach budgeting and value assessment skills',
                realWorldApplication: 'Directly applicable to personal budgeting and investment decisions'
            },
            'sell': {
                skills: ['Profit calculation', 'Market timing', 'Risk management'],
                explanation: 'Selling items develops profit calculation and market timing abilities',
                realWorldApplication: 'Valuable for personal finance and investment strategies'
            },
            'invest': {
                skills: ['Long-term planning', 'Risk assessment', 'Portfolio management'],
                explanation: 'GP investment strategies mirror real-world investment principles',
                realWorldApplication: 'Foundation for understanding stocks, bonds, and retirement planning'
            }
        };
        
        const actionType = gameAction.action.toLowerCase();
        for (const [key, skillData] of Object.entries(financialSkillsMap)) {
            if (actionType.includes(key)) {
                return skillData;
            }
        }
        
        return {
            skills: ['Resource management', 'Opportunity cost'],
            explanation: 'All OSRS economic actions teach resource management and opportunity cost',
            realWorldApplication: 'Core concepts for personal financial literacy and planning'
        };
    }
    
    generateLearningObjectives(gameAction, category) {
        const objectives = {
            'customer-service': [
                'Understand customer needs through active listening',
                'Develop empathy and patience in difficult situations',
                'Learn to explain complex concepts clearly',
                'Practice problem-solving under pressure'
            ],
            'financial': [
                'Understand the relationship between risk and reward',
                'Learn to calculate profit margins and opportunity costs',
                'Develop budgeting and resource allocation skills',
                'Practice long-term planning and goal setting'
            ]
        };
        
        return objectives[category] || [
            'Develop strategic thinking abilities',
            'Learn to make decisions under uncertainty',
            'Practice goal-oriented behavior'
        ];
    }
    
    generatePracticalTips(gameAction, communityContext) {
        const tips = [];
        
        // Add community-sourced tips
        if (communityContext.length > 0) {
            const topInsight = communityContext[0];
            tips.push({
                type: 'community',
                tip: topInsight.content.substring(0, 100),
                source: topInsight.source
            });
        }
        
        // Add general tips based on action
        tips.push({
            type: 'general',
            tip: `Always consider the efficiency and safety of ${gameAction.action}`,
            source: 'wiki'
        });
        
        return tips;
    }
    
    getFallbackExplanation(gameAction) {
        return {
            action: gameAction.action,
            basicExplanation: `Performing ${gameAction.action} in OSRS - a strategic decision with multiple considerations.`,
            mode: this.currentMode,
            timestamp: new Date(),
            fallback: true
        };
    }
    
    processExplanationQueue() {
        while (this.explanationQueue.length > 0) {
            const request = this.explanationQueue.shift();
            this.generateExplanation(request.gameAction, request.context);
        }
    }
    
    updateExplanationCache() {
        // Clean old cache entries
        const maxAge = 3600000; // 1 hour
        const now = Date.now();
        
        for (const [key, explanation] of this.explanationCache.entries()) {
            if (now - explanation.timestamp.getTime() > maxAge) {
                this.explanationCache.delete(key);
            }
        }
        
        console.log(`🗄️ Explanation cache: ${this.explanationCache.size} entries`);
    }
    
    generateCacheKey(gameAction) {
        return crypto.createHash('md5')
            .update(`${gameAction.action}_${this.currentMode}_${JSON.stringify(gameAction.parameters || [])}`)
            .digest('hex');
    }
    
    // ==================== WEBSOCKET SERVER ====================
    
    async startWebSocketServer() {
        return new Promise((resolve) => {
            this.wsServer = new WebSocket.Server({ 
                port: this.config.integration.wsPort,
                perMessageDeflate: false 
            });
            
            this.wsServer.on('connection', (ws, req) => {
                const clientId = crypto.randomBytes(8).toString('hex');
                console.log(`🎓 Student connected: ${clientId}`);
                
                const client = { id: clientId, ws, joinedAt: new Date() };
                this.connectedClients.add(client);
                
                // Send initial teaching state
                ws.send(JSON.stringify({
                    type: 'teaching-status',
                    data: {
                        currentMode: this.currentMode,
                        availableModes: Object.keys(this.config.teachingModes),
                        knowledgeStats: {
                            wikiArticles: this.wikiKnowledge.size,
                            communityInsights: Array.from(this.communityInsights.values()).reduce((total, data) => total + data.insights.length, 0),
                            explanationsGenerated: this.explanationHistory.size
                        }
                    }
                }));
                
                ws.on('message', async (message) => {
                    try {
                        const data = JSON.parse(message);
                        await this.handleWebSocketMessage(ws, data, clientId);
                    } catch (error) {
                        console.error('❌ WebSocket message error:', error.message);
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: error.message
                        }));
                    }
                });
                
                ws.on('close', () => {
                    console.log(`🎓 Student disconnected: ${clientId}`);
                    this.connectedClients = new Set([...this.connectedClients].filter(c => c.id !== clientId));
                    this.activeStudents.delete(clientId);
                });
            });
            
            console.log(`🎓 Educational WebSocket server listening on port ${this.config.integration.wsPort}`);
            resolve();
        });
    }
    
    async handleWebSocketMessage(ws, data, clientId) {
        switch (data.type) {
            case 'set-teaching-mode':
                this.setTeachingMode(data.mode);
                ws.send(JSON.stringify({
                    type: 'mode-changed',
                    mode: this.currentMode,
                    modeConfig: this.config.teachingModes[this.currentMode]
                }));
                break;
                
            case 'request-explanation':
                const explanation = await this.generateExplanation(data.gameAction, data.context);
                ws.send(JSON.stringify({
                    type: 'explanation',
                    explanation,
                    gameAction: data.gameAction
                }));
                break;
                
            case 'contribute-knowledge':
                this.processKnowledgeContribution(clientId, data.contribution);
                ws.send(JSON.stringify({
                    type: 'contribution-received',
                    contributionId: data.contribution.id
                }));
                break;
                
            case 'start-learning-session':
                this.startLearningSession(clientId, data.goals);
                ws.send(JSON.stringify({
                    type: 'session-started',
                    sessionId: clientId,
                    goals: data.goals
                }));
                break;
                
            case 'get-learning-progress':
                const progress = this.learningProgress.get(clientId);
                ws.send(JSON.stringify({
                    type: 'learning-progress',
                    progress: progress || {}
                }));
                break;
                
            default:
                console.warn('❓ Unknown message type:', data.type);
        }
    }
    
    // ==================== TEACHING MODE MANAGEMENT ====================
    
    setTeachingMode(mode) {
        if (!this.config.teachingModes[mode]) {
            console.warn('❓ Unknown teaching mode:', mode);
            return;
        }
        
        const previousMode = this.currentMode;
        this.currentMode = mode;
        
        console.log(`🎓 Teaching mode changed: ${previousMode} → ${mode}`);
        
        // Clear explanation cache when mode changes
        this.explanationCache.clear();
        
        this.emit('teaching-mode-changed', {
            previousMode,
            newMode: mode,
            modeConfig: this.config.teachingModes[mode]
        });
        
        // Broadcast to all connected clients
        this.broadcastToClients({
            type: 'mode-changed',
            mode: this.currentMode,
            modeConfig: this.config.teachingModes[mode]
        });
    }
    
    // ==================== LEARNING SESSION MANAGEMENT ====================
    
    startSessionManagement() {
        console.log('📝 Starting educational session management...');
        
        // Track session progress
        setInterval(() => {
            this.updateSessionProgress();
        }, 60000); // Every minute
        
        // Generate session reports
        setInterval(() => {
            this.generateSessionReports();
        }, 300000); // Every 5 minutes
    }
    
    startLearningSession(clientId, goals) {
        console.log(`🎯 Starting learning session for ${clientId} with goals:`, goals);
        
        this.activeStudents.set(clientId, {
            sessionId: clientId,
            goals: goals,
            startTime: new Date(),
            progress: {
                explanationsReceived: 0,
                conceptsLearned: [],
                skillsAssessed: [],
                contributionsMade: 0
            },
            mode: this.currentMode
        });
    }
    
    updateSessionProgress() {
        for (const [clientId, session] of this.activeStudents.entries()) {
            // Update learning progress
            const progress = {
                ...session.progress,
                sessionDuration: Date.now() - session.startTime.getTime(),
                currentMode: this.currentMode,
                lastActivity: new Date()
            };
            
            this.learningProgress.set(clientId, progress);
        }
    }
    
    generateSessionReports() {
        for (const [clientId, session] of this.activeStudents.entries()) {
            const report = {
                sessionId: clientId,
                duration: Date.now() - session.startTime.getTime(),
                goals: session.goals,
                progress: this.learningProgress.get(clientId),
                achievements: this.calculateAchievements(session),
                recommendations: this.generateRecommendations(session)
            };
            
            this.emit('session-report', report);
        }
    }
    
    calculateAchievements(session) {
        const achievements = [];
        const progress = session.progress;
        
        if (progress.explanationsReceived >= 10) {
            achievements.push('Knowledge Seeker - Received 10+ explanations');
        }
        
        if (progress.conceptsLearned.length >= 5) {
            achievements.push('Concept Master - Learned 5+ new concepts');
        }
        
        if (progress.contributionsMade >= 3) {
            achievements.push('Community Contributor - Made 3+ knowledge contributions');
        }
        
        return achievements;
    }
    
    generateRecommendations(session) {
        const recommendations = [];
        const progress = session.progress;
        
        if (progress.explanationsReceived < 5) {
            recommendations.push('Try requesting more explanations during gameplay');
        }
        
        if (progress.contributionsMade === 0) {
            recommendations.push('Consider contributing your own insights to help others learn');
        }
        
        if (session.goals.includes('customer-service') && this.currentMode !== 'customer-service-training') {
            recommendations.push('Switch to Customer Service Training mode for focused skill development');
        }
        
        return recommendations;
    }
    
    // ==================== COMMUNITY CONTRIBUTION PROCESSING ====================
    
    processKnowledgeContribution(clientId, contribution) {
        console.log(`💡 Processing knowledge contribution from ${clientId}`);
        
        const contributionId = crypto.randomBytes(8).toString('hex');
        
        // Store contribution for verification
        this.crowdsourcedExplanations.set(contributionId, {
            id: contributionId,
            clientId,
            content: contribution.content,
            topic: contribution.topic,
            submittedAt: new Date(),
            verified: false,
            upvotes: 0,
            downvotes: 0
        });
        
        // Update contributor score
        const currentScore = this.contributionScores.get(clientId) || 0;
        this.contributionScores.set(clientId, currentScore + 1);
        
        // Update student progress
        const student = this.activeStudents.get(clientId);
        if (student) {
            student.progress.contributionsMade++;
        }
        
        this.emit('knowledge-contributed', {
            contributionId,
            clientId,
            topic: contribution.topic
        });
    }
    
    // ==================== SOCIAL IMPACT TRACKING ====================
    
    startSocialImpactTracking() {
        console.log('🌍 Starting social impact tracking...');
        
        // Track electricity usage justification
        setInterval(() => {
            this.assessElectricityJustification();
        }, 300000); // Every 5 minutes
        
        // Generate impact reports
        setInterval(() => {
            this.generateImpactReport();
        }, 3600000); // Every hour
    }
    
    assessElectricityJustification() {
        const activeStudents = this.activeStudents.size;
        const explanationsGenerated = this.explanationHistory.size;
        const communityContributions = this.crowdsourcedExplanations.size;
        
        const justificationScore = (activeStudents * 10) + (explanationsGenerated * 2) + (communityContributions * 5);
        
        const justification = {
            timestamp: new Date(),
            activeStudents,
            explanationsGenerated,
            communityContributions,
            justificationScore,
            electricityJustified: justificationScore > 50, // Threshold for justification
            reasoning: justificationScore > 50 ? 
                'Educational value generated justifies resource usage' :
                'Insufficient educational value - consider increasing engagement'
        };
        
        this.emit('electricity-justification', justification);
        
        if (!justification.electricityJustified) {
            console.warn('⚠️ Electricity usage not sufficiently justified by educational impact');
        }
    }
    
    generateImpactReport() {
        const report = {
            timestamp: new Date(),
            metrics: {
                totalStudents: this.learningProgress.size,
                activeStudents: this.activeStudents.size,
                explanationsGenerated: this.explanationHistory.size,
                knowledgeContributions: this.crowdsourcedExplanations.size,
                wikiArticlesUsed: this.wikiKnowledge.size,
                communityInsightsCollected: Array.from(this.communityInsights.values()).reduce((total, data) => total + data.insights.length, 0)
            },
            socialImpact: {
                educationalOutcomes: this.calculateEducationalOutcomes(),
                communityBenefit: this.calculateCommunityBenefit(),
                skillsDeveloped: this.calculateSkillsDevelopment()
            }
        };
        
        this.emit('social-impact-report', report);
        console.log('🌍 Social impact report generated:', report.metrics);
    }
    
    calculateEducationalOutcomes() {
        let outcomes = 0;
        
        // Count learning sessions with clear goals
        for (const [clientId, progress] of this.learningProgress.entries()) {
            if (progress.conceptsLearned && progress.conceptsLearned.length > 0) {
                outcomes += progress.conceptsLearned.length;
            }
        }
        
        return outcomes;
    }
    
    calculateCommunityBenefit() {
        // Verified community contributions + knowledge sharing
        return this.crowdsourcedExplanations.size + Array.from(this.contributionScores.values()).reduce((a, b) => a + b, 0);
    }
    
    calculateSkillsDevelopment() {
        const skills = {
            customerService: 0,
            financialLiteracy: 0,
            problemSolving: 0,
            communication: 0
        };
        
        for (const [id, explanation] of this.explanationHistory.entries()) {
            if (explanation.explanation.skillsTransfer) {
                const transferType = explanation.mode;
                if (transferType === 'customer-service-training') {
                    skills.customerService++;
                } else if (transferType === 'financial-literacy') {
                    skills.financialLiteracy++;
                }
                skills.problemSolving++;
                skills.communication++;
            }
        }
        
        return skills;
    }
    
    // ==================== SYSTEM INTEGRATION ====================
    
    async connectToSystems() {
        console.log('🔗 Connecting to existing systems...');
        
        // Connect to RuneLite AI Controller
        if (this.config.integration.runeliteController.enabled) {
            try {
                this.runeliteConnection = new WebSocket(`ws://localhost:${this.config.integration.runeliteController.port}`);
                
                this.runeliteConnection.on('open', () => {
                    console.log('✅ Connected to RuneLite AI Controller');
                });
                
                this.runeliteConnection.on('message', (data) => {
                    this.handleRuneLiteMessage(JSON.parse(data));
                });
                
            } catch (error) {
                console.warn('⚠️ Could not connect to RuneLite AI Controller:', error.message);
            }
        }
        
        // Connect to other systems...
    }
    
    handleRuneLiteMessage(message) {
        switch (message.type) {
            case 'game-action':
                // Generate explanation for game action
                this.explanationQueue.push({
                    gameAction: message.action,
                    context: { source: 'runelite-ai', timestamp: new Date() }
                });
                break;
                
            case 'player-learning-request':
                // Handle learning requests from game
                this.handleLearningRequest(message.request);
                break;
                
            default:
                console.log('📨 Received message from RuneLite:', message.type);
        }
    }
    
    async handleLearningRequest(request) {
        console.log(`🎓 Handling learning request: ${request.topic}`);
        
        const explanation = await this.generateExplanation({
            action: request.topic,
            parameters: request.parameters || []
        }, { source: 'learning-request' });
        
        // Send explanation back to RuneLite
        if (this.runeliteConnection) {
            this.runeliteConnection.send(JSON.stringify({
                type: 'explanation-response',
                explanation,
                requestId: request.id
            }));
        }
        
        // Broadcast to educational clients
        this.broadcastToClients({
            type: 'learning-explanation',
            explanation,
            topic: request.topic
        });
    }
    
    // ==================== UTILITY METHODS ====================
    
    broadcastToClients(data) {
        this.connectedClients.forEach(client => {
            if (client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(JSON.stringify(data));
            }
        });
    }
    
    getEducationalStats() {
        return {
            currentMode: this.currentMode,
            activeStudents: this.activeStudents.size,
            totalStudents: this.learningProgress.size,
            knowledgeBase: {
                wikiArticles: this.wikiKnowledge.size,
                communityInsights: Array.from(this.communityInsights.values()).reduce((total, data) => total + data.insights.length, 0),
                crowdsourcedExplanations: this.crowdsourcedExplanations.size
            },
            explanations: {
                total: this.explanationHistory.size,
                cached: this.explanationCache.size,
                queued: this.explanationQueue.length
            },
            socialImpact: {
                electricityJustified: true, // Would be calculated dynamically
                educationalOutcomes: this.calculateEducationalOutcomes(),
                communityBenefit: this.calculateCommunityBenefit()
            }
        };
    }
    
    // ==================== CLEANUP ====================
    
    async shutdown() {
        console.log('🛑 Shutting down Educational Content Engine...');
        
        // Save knowledge base
        await this.saveKnowledgeBase();
        
        // Close connections
        if (this.runeliteConnection) this.runeliteConnection.close();
        if (this.streamingConnection) this.streamingConnection.close();
        if (this.headphoneConnection) this.headphoneConnection.close();
        
        // Close WebSocket server
        if (this.wsServer) {
            this.wsServer.close();
        }
        
        console.log('✅ Educational Content Engine shutdown complete');
    }
    
    async saveKnowledgeBase() {
        try {
            const cacheDir = path.join(__dirname, 'cache');
            if (!fs.existsSync(cacheDir)) {
                fs.mkdirSync(cacheDir, { recursive: true });
            }
            
            const wikiData = {};
            for (const [key, value] of this.wikiKnowledge.entries()) {
                wikiData[key] = value;
            }
            
            fs.writeFileSync(
                path.join(cacheDir, 'wiki-knowledge.json'),
                JSON.stringify(wikiData, null, 2)
            );
            
            console.log('💾 Knowledge base saved successfully');
            
        } catch (error) {
            console.error('❌ Failed to save knowledge base:', error.message);
        }
    }
}

// Auto-start if running directly
if (require.main === module) {
    const engine = new EducationalContentEngine();
    
    // Handle shutdown gracefully
    process.on('SIGINT', async () => {
        console.log('\n🛑 Received SIGINT, shutting down...');
        await engine.shutdown();
        process.exit(0);
    });
    
    engine.on('ready', () => {
        console.log('🌟 Educational Content Engine is ready for students!');
        console.log(`🎓 Teaching mode: ${engine.currentMode}`);
        console.log(`📚 Knowledge base: ${engine.wikiKnowledge.size} wiki articles loaded`);
        console.log('\n💡 Available teaching modes:');
        Object.entries(engine.config.teachingModes).forEach(([key, mode]) => {
            console.log(`  ${key}: ${mode.description}`);
        });
    });
    
    engine.on('explanation-generated', (event) => {
        console.log(`🎓 Explanation generated for: ${event.gameAction.action} (mode: ${event.mode})`);
    });
    
    engine.on('knowledge-contributed', (event) => {
        console.log(`💡 Knowledge contributed by ${event.clientId}: ${event.topic}`);
    });
    
    engine.on('teaching-mode-changed', (event) => {
        console.log(`🔄 Teaching mode changed: ${event.previousMode} → ${event.newMode}`);
    });
}

module.exports = EducationalContentEngine;