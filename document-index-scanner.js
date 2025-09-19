/**
 * Document Index Scanner
 * Scans the entire project and creates a searchable index of all documents
 * Organizes the chaos into a navigable structure
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class DocumentIndexScanner {
    constructor() {
        this.projectRoot = process.cwd();
        this.index = {
            timestamp: new Date(),
            totalDocuments: 0,
            totalSize: 0,
            categories: {},
            documents: [],
            duplicates: [],
            searchIndex: new Map(),
            keywordIndex: new Map(),
            locationIndex: new Map()
        };
        
        // Document categories and patterns
        this.documentTypes = {
            'README': {
                patterns: [/readme/i],
                category: 'documentation',
                priority: 'high',
                description: 'Project documentation and guides'
            },
            'API': {
                patterns: [/api/i, /endpoint/i, /swagger/i, /openapi/i],
                category: 'api-documentation',
                priority: 'high',
                description: 'API documentation and specifications'
            },
            'SPEC': {
                patterns: [/spec/i, /specification/i, /requirements/i],
                category: 'technical-specs',
                priority: 'high',
                description: 'Technical specifications and requirements'
            },
            'BUSINESS': {
                patterns: [/business/i, /plan/i, /model/i, /strategy/i],
                category: 'business-docs',
                priority: 'medium',
                description: 'Business plans and strategy documents'
            },
            'ARCHITECTURE': {
                patterns: [/architecture/i, /design/i, /system/i, /diagram/i],
                category: 'architecture',
                priority: 'high',
                description: 'System architecture and design documents'
            },
            'CONFIG': {
                patterns: [/config/i, /settings/i, /env/i],
                category: 'configuration',
                priority: 'medium',
                description: 'Configuration files and settings'
            },
            'LOG': {
                patterns: [/log/i, /debug/i, /trace/i],
                category: 'logs',
                priority: 'low',
                description: 'Log files and debugging information'
            },
            'TEST': {
                patterns: [/test/i, /spec\.js$/i, /\.test\./i],
                category: 'testing',
                priority: 'medium',
                description: 'Test files and testing documentation'
            },
            'DEPLOY': {
                patterns: [/deploy/i, /docker/i, /compose/i, /dockerfile/i],
                category: 'deployment',
                priority: 'high',
                description: 'Deployment configurations and scripts'
            },
            'SECURITY': {
                patterns: [/security/i, /auth/i, /ssl/i, /cert/i],
                category: 'security',
                priority: 'high',
                description: 'Security configurations and documentation'
            }
        };
        
        // File extensions to scan
        this.documentExtensions = [
            '.md', '.txt', '.json', '.yml', '.yaml', '.xml', '.html',
            '.pdf', '.doc', '.docx', '.csv', '.log', '.conf', '.ini'
        ];
        
        // Important keywords to extract
        this.importantKeywords = [
            'api', 'port', 'service', 'docker', 'database', 'auth', 'login',
            'password', 'key', 'secret', 'token', 'url', 'endpoint',
            'widget', 'character', 'game', 'ai', 'claude', 'openai',
            'ollama', 'template', 'document', 'process', 'upload'
        ];
        
        // Directories to prioritize
        this.priorityDirectories = [
            'docs', 'documentation', 'api', 'spec', 'config', 'deploy',
            'src', 'services', 'mcp', 'FinishThisIdea'
        ];
    }
    
    async scanAllDocuments() {
        console.log('📚 Starting comprehensive document scan...');
        const startTime = Date.now();
        
        try {
            // Reset index
            this.resetIndex();
            
            // Scan documents
            await this.scanDirectory(this.projectRoot);
            
            // Process and analyze
            await this.processDocuments();
            
            // Build search indexes
            this.buildSearchIndexes();
            
            // Detect duplicates
            this.detectDuplicates();
            
            // Generate insights
            this.generateInsights();
            
            const duration = Date.now() - startTime;
            console.log(`✅ Document scan completed in ${duration}ms`);
            console.log(`📊 Indexed ${this.index.totalDocuments} documents (${(this.index.totalSize/1024/1024).toFixed(2)}MB)`);
            
            return this.index;
        } catch (error) {
            console.error('❌ Document scan failed:', error);
            throw error;
        }
    }
    
    resetIndex() {
        this.index = {
            timestamp: new Date(),
            totalDocuments: 0,
            totalSize: 0,
            categories: {},
            documents: [],
            duplicates: [],
            searchIndex: new Map(),
            keywordIndex: new Map(),
            locationIndex: new Map()
        };
    }
    
    async scanDirectory(dirPath, depth = 0) {
        // Avoid infinite recursion and skip certain directories
        if (depth > 10) return;
        
        const dirName = path.basename(dirPath);
        if (['.git', 'node_modules', '.next', 'dist', 'build', '.vscode'].includes(dirName)) {
            return;
        }
        
        try {
            const entries = await fs.readdir(dirPath);
            
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry);
                
                try {
                    const stats = await fs.stat(fullPath);
                    
                    if (stats.isDirectory()) {
                        await this.scanDirectory(fullPath, depth + 1);
                    } else if (stats.isFile()) {
                        const ext = path.extname(entry).toLowerCase();
                        if (this.documentExtensions.includes(ext) || this.isImportantFile(entry)) {
                            await this.indexDocument(fullPath, stats);
                        }
                    }
                } catch (error) {
                    // Skip files we can't access
                    continue;
                }
            }
        } catch (error) {
            // Skip directories we can't access
        }
    }
    
    isImportantFile(fileName) {
        const important = [
            'package.json', 'docker-compose.yml', 'dockerfile', '.env',
            'makefile', 'rakefile', 'gulpfile.js', 'webpack.config.js'
        ];
        
        return important.some(pattern => fileName.toLowerCase().includes(pattern.toLowerCase()));
    }
    
    async indexDocument(filePath, stats) {
        try {
            const relativePath = path.relative(this.projectRoot, filePath);
            const fileName = path.basename(filePath);
            const extension = path.extname(fileName).toLowerCase();
            
            const document = {
                id: crypto.createHash('md5').update(filePath).digest('hex').slice(0, 8),
                fileName: fileName,
                relativePath: relativePath,
                fullPath: filePath,
                extension: extension,
                size: stats.size,
                lastModified: stats.mtime,
                created: stats.birthtime,
                directory: path.dirname(relativePath),
                type: this.classifyDocument(fileName, relativePath),
                category: null,
                priority: 'medium',
                content: null,
                preview: null,
                keywords: [],
                lines: 0,
                words: 0,
                isReadable: false,
                isDuplicate: false,
                duplicateOf: null,
                hash: null
            };
            
            // Read content for text files
            if (this.isTextFile(extension) && stats.size < 1024 * 1024) { // Max 1MB
                try {
                    const content = await fs.readFile(filePath, 'utf8');
                    document.content = content;
                    document.preview = this.generatePreview(content);
                    document.lines = content.split('\n').length;
                    document.words = content.split(/\s+/).length;
                    document.keywords = this.extractKeywords(content, fileName);
                    document.hash = crypto.createHash('md5').update(content).digest('hex');
                    document.isReadable = true;
                } catch (error) {
                    // File might be binary or inaccessible
                    document.isReadable = false;
                }
            }
            
            // Classify and categorize
            const typeInfo = this.getDocumentTypeInfo(document.type);
            if (typeInfo) {
                document.category = typeInfo.category;
                document.priority = typeInfo.priority;
            }
            
            // Add to index
            this.index.documents.push(document);
            this.index.totalDocuments++;
            this.index.totalSize += stats.size;
            
            // Update category stats
            if (!this.index.categories[document.category]) {
                this.index.categories[document.category] = {
                    count: 0,
                    totalSize: 0,
                    files: []
                };
            }
            this.index.categories[document.category].count++;
            this.index.categories[document.category].totalSize += stats.size;
            this.index.categories[document.category].files.push(document.id);
            
        } catch (error) {
            console.error(`Failed to index ${filePath}:`, error.message);
        }
    }
    
    isTextFile(extension) {
        const textExts = ['.md', '.txt', '.json', '.yml', '.yaml', '.xml', '.html', '.js', '.ts', '.css', '.sql', '.log', '.conf', '.ini'];
        return textExts.includes(extension);
    }
    
    classifyDocument(fileName, relativePath) {
        const fileNameLower = fileName.toLowerCase();
        const pathLower = relativePath.toLowerCase();
        
        // Check each document type
        for (const [typeName, typeInfo] of Object.entries(this.documentTypes)) {
            for (const pattern of typeInfo.patterns) {
                if (pattern.test(fileNameLower) || pattern.test(pathLower)) {
                    return typeName;
                }
            }
        }
        
        // Check by location
        if (pathLower.includes('/docs/')) return 'DOCUMENTATION';
        if (pathLower.includes('/test/')) return 'TEST';
        if (pathLower.includes('/config/')) return 'CONFIG';
        if (pathLower.includes('/deploy/')) return 'DEPLOY';
        
        return 'GENERAL';
    }
    
    getDocumentTypeInfo(type) {
        return this.documentTypes[type] || {
            category: 'general',
            priority: 'low',
            description: 'General document'
        };
    }
    
    generatePreview(content) {
        // Clean content and create preview
        const cleaned = content
            .replace(/\r\n/g, '\n')
            .replace(/\u00A0/g, ' ')
            .trim();
        
        const lines = cleaned.split('\n').slice(0, 5); // First 5 lines
        const preview = lines.join('\n').slice(0, 300); // Max 300 chars
        
        return preview + (cleaned.length > 300 ? '...' : '');
    }
    
    extractKeywords(content, fileName) {
        const keywords = new Set();
        const textToAnalyze = `${fileName} ${content}`.toLowerCase();
        
        // Extract important keywords
        for (const keyword of this.importantKeywords) {
            if (textToAnalyze.includes(keyword)) {
                keywords.add(keyword);
            }
        }
        
        // Extract ports
        const portMatches = content.match(/port[:\s=]*(\d+)|:(\d{4,5})/gi);
        if (portMatches) {
            for (const match of portMatches) {
                const numbers = match.match(/\d+/);
                if (numbers) {
                    keywords.add(`port-${numbers[0]}`);
                }
            }
        }
        
        // Extract URLs
        const urlMatches = content.match(/https?:\/\/[^\s]+/gi);
        if (urlMatches) {
            keywords.add('external-url');
        }
        
        // Extract common technical terms
        const techTerms = [
            'docker', 'kubernetes', 'postgres', 'redis', 'mongodb',
            'express', 'fastify', 'react', 'vue', 'angular',
            'typescript', 'javascript', 'python', 'rust', 'go'
        ];
        
        for (const term of techTerms) {
            if (textToAnalyze.includes(term)) {
                keywords.add(term);
            }
        }
        
        return Array.from(keywords);
    }
    
    async processDocuments() {
        console.log('🔍 Processing documents...');
        
        // Sort by priority and last modified
        this.index.documents.sort((a, b) => {
            const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
            const aPriority = priorityOrder[a.priority] || 1;
            const bPriority = priorityOrder[b.priority] || 1;
            
            if (aPriority !== bPriority) {
                return bPriority - aPriority;
            }
            
            return b.lastModified - a.lastModified;
        });
    }
    
    buildSearchIndexes() {
        console.log('🔍 Building search indexes...');
        
        for (const doc of this.index.documents) {
            // Build keyword index
            for (const keyword of doc.keywords) {
                if (!this.index.keywordIndex.has(keyword)) {
                    this.index.keywordIndex.set(keyword, []);
                }
                this.index.keywordIndex.get(keyword).push(doc.id);
            }
            
            // Build location index
            const directory = doc.directory;
            if (!this.index.locationIndex.has(directory)) {
                this.index.locationIndex.set(directory, []);
            }
            this.index.locationIndex.get(directory).push(doc.id);
            
            // Build full-text search index
            const searchText = `${doc.fileName} ${doc.relativePath} ${doc.keywords.join(' ')} ${doc.preview || ''}`.toLowerCase();
            
            // Split into words and index
            const words = searchText.split(/\s+/).filter(word => word.length > 2);
            for (const word of words) {
                if (!this.index.searchIndex.has(word)) {
                    this.index.searchIndex.set(word, []);
                }
                if (!this.index.searchIndex.get(word).includes(doc.id)) {
                    this.index.searchIndex.get(word).push(doc.id);
                }
            }
        }
    }
    
    detectDuplicates() {
        console.log('🔍 Detecting duplicates...');
        
        const hashMap = new Map();
        
        for (const doc of this.index.documents) {
            if (doc.hash && doc.isReadable) {
                if (hashMap.has(doc.hash)) {
                    // Found duplicate
                    const originalId = hashMap.get(doc.hash);
                    doc.isDuplicate = true;
                    doc.duplicateOf = originalId;
                    
                    this.index.duplicates.push({
                        hash: doc.hash,
                        original: originalId,
                        duplicate: doc.id,
                        files: [originalId, doc.id]
                    });
                } else {
                    hashMap.set(doc.hash, doc.id);
                }
            }
        }
    }
    
    generateInsights() {
        console.log('🧠 Generating insights...');
        
        const insights = {
            summary: {
                totalDocuments: this.index.totalDocuments,
                totalSizeMB: (this.index.totalSize / 1024 / 1024).toFixed(2),
                categories: Object.keys(this.index.categories).length,
                duplicates: this.index.duplicates.length,
                averageFileSize: Math.round(this.index.totalSize / this.index.totalDocuments)
            },
            topCategories: Object.entries(this.index.categories)
                .sort((a, b) => b[1].count - a[1].count)
                .slice(0, 5)
                .map(([name, data]) => ({
                    category: name,
                    count: data.count,
                    sizeMB: (data.totalSize / 1024 / 1024).toFixed(2)
                })),
            topKeywords: Array.from(this.index.keywordIndex.entries())
                .sort((a, b) => b[1].length - a[1].length)
                .slice(0, 10)
                .map(([keyword, docs]) => ({
                    keyword,
                    documentCount: docs.length
                })),
            largestFiles: this.index.documents
                .sort((a, b) => b.size - a.size)
                .slice(0, 5)
                .map(doc => ({
                    file: doc.fileName,
                    path: doc.relativePath,
                    sizeMB: (doc.size / 1024 / 1024).toFixed(2)
                })),
            recommendations: []
        };
        
        // Generate recommendations
        if (this.index.duplicates.length > 0) {
            insights.recommendations.push({
                type: 'cleanup-duplicates',
                priority: 'medium',
                message: `Found ${this.index.duplicates.length} duplicate files that can be cleaned up`,
                action: 'Review and remove duplicate files to save space'
            });
        }
        
        const highPriorityDocs = this.index.documents.filter(d => d.priority === 'high').length;
        if (highPriorityDocs > 0) {
            insights.recommendations.push({
                type: 'organize-priority-docs',
                priority: 'high',
                message: `Found ${highPriorityDocs} high-priority documents that need organization`,
                action: 'Create a documentation hub for important files'
            });
        }
        
        const readmesInRoot = this.index.documents.filter(d => 
            d.fileName.toLowerCase().includes('readme') && 
            d.directory === '.'
        ).length;
        
        if (readmesInRoot > 3) {
            insights.recommendations.push({
                type: 'consolidate-readmes',
                priority: 'medium',
                message: `Found ${readmesInRoot} README files in root directory`,
                action: 'Consolidate multiple README files into a single master README'
            });
        }
        
        this.index.insights = insights;
    }
    
    search(query, options = {}) {
        const results = [];
        const queryLower = query.toLowerCase();
        const limit = options.limit || 20;
        
        // Search by filename
        for (const doc of this.index.documents) {
            if (doc.fileName.toLowerCase().includes(queryLower)) {
                results.push({ document: doc, relevance: 3, reason: 'filename match' });
            }
        }
        
        // Search by path
        for (const doc of this.index.documents) {
            if (doc.relativePath.toLowerCase().includes(queryLower) && 
                !results.some(r => r.document.id === doc.id)) {
                results.push({ document: doc, relevance: 2, reason: 'path match' });
            }
        }
        
        // Search by keywords
        if (this.index.keywordIndex.has(queryLower)) {
            const docIds = this.index.keywordIndex.get(queryLower);
            for (const docId of docIds) {
                const doc = this.index.documents.find(d => d.id === docId);
                if (doc && !results.some(r => r.document.id === doc.id)) {
                    results.push({ document: doc, relevance: 2, reason: 'keyword match' });
                }
            }
        }
        
        // Search in content
        for (const doc of this.index.documents) {
            if (doc.preview && doc.preview.toLowerCase().includes(queryLower) &&
                !results.some(r => r.document.id === doc.id)) {
                results.push({ document: doc, relevance: 1, reason: 'content match' });
            }
        }
        
        // Sort by relevance and return limited results
        return results
            .sort((a, b) => b.relevance - a.relevance)
            .slice(0, limit);
    }
    
    getDocumentsByCategory(category) {
        if (!this.index.categories[category]) {
            return [];
        }
        
        const docIds = this.index.categories[category].files;
        return docIds.map(id => this.index.documents.find(d => d.id === id)).filter(Boolean);
    }
    
    getDocumentsByKeyword(keyword) {
        if (!this.index.keywordIndex.has(keyword)) {
            return [];
        }
        
        const docIds = this.index.keywordIndex.get(keyword);
        return docIds.map(id => this.index.documents.find(d => d.id === id)).filter(Boolean);
    }
    
    generateNavigationReport() {
        const report = `
# Document Navigation Report

**Generated**: ${this.index.timestamp.toLocaleString()}
**Total Documents**: ${this.index.totalDocuments}
**Total Size**: ${(this.index.totalSize/1024/1024).toFixed(2)}MB

## 📁 Document Categories

${Object.entries(this.index.categories)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([category, data]) => 
        `### ${category} (${data.count} files, ${(data.totalSize/1024/1024).toFixed(2)}MB)\n` +
        this.getDocumentsByCategory(category)
            .slice(0, 5)
            .map(doc => `- **${doc.fileName}** - ${doc.relativePath}`)
            .join('\n')
    ).join('\n\n')}

## 🔍 Most Important Documents

${this.index.documents
    .filter(d => d.priority === 'high')
    .slice(0, 10)
    .map(doc => `- **${doc.fileName}** (${doc.type}) - \`${doc.relativePath}\``)
    .join('\n')}

## 🏷️ Top Keywords

${this.index.insights.topKeywords
    .map(kw => `- **${kw.keyword}**: ${kw.documentCount} documents`)
    .join('\n')}

## 📊 Quick Stats

- **Largest Files**: ${this.index.insights.largestFiles.map(f => `${f.file} (${f.sizeMB}MB)`).join(', ')}
- **Duplicates Found**: ${this.index.duplicates.length}
- **Categories**: ${Object.keys(this.index.categories).length}

## 🎯 Quick Navigation

### By Purpose
- **API Documentation**: Search for "api" or "endpoint"
- **Configuration Files**: Search for "config" or "env"
- **Business Documents**: Search for "business" or "plan"
- **Technical Specs**: Search for "spec" or "architecture"

### By Technology
${this.index.insights.topKeywords
    .filter(kw => ['docker', 'api', 'service', 'database'].includes(kw.keyword))
    .map(kw => `- **${kw.keyword}**: ${kw.documentCount} documents`)
    .join('\n')}

---
*Use the search functions to find specific documents quickly!*
`;

        return report;
    }
    
    async saveIndex() {
        const outputDir = path.join(this.projectRoot, 'document-index');
        await fs.mkdir(outputDir, { recursive: true });
        
        // Save main index
        const indexPath = path.join(outputDir, 'document-index.json');
        const indexData = {
            ...this.index,
            searchIndex: Object.fromEntries(this.index.searchIndex),
            keywordIndex: Object.fromEntries(this.index.keywordIndex),
            locationIndex: Object.fromEntries(this.index.locationIndex)
        };
        await fs.writeFile(indexPath, JSON.stringify(indexData, null, 2));
        
        // Save navigation report
        const reportPath = path.join(outputDir, 'navigation-report.md');
        await fs.writeFile(reportPath, this.generateNavigationReport());
        
        // Save search interface
        const searchInterfacePath = path.join(outputDir, 'search-interface.html');
        await fs.writeFile(searchInterfacePath, this.generateSearchInterface());
        
        console.log(`📚 Document index saved:`);
        console.log(`   Index: ${indexPath}`);
        console.log(`   Report: ${reportPath}`);
        console.log(`   Search: ${searchInterfacePath}`);
        
        return { indexPath, reportPath, searchInterfacePath };
    }
    
    generateSearchInterface() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document Search Interface</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .search-box { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .search-input { width: 100%; padding: 15px; font-size: 16px; border: 1px solid #ddd; border-radius: 6px; }
        .categories { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-bottom: 20px; }
        .category-card { background: white; padding: 15px; border-radius: 8px; cursor: pointer; transition: transform 0.2s; }
        .category-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .category-title { font-size: 18px; font-weight: bold; margin-bottom: 8px; }
        .category-count { color: #666; font-size: 14px; }
        .results { background: white; border-radius: 8px; padding: 20px; }
        .result-item { padding: 12px 0; border-bottom: 1px solid #eee; }
        .result-title { font-weight: bold; color: #007AFF; }
        .result-path { color: #666; font-size: 14px; }
        .result-preview { color: #333; margin-top: 5px; font-size: 13px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📚 Document Search Interface</h1>
        
        <div class="search-box">
            <input type="text" class="search-input" placeholder="Search documents by name, keyword, or content..." id="searchInput">
        </div>
        
        <div class="categories">
            ${Object.entries(this.index.categories).map(([category, data]) => `
                <div class="category-card" onclick="searchByCategory('${category}')">
                    <div class="category-title">${category}</div>
                    <div class="category-count">${data.count} documents</div>
                </div>
            `).join('')}
        </div>
        
        <div class="results" id="results">
            <h3>📄 All Documents</h3>
            ${this.index.documents.slice(0, 20).map(doc => `
                <div class="result-item">
                    <div class="result-title">${doc.fileName}</div>
                    <div class="result-path">${doc.relativePath}</div>
                    ${doc.preview ? `<div class="result-preview">${doc.preview}</div>` : ''}
                </div>
            `).join('')}
        </div>
    </div>
    
    <script>
        const searchInput = document.getElementById('searchInput');
        const results = document.getElementById('results');
        
        // This would be replaced with actual search functionality
        searchInput.addEventListener('input', function() {
            const query = this.value.toLowerCase();
            if (query.length < 2) return;
            
            results.innerHTML = '<h3>🔍 Search Results</h3><p>Search functionality would be implemented here with the indexed data.</p>';
        });
        
        function searchByCategory(category) {
            results.innerHTML = '<h3>📁 ' + category + '</h3><p>Category filtering would be implemented here.</p>';
        }
    </script>
</body>
</html>`;
    }
}

// CLI interface
if (require.main === module) {
    const scanner = new DocumentIndexScanner();
    
    scanner.scanAllDocuments()
        .then(async (index) => {
            const files = await scanner.saveIndex();
            
            console.log('\n📚 Document indexing complete!');
            console.log(`Found ${index.totalDocuments} documents in ${Object.keys(index.categories).length} categories`);
            console.log(`🌐 Open the search interface: file://${files.searchInterfacePath}`);
            
            // Show top insights
            console.log('\n🎯 Key Findings:');
            console.log(`• Top categories: ${index.insights.topCategories.slice(0, 3).map(c => `${c.category} (${c.count})`).join(', ')}`);
            console.log(`• Most common keywords: ${index.insights.topKeywords.slice(0, 5).map(k => k.keyword).join(', ')}`);
            if (index.duplicates.length > 0) {
                console.log(`• Found ${index.duplicates.length} duplicate files`);
            }
        })
        .catch(error => {
            console.error('❌ Document indexing failed:', error);
            process.exit(1);
        });
}

module.exports = DocumentIndexScanner;