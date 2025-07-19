#!/usr/bin/env node

/**
 * Documentation Validator
 * Ensures all code follows our documentation and quality standards
 * Run this before commits to maintain vibe coder's paradise
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// Colors for terminal output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
};

class DocumentationValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.successes = [];
    this.rules = this.loadRules();
  }

  loadRules() {
    // Load rules from CLAUDE.md and QUALITY_STANDARDS.md
    const claudePath = path.join(__dirname, '..', 'CLAUDE.md');
    const qualityPath = path.join(__dirname, '..', 'QUALITY_STANDARDS.md');
    
    return {
      noStubs: true,
      noTodos: true,
      requireTests: true,
      requireDocs: true,
      maxNesting: 3,
      requireExports: true,
    };
  }

  async validate() {
    console.log(`${colors.blue}🔍 Validating FinishThisIdea codebase...${colors.reset}\n`);

    // Check all TypeScript/JavaScript files
    const codeFiles = await glob('src/**/*.{ts,tsx,js,jsx}', {
      ignore: ['**/node_modules/**', '**/dist/**', '**/*.test.*', '**/*.spec.*'],
    });

    for (const file of codeFiles) {
      await this.validateFile(file);
    }

    // Check documentation structure
    await this.validateDocStructure();

    // Check for required files
    await this.validateRequiredFiles();

    // Report results
    this.report();
  }

  async validateFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(process.cwd(), filePath);

    // Rule 1: No stubs or placeholders
    if (this.rules.noStubs) {
      const stubPatterns = [
        /\/\/\s*TODO(?!:)/gi,
        /\/\/\s*FIXME/gi,
        /\/\/\s*STUB/gi,
        /\/\/\s*PLACEHOLDER/gi,
        /throw\s+new\s+Error\(['"`]Not implemented/gi,
        /console\.(log|warn|error)\(['"`]TODO/gi,
        /return\s+null\s*;\s*\/\/\s*temporary/gi,
      ];

      for (const pattern of stubPatterns) {
        if (pattern.test(content)) {
          this.errors.push({
            file: relativePath,
            rule: 'NO_STUBS',
            message: 'File contains stubs, TODOs, or placeholders',
          });
          break;
        }
      }
    }

    // Rule 2: Must have proper exports
    if (this.rules.requireExports && filePath.endsWith('.ts') && !filePath.includes('.d.ts')) {
      if (!content.includes('export ')) {
        this.warnings.push({
          file: relativePath,
          rule: 'REQUIRE_EXPORTS',
          message: 'File has no exports',
        });
      }
    }

    // Rule 3: Check nesting depth
    const depth = relativePath.split(path.sep).length - 1;
    if (depth > this.rules.maxNesting + 1) { // +1 for src folder
      this.errors.push({
        file: relativePath,
        rule: 'MAX_NESTING',
        message: `File nested too deep (${depth} levels, max ${this.rules.maxNesting + 1})`,
      });
    }

    // Rule 4: Service files must follow patterns
    if (relativePath.includes('service')) {
      if (!content.includes('LLMRouter') && !content.includes('ollama')) {
        this.warnings.push({
          file: relativePath,
          rule: 'LLM_PATTERN',
          message: 'Service should use LLMRouter with Ollama support',
        });
      }
    }

    // Rule 5: Route files must have proper error handling
    if (relativePath.includes('route')) {
      if (!content.includes('asyncHandler') && !content.includes('try') && !content.includes('catch')) {
        this.errors.push({
          file: relativePath,
          rule: 'ERROR_HANDLING',
          message: 'Route file missing proper error handling',
        });
      }
    }

    // Success tracking
    if (this.errors.filter(e => e.file === relativePath).length === 0) {
      this.successes.push(relativePath);
    }
  }

  async validateDocStructure() {
    const requiredDocs = [
      'docs/01-overview/README.md',
      'docs/01-overview/vision.md',
      'docs/01-overview/quickstart.md',
      'docs/02-architecture/README.md',
      'docs/03-services/README.md',
      'docs/04-implementation/README.md',
      'docs/05-deployment/README.md',
    ];

    for (const doc of requiredDocs) {
      if (!fs.existsSync(doc)) {
        this.errors.push({
          file: doc,
          rule: 'MISSING_DOC',
          message: 'Required documentation file missing',
        });
      }
    }
  }

  async validateRequiredFiles() {
    const required = [
      'CLAUDE.md',
      'AGENT.md',
      'QUALITY_STANDARDS.md',
      'FILE_MAP.md',
      'INDEX.md',
      'README.md',
      '.env.example',
      'package.json',
    ];

    for (const file of required) {
      if (!fs.existsSync(file)) {
        this.errors.push({
          file,
          rule: 'MISSING_REQUIRED',
          message: 'Required project file missing',
        });
      }
    }

    // Check if test files exist for source files
    if (this.rules.requireTests) {
      const sourceFiles = await glob('src/**/*.{ts,tsx}', {
        ignore: ['**/node_modules/**', '**/dist/**', '**/*.test.*', '**/*.spec.*', '**/*.d.ts'],
      });

      for (const source of sourceFiles) {
        const testFile = source.replace(/\.(ts|tsx)$/, '.test.$1');
        const specFile = source.replace(/\.(ts|tsx)$/, '.spec.$1');
        
        if (!fs.existsSync(testFile) && !fs.existsSync(specFile)) {
          this.warnings.push({
            file: source,
            rule: 'MISSING_TESTS',
            message: 'Source file has no corresponding test file',
          });
        }
      }
    }
  }

  report() {
    console.log(`\n${colors.blue}📊 Validation Report${colors.reset}`);
    console.log('━'.repeat(50));

    // Errors
    if (this.errors.length > 0) {
      console.log(`\n${colors.red}❌ Errors (${this.errors.length})${colors.reset}`);
      for (const error of this.errors) {
        console.log(`  ${colors.red}✗${colors.reset} ${error.file}`);
        console.log(`    Rule: ${error.rule}`);
        console.log(`    ${error.message}\n`);
      }
    }

    // Warnings
    if (this.warnings.length > 0) {
      console.log(`\n${colors.yellow}⚠️  Warnings (${this.warnings.length})${colors.reset}`);
      for (const warning of this.warnings) {
        console.log(`  ${colors.yellow}!${colors.reset} ${warning.file}`);
        console.log(`    Rule: ${warning.rule}`);
        console.log(`    ${warning.message}\n`);
      }
    }

    // Success summary
    console.log(`\n${colors.green}✅ Summary${colors.reset}`);
    console.log(`  Files validated: ${this.successes.length + this.errors.length}`);
    console.log(`  Passed: ${colors.green}${this.successes.length}${colors.reset}`);
    console.log(`  Errors: ${colors.red}${this.errors.length}${colors.reset}`);
    console.log(`  Warnings: ${colors.yellow}${this.warnings.length}${colors.reset}`);

    // Vibe check
    if (this.errors.length === 0) {
      console.log(`\n${colors.magenta}✨ Vibe Check: PASSED! Keep the paradise alive! ✨${colors.reset}`);
    } else {
      console.log(`\n${colors.red}💔 Vibe Check: FAILED! Fix errors to restore the vibe. 💔${colors.reset}`);
      process.exit(1);
    }
  }

  // Generate documentation index
  async generateIndex() {
    console.log(`\n${colors.blue}📝 Generating documentation index...${colors.reset}`);
    
    const index = {
      lastUpdated: new Date().toISOString(),
      files: {},
      tags: {},
    };

    const files = await glob('**/*.{md,ts,tsx,js,jsx}', {
      ignore: ['**/node_modules/**', '**/dist/**', '.git/**'],
    });

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const tags = this.extractTags(content);
      
      index.files[file] = {
        tags,
        size: fs.statSync(file).size,
        modified: fs.statSync(file).mtime,
      };

      // Build tag index
      for (const tag of tags) {
        if (!index.tags[tag]) {
          index.tags[tag] = [];
        }
        index.tags[tag].push(file);
      }
    }

    // Write index
    fs.writeFileSync(
      'docs/search-index.json',
      JSON.stringify(index, null, 2)
    );

    console.log(`${colors.green}✅ Generated search index with ${Object.keys(index.files).length} files${colors.reset}`);
  }

  extractTags(content) {
    const tags = new Set();
    
    // Extract from comments
    const tagPattern = /@tags?\s+([^\n]+)/gi;
    const matches = content.matchAll(tagPattern);
    for (const match of matches) {
      match[1].split(',').forEach(tag => tags.add(tag.trim().toLowerCase()));
    }

    // Auto-detect common patterns
    if (content.includes('stripe') || content.includes('payment')) tags.add('payment');
    if (content.includes('ollama') || content.includes('openai')) tags.add('ai');
    if (content.includes('swipe') || content.includes('tinder')) tags.add('swipe');
    if (content.includes('upload') || content.includes('file')) tags.add('files');
    if (content.includes('docker') || content.includes('deploy')) tags.add('deployment');

    return Array.from(tags);
  }
}

// Run validator
if (require.main === module) {
  const validator = new DocumentationValidator();
  
  const command = process.argv[2];
  
  if (command === 'index') {
    validator.generateIndex();
  } else {
    validator.validate().catch(console.error);
  }
}

module.exports = { DocumentationValidator };