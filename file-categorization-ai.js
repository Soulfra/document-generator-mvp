#!/usr/bin/env node

/**
 * 🤖 FILE CATEGORIZATION AI 🤖
 * 
 * Uses AI to intelligently categorize, organize, and analyze
 * 30,000+ files by purpose rather than just extension
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

class FileCategorizationAI {
    constructor(options = {}) {
        this.rootDir = options.rootDir || process.cwd();
        this.outputDir = path.join(this.rootDir, 'file-categorization-output');
        this.indexPath = path.join(this.outputDir, 'semantic-file-index.json');
        
        // File categories based on purpose
        this.categories = {
            'frontend-ui': {
                description: 'User interface components and views',
                patterns: ['component', 'view', 'page', 'ui', 'interface'],
                extensions: ['.tsx', '.jsx', '.vue', '.svelte']
            },
            'backend-api': {
                description: 'API endpoints and server logic',
                patterns: ['api', 'route', 'controller', 'endpoint', 'server'],
                extensions: ['.js', '.ts', '.py']
            },
            'database': {
                description: 'Database schemas and migrations',
                patterns: ['schema', 'model', 'migration', 'db', 'table'],
                extensions: ['.sql', '.js', '.ts']
            },
            'authentication': {
                description: 'Authentication and authorization',
                patterns: ['auth', 'login', 'jwt', 'session', 'oauth'],
                extensions: ['.js', '.ts', '.py']
            },
            'ai-ml': {
                description: 'AI/ML models and processing',
                patterns: ['ai', 'ml', 'llm', 'model', 'train', 'predict'],
                extensions: ['.py', '.js', '.ts']
            },
            'blockchain': {
                description: 'Blockchain and smart contracts',
                patterns: ['blockchain', 'contract', 'wallet', 'crypto', 'web3'],
                extensions: ['.sol', '.js', '.ts']
            },
            'configuration': {
                description: 'Configuration and settings',
                patterns: ['config', 'settings', 'env', 'constants'],
                extensions: ['.json', '.yaml', '.yml', '.env']
            },
            'documentation': {
                description: 'Documentation and guides',
                patterns: ['readme', 'doc', 'guide', 'manual', 'spec'],
                extensions: ['.md', '.txt', '.rst']
            },
            'testing': {
                description: 'Test files and specs',
                patterns: ['test', 'spec', 'e2e', 'unit', 'integration'],
                extensions: ['.test.js', '.spec.js', '.test.ts', '.spec.ts']
            },
            'styling': {
                description: 'Styles and themes',
                patterns: ['style', 'css', 'theme', 'sass', 'scss'],
                extensions: ['.css', '.scss', '.sass', '.less']
            },
            'build-tools': {
                description: 'Build and deployment scripts',
                patterns: ['build', 'webpack', 'rollup', 'deploy', 'docker'],
                extensions: ['.js', '.sh', '.yml']
            },
            'utility': {
                description: 'Utility functions and helpers',
                patterns: ['util', 'helper', 'lib', 'common', 'shared'],
                extensions: ['.js', '.ts', '.py']
            }
        };
        
        // File analysis results
        this.fileIndex = new Map();
        this.categoryStats = new Map();
        this.duplicates = new Map();
        this.unusedFiles = new Set();
        
        // AI patterns for semantic analysis
        this.semanticPatterns = {
            purpose: /(?:purpose|goal|objective|function|responsibility):\s*(.+)/i,
            todo: /(?:TODO|FIXME|HACK|XXX|NOTE):\s*(.+)/i,
            deprecated: /(?:@deprecated|DEPRECATED|obsolete|legacy)/i,
            experimental: /(?:@experimental|EXPERIMENTAL|beta|alpha|wip)/i
        };
        
        console.log('🤖 File Categorization AI initializing...');
    }
    
    async analyze() {
        console.log('\n📂 Starting intelligent file analysis...\n');
        
        // Create output directory
        await fs.mkdir(this.outputDir, { recursive: true });
        
        // Phase 1: Scan all files
        await this.scanFiles();
        
        // Phase 2: Semantic analysis
        await this.performSemanticAnalysis();
        
        // Phase 3: Find duplicates
        await this.findDuplicates();
        
        // Phase 4: Detect unused files
        await this.detectUnusedFiles();
        
        // Phase 5: Generate organization plan
        await this.generateOrganizationPlan();
        
        // Phase 6: Create reports
        await this.generateReports();
        
        console.log('\n✅ Analysis complete!');
    }
    
    async scanFiles() {
        console.log('🔍 Scanning file system...');
        
        const startTime = Date.now();
        await this.scanDirectory(this.rootDir);
        const duration = Date.now() - startTime;
        
        console.log(`   Scanned ${this.fileIndex.size} files in ${(duration / 1000).toFixed(2)}s`);
    }
    
    async scanDirectory(dir) {
        try {
            const items = await fs.readdir(dir);
            
            for (const item of items) {
                // Skip common exclusions
                if (this.shouldSkip(item)) continue;
                
                const fullPath = path.join(dir, item);
                const stat = await fs.stat(fullPath);
                
                if (stat.isDirectory()) {
                    await this.scanDirectory(fullPath);
                } else {
                    await this.indexFile(fullPath, stat);
                }
            }
        } catch (error) {
            // Skip directories we can't read
        }
    }
    
    shouldSkip(name) {
        const skipPatterns = [
            'node_modules',
            '.git',
            '.next',
            'dist',
            'build',
            'coverage',
            '.cache',
            'tmp',
            '.DS_Store'
        ];
        
        return skipPatterns.some(pattern => name.includes(pattern));
    }
    
    async indexFile(filePath, stat) {
        const relativePath = path.relative(this.rootDir, filePath);
        const ext = path.extname(filePath);
        const name = path.basename(filePath);
        
        const fileInfo = {
            path: relativePath,
            name,
            ext,
            size: stat.size,
            modified: stat.mtime,
            category: 'uncategorized',
            purpose: 'unknown',
            hash: null,
            content: null,
            metadata: {
                lines: 0,
                imports: [],
                exports: [],
                classes: [],
                functions: [],
                todos: [],
                tags: []
            }
        };
        
        // Initial categorization by extension and name
        fileInfo.category = this.categorizeByPattern(name, ext);
        
        // Store in index
        this.fileIndex.set(relativePath, fileInfo);
        
        // Update category stats
        if (!this.categoryStats.has(fileInfo.category)) {
            this.categoryStats.set(fileInfo.category, {
                count: 0,
                totalSize: 0,
                extensions: new Set()
            });
        }
        
        const stats = this.categoryStats.get(fileInfo.category);
        stats.count++;
        stats.totalSize += stat.size;
        stats.extensions.add(ext);
    }
    
    categorizeByPattern(name, ext) {
        const nameLower = name.toLowerCase();
        
        for (const [category, config] of Object.entries(this.categories)) {
            // Check extensions
            if (config.extensions.some(e => name.endsWith(e) || ext === e)) {
                return category;
            }
            
            // Check patterns in filename
            if (config.patterns.some(pattern => nameLower.includes(pattern))) {
                return category;
            }
        }
        
        // Special cases
        if (ext === '.html') return 'frontend-ui';
        if (ext === '.py') return 'backend-api';
        if (ext === '.sh') return 'build-tools';
        if (ext === '.json' && name.includes('package')) return 'configuration';
        
        return 'uncategorized';
    }
    
    async performSemanticAnalysis() {
        console.log('\n🧠 Performing semantic analysis...');
        
        const filesToAnalyze = Array.from(this.fileIndex.entries())
            .filter(([, info]) => this.isAnalyzable(info));
        
        console.log(`   Analyzing ${filesToAnalyze.length} files for semantic content...`);
        
        let analyzed = 0;
        const batchSize = 100;
        
        for (let i = 0; i < filesToAnalyze.length; i += batchSize) {
            const batch = filesToAnalyze.slice(i, i + batchSize);
            await Promise.all(batch.map(([path, info]) => this.analyzeFileContent(path, info)));
            
            analyzed += batch.length;
            if (analyzed % 1000 === 0) {
                console.log(`   Analyzed ${analyzed}/${filesToAnalyze.length} files...`);
            }
        }
    }
    
    isAnalyzable(fileInfo) {
        const analyzableExts = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.md', '.txt'];
        const maxSize = 1024 * 1024; // 1MB
        
        return analyzableExts.includes(fileInfo.ext) && fileInfo.size < maxSize;
    }
    
    async analyzeFileContent(relativePath, fileInfo) {
        try {
            const fullPath = path.join(this.rootDir, relativePath);
            const content = await fs.readFile(fullPath, 'utf-8');
            
            // Store first 500 chars for preview
            fileInfo.content = content.substring(0, 500);
            
            // Count lines
            fileInfo.metadata.lines = content.split('\n').length;
            
            // Calculate file hash for duplicate detection
            fileInfo.hash = crypto.createHash('md5').update(content).digest('hex');
            
            // Extract imports/requires
            const imports = this.extractImports(content, fileInfo.ext);
            fileInfo.metadata.imports = imports;
            
            // Extract exports
            const exports = this.extractExports(content, fileInfo.ext);
            fileInfo.metadata.exports = exports;
            
            // Extract classes and functions
            const structures = this.extractStructures(content, fileInfo.ext);
            fileInfo.metadata.classes = structures.classes;
            fileInfo.metadata.functions = structures.functions;
            
            // Find TODOs and notes
            const todos = this.extractTodos(content);
            fileInfo.metadata.todos = todos;
            
            // Determine purpose from content
            fileInfo.purpose = this.determinePurpose(content, fileInfo);
            
            // Extract tags and keywords
            fileInfo.metadata.tags = this.extractTags(content);
            
            // Re-categorize based on content
            const betterCategory = this.recategorizeByContent(fileInfo);
            if (betterCategory !== fileInfo.category) {
                // Update stats
                this.updateCategoryStats(fileInfo.category, betterCategory, fileInfo);
                fileInfo.category = betterCategory;
            }
            
        } catch (error) {
            // Skip files that can't be read
        }
    }
    
    extractImports(content, ext) {
        const imports = [];
        
        if (['.js', '.ts', '.jsx', '.tsx'].includes(ext)) {
            // ES6 imports
            const es6Imports = content.match(/import\s+(?:.*\s+from\s+)?['"]([^'"]+)['"]/g) || [];
            imports.push(...es6Imports.map(i => i.match(/['"]([^'"]+)['"]/)[1]));
            
            // CommonJS requires
            const requires = content.match(/require\s*\(\s*['"]([^'"]+)['"]\s*\)/g) || [];
            imports.push(...requires.map(r => r.match(/['"]([^'"]+)['"]/)[1]));
        }
        
        if (ext === '.py') {
            // Python imports
            const pyImports = content.match(/(?:from\s+(\S+)\s+)?import\s+/g) || [];
            imports.push(...pyImports.map(i => i.split(/\s+/)[1] || '').filter(Boolean));
        }
        
        return [...new Set(imports)];
    }
    
    extractExports(content, ext) {
        const exports = [];
        
        if (['.js', '.ts', '.jsx', '.tsx'].includes(ext)) {
            // ES6 exports
            const es6Exports = content.match(/export\s+(?:default\s+)?(?:class|function|const|let|var)\s+(\w+)/g) || [];
            exports.push(...es6Exports.map(e => e.match(/\w+$/)[0]));
            
            // CommonJS exports
            if (content.includes('module.exports')) {
                exports.push('module.exports');
            }
        }
        
        return [...new Set(exports)];
    }
    
    extractStructures(content, ext) {
        const structures = {
            classes: [],
            functions: []
        };
        
        if (['.js', '.ts', '.jsx', '.tsx'].includes(ext)) {
            // Classes
            const classes = content.match(/class\s+(\w+)/g) || [];
            structures.classes = classes.map(c => c.replace('class ', ''));
            
            // Functions
            const functions = content.match(/(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)\s*=>|\([^)]*\)\s*{))/g) || [];
            structures.functions = functions.map(f => {
                const match = f.match(/(?:function\s+|const\s+)(\w+)/);
                return match ? match[1] : '';
            }).filter(Boolean);
        }
        
        if (ext === '.py') {
            // Python classes
            const pyClasses = content.match(/class\s+(\w+)/g) || [];
            structures.classes = pyClasses.map(c => c.replace('class ', ''));
            
            // Python functions
            const pyFunctions = content.match(/def\s+(\w+)/g) || [];
            structures.functions = pyFunctions.map(f => f.replace('def ', ''));
        }
        
        return structures;
    }
    
    extractTodos(content) {
        const todos = [];
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
            const match = line.match(this.semanticPatterns.todo);
            if (match) {
                todos.push({
                    line: index + 1,
                    text: match[1].trim()
                });
            }
        });
        
        return todos;
    }
    
    determinePurpose(content, fileInfo) {
        // Check for explicit purpose comments
        const purposeMatch = content.match(this.semanticPatterns.purpose);
        if (purposeMatch) {
            return purposeMatch[1].trim();
        }
        
        // Infer from content
        const { classes, functions } = fileInfo.metadata;
        
        if (classes.some(c => c.includes('Component') || c.includes('View'))) {
            return 'UI component';
        }
        
        if (classes.some(c => c.includes('Service') || c.includes('Manager'))) {
            return 'Business logic service';
        }
        
        if (functions.some(f => f.includes('test') || f.includes('spec'))) {
            return 'Test suite';
        }
        
        if (fileInfo.name.includes('config')) {
            return 'Configuration';
        }
        
        if (fileInfo.metadata.imports.some(i => i.includes('express'))) {
            return 'Web server';
        }
        
        return 'General purpose';
    }
    
    extractTags(content) {
        const tags = [];
        
        // Check for common tags
        if (this.semanticPatterns.deprecated.test(content)) tags.push('deprecated');
        if (this.semanticPatterns.experimental.test(content)) tags.push('experimental');
        if (content.includes('TODO')) tags.push('has-todos');
        if (content.includes('security')) tags.push('security-related');
        if (content.includes('performance')) tags.push('performance-related');
        
        return tags;
    }
    
    recategorizeByContent(fileInfo) {
        const { imports, exports, classes, functions } = fileInfo.metadata;
        
        // AI/ML detection
        if (imports.some(i => i.includes('openai') || i.includes('anthropic') || i.includes('langchain'))) {
            return 'ai-ml';
        }
        
        // Blockchain detection
        if (imports.some(i => i.includes('web3') || i.includes('ethers')) || 
            classes.some(c => c.includes('Contract'))) {
            return 'blockchain';
        }
        
        // Auth detection
        if (imports.some(i => i.includes('jsonwebtoken') || i.includes('passport')) ||
            functions.some(f => f.includes('auth') || f.includes('login'))) {
            return 'authentication';
        }
        
        // Database detection
        if (imports.some(i => i.includes('mongoose') || i.includes('sequelize') || i.includes('prisma'))) {
            return 'database';
        }
        
        return fileInfo.category;
    }
    
    updateCategoryStats(oldCategory, newCategory, fileInfo) {
        // Decrement old category
        if (this.categoryStats.has(oldCategory)) {
            const oldStats = this.categoryStats.get(oldCategory);
            oldStats.count--;
            oldStats.totalSize -= fileInfo.size;
        }
        
        // Increment new category
        if (!this.categoryStats.has(newCategory)) {
            this.categoryStats.set(newCategory, {
                count: 0,
                totalSize: 0,
                extensions: new Set()
            });
        }
        
        const newStats = this.categoryStats.get(newCategory);
        newStats.count++;
        newStats.totalSize += fileInfo.size;
        newStats.extensions.add(fileInfo.ext);
    }
    
    async findDuplicates() {
        console.log('\n🔍 Finding duplicate files...');
        
        const hashMap = new Map();
        
        for (const [path, info] of this.fileIndex) {
            if (info.hash) {
                if (!hashMap.has(info.hash)) {
                    hashMap.set(info.hash, []);
                }
                hashMap.get(info.hash).push(path);
            }
        }
        
        // Find duplicates
        for (const [hash, paths] of hashMap) {
            if (paths.length > 1) {
                this.duplicates.set(hash, paths);
            }
        }
        
        console.log(`   Found ${this.duplicates.size} sets of duplicate files`);
    }
    
    async detectUnusedFiles() {
        console.log('\n🔍 Detecting unused files...');
        
        // Build import graph
        const importGraph = new Map();
        
        for (const [path, info] of this.fileIndex) {
            for (const imp of info.metadata.imports) {
                if (!importGraph.has(imp)) {
                    importGraph.set(imp, new Set());
                }
                importGraph.get(imp).add(path);
            }
        }
        
        // Find files that are never imported
        for (const [path, info] of this.fileIndex) {
            const isEntryPoint = path.includes('index') || 
                               path.includes('main') || 
                               path.includes('app') ||
                               info.category === 'configuration';
            
            const isImported = Array.from(importGraph.values())
                .some(importers => Array.from(importers).some(imp => imp.includes(path)));
            
            if (!isEntryPoint && !isImported && info.category !== 'documentation') {
                this.unusedFiles.add(path);
            }
        }
        
        console.log(`   Found ${this.unusedFiles.size} potentially unused files`);
    }
    
    async generateOrganizationPlan() {
        console.log('\n📋 Generating organization plan...');
        
        const plan = {
            timestamp: new Date().toISOString(),
            totalFiles: this.fileIndex.size,
            recommendations: [],
            proposedStructure: this.generateProposedStructure(),
            migrationSteps: []
        };
        
        // Recommendation 1: Consolidate duplicates
        if (this.duplicates.size > 0) {
            plan.recommendations.push({
                type: 'consolidate-duplicates',
                description: `Found ${this.duplicates.size} sets of duplicate files`,
                impact: 'high',
                effort: 'low',
                files: Array.from(this.duplicates.values())
            });
        }
        
        // Recommendation 2: Remove unused files
        if (this.unusedFiles.size > 0) {
            plan.recommendations.push({
                type: 'remove-unused',
                description: `Found ${this.unusedFiles.size} potentially unused files`,
                impact: 'medium',
                effort: 'low',
                files: Array.from(this.unusedFiles)
            });
        }
        
        // Recommendation 3: Reorganize by purpose
        plan.recommendations.push({
            type: 'reorganize-structure',
            description: 'Reorganize files by functional purpose rather than type',
            impact: 'high',
            effort: 'high',
            proposedStructure: plan.proposedStructure
        });
        
        // Generate migration steps
        plan.migrationSteps = this.generateMigrationSteps();
        
        await fs.writeFile(
            path.join(this.outputDir, 'organization-plan.json'),
            JSON.stringify(plan, null, 2)
        );
        
        console.log('   Organization plan generated');
    }
    
    generateProposedStructure() {
        return {
            'src/': {
                'features/': {
                    'auth/': 'Authentication and authorization',
                    'api/': 'API endpoints and controllers',
                    'ui/': 'User interface components',
                    'data/': 'Data models and database',
                    'ai/': 'AI/ML integrations',
                    'blockchain/': 'Web3 and smart contracts'
                },
                'shared/': {
                    'utils/': 'Utility functions',
                    'hooks/': 'React hooks',
                    'components/': 'Shared UI components',
                    'services/': 'Shared services',
                    'types/': 'TypeScript types'
                },
                'config/': 'Configuration files',
                'assets/': 'Static assets'
            },
            'tests/': 'All test files',
            'docs/': 'Documentation',
            'scripts/': 'Build and deployment scripts',
            'public/': 'Public static files'
        };
    }
    
    generateMigrationSteps() {
        return [
            {
                step: 1,
                action: 'Backup current structure',
                command: 'cp -r . ../backup-$(date +%Y%m%d)'
            },
            {
                step: 2,
                action: 'Create new directory structure',
                command: 'mkdir -p src/{features,shared,config,assets}'
            },
            {
                step: 3,
                action: 'Move files by category',
                script: 'file-migration-script.sh'
            },
            {
                step: 4,
                action: 'Update import paths',
                script: 'update-imports.js'
            },
            {
                step: 5,
                action: 'Run tests to verify',
                command: 'npm test'
            }
        ];
    }
    
    async generateReports() {
        console.log('\n📊 Generating comprehensive reports...');
        
        // Save semantic index
        const indexData = Array.from(this.fileIndex.entries()).map(([path, info]) => ({
            path,
            ...info
        }));
        
        await fs.writeFile(this.indexPath, JSON.stringify(indexData, null, 2));
        
        // Generate category report
        await this.generateCategoryReport();
        
        // Generate duplicate report
        await this.generateDuplicateReport();
        
        // Generate quality report
        await this.generateQualityReport();
        
        // Generate visual map
        await this.generateVisualMap();
        
        console.log(`   Reports saved to ${this.outputDir}`);
    }
    
    async generateCategoryReport() {
        const report = {
            timestamp: new Date().toISOString(),
            categories: {}
        };
        
        for (const [category, stats] of this.categoryStats) {
            report.categories[category] = {
                count: stats.count,
                totalSize: stats.totalSize,
                averageSize: Math.round(stats.totalSize / stats.count),
                extensions: Array.from(stats.extensions),
                percentage: ((stats.count / this.fileIndex.size) * 100).toFixed(2) + '%'
            };
        }
        
        await fs.writeFile(
            path.join(this.outputDir, 'category-report.json'),
            JSON.stringify(report, null, 2)
        );
    }
    
    async generateDuplicateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            totalDuplicates: this.duplicates.size,
            duplicateSets: []
        };
        
        for (const [hash, paths] of this.duplicates) {
            const fileInfo = this.fileIndex.get(paths[0]);
            report.duplicateSets.push({
                hash,
                size: fileInfo.size,
                files: paths,
                potentialSavings: fileInfo.size * (paths.length - 1)
            });
        }
        
        report.totalPotentialSavings = report.duplicateSets
            .reduce((sum, set) => sum + set.potentialSavings, 0);
        
        await fs.writeFile(
            path.join(this.outputDir, 'duplicate-report.json'),
            JSON.stringify(report, null, 2)
        );
    }
    
    async generateQualityReport() {
        const report = {
            timestamp: new Date().toISOString(),
            metrics: {
                totalFiles: this.fileIndex.size,
                analyzedFiles: 0,
                filesWithTodos: 0,
                deprecatedFiles: 0,
                experimentalFiles: 0,
                largeFiles: 0,
                emptyFiles: 0
            },
            todos: [],
            deprecated: [],
            experimental: []
        };
        
        for (const [path, info] of this.fileIndex) {
            if (info.metadata.lines !== undefined) {
                report.metrics.analyzedFiles++;
            }
            
            if (info.metadata.todos.length > 0) {
                report.metrics.filesWithTodos++;
                report.todos.push({
                    file: path,
                    todos: info.metadata.todos
                });
            }
            
            if (info.metadata.tags.includes('deprecated')) {
                report.metrics.deprecatedFiles++;
                report.deprecated.push(path);
            }
            
            if (info.metadata.tags.includes('experimental')) {
                report.metrics.experimentalFiles++;
                report.experimental.push(path);
            }
            
            if (info.size > 100000) { // 100KB
                report.metrics.largeFiles++;
            }
            
            if (info.size === 0) {
                report.metrics.emptyFiles++;
            }
        }
        
        await fs.writeFile(
            path.join(this.outputDir, 'quality-report.json'),
            JSON.stringify(report, null, 2)
        );
    }
    
    async generateVisualMap() {
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>File System Visual Map</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        h1 {
            color: #333;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .stat-value {
            font-size: 2em;
            font-weight: bold;
            color: #4a90e2;
        }
        .stat-label {
            color: #666;
            margin-top: 5px;
        }
        .category-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        .category-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .category-title {
            font-size: 1.2em;
            font-weight: bold;
            margin-bottom: 10px;
            color: #333;
        }
        .progress-bar {
            width: 100%;
            height: 20px;
            background: #f0f0f0;
            border-radius: 10px;
            overflow: hidden;
            margin: 10px 0;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(45deg, #4a90e2, #7b68ee);
            transition: width 0.3s;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 File System Analysis Dashboard</h1>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-value">${this.fileIndex.size.toLocaleString()}</div>
                <div class="stat-label">Total Files</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${this.categoryStats.size}</div>
                <div class="stat-label">Categories</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${this.duplicates.size}</div>
                <div class="stat-label">Duplicate Sets</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${this.unusedFiles.size}</div>
                <div class="stat-label">Unused Files</div>
            </div>
        </div>
        
        <h2>📁 Files by Category</h2>
        <div class="category-grid">
            ${Array.from(this.categoryStats.entries()).map(([category, stats]) => `
                <div class="category-card">
                    <div class="category-title">${category}</div>
                    <div>Files: ${stats.count.toLocaleString()}</div>
                    <div>Size: ${this.formatBytes(stats.totalSize)}</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${(stats.count / this.fileIndex.size * 100).toFixed(1)}%"></div>
                    </div>
                    <div>Extensions: ${Array.from(stats.extensions).join(', ')}</div>
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;
        
        await fs.writeFile(
            path.join(this.outputDir, 'visual-map.html'),
            html
        );
    }
    
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    async queryFiles(query) {
        console.log(`\n🔍 Searching for: ${query}`);
        
        const results = [];
        const queryLower = query.toLowerCase();
        
        for (const [path, info] of this.fileIndex) {
            let score = 0;
            
            // Check filename
            if (info.name.toLowerCase().includes(queryLower)) score += 10;
            
            // Check purpose
            if (info.purpose.toLowerCase().includes(queryLower)) score += 8;
            
            // Check category
            if (info.category.includes(queryLower)) score += 5;
            
            // Check content
            if (info.content && info.content.toLowerCase().includes(queryLower)) score += 3;
            
            // Check metadata
            if (info.metadata.classes.some(c => c.toLowerCase().includes(queryLower))) score += 7;
            if (info.metadata.functions.some(f => f.toLowerCase().includes(queryLower))) score += 7;
            if (info.metadata.tags.some(t => t.includes(queryLower))) score += 5;
            
            if (score > 0) {
                results.push({ path, info, score });
            }
        }
        
        // Sort by relevance
        results.sort((a, b) => b.score - a.score);
        
        console.log(`Found ${results.length} matching files:`);
        results.slice(0, 10).forEach(result => {
            console.log(`  📄 ${result.path} (score: ${result.score})`);
            console.log(`     Purpose: ${result.info.purpose}`);
        });
        
        return results;
    }
}

// Export for use as module
module.exports = FileCategorizationAI;

// CLI interface
if (require.main === module) {
    const categorizer = new FileCategorizationAI();
    
    console.log('🤖 FILE CATEGORIZATION AI');
    console.log('========================\n');
    
    const command = process.argv[2];
    const args = process.argv.slice(3);
    
    async function run() {
        switch (command) {
            case 'analyze':
                await categorizer.analyze();
                console.log('\n✨ Analysis complete! Check file-categorization-output/ for reports.');
                break;
                
            case 'query':
                if (args[0]) {
                    // Load existing index
                    try {
                        const indexData = JSON.parse(
                            await fs.readFile(categorizer.indexPath, 'utf-8')
                        );
                        indexData.forEach(item => {
                            categorizer.fileIndex.set(item.path, item);
                        });
                        
                        await categorizer.queryFiles(args.join(' '));
                    } catch (error) {
                        console.error('No index found. Run "analyze" first.');
                    }
                } else {
                    console.log('Usage: node file-categorization-ai.js query <search-term>');
                }
                break;
                
            case 'report':
                const reportPath = path.join(categorizer.outputDir, 'visual-map.html');
                console.log(`Opening report: ${reportPath}`);
                execSync(`open ${reportPath}`);
                break;
                
            default:
                console.log('Available commands:');
                console.log('  analyze   - Analyze all files in the codebase');
                console.log('  query     - Search files by purpose or content');
                console.log('  report    - Open visual analysis report');
        }
    }
    
    run().catch(console.error);
}