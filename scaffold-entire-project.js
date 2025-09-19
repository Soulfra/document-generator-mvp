#!/usr/bin/env node

/**
 * 🏗️ PROJECT SCAFFOLDING SYSTEM
 * 
 * Processes the entire Document-Generator project and organizes everything
 * into the unified vault structure with proper categorization, tagging, and encryption.
 * 
 * This addresses the user's concern: "maybe we need all of our entire project 
 * for a scaffolding to have all of this shit filled out and scaffolded etc"
 */

const fs = require('fs').promises;
const path = require('path');
const UnifiedDocumentOrganizer = require('./unified-document-organizer');

class ProjectScaffolder {
    constructor(config = {}) {
        this.config = {
            projectRoot: config.projectRoot || '/Users/matthewmauer/Desktop/Document-Generator',
            vaultPath: config.vaultPath || path.join(config.projectRoot || process.cwd(), 'unified-vault'),
            batchSize: config.batchSize || 25,
            maxFileSize: config.maxFileSize || 10 * 1024 * 1024, // 10MB
            skipPatterns: config.skipPatterns || [
                'node_modules',
                '.git',
                '.env*',
                '*.log',
                '*.tmp',
                'temp/',
                'backup*/',
                '*.sqlite',
                '*.db',
                'test-vault/', // Skip our test vault
                '.vault/',     // Skip existing vault
                'DocumentGeneratorVault.app', // Skip app bundle
                '.cleanup-backup',
                '.calos',
                'mcp/node_modules',
                'FinishThisIdea*/node_modules',
                '*/node_modules',
                'web-interface/node_modules'
            ],
            includePatterns: config.includePatterns || [
                '*.md',
                '*.js',
                '*.json',
                '*.html',
                '*.css',
                '*.yml',
                '*.yaml',
                '*.sh',
                '*.sql',
                '*.txt',
                '*.py',
                '*.ts',
                '*.tsx'
            ],
            ...config
        };
        
        this.organizer = new UnifiedDocumentOrganizer({
            vaultPath: this.config.vaultPath,
            aiEnabled: true,
            encryptionKey: process.env.DOCUMENT_ENCRYPTION_KEY || 'scaffold-default-key-2025'
        });
        
        this.stats = {
            totalFiles: 0,
            processedFiles: 0,
            skippedFiles: 0,
            errorFiles: 0,
            duplicates: 0,
            encrypted: 0,
            bucketDistribution: {},
            tagDistribution: {},
            processingTime: 0
        };
        
        this.processedFiles = new Set();
        this.errors = [];
        
        console.log('🏗️ PROJECT SCAFFOLDER INITIALIZED');
        console.log(`📁 Project root: ${this.config.projectRoot}`);
        console.log(`🗂️ Vault path: ${this.config.vaultPath}`);
        console.log(`📦 Batch size: ${this.config.batchSize}`);
    }
    
    async scaffoldEntireProject() {
        const startTime = Date.now();
        
        console.log('\n🚀 STARTING COMPREHENSIVE PROJECT SCAFFOLDING');
        console.log('==============================================');
        
        try {
            // Initialize the document organizer
            await this.organizer.initialize();
            
            // Discover all files in the project
            console.log('\n🔍 Discovering project files...');
            const allFiles = await this.discoverProjectFiles();
            
            console.log(`📊 Discovery complete:`);
            console.log(`   Total files found: ${allFiles.length}`);
            console.log(`   File types: ${this.getFileTypeDistribution(allFiles)}`);
            
            // Process files in batches
            console.log('\n📄 Processing documents in batches...');
            await this.processBatches(allFiles);
            
            // Generate final report
            this.stats.processingTime = Date.now() - startTime;
            await this.generateScaffoldingReport();
            
            console.log('\n✅ PROJECT SCAFFOLDING COMPLETE!');
            console.log(`⏱️ Total time: ${(this.stats.processingTime / 1000).toFixed(2)}s`);
            console.log(`📁 Vault created at: ${this.config.vaultPath}`);
            
            return {
                success: true,
                stats: this.stats,
                vaultPath: this.config.vaultPath,
                errors: this.errors
            };
            
        } catch (error) {
            console.error('❌ Scaffolding failed:', error);
            throw error;
        }
    }
    
    async discoverProjectFiles() {
        const files = [];
        
        async function walkDirectory(dir, currentDepth = 0) {
            if (currentDepth > 10) return; // Prevent infinite recursion
            
            try {
                const entries = await fs.readdir(dir, { withFileTypes: true });
                
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);
                    
                    if (entry.isDirectory()) {
                        // Check if directory should be skipped
                        if (!this.shouldSkipPath(fullPath)) {
                            await walkDirectory.call(this, fullPath, currentDepth + 1);
                        }
                    } else if (entry.isFile()) {
                        if (this.shouldIncludeFile(fullPath)) {
                            files.push(fullPath);
                        }
                    }
                }
            } catch (error) {
                console.warn(`⚠️ Cannot read directory ${dir}: ${error.message}`);
            }
        }
        
        await walkDirectory.call(this, this.config.projectRoot);
        this.stats.totalFiles = files.length;
        
        return files;
    }
    
    shouldSkipPath(filePath) {
        const relativePath = path.relative(this.config.projectRoot, filePath);
        
        for (const pattern of this.config.skipPatterns) {
            if (this.matchesPattern(relativePath, pattern)) {
                return true;
            }
        }
        
        return false;
    }
    
    shouldIncludeFile(filePath) {
        const relativePath = path.relative(this.config.projectRoot, filePath);
        const fileName = path.basename(filePath);
        
        // Skip if matches skip patterns
        if (this.shouldSkipPath(filePath)) {
            return false;
        }
        
        // Check file size
        try {
            const stats = require('fs').statSync(filePath);
            if (stats.size > this.config.maxFileSize) {
                console.warn(`⚠️ Skipping large file: ${relativePath} (${(stats.size / 1024 / 1024).toFixed(2)}MB)`);
                return false;
            }
        } catch (error) {
            return false;
        }
        
        // Check include patterns
        for (const pattern of this.config.includePatterns) {
            if (this.matchesPattern(fileName, pattern)) {
                return true;
            }
        }
        
        return false;
    }
    
    matchesPattern(str, pattern) {
        // Convert glob pattern to regex
        const regexPattern = pattern
            .replace(/\./g, '\\.')
            .replace(/\*/g, '.*')
            .replace(/\?/g, '.');
        
        return new RegExp(`^${regexPattern}$`).test(str);
    }
    
    async processBatches(files) {
        const totalBatches = Math.ceil(files.length / this.config.batchSize);
        
        for (let i = 0; i < totalBatches; i++) {
            const batchStart = i * this.config.batchSize;
            const batchEnd = Math.min(batchStart + this.config.batchSize, files.length);
            const batch = files.slice(batchStart, batchEnd);
            
            console.log(`\n📦 Processing batch ${i + 1}/${totalBatches} (${batch.length} files)`);
            
            await this.processBatch(batch, i + 1);
            
            // Progress update
            const progress = ((i + 1) / totalBatches * 100).toFixed(1);
            console.log(`📊 Progress: ${progress}% (${this.stats.processedFiles}/${files.length} files)`);
        }
    }
    
    async processBatch(files, batchNumber) {
        const batchPromises = files.map(async (filePath) => {
            try {
                await this.processFile(filePath);
            } catch (error) {
                this.handleFileError(filePath, error);
            }
        });
        
        await Promise.all(batchPromises);
    }
    
    async processFile(filePath) {
        if (this.processedFiles.has(filePath)) {
            this.stats.skippedFiles++;
            return;
        }
        
        const relativePath = path.relative(this.config.projectRoot, filePath);
        
        try {
            // Process document with organizer
            const result = await this.organizer.processDocument(filePath, {
                context: 'project-scaffolding',
                relativePath: relativePath,
                batchProcessing: true
            });
            
            if (result.success) {
                this.stats.processedFiles++;
                
                // Update statistics
                if (result.duplicate) {
                    this.stats.duplicates++;
                } else {
                    const doc = result.document;
                    
                    // Track bucket distribution
                    this.stats.bucketDistribution[doc.bucket] = 
                        (this.stats.bucketDistribution[doc.bucket] || 0) + 1;
                    
                    // Track tag distribution
                    if (doc.tags) {
                        for (const tag of doc.tags) {
                            this.stats.tagDistribution[tag] = 
                                (this.stats.tagDistribution[tag] || 0) + 1;
                        }
                    }
                    
                    // Track encryption
                    if (doc.encrypted) {
                        this.stats.encrypted++;
                    }
                }
                
                console.log(`✅ ${relativePath} → ${result.document.bucket}/${result.document.subBucket}`);
            } else {
                this.handleFileError(filePath, new Error(result.error));
            }
            
            this.processedFiles.add(filePath);
            
        } catch (error) {
            this.handleFileError(filePath, error);
        }
    }
    
    handleFileError(filePath, error) {
        const relativePath = path.relative(this.config.projectRoot, filePath);
        this.stats.errorFiles++;
        
        this.errors.push({
            file: relativePath,
            error: error.message,
            timestamp: new Date().toISOString()
        });
        
        console.error(`❌ Error processing ${relativePath}: ${error.message}`);
    }
    
    getFileTypeDistribution(files) {
        const distribution = {};
        
        for (const file of files) {
            const ext = path.extname(file).toLowerCase() || '.none';
            distribution[ext] = (distribution[ext] || 0) + 1;
        }
        
        return Object.entries(distribution)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([ext, count]) => `${ext}(${count})`)
            .join(', ');
    }
    
    async generateScaffoldingReport() {
        const report = {
            scaffolding: {
                timestamp: new Date().toISOString(),
                projectRoot: this.config.projectRoot,
                vaultPath: this.config.vaultPath,
                processingTime: this.stats.processingTime,
                version: '1.0.0'
            },
            statistics: this.stats,
            organizerStats: this.organizer.getStats(),
            bucketSummary: this.generateBucketSummary(),
            topTags: this.getTopTags(20),
            errors: this.errors.slice(0, 50) // Limit error list
        };
        
        // Save detailed report
        const reportPath = path.join(this.config.vaultPath, '.metadata', 'scaffolding-report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        // Save summary report
        const summaryPath = path.join(this.config.vaultPath, 'SCAFFOLDING-SUMMARY.md');
        await fs.writeFile(summaryPath, this.generateMarkdownSummary(report));
        
        console.log(`\n📊 SCAFFOLDING SUMMARY:`);
        console.log(`   Files processed: ${this.stats.processedFiles}/${this.stats.totalFiles}`);
        console.log(`   Success rate: ${((this.stats.processedFiles / this.stats.totalFiles) * 100).toFixed(1)}%`);
        console.log(`   Duplicates found: ${this.stats.duplicates}`);
        console.log(`   Files encrypted: ${this.stats.encrypted}`);
        console.log(`   Errors: ${this.stats.errorFiles}`);
        console.log(`   Processing time: ${(this.stats.processingTime / 1000).toFixed(2)}s`);
        
        console.log(`\n📁 BUCKET DISTRIBUTION:`);
        Object.entries(this.stats.bucketDistribution)
            .sort(([,a], [,b]) => b - a)
            .forEach(([bucket, count]) => {
                console.log(`   ${bucket}: ${count} files`);
            });
        
        console.log(`\n🏷️ TOP TAGS:`);
        this.getTopTags(10).forEach(([tag, count]) => {
            console.log(`   ${tag}: ${count} occurrences`);
        });
        
        if (this.errors.length > 0) {
            console.log(`\n❌ ERRORS (showing first 5):`);
            this.errors.slice(0, 5).forEach(error => {
                console.log(`   ${error.file}: ${error.error}`);
            });
        }
        
        console.log(`\n📄 Reports saved:`);
        console.log(`   Detailed: ${reportPath}`);
        console.log(`   Summary: ${summaryPath}`);
    }
    
    generateBucketSummary() {
        return Object.entries(this.stats.bucketDistribution).map(([bucket, count]) => ({
            bucket,
            count,
            percentage: ((count / this.stats.processedFiles) * 100).toFixed(1)
        })).sort((a, b) => b.count - a.count);
    }
    
    getTopTags(limit = 10) {
        return Object.entries(this.stats.tagDistribution)
            .sort(([,a], [,b]) => b - a)
            .slice(0, limit);
    }
    
    generateMarkdownSummary(report) {
        return `# Project Scaffolding Summary

## Overview
- **Processed**: ${report.scaffolding.timestamp}
- **Project Root**: ${report.scaffolding.projectRoot}
- **Vault Path**: ${report.scaffolding.vaultPath}
- **Processing Time**: ${(report.scaffolding.processingTime / 1000).toFixed(2)} seconds

## Statistics
- **Total Files**: ${this.stats.totalFiles}
- **Successfully Processed**: ${this.stats.processedFiles}
- **Success Rate**: ${((this.stats.processedFiles / this.stats.totalFiles) * 100).toFixed(1)}%
- **Duplicates Found**: ${this.stats.duplicates}
- **Files Encrypted**: ${this.stats.encrypted}
- **Errors**: ${this.stats.errorFiles}

## Bucket Distribution
${report.bucketSummary.map(bucket => 
    `- **${bucket.bucket}**: ${bucket.count} files (${bucket.percentage}%)`
).join('\n')}

## Top Tags
${report.topTags.map(([tag, count]) => 
    `- **${tag}**: ${count} occurrences`
).join('\n')}

${this.errors.length > 0 ? `
## Errors
${this.errors.slice(0, 10).map(error => 
    `- **${error.file}**: ${error.error}`
).join('\n')}
` : ''}

---
*Generated by Project Scaffolder v${report.scaffolding.version}*
`;
    }
}

// CLI Usage
if (require.main === module) {
    const scaffolder = new ProjectScaffolder({
        projectRoot: process.argv[2] || '/Users/matthewmauer/Desktop/Document-Generator',
        vaultPath: process.argv[3] || undefined,
        batchSize: parseInt(process.argv[4]) || 25
    });
    
    scaffolder.scaffoldEntireProject()
        .then(result => {
            console.log('\n🎉 SCAFFOLDING SUCCESSFUL!');
            console.log(`📊 Final stats:`, result.stats);
            
            if (result.errors.length > 0) {
                console.log(`⚠️ ${result.errors.length} errors occurred - check the detailed report`);
            }
            
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 SCAFFOLDING FAILED:', error);
            process.exit(1);
        });
}

module.exports = ProjectScaffolder;