#!/usr/bin/env node

/**
 * Code Sanitization Script
 * Finds and replaces hardcoded values with environment variables
 */

const fs = require('fs').promises;
const path = require('path');
const glob = require('glob').glob;

const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

const print = {
    info: (text) => console.log(`${colors.cyan}ℹ ${text}${colors.reset}`),
    success: (text) => console.log(`${colors.green}✓ ${text}${colors.reset}`),
    warning: (text) => console.log(`${colors.yellow}⚠ ${text}${colors.reset}`),
    error: (text) => console.log(`${colors.red}✗ ${text}${colors.reset}`)
};

class CodeSanitizer {
    constructor() {
        // Patterns to detect sensitive data
        this.patterns = [
            {
                name: 'API Keys',
                pattern: /(['"`])(sk-[a-zA-Z0-9]{32,}|sk_[a-zA-Z0-9]{32,}|AIza[a-zA-Z0-9]{35}|sk-ant-[a-zA-Z0-9]{90,})(['"`])/g,
                replacement: (match, quote1, key, quote2) => {
                    const envVar = this.getEnvVarName(key);
                    return `process.env.${envVar}`;
                }
            },
            {
                name: 'Database URLs',
                pattern: /(['"`])(postgres:\/\/|postgresql:\/\/|mysql:\/\/|mongodb:\/\/)[^'"`\s]+(['"`])/g,
                replacement: 'process.env.DATABASE_URL'
            },
            {
                name: 'Redis URLs',
                pattern: /(['"`])(redis:\/\/)[^'"`\s]+(['"`])/g,
                replacement: 'process.env.REDIS_URL'
            },
            {
                name: 'AWS Credentials',
                pattern: /(['"`])(AKIA[A-Z0-9]{16})(['"`])/g,
                replacement: 'process.env.AWS_ACCESS_KEY_ID'
            },
            {
                name: 'JWT Secrets',
                pattern: /(jwt[Ss]ecret|JWT_SECRET)\s*[:=]\s*(['"`])([^'"`]+)(['"`])/g,
                replacement: (match, key, quote1, value, quote2) => {
                    return `${key}: process.env.JWT_SECRET`;
                }
            },
            {
                name: 'Hardcoded Passwords',
                pattern: /(password|passwd|pwd)\s*[:=]\s*(['"`])([^'"`]+)(['"`])/gi,
                replacement: (match, key, quote1, value, quote2) => {
                    if (value === 'password' || value.includes('xxx')) return match; // Skip placeholders
                    return `${key}: process.env.${key.toUpperCase()}`;
                }
            },
            {
                name: 'Email Credentials',
                pattern: /(smtp_pass|smtp_password|email_password)\s*[:=]\s*(['"`])([^'"`]+)(['"`])/gi,
                replacement: 'process.env.SMTP_PASS'
            },
            {
                name: 'Stripe Keys',
                pattern: /(['"`])(pk_test_[a-zA-Z0-9]+|sk_test_[a-zA-Z0-9]+|pk_live_[a-zA-Z0-9]+|sk_live_[a-zA-Z0-9]+)(['"`])/g,
                replacement: (match, quote1, key, quote2) => {
                    if (key.startsWith('pk_')) return 'process.env.STRIPE_PUBLISHABLE_KEY';
                    return 'process.env.STRIPE_SECRET_KEY';
                }
            },
            {
                name: 'Localhost URLs',
                pattern: /(https?:\/\/localhost:\d{4,5})/g,
                replacement: (match, url) => {
                    const port = url.match(/:(\d+)/)[1];
                    return `process.env.APP_URL || 'http://localhost:${port}'`;
                }
            }
        ];
        
        // Files to ignore
        this.ignorePatterns = [
            '**/node_modules/**',
            '**/dist/**',
            '**/build/**',
            '**/.git/**',
            '**/coverage/**',
            '**/*.min.js',
            '**/*.map',
            '**/package-lock.json',
            '**/.env*',
            '**/vault-manager.js',
            '**/sanitize.js',
            '**/*.md',
            '**/*.json',
            '**/*.example.*'
        ];
        
        this.report = {
            filesScanned: 0,
            filesModified: 0,
            hardcodedValues: [],
            errors: []
        };
    }
    
    /**
     * Get environment variable name from key
     */
    getEnvVarName(key) {
        if (key.startsWith('sk-proj-')) return 'OPENAI_API_KEY';
        if (key.startsWith('sk-ant-')) return 'ANTHROPIC_API_KEY';
        if (key.startsWith('AIza')) return 'GOOGLE_AI_KEY';
        if (key.startsWith('pk_') || key.startsWith('sk_')) {
            if (key.includes('test')) return key.startsWith('pk_') ? 'STRIPE_PUBLISHABLE_KEY' : 'STRIPE_SECRET_KEY';
            return key.startsWith('pk_') ? 'STRIPE_PUBLISHABLE_KEY' : 'STRIPE_SECRET_KEY';
        }
        return 'API_KEY';
    }
    
    /**
     * Check if file should be ignored
     */
    shouldIgnoreFile(filePath) {
        return this.ignorePatterns.some(pattern => {
            return filePath.includes(pattern.replace(/\*/g, ''));
        });
    }
    
    /**
     * Scan file for hardcoded values
     */
    async scanFile(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            const findings = [];
            let modified = false;
            let newContent = content;
            
            for (const pattern of this.patterns) {
                let match;
                const regex = new RegExp(pattern.pattern);
                
                while ((match = regex.exec(content)) !== null) {
                    findings.push({
                        file: filePath,
                        line: this.getLineNumber(content, match.index),
                        type: pattern.name,
                        value: match[0],
                        suggestion: typeof pattern.replacement === 'function' 
                            ? pattern.replacement(...match) 
                            : pattern.replacement
                    });
                }
            }
            
            if (findings.length > 0) {
                this.report.hardcodedValues.push(...findings);
                return { filePath, findings, modified: false };
            }
            
            return null;
        } catch (error) {
            this.report.errors.push({ file: filePath, error: error.message });
            return null;
        }
    }
    
    /**
     * Replace hardcoded values in file
     */
    async replaceInFile(filePath, dryRun = true) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            let newContent = content;
            let replacements = 0;
            
            for (const pattern of this.patterns) {
                const before = newContent;
                newContent = newContent.replace(
                    pattern.pattern,
                    typeof pattern.replacement === 'function' 
                        ? pattern.replacement 
                        : pattern.replacement
                );
                
                if (before !== newContent) {
                    replacements++;
                }
            }
            
            if (replacements > 0 && !dryRun) {
                // Add require for process.env if needed
                if (!newContent.includes('process.env') && !newContent.includes('require')) {
                    newContent = `// Environment variables required\n${newContent}`;
                }
                
                await fs.writeFile(filePath, newContent);
                this.report.filesModified++;
                return true;
            }
            
            return replacements > 0;
        } catch (error) {
            this.report.errors.push({ file: filePath, error: error.message });
            return false;
        }
    }
    
    /**
     * Get line number from index
     */
    getLineNumber(content, index) {
        return content.substring(0, index).split('\n').length;
    }
    
    /**
     * Generate environment template
     */
    generateEnvTemplate(findings) {
        const envVars = new Map();
        
        for (const finding of findings) {
            const envVar = finding.suggestion.match(/process\.env\.([A-Z_]+)/)?.[1];
            if (envVar && !envVars.has(envVar)) {
                envVars.set(envVar, {
                    example: finding.value.replace(/['"`]/g, ''),
                    type: finding.type
                });
            }
        }
        
        let template = '# Generated from code scan\n\n';
        
        for (const [key, info] of envVars) {
            template += `# ${info.type}\n`;
            template += `${key}=${info.example}\n\n`;
        }
        
        return template;
    }
    
    /**
     * Run the sanitizer
     */
    async run(options = {}) {
        const { 
            pattern = '**/*.js', 
            dryRun = true,
            generateEnv = false 
        } = options;
        
        print.info('🔍 Scanning for hardcoded values...\n');
        
        // Find all files
        const files = await glob(pattern, { 
            ignore: this.ignorePatterns 
        });
        
        print.info(`Found ${files.length} files to scan`);
        
        // Scan files
        for (const file of files) {
            if (this.shouldIgnoreFile(file)) continue;
            
            this.report.filesScanned++;
            const result = await this.scanFile(file);
            
            if (result && !dryRun) {
                await this.replaceInFile(file, false);
            }
        }
        
        // Generate report
        this.printReport();
        
        // Generate env template if requested
        if (generateEnv && this.report.hardcodedValues.length > 0) {
            const template = this.generateEnvTemplate(this.report.hardcodedValues);
            await fs.writeFile('.env.generated', template);
            print.success('\nGenerated .env.generated with discovered values');
        }
        
        return this.report;
    }
    
    /**
     * Print scan report
     */
    printReport() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 Scan Report');
        console.log('='.repeat(60));
        
        console.log(`\nFiles scanned: ${this.report.filesScanned}`);
        console.log(`Files with hardcoded values: ${new Set(this.report.hardcodedValues.map(f => f.file)).size}`);
        console.log(`Total hardcoded values found: ${this.report.hardcodedValues.length}`);
        
        if (this.report.hardcodedValues.length > 0) {
            console.log('\n⚠️  Hardcoded values found:\n');
            
            // Group by file
            const byFile = {};
            for (const finding of this.report.hardcodedValues) {
                if (!byFile[finding.file]) byFile[finding.file] = [];
                byFile[finding.file].push(finding);
            }
            
            for (const [file, findings] of Object.entries(byFile)) {
                print.warning(`\n${file}:`);
                for (const finding of findings) {
                    console.log(`  Line ${finding.line}: ${finding.type}`);
                    console.log(`    Found: ${finding.value.substring(0, 50)}${finding.value.length > 50 ? '...' : ''}`);
                    console.log(`    Replace with: ${finding.suggestion}`);
                }
            }
        } else {
            print.success('\n✅ No hardcoded values found!');
        }
        
        if (this.report.errors.length > 0) {
            print.error('\n❌ Errors encountered:');
            for (const error of this.report.errors) {
                console.log(`  ${error.file}: ${error.error}`);
            }
        }
        
        console.log('\n' + '='.repeat(60));
    }
}

// CLI execution
if (require.main === module) {
    const args = process.argv.slice(2);
    const options = {
        dryRun: !args.includes('--fix'),
        generateEnv: args.includes('--generate-env'),
        pattern: args.find(arg => !arg.startsWith('--')) || '**/*.js'
    };
    
    if (args.includes('--help')) {
        console.log(`
Document Generator Code Sanitizer

Usage:
  node sanitize.js [pattern] [options]

Options:
  --fix           Actually replace hardcoded values (default: dry run)
  --generate-env  Generate .env.generated with found values
  --help          Show this help

Examples:
  node sanitize.js                    # Dry run on all .js files
  node sanitize.js --fix              # Replace hardcoded values
  node sanitize.js "api/**/*.js"      # Scan specific directory
  node sanitize.js --generate-env     # Generate env template
`);
        process.exit(0);
    }
    
    const sanitizer = new CodeSanitizer();
    
    console.log(`Mode: ${options.dryRun ? 'Dry Run' : '⚠️  REPLACE MODE'}`);
    if (!options.dryRun) {
        print.warning('This will modify files! Make sure you have a backup.\n');
    }
    
    sanitizer.run(options).catch(console.error);
}