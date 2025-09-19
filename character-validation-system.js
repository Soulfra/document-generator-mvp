#!/usr/bin/env node

/**
 * 🏭 CHARACTER VALIDATION SYSTEM
 * Manufacturing-grade validation for blockchain character documentation
 * Ensures all characters follow identical structure like "perfect gold bars"
 */

const fs = require('fs').promises;
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const crypto = require('crypto');

class CharacterValidationSystem {
  constructor() {
    // Initialize JSON Schema validator
    this.ajv = new Ajv({ 
      allErrors: true,
      verbose: true,
      strict: false
    });
    addFormats(this.ajv);
    
    // Character files to validate
    this.characterFiles = [
      'WALLETMIRRORBROADCAST-CHARACTER-SHEET.md',
      'DEEPTIERSYSTEM-CHARACTER-SHEET.md', 
      'BLAMECHAIN-CHARACTER-SHEET.md',
      'CRYPTOEXCHANGEBRIDGE-CHARACTER-SHEET.md',
      'AGENTBLOCKCHAINECONOMY-CHARACTER-SHEET.md'
    ];
    
    // Schema file
    this.schemaPath = './schemas/blockchain-character.schema.json';
    
    // Validation results
    this.validationResults = {
      totalCharacters: 0,
      validCharacters: 0,
      invalidCharacters: 0,
      validationErrors: [],
      structureConsistency: new Map(),
      missingElements: [],
      qualityMetrics: {}
    };
    
    console.log('🏭 CHARACTER VALIDATION SYSTEM INITIALIZED');
    console.log('📏 Manufacturing-grade quality control for blockchain fighters');
  }
  
  /**
   * Load and compile the character schema
   */
  async loadSchema() {
    try {
      const schemaContent = await fs.readFile(this.schemaPath, 'utf8');
      this.schema = JSON.parse(schemaContent);
      this.validate = this.ajv.compile(this.schema);
      
      console.log(`✅ Schema loaded: ${this.schema.title} v${this.schema.version}`);
    } catch (error) {
      throw new Error(`Failed to load schema: ${error.message}`);
    }
  }
  
  /**
   * Parse Markdown character sheet into structured data
   */
  parseCharacterSheet(markdownContent, filename) {
    const character = {
      metadata: {
        characterId: filename.toLowerCase().replace(/-character-sheet\.md$/, ''),
        version: '1.0.0',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        schemaVersion: '1.0.0'
      },
      profile: {},
      stats: { baseStats: {}, specialAttributes: [] },
      moves: { basicMoves: [], combos: [], ultimate: {} },
      integrations: { systemMatchups: {}, characterSettings: { personality: {}, constraints: {} } },
      security: { encryption: {}, proofGeneration: {}, verification: { methods: [] } },
      performance: { coreMetrics: {}, benchmarks: {} },
      strategies: {},
      weaknesses: { vulnerabilities: [], combatMatchups: {} },
      configuration: { deployment: {}, integration: {} },
      techniques: { techniques: [] },
      achievements: { achievements: [], unlocks: [] }
    };
    
    try {
      // Parse fighter profile
      const profileMatch = markdownContent.match(/\*\*Fighter Name\*\*: (.+)\n\*\*Fighting Style\*\*: \*\*(.+)\*\*\n\*\*Element\*\*: \*\*(.+)\*\*\n\*\*Signature Move\*\*: \*\*(.+)\*\*\n\*\*Ultimate\*\*: \*\*(.+)\*\*/);
      if (profileMatch) {
        character.profile = {
          name: profileMatch[1],
          fightingStyle: profileMatch[2],
          element: profileMatch[3],
          signatureMove: profileMatch[4],
          ultimate: profileMatch[5]
        };
      }
      
      // Parse base stats (look for stat bars like ████████░░ 85/100)
      const statsSection = markdownContent.match(/### Base Stats\n```\n([\s\S]*?)\n```/);
      if (statsSection) {
        const statLines = statsSection[1].split('\n');
        statLines.forEach(line => {
          const statMatch = line.match(/^([A-Z_\\s]+):\\s+.*?(\d+)\/100/);
          if (statMatch) {
            const statName = statMatch[1].trim().replace(/\\s/g, '_');
            character.stats.baseStats[statName] = parseInt(statMatch[2]);
          }
        });
      }
      
      // Parse special attributes
      const attributesMatch = markdownContent.match(/### Special Attributes\n([\s\S]*?)(?=\n## )/);
      if (attributesMatch) {
        const attributes = attributesMatch[1].match(/- \*\*(.+?)\*\*: (.+)/g);
        if (attributes) {
          character.stats.specialAttributes = attributes.map(attr => {
            const match = attr.match(/- \*\*(.+?)\*\*: (.+)/);
            return {
              name: match[1],
              description: match[2]
            };
          });
        }
      }
      
      // Parse integration matchups  
      const integrationSections = markdownContent.match(/### vs ([A-Za-z]+)\n([\s\S]*?)(?=\n### |$)/g);
      if (integrationSections) {
        integrationSections.forEach(section => {
          const systemMatch = section.match(/### vs ([A-Za-z]+)/);
          const synergyMatch = section.match(/- \*\*Synergy\*\*: (.+)/);
          const comboMatch = section.match(/- \*\*Combo\*\*: (.+)/);
          const strategyMatch = section.match(/- \*\*Strategy\*\*: (.+)/);
          
          if (systemMatch && synergyMatch) {
            character.integrations.systemMatchups[`vs${systemMatch[1]}`] = {
              synergy: synergyMatch[1],
              combo: comboMatch ? comboMatch[1] : '',
              strategy: strategyMatch ? strategyMatch[1] : ''
            };
          }
        });
      }
      
      // Parse security framework
      const securityMatch = markdownContent.match(/### Encryption Compatibility\n([\s\S]*?)(?=\n### |$)/);
      if (securityMatch) {
        character.security.encryption = {
          primaryHash: securityMatch[1].includes('SHA256') ? 'SHA256' : 'unknown',
          signatures: securityMatch[1].includes('ECDSA') ? 'ECDSA' : 'RSA-SHA256',
          keyManagement: 'character-based access control',
          tamperDetection: 'merkle proof validation'
        };
      }
      
      // Parse performance metrics
      const performanceMatch = markdownContent.match(/### (.+ Performance)\n([\s\S]*?)(?=\n### |$)/g);
      if (performanceMatch) {
        performanceMatch.forEach(section => {
          const lines = section.split('\n');
          lines.forEach(line => {
            const metricMatch = line.match(/- \*\*(.+?)\*\*: (.+)/);
            if (metricMatch) {
              const metricName = metricMatch[1].toLowerCase().replace(/\s/g, '');
              character.performance.coreMetrics[metricName] = metricMatch[2];
            }
          });
        });
      }
      
      // Parse achievements
      const achievementsMatch = markdownContent.match(/### (.+ Achievements)\n([\s\S]*?)(?=\n### |$)/);
      if (achievementsMatch) {
        const achievements = achievementsMatch[1].match(/- \*\*(.+?)\*\*: (.+)/g);
        if (achievements) {
          character.achievements.achievements = achievements.map(achievement => {
            const match = achievement.match(/- \*\*(.+?)\*\*: (.+)/);
            return {
              name: match[1],
              description: match[2]
            };
          });
        }
      }
      
    } catch (error) {
      console.warn(`⚠️  Parsing warning for ${filename}: ${error.message}`);
    }
    
    return character;
  }
  
  /**
   * Validate a single character against the schema
   */
  validateCharacter(character, filename) {
    const valid = this.validate(character);
    const result = {
      filename,
      valid,
      errors: this.validate.errors || [],
      completeness: this.calculateCompleteness(character),
      qualityScore: this.calculateQualityScore(character),
      hash: this.generateCharacterHash(character)
    };
    
    if (!valid) {
      console.log(`❌ ${filename}: INVALID`);
      result.errors.forEach(error => {
        console.log(`   • ${error.instancePath}: ${error.message}`);
      });
    } else {
      console.log(`✅ ${filename}: VALID (${result.qualityScore}% quality)`);
    }
    
    return result;
  }
  
  /**
   * Calculate completeness percentage
   */
  calculateCompleteness(character) {
    const requiredFields = [
      'metadata', 'profile', 'stats', 'moves', 'integrations', 
      'security', 'performance', 'strategies', 'weaknesses', 
      'configuration', 'techniques', 'achievements'
    ];
    
    let completed = 0;
    let total = requiredFields.length;
    
    requiredFields.forEach(field => {
      if (character[field] && Object.keys(character[field]).length > 0) {
        completed++;
      }
    });
    
    return Math.round((completed / total) * 100);
  }
  
  /**
   * Calculate overall quality score
   */
  calculateQualityScore(character) {
    let score = 0;
    const maxScore = 100;
    
    // Profile completeness (20 points)
    if (character.profile && character.profile.name && character.profile.fightingStyle) {
      score += 20;
    }
    
    // Stats completeness (20 points)
    const statsCount = Object.keys(character.stats.baseStats || {}).length;
    score += Math.min(20, (statsCount / 6) * 20);
    
    // Integration points (20 points) 
    const integrationCount = Object.keys(character.integrations.systemMatchups || {}).length;
    score += Math.min(20, (integrationCount / 4) * 20);
    
    // Security framework (20 points)
    if (character.security && character.security.encryption && character.security.encryption.primaryHash) {
      score += 20;
    }
    
    // Performance metrics (10 points)
    const performanceCount = Object.keys(character.performance.coreMetrics || {}).length;
    score += Math.min(10, (performanceCount / 3) * 10);
    
    // Achievements (10 points)
    const achievementCount = (character.achievements.achievements || []).length;
    score += Math.min(10, (achievementCount / 5) * 10);
    
    return Math.round(score);
  }
  
  /**
   * Generate unique hash for character structure
   */
  generateCharacterHash(character) {
    const structure = {
      profile: Object.keys(character.profile || {}),
      stats: Object.keys(character.stats.baseStats || {}),
      integrations: Object.keys(character.integrations.systemMatchups || {}),
      security: Object.keys(character.security.encryption || {}),
      performance: Object.keys(character.performance.coreMetrics || {}),
      achievements: (character.achievements.achievements || []).length
    };
    
    return crypto.createHash('sha256')
      .update(JSON.stringify(structure))
      .digest('hex')
      .substring(0, 8);
  }
  
  /**
   * Analyze structural consistency across all characters
   */
  analyzeStructuralConsistency(results) {
    const structures = results.map(r => r.hash);
    const uniqueStructures = [...new Set(structures)];
    
    console.log('\n📊 STRUCTURAL CONSISTENCY ANALYSIS');
    console.log(`🏗️  Unique structures found: ${uniqueStructures.length}`);
    
    if (uniqueStructures.length === 1) {
      console.log('✅ ALL CHARACTERS FOLLOW IDENTICAL STRUCTURE');
    } else {
      console.log('⚠️  STRUCTURAL INCONSISTENCIES DETECTED');
      uniqueStructures.forEach((hash, index) => {
        const characters = results.filter(r => r.hash === hash);
        console.log(`   Structure ${hash}: ${characters.map(c => c.filename).join(', ')}`);
      });
    }
    
    return uniqueStructures.length === 1;
  }
  
  /**
   * Generate manufacturing quality report
   */
  generateQualityReport(results) {
    const totalCharacters = results.length;
    const validCharacters = results.filter(r => r.valid).length;
    const averageQuality = results.reduce((sum, r) => sum + r.qualityScore, 0) / totalCharacters;
    const averageCompleteness = results.reduce((sum, r) => sum + r.completeness, 0) / totalCharacters;
    
    const report = {
      summary: {
        totalCharacters,
        validCharacters,
        validationRate: Math.round((validCharacters / totalCharacters) * 100),
        averageQuality: Math.round(averageQuality),
        averageCompleteness: Math.round(averageCompleteness)
      },
      details: results,
      recommendations: this.generateRecommendations(results),
      structuralConsistency: this.analyzeStructuralConsistency(results)
    };
    
    // Save report
    const reportPath = './validation-report.json';
    fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    console.log('\n📋 MANUFACTURING QUALITY REPORT');
    console.log(`📊 Total Characters: ${totalCharacters}`);
    console.log(`✅ Valid Characters: ${validCharacters} (${report.summary.validationRate}%)`);
    console.log(`🎯 Average Quality: ${report.summary.averageQuality}%`);
    console.log(`📈 Average Completeness: ${report.summary.averageCompleteness}%`);
    console.log(`🏭 Structural Consistency: ${report.structuralConsistency ? 'PERFECT' : 'NEEDS WORK'}`);
    
    return report;
  }
  
  /**
   * Generate recommendations for improvement
   */
  generateRecommendations(results) {
    const recommendations = [];
    
    // Check for low quality scores
    const lowQuality = results.filter(r => r.qualityScore < 80);
    if (lowQuality.length > 0) {
      recommendations.push({
        type: 'quality',
        severity: 'medium',
        message: `${lowQuality.length} characters have quality scores below 80%`,
        characters: lowQuality.map(r => r.filename)
      });
    }
    
    // Check for validation errors
    const invalidCharacters = results.filter(r => !r.valid);
    if (invalidCharacters.length > 0) {
      recommendations.push({
        type: 'validation',
        severity: 'high', 
        message: `${invalidCharacters.length} characters fail schema validation`,
        characters: invalidCharacters.map(r => r.filename)
      });
    }
    
    // Check for completeness issues
    const incomplete = results.filter(r => r.completeness < 90);
    if (incomplete.length > 0) {
      recommendations.push({
        type: 'completeness',
        severity: 'low',
        message: `${incomplete.length} characters are less than 90% complete`,
        characters: incomplete.map(r => r.filename)
      });
    }
    
    return recommendations;
  }
  
  /**
   * Run full validation suite
   */
  async validateAllCharacters() {
    console.log('\n🏭 STARTING MANUFACTURING QUALITY CONTROL');
    console.log('📏 Validating all blockchain characters against schema...\n');
    
    try {
      // Load schema
      await this.loadSchema();
      
      // Validate each character file
      const results = [];
      
      for (const filename of this.characterFiles) {
        try {
          const filepath = path.join('.', filename);
          const markdownContent = await fs.readFile(filepath, 'utf8');
          
          // Parse markdown into structured data
          const character = this.parseCharacterSheet(markdownContent, filename);
          
          // Validate against schema
          const result = this.validateCharacter(character, filename);
          results.push(result);
          
        } catch (error) {
          console.log(`❌ ${filename}: FILE ERROR - ${error.message}`);
          results.push({
            filename,
            valid: false,
            errors: [{ message: error.message }],
            completeness: 0,
            qualityScore: 0,
            hash: 'error'
          });
        }
      }
      
      // Generate quality report
      const report = this.generateQualityReport(results);
      
      console.log(`\n📄 Full report saved to: validation-report.json`);
      
      return report;
      
    } catch (error) {
      console.error('💥 Validation system error:', error.message);
      throw error;
    }
  }
}

// CLI interface
if (require.main === module) {
  const validator = new CharacterValidationSystem();
  
  validator.validateAllCharacters()
    .then(report => {
      if (report.summary.validationRate === 100 && report.structuralConsistency) {
        console.log('\n🏆 MANUFACTURING QUALITY: PERFECT GOLD BARS ACHIEVED!');
        process.exit(0);
      } else {
        console.log('\n⚠️  MANUFACTURING QUALITY: IMPROVEMENTS NEEDED');
        console.log('🔧 Review validation-report.json for detailed recommendations');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 CRITICAL ERROR:', error.message);
      process.exit(1);
    });
}

module.exports = CharacterValidationSystem;