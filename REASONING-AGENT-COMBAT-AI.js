/**
 * Reasoning Agent Combat AI System
 * Advanced AI decision-making for autonomous combat and strategic planning
 * Integrates with voxel combat world and document monster encounters
 */

class ReasoningAgentCombatAI {
    constructor() {
        this.agents = new Map();
        this.combatSessions = new Map();
        this.tacticalDatabase = new Map();
        this.learningModel = new CombatLearningModel();
        this.strategyEngine = new StrategicPlanningEngine();
        this.lineageStrategies = new Map();
        
        // Combat reasoning parameters
        this.reasoningDepth = 3; // How many moves ahead to think
        this.adaptationRate = 0.1; // How quickly to adapt strategies
        this.riskTolerance = 0.7; // How much risk to accept
        this.cooperationWeight = 0.3; // How much to value teamwork
        
        this.init();
    }
    
    init() {
        this.initializeLineageStrategies();
        this.setupCombatReasoning();
        this.startDecisionLoop();
        
        console.log('🧠 Reasoning Agent Combat AI initialized');
        console.log('⚔️ Advanced tactical decision-making online');
    }
    
    initializeLineageStrategies() {
        // Warrior lineage - direct combat strategies
        this.lineageStrategies.set('warrior', {
            primary_approach: 'aggressive_assault',
            secondary_approach: 'defensive_formation',
            decision_weight: {
                damage_potential: 0.4,
                survivability: 0.3,
                team_support: 0.2,
                positioning: 0.1
            },
            combat_patterns: [
                'frontal_assault',
                'defensive_line',
                'charge_attack',
                'shield_wall',
                'berserker_rage'
            ],
            risk_profile: 'high',
            cooperation_style: 'tank_and_protect',
            learning_focus: 'damage_optimization'
        });
        
        // Scholar lineage - analytical combat strategies  
        this.lineageStrategies.set('scholar', {
            primary_approach: 'analytical_precision',
            secondary_approach: 'weakness_exploitation',
            decision_weight: {
                knowledge_advantage: 0.4,
                pattern_recognition: 0.3,
                tactical_analysis: 0.2,
                resource_efficiency: 0.1
            },
            combat_patterns: [
                'weakness_analysis',
                'pattern_prediction',
                'efficient_targeting',
                'support_coordination',
                'knowledge_application'
            ],
            risk_profile: 'calculated',
            cooperation_style: 'tactical_support',
            learning_focus: 'pattern_mastery'
        });
        
        // Rogue lineage - stealth and cunning strategies
        this.lineageStrategies.set('rogue', {
            primary_approach: 'stealth_strike',
            secondary_approach: 'evasion_tactics',
            decision_weight: {
                stealth_advantage: 0.3,
                positioning: 0.3,
                opportunity: 0.2,
                escape_routes: 0.2
            },
            combat_patterns: [
                'backstab_attack',
                'hit_and_run',
                'stealth_positioning',
                'distraction_tactics',
                'ambush_setup'
            ],
            risk_profile: 'adaptive',
            cooperation_style: 'flanking_support',
            learning_focus: 'timing_mastery'
        });
        
        // Mage lineage - magical combat strategies
        this.lineageStrategies.set('mage', {
            primary_approach: 'elemental_mastery',
            secondary_approach: 'area_control',
            decision_weight: {
                spell_efficiency: 0.3,
                area_control: 0.3,
                mana_management: 0.2,
                magical_advantage: 0.2
            },
            combat_patterns: [
                'elemental_blast',
                'area_denial',
                'magical_shield',
                'crowd_control',
                'mystical_enhancement'
            ],
            risk_profile: 'strategic',
            cooperation_style: 'battlefield_control',
            learning_focus: 'spell_optimization'
        });
        
        console.log('🎯 Lineage strategies initialized for 4 combat archetypes');
    }
    
    registerAgent(agent) {
        const combatAgent = {
            ...agent,
            combatAI: {
                experience: 0,
                victories: 0,
                defeats: 0,
                learned_patterns: new Map(),
                current_strategy: null,
                decision_history: [],
                performance_metrics: this.initializePerformanceMetrics(),
                reasoning_state: 'idle'
            }
        };
        
        this.agents.set(agent.id, combatAgent);
        this.initializeAgentStrategy(combatAgent);
        
        console.log(`🤖 Registered agent ${agent.name} for combat AI`);
        return combatAgent;
    }
    
    initializePerformanceMetrics() {
        return {
            damage_dealt: 0,
            damage_taken: 0,
            accuracy: 1.0,
            reaction_time: 1.0,
            strategic_score: 0.5,
            cooperation_rating: 0.5,
            adaptation_speed: 0.5,
            survival_rate: 1.0
        };
    }
    
    initializeAgentStrategy(agent) {
        const lineageStrategy = this.lineageStrategies.get(agent.lineage);
        if (!lineageStrategy) return;
        
        agent.combatAI.current_strategy = {
            name: lineageStrategy.primary_approach,
            lineage: agent.lineage,
            parameters: { ...lineageStrategy.decision_weight },
            confidence: 0.7,
            last_update: Date.now()
        };
        
        console.log(`⚡ ${agent.name} initialized with ${lineageStrategy.primary_approach} strategy`);
    }
    
    setupCombatReasoning() {
        // Initialize tactical database with known patterns
        this.tacticalDatabase.set('monster_legal_contract', {
            weaknesses: ['negotiation', 'loopholes', 'termination_clauses'],
            strengths: ['binding_power', 'complexity', 'legal_precedent'],
            recommended_approach: 'analytical_deconstruction',
            effective_lineages: ['scholar', 'rogue'],
            pattern_counters: ['clause_by_clause', 'find_contradictions']
        });
        
        this.tacticalDatabase.set('monster_technical_api', {
            weaknesses: ['deprecated_methods', 'authentication', 'rate_limits'],
            strengths: ['system_integration', 'data_flow', 'scalability'],
            recommended_approach: 'systematic_debugging',
            effective_lineages: ['scholar', 'mage'],
            pattern_counters: ['endpoint_testing', 'security_audit']
        });
        
        this.tacticalDatabase.set('monster_business_revenue', {
            weaknesses: ['market_analysis', 'cost_structure', 'competition'],
            strengths: ['financial_power', 'growth_potential', 'market_presence'],
            recommended_approach: 'competitive_analysis',
            effective_lineages: ['warrior', 'scholar'],
            pattern_counters: ['market_disruption', 'value_proposition']
        });
        
        console.log('📚 Tactical database populated with monster knowledge');
    }
    
    startDecisionLoop() {
        // Main reasoning loop - makes decisions every 500ms
        setInterval(() => {
            this.processCombatDecisions();
        }, 500);
        
        // Learning loop - updates strategies every 5 seconds
        setInterval(() => {
            this.updateStrategies();
        }, 5000);
        
        // Cooperation analysis - every 3 seconds
        setInterval(() => {
            this.analyzeCooperationOpportunities();
        }, 3000);
        
        console.log('🔄 Combat decision loops started');
    }
    
    processCombatDecisions() {
        this.agents.forEach(agent => {
            if (agent.combatAI.reasoning_state === 'combat') {
                const decision = this.makeReasonedDecision(agent);
                if (decision) {
                    this.executeDecision(agent, decision);
                }
            }
        });
    }
    
    makeReasonedDecision(agent) {
        // Multi-layered reasoning process
        const context = this.analyzeCombatContext(agent);
        const options = this.generateCombatOptions(agent, context);
        const evaluated = this.evaluateOptions(agent, options, context);
        const selected = this.selectBestOption(agent, evaluated);
        
        // Record decision for learning
        agent.combatAI.decision_history.push({
            context: context,
            options: options,
            selected: selected,
            timestamp: Date.now(),
            reasoning: this.explainDecision(agent, selected, context)
        });
        
        // Limit decision history
        if (agent.combatAI.decision_history.length > 50) {
            agent.combatAI.decision_history = agent.combatAI.decision_history.slice(-25);
        }
        
        return selected;
    }
    
    analyzeCombatContext(agent) {
        return {
            agent_health: agent.health / agent.maxHealth,
            nearby_enemies: this.findNearbyEnemies(agent),
            nearby_allies: this.findNearbyAllies(agent),
            terrain_advantages: this.analyzeTerrainAdvantages(agent),
            resource_status: this.analyzeResourceStatus(agent),
            threat_level: this.calculateThreatLevel(agent),
            opportunities: this.identifyOpportunities(agent),
            strategic_position: this.evaluateStrategicPosition(agent)
        };
    }
    
    generateCombatOptions(agent, context) {
        const lineageStrategy = this.lineageStrategies.get(agent.lineage);
        const options = [];
        
        // Generate lineage-specific options
        lineageStrategy.combat_patterns.forEach(pattern => {
            const option = this.createCombatOption(agent, pattern, context);
            if (option.feasible) {
                options.push(option);
            }
        });
        
        // Generate cooperative options if allies nearby
        if (context.nearby_allies.length > 0) {
            const cooperativeOptions = this.generateCooperativeOptions(agent, context);
            options.push(...cooperativeOptions);
        }
        
        // Generate emergency options if in danger
        if (context.threat_level > 0.8) {
            const emergencyOptions = this.generateEmergencyOptions(agent, context);
            options.push(...emergencyOptions);
        }
        
        return options;
    }
    
    createCombatOption(agent, pattern, context) {
        const lineageStrategy = this.lineageStrategies.get(agent.lineage);
        
        const option = {
            type: pattern,
            lineage: agent.lineage,
            feasible: true,
            estimated_damage: 0,
            estimated_risk: 0,
            resource_cost: 0,
            positioning_requirement: null,
            cooperation_benefit: 0,
            strategic_value: 0
        };
        
        // Calculate option parameters based on pattern and context
        switch (pattern) {
            case 'frontal_assault':
                option.estimated_damage = 80 * agent.combatAI.performance_metrics.accuracy;
                option.estimated_risk = 0.7;
                option.resource_cost = 0.3;
                break;
                
            case 'weakness_analysis':
                option.estimated_damage = 60;
                option.estimated_risk = 0.2;
                option.resource_cost = 0.1;
                option.strategic_value = 0.8;
                break;
                
            case 'backstab_attack':
                option.estimated_damage = 120;
                option.estimated_risk = 0.4;
                option.resource_cost = 0.2;
                option.positioning_requirement = 'behind_enemy';
                break;
                
            case 'elemental_blast':
                option.estimated_damage = 100;
                option.estimated_risk = 0.3;
                option.resource_cost = 0.4;
                option.cooperation_benefit = 0.6; // Area effect
                break;
        }
        
        // Adjust based on context
        option.estimated_damage *= (1 + context.terrain_advantages * 0.3);
        option.estimated_risk *= (1 - context.strategic_position * 0.2);
        
        // Check feasibility
        if (option.resource_cost > context.resource_status) {
            option.feasible = false;
        }
        
        return option;
    }
    
    evaluateOptions(agent, options, context) {
        const lineageStrategy = this.lineageStrategies.get(agent.lineage);
        
        return options.map(option => {
            const score = this.calculateOptionScore(agent, option, context, lineageStrategy);
            return {
                ...option,
                score: score,
                confidence: this.calculateConfidence(agent, option, context),
                reasoning: this.generateOptionReasoning(agent, option, context)
            };
        }).sort((a, b) => b.score - a.score);
    }
    
    calculateOptionScore(agent, option, context, lineageStrategy) {
        let score = 0;
        
        // Damage potential weighted by lineage preference
        score += option.estimated_damage * (lineageStrategy.decision_weight.damage_potential || 0.3);
        
        // Risk assessment (lower risk = higher score for most lineages)
        const riskModifier = lineageStrategy.risk_profile === 'high' ? 0.5 : 1.0;
        score += (1 - option.estimated_risk) * 50 * riskModifier;
        
        // Strategic value
        score += option.strategic_value * 40 * (lineageStrategy.decision_weight.tactical_analysis || 0.2);
        
        // Cooperation benefit
        score += option.cooperation_benefit * 30 * this.cooperationWeight;
        
        // Context modifiers
        if (context.agent_health < 0.3) {
            // Low health - prioritize safety
            score += (1 - option.estimated_risk) * 100;
        }
        
        if (context.threat_level > 0.8) {
            // High threat - prioritize damage or escape
            score += option.estimated_damage * 0.5;
        }
        
        // Experience bonus - better at familiar patterns
        const experienceMultiplier = agent.combatAI.learned_patterns.get(option.type) || 1.0;
        score *= experienceMultiplier;
        
        return score;
    }
    
    calculateConfidence(agent, option, context) {
        let confidence = 0.5; // Base confidence
        
        // Experience with this option type
        const experience = agent.combatAI.learned_patterns.get(option.type) || 0;
        confidence += Math.min(0.4, experience * 0.1);
        
        // Context clarity
        if (context.nearby_enemies.length <= 2) {
            confidence += 0.2; // Clear tactical situation
        }
        
        // Agent performance history
        confidence += agent.combatAI.performance_metrics.strategic_score * 0.3;
        
        return Math.min(1.0, confidence);
    }
    
    selectBestOption(agent, evaluatedOptions) {
        if (evaluatedOptions.length === 0) return null;
        
        // Most of the time, choose the best option
        if (Math.random() < 0.8) {
            return evaluatedOptions[0];
        }
        
        // Sometimes explore sub-optimal options for learning
        const explorationIndex = Math.min(
            evaluatedOptions.length - 1,
            Math.floor(Math.random() * 3)
        );
        
        return evaluatedOptions[explorationIndex];
    }
    
    executeDecision(agent, decision) {
        console.log(`⚔️ ${agent.name} executing: ${decision.type} (confidence: ${(decision.confidence * 100).toFixed(0)}%)`);
        
        // Update agent's reasoning state
        agent.combatAI.reasoning_state = 'executing';
        
        // Record execution for learning
        this.recordDecisionExecution(agent, decision);
        
        // Execute the actual combat action
        this.performCombatAction(agent, decision);
        
        // Update experience
        this.updateAgentExperience(agent, decision);
        
        setTimeout(() => {
            agent.combatAI.reasoning_state = 'combat';
        }, 1000); // Brief execution cooldown
    }
    
    performCombatAction(agent, decision) {
        // Interface with combat systems
        const combatData = {
            agent: agent,
            action_type: decision.type,
            target: decision.target,
            estimated_damage: decision.estimated_damage,
            estimated_risk: decision.estimated_risk,
            lineage: agent.lineage
        };
        
        // Send to voxel combat world
        if (window.voxelCombat) {
            window.voxelCombat.executeAgentAction(combatData);
        }
        
        // Send to monster generator for pattern learning
        if (window.documentMonsterGenerator) {
            window.documentMonsterGenerator.recordAgentAction(combatData);
        }
        
        // Create visual effect
        this.createCombatEffect(agent, decision);
    }
    
    createCombatEffect(agent, decision) {
        const effects = {
            frontal_assault: { color: '#FF4444', type: 'explosion' },
            weakness_analysis: { color: '#4444FF', type: 'scan' },
            backstab_attack: { color: '#44FF44', type: 'stealth_strike' },
            elemental_blast: { color: '#FF44FF', type: 'magical_burst' }
        };
        
        const effect = effects[decision.type] || { color: '#FFFFFF', type: 'basic' };
        
        // Create particle effect at agent position
        if (window.voxelCombat && window.voxelCombat.createParticleEffect) {
            window.voxelCombat.createParticleEffect({
                type: effect.type,
                position: agent.position,
                color: effect.color,
                duration: 1500,
                intensity: decision.estimated_damage / 20
            });
        }
    }
    
    updateAgentExperience(agent, decision) {
        // Increase experience with this decision type
        const currentExp = agent.combatAI.learned_patterns.get(decision.type) || 0;
        agent.combatAI.learned_patterns.set(decision.type, currentExp + 0.1);
        
        // Update overall experience
        agent.combatAI.experience += 1;
        
        // Update performance metrics based on decision outcome
        this.updatePerformanceMetrics(agent, decision);
    }
    
    updatePerformanceMetrics(agent, decision) {
        const metrics = agent.combatAI.performance_metrics;
        
        // Simulate decision outcome and update metrics
        const success = Math.random() < decision.confidence;
        
        if (success) {
            metrics.strategic_score = Math.min(1.0, metrics.strategic_score + 0.02);
            metrics.accuracy = Math.min(1.0, metrics.accuracy + 0.01);
        } else {
            metrics.strategic_score = Math.max(0.0, metrics.strategic_score - 0.01);
        }
        
        // Update adaptation speed based on learning
        const learningRate = agent.combatAI.learned_patterns.size / 10;
        metrics.adaptation_speed = Math.min(1.0, learningRate);
    }
    
    recordDecisionExecution(agent, decision) {
        // Record for the learning model
        this.learningModel.recordDecision(agent, decision);
        
        // Record for strategic planning
        this.strategyEngine.recordExecution(agent, decision);
    }
    
    updateStrategies() {
        this.agents.forEach(agent => {
            if (agent.combatAI.experience > 10) {
                this.adaptAgentStrategy(agent);
            }
        });
    }
    
    adaptAgentStrategy(agent) {
        const currentStrategy = agent.combatAI.current_strategy;
        const performanceData = this.analyzeAgentPerformance(agent);
        
        if (performanceData.adaptation_needed) {
            const newStrategy = this.evolveStrategy(agent, currentStrategy, performanceData);
            
            if (newStrategy.confidence > currentStrategy.confidence + 0.1) {
                agent.combatAI.current_strategy = newStrategy;
                console.log(`🧠 ${agent.name} adapted strategy: ${newStrategy.name}`);
            }
        }
    }
    
    analyzeAgentPerformance(agent) {
        const recentDecisions = agent.combatAI.decision_history.slice(-10);
        const metrics = agent.combatAI.performance_metrics;
        
        return {
            adaptation_needed: metrics.strategic_score < 0.6,
            successful_patterns: this.identifySuccessfulPatterns(recentDecisions),
            failed_patterns: this.identifyFailedPatterns(recentDecisions),
            cooperation_effectiveness: metrics.cooperation_rating,
            overall_effectiveness: metrics.strategic_score
        };
    }
    
    evolveStrategy(agent, currentStrategy, performanceData) {
        const lineageStrategy = this.lineageStrategies.get(agent.lineage);
        
        // Create evolved strategy
        const evolvedStrategy = {
            name: this.generateStrategyName(agent, performanceData),
            lineage: agent.lineage,
            parameters: { ...currentStrategy.parameters },
            confidence: currentStrategy.confidence,
            last_update: Date.now(),
            evolution_reason: this.explainEvolution(performanceData)
        };
        
        // Adjust parameters based on performance
        if (performanceData.cooperation_effectiveness > 0.7) {
            evolvedStrategy.parameters.team_support = Math.min(1.0, 
                evolvedStrategy.parameters.team_support * 1.2);
        }
        
        if (performanceData.overall_effectiveness < 0.5) {
            // Try more aggressive approach
            evolvedStrategy.parameters.damage_potential = Math.min(1.0,
                evolvedStrategy.parameters.damage_potential * 1.3);
        }
        
        evolvedStrategy.confidence = Math.min(1.0, currentStrategy.confidence + 0.1);
        
        return evolvedStrategy;
    }
    
    generateCooperativeOptions(agent, context) {
        const options = [];
        
        context.nearby_allies.forEach(ally => {
            const lineageCombo = `${agent.lineage}_${ally.lineage}`;
            
            const combos = {
                warrior_scholar: {
                    type: 'tactical_assault',
                    description: 'Warrior charges while Scholar analyzes weaknesses',
                    estimated_damage: 150,
                    cooperation_benefit: 0.8
                },
                rogue_mage: {
                    type: 'stealth_enchantment',
                    description: 'Mage enhances Rogue for devastating sneak attack',
                    estimated_damage: 180,
                    cooperation_benefit: 0.9
                },
                warrior_mage: {
                    type: 'spell_sword',
                    description: 'Warrior charges with magical enhancement',
                    estimated_damage: 160,
                    cooperation_benefit: 0.7
                }
            };
            
            const combo = combos[lineageCombo] || combos[`${ally.lineage}_${agent.lineage}`];
            if (combo) {
                options.push({
                    ...combo,
                    feasible: true,
                    estimated_risk: 0.3,
                    resource_cost: 0.4,
                    ally_required: ally,
                    strategic_value: 0.8
                });
            }
        });
        
        return options;
    }
    
    generateEmergencyOptions(agent, context) {
        const options = [];
        
        // Emergency retreat
        options.push({
            type: 'tactical_retreat',
            estimated_damage: 0,
            estimated_risk: 0.1,
            resource_cost: 0.1,
            strategic_value: 0.6,
            feasible: true
        });
        
        // Desperate attack
        options.push({
            type: 'desperate_strike',
            estimated_damage: 200,
            estimated_risk: 0.9,
            resource_cost: 0.8,
            strategic_value: 0.3,
            feasible: true
        });
        
        // Call for help
        if (context.nearby_allies.length > 0) {
            options.push({
                type: 'distress_signal',
                estimated_damage: 0,
                estimated_risk: 0.2,
                resource_cost: 0.1,
                cooperation_benefit: 1.0,
                strategic_value: 0.7,
                feasible: true
            });
        }
        
        return options;
    }
    
    analyzeCooperationOpportunities() {
        const agents = Array.from(this.agents.values());
        
        for (let i = 0; i < agents.length; i++) {
            for (let j = i + 1; j < agents.length; j++) {
                const agent1 = agents[i];
                const agent2 = agents[j];
                
                if (this.areAgentsNearby(agent1, agent2)) {
                    const cooperation = this.analyzeCooperationPotential(agent1, agent2);
                    
                    if (cooperation.potential > 0.7) {
                        this.suggestCooperation(agent1, agent2, cooperation);
                    }
                }
            }
        }
    }
    
    explainDecision(agent, decision, context) {
        const lineageStrategy = this.lineageStrategies.get(agent.lineage);
        
        let reasoning = `${agent.name} (${agent.lineage}) chose ${decision.type} because: `;
        
        if (decision.estimated_damage > 80) {
            reasoning += 'high damage potential, ';
        }
        
        if (decision.estimated_risk < 0.3) {
            reasoning += 'low risk, ';
        }
        
        if (decision.cooperation_benefit > 0.5) {
            reasoning += 'good team synergy, ';
        }
        
        if (context.threat_level > 0.8) {
            reasoning += 'high threat situation, ';
        }
        
        reasoning += `aligns with ${lineageStrategy.primary_approach} strategy.`;
        
        return reasoning;
    }
    
    // Utility methods
    findNearbyEnemies(agent) {
        // Placeholder - would integrate with monster system
        return [];
    }
    
    findNearbyAllies(agent) {
        // Placeholder - would find other agents nearby
        return Array.from(this.agents.values()).filter(other => 
            other.id !== agent.id && this.areAgentsNearby(agent, other)
        );
    }
    
    areAgentsNearby(agent1, agent2, threshold = 100) {
        if (!agent1.position || !agent2.position) return false;
        
        const dx = agent1.position.x - agent2.position.x;
        const dy = agent1.position.y - agent2.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance <= threshold;
    }
    
    analyzeTerrainAdvantages(agent) {
        // Placeholder - would analyze terrain for tactical advantages
        return Math.random() * 0.3; // 0-30% terrain advantage
    }
    
    analyzeResourceStatus(agent) {
        // Placeholder - would check mana, stamina, etc.
        return 0.8; // 80% resources available
    }
    
    calculateThreatLevel(agent) {
        // Placeholder - would calculate threat from nearby enemies
        return Math.random() * 0.6; // 0-60% threat level
    }
    
    identifyOpportunities(agent) {
        // Placeholder - would identify tactical opportunities
        return [];
    }
    
    evaluateStrategicPosition(agent) {
        // Placeholder - would evaluate position strength
        return Math.random() * 0.5 + 0.25; // 25-75% position strength
    }
    
    identifySuccessfulPatterns(decisions) {
        return decisions.filter(d => d.successful).map(d => d.selected.type);
    }
    
    identifyFailedPatterns(decisions) {
        return decisions.filter(d => !d.successful).map(d => d.selected.type);
    }
    
    generateStrategyName(agent, performanceData) {
        const baseName = agent.combatAI.current_strategy.name;
        const adaptations = [];
        
        if (performanceData.cooperation_effectiveness > 0.7) {
            adaptations.push('cooperative');
        }
        
        if (performanceData.overall_effectiveness < 0.5) {
            adaptations.push('aggressive');
        }
        
        return adaptations.length > 0 ? 
            `${adaptations.join('_')}_${baseName}` : 
            `evolved_${baseName}`;
    }
    
    explainEvolution(performanceData) {
        const reasons = [];
        
        if (performanceData.cooperation_effectiveness > 0.7) {
            reasons.push('enhanced cooperation');
        }
        
        if (performanceData.overall_effectiveness < 0.5) {
            reasons.push('improved aggression');
        }
        
        if (performanceData.failed_patterns.length > 3) {
            reasons.push('pattern diversification');
        }
        
        return reasons.join(', ') || 'general optimization';
    }
    
    analyzeCooperationPotential(agent1, agent2) {
        const lineageCombo = `${agent1.lineage}_${agent2.lineage}`;
        const synergies = {
            warrior_scholar: 0.8,
            warrior_mage: 0.7,
            scholar_mage: 0.9,
            rogue_mage: 0.8,
            rogue_scholar: 0.6,
            warrior_rogue: 0.5
        };
        
        const basePotential = synergies[lineageCombo] || 
                             synergies[`${agent2.lineage}_${agent1.lineage}`] || 
                             0.3;
        
        return {
            potential: basePotential,
            type: lineageCombo,
            recommended_actions: ['coordinate_attack', 'defensive_formation']
        };
    }
    
    suggestCooperation(agent1, agent2, cooperation) {
        console.log(`🤝 Cooperation opportunity: ${agent1.name} + ${agent2.name} (${(cooperation.potential * 100).toFixed(0)}% synergy)`);
        
        // Mark agents for cooperation consideration
        agent1.combatAI.cooperation_suggestion = {
            partner: agent2,
            potential: cooperation.potential,
            timestamp: Date.now()
        };
        
        agent2.combatAI.cooperation_suggestion = {
            partner: agent1,
            potential: cooperation.potential,
            timestamp: Date.now()
        };
    }
    
    // Public interface methods
    enterCombat(agentId, enemies) {
        const agent = this.agents.get(agentId);
        if (!agent) return;
        
        agent.combatAI.reasoning_state = 'combat';
        console.log(`⚔️ ${agent.name} entering combat with reasoning AI`);
    }
    
    exitCombat(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent) return;
        
        agent.combatAI.reasoning_state = 'idle';
        console.log(`✅ ${agent.name} exiting combat, reasoning complete`);
    }
    
    getAgentStats(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent) return null;
        
        return {
            experience: agent.combatAI.experience,
            strategy: agent.combatAI.current_strategy.name,
            performance: agent.combatAI.performance_metrics,
            learned_patterns: agent.combatAI.learned_patterns.size,
            decision_history_size: agent.combatAI.decision_history.length
        };
    }
    
    getAllAgentStats() {
        const stats = {};
        this.agents.forEach((agent, id) => {
            stats[id] = this.getAgentStats(id);
        });
        return stats;
    }
}

// Combat Learning Model for pattern recognition
class CombatLearningModel {
    constructor() {
        this.patterns = new Map();
        this.outcomes = new Map();
        this.learning_rate = 0.1;
    }
    
    recordDecision(agent, decision) {
        const patternKey = `${agent.lineage}_${decision.type}`;
        
        if (!this.patterns.has(patternKey)) {
            this.patterns.set(patternKey, {
                successes: 0,
                failures: 0,
                total_attempts: 0,
                average_damage: 0,
                contexts: []
            });
        }
        
        const pattern = this.patterns.get(patternKey);
        pattern.total_attempts++;
        
        // Record context for pattern matching
        pattern.contexts.push({
            health_ratio: agent.health / agent.maxHealth,
            threat_level: decision.context?.threat_level || 0.5,
            timestamp: Date.now()
        });
        
        // Keep only recent contexts
        if (pattern.contexts.length > 20) {
            pattern.contexts = pattern.contexts.slice(-10);
        }
    }
    
    updatePattern(agent, decision, outcome) {
        const patternKey = `${agent.lineage}_${decision.type}`;
        const pattern = this.patterns.get(patternKey);
        
        if (!pattern) return;
        
        if (outcome.success) {
            pattern.successes++;
        } else {
            pattern.failures++;
        }
        
        // Update average damage
        const newDamage = outcome.actual_damage || 0;
        pattern.average_damage = (pattern.average_damage * (pattern.total_attempts - 1) + newDamage) / pattern.total_attempts;
    }
    
    getPatternEffectiveness(lineage, decisionType) {
        const patternKey = `${lineage}_${decisionType}`;
        const pattern = this.patterns.get(patternKey);
        
        if (!pattern || pattern.total_attempts === 0) {
            return 0.5; // Default effectiveness
        }
        
        return pattern.successes / pattern.total_attempts;
    }
}

// Strategic Planning Engine for long-term decisions
class StrategicPlanningEngine {
    constructor() {
        this.strategic_goals = new Map();
        this.long_term_plans = new Map();
        this.execution_history = [];
    }
    
    recordExecution(agent, decision) {
        this.execution_history.push({
            agent_id: agent.id,
            lineage: agent.lineage,
            decision: decision.type,
            timestamp: Date.now(),
            context: decision.context
        });
        
        // Keep only recent history
        if (this.execution_history.length > 200) {
            this.execution_history = this.execution_history.slice(-100);
        }
    }
    
    analyzeStrategicTrends() {
        const recentHistory = this.execution_history.slice(-50);
        
        const trends = {
            most_used_strategies: this.getMostUsedStrategies(recentHistory),
            lineage_preferences: this.getLineagePreferences(recentHistory),
            time_patterns: this.getTimePatterns(recentHistory),
            success_correlations: this.getSuccessCorrelations(recentHistory)
        };
        
        return trends;
    }
    
    getMostUsedStrategies(history) {
        const strategyCount = {};
        
        history.forEach(entry => {
            strategyCount[entry.decision] = (strategyCount[entry.decision] || 0) + 1;
        });
        
        return Object.entries(strategyCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([strategy, count]) => ({ strategy, count }));
    }
    
    getLineagePreferences(history) {
        const lineageStrategies = {};
        
        history.forEach(entry => {
            if (!lineageStrategies[entry.lineage]) {
                lineageStrategies[entry.lineage] = {};
            }
            
            const strategies = lineageStrategies[entry.lineage];
            strategies[entry.decision] = (strategies[entry.decision] || 0) + 1;
        });
        
        return lineageStrategies;
    }
    
    getTimePatterns(history) {
        // Analyze if certain strategies are used more at certain times
        return {
            note: 'Time pattern analysis would be implemented here'
        };
    }
    
    getSuccessCorrelations(history) {
        // Analyze which strategies tend to succeed together
        return {
            note: 'Success correlation analysis would be implemented here'
        };
    }
}

// Export for use in main system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        ReasoningAgentCombatAI, 
        CombatLearningModel, 
        StrategicPlanningEngine 
    };
}

// Global instance for integration
window.reasoningCombatAI = new ReasoningAgentCombatAI();

console.log('🧠 Reasoning Agent Combat AI loaded');
console.log('⚔️ Advanced tactical decision-making ready');
console.log('🎯 Multi-lineage strategy optimization active');