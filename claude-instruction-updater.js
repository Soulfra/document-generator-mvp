#!/usr/bin/env node

/**
 * 📝 CLAUDE INSTRUCTION UPDATER
 * 
 * Automatically updates CLAUDE.md files with meta-lessons learned
 * from errors, creating a symlinked instruction layer that ensures
 * Claude always has the latest system knowledge.
 * 
 * Features:
 * - Updates CLAUDE.md files with learned patterns
 * - Creates symlinks to share knowledge across services
 * - Maintains version history of instructions
 * - Integrates with meta-learning and error vault
 */

const fs = require('fs').promises;
const path = require('path');
const MetaLearningErrorSystem = require('./meta-learning-error-system');
const ErrorKnowledgeVault = require('./error-knowledge-vault');

class ClaudeInstructionUpdater {
    constructor() {
        this.metaLearning = new MetaLearningErrorSystem();
        this.errorVault = new ErrorKnowledgeVault();
        
        // CLAUDE.md file locations
        this.claudeFiles = [
            './CLAUDE.md',
            './CLAUDE.ai-services.md',
            './CLAUDE.document-parser.md',
            './CLAUDE.template-processor.md',
            './CLAUDE.meta-lessons.md'
        ];
        
        // Instruction templates
        this.templates = {
            errorPrevention: `
## 🛡️ Error Prevention Patterns

Based on system learning, here are critical patterns to avoid:

{{patterns}}

### Proactive Measures
{{measures}}
`,
            systemHealth: `
## 🏥 System Health Checks

Always verify these before operations:

{{healthChecks}}
`,
            knownIssues: `
## ⚠️ Known Issues & Solutions

{{issues}}
`,
            performanceOptimizations: `
## 🚀 Performance Optimizations

Learned optimizations from production:

{{optimizations}}
`
        };
        
        console.log('📝 Claude Instruction Updater initializing...');
    }
    
    async initialize() {
        try {
            // Initialize sub-systems
            await this.metaLearning.initialize();
            await this.errorVault.initialize();
            
            // Create backup directory
            await fs.mkdir('.claude-backups', { recursive: true });
            
            // Set up watchers
            this.setupWatchers();
            
            // Initial update
            await this.updateAllInstructions();
            
            console.log('✅ Claude Instruction Updater ready!');
            console.log(`   📄 Monitoring ${this.claudeFiles.length} CLAUDE.md files`);
            console.log(`   🔄 Auto-update enabled`);
            
            return this;
            
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            throw error;
        }
    }
    
    setupWatchers() {
        // Watch for meta-learning updates
        this.metaLearning.on('error:recorded', async (event) => {
            console.log('📝 New error pattern detected, updating instructions...');
            await this.updateErrorPatterns(event);
        });
        
        this.metaLearning.on('prevention:triggered', async (event) => {
            console.log('🛡️ Prevention rule triggered, updating instructions...');
            await this.updatePreventionRules(event);
        });
        
        // Periodic comprehensive update
        setInterval(() => {
            this.performComprehensiveUpdate();
        }, 60 * 60 * 1000); // Every hour
    }
    
    /**
     * Update all CLAUDE.md files
     */
    async updateAllInstructions() {
        console.log('\n🔄 Updating all CLAUDE.md files...');
        
        for (const file of this.claudeFiles) {
            try {
                await this.updateInstructionFile(file);
            } catch (error) {
                console.error(`   ❌ Failed to update ${file}:`, error.message);
            }
        }
        
        // Create/update symlinks
        await this.createSymlinks();
    }
    
    /**
     * Update a specific CLAUDE.md file
     */
    async updateInstructionFile(filePath) {
        console.log(`   📝 Updating ${filePath}...`);
        
        // Backup existing file
        await this.backupFile(filePath);
        
        // Read current content
        let content = '';
        try {
            content = await fs.readFile(filePath, 'utf-8');
        } catch {
            // File doesn't exist, create with base template
            content = await this.createBaseTemplate(filePath);
        }
        
        // Update sections
        content = await this.updateErrorSection(content);
        content = await this.updateHealthSection(content);
        content = await this.updateKnownIssuesSection(content);
        content = await this.updateOptimizationSection(content);
        
        // Add last updated timestamp
        content = this.addUpdateTimestamp(content);
        
        // Write updated content
        await fs.writeFile(filePath, content);
        console.log(`   ✅ Updated ${filePath}`);
    }
    
    /**
     * Create base template for new CLAUDE.md file
     */
    async createBaseTemplate(filePath) {
        const fileName = path.basename(filePath, '.md');
        const serviceName = fileName.replace('CLAUDE.', '').replace(/-/g, ' ');
        
        return `# ${fileName} - ${serviceName} Instructions

This file contains system-learned instructions and patterns for ${serviceName}.
It is automatically updated by the Meta-Learning Error System.

## 📋 Overview

${serviceName} specific instructions and learned patterns.

${this.templates.errorPrevention}

${this.templates.systemHealth}

${this.templates.knownIssues}

${this.templates.performanceOptimizations}

---

*Last Updated: ${new Date().toISOString()}*
*Auto-generated from system learning*
`;
    }
    
    /**
     * Update error prevention section
     */
    async updateErrorSection(content) {
        const report = await this.metaLearning.getHealthReport();
        
        let patterns = '### Common Error Patterns\n\n';
        
        // Add top errors
        for (const error of report.topErrors) {
            patterns += `- **${error.type}** (${error.count} occurrences, severity: ${error.severity})\n`;
            if (error.hasResolution) {
                patterns += `  - ✅ Has known resolution\n`;
            }
        }
        
        // Add timeout patterns
        if (report.trends.timeouts > 0) {
            patterns += `\n### Timeout Patterns\n`;
            patterns += `- Detected ${report.trends.timeouts} timeout patterns\n`;
            patterns += `- Always implement retry logic with exponential backoff\n`;
            patterns += `- Consider increasing default timeouts by 50%\n`;
        }
        
        // Add prevention measures
        let measures = '### Automatic Prevention Measures\n\n';
        measures += '- Memory monitoring with garbage collection at 75% usage\n';
        measures += '- Automatic service restart on repeated failures\n';
        measures += '- Circuit breaker activation for cascade prevention\n';
        measures += '- Pre-emptive connection pooling for high-load services\n';
        
        // Replace in template
        const errorSection = this.templates.errorPrevention
            .replace('{{patterns}}', patterns)
            .replace('{{measures}}', measures);
        
        return this.replaceOrAppendSection(content, 
            '## 🛡️ Error Prevention Patterns',
            errorSection
        );
    }
    
    /**
     * Update health check section
     */
    async updateHealthSection(content) {
        let healthChecks = '### Required Health Checks\n\n';
        
        // Get current service health
        const services = [
            { name: 'PostgreSQL', check: 'pg_isready -h localhost -p 5432' },
            { name: 'Redis', check: 'redis-cli ping' },
            { name: 'Docker', check: 'docker info' },
            { name: 'Verification Bus', check: 'curl http://localhost:9876/health' },
            { name: 'Unified Substrate', check: 'curl http://localhost:4000/health' }
        ];
        
        healthChecks += '```bash\n';
        healthChecks += '# Always run these checks before operations:\n\n';
        
        for (const service of services) {
            healthChecks += `# Check ${service.name}\n`;
            healthChecks += `${service.check}\n\n`;
        }
        
        healthChecks += '```\n';
        
        // Add verification levels
        healthChecks += '\n### Verification Levels\n\n';
        healthChecks += '- **Basic**: Process exists\n';
        healthChecks += '- **Standard**: Process + port listening + ping response\n';
        healthChecks += '- **Deep**: Standard + API health + data flow\n';
        healthChecks += '- **Paranoid**: Deep + performance baseline + memory checks\n';
        
        const healthSection = this.templates.systemHealth
            .replace('{{healthChecks}}', healthChecks);
        
        return this.replaceOrAppendSection(content,
            '## 🏥 System Health Checks',
            healthSection
        );
    }
    
    /**
     * Update known issues section
     */
    async updateKnownIssuesSection(content) {
        // Search vault for recent issues
        const recentErrors = await this.errorVault.searchKnowledge('');
        
        let issues = '### Recently Encountered Issues\n\n';
        
        // Group by category
        const byCategory = {};
        for (const result of recentErrors.slice(0, 10)) {
            if (!byCategory[result.category]) {
                byCategory[result.category] = [];
            }
            byCategory[result.category].push(result);
        }
        
        for (const [category, categoryIssues] of Object.entries(byCategory)) {
            issues += `#### ${category.charAt(0).toUpperCase() + category.slice(1)} Issues\n\n`;
            
            for (const issue of categoryIssues) {
                issues += `**Issue**: ${issue.pattern.message || 'Unknown'}\n`;
                issues += `- Frequency: ${issue.frequency} occurrences\n`;
                issues += `- Severity: ${issue.severity}\n`;
                
                if (issue.solutions.length > 0) {
                    const bestSolution = issue.solutions[0];
                    issues += `- **Solution**: ${bestSolution.solution.summary}\n`;
                    
                    if (bestSolution.solution.steps) {
                        issues += '  - Steps:\n';
                        for (const step of bestSolution.solution.steps) {
                            issues += `    1. ${step}\n`;
                        }
                    }
                }
                
                issues += '\n';
            }
        }
        
        const issuesSection = this.templates.knownIssues
            .replace('{{issues}}', issues);
        
        return this.replaceOrAppendSection(content,
            '## ⚠️ Known Issues & Solutions',
            issuesSection
        );
    }
    
    /**
     * Update optimization section
     */
    async updateOptimizationSection(content) {
        let optimizations = '### Learned Optimizations\n\n';
        
        // Get statistics from error vault
        const stats = await this.errorVault.getStatistics();
        
        // Add performance tips based on patterns
        optimizations += '#### Response Time Optimizations\n';
        optimizations += '- Pre-warm connections for services with >1000ms avg response time\n';
        optimizations += '- Implement connection pooling (size: 10) for high-traffic services\n';
        optimizations += '- Cache API responses for 5 minutes where appropriate\n\n';
        
        optimizations += '#### Memory Optimizations\n';
        optimizations += '- Force garbage collection when heap usage exceeds 75%\n';
        optimizations += '- Restart services showing memory growth >10% per hour\n';
        optimizations += '- Clear caches proactively during low-traffic periods\n\n';
        
        optimizations += '#### Error Rate Optimizations\n';
        
        if (stats.patterns.total > 50) {
            optimizations += `- System has learned from ${stats.patterns.total} error patterns\n`;
            optimizations += `- ${stats.solutions.verified} verified solutions available\n`;
            optimizations += `- Average solution success rate: ${(stats.solutions.averageSuccessRate * 100).toFixed(1)}%\n`;
        }
        
        const optimizationSection = this.templates.performanceOptimizations
            .replace('{{optimizations}}', optimizations);
        
        return this.replaceOrAppendSection(content,
            '## 🚀 Performance Optimizations',
            optimizationSection
        );
    }
    
    /**
     * Replace or append a section in content
     */
    replaceOrAppendSection(content, sectionHeader, newSection) {
        const sectionRegex = new RegExp(
            `${sectionHeader}[\\s\\S]*?(?=\\n##|\\n---|$)`,
            'g'
        );
        
        if (content.includes(sectionHeader)) {
            // Replace existing section
            return content.replace(sectionRegex, newSection.trim());
        } else {
            // Append before the last updated line or at end
            const lastUpdatedIndex = content.lastIndexOf('*Last Updated:');
            if (lastUpdatedIndex !== -1) {
                return content.slice(0, lastUpdatedIndex) + 
                       '\n' + newSection.trim() + '\n\n' +
                       content.slice(lastUpdatedIndex);
            } else {
                return content + '\n' + newSection.trim();
            }
        }
    }
    
    /**
     * Add or update timestamp
     */
    addUpdateTimestamp(content) {
        const timestamp = `*Last Updated: ${new Date().toISOString()}*`;
        const autoGenerated = '*Auto-generated from system learning*';
        
        if (content.includes('*Last Updated:')) {
            content = content.replace(/\*Last Updated:.*\*/, timestamp);
        } else {
            content += `\n\n---\n\n${timestamp}\n${autoGenerated}`;
        }
        
        return content;
    }
    
    /**
     * Backup file before updating
     */
    async backupFile(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const backupPath = path.join(
                '.claude-backups',
                `${path.basename(filePath)}.${timestamp}.backup`
            );
            
            await fs.writeFile(backupPath, content);
        } catch {
            // File doesn't exist yet, no backup needed
        }
    }
    
    /**
     * Create symlinks for shared knowledge
     */
    async createSymlinks() {
        console.log('\n📎 Creating symlinks for knowledge sharing...');
        
        const metaLessonsPath = path.resolve('./CLAUDE.meta-lessons.md');
        const targetDirs = [
            './services',
            './FinishThisIdea',
            './FinishThisIdea-Complete',
            './mcp',
            './web-interface',
            './templates'
        ];
        
        for (const dir of targetDirs) {
            try {
                // Check if directory exists
                await fs.access(dir);
                
                const linkPath = path.join(dir, 'CLAUDE.meta-lessons.md');
                
                // Remove existing symlink
                try {
                    await fs.unlink(linkPath);
                } catch {}
                
                // Create new symlink
                await fs.symlink(
                    path.relative(dir, metaLessonsPath),
                    linkPath
                );
                
                console.log(`   ✅ Linked to ${dir}`);
            } catch (error) {
                console.log(`   ⚠️ Skipped ${dir} (not found)`);
            }
        }
    }
    
    /**
     * Update instructions based on new error pattern
     */
    async updateErrorPatterns(event) {
        // Store in vault
        await this.errorVault.storeErrorPattern({
            type: event.errorData.type,
            category: event.errorData.category || 'unknown',
            message: event.errorData.message,
            service: event.errorData.service,
            severity: event.errorData.severity || 'medium',
            timestamp: new Date()
        });
        
        // Update relevant CLAUDE.md files
        const relevantFiles = this.findRelevantFiles(event.errorData);
        for (const file of relevantFiles) {
            await this.updateInstructionFile(file);
        }
    }
    
    /**
     * Update instructions based on prevention rules
     */
    async updatePreventionRules(event) {
        // Store solution in vault
        if (event.pattern && event.pattern.pattern_id) {
            await this.errorVault.storeSolution(event.pattern.pattern_id, {
                summary: 'Automatic prevention rules',
                rules: event.rules,
                verified: false
            });
        }
        
        // Update meta-lessons file
        await this.updateInstructionFile('./CLAUDE.meta-lessons.md');
    }
    
    /**
     * Find relevant CLAUDE.md files for an error
     */
    findRelevantFiles(errorData) {
        const files = ['./CLAUDE.meta-lessons.md'];
        
        // Map services to their instruction files
        if (errorData.service) {
            if (errorData.service.includes('ai') || errorData.service.includes('llm')) {
                files.push('./CLAUDE.ai-services.md');
            }
            if (errorData.service.includes('parse') || errorData.service.includes('document')) {
                files.push('./CLAUDE.document-parser.md');
            }
            if (errorData.service.includes('template')) {
                files.push('./CLAUDE.template-processor.md');
            }
        }
        
        // Always update main file for critical errors
        if (errorData.severity === 'critical') {
            files.push('./CLAUDE.md');
        }
        
        return [...new Set(files)]; // Remove duplicates
    }
    
    /**
     * Perform comprehensive update
     */
    async performComprehensiveUpdate() {
        console.log('\n🔄 Performing comprehensive instruction update...');
        
        // Get full system report
        const metaReport = await this.metaLearning.getHealthReport();
        const vaultStats = await this.errorVault.getStatistics();
        
        console.log(`   📊 Processing ${metaReport.totalPatterns} patterns`);
        console.log(`   💡 ${vaultStats.solutions.total} solutions available`);
        
        // Update all files
        await this.updateAllInstructions();
        
        // Export knowledge for backup
        if (metaReport.totalPatterns > 100) {
            console.log('   📤 Exporting knowledge backup...');
            await this.errorVault.exportKnowledge();
        }
        
        console.log('   ✅ Comprehensive update complete');
    }
    
    /**
     * Generate summary report
     */
    async generateSummaryReport() {
        const report = {
            timestamp: new Date().toISOString(),
            filesUpdated: this.claudeFiles.length,
            patterns: await this.metaLearning.getHealthReport(),
            vault: await this.errorVault.getStatistics(),
            recommendations: []
        };
        
        // Add recommendations based on patterns
        if (report.patterns.trends.timeouts > 10) {
            report.recommendations.push('Consider global timeout increase');
        }
        if (report.patterns.trends.silentErrors > 5) {
            report.recommendations.push('Implement deeper health checks');
        }
        if (report.vault.storage.totalMB > 100) {
            report.recommendations.push('Archive old error patterns');
        }
        
        return report;
    }
}

// Export for use
module.exports = ClaudeInstructionUpdater;

// Run if executed directly
if (require.main === module) {
    const updater = new ClaudeInstructionUpdater();
    
    updater.initialize().then(async () => {
        console.log('\n📝 CLAUDE INSTRUCTION UPDATER DEMO');
        console.log('=====================================\n');
        
        // Generate initial report
        console.log('1. Generating system report...');
        const report = await updater.generateSummaryReport();
        console.log(JSON.stringify(report, null, 2));
        
        // Force update all files
        console.log('\n2. Updating all instruction files...');
        await updater.updateAllInstructions();
        
        // Simulate error pattern
        console.log('\n3. Simulating new error pattern...');
        await updater.updateErrorPatterns({
            errorData: {
                type: 'timeout',
                category: 'network',
                message: 'Demo timeout error',
                service: 'ai-service',
                severity: 'high'
            }
        });
        
        console.log('\n✅ Claude instructions are now self-updating!');
        console.log('   Instructions will be updated automatically as the system learns.');
        console.log('   Press Ctrl+C to stop\n');
    }).catch(console.error);
}