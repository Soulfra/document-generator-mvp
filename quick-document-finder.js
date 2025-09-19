/**
 * Quick Document Finder
 * Rapidly finds and organizes the most important documents in your project
 */

const fs = require('fs').promises;
const path = require('path');

class QuickDocumentFinder {
    constructor() {
        this.projectRoot = process.cwd();
        this.findings = {
            timestamp: new Date(),
            importantDocs: [],
            readmeFiles: [],
            configFiles: [],
            apiDocs: [],
            businessDocs: [],
            archDocs: [],
            duplicates: [],
            categories: {}
        };
        
        // Priority directories to scan first
        this.priorityDirs = [
            '.'                     // Root directory only for first pass
        ];
        
        // Important file patterns to find
        this.importantPatterns = [
            // Documentation
            { pattern: /readme/i, category: 'readme', priority: 'high' },
            { pattern: /documentation/i, category: 'docs', priority: 'high' },
            { pattern: /guide/i, category: 'docs', priority: 'medium' },
            
            // Configuration
            { pattern: /package\.json/i, category: 'config', priority: 'high' },
            { pattern: /docker-compose/i, category: 'config', priority: 'high' },
            { pattern: /\.env/i, category: 'config', priority: 'medium' },
            { pattern: /config/i, category: 'config', priority: 'medium' },
            
            // API and Technical
            { pattern: /api/i, category: 'api', priority: 'high' },
            { pattern: /spec/i, category: 'technical', priority: 'high' },
            { pattern: /architecture/i, category: 'arch', priority: 'high' },
            { pattern: /system/i, category: 'arch', priority: 'medium' },
            
            // Business
            { pattern: /business/i, category: 'business', priority: 'medium' },
            { pattern: /plan/i, category: 'business', priority: 'medium' },
            { pattern: /model/i, category: 'business', priority: 'low' },
            
            // Integration specific
            { pattern: /widget/i, category: 'widget', priority: 'high' },
            { pattern: /character/i, category: 'gaming', priority: 'high' },
            { pattern: /bridge/i, category: 'integration', priority: 'high' },
            { pattern: /service/i, category: 'services', priority: 'medium' }
        ];
    }
    
    async findImportantDocuments() {
        console.log('🎯 Finding important documents...');
        const startTime = Date.now();
        
        try {
            // Scan priority directories
            for (const dir of this.priorityDirs) {
                const dirPath = path.join(this.projectRoot, dir);
                await this.scanDirectory(dirPath);
            }
            
            // Organize findings
            this.organizeFindingsInPlace();
            
            // Generate summary
            this.generateQuickSummary();
            
            const duration = Date.now() - startTime;
            console.log(`✅ Found ${this.findings.importantDocs.length} important documents in ${duration}ms`);
            
            return this.findings;
        } catch (error) {
            console.error('❌ Document search failed:', error);
            throw error;
        }
    }
    
    async scanDirectory(dirPath) {
        try {
            await fs.access(dirPath);
            const entries = await fs.readdir(dirPath);
            
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry);
                
                try {
                    const stats = await fs.stat(fullPath);
                    
                    if (stats.isFile()) {
                        const doc = await this.analyzeFile(fullPath, stats);
                        if (doc && doc.isImportant) {
                            this.findings.importantDocs.push(doc);
                        }
                    } else if (stats.isDirectory() && this.shouldScanSubdir(entry)) {
                        // Scan one level deeper for important subdirectories
                        await this.scanDirectory(fullPath);
                    }
                } catch (error) {
                    // Skip files we can't access
                    continue;
                }
            }
        } catch (error) {
            // Directory doesn't exist or can't access
        }
    }
    
    shouldScanSubdir(dirName) {
        const skipDirs = ['node_modules', '.git', 'dist', 'build', '.next', 'coverage'];
        if (skipDirs.includes(dirName)) return false;
        
        const importantDirs = ['docs', 'documentation', 'api', 'spec', 'config', 'src', 'services'];
        return importantDirs.includes(dirName.toLowerCase());
    }
    
    async analyzeFile(filePath, stats) {
        const fileName = path.basename(filePath);
        const relativePath = path.relative(this.projectRoot, filePath);
        const extension = path.extname(fileName).toLowerCase();
        
        // Check if file matches important patterns
        let category = 'general';
        let priority = 'low';
        let isImportant = false;
        
        for (const { pattern, category: cat, priority: pri } of this.importantPatterns) {
            if (pattern.test(fileName) || pattern.test(relativePath)) {
                category = cat;
                priority = pri;
                isImportant = true;
                break;
            }
        }
        
        // Always include certain files
        const alwaysImportant = [
            'package.json', 'docker-compose.yml', '.env', 'index.js'
        ];
        
        if (alwaysImportant.includes(fileName)) {
            isImportant = true;
            priority = 'high';
        }
        
        // Include important README-like files
        if (fileName.toLowerCase().includes('readme') && fileName.endsWith('.md')) {
            isImportant = true;
            priority = 'high';
        }
        
        // Include CLAUDE files
        if (fileName.startsWith('CLAUDE.') || fileName === 'CLAUDE.md') {
            isImportant = true;
            priority = 'high';
            category = 'config';
        }
        
        // Include setup and deployment files
        if (fileName.includes('setup') || fileName.includes('deploy') || fileName.includes('start') || fileName.includes('launch')) {
            isImportant = true;
            priority = 'medium';
        }
        
        if (!isImportant) return null;
        
        const doc = {
            fileName: fileName,
            relativePath: relativePath,
            fullPath: filePath,
            size: stats.size,
            lastModified: stats.mtime,
            category: category,
            priority: priority,
            extension: extension,
            isReadable: this.isTextFile(extension),
            content: null,
            preview: null
        };
        
        // Read content for small text files
        if (doc.isReadable && stats.size < 50000) { // Max 50KB
            try {
                const content = await fs.readFile(filePath, 'utf8');
                doc.content = content;
                doc.preview = content.length > 300 ? content.slice(0, 300) + '...' : content;
            } catch (error) {
                // Can't read file
                doc.isReadable = false;
            }
        }
        
        return doc;
    }
    
    isTextFile(extension) {
        const textExts = ['.md', '.txt', '.json', '.yml', '.yaml', '.js', '.ts', '.html', '.xml', '.csv'];
        return textExts.includes(extension);
    }
    
    organizeFindingsInPlace() {
        // Organize by category
        for (const doc of this.findings.importantDocs) {
            if (!this.findings.categories[doc.category]) {
                this.findings.categories[doc.category] = [];
            }
            this.findings.categories[doc.category].push(doc);
            
            // Also add to specific collections
            if (doc.category === 'readme') {
                this.findings.readmeFiles.push(doc);
            } else if (doc.category === 'config') {
                this.findings.configFiles.push(doc);
            } else if (doc.category === 'api') {
                this.findings.apiDocs.push(doc);
            } else if (doc.category === 'business') {
                this.findings.businessDocs.push(doc);
            } else if (doc.category === 'arch') {
                this.findings.archDocs.push(doc);
            }
        }
        
        // Sort each category by priority and date
        for (const category in this.findings.categories) {
            this.findings.categories[category].sort((a, b) => {
                const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
                const aPri = priorityOrder[a.priority] || 1;
                const bPri = priorityOrder[b.priority] || 1;
                
                if (aPri !== bPri) return bPri - aPri;
                return b.lastModified - a.lastModified;
            });
        }
    }
    
    generateQuickSummary() {
        const summary = {
            totalDocs: this.findings.importantDocs.length,
            categories: Object.keys(this.findings.categories).length,
            highPriority: this.findings.importantDocs.filter(d => d.priority === 'high').length,
            
            // Quick stats
            readmeCount: this.findings.readmeFiles.length,
            configCount: this.findings.configFiles.length,
            apiCount: this.findings.apiDocs.length,
            businessCount: this.findings.businessDocs.length,
            
            // Most important files to look at
            topFiles: this.findings.importantDocs
                .filter(d => d.priority === 'high')
                .slice(0, 10),
                
            recommendations: []
        };
        
        // Generate quick recommendations
        if (summary.readmeCount > 5) {
            summary.recommendations.push({
                type: 'consolidate-readmes',
                message: `Found ${summary.readmeCount} README files - consider consolidating`,
                action: 'Create a master README with links to others'
            });
        }
        
        if (summary.configCount === 0) {
            summary.recommendations.push({
                type: 'missing-config',
                message: 'No configuration files found in main directories',
                action: 'Check if services are properly configured'
            });
        }
        
        if (summary.apiCount === 0) {
            summary.recommendations.push({
                type: 'missing-api-docs',
                message: 'No API documentation found',
                action: 'Document your API endpoints for the widget system'
            });
        }
        
        this.findings.summary = summary;
    }
    
    search(query) {
        const results = [];
        const queryLower = query.toLowerCase();
        
        for (const doc of this.findings.importantDocs) {
            let score = 0;
            let reasons = [];
            
            // Check filename
            if (doc.fileName.toLowerCase().includes(queryLower)) {
                score += 3;
                reasons.push('filename match');
            }
            
            // Check path
            if (doc.relativePath.toLowerCase().includes(queryLower)) {
                score += 2;
                reasons.push('path match');
            }
            
            // Check content
            if (doc.preview && doc.preview.toLowerCase().includes(queryLower)) {
                score += 1;
                reasons.push('content match');
            }
            
            // Check category
            if (doc.category.toLowerCase().includes(queryLower)) {
                score += 2;
                reasons.push('category match');
            }
            
            if (score > 0) {
                results.push({
                    document: doc,
                    score: score,
                    reasons: reasons
                });
            }
        }
        
        return results.sort((a, b) => b.score - a.score);
    }
    
    generateNavigationGuide() {
        return `
# 🗺️ Document Navigation Guide

**Generated**: ${this.findings.timestamp.toLocaleString()}

## 📊 Quick Overview

- **Total Important Documents**: ${this.findings.summary.totalDocs}
- **High Priority Files**: ${this.findings.summary.highPriority}
- **Categories Found**: ${this.findings.summary.categories}

## 🎯 Start Here - Most Important Files

${this.findings.summary.topFiles.map(doc => 
    `- **${doc.fileName}** (${doc.category}) - \`${doc.relativePath}\``
).join('\n')}

## 📁 By Category

### 📖 Documentation (${this.findings.readmeFiles.length})
${this.findings.readmeFiles.slice(0, 5).map(doc => 
    `- [${doc.fileName}](${doc.relativePath}) - *${(doc.size/1024).toFixed(1)}KB*`
).join('\n')}

### ⚙️ Configuration (${this.findings.configFiles.length})
${this.findings.configFiles.slice(0, 5).map(doc => 
    `- [${doc.fileName}](${doc.relativePath}) - *${(doc.size/1024).toFixed(1)}KB*`
).join('\n')}

### 🔌 API & Technical (${this.findings.apiDocs.length})
${this.findings.apiDocs.slice(0, 5).map(doc => 
    `- [${doc.fileName}](${doc.relativePath}) - *${(doc.size/1024).toFixed(1)}KB*`
).join('\n')}

${Object.keys(this.findings.categories).length > 3 ? `
### 📋 Other Categories
${Object.entries(this.findings.categories)
    .filter(([cat]) => !['readme', 'config', 'api'].includes(cat))
    .map(([cat, docs]) => `- **${cat}**: ${docs.length} files`)
    .join('\n')}
` : ''}

## 🔍 Quick Find Commands

### By Purpose
- **Widget System**: Files containing "widget", "character", "morph"
- **Services**: Files containing "service", "api", "server"
- **Integration**: Files containing "bridge", "gateway", "unified"
- **Documentation**: All README files and docs

### By Technology
- **Docker**: docker-compose.yml, Dockerfiles
- **Node.js**: package.json, index.js, server.js
- **AI Services**: Files with "ai", "claude", "openai"

## 💡 Recommendations

${this.findings.summary.recommendations.map(rec => 
    `- **${rec.type}**: ${rec.message}\n  *Action*: ${rec.action}`
).join('\n\n')}

## 🚀 Next Steps

1. **Review high-priority files** listed above
2. **Consolidate documentation** if you have many README files
3. **Set up the widget system** using the integration files
4. **Connect services** using the configuration files

---
*This guide helps you navigate the ${this.findings.summary.totalDocs} most important documents in your project*
`;
    }
    
    generateHTML() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document Navigator</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .search-box { margin: 20px 0; }
        .search-input { width: 100%; padding: 12px; font-size: 16px; border: 1px solid #ddd; border-radius: 6px; }
        .categories { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .category { background: white; border-radius: 8px; padding: 20px; }
        .category h3 { margin: 0 0 15px 0; color: #333; }
        .file-item { padding: 8px 0; border-bottom: 1px solid #eee; }
        .file-name { font-weight: bold; color: #007AFF; }
        .file-path { color: #666; font-size: 0.9em; }
        .file-size { color: #999; font-size: 0.8em; }
        .priority-high { border-left: 4px solid #FF3B30; padding-left: 12px; }
        .priority-medium { border-left: 4px solid #FF9500; padding-left: 12px; }
        .priority-low { border-left: 4px solid #8E8E93; padding-left: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📚 Document Navigator</h1>
            <p><strong>${this.findings.summary.totalDocs}</strong> important documents found across <strong>${this.findings.summary.categories}</strong> categories</p>
        </div>
        
        <div class="search-box">
            <input type="text" class="search-input" placeholder="Search documents..." id="searchInput" onkeyup="searchDocs()">
        </div>
        
        <div class="categories" id="categoriesContainer">
            ${Object.entries(this.findings.categories).map(([categoryName, docs]) => `
                <div class="category">
                    <h3>${categoryName} (${docs.length})</h3>
                    ${docs.slice(0, 10).map(doc => `
                        <div class="file-item priority-${doc.priority}">
                            <div class="file-name">${doc.fileName}</div>
                            <div class="file-path">${doc.relativePath}</div>
                            <div class="file-size">${(doc.size/1024).toFixed(1)}KB • ${doc.lastModified.toLocaleDateString()}</div>
                        </div>
                    `).join('')}
                    ${docs.length > 10 ? `<div style="color: #666; margin-top: 10px;">...and ${docs.length - 10} more files</div>` : ''}
                </div>
            `).join('')}
        </div>
    </div>
    
    <script>
        const allDocs = ${JSON.stringify(this.findings.importantDocs)};
        
        function searchDocs() {
            const query = document.getElementById('searchInput').value.toLowerCase();
            const container = document.getElementById('categoriesContainer');
            
            if (query.length < 2) {
                // Show all categories
                location.reload();
                return;
            }
            
            const filteredDocs = allDocs.filter(doc => 
                doc.fileName.toLowerCase().includes(query) ||
                doc.relativePath.toLowerCase().includes(query) ||
                doc.category.toLowerCase().includes(query) ||
                (doc.preview && doc.preview.toLowerCase().includes(query))
            );
            
            container.innerHTML = \`
                <div class="category">
                    <h3>Search Results (\${filteredDocs.length})</h3>
                    \${filteredDocs.map(doc => \`
                        <div class="file-item priority-\${doc.priority}">
                            <div class="file-name">\${doc.fileName}</div>
                            <div class="file-path">\${doc.relativePath}</div>
                            <div class="file-size">\${(doc.size/1024).toFixed(1)}KB • \${new Date(doc.lastModified).toLocaleDateString()}</div>
                        </div>
                    \`).join('')}
                </div>
            \`;
        }
    </script>
</body>
</html>`;
    }
    
    async saveResults() {
        // Save navigation guide
        const guidePath = path.join(this.projectRoot, 'DOCUMENT-NAVIGATION-GUIDE.md');
        await fs.writeFile(guidePath, this.generateNavigationGuide());
        
        // Save HTML interface
        const htmlPath = path.join(this.projectRoot, 'document-navigator.html');
        await fs.writeFile(htmlPath, this.generateHTML());
        
        // Save JSON data
        const dataPath = path.join(this.projectRoot, 'important-documents.json');
        await fs.writeFile(dataPath, JSON.stringify(this.findings, null, 2));
        
        console.log(`📄 Navigation guide: ${guidePath}`);
        console.log(`🌐 HTML interface: ${htmlPath}`);
        console.log(`📊 JSON data: ${dataPath}`);
        
        return { guidePath, htmlPath, dataPath };
    }
}

// CLI interface
if (require.main === module) {
    const finder = new QuickDocumentFinder();
    
    finder.findImportantDocuments()
        .then(async (results) => {
            await finder.saveResults();
            
            console.log('\n🎉 Document navigation setup complete!');
            console.log('\n📊 Summary:');
            console.log(`• ${results.summary.totalDocs} important documents found`);
            console.log(`• ${results.summary.highPriority} high-priority files`);
            console.log(`• ${results.summary.readmeCount} README files`);
            console.log(`• ${results.summary.configCount} config files`);
            
            console.log('\n🎯 Top Files to Review:');
            results.summary.topFiles.slice(0, 5).forEach(doc => {
                console.log(`  • ${doc.fileName} (${doc.category}) - ${doc.relativePath}`);
            });
            
            console.log('\n🌐 Open document-navigator.html to browse interactively!');
        })
        .catch(error => {
            console.error('❌ Document finder failed:', error);
            process.exit(1);
        });
}

module.exports = QuickDocumentFinder;