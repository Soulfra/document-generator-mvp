#!/usr/bin/env node

/**
 * 🏺 CAL'S NARRATIVE REPORT ENGINE
 * Transforms technical analysis into Cal's archaeological storytelling format
 * Creates "Chapter 7" style discovery reports optimized for guardian memory
 */

const fs = require('fs').promises;
const crypto = require('crypto');

class CalNarrativeReportEngine {
    constructor() {
        this.calPersona = {
            voice: 'curious_archaeologist',
            style: 'discovery_narrative',
            perspective: 'archaeological_detective',
            expertise: ['pattern_recognition', 'cultural_analysis', 'wisdom_extraction']
        };
        
        // Cal's vocabulary and storytelling patterns
        this.calVocabulary = {
            discovery: ['uncovered', 'excavated', 'unearthed', 'discovered', 'revealed', 'found'],
            analysis: ['examined', 'studied', 'investigated', 'explored', 'dissected', 'analyzed'],
            patterns: ['artifacts', 'traces', 'signatures', 'fingerprints', 'evidence', 'clues'],
            quality: ['pristine', 'weathered', 'ancient', 'modern', 'fossilized', 'evolving'],
            team: ['civilization', 'culture', 'tribe', 'community', 'society', 'builders'],
            code: ['architecture', 'structure', 'foundation', 'framework', 'skeleton', 'blueprint']
        };
        
        // Chapter 7 report template structure
        this.chapterFormat = {
            opening: 'discovery_announcement',
            site_survey: 'initial_findings',
            excavation: 'deep_analysis', 
            artifacts: 'pattern_catalog',
            culture: 'team_analysis',
            wisdom: 'extracted_knowledge',
            recommendations: 'advisory_guidance',
            preservation: 'guardian_memory_tags'
        };
    }
    
    /**
     * Generate Cal's narrative report from technical analysis
     */
    async generateCalReport(analysisData, repositoryInfo, billingTier) {
        console.log(`🏺 Cal is examining the ${repositoryInfo.name} archaeological site...`);
        
        const reportMetadata = {
            repositoryUrl: repositoryInfo.url,
            repositoryName: repositoryInfo.name,
            analysisDate: new Date().toISOString(),
            calAnalystId: 'cal-' + crypto.randomBytes(8).toString('hex'),
            excavationDepth: this.mapBillingTierToDepth(billingTier),
            guardianTags: this.generateGuardianTags(analysisData)
        };
        
        const narrative = await this.constructNarrative(analysisData, reportMetadata);
        
        return {
            metadata: reportMetadata,
            narrative: narrative,
            searchableKeywords: this.extractSearchableKeywords(narrative),
            guardianQuickAccess: this.createGuardianQuickAccess(analysisData, narrative)
        };
    }
    
    mapBillingTierToDepth(tier) {
        const depthMap = {
            free: 'surface_survey',
            premium: 'structured_excavation', 
            expert: 'archaeological_expedition',
            consulting: 'complete_civilization_study'
        };
        return depthMap[tier] || 'surface_survey';
    }
    
    generateGuardianTags(analysisData) {
        const tags = new Set();
        
        // Technology tags
        analysisData.technologies?.forEach(tech => {
            tags.add(`tech:${tech.toLowerCase().replace(/[^a-z0-9]/g, '_')}`);
        });
        
        // Pattern tags
        analysisData.patterns?.forEach(pattern => {
            tags.add(`pattern:${pattern.name}`);
        });
        
        // Architecture tags
        if (analysisData.architecture) {
            tags.add(`arch:${analysisData.architecture.type}`);
            if (analysisData.architecture.hasRealtime) tags.add('feature:realtime');
            if (analysisData.architecture.hasDatabase) tags.add('feature:database');
        }
        
        // Complexity tags
        tags.add(`complexity:${analysisData.complexity}`);
        tags.add(`quality:${Math.floor(analysisData.quality || 5)}`);
        
        return Array.from(tags);
    }
    
    async constructNarrative(analysisData, metadata) {
        const sections = {};
        
        // Opening: Discovery Announcement
        sections.opening = this.generateOpeningAnnouncement(analysisData, metadata);
        
        // Site Survey: Initial Findings
        sections.siteSurvey = this.generateSiteSurvey(analysisData, metadata);
        
        // Excavation: Deep Analysis
        sections.excavation = this.generateExcavationReport(analysisData, metadata);
        
        // Artifacts: Pattern Catalog
        sections.artifacts = this.generateArtifactCatalog(analysisData, metadata);
        
        // Culture: Team Analysis
        sections.culture = this.generateCultureAnalysis(analysisData, metadata);
        
        // Wisdom: Extracted Knowledge
        sections.wisdom = this.generateWisdomExtraction(analysisData, metadata);
        
        // Recommendations: Advisory Guidance
        sections.recommendations = this.generateAdvisoryGuidance(analysisData, metadata);
        
        // Preservation: Guardian Memory Integration
        sections.preservation = this.generatePreservationNotes(analysisData, metadata);
        
        return this.assembleNarrative(sections, metadata);
    }
    
    generateOpeningAnnouncement(analysisData, metadata) {
        const repoName = metadata.repositoryName;
        const excavationLevel = metadata.excavationDepth;
        const fileCount = analysisData.fileCount || 0;
        const techStack = analysisData.technologies?.slice(0, 3).join(', ') || 'Unknown technologies';
        
        return `
# Chapter 7: Archaeological Discovery Report
## The ${repoName} Expedition

*Cal's Archaeological Log - ${new Date().toLocaleDateString()}*

---

🏺 **DISCOVERY ANNOUNCEMENT**

Greetings, fellow code archaeologists! Cal here with another fascinating excavation report. 

Today I've had the privilege of exploring the digital ruins of **${repoName}**, a ${this.random(this.calVocabulary.quality)} codebase containing ${fileCount} artifacts spanning what appears to be a ${analysisData.complexity || 'moderate'} complexity civilization.

During my ${excavationLevel} of this site, I ${this.random(this.calVocabulary.discovery)} evidence of a ${analysisData.architecture?.type || 'unknown'} architectural society that primarily worked with ${techStack}. The preservation state is ${this.assessPreservationState(analysisData.quality)}, and I'm excited to share what I've learned about this fascinating digital civilization.

*Guardian Memory Tags: ${metadata.guardianTags.join(', ')}*

---
        `.trim();
    }
    
    generateSiteSurvey(analysisData, metadata) {
        const architecture = analysisData.architecture || {};
        const hasRealtime = architecture.hasRealtime ? 'advanced real-time communication systems' : 'traditional request-response patterns';
        const hasDatabase = architecture.hasDatabase ? 'sophisticated data persistence mechanisms' : 'simpler storage approaches';
        
        return `
🔍 **INITIAL SITE SURVEY**

Upon approaching the ${metadata.repositoryName} site, several immediate observations caught my archaeological eye:

**Architectural Foundation**: The builders of this civilization chose a ${architecture.type || 'unknown'} approach, suggesting they valued ${this.interpretArchitecturalChoice(architecture.type)}. The presence of ${hasRealtime} indicates ${architecture.hasRealtime ? 'a society that prized immediate communication' : 'a culture comfortable with asynchronous interactions'}.

**Storage Philosophy**: The ${hasDatabase} tells us about their approach to memory and persistence. This reveals ${architecture.hasDatabase ? 'a civilization that expected to preserve significant amounts of data over time' : 'a culture focused on simplicity and minimal state management'}.

**Complexity Assessment**: With a ${analysisData.complexity} complexity rating, this appears to be the work of ${this.interpretComplexity(analysisData.complexity)} development culture.

*Guardian Search Hint: "${architecture.type} ${hasRealtime ? 'realtime' : 'traditional'} ${hasDatabase ? 'persistent' : 'stateless'}"*

---
        `.trim();
    }
    
    generateExcavationReport(analysisData, metadata) {
        const patterns = analysisData.patterns || [];
        const topPatterns = patterns.slice(0, 5);
        
        let excavationStory = `
🏛️ **EXCAVATION REPORT**

As I ${this.random(this.calVocabulary.analysis)} deeper into the ${metadata.repositoryName} site, layer by layer, fascinating patterns began to emerge:

**Primary Artifacts Discovered**:
        `;
        
        topPatterns.forEach((pattern, index) => {
            const frequency = pattern.count;
            const significance = this.interpretPatternSignificance(pattern.name, frequency);
            
            excavationStory += `
${index + 1}. **${pattern.name.toUpperCase()} Artifacts** (${frequency} specimens)
   - Archaeological Significance: ${significance}
   - Cultural Weight: ${pattern.weight} points
   - Preservation State: ${this.assessPatternPreservation(frequency)}
            `;
        });
        
        excavationStory += `

**Layer Analysis Summary**: The stratification of this codebase reveals ${patterns.length} distinct technological layers, with the ${topPatterns[0]?.name || 'unknown'} layer being the most prominent cultural influence. This suggests the original builders prioritized ${this.interpretPrimaryPattern(topPatterns[0]?.name)}.

*Guardian Memory Keywords: ${patterns.map(p => p.name).join(', ')}*

---
        `;
        
        return excavationStory.trim();
    }
    
    generateArtifactCatalog(analysisData, metadata) {
        const technologies = analysisData.technologies || [];
        
        return `
📜 **ARTIFACT CATALOG**

*Cal's Detailed Inventory of Technological Artifacts*

**Primary Technologies Identified**:
${technologies.map((tech, index) => `
${index + 1}. **${tech}**
   - Cultural Period: ${this.dateTechnology(tech)}
   - Adoption Reasoning: ${this.explainTechnologyChoice(tech)}
   - Preservation Quality: ${this.random(this.calVocabulary.quality)}
   - Archaeological Note: ${this.generateArchaeologicalNote(tech)}
`).join('')}

**Artifact Interpretation**: This technological assemblage tells the story of a ${this.random(this.calVocabulary.team)} that valued ${this.interpretTechChoices(technologies)}. The combination suggests they were building for ${this.inferBuildPurpose(technologies)}.

**Cultural Timeline**: Based on the technological layers, I estimate this civilization operated during the ${this.estimateEra(technologies)} period of software development, with evidence of ${this.detectEvolutionPatterns(technologies)}.

*Guardian Quick Retrieval: "tech_stack:${technologies.map(t => t.toLowerCase().replace(/[^a-z]/g, '')).join('_')}"*

---
        `.trim();
    }
    
    generateCultureAnalysis(analysisData, metadata) {
        return `
🏛️ **CULTURAL ANTHROPOLOGY REPORT**

*Cal's Analysis of the Development Civilization*

**The Builders' Philosophy**: 

Through careful examination of their coding artifacts, I've ${this.random(this.calVocabulary.discovery)} a fascinating development culture. The ${metadata.repositoryName} civilization demonstrates ${this.assessCulturalMaturity(analysisData)} characteristics.

**Social Structure**: The pattern distribution suggests ${this.interpretSocialStructure(analysisData.patterns)}. Their approach to ${analysisData.architecture?.type || 'development'} reveals a society that ${this.interpretSocietalValues(analysisData)}.

**Communication Patterns**: Based on the artifact analysis, this ${this.random(this.calVocabulary.team)} communicated through ${this.interpretCommunicationStyle(analysisData)}. Their documentation practices suggest ${this.assessDocumentationCulture(analysisData.quality)}.

**Belief Systems**: The architectural choices reveal core beliefs about ${this.extractCoreBeliefs(analysisData)}. This civilization clearly valued ${this.identifyValues(analysisData)} above other concerns.

**Evolutionary Stage**: I classify this as a ${this.classifyEvolutionaryStage(analysisData)} development civilization, showing signs of ${this.identifyEvolutionaryTraits(analysisData)}.

*Guardian Cultural Keywords: "${this.generateCulturalKeywords(analysisData)}"*

---
        `.trim();
    }
    
    generateWisdomExtraction(analysisData, metadata) {
        return `
💎 **WISDOM EXTRACTION**

*What Cal Learned From This Archaeological Expedition*

**Ancient Wisdom Preserved**:

Through this excavation, I've ${this.random(this.calVocabulary.discovery)} several profound pieces of wisdom that this civilization embedded in their code. Here's what they want future developers to understand:

**Primary Lessons**:
1. **Simplicity Principle**: This ${this.random(this.calVocabulary.team)} clearly believed that "${this.generateWisdomQuote('simplicity')}"
2. **Communication Values**: Their pattern choices reveal they prioritized ${this.extractCommunicationValues(analysisData)}
3. **Growth Philosophy**: The architectural decisions suggest they expected ${this.interpretGrowthExpectations(analysisData)}

**Hidden Knowledge**: Between the lines of their code, I found evidence that they learned ${this.generateHiddenWisdom(analysisData)}. This is the kind of hard-won wisdom that only comes from ${this.interpretExperienceLevel(analysisData)}.

**Practical Applications**: For modern developers studying this site, the key takeaway is ${this.generatePracticalWisdom(analysisData)}. Their approach to ${analysisData.architecture?.type || 'development'} could save you ${this.estimateTimeSavings()} if applied correctly.

**Cal's Personal Note**: What strikes me most about this excavation is ${this.generatePersonalReflection(analysisData)}. It reminds me of ${this.generateAnalogy(analysisData)} - both beautiful and instructive.

*Guardian Wisdom Tags: "${this.generateWisdomTags(analysisData)}"*

---
        `.trim();
    }
    
    generateAdvisoryGuidance(analysisData, metadata) {
        const improvements = analysisData.improvements || [];
        const vulnerabilities = analysisData.vulnerabilities || [];
        
        return `
🎯 **CAL'S ADVISORY GUIDANCE**

*Practical Recommendations for Modern Implementers*

**What You Should Keep** ✅:
${this.generateKeepRecommendations(analysisData)}

**What You Can Strip** ❌:
${this.generateStripRecommendations(analysisData)}

**What You Should Add** ⚡:
${this.generateAddRecommendations(analysisData)}

**Security Archaeological Notes** 🛡️:
${vulnerabilities.length > 0 ? 
    vulnerabilities.map(v => `- **${v.type}**: ${this.narrate('security', v)}`).join('\n') :
    'This civilization built remarkably secure foundations - their security practices were ahead of their time.'
}

**Performance Enhancement Opportunities** 🚀:
${improvements.map(imp => `- **${imp.type}**: ${this.narrateImprovement(imp)}`).join('\n')}

**Cal's Implementation Roadmap**:
1. **Immediate Actions**: ${this.generateImmediateActions(analysisData)}
2. **Short-term Adaptations**: ${this.generateShortTermActions(analysisData)}
3. **Long-term Evolution**: ${this.generateLongTermVision(analysisData)}

**Cost-Benefit Analysis**: Adapting this civilization's approach would ${this.calculateAdaptationValue(analysisData)}

*Guardian Implementation Tags: "${this.generateImplementationTags(analysisData)}"*

---
        `.trim();
    }
    
    generatePreservationNotes(analysisData, metadata) {
        return `
🏛️ **PRESERVATION FOR GUARDIAN MEMORY**

*Optimized for Fast Retrieval and Cross-Reference*

**Quick Access Summary**:
- **Repository**: ${metadata.repositoryName}
- **Architecture Type**: ${analysisData.architecture?.type || 'Unknown'}
- **Primary Technologies**: ${(analysisData.technologies || []).join(', ')}
- **Complexity Level**: ${analysisData.complexity}
- **Quality Score**: ${analysisData.quality}/10
- **Cal's Confidence**: ${this.calculateCalConfidence(analysisData)}%

**Guardian Search Optimization**:
\`\`\`
# Primary Search Terms
${metadata.guardianTags.join('\n')}

# Cross-Reference Patterns  
similar_to: "${this.generateSimilarPatterns(analysisData)}"
solves_problem: "${this.identifyProblemsolved(analysisData)}"
best_for_use_case: "${this.identifyBestUseCases(analysisData)}"
\`\`\`

**Related Archaeological Sites**: Based on this excavation, you might also be interested in:
${this.generateRelatedSites(analysisData)}

**Cal's Archive Note**: Filed under "${this.generateArchiveCategory(analysisData)}" with cross-references to ${this.generateCrossReferences(analysisData)}. Future archaeologists can quickly locate this by searching for any of the guardian tags above.

**Expedition Complete**: ${new Date().toLocaleDateString()} - Cal, Chief Code Archaeologist

---

*End of Chapter 7: ${metadata.repositoryName} Archaeological Report*
        `.trim();
    }
    
    assembleNarrative(sections, metadata) {
        return `${sections.opening}

${sections.siteSurvey}

${sections.excavation}

${sections.artifacts}

${sections.culture}

${sections.wisdom}

${sections.recommendations}

${sections.preservation}`;
    }
    
    // Utility methods for Cal's storytelling
    random(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
    
    assessPreservationState(quality) {
        if (quality >= 8) return 'remarkably well-preserved';
        if (quality >= 6) return 'good preservation with some weathering';
        if (quality >= 4) return 'moderate preservation requiring careful restoration';
        return 'significant archaeological restoration needed';
    }
    
    interpretArchitecturalChoice(type) {
        const interpretations = {
            'full-stack': 'comprehensive control over their digital domain',
            'backend-api': 'robust foundational systems with clear service boundaries',
            'frontend-spa': 'user experience and interface excellence',
            'microservices': 'distributed resilience and scalable growth',
            'monolithic': 'unified simplicity and cohesive development'
        };
        return interpretations[type] || 'pragmatic problem-solving';
    }
    
    interpretComplexity(complexity) {
        const interpretations = {
            'low': 'a focused, disciplined',
            'medium': 'a balanced, thoughtful',
            'high': 'an ambitious, comprehensive'
        };
        return interpretations[complexity] || 'an interesting';
    }
    
    interpretPatternSignificance(patternName, frequency) {
        const significance = {
            'express': 'Indicates a civilization comfortable with HTTP-based communication protocols',
            'react': 'Reveals builders who prioritized dynamic user interface construction',
            'websocket': 'Shows advanced real-time communication infrastructure',
            'database': 'Demonstrates sophisticated data persistence strategies',
            'auth': 'Indicates security-conscious builders with access control systems',
            'api': 'Reveals service-oriented architectural thinking'
        };
        
        const baseSignificance = significance[patternName] || 'Represents a specific technological choice';
        const frequencyModifier = frequency > 20 ? ' with extensive implementation' : 
                                 frequency > 10 ? ' with solid adoption' : 
                                 ' with selective usage';
        
        return baseSignificance + frequencyModifier;
    }
    
    assessPatternPreservation(frequency) {
        if (frequency > 50) return 'extensively preserved throughout the site';
        if (frequency > 20) return 'well-preserved in multiple locations';
        if (frequency > 5) return 'selectively preserved in key areas';
        return 'sparsely preserved, possibly ceremonial use';
    }
    
    interpretPrimaryPattern(patternName) {
        const interpretations = {
            'websocket': 'real-time user engagement and immediate feedback systems',
            'express': 'clear communication protocols and structured request handling',
            'react': 'dynamic user experience and interface responsiveness',
            'database': 'long-term data preservation and complex state management',
            'api': 'modular service architecture and external integration capabilities'
        };
        return interpretations[patternName] || 'systematic problem-solving approaches';
    }
    
    // More utility methods for specific narrative elements
    dateTechnology(tech) {
        const eras = {
            'React': 'Modern Interactive Era (2013-present)',
            'Express.js': 'Node.js Renaissance (2010-present)', 
            'WebSockets': 'Real-time Revolution (2011-present)',
            'REST API': 'Service-Oriented Classical Period (2000-present)',
            'Authentication': 'Security Awakening Era (1995-present)'
        };
        return eras[tech] || 'Contemporary Development Period';
    }
    
    explainTechnologyChoice(tech) {
        const reasons = {
            'React': 'Chosen for its component-based architecture and virtual DOM efficiency',
            'Express.js': 'Selected for its minimalist approach and extensive middleware ecosystem',
            'WebSockets': 'Adopted for real-time bidirectional communication requirements',
            'REST API': 'Implemented for standard, predictable service communication',
            'Authentication': 'Essential for access control and user identity management'
        };
        return reasons[tech] || 'Likely chosen for its specific problem-solving capabilities';
    }
    
    generateArchaeologicalNote(tech) {
        const notes = {
            'React': 'Notice the emphasis on component reusability - this civilization valued modular construction',
            'Express.js': 'The minimalist framework choice suggests builders who preferred explicit over implicit',
            'WebSockets': 'Real-time infrastructure indicates they were building for live user interaction',
            'REST API': 'Standard API patterns show this was meant for external integration',
            'Authentication': 'Security implementation reveals they expected multi-user scenarios'
        };
        return notes[tech] || 'This choice reveals specific architectural priorities and constraints';
    }
    
    generateKeepRecommendations(analysisData) {
        const keeps = [];
        
        if (analysisData.patterns?.some(p => p.name === 'express')) {
            keeps.push('- **Express.js Foundation**: Their HTTP handling patterns are solid and battle-tested');
        }
        
        if (analysisData.patterns?.some(p => p.name === 'async')) {
            keeps.push('- **Async Patterns**: Their asynchronous handling shows mature JavaScript practices');
        }
        
        if (analysisData.architecture?.hasDatabase) {
            keeps.push('- **Data Layer**: Their persistence approach is worth preserving');
        }
        
        if (analysisData.quality >= 7) {
            keeps.push('- **Overall Architecture**: High quality score indicates well-thought-out structure');
        }
        
        return keeps.length > 0 ? keeps.join('\n') : '- Cal recommends careful evaluation before keeping any components';
    }
    
    generateStripRecommendations(analysisData) {
        const strips = [];
        
        if (analysisData.patterns?.some(p => p.name === 'auth')) {
            strips.push('- **Authentication System**: If building internal tools, their auth complexity might be overkill');
        }
        
        if (analysisData.complexity === 'high') {
            strips.push('- **Over-Engineering**: Some patterns might be unnecessarily complex for your use case');
        }
        
        if (analysisData.patterns?.length > 10) {
            strips.push('- **Pattern Overload**: Too many patterns might indicate feature bloat you can simplify');
        }
        
        return strips.length > 0 ? strips.join('\n') : '- This civilization was efficient - minimal stripping recommended';
    }
    
    generateAddRecommendations(analysisData) {
        const adds = [];
        
        if (!analysisData.patterns?.some(p => p.name === 'auth')) {
            adds.push('- **Authentication Layer**: Consider adding auth if you need user management');
        }
        
        if (!analysisData.patterns?.some(p => p.name === 'database')) {
            adds.push('- **Persistence Layer**: Add database integration for data storage needs');
        }
        
        if (analysisData.quality < 6) {
            adds.push('- **Error Handling**: Strengthen error handling and input validation');
        }
        
        if (!analysisData.patterns?.some(p => p.name === 'websocket')) {
            adds.push('- **Real-time Features**: Consider WebSocket integration for live updates');
        }
        
        return adds.length > 0 ? adds.join('\n') : '- This civilization built comprehensively - minimal additions needed';
    }
    
    extractSearchableKeywords(narrative) {
        // Extract key terms for guardian memory searching
        const keywords = new Set();
        
        // Extract technology names
        const techRegex = /\b(React|Express|Node\.js|WebSocket|JavaScript|Python|Database|API|Authentication)\b/gi;
        const techMatches = narrative.match(techRegex) || [];
        techMatches.forEach(tech => keywords.add(tech.toLowerCase()));
        
        // Extract pattern names
        const patternRegex = /\b(microservices|monolithic|full-stack|backend|frontend|real-time)\b/gi;
        const patternMatches = narrative.match(patternRegex) || [];
        patternMatches.forEach(pattern => keywords.add(pattern.toLowerCase()));
        
        // Extract action words
        const actionRegex = /\b(keep|strip|add|improve|optimize|secure|scale)\b/gi;
        const actionMatches = narrative.match(actionRegex) || [];
        actionMatches.forEach(action => keywords.add(action.toLowerCase()));
        
        return Array.from(keywords);
    }
    
    createGuardianQuickAccess(analysisData, narrative) {
        return {
            tldr: this.generateTLDR(analysisData),
            quickFacts: this.generateQuickFacts(analysisData),
            actionItems: this.extractActionItems(narrative),
            similarSites: this.generateSimilarSites(analysisData),
            confidenceScore: this.calculateCalConfidence(analysisData)
        };
    }
    
    generateTLDR(analysisData) {
        const arch = analysisData.architecture?.type || 'unknown';
        const complexity = analysisData.complexity;
        const quality = analysisData.quality;
        const techCount = analysisData.technologies?.length || 0;
        
        return `${arch} architecture, ${complexity} complexity, ${quality}/10 quality. Uses ${techCount} main technologies. ${this.interpretOverallValue(analysisData)}.`;
    }
    
    generateQuickFacts(analysisData) {
        return {
            fileCount: analysisData.fileCount,
            analyzedFiles: analysisData.analyzedFiles,
            patterns: analysisData.patterns?.length || 0,
            technologies: analysisData.technologies?.length || 0,
            architecture: analysisData.architecture?.type,
            hasRealtime: analysisData.architecture?.hasRealtime || false,
            qualityScore: analysisData.quality
        };
    }
    
    extractActionItems(narrative) {
        const actions = [];
        
        // Extract action items from narrative
        const actionRegex = /(?:Consider|Add|Remove|Implement|Strip|Keep).*?(?:\.|$)/g;
        const matches = narrative.match(actionRegex) || [];
        
        return matches.slice(0, 10); // Top 10 action items
    }
    
    generateSimilarSites(analysisData) {
        // Generate similar repositories based on patterns
        const arch = analysisData.architecture?.type;
        const tech = analysisData.technologies?.[0];
        
        return [
            `Other ${arch} repositories`,
            `Projects using ${tech}`,
            `${analysisData.complexity} complexity codebases`
        ];
    }
    
    calculateCalConfidence(analysisData) {
        let confidence = 70; // Base confidence
        
        if (analysisData.analyzedFiles > 20) confidence += 10;
        if (analysisData.patterns?.length > 5) confidence += 10;
        if (analysisData.quality >= 7) confidence += 10;
        
        return Math.min(confidence, 95);
    }
    
    interpretOverallValue(analysisData) {
        if (analysisData.quality >= 8) return 'Excellent foundation for adaptation';
        if (analysisData.quality >= 6) return 'Solid base with some improvements needed';
        if (analysisData.quality >= 4) return 'Requires significant modifications';
        return 'Consider alternative approaches';
    }
    
    // Additional storytelling methods
    assessCulturalMaturity(analysisData) {
        return analysisData.quality >= 7 ? 'mature and sophisticated' : 'developing and evolving';
    }
    
    interpretSocialStructure(patterns) {
        const patternCount = patterns?.length || 0;
        if (patternCount > 8) return 'a complex hierarchical development society';
        if (patternCount > 4) return 'a well-organized development community';
        return 'a focused, specialized development team';
    }
    
    interpretSocietalValues(analysisData) {
        if (analysisData.architecture?.hasRealtime) return 'prioritized immediate user feedback and engagement';
        if (analysisData.architecture?.hasDatabase) return 'valued data persistence and long-term thinking';
        return 'focused on solving specific problems efficiently';
    }
    
    generateWisdomQuote(type) {
        const quotes = {
            simplicity: 'Complex solutions breed complex problems - start simple and evolve thoughtfully',
            communication: 'Clear interfaces prevent more bugs than clever algorithms',
            growth: 'Build for today\'s needs while keeping tomorrow\'s possibilities open'
        };
        return quotes[type] || 'Good code tells a story that future developers can follow';
    }
    
    generateHiddenWisdom(analysisData) {
        if (analysisData.quality >= 7) {
            return 'that premature optimization is indeed the root of evil, but thoughtful architecture prevents technical debt';
        }
        return 'the hard way that shortcuts in early development compound into major refactoring efforts later';
    }
    
    interpretExperienceLevel(analysisData) {
        if (analysisData.quality >= 8) return 'building and maintaining production systems at scale';
        if (analysisData.quality >= 6) return 'shipping features under real-world constraints';
        return 'learning through trial and error in development environments';
    }
    
    generatePracticalWisdom(analysisData) {
        const arch = analysisData.architecture?.type;
        return `their ${arch} approach demonstrates how to balance ${this.identifyBalancedConcerns(analysisData)}`;
    }
    
    identifyBalancedConcerns(analysisData) {
        if (analysisData.complexity === 'high') return 'feature richness with maintainability';
        if (analysisData.architecture?.hasRealtime) return 'real-time requirements with system stability';
        return 'simplicity with extensibility';
    }
    
    estimateTimeSavings() {
        return `${Math.floor(Math.random() * 20) + 10}-${Math.floor(Math.random() * 40) + 20} hours of development time`;
    }
    
    generatePersonalReflection(analysisData) {
        const reflections = [
            'how different development cultures approach the same core problems',
            'the elegance that emerges when developers truly understand their domain',
            'how architectural decisions reveal the builders\' deepest assumptions about users',
            'the way good code preserves not just functionality, but the reasoning behind it'
        ];
        return this.random(reflections);
    }
    
    generateAnalogy(analysisData) {
        const analogies = [
            'studying ancient Roman architecture - functional, enduring, and instructive',
            'examining Medieval manuscripts - each choice reveals cultural values',
            'exploring Mayan temples - complex systems built with specific purposes in mind',
            'investigating Viking ships - optimized for their specific use cases and environment'
        ];
        return this.random(analogies);
    }
    
    generateWisdomTags(analysisData) {
        const tags = [`wisdom:${analysisData.architecture?.type}`];
        if (analysisData.quality >= 7) tags.push('wisdom:high_quality');
        if (analysisData.complexity === 'high') tags.push('wisdom:complex_systems');
        return tags.join(' ');
    }
    
    generateImplementationTags(analysisData) {
        const tags = [`impl:${analysisData.architecture?.type}`];
        tags.push(`complexity:${analysisData.complexity}`);
        if (analysisData.technologies) {
            tags.push(`stack:${analysisData.technologies.join('_').toLowerCase()}`);
        }
        return tags.join(' ');
    }
    
    generateImmediateActions(analysisData) {
        if (analysisData.quality < 5) return 'Focus on code quality improvements and error handling';
        if (analysisData.complexity === 'high') return 'Simplify the architecture before adaptation';
        return 'Begin with their core patterns and build incrementally';
    }
    
    generateShortTermActions(analysisData) {
        const actions = [];
        if (analysisData.architecture?.hasDatabase) actions.push('Set up data persistence layer');
        if (analysisData.architecture?.hasRealtime) actions.push('Implement real-time communication');
        return actions.length > 0 ? actions.join(', ') : 'Adapt their successful patterns to your use case';
    }
    
    generateLongTermVision(analysisData) {
        return `Scale using their proven ${analysisData.architecture?.type} approach while incorporating lessons from their ${analysisData.complexity} complexity journey`;
    }
    
    calculateAdaptationValue(analysisData) {
        if (analysisData.quality >= 8) return 'provide significant value with minimal modification effort';
        if (analysisData.quality >= 6) return 'offer good value with moderate adaptation work';
        return 'require substantial modification but could yield valuable lessons';
    }
    
    generateSimilarPatterns(analysisData) {
        return `${analysisData.architecture?.type} ${analysisData.complexity}_complexity ${analysisData.technologies?.join('_') || 'unknown_tech'}`;
    }
    
    identifyProblemsolved(analysisData) {
        if (analysisData.architecture?.hasRealtime) return 'real-time user interaction systems';
        if (analysisData.architecture?.hasDatabase) return 'data persistence and management';
        return `${analysisData.architecture?.type} application development`;
    }
    
    identifyBestUseCases(analysisData) {
        const useCases = [];
        if (analysisData.architecture?.hasRealtime) useCases.push('live_applications');
        if (analysisData.architecture?.hasDatabase) useCases.push('data_driven_apps');
        if (analysisData.complexity === 'low') useCases.push('mvp_development');
        
        return useCases.join(' ');
    }
    
    generateRelatedSites(analysisData) {
        return [
            `- Other ${analysisData.architecture?.type} archaeological sites`,
            `- Repositories with similar ${analysisData.technologies?.[0] || 'technology'} artifacts`,
            `- ${analysisData.complexity} complexity civilizations for comparison`
        ].join('\n');
    }
    
    generateArchiveCategory(analysisData) {
        return `${analysisData.architecture?.type}_${analysisData.complexity}_${Date.now()}`;
    }
    
    generateCrossReferences(analysisData) {
        const refs = [`architecture:${analysisData.architecture?.type}`];
        if (analysisData.technologies) {
            refs.push(`technologies:${analysisData.technologies.join('_')}`);
        }
        return refs.join(', ');
    }
    
    // Generate narrative improvement for specific improvement
    narrateImprovement(improvement) {
        const narratives = {
            'Performance': `Cal's archaeological analysis reveals that ${improvement.suggestion.toLowerCase()} would ${improvement.impact} impact the site's operational efficiency`,
            'Security': `From a defensive archaeology perspective, ${improvement.suggestion.toLowerCase()} represents a ${improvement.impact} priority fortification`,
            'Maintainability': `Future code archaeologists would benefit from ${improvement.suggestion.toLowerCase()} - a ${improvement.impact} impact preservation technique`
        };
        
        return narratives[improvement.type] || `Archaeological recommendation: ${improvement.suggestion} (${improvement.impact} impact)`;
    }
    
    narrate(context, data) {
        if (context === 'security') {
            return `This ${data.severity} vulnerability shows where the original builders' defensive strategies could be strengthened: ${data.type}`;
        }
        return `Archaeological finding: ${JSON.stringify(data)}`;
    }
}

module.exports = CalNarrativeReportEngine;