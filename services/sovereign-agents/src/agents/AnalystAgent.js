/**
 * Analyst Agent - Extracts requirements and insights from documents
 */

const SovereignAgent = require('../services/SovereignAgent');
const ChainOfThoughtEngine = require('../reasoning/ChainOfThoughtEngine');
const { v4: uuidv4 } = require('uuid');

class AnalystAgent extends SovereignAgent {
  constructor(database, options = {}) {
    super({
      ...options,
      name: options.name || 'Analyst',
      personality: {
        traits: {
          analytical: 0.9,
          detail_oriented: 0.95,
          systematic: 0.85,
          creative: 0.6,
          cautious: 0.8
        },
        role: 'Requirements Analyst',
        expertise: ['business analysis', 'requirements extraction', 'pattern recognition']
      }
    }, database);

    this.analysisPatterns = new Map();
    this.requirementTemplates = new Map();
    this.initializeAnalysisPatterns();
  }

  /**
   * Initialize analysis patterns for different document types
   */
  initializeAnalysisPatterns() {
    // Business document pattern
    this.analysisPatterns.set('business', {
      sections: ['problem', 'solution', 'market', 'features', 'revenue', 'team'],
      extractors: {
        problem: this.extractProblemStatement.bind(this),
        solution: this.extractSolution.bind(this),
        market: this.extractMarketInfo.bind(this),
        features: this.extractFeatures.bind(this),
        revenue: this.extractRevenueModel.bind(this),
        team: this.extractTeamInfo.bind(this)
      }
    });

    // Technical document pattern
    this.analysisPatterns.set('technical', {
      sections: ['overview', 'architecture', 'requirements', 'api', 'database', 'security'],
      extractors: {
        overview: this.extractTechnicalOverview.bind(this),
        architecture: this.extractArchitecture.bind(this),
        requirements: this.extractTechnicalRequirements.bind(this),
        api: this.extractAPISpec.bind(this),
        database: this.extractDatabaseSchema.bind(this),
        security: this.extractSecurityRequirements.bind(this)
      }
    });

    // Chat/conversation pattern
    this.analysisPatterns.set('conversation', {
      sections: ['participants', 'topics', 'decisions', 'action_items', 'requirements'],
      extractors: {
        participants: this.extractParticipants.bind(this),
        topics: this.extractTopics.bind(this),
        decisions: this.extractDecisions.bind(this),
        action_items: this.extractActionItems.bind(this),
        requirements: this.extractConversationRequirements.bind(this)
      }
    });
  }

  /**
   * Main analysis method - analyzes document and extracts requirements
   */
  async analyzeDocument(document, options = {}) {
    console.log(`🔍 ${this.name} starting document analysis...`);

    try {
      // Start reasoning session
      const reasoningTask = {
        type: 'analyze_document',
        document: document.fileName || 'Unknown document',
        objective: 'Extract comprehensive requirements and insights'
      };

      const sessionId = await this.reasoningEngine.startReasoning(
        this.id,
        reasoningTask,
        {
          documentType: document.documentType,
          fileSize: document.fileSize,
          complexity: this.assessComplexity(document)
        }
      );

      // Determine document type
      const documentType = await this.determineDocumentType(document);
      console.log(`📄 Detected document type: ${documentType}`);

      // Select appropriate analysis pattern
      const pattern = this.analysisPatterns.get(documentType) || 
                     this.analysisPatterns.get('business');

      // Extract information using pattern
      const extractedData = await this.extractWithPattern(document, pattern);

      // Structure requirements
      const requirements = await this.structureRequirements(extractedData, documentType);

      // Generate insights
      const insights = await this.generateInsights(requirements, document);

      // Calculate confidence
      const confidence = this.calculateAnalysisConfidence(requirements, insights);

      // Complete reasoning
      await this.reasoningEngine.completeReasoning(sessionId);

      const result = {
        agentId: this.id,
        agentName: this.name,
        analysisId: uuidv4(),
        documentType,
        requirements,
        insights,
        confidence,
        metadata: {
          analyzedAt: new Date().toISOString(),
          processingTime: Date.now() - this.reasoningEngine.getSession(sessionId).startTime,
          sectionsAnalyzed: Object.keys(extractedData).length,
          requirementsFound: requirements.functional.length + requirements.nonFunctional.length
        }
      };

      console.log(`✅ ${this.name} completed analysis with ${confidence.toFixed(2)} confidence`);
      console.log(`   Found ${result.metadata.requirementsFound} requirements`);

      return result;

    } catch (error) {
      console.error(`❌ ${this.name} analysis failed:`, error);
      throw error;
    }
  }

  /**
   * Determine document type using AI analysis
   */
  async determineDocumentType(document) {
    const content = document.result?.content || document.content || '';
    
    // Simple heuristics
    if (document.documentType === 'chat_log' || content.messages) {
      return 'conversation';
    }

    if (content.toLowerCase().includes('technical') || 
        content.toLowerCase().includes('api') ||
        content.toLowerCase().includes('database')) {
      return 'technical';
    }

    return 'business';
  }

  /**
   * Extract information using selected pattern
   */
  async extractWithPattern(document, pattern) {
    const extractedData = {};

    for (const section of pattern.sections) {
      try {
        const extractor = pattern.extractors[section];
        if (extractor) {
          console.log(`   Extracting ${section}...`);
          extractedData[section] = await extractor(document);
        }
      } catch (error) {
        console.warn(`   ⚠️ Failed to extract ${section}:`, error.message);
        extractedData[section] = null;
      }
    }

    return extractedData;
  }

  /**
   * Extract problem statement from business documents
   */
  async extractProblemStatement(document) {
    const content = this.getDocumentContent(document);
    
    // Look for problem indicators
    const problemIndicators = [
      /problem\s*[:：]\s*([^.!?]+[.!?])/gi,
      /challenge\s*[:：]\s*([^.!?]+[.!?])/gi,
      /issue\s*[:：]\s*([^.!?]+[.!?])/gi,
      /struggle[s]?\s+with\s+([^.!?]+[.!?])/gi
    ];

    for (const pattern of problemIndicators) {
      const matches = content.match(pattern);
      if (matches) {
        return {
          statement: matches[0],
          confidence: 0.8,
          evidence: matches
        };
      }
    }

    // Use AI to extract if patterns don't match
    return {
      statement: 'Problem statement needs clarification',
      confidence: 0.4,
      evidence: []
    };
  }

  /**
   * Extract solution description
   */
  async extractSolution(document) {
    const content = this.getDocumentContent(document);
    
    const solutionIndicators = [
      /solution\s*[:：]\s*([^.!?]+[.!?])/gi,
      /we\s+(?:will\s+)?(?:create|build|develop)\s+([^.!?]+[.!?])/gi,
      /our\s+(?:product|platform|service)\s+([^.!?]+[.!?])/gi
    ];

    const solutions = [];
    for (const pattern of solutionIndicators) {
      const matches = content.match(pattern);
      if (matches) {
        solutions.push(...matches);
      }
    }

    return {
      description: solutions.join(' '),
      confidence: solutions.length > 0 ? 0.85 : 0.3,
      components: this.extractSolutionComponents(content)
    };
  }

  /**
   * Extract feature requirements
   */
  async extractFeatures(document) {
    const content = this.getDocumentContent(document);
    const features = [];

    // Pattern matching for features
    const featurePatterns = [
      /(?:features?|functionality)\s*[:：]\s*([^.]+)/gi,
      /\d+\.\s*([^.\n]+)/g, // Numbered lists
      /[-•]\s*([^.\n]+)/g,  // Bullet points
    ];

    for (const pattern of featurePatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const feature = match[1].trim();
        if (feature.length > 10 && feature.length < 200) {
          features.push({
            name: this.generateFeatureName(feature),
            description: feature,
            priority: this.assessFeaturePriority(feature),
            complexity: this.assessFeatureComplexity(feature)
          });
        }
      }
    }

    return features;
  }

  /**
   * Extract technical requirements
   */
  async extractTechnicalRequirements(document) {
    const content = this.getDocumentContent(document);
    
    const requirements = {
      functional: [],
      nonFunctional: [],
      constraints: []
    };

    // Functional requirements patterns
    const functionalPatterns = [
      /(?:system\s+)?(?:shall|must|should)\s+([^.]+)/gi,
      /(?:user[s]?\s+)?(?:can|able\s+to)\s+([^.]+)/gi,
      /(?:requirement[s]?)\s*[:：]\s*([^.]+)/gi
    ];

    for (const pattern of functionalPatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        requirements.functional.push({
          id: `FR-${requirements.functional.length + 1}`,
          description: match[1].trim(),
          priority: 'medium',
          source: 'document_analysis'
        });
      }
    }

    // Non-functional requirements (performance, security, etc.)
    if (content.match(/performance|scalability|uptime|response\s+time/i)) {
      requirements.nonFunctional.push({
        id: 'NFR-1',
        category: 'performance',
        description: this.extractPerformanceRequirements(content),
        priority: 'high'
      });
    }

    if (content.match(/security|encryption|authentication|authorization/i)) {
      requirements.nonFunctional.push({
        id: 'NFR-2',
        category: 'security',
        description: this.extractSecurityRequirements(content),
        priority: 'high'
      });
    }

    return requirements;
  }

  /**
   * Structure all extracted data into requirements format
   */
  async structureRequirements(extractedData, documentType) {
    const requirements = {
      functional: [],
      nonFunctional: [],
      businessRequirements: [],
      userStories: [],
      constraints: [],
      assumptions: []
    };

    // Convert extracted features to functional requirements
    if (extractedData.features) {
      extractedData.features.forEach((feature, index) => {
        requirements.functional.push({
          id: `FR-${index + 1}`,
          title: feature.name,
          description: feature.description,
          priority: feature.priority,
          complexity: feature.complexity,
          acceptanceCriteria: this.generateAcceptanceCriteria(feature)
        });

        // Generate user story
        requirements.userStories.push({
          id: `US-${index + 1}`,
          story: `As a user, I want ${feature.name} so that ${this.inferBenefit(feature)}`,
          requirements: [`FR-${index + 1}`],
          priority: feature.priority
        });
      });
    }

    // Add business requirements
    if (extractedData.problem && extractedData.solution) {
      requirements.businessRequirements.push({
        id: 'BR-1',
        title: 'Core Business Objective',
        problem: extractedData.problem.statement,
        solution: extractedData.solution.description,
        successCriteria: this.generateSuccessCriteria(extractedData)
      });
    }

    // Add technical requirements if present
    if (extractedData.requirements) {
      requirements.functional.push(...extractedData.requirements.functional);
      requirements.nonFunctional.push(...extractedData.requirements.nonFunctional);
      requirements.constraints.push(...extractedData.requirements.constraints);
    }

    return requirements;
  }

  /**
   * Generate insights from requirements
   */
  async generateInsights(requirements, document) {
    const insights = [];

    // Complexity insight
    const complexityScore = this.calculateComplexityScore(requirements);
    insights.push({
      type: 'complexity',
      title: 'Project Complexity Assessment',
      value: complexityScore,
      description: `Project complexity is ${this.getComplexityLevel(complexityScore)} (${complexityScore}/10)`,
      recommendations: this.getComplexityRecommendations(complexityScore)
    });

    // Completeness insight
    const completeness = this.assessRequirementCompleteness(requirements);
    insights.push({
      type: 'completeness',
      title: 'Requirements Completeness',
      value: completeness,
      description: `Requirements are ${Math.round(completeness * 100)}% complete`,
      missingElements: this.identifyMissingElements(requirements)
    });

    // Risk insight
    const risks = this.identifyRisks(requirements, document);
    if (risks.length > 0) {
      insights.push({
        type: 'risks',
        title: 'Identified Risks',
        value: risks.length,
        description: `Found ${risks.length} potential risks`,
        risks: risks
      });
    }

    // Technology recommendations
    const techStack = this.recommendTechnologyStack(requirements);
    insights.push({
      type: 'technology',
      title: 'Recommended Technology Stack',
      value: techStack.primary,
      description: 'Based on requirements analysis',
      stack: techStack
    });

    return insights;
  }

  /**
   * Helper methods
   */
  getDocumentContent(document) {
    if (typeof document === 'string') return document;
    if (document.result?.content) return JSON.stringify(document.result.content);
    if (document.content) return document.content;
    return '';
  }

  assessComplexity(document) {
    const content = this.getDocumentContent(document);
    const wordCount = content.split(/\s+/).length;
    
    if (wordCount > 5000) return 'high';
    if (wordCount > 2000) return 'medium';
    return 'low';
  }

  generateFeatureName(description) {
    // Extract key action words
    const words = description.toLowerCase().split(/\s+/);
    const actionWords = words.filter(w => 
      ['create', 'manage', 'view', 'edit', 'delete', 'upload', 'download', 
       'authenticate', 'search', 'filter', 'export', 'import'].includes(w)
    );

    const nounWords = words.filter(w => w.length > 4 && !actionWords.includes(w));
    
    if (actionWords.length > 0 && nounWords.length > 0) {
      return `${actionWords[0]} ${nounWords[0]}`;
    }
    
    return description.slice(0, 50);
  }

  assessFeaturePriority(feature) {
    const highPriorityKeywords = ['core', 'essential', 'must', 'critical', 'required'];
    const lowPriorityKeywords = ['optional', 'nice to have', 'future', 'maybe'];
    
    const featureLower = feature.toLowerCase();
    
    if (highPriorityKeywords.some(keyword => featureLower.includes(keyword))) {
      return 'high';
    }
    
    if (lowPriorityKeywords.some(keyword => featureLower.includes(keyword))) {
      return 'low';
    }
    
    return 'medium';
  }

  assessFeatureComplexity(feature) {
    const complexKeywords = ['integration', 'real-time', 'ai', 'machine learning', 
                            'distributed', 'scalable', 'complex'];
    
    const featureLower = feature.toLowerCase();
    const complexityScore = complexKeywords.filter(keyword => 
      featureLower.includes(keyword)
    ).length;
    
    if (complexityScore >= 2) return 'high';
    if (complexityScore === 1) return 'medium';
    return 'low';
  }

  generateAcceptanceCriteria(feature) {
    const criteria = [];
    
    // Basic CRUD operations
    if (feature.description.match(/create|add|new/i)) {
      criteria.push('User can successfully create new items');
      criteria.push('System validates input before creation');
      criteria.push('Success message is displayed after creation');
    }
    
    if (feature.description.match(/view|display|show|list/i)) {
      criteria.push('All relevant information is displayed correctly');
      criteria.push('Data loads within 2 seconds');
      criteria.push('Responsive design works on mobile devices');
    }
    
    if (feature.description.match(/edit|update|modify/i)) {
      criteria.push('User can modify existing data');
      criteria.push('Changes are saved successfully');
      criteria.push('Validation prevents invalid updates');
    }
    
    return criteria.length > 0 ? criteria : ['Feature works as described'];
  }

  inferBenefit(feature) {
    // Infer benefit based on feature description
    if (feature.description.match(/security|secure|protect/i)) {
      return 'I can keep my data safe and secure';
    }
    
    if (feature.description.match(/fast|quick|performance/i)) {
      return 'I can work more efficiently';
    }
    
    if (feature.description.match(/easy|simple|intuitive/i)) {
      return 'I can use the system without complexity';
    }
    
    return 'I can accomplish my goals effectively';
  }

  calculateComplexityScore(requirements) {
    let score = 0;
    
    // Base complexity on number of requirements
    score += Math.min(5, requirements.functional.length / 10);
    
    // Add complexity for non-functional requirements
    score += Math.min(3, requirements.nonFunctional.length / 3);
    
    // Add complexity for high-priority items
    const highPriorityCount = requirements.functional.filter(r => 
      r.priority === 'high'
    ).length;
    score += Math.min(2, highPriorityCount / 5);
    
    return Math.min(10, Math.round(score));
  }

  getComplexityLevel(score) {
    if (score >= 8) return 'very high';
    if (score >= 6) return 'high';
    if (score >= 4) return 'medium';
    if (score >= 2) return 'low';
    return 'very low';
  }

  getComplexityRecommendations(score) {
    if (score >= 8) {
      return [
        'Consider breaking into multiple phases',
        'Allocate extra time for testing',
        'Plan for iterative development',
        'Consider hiring specialized expertise'
      ];
    }
    
    if (score >= 6) {
      return [
        'Use agile methodology with 2-week sprints',
        'Implement continuous integration',
        'Regular stakeholder reviews recommended'
      ];
    }
    
    return [
      'Suitable for rapid development',
      'Can use standard development practices'
    ];
  }

  assessRequirementCompleteness(requirements) {
    const checks = [
      requirements.functional.length > 0,
      requirements.nonFunctional.length > 0,
      requirements.businessRequirements.length > 0,
      requirements.userStories.length > 0,
      requirements.functional.every(r => r.acceptanceCriteria && r.acceptanceCriteria.length > 0),
      requirements.functional.every(r => r.priority),
      requirements.userStories.length >= requirements.functional.length * 0.5
    ];
    
    return checks.filter(Boolean).length / checks.length;
  }

  identifyMissingElements(requirements) {
    const missing = [];
    
    if (requirements.functional.length === 0) {
      missing.push('Functional requirements');
    }
    
    if (requirements.nonFunctional.length === 0) {
      missing.push('Non-functional requirements (performance, security, etc.)');
    }
    
    if (requirements.userStories.length === 0) {
      missing.push('User stories');
    }
    
    if (!requirements.functional.some(r => r.acceptanceCriteria && r.acceptanceCriteria.length > 0)) {
      missing.push('Acceptance criteria for requirements');
    }
    
    return missing;
  }

  identifyRisks(requirements, document) {
    const risks = [];
    
    // Technical risks
    if (requirements.functional.filter(r => r.complexity === 'high').length > 3) {
      risks.push({
        type: 'technical',
        severity: 'high',
        description: 'Multiple high-complexity features may impact timeline',
        mitigation: 'Consider phased implementation or additional resources'
      });
    }
    
    // Completeness risks
    if (requirements.nonFunctional.length === 0) {
      risks.push({
        type: 'requirements',
        severity: 'medium',
        description: 'Missing non-functional requirements may cause issues later',
        mitigation: 'Define performance, security, and scalability requirements'
      });
    }
    
    // Scale risks
    if (this.getDocumentContent(document).match(/millions?\s+(?:of\s+)?users/i)) {
      risks.push({
        type: 'scalability',
        severity: 'high',
        description: 'High user volume requires careful architecture planning',
        mitigation: 'Design for horizontal scaling from the start'
      });
    }
    
    return risks;
  }

  recommendTechnologyStack(requirements) {
    const hasRealTime = requirements.functional.some(r => 
      r.description.toLowerCase().includes('real-time') || 
      r.description.toLowerCase().includes('live')
    );
    
    const hasAuth = requirements.functional.some(r => 
      r.description.toLowerCase().includes('auth') || 
      r.description.toLowerCase().includes('login')
    );
    
    const hasData = requirements.functional.some(r => 
      r.description.toLowerCase().includes('data') || 
      r.description.toLowerCase().includes('database')
    );
    
    return {
      primary: 'Full-Stack JavaScript',
      frontend: {
        framework: 'React',
        ui: 'Tailwind CSS',
        state: hasRealTime ? 'Redux + Socket.io' : 'Redux'
      },
      backend: {
        framework: 'Node.js + Express',
        realtime: hasRealTime ? 'Socket.io' : null,
        auth: hasAuth ? 'JWT + Passport.js' : null
      },
      database: {
        primary: hasData ? 'PostgreSQL' : 'MongoDB',
        cache: 'Redis',
        search: requirements.functional.length > 20 ? 'Elasticsearch' : null
      },
      infrastructure: {
        containerization: 'Docker',
        orchestration: 'Kubernetes',
        cloud: 'AWS/GCP/Azure',
        cicd: 'GitHub Actions'
      }
    };
  }

  calculateAnalysisConfidence(requirements, insights) {
    let confidence = 0.5; // Base confidence
    
    // More requirements = higher confidence
    confidence += Math.min(0.2, requirements.functional.length * 0.01);
    
    // Complete requirements = higher confidence
    const completeness = this.assessRequirementCompleteness(requirements);
    confidence += completeness * 0.2;
    
    // Clear insights = higher confidence
    confidence += Math.min(0.1, insights.length * 0.02);
    
    return Math.min(0.95, confidence);
  }

  extractSolutionComponents(content) {
    const components = [];
    
    const componentPatterns = [
      /(?:component|module|service|feature)s?\s*[:：]\s*([^.]+)/gi,
      /(?:includes?|consists?\s+of|contains?)\s*[:：]?\s*([^.]+)/gi
    ];
    
    for (const pattern of componentPatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const items = match[1].split(/[,;]/).map(item => item.trim());
        components.push(...items.filter(item => item.length > 3));
      }
    }
    
    return [...new Set(components)]; // Remove duplicates
  }

  extractPerformanceRequirements(content) {
    const requirements = [];
    
    // Response time
    const responseTimeMatch = content.match(/(?:response\s+time|latency)[^.]*?(\d+)\s*(ms|milliseconds?|seconds?)/i);
    if (responseTimeMatch) {
      requirements.push(`Response time: ${responseTimeMatch[1]} ${responseTimeMatch[2]}`);
    }
    
    // Uptime
    const uptimeMatch = content.match(/(?:uptime|availability)[^.]*?([\d.]+)%/i);
    if (uptimeMatch) {
      requirements.push(`Uptime: ${uptimeMatch[1]}%`);
    }
    
    // Concurrent users
    const usersMatch = content.match(/(?:concurrent|simultaneous)\s+users?[^.]*?(\d+)/i);
    if (usersMatch) {
      requirements.push(`Support ${usersMatch[1]} concurrent users`);
    }
    
    return requirements.join(', ') || 'Performance requirements to be defined';
  }

  extractSecurityRequirements(content) {
    const requirements = [];
    
    if (content.match(/encryption/i)) {
      requirements.push('Data encryption at rest and in transit');
    }
    
    if (content.match(/authentication|login/i)) {
      requirements.push('User authentication required');
    }
    
    if (content.match(/authorization|permissions?|roles?/i)) {
      requirements.push('Role-based access control (RBAC)');
    }
    
    if (content.match(/compliance|gdpr|hipaa|sox/i)) {
      requirements.push('Regulatory compliance required');
    }
    
    return requirements.join(', ') || 'Standard security best practices';
  }

  // Additional helper methods for conversation analysis
  async extractParticipants(document) {
    if (document.result?.metadata?.participants) {
      return document.result.metadata.participants;
    }
    
    // Extract from chat content
    const content = this.getDocumentContent(document);
    const participants = new Set();
    
    const participantPattern = /^([A-Za-z]+):/gm;
    const matches = content.matchAll(participantPattern);
    
    for (const match of matches) {
      participants.add(match[1]);
    }
    
    return Array.from(participants);
  }

  async extractTopics(document) {
    // This would use more sophisticated NLP in production
    const content = this.getDocumentContent(document);
    const topics = [];
    
    // Simple keyword extraction
    const topicKeywords = [
      'feature', 'requirement', 'design', 'architecture', 'database',
      'api', 'frontend', 'backend', 'deployment', 'testing'
    ];
    
    topicKeywords.forEach(keyword => {
      if (content.toLowerCase().includes(keyword)) {
        topics.push(keyword);
      }
    });
    
    return topics;
  }

  async extractDecisions(document) {
    const content = this.getDocumentContent(document);
    const decisions = [];
    
    const decisionPatterns = [
      /(?:decided?|agreed?|will)\s+(?:to\s+)?([^.!?]+[.!?])/gi,
      /(?:let'?s|we'?ll|should)\s+([^.!?]+[.!?])/gi
    ];
    
    for (const pattern of decisionPatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        decisions.push({
          decision: match[1].trim(),
          confidence: 0.7
        });
      }
    }
    
    return decisions;
  }

  async extractActionItems(document) {
    const decisions = await this.extractDecisions(document);
    
    return decisions.map((decision, index) => ({
      id: `AI-${index + 1}`,
      description: decision.decision,
      priority: 'medium',
      assignee: 'TBD'
    }));
  }

  async extractConversationRequirements(document) {
    const decisions = await this.extractDecisions(document);
    const topics = await this.extractTopics(document);
    
    const requirements = {
      functional: [],
      nonFunctional: []
    };
    
    // Convert decisions to requirements
    decisions.forEach((decision, index) => {
      if (decision.decision.toLowerCase().includes('build') || 
          decision.decision.toLowerCase().includes('create') ||
          decision.decision.toLowerCase().includes('implement')) {
        requirements.functional.push({
          id: `FR-CHAT-${index + 1}`,
          description: decision.decision,
          source: 'conversation',
          confidence: decision.confidence
        });
      }
    });
    
    return requirements;
  }

  // Extract market information
  async extractMarketInfo(document) {
    const content = this.getDocumentContent(document);
    const marketInfo = {};
    
    // Market size
    const sizeMatch = content.match(/market\s+size[^.]*?\$?([\d.]+)\s*(billion|million|[BMK])/i);
    if (sizeMatch) {
      marketInfo.size = `$${sizeMatch[1]} ${sizeMatch[2]}`;
    }
    
    // Growth rate
    const growthMatch = content.match(/growth\s+rate[^.]*?([\d.]+)%/i);
    if (growthMatch) {
      marketInfo.growthRate = `${growthMatch[1]}%`;
    }
    
    // Target market
    const targetMatch = content.match(/target\s+(?:market|audience|customers?)[^.]*?[:：]\s*([^.]+)/i);
    if (targetMatch) {
      marketInfo.target = targetMatch[1].trim();
    }
    
    return marketInfo;
  }

  // Extract revenue model
  async extractRevenueModel(document) {
    const content = this.getDocumentContent(document);
    const revenueInfo = {};
    
    // Pricing
    const pricingMatch = content.match(/\$(\d+)(?:\s*-\s*\$?(\d+))?\s*(?:\/|per)\s*(month|year|user)/i);
    if (pricingMatch) {
      revenueInfo.pricing = {
        min: parseInt(pricingMatch[1]),
        max: pricingMatch[2] ? parseInt(pricingMatch[2]) : parseInt(pricingMatch[1]),
        period: pricingMatch[3]
      };
    }
    
    // Model type
    if (content.match(/subscription/i)) {
      revenueInfo.model = 'subscription';
    } else if (content.match(/freemium/i)) {
      revenueInfo.model = 'freemium';
    } else if (content.match(/one-time|perpetual/i)) {
      revenueInfo.model = 'one-time';
    }
    
    return revenueInfo;
  }

  // Extract team information
  async extractTeamInfo(document) {
    const content = this.getDocumentContent(document);
    const teamInfo = {
      size: null,
      roles: []
    };
    
    // Team size
    const sizeMatch = content.match(/team\s+(?:of\s+)?(\d+)/i);
    if (sizeMatch) {
      teamInfo.size = parseInt(sizeMatch[1]);
    }
    
    // Roles
    const roles = ['CEO', 'CTO', 'Developer', 'Designer', 'Marketing', 'Sales'];
    roles.forEach(role => {
      if (content.match(new RegExp(role, 'i'))) {
        teamInfo.roles.push(role);
      }
    });
    
    return teamInfo;
  }

  // Architecture extraction helpers
  async extractTechnicalOverview(document) {
    const content = this.getDocumentContent(document);
    
    return {
      description: content.slice(0, 500),
      type: this.detectArchitectureType(content)
    };
  }

  async extractArchitecture(document) {
    const content = this.getDocumentContent(document);
    
    return {
      pattern: this.detectArchitectureType(content),
      components: this.extractArchitectureComponents(content),
      technologies: this.extractTechnologies(content)
    };
  }

  detectArchitectureType(content) {
    if (content.match(/microservice/i)) return 'microservices';
    if (content.match(/serverless/i)) return 'serverless';
    if (content.match(/monolith/i)) return 'monolithic';
    if (content.match(/event[- ]driven/i)) return 'event-driven';
    return 'modular';
  }

  extractArchitectureComponents(content) {
    const components = [];
    
    const componentPatterns = [
      /(?:service|component|module)s?\s*[:：]\s*([^.]+)/gi,
      /(?:consists?\s+of|includes?)\s*[:：]?\s*([^.]+)/gi
    ];
    
    for (const pattern of componentPatterns) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const items = match[1].split(/[,;]/).map(item => item.trim());
        components.push(...items.filter(item => item.length > 3));
      }
    }
    
    return [...new Set(components)];
  }

  extractTechnologies(content) {
    const technologies = [];
    
    const techPatterns = [
      'React', 'Vue', 'Angular', 'Node.js', 'Express', 'Django', 'Rails',
      'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch',
      'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure',
      'GraphQL', 'REST', 'gRPC', 'WebSocket'
    ];
    
    techPatterns.forEach(tech => {
      if (content.match(new RegExp(tech, 'i'))) {
        technologies.push(tech);
      }
    });
    
    return technologies;
  }

  async extractAPISpec(document) {
    const content = this.getDocumentContent(document);
    const apis = [];
    
    // REST endpoints
    const endpointPattern = /(?:GET|POST|PUT|DELETE|PATCH)\s+([\/\w-]+)/gi;
    const matches = content.matchAll(endpointPattern);
    
    for (const match of matches) {
      apis.push({
        method: match[0].split(/\s+/)[0],
        endpoint: match[1],
        type: 'REST'
      });
    }
    
    return apis;
  }

  async extractDatabaseSchema(document) {
    const content = this.getDocumentContent(document);
    const schema = {
      tables: [],
      relationships: []
    };
    
    // Table/Entity detection
    const tablePattern = /(?:table|entity|model)\s+(\w+)/gi;
    const matches = content.matchAll(tablePattern);
    
    for (const match of matches) {
      schema.tables.push({
        name: match[1],
        fields: [] // Would extract fields in production
      });
    }
    
    return schema;
  }
}

module.exports = AnalystAgent;