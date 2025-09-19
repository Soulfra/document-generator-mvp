#!/usr/bin/env node

/**
 * 🔍 System Analysis Tool
 * Analyzes the massive file duplication problem in the Document Generator
 */

import { promises as fs } from 'fs';
import { join, extname, basename } from 'path';

class SystemAnalyzer {
    constructor() {
        this.rootDir = process.cwd();
        this.analysis = {
            totalFiles: 0,
            categories: {},
            duplicatePatterns: {},
            workingSystems: [],
            brokenSystems: [],
            sizeSummary: {},
            fileTypes: {}
        };
    }

    async analyzeProject() {
        console.log('🔍 Starting comprehensive system analysis...\n');
        
        // Get all files in root directory
        const files = await this.getRootFiles();
        console.log(`📊 Found ${files.length} files in root directory\n`);
        
        // Categorize files
        await this.categorizeFiles(files);
        
        // Find duplicate patterns
        this.findDuplicatePatterns(files);
        
        // Identify working vs broken systems
        await this.identifySystemStatus(files);
        
        // Generate report
        this.generateReport();
        
        return this.analysis;
    }
    
    async getRootFiles() {
        const items = await fs.readdir(this.rootDir);
        const files = [];
        
        for (const item of items) {
            try {
                const stats = await fs.stat(join(this.rootDir, item));
                if (stats.isFile()) {
                    files.push({
                        name: item,
                        size: stats.size,
                        ext: extname(item),
                        modified: stats.mtime
                    });
                }
            } catch (error) {
                // Skip files we can't access
            }
        }
        
        return files;
    }
    
    async categorizeFiles(files) {
        console.log('📋 Categorizing files by type and purpose...\n');
        
        const categories = {
            'Core Systems': [],
            'AI/ML': [],
            'Gaming': [],
            'Blockchain': [],
            'Documentation': [],
            'Configuration': [],
            'Testing': [],
            'Integration': [],
            'Templates': [],
            'Orchestrators': [],
            'Other': []
        };
        
        for (const file of files) {
            const name = file.name.toLowerCase();
            
            if (name.includes('hardware') || name.includes('renderer') || name.includes('network') || 
                name.includes('pcb') || name.includes('fpga') || name.includes('signal')) {
                categories['Core Systems'].push(file);
            }
            else if (name.includes('ai-') || name.includes('reasoning') || name.includes('neural') ||
                     name.includes('llm') || name.includes('model')) {
                categories['AI/ML'].push(file);
            }
            else if (name.includes('game') || name.includes('gaming') || name.includes('3d') ||
                     name.includes('arena') || name.includes('battle') || name.includes('character')) {
                categories['Gaming'].push(file);
            }
            else if (name.includes('blockchain') || name.includes('crypto') || name.includes('wallet') ||
                     name.includes('token') || name.includes('contract')) {
                categories['Blockchain'].push(file);
            }
            else if (name.includes('readme') || name.includes('complete') || name.includes('guide') ||
                     name.includes('doc') || file.ext === '.md') {
                categories['Documentation'].push(file);
            }
            else if (name.includes('config') || name.includes('settings') || file.ext === '.json' ||
                     file.ext === '.yml' || file.ext === '.yaml') {
                categories['Configuration'].push(file);
            }
            else if (name.includes('test') || name.includes('verify') || name.includes('debug') ||
                     name.includes('check')) {
                categories['Testing'].push(file);
            }
            else if (name.includes('integration') || name.includes('bridge') || name.includes('connector') ||
                     name.includes('adapter')) {
                categories['Integration'].push(file);
            }
            else if (name.includes('template') || name.includes('generator') || name.includes('builder')) {
                categories['Templates'].push(file);
            }
            else if (name.includes('orchestrator') || name.includes('master') || name.includes('launcher') ||
                     name.includes('manager')) {
                categories['Orchestrators'].push(file);
            }
            else {
                categories['Other'].push(file);
            }
        }
        
        this.analysis.categories = categories;
        
        // Print category summary
        for (const [category, files] of Object.entries(categories)) {
            if (files.length > 0) {
                console.log(`${category}: ${files.length} files`);
            }
        }
        console.log('');
    }
    
    findDuplicatePatterns(files) {
        console.log('🔄 Finding duplicate patterns...\n');
        
        const patterns = {};
        
        for (const file of files) {
            const name = file.name;
            
            // Find common patterns
            const commonPatterns = [
                /-CHARACTER-SHEET\.md$/,
                /-COMPLETE\.md$/,
                /-INTEGRATION-.*\.js$/,
                /-ORCHESTRATOR\.js$/,
                /-SYSTEM\.js$/,
                /-ENGINE\.js$/,
                /-MASTER.*\.js$/,
                /-BRIDGE\.js$/,
                /-CONNECTOR\.js$/,
                /-LAUNCHER\.js$/,
                /^UNIFIED-.*\.js$/,
                /^MASTER-.*\.js$/,
                /^AI-.*\.js$/,
                /^BLOCKCHAIN-.*\.js$/,
                /^GAME-.*\.js$/
            ];
            
            for (const pattern of commonPatterns) {
                if (pattern.test(name)) {
                    const patternName = pattern.source;
                    if (!patterns[patternName]) {
                        patterns[patternName] = [];
                    }
                    patterns[patternName].push(file);
                    break;
                }
            }
        }
        
        this.analysis.duplicatePatterns = patterns;
        
        // Print duplicate patterns
        for (const [pattern, files] of Object.entries(patterns)) {
            if (files.length > 1) {
                console.log(`Pattern "${pattern}": ${files.length} files`);
            }
        }
        console.log('');
    }
    
    async identifySystemStatus(files) {
        console.log('✅ Identifying working vs broken systems...\n');
        
        // Known working systems (from our conversation)
        const knownWorking = [
            'hardware-renderer.js',
            'hardware-renderer-standalone.js', 
            'network-topology-visualizer.js',
            'pcb-layout-renderer.js',
            'fpga-logic-simulator.js',
            'signal-flow-engine.js',
            'hardware-game-demo.html',
            'ai-reasoning-engine.js',
            'ai-reasoning-with-pricing.service.js',
            'ai-reasoning-easter-eggs.js',
            'master-automation-controller.js',
            'component-chunked-processor.js',
            'simple-automation-demo.js',
            'generate-mvp.sh',
            'mvp-generator.js'
        ];
        
        // Check which working systems exist
        for (const workingFile of knownWorking) {
            const exists = files.find(f => f.name === workingFile);
            if (exists) {
                this.analysis.workingSystems.push(exists);
            }
        }
        
        // Identify likely broken systems (very large or very small files)
        for (const file of files) {
            if (file.ext === '.js') {
                if (file.size < 100) {
                    this.analysis.brokenSystems.push({ ...file, reason: 'Too small (< 100 bytes)' });
                } else if (file.size > 100000 && !knownWorking.includes(file.name)) {
                    this.analysis.brokenSystems.push({ ...file, reason: 'Suspiciously large (> 100KB)' });
                }
            }
        }
        
        console.log(`✅ Working systems identified: ${this.analysis.workingSystems.length}`);
        console.log(`❌ Potentially broken systems: ${this.analysis.brokenSystems.length}\n`);
    }
    
    generateReport() {
        console.log('📊 SYSTEM ANALYSIS REPORT');
        console.log('========================\n');
        
        // File type breakdown
        console.log('📁 File Types:');
        const typeCount = {};
        for (const category of Object.values(this.analysis.categories)) {
            for (const file of category) {
                typeCount[file.ext] = (typeCount[file.ext] || 0) + 1;
            }
        }
        
        Object.entries(typeCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .forEach(([ext, count]) => {
                console.log(`  ${ext || '(no ext)'}: ${count} files`);
            });
        console.log('');
        
        // Category breakdown
        console.log('📋 Categories:');
        Object.entries(this.analysis.categories)
            .sort((a, b) => b[1].length - a[1].length)
            .forEach(([category, files]) => {
                if (files.length > 0) {
                    console.log(`  ${category}: ${files.length} files`);
                }
            });
        console.log('');
        
        // Working systems
        console.log('✅ Confirmed Working Systems:');
        this.analysis.workingSystems.forEach(file => {
            console.log(`  ✓ ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);
        });
        console.log('');
        
        // Biggest problems
        console.log('🚨 Biggest Cleanup Opportunities:');
        Object.entries(this.analysis.duplicatePatterns)
            .sort((a, b) => b[1].length - a[1].length)
            .slice(0, 5)
            .forEach(([pattern, files]) => {
                console.log(`  ${pattern}: ${files.length} files (could consolidate)`);
            });
        console.log('');
        
        // Recommendations
        console.log('💡 Cleanup Recommendations:');
        console.log('  1. Move working systems to /core/ directory');
        console.log('  2. Consolidate duplicate pattern files');
        console.log('  3. Archive or delete broken/incomplete systems');
        console.log('  4. Move documentation to /docs/ directory');
        console.log('  5. Move configuration to /config/ directory');
        console.log('');
    }
    
    async saveAnalysis() {
        const reportFile = 'system-analysis-report.json';
        await fs.writeFile(reportFile, JSON.stringify(this.analysis, null, 2));
        console.log(`📄 Detailed analysis saved to: ${reportFile}`);
    }
}

// Run analysis if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const analyzer = new SystemAnalyzer();
    
    analyzer.analyzeProject()
        .then(() => analyzer.saveAnalysis())
        .then(() => {
            console.log('\n🎉 Analysis complete!');
        })
        .catch(error => {
            console.error('❌ Analysis failed:', error);
            process.exit(1);
        });
}

export default SystemAnalyzer;