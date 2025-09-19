#!/usr/bin/env node

/**
 * CODEBASE FILE INDEXER
 * Indexes all files by type, finds duplicates, and analyzes code patterns
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class CodebaseFileIndexer {
    constructor() {
        this.rootPath = process.cwd();
        this.fileIndex = {
            byExtension: new Map(),
            byLanguage: new Map(),
            bySize: new Map(),
            byHash: new Map(),
            duplicates: new Map(),
            similar: new Map(),
            dependencies: {
                python: new Map(), // requirements.txt files
                node: new Map(),   // package.json files
                ruby: new Map(),   // Gemfile
                php: new Map(),    // composer.json
                go: new Map(),     // go.mod
                rust: new Map(),   // Cargo.toml
                java: new Map(),   // pom.xml, build.gradle
            }
        };
        
        // Language mappings
        this.languageMap = {
            '.js': 'javascript',
            '.mjs': 'javascript',
            '.jsx': 'javascript',
            '.ts': 'typescript',
            '.tsx': 'typescript',
            '.py': 'python',
            '.pyw': 'python',
            '.rb': 'ruby',
            '.php': 'php',
            '.go': 'go',
            '.rs': 'rust',
            '.java': 'java',
            '.c': 'c',
            '.cpp': 'cpp',
            '.h': 'c',
            '.hpp': 'cpp',
            '.cs': 'csharp',
            '.swift': 'swift',
            '.kt': 'kotlin',
            '.scala': 'scala',
            '.r': 'r',
            '.R': 'r',
            '.m': 'objective-c',
            '.mm': 'objective-c',
            '.lua': 'lua',
            '.pl': 'perl',
            '.sh': 'bash',
            '.bash': 'bash',
            '.zsh': 'zsh',
            '.fish': 'fish',
            '.ps1': 'powershell',
            '.sql': 'sql',
            '.html': 'html',
            '.htm': 'html',
            '.xml': 'xml',
            '.css': 'css',
            '.scss': 'scss',
            '.sass': 'sass',
            '.less': 'less',
            '.json': 'json',
            '.yaml': 'yaml',
            '.yml': 'yaml',
            '.toml': 'toml',
            '.ini': 'ini',
            '.conf': 'config',
            '.cfg': 'config',
            '.md': 'markdown',
            '.markdown': 'markdown',
            '.rst': 'restructuredtext',
            '.tex': 'latex',
            '.vue': 'vue',
            '.svelte': 'svelte',
            '.elm': 'elm',
            '.clj': 'clojure',
            '.cljs': 'clojurescript',
            '.ex': 'elixir',
            '.exs': 'elixir',
            '.erl': 'erlang',
            '.hrl': 'erlang',
            '.dart': 'dart',
            '.nim': 'nim',
            '.v': 'v',
            '.zig': 'zig',
            '.sol': 'solidity'
        };
        
        // Dependency file patterns
        this.dependencyFiles = {
            'requirements.txt': 'python',
            'requirements.in': 'python',
            'Pipfile': 'python',
            'pyproject.toml': 'python',
            'setup.py': 'python',
            'setup.cfg': 'python',
            'package.json': 'node',
            'package-lock.json': 'node',
            'yarn.lock': 'node',
            'pnpm-lock.yaml': 'node',
            'Gemfile': 'ruby',
            'Gemfile.lock': 'ruby',
            'composer.json': 'php',
            'composer.lock': 'php',
            'go.mod': 'go',
            'go.sum': 'go',
            'Cargo.toml': 'rust',
            'Cargo.lock': 'rust',
            'pom.xml': 'java',
            'build.gradle': 'java',
            'build.gradle.kts': 'java'
        };
        
        // Files to ignore
        this.ignorePatterns = [
            'node_modules',
            '.git',
            '.svn',
            '.hg',
            '__pycache__',
            '.pytest_cache',
            '.mypy_cache',
            '.tox',
            'venv',
            'env',
            '.env',
            'dist',
            'build',
            'target',
            '.idea',
            '.vscode',
            '.DS_Store',
            'Thumbs.db',
            '*.pyc',
            '*.pyo',
            '*.class',
            '*.o',
            '*.so',
            '*.dylib',
            '*.dll',
            '*.exe'
        ];
    }
    
    async indexCodebase() {
        console.log('🔍 CODEBASE FILE INDEXER');
        console.log('=======================');
        console.log(`📁 Root: ${this.rootPath}`);
        console.log('');
        
        // Phase 1: Collect all files
        console.log('📊 Phase 1: Collecting all files...');
        const allFiles = await this.collectAllFiles(this.rootPath);
        console.log(`✅ Found ${allFiles.length} files\n`);
        
        // Phase 2: Index by type and language
        console.log('🗂️ Phase 2: Indexing by type and language...');
        await this.indexFiles(allFiles);
        
        // Phase 3: Find dependencies
        console.log('📦 Phase 3: Finding dependency files...');
        await this.findDependencies(allFiles);
        
        // Phase 4: Calculate hashes and find duplicates
        console.log('🔍 Phase 4: Finding duplicate files...');
        await this.findDuplicates(allFiles);
        
        // Phase 5: Find similar code structures
        console.log('🧬 Phase 5: Finding similar code patterns...');
        await this.findSimilarCode();
        
        // Phase 6: Generate report
        console.log('📄 Phase 6: Generating report...');
        await this.generateReport();
        
        console.log('\n✅ Indexing complete!');
    }
    
    async collectAllFiles(dir, files = []) {
        try {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                
                // Skip ignored patterns
                if (this.shouldIgnore(entry.name)) continue;
                
                if (entry.isDirectory()) {
                    await this.collectAllFiles(fullPath, files);
                } else if (entry.isFile()) {
                    files.push(fullPath);
                }
            }
        } catch (error) {
            // Skip directories we can't read
        }
        
        return files;
    }
    
    shouldIgnore(name) {
        return this.ignorePatterns.some(pattern => {
            if (pattern.includes('*')) {
                const regex = new RegExp(pattern.replace('*', '.*'));
                return regex.test(name);
            }
            return name === pattern;
        });
    }
    
    async indexFiles(files) {
        let processed = 0;
        
        for (const file of files) {
            try {
                const stats = await fs.stat(file);
                const ext = path.extname(file).toLowerCase();
                const basename = path.basename(file);
                const language = this.languageMap[ext] || 'unknown';
                
                // Index by extension
                if (!this.fileIndex.byExtension.has(ext)) {
                    this.fileIndex.byExtension.set(ext, []);
                }
                this.fileIndex.byExtension.get(ext).push({
                    path: file,
                    size: stats.size,
                    modified: stats.mtime
                });
                
                // Index by language
                if (!this.fileIndex.byLanguage.has(language)) {
                    this.fileIndex.byLanguage.set(language, []);
                }
                this.fileIndex.byLanguage.get(language).push({
                    path: file,
                    size: stats.size,
                    modified: stats.mtime
                });
                
                // Index by size
                const sizeCategory = this.getSizeCategory(stats.size);
                if (!this.fileIndex.bySize.has(sizeCategory)) {
                    this.fileIndex.bySize.set(sizeCategory, []);
                }
                this.fileIndex.bySize.get(sizeCategory).push({
                    path: file,
                    size: stats.size,
                    language
                });
                
                processed++;
                if (processed % 1000 === 0) {
                    console.log(`  Processed ${processed}/${files.length} files...`);
                }
                
            } catch (error) {
                // Skip files we can't stat
            }
        }
        
        console.log(`✅ Indexed ${processed} files\n`);
    }
    
    getSizeCategory(size) {
        if (size < 1024) return 'tiny';           // < 1KB
        if (size < 10240) return 'small';         // < 10KB
        if (size < 102400) return 'medium';       // < 100KB
        if (size < 1048576) return 'large';       // < 1MB
        if (size < 10485760) return 'xlarge';     // < 10MB
        return 'huge';                            // >= 10MB
    }
    
    async findDependencies(files) {
        for (const file of files) {
            const basename = path.basename(file);
            
            if (this.dependencyFiles[basename]) {
                const type = this.dependencyFiles[basename];
                
                try {
                    const content = await fs.readFile(file, 'utf8');
                    const deps = this.parseDependencies(content, type, basename);
                    
                    this.fileIndex.dependencies[type].set(file, deps);
                    
                } catch (error) {
                    // Skip files we can't read
                }
            }
        }
        
        // Log dependency summary
        for (const [type, deps] of Object.entries(this.fileIndex.dependencies)) {
            if (deps.size > 0) {
                console.log(`  Found ${deps.size} ${type} dependency files`);
            }
        }
        console.log('');
    }
    
    parseDependencies(content, type, filename) {
        const deps = [];
        
        try {
            switch (type) {
                case 'python':
                    if (filename === 'requirements.txt' || filename === 'requirements.in') {
                        const lines = content.split('\n');
                        for (const line of lines) {
                            const trimmed = line.trim();
                            if (trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('-')) {
                                deps.push(trimmed.split(/[<>=!]/)[0].trim());
                            }
                        }
                    } else if (filename === 'setup.py') {
                        const match = content.match(/install_requires\s*=\s*\[([\s\S]*?)\]/);
                        if (match) {
                            const requires = match[1].match(/'([^']+)'|"([^"]+)"/g);
                            if (requires) {
                                requires.forEach(req => {
                                    deps.push(req.replace(/['",]/g, '').split(/[<>=!]/)[0].trim());
                                });
                            }
                        }
                    }
                    break;
                    
                case 'node':
                    if (filename === 'package.json') {
                        const pkg = JSON.parse(content);
                        if (pkg.dependencies) {
                            deps.push(...Object.keys(pkg.dependencies));
                        }
                        if (pkg.devDependencies) {
                            deps.push(...Object.keys(pkg.devDependencies));
                        }
                    }
                    break;
                    
                case 'ruby':
                    if (filename === 'Gemfile') {
                        const gems = content.match(/gem\s+['"]([^'"]+)['"]/g);
                        if (gems) {
                            gems.forEach(gem => {
                                const match = gem.match(/gem\s+['"]([^'"]+)['"]/);
                                if (match) deps.push(match[1]);
                            });
                        }
                    }
                    break;
                    
                case 'php':
                    if (filename === 'composer.json') {
                        const composer = JSON.parse(content);
                        if (composer.require) {
                            deps.push(...Object.keys(composer.require));
                        }
                    }
                    break;
                    
                case 'go':
                    if (filename === 'go.mod') {
                        const requires = content.match(/require\s+\(([\s\S]*?)\)/);
                        if (requires) {
                            const modules = requires[1].match(/\S+\s+v[\d.]+/g);
                            if (modules) {
                                modules.forEach(mod => {
                                    deps.push(mod.split(/\s+/)[0]);
                                });
                            }
                        }
                    }
                    break;
            }
        } catch (error) {
            // Parsing error, skip
        }
        
        return deps;
    }
    
    async findDuplicates(files) {
        let processed = 0;
        const hashMap = new Map();
        
        for (const file of files) {
            try {
                const stats = await fs.stat(file);
                
                // Only hash files under 10MB to avoid memory issues
                if (stats.size < 10485760) {
                    const content = await fs.readFile(file);
                    const hash = crypto.createHash('sha256').update(content).digest('hex');
                    
                    if (!hashMap.has(hash)) {
                        hashMap.set(hash, []);
                    }
                    hashMap.get(hash).push({
                        path: file,
                        size: stats.size
                    });
                    
                    this.fileIndex.byHash.set(file, hash);
                }
                
                processed++;
                if (processed % 1000 === 0) {
                    console.log(`  Hashed ${processed}/${files.length} files...`);
                }
                
            } catch (error) {
                // Skip files we can't read
            }
        }
        
        // Find duplicates
        let duplicateCount = 0;
        for (const [hash, fileList] of hashMap) {
            if (fileList.length > 1) {
                this.fileIndex.duplicates.set(hash, fileList);
                duplicateCount += fileList.length - 1;
            }
        }
        
        console.log(`✅ Found ${duplicateCount} duplicate files\n`);
    }
    
    async findSimilarCode() {
        const codeFiles = [];
        
        // Collect all code files
        for (const [ext, language] of Object.entries(this.languageMap)) {
            if (['javascript', 'typescript', 'python', 'java', 'go', 'rust'].includes(language)) {
                const files = this.fileIndex.byExtension.get(ext) || [];
                codeFiles.push(...files.map(f => ({ ...f, language })));
            }
        }
        
        console.log(`  Analyzing ${codeFiles.length} code files for patterns...`);
        
        // Group by similar file names
        const nameGroups = new Map();
        
        for (const file of codeFiles) {
            const basename = path.basename(file.path);
            const normalized = basename
                .toLowerCase()
                .replace(/[-_]/g, '')
                .replace(/\.(js|ts|py|java|go|rs)$/, '');
            
            if (!nameGroups.has(normalized)) {
                nameGroups.set(normalized, []);
            }
            nameGroups.get(normalized).push(file);
        }
        
        // Find similar names
        for (const [name, files] of nameGroups) {
            if (files.length > 1) {
                this.fileIndex.similar.set(name, files);
            }
        }
        
        console.log(`✅ Found ${this.fileIndex.similar.size} groups of similar files\n`);
    }
    
    async generateReport() {
        const report = {
            summary: {
                totalFiles: 0,
                totalSize: 0,
                languages: {},
                extensions: {},
                duplicates: this.fileIndex.duplicates.size,
                similarGroups: this.fileIndex.similar.size
            },
            languages: {},
            extensions: {},
            dependencies: {},
            duplicates: [],
            similar: [],
            largestFiles: []
        };
        
        // Calculate totals
        for (const [ext, files] of this.fileIndex.byExtension) {
            report.extensions[ext] = files.length;
            report.summary.totalFiles += files.length;
            report.summary.totalSize += files.reduce((sum, f) => sum + f.size, 0);
        }
        
        for (const [lang, files] of this.fileIndex.byLanguage) {
            report.languages[lang] = {
                count: files.length,
                totalSize: files.reduce((sum, f) => sum + f.size, 0),
                avgSize: Math.round(files.reduce((sum, f) => sum + f.size, 0) / files.length)
            };
            report.summary.languages[lang] = files.length;
        }
        
        // Dependencies
        for (const [type, deps] of Object.entries(this.fileIndex.dependencies)) {
            if (deps.size > 0) {
                report.dependencies[type] = [];
                for (const [file, depList] of deps) {
                    report.dependencies[type].push({
                        file: path.relative(this.rootPath, file),
                        count: depList.length,
                        dependencies: depList.slice(0, 10) // First 10
                    });
                }
            }
        }
        
        // Duplicates
        for (const [hash, files] of this.fileIndex.duplicates) {
            report.duplicates.push({
                hash: hash.substring(0, 8),
                count: files.length,
                size: files[0].size,
                files: files.map(f => path.relative(this.rootPath, f.path))
            });
        }
        
        // Similar files
        for (const [name, files] of this.fileIndex.similar) {
            report.similar.push({
                pattern: name,
                count: files.length,
                files: files.map(f => ({
                    path: path.relative(this.rootPath, f.path),
                    language: f.language,
                    size: f.size
                }))
            });
        }
        
        // Find largest files
        const allFiles = [];
        for (const files of this.fileIndex.byExtension.values()) {
            allFiles.push(...files);
        }
        allFiles.sort((a, b) => b.size - a.size);
        report.largestFiles = allFiles.slice(0, 20).map(f => ({
            path: path.relative(this.rootPath, f.path),
            size: this.formatSize(f.size),
            sizeBytes: f.size
        }));
        
        // Save report
        await fs.writeFile(
            'codebase-index-report.json',
            JSON.stringify(report, null, 2)
        );
        
        // Print summary
        console.log('📊 SUMMARY');
        console.log('==========');
        console.log(`Total Files: ${report.summary.totalFiles.toLocaleString()}`);
        console.log(`Total Size: ${this.formatSize(report.summary.totalSize)}`);
        console.log(`Duplicate Files: ${report.duplicates.length}`);
        console.log(`Similar File Groups: ${report.similar.length}`);
        console.log('');
        
        console.log('📈 TOP LANGUAGES');
        console.log('================');
        const topLangs = Object.entries(report.languages)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 10);
        
        for (const [lang, data] of topLangs) {
            console.log(`${lang}: ${data.count} files (${this.formatSize(data.totalSize)})`);
        }
        console.log('');
        
        console.log('📦 DEPENDENCIES');
        console.log('===============');
        for (const [type, deps] of Object.entries(report.dependencies)) {
            console.log(`${type}: ${deps.length} files`);
            for (const dep of deps.slice(0, 3)) {
                console.log(`  ${dep.file}: ${dep.count} dependencies`);
            }
        }
        
        console.log('\n✅ Report saved to: codebase-index-report.json');
    }
    
    formatSize(bytes) {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unit = 0;
        
        while (size >= 1024 && unit < units.length - 1) {
            size /= 1024;
            unit++;
        }
        
        return `${size.toFixed(2)} ${units[unit]}`;
    }
}

// Run the indexer
const indexer = new CodebaseFileIndexer();
indexer.indexCodebase().catch(console.error);