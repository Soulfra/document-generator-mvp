#!/usr/bin/env node

/**
 * Document Comparison Engine
 * Compares current state documents with desired state to identify gaps
 * Helps plan the path from what exists to what should exist
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const diff = require('diff');
const sqlite3 = require('sqlite3').verbose();

class DocumentComparisonEngine {
    constructor() {
        this.db = null;
        this.comparisons = new Map();
        this.patterns = new Map();
        this.deprecations = new Map();
    }

    async initialize() {
        console.log('🔍 Initializing Document Comparison Engine...');
        console.log('   "Compare it to the start documents to see the roadmap"');
        
        await this.initializeDatabase();
        await this.loadPatterns();
        
        console.log('✅ Document Comparison Engine ready');
        return this;
    }

    async initializeDatabase() {
        this.db = new sqlite3.Database('./document-comparison.db');
        
        const tables = [
            `CREATE TABLE IF NOT EXISTS comparisons (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                current_doc TEXT,
                desired_doc TEXT,
                similarity_score REAL,
                gaps_identified INTEGER,
                effort_estimate INTEGER,
                comparison_date DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS gaps (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                comparison_id INTEGER,
                gap_type TEXT,
                description TEXT,
                current_state TEXT,
                desired_state TEXT,
                priority INTEGER,
                effort INTEGER,
                FOREIGN KEY (comparison_id) REFERENCES comparisons(id)
            )`,
            `CREATE TABLE IF NOT EXISTS deprecations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                file_path TEXT,
                reason TEXT,
                replacement TEXT,
                safe_to_remove BOOLEAN,
                dependencies TEXT,
                identified_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS upgrades (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                component TEXT,
                current_version TEXT,
                target_version TEXT,
                breaking_changes TEXT,
                migration_path TEXT,
                priority INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS disambiguation (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                term TEXT,
                contexts TEXT,
                preferred_meaning TEXT,
                alternatives TEXT,
                usage_examples TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`
        ];

        for (const table of tables) {
            await new Promise((resolve, reject) => {
                this.db.run(table, err => err ? reject(err) : resolve());
            });
        }
    }

    async loadPatterns() {
        // Patterns for identifying what needs upgrading/deprecating
        this.patterns.set('deprecated', [
            /TODO.*deprecated/i,
            /FIXME.*old/i,
            /legacy/i,
            /obsolete/i,
            /remove.*this/i,
            /old.*version/i
        ]);

        this.patterns.set('upgrade-needed', [
            /TODO.*upgrade/i,
            /needs.*update/i,
            /outdated/i,
            /version.*old/i,
            /security.*update/i
        ]);

        this.patterns.set('ambiguous', [
            /\?\?/,
            /unclear/i,
            /confusing/i,
            /what.*this/i,
            /not.*sure/i,
            /maybe/i
        ]);
    }

    async compareDocuments(currentPath, desiredPath) {
        console.log(`\n📊 Comparing Documents:`);
        console.log(`   Current: ${currentPath}`);
        console.log(`   Desired: ${desiredPath}`);
        
        // Read both documents
        const current = await this.readDocument(currentPath);
        const desired = await this.readDocument(desiredPath);
        
        // Create comparison
        const comparison = {
            similarity: this.calculateSimilarity(current.content, desired.content),
            gaps: await this.identifyGaps(current, desired),
            deprecations: await this.findDeprecations(current),
            upgrades: await this.findUpgrades(current, desired),
            disambiguations: await this.findAmbiguities(current),
            diff: this.generateDiff(current.content, desired.content)
        };
        
        // Store comparison
        const comparisonId = await this.storeComparison(currentPath, desiredPath, comparison);
        
        // Generate report
        const report = await this.generateReport(comparison);
        
        return { comparisonId, comparison, report };
    }

    async readDocument(filePath) {
        const content = await fs.readFile(filePath, 'utf-8');
        const stats = await fs.stat(filePath);
        
        return {
            path: filePath,
            content,
            size: stats.size,
            modified: stats.mtime,
            structure: this.analyzeStructure(content),
            metadata: this.extractMetadata(content)
        };
    }

    analyzeStructure(content) {
        const structure = {
            format: this.detectFormat(content),
            sections: [],
            codeBlocks: [],
            headers: [],
            lists: [],
            links: []
        };
        
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
            // Headers
            if (line.match(/^#{1,6}\s/)) {
                structure.headers.push({
                    level: line.match(/^(#+)/)[1].length,
                    text: line.replace(/^#+\s/, ''),
                    line: index + 1
                });
            }
            
            // Code blocks
            if (line.startsWith('```')) {
                structure.codeBlocks.push({
                    language: line.replace('```', '').trim(),
                    line: index + 1
                });
            }
            
            // Lists
            if (line.match(/^[\*\-\+]\s/) || line.match(/^\d+\.\s/)) {
                structure.lists.push({
                    type: line.match(/^\d+\./) ? 'ordered' : 'unordered',
                    line: index + 1
                });
            }
            
            // Links
            const linkMatches = line.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g);
            for (const match of linkMatches) {
                structure.links.push({
                    text: match[1],
                    url: match[2],
                    line: index + 1
                });
            }
        });
        
        return structure;
    }

    detectFormat(content) {
        if (content.includes('```')) return 'markdown';
        if (content.startsWith('{') || content.startsWith('[')) return 'json';
        if (content.includes('<') && content.includes('>')) return 'xml/html';
        if (content.includes('---')) return 'yaml';
        return 'text';
    }

    extractMetadata(content) {
        const metadata = {
            title: null,
            description: null,
            version: null,
            author: null,
            tags: []
        };
        
        // Extract from markdown frontmatter
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        if (frontmatterMatch) {
            // Parse YAML frontmatter
            const frontmatter = frontmatterMatch[1];
            const lines = frontmatter.split('\n');
            lines.forEach(line => {
                const [key, value] = line.split(':').map(s => s.trim());
                if (metadata.hasOwnProperty(key)) {
                    metadata[key] = value;
                }
            });
        }
        
        // Extract from first header
        const firstHeader = content.match(/^#\s+(.+)$/m);
        if (firstHeader && !metadata.title) {
            metadata.title = firstHeader[1];
        }
        
        return metadata;
    }

    calculateSimilarity(current, desired) {
        // Multiple similarity metrics
        const metrics = {
            exactMatch: current === desired ? 1 : 0,
            levenshtein: this.levenshteinSimilarity(current, desired),
            structural: this.structuralSimilarity(current, desired),
            semantic: this.semanticSimilarity(current, desired)
        };
        
        // Weighted average
        const weights = {
            exactMatch: 0.1,
            levenshtein: 0.3,
            structural: 0.3,
            semantic: 0.3
        };
        
        let weightedSum = 0;
        for (const [metric, value] of Object.entries(metrics)) {
            weightedSum += value * weights[metric];
        }
        
        return {
            overall: weightedSum,
            metrics
        };
    }

    levenshteinSimilarity(str1, str2) {
        // Simplified - would use proper Levenshtein distance
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const editDistance = this.levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    }

    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }

    structuralSimilarity(current, desired) {
        // Compare document structures
        const currentLines = current.split('\n').length;
        const desiredLines = desired.split('\n').length;
        
        const lineDiff = Math.abs(currentLines - desiredLines);
        const maxLines = Math.max(currentLines, desiredLines);
        
        return maxLines > 0 ? 1 - (lineDiff / maxLines) : 1;
    }

    semanticSimilarity(current, desired) {
        // Simple keyword-based semantic similarity
        const currentWords = new Set(current.toLowerCase().match(/\b\w+\b/g) || []);
        const desiredWords = new Set(desired.toLowerCase().match(/\b\w+\b/g) || []);
        
        const intersection = new Set([...currentWords].filter(w => desiredWords.has(w)));
        const union = new Set([...currentWords, ...desiredWords]);
        
        return union.size > 0 ? intersection.size / union.size : 0;
    }

    async identifyGaps(current, desired) {
        const gaps = [];
        
        // Feature gaps
        const currentFeatures = this.extractFeatures(current.content);
        const desiredFeatures = this.extractFeatures(desired.content);
        
        for (const feature of desiredFeatures) {
            if (!currentFeatures.includes(feature)) {
                gaps.push({
                    type: 'missing-feature',
                    description: `Missing feature: ${feature}`,
                    current: 'Not implemented',
                    desired: feature,
                    priority: 8,
                    effort: 5
                });
            }
        }
        
        // Structure gaps
        if (current.structure.format !== desired.structure.format) {
            gaps.push({
                type: 'format-mismatch',
                description: `Format mismatch: ${current.structure.format} vs ${desired.structure.format}`,
                current: current.structure.format,
                desired: desired.structure.format,
                priority: 6,
                effort: 3
            });
        }
        
        // Content gaps
        const missingContent = this.findMissingContent(current.content, desired.content);
        missingContent.forEach(content => {
            gaps.push({
                type: 'missing-content',
                description: `Missing content: ${content.substring(0, 50)}...`,
                current: 'Not present',
                desired: content,
                priority: 5,
                effort: 2
            });
        });
        
        return gaps;
    }

    extractFeatures(content) {
        const features = [];
        
        // Look for feature indicators
        const featurePatterns = [
            /feature[s]?:\s*(.+)/gi,
            /functionality:\s*(.+)/gi,
            /capability:\s*(.+)/gi,
            /\-\s+(.+feature.+)/gi
        ];
        
        featurePatterns.forEach(pattern => {
            const matches = content.matchAll(pattern);
            for (const match of matches) {
                features.push(match[1].trim());
            }
        });
        
        return features;
    }

    findMissingContent(current, desired) {
        const missingContent = [];
        
        // Split into sentences/sections
        const currentSections = current.split(/\n\n+/);
        const desiredSections = desired.split(/\n\n+/);
        
        desiredSections.forEach(section => {
            const similar = currentSections.find(cs => 
                this.semanticSimilarity(cs, section) > 0.7
            );
            
            if (!similar && section.trim().length > 20) {
                missingContent.push(section);
            }
        });
        
        return missingContent;
    }

    async findDeprecations(document) {
        const deprecations = [];
        
        // Check against deprecation patterns
        for (const [type, patterns] of this.patterns.entries()) {
            if (type !== 'deprecated') continue;
            
            patterns.forEach(pattern => {
                const matches = document.content.matchAll(new RegExp(pattern, 'gim'));
                for (const match of matches) {
                    deprecations.push({
                        type: 'pattern-match',
                        match: match[0],
                        reason: 'Matches deprecation pattern',
                        safeToRemove: false
                    });
                }
            });
        }
        
        // Check for old API usage
        const oldAPIs = ['XMLHttpRequest', 'document.write', 'eval'];
        oldAPIs.forEach(api => {
            if (document.content.includes(api)) {
                deprecations.push({
                    type: 'old-api',
                    match: api,
                    reason: 'Uses deprecated API',
                    replacement: this.getModernReplacement(api),
                    safeToRemove: false
                });
            }
        });
        
        return deprecations;
    }

    getModernReplacement(oldAPI) {
        const replacements = {
            'XMLHttpRequest': 'fetch',
            'document.write': 'element.innerHTML or DOM methods',
            'eval': 'Function constructor or safer alternatives'
        };
        
        return replacements[oldAPI] || 'modern alternative';
    }

    async findUpgrades(current, desired) {
        const upgrades = [];
        
        // Version detection
        const currentVersions = this.extractVersions(current.content);
        const desiredVersions = this.extractVersions(desired.content);
        
        for (const [pkg, desiredVersion] of Object.entries(desiredVersions)) {
            const currentVersion = currentVersions[pkg];
            
            if (!currentVersion || currentVersion !== desiredVersion) {
                upgrades.push({
                    component: pkg,
                    currentVersion: currentVersion || 'not found',
                    targetVersion: desiredVersion,
                    priority: this.getUpgradePriority(pkg, currentVersion, desiredVersion)
                });
            }
        }
        
        return upgrades;
    }

    extractVersions(content) {
        const versions = {};
        
        // Package.json style
        const packageMatch = content.match(/"dependencies":\s*{([^}]+)}/);
        if (packageMatch) {
            const deps = packageMatch[1];
            const versionMatches = deps.matchAll(/"([^"]+)":\s*"([^"]+)"/g);
            for (const match of versionMatches) {
                versions[match[1]] = match[2];
            }
        }
        
        // Comments or documentation
        const versionPatterns = [
            /version:\s*([0-9.]+)/gi,
            /v([0-9.]+)/gi,
            /@([0-9.]+)/gi
        ];
        
        versionPatterns.forEach(pattern => {
            const matches = content.matchAll(pattern);
            for (const match of matches) {
                versions['document'] = match[1];
            }
        });
        
        return versions;
    }

    getUpgradePriority(component, current, target) {
        // Simple priority logic
        if (!current) return 9; // Missing = high priority
        if (current.includes('beta') || current.includes('alpha')) return 8;
        if (target.includes('security')) return 10;
        return 5; // Default medium priority
    }

    async findAmbiguities(document) {
        const ambiguities = [];
        
        // Check against ambiguity patterns
        this.patterns.get('ambiguous').forEach(pattern => {
            const matches = document.content.matchAll(new RegExp(pattern, 'gim'));
            for (const match of matches) {
                const context = this.extractContext(document.content, match.index);
                ambiguities.push({
                    match: match[0],
                    context,
                    needsClarification: true
                });
            }
        });
        
        // Check for overloaded terms
        const overloadedTerms = this.findOverloadedTerms(document.content);
        overloadedTerms.forEach(term => {
            ambiguities.push({
                term: term.word,
                contexts: term.contexts,
                needsDisambiguation: true
            });
        });
        
        return ambiguities;
    }

    extractContext(content, index, contextSize = 100) {
        const start = Math.max(0, index - contextSize);
        const end = Math.min(content.length, index + contextSize);
        return content.substring(start, end);
    }

    findOverloadedTerms(content) {
        const terms = {};
        const words = content.match(/\b\w+\b/g) || [];
        
        // Count word usage in different contexts
        words.forEach((word, index) => {
            if (word.length < 4) return; // Skip short words
            
            const context = words.slice(
                Math.max(0, index - 5),
                Math.min(words.length, index + 5)
            ).join(' ');
            
            if (!terms[word]) terms[word] = [];
            terms[word].push(context);
        });
        
        // Find terms used in multiple contexts
        const overloaded = [];
        for (const [word, contexts] of Object.entries(terms)) {
            if (contexts.length > 5) {
                const uniqueContexts = new Set(contexts);
                if (uniqueContexts.size > 3) {
                    overloaded.push({
                        word,
                        contexts: Array.from(uniqueContexts).slice(0, 3)
                    });
                }
            }
        }
        
        return overloaded;
    }

    generateDiff(current, desired) {
        const changes = diff.diffLines(current, desired);
        
        const summary = {
            additions: 0,
            deletions: 0,
            modifications: 0,
            unchanged: 0
        };
        
        changes.forEach(change => {
            if (change.added) summary.additions += change.count || 1;
            else if (change.removed) summary.deletions += change.count || 1;
            else summary.unchanged += change.count || 1;
        });
        
        return { changes, summary };
    }

    async storeComparison(currentPath, desiredPath, comparison) {
        const id = await new Promise((resolve, reject) => {
            this.db.run(`
                INSERT INTO comparisons 
                (current_doc, desired_doc, similarity_score, gaps_identified, effort_estimate)
                VALUES (?, ?, ?, ?, ?)
            `, [
                currentPath,
                desiredPath,
                comparison.similarity.overall,
                comparison.gaps.length,
                comparison.gaps.reduce((sum, gap) => sum + gap.effort, 0)
            ], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
        
        // Store gaps
        for (const gap of comparison.gaps) {
            await this.storeGap(id, gap);
        }
        
        return id;
    }

    async storeGap(comparisonId, gap) {
        await new Promise((resolve, reject) => {
            this.db.run(`
                INSERT INTO gaps 
                (comparison_id, gap_type, description, current_state, desired_state, priority, effort)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                comparisonId,
                gap.type,
                gap.description,
                gap.current,
                gap.desired,
                gap.priority,
                gap.effort
            ], err => err ? reject(err) : resolve());
        });
    }

    async generateReport(comparison) {
        const report = {
            summary: {
                similarity: `${(comparison.similarity.overall * 100).toFixed(1)}%`,
                totalGaps: comparison.gaps.length,
                totalEffort: comparison.gaps.reduce((sum, gap) => sum + gap.effort, 0),
                deprecations: comparison.deprecations.length,
                upgrades: comparison.upgrades.length,
                ambiguities: comparison.disambiguations.length
            },
            
            criticalGaps: comparison.gaps
                .filter(gap => gap.priority >= 8)
                .sort((a, b) => b.priority - a.priority),
            
            quickWins: comparison.gaps
                .filter(gap => gap.effort <= 3 && gap.priority >= 5)
                .sort((a, b) => b.priority - a.priority),
            
            recommendations: this.generateRecommendations(comparison)
        };
        
        return report;
    }

    generateRecommendations(comparison) {
        const recommendations = [];
        
        if (comparison.similarity.overall < 0.3) {
            recommendations.push({
                type: 'major-rewrite',
                description: 'Document structures are significantly different. Consider a phased migration approach.',
                priority: 'high'
            });
        }
        
        if (comparison.deprecations.length > 5) {
            recommendations.push({
                type: 'cleanup-needed',
                description: 'Multiple deprecations found. Schedule a cleanup sprint.',
                priority: 'medium'
            });
        }
        
        if (comparison.disambiguations.length > 0) {
            recommendations.push({
                type: 'clarification-needed',
                description: 'Ambiguous terms found. Create a glossary or disambiguation guide.',
                priority: 'low'
            });
        }
        
        return recommendations;
    }

    async suggestMigrationPath(comparison) {
        console.log('\n🛤️ Suggested Migration Path:');
        
        const phases = [];
        
        // Phase 1: Quick wins
        const quickWins = comparison.gaps.filter(gap => gap.effort <= 3);
        if (quickWins.length > 0) {
            phases.push({
                name: 'Quick Wins',
                duration: '1-2 days',
                tasks: quickWins.map(gap => gap.description)
            });
        }
        
        // Phase 2: Deprecation cleanup
        if (comparison.deprecations.length > 0) {
            phases.push({
                name: 'Deprecation Cleanup',
                duration: '2-3 days',
                tasks: comparison.deprecations.map(dep => `Remove ${dep.match}`)
            });
        }
        
        // Phase 3: Major features
        const majorGaps = comparison.gaps.filter(gap => gap.priority >= 7 && gap.effort > 3);
        if (majorGaps.length > 0) {
            phases.push({
                name: 'Major Feature Implementation',
                duration: '1-2 weeks',
                tasks: majorGaps.map(gap => gap.description)
            });
        }
        
        // Phase 4: Polish and optimization
        phases.push({
            name: 'Polish and Optimization',
            duration: '2-3 days',
            tasks: ['Update documentation', 'Add tests', 'Performance optimization']
        });
        
        return phases;
    }
}

// Export for use in other modules
module.exports = DocumentComparisonEngine;

// Run if called directly
if (require.main === module) {
    const engine = new DocumentComparisonEngine();
    
    engine.initialize().then(async () => {
        console.log('\n📄 Document Comparison Engine Demo\n');
        
        // Example: Compare a current messy file with desired clean version
        // In reality, you would provide actual file paths
        
        // Create example files for demo
        const currentDoc = `# Document Generator

TODO: deprecated old system
This is the current messy state with legacy code.

## Features
- Basic document generation
- Some old XMLHttpRequest calls
- Confusing architecture

Version: 0.1.0
`;

        const desiredDoc = `# Document Generator

A clean, well-organized system for generating documents and applications.

## Features
- Advanced document generation
- Modern fetch API
- Clean architecture
- AI-powered analysis
- Multi-format support

Version: 2.0.0

## Architecture
Clear separation of concerns with modular design.
`;

        // Write example files
        await fs.writeFile('current-example.md', currentDoc);
        await fs.writeFile('desired-example.md', desiredDoc);
        
        // Run comparison
        const result = await engine.compareDocuments('current-example.md', 'desired-example.md');
        
        console.log('\n📊 Comparison Results:');
        console.log(`Similarity: ${result.report.summary.similarity}`);
        console.log(`Total Gaps: ${result.report.summary.totalGaps}`);
        console.log(`Effort Required: ${result.report.summary.totalEffort} units`);
        
        console.log('\n🎯 Critical Gaps:');
        result.report.criticalGaps.forEach(gap => {
            console.log(`  - ${gap.description} (Priority: ${gap.priority})`);
        });
        
        console.log('\n⚡ Quick Wins:');
        result.report.quickWins.forEach(gap => {
            console.log(`  - ${gap.description} (Effort: ${gap.effort})`);
        });
        
        console.log('\n💡 Recommendations:');
        result.report.recommendations.forEach(rec => {
            console.log(`  - [${rec.priority}] ${rec.description}`);
        });
        
        // Suggest migration path
        const migrationPath = await engine.suggestMigrationPath(result.comparison);
        
        console.log('\n🗺️ Migration Path:');
        migrationPath.forEach((phase, index) => {
            console.log(`\nPhase ${index + 1}: ${phase.name} (${phase.duration})`);
            phase.tasks.forEach(task => {
                console.log(`  - ${task}`);
            });
        });
        
        // Cleanup example files
        await fs.unlink('current-example.md');
        await fs.unlink('desired-example.md');
        
        console.log('\n✨ Comparison complete!');
    }).catch(console.error);
}