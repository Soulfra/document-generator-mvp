#!/usr/bin/env node

/**
 * TEMPLATE BUILDER SYSTEM
 * Visual template builder for Web 2.5 hosting platform
 * Drag-and-drop interface with real-time preview
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class TemplateBuilderSystem {
    constructor() {
        this.templates = new Map();
        this.components = new Map();
        this.builds = new Map();
        
        // Pre-built template library
        this.templateLibrary = {
            blog: {
                name: 'Personal Blog',
                category: 'content',
                structure: {
                    layout: 'single-column',
                    header: { title: true, nav: true, social: true },
                    main: { posts: true, sidebar: true, search: true },
                    footer: { copyright: true, links: true }
                },
                components: ['header', 'post-list', 'sidebar', 'footer'],
                features: ['rss', 'comments', 'tags', 'archive'],
                complexity: 'simple',
                buildTime: '15-30 minutes'
            },
            portfolio: {
                name: 'Portfolio Showcase',
                category: 'content',
                structure: {
                    layout: 'grid',
                    header: { title: true, nav: true, contact: true },
                    main: { gallery: true, projects: true, about: true },
                    footer: { social: true, contact: true }
                },
                components: ['hero', 'project-grid', 'about-section', 'contact-form'],
                features: ['lightbox', 'filtering', 'responsive', 'animations'],
                complexity: 'simple',
                buildTime: '20-40 minutes'
            },
            ecommerce: {
                name: 'Online Store',
                category: 'business',
                structure: {
                    layout: 'product-grid',
                    header: { logo: true, search: true, cart: true, account: true },
                    main: { products: true, categories: true, filters: true },
                    footer: { policies: true, support: true, social: true }
                },
                components: ['product-catalog', 'shopping-cart', 'checkout', 'user-account'],
                features: ['payments', 'inventory', 'orders', 'reviews'],
                complexity: 'complex',
                buildTime: '1-2 hours'
            },
            forum: {
                name: 'Community Forum',
                category: 'community',
                structure: {
                    layout: 'threaded',
                    header: { logo: true, search: true, user: true },
                    main: { categories: true, topics: true, posts: true },
                    sidebar: { stats: true, online: true, recent: true }
                },
                components: ['category-list', 'topic-list', 'post-thread', 'user-profile'],
                features: ['moderation', 'reputation', 'notifications', 'private-messages'],
                complexity: 'complex',
                buildTime: '1-3 hours'
            },
            landing: {
                name: 'Landing Page',
                category: 'business',
                structure: {
                    layout: 'hero-sections',
                    header: { logo: true, nav: true, cta: true },
                    main: { hero: true, features: true, testimonials: true, pricing: true },
                    footer: { contact: true, legal: true }
                },
                components: ['hero-banner', 'feature-grid', 'testimonials', 'pricing-table'],
                features: ['forms', 'analytics', 'a-b-testing', 'conversion-tracking'],
                complexity: 'medium',
                buildTime: '30-60 minutes'
            },
            dashboard: {
                name: 'Analytics Dashboard',
                category: 'tools',
                structure: {
                    layout: 'widget-grid',
                    header: { title: true, user: true, notifications: true },
                    sidebar: { navigation: true, filters: true },
                    main: { widgets: true, charts: true, tables: true }
                },
                components: ['metric-cards', 'chart-widgets', 'data-tables', 'filter-panel'],
                features: ['real-time-data', 'export', 'alerts', 'customization'],
                complexity: 'complex',
                buildTime: '1-2 hours'
            },
            game: {
                name: 'Game Portal',
                category: 'gaming',
                structure: {
                    layout: 'gaming',
                    header: { logo: true, user: true, leaderboard: true },
                    main: { game-area: true, controls: true, chat: true },
                    sidebar: { stats: true, achievements: true, friends: true }
                },
                components: ['game-canvas', 'leaderboard', 'achievement-system', 'player-profiles'],
                features: ['multiplayer', 'achievements', 'tournaments', 'chat'],
                complexity: 'complex',
                buildTime: '2-4 hours'
            },
            wiki: {
                name: 'Knowledge Base',
                category: 'education',
                structure: {
                    layout: 'documentation',
                    header: { search: true, nav: true, user: true },
                    sidebar: { toc: true, categories: true, recent: true },
                    main: { content: true, edit: true, history: true }
                },
                components: ['article-editor', 'table-of-contents', 'search-engine', 'revision-history'],
                features: ['collaborative-editing', 'version-control', 'search', 'categories'],
                complexity: 'medium',
                buildTime: '45-90 minutes'
            }
        };
        
        // Component library for drag-and-drop builder
        this.componentLibrary = {
            layout: {
                header: {
                    name: 'Header',
                    description: 'Top navigation and branding',
                    html: '<header class="site-header"><nav class="navbar"></nav></header>',
                    css: '.site-header { background: #fff; padding: 1rem; border-bottom: 1px solid #eee; }',
                    js: '',
                    configurable: ['background-color', 'height', 'logo', 'navigation']
                },
                footer: {
                    name: 'Footer',
                    description: 'Bottom site information',
                    html: '<footer class="site-footer"><div class="footer-content"></div></footer>',
                    css: '.site-footer { background: #333; color: #fff; padding: 2rem; }',
                    js: '',
                    configurable: ['background-color', 'text-color', 'links', 'social-media']
                },
                sidebar: {
                    name: 'Sidebar',
                    description: 'Side navigation or widgets',
                    html: '<aside class="sidebar"><div class="sidebar-content"></div></aside>',
                    css: '.sidebar { width: 300px; background: #f5f5f5; padding: 1rem; }',
                    js: '',
                    configurable: ['width', 'position', 'background', 'widgets']
                }
            },
            content: {
                'hero-banner': {
                    name: 'Hero Banner',
                    description: 'Large promotional section',
                    html: '<section class="hero"><h1>Hero Title</h1><p>Hero description</p><button>Call to Action</button></section>',
                    css: '.hero { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; padding: 4rem 2rem; }',
                    js: '',
                    configurable: ['background', 'title', 'description', 'button-text', 'button-link']
                },
                'feature-grid': {
                    name: 'Feature Grid',
                    description: 'Grid of features or services',
                    html: '<section class="features"><div class="feature-grid"></div></section>',
                    css: '.feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; padding: 2rem; }',
                    js: '',
                    configurable: ['columns', 'gap', 'feature-items']
                },
                'post-list': {
                    name: 'Post List',
                    description: 'List of blog posts or articles',
                    html: '<section class="posts"><article class="post-preview"></article></section>',
                    css: '.posts { max-width: 800px; margin: 0 auto; } .post-preview { margin-bottom: 2rem; padding: 1rem; border: 1px solid #eee; }',
                    js: '',
                    configurable: ['layout', 'excerpt-length', 'featured-image', 'metadata']
                },
                'project-grid': {
                    name: 'Project Grid',
                    description: 'Portfolio project showcase',
                    html: '<section class="projects"><div class="project-grid"></div></section>',
                    css: '.project-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 2rem; }',
                    js: '',
                    configurable: ['columns', 'project-items', 'hover-effects', 'filtering']
                }
            },
            interactive: {
                'contact-form': {
                    name: 'Contact Form',
                    description: 'User contact form',
                    html: '<form class="contact-form"><input type="text" placeholder="Name" required><input type="email" placeholder="Email" required><textarea placeholder="Message" required></textarea><button type="submit">Send</button></form>',
                    css: '.contact-form { max-width: 600px; margin: 2rem auto; } .contact-form input, .contact-form textarea { width: 100%; margin-bottom: 1rem; padding: 0.5rem; }',
                    js: 'document.querySelector(".contact-form").addEventListener("submit", handleFormSubmit);',
                    configurable: ['fields', 'validation', 'styling', 'submit-action']
                },
                'search-bar': {
                    name: 'Search Bar',
                    description: 'Site search functionality',
                    html: '<div class="search-bar"><input type="search" placeholder="Search..."><button type="submit">Search</button></div>',
                    css: '.search-bar { display: flex; max-width: 400px; } .search-bar input { flex: 1; padding: 0.5rem; } .search-bar button { padding: 0.5rem 1rem; }',
                    js: 'document.querySelector(".search-bar").addEventListener("submit", handleSearch);',
                    configurable: ['placeholder', 'styling', 'search-scope', 'results-display']
                },
                'shopping-cart': {
                    name: 'Shopping Cart',
                    description: 'E-commerce cart widget',
                    html: '<div class="cart-widget"><span class="cart-count">0</span><button class="cart-toggle">Cart</button></div>',
                    css: '.cart-widget { position: relative; } .cart-count { background: red; color: white; border-radius: 50%; padding: 0.2rem 0.5rem; font-size: 0.8rem; }',
                    js: 'class ShoppingCart { constructor() { this.items = []; } }',
                    configurable: ['styling', 'behavior', 'checkout-flow']
                }
            },
            media: {
                'image-gallery': {
                    name: 'Image Gallery',
                    description: 'Photo gallery with lightbox',
                    html: '<div class="gallery"><div class="gallery-grid"></div></div>',
                    css: '.gallery-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; }',
                    js: 'function initGallery() { /* Gallery functionality */ }',
                    configurable: ['layout', 'lightbox', 'captions', 'filtering']
                },
                'video-player': {
                    name: 'Video Player',
                    description: 'Embedded video player',
                    html: '<div class="video-player"><video controls></video></div>',
                    css: '.video-player video { width: 100%; height: auto; }',
                    js: '',
                    configurable: ['controls', 'autoplay', 'poster', 'subtitles']
                }
            },
            data: {
                'chart-widget': {
                    name: 'Chart Widget',
                    description: 'Data visualization chart',
                    html: '<div class="chart-widget"><canvas class="chart-canvas"></canvas></div>',
                    css: '.chart-widget { padding: 1rem; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }',
                    js: 'function renderChart(data, type) { /* Chart rendering */ }',
                    configurable: ['chart-type', 'data-source', 'colors', 'animations']
                },
                'data-table': {
                    name: 'Data Table',
                    description: 'Sortable data table',
                    html: '<table class="data-table"><thead></thead><tbody></tbody></table>',
                    css: '.data-table { width: 100%; border-collapse: collapse; } .data-table th, .data-table td { padding: 0.5rem; border: 1px solid #eee; }',
                    js: 'function initDataTable() { /* Table functionality */ }',
                    configurable: ['columns', 'sorting', 'filtering', 'pagination']
                }
            }
        };
        
        console.log('🏗️ Template Builder System initialized');
        console.log(`📚 ${Object.keys(this.templateLibrary).length} templates available`);
        console.log(`🧩 ${this.getTotalComponents()} components available`);
    }
    
    getTotalComponents() {
        return Object.values(this.componentLibrary)
            .reduce((total, category) => total + Object.keys(category).length, 0);
    }
    
    /**
     * Get available templates filtered by interest
     */
    getTemplatesByInterest(interests) {
        const templates = [];
        
        interests.forEach(interest => {
            Object.entries(this.templateLibrary).forEach(([key, template]) => {
                if (template.category === interest || interests.includes(template.category)) {
                    templates.push({
                        id: key,
                        ...template,
                        score: this.calculateRelevanceScore(template, interests)
                    });
                }
            });
        });
        
        // Remove duplicates and sort by relevance
        const uniqueTemplates = templates.filter((template, index, self) => 
            index === self.findIndex(t => t.id === template.id)
        ).sort((a, b) => b.score - a.score);
        
        return uniqueTemplates;
    }
    
    calculateRelevanceScore(template, interests) {
        let score = 0;
        
        // Direct category match
        if (interests.includes(template.category)) {
            score += 10;
        }
        
        // Feature overlap
        const interestFeatures = this.getExpectedFeatures(interests);
        const templateFeatures = template.features || [];
        const overlap = templateFeatures.filter(feature => 
            interestFeatures.includes(feature)
        ).length;
        score += overlap * 2;
        
        // Complexity preference (simple templates score higher for beginners)
        if (template.complexity === 'simple') score += 3;
        if (template.complexity === 'medium') score += 2;
        if (template.complexity === 'complex') score += 1;
        
        return score;
    }
    
    getExpectedFeatures(interests) {
        const featureMap = {
            content: ['rss', 'comments', 'tags', 'archive', 'search'],
            business: ['payments', 'analytics', 'forms', 'crm'],
            community: ['user-accounts', 'messaging', 'moderation', 'notifications'],
            gaming: ['leaderboards', 'achievements', 'multiplayer', 'tournaments'],
            education: ['courses', 'progress-tracking', 'quizzes', 'certificates'],
            tools: ['api', 'automation', 'calculations', 'data-export'],
            personal: ['gallery', 'blog', 'contact', 'social-media'],
            experimental: ['ai-integration', 'blockchain', 'iot', 'advanced-features']
        };
        
        const features = new Set();
        interests.forEach(interest => {
            if (featureMap[interest]) {
                featureMap[interest].forEach(feature => features.add(feature));
            }
        });
        
        return Array.from(features);
    }
    
    /**
     * Create a new template build
     */
    async createBuild(templateId, customizations = {}) {
        const template = this.templateLibrary[templateId];
        if (!template) {
            throw new Error(`Template '${templateId}' not found`);
        }
        
        const buildId = crypto.randomBytes(16).toString('hex');
        const build = {
            id: buildId,
            templateId,
            template: { ...template },
            customizations,
            status: 'building',
            progress: 0,
            files: new Map(),
            logs: [],
            created: Date.now(),
            modified: Date.now()
        };
        
        this.builds.set(buildId, build);
        
        // Start build process
        this.processBuild(buildId);
        
        console.log(`🏗️ Created build ${buildId} for template ${templateId}`);
        
        return {
            buildId,
            status: 'building',
            estimatedTime: template.buildTime,
            template: template.name
        };
    }
    
    /**
     * Process a template build
     */
    async processBuild(buildId) {
        const build = this.builds.get(buildId);
        if (!build) return;
        
        try {
            // Generate HTML structure
            this.addLog(build, 'Generating HTML structure...');
            await this.generateHTML(build);
            build.progress = 25;
            
            // Generate CSS styles
            this.addLog(build, 'Generating CSS styles...');
            await this.generateCSS(build);
            build.progress = 50;
            
            // Generate JavaScript functionality
            this.addLog(build, 'Adding JavaScript functionality...');
            await this.generateJavaScript(build);
            build.progress = 75;
            
            // Apply customizations
            this.addLog(build, 'Applying customizations...');
            await this.applyCustomizations(build);
            build.progress = 90;
            
            // Generate configuration files
            this.addLog(build, 'Generating configuration files...');
            await this.generateConfig(build);
            build.progress = 100;
            
            build.status = 'completed';
            build.modified = Date.now();
            
            this.addLog(build, `Build completed successfully! Generated ${build.files.size} files.`);
            
            console.log(`✅ Build ${buildId} completed successfully`);
            
        } catch (error) {
            build.status = 'failed';
            build.error = error.message;
            this.addLog(build, `Build failed: ${error.message}`);
            console.error(`❌ Build ${buildId} failed:`, error);
        }
    }
    
    addLog(build, message) {
        build.logs.push({
            timestamp: Date.now(),
            message
        });
    }
    
    async generateHTML(build) {
        const { template, customizations } = build;
        const components = template.components || [];
        
        // Get component HTML
        let html = this.getBaseHTMLTemplate();
        let bodyContent = '';
        
        // Add header if specified
        if (template.structure.header) {
            const headerComponent = this.getComponent('layout', 'header');
            if (headerComponent) {
                bodyContent += headerComponent.html;
            }
        }
        
        // Add main content based on template structure
        bodyContent += '<main class="main-content">';
        
        components.forEach(componentName => {
            const component = this.findComponent(componentName);
            if (component) {
                bodyContent += component.html;
            }
        });
        
        bodyContent += '</main>';
        
        // Add footer if specified
        if (template.structure.footer) {
            const footerComponent = this.getComponent('layout', 'footer');
            if (footerComponent) {
                bodyContent += footerComponent.html;
            }
        }
        
        // Insert body content into HTML template
        html = html.replace('{{BODY_CONTENT}}', bodyContent);
        html = html.replace('{{TITLE}}', customizations.title || template.name);
        
        build.files.set('index.html', html);
        
        // Simulate build time
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    async generateCSS(build) {
        const { template, customizations } = build;
        const components = template.components || [];
        
        let css = this.getBaseCSSStyles();
        
        // Add component styles
        components.forEach(componentName => {
            const component = this.findComponent(componentName);
            if (component && component.css) {
                css += '\n\n/* ' + component.name + ' Styles */\n';
                css += component.css;
            }
        });
        
        // Add layout-specific styles
        css += this.getLayoutStyles(template.structure.layout);
        
        // Apply color customizations
        if (customizations.colors) {
            css += this.generateColorCSS(customizations.colors);
        }
        
        build.files.set('styles.css', css);
        
        // Simulate build time
        await new Promise(resolve => setTimeout(resolve, 800));
    }
    
    async generateJavaScript(build) {
        const { template, customizations } = build;
        const components = template.components || [];
        
        let js = this.getBaseJavaScript();
        
        // Add component JavaScript
        components.forEach(componentName => {
            const component = this.findComponent(componentName);
            if (component && component.js) {
                js += '\n\n// ' + component.name + ' Functionality\n';
                js += component.js;
            }
        });
        
        // Add template-specific functionality
        js += this.getTemplateJavaScript(template);
        
        build.files.set('script.js', js);
        
        // Simulate build time
        await new Promise(resolve => setTimeout(resolve, 600));
    }
    
    async applyCustomizations(build) {
        const { customizations } = build;
        
        // Apply theme customizations
        if (customizations.theme) {
            await this.applyTheme(build, customizations.theme);
        }
        
        // Apply content customizations
        if (customizations.content) {
            await this.applyContent(build, customizations.content);
        }
        
        // Apply layout customizations
        if (customizations.layout) {
            await this.applyLayout(build, customizations.layout);
        }
        
        // Simulate customization time
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    async generateConfig(build) {
        const { template, customizations } = build;
        
        // Generate package.json if needed
        if (template.features.includes('nodejs')) {
            const packageJson = this.generatePackageJson(build);
            build.files.set('package.json', JSON.stringify(packageJson, null, 2));
        }
        
        // Generate docker config if requested
        if (customizations.deployment === 'docker') {
            const dockerfile = this.generateDockerfile(build);
            build.files.set('Dockerfile', dockerfile);
        }
        
        // Generate README
        const readme = this.generateReadme(build);
        build.files.set('README.md', readme);
        
        // Generate deployment config
        const deployConfig = this.generateDeploymentConfig(build);
        build.files.set('deploy.json', JSON.stringify(deployConfig, null, 2));
        
        // Simulate config generation time
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    getBaseHTMLTemplate() {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{TITLE}}</title>
    <link rel="stylesheet" href="styles.css">
    <meta name="description" content="Built with Web 2.5 Hosting Platform">
</head>
<body>
    {{BODY_CONTENT}}
    <script src="script.js"></script>
</body>
</html>`;
    }
    
    getBaseCSSStyles() {
        return `/* Base Styles - Web 2.5 Hosting Platform */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    line-height: 1.6;
    color: #333;
    background: #fff;
}

.main-content {
    min-height: calc(100vh - 200px);
    padding: 2rem;
}

/* Responsive Design */
@media (max-width: 768px) {
    .main-content {
        padding: 1rem;
    }
}`;
    }
    
    getBaseJavaScript() {
        return `// Base JavaScript - Web 2.5 Hosting Platform
console.log('🌐 Web 2.5 site loaded successfully');

// Initialize site functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeSite();
});

function initializeSite() {
    console.log('⚡ Site initialization complete');
    
    // Add privacy-first analytics (no tracking)
    trackPageView();
}

function trackPageView() {
    // Privacy-first page view tracking
    console.log('📊 Page view tracked (no personal data collected)');
}`;
    }
    
    getLayoutStyles(layout) {
        const layouts = {
            'single-column': `
/* Single Column Layout */
.main-content {
    max-width: 800px;
    margin: 0 auto;
}`,
            'grid': `
/* Grid Layout */
.main-content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    max-width: 1200px;
    margin: 0 auto;
}`,
            'hero-sections': `
/* Hero Sections Layout */
.main-content > section {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
}`,
            'threaded': `
/* Threaded Layout (Forums) */
.main-content {
    display: grid;
    grid-template-columns: 250px 1fr;
    gap: 2rem;
    max-width: 1400px;
    margin: 0 auto;
}`
        };
        
        return layouts[layout] || layouts['single-column'];
    }
    
    generateColorCSS(colors) {
        return `
/* Custom Color Scheme */
:root {
    --primary-color: ${colors.primary || '#3b82f6'};
    --secondary-color: ${colors.secondary || '#64748b'};
    --accent-color: ${colors.accent || '#10b981'};
    --background-color: ${colors.background || '#ffffff'};
    --text-color: ${colors.text || '#1f2937'};
}

/* Apply custom colors */
body {
    background-color: var(--background-color);
    color: var(--text-color);
}

a {
    color: var(--primary-color);
}

button, .btn {
    background-color: var(--accent-color);
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
}`;
    }
    
    getTemplateJavaScript(template) {
        const templateJS = {
            blog: `
// Blog functionality
function loadMorePosts() {
    console.log('Loading more posts...');
}

function sharePost(postId) {
    console.log('Sharing post:', postId);
}`,
            ecommerce: `
// E-commerce functionality
class ShoppingCart {
    constructor() {
        this.items = [];
        this.total = 0;
    }
    
    addItem(product) {
        this.items.push(product);
        this.updateTotal();
        console.log('Added to cart:', product);
    }
    
    updateTotal() {
        this.total = this.items.reduce((sum, item) => sum + item.price, 0);
    }
}

const cart = new ShoppingCart();`,
            forum: `
// Forum functionality
function submitPost(content) {
    console.log('Submitting post:', content);
}

function moderateContent(postId, action) {
    console.log('Moderating post:', postId, action);
}`
        };
        
        return templateJS[template.category] || '';
    }
    
    getComponent(category, name) {
        return this.componentLibrary[category]?.[name];
    }
    
    findComponent(name) {
        for (const category of Object.values(this.componentLibrary)) {
            if (category[name]) {
                return category[name];
            }
        }
        return null;
    }
    
    async applyTheme(build, theme) {
        // Apply theme-specific styles
        let themeCSS = '';
        
        switch (theme) {
            case 'dark':
                themeCSS = `
/* Dark Theme */
body {
    background-color: #1a1a1a;
    color: #e5e5e5;
}

.site-header {
    background-color: #2d2d2d;
    border-bottom-color: #444;
}`;
                break;
            case 'minimal':
                themeCSS = `
/* Minimal Theme */
body {
    font-family: 'Georgia', serif;
}

.main-content {
    max-width: 600px;
    line-height: 1.8;
}`;
                break;
        }
        
        if (themeCSS) {
            const existingCSS = build.files.get('styles.css') || '';
            build.files.set('styles.css', existingCSS + themeCSS);
        }
    }
    
    async applyContent(build, content) {
        // Replace placeholder content with user content
        let html = build.files.get('index.html') || '';
        
        if (content.title) {
            html = html.replace(/{{TITLE}}/g, content.title);
            html = html.replace(/Hero Title/g, content.title);
        }
        
        if (content.description) {
            html = html.replace(/Hero description/g, content.description);
        }
        
        build.files.set('index.html', html);
    }
    
    async applyLayout(build, layout) {
        // Apply layout-specific modifications
        console.log('Applying layout customizations:', layout);
    }
    
    generatePackageJson(build) {
        return {
            name: build.template.name.toLowerCase().replace(/\s+/g, '-'),
            version: '1.0.0',
            description: `Built with Web 2.5 Hosting Platform - ${build.template.description}`,
            main: 'index.html',
            scripts: {
                start: 'http-server -p 3000',
                build: 'echo "Static site - no build needed"',
                deploy: 'echo "Deploy to your Web 2.5 subdomain"'
            },
            dependencies: {},
            devDependencies: {
                'http-server': '^14.1.1'
            },
            keywords: ['web25', 'hosting', 'static-site'],
            author: 'Web 2.5 User',
            license: 'MIT'
        };
    }
    
    generateDockerfile(build) {
        return `# Web 2.5 Hosting Platform - Dockerfile
FROM nginx:alpine

# Copy static files
COPY . /usr/share/nginx/html

# Copy custom nginx config if needed
# COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

# Built with Web 2.5 Hosting Platform
# Privacy-first hosting solution`;
    }
    
    generateReadme(build) {
        const { template, customizations } = build;
        
        return `# ${customizations.title || template.name}

Built with **Web 2.5 Hosting Platform** - The sweet spot between web1 infrastructure, web2 UX, and web3 economics.

## Features

${template.features.map(feature => `- ${feature}`).join('\n')}

## Template: ${template.name}

${template.description || 'Custom website built for your specific interests.'}

### Complexity: ${template.complexity}
### Build Time: ${template.buildTime}

## Files Generated

- \`index.html\` - Main website file
- \`styles.css\` - Styling and layout
- \`script.js\` - Interactive functionality
- \`README.md\` - This documentation

## Deployment

This site is ready to deploy to your Web 2.5 subdomain. The platform provides:

- 🛡️ Privacy-first hosting (no tracking)
- 🚀 Fast CDN delivery
- 📱 Mobile-optimized
- 🔒 Secure by default
- 💰 Anonymous economy integration

## Customization

You can customize this site by:

1. Editing the HTML content in \`index.html\`
2. Modifying styles in \`styles.css\`
3. Adding functionality in \`script.js\`
4. Using the Web 2.5 visual editor

---

*Generated on ${new Date().toISOString().split('T')[0]} by Web 2.5 Hosting Platform*

**Web 2.5**: Privacy-first • Interest-driven • Community-owned`;
    }
    
    generateDeploymentConfig(build) {
        const { template, customizations } = build;
        
        return {
            platform: 'web25-hosting',
            template: template.name,
            buildId: build.id,
            deployment: {
                type: 'static',
                subdomain: customizations.subdomain || 'my-site',
                customDomain: customizations.customDomain || null,
                https: true,
                cdn: true,
                compression: true
            },
            features: template.features,
            privacy: {
                tracking: false,
                analytics: 'privacy-first-only',
                cookies: 'none',
                dataCollection: 'none'
            },
            performance: {
                caching: true,
                minification: true,
                optimization: true
            },
            security: {
                headers: true,
                ssl: true,
                cors: customizations.cors || 'same-origin'
            }
        };
    }
    
    /**
     * Get build status
     */
    getBuildStatus(buildId) {
        const build = this.builds.get(buildId);
        if (!build) {
            return { status: 'not_found' };
        }
        
        return {
            id: buildId,
            status: build.status,
            progress: build.progress,
            template: build.template.name,
            filesGenerated: build.files.size,
            logs: build.logs.slice(-5), // Last 5 log entries
            created: build.created,
            modified: build.modified,
            error: build.error
        };
    }
    
    /**
     * Get generated files for a build
     */
    getBuildFiles(buildId) {
        const build = this.builds.get(buildId);
        if (!build || build.status !== 'completed') {
            return null;
        }
        
        const files = {};
        build.files.forEach((content, filename) => {
            files[filename] = content;
        });
        
        return files;
    }
    
    /**
     * Get component library for drag-and-drop builder
     */
    getComponentLibrary() {
        return this.componentLibrary;
    }
    
    /**
     * Preview a template with sample data
     */
    async previewTemplate(templateId, customizations = {}) {
        const template = this.templateLibrary[templateId];
        if (!template) {
            throw new Error(`Template '${templateId}' not found`);
        }
        
        // Generate preview HTML without full build process
        const preview = {
            template: template.name,
            html: this.generatePreviewHTML(template, customizations),
            css: this.generatePreviewCSS(template, customizations),
            features: template.features,
            complexity: template.complexity,
            buildTime: template.buildTime
        };
        
        return preview;
    }
    
    generatePreviewHTML(template, customizations) {
        // Simplified HTML generation for preview
        let html = '<div class="template-preview">';
        
        if (template.structure.header) {
            html += '<header class="preview-header">Header Area</header>';
        }
        
        html += '<main class="preview-main">';
        html += `<h1>${customizations.title || 'Your Site Title'}</h1>`;
        html += `<p>${customizations.description || 'Your site description goes here.'}</p>`;
        
        template.components.forEach(component => {
            html += `<section class="preview-${component}">${component} Component</section>`;
        });
        
        html += '</main>';
        
        if (template.structure.footer) {
            html += '<footer class="preview-footer">Footer Area</footer>';
        }
        
        html += '</div>';
        
        return html;
    }
    
    generatePreviewCSS(template, customizations) {
        const colors = customizations.colors || {
            primary: '#3b82f6',
            secondary: '#64748b',
            accent: '#10b981'
        };
        
        return `
.template-preview {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    max-width: 800px;
    margin: 0 auto;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
}

.preview-header {
    background: ${colors.primary};
    color: white;
    padding: 1rem;
    text-align: center;
}

.preview-main {
    padding: 2rem;
}

.preview-main h1 {
    color: ${colors.primary};
    margin-bottom: 1rem;
}

.preview-main section {
    margin: 1rem 0;
    padding: 1rem;
    background: #f9fafb;
    border-radius: 4px;
    border-left: 4px solid ${colors.accent};
}

.preview-footer {
    background: ${colors.secondary};
    color: white;
    padding: 1rem;
    text-align: center;
}
        `;
    }
}

// Export for use
module.exports = TemplateBuilderSystem;

// Demo if run directly
if (require.main === module) {
    (async () => {
        console.log('\n=== Template Builder System Demo ===\n');
        
        const builder = new TemplateBuilderSystem();
        
        // Test template filtering
        console.log('🎯 Templates for "content" and "business" interests:');
        const templates = builder.getTemplatesByInterest(['content', 'business']);
        templates.forEach(template => {
            console.log(`  - ${template.name} (${template.complexity}, score: ${template.score})`);
        });
        
        // Test template build
        console.log('\n🏗️ Building blog template...');
        const build = await builder.createBuild('blog', {
            title: 'My Awesome Blog',
            colors: {
                primary: '#2563eb',
                accent: '#10b981'
            },
            theme: 'minimal'
        });
        
        console.log(`Build ID: ${build.buildId}`);
        
        // Monitor build progress
        const monitorBuild = setInterval(() => {
            const status = builder.getBuildStatus(build.buildId);
            console.log(`Progress: ${status.progress}% - ${status.status}`);
            
            if (status.status === 'completed' || status.status === 'failed') {
                clearInterval(monitorBuild);
                
                if (status.status === 'completed') {
                    console.log(`\n✅ Build completed! Generated ${status.filesGenerated} files.`);
                    
                    const files = builder.getBuildFiles(build.buildId);
                    if (files) {
                        console.log('\n📁 Generated files:');
                        Object.keys(files).forEach(filename => {
                            console.log(`  - ${filename} (${files[filename].length} chars)`);
                        });
                    }
                } else {
                    console.log(`\n❌ Build failed: ${status.error}`);
                }
            }
        }, 1000);
        
        // Test preview generation
        setTimeout(async () => {
            console.log('\n👀 Generating template preview...');
            const preview = await builder.previewTemplate('ecommerce', {
                title: 'My Online Store',
                description: 'Quality products at great prices'
            });
            
            console.log(`Preview generated for: ${preview.template}`);
            console.log(`Features: ${preview.features.join(', ')}`);
            console.log(`Complexity: ${preview.complexity}`);
            console.log(`Build time: ${preview.buildTime}`);
            
        }, 2000);
        
    })().catch(console.error);
}

console.log('🏗️ Template Builder System loaded');
console.log('🎨 Visual template builder with drag-and-drop interface');
console.log('⚡ Real-time preview and customization');