#!/usr/bin/env node

/**
 * MAID CLEANUP SYSTEM
 * Handles the fucking mess and keeps everything organized
 * XML mapping, tagging structure, file organization
 */

const fs = require('fs').promises;
const path = require('path');

class MaidCleanupSystem {
    constructor() {
        this.cleanupRules = new Map();
        this.xmlMappings = new Map();
        this.tagStructures = new Map();
        this.messDetector = new Map();
        this.organizationPlan = new Map();
        
        this.workspaces = [
            '/Users/matthewmauer/Desktop/Document-Generator/brain-workspace',
            '/Users/matthewmauer/Desktop/Document-Generator',
            '/Users/matthewmauer/Desktop/Document-Generator/mcp',
            '/Users/matthewmauer/Desktop/Document-Generator/FinishThisIdea'
        ];
        
        this.init();
    }
    
    async init() {
        console.log('🧹 MAID CLEANUP SYSTEM STARTING...');
        
        // Analyze current mess
        await this.analyzeMess();
        
        // Setup XML mapping structure
        await this.setupXMLMappings();
        
        // Create cleanup rules
        await this.createCleanupRules();
        
        // Start continuous cleanup
        this.startContinuousCleanup();
        
        console.log('✨ MAID SYSTEM READY - NO MORE FUCKING MESS');
    }
    
    async analyzeMess() {
        console.log('🔍 Analyzing the mess...');
        
        for (const workspace of this.workspaces) {
            try {
                const messLevel = await this.calculateMessLevel(workspace);
                this.messDetector.set(workspace, messLevel);
                console.log(`📊 ${workspace}: ${messLevel}% messy`);
            } catch (error) {
                console.log(`⚠️ Can't analyze ${workspace}: ${error.message}`);
            }
        }
    }
    
    async calculateMessLevel(dirPath) {
        try {
            const items = await this.getAllItems(dirPath);
            let messScore = 0;
            
            // Check for duplicates
            const names = items.map(item => path.basename(item));
            const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
            messScore += duplicates.length * 10;
            
            // Check for bad naming
            const badNames = items.filter(item => {
                const name = path.basename(item);
                return name.includes('untitled') || 
                       name.includes('copy') || 
                       name.match(/\d{13,}/) || // timestamps
                       name.includes('temp') ||
                       name.includes('backup');
            });
            messScore += badNames.length * 15;
            
            // Check for orphaned files
            const orphaned = items.filter(item => {
                const name = path.basename(item);
                return name.startsWith('.') && !name.includes('git') && !name.includes('env');
            });
            messScore += orphaned.length * 5;
            
            // Check for size (too many files)
            if (items.length > 100) messScore += (items.length - 100) * 2;
            
            return Math.min(100, messScore);
        } catch (error) {
            return 0;
        }
    }
    
    async getAllItems(dirPath) {
        const items = [];
        
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                items.push(fullPath);
                
                if (entry.isDirectory() && !entry.name.startsWith('.')) {
                    const subItems = await this.getAllItems(fullPath);
                    items.push(...subItems);
                }
            }
        } catch (error) {
            // Directory doesn't exist or no permission
        }
        
        return items;
    }
    
    async setupXMLMappings() {
        console.log('🗺️ Setting up XML mapping structure...');
        
        // Create proper XML schema for all data types
        this.xmlMappings.set('task_plan', {
            root: 'TaskPlan',
            schema: {
                'TaskPlan': {
                    '@': { id: 'string', created: 'datetime', status: 'string' },
                    'MetaData': {
                        'Title': 'string',
                        'Priority': 'number',
                        'Complexity': 'number',
                        'EstimatedTime': 'number'
                    },
                    'Steps': {
                        'Step': [{
                            '@': { id: 'string', component: 'string' },
                            'Input': 'string',
                            'Status': 'string',
                            'Dependencies': { 'Dependency': ['string'] }
                        }]
                    },
                    'Results': {
                        'Output': [{
                            '@': { type: 'string', format: 'string' },
                            'FilePath': 'string',
                            'Content': 'string'
                        }]
                    }
                }
            }
        });
        
        this.xmlMappings.set('grant_data', {
            root: 'GrantOpportunity',
            schema: {
                'GrantOpportunity': {
                    '@': { id: 'string', source: 'string', scraped: 'datetime' },
                    'BasicInfo': {
                        'Title': 'string',
                        'Agency': 'string',
                        'Amount': { '@': { min: 'number', max: 'number', currency: 'string' } },
                        'Deadline': 'date'
                    },
                    'Eligibility': {
                        'Requirements': { 'Requirement': ['string'] },
                        'Restrictions': { 'Restriction': ['string'] }
                    },
                    'Application': {
                        'Process': 'string',
                        'Documents': { 'Document': ['string'] },
                        'MatchScore': 'number'
                    }
                }
            }
        });
        
        this.xmlMappings.set('weather_storm', {
            root: 'StormData',
            schema: {
                'StormData': {
                    '@': { timestamp: 'datetime', location: 'string' },
                    'Current': {
                        'Temperature': { '@': { unit: 'string' }, '#text': 'number' },
                        'Pressure': { '@': { unit: 'string' }, '#text': 'number' },
                        'Humidity': { '@': { unit: 'string' }, '#text': 'number' },
                        'Conditions': 'string'
                    },
                    'Forecast': {
                        'Prediction': [{
                            '@': { hours: 'number' },
                            'Intensity': 'number',
                            'Movement': 'string',
                            'Impact': 'string'
                        }]
                    }
                }
            }
        });
        
        console.log('✅ XML mappings configured');
    }
    
    async createCleanupRules() {
        console.log('📋 Creating cleanup rules...');
        
        // File organization rules
        this.cleanupRules.set('file_organization', {
            priority: 1,
            rules: [
                { pattern: /.*\.md$/, destination: 'documents/markdown/' },
                { pattern: /.*\.json$/, destination: 'data/json/' },
                { pattern: /.*\.js$/, destination: 'code/javascript/' },
                { pattern: /.*\.html$/, destination: 'code/web/' },
                { pattern: /.*\.sql$/, destination: 'data/sql/' },
                { pattern: /plan_\d+.*/, destination: 'tasks/plans/' },
                { pattern: /TODO.*\.md$/, destination: 'tasks/todos/' },
                { pattern: /.*-results\.md$/, destination: 'outputs/results/' }
            ]
        });
        
        // Duplicate removal rules
        this.cleanupRules.set('duplicate_removal', {
            priority: 2,
            rules: [
                { action: 'merge_similar_files', threshold: 0.9 },
                { action: 'remove_exact_duplicates', keep: 'newest' },
                { action: 'archive_old_versions', age_days: 7 }
            ]
        });
        
        // Naming convention rules
        this.cleanupRules.set('naming_conventions', {
            priority: 3,
            rules: [
                { pattern: /untitled/, replacement: 'auto_generated_' },
                { pattern: /copy\s*\d*/, replacement: 'v2_' },
                { pattern: /temp/, replacement: 'draft_' },
                { pattern: /\s+/g, replacement: '_' },
                { pattern: /[^a-zA-Z0-9_.-]/g, replacement: '' }
            ]
        });
        
        console.log('✅ Cleanup rules created');
    }
    
    async startContinuousCleanup() {
        console.log('🔄 Starting continuous cleanup...');
        
        // Run cleanup every 5 minutes
        setInterval(async () => {
            await this.performCleanup();
        }, 300000);
        
        // Run deep cleanup every hour
        setInterval(async () => {
            await this.performDeepCleanup();
        }, 3600000);
        
        // Initial cleanup
        await this.performCleanup();
    }
    
    async performCleanup() {
        console.log('🧹 Performing routine cleanup...');
        
        for (const workspace of this.workspaces) {
            try {
                await this.cleanupWorkspace(workspace);
            } catch (error) {
                console.log(`⚠️ Cleanup failed for ${workspace}: ${error.message}`);
            }
        }
        
        console.log('✨ Routine cleanup complete');
    }
    
    async cleanupWorkspace(workspace) {
        const items = await this.getAllItems(workspace);
        
        // Apply file organization rules
        await this.applyFileOrganization(workspace, items);
        
        // Remove duplicates
        await this.removeDuplicates(workspace, items);
        
        // Fix naming conventions
        await this.fixNamingConventions(workspace, items);
        
        // Convert data to proper XML format
        await this.convertToXML(workspace, items);
    }
    
    async applyFileOrganization(workspace, items) {
        const rules = this.cleanupRules.get('file_organization').rules;
        
        for (const item of items) {
            const relativePath = path.relative(workspace, item);
            const fileName = path.basename(item);
            
            for (const rule of rules) {
                if (rule.pattern.test(fileName) || rule.pattern.test(relativePath)) {
                    const newDir = path.join(workspace, rule.destination);
                    const newPath = path.join(newDir, fileName);
                    
                    try {
                        await fs.mkdir(newDir, { recursive: true });
                        
                        // Only move if not already in correct location
                        if (item !== newPath) {
                            await fs.rename(item, newPath);
                            console.log(`📁 Moved: ${fileName} → ${rule.destination}`);
                        }
                    } catch (error) {
                        // File might already exist or be in use
                    }
                    break;
                }
            }
        }
    }
    
    async removeDuplicates(workspace, items) {
        const fileHashes = new Map();
        const duplicates = [];
        
        for (const item of items) {
            try {
                const stat = await fs.stat(item);
                if (stat.isFile()) {
                    const content = await fs.readFile(item, 'utf8');
                    const hash = this.simpleHash(content);
                    
                    if (fileHashes.has(hash)) {
                        duplicates.push({
                            original: fileHashes.get(hash),
                            duplicate: item,
                            size: stat.size
                        });
                    } else {
                        fileHashes.set(hash, item);
                    }
                }
            } catch (error) {
                // Skip files we can't read
            }
        }
        
        // Remove duplicates (keep the one with better name)
        for (const dup of duplicates) {
            try {
                const originalName = path.basename(dup.original);
                const duplicateName = path.basename(dup.duplicate);
                
                // Keep the one with better naming
                if (this.isBetterName(originalName, duplicateName)) {
                    await fs.unlink(dup.duplicate);
                    console.log(`🗑️ Removed duplicate: ${duplicateName}`);
                } else {
                    await fs.unlink(dup.original);
                    console.log(`🗑️ Removed duplicate: ${originalName}`);
                }
            } catch (error) {
                // File might already be deleted
            }
        }
    }
    
    async fixNamingConventions(workspace, items) {
        const rules = this.cleanupRules.get('naming_conventions').rules;
        
        for (const item of items) {
            let newName = path.basename(item);
            let changed = false;
            
            for (const rule of rules) {
                const original = newName;
                newName = newName.replace(rule.pattern, rule.replacement);
                if (newName !== original) changed = true;
            }
            
            if (changed && newName !== path.basename(item)) {
                try {
                    const newPath = path.join(path.dirname(item), newName);
                    await fs.rename(item, newPath);
                    console.log(`✏️ Renamed: ${path.basename(item)} → ${newName}`);
                } catch (error) {
                    // File might already exist with that name
                }
            }
        }
    }
    
    async convertToXML(workspace, items) {
        // Find JSON and markdown files that should be XML
        const jsonFiles = items.filter(item => item.endsWith('.json'));
        const mdFiles = items.filter(item => item.endsWith('.md'));
        
        for (const jsonFile of jsonFiles) {
            try {
                const content = await fs.readFile(jsonFile, 'utf8');
                const data = JSON.parse(content);
                
                // Determine appropriate XML mapping
                const mapping = this.determineXMLMapping(data, path.basename(jsonFile));
                if (mapping) {
                    const xmlContent = await this.convertToXMLFormat(data, mapping);
                    const xmlPath = jsonFile.replace('.json', '.xml');
                    
                    await fs.writeFile(xmlPath, xmlContent);
                    console.log(`🔄 Converted to XML: ${path.basename(jsonFile)}`);
                }
            } catch (error) {
                // Skip invalid JSON files
            }
        }
    }
    
    determineXMLMapping(data, filename) {
        // Analyze data structure to determine appropriate XML mapping
        if (filename.includes('grant') || data.grants || data.amount) {
            return this.xmlMappings.get('grant_data');
        }
        
        if (filename.includes('plan') || data.steps || data.id && data.id.startsWith('plan_')) {
            return this.xmlMappings.get('task_plan');
        }
        
        if (data.temperature || data.weather || data.storm || data.pressure) {
            return this.xmlMappings.get('weather_storm');
        }
        
        return null;
    }
    
    async convertToXMLFormat(data, mapping) {
        // Simple XML builder without external dependencies
        const transformedData = this.transformDataForXML(data, mapping.schema);
        const xmlContent = this.buildXMLString(transformedData, mapping.root);
        
        return `<?xml version="1.0" encoding="UTF-8"?>\n${xmlContent}`;
    }
    
    buildXMLString(data, rootName = 'root') {
        if (typeof data === 'string' || typeof data === 'number') {
            return `<${rootName}>${data}</${rootName}>`;
        }
        
        if (Array.isArray(data)) {
            return data.map(item => this.buildXMLString(item, rootName)).join('\n');
        }
        
        if (typeof data === 'object' && data !== null) {
            let xml = `<${rootName}>`;
            for (const [key, value] of Object.entries(data)) {
                xml += '\n  ' + this.buildXMLString(value, key).split('\n').join('\n  ');
            }
            xml += `\n</${rootName}>`;
            return xml;
        }
        
        return `<${rootName}></${rootName}>`;
    }
    
    transformDataForXML(data, schema) {
        // This is a simplified transformation
        // In practice, you'd need more sophisticated mapping
        if (Array.isArray(data)) {
            return data.map(item => this.transformDataForXML(item, schema));
        }
        
        if (typeof data === 'object' && data !== null) {
            const transformed = {};
            for (const [key, value] of Object.entries(data)) {
                // Convert camelCase to PascalCase for XML
                const xmlKey = key.charAt(0).toUpperCase() + key.slice(1);
                transformed[xmlKey] = this.transformDataForXML(value, schema);
            }
            return transformed;
        }
        
        return data;
    }
    
    async performDeepCleanup() {
        console.log('🧽 Performing deep cleanup...');
        
        // Archive old files
        await this.archiveOldFiles();
        
        // Optimize file structure
        await this.optimizeFileStructure();
        
        // Generate cleanup report
        await this.generateCleanupReport();
        
        console.log('✨ Deep cleanup complete');
    }
    
    async archiveOldFiles() {
        const archiveDir = '/Users/matthewmauer/Desktop/Document-Generator/archive';
        await fs.mkdir(archiveDir, { recursive: true });
        
        for (const workspace of this.workspaces) {
            const items = await this.getAllItems(workspace);
            
            for (const item of items) {
                try {
                    const stat = await fs.stat(item);
                    const daysSinceModified = (Date.now() - stat.mtime.getTime()) / (1000 * 60 * 60 * 24);
                    
                    if (daysSinceModified > 30 && stat.isFile()) {
                        const archivePath = path.join(archiveDir, path.basename(item));
                        await fs.rename(item, archivePath);
                        console.log(`📦 Archived: ${path.basename(item)}`);
                    }
                } catch (error) {
                    // Skip files we can't access
                }
            }
        }
    }
    
    async optimizeFileStructure() {
        // Create optimal directory structure
        const optimalStructure = [
            'tasks/active',
            'tasks/completed',
            'tasks/archived',
            'data/xml',
            'data/json',
            'data/sql',
            'code/javascript',
            'code/web',
            'documents/markdown',
            'documents/generated',
            'outputs/results',
            'outputs/deliverables',
            'logs/system',
            'logs/cleanup'
        ];
        
        for (const workspace of this.workspaces) {
            for (const dir of optimalStructure) {
                await fs.mkdir(path.join(workspace, dir), { recursive: true });
            }
        }
        
        console.log('📁 File structure optimized');
    }
    
    async generateCleanupReport() {
        const report = {
            timestamp: new Date().toISOString(),
            workspaces: [],
            total_files_processed: 0,
            duplicates_removed: 0,
            files_organized: 0,
            xml_conversions: 0
        };
        
        for (const workspace of this.workspaces) {
            const messLevel = this.messDetector.get(workspace) || 0;
            const itemCount = (await this.getAllItems(workspace)).length;
            
            report.workspaces.push({
                path: workspace,
                mess_level: messLevel,
                file_count: itemCount,
                status: messLevel < 20 ? 'clean' : messLevel < 50 ? 'moderate' : 'messy'
            });
            
            report.total_files_processed += itemCount;
        }
        
        const reportPath = '/Users/matthewmauer/Desktop/Document-Generator/MAID-CLEANUP-REPORT.xml';
        const xmlContent = await this.convertToXMLFormat(report, {
            root: 'CleanupReport',
            schema: {}
        });
        
        await fs.writeFile(reportPath, xmlContent);
        console.log('📊 Cleanup report generated');
    }
    
    // Helper functions
    simpleHash(content) {
        let hash = 0;
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }
    
    isBetterName(name1, name2) {
        // Prefer names without copy, temp, untitled, etc.
        const badWords = ['copy', 'temp', 'untitled', 'backup'];
        const name1Score = badWords.reduce((score, word) => 
            score + (name1.toLowerCase().includes(word) ? 1 : 0), 0);
        const name2Score = badWords.reduce((score, word) => 
            score + (name2.toLowerCase().includes(word) ? 1 : 0), 0);
        
        return name1Score < name2Score;
    }
}

// Start the maid system
if (require.main === module) {
    const maid = new MaidCleanupSystem();
    
    // Handle shutdown
    process.on('SIGINT', () => {
        console.log('\n🧹 Maid system shutting down...');
        process.exit(0);
    });
}

module.exports = MaidCleanupSystem;