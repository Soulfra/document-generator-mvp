#!/usr/bin/env node

/**
 * Smart Tagging System
 * 
 * AI-powered semantic versioning and tagging system that analyzes code changes
 * to determine appropriate version bumps and create meaningful release tags.
 */

const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');
const semver = require('semver');

// Version bump types
const BUMP_TYPES = {
    MAJOR: 'major',      // Breaking changes
    MINOR: 'minor',      // New features
    PATCH: 'patch',      // Bug fixes
    PRERELEASE: 'prerelease',  // Pre-release versions
    PREMAJOR: 'premajor',
    PREMINOR: 'preminor',
    PREPATCH: 'prepatch'
};

// Change categories
const CHANGE_CATEGORIES = {
    BREAKING: 'breaking',
    FEATURE: 'feature',
    FIX: 'fix',
    DOCS: 'docs',
    STYLE: 'style',
    REFACTOR: 'refactor',
    PERF: 'performance',
    TEST: 'test',
    BUILD: 'build',
    CI: 'ci',
    CHORE: 'chore',
    REVERT: 'revert'
};

// Tag types
const TAG_TYPES = {
    RELEASE: 'release',
    PRERELEASE: 'prerelease',
    NIGHTLY: 'nightly',
    EXPERIMENTAL: 'experimental',
    HOTFIX: 'hotfix',
    SECURITY: 'security'
};

class SmartTaggingSystem extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            workingDir: config.workingDir || process.cwd(),
            aiProvider: config.aiProvider || 'ollama',
            model: config.model || 'codellama:7b',
            conventionalCommits: config.conventionalCommits !== false,
            prereleaseId: config.prereleaseId || 'alpha',
            tagPrefix: config.tagPrefix || 'v',
            generateChangelog: config.generateChangelog !== false,
            generateReleaseNotes: config.generateReleaseNotes !== false,
            autoTag: config.autoTag !== false,
            dryRun: config.dryRun || false,
            ...config
        };
        
        this.currentVersion = null;
        this.lastTag = null;
        this.commits = [];
        this.changes = {
            breaking: [],
            features: [],
            fixes: [],
            other: []
        };
    }
    
    /**
     * Analyze repository and suggest next version
     */
    async analyzeRepository() {
        console.log('🔍 Analyzing repository for version changes...');
        
        try {
            // Get current version from package.json
            this.currentVersion = await this.getCurrentVersion();
            console.log(`📦 Current version: ${this.currentVersion}`);
            
            // Get last tag
            this.lastTag = await this.getLastTag();
            console.log(`🏷️  Last tag: ${this.lastTag || 'none'}`);
            
            // Get commits since last tag
            this.commits = await this.getCommitsSinceLastTag();
            console.log(`📝 Found ${this.commits.length} commits since last tag`);
            
            // Analyze commits
            await this.analyzeCommits();
            
            // Determine version bump
            const bumpType = await this.determineBumpType();
            const newVersion = this.calculateNewVersion(bumpType);
            
            return {
                currentVersion: this.currentVersion,
                newVersion,
                bumpType,
                changes: this.changes,
                commits: this.commits.length
            };
            
        } catch (error) {
            console.error('❌ Repository analysis failed:', error.message);
            throw error;
        }
    }
    
    /**
     * Create a new tag with AI-generated release notes
     */
    async createTag(options = {}) {
        const analysis = await this.analyzeRepository();
        
        const tagName = options.tagName || `${this.config.tagPrefix}${analysis.newVersion}`;
        const tagType = options.tagType || this.determineTagType(analysis);
        
        console.log(`🏷️  Creating tag: ${tagName} (${tagType})`);
        
        // Generate release notes
        const releaseNotes = await this.generateReleaseNotes(analysis);
        
        // Generate changelog
        const changelog = await this.generateChangelog(analysis);
        
        if (this.config.dryRun) {
            console.log('\n[DRY RUN] Would create tag:', tagName);
            console.log('\nRelease Notes:');
            console.log(releaseNotes);
            console.log('\nChangelog:');
            console.log(changelog);
            return { tagName, releaseNotes, changelog, dryRun: true };
        }
        
        // Update version in package.json
        if (await this.fileExists('package.json')) {
            await this.updatePackageVersion(analysis.newVersion);
        }
        
        // Update CHANGELOG.md
        if (this.config.generateChangelog) {
            await this.updateChangelog(changelog);
        }
        
        // Commit version changes
        await this.commitVersionChanges(analysis.newVersion);
        
        // Create annotated tag
        await this.createAnnotatedTag(tagName, releaseNotes);
        
        console.log(`✅ Created tag: ${tagName}`);
        
        this.emit('tagCreated', {
            tagName,
            version: analysis.newVersion,
            type: tagType,
            releaseNotes,
            changelog
        });
        
        return {
            tagName,
            version: analysis.newVersion,
            type: tagType,
            releaseNotes,
            changelog
        };
    }
    
    /**
     * Get current version from package.json
     */
    async getCurrentVersion() {
        const packagePath = path.join(this.config.workingDir, 'package.json');
        
        try {
            const packageJson = JSON.parse(await fs.readFile(packagePath, 'utf8'));
            return packageJson.version || '0.0.0';
        } catch (error) {
            // No package.json, check for other version files
            return await this.findVersionInFiles() || '0.0.0';
        }
    }
    
    /**
     * Get last git tag
     */
    async getLastTag() {
        try {
            const tags = execSync('git tag --sort=-version:refname', {
                cwd: this.config.workingDir,
                encoding: 'utf8'
            }).trim().split('\n').filter(Boolean);
            
            return tags[0] || null;
        } catch (error) {
            return null;
        }
    }
    
    /**
     * Get commits since last tag
     */
    async getCommitsSinceLastTag() {
        try {
            const range = this.lastTag ? `${this.lastTag}..HEAD` : 'HEAD';
            
            const log = execSync(
                `git log ${range} --pretty=format:"%H|%an|%ae|%ai|%s|%b|COMMIT_END"`,
                {
                    cwd: this.config.workingDir,
                    encoding: 'utf8',
                    maxBuffer: 1024 * 1024 * 10 // 10MB
                }
            ).trim();
            
            if (!log) return [];
            
            return log.split('|COMMIT_END').filter(Boolean).map(entry => {
                const [hash, author, email, date, subject, body] = entry.split('|');
                return {
                    hash: hash.trim(),
                    author: author.trim(),
                    email: email.trim(),
                    date: date.trim(),
                    subject: subject.trim(),
                    body: (body || '').trim(),
                    message: subject.trim() + (body ? '\n\n' + body.trim() : '')
                };
            });
            
        } catch (error) {
            console.error('Failed to get commits:', error.message);
            return [];
        }
    }
    
    /**
     * Analyze commits to categorize changes
     */
    async analyzeCommits() {
        this.changes = {
            breaking: [],
            features: [],
            fixes: [],
            other: []
        };
        
        for (const commit of this.commits) {
            const analysis = await this.analyzeCommit(commit);
            
            if (analysis.isBreaking) {
                this.changes.breaking.push({
                    commit,
                    description: analysis.breakingDescription || commit.subject,
                    category: analysis.category
                });
            }
            
            switch (analysis.category) {
                case CHANGE_CATEGORIES.FEATURE:
                    this.changes.features.push({
                        commit,
                        description: analysis.description || commit.subject
                    });
                    break;
                
                case CHANGE_CATEGORIES.FIX:
                    this.changes.fixes.push({
                        commit,
                        description: analysis.description || commit.subject
                    });
                    break;
                
                default:
                    this.changes.other.push({
                        commit,
                        category: analysis.category,
                        description: analysis.description || commit.subject
                    });
            }
        }
    }
    
    /**
     * Analyze individual commit
     */
    async analyzeCommit(commit) {
        // Check conventional commit format first
        if (this.config.conventionalCommits) {
            const conventional = this.parseConventionalCommit(commit.message);
            if (conventional) {
                return {
                    category: this.mapConventionalType(conventional.type),
                    isBreaking: conventional.breaking,
                    breakingDescription: conventional.breakingDescription,
                    description: conventional.description
                };
            }
        }
        
        // Use AI to analyze commit
        const prompt = `Analyze this git commit and determine:
1. Category (feature, fix, breaking, docs, refactor, test, etc.)
2. Is it a breaking change?
3. Brief description of the change

Commit message:
${commit.message}

Return JSON: {"category": "...", "isBreaking": boolean, "description": "..."}`;
        
        try {
            const response = await this.callAI(prompt);
            return JSON.parse(response);
        } catch (error) {
            // Fallback to pattern matching
            return this.analyzeCommitPatterns(commit);
        }
    }
    
    /**
     * Parse conventional commit format
     */
    parseConventionalCommit(message) {
        const regex = /^(\w+)(\([\w\s,]+\))?(!)?:\s*(.+)$/;
        const match = message.match(regex);
        
        if (!match) return null;
        
        const [_, type, scope, breaking, description] = match;
        
        // Check for breaking change in body
        const hasBreakingBody = message.includes('BREAKING CHANGE:');
        const breakingDescription = hasBreakingBody ? 
            message.split('BREAKING CHANGE:')[1].trim().split('\n')[0] : null;
        
        return {
            type,
            scope: scope ? scope.slice(1, -1) : null,
            breaking: !!breaking || hasBreakingBody,
            breakingDescription,
            description
        };
    }
    
    /**
     * Map conventional commit type to category
     */
    mapConventionalType(type) {
        const typeMap = {
            'feat': CHANGE_CATEGORIES.FEATURE,
            'fix': CHANGE_CATEGORIES.FIX,
            'docs': CHANGE_CATEGORIES.DOCS,
            'style': CHANGE_CATEGORIES.STYLE,
            'refactor': CHANGE_CATEGORIES.REFACTOR,
            'perf': CHANGE_CATEGORIES.PERF,
            'test': CHANGE_CATEGORIES.TEST,
            'build': CHANGE_CATEGORIES.BUILD,
            'ci': CHANGE_CATEGORIES.CI,
            'chore': CHANGE_CATEGORIES.CHORE,
            'revert': CHANGE_CATEGORIES.REVERT
        };
        
        return typeMap[type] || CHANGE_CATEGORIES.CHORE;
    }
    
    /**
     * Analyze commit using patterns
     */
    analyzeCommitPatterns(commit) {
        const message = commit.message.toLowerCase();
        
        // Breaking change patterns
        if (message.match(/breaking|incompatible|major/)) {
            return {
                category: CHANGE_CATEGORIES.BREAKING,
                isBreaking: true,
                description: commit.subject
            };
        }
        
        // Feature patterns
        if (message.match(/add|implement|feature|new/)) {
            return {
                category: CHANGE_CATEGORIES.FEATURE,
                isBreaking: false,
                description: commit.subject
            };
        }
        
        // Fix patterns
        if (message.match(/fix|bug|issue|patch/)) {
            return {
                category: CHANGE_CATEGORIES.FIX,
                isBreaking: false,
                description: commit.subject
            };
        }
        
        // Default
        return {
            category: CHANGE_CATEGORIES.CHORE,
            isBreaking: false,
            description: commit.subject
        };
    }
    
    /**
     * Determine version bump type
     */
    async determineBumpType() {
        // Breaking changes = major bump
        if (this.changes.breaking.length > 0) {
            return BUMP_TYPES.MAJOR;
        }
        
        // New features = minor bump
        if (this.changes.features.length > 0) {
            return BUMP_TYPES.MINOR;
        }
        
        // Bug fixes = patch bump
        if (this.changes.fixes.length > 0) {
            return BUMP_TYPES.PATCH;
        }
        
        // Use AI for edge cases
        if (this.commits.length > 0) {
            const prompt = `Based on these changes, what semantic version bump is appropriate?
Changes: ${this.commits.map(c => c.subject).join(', ')}
Options: major (breaking), minor (features), patch (fixes)
Return only the bump type.`;
            
            try {
                const suggestion = await this.callAI(prompt);
                if (Object.values(BUMP_TYPES).includes(suggestion.trim())) {
                    return suggestion.trim();
                }
            } catch (error) {
                // Fallback to patch
            }
        }
        
        // Default to patch
        return BUMP_TYPES.PATCH;
    }
    
    /**
     * Calculate new version
     */
    calculateNewVersion(bumpType) {
        return semver.inc(this.currentVersion, bumpType, this.config.prereleaseId);
    }
    
    /**
     * Determine tag type
     */
    determineTagType(analysis) {
        // Security fixes
        if (this.changes.fixes.some(f => 
            f.description.toLowerCase().includes('security') ||
            f.description.toLowerCase().includes('vulnerability')
        )) {
            return TAG_TYPES.SECURITY;
        }
        
        // Hotfix (patch with urgency)
        if (analysis.bumpType === BUMP_TYPES.PATCH && 
            this.changes.fixes.some(f => 
                f.description.toLowerCase().includes('critical') ||
                f.description.toLowerCase().includes('urgent')
            )) {
            return TAG_TYPES.HOTFIX;
        }
        
        // Prerelease
        if (analysis.newVersion.includes('-')) {
            return TAG_TYPES.PRERELEASE;
        }
        
        // Experimental
        if (this.changes.features.some(f =>
            f.description.toLowerCase().includes('experimental') ||
            f.description.toLowerCase().includes('beta')
        )) {
            return TAG_TYPES.EXPERIMENTAL;
        }
        
        // Regular release
        return TAG_TYPES.RELEASE;
    }
    
    /**
     * Generate release notes
     */
    async generateReleaseNotes(analysis) {
        const prompt = `Generate professional release notes for version ${analysis.newVersion}:

Breaking Changes: ${this.changes.breaking.length}
${this.changes.breaking.map(c => `- ${c.description}`).join('\n')}

New Features: ${this.changes.features.length}
${this.changes.features.map(f => `- ${f.description}`).join('\n')}

Bug Fixes: ${this.changes.fixes.length}
${this.changes.fixes.map(f => `- ${f.description}`).join('\n')}

Other Changes: ${this.changes.other.length}

Create engaging release notes with:
- Summary of the release
- Highlights of major changes
- Migration guide for breaking changes
- Credits to contributors`;
        
        try {
            const notes = await this.callAI(prompt);
            
            // Add metadata
            return `# Release ${analysis.newVersion}

Released on ${new Date().toLocaleDateString()}

${notes}

---
*This release contains ${this.commits.length} commits from ${this.getUniqueContributors()} contributors.*`;
            
        } catch (error) {
            // Fallback to template
            return this.generateTemplateReleaseNotes(analysis);
        }
    }
    
    /**
     * Generate changelog entry
     */
    async generateChangelog(analysis) {
        const date = new Date().toISOString().split('T')[0];
        
        let changelog = `## [${analysis.newVersion}] - ${date}\n\n`;
        
        if (this.changes.breaking.length > 0) {
            changelog += `### ⚠️ Breaking Changes\n`;
            this.changes.breaking.forEach(c => {
                changelog += `- ${c.description}\n`;
            });
            changelog += '\n';
        }
        
        if (this.changes.features.length > 0) {
            changelog += `### ✨ Features\n`;
            this.changes.features.forEach(f => {
                changelog += `- ${f.description}\n`;
            });
            changelog += '\n';
        }
        
        if (this.changes.fixes.length > 0) {
            changelog += `### 🐛 Bug Fixes\n`;
            this.changes.fixes.forEach(f => {
                changelog += `- ${f.description}\n`;
            });
            changelog += '\n';
        }
        
        // Group other changes by category
        const otherByCategory = {};
        this.changes.other.forEach(o => {
            if (!otherByCategory[o.category]) {
                otherByCategory[o.category] = [];
            }
            otherByCategory[o.category].push(o);
        });
        
        const categoryTitles = {
            [CHANGE_CATEGORIES.DOCS]: '📚 Documentation',
            [CHANGE_CATEGORIES.STYLE]: '💄 Style',
            [CHANGE_CATEGORIES.REFACTOR]: '♻️ Refactor',
            [CHANGE_CATEGORIES.PERF]: '⚡ Performance',
            [CHANGE_CATEGORIES.TEST]: '✅ Tests',
            [CHANGE_CATEGORIES.BUILD]: '📦 Build',
            [CHANGE_CATEGORIES.CI]: '👷 CI',
            [CHANGE_CATEGORIES.CHORE]: '🔧 Chore'
        };
        
        Object.entries(otherByCategory).forEach(([category, changes]) => {
            if (changes.length > 0) {
                changelog += `### ${categoryTitles[category] || category}\n`;
                changes.forEach(c => {
                    changelog += `- ${c.description}\n`;
                });
                changelog += '\n';
            }
        });
        
        return changelog;
    }
    
    /**
     * Update package.json version
     */
    async updatePackageVersion(newVersion) {
        const packagePath = path.join(this.config.workingDir, 'package.json');
        
        try {
            const packageJson = JSON.parse(await fs.readFile(packagePath, 'utf8'));
            packageJson.version = newVersion;
            
            await fs.writeFile(
                packagePath,
                JSON.stringify(packageJson, null, 2) + '\n',
                'utf8'
            );
            
            console.log(`📦 Updated package.json to version ${newVersion}`);
        } catch (error) {
            console.log('No package.json to update');
        }
    }
    
    /**
     * Update CHANGELOG.md
     */
    async updateChangelog(newEntry) {
        const changelogPath = path.join(this.config.workingDir, 'CHANGELOG.md');
        
        try {
            let existingChangelog = await fs.readFile(changelogPath, 'utf8');
            
            // Insert new entry after title
            const lines = existingChangelog.split('\n');
            const titleIndex = lines.findIndex(line => line.startsWith('# '));
            
            if (titleIndex >= 0) {
                lines.splice(titleIndex + 2, 0, newEntry);
                existingChangelog = lines.join('\n');
            } else {
                existingChangelog = `# Changelog\n\n${newEntry}\n${existingChangelog}`;
            }
            
            await fs.writeFile(changelogPath, existingChangelog, 'utf8');
            console.log('📝 Updated CHANGELOG.md');
            
        } catch (error) {
            // Create new changelog
            const header = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

`;
            
            await fs.writeFile(changelogPath, header + newEntry, 'utf8');
            console.log('📝 Created CHANGELOG.md');
        }
    }
    
    /**
     * Commit version changes
     */
    async commitVersionChanges(version) {
        try {
            execSync('git add -A', {
                cwd: this.config.workingDir,
                encoding: 'utf8'
            });
            
            execSync(`git commit -m "chore: release v${version}"`, {
                cwd: this.config.workingDir,
                encoding: 'utf8'
            });
            
            console.log(`📝 Committed version changes`);
        } catch (error) {
            console.log('No changes to commit');
        }
    }
    
    /**
     * Create annotated tag
     */
    async createAnnotatedTag(tagName, message) {
        execSync(`git tag -a ${tagName} -m "${message.replace(/"/g, '\\"')}"`, {
            cwd: this.config.workingDir,
            encoding: 'utf8'
        });
    }
    
    /**
     * Get unique contributors
     */
    getUniqueContributors() {
        const contributors = new Set(this.commits.map(c => c.author));
        return contributors.size;
    }
    
    /**
     * Generate template release notes
     */
    generateTemplateReleaseNotes(analysis) {
        let notes = `# Release ${analysis.newVersion}\n\n`;
        
        if (this.changes.breaking.length > 0) {
            notes += `## ⚠️ Breaking Changes\n\n`;
            notes += `This release contains breaking changes. Please review the migration guide below.\n\n`;
            this.changes.breaking.forEach(c => {
                notes += `- ${c.description}\n`;
            });
            notes += '\n';
        }
        
        if (this.changes.features.length > 0) {
            notes += `## ✨ New Features\n\n`;
            this.changes.features.forEach(f => {
                notes += `- ${f.description}\n`;
            });
            notes += '\n';
        }
        
        if (this.changes.fixes.length > 0) {
            notes += `## 🐛 Bug Fixes\n\n`;
            this.changes.fixes.forEach(f => {
                notes += `- ${f.description}\n`;
            });
            notes += '\n';
        }
        
        notes += `## 👥 Contributors\n\n`;
        notes += `Thank you to all ${this.getUniqueContributors()} contributors!\n`;
        
        return notes;
    }
    
    /**
     * AI interaction
     */
    async callAI(prompt) {
        if (this.config.dryRun) {
            return '[DRY RUN] AI response';
        }
        
        try {
            if (this.config.aiProvider === 'ollama') {
                const response = await fetch('http://localhost:11434/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        model: this.config.model,
                        prompt,
                        stream: false
                    })
                });
                
                const data = await response.json();
                return data.response;
            }
            
            return null;
        } catch (error) {
            console.error('AI request failed:', error.message);
            return null;
        }
    }
    
    /**
     * Helper methods
     */
    async fileExists(filePath) {
        try {
            await fs.access(path.join(this.config.workingDir, filePath));
            return true;
        } catch {
            return false;
        }
    }
    
    async findVersionInFiles() {
        // Check common version file locations
        const versionFiles = ['VERSION', 'version.txt', '.version'];
        
        for (const file of versionFiles) {
            try {
                const content = await fs.readFile(
                    path.join(this.config.workingDir, file),
                    'utf8'
                );
                const version = content.trim();
                if (semver.valid(version)) {
                    return version;
                }
            } catch {
                // Continue to next file
            }
        }
        
        return null;
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const command = args[0];
    
    const tagger = new SmartTaggingSystem({
        dryRun: args.includes('--dry-run')
    });
    
    switch (command) {
        case 'analyze':
            tagger.analyzeRepository().then(analysis => {
                console.log('\n📊 Version Analysis:');
                console.log(`Current: ${analysis.currentVersion}`);
                console.log(`Suggested: ${analysis.newVersion}`);
                console.log(`Bump type: ${analysis.bumpType}`);
                console.log(`\nChanges:`);
                console.log(`- Breaking: ${analysis.changes.breaking.length}`);
                console.log(`- Features: ${analysis.changes.features.length}`);
                console.log(`- Fixes: ${analysis.changes.fixes.length}`);
                console.log(`- Other: ${analysis.changes.other.length}`);
            }).catch(error => {
                console.error('Analysis failed:', error);
                process.exit(1);
            });
            break;
            
        case 'tag':
            tagger.createTag().then(result => {
                console.log('\n✅ Tag created successfully!');
                console.log(`Tag: ${result.tagName}`);
                console.log(`Version: ${result.version}`);
                console.log(`Type: ${result.type}`);
            }).catch(error => {
                console.error('Tagging failed:', error);
                process.exit(1);
            });
            break;
            
        default:
            console.log(`
Smart Tagging System

Commands:
  analyze    Analyze repository and suggest version
  tag        Create new version tag

Options:
  --dry-run  Preview without making changes

Examples:
  node smart-tagging-system.js analyze
  node smart-tagging-system.js tag
  node smart-tagging-system.js tag --dry-run
            `);
    }
}

module.exports = SmartTaggingSystem;