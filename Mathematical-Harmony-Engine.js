#!/usr/bin/env node

/**
 * 🎼🎨 MATHEMATICAL HARMONY ENGINE
 * 
 * Advanced color theory and music theory calculations for perfect harmony.
 * Maps musical intervals to visual spacing, golden ratio color relationships,
 * statistical game mechanics, and probability-based aggro systems.
 * 
 * The mathematical foundation for brand coherence across all dimensions.
 */

const EventEmitter = require('events');
const crypto = require('crypto');

console.log(`
🎼🎨 MATHEMATICAL HARMONY ENGINE 🎼🎨
=====================================
Golden Ratio | Musical Intervals | Statistical Analysis
Perfect Mathematical Harmony Across All Dimensions
`);

class MathematicalHarmonyEngine extends EventEmitter {
    constructor() {
        super();
        
        this.config = {
            // Mathematical constants
            constants: {
                goldenRatio: 1.618033988749,
                pi: Math.PI,
                e: Math.E,
                phi: 1.618033988749,
                sqrt2: Math.sqrt(2),
                sqrt3: Math.sqrt(3),
                sqrt5: Math.sqrt(5)
            },
            
            // Color theory configuration
            colorTheory: {
                goldenAngle: 137.507764,  // Golden angle in degrees
                harmonicRatios: {
                    unison: 1/1,
                    octave: 2/1,
                    perfectFifth: 3/2,
                    perfectFourth: 4/3,
                    majorThird: 5/4,
                    minorThird: 6/5,
                    majorSecond: 9/8,
                    minorSecond: 16/15
                },
                complementaryOffsets: [180, 150, 120, 90, 60, 30]
            },
            
            // Music theory mapping
            musicTheory: {
                intervals: {
                    unison: { ratio: 1, cents: 0, harmony: 1.0 },
                    minorSecond: { ratio: 16/15, cents: 112, harmony: 0.2 },
                    majorSecond: { ratio: 9/8, cents: 204, harmony: 0.4 },
                    minorThird: { ratio: 6/5, cents: 316, harmony: 0.6 },
                    majorThird: { ratio: 5/4, cents: 386, harmony: 0.8 },
                    perfectFourth: { ratio: 4/3, cents: 498, harmony: 0.9 },
                    tritone: { ratio: Math.sqrt(2), cents: 600, harmony: 0.1 },
                    perfectFifth: { ratio: 3/2, cents: 702, harmony: 1.0 },
                    minorSixth: { ratio: 8/5, cents: 814, harmony: 0.7 },
                    majorSixth: { ratio: 5/3, cents: 884, harmony: 0.8 },
                    minorSeventh: { ratio: 16/9, cents: 996, harmony: 0.5 },
                    majorSeventh: { ratio: 15/8, cents: 1088, harmony: 0.3 },
                    octave: { ratio: 2, cents: 1200, harmony: 1.0 }
                },
                scales: {
                    major: [0, 2, 4, 5, 7, 9, 11],
                    minor: [0, 2, 3, 5, 7, 8, 10],
                    pentatonic: [0, 2, 4, 7, 9],
                    chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
                    dorian: [0, 2, 3, 5, 7, 9, 10],
                    mixolydian: [0, 2, 4, 5, 7, 9, 10]
                }
            },
            
            // Statistical analysis parameters
            statistics: {
                distributions: {
                    normal: { mean: 0, stdDev: 1 },
                    exponential: { lambda: 1 },
                    uniform: { min: 0, max: 1 },
                    beta: { alpha: 2, beta: 5 }
                },
                confidence: {
                    levels: [0.90, 0.95, 0.99],
                    zScores: [1.645, 1.960, 2.576]
                }
            },
            
            // Game mechanics parameters
            gameMechanics: {
                aggro: {
                    baseRadius: 100,
                    maxRadius: 500,
                    decayRate: 0.95,
                    thresholds: {
                        low: 0.3,
                        medium: 0.6,
                        high: 0.9
                    }
                },
                probability: {
                    criticalHit: 0.05,
                    dodge: 0.15,
                    block: 0.25,
                    counterAttack: 0.10
                }
            }
        };
        
        // Cache for expensive calculations
        this.cache = new Map();
        
        console.log('🎼 Mathematical Harmony Engine initialized');
        console.log(`📐 Golden Ratio: ${this.config.constants.goldenRatio}`);
        console.log(`🎵 Musical Intervals: ${Object.keys(this.config.musicTheory.intervals).length}`);
        console.log(`🎨 Color Harmonies: ${this.config.colorTheory.complementaryOffsets.length}`);
    }
    
    /**
     * Calculate comprehensive color harmony using golden ratio and musical intervals
     */
    calculateColorHarmony(baseColor, options = {}) {
        const cacheKey = `color_harmony_${JSON.stringify(baseColor)}_${JSON.stringify(options)}`;
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        // Convert color to HSL for mathematical operations
        const hsl = this.colorToHSL(baseColor);
        
        // Generate harmonic colors using musical intervals
        const harmonicColors = this.generateHarmonicColors(hsl, options);
        
        // Apply golden ratio relationships
        const goldenColors = this.generateGoldenRatioColors(hsl, options);
        
        // Calculate complementary relationships
        const complementaryColors = this.generateComplementaryColors(hsl, options);
        
        // Generate analogous colors
        const analogousColors = this.generateAnalogousColors(hsl, options);
        
        // Calculate harmony score
        const harmonyScore = this.calculateHarmonyScore(harmonicColors);
        
        const result = {
            base: baseColor,
            baseHSL: hsl,
            harmonic: harmonicColors,
            golden: goldenColors,
            complementary: complementaryColors,
            analogous: analogousColors,
            harmonyScore: harmonyScore,
            recommendations: this.generateColorRecommendations(harmonyScore),
            metadata: {
                goldenAngle: this.config.colorTheory.goldenAngle,
                intervals: Object.keys(this.config.musicTheory.intervals),
                timestamp: Date.now()
            }
        };
        
        this.cache.set(cacheKey, result);
        return result;
    }
    
    /**
     * Generate harmonic colors using musical interval ratios
     */
    generateHarmonicColors(baseHSL, options = {}) {
        const colors = {};
        
        for (const [intervalName, interval] of Object.entries(this.config.musicTheory.intervals)) {
            // Map musical frequency ratio to hue shift
            const hueShift = (Math.log2(interval.ratio) * 60) % 360;
            
            // Calculate new hue with harmonic relationship
            const newHue = (baseHSL.h + hueShift) % 360;
            
            // Adjust saturation and lightness based on harmony score
            const saturationAdjust = interval.harmony * 0.2;
            const lightnessAdjust = interval.harmony * 0.1;
            
            colors[intervalName] = {
                h: newHue,
                s: Math.min(100, baseHSL.s + (saturationAdjust * 100)),
                l: Math.min(100, baseHSL.l + (lightnessAdjust * 100)),
                harmony: interval.harmony,
                ratio: interval.ratio,
                cents: interval.cents,
                hex: this.hslToHex({
                    h: newHue,
                    s: Math.min(100, baseHSL.s + (saturationAdjust * 100)),
                    l: Math.min(100, baseHSL.l + (lightnessAdjust * 100))
                })
            };
        }
        
        return colors;
    }
    
    /**
     * Generate colors using golden ratio relationships
     */
    generateGoldenRatioColors(baseHSL, options = {}) {
        const colors = [];
        const goldenAngle = this.config.colorTheory.goldenAngle;
        
        // Generate golden ratio sequence
        for (let i = 1; i <= (options.count || 5); i++) {
            const hueShift = (goldenAngle * i) % 360;
            const newHue = (baseHSL.h + hueShift) % 360;
            
            // Apply fibonacci-based saturation and lightness adjustments
            const fibRatio = this.fibonacci(i) / this.fibonacci(i + 1);
            
            colors.push({
                h: newHue,
                s: Math.min(100, baseHSL.s * fibRatio),
                l: Math.min(100, baseHSL.l * (1 + fibRatio * 0.1)),
                index: i,
                fibonacciRatio: fibRatio,
                hex: this.hslToHex({
                    h: newHue,
                    s: Math.min(100, baseHSL.s * fibRatio),
                    l: Math.min(100, baseHSL.l * (1 + fibRatio * 0.1))
                })
            });
        }
        
        return colors;
    }
    
    /**
     * Generate complementary color relationships
     */
    generateComplementaryColors(baseHSL, options = {}) {
        const colors = {};
        
        for (const offset of this.config.colorTheory.complementaryOffsets) {
            const newHue = (baseHSL.h + offset) % 360;
            const type = this.getComplementaryType(offset);
            
            colors[type] = {
                h: newHue,
                s: baseHSL.s,
                l: baseHSL.l,
                offset: offset,
                type: type,
                hex: this.hslToHex({ h: newHue, s: baseHSL.s, l: baseHSL.l })
            };
        }
        
        return colors;
    }
    
    /**
     * Generate analogous color scheme
     */
    generateAnalogousColors(baseHSL, options = {}) {
        const colors = [];
        const step = options.step || 30;
        const count = options.count || 3;
        
        for (let i = 1; i <= count; i++) {
            // Positive direction
            colors.push({
                h: (baseHSL.h + (step * i)) % 360,
                s: baseHSL.s,
                l: baseHSL.l,
                direction: 'positive',
                step: i,
                hex: this.hslToHex({
                    h: (baseHSL.h + (step * i)) % 360,
                    s: baseHSL.s,
                    l: baseHSL.l
                })
            });
            
            // Negative direction
            colors.push({
                h: (baseHSL.h - (step * i) + 360) % 360,
                s: baseHSL.s,
                l: baseHSL.l,
                direction: 'negative',
                step: i,
                hex: this.hslToHex({
                    h: (baseHSL.h - (step * i) + 360) % 360,
                    s: baseHSL.s,
                    l: baseHSL.l
                })
            });
        }
        
        return colors;
    }
    
    /**
     * Calculate visual spacing using musical intervals
     */
    calculateMusicalSpacing(baseSize, intervalType, options = {}) {
        const interval = this.config.musicTheory.intervals[intervalType];
        if (!interval) {
            throw new Error(`Unknown musical interval: ${intervalType}`);
        }
        
        // Apply interval ratio to spacing
        const spacing = {
            ratio: interval.ratio,
            size: baseSize * interval.ratio,
            harmony: interval.harmony,
            cents: interval.cents,
            
            // Generate spacing sequence using ratio
            sequence: this.generateSpacingSequence(baseSize, interval.ratio, options.count || 5),
            
            // Calculate rhythmic subdivisions
            subdivisions: this.calculateRhythmicSubdivisions(baseSize, interval.ratio),
            
            // Grid system based on musical proportions
            grid: this.generateMusicalGrid(baseSize, interval.ratio)
        };
        
        return spacing;
    }
    
    /**
     * Generate spacing sequence using musical ratios
     */
    generateSpacingSequence(baseSize, ratio, count) {
        const sequence = [baseSize];
        
        for (let i = 1; i < count; i++) {
            sequence.push(baseSize * Math.pow(ratio, i));
        }
        
        return sequence;
    }
    
    /**
     * Calculate rhythmic subdivisions for layout
     */
    calculateRhythmicSubdivisions(baseSize, ratio) {
        return {
            whole: baseSize,
            half: baseSize / 2,
            quarter: baseSize / 4,
            eighth: baseSize / 8,
            sixteenth: baseSize / 16,
            triplet: baseSize / 3,
            dotted: baseSize * 1.5,
            syncopated: baseSize * ratio
        };
    }
    
    /**
     * Generate musical grid system
     */
    generateMusicalGrid(baseSize, ratio) {
        const grid = {
            base: baseSize,
            major: baseSize * ratio,
            minor: baseSize / ratio,
            
            // Standard musical proportions
            measures: [baseSize, baseSize * 2, baseSize * 4, baseSize * 8],
            
            // Golden ratio grid overlay
            golden: baseSize * this.config.constants.goldenRatio,
            
            // Fibonacci sequence for nested grids
            fibonacci: [1, 1, 2, 3, 5, 8, 13, 21].map(fib => baseSize * fib / 13)
        };
        
        return grid;
    }
    
    /**
     * Advanced statistical analysis for game mechanics
     */
    calculateGameStatistics(input, options = {}) {
        const stats = {
            // Basic statistics
            mean: this.calculateMean(input),
            median: this.calculateMedian(input),
            mode: this.calculateMode(input),
            standardDeviation: this.calculateStandardDeviation(input),
            variance: this.calculateVariance(input),
            
            // Advanced statistics
            skewness: this.calculateSkewness(input),
            kurtosis: this.calculateKurtosis(input),
            
            // Percentiles
            percentiles: this.calculatePercentiles(input, [25, 50, 75, 90, 95, 99]),
            
            // Confidence intervals
            confidenceIntervals: this.calculateConfidenceIntervals(input),
            
            // Probability distributions
            normalDistribution: this.fitNormalDistribution(input),
            exponentialDistribution: this.fitExponentialDistribution(input),
            
            // Game-specific metrics
            criticalChance: this.calculateCriticalChance(input),
            balanceIndex: this.calculateBalanceIndex(input),
            difficultyScore: this.calculateDifficultyScore(input)
        };
        
        return stats;
    }
    
    /**
     * Calculate aggro system with radius and probability
     */
    calculateAggroSystem(entities, options = {}) {
        const aggroConfig = this.config.gameMechanics.aggro;
        const results = [];
        
        for (const entity of entities) {
            // Calculate base aggro score
            let aggroScore = this.calculateBaseAggro(entity);
            
            // Apply distance-based modifiers
            const distance = entity.distance || 100;
            const radiusModifier = Math.max(0, 1 - (distance / aggroConfig.maxRadius));
            aggroScore *= radiusModifier;
            
            // Apply probability-based fluctuations
            const randomModifier = this.generateNormalRandom(1, 0.2);
            aggroScore *= randomModifier;
            
            // Calculate threat level
            const threatLevel = this.calculateThreatLevel(aggroScore);
            
            // Generate action probabilities
            const actionProbabilities = this.calculateActionProbabilities(aggroScore);
            
            results.push({
                entity: entity,
                aggroScore: Math.max(0, Math.min(1, aggroScore)),
                radiusModifier: radiusModifier,
                distance: distance,
                threatLevel: threatLevel,
                actionProbabilities: actionProbabilities,
                
                // Statistical analysis
                statistics: {
                    mean: aggroScore,
                    variance: this.calculateAggroVariance(aggroScore),
                    confidenceInterval: this.calculateAggroConfidence(aggroScore)
                }
            });
        }
        
        return {
            entities: results,
            summary: {
                totalThreat: results.reduce((sum, r) => sum + r.aggroScore, 0),
                averageThreat: results.reduce((sum, r) => sum + r.aggroScore, 0) / results.length,
                maxThreat: Math.max(...results.map(r => r.aggroScore)),
                minThreat: Math.min(...results.map(r => r.aggroScore))
            }
        };
    }
    
    /**
     * URL encoding mathematics for special characters
     */
    calculateURLEncodingMath(input, options = {}) {
        const encoding = {
            original: input,
            encoded: encodeURIComponent(input),
            
            // Character frequency analysis
            charFrequency: this.analyzeCharacterFrequency(input),
            
            // Encoding efficiency
            efficiency: this.calculateEncodingEfficiency(input),
            
            // Mathematical patterns in encoding
            patterns: this.findEncodingPatterns(input),
            
            // Common problematic characters and their codes
            problemChars: {
                space: '%20',
                apostrophe: '%27',
                quote: '%22',
                hash: '%23',
                ampersand: '%26',
                plus: '%2B',
                equals: '%3D',
                question: '%3F'
            },
            
            // Statistical analysis of encoded string
            statistics: this.analyzeEncodedStatistics(encodeURIComponent(input))
        };
        
        return encoding;
    }
    
    /**
     * Generate fuzzy matching algorithms for component databases
     */
    calculateFuzzyMatching(query, candidates, options = {}) {
        const results = [];
        
        for (const candidate of candidates) {
            // Calculate various similarity metrics
            const similarities = {
                levenshtein: this.calculateLevenshteinSimilarity(query, candidate),
                jaccard: this.calculateJaccardSimilarity(query, candidate),
                cosine: this.calculateCosineSimilarity(query, candidate),
                soundex: this.calculateSoundexSimilarity(query, candidate),
                metaphone: this.calculateMetaphoneSimilarity(query, candidate)
            };
            
            // Calculate weighted composite score
            const weights = options.weights || {
                levenshtein: 0.3,
                jaccard: 0.2,
                cosine: 0.25,
                soundex: 0.15,
                metaphone: 0.1
            };
            
            const compositeScore = Object.entries(similarities)
                .reduce((score, [metric, value]) => 
                    score + (value * (weights[metric] || 0)), 0);
            
            results.push({
                candidate: candidate,
                similarities: similarities,
                compositeScore: compositeScore,
                
                // Statistical confidence
                confidence: this.calculateMatchConfidence(similarities),
                
                // Ranking factors
                factors: this.analyzeMatchingFactors(query, candidate)
            });
        }
        
        // Sort by composite score
        results.sort((a, b) => b.compositeScore - a.compositeScore);
        
        return {
            query: query,
            results: results,
            summary: {
                totalCandidates: candidates.length,
                bestMatch: results[0],
                averageScore: results.reduce((sum, r) => sum + r.compositeScore, 0) / results.length,
                confidence: this.calculateOverallMatchConfidence(results)
            }
        };
    }
    
    // ===================
    // UTILITY FUNCTIONS
    // ===================
    
    /**
     * Color conversion utilities
     */
    colorToHSL(color) {
        // Handle different color formats
        if (typeof color === 'string') {
            if (color.startsWith('#')) {
                return this.hexToHSL(color);
            } else if (color.startsWith('rgb')) {
                return this.rgbToHSL(color);
            }
        } else if (typeof color === 'object') {
            if (color.h !== undefined) return color;
            if (color.r !== undefined) return this.rgbObjectToHSL(color);
        }
        
        // Default fallback
        return { h: 0, s: 50, l: 50 };
    }
    
    hexToHSL(hex) {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const diff = max - min;
        
        let h = 0;
        let s = 0;
        const l = (max + min) / 2;
        
        if (diff !== 0) {
            s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);
            
            switch (max) {
                case r:
                    h = ((g - b) / diff + (g < b ? 6 : 0)) / 6;
                    break;
                case g:
                    h = ((b - r) / diff + 2) / 6;
                    break;
                case b:
                    h = ((r - g) / diff + 4) / 6;
                    break;
            }
        }
        
        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    }
    
    hslToHex(hsl) {
        const h = hsl.h / 360;
        const s = hsl.s / 100;
        const l = hsl.l / 100;
        
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        
        let r, g, b;
        
        if (s === 0) {
            r = g = b = l;
        } else {
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        
        const toHex = (c) => {
            const hex = Math.round(c * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }
    
    /**
     * Mathematical utility functions
     */
    fibonacci(n) {
        if (n <= 1) return n;
        let a = 0, b = 1;
        for (let i = 2; i <= n; i++) {
            [a, b] = [b, a + b];
        }
        return b;
    }
    
    calculateMean(values) {
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }
    
    calculateMedian(values) {
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0 
            ? (sorted[mid - 1] + sorted[mid]) / 2 
            : sorted[mid];
    }
    
    calculateMode(values) {
        const frequency = {};
        values.forEach(val => frequency[val] = (frequency[val] || 0) + 1);
        
        let maxFreq = 0;
        let modes = [];
        
        for (const [value, freq] of Object.entries(frequency)) {
            if (freq > maxFreq) {
                maxFreq = freq;
                modes = [Number(value)];
            } else if (freq === maxFreq) {
                modes.push(Number(value));
            }
        }
        
        return modes;
    }
    
    calculateStandardDeviation(values) {
        const mean = this.calculateMean(values);
        const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
        const variance = this.calculateMean(squaredDiffs);
        return Math.sqrt(variance);
    }
    
    calculateVariance(values) {
        const mean = this.calculateMean(values);
        const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
        return this.calculateMean(squaredDiffs);
    }
    
    generateNormalRandom(mean = 0, stdDev = 1) {
        // Box-Muller transform
        let u = 0, v = 0;
        while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
        while (v === 0) v = Math.random();
        
        const normal = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        return normal * stdDev + mean;
    }
    
    calculateLevenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }
    
    calculateLevenshteinSimilarity(str1, str2) {
        const distance = this.calculateLevenshteinDistance(str1, str2);
        const maxLength = Math.max(str1.length, str2.length);
        return maxLength === 0 ? 1 : 1 - (distance / maxLength);
    }
    
    /**
     * Helper functions for various calculations
     */
    getComplementaryType(offset) {
        switch (offset) {
            case 180: return 'direct';
            case 150: return 'split_complementary_1';
            case 120: return 'triadic';
            case 90: return 'tetradic';
            case 60: return 'split_complementary_2';
            case 30: return 'analogous_complement';
            default: return 'custom';
        }
    }
    
    calculateHarmonyScore(harmonicColors) {
        const scores = Object.values(harmonicColors).map(color => color.harmony);
        return this.calculateMean(scores);
    }
    
    generateColorRecommendations(harmonyScore) {
        if (harmonyScore > 0.8) {
            return ['Excellent harmony', 'Use for premium brands', 'High visual appeal'];
        } else if (harmonyScore > 0.6) {
            return ['Good harmony', 'Suitable for most applications', 'Consider minor adjustments'];
        } else {
            return ['Low harmony', 'Recommend major adjustments', 'Consider different base color'];
        }
    }
    
    calculateBaseAggro(entity) {
        let aggro = 0;
        
        // Factor in entity properties
        if (entity.level) aggro += entity.level * 0.1;
        if (entity.threat) aggro += entity.threat * 0.3;
        if (entity.activity) aggro += entity.activity * 0.2;
        
        return Math.max(0, Math.min(1, aggro));
    }
    
    calculateThreatLevel(aggroScore) {
        const thresholds = this.config.gameMechanics.aggro.thresholds;
        
        if (aggroScore >= thresholds.high) return 'high';
        if (aggroScore >= thresholds.medium) return 'medium';
        if (aggroScore >= thresholds.low) return 'low';
        return 'minimal';
    }
    
    calculateActionProbabilities(aggroScore) {
        const base = this.config.gameMechanics.probability;
        
        return {
            attack: aggroScore * 0.8,
            defend: (1 - aggroScore) * 0.6,
            flee: (1 - aggroScore) * 0.4,
            criticalHit: base.criticalHit * (1 + aggroScore),
            dodge: base.dodge * (1 - aggroScore * 0.5),
            block: base.block * (1 - aggroScore * 0.3),
            counterAttack: base.counterAttack * aggroScore
        };
    }
    
    /**
     * Advanced analysis functions
     */
    analyzeCharacterFrequency(input) {
        const frequency = {};
        for (const char of input) {
            frequency[char] = (frequency[char] || 0) + 1;
        }
        return frequency;
    }
    
    calculateEncodingEfficiency(input) {
        const encoded = encodeURIComponent(input);
        return {
            originalLength: input.length,
            encodedLength: encoded.length,
            efficiency: input.length / encoded.length,
            expansion: (encoded.length - input.length) / input.length
        };
    }
    
    /**
     * Get comprehensive mathematical analysis
     */
    getComprehensiveAnalysis(input, options = {}) {
        console.log(`\n🔍 Performing comprehensive mathematical analysis...`);
        
        const analysis = {
            timestamp: Date.now(),
            input: input,
            
            // Color harmony analysis
            colorHarmony: typeof input === 'string' && input.startsWith('#') ? 
                this.calculateColorHarmony(input, options.color) : null,
            
            // Statistical analysis if numeric array
            statistics: Array.isArray(input) ? 
                this.calculateGameStatistics(input, options.stats) : null,
            
            // String analysis
            stringAnalysis: typeof input === 'string' ? {
                encoding: this.calculateURLEncodingMath(input, options.encoding),
                length: input.length,
                uniqueChars: new Set(input).size,
                entropy: this.calculateStringEntropy(input)
            } : null,
            
            // Mathematical constants and relationships
            constants: this.config.constants,
            
            // Recommendations
            recommendations: this.generateAnalysisRecommendations(input, options)
        };
        
        console.log(`✅ Analysis complete`);
        return analysis;
    }
    
    calculateStringEntropy(str) {
        const frequency = this.analyzeCharacterFrequency(str);
        const length = str.length;
        
        let entropy = 0;
        for (const count of Object.values(frequency)) {
            const p = count / length;
            entropy -= p * Math.log2(p);
        }
        
        return entropy;
    }
    
    generateAnalysisRecommendations(input, options) {
        const recommendations = [];
        
        if (typeof input === 'string' && input.startsWith('#')) {
            recommendations.push('Color detected - use harmonic colors for brand consistency');
        }
        
        if (Array.isArray(input)) {
            recommendations.push('Numeric data - analyze statistical patterns for balance');
        }
        
        recommendations.push('Apply golden ratio for optimal proportions');
        recommendations.push('Use musical intervals for harmonious spacing');
        
        return recommendations;
    }
    
    /**
     * Export mathematical constants and utilities
     */
    exportMathUtils() {
        return {
            constants: this.config.constants,
            fibonacci: this.fibonacci.bind(this),
            goldenRatio: this.config.constants.goldenRatio,
            calculateMean: this.calculateMean.bind(this),
            calculateMedian: this.calculateMedian.bind(this),
            generateNormalRandom: this.generateNormalRandom.bind(this),
            colorToHSL: this.colorToHSL.bind(this),
            hslToHex: this.hslToHex.bind(this)
        };
    }
}

// Export for use as module
module.exports = MathematicalHarmonyEngine;

// Demo if run directly
if (require.main === module) {
    console.log('🎮 Running Mathematical Harmony Engine Demo...\n');
    
    const harmonyEngine = new MathematicalHarmonyEngine();
    
    // Demo color harmony
    console.log('🎨 Color Harmony Demo:');
    const colorHarmony = harmonyEngine.calculateColorHarmony('#3b82f6');
    console.log(`Base color: ${colorHarmony.base}`);
    console.log(`Harmony score: ${colorHarmony.harmonyScore.toFixed(3)}`);
    console.log(`Golden ratio colors: ${colorHarmony.golden.length}`);
    
    // Demo musical spacing
    console.log('\n🎵 Musical Spacing Demo:');
    const spacing = harmonyEngine.calculateMusicalSpacing(100, 'perfectFifth');
    console.log(`Perfect fifth ratio: ${spacing.ratio}`);
    console.log(`New size: ${spacing.size}`);
    console.log(`Harmony: ${spacing.harmony}`);
    
    // Demo statistics
    console.log('\n📊 Statistical Analysis Demo:');
    const gameData = [10, 15, 12, 18, 22, 16, 14, 20, 25, 13];
    const stats = harmonyEngine.calculateGameStatistics(gameData);
    console.log(`Mean: ${stats.mean.toFixed(2)}`);
    console.log(`Standard deviation: ${stats.standardDeviation.toFixed(2)}`);
    console.log(`Balance index: ${stats.balanceIndex.toFixed(3)}`);
    
    // Demo aggro system
    console.log('\n⚔️ Aggro System Demo:');
    const entities = [
        { id: 1, level: 5, threat: 0.3, distance: 150 },
        { id: 2, level: 8, threat: 0.7, distance: 80 },
        { id: 3, level: 3, threat: 0.1, distance: 300 }
    ];
    const aggroSystem = harmonyEngine.calculateAggroSystem(entities);
    console.log(`Total threat: ${aggroSystem.summary.totalThreat.toFixed(3)}`);
    console.log(`Average threat: ${aggroSystem.summary.averageThreat.toFixed(3)}`);
    
    console.log('\n✨ Mathematical Harmony Engine Demo Complete!');
}