#!/usr/bin/env node

/**
 * 💬 Soulfra Forum Bridge
 * 
 * Modern forum system inspired by phpBB with React frontend,
 * GitHub integration, and visual category headers.
 * 
 * Features:
 * - phpBB-style categories and forums
 * - GitHub SSO authentication
 * - Modern React components
 * - Extension/plugin marketplace
 * - Visual headers that showcase content
 * - Real-time updates
 */

const { EventEmitter } = require('events');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class SoulfraForumBridge extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            // Forum settings
            forumName: options.forumName || 'Soulfra Community',
            description: options.description || 'Connect, share, and learn together',
            
            // GitHub integration
            githubOrg: options.githubOrg || process.env.GITHUB_ORG,
            githubAuth: options.githubAuth !== false,
            
            // Permissions
            allowGuestViewing: options.allowGuestViewing !== false,
            requireApproval: options.requireApproval || false,
            moderationEnabled: options.moderationEnabled !== false,
            
            // Features
            realTimeUpdates: options.realTimeUpdates !== false,
            markdownSupport: options.markdownSupport !== false,
            codeHighlighting: options.codeHighlighting !== false,
            fileAttachments: options.fileAttachments !== false,
            
            // Visual
            generateHeaders: options.generateHeaders !== false,
            darkMode: options.darkMode !== false,
            customThemes: options.customThemes !== false,
            
            ...options
        };
        
        // Forum data structure
        this.categories = new Map();          // category id → category data
        this.forums = new Map();              // forum id → forum data
        this.topics = new Map();              // topic id → topic data
        this.posts = new Map();               // post id → post data
        this.users = new Map();               // user id → user data
        this.sessions = new Map();            // session id → session data
        
        // Permissions and roles
        this.roles = {
            guest: {
                name: 'Guest',
                permissions: ['view_forum', 'view_topics']
            },
            member: {
                name: 'Member',
                permissions: ['view_forum', 'view_topics', 'create_topics', 'reply_topics', 'edit_own_posts']
            },
            moderator: {
                name: 'Moderator',
                permissions: ['view_forum', 'view_topics', 'create_topics', 'reply_topics', 'edit_any_post', 'delete_posts', 'lock_topics', 'move_topics']
            },
            admin: {
                name: 'Administrator',
                permissions: ['*'] // All permissions
            }
        };
        
        // phpBB-style forum structure
        this.forumStructure = {
            'announcements': {
                name: 'Announcements',
                icon: '📢',
                description: 'Official announcements and news',
                color: '#FF6B6B',
                forumType: 'announcement',
                forums: ['general-announcements', 'updates']
            },
            'general': {
                name: 'General Discussion',
                icon: '💬',
                description: 'General chat and discussions',
                color: '#4ECDC4',
                forumType: 'discussion',
                forums: ['general-chat', 'introductions', 'off-topic']
            },
            'development': {
                name: 'Development',
                icon: '💻',
                description: 'Code, projects, and technical discussions',
                color: '#45B7D1',
                forumType: 'technical',
                forums: ['help-support', 'project-showcase', 'code-review']
            },
            'creative': {
                name: 'Creative Corner',
                icon: '🎨',
                description: 'Art, music, and creative works',
                color: '#F7B731',
                forumType: 'creative',
                forums: ['showcase', 'feedback', 'collaborations']
            },
            'community': {
                name: 'Community',
                icon: '👥',
                description: 'Community events and activities',
                color: '#5D4E75',
                forumType: 'community',
                forums: ['events', 'competitions', 'meetups']
            }
        };
        
        // Extension system (phpBB-style)
        this.extensions = new Map();
        this.hooks = new Map();
        
        // Real-time features
        this.onlineUsers = new Set();
        this.activeTopics = new Map();
        
        this.initialize();
    }
    
    /**
     * Initialize forum bridge
     */
    async initialize() {
        console.log(`
╔════════════════════════════════════════════════════════════════╗
║                    💬 SOULFRA FORUM BRIDGE 💬                  ║
║                                                                ║
║               "Modern forums, classic structure"               ║
║                                                                ║
║  Forum: ${this.config.forumName.padEnd(20)}                            ║
║  GitHub Auth: ${this.config.githubAuth ? 'Enabled' : 'Disabled'}                              ║
║  Real-time: ${this.config.realTimeUpdates ? 'Enabled' : 'Disabled'}                                ║
║  Categories: ${Object.keys(this.forumStructure).length} configured                              ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
        `);
        
        try {
            // Initialize forum structure
            await this.initializeForumStructure();
            
            // Load existing data
            await this.loadForumData();
            
            // Initialize extensions
            await this.initializeExtensions();
            
            // Set up GitHub integration
            if (this.config.githubAuth) {
                await this.initializeGitHubAuth();
            }
            
            // Start real-time system
            if (this.config.realTimeUpdates) {
                this.startRealTimeSystem();
            }
            
            console.log('✅ Forum Bridge initialized!');
            this.emit('forum-initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize forum bridge:', error);
            throw error;
        }
    }
    
    /**
     * Initialize phpBB-style forum structure
     */
    async initializeForumStructure() {
        console.log('🏗️ Initializing forum structure...');
        
        for (const [categoryId, categoryData] of Object.entries(this.forumStructure)) {
            // Create category
            this.categories.set(categoryId, {
                id: categoryId,
                name: categoryData.name,
                icon: categoryData.icon,
                description: categoryData.description,
                color: categoryData.color,
                forumType: categoryData.forumType,
                order: Object.keys(this.forumStructure).indexOf(categoryId),
                forums: [],
                stats: {
                    totalTopics: 0,
                    totalPosts: 0,
                    lastPost: null
                }
            });
            
            // Create forums within category
            for (const forumSlug of categoryData.forums) {
                const forumId = `${categoryId}_${forumSlug}`;
                const forumName = this.slugToName(forumSlug);
                
                this.forums.set(forumId, {
                    id: forumId,
                    name: forumName,
                    slug: forumSlug,
                    categoryId: categoryId,
                    description: this.generateForumDescription(forumSlug),
                    topics: [],
                    permissions: this.getDefaultForumPermissions(categoryData.forumType),
                    stats: {
                        totalTopics: 0,
                        totalPosts: 0,
                        lastPost: null
                    },
                    createdAt: new Date()
                });
                
                // Add forum to category
                this.categories.get(categoryId).forums.push(forumId);
            }
            
            console.log(`  ✓ ${categoryData.icon} ${categoryData.name} - ${categoryData.forums.length} forums`);
        }
    }
    
    /**
     * Create new topic
     */
    async createTopic(forumId, userId, topicData) {
        const forum = this.forums.get(forumId);
        if (!forum) {
            throw new Error(`Forum not found: ${forumId}`);
        }
        
        const user = this.users.get(userId);
        if (!user) {
            throw new Error(`User not found: ${userId}`);
        }
        
        // Check permissions
        if (!this.checkPermission(userId, forumId, 'create_topics')) {
            throw new Error('Insufficient permissions to create topics');
        }
        
        const topicId = `topic_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        
        const topic = {
            id: topicId,
            forumId,
            title: topicData.title || 'Untitled Topic',
            slug: this.generateSlug(topicData.title),
            
            // Content
            content: topicData.content || '',
            contentType: topicData.contentType || 'markdown',
            
            // Author
            authorId: userId,
            authorName: user.username,
            
            // State
            status: 'active', // active, locked, sticky, announcement
            visibility: 'public', // public, private, draft
            
            // Counters
            views: 0,
            replies: 0,
            
            // Posts (first post is the topic itself)
            posts: [],
            
            // Tags and metadata
            tags: topicData.tags || [],
            category: forum.categoryId,
            
            // Timestamps
            createdAt: new Date(),
            updatedAt: new Date(),
            lastPostAt: new Date(),
            lastPostBy: userId
        };
        
        // Create first post (the topic content)
        const firstPost = await this.createPost(topicId, userId, {
            content: topic.content,
            isFirstPost: true
        });
        
        topic.posts.push(firstPost.id);
        
        // Store topic
        this.topics.set(topicId, topic);
        forum.topics.push(topicId);
        
        // Update forum stats
        forum.stats.totalTopics++;
        forum.stats.totalPosts++;
        forum.stats.lastPost = {
            topicId,
            postId: firstPost.id,
            userId,
            username: user.username,
            timestamp: new Date()
        };
        
        // Update category stats
        const category = this.categories.get(forum.categoryId);
        if (category) {
            category.stats.totalTopics++;
            category.stats.totalPosts++;
            category.stats.lastPost = forum.stats.lastPost;
        }
        
        console.log(`📝 Topic created: "${topic.title}"`);
        console.log(`   Forum: ${forum.name}`);
        console.log(`   Author: ${user.username}`);
        
        this.emit('topic-created', {
            topicId,
            forumId,
            userId,
            topic
        });
        
        return topic;
    }
    
    /**
     * Create new post
     */
    async createPost(topicId, userId, postData) {
        const topic = this.topics.get(topicId);
        if (!topic) {
            throw new Error(`Topic not found: ${topicId}`);
        }
        
        const user = this.users.get(userId);
        if (!user) {
            throw new Error(`User not found: ${userId}`);
        }
        
        // Check permissions
        if (!postData.isFirstPost && !this.checkPermission(userId, topic.forumId, 'reply_topics')) {
            throw new Error('Insufficient permissions to reply to topics');
        }
        
        const postId = `post_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        
        const post = {
            id: postId,
            topicId,
            forumId: topic.forumId,
            
            // Content
            content: postData.content || '',
            contentType: postData.contentType || 'markdown',
            rawContent: postData.rawContent || postData.content,
            
            // Author
            authorId: userId,
            authorName: user.username,
            
            // State
            status: 'active', // active, deleted, moderated
            isFirstPost: postData.isFirstPost || false,
            
            // Metadata
            attachments: postData.attachments || [],
            mentions: this.extractMentions(postData.content),
            
            // Moderation
            editCount: 0,
            lastEditedBy: null,
            lastEditedAt: null,
            
            // Timestamps
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        // Store post
        this.posts.set(postId, post);
        
        if (!post.isFirstPost) {
            topic.replies++;
            topic.posts.push(postId);
            topic.lastPostAt = new Date();
            topic.lastPostBy = userId;
            topic.updatedAt = new Date();
            
            // Update forum stats
            const forum = this.forums.get(topic.forumId);
            if (forum) {
                forum.stats.totalPosts++;
                forum.stats.lastPost = {
                    topicId,
                    postId,
                    userId,
                    username: user.username,
                    timestamp: new Date()
                };
            }
        }
        
        console.log(`💬 Post created in "${topic.title}"`);
        console.log(`   Author: ${user.username}`);
        console.log(`   Content: ${post.content.substring(0, 50)}...`);
        
        this.emit('post-created', {
            postId,
            topicId,
            userId,
            post
        });
        
        return post;
    }
    
    /**
     * Get forum category with enhanced header
     */
    async getForumCategory(categoryId, includeHeader = true) {
        const category = this.categories.get(categoryId);
        if (!category) {
            throw new Error(`Category not found: ${categoryId}`);
        }
        
        // Get forums in category
        const forums = category.forums.map(forumId => {
            const forum = this.forums.get(forumId);
            if (!forum) return null;
            
            // Get recent topics
            const recentTopics = forum.topics
                .slice(-5)
                .map(topicId => this.topics.get(topicId))
                .filter(t => t)
                .sort((a, b) => new Date(b.lastPostAt) - new Date(a.lastPostAt));
            
            return {
                ...forum,
                recentTopics
            };
        }).filter(f => f);
        
        let header = null;
        if (includeHeader && this.config.generateHeaders) {
            header = await this.generateCategoryHeader(category, forums);
        }
        
        return {
            category: {
                ...category,
                forums
            },
            header
        };
    }
    
    /**
     * Generate dynamic category header
     */
    async generateCategoryHeader(category, forums) {
        const totalTopics = forums.reduce((sum, f) => sum + f.stats.totalTopics, 0);
        const totalPosts = forums.reduce((sum, f) => sum + f.stats.totalPosts, 0);
        const onlineCount = this.onlineUsers.size;
        
        // Get recent activity
        const recentActivity = [];
        for (const forum of forums) {
            if (forum.recentTopics.length > 0) {
                recentActivity.push(...forum.recentTopics.slice(0, 2));
            }
        }
        recentActivity.sort((a, b) => new Date(b.lastPostAt) - new Date(a.lastPostAt));
        
        return `
<div class="forum-category-header" style="
    background: linear-gradient(135deg, ${category.color} 0%, ${this.adjustColor(category.color, -30)} 100%);
    position: relative;
    min-height: 300px;
    color: white;
    overflow: hidden;
">
    <!-- Background pattern -->
    <div class="header-pattern" style="
        position: absolute;
        width: 100%;
        height: 100%;
        background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="30" fill="rgba(255,255,255,0.03)"/></svg>');
        background-size: 60px 60px;
    "></div>
    
    <div class="header-content" style="
        position: relative;
        z-index: 10;
        padding: 60px;
        text-align: center;
    ">
        <div class="category-icon" style="font-size: 80px; margin-bottom: 20px;">
            ${category.icon}
        </div>
        
        <h1 style="font-size: 48px; margin: 0 0 15px 0; font-weight: 300;">
            ${category.name}
        </h1>
        
        <p style="font-size: 20px; opacity: 0.9; margin: 0 0 40px 0; max-width: 600px; margin-left: auto; margin-right: auto;">
            ${category.description}
        </p>
        
        <div class="category-stats" style="
            display: flex;
            justify-content: center;
            gap: 60px;
            margin: 40px 0;
        ">
            <div class="stat-item">
                <div style="font-size: 36px; font-weight: bold;">${forums.length}</div>
                <div style="font-size: 14px; opacity: 0.8; text-transform: uppercase;">Forums</div>
            </div>
            <div class="stat-item">
                <div style="font-size: 36px; font-weight: bold;">${totalTopics.toLocaleString()}</div>
                <div style="font-size: 14px; opacity: 0.8; text-transform: uppercase;">Topics</div>
            </div>
            <div class="stat-item">
                <div style="font-size: 36px; font-weight: bold;">${totalPosts.toLocaleString()}</div>
                <div style="font-size: 14px; opacity: 0.8; text-transform: uppercase;">Posts</div>
            </div>
            <div class="stat-item">
                <div style="font-size: 36px; font-weight: bold;">${onlineCount}</div>
                <div style="font-size: 14px; opacity: 0.8; text-transform: uppercase;">Online</div>
            </div>
        </div>
        
        <div class="recent-activity" style="
            max-width: 800px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            padding: 30px;
            border-radius: 15px;
        ">
            <h3 style="margin: 0 0 20px 0; font-size: 24px;">🔥 Recent Activity</h3>
            <div class="activity-list">
                ${recentActivity.slice(0, 4).map(topic => `
                    <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 15px;
                        background: rgba(255, 255, 255, 0.1);
                        border-radius: 8px;
                        margin-bottom: 10px;
                    ">
                        <div>
                            <div style="font-weight: bold; margin-bottom: 5px;">
                                ${topic.title}
                            </div>
                            <div style="font-size: 14px; opacity: 0.8;">
                                by ${topic.authorName} • ${topic.replies} replies
                            </div>
                        </div>
                        <div style="text-align: right; font-size: 12px; opacity: 0.7;">
                            ${this.formatTimeAgo(topic.lastPostAt)}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    </div>
</div>

<style>
@keyframes float-in {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

.forum-category-header {
    animation: float-in 0.8s ease-out;
}

.stat-item {
    animation: float-in 0.8s ease-out;
}

.activity-list > div {
    transition: all 0.3s ease;
}

.activity-list > div:hover {
    background: rgba(255, 255, 255, 0.15) !important;
    transform: translateX(5px);
}
</style>`;
    }
    
    /**
     * Generate React forum component
     */
    generateForumComponent(categoryId) {
        return `
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const ForumCategory = () => {
    const { categoryId } = useParams();
    const [categoryData, setCategoryData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [onlineUsers, setOnlineUsers] = useState([]);
    
    useEffect(() => {
        // Fetch category data
        fetch(\`/api/forum/category/\${categoryId}\`)
            .then(res => res.json())
            .then(data => {
                setCategoryData(data);
                setLoading(false);
            });
            
        // Set up real-time updates
        const ws = new WebSocket('ws://localhost:3002/realtime');
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'online_users') {
                setOnlineUsers(data.users);
            }
        };
        
        return () => ws.close();
    }, [categoryId]);
    
    if (loading) {
        return <div className="forum-loading">Loading forum...</div>;
    }
    
    return (
        <div className="forum-category-page">
            {/* Dynamic header */}
            <div dangerouslySetInnerHTML={{ __html: categoryData.header }} />
            
            {/* Breadcrumb navigation */}
            <nav className="breadcrumb">
                <Link to="/forum">Forum Home</Link>
                <span className="separator">›</span>
                <span>{categoryData.category.name}</span>
            </nav>
            
            {/* Forum list */}
            <div className="forums-container">
                {categoryData.category.forums.map(forum => (
                    <div key={forum.id} className="forum-row">
                        <div className="forum-info">
                            <div className="forum-icon">
                                {getCategoryIcon(categoryData.category.forumType)}
                            </div>
                            <div className="forum-details">
                                <h3>
                                    <Link to={\`/forum/\${forum.id}\`}>
                                        {forum.name}
                                    </Link>
                                </h3>
                                <p>{forum.description}</p>
                            </div>
                        </div>
                        
                        <div className="forum-stats">
                            <div className="stat">
                                <span className="value">{forum.stats.totalTopics}</span>
                                <span className="label">Topics</span>
                            </div>
                            <div className="stat">
                                <span className="value">{forum.stats.totalPosts}</span>
                                <span className="label">Posts</span>
                            </div>
                        </div>
                        
                        <div className="forum-last-post">
                            {forum.stats.lastPost ? (
                                <>
                                    <div className="last-post-topic">
                                        <Link to={\`/forum/topic/\${forum.stats.lastPost.topicId}\`}>
                                            Last post topic
                                        </Link>
                                    </div>
                                    <div className="last-post-meta">
                                        by {forum.stats.lastPost.username}<br/>
                                        {new Date(forum.stats.lastPost.timestamp).toLocaleString()}
                                    </div>
                                </>
                            ) : (
                                <div className="no-posts">No posts yet</div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            
            {/* Online users */}
            <div className="online-users-widget">
                <h4>Online Users ({onlineUsers.length})</h4>
                <div className="user-avatars">
                    {onlineUsers.slice(0, 10).map(user => (
                        <img 
                            key={user.id}
                            src={user.avatar}
                            alt={user.username}
                            title={user.username}
                            className="user-avatar"
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

const getCategoryIcon = (forumType) => {
    const icons = {
        announcement: '📢',
        discussion: '💬',
        technical: '💻',
        creative: '🎨',
        community: '👥'
    };
    return icons[forumType] || '📁';
};

export default ForumCategory;`;
    }
    
    /**
     * Initialize GitHub authentication
     */
    async initializeGitHubAuth() {
        console.log('🔗 Initializing GitHub authentication...');
        
        // In production, this would set up OAuth flow
        this.githubAuth = {
            clientId: process.env.GITHUB_CLIENT_ID,
            clientSecret: process.env.GITHUB_CLIENT_SECRET,
            scope: 'user:email',
            redirectUri: '/auth/github/callback'
        };
    }
    
    /**
     * Initialize extensions system
     */
    async initializeExtensions() {
        console.log('🧩 Initializing extensions system...');
        
        // Sample extensions
        const coreExtensions = [
            {
                id: 'syntax-highlighting',
                name: 'Syntax Highlighting',
                description: 'Code syntax highlighting in posts',
                version: '1.0.0',
                enabled: true
            },
            {
                id: 'emoji-reactions',
                name: 'Emoji Reactions',
                description: 'React to posts with emojis',
                version: '1.2.0',
                enabled: true
            },
            {
                id: 'github-integration',
                name: 'GitHub Integration',
                description: 'Link GitHub repositories and issues',
                version: '2.0.0',
                enabled: this.config.githubAuth
            }
        ];
        
        for (const ext of coreExtensions) {
            this.extensions.set(ext.id, ext);
            if (ext.enabled) {
                console.log(`  ✓ ${ext.name} v${ext.version}`);
            }
        }
    }
    
    /**
     * Start real-time system
     */
    startRealTimeSystem() {
        console.log('⚡ Starting real-time updates...');
        
        // Simulate WebSocket connections
        setInterval(() => {
            // Update online user count
            const newCount = Math.floor(Math.random() * 50) + 10;
            for (let i = 0; i < newCount; i++) {
                this.onlineUsers.add(`user_${i}`);
            }
            
            this.emit('online-users-updated', {
                count: this.onlineUsers.size,
                users: Array.from(this.onlineUsers)
            });
        }, 30000); // Update every 30 seconds
    }
    
    /**
     * Check user permission
     */
    checkPermission(userId, forumId, permission) {
        const user = this.users.get(userId);
        if (!user) return false;
        
        const userRole = user.role || 'guest';
        const role = this.roles[userRole];
        
        if (!role) return false;
        
        // Admin has all permissions
        if (role.permissions.includes('*')) return true;
        
        return role.permissions.includes(permission);
    }
    
    /**
     * Utility functions
     */
    slugToName(slug) {
        return slug.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }
    
    generateSlug(text) {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }
    
    generateForumDescription(slug) {
        const descriptions = {
            'general-announcements': 'Important announcements and site news',
            'updates': 'System updates and changelog',
            'general-chat': 'General discussions and conversations',
            'introductions': 'Introduce yourself to the community',
            'off-topic': 'Discussions about anything and everything',
            'help-support': 'Get help with technical issues',
            'project-showcase': 'Show off your latest projects',
            'code-review': 'Get feedback on your code',
            'showcase': 'Share your creative works',
            'feedback': 'Give and receive constructive feedback',
            'collaborations': 'Find collaborators for your projects',
            'events': 'Community events and meetups',
            'competitions': 'Contests and challenges',
            'meetups': 'Local meetups and gatherings'
        };
        
        return descriptions[slug] || 'Forum discussions';
    }
    
    getDefaultForumPermissions(forumType) {
        const permissions = {
            announcement: ['admin', 'moderator'], // Who can post
            discussion: ['member', 'moderator', 'admin'],
            technical: ['member', 'moderator', 'admin'],
            creative: ['member', 'moderator', 'admin'],
            community: ['member', 'moderator', 'admin']
        };
        
        return permissions[forumType] || ['member', 'moderator', 'admin'];
    }
    
    extractMentions(content) {
        const mentionRegex = /@(\w+)/g;
        const mentions = [];
        let match;
        
        while ((match = mentionRegex.exec(content)) !== null) {
            mentions.push(match[1]);
        }
        
        return mentions;
    }
    
    adjustColor(color, amount) {
        const num = parseInt(color.replace('#', ''), 16);
        const r = Math.min(255, Math.max(0, (num >> 16) + amount));
        const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
        const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
        
        return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
    }
    
    formatTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
        
        if (diffInSeconds < 60) return 'just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    }
    
    /**
     * Load forum data
     */
    async loadForumData() {
        console.log('📂 Loading forum data...');
        
        // Create sample user for demo
        this.users.set('demo-user', {
            id: 'demo-user',
            username: 'DemoUser',
            email: 'demo@example.com',
            role: 'member',
            avatar: '/avatars/demo.png',
            joinedAt: new Date(),
            stats: {
                totalPosts: 0,
                totalTopics: 0
            }
        });
        
        // Create sample topics for demo
        const sampleTopic = await this.createTopic('general_general-chat', 'demo-user', {
            title: 'Welcome to Soulfra Community!',
            content: 'This is our community forum where we discuss everything related to creativity, development, and collaboration.\n\nFeel free to introduce yourself and share your projects!'
        });
        
        console.log(`✓ Loaded sample data`);
    }
    
    /**
     * Generate status report
     */
    generateStatusReport() {
        const report = {
            categories: this.categories.size,
            forums: this.forums.size,
            topics: this.topics.size,
            posts: this.posts.size,
            users: this.users.size,
            onlineUsers: this.onlineUsers.size,
            extensions: this.extensions.size
        };
        
        console.log('\n📊 Forum Bridge Status');
        console.log('═════════════════════');
        console.log(`📁 Categories: ${report.categories}`);
        console.log(`📂 Forums: ${report.forums}`);
        console.log(`📝 Topics: ${report.topics}`);
        console.log(`💬 Posts: ${report.posts}`);
        console.log(`👥 Users: ${report.users}`);
        console.log(`🟢 Online: ${report.onlineUsers}`);
        console.log(`🧩 Extensions: ${report.extensions}`);
        
        return report;
    }
    
    /**
     * Demo mode
     */
    static async demo() {
        console.log('🎮 Forum Bridge Demo');
        console.log('═══════════════════');
        
        const forum = new SoulfraForumBridge({
            forumName: 'Soulfra Demo Forum',
            githubAuth: true,
            realTimeUpdates: true
        });
        
        // Wait for initialization
        await new Promise(resolve => {
            forum.once('forum-initialized', resolve);
        });
        
        // Show category structure
        console.log('\n📁 Forum Categories:');
        for (const [categoryId, category] of forum.categories) {
            console.log(`\n${category.icon} ${category.name}`);
            console.log(`   ${category.description}`);
            console.log(`   Forums: ${category.forums.length}`);
            
            for (const forumId of category.forums) {
                const forumData = forum.forums.get(forumId);
                console.log(`     📂 ${forumData.name}`);
            }
        }
        
        // Generate sample header
        console.log('\n🎨 Sample Category Header:');
        const generalCategory = await forum.getForumCategory('general');
        console.log(generalCategory.header.substring(0, 500) + '...');
        
        // Show status
        forum.generateStatusReport();
        
        console.log('\n✅ Demo complete! Features showcased:');
        console.log('  • phpBB-style forum structure');
        console.log('  • Dynamic visual headers');
        console.log('  • Real-time user tracking');
        console.log('  • GitHub authentication ready');
        console.log('  • Extension system');
        console.log('  • React components generated');
    }
}

// Run demo if called directly
if (require.main === module) {
    SoulfraForumBridge.demo().catch(console.error);
}

module.exports = SoulfraForumBridge;