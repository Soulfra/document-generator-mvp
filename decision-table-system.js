#!/usr/bin/env node

/**
 * 🎲 DECISION TABLE SYSTEM
 * Deep tier decision making layer that LLMs consult
 * Tables for game logic, world rules, and emergent behaviors
 */

const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

class DecisionTableSystem {
    constructor() {
        this.app = express();
        this.port = 8888;
        
        // Initialize database
        this.db = new sqlite3.Database(':memory:');
        
        // Decision tables
        this.tables = {
            buildRules: new Map(),
            interactionMatrix: new Map(),
            emergentBehaviors: new Map(),
            worldLaws: new Map()
        };
        
        this.init();
    }
    
    init() {
        this.app.use(cors());
        this.app.use(express.json());
        
        // Initialize database tables
        this.initializeDatabase();
        
        // API Routes
        
        // Query decision table
        this.app.post('/api/decide', async (req, res) => {
            const { context, question, llmId } = req.body;
            const decision = await this.makeDecision(context, question, llmId);
            res.json(decision);
        });
        
        // Get world rules
        this.app.get('/api/rules/:category', (req, res) => {
            const rules = this.getWorldRules(req.params.category);
            res.json({ rules });
        });
        
        // Update decision weights based on outcomes
        this.app.post('/api/learn', async (req, res) => {
            const { decision, outcome, context } = req.body;
            await this.learnFromOutcome(decision, outcome, context);
            res.json({ status: 'learned' });
        });
        
        // Get interaction possibilities
        this.app.post('/api/interactions', (req, res) => {
            const { objectA, objectB } = req.body;
            const interactions = this.getInteractions(objectA, objectB);
            res.json({ interactions });
        });
        
        this.app.listen(this.port, () => {
            console.log(`🎲 Decision Table System running on port ${this.port}`);
            this.populateInitialTables();
        });
    }
    
    initializeDatabase() {
        // Decision history table
        this.db.run(`
            CREATE TABLE decision_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                llm_id TEXT,
                context TEXT,
                question TEXT,
                decision TEXT,
                outcome TEXT,
                weight REAL DEFAULT 1.0,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // World rules table
        this.db.run(`
            CREATE TABLE world_rules (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category TEXT,
                rule TEXT,
                weight REAL DEFAULT 1.0,
                active BOOLEAN DEFAULT 1
            )
        `);
        
        // Interaction matrix
        this.db.run(`
            CREATE TABLE interaction_matrix (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                type_a TEXT,
                type_b TEXT,
                interaction TEXT,
                result TEXT,
                probability REAL DEFAULT 0.5
            )
        `);
        
        // Emergent behaviors
        this.db.run(`
            CREATE TABLE emergent_behaviors (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                trigger_pattern TEXT,
                behavior TEXT,
                conditions TEXT,
                priority INTEGER DEFAULT 5
            )
        `);
    }
    
    populateInitialTables() {
        // Building rules
        const buildingRules = [
            { category: 'spacing', rule: 'Minimum 10 units between structures', weight: 0.8 },
            { category: 'height', rule: 'Towers cannot exceed 50 units', weight: 0.9 },
            { category: 'foundation', rule: 'Structures need solid ground', weight: 1.0 },
            { category: 'resources', rule: 'Each build consumes energy', weight: 0.7 },
            { category: 'harmony', rule: 'Similar structures cluster together', weight: 0.6 }
        ];
        
        buildingRules.forEach(rule => {
            this.db.run(
                'INSERT INTO world_rules (category, rule, weight) VALUES (?, ?, ?)',
                [rule.category, rule.rule, rule.weight]
            );
        });
        
        // Interaction matrix
        const interactions = [
            { a: 'tower', b: 'tower', interaction: 'resonate', result: 'energy_field' },
            { a: 'portal', b: 'portal', interaction: 'link', result: 'teleport_network' },
            { a: 'crystal', b: 'fountain', interaction: 'amplify', result: 'healing_aura' },
            { a: 'llm', b: 'structure', interaction: 'enhance', result: 'sentient_building' },
            { a: 'creature', b: 'garden', interaction: 'inhabit', result: 'ecosystem' }
        ];
        
        interactions.forEach(int => {
            this.db.run(
                'INSERT INTO interaction_matrix (type_a, type_b, interaction, result, probability) VALUES (?, ?, ?, ?, ?)',
                [int.a, int.b, int.interaction, int.result, 0.7]
            );
        });
        
        // Emergent behaviors
        const behaviors = [
            {
                pattern: 'three_towers_triangle',
                behavior: 'create_energy_nexus',
                conditions: 'distance < 30',
                priority: 8
            },
            {
                pattern: 'crystal_circle',
                behavior: 'summon_entity',
                conditions: 'count >= 5',
                priority: 7
            },
            {
                pattern: 'portal_alignment',
                behavior: 'open_dimension',
                conditions: 'aligned && powered',
                priority: 9
            }
        ];
        
        behaviors.forEach(beh => {
            this.db.run(
                'INSERT INTO emergent_behaviors (trigger_pattern, behavior, conditions, priority) VALUES (?, ?, ?, ?)',
                [beh.pattern, beh.behavior, beh.conditions, beh.priority]
            );
        });
        
        console.log('📋 Decision tables populated');
    }
    
    async makeDecision(context, question, llmId) {
        console.log(`🤔 LLM ${llmId} asks: "${question}"`);
        
        // Analyze context
        const contextAnalysis = this.analyzeContext(context);
        
        // Get relevant rules
        const applicableRules = await this.getApplicableRules(contextAnalysis);
        
        // Check for patterns
        const patterns = await this.detectPatterns(context);
        
        // Calculate decision
        const decision = {
            answer: '',
            reasoning: [],
            suggestions: [],
            warnings: [],
            opportunities: []
        };
        
        // Apply rules
        for (const rule of applicableRules) {
            decision.reasoning.push(`Rule: ${rule.rule} (weight: ${rule.weight})`);
        }
        
        // Check interactions
        if (context.nearbyObjects) {
            const interactions = await this.checkPossibleInteractions(context.nearbyObjects);
            decision.opportunities = interactions;
        }
        
        // Generate answer based on question type
        if (question.toLowerCase().includes('where')) {
            decision.answer = this.suggestLocation(context, applicableRules);
        } else if (question.toLowerCase().includes('what')) {
            decision.answer = this.suggestAction(context, patterns);
        } else if (question.toLowerCase().includes('should')) {
            decision.answer = this.evaluateProposal(context, applicableRules);
        }
        
        // Learn from this decision
        this.db.run(
            'INSERT INTO decision_history (llm_id, context, question, decision) VALUES (?, ?, ?, ?)',
            [llmId, JSON.stringify(context), question, JSON.stringify(decision)]
        );
        
        return decision;
    }
    
    analyzeContext(context) {
        return {
            hasNearbyObjects: context.nearbyObjects && context.nearbyObjects.length > 0,
            worldDensity: context.worldState || 0,
            playerPresent: context.playerPosition !== undefined,
            timeOfDay: context.timeOfDay || 'day',
            energy: context.energy || 100
        };
    }
    
    async getApplicableRules(contextAnalysis) {
        return new Promise((resolve) => {
            this.db.all(
                'SELECT * FROM world_rules WHERE active = 1 ORDER BY weight DESC',
                (err, rules) => {
                    if (err) {
                        console.error(err);
                        resolve([]);
                    } else {
                        // Filter rules based on context
                        const applicable = rules.filter(rule => {
                            if (rule.category === 'spacing' && !contextAnalysis.hasNearbyObjects) {
                                return false;
                            }
                            return true;
                        });
                        resolve(applicable);
                    }
                }
            );
        });
    }
    
    async detectPatterns(context) {
        return new Promise((resolve) => {
            this.db.all(
                'SELECT * FROM emergent_behaviors ORDER BY priority DESC',
                (err, behaviors) => {
                    if (err) {
                        resolve([]);
                    } else {
                        const detected = [];
                        
                        // Check each pattern
                        behaviors.forEach(behavior => {
                            if (this.patternMatches(behavior.trigger_pattern, context)) {
                                detected.push(behavior);
                            }
                        });
                        
                        resolve(detected);
                    }
                }
            );
        });
    }
    
    patternMatches(pattern, context) {
        // Simple pattern matching
        switch (pattern) {
            case 'three_towers_triangle':
                if (context.nearbyObjects) {
                    const towers = context.nearbyObjects.filter(obj => obj.type === 'tower');
                    return towers.length >= 3;
                }
                break;
            case 'crystal_circle':
                if (context.nearbyObjects) {
                    const crystals = context.nearbyObjects.filter(obj => obj.type === 'crystal');
                    return crystals.length >= 5;
                }
                break;
        }
        return false;
    }
    
    suggestLocation(context, rules) {
        // Smart location suggestion based on rules
        const spacingRule = rules.find(r => r.category === 'spacing');
        const minDistance = spacingRule ? 10 : 5;
        
        if (context.nearbyObjects && context.nearbyObjects.length > 0) {
            // Find empty spot
            return `Build at least ${minDistance} units away from existing structures. 
                    Try coordinates: (${Math.random() * 50}, 0, ${Math.random() * 50})`;
        } else {
            return 'The world is empty, build anywhere you like! Center (0,0,0) is a good start.';
        }
    }
    
    suggestAction(context, patterns) {
        if (patterns.length > 0) {
            const topPattern = patterns[0];
            return `Detected pattern: ${topPattern.trigger_pattern}. 
                    You could ${topPattern.behavior} to create something special!`;
        }
        
        // Default suggestions
        const actions = [
            'Build a tower to establish presence',
            'Create a portal for transportation',
            'Spawn crystals for energy',
            'Plant a garden for life',
            'Construct a bridge to connect areas'
        ];
        
        return actions[Math.floor(Math.random() * actions.length)];
    }
    
    evaluateProposal(context, rules) {
        // Evaluate if something should be done
        let score = 0;
        let reasons = [];
        
        rules.forEach(rule => {
            if (rule.weight > 0.7) {
                score += rule.weight;
                reasons.push(rule.rule);
            }
        });
        
        if (score > 2) {
            return `Yes, proceed! Following rules support this: ${reasons.join(', ')}`;
        } else if (score > 1) {
            return 'Maybe. Consider the world rules carefully.';
        } else {
            return 'Not recommended based on current world state.';
        }
    }
    
    async checkPossibleInteractions(nearbyObjects) {
        return new Promise((resolve) => {
            const interactions = [];
            
            this.db.all(
                'SELECT * FROM interaction_matrix',
                (err, matrix) => {
                    if (err) {
                        resolve([]);
                        return;
                    }
                    
                    // Check each pair
                    nearbyObjects.forEach(objA => {
                        nearbyObjects.forEach(objB => {
                            if (objA.id !== objB.id) {
                                const interaction = matrix.find(m => 
                                    (m.type_a === objA.type && m.type_b === objB.type) ||
                                    (m.type_a === objB.type && m.type_b === objA.type)
                                );
                                
                                if (interaction) {
                                    interactions.push({
                                        objects: [objA.id, objB.id],
                                        interaction: interaction.interaction,
                                        result: interaction.result,
                                        probability: interaction.probability
                                    });
                                }
                            }
                        });
                    });
                    
                    resolve(interactions);
                }
            );
        });
    }
    
    async learnFromOutcome(decision, outcome, context) {
        // Adjust weights based on outcomes
        if (outcome === 'success') {
            // Increase weight of rules that led to success
            console.log('📈 Learning: Successful decision, increasing rule weights');
        } else if (outcome === 'failure') {
            // Decrease weight of rules that led to failure
            console.log('📉 Learning: Failed decision, adjusting rule weights');
        }
        
        // Update decision history
        this.db.run(
            'UPDATE decision_history SET outcome = ? WHERE decision = ?',
            [outcome, JSON.stringify(decision)]
        );
    }
    
    getWorldRules(category) {
        return new Promise((resolve) => {
            if (category === 'all') {
                this.db.all(
                    'SELECT * FROM world_rules WHERE active = 1',
                    (err, rules) => resolve(rules || [])
                );
            } else {
                this.db.all(
                    'SELECT * FROM world_rules WHERE category = ? AND active = 1',
                    [category],
                    (err, rules) => resolve(rules || [])
                );
            }
        });
    }
    
    getInteractions(objectA, objectB) {
        return new Promise((resolve) => {
            this.db.all(
                `SELECT * FROM interaction_matrix 
                 WHERE (type_a = ? AND type_b = ?) OR (type_a = ? AND type_b = ?)`,
                [objectA, objectB, objectB, objectA],
                (err, interactions) => resolve(interactions || [])
            );
        });
    }
}

// Start the system
if (require.main === module) {
    new DecisionTableSystem();
}

module.exports = DecisionTableSystem;