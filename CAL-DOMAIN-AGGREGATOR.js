#!/usr/bin/env node

/**
 * 🌐 CAL DOMAIN AGGREGATOR
 * 
 * Domain-based specialization system that routes queries to appropriate agents
 * based on domain expertise and specialized models.
 * 
 * Features:
 * - Domain detection from natural language
 * - Agent specialization mapping
 * - Multi-agent coordination for complex queries
 * - Performance tracking per domain
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class CalDomainAggregator extends EventEmitter {
    constructor(ecosystem) {
        super();
        
        this.ecosystem = ecosystem;
        
        // Domain definitions with keywords and agent mappings
        this.domains = {
            maritime: {
                name: 'Maritime & Naval',
                keywords: ['ship', 'fleet', 'vessel', 'sail', 'naval', 'pirate', 'frigate', 'galleon', 'sloop', 'harbor', 'port', 'captain', 'crew', 'nautical'],
                primaryAgent: 'ship-cal',
                supportAgents: ['cal-master'],
                specializations: ['3D ship templates', 'fleet management', 'naval combat', 'pirate flags']
            },
            
            trading: {
                name: 'Trading & Economics',
                keywords: ['trade', 'arbitrage', 'market', 'profit', 'price', 'economy', 'osrs', 'grand exchange', 'ge', 'gp', 'gold', 'merchant', 'buy', 'sell', 'margin'],
                primaryAgent: 'trade-cal',
                supportAgents: ['wiki-cal'],
                specializations: ['OSRS arbitrage', 'market analysis', 'price prediction', 'profit calculation']
            },
            
            knowledge: {
                name: 'Knowledge & Research',
                keywords: ['wiki', 'information', 'data', 'research', 'find', 'search', 'documentation', 'guide', 'tutorial', 'learn', 'explain', 'how', 'what', 'why'],
                primaryAgent: 'wiki-cal',
                supportAgents: ['cal-master'],
                specializations: ['wiki extraction', 'documentation search', 'knowledge synthesis', 'tutorial generation']
            },
            
            security: {
                name: 'Security & Protection',
                keywords: ['security', 'threat', 'protect', 'defend', 'attack', 'vulnerability', 'scan', 'audit', 'safe', 'risk', 'breach', 'firewall', 'encryption'],
                primaryAgent: 'combat-cal',
                supportAgents: ['cal-master'],
                specializations: ['threat detection', 'security analysis', 'vulnerability scanning', 'protection strategies']
            },
            
            coordination: {
                name: 'Coordination & Management',
                keywords: ['coordinate', 'manage', 'organize', 'plan', 'strategy', 'team', 'together', 'multi', 'all', 'everyone', 'sync', 'orchestrate'],
                primaryAgent: 'cal-master',
                supportAgents: ['ship-cal', 'trade-cal', 'wiki-cal', 'combat-cal'],
                specializations: ['multi-agent coordination', 'strategic planning', 'team management', 'system orchestration']
            },
            
            gaming: {
                name: 'Gaming & Virtual Worlds',
                keywords: ['game', 'player', 'character', 'npc', 'quest', 'level', 'xp', 'achievement', 'loot', 'spawn', 'respawn', 'guild', 'party'],
                primaryAgent: 'cal-master',
                supportAgents: ['trade-cal', 'combat-cal'],
                specializations: ['game mechanics', 'character progression', 'loot systems', 'multiplayer coordination']
            },
            
            technical: {
                name: 'Technical & Development',
                keywords: ['code', 'api', 'template', 'develop', 'build', 'create', 'implement', 'function', 'class', 'method', 'debug', 'error', 'fix'],
                primaryAgent: 'ship-cal', // Ship Cal handles templates/code
                supportAgents: ['wiki-cal'],
                specializations: ['code generation', 'API integration', 'template creation', 'debugging assistance']
            }
        };
        
        // Domain performance metrics
        this.domainMetrics = {
            queryCount: {},
            responseTime: {},
            satisfactionScore: {},
            agentUtilization: {}
        };
        
        // Multi-domain query handling
        this.multiDomainThreshold = 0.3; // If multiple domains score > 30%, it's multi-domain
        
        console.log('🌐 Cal Domain Aggregator initialized');
        this.emit('aggregator_ready');
    }
    
    /**
     * Analyze query and determine relevant domains
     */
    analyzeQueryDomains(query) {
        const lowerQuery = query.toLowerCase();
        const domainScores = {};
        
        // Score each domain based on keyword matches
        for (const [domainKey, domain] of Object.entries(this.domains)) {
            let score = 0;
            let matches = [];
            
            for (const keyword of domain.keywords) {
                if (lowerQuery.includes(keyword)) {
                    score += 1;
                    matches.push(keyword);
                }
            }
            
            // Normalize score by number of keywords
            domainScores[domainKey] = {
                score: score / domain.keywords.length,
                matches,
                domain
            };
        }
        
        // Sort domains by score
        const sortedDomains = Object.entries(domainScores)
            .sort((a, b) => b[1].score - a[1].score)
            .filter(([_, data]) => data.score > 0);
        
        return {
            primary: sortedDomains[0] ? sortedDomains[0][0] : 'coordination',
            secondary: sortedDomains.slice(1).filter(([_, data]) => data.score > this.multiDomainThreshold).map(([key, _]) => key),
            scores: domainScores,
            isMultiDomain: sortedDomains.filter(([_, data]) => data.score > this.multiDomainThreshold).length > 1
        };
    }
    
    /**
     * Route query to appropriate agents based on domain
     */
    async routeQuery(query, context = {}) {
        const startTime = Date.now();
        
        // Analyze domains
        const domainAnalysis = this.analyzeQueryDomains(query);
        console.log(`🎯 Domain Analysis: Primary=${domainAnalysis.primary}, Multi-domain=${domainAnalysis.isMultiDomain}`);
        
        // Update metrics
        this.domainMetrics.queryCount[domainAnalysis.primary] = 
            (this.domainMetrics.queryCount[domainAnalysis.primary] || 0) + 1;
        
        let result;
        
        if (domainAnalysis.isMultiDomain) {
            // Handle multi-domain query with coordination
            result = await this.handleMultiDomainQuery(query, domainAnalysis, context);
        } else {
            // Route to primary domain agent
            result = await this.handleSingleDomainQuery(query, domainAnalysis.primary, context);
        }
        
        // Track performance
        const responseTime = Date.now() - startTime;
        if (!this.domainMetrics.responseTime[domainAnalysis.primary]) {
            this.domainMetrics.responseTime[domainAnalysis.primary] = [];
        }
        this.domainMetrics.responseTime[domainAnalysis.primary].push(responseTime);
        
        // Emit analytics
        this.emit('query_routed', {
            query,
            domainAnalysis,
            result,
            responseTime
        });
        
        return {
            ...result,
            domainAnalysis,
            responseTime
        };
    }
    
    /**
     * Handle single domain query
     */
    async handleSingleDomainQuery(query, domainKey, context) {
        const domain = this.domains[domainKey];
        const primaryAgent = this.ecosystem.agents.get(domain.primaryAgent);
        
        if (!primaryAgent) {
            throw new Error(`Primary agent ${domain.primaryAgent} not found`);
        }
        
        console.log(`📨 Routing to ${domain.primaryAgent} for ${domain.name} domain`);
        
        // Execute query with primary agent
        const result = await primaryAgent.processQuery(query, {
            ...context,
            domain: domainKey,
            specializations: domain.specializations
        });
        
        return {
            ...result,
            domain: domainKey,
            domainName: domain.name,
            agentsUsed: [domain.primaryAgent]
        };
    }
    
    /**
     * Handle multi-domain query with coordination
     */
    async handleMultiDomainQuery(query, domainAnalysis, context) {
        console.log(`🤝 Multi-domain query detected, coordinating agents...`);
        
        // Always use Cal Master for coordination
        const coordinator = this.ecosystem.agents.get('cal-master');
        
        // Determine which agents to involve
        const involvedAgents = new Set(['cal-master']);
        
        // Add primary domain agent
        const primaryDomain = this.domains[domainAnalysis.primary];
        involvedAgents.add(primaryDomain.primaryAgent);
        
        // Add secondary domain agents
        for (const secondaryKey of domainAnalysis.secondary) {
            const secondaryDomain = this.domains[secondaryKey];
            involvedAgents.add(secondaryDomain.primaryAgent);
        }
        
        // Create coordination task
        const coordinationTask = {
            id: crypto.randomUUID(),
            query,
            domains: [domainAnalysis.primary, ...domainAnalysis.secondary],
            agents: Array.from(involvedAgents)
        };
        
        // Broadcast coordination request
        this.ecosystem.broadcast('coordination', {
            type: 'multi_domain_task',
            task: coordinationTask.query,
            coordinator: 'cal-master',
            participants: coordinationTask.agents.map(agentId => ({
                id: agentId,
                name: this.ecosystem.agents.get(agentId)?.name,
                role: this.ecosystem.agents.get(agentId)?.personality.role
            }))
        });
        
        // Execute coordinated response
        const responses = await Promise.all(
            coordinationTask.agents.map(agentId => {
                const agent = this.ecosystem.agents.get(agentId);
                if (agent) {
                    return agent.processQuery(query, {
                        ...context,
                        coordinationTask,
                        role: agentId === 'cal-master' ? 'coordinator' : 'specialist'
                    });
                }
                return null;
            })
        );
        
        // Filter out null responses
        const validResponses = responses.filter(r => r !== null);
        
        // Synthesize responses
        const synthesizedResponse = await this.synthesizeMultiAgentResponses(
            validResponses,
            coordinationTask
        );
        
        return {
            ...synthesizedResponse,
            domain: 'multi-domain',
            domainName: 'Multi-Domain Coordination',
            agentsUsed: coordinationTask.agents,
            coordinationTask
        };
    }
    
    /**
     * Synthesize multiple agent responses into coherent answer
     */
    async synthesizeMultiAgentResponses(responses, coordinationTask) {
        // Find coordinator response (Cal Master)
        const coordinatorResponse = responses.find(r => r.agent === 'Cal Master');
        const specialistResponses = responses.filter(r => r.agent !== 'Cal Master');
        
        // Build synthesized response
        let synthesized = '';
        
        // Start with coordinator's overview
        if (coordinatorResponse) {
            synthesized = coordinatorResponse.response + '\n\n';
        }
        
        // Add specialist insights
        if (specialistResponses.length > 0) {
            synthesized += '**Specialist Insights:**\n\n';
            
            for (const response of specialistResponses) {
                synthesized += `**${response.agent}**: ${response.response}\n\n`;
            }
        }
        
        // Calculate aggregate metrics
        const totalTokens = responses.reduce((sum, r) => sum + (r.tokensUsed || 0), 0);
        const totalCost = responses.reduce((sum, r) => sum + (r.cost || 0), 0);
        const models = [...new Set(responses.map(r => r.model).filter(m => m))];
        
        return {
            response: synthesized.trim(),
            agent: 'Multi-Agent Coordination',
            personality: ['collaborative', 'comprehensive', 'expert'],
            tokensUsed: totalTokens,
            cost: totalCost,
            models,
            timestamp: Date.now()
        };
    }
    
    /**
     * Get domain expertise summary
     */
    getDomainExpertise() {
        const expertise = {};
        
        for (const [domainKey, domain] of Object.entries(this.domains)) {
            expertise[domainKey] = {
                name: domain.name,
                primaryExpert: domain.primaryAgent,
                supportExperts: domain.supportAgents,
                specializations: domain.specializations,
                queryCount: this.domainMetrics.queryCount[domainKey] || 0,
                avgResponseTime: this.calculateAverageResponseTime(domainKey)
            };
        }
        
        return expertise;
    }
    
    /**
     * Calculate average response time for domain
     */
    calculateAverageResponseTime(domainKey) {
        const times = this.domainMetrics.responseTime[domainKey];
        if (!times || times.length === 0) return 0;
        
        return times.reduce((a, b) => a + b, 0) / times.length;
    }
    
    /**
     * Register custom domain
     */
    registerDomain(domainKey, domainConfig) {
        this.domains[domainKey] = domainConfig;
        console.log(`✅ Registered new domain: ${domainKey} - ${domainConfig.name}`);
        
        this.emit('domain_registered', {
            domainKey,
            domainConfig
        });
    }
    
    /**
     * Get performance report
     */
    getPerformanceReport() {
        return {
            domainMetrics: this.domainMetrics,
            domainExpertise: this.getDomainExpertise(),
            multiDomainQueries: Object.values(this.domainMetrics.queryCount)
                .reduce((a, b) => a + b, 0),
            timestamp: Date.now()
        };
    }
}

module.exports = CalDomainAggregator;

// Demo if run directly
if (require.main === module) {
    // This would need the ecosystem instance to work
    console.log('🌐 Cal Domain Aggregator - Domain Specialization System');
    console.log('This module requires Cal Agent Ecosystem to function.');
    console.log('\nDomain mappings:');
    
    const demo = new CalDomainAggregator({ agents: new Map() });
    
    for (const [key, domain] of Object.entries(demo.domains)) {
        console.log(`\n${key.toUpperCase()}: ${domain.name}`);
        console.log(`  Primary Agent: ${domain.primaryAgent}`);
        console.log(`  Keywords: ${domain.keywords.slice(0, 5).join(', ')}...`);
    }
    
    // Test domain analysis
    console.log('\n\nTest Domain Analysis:');
    const testQueries = [
        'How do I build a pirate ship with custom flags?',
        'Find OSRS arbitrage opportunities for dragon bones',
        'Coordinate all agents to analyze security threats in the fleet',
        'What are the best trading strategies for the Grand Exchange?'
    ];
    
    for (const query of testQueries) {
        const analysis = demo.analyzeQueryDomains(query);
        console.log(`\n"${query}"`);
        console.log(`  Primary: ${analysis.primary} (${(analysis.scores[analysis.primary].score * 100).toFixed(0)}%)`);
        console.log(`  Multi-domain: ${analysis.isMultiDomain}`);
    }
}