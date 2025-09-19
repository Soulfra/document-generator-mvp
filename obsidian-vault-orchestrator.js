#!/usr/bin/env node
/**
 * 🗂️ OBSIDIAN VAULT ORCHESTRATOR
 * 
 * Automatically organizes all project files into a proper Obsidian vault
 * with tiered categorization, scaffolding, and symlinks.
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class ObsidianVaultOrchestrator {
    constructor() {
        this.vaultPath = path.join(__dirname, 'ObsidianVault');
        this.projectRoot = __dirname;
        
        // File categorization rules
        this.categories = {
            '00-Index': {
                description: 'Auto-generated indexes and maps',
                pattern: null, // Generated files only
                priority: 0
            },
            '01-Core-Systems': {
                description: 'Working systems with actual functionality',
                pattern: /(server|service|api|mcp|template-processor).*\.(js|ts)$/i,
                priority: 1
            },
            '02-Documentation': {
                description: 'All documentation and markdown files',
                pattern: /\.(md|markdown)$/i,
                priority: 2
            },
            '03-Architectures': {
                description: 'Ring, Layer, and architectural systems',
                pattern: /(ring|layer|architecture|tier).*\.(js|md)$/i,
                priority: 3
            },
            '04-Generators': {
                description: 'All generators, routers, and orchestrators',
                pattern: /(generator|router|orchestrator|engine).*\.js$/i,
                priority: 4
            },
            '05-Integrations': {
                description: 'External integrations and APIs',
                pattern: /(integration|api|bridge|connector|adapter).*\.js$/i,
                priority: 5
            },
            '06-Infrastructure': {
                description: 'Docker, deployment, and infrastructure',
                pattern: /(docker|dockerfile|compose|deploy|k8s|nginx)/i,
                priority: 6
            },
            '07-Gaming-Systems': {
                description: 'Gaming and character systems',
                pattern: /(game|gaming|character|player|npc).*\.js$/i,
                priority: 7
            },
            '08-Blockchain-Crypto': {
                description: 'Blockchain and crypto systems',
                pattern: /(blockchain|crypto|wallet|token|chain).*\.js$/i,
                priority: 8
            },
            '09-AI-Systems': {
                description: 'AI and LLM related systems',
                pattern: /(ai|llm|gpt|claude|anthropic|openai).*\.js$/i,
                priority: 9
            },
            '10-Theoretical': {
                description: 'Universal and theoretical systems',
                pattern: /(universal|unified|ultimate|meta|infinite).*\.js$/i,
                priority: 10
            },
            '11-Archive': {
                description: 'Backup and deprecated files',
                pattern: /(backup|archive|old|deprecated|test)/i,
                priority: 11
            },
            '99-Uncategorized': {
                description: 'Files that don\'t fit other categories',
                pattern: null, // Catch-all
                priority: 99
            }
        };
        
        this.fileDatabase = new Map();
        this.relationships = new Map();
        this.stats = {
            totalFiles: 0,
            categorized: {},
            errors: []
        };
    }
    
    /**
     * Main orchestration function
     */
    async orchestrate() {
        console.log('🗂️  Starting Obsidian Vault Orchestration...\n');
        
        try {
            // 1. Create vault structure
            await this.createVaultStructure();
            
            // 2. Scan all files
            await this.scanProjectFiles();
            
            // 3. Categorize files
            await this.categorizeFiles();
            
            // 4. Create symlinks
            await this.createSymlinks();
            
            // 5. Generate indexes and MOCs
            await this.generateIndexes();
            
            // 6. Create relationship graph
            await this.generateRelationshipGraph();
            
            // 7. Generate vault configuration
            await this.generateVaultConfig();
            
            // 8. Create simplified infrastructure
            await this.createSimplifiedInfrastructure();
            
            // Display results
            this.displayResults();
            
        } catch (error) {
            console.error('❌ Orchestration failed:', error);
            process.exit(1);
        }
    }
    
    /**
     * Create vault directory structure
     */
    async createVaultStructure() {
        console.log('📁 Creating vault structure...');
        
        // Create main vault directory
        await fs.mkdir(this.vaultPath, { recursive: true });
        
        // Create category directories
        for (const [category, config] of Object.entries(this.categories)) {
            const categoryPath = path.join(this.vaultPath, category);
            await fs.mkdir(categoryPath, { recursive: true });
            
            // Create category README
            const readme = `# ${category}

${config.description}

## Contents

This directory will contain files automatically categorized by the Obsidian Vault Orchestrator.

## Navigation

- [[00-Index/Master-Index|Master Index]]
- [[00-Index/Category-Map|Category Map]]
- [[99-Meta/Relationships|Relationship Graph]]

---
*Auto-generated by Obsidian Vault Orchestrator*`;
            
            await fs.writeFile(path.join(categoryPath, 'README.md'), readme);
        }
        
        console.log('✅ Vault structure created\n');
    }
    
    /**
     * Scan all project files
     */
    async scanProjectFiles(dir = this.projectRoot, level = 0) {
        if (level === 0) {
            console.log('🔍 Scanning project files...');
        }
        
        // Skip certain directories
        const skipDirs = ['node_modules', '.git', 'ObsidianVault', '.vault', 'dist', 'build'];
        
        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                const relativePath = path.relative(this.projectRoot, fullPath);
                
                if (entry.isDirectory()) {
                    if (!skipDirs.includes(entry.name) && level < 3) {
                        await this.scanProjectFiles(fullPath, level + 1);
                    }
                } else if (entry.isFile()) {
                    // Store file information
                    this.fileDatabase.set(relativePath, {
                        name: entry.name,
                        path: fullPath,
                        relativePath,
                        size: (await fs.stat(fullPath)).size,
                        category: null,
                        links: [],
                        backlinks: [],
                        hash: await this.getFileHash(fullPath)
                    });
                    
                    this.stats.totalFiles++;
                }
            }
        } catch (error) {
            this.stats.errors.push(`Error scanning ${dir}: ${error.message}`);
        }
        
        if (level === 0) {
            console.log(`✅ Found ${this.stats.totalFiles} files\n`);
        }
    }
    
    /**
     * Categorize all files
     */
    async categorizeFiles() {
        console.log('📊 Categorizing files...');
        
        for (const [relativePath, fileInfo] of this.fileDatabase) {
            let categorized = false;
            
            // Try to match against category patterns
            for (const [category, config] of Object.entries(this.categories)) {
                if (config.pattern && config.pattern.test(relativePath)) {
                    fileInfo.category = category;
                    categorized = true;
                    
                    // Update stats
                    if (!this.stats.categorized[category]) {
                        this.stats.categorized[category] = 0;
                    }
                    this.stats.categorized[category]++;
                    
                    break;
                }
            }
            
            // If not categorized, put in uncategorized
            if (!categorized) {
                fileInfo.category = '99-Uncategorized';
                if (!this.stats.categorized['99-Uncategorized']) {
                    this.stats.categorized['99-Uncategorized'] = 0;
                }
                this.stats.categorized['99-Uncategorized']++;
            }
        }
        
        console.log('✅ Files categorized\n');
    }
    
    /**
     * Create symlinks for all files
     */
    async createSymlinks() {
        console.log('🔗 Creating symlinks...');
        
        for (const [relativePath, fileInfo] of this.fileDatabase) {
            const targetPath = path.join(this.vaultPath, fileInfo.category, fileInfo.name);
            
            try {
                // Check if symlink already exists
                try {
                    await fs.lstat(targetPath);
                    await fs.unlink(targetPath); // Remove existing symlink
                } catch {}
                
                // Create symlink
                await fs.symlink(fileInfo.path, targetPath);
                
                // For markdown files, also scan for links
                if (fileInfo.name.endsWith('.md')) {
                    await this.scanFileLinks(fileInfo);
                }
            } catch (error) {
                this.stats.errors.push(`Failed to create symlink for ${relativePath}: ${error.message}`);
            }
        }
        
        console.log('✅ Symlinks created\n');
    }
    
    /**
     * Scan file for Obsidian-style links
     */
    async scanFileLinks(fileInfo) {
        try {
            const content = await fs.readFile(fileInfo.path, 'utf-8');
            const linkPattern = /\[\[([^\]]+)\]\]/g;
            let match;
            
            while ((match = linkPattern.exec(content)) !== null) {
                const linkTarget = match[1];
                fileInfo.links.push(linkTarget);
                
                // Add backlink to target
                const targetFile = this.findFileByName(linkTarget);
                if (targetFile) {
                    targetFile.backlinks.push(fileInfo.name);
                }
            }
        } catch (error) {
            // Ignore read errors
        }
    }
    
    /**
     * Generate index files and MOCs
     */
    async generateIndexes() {
        console.log('📑 Generating indexes and MOCs...');
        
        // Master Index
        let masterIndex = `# Master Index

Total Files: ${this.stats.totalFiles}

## Categories

`;
        
        for (const [category, config] of Object.entries(this.categories)) {
            const count = this.stats.categorized[category] || 0;
            if (count > 0) {
                masterIndex += `- [[${category}/README|${category}]] (${count} files) - ${config.description}\n`;
            }
        }
        
        masterIndex += `

## Quick Links

- [[00-Index/File-Database|Complete File Database]]
- [[00-Index/Relationship-Graph|Relationship Graph]]
- [[00-Index/Search-Index|Search Index]]
- [[99-Meta/Statistics|Vault Statistics]]

## Most Connected Files

`;
        
        // Find most connected files
        const connectionCounts = new Map();
        for (const [path, fileInfo] of this.fileDatabase) {
            const connections = fileInfo.links.length + fileInfo.backlinks.length;
            if (connections > 0) {
                connectionCounts.set(fileInfo.name, connections);
            }
        }
        
        const topConnected = Array.from(connectionCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        
        for (const [fileName, count] of topConnected) {
            masterIndex += `- [[${fileName}]] (${count} connections)\n`;
        }
        
        await fs.writeFile(path.join(this.vaultPath, '00-Index', 'Master-Index.md'), masterIndex);
        
        // Category-specific indexes
        for (const [category, config] of Object.entries(this.categories)) {
            await this.generateCategoryIndex(category);
        }
        
        console.log('✅ Indexes generated\n');
    }
    
    /**
     * Generate index for a specific category
     */
    async generateCategoryIndex(category) {
        const files = Array.from(this.fileDatabase.values())
            .filter(f => f.category === category)
            .sort((a, b) => a.name.localeCompare(b.name));
        
        if (files.length === 0) return;
        
        let index = `# ${category} Index

${this.categories[category].description}

## Files (${files.length})

`;
        
        // Group by type
        const byType = {};
        for (const file of files) {
            const ext = path.extname(file.name);
            if (!byType[ext]) byType[ext] = [];
            byType[ext].push(file);
        }
        
        for (const [ext, typeFiles] of Object.entries(byType)) {
            index += `\n### ${ext} files (${typeFiles.length})\n\n`;
            
            for (const file of typeFiles) {
                const size = (file.size / 1024).toFixed(1);
                index += `- [[${file.name}]] (${size}KB)`;
                
                if (file.links.length > 0) {
                    index += ` → ${file.links.length} links`;
                }
                if (file.backlinks.length > 0) {
                    index += ` ← ${file.backlinks.length} backlinks`;
                }
                
                index += '\n';
            }
        }
        
        await fs.writeFile(path.join(this.vaultPath, '00-Index', `${category}-Index.md`), index);
    }
    
    /**
     * Generate relationship graph data
     */
    async generateRelationshipGraph() {
        console.log('🕸️  Generating relationship graph...');
        
        const nodes = [];
        const edges = [];
        
        // Create nodes
        for (const [path, fileInfo] of this.fileDatabase) {
            nodes.push({
                id: fileInfo.hash,
                label: fileInfo.name,
                category: fileInfo.category,
                size: Math.log(fileInfo.size + 1) * 10,
                connections: fileInfo.links.length + fileInfo.backlinks.length
            });
        }
        
        // Create edges
        for (const [path, fileInfo] of this.fileDatabase) {
            for (const link of fileInfo.links) {
                const target = this.findFileByName(link);
                if (target) {
                    edges.push({
                        source: fileInfo.hash,
                        target: target.hash,
                        type: 'link'
                    });
                }
            }
        }
        
        // Save graph data
        const graphData = { nodes, edges };
        await fs.writeFile(
            path.join(this.vaultPath, '00-Index', 'graph-data.json'),
            JSON.stringify(graphData, null, 2)
        );
        
        console.log('✅ Relationship graph generated\n');
    }
    
    /**
     * Generate Obsidian vault configuration
     */
    async generateVaultConfig() {
        console.log('⚙️  Generating vault configuration...');
        
        // Create .obsidian directory
        const obsidianDir = path.join(this.vaultPath, '.obsidian');
        await fs.mkdir(obsidianDir, { recursive: true });
        
        // App configuration
        const appConfig = {
            "alwaysUpdateLinks": true,
            "attachmentFolderPath": "99-Meta/attachments",
            "defaultViewMode": "preview",
            "foldHeading": true,
            "foldIndent": true,
            "showLineNumber": true,
            "showFrontmatter": true,
            "tabSize": 4,
            "theme": "obsidian",
            "spellcheck": true
        };
        
        await fs.writeFile(
            path.join(obsidianDir, 'app.json'),
            JSON.stringify(appConfig, null, 2)
        );
        
        // Graph configuration
        const graphConfig = {
            "collapse": false,
            "search": "",
            "showTags": true,
            "showAttachments": true,
            "hideUnresolved": false,
            "showOrphans": true,
            "scale": 1,
            "close": false,
            "depth": 2,
            "centerStrength": 0.5,
            "repelStrength": 10,
            "linkStrength": 1,
            "linkDistance": 250,
            "showArrow": true,
            "textFadeMultiplier": 0,
            "nodeSizeMultiplier": 1.5,
            "lineSizeMultiplier": 2,
            "colorGroups": [
                {"query": "path:01-Core-Systems", "color": {"r": 0, "g": 255, "b": 0}},
                {"query": "path:02-Documentation", "color": {"r": 0, "g": 0, "b": 255}},
                {"query": "path:04-Generators", "color": {"r": 255, "g": 165, "b": 0}},
                {"query": "path:10-Theoretical", "color": {"r": 255, "g": 0, "b": 0}}
            ]
        };
        
        await fs.writeFile(
            path.join(obsidianDir, 'graph.json'),
            JSON.stringify(graphConfig, null, 2)
        );
        
        console.log('✅ Vault configuration created\n');
    }
    
    /**
     * Create simplified infrastructure configuration
     */
    async createSimplifiedInfrastructure() {
        console.log('🏗️  Creating simplified infrastructure...');
        
        // Simple docker-compose that actually works
        const dockerCompose = `version: '3.8'

services:
  # Simple file-based document processor
  document-processor:
    build: .
    container_name: simple-document-processor
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
      - ./ObsidianVault:/app/vault:ro
    environment:
      - NODE_ENV=development
      - DATA_PATH=/app/data
      - VAULT_PATH=/app/vault

  # SQLite-based storage (no PostgreSQL complexity)
  # Redis replaced with simple file-based queuing
  # MinIO replaced with local file storage

volumes:
  data:`;
        
        await fs.writeFile(
            path.join(this.vaultPath, '99-Meta', 'simple-docker-compose.yml'),
            dockerCompose
        );
        
        // Simple configuration
        const simpleConfig = `# Simplified Infrastructure Configuration

## What We Removed
- ❌ PostgreSQL → ✅ SQLite (file-based)
- ❌ Redis → ✅ File-based queuing
- ❌ MinIO → ✅ Local file storage
- ❌ 20+ services → ✅ 1 simple service

## File-Based Architecture
All data is stored in simple files:
- Database: \`data/database.sqlite\`
- Queue: \`data/queue/\`
- Storage: \`data/storage/\`
- Cache: \`data/cache/\`

## Benefits
- No complex setup
- No network issues
- Everything is inspectable
- Easy backup (just copy files)
- Works offline

## Usage
\`\`\`bash
# Start simple processor
docker-compose -f simple-docker-compose.yml up

# Or just run directly
node simple-document-router.js
\`\`\``;
        
        await fs.writeFile(
            path.join(this.vaultPath, '99-Meta', 'Simplified-Infrastructure.md'),
            simpleConfig
        );
        
        console.log('✅ Simplified infrastructure created\n');
    }
    
    /**
     * Helper functions
     */
    async getFileHash(filePath) {
        const content = await fs.readFile(filePath);
        return crypto.createHash('md5').update(content).digest('hex').substring(0, 8);
    }
    
    findFileByName(name) {
        for (const [path, fileInfo] of this.fileDatabase) {
            if (fileInfo.name === name || fileInfo.name.includes(name)) {
                return fileInfo;
            }
        }
        return null;
    }
    
    /**
     * Display results
     */
    displayResults() {
        console.log('📊 Orchestration Complete!\n');
        
        console.log('📈 Statistics:');
        console.log(`   Total files: ${this.stats.totalFiles}`);
        console.log(`   Categories:`);
        
        for (const [category, count] of Object.entries(this.stats.categorized)) {
            if (count > 0) {
                console.log(`     ${category}: ${count} files`);
            }
        }
        
        if (this.stats.errors.length > 0) {
            console.log(`\n⚠️  Errors (${this.stats.errors.length}):`);
            this.stats.errors.slice(0, 5).forEach(err => {
                console.log(`   - ${err}`);
            });
            if (this.stats.errors.length > 5) {
                console.log(`   ... and ${this.stats.errors.length - 5} more`);
            }
        }
        
        console.log(`
✅ Your Obsidian Vault is ready!

📁 Location: ${this.vaultPath}

🚀 Next Steps:
1. Open Obsidian
2. Choose "Open folder as vault"
3. Select: ${this.vaultPath}
4. Explore your organized knowledge base!

💡 Tips:
- Use the graph view to see connections
- Check 00-Index for navigation
- All files are symlinked (no duplication)
- Original files remain in their locations
`);
    }
}

// Run if called directly
if (require.main === module) {
    const orchestrator = new ObsidianVaultOrchestrator();
    orchestrator.orchestrate().catch(console.error);
}

module.exports = ObsidianVaultOrchestrator;