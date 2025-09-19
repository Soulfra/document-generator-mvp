#!/usr/bin/env node

/**
 * 🔢 BINARY DECISION ENGINE WITH FLOOR DIVISION
 * 
 * Implements a mathematical decision-making system that reduces all complex
 * debates and discussions to binary outcomes (right/wrong, 1/-1) using
 * floor division methodology.
 * 
 * Core Principle:
 * "Every decision, no matter how complex, ultimately reduces to a binary choice"
 * 
 * Floor Division Method:
 * - Takes positive and negative inputs
 * - Divides positive by total
 * - Applies floor function for deterministic results
 * - Maps to binary output: 1 (right), -1 (wrong), 0 (undecided)
 * 
 * This creates absolute answers from relative inputs, similar to how
 * floor division creates integers from real numbers.
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class BinaryDecisionEngine extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            // Decision thresholds
            approvalThreshold: options.approvalThreshold || 0.75,      // 75% for YES/RIGHT
            rejectionThreshold: options.rejectionThreshold || 0.35,    // 35% for NO/WRONG
            
            // Floor division settings
            precision: options.precision || 2,                          // Decimal places before floor
            useStrictFloor: options.useStrictFloor !== false,         // True floor vs rounding
            
            // Binary mapping
            positiveValue: options.positiveValue || 1,                 // Value for RIGHT/YES
            negativeValue: options.negativeValue || -1,                // Value for WRONG/NO
            neutralValue: options.neutralValue || 0,                   // Value for UNDECIDED
            
            // Decision modes
            mode: options.mode || 'floor_division',                    // floor_division, weighted, consensus
            allowAbstentions: options.allowAbstentions !== false,
            
            // Weighting system
            useWeights: options.useWeights || false,
            defaultWeight: options.defaultWeight || 1,
            
            // History tracking
            trackHistory: options.trackHistory !== false,
            maxHistorySize: options.maxHistorySize || 1000,
            
            ...options
        };
        
        // Decision history
        this.decisionHistory = [];
        this.statistics = {
            totalDecisions: 0,
            positiveDecisions: 0,
            negativeDecisions: 0,
            neutralDecisions: 0,
            averageConsensus: 0
        };
        
        // Decision methods
        this.decisionMethods = {
            'floor_division': this.floorDivisionMethod.bind(this),
            'weighted': this.weightedFloorMethod.bind(this),
            'consensus': this.consensusFloorMethod.bind(this),
            'absolute': this.absoluteFloorMethod.bind(this),
            'relative': this.relativeFloorMethod.bind(this)
        };
        
        // Mathematical functions
        this.mathFunctions = {
            floor: Math.floor,
            ceil: Math.ceil,
            round: Math.round,
            trunc: Math.trunc
        };
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🔢 Binary Decision Engine initializing...');
        console.log(`⚖️ Mode: ${this.config.mode}`);
        console.log(`📊 Thresholds: Approval ≥${(this.config.approvalThreshold * 100)}%, Rejection ≤${(this.config.rejectionThreshold * 100)}%`);
        console.log(`🎯 Binary values: Positive=${this.config.positiveValue}, Negative=${this.config.negativeValue}, Neutral=${this.config.neutralValue}`);
        
        this.emit('initialized', {
            config: this.config,
            timestamp: new Date()
        });
    }
    
    /**
     * Main decision method - converts inputs to binary decision
     */
    async makeDecision(inputs, options = {}) {
        try {
            const decisionId = crypto.randomUUID();
            const startTime = Date.now();
            
            console.log(`🔢 Processing binary decision: ${decisionId}`);
            
            // Validate inputs
            const validatedInputs = this.validateInputs(inputs);
            
            // Select decision method
            const method = options.method || this.config.mode;
            const decisionMethod = this.decisionMethods[method];
            
            if (!decisionMethod) {
                throw new Error(`Unknown decision method: ${method}`);
            }
            
            // Apply decision method
            const result = await decisionMethod(validatedInputs, options);
            
            // Add metadata
            result.id = decisionId;
            result.method = method;
            result.timestamp = new Date();
            result.processingTime = Date.now() - startTime;
            result.inputs = validatedInputs;
            
            // Track history
            if (this.config.trackHistory) {
                this.addToHistory(result);
            }
            
            // Update statistics
            this.updateStatistics(result);
            
            console.log(`✅ Decision complete: ${result.decision} (Binary: ${result.binaryValue})`);
            console.log(`📊 Consensus: ${(result.consensus * 100).toFixed(1)}%`);
            
            this.emit('decision_made', result);
            
            return result;
            
        } catch (error) {
            console.error('❌ Decision failed:', error);
            this.emit('decision_error', { inputs, error });
            throw error;
        }
    }
    
    /**
     * Floor Division Method - Core algorithm
     */
    floorDivisionMethod(inputs, options = {}) {
        const { positive, negative, abstain } = inputs;
        
        // Calculate total valid votes (excluding abstentions)
        const totalValid = positive + negative;
        
        if (totalValid === 0) {
            return {
                decision: 'NO_DECISION',
                binaryValue: this.config.neutralValue,
                consensus: 0,
                ratio: 0,
                floorValue: 0,
                explanation: 'No valid votes to process'
            };
        }
        
        // Calculate ratio: positive / total
        const ratio = positive / totalValid;
        
        // Apply floor division based on precision
        const scaleFactor = Math.pow(10, this.config.precision);
        const scaledRatio = ratio * scaleFactor;
        const floorValue = this.config.useStrictFloor ? 
            Math.floor(scaledRatio) / scaleFactor :
            Math.round(scaledRatio) / scaleFactor;
        
        // Determine binary decision
        let decision, binaryValue;
        
        if (floorValue >= this.config.approvalThreshold) {
            decision = 'APPROVED';
            binaryValue = this.config.positiveValue;
        } else if (floorValue <= this.config.rejectionThreshold) {
            decision = 'REJECTED';
            binaryValue = this.config.negativeValue;
        } else {
            decision = 'UNDECIDED';
            binaryValue = this.config.neutralValue;
        }
        
        // Calculate consensus strength
        const consensus = this.calculateConsensus(positive, negative, abstain);
        
        return {
            decision,
            binaryValue,
            consensus,
            ratio,
            floorValue,
            votes: { positive, negative, abstain },
            calculation: {
                method: 'floor_division',
                formula: `floor(${positive}/${totalValid} * ${scaleFactor}) / ${scaleFactor}`,
                steps: [
                    `Positive votes: ${positive}`,
                    `Negative votes: ${negative}`,
                    `Total valid: ${totalValid}`,
                    `Ratio: ${ratio.toFixed(4)}`,
                    `Scaled: ${scaledRatio.toFixed(4)}`,
                    `Floor: ${Math.floor(scaledRatio)}`,
                    `Result: ${floorValue.toFixed(this.config.precision)}`
                ]
            },
            explanation: this.generateExplanation(decision, floorValue, inputs)
        };
    }
    
    /**
     * Weighted Floor Method - Considers vote weights
     */
    weightedFloorMethod(inputs, options = {}) {
        const weights = options.weights || {};
        let weightedPositive = 0;
        let weightedNegative = 0;
        let totalWeight = 0;
        
        // Apply weights to votes
        if (inputs.votes) {
            for (const [voterId, vote] of Object.entries(inputs.votes)) {
                const weight = weights[voterId] || this.config.defaultWeight;
                totalWeight += weight;
                
                if (vote === 'positive') {
                    weightedPositive += weight;
                } else if (vote === 'negative') {
                    weightedNegative += weight;
                }
            }
        } else {
            // Simple weighted calculation
            weightedPositive = inputs.positive * (weights.positive || 1);
            weightedNegative = inputs.negative * (weights.negative || 1);
            totalWeight = weightedPositive + weightedNegative;
        }
        
        // Apply floor division to weighted values
        const weightedInputs = {
            positive: weightedPositive,
            negative: weightedNegative,
            abstain: inputs.abstain || 0
        };
        
        const result = this.floorDivisionMethod(weightedInputs, options);
        result.calculation.weighted = true;
        result.calculation.totalWeight = totalWeight;
        
        return result;
    }
    
    /**
     * Consensus Floor Method - Requires stronger agreement
     */
    consensusFloorMethod(inputs, options = {}) {
        const result = this.floorDivisionMethod(inputs, options);
        
        // Apply stricter consensus requirements
        const consensusStrength = result.consensus;
        const requiredConsensus = options.requiredConsensus || 0.8;
        
        if (consensusStrength < requiredConsensus) {
            result.decision = 'NO_CONSENSUS';
            result.binaryValue = this.config.neutralValue;
            result.explanation = `Consensus too weak: ${(consensusStrength * 100).toFixed(1)}% < ${(requiredConsensus * 100)}% required`;
        }
        
        return result;
    }
    
    /**
     * Absolute Floor Method - Uses absolute vote counts
     */
    absoluteFloorMethod(inputs, options = {}) {
        const { positive, negative } = inputs;
        const difference = positive - negative;
        const total = positive + negative;
        
        if (total === 0) {
            return {
                decision: 'NO_DECISION',
                binaryValue: this.config.neutralValue,
                consensus: 0,
                difference: 0,
                explanation: 'No votes to process'
            };
        }
        
        // Apply floor to the difference ratio
        const differenceRatio = difference / total;
        const scaleFactor = Math.pow(10, this.config.precision);
        const floorValue = Math.floor(differenceRatio * scaleFactor) / scaleFactor;
        
        // Determine decision based on absolute difference
        let decision, binaryValue;
        
        if (floorValue > 0.25) {
            decision = 'APPROVED';
            binaryValue = this.config.positiveValue;
        } else if (floorValue < -0.25) {
            decision = 'REJECTED';
            binaryValue = this.config.negativeValue;
        } else {
            decision = 'UNDECIDED';
            binaryValue = this.config.neutralValue;
        }
        
        return {
            decision,
            binaryValue,
            consensus: Math.abs(floorValue),
            difference,
            differenceRatio,
            floorValue,
            votes: inputs,
            calculation: {
                method: 'absolute_floor',
                formula: `floor((${positive} - ${negative}) / ${total} * ${scaleFactor}) / ${scaleFactor}`
            },
            explanation: `Absolute difference method: ${difference} vote difference, ratio ${floorValue.toFixed(this.config.precision)}`
        };
    }
    
    /**
     * Relative Floor Method - Compares to historical decisions
     */
    relativeFloorMethod(inputs, options = {}) {
        const baseResult = this.floorDivisionMethod(inputs, options);
        
        // Compare to historical average
        if (this.decisionHistory.length > 0) {
            const historicalAverage = this.statistics.averageConsensus;
            const relativeStrength = baseResult.consensus / historicalAverage;
            
            // Adjust decision based on relative strength
            if (relativeStrength < 0.8 && baseResult.decision === 'APPROVED') {
                baseResult.decision = 'WEAK_APPROVAL';
                baseResult.explanation += ` (Below historical average of ${(historicalAverage * 100).toFixed(1)}%)`;
            } else if (relativeStrength > 1.2 && baseResult.decision === 'APPROVED') {
                baseResult.decision = 'STRONG_APPROVAL';
                baseResult.explanation += ` (Above historical average of ${(historicalAverage * 100).toFixed(1)}%)`;
            }
            
            baseResult.relativeStrength = relativeStrength;
        }
        
        return baseResult;
    }
    
    /**
     * Multi-criteria decision with floor division
     */
    async makeMultiCriteriaDecision(criteria, options = {}) {
        console.log(`🔢 Processing multi-criteria decision with ${Object.keys(criteria).length} criteria`);
        
        const results = {};
        const binaryValues = [];
        
        // Process each criterion
        for (const [criterionName, inputs] of Object.entries(criteria)) {
            const result = await this.makeDecision(inputs, {
                ...options,
                criterion: criterionName
            });
            
            results[criterionName] = result;
            binaryValues.push(result.binaryValue);
        }
        
        // Aggregate binary values
        const aggregatedBinary = this.aggregateBinaryValues(binaryValues, options.aggregationMethod);
        
        // Determine final decision
        const finalDecision = {
            decision: this.mapBinaryToDecision(aggregatedBinary),
            binaryValue: aggregatedBinary,
            criteria: results,
            aggregationMethod: options.aggregationMethod || 'sum',
            timestamp: new Date()
        };
        
        console.log(`✅ Multi-criteria decision: ${finalDecision.decision} (Binary: ${finalDecision.binaryValue})`);
        
        this.emit('multi_criteria_decision', finalDecision);
        
        return finalDecision;
    }
    
    /**
     * Time-based decision with decay
     */
    async makeTimeBasedDecision(inputs, timeWindow, options = {}) {
        const now = Date.now();
        const decayFactor = options.decayFactor || 0.9;
        
        // Apply time decay to votes
        const decayedInputs = {
            positive: 0,
            negative: 0,
            abstain: 0
        };
        
        for (const vote of inputs.votes || []) {
            const age = now - vote.timestamp;
            const ageRatio = Math.min(age / timeWindow, 1);
            const weight = Math.pow(decayFactor, ageRatio);
            
            if (vote.type === 'positive') {
                decayedInputs.positive += weight;
            } else if (vote.type === 'negative') {
                decayedInputs.negative += weight;
            } else {
                decayedInputs.abstain += weight;
            }
        }
        
        // Make decision with decayed inputs
        const result = await this.makeDecision(decayedInputs, options);
        result.timeDecay = {
            window: timeWindow,
            decayFactor,
            originalVotes: inputs.votes?.length || 0
        };
        
        return result;
    }
    
    /**
     * Utility methods
     */
    validateInputs(inputs) {
        const validated = {
            positive: 0,
            negative: 0,
            abstain: 0
        };
        
        if (typeof inputs === 'object') {
            validated.positive = Math.max(0, Number(inputs.positive) || 0);
            validated.negative = Math.max(0, Number(inputs.negative) || 0);
            validated.abstain = Math.max(0, Number(inputs.abstain) || 0);
            
            // Copy any additional properties
            Object.keys(inputs).forEach(key => {
                if (!['positive', 'negative', 'abstain'].includes(key)) {
                    validated[key] = inputs[key];
                }
            });
        } else if (Array.isArray(inputs)) {
            // Handle array of votes
            inputs.forEach(vote => {
                if (vote === 1 || vote === 'positive') validated.positive++;
                else if (vote === -1 || vote === 'negative') validated.negative++;
                else validated.abstain++;
            });
        }
        
        return validated;
    }
    
    calculateConsensus(positive, negative, abstain) {
        const total = positive + negative + abstain;
        if (total === 0) return 0;
        
        // Consensus is how much agreement there is
        const majority = Math.max(positive, negative);
        const consensus = majority / total;
        
        return consensus;
    }
    
    generateExplanation(decision, floorValue, inputs) {
        const percentage = (floorValue * 100).toFixed(1);
        const { positive, negative, abstain } = inputs;
        
        switch (decision) {
            case 'APPROVED':
                return `Decision APPROVED with ${percentage}% support (${positive} positive, ${negative} negative${abstain > 0 ? `, ${abstain} abstain` : ''})`;
            case 'REJECTED':
                return `Decision REJECTED with only ${percentage}% support (${positive} positive, ${negative} negative${abstain > 0 ? `, ${abstain} abstain` : ''})`;
            case 'UNDECIDED':
                return `Decision UNDECIDED at ${percentage}% - between rejection (≤${(this.config.rejectionThreshold * 100)}%) and approval (≥${(this.config.approvalThreshold * 100)}%) thresholds`;
            default:
                return `${decision}: ${percentage}% consensus`;
        }
    }
    
    aggregateBinaryValues(values, method = 'sum') {
        switch (method) {
            case 'sum':
                const sum = values.reduce((a, b) => a + b, 0);
                return sum > 0 ? this.config.positiveValue : 
                       sum < 0 ? this.config.negativeValue : 
                       this.config.neutralValue;
            
            case 'majority':
                const positive = values.filter(v => v === this.config.positiveValue).length;
                const negative = values.filter(v => v === this.config.negativeValue).length;
                return positive > negative ? this.config.positiveValue :
                       negative > positive ? this.config.negativeValue :
                       this.config.neutralValue;
            
            case 'unanimous':
                const allPositive = values.every(v => v === this.config.positiveValue);
                const allNegative = values.every(v => v === this.config.negativeValue);
                return allPositive ? this.config.positiveValue :
                       allNegative ? this.config.negativeValue :
                       this.config.neutralValue;
            
            case 'average':
                const avg = values.reduce((a, b) => a + b, 0) / values.length;
                return avg > 0.5 ? this.config.positiveValue :
                       avg < -0.5 ? this.config.negativeValue :
                       this.config.neutralValue;
            
            default:
                return this.config.neutralValue;
        }
    }
    
    mapBinaryToDecision(binaryValue) {
        if (binaryValue === this.config.positiveValue) return 'APPROVED';
        if (binaryValue === this.config.negativeValue) return 'REJECTED';
        return 'UNDECIDED';
    }
    
    addToHistory(result) {
        this.decisionHistory.push(result);
        
        // Limit history size
        if (this.decisionHistory.length > this.config.maxHistorySize) {
            this.decisionHistory.shift();
        }
    }
    
    updateStatistics(result) {
        this.statistics.totalDecisions++;
        
        if (result.binaryValue === this.config.positiveValue) {
            this.statistics.positiveDecisions++;
        } else if (result.binaryValue === this.config.negativeValue) {
            this.statistics.negativeDecisions++;
        } else {
            this.statistics.neutralDecisions++;
        }
        
        // Update average consensus
        const totalConsensus = this.decisionHistory.reduce((sum, d) => sum + d.consensus, 0);
        this.statistics.averageConsensus = totalConsensus / this.decisionHistory.length;
    }
    
    /**
     * Analysis methods
     */
    analyzeDecisionPattern() {
        if (this.decisionHistory.length === 0) {
            return { pattern: 'NO_DATA', description: 'No decisions to analyze' };
        }
        
        const recentDecisions = this.decisionHistory.slice(-10);
        const recentBinary = recentDecisions.map(d => d.binaryValue);
        
        // Check for patterns
        const allPositive = recentBinary.every(b => b === this.config.positiveValue);
        const allNegative = recentBinary.every(b => b === this.config.negativeValue);
        const alternating = recentBinary.every((b, i) => 
            i === 0 || b !== recentBinary[i - 1]
        );
        
        if (allPositive) {
            return { pattern: 'POSITIVE_STREAK', description: 'Consistent approval pattern' };
        } else if (allNegative) {
            return { pattern: 'NEGATIVE_STREAK', description: 'Consistent rejection pattern' };
        } else if (alternating) {
            return { pattern: 'ALTERNATING', description: 'Alternating decision pattern' };
        } else {
            const positiveRatio = recentBinary.filter(b => b === this.config.positiveValue).length / recentBinary.length;
            return {
                pattern: 'MIXED',
                description: `Mixed pattern with ${(positiveRatio * 100).toFixed(0)}% approval rate`,
                positiveRatio
            };
        }
    }
    
    /**
     * Visualization helpers
     */
    generateASCIIVisualization(result) {
        const { positive, negative, abstain } = result.votes || {};
        const total = positive + negative + abstain;
        const barLength = 50;
        
        const positiveBar = Math.round((positive / total) * barLength);
        const negativeBar = Math.round((negative / total) * barLength);
        const abstainBar = barLength - positiveBar - negativeBar;
        
        const visualization = `
Binary Decision Visualization
=============================
Positive: ${'█'.repeat(positiveBar)}${'░'.repeat(barLength - positiveBar)} ${positive} (${(positive/total*100).toFixed(1)}%)
Negative: ${'█'.repeat(negativeBar)}${'░'.repeat(barLength - negativeBar)} ${negative} (${(negative/total*100).toFixed(1)}%)
Abstain:  ${'█'.repeat(abstainBar)}${'░'.repeat(barLength - abstainBar)} ${abstain} (${(abstain/total*100).toFixed(1)}%)

Floor Division Result: ${result.floorValue?.toFixed(this.config.precision) || 'N/A'}
Binary Decision: ${result.binaryValue} (${result.decision})
Consensus Strength: ${(result.consensus * 100).toFixed(1)}%
        `.trim();
        
        return visualization;
    }
    
    /**
     * Export decision data
     */
    exportDecisions(format = 'json') {
        const data = {
            engine: 'BinaryDecisionEngine',
            version: '1.0.0',
            config: this.config,
            statistics: this.statistics,
            history: this.decisionHistory,
            exportDate: new Date().toISOString()
        };
        
        switch (format) {
            case 'json':
                return JSON.stringify(data, null, 2);
            
            case 'csv':
                const headers = ['ID', 'Timestamp', 'Decision', 'Binary', 'Consensus', 'Positive', 'Negative', 'Abstain'];
                const rows = this.decisionHistory.map(d => [
                    d.id,
                    d.timestamp,
                    d.decision,
                    d.binaryValue,
                    d.consensus,
                    d.votes?.positive || 0,
                    d.votes?.negative || 0,
                    d.votes?.abstain || 0
                ]);
                return [headers, ...rows].map(row => row.join(',')).join('\n');
            
            case 'summary':
                return `
Binary Decision Engine Summary
==============================
Total Decisions: ${this.statistics.totalDecisions}
Positive: ${this.statistics.positiveDecisions} (${(this.statistics.positiveDecisions/this.statistics.totalDecisions*100).toFixed(1)}%)
Negative: ${this.statistics.negativeDecisions} (${(this.statistics.negativeDecisions/this.statistics.totalDecisions*100).toFixed(1)}%)
Neutral: ${this.statistics.neutralDecisions} (${(this.statistics.neutralDecisions/this.statistics.totalDecisions*100).toFixed(1)}%)
Average Consensus: ${(this.statistics.averageConsensus * 100).toFixed(1)}%

Current Pattern: ${this.analyzeDecisionPattern().description}
                `.trim();
            
            default:
                return data;
        }
    }
    
    /**
     * Get engine status
     */
    getStatus() {
        return {
            engine: 'BinaryDecisionEngine',
            status: 'active',
            mode: this.config.mode,
            thresholds: {
                approval: this.config.approvalThreshold,
                rejection: this.config.rejectionThreshold
            },
            statistics: this.statistics,
            currentPattern: this.analyzeDecisionPattern(),
            historySize: this.decisionHistory.length,
            lastDecision: this.decisionHistory[this.decisionHistory.length - 1] || null
        };
    }
}

module.exports = BinaryDecisionEngine;

// CLI execution
if (require.main === module) {
    const engine = new BinaryDecisionEngine({
        mode: process.argv.includes('--weighted') ? 'weighted' : 'floor_division',
        precision: parseInt(process.argv.find(arg => arg.startsWith('--precision='))?.split('=')[1]) || 2,
        trackHistory: !process.argv.includes('--no-history')
    });
    
    console.log('🔢 Binary Decision Engine running');
    console.log('📊 Status:', JSON.stringify(engine.getStatus(), null, 2));
    
    // Demo decisions
    if (process.argv.includes('--demo')) {
        console.log('\n🎭 Running demo decisions...\n');
        
        const demoInputs = [
            { positive: 18, negative: 6, abstain: 2, name: 'Strong Approval' },
            { positive: 8, negative: 12, abstain: 5, name: 'Clear Rejection' },
            { positive: 10, negative: 9, abstain: 3, name: 'Close Call' },
            { positive: 0, negative: 0, abstain: 10, name: 'All Abstentions' },
            { positive: 15, negative: 15, abstain: 0, name: 'Perfect Split' }
        ];
        
        (async () => {
            for (const input of demoInputs) {
                console.log(`\n--- ${input.name} ---`);
                const result = await engine.makeDecision(input);
                console.log(engine.generateASCIIVisualization(result));
                console.log('');
            }
            
            console.log('\n--- Final Summary ---');
            console.log(engine.exportDecisions('summary'));
        })();
    }
    
    // Interactive mode
    if (process.argv.includes('--interactive')) {
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        console.log('\n🎮 Interactive Binary Decision Mode');
        console.log('Enter votes as: positive,negative,abstain (e.g., 10,5,2)');
        console.log('Type "quit" to exit\n');
        
        const prompt = () => {
            rl.question('Enter votes: ', async (input) => {
                if (input.toLowerCase() === 'quit') {
                    console.log('\nFinal Statistics:');
                    console.log(engine.exportDecisions('summary'));
                    rl.close();
                    return;
                }
                
                const [positive, negative, abstain] = input.split(',').map(n => parseInt(n) || 0);
                const result = await engine.makeDecision({ positive, negative, abstain });
                console.log('\n' + engine.generateASCIIVisualization(result) + '\n');
                
                prompt();
            });
        };
        
        prompt();
    }
}