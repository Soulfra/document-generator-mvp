#!/usr/bin/env node

// 🧠 INTELLIGENCE BRAIN LAYER
// The Librarian, Storyteller, and Reasoning Engine
// Everything flows through this like a body in a green suit

const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');
const crypto = require('crypto');

class IntelligenceBrainLayer extends EventEmitter {
    constructor() {
        super();
        
        // Initialize these as null, will be set up after class definitions
        this.librarian = null;
        this.storyteller = null;
        this.reasoningEngine = null;
        
        // Memory systems
        this.shortTermMemory = new Map();
        this.longTermMemory = new Map();
        this.workingMemory = new Map();
        
        // Green suit mapping (can be anything)
        this.bodyMapping = {
            head: 'reasoning',
            heart: 'storyteller',
            hands: 'librarian',
            eyes: 'perception',
            ears: 'listening',
            mouth: 'expression',
            nervous_system: 'message_passing'
        };
        
        // Neural pathways
        this.neuralConnections = new Map();
        this.synapseStrength = new Map();
        
        console.log('🧠 Intelligence Brain Layer initialized');
        console.log('🎭 Green suit body ready for mapping');
    }
    
    setupIntelligences() {
        // Initialize the three core intelligences after class definitions are available
        console.log('Creating Librarian...');
        this.librarian = new Librarian();
        console.log('Librarian created, catalog method:', typeof this.librarian.catalog);
        
        console.log('Creating Storyteller...');
        this.storyteller = new Storyteller();
        
        console.log('Creating ReasoningEngine...');
        this.reasoningEngine = new ReasoningEngine();
        
        console.log('🧠 Intelligence subsystems initialized');
    }
    
    // Main processing pipeline - everything flows through here
    async process(input) {
        console.log('🧠 Processing through brain layer...');
        
        // 1. Librarian catalogs and retrieves context
        const context = await this.librarian.catalog(input);
        
        // 2. Reasoning engine thinks about it
        const reasoning = await this.reasoningEngine.reason(context);
        
        // 3. Storyteller creates narrative
        const narrative = await this.storyteller.narrate(reasoning);
        
        // 4. Update memories
        await this.updateMemories(input, context, reasoning, narrative);
        
        // 5. Learn and strengthen connections
        await this.learn(input, narrative);
        
        return {
            input,
            context,
            reasoning,
            narrative,
            timestamp: Date.now(),
            brainState: this.getBrainState()
        };
    }
    
    async updateMemories(input, context, reasoning, narrative) {
        const memoryId = crypto.randomUUID();
        
        // Short-term (last 100 items)
        this.shortTermMemory.set(memoryId, { input, timestamp: Date.now() });
        if (this.shortTermMemory.size > 100) {
            const oldest = Array.from(this.shortTermMemory.keys())[0];
            this.shortTermMemory.delete(oldest);
        }
        
        // Working memory (active thoughts)
        this.workingMemory.set('current_context', context);
        this.workingMemory.set('current_reasoning', reasoning);
        this.workingMemory.set('current_narrative', narrative);
        
        // Long-term (important patterns)
        if (reasoning.importance > 0.7) {
            this.longTermMemory.set(memoryId, {
                pattern: reasoning.pattern,
                narrative: narrative.summary,
                learned: Date.now()
            });
        }
    }
    
    async learn(input, narrative) {
        // Strengthen neural connections based on usage
        const concepts = this.extractConcepts(input, narrative);
        
        for (const concept of concepts) {
            const currentStrength = this.synapseStrength.get(concept) || 0;
            this.synapseStrength.set(concept, currentStrength + 0.1);
            
            // Create new neural pathways
            if (!this.neuralConnections.has(concept)) {
                this.neuralConnections.set(concept, new Set());
            }
            
            // Connect related concepts
            for (const otherConcept of concepts) {
                if (concept !== otherConcept) {
                    this.neuralConnections.get(concept).add(otherConcept);
                }
            }
        }
    }
    
    extractConcepts(input, narrative) {
        // Extract key concepts from input and narrative
        const concepts = new Set();
        
        // Simple extraction (would be more sophisticated)
        const words = JSON.stringify({ input, narrative })
            .toLowerCase()
            .match(/\b\w+\b/g) || [];
            
        const importantWords = words.filter(w => w.length > 4);
        importantWords.slice(0, 10).forEach(w => concepts.add(w));
        
        return Array.from(concepts);
    }
    
    getBrainState() {
        return {
            shortTermMemorySize: this.shortTermMemory.size,
            longTermMemorySize: this.longTermMemory.size,
            workingMemoryActive: this.workingMemory.size,
            neuralPathways: this.neuralConnections.size,
            strongestConcepts: Array.from(this.synapseStrength.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([concept, strength]) => ({ concept, strength }))
        };
    }
}

// 📚 The Librarian - Manages knowledge and retrieval
class Librarian {
    constructor() {
        this.catalogStorage = new Map();
        this.index = new Map();
        this.categories = new Map();
    }
    
    async catalog(input) {
        console.log('📚 Librarian cataloging input...');
        
        const id = crypto.randomUUID();
        const metadata = {
            id,
            type: this.classifyInput(input),
            timestamp: Date.now(),
            tags: this.extractTags(input),
            category: this.categorize(input)
        };
        
        // Store in catalog
        this.catalogStorage.set(id, { input, metadata });
        
        // Update indices
        for (const tag of metadata.tags) {
            if (!this.index.has(tag)) {
                this.index.set(tag, new Set());
            }
            this.index.get(tag).add(id);
        }
        
        // Find related knowledge
        const related = await this.findRelated(input, metadata);
        
        return {
            catalogId: id,
            metadata,
            related,
            knowledgeGraph: this.buildKnowledgeGraph(input, related)
        };
    }
    
    classifyInput(input) {
        if (input.type) return input.type;
        if (typeof input === 'string') return 'text';
        if (Array.isArray(input)) return 'array';
        return 'object';
    }
    
    extractTags(input) {
        const tags = new Set();
        const text = JSON.stringify(input).toLowerCase();
        
        // Extract meaningful tags
        const patterns = [
            /player_\d+/g,
            /npc_\w+/g,
            /item_\w+/g,
            /event_\w+/g,
            /\b(combat|trade|quest|boss|treasure)\b/g
        ];
        
        for (const pattern of patterns) {
            const matches = text.match(pattern) || [];
            matches.forEach(m => tags.add(m));
        }
        
        return Array.from(tags);
    }
    
    categorize(input) {
        const text = JSON.stringify(input).toLowerCase();
        
        if (text.includes('combat') || text.includes('damage')) return 'combat';
        if (text.includes('trade') || text.includes('economy')) return 'economy';
        if (text.includes('quest') || text.includes('mission')) return 'quest';
        if (text.includes('dialogue') || text.includes('npc')) return 'social';
        
        return 'general';
    }
    
    async findRelated(input, metadata) {
        const related = [];
        
        // Find by tags
        for (const tag of metadata.tags) {
            const taggedItems = this.index.get(tag) || new Set();
            for (const itemId of taggedItems) {
                if (itemId !== metadata.id) {
                    const item = this.catalogStorage.get(itemId);
                    if (item) {
                        related.push({
                            id: itemId,
                            relevance: this.calculateRelevance(input, item.input),
                            data: item
                        });
                    }
                }
            }
        }
        
        // Sort by relevance
        return related
            .sort((a, b) => b.relevance - a.relevance)
            .slice(0, 5);
    }
    
    calculateRelevance(input1, input2) {
        // Simple relevance calculation
        const text1 = JSON.stringify(input1).toLowerCase();
        const text2 = JSON.stringify(input2).toLowerCase();
        
        let score = 0;
        const words1 = text1.match(/\b\w+\b/g) || [];
        const words2 = text2.match(/\b\w+\b/g) || [];
        
        for (const word of words1) {
            if (words2.includes(word)) score++;
        }
        
        return score / Math.max(words1.length, words2.length);
    }
    
    buildKnowledgeGraph(input, related) {
        return {
            nodes: [
                { id: 'current', label: 'Current Input', data: input },
                ...related.map(r => ({
                    id: r.id,
                    label: `Related (${(r.relevance * 100).toFixed(0)}%)`,
                    data: r.data
                }))
            ],
            edges: related.map(r => ({
                from: 'current',
                to: r.id,
                weight: r.relevance
            }))
        };
    }
}

// 📖 The Storyteller - Creates narratives from data
class Storyteller {
    constructor() {
        this.narrativeTemplates = {
            combat: [
                "In a fierce battle, {attacker} struck {defender} with {ability}, dealing {damage} damage!",
                "The clash of steel rang out as {attacker} engaged {defender} in mortal combat.",
                "{defender} barely survived the onslaught from {attacker}'s devastating {ability}."
            ],
            discovery: [
                "A remarkable discovery! {player} found {item} hidden in {location}.",
                "Fortune smiled upon {player} as they uncovered the legendary {item}.",
                "After much searching, {player} finally discovered {item}."
            ],
            social: [
                "{npc} spoke in hushed tones: '{dialogue}'",
                "The mysterious {npc} revealed crucial information: '{dialogue}'",
                "'{dialogue}' said {npc}, their eyes gleaming with hidden knowledge."
            ]
        };
        
        this.storyArcs = new Map();
        this.characterDevelopment = new Map();
    }
    
    async narrate(reasoning) {
        console.log('📖 Storyteller creating narrative...');
        
        const narrative = {
            scene: this.setScene(reasoning),
            action: this.describeAction(reasoning),
            dialogue: this.generateDialogue(reasoning),
            emotion: this.conveyEmotion(reasoning),
            foreshadowing: this.addForeshadowing(reasoning),
            summary: '',
            storyArc: this.updateStoryArc(reasoning)
        };
        
        // Combine into cohesive narrative
        narrative.summary = this.combineNarrative(narrative);
        
        return narrative;
    }
    
    setScene(reasoning) {
        const locations = [
            "the ancient ruins",
            "the bustling marketplace", 
            "the dark forest",
            "the crystal caverns",
            "the floating citadel"
        ];
        
        const time = [
            "As dawn broke",
            "Under the blood moon",
            "In the dead of night",
            "As storm clouds gathered",
            "When the stars aligned"
        ];
        
        return `${time[Math.floor(Math.random() * time.length)]} over ${locations[Math.floor(Math.random() * locations.length)]}`;
    }
    
    describeAction(reasoning) {
        if (reasoning.pattern === 'combat') {
            return this.narrativeTemplates.combat[Math.floor(Math.random() * this.narrativeTemplates.combat.length)];
        }
        
        if (reasoning.pattern === 'discovery') {
            return this.narrativeTemplates.discovery[Math.floor(Math.random() * this.narrativeTemplates.discovery.length)];
        }
        
        return "Something remarkable happened.";
    }
    
    generateDialogue(reasoning) {
        if (reasoning.context?.dialogue) {
            return reasoning.context.dialogue;
        }
        
        const dialogues = [
            "The prophecy speaks of this moment...",
            "You have much to learn, young one.",
            "Power comes with a terrible price.",
            "The ancient ones knew this day would come.",
            "Choose wisely, for the fate of many rests in your hands."
        ];
        
        return dialogues[Math.floor(Math.random() * dialogues.length)];
    }
    
    conveyEmotion(reasoning) {
        const emotions = {
            high_stakes: "tension filled the air",
            victory: "triumphant cheers echoed",
            defeat: "despair settled like a heavy fog",
            mystery: "an eerie silence descended",
            discovery: "excitement rippled through the realm"
        };
        
        return emotions[reasoning.mood] || emotions.mystery;
    }
    
    addForeshadowing(reasoning) {
        if (reasoning.importance > 0.8) {
            return "Little did they know, this moment would echo through eternity...";
        }
        
        if (reasoning.pattern === 'quest') {
            return "The journey ahead would test them in ways unimaginable...";
        }
        
        return "";
    }
    
    combineNarrative(narrative) {
        const parts = [
            narrative.scene,
            narrative.action,
            narrative.emotion,
            narrative.dialogue ? `"${narrative.dialogue}"` : '',
            narrative.foreshadowing
        ].filter(p => p);
        
        return parts.join('. ') + '.';
    }
    
    updateStoryArc(reasoning) {
        const arcId = reasoning.questId || 'main';
        
        if (!this.storyArcs.has(arcId)) {
            this.storyArcs.set(arcId, {
                id: arcId,
                acts: [],
                tension: 0,
                climaxReached: false
            });
        }
        
        const arc = this.storyArcs.get(arcId);
        arc.acts.push({
            timestamp: Date.now(),
            event: reasoning.pattern,
            tensionDelta: reasoning.importance * 0.2
        });
        
        arc.tension = Math.min(1, arc.tension + reasoning.importance * 0.1);
        
        if (arc.tension > 0.9 && !arc.climaxReached) {
            arc.climaxReached = true;
            return "CLIMAX_REACHED";
        }
        
        return arc.tension > 0.5 ? "RISING_ACTION" : "EXPOSITION";
    }
}

// 🤔 The Reasoning Engine - Makes decisions and connections
class ReasoningEngine {
    constructor() {
        this.rules = new Map();
        this.patterns = new Map();
        this.decisions = new Map();
        
        this.initializeRules();
    }
    
    initializeRules() {
        // Combat rules
        this.rules.set('combat_critical', {
            condition: (ctx) => ctx.damage > 100 && ctx.critical,
            conclusion: 'devastating_blow',
            importance: 0.9
        });
        
        // Economic rules
        this.rules.set('market_crash', {
            condition: (ctx) => ctx.priceChange < -50,
            conclusion: 'economic_crisis',
            importance: 0.8
        });
        
        // Quest rules
        this.rules.set('quest_complete', {
            condition: (ctx) => ctx.questStatus === 'complete',
            conclusion: 'achievement_unlocked',
            importance: 0.7
        });
    }
    
    async reason(context) {
        console.log('🤔 Reasoning engine processing...');
        
        // Identify patterns
        const pattern = this.identifyPattern(context);
        
        // Apply rules
        const conclusions = this.applyRules(context);
        
        // Make decisions
        const decision = this.makeDecision(context, conclusions);
        
        // Calculate importance
        const importance = this.calculateImportance(context, conclusions);
        
        // Determine mood
        const mood = this.determineMood(context, pattern);
        
        return {
            pattern,
            conclusions,
            decision,
            importance,
            mood,
            reasoning: this.explainReasoning(pattern, conclusions, decision)
        };
    }
    
    identifyPattern(context) {
        const contextStr = JSON.stringify(context).toLowerCase();
        
        if (contextStr.includes('combat') || contextStr.includes('attack')) {
            return 'combat';
        }
        if (contextStr.includes('trade') || contextStr.includes('gold')) {
            return 'economy';
        }
        if (contextStr.includes('quest') || contextStr.includes('mission')) {
            return 'quest';
        }
        if (contextStr.includes('discover') || contextStr.includes('found')) {
            return 'discovery';
        }
        
        return 'general';
    }
    
    applyRules(context) {
        const conclusions = [];
        
        for (const [ruleName, rule] of this.rules.entries()) {
            try {
                if (rule.condition(context)) {
                    conclusions.push({
                        rule: ruleName,
                        conclusion: rule.conclusion,
                        importance: rule.importance
                    });
                }
            } catch (error) {
                // Rule doesn't apply
            }
        }
        
        return conclusions;
    }
    
    makeDecision(context, conclusions) {
        if (conclusions.length === 0) {
            return { action: 'observe', reason: 'No significant patterns detected' };
        }
        
        // Sort by importance
        const topConclusion = conclusions.sort((a, b) => b.importance - a.importance)[0];
        
        const decisions = {
            devastating_blow: { action: 'alert_players', reason: 'Critical combat event' },
            economic_crisis: { action: 'adjust_prices', reason: 'Market instability detected' },
            achievement_unlocked: { action: 'reward_player', reason: 'Quest completion detected' }
        };
        
        return decisions[topConclusion.conclusion] || { action: 'monitor', reason: 'Interesting pattern observed' };
    }
    
    calculateImportance(context, conclusions) {
        if (conclusions.length === 0) return 0.1;
        
        const maxImportance = Math.max(...conclusions.map(c => c.importance));
        const contextBoost = context.related?.length > 3 ? 0.1 : 0;
        
        return Math.min(1, maxImportance + contextBoost);
    }
    
    determineMood(context, pattern) {
        const moods = {
            combat: 'high_stakes',
            economy: 'tension',
            quest: 'adventure',
            discovery: 'wonder',
            general: 'calm'
        };
        
        return moods[pattern] || 'neutral';
    }
    
    explainReasoning(pattern, conclusions, decision) {
        const explanation = [`Detected ${pattern} pattern.`];
        
        if (conclusions.length > 0) {
            explanation.push(`Found ${conclusions.length} significant patterns.`);
            explanation.push(`Primary conclusion: ${conclusions[0].conclusion}.`);
        }
        
        explanation.push(`Decision: ${decision.action} - ${decision.reason}.`);
        
        return explanation.join(' ');
    }
}

// Export the brain layer
module.exports = IntelligenceBrainLayer;

// Start if run directly
if (require.main === module) {
    const brain = new IntelligenceBrainLayer();
    
    // Setup intelligences after class definitions are available
    brain.setupIntelligences();
    
    // Example usage
    const testInput = {
        type: 'combat',
        attacker: 'Player_123',
        defender: 'Boss_Dragon',
        damage: 150,
        critical: true,
        ability: 'Flame Strike'
    };
    
    brain.process(testInput).then(result => {
        console.log('\n🧠 Brain Processing Result:');
        console.log(JSON.stringify(result, null, 2));
    });
}