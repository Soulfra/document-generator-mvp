#!/usr/bin/env node

/**
 * CONTEXT SCANNER AGENT
 * Bash through template layers, find duplicates, prepare for convergence
 * Scans all files, identifies redundancy, prepares unified system
 */

console.log(`
🔍 CONTEXT SCANNER AGENT ACTIVE 🔍
Bashing through templates • Finding duplicates • Preparing convergence
`);

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class ContextScannerAgent {
  constructor() {
    this.scannedFiles = new Map();
    this.duplicateGroups = new Map();
    this.characterContexts = new Map();
    this.functionDuplicates = new Map();
    this.conceptDuplicates = new Map();
    this.redundantSystems = new Map();
    
    this.initializeScanner();
  }

  initializeScanner() {
    console.log('🔍 Initializing context scanner...');
    
    this.scanPatterns = {
      // Character patterns
      ralph: /ralph|chaos|bash|break|crash|spam/gi,
      cal: /cal|simple|fetch|wake|interface/gi,
      arty: /arty|design|beautify|create|palette/gi,
      charlie: /charlie|security|protect|deploy|guard/gi,
      
      // System patterns  
      monitoring: /monitor|chaos.*stream|visual.*chaos|simple.*chaos/gi,
      deployment: /deploy|orchestrat|remote|runtime/gi,
      documentation: /docs|readme|ard|guide/gi,
      organization: /organize|package|tarball|manifest/gi,
      
      // Function patterns
      cli: /async cli\(\)|\.cli\(\)|process\.argv/gi,
      express: /express|app\.listen|app\.get/gi,
      websocket: /websocket|ws\.|socket/gi,
      filesystem: /writeFile|readFile|fs\./gi
    };

    console.log('🔍 Scanner patterns ready');
  }

  // Scan entire codebase for duplicates
  async scanCodebase() {
    console.log('🕵️ Scanning entire codebase...');
    
    const files = await this.getAllJSFiles();
    console.log(`📁 Found ${files.length} files to scan`);
    
    // Scan each file
    for (const file of files) {
      await this.scanFile(file);
    }
    
    // Analyze for duplicates
    await this.analyzeDuplicates();
    
    // Generate convergence report
    return await this.generateConvergenceReport();
  }

  async getAllJSFiles() {
    const files = [];
    
    async function scanDir(dir) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
          
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            await scanDir(fullPath);
          } else if (entry.name.endsWith('.js') || entry.name.endsWith('.md')) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Skip inaccessible directories
      }
    }
    
    await scanDir('.');
    return files;
  }

  async scanFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const fileName = path.basename(filePath);
      
      // Create file fingerprint
      const hash = crypto.createHash('md5').update(content).digest('hex');
      const lines = content.split('\n').length;
      const size = content.length;
      
      const fileData = {
        path: filePath,
        name: fileName,
        hash,
        lines,
        size,
        content,
        patterns: {},
        functions: this.extractFunctions(content),
        concepts: this.extractConcepts(content),
        characters: this.detectCharacters(content),
        systems: this.detectSystems(content)
      };

      // Scan for patterns
      Object.entries(this.scanPatterns).forEach(([pattern, regex]) => {
        const matches = content.match(regex);
        fileData.patterns[pattern] = matches ? matches.length : 0;
      });

      this.scannedFiles.set(filePath, fileData);
      
      console.log(`📄 Scanned: ${fileName} (${lines} lines, ${fileData.functions.length} functions)`);
      
    } catch (error) {
      console.log(`❌ Failed to scan ${filePath}: ${error.message}`);
    }
  }

  extractFunctions(content) {
    const functions = [];
    
    // Extract function declarations
    const functionRegex = /(?:async\s+)?(?:function\s+)?(\w+)\s*[=:]\s*(?:async\s+)?\([^)]*\)\s*(?:=>)?\s*{/g;
    let match;
    
    while ((match = functionRegex.exec(content)) !== null) {
      functions.push({
        name: match[1],
        signature: match[0],
        line: content.substring(0, match.index).split('\n').length
      });
    }

    // Extract CLI methods
    const cliRegex = /async\s+cli\(\s*\)\s*{/g;
    while ((match = cliRegex.exec(content)) !== null) {
      functions.push({
        name: 'cli',
        signature: match[0],
        line: content.substring(0, match.index).split('\n').length,
        type: 'cli'
      });
    }

    return functions;
  }

  extractConcepts(content) {
    const concepts = [];
    
    // Extract major concepts/classes
    const conceptPatterns = {
      'chaos-monitoring': /chaos.*monitor|monitor.*chaos|visual.*chaos/gi,
      'character-system': /character.*system|flag.*system|unified.*flag/gi,
      'deployment': /deploy|orchestrat|runtime/gi,
      'documentation': /organize.*docs|docs.*package|ard/gi,
      'external-integration': /webhook|discord|telegram|obs/gi
    };

    Object.entries(conceptPatterns).forEach(([concept, regex]) => {
      const matches = content.match(regex);
      if (matches && matches.length > 2) { // Significant presence
        concepts.push({
          concept,
          occurrences: matches.length,
          confidence: Math.min(matches.length / 10, 1)
        });
      }
    });

    return concepts;
  }

  detectCharacters(content) {
    const characters = [];
    
    Object.entries(this.scanPatterns).forEach(([char, regex]) => {
      if (['ralph', 'cal', 'arty', 'charlie'].includes(char)) {
        const matches = content.match(regex);
        if (matches && matches.length > 0) {
          characters.push({
            character: char,
            mentions: matches.length,
            primary: matches.length > 5
          });
        }
      }
    });

    return characters;
  }

  detectSystems(content) {
    const systems = [];
    
    const systemPatterns = {
      'monitoring-heavy': /visual.*chaos.*stream|complex.*monitor/gi,
      'monitoring-light': /simple.*chaos.*monitor|lightweight.*monitor/gi,
      'flag-system': /unified.*flag|character.*flag/gi,
      'deployment-system': /remote.*runtime|orchestrat/gi,
      'organization-system': /organize.*docs|package.*system/gi
    };

    Object.entries(systemPatterns).forEach(([system, regex]) => {
      const matches = content.match(regex);
      if (matches && matches.length > 0) {
        systems.push({
          system,
          strength: matches.length,
          primary: matches.length > 3
        });
      }
    });

    return systems;
  }

  async analyzeDuplicates() {
    console.log('🔍 Analyzing duplicates and redundancy...');
    
    // Group files by similarity
    await this.groupSimilarFiles();
    
    // Find function duplicates
    await this.findFunctionDuplicates();
    
    // Find concept overlaps
    await this.findConceptOverlaps();
    
    // Identify redundant systems
    await this.identifyRedundantSystems();
  }

  async groupSimilarFiles() {
    const files = Array.from(this.scannedFiles.values());
    
    // Group by similar patterns
    for (let i = 0; i < files.length; i++) {
      for (let j = i + 1; j < files.length; j++) {
        const file1 = files[i];
        const file2 = files[j];
        
        const similarity = this.calculateSimilarity(file1, file2);
        
        if (similarity > 0.7) { // High similarity
          const groupId = `similar-${i}-${j}`;
          this.duplicateGroups.set(groupId, {
            type: 'similar-files',
            files: [file1.path, file2.path],
            similarity,
            reason: this.getSimilarityReason(file1, file2)
          });
        }
      }
    }
  }

  calculateSimilarity(file1, file2) {
    let score = 0;
    let factors = 0;
    
    // Pattern similarity
    Object.keys(this.scanPatterns).forEach(pattern => {
      const count1 = file1.patterns[pattern] || 0;
      const count2 = file2.patterns[pattern] || 0;
      
      if (count1 > 0 && count2 > 0) {
        score += Math.min(count1, count2) / Math.max(count1, count2);
        factors++;
      }
    });
    
    // Function similarity
    const commonFunctions = file1.functions.filter(f1 => 
      file2.functions.some(f2 => f1.name === f2.name)
    );
    
    if (commonFunctions.length > 0) {
      score += commonFunctions.length / Math.max(file1.functions.length, file2.functions.length);
      factors++;
    }
    
    return factors > 0 ? score / factors : 0;
  }

  getSimilarityReason(file1, file2) {
    const reasons = [];
    
    // Check pattern overlaps
    Object.entries(this.scanPatterns).forEach(([pattern, regex]) => {
      const count1 = file1.patterns[pattern] || 0;
      const count2 = file2.patterns[pattern] || 0;
      
      if (count1 > 3 && count2 > 3) {
        reasons.push(`Both implement ${pattern} heavily`);
      }
    });

    // Check function overlaps
    const commonFunctions = file1.functions.filter(f1 => 
      file2.functions.some(f2 => f1.name === f2.name)
    );
    
    if (commonFunctions.length > 2) {
      reasons.push(`Share ${commonFunctions.length} common functions`);
    }

    return reasons.join(', ') || 'Similar structure and patterns';
  }

  async findFunctionDuplicates() {
    const allFunctions = new Map();
    
    // Collect all functions
    this.scannedFiles.forEach((file, filePath) => {
      file.functions.forEach(func => {
        if (!allFunctions.has(func.name)) {
          allFunctions.set(func.name, []);
        }
        allFunctions.get(func.name).push({
          ...func,
          file: filePath,
          fileName: file.name
        });
      });
    });

    // Find duplicates
    allFunctions.forEach((functions, funcName) => {
      if (functions.length > 1) {
        this.functionDuplicates.set(funcName, {
          name: funcName,
          occurrences: functions.length,
          files: functions.map(f => f.fileName),
          canMerge: this.canMergeFunctions(functions)
        });
      }
    });
  }

  canMergeFunctions(functions) {
    // CLI functions are usually mergeable
    if (functions[0].name === 'cli') return true;
    
    // Constructor functions might be mergeable
    if (functions[0].name === 'constructor') return true;
    
    // Similar signatures suggest mergeability
    const signatures = functions.map(f => f.signature);
    const uniqueSignatures = [...new Set(signatures)];
    
    return uniqueSignatures.length === 1;
  }

  async findConceptOverlaps() {
    const conceptMap = new Map();
    
    // Collect all concepts
    this.scannedFiles.forEach((file, filePath) => {
      file.concepts.forEach(concept => {
        if (!conceptMap.has(concept.concept)) {
          conceptMap.set(concept.concept, []);
        }
        conceptMap.get(concept.concept).push({
          ...concept,
          file: filePath,
          fileName: file.name
        });
      });
    });

    // Find overlapping concepts
    conceptMap.forEach((instances, conceptName) => {
      if (instances.length > 1) {
        this.conceptDuplicates.set(conceptName, {
          concept: conceptName,
          implementations: instances.length,
          files: instances.map(i => i.fileName),
          totalStrength: instances.reduce((sum, i) => sum + i.occurrences, 0),
          canUnify: instances.length < 4 // Too many might be intentional
        });
      }
    });
  }

  async identifyRedundantSystems() {
    // Systems that do similar things
    const systemGroups = {
      'monitoring': ['monitoring-heavy', 'monitoring-light'],
      'character-interfaces': ['flag-system', 'character-system'],
      'deployment': ['deployment-system', 'organization-system']
    };

    Object.entries(systemGroups).forEach(([category, systems]) => {
      const implementingFiles = [];
      
      systems.forEach(system => {
        this.scannedFiles.forEach((file, filePath) => {
          const hasSystem = file.systems.some(s => s.system === system && s.primary);
          if (hasSystem) {
            implementingFiles.push({
              file: filePath,
              fileName: file.name,
              system
            });
          }
        });
      });

      if (implementingFiles.length > 1) {
        this.redundantSystems.set(category, {
          category,
          systems,
          implementations: implementingFiles,
          redundancy: implementingFiles.length - 1,
          canMerge: implementingFiles.length <= 3
        });
      }
    });
  }

  async generateConvergenceReport() {
    console.log('📊 Generating convergence report...');
    
    const report = {
      scan_summary: {
        files_scanned: this.scannedFiles.size,
        duplicate_groups: this.duplicateGroups.size,
        function_duplicates: this.functionDuplicates.size,
        concept_overlaps: this.conceptDuplicates.size,
        redundant_systems: this.redundantSystems.size
      },
      
      convergence_opportunities: {
        high_priority: [],
        medium_priority: [],
        low_priority: []
      },
      
      mirror_side_candidates: {
        chaos_side: [], // Complex/heavy systems
        simple_side: [] // Light/optimized systems
      },
      
      character_context_mix: this.generateCharacterMix(),
      deduplication_plan: this.generateDeduplicationPlan()
    };

    // Prioritize convergence opportunities
    this.prioritizeConvergenceOpportunities(report);
    
    // Identify mirror sides
    this.identifyMirrorSides(report);
    
    return report;
  }

  prioritizeConvergenceOpportunities(report) {
    // High priority: Redundant systems
    this.redundantSystems.forEach((redundancy, category) => {
      if (redundancy.canMerge) {
        report.convergence_opportunities.high_priority.push({
          type: 'redundant_system',
          category,
          files: redundancy.implementations.map(i => i.fileName),
          action: 'merge_into_unified_system'
        });
      }
    });

    // Medium priority: Function duplicates
    this.functionDuplicates.forEach((duplicate, funcName) => {
      if (duplicate.canMerge) {
        report.convergence_opportunities.medium_priority.push({
          type: 'function_duplicate',
          function: funcName,
          files: duplicate.files,
          action: 'extract_to_shared_module'
        });
      }
    });

    // Low priority: Similar files
    this.duplicateGroups.forEach((group, groupId) => {
      report.convergence_opportunities.low_priority.push({
        type: 'similar_files',
        files: group.files.map(f => path.basename(f)),
        similarity: group.similarity,
        action: 'consider_refactoring'
      });
    });
  }

  identifyMirrorSides(report) {
    this.scannedFiles.forEach((file, filePath) => {
      const fileName = file.name;
      
      // Chaos side: Heavy, complex, real-time systems
      if (fileName.includes('visual-chaos') || 
          fileName.includes('orchestrator') ||
          fileName.includes('full') ||
          file.patterns.websocket > 0) {
        report.mirror_side_candidates.chaos_side.push({
          file: fileName,
          reason: 'complex_realtime_system',
          characters: file.characters.filter(c => c.primary).map(c => c.character)
        });
      }
      
      // Simple side: Light, optimized, external-integration systems
      if (fileName.includes('simple-chaos') ||
          fileName.includes('unified-flag') ||
          fileName.includes('light') ||
          file.patterns.deployment > 3) {
        report.mirror_side_candidates.simple_side.push({
          file: fileName,
          reason: 'lightweight_optimized_system',
          characters: file.characters.filter(c => c.primary).map(c => c.character)
        });
      }
    });
  }

  generateCharacterMix() {
    const characterMix = {
      ralph: { contexts: [], primary_files: [] },
      cal: { contexts: [], primary_files: [] },
      arty: { contexts: [], primary_files: [] },
      charlie: { contexts: [], primary_files: [] }
    };

    this.scannedFiles.forEach((file, filePath) => {
      file.characters.forEach(char => {
        if (char.primary) {
          characterMix[char.character].primary_files.push(file.name);
          characterMix[char.character].contexts.push({
            file: file.name,
            strength: char.mentions,
            systems: file.systems.filter(s => s.primary).map(s => s.system)
          });
        }
      });
    });

    return characterMix;
  }

  generateDeduplicationPlan() {
    return {
      phase_1: 'Merge redundant monitoring systems into dual-mode system',
      phase_2: 'Extract common functions to shared utility modules',
      phase_3: 'Unify character contexts while preserving unique behaviors',
      phase_4: 'Deploy mirror sides with deduplication',
      target: 'Reduce from 20+ files to 5-7 core files with mirror deployment'
    };
  }

  // CLI interface
  async cli() {
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
      case 'scan':
        console.log('\n🔍 CONTEXT SCANNER - BASHING THROUGH TEMPLATES 🔍\n');
        const report = await this.scanCodebase();
        
        console.log('\n📊 SCAN RESULTS:');
        console.log(`Files scanned: ${report.scan_summary.files_scanned}`);
        console.log(`Duplicate groups: ${report.scan_summary.duplicate_groups}`);
        console.log(`Function duplicates: ${report.scan_summary.function_duplicates}`);
        console.log(`Concept overlaps: ${report.scan_summary.concept_overlaps}`);
        console.log(`Redundant systems: ${report.scan_summary.redundant_systems}`);
        
        // Save full report
        await fs.writeFile('convergence-report.json', JSON.stringify(report, null, 2));
        console.log('\n📄 Full report saved: convergence-report.json');
        
        // Show high priority opportunities
        console.log('\n🎯 HIGH PRIORITY CONVERGENCE OPPORTUNITIES:');
        report.convergence_opportunities.high_priority.forEach(opp => {
          console.log(`  ${opp.type}: ${opp.category || opp.function}`);
          console.log(`    Files: ${opp.files.join(', ')}`);
          console.log(`    Action: ${opp.action}`);
        });
        
        break;

      case 'report':
        try {
          const reportData = await fs.readFile('convergence-report.json', 'utf-8');
          const report = JSON.parse(reportData);
          
          console.log('\n📊 CONVERGENCE REPORT SUMMARY\n');
          
          console.log('🎯 MIRROR SIDE CANDIDATES:');
          console.log('Chaos Side (Complex):');
          report.mirror_side_candidates.chaos_side.forEach(file => {
            console.log(`  ${file.file} - ${file.reason}`);
          });
          console.log('Simple Side (Optimized):');
          report.mirror_side_candidates.simple_side.forEach(file => {
            console.log(`  ${file.file} - ${file.reason}`);
          });
          
          console.log('\n🧬 CHARACTER CONTEXT MIX:');
          Object.entries(report.character_context_mix).forEach(([char, data]) => {
            if (data.primary_files.length > 0) {
              console.log(`${char}: ${data.primary_files.join(', ')}`);
            }
          });
          
        } catch (error) {
          console.log('❌ No convergence report found. Run: npm run context-scan scan');
        }
        break;

      default:
        console.log(`
🔍 Context Scanner Agent - Bash Through Templates

Commands:
  node context-scanner-agent.js scan      # Scan entire codebase for duplicates
  node context-scanner-agent.js report    # Show convergence report

🎯 Purpose:
  Bash through all the template layers we've built
  Find duplicates, redundancy, and convergence opportunities
  Prepare for unified mirror deployment to Soulfra

🧬 What it finds:
  - Duplicate functions across files
  - Redundant system implementations  
  - Character context overlaps
  - Similar file patterns
  - Mirror side candidates (chaos vs simple)

📊 Output:
  convergence-report.json - Complete analysis for next phase

Ready to bash through templates and converge! 💥
        `);
    }
  }
}

// Export for use as module
module.exports = ContextScannerAgent;

// Run CLI if called directly
if (require.main === module) {
  const scanner = new ContextScannerAgent();
  scanner.cli().catch(console.error);
}