#!/usr/bin/env node

/**
 * 🎯 UNIFIED SIMILARITY ENGINE
 * 
 * Standardized similarity calculations across all discovery systems
 * Implements 8 different similarity algorithms with configurable weights
 * Provides caching, learning, and performance optimization
 * 
 * Algorithms:
 * - Levenshtein (edit distance)
 * - Jaccard (set similarity) 
 * - Cosine (vector similarity)
 * - Soundex (phonetic matching)
 * - Metaphone (advanced phonetic)
 * - Semantic (meaning similarity)
 * - N-gram (sequence similarity)
 * - LCS (longest common subsequence)
 */

const crypto = require('crypto');
const natural = require('natural');

console.log(`
🎯 UNIFIED SIMILARITY ENGINE 🎯
===============================
8 Algorithms | Configurable Weights | ML-Enhanced | Cached
Standardized Similarity Calculations for All Discovery Systems
`);

class UnifiedSimilarityEngine {
    constructor(config = {}) {
        this.config = {
            // Algorithm weights (must sum to 1.0)
            algorithmWeights: {
                levenshtein: config.levenshtein || 0.20,   // Character-level edit distance
                jaccard: config.jaccard || 0.18,          // Set similarity (shared words)
                cosine: config.cosine || 0.18,            // Vector space similarity
                soundex: config.soundex || 0.08,          // Phonetic similarity
                metaphone: config.metaphone || 0.08,      // Advanced phonetic matching
                semantic: config.semantic || 0.12,        // Semantic meaning similarity
                ngram: config.ngram || 0.10,              // N-gram sequence similarity
                lcs: config.lcs || 0.06                   // Longest common subsequence
            },
            
            // Similarity thresholds
            thresholds: {
                identical: 0.98,      // Virtually identical
                nearDuplicate: 0.95,  // Near duplicate
                verySimilar: 0.85,    // Very similar
                similar: 0.70,        // Similar
                somewhatSimilar: 0.55, // Somewhat similar
                related: 0.40,        // Related
                weaklyRelated: 0.25,  // Weakly related
                unrelated: 0.10       // Unrelated
            },
            
            // Performance settings
            enableCaching: config.enableCaching !== false,
            cacheTimeout: config.cacheTimeout || 1800000, // 30 minutes
            maxCacheSize: config.maxCacheSize || 10000,
            
            // Text preprocessing
            preprocessing: {
                lowercase: true,
                removeStopWords: config.removeStopWords !== false,
                stemming: config.stemming !== false,
                removePunctuation: true,
                normalizeSpaces: true,
                removeNumbers: config.removeNumbers || false
            },
            
            // N-gram settings
            ngramSize: config.ngramSize || 3,
            
            // Learning settings
            enableLearning: config.enableLearning !== false,
            learningRate: config.learningRate || 0.01,
            
            ...config
        };
        
        // Initialize NLP tools
        this.tokenizer = new natural.WordTokenizer();
        this.stemmer = natural.PorterStemmer;
        this.stopWords = new Set(natural.stopwords);
        this.soundex = natural.Soundex;
        this.metaphone = natural.Metaphone;
        this.nGrams = natural.NGrams;
        
        // Caching
        this.cache = new Map();
        this.cacheStats = {
            hits: 0,
            misses: 0,
            evictions: 0
        };
        
        // Learning data
        this.learningData = new Map();
        this.feedbackData = new Map();
        
        // Statistics
        this.stats = {
            totalCalculations: 0,
            algorithmUsage: Object.fromEntries(
                Object.keys(this.config.algorithmWeights).map(key => [key, 0])
            ),
            averageExecutionTime: 0,
            totalExecutionTime: 0
        };
        
        console.log('🔧 Unified Similarity Engine initialized');
        console.log(`⚖️ Algorithm weights: ${JSON.stringify(this.config.algorithmWeights)}`);
        
        // Validate weights
        this.validateWeights();
    }
    
    validateWeights() {
        const totalWeight = Object.values(this.config.algorithmWeights).reduce((sum, w) => sum + w, 0);
        if (Math.abs(totalWeight - 1.0) > 0.001) {
            console.warn(`⚠️ Algorithm weights sum to ${totalWeight.toFixed(3)}, should be 1.0`);
        }
    }
    
    /**
     * Main similarity calculation method
     */
    async calculateSimilarity(text1, text2, options = {}) {
        const startTime = Date.now();
        
        // Input validation
        if (!text1 || !text2) return { overallSimilarity: 0, algorithmBreakdown: {}, error: 'Invalid input' };
        if (text1 === text2) return { overallSimilarity: 1.0, algorithmBreakdown: {}, cached: false };
        
        // Check cache
        const cacheKey = this.generateCacheKey(text1, text2, options);
        if (this.config.enableCaching && this.cache.has(cacheKey)) {
            this.cacheStats.hits++;
            const cached = this.cache.get(cacheKey);
            cached.executionTime = Date.now() - startTime;
            cached.cached = true;
            return cached;
        }
        this.cacheStats.misses++;
        
        try {
            // Preprocess texts
            const processed1 = this.preprocessText(text1);
            const processed2 = this.preprocessText(text2);
            
            // Calculate individual algorithm similarities
            const algorithmResults = {};
            const promises = [];
            
            // Levenshtein distance
            if (this.config.algorithmWeights.levenshtein > 0) {
                promises.push(
                    this.calculateLevenshtein(processed1.raw, processed2.raw)
                        .then(score => algorithmResults.levenshtein = score)
                );
            }
            
            // Jaccard similarity
            if (this.config.algorithmWeights.jaccard > 0) {
                promises.push(
                    this.calculateJaccard(processed1.tokens, processed2.tokens)
                        .then(score => algorithmResults.jaccard = score)
                );
            }
            
            // Cosine similarity
            if (this.config.algorithmWeights.cosine > 0) {
                promises.push(
                    this.calculateCosine(processed1.tokens, processed2.tokens)
                        .then(score => algorithmResults.cosine = score)
                );
            }
            
            // Soundex similarity
            if (this.config.algorithmWeights.soundex > 0) {
                promises.push(
                    this.calculateSoundex(processed1.tokens, processed2.tokens)
                        .then(score => algorithmResults.soundex = score)
                );
            }
            
            // Metaphone similarity
            if (this.config.algorithmWeights.metaphone > 0) {
                promises.push(
                    this.calculateMetaphone(processed1.tokens, processed2.tokens)
                        .then(score => algorithmResults.metaphone = score)
                );
            }
            
            // Semantic similarity
            if (this.config.algorithmWeights.semantic > 0) {
                promises.push(
                    this.calculateSemantic(processed1.tokens, processed2.tokens)
                        .then(score => algorithmResults.semantic = score)
                );
            }
            
            // N-gram similarity
            if (this.config.algorithmWeights.ngram > 0) {
                promises.push(
                    this.calculateNGram(processed1.raw, processed2.raw)
                        .then(score => algorithmResults.ngram = score)
                );
            }
            
            // LCS similarity
            if (this.config.algorithmWeights.lcs > 0) {
                promises.push(
                    this.calculateLCS(processed1.raw, processed2.raw)
                        .then(score => algorithmResults.lcs = score)
                );
            }
            
            // Wait for all algorithms to complete
            await Promise.all(promises);
            
            // Calculate weighted overall similarity
            let overallSimilarity = 0;
            for (const [algorithm, weight] of Object.entries(this.config.algorithmWeights)) {
                if (algorithmResults[algorithm] !== undefined) {
                    overallSimilarity += algorithmResults[algorithm] * weight;
                    this.stats.algorithmUsage[algorithm]++;
                }
            }
            
            // Apply learning adjustments
            if (this.config.enableLearning) {
                overallSimilarity = this.applyLearningAdjustments(text1, text2, overallSimilarity, algorithmResults);
            }
            
            const executionTime = Date.now() - startTime;
            
            const result = {
                overallSimilarity: Math.max(0, Math.min(1, overallSimilarity)),
                algorithmBreakdown: algorithmResults,
                confidence: this.calculateConfidence(algorithmResults),
                category: this.categorizeSimiliarity(overallSimilarity),
                executionTime,
                cached: false,
                preprocessing: {
                    text1Length: processed1.raw.length,
                    text2Length: processed2.raw.length,
                    tokens1Count: processed1.tokens.length,
                    tokens2Count: processed2.tokens.length
                }
            };
            
            // Cache result
            if (this.config.enableCaching) {
                this.cacheResult(cacheKey, result);
            }
            
            // Update statistics
            this.updateStats(executionTime);
            
            return result;
            
        } catch (error) {
            console.error('Similarity calculation error:', error);
            return { 
                overallSimilarity: 0, 
                algorithmBreakdown: {}, 
                error: error.message,
                executionTime: Date.now() - startTime
            };
        }
    }
    
    /**
     * Text preprocessing
     */
    preprocessText(text) {
        let processed = String(text || '');
        
        // Lowercase
        if (this.config.preprocessing.lowercase) {
            processed = processed.toLowerCase();
        }
        
        // Remove punctuation
        if (this.config.preprocessing.removePunctuation) {
            processed = processed.replace(/[^\w\s]/g, ' ');
        }
        
        // Remove numbers
        if (this.config.preprocessing.removeNumbers) {
            processed = processed.replace(/\d+/g, ' ');
        }
        
        // Normalize spaces
        if (this.config.preprocessing.normalizeSpaces) {
            processed = processed.replace(/\s+/g, ' ').trim();
        }
        
        // Tokenize
        const tokens = this.tokenizer.tokenize(processed) || [];
        
        // Remove stop words
        let filteredTokens = tokens;
        if (this.config.preprocessing.removeStopWords) {
            filteredTokens = tokens.filter(token => !this.stopWords.has(token));
        }
        
        // Stemming
        let stemmedTokens = filteredTokens;
        if (this.config.preprocessing.stemming) {
            stemmedTokens = filteredTokens.map(token => this.stemmer.stem(token));
        }
        
        return {
            raw: processed,
            tokens: filteredTokens,
            stemmed: stemmedTokens,
            originalLength: text.length,
            processedLength: processed.length,
            tokenCount: tokens.length
        };
    }
    
    /**
     * Individual similarity algorithms
     */
    
    async calculateLevenshtein(text1, text2) {
        const distance = natural.LevenshteinDistance(text1, text2);
        const maxLength = Math.max(text1.length, text2.length);
        return maxLength === 0 ? 1 : 1 - (distance / maxLength);
    }
    
    async calculateJaccard(tokens1, tokens2) {
        const set1 = new Set(tokens1);
        const set2 = new Set(tokens2);
        const intersection = new Set([...set1].filter(x => set2.has(x)));
        const union = new Set([...set1, ...set2]);
        
        return union.size === 0 ? 0 : intersection.size / union.size;
    }
    
    async calculateCosine(tokens1, tokens2) {
        // Create term frequency vectors
        const allTerms = [...new Set([...tokens1, ...tokens2])];
        
        if (allTerms.length === 0) return 0;
        
        const vector1 = allTerms.map(term => tokens1.filter(t => t === term).length);
        const vector2 = allTerms.map(term => tokens2.filter(t => t === term).length);
        
        // Calculate cosine similarity
        const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);
        const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
        const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));
        
        return (magnitude1 * magnitude2) === 0 ? 0 : dotProduct / (magnitude1 * magnitude2);
    }
    
    async calculateSoundex(tokens1, tokens2) {
        if (tokens1.length === 0 && tokens2.length === 0) return 1;
        if (tokens1.length === 0 || tokens2.length === 0) return 0;
        
        const soundex1 = tokens1.map(token => this.soundex.process(token));
        const soundex2 = tokens2.map(token => this.soundex.process(token));
        
        return this.calculateJaccard(soundex1, soundex2);
    }
    
    async calculateMetaphone(tokens1, tokens2) {
        if (tokens1.length === 0 && tokens2.length === 0) return 1;
        if (tokens1.length === 0 || tokens2.length === 0) return 0;
        
        const metaphone1 = tokens1.map(token => this.metaphone.process(token));
        const metaphone2 = tokens2.map(token => this.metaphone.process(token));
        
        return this.calculateJaccard(metaphone1, metaphone2);
    }
    
    async calculateSemantic(tokens1, tokens2) {
        // Placeholder for semantic similarity
        // In a full implementation, this would use word embeddings or WordNet
        const commonTokens = tokens1.filter(token => tokens2.includes(token));
        const totalTokens = new Set([...tokens1, ...tokens2]).size;
        
        return totalTokens === 0 ? 0 : (commonTokens.length * 2) / totalTokens;
    }
    
    async calculateNGram(text1, text2) {
        const ngrams1 = this.nGrams.ngrams(text1, this.config.ngramSize);
        const ngrams2 = this.nGrams.ngrams(text2, this.config.ngramSize);
        
        if (ngrams1.length === 0 && ngrams2.length === 0) return 1;
        if (ngrams1.length === 0 || ngrams2.length === 0) return 0;
        
        return this.calculateJaccard(
            ngrams1.map(ng => ng.join('')), 
            ngrams2.map(ng => ng.join(''))
        );
    }
    
    async calculateLCS(text1, text2) {
        const lcsLength = this.longestCommonSubsequence(text1, text2);
        const maxLength = Math.max(text1.length, text2.length);
        
        return maxLength === 0 ? 1 : lcsLength / maxLength;
    }
    
    longestCommonSubsequence(text1, text2) {
        const m = text1.length;
        const n = text2.length;
        const dp = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
        
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (text1[i - 1] === text2[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1] + 1;
                } else {
                    dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
                }
            }
        }
        
        return dp[m][n];
    }
    
    /**
     * Helper methods
     */
    
    calculateConfidence(algorithmResults) {
        const scores = Object.values(algorithmResults).filter(score => score !== undefined);
        if (scores.length === 0) return 0;
        
        const variance = this.calculateVariance(scores);
        const confidence = 1 - (variance * 2); // Lower variance = higher confidence
        
        return Math.max(0, Math.min(1, confidence));
    }
    
    calculateVariance(scores) {
        const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        const squaredDiffs = scores.map(score => Math.pow(score - mean, 2));
        return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / scores.length;
    }
    
    categorizeSimiliarity(similarity) {
        const thresholds = this.config.thresholds;
        
        if (similarity >= thresholds.identical) return 'identical';
        if (similarity >= thresholds.nearDuplicate) return 'near_duplicate';
        if (similarity >= thresholds.verySimilar) return 'very_similar';
        if (similarity >= thresholds.similar) return 'similar';
        if (similarity >= thresholds.somewhatSimilar) return 'somewhat_similar';
        if (similarity >= thresholds.related) return 'related';
        if (similarity >= thresholds.weaklyRelated) return 'weakly_related';
        return 'unrelated';
    }
    
    generateCacheKey(text1, text2, options) {
        const key = JSON.stringify({ text1, text2, options, weights: this.config.algorithmWeights });
        return crypto.createHash('sha256').update(key).digest('hex');
    }
    
    cacheResult(key, result) {
        // Implement LRU cache eviction
        if (this.cache.size >= this.config.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
            this.cacheStats.evictions++;
        }
        
        this.cache.set(key, result);
        
        // Set cache timeout
        setTimeout(() => {
            this.cache.delete(key);
        }, this.config.cacheTimeout);
    }
    
    updateStats(executionTime) {
        this.stats.totalCalculations++;
        this.stats.totalExecutionTime += executionTime;
        this.stats.averageExecutionTime = this.stats.totalExecutionTime / this.stats.totalCalculations;
    }
    
    applyLearningAdjustments(text1, text2, similarity, algorithmResults) {
        // Placeholder for ML adjustments
        // In a full implementation, this would use feedback data to adjust weights
        return similarity;
    }
    
    /**
     * Learning and feedback methods
     */
    
    recordFeedback(text1, text2, expectedSimilarity, actualSimilarity) {
        const key = crypto.createHash('sha256').update(text1 + text2).digest('hex');
        this.feedbackData.set(key, {
            text1,
            text2,
            expected: expectedSimilarity,
            actual: actualSimilarity,
            error: Math.abs(expectedSimilarity - actualSimilarity),
            timestamp: Date.now()
        });
        
        // Apply online learning
        if (this.config.enableLearning) {
            this.adjustWeights(expectedSimilarity, actualSimilarity);
        }
    }
    
    adjustWeights(expected, actual) {
        const error = expected - actual;
        const adjustment = error * this.config.learningRate;
        
        // Simple weight adjustment (in a full implementation, this would be more sophisticated)
        for (const algorithm of Object.keys(this.config.algorithmWeights)) {
            this.config.algorithmWeights[algorithm] *= (1 + adjustment);
        }
        
        // Renormalize weights
        this.normalizeWeights();
    }
    
    normalizeWeights() {
        const total = Object.values(this.config.algorithmWeights).reduce((sum, w) => sum + w, 0);
        for (const algorithm of Object.keys(this.config.algorithmWeights)) {
            this.config.algorithmWeights[algorithm] /= total;
        }
    }
    
    /**
     * Batch processing methods
     */
    
    async calculateSimilarityMatrix(texts, options = {}) {
        const matrix = [];
        const total = texts.length * (texts.length - 1) / 2;
        let completed = 0;
        
        console.log(`📊 Calculating similarity matrix for ${texts.length} texts (${total} comparisons)`);
        
        for (let i = 0; i < texts.length; i++) {
            matrix[i] = [];
            for (let j = 0; j < texts.length; j++) {
                if (i === j) {
                    matrix[i][j] = 1.0;
                } else if (i < j) {
                    const result = await this.calculateSimilarity(texts[i], texts[j], options);
                    matrix[i][j] = result.overallSimilarity;
                    matrix[j] = matrix[j] || [];
                    matrix[j][i] = result.overallSimilarity;
                    completed++;
                    
                    if (completed % 100 === 0) {
                        console.log(`Progress: ${completed}/${total} (${((completed/total)*100).toFixed(1)}%)`);
                    }
                }
            }
        }
        
        console.log(`✅ Similarity matrix completed: ${total} comparisons`);
        return matrix;
    }
    
    async findMostSimilar(targetText, candidateTexts, options = {}) {
        const similarities = [];
        
        for (const candidate of candidateTexts) {
            const result = await this.calculateSimilarity(targetText, candidate, options);
            similarities.push({
                text: candidate,
                similarity: result.overallSimilarity,
                category: result.category,
                details: result
            });
        }
        
        return similarities
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, options.maxResults || 10);
    }
    
    /**
     * API methods
     */
    
    getStats() {
        return {
            ...this.stats,
            cache: this.cacheStats,
            config: {
                weights: this.config.algorithmWeights,
                thresholds: this.config.thresholds
            },
            learning: {
                feedbackCount: this.feedbackData.size,
                learningDataCount: this.learningData.size,
                learningEnabled: this.config.enableLearning
            }
        };
    }
    
    clearCache() {
        this.cache.clear();
        this.cacheStats = { hits: 0, misses: 0, evictions: 0 };
        console.log('🗑️ Similarity cache cleared');
    }
    
    updateWeights(newWeights) {
        this.config.algorithmWeights = { ...this.config.algorithmWeights, ...newWeights };
        this.normalizeWeights();
        this.clearCache(); // Clear cache since weights changed
        console.log('⚖️ Algorithm weights updated:', this.config.algorithmWeights);
    }
    
    exportLearningData() {
        return {
            feedbackData: [...this.feedbackData.entries()],
            learningData: [...this.learningData.entries()],
            weights: this.config.algorithmWeights,
            stats: this.stats
        };
    }
}

module.exports = UnifiedSimilarityEngine;

// CLI interface
if (require.main === module) {
    const engine = new UnifiedSimilarityEngine({
        enableLearning: true,
        enableCaching: true
    });
    
    // Test the engine
    async function testSimilarityEngine() {
        console.log('\n🧪 Testing Unified Similarity Engine...');
        
        const testPairs = [
            ['authentication system', 'login mechanism'],
            ['user dashboard', 'admin panel'],
            ['payment processing', 'billing system'],
            ['database connection', 'data storage'],
            ['email notification', 'messaging service']
        ];
        
        for (const [text1, text2] of testPairs) {
            const result = await engine.calculateSimilarity(text1, text2);
            
            console.log(`\n"${text1}" vs "${text2}"`);
            console.log(`Overall: ${(result.overallSimilarity * 100).toFixed(1)}% (${result.category})`);
            console.log(`Confidence: ${(result.confidence * 100).toFixed(1)}%`);
            console.log(`Time: ${result.executionTime}ms`);
            
            // Show top algorithm scores
            const sortedAlgorithms = Object.entries(result.algorithmBreakdown)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3);
            
            console.log(`Top algorithms: ${sortedAlgorithms.map(([alg, score]) => 
                `${alg}(${(score*100).toFixed(1)}%)`).join(', ')}`);
        }
        
        console.log('\n📊 Engine Stats:', engine.getStats());
        
        // Test batch processing
        console.log('\n🔄 Testing batch similarity...');
        const texts = ['authentication', 'login', 'user management', 'access control'];
        const matrix = await engine.calculateSimilarityMatrix(texts);
        
        console.log('Similarity Matrix:');
        texts.forEach((text, i) => {
            const row = matrix[i].map(score => (score * 100).toFixed(0).padStart(3)).join(' ');
            console.log(`${text.padEnd(15)} ${row}`);
        });
    }
    
    testSimilarityEngine().catch(console.error);
}