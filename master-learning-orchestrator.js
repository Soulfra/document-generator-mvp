#!/usr/bin/env node

/**
 * 🧠 MASTER LEARNING ORCHESTRATOR
 * 
 * The unified AI system that learns to handle multi-format files and 
 * extract layers (frontend/backend/game/ICP) with token rewards/penalties.
 * 
 * Combines:
 * - Carrot Reinforcement Learning (rewards/penalties)
 * - Universal Format Translator (multi-format handling)
 * - Obsidian Vault Orchestrator (organization)
 * - Meta Learning System (experience/memory)
 * - Document Generator Vault (origin portal)
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

// Import existing AI systems (using stub versions for testing)
const CarrotReinforcementLearningSystem = require('./carrot-reinforcement-learning-system-stub');
const UniversalFormatTranslator = require('./universal-format-translator-stub');
const ObsidianVaultOrchestrator = require('./obsidian-vault-orchestrator-stub');

class MasterLearningOrchestrator extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            port: config.port || 9950,
            
            // Learning parameters
            learningRate: config.learningRate || 0.1,
            experienceMultiplier: config.experienceMultiplier || 1.5,
            tokenRewardBase: config.tokenRewardBase || 10,
            tokenPenaltyBase: config.tokenPenaltyBase || 5,
            
            // File processing
            maxFileSize: config.maxFileSize || 10 * 1024 * 1024, // 10MB
            supportedFormats: config.supportedFormats || [
                'md', 'js', 'ts', 'tsx', 'jsx', 'json', 'xml', 'yaml', 
                'html', 'css', 'py', 'txt', 'map', 'sol', 'rs'
            ],
            
            // Layer extraction patterns
            layerPatterns: {
                frontend: /\.(tsx?|jsx?|css|html|vue|svelte)$/i,
                backend: /\.(js|ts|py|php|rb|go|rs)$/i,
                game: /(game|player|character|level|score|physics).*\.(js|ts|py)$/i,
                icp: /(canister|dfx|motoko|azle|icp).*\.(mo|js|ts|json)$/i,
                blockchain: /(smart|contract|chain|token|wallet).*\.(sol|rs|js|ts)$/i,
                database: /(schema|migration|model|entity).*\.(sql|js|ts|py)$/i,
                config: /\.(json|yaml|toml|env|config)$/i,
                docs: /\.(md|txt|rst|adoc)$/i
            },
            
            ...config
        };
        
        // Initialize core AI systems
        this.reinforcementSystem = new CarrotReinforcementLearningSystem();
        this.formatTranslator = new UniversalFormatTranslator();
        this.vaultOrchestrator = new ObsidianVaultOrchestrator();
        
        // Learning state
        this.experienceDatabase = new Map();
        this.performanceHistory = [];
        this.layerExtractionStats = new Map();
        this.formatHandlingAccuracy = new Map();
        
        // Initialize experience for each supported format
        this.config.supportedFormats.forEach(format => {
            this.formatHandlingAccuracy.set(format, {
                attempts: 0,
                successes: 0,
                accuracy: 0,
                lastUpdate: Date.now()
            });
        });
        
        // Initialize layer extraction stats
        Object.keys(this.config.layerPatterns).forEach(layer => {
            this.layerExtractionStats.set(layer, {
                attempts: 0,
                correctExtractions: 0,
                falsePositives: 0,
                accuracy: 0,
                confidence: 0.5 // Start with neutral confidence
            });
        });
        
        console.log('🧠 Master Learning Orchestrator initialized');
        console.log(`🎯 Supporting ${this.config.supportedFormats.length} file formats`);
        console.log(`🎮 Extracting ${Object.keys(this.config.layerPatterns).length} layer types`);
    }
    
    /**
     * Process a file with learning and rewards
     */
    async processFileWithLearning(filePath, expectedResult = null) {
        const startTime = Date.now();
        const sessionId = `session-${Date.now()}`;
        
        console.log(`🔍 Processing file: ${filePath}`);
        
        try {
            // Step 1: Detect file format
            const format = this.detectFileFormat(filePath);
            const formatStats = this.formatHandlingAccuracy.get(format);
            
            // Step 2: Read and analyze file
            const fileContent = await fs.readFile(filePath, 'utf-8');
            const fileAnalysis = await this.analyzeFileContent(fileContent, format);
            
            // Step 3: Extract layers
            const layerExtractions = this.extractLayers(filePath, fileContent);
            
            // Step 4: Organize with vault system
            const vaultOrganization = await this.organizeInVault(filePath, layerExtractions);
            
            // Step 5: Evaluate performance (if we have expected results)
            let performance = null;
            let rewards = 0;
            
            if (expectedResult) {
                performance = this.evaluatePerformance(
                    { format, layerExtractions, vaultOrganization },
                    expectedResult
                );
                
                // Calculate rewards/penalties
                rewards = this.calculateRewards(performance);
                
                // Update learning statistics
                this.updateLearningStats(format, layerExtractions, performance);
            }
            
            // Step 6: Record experience
            const experience = {
                sessionId,
                filePath,
                format,
                layerExtractions,
                performance,
                rewards,
                processingTime: Date.now() - startTime,
                timestamp: new Date()
            };
            
            this.experienceDatabase.set(sessionId, experience);
            this.performanceHistory.push(experience);
            
            // Keep only last 1000 experiences
            if (this.performanceHistory.length > 1000) {
                this.performanceHistory.shift();
            }
            
            // Step 7: Apply rewards via reinforcement learning system
            if (rewards !== 0) {
                this.applyRewards(rewards, experience);
            }
            
            // Step 8: Learn from experience
            await this.learnFromExperience(experience);
            
            console.log(`✅ Processed ${filePath} in ${Date.now() - startTime}ms`);
            if (rewards > 0) {
                console.log(`🏆 Earned ${rewards} tokens for good performance`);
            } else if (rewards < 0) {
                console.log(`💸 Lost ${Math.abs(rewards)} tokens for poor performance`);
            }
            
            return {
                success: true,
                sessionId,
                format,
                layerExtractions,
                vaultOrganization,
                performance,
                rewards,
                experience
            };
            
        } catch (error) {
            console.error(`❌ Error processing ${filePath}:`, error.message);
            
            // Penalty for errors
            const penalty = -this.config.tokenPenaltyBase;
            this.applyRewards(penalty, { filePath, error: error.message });
            
            return {
                success: false,
                error: error.message,
                rewards: penalty
            };
        }
    }
    
    /**
     * Detect file format from path and content
     */
    detectFileFormat(filePath) {
        const ext = path.extname(filePath).toLowerCase().slice(1);
        return this.config.supportedFormats.includes(ext) ? ext : 'unknown';
    }
    
    /**
     * Analyze file content for structure and patterns
     */
    async analyzeFileContent(content, format) {
        const analysis = {
            format,
            lines: content.split('\n').length,
            size: content.length,
            hasImports: /^(import|require|from|#include)/m.test(content),
            hasExports: /^(export|module\.exports)/m.test(content),
            hasClasses: /^(class |function |const .* = |def )/m.test(content),
            hasComments: /(\/\/|\/\*|#|<!--|<!--)/m.test(content),
            complexity: this.calculateComplexity(content),
            patterns: this.findPatterns(content, format)
        };
        
        return analysis;
    }
    
    /**
     * Extract different layers from file based on patterns
     */
    extractLayers(filePath, content) {
        const extractions = {};
        const fileName = path.basename(filePath);
        
        for (const [layerType, pattern] of Object.entries(this.config.layerPatterns)) {
            const stats = this.layerExtractionStats.get(layerType);
            stats.attempts++;
            
            // Check if file matches this layer type
            const isMatch = pattern.test(fileName) || this.hasLayerContent(content, layerType);
            
            extractions[layerType] = {
                matched: isMatch,
                confidence: this.calculateLayerConfidence(content, layerType),
                evidence: this.getLayerEvidence(content, layerType),
                extractedCode: isMatch ? this.extractLayerCode(content, layerType) : null
            };
            
            if (isMatch) {
                console.log(`📊 Extracted ${layerType} layer from ${fileName}`);
            }
        }
        
        return extractions;
    }
    
    /**
     * Check if content has characteristics of a specific layer
     */
    hasLayerContent(content, layerType) {
        const layerIndicators = {
            frontend: ['React', 'Vue', 'Angular', 'DOM', 'useState', 'component', 'render'],
            backend: ['express', 'fastify', 'server', 'database', 'API', 'middleware'],
            game: ['player', 'score', 'level', 'physics', 'collision', 'sprite', 'game'],
            icp: ['canister', 'dfx', 'motoko', 'azle', 'internet-computer', 'ICP'],
            blockchain: ['smart contract', 'solidity', 'ethereum', 'web3', 'blockchain'],
            database: ['SELECT', 'INSERT', 'CREATE TABLE', 'schema', 'migration'],
            config: ['port', 'host', 'environment', 'settings', 'configuration'],
            docs: ['documentation', 'README', 'guide', 'tutorial', 'examples']
        };
        
        const indicators = layerIndicators[layerType] || [];
        const matches = indicators.filter(indicator => 
            content.toLowerCase().includes(indicator.toLowerCase())
        ).length;
        
        return matches >= 2; // Need at least 2 indicators
    }
    
    /**
     * Calculate confidence for layer extraction
     */
    calculateLayerConfidence(content, layerType) {
        const stats = this.layerExtractionStats.get(layerType);
        const baseConfidence = stats.accuracy || 0.5;
        
        // Adjust based on content characteristics
        const contentSignals = this.hasLayerContent(content, layerType) ? 0.3 : -0.2;
        const historyBonus = Math.min(stats.correctExtractions / 10, 0.2);
        
        return Math.max(0, Math.min(1, baseConfidence + contentSignals + historyBonus));
    }
    
    /**
     * Get evidence for why a layer was extracted
     */
    getLayerEvidence(content, layerType) {
        const evidence = [];
        
        // Add specific evidence based on layer type
        if (layerType === 'frontend' && /React|Vue|Angular/.test(content)) {
            evidence.push('Frontend framework detected');
        }
        if (layerType === 'backend' && /express|server|API/.test(content)) {
            evidence.push('Server/API code detected');
        }
        if (layerType === 'game' && /player|score|game/.test(content)) {
            evidence.push('Game logic patterns detected');
        }
        
        return evidence;
    }
    
    /**
     * Extract actual code for a specific layer
     */
    extractLayerCode(content, layerType) {
        // This would be more sophisticated in practice
        const lines = content.split('\n');
        const relevantLines = lines.filter(line => {
            switch (layerType) {
                case 'frontend':
                    return /component|render|useState|jsx|tsx/.test(line);
                case 'backend':
                    return /app\.|server|express|API|endpoint/.test(line);
                case 'game':
                    return /player|score|level|game|physics/.test(line);
                default:
                    return false;
            }
        });
        
        return relevantLines.join('\n');
    }
    
    /**
     * Organize file in vault system
     */
    async organizeInVault(filePath, layerExtractions) {
        try {
            // This would integrate with the obsidian vault orchestrator
            const category = this.determineVaultCategory(filePath, layerExtractions);
            const relationships = this.findFileRelationships(filePath);
            
            return {
                category,
                relationships,
                organized: true
            };
        } catch (error) {
            return {
                organized: false,
                error: error.message
            };
        }
    }
    
    /**
     * Determine which vault category a file belongs in
     */
    determineVaultCategory(filePath, layerExtractions) {
        const fileName = path.basename(filePath);
        
        // Check layer extractions for hints
        const dominantLayer = Object.entries(layerExtractions)
            .filter(([_, data]) => data.matched)
            .sort((a, b) => b[1].confidence - a[1].confidence)[0];
        
        if (dominantLayer) {
            return `layer-${dominantLayer[0]}`;
        }
        
        // Fall back to file pattern matching
        if (/orchestrator|engine|system/.test(fileName)) return '04-Generators';
        if (/integration|api|bridge/.test(fileName)) return '05-Integrations';
        if (/game|character|player/.test(fileName)) return '07-Gaming-Systems';
        
        return '99-Uncategorized';
    }
    
    /**
     * Find relationships between files
     */
    findFileRelationships(filePath) {
        // This would analyze imports, references, etc.
        return {
            imports: [],
            exports: [],
            references: []
        };
    }
    
    /**
     * Evaluate performance against expected results
     */
    evaluatePerformance(actual, expected) {
        let score = 0;
        let maxScore = 0;
        
        // Check format detection accuracy
        maxScore += 10;
        if (actual.format === expected.format) {
            score += 10;
        }
        
        // Check layer extraction accuracy
        for (const layer of Object.keys(this.config.layerPatterns)) {
            maxScore += 5;
            const actualMatch = actual.layerExtractions[layer]?.matched || false;
            const expectedMatch = expected.layerExtractions?.[layer] || false;
            
            if (actualMatch === expectedMatch) {
                score += 5;
            }
        }
        
        // Check vault organization
        maxScore += 5;
        if (actual.vaultOrganization.organized && expected.vaultOrganized) {
            score += 5;
        }
        
        const accuracy = score / maxScore;
        return {
            score,
            maxScore,
            accuracy,
            passed: accuracy >= 0.7
        };
    }
    
    /**
     * Calculate rewards based on performance
     */
    calculateRewards(performance) {
        if (!performance) return 0;
        
        const baseReward = this.config.tokenRewardBase;
        const basePenalty = this.config.tokenPenaltyBase;
        
        if (performance.passed) {
            // Reward based on accuracy
            return Math.round(baseReward * performance.accuracy);
        } else {
            // Penalty for poor performance
            return -Math.round(basePenalty * (1 - performance.accuracy));
        }
    }
    
    /**
     * Update learning statistics
     */
    updateLearningStats(format, layerExtractions, performance) {
        // Update format handling accuracy
        const formatStats = this.formatHandlingAccuracy.get(format);
        if (formatStats) {
            formatStats.attempts++;
            if (performance.passed) {
                formatStats.successes++;
            }
            formatStats.accuracy = formatStats.successes / formatStats.attempts;
            formatStats.lastUpdate = Date.now();
        }
        
        // Update layer extraction accuracy
        for (const [layer, extraction] of Object.entries(layerExtractions)) {
            const layerStats = this.layerExtractionStats.get(layer);
            if (layerStats && extraction.matched) {
                if (performance.passed) {
                    layerStats.correctExtractions++;
                } else {
                    layerStats.falsePositives++;
                }
                layerStats.accuracy = layerStats.correctExtractions / layerStats.attempts;
            }
        }
    }
    
    /**
     * Apply rewards through reinforcement learning system
     */
    applyRewards(rewards, context) {
        // This integrates with the carrot reinforcement learning system
        this.reinforcementSystem.addReward('master-orchestrator', rewards, {
            context: context,
            timestamp: Date.now()
        });
        
        console.log(`💰 Applied ${rewards} token reward/penalty`);
    }
    
    /**
     * Learn from experience to improve future performance
     */
    async learnFromExperience(experience) {
        // Pattern recognition learning
        if (experience.performance && experience.performance.passed) {
            // Record successful patterns
            const successPattern = {
                format: experience.format,
                layerTypes: Object.keys(experience.layerExtractions).filter(
                    layer => experience.layerExtractions[layer].matched
                ),
                timestamp: Date.now()
            };
            
            console.log(`📚 Learning from successful pattern: ${JSON.stringify(successPattern)}`);
        }
        
        // Adjust confidence levels based on results
        if (experience.performance) {
            for (const [layer, extraction] of Object.entries(experience.layerExtractions)) {
                const stats = this.layerExtractionStats.get(layer);
                if (stats) {
                    if (experience.performance.passed && extraction.matched) {
                        stats.confidence = Math.min(1, stats.confidence + 0.1);
                    } else if (!experience.performance.passed && extraction.matched) {
                        stats.confidence = Math.max(0, stats.confidence - 0.05);
                    }
                }
            }
        }
    }
    
    /**
     * Calculate code complexity
     */
    calculateComplexity(content) {
        const lines = content.split('\n');
        let complexity = 0;
        
        for (const line of lines) {
            if (/if|for|while|switch|catch|&&|\|\|/.test(line)) complexity++;
            if (/function|class|method/.test(line)) complexity++;
        }
        
        return complexity;
    }
    
    /**
     * Find patterns in content
     */
    findPatterns(content, format) {
        const patterns = [];
        
        if (format === 'js' || format === 'ts') {
            if (/import.*from/.test(content)) patterns.push('es6-imports');
            if (/require\(/.test(content)) patterns.push('commonjs-requires');
            if (/export/.test(content)) patterns.push('module-exports');
            if (/class\s+\w+/.test(content)) patterns.push('es6-classes');
            if (/function\s+\w+/.test(content)) patterns.push('functions');
            if (/const\s+\w+\s+=\s+/.test(content)) patterns.push('const-assignments');
        }
        
        return patterns;
    }
    
    /**
     * Get current learning statistics
     */
    getLearningStats() {
        const totalExperiences = this.performanceHistory.length;
        const recentPerformance = this.performanceHistory.slice(-10);
        const recentAccuracy = recentPerformance.length > 0 
            ? recentPerformance.filter(e => e.performance?.passed).length / recentPerformance.length
            : 0;
        
        return {
            totalExperiences,
            recentAccuracy,
            formatStats: Object.fromEntries(this.formatHandlingAccuracy),
            layerStats: Object.fromEntries(this.layerExtractionStats),
            totalTokensEarned: this.performanceHistory.reduce((sum, exp) => sum + (exp.rewards || 0), 0)
        };
    }
    
    /**
     * Process multiple files with learning
     */
    async processDirectory(directoryPath, expectedResults = {}) {
        console.log(`🔍 Processing directory: ${directoryPath}`);
        
        const files = await fs.readdir(directoryPath);
        const results = [];
        
        for (const file of files) {
            const filePath = path.join(directoryPath, file);
            const stat = await fs.stat(filePath);
            
            if (stat.isFile() && this.isSupportedFile(file)) {
                const expected = expectedResults[file] || null;
                const result = await this.processFileWithLearning(filePath, expected);
                results.push(result);
            }
        }
        
        console.log(`✅ Processed ${results.length} files`);
        return results;
    }
    
    /**
     * Check if file is supported
     */
    isSupportedFile(fileName) {
        const ext = path.extname(fileName).toLowerCase().slice(1);
        return this.config.supportedFormats.includes(ext);
    }
}

// Export for use as a module
module.exports = MasterLearningOrchestrator;

// CLI usage
if (require.main === module) {
    const orchestrator = new MasterLearningOrchestrator();
    
    console.log(`
🧠 MASTER LEARNING ORCHESTRATOR
==============================

🎯 Features:
- Reinforcement learning with token rewards/penalties
- Multi-format file handling (${orchestrator.config.supportedFormats.length} formats)
- Layer extraction (frontend/backend/game/ICP/etc.)
- Experience-based learning and improvement
- Obsidian vault organization
- DocumentGeneratorVault.app integration

🚀 Usage:
  node master-learning-orchestrator.js <file-path>
  node master-learning-orchestrator.js <directory-path>

📊 Learning Stats:
  - Format accuracy tracking
  - Layer extraction confidence
  - Token reward history
  - Performance improvement over time

Starting interactive mode...
`);
    
    // Example usage
    const testFile = process.argv[2];
    if (testFile) {
        orchestrator.processFileWithLearning(testFile)
            .then(result => {
                console.log('\n📊 Results:', JSON.stringify(result, null, 2));
                console.log('\n📈 Learning Stats:', JSON.stringify(orchestrator.getLearningStats(), null, 2));
            })
            .catch(console.error);
    } else {
        console.log('💡 Provide a file path to test: node master-learning-orchestrator.js ./test-file.js');
    }
}