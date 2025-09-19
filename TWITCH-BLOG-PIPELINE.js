#!/usr/bin/env node

/**
 * 📺📝 TWITCH CHAT TO BLOG PIPELINE
 * 
 * Real-time system that converts Twitch chat into polished blog posts
 * Live collaborative writing with chat suggestions and auto-completion
 * AI-powered content generation from stream conversations
 * 
 * Features:
 * - Real-time chat parsing for blog topic ideas
 * - Live collaborative writing with viewer input
 * - Auto-completion of blog posts from chat conversations
 * - Reading blog posts aloud during streams
 * - Multi-platform publishing (Medium, Dev.to, personal blog)
 * - SEO optimization and social media integration
 */

const EventEmitter = require('events');
const tmi = require('tmi.js');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

// Import existing systems
const TwitchDevBot = require('./twitch-dev-bot.js');
const BlogDevlogDistinctionSystem = require('./blog-devlog-distinction-system.js');
const UniversalAmazonTaxonomySystem = require('./UNIVERSAL-AMAZON-TAXONOMY-SYSTEM.js');

class TwitchBlogPipeline extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Twitch integration
            twitch: {
                channel: config.twitchChannel || process.env.TWITCH_CHANNEL,
                username: config.twitchUsername || process.env.TWITCH_BOT_USERNAME,
                oauth: config.twitchOAuth || process.env.TWITCH_OAUTH,
                enableChatParsing: true,
                enableLiveWriting: true,
                enableAutoReading: true
            },
            
            // Content generation
            contentGeneration: {
                minChatMessages: 10, // Minimum chat messages to trigger blog generation
                contextWindow: 300000, // 5 minutes context window
                enableAIEnhancement: true,
                enableRealTimeEditing: true,
                enableCollaborativeWriting: true,
                generateFromQuestions: true,
                generateFromExplanations: true
            },
            
            // Blog processing
            blogProcessing: {
                minWordCount: 300,
                maxWordCount: 3000,
                enableSEOOptimization: true,
                enableCategoryTagging: true,
                enableAutoFormatting: true,
                enableFactChecking: true
            },
            
            // Publishing
            publishing: {
                enableAutoPublish: false, // Require manual approval
                platforms: ['medium', 'dev.to', 'personal'],
                enableSocialSharing: true,
                enableNewsletterIntegration: true,
                scheduleOptimalTiming: true
            },
            
            // AI and processing
            ai: {
                model: 'gpt-3.5-turbo',
                temperature: 0.7,
                maxTokens: 2000,
                enableContentAnalysis: true,
                enableStyleConsistency: true,
                enableFactVerification: true
            },
            
            ...config
        };
        
        // Core components
        this.twitchBot = null;
        this.blogSystem = null;
        this.taxonomySystem = null;
        
        // Content processing
        this.chatBuffer = []; // Recent chat messages
        this.topicBuffer = new Map(); // Identified topics
        this.questionBuffer = []; // Questions from chat
        this.explanationBuffer = []; // Code explanations
        this.activeWritingSession = null;
        
        // Blog management
        this.draftPosts = new Map(); // Blog drafts
        this.publishedPosts = new Map(); // Published posts
        this.postQueue = []; // Posts waiting for publication
        this.contentIdeas = new Map(); // Content ideas from chat
        
        // Real-time collaboration
        this.liveEditingSessions = new Map();
        this.chatContributors = new Map(); // Users contributing to content
        this.votingPolls = new Map(); // Content voting polls
        
        // Analytics and insights
        this.analytics = {
            chatMessagesProcessed: 0,
            topicsIdentified: 0,
            blogPostsGenerated: 0,
            publishedPosts: 0,
            averageEngagement: 0,
            mostPopularTopics: [],
            bestPerformingPosts: [],
            contentCreationRate: 0
        };
        
        // Content categorization
        this.contentCategories = {
            'programming': ['code', 'javascript', 'python', 'api', 'function', 'bug', 'debug'],
            'tutorial': ['how to', 'tutorial', 'guide', 'step', 'learn', 'explain'],
            'review': ['review', 'opinion', 'thoughts', 'good', 'bad', 'like', 'dislike'],
            'news': ['news', 'update', 'release', 'announcement', 'new'],
            'question': ['?', 'how', 'what', 'why', 'when', 'where', 'question'],
            'explanation': ['explain', 'understand', 'clarify', 'meaning', 'definition'],
            'productivity': ['tips', 'productivity', 'workflow', 'efficiency', 'tool'],
            'career': ['job', 'career', 'interview', 'hiring', 'salary', 'advice']
        };
        
        console.log('📺 Twitch Blog Pipeline initialized');
        console.log(`🔗 Channel: ${this.config.twitch.channel}`);
        console.log(`🤖 AI model: ${this.config.ai.model}`);
        
        this.initialize();
    }
    
    /**
     * Initialize the pipeline system
     */
    async initialize() {
        try {
            console.log('🚀 Initializing Twitch Blog Pipeline...');
            
            // Initialize sub-systems
            await this.initializeTwitchBot();
            await this.initializeBlogSystem();
            await this.initializeTaxonomySystem();
            
            // Setup chat processing
            this.setupChatProcessing();
            
            // Setup content generation
            this.setupContentGeneration();
            
            // Start background processes
            this.startBackgroundProcesses();
            
            console.log('✅ Twitch Blog Pipeline ready');
            
            this.emit('pipeline_ready', {
                twitchConnected: !!this.twitchBot,
                blogSystemReady: !!this.blogSystem,
                taxonomyReady: !!this.taxonomySystem
            });
            
        } catch (error) {
            console.error('❌ Pipeline initialization failed:', error);
            throw error;
        }
    }
    
    /**
     * Initialize Twitch bot integration
     */
    async initializeTwitchBot() {
        try {
            this.twitchBot = new TwitchDevBot({
                channel: this.config.twitch.channel,
                username: this.config.twitch.username,
                oauth: this.config.twitch.oauth,
                repoPath: process.cwd()
            });
            
            // Listen for Twitch events
            this.twitchBot.on('connected', () => {
                console.log('📺 Twitch bot connected');
                this.emit('twitch_connected');
            });
            
            // Override message handling to capture for blog generation
            this.twitchBot.client.on('message', (channel, tags, message, self) => {
                if (!self) {
                    this.processChatMessage({
                        username: tags.username,
                        userId: tags['user-id'],
                        message,
                        timestamp: Date.now(),
                        badges: tags.badges,
                        emotes: tags.emotes
                    });
                }
            });
            
            await this.twitchBot.connect();
            
        } catch (error) {
            console.warn('⚠️ Twitch bot initialization failed:', error.message);
        }
    }
    
    /**
     * Initialize blog system
     */
    async initializeBlogSystem() {
        this.blogSystem = new BlogDevlogDistinctionSystem({
            enableDevlogToBlog: true,
            enableBlogToMagazine: true
        });
        
        this.blogSystem.on('distinction_system_ready', () => {
            console.log('📝 Blog system ready');
        });
        
        this.blogSystem.on('blog_article_created', (data) => {
            console.log(`📚 Blog article created: ${data.blogArticle.title}`);
            this.analytics.blogPostsGenerated++;
        });
    }
    
    /**
     * Initialize taxonomy system
     */
    async initializeTaxonomySystem() {
        this.taxonomySystem = new UniversalAmazonTaxonomySystem();
        
        this.taxonomySystem.on('taxonomy_ready', () => {
            console.log('🏷️ Taxonomy system ready');
        });
    }
    
    /**
     * Setup chat message processing
     */
    setupChatProcessing() {
        console.log('💬 Setting up chat processing...');
        
        // Process chat buffer every 30 seconds
        setInterval(() => {
            this.processChatBuffer();
        }, 30000);
        
        // Clean old messages every 5 minutes
        setInterval(() => {
            this.cleanChatBuffer();
        }, 300000);
    }
    
    /**
     * Process individual chat message
     */
    processChatMessage(chatMessage) {
        this.analytics.chatMessagesProcessed++;
        
        // Add to chat buffer
        this.chatBuffer.push({
            ...chatMessage,
            processed: false,
            categories: [],
            sentiment: null,
            importance: 0
        });
        
        // Analyze message immediately
        this.analyzeChatMessage(chatMessage);
        
        // Check for real-time triggers
        this.checkRealTimeTriggers(chatMessage);
    }
    
    /**
     * Analyze chat message for content potential
     */
    analyzeChatMessage(chatMessage) {
        const message = chatMessage.message.toLowerCase();
        const analysis = {
            categories: [],
            isQuestion: message.includes('?'),
            isExplanationRequest: false,
            hasCode: false,
            isComplaint: false,
            isPraise: false,
            importance: 0,
            contentPotential: 0
        };
        
        // Categorize message
        for (const [category, keywords] of Object.entries(this.contentCategories)) {
            const matches = keywords.filter(keyword => message.includes(keyword));
            if (matches.length > 0) {
                analysis.categories.push({
                    category,
                    confidence: matches.length / keywords.length,
                    keywords: matches
                });
            }
        }
        
        // Check for explanation requests
        const explanationTriggers = ['explain', 'how does', 'what is', 'can you show', 'why'];
        analysis.isExplanationRequest = explanationTriggers.some(trigger => message.includes(trigger));
        
        // Check for code-related content
        const codeKeywords = ['function', 'variable', 'class', 'method', 'api', 'error', 'bug', 'code'];
        analysis.hasCode = codeKeywords.some(keyword => message.includes(keyword));
        
        // Calculate importance score
        analysis.importance = this.calculateMessageImportance(chatMessage, analysis);
        
        // Calculate content potential
        analysis.contentPotential = this.calculateContentPotential(analysis);
        
        // Store analysis
        chatMessage.analysis = analysis;
        
        // Add to appropriate buffers
        if (analysis.isQuestion) {
            this.questionBuffer.push(chatMessage);
        }
        
        if (analysis.isExplanationRequest) {
            this.explanationBuffer.push(chatMessage);
        }
        
        // Identify topics
        if (analysis.contentPotential > 0.6) {
            this.identifyTopics(chatMessage);
        }
    }
    
    /**
     * Calculate message importance
     */
    calculateMessageImportance(chatMessage, analysis) {
        let importance = 0;
        
        // User factors
        const userId = chatMessage.userId;
        const userContributions = this.chatContributors.get(userId) || { messages: 0, quality: 0 };
        importance += Math.min(userContributions.quality / 10, 0.3);
        
        // Message factors
        if (analysis.isQuestion) importance += 0.3;
        if (analysis.isExplanationRequest) importance += 0.4;
        if (analysis.hasCode) importance += 0.2;
        if (analysis.categories.length > 0) importance += 0.2;
        
        // Length factor (medium length preferred)
        const messageLength = chatMessage.message.length;
        if (messageLength > 20 && messageLength < 200) importance += 0.1;
        
        return Math.min(importance, 1.0);
    }
    
    /**
     * Calculate content potential
     */
    calculateContentPotential(analysis) {
        let potential = 0;
        
        // Category bonuses
        analysis.categories.forEach(cat => {
            if (['tutorial', 'explanation', 'programming'].includes(cat.category)) {
                potential += cat.confidence * 0.4;
            } else {
                potential += cat.confidence * 0.2;
            }
        });
        
        // Content type bonuses
        if (analysis.isQuestion) potential += 0.3;
        if (analysis.isExplanationRequest) potential += 0.4;
        if (analysis.hasCode) potential += 0.3;
        
        return Math.min(potential, 1.0);
    }
    
    /**
     * Identify topics from chat message
     */
    identifyTopics(chatMessage) {
        const message = chatMessage.message;
        const topics = [];
        
        // Extract potential topics using simple keyword extraction
        const words = message.toLowerCase().split(/\s+/);
        const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
        
        // Find meaningful words
        const meaningfulWords = words.filter(word => 
            word.length > 3 && 
            !stopWords.has(word) && 
            !/^\d+$/.test(word)
        );
        
        // Look for programming terms
        const programmingTerms = meaningfulWords.filter(word => 
            ['javascript', 'python', 'react', 'nodejs', 'api', 'database', 'framework'].includes(word)
        );
        
        if (programmingTerms.length > 0) {
            topics.push({
                topic: programmingTerms.join(' '),
                type: 'programming',
                confidence: 0.8,
                keywords: programmingTerms
            });
        }
        
        // Store topics
        topics.forEach(topic => {
            const topicKey = topic.topic;
            if (!this.topicBuffer.has(topicKey)) {
                this.topicBuffer.set(topicKey, {
                    ...topic,
                    messages: [],
                    firstSeen: Date.now(),
                    lastSeen: Date.now(),
                    messageCount: 0,
                    totalConfidence: 0
                });
            }
            
            const topicData = this.topicBuffer.get(topicKey);
            topicData.messages.push(chatMessage);
            topicData.messageCount++;
            topicData.lastSeen = Date.now();
            topicData.totalConfidence += topic.confidence;
            
            this.analytics.topicsIdentified++;
        });
    }
    
    /**
     * Check for real-time content triggers
     */
    checkRealTimeTriggers(chatMessage) {
        const message = chatMessage.message.toLowerCase();
        
        // Immediate explanation requests
        if (message.includes('can you explain') || message.includes('how does this work')) {
            this.triggerLiveExplanation(chatMessage);
        }
        
        // Blog post requests
        if (message.includes('blog about') || message.includes('write about')) {
            this.triggerBlogRequest(chatMessage);
        }
        
        // Tutorial requests
        if (message.includes('tutorial') || message.includes('show how to')) {
            this.triggerTutorialRequest(chatMessage);
        }
    }
    
    /**
     * Process chat buffer for content generation
     */
    processChatBuffer() {
        if (this.chatBuffer.length < this.config.contentGeneration.minChatMessages) {
            return;
        }
        
        console.log(`💬 Processing ${this.chatBuffer.length} chat messages...`);
        
        // Analyze message clusters
        const clusters = this.analyzeMessageClusters();
        
        // Generate content ideas
        clusters.forEach(cluster => {
            if (cluster.contentPotential > 0.7) {
                this.generateContentIdea(cluster);
            }
        });
        
        // Mark messages as processed
        this.chatBuffer.forEach(msg => msg.processed = true);
    }
    
    /**
     * Analyze message clusters for content themes
     */
    analyzeMessageClusters() {
        const timeWindow = this.config.contentGeneration.contextWindow;
        const now = Date.now();
        
        // Group messages by time proximity and topic similarity
        const clusters = [];
        const recentMessages = this.chatBuffer.filter(msg => 
            now - msg.timestamp < timeWindow && !msg.processed
        );
        
        // Simple clustering by category overlap
        const categoryGroups = {};
        recentMessages.forEach(msg => {
            if (msg.analysis && msg.analysis.categories.length > 0) {
                msg.analysis.categories.forEach(cat => {
                    if (!categoryGroups[cat.category]) {
                        categoryGroups[cat.category] = [];
                    }
                    categoryGroups[cat.category].push(msg);
                });
            }
        });
        
        // Create clusters
        Object.entries(categoryGroups).forEach(([category, messages]) => {
            if (messages.length >= 3) { // Minimum cluster size
                const avgContentPotential = messages.reduce((sum, msg) => 
                    sum + (msg.analysis?.contentPotential || 0), 0
                ) / messages.length;
                
                clusters.push({
                    category,
                    messages,
                    messageCount: messages.length,
                    contentPotential: avgContentPotential,
                    timeSpan: Math.max(...messages.map(m => m.timestamp)) - Math.min(...messages.map(m => m.timestamp)),
                    uniqueUsers: new Set(messages.map(m => m.userId)).size
                });
            }
        });
        
        return clusters.sort((a, b) => b.contentPotential - a.contentPotential);
    }
    
    /**
     * Generate content idea from message cluster
     */
    generateContentIdea(cluster) {
        const ideaId = crypto.randomBytes(8).toString('hex');
        
        // Extract key themes
        const themes = this.extractThemes(cluster.messages);
        
        // Generate title suggestions
        const titleSuggestions = this.generateTitleSuggestions(cluster, themes);
        
        // Create content idea
        const contentIdea = {
            id: ideaId,
            category: cluster.category,
            themes,
            titleSuggestions,
            sourceMessages: cluster.messages.map(m => ({
                username: m.username,
                message: m.message,
                timestamp: m.timestamp
            })),
            contentPotential: cluster.contentPotential,
            estimatedWordCount: this.estimateWordCount(cluster),
            suggestedFormat: this.suggestFormat(cluster),
            tags: this.generateTags(themes),
            created: Date.now(),
            status: 'idea'
        };
        
        this.contentIdeas.set(ideaId, contentIdea);
        
        console.log(`💡 Generated content idea: ${titleSuggestions[0]}`);
        
        this.emit('content_idea_generated', contentIdea);
        
        // Auto-generate if high potential
        if (cluster.contentPotential > 0.85) {
            setTimeout(() => {
                this.generateBlogPost(ideaId);
            }, 5000); // Small delay for more messages
        }
    }
    
    /**
     * Extract themes from messages
     */
    extractThemes(messages) {
        const themes = [];
        const wordCounts = {};
        
        // Count significant words
        messages.forEach(msg => {
            const words = msg.message.toLowerCase()
                .split(/\s+/)
                .filter(word => word.length > 3 && !/^\d+$/.test(word));
            
            words.forEach(word => {
                wordCounts[word] = (wordCounts[word] || 0) + 1;
            });
        });
        
        // Extract top themes
        const sortedWords = Object.entries(wordCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10);
        
        sortedWords.forEach(([word, count]) => {
            if (count >= 2) { // Mentioned at least twice
                themes.push({
                    theme: word,
                    frequency: count,
                    relevance: count / messages.length
                });
            }
        });
        
        return themes;
    }
    
    /**
     * Generate title suggestions
     */
    generateTitleSuggestions(cluster, themes) {
        const category = cluster.category;
        const mainTheme = themes[0]?.theme || 'development';
        
        const templates = {
            programming: [
                `Understanding ${mainTheme} in JavaScript`,
                `A Developer's Guide to ${mainTheme}`,
                `${mainTheme}: Best Practices and Common Pitfalls`,
                `Mastering ${mainTheme} for Modern Web Development`
            ],
            tutorial: [
                `How to ${mainTheme}: A Step-by-Step Guide`,
                `Complete ${mainTheme} Tutorial for Beginners`,
                `Building with ${mainTheme}: From Zero to Hero`,
                `${mainTheme} Explained: Practical Examples`
            ],
            explanation: [
                `What is ${mainTheme}? A Complete Explanation`,
                `${mainTheme} Demystified: Understanding the Basics`,
                `Breaking Down ${mainTheme} for Developers`,
                `The Complete Guide to ${mainTheme}`
            ]
        };
        
        const categoryTemplates = templates[category] || templates.programming;
        return categoryTemplates.map(template => 
            template.replace(/\b\w/g, l => l.toUpperCase())
        );
    }
    
    /**
     * Generate blog post from content idea
     */
    async generateBlogPost(ideaId) {
        const contentIdea = this.contentIdeas.get(ideaId);
        if (!contentIdea) {
            throw new Error(`Content idea not found: ${ideaId}`);
        }
        
        console.log(`📝 Generating blog post: ${contentIdea.titleSuggestions[0]}`);
        
        try {
            // Generate content
            const blogContent = await this.generateBlogContent(contentIdea);
            
            // Create blog post
            const blogPost = {
                id: crypto.randomBytes(8).toString('hex'),
                ideaId,
                title: blogContent.title,
                content: blogContent.content,
                excerpt: blogContent.excerpt,
                tags: contentIdea.tags,
                category: contentIdea.category,
                wordCount: blogContent.wordCount,
                readingTime: Math.ceil(blogContent.wordCount / 200),
                sourceType: 'twitch-chat',
                sourceMessages: contentIdea.sourceMessages,
                seoMetadata: blogContent.seoMetadata,
                status: 'draft',
                created: Date.now(),
                lastModified: Date.now()
            };
            
            this.draftPosts.set(blogPost.id, blogPost);
            this.analytics.blogPostsGenerated++;
            
            console.log(`✅ Blog post generated: ${blogPost.title} (${blogPost.wordCount} words)`);
            
            this.emit('blog_post_generated', blogPost);
            
            // Announce in chat
            if (this.twitchBot && this.twitchBot.isConnected) {
                this.twitchBot.say(`📚 Blog post generated: "${blogPost.title}" | Based on your chat discussion! 🎉`);
            }
            
            return blogPost;
            
        } catch (error) {
            console.error('❌ Failed to generate blog post:', error);
            throw error;
        }
    }
    
    /**
     * Generate blog content using AI
     */
    async generateBlogContent(contentIdea) {
        // Extract context from source messages
        const chatContext = contentIdea.sourceMessages
            .map(msg => `${msg.username}: ${msg.message}`)
            .join('\n');
        
        // Create prompt for AI
        const prompt = this.createBlogPrompt(contentIdea, chatContext);
        
        // Simulate AI content generation (replace with actual AI call)
        const generatedContent = await this.simulateAIGeneration(prompt, contentIdea);
        
        return generatedContent;
    }
    
    /**
     * Create AI prompt for blog generation
     */
    createBlogPrompt(contentIdea, chatContext) {
        return `Generate a comprehensive blog post based on this Twitch chat discussion:

CHAT CONTEXT:
${chatContext}

REQUIREMENTS:
- Title: Choose from: ${contentIdea.titleSuggestions.join(', ')}
- Category: ${contentIdea.category}
- Main themes: ${contentIdea.themes.map(t => t.theme).join(', ')}
- Target word count: ${contentIdea.estimatedWordCount}
- Format: ${contentIdea.suggestedFormat}
- Audience: Developers and tech enthusiasts

STRUCTURE:
1. Engaging introduction that references the live discussion
2. Main content sections with code examples where relevant  
3. Practical applications and real-world use cases
4. Conclusion with key takeaways
5. Call-to-action encouraging engagement

TONE:
- Conversational but professional
- Include references to the live stream context
- Make it feel like an extension of the chat discussion
- Use examples that would resonate with the Twitch audience`;
    }
    
    /**
     * Simulate AI content generation
     */
    async simulateAIGeneration(prompt, contentIdea) {
        // Simulate AI processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const title = contentIdea.titleSuggestions[0];
        const mainTheme = contentIdea.themes[0]?.theme || 'development';
        
        const content = `# ${title}

## Introduction

During today's live stream, we had an amazing discussion about ${mainTheme} that sparked some great questions and insights from the chat. This post is a follow-up to that conversation, diving deeper into the concepts we explored together.

## Understanding ${mainTheme}

${mainTheme} is a fundamental concept that every developer should understand. As we discussed in the stream, it plays a crucial role in modern web development.

### Key Concepts

Based on the questions from chat, here are the key points we covered:

1. **Basic Understanding**: ${mainTheme} provides essential functionality for...
2. **Practical Applications**: Real-world scenarios where ${mainTheme} shines...
3. **Best Practices**: Tips and techniques we've learned from experience...

## Code Examples

Here's a practical example we worked through during the stream:

\`\`\`javascript
// Example code demonstrating ${mainTheme}
function example${mainTheme.charAt(0).toUpperCase() + mainTheme.slice(1)}() {
    // Implementation based on chat discussion
    console.log('This was inspired by our live coding session!');
}
\`\`\`

## Practical Applications

The chat brought up some excellent use cases for ${mainTheme}:

- Building interactive web applications
- Improving user experience
- Solving common development challenges
- Implementing best practices

## Key Takeaways

From our discussion today, here are the main points to remember:

1. ${mainTheme} is essential for modern development
2. Understanding the fundamentals is crucial
3. Practice makes perfect
4. The community's questions helped us explore deeper concepts

## Conclusion

Thanks to everyone who participated in today's chat! Your questions and insights made this exploration of ${mainTheme} much more engaging and comprehensive.

If you have more questions about ${mainTheme}, feel free to ask in the next stream or reach out on social media. Keep coding, and see you in the next stream!

---

*This post was generated from our live Twitch discussion. Join the stream to be part of future blog posts!*`;

        const excerpt = `A comprehensive guide to ${mainTheme} based on our live Twitch stream discussion, covering key concepts, practical examples, and community insights.`;
        
        return {
            title,
            content,
            excerpt,
            wordCount: content.split(/\s+/).length,
            seoMetadata: {
                metaDescription: excerpt,
                keywords: [mainTheme, 'development', 'programming', 'tutorial', 'live coding'],
                canonicalUrl: null,
                ogTitle: title,
                ogDescription: excerpt
            }
        };
    }
    
    /**
     * Helper methods
     */
    estimateWordCount(cluster) {
        const baseCount = cluster.messageCount * 50; // 50 words per message on average
        const categoryMultiplier = {
            'tutorial': 1.5,
            'explanation': 1.3,
            'programming': 1.4,
            'review': 1.2
        };
        
        const multiplier = categoryMultiplier[cluster.category] || 1.0;
        return Math.round(baseCount * multiplier);
    }
    
    suggestFormat(cluster) {
        const formats = {
            'tutorial': 'step-by-step guide',
            'explanation': 'explanatory article',
            'programming': 'technical deep-dive',
            'question': 'Q&A format',
            'review': 'opinion piece'
        };
        
        return formats[cluster.category] || 'informational article';
    }
    
    generateTags(themes) {
        const baseTags = ['development', 'programming', 'live-coding', 'twitch'];
        const themeTags = themes.map(t => t.theme);
        return [...new Set([...baseTags, ...themeTags])];
    }
    
    setupContentGeneration() {
        console.log('⚙️ Setting up content generation...');
        
        // Auto-generate content from high-potential ideas
        setInterval(() => {
            this.processContentIdeas();
        }, 60000); // Every minute
    }
    
    processContentIdeas() {
        for (const [ideaId, idea] of this.contentIdeas) {
            if (idea.status === 'idea' && idea.contentPotential > 0.8) {
                // Check if enough time has passed for more context
                const age = Date.now() - idea.created;
                if (age > 300000) { // 5 minutes
                    this.generateBlogPost(ideaId);
                    idea.status = 'generating';
                }
            }
        }
    }
    
    startBackgroundProcesses() {
        console.log('⚙️ Starting background processes...');
        
        // Clean old data periodically
        setInterval(() => {
            this.cleanOldData();
        }, 600000); // 10 minutes
        
        // Update analytics
        setInterval(() => {
            this.updateAnalytics();
        }, 300000); // 5 minutes
    }
    
    cleanChatBuffer() {
        const cutoff = Date.now() - this.config.contentGeneration.contextWindow;
        const originalLength = this.chatBuffer.length;
        
        this.chatBuffer = this.chatBuffer.filter(msg => msg.timestamp > cutoff);
        
        const cleaned = originalLength - this.chatBuffer.length;
        if (cleaned > 0) {
            console.log(`🧹 Cleaned ${cleaned} old chat messages`);
        }
    }
    
    cleanOldData() {
        const dayAgo = Date.now() - 86400000; // 24 hours
        
        // Clean old content ideas
        for (const [ideaId, idea] of this.contentIdeas) {
            if (idea.created < dayAgo && idea.status === 'idea') {
                this.contentIdeas.delete(ideaId);
            }
        }
        
        // Clean old topics
        for (const [topicKey, topic] of this.topicBuffer) {
            if (topic.lastSeen < dayAgo) {
                this.topicBuffer.delete(topicKey);
            }
        }
    }
    
    updateAnalytics() {
        // Calculate content creation rate
        const recentPosts = Array.from(this.draftPosts.values())
            .filter(post => Date.now() - post.created < 3600000); // Last hour
        
        this.analytics.contentCreationRate = recentPosts.length;
        
        // Update most popular topics
        const topicPopularity = Array.from(this.topicBuffer.entries())
            .map(([topic, data]) => ({ topic, messageCount: data.messageCount }))
            .sort((a, b) => b.messageCount - a.messageCount)
            .slice(0, 10);
        
        this.analytics.mostPopularTopics = topicPopularity;
    }
    
    // Real-time trigger methods
    triggerLiveExplanation(chatMessage) {
        console.log(`🎯 Live explanation triggered by ${chatMessage.username}`);
        
        if (this.twitchBot && this.twitchBot.isConnected) {
            this.twitchBot.say(`@${chatMessage.username} Great question! I'll explain this and create a blog post about it. 📝`);
        }
        
        // Create immediate content idea
        const ideaId = crypto.randomBytes(8).toString('hex');
        const contentIdea = {
            id: ideaId,
            category: 'explanation',
            themes: [{ theme: 'explanation', frequency: 1, relevance: 1 }],
            titleSuggestions: [`Explaining: ${chatMessage.message}`],
            sourceMessages: [chatMessage],
            contentPotential: 0.9,
            estimatedWordCount: 500,
            suggestedFormat: 'explanation',
            tags: ['explanation', 'live-stream', 'q&a'],
            created: Date.now(),
            status: 'priority'
        };
        
        this.contentIdeas.set(ideaId, contentIdea);
        
        // Generate immediately
        setTimeout(() => {
            this.generateBlogPost(ideaId);
        }, 10000); // 10 second delay
    }
    
    triggerBlogRequest(chatMessage) {
        console.log(`📝 Blog request from ${chatMessage.username}: ${chatMessage.message}`);
        
        if (this.twitchBot && this.twitchBot.isConnected) {
            this.twitchBot.say(`@${chatMessage.username} Blog request noted! I'll work on that topic. 📚`);
        }
    }
    
    triggerTutorialRequest(chatMessage) {
        console.log(`📖 Tutorial request from ${chatMessage.username}: ${chatMessage.message}`);
        
        if (this.twitchBot && this.twitchBot.isConnected) {
            this.twitchBot.say(`@${chatMessage.username} Tutorial idea added to the list! Stay tuned. 🎓`);
        }
    }
    
    /**
     * Get pipeline statistics
     */
    getStats() {
        return {
            ...this.analytics,
            chatBufferSize: this.chatBuffer.length,
            contentIdeas: this.contentIdeas.size,
            draftPosts: this.draftPosts.size,
            activeTopics: this.topicBuffer.size,
            questionsBuffer: this.questionBuffer.length
        };
    }
    
    /**
     * Get content ideas
     */
    getContentIdeas() {
        return Array.from(this.contentIdeas.values())
            .sort((a, b) => b.contentPotential - a.contentPotential);
    }
    
    /**
     * Get draft posts
     */
    getDraftPosts() {
        return Array.from(this.draftPosts.values())
            .sort((a, b) => b.created - a.created);
    }
}

module.exports = TwitchBlogPipeline;

// Example usage and testing
if (require.main === module) {
    console.log('📺 Twitch Blog Pipeline Test');
    
    const pipeline = new TwitchBlogPipeline({
        twitchChannel: process.env.TWITCH_CHANNEL || '#testchannel',
        twitchUsername: process.env.TWITCH_BOT_USERNAME || 'TestBot',
        twitchOAuth: process.env.TWITCH_OAUTH || 'oauth:test'
    });
    
    pipeline.on('pipeline_ready', () => {
        console.log('✅ Pipeline ready for content generation');
        
        // Simulate chat messages for testing
        setTimeout(() => {
            console.log('\n🧪 Simulating chat messages...');
            
            const testMessages = [
                { username: 'user1', message: 'Can you explain how async/await works?', userId: '1' },
                { username: 'user2', message: 'I always get confused with promises', userId: '2' },
                { username: 'user3', message: 'What\'s the difference between async and sync?', userId: '3' },
                { username: 'user1', message: 'Yeah async await is really useful for API calls', userId: '1' },
                { username: 'user4', message: 'Can you show a code example?', userId: '4' },
                { username: 'user5', message: 'I love how you explain JavaScript concepts', userId: '5' },
                { username: 'user2', message: 'This would make a great tutorial', userId: '2' },
                { username: 'user6', message: 'Please write a blog about this!', userId: '6' }
            ];
            
            testMessages.forEach((msg, index) => {
                setTimeout(() => {
                    pipeline.processChatMessage({
                        ...msg,
                        timestamp: Date.now(),
                        badges: {},
                        emotes: {}
                    });
                }, index * 2000); // 2 second intervals
            });
            
            // Show results after processing
            setTimeout(() => {
                console.log('\n📊 Pipeline Statistics:');
                const stats = pipeline.getStats();
                Object.entries(stats).forEach(([key, value]) => {
                    console.log(`  ${key}: ${value}`);
                });
                
                console.log('\n💡 Content Ideas:');
                const ideas = pipeline.getContentIdeas();
                ideas.forEach((idea, index) => {
                    console.log(`  ${index + 1}. ${idea.titleSuggestions[0]} (${idea.contentPotential.toFixed(2)})`);
                });
                
                console.log('\n📝 Draft Posts:');
                const drafts = pipeline.getDraftPosts();
                drafts.forEach((draft, index) => {
                    console.log(`  ${index + 1}. ${draft.title} (${draft.wordCount} words)`);
                });
                
            }, 20000); // 20 seconds for processing
            
        }, 3000);
    });
    
    pipeline.on('content_idea_generated', (idea) => {
        console.log(`💡 Content idea: ${idea.titleSuggestions[0]} (${idea.contentPotential.toFixed(2)})`);
    });
    
    pipeline.on('blog_post_generated', (post) => {
        console.log(`📚 Blog post: ${post.title} (${post.wordCount} words)`);
    });
}