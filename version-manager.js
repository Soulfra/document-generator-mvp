#!/usr/bin/env node

/**
 * 📦 VERSION MANAGER
 * 
 * Handles versioning, compaction, and release management for the Document Generator system
 * Integrates with existing infrastructure and prevents conflicts
 */

const fs = require('fs').promises;
const path = require('path');
const { exec, spawn } = require('child_process');
const crypto = require('crypto');
const UnifiedColorTaggedLogger = require('./unified-color-tagged-logger');

class VersionManager {
    constructor() {
        this.logger = new UnifiedColorTaggedLogger('VERSION');
        this.currentVersion = null;
        this.workingDir = process.cwd();
        this.versionFile = path.join(this.workingDir, 'VERSION.json');
        this.backupDir = path.join(this.workingDir, 'backups');
        
        // Component tracking
        this.components = {
            core: [
                'cli.js',
                'package.json',
                'docker-compose.yml',
                'docgen'
            ],
            monitoring: [
                'unified-color-tagged-logger.js',
                'debug-flow-orchestrator.js',
                'REAL-PROACTIVE-MONITOR.js',
                'suggestion-engine.js',
                'real-time-test-monitor.js',
                'unified-debug-integration-bridge.js'
            ],
            services: [
                'business-accounting-system.js',
                'tax-intelligence-engine.js',
                'wallet-address-manager.js'
            ],
            frontend: [
                'FinishThisIdea-Complete/',
                'web-interface/',
                'public/'
            ],
            infrastructure: [
                'Dockerfile',
                'docker-compose.yml',
                '.env.example'
            ]
        };
        
        // Note: initialize() must be called manually
    }
    
    async initialize() {
        this.logger.info('INIT', 'Initializing Version Manager...');
        
        try {
            // Load current version
            await this.loadCurrentVersion();
            
            // Ensure backup directory exists
            await this.ensureBackupDirectory();
            
            this.logger.success('INIT', `Version Manager ready - Current: v${this.currentVersion.version}`);
            
        } catch (error) {
            this.logger.error('INIT', `Failed to initialize: ${error.message}`);
            await this.createInitialVersion();
        }
    }
    
    async loadCurrentVersion() {
        try {
            const versionData = await fs.readFile(this.versionFile, 'utf8');
            this.currentVersion = JSON.parse(versionData);
            
            this.logger.info('LOAD', `Loaded version: v${this.currentVersion.version}`);
            
        } catch (error) {
            throw new Error('No version file found');
        }
    }
    
    async createInitialVersion() {
        this.logger.info('CREATE', 'Creating initial version...');
        
        const packageJson = await this.readPackageJson();
        
        this.currentVersion = {
            version: packageJson.version || '2.0.0',
            buildNumber: 1,
            timestamp: Date.now(),
            gitCommit: await this.getGitCommit(),
            components: await this.analyzeComponents(),
            checksums: await this.generateChecksums(),
            status: 'development',
            notes: 'Initial version with unified debug integration'
        };
        
        await this.saveVersion();
        this.logger.success('CREATE', `Initial version created: v${this.currentVersion.version}`);
    }
    
    async bump(type = 'patch', notes = '') {
        const timer = this.logger.startTimer('BUMP', `Bumping ${type} version`);
        
        try {
            // Create backup before version bump
            await this.createBackup(`pre-${type}-bump`);
            
            // Calculate new version
            const newVersion = this.calculateNewVersion(type);
            
            this.logger.info('BUMP', `${this.currentVersion.version} → ${newVersion}`);
            
            // Update version data
            this.currentVersion = {
                ...this.currentVersion,
                version: newVersion,
                buildNumber: this.currentVersion.buildNumber + 1,
                timestamp: Date.now(),
                gitCommit: await this.getGitCommit(),
                components: await this.analyzeComponents(),
                checksums: await this.generateChecksums(),
                previousVersion: this.currentVersion.version,
                bumpType: type,
                notes: notes || `${type} version bump`
            };
            
            // Update package.json
            await this.updatePackageVersion(newVersion);
            
            // Save version file
            await this.saveVersion();
            
            // Update docgen command version
            await this.updateDocgenVersion(newVersion);
            
            timer.end(true);
            this.logger.success('BUMP', `Version bumped to v${newVersion} (build #${this.currentVersion.buildNumber})`);
            
            return newVersion;
            
        } catch (error) {
            timer.end(false);
            this.logger.error('BUMP', `Version bump failed: ${error.message}`);
            throw error;
        }
    }
    
    calculateNewVersion(type) {
        const [major, minor, patch] = this.currentVersion.version.split('.').map(Number);
        
        switch (type) {
            case 'major':
                return `${major + 1}.0.0`;
            case 'minor':
                return `${major}.${minor + 1}.0`;
            case 'patch':
            default:
                return `${major}.${minor}.${patch + 1}`;
        }
    }
    
    async compact(target = 'production') {
        const timer = this.logger.startTimer('COMPACT', `Compacting for ${target}`);
        
        try {
            this.logger.info('COMPACT', `Starting compaction for ${target} deployment...`);
            
            // Create pre-compact backup
            await this.createBackup(`pre-compact-${target}`);
            
            // Generate build manifest
            const manifest = await this.generateBuildManifest(target);
            
            // Perform compaction based on target
            switch (target) {
                case 'production':
                    await this.compactProduction(manifest);
                    break;
                case 'docker':
                    await this.compactDocker(manifest);
                    break;
                case 'electron':
                    await this.compactElectron(manifest);
                    break;
                case 'web':
                    await this.compactWeb(manifest);
                    break;
                default:
                    throw new Error(`Unknown compaction target: ${target}`);
            }
            
            // Update version status
            this.currentVersion.status = target;
            this.currentVersion.lastCompact = Date.now();
            await this.saveVersion();
            
            timer.end(true);
            this.logger.success('COMPACT', `Compaction complete for ${target}`);
            
            return manifest;
            
        } catch (error) {
            timer.end(false);
            this.logger.error('COMPACT', `Compaction failed: ${error.message}`);
            throw error;
        }
    }
    
    async generateBuildManifest(target) {
        this.logger.info('MANIFEST', 'Generating build manifest...');
        
        const manifest = {
            version: this.currentVersion.version,
            buildNumber: this.currentVersion.buildNumber,
            target,
            timestamp: Date.now(),
            components: {},
            dependencies: {},
            environment: {
                node: process.version,
                platform: process.platform,
                arch: process.arch
            }
        };
        
        // Analyze each component category
        for (const [category, files] of Object.entries(this.components)) {
            manifest.components[category] = [];
            
            for (const file of files) {
                const filePath = path.join(this.workingDir, file);
                
                try {
                    const stats = await fs.stat(filePath);
                    const checksum = await this.generateFileChecksum(filePath);
                    
                    manifest.components[category].push({
                        path: file,
                        size: stats.size,
                        modified: stats.mtime.toISOString(),
                        checksum,
                        included: this.shouldIncludeInBuild(file, target)
                    });
                    
                } catch (error) {
                    // File doesn't exist, mark as missing
                    manifest.components[category].push({
                        path: file,
                        status: 'missing'
                    });
                }
            }
        }
        
        // Get dependency information
        try {
            const packageJson = await this.readPackageJson();
            manifest.dependencies = {
                production: packageJson.dependencies || {},
                development: packageJson.devDependencies || {},
                scripts: packageJson.scripts || {}
            };
        } catch (error) {
            this.logger.warning('MANIFEST', 'Could not read package.json dependencies');
        }
        
        return manifest;
    }
    
    shouldIncludeInBuild(file, target) {
        // Logic to determine which files to include in different build targets
        const exclusions = {
            production: [/test/, /\.test\./, /\.spec\./, /debug/, /temp/],
            docker: [/\.git/, /node_modules/, /temp/],
            electron: [/docker/, /\.docker/, /docker-compose/],
            web: [/electron/, /desktop/, /\.app/]
        };
        
        const targetExclusions = exclusions[target] || [];
        
        return !targetExclusions.some(pattern => pattern.test(file));
    }
    
    async compactProduction(manifest) {
        this.logger.info('PROD', 'Compacting for production deployment...');
        
        // Create production directory
        const prodDir = path.join(this.workingDir, 'dist', 'production');
        await fs.mkdir(prodDir, { recursive: true });
        
        // Copy essential files
        const essentialFiles = [
            'package.json',
            'docker-compose.yml',
            'cli.js',
            'docgen',
            'unified-debug-integration-bridge.js'
        ];
        
        for (const file of essentialFiles) {
            await this.copyFile(file, path.join(prodDir, file));
        }
        
        // Create production package.json with only production dependencies
        const packageJson = await this.readPackageJson();
        const prodPackage = {
            ...packageJson,
            devDependencies: undefined,
            scripts: {
                start: 'node cli.js',
                'docker:up': 'docker-compose up -d',
                health: 'node cli.js status'
            }
        };
        
        await fs.writeFile(
            path.join(prodDir, 'package.json'),
            JSON.stringify(prodPackage, null, 2)
        );
        
        // Create production manifest
        await fs.writeFile(
            path.join(prodDir, 'BUILD_MANIFEST.json'),
            JSON.stringify(manifest, null, 2)
        );
        
        this.logger.success('PROD', `Production build created in dist/production/`);
    }
    
    async compactDocker(manifest) {
        this.logger.info('DOCKER', 'Creating optimized Docker build...');
        
        // Build the Docker image with version tag
        await this.execCommand(`docker build -t document-generator:${this.currentVersion.version} .`);
        await this.execCommand(`docker tag document-generator:${this.currentVersion.version} document-generator:latest`);
        
        this.logger.success('DOCKER', `Docker image built: document-generator:${this.currentVersion.version}`);
    }
    
    async compactElectron(manifest) {
        this.logger.info('ELECTRON', 'Building Electron application...');
        
        // Update electron package version
        await this.execCommand(`npm run electron-build`);
        
        this.logger.success('ELECTRON', 'Electron build complete');
    }
    
    async compactWeb(manifest) {
        this.logger.info('WEB', 'Building web deployment...');
        
        // Build frontend if it exists
        if (await this.fileExists('FinishThisIdea-Complete/package.json')) {
            await this.execCommand('cd FinishThisIdea-Complete && npm run build');
        }
        
        this.logger.success('WEB', 'Web build complete');
    }
    
    async createBackup(label = '') {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupName = `backup-${timestamp}${label ? '-' + label : ''}`;
        const backupPath = path.join(this.backupDir, backupName);
        
        this.logger.info('BACKUP', `Creating backup: ${backupName}`);
        
        await fs.mkdir(backupPath, { recursive: true });
        
        // Backup essential files
        const backupFiles = [
            'package.json',
            'VERSION.json',
            'cli.js',
            'docgen',
            'docker-compose.yml'
        ];
        
        for (const file of backupFiles) {
            try {
                await this.copyFile(file, path.join(backupPath, file));
            } catch (error) {
                this.logger.debug('BACKUP', `Could not backup ${file}: ${error.message}`);
            }
        }
        
        // Create backup manifest
        const backupManifest = {
            timestamp: Date.now(),
            version: this.currentVersion.version,
            label,
            files: backupFiles,
            checksums: await this.generateChecksums()
        };
        
        await fs.writeFile(
            path.join(backupPath, 'BACKUP_MANIFEST.json'),
            JSON.stringify(backupManifest, null, 2)
        );
        
        this.logger.success('BACKUP', `Backup created: ${backupName}`);
        return backupPath;
    }
    
    async restore(backupName) {
        const timer = this.logger.startTimer('RESTORE', `Restoring from backup: ${backupName}`);
        
        try {
            const backupPath = path.join(this.backupDir, backupName);
            const manifestPath = path.join(backupPath, 'BACKUP_MANIFEST.json');
            
            // Read backup manifest
            const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
            
            this.logger.info('RESTORE', `Restoring to version ${manifest.version}`);
            
            // Restore files
            for (const file of manifest.files) {
                const backupFile = path.join(backupPath, file);
                if (await this.fileExists(backupFile)) {
                    await this.copyFile(backupFile, file);
                    this.logger.debug('RESTORE', `Restored ${file}`);
                }
            }
            
            // Reload version
            await this.loadCurrentVersion();
            
            timer.end(true);
            this.logger.success('RESTORE', `Restored to version ${this.currentVersion.version}`);
            
        } catch (error) {
            timer.end(false);
            this.logger.error('RESTORE', `Restore failed: ${error.message}`);
            throw error;
        }
    }
    
    async analyzeComponents() {
        const analysis = {};
        
        for (const [category, files] of Object.entries(this.components)) {
            analysis[category] = {
                total: files.length,
                existing: 0,
                missing: 0,
                files: []
            };
            
            for (const file of files) {
                const exists = await this.fileExists(file);
                if (exists) {
                    analysis[category].existing++;
                } else {
                    analysis[category].missing++;
                }
                
                analysis[category].files.push({
                    path: file,
                    exists
                });
            }
        }
        
        return analysis;
    }
    
    async generateChecksums() {
        const checksums = {};
        
        for (const [category, files] of Object.entries(this.components)) {
            checksums[category] = {};
            
            for (const file of files) {
                if (await this.fileExists(file)) {
                    checksums[category][file] = await this.generateFileChecksum(file);
                }
            }
        }
        
        return checksums;
    }
    
    async generateFileChecksum(filePath) {
        try {
            const content = await fs.readFile(filePath);
            return crypto.createHash('sha256').update(content).digest('hex');
        } catch (error) {
            return null;
        }
    }
    
    async saveVersion() {
        await fs.writeFile(
            this.versionFile,
            JSON.stringify(this.currentVersion, null, 2)
        );
        
        this.logger.debug('SAVE', `Version saved: v${this.currentVersion.version}`);
    }
    
    async updatePackageVersion(version) {
        const packageJson = await this.readPackageJson();
        packageJson.version = version;
        
        await fs.writeFile(
            path.join(this.workingDir, 'package.json'),
            JSON.stringify(packageJson, null, 2)
        );
        
        this.logger.debug('UPDATE', `Package.json updated to v${version}`);
    }
    
    async updateDocgenVersion(version) {
        try {
            let docgenContent = await fs.readFile('docgen', 'utf8');
            docgenContent = docgenContent.replace(
                /this\.version = ['"][^'"]+['"]/,
                `this.version = '${version}'`
            );
            
            await fs.writeFile('docgen', docgenContent);
            this.logger.debug('UPDATE', `Docgen command updated to v${version}`);
            
        } catch (error) {
            this.logger.warning('UPDATE', `Could not update docgen version: ${error.message}`);
        }
    }
    
    async readPackageJson() {
        try {
            const content = await fs.readFile('package.json', 'utf8');
            return JSON.parse(content);
        } catch (error) {
            throw new Error('Could not read package.json');
        }
    }
    
    async getGitCommit() {
        try {
            const result = await this.execCommand('git rev-parse HEAD');
            return result.trim();
        } catch (error) {
            return 'unknown';
        }
    }
    
    async ensureBackupDirectory() {
        await fs.mkdir(this.backupDir, { recursive: true });
    }
    
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }
    
    async copyFile(source, destination) {
        const destDir = path.dirname(destination);
        await fs.mkdir(destDir, { recursive: true });
        await fs.copyFile(source, destination);
    }
    
    execCommand(command) {
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(stdout);
                }
            });
        });
    }
    
    // CLI interface
    async handleCommand(args) {
        const command = args[0];
        const options = args.slice(1);
        
        switch (command) {
            case 'init':
                await this.createInitialVersion();
                break;
                
            case 'bump':
                const type = options[0] || 'patch';
                const notes = options.slice(1).join(' ');
                await this.bump(type, notes);
                break;
                
            case 'compact':
                const target = options[0] || 'production';
                await this.compact(target);
                break;
                
            case 'backup':
                const label = options[0] || '';
                await this.createBackup(label);
                break;
                
            case 'restore':
                const backupName = options[0];
                if (!backupName) {
                    throw new Error('Backup name required');
                }
                await this.restore(backupName);
                break;
                
            case 'status':
                this.showStatus();
                break;
                
            case 'list-backups':
                await this.listBackups();
                break;
                
            default:
                this.showHelp();
        }
    }
    
    showStatus() {
        console.log('\n📦 VERSION STATUS');
        console.log('=================');
        console.log(`Version: v${this.currentVersion.version}`);
        console.log(`Build: #${this.currentVersion.buildNumber}`);
        console.log(`Status: ${this.currentVersion.status}`);
        console.log(`Last Updated: ${new Date(this.currentVersion.timestamp).toLocaleString()}`);
        
        if (this.currentVersion.gitCommit) {
            console.log(`Git Commit: ${this.currentVersion.gitCommit.substring(0, 8)}`);
        }
        
        console.log('\n📊 Components:');
        for (const [category, analysis] of Object.entries(this.currentVersion.components)) {
            console.log(`  ${category}: ${analysis.existing}/${analysis.total} files`);
        }
        
        console.log();
    }
    
    async listBackups() {
        try {
            const backups = await fs.readdir(this.backupDir);
            
            console.log('\n💾 AVAILABLE BACKUPS');
            console.log('====================');
            
            for (const backup of backups.reverse()) {
                try {
                    const manifestPath = path.join(this.backupDir, backup, 'BACKUP_MANIFEST.json');
                    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
                    
                    console.log(`📦 ${backup}`);
                    console.log(`   Version: v${manifest.version}`);
                    console.log(`   Date: ${new Date(manifest.timestamp).toLocaleString()}`);
                    if (manifest.label) {
                        console.log(`   Label: ${manifest.label}`);
                    }
                    console.log();
                    
                } catch (error) {
                    console.log(`📦 ${backup} (corrupted)`);
                }
            }
            
        } catch (error) {
            console.log('No backups found');
        }
    }
    
    showHelp() {
        console.log('\n📦 VERSION MANAGER COMMANDS');
        console.log('============================');
        console.log('  init                    Initialize version tracking');
        console.log('  bump [type] [notes]     Bump version (patch|minor|major)');
        console.log('  compact [target]        Compact for deployment (production|docker|electron|web)');
        console.log('  backup [label]          Create backup with optional label');
        console.log('  restore <backup-name>   Restore from backup');
        console.log('  status                  Show current version status');
        console.log('  list-backups           Show available backups');
        console.log();
        console.log('Examples:');
        console.log('  node version-manager.js bump minor "Added new features"');
        console.log('  node version-manager.js compact docker');
        console.log('  node version-manager.js backup pre-deployment');
        console.log();
    }
}

// Export for use in other modules
module.exports = VersionManager;

// CLI usage
if (require.main === module) {
    const manager = new VersionManager();
    const args = process.argv.slice(2);
    
    // Wait for initialization before processing commands
    manager.initialize().then(() => {
        if (args.length === 0) {
            manager.showHelp();
        } else {
            manager.handleCommand(args).catch(error => {
                console.error('\n❌ Version Manager Error:', error.message);
                process.exit(1);
            });
        }
    }).catch(error => {
        console.error('\n❌ Version Manager Initialization Error:', error.message);
        process.exit(1);
    });
}