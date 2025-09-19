#!/usr/bin/env node

/**
 * 🗣️ FORUM SYSTEM LAYER
 * phpBB-style community forums for VC-readable engagement metrics
 * The missing piece that made early gaming companies fundable
 */

const http = require('http');
const crypto = require('crypto');
const fs = require('fs');

class ForumSystem {
    constructor(port) {
        this.port = port;
        this.forums = new Map([
            ['gaming', { name: 'Gaming Discussion', topics: [], posts: 0, users: new Set() }],
            ['strategy', { name: 'Strategy & Tips', topics: [], posts: 0, users: new Set() }],
            ['development', { name: 'Game Development', topics: [], posts: 0, users: new Set() }],
            ['marketplace', { name: 'Trading & Marketplace', topics: [], posts: 0, users: new Set() }]
        ]);
        
        this.users = new Map();
        this.sessions = new Map();
        this.metrics = {
            totalUsers: 0,
            activeUsers24h: 0,
            totalPosts: 0,
            postsToday: 0,
            averageSessionLength: 0,
            topicCreationRate: 0
        };
        
        // Seed with AI-generated content for VC demo
        this.seedWithContent();
        this.startMetricsTracking();
    }
    
    start() {
        const server = http.createServer((req, res) => {
            const url = new URL(req.url, `http://localhost:${this.port}`);
            
            if (url.pathname === '/') {
                this.serveForumHome(res);
            } else if (url.pathname === '/api/metrics') {
                this.serveMetrics(res);
            } else if (url.pathname.startsWith('/forum/')) {
                const forumId = url.pathname.split('/')[2];
                this.serveForum(res, forumId);
            } else if (url.pathname === '/api/post' && req.method === 'POST') {
                this.handleNewPost(req, res);
            } else {
                res.writeHead(404);
                res.end('Not Found');
            }
        });
        
        server.listen(this.port, () => {
            console.log(`🗣️ Forum System running on port ${this.port}`);
        });
    }
    
    seedWithContent() {
        // Simulate active community for VC demo
        const sampleUsers = [
            'GameMaster2024', 'PixelWarrior', 'CodeNinja', 'RetroGamer', 
            'NPCWhisperer', 'QuestSeeker', 'LootHunter', 'GuildLeader'
        ];
        
        const sampleTopics = {
            gaming: [
                'Best strategies for NPC farming?',
                'New update broke my favorite exploit',
                'Looking for guild members - serious players only',
                'Rate my character build (screenshot inside)'
            ],
            strategy: [
                'Mathematical analysis of RNG mechanics',
                'Optimal resource allocation guide',
                'PvP tier list - current meta breakdown',
                'Speed run techniques and glitches'
            ],
            development: [
                'How to implement realistic NPC AI?',
                'WebSocket performance optimization tips',
                'Canvas vs WebGL for 2D games?',
                'Monetization without killing user experience'
            ],
            marketplace: [
                'WTS: Rare mithril ore - 500g',
                'WTB: High-level enchanted weapons',
                'Price check: Legendary drop from dragon boss',
                'Trading post fees too high - community petition'
            ]
        };
        
        // Create users
        sampleUsers.forEach(username => {
            this.users.set(username, {
                id: crypto.randomUUID(),
                username: username,
                joinDate: Date.now() - Math.random() * 86400000 * 30, // Random join within 30 days
                posts: Math.floor(Math.random() * 100) + 10,
                reputation: Math.floor(Math.random() * 1000),
                lastActive: Date.now() - Math.random() * 86400000
            });
        });
        
        // Create topics and posts
        Object.entries(sampleTopics).forEach(([forumId, topics]) => {
            const forum = this.forums.get(forumId);
            
            topics.forEach(topicTitle => {
                const author = sampleUsers[Math.floor(Math.random() * sampleUsers.length)];
                const topic = {
                    id: crypto.randomUUID(),
                    title: topicTitle,
                    author: author,
                    created: Date.now() - Math.random() * 86400000 * 7, // Within last week
                    posts: [],
                    views: Math.floor(Math.random() * 500) + 50,
                    lastActivity: Date.now() - Math.random() * 86400000
                };
                
                // Add initial post
                topic.posts.push({
                    id: crypto.randomUUID(),
                    author: author,
                    content: this.generatePostContent(topicTitle),
                    timestamp: topic.created,
                    likes: Math.floor(Math.random() * 20)
                });
                
                // Add replies
                const replyCount = Math.floor(Math.random() * 10) + 1;
                for (let i = 0; i < replyCount; i++) {
                    const replyAuthor = sampleUsers[Math.floor(Math.random() * sampleUsers.length)];
                    topic.posts.push({
                        id: crypto.randomUUID(),
                        author: replyAuthor,
                        content: this.generateReplyContent(),
                        timestamp: topic.created + (i + 1) * Math.random() * 86400000,
                        likes: Math.floor(Math.random() * 10)
                    });
                }
                
                forum.topics.push(topic);
                forum.posts += topic.posts.length;
                forum.users.add(author);
            });
        });
        
        this.updateMetrics();
    }
    
    generatePostContent(title) {
        const templates = [
            `Hey everyone! I've been thinking about "${title}" and wanted to get the community's thoughts. Based on my experience with similar games, here's what I've observed...`,
            `Quick question about "${title}" - has anyone else noticed this? I've been playing for months and this is starting to really impact my gameplay...`,
            `Analysis time! Regarding "${title}", I've compiled some data that might interest you all. Here are the numbers...`,
            `PSA: Important info about "${title}" that every player should know. This could save you hours of grinding...`
        ];
        
        return templates[Math.floor(Math.random() * templates.length)] + 
               ' What do you think? Share your experiences below!';
    }
    
    generateReplyContent() {
        const replies = [
            'Great point! I totally agree with your analysis.',
            'Interesting perspective, but have you considered the economic implications?',
            'This is exactly what I was looking for. Thanks for sharing!',
            'Not sure I agree with this. My experience has been different...',
            'Can confirm - this strategy works. Got 10k XP in one session.',
            'The devs really need to see this thread. Anyone have contacts?',
            'Similar issue here. Hope they fix it in the next patch.',
            'Brilliant strategy! Going to try this tonight.'
        ];
        
        return replies[Math.floor(Math.random() * replies.length)];
    }
    
    updateMetrics() {
        const now = Date.now();
        const dayAgo = now - 86400000;
        
        this.metrics.totalUsers = this.users.size;
        this.metrics.activeUsers24h = Array.from(this.users.values())
            .filter(user => user.lastActive > dayAgo).length;
        
        this.metrics.totalPosts = Array.from(this.forums.values())
            .reduce((sum, forum) => sum + forum.posts, 0);
        
        this.metrics.postsToday = 0;
        this.forums.forEach(forum => {
            forum.topics.forEach(topic => {
                this.metrics.postsToday += topic.posts.filter(post => 
                    post.timestamp > dayAgo
                ).length;
            });
        });
        
        // Calculate engagement metrics
        const totalTopics = Array.from(this.forums.values())
            .reduce((sum, forum) => sum + forum.topics.length, 0);
        
        this.metrics.topicCreationRate = totalTopics / Math.max(1, this.metrics.totalUsers) * 100;
        this.metrics.averageSessionLength = 15 + Math.random() * 30; // Simulated
        
        // Add VC-specific metrics
        this.metrics.monthlyActiveUsers = Math.floor(this.metrics.totalUsers * 0.7);
        this.metrics.userRetention7day = 68; // Simulated
        this.metrics.userRetention30day = 42; // Simulated
        this.metrics.averagePostsPerUser = this.metrics.totalPosts / this.metrics.totalUsers;
    }
    
    startMetricsTracking() {
        // Update metrics every minute for live dashboard
        setInterval(() => {
            this.updateMetrics();
            this.simulateActivity();
        }, 60000);
    }
    
    simulateActivity() {
        // Simulate ongoing forum activity for live demo
        if (Math.random() > 0.7) {
            const forums = Array.from(this.forums.keys());
            const randomForum = forums[Math.floor(Math.random() * forums.length)];
            const forum = this.forums.get(randomForum);
            
            if (forum.topics.length > 0) {
                const randomTopic = forum.topics[Math.floor(Math.random() * forum.topics.length)];
                const users = Array.from(this.users.keys());
                const randomUser = users[Math.floor(Math.random() * users.length)];
                
                // Add new reply
                randomTopic.posts.push({
                    id: crypto.randomUUID(),
                    author: randomUser,
                    content: this.generateReplyContent(),
                    timestamp: Date.now(),
                    likes: 0
                });
                
                forum.posts++;
                randomTopic.lastActivity = Date.now();
                
                console.log(`💬 New forum activity: ${randomUser} replied in "${randomTopic.title}"`);
            }
        }
    }
    
    serveForumHome(res) {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>🗣️ Community Forums - The Heart of Gaming Communities</title>
    <style>
        body { background: #f5f5f5; color: #333; font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .header { background: #2c3e50; color: white; padding: 20px; margin: -20px -20px 20px -20px; }
        .vc-metrics { background: #e8f5e9; border: 2px solid #4caf50; padding: 15px; margin: 20px 0; }
        .forums-list { display: grid; gap: 20px; }
        .forum { background: white; border: 1px solid #ddd; padding: 20px; border-radius: 5px; }
        .forum h3 { margin-top: 0; color: #2c3e50; }
        .forum-stats { color: #666; font-size: 14px; }
        .topic { border-bottom: 1px solid #eee; padding: 10px 0; }
        .topic:last-child { border-bottom: none; }
        .topic-title { font-weight: bold; color: #3498db; }
        .topic-meta { font-size: 12px; color: #666; margin-top: 5px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 15px 0; }
        .metric { text-align: center; }
        .metric-value { font-size: 24px; font-weight: bold; color: #2c3e50; }
        .metric-label { font-size: 12px; color: #666; }
        .live { animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
    </style>
</head>
<body>
    <div class="header">
        <h1>🗣️ Gaming Community Forums</h1>
        <p>The phpBB-style community system that made early gaming companies VC-fundable</p>
    </div>
    
    <div class="vc-metrics">
        <h3>📊 VC-Readable Community Metrics <span class="live">●</span></h3>
        <div class="metrics-grid">
            <div class="metric">
                <div class="metric-value" id="totalUsers">0</div>
                <div class="metric-label">Total Users</div>
            </div>
            <div class="metric">
                <div class="metric-value" id="activeUsers">0</div>
                <div class="metric-label">Active (24h)</div>
            </div>
            <div class="metric">
                <div class="metric-value" id="totalPosts">0</div>
                <div class="metric-label">Total Posts</div>
            </div>
            <div class="metric">
                <div class="metric-value" id="retention">0%</div>
                <div class="metric-label">7-Day Retention</div>
            </div>
        </div>
        <p><strong>Why VCs Loved Forums:</strong> Community retention = sustainable growth. 
        Forums showed engaged users creating content, driving organic traffic, and building network effects.</p>
    </div>
    
    <div class="forums-list" id="forumsList">
        <!-- Forums loaded dynamically -->
    </div>
    
    <script>
        async function updateForums() {
            try {
                const response = await fetch('/api/metrics');
                const metrics = await response.json();
                
                // Update VC metrics
                document.getElementById('totalUsers').textContent = metrics.totalUsers;
                document.getElementById('activeUsers').textContent = metrics.activeUsers24h;
                document.getElementById('totalPosts').textContent = metrics.totalPosts;
                document.getElementById('retention').textContent = metrics.userRetention7day + '%';
                
                // Update forums (simplified for demo)
                const forumsList = document.getElementById('forumsList');
                forumsList.innerHTML = \`
                    <div class="forum">
                        <h3>🎮 Gaming Discussion</h3>
                        <div class="forum-stats">\${Math.floor(metrics.totalPosts * 0.4)} posts • \${Math.floor(metrics.activeUsers24h * 0.8)} active users</div>
                        <div class="topic">
                            <div class="topic-title">Best strategies for NPC farming?</div>
                            <div class="topic-meta">by GameMaster2024 • 47 replies • 2 hours ago</div>
                        </div>
                        <div class="topic">
                            <div class="topic-title">New update broke my favorite exploit</div>
                            <div class="topic-meta">by PixelWarrior • 23 replies • 4 hours ago</div>
                        </div>
                    </div>
                    
                    <div class="forum">
                        <h3>🧠 Strategy & Tips</h3>
                        <div class="forum-stats">\${Math.floor(metrics.totalPosts * 0.3)} posts • \${Math.floor(metrics.activeUsers24h * 0.6)} active users</div>
                        <div class="topic">
                            <div class="topic-title">Mathematical analysis of RNG mechanics</div>
                            <div class="topic-meta">by CodeNinja • 89 replies • 1 day ago</div>
                        </div>
                        <div class="topic">
                            <div class="topic-title">Optimal resource allocation guide</div>
                            <div class="topic-meta">by QuestSeeker • 34 replies • 6 hours ago</div>
                        </div>
                    </div>
                    
                    <div class="forum">
                        <h3>💰 Trading & Marketplace</h3>
                        <div class="forum-stats">\${Math.floor(metrics.totalPosts * 0.2)} posts • \${Math.floor(metrics.activeUsers24h * 0.4)} active users</div>
                        <div class="topic">
                            <div class="topic-title">WTS: Rare mithril ore - 500g</div>
                            <div class="topic-meta">by LootHunter • 12 replies • 30 minutes ago</div>
                        </div>
                        <div class="topic">
                            <div class="topic-title">Price check: Legendary drop from dragon boss</div>
                            <div class="topic-meta">by GuildLeader • 67 replies • 3 hours ago</div>
                        </div>
                    </div>
                \`;
                
            } catch (error) {
                console.error('Update error:', error);
            }
        }
        
        setInterval(updateForums, 5000);
        updateForums();
    </script>
</body>
</html>
        `;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
    
    serveMetrics(res) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(this.metrics));
    }
    
    serveForum(res, forumId) {
        const forum = this.forums.get(forumId);
        if (!forum) {
            res.writeHead(404);
            res.end('Forum not found');
            return;
        }
        
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>${forum.name} - Community Forums</title>
    <style>
        body { background: #f5f5f5; color: #333; font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .header { background: #2c3e50; color: white; padding: 20px; margin: -20px -20px 20px -20px; }
        .topic { background: white; border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .topic-title { font-size: 18px; font-weight: bold; color: #2c3e50; margin-bottom: 10px; }
        .topic-meta { font-size: 14px; color: #666; }
        .back-link { color: #3498db; text-decoration: none; }
    </style>
</head>
<body>
    <div class="header">
        <a href="/" class="back-link">← Back to Forums</a>
        <h1>${forum.name}</h1>
        <p>${forum.posts} posts by ${forum.users.size} users</p>
    </div>
    
    ${forum.topics.map(topic => `
        <div class="topic">
            <div class="topic-title">${topic.title}</div>
            <div class="topic-meta">
                Started by ${topic.author} • ${topic.posts.length} replies • ${topic.views} views
                • Last activity: ${new Date(topic.lastActivity).toLocaleDateString()}
            </div>
        </div>
    `).join('')}
</body>
</html>
        `;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
}

// Start the forum system
async function startForumSystem() {
    console.log('🗣️ STARTING FORUM SYSTEM');
    console.log('========================');
    console.log('Creating the community layer that made gaming companies VC-fundable');
    console.log('');
    
    const forum = new ForumSystem(5555);
    forum.start();
    
    console.log('');
    console.log('✅ Forum system is running!');
    console.log('');
    console.log('🗣️ Community Forums: http://localhost:5555');
    console.log('📊 Metrics API: http://localhost:5555/api/metrics');
    console.log('');
    console.log('💡 Why forums made gaming companies VC-fundable:');
    console.log('  - Community retention metrics');
    console.log('  - User-generated content scaling');
    console.log('  - Network effects and virality');
    console.log('  - Measurable engagement patterns');
    console.log('  - Organic marketing through discussions');
}

// Handle shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down forum system...');
    process.exit(0);
});

// Start the forum
startForumSystem().catch(console.error);