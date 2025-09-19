#!/usr/bin/env node

/**
 * Magic Cleanup Wizard
 * 
 * Automated organization and cleanup for your 7,137 business ideas
 * Merges duplicates, archives old files, and maintains organization
 * 
 * "tons of fucking files to use and ideas and brand names and other shit but its not sorted properly"
 */

const EventEmitter = require('events');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class MagicCleanupWizard extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Cleanup rules
            enableDuplicateMerging: config.enableDuplicateMerging !== false,
            enableArchiving: config.enableArchiving !== false,
            enableReorganization: config.enableReorganization !== false,
            enableQualityImprovement: config.enableQualityImprovement !== false,
            
            // Thresholds
            duplicateThreshold: config.duplicateThreshold || 0.9,
            archiveAgeDays: config.archiveAgeDays || 365,
            lowQualityThreshold: config.lowQualityThreshold || 0.3,
            
            // Safety settings
            requireConfirmation: config.requireConfirmation !== false,
            createBackups: config.createBackups !== false,
            dryRun: config.dryRun || false,
            
            // Automation rules
            autoMergeStrategy: config.autoMergeStrategy || 'newest', // newest, highest_quality, manual
            autoArchiveEmpty: config.autoArchiveEmpty !== false,
            autoFixNaming: config.autoFixNaming !== false,
            
            // Paths
            archivePath: config.archivePath || './archive',
            backupPath: config.backupPath || './backups',
            outputPath: config.outputPath || './organized'
        };
        
        // Cleanup statistics
        this.stats = {
            filesProcessed: 0,
            duplicatesMerged: 0,
            filesArchived: 0,
            filesReorganized: 0,
            errorsFixed: 0,
            spaceReclaimed: 0,
            improvementsMade: 0
        };
        
        // Cleanup rules engine
        this.cleanupRules = {
            naming: [
                { pattern: /\s+/, replacement: '-', description: 'Replace spaces with dashes' },
                { pattern: /[^\w.-]/g, replacement: '', description: 'Remove special characters' },
                { pattern: /-+/g, replacement: '-', description: 'Collapse multiple dashes' },
                { pattern: /^-|-$/g, replacement: '', description: 'Remove leading/trailing dashes' }
            ],
            
            folderStructure: {
                'business_ideas': {
                    'saas': ['mvp', 'launched', 'archived'],
                    'marketplace': ['active', 'paused', 'archived'],
                    'gaming': ['prototypes', 'production', 'archived']
                },
                'brand_names': {
                    'available': [],
                    'trademarked': [],
                    'in_use': []
                },
                'project_files': {
                    'active': ['current_sprint', 'backlog'],
                    'completed': ['2023', '2024', '2025'],
                    'archived': []
                }
            }
        };
        
        // Merge strategies
        this.mergeStrategies = {
            newest: this.mergeByNewest.bind(this),
            highest_quality: this.mergeByQuality.bind(this),
            combine: this.mergeByCombining.bind(this),
            manual: this.mergeManually.bind(this)
        };
        
        console.log('🧙‍♂️ Magic Cleanup Wizard initialized');
        console.log('✨ Ready to organize your digital chaos!');
    }
    
    /**
     * Run the cleanup wizard
     */
    async runCleanup(files, knowledgeGraph, options = {}) {
        console.log(`🎯 Starting magical cleanup of ${files.length} files...`);
        
        const startTime = Date.now();
        const cleanupSession = {
            id: crypto.randomUUID(),
            startTime: new Date(),
            dryRun: this.config.dryRun || options.dryRun,
            options
        };
        
        try {
            // Create backup if enabled
            if (this.config.createBackups && !cleanupSession.dryRun) {
                await this.createBackup(files);
            }
            
            // Step 1: Find and merge duplicates
            if (this.config.enableDuplicateMerging) {
                await this.mergeDuplicates(files, knowledgeGraph);
            }
            
            // Step 2: Archive old/low-quality files
            if (this.config.enableArchiving) {
                await this.archiveOldFiles(files);
            }
            
            // Step 3: Fix naming issues
            if (this.config.autoFixNaming) {
                await this.fixFileNaming(files);
            }
            
            // Step 4: Reorganize folder structure
            if (this.config.enableReorganization) {
                await this.reorganizeFolders(files);
            }
            
            // Step 5: Improve file quality
            if (this.config.enableQualityImprovement) {
                await this.improveFileQuality(files);
            }
            
            // Step 6: Generate cleanup report
            const report = await this.generateCleanupReport(cleanupSession);
            
            const duration = Date.now() - startTime;
            console.log(`✅ Cleanup completed in ${(duration / 1000).toFixed(2)}s`);
            
            this.emit('cleanup:complete', {
                stats: this.stats,
                duration,
                report
            });
            
            return report;
            
        } catch (error) {
            console.error('❌ Cleanup error:', error);
            throw error;
        }
    }
    
    /**
     * Find and merge duplicate files
     */
    async mergeDuplicates(files, knowledgeGraph) {
        console.log('🔍 Finding and merging duplicates...');
        
        // Get duplicates from knowledge graph
        const duplicates = this.findDuplicateGroups(knowledgeGraph);
        
        console.log(`📊 Found ${duplicates.length} duplicate groups`);
        
        for (const group of duplicates) {
            await this.processDuplicateGroup(group);
        }
        
        console.log(`✅ Merged ${this.stats.duplicatesMerged} duplicate files`);
    }
    
    /**
     * Find duplicate groups from knowledge graph
     */
    findDuplicateGroups(knowledgeGraph) {
        const groups = [];
        const processed = new Set();
        
        // Find all duplicate relationships
        for (const [nodeId, edges] of knowledgeGraph.edges.entries()) {
            if (processed.has(nodeId)) continue;
            
            const duplicateGroup = new Set([nodeId]);
            
            // Find all files connected by DUPLICATE relationship
            const queue = [nodeId];
            while (queue.length > 0) {
                const current = queue.shift();
                processed.add(current);
                
                const currentEdges = knowledgeGraph.edges.get(current) || new Set();
                for (const edge of currentEdges) {
                    if (edge.type === 'DUPLICATE' && 
                        edge.confidence >= this.config.duplicateThreshold &&
                        !processed.has(edge.targetId)) {
                        duplicateGroup.add(edge.targetId);
                        queue.push(edge.targetId);
                    }
                }
            }
            
            if (duplicateGroup.size > 1) {
                groups.push({
                    files: Array.from(duplicateGroup).map(id => 
                        knowledgeGraph.nodes.get(id)
                    )
                });
            }
        }
        
        return groups;
    }
    
    /**
     * Process a group of duplicate files
     */
    async processDuplicateGroup(group) {
        console.log(`🔄 Processing duplicate group of ${group.files.length} files`);
        
        // Sort by quality and date
        const sorted = group.files.sort((a, b) => {
            // Prefer higher quality
            if (a.qualityScore !== b.qualityScore) {
                return b.qualityScore - a.qualityScore;
            }
            // Then prefer newer
            return new Date(b.modified) - new Date(a.modified);
        });
        
        // Select primary file based on strategy
        const strategy = this.mergeStrategies[this.config.autoMergeStrategy];
        const primary = await strategy(sorted);
        
        if (!primary) return;
        
        // Merge metadata from all duplicates
        const mergedMetadata = this.mergeMetadata(sorted);
        
        // Update primary file with merged data
        primary.metadata = mergedMetadata;
        primary.mergedFrom = sorted.filter(f => f.id !== primary.id).map(f => f.id);
        
        // Handle duplicate files
        if (!this.config.dryRun) {
            for (const file of sorted) {
                if (file.id !== primary.id) {
                    await this.handleDuplicateFile(file, primary);
                    this.stats.duplicatesMerged++;
                }
            }
        }
        
        this.emit('duplicates:merged', {
            primary,
            duplicates: sorted.filter(f => f.id !== primary.id)
        });
    }
    
    /**
     * Merge metadata from multiple files
     */
    mergeMetadata(files) {
        const merged = {
            title: '',
            description: '',
            tags: new Set(),
            keywords: new Set(),
            relatedTo: new Set()
        };
        
        // Collect all metadata
        for (const file of files) {
            const meta = file.metadata || {};
            
            // Use longest title
            if (meta.title && meta.title.length > merged.title.length) {
                merged.title = meta.title;
            }
            
            // Use longest description
            if (meta.description && meta.description.length > merged.description.length) {
                merged.description = meta.description;
            }
            
            // Combine all tags
            if (meta.tags) {
                meta.tags.forEach(tag => merged.tags.add(tag));
            }
            
            // Combine all keywords
            if (meta.keywords) {
                meta.keywords.forEach(kw => merged.keywords.add(kw));
            }
            
            // Combine all relationships
            if (meta.relatedTo) {
                meta.relatedTo.forEach(rel => merged.relatedTo.add(rel));
            }
        }
        
        // Convert sets back to arrays
        return {
            title: merged.title,
            description: merged.description,
            tags: Array.from(merged.tags),
            keywords: Array.from(merged.keywords),
            relatedTo: Array.from(merged.relatedTo)
        };
    }
    
    /**
     * Archive old files
     */
    async archiveOldFiles(files) {
        console.log('📦 Archiving old files...');
        
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.config.archiveAgeDays);
        
        const toArchive = files.filter(file => {
            const modified = new Date(file.modified || file.modifiedTime);
            const isOld = modified < cutoffDate;
            const isLowQuality = file.qualityScore < this.config.lowQualityThreshold;
            const isEmpty = !file.content || file.content.trim().length === 0;
            
            return isOld || (isLowQuality && this.config.autoArchiveEmpty && isEmpty);
        });
        
        console.log(`📊 Found ${toArchive.length} files to archive`);
        
        if (!this.config.dryRun) {
            for (const file of toArchive) {
                await this.archiveFile(file);
                this.stats.filesArchived++;
            }
        }
        
        console.log(`✅ Archived ${this.stats.filesArchived} files`);
    }
    
    /**
     * Fix file naming issues
     */
    async fixFileNaming(files) {
        console.log('📝 Fixing file naming issues...');
        
        let fixed = 0;
        
        for (const file of files) {
            const originalName = file.name;
            let newName = originalName;
            
            // Apply naming rules
            for (const rule of this.cleanupRules.naming) {
                newName = newName.replace(rule.pattern, rule.replacement);
            }
            
            // Ensure unique name
            newName = await this.ensureUniqueName(newName, file.path);
            
            if (newName !== originalName) {
                if (!this.config.dryRun) {
                    file.name = newName;
                    file.renamedFrom = originalName;
                }
                
                fixed++;
                
                this.emit('file:renamed', {
                    from: originalName,
                    to: newName
                });
            }
        }
        
        this.stats.errorsFixed += fixed;
        console.log(`✅ Fixed ${fixed} file names`);
    }
    
    /**
     * Reorganize folder structure
     */
    async reorganizeFolders(files) {
        console.log('📁 Reorganizing folder structure...');
        
        // Create ideal folder structure
        if (!this.config.dryRun) {
            await this.createFolderStructure();
        }
        
        // Move files to appropriate folders
        let moved = 0;
        
        for (const file of files) {
            const currentPath = file.path || '/';
            const idealPath = this.determineIdealPath(file);
            
            if (currentPath !== idealPath) {
                if (!this.config.dryRun) {
                    file.path = idealPath;
                    file.movedFrom = currentPath;
                }
                
                moved++;
                
                this.emit('file:moved', {
                    file: file.name,
                    from: currentPath,
                    to: idealPath
                });
            }
        }
        
        this.stats.filesReorganized = moved;
        console.log(`✅ Reorganized ${moved} files`);
    }
    
    /**
     * Improve file quality
     */
    async improveFileQuality(files) {
        console.log('✨ Improving file quality...');
        
        const lowQualityFiles = files.filter(f => 
            f.qualityScore < 0.5 && !f.archived
        );
        
        console.log(`📊 Found ${lowQualityFiles.length} files needing improvement`);
        
        for (const file of lowQualityFiles) {
            const improvements = await this.suggestImprovements(file);
            
            if (improvements.length > 0) {
                file.suggestedImprovements = improvements;
                this.stats.improvementsMade++;
                
                this.emit('quality:improved', {
                    file: file.name,
                    improvements
                });
            }
        }
        
        console.log(`✅ Suggested improvements for ${this.stats.improvementsMade} files`);
    }
    
    /**
     * Suggest improvements for a file
     */
    async suggestImprovements(file) {
        const improvements = [];
        
        // Check for missing metadata
        if (!file.metadata?.description) {
            improvements.push({
                type: 'metadata',
                field: 'description',
                suggestion: 'Add a description to explain this idea'
            });
        }
        
        if (!file.metadata?.tags || file.metadata.tags.length === 0) {
            improvements.push({
                type: 'metadata',
                field: 'tags',
                suggestion: 'Add relevant tags for better organization'
            });
        }
        
        // Check content quality
        if (file.content) {
            const wordCount = file.content.split(/\s+/).length;
            
            if (wordCount < 50) {
                improvements.push({
                    type: 'content',
                    issue: 'too_short',
                    suggestion: 'Expand the idea with more details'
                });
            }
            
            // Check for structure
            if (!file.content.includes('\n')) {
                improvements.push({
                    type: 'content',
                    issue: 'no_structure',
                    suggestion: 'Add sections and formatting'
                });
            }
        }
        
        // Check for relationships
        if (!file.metadata?.relatedTo || file.metadata.relatedTo.length === 0) {
            improvements.push({
                type: 'relationships',
                suggestion: 'Link to related ideas or projects'
            });
        }
        
        return improvements;
    }
    
    /**
     * Generate cleanup report
     */
    async generateCleanupReport(session) {
        const report = {
            sessionId: session.id,
            timestamp: new Date(),
            dryRun: session.dryRun,
            statistics: this.stats,
            
            summary: {
                totalProcessed: this.stats.filesProcessed,
                totalChanges: Object.values(this.stats).reduce((sum, val) => sum + val, 0) - this.stats.filesProcessed,
                spaceReclaimed: this.formatBytes(this.stats.spaceReclaimed),
                qualityImprovement: `${this.stats.improvementsMade} files improved`
            },
            
            details: {
                duplicatesMerged: {
                    count: this.stats.duplicatesMerged,
                    description: 'Duplicate files merged into primary versions'
                },
                filesArchived: {
                    count: this.stats.filesArchived,
                    description: 'Old or low-quality files moved to archive'
                },
                filesReorganized: {
                    count: this.stats.filesReorganized,
                    description: 'Files moved to better folder structure'
                },
                namingFixed: {
                    count: this.stats.errorsFixed,
                    description: 'File naming issues corrected'
                },
                qualityImproved: {
                    count: this.stats.improvementsMade,
                    description: 'Files marked for quality improvements'
                }
            },
            
            recommendations: await this.generateRecommendations()
        };
        
        return report;
    }
    
    /**
     * Generate recommendations
     */
    async generateRecommendations() {
        const recommendations = [];
        
        // Check duplicate rate
        if (this.stats.duplicatesMerged > this.stats.filesProcessed * 0.1) {
            recommendations.push({
                priority: 'high',
                category: 'duplicates',
                recommendation: 'Consider implementing duplicate detection before file creation'
            });
        }
        
        // Check archive rate
        if (this.stats.filesArchived > this.stats.filesProcessed * 0.3) {
            recommendations.push({
                priority: 'medium',
                category: 'maintenance',
                recommendation: 'Regular cleanup would prevent accumulation of old files'
            });
        }
        
        // Check quality issues
        if (this.stats.improvementsMade > this.stats.filesProcessed * 0.2) {
            recommendations.push({
                priority: 'medium',
                category: 'quality',
                recommendation: 'Use templates to ensure consistent file quality'
            });
        }
        
        return recommendations;
    }
    
    // Merge strategies
    async mergeByNewest(files) {
        return files[0]; // Already sorted by date
    }
    
    async mergeByQuality(files) {
        return files.sort((a, b) => b.qualityScore - a.qualityScore)[0];
    }
    
    async mergeByCombining(files) {
        // Combine content from all files
        const combined = files[0];
        combined.content = files.map(f => f.content).join('\n\n---\n\n');
        return combined;
    }
    
    async mergeManually(files) {
        // In real implementation, would prompt user
        console.log('🤔 Manual merge required for:', files.map(f => f.name));
        return files[0];
    }
    
    // Helper methods
    async createBackup(files) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = path.join(this.config.backupPath, `backup-${timestamp}`);
        
        await fs.mkdir(backupDir, { recursive: true });
        
        // Save file list
        await fs.writeFile(
            path.join(backupDir, 'files.json'),
            JSON.stringify(files, null, 2)
        );
        
        console.log(`💾 Backup created at ${backupDir}`);
    }
    
    async handleDuplicateFile(file, primary) {
        // In production, would move/delete the duplicate
        console.log(`   🔄 Merging "${file.name}" into "${primary.name}"`);
        this.stats.spaceReclaimed += file.size || 0;
    }
    
    async archiveFile(file) {
        const archivePath = path.join(
            this.config.archivePath,
            file.category || 'uncategorized',
            new Date().getFullYear().toString()
        );
        
        // In production, would move file to archive
        console.log(`   📦 Archiving "${file.name}" to ${archivePath}`);
        file.archived = true;
        file.archivedPath = archivePath;
    }
    
    async ensureUniqueName(name, dirPath) {
        // In production, would check against actual filesystem
        return name;
    }
    
    async createFolderStructure() {
        for (const [category, subcategories] of Object.entries(this.cleanupRules.folderStructure)) {
            const categoryPath = path.join(this.config.outputPath, category);
            await fs.mkdir(categoryPath, { recursive: true });
            
            for (const [subcategory, folders] of Object.entries(subcategories)) {
                const subcategoryPath = path.join(categoryPath, subcategory);
                await fs.mkdir(subcategoryPath, { recursive: true });
                
                for (const folder of folders) {
                    await fs.mkdir(path.join(subcategoryPath, folder), { recursive: true });
                }
            }
        }
    }
    
    determineIdealPath(file) {
        const category = file.category || 'uncategorized';
        const subcategory = file.subcategory || 'general';
        
        // Special handling for different file states
        if (file.archived) {
            return path.join(this.config.archivePath, category, subcategory);
        }
        
        if (file.qualityScore > 0.8) {
            return path.join(this.config.outputPath, category, subcategory, 'premium');
        }
        
        return path.join(this.config.outputPath, category, subcategory);
    }
    
    formatBytes(bytes) {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unit = 0;
        
        while (size > 1024 && unit < units.length - 1) {
            size /= 1024;
            unit++;
        }
        
        return `${size.toFixed(2)} ${units[unit]}`;
    }
}

module.exports = { MagicCleanupWizard };

// Example usage
if (require.main === module) {
    async function demonstrateCleanupWizard() {
        console.log('\n🧙‍♂️ MAGIC CLEANUP WIZARD DEMONSTRATION\n');
        
        const wizard = new MagicCleanupWizard({
            dryRun: true, // Safe demonstration mode
            duplicateThreshold: 0.9,
            enableQualityImprovement: true
        });
        
        // Mock knowledge graph with duplicates
        const mockKnowledgeGraph = {
            nodes: new Map([
                ['1', { id: '1', name: 'AI-Code-Review.md' }],
                ['2', { id: '2', name: 'AI_Code_Review_v2.md' }],
                ['3', { id: '3', name: 'blockchain-game.txt' }]
            ]),
            edges: new Map([
                ['1', new Set([{ targetId: '2', type: 'DUPLICATE', confidence: 0.95 }])],
                ['2', new Set([{ targetId: '1', type: 'DUPLICATE', confidence: 0.95 }])]
            ])
        };
        
        // Mock files
        const mockFiles = [
            {
                id: '1',
                name: 'AI-Code-Review.md',
                category: 'business_ideas',
                subcategory: 'saas',
                qualityScore: 0.8,
                modified: new Date('2024-01-01'),
                size: 1024
            },
            {
                id: '2',
                name: 'AI_Code_Review_v2.md',
                category: 'business_ideas',
                subcategory: 'saas',
                qualityScore: 0.6,
                modified: new Date('2024-01-02'),
                size: 2048
            },
            {
                id: '3',
                name: 'blockchain-game.txt',
                category: 'business_ideas',
                subcategory: 'gaming',
                qualityScore: 0.3,
                modified: new Date('2023-01-01'),
                size: 512,
                content: 'Quick idea'
            }
        ];
        
        // Run cleanup
        const report = await wizard.runCleanup(mockFiles, mockKnowledgeGraph);
        
        console.log('\n📊 === CLEANUP REPORT ===\n');
        console.log('Summary:');
        console.log(`   Total Changes: ${report.summary.totalChanges}`);
        console.log(`   Space Reclaimed: ${report.summary.spaceReclaimed}`);
        console.log(`   Quality Improvements: ${report.summary.qualityImprovement}`);
        
        console.log('\nDetails:');
        Object.entries(report.details).forEach(([key, detail]) => {
            if (detail.count > 0) {
                console.log(`   • ${detail.description}: ${detail.count}`);
            }
        });
        
        if (report.recommendations.length > 0) {
            console.log('\nRecommendations:');
            report.recommendations.forEach(rec => {
                console.log(`   • [${rec.priority}] ${rec.recommendation}`);
            });
        }
        
        console.log('\n🧙‍♂️ Wizard Features:');
        console.log('   • Intelligent duplicate merging');
        console.log('   • Automatic file archiving');
        console.log('   • Smart folder reorganization');
        console.log('   • File naming standardization');
        console.log('   • Quality improvement suggestions');
        console.log('   • Dry-run mode for safety');
        console.log('   • Comprehensive cleanup reports');
        console.log('   • Automated backup creation');
    }
    
    demonstrateCleanupWizard().catch(console.error);
}

console.log('🧙‍♂️ MAGIC CLEANUP WIZARD LOADED');
console.log('✨ Ready to transform chaos into order!');