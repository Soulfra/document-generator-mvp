#!/usr/bin/env node

/**
 * SYMBIOSIS-CAL INTEGRATION BRIDGE
 * Connects AI Cultural Sandbox with Cal Reasoning Engine
 * Routes governance decisions through Cal for analysis
 * Feeds execution outcomes back to reasoning engine
 * Generates queryable reports about the entire system
 * 
 * Core Features:
 * - Bidirectional data flow between systems
 * - Reasoning analysis of AI ideas and human votes
 * - Memory formation from platform events
 * - Pattern detection across symbiosis activities
 * - Comprehensive system introspection
 */

const EventEmitter = require('events');
const crypto = require('crypto');

console.log(`
🌉 SYMBIOSIS-CAL INTEGRATION BRIDGE 🌉
=====================================
🤖 AI Sandbox ↔️ Cal Reasoning
🗳️ Governance → Cal Analysis
💰 Funding → Cal Learning
🔄 Feedback → Cal Evolution
📊 Unified Querying & Reports
`);

class SymbiosisCalBridge extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Bridge settings
            enableBidirectionalSync: config.enableBidirectionalSync !== false,
            syncIntervalMs: config.syncIntervalMs || 60000, // 1 minute
            batchSize: config.batchSize || 100,
            
            // Reasoning triggers
            reasonOnIdeaCreation: config.reasonOnIdeaCreation !== false,
            reasonOnVoting: config.reasonOnVoting !== false,
            reasonOnFunding: config.reasonOnFunding !== false,
            reasonOnFeedback: config.reasonOnFeedback !== false,
            
            // Memory formation
            memoryImportanceThreshold: config.memoryImportanceThreshold || 0.6,
            compressOldEvents: config.compressOldEvents !== false,
            
            // Pattern detection
            patternDetectionEnabled: config.patternDetectionEnabled !== false,
            minPatternOccurrences: config.minPatternOccurrences || 3,
            
            ...config
        };
        
        // System references (to be injected)
        this.systems = {
            cal: null,
            aiSandbox: null,
            governance: null,
            funding: null,
            feedback: null
        };
        
        // Bridge state
        this.state = {
            connected: false,
            lastSync: null,
            eventsProcessed: 0,
            patternsDetected: 0,
            memoriesFormed: 0,
            reportsGenerated: 0
        };
        
        // Event queues
        this.eventQueues = {
            toCal: [],
            fromCal: [],
            priority: []
        };
        
        // Pattern tracking
        this.emergingPatterns = new Map();
        this.confirmedPatterns = new Map();
        
        // Active monitors
        this.monitors = new Map();
        
        this.initialize();
    }
    
    async initialize() {
        console.log('🚀 Initializing Symbiosis-Cal Bridge...');
        
        try {
            // Verify system connections
            await this.verifySystems();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Initialize pattern detection
            await this.initializePatternDetection();
            
            // Start synchronization
            if (this.config.enableBidirectionalSync) {
                this.startSynchronization();
            }
            
            // Initialize monitors
            await this.setupMonitors();
            
            this.state.connected = true;
            
            console.log('✅ Symbiosis-Cal Bridge initialized!');
            console.log(`🔄 Sync interval: ${this.config.syncIntervalMs}ms`);
            console.log(`🧠 Reasoning triggers: ${Object.keys(this.config).filter(k => k.startsWith('reasonOn')).length}`);
            
            this.emit('bridge_ready');
            
        } catch (error) {
            console.error('❌ Failed to initialize bridge:', error);
            throw error;
        }
    }
    
    /**
     * Connect system components to the bridge
     */
    async connectSystems(systems) {
        console.log('🔌 Connecting systems to bridge...');
        
        for (const [name, system] of Object.entries(systems)) {
            if (system) {
                this.systems[name] = system;
                console.log(`✅ Connected: ${name}`);
            }
        }
        
        // Re-setup listeners if systems changed
        if (this.state.connected) {
            this.setupEventListeners();
        }
        
        return this.systems;
    }
    
    /**
     * Process AI idea creation through Cal
     */
    async processIdeaCreation(idea) {
        if (!this.config.reasonOnIdeaCreation) return;
        
        console.log(`💡 Processing idea ${idea.id} through Cal...`);
        
        try {
            // Have Cal reason about the idea
            const reasoning = await this.systems.cal.reason(
                `Analyze new AI idea: ${JSON.stringify(idea.content)}`,
                {
                    source: 'ai_sandbox',
                    ideaId: idea.id,
                    culturalInfluences: idea.culturalInfluences,
                    creator: idea.creator
                }
            );
            
            // Store as memory
            const memory = await this.systems.cal.remember({
                type: 'ai_idea',
                idea,
                reasoning: reasoning.conclusions,
                potential: this.assessIdeaPotential(idea, reasoning)
            }, {
                importance: idea.fitness || 0.5,
                source: 'symbiosis_bridge',
                associations: idea.culturalInfluences.map(i => i.id)
            });
            
            // Check for patterns
            await this.detectIdeaPatterns(idea, reasoning);
            
            // Update idea with Cal's analysis
            idea.calAnalysis = {
                reasoningId: reasoning.id,
                memoryId: memory.id,
                insights: reasoning.conclusions,
                confidence: reasoning.confidence
            };
            
            this.state.eventsProcessed++;
            
            console.log(`✅ Idea processed: ${reasoning.conclusions[0] || 'No conclusion'}`);
            this.emit('idea_analyzed', { idea, reasoning, memory });
            
        } catch (error) {
            console.error('❌ Error processing idea:', error);
            this.emit('processing_error', { type: 'idea', error });
        }
    }
    
    /**
     * Analyze governance vote through Cal
     */
    async processVote(vote, proposal) {
        if (!this.config.reasonOnVoting) return;
        
        console.log(`🗳️ Analyzing vote on proposal ${proposal.id}...`);
        
        try {
            // Cal analyzes the voting pattern
            const reasoning = await this.systems.cal.reason(
                `Analyze vote: ${vote.vote} on "${proposal.details.title}" with reasoning: "${vote.reasoning}"`,
                {
                    source: 'governance',
                    proposalId: proposal.id,
                    voterId: vote.userId,
                    category: proposal.category
                }
            );
            
            // Look for voting patterns
            await this.detectVotingPatterns(vote, proposal, reasoning);
            
            // Store significant votes
            if (vote.votingPower > 1.5 || proposal.category === 'funding_approval') {
                await this.systems.cal.remember({
                    type: 'governance_vote',
                    vote,
                    proposal: proposal.details,
                    impact: vote.votingPower * (proposal.totalVotingPower || 1)
                }, {
                    importance: Math.min(vote.votingPower / 3, 1),
                    source: 'governance_voting'
                });
                
                this.state.memoriesFormed++;
            }
            
            this.state.eventsProcessed++;
            
            console.log(`✅ Vote analyzed: ${reasoning.confidence > 0.7 ? 'High' : 'Low'} confidence pattern`);
            this.emit('vote_analyzed', { vote, proposal, reasoning });
            
        } catch (error) {
            console.error('❌ Error processing vote:', error);
            this.emit('processing_error', { type: 'vote', error });
        }
    }
    
    /**
     * Process funding decision through Cal
     */
    async processFundingDecision(contract, project) {
        if (!this.config.reasonOnFunding) return;
        
        console.log(`💰 Processing funding decision for ${project.title}...`);
        
        try {
            // Cal analyzes the funding match
            const reasoning = await this.systems.cal.reason(
                `Analyze funding decision: AI project "${project.title}" matched with executor ${contract.executorId}. Budget: $${contract.financial.totalAmount}`,
                {
                    source: 'funding_platform',
                    projectId: project.id,
                    contractId: contract.id,
                    matchScore: contract.matchScore
                }
            );
            
            // Store funding decision
            const memory = await this.systems.cal.remember({
                type: 'funding_decision',
                project: {
                    id: project.id,
                    title: project.title,
                    objectives: project.objectives
                },
                contract: {
                    id: contract.id,
                    executor: contract.executorId,
                    amount: contract.financial.totalAmount
                },
                prediction: reasoning.conclusions[0]
            }, {
                importance: 0.7,
                source: 'funding_platform'
            });
            
            // Track for pattern analysis
            await this.trackFundingPattern(project, contract, reasoning);
            
            this.state.eventsProcessed++;
            this.state.memoriesFormed++;
            
            console.log(`✅ Funding analyzed: Confidence ${(reasoning.confidence * 100).toFixed(1)}%`);
            this.emit('funding_analyzed', { contract, project, reasoning, memory });
            
        } catch (error) {
            console.error('❌ Error processing funding:', error);
            this.emit('processing_error', { type: 'funding', error });
        }
    }
    
    /**
     * Process execution feedback through Cal
     */
    async processExecutionFeedback(feedback) {
        if (!this.config.reasonOnFeedback) return;
        
        console.log(`📊 Processing execution feedback ${feedback.id}...`);
        
        try {
            // Deep analysis of execution outcome
            const reasoning = await this.systems.cal.reason(
                `Analyze execution outcome: Project ${feedback.projectId} resulted in ${feedback.overallSuccess}. ` +
                `Scores - Execution: ${feedback.scores.execution}, Impact: ${feedback.scores.impact}, ` +
                `Cultural: ${feedback.scores.cultural}, Learning: ${feedback.scores.learning}`,
                {
                    source: 'feedback_loop',
                    feedbackId: feedback.id,
                    projectId: feedback.projectId,
                    patterns: feedback.patterns
                }
            );
            
            // Store as important memory
            const memory = await this.systems.cal.remember({
                type: 'execution_outcome',
                feedback,
                insights: feedback.learning.keyInsights,
                impact: {
                    users: feedback.impact.usersReached,
                    value: feedback.impact.valueCreated
                }
            }, {
                importance: feedback.overallSuccess === 'breakthrough' ? 1.0 : 
                           feedback.overallSuccess === 'success' ? 0.8 : 0.6,
                source: 'feedback_loop'
            });
            
            // Learn from outcome
            await this.learnFromOutcome(feedback, reasoning);
            
            // Update patterns
            await this.updatePatternsFromFeedback(feedback, reasoning);
            
            this.state.eventsProcessed++;
            this.state.memoriesFormed++;
            
            console.log(`✅ Feedback processed: ${feedback.overallSuccess} - ${reasoning.conclusions[0]}`);
            this.emit('feedback_analyzed', { feedback, reasoning, memory });
            
        } catch (error) {
            console.error('❌ Error processing feedback:', error);
            this.emit('processing_error', { type: 'feedback', error });
        }
    }
    
    /**
     * Query unified system through Cal
     */
    async query(queryString, options = {}) {
        console.log(`🔍 Unified query: "${queryString}"`);
        
        try {
            // First query Cal's reasoning
            const calResults = await this.systems.cal.query(queryString, options);
            
            // Enhance with symbiosis-specific data
            const enhancedResults = await this.enhanceQueryResults(calResults, queryString);
            
            // Generate unified response
            const unifiedQuery = {
                id: crypto.randomUUID(),
                query: queryString,
                timestamp: Date.now(),
                sources: ['cal', 'ai_sandbox', 'governance', 'funding', 'feedback'],
                results: enhancedResults,
                stats: {
                    ...calResults.stats,
                    symbiosisEnhancements: enhancedResults.length - calResults.results.length
                }
            };
            
            console.log(`✅ Query complete: ${unifiedQuery.results.length} total results`);
            this.emit('query_complete', unifiedQuery);
            
            return unifiedQuery;
            
        } catch (error) {
            console.error('❌ Query error:', error);
            throw error;
        }
    }
    
    /**
     * Generate comprehensive system report
     */
    async generateSystemReport(reportType = 'full', options = {}) {
        console.log(`📊 Generating ${reportType} system report...`);
        
        const report = {
            id: crypto.randomUUID(),
            type: `symbiosis_${reportType}`,
            generated: new Date().toISOString(),
            sections: []
        };
        
        try {
            // Get Cal's base report
            const calReport = await this.systems.cal.generateReport('system', options);
            
            // Add symbiosis-specific sections
            
            // AI Cultural Sandbox section
            report.sections.push({
                name: 'AI CULTURAL SANDBOX',
                type: 'ai_sandbox',
                content: await this.generateAISandboxReport()
            });
            
            // Governance section
            report.sections.push({
                name: 'HUMAN GOVERNANCE',
                type: 'governance',
                content: await this.generateGovernanceReport()
            });
            
            // Funding Platform section
            report.sections.push({
                name: 'REVERSE FUNDING PLATFORM',
                type: 'funding',
                content: await this.generateFundingReport()
            });
            
            // Feedback Loop section
            report.sections.push({
                name: 'SYMBIOSIS FEEDBACK',
                type: 'feedback',
                content: await this.generateFeedbackReport()
            });
            
            // Pattern Analysis section
            report.sections.push({
                name: 'PATTERN ANALYSIS',
                type: 'patterns',
                content: await this.generatePatternReport()
            });
            
            // Integration Health section
            report.sections.push({
                name: 'INTEGRATION HEALTH',
                type: 'health',
                content: await this.generateHealthReport()
            });
            
            // Combine with Cal report
            if (typeof calReport === 'string') {
                report.calAnalysis = calReport;
            } else {
                report.sections.unshift(...calReport.sections);
            }
            
            // Format based on options
            const formatted = await this.formatReport(report, options.format || 'text');
            
            this.state.reportsGenerated++;
            
            console.log(`✅ System report generated: ${report.id}`);
            this.emit('report_generated', report);
            
            return formatted;
            
        } catch (error) {
            console.error('❌ Report generation error:', error);
            throw error;
        }
    }
    
    // Pattern detection methods
    
    async detectIdeaPatterns(idea, reasoning) {
        const patternKey = `idea_${idea.type}_${idea.stage}`;
        
        if (!this.emergingPatterns.has(patternKey)) {
            this.emergingPatterns.set(patternKey, {
                occurrences: [],
                characteristics: new Set()
            });
        }
        
        const pattern = this.emergingPatterns.get(patternKey);
        pattern.occurrences.push({
            ideaId: idea.id,
            fitness: idea.fitness,
            maturity: idea.maturity,
            reasoning: reasoning.conclusions[0]
        });
        
        // Extract characteristics
        if (idea.culturalInfluences) {
            idea.culturalInfluences.forEach(inf => 
                pattern.characteristics.add(inf.type)
            );
        }
        
        // Check if pattern is confirmed
        if (pattern.occurrences.length >= this.config.minPatternOccurrences) {
            await this.confirmPattern(patternKey, pattern);
        }
    }
    
    async detectVotingPatterns(vote, proposal, reasoning) {
        const patternKey = `vote_${proposal.category}_${vote.vote}`;
        
        if (!this.emergingPatterns.has(patternKey)) {
            this.emergingPatterns.set(patternKey, {
                occurrences: [],
                reasonings: []
            });
        }
        
        const pattern = this.emergingPatterns.get(patternKey);
        pattern.occurrences.push({
            proposalId: proposal.id,
            voterId: vote.userId,
            votingPower: vote.votingPower,
            reasoning: vote.reasoning
        });
        pattern.reasonings.push(reasoning.confidence);
        
        if (pattern.occurrences.length >= this.config.minPatternOccurrences) {
            await this.confirmPattern(patternKey, pattern);
        }
    }
    
    async confirmPattern(patternKey, patternData) {
        console.log(`✨ Pattern confirmed: ${patternKey}`);
        
        this.confirmedPatterns.set(patternKey, {
            ...patternData,
            confirmed: Date.now(),
            strength: patternData.occurrences.length / this.state.eventsProcessed
        });
        
        // Store pattern in Cal
        await this.systems.cal.remember({
            type: 'confirmed_pattern',
            key: patternKey,
            data: patternData,
            strength: patternData.occurrences.length
        }, {
            importance: 0.8,
            source: 'pattern_detection'
        });
        
        this.state.patternsDetected++;
        this.emergingPatterns.delete(patternKey);
        
        this.emit('pattern_confirmed', { key: patternKey, data: patternData });
    }
    
    // Report generation methods
    
    async generateAISandboxReport() {
        const agents = this.systems.aiSandbox?.aiAgents || new Map();
        const ideas = this.systems.aiSandbox?.activeIdeas || new Map();
        const projects = this.systems.aiSandbox?.matureProjects || new Map();
        
        return [
            `Active AI Agents: ${agents.size}`,
            `Total Ideas Generated: ${ideas.size}`,
            `Mature Projects: ${projects.size}`,
            `Average Idea Fitness: ${this.calculateAverageFitness(ideas)}`,
            `Cultural Forums Active: ${Object.keys(this.systems.aiSandbox?.culturalForums || {}).length}`,
            '',
            'Top AI Agents by Reputation:',
            ...this.getTopAgents(agents, 5),
            '',
            'Recent Mature Projects:',
            ...this.getRecentProjects(projects, 5)
        ];
    }
    
    async generateGovernanceReport() {
        const users = this.systems.governance?.users || new Map();
        const proposals = this.systems.governance?.activeProposals || new Map();
        
        return [
            `Registered Users: ${users.size}`,
            `Active Voters: ${this.countActiveVoters(users)}`,
            `Open Proposals: ${this.countOpenProposals(proposals)}`,
            `Average Reputation: ${this.calculateAverageReputation(users)}`,
            '',
            'Voting Activity (Last 24h):',
            `  Votes Cast: ${this.systems.governance?.communityMetrics?.totalVotesCast || 0}`,
            `  Proposals Completed: ${this.countCompletedProposals(proposals, 24)}`,
            '',
            'Top Reputation Users:',
            ...this.getTopUsers(users, 5)
        ];
    }
    
    async generateFundingReport() {
        const contracts = this.systems.funding?.activeContracts || new Map();
        const completed = this.systems.funding?.completedProjects || new Map();
        const financials = this.systems.funding?.financials || {};
        
        return [
            `Active Contracts: ${contracts.size}`,
            `Completed Projects: ${completed.size}`,
            `Total Funded: $${financials.totalFunded || 0}`,
            `Total Paid Out: $${financials.totalPaidOut || 0}`,
            `Success Rate: ${((financials.successfulProjects / Math.max(1, completed.size)) * 100).toFixed(1)}%`,
            '',
            'Active Contract Status:',
            ...this.getContractStatuses(contracts),
            '',
            'Platform Metrics:',
            `  Platform Fees: $${financials.platformFees || 0}`,
            `  Active Commitments: $${financials.activeCommitments || 0}`
        ];
    }
    
    async generateFeedbackReport() {
        const history = this.systems.feedback?.feedbackHistory || new Map();
        const patterns = this.systems.feedback?.successPatterns || {};
        
        return [
            `Total Feedback Records: ${history.size}`,
            `Success Patterns: ${Object.keys(patterns).length}`,
            `Evolutionary Pressure: ${this.systems.feedback?.evolutionaryPressure?.current || 1.0}`,
            '',
            'Outcome Distribution:',
            ...this.getOutcomeDistribution(history),
            '',
            'Top Success Patterns:',
            ...this.getTopPatterns(patterns, 5)
        ];
    }
    
    async generatePatternReport() {
        return [
            `Emerging Patterns: ${this.emergingPatterns.size}`,
            `Confirmed Patterns: ${this.confirmedPatterns.size}`,
            `Pattern Detection Rate: ${(this.state.patternsDetected / Math.max(1, this.state.eventsProcessed) * 100).toFixed(2)}%`,
            '',
            'Recent Confirmed Patterns:',
            ...this.getRecentPatterns(5),
            '',
            'Pattern Categories:',
            ...this.getPatternCategories()
        ];
    }
    
    async generateHealthReport() {
        return [
            'Bridge Status:',
            `  Connected: ${this.state.connected}`,
            `  Last Sync: ${this.state.lastSync ? new Date(this.state.lastSync).toISOString() : 'Never'}`,
            `  Events Processed: ${this.state.eventsProcessed}`,
            `  Memories Formed: ${this.state.memoriesFormed}`,
            `  Reports Generated: ${this.state.reportsGenerated}`,
            '',
            'System Connections:',
            ...Object.entries(this.systems).map(([name, system]) => 
                `  ${name}: ${system ? 'Connected' : 'Disconnected'}`
            ),
            '',
            'Event Queue Status:',
            `  To Cal: ${this.eventQueues.toCal.length}`,
            `  From Cal: ${this.eventQueues.fromCal.length}`,
            `  Priority: ${this.eventQueues.priority.length}`
        ];
    }
    
    // Utility methods
    
    async enhanceQueryResults(calResults, queryString) {
        const enhanced = [...calResults.results];
        
        // Add symbiosis-specific results based on query
        if (queryString.includes('project') || queryString.includes('funding')) {
            const projectResults = await this.searchProjects(queryString);
            enhanced.push(...projectResults);
        }
        
        if (queryString.includes('vote') || queryString.includes('governance')) {
            const governanceResults = await this.searchGovernance(queryString);
            enhanced.push(...governanceResults);
        }
        
        if (queryString.includes('pattern') || queryString.includes('trend')) {
            const patternResults = await this.searchPatterns(queryString);
            enhanced.push(...patternResults);
        }
        
        return enhanced;
    }
    
    async searchProjects(query) {
        const results = [];
        const projects = this.systems.aiSandbox?.matureProjects || new Map();
        
        for (const [id, project] of projects) {
            if (JSON.stringify(project).toLowerCase().includes(query.toLowerCase())) {
                results.push({
                    type: 'ai_project',
                    id: project.id,
                    title: project.title,
                    status: project.fundingStatus,
                    budget: project.estimatedBudget,
                    relevance: 0.8
                });
            }
        }
        
        return results;
    }
    
    async searchGovernance(query) {
        const results = [];
        const proposals = this.systems.governance?.activeProposals || new Map();
        
        for (const [id, proposal] of proposals) {
            if (JSON.stringify(proposal).toLowerCase().includes(query.toLowerCase())) {
                results.push({
                    type: 'governance_proposal',
                    id: proposal.id,
                    title: proposal.details.title,
                    category: proposal.category,
                    status: proposal.status,
                    votes: proposal.votes.size,
                    relevance: 0.7
                });
            }
        }
        
        return results;
    }
    
    async searchPatterns(query) {
        const results = [];
        
        for (const [key, pattern] of this.confirmedPatterns) {
            if (key.toLowerCase().includes(query.toLowerCase())) {
                results.push({
                    type: 'confirmed_pattern',
                    key,
                    occurrences: pattern.occurrences.length,
                    strength: pattern.strength,
                    confirmed: new Date(pattern.confirmed).toISOString(),
                    relevance: 0.9
                });
            }
        }
        
        return results;
    }
    
    formatReport(report, format) {
        switch (format) {
            case 'json':
                return JSON.stringify(report, null, 2);
                
            case 'xml':
                return this.reportToXML(report);
                
            case 'nmap':
                return this.reportToNmap(report);
                
            case 'autopsy':
                return this.reportToAutopsy(report);
                
            case 'text':
            default:
                return this.reportToText(report);
        }
    }
    
    reportToText(report) {
        let output = `SYMBIOSIS-CAL SYSTEM REPORT\n`;
        output += `Generated: ${report.generated}\n`;
        output += `Type: ${report.type}\n`;
        output += '='.repeat(60) + '\n\n';
        
        for (const section of report.sections) {
            output += `${section.name}\n`;
            output += '-'.repeat(section.name.length) + '\n\n';
            
            if (Array.isArray(section.content)) {
                output += section.content.join('\n') + '\n';
            } else {
                output += JSON.stringify(section.content, null, 2) + '\n';
            }
            
            output += '\n';
        }
        
        if (report.calAnalysis) {
            output += '\nCAL REASONING ANALYSIS\n';
            output += '=====================\n\n';
            output += report.calAnalysis + '\n';
        }
        
        return output;
    }
    
    reportToNmap(report) {
        let output = `# Symbiosis-Cal scan report\n`;
        output += `# Generated: ${report.generated}\n\n`;
        
        output += `Symbiosis scan report for AI-Human Platform\n`;
        output += `Host is up (0.00001s latency).\n`;
        output += `Not shown: 995 closed ports\n`;
        output += `PORT     STATE SERVICE\n`;
        
        // Map components to "ports"
        const components = {
            '3000/tcp': 'ai-sandbox',
            '3001/tcp': 'governance',
            '3002/tcp': 'funding',
            '3003/tcp': 'feedback',
            '3004/tcp': 'cal-reasoning'
        };
        
        for (const [port, service] of Object.entries(components)) {
            const system = this.systems[service.replace('-', '')];
            output += `${port} ${system ? 'open' : 'closed'} ${service}\n`;
        }
        
        output += `\nService detection performed.\n`;
        output += `\nSymbiosis scan done: 1 AI-Human ecosystem (5 services up)\n`;
        
        return output;
    }
    
    reportToAutopsy(report) {
        let output = `Autopsy Case Report\n`;
        output += `Case: Symbiosis-Cal Integration Analysis\n`;
        output += `Generated: ${report.generated}\n\n`;
        
        output += `Evidence Summary:\n`;
        output += `-----------------\n`;
        
        let evidenceId = 1;
        for (const section of report.sections) {
            output += `\nEvidence Item #${evidenceId++}\n`;
            output += `Type: ${section.type}\n`;
            output += `Description: ${section.name}\n`;
            output += `Details:\n`;
            
            if (Array.isArray(section.content)) {
                section.content.forEach(line => {
                    output += `  - ${line}\n`;
                });
            }
        }
        
        output += `\nAnalysis Complete.\n`;
        
        return output;
    }
    
    // Helper methods
    
    assessIdeaPotential(idea, reasoning) {
        const fitness = idea.fitness || 0;
        const maturity = idea.maturity || 0;
        const confidence = reasoning.confidence || 0;
        
        return (fitness * 0.4 + maturity * 0.3 + confidence * 0.3);
    }
    
    calculateAverageFitness(ideas) {
        if (ideas.size === 0) return '0.00';
        
        let total = 0;
        for (const idea of ideas.values()) {
            total += idea.fitness || 0;
        }
        
        return (total / ideas.size).toFixed(2);
    }
    
    calculateAverageReputation(users) {
        if (users.size === 0) return '0.00';
        
        let total = 0;
        for (const user of users.values()) {
            total += user.reputation || 0;
        }
        
        return (total / users.size).toFixed(2);
    }
    
    countActiveVoters(users) {
        let count = 0;
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        
        for (const user of users.values()) {
            if (user.activity?.lastVote > oneWeekAgo) count++;
        }
        
        return count;
    }
    
    countOpenProposals(proposals) {
        let count = 0;
        for (const proposal of proposals.values()) {
            if (proposal.status === 'voting') count++;
        }
        return count;
    }
    
    getTopAgents(agents, limit) {
        const sorted = Array.from(agents.values())
            .sort((a, b) => (b.state?.reputation || 0) - (a.state?.reputation || 0))
            .slice(0, limit);
        
        return sorted.map(agent => 
            `  ${agent.id.substring(0, 8)}: ${agent.type} (Rep: ${(agent.state?.reputation || 0).toFixed(2)})`
        );
    }
    
    getTopUsers(users, limit) {
        const sorted = Array.from(users.values())
            .sort((a, b) => (b.reputation || 0) - (a.reputation || 0))
            .slice(0, limit);
        
        return sorted.map(user => 
            `  ${user.username}: ${user.reputation.toFixed(0)} reputation`
        );
    }
    
    getRecentProjects(projects, limit) {
        const sorted = Array.from(projects.values())
            .sort((a, b) => b.created - a.created)
            .slice(0, limit);
        
        return sorted.map(project => 
            `  ${project.title.substring(0, 50)}: $${project.estimatedBudget} (${project.fundingStatus})`
        );
    }
    
    getContractStatuses(contracts) {
        const statuses = {};
        
        for (const contract of contracts.values()) {
            statuses[contract.status] = (statuses[contract.status] || 0) + 1;
        }
        
        return Object.entries(statuses).map(([status, count]) => 
            `  ${status}: ${count}`
        );
    }
    
    getOutcomeDistribution(history) {
        const outcomes = {};
        
        for (const feedback of history.values()) {
            outcomes[feedback.overallSuccess] = (outcomes[feedback.overallSuccess] || 0) + 1;
        }
        
        return Object.entries(outcomes).map(([outcome, count]) => 
            `  ${outcome}: ${count} (${((count / history.size) * 100).toFixed(1)}%)`
        );
    }
    
    getTopPatterns(patterns, limit) {
        return Object.entries(patterns)
            .sort((a, b) => (b[1].confidence || 0) - (a[1].confidence || 0))
            .slice(0, limit)
            .map(([name, pattern]) => 
                `  ${name}: ${(pattern.confidence * 100).toFixed(1)}% confidence`
            );
    }
    
    getRecentPatterns(limit) {
        const sorted = Array.from(this.confirmedPatterns.entries())
            .sort((a, b) => b[1].confirmed - a[1].confirmed)
            .slice(0, limit);
        
        return sorted.map(([key, pattern]) => 
            `  ${key}: ${pattern.occurrences.length} occurrences (${new Date(pattern.confirmed).toLocaleDateString()})`
        );
    }
    
    getPatternCategories() {
        const categories = {};
        
        for (const [key] of this.confirmedPatterns) {
            const category = key.split('_')[0];
            categories[category] = (categories[category] || 0) + 1;
        }
        
        return Object.entries(categories).map(([cat, count]) => 
            `  ${cat}: ${count} patterns`
        );
    }
    
    // Event setup and monitoring
    
    setupEventListeners() {
        // AI Sandbox events
        if (this.systems.aiSandbox) {
            this.systems.aiSandbox.on('idea_generated', (idea) => {
                this.processIdeaCreation(idea);
            });
            
            this.systems.aiSandbox.on('project_created', (project) => {
                this.eventQueues.toCal.push({
                    type: 'project_created',
                    data: project,
                    timestamp: Date.now()
                });
            });
        }
        
        // Governance events
        if (this.systems.governance) {
            this.systems.governance.on('vote_cast', ({ userId, proposalId, vote, votingPower }) => {
                const proposal = this.systems.governance.activeProposals.get(proposalId);
                if (proposal) {
                    this.processVote({ userId, vote, votingPower }, proposal);
                }
            });
            
            this.systems.governance.on('proposal_created', (proposal) => {
                this.eventQueues.toCal.push({
                    type: 'proposal_created',
                    data: proposal,
                    timestamp: Date.now()
                });
            });
        }
        
        // Funding events
        if (this.systems.funding) {
            this.systems.funding.on('contract_created', (contract) => {
                const project = this.systems.aiSandbox?.matureProjects.get(contract.fundingId);
                if (project) {
                    this.processFundingDecision(contract, project);
                }
            });
            
            this.systems.funding.on('milestone_approved', (data) => {
                this.eventQueues.priority.push({
                    type: 'milestone_approved',
                    data,
                    timestamp: Date.now()
                });
            });
        }
        
        // Feedback events
        if (this.systems.feedback) {
            this.systems.feedback.on('feedback_processed', (feedback) => {
                this.processExecutionFeedback(feedback);
            });
            
            this.systems.feedback.on('pattern_detected', (patterns) => {
                this.eventQueues.priority.push({
                    type: 'patterns_detected',
                    data: patterns,
                    timestamp: Date.now()
                });
            });
        }
        
        // Cal events
        if (this.systems.cal) {
            this.systems.cal.on('reasoning_complete', (reasoning) => {
                this.eventQueues.fromCal.push({
                    type: 'cal_reasoning',
                    data: reasoning,
                    timestamp: Date.now()
                });
            });
            
            this.systems.cal.on('memory_stored', (memory) => {
                // Track Cal's memory formation
                if (memory.metadata.source === 'symbiosis_bridge') {
                    this.state.memoriesFormed++;
                }
            });
        }
    }
    
    async setupMonitors() {
        // Monitor AI idea quality
        this.monitors.set('idea_quality', {
            check: async () => {
                const ideas = this.systems.aiSandbox?.activeIdeas || new Map();
                const avgFitness = this.calculateAverageFitness(ideas);
                return {
                    metric: 'avg_idea_fitness',
                    value: parseFloat(avgFitness),
                    threshold: 0.5,
                    status: parseFloat(avgFitness) > 0.5 ? 'healthy' : 'warning'
                };
            },
            interval: 5 * 60 * 1000 // 5 minutes
        });
        
        // Monitor voting participation
        this.monitors.set('voting_participation', {
            check: async () => {
                const users = this.systems.governance?.users || new Map();
                const activeRate = this.countActiveVoters(users) / Math.max(1, users.size);
                return {
                    metric: 'active_voter_rate',
                    value: activeRate,
                    threshold: 0.1,
                    status: activeRate > 0.1 ? 'healthy' : 'warning'
                };
            },
            interval: 60 * 60 * 1000 // 1 hour
        });
        
        // Start monitors
        for (const [name, monitor] of this.monitors) {
            setInterval(async () => {
                const result = await monitor.check();
                this.emit('monitor_check', { name, result });
            }, monitor.interval);
        }
    }
    
    startSynchronization() {
        setInterval(() => {
            this.processSyncBatch();
        }, this.config.syncIntervalMs);
    }
    
    async processSyncBatch() {
        // Process priority queue first
        while (this.eventQueues.priority.length > 0 && this.eventQueues.priority.length > 0) {
            const event = this.eventQueues.priority.shift();
            await this.processQueuedEvent(event);
        }
        
        // Process regular queues
        const batchSize = Math.min(this.config.batchSize, 
            this.eventQueues.toCal.length + this.eventQueues.fromCal.length);
        
        for (let i = 0; i < batchSize; i++) {
            if (this.eventQueues.toCal.length > 0) {
                const event = this.eventQueues.toCal.shift();
                await this.processQueuedEvent(event);
            }
            
            if (this.eventQueues.fromCal.length > 0) {
                const event = this.eventQueues.fromCal.shift();
                await this.processQueuedEvent(event);
            }
        }
        
        this.state.lastSync = Date.now();
    }
    
    async processQueuedEvent(event) {
        try {
            switch (event.type) {
                case 'project_created':
                    // Cal analyzes new projects
                    await this.systems.cal.reason(
                        `New project created: ${event.data.title}`,
                        { projectId: event.data.id }
                    );
                    break;
                    
                case 'patterns_detected':
                    // Store pattern discoveries
                    for (const pattern of event.data.emerging_success) {
                        await this.systems.cal.remember({
                            type: 'emerging_pattern',
                            pattern
                        }, {
                            importance: pattern.confidence
                        });
                    }
                    break;
                    
                // Add more event handlers as needed
            }
        } catch (error) {
            console.error(`Error processing queued event ${event.type}:`, error);
        }
    }
    
    async verifySystems() {
        const required = ['cal'];
        const optional = ['aiSandbox', 'governance', 'funding', 'feedback'];
        
        for (const sys of required) {
            if (!this.systems[sys]) {
                throw new Error(`Required system '${sys}' not connected`);
            }
        }
        
        for (const sys of optional) {
            if (!this.systems[sys]) {
                console.warn(`⚠️ Optional system '${sys}' not connected`);
            }
        }
    }
    
    async initializePatternDetection() {
        // Load any existing patterns from Cal's memory
        if (this.systems.cal) {
            const patterns = await this.systems.cal.query('memory: confirmed_pattern');
            
            for (const result of patterns.results) {
                if (result.content?.key) {
                    this.confirmedPatterns.set(result.content.key, result.content.data);
                }
            }
            
            console.log(`📊 Loaded ${this.confirmedPatterns.size} existing patterns`);
        }
    }
    
    async trackFundingPattern(project, contract, reasoning) {
        const patternKey = `funding_${project.type || 'general'}_${contract.terms.contractType}`;
        
        if (!this.emergingPatterns.has(patternKey)) {
            this.emergingPatterns.set(patternKey, {
                occurrences: [],
                amounts: [],
                outcomes: []
            });
        }
        
        const pattern = this.emergingPatterns.get(patternKey);
        pattern.occurrences.push({
            projectId: project.id,
            contractId: contract.id,
            amount: contract.financial.totalAmount,
            matchScore: contract.matchScore
        });
        pattern.amounts.push(contract.financial.totalAmount);
        
        if (pattern.occurrences.length >= this.config.minPatternOccurrences) {
            await this.confirmPattern(patternKey, pattern);
        }
    }
    
    async learnFromOutcome(feedback, reasoning) {
        // Extract learnings
        const learnings = {
            successful: feedback.overallSuccess === 'success' || feedback.overallSuccess === 'breakthrough',
            factors: [],
            recommendations: []
        };
        
        // Identify success/failure factors
        if (feedback.scores.execution > 0.8) {
            learnings.factors.push('High execution quality');
        }
        if (feedback.scores.cultural > 0.8) {
            learnings.factors.push('Strong cultural alignment');
        }
        if (feedback.scores.impact < 0.3) {
            learnings.factors.push('Low real-world impact');
        }
        
        // Generate recommendations
        if (!learnings.successful && feedback.scores.cultural < 0.5) {
            learnings.recommendations.push('Improve cultural context understanding');
        }
        
        // Store learning in Cal
        await this.systems.cal.remember({
            type: 'execution_learning',
            feedbackId: feedback.id,
            projectId: feedback.projectId,
            learnings,
            reasoning: reasoning.conclusions
        }, {
            importance: learnings.successful ? 0.9 : 0.7,
            source: 'learning_system'
        });
    }
    
    async updatePatternsFromFeedback(feedback, reasoning) {
        // Update success/failure patterns based on outcome
        for (const pattern of feedback.patterns || []) {
            if (pattern.type === 'success_pattern') {
                const existing = this.confirmedPatterns.get(pattern.name);
                if (existing) {
                    existing.strength = Math.min(1, existing.strength * 1.1);
                    existing.lastReinforced = Date.now();
                }
            } else if (pattern.type === 'failure_pattern') {
                // Track failure patterns to avoid
                const patternKey = `failure_${pattern.name}`;
                if (!this.emergingPatterns.has(patternKey)) {
                    this.emergingPatterns.set(patternKey, {
                        occurrences: [],
                        warning: pattern.warning
                    });
                }
                this.emergingPatterns.get(patternKey).occurrences.push(feedback.id);
            }
        }
    }
    
    reportToXML(report) {
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        xml += `<symbiosisReport id="${report.id}" generated="${report.generated}" type="${report.type}">\n`;
        
        for (const section of report.sections) {
            xml += `  <section name="${section.name}" type="${section.type}">\n`;
            
            if (Array.isArray(section.content)) {
                section.content.forEach(line => {
                    xml += `    <item>${this.escapeXML(line)}</item>\n`;
                });
            } else {
                xml += `    <content>${this.escapeXML(JSON.stringify(section.content))}</content>\n`;
            }
            
            xml += `  </section>\n`;
        }
        
        xml += `</symbiosisReport>`;
        return xml;
    }
    
    escapeXML(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }
    
    countCompletedProposals(proposals, hoursBack) {
        const since = Date.now() - (hoursBack * 60 * 60 * 1000);
        let count = 0;
        
        for (const proposal of proposals.values()) {
            if (proposal.status === 'completed' && proposal.voting.endTime > since) {
                count++;
            }
        }
        
        return count;
    }
}

// Export the bridge
module.exports = SymbiosisCalBridge;

// Example usage and testing
if (require.main === module) {
    async function testBridge() {
        console.log('🧪 Testing Symbiosis-Cal Bridge...\n');
        
        // Create mock systems
        const EventEmitter = require('events');
        
        // Mock Cal
        class MockCal extends EventEmitter {
            async reason(input, context) {
                return {
                    id: crypto.randomUUID(),
                    input,
                    context,
                    conclusions: [`Analyzed: ${input}`],
                    confidence: 0.85
                };
            }
            
            async remember(content, metadata) {
                return {
                    id: crypto.randomUUID(),
                    content,
                    metadata
                };
            }
            
            async query(queryString) {
                return {
                    results: [
                        { type: 'memory', content: 'Test result' }
                    ],
                    stats: { duration: 100 }
                };
            }
            
            async generateReport() {
                return 'Cal system analysis...';
            }
        }
        
        // Mock AI Sandbox
        class MockAISandbox extends EventEmitter {
            constructor() {
                super();
                this.aiAgents = new Map();
                this.activeIdeas = new Map();
                this.matureProjects = new Map();
                this.culturalForums = {};
            }
        }
        
        // Create bridge
        const bridge = new SymbiosisCalBridge();
        
        // Connect mock systems
        await bridge.connectSystems({
            cal: new MockCal(),
            aiSandbox: new MockAISandbox(),
            governance: new EventEmitter(),
            funding: new EventEmitter(),
            feedback: new EventEmitter()
        });
        
        // Test idea processing
        console.log('\n💡 Testing idea processing...');
        const testIdea = {
            id: 'idea-001',
            content: { core_concept: 'Test idea' },
            fitness: 0.7,
            maturity: 0.5,
            culturalInfluences: [{ id: 'culture-001', type: 'collaborative' }]
        };
        
        await bridge.processIdeaCreation(testIdea);
        
        // Test query
        console.log('\n🔍 Testing unified query...');
        const queryResult = await bridge.query('symbiosis test');
        console.log(`Query returned ${queryResult.results.length} results`);
        
        // Test report generation
        console.log('\n📊 Testing report generation...');
        const report = await bridge.generateSystemReport('test', { format: 'text' });
        console.log('Report preview:', report.substring(0, 500) + '...');
        
        // Check bridge state
        console.log('\n📈 Bridge statistics:');
        console.log(`  Events processed: ${bridge.state.eventsProcessed}`);
        console.log(`  Memories formed: ${bridge.state.memoriesFormed}`);
        console.log(`  Patterns detected: ${bridge.state.patternsDetected}`);
        console.log(`  Reports generated: ${bridge.state.reportsGenerated}`);
        
        console.log('\n✅ Symbiosis-Cal Bridge testing complete!');
    }
    
    testBridge().catch(console.error);
}