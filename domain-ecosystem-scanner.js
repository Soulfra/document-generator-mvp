#!/usr/bin/env node

/**
 * 🌐 DOMAIN ECOSYSTEM SCANNER
 * Maps your 300+ domain empire and catalogs existing functionality
 * Discovers particle effects, biometrics, railway systems, and more
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { exec } = require('child_process');
const EventEmitter = require('events');

class DomainEcosystemScanner extends EventEmitter {
    constructor() {
        super();
        
        this.domains = [
            // Core domains from your message
            'deathtodata.com',
            'soulfra.com',
            'soulfra.ai',
            'pimpmychrome.com',
            'shiprekt.com',
            'vcbash.com',
            'ycbash.com',
            'saveorsink.com',
            'dealordelete.com',
            'cringeproof.com',
            // Add more as we discover them
        ];
        
        this.discoveredDomains = new Set();
        this.domainData = new Map();
        this.functionality = new Map();
        
        // Gaming/system features to detect
        this.featurePatterns = {
            'particle_effects': [
                /particles?\.js/i,
                /three\.js/i,
                /particle.*system/i,
                /canvas.*particle/i,
                /\.particle/i
            ],
            'biometrics': [
                /biometric/i,
                /fingerprint/i,
                /face.*recognition/i,
                /auth.*bio/i,
                /webauthn/i
            ],
            'railway_system': [
                /railway/i,
                /conductor/i,
                /levitate/i,
                /train.*system/i,
                /axles?/i,
                /locomotive/i
            ],
            'sonar_system': [
                /sonar/i,
                /echo.*location/i,
                /ping.*system/i,
                /radar/i
            ],
            'gaming_ui': [
                /game.*interface/i,
                /rpg.*ui/i,
                /gaming.*layer/i,
                /arcade/i,
                /boss.*battle/i
            ],
            'color_coding': [
                /color.*code/i,
                /theme.*system/i,
                /palette/i,
                /hollowtown/i
            ],
            'music_system': [
                /music.*system/i,
                /audio.*spatial/i,
                /piano.*visual/i,
                /frequency.*bar/i,
                /spotify.*api/i
            ],
            'drag_drop': [
                /drag.*drop/i,
                /file.*upload/i,
                /drop.*zone/i,
                /draggable/i
            ],
            'tutorial_system': [
                /tutorial/i,
                /walkthrough/i,
                /onboarding/i,
                /guide.*system/i
            ],
            'debugging_tools': [
                /debug.*game/i,
                /error.*visualizer/i,
                /log.*analyzer/i,
                /troubleshoot/i
            ]
        };
        
        console.log(`🌐 Starting Domain Ecosystem Scanner...`);
        console.log(`📊 Scanning ${this.domains.length} initial domains for 300+ domain empire`);
    }
    
    async scanEcosystem() {
        console.log(`\n🔍 Phase 1: Discovering Domain Network...`);
        
        // Scan initial domains to discover more
        for (const domain of this.domains) {
            await this.scanDomain(domain);
        }
        
        // Look for domain references in local files
        await this.scanLocalFiles();
        
        // Generate ecosystem map
        await this.generateEcosystemMap();
        
        console.log(`\n✅ Ecosystem scan complete!`);
        console.log(`🏗️ Found ${this.discoveredDomains.size} total domains`);
        console.log(`⚙️ Cataloged ${this.functionality.size} functional systems`);
        
        return this.getEcosystemSummary();
    }
    
    async scanDomain(domain) {
        console.log(`🔍 Scanning ${domain}...`);
        
        try {
            const domainInfo = {
                domain,
                status: 'unknown',
                features: [],
                technologies: [],
                linkedDomains: [],
                apiEndpoints: [],
                files: {},
                lastScanned: new Date()
            };
            
            // Try to fetch main page
            const htmlContent = await this.fetchContent(domain, '/');
            if (htmlContent) {
                domainInfo.status = 'online';
                domainInfo.content = htmlContent;
                
                // Analyze HTML for features
                await this.analyzeHtmlContent(domainInfo, htmlContent);
                
                // Look for common files
                await this.scanCommonFiles(domainInfo);
            } else {
                domainInfo.status = 'offline';
            }
            
            this.domainData.set(domain, domainInfo);
            this.discoveredDomains.add(domain);
            
            // Extract linked domains
            if (htmlContent) {
                const linkedDomains = this.extractLinkedDomains(htmlContent);
                linkedDomains.forEach(d => {
                    if (!this.discoveredDomains.has(d)) {
                        this.domains.push(d);
                    }
                });
            }
            
            console.log(`✅ ${domain}: ${domainInfo.status} - ${domainInfo.features.length} features found`);
            
        } catch (error) {
            console.log(`❌ ${domain}: ${error.message}`);
            this.domainData.set(domain, {
                domain,
                status: 'error',
                error: error.message,
                lastScanned: new Date()
            });
        }
        
        // Respectful delay
        await this.sleep(1000);
    }
    
    async fetchContent(domain, path = '/') {
        return new Promise((resolve) => {
            const url = `https://${domain}${path}`;
            const timeout = 10000;
            
            const req = https.get(url, { timeout }, (res) => {
                let data = '';
                
                res.on('data', chunk => {
                    data += chunk;
                    // Limit response size
                    if (data.length > 100000) {
                        req.destroy();
                        resolve(data);
                    }
                });
                
                res.on('end', () => resolve(data));
            });
            
            req.on('error', () => resolve(null));
            req.on('timeout', () => {
                req.destroy();
                resolve(null);
            });
        });
    }
    
    async analyzeHtmlContent(domainInfo, html) {
        // Check for feature patterns
        for (const [feature, patterns] of Object.entries(this.featurePatterns)) {
            const found = patterns.some(pattern => pattern.test(html));
            if (found) {
                domainInfo.features.push(feature);
                
                if (!this.functionality.has(feature)) {
                    this.functionality.set(feature, []);
                }
                this.functionality.get(feature).push(domainInfo.domain);
            }
        }
        
        // Extract technologies
        const techPatterns = {
            'react': /react/i,
            'vue': /vue\.js/i,
            'angular': /angular/i,
            'nodejs': /node\.js|express/i,
            'wordpress': /wp-content|wordpress/i,
            'three.js': /three\.js/i,
            'websocket': /websocket|socket\.io/i,
            'webgl': /webgl/i,
            'electron': /electron/i
        };
        
        for (const [tech, pattern] of Object.entries(techPatterns)) {
            if (pattern.test(html)) {
                domainInfo.technologies.push(tech);
            }
        }
        
        // Look for API endpoints
        const apiMatches = html.match(/\/api\/[a-zA-Z0-9\/\-\_]+/g) || [];
        domainInfo.apiEndpoints = [...new Set(apiMatches)];
        
        // Check for gaming elements
        const gamingElements = [
            'boss-battle', 'power-up', 'level-system', 'score-tracker',
            'particle-system', 'sound-effect', 'music-visualizer'
        ];
        
        domainInfo.gamingElements = gamingElements.filter(element => 
            html.toLowerCase().includes(element.replace('-', ''))
        );
    }
    
    async scanCommonFiles(domainInfo) {
        const commonFiles = [
            '/package.json',
            '/manifest.json',
            '/robots.txt',
            '/sitemap.xml',
            '/api/health',
            '/api/status',
            '/.well-known/security.txt',
            '/js/main.js',
            '/js/app.js',
            '/css/style.css'
        ];
        
        for (const filePath of commonFiles) {
            const content = await this.fetchContent(domainInfo.domain, filePath);
            if (content && content.length > 0) {
                domainInfo.files[filePath] = {
                    size: content.length,
                    preview: content.substring(0, 200)
                };
            }
        }
    }
    
    extractLinkedDomains(html) {
        const domains = [];
        
        // Look for domain patterns
        const domainRegex = /https?:\/\/([a-zA-Z0-9\-]+\.(?:com|ai|net|org|io|co))/g;
        let match;
        
        while ((match = domainRegex.exec(html)) !== null) {
            const domain = match[1];
            if (!this.discoveredDomains.has(domain)) {
                domains.push(domain);
            }
        }
        
        return domains;
    }
    
    async scanLocalFiles() {
        console.log(`\n📁 Scanning local files for domain references...`);
        
        try {
            // Look for domains in local files
            const searchPaths = [
                '.',
                './CLAUDE*.md',
                './*.js',
                './*.json',
                './services',
                './FinishThisIdea*'
            ];
            
            for (const searchPath of searchPaths) {
                await this.scanPathForDomains(searchPath);
            }
            
        } catch (error) {
            console.log(`⚠️ Local file scan error: ${error.message}`);
        }
    }
    
    async scanPathForDomains(searchPath) {
        return new Promise((resolve) => {
            exec(`find ${searchPath} -type f \\( -name "*.js" -o -name "*.md" -o -name "*.json" \\) -exec grep -l "\\.[a-z]\\{2,4\\}/" {} \\; 2>/dev/null`, 
                (error, stdout) => {
                    if (stdout) {
                        const files = stdout.split('\n').filter(f => f);
                        files.forEach(file => this.extractDomainsFromFile(file));
                    }
                    resolve();
                }
            );
        });
    }
    
    extractDomainsFromFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const domains = this.extractLinkedDomains(content);
            
            domains.forEach(domain => {
                if (!this.discoveredDomains.has(domain)) {
                    this.domains.push(domain);
                    console.log(`📄 Found domain in ${filePath}: ${domain}`);
                }
            });
        } catch (error) {
            // Ignore file read errors
        }
    }
    
    async generateEcosystemMap() {
        console.log(`\n🗺️ Generating ecosystem map...`);
        
        const ecosystemMap = {
            totalDomains: this.discoveredDomains.size,
            onlineDomains: Array.from(this.domainData.values()).filter(d => d.status === 'online').length,
            features: Object.fromEntries(this.functionality),
            domainsByFeature: {},
            technologyDistribution: {},
            gamingDomains: [],
            apiDomains: [],
            lastUpdated: new Date().toISOString()
        };
        
        // Group domains by feature
        for (const [feature, domains] of this.functionality) {
            ecosystemMap.domainsByFeature[feature] = domains;
        }
        
        // Technology distribution
        const allTechs = [];
        this.domainData.forEach(domain => {
            if (domain.technologies) {
                allTechs.push(...domain.technologies);
            }
        });
        
        ecosystemMap.technologyDistribution = allTechs.reduce((acc, tech) => {
            acc[tech] = (acc[tech] || 0) + 1;
            return acc;
        }, {});
        
        // Gaming-specific domains
        this.domainData.forEach(domain => {
            if (domain.gamingElements && domain.gamingElements.length > 0) {
                ecosystemMap.gamingDomains.push({
                    domain: domain.domain,
                    elements: domain.gamingElements
                });
            }
            
            if (domain.apiEndpoints && domain.apiEndpoints.length > 0) {
                ecosystemMap.apiDomains.push({
                    domain: domain.domain,
                    endpoints: domain.apiEndpoints
                });
            }
        });
        
        // Save ecosystem map
        fs.writeFileSync(
            path.join(__dirname, 'ecosystem-map.json'), 
            JSON.stringify(ecosystemMap, null, 2)
        );
        
        // Generate human-readable report
        this.generateHumanReport(ecosystemMap);
    }
    
    generateHumanReport(ecosystemMap) {
        const report = `# 🌐 Domain Ecosystem Report
Generated: ${new Date().toLocaleString()}

## 📊 Overview
- **Total Domains**: ${ecosystemMap.totalDomains}
- **Online Domains**: ${ecosystemMap.onlineDomains}
- **Offline/Error Domains**: ${ecosystemMap.totalDomains - ecosystemMap.onlineDomains}

## 🎮 Gaming Features Found
${Object.entries(ecosystemMap.domainsByFeature).map(([feature, domains]) => 
    `### ${feature.replace(/_/g, ' ').toUpperCase()}\n${domains.map(d => `- ${d}`).join('\n')}`
).join('\n\n')}

## 🛠️ Technology Stack
${Object.entries(ecosystemMap.technologyDistribution)
    .sort(([,a], [,b]) => b - a)
    .map(([tech, count]) => `- **${tech}**: ${count} domains`)
    .join('\n')}

## 🎯 Gaming-Enabled Domains
${ecosystemMap.gamingDomains.map(d => 
    `- **${d.domain}**: ${d.elements.join(', ')}`
).join('\n')}

## 🔌 API-Enabled Domains
${ecosystemMap.apiDomains.map(d => 
    `- **${d.domain}**: ${d.endpoints.length} endpoints`
).join('\n')}

## 🚀 Next Steps
1. Connect all online domains via unified API gateway
2. Integrate gaming features across ecosystem
3. Build WordPress plugin using discovered patterns
4. Create browser extension for domain enhancement
5. Establish cross-domain authentication system

---
*Ecosystem Scanner v1.0 - Mapping the digital empire* 🏰
`;
        
        fs.writeFileSync(
            path.join(__dirname, 'ECOSYSTEM-REPORT.md'), 
            report
        );
        
        console.log(`📋 Human-readable report saved: ECOSYSTEM-REPORT.md`);
    }
    
    getEcosystemSummary() {
        return {
            totalDomains: this.discoveredDomains.size,
            onlineDomains: Array.from(this.domainData.values()).filter(d => d.status === 'online').length,
            features: Array.from(this.functionality.keys()),
            domains: Array.from(this.domainData.keys()),
            functionalDomains: Array.from(this.domainData.values())
                .filter(d => d.features && d.features.length > 0)
                .map(d => ({domain: d.domain, features: d.features}))
        };
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run scanner if called directly
if (require.main === module) {
    const scanner = new DomainEcosystemScanner();
    
    scanner.scanEcosystem()
        .then(summary => {
            console.log(`\n🎉 DOMAIN EMPIRE DISCOVERED!`);
            console.log(`🏗️ Total Domains: ${summary.totalDomains}`);
            console.log(`✅ Online: ${summary.onlineDomains}`);
            console.log(`⚙️ Features: ${summary.features.join(', ')}`);
            console.log(`\n📋 Full report saved to ECOSYSTEM-REPORT.md`);
            console.log(`📊 Raw data saved to ecosystem-map.json`);
        })
        .catch(error => {
            console.error('❌ Scanner failed:', error);
        });
}

module.exports = DomainEcosystemScanner;