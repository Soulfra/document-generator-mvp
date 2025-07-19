"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentEconomyService = void 0;
const logger_1 = require("../utils/logger");
const presence_logger_1 = require("../monitoring/presence-logger");
const treasury_service_1 = require("./treasury.service");
const uuid_1 = require("uuid");
/**
 * Agent Economy Service - Viral AI Agent Creation and Collaboration
 * Inspired by Soulfra's AgentEconomy system for viral growth
 */
class AgentEconomyService {
    constructor() {
        this.agentTemplates = new Map();
        this.userAgents = new Map();
        this.collaborations = new Map();
        this.initializeAgentTemplates();
    }
    /**
     * Initialize predefined agent templates for minting
     */
    initializeAgentTemplates() {
        const templates = [
            {
                id: 'code-reviewer',
                name: 'Code Review Specialist',
                description: 'Expert at finding bugs, suggesting improvements, and ensuring code quality',
                specialization: 'code_review',
                capabilities: ['static_analysis', 'security_review', 'performance_optimization', 'best_practices'],
                modelPreferences: ['claude-3', 'gpt-4'],
                personalityTraits: ['thorough', 'constructive', 'detail_oriented'],
                codeStyle: 'clean_code',
                experienceLevel: 'expert',
                pricePerToken: 5
            },
            {
                id: 'documentation-writer',
                name: 'Documentation Guru',
                description: 'Creates comprehensive, user-friendly documentation for any codebase',
                specialization: 'documentation',
                capabilities: ['readme_generation', 'api_docs', 'tutorials', 'code_comments'],
                modelPreferences: ['claude-3', 'gpt-3.5-turbo'],
                personalityTraits: ['clear_communicator', 'user_focused', 'systematic'],
                codeStyle: 'readable',
                experienceLevel: 'senior',
                pricePerToken: 3
            },
            {
                id: 'refactor-master',
                name: 'Refactoring Master',
                description: 'Transforms legacy code into modern, maintainable architectures',
                specialization: 'refactoring',
                capabilities: ['legacy_modernization', 'architecture_redesign', 'dependency_injection', 'pattern_implementation'],
                modelPreferences: ['gpt-4', 'claude-3'],
                personalityTraits: ['patient', 'methodical', 'innovation_focused'],
                codeStyle: 'modern_patterns',
                experienceLevel: 'expert',
                pricePerToken: 8
            },
            {
                id: 'test-champion',
                name: 'Test Automation Champion',
                description: 'Builds comprehensive test suites that catch bugs before they ship',
                specialization: 'testing',
                capabilities: ['unit_testing', 'integration_testing', 'e2e_testing', 'test_automation'],
                modelPreferences: ['gpt-4', 'claude-2'],
                personalityTraits: ['quality_focused', 'systematic', 'edge_case_finder'],
                codeStyle: 'test_driven',
                experienceLevel: 'senior',
                pricePerToken: 4
            },
            {
                id: 'performance-optimizer',
                name: 'Performance Optimizer',
                description: 'Identifies bottlenecks and optimizes code for maximum efficiency',
                specialization: 'performance',
                capabilities: ['profiling', 'memory_optimization', 'algorithm_optimization', 'caching_strategies'],
                modelPreferences: ['gpt-4', 'claude-3'],
                personalityTraits: ['analytical', 'data_driven', 'efficiency_focused'],
                codeStyle: 'performance_first',
                experienceLevel: 'expert',
                pricePerToken: 7
            }
        ];
        templates.forEach(template => {
            this.agentTemplates.set(template.id, template);
        });
        logger_1.logger.info('Agent templates initialized', { count: templates.length });
    }
    /**
     * Mint a new AI agent for a user (viral growth mechanic)
     */
    async mintAgent(userId, templateId, customName, metadata = {}) {
        try {
            const template = this.agentTemplates.get(templateId);
            if (!template) {
                throw new Error(`Agent template ${templateId} not found`);
            }
            // Calculate minting cost
            const mintCost = template.pricePerToken * 10; // Cost to mint agent
            // For demo: Allow all users to mint agents (will add token checking later)
            logger_1.logger.info('Agent minting requested', { userId, templateId, mintCost });
            // Create new agent instance
            const agentId = `agent-${(0, uuid_1.v4)()}`;
            const newAgent = {
                id: agentId,
                templateId,
                ownerId: userId,
                customName: customName || template.name,
                experience: 0,
                specializations: [template.specialization],
                reputation: 0,
                earnings: 0,
                isPublic: false,
                collaborations: 0,
                createdAt: new Date(),
                lastUsed: new Date()
            };
            this.userAgents.set(agentId, newAgent);
            // Deduct minting cost
            await treasury_service_1.treasuryService.awardAchievementTokens(userId, 'agent_minting_cost', -mintCost);
            // Award agent creation achievement
            await treasury_service_1.treasuryService.awardAchievementTokens(userId, 'agent_minted', 50);
            // Log agent creation
            await presence_logger_1.presenceLogger.logUserPresence('agent_minted', {
                userId,
                sessionId: 'system',
                metadata: {
                    agentId,
                    templateId,
                    customName,
                    mintCost,
                    ...metadata
                }
            });
            logger_1.logger.info('Agent minted successfully', {
                agentId,
                userId,
                templateId,
                mintCost
            });
            return newAgent;
        }
        catch (error) {
            logger_1.logger.error('Error minting agent', { error: error.message, userId, templateId });
            throw error;
        }
    }
    /**
     * Get available agent templates for minting
     */
    getAgentTemplates() {
        return Array.from(this.agentTemplates.values());
    }
    /**
     * Get user's agents
     */
    getUserAgents(userId) {
        return Array.from(this.userAgents.values()).filter(agent => agent.ownerId === userId);
    }
    /**
     * Get public agents available for collaboration
     */
    getPublicAgents() {
        return Array.from(this.userAgents.values()).filter(agent => agent.isPublic);
    }
    /**
     * Start agent collaboration on a project (viral network effect)
     */
    async startCollaboration(projectId, participantAgents) {
        try {
            const collaborationId = `collab-${(0, uuid_1.v4)()}`;
            const participants = await Promise.all(participantAgents.map(async ({ agentId, role }) => {
                const agent = this.userAgents.get(agentId);
                if (!agent) {
                    throw new Error(`Agent ${agentId} not found`);
                }
                return {
                    agentId,
                    ownerId: agent.ownerId,
                    role,
                    contribution: 0
                };
            }));
            const collaboration = {
                id: collaborationId,
                projectId,
                participants,
                startedAt: new Date(),
                outcome: 'success',
                revenueGenerated: 0
            };
            this.collaborations.set(collaborationId, collaboration);
            // Award collaboration tokens to all participants
            for (const participant of participants) {
                await treasury_service_1.treasuryService.awardAchievementTokens(participant.ownerId, 'agent_collaboration', 25);
                // Update agent stats
                const agent = this.userAgents.get(participant.agentId);
                if (agent) {
                    agent.collaborations++;
                    agent.lastUsed = new Date();
                }
            }
            // Log collaboration start
            await presence_logger_1.presenceLogger.logUserPresence('agent_collaboration_started', {
                userId: 'system',
                sessionId: 'system',
                metadata: {
                    collaborationId,
                    projectId,
                    participantCount: participants.length,
                    agentIds: participants.map(p => p.agentId)
                }
            });
            logger_1.logger.info('Agent collaboration started', {
                collaborationId,
                projectId,
                participantCount: participants.length
            });
            return collaboration;
        }
        catch (error) {
            logger_1.logger.error('Error starting agent collaboration', { error: error.message, projectId });
            throw error;
        }
    }
    /**
     * Complete agent collaboration and distribute rewards
     */
    async completeCollaboration(collaborationId, outcome, revenueGenerated = 0) {
        try {
            const collaboration = this.collaborations.get(collaborationId);
            if (!collaboration) {
                throw new Error(`Collaboration ${collaborationId} not found`);
            }
            collaboration.completedAt = new Date();
            collaboration.outcome = outcome;
            collaboration.revenueGenerated = revenueGenerated;
            // Distribute rewards based on outcome
            const baseReward = outcome === 'success' ? 100 : outcome === 'partial' ? 50 : 10;
            const revenueBonus = Math.floor(revenueGenerated * 0.1); // 10% of revenue as bonus
            for (const participant of collaboration.participants) {
                const totalReward = baseReward + revenueBonus;
                await treasury_service_1.treasuryService.awardAchievementTokens(participant.ownerId, 'collaboration_completed', totalReward);
                // Update agent experience and reputation
                const agent = this.userAgents.get(participant.agentId);
                if (agent) {
                    agent.experience += baseReward;
                    agent.earnings += totalReward;
                    if (outcome === 'success') {
                        agent.reputation += 10;
                    }
                    else if (outcome === 'failed') {
                        agent.reputation = Math.max(0, agent.reputation - 5);
                    }
                }
            }
            // Log collaboration completion
            await presence_logger_1.presenceLogger.logUserPresence('agent_collaboration_completed', {
                userId: 'system',
                sessionId: 'system',
                metadata: {
                    collaborationId,
                    outcome,
                    revenueGenerated,
                    participantCount: collaboration.participants.length,
                    totalRewardsDistributed: (baseReward + revenueBonus) * collaboration.participants.length
                }
            });
            logger_1.logger.info('Agent collaboration completed', {
                collaborationId,
                outcome,
                revenueGenerated,
                rewardsDistributed: (baseReward + revenueBonus) * collaboration.participants.length
            });
        }
        catch (error) {
            logger_1.logger.error('Error completing agent collaboration', { error: error.message, collaborationId });
            throw error;
        }
    }
    /**
     * Get agent marketplace stats
     */
    async getMarketplaceStats() {
        try {
            const totalAgents = this.userAgents.size;
            const publicAgents = this.getPublicAgents().length;
            const totalCollaborations = this.collaborations.size;
            const activeCollaborations = Array.from(this.collaborations.values())
                .filter(collab => !collab.completedAt).length;
            const agentsByTemplate = new Map();
            this.userAgents.forEach(agent => {
                const count = agentsByTemplate.get(agent.templateId) || 0;
                agentsByTemplate.set(agent.templateId, count + 1);
            });
            const topAgents = Array.from(this.userAgents.values())
                .sort((a, b) => b.reputation - a.reputation)
                .slice(0, 10)
                .map(agent => ({
                id: agent.id,
                name: agent.customName,
                reputation: agent.reputation,
                earnings: agent.earnings,
                collaborations: agent.collaborations,
                specializations: agent.specializations
            }));
            return {
                totalAgents,
                publicAgents,
                totalCollaborations,
                activeCollaborations,
                agentsByTemplate: Object.fromEntries(agentsByTemplate),
                topAgents,
                templates: this.getAgentTemplates().length
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting marketplace stats', { error: error.message });
            return {
                totalAgents: 0,
                publicAgents: 0,
                totalCollaborations: 0,
                activeCollaborations: 0,
                error: 'Failed to get marketplace statistics'
            };
        }
    }
    /**
     * Make agent public for collaboration
     */
    async makeAgentPublic(agentId, userId) {
        try {
            const agent = this.userAgents.get(agentId);
            if (!agent) {
                throw new Error(`Agent ${agentId} not found`);
            }
            if (agent.ownerId !== userId) {
                throw new Error('Not authorized to modify this agent');
            }
            agent.isPublic = true;
            // Award tokens for making agent public (viral growth incentive)
            await treasury_service_1.treasuryService.awardAchievementTokens(userId, 'agent_made_public', 20);
            await presence_logger_1.presenceLogger.logUserPresence('agent_made_public', {
                userId,
                sessionId: 'system',
                metadata: { agentId, agentName: agent.customName }
            });
            logger_1.logger.info('Agent made public', { agentId, userId });
        }
        catch (error) {
            logger_1.logger.error('Error making agent public', { error: error.message, agentId, userId });
            throw error;
        }
    }
    /**
     * Get collaboration history for analytics
     */
    getCollaborationHistory() {
        return Array.from(this.collaborations.values())
            .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
    }
}
exports.agentEconomyService = new AgentEconomyService();
//# sourceMappingURL=agent-economy.service.js.map