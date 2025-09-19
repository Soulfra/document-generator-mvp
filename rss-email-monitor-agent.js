#!/usr/bin/env node

/**
 * 📡📧 RSS & EMAIL MONITOR AGENT
 * Autonomous agents that monitor RSS feeds, emails, and external data sources
 * Intelligently sort, process, and alert on important information
 */

const axios = require('axios');
// const Parser = require('rss-parser'); // Commented out - install with: npm install rss-parser
const EventEmitter = require('events');

class RSSEmailMonitorAgent extends EventEmitter {
    constructor(agentData, empireHub) {
        super();
        
        this.agent = agentData;
        this.empireHub = empireHub;
        // this.parser = new Parser(); // Uncomment after installing rss-parser
        
        this.config = {
            rssFeeds: [
                { url: 'https://news.ycombinator.com/rss', category: 'tech', priority: 'high' },
                { url: 'https://www.reddit.com/r/programming/.rss', category: 'programming', priority: 'medium' },
                { url: 'https://dev.to/feed', category: 'devblog', priority: 'medium' },
                { url: 'https://github.com/trending/developers.atom', category: 'github', priority: 'high' }
            ],
            emailInboxes: [
                { address: 'devlogs@ai-agent-empire.com', category: 'devlogs' },
                { address: 'alerts@ai-agent-empire.com', category: 'alerts' },
                { address: 'reports@ai-agent-empire.com', category: 'reports' }
            ],
            checkInterval: 60000, // 1 minute
            retentionDays: 7,
            alertKeywords: ['security', 'vulnerability', 'breaking', 'urgent', 'critical', 'launch', 'release']
        };
        
        this.state = {
            lastCheck: new Date(),
            feedItems: new Map(),
            emails: new Map(),
            alerts: [],
            statistics: {
                totalItemsProcessed: 0,
                alertsGenerated: 0,
                categoryCounts: new Map()
            }
        };
        
        this.monitoring = false;
        this.checkInterval = null;
        
        console.log(`📡 ${this.agent.name} initialized as RSS/Email monitor`);
    }
    
    async start() {
        console.log(`📡 ${this.agent.name} starting monitoring...`);
        this.monitoring = true;
        
        // Initial check
        await this.checkAllSources();
        
        // Start periodic checking
        this.checkInterval = setInterval(async () => {
            if (this.monitoring && this.agent.status === 'monitoring_rss') {
                await this.checkAllSources();
            }
        }, this.config.checkInterval);
    }
    
    async checkAllSources() {
        console.log(`🔍 ${this.agent.name} checking all sources...`);
        
        // Check RSS feeds
        for (const feed of this.config.rssFeeds) {
            await this.checkRSSFeed(feed);
        }
        
        // Check emails (simulated)
        for (const inbox of this.config.emailInboxes) {
            await this.checkEmailInbox(inbox);
        }
        
        // Process and analyze collected data
        await this.analyzeCollectedData();
        
        // Update state
        this.state.lastCheck = new Date();
        this.emit('check_completed', {
            itemsFound: this.state.feedItems.size + this.state.emails.size,
            alerts: this.state.alerts.length
        });
    }
    
    async checkRSSFeed(feed) {
        try {
            console.log(`📰 Checking RSS feed: ${feed.url}`);
            
            // const feedData = await this.parser.parseURL(feed.url);
            // Mock feed data for now - uncomment above after installing rss-parser
            const feedData = {
                title: 'Mock RSS Feed',
                items: [
                    { title: 'Breaking: AI Agents Take Over', link: 'https://example.com/1', pubDate: new Date() },
                    { title: 'New Framework Released', link: 'https://example.com/2', pubDate: new Date() }
                ]
            };
            
            feedData.items.forEach(item => {
                const itemId = this.generateItemId(item);
                
                // Check if this is a new item
                if (!this.state.feedItems.has(itemId)) {
                    const processedItem = {
                        id: itemId,
                        title: item.title,
                        link: item.link,
                        content: item.content || item.contentSnippet,
                        pubDate: new Date(item.pubDate || Date.now()),
                        category: feed.category,
                        priority: feed.priority,
                        source: feedData.title,
                        keywords: this.extractKeywords(item),
                        sentiment: this.analyzeSentiment(item)
                    };
                    
                    this.state.feedItems.set(itemId, processedItem);
                    this.state.statistics.totalItemsProcessed++;
                    
                    // Update category count
                    const count = this.state.statistics.categoryCounts.get(feed.category) || 0;
                    this.state.statistics.categoryCounts.set(feed.category, count + 1);
                    
                    // Check for alerts
                    if (this.shouldAlert(processedItem)) {
                        this.generateAlert(processedItem);
                    }
                    
                    // Add to agent memory
                    this.agent.memory.shortTerm.push({
                        type: 'rss',
                        title: item.title,
                        url: item.link,
                        timestamp: Date.now()
                    });
                    
                    // Keep memory size manageable
                    if (this.agent.memory.shortTerm.length > 20) {
                        this.agent.memory.shortTerm.shift();
                    }
                }
            });
            
        } catch (error) {
            console.error(`❌ Error checking RSS feed ${feed.url}:`, error.message);
        }
    }
    
    async checkEmailInbox(inbox) {
        // Simulated email checking (in production would use IMAP/POP3)
        console.log(`📧 Checking email inbox: ${inbox.address}`);
        
        // Simulate finding new emails
        if (Math.random() < 0.3) { // 30% chance of new email
            const email = {
                id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                from: this.generateMockEmail(),
                to: inbox.address,
                subject: this.generateMockSubject(inbox.category),
                body: this.generateMockBody(),
                timestamp: new Date(),
                category: inbox.category,
                attachments: Math.random() < 0.2 ? ['document.pdf'] : []
            };
            
            this.state.emails.set(email.id, email);
            
            // Process email
            await this.processEmail(email);
        }
    }
    
    async processEmail(email) {
        console.log(`📧 Processing email: ${email.subject}`);
        
        // Categorize and prioritize
        const analysis = {
            importance: this.analyzeImportance(email),
            category: this.categorizeEmail(email),
            action: this.determineAction(email),
            sentiment: this.analyzeSentiment({ title: email.subject, content: email.body })
        };
        
        email.analysis = analysis;
        
        // Take action based on analysis
        switch (analysis.action) {
            case 'alert':
                this.generateAlert({
                    ...email,
                    type: 'email',
                    priority: 'high'
                });
                break;
                
            case 'forward':
                this.forwardToRelevantAgent(email);
                break;
                
            case 'archive':
                // Store for later reference
                this.archiveEmail(email);
                break;
        }
        
        this.state.statistics.totalItemsProcessed++;
    }
    
    async analyzeCollectedData() {
        // Trend analysis
        const trends = this.detectTrends();
        
        // Pattern recognition
        const patterns = this.findPatterns();
        
        // Generate insights
        const insights = {
            trending: trends,
            patterns: patterns,
            summary: this.generateSummary()
        };
        
        // Store insights in agent's long-term memory
        this.agent.memory.longTerm.set('latest_insights', insights);
        
        // Report to empire if significant
        if (trends.length > 0 || patterns.significant) {
            this.reportToEmpire(insights);
        }
    }
    
    detectTrends() {
        const trends = [];
        const keywordFrequency = new Map();
        
        // Analyze recent items
        this.state.feedItems.forEach(item => {
            item.keywords.forEach(keyword => {
                const count = keywordFrequency.get(keyword) || 0;
                keywordFrequency.set(keyword, count + 1);
            });
        });
        
        // Find trending keywords
        keywordFrequency.forEach((count, keyword) => {
            if (count > 3) { // Appears in multiple items
                trends.push({
                    keyword,
                    frequency: count,
                    trend: 'rising' // Would calculate actual trend in production
                });
            }
        });
        
        return trends.sort((a, b) => b.frequency - a.frequency).slice(0, 5);
    }
    
    findPatterns() {
        // Simple pattern detection
        const patterns = {
            peakHours: this.findPeakActivityHours(),
            commonSources: this.findCommonSources(),
            correlations: this.findCorrelations(),
            significant: false
        };
        
        // Mark as significant if notable patterns found
        if (patterns.peakHours.length > 0 || patterns.correlations.length > 0) {
            patterns.significant = true;
        }
        
        return patterns;
    }
    
    shouldAlert(item) {
        // Check for alert keywords
        const hasAlertKeyword = this.config.alertKeywords.some(keyword => 
            item.title.toLowerCase().includes(keyword) ||
            (item.content && item.content.toLowerCase().includes(keyword))
        );
        
        // High priority items always alert
        if (item.priority === 'high' && hasAlertKeyword) {
            return true;
        }
        
        // Check sentiment
        if (item.sentiment && (item.sentiment === 'urgent' || item.sentiment === 'critical')) {
            return true;
        }
        
        return false;
    }
    
    generateAlert(item) {
        const alert = {
            id: `alert-${Date.now()}`,
            source: item.source || item.from,
            title: item.title || item.subject,
            content: item.content || item.body,
            url: item.link || null,
            priority: item.priority || 'medium',
            timestamp: new Date(),
            handled: false
        };
        
        this.state.alerts.push(alert);
        this.state.statistics.alertsGenerated++;
        
        console.log(`🚨 ALERT: ${alert.title}`);
        
        // Notify empire hub
        this.empireHub.emit('agent_alert', {
            agent: this.agent,
            alert: alert
        });
        
        // Send to communication channels
        this.sendAlertToChannels(alert);
    }
    
    sendAlertToChannels(alert) {
        // Format alert for different platforms
        const message = `🚨 Alert from ${this.agent.name}:\n${alert.title}\n${alert.url || ''}`;
        
        // Would send to Discord, Slack, Telegram in production
        console.log(`📢 Broadcasting alert: ${message}`);
    }
    
    forwardToRelevantAgent(email) {
        // Find appropriate agent based on content
        const agents = Array.from(this.empireHub.empire.agents.values());
        
        let targetAgent = null;
        if (email.category === 'devlogs' && email.body.includes('code')) {
            targetAgent = agents.find(a => a.type === 'emacs-master');
        } else if (email.category === 'alerts') {
            targetAgent = agents.find(a => a.type === 'stream-moderator');
        }
        
        if (targetAgent) {
            console.log(`📨 Forwarding email to ${targetAgent.name}`);
            // Would implement actual forwarding logic
        }
    }
    
    // Helper methods
    generateItemId(item) {
        return `rss-${item.guid || item.link || item.title}`.replace(/[^a-zA-Z0-9]/g, '-');
    }
    
    extractKeywords(item) {
        const text = `${item.title} ${item.content || ''}`.toLowerCase();
        const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);
        
        const words = text.match(/\b[a-z]+\b/g) || [];
        const keywords = words
            .filter(word => word.length > 3 && !commonWords.has(word))
            .reduce((acc, word) => {
                acc[word] = (acc[word] || 0) + 1;
                return acc;
            }, {});
        
        return Object.entries(keywords)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([word]) => word);
    }
    
    analyzeSentiment(item) {
        const text = `${item.title || ''} ${item.content || ''}`.toLowerCase();
        
        if (text.includes('urgent') || text.includes('critical')) return 'urgent';
        if (text.includes('success') || text.includes('launch')) return 'positive';
        if (text.includes('fail') || text.includes('error')) return 'negative';
        if (text.includes('update') || text.includes('release')) return 'informative';
        
        return 'neutral';
    }
    
    analyzeImportance(email) {
        let score = 0;
        
        // Check sender importance
        if (email.from.includes('ceo') || email.from.includes('important')) score += 3;
        
        // Check subject keywords
        if (email.subject.toLowerCase().includes('urgent')) score += 2;
        if (email.subject.toLowerCase().includes('action required')) score += 2;
        
        // Check attachments
        if (email.attachments && email.attachments.length > 0) score += 1;
        
        return score > 3 ? 'high' : score > 1 ? 'medium' : 'low';
    }
    
    categorizeEmail(email) {
        // Simple categorization based on content
        if (email.body.includes('invoice') || email.body.includes('payment')) return 'financial';
        if (email.body.includes('meeting') || email.body.includes('schedule')) return 'calendar';
        if (email.body.includes('report') || email.body.includes('analysis')) return 'reports';
        
        return email.category || 'general';
    }
    
    determineAction(email) {
        if (email.analysis && email.analysis.importance === 'high') return 'alert';
        if (email.category === 'reports') return 'forward';
        return 'archive';
    }
    
    generateSummary() {
        const totalItems = this.state.feedItems.size + this.state.emails.size;
        const categories = Array.from(this.state.statistics.categoryCounts.entries())
            .map(([cat, count]) => `${cat}: ${count}`)
            .join(', ');
        
        return `Processed ${totalItems} items. Categories: ${categories}. Alerts: ${this.state.alerts.length}`;
    }
    
    archiveEmail(email) {
        // In production, would move to archive storage
        console.log(`📁 Archiving email: ${email.subject}`);
    }
    
    reportToEmpire(insights) {
        console.log(`📊 Reporting insights to empire:`, insights.summary);
        
        this.empireHub.emit('agent_insights', {
            agent: this.agent,
            insights: insights
        });
    }
    
    // Mock data generators
    generateMockEmail() {
        const senders = ['dev@company.com', 'alerts@service.com', 'boss@empire.ai', 'newsletter@tech.com'];
        return senders[Math.floor(Math.random() * senders.length)];
    }
    
    generateMockSubject(category) {
        const subjects = {
            devlogs: ['Daily Development Report', 'Code Review Required', 'New Feature Deployed'],
            alerts: ['System Alert: High CPU Usage', 'Security Update Available', 'Service Down'],
            reports: ['Weekly Analytics Report', 'Performance Metrics', 'User Activity Summary']
        };
        
        const categorySubjects = subjects[category] || ['General Update'];
        return categorySubjects[Math.floor(Math.random() * categorySubjects.length)];
    }
    
    generateMockBody() {
        return 'This is a mock email body with some important information that needs to be processed by the AI agent system.';
    }
    
    findPeakActivityHours() {
        // Would analyze timestamps to find peak hours
        return [{ hour: 14, activity: 'high' }, { hour: 10, activity: 'medium' }];
    }
    
    findCommonSources() {
        const sources = new Map();
        this.state.feedItems.forEach(item => {
            const count = sources.get(item.source) || 0;
            sources.set(item.source, count + 1);
        });
        
        return Array.from(sources.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
    }
    
    findCorrelations() {
        // Would implement correlation analysis
        return [];
    }
    
    // Control methods
    getStatus() {
        return {
            monitoring: this.monitoring,
            lastCheck: this.state.lastCheck,
            itemsProcessed: this.state.statistics.totalItemsProcessed,
            alerts: this.state.alerts.length,
            categories: Array.from(this.state.statistics.categoryCounts.entries())
        };
    }
    
    stop() {
        this.monitoring = false;
        
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
        
        console.log(`🛑 ${this.agent.name} stopped monitoring`);
    }
}

module.exports = RSSEmailMonitorAgent;