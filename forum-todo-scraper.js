#!/usr/bin/env node

/**
 * 🕷️ FORUM-TODO SCRAPER
 * 
 * Monitors forum activity related to todos and feeds insights back into the git-based todo system
 * Completes the feedback loop: Todo → LLM → Forum → Gaming → Scraper → Todo Updates
 */

const EventEmitter = require('events');
const fs = require('fs');
const path = require('path');

class ForumTodoScraper extends EventEmitter {
    constructor() {
        super();
        
        // Load related systems
        this.forumSystem = this.loadModule('./forum-system-layer.js');
        this.apiBridge = this.loadModule('./api-to-forum-bridge.js');
        this.ideaSystem = this.loadModule('./FinishThisIdea/ai-os-clean/idea-branch-system.js');
        
        // Scraping configuration
        this.scrapingConfig = {
            interval: 30000, // 30 seconds
            forumUrl: 'http://localhost:5555',
            targetBoards: [
                'todo-discussions',
                'llm-insights', 
                'implementation-feedback',
                'implementation-updates',
                'completion-showcase',
                'help-requests'
            ],
            keywords: [
                'todo', 'implementation', 'feedback', 'suggestion',
                'improvement', 'issue', 'solution', 'progress'
            ]
        };
        
        // State tracking
        this.trackedTodos = new Map(); // todoId -> tracking data
        this.scrapedPosts = new Set(); // postId set to avoid duplicates
        this.scraperMetrics = {
            postsScraped: 0,
            feedbackExtracted: 0,
            todosUpdated: 0,
            insightsGenerated: 0,
            errors: 0
        };
        
        // Active scraping intervals
        this.scraperIntervals = [];
        
        console.log('🕷️ Forum-Todo Scraper initialized');
        console.log(`📊 Monitoring ${this.scrapingConfig.targetBoards.length} forum boards`);
    }
    
    loadModule(modulePath) {
        try {
            const fullPath = path.join(__dirname, modulePath);
            return require(fullPath);
        } catch (error) {
            console.warn(`⚠️ Module ${modulePath} not available, using mock`);
            return this.createMockModule(modulePath);
        }
    }
    
    createMockModule(modulePath) {
        const mocks = {
            './forum-system-layer.js': {
                getRecentPosts: async (board) => this.mockForumPosts(board),
                getPostDetails: async (postId) => this.mockPostDetails(postId)
            },
            './api-to-forum-bridge.js': {
                getForumMapping: async (todoId) => ({
                    postId: Date.now(),
                    board: 'todo-discussions'
                })
            },
            './FinishThisIdea/ai-os-clean/idea-branch-system.js': {
                updateTodo: async (todoId, updates) => ({ success: true }),
                addTodoNote: async (todoId, note) => ({ success: true })
            }
        };
        
        return mocks[modulePath] || {};
    }
    
    mockForumPosts(board) {
        // Generate mock forum posts for testing
        const mockPosts = [
            {
                id: Date.now() + 1,
                title: `Great progress on ${board} implementation!`,
                content: 'I noticed some excellent work here. Consider adding error handling for edge cases.',
                author: 'CommunityMember1',
                timestamp: Date.now() - 300000,
                likes: 3,
                tags: ['feedback', 'improvement']
            },
            {
                id: Date.now() + 2,
                title: 'Suggestion for optimization',
                content: 'The current approach works well, but we could optimize performance by caching frequently accessed data.',
                author: 'ExpertDeveloper',
                timestamp: Date.now() - 600000,
                likes: 7,
                tags: ['optimization', 'performance']
            }
        ];
        
        return mockPosts;
    }
    
    mockPostDetails(postId) {
        return {
            id: postId,
            title: 'Mock Post Details',
            content: 'This is mock content with valuable feedback and suggestions.',
            author: 'MockUser',
            timestamp: Date.now(),
            replies: [
                {
                    author: 'ReplyUser',
                    content: 'I agree with this approach. Also consider testing edge cases.',
                    timestamp: Date.now() - 60000
                }
            ]
        };
    }
    
    /**
     * Start monitoring a specific todo for forum feedback
     */
    async startTodoMonitoring(todoData) {
        const todoId = todoData.id || `todo_${Date.now()}`;
        
        console.log(`🔍 Starting monitoring for todo: ${todoData.title}`);
        
        const trackingData = {
            todo: todoData,
            startTime: Date.now(),
            forumPosts: [],
            feedbackCollected: [],
            lastScrape: 0,
            status: 'monitoring'
        };
        
        this.trackedTodos.set(todoId, trackingData);
        
        // Set up periodic scraping for this todo
        const interval = setInterval(async () => {
            try {
                await this.scrapeFeedbackForTodo(todoId);
            } catch (error) {
                console.error(`Scraping error for todo ${todoId}:`, error);
                this.scraperMetrics.errors++;
            }
        }, this.scrapingConfig.interval);
        
        this.scraperIntervals.push({ todoId, interval });
        
        this.emit('monitoring:started', { todoId, todo: todoData });
        return todoId;
    }
    
    /**
     * Scrape forum feedback for a specific todo
     */
    async scrapeFeedbackForTodo(todoId) {
        const trackingData = this.trackedTodos.get(todoId);
        if (!trackingData) {
            console.warn(`⚠️ Todo ${todoId} not found in tracking data`);
            return;
        }
        
        console.log(`🕷️ Scraping feedback for todo: ${trackingData.todo.title}`);
        
        // Scrape all target boards for relevant content
        const allFeedback = [];
        
        for (const board of this.scrapingConfig.targetBoards) {
            try {
                const boardFeedback = await this.scrapeBoardForTodo(board, trackingData);
                allFeedback.push(...boardFeedback);
            } catch (error) {
                console.error(`Board scraping error (${board}):`, error);
            }
        }
        
        // Process and analyze feedback
        if (allFeedback.length > 0) {
            const processedFeedback = await this.processFeedback(todoId, allFeedback);
            await this.updateTodoWithFeedback(todoId, processedFeedback);
            
            this.emit('feedback:collected', {
                todoId,
                feedbackCount: allFeedback.length,
                insights: processedFeedback
            });
        }
        
        trackingData.lastScrape = Date.now();
        this.scraperMetrics.postsScraped += allFeedback.length;
    }
    
    async scrapeBoardForTodo(board, trackingData) {
        // Get recent posts from the board
        const recentPosts = await this.getRecentPostsFromBoard(board);
        const relevantPosts = [];
        
        for (const post of recentPosts) {
            // Skip already processed posts
            if (this.scrapedPosts.has(post.id)) continue;
            
            // Check if post is relevant to this todo
            if (this.isPostRelevantToTodo(post, trackingData.todo)) {
                const postDetails = await this.getPostDetails(post.id);
                relevantPosts.push(postDetails);
                this.scrapedPosts.add(post.id);
            }
        }
        
        return relevantPosts;
    }
    
    async getRecentPostsFromBoard(board) {
        if (this.forumSystem && this.forumSystem.getRecentPosts) {
            return await this.forumSystem.getRecentPosts(board);
        }
        
        // Fallback: mock forum data
        return this.mockForumPosts(board);
    }
    
    async getPostDetails(postId) {
        if (this.forumSystem && this.forumSystem.getPostDetails) {
            return await this.forumSystem.getPostDetails(postId);
        }
        
        return this.mockPostDetails(postId);
    }
    
    isPostRelevantToTodo(post, todo) {
        const searchText = `${post.title} ${post.content}`.toLowerCase();
        const todoKeywords = [
            todo.title?.toLowerCase(),
            ...((todo.tags || []).map(tag => tag.toLowerCase())),
            ...this.extractKeywords(todo.description || '')
        ].filter(Boolean);
        
        // Check if post mentions todo-specific keywords
        const hasRelevantKeywords = todoKeywords.some(keyword => 
            searchText.includes(keyword)
        );
        
        // Check if post contains general feedback keywords
        const hasFeedbackKeywords = this.scrapingConfig.keywords.some(keyword =>
            searchText.includes(keyword)
        );
        
        // Check if post was created after todo creation
        const todoCreationTime = todo.createdAt || 0;
        const isAfterTodoCreation = post.timestamp > todoCreationTime;
        
        return (hasRelevantKeywords || hasFeedbackKeywords) && isAfterTodoCreation;
    }
    
    extractKeywords(text) {
        // Extract meaningful keywords from todo description
        const keywords = text.toLowerCase()
            .split(/\s+/)
            .filter(word => word.length > 3)
            .filter(word => !['the', 'and', 'for', 'with', 'this', 'that', 'from'].includes(word))
            .slice(0, 5); // Top 5 keywords
            
        return keywords;
    }
    
    async processFeedback(todoId, feedbackPosts) {
        console.log(`🧠 Processing ${feedbackPosts.length} feedback posts for todo ${todoId}`);
        
        const processedFeedback = {
            suggestions: [],
            issues: [],
            improvements: [],
            resources: [],
            insights: [],
            sentiment: 'neutral',
            confidence: 0.7
        };
        
        for (const post of feedbackPosts) {
            const analysis = this.analyzePost(post);
            
            // Categorize feedback
            if (analysis.type === 'suggestion') {
                processedFeedback.suggestions.push({
                    content: analysis.content,
                    author: post.author,
                    confidence: analysis.confidence,
                    timestamp: post.timestamp
                });
            } else if (analysis.type === 'issue') {
                processedFeedback.issues.push({
                    content: analysis.content,
                    severity: analysis.severity,
                    author: post.author,
                    timestamp: post.timestamp
                });
            } else if (analysis.type === 'improvement') {
                processedFeedback.improvements.push({
                    content: analysis.content,
                    impact: analysis.impact,
                    author: post.author,
                    timestamp: post.timestamp
                });
            }
            
            // Extract resources and links
            const resources = this.extractResources(post.content);
            processedFeedback.resources.push(...resources);
            
            // Generate insights
            const insights = this.generateInsights(post);
            processedFeedback.insights.push(...insights);
        }
        
        // Calculate overall sentiment
        processedFeedback.sentiment = this.calculateSentiment(feedbackPosts);
        
        this.scraperMetrics.feedbackExtracted++;
        this.scraperMetrics.insightsGenerated += processedFeedback.insights.length;
        
        return processedFeedback;
    }
    
    analyzePost(post) {
        const content = post.content.toLowerCase();
        
        // Simple keyword-based analysis
        if (content.includes('suggest') || content.includes('recommend') || content.includes('consider')) {
            return {
                type: 'suggestion',
                content: post.content,
                confidence: 0.8
            };
        } else if (content.includes('issue') || content.includes('problem') || content.includes('bug')) {
            return {
                type: 'issue',
                content: post.content,
                severity: content.includes('critical') ? 'high' : 'medium'
            };
        } else if (content.includes('improve') || content.includes('optimize') || content.includes('enhance')) {
            return {
                type: 'improvement',
                content: post.content,
                impact: content.includes('performance') ? 'high' : 'medium'
            };
        }
        
        return {
            type: 'general',
            content: post.content,
            confidence: 0.5
        };
    }
    
    extractResources(content) {
        const resources = [];
        
        // Extract URLs
        const urlRegex = /https?:\/\/[^\s]+/g;
        const urls = content.match(urlRegex) || [];
        urls.forEach(url => {
            resources.push({
                type: 'url',
                value: url,
                description: 'Referenced link'
            });
        });
        
        // Extract file references
        const fileRegex = /\b\w+\.\w{2,4}\b/g;
        const files = content.match(fileRegex) || [];
        files.forEach(file => {
            if (!file.includes('http')) {
                resources.push({
                    type: 'file',
                    value: file,
                    description: 'Referenced file'
                });
            }
        });
        
        return resources;
    }
    
    generateInsights(post) {
        const insights = [];
        const content = post.content.toLowerCase();
        
        // Generate insights based on content patterns
        if (content.includes('performance')) {
            insights.push({
                type: 'performance',
                message: 'Performance considerations mentioned',
                priority: 'medium',
                source: post.author
            });
        }
        
        if (content.includes('security')) {
            insights.push({
                type: 'security',
                message: 'Security aspects discussed',
                priority: 'high',
                source: post.author
            });
        }
        
        if (content.includes('test') || content.includes('testing')) {
            insights.push({
                type: 'testing',
                message: 'Testing considerations mentioned',
                priority: 'medium',
                source: post.author
            });
        }
        
        return insights;
    }
    
    calculateSentiment(posts) {
        // Simple sentiment analysis based on keywords
        let positiveScore = 0;
        let negativeScore = 0;
        
        const positiveKeywords = ['good', 'great', 'excellent', 'perfect', 'love', 'awesome', 'brilliant'];
        const negativeKeywords = ['bad', 'terrible', 'awful', 'hate', 'broken', 'wrong', 'issue'];
        
        posts.forEach(post => {
            const content = post.content.toLowerCase();
            
            positiveKeywords.forEach(keyword => {
                if (content.includes(keyword)) positiveScore++;
            });
            
            negativeKeywords.forEach(keyword => {
                if (content.includes(keyword)) negativeScore++;
            });
        });
        
        if (positiveScore > negativeScore) return 'positive';
        if (negativeScore > positiveScore) return 'negative';
        return 'neutral';
    }
    
    async updateTodoWithFeedback(todoId, feedback) {
        console.log(`📝 Updating todo ${todoId} with ${feedback.suggestions.length} suggestions and ${feedback.issues.length} issues`);
        
        try {
            // Prepare update data
            const updateData = {
                feedbackReceived: Date.now(),
                communitySuggestions: feedback.suggestions,
                identifiedIssues: feedback.issues,
                improvementOpportunities: feedback.improvements,
                communityResources: feedback.resources,
                sentimentAnalysis: feedback.sentiment,
                lastFeedbackScrape: Date.now()
            };
            
            // Update todo through idea system
            if (this.ideaSystem && this.ideaSystem.updateTodo) {
                await this.ideaSystem.updateTodo(todoId, updateData);
            }
            
            // Add summarized feedback as a note
            const feedbackSummary = this.createFeedbackSummary(feedback);
            if (this.ideaSystem && this.ideaSystem.addTodoNote) {
                await this.ideaSystem.addTodoNote(todoId, {
                    type: 'community_feedback',
                    content: feedbackSummary,
                    timestamp: Date.now(),
                    source: 'forum_scraper'
                });
            }
            
            this.scraperMetrics.todosUpdated++;
            
            this.emit('todo:updated', {
                todoId,
                updateData,
                summary: feedbackSummary
            });
            
            console.log(`✅ Todo ${todoId} updated with community feedback`);
            
        } catch (error) {
            console.error(`Failed to update todo ${todoId}:`, error);
            this.scraperMetrics.errors++;
        }
    }
    
    createFeedbackSummary(feedback) {
        const summary = [
            `🗣️ **Community Feedback Summary**`,
            `📊 Sentiment: ${feedback.sentiment}`,
            ``
        ];
        
        if (feedback.suggestions.length > 0) {
            summary.push(`💡 **Suggestions (${feedback.suggestions.length}):**`);
            feedback.suggestions.slice(0, 3).forEach(suggestion => {
                summary.push(`• ${suggestion.content.slice(0, 100)}... (${suggestion.author})`);
            });
            summary.push(``);
        }
        
        if (feedback.issues.length > 0) {
            summary.push(`⚠️ **Issues Identified (${feedback.issues.length}):**`);
            feedback.issues.slice(0, 3).forEach(issue => {
                summary.push(`• ${issue.content.slice(0, 100)}... (${issue.severity})`);
            });
            summary.push(``);
        }
        
        if (feedback.improvements.length > 0) {
            summary.push(`🚀 **Improvement Opportunities (${feedback.improvements.length}):**`);
            feedback.improvements.slice(0, 3).forEach(improvement => {
                summary.push(`• ${improvement.content.slice(0, 100)}... (${improvement.impact} impact)`);
            });
            summary.push(``);
        }
        
        if (feedback.resources.length > 0) {
            summary.push(`📚 **Resources Shared:**`);
            feedback.resources.slice(0, 3).forEach(resource => {
                summary.push(`• ${resource.type}: ${resource.value}`);
            });
        }
        
        return summary.join('\n');
    }
    
    /**
     * Stop monitoring a specific todo
     */
    async stopTodoMonitoring(todoId) {
        console.log(`🛑 Stopping monitoring for todo: ${todoId}`);
        
        // Stop interval
        const intervalData = this.scraperIntervals.find(i => i.todoId === todoId);
        if (intervalData) {
            clearInterval(intervalData.interval);
            this.scraperIntervals = this.scraperIntervals.filter(i => i.todoId !== todoId);
        }
        
        // Archive tracking data
        const trackingData = this.trackedTodos.get(todoId);
        if (trackingData) {
            trackingData.status = 'stopped';
            trackingData.endTime = Date.now();
            
            this.emit('monitoring:stopped', {
                todoId,
                duration: trackingData.endTime - trackingData.startTime,
                feedbackCollected: trackingData.feedbackCollected.length
            });
        }
        
        // Remove from active tracking
        this.trackedTodos.delete(todoId);
    }
    
    /**
     * Start bulk monitoring for multiple todos
     */
    async startBulkMonitoring(todoList) {
        console.log(`🔍 Starting bulk monitoring for ${todoList.length} todos`);
        
        const results = await Promise.all(
            todoList.map(todo => this.startTodoMonitoring(todo))
        );
        
        return {
            success: true,
            monitoredTodos: results.length,
            todoIds: results
        };
    }
    
    /**
     * Get scraper metrics and status
     */
    getScraperStatus() {
        return {
            metrics: this.scraperMetrics,
            activeTodos: this.trackedTodos.size,
            activeIntervals: this.scraperIntervals.length,
            scrapingConfig: this.scrapingConfig,
            uptime: Date.now() - (this.startTime || Date.now())
        };
    }
    
    /**
     * Get feedback summary for a specific todo
     */
    getTodoFeedbackSummary(todoId) {
        const trackingData = this.trackedTodos.get(todoId);
        if (!trackingData) return null;
        
        return {
            todoId,
            todoTitle: trackingData.todo.title,
            monitoringDuration: Date.now() - trackingData.startTime,
            totalFeedback: trackingData.feedbackCollected.length,
            lastScrape: trackingData.lastScrape,
            status: trackingData.status,
            forumPostsFound: trackingData.forumPosts.length
        };
    }
    
    /**
     * Cleanup and shutdown
     */
    shutdown() {
        console.log('🛑 Shutting down Forum-Todo Scraper...');
        
        // Stop all intervals
        this.scraperIntervals.forEach(intervalData => {
            clearInterval(intervalData.interval);
        });
        
        // Emit shutdown event
        this.emit('scraper:shutdown', {
            totalTodos: this.trackedTodos.size,
            metrics: this.scraperMetrics
        });
        
        console.log('✅ Forum-Todo Scraper shutdown complete');
    }
}

// Export the scraper class
module.exports = ForumTodoScraper;

// Demo functionality if run directly
if (require.main === module) {
    const demo = async () => {
        console.log('🕷️ FORUM-TODO SCRAPER DEMO');
        console.log('============================\n');
        
        const scraper = new ForumTodoScraper();
        scraper.startTime = Date.now();
        
        // Listen for events
        scraper.on('monitoring:started', (event) => {
            console.log(`✅ Started monitoring: ${event.todo.title}`);
        });
        
        scraper.on('feedback:collected', (event) => {
            console.log(`📬 Feedback collected for ${event.todoId}: ${event.feedbackCount} posts`);
            console.log(`💡 Insights: ${event.insights.insights.length} generated`);
        });
        
        scraper.on('todo:updated', (event) => {
            console.log(`📝 Todo updated: ${event.todoId}`);
            console.log(`📊 Summary: ${event.summary.split('\n')[0]}...`);
        });
        
        // Demo todo
        const testTodo = {
            id: 'demo_todo_scraper_001',
            title: 'Build responsive navigation component',
            description: 'Create a mobile-friendly navigation component with dropdown menus and accessibility features',
            priority: 'medium',
            tags: ['frontend', 'component', 'accessibility'],
            createdAt: Date.now() - 3600000 // 1 hour ago
        };
        
        // Start monitoring
        const todoId = await scraper.startTodoMonitoring(testTodo);
        console.log(`🔍 Monitoring started for todo: ${todoId}\n`);
        
        // Let it run for a bit to collect feedback
        console.log('⏳ Collecting feedback for 10 seconds...\n');
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        // Show status
        console.log('📊 Scraper Status:');
        console.log(JSON.stringify(scraper.getScraperStatus(), null, 2));
        
        // Show todo feedback summary
        console.log('\n📋 Todo Feedback Summary:');
        console.log(JSON.stringify(scraper.getTodoFeedbackSummary(todoId), null, 2));
        
        // Stop monitoring and cleanup
        await scraper.stopTodoMonitoring(todoId);
        scraper.shutdown();
        
        console.log('\n✅ Demo completed!');
    };
    
    demo().catch(console.error);
}