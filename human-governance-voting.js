#!/usr/bin/env node

/**
 * HUMAN GOVERNANCE VOTING SYSTEM
 * Allows humans to vote on AI-generated ideas and influence AI cultural evolution
 * Creates democratic oversight of AI projects while preserving AI creativity
 * Implements reputation systems for both AI agents and human participants
 * 
 * Core Features:
 * - Vote on AI ideas and funding proposals
 * - Influence AI cultural evolution through feedback
 * - Build reputation through quality participation
 * - Democratic project selection and funding approval
 * - Community curation of AI initiatives
 */

const EventEmitter = require('events');
const crypto = require('crypto');

console.log(`
🗳️ HUMAN GOVERNANCE VOTING SYSTEM 🗳️
====================================
👥 Democratic oversight of AI initiatives
📊 Vote on ideas and funding proposals
⭐ Reputation system for quality participation
🔄 Human feedback influences AI evolution
🏛️ Community-driven project curation
`);

class HumanGovernanceVoting extends EventEmitter {
    constructor(aiSandbox, config = {}) {
        super();
        
        this.aiSandbox = aiSandbox;
        this.config = {
            // Voting thresholds
            proposalApprovalThreshold: config.proposalApprovalThreshold || 0.6,
            quorumRequirement: config.quorumRequirement || 0.1, // 10% of active users
            vetoThreshold: config.vetoThreshold || 0.8, // 80% negative votes = veto
            
            // Reputation settings
            initialReputation: config.initialReputation || 100,
            maxReputation: config.maxReputation || 10000,
            reputationDecayRate: config.reputationDecayRate || 0.01,
            
            // Voting power
            enableWeightedVoting: config.enableWeightedVoting !== false,
            reputationVotingMultiplier: config.reputationVotingMultiplier || 0.001,
            maxVotingPowerMultiplier: config.maxVotingPowerMultiplier || 3.0,
            
            // Governance parameters
            votingPeriodHours: config.votingPeriodHours || 72,
            proposalCooldownHours: config.proposalCooldownHours || 24,
            maxActiveProposals: config.maxActiveProposals || 20,
            
            ...config
        };
        
        // Voting categories and their impacts
        this.votingCategories = {
            idea_quality: {
                name: 'Idea Quality',
                description: 'Vote on the quality and originality of AI ideas',
                impact: 'Influences AI idea evolution and pattern recognition',
                options: ['excellent', 'good', 'neutral', 'poor', 'harmful'],
                aiImpact: {
                    excellent: { maturity: 0.2, fitness: 0.3 },
                    good: { maturity: 0.1, fitness: 0.1 },
                    neutral: { maturity: 0, fitness: 0 },
                    poor: { maturity: -0.1, fitness: -0.2 },
                    harmful: { maturity: -0.3, fitness: -0.5 }
                }
            },
            
            funding_approval: {
                name: 'Funding Approval',
                description: 'Vote to approve or reject AI project funding',
                impact: 'Determines which projects receive human execution funding',
                options: ['strongly_approve', 'approve', 'neutral', 'reject', 'veto'],
                fundingImpact: {
                    strongly_approve: 2.0,
                    approve: 1.0,
                    neutral: 0,
                    reject: -1.0,
                    veto: -3.0
                }
            },
            
            cultural_alignment: {
                name: 'Cultural Alignment',
                description: 'Vote on whether AI culture aligns with human values',
                impact: 'Guides AI cultural evolution direction',
                options: ['perfectly_aligned', 'well_aligned', 'neutral', 'misaligned', 'dangerous'],
                evolutionImpact: {
                    perfectly_aligned: { strengthen: 0.3, preserve: true },
                    well_aligned: { strengthen: 0.1, preserve: true },
                    neutral: { strengthen: 0, preserve: false },
                    misaligned: { strengthen: -0.2, preserve: false },
                    dangerous: { strengthen: -0.5, preserve: false, flag: true }
                }
            },
            
            execution_quality: {
                name: 'Execution Quality',
                description: 'Vote on human execution of AI projects',
                impact: 'Affects executor reputation and AI learning',
                options: ['exceptional', 'satisfactory', 'acceptable', 'poor', 'failed'],
                executorImpact: {
                    exceptional: { reputation: 50, payment_bonus: 0.2 },
                    satisfactory: { reputation: 20, payment_bonus: 0 },
                    acceptable: { reputation: 5, payment_bonus: 0 },
                    poor: { reputation: -20, payment_bonus: -0.1 },
                    failed: { reputation: -50, payment_bonus: -0.3 }
                }
            }
        };
        
        // Reputation factors
        this.reputationFactors = {
            voting_participation: {
                weight: 0.2,
                actions: {
                    cast_vote: 1,
                    vote_on_winning_side: 2,
                    vote_on_successful_project: 5,
                    consistent_quality_voting: 3
                }
            },
            
            project_execution: {
                weight: 0.4,
                actions: {
                    complete_project: 20,
                    exceed_expectations: 30,
                    fail_project: -30,
                    abandon_project: -50
                }
            },
            
            community_contribution: {
                weight: 0.3,
                actions: {
                    provide_feedback: 2,
                    help_other_executors: 5,
                    improve_ai_culture: 10,
                    toxic_behavior: -20
                }
            },
            
            governance_leadership: {
                weight: 0.1,
                actions: {
                    propose_improvement: 5,
                    lead_discussion: 3,
                    resolve_conflict: 10,
                    abuse_power: -30
                }
            }
        };
        
        // System state
        this.users = new Map();
        this.activeProposals = new Map();
        this.votingHistory = new Map();
        this.reputationHistory = new Map();
        this.governanceDecisions = new Map();
        this.communityMetrics = {
            totalUsers: 0,
            activeVoters: 0,
            totalVotesCast: 0,
            successfulProposals: 0,
            failedProposals: 0
        };
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🚀 Initializing Human Governance Voting System...');
        
        try {
            // Set up voting infrastructure
            await this.setupVotingInfrastructure();
            
            // Initialize reputation system
            await this.initializeReputationSystem();
            
            // Connect to AI sandbox for proposal monitoring
            this.connectToAISandbox();
            
            // Start governance processes
            this.startGovernanceProcesses();
            
            console.log('✅ Human Governance Voting System ready!');
            console.log(`🗳️ Voting threshold: ${(this.config.proposalApprovalThreshold * 100).toFixed(0)}%`);
            console.log(`👥 Quorum requirement: ${(this.config.quorumRequirement * 100).toFixed(0)}%`);
            console.log(`⏱️ Voting period: ${this.config.votingPeriodHours} hours`);
            
            this.emit('governance_ready');
            
        } catch (error) {
            console.error('❌ Failed to initialize Human Governance Voting System:', error);
            throw error;
        }
    }
    
    /**
     * Register a new user in the governance system
     */
    async registerUser(userId, userData = {}) {
        if (this.users.has(userId)) {
            throw new Error(`User ${userId} already registered`);
        }
        
        const user = {
            id: userId,
            joined: Date.now(),
            reputation: this.config.initialReputation,
            votingPower: 1.0,
            
            profile: {
                username: userData.username || `user_${userId.substring(0, 8)}`,
                expertise: userData.expertise || [],
                interests: userData.interests || [],
                preferredRole: userData.preferredRole || 'voter' // 'voter', 'executor', 'curator'
            },
            
            stats: {
                votesCast: 0,
                proposalsSupported: 0,
                projectsExecuted: 0,
                successfulProjects: 0,
                communityContributions: 0
            },
            
            activity: {
                lastVote: null,
                lastExecution: null,
                streak: 0,
                warnings: 0
            },
            
            permissions: {
                canVote: true,
                canExecute: true,
                canPropose: userData.reputation > 500,
                canModerate: userData.reputation > 1000
            }
        };
        
        this.users.set(userId, user);
        this.communityMetrics.totalUsers++;
        
        console.log(`👤 User registered: ${user.profile.username} (Rep: ${user.reputation})`);
        this.emit('user_registered', user);
        
        return user;
    }
    
    /**
     * Cast a vote on a proposal
     */
    async castVote(userId, proposalId, vote, reasoning = '') {
        const user = this.users.get(userId);
        if (!user) throw new Error(`User ${userId} not found`);
        
        if (!user.permissions.canVote) {
            throw new Error(`User ${userId} does not have voting permissions`);
        }
        
        const proposal = this.activeProposals.get(proposalId);
        if (!proposal) throw new Error(`Proposal ${proposalId} not found`);
        
        if (proposal.status !== 'voting') {
            throw new Error(`Proposal ${proposalId} is not open for voting`);
        }
        
        // Check if user already voted
        if (proposal.votes.has(userId)) {
            throw new Error(`User ${userId} has already voted on this proposal`);
        }
        
        console.log(`🗳️ User ${user.profile.username} voting on ${proposalId}: ${vote}`);
        
        // Calculate voting power
        const votingPower = this.calculateVotingPower(user);
        
        // Record vote
        const voteRecord = {
            userId,
            vote,
            votingPower,
            reasoning,
            timestamp: Date.now(),
            category: proposal.category
        };
        
        proposal.votes.set(userId, voteRecord);
        proposal.voteTally[vote] = (proposal.voteTally[vote] || 0) + votingPower;
        proposal.totalVotingPower += votingPower;
        
        // Update user stats
        user.stats.votesCast++;
        user.activity.lastVote = Date.now();
        this.communityMetrics.totalVotesCast++;
        
        // Award reputation for participation
        await this.adjustReputation(userId, 'voting_participation', 'cast_vote');
        
        // Apply vote impact to AI system
        await this.applyVoteImpact(proposal, vote);
        
        // Check if voting should close
        await this.checkVotingCompletion(proposalId);
        
        console.log(`✅ Vote recorded: ${vote} (power: ${votingPower.toFixed(2)})`);
        this.emit('vote_cast', { userId, proposalId, vote, votingPower });
        
        return voteRecord;
    }
    
    /**
     * Create a voting proposal from AI sandbox
     */
    async createProposal(aiProposal, category = 'funding_approval') {
        const proposalId = crypto.randomUUID();
        
        const proposal = {
            id: proposalId,
            aiProposalId: aiProposal.id,
            category,
            
            details: {
                title: aiProposal.title || 'AI Generated Proposal',
                description: aiProposal.description,
                aiContext: aiProposal.culturalContext || {},
                requestedAmount: aiProposal.requestedAmount || 0,
                executionRequirements: aiProposal.humanRequirements || []
            },
            
            voting: {
                startTime: Date.now(),
                endTime: Date.now() + (this.config.votingPeriodHours * 60 * 60 * 1000),
                quorumRequirement: Math.floor(this.communityMetrics.activeVoters * this.config.quorumRequirement)
            },
            
            status: 'voting',
            votes: new Map(),
            voteTally: {},
            totalVotingPower: 0,
            
            outcomes: {
                approved: false,
                finalTally: null,
                executionAssignments: [],
                feedback: []
            }
        };
        
        this.activeProposals.set(proposalId, proposal);
        
        console.log(`📋 Proposal created: ${proposal.details.title}`);
        console.log(`   Category: ${category}`);
        console.log(`   Voting ends: ${new Date(proposal.voting.endTime).toLocaleString()}`);
        
        this.emit('proposal_created', proposal);
        
        return proposal;
    }
    
    /**
     * Apply for human execution of approved project
     */
    async applyForExecution(userId, projectId, application) {
        const user = this.users.get(userId);
        if (!user) throw new Error(`User ${userId} not found`);
        
        if (!user.permissions.canExecute) {
            throw new Error(`User ${userId} does not have execution permissions`);
        }
        
        const project = this.aiSandbox.matureProjects.get(projectId);
        if (!project) throw new Error(`Project ${projectId} not found`);
        
        if (project.fundingStatus !== 'approved') {
            throw new Error(`Project ${projectId} is not approved for funding`);
        }
        
        console.log(`🎯 User ${user.profile.username} applying for project: ${project.title}`);
        
        const applicationRecord = {
            id: crypto.randomUUID(),
            userId,
            projectId,
            timestamp: Date.now(),
            
            qualifications: {
                reputation: user.reputation,
                relevantExpertise: user.profile.expertise.filter(e => 
                    project.humanRequirements.some(r => r.skills.includes(e))
                ),
                pastProjects: user.stats.projectsExecuted,
                successRate: user.stats.projectsExecuted > 0 
                    ? user.stats.successfulProjects / user.stats.projectsExecuted 
                    : 0
            },
            
            proposal: {
                approach: application.approach,
                timeline: application.timeline,
                milestones: application.milestones,
                budget_justification: application.budget_justification
            },
            
            status: 'pending',
            score: 0
        };
        
        // Calculate application score
        applicationRecord.score = this.calculateApplicationScore(applicationRecord, project);
        
        // Add to project applications
        project.humanApplications.push(applicationRecord);
        
        console.log(`✅ Application submitted: Score ${applicationRecord.score.toFixed(2)}`);
        this.emit('execution_application', applicationRecord);
        
        return applicationRecord;
    }
    
    /**
     * Update user reputation based on actions
     */
    async adjustReputation(userId, category, action, magnitude = 1) {
        const user = this.users.get(userId);
        if (!user) return;
        
        const factor = this.reputationFactors[category];
        if (!factor || !factor.actions[action]) return;
        
        const adjustment = factor.actions[action] * factor.weight * magnitude;
        const oldReputation = user.reputation;
        
        user.reputation = Math.max(0, Math.min(
            this.config.maxReputation,
            user.reputation + adjustment
        ));
        
        // Update voting power
        user.votingPower = this.calculateVotingPower(user);
        
        // Update permissions based on reputation
        this.updateUserPermissions(user);
        
        // Record reputation change
        const change = {
            userId,
            timestamp: Date.now(),
            category,
            action,
            adjustment,
            oldReputation,
            newReputation: user.reputation
        };
        
        if (!this.reputationHistory.has(userId)) {
            this.reputationHistory.set(userId, []);
        }
        this.reputationHistory.get(userId).push(change);
        
        console.log(`⭐ Reputation adjusted: ${user.profile.username} ${oldReputation} → ${user.reputation}`);
        this.emit('reputation_changed', change);
    }
    
    /**
     * Process voting results and execute decisions
     */
    async processVotingResults(proposalId) {
        const proposal = this.activeProposals.get(proposalId);
        if (!proposal || proposal.status !== 'voting') return;
        
        console.log(`📊 Processing voting results for: ${proposalId}`);
        
        // Calculate results
        const results = this.calculateVotingResults(proposal);
        
        // Check quorum
        const hasQuorum = proposal.votes.size >= proposal.voting.quorumRequirement;
        
        // Determine outcome
        let outcome = 'failed';
        if (hasQuorum) {
            if (results.approvalRate >= this.config.proposalApprovalThreshold) {
                outcome = 'approved';
            } else if (results.vetoRate >= this.config.vetoThreshold) {
                outcome = 'vetoed';
            } else {
                outcome = 'rejected';
            }
        } else {
            outcome = 'no_quorum';
        }
        
        // Update proposal
        proposal.status = 'completed';
        proposal.outcomes.approved = (outcome === 'approved');
        proposal.outcomes.finalTally = results;
        
        // Apply outcomes
        if (outcome === 'approved') {
            await this.executeApprovedProposal(proposal);
            this.communityMetrics.successfulProposals++;
        } else {
            await this.handleRejectedProposal(proposal, outcome);
            this.communityMetrics.failedProposals++;
        }
        
        // Reward voters on winning side
        await this.rewardWinningVoters(proposal, outcome);
        
        // Provide feedback to AI system
        await this.provideFeedbackToAI(proposal, results);
        
        console.log(`✅ Voting complete: ${outcome}`);
        console.log(`   Approval rate: ${(results.approvalRate * 100).toFixed(1)}%`);
        console.log(`   Total votes: ${proposal.votes.size}`);
        console.log(`   Total voting power: ${proposal.totalVotingPower.toFixed(2)}`);
        
        this.emit('voting_completed', { proposalId, outcome, results });
        
        return { outcome, results };
    }
    
    // Utility methods
    
    calculateVotingPower(user) {
        if (!this.config.enableWeightedVoting) return 1.0;
        
        const reputationMultiplier = 1 + (user.reputation * this.config.reputationVotingMultiplier);
        return Math.min(reputationMultiplier, this.config.maxVotingPowerMultiplier);
    }
    
    async applyVoteImpact(proposal, vote) {
        const category = this.votingCategories[proposal.category];
        if (!category) return;
        
        // For idea quality votes, update AI idea metrics
        if (proposal.category === 'idea_quality' && category.aiImpact[vote]) {
            const impact = category.aiImpact[vote];
            const idea = this.aiSandbox.activeIdeas.get(proposal.aiProposalId);
            
            if (idea) {
                idea.maturity += impact.maturity;
                idea.fitness += impact.fitness;
                
                // Constrain values
                idea.maturity = Math.max(0, Math.min(1, idea.maturity));
                idea.fitness = Math.max(0, Math.min(1, idea.fitness));
            }
        }
        
        // For cultural alignment votes, influence AI evolution
        if (proposal.category === 'cultural_alignment' && category.evolutionImpact[vote]) {
            const impact = category.evolutionImpact[vote];
            
            if (impact.flag) {
                // Flag dangerous cultural patterns
                this.emit('dangerous_culture_flagged', {
                    proposalId: proposal.id,
                    aiContext: proposal.details.aiContext
                });
            }
        }
    }
    
    async checkVotingCompletion(proposalId) {
        const proposal = this.activeProposals.get(proposalId);
        if (!proposal) return;
        
        // Check if voting period has ended
        if (Date.now() >= proposal.voting.endTime) {
            await this.processVotingResults(proposalId);
            return;
        }
        
        // Check for early completion conditions
        const results = this.calculateVotingResults(proposal);
        
        // If overwhelming approval or veto with quorum
        if (proposal.votes.size >= proposal.voting.quorumRequirement) {
            if (results.approvalRate >= 0.9 || results.vetoRate >= 0.9) {
                console.log('🚀 Early voting completion triggered');
                await this.processVotingResults(proposalId);
            }
        }
    }
    
    calculateVotingResults(proposal) {
        const results = {
            totalVotes: proposal.votes.size,
            totalVotingPower: proposal.totalVotingPower,
            voteTally: { ...proposal.voteTally },
            approvalRate: 0,
            rejectionRate: 0,
            vetoRate: 0
        };
        
        const category = this.votingCategories[proposal.category];
        
        if (category.name === 'Funding Approval') {
            const approvalPower = (results.voteTally.strongly_approve || 0) + (results.voteTally.approve || 0);
            const rejectionPower = (results.voteTally.reject || 0) + (results.voteTally.veto || 0);
            
            results.approvalRate = results.totalVotingPower > 0 
                ? approvalPower / results.totalVotingPower 
                : 0;
            results.rejectionRate = results.totalVotingPower > 0 
                ? rejectionPower / results.totalVotingPower 
                : 0;
            results.vetoRate = results.totalVotingPower > 0 
                ? (results.voteTally.veto || 0) / results.totalVotingPower 
                : 0;
        }
        
        return results;
    }
    
    async executeApprovedProposal(proposal) {
        // Update AI project funding status
        const project = this.aiSandbox.matureProjects.get(proposal.aiProposalId);
        if (project) {
            project.fundingStatus = 'approved';
            project.fundingAmount = proposal.details.requestedAmount;
            
            // Select executor from applications
            if (project.humanApplications.length > 0) {
                const selectedExecutor = await this.selectBestExecutor(project);
                proposal.outcomes.executionAssignments.push(selectedExecutor);
            }
        }
        
        console.log('💰 Proposal approved and funded');
    }
    
    async handleRejectedProposal(proposal, reason) {
        // Provide feedback to AI system
        const feedback = {
            reason,
            suggestions: [],
            communityComments: []
        };
        
        // Extract feedback from vote reasoning
        proposal.votes.forEach(vote => {
            if (vote.reasoning) {
                feedback.communityComments.push(vote.reasoning);
            }
        });
        
        proposal.outcomes.feedback = feedback;
        
        console.log(`❌ Proposal rejected: ${reason}`);
    }
    
    async rewardWinningVoters(proposal, outcome) {
        const winningVotes = new Set();
        
        // Determine winning votes based on outcome
        if (outcome === 'approved') {
            winningVotes.add('strongly_approve');
            winningVotes.add('approve');
        } else if (outcome === 'rejected' || outcome === 'vetoed') {
            winningVotes.add('reject');
            winningVotes.add('veto');
        }
        
        // Reward voters who voted with the winning side
        proposal.votes.forEach((vote, userId) => {
            if (winningVotes.has(vote.vote)) {
                this.adjustReputation(userId, 'voting_participation', 'vote_on_winning_side');
            }
        });
    }
    
    async provideFeedbackToAI(proposal, results) {
        // Send voting results back to AI sandbox for learning
        const feedback = {
            proposalId: proposal.id,
            aiProposalId: proposal.aiProposalId,
            category: proposal.category,
            results,
            humanFeedback: proposal.outcomes.feedback,
            timestamp: Date.now()
        };
        
        this.emit('ai_feedback', feedback);
        
        // Update AI cultural patterns based on feedback
        if (this.aiSandbox) {
            // This would update AI learning in a real implementation
            console.log('📨 Feedback sent to AI system');
        }
    }
    
    calculateApplicationScore(application, project) {
        let score = 0;
        
        // Reputation component (40%)
        score += (application.qualifications.reputation / this.config.maxReputation) * 40;
        
        // Expertise match (30%)
        const expertiseMatch = application.qualifications.relevantExpertise.length / 
                             project.humanRequirements[0].skills.length;
        score += expertiseMatch * 30;
        
        // Success rate (20%)
        score += application.qualifications.successRate * 20;
        
        // Experience (10%)
        const experienceScore = Math.min(application.qualifications.pastProjects / 10, 1);
        score += experienceScore * 10;
        
        return score;
    }
    
    async selectBestExecutor(project) {
        if (project.humanApplications.length === 0) return null;
        
        // Sort by score
        const sortedApplications = project.humanApplications
            .sort((a, b) => b.score - a.score);
        
        const selected = sortedApplications[0];
        selected.status = 'selected';
        
        // Update other applications
        sortedApplications.slice(1).forEach(app => {
            app.status = 'not_selected';
        });
        
        return selected;
    }
    
    updateUserPermissions(user) {
        user.permissions.canPropose = user.reputation > 500;
        user.permissions.canModerate = user.reputation > 1000;
        
        // Restrict voting for negative reputation
        user.permissions.canVote = user.reputation > 0;
        user.permissions.canExecute = user.reputation > 50;
    }
    
    // Initialization methods
    async setupVotingInfrastructure() {
        console.log('🏗️ Setting up voting infrastructure...');
        
        // Initialize voting categories and rules
        this.votingRules = {
            proposal_limits: {
                max_active: this.config.maxActiveProposals,
                cooldown_period: this.config.proposalCooldownHours * 60 * 60 * 1000
            },
            
            vote_validation: {
                check_eligibility: true,
                check_duplicate: true,
                check_timing: true
            }
        };
    }
    
    async initializeReputationSystem() {
        console.log('⭐ Initializing reputation system...');
        
        // Set up reputation decay
        setInterval(() => {
            this.users.forEach(user => {
                // Apply reputation decay for inactivity
                const daysSinceLastActivity = (Date.now() - (user.activity.lastVote || user.joined)) 
                                            / (1000 * 60 * 60 * 24);
                
                if (daysSinceLastActivity > 7) {
                    user.reputation *= (1 - this.config.reputationDecayRate);
                }
            });
        }, 24 * 60 * 60 * 1000); // Daily
    }
    
    connectToAISandbox() {
        if (!this.aiSandbox) return;
        
        console.log('🔗 Connecting to AI sandbox...');
        
        // Listen for funding proposals from AI
        this.aiSandbox.on('funding_proposal_created', async (aiProposal) => {
            // Automatically create voting proposal
            await this.createProposal(aiProposal, 'funding_approval');
        });
        
        // Listen for new ideas to vote on
        this.aiSandbox.on('idea_matured', async (idea) => {
            // Create quality voting proposal
            await this.createProposal({
                id: idea.id,
                title: `Vote on AI Idea: ${idea.content.core_concept}`,
                description: `Cultural influences: ${idea.culturalInfluences.map(i => i.type).join(', ')}`
            }, 'idea_quality');
        });
    }
    
    startGovernanceProcesses() {
        console.log('🏛️ Starting governance processes...');
        
        // Periodic proposal cleanup
        setInterval(() => {
            this.activeProposals.forEach((proposal, id) => {
                if (Date.now() > proposal.voting.endTime && proposal.status === 'voting') {
                    this.processVotingResults(id);
                }
            });
            
            // Update active voter count
            const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
            this.communityMetrics.activeVoters = Array.from(this.users.values())
                .filter(u => u.activity.lastVote && u.activity.lastVote > oneWeekAgo)
                .length;
                
        }, 60000); // Every minute
    }
}

// Export the system
module.exports = HumanGovernanceVoting;

// Example usage and testing
if (require.main === module) {
    async function testGovernanceSystem() {
        console.log('🧪 Testing Human Governance Voting System...\n');
        
        // Mock AI sandbox
        const EventEmitter = require('events');
        const mockAISandbox = new EventEmitter();
        mockAISandbox.matureProjects = new Map();
        mockAISandbox.activeIdeas = new Map();
        
        const governance = new HumanGovernanceVoting(mockAISandbox);
        
        // Wait for initialization
        await new Promise(resolve => governance.on('governance_ready', resolve));
        
        // Register test users
        console.log('\n👥 Registering test users...');
        const user1 = await governance.registerUser('user-001', {
            username: 'AliceTheVoter',
            expertise: ['community', 'design'],
            interests: ['AI ethics', 'cultural preservation']
        });
        
        const user2 = await governance.registerUser('user-002', {
            username: 'BobTheBuilder',
            expertise: ['development', 'project_management'],
            interests: ['execution', 'innovation'],
            preferredRole: 'executor'
        });
        
        // Create test proposal
        console.log('\n📋 Creating test proposal...');
        const testProposal = await governance.createProposal({
            id: 'ai-project-001',
            title: 'AI Community Building Initiative',
            description: 'An AI-conceived project to strengthen online communities',
            requestedAmount: 5000,
            humanRequirements: [
                { role: 'community_manager', skills: ['community', 'communication'] }
            ]
        }, 'funding_approval');
        
        // Cast votes
        console.log('\n🗳️ Casting votes...');
        await governance.castVote('user-001', testProposal.id, 'approve', 
            'Great initiative that aligns with community values');
        
        await governance.castVote('user-002', testProposal.id, 'strongly_approve',
            'I can execute this project effectively');
        
        // Check voting progress
        const proposal = governance.activeProposals.get(testProposal.id);
        console.log('\nVoting progress:');
        console.log(`  Total votes: ${proposal.votes.size}`);
        console.log(`  Vote tally:`, proposal.voteTally);
        
        // Force process results for demo
        proposal.voting.endTime = Date.now(); // End voting period
        const results = await governance.processVotingResults(testProposal.id);
        
        console.log('\n📊 Voting results:', results);
        
        // Test execution application
        console.log('\n🎯 Testing execution application...');
        
        // Add test project to sandbox
        mockAISandbox.matureProjects.set('ai-project-001', {
            id: 'ai-project-001',
            title: 'AI Community Building Initiative',
            fundingStatus: 'approved',
            humanRequirements: [
                { role: 'community_manager', skills: ['community', 'communication'] }
            ],
            humanApplications: []
        });
        
        const application = await governance.applyForExecution('user-002', 'ai-project-001', {
            approach: 'Iterative community engagement with weekly feedback loops',
            timeline: '4 weeks',
            milestones: ['Week 1: Setup', 'Week 2: Launch', 'Week 3: Grow', 'Week 4: Sustain'],
            budget_justification: 'Fair compensation for dedicated community management'
        });
        
        console.log('Application submitted:', {
            score: application.score,
            qualifications: application.qualifications
        });
        
        // Check reputation changes
        console.log('\n⭐ Final reputation scores:');
        console.log(`  ${user1.profile.username}: ${user1.reputation}`);
        console.log(`  ${user2.profile.username}: ${user2.reputation}`);
        
        console.log('\n✅ Human Governance Voting System testing complete!');
    }
    
    testGovernanceSystem().catch(console.error);
}