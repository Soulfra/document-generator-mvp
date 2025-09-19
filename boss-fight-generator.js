/**
 * ⚔️ Boss Fight Generator
 * Creates epic end-of-chapter boss battles that test mastery of learned concepts
 * Supports multi-phase battles with adaptive difficulty and rich narrative
 */

const crypto = require('crypto');
const { EventEmitter } = require('events');

class BossFightGenerator extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            difficultyScaling: options.difficultyScaling || 'adaptive',
            narrativeStyle: options.narrativeStyle || 'epic',
            phaseCount: options.phaseCount || 'auto', // auto, 2, 3, 4, 5
            mechanicsIntegration: options.mechanicsIntegration || 'all_chapter_skills',
            rewardSystem: options.rewardSystem || 'comprehensive',
            ...options
        };
        
        // Boss archetypes based on learning domains
        this.bossArchetypes = {
            data_orchestrator: {
                name: 'The Data Symphony Conductor',
                domains: ['technical', 'data_analysis', 'systems'],
                description: 'A master of chaotic data streams who tests your ability to find order in complexity',
                personality: 'methodical_chaos',
                weaknesses: ['pattern_recognition', 'logical_thinking'],
                strengths: ['data_manipulation', 'system_disruption'],
                signature_moves: ['Data Storm', 'Entropy Cascade', 'Pattern Scramble'],
                victory_condition: 'Achieve perfect data harmony'
            },
            
            convergence_guardian: {
                name: 'The Sacred Convergence Guardian',
                domains: ['conceptual', 'integration', 'spiritual'],
                description: 'An ancient entity that guards the secrets of convergence and unity',
                personality: 'wise_challenger',
                weaknesses: ['integration_thinking', 'spatial_reasoning'],
                strengths: ['mystical_barriers', 'convergence_disruption'],
                signature_moves: ['Divergence Wave', 'Unity Shatter', 'Sacred Test'],
                victory_condition: 'Demonstrate true understanding of convergence'
            },
            
            architecture_master: {
                name: 'The System Architecture Oracle',
                domains: ['technical', 'design', 'optimization'],
                description: 'A legendary architect who challenges your system design mastery',
                personality: 'perfectionist_mentor',
                weaknesses: ['technical_architecture', 'optimization_thinking'],
                strengths: ['system_complexity', 'design_challenges'],
                signature_moves: ['Architecture Maze', 'Optimization Trap', 'Design Paradox'],
                victory_condition: 'Create the perfect system architecture'
            },
            
            knowledge_weaver: {
                name: 'The Ancient Knowledge Weaver',
                domains: ['historical', 'cultural', 'wisdom'],
                description: 'A keeper of ancient wisdom who tests your cultural understanding',
                personality: 'ancient_wisdom',
                weaknesses: ['historical_understanding', 'cultural_awareness'],
                strengths: ['time_manipulation', 'wisdom_challenges'],
                signature_moves: ['Temporal Shift', 'Wisdom Lock', 'Cultural Maze'],
                victory_condition: 'Prove worthy of ancient knowledge'
            },
            
            business_strategist: {
                name: 'The Grand Business Strategist',
                domains: ['business', 'strategy', 'economics'],
                description: 'A master strategist who challenges your business acumen',
                personality: 'competitive_mentor',
                weaknesses: ['strategic_thinking', 'market_analysis'],
                strengths: ['market_manipulation', 'strategy_disruption'],
                signature_moves: ['Market Chaos', 'Strategy Block', 'Economic Storm'],
                victory_condition: 'Demonstrate superior business strategy'
            }
        };
        
        // Battle phase templates
        this.phaseTemplates = {
            introduction: {
                name: 'The Challenge Begins',
                type: 'narrative_intro',
                duration: '1-2 minutes',
                mechanics: ['story_engagement'],
                description: 'Boss introduction and challenge setup'
            },
            
            skill_test: {
                name: 'Trial of Skills',
                type: 'skill_demonstration',
                duration: '3-5 minutes',
                mechanics: ['primary_skill_test'],
                description: 'Test core skills learned in chapter'
            },
            
            integration_challenge: {
                name: 'The Integration Trial',
                type: 'concept_integration',
                duration: '4-6 minutes',
                mechanics: ['multi_skill_combination'],
                description: 'Combine multiple concepts and skills'
            },
            
            adaptation_test: {
                name: 'Adaptation Under Pressure',
                type: 'adaptive_challenge',
                duration: '3-5 minutes',
                mechanics: ['adaptive_problem_solving'],
                description: 'Apply knowledge to novel situations'
            },
            
            mastery_proof: {
                name: 'Proof of Mastery',
                type: 'mastery_demonstration',
                duration: '5-7 minutes',
                mechanics: ['comprehensive_application'],
                description: 'Demonstrate complete mastery of chapter concepts'
            },
            
            final_confrontation: {
                name: 'The Final Confrontation',
                type: 'climactic_battle',
                duration: '3-5 minutes',
                mechanics: ['all_skills_required'],
                description: 'Epic final challenge requiring everything learned'
            }
        };
        
        // Mechanic templates for boss battles
        this.battleMechanics = {
            pattern_storm: {
                name: 'Pattern Storm',
                description: 'Navigate through chaotic patterns to find the correct sequence',
                difficulty: 'medium',
                skills_required: ['pattern_recognition', 'quick_thinking'],
                interaction_type: 'drag_drop_sequence',
                time_pressure: true
            },
            
            system_defense: {
                name: 'System Defense',
                description: 'Protect your system architecture from boss attacks',
                difficulty: 'hard',
                skills_required: ['technical_architecture', 'strategic_thinking'],
                interaction_type: 'tower_defense_style',
                time_pressure: true
            },
            
            convergence_ritual: {
                name: 'Convergence Ritual',
                description: 'Align scattered elements to achieve perfect convergence',
                difficulty: 'medium',
                skills_required: ['integration_thinking', 'spatial_reasoning'],
                interaction_type: 'alignment_puzzle',
                time_pressure: false
            },
            
            knowledge_duel: {
                name: 'Knowledge Duel',
                description: 'Answer increasingly complex questions under pressure',
                difficulty: 'hard',
                skills_required: ['domain_knowledge', 'quick_recall'],
                interaction_type: 'timed_quiz',
                time_pressure: true
            },
            
            creative_challenge: {
                name: 'Creative Challenge',
                description: 'Create innovative solutions to complex problems',
                difficulty: 'hard',
                skills_required: ['creative_thinking', 'problem_solving'],
                interaction_type: 'open_ended_creation',
                time_pressure: false
            },
            
            strategic_warfare: {
                name: 'Strategic Warfare',
                description: 'Outmaneuver the boss through superior strategy',
                difficulty: 'hard',
                skills_required: ['strategic_thinking', 'tactical_planning'],
                interaction_type: 'strategy_game',
                time_pressure: true
            }
        };
        
        // Reward tiers based on performance
        this.rewardTiers = {
            legendary: {
                xp_multiplier: 2.0,
                title_prefix: 'Legendary',
                special_rewards: ['unique_character_skin', 'boss_replay_mode', 'mastery_certificate'],
                unlock_condition: 'Perfect performance, no mistakes'
            },
            
            heroic: {
                xp_multiplier: 1.5,
                title_prefix: 'Heroic',
                special_rewards: ['character_upgrade', 'boss_insights', 'skill_boost'],
                unlock_condition: 'Excellent performance, minimal mistakes'
            },
            
            skilled: {
                xp_multiplier: 1.2,
                title_prefix: 'Skilled',
                special_rewards: ['character_badge', 'bonus_xp'],
                unlock_condition: 'Good performance, some mistakes allowed'
            },
            
            apprentice: {
                xp_multiplier: 1.0,
                title_prefix: 'Apprentice',
                special_rewards: ['completion_badge'],
                unlock_condition: 'Basic completion'
            }
        };
    }
    
    /**
     * Generate a boss fight based on chapter analysis
     */
    async generateBossFight(chapterAnalysis, playerProfile = {}) {
        try {
            console.log('⚔️ Generating boss fight for chapter analysis...');
            
            // 1. Select appropriate boss archetype
            const bossArchetype = this.selectBossArchetype(chapterAnalysis);
            
            // 2. Determine battle phases
            const battlePhases = this.generateBattlePhases(chapterAnalysis, bossArchetype);
            
            // 3. Create boss character with backstory
            const bossCharacter = this.createBossCharacter(bossArchetype, chapterAnalysis);
            
            // 4. Generate phase-specific challenges
            const phaseChallenges = await this.generatePhaseChallenges(battlePhases, chapterAnalysis);
            
            // 5. Set up reward system
            const rewardSystem = this.setupRewardSystem(chapterAnalysis, bossArchetype);
            
            // 6. Create adaptive difficulty system
            const difficultySystem = this.createDifficultySystem(chapterAnalysis, playerProfile);
            
            const bossFight = {
                id: crypto.randomUUID(),
                name: bossCharacter.name,
                archetype: bossArchetype,
                character: bossCharacter,
                phases: phaseChallenges,
                rewards: rewardSystem,
                difficulty: difficultySystem,
                metadata: {
                    estimatedTime: this.calculateEstimatedTime(battlePhases),
                    skillsRequired: this.extractRequiredSkills(chapterAnalysis),
                    replayable: true,
                    adaptiveDifficulty: true
                }
            };
            
            console.log(`✅ Boss fight generated: ${bossFight.name}`);
            this.emit('boss_fight_generated', bossFight);
            
            return bossFight;
            
        } catch (error) {
            console.error('❌ Boss fight generation failed:', error);
            this.emit('generation_error', { error, chapterAnalysis });
            throw error;
        }
    }
    
    /**
     * Select the most appropriate boss archetype based on chapter content
     */
    selectBossArchetype(chapterAnalysis) {
        const domains = chapterAnalysis.domains || [];
        const complexity = chapterAnalysis.complexity || 'medium';
        
        // Score each archetype based on domain match
        const archetypeScores = {};
        
        for (const [key, archetype] of Object.entries(this.bossArchetypes)) {
            let score = 0;
            
            // Domain matching
            for (const domain of domains) {
                if (archetype.domains.includes(domain)) {
                    score += 10;
                }
            }
            
            // Complexity matching
            if (complexity === 'hard' && key.includes('master')) score += 5;
            if (complexity === 'medium' && key.includes('guardian')) score += 5;
            if (complexity === 'easy' && key.includes('weaver')) score += 5;
            
            archetypeScores[key] = score;
        }
        
        // Select highest scoring archetype
        const selectedKey = Object.keys(archetypeScores).reduce((a, b) => 
            archetypeScores[a] > archetypeScores[b] ? a : b
        );
        
        return this.bossArchetypes[selectedKey];
    }
    
    /**
     * Generate battle phases based on chapter complexity and content
     */
    generateBattlePhases(chapterAnalysis, bossArchetype) {
        const complexity = chapterAnalysis.complexity || 'medium';
        const phaseCount = this.calculatePhaseCount(complexity);
        
        const phases = [];
        
        // Always start with introduction
        phases.push(this.phaseTemplates.introduction);
        
        // Add core phases based on complexity
        if (phaseCount >= 3) {
            phases.push(this.phaseTemplates.skill_test);
        }
        if (phaseCount >= 4) {
            phases.push(this.phaseTemplates.integration_challenge);
        }
        if (phaseCount >= 5) {
            phases.push(this.phaseTemplates.adaptation_test);
        }
        if (phaseCount >= 6) {
            phases.push(this.phaseTemplates.mastery_proof);
        }
        
        // Always end with final confrontation
        phases.push(this.phaseTemplates.final_confrontation);
        
        return phases;
    }
    
    /**
     * Create detailed boss character with narrative backstory
     */
    createBossCharacter(archetype, chapterAnalysis) {
        const character = {
            id: crypto.randomUUID(),
            name: archetype.name,
            title: this.generateBossTitle(archetype, chapterAnalysis),
            description: archetype.description,
            personality: archetype.personality,
            
            // Visual characteristics
            appearance: {
                size: 'imposing',
                style: this.selectVisualStyle(archetype),
                colors: this.selectBossColors(archetype),
                animations: this.getBossAnimations(archetype)
            },
            
            // Narrative elements
            backstory: this.generateBackstory(archetype, chapterAnalysis),
            motivation: this.generateMotivation(archetype, chapterAnalysis),
            dialogue: this.generateBossDialogue(archetype),
            
            // Combat characteristics
            abilities: archetype.signature_moves,
            weaknesses: archetype.weaknesses,
            strengths: archetype.strengths,
            
            // Chapter-specific elements
            contextualElements: this.extractContextualElements(chapterAnalysis),
            victoryCondition: archetype.victory_condition
        };
        
        return character;
    }
    
    /**
     * Generate specific challenges for each battle phase
     */
    async generatePhaseChallenges(battlePhases, chapterAnalysis) {
        const phaseChallenges = [];
        
        for (let i = 0; i < battlePhases.length; i++) {
            const phase = battlePhases[i];
            const challenge = await this.createPhaseChallenge(phase, chapterAnalysis, i);
            phaseChallenges.push(challenge);
        }
        
        return phaseChallenges;
    }
    
    /**
     * Create a specific challenge for a battle phase
     */
    async createPhaseChallenge(phase, chapterAnalysis, phaseIndex) {
        const skills = chapterAnalysis.skillsTargeted || [];
        const domains = chapterAnalysis.domains || [];
        
        // Select appropriate battle mechanics for this phase
        const mechanics = this.selectPhaseMechanics(phase, skills, domains);
        
        const challenge = {
            id: crypto.randomUUID(),
            phaseIndex: phaseIndex + 1,
            name: phase.name,
            type: phase.type,
            description: phase.description,
            duration: phase.duration,
            
            // Challenge mechanics
            mechanics: mechanics,
            interactions: this.generatePhaseInteractions(mechanics, chapterAnalysis),
            
            // Success criteria
            successCriteria: this.generateSuccessCriteria(phase, mechanics),
            failureConsequences: this.generateFailureConsequences(phase),
            
            // Adaptive elements
            difficultyFactors: this.generateDifficultyFactors(phase, chapterAnalysis),
            hints: this.generatePhaseHints(phase, mechanics),
            
            // Narrative elements
            bossDialogue: this.generatePhaseDialogue(phase, phaseIndex),
            visualEffects: this.generatePhaseVisuals(phase, mechanics)
        };
        
        return challenge;
    }
    
    /**
     * Select appropriate mechanics for a battle phase
     */
    selectPhaseMechanics(phase, skills, domains) {
        const availableMechanics = Object.values(this.battleMechanics);
        const selectedMechanics = [];
        
        // Filter mechanics based on phase type and required skills
        for (const mechanic of availableMechanics) {
            let score = 0;
            
            // Skill alignment
            for (const skill of skills) {
                if (mechanic.skills_required.includes(skill)) {
                    score += 5;
                }
            }
            
            // Phase type alignment
            if (phase.type === 'skill_demonstration' && mechanic.name.includes('Pattern')) score += 3;
            if (phase.type === 'concept_integration' && mechanic.name.includes('System')) score += 3;
            if (phase.type === 'climactic_battle' && mechanic.difficulty === 'hard') score += 3;
            
            if (score > 3) {
                selectedMechanics.push(mechanic);
            }
        }
        
        // Ensure at least one mechanic is selected
        if (selectedMechanics.length === 0) {
            selectedMechanics.push(availableMechanics[0]);
        }
        
        return selectedMechanics.slice(0, 2); // Max 2 mechanics per phase
    }
    
    /**
     * Setup comprehensive reward system
     */
    setupRewardSystem(chapterAnalysis, bossArchetype) {
        const baseXP = this.calculateBaseXP(chapterAnalysis);
        
        return {
            baseRewards: {
                xp: baseXP,
                title: `${bossArchetype.name} Challenger`,
                badge: `boss_defeat_${bossArchetype.name.toLowerCase().replace(/\s+/g, '_')}`
            },
            
            performanceTiers: this.rewardTiers,
            
            bonusRewards: {
                perfect_run: { xp: baseXP * 0.5, title: 'Perfect Warrior' },
                speed_completion: { xp: baseXP * 0.3, title: 'Swift Striker' },
                creative_solution: { xp: baseXP * 0.4, title: 'Creative Genius' },
                no_hints_used: { xp: baseXP * 0.2, title: 'Independent Master' }
            },
            
            unlocks: {
                boss_replay_mode: 'Replay this boss fight anytime',
                advanced_challenges: 'Unlock harder variations',
                boss_insights: 'Learn boss strategies and weaknesses',
                character_upgrades: 'Enhance your learning character'
            }
        };
    }
    
    /**
     * Create adaptive difficulty system
     */
    createDifficultySystem(chapterAnalysis, playerProfile) {
        return {
            baseDifficulty: chapterAnalysis.complexity || 'medium',
            adaptiveFactors: {
                playerSkillLevel: playerProfile.skillLevel || 'beginner',
                previousPerformance: playerProfile.averageScore || 0.7,
                learningStyle: playerProfile.learningStyle || 'visual',
                timeTaken: playerProfile.averageTime || 'normal'
            },
            
            adjustmentMechanisms: {
                hint_frequency: 'Increase hints for struggling players',
                time_pressure: 'Reduce time pressure for careful learners',
                complexity_scaling: 'Adjust challenge complexity dynamically',
                retry_assistance: 'Provide specific guidance on retries'
            },
            
            difficultyLevels: {
                tutorial: { damage_reduction: 0.5, hint_boost: 2.0, time_bonus: 1.5 },
                normal: { damage_reduction: 1.0, hint_boost: 1.0, time_bonus: 1.0 },
                challenging: { damage_reduction: 1.5, hint_boost: 0.7, time_bonus: 0.8 },
                expert: { damage_reduction: 2.0, hint_boost: 0.5, time_bonus: 0.6 },
                legendary: { damage_reduction: 3.0, hint_boost: 0.2, time_bonus: 0.4 }
            }
        };
    }
    
    // Helper methods for content generation
    calculatePhaseCount(complexity) {
        const phaseMap = { easy: 3, medium: 4, hard: 5 };
        return phaseMap[complexity] || 4;
    }
    
    generateBossTitle(archetype, chapterAnalysis) {
        const titles = [
            `${archetype.name}, Guardian of ${chapterAnalysis.chapter?.title || 'Knowledge'}`,
            `The Legendary ${archetype.name}`,
            `${archetype.name}, Master of ${chapterAnalysis.domains?.[0] || 'Wisdom'}`
        ];
        return titles[Math.floor(Math.random() * titles.length)];
    }
    
    selectVisualStyle(archetype) {
        const styleMap = {
            data_orchestrator: 'cyber_matrix',
            convergence_guardian: 'mystical_ancient',
            architecture_master: 'geometric_modern',
            knowledge_weaver: 'ethereal_wise',
            business_strategist: 'corporate_powerful'
        };
        return styleMap[Object.keys(this.bossArchetypes).find(key => 
            this.bossArchetypes[key] === archetype)] || 'mysterious';
    }
    
    selectBossColors(archetype) {
        const colorMap = {
            data_orchestrator: { primary: '#00ffff', secondary: '#ff00ff', accent: '#ffff00' },
            convergence_guardian: { primary: '#8a2be2', secondary: '#daa520', accent: '#32cd32' },
            architecture_master: { primary: '#4169e1', secondary: '#ff6347', accent: '#20b2aa' },
            knowledge_weaver: { primary: '#daa520', secondary: '#8b4513', accent: '#228b22' },
            business_strategist: { primary: '#2f4f4f', secondary: '#b8860b', accent: '#dc143c' }
        };
        return colorMap[Object.keys(this.bossArchetypes).find(key => 
            this.bossArchetypes[key] === archetype)] || { primary: '#666', secondary: '#999', accent: '#ccc' };
    }
    
    getBossAnimations(archetype) {
        return ['idle_menacing', 'attack_signature', 'defend_stance', 'victory_pose', 'defeat_animation'];
    }
    
    generateBackstory(archetype, chapterAnalysis) {
        return `Once a guardian of ${chapterAnalysis.chapter?.title || 'ancient knowledge'}, ${archetype.name} now tests those who seek to master the sacred arts of ${chapterAnalysis.domains?.[0] || 'learning'}. Only those who prove their worth may pass.`;
    }
    
    generateMotivation(archetype, chapterAnalysis) {
        return `To ensure that only the most dedicated learners gain access to the deeper mysteries of ${chapterAnalysis.chapter?.title || 'knowledge'}.`;
    }
    
    generateBossDialogue(archetype) {
        const dialogueMap = {
            data_orchestrator: [
                "So, you think you can tame the chaos of data? We shall see...",
                "Let the symphony of disorder test your resolve!",
                "Impressive... but can you handle the true storm?"
            ],
            convergence_guardian: [
                "Seeker of unity, prove your understanding of convergence.",
                "The ancient ways are not easily mastered...",
                "You show promise, but mastery requires more."
            ],
            architecture_master: [
                "Your designs are flawed. Let me show you perfection.",
                "Architecture is not just building - it is art!",
                "Perhaps you are worthy of the deeper mysteries."
            ]
        };
        return dialogueMap[Object.keys(this.bossArchetypes).find(key => 
            this.bossArchetypes[key] === archetype)] || [
            "You dare challenge the master?",
            "Interesting technique... but insufficient.",
            "Well fought, young apprentice."
        ];
    }
    
    extractContextualElements(chapterAnalysis) {
        return {
            chapterThemes: chapterAnalysis.domains || [],
            keyTerms: chapterAnalysis.keyConceptsCount || 0,
            narrativeElements: chapterAnalysis.gameElementsFound || []
        };
    }
    
    generatePhaseInteractions(mechanics, chapterAnalysis) {
        return mechanics.map(mechanic => ({
            type: mechanic.interaction_type,
            description: mechanic.description,
            skills_tested: mechanic.skills_required,
            time_pressure: mechanic.time_pressure,
            context: chapterAnalysis.chapter?.title || 'Learning Challenge'
        }));
    }
    
    generateSuccessCriteria(phase, mechanics) {
        return {
            completion_threshold: 0.8,
            time_limit: this.extractTimeLimit(phase.duration),
            skill_demonstrations: mechanics.map(m => m.skills_required).flat(),
            quality_requirements: ['accuracy', 'understanding', 'application']
        };
    }
    
    generateFailureConsequences(phase) {
        return {
            retry_allowed: true,
            hint_unlocked: true,
            reduced_rewards: true,
            additional_practice: true
        };
    }
    
    generateDifficultyFactors(phase, chapterAnalysis) {
        return {
            base_complexity: chapterAnalysis.complexity,
            time_pressure: phase.type === 'climactic_battle',
            multi_skill_required: phase.mechanics?.length > 1,
            adaptive_scaling: true
        };
    }
    
    generatePhaseHints(phase, mechanics) {
        return [
            `Focus on the core concept: ${phase.name}`,
            `Remember the skills you've learned: ${mechanics.map(m => m.skills_required.join(', ')).join(' and ')}`,
            `Take your time to think through the solution`,
            `The boss has weaknesses - find the pattern!`
        ];
    }
    
    generatePhaseDialogue(phase, phaseIndex) {
        const dialogueMap = {
            0: "So you dare to challenge me? Let us begin...",
            1: "Your skills show promise, but this is only the beginning.",
            2: "Impressive progress, but now comes the real test.",
            3: "You've learned well, but can you adapt under pressure?",
            4: "Few reach this level. Show me your mastery!",
            5: "This is our final confrontation. Give me everything you have!"
        };
        return dialogueMap[phaseIndex] || "The battle continues...";
    }
    
    generatePhaseVisuals(phase, mechanics) {
        return {
            background_effects: this.getBackgroundEffects(phase.type),
            boss_animations: this.getBossPhaseAnimations(phase.type),
            ui_elements: this.getUIElements(mechanics),
            particle_effects: this.getParticleEffects(phase.type)
        };
    }
    
    getBackgroundEffects(phaseType) {
        const effectMap = {
            narrative_intro: 'dramatic_entrance',
            skill_demonstration: 'focused_arena',
            concept_integration: 'swirling_connections',
            adaptive_challenge: 'shifting_environment',
            mastery_demonstration: 'golden_glow',
            climactic_battle: 'epic_storm'
        };
        return effectMap[phaseType] || 'standard_arena';
    }
    
    getBossPhaseAnimations(phaseType) {
        return [`${phaseType}_stance`, `${phaseType}_attack`, `${phaseType}_defend`];
    }
    
    getUIElements(mechanics) {
        return mechanics.map(mechanic => ({
            type: mechanic.interaction_type,
            layout: 'optimized_for_mechanic',
            feedback: 'real_time'
        }));
    }
    
    getParticleEffects(phaseType) {
        return [`${phaseType}_particles`, 'impact_effects', 'success_celebration'];
    }
    
    extractTimeLimit(duration) {
        const match = duration.match(/(\d+)-(\d+) minutes/);
        if (match) {
            return Math.round((parseInt(match[1]) + parseInt(match[2])) / 2 * 60); // Convert to seconds
        }
        return 300; // Default 5 minutes
    }
    
    calculateEstimatedTime(battlePhases) {
        let totalMinutes = 0;
        battlePhases.forEach(phase => {
            const match = phase.duration.match(/(\d+)-(\d+) minutes/);
            if (match) {
                totalMinutes += Math.round((parseInt(match[1]) + parseInt(match[2])) / 2);
            }
        });
        return `${totalMinutes} minutes`;
    }
    
    extractRequiredSkills(chapterAnalysis) {
        return chapterAnalysis.skillsTargeted || ['problem_solving', 'critical_thinking'];
    }
    
    calculateBaseXP(chapterAnalysis) {
        const baseXP = 500;
        const complexityMultiplier = { easy: 1, medium: 1.5, hard: 2 };
        return Math.floor(baseXP * (complexityMultiplier[chapterAnalysis.complexity] || 1.5));
    }
}

module.exports = BossFightGenerator;

// Example usage
if (require.main === module) {
    const generator = new BossFightGenerator({
        difficultyScaling: 'adaptive',
        narrativeStyle: 'epic',
        phaseCount: 'auto'
    });
    
    // Example chapter analysis
    const chapterAnalysis = {
        complexity: 'medium',
        domains: ['technical', 'conceptual'],
        skillsTargeted: ['pattern_recognition', 'systems_thinking', 'data_analysis'],
        keyConceptsCount: 12,
        chapter: { title: 'Finding the Way Back to Kickapoo Valley' }
    };
    
    generator.generateBossFight(chapterAnalysis)
        .then(bossFight => {
            console.log('⚔️ Boss Fight Generated!');
            console.log(`Boss: ${bossFight.name}`);
            console.log(`Phases: ${bossFight.phases.length}`);
            console.log(`Estimated Time: ${bossFight.metadata.estimatedTime}`);
            console.log(`Base XP Reward: ${bossFight.rewards.baseRewards.xp}`);
        })
        .catch(error => {
            console.error('❌ Generation failed:', error);
        });
}