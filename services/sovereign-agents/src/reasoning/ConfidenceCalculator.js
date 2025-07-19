/**
 * Confidence Calculator - Sophisticated confidence assessment for agent decisions
 */

class ConfidenceCalculator {
  constructor(options = {}) {
    this.options = {
      baseConfidence: options.baseConfidence || 0.5,
      evidenceWeight: options.evidenceWeight || 0.3,
      consistencyWeight: options.consistencyWeight || 0.2,
      complexityPenalty: options.complexityPenalty || 0.1,
      historyWeight: options.historyWeight || 0.2,
      ...options
    };

    // Historical performance tracking
    this.performanceHistory = new Map();
    this.accuracyMetrics = new Map();
  }

  /**
   * Calculate confidence for a reasoning step
   */
  calculateStepConfidence(step, context = {}) {
    let confidence = this.options.baseConfidence;

    // Factor 1: Evidence strength
    if (step.evidence && step.evidence.length > 0) {
      const evidenceScore = this.evaluateEvidence(step.evidence);
      confidence += evidenceScore * this.options.evidenceWeight;
    }

    // Factor 2: Consistency with previous steps
    if (context.previousSteps) {
      const consistencyScore = this.evaluateConsistency(step, context.previousSteps);
      confidence += consistencyScore * this.options.consistencyWeight;
    }

    // Factor 3: Task complexity
    if (context.taskComplexity) {
      const complexityAdjustment = this.adjustForComplexity(context.taskComplexity);
      confidence *= (1 - complexityAdjustment * this.options.complexityPenalty);
    }

    // Factor 4: Historical performance
    if (context.agentId && step.step) {
      const historicalScore = this.getHistoricalPerformance(context.agentId, step.step);
      confidence = confidence * (1 - this.options.historyWeight) + 
                   historicalScore * this.options.historyWeight;
    }

    // Factor 5: Environmental factors
    const environmentalAdjustment = this.assessEnvironmentalFactors(context);
    confidence *= environmentalAdjustment;

    // Ensure confidence is within bounds
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Evaluate the strength of evidence
   */
  evaluateEvidence(evidence) {
    if (!evidence || evidence.length === 0) return 0;

    let score = 0;
    
    // More evidence generally means higher confidence
    score += Math.min(0.3, evidence.length * 0.1);

    // Check evidence quality
    evidence.forEach(item => {
      if (typeof item === 'string') {
        // Longer, more detailed evidence scores higher
        score += Math.min(0.1, item.length / 1000);
        
        // Evidence with numbers/data scores higher
        if (/\d+/.test(item)) score += 0.05;
        
        // Evidence with specific references scores higher
        if (item.includes('according to') || item.includes('based on')) score += 0.05;
      } else if (typeof item === 'object') {
        // Structured evidence scores higher
        score += 0.1;
        
        // Evidence with source attribution scores highest
        if (item.source) score += 0.1;
        if (item.confidence) score += item.confidence * 0.1;
      }
    });

    return Math.min(1, score);
  }

  /**
   * Evaluate consistency with previous reasoning steps
   */
  evaluateConsistency(currentStep, previousSteps) {
    if (!previousSteps || previousSteps.length === 0) return 0.5;

    let consistencyScore = 0;
    let relevantSteps = 0;

    previousSteps.forEach(prevStep => {
      // Skip if too different in nature
      if (!this.areStepsRelated(currentStep, prevStep)) return;

      relevantSteps++;

      // Check logical flow
      if (this.followsLogically(prevStep, currentStep)) {
        consistencyScore += 0.8;
      }

      // Check for contradictions
      if (this.hasContradiction(prevStep, currentStep)) {
        consistencyScore -= 0.5;
      }

      // Check confidence trend
      if (prevStep.confidence && currentStep.confidence) {
        const confidenceDiff = Math.abs(prevStep.confidence - currentStep.confidence);
        if (confidenceDiff < 0.2) {
          consistencyScore += 0.2; // Stable confidence is good
        }
      }
    });

    if (relevantSteps === 0) return 0.5;
    
    return Math.max(0, Math.min(1, consistencyScore / relevantSteps));
  }

  /**
   * Check if steps are related enough to compare
   */
  areStepsRelated(step1, step2) {
    // Simple heuristic - check if they share common terms
    const terms1 = this.extractKeyTerms(step1.thought || step1.content || '');
    const terms2 = this.extractKeyTerms(step2.thought || step2.content || '');
    
    const overlap = terms1.filter(term => terms2.includes(term));
    return overlap.length > Math.min(terms1.length, terms2.length) * 0.2;
  }

  /**
   * Check if one step logically follows another
   */
  followsLogically(prevStep, currentStep) {
    const prevContent = prevStep.thought || prevStep.content || '';
    const currContent = currentStep.thought || currentStep.content || '';

    // Check for logical connectors
    const logicalConnectors = [
      'therefore', 'thus', 'hence', 'so', 'because',
      'as a result', 'consequently', 'this means'
    ];

    const hasConnector = logicalConnectors.some(connector => 
      currContent.toLowerCase().includes(connector)
    );

    // Check for progressive refinement
    const isRefinement = currContent.includes('specifically') ||
                        currContent.includes('in particular') ||
                        currContent.includes('more precisely');

    return hasConnector || isRefinement;
  }

  /**
   * Check for contradictions between steps
   */
  hasContradiction(step1, step2) {
    const content1 = (step1.thought || step1.content || '').toLowerCase();
    const content2 = (step2.thought || step2.content || '').toLowerCase();

    // Simple contradiction patterns
    const contradictionPairs = [
      ['should', 'should not'],
      ['will', 'will not'],
      ['can', 'cannot'],
      ['possible', 'impossible'],
      ['yes', 'no'],
      ['true', 'false']
    ];

    for (const [positive, negative] of contradictionPairs) {
      if ((content1.includes(positive) && content2.includes(negative)) ||
          (content1.includes(negative) && content2.includes(positive))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Adjust confidence based on task complexity
   */
  adjustForComplexity(complexity) {
    // Complexity on scale of 1-10
    if (typeof complexity === 'number') {
      return complexity / 10;
    }

    // Complexity as string
    const complexityMap = {
      'simple': 0.1,
      'moderate': 0.3,
      'complex': 0.5,
      'very_complex': 0.7,
      'extremely_complex': 0.9
    };

    return complexityMap[complexity] || 0.5;
  }

  /**
   * Get historical performance for agent/step combination
   */
  getHistoricalPerformance(agentId, stepType) {
    const key = `${agentId}:${stepType}`;
    const history = this.performanceHistory.get(key);
    
    if (!history || history.length === 0) {
      return this.options.baseConfidence;
    }

    // Calculate weighted average of recent performance
    const recentHistory = history.slice(-10); // Last 10 instances
    const weights = recentHistory.map((_, index) => index + 1);
    const weightSum = weights.reduce((a, b) => a + b, 0);
    
    const weightedSum = recentHistory.reduce((sum, perf, index) => {
      return sum + perf.accuracy * weights[index];
    }, 0);

    return weightedSum / weightSum;
  }

  /**
   * Assess environmental factors affecting confidence
   */
  assessEnvironmentalFactors(context) {
    let adjustment = 1.0;

    // Time pressure reduces confidence
    if (context.timeConstraint) {
      const urgencyMap = {
        'critical': 0.7,
        'high': 0.8,
        'medium': 0.9,
        'low': 1.0
      };
      adjustment *= urgencyMap[context.timeConstraint] || 0.9;
    }

    // Data quality affects confidence
    if (context.dataQuality) {
      const qualityMap = {
        'excellent': 1.1,
        'good': 1.0,
        'fair': 0.9,
        'poor': 0.7
      };
      adjustment *= qualityMap[context.dataQuality] || 0.9;
    }

    // Resource availability
    if (context.resourceConstraints) {
      adjustment *= 0.85;
    }

    return adjustment;
  }

  /**
   * Calculate aggregate confidence for entire reasoning chain
   */
  calculateChainConfidence(steps, options = {}) {
    if (!steps || steps.length === 0) return 0;

    const method = options.method || 'weighted_average';

    switch (method) {
      case 'weighted_average':
        return this.weightedAverageConfidence(steps);
      
      case 'minimum':
        return Math.min(...steps.map(s => s.confidence || 0));
      
      case 'harmonic_mean':
        return this.harmonicMeanConfidence(steps);
      
      case 'bayesian':
        return this.bayesianConfidence(steps);
      
      default:
        return this.weightedAverageConfidence(steps);
    }
  }

  /**
   * Weighted average giving more weight to recent steps
   */
  weightedAverageConfidence(steps) {
    const weights = steps.map((_, index) => Math.pow(1.1, index));
    const weightSum = weights.reduce((a, b) => a + b, 0);
    
    const weightedSum = steps.reduce((sum, step, index) => {
      return sum + (step.confidence || 0) * weights[index];
    }, 0);

    return weightedSum / weightSum;
  }

  /**
   * Harmonic mean - penalizes low confidence steps more
   */
  harmonicMeanConfidence(steps) {
    const validSteps = steps.filter(s => s.confidence > 0);
    if (validSteps.length === 0) return 0;

    const reciprocalSum = validSteps.reduce((sum, step) => {
      return sum + 1 / step.confidence;
    }, 0);

    return validSteps.length / reciprocalSum;
  }

  /**
   * Bayesian confidence calculation
   */
  bayesianConfidence(steps) {
    // Start with prior
    let posterior = this.options.baseConfidence;

    steps.forEach(step => {
      const likelihood = step.confidence || 0.5;
      const evidence = this.evaluateEvidence(step.evidence || []);
      
      // Bayes' rule simplified
      posterior = (posterior * likelihood) / 
                  (posterior * likelihood + (1 - posterior) * (1 - likelihood) * (1 - evidence));
    });

    return posterior;
  }

  /**
   * Extract key terms from text for comparison
   */
  extractKeyTerms(text) {
    // Remove common words and extract meaningful terms
    const stopWords = new Set([
      'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or',
      'but', 'in', 'with', 'to', 'for', 'of', 'as', 'by', 'that',
      'this', 'it', 'from', 'be', 'are', 'was', 'were', 'been'
    ]);

    return text.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word))
      .map(word => word.replace(/[.,!?;:]$/, ''));
  }

  /**
   * Update performance history based on feedback
   */
  updatePerformance(agentId, stepType, accuracy) {
    const key = `${agentId}:${stepType}`;
    
    if (!this.performanceHistory.has(key)) {
      this.performanceHistory.set(key, []);
    }

    const history = this.performanceHistory.get(key);
    history.push({
      timestamp: Date.now(),
      accuracy,
      stepType
    });

    // Keep only recent history
    if (history.length > 100) {
      history.shift();
    }

    // Update accuracy metrics
    this.updateAccuracyMetrics(agentId, stepType, accuracy);
  }

  /**
   * Update accuracy metrics for reporting
   */
  updateAccuracyMetrics(agentId, stepType, accuracy) {
    const key = `${agentId}:${stepType}`;
    
    if (!this.accuracyMetrics.has(key)) {
      this.accuracyMetrics.set(key, {
        count: 0,
        totalAccuracy: 0,
        minAccuracy: 1,
        maxAccuracy: 0
      });
    }

    const metrics = this.accuracyMetrics.get(key);
    metrics.count++;
    metrics.totalAccuracy += accuracy;
    metrics.minAccuracy = Math.min(metrics.minAccuracy, accuracy);
    metrics.maxAccuracy = Math.max(metrics.maxAccuracy, accuracy);
    metrics.averageAccuracy = metrics.totalAccuracy / metrics.count;
  }

  /**
   * Get confidence explanation
   */
  explainConfidence(confidence, factors) {
    const explanations = [];

    if (confidence > 0.8) {
      explanations.push("High confidence due to strong evidence and consistency");
    } else if (confidence > 0.6) {
      explanations.push("Moderate confidence with some uncertainty");
    } else if (confidence > 0.4) {
      explanations.push("Low confidence - additional validation recommended");
    } else {
      explanations.push("Very low confidence - human review required");
    }

    // Add specific factor explanations
    if (factors.evidenceScore > 0.7) {
      explanations.push("Strong supporting evidence available");
    }
    
    if (factors.consistencyScore < 0.5) {
      explanations.push("Some inconsistencies with previous reasoning");
    }

    if (factors.complexity > 0.7) {
      explanations.push("High task complexity reduces certainty");
    }

    return explanations;
  }

  /**
   * Get performance report
   */
  getPerformanceReport() {
    const report = {
      overallMetrics: {
        totalAssessments: 0,
        averageConfidence: 0
      },
      byAgent: {},
      byStepType: {}
    };

    this.accuracyMetrics.forEach((metrics, key) => {
      const [agentId, stepType] = key.split(':');
      
      report.overallMetrics.totalAssessments += metrics.count;
      
      if (!report.byAgent[agentId]) {
        report.byAgent[agentId] = {
          assessments: 0,
          averageAccuracy: 0
        };
      }
      
      report.byAgent[agentId].assessments += metrics.count;
      report.byAgent[agentId].averageAccuracy = metrics.averageAccuracy;
      
      if (!report.byStepType[stepType]) {
        report.byStepType[stepType] = {
          assessments: 0,
          averageAccuracy: 0,
          minAccuracy: metrics.minAccuracy,
          maxAccuracy: metrics.maxAccuracy
        };
      }
      
      report.byStepType[stepType] = metrics;
    });

    return report;
  }

  /**
   * Reset performance history
   */
  resetHistory() {
    this.performanceHistory.clear();
    this.accuracyMetrics.clear();
    console.log("📊 Confidence calculator history reset");
  }
}

module.exports = ConfidenceCalculator;