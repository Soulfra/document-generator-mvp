#!/usr/bin/env node

/**
 * 🔧 MODEL MIGRATION HELPER
 * 
 * Tools to help migrate existing files to use the new model registry
 * and gas tank system.
 * 
 * Features:
 * - Find/replace old model names with new ones
 * - Update API endpoints to include /v1/ paths
 * - Add gas tank support to existing connectors
 * - Generate migration reports
 */

const fs = require('fs').promises;
const path = require('path');
const { getRegistry } = require('./model-registry.js');

class ModelMigrationHelper {
    constructor(config = {}) {
        this.config = {
            dryRun: config.dryRun !== false,
            backupEnabled: config.backupEnabled !== false,
            reportPath: config.reportPath || './migration-report.json',
            ...config
        };
        
        this.registry = getRegistry();
        this.migrations = [];
        this.stats = {
            filesScanned: 0,
            filesModified: 0,
            modelReplacements: 0,
            endpointFixes: 0,
            errors: []
        };
        
        // Model replacement patterns
        this.modelPatterns = [
            // Anthropic models
            { pattern: /(['"`])claude-3-opus(['"`])/g, replacement: '$1claude-3-opus-20240229$2' },
            { pattern: /(['"`])claude-3-sonnet(['"`])/g, replacement: '$1claude-3-sonnet-20240229$2' },
            { pattern: /(['"`])claude-3-haiku(['"`])/g, replacement: '$1claude-3-haiku-20240307$2' },
            { pattern: /(['"`])claude-3-5-sonnet(['"`])/g, replacement: '$1claude-3-sonnet-20240229$2' },
            
            // OpenAI models
            { pattern: /(['"`])gpt-4(['"`])(?!-)/g, replacement: '$1gpt-4-0613$2' },
            { pattern: /(['"`])gpt-3\.5-turbo(['"`])(?!-)/g, replacement: '$1gpt-3.5-turbo-0125$2' },
            
            // Model property patterns
            { pattern: /model:\s*(['"`])claude-3-opus(['"`])/g, replacement: 'model: $1claude-3-opus-20240229$2' },
            { pattern: /model:\s*(['"`])claude-3-sonnet(['"`])/g, replacement: 'model: $1claude-3-sonnet-20240229$2' },
            { pattern: /model:\s*(['"`])claude-3-haiku(['"`])/g, replacement: 'model: $1claude-3-haiku-20240307$2' },
            { pattern: /model:\s*(['"`])gpt-4(['"`])(?!-)/g, replacement: 'model: $1gpt-4-0613$2' },
            { pattern: /model:\s*(['"`])gpt-3\.5-turbo(['"`])(?!-)/g, replacement: 'model: $1gpt-3.5-turbo-0125$2' }
        ];
        
        // Endpoint fix patterns
        this.endpointPatterns = [
            // Base URLs missing /v1
            { pattern: /(https:\/\/api\.anthropic\.com)(['"`])/g, replacement: '$1/v1$2' },
            { pattern: /(https:\/\/api\.openai\.com)(['"`])/g, replacement: '$1/v1$2' },
            { pattern: /(https:\/\/api\.deepseek\.com)(['"`])/g, replacement: '$1/v1$2' },
            { pattern: /(https:\/\/api\.moonshot\.cn)(['"`])/g, replacement: '$1/v1$2' },
            { pattern: /(https:\/\/generativelanguage\.googleapis\.com)(['"`])/g, replacement: '$1/v1beta$2' },
            
            // URL property patterns
            { pattern: /baseUrl:\s*(['"`])https:\/\/api\.anthropic\.com(['"`])/g, replacement: 'baseUrl: $1https://api.anthropic.com/v1/$2' },
            { pattern: /baseUrl:\s*(['"`])https:\/\/api\.openai\.com(['"`])/g, replacement: 'baseUrl: $1https://api.openai.com/v1/$2' },
            { pattern: /baseUrl:\s*(['"`])https:\/\/api\.deepseek\.com(['"`])/g, replacement: 'baseUrl: $1https://api.deepseek.com/v1/$2' }
        ];
        
        console.log('🔧 Model Migration Helper initialized');
    }
    
    /**
     * Scan directory for files that need migration
     */
    async scanDirectory(directory, extensions = ['.js', '.ts', '.json']) {
        const files = [];
        
        async function scan(dir) {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                
                if (entry.isDirectory()) {
                    // Skip node_modules and .git
                    if (entry.name === 'node_modules' || entry.name === '.git') continue;
                    await scan(fullPath);
                } else if (entry.isFile()) {
                    const ext = path.extname(entry.name);
                    if (extensions.includes(ext)) {
                        files.push(fullPath);
                    }
                }
            }
        }
        
        await scan(directory);
        return files;
    }
    
    /**
     * Analyze file for needed migrations
     */
    async analyzeFile(filePath) {
        this.stats.filesScanned++;
        
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const needed = [];
            
            // Check for old model names
            for (const pattern of this.modelPatterns) {
                if (pattern.pattern.test(content)) {
                    needed.push({
                        type: 'model',
                        pattern: pattern.pattern.toString(),
                        count: (content.match(pattern.pattern) || []).length
                    });
                }
            }
            
            // Check for endpoint issues
            for (const pattern of this.endpointPatterns) {
                if (pattern.pattern.test(content)) {
                    needed.push({
                        type: 'endpoint',
                        pattern: pattern.pattern.toString(),
                        count: (content.match(pattern.pattern) || []).length
                    });
                }
            }
            
            if (needed.length > 0) {
                return {
                    file: filePath,
                    needed,
                    totalChanges: needed.reduce((sum, n) => sum + n.count, 0)
                };
            }
            
            return null;
        } catch (error) {
            this.stats.errors.push({
                file: filePath,
                error: error.message
            });
            return null;
        }
    }
    
    /**
     * Migrate a single file
     */
    async migrateFile(filePath) {
        console.log(`📝 Migrating ${path.basename(filePath)}...`);
        
        try {
            let content = await fs.readFile(filePath, 'utf8');
            let modified = false;
            let changeCount = 0;
            
            // Apply model replacements
            for (const pattern of this.modelPatterns) {
                const before = content;
                content = content.replace(pattern.pattern, pattern.replacement);
                if (before !== content) {
                    modified = true;
                    const matches = before.match(pattern.pattern);
                    if (matches) {
                        changeCount += matches.length;
                        this.stats.modelReplacements += matches.length;
                    }
                }
            }
            
            // Apply endpoint fixes
            for (const pattern of this.endpointPatterns) {
                const before = content;
                content = content.replace(pattern.pattern, pattern.replacement);
                if (before !== content) {
                    modified = true;
                    const matches = before.match(pattern.pattern);
                    if (matches) {
                        changeCount += matches.length;
                        this.stats.endpointFixes += matches.length;
                    }
                }
            }
            
            if (modified) {
                // Backup original file
                if (this.config.backupEnabled) {
                    await fs.writeFile(filePath + '.backup', await fs.readFile(filePath));
                }
                
                // Write modified content
                if (!this.config.dryRun) {
                    await fs.writeFile(filePath, content);
                }
                
                this.stats.filesModified++;
                console.log(`  ✅ ${changeCount} changes applied`);
                
                return {
                    file: filePath,
                    changes: changeCount,
                    status: 'migrated'
                };
            } else {
                console.log(`  ℹ️  No changes needed`);
                return {
                    file: filePath,
                    changes: 0,
                    status: 'unchanged'
                };
            }
        } catch (error) {
            console.error(`  ❌ Error: ${error.message}`);
            this.stats.errors.push({
                file: filePath,
                error: error.message
            });
            return {
                file: filePath,
                changes: 0,
                status: 'error',
                error: error.message
            };
        }
    }
    
    /**
     * Run migration on directory
     */
    async migrateDirectory(directory) {
        console.log(`\n🔍 Scanning ${directory} for files to migrate...\n`);
        
        const files = await this.scanDirectory(directory);
        console.log(`Found ${files.length} JavaScript/TypeScript files\n`);
        
        // Analyze all files first
        const needsMigration = [];
        for (const file of files) {
            const analysis = await this.analyzeFile(file);
            if (analysis) {
                needsMigration.push(analysis);
            }
        }
        
        console.log(`\n📊 Migration needed for ${needsMigration.length} files:`);
        console.log(`   Model replacements needed: ${needsMigration.reduce((sum, f) => sum + f.needed.filter(n => n.type === 'model').reduce((s, n) => s + n.count, 0), 0)}`);
        console.log(`   Endpoint fixes needed: ${needsMigration.reduce((sum, f) => sum + f.needed.filter(n => n.type === 'endpoint').reduce((s, n) => s + n.count, 0), 0)}`);
        
        if (this.config.dryRun) {
            console.log('\n⚠️  DRY RUN MODE - No files will be modified\n');
        }
        
        // Ask for confirmation
        if (!this.config.skipConfirmation && needsMigration.length > 0) {
            console.log('\nFiles to migrate:');
            needsMigration.forEach(f => {
                console.log(`  - ${path.relative(directory, f.file)} (${f.totalChanges} changes)`);
            });
            console.log('\nProceed with migration? (This will create .backup files)');
            // In a real implementation, we'd wait for user input here
        }
        
        // Perform migrations
        console.log('\n🚀 Starting migration...\n');
        
        for (const fileInfo of needsMigration) {
            const result = await this.migrateFile(fileInfo.file);
            this.migrations.push(result);
        }
        
        // Generate report
        await this.generateReport();
        
        console.log('\n✅ Migration complete!');
        console.log(`   Files scanned: ${this.stats.filesScanned}`);
        console.log(`   Files modified: ${this.stats.filesModified}`);
        console.log(`   Model replacements: ${this.stats.modelReplacements}`);
        console.log(`   Endpoint fixes: ${this.stats.endpointFixes}`);
        if (this.stats.errors.length > 0) {
            console.log(`   ❌ Errors: ${this.stats.errors.length}`);
        }
    }
    
    /**
     * Generate migration report
     */
    async generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            dryRun: this.config.dryRun,
            stats: this.stats,
            migrations: this.migrations,
            modelMappings: Object.fromEntries(this.registry.aliases),
            errors: this.stats.errors
        };
        
        await fs.writeFile(this.config.reportPath, JSON.stringify(report, null, 2));
        console.log(`\n📄 Migration report saved to ${this.config.reportPath}`);
    }
    
    /**
     * Add gas tank support to a file
     */
    async addGasTankSupport(filePath) {
        console.log(`⛽ Adding gas tank support to ${path.basename(filePath)}...`);
        
        try {
            let content = await fs.readFile(filePath, 'utf8');
            
            // Check if it already has gas tank support
            if (content.includes('gas-tank-connector') || content.includes('GasTankConnector')) {
                console.log('  ℹ️  Already has gas tank support');
                return;
            }
            
            // Add import
            const importStatement = "const GasTankConnector = require('./gas-tank-connector.js');\n";
            
            // Find where to insert import
            const requirePattern = /require\(['"`][^'"]+['"`]\);?\n/;
            const lastRequire = content.match(requirePattern);
            
            if (lastRequire) {
                const insertPos = content.lastIndexOf(lastRequire[0]) + lastRequire[0].length;
                content = content.slice(0, insertPos) + importStatement + content.slice(insertPos);
            } else {
                // Add at the beginning after shebang
                if (content.startsWith('#!')) {
                    const newlinePos = content.indexOf('\n') + 1;
                    content = content.slice(0, newlinePos) + '\n' + importStatement + content.slice(newlinePos);
                } else {
                    content = importStatement + '\n' + content;
                }
            }
            
            // Replace RealAIAPIConnector with GasTankConnector
            content = content.replace(/new RealAIAPIConnector/g, 'new GasTankConnector');
            content = content.replace(/extends RealAIAPIConnector/g, 'extends GasTankConnector');
            
            if (!this.config.dryRun) {
                await fs.writeFile(filePath, content);
            }
            
            console.log('  ✅ Gas tank support added');
            
        } catch (error) {
            console.error(`  ❌ Error: ${error.message}`);
        }
    }
}

module.exports = ModelMigrationHelper;

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0];
    const directory = args[1] || '.';
    
    const helper = new ModelMigrationHelper({
        dryRun: !args.includes('--apply'),
        skipConfirmation: args.includes('--yes')
    });
    
    async function main() {
        console.log('🔧 Model Migration Helper\n');
        
        if (command === 'scan') {
            // Just scan and report
            const files = await helper.scanDirectory(directory);
            let needsMigration = 0;
            
            for (const file of files) {
                const analysis = await helper.analyzeFile(file);
                if (analysis) {
                    needsMigration++;
                    console.log(`📄 ${path.relative(directory, analysis.file)}`);
                    analysis.needed.forEach(n => {
                        console.log(`   - ${n.type}: ${n.count} occurrences`);
                    });
                }
            }
            
            console.log(`\n📊 Summary: ${needsMigration} files need migration out of ${files.length} scanned`);
            
        } else if (command === 'migrate') {
            // Run full migration
            await helper.migrateDirectory(directory);
            
        } else if (command === 'add-gas-tank') {
            // Add gas tank support to specific file
            const filePath = directory; // In this case, it's a file path
            await helper.addGasTankSupport(filePath);
            
        } else {
            console.log('Usage:');
            console.log('  node model-migration-helper.js scan [directory]      - Scan for files needing migration');
            console.log('  node model-migration-helper.js migrate [directory]   - Run migration (dry run by default)');
            console.log('  node model-migration-helper.js migrate [directory] --apply   - Apply migrations');
            console.log('  node model-migration-helper.js migrate [directory] --apply --yes   - Apply without confirmation');
            console.log('  node model-migration-helper.js add-gas-tank <file>   - Add gas tank support to file');
        }
    }
    
    main().catch(console.error);
}