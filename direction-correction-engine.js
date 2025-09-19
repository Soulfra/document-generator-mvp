#!/usr/bin/env node

/**
 * 🧭 DIRECTION CORRECTION ENGINE
 * 
 * Game-inspired collision detection → direction correction system
 * When quality issues are detected (like raycast hits), redirects toward better content
 * 
 * Features:
 * - Collision detection with quality standards
 * - Direction vector calculation for content improvement
 * - Automatic course correction when issues are found
 * - Progressive improvement until quality targets are met
 * - Integration with vibecheck, God Filter, and cringeproof layers
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class DirectionCorrectionEngine extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            maxCorrectionAttempts: config.maxCorrectionAttempts || 3,
            qualityTarget: config.qualityTarget || 0.9,
            correctionAggression: config.correctionAggression || 0.7,
            enableProgressiveImprovement: config.enableProgressiveImprovement !== false,
            enableVectorOptimization: config.enableVectorOptimization !== false,
            correctionTimeout: config.correctionTimeout || 60000,
            ...config
        };
        
        // Load AI connector for correction queries with gas tank support
        const RealAIAPIConnector = require('./real-ai-api-connector.js');
        this.aiConnector = new RealAIAPIConnector({
            enableGasTankFallback: true,
            enableTestingMode: true
        });
        
        // Correction vectors (like movement directions in games)
        this.correctionVectors = {
            accuracy: {
                name: 'Accuracy Correction Vector',
                description: 'Direction toward more accurate content',
                weight: 1.0,
                correctionStrategies: ['fact_verification', 'source_improvement', 'claim_validation']
            },
            
            clarity: {
                name: 'Clarity Correction Vector', 
                description: 'Direction toward clearer communication',
                weight: 0.8,
                correctionStrategies: ['simplify_language', 'improve_structure', 'add_examples']
            },
            
            completeness: {
                name: 'Completeness Correction Vector',
                description: 'Direction toward more comprehensive coverage',
                weight: 0.9,
                correctionStrategies: ['fill_gaps', 'add_context', 'expand_coverage']
            },
            
            professionalism: {
                name: 'Professionalism Correction Vector',
                description: 'Direction toward more professional presentation',
                weight: 0.7,
                correctionStrategies: ['remove_cringe', 'improve_tone', 'add_citations']
            },
            
            objectivity: {
                name: 'Objectivity Correction Vector',
                description: 'Direction toward unbiased content',
                weight: 0.8,
                correctionStrategies: ['remove_bias', 'add_perspectives', 'neutral_language']
            }
        };
        
        // Quality collision detection (like raycast hit detection)
        this.collisionDetectors = {
            accuracy_collision: {
                threshold: 0.8,
                penalty: 0.3,
                correctionVector: 'accuracy'
            },
            clarity_collision: {
                threshold: 0.7,
                penalty: 0.2,
                correctionVector: 'clarity'  
            },
            completeness_collision: {
                threshold: 0.85,
                penalty: 0.25,
                correctionVector: 'completeness'
            },
            professional_collision: {
                threshold: 0.75,
                penalty: 0.2,
                correctionVector: 'professionalism'
            },
            bias_collision: {
                threshold: 0.8,
                penalty: 0.3,
                correctionVector: 'objectivity'
            }
        };
        
        console.log('🧭 Direction Correction Engine initialized');
        console.log(`🎯 Quality target: ${(this.config.qualityTarget * 100).toFixed(1)}%`);
        console.log(`⚡ Max correction attempts: ${this.config.maxCorrectionAttempts}`);
        console.log(`📊 Correction vectors: ${Object.keys(this.correctionVectors).length}`);
        
        this.initialize();
    }
    
    async initialize() {
        console.log('✅ Direction Correction Engine ready for quality collision detection');
    }
    
    /**
     * Main correction workflow - detect collisions and correct direction
     */
    async correctDirection(content, validationResults, originalQuery, options = {}) {
        console.log('\n🧭 DIRECTION CORRECTION: Analyzing quality collisions');
        console.log(`🎯 Current quality: ${this.assessCurrentQuality(validationResults).toFixed(2)}`);
        console.log(`🚀 Target quality: ${this.config.qualityTarget}`);
        
        const correctionId = crypto.randomUUID();
        const startTime = Date.now();
        
        try {
            // Phase 1: Collision detection
            console.log('\n💥 Phase 1: Quality Collision Detection');
            const collisions = await this.detectQualityCollisions(content, validationResults);
            
            // Phase 2: Vector calculation  
            console.log('\n📐 Phase 2: Correction Vector Calculation');
            const correctionVectors = await this.calculateCorrectionVectors(collisions, content, originalQuery);
            
            // Phase 3: Progressive direction correction
            console.log('\n🔄 Phase 3: Progressive Direction Correction');
            const correctionResults = await this.performProgressiveCorrection(
                content,
                correctionVectors,
                originalQuery,
                validationResults
            );
            
            // Phase 4: Final quality verification
            console.log('\n✅ Phase 4: Final Quality Verification');
            const finalVerification = await this.verifyFinalQuality(correctionResults.finalContent, originalQuery);
            
            const totalDuration = Date.now() - startTime;
            
            console.log(`\n🧭 Direction correction complete (${totalDuration}ms)`);
            console.log(`📊 Quality improvement: ${this.assessCurrentQuality(validationResults).toFixed(2)} → ${finalVerification.finalQuality.toFixed(2)}`);
            console.log(`🔄 Correction attempts: ${correctionResults.attempts}`);
            console.log(`✅ Target achieved: ${finalVerification.finalQuality >= this.config.qualityTarget ? 'YES' : 'NO'}`);
            
            return {
                correctionId,
                originalContent: content,
                finalContent: correctionResults.finalContent,
                qualityImprovement: finalVerification.finalQuality - this.assessCurrentQuality(validationResults),
                collisions: collisions,
                correctionVectors: correctionVectors,
                attempts: correctionResults.attempts,
                duration: totalDuration,
                targetAchieved: finalVerification.finalQuality >= this.config.qualityTarget,
                finalQuality: finalVerification.finalQuality
            };
            
        } catch (error) {
            console.error(`❌ Direction correction failed: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Phase 1: Detect quality collisions (like raycast hit detection)
     */
    async detectQualityCollisions(content, validationResults) {
        console.log('💥 Scanning for quality collisions...');
        
        const collisions = [];
        
        // Check each collision detector
        for (const [detectorName, detector] of Object.entries(this.collisionDetectors)) {
            const qualityScore = this.extractQualityScore(detectorName, validationResults);
            
            if (qualityScore < detector.threshold) {
                // COLLISION DETECTED!
                const collision = {
                    detector: detectorName,
                    qualityScore,
                    threshold: detector.threshold,
                    penalty: detector.penalty,
                    correctionVector: detector.correctionVector,
                    severity: (detector.threshold - qualityScore) / detector.threshold,
                    impactPoint: this.findCollisionImpactPoint(content, detectorName)
                };
                
                collisions.push(collision);
                
                console.log(`  💥 COLLISION: ${detectorName} (${qualityScore.toFixed(2)} < ${detector.threshold})`);
            } else {
                console.log(`  ✅ CLEAR: ${detectorName} (${qualityScore.toFixed(2)} ≥ ${detector.threshold})`);
            }
        }
        
        console.log(`💥 Total collisions: ${collisions.length}`);
        
        return {
            collisions,
            totalCollisions: collisions.length,
            worstCollision: collisions.sort((a, b) => b.severity - a.severity)[0],
            collisionDensity: collisions.length / (content.length / 1000)
        };
    }
    
    /**
     * Phase 2: Calculate correction vectors (like game physics direction calculation)
     */
    async calculateCorrectionVectors(collisionData, content, originalQuery) {
        console.log('📐 Calculating correction vectors...');
        
        const vectors = [];
        
        // For each collision, calculate correction vector
        for (const collision of collisionData.collisions) {
            const vector = this.correctionVectors[collision.correctionVector];
            
            // Calculate vector magnitude based on collision severity
            const magnitude = collision.severity * vector.weight * this.config.correctionAggression;
            
            // Calculate vector direction based on collision type
            const direction = await this.calculateVectorDirection(
                collision,
                content,
                originalQuery
            );
            
            vectors.push({
                name: vector.name,
                collision: collision.detector,
                magnitude,
                direction,
                strategies: vector.correctionStrategies,
                priority: magnitude * collision.severity,
                estimatedImprovement: this.estimateVectorImprovement(collision, magnitude)
            });
        }
        
        // Sort vectors by priority (most important corrections first)
        vectors.sort((a, b) => b.priority - a.priority);
        
        console.log(`  📐 ${vectors.length} correction vectors calculated`);
        for (const vector of vectors.slice(0, 3)) {
            console.log(`    ${vector.name}: magnitude ${vector.magnitude.toFixed(2)}, priority ${vector.priority.toFixed(2)}`);
        }
        
        return vectors;
    }
    
    /**
     * Phase 3: Progressive direction correction (iterative improvement)
     */
    async performProgressiveCorrection(content, correctionVectors, originalQuery, validationResults) {
        console.log('🔄 Starting progressive direction correction...');
        
        let currentContent = content;
        let attempts = 0;
        const correctionHistory = [];
        
        while (attempts < this.config.maxCorrectionAttempts) {
            attempts++;
            console.log(`\n  🔄 Correction attempt ${attempts}/${this.config.maxCorrectionAttempts}`);
            
            // Apply highest priority correction vector
            const primaryVector = correctionVectors[0];
            if (!primaryVector) break;
            
            const correctionResult = await this.applyCorrectionVector(
                currentContent,
                primaryVector,
                originalQuery,
                attempts
            );
            
            currentContent = correctionResult.correctedContent;
            correctionHistory.push(correctionResult);
            
            // Re-assess quality after correction
            const newQuality = await this.quickQualityAssessment(currentContent, originalQuery);
            
            console.log(`    📊 Quality after correction: ${newQuality.toFixed(2)}`);
            
            // Check if we've reached target quality
            if (newQuality >= this.config.qualityTarget) {
                console.log(`    ✅ Quality target achieved! (${newQuality.toFixed(2)} ≥ ${this.config.qualityTarget})`);
                break;
            }
            
            // Update vectors for next iteration
            correctionVectors = await this.recalculateVectors(correctionVectors, correctionResult, newQuality);
        }
        
        console.log(`🔄 Progressive correction complete: ${attempts} attempts`);
        
        return {
            finalContent: currentContent,
            attempts,
            correctionHistory,
            improvementPath: correctionHistory.map(c => c.qualityImprovement)
        };
    }
    
    /**
     * Apply specific correction vector to content
     */
    async applyCorrectionVector(content, vector, originalQuery, attemptNumber) {
        console.log(`    🎯 Applying ${vector.name}...`);
        
        const correctionPrompt = this.buildCorrectionPrompt(vector, content, originalQuery, attemptNumber);
        
        const correctionResult = await this.aiConnector.callAPI(
            'anthropic',
            'claude-3-opus',
            correctionPrompt,
            { maxTokens: 2048, temperature: 0.6 }
        );
        
        // Calculate quality improvement estimate
        const qualityBefore = await this.quickQualityAssessment(content, originalQuery);
        const qualityAfter = await this.quickQualityAssessment(correctionResult.response, originalQuery);
        const improvement = qualityAfter - qualityBefore;
        
        console.log(`      📈 Estimated improvement: ${(improvement * 100).toFixed(1)}%`);
        
        return {
            vector: vector.name,
            originalContent: content,
            correctedContent: correctionResult.response,
            qualityImprovement: improvement,
            cost: correctionResult.metadata.cost,
            duration: correctionResult.metadata.duration,
            attempt: attemptNumber
        };
    }
    
    /**
     * Build correction prompt for specific vector
     */
    buildCorrectionPrompt(vector, content, originalQuery, attemptNumber) {
        const basePrompt = `
DIRECTION CORRECTION: ${vector.name}

You are applying course correction like a game engine redirecting after collision detection.

ORIGINAL QUERY: "${originalQuery}"
CORRECTION ATTEMPT: ${attemptNumber}
COLLISION TYPE: ${vector.collision}
CORRECTION MAGNITUDE: ${vector.magnitude.toFixed(2)}

CONTENT TO CORRECT:
${content}

CORRECTION STRATEGIES TO APPLY:
${vector.strategies.map(s => `- ${s}`).join('\n')}
        `;
        
        const vectorPrompts = {
            'Accuracy Correction Vector': `
ACCURACY COLLISION DETECTED - Redirecting toward factual precision:

Apply these corrections:
1. Verify all factual claims
2. Replace vague statements with specific facts
3. Add authoritative sources for claims
4. Remove or qualify uncertain information
5. Ensure medical/technical accuracy

Fix any inaccurate content while maintaining the original intent.
            `,
            
            'Clarity Correction Vector': `
CLARITY COLLISION DETECTED - Redirecting toward clearer communication:

Apply these corrections:
1. Simplify complex sentences
2. Remove jargon and buzzwords
3. Add concrete examples
4. Improve logical flow
5. Break up dense paragraphs

Make the content crystal clear while preserving meaning.
            `,
            
            'Completeness Correction Vector': `
COMPLETENESS COLLISION DETECTED - Redirecting toward comprehensive coverage:

Apply these corrections:
1. Identify and fill important gaps
2. Add missing perspectives or considerations
3. Expand shallow sections with more depth
4. Address follow-up questions
5. Provide complete context

Ensure the content thoroughly addresses the original query.
            `,
            
            'Professionalism Correction Vector': `
PROFESSIONALISM COLLISION DETECTED - Redirecting toward professional standards:

Apply these corrections:
1. Remove casual or unprofessional language
2. Fix formatting and presentation issues
3. Add proper citations and references
4. Improve academic/professional tone
5. Remove any cringe or embarrassing elements

Elevate the content to professional publication standards.
            `,
            
            'Objectivity Correction Vector': `
OBJECTIVITY COLLISION DETECTED - Redirecting toward unbiased content:

Apply these corrections:
1. Remove biased language and loaded terms
2. Present multiple perspectives fairly
3. Qualify statements appropriately
4. Remove overconfident claims
5. Add nuance and balance

Ensure the content is objective and balanced.
            `
        };
        
        return basePrompt + (vectorPrompts[vector.name] || vectorPrompts['Accuracy Correction Vector']) + `

Return the corrected content that moves in the direction of higher quality.
Focus on the specific collision type that was detected.
        `;
    }
    
    /**
     * Calculate vector direction based on collision analysis
     */
    async calculateVectorDirection(collision, content, originalQuery) {
        // Analyze what specific improvements are needed
        const directionPrompt = `
VECTOR DIRECTION CALCULATION

Collision detected: ${collision.detector}
Quality score: ${collision.qualityScore} (threshold: ${collision.threshold})
Severity: ${collision.severity.toFixed(2)}

CONTENT:
${content.substring(0, 1000)}

Calculate the optimal direction for improvement:
1. What specific problems caused this collision?
2. What exact changes would fix these problems?
3. What priority order should corrections be applied?
4. What's the minimum viable improvement needed?

Return JSON:
{
  "problems": ["problem 1", "problem 2"],
  "corrections": ["correction 1", "correction 2"],
  "priority_order": [1, 2, 3],
  "minimum_improvement": 0.15,
  "direction_vector": "specific direction description"
}
        `;
        
        const result = await this.aiConnector.callAPI(
            'claude-3-sonnet',
            'claude-3-sonnet',
            directionPrompt,
            { maxTokens: 1024 }
        );
        
        return this.parseDirectionCalculation(result.response);
    }
    
    /**
     * Quick quality assessment for iterative improvement
     */
    async quickQualityAssessment(content, originalQuery) {
        // Fast quality scoring for iteration loops
        const qualityPrompt = `
QUICK QUALITY ASSESSMENT

Rate the overall quality of this content on a 0-1 scale:

QUERY: "${originalQuery}"
CONTENT: ${content.substring(0, 1500)}

Consider:
- Accuracy and factual correctness
- Clarity and readability  
- Completeness and thoroughness
- Professional presentation
- Source quality

Return just a single quality score from 0.0 to 1.0
        `;
        
        const result = await this.aiConnector.callAPI(
            'claude-3-haiku', // Fast model for quick assessment
            'claude-3-haiku',
            qualityPrompt,
            { maxTokens: 50 }
        );
        
        // Extract score from response
        const scoreMatch = result.response.match(/(\d+\.?\d*)/);
        const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0.7;
        
        return score > 1 ? score / 100 : score; // Normalize if percentage
    }
    
    /**
     * Recalculate vectors after correction attempt
     */
    async recalculateVectors(vectors, correctionResult, newQuality) {
        // Update vector priorities based on correction results
        const updatedVectors = vectors.map(vector => {
            if (vector.name === correctionResult.vector) {
                // This vector was just applied
                return {
                    ...vector,
                    magnitude: Math.max(0, vector.magnitude - 0.2), // Reduce magnitude
                    priority: vector.priority * 0.7, // Lower priority temporarily
                    lastApplied: Date.now()
                };
            } else {
                // Other vectors might need increased priority if quality still low
                const priorityBoost = newQuality < this.config.qualityTarget ? 1.1 : 1.0;
                return {
                    ...vector,
                    priority: vector.priority * priorityBoost
                };
            }
        });
        
        // Re-sort by priority
        return updatedVectors.sort((a, b) => b.priority - a.priority);
    }
    
    /**
     * Extract quality score for specific detector from validation results
     */
    extractQualityScore(detectorName, validationResults) {
        // Map detector names to validation result properties
        const scoreMap = {
            accuracy_collision: validationResults.vibecheckResults?.score || 
                               validationResults.godFilter?.standardsResults?.individual?.truth?.score || 0.7,
            clarity_collision: validationResults.godFilter?.standardsResults?.individual?.excellence?.score || 0.8,
            completeness_collision: validationResults.godFilter?.standardsResults?.individual?.completeness?.score || 0.7,
            professional_collision: validationResults.cringeproof?.professionalCheck?.score || 0.8,
            bias_collision: validationResults.godFilter?.standardsResults?.individual?.purity?.score || 0.8
        };
        
        return scoreMap[detectorName] || 0.7;
    }
    
    /**
     * Find where collision occurred in content (impact point)
     */
    findCollisionImpactPoint(content, detectorName) {
        // Simple implementation - find first problematic area
        const lines = content.split('\n');
        
        const problemPatterns = {
            accuracy_collision: /inaccurate|wrong|false|misleading/i,
            clarity_collision: /confusing|unclear|complicated|vague/i,
            completeness_collision: /incomplete|missing|partial|brief/i,
            professional_collision: /unprofessional|casual|inappropriate/i,
            bias_collision: /biased|one-sided|unfair|prejudiced/i
        };
        
        const pattern = problemPatterns[detectorName];
        if (pattern) {
            for (const [index, line] of lines.entries()) {
                if (pattern.test(line)) {
                    return {
                        lineNumber: index + 1,
                        lineContent: line,
                        characterPosition: content.indexOf(line)
                    };
                }
            }
        }
        
        return {
            lineNumber: 1,
            lineContent: lines[0] || '',
            characterPosition: 0
        };
    }
    
    /**
     * Assess current overall quality from validation results
     */
    assessCurrentQuality(validationResults) {
        let totalScore = 0;
        let scoreCount = 0;
        
        // Aggregate scores from all validation layers
        if (validationResults.vibecheckResults?.score) {
            totalScore += validationResults.vibecheckResults.score;
            scoreCount++;
        }
        
        if (validationResults.godFilter?.divineScore) {
            totalScore += validationResults.godFilter.divineScore;
            scoreCount++;
        }
        
        if (validationResults.cringeproof && !isNaN(validationResults.cringeproof.cringeScore)) {
            totalScore += (1 - validationResults.cringeproof.cringeScore); // Invert cringe score
            scoreCount++;
        }
        
        return scoreCount > 0 ? totalScore / scoreCount : 0.7;
    }
    
    /**
     * Estimate improvement potential for vector
     */
    estimateVectorImprovement(collision, magnitude) {
        // Estimate how much improvement this vector can provide
        const maxPossibleImprovement = collision.threshold - collision.qualityScore;
        const vectorEfficiency = 0.7; // Assume 70% efficiency
        
        return Math.min(maxPossibleImprovement, magnitude * vectorEfficiency);
    }
    
    /**
     * Final quality verification after all corrections
     */
    async verifyFinalQuality(finalContent, originalQuery) {
        console.log('✅ Performing final quality verification...');
        
        const verificationPrompt = `
FINAL QUALITY VERIFICATION

Assess the final quality of this corrected content:

ORIGINAL QUERY: "${originalQuery}"

FINAL CONTENT:
${finalContent}

Provide comprehensive quality assessment:
1. Overall quality score (0-1)
2. Remaining issues (if any)
3. Quality improvement achieved
4. Professional standards met
5. Ready for publication

Return JSON with detailed assessment.
        `;
        
        const result = await this.aiConnector.callAPI(
            'anthropic',
            'claude-3-opus',
            verificationPrompt,
            { maxTokens: 1024 }
        );
        
        const verification = this.parseQualityVerification(result.response);
        
        console.log(`  ✅ Final quality: ${(verification.final_quality * 100).toFixed(1)}%`);
        console.log(`  📊 Ready for publication: ${verification.ready_for_publication ? 'YES' : 'NO'}`);
        
        return {
            finalQuality: verification.final_quality,
            readyForPublication: verification.ready_for_publication,
            remainingIssues: verification.remaining_issues || [],
            verification: verification
        };
    }
    
    /**
     * Generate collision report (like game physics debugging)
     */
    generateCollisionReport(correctionResult) {
        const report = `
# 🧭 Direction Correction Report

## Collision Analysis
- **Total Collisions**: ${correctionResult.collisions.totalCollisions}
- **Worst Collision**: ${correctionResult.collisions.worstCollision?.detector || 'None'}
- **Collision Density**: ${correctionResult.collisions.collisionDensity.toFixed(2)}/1k chars

## Correction Vectors Applied
${correctionResult.correctionVectors.map(v => 
    `- **${v.name}**: magnitude ${v.magnitude.toFixed(2)}, priority ${v.priority.toFixed(2)}`
).join('\n')}

## Quality Improvement
- **Starting Quality**: ${(correctionResult.qualityImprovement + correctionResult.finalQuality - correctionResult.qualityImprovement).toFixed(2)}
- **Final Quality**: ${correctionResult.finalQuality.toFixed(2)}
- **Improvement**: +${(correctionResult.qualityImprovement * 100).toFixed(1)}%
- **Target Achieved**: ${correctionResult.targetAchieved ? 'YES' : 'NO'}

## Correction Attempts
${correctionResult.attempts} attempts in ${correctionResult.duration}ms

## Final Status
${correctionResult.targetAchieved ? 
    '✅ Content successfully corrected and ready for use' : 
    '⚠️ Content improved but may need additional work'}

---
*Generated by Direction Correction Engine*
*Like raycast hit detection → movement correction*
        `;
        
        return report;
    }
    
    /**
     * Parsing methods
     */
    parseDirectionCalculation(response) {
        try {
            return JSON.parse(response);
        } catch (error) {
            return {
                problems: ["Could not parse direction analysis"],
                corrections: ["Manual review needed"],
                priority_order: [1],
                minimum_improvement: 0.1,
                direction_vector: "General quality improvement needed"
            };
        }
    }
    
    parseQualityVerification(response) {
        try {
            return JSON.parse(response);
        } catch (error) {
            // Extract score from text
            const scoreMatch = response.match(/(\d+\.?\d*)/);
            const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0.8;
            
            return {
                final_quality: score > 1 ? score / 100 : score,
                ready_for_publication: score > 0.8,
                remaining_issues: [],
                assessment_notes: response
            };
        }
    }
    
    /**
     * Intelligent collision prioritization
     */
    prioritizeCollisions(collisions) {
        return collisions.sort((a, b) => {
            // Prioritize by severity * impact * urgency
            const scoreA = a.severity * a.penalty * (a.correctionVector === 'accuracy' ? 1.5 : 1.0);
            const scoreB = b.severity * b.penalty * (b.correctionVector === 'accuracy' ? 1.5 : 1.0);
            
            return scoreB - scoreA;
        });
    }
    
    /**
     * Get direction correction status
     */
    getStatus() {
        return {
            maxCorrectionAttempts: this.config.maxCorrectionAttempts,
            qualityTarget: this.config.qualityTarget,
            correctionAggression: this.config.correctionAggression,
            correctionVectors: Object.keys(this.correctionVectors).length,
            collisionDetectors: Object.keys(this.collisionDetectors).length,
            progressiveImprovement: this.config.enableProgressiveImprovement,
            vectorOptimization: this.config.enableVectorOptimization,
            connectorReady: this.aiConnector ? true : false
        };
    }
}

module.exports = DirectionCorrectionEngine;

// CLI interface
if (require.main === module) {
    const correctionEngine = new DirectionCorrectionEngine({
        qualityTarget: 0.9,
        maxCorrectionAttempts: 3,
        correctionAggression: 0.7
    });
    
    // Demo direction correction
    setTimeout(async () => {
        console.log('\n🧪 Testing Direction Correction Engine\n');
        
        try {
            // Mock problematic content for testing
            const problematicContent = `
Heart disease is definitely caused by stress. Everyone knows this is true.
According to some sources, cholesterol is always bad and you must avoid it completely.
This revolutionary approach will guarantee 100% results for all patients.
            `;
            
            // Mock validation results indicating collisions
            const mockValidationResults = {
                vibecheckResults: { score: 0.6 },
                godFilter: {
                    divineScore: 0.7,
                    standardsResults: {
                        individual: {
                            truth: { score: 0.6 },
                            completeness: { score: 0.7 },
                            purity: { score: 0.5 }
                        }
                    }
                },
                cringeproof: {
                    cringeScore: 0.4,
                    professionalCheck: { score: 0.6 }
                }
            };
            
            const originalQuery = "What causes heart disease?";
            
            console.log('🧭 Testing direction correction on problematic content...');
            console.log(`📝 Original content: ${problematicContent.length} characters`);
            
            const correctionResult = await correctionEngine.correctDirection(
                problematicContent,
                mockValidationResults,
                originalQuery
            );
            
            console.log('\n🧭 DIRECTION CORRECTION RESULTS:');
            console.log('===============================');
            console.log(`Quality Improvement: ${(correctionResult.qualityImprovement * 100).toFixed(1)}%`);
            console.log(`Final Quality: ${(correctionResult.finalQuality * 100).toFixed(1)}%`);
            console.log(`Target Achieved: ${correctionResult.targetAchieved ? 'YES' : 'NO'}`);
            console.log(`Correction Attempts: ${correctionResult.attempts}`);
            console.log(`Duration: ${correctionResult.duration}ms`);
            
            console.log('\n💥 Collisions Detected:');
            for (const collision of correctionResult.collisions.collisions) {
                console.log(`  ${collision.detector}: ${collision.qualityScore.toFixed(2)} < ${collision.threshold} (severity: ${collision.severity.toFixed(2)})`);
            }
            
            console.log('\n📐 Correction Vectors:');
            for (const vector of correctionResult.correctionVectors.slice(0, 3)) {
                console.log(`  ${vector.name}: magnitude ${vector.magnitude.toFixed(2)}, priority ${vector.priority.toFixed(2)}`);
            }
            
            console.log('\n📄 Content Comparison:');
            console.log('Original:');
            console.log(problematicContent.substring(0, 150) + '...');
            console.log('\nCorrected:');
            console.log(correctionResult.finalContent.substring(0, 150) + '...');
            
            // Generate collision report
            const collisionReport = correctionEngine.generateCollisionReport(correctionResult);
            console.log('\n📋 Full collision report generated');
            
            console.log('\n✨ Direction correction working like game physics!');
            console.log('   Collision detection → Vector calculation → Course correction');
            
        } catch (error) {
            console.error('❌ Direction correction test failed:', error.message);
        }
        
    }, 1000);
}