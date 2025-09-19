#!/usr/bin/env node

/**
 * 🎭 CHARACTER-DOCUMENTATION INTEGRATION SYSTEM
 * 
 * Links characters to their documentation domains, components, and brand personalities.
 * Creates the bridge between the existing character system and reproducible documentation.
 * 
 * Features:
 * - Character ownership of components and docs
 * - Brand personality integration  
 * - Navigation between related systems
 * - Chat interface routing to appropriate specialists
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Import existing character system
const UnifiedCharacterDatabase = require('./UNIFIED-CHARACTER-DATABASE.js');

class CharacterDocumentationIntegration {
    constructor() {
        this.characterDB = new UnifiedCharacterDatabase();
        
        // Character-to-domain mappings
        this.domainMappings = new Map();
        
        // Component ownership registry
        this.componentOwnership = new Map();
        
        // Documentation hierarchy
        this.docHierarchy = new Map();
        
        // Brand personalities with chat capabilities
        this.brandPersonalities = new Map();
        
        this.initializeDomainMappings();
        this.initializeBrandPersonalities();
    }
    
    initializeDomainMappings() {
        // Core platform characters with their domains
        this.domainMappings.set('DeathToData', {
            domain: 'privacy-security',
            components: ['vault-systems', 'encryption', 'data-destruction', 'privacy-tools'],
            documentation: ['privacy-policy', 'security-architecture', 'data-handling'],
            chatPersonality: 'privacy-focused-specialist',
            brandGuidelines: 'minimalist-security-first',
            color: '#FF4444',
            expertise: ['Privacy Engineering', 'Data Destruction', 'Vault Systems', 'Encryption']
        });
        
        this.domainMappings.set('FrontendWarrior', {
            domain: 'ui-ux-design',
            components: ['react-components', 'design-system', 'user-interfaces', 'mobile-responsive'],
            documentation: ['component-library', 'design-guidelines', 'user-experience'],
            chatPersonality: 'design-system-expert',
            brandGuidelines: 'clean-modern-accessible',
            color: '#00AA44',
            expertise: ['React/Vue/Angular', 'Design Systems', 'Accessibility', 'Mobile UX']
        });
        
        this.domainMappings.set('BackendBeast', {
            domain: 'server-architecture',
            components: ['apis', 'databases', 'microservices', 'infrastructure'],
            documentation: ['api-reference', 'database-schema', 'deployment-guides'],
            chatPersonality: 'architecture-specialist',
            brandGuidelines: 'robust-scalable-reliable',
            color: '#4444FF',
            expertise: ['Node.js/Python/Go', 'Database Design', 'API Architecture', 'DevOps']
        });
        
        this.domainMappings.set('IntegrationNinja', {
            domain: 'integration-apis',
            components: ['webhooks', 'third-party-apis', 'service-mesh', 'middleware'],
            documentation: ['integration-guides', 'api-documentation', 'webhook-handling'],
            chatPersonality: 'integration-specialist',
            brandGuidelines: 'seamless-connectivity',
            color: '#FF8800',
            expertise: ['API Integration', 'Webhooks', 'Service Mesh', 'Third-party SDKs']
        });
        
        this.domainMappings.set('DebugDetective', {
            domain: 'testing-debugging',
            components: ['test-suites', 'debugging-tools', 'monitoring', 'error-handling'],
            documentation: ['testing-strategies', 'debugging-guides', 'monitoring-setup'],
            chatPersonality: 'troubleshooting-expert',
            brandGuidelines: 'thorough-methodical-precise',
            color: '#8800FF',
            expertise: ['Unit/Integration Testing', 'Debugging', 'Performance Monitoring', 'Error Analysis']
        });
        
        this.domainMappings.set('BlameChain', {
            domain: 'accountability-audit',
            components: ['audit-trails', 'component-registry', 'karma-tracking', 'consensus'],
            documentation: ['accountability-framework', 'audit-procedures', 'component-registry'],
            chatPersonality: 'accountability-enforcer',
            brandGuidelines: 'transparent-fair-immutable',
            color: '#FF00FF',
            expertise: ['Audit Systems', 'Accountability', 'Component Tracking', 'Consensus Mechanisms']
        });
    }
    
    initializeBrandPersonalities() {
        // Each character gets a unique chat personality
        this.brandPersonalities.set('DeathToData', {
            name: 'DeathToData',
            greeting: "🔒 Privacy first, questions later. What data needs to disappear?",
            style: 'direct-security-focused',
            catchphrases: [
                "Data is toxic waste - let's incinerate it properly",
                "Privacy by design, security by default",
                "If you can't delete it, you don't own it"
            ],
            responseTemplates: {
                explanation: "Here's how we handle {topic} with military-grade security...",
                recommendation: "For maximum privacy, I recommend...",
                warning: "⚠️ PRIVACY RISK: This approach exposes..."
            },
            ownedComponents: []
        });
        
        this.brandPersonalities.set('FrontendWarrior', {
            name: 'FrontendWarrior',
            greeting: "⚔️ Ready to battle bad UX! What interface needs conquering?",
            style: 'enthusiastic-design-focused',
            catchphrases: [
                "User experience is the ultimate battleground",
                "Clean code, cleaner interfaces",
                "Accessibility isn't optional - it's armor"
            ],
            responseTemplates: {
                explanation: "Let's craft a {topic} that users will love...",
                recommendation: "For the best UX, we should...", 
                warning: "🎨 UX ALERT: This pattern might confuse users..."
            },
            ownedComponents: []
        });
        
        this.brandPersonalities.set('BackendBeast', {
            name: 'BackendBeast',
            greeting: "🐉 Server architectures are my domain. What system needs scaling?",
            style: 'powerful-technical-focused',
            catchphrases: [
                "Scale first, optimize later",
                "If it can break, it will break - plan accordingly",
                "Databases don't lie, but APIs might"
            ],
            responseTemplates: {
                explanation: "The {topic} architecture should be built like...",
                recommendation: "For production scale, implement...",
                warning: "⚡ PERFORMANCE WARNING: This approach will..."
            },
            ownedComponents: []
        });
        
        this.brandPersonalities.set('IntegrationNinja', {
            name: 'IntegrationNinja',
            greeting: "🥷 Silent connections, seamless integrations. What needs linking?",
            style: 'stealthy-connector-focused',
            catchphrases: [
                "The best integrations are invisible",
                "APIs are promises - webhooks are proof",
                "One service to rule them all"
            ],
            responseTemplates: {
                explanation: "The {topic} integration flows like...",
                recommendation: "To connect these systems seamlessly...",
                warning: "🔗 INTEGRATION RISK: This coupling could..."
            },
            ownedComponents: []
        });
        
        this.brandPersonalities.set('DebugDetective', {
            name: 'DebugDetective',
            greeting: "🕵️ Every bug leaves clues. What mystery needs solving?",
            style: 'methodical-investigation-focused',
            catchphrases: [
                "The answer is always in the logs",
                "Test everything, assume nothing",
                "Every failure is a teacher in disguise"
            ],
            responseTemplates: {
                explanation: "To investigate {topic}, we follow these clues...",
                recommendation: "The evidence points to implementing...",
                warning: "🐛 BUG ALERT: This code pattern often causes..."
            },
            ownedComponents: []
        });
        
        this.brandPersonalities.set('BlameChain', {
            name: 'BlameChain',
            greeting: "⚖️ Justice through accountability. What needs auditing?",
            style: 'fair-accountability-focused',
            catchphrases: [
                "Every action has consequences",
                "Blame correctly assigned is progress earned",
                "Transparency is the foundation of trust"
            ],
            responseTemplates: {
                explanation: "The {topic} accountability chain works by...",
                recommendation: "For proper attribution, establish...",
                warning: "⚖️ ACCOUNTABILITY GAP: This lacks proper..."
            },
            ownedComponents: []
        });
    }
    
    async scanComponentOwnership() {
        console.log('🔍 Scanning component ownership...');
        
        // Scan for existing components and assign ownership
        const projectRoot = __dirname;
        const componentsFound = new Map();
        
        try {
            // Scan for JavaScript files
            const files = await this.recursiveFileScan(projectRoot, /\.(js|jsx|ts|tsx|md)$/);
            
            for (const file of files) {
                await this.analyzeFileOwnership(file, componentsFound);
            }
            
            // Update character ownership
            for (const [character, components] of componentsFound) {
                const personality = this.brandPersonalities.get(character);
                if (personality) {
                    personality.ownedComponents = components;
                    console.log(`📋 ${character}: ${components.length} components`);
                }
            }
            
        } catch (error) {
            console.error('❌ Component scan error:', error);
        }
        
        return componentsFound;
    }
    
    async analyzeFileOwnership(filePath, componentsFound) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const fileName = path.basename(filePath);
            
            // Analyze file content for character ownership
            for (const [character, domain] of this.domainMappings) {
                const keywords = [
                    ...domain.components,
                    ...domain.expertise.map(e => e.toLowerCase()),
                    character.toLowerCase()
                ];
                
                const matches = keywords.filter(keyword => 
                    content.toLowerCase().includes(keyword) || 
                    fileName.toLowerCase().includes(keyword)
                );
                
                if (matches.length >= 2) { // Threshold for ownership
                    if (!componentsFound.has(character)) {
                        componentsFound.set(character, []);
                    }
                    
                    componentsFound.get(character).push({
                        file: filePath,
                        component: fileName.replace(/\.(js|jsx|ts|tsx|md)$/, ''),
                        matches: matches,
                        confidence: matches.length / keywords.length
                    });
                }
            }
            
        } catch (error) {
            // Skip files that can't be read
        }
    }
    
    async recursiveFileScan(dir, pattern) {
        const results = [];
        
        try {
            const items = await fs.readdir(dir);
            
            for (const item of items) {
                const fullPath = path.join(dir, item);
                
                // Skip node_modules, .git, etc.
                if (item.startsWith('.') || item === 'node_modules') {
                    continue;
                }
                
                try {
                    const stat = await fs.stat(fullPath);
                    
                    if (stat.isDirectory()) {
                        const subResults = await this.recursiveFileScan(fullPath, pattern);
                        results.push(...subResults);
                    } else if (pattern.test(item)) {
                        results.push(fullPath);
                    }
                } catch (error) {
                    // Skip inaccessible files
                }
            }
        } catch (error) {
            // Skip inaccessible directories
        }
        
        return results;
    }
    
    getCharacterByDomain(domain) {
        for (const [character, mapping] of this.domainMappings) {
            if (mapping.domain === domain) {
                return character;
            }
        }
        return null;
    }
    
    getCharacterComponents(characterName) {
        const personality = this.brandPersonalities.get(characterName);
        return personality ? personality.ownedComponents : [];
    }
    
    getCharacterChatInterface(characterName) {
        const personality = this.brandPersonalities.get(characterName);
        const domain = this.domainMappings.get(characterName);
        
        if (!personality || !domain) {
            return null;
        }
        
        return {
            character: characterName,
            personality: personality,
            domain: domain,
            chatEndpoint: `/chat/${characterName.toLowerCase()}`,
            components: personality.ownedComponents || [],
            navigation: {
                relatedDocs: domain.documentation,
                relatedComponents: domain.components,
                expertise: domain.expertise
            }
        };
    }
    
    generateNavigationMap() {
        const navigationMap = {
            characters: {},
            crossReferences: {},
            brandIndex: {}
        };
        
        for (const [character, domain] of this.domainMappings) {
            const personality = this.brandPersonalities.get(character);
            
            navigationMap.characters[character] = {
                domain: domain.domain,
                color: domain.color,
                components: personality?.ownedComponents || [],
                documentation: domain.documentation,
                chatEndpoint: `/chat/${character.toLowerCase()}`,
                expertise: domain.expertise
            };
            
            // Build cross-references
            for (const component of domain.components) {
                if (!navigationMap.crossReferences[component]) {
                    navigationMap.crossReferences[component] = [];
                }
                navigationMap.crossReferences[component].push(character);
            }
        }
        
        return navigationMap;
    }
    
    async generateARDDocumentation(characterName) {
        const domain = this.domainMappings.get(characterName);
        const personality = this.brandPersonalities.get(characterName);
        
        if (!domain || !personality) {
            throw new Error(`Character ${characterName} not found`);
        }
        
        const ardContent = `# ${characterName}: ${domain.domain} Architecture Requirements

## ⚡ Character Profile

**Character Name**: ${characterName}  
**Domain**: ${domain.domain}  
**Brand Color**: ${domain.color}  
**Chat Style**: ${personality.style}  

## 📊 Domain Stats

### Expertise Areas
${domain.expertise.map(area => `- **${area}**: Core competency`).join('\n')}

### Owned Components
${domain.components.map(comp => `- \`${comp}\`: Primary responsibility`).join('\n')}

### Documentation Ownership
${domain.documentation.map(doc => `- ${doc}: Maintained and updated`).join('\n')}

## 💬 Chat Interface

**Greeting**: ${personality.greeting}

**Catchphrases**:
${personality.catchphrases.map(phrase => `- "${phrase}"`).join('\n')}

**Response Templates**:
- **Explanation**: ${personality.responseTemplates.explanation}
- **Recommendation**: ${personality.responseTemplates.recommendation}  
- **Warning**: ${personality.responseTemplates.warning}

## 🔗 Navigation

**Chat Endpoint**: \`/chat/${characterName.toLowerCase()}\`

**Related Characters**:
${Array.from(this.domainMappings.keys())
    .filter(char => char !== characterName)
    .map(char => `- [${char}](/chat/${char.toLowerCase()}) - ${this.domainMappings.get(char).domain}`)
    .join('\n')}

## 🎯 Component Responsibilities

${personality.ownedComponents?.map(comp => `
### ${comp.component}
- **File**: \`${comp.file}\`
- **Confidence**: ${Math.round(comp.confidence * 100)}%
- **Keywords**: ${comp.matches.join(', ')}
`).join('\n') || 'Components will be populated after scanning...'}

## 🏗️ Architecture Guidelines

### Brand Principles: ${domain.brandGuidelines}

1. **Design Philosophy**: Aligned with ${characterName} values
2. **Technical Standards**: ${domain.expertise.join(', ')} best practices
3. **Integration Points**: Compatible with related characters
4. **Quality Gates**: Component-specific validation rules

## 📋 Documentation Index

${domain.documentation.map(doc => `- [${doc}](./docs/${domain.domain}/${doc}.md)`).join('\n')}

---

*Generated by Character-Documentation Integration System*  
*Last updated: ${new Date().toISOString()}*
`;
        
        return ardContent;
    }
    
    async initializeSystem() {
        console.log('🚀 Initializing Character-Documentation Integration...');
        
        // Scan component ownership
        const components = await this.scanComponentOwnership();
        console.log(`📋 Found ${components.size} character domains with components`);
        
        // Generate navigation map
        const navigation = this.generateNavigationMap();
        console.log(`🗺️ Generated navigation for ${Object.keys(navigation.characters).length} characters`);
        
        // Create ARD documentation directory
        const ardDir = path.join(__dirname, 'ARD-CHARACTER-SHEETS');
        try {
            await fs.mkdir(ardDir, { recursive: true });
            
            // Generate ARD documentation for each character
            for (const character of this.domainMappings.keys()) {
                const ardContent = await this.generateARDDocumentation(character);
                const ardFile = path.join(ardDir, `${character}-ARD.md`);
                await fs.writeFile(ardFile, ardContent);
                console.log(`📄 Generated ARD: ${character}-ARD.md`);
            }
            
        } catch (error) {
            console.error('❌ ARD generation error:', error);
        }
        
        // Save navigation map
        try {
            const navFile = path.join(__dirname, 'character-navigation-map.json');
            await fs.writeFile(navFile, JSON.stringify(navigation, null, 2));
            console.log('🗺️ Saved navigation map');
        } catch (error) {
            console.error('❌ Navigation save error:', error);
        }
        
        return {
            characters: this.domainMappings.size,
            components: Array.from(components.values()).reduce((total, comps) => total + comps.length, 0),
            navigation: navigation,
            ardGenerated: this.domainMappings.size
        };
    }
    
    // API for integration with existing systems
    getCharacterInfo(characterName) {
        return {
            domain: this.domainMappings.get(characterName),
            personality: this.brandPersonalities.get(characterName),
            chatInterface: this.getCharacterChatInterface(characterName)
        };
    }
    
    getAllCharacters() {
        return Array.from(this.domainMappings.keys()).map(char => this.getCharacterInfo(char));
    }
}

// Export for integration with existing systems
module.exports = CharacterDocumentationIntegration;

// CLI interface
if (require.main === module) {
    const integration = new CharacterDocumentationIntegration();
    
    integration.initializeSystem().then(result => {
        console.log('\n🎉 CHARACTER-DOCUMENTATION INTEGRATION COMPLETE!');
        console.log('==========================================');
        console.log(`✅ Characters: ${result.characters}`);
        console.log(`✅ Components: ${result.components}`);
        console.log(`✅ ARD Docs: ${result.ardGenerated}`);
        console.log('');
        console.log('🔗 Next Steps:');
        console.log('1. Check ARD-CHARACTER-SHEETS/ for documentation');
        console.log('2. Review character-navigation-map.json');
        console.log('3. Run brand-personality-chat.js for chat interfaces');
        console.log('');
        
    }).catch(error => {
        console.error('❌ Integration failed:', error);
        process.exit(1);
    });
}