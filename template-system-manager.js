#!/usr/bin/env node

// Template System Manager - Organizes template folders without Claude conflicts
// Uses kisuke, conductor, tunnel agents instead of claude directly

const fs = require('fs');
const path = require('path');

class TemplateSystemManager {
    constructor() {
        this.baseDir = __dirname;
        this.templateDirs = [
            'templates',
            'ai-os-clean/templates',
            'tier-3/templates',
            'FinishThisIdea/templates',
            'FinishThisIdea-archive/templates'
        ];
        
        this.agents = {
            kisuke: {
                specialty: 'template analysis and organization',
                priority: 1
            },
            conductor: {
                specialty: 'service orchestration and coordination',
                priority: 2
            },
            tunnel: {
                specialty: 'data pipeline and connectivity',
                priority: 3
            },
            vibevault: {
                specialty: 'pattern recognition and matching',
                priority: 4
            }
        };
        
        console.log('🎯 Template System Manager');
        console.log('📁 Organizing template directories...');
        console.log('🤖 Using agents: kisuke, conductor, tunnel, vibevault');
        console.log('⚠️  Avoiding Claude conflicts (using Claude Code CLI)\\n');
    }
    
    async organizeTemplates() {
        console.log('🔍 Scanning for template directories...');
        
        const templateInventory = await this.scanTemplateDirectories();
        console.log(`📊 Found ${templateInventory.length} template locations\\n`);
        
        console.log('🎯 Template Inventory:');
        templateInventory.forEach((item, index) => {
            console.log(`   ${index + 1}. ${item.path} (${item.count} templates)`);
        });
        
        console.log('\\n🔧 Creating unified template system...');
        await this.createUnifiedSystem(templateInventory);
        
        console.log('\\n🔗 Setting up symlinks...');
        await this.setupSymlinks();
        
        console.log('\\n📋 Creating template registry...');
        await this.createTemplateRegistry(templateInventory);
        
        console.log('\\n✅ Template system organization complete!');
        this.showUsageInstructions();
    }
    
    async scanTemplateDirectories() {
        const inventory = [];
        
        for (const templateDir of this.templateDirs) {
            const fullPath = path.join(this.baseDir, templateDir);
            
            if (fs.existsSync(fullPath)) {
                const stats = await this.analyzeTemplateDirectory(fullPath);
                inventory.push({
                    path: templateDir,
                    fullPath: fullPath,
                    count: stats.templateCount,
                    types: stats.templateTypes,
                    agent: this.selectAgent(stats)
                });
            }
        }
        
        return inventory;
    }
    
    async analyzeTemplateDirectory(dirPath) {
        const stats = {
            templateCount: 0,
            templateTypes: [],
            patterns: []
        };
        
        try {
            const items = fs.readdirSync(dirPath, { withFileTypes: true });
            
            for (const item of items) {
                if (item.isDirectory()) {
                    stats.templateCount++;
                    stats.templateTypes.push(item.name);
                }
            }
        } catch (error) {
            console.log(`   ⚠️  Warning: Could not analyze ${dirPath}: ${error.message}`);
        }
        
        return stats;
    }
    
    selectAgent(stats) {
        // Use kisuke for template analysis
        if (stats.templateCount > 5) return 'kisuke';
        
        // Use conductor for service templates
        if (stats.templateTypes.some(type => type.includes('service'))) return 'conductor';
        
        // Use tunnel for data/pipeline templates
        if (stats.templateTypes.some(type => type.includes('data') || type.includes('pipeline'))) return 'tunnel';
        
        // Use vibevault for pattern-based templates
        return 'vibevault';
    }
    
    async createUnifiedSystem(inventory) {
        const unifiedDir = path.join(this.baseDir, 'unified-templates');
        
        if (!fs.existsSync(unifiedDir)) {
            fs.mkdirSync(unifiedDir, { recursive: true });
        }
        
        // Create agent-specific directories
        Object.keys(this.agents).forEach(agentName => {
            const agentDir = path.join(unifiedDir, agentName);
            if (!fs.existsSync(agentDir)) {
                fs.mkdirSync(agentDir, { recursive: true });
            }
        });
        
        console.log('   📁 Created unified-templates structure');
        console.log('   🤖 Created agent-specific directories');
    }
    
    async setupSymlinks() {
        const symlinkScript = `#!/bin/bash
# Auto-generated symlink setup for template system
# Avoids Claude conflicts by using separate namespace

echo "🔗 Setting up template symlinks..."

# Create main symlinks directory
mkdir -p symlinks

# Link to kisuke templates (analysis and organization)
ln -sf ../FinishThisIdea/templates symlinks/kisuke-templates
ln -sf ../ai-os-clean/templates symlinks/kisuke-patterns

# Link to conductor templates (service orchestration)  
ln -sf ../templates symlinks/conductor-services
ln -sf ../tier-3/templates symlinks/conductor-tier3

# Link to tunnel templates (data pipelines)
ln -sf ../FinishThisIdea-archive/templates symlinks/tunnel-archive
ln -sf ../mcp symlinks/tunnel-mcp

# Link to vibevault templates (pattern recognition)
ln -sf ../finishthisidea-worktrees symlinks/vibevault-worktrees

echo "✅ Symlink setup complete"
echo "🎯 Templates available via symlinks/ directory"
`;
        
        fs.writeFileSync(path.join(this.baseDir, 'setup-template-symlinks.sh'), symlinkScript);
        fs.chmodSync(path.join(this.baseDir, 'setup-template-symlinks.sh'), '755');
        
        console.log('   📝 Created setup-template-symlinks.sh');
    }
    
    async createTemplateRegistry(inventory) {
        const registry = {
            version: '1.0.0',
            generated: new Date().toISOString(),
            system: 'document-generator-templates',
            agents: this.agents,
            templates: {},
            symlinks: {
                'kisuke-templates': 'FinishThisIdea/templates',
                'kisuke-patterns': 'ai-os-clean/templates', 
                'conductor-services': 'templates',
                'conductor-tier3': 'tier-3/templates',
                'tunnel-archive': 'FinishThisIdea-archive/templates',
                'tunnel-mcp': 'mcp',
                'vibevault-worktrees': 'finishthisidea-worktrees'
            },
            usage: {
                verification: 'node template-system-manager.js verify',
                list: 'node template-system-manager.js list',
                agent: 'node template-system-manager.js agent <name>',
                symlink: './setup-template-symlinks.sh'
            }
        };
        
        // Add template details for each agent
        inventory.forEach(item => {
            if (!registry.templates[item.agent]) {
                registry.templates[item.agent] = [];
            }
            
            registry.templates[item.agent].push({
                path: item.path,
                count: item.count,
                types: item.types
            });
        });
        
        fs.writeFileSync(
            path.join(this.baseDir, 'template-registry.json'), 
            JSON.stringify(registry, null, 2)
        );
        
        console.log('   📋 Created template-registry.json');
        console.log(`   🤖 Registered ${Object.keys(registry.templates).length} agents`);
    }
    
    showUsageInstructions() {
        console.log('\\n🎯 TEMPLATE SYSTEM READY');
        console.log('========================\\n');
        
        console.log('📋 Quick Commands:');
        console.log('   ./setup-template-symlinks.sh    # Create all symlinks');
        console.log('   node template-system-manager.js verify  # Verify system');
        console.log('   node template-system-manager.js list    # List all templates');
        console.log('');
        
        console.log('🤖 Agent Access:');
        console.log('   kisuke:     symlinks/kisuke-templates/');
        console.log('   conductor:  symlinks/conductor-services/');
        console.log('   tunnel:     symlinks/tunnel-mcp/');
        console.log('   vibevault:  symlinks/vibevault-worktrees/');
        console.log('');
        
        console.log('🔗 RPC to NPC Integration:');
        console.log('   Templates available via symlinks (no direct conflicts)');
        console.log('   Agents handle specific template types');
        console.log('   Registry tracks all template locations');
        console.log('');
        
        console.log('⚠️  Note: Avoids Claude namespace conflicts');
        console.log('   Using kisuke/conductor/tunnel/vibevault agents instead');
    }
    
    async verifySystem() {
        console.log('🔍 Verifying template system...');
        
        // Check registry exists
        const registryPath = path.join(this.baseDir, 'template-registry.json');
        if (!fs.existsSync(registryPath)) {
            console.log('❌ Template registry not found');
            return false;
        }
        
        const registry = JSON.parse(fs.readFileSync(registryPath));
        console.log(`✅ Registry loaded (${Object.keys(registry.templates).length} agents)`);
        
        // Check symlinks
        let symlinkCount = 0;
        const symlinksDir = path.join(this.baseDir, 'symlinks');
        if (fs.existsSync(symlinksDir)) {
            const symlinks = fs.readdirSync(symlinksDir);
            symlinkCount = symlinks.length;
            console.log(`✅ Symlinks directory (${symlinkCount} links)`);
        } else {
            console.log('⚠️  Symlinks directory not found - run ./setup-template-symlinks.sh');
        }
        
        // Check agent directories
        const unifiedDir = path.join(this.baseDir, 'unified-templates');
        if (fs.existsSync(unifiedDir)) {
            const agentDirs = fs.readdirSync(unifiedDir);
            console.log(`✅ Unified templates (${agentDirs.length} agent directories)`);
        } else {
            console.log('⚠️  Unified templates directory not found');
        }
        
        console.log('\\n📊 System Status: OPERATIONAL');
        return true;
    }
    
    async listTemplates() {
        const registryPath = path.join(this.baseDir, 'template-registry.json');
        if (!fs.existsSync(registryPath)) {
            console.log('❌ Template registry not found - run organize first');
            return;
        }
        
        const registry = JSON.parse(fs.readFileSync(registryPath));
        
        console.log('📋 TEMPLATE INVENTORY');
        console.log('====================\\n');
        
        Object.entries(registry.templates).forEach(([agent, templates]) => {
            console.log(`🤖 ${agent.toUpperCase()} Agent:`);
            templates.forEach(template => {
                console.log(`   📁 ${template.path} (${template.count} templates)`);
                template.types.forEach(type => {
                    console.log(`      - ${type}`);
                });
            });
            console.log('');
        });
        
        console.log('🔗 Symlink Access:');
        Object.entries(registry.symlinks).forEach(([link, target]) => {
            console.log(`   symlinks/${link} → ${target}`);
        });
    }
}

// CLI handling
if (require.main === module) {
    const manager = new TemplateSystemManager();
    const command = process.argv[2];
    
    switch (command) {
        case 'verify':
            manager.verifySystem();
            break;
        case 'list':
            manager.listTemplates();
            break;
        case 'agent':
            const agentName = process.argv[3];
            if (agentName) {
                console.log(`🤖 ${agentName.toUpperCase()} Agent Templates:`);
                console.log(`   Access via: symlinks/${agentName}-*/`);
            } else {
                console.log('❌ Specify agent name: kisuke, conductor, tunnel, vibevault');
            }
            break;
        default:
            manager.organizeTemplates();
    }
}

module.exports = TemplateSystemManager;