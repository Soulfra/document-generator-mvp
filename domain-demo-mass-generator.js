#!/usr/bin/env node

/**
 * 🚀 DOMAIN DEMO MASS GENERATOR
 * 
 * Automated system that generates complete investment demo sites for all domains
 * using the existing brand consultation orchestrator and template systems.
 * 
 * Takes DOMAIN-REGISTRY.json and generates professional investment pitch demos
 * for all domains automatically - no more manual one-by-one creation!
 * 
 * Features:
 * - Reads domain configurations automatically
 * - Generates investment pitch pages with realistic metrics
 * - Creates interactive technology demos
 * - Builds market opportunity analysis 
 * - Applies consistent branding from registry
 * - Mass deployment ready
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class DomainDemoMassGenerator extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            domainRegistryPath: options.domainRegistryPath || './DOMAIN-REGISTRY.json',
            demosOutputPath: options.demosOutputPath || './demos',
            templateType: options.templateType || 'investment-pitch',
            generateAll: options.generateAll !== false,
            skipExisting: options.skipExisting || true,
            ...options
        };
        
        // Market data templates for realistic metrics
        this.marketData = {
            'business-analytics': { marketSize: '$156B', growth: '67%', category: 'Business Intelligence' },
            'adventure-terminal': { marketSize: '$47B', growth: '89%', category: 'EdTech Gaming' },
            'decision-terminal': { marketSize: '$234B', growth: '124%', category: 'Decision Markets' },
            'ocean-rescue': { marketSize: '$89B', growth: '78%', category: 'Crisis Management' },
            'neon-cringe': { marketSize: '$23B', growth: '156%', category: 'Social Gaming' },
            'idea-factory': { marketSize: '$67B', growth: '93%', category: 'Innovation Tools' },
            'code-completion': { marketSize: '$45B', growth: '87%', category: 'Developer Tools' },
            'stock-exchange': { marketSize: '$12B', growth: '234%', category: 'AI Agent Economy' },
            'spooky-town': { marketSize: '$34B', growth: '112%', category: 'Virtual Communities' },
            'medical-tech': { marketSize: '$78B', growth: '56%', category: 'Engagement Optimization' }
        };
        
        console.log('🚀 Domain Demo Mass Generator initialized');
        console.log(`📁 Output: ${this.config.demosOutputPath}`);
        console.log(`📋 Template: ${this.config.templateType}`);
    }
    
    async initialize() {
        console.log('✅ Domain Demo Mass Generator ready');
        this.emit('ready');
    }
    
    /**
     * Main execution - generate demos for all domains
     */
    async generateAllDemos() {
        const startTime = Date.now();
        console.log(`\n🚀 STARTING MASS DEMO GENERATION`);
        console.log('=====================================');
        
        try {
            // Load domain registry
            console.log('📋 Loading domain registry...');
            const domainRegistry = await this.loadDomainRegistry();
            
            // Get domains to process
            const domains = this.getDomainsToProcess(domainRegistry);
            console.log(`🌐 Processing ${domains.length} domains`);
            
            // Generate demos for each domain
            const results = [];
            for (const [domainName, domainConfig] of domains) {
                console.log(`\n🎯 Processing: ${domainName}`);
                
                try {
                    const demoResult = await this.generateDomainDemo(domainName, domainConfig);
                    results.push({
                        domain: domainName,
                        success: true,
                        ...demoResult
                    });
                    console.log(`✅ ${domainName}: Demo generated successfully`);
                } catch (error) {
                    console.error(`❌ ${domainName}: Generation failed - ${error.message}`);
                    results.push({
                        domain: domainName,
                        success: false,
                        error: error.message
                    });
                }
            }
            
            const totalTime = Date.now() - startTime;
            const successCount = results.filter(r => r.success).length;
            
            console.log(`\n🎉 MASS GENERATION COMPLETE!`);
            console.log('=============================');
            console.log(`⏱️ Total time: ${(totalTime / 1000).toFixed(1)}s`);
            console.log(`✅ Successful: ${successCount}/${results.length}`);
            console.log(`📂 Demos created in: ${this.config.demosOutputPath}`);
            
            // Generate summary report
            await this.generateSummaryReport(results, totalTime);
            
            this.emit('generation-complete', { results, totalTime });
            return results;
            
        } catch (error) {
            console.error(`❌ Mass generation failed: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Load domain registry configuration
     */
    async loadDomainRegistry() {
        try {
            const registryContent = await fs.readFile(this.config.domainRegistryPath, 'utf8');
            const registry = JSON.parse(registryContent);
            
            console.log(`  📊 Found ${Object.keys(registry.domains).length} domains in registry`);
            return registry;
            
        } catch (error) {
            throw new Error(`Failed to load domain registry: ${error.message}`);
        }
    }
    
    /**
     * Get list of domains to process
     */
    getDomainsToProcess(domainRegistry) {
        const allDomains = Object.entries(domainRegistry.domains);
        
        if (this.config.generateAll) {
            return allDomains;
        }
        
        // Could add filtering logic here for specific domains
        return allDomains;
    }
    
    /**
     * Generate complete demo for a single domain
     */
    async generateDomainDemo(domainName, domainConfig) {
        const demoPath = path.join(this.config.demosOutputPath, `${domainName.replace('.com', '')}-demo`);
        
        // Check if demo already exists and skip if requested
        if (this.config.skipExisting) {
            try {
                await fs.access(path.join(demoPath, 'index.html'));
                console.log(`  ⏭️ Demo already exists, skipping...`);
                return { path: demoPath, skipped: true };
            } catch {}
        }
        
        // Create demo directory
        await fs.mkdir(demoPath, { recursive: true });
        
        // Extract domain data
        const domainData = this.extractDomainData(domainName, domainConfig);
        
        // Generate main landing page
        console.log(`  🎨 Generating landing page...`);
        const landingPage = await this.generateLandingPage(domainData);
        await fs.writeFile(path.join(demoPath, 'index.html'), landingPage);
        
        // Generate demo sections
        console.log(`  🏗️ Generating demo sections...`);
        const sections = await this.generateDemoSections(domainData, demoPath);
        
        // Generate navigation and assets
        console.log(`  🧭 Setting up navigation...`);
        const assets = await this.generateAssets(domainData, demoPath);
        
        return {
            path: demoPath,
            sections: sections.length,
            landingPage: path.join(demoPath, 'index.html'),
            assets
        };
    }
    
    /**
     * Extract structured data from domain configuration
     */
    extractDomainData(domainName, domainConfig) {
        const theme = domainConfig.branding?.theme || 'default';
        const marketInfo = this.marketData[theme] || this.marketData['business-analytics'];
        
        // Generate realistic business metrics
        const metrics = this.generateBusinessMetrics(domainName, domainConfig, marketInfo);
        
        return {
            name: domainName,
            displayName: this.formatDisplayName(domainName),
            zone: domainConfig.zone || {},
            branding: domainConfig.branding || {},
            functionality: domainConfig.functionality || {},
            routing: domainConfig.routing || {},
            theme,
            marketInfo,
            metrics,
            tagline: this.generateTagline(domainName, domainConfig),
            description: domainConfig.zone?.description || `Advanced ${this.formatDisplayName(domainName)} platform`
        };
    }
    
    /**
     * Generate realistic business metrics for a domain
     */
    generateBusinessMetrics(domainName, domainConfig, marketInfo) {
        // Base the metrics on domain theme and market size
        const baseUsers = Math.floor(Math.random() * 50000 + 10000);
        const baseRevenue = Math.floor(Math.random() * 5000000 + 1000000);
        
        return {
            activeUsers: this.formatNumber(baseUsers),
            monthlyRevenue: this.formatCurrency(baseRevenue / 12),
            annualRevenue: this.formatCurrency(baseRevenue),
            marketSize: marketInfo.marketSize,
            growthRate: marketInfo.growth,
            customerSatisfaction: (Math.random() * 10 + 90).toFixed(1) + '%',
            retentionRate: (Math.random() * 15 + 85).toFixed(1) + '%',
            conversionRate: (Math.random() * 8 + 12).toFixed(1) + '%',
            totalTransactions: this.formatNumber(Math.floor(Math.random() * 500000 + 100000)),
            avgSessionTime: (Math.random() * 10 + 5).toFixed(1) + ' min',
            platformUptime: (Math.random() * 1 + 99).toFixed(2) + '%'
        };
    }
    
    /**
     * Generate main landing page HTML
     */
    async generateLandingPage(domainData) {
        const primaryColor = domainData.branding.primaryColor || '#6B46C1';
        const secondaryColor = domainData.branding.secondaryColor || '#1a1a2e';
        const theme = domainData.theme;
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${domainData.displayName} - Investment Opportunity</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary-color: ${primaryColor};
            --secondary-color: ${secondaryColor};
            --accent-color: #00ff88;
            --bg-primary: #000000;
            --bg-secondary: #0a0a0a;
            --text-primary: #ffffff;
            --text-secondary: #cccccc;
            --gradient: linear-gradient(45deg, ${primaryColor}, ${this.adjustColor(primaryColor, 30)});
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Inter', sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            line-height: 1.6;
            overflow-x: hidden;
        }

        .hero {
            text-align: center;
            padding: 4rem 2rem;
            background: radial-gradient(circle at 50% 50%, rgba(107, 70, 193, 0.3) 0%, transparent 70%);
            position: relative;
        }

        .hero h1 {
            font-size: 3.5rem;
            font-weight: 900;
            margin-bottom: 1rem;
            background: var(--gradient);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: glow 3s ease-in-out infinite alternate;
        }

        .hero .tagline {
            font-size: 1.5rem;
            color: var(--accent-color);
            margin-bottom: 1rem;
        }

        .hero .description {
            font-size: 1.1rem;
            color: var(--text-secondary);
            max-width: 600px;
            margin: 0 auto 2rem;
        }

        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 2rem;
            max-width: 1200px;
            margin: 4rem auto;
            padding: 0 2rem;
        }

        .metric-card {
            background: rgba(107, 70, 193, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(107, 70, 193, 0.3);
            border-radius: 16px;
            padding: 2rem;
            text-align: center;
            transition: all 0.3s ease;
            cursor: pointer;
        }

        .metric-card:hover {
            transform: translateY(-10px);
            border-color: var(--accent-color);
            box-shadow: 0 20px 40px rgba(0, 255, 136, 0.3);
        }

        .metric-value {
            font-size: 2.5rem;
            font-weight: 700;
            color: var(--accent-color);
            margin-bottom: 0.5rem;
            text-shadow: 0 0 20px currentColor;
        }

        .metric-label {
            font-size: 1rem;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .section {
            padding: 4rem 2rem;
            max-width: 1200px;
            margin: 0 auto;
        }

        .section-title {
            font-size: 2.5rem;
            text-align: center;
            margin-bottom: 3rem;
            background: var(--gradient);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .demo-sections {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            margin: 3rem 0;
        }

        .demo-card {
            background: var(--bg-secondary);
            border: 1px solid var(--primary-color);
            border-radius: 12px;
            padding: 2rem;
            transition: all 0.3s ease;
        }

        .demo-card:hover {
            transform: scale(1.02);
            border-color: var(--accent-color);
        }

        .demo-card h3 {
            color: var(--primary-color);
            margin-bottom: 1rem;
        }

        .cta-section {
            text-align: center;
            padding: 4rem 2rem;
            background: var(--bg-secondary);
        }

        .btn-primary {
            background: var(--gradient);
            color: white;
            border: none;
            padding: 16px 32px;
            border-radius: 30px;
            font-weight: 600;
            font-size: 1.1rem;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            margin: 0.5rem;
            transition: all 0.3s ease;
        }

        .btn-primary:hover {
            transform: scale(1.05);
            box-shadow: 0 10px 30px rgba(107, 70, 193, 0.5);
        }

        .navigation {
            display: flex;
            justify-content: center;
            gap: 1rem;
            margin: 2rem 0;
            flex-wrap: wrap;
        }

        .nav-pill {
            padding: 8px 16px;
            border: 2px solid var(--primary-color);
            border-radius: 20px;
            color: var(--primary-color);
            text-decoration: none;
            transition: all 0.3s ease;
        }

        .nav-pill:hover {
            background: var(--primary-color);
            color: white;
        }

        @keyframes glow {
            0% { text-shadow: 0 0 20px var(--primary-color); }
            100% { text-shadow: 0 0 40px var(--primary-color), 0 0 60px var(--primary-color); }
        }

        @media (max-width: 768px) {
            .hero h1 { font-size: 2.5rem; }
            .metrics-grid { grid-template-columns: 1fr; }
            .demo-sections { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <header class="hero">
        <h1>${domainData.displayName}</h1>
        <p class="tagline">${domainData.tagline}</p>
        <p class="description">${domainData.description}</p>
    </header>

    <section class="metrics-grid">
        <div class="metric-card">
            <div class="metric-value">${domainData.metrics.activeUsers}</div>
            <div class="metric-label">Active Users</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${domainData.metrics.annualRevenue}</div>
            <div class="metric-label">Annual Revenue</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${domainData.metrics.customerSatisfaction}</div>
            <div class="metric-label">Customer Satisfaction</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${domainData.marketInfo.marketSize}</div>
            <div class="metric-label">Market Size</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${domainData.metrics.retentionRate}</div>
            <div class="metric-label">User Retention</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${domainData.marketInfo.growth}</div>
            <div class="metric-label">YoY Growth</div>
        </div>
    </section>

    <section class="section">
        <h2 class="section-title">Investment Opportunity</h2>
        
        <div class="demo-sections">
            <div class="demo-card">
                <h3>🎯 Market Opportunity</h3>
                <p>The ${domainData.marketInfo.category} market is experiencing unprecedented growth at ${domainData.marketInfo.growth} YoY, reaching ${domainData.marketInfo.marketSize} total addressable market.</p>
                <div class="navigation">
                    <a href="./01-market-opportunity/" class="nav-pill">View Analysis</a>
                </div>
            </div>
            
            <div class="demo-card">
                <h3>💼 Business Model</h3>
                <p>Proven revenue streams with ${domainData.metrics.monthlyRevenue} monthly recurring revenue and ${domainData.metrics.conversionRate} conversion rates across multiple channels.</p>
                <div class="navigation">
                    <a href="./02-business-model/" class="nav-pill">Revenue Streams</a>
                </div>
            </div>
            
            <div class="demo-card">
                <h3>⚡ Technology Demo</h3>
                <p>Live interactive platform demonstration showcasing core functionality with ${domainData.metrics.platformUptime} uptime and ${domainData.metrics.avgSessionTime} average session time.</p>
                <div class="navigation">
                    <a href="./03-technology-demo/" class="nav-pill">Live Demo</a>
                </div>
            </div>
            
            <div class="demo-card">
                <h3>📊 Financial Projections</h3>
                <p>Detailed financial modeling with ${domainData.metrics.totalTransactions} transactions processed and clear path to profitability and scale.</p>
                <div class="navigation">
                    <a href="./04-financial-projections/" class="nav-pill">Financials</a>
                </div>
            </div>
        </div>
    </section>

    <section class="cta-section">
        <h2 style="margin-bottom: 2rem;">Ready to Invest in the Future?</h2>
        <a href="mailto:invest@${domainData.name}" class="btn-primary">📧 Contact Investors</a>
        <a href="./03-technology-demo/" class="btn-primary">🚀 Try Live Demo</a>
        <a href="./pitch-deck.pdf" class="btn-primary">📊 Download Pitch Deck</a>
    </section>

    <script>
        // Add interactive effects
        document.querySelectorAll('.metric-card').forEach(card => {
            card.addEventListener('click', () => {
                card.style.transform = 'scale(1.05)';
                setTimeout(() => {
                    card.style.transform = '';
                }, 200);
            });
        });

        // Animate metrics on scroll
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animation = 'slideIn 0.6s ease-out';
                }
            });
        });

        document.querySelectorAll('.metric-card').forEach(card => {
            observer.observe(card);
        });
    </script>
</body>
</html>`;
    }
    
    /**
     * Generate demo sections for a domain
     */
    async generateDemoSections(domainData, demoPath) {
        const sections = [
            '01-market-opportunity',
            '02-business-model', 
            '03-technology-demo',
            '04-financial-projections'
        ];
        
        const generatedSections = [];
        
        for (const section of sections) {
            const sectionPath = path.join(demoPath, section);
            await fs.mkdir(sectionPath, { recursive: true });
            
            const sectionHtml = await this.generateSectionHTML(section, domainData);
            await fs.writeFile(path.join(sectionPath, 'index.html'), sectionHtml);
            
            generatedSections.push({
                name: section,
                path: sectionPath,
                url: `./${section}/`
            });
        }
        
        return generatedSections;
    }
    
    /**
     * Generate HTML for a specific section
     */
    async generateSectionHTML(sectionType, domainData) {
        const sectionTitle = this.getSectionTitle(sectionType);
        const sectionContent = this.getSectionContent(sectionType, domainData);
        
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${sectionTitle} - ${domainData.displayName}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700;900&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary-color: ${domainData.branding.primaryColor || '#6B46C1'};
            --secondary-color: ${domainData.branding.secondaryColor || '#1a1a2e'};
            --accent-color: #00ff88;
            --bg-primary: #000000;
            --bg-secondary: #0a0a0a;
            --text-primary: #ffffff;
            --text-secondary: #cccccc;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Inter', sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            line-height: 1.6;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }

        .back-nav {
            position: fixed;
            top: 2rem;
            left: 2rem;
            z-index: 100;
        }

        .back-btn {
            background: rgba(107, 70, 193, 0.2);
            border: 1px solid var(--primary-color);
            color: var(--text-primary);
            padding: 0.8rem 1.5rem;
            border-radius: 25px;
            text-decoration: none;
            transition: all 0.3s ease;
        }

        .back-btn:hover {
            background: var(--primary-color);
            transform: scale(1.05);
        }

        .header {
            text-align: center;
            padding: 4rem 0;
            background: radial-gradient(circle, rgba(107, 70, 193, 0.3) 0%, transparent 70%);
        }

        .main-title {
            font-size: 3rem;
            color: var(--text-primary);
            margin-bottom: 1rem;
            text-shadow: 0 0 30px var(--primary-color);
        }

        .content {
            background: var(--bg-secondary);
            border-radius: 12px;
            padding: 3rem;
            margin: 2rem 0;
        }

        .section-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            margin: 2rem 0;
        }

        .info-card {
            background: var(--bg-primary);
            border: 1px solid var(--primary-color);
            border-radius: 8px;
            padding: 2rem;
        }

        h3 {
            color: var(--primary-color);
            margin-bottom: 1rem;
        }
    </style>
</head>
<body>
    <div class="back-nav">
        <a href="../index.html" class="back-btn">← Back to ${domainData.displayName}</a>
    </div>

    <header class="header">
        <div class="container">
            <h1 class="main-title">${sectionTitle}</h1>
        </div>
    </header>

    <main class="container">
        <div class="content">
            ${sectionContent}
        </div>
    </main>
</body>
</html>`;
    }
    
    /**
     * Get section title based on type
     */
    getSectionTitle(sectionType) {
        const titles = {
            '01-market-opportunity': '🎯 Market Opportunity Analysis',
            '02-business-model': '💼 Business Model & Revenue Streams', 
            '03-technology-demo': '⚡ Interactive Technology Demo',
            '04-financial-projections': '📊 Financial Projections & ROI'
        };
        
        return titles[sectionType] || 'Section Details';
    }
    
    /**
     * Generate section-specific content
     */
    getSectionContent(sectionType, domainData) {
        switch (sectionType) {
            case '01-market-opportunity':
                return `
                    <h2>Market Analysis</h2>
                    <div class="section-grid">
                        <div class="info-card">
                            <h3>Total Addressable Market</h3>
                            <p><strong>${domainData.marketInfo.marketSize}</strong></p>
                            <p>The ${domainData.marketInfo.category} market represents massive opportunity with ${domainData.marketInfo.growth} year-over-year growth.</p>
                        </div>
                        <div class="info-card">
                            <h3>Market Position</h3>
                            <p>Currently serving <strong>${domainData.metrics.activeUsers}</strong> active users with <strong>${domainData.metrics.customerSatisfaction}</strong> satisfaction rate.</p>
                        </div>
                        <div class="info-card">
                            <h3>Growth Trajectory</h3>
                            <p>Experiencing <strong>${domainData.marketInfo.growth}</strong> growth with <strong>${domainData.metrics.retentionRate}</strong> user retention.</p>
                        </div>
                    </div>
                `;
                
            case '02-business-model':
                return `
                    <h2>Revenue Model</h2>
                    <div class="section-grid">
                        <div class="info-card">
                            <h3>Monthly Recurring Revenue</h3>
                            <p><strong>${domainData.metrics.monthlyRevenue}</strong></p>
                            <p>Stable subscription-based revenue with ${domainData.metrics.conversionRate} conversion rate.</p>
                        </div>
                        <div class="info-card">
                            <h3>Annual Revenue</h3>
                            <p><strong>${domainData.metrics.annualRevenue}</strong></p>
                            <p>Total annual revenue with strong growth trajectory and expanding market presence.</p>
                        </div>
                        <div class="info-card">
                            <h3>Transaction Volume</h3>
                            <p><strong>${domainData.metrics.totalTransactions}</strong> transactions processed</p>
                            <p>High-volume platform with proven scalability and transaction processing capabilities.</p>
                        </div>
                    </div>
                `;
                
            case '03-technology-demo':
                return `
                    <h2>Platform Technology</h2>
                    <div class="section-grid">
                        <div class="info-card">
                            <h3>Platform Performance</h3>
                            <p><strong>${domainData.metrics.platformUptime}</strong> uptime</p>
                            <p>Enterprise-grade reliability with <strong>${domainData.metrics.avgSessionTime}</strong> average session time.</p>
                        </div>
                        <div class="info-card">
                            <h3>User Engagement</h3>
                            <p><strong>${domainData.metrics.retentionRate}</strong> retention rate</p>
                            <p>High user engagement with proven product-market fit and satisfied user base.</p>
                        </div>
                        <div class="info-card">
                            <h3>Technical Innovation</h3>
                            <p>Advanced ${domainData.marketInfo.category.toLowerCase()} technology stack</p>
                            <p>Cutting-edge platform architecture with scalable infrastructure and modern tech stack.</p>
                        </div>
                    </div>
                `;
                
            case '04-financial-projections':
                return `
                    <h2>Financial Outlook</h2>
                    <div class="section-grid">
                        <div class="info-card">
                            <h3>Revenue Growth</h3>
                            <p>Current: <strong>${domainData.metrics.annualRevenue}</strong></p>
                            <p>Projected: <strong>${this.formatCurrency(parseInt(domainData.metrics.annualRevenue.replace(/[$,]/g, '')) * 3)}</strong> (3-year)</p>
                        </div>
                        <div class="info-card">
                            <h3>Market Expansion</h3>
                            <p>Growing at <strong>${domainData.marketInfo.growth}</strong> annually</p>
                            <p>Expanding into ${domainData.marketInfo.marketSize} total addressable market.</p>
                        </div>
                        <div class="info-card">
                            <h3>Investment ROI</h3>
                            <p><strong>5-10x</strong> projected return</p>
                            <p>Based on current growth metrics and market expansion opportunities.</p>
                        </div>
                    </div>
                `;
                
            default:
                return '<p>Section content coming soon...</p>';
        }
    }
    
    /**
     * Generate supporting assets
     */
    async generateAssets(domainData, demoPath) {
        // Could generate additional assets like images, CSS files, etc.
        const assets = {
            styles: 'Generated inline styles',
            scripts: 'Generated inline scripts',
            images: 'Placeholder for generated images'
        };
        
        return assets;
    }
    
    /**
     * Generate summary report of all generated demos
     */
    async generateSummaryReport(results, totalTime) {
        const reportPath = path.join(this.config.demosOutputPath, 'GENERATION-REPORT.md');
        
        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;
        
        const report = `# Domain Demo Mass Generation Report

## Summary
- **Total Domains Processed**: ${results.length}
- **Successful Generations**: ${successCount}
- **Failed Generations**: ${failCount}
- **Total Time**: ${(totalTime / 1000).toFixed(1)}s
- **Average Time per Domain**: ${(totalTime / results.length / 1000).toFixed(1)}s

## Generated Demos

${results.map(result => {
    if (result.success) {
        return `### ✅ ${result.domain}
- **Status**: Success ${result.skipped ? '(Skipped - Already Exists)' : ''}
- **Path**: ${result.path}
- **Sections**: ${result.sections || 0} demo sections generated
- **Landing Page**: ${result.landingPage}`;
    } else {
        return `### ❌ ${result.domain}
- **Status**: Failed
- **Error**: ${result.error}`;
    }
}).join('\n\n')}

## Next Steps
1. Review generated demos at: ${this.config.demosOutputPath}
2. Test all landing pages and navigation
3. Deploy using consultation-to-deployment.js pipeline
4. Configure domain routing and DNS

---
Generated on: ${new Date().toISOString()}
Generator: Domain Demo Mass Generator v1.0.0
`;
        
        await fs.writeFile(reportPath, report);
        console.log(`📊 Generation report saved: ${reportPath}`);
    }
    
    // Utility methods
    formatDisplayName(domainName) {
        return domainName
            .replace('.com', '')
            .split(/[-_]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
    
    formatCurrency(amount) {
        return '$' + amount.toLocaleString();
    }
    
    generateTagline(domainName, domainConfig) {
        const taglines = {
            'dealordelete.com': 'Make Smart Decisions or Delete Bad Ones',
            'saveorsink.com': 'Rescue What Matters, Sink What Doesn\'t',
            'finishthisidea.com': 'From Concept to Creation in Minutes',
            'finishthisrepo.com': 'Complete Any Project, Perfectly',
            'ipomyagent.com': 'Take Your AI Agent Public',
            'hollowtown.com': 'Where Digital Communities Come Alive',
            'hookclinic.com': 'Optimize Every Engagement Hook'
        };
        
        return taglines[domainName] || `Advanced ${this.formatDisplayName(domainName)} Platform`;
    }
    
    adjustColor(color, amount) {
        // Simple color adjustment - could be more sophisticated
        const num = parseInt(color.replace('#', ''), 16);
        const amt = Math.round(2.55 * amount);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }
}

module.exports = DomainDemoMassGenerator;

// CLI interface
if (require.main === module) {
    const generator = new DomainDemoMassGenerator();
    
    console.log('🚀 Starting Domain Demo Mass Generator...\n');
    
    generator.initialize().then(async () => {
        try {
            const results = await generator.generateAllDemos();
            
            console.log('\n🎯 MASS GENERATION COMPLETE!');
            console.log('Next steps:');
            console.log('1. Review generated demos in ./demos/');
            console.log('2. Test landing pages and navigation');
            console.log('3. Deploy using: node consultation-to-deployment.js');
            console.log('4. Configure domain routing');
            
            process.exit(0);
        } catch (error) {
            console.error('\n❌ Mass generation failed:', error.message);
            process.exit(1);
        }
    });
}