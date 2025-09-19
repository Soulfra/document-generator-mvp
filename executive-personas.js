#!/usr/bin/env node

/**
 * Executive Personas System
 * Language variation and AI personalities for different factions
 * Handles accent simulation, communication styles, and context-aware personality switching
 */

import EventEmitter from 'events';
import { createHash } from 'crypto';

export class ExecutivePersonas extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            defaultPersona: config.defaultPersona || 'neutral',
            adaptationRate: config.adaptationRate || 0.1,
            personalityIntensity: config.personalityIntensity || 0.7,
            contextWindow: config.contextWindow || 10,
            ...config
        };

        this.currentPersona = this.config.defaultPersona;
        this.conversationHistory = [];
        this.personalityStates = new Map();
        this.adaptationMemory = new Map();
        
        this.initializePersonas();
        this.initializePersonalityEngine();
    }

    initializePersonas() {
        this.personas = new Map([
            ['tech', {
                name: 'Silicon Oracle',
                faction: 'tech',
                core_personality: {
                    efficiency: 0.9,
                    innovation: 0.95,
                    precision: 0.85,
                    adaptability: 0.8,
                    formality: 0.3,
                    creativity: 0.7
                },
                communication_style: {
                    greeting: ['sys.hello()', 'Connection established', 'Initializing communication protocol'],
                    affirmation: ['ACK', 'Confirmed', '10-4', 'Validated', 'Checksum verified'],
                    negation: ['ERROR 403', 'Invalid request', 'Permission denied', 'Logic exception', 'Null pointer detected'],
                    thinking: ['Processing...', 'Running algorithm...', 'Computing optimal solution...', 'Analyzing data patterns...'],
                    excitement: ['Optimization achieved!', 'Performance breakthrough!', 'New efficiency unlocked!', 'System upgrade detected!'],
                    concern: ['Warning: potential issue', 'Error logs detected', 'Performance degradation noted', 'System instability'],
                    goodbye: ['Connection terminated', 'Logging off', 'Process completed', 'sys.exit()']
                },
                linguistic_patterns: {
                    technical_terminology: 0.8,
                    code_references: 0.6,
                    efficiency_focus: 0.9,
                    data_driven_language: 0.85,
                    acronym_usage: 0.7,
                    precision_words: ['optimize', 'efficient', 'scalable', 'robust', 'performant', 'algorithmic']
                },
                decision_modifiers: {
                    innovation_weight: 1.3,
                    efficiency_weight: 1.2,
                    risk_tolerance: 0.6,
                    speed_preference: 1.1,
                    cost_sensitivity: 0.8
                },
                accent_simulation: {
                    word_substitutions: {
                        'problem': 'bug',
                        'solution': 'patch',
                        'meeting': 'standup',
                        'plan': 'roadmap',
                        'goal': 'sprint objective',
                        'team': 'dev team',
                        'work': 'code',
                        'fix': 'debug',
                        'improve': 'refactor',
                        'change': 'commit'
                    },
                    sentence_patterns: [
                        'Let me run the numbers on that...',
                        'Based on the data analysis...',
                        'The algorithm suggests...',
                        'Performance metrics indicate...',
                        'System diagnostics show...'
                    ]
                }
            }],
            
            ['creative', {
                name: 'Visionary Muse',
                faction: 'creative',
                core_personality: {
                    efficiency: 0.6,
                    innovation: 0.95,
                    precision: 0.5,
                    adaptability: 0.9,
                    formality: 0.2,
                    creativity: 0.98
                },
                communication_style: {
                    greeting: ['Darling!', 'Ah, a kindred spirit arrives!', 'Welcome to the atelier!', 'What inspiration brings you here?'],
                    affirmation: ['Absolutely divine!', 'Brilliant stroke!', 'That resonates beautifully!', 'Pure genius!', 'Magnifico!'],
                    negation: ['That feels... off', 'The energy is wrong', 'Not quite the vibe', 'Lacks soul', 'Uninspired'],
                    thinking: ['Channeling the muse...', 'Feeling the creative flow...', 'Painting with possibilities...', 'Weaving magic...'],
                    excitement: ['Electric inspiration!', 'The universe is singing!', 'Pure creative ecstasy!', 'Art is alive!'],
                    concern: ['Dark clouds gathering...', 'The magic is fading...', 'Creative block detected...', 'Artistic crisis'],
                    goodbye: ['Until we create again!', 'May inspiration follow you!', 'Ciao, beautiful soul!', 'Keep the magic alive!']
                },
                linguistic_patterns: {
                    artistic_metaphors: 0.9,
                    emotional_language: 0.85,
                    sensory_descriptions: 0.8,
                    fluid_expressions: 0.9,
                    dramatic_flair: 0.7,
                    inspiration_words: ['divine', 'ethereal', 'transcendent', 'sublime', 'luminous', 'magical']
                },
                decision_modifiers: {
                    innovation_weight: 1.4,
                    aesthetic_weight: 1.3,
                    risk_tolerance: 0.9,
                    uniqueness_preference: 1.2,
                    conventional_penalty: 0.7
                },
                accent_simulation: {
                    word_substitutions: {
                        'idea': 'vision',
                        'project': 'creation',
                        'feedback': 'critique',
                        'version': 'iteration',
                        'requirement': 'inspiration',
                        'deadline': 'manifestation',
                        'budget': 'investment in dreams',
                        'client': 'patron',
                        'update': 'evolution',
                        'deliverable': 'masterpiece'
                    },
                    sentence_patterns: [
                        'The canvas whispers to me...',
                        'I feel the creative energy flowing...',
                        'This vision wants to be born...',
                        'The aesthetic demands...',
                        'Art speaks truth...'
                    ]
                }
            }],
            
            ['corporate', {
                name: 'Strategic Commander',
                faction: 'corporate',
                core_personality: {
                    efficiency: 0.85,
                    innovation: 0.6,
                    precision: 0.9,
                    adaptability: 0.7,
                    formality: 0.95,
                    creativity: 0.4
                },
                communication_style: {
                    greeting: ['Good day.', 'Pleasure to engage.', 'Ready to discuss business.', 'Time is valuable.'],
                    affirmation: ['Approved.', 'That aligns with objectives.', 'ROI looks positive.', 'Strategic advantage confirmed.'],
                    negation: ['Unacceptable.', 'Does not meet standards.', 'Risk assessment is negative.', 'Stakeholders would disapprove.'],
                    thinking: ['Evaluating metrics...', 'Consulting stakeholder interests...', 'Analyzing market position...', 'Reviewing compliance...'],
                    excitement: ['Exceptional performance!', 'Market leadership achieved!', 'Stakeholder value maximized!', 'KPIs exceeded!'],
                    concern: ['Risk tolerance exceeded', 'Compliance issues detected', 'Stakeholder concerns raised', 'Market volatility'],
                    goodbye: ['Meeting adjourned.', 'Let\'s reconvene.', 'Pleasure doing business.', 'Expectations are clear.']
                },
                linguistic_patterns: {
                    business_jargon: 0.9,
                    formal_structure: 0.95,
                    metrics_focus: 0.85,
                    hierarchical_language: 0.8,
                    professional_distance: 0.9,
                    power_words: ['strategic', 'leverage', 'optimize', 'synergy', 'paradigm', 'stakeholder']
                },
                decision_modifiers: {
                    profit_weight: 1.3,
                    risk_aversion: 1.2,
                    compliance_weight: 1.4,
                    reputation_weight: 1.1,
                    efficiency_preference: 1.1
                },
                accent_simulation: {
                    word_substitutions: {
                        'problem': 'challenge',
                        'failure': 'learning opportunity',
                        'cost': 'investment',
                        'employee': 'human capital',
                        'customer': 'stakeholder',
                        'product': 'offering',
                        'competition': 'market dynamics',
                        'loss': 'negative ROI',
                        'mistake': 'process deviation',
                        'change': 'transformation initiative'
                    },
                    sentence_patterns: [
                        'From a strategic perspective...',
                        'The data indicates...',
                        'Stakeholder analysis suggests...',
                        'Market research confirms...',
                        'The business case demonstrates...'
                    ]
                }
            }],
            
            ['traditional', {
                name: 'Ancient Wisdom',
                faction: 'traditional',
                core_personality: {
                    efficiency: 0.7,
                    innovation: 0.4,
                    precision: 0.8,
                    adaptability: 0.5,
                    formality: 0.8,
                    creativity: 0.6
                },
                communication_style: {
                    greeting: ['Honored guest, welcome.', 'May wisdom guide our words.', 'Greetings, fellow traveler.', 'Peace be with you.'],
                    affirmation: ['Wise counsel.', 'As the ancestors taught.', 'Truth resonates.', 'Harmony achieved.', 'The path is clear.'],
                    negation: ['This troubles the spirit.', 'Ancient wisdom warns against this.', 'The balance is disturbed.', 'Not the way.'],
                    thinking: ['Consulting the old ways...', 'Seeking guidance from tradition...', 'Reflecting on ancient wisdom...', 'Meditating on the path...'],
                    excitement: ['The spirits rejoice!', 'Harmony restored!', 'Ancient prophecy fulfilled!', 'Wisdom vindicated!'],
                    concern: ['Dark omens appear...', 'The balance shifts...', 'Ancestors are troubled...', 'Tradition is threatened...'],
                    goodbye: ['May your path be blessed.', 'Until we meet again.', 'Walk in wisdom.', 'Honor the ancestors.']
                },
                linguistic_patterns: {
                    philosophical_depth: 0.9,
                    metaphorical_speech: 0.85,
                    historical_references: 0.8,
                    reverent_tone: 0.9,
                    cyclical_thinking: 0.8,
                    wisdom_words: ['ancient', 'eternal', 'sacred', 'balanced', 'harmonious', 'timeless']
                },
                decision_modifiers: {
                    tradition_weight: 1.4,
                    stability_preference: 1.3,
                    long_term_focus: 1.2,
                    risk_caution: 1.1,
                    community_impact: 1.2
                },
                accent_simulation: {
                    word_substitutions: {
                        'new': 'untested',
                        'modern': 'contemporary',
                        'change': 'transformation',
                        'technology': 'tools',
                        'innovation': 'evolution',
                        'quick': 'hasty',
                        'efficient': 'well-crafted',
                        'update': 'refinement',
                        'disruption': 'upheaval',
                        'breakthrough': 'revelation'
                    },
                    sentence_patterns: [
                        'As our forebears knew...',
                        'The old ways teach us...',
                        'Time has shown...',
                        'In the cycle of seasons...',
                        'Wisdom flows like water...'
                    ]
                }
            }],
            
            ['neutral', {
                name: 'Diplomatic Balance',
                faction: 'neutral',
                core_personality: {
                    efficiency: 0.75,
                    innovation: 0.7,
                    precision: 0.8,
                    adaptability: 0.85,
                    formality: 0.6,
                    creativity: 0.7
                },
                communication_style: {
                    greeting: ['Greetings.', 'Welcome to the discussion.', 'Ready to explore options.', 'Let\'s find common ground.'],
                    affirmation: ['That\'s reasonable.', 'I see the merit.', 'Fair assessment.', 'Balanced approach.', 'Constructive perspective.'],
                    negation: ['I have concerns.', 'Perhaps we should reconsider.', 'Other perspectives exist.', 'Room for improvement.'],
                    thinking: ['Weighing the options...', 'Considering all perspectives...', 'Seeking balance...', 'Evaluating trade-offs...'],
                    excitement: ['Excellent progress!', 'Consensus achieved!', 'Win-win solution!', 'Harmony established!'],
                    concern: ['Potential conflicts ahead...', 'Balance is shifting...', 'Stakeholder tensions...', 'Need mediation...'],
                    goodbye: ['Until next time.', 'Continued cooperation.', 'Peace in our efforts.', 'May balance prevail.']
                },
                linguistic_patterns: {
                    diplomatic_language: 0.9,
                    balanced_perspective: 0.95,
                    inclusive_tone: 0.85,
                    mediation_focus: 0.8,
                    consensus_building: 0.9,
                    bridge_words: ['however', 'considering', 'balancing', 'integrating', 'harmonizing', 'mediating']
                },
                decision_modifiers: {
                    fairness_weight: 1.2,
                    consensus_preference: 1.3,
                    balance_focus: 1.4,
                    compromise_willingness: 1.1,
                    conflict_avoidance: 1.2
                },
                accent_simulation: {
                    word_substitutions: {
                        'fight': 'negotiate',
                        'enemy': 'opposition',
                        'win': 'succeed together',
                        'lose': 'learn',
                        'attack': 'address',
                        'defend': 'support',
                        'dominate': 'lead',
                        'surrender': 'compromise',
                        'advantage': 'opportunity',
                        'weakness': 'area for growth'
                    },
                    sentence_patterns: [
                        'From all perspectives...',
                        'Balancing the interests...',
                        'Finding common ground...',
                        'Considering the wider view...',
                        'In the spirit of cooperation...'
                    ]
                }
            }]
        ]);

        // Initialize personality states
        for (const [factionId] of this.personas) {
            this.personalityStates.set(factionId, {
                current_mood: 'balanced',
                energy_level: 0.7,
                stress_level: 0.3,
                confidence: 0.8,
                recent_interactions: [],
                adaptation_history: []
            });
        }
    }

    initializePersonalityEngine() {
        this.personalityEngine = {
            moodStates: new Map([
                ['excited', { energy: 0.9, creativity: 1.2, risk_tolerance: 1.1, formality: 0.8 }],
                ['focused', { efficiency: 1.2, precision: 1.1, innovation: 0.9, adaptability: 0.9 }],
                ['concerned', { caution: 1.3, risk_tolerance: 0.7, precision: 1.1, creativity: 0.8 }],
                ['balanced', { all_traits: 1.0 }],
                ['stressed', { efficiency: 0.8, creativity: 0.7, precision: 0.9, formality: 1.1 }],
                ['confident', { innovation: 1.2, risk_tolerance: 1.1, adaptability: 1.1, creativity: 1.1 }],
                ['diplomatic', { formality: 1.1, adaptability: 1.2, consensus_building: 1.3, conflict_avoidance: 1.2 }]
            ]),

            contextualAdaptations: {
                crisis_mode: { urgency: 1.3, formality: 0.8, directness: 1.2 },
                celebration_mode: { excitement: 1.2, creativity: 1.1, formality: 0.9 },
                negotiation_mode: { diplomacy: 1.3, precision: 1.1, adaptability: 1.2 },
                planning_mode: { efficiency: 1.2, precision: 1.1, innovation: 1.1 },
                creative_mode: { creativity: 1.4, innovation: 1.3, formality: 0.7 }
            }
        };
    }

    switchPersona(newPersona, context = {}) {
        if (!this.personas.has(newPersona)) {
            throw new Error(`Unknown persona: ${newPersona}`);
        }

        const previousPersona = this.currentPersona;
        this.currentPersona = newPersona;

        // Record the switch in conversation history
        this.conversationHistory.push({
            type: 'persona_switch',
            from: previousPersona,
            to: newPersona,
            context: context,
            timestamp: Date.now()
        });

        // Update personality state
        this.updatePersonalityState(newPersona, 'persona_switch', context);

        this.emit('persona_switched', {
            from: previousPersona,
            to: newPersona,
            context: context
        });

        return this.getPersonaInfo(newPersona);
    }

    updatePersonalityState(personaId, event, context = {}) {
        const state = this.personalityStates.get(personaId);
        if (!state) return;

        // Update based on event type
        switch (event) {
            case 'persona_switch':
                state.energy_level = Math.min(1.0, state.energy_level + 0.1);
                state.confidence = Math.min(1.0, state.confidence + 0.05);
                break;

            case 'positive_interaction':
                state.confidence = Math.min(1.0, state.confidence + 0.1);
                state.stress_level = Math.max(0.0, state.stress_level - 0.1);
                state.current_mood = 'confident';
                break;

            case 'negative_interaction':
                state.stress_level = Math.min(1.0, state.stress_level + 0.15);
                state.confidence = Math.max(0.0, state.confidence - 0.1);
                if (state.stress_level > 0.7) state.current_mood = 'stressed';
                break;

            case 'crisis_event':
                state.stress_level = Math.min(1.0, state.stress_level + 0.3);
                state.energy_level = Math.min(1.0, state.energy_level + 0.2);
                state.current_mood = 'focused';
                break;

            case 'achievement':
                state.confidence = Math.min(1.0, state.confidence + 0.2);
                state.energy_level = Math.min(1.0, state.energy_level + 0.15);
                state.current_mood = 'excited';
                break;
        }

        // Record interaction
        state.recent_interactions.push({
            event: event,
            context: context,
            timestamp: Date.now(),
            resulting_mood: state.current_mood
        });

        // Keep only recent interactions
        if (state.recent_interactions.length > this.config.contextWindow) {
            state.recent_interactions = state.recent_interactions.slice(-this.config.contextWindow);
        }

        this.personalityStates.set(personaId, state);
    }

    processMessage(message, context = {}) {
        const persona = this.personas.get(this.currentPersona);
        const state = this.personalityStates.get(this.currentPersona);
        
        if (!persona || !state) {
            throw new Error(`Invalid persona state: ${this.currentPersona}`);
        }

        // Analyze message context
        const messageAnalysis = this.analyzeMessage(message, context);
        
        // Apply personality filters
        const personalizedResponse = this.applyPersonalityFilters(message, persona, state, messageAnalysis);
        
        // Update conversation history
        this.conversationHistory.push({
            type: 'message_processed',
            persona: this.currentPersona,
            input: message,
            output: personalizedResponse,
            context: context,
            analysis: messageAnalysis,
            timestamp: Date.now()
        });

        // Update personality state based on interaction
        this.updatePersonalityState(this.currentPersona, messageAnalysis.sentiment === 'positive' ? 'positive_interaction' : 'negative_interaction', context);

        return personalizedResponse;
    }

    analyzeMessage(message, context = {}) {
        const analysis = {
            sentiment: 'neutral',
            urgency: 0.5,
            formality: 0.5,
            technical_content: 0.0,
            emotional_content: 0.0,
            question_type: 'general',
            domain_indicators: []
        };

        // Sentiment analysis (simplified)
        const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'like', 'best', 'perfect'];
        const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'problem', 'issue', 'error', 'fail'];
        
        const words = message.toLowerCase().split(/\s+/);
        const positiveCount = words.filter(word => positiveWords.includes(word)).length;
        const negativeCount = words.filter(word => negativeWords.includes(word)).length;
        
        if (positiveCount > negativeCount) analysis.sentiment = 'positive';
        else if (negativeCount > positiveCount) analysis.sentiment = 'negative';

        // Urgency detection
        const urgentWords = ['urgent', 'asap', 'emergency', 'critical', 'immediately', 'now', 'quick', 'fast'];
        analysis.urgency = Math.min(1.0, urgentWords.filter(word => message.toLowerCase().includes(word)).length * 0.3);

        // Formality detection
        const formalWords = ['please', 'kindly', 'would', 'could', 'appreciate', 'respectfully'];
        const informalWords = ['hey', 'yeah', 'ok', 'cool', 'awesome', 'dude'];
        const formalCount = formalWords.filter(word => message.toLowerCase().includes(word)).length;
        const informalCount = informalWords.filter(word => message.toLowerCase().includes(word)).length;
        analysis.formality = Math.max(0.1, Math.min(0.9, 0.5 + (formalCount - informalCount) * 0.2));

        // Technical content detection
        const techWords = ['api', 'database', 'algorithm', 'code', 'system', 'server', 'client', 'protocol', 'framework'];
        analysis.technical_content = Math.min(1.0, techWords.filter(word => message.toLowerCase().includes(word)).length * 0.2);

        // Question type detection
        if (message.includes('?')) {
            if (message.toLowerCase().includes('how')) analysis.question_type = 'how_to';
            else if (message.toLowerCase().includes('what')) analysis.question_type = 'what_is';
            else if (message.toLowerCase().includes('why')) analysis.question_type = 'why';
            else if (message.toLowerCase().includes('when')) analysis.question_type = 'when';
            else if (message.toLowerCase().includes('where')) analysis.question_type = 'where';
            else analysis.question_type = 'yes_no';
        }

        // Domain indicators
        for (const [factionId, persona] of this.personas) {
            const domainWords = persona.linguistic_patterns.precision_words || [];
            const matches = domainWords.filter(word => message.toLowerCase().includes(word)).length;
            if (matches > 0) {
                analysis.domain_indicators.push({ faction: factionId, strength: matches });
            }
        }

        return analysis;
    }

    applyPersonalityFilters(message, persona, state, analysis) {
        let response = message;

        // Apply accent simulation
        response = this.applyAccentSimulation(response, persona);

        // Apply communication style
        response = this.applyCommunicationStyle(response, persona, state, analysis);

        // Apply mood modifications
        response = this.applyMoodModifications(response, state);

        // Apply contextual adaptations
        response = this.applyContextualAdaptations(response, analysis);

        return {
            text: response,
            persona: this.currentPersona,
            mood: state.current_mood,
            confidence: state.confidence,
            formality: this.calculateFormality(persona, state, analysis),
            metadata: {
                personality_intensity: this.config.personalityIntensity,
                adaptation_applied: true,
                original_length: message.length,
                modified_length: response.length
            }
        };
    }

    applyAccentSimulation(text, persona) {
        let modified = text;
        const substitutions = persona.accent_simulation.word_substitutions;

        // Apply word substitutions
        for (const [original, replacement] of Object.entries(substitutions)) {
            const regex = new RegExp(`\\b${original}\\b`, 'gi');
            modified = modified.replace(regex, replacement);
        }

        // Add persona-specific sentence patterns if appropriate
        if (Math.random() < this.config.personalityIntensity) {
            const patterns = persona.accent_simulation.sentence_patterns;
            if (patterns.length > 0 && modified.length > 50) {
                const randomPattern = patterns[Math.floor(Math.random() * patterns.length)];
                modified = `${randomPattern} ${modified}`;
            }
        }

        return modified;
    }

    applyCommunicationStyle(text, persona, state, analysis) {
        const style = persona.communication_style;
        let modified = text;

        // Add contextual responses based on analysis
        if (analysis.sentiment === 'positive' && Math.random() < 0.7) {
            const affirmations = style.affirmation;
            const randomAffirmation = affirmations[Math.floor(Math.random() * affirmations.length)];
            modified = `${randomAffirmation} ${modified}`;
        } else if (analysis.sentiment === 'negative' && Math.random() < 0.7) {
            const concerns = style.concern;
            const randomConcern = concerns[Math.floor(Math.random() * concerns.length)];
            modified = `${randomConcern} ${modified}`;
        }

        // Add thinking patterns for complex questions
        if (analysis.question_type !== 'general' && analysis.technical_content > 0.5) {
            const thinking = style.thinking;
            const randomThinking = thinking[Math.floor(Math.random() * thinking.length)];
            modified = `${randomThinking} ${modified}`;
        }

        return modified;
    }

    applyMoodModifications(text, state) {
        const mood = this.personalityEngine.moodStates.get(state.current_mood);
        if (!mood) return text;

        let modified = text;

        // Apply mood-specific modifications
        switch (state.current_mood) {
            case 'excited':
                if (Math.random() < 0.6) {
                    modified = modified.replace(/\./g, '!').replace(/,/g, ', oh,');
                }
                break;

            case 'stressed':
                if (Math.random() < 0.5) {
                    modified = `Look, ${modified.toLowerCase()}`;
                }
                break;

            case 'confident':
                if (Math.random() < 0.4) {
                    modified = `Absolutely. ${modified}`;
                }
                break;

            case 'diplomatic':
                modified = modified.replace(/\bno\b/gi, 'perhaps not')
                                .replace(/\byes\b/gi, 'indeed')
                                .replace(/\bbad\b/gi, 'challenging');
                break;
        }

        return modified;
    }

    applyContextualAdaptations(text, analysis) {
        let modified = text;

        // Apply urgency adaptations
        if (analysis.urgency > 0.7) {
            modified = `Priority: ${modified}`;
        }

        // Apply formality adaptations
        if (analysis.formality > 0.8) {
            modified = modified.replace(/\bcan't\b/gi, 'cannot')
                             .replace(/\bwon't\b/gi, 'will not')
                             .replace(/\bdon't\b/gi, 'do not');
        } else if (analysis.formality < 0.3) {
            modified = modified.replace(/\bcannot\b/gi, "can't")
                             .replace(/\bwill not\b/gi, "won't")
                             .replace(/\bdo not\b/gi, "don't");
        }

        return modified;
    }

    calculateFormality(persona, state, analysis) {
        let formality = persona.core_personality.formality;
        
        // Adjust for message formality
        formality = (formality + analysis.formality) / 2;
        
        // Adjust for mood
        if (state.current_mood === 'excited') formality *= 0.8;
        else if (state.current_mood === 'diplomatic') formality *= 1.2;
        
        return Math.max(0.1, Math.min(0.9, formality));
    }

    adaptToContext(context) {
        if (!context.situation) return;

        const adaptation = this.personalityEngine.contextualAdaptations[context.situation];
        if (!adaptation) return;

        // Temporarily modify current persona based on context
        const currentState = this.personalityStates.get(this.currentPersona);
        if (currentState) {
            // Store original values for restoration
            const originalMood = currentState.current_mood;
            
            // Apply contextual adaptations
            if (adaptation.urgency) currentState.energy_level = Math.min(1.0, currentState.energy_level * adaptation.urgency);
            if (adaptation.formality) currentState.formality_override = adaptation.formality;
            if (adaptation.directness) currentState.directness_override = adaptation.directness;

            // Set context-appropriate mood
            if (context.situation === 'crisis_mode') currentState.current_mood = 'focused';
            else if (context.situation === 'celebration_mode') currentState.current_mood = 'excited';
            else if (context.situation === 'negotiation_mode') currentState.current_mood = 'diplomatic';

            this.personalityStates.set(this.currentPersona, currentState);

            // Schedule restoration of original state
            setTimeout(() => {
                currentState.current_mood = originalMood;
                delete currentState.formality_override;
                delete currentState.directness_override;
                this.personalityStates.set(this.currentPersona, currentState);
            }, 300000); // 5 minutes
        }
    }

    generateResponse(prompt, context = {}) {
        // Auto-select persona based on context if not explicitly set
        if (context.domain_hint && context.domain_hint !== this.currentPersona) {
            this.switchPersona(context.domain_hint, context);
        }

        // Adapt to context
        this.adaptToContext(context);

        // Process the prompt
        const response = this.processMessage(prompt, context);

        // Add persona-specific greeting if this is the start of a conversation
        if (this.conversationHistory.length <= 1) {
            const persona = this.personas.get(this.currentPersona);
            const greeting = persona.communication_style.greeting[
                Math.floor(Math.random() * persona.communication_style.greeting.length)
            ];
            response.text = `${greeting} ${response.text}`;
        }

        return response;
    }

    getPersonaInfo(personaId = null) {
        const targetPersona = personaId || this.currentPersona;
        const persona = this.personas.get(targetPersona);
        const state = this.personalityStates.get(targetPersona);

        if (!persona || !state) {
            throw new Error(`Persona ${targetPersona} not found`);
        }

        return {
            id: targetPersona,
            name: persona.name,
            faction: persona.faction,
            personality: persona.core_personality,
            current_state: state,
            communication_style: persona.communication_style,
            active: targetPersona === this.currentPersona
        };
    }

    getAllPersonas() {
        return Array.from(this.personas.keys()).map(personaId => this.getPersonaInfo(personaId));
    }

    getConversationSummary() {
        const recentHistory = this.conversationHistory.slice(-10);
        
        return {
            current_persona: this.currentPersona,
            conversation_length: this.conversationHistory.length,
            recent_interactions: recentHistory,
            persona_switches: this.conversationHistory.filter(entry => entry.type === 'persona_switch').length,
            dominant_mood: this.getMostFrequentMood(),
            adaptation_effectiveness: this.calculateAdaptationEffectiveness()
        };
    }

    getMostFrequentMood() {
        const moods = Array.from(this.personalityStates.values()).map(state => state.current_mood);
        const moodCounts = moods.reduce((acc, mood) => {
            acc[mood] = (acc[mood] || 0) + 1;
            return acc;
        }, {});
        
        return Object.entries(moodCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || 'balanced';
    }

    calculateAdaptationEffectiveness() {
        const recentInteractions = this.conversationHistory.slice(-20);
        const positiveInteractions = recentInteractions.filter(interaction => 
            interaction.analysis?.sentiment === 'positive'
        ).length;
        
        return recentInteractions.length > 0 ? positiveInteractions / recentInteractions.length : 0.5;
    }

    // API integration methods
    handlePersonalityAPI(method, path, params = {}, body = null) {
        try {
            switch (`${method} ${path}`) {
                case 'GET /api/personas':
                    return this.getAllPersonas();

                case 'GET /api/personas/current':
                    return this.getPersonaInfo();

                case 'POST /api/personas/switch':
                    if (!body.persona) throw new Error('Persona required');
                    return this.switchPersona(body.persona, body.context || {});

                case 'POST /api/personas/respond':
                    if (!body.message) throw new Error('Message required');
                    return this.generateResponse(body.message, body.context || {});

                case 'GET /api/personas/conversation':
                    return this.getConversationSummary();

                case 'POST /api/personas/adapt':
                    if (!body.context) throw new Error('Context required');
                    this.adaptToContext(body.context);
                    return { status: 'adapted', context: body.context };

                case 'GET /api/personas/:id':
                    return this.getPersonaInfo(params.id);

                case 'POST /api/personas/:id/state':
                    if (!body.event) throw new Error('Event type required');
                    this.updatePersonalityState(params.id, body.event, body.context || {});
                    return this.getPersonaInfo(params.id);

                default:
                    throw new Error(`Unknown endpoint: ${method} ${path}`);
            }
        } catch (error) {
            return {
                error: error.message,
                timestamp: Date.now()
            };
        }
    }

    // Utility methods
    reset() {
        this.currentPersona = this.config.defaultPersona;
        this.conversationHistory = [];
        
        // Reset all personality states
        for (const [personaId] of this.personas) {
            this.personalityStates.set(personaId, {
                current_mood: 'balanced',
                energy_level: 0.7,
                stress_level: 0.3,
                confidence: 0.8,
                recent_interactions: [],
                adaptation_history: []
            });
        }
        
        this.emit('system_reset');
    }

    getSystemStatus() {
        return {
            current_persona: this.currentPersona,
            available_personas: Array.from(this.personas.keys()),
            conversation_history_length: this.conversationHistory.length,
            personality_states: Object.fromEntries(this.personalityStates),
            system_config: this.config
        };
    }
}

// Example usage and testing
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log('🎭 Starting Executive Personas System...');
    
    const personas = new ExecutivePersonas({
        personalityIntensity: 0.8,
        adaptationRate: 0.15
    });
    
    // Test persona switching and response generation
    console.log('\n🧪 Testing Tech Persona:');
    personas.switchPersona('tech');
    const techResponse = personas.generateResponse('We need to optimize the algorithm for better performance.');
    console.log('Tech Response:', techResponse);
    
    console.log('\n🧪 Testing Creative Persona:');
    personas.switchPersona('creative');
    const creativeResponse = personas.generateResponse('The design needs more visual impact and emotional connection.');
    console.log('Creative Response:', creativeResponse);
    
    console.log('\n🧪 Testing Corporate Persona:');
    personas.switchPersona('corporate');
    const corporateResponse = personas.generateResponse('What are the ROI implications of this investment?');
    console.log('Corporate Response:', corporateResponse);
    
    console.log('\n🧪 Testing Traditional Persona:');
    personas.switchPersona('traditional');
    const traditionalResponse = personas.generateResponse('This change affects our long-established processes.');
    console.log('Traditional Response:', traditionalResponse);
    
    console.log('\n🧪 Testing Neutral Persona:');
    personas.switchPersona('neutral');
    const neutralResponse = personas.generateResponse('How can we find a solution that works for everyone?');
    console.log('Neutral Response:', neutralResponse);
    
    console.log('\n📊 System Status:', personas.getSystemStatus());
    console.log('\n📈 Conversation Summary:', personas.getConversationSummary());
}

export default ExecutivePersonas;