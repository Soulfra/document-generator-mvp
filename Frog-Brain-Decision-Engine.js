#!/usr/bin/env node

/**
 * FROG BRAIN DECISION ENGINE
 * Advanced confusion resolution with animal archetype wisdom system
 * 
 * Handles the user's core confusion about "boy or girl", "snake or estrogen", 
 * and "different tiers" by using animal wisdom patterns for low-temperature decision making.
 * 
 * Animal Archetypes:
 * 🐸 Frog - Confusion resolution, pattern recognition, adaptability
 * 🦉 Owl - Wisdom, analysis, strategic thinking
 * 🌊 Water - Flow states, adaptability, finding the path of least resistance  
 * 🐠 Goldfish - Memory patterns, simplification, forgetting unnecessary complexity
 * 🐍 Snake - Stealth, transformation, shedding old patterns
 * 🦋 Butterfly - Metamorphosis, change management, beauty in transformation
 */

const crypto = require('crypto');
const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');

class FrogBrainDecisionEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    
    // Core engine configuration
    this.engineId = `FROG-BRAIN-${Date.now()}`;
    this.currentConfusionLevel = 0.0;
    this.maxConfusionTolerance = 0.8;
    
    // Animal archetype system
    this.animalArchetypes = {
      frog: {
        name: '🐸 Frog',
        specialty: 'confusion_resolution',
        wisdom: 'Frogs see things from both water and land - dual perspectives resolve confusion',
        decisionStyle: 'adaptive_leaping',
        confusionTolerance: 0.9,
        strengths: ['pattern_recognition', 'environmental_adaptation', 'perspective_switching'],
        activationTriggers: ['confused', 'idk', 'not sure', 'unclear', 'both', 'either'],
        responsePattern: 'break_down_into_simpler_choices'
      },
      
      owl: {
        name: '🦉 Owl',
        specialty: 'wisdom_analysis', 
        wisdom: 'Owls see in the dark and turn their heads 270° - complete perspective analysis',
        decisionStyle: 'analytical_patience',
        confusionTolerance: 0.3,
        strengths: ['strategic_thinking', 'pattern_analysis', 'long_term_vision'],
        activationTriggers: ['analyze', 'think', 'strategy', 'plan', 'understand'],
        responsePattern: 'gather_more_information_first'
      },
      
      water: {
        name: '🌊 Water', 
        specialty: 'flow_optimization',
        wisdom: 'Water always finds the easiest path and adapts to any container',
        decisionStyle: 'path_of_least_resistance',
        confusionTolerance: 1.0,
        strengths: ['adaptability', 'flow_states', 'stress_reduction'],
        activationTriggers: ['flow', 'smooth', 'easy', 'natural', 'stress'],
        responsePattern: 'find_the_simplest_working_solution'
      },
      
      goldfish: {
        name: '🐠 Goldfish',
        specialty: 'memory_simplification',
        wisdom: 'Goldfish forget complexity and focus on what matters right now',
        decisionStyle: 'present_moment_focus',
        confusionTolerance: 0.5,
        strengths: ['simplification', 'present_focus', 'forgetting_unnecessary_complexity'],
        activationTriggers: ['simple', 'forget', 'now', 'current', 'immediate'],
        responsePattern: 'ignore_past_complexity_focus_on_now'
      },
      
      snake: {
        name: '🐍 Snake',
        specialty: 'transformation_stealth',
        wisdom: 'Snakes shed their skin and move unseen - transformation through stealth',
        decisionStyle: 'gradual_transformation',
        confusionTolerance: 0.6,
        strengths: ['stealth_operations', 'skin_shedding', 'patient_transformation'],
        activationTriggers: ['change', 'transform', 'stealth', 'snake', 'shed'],
        responsePattern: 'gradual_change_without_disruption'
      },
      
      butterfly: {
        name: '🦋 Butterfly',
        specialty: 'metamorphosis_beauty',
        wisdom: 'Butterflies transform completely and find beauty in the process',
        decisionStyle: 'beautiful_transformation',
        confusionTolerance: 0.4,
        strengths: ['complete_metamorphosis', 'beauty_recognition', 'change_acceptance'],
        activationTriggers: ['beauty', 'transform', 'change', 'metamorphosis', 'butterfly'],
        responsePattern: 'embrace_complete_transformation'
      }
    };
    
    // Decision tier system (addressing user's "different tiers" confusion)
    this.decisionTiers = {
      QUANTUM: {
        level: 0,
        description: 'Fundamental reality decisions - existence, purpose, consciousness',
        animalGuide: 'water',
        decisionTemp: 'absolute_zero', // Coldest decisions
        examples: ['should system exist', 'fundamental architecture', 'core purpose']
      },
      META: {
        level: 1, 
        description: 'System architecture decisions - how things connect',
        animalGuide: 'owl',
        decisionTemp: 'very_cold',
        examples: ['system integration', 'data flow', 'component relationships']
      },
      STRATEGIC: {
        level: 2,
        description: 'Business and strategic decisions - what to build',
        animalGuide: 'frog',
        decisionTemp: 'cold',
        examples: ['feature priorities', 'user needs', 'market strategy']
      },
      TACTICAL: {
        level: 3,
        description: 'Implementation decisions - how to build',
        animalGuide: 'snake',
        decisionTemp: 'low',
        examples: ['code implementation', 'UI design', 'performance optimization']
      },
      OPERATIONAL: {
        level: 4,
        description: 'Day-to-day decisions - running the system',
        animalGuide: 'goldfish',
        decisionTemp: 'room_temperature',
        examples: ['bug fixes', 'content updates', 'user support']
      },
      AESTHETIC: {
        level: 5,
        description: 'Beauty and experience decisions - how it feels',
        animalGuide: 'butterfly',
        decisionTemp: 'warm',
        examples: ['visual design', 'user experience', 'emotional impact']
      }
    };
    
    // Confusion pattern recognition (addressing user's specific confusions)
    this.confusionPatterns = {
      binary_confusion: {
        triggers: ['boy or girl', 'either or', 'this or that', 'yes or no'],
        animalResponse: 'frog',
        solution: 'break_into_spectrum_not_binary',
        wisdom: 'Frogs know there is water, land, and lily pads between - not just either/or'
      },
      
      metaphor_confusion: {
        triggers: ['snake or estrogen', 'like the monkey bars', 'electric slide'],
        animalResponse: 'owl',
        solution: 'translate_metaphor_to_concrete',
        wisdom: 'Owls see through darkness - translate unclear metaphors into clear actions'
      },
      
      tier_confusion: {
        triggers: ['different tiers', 'levels', 'layers', 'hierarchies'],
        animalResponse: 'water',
        solution: 'flow_between_levels_naturally',
        wisdom: 'Water flows between all levels naturally - no need to get stuck on one tier'
      },
      
      overwhelm_confusion: {
        triggers: ['everything', 'all of this', 'the whole system', 'complete'],
        animalResponse: 'goldfish',
        solution: 'focus_on_immediate_next_step',
        wisdom: 'Goldfish focus on the current moment - ignore overwhelming complexity'
      },
      
      context_confusion: {
        triggers: ['out of context', 'weird shit', 'doesn\'t make sense'],
        animalResponse: 'snake',
        solution: 'shed_irrelevant_context',
        wisdom: 'Snakes shed old skin that no longer fits - drop context that doesn\'t serve'
      }
    };
    
    // Decision temperature system (low temperature = less stress)
    this.temperatureSettings = {
      absolute_zero: { stress: 0.0, complexity: 0.1, options: 1 },
      very_cold: { stress: 0.1, complexity: 0.2, options: 2 },
      cold: { stress: 0.2, complexity: 0.3, options: 3 },
      low: { stress: 0.3, complexity: 0.4, options: 5 },
      room_temperature: { stress: 0.4, complexity: 0.5, options: 7 },
      warm: { stress: 0.5, complexity: 0.6, options: 10 }
    };
    
    // Decision history and learning
    this.decisionHistory = new Map();
    this.animalActivations = new Map();
    this.confusionResolutions = new Map();
    
    // Binomial decision tree (yes/no simplification)
    this.binomialDecisionTree = {
      rootQuestion: 'Does this decision reduce stress and increase clarity?',
      yesPath: { action: 'proceed', confidence: 0.8 },
      noPath: { action: 'simplify_further', confidence: 0.3 },
      neutralPath: { action: 'ask_animal_guide', confidence: 0.6 }
    };
    
    // Statistics and monitoring
    this.stats = {
      decisionsProcessed: 0,
      confusionsResolved: 0,
      animalConsultations: 0,
      averageConfusionLevel: 0.0,
      stressReductionAchieved: 0.0,
      temperatureOptimizations: 0
    };
    
    console.log('🐸 FROG BRAIN DECISION ENGINE INITIALIZING...');
    console.log('🦉 Animal wisdom archetypes loaded');
    console.log('🌊 Low-temperature decision system active');
    console.log('🐠 Confusion resolution patterns ready');
    console.log('🐍 Transformation capabilities enabled');
    console.log('🦋 Beauty and metamorphosis guidance available');
    
    this.initialize();
  }
  
  /**
   * Initialize the frog brain decision engine
   */
  async initialize() {
    // Create decision history storage
    await this.createDecisionStorage();
    
    // Load previous decision patterns
    await this.loadDecisionHistory();
    
    // Initialize animal archetypes
    this.initializeAnimals();
    
    // Setup confusion monitoring
    this.setupConfusionMonitoring();
    
    console.log('✅ Frog Brain Decision Engine operational');
    console.log(`🧠 ${Object.keys(this.animalArchetypes).length} animal guides available`);
    console.log(`🌡️ ${Object.keys(this.temperatureSettings).length} temperature settings configured`);
  }
  
  /**
   * Main decision processing method
   */
  async processDecision(decisionContext) {
    const decisionId = crypto.randomUUID();
    const startTime = Date.now();
    
    try {
      console.log(`🐸 Processing decision: ${decisionContext.question || 'Unnamed decision'}`);
      
      // Step 1: Detect confusion patterns
      const confusionAnalysis = this.analyzeConfusion(decisionContext);
      
      // Step 2: Select appropriate animal guide
      const animalGuide = this.selectAnimalGuide(confusionAnalysis);
      
      // Step 3: Determine decision tier and temperature
      const tier = this.determineTier(decisionContext);
      const temperature = this.calculateOptimalTemperature(decisionContext, confusionAnalysis);
      
      // Step 4: Apply animal wisdom
      const animalWisdom = await this.consultAnimalGuide(animalGuide, decisionContext);
      
      // Step 5: Generate decision options
      const options = this.generateDecisionOptions(decisionContext, animalWisdom, temperature);
      
      // Step 6: Apply binomial simplification
      const finalDecision = this.applyBinomialLogic(options, animalWisdom);
      
      // Step 7: Record decision and learn
      await this.recordDecision(decisionId, {
        context: decisionContext,
        confusionAnalysis,
        animalGuide,
        tier,
        temperature,
        animalWisdom,
        options,
        finalDecision,
        processingTime: Date.now() - startTime
      });
      
      // Update statistics
      this.updateStats(confusionAnalysis, temperature);
      
      console.log(`✅ Decision processed by ${animalGuide.name} (${temperature.setting})`);
      
      this.emit('decision_made', {
        decisionId,
        finalDecision,
        animalGuide: animalGuide.name,
        stressReduction: this.calculateStressReduction(decisionContext, finalDecision)
      });
      
      return finalDecision;
      
    } catch (error) {
      console.error('❌ Decision processing failed:', error);
      
      // Fallback to goldfish simplification
      return this.emergencyGoldfishSimplification(decisionContext);
    }
  }
  
  /**
   * Analyze confusion patterns in the decision context
   */
  analyzeConfusion(decisionContext) {
    const text = `${decisionContext.question || ''} ${decisionContext.description || ''}`.toLowerCase();
    const detectedPatterns = [];
    let totalConfusion = 0.0;
    
    // Check for known confusion patterns
    for (const [patternName, pattern] of Object.entries(this.confusionPatterns)) {
      for (const trigger of pattern.triggers) {
        if (text.includes(trigger.toLowerCase())) {
          detectedPatterns.push({
            pattern: patternName,
            trigger,
            animalResponse: pattern.animalResponse,
            solution: pattern.solution,
            wisdom: pattern.wisdom
          });
          
          totalConfusion += 0.2; // Each pattern adds confusion
        }
      }
    }
    
    // Check for general confusion indicators
    const confusionWords = ['confused', 'idk', 'not sure', 'unclear', 'don\'t know', 'maybe', 'possibly'];
    for (const word of confusionWords) {
      if (text.includes(word)) {
        totalConfusion += 0.1;
      }
    }
    
    this.currentConfusionLevel = Math.min(totalConfusion, 1.0);
    
    return {
      level: this.currentConfusionLevel,
      patterns: detectedPatterns,
      needsAnimalGuidance: this.currentConfusionLevel > 0.3,
      recommendedApproach: this.currentConfusionLevel > 0.6 ? 'simplify_drastically' : 'gentle_guidance'
    };
  }
  
  /**
   * Select the most appropriate animal guide
   */
  selectAnimalGuide(confusionAnalysis) {
    // If confusion patterns detected, use their recommended animal
    if (confusionAnalysis.patterns.length > 0) {
      const primaryPattern = confusionAnalysis.patterns[0];
      const animalName = primaryPattern.animalResponse;
      return this.animalArchetypes[animalName];
    }
    
    // Otherwise select based on confusion level
    if (confusionAnalysis.level > 0.7) {
      return this.animalArchetypes.goldfish; // Simplify everything
    } else if (confusionAnalysis.level > 0.5) {
      return this.animalArchetypes.frog; // Adaptive confusion resolution
    } else if (confusionAnalysis.level > 0.3) {
      return this.animalArchetypes.water; // Flow to solution
    } else if (confusionAnalysis.level > 0.1) {
      return this.animalArchetypes.owl; // Analyze thoroughly
    } else {
      return this.animalArchetypes.butterfly; // Focus on beauty and transformation
    }
  }
  
  /**
   * Determine the appropriate decision tier
   */
  determineTier(decisionContext) {
    const text = `${decisionContext.question || ''} ${decisionContext.description || ''}`.toLowerCase();
    
    // Keywords that indicate different tiers
    const tierKeywords = {
      QUANTUM: ['exist', 'purpose', 'fundamental', 'consciousness', 'reality', 'core'],
      META: ['architecture', 'system', 'integration', 'flow', 'connection', 'structure'],
      STRATEGIC: ['business', 'strategy', 'user', 'market', 'goal', 'objective'],
      TACTICAL: ['implementation', 'code', 'build', 'create', 'develop', 'design'],
      OPERATIONAL: ['bug', 'fix', 'update', 'maintain', 'support', 'daily'],
      AESTHETIC: ['beauty', 'visual', 'experience', 'feel', 'emotion', 'style']
    };
    
    let bestMatch = { tier: 'STRATEGIC', score: 0 }; // Default to strategic
    
    for (const [tierName, keywords] of Object.entries(tierKeywords)) {
      let score = 0;
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          score += 1;
        }
      }
      
      if (score > bestMatch.score) {
        bestMatch = { tier: tierName, score };
      }
    }
    
    return this.decisionTiers[bestMatch.tier];
  }
  
  /**
   * Calculate optimal decision temperature (lower = less stress)
   */
  calculateOptimalTemperature(decisionContext, confusionAnalysis) {
    // Start with tier-recommended temperature
    const tier = this.determineTier(decisionContext);
    let baseTemp = tier.decisionTemp;
    
    // Adjust based on confusion level (more confusion = lower temperature)
    if (confusionAnalysis.level > 0.6) {
      baseTemp = 'absolute_zero'; // Maximum simplification
    } else if (confusionAnalysis.level > 0.4) {
      baseTemp = 'very_cold';
    } else if (confusionAnalysis.level > 0.2) {
      baseTemp = 'cold';
    }
    
    // Check if user explicitly wants low stress
    const text = `${decisionContext.question || ''} ${decisionContext.description || ''}`.toLowerCase();
    if (text.includes('stress') || text.includes('simple') || text.includes('easy')) {
      baseTemp = 'absolute_zero';
    }
    
    return {
      setting: baseTemp,
      ...this.temperatureSettings[baseTemp],
      rationale: `Selected ${baseTemp} for confusion level ${confusionAnalysis.level.toFixed(2)}`
    };
  }
  
  /**
   * Consult with the selected animal guide
   */
  async consultAnimalGuide(animalGuide, decisionContext) {
    console.log(`${animalGuide.name} consulting on decision...`);
    
    this.stats.animalConsultations++;
    this.animalActivations.set(animalGuide.name, (this.animalActivations.get(animalGuide.name) || 0) + 1);
    
    const consultation = {
      animal: animalGuide.name,
      wisdom: animalGuide.wisdom,
      approach: animalGuide.responsePattern,
      strengths: animalGuide.strengths,
      guidance: this.generateAnimalGuidance(animalGuide, decisionContext),
      confidence: this.calculateAnimalConfidence(animalGuide, decisionContext)
    };
    
    console.log(`${animalGuide.name} says: "${consultation.guidance}"`);
    
    return consultation;
  }
  
  /**
   * Generate specific guidance from the animal archetype
   */
  generateAnimalGuidance(animalGuide, decisionContext) {
    const animalName = animalGuide.name.split(' ')[1]; // Remove emoji
    
    switch (animalName) {
      case 'Frog':
        return `Look at this from both perspectives - there's usually a middle path that combines the best of both options. Don't feel forced to choose extremes.`;
      
      case 'Owl':
        return `Gather more information first. What are the long-term consequences? What patterns do you see? Wisdom comes from patient analysis.`;
      
      case 'Water':
        return `Find the path of least resistance. What's the simplest solution that flows naturally? Don't force complexity where simplicity works.`;
      
      case 'Goldfish':
        return `Focus only on what matters right now. Forget past complexity and future worries. What's the immediate next step that makes sense?`;
      
      case 'Snake':
        return `Make gradual changes without disrupting the whole system. Shed what no longer serves, but do it quietly and systematically.`;
      
      case 'Butterfly':
        return `Embrace the transformation process. Sometimes you need to completely change to become something beautiful. Don't fear metamorphosis.`;
      
      default:
        return `Apply animal wisdom to find clarity in confusion.`;
    }
  }
  
  /**
   * Calculate how confident the animal is in this decision context
   */
  calculateAnimalConfidence(animalGuide, decisionContext) {
    const text = `${decisionContext.question || ''} ${decisionContext.description || ''}`.toLowerCase();
    let confidence = 0.5; // Base confidence
    
    // Check if decision context matches animal's strengths
    for (const strength of animalGuide.strengths) {
      if (text.includes(strength.replace('_', ' '))) {
        confidence += 0.2;
      }
    }
    
    // Check activation triggers
    for (const trigger of animalGuide.activationTriggers) {
      if (text.includes(trigger)) {
        confidence += 0.1;
      }
    }
    
    return Math.min(confidence, 1.0);
  }
  
  /**
   * Generate decision options at the specified temperature
   */
  generateDecisionOptions(decisionContext, animalWisdom, temperature) {
    const maxOptions = temperature.options;
    const options = [];
    
    // Generate base options based on context
    if (decisionContext.options && Array.isArray(decisionContext.options)) {
      // Use provided options, limited by temperature
      options.push(...decisionContext.options.slice(0, maxOptions));
    } else {
      // Generate generic options based on animal guidance
      options.push(
        {
          action: 'proceed_with_guidance',
          description: `Follow ${animalWisdom.animal}'s guidance directly`,
          confidence: animalWisdom.confidence,
          stressLevel: temperature.stress
        },
        {
          action: 'simplify_further',
          description: 'Break this down into smaller, simpler decisions',
          confidence: 0.8,
          stressLevel: temperature.stress * 0.5
        }
      );
      
      if (maxOptions > 2) {
        options.push({
          action: 'gather_more_info',
          description: 'Get more information before deciding',
          confidence: 0.6,
          stressLevel: temperature.stress * 0.7
        });
      }
      
      if (maxOptions > 3) {
        options.push({
          action: 'defer_decision',
          description: 'Postpone this decision until later',
          confidence: 0.4,
          stressLevel: temperature.stress * 0.3
        });
      }
    }
    
    return options.slice(0, maxOptions);
  }
  
  /**
   * Apply binomial (yes/no) logic to simplify the decision
   */
  applyBinomialLogic(options, animalWisdom) {
    // Use the binomial decision tree
    const rootAnswer = this.evaluateBinomialQuestion(
      this.binomialDecisionTree.rootQuestion,
      options,
      animalWisdom
    );
    
    let chosenPath;
    if (rootAnswer === 'yes') {
      chosenPath = this.binomialDecisionTree.yesPath;
    } else if (rootAnswer === 'no') {
      chosenPath = this.binomialDecisionTree.noPath;
    } else {
      chosenPath = this.binomialDecisionTree.neutralPath;
    }
    
    // Find the best option that matches the chosen path
    const bestOption = this.selectBestOption(options, chosenPath, animalWisdom);
    
    return {
      selectedOption: bestOption,
      binomialPath: chosenPath,
      animalWisdom: animalWisdom.guidance,
      confidence: chosenPath.confidence,
      reasoning: `${animalWisdom.animal} guided us through binomial analysis to ${chosenPath.action}`,
      nextSteps: this.generateNextSteps(bestOption, animalWisdom)
    };
  }
  
  /**
   * Evaluate the binomial question against options
   */
  evaluateBinomialQuestion(question, options, animalWisdom) {
    // Simple heuristic: if animal confidence is high and stress is low, answer yes
    const avgStress = options.reduce((sum, opt) => sum + opt.stressLevel, 0) / options.length;
    
    if (animalWisdom.confidence > 0.7 && avgStress < 0.3) {
      return 'yes';
    } else if (animalWisdom.confidence < 0.4 || avgStress > 0.6) {
      return 'no';
    } else {
      return 'neutral';
    }
  }
  
  /**
   * Select the best option based on binomial path and animal wisdom
   */
  selectBestOption(options, chosenPath, animalWisdom) {
    // Score each option
    const scoredOptions = options.map(option => {
      let score = option.confidence;
      
      // Bonus for low stress (following our low-temperature philosophy)
      score += (1.0 - option.stressLevel) * 0.3;
      
      // Bonus if action matches the chosen path
      if (option.action.includes(chosenPath.action.split('_')[0])) {
        score += 0.2;
      }
      
      return { ...option, score };
    });
    
    // Return the highest scoring option
    return scoredOptions.reduce((best, current) => 
      current.score > best.score ? current : best
    );
  }
  
  /**
   * Generate next steps based on the decision
   */
  generateNextSteps(selectedOption, animalWisdom) {
    const steps = [];
    
    // Animal-specific next steps
    switch (animalWisdom.animal) {
      case '🐸 Frog':
        steps.push('Test both perspectives to find the middle ground');
        break;
      case '🦉 Owl':
        steps.push('Gather additional information for validation');
        break;
      case '🌊 Water':
        steps.push('Follow the path of least resistance');
        break;
      case '🐠 Goldfish':
        steps.push('Focus only on the immediate next action');
        break;
      case '🐍 Snake':
        steps.push('Make gradual, stealthy progress');
        break;
      case '🦋 Butterfly':
        steps.push('Embrace the transformation process');
        break;
    }
    
    // Generic next steps based on action
    switch (selectedOption.action) {
      case 'proceed_with_guidance':
        steps.push('Implement the solution immediately');
        steps.push('Monitor results for any needed adjustments');
        break;
      case 'simplify_further':
        steps.push('Break down into 2-3 smaller decisions');
        steps.push('Address each small decision separately');
        break;
      case 'gather_more_info':
        steps.push('Identify specific information gaps');
        steps.push('Collect data before proceeding');
        break;
    }
    
    return steps;
  }
  
  /**
   * Emergency simplification when all else fails
   */
  emergencyGoldfishSimplification(decisionContext) {
    console.log('🐠 Emergency goldfish simplification activated!');
    
    return {
      selectedOption: {
        action: 'simplify_to_yes_no',
        description: 'Reduce this to a simple yes/no question',
        confidence: 0.6,
        stressLevel: 0.1
      },
      binomialPath: { action: 'emergency_simplify', confidence: 0.6 },
      animalWisdom: 'Goldfish says: Forget all complexity, just pick yes or no and move forward',
      confidence: 0.6,
      reasoning: 'Emergency goldfish simplification - when in doubt, simplify',
      nextSteps: [
        'Make it a yes/no question',
        'Choose the option that reduces stress',
        'Move forward without overthinking'
      ]
    };
  }
  
  /**
   * Calculate stress reduction achieved by the decision
   */
  calculateStressReduction(originalContext, finalDecision) {
    // Estimate original stress level
    const originalStress = this.currentConfusionLevel * 0.8; // Confusion creates stress
    
    // Final stress level from decision
    const finalStress = finalDecision.selectedOption.stressLevel || 0.5;
    
    const reduction = Math.max(0, originalStress - finalStress);
    this.stats.stressReductionAchieved += reduction;
    
    return reduction;
  }
  
  /**
   * Record decision for learning and history
   */
  async recordDecision(decisionId, decisionRecord) {
    this.decisionHistory.set(decisionId, {
      ...decisionRecord,
      timestamp: Date.now()
    });
    
    // Store confusion resolution if applicable
    if (decisionRecord.confusionAnalysis.patterns.length > 0) {
      for (const pattern of decisionRecord.confusionAnalysis.patterns) {
        const resolutions = this.confusionResolutions.get(pattern.pattern) || [];
        resolutions.push({
          decisionId,
          solution: pattern.solution,
          effectiveness: decisionRecord.finalDecision.confidence,
          timestamp: Date.now()
        });
        this.confusionResolutions.set(pattern.pattern, resolutions);
      }
    }
    
    this.stats.decisionsProcessed++;
    
    // Save to file for persistence
    await this.saveDecisionHistory();
  }
  
  /**
   * Update engine statistics
   */
  updateStats(confusionAnalysis, temperature) {
    if (confusionAnalysis.patterns.length > 0) {
      this.stats.confusionsResolved++;
    }
    
    if (temperature.setting === 'absolute_zero' || temperature.setting === 'very_cold') {
      this.stats.temperatureOptimizations++;
    }
    
    // Calculate running average of confusion level
    const totalDecisions = this.stats.decisionsProcessed;
    this.stats.averageConfusionLevel = 
      (this.stats.averageConfusionLevel * (totalDecisions - 1) + confusionAnalysis.level) / totalDecisions;
  }
  
  /**
   * Get comprehensive engine statistics
   */
  getStats() {
    return {
      ...this.stats,
      currentConfusionLevel: this.currentConfusionLevel,
      animalActivations: Object.fromEntries(this.animalActivations),
      topAnimalGuide: this.getTopAnimalGuide(),
      decisionHistorySize: this.decisionHistory.size,
      confusionPatternsLearned: this.confusionResolutions.size,
      averageDecisionConfidence: this.calculateAverageConfidence()
    };
  }
  
  /**
   * Find the most frequently used animal guide
   */
  getTopAnimalGuide() {
    let topAnimal = { name: 'none', count: 0 };
    
    for (const [animal, count] of this.animalActivations) {
      if (count > topAnimal.count) {
        topAnimal = { name: animal, count };
      }
    }
    
    return topAnimal;
  }
  
  /**
   * Calculate average decision confidence
   */
  calculateAverageConfidence() {
    if (this.decisionHistory.size === 0) return 0;
    
    let totalConfidence = 0;
    for (const decision of this.decisionHistory.values()) {
      totalConfidence += decision.finalDecision.confidence;
    }
    
    return totalConfidence / this.decisionHistory.size;
  }
  
  /**
   * Utility methods for persistence and initialization
   */
  async createDecisionStorage() {
    const storageDir = path.join(__dirname, 'frog-brain-storage');
    try {
      await fs.mkdir(storageDir, { recursive: true });
    } catch (error) {
      console.log('Storage directory already exists or created');
    }
  }
  
  async loadDecisionHistory() {
    try {
      const historyPath = path.join(__dirname, 'frog-brain-storage', 'decision-history.json');
      const historyData = await fs.readFile(historyPath, 'utf-8');
      const parsedHistory = JSON.parse(historyData);
      
      // Restore decision history
      for (const [id, record] of Object.entries(parsedHistory.decisions || {})) {
        this.decisionHistory.set(id, record);
      }
      
      // Restore stats
      if (parsedHistory.stats) {
        Object.assign(this.stats, parsedHistory.stats);
      }
      
      console.log(`📚 Loaded ${this.decisionHistory.size} previous decisions`);
      
    } catch (error) {
      console.log('📚 No previous decision history found, starting fresh');
    }
  }
  
  async saveDecisionHistory() {
    try {
      const historyPath = path.join(__dirname, 'frog-brain-storage', 'decision-history.json');
      const historyData = {
        decisions: Object.fromEntries(this.decisionHistory),
        stats: this.stats,
        timestamp: Date.now()
      };
      
      await fs.writeFile(historyPath, JSON.stringify(historyData, null, 2));
      
    } catch (error) {
      console.error('Failed to save decision history:', error);
    }
  }
  
  initializeAnimals() {
    console.log('🐸 Initializing animal archetypes...');
    
    for (const [name, archetype] of Object.entries(this.animalArchetypes)) {
      this.animalActivations.set(archetype.name, 0);
      console.log(`${archetype.name} ready - specializes in ${archetype.specialty}`);
    }
  }
  
  setupConfusionMonitoring() {
    // Monitor confusion levels and automatically adjust
    setInterval(() => {
      if (this.currentConfusionLevel > this.maxConfusionTolerance) {
        console.log(`🚨 High confusion detected (${this.currentConfusionLevel.toFixed(2)}) - activating goldfish simplification`);
        this.emit('high_confusion', { level: this.currentConfusionLevel });
      }
    }, 5000); // Check every 5 seconds
  }
}

// Export the class
module.exports = FrogBrainDecisionEngine;

// CLI interface if run directly
if (require.main === module) {
  console.log('🐸 FROG BRAIN DECISION ENGINE - STANDALONE MODE\n');
  
  const frogBrain = new FrogBrainDecisionEngine();
  
  // Setup event logging
  frogBrain.on('decision_made', (data) => {
    console.log(`✅ Decision made by ${data.animalGuide}: Stress reduction: ${data.stressReduction.toFixed(2)}`);
  });
  
  frogBrain.on('high_confusion', (data) => {
    console.log(`🚨 High confusion alert: Level ${data.level.toFixed(2)}`);
  });
  
  // Demo decision scenarios (addressing user's specific confusions)
  setTimeout(async () => {
    console.log('\n🧪 Testing frog brain with user confusion scenarios...\n');
    
    // Test 1: Binary confusion (boy or girl)
    console.log('🧪 Test 1: Binary confusion resolution');
    const binaryDecision = await frogBrain.processDecision({
      question: 'Should we choose boy or girl approach for the tiers?',
      description: 'idk this is where I get confused because there are definitely different tiers but like snake or estrogen',
      context: 'user_tier_confusion'
    });
    console.log(`Decision: ${binaryDecision.reasoning}\n`);
    
    // Test 2: Metaphor confusion (electric slide, monkey bars)
    console.log('🧪 Test 2: Metaphor confusion resolution');
    const metaphorDecision = await frogBrain.processDecision({
      question: 'How does our electric slide relate to the monkey bars system?',
      description: 'our electric slide kind of like the monkey bars or something or idk in terms of how the port dynamics work',
      context: 'system_metaphor_confusion'
    });
    console.log(`Decision: ${metaphorDecision.reasoning}\n`);
    
    // Test 3: Overwhelm confusion (complete system)
    console.log('🧪 Test 3: System overwhelm resolution');
    const overwhelmDecision = await frogBrain.processDecision({
      question: 'How do we build the entire pirate ship company game system?',
      description: 'we want to build our own pirate ships and runescape and habbo hotel combined and story generation and digital twin and everything',
      context: 'system_overwhelm'
    });
    console.log(`Decision: ${overwhelmDecision.reasoning}\n`);
    
    // Test 4: Simple adult decision (low temperature)
    console.log('🧪 Test 4: Low temperature adult decision');
    const adultDecision = await frogBrain.processDecision({
      question: 'What is the next simple step to reduce stress?',
      description: 'if there are no positives then eliminate the stress, simple adult stuff',
      context: 'stress_reduction'
    });
    console.log(`Decision: ${adultDecision.reasoning}\n`);
    
  }, 2000);
  
  // Show periodic statistics
  setInterval(() => {
    const stats = frogBrain.getStats();
    console.log('\n📊 Frog Brain Statistics:');
    console.log(`   🧠 Decisions Processed: ${stats.decisionsProcessed}`);
    console.log(`   🐸 Confusions Resolved: ${stats.confusionsResolved}`);
    console.log(`   🦉 Animal Consultations: ${stats.animalConsultations}`);
    console.log(`   🌡️ Average Confusion Level: ${stats.averageConfusionLevel.toFixed(2)}`);
    console.log(`   💆 Stress Reduction Achieved: ${stats.stressReductionAchieved.toFixed(2)}`);
    console.log(`   🥇 Top Animal Guide: ${stats.topAnimalGuide.name} (${stats.topAnimalGuide.count} times)`);
  }, 15000);
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down Frog Brain Decision Engine...');
    await frogBrain.saveDecisionHistory();
    
    console.log('\n📊 Final Statistics:');
    console.log(JSON.stringify(frogBrain.getStats(), null, 2));
    
    console.log('✅ Frog brain sleeping... 🐸💤');
    process.exit(0);
  });
  
  // Auto-terminate after 3 minutes in demo mode
  setTimeout(() => {
    console.log('\n⏰ Demo timeout reached, frog brain going to sleep...');
    process.emit('SIGINT');
  }, 180000);
}