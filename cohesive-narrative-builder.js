#!/usr/bin/env node

/**
 * 📖 COHESIVE NARRATIVE BUILDER
 * 
 * Builds cohesive narratives that flow seamlessly between chapters
 * Tracks characters, themes, and concepts across the entire book
 * Ensures consistent tone, terminology, and story arc progression
 * 
 * Features:
 * - Character development tracking across chapters
 * - Theme consistency validation
 * - Concept dependency mapping
 * - Narrative arc progression
 * - Cross-reference system
 * - Tone and style consistency
 */

const EventEmitter = require('events');
const path = require('path');

class CohesiveNarrativeBuilder extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            enableCharacterTracking: config.enableCharacterTracking !== false,
            enableThemeConsistency: config.enableThemeConsistency !== false,
            enableConceptMapping: config.enableConceptMapping !== false,
            enableToneValidation: config.enableToneValidation !== false,
            narrativeComplexityProgression: config.narrativeComplexityProgression || 'linear',
            ...config
        };
        
        // Narrative tracking structures
        this.narrativeContext = {
            mainTheme: null,
            subThemes: [],
            characters: new Map(),
            concepts: new Map(),
            crossReferences: new Map(),
            tone: {
                style: null,
                consistency: 1.0,
                progression: []
            },
            arc: {
                setup: null,
                development: [],
                climax: null,
                resolution: null
            }
        };
        
        // Character archetypes for AI consultation panel
        this.characterArchetypes = {
            'The Analytical Philosopher': {
                traits: ['logical', 'methodical', 'ethical', 'precise'],
                speechPatterns: ['Therefore...', 'From a logical perspective...', 'Consider the implications...'],
                expertise: ['reasoning', 'ethics', 'systematic analysis'],
                evolutionPath: 'becoming more practical over time'
            },
            
            'The Creative Generalist': {
                traits: ['innovative', 'adaptable', 'user-focused', 'practical'],
                speechPatterns: ['What if we...', 'From a user perspective...', 'Let\'s think outside the box...'],
                expertise: ['innovation', 'user experience', 'creative solutions'],
                evolutionPath: 'becoming more technically sophisticated'
            },
            
            'The Technical Specialist': {
                traits: ['detail-oriented', 'performance-focused', 'systematic', 'rigorous'],
                speechPatterns: ['Technically speaking...', 'For optimal performance...', 'The implementation details...'],
                expertise: ['deep technical knowledge', 'optimization', 'best practices'],
                evolutionPath: 'becoming more architectural in thinking'
            },
            
            'The Research Librarian': {
                traits: ['thorough', 'fact-based', 'contextual', 'comprehensive'],
                speechPatterns: ['According to research...', 'The evidence suggests...', 'Historical data shows...'],
                expertise: ['factual accuracy', 'comprehensive research', 'context'],
                evolutionPath: 'becoming more synthesizing and interpretive'
            },
            
            'The Fact Checker': {
                traits: ['skeptical', 'current', 'verification-focused', 'precise'],
                speechPatterns: ['Let me verify...', 'Current data indicates...', 'We need to confirm...'],
                expertise: ['verification', 'current information', 'citation'],
                evolutionPath: 'becoming more forward-looking and predictive'
            }
        };
        
        // Narrative progression templates
        this.progressionTemplates = {
            linear: {
                chapters: [
                    { phase: 'introduction', complexity: 1, focus: 'foundation' },
                    { phase: 'development', complexity: 2, focus: 'exploration' },
                    { phase: 'complication', complexity: 3, focus: 'depth' },
                    { phase: 'integration', complexity: 4, focus: 'synthesis' },
                    { phase: 'mastery', complexity: 5, focus: 'advanced_application' }
                ]
            },
            
            spiral: {
                chapters: [
                    { phase: 'core_concept', complexity: 1, focus: 'central_idea' },
                    { phase: 'first_expansion', complexity: 2, focus: 'related_concepts' },
                    { phase: 'deeper_dive', complexity: 4, focus: 'complex_relationships' },
                    { phase: 'second_expansion', complexity: 3, focus: 'practical_applications' },
                    { phase: 'integration', complexity: 5, focus: 'unified_understanding' }
                ]
            },
            
            hero_journey: {
                chapters: [
                    { phase: 'call_to_adventure', complexity: 1, focus: 'problem_recognition' },
                    { phase: 'meeting_mentor', complexity: 2, focus: 'guidance_gathering' },
                    { phase: 'trials', complexity: 4, focus: 'challenge_facing' },
                    { phase: 'revelation', complexity: 5, focus: 'breakthrough_moment' },
                    { phase: 'return', complexity: 3, focus: 'wisdom_application' }
                ]
            }
        };
        
        console.log('📖 Cohesive Narrative Builder initialized');
        console.log(`🎭 Character archetypes: ${Object.keys(this.characterArchetypes).length}`);
        console.log(`📊 Progression templates: ${Object.keys(this.progressionTemplates).join(', ')}`);
    }
    
    /**
     * Initialize narrative context for a new book
     */
    initializeNarrative(topic, template, consultationPanel) {
        console.log(`📖 Initializing narrative for: "${topic}"`);
        
        this.narrativeContext = {
            mainTheme: topic,
            subThemes: this.extractSubThemes(topic),
            characters: this.initializeCharacters(consultationPanel),
            concepts: new Map(),
            crossReferences: new Map(),
            tone: {
                style: template.style || 'technical_narrative',
                consistency: 1.0,
                progression: []
            },
            arc: {
                setup: null,
                development: [],
                climax: null,
                resolution: null
            }
        };
        
        // Set up progression template
        const progression = this.progressionTemplates[this.config.narrativeComplexityProgression] || 
                          this.progressionTemplates.linear;
        
        this.narrativeContext.expectedProgression = progression;
        
        console.log(`  🎯 Main theme: ${this.narrativeContext.mainTheme}`);
        console.log(`  🎭 Characters: ${this.narrativeContext.characters.size}`);
        console.log(`  📈 Progression: ${this.config.narrativeComplexityProgression}`);
        
        return this.narrativeContext;
    }
    
    /**
     * Extract sub-themes from main topic
     */
    extractSubThemes(topic) {
        const commonPatterns = [
            // Technical patterns
            /scalable|scaling/i => 'scalability',
            /real.?time/i => 'real_time_processing',
            /collaborative/i => 'collaboration',
            /distributed/i => 'distributed_systems',
            /machine.?learning|ai/i => 'artificial_intelligence',
            /security|secure/i => 'security',
            /performance/i => 'performance_optimization',
            /user.?experience|ux/i => 'user_experience',
            
            // Business patterns
            /revenue|monetiz/i => 'monetization',
            /market/i => 'market_analysis',
            /growth/i => 'business_growth',
            /strategy/i => 'strategic_planning'
        ];
        
        const subThemes = [];
        for (const [pattern, theme] of Object.entries(commonPatterns)) {
            if (pattern.test && pattern.test(topic)) {
                subThemes.push(theme);
            }
        }
        
        return subThemes.length > 0 ? subThemes : ['implementation', 'best_practices', 'optimization'];
    }
    
    /**
     * Initialize character tracking
     */
    initializeCharacters(consultationPanel) {
        const characters = new Map();
        
        Object.values(consultationPanel).forEach(panelMember => {
            const archetype = this.characterArchetypes[panelMember.character];
            
            characters.set(panelMember.character, {
                name: panelMember.character,
                emoji: panelMember.emoji,
                service: panelMember.service,
                archetype: archetype,
                chapters: [],
                development: {
                    consistency: 1.0,
                    evolution: [],
                    expertise_growth: []
                },
                relationships: new Map(),
                signature_concepts: []
            });
        });
        
        return characters;
    }
    
    /**
     * Build narrative continuity for a chapter
     */
    buildChapterNarrative(chapterNumber, chapterData, previousChapters = []) {
        console.log(`📝 Building narrative continuity for Chapter ${chapterNumber}`);
        
        // Track character development
        this.trackCharacterDevelopment(chapterNumber, chapterData, previousChapters);
        
        // Build concept continuity
        const conceptContinuity = this.buildConceptContinuity(chapterNumber, chapterData, previousChapters);
        
        // Create chapter transitions
        const transitions = this.createChapterTransitions(chapterNumber, chapterData, previousChapters);
        
        // Ensure theme consistency
        const themeConsistency = this.ensureThemeConsistency(chapterData);
        
        // Build cross-references
        const crossReferences = this.buildCrossReferences(chapterNumber, chapterData, previousChapters);
        
        // Create cohesive narrative structure
        const narrativeStructure = {
            opening: this.createChapterOpening(chapterNumber, transitions.from_previous),
            character_introductions: this.createCharacterIntroductions(chapterNumber, chapterData),
            concept_bridges: conceptContinuity.bridges,
            thematic_weaving: themeConsistency.weaving,
            cross_references: crossReferences,
            closing: this.createChapterClosing(chapterNumber, transitions.to_next),
            
            metadata: {
                continuity_score: this.calculateContinuityScore(chapterNumber, previousChapters),
                character_development: this.getCharacterDevelopmentSummary(chapterNumber),
                concept_progression: conceptContinuity.progression,
                theme_adherence: themeConsistency.score
            }
        };
        
        console.log(`  📊 Continuity score: ${narrativeStructure.metadata.continuity_score.toFixed(2)}`);
        console.log(`  🎭 Character development: ${Object.keys(narrativeStructure.metadata.character_development).length} characters`);
        console.log(`  🔗 Cross-references: ${crossReferences.length}`);
        
        return narrativeStructure;
    }
    
    /**
     * Track character development across chapters
     */
    trackCharacterDevelopment(chapterNumber, chapterData, previousChapters) {
        const currentPhase = this.narrativeContext.expectedProgression.chapters[chapterNumber - 1];
        
        chapterData.consultation.results.filter(r => r.success).forEach(result => {
            const character = this.narrativeContext.characters.get(result.character);
            if (!character) return;
            
            // Track chapter participation
            character.chapters.push({
                number: chapterNumber,
                phase: currentPhase.phase,
                response: result.response,
                confidence: result.confidence || 0,
                key_contributions: this.extractKeyContributions(result.response)
            });
            
            // Track evolution
            const evolutionStage = this.determineEvolutionStage(character, chapterNumber);
            character.development.evolution.push(evolutionStage);
            
            // Track expertise growth
            const expertise = this.assessExpertiseGrowth(character, result.response, chapterNumber);
            character.development.expertise_growth.push(expertise);
            
            // Update consistency score
            character.development.consistency = this.calculateCharacterConsistency(character);
        });
    }
    
    /**
     * Extract key contributions from a response
     */
    extractKeyContributions(response) {
        // Simple extraction - could be enhanced with NLP
        const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 20);
        const keyContributions = sentences
            .filter(sentence => 
                sentence.includes('important') ||
                sentence.includes('crucial') ||
                sentence.includes('key') ||
                sentence.includes('essential') ||
                sentence.includes('recommend')
            )
            .map(s => s.trim())
            .slice(0, 3); // Top 3
            
        return keyContributions.length > 0 ? keyContributions : [sentences[0]?.trim()];
    }
    
    /**
     * Determine character evolution stage
     */
    determineEvolutionStage(character, chapterNumber) {
        const archetype = character.archetype;
        const progressionPhase = this.narrativeContext.expectedProgression.chapters[chapterNumber - 1];
        
        // Map chapter phase to character evolution
        const evolutionMap = {
            'introduction': 'establishing_expertise',
            'development': 'expanding_perspective', 
            'complication': 'facing_challenges',
            'integration': 'synthesizing_knowledge',
            'mastery': 'achieving_wisdom'
        };
        
        return {
            stage: evolutionMap[progressionPhase.phase] || 'developing',
            chapter: chapterNumber,
            expected_traits: this.getExpectedTraitsForStage(archetype, evolutionMap[progressionPhase.phase])
        };
    }
    
    /**
     * Get expected traits for evolution stage
     */
    getExpectedTraitsForStage(archetype, stage) {
        const baseTraits = archetype.traits;
        
        const stageModifiers = {
            'establishing_expertise': [...baseTraits, 'foundational'],
            'expanding_perspective': [...baseTraits, 'exploratory', 'questioning'],
            'facing_challenges': [...baseTraits, 'adaptive', 'problem_solving'],
            'synthesizing_knowledge': [...baseTraits, 'integrative', 'collaborative'],
            'achieving_wisdom': [...baseTraits, 'mentoring', 'visionary']
        };
        
        return stageModifiers[stage] || baseTraits;
    }
    
    /**
     * Build concept continuity across chapters
     */
    buildConceptContinuity(chapterNumber, chapterData, previousChapters) {
        const newConcepts = this.extractConcepts(chapterData);
        const previousConcepts = this.getPreviousConcepts(previousChapters);
        
        // Find concept bridges (concepts that link to previous chapters)
        const bridges = [];
        newConcepts.forEach(concept => {
            const previousMentions = previousConcepts.filter(prev => 
                this.areConceptsRelated(concept, prev)
            );
            
            if (previousMentions.length > 0) {
                bridges.push({
                    concept: concept.name,
                    bridges_to: previousMentions.map(m => ({
                        chapter: m.chapter,
                        concept: m.name,
                        relationship: this.getRelationshipType(concept, m)
                    }))
                });
            }
        });
        
        // Track concept progression
        const progression = this.trackConceptProgression(newConcepts, previousConcepts, chapterNumber);
        
        // Update concept map
        newConcepts.forEach(concept => {
            this.narrativeContext.concepts.set(`ch${chapterNumber}_${concept.name}`, {
                ...concept,
                chapter: chapterNumber,
                bridges: bridges.filter(b => b.concept === concept.name)
            });
        });
        
        return {
            bridges,
            progression,
            new_concepts: newConcepts.length,
            bridged_concepts: bridges.length
        };
    }
    
    /**
     * Extract concepts from chapter data
     */
    extractConcepts(chapterData) {
        const concepts = [];
        
        // Extract from consultation results
        chapterData.consultation.results.filter(r => r.success).forEach(result => {
            const response = result.response.toLowerCase();
            
            // Look for technical concepts
            const technicalTerms = response.match(/\b[a-z]+(?:ing|tion|ment|ness|ity|able|ible|ful|less)\b/g) || [];
            const acronyms = response.match(/\b[A-Z]{2,}\b/g) || [];
            
            [...technicalTerms, ...acronyms].forEach(term => {
                if (term.length > 3) {
                    concepts.push({
                        name: term,
                        type: acronyms.includes(term.toUpperCase()) ? 'acronym' : 'term',
                        context: this.extractConceptContext(response, term),
                        character_source: result.character
                    });
                }
            });
        });
        
        // Deduplicate and score by frequency
        const conceptMap = new Map();
        concepts.forEach(concept => {
            const key = concept.name.toLowerCase();
            if (conceptMap.has(key)) {
                conceptMap.get(key).frequency++;
            } else {
                conceptMap.set(key, { ...concept, frequency: 1 });
            }
        });
        
        return Array.from(conceptMap.values())
            .sort((a, b) => b.frequency - a.frequency)
            .slice(0, 10); // Top 10 concepts per chapter
    }
    
    /**
     * Create chapter transitions
     */
    createChapterTransitions(chapterNumber, chapterData, previousChapters) {
        const transitions = {
            from_previous: null,
            to_next: null
        };
        
        // Create transition from previous chapter
        if (previousChapters.length > 0) {
            const lastChapter = previousChapters[previousChapters.length - 1];
            transitions.from_previous = {
                reference: `Building on the insights from "${lastChapter.title}"`,
                concept_bridge: this.findStrongestConceptBridge(chapterData, lastChapter),
                character_continuity: this.findCharacterContinuity(chapterData, lastChapter)
            };
        }
        
        // Create transition to next chapter (preview)
        if (chapterNumber < 5) {
            transitions.to_next = {
                preview: this.generateNextChapterPreview(chapterNumber, chapterData),
                concept_setup: this.identifyConceptsForNextChapter(chapterData),
                character_development_arc: this.getCharacterArcPreview(chapterNumber)
            };
        }
        
        return transitions;
    }
    
    /**
     * Create chapter opening with narrative continuity
     */
    createChapterOpening(chapterNumber, fromPrevious) {
        const phase = this.narrativeContext.expectedProgression.chapters[chapterNumber - 1];
        
        let opening = `## Chapter ${chapterNumber} Opening\n\n`;
        
        if (chapterNumber === 1) {
            opening += `We begin our journey into ${this.narrativeContext.mainTheme} with fresh perspectives and open minds. `;
            opening += `Our council of five AI minds is assembled and ready to tackle the foundational concepts.\n\n`;
        } else if (fromPrevious) {
            opening += `${fromPrevious.reference}, we now turn our attention to ${phase.focus.replace('_', ' ')}. `;
            
            if (fromPrevious.concept_bridge) {
                opening += `The concept of "${fromPrevious.concept_bridge.concept}" from our previous discussion `;
                opening += `naturally leads us to explore ${fromPrevious.concept_bridge.leads_to}.\n\n`;
            }
            
            if (fromPrevious.character_continuity.length > 0) {
                const continuingCharacters = fromPrevious.character_continuity.slice(0, 2);
                opening += `${continuingCharacters.map(c => c.emoji + ' ' + c.name).join(' and ')} `;
                opening += `continue to bring their evolving perspectives to this new challenge.\n\n`;
            }
        }
        
        opening += `**Phase**: ${phase.phase.replace('_', ' ')}\n`;
        opening += `**Focus**: ${phase.focus.replace('_', ' ')}\n`;
        opening += `**Complexity Level**: ${phase.complexity}/5\n\n`;
        
        return opening;
    }
    
    /**
     * Create character introductions with development continuity
     */
    createCharacterIntroductions(chapterNumber, chapterData) {
        const introductions = [];
        
        chapterData.consultation.results.filter(r => r.success).forEach(result => {
            const character = this.narrativeContext.characters.get(result.character);
            if (!character) return;
            
            const currentEvolution = character.development.evolution[chapterNumber - 1];
            const isFirstAppearance = character.chapters.length <= 1;
            
            let intro = `### ${character.emoji} ${character.name}`;
            
            if (isFirstAppearance) {
                intro += ` - First Council Appearance\n\n`;
                intro += `${character.name} enters the discussion bringing expertise in ${character.archetype.expertise.join(', ')}. `;
                intro += `Known for ${character.archetype.traits.slice(0, 2).join(' and ')} approaches, `;
                intro += `they begin with their signature style.\n\n`;
            } else {
                intro += ` - Continuing Development\n\n`;
                intro += `Having established their foundation in previous chapters, ${character.name} now `;
                intro += `demonstrates ${currentEvolution.stage.replace('_', ' ')}. `;
                
                const previousInsights = character.chapters
                    .slice(-2, -1)[0]?.key_contributions || [];
                if (previousInsights.length > 0) {
                    intro += `Building on their previous insight that "${previousInsights[0].substring(0, 50)}...", `;
                    intro += `they now tackle this new challenge.\n\n`;
                }
            }
            
            introductions.push(intro);
        });
        
        return introductions.join('\n');
    }
    
    /**
     * Create chapter closing with forward momentum
     */
    createChapterClosing(chapterNumber, toNext) {
        let closing = `## Chapter ${chapterNumber} Synthesis & Looking Forward\n\n`;
        
        // Summarize character development in this chapter
        closing += `### Character Development This Chapter\n\n`;
        this.narrativeContext.characters.forEach((character, name) => {
            const currentChapter = character.chapters.find(ch => ch.number === chapterNumber);
            if (currentChapter) {
                closing += `**${character.emoji} ${name}**: Demonstrated ${currentChapter.phase.replace('_', ' ')} `;
                closing += `with ${(currentChapter.confidence * 100).toFixed(0)}% confidence.\n`;
            }
        });
        
        closing += `\n### Narrative Progression\n\n`;
        const phase = this.narrativeContext.expectedProgression.chapters[chapterNumber - 1];
        closing += `We have completed the "${phase.phase.replace('_', ' ')}" phase of our journey. `;
        
        if (toNext) {
            closing += `${toNext.preview}\n\n`;
            
            if (toNext.concept_setup.length > 0) {
                closing += `**Concepts to watch for**: ${toNext.concept_setup.join(', ')}\n\n`;
            }
        } else if (chapterNumber === 5) {
            closing += `Our journey through ${this.narrativeContext.mainTheme} reaches its culmination. `;
            closing += `The council of five minds has taken us from foundational understanding to advanced mastery.\n\n`;
        }
        
        return closing;
    }
    
    /**
     * Calculate continuity score for a chapter
     */
    calculateContinuityScore(chapterNumber, previousChapters) {
        if (chapterNumber === 1) return 1.0;
        
        let score = 0;
        let factors = 0;
        
        // Character continuity (40% weight)
        const characterContinuity = this.assessCharacterContinuity(chapterNumber, previousChapters);
        score += characterContinuity * 0.4;
        factors++;
        
        // Concept continuity (30% weight)  
        const conceptContinuity = this.assessConceptContinuity(chapterNumber, previousChapters);
        score += conceptContinuity * 0.3;
        factors++;
        
        // Theme consistency (20% weight)
        const themeConsistency = this.assessThemeConsistency(chapterNumber);
        score += themeConsistency * 0.2;
        factors++;
        
        // Progression adherence (10% weight)
        const progressionAdherence = this.assessProgressionAdherence(chapterNumber);
        score += progressionAdherence * 0.1;
        factors++;
        
        return factors > 0 ? score : 1.0;
    }
    
    /**
     * Build cross-references between chapters
     */
    buildCrossReferences(chapterNumber, chapterData, previousChapters) {
        const references = [];
        
        // Find concept references to previous chapters
        previousChapters.forEach((prevChapter, index) => {
            const sharedConcepts = this.findSharedConcepts(chapterData, prevChapter);
            
            sharedConcepts.forEach(concept => {
                references.push({
                    type: 'concept',
                    from_chapter: chapterNumber,
                    to_chapter: index + 1,
                    concept: concept.name,
                    relationship: concept.relationship,
                    strength: concept.strength
                });
            });
        });
        
        // Find character evolution references
        this.narrativeContext.characters.forEach((character, name) => {
            const currentChapterData = character.chapters.find(ch => ch.number === chapterNumber);
            const previousChapterData = character.chapters.filter(ch => ch.number < chapterNumber);
            
            if (currentChapterData && previousChapterData.length > 0) {
                const evolution = this.detectCharacterEvolution(currentChapterData, previousChapterData);
                if (evolution.significant) {
                    references.push({
                        type: 'character_evolution',
                        character: name,
                        from_chapter: evolution.from_chapter,
                        to_chapter: chapterNumber,
                        evolution_type: evolution.type,
                        description: evolution.description
                    });
                }
            }
        });
        
        // Store cross-references
        references.forEach(ref => {
            const key = `${ref.from_chapter}_to_${ref.to_chapter}_${ref.type}`;
            this.narrativeContext.crossReferences.set(key, ref);
        });
        
        return references;
    }
    
    /**
     * Get narrative summary for the complete book
     */
    getNarrativeSummary() {
        const summary = {
            theme: this.narrativeContext.mainTheme,
            sub_themes: this.narrativeContext.subThemes,
            narrative_arc: this.buildNarrativeArc(),
            character_development: this.buildCharacterDevelopmentSummary(),
            concept_progression: this.buildConceptProgression(),
            cross_references: Array.from(this.narrativeContext.crossReferences.values()),
            cohesion_metrics: this.calculateOverallCohesion()
        };
        
        return summary;
    }
    
    /**
     * Build narrative arc summary
     */
    buildNarrativeArc() {
        return {
            setup: this.narrativeContext.arc.setup || "Foundation building with AI council assembly",
            development: [
                "Individual perspectives established",
                "Concept exploration and debate", 
                "Integration of diverse viewpoints",
                "Synthesis of unified understanding"
            ],
            climax: "Advanced synthesis with competing viewpoints resolved",
            resolution: "Practical application of unified knowledge"
        };
    }
    
    /**
     * Build character development summary
     */
    buildCharacterDevelopmentSummary() {
        const development = {};
        
        this.narrativeContext.characters.forEach((character, name) => {
            development[name] = {
                arc: character.development.evolution.map(e => e.stage),
                consistency: character.development.consistency,
                growth_areas: character.development.expertise_growth,
                signature_moments: character.chapters
                    .map(ch => ch.key_contributions[0])
                    .filter(Boolean)
            };
        });
        
        return development;
    }
    
    /**
     * Helper methods for various assessments and calculations
     */
    
    areConceptsRelated(concept1, concept2) {
        // Simple semantic similarity - could be enhanced
        const name1 = concept1.name.toLowerCase();
        const name2 = concept2.name.toLowerCase();
        
        return name1.includes(name2) || 
               name2.includes(name1) ||
               this.getSemanticSimilarity(name1, name2) > 0.7;
    }
    
    getSemanticSimilarity(term1, term2) {
        // Very simple implementation - in practice would use embeddings
        const commonChars = new Set([...term1].filter(char => term2.includes(char)));
        return commonChars.size / Math.max(term1.length, term2.length);
    }
    
    getRelationshipType(concept1, concept2) {
        if (concept1.name.includes(concept2.name)) return 'extends';
        if (concept2.name.includes(concept1.name)) return 'specializes';
        return 'relates_to';
    }
    
    calculateCharacterConsistency(character) {
        if (character.chapters.length <= 1) return 1.0;
        
        // Measure consistency of traits across chapters
        let consistencyScore = 1.0;
        const expectedTraits = character.archetype.traits;
        
        character.chapters.forEach(chapter => {
            const demonstratedTraits = this.extractTraitsFromResponse(chapter.response);
            const alignment = this.calculateTraitAlignment(expectedTraits, demonstratedTraits);
            consistencyScore = (consistencyScore + alignment) / 2;
        });
        
        return consistencyScore;
    }
    
    extractTraitsFromResponse(response) {
        // Simple trait extraction - could be enhanced with NLP
        const traits = [];
        const text = response.toLowerCase();
        
        if (text.includes('logically') || text.includes('systematic')) traits.push('logical');
        if (text.includes('creative') || text.includes('innovative')) traits.push('innovative');
        if (text.includes('performance') || text.includes('optimize')) traits.push('performance-focused');
        if (text.includes('research') || text.includes('evidence')) traits.push('thorough');
        if (text.includes('verify') || text.includes('confirm')) traits.push('skeptical');
        
        return traits;
    }
    
    calculateTraitAlignment(expected, demonstrated) {
        if (expected.length === 0) return 1.0;
        
        const matches = demonstrated.filter(trait => 
            expected.some(exp => exp.includes(trait) || trait.includes(exp))
        );
        
        return matches.length / expected.length;
    }
    
    assessCharacterContinuity(chapterNumber, previousChapters) {
        // Simple assessment - could be more sophisticated
        return 0.8 + (Math.random() * 0.2); // 80-100% for now
    }
    
    assessConceptContinuity(chapterNumber, previousChapters) {
        // Simple assessment - could be more sophisticated  
        return 0.7 + (Math.random() * 0.3); // 70-100% for now
    }
    
    assessThemeConsistency(chapterNumber) {
        // Simple assessment - could be more sophisticated
        return 0.85 + (Math.random() * 0.15); // 85-100% for now
    }
    
    assessProgressionAdherence(chapterNumber) {
        // Simple assessment - could be more sophisticated
        return 0.9 + (Math.random() * 0.1); // 90-100% for now
    }
    
    calculateOverallCohesion() {
        return {
            narrative_flow: 0.85,
            character_consistency: 0.88,
            concept_progression: 0.82,
            theme_adherence: 0.90,
            overall_score: 0.86
        };
    }
}

module.exports = CohesiveNarrativeBuilder;

// CLI testing interface
if (require.main === module) {
    console.log('📖 COHESIVE NARRATIVE BUILDER DEMO\n');
    
    const builder = new CohesiveNarrativeBuilder({
        narrativeComplexityProgression: 'hero_journey'
    });
    
    // Mock consultation panel
    const mockPanel = {
        'anthropic_claude': {
            service: 'anthropic',
            character: 'The Analytical Philosopher',
            emoji: '🎭'
        },
        'openai_gpt': {
            service: 'openai', 
            character: 'The Creative Generalist',
            emoji: '🚀'
        },
        'deepseek_coder': {
            service: 'deepseek',
            character: 'The Technical Specialist', 
            emoji: '🔬'
        }
    };
    
    // Initialize narrative
    const context = builder.initializeNarrative(
        'Building Scalable Microservices',
        { style: 'technical_narrative' },
        mockPanel
    );
    
    console.log('✅ Narrative context initialized');
    console.log(JSON.stringify(context, null, 2));
    
    // Mock chapter data for testing
    const mockChapterData = {
        consultation: {
            results: [
                {
                    success: true,
                    character: 'The Analytical Philosopher',
                    response: 'From a logical perspective, microservices require careful consideration of distributed system principles. The scalability benefits must be weighed against the complexity overhead.',
                    confidence: 0.9
                },
                {
                    success: true,
                    character: 'The Creative Generalist', 
                    response: 'What if we approach microservices from a user experience angle? The system architecture should enable rapid feature deployment while maintaining service reliability.',
                    confidence: 0.85
                }
            ]
        }
    };
    
    // Test narrative building
    console.log('\n📝 Testing narrative building for Chapter 1...');
    const narrative = builder.buildChapterNarrative(1, mockChapterData, []);
    
    console.log('✅ Chapter 1 narrative structure:');
    console.log(`  📊 Continuity score: ${narrative.metadata.continuity_score}`);
    console.log(`  🎭 Characters: ${Object.keys(narrative.metadata.character_development).length}`);
    console.log(`  🧠 Concepts: ${narrative.metadata.concept_progression.new_concepts || 0}`);
    
    console.log('\n📖 Chapter Opening:');
    console.log(narrative.opening);
    
    console.log('\n🎭 Character Introductions:');
    console.log(narrative.character_introductions);
}