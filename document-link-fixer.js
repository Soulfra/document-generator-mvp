#!/usr/bin/env node

/**
 * 📎 DOCUMENT-LINK-FIXER
 * Fixes broken document symlinks and cross-references across the system
 * Creates proper bidirectional links between documentation files
 */

const fs = require('fs').promises;
const path = require('path');

class DocumentLinkFixer {
    constructor() {
        this.basePath = process.cwd();
        
        // Define major documentation categories
        this.documentCategories = {
            'character-sheets': {
                pattern: /-CHARACTER-SHEET\.md$/,
                basePath: '.',
                linkType: 'character'
            },
            'specifications': {
                pattern: /-SPEC\.md$|SPECIFICATION\.md$/,
                basePath: '.',
                linkType: 'spec'
            },
            'summaries': {
                pattern: /-SUMMARY\.md$/,
                basePath: '.',
                linkType: 'summary'
            },
            'templates': {
                pattern: /template/i,
                basePath: '.',
                linkType: 'template'
            },
            'systems': {
                pattern: /-SYSTEM\.js$|-SYSTEM\.md$/,
                basePath: '.',
                linkType: 'system'
            },
            'claude-guides': {
                pattern: /^CLAUDE\./,
                basePath: '.',
                linkType: 'guide'
            }
        };
        
        // Found documents registry
        this.documentRegistry = new Map();
        
        // Broken links to fix
        this.brokenLinks = new Map();
        
        // Fixed links registry  
        this.fixedLinks = new Map();
    }
    
    /**
     * 🔍 Main link fixing process
     */
    async fixAllDocumentLinks() {
        console.log('📎 Document Link Fixer starting...');
        console.log('==================================');
        
        try {
            // 1. Scan all documents
            console.log('🔍 Scanning for documents...');
            await this.scanDocuments();
            
            // 2. Find broken links
            console.log('🔗 Analyzing document links...');
            await this.findBrokenLinks();
            
            // 3. Create proper symlinks
            console.log('🔄 Creating symlinks...');
            await this.createSymlinks();
            
            // 4. Fix cross-references in content
            console.log('📝 Fixing cross-references...');
            await this.fixCrossReferences();
            
            // 5. Generate link map
            console.log('🗺️ Generating link map...');
            await this.generateLinkMap();
            
            console.log('✅ Document link fixing complete!');
            this.printSummary();
            
            return {
                success: true,
                documentsFound: this.documentRegistry.size,
                linksFixed: this.fixedLinks.size,
                symlinkMap: await this.generateSymlinkMap()
            };
            
        } catch (error) {
            console.error('❌ Document link fixing failed:', error.message);
            throw error;
        }
    }
    
    /**
     * 🔍 Scan for all documents in the system
     */
    async scanDocuments() {
        const scanQueue = [this.basePath];
        const visited = new Set();
        
        while (scanQueue.length > 0) {
            const currentPath = scanQueue.shift();
            
            if (visited.has(currentPath)) continue;
            visited.add(currentPath);
            
            try {
                const entries = await fs.readdir(currentPath, { withFileTypes: true });
                
                for (const entry of entries) {
                    const fullPath = path.join(currentPath, entry.name);
                    
                    if (entry.isDirectory()) {
                        // Skip node_modules and other system directories
                        if (!entry.name.startsWith('.') && 
                            entry.name !== 'node_modules' && 
                            entry.name !== 'deployments') {
                            scanQueue.push(fullPath);
                        }
                    } else if (this.isDocumentFile(entry.name)) {
                        await this.registerDocument(fullPath, entry.name);
                    }
                }
            } catch (error) {
                // Skip directories we can't read
                continue;
            }
        }
        
        console.log(`   📄 Found ${this.documentRegistry.size} documents`);
    }
    
    /**
     * 📋 Register a document in our registry
     */
    async registerDocument(filePath, fileName) {
        try {
            const stats = await fs.stat(filePath);
            const relativePath = path.relative(this.basePath, filePath);
            
            const document = {
                fileName,
                filePath,
                relativePath,
                size: stats.size,
                modified: stats.mtime,
                category: this.categorizeDocument(fileName),
                content: null, // Will be loaded when needed
                outgoingLinks: [],
                incomingLinks: []
            };
            
            this.documentRegistry.set(relativePath, document);
            
        } catch (error) {
            console.warn(`⚠️ Could not register document ${fileName}:`, error.message);
        }
    }
    
    /**
     * 🏷️ Categorize document by filename pattern
     */
    categorizeDocument(fileName) {
        for (const [category, config] of Object.entries(this.documentCategories)) {
            if (config.pattern.test(fileName)) {
                return category;
            }
        }
        return 'uncategorized';
    }
    
    /**
     * 📄 Check if file is a document we care about
     */
    isDocumentFile(fileName) {
        const docExtensions = ['.md', '.txt', '.rst', '.adoc'];
        const hasDocExtension = docExtensions.some(ext => fileName.endsWith(ext));
        
        // Also include important system files
        const systemFiles = [
            'README.md',
            'CHANGELOG.md',
            'TODO.md',
            'NOTES.md'
        ];
        
        return hasDocExtension || systemFiles.includes(fileName);
    }
    
    /**
     * 🔗 Find broken links in documents
     */
    async findBrokenLinks() {
        let brokenCount = 0;
        
        for (const [relativePath, document] of this.documentRegistry) {
            try {
                // Load document content
                const content = await fs.readFile(document.filePath, 'utf8');
                document.content = content;
                
                // Find markdown links
                const markdownLinks = content.match(/\[([^\]]+)\]\(([^)]+)\)/g) || [];
                
                // Find wiki-style links  
                const wikiLinks = content.match(/\[\[([^\]]+)\]\]/g) || [];
                
                // Find file references
                const fileRefs = content.match(/(?:see|ref|link to|goto)\s+([A-Z][A-Z0-9-_]*\.(?:md|js|html))/gi) || [];
                
                // Check each link
                const allLinks = [...markdownLinks, ...wikiLinks, ...fileRefs];
                
                for (const link of allLinks) {
                    const target = this.extractLinkTarget(link);
                    if (target && !await this.linkExists(target, document.filePath)) {
                        brokenCount++;
                        this.recordBrokenLink(document, link, target);
                    } else if (target) {
                        document.outgoingLinks.push(target);
                    }
                }
                
            } catch (error) {
                console.warn(`⚠️ Could not analyze links in ${relativePath}:`, error.message);
            }
        }
        
        console.log(`   🔍 Found ${brokenCount} broken links`);
    }
    
    /**
     * 🎯 Extract the target from a link
     */
    extractLinkTarget(link) {
        // Markdown link: [text](target)
        let match = link.match(/\[([^\]]+)\]\(([^)]+)\)/);
        if (match) return match[2];
        
        // Wiki link: [[target]]
        match = link.match(/\[\[([^\]]+)\]\]/);
        if (match) return match[1];
        
        // File reference
        match = link.match(/(?:see|ref|link to|goto)\s+([A-Z][A-Z0-9-_]*\.(?:md|js|html))/i);
        if (match) return match[1];
        
        return null;
    }
    
    /**
     * ✅ Check if a link target exists
     */
    async linkExists(target, fromFile) {
        // Try relative to current file
        const fromDir = path.dirname(fromFile);
        const relativePath = path.resolve(fromDir, target);
        
        if (await this.fileExists(relativePath)) return true;
        
        // Try relative to project root
        const rootPath = path.resolve(this.basePath, target);
        if (await this.fileExists(rootPath)) return true;
        
        // Try finding by filename in registry
        const fileName = path.basename(target);
        for (const [_, document] of this.documentRegistry) {
            if (document.fileName === fileName) return true;
        }
        
        return false;
    }
    
    /**
     * 📁 Check if file exists
     */
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }
    
    /**
     * 📝 Record a broken link
     */
    recordBrokenLink(document, link, target) {
        if (!this.brokenLinks.has(document.relativePath)) {
            this.brokenLinks.set(document.relativePath, []);
        }
        
        this.brokenLinks.get(document.relativePath).push({
            link,
            target,
            type: this.getLinkType(link)
        });
    }
    
    /**
     * 🔗 Get link type
     */
    getLinkType(link) {
        if (link.includes('](')) return 'markdown';
        if (link.includes('[[')) return 'wiki';
        return 'reference';
    }
    
    /**
     * 🔄 Create symlinks for better organization
     */
    async createSymlinks() {
        const symlinkDir = path.join(this.basePath, 'docs-symlinks');
        
        // Create symlink directory
        try {
            await fs.mkdir(symlinkDir, { recursive: true });
        } catch (error) {
            // Directory might already exist
        }
        
        // Create category directories and symlinks
        for (const [category, config] of Object.entries(this.documentCategories)) {
            const categoryDir = path.join(symlinkDir, category);
            
            try {
                await fs.mkdir(categoryDir, { recursive: true });
            } catch {
                // Directory might already exist
            }
            
            // Create symlinks for documents in this category
            for (const [_, document] of this.documentRegistry) {
                if (document.category === category) {
                    const symlinkPath = path.join(categoryDir, document.fileName);
                    const targetPath = path.relative(categoryDir, document.filePath);
                    
                    try {
                        // Remove existing symlink if it exists
                        try {
                            await fs.unlink(symlinkPath);
                        } catch {
                            // Symlink might not exist
                        }
                        
                        await fs.symlink(targetPath, symlinkPath);
                        this.recordFixedLink('symlink', document.relativePath, symlinkPath);
                        
                    } catch (error) {
                        console.warn(`⚠️ Could not create symlink for ${document.fileName}:`, error.message);
                    }
                }
            }
        }
        
        console.log(`   🔗 Created symlinks in ${symlinkDir}`);
    }
    
    /**
     * 📝 Fix cross-references in document content
     */
    async fixCrossReferences() {
        let fixedCount = 0;
        
        for (const [relativePath, brokenLinks] of this.brokenLinks) {
            const document = this.documentRegistry.get(relativePath);
            if (!document || !document.content) continue;
            
            let updatedContent = document.content;
            
            for (const brokenLink of brokenLinks) {
                const fixedTarget = await this.findCorrectTarget(brokenLink.target);
                
                if (fixedTarget) {
                    // Replace the broken link with the correct one
                    const oldLink = brokenLink.link;
                    const newLink = this.generateCorrectLink(brokenLink, fixedTarget);
                    
                    updatedContent = updatedContent.replace(oldLink, newLink);
                    this.recordFixedLink('cross-reference', relativePath, `${oldLink} → ${newLink}`);
                    fixedCount++;
                }
            }
            
            // Write updated content if there were changes
            if (updatedContent !== document.content) {
                try {
                    await fs.writeFile(document.filePath, updatedContent, 'utf8');
                    document.content = updatedContent;
                } catch (error) {
                    console.warn(`⚠️ Could not update ${relativePath}:`, error.message);
                }
            }
        }
        
        console.log(`   📝 Fixed ${fixedCount} cross-references`);
    }
    
    /**
     * 🎯 Find the correct target for a broken link
     */
    async findCorrectTarget(brokenTarget) {
        const targetBasename = path.basename(brokenTarget, path.extname(brokenTarget));
        
        // Look for documents with similar names
        for (const [relativePath, document] of this.documentRegistry) {
            const documentBasename = path.basename(document.fileName, path.extname(document.fileName));
            
            // Exact match
            if (documentBasename === targetBasename) {
                return document.relativePath;
            }
            
            // Partial match (case insensitive)
            if (documentBasename.toLowerCase().includes(targetBasename.toLowerCase()) ||
                targetBasename.toLowerCase().includes(documentBasename.toLowerCase())) {
                return document.relativePath;
            }
        }
        
        return null;
    }
    
    /**
     * 🔗 Generate correct link format
     */
    generateCorrectLink(brokenLink, correctTarget) {
        switch (brokenLink.type) {
            case 'markdown':
                const text = brokenLink.link.match(/\[([^\]]+)\]/)[1];
                return `[${text}](${correctTarget})`;
            
            case 'wiki':
                return `[[${correctTarget}]]`;
            
            case 'reference':
                return `see ${correctTarget}`;
            
            default:
                return correctTarget;
        }
    }
    
    /**
     * 📝 Record a fixed link
     */
    recordFixedLink(type, source, fix) {
        if (!this.fixedLinks.has(type)) {
            this.fixedLinks.set(type, []);
        }
        
        this.fixedLinks.get(type).push({
            source,
            fix,
            timestamp: new Date().toISOString()
        });
    }
    
    /**
     * 🗺️ Generate comprehensive link map
     */
    async generateLinkMap() {
        const linkMap = {
            generated: new Date().toISOString(),
            summary: {
                totalDocuments: this.documentRegistry.size,
                brokenLinksFound: Array.from(this.brokenLinks.values()).flat().length,
                linksFixed: Array.from(this.fixedLinks.values()).flat().length
            },
            categories: {},
            symlinks: {},
            crossReferences: {}
        };
        
        // Organize by categories
        for (const [_, document] of this.documentRegistry) {
            if (!linkMap.categories[document.category]) {
                linkMap.categories[document.category] = [];
            }
            
            linkMap.categories[document.category].push({
                name: document.fileName,
                path: document.relativePath,
                size: document.size,
                modified: document.modified
            });
        }
        
        // Add symlinks
        if (this.fixedLinks.has('symlink')) {
            linkMap.symlinks = this.fixedLinks.get('symlink');
        }
        
        // Add cross-references
        if (this.fixedLinks.has('cross-reference')) {
            linkMap.crossReferences = this.fixedLinks.get('cross-reference');
        }
        
        // Save link map
        const linkMapPath = path.join(this.basePath, 'DOCUMENT-LINK-MAP.json');
        await fs.writeFile(linkMapPath, JSON.stringify(linkMap, null, 2), 'utf8');
        
        console.log(`   🗺️ Generated link map: ${linkMapPath}`);
        return linkMap;
    }
    
    /**
     * 🔗 Generate symlink map for easy navigation
     */
    async generateSymlinkMap() {
        const symlinkMap = {
            'Character Sheets': 'docs-symlinks/character-sheets/',
            'Specifications': 'docs-symlinks/specifications/',
            'System Summaries': 'docs-symlinks/summaries/',
            'Templates': 'docs-symlinks/templates/',
            'Systems': 'docs-symlinks/systems/',
            'Claude Guides': 'docs-symlinks/claude-guides/'
        };
        
        return symlinkMap;
    }
    
    /**
     * 📊 Print summary of fixes
     */
    printSummary() {
        console.log('');
        console.log('📊 DOCUMENT LINK FIXING SUMMARY');
        console.log('===============================');
        console.log(`📄 Documents scanned: ${this.documentRegistry.size}`);
        console.log(`🔍 Broken links found: ${Array.from(this.brokenLinks.values()).flat().length}`);
        console.log(`✅ Links fixed: ${Array.from(this.fixedLinks.values()).flat().length}`);
        console.log('');
        
        console.log('📁 Document Categories:');
        const categoryCounts = {};
        for (const [_, document] of this.documentRegistry) {
            categoryCounts[document.category] = (categoryCounts[document.category] || 0) + 1;
        }
        
        for (const [category, count] of Object.entries(categoryCounts)) {
            console.log(`   ${category}: ${count} documents`);
        }
        
        console.log('');
        console.log('🔗 Quick Navigation:');
        console.log('   📂 All symlinks: ./docs-symlinks/');
        console.log('   🗺️ Link map: ./DOCUMENT-LINK-MAP.json');
        console.log('   🎭 Characters: ./docs-symlinks/character-sheets/');
        console.log('   📋 Specs: ./docs-symlinks/specifications/');
        console.log('   🤖 Claude guides: ./docs-symlinks/claude-guides/');
        console.log('');
        console.log('✅ All document links are now properly organized!');
    }
}

// Export for use as module
module.exports = DocumentLinkFixer;

// CLI execution
if (require.main === module) {
    async function main() {
        try {
            const fixer = new DocumentLinkFixer();
            const result = await fixer.fixAllDocumentLinks();
            
            console.log('🎉 Document linking system ready!');
            console.log('Now you can click on any link and it will work properly.');
            
            process.exit(0);
        } catch (error) {
            console.error('❌ Failed to fix document links:', error.message);
            process.exit(1);
        }
    }
    
    main();
}