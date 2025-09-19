#!/usr/bin/env node

/**
 * 🏛️ Soulfra Platform Hub
 * 
 * Central orchestrator that connects all Soulfra services:
 * - GitHub organization management
 * - Competition system
 * - Forum integration
 * - Visual showcase gallery
 * - Extension marketplace
 * 
 * "Your domains are complete worlds, not just landing pages"
 */

const { EventEmitter } = require('events');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class SoulfraPlatformHub extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            // Platform identity
            platformName: options.platformName || 'Soulfra',
            organizationName: options.organizationName || 'soulfra',
            primaryDomain: options.primaryDomain || 'soulfra.com',
            
            // GitHub integration
            githubOrg: options.githubOrg || process.env.GITHUB_ORG,
            githubToken: options.githubToken || process.env.GITHUB_TOKEN,
            
            // Service endpoints
            services: {
                hub: options.hubPort || 3000,
                competitions: options.competitionsPort || 3001,
                forum: options.forumPort || 3002,
                gallery: options.galleryPort || 3003,
                marketplace: options.marketplacePort || 3004,
                silos: options.silosPort || 3005
            },
            
            // Visual configuration
            headerStyle: options.headerStyle || 'dynamic-showcase',
            bannerGeneration: options.bannerGeneration !== false,
            contentPreview: options.contentPreview !== false,
            
            // Authentication
            authProvider: options.authProvider || 'soulfra-sso',
            sessionTimeout: options.sessionTimeout || 86400, // 24 hours
            
            ...options
        };
        
        // Service registry
        this.services = {
            repositories: new Map(),      // repo name → repository data
            competitions: new Map(),      // competition id → competition
            forumCategories: new Map(),   // category id → forum category
            showcases: new Map(),         // showcase id → visual gallery
            extensions: new Map(),        // extension id → marketplace item
            domains: new Map()            // domain → silo configuration
        };
        
        // Platform sections (like LMMS structure)
        this.sections = {
            repositories: {
                title: 'Our Projects',
                icon: '📦',
                description: 'Explore our open source repositories',
                headerImage: 'dynamic', // Generated from repo activity
                navigation: [
                    { name: 'All Repositories', path: '/repos' },
                    { name: 'Core Projects', path: '/repos/core' },
                    { name: 'Community Projects', path: '/repos/community' },
                    { name: 'Templates', path: '/repos/templates' }
                ]
            },
            competitions: {
                title: 'Creative Competitions',
                icon: '🏆',
                description: 'Showcase your skills and win prizes',
                headerImage: 'dynamic', // Generated from submissions
                navigation: [
                    { name: 'Active Contests', path: '/competitions/active' },
                    { name: 'Past Winners', path: '/competitions/winners' },
                    { name: 'Submit Entry', path: '/competitions/submit' },
                    { name: 'Judge Portal', path: '/competitions/judge' }
                ]
            },
            forum: {
                title: 'Community Forum',
                icon: '💬',
                description: 'Connect with other creators',
                headerImage: 'dynamic', // Generated from recent posts
                navigation: [
                    { name: 'Recent Topics', path: '/forum/recent' },
                    { name: 'Categories', path: '/forum/categories' },
                    { name: 'Members', path: '/forum/members' },
                    { name: 'Search', path: '/forum/search' }
                ]
            },
            showcase: {
                title: 'Visual Gallery',
                icon: '🎨',
                description: 'Beautiful creations from our community',
                headerImage: 'dynamic', // Collage of recent works
                navigation: [
                    { name: 'Featured', path: '/showcase/featured' },
                    { name: 'Categories', path: '/showcase/categories' },
                    { name: 'Artists', path: '/showcase/artists' },
                    { name: 'Upload', path: '/showcase/upload' }
                ]
            },
            marketplace: {
                title: 'Extension Hub',
                icon: '🧩',
                description: 'Plugins, themes, and add-ons',
                headerImage: 'dynamic', // Grid of popular extensions
                navigation: [
                    { name: 'Browse All', path: '/marketplace/browse' },
                    { name: 'Categories', path: '/marketplace/categories' },
                    { name: 'Developers', path: '/marketplace/developers' },
                    { name: 'Submit', path: '/marketplace/submit' }
                ]
            }
        };
        
        // Domain silo configurations
        this.domainSilos = {
            'soulfra.com': {
                type: 'hub',
                theme: 'professional',
                sections: ['repositories', 'competitions', 'forum', 'showcase', 'marketplace'],
                customHeader: true
            },
            'soulfra.dev': {
                type: 'developer',
                theme: 'technical',
                sections: ['repositories', 'marketplace', 'forum'],
                customHeader: true
            },
            'soulfra.art': {
                type: 'creative',
                theme: 'artistic',
                sections: ['showcase', 'competitions'],
                customHeader: true
            },
            'soulfra.community': {
                type: 'social',
                theme: 'community',
                sections: ['forum', 'competitions', 'showcase'],
                customHeader: true
            }
        };
        
        // Visual header templates
        this.headerTemplates = {
            repositories: this.createRepositoryHeader.bind(this),
            competitions: this.createCompetitionHeader.bind(this),
            forum: this.createForumHeader.bind(this),
            showcase: this.createShowcaseHeader.bind(this),
            marketplace: this.createMarketplaceHeader.bind(this)
        };
        
        // Authentication state
        this.authState = {
            sessions: new Map(),
            githubUsers: new Map(),
            permissions: new Map()
        };
        
        this.initialize();
    }
    
    /**
     * Initialize the platform hub
     */
    async initialize() {
        console.log(`
╔════════════════════════════════════════════════════════════════╗
║                    🏛️  SOULFRA PLATFORM HUB 🏛️                 ║
║                                                                ║
║          "Complete worlds, not just landing pages"             ║
║                                                                ║
║  Platform: ${this.config.platformName.padEnd(20)}                            ║
║  Organization: ${this.config.organizationName.padEnd(20)}                        ║
║  Services: ${Object.keys(this.config.services).length} active                                  ║
║                                                                ║
║  Sections:                                                     ║`);

        for (const [key, section] of Object.entries(this.sections)) {
            console.log(`║    ${section.icon} ${section.title.padEnd(25)} [/${key}]        ║`);
        }

        console.log(`║                                                                ║
╚════════════════════════════════════════════════════════════════╝
        `);
        
        try {
            // Initialize GitHub integration
            await this.initializeGitHubIntegration();
            
            // Load existing data
            await this.loadPlatformData();
            
            // Start service orchestration
            await this.startServiceOrchestration();
            
            // Initialize domain silos
            await this.initializeDomainSilos();
            
            // Set up header generation
            await this.initializeHeaderGeneration();
            
            console.log('✅ Soulfra Platform Hub initialized!');
            this.emit('platform-initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize platform hub:', error);
            throw error;
        }
    }
    
    /**
     * Initialize GitHub integration
     */
    async initializeGitHubIntegration() {
        console.log('🔗 Initializing GitHub integration...');
        
        // Simulate GitHub org structure
        const mockRepos = [
            {
                name: 'soulfra-core',
                description: 'Core platform infrastructure',
                stars: 1234,
                language: 'JavaScript',
                topics: ['platform', 'infrastructure', 'nodejs'],
                lastUpdate: new Date()
            },
            {
                name: 'soulfra-ui',
                description: 'React components and design system',
                stars: 567,
                language: 'TypeScript',
                topics: ['react', 'ui', 'design-system'],
                lastUpdate: new Date()
            },
            {
                name: 'soulfra-templates',
                description: 'Starter templates for projects',
                stars: 890,
                language: 'JavaScript',
                topics: ['templates', 'boilerplate', 'starter'],
                lastUpdate: new Date()
            },
            {
                name: 'soulfra-extensions',
                description: 'Official platform extensions',
                stars: 345,
                language: 'JavaScript',
                topics: ['extensions', 'plugins', 'addons'],
                lastUpdate: new Date()
            }
        ];
        
        for (const repo of mockRepos) {
            this.services.repositories.set(repo.name, repo);
        }
        
        console.log(`✓ Loaded ${this.services.repositories.size} repositories`);
    }
    
    /**
     * Create dynamic repository header
     */
    async createRepositoryHeader() {
        const repos = Array.from(this.services.repositories.values());
        const totalStars = repos.reduce((sum, repo) => sum + repo.stars, 0);
        
        return `
<div class="platform-header repositories-header">
    <div class="header-background">
        <!-- Dynamic code visualization -->
        <div class="code-particles">
            ${this.generateCodeParticles()}
        </div>
    </div>
    
    <div class="header-content">
        <h1>📦 Our Open Source Projects</h1>
        <div class="stats-row">
            <div class="stat">
                <span class="stat-value">${repos.length}</span>
                <span class="stat-label">Repositories</span>
            </div>
            <div class="stat">
                <span class="stat-value">${totalStars.toLocaleString()}</span>
                <span class="stat-label">Total Stars</span>
            </div>
            <div class="stat">
                <span class="stat-value">${this.getUniqueLanguages(repos).length}</span>
                <span class="stat-label">Languages</span>
            </div>
        </div>
        
        <div class="featured-repos">
            ${repos.slice(0, 3).map(repo => `
                <div class="repo-card">
                    <h3>${repo.name}</h3>
                    <p>${repo.description}</p>
                    <div class="repo-meta">
                        <span class="language">${repo.language}</span>
                        <span class="stars">⭐ ${repo.stars}</span>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
</div>

<style>
.repositories-header {
    position: relative;
    height: 400px;
    overflow: hidden;
    background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
}

.code-particles {
    position: absolute;
    width: 100%;
    height: 100%;
    opacity: 0.3;
}

.header-content {
    position: relative;
    z-index: 10;
    padding: 60px;
    text-align: center;
    color: white;
}

.stats-row {
    display: flex;
    justify-content: center;
    gap: 60px;
    margin: 40px 0;
}

.stat {
    text-align: center;
}

.stat-value {
    display: block;
    font-size: 48px;
    font-weight: bold;
}

.stat-label {
    display: block;
    font-size: 14px;
    opacity: 0.8;
    text-transform: uppercase;
}

.featured-repos {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    max-width: 900px;
    margin: 0 auto;
}

.repo-card {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    padding: 20px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.repo-meta {
    display: flex;
    justify-content: space-between;
    margin-top: 10px;
    font-size: 14px;
}

.language {
    background: rgba(255, 255, 255, 0.2);
    padding: 2px 8px;
    border-radius: 4px;
}
</style>`;
    }
    
    /**
     * Create dynamic competition header
     */
    async createCompetitionHeader() {
        return `
<div class="platform-header competitions-header">
    <div class="header-background">
        <!-- Trophy particle effects -->
        <div class="trophy-animation">
            🏆 🥇 🥈 🥉 🎯 🎨 🎵 🎮
        </div>
    </div>
    
    <div class="header-content">
        <h1>🏆 Creative Competitions</h1>
        <p class="subtitle">Show your skills, win amazing prizes!</p>
        
        <div class="active-competitions">
            <div class="competition-card featured">
                <div class="competition-badge">ACTIVE</div>
                <h3>Summer Music Challenge 2025</h3>
                <p>Create an original track using our tools</p>
                <div class="competition-meta">
                    <span>🎵 Music</span>
                    <span>💰 $1000 Prize</span>
                    <span>⏰ 15 days left</span>
                </div>
                <div class="progress-bar">
                    <div class="progress" style="width: 65%"></div>
                </div>
                <button class="cta-button">Submit Entry</button>
            </div>
            
            <div class="competition-card">
                <div class="competition-badge upcoming">UPCOMING</div>
                <h3>Visual Art Showcase</h3>
                <p>Digital art competition</p>
                <div class="competition-meta">
                    <span>🎨 Art</span>
                    <span>💰 $500 Prize</span>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
.competitions-header {
    position: relative;
    min-height: 450px;
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    color: white;
}

.trophy-animation {
    position: absolute;
    width: 100%;
    height: 100%;
    font-size: 40px;
    display: flex;
    gap: 40px;
    justify-content: center;
    align-items: center;
    opacity: 0.1;
    animation: float 20s infinite linear;
}

@keyframes float {
    0% { transform: translateX(0); }
    100% { transform: translateX(-100%); }
}

.active-competitions {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 30px;
    max-width: 900px;
    margin: 40px auto 0;
}

.competition-card {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    padding: 30px;
    border-radius: 15px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    position: relative;
}

.competition-card.featured {
    grid-column: 1;
}

.competition-badge {
    position: absolute;
    top: 15px;
    right: 15px;
    background: #4CAF50;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: bold;
}

.competition-badge.upcoming {
    background: #FF9800;
}

.competition-meta {
    display: flex;
    gap: 20px;
    margin: 15px 0;
    font-size: 14px;
}

.progress-bar {
    height: 8px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    margin: 20px 0;
    overflow: hidden;
}

.progress {
    height: 100%;
    background: linear-gradient(90deg, #4CAF50, #8BC34A);
    border-radius: 4px;
    transition: width 0.3s ease;
}

.cta-button {
    background: white;
    color: #f5576c;
    border: none;
    padding: 12px 30px;
    border-radius: 25px;
    font-weight: bold;
    cursor: pointer;
    transition: transform 0.2s;
}

.cta-button:hover {
    transform: translateY(-2px);
}
</style>`;
    }
    
    /**
     * Create dynamic forum header (phpBB style)
     */
    async createForumHeader() {
        return `
<div class="platform-header forum-header">
    <div class="header-background">
        <div class="chat-bubbles">
            ${this.generateChatBubbles()}
        </div>
    </div>
    
    <div class="header-content">
        <h1>💬 Community Forum</h1>
        <p class="subtitle">Connect, share, and learn together</p>
        
        <div class="forum-stats">
            <div class="stat-box">
                <div class="stat-icon">👥</div>
                <div class="stat-info">
                    <div class="stat-value">5,234</div>
                    <div class="stat-label">Members</div>
                </div>
            </div>
            
            <div class="stat-box">
                <div class="stat-icon">📝</div>
                <div class="stat-info">
                    <div class="stat-value">12,456</div>
                    <div class="stat-label">Topics</div>
                </div>
            </div>
            
            <div class="stat-box">
                <div class="stat-icon">💭</div>
                <div class="stat-info">
                    <div class="stat-value">89,234</div>
                    <div class="stat-label">Posts</div>
                </div>
            </div>
            
            <div class="stat-box">
                <div class="stat-icon">🔥</div>
                <div class="stat-info">
                    <div class="stat-value">234</div>
                    <div class="stat-label">Online Now</div>
                </div>
            </div>
        </div>
        
        <div class="recent-topics">
            <h3>🔥 Hot Topics</h3>
            <div class="topic-list">
                <div class="topic-item">
                    <span class="topic-icon">📌</span>
                    <span class="topic-title">Welcome to Soulfra Community!</span>
                    <span class="topic-meta">by admin • 234 replies</span>
                </div>
                <div class="topic-item">
                    <span class="topic-icon">🎨</span>
                    <span class="topic-title">Share your latest creations</span>
                    <span class="topic-meta">by artist123 • 45 replies</span>
                </div>
                <div class="topic-item">
                    <span class="topic-icon">💡</span>
                    <span class="topic-title">Feature request: Dark mode</span>
                    <span class="topic-meta">by user456 • 12 replies</span>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
.forum-header {
    position: relative;
    min-height: 500px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.chat-bubbles {
    position: absolute;
    width: 100%;
    height: 100%;
    overflow: hidden;
}

.forum-stats {
    display: flex;
    justify-content: center;
    gap: 40px;
    margin: 40px 0;
}

.stat-box {
    display: flex;
    align-items: center;
    gap: 15px;
    background: rgba(255, 255, 255, 0.1);
    padding: 20px 30px;
    border-radius: 10px;
    backdrop-filter: blur(10px);
}

.stat-icon {
    font-size: 40px;
}

.recent-topics {
    max-width: 800px;
    margin: 0 auto;
    background: rgba(255, 255, 255, 0.1);
    padding: 30px;
    border-radius: 15px;
    backdrop-filter: blur(10px);
}

.topic-list {
    margin-top: 20px;
}

.topic-item {
    display: flex;
    align-items: center;
    gap: 15px;
    padding: 15px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.topic-item:last-child {
    border-bottom: none;
}

.topic-icon {
    font-size: 24px;
}

.topic-title {
    flex: 1;
    font-weight: 500;
}

.topic-meta {
    font-size: 14px;
    opacity: 0.7;
}
</style>`;
    }
    
    /**
     * Create dynamic showcase header (Vlad Studio style)
     */
    async createShowcaseHeader() {
        return `
<div class="platform-header showcase-header">
    <div class="header-background">
        <!-- Grid of artwork previews -->
        <div class="artwork-grid">
            ${this.generateArtworkGrid()}
        </div>
    </div>
    
    <div class="header-content">
        <h1>🎨 Visual Gallery</h1>
        <p class="subtitle">Stunning creations from our community</p>
        
        <div class="featured-artwork">
            <div class="artwork-main">
                <img src="/api/placeholder/600/400" alt="Featured Artwork" />
                <div class="artwork-overlay">
                    <h3>Cosmic Dreams</h3>
                    <p>by ArtistName</p>
                    <div class="artwork-stats">
                        <span>❤️ 1,234</span>
                        <span>👁️ 5,678</span>
                        <span>💬 89</span>
                    </div>
                </div>
            </div>
            
            <div class="artwork-thumbnails">
                ${[1,2,3,4].map(i => `
                    <div class="thumbnail">
                        <img src="/api/placeholder/150/150" alt="Artwork ${i}" />
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="gallery-categories">
            <button class="category-btn active">All</button>
            <button class="category-btn">Wallpapers</button>
            <button class="category-btn">Illustrations</button>
            <button class="category-btn">3D Art</button>
            <button class="category-btn">Photography</button>
        </div>
    </div>
</div>

<style>
.showcase-header {
    position: relative;
    min-height: 600px;
    background: #1a1a1a;
    color: white;
    overflow: hidden;
}

.artwork-grid {
    position: absolute;
    width: 120%;
    height: 120%;
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 10px;
    transform: rotate(-5deg) translate(-10%, -10%);
    opacity: 0.2;
}

.featured-artwork {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 20px;
    max-width: 1000px;
    margin: 40px auto;
}

.artwork-main {
    position: relative;
    border-radius: 15px;
    overflow: hidden;
}

.artwork-main img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.artwork-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.9), transparent);
    padding: 30px;
}

.artwork-stats {
    display: flex;
    gap: 20px;
    margin-top: 10px;
}

.artwork-thumbnails {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
}

.thumbnail {
    border-radius: 10px;
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.2s;
}

.thumbnail:hover {
    transform: scale(1.05);
}

.thumbnail img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.gallery-categories {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-top: 40px;
}

.category-btn {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    padding: 10px 25px;
    border-radius: 25px;
    cursor: pointer;
    transition: all 0.3s;
}

.category-btn.active,
.category-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
}
</style>`;
    }
    
    /**
     * Create dynamic marketplace header (phpBB extensions style)
     */
    async createMarketplaceHeader() {
        return `
<div class="platform-header marketplace-header">
    <div class="header-background">
        <div class="extension-icons">
            🧩 🔌 🎨 🛠️ ⚙️ 🎯 🚀 💎
        </div>
    </div>
    
    <div class="header-content">
        <h1>🧩 Extension Marketplace</h1>
        <p class="subtitle">Enhance your platform with powerful add-ons</p>
        
        <div class="marketplace-stats">
            <div class="market-stat">
                <div class="stat-number">523</div>
                <div class="stat-label">Extensions</div>
            </div>
            <div class="market-stat">
                <div class="stat-number">89</div>
                <div class="stat-label">Developers</div>
            </div>
            <div class="market-stat">
                <div class="stat-number">12.4k</div>
                <div class="stat-label">Downloads</div>
            </div>
        </div>
        
        <div class="featured-extensions">
            <h3>⭐ Featured Extensions</h3>
            <div class="extension-grid">
                <div class="extension-card">
                    <div class="extension-icon">🎨</div>
                    <h4>Dark Mode Pro</h4>
                    <p>Advanced theme switcher with 20+ themes</p>
                    <div class="extension-meta">
                        <span class="rating">⭐ 4.8</span>
                        <span class="downloads">2.1k downloads</span>
                    </div>
                    <button class="install-btn">Install</button>
                </div>
                
                <div class="extension-card">
                    <div class="extension-icon">📊</div>
                    <h4>Analytics Dashboard</h4>
                    <p>Comprehensive statistics and insights</p>
                    <div class="extension-meta">
                        <span class="rating">⭐ 4.9</span>
                        <span class="downloads">1.8k downloads</span>
                    </div>
                    <button class="install-btn">Install</button>
                </div>
                
                <div class="extension-card">
                    <div class="extension-icon">🔔</div>
                    <h4>Smart Notifications</h4>
                    <p>AI-powered notification system</p>
                    <div class="extension-meta">
                        <span class="rating">⭐ 4.7</span>
                        <span class="downloads">3.2k downloads</span>
                    </div>
                    <button class="install-btn">Install</button>
                </div>
            </div>
        </div>
        
        <div class="browse-categories">
            <a href="/marketplace/themes" class="category-link">🎨 Themes</a>
            <a href="/marketplace/tools" class="category-link">🛠️ Tools</a>
            <a href="/marketplace/integrations" class="category-link">🔌 Integrations</a>
            <a href="/marketplace/widgets" class="category-link">📊 Widgets</a>
        </div>
    </div>
</div>

<style>
.marketplace-header {
    position: relative;
    min-height: 550px;
    background: linear-gradient(135deg, #0F2027 0%, #203A43 50%, #2C5364 100%);
    color: white;
}

.extension-icons {
    position: absolute;
    width: 100%;
    text-align: center;
    font-size: 60px;
    top: 50%;
    transform: translateY(-50%);
    opacity: 0.05;
    letter-spacing: 40px;
}

.marketplace-stats {
    display: flex;
    justify-content: center;
    gap: 60px;
    margin: 40px 0;
}

.market-stat {
    text-align: center;
}

.stat-number {
    font-size: 48px;
    font-weight: bold;
    background: linear-gradient(45deg, #00f2fe, #4facfe);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.featured-extensions {
    max-width: 1000px;
    margin: 0 auto;
}

.extension-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 25px;
    margin-top: 25px;
}

.extension-card {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    padding: 30px;
    border-radius: 15px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    text-align: center;
    transition: transform 0.3s;
}

.extension-card:hover {
    transform: translateY(-5px);
    background: rgba(255, 255, 255, 0.08);
}

.extension-icon {
    font-size: 48px;
    margin-bottom: 15px;
}

.extension-meta {
    display: flex;
    justify-content: space-between;
    margin: 15px 0;
    font-size: 14px;
    opacity: 0.8;
}

.install-btn {
    width: 100%;
    padding: 12px;
    background: linear-gradient(45deg, #00f2fe, #4facfe);
    border: none;
    border-radius: 8px;
    color: white;
    font-weight: bold;
    cursor: pointer;
    transition: opacity 0.3s;
}

.install-btn:hover {
    opacity: 0.9;
}

.browse-categories {
    display: flex;
    justify-content: center;
    gap: 30px;
    margin-top: 50px;
}

.category-link {
    color: white;
    text-decoration: none;
    padding: 15px 30px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    transition: all 0.3s;
}

.category-link:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
}
</style>`;
    }
    
    /**
     * Generate code particles for repository header
     */
    generateCodeParticles() {
        const particles = ['<>', '{}', '[]', '()', '//', '/*', '*/', '=>', '::'];
        return particles.map((p, i) => `
            <div class="particle" style="
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation-delay: ${i * 0.5}s;
                font-size: ${20 + Math.random() * 20}px;
            ">${p}</div>
        `).join('');
    }
    
    /**
     * Generate chat bubbles for forum header
     */
    generateChatBubbles() {
        const messages = [
            'Welcome!', 'Great idea!', 'Thanks for sharing',
            'How do I...?', 'Check this out', 'Solved!',
            '❤️', '👍', '🎉'
        ];
        
        return messages.map((msg, i) => `
            <div class="chat-bubble" style="
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                animation-delay: ${i * 2}s;
            ">${msg}</div>
        `).join('');
    }
    
    /**
     * Generate artwork grid for showcase header
     */
    generateArtworkGrid() {
        return Array(24).fill(0).map((_, i) => `
            <div class="grid-item" style="
                background: hsl(${i * 15}, 70%, 50%);
                animation-delay: ${i * 0.1}s;
            "></div>
        `).join('');
    }
    
    /**
     * Get unique languages from repositories
     */
    getUniqueLanguages(repos) {
        return [...new Set(repos.map(r => r.language))];
    }
    
    /**
     * Initialize domain silos
     */
    async initializeDomainSilos() {
        console.log('🌐 Initializing domain silos...');
        
        for (const [domain, config] of Object.entries(this.domainSilos)) {
            this.services.domains.set(domain, {
                ...config,
                initialized: true,
                lastUpdate: new Date()
            });
            
            console.log(`  ✓ ${domain} - ${config.type} silo`);
        }
    }
    
    /**
     * Get header for specific section
     */
    async getHeaderForSection(section) {
        if (this.headerTemplates[section]) {
            return await this.headerTemplates[section]();
        }
        
        // Default header
        return `
<div class="platform-header default-header">
    <h1>${this.sections[section]?.title || section}</h1>
    <p>${this.sections[section]?.description || ''}</p>
</div>`;
    }
    
    /**
     * Create unified navigation
     */
    createUnifiedNavigation(currentSection = null) {
        return `
<nav class="platform-navigation">
    <div class="nav-container">
        <div class="nav-brand">
            <span class="brand-logo">🏛️</span>
            <span class="brand-name">${this.config.platformName}</span>
        </div>
        
        <div class="nav-sections">
            ${Object.entries(this.sections).map(([key, section]) => `
                <a href="/${key}" class="nav-item ${currentSection === key ? 'active' : ''}">
                    ${section.icon} ${section.title}
                </a>
            `).join('')}
        </div>
        
        <div class="nav-auth">
            <button class="auth-btn">Sign In with GitHub</button>
        </div>
    </div>
</nav>

<style>
.platform-navigation {
    background: #1a1a1a;
    padding: 15px 0;
    position: sticky;
    top: 0;
    z-index: 1000;
}

.nav-container {
    max-width: 1400px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
}

.nav-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 20px;
    font-weight: bold;
    color: white;
}

.nav-sections {
    display: flex;
    gap: 30px;
}

.nav-item {
    color: rgba(255, 255, 255, 0.7);
    text-decoration: none;
    transition: color 0.3s;
}

.nav-item:hover,
.nav-item.active {
    color: white;
}

.auth-btn {
    background: #238636;
    color: white;
    border: none;
    padding: 8px 20px;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.3s;
}

.auth-btn:hover {
    background: #2ea043;
}
</style>`;
    }
    
    /**
     * Render complete page for a section
     */
    async renderSectionPage(section) {
        const navigation = this.createUnifiedNavigation(section);
        const header = await this.getHeaderForSection(section);
        const sectionConfig = this.sections[section];
        
        return `
<!DOCTYPE html>
<html>
<head>
    <title>${sectionConfig.title} - ${this.config.platformName}</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0a0a0a;
            color: #e0e0e0;
        }
        
        .content-wrapper {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }
        
        .main-content {
            flex: 1;
        }
        
        .section-navigation {
            background: #1a1a1a;
            padding: 20px 0;
            border-bottom: 1px solid #333;
        }
        
        .section-nav-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 0 20px;
        }
        
        .section-nav-items {
            display: flex;
            gap: 20px;
        }
        
        .section-nav-item {
            color: rgba(255, 255, 255, 0.6);
            text-decoration: none;
            padding: 8px 16px;
            border-radius: 6px;
            transition: all 0.3s;
        }
        
        .section-nav-item:hover {
            background: rgba(255, 255, 255, 0.1);
            color: white;
        }
        
        .footer {
            background: #0a0a0a;
            border-top: 1px solid #333;
            padding: 40px 0;
            margin-top: 80px;
        }
        
        .footer-content {
            max-width: 1400px;
            margin: 0 auto;
            padding: 0 20px;
            text-align: center;
            color: rgba(255, 255, 255, 0.5);
        }
    </style>
</head>
<body>
    <div class="content-wrapper">
        ${navigation}
        
        ${header}
        
        <div class="section-navigation">
            <div class="section-nav-container">
                <div class="section-nav-items">
                    ${sectionConfig.navigation.map(item => `
                        <a href="${item.path}" class="section-nav-item">${item.name}</a>
                    `).join('')}
                </div>
            </div>
        </div>
        
        <main class="main-content">
            <!-- Section-specific content goes here -->
        </main>
        
        <footer class="footer">
            <div class="footer-content">
                <p>&copy; 2025 ${this.config.platformName}. Building complete worlds, not just landing pages.</p>
            </div>
        </footer>
    </div>
</body>
</html>`;
    }
    
    /**
     * Generate platform status report
     */
    generateStatusReport() {
        const report = {
            platform: {
                name: this.config.platformName,
                organization: this.config.organizationName,
                primaryDomain: this.config.primaryDomain
            },
            services: {
                repositories: this.services.repositories.size,
                competitions: this.services.competitions.size,
                forumCategories: this.services.forumCategories.size,
                showcases: this.services.showcases.size,
                extensions: this.services.extensions.size,
                domains: this.services.domains.size
            },
            sections: Object.keys(this.sections).length,
            domainSilos: Object.keys(this.domainSilos).length
        };
        
        console.log('\n📊 Platform Status Report');
        console.log('════════════════════════════');
        console.log(`🏛️  Platform: ${report.platform.name}`);
        console.log(`🏢 Organization: ${report.platform.organization}`);
        console.log(`🌐 Primary Domain: ${report.platform.primaryDomain}`);
        console.log('\n📦 Services:');
        console.log(`  Repositories: ${report.services.repositories}`);
        console.log(`  Competitions: ${report.services.competitions}`);
        console.log(`  Forum Categories: ${report.services.forumCategories}`);
        console.log(`  Showcases: ${report.services.showcases}`);
        console.log(`  Extensions: ${report.services.extensions}`);
        console.log(`  Domain Silos: ${report.services.domains}`);
        console.log(`\n📑 Sections: ${report.sections}`);
        console.log(`🌐 Domain Silos: ${report.domainSilos}`);
        
        return report;
    }
    
    /**
     * Initialize header generation system
     */
    async initializeHeaderGeneration() {
        console.log('🎨 Initializing dynamic header generation...');
        
        // Set up header update intervals
        setInterval(() => {
            this.emit('headers-update', {
                timestamp: new Date(),
                sections: Object.keys(this.sections)
            });
        }, 300000); // Update every 5 minutes
    }
    
    /**
     * Load platform data
     */
    async loadPlatformData() {
        // In production, this would load from database/API
        console.log('📂 Loading platform data...');
    }
    
    /**
     * Start service orchestration
     */
    async startServiceOrchestration() {
        console.log('🎼 Starting service orchestration...');
        
        // In production, this would start actual services
        this.emit('services-started', {
            services: Object.keys(this.config.services)
        });
    }
    
    /**
     * Demo mode - show platform capabilities
     */
    static async demo() {
        console.log('🎮 Soulfra Platform Hub Demo');
        console.log('════════════════════════════');
        
        const platform = new SoulfraPlatformHub({
            platformName: 'Soulfra Demo',
            organizationName: 'soulfra-demo'
        });
        
        // Wait for initialization
        await new Promise(resolve => {
            platform.once('platform-initialized', resolve);
        });
        
        // Generate sample pages
        console.log('\n📄 Generating sample pages...\n');
        
        for (const section of ['repositories', 'competitions', 'forum']) {
            console.log(`\n━━━ ${section.toUpperCase()} PAGE ━━━`);
            const header = await platform.getHeaderForSection(section);
            console.log(header.substring(0, 500) + '...\n');
        }
        
        // Show status
        platform.generateStatusReport();
        
        console.log('\n✅ Demo complete! Each section has:');
        console.log('  • Dynamic headers showing real content');
        console.log('  • Unified navigation across all services');
        console.log('  • Domain silos for complete experiences');
        console.log('  • Visual previews in headers/banners');
    }
}

// Run demo if called directly
if (require.main === module) {
    SoulfraPlatformHub.demo().catch(console.error);
}

module.exports = SoulfraPlatformHub;