#!/usr/bin/env node

/**
 * 🗺️ ZONE MAPPER TOOL
 * Scans your 300+ domains and categorizes them into simple game zones
 * No fantasy bullshit - just clear, understandable zone types
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class ZoneMapperTool {
    constructor() {
        this.domains = new Map();
        this.zones = new Map();
        this.zoneTypes = {
            // Clear, simple zone categories
            'spawn': {
                name: 'Spawn Zone',
                description: 'Safe starting areas and main hubs',
                color: '#00ff88',
                emoji: '🏠',
                keywords: ['home', 'main', 'index', 'start', 'hub', 'portal']
            },
            'marketplace': {
                name: 'Marketplace',
                description: 'Commerce, trading, and business domains',
                color: '#ffcc00',
                emoji: '🏪',
                keywords: ['shop', 'store', 'buy', 'sell', 'market', 'commerce', 'business', 'trade']
            },
            'tech_zone': {
                name: 'Tech Zone',
                description: 'APIs, documentation, and developer tools',
                color: '#00ccff',
                emoji: '💻',
                keywords: ['api', 'docs', 'tech', 'dev', 'code', 'git', 'developer', 'documentation']
            },
            'content_forge': {
                name: 'Content Forge',
                description: 'Content creation and media production',
                color: '#ff6600',
                emoji: '🎨',
                keywords: ['content', 'blog', 'media', 'create', 'write', 'video', 'stream', 'publish']
            },
            'gaming_arena': {
                name: 'Gaming Arena',
                description: 'Games, entertainment, and interactive content',
                color: '#ff00cc',
                emoji: '🎮',
                keywords: ['game', 'play', 'entertainment', 'fun', 'arena', 'battle', 'sport']
            },
            'data_mines': {
                name: 'Data Mines',
                description: 'Analytics, databases, and data processing',
                color: '#9900ff',
                emoji: '💎',
                keywords: ['data', 'analytics', 'stats', 'database', 'insight', 'metric', 'report']
            },
            'ai_temple': {
                name: 'AI Temple',
                description: 'AI services, machine learning, and automation',
                color: '#ff3366',
                emoji: '🧠',
                keywords: ['ai', 'ml', 'bot', 'auto', 'smart', 'intelligence', 'chat', 'assistant']
            },
            'crypto_exchange': {
                name: 'Crypto Exchange',
                description: 'Blockchain, crypto, and financial services',
                color: '#33ff99',
                emoji: '⛓️',
                keywords: ['crypto', 'blockchain', 'token', 'finance', 'money', 'pay', 'wallet', 'defi']
            },
            'danger_zone': {
                name: 'Danger Zone',
                description: 'Experimental, testing, or high-risk domains',
                color: '#ff4444',
                emoji: '⚠️',
                keywords: ['test', 'beta', 'experimental', 'dev', 'staging', 'debug', 'temp']
            },
            'mystery_zone': {
                name: 'Mystery Zone',
                description: 'Unknown or uncategorized domains',
                color: '#666666',
                emoji: '❓',
                keywords: []
            }
        };
        
        console.log('🗺️ Zone Mapper Tool initialized');
        console.log('📍 Zone types available:', Object.keys(this.zoneTypes).length);
    }
    
    async scanDomains() {
        console.log('\n🔍 Scanning for domain information...');
        
        // Look for domain lists in common files
        const searchPaths = [
            'DOMAIN-REGISTRY.json',
            'package.json',
            'domains.txt',
            'sites.json',
            '.env',
            '.env.example',
            'CLOUDFLARE-DOMAIN-ROUTING.json'
        ];
        
        for (const searchPath of searchPaths) {
            try {
                const fullPath = path.join(__dirname, searchPath);
                const content = await fs.readFile(fullPath, 'utf8');
                await this.extractDomainsFromContent(content, searchPath);
            } catch (error) {
                // File doesn't exist, skip
            }
        }
        
        // Scan for domains mentioned in documentation
        await this.scanDocumentationForDomains();
        
        // Add some example domains if none found
        if (this.domains.size === 0) {
            await this.addExampleDomains();
        }
        
        console.log(`✅ Found ${this.domains.size} domains to categorize`);
    }
    
    async extractDomainsFromContent(content, fileName) {
        // Extract domain patterns
        const domainRegex = /([a-zA-Z0-9-]+\.[a-zA-Z]{2,})/g;
        const matches = content.match(domainRegex) || [];
        
        for (const match of matches) {
            // Skip common non-domains
            if (this.isValidDomain(match)) {
                await this.addDomain(match, fileName);
            }
        }
        
        // Special handling for JSON files
        if (fileName.endsWith('.json')) {
            try {
                const data = JSON.parse(content);
                await this.extractDomainsFromJSON(data, fileName);
            } catch (error) {
                // Not valid JSON, skip
            }
        }
    }
    
    async extractDomainsFromJSON(data, fileName) {
        const domains = [];
        
        // Recursively find domain-like values
        function findDomains(obj, path = '') {
            if (typeof obj === 'string' && obj.includes('.')) {
                const domainMatch = obj.match(/([a-zA-Z0-9-]+\.[a-zA-Z]{2,})/);
                if (domainMatch) domains.push(domainMatch[1]);
            } else if (typeof obj === 'object' && obj !== null) {
                for (const [key, value] of Object.entries(obj)) {
                    findDomains(value, path ? `${path}.${key}` : key);
                }
            }
        }
        
        findDomains(data);
        
        for (const domain of domains) {
            if (this.isValidDomain(domain)) {
                await this.addDomain(domain, fileName);
            }
        }
    }
    
    async scanDocumentationForDomains() {
        const docFiles = [
            'README.md',
            'CLAUDE.md',
            'CLAUDE.deathtodata.md',
            'DEPLOYMENT-GUIDE.md'
        ];
        
        for (const docFile of docFiles) {
            try {
                const content = await fs.readFile(path.join(__dirname, docFile), 'utf8');
                await this.extractDomainsFromContent(content, docFile);
            } catch (error) {
                // File doesn't exist, skip
            }
        }
    }
    
    async addExampleDomains() {
        // Add some example domains based on your system
        const exampleDomains = [
            'deathtodata.com',
            'finishthisidea.com',
            'api.empire.local',
            'docs.empire.local',
            'gaming.empire.local',
            'ai.empire.local',
            'content.empire.local',
            'crypto.empire.local',
            'marketplace.empire.local',
            'test.empire.local'
        ];
        
        for (const domain of exampleDomains) {
            await this.addDomain(domain, 'examples');
        }
    }
    
    async addDomain(domain, source) {
        if (!this.domains.has(domain)) {
            this.domains.set(domain, {
                domain,
                source,
                zone_type: null,
                confidence: 0,
                properties: {},
                discovered_at: new Date().toISOString()
            });
        }
    }
    
    isValidDomain(domain) {
        // Filter out common false positives
        const invalidDomains = [
            'localhost.com',
            'example.com',
            'test.com',
            'github.com',
            'google.com',
            'twitter.com',
            'facebook.com'
        ];
        
        return !invalidDomains.includes(domain.toLowerCase()) &&
               domain.length > 4 &&
               domain.includes('.') &&
               !domain.startsWith('www.');
    }
    
    async categorizeDomains() {
        console.log('\n🎯 Categorizing domains into zones...');
        
        for (const [domain, info] of this.domains) {
            const zoneType = await this.determineDomainZone(domain, info);
            info.zone_type = zoneType.type;
            info.confidence = zoneType.confidence;
            info.reasoning = zoneType.reasoning;
            
            // Add to zone
            if (!this.zones.has(zoneType.type)) {
                this.zones.set(zoneType.type, {
                    ...this.zoneTypes[zoneType.type],
                    domains: []
                });
            }
            
            this.zones.get(zoneType.type).domains.push(domain);
        }
        
        console.log('✅ Domain categorization complete');
        this.printZoneSummary();
    }
    
    async determineDomainZone(domain, info) {
        const domainLower = domain.toLowerCase();
        
        // Check each zone type for keyword matches
        for (const [zoneType, zoneInfo] of Object.entries(this.zoneTypes)) {
            if (zoneType === 'mystery_zone') continue; // Skip mystery zone for now
            
            let score = 0;
            const matchedKeywords = [];
            
            for (const keyword of zoneInfo.keywords) {
                if (domainLower.includes(keyword)) {
                    score += 1;
                    matchedKeywords.push(keyword);
                }
            }
            
            // Special scoring rules
            if (domainLower.includes('api') || domainLower.includes('docs')) {
                if (zoneType === 'tech_zone') score += 3;
            }
            
            if (domainLower.includes('deathtodata') || domainLower.includes('main') || domainLower.includes('home')) {
                if (zoneType === 'spawn') score += 5;
            }
            
            if (domainLower.includes('test') || domainLower.includes('staging') || domainLower.includes('beta')) {
                if (zoneType === 'danger_zone') score += 4;
            }
            
            if (score > 0) {
                return {
                    type: zoneType,
                    confidence: Math.min(score / 3, 1.0),
                    reasoning: `Matched keywords: ${matchedKeywords.join(', ')}`
                };
            }
        }
        
        // Default to mystery zone
        return {
            type: 'mystery_zone',
            confidence: 0.1,
            reasoning: 'No clear indicators found'
        };
    }
    
    printZoneSummary() {
        console.log('\n🗺️ ZONE MAP SUMMARY');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        for (const [zoneType, zoneData] of this.zones) {
            const zoneInfo = this.zoneTypes[zoneType];
            console.log(`\n${zoneInfo.emoji} ${zoneInfo.name.toUpperCase()}`);
            console.log(`   ${zoneInfo.description}`);
            console.log(`   Domains: ${zoneData.domains.length}`);
            
            if (zoneData.domains.length > 0) {
                const displayDomains = zoneData.domains.slice(0, 5);
                for (const domain of displayDomains) {
                    const domainInfo = this.domains.get(domain);
                    console.log(`   • ${domain} (${Math.round(domainInfo.confidence * 100)}% confidence)`);
                }
                
                if (zoneData.domains.length > 5) {
                    console.log(`   ... and ${zoneData.domains.length - 5} more`);
                }
            }
        }
        
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }
    
    async generateZoneMap() {
        console.log('\n🎨 Generating zone map files...');
        
        // Generate JSON map
        const zoneMap = {
            generated_at: new Date().toISOString(),
            total_domains: this.domains.size,
            zones: Object.fromEntries(
                Array.from(this.zones.entries()).map(([zoneType, zoneData]) => [
                    zoneType,
                    {
                        ...this.zoneTypes[zoneType],
                        domain_count: zoneData.domains.length,
                        domains: zoneData.domains.map(domain => ({
                            domain,
                            confidence: this.domains.get(domain).confidence,
                            source: this.domains.get(domain).source
                        }))
                    }
                ])
            )
        };
        
        await fs.writeFile(
            path.join(__dirname, 'empire-zone-map.json'),
            JSON.stringify(zoneMap, null, 2)
        );
        
        // Generate Markdown summary
        const markdownSummary = this.generateMarkdownSummary(zoneMap);
        await fs.writeFile(
            path.join(__dirname, 'EMPIRE-ZONE-MAP.md'),
            markdownSummary
        );
        
        // Generate HTML visualization
        const htmlVisualization = this.generateHTMLVisualization(zoneMap);
        await fs.writeFile(
            path.join(__dirname, 'empire-zone-visualizer.html'),
            htmlVisualization
        );
        
        console.log('✅ Zone map files generated:');
        console.log('   📋 empire-zone-map.json - Raw zone data');
        console.log('   📝 EMPIRE-ZONE-MAP.md - Human-readable summary');
        console.log('   🎨 empire-zone-visualizer.html - Interactive map');
    }
    
    generateMarkdownSummary(zoneMap) {
        let markdown = `# 🗺️ Empire Zone Map\n\n`;
        markdown += `Generated: ${zoneMap.generated_at}\n`;
        markdown += `Total Domains: ${zoneMap.total_domains}\n\n`;
        
        markdown += `## 🎯 Zone Overview\n\n`;
        markdown += `Your empire has been mapped into ${Object.keys(zoneMap.zones).length} distinct zones:\n\n`;
        
        for (const [zoneType, zoneInfo] of Object.entries(zoneMap.zones)) {
            markdown += `### ${zoneInfo.emoji} ${zoneInfo.name}\n`;
            markdown += `${zoneInfo.description}\n\n`;
            markdown += `**Domains in this zone:** ${zoneInfo.domain_count}\n\n`;
            
            if (zoneInfo.domains.length > 0) {
                markdown += `| Domain | Confidence | Source |\n`;
                markdown += `|--------|------------|--------|\n`;
                
                for (const domainInfo of zoneInfo.domains) {
                    const confidence = Math.round(domainInfo.confidence * 100);
                    markdown += `| ${domainInfo.domain} | ${confidence}% | ${domainInfo.source} |\n`;
                }
                markdown += `\n`;
            }
        }
        
        markdown += `## 🎮 Using the Zone System\n\n`;
        markdown += `### Voice Commands\n`;
        markdown += `- "What zone am I in?" - Shows current domain zone\n`;
        markdown += `- "Generate content for this zone" - Domain-specific content\n`;
        markdown += `- "Warp to [zone name]" - Quick navigation\n`;
        markdown += `- "Show zone map" - Visual overview\n\n`;
        
        markdown += `### Zone Navigation\n`;
        markdown += `Each zone represents a different area of your empire:\n\n`;
        
        for (const [zoneType, zoneInfo] of Object.entries(zoneMap.zones)) {
            if (zoneInfo.domains.length > 0) {
                markdown += `- **${zoneInfo.name}**: Visit any domain in this zone for ${zoneInfo.description.toLowerCase()}\n`;
            }
        }
        
        return markdown;
    }
    
    generateHTMLVisualization(zoneMap) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🗺️ Empire Zone Map</title>
    <style>
        body {
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
            color: #00ff88;
            margin: 0;
            padding: 20px;
            min-height: 100vh;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 20px;
            background: rgba(0, 255, 136, 0.1);
            border-radius: 15px;
            border: 2px solid #00ff88;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin: 0;
            text-shadow: 0 0 20px #00ff88;
        }
        
        .zone-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        
        .zone-card {
            background: rgba(26, 26, 46, 0.8);
            border: 2px solid;
            border-radius: 15px;
            padding: 20px;
            transition: all 0.3s ease;
            cursor: pointer;
        }
        
        .zone-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 10px 30px rgba(0, 255, 136, 0.3);
        }
        
        .zone-header {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 15px;
        }
        
        .zone-emoji {
            font-size: 2.5em;
        }
        
        .zone-info h3 {
            margin: 0;
            font-size: 1.5em;
        }
        
        .zone-description {
            margin: 10px 0;
            opacity: 0.8;
            font-size: 0.9em;
        }
        
        .domain-count {
            background: rgba(0, 255, 136, 0.2);
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 0.8em;
            margin-bottom: 15px;
            display: inline-block;
        }
        
        .domain-list {
            max-height: 200px;
            overflow-y: auto;
        }
        
        .domain-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid rgba(0, 255, 136, 0.2);
        }
        
        .domain-name {
            font-weight: bold;
        }
        
        .confidence-badge {
            background: rgba(0, 255, 136, 0.3);
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 0.8em;
        }
        
        .navigation {
            text-align: center;
            background: rgba(0, 255, 136, 0.1);
            padding: 20px;
            border-radius: 10px;
            margin-top: 20px;
        }
        
        .nav-button {
            background: linear-gradient(45deg, #00ff88, #00ccff);
            color: #0a0a0a;
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            margin: 5px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s ease;
        }
        
        .nav-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 255, 136, 0.4);
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        
        .stat-card {
            background: rgba(0, 255, 136, 0.1);
            padding: 15px;
            border-radius: 8px;
            text-align: center;
        }
        
        .stat-number {
            font-size: 2em;
            font-weight: bold;
            color: #88ff00;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🗺️ Empire Zone Map</h1>
        <p>Your 300+ domain empire organized into discoverable game zones</p>
        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${zoneMap.total_domains}</div>
                <div>Total Domains</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${Object.keys(zoneMap.zones).length}</div>
                <div>Active Zones</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${Object.values(zoneMap.zones).reduce((sum, zone) => sum + zone.domain_count, 0)}</div>
                <div>Mapped Domains</div>
            </div>
        </div>
    </div>
    
    <div class="zone-grid">
        ${Object.entries(zoneMap.zones)
            .filter(([, zoneInfo]) => zoneInfo.domain_count > 0)
            .map(([zoneType, zoneInfo]) => `
                <div class="zone-card" style="border-color: ${zoneInfo.color}" onclick="exploreZone('${zoneType}')">
                    <div class="zone-header">
                        <div class="zone-emoji">${zoneInfo.emoji}</div>
                        <div class="zone-info">
                            <h3>${zoneInfo.name}</h3>
                        </div>
                    </div>
                    <div class="zone-description">${zoneInfo.description}</div>
                    <div class="domain-count">${zoneInfo.domain_count} domains</div>
                    <div class="domain-list">
                        ${zoneInfo.domains.map(domainInfo => `
                            <div class="domain-item">
                                <div class="domain-name">${domainInfo.domain}</div>
                                <div class="confidence-badge">${Math.round(domainInfo.confidence * 100)}%</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('')}
    </div>
    
    <div class="navigation">
        <h3>🎮 Zone Navigation Commands</h3>
        <p>Use these voice commands to navigate your empire:</p>
        <button class="nav-button" onclick="simulateCommand('What zone am I in?')">What zone am I in?</button>
        <button class="nav-button" onclick="simulateCommand('Show zone map')">Show zone map</button>
        <button class="nav-button" onclick="simulateCommand('Generate content for this zone')">Generate content for this zone</button>
        <button class="nav-button" onclick="simulateCommand('Warp to spawn zone')">Warp to spawn zone</button>
    </div>
    
    <script>
        function exploreZone(zoneType) {
            const zoneData = ${JSON.stringify(zoneMap.zones)};
            const zone = zoneData[zoneType];
            
            if (zone && zone.domains.length > 0) {
                const firstDomain = zone.domains[0].domain;
                if (firstDomain.includes('localhost') || firstDomain.includes('empire.local')) {
                    alert(\`Zone: \${zone.name}\\n\\nThis appears to be a local domain. In a real deployment, this would navigate to: \${firstDomain}\`);
                } else {
                    const confirmed = confirm(\`Navigate to \${zone.name}?\\n\\nThis will open: \${firstDomain}\`);
                    if (confirmed) {
                        window.open(\`http://\${firstDomain}\`, '_blank');
                    }
                }
            }
        }
        
        function simulateCommand(command) {
            alert(\`Voice Command: "\${command}"\\n\\nThis would be processed by your voice system and ARIA (local administrator AI) for contextual help based on your current zone.\`);
        }
        
        // Auto-update timestamp
        setInterval(() => {
            document.title = \`🗺️ Empire Zone Map - \${new Date().toLocaleTimeString()}\`;
        }, 1000);
    </script>
</body>
</html>`;
    }
    
    async run() {
        console.log('🚀 Starting Zone Mapper Tool...\n');
        
        try {
            await this.scanDomains();
            await this.categorizeDomains();
            await this.generateZoneMap();
            
            console.log('\n✅ Zone mapping complete!');
            console.log('\n🎯 Next steps:');
            console.log('   1. Open empire-zone-visualizer.html to see your zone map');
            console.log('   2. Update voice commands to use zone context');
            console.log('   3. Connect zones to content generation system');
            
        } catch (error) {
            console.error('❌ Zone mapping failed:', error);
            process.exit(1);
        }
    }
}

// Run if called directly
if (require.main === module) {
    const mapper = new ZoneMapperTool();
    mapper.run();
}

module.exports = ZoneMapperTool;