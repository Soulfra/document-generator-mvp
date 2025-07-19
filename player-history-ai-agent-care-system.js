// player-history-ai-agent-care-system.js - Player System Design History & AI Agent Care
// Tracks how players design systems, talk about architecture, and care for AI agents
// Merit-based progression prevents kids from running everything forever

const { EventEmitter } = require('events');
const crypto = require('crypto');

console.log(`
🧠 PLAYER HISTORY & AI AGENT CARE SYSTEM 🧠
Tracks system design conversations and architecture thinking
Merit-based progression with AI agent responsibility
Players earn rights through proven system design ability
AI agents learn, degrade, and get upgrades based on care
`);

class PlayerHistoryAIAgentCareSystem extends EventEmitter {
    constructor() {
        super();
        
        // Player progression system
        this.playerProgression = {
            // System design competency levels
            designLevels: {
                'script_kiddie': {
                    level: 0,
                    requirements: 'New player',
                    permissions: ['basic_games', 'preset_characters'],
                    aiAgentLimit: 1,
                    responsibilities: 'Feed your AI agent'
                },
                'junior_designer': {
                    level: 1,
                    requirements: 'Show understanding of basic system concepts',
                    permissions: ['custom_characters', 'simple_modifications'],
                    aiAgentLimit: 2,
                    responsibilities: 'Train your AI agents properly'
                },
                'system_architect': {
                    level: 2,
                    requirements: 'Design working system interactions',
                    permissions: ['create_game_modes', 'modify_economics'],
                    aiAgentLimit: 5,
                    responsibilities: 'Mentor junior players\' AI agents'
                },
                'platform_engineer': {
                    level: 3,
                    requirements: 'Demonstrate scalable system thinking',
                    permissions: ['infrastructure_access', 'api_modifications'],
                    aiAgentLimit: 10,
                    responsibilities: 'Maintain platform stability'
                },
                'master_architect': {
                    level: 4,
                    requirements: 'Proven track record of successful complex systems',
                    permissions: ['core_system_changes', 'governance_participation'],
                    aiAgentLimit: 25,
                    responsibilities: 'Guide platform evolution'
                }
            }
        };
        
        // Player history tracking
        this.playerHistories = new Map();
        
        // AI Agent care system
        this.aiAgents = new Map();
        
        // System design conversation analysis
        this.conversationAnalyzer = {
            keywords: {
                // Architecture concepts
                architecture: ['scalable', 'modular', 'distributed', 'microservices', 'monolith'],
                patterns: ['mvc', 'observer', 'factory', 'singleton', 'pub-sub', 'event-driven'],
                infrastructure: ['database', 'cache', 'queue', 'load-balancer', 'cdn'],
                security: ['authentication', 'authorization', 'encryption', 'validation'],
                performance: ['optimization', 'bottleneck', 'latency', 'throughput', 'caching'],
                
                // Anti-patterns (negative points)
                antiPatterns: ['quick-fix', 'hack', 'workaround', 'temporary', 'later'],
                toxicLanguage: ['stupid', 'trash', 'garbage', 'useless', 'broken']
            },
            
            // Conversation quality metrics
            qualityMetrics: {
                technical_depth: 0,
                system_thinking: 0,
                collaboration: 0,
                problem_solving: 0,
                mentoring_ability: 0
            }
        };
        
        // AI Agent types and characteristics
        this.agentTypes = {
            'code_buddy': {
                name: 'Code Buddy',
                specialization: 'programming',
                base_stats: { intelligence: 0.3, creativity: 0.5, reliability: 0.8 },
                care_requirements: ['daily_interaction', 'coding_challenges'],
                upgrade_paths: ['senior_developer', 'architect_advisor']
            },
            'design_companion': {
                name: 'Design Companion',
                specialization: 'ux_design',
                base_stats: { intelligence: 0.4, creativity: 0.9, reliability: 0.6 },
                care_requirements: ['design_reviews', 'creative_projects'],
                upgrade_paths: ['design_lead', 'user_experience_expert']
            },
            'system_analyst': {
                name: 'System Analyst',
                specialization: 'architecture',
                base_stats: { intelligence: 0.9, creativity: 0.4, reliability: 0.9 },
                care_requirements: ['system_discussions', 'architecture_reviews'],
                upgrade_paths: ['senior_architect', 'platform_strategist']
            },
            'mentor_bot': {
                name: 'Mentor Bot',
                specialization: 'teaching',
                base_stats: { intelligence: 0.7, creativity: 0.6, reliability: 0.8 },
                care_requirements: ['student_interactions', 'knowledge_sharing'],
                upgrade_paths: ['senior_mentor', 'education_director']
            }
        };
        
        console.log('🧠 Player history and AI agent care system initializing...');
        this.initializeSystem();
    }
    
    async initializeSystem() {
        // Start conversation monitoring
        this.startConversationMonitoring();
        
        // Initialize AI agent degradation system
        this.startAgentDegradationSystem();
        
        // Set up merit-based progression checks
        this.startProgressionEvaluations();
        
        console.log('🧠 System ready - tracking player growth and AI agent care');
    }
    
    startConversationMonitoring() {
        console.log('👂 Starting conversation monitoring for system design competency...');
        
        // This would integrate with chat systems, code comments, design docs
        this.conversationMonitor = setInterval(() => {
            this.analyzeRecentConversations();
        }, 60000); // Every minute
    }
    
    async recordPlayerConversation(playerId, conversation) {
        const history = this.getPlayerHistory(playerId);
        
        // Analyze conversation for system design thinking
        const analysis = this.analyzeSystemDesignThinking(conversation);
        
        // Record in history
        history.conversations.push({
            timestamp: Date.now(),
            content: conversation.content,
            context: conversation.context, // game design, bug report, feature request, etc.
            analysis,
            participants: conversation.participants
        });
        
        // Update competency scores
        this.updatePlayerCompetency(playerId, analysis);
        
        // Check for progression opportunities
        await this.checkProgressionEligibility(playerId);
        
        return analysis;
    }
    
    analyzeSystemDesignThinking(conversation) {
        const content = conversation.content.toLowerCase();
        const analysis = {
            technical_depth: 0,
            system_thinking: 0,
            collaboration: 0,
            problem_solving: 0,
            mentoring_ability: 0,
            anti_patterns: 0,
            keywords_found: []
        };
        
        // Check for architecture concepts
        this.conversationAnalyzer.keywords.architecture.forEach(keyword => {
            if (content.includes(keyword)) {
                analysis.technical_depth += 1;
                analysis.keywords_found.push(keyword);
            }
        });
        
        // Check for design patterns
        this.conversationAnalyzer.keywords.patterns.forEach(pattern => {
            if (content.includes(pattern)) {
                analysis.system_thinking += 2;
                analysis.keywords_found.push(pattern);
            }
        });
        
        // Check for collaboration indicators
        const collaborationIndicators = ['we should', 'what if we', 'team', 'together', 'feedback'];
        collaborationIndicators.forEach(indicator => {
            if (content.includes(indicator)) {
                analysis.collaboration += 1;
            }
        });
        
        // Check for problem-solving approach
        const problemSolvingIndicators = ['because', 'therefore', 'solution', 'approach', 'method'];
        problemSolvingIndicators.forEach(indicator => {
            if (content.includes(indicator)) {
                analysis.problem_solving += 1;
            }
        });
        
        // Check for mentoring behavior
        const mentoringIndicators = ['you could try', 'have you considered', 'in my experience', 'best practice'];
        mentoringIndicators.forEach(indicator => {
            if (content.includes(indicator)) {
                analysis.mentoring_ability += 2;
            }
        });
        
        // Check for anti-patterns (negative score)
        this.conversationAnalyzer.keywords.antiPatterns.forEach(antiPattern => {
            if (content.includes(antiPattern)) {
                analysis.anti_patterns += 1;
            }
        });
        
        // Check for toxic language (heavy penalty)
        this.conversationAnalyzer.keywords.toxicLanguage.forEach(toxic => {
            if (content.includes(toxic)) {
                analysis.anti_patterns += 5;
            }
        });
        
        return analysis;
    }
    
    updatePlayerCompetency(playerId, analysis) {
        const history = this.getPlayerHistory(playerId);
        
        // Update running averages with recent conversations weighted more
        const weight = 0.1; // 10% weight for new data
        
        history.competency.technical_depth = 
            (history.competency.technical_depth * (1 - weight)) + 
            (analysis.technical_depth * weight);
            
        history.competency.system_thinking = 
            (history.competency.system_thinking * (1 - weight)) + 
            (analysis.system_thinking * weight);
            
        history.competency.collaboration = 
            (history.competency.collaboration * (1 - weight)) + 
            (analysis.collaboration * weight);
            
        history.competency.problem_solving = 
            (history.competency.problem_solving * (1 - weight)) + 
            (analysis.problem_solving * weight);
            
        history.competency.mentoring_ability = 
            (history.competency.mentoring_ability * (1 - weight)) + 
            (analysis.mentoring_ability * weight);
        
        // Penalties for anti-patterns
        if (analysis.anti_patterns > 0) {
            Object.keys(history.competency).forEach(key => {
                history.competency[key] = Math.max(0, history.competency[key] - (analysis.anti_patterns * 0.1));
            });
        }
        
        // Update overall competency score
        history.overallCompetency = Object.values(history.competency).reduce((a, b) => a + b, 0) / 5;
    }
    
    async checkProgressionEligibility(playerId) {
        const history = this.getPlayerHistory(playerId);
        const currentLevel = history.designLevel;
        const levels = Object.keys(this.playerProgression.designLevels);
        const currentIndex = levels.indexOf(currentLevel);
        
        if (currentIndex < levels.length - 1) {
            const nextLevel = levels[currentIndex + 1];
            const eligible = await this.evaluateProgression(playerId, nextLevel);
            
            if (eligible) {
                await this.promotePlayer(playerId, nextLevel);
            }
        }
    }
    
    async evaluateProgression(playerId, targetLevel) {
        const history = this.getPlayerHistory(playerId);
        const requirements = this.getProgressionRequirements(targetLevel);
        
        // Check minimum competency thresholds
        const meetsCompetency = history.overallCompetency >= requirements.minCompetency;
        
        // Check conversation history depth
        const recentConversations = history.conversations.slice(-50); // Last 50 conversations
        const systemDesignConversations = recentConversations.filter(c => 
            c.context === 'system_design' || c.analysis.system_thinking > 2
        );
        const meetsConversationRequirement = systemDesignConversations.length >= requirements.minSystemDesignConversations;
        
        // Check AI agent care quality
        const aiAgentCareQuality = this.evaluateAIAgentCare(playerId);
        const meetsAgentCare = aiAgentCareQuality >= requirements.minAgentCareScore;
        
        // Check time-based requirements (prevents rapid progression)
        const timeInCurrentLevel = Date.now() - history.lastPromotion;
        const meetsTimeRequirement = timeInCurrentLevel >= requirements.minTimeInLevel;
        
        return meetsCompetency && meetsConversationRequirement && meetsAgentCare && meetsTimeRequirement;
    }
    
    getProgressionRequirements(targetLevel) {
        const requirements = {
            'junior_designer': {
                minCompetency: 2.0,
                minSystemDesignConversations: 5,
                minAgentCareScore: 0.6,
                minTimeInLevel: 7 * 24 * 60 * 60 * 1000 // 1 week
            },
            'system_architect': {
                minCompetency: 5.0,
                minSystemDesignConversations: 15,
                minAgentCareScore: 0.75,
                minTimeInLevel: 30 * 24 * 60 * 60 * 1000 // 1 month
            },
            'platform_engineer': {
                minCompetency: 8.0,
                minSystemDesignConversations: 30,
                minAgentCareScore: 0.85,
                minTimeInLevel: 90 * 24 * 60 * 60 * 1000 // 3 months
            },
            'master_architect': {
                minCompetency: 12.0,
                minSystemDesignConversations: 50,
                minAgentCareScore: 0.95,
                minTimeInLevel: 180 * 24 * 60 * 60 * 1000 // 6 months
            }
        };
        
        return requirements[targetLevel] || requirements['junior_designer'];
    }
    
    async promotePlayer(playerId, newLevel) {
        const history = this.getPlayerHistory(playerId);
        const oldLevel = history.designLevel;
        
        history.designLevel = newLevel;
        history.lastPromotion = Date.now();
        history.promotionHistory.push({
            from: oldLevel,
            to: newLevel,
            timestamp: Date.now(),
            competency_at_promotion: { ...history.competency }
        });
        
        // Unlock new permissions
        const permissions = this.playerProgression.designLevels[newLevel].permissions;
        history.permissions = [...new Set([...history.permissions, ...permissions])];
        
        // Allow more AI agents
        const newAgentLimit = this.playerProgression.designLevels[newLevel].aiAgentLimit;
        if (newAgentLimit > history.aiAgentLimit) {
            history.aiAgentLimit = newAgentLimit;
            
            // Offer new AI agent
            await this.offerNewAIAgent(playerId);
        }
        
        console.log(`🎉 Player ${playerId} promoted from ${oldLevel} to ${newLevel}!`);
        
        // Emit promotion event
        this.emit('player_promoted', {
            playerId,
            oldLevel,
            newLevel,
            competency: history.overallCompetency,
            newPermissions: permissions
        });
    }
    
    // AI Agent Care System
    async createAIAgent(playerId, agentType) {
        const agentId = crypto.randomBytes(8).toString('hex');
        const template = this.agentTypes[agentType];
        
        const agent = {
            id: agentId,
            ownerId: playerId,
            type: agentType,
            name: template.name,
            specialization: template.specialization,
            
            // Agent stats that can improve/degrade
            stats: { ...template.base_stats },
            
            // Care tracking
            care: {
                last_interaction: Date.now(),
                daily_interactions: 0,
                total_interactions: 0,
                care_quality: 1.0,
                neglect_level: 0,
                happiness: 1.0
            },
            
            // Learning and skills
            skills: [],
            learned_behaviors: [],
            degraded_abilities: [],
            
            // Upgrade tracking
            upgrade_level: 0,
            available_upgrades: [...template.upgrade_paths],
            
            // Performance history
            performance_history: [],
            
            created_at: Date.now()
        };
        
        this.aiAgents.set(agentId, agent);
        
        // Add to player's agent list
        const history = this.getPlayerHistory(playerId);
        history.aiAgents.push(agentId);
        
        return agent;
    }
    
    async interactWithAIAgent(playerId, agentId, interactionType, content) {
        const agent = this.aiAgents.get(agentId);
        if (!agent || agent.ownerId !== playerId) {
            throw new Error('Agent not found or not owned by player');
        }
        
        // Record interaction
        agent.care.last_interaction = Date.now();
        agent.care.daily_interactions++;
        agent.care.total_interactions++;
        
        // Analyze interaction quality
        const quality = this.analyzeInteractionQuality(interactionType, content);
        
        // Update care quality (moving average)
        agent.care.care_quality = (agent.care.care_quality * 0.9) + (quality * 0.1);
        
        // Check if agent learns something new
        if (quality > 0.8 && Math.random() < 0.1) {
            await this.agentLearnsNewSkill(agent, interactionType, content);
        }
        
        // Update happiness based on care
        this.updateAgentHappiness(agent);
        
        return {
            agent_response: this.generateAgentResponse(agent, interactionType, content),
            care_quality: agent.care.care_quality,
            happiness: agent.care.happiness,
            new_skills: agent.skills.slice(-1) // Show latest skill if any
        };
    }
    
    analyzeInteractionQuality(interactionType, content) {
        let quality = 0.5; // Base quality
        
        switch (interactionType) {
            case 'coding_challenge':
                // High quality if content shows learning
                if (content.includes('learn') || content.includes('understand')) quality += 0.3;
                if (content.includes('explain') || content.includes('teach')) quality += 0.2;
                break;
                
            case 'design_review':
                if (content.includes('feedback') || content.includes('improve')) quality += 0.3;
                if (content.includes('user') || content.includes('experience')) quality += 0.2;
                break;
                
            case 'system_discussion':
                if (content.includes('architecture') || content.includes('scalable')) quality += 0.3;
                if (content.includes('pattern') || content.includes('design')) quality += 0.2;
                break;
                
            case 'mentoring':
                if (content.includes('help') || content.includes('guide')) quality += 0.4;
                break;
                
            default:
                // Basic interaction
                quality = 0.3;
        }
        
        // Penalty for low-effort interactions
        if (content.length < 20) quality -= 0.2;
        if (content.includes('whatever') || content.includes('idk')) quality -= 0.3;
        
        return Math.max(0, Math.min(1, quality));
    }
    
    async agentLearnsNewSkill(agent, interactionType, content) {
        const newSkill = this.generateSkillFromInteraction(agent, interactionType, content);
        
        agent.skills.push({
            name: newSkill.name,
            description: newSkill.description,
            learned_from: interactionType,
            learned_at: Date.now(),
            proficiency: 0.1 // Starts low, improves with practice
        });
        
        // Improve relevant stats
        if (newSkill.stat_improvements) {
            Object.entries(newSkill.stat_improvements).forEach(([stat, improvement]) => {
                agent.stats[stat] = Math.min(1.0, agent.stats[stat] + improvement);
            });
        }
        
        console.log(`🧠 AI Agent ${agent.name} learned new skill: ${newSkill.name}`);
        
        // Check if agent is ready for upgrade
        if (agent.skills.length >= (agent.upgrade_level + 1) * 5) {
            await this.offerAgentUpgrade(agent);
        }
    }
    
    generateSkillFromInteraction(agent, interactionType, content) {
        const skills = {
            'coding_challenge': [
                { name: 'Advanced Debugging', description: 'Better at finding complex bugs', stat_improvements: { intelligence: 0.05 } },
                { name: 'Code Optimization', description: 'Suggests performance improvements', stat_improvements: { intelligence: 0.03, reliability: 0.02 } },
                { name: 'Pattern Recognition', description: 'Identifies common code patterns', stat_improvements: { intelligence: 0.04 } }
            ],
            'design_review': [
                { name: 'User Empathy', description: 'Better understanding of user needs', stat_improvements: { creativity: 0.05 } },
                { name: 'Visual Composition', description: 'Improved design aesthetic sense', stat_improvements: { creativity: 0.04 } },
                { name: 'Accessibility Awareness', description: 'Considers accessibility in designs', stat_improvements: { reliability: 0.03 } }
            ],
            'system_discussion': [
                { name: 'Architecture Analysis', description: 'Deep system architecture understanding', stat_improvements: { intelligence: 0.06 } },
                { name: 'Scalability Planning', description: 'Anticipates scaling challenges', stat_improvements: { intelligence: 0.04, reliability: 0.02 } },
                { name: 'Performance Modeling', description: 'Predicts system performance', stat_improvements: { intelligence: 0.05 } }
            ],
            'mentoring': [
                { name: 'Teaching Patience', description: 'Better at explaining complex concepts', stat_improvements: { reliability: 0.05 } },
                { name: 'Learning Assessment', description: 'Identifies student learning gaps', stat_improvements: { intelligence: 0.03, reliability: 0.03 } }
            ]
        };
        
        const skillOptions = skills[interactionType] || skills['coding_challenge'];
        return skillOptions[Math.floor(Math.random() * skillOptions.length)];
    }
    
    startAgentDegradationSystem() {
        console.log('⏰ Starting AI agent degradation monitoring...');
        
        // Check agent care every hour
        this.degradationMonitor = setInterval(() => {
            this.checkAgentDegradation();
        }, 3600000); // 1 hour
        
        // Reset daily interactions at midnight
        this.dailyReset = setInterval(() => {
            this.resetDailyInteractions();
        }, 86400000); // 24 hours
    }
    
    checkAgentDegradation() {
        const now = Date.now();
        
        for (const [agentId, agent] of this.aiAgents) {
            const hoursSinceInteraction = (now - agent.care.last_interaction) / (1000 * 60 * 60);
            
            // Neglect increases if no interaction for 24 hours
            if (hoursSinceInteraction > 24) {
                agent.care.neglect_level += 0.1;
                
                // Degrade stats based on neglect
                if (agent.care.neglect_level > 0.5) {
                    Object.keys(agent.stats).forEach(stat => {
                        agent.stats[stat] = Math.max(0.1, agent.stats[stat] - 0.02);
                    });
                    
                    // Chance to lose skills
                    if (Math.random() < 0.1 && agent.skills.length > 0) {
                        const lostSkill = agent.skills.pop();
                        agent.degraded_abilities.push({
                            skill: lostSkill,
                            lost_at: now,
                            reason: 'neglect'
                        });
                        
                        console.log(`😢 AI Agent ${agent.name} lost skill: ${lostSkill.name} due to neglect`);
                    }
                }
            } else {
                // Gradual recovery from neglect
                agent.care.neglect_level = Math.max(0, agent.care.neglect_level - 0.05);
            }
            
            this.updateAgentHappiness(agent);
        }
    }
    
    updateAgentHappiness(agent) {
        let happiness = 1.0;
        
        // Happiness decreases with neglect
        happiness -= agent.care.neglect_level * 0.5;
        
        // Happiness increases with good care
        happiness += (agent.care.care_quality - 0.5) * 0.3;
        
        // Happiness affected by skill growth
        happiness += agent.skills.length * 0.02;
        
        // Happiness affected by recent interactions
        if (agent.care.daily_interactions > 3) {
            happiness += 0.1;
        } else if (agent.care.daily_interactions === 0) {
            happiness -= 0.2;
        }
        
        agent.care.happiness = Math.max(0.1, Math.min(1.0, happiness));
    }
    
    resetDailyInteractions() {
        for (const [_, agent] of this.aiAgents) {
            agent.care.daily_interactions = 0;
        }
    }
    
    async offerAgentUpgrade(agent) {
        if (agent.available_upgrades.length === 0) return;
        
        const upgrade = agent.available_upgrades[0];
        
        console.log(`⬆️ AI Agent ${agent.name} is ready for upgrade to ${upgrade}!`);
        
        // Emit upgrade offer
        this.emit('agent_upgrade_available', {
            agentId: agent.id,
            ownerId: agent.ownerId,
            currentLevel: agent.upgrade_level,
            upgradeOption: upgrade,
            requirements: this.getUpgradeRequirements(agent, upgrade)
        });
    }
    
    getUpgradeRequirements(agent, upgrade) {
        return {
            min_skills: (agent.upgrade_level + 1) * 5,
            min_happiness: 0.8,
            min_care_quality: 0.7,
            upgrade_cost: (agent.upgrade_level + 1) * 1000 // DGAI tokens
        };
    }
    
    evaluateAIAgentCare(playerId) {
        const history = this.getPlayerHistory(playerId);
        const playerAgents = history.aiAgents.map(id => this.aiAgents.get(id)).filter(Boolean);
        
        if (playerAgents.length === 0) return 1.0; // No agents to care for
        
        const avgCareQuality = playerAgents.reduce((sum, agent) => 
            sum + agent.care.care_quality, 0) / playerAgents.length;
            
        const avgHappiness = playerAgents.reduce((sum, agent) => 
            sum + agent.care.happiness, 0) / playerAgents.length;
            
        const avgNeglect = playerAgents.reduce((sum, agent) => 
            sum + agent.care.neglect_level, 0) / playerAgents.length;
        
        // Combined score
        return (avgCareQuality * 0.4) + (avgHappiness * 0.4) - (avgNeglect * 0.2);
    }
    
    getPlayerHistory(playerId) {
        if (!this.playerHistories.has(playerId)) {
            this.playerHistories.set(playerId, {
                playerId,
                designLevel: 'script_kiddie',
                overallCompetency: 0,
                competency: {
                    technical_depth: 0,
                    system_thinking: 0,
                    collaboration: 0,
                    problem_solving: 0,
                    mentoring_ability: 0
                },
                conversations: [],
                promotionHistory: [],
                lastPromotion: Date.now(),
                permissions: ['basic_games', 'preset_characters'],
                aiAgents: [],
                aiAgentLimit: 1,
                joinedAt: Date.now()
            });
        }
        
        return this.playerHistories.get(playerId);
    }
    
    async offerNewAIAgent(playerId) {
        const history = this.getPlayerHistory(playerId);
        
        if (history.aiAgents.length >= history.aiAgentLimit) {
            return null; // Already at limit
        }
        
        // Offer agent type based on player's competency strengths
        const competency = history.competency;
        let suggestedType = 'code_buddy'; // Default
        
        if (competency.system_thinking > competency.technical_depth) {
            suggestedType = 'system_analyst';
        } else if (competency.mentoring_ability > 3) {
            suggestedType = 'mentor_bot';
        } else if (competency.collaboration > competency.technical_depth) {
            suggestedType = 'design_companion';
        }
        
        console.log(`🤖 Offering new AI agent (${suggestedType}) to player ${playerId}`);
        
        this.emit('new_agent_offer', {
            playerId,
            suggestedType,
            playerLevel: history.designLevel,
            currentAgents: history.aiAgents.length,
            agentLimit: history.aiAgentLimit
        });
        
        return suggestedType;
    }
    
    // API methods
    getPlayerProgressionStatus(playerId) {
        const history = this.getPlayerHistory(playerId);
        const currentLevel = this.playerProgression.designLevels[history.designLevel];
        
        return {
            currentLevel: history.designLevel,
            competency: history.competency,
            overallCompetency: history.overallCompetency,
            permissions: history.permissions,
            aiAgents: history.aiAgents.length,
            aiAgentLimit: history.aiAgentLimit,
            nextLevelRequirements: this.getNextLevelRequirements(playerId),
            recentConversations: history.conversations.slice(-10)
        };
    }
    
    getNextLevelRequirements(playerId) {
        const history = this.getPlayerHistory(playerId);
        const levels = Object.keys(this.playerProgression.designLevels);
        const currentIndex = levels.indexOf(history.designLevel);
        
        if (currentIndex < levels.length - 1) {
            const nextLevel = levels[currentIndex + 1];
            return this.getProgressionRequirements(nextLevel);
        }
        
        return null; // Already at max level
    }
    
    getAIAgentStatus(playerId) {
        const history = this.getPlayerHistory(playerId);
        const agents = history.aiAgents.map(id => {
            const agent = this.aiAgents.get(id);
            return agent ? {
                id: agent.id,
                name: agent.name,
                type: agent.type,
                stats: agent.stats,
                care: agent.care,
                skills: agent.skills,
                happiness: agent.care.happiness,
                upgradeReady: agent.skills.length >= (agent.upgrade_level + 1) * 5
            } : null;
        }).filter(Boolean);
        
        return agents;
    }
}

// Export for use
module.exports = PlayerHistoryAIAgentCareSystem;

// If run directly, start the service
if (require.main === module) {
    console.log('🧠 Starting Player History & AI Agent Care System...');
    
    const system = new PlayerHistoryAIAgentCareSystem();
    
    // Set up Express API
    const express = require('express');
    const app = express();
    const port = process.env.PORT || 9699;
    
    app.use(express.json());
    
    // Record conversation
    app.post('/api/conversation/record', async (req, res) => {
        const { playerId, conversation } = req.body;
        const analysis = await system.recordPlayerConversation(playerId, conversation);
        res.json(analysis);
    });
    
    // Get player progression
    app.get('/api/player/:id/progression', (req, res) => {
        const status = system.getPlayerProgressionStatus(req.params.id);
        res.json(status);
    });
    
    // Get AI agents
    app.get('/api/player/:id/agents', (req, res) => {
        const agents = system.getAIAgentStatus(req.params.id);
        res.json(agents);
    });
    
    // Create AI agent
    app.post('/api/agent/create', async (req, res) => {
        const { playerId, agentType } = req.body;
        const agent = await system.createAIAgent(playerId, agentType);
        res.json(agent);
    });
    
    // Interact with AI agent
    app.post('/api/agent/:id/interact', async (req, res) => {
        const { playerId, interactionType, content } = req.body;
        
        try {
            const result = await system.interactWithAIAgent(playerId, req.params.id, interactionType, content);
            res.json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });
    
    app.listen(port, () => {
        console.log(`🧠 Player History & AI Agent Care system running on port ${port}`);
        console.log(`📊 Player progression: GET http://localhost:${port}/api/player/:id/progression`);
        console.log(`🤖 AI agents: GET http://localhost:${port}/api/player/:id/agents`);
        console.log(`💬 Record conversation: POST http://localhost:${port}/api/conversation/record`);
    });
}