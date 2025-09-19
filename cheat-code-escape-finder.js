#!/usr/bin/env node

/**
 * CHEAT CODE ESCAPE FINDER
 * Quick diagnostic tool to find all /> patterns causing the blue escape issue
 * Scans templates, encodings, and render outputs
 */

const fs = require('fs').promises;
const path = require('path');
const { glob } = require('glob');

class CheatCodeEscapeFinder {
    constructor() {
        this.escapePatterns = {
            directSelfClosing: /\/>/g,
            htmlEncodedGt: /&gt;/g,
            escapedSlash: /\\\//g,
            hexEncodedSlash: /&#x2F;/g,
            decimalEncodedSlash: /&#47;/g,
            doubleEscaped: /&amp;gt;/g,
            templateEscape: /\{\{.*?\/>\s*\}\}/g,
            reactSelfClosing: /<\w+\s*\/>/g
        };
        
        this.bluePatterns = {
            cssBlue: /color:\s*blue|color:\s*#[0-9a-fA-F]*[4-9a-fA-F]{2}/,
            classBlue: /class.*?blue|className.*?blue/,
            styleBlue: /style.*?blue/
        };
        
        this.results = {
            templates: [],
            encodings: [],
            renders: [],
            statusBars: [],
            total: 0
        };
    }
    
    async scanAllFiles() {
        console.log('🔍 CHEAT CODE ESCAPE FINDER ACTIVATED');
        console.log('=' .repeat(50));
        
        // Scan template files
        await this.checkTemplateOutput();
        
        // Scan encoding layers
        await this.checkEncodingLayers();
        
        // Scan render outputs
        await this.checkRenderOutput();
        
        // Scan status bars and UI components
        await this.checkStatusBars();
        
        // Report results
        this.reportFindings();
    }
    
    async checkTemplateOutput() {
        console.log('\n📄 Scanning template files...');
        
        const templateFiles = await glob('**/*.{tsx,jsx,handlebars,hbs}', {
            ignore: ['node_modules/**', 'dist/**', 'build/**']
        });
        
        for (const file of templateFiles) {
            try {
                const content = await fs.readFile(file, 'utf-8');
                const findings = this.scanContent(content, file);
                
                if (findings.length > 0) {
                    this.results.templates.push({
                        file,
                        findings,
                        hasBlue: this.checkForBlue(content)
                    });
                }
            } catch (err) {
                // Skip files we can't read
            }
        }
    }
    
    async checkEncodingLayers() {
        console.log('\n🔐 Scanning encoding layers...');
        
        const encodingFiles = await glob('**/*{encod,escap,sanitiz}*.js', {
            ignore: ['node_modules/**', 'dist/**', 'build/**']
        });
        
        for (const file of encodingFiles) {
            try {
                const content = await fs.readFile(file, 'utf-8');
                const findings = this.scanContent(content, file);
                
                if (findings.length > 0) {
                    this.results.encodings.push({
                        file,
                        findings,
                        hasBlue: this.checkForBlue(content)
                    });
                }
            } catch (err) {
                // Skip files we can't read
            }
        }
    }
    
    async checkRenderOutput() {
        console.log('\n🎨 Scanning render outputs...');
        
        const renderFiles = await glob('**/*{render,output,display}*.{js,html}', {
            ignore: ['node_modules/**', 'dist/**', 'build/**']
        });
        
        for (const file of renderFiles) {
            try {
                const content = await fs.readFile(file, 'utf-8');
                const findings = this.scanContent(content, file);
                
                if (findings.length > 0) {
                    this.results.renders.push({
                        file,
                        findings,
                        hasBlue: this.checkForBlue(content)
                    });
                }
            } catch (err) {
                // Skip files we can't read
            }
        }
    }
    
    async checkStatusBars() {
        console.log('\n📊 Scanning status bars and UI components...');
        
        const statusFiles = await glob('**/*{status,bar,ticker,monitor}*.{js,html,tsx}', {
            ignore: ['node_modules/**', 'dist/**', 'build/**']
        });
        
        for (const file of statusFiles) {
            try {
                const content = await fs.readFile(file, 'utf-8');
                const findings = this.scanContent(content, file);
                
                if (findings.length > 0) {
                    this.results.statusBars.push({
                        file,
                        findings,
                        hasBlue: this.checkForBlue(content)
                    });
                }
            } catch (err) {
                // Skip files we can't read
            }
        }
    }
    
    scanContent(content, filename) {
        const findings = [];
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
            Object.entries(this.escapePatterns).forEach(([patternName, pattern]) => {
                const matches = line.match(pattern);
                if (matches) {
                    findings.push({
                        line: index + 1,
                        pattern: patternName,
                        matches: matches.length,
                        preview: line.trim().substring(0, 100),
                        hasBlue: this.checkForBlue(line)
                    });
                }
            });
        });
        
        return findings;
    }
    
    checkForBlue(content) {
        return Object.values(this.bluePatterns).some(pattern => pattern.test(content));
    }
    
    reportFindings() {
        console.log('\n' + '=' .repeat(50));
        console.log('📊 ESCAPE FINDER RESULTS');
        console.log('=' .repeat(50));
        
        let totalFindings = 0;
        
        // Report template findings
        if (this.results.templates.length > 0) {
            console.log('\n🔴 TEMPLATE ESCAPES FOUND:');
            this.results.templates.forEach(result => {
                console.log(`\n  📄 ${result.file} ${result.hasBlue ? '(HAS BLUE!)' : ''}`);
                result.findings.forEach(finding => {
                    console.log(`     Line ${finding.line}: ${finding.pattern} (${finding.matches} matches)`);
                    console.log(`     Preview: ${finding.preview}`);
                    if (finding.hasBlue) {
                        console.log('     ⚠️  BLUE STYLING DETECTED!');
                    }
                });
                totalFindings += result.findings.length;
            });
        }
        
        // Report encoding findings
        if (this.results.encodings.length > 0) {
            console.log('\n🔴 ENCODING ESCAPES FOUND:');
            this.results.encodings.forEach(result => {
                console.log(`\n  🔐 ${result.file} ${result.hasBlue ? '(HAS BLUE!)' : ''}`);
                result.findings.forEach(finding => {
                    console.log(`     Line ${finding.line}: ${finding.pattern}`);
                });
                totalFindings += result.findings.length;
            });
        }
        
        // Report render findings
        if (this.results.renders.length > 0) {
            console.log('\n🔴 RENDER ESCAPES FOUND:');
            this.results.renders.forEach(result => {
                console.log(`\n  🎨 ${result.file} ${result.hasBlue ? '(HAS BLUE!)' : ''}`);
                result.findings.forEach(finding => {
                    console.log(`     Line ${finding.line}: ${finding.pattern}`);
                });
                totalFindings += result.findings.length;
            });
        }
        
        // Report status bar findings
        if (this.results.statusBars.length > 0) {
            console.log('\n🔴 STATUS BAR ESCAPES FOUND:');
            this.results.statusBars.forEach(result => {
                console.log(`\n  📊 ${result.file} ${result.hasBlue ? '(HAS BLUE!)' : ''}`);
                result.findings.forEach(finding => {
                    console.log(`     Line ${finding.line}: ${finding.pattern}`);
                    if (finding.hasBlue) {
                        console.log('     ⚠️  POSSIBLE STATUS BAR LEAK!');
                    }
                });
                totalFindings += result.findings.length;
            });
        }
        
        console.log('\n' + '=' .repeat(50));
        console.log(`TOTAL ESCAPE PATTERNS FOUND: ${totalFindings}`);
        console.log('=' .repeat(50));
        
        // Generate fix script
        this.generateFixScript();
    }
    
    generateFixScript() {
        console.log('\n💡 GENERATING FIX SCRIPT...');
        
        const fixScript = `
// AUTO-GENERATED FIX SCRIPT
// Run this to fix all escape issues

const fixEscapes = () => {
    // Files to fix
    const filesToFix = ${JSON.stringify([
        ...this.results.templates.map(r => r.file),
        ...this.results.encodings.map(r => r.file),
        ...this.results.renders.map(r => r.file),
        ...this.results.statusBars.map(r => r.file)
    ], null, 2)};
    
    // Apply fixes
    filesToFix.forEach(file => {
        // Read file
        let content = fs.readFileSync(file, 'utf-8');
        
        // Fix escaped self-closing tags
        content = content.replace(/&lt;(\\w+)\\s*\\/&gt;/g, '<$1 />');
        content = content.replace(/&lt;\\/(\\w+)&gt;/g, '</$1>');
        
        // Fix double escapes
        content = content.replace(/&amp;gt;/g, '>');
        content = content.replace(/&amp;lt;/g, '<');
        
        // Write back
        fs.writeFileSync(file, content);
        console.log('Fixed:', file);
    });
};

fixEscapes();
`;
        
        fs.writeFile('auto-fix-escapes.js', fixScript);
        console.log('✅ Fix script saved as: auto-fix-escapes.js');
    }
}

// Run the cheat code
const finder = new CheatCodeEscapeFinder();
finder.scanAllFiles().catch(console.error);