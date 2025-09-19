#!/usr/bin/env node

/**
 * 🧭 INTERACTIVE COMPONENT NAVIGATOR
 * 
 * Provides visual navigation through the character-driven ecosystem:
 * - Clickable component map with character ownership
 * - "Death to Data" style brand links
 * - Cross-references between components and documentation
 * - Real-time component discovery and chat integration
 */

const express = require('express');
const fs = require('fs').promises;
const path = require('path');

class ComponentNavigator {
    constructor(port = 3007) {
        this.port = port;
        this.app = express();
        this.app.use(express.json());
        
        // Component discovery data
        this.componentIndex = new Map();
        this.characterComponents = new Map();
        this.crossReferences = new Map();
        
        // Brand links (like "Death to Data")
        this.brandLinks = new Map();
        
        this.initializeBrandLinks();
        this.setupRoutes();
    }
    
    initializeBrandLinks() {
        // Define the brand platforms with their components and navigation
        this.brandLinks.set('Death to Data', {
            color: '#FF4444',
            description: 'Privacy-first data destruction and encryption platform',
            components: [
                'vault-systems', 'encryption-tools', 'data-destruction',
                'privacy-calculators', 'secure-storage', 'audit-trails'
            ],
            chatPersonality: 'DeathToData',
            chatUrl: '/chat/deathtoda',
            documentation: [
                'privacy-architecture.md',
                'encryption-standards.md',
                'data-handling-policies.md'
            ],
            relatedSystems: ['Vault Integration', 'Blockchain Audit', 'SecureOS']
        });
        
        this.brandLinks.set('Frontend Warrior', {
            color: '#27ae60',
            description: 'Battle-tested UI/UX design system and component library',
            components: [
                'react-components', 'design-system', 'responsive-layouts',
                'accessibility-tools', 'animation-library', 'theme-engine'
            ],
            chatPersonality: 'FrontendWarrior',
            chatUrl: '/chat/frontendwarrior',
            documentation: [
                'component-library.md',
                'design-guidelines.md',
                'accessibility-standards.md'
            ],
            relatedSystems: ['React Platform', 'Design System', 'Mobile UX']
        });
        
        this.brandLinks.set('Backend Beast', {
            color: '#3498db',
            description: 'Scalable server architecture and database optimization platform',
            components: [
                'api-framework', 'database-optimization', 'microservices',
                'load-balancing', 'caching-layer', 'monitoring-system'
            ],
            chatPersonality: 'BackendBeast',
            chatUrl: '/chat/backendbeast',
            documentation: [
                'api-architecture.md',
                'database-design.md',
                'scaling-strategies.md'
            ],
            relatedSystems: ['Docker Platform', 'Database Systems', 'API Gateway']
        });
        
        this.brandLinks.set('Integration Ninja', {
            color: '#f39c12',
            description: 'Seamless API integration and service mesh platform',
            components: [
                'webhook-handlers', 'api-connectors', 'service-mesh',
                'integration-testing', 'rate-limiting', 'error-recovery'
            ],
            chatPersonality: 'IntegrationNinja',
            chatUrl: '/chat/integrationninja',
            documentation: [
                'integration-patterns.md',
                'api-documentation.md',
                'webhook-security.md'
            ],
            relatedSystems: ['API Gateway', 'Service Mesh', 'Third-party APIs']
        });
        
        this.brandLinks.set('Debug Detective', {
            color: '#9b59b6',
            description: 'Advanced debugging and testing investigation platform',
            components: [
                'test-automation', 'debugging-tools', 'error-tracking',
                'performance-monitoring', 'log-analysis', 'issue-resolution'
            ],
            chatPersonality: 'DebugDetective',
            chatUrl: '/chat/debugdetective',
            documentation: [
                'testing-strategies.md',
                'debugging-guides.md',
                'monitoring-setup.md'
            ],
            relatedSystems: ['Testing Framework', 'Monitoring Stack', 'Error Tracking']
        });
        
        this.brandLinks.set('BlameChain', {
            color: '#e91e63',
            description: 'Accountability and audit trail enforcement platform',
            components: [
                'audit-system', 'component-registry', 'karma-tracking',
                'consensus-mechanisms', 'transparency-tools', 'attribution-system'
            ],
            chatPersonality: 'BlameChain',
            chatUrl: '/chat/blamechain',
            documentation: [
                'accountability-framework.md',
                'audit-procedures.md',
                'consensus-protocols.md'
            ],
            relatedSystems: ['Blockchain Systems', 'Audit Tools', 'Governance']
        });
    }
    
    setupRoutes() {
        // Main navigator interface
        this.app.get('/', (req, res) => {
            res.send(this.generateNavigatorInterface());
        });
        
        // Brand platform pages (like clicking "Death to Data")
        this.app.get('/brand/:brandName', (req, res) => {
            const brandName = decodeURIComponent(req.params.brandName);
            res.send(this.generateBrandPlatformInterface(brandName));
        });
        
        // Component details
        this.app.get('/component/:componentName', (req, res) => {
            const componentName = req.params.componentName;
            res.json(this.getComponentDetails(componentName));
        });
        
        // Search components
        this.app.get('/api/search', (req, res) => {
            const query = req.query.q;
            const results = this.searchComponents(query);
            res.json({ query, results });
        });
        
        // Get all brand links
        this.app.get('/api/brands', (req, res) => {
            const brands = Array.from(this.brandLinks.entries()).map(([name, data]) => ({
                name,
                ...data,
                url: `/brand/${encodeURIComponent(name)}`
            }));
            res.json({ brands });
        });
        
        // Component ownership map
        this.app.get('/api/ownership', (req, res) => {
            const ownership = Array.from(this.characterComponents.entries())
                .map(([character, components]) => ({
                    character,
                    components: components.length,
                    list: components.slice(0, 10) // Limit for performance
                }));
            res.json({ ownership });
        });
        
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                service: 'component-navigator',
                brands: this.brandLinks.size,
                components: this.componentIndex.size
            });
        });
    }
    
    generateNavigatorInterface() {
        const brands = Array.from(this.brandLinks.entries());
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🧭 Component Navigator - Brand Platform Hub</title>
    <style>
        body {
            font-family: 'SF Mono', Monaco, monospace;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            margin: 0;
            padding: 20px;
            min-height: 100vh;
            color: white;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        
        .header h1 {
            font-size: 3rem;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .header p {
            font-size: 1.2rem;
            opacity: 0.9;
        }
        
        .search-bar {
            text-align: center;
            margin: 30px 0;
        }
        
        .search-input {
            padding: 12px 20px;
            font-size: 1.1rem;
            border: none;
            border-radius: 25px;
            width: 300px;
            max-width: 80%;
            background: rgba(255, 255, 255, 0.9);
            color: #2c3e50;
        }
        
        .search-input:focus {
            outline: none;
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
        }
        
        .brands-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
            gap: 25px;
            margin: 40px 0;
        }
        
        .brand-card {
            background: rgba(255, 255, 255, 0.95);
            color: #2c3e50;
            border-radius: 16px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            transition: all 0.3s ease;
            cursor: pointer;
            position: relative;
            overflow: hidden;
        }
        
        .brand-card:hover {
            transform: translateY(-8px) scale(1.02);
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
        }
        
        .brand-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 6px;
            background: var(--brand-color);
        }
        
        .brand-name {
            font-size: 1.6rem;
            font-weight: bold;
            margin-bottom: 8px;
            color: var(--brand-color);
        }
        
        .brand-description {
            margin-bottom: 20px;
            line-height: 1.5;
            color: #5a6c7d;
        }
        
        .component-count {
            background: var(--brand-color);
            color: white;
            padding: 6px 12px;
            border-radius: 15px;
            font-size: 0.9rem;
            font-weight: bold;
            display: inline-block;
            margin-bottom: 15px;
        }
        
        .quick-actions {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        
        .action-button {
            background: #f8f9fa;
            border: 2px solid var(--brand-color);
            color: var(--brand-color);
            padding: 8px 16px;
            border-radius: 20px;
            text-decoration: none;
            font-size: 0.85rem;
            font-weight: bold;
            transition: all 0.3s ease;
        }
        
        .action-button:hover {
            background: var(--brand-color);
            color: white;
        }
        
        .stats-bar {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 20px;
            margin: 30px 0;
            text-align: center;
            backdrop-filter: blur(10px);
        }
        
        .stat {
            display: inline-block;
            margin: 0 30px;
            text-align: center;
        }
        
        .stat-number {
            font-size: 2.5rem;
            font-weight: bold;
            color: #ffd700;
        }
        
        .stat-label {
            font-size: 0.9rem;
            opacity: 0.9;
            margin-top: 5px;
        }
        
        .integration-links {
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 12px;
        }
        
        .integration-link {
            color: #ffd700;
            text-decoration: none;
            margin: 0 15px;
            font-weight: bold;
            padding: 8px 16px;
            border: 1px solid #ffd700;
            border-radius: 20px;
            display: inline-block;
            transition: all 0.3s ease;
        }
        
        .integration-link:hover {
            background: #ffd700;
            color: #1e3c72;
        }
        
        @media (max-width: 768px) {
            .brands-grid {
                grid-template-columns: 1fr;
            }
            
            .header h1 {
                font-size: 2rem;
            }
            
            .stat {
                margin: 10px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧭 Component Navigator</h1>
            <p>Explore the character-driven ecosystem • Click brands to chat with specialists</p>
        </div>
        
        <div class="search-bar">
            <input type="text" class="search-input" placeholder="Search components, documentation, or features..." id="searchInput">
        </div>
        
        <div class="stats-bar">
            <div class="stat">
                <div class="stat-number">${brands.length}</div>
                <div class="stat-label">Brand Platforms</div>
            </div>
            <div class="stat">
                <div class="stat-number" id="totalComponents">0</div>
                <div class="stat-label">Components</div>
            </div>
            <div class="stat">
                <div class="stat-number">100%</div>
                <div class="stat-label">Character Driven</div>
            </div>
        </div>
        
        <div class="brands-grid">
            ${brands.map(([name, data]) => `
                <div class="brand-card" style="--brand-color: ${data.color}" onclick="openBrand('${name}')">
                    <div class="brand-name">${name}</div>
                    <div class="brand-description">${data.description}</div>
                    <div class="component-count">${data.components.length} Components</div>
                    <div class="quick-actions">
                        <a href="${data.chatUrl}" class="action-button" onclick="event.stopPropagation()">💬 Chat</a>
                        <a href="/brand/${encodeURIComponent(name)}" class="action-button" onclick="event.stopPropagation()">🔍 Explore</a>
                        <span class="action-button" onclick="event.stopPropagation(); showComponents('${name}')">${data.components.length} Components</span>
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div class="integration-links">
            <h3 style="margin-bottom: 20px;">🔗 System Integration</h3>
            <a href="http://localhost:3000" class="integration-link" target="_blank">📄 Document-to-MVP</a>
            <a href="http://localhost:3005/health" class="integration-link" target="_blank">🐳 Real Deployment</a>
            <a href="http://localhost:3006" class="integration-link" target="_blank">🎭 Character Chat Hub</a>
            <a href="http://localhost:3007" class="integration-link">🧭 Component Navigator</a>
        </div>
    </div>
    
    <script>
        function openBrand(brandName) {
            window.open('/brand/' + encodeURIComponent(brandName), '_blank');
        }
        
        function showComponents(brandName) {
            alert('Components for ' + brandName + ' - Feature coming soon!');
        }
        
        // Search functionality
        document.getElementById('searchInput').addEventListener('input', async function(e) {
            const query = e.target.value.trim();
            if (query.length > 2) {
                try {
                    const response = await fetch('/api/search?q=' + encodeURIComponent(query));
                    const data = await response.json();
                    console.log('Search results:', data.results);
                    // TODO: Show search results
                } catch (error) {
                    console.error('Search failed:', error);
                }
            }
        });
        
        // Load component count
        async function loadStats() {
            try {
                const response = await fetch('/api/brands');
                const data = await response.json();
                
                const totalComponents = data.brands.reduce((sum, brand) => sum + brand.components.length, 0);
                document.getElementById('totalComponents').textContent = totalComponents;
                
            } catch (error) {
                console.error('Failed to load stats:', error);
            }
        }
        
        loadStats();
    </script>
</body>
</html>`;
    }
    
    generateBrandPlatformInterface(brandName) {
        const brand = this.brandLinks.get(brandName);
        
        if (!brand) {
            return `<h1>Brand "${brandName}" not found</h1><a href="/">← Back to Navigator</a>`;
        }
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${brandName} - Platform Overview</title>
    <style>
        body {
            font-family: 'SF Mono', Monaco, monospace;
            background: linear-gradient(135deg, ${brand.color}20 0%, ${brand.color}40 100%);
            margin: 0;
            padding: 0;
            min-height: 100vh;
        }
        
        .header {
            background: ${brand.color};
            color: white;
            padding: 40px 20px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%);
            animation: shimmer 3s infinite;
        }
        
        @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
        }
        
        .brand-title {
            font-size: 3rem;
            margin: 0;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
            position: relative;
            z-index: 2;
        }
        
        .brand-subtitle {
            font-size: 1.2rem;
            margin: 10px 0 0 0;
            opacity: 0.9;
            position: relative;
            z-index: 2;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        
        .back-button {
            position: fixed;
            top: 20px;
            left: 20px;
            background: rgba(255, 255, 255, 0.9);
            color: ${brand.color};
            border: none;
            padding: 12px 20px;
            border-radius: 25px;
            text-decoration: none;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
            transition: all 0.3s ease;
            z-index: 10;
        }
        
        .back-button:hover {
            background: white;
            transform: translateY(-2px);
        }
        
        .action-bar {
            background: white;
            border-radius: 12px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
            text-align: center;
        }
        
        .primary-action {
            background: ${brand.color};
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-size: 1.1rem;
            font-weight: bold;
            margin: 10px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            transition: all 0.3s ease;
        }
        
        .primary-action:hover {
            transform: translateY(-3px);
            box-shadow: 0 6px 20px ${brand.color}40;
        }
        
        .content-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 40px;
        }
        
        .content-section {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
        }
        
        .section-title {
            color: ${brand.color};
            margin-top: 0;
            font-size: 1.4rem;
            border-bottom: 2px solid ${brand.color}30;
            padding-bottom: 10px;
        }
        
        .component-list {
            list-style: none;
            padding: 0;
        }
        
        .component-item {
            background: ${brand.color}10;
            margin: 8px 0;
            padding: 12px 16px;
            border-radius: 8px;
            border-left: 4px solid ${brand.color};
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .component-item:hover {
            background: ${brand.color}20;
            transform: translateX(5px);
        }
        
        .doc-list {
            list-style: none;
            padding: 0;
        }
        
        .doc-item {
            margin: 10px 0;
            padding: 12px 16px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid ${brand.color};
        }
        
        .doc-item a {
            color: ${brand.color};
            text-decoration: none;
            font-weight: bold;
        }
        
        .related-systems {
            background: ${brand.color}10;
            border-radius: 12px;
            padding: 25px;
            margin-top: 30px;
        }
        
        .system-tag {
            background: ${brand.color};
            color: white;
            padding: 6px 12px;
            border-radius: 15px;
            margin: 5px;
            display: inline-block;
            font-size: 0.9rem;
        }
        
        @media (max-width: 768px) {
            .content-grid {
                grid-template-columns: 1fr;
            }
            
            .brand-title {
                font-size: 2rem;
            }
        }
    </style>
</head>
<body>
    <a href="/" class="back-button">← Navigator</a>
    
    <div class="header">
        <h1 class="brand-title">${brandName}</h1>
        <p class="brand-subtitle">${brand.description}</p>
    </div>
    
    <div class="container">
        <div class="action-bar">
            <h2 style="margin-top: 0; color: #2c3e50;">Platform Actions</h2>
            <a href="${brand.chatUrl}" class="primary-action">💬 Chat with ${brand.chatPersonality}</a>
            <a href="http://localhost:3000" class="primary-action" target="_blank">📄 Generate MVP</a>
            <button class="primary-action" onclick="exploreComponents()">🔍 Explore Components</button>
        </div>
        
        <div class="content-grid">
            <div class="content-section">
                <h3 class="section-title">🔧 Components (${brand.components.length})</h3>
                <ul class="component-list">
                    ${brand.components.map(comp => `
                        <li class="component-item" onclick="showComponentDetails('${comp}')">${comp}</li>
                    `).join('')}
                </ul>
            </div>
            
            <div class="content-section">
                <h3 class="section-title">📚 Documentation</h3>
                <ul class="doc-list">
                    ${brand.documentation.map(doc => `
                        <li class="doc-item">
                            <a href="/docs/${brand.chatPersonality.toLowerCase()}/${doc}" target="_blank">${doc}</a>
                        </li>
                    `).join('')}
                </ul>
            </div>
        </div>
        
        <div class="related-systems">
            <h3 style="color: ${brand.color}; margin-top: 0;">🔗 Related Systems</h3>
            ${brand.relatedSystems.map(system => `<span class="system-tag">${system}</span>`).join('')}
        </div>
    </div>
    
    <script>
        function showComponentDetails(componentName) {
            alert('Component Details: ' + componentName + '\\n\\nThis would show:\\n• Implementation details\\n• Related documentation\\n• Character ownership\\n• Integration points');
        }
        
        function exploreComponents() {
            alert('Component Explorer launching...\\n\\nThis would show:\\n• Interactive component map\\n• Dependency visualization\\n• Character relationships\\n• Code generation options');
        }
    </script>
</body>
</html>`;
    }
    
    getComponentDetails(componentName) {
        return {
            component: componentName,
            owner: 'Character TBD',
            description: `Details for ${componentName}`,
            files: [],
            documentation: [],
            relatedComponents: []
        };
    }
    
    searchComponents(query) {
        const results = [];
        
        // Search brand names and descriptions
        for (const [name, brand] of this.brandLinks) {
            if (name.toLowerCase().includes(query.toLowerCase()) || 
                brand.description.toLowerCase().includes(query.toLowerCase())) {
                results.push({
                    type: 'brand',
                    name: name,
                    description: brand.description,
                    url: `/brand/${encodeURIComponent(name)}`
                });
            }
            
            // Search components
            brand.components.forEach(comp => {
                if (comp.toLowerCase().includes(query.toLowerCase())) {
                    results.push({
                        type: 'component',
                        name: comp,
                        brand: name,
                        brandColor: brand.color,
                        url: `/component/${comp}`
                    });
                }
            });
        }
        
        return results.slice(0, 20); // Limit results
    }
    
    async start() {
        return new Promise((resolve, reject) => {
            this.server = this.app.listen(this.port, '0.0.0.0', () => {
                console.log('🧭 COMPONENT NAVIGATOR');
                console.log('=====================');
                console.log('');
                console.log(`🌐 Local: http://localhost:${this.port}`);
                console.log(`📱 Network: http://192.168.1.87:${this.port}`);
                console.log('');
                console.log('🎯 Brand Platforms:');
                
                Array.from(this.brandLinks.entries()).forEach(([name, brand]) => {
                    console.log(`   • ${name} (${brand.components.length} components)`);
                });
                
                console.log('');
                console.log('🔗 Integration Points:');
                console.log('   • Document Processor: http://localhost:3000');
                console.log('   • Real Deployment: http://localhost:3005');
                console.log('   • Character Chat: http://localhost:3006');
                console.log('   • Component Navigator: http://localhost:3007');
                console.log('');
                
                resolve();
            });
            
            this.server.on('error', reject);
        });
    }
    
    async stop() {
        if (this.server) {
            this.server.close();
        }
    }
}

module.exports = ComponentNavigator;

// CLI interface
if (require.main === module) {
    const navigator = new ComponentNavigator(3007);
    
    navigator.start().then(() => {
        console.log('✅ Component Navigator is ready!');
        console.log('');
        console.log('🎯 Features:');
        console.log('1. Click brand names like "Death to Data" to explore platforms');
        console.log('2. Chat with character specialists for each domain');
        console.log('3. Navigate between components and documentation');
        console.log('4. Search across all components and brands');
        console.log('');
        
    }).catch(error => {
        console.error('❌ Failed to start navigator:', error);
        process.exit(1);
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\\n🛑 Shutting down navigator...');
        await navigator.stop();
        process.exit(0);
    });
}