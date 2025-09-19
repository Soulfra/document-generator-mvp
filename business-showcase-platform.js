#!/usr/bin/env node

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const WebSocket = require('ws');

/**
 * BUSINESS SHOWCASE PLATFORM
 * "A personal homepage that displays all of my talents"
 * Organizes 300+ systems into business tiers for others to understand and use
 */

class BusinessShowcasePlatform {
    constructor() {
        this.app = express();
        this.port = 18000;
        this.wsPort = 18001;
        
        // System discovery results
        this.discoveredSystems = {
            total: 0,
            byTier: {
                mvp: [],
                production: [],
                enterprise: [],
                platform: []
            },
            byCategory: {
                ai: [],
                gaming: [],
                education: [],
                business: [],
                security: [],
                infrastructure: []
            }
        };
        
        // Business tier definitions
        this.tierDefinitions = {
            mvp: {
                name: 'MVP / Proof of Concept',
                description: 'Quick demos and experimental features',
                price: 'Free to try',
                icon: '🚀'
            },
            production: {
                name: 'Production Ready',
                description: 'Battle-tested systems ready for deployment',
                price: '$99-499/month',
                icon: '⚡'
            },
            enterprise: {
                name: 'Enterprise Solutions',
                description: 'Full-scale business systems with support',
                price: '$999-4999/month',
                icon: '🏢'
            },
            platform: {
                name: 'Platform as a Service',
                description: 'White-label platforms you can resell',
                price: 'Revenue share',
                icon: '🌐'
            }
        };
        
        this.setupServer();
    }
    
    async setupServer() {
        this.app.use(cors());
        this.app.use(express.json());
        // Note: Removed express.static(__dirname) to prevent serving shared index.html
        
        // API Routes
        this.app.get('/api/showcase/discover', (req, res) => this.discoverSystems(req, res));
        this.app.get('/api/showcase/systems', (req, res) => res.json(this.discoveredSystems));
        this.app.get('/api/showcase/tiers', (req, res) => res.json(this.tierDefinitions));
        this.app.get('/api/showcase/demo/:system', (req, res) => this.generateDemo(req, res));
        this.app.post('/api/showcase/contact', (req, res) => this.handleContact(req, res));
        
        // Serve showcase homepage
        this.app.get('/', (req, res) => {
            res.send(this.generateShowcaseHTML());
        });
        
        // WebSocket for live updates
        this.wss = new WebSocket.Server({ port: this.wsPort });
        this.wss.on('connection', (ws) => {
            console.log('🔌 New showcase viewer connected');
            ws.send(JSON.stringify({
                type: 'welcome',
                systems: this.discoveredSystems
            }));
        });
    }
    
    async discoverSystems(req, res) {
        console.log('🔍 Discovering all systems...');
        
        try {
            // Read all JavaScript files
            const files = await fs.readdir('.');
            const jsFiles = files.filter(f => f.endsWith('.js'));
            
            // Analyze each file to categorize
            for (const file of jsFiles) {
                try {
                    const content = await fs.readFile(file, 'utf8');
                    const analysis = this.analyzeSystem(file, content);
                    
                    if (analysis) {
                        // Add to tier
                        this.discoveredSystems.byTier[analysis.tier].push(analysis);
                        
                        // Add to categories
                        analysis.categories.forEach(cat => {
                            if (this.discoveredSystems.byCategory[cat]) {
                                this.discoveredSystems.byCategory[cat].push(analysis);
                            }
                        });
                        
                        this.discoveredSystems.total++;
                    }
                } catch (err) {
                    // Skip problematic files
                }
            }
            
            // Broadcast update
            this.broadcast({
                type: 'discovery-complete',
                systems: this.discoveredSystems
            });
            
            res.json({
                success: true,
                discovered: this.discoveredSystems.total,
                message: 'System discovery complete'
            });
            
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    }
    
    analyzeSystem(filename, content) {
        // Skip test files and configs
        if (filename.includes('test') || filename.includes('config')) {
            return null;
        }
        
        const analysis = {
            filename,
            name: this.extractSystemName(filename),
            description: this.extractDescription(content),
            tier: this.determineTier(filename, content),
            categories: this.determineCategories(content),
            features: this.extractFeatures(content),
            port: this.extractPort(content),
            value: this.estimateValue(content),
            complexity: this.assessComplexity(content)
        };
        
        // Only include systems with substance
        if (analysis.features.length > 0) {
            return analysis;
        }
        
        return null;
    }
    
    extractSystemName(filename) {
        return filename
            .replace('.js', '')
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    
    extractDescription(content) {
        // Look for header comments
        const commentMatch = content.match(/\/\*\*[\s\S]*?\*\//);
        if (commentMatch) {
            const lines = commentMatch[0].split('\n');
            for (const line of lines) {
                if (line.includes('*') && !line.includes('/**') && !line.includes('*/')) {
                    const desc = line.replace(/\s*\*\s*/, '').trim();
                    if (desc.length > 10) return desc;
                }
            }
        }
        return 'Advanced system component';
    }
    
    determineTier(filename, content) {
        // Platform tier indicators
        if (content.includes('white-label') || content.includes('platform') || 
            filename.includes('platform') || filename.includes('orchestrator')) {
            return 'platform';
        }
        
        // Enterprise tier indicators
        if (content.includes('enterprise') || content.includes('security') ||
            content.includes('audit') || content.includes('compliance')) {
            return 'enterprise';
        }
        
        // Production tier indicators
        if (content.includes('production') || content.includes('database') ||
            content.includes('express()') || content.includes('app.listen')) {
            return 'production';
        }
        
        // Default to MVP
        return 'mvp';
    }
    
    determineCategories(content) {
        const categories = [];
        
        if (content.includes('AI') || content.includes('curriculum') || 
            content.includes('learning')) categories.push('education');
            
        if (content.includes('game') || content.includes('Game') || 
            content.includes('player')) categories.push('gaming');
            
        if (content.includes('ai') || content.includes('AI') || 
            content.includes('model')) categories.push('ai');
            
        if (content.includes('business') || content.includes('revenue') || 
            content.includes('payment')) categories.push('business');
            
        if (content.includes('security') || content.includes('auth') || 
            content.includes('encryption')) categories.push('security');
            
        if (content.includes('docker') || content.includes('server') || 
            content.includes('infrastructure')) categories.push('infrastructure');
            
        return categories.length > 0 ? categories : ['general'];
    }
    
    extractFeatures(content) {
        const features = [];
        
        // Look for class methods
        const methodMatches = content.matchAll(/async\s+(\w+)\([^)]*\)\s*{/g);
        for (const match of methodMatches) {
            const method = match[1];
            if (!['constructor', 'start', 'init'].includes(method)) {
                features.push(method);
            }
        }
        
        // Look for route definitions
        const routeMatches = content.matchAll(/app\.(get|post|put|delete)\(['"]([^'"]+)/g);
        for (const match of routeMatches) {
            features.push(`API: ${match[2]}`);
        }
        
        return features.slice(0, 5); // Top 5 features
    }
    
    extractPort(content) {
        const portMatch = content.match(/port\s*[:=]\s*(\d+)/i);
        return portMatch ? parseInt(portMatch[1]) : null;
    }
    
    estimateValue(content) {
        let value = 50; // Base value
        
        // Add value for complexity
        if (content.length > 5000) value += 100;
        if (content.includes('database')) value += 200;
        if (content.includes('AI') || content.includes('ai')) value += 300;
        if (content.includes('payment')) value += 400;
        if (content.includes('enterprise')) value += 500;
        
        return value;
    }
    
    assessComplexity(content) {
        const lines = content.split('\n').length;
        if (lines < 100) return 'simple';
        if (lines < 500) return 'moderate';
        if (lines < 1000) return 'complex';
        return 'advanced';
    }
    
    generateShowcaseHTML() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>Business Showcase Platform - All My Talents</title>
    <style>
        body {
            background: #0a0a0a;
            color: #e0e0e0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            margin: 0;
            padding: 0;
            line-height: 1.6;
        }
        
        .hero {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            padding: 80px 20px;
            text-align: center;
            border-bottom: 2px solid #3a86ff;
        }
        
        .hero h1 {
            font-size: 3.5em;
            margin: 0;
            background: linear-gradient(135deg, #3a86ff 0%, #ff006e 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: glow 2s ease-in-out infinite alternate;
        }
        
        @keyframes glow {
            from { filter: drop-shadow(0 0 20px #3a86ff); }
            to { filter: drop-shadow(0 0 30px #ff006e); }
        }
        
        .hero p {
            font-size: 1.5em;
            color: #8892b0;
            margin: 20px 0;
        }
        
        .stats {
            display: flex;
            justify-content: center;
            gap: 40px;
            margin: 40px 0;
        }
        
        .stat {
            text-align: center;
        }
        
        .stat-number {
            font-size: 3em;
            font-weight: bold;
            color: #3a86ff;
        }
        
        .stat-label {
            color: #8892b0;
            text-transform: uppercase;
            font-size: 0.9em;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 40px 20px;
        }
        
        .tier-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
            margin: 40px 0;
        }
        
        .tier-card {
            background: #1a1a2e;
            border: 1px solid #2a2a3e;
            border-radius: 12px;
            padding: 30px;
            transition: all 0.3s ease;
            cursor: pointer;
        }
        
        .tier-card:hover {
            transform: translateY(-5px);
            border-color: #3a86ff;
            box-shadow: 0 10px 30px rgba(58, 134, 255, 0.3);
        }
        
        .tier-icon {
            font-size: 3em;
            margin-bottom: 10px;
        }
        
        .tier-name {
            font-size: 1.5em;
            font-weight: bold;
            margin: 10px 0;
        }
        
        .tier-price {
            color: #3a86ff;
            font-size: 1.2em;
            font-weight: bold;
            margin: 10px 0;
        }
        
        .tier-description {
            color: #8892b0;
            margin: 15px 0;
        }
        
        .tier-count {
            background: #2a2a3e;
            padding: 5px 15px;
            border-radius: 20px;
            display: inline-block;
            margin-top: 10px;
        }
        
        .systems-section {
            margin: 60px 0;
        }
        
        .section-title {
            font-size: 2em;
            margin-bottom: 30px;
            text-align: center;
        }
        
        .category-tabs {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-bottom: 30px;
            flex-wrap: wrap;
        }
        
        .category-tab {
            background: #1a1a2e;
            border: 1px solid #2a2a3e;
            padding: 10px 25px;
            border-radius: 25px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .category-tab:hover,
        .category-tab.active {
            background: #3a86ff;
            border-color: #3a86ff;
        }
        
        .systems-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 20px;
        }
        
        .system-card {
            background: #1a1a2e;
            border: 1px solid #2a2a3e;
            border-radius: 8px;
            padding: 20px;
            transition: all 0.3s ease;
        }
        
        .system-card:hover {
            border-color: #3a86ff;
            transform: translateX(5px);
        }
        
        .system-name {
            font-size: 1.2em;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        .system-tier {
            display: inline-block;
            background: #3a86ff;
            color: white;
            padding: 3px 10px;
            border-radius: 12px;
            font-size: 0.8em;
            margin-bottom: 10px;
        }
        
        .system-description {
            color: #8892b0;
            margin: 10px 0;
            font-size: 0.95em;
        }
        
        .system-features {
            margin: 15px 0;
        }
        
        .feature {
            background: #2a2a3e;
            padding: 3px 10px;
            border-radius: 15px;
            display: inline-block;
            margin: 3px;
            font-size: 0.85em;
        }
        
        .system-actions {
            display: flex;
            gap: 10px;
            margin-top: 15px;
        }
        
        .btn {
            background: #3a86ff;
            color: white;
            border: none;
            padding: 8px 20px;
            border-radius: 5px;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
            font-size: 0.9em;
        }
        
        .btn:hover {
            background: #2872ff;
            transform: translateY(-2px);
        }
        
        .btn-secondary {
            background: #2a2a3e;
        }
        
        .btn-secondary:hover {
            background: #3a3a4e;
        }
        
        .loading {
            text-align: center;
            padding: 40px;
            font-size: 1.2em;
            color: #8892b0;
        }
        
        .cta-section {
            background: #1a1a2e;
            padding: 60px 20px;
            text-align: center;
            margin: 60px 0;
            border-radius: 12px;
        }
        
        .cta-title {
            font-size: 2.5em;
            margin-bottom: 20px;
        }
        
        .cta-subtitle {
            font-size: 1.3em;
            color: #8892b0;
            margin-bottom: 30px;
        }
        
        .contact-form {
            max-width: 500px;
            margin: 0 auto;
        }
        
        .form-group {
            margin: 20px 0;
            text-align: left;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 5px;
            color: #8892b0;
        }
        
        .form-group input,
        .form-group textarea,
        .form-group select {
            width: 100%;
            background: #0a0a0a;
            border: 1px solid #2a2a3e;
            color: #e0e0e0;
            padding: 10px;
            border-radius: 5px;
            font-size: 1em;
        }
        
        .form-group input:focus,
        .form-group textarea:focus,
        .form-group select:focus {
            outline: none;
            border-color: #3a86ff;
        }
        
        .submit-btn {
            background: linear-gradient(135deg, #3a86ff 0%, #ff006e 100%);
            color: white;
            border: none;
            padding: 15px 40px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 1.1em;
            font-weight: bold;
            transition: all 0.3s ease;
        }
        
        .submit-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(58, 134, 255, 0.4);
        }
        
        #systemsContainer {
            min-height: 200px;
        }
    </style>
</head>
<body>
    <div class="hero">
        <h1>Business Showcase Platform</h1>
        <p>300+ Systems Organized for Business Success</p>
        <div class="stats">
            <div class="stat">
                <div class="stat-number" id="totalSystems">0</div>
                <div class="stat-label">Total Systems</div>
            </div>
            <div class="stat">
                <div class="stat-number" id="totalValue">$0</div>
                <div class="stat-label">Combined Value</div>
            </div>
            <div class="stat">
                <div class="stat-number" id="activeUsers">1.2K</div>
                <div class="stat-label">Active Users</div>
            </div>
        </div>
    </div>
    
    <div class="container">
        <section class="tier-grid" id="tierGrid">
            <div class="loading">🔍 Discovering systems...</div>
        </section>
        
        <section class="systems-section">
            <h2 class="section-title">Explore All Systems</h2>
            <div class="category-tabs" id="categoryTabs">
                <div class="category-tab active" data-category="all">All Systems</div>
                <div class="category-tab" data-category="ai">AI & Machine Learning</div>
                <div class="category-tab" data-category="gaming">Gaming & Entertainment</div>
                <div class="category-tab" data-category="education">Education & Training</div>
                <div class="category-tab" data-category="business">Business Tools</div>
                <div class="category-tab" data-category="security">Security & Compliance</div>
            </div>
            <div id="systemsContainer">
                <div class="loading">Loading systems...</div>
            </div>
        </section>
        
        <section class="cta-section">
            <h2 class="cta-title">Ready to Transform Your Business?</h2>
            <p class="cta-subtitle">Let's discuss how these systems can work for you</p>
            <form class="contact-form" id="contactForm">
                <div class="form-group">
                    <label>Your Name</label>
                    <input type="text" name="name" required>
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" name="email" required>
                </div>
                <div class="form-group">
                    <label>Interest Level</label>
                    <select name="tier" required>
                        <option value="">Select tier...</option>
                        <option value="mvp">MVP - Just exploring</option>
                        <option value="production">Production - Ready to implement</option>
                        <option value="enterprise">Enterprise - Need full solution</option>
                        <option value="platform">Platform - Want to resell</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Message</label>
                    <textarea name="message" rows="4" placeholder="Tell us about your project..."></textarea>
                </div>
                <button type="submit" class="submit-btn">Get Started</button>
            </form>
        </section>
    </div>
    
    <script>
        // WebSocket connection
        const ws = new WebSocket('ws://localhost:18001');
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'discovery-complete') {
                updateUI(data.systems);
            }
        };
        
        // Discover systems on load
        fetch('/api/showcase/discover')
            .then(res => res.json())
            .then(data => {
                console.log('Discovery initiated:', data);
            });
        
        // Update UI with discovered systems
        function updateUI(systems) {
            // Update stats
            document.getElementById('totalSystems').textContent = systems.total;
            
            // Calculate total value
            let totalValue = 0;
            Object.values(systems.byTier).forEach(tierSystems => {
                tierSystems.forEach(system => {
                    totalValue += system.value || 0;
                });
            });
            document.getElementById('totalValue').textContent = '$' + totalValue.toLocaleString();
            
            // Update tier grid
            updateTierGrid(systems.byTier);
            
            // Update systems grid
            updateSystemsGrid(systems.byTier);
        }
        
        function updateTierGrid(byTier) {
            fetch('/api/showcase/tiers')
                .then(res => res.json())
                .then(tiers => {
                    const grid = document.getElementById('tierGrid');
                    grid.innerHTML = '';
                    
                    Object.entries(tiers).forEach(([key, tier]) => {
                        const count = byTier[key]?.length || 0;
                        const card = document.createElement('div');
                        card.className = 'tier-card';
                        card.innerHTML = \`
                            <div class="tier-icon">\${tier.icon}</div>
                            <div class="tier-name">\${tier.name}</div>
                            <div class="tier-price">\${tier.price}</div>
                            <div class="tier-description">\${tier.description}</div>
                            <div class="tier-count">\${count} systems available</div>
                        \`;
                        card.onclick = () => filterByTier(key);
                        grid.appendChild(card);
                    });
                });
        }
        
        function updateSystemsGrid(byTier, filter = 'all') {
            const container = document.getElementById('systemsContainer');
            container.innerHTML = '<div class="systems-grid"></div>';
            const grid = container.querySelector('.systems-grid');
            
            // Combine all systems
            let allSystems = [];
            Object.values(byTier).forEach(tierSystems => {
                allSystems = allSystems.concat(tierSystems);
            });
            
            // Filter if needed
            if (filter !== 'all') {
                allSystems = allSystems.filter(system => 
                    system.categories.includes(filter)
                );
            }
            
            // Display systems
            allSystems.forEach(system => {
                const card = document.createElement('div');
                card.className = 'system-card';
                card.innerHTML = \`
                    <div class="system-name">\${system.name}</div>
                    <span class="system-tier">\${system.tier.toUpperCase()}</span>
                    <div class="system-description">\${system.description}</div>
                    <div class="system-features">
                        \${system.features.map(f => \`<span class="feature">\${f}</span>\`).join('')}
                    </div>
                    <div class="system-actions">
                        <button class="btn" onclick="tryDemo('\${system.filename}')">Try Demo</button>
                        <button class="btn btn-secondary" onclick="viewDetails('\${system.filename}')">Details</button>
                    </div>
                \`;
                grid.appendChild(card);
            });
        }
        
        // Category filtering
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                fetch('/api/showcase/systems')
                    .then(res => res.json())
                    .then(systems => {
                        updateSystemsGrid(systems.byTier, tab.dataset.category);
                    });
            });
        });
        
        // Contact form
        document.getElementById('contactForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData);
            
            const response = await fetch('/api/showcase/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            if (result.success) {
                alert('Thank you! We\\'ll be in touch soon.');
                e.target.reset();
            }
        });
        
        // Demo functions
        function tryDemo(system) {
            window.open(\`/api/showcase/demo/\${system}\`, '_blank');
        }
        
        function viewDetails(system) {
            // Could open a modal with more details
            console.log('View details for:', system);
        }
        
        function filterByTier(tier) {
            // Scroll to systems and filter
            document.getElementById('systemsContainer').scrollIntoView({ behavior: 'smooth' });
            // Would implement tier filtering
        }
    </script>
</body>
</html>`;
    }
    
    async generateDemo(req, res) {
        const { system } = req.params;
        
        // Generate a simple demo page for the system
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>Demo: ${system}</title>
    <style>
        body {
            background: #0a0a0a;
            color: #e0e0e0;
            font-family: monospace;
            padding: 40px;
            text-align: center;
        }
        .demo-container {
            background: #1a1a2e;
            border: 1px solid #3a86ff;
            border-radius: 12px;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
        }
        h1 { color: #3a86ff; }
        .status { 
            background: #2a2a3e;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .back-btn {
            background: #3a86ff;
            color: white;
            padding: 10px 30px;
            border: none;
            border-radius: 5px;
            text-decoration: none;
            display: inline-block;
            margin-top: 20px;
        }
    </style>
</head>
<body>
    <div class="demo-container">
        <h1>Demo: ${system}</h1>
        <div class="status">
            <p>🚀 This system is available for demonstration</p>
            <p>📧 Contact us to schedule a personalized demo</p>
            <p>💡 Full source code available with appropriate tier</p>
        </div>
        <a href="/" class="back-btn">Back to Showcase</a>
    </div>
</body>
</html>`;
        
        res.send(html);
    }
    
    async handleContact(req, res) {
        const { name, email, tier, message } = req.body;
        
        console.log('📧 New contact:', { name, email, tier });
        
        // In production, this would send an email or save to database
        res.json({
            success: true,
            message: 'Contact form received'
        });
    }
    
    broadcast(data) {
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    }
    
    async start() {
        this.app.listen(this.port, () => {
            console.log('🌟 Business Showcase Platform running!');
            console.log(`📊 Main showcase: http://localhost:${this.port}`);
            console.log(`🔌 WebSocket: ws://localhost:${this.wsPort}`);
            console.log('🔍 Discovering all systems...');
            
            // Auto-discover on startup
            setTimeout(() => {
                this.discoverSystems({ }, { json: () => {} });
            }, 1000);
        });
    }
}

// Start the platform
const showcase = new BusinessShowcasePlatform();
showcase.start();

module.exports = BusinessShowcasePlatform;