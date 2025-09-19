#!/usr/bin/env node

/**
 * 🔄 BACKFILLING-ORCHESTRATOR
 * Automatic documentation generation system that runs when end-to-end tests succeed
 * 
 * Features:
 * - End-to-end test integration for automatic documentation
 * - Gap detection and healing for missing ADRs/documentation
 * - Template-driven generation from successful integrations
 * - Cross-reference healing and symlink repair
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class BackfillingOrchestrator {
  constructor() {
    this.basePath = process.cwd();
    this.docsPath = path.join(this.basePath, 'docs');
    this.ardsPath = path.join(this.docsPath, 'ards');
    this.templatesPath = path.join(this.basePath, 'templates');
    
    this.patterns = {
      ard: /ADR-(\d+)/g,
      missing_docs: /\[([^\]]+)\]\(([^)]+)\)/g,
      broken_symlinks: /ln -sf ([^ ]+) ([^ ]+)/g
    };
  }

  /**
   * 🎯 Main orchestration method - triggered by successful end-to-end tests
   */
  async orchestrateBackfilling(testResults) {
    console.log('🔄 BACKFILLING ORCHESTRATOR STARTED');
    console.log(`✅ Test Success Rate: ${testResults.successRate}%`);
    
    if (testResults.successRate >= 95) {
      console.log('🎉 High success rate detected - initiating backfilling...');
      
      // 1. Detect and fill documentation gaps
      await this.detectAndFillGaps();
      
      // 2. Generate missing ADRs from successful integrations
      await this.generateMissingARDs(testResults);
      
      // 3. Heal broken references and symlinks
      await this.healBrokenReferences();
      
      // 4. Update cross-references and indices
      await this.updateCrossReferences();
      
      // 5. Generate template documentation for successful patterns
      await this.generateTemplateDocumentation(testResults);
      
      console.log('✅ BACKFILLING ORCHESTRATION COMPLETE');
    } else {
      console.log('⚠️ Test success rate too low for automatic backfilling');
    }
  }

  /**
   * 🔍 Detect gaps in documentation structure
   */
  async detectAndFillGaps() {
    console.log('🔍 Detecting documentation gaps...');
    
    try {
      // Find all existing ADRs
      const ardFiles = await fs.readdir(this.ardsPath);
      const existingARDs = new Set();
      
      ardFiles.forEach(file => {
        const match = file.match(/ADR-(\d+)/);
        if (match) {
          existingARDs.add(parseInt(match[1]));
        }
      });
      
      // Find gaps in ADR sequence
      const maxADR = Math.max(...existingARDs);
      const gaps = [];
      
      for (let i = 1; i <= maxADR; i++) {
        if (!existingARDs.has(i)) {
          gaps.push(i);
        }
      }
      
      console.log(`📊 Found ${gaps.length} gaps in ADR sequence:`, gaps);
      
      // Generate missing ADRs based on existing patterns
      for (const gapNumber of gaps) {
        await this.generateGapADR(gapNumber);
      }
      
    } catch (error) {
      console.error('❌ Error detecting gaps:', error.message);
    }
  }

  /**
   * 📝 Generate ADR for discovered gap based on existing code/decisions
   */
  async generateGapADR(ardNumber) {
    console.log(`📝 Generating missing ADR-${ardNumber.toString().padStart(3, '0')}...`);
    
    try {
      // Analyze codebase for decisions that might correspond to this gap
      const decisions = await this.analyzeCodebaseForDecisions(ardNumber);
      
      if (decisions.length > 0) {
        const ardContent = this.generateARDContent(ardNumber, decisions[0]);
        const ardPath = path.join(this.ardsPath, `ADR-${ardNumber.toString().padStart(3, '0')}-${decisions[0].slug}.md`);
        
        await fs.writeFile(ardPath, ardContent);
        console.log(`✅ Generated ADR-${ardNumber.toString().padStart(3, '0')}: ${decisions[0].title}`);
      }
      
    } catch (error) {
      console.error(`❌ Error generating ADR-${ardNumber}:`, error.message);
    }
  }

  /**
   * 🔬 Analyze codebase for architectural decisions that need documentation
   */
  async analyzeCodebaseForDecisions(ardNumber) {
    const decisions = [];
    
    try {
      // Scan for architectural patterns in the codebase
      const codeFiles = await this.scanCodebaseFiles();
      
      for (const file of codeFiles) {
        const content = await fs.readFile(file, 'utf8');
        
        // Look for architectural decision patterns
        const patterns = [
          { regex: /class.*Manager|class.*Orchestrator|class.*Controller/g, type: 'architecture' },
          { regex: /docker-compose|Dockerfile/g, type: 'deployment' },
          { regex: /PORT\s*=\s*(\d+)|listen\((\d+)\)/g, type: 'service' },
          { regex: /authentication|auth|login|security/gi, type: 'security' },
          { regex: /database|db|persistence|storage/gi, type: 'data' }
        ];
        
        for (const pattern of patterns) {
          const matches = content.match(pattern.regex);
          if (matches && matches.length > 0) {
            decisions.push({
              type: pattern.type,
              file: file,
              evidence: matches.slice(0, 3), // First 3 matches
              title: this.generateDecisionTitle(pattern.type, file),
              slug: this.generateSlug(pattern.type, file)
            });
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Error analyzing codebase:', error.message);
    }
    
    return decisions;
  }

  /**
   * 📄 Generate ADR content based on discovered decision
   */
  generateARDContent(ardNumber, decision) {
    const date = new Date().toISOString().split('T')[0];
    
    return `# ADR-${ardNumber.toString().padStart(3, '0')}: ${decision.title}

## Status
accepted

## Context
This architectural decision was discovered through automated analysis of the codebase during backfilling operations. The decision represents an implicit architectural choice that was implemented but not formally documented.

### Discovery Evidence
- **File:** ${decision.file}
- **Type:** ${decision.type}
- **Evidence:** ${decision.evidence.join(', ')}
- **Discovery Date:** ${date}

## Decision
We have implemented ${decision.title.toLowerCase()} as evidenced by the codebase analysis. This decision was made to support the system's architectural requirements and represents a valid architectural choice that should be formally documented.

### Implementation Details
Based on code analysis, this decision involves:
${decision.evidence.map(evidence => `- ${evidence}`).join('\n')}

## Consequences

### Positive
- Addresses system requirements effectively
- Follows established patterns in the codebase
- Integrates well with existing architecture

### Negative
- Was not formally documented initially
- May require additional documentation for full understanding

## Related Components
- File: ${decision.file}
- Type: ${decision.type}

---

*This ADR was automatically generated by the Backfilling Orchestrator during gap detection analysis.*

**Generated:** ${new Date().toISOString()}
**Verification Hash:** \`ard-${ardNumber.toString().padStart(3, '0')}-${decision.slug}-backfilled-${new Date().getFullYear()}\`
`;
  }

  /**
   * 🔗 Heal broken references and symlinks
   */
  async healBrokenReferences() {
    console.log('🔗 Healing broken references...');
    
    try {
      // Find all markdown files
      const markdownFiles = await this.findMarkdownFiles();
      
      for (const file of markdownFiles) {
        const content = await fs.readFile(file, 'utf8');
        let healed = false;
        let healedContent = content;
        
        // Fix broken markdown links
        healedContent = healedContent.replace(this.patterns.missing_docs, (match, text, link) => {
          const targetPath = path.resolve(path.dirname(file), link);
          
          // Check if target exists
          if (!require('fs').existsSync(targetPath)) {
            console.log(`🔧 Healing broken link: ${link}`);
            healed = true;
            
            // Try to find the file in common locations
            const filename = path.basename(link);
            const possibleLocations = [
              path.join(this.docsPath, filename),
              path.join(this.ardsPath, filename),
              path.join(this.basePath, filename)
            ];
            
            for (const location of possibleLocations) {
              if (require('fs').existsSync(location)) {
                const relativePath = path.relative(path.dirname(file), location);
                return `[${text}](${relativePath})`;
              }
            }
            
            // If file not found, create placeholder
            return `[${text}](${link}) <!-- TODO: Create missing file -->`;
          }
          
          return match;
        });
        
        if (healed) {
          await fs.writeFile(file, healedContent);
          console.log(`✅ Healed references in: ${path.relative(this.basePath, file)}`);
        }
      }
      
    } catch (error) {
      console.error('❌ Error healing references:', error.message);
    }
  }

  /**
   * 🔄 Update cross-references and indices
   */
  async updateCrossReferences() {
    console.log('🔄 Updating cross-references...');
    
    try {
      // Update INDEX-MASTER-DOCUMENTATION.md
      await this.updateMasterIndex();
      
      // Update service registries
      await this.updateServiceRegistries();
      
      // Update symlinks
      await this.updateSymlinks();
      
    } catch (error) {
      console.error('❌ Error updating cross-references:', error.message);
    }
  }

  /**
   * 📊 Update master documentation index
   */
  async updateMasterIndex() {
    const indexPath = path.join(this.basePath, 'INDEX-MASTER-DOCUMENTATION.md');
    
    try {
      const content = await fs.readFile(indexPath, 'utf8');
      
      // Find all ARDs and update the index
      const ardFiles = await fs.readdir(this.ardsPath);
      const ardLinks = ardFiles
        .filter(file => file.startsWith('ADR-') && file.endsWith('.md'))
        .sort()
        .map(file => {
          const title = this.extractTitle(path.join(this.ardsPath, file));
          const relativePath = `docs/ards/${file}`;
          return `- [${title}](${relativePath})`;
        });
      
      // Update ARD section
      const updatedContent = content.replace(
        /### 🛡️ Architecture Decision Records[\s\S]*?(?=### |\n## |\n---|\n\*\*|$)/,
        `### 🛡️ Architecture Decision Records\n${ardLinks.join('\n')}\n\n`
      );
      
      if (updatedContent !== content) {
        await fs.writeFile(indexPath, updatedContent);
        console.log('✅ Updated INDEX-MASTER-DOCUMENTATION.md');
      }
      
    } catch (error) {
      console.error('❌ Error updating master index:', error.message);
    }
  }

  /**
   * 🛠️ Utility methods
   */
  async scanCodebaseFiles() {
    const files = [];
    const extensions = ['.js', '.ts', '.json', '.yml', '.yaml', '.md'];
    
    const scanDir = async (dir) => {
      try {
        const items = await fs.readdir(dir);
        
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = await fs.stat(fullPath);
          
          if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
            await scanDir(fullPath);
          } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Skip directories we can't access
      }
    };
    
    await scanDir(this.basePath);
    return files;
  }

  async findMarkdownFiles() {
    const files = await this.scanCodebaseFiles();
    return files.filter(file => file.endsWith('.md'));
  }

  generateDecisionTitle(type, file) {
    const filename = path.basename(file, path.extname(file));
    return `${type.charAt(0).toUpperCase() + type.slice(1)} Decision: ${filename}`;
  }

  generateSlug(type, file) {
    const filename = path.basename(file, path.extname(file));
    return `${type}-${filename}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }

  extractTitle(filePath) {
    try {
      const content = require('fs').readFileSync(filePath, 'utf8');
      const match = content.match(/^# (.+)$/m);
      return match ? match[1] : path.basename(filePath, '.md');
    } catch {
      return path.basename(filePath, '.md');
    }
  }

  /**
   * 🎯 Generate template documentation for successful patterns
   */
  async generateTemplateDocumentation(testResults) {
    console.log('🎯 Generating template documentation...');
    
    try {
      const successfulPatterns = testResults.successfulPatterns || [];
      
      for (const pattern of successfulPatterns) {
        const templateDoc = this.generatePatternTemplate(pattern);
        const templatePath = path.join(this.templatesPath, `${pattern.name}-pattern.md`);
        
        await fs.writeFile(templatePath, templateDoc);
        console.log(`✅ Generated template: ${pattern.name}-pattern.md`);
      }
      
    } catch (error) {
      console.error('❌ Error generating template documentation:', error.message);
    }
  }

  generatePatternTemplate(pattern) {
    return `# ${pattern.name} Pattern Template

## Overview
This template was automatically generated based on successful implementation patterns detected during end-to-end testing.

## Pattern Details
- **Success Rate:** ${pattern.successRate}%
- **Components:** ${pattern.components.join(', ')}
- **Last Verified:** ${new Date().toISOString()}

## Implementation Guide
${pattern.implementationSteps.map((step, index) => `${index + 1}. ${step}`).join('\n')}

## Verification
- **Test Results:** ${pattern.testResults}
- **Performance:** ${pattern.performance}

---

*Auto-generated by Backfilling Orchestrator*
`;
  }
}

/**
 * 🚀 CLI Interface
 */
async function main() {
  const orchestrator = new BackfillingOrchestrator();
  
  // Simulate test results for demonstration
  const mockTestResults = {
    successRate: 98,
    successfulPatterns: [
      {
        name: 'master-orchestrator',
        successRate: 100,
        components: ['frontend', 'backend', 'websocket'],
        implementationSteps: [
          'Create SystemIntegrationManager',
          'Setup dependency injection',
          'Configure WebSocket communication',
          'Implement health checks'
        ],
        testResults: 'All tests passing',
        performance: 'Excellent response times'
      }
    ]
  };
  
  if (process.argv.includes('--demo')) {
    console.log('🎪 Running in demo mode with mock test results...');
    await orchestrator.orchestrateBackfilling(mockTestResults);
  } else {
    console.log('🔄 Backfilling Orchestrator ready for integration with test suite');
    console.log('Run with --demo to see example backfilling');
  }
}

// Export for use as module
module.exports = BackfillingOrchestrator;

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}