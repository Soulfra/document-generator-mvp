/**
 * 📁 File Registry System
 * 
 * Prevents duplicate files, tracks lineage, and maintains file organization
 * standards across the Document Generator ecosystem.
 * 
 * Features:
 * - Duplicate detection via content hashing
 * - Naming convention validation
 * - File lineage tracking
 * - Deprecation management
 * - Registry maintenance
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class FileRegistrySystem {
    constructor(rootDir = process.cwd()) {
        this.rootDir = rootDir;
        this.registryFile = path.join(rootDir, '.file-registry.json');
        this.registry = {
            files: new Map(),
            duplicates: new Map(),
            deprecated: new Map(),
            lineage: new Map(),
            lastUpdated: null,
            version: '1.0.0'
        };
        
        // Naming convention patterns
        this.namingPatterns = {
            upperKebab: /^[A-Z][A-Z0-9]*(-[A-Z0-9]+)*\.(md|json|yml|yaml)$/,
            lowerKebab: /^[a-z][a-z0-9]*(-[a-z0-9]+)*\.(js|ts|jsx|tsx|css|scss|html)$/,
            pascalCase: /^[A-Z][a-zA-Z0-9]*\.(jsx|tsx|vue)$/,
            configFile: /^[a-z][a-z0-9]*(-[a-z0-9]+)*\.(config|conf)\.(js|json|yml)$/,
            testFile: /^(test-|.*\.test\.)[a-z0-9-]+\.(js|ts)$/,
            deprecatedFile: /.*\.deprecated\.[a-z]+$/
        };
    }
    
    /**
     * Initialize or load existing registry
     */
    async initialize() {
        try {
            const data = await fs.readFile(this.registryFile, 'utf8');
            const parsed = JSON.parse(data);
            
            // Convert arrays back to Maps
            this.registry = {
                ...parsed,
                files: new Map(parsed.files),
                duplicates: new Map(parsed.duplicates),
                deprecated: new Map(parsed.deprecated),
                lineage: new Map(parsed.lineage)
            };
            
            console.log(`📁 Loaded registry with ${this.registry.files.size} files`);
        } catch (error) {
            console.log('📁 Creating new file registry...');
            await this.scanExistingFiles();
            await this.saveRegistry();
        }
    }
    
    /**
     * Recursively walk directory and find files
     */
    async walkDirectory(dir, ignorePatterns = []) {
        const files = [];
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relativePath = path.relative(this.rootDir, fullPath);
            
            // Check ignore patterns
            const shouldIgnore = ignorePatterns.some(pattern => {
                if (pattern.includes('*')) {
                    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
                    return regex.test(relativePath);
                }
                return relativePath.includes(pattern);
            });
            
            if (shouldIgnore) continue;
            
            if (entry.isDirectory()) {
                const subFiles = await this.walkDirectory(fullPath, ignorePatterns);
                files.push(...subFiles);
            } else if (this.isTargetFile(entry.name)) {
                files.push(relativePath);
            }
        }
        
        return files;
    }
    
    /**
     * Check if file should be indexed
     */
    isTargetFile(fileName) {
        const extensions = ['.js', '.ts', '.jsx', '.tsx', '.md', '.json', '.html', '.css', '.yml', '.yaml'];
        return extensions.some(ext => fileName.endsWith(ext));
    }

    /**
     * Scan existing files and build registry
     */
    async scanExistingFiles() {
        console.log('🔍 Scanning existing files...');
        
        const ignorePatterns = [
            'node_modules',
            '.git',
            'tier-1',          // Ephemeral files
            'generated-',      // Generated files
            '.tmp-',          // Temporary files
            '.log'
        ];
        
        const files = await this.walkDirectory(this.rootDir, ignorePatterns);
        
        let totalFiles = 0;
        for (const filePath of files) {
            await this.indexFile(filePath);
            totalFiles++;
        }
        
        // Find duplicates
        await this.findDuplicates();
        
        console.log(`✅ Indexed ${totalFiles} files`);
        console.log(`⚠️  Found ${this.registry.duplicates.size} duplicate groups`);
    }
    
    /**
     * Index a single file
     */
    async indexFile(filePath) {
        const fullPath = path.join(this.rootDir, filePath);
        
        try {
            const stats = await fs.stat(fullPath);
            const content = await fs.readFile(fullPath, 'utf8');
            const hash = this.hashContent(content);
            
            const fileInfo = {
                path: filePath,
                name: path.basename(filePath),
                extension: path.extname(filePath),
                directory: path.dirname(filePath),
                hash,
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime,
                namingConventionValid: this.validateNaming(filePath),
                isDeprecated: filePath.includes('.deprecated.'),
                lineage: []
            };
            
            this.registry.files.set(filePath, fileInfo);
            
        } catch (error) {
            console.warn(`⚠️  Could not index ${filePath}:`, error.message);
        }
    }
    
    /**
     * Check if file creation is valid
     */
    async checkFileCreation(proposedPath) {
        const result = {
            valid: true,
            issues: [],
            suggestions: [],
            duplicates: [],
            similar: []
        };
        
        // Normalize path
        const normalizedPath = path.normalize(proposedPath).replace(/\\/g, '/');
        
        // Check if file already exists
        if (this.registry.files.has(normalizedPath)) {
            result.valid = false;
            result.issues.push('File already exists');
            return result;
        }
        
        // Validate naming convention
        if (!this.validateNaming(normalizedPath)) {
            result.valid = false;
            result.issues.push('Does not follow naming conventions');
            result.suggestions.push(this.suggestCorrectNaming(normalizedPath));
        }
        
        // Check for similar files
        const similar = this.findSimilarFiles(normalizedPath);
        if (similar.length > 0) {
            result.similar = similar;
            result.suggestions.push('Consider extending existing files instead of creating new ones');
        }
        
        // Check directory structure
        const dirCheck = this.validateDirectoryPlacement(normalizedPath);
        if (!dirCheck.valid) {
            result.issues.push(`Directory placement issue: ${dirCheck.reason}`);
            result.suggestions.push(`Consider placing in: ${dirCheck.suggestedPath}`);
        }
        
        return result;
    }
    
    /**
     * Register a new file
     */
    async registerFile(filePath) {
        const check = await this.checkFileCreation(filePath);
        
        if (!check.valid) {
            throw new Error(`Cannot register file: ${check.issues.join(', ')}`);
        }
        
        await this.indexFile(filePath);
        await this.saveRegistry();
        
        console.log(`✅ Registered new file: ${filePath}`);
        return check;
    }
    
    /**
     * Mark file as deprecated
     */
    async deprecateFile(filePath, reason, replacementPath = null, removalDate = null) {
        const fileInfo = this.registry.files.get(filePath);
        
        if (!fileInfo) {
            throw new Error(`File not found in registry: ${filePath}`);
        }
        
        const deprecationInfo = {
            originalPath: filePath,
            reason,
            replacementPath,
            removalDate: removalDate || this.calculateRemovalDate(),
            deprecatedAt: new Date().toISOString(),
            notificationSent: false
        };
        
        this.registry.deprecated.set(filePath, deprecationInfo);
        
        // Update file info
        fileInfo.isDeprecated = true;
        
        // Suggest new file name
        const newPath = this.generateDeprecatedFileName(filePath);
        
        console.log(`📋 File marked as deprecated: ${filePath}`);
        console.log(`💡 Suggested rename: ${newPath}`);
        
        await this.saveRegistry();
        
        return {
            newPath,
            removalDate: deprecationInfo.removalDate,
            deprecationInfo
        };
    }
    
    /**
     * Track file lineage
     */
    async trackLineage(originalPath, newPath, operation = 'moved') {
        const lineageEntry = {
            id: crypto.randomUUID(),
            originalPath,
            newPath,
            operation, // 'moved', 'renamed', 'split', 'merged', 'forked'
            timestamp: new Date().toISOString(),
            hash: {
                before: this.registry.files.get(originalPath)?.hash,
                after: null // Will be set when new file is indexed
            }
        };
        
        // Add to file's lineage
        if (!this.registry.lineage.has(originalPath)) {
            this.registry.lineage.set(originalPath, []);
        }
        
        this.registry.lineage.get(originalPath).push(lineageEntry);
        
        console.log(`📊 Tracked lineage: ${originalPath} → ${newPath} (${operation})`);
        
        await this.saveRegistry();
        return lineageEntry;
    }
    
    /**
     * Find duplicate files by content hash
     */
    async findDuplicates() {
        const hashGroups = new Map();
        
        // Group files by hash
        for (const [filePath, fileInfo] of this.registry.files) {
            if (!hashGroups.has(fileInfo.hash)) {
                hashGroups.set(fileInfo.hash, []);
            }
            hashGroups.get(fileInfo.hash).push(filePath);
        }
        
        // Find groups with multiple files
        for (const [hash, files] of hashGroups) {
            if (files.length > 1) {
                this.registry.duplicates.set(hash, {
                    files,
                    size: this.registry.files.get(files[0]).size,
                    detectedAt: new Date().toISOString()
                });
            }
        }
    }
    
    /**
     * Validate file naming convention
     */
    validateNaming(filePath) {
        const fileName = path.basename(filePath);
        const extension = path.extname(filePath);
        
        // Check against patterns
        for (const [pattern, regex] of Object.entries(this.namingPatterns)) {
            if (regex.test(fileName)) {
                return true;
            }
        }
        
        // Special cases
        if (fileName === 'index.js' || fileName === 'README.md') {
            return true;
        }
        
        return false;
    }
    
    /**
     * Suggest correct naming
     */
    suggestCorrectNaming(filePath) {
        const fileName = path.basename(filePath);
        const extension = path.extname(filePath);
        const baseName = path.basename(filePath, extension);
        const dir = path.dirname(filePath);
        
        // Convert to appropriate case
        let suggested;
        
        if (extension.match(/\.(md|json|yml|yaml)$/)) {
            // Upper kebab case
            suggested = baseName.toUpperCase().replace(/[^A-Z0-9]/g, '-');
        } else if (extension.match(/\.(js|ts|css|scss|html)$/)) {
            // Lower kebab case
            suggested = baseName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        } else if (extension.match(/\.(jsx|tsx|vue)$/)) {
            // PascalCase
            suggested = baseName.replace(/[-_]/g, ' ')
                .replace(/(?:^|\s)\S/g, a => a.toUpperCase())
                .replace(/\s/g, '');
        } else {
            suggested = baseName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        }
        
        return path.join(dir, suggested + extension);
    }
    
    /**
     * Find files with similar names or purposes
     */
    findSimilarFiles(targetPath) {
        const targetName = path.basename(targetPath, path.extname(targetPath));
        const targetWords = targetName.toLowerCase().split(/[-_]/);
        const similar = [];
        
        for (const [filePath, fileInfo] of this.registry.files) {
            const fileName = path.basename(filePath, fileInfo.extension);
            const fileWords = fileName.toLowerCase().split(/[-_]/);
            
            // Calculate similarity
            const commonWords = targetWords.filter(word => fileWords.includes(word));
            const similarity = commonWords.length / Math.max(targetWords.length, fileWords.length);
            
            if (similarity > 0.5 && filePath !== targetPath) {
                similar.push({
                    path: filePath,
                    similarity,
                    commonWords
                });
            }
        }
        
        return similar.sort((a, b) => b.similarity - a.similarity).slice(0, 5);
    }
    
    /**
     * Validate directory placement
     */
    validateDirectoryPlacement(filePath) {
        const dir = path.dirname(filePath);
        const fileName = path.basename(filePath);
        
        // Define valid directory patterns
        const patterns = {
            '/docs/': /\.(md)$/,
            '/scripts/': /\.(js|sh|py)$/,
            '/config/': /\.(json|yml|yaml|js)$/,
            '/tests/': /\.(test|spec)\.(js|ts)$/,
            '/assets/': /\.(png|jpg|svg|mp3|mp4|glb|gltf)$/,
            '/tier-1/': /generated|temp|cache/,
            '/tier-2/': /service|component|interface|pipeline/,
            '/tier-3/': /core|specification|research|knowledge/
        };
        
        // Check if file is in appropriate directory
        for (const [dirPattern, filePattern] of Object.entries(patterns)) {
            if (dir.includes(dirPattern.slice(1, -1))) {
                if (filePattern.test && filePattern.test(fileName)) {
                    return { valid: true };
                }
                if (!filePattern.test && filePattern.test(dir)) {
                    return { valid: true };
                }
            }
        }
        
        // Suggest better location
        const extension = path.extname(fileName);
        const suggestedDirs = {
            '.md': 'docs/',
            '.js': 'tier-2/services/',
            '.json': 'config/',
            '.test.js': 'tests/',
            '.png': 'assets/images/'
        };
        
        const suggested = suggestedDirs[extension] || 'tier-2/';
        
        return {
            valid: false,
            reason: 'File type doesn\'t match directory purpose',
            suggestedPath: path.join(suggested, fileName)
        };
    }
    
    /**
     * Generate deprecated file name
     */
    generateDeprecatedFileName(filePath) {
        const ext = path.extname(filePath);
        const baseName = path.basename(filePath, ext);
        const dir = path.dirname(filePath);
        
        return path.join(dir, `${baseName}.deprecated${ext}`);
    }
    
    /**
     * Calculate removal date (30 days from deprecation)
     */
    calculateRemovalDate() {
        const date = new Date();
        date.setDate(date.getDate() + 30);
        return date.toISOString().split('T')[0];
    }
    
    /**
     * Hash content for duplicate detection
     */
    hashContent(content) {
        return crypto.createHash('md5').update(content).digest('hex');
    }
    
    /**
     * Save registry to file
     */
    async saveRegistry() {
        // Convert Maps to arrays for JSON serialization
        const serializable = {
            ...this.registry,
            files: Array.from(this.registry.files.entries()),
            duplicates: Array.from(this.registry.duplicates.entries()),
            deprecated: Array.from(this.registry.deprecated.entries()),
            lineage: Array.from(this.registry.lineage.entries()),
            lastUpdated: new Date().toISOString()
        };
        
        await fs.writeFile(
            this.registryFile, 
            JSON.stringify(serializable, null, 2),
            'utf8'
        );
    }
    
    /**
     * Generate registry report
     */
    generateReport() {
        const stats = {
            totalFiles: this.registry.files.size,
            duplicateGroups: this.registry.duplicates.size,
            duplicateFiles: Array.from(this.registry.duplicates.values())
                .reduce((sum, group) => sum + group.files.length, 0),
            deprecatedFiles: this.registry.deprecated.size,
            lineageEntries: Array.from(this.registry.lineage.values())
                .reduce((sum, entries) => sum + entries.length, 0),
            namingViolations: Array.from(this.registry.files.values())
                .filter(f => !f.namingConventionValid).length
        };
        
        return {
            stats,
            lastUpdated: this.registry.lastUpdated,
            version: this.registry.version,
            duplicates: Array.from(this.registry.duplicates.entries()),
            deprecated: Array.from(this.registry.deprecated.entries()),
            namingViolations: Array.from(this.registry.files.entries())
                .filter(([_, info]) => !info.namingConventionValid)
                .map(([path]) => path)
        };
    }
    
    /**
     * CLI interface
     */
    static async cli() {
        const args = process.argv.slice(2);
        const command = args[0];
        const registry = new FileRegistrySystem();
        
        await registry.initialize();
        
        switch (command) {
            case 'scan':
                await registry.scanExistingFiles();
                await registry.saveRegistry();
                console.log('✅ Registry updated');
                break;
                
            case 'check':
                const filePath = args[1];
                if (!filePath) {
                    console.error('Usage: node file-registry-system.js check <file-path>');
                    process.exit(1);
                }
                const result = await registry.checkFileCreation(filePath);
                console.log(JSON.stringify(result, null, 2));
                break;
                
            case 'report':
                const report = registry.generateReport();
                console.log(JSON.stringify(report, null, 2));
                break;
                
            case 'deprecate':
                const depPath = args[1];
                const reason = args[2] || 'No longer needed';
                if (!depPath) {
                    console.error('Usage: node file-registry-system.js deprecate <file-path> [reason]');
                    process.exit(1);
                }
                await registry.deprecateFile(depPath, reason);
                break;
                
            default:
                console.log(`
File Registry System Commands:

  scan                          Scan all files and update registry
  check <file-path>            Check if new file creation is valid
  report                       Generate registry report
  deprecate <file-path> [reason] Mark file as deprecated
  
Examples:
  node file-registry-system.js scan
  node file-registry-system.js check "new-ship-component.js"
  node file-registry-system.js report
  node file-registry-system.js deprecate "old-system.js" "Replaced by new-system.js"
                `);
        }
    }
}

// Export for use as module
module.exports = FileRegistrySystem;

// Run CLI if called directly
if (require.main === module) {
    FileRegistrySystem.cli().catch(console.error);
}