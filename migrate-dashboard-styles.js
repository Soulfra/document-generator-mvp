#!/usr/bin/env node

/**
 * Dashboard Style Migration Helper
 * Analyzes HTML files and suggests CSS framework replacements
 * 
 * Usage: node migrate-dashboard-styles.js [dashboard.html]
 * Or: node migrate-dashboard-styles.js --all
 */

const fs = require('fs');
const path = require('path');

// Style mapping database
const STYLE_MAPPINGS = {
    // Background patterns
    'background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)': 'dashboard-dark dashboard-document-generator',
    'background: linear-gradient(135deg, #6B46C1 0%, #9333EA 50%, #C026D3 100%)': 'dashboard-soulfra',
    'background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)': 'dashboard-coldstart',
    'background: #000000': 'dashboard-ai-economy',
    
    // Common panel styles
    'background: rgba(0, 0, 0, 0.8)': 'panel dark-glass',
    'background: rgba(255, 255, 255, 0.1)': 'panel glass-panel',
    'background: rgba(26, 26, 46, 0.8)': 'panel',
    
    // Border styles
    'border: 1px solid #00ff88': 'glow-border glow-green',
    'border: 1px solid rgba(255, 255, 255, 0.1)': '',  // Default panel border
    'border: 1px solid rgba(255, 255, 255, 0.2)': 'service-card',
    
    // Text colors
    'color: #00ff88': 'text-accent',
    'color: #00ffff': 'text-link',
    'color: #ffffff': 'text-primary',
    'color: #cccccc': 'text-secondary',
    'color: #ff4444': 'text-error',
    'color: #ffaa00': 'text-warning',
    
    // Common patterns
    'display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))': 'dashboard-stats-grid',
    'display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr))': 'services-grid',
    'padding: 20px': 'p-lg',
    'padding: 15px': 'p-md',
    'margin: 20px 0': 'my-lg',
    'margin-bottom: 30px': 'mb-xl',
    'text-align: center': 'text-center',
    'border-radius: 10px': 'rounded-lg',
    'border-radius: 8px': 'rounded-md',
    'transition: all 0.3s ease': '', // Default in framework
};

// Common inline styles to extract
const INLINE_STYLE_PATTERNS = [
    /style\s*=\s*"([^"]+)"/gi,
    /style\s*=\s*'([^']+)'/gi,
];

// Component detection patterns
const COMPONENT_PATTERNS = {
    'stat-card': /<div[^>]*class="stat"[^>]*>.*?<div[^>]*class="stat-number".*?<\/div>/gs,
    'service-card': /<div[^>]*class="service-card"[^>]*>/g,
    'terminal-panel': /<div[^>]*id="terminal"[^>]*>|<div[^>]*class="[^"]*terminal[^"]*"[^>]*>/g,
    'activity-log': /<div[^>]*class="[^"]*logs[^"]*"[^>]*>/g,
};

class DashboardMigrator {
    constructor() {
        this.report = {
            files: [],
            totalInlineStyles: 0,
            mappedStyles: 0,
            unmappedStyles: [],
            suggestedComponents: [],
            warnings: [],
        };
    }

    analyzeFile(filePath) {
        console.log(`\n📄 Analyzing: ${filePath}`);
        
        const content = fs.readFileSync(filePath, 'utf8');
        const fileReport = {
            path: filePath,
            inlineStyles: [],
            suggestions: [],
            components: [],
            hasFramework: false,
        };

        // Check if already using framework
        if (content.includes('master.css') || content.includes('unified-framework.css')) {
            fileReport.hasFramework = true;
            console.log('✅ Already using CSS framework');
        }

        // Extract inline styles
        const inlineStyles = this.extractInlineStyles(content);
        fileReport.inlineStyles = inlineStyles;
        this.report.totalInlineStyles += inlineStyles.length;

        // Map styles to framework classes
        inlineStyles.forEach(style => {
            const suggestion = this.mapStyleToClass(style);
            if (suggestion.mapped) {
                fileReport.suggestions.push(suggestion);
                this.report.mappedStyles++;
            } else {
                this.report.unmappedStyles.push({
                    file: filePath,
                    style: style.value
                });
            }
        });

        // Detect components that could be standardized
        const components = this.detectComponents(content);
        fileReport.components = components;

        this.report.files.push(fileReport);
        return fileReport;
    }

    extractInlineStyles(content) {
        const styles = [];
        
        INLINE_STYLE_PATTERNS.forEach(pattern => {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const styleValue = match[1];
                const position = match.index;
                const line = content.substring(0, position).split('\n').length;
                
                styles.push({
                    value: styleValue,
                    line: line,
                    context: content.substring(position - 50, position + 100).replace(/\n/g, ' ')
                });
            }
        });

        // Also extract <style> blocks
        const styleBlocks = content.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
        if (styleBlocks) {
            styleBlocks.forEach(block => {
                const cleanBlock = block.replace(/<\/?style[^>]*>/gi, '').trim();
                if (cleanBlock && !cleanBlock.includes('@import')) {
                    this.report.warnings.push({
                        type: 'style-block',
                        message: 'Found <style> block that should be moved to external CSS',
                        content: cleanBlock.substring(0, 100) + '...'
                    });
                }
            });
        }

        return styles;
    }

    mapStyleToClass(style) {
        const styleValue = style.value.toLowerCase().replace(/\s+/g, ' ').trim();
        
        // Direct mapping
        for (const [pattern, className] of Object.entries(STYLE_MAPPINGS)) {
            if (styleValue.includes(pattern.toLowerCase())) {
                return {
                    mapped: true,
                    original: style.value,
                    suggestion: className,
                    confidence: 'high'
                };
            }
        }

        // Pattern-based mapping
        const mappings = [];
        
        // Colors
        if (styleValue.includes('color:')) {
            const colorMatch = styleValue.match(/color:\s*([^;]+)/);
            if (colorMatch) {
                const color = colorMatch[1].trim();
                if (color.includes('#00ff88')) mappings.push('text-accent');
                else if (color.includes('#00ffff')) mappings.push('text-link');
                else if (color.includes('#ff')) mappings.push('text-error');
            }
        }

        // Spacing
        if (styleValue.includes('padding:')) {
            const paddingMatch = styleValue.match(/padding:\s*(\d+)px/);
            if (paddingMatch) {
                const padding = parseInt(paddingMatch[1]);
                if (padding <= 8) mappings.push('p-sm');
                else if (padding <= 16) mappings.push('p-md');
                else if (padding <= 24) mappings.push('p-lg');
                else mappings.push('p-xl');
            }
        }

        // Display
        if (styleValue.includes('display: flex')) mappings.push('flex');
        if (styleValue.includes('display: grid')) mappings.push('grid');
        if (styleValue.includes('text-align: center')) mappings.push('text-center');

        if (mappings.length > 0) {
            return {
                mapped: true,
                original: style.value,
                suggestion: mappings.join(' '),
                confidence: 'medium'
            };
        }

        return {
            mapped: false,
            original: style.value
        };
    }

    detectComponents(content) {
        const detectedComponents = [];

        Object.entries(COMPONENT_PATTERNS).forEach(([component, pattern]) => {
            const matches = content.match(pattern);
            if (matches) {
                detectedComponents.push({
                    type: component,
                    count: matches.length,
                    suggestion: `Use standardized .${component} class from framework`
                });
            }
        });

        return detectedComponents;
    }

    generateReport() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 MIGRATION REPORT');
        console.log('='.repeat(60));

        console.log(`\n✅ Files Analyzed: ${this.report.files.length}`);
        console.log(`📐 Total Inline Styles: ${this.report.totalInlineStyles}`);
        console.log(`🔄 Mapped to Framework: ${this.report.mappedStyles} (${Math.round(this.report.mappedStyles / this.report.totalInlineStyles * 100)}%)`);
        console.log(`❓ Unmapped Styles: ${this.report.unmappedStyles.length}`);

        // Per-file summary
        console.log('\n📁 FILE SUMMARIES:');
        this.report.files.forEach(file => {
            console.log(`\n${file.path}:`);
            console.log(`  - Framework: ${file.hasFramework ? '✅ Yes' : '❌ No'}`);
            console.log(`  - Inline Styles: ${file.inlineStyles.length}`);
            console.log(`  - Components Detected: ${file.components.map(c => c.type).join(', ') || 'None'}`);
            
            if (file.suggestions.length > 0) {
                console.log(`  - Sample Replacements:`);
                file.suggestions.slice(0, 3).forEach(s => {
                    console.log(`    • "${s.original}" → class="${s.suggestion}"`);
                });
            }
        });

        // Warnings
        if (this.report.warnings.length > 0) {
            console.log('\n⚠️  WARNINGS:');
            this.report.warnings.forEach(warning => {
                console.log(`  - ${warning.type}: ${warning.message}`);
            });
        }

        // Migration steps
        console.log('\n📝 RECOMMENDED MIGRATION STEPS:');
        console.log('1. Add to <head>: <link rel="stylesheet" href="styles/master.css">');
        console.log('2. Add to before </body>: <script src="styles/theme-toggle.js"></script>');
        console.log('3. Replace inline styles with suggested classes');
        console.log('4. Test thoroughly, especially JavaScript interactions');
        console.log('5. Remove <style> blocks after confirming everything works');

        // Save detailed report
        const reportPath = `migration-report-${Date.now()}.json`;
        fs.writeFileSync(reportPath, JSON.stringify(this.report, null, 2));
        console.log(`\n💾 Detailed report saved to: ${reportPath}`);
    }

    generateMigrationFile(filePath) {
        const fileReport = this.report.files.find(f => f.path === filePath);
        if (!fileReport) return;

        let content = fs.readFileSync(filePath, 'utf8');
        
        // Create a migration preview
        const migrationPath = filePath.replace('.html', '.migrated.html');
        
        // Add framework CSS if not present
        if (!fileReport.hasFramework) {
            content = content.replace('</head>', 
                '    <!-- CSS Framework -->\n    <link rel="stylesheet" href="styles/master.css">\n</head>');
            content = content.replace('</body>',
                '    <!-- Theme Toggle -->\n    <script src="styles/theme-toggle.js"></script>\n</body>');
        }

        // Comment out inline styles and add suggestions
        fileReport.suggestions.forEach(suggestion => {
            const styleRegex = new RegExp(`style\\s*=\\s*["']${suggestion.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["']`, 'gi');
            content = content.replace(styleRegex, (match) => {
                return `${match} <!-- MIGRATE: class="${suggestion.suggestion}" -->`;
            });
        });

        fs.writeFileSync(migrationPath, content);
        console.log(`\n✅ Migration preview created: ${migrationPath}`);
    }
}

// CLI execution
if (require.main === module) {
    const args = process.argv.slice(2);
    const migrator = new DashboardMigrator();

    if (args.length === 0) {
        console.log('Usage: node migrate-dashboard-styles.js [dashboard.html]');
        console.log('       node migrate-dashboard-styles.js --all');
        process.exit(1);
    }

    if (args[0] === '--all') {
        // Find all HTML files
        const htmlFiles = [];
        const scanDirectory = (dir) => {
            const files = fs.readdirSync(dir);
            files.forEach(file => {
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
                    scanDirectory(fullPath);
                } else if (file.endsWith('.html')) {
                    htmlFiles.push(fullPath);
                }
            });
        };
        
        scanDirectory('.');
        console.log(`Found ${htmlFiles.length} HTML files to analyze`);
        
        htmlFiles.forEach(file => migrator.analyzeFile(file));
    } else {
        // Analyze specific file
        const filePath = args[0];
        if (!fs.existsSync(filePath)) {
            console.error(`Error: File not found: ${filePath}`);
            process.exit(1);
        }
        
        migrator.analyzeFile(filePath);
        migrator.generateMigrationFile(filePath);
    }

    migrator.generateReport();
}

module.exports = { DashboardMigrator };