#!/usr/bin/env node

/**
 * Open Weight Judging System
 * 
 * Transparent performance judging with community-votable algorithms
 * Like "open weights" in AI models - all scoring logic is visible and adjustable
 * Enables writing quality to unlock game features, gaming to boost creative credits, etc.
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const crypto = require('crypto');

class OpenWeightJudgingSystem extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            enableCommunityVoting: config.enableCommunityVoting !== false,
            weightChangeThreshold: config.weightChangeThreshold || 0.1,
            votingPower: config.votingPower || 'contribution_based', // equal, contribution_based, stake_weighted
            algorithmUpdateFrequency: config.algorithmUpdateFrequency || 24 * 60 * 60 * 1000, // 24 hours
            transparencyLevel: config.transparencyLevel || 'full'
        };
        
        // Open-weight algorithms with community voting
        this.judgingAlgorithms = new Map();
        this.communityVotes = new Map(); // algorithmId -> votes
        this.votingHistory = []; // Track all voting changes
        this.algorithmVersions = new Map(); // Track algorithm evolution
        
        // Performance categories and their interconnections
        this.performanceCategories = {
            creative_writing: {
                weights: {
                    originality: 0.25,
                    coherence: 0.20,
                    engagement: 0.20,
                    technical_skill: 0.15,
                    impact: 0.10,
                    collaboration: 0.10
                },
                boosts_to: ['gaming_features', 'creative_credits', 'community_status'],
                receives_boosts_from: ['gaming_achievements', 'cybersecurity_contributions']
            },
            
            gaming_performance: {
                weights: {
                    strategy: 0.30,
                    efficiency: 0.25,
                    innovation: 0.20,
                    persistence: 0.15,
                    teaching_others: 0.10
                },
                boosts_to: ['creative_credits', 'advanced_tools', 'exclusive_access'],
                receives_boosts_from: ['creative_quality', 'security_expertise']
            },
            
            cybersecurity_contribution: {
                weights: {
                    vulnerability_discovery: 0.35,
                    threat_analysis: 0.25,
                    community_protection: 0.20,
                    knowledge_sharing: 0.10,
                    system_improvement: 0.10
                },
                boosts_to: ['all_categories'], // Security contributions boost everything
                receives_boosts_from: ['analytical_thinking', 'collaborative_skills']
            },
            
            tool_effectiveness: {
                weights: {
                    user_satisfaction: 0.30,
                    performance_metrics: 0.25,
                    reliability: 0.20,
                    innovation: 0.15,
                    ecosystem_integration: 0.10
                },
                boosts_to: ['developer_rewards', 'feature_priority'],
                receives_boosts_from: ['user_feedback', 'community_adoption']
            },
            
            collaborative_contribution: {
                weights: {
                    helping_others: 0.30,
                    knowledge_sharing: 0.25,
                    community_building: 0.20,
                    mentorship: 0.15,
                    positive_impact: 0.10
                },
                boosts_to: ['all_categories'], // Collaboration boosts everything
                receives_boosts_from: ['consistent_participation', 'quality_contributions']
            }
        };
        
        // Cross-platform boosting rules
        this.crossPlatformBoosts = {
            'writing_quality_unlocks_gaming': {
                source: 'creative_writing',
                target: 'gaming_features',
                threshold: 7.0,
                boost_multiplier: 1.5,
                description: 'High-quality writing unlocks advanced gaming features'
            },
            
            'gaming_mastery_boosts_creative': {
                source: 'gaming_performance', 
                target: 'creative_credits',
                threshold: 8.0,
                boost_multiplier: 1.3,
                description: 'Gaming mastery provides bonus creative writing credits'
            },
            
            'security_contributions_boost_all': {
                source: 'cybersecurity_contribution',
                target: 'all_platforms',
                threshold: 6.0,
                boost_multiplier: 1.2,
                description: 'Security contributions boost all platform activities'
            },
            
            'collaboration_amplifies_everything': {
                source: 'collaborative_contribution',
                target: 'all_categories',
                threshold: 5.0,
                boost_multiplier: 1.1,
                description: 'Collaborative behavior amplifies all other contributions'
            }
        };
        
        // No-winner ecosystem principles
        this.ecosystemPrinciples = {
            no_absolute_winners: true,
            everyone_gets_something: true,
            contribution_over_competition: true,
            continuous_improvement_focus: true,
            community_benefit_priority: true
        };
        
        console.log('⚖️ Open Weight Judging System initialized');
        console.log('🗳️ Community voting enabled for all algorithm weights');
    }
    
    /**
     * Initialize all judging algorithms with transparent weights
     */
    async initializeJudgingAlgorithms() {
        console.log('🔍 Initializing transparent judging algorithms...');
        
        for (const [categoryName, categoryData] of Object.entries(this.performanceCategories)) {
            const algorithmId = `judge_${categoryName}`;
            
            const algorithm = {
                id: algorithmId,
                name: categoryName.replace(/_/g, ' ').toUpperCase(),
                category: categoryName,
                weights: { ...categoryData.weights }, // Copy to allow modification
                version: '1.0.0',
                lastUpdated: new Date(),
                totalVotes: 0,
                communityApprovalRating: 1.0,
                changeHistory: [],
                boostConnections: {
                    provides_boosts_to: categoryData.boosts_to,
                    receives_boosts_from: categoryData.receives_boosts_from
                }
            };
            
            this.judgingAlgorithms.set(algorithmId, algorithm);
            this.communityVotes.set(algorithmId, new Map()); // voterID -> vote
            
            console.log(`✅ Initialized ${algorithm.name} judging algorithm`);
        }
        
        // Initialize cross-platform boost algorithms
        await this.initializeCrossPlatformBoosts();
        
        console.log(`🎯 Total algorithms: ${this.judgingAlgorithms.size}`);
    }
    
    /**
     * Initialize cross-platform boosting algorithms
     */
    async initializeCrossPlatformBoosts() {
        for (const [boostName, boostData] of Object.entries(this.crossPlatformBoosts)) {
            const algorithmId = `boost_${boostName}`;
            
            const boostAlgorithm = {
                id: algorithmId,
                name: boostName.replace(/_/g, ' ').toUpperCase(),
                type: 'cross_platform_boost',
                source: boostData.source,
                target: boostData.target,
                threshold: boostData.threshold,
                multiplier: boostData.boost_multiplier,
                description: boostData.description,
                version: '1.0.0',
                totalVotes: 0,
                communityApprovalRating: 1.0,
                activations: 0 // Track how often this boost is triggered
            };
            
            this.judgingAlgorithms.set(algorithmId, boostAlgorithm);
            this.communityVotes.set(algorithmId, new Map());
        }
    }
    
    /**
     * Judge performance with full transparency
     */
    async judgePerformance(entityId, category, performanceData, options = {}) {
        console.log(`⚖️ Judging ${category} performance for ${entityId}`);
        
        const algorithm = this.judgingAlgorithms.get(`judge_${category}`);
        if (!algorithm) {
            throw new Error(`No judging algorithm found for category: ${category}`);
        }
        
        // Calculate base score using transparent weights
        const scores = {};
        let weightedTotal = 0;
        let totalWeight = 0;
        
        for (const [criterion, weight] of Object.entries(algorithm.weights)) {
            const criterionScore = this.scoreCriterion(criterion, performanceData, category);
            scores[criterion] = criterionScore;
            
            weightedTotal += criterionScore * weight;
            totalWeight += weight;
        }
        
        const baseScore = weightedTotal / totalWeight;
        
        // Apply cross-platform boosts
        const boosts = await this.calculateCrossPlatformBoosts(entityId, category, baseScore);
        const boostedScore = this.applyBoosts(baseScore, boosts);
        
        // Calculate rewards based on no-winner principles
        const rewards = this.calculateNoWinnerRewards(boostedScore, category);
        
        // Store judgment with full transparency
        const judgment = {
            entityId,
            category,
            timestamp: new Date(),
            algorithm: {
                id: algorithm.id,
                version: algorithm.version,
                weights: algorithm.weights // Fully visible weights
            },
            scores: {
                breakdown: scores,
                base: baseScore,
                boosted: boostedScore,
                final: boostedScore
            },
            boosts,
            rewards,
            transparency: {
                all_weights_visible: true,
                calculation_method: 'weighted_average',
                boost_logic: 'cross_platform_contribution',
                reward_principle: 'no_absolute_winners'
            },
            improvements: this.suggestImprovements(scores, algorithm.weights)
        };
        
        // Check if this performance unlocks cross-platform boosts for others
        await this.checkForUnlockedBoosts(entityId, category, boostedScore);
        
        this.emit('performance:judged', judgment);
        
        return judgment;
    }
    
    /**
     * Score individual criterion with transparent logic
     */
    scoreCriterion(criterion, performanceData, category) {
        // This would integrate with actual performance data
        // For now, simulating based on criterion type and available data
        
        const criterionScorers = {
            // Creative writing criteria
            originality: () => this.scoreOriginality(performanceData),
            coherence: () => this.scoreCoherence(performanceData),
            engagement: () => this.scoreEngagement(performanceData),
            technical_skill: () => this.scoreTechnicalSkill(performanceData),
            impact: () => this.scoreImpact(performanceData),
            
            // Gaming criteria
            strategy: () => this.scoreStrategy(performanceData),
            efficiency: () => this.scoreEfficiency(performanceData),
            innovation: () => this.scoreInnovation(performanceData),
            persistence: () => this.scorePersistence(performanceData),
            teaching_others: () => this.scoreTeaching(performanceData),
            
            // Security criteria
            vulnerability_discovery: () => this.scoreVulnerabilityDiscovery(performanceData),
            threat_analysis: () => this.scoreThreatAnalysis(performanceData),
            community_protection: () => this.scoreCommunityProtection(performanceData),
            knowledge_sharing: () => this.scoreKnowledgeSharing(performanceData),
            system_improvement: () => this.scoreSystemImprovement(performanceData),
            
            // Tool criteria
            user_satisfaction: () => this.scoreUserSatisfaction(performanceData),
            performance_metrics: () => this.scorePerformanceMetrics(performanceData),
            reliability: () => this.scoreReliability(performanceData),
            ecosystem_integration: () => this.scoreEcosystemIntegration(performanceData),
            
            // Collaboration criteria
            helping_others: () => this.scoreHelpingOthers(performanceData),
            community_building: () => this.scoreCommunityBuilding(performanceData),
            mentorship: () => this.scoreMentorship(performanceData),
            positive_impact: () => this.scorePositiveImpact(performanceData)
        };
        
        const scorer = criterionScorers[criterion];
        if (scorer) {
            return scorer();
        }
        
        // Fallback scoring based on available data
        return this.fallbackScoring(criterion, performanceData);
    }
    
    /**
     * Calculate cross-platform boosts
     */
    async calculateCrossPlatformBoosts(entityId, sourceCategory, sourceScore) {
        const boosts = [];
        
        for (const [boostId, boostAlgorithm] of this.judgingAlgorithms) {
            if (boostAlgorithm.type === 'cross_platform_boost' && 
                boostAlgorithm.source === sourceCategory &&
                sourceScore >= boostAlgorithm.threshold) {
                
                boosts.push({
                    id: boostId,
                    name: boostAlgorithm.name,
                    multiplier: boostAlgorithm.multiplier,
                    target: boostAlgorithm.target,
                    description: boostAlgorithm.description,
                    triggered_by_score: sourceScore
                });
                
                // Track boost activation
                boostAlgorithm.activations++;
                
                console.log(`🚀 Boost triggered: ${boostAlgorithm.description}`);
            }
        }
        
        return boosts;
    }
    
    /**
     * Apply boosts to base score
     */
    applyBoosts(baseScore, boosts) {
        let boostedScore = baseScore;
        
        for (const boost of boosts) {
            if (boost.target === 'all_platforms' || boost.target === 'all_categories') {
                boostedScore *= boost.multiplier;
            }
        }
        
        // Ensure score stays within reasonable bounds
        return Math.min(10, boostedScore);
    }
    
    /**
     * Calculate rewards based on no-winner principles
     */
    calculateNoWinnerRewards(score, category) {
        const baseReward = 10; // Everyone gets something
        const performanceMultiplier = (score / 10) * 2; // 0-2x multiplier
        const categoryMultiplier = this.getCategoryMultiplier(category);
        
        const reward = Math.max(baseReward, baseReward * performanceMultiplier * categoryMultiplier);
        
        return {
            credits: Math.round(reward),
            principle: 'no_absolute_winners',
            calculation: {
                base: baseReward,
                performance_multiplier: performanceMultiplier,
                category_multiplier: categoryMultiplier,
                total: reward
            },
            description: 'Everyone contributes, everyone benefits'
        };
    }
    
    /**
     * Community voting on algorithm weights
     */
    async submitWeightVote(voterId, algorithmId, proposedWeights, reasoning) {
        console.log(`🗳️ Processing weight vote from ${voterId} for ${algorithmId}`);
        
        const algorithm = this.judgingAlgorithms.get(algorithmId);
        if (!algorithm) {
            throw new Error(`Algorithm ${algorithmId} not found`);
        }
        
        // Validate proposed weights
        if (!this.validateWeights(proposedWeights)) {
            throw new Error('Invalid weights: must sum to 1.0');
        }
        
        // Store the vote
        const vote = {
            voter_id: voterId,
            algorithm_id: algorithmId,
            proposed_weights: proposedWeights,
            reasoning,
            timestamp: new Date(),
            voting_power: await this.calculateVotingPower(voterId)
        };
        
        this.communityVotes.get(algorithmId).set(voterId, vote);
        this.votingHistory.push(vote);
        
        // Check if we should update the algorithm
        await this.evaluateWeightUpdate(algorithmId);
        
        this.emit('vote:submitted', vote);
        
        return {
            vote_accepted: true,
            current_weights: algorithm.weights,
            total_votes: this.communityVotes.get(algorithmId).size,
            next_evaluation: this.getNextEvaluationTime(algorithmId)
        };
    }
    
    /**
     * Evaluate whether to update algorithm weights based on community votes
     */
    async evaluateWeightUpdate(algorithmId) {
        const algorithm = this.judgingAlgorithms.get(algorithmId);
        const votes = this.communityVotes.get(algorithmId);
        
        if (votes.size < 5) return; // Need minimum votes
        
        // Calculate weighted average of proposed changes
        const proposedWeights = this.calculateCommunityConsensus(votes);
        const changeSignificance = this.calculateWeightChange(algorithm.weights, proposedWeights);
        
        if (changeSignificance >= this.config.weightChangeThreshold) {
            // Update algorithm weights
            const oldWeights = { ...algorithm.weights };
            algorithm.weights = proposedWeights;
            algorithm.version = this.incrementVersion(algorithm.version);
            algorithm.lastUpdated = new Date();
            algorithm.totalVotes = votes.size;
            
            // Track change history
            algorithm.changeHistory.push({
                timestamp: new Date(),
                old_weights: oldWeights,
                new_weights: proposedWeights,
                change_significance: changeSignificance,
                votes_count: votes.size,
                reason: 'community_consensus'
            });
            
            console.log(`⚖️ Updated algorithm ${algorithmId} weights based on community consensus`);
            
            this.emit('algorithm:updated', {
                algorithm_id: algorithmId,
                old_weights: oldWeights,
                new_weights: proposedWeights,
                votes_count: votes.size
            });
            
            // Clear votes for next round
            this.communityVotes.set(algorithmId, new Map());
        }
    }
    
    /**
     * Get transparent view of all algorithms and their weights
     */
    getTransparentAlgorithmView() {
        const algorithms = {};
        
        for (const [algorithmId, algorithm] of this.judgingAlgorithms) {
            algorithms[algorithmId] = {
                name: algorithm.name,
                category: algorithm.category || algorithm.type,
                weights: algorithm.weights,
                version: algorithm.version,
                last_updated: algorithm.lastUpdated,
                total_votes: algorithm.totalVotes,
                approval_rating: algorithm.communityApprovalRating,
                change_history: algorithm.changeHistory,
                boost_connections: algorithm.boostConnections,
                description: algorithm.description,
                transparency: {
                    all_weights_visible: true,
                    community_voting_enabled: true,
                    change_history_public: true,
                    reasoning_logic_open: true
                }
            };
            
            if (algorithm.type === 'cross_platform_boost') {
                algorithms[algorithmId].boost_stats = {
                    threshold: algorithm.threshold,
                    multiplier: algorithm.multiplier,
                    activations: algorithm.activations,
                    source: algorithm.source,
                    target: algorithm.target
                };
            }
        }
        
        return algorithms;
    }
    
    /**
     * Generate no-winner ecosystem report
     */
    generateNoWinnerEcosystemReport() {
        const report = {
            ecosystem_principles: this.ecosystemPrinciples,
            
            participation_stats: {
                total_participants: this.getTotalParticipants(),
                active_categories: Object.keys(this.performanceCategories).length,
                cross_platform_boosts_available: Object.keys(this.crossPlatformBoosts).length,
                community_votes_cast: this.votingHistory.length
            },
            
            reward_distribution: {
                principle: 'everyone_gets_something',
                base_reward_for_participation: 10,
                performance_multipliers: 'transparent_and_community_voted',
                total_rewards_distributed: this.calculateTotalRewardsDistributed(),
                fairness_index: this.calculateFairnessIndex()
            },
            
            cross_platform_activity: {
                gaming_to_creative_boosts: this.getBoostActivations('gaming_performance', 'creative_credits'),
                creative_to_gaming_unlocks: this.getBoostActivations('creative_writing', 'gaming_features'),
                security_contributions_boost_all: this.getBoostActivations('cybersecurity_contribution', 'all_platforms'),
                collaborative_amplification: this.getBoostActivations('collaborative_contribution', 'all_categories')
            },
            
            community_governance: {
                algorithms_with_open_weights: this.judgingAlgorithms.size,
                community_votes_this_period: this.getRecentVotes().length,
                algorithm_updates_from_community: this.getCommunityDrivenUpdates(),
                transparency_level: this.config.transparencyLevel
            },
            
            ecosystem_health: {
                no_winner_principle_maintained: true,
                contribution_over_competition: this.calculateContributionFocus(),
                community_satisfaction: this.calculateCommunitySatisfaction(),
                system_fairness: this.calculateSystemFairness()
            }
        };
        
        return report;
    }
    
    // Helper methods for scoring different criteria
    scoreOriginality(data) { return Math.random() * 10; } // Placeholder implementations
    scoreCoherence(data) { return Math.random() * 10; }
    scoreEngagement(data) { return Math.random() * 10; }
    scoreTechnicalSkill(data) { return Math.random() * 10; }
    scoreImpact(data) { return Math.random() * 10; }
    scoreStrategy(data) { return Math.random() * 10; }
    scoreEfficiency(data) { return Math.random() * 10; }
    scoreInnovation(data) { return Math.random() * 10; }
    scorePersistence(data) { return Math.random() * 10; }
    scoreTeaching(data) { return Math.random() * 10; }
    scoreVulnerabilityDiscovery(data) { return Math.random() * 10; }
    scoreThreatAnalysis(data) { return Math.random() * 10; }
    scoreCommunityProtection(data) { return Math.random() * 10; }
    scoreKnowledgeSharing(data) { return Math.random() * 10; }
    scoreSystemImprovement(data) { return Math.random() * 10; }
    scoreUserSatisfaction(data) { return Math.random() * 10; }
    scorePerformanceMetrics(data) { return Math.random() * 10; }
    scoreReliability(data) { return Math.random() * 10; }
    scoreEcosystemIntegration(data) { return Math.random() * 10; }
    scoreHelpingOthers(data) { return Math.random() * 10; }
    scoreCommunityBuilding(data) { return Math.random() * 10; }
    scoreMentorship(data) { return Math.random() * 10; }
    scorePositiveImpact(data) { return Math.random() * 10; }
    
    fallbackScoring(criterion, data) {
        // Basic scoring based on available data
        return Math.random() * 10;
    }
    
    // Utility methods
    validateWeights(weights) {
        const sum = Object.values(weights).reduce((a, b) => a + b, 0);
        return Math.abs(sum - 1.0) < 0.01; // Allow small floating point errors
    }
    
    calculateVotingPower(voterId) {
        // Implement voting power calculation based on contribution history
        return 1.0; // Placeholder
    }
    
    calculateCommunityConsensus(votes) {
        // Calculate weighted average of all votes
        const weightSums = {};
        let totalVotingPower = 0;
        
        for (const vote of votes.values()) {
            totalVotingPower += vote.voting_power;
            
            for (const [criterion, weight] of Object.entries(vote.proposed_weights)) {
                weightSums[criterion] = (weightSums[criterion] || 0) + (weight * vote.voting_power);
            }
        }
        
        const consensusWeights = {};
        for (const [criterion, sum] of Object.entries(weightSums)) {
            consensusWeights[criterion] = sum / totalVotingPower;
        }
        
        return consensusWeights;
    }
    
    calculateWeightChange(oldWeights, newWeights) {
        let totalChange = 0;
        
        for (const criterion of Object.keys(oldWeights)) {
            totalChange += Math.abs(oldWeights[criterion] - (newWeights[criterion] || 0));
        }
        
        return totalChange;
    }
    
    incrementVersion(version) {
        const parts = version.split('.').map(Number);
        parts[2]++; // Increment patch version
        return parts.join('.');
    }
    
    getCategoryMultiplier(category) {
        const multipliers = {
            creative_writing: 1.2,
            gaming_performance: 1.0,
            cybersecurity_contribution: 1.5,
            tool_effectiveness: 1.1,
            collaborative_contribution: 1.3
        };
        
        return multipliers[category] || 1.0;
    }
}

module.exports = { OpenWeightJudgingSystem };

// Example usage and demonstration
if (require.main === module) {
    async function demonstrateOpenWeightJudging() {
        console.log('\n⚖️ OPEN WEIGHT JUDGING SYSTEM DEMONSTRATION\n');
        
        const judgingSystem = new OpenWeightJudgingSystem({
            enableCommunityVoting: true,
            transparencyLevel: 'full'
        });
        
        // Listen for events
        judgingSystem.on('performance:judged', (judgment) => {
            console.log(`📊 Performance judged: ${judgment.entityId} scored ${judgment.scores.final.toFixed(2)}`);
        });
        
        judgingSystem.on('vote:submitted', (vote) => {
            console.log(`🗳️ Community vote submitted for ${vote.algorithm_id}`);
        });
        
        judgingSystem.on('algorithm:updated', (update) => {
            console.log(`⚖️ Algorithm updated: ${update.algorithm_id} based on ${update.votes_count} votes`);
        });
        
        // Initialize the judging system
        await judgingSystem.initializeJudgingAlgorithms();
        
        // Demonstrate transparent performance judging
        console.log('\n📝 Judging creative writing performance...\n');
        
        const writingJudgment = await judgingSystem.judgePerformance('creative_writer_alice', 'creative_writing', {
            content_quality: 8.5,
            originality_score: 9.2,
            reader_engagement: 7.8,
            technical_writing_skill: 8.0,
            community_impact: 6.5,
            collaboration_rating: 7.5
        });
        
        console.log('\n🎮 Judging gaming performance...\n');
        
        const gamingJudgment = await judgingSystem.judgePerformance('gamer_bob', 'gaming_performance', {
            strategy_rating: 8.8,
            efficiency_score: 7.9,
            innovation_points: 8.5,
            persistence_metric: 9.0,
            teaching_contributions: 6.8
        });
        
        // Demonstrate community voting
        console.log('\n🗳️ Simulating community voting on algorithm weights...\n');
        
        await judgingSystem.submitWeightVote('community_member_1', 'judge_creative_writing', {
            originality: 0.30,
            coherence: 0.25,
            engagement: 0.20,
            technical_skill: 0.15,
            impact: 0.10
        }, 'Originality should be weighted higher for creative work');
        
        // Show transparent algorithm view
        setTimeout(() => {
            console.log('\n🔍 === TRANSPARENT ALGORITHM VIEW ===');
            const algorithms = judgingSystem.getTransparentAlgorithmView();
            
            console.log(`Total Algorithms: ${Object.keys(algorithms).length}`);
            console.log('Categories:');
            for (const [id, algorithm] of Object.entries(algorithms)) {
                console.log(`  ${algorithm.name}: ${Object.keys(algorithm.weights).length} criteria`);
            }
            
            // Show ecosystem report
            console.log('\n🌍 === NO-WINNER ECOSYSTEM REPORT ===');
            const ecosystemReport = judgingSystem.generateNoWinnerEcosystemReport();
            console.log(`Participation Principle: ${ecosystemReport.ecosystem_principles.no_absolute_winners ? 'No absolute winners' : 'Competitive'}`);
            console.log(`Base Reward for All: ${ecosystemReport.reward_distribution.base_reward_for_participation} credits`);
            console.log(`Active Categories: ${ecosystemReport.participation_stats.active_categories}`);
            console.log(`Cross-Platform Boosts: ${ecosystemReport.participation_stats.cross_platform_boosts_available}`);
            console.log(`Algorithm Transparency: ${ecosystemReport.community_governance.algorithms_with_open_weights} algorithms with open weights`);
            
            console.log('\n🎯 System Features:');
            console.log('   • All algorithm weights are visible and community-votable');
            console.log('   • Writing quality unlocks gaming features');
            console.log('   • Gaming achievements boost creative credits');
            console.log('   • Security contributions boost everything');
            console.log('   • No absolute winners - everyone gets rewards');
            console.log('   • Cross-platform performance boosting');
        }, 2000);
    }
    
    demonstrateOpenWeightJudging().catch(console.error);
}

console.log('⚖️ OPEN WEIGHT JUDGING SYSTEM LOADED');
console.log('🗳️ Ready for transparent, community-driven performance evaluation!');