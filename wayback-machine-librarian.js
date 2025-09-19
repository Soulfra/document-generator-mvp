#!/usr/bin/env node

/**
 * WAYBACK MACHINE LIBRARIAN
 * Archive.org-style search and discovery for your massive codebase
 * Find all the shit you've already built multiple times
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class WaybackMachineLibrarian {
    constructor() {
        this.archives = {
            byContent: new Map(),
            byFunction: new Map(),
            byPurpose: new Map(),
            byTimestamp: new Map(),
            duplicates: new Map(),
            patterns: new Map()
        };
        
        this.searchPatterns = {
            launcher: /launch|start|run|deploy|execute/i,
            gaming: /game|gaming|tycoon|arena|combat|boss/i,
            ai: /ai|llm|claude|gpt|ollama|agent/i,
            blockchain: /blockchain|crypto|wallet|contract|solidity/i,
            api: /api|endpoint|route|service|server/i,
            database: /database|sql|db|schema|table/i,
            config: /config|setup|env|docker|compose/i,
            unified: /unified|master|complete|ultimate|final/i
        };
        
        this.customExtensions = {
            '.capsule.soulfra': 'soulfra-capsule',
            '.agents.md': 'agent-documentation',
            '.cal': 'cal-system',
            '.quest': 'quest-file',
            '.layer': 'layer-architecture',
            '.tier1': 'tier-1-system',
            '.tier2': 'tier-2-system',
            '.tier3': 'tier-3-system',
            '.verify': 'verification-file'
        };
    }
    
    async buildWaybackMachine() {
        console.log('🕰️ WAYBACK MACHINE LIBRARIAN');
        console.log('============================');
        console.log('Building comprehensive archive of all your built systems...\n');
        
        // Phase 1: Deep scan with better patterns
        console.log('🔍 Phase 1: Deep scanning with better search patterns...');
        await this.deepScanWithPatterns();
        
        // Phase 2: Build content fingerprints
        console.log('🔬 Phase 2: Building content fingerprints...');
        await this.buildContentFingerprints();
        
        // Phase 3: Find ALL the duplicates you mentioned
        console.log('📦 Phase 3: Finding all duplicates (you said you have everything multiple times)...');
        await this.findAllDuplicates();
        
        // Phase 4: Create semantic search index
        console.log('🧠 Phase 4: Creating semantic search index...');
        await this.createSemanticIndex();
        
        // Phase 5: Build wayback interface
        console.log('🖥️ Phase 5: Building wayback search interface...');
        await this.buildWaybackInterface();
        
        // Phase 6: Generate comprehensive archive
        console.log('📚 Phase 6: Generating comprehensive archive...');
        await this.generateArchive();
        
        console.log('\n✅ Wayback Machine built! Now you can find all your existing shit.');
    }
    
    async deepScanWithPatterns() {
        const rootDir = process.cwd();
        let scannedFiles = 0;
        
        const scanDir = async (dir, depth = 0) => {
            if (depth > 10) return; // Prevent infinite recursion
            
            try {
                const entries = await fs.readdir(dir, { withFileTypes: true });
                
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);
                    
                    // Skip common ignore patterns but include more than usual
                    if (this.shouldScan(entry.name)) {
                        if (entry.isDirectory()) {
                            await scanDir(fullPath, depth + 1);
                        } else if (entry.isFile()) {
                            await this.analyzeFile(fullPath);
                            scannedFiles++;
                            
                            if (scannedFiles % 500 === 0) {
                                console.log(`  Scanned ${scannedFiles} files...`);
                            }
                        }
                    }
                }
            } catch (error) {
                // Skip directories we can't read
            }
        };
        
        await scanDir(rootDir);
        console.log(`  ✅ Scanned ${scannedFiles} files total\n`);
    }
    
    shouldScan(name) {
        // More permissive scanning - only skip obvious junk
        const skipPatterns = [
            'node_modules',
            '.git',
            '__pycache__',
            '.DS_Store',
            '*.pyc',
            '*.class',
            '*.o'
        ];
        
        return !skipPatterns.some(pattern => {
            if (pattern.includes('*')) {
                const regex = new RegExp(pattern.replace('*', '.*'));
                return regex.test(name);
            }
            return name === pattern;
        });
    }
    
    async analyzeFile(filePath) {
        try {
            const stats = await fs.stat(filePath);
            const ext = path.extname(filePath).toLowerCase();
            const basename = path.basename(filePath);
            const content = await this.safeReadFile(filePath, stats.size);
            
            if (!content) return;
            
            // Detect custom extensions you mentioned
            const fullExt = this.detectCustomExtension(basename);
            const fileType = this.customExtensions[fullExt] || this.getFileType(ext);
            
            // Create fingerprint
            const fingerprint = {
                path: filePath,
                basename,
                ext: fullExt,
                type: fileType,
                size: stats.size,
                modified: stats.mtime,
                contentHash: crypto.createHash('md5').update(content).digest('hex'),
                purposes: this.detectPurposes(content, basename),
                functions: this.detectFunctions(content),
                patterns: this.detectPatterns(content),
                unified: this.isUnifiedFile(content, basename),
                launcher: this.isLauncher(content, basename)
            };
            
            // Store in archives
            this.storeInArchives(fingerprint, content);
            
        } catch (error) {
            // Skip files we can't analyze
        }
    }
    
    detectCustomExtension(basename) {
        // Check for compound extensions like .capsule.soulfra
        for (const [ext, type] of Object.entries(this.customExtensions)) {
            if (basename.includes(ext.replace('.', ''))) {
                return ext;
            }
        }
        return path.extname(basename);
    }
    
    async safeReadFile(filePath, size) {
        // Don't read huge files
        if (size > 50 * 1024 * 1024) return null;
        
        try {
            const content = await fs.readFile(filePath, 'utf8');
            return content;
        } catch (error) {
            // Try as binary for non-text files
            try {
                const buffer = await fs.readFile(filePath);
                return buffer.toString('hex').substring(0, 1000); // First 1000 chars as hex
            } catch {
                return null;
            }
        }
    }
    
    detectPurposes(content, basename) {
        const purposes = [];
        
        for (const [purpose, pattern] of Object.entries(this.searchPatterns)) {
            if (pattern.test(content) || pattern.test(basename)) {
                purposes.push(purpose);
            }
        }
        
        // Additional purpose detection
        if (content.includes('port') && content.includes('listen')) purposes.push('server');
        if (content.includes('docker') || content.includes('compose')) purposes.push('deployment');
        if (content.includes('test') || content.includes('spec')) purposes.push('testing');
        if (content.includes('README') || content.includes('documentation')) purposes.push('documentation');
        if (content.includes('migration') || content.includes('schema')) purposes.push('database');
        
        return purposes;
    }
    
    detectFunctions(content) {
        const functions = [];
        
        // JavaScript/TypeScript functions
        const jsFunctions = content.match(/function\s+(\w+)|const\s+(\w+)\s*=|class\s+(\w+)/gi);
        if (jsFunctions) functions.push(...jsFunctions);
        
        // Python functions
        const pyFunctions = content.match(/def\s+(\w+)|class\s+(\w+)/gi);
        if (pyFunctions) functions.push(...pyFunctions);
        
        // SQL procedures
        const sqlFunctions = content.match(/CREATE\s+(PROCEDURE|FUNCTION)\s+(\w+)/gi);
        if (sqlFunctions) functions.push(...sqlFunctions);
        
        // Bash functions
        const bashFunctions = content.match(/(\w+)\(\)\s*{/gi);
        if (bashFunctions) functions.push(...bashFunctions);
        
        return functions.slice(0, 20); // Limit to first 20
    }
    
    detectPatterns(content) {
        const patterns = [];
        
        // Architecture patterns
        if (content.includes('microservice')) patterns.push('microservices');
        if (content.includes('monolith')) patterns.push('monolithic');
        if (content.includes('event') && content.includes('driven')) patterns.push('event-driven');
        if (content.includes('mvc') || content.includes('model-view-controller')) patterns.push('mvc');
        
        // Technology patterns
        if (content.includes('express') && content.includes('app')) patterns.push('express-server');
        if (content.includes('React') || content.includes('jsx')) patterns.push('react');
        if (content.includes('Vue') || content.includes('vue')) patterns.push('vue');
        if (content.includes('docker') && content.includes('compose')) patterns.push('docker-compose');
        
        // Custom patterns from your system
        if (content.includes('CALOS')) patterns.push('calos-system');
        if (content.includes('SOULFRA')) patterns.push('soulfra-system');
        if (content.includes('blamechain')) patterns.push('blamechain');
        if (content.includes('diamond') && content.includes('broadcast')) patterns.push('diamond-broadcast');
        
        return patterns;
    }
    
    isUnifiedFile(content, basename) {
        const unifiedKeywords = ['unified', 'master', 'complete', 'ultimate', 'final', 'all-in-one'];
        return unifiedKeywords.some(keyword => 
            basename.toLowerCase().includes(keyword) || 
            content.toLowerCase().includes(keyword)
        );
    }
    
    isLauncher(content, basename) {
        const launcherKeywords = ['launch', 'start', 'run', 'deploy', 'execute', 'boot'];
        return launcherKeywords.some(keyword => 
            basename.toLowerCase().includes(keyword) ||
            (content.includes('#!/bin/bash') && content.includes(keyword))
        );
    }
    
    storeInArchives(fingerprint, content) {
        // Store by content hash
        this.archives.byContent.set(fingerprint.contentHash, fingerprint);
        
        // Store by purposes
        for (const purpose of fingerprint.purposes) {
            if (!this.archives.byPurpose.has(purpose)) {
                this.archives.byPurpose.set(purpose, []);
            }
            this.archives.byPurpose.get(purpose).push(fingerprint);
        }
        
        // Store by functions
        for (const func of fingerprint.functions) {
            if (!this.archives.byFunction.has(func)) {
                this.archives.byFunction.set(func, []);
            }
            this.archives.byFunction.get(func).push(fingerprint);
        }
        
        // Store by patterns
        for (const pattern of fingerprint.patterns) {
            if (!this.archives.byPatterns.has(pattern)) {
                this.archives.byPatterns.set(pattern, []);
            }
            this.archives.byPatterns.get(pattern).push(fingerprint);
        }
        
        // Store by timestamp
        const dateKey = fingerprint.modified.toISOString().split('T')[0];
        if (!this.archives.byTimestamp.has(dateKey)) {
            this.archives.byTimestamp.set(dateKey, []);
        }
        this.archives.byTimestamp.get(dateKey).push(fingerprint);
    }
    
    async buildContentFingerprints() {
        // Build similarity clusters
        const hashes = Array.from(this.archives.byContent.keys());
        
        for (let i = 0; i < hashes.length; i++) {
            const hash1 = hashes[i];
            const file1 = this.archives.byContent.get(hash1);
            
            for (let j = i + 1; j < hashes.length; j++) {
                const hash2 = hashes[j];
                const file2 = this.archives.byContent.get(hash2);
                
                // Check for similar purposes
                const purposeOverlap = file1.purposes.filter(p => file2.purposes.includes(p));
                if (purposeOverlap.length > 0) {
                    if (!file1.similarFiles) file1.similarFiles = [];
                    if (!file2.similarFiles) file2.similarFiles = [];
                    
                    file1.similarFiles.push(file2.path);
                    file2.similarFiles.push(file1.path);
                }
            }
        }
        
        console.log(`  ✅ Built fingerprints for ${hashes.length} files\n`);
    }
    
    async findAllDuplicates() {
        const hashGroups = new Map();
        
        // Group by content hash
        for (const [hash, file] of this.archives.byContent) {
            if (!hashGroups.has(hash)) {
                hashGroups.set(hash, []);
            }
            hashGroups.get(hash).push(file);
        }
        
        // Find duplicate groups
        let duplicateGroupCount = 0;
        let totalDuplicates = 0;
        
        for (const [hash, files] of hashGroups) {
            if (files.length > 1) {
                this.archives.duplicates.set(hash, files);
                duplicateGroupCount++;
                totalDuplicates += files.length - 1;
            }
        }
        
        console.log(`  ✅ Found ${duplicateGroupCount} groups with ${totalDuplicates} duplicate files\n`);
    }
    
    async createSemanticIndex() {
        // Create searchable index
        const searchIndex = {
            unified: [],
            launchers: [],
            gaming: [],
            ai: [],
            blockchain: [],
            apis: [],
            configs: [],
            duplicates: []
        };
        
        for (const [hash, file] of this.archives.byContent) {
            // Index unified files
            if (file.unified) {
                searchIndex.unified.push(file);
            }
            
            // Index launchers
            if (file.launcher) {
                searchIndex.launchers.push(file);
            }
            
            // Index by purpose
            for (const purpose of file.purposes) {
                if (searchIndex[purpose]) {
                    searchIndex[purpose].push(file);
                }
            }
        }
        
        // Index duplicates
        for (const [hash, files] of this.archives.duplicates) {
            searchIndex.duplicates.push({
                hash,
                count: files.length,
                files
            });
        }
        
        this.searchIndex = searchIndex;
        console.log(`  ✅ Created semantic index with ${Object.keys(searchIndex).length} categories\n`);
    }
    
    async buildWaybackInterface() {
        // Create summary for interface (instead of full data)
        const summary = {
            stats: {
                totalFiles: this.archives.byContent.size,
                duplicateGroups: this.archives.duplicates.size,
                unified: this.searchIndex.unified.length,
                launchers: this.searchIndex.launchers.length,
                gaming: this.searchIndex.gaming.length,
                ai: this.searchIndex.ai.length,
                blockchain: this.searchIndex.blockchain.length
            },
            categories: {}
        };
        
        // Create limited samples for each category
        for (const [category, files] of Object.entries(this.searchIndex)) {
            summary.categories[category] = files.slice(0, 20).map(file => ({
                path: file.path,
                purposes: file.purposes,
                patterns: file.patterns,
                size: file.size
            }));
        }
        
        const interfaceHTML = `<!DOCTYPE html>
<html>
<head>
    <title>Wayback Machine Librarian - Find Your Built Shit</title>
    <style>
        body { font-family: monospace; background: #0a0a0a; color: #00ff00; margin: 0; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #00ff00; margin-bottom: 20px; }
        .search-box { width: 100%; padding: 10px; background: #1a1a1a; color: #00ff00; border: 1px solid #00ff00; }
        .results { margin-top: 20px; }
        .category { margin: 20px 0; border: 1px solid #00ff00; padding: 10px; }
        .file-item { margin: 5px 0; padding: 5px; background: #1a1a1a; }
        .file-path { color: #ffff00; font-size: 12px; }
        .file-purposes { color: #ff6600; font-size: 11px; }
        .stats { text-align: center; margin: 20px 0; }
        .note { color: #ffff00; text-align: center; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🕰️ WAYBACK MACHINE LIBRARIAN</h1>
        <p>Find all the shit you've already built multiple times</p>
        <div class="note">Full archive in wayback-archive.json (${this.archives.byContent.size} files)</div>
    </div>
    
    <input type="text" class="search-box" id="searchBox" placeholder="Search for: launcher, gaming, ai, unified, etc...">
    
    <div class="stats">
        <p>📊 Total Files: ${summary.stats.totalFiles}</p>
        <p>🎯 Unified Files: ${summary.stats.unified}</p>
        <p>🚀 Launchers: ${summary.stats.launchers}</p>
        <p>🎮 Gaming: ${summary.stats.gaming}</p>
        <p>🤖 AI: ${summary.stats.ai}</p>
        <p>⛓️ Blockchain: ${summary.stats.blockchain}</p>
    </div>
    
    <div class="results" id="results">
        <!-- Results will be populated by JavaScript -->
    </div>
    
    <script>
        const searchData = ${JSON.stringify(summary.categories, null, 2)};
        
        function search(query) {
            const results = document.getElementById('results');
            results.innerHTML = '';
            
            if (!query) {
                showAllCategories();
                return;
            }
            
            for (const [category, files] of Object.entries(searchData)) {
                const matches = files.filter(file => 
                    file.path.toLowerCase().includes(query.toLowerCase()) ||
                    file.purposes.some(p => p.toLowerCase().includes(query.toLowerCase())) ||
                    file.patterns.some(p => p.toLowerCase().includes(query.toLowerCase()))
                );
                
                if (matches.length > 0) {
                    showCategory(category, matches);
                }
            }
        }
        
        function showAllCategories() {
            const results = document.getElementById('results');
            
            for (const [category, files] of Object.entries(searchData)) {
                if (files.length > 0) {
                    showCategory(category, files.slice(0, 10));
                }
            }
        }
        
        function showCategory(category, files) {
            const results = document.getElementById('results');
            
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'category';
            categoryDiv.innerHTML = \`<h3>📁 \${category.toUpperCase()} (\${files.length} files shown)</h3>\`;
            
            files.forEach(file => {
                const fileDiv = document.createElement('div');
                fileDiv.className = 'file-item';
                fileDiv.innerHTML = \`
                    <div class="file-path">📄 \${file.path}</div>
                    <div class="file-purposes">🎯 \${file.purposes.join(', ')}</div>
                    \${file.patterns.length > 0 ? \`<div style="color: #66ccff; font-size: 11px;">🔧 \${file.patterns.join(', ')}</div>\` : ''}
                \`;
                categoryDiv.appendChild(fileDiv);
            });
            
            results.appendChild(categoryDiv);
        }
        
        document.getElementById('searchBox').addEventListener('input', (e) => {
            search(e.target.value);
        });
        
        showAllCategories();
    </script>
</body>
</html>`;
        
        await fs.writeFile('wayback-machine-interface.html', interfaceHTML);
        console.log('  ✅ Built wayback interface: wayback-machine-interface.html\n');
    }
    
    async generateArchive() {
        const archive = {
            generated: new Date().toISOString(),
            totalFiles: this.archives.byContent.size,
            duplicateGroups: this.archives.duplicates.size,
            
            summary: {
                unifiedFiles: this.searchIndex.unified?.length || 0,
                launchers: this.searchIndex.launchers?.length || 0,
                gamingSystems: this.searchIndex.gaming?.length || 0,
                aiSystems: this.searchIndex.ai?.length || 0,
                blockchainSystems: this.searchIndex.blockchain?.length || 0,
                apiSystems: this.searchIndex.api?.length || 0,
                configFiles: this.searchIndex.config?.length || 0
            },
            
            topDuplicates: Array.from(this.archives.duplicates.entries())
                .sort((a, b) => b[1].length - a[1].length)
                .slice(0, 20)
                .map(([hash, files]) => ({
                    hash: hash.substring(0, 8),
                    count: files.length,
                    size: files[0].size,
                    files: files.map(f => f.path)
                })),
            
            unifiedFiles: (this.searchIndex.unified || []).map(f => ({
                path: f.path,
                purposes: f.purposes,
                patterns: f.patterns,
                size: f.size
            })),
            
            launchers: (this.searchIndex.launchers || []).map(f => ({
                path: f.path,
                purposes: f.purposes,
                patterns: f.patterns
            })),
            
            searchIndex: this.searchIndex
        };
        
        // Split into smaller files
        await fs.writeFile('wayback-summary.json', JSON.stringify({
            generated: archive.generated,
            totalFiles: archive.totalFiles,
            duplicateGroups: archive.duplicateGroups,
            summary: archive.summary,
            topDuplicates: archive.topDuplicates,
            unifiedFiles: archive.unifiedFiles.slice(0, 50),
            launchers: archive.launchers.slice(0, 50)
        }, null, 2));
        
        // Save limited search index
        const limitedIndex = {};
        for (const [key, files] of Object.entries(this.searchIndex)) {
            limitedIndex[key] = files.slice(0, 100).map(f => ({
                path: f.path,
                purposes: f.purposes,
                patterns: f.patterns
            }));
        }
        await fs.writeFile('wayback-search-index.json', JSON.stringify(limitedIndex, null, 2));
        
        // Create simple text summary
        const textSummary = `
WAYBACK MACHINE LIBRARIAN SUMMARY
=================================

📊 TOTALS:
- Total Files Scanned: ${archive.totalFiles}
- Duplicate Groups: ${archive.duplicateGroups}
- Unified Files Found: ${archive.summary.unifiedFiles}
- Launcher Scripts: ${archive.summary.launchers}

🎮 SYSTEM BREAKDOWN:
- Gaming Systems: ${archive.summary.gamingSystems}
- AI Systems: ${archive.summary.aiSystems}
- Blockchain Systems: ${archive.summary.blockchainSystems}
- API Systems: ${archive.summary.apiSystems}
- Config Files: ${archive.summary.configFiles}

🔄 TOP DUPLICATE GROUPS:
${archive.topDuplicates.slice(0, 10).map(d => 
    `- ${d.count} copies of files (${d.files[0]})`
).join('\n')}

🚀 UNIFIED FILES FOUND:
${archive.unifiedFiles.slice(0, 10).map(f => 
    `- ${f.path} (${f.purposes.join(', ')})`
).join('\n')}

✅ NOW YOU CAN FIND ALL YOUR EXISTING SHIT!
Open wayback-machine-interface.html in a browser to search.
`;
        
        await fs.writeFile('wayback-summary.txt', textSummary);
        
        console.log('📊 SUMMARY');
        console.log('==========');
        console.log(textSummary);
        console.log('\n🎯 NEXT STEPS:');
        console.log('1. Open wayback-machine-interface.html in browser');
        console.log('2. Search for "unified" to see all your unified files');
        console.log('3. Search for "launcher" to see all 200+ launchers');
        console.log('4. Search for "duplicate" to see what you built multiple times');
        console.log('5. Use the blockchain folding bridge to prepare for Solidity');
    }
    
    getFileType(ext) {
        const typeMap = {
            '.js': 'javascript',
            '.ts': 'typescript',
            '.py': 'python',
            '.sh': 'bash',
            '.sql': 'database',
            '.html': 'web',
            '.css': 'stylesheet',
            '.json': 'config',
            '.md': 'documentation',
            '.sol': 'solidity',
            '.yml': 'config',
            '.yaml': 'config'
        };
        
        return typeMap[ext] || 'unknown';
    }
}

// Run the wayback machine
if (require.main === module) {
    const librarian = new WaybackMachineLibrarian();
    librarian.buildWaybackMachine().catch(console.error);
}

module.exports = WaybackMachineLibrarian;