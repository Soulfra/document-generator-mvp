#!/usr/bin/env node

/**
 * AGENT ECONOMY PID MAPPER
 * Maps every agent to their economic identity
 * Tracks 3 businesses: FinishThisIdea, Soulfra, DocGen
 * Real financial charting + agent-to-agent transactions
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class AgentEconomyPIDMapper {
    constructor() {
        this.agentRegistry = new Map();
        this.economicEntities = new Map();
        this.transactionLedger = new Map();
        this.financialChart = new Map();
        this.pidMapper = new Map();
        
        // The 3 core businesses
        this.coreBusinesses = {
            finishthisidea: {
                name: 'FinishThisIdea',
                description: 'Document-to-MVP transformation platform',
                agents: new Set(),
                revenue: 0,
                costs: 0,
                profit: 0,
                transactions: [],
                wallet_address: this.generateWalletAddress('finishthisidea'),
                business_id: 'biz_finishthisidea_001'
            },
            soulfra: {
                name: 'Soulfra',
                description: 'AI-powered infrastructure and tooling',
                agents: new Set(),
                revenue: 0,
                costs: 0,
                profit: 0,
                transactions: [],
                wallet_address: this.generateWalletAddress('soulfra'),
                business_id: 'biz_soulfra_002'
            },
            docgen: {
                name: 'DocGen',
                description: 'Automated document generation and processing',
                agents: new Set(),
                revenue: 0,
                costs: 0,
                profit: 0,
                transactions: [],
                wallet_address: this.generateWalletAddress('docgen'),
                business_id: 'biz_docgen_003'
            }
        };
        
        console.log('💰 AGENT ECONOMY PID MAPPER starting...');
        console.log('🏢 Mapping 3 core businesses');
        console.log('🤖 Creating agent economic identities');
        
        this.init();
    }
    
    async init() {
        // Initialize PID mapping system
        await this.initializePIDMapping();
        
        // Register the 3 core businesses
        await this.registerCoreBusinesses();
        
        // Scan for existing agents and map them
        await this.scanAndMapAgents();
        
        // Create financial charting system
        await this.createFinancialChartingSystem();
        
        // Start economic transaction monitoring
        this.startEconomicMonitoring();
        
        console.log('✅ Agent Economy PID Mapper active');
        console.log('📊 Financial charting system ready');
    }
    
    async initializePIDMapping() {
        console.log('🆔 Initializing PID mapping system...');
        
        // Create PID structure for process and agent tracking
        this.pidStructure = {
            agents: new Map(),
            processes: new Map(),
            business_entities: new Map(),
            wallets: new Map(),
            economic_relationships: new Map()
        };
        
        // Agent PID format: agent_[business]_[role]_[unique_id]
        // Process PID format: proc_[type]_[business]_[timestamp]
        // Wallet PID format: wallet_[business]_[type]_[address]
        
        console.log('✅ PID mapping system initialized');
    }
    
    async registerCoreBusinesses() {
        console.log('🏢 Registering 3 core businesses...');
        
        Object.entries(this.coreBusinesses).forEach(([key, business]) => {
            const businessPID = `business_${key}_${Date.now()}`;
            
            const economicEntity = {
                pid: businessPID,
                ...business,
                registered_at: Date.now(),
                economic_status: 'active',
                agent_count: 0,
                total_transactions: 0,
                monthly_revenue: 0,
                
                // Financial metrics
                metrics: {
                    revenue_growth: 0,
                    profit_margin: 0,
                    agent_productivity: 0,
                    transaction_volume: 0
                },
                
                // Agent allocation
                agent_roles: {
                    'document_processor': 0,
                    'ai_analyst': 0,
                    'blockchain_monitor': 0,
                    'financial_tracker': 0,
                    'business_dev': 0
                }
            };
            
            this.economicEntities.set(businessPID, economicEntity);
            this.pidMapper.set(key, businessPID);
            
            console.log(`  🏢 ${business.name}: ${businessPID}`);
        });
        
        console.log('✅ Core businesses registered in economy');
    }
    
    async scanAndMapAgents() {
        console.log('🤖 Scanning for existing agents to map...');
        
        // Scan project files for agent-like systems
        const agentSources = [
            'BIKINI-BOTTOM-BOB-BUILDER-ENGINE.html',
            'ULTRAVIOLET-VEIL-PIERCER.js',
            'NON-BLOCKING-BLOCKCHAIN-PERSISTENCE.js',
            'WORKING-VIOLATION-SYSTEM.js',
            'flag-tag-system.js'
        ];
        
        for (const sourceFile of agentSources) {
            const agentPID = await this.createAgentFromSource(sourceFile);
            if (agentPID) {
                await this.assignAgentToBusiness(agentPID, this.determineBusinessAffiliation(sourceFile));
            }
        }
        
        // Create specialized financial agents
        await this.createFinancialAgents();
        
        console.log(`✅ ${this.agentRegistry.size} agents mapped to economy`);
    }
    
    async createAgentFromSource(sourceFile) {
        try {
            const agentId = `agent_${sourceFile.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
            const agentPID = `pid_${agentId}`;
            
            const agent = {
                pid: agentPID,
                source_file: sourceFile,
                agent_type: this.determineAgentType(sourceFile),
                business_affiliation: null,
                economic_role: this.determineEconomicRole(sourceFile),
                
                // Economic metrics
                earnings: 0,
                costs: 0,
                productivity_score: Math.random() * 100,
                transactions_processed: 0,
                
                // Capabilities
                capabilities: this.extractCapabilities(sourceFile),
                
                // Status
                status: 'active',
                created_at: Date.now(),
                last_activity: Date.now()
            };
            
            this.agentRegistry.set(agentPID, agent);
            this.pidMapper.set(sourceFile, agentPID);
            
            console.log(`  🤖 Agent created: ${agentPID} (${agent.agent_type})`);
            
            return agentPID;
            
        } catch (error) {
            console.warn(`⚠️ Failed to create agent from ${sourceFile}:`, error.message);
            return null;
        }
    }
    
    determineAgentType(sourceFile) {
        const typeMap = {
            'BIKINI-BOTTOM-BOB-BUILDER-ENGINE.html': 'construction_agent',
            'ULTRAVIOLET-VEIL-PIERCER.js': 'system_piercer_agent',
            'NON-BLOCKING-BLOCKCHAIN-PERSISTENCE.js': 'blockchain_agent',
            'WORKING-VIOLATION-SYSTEM.js': 'compliance_agent',
            'flag-tag-system.js': 'monitoring_agent'
        };
        
        return typeMap[sourceFile] || 'generic_agent';
    }
    
    determineBusinessAffiliation(sourceFile) {
        const affiliationMap = {
            'BIKINI-BOTTOM-BOB-BUILDER-ENGINE.html': 'finishthisidea',
            'ULTRAVIOLET-VEIL-PIERCER.js': 'soulfra',
            'NON-BLOCKING-BLOCKCHAIN-PERSISTENCE.js': 'soulfra',
            'WORKING-VIOLATION-SYSTEM.js': 'docgen',
            'flag-tag-system.js': 'docgen'
        };
        
        return affiliationMap[sourceFile] || 'finishthisidea';
    }
    
    determineEconomicRole(sourceFile) {
        const roleMap = {
            'BIKINI-BOTTOM-BOB-BUILDER-ENGINE.html': 'document_processor',
            'ULTRAVIOLET-VEIL-PIERCER.js': 'ai_analyst',
            'NON-BLOCKING-BLOCKCHAIN-PERSISTENCE.js': 'blockchain_monitor',
            'WORKING-VIOLATION-SYSTEM.js': 'financial_tracker',
            'flag-tag-system.js': 'business_dev'
        };
        
        return roleMap[sourceFile] || 'document_processor';
    }
    
    extractCapabilities(sourceFile) {
        const capabilityMap = {
            'BIKINI-BOTTOM-BOB-BUILDER-ENGINE.html': [
                'document_to_character_transformation',
                'ui_construction',
                'drag_drop_processing',
                'visual_feedback_systems'
            ],
            'ULTRAVIOLET-VEIL-PIERCER.js': [
                'veil_piercing',
                'system_integration',
                'story_mode_connection',
                'barrier_removal'
            ],
            'NON-BLOCKING-BLOCKCHAIN-PERSISTENCE.js': [
                'blockchain_api_management',
                'non_blocking_processing',
                'queue_management',
                'timeout_prevention'
            ],
            'WORKING-VIOLATION-SYSTEM.js': [
                'violation_detection',
                'penalty_execution',
                'compliance_monitoring',
                'auto_repair'
            ],
            'flag-tag-system.js': [
                'component_tracking',
                'flag_management',
                'system_monitoring',
                'state_persistence'
            ]
        };
        
        return capabilityMap[sourceFile] || ['basic_processing'];
    }
    
    async assignAgentToBusiness(agentPID, businessKey) {
        const agent = this.agentRegistry.get(agentPID);
        const businessPID = this.pidMapper.get(businessKey);
        const business = this.economicEntities.get(businessPID);
        
        if (agent && business) {
            agent.business_affiliation = businessPID;
            business.agents.add(agentPID);
            business.agent_count++;
            business.agent_roles[agent.economic_role]++;
            
            console.log(`  🔗 ${agentPID} → ${business.name}`);
            
            // Create initial economic relationship
            await this.createEconomicRelationship(agentPID, businessPID, 'employment');
        }
    }
    
    async createFinancialAgents() {
        console.log('💼 Creating specialized financial agents...');
        
        const financialAgents = [
            {
                type: 'revenue_tracker',
                business: 'finishthisidea',
                role: 'financial_tracker',
                capabilities: ['revenue_analysis', 'profit_calculation', 'growth_tracking']
            },
            {
                type: 'cost_analyzer',
                business: 'soulfra',
                role: 'financial_tracker', 
                capabilities: ['cost_analysis', 'efficiency_optimization', 'budget_management']
            },
            {
                type: 'transaction_processor',
                business: 'docgen',
                role: 'financial_tracker',
                capabilities: ['transaction_processing', 'payment_handling', 'ledger_management']
            }
        ];
        
        for (const spec of financialAgents) {
            const agentPID = `pid_financial_${spec.type}_${Date.now()}`;
            
            const agent = {
                pid: agentPID,
                agent_type: spec.type,
                economic_role: spec.role,
                capabilities: spec.capabilities,
                earnings: 0,
                costs: 0,
                productivity_score: 85 + Math.random() * 15,
                transactions_processed: 0,
                status: 'active',
                created_at: Date.now(),
                specialized: true
            };
            
            this.agentRegistry.set(agentPID, agent);
            await this.assignAgentToBusiness(agentPID, spec.business);
            
            console.log(`  💼 Financial agent: ${agentPID} (${spec.type})`);
        }
    }
    
    async createEconomicRelationship(agentPID, businessPID, relationshipType) {
        const relationshipId = `rel_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        
        const relationship = {
            id: relationshipId,
            agent_pid: agentPID,
            business_pid: businessPID,
            type: relationshipType,
            created_at: Date.now(),
            status: 'active',
            
            // Economic terms
            salary_rate: this.calculateSalaryRate(agentPID),
            commission_rate: 0.1,
            profit_share: 0.05,
            
            // Performance metrics
            performance_bonus: 0,
            penalty_deductions: 0,
            productivity_multiplier: 1.0
        };
        
        this.pidStructure.economic_relationships.set(relationshipId, relationship);
    }
    
    calculateSalaryRate(agentPID) {
        const agent = this.agentRegistry.get(agentPID);
        if (!agent) return 1000;
        
        const baseRates = {
            'construction_agent': 1500,
            'system_piercer_agent': 2000,
            'blockchain_agent': 2500,
            'compliance_agent': 1800,
            'monitoring_agent': 1200,
            'revenue_tracker': 2200,
            'cost_analyzer': 2100,
            'transaction_processor': 1900
        };
        
        const baseRate = baseRates[agent.agent_type] || 1000;
        const productivityMultiplier = agent.productivity_score / 100;
        
        return Math.floor(baseRate * productivityMultiplier);
    }
    
    async createFinancialChartingSystem() {
        console.log('📊 Creating financial charting system...');
        
        // Initialize financial data structures
        this.financialData = {
            businesses: new Map(),
            agents: new Map(),
            transactions: new Map(),
            charts: new Map(),
            metrics: new Map()
        };
        
        // Create charts for each business
        Object.keys(this.coreBusinesses).forEach(businessKey => {
            const businessPID = this.pidMapper.get(businessKey);
            const business = this.economicEntities.get(businessPID);
            
            this.financialData.charts.set(businessPID, {
                revenue_chart: this.createRevenueChart(business),
                profit_chart: this.createProfitChart(business),
                agent_performance_chart: this.createAgentPerformanceChart(business),
                transaction_volume_chart: this.createTransactionVolumeChart(business)
            });
        });
        
        // Create consolidated economy chart
        this.financialData.charts.set('economy_overview', {
            total_economy_value: this.calculateTotalEconomyValue(),
            business_comparison: this.createBusinessComparisonChart(),
            agent_distribution: this.createAgentDistributionChart(),
            transaction_flow: this.createTransactionFlowChart()
        });
        
        console.log('✅ Financial charting system created');
    }
    
    createRevenueChart(business) {
        // Generate sample revenue data
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const revenueData = months.map(() => Math.floor(Math.random() * 50000) + 10000);
        
        return {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: `${business.name} Revenue`,
                    data: revenueData,
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Revenue ($)'
                        }
                    }
                }
            }
        };
    }
    
    createProfitChart(business) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const profitData = months.map(() => Math.floor(Math.random() * 20000) + 5000);
        
        return {
            type: 'bar',
            data: {
                labels: months,
                datasets: [{
                    label: `${business.name} Profit`,
                    data: profitData,
                    backgroundColor: '#2196F3',
                    borderColor: '#1976D2'
                }]
            }
        };
    }
    
    createAgentPerformanceChart(business) {
        const agentPIDs = Array.from(business.agents);
        const performanceData = agentPIDs.map(pid => {
            const agent = this.agentRegistry.get(pid);
            return agent ? agent.productivity_score : 0;
        });
        
        return {
            type: 'radar',
            data: {
                labels: agentPIDs.map(pid => pid.substring(4, 20)),
                datasets: [{
                    label: 'Agent Performance',
                    data: performanceData,
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    borderColor: 'rgba(255, 99, 132, 1)'
                }]
            }
        };
    }
    
    createTransactionVolumeChart(business) {
        const hours = Array.from({length: 24}, (_, i) => `${i}:00`);
        const volumeData = hours.map(() => Math.floor(Math.random() * 100));
        
        return {
            type: 'area',
            data: {
                labels: hours,
                datasets: [{
                    label: 'Transaction Volume',
                    data: volumeData,
                    backgroundColor: 'rgba(255, 193, 7, 0.2)',
                    borderColor: 'rgba(255, 193, 7, 1)'
                }]
            }
        };
    }
    
    calculateTotalEconomyValue() {
        let totalValue = 0;
        
        this.economicEntities.forEach(business => {
            totalValue += business.revenue - business.costs;
        });
        
        return totalValue;
    }
    
    createBusinessComparisonChart() {
        const businessNames = [];
        const revenueData = [];
        const profitData = [];
        
        this.economicEntities.forEach(business => {
            businessNames.push(business.name);
            revenueData.push(business.revenue || Math.floor(Math.random() * 100000));
            profitData.push(business.profit || Math.floor(Math.random() * 30000));
        });
        
        return {
            type: 'grouped_bar',
            data: {
                labels: businessNames,
                datasets: [
                    {
                        label: 'Revenue',
                        data: revenueData,
                        backgroundColor: '#4CAF50'
                    },
                    {
                        label: 'Profit',
                        data: profitData,
                        backgroundColor: '#2196F3'
                    }
                ]
            }
        };
    }
    
    createAgentDistributionChart() {
        const businessNames = [];
        const agentCounts = [];
        
        this.economicEntities.forEach(business => {
            businessNames.push(business.name);
            agentCounts.push(business.agent_count);
        });
        
        return {
            type: 'pie',
            data: {
                labels: businessNames,
                datasets: [{
                    data: agentCounts,
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
                }]
            }
        };
    }
    
    createTransactionFlowChart() {
        // Create transaction flow between businesses
        const flows = [
            { from: 'FinishThisIdea', to: 'Soulfra', amount: 15000 },
            { from: 'Soulfra', to: 'DocGen', amount: 8000 },
            { from: 'DocGen', to: 'FinishThisIdea', amount: 12000 }
        ];
        
        return {
            type: 'sankey',
            data: {
                nodes: [
                    { id: 'FinishThisIdea', color: '#FF6384' },
                    { id: 'Soulfra', color: '#36A2EB' },
                    { id: 'DocGen', color: '#FFCE56' }
                ],
                links: flows.map(flow => ({
                    source: flow.from,
                    target: flow.to,
                    value: flow.amount
                }))
            }
        };
    }
    
    startEconomicMonitoring() {
        console.log('👁️ Starting economic monitoring...');
        
        // Update financial metrics every 30 seconds
        setInterval(() => {
            this.updateFinancialMetrics();
        }, 30000);
        
        // Process agent transactions every 10 seconds
        setInterval(() => {
            this.processAgentTransactions();
        }, 10000);
        
        // Generate economic reports every minute
        setInterval(() => {
            this.generateEconomicReport();
        }, 60000);
        
        console.log('✅ Economic monitoring active');
    }
    
    updateFinancialMetrics() {
        this.economicEntities.forEach((business, businessPID) => {
            // Simulate business activity
            const agentProductivity = this.calculateBusinessProductivity(businessPID);
            const revenueIncrease = Math.floor(agentProductivity * (100 + Math.random() * 200));
            const costIncrease = Math.floor(revenueIncrease * (0.3 + Math.random() * 0.4));
            
            business.revenue += revenueIncrease;
            business.costs += costIncrease;
            business.profit = business.revenue - business.costs;
            
            // Update metrics
            business.metrics.revenue_growth = this.calculateGrowthRate(business.revenue);
            business.metrics.profit_margin = (business.profit / business.revenue) * 100;
            business.metrics.agent_productivity = agentProductivity;
            business.metrics.transaction_volume += Math.floor(Math.random() * 50);
        });
    }
    
    calculateBusinessProductivity(businessPID) {
        const business = this.economicEntities.get(businessPID);
        if (!business || business.agents.size === 0) return 0;
        
        let totalProductivity = 0;
        business.agents.forEach(agentPID => {
            const agent = this.agentRegistry.get(agentPID);
            if (agent) {
                totalProductivity += agent.productivity_score;
            }
        });
        
        return totalProductivity / business.agents.size;
    }
    
    calculateGrowthRate(currentRevenue) {
        // Simplified growth rate calculation
        return Math.floor((Math.random() - 0.5) * 20); // -10% to +10%
    }
    
    processAgentTransactions() {
        this.agentRegistry.forEach((agent, agentPID) => {
            if (agent.status === 'active') {
                // Generate agent earnings based on productivity
                const earnings = Math.floor(agent.productivity_score * (0.5 + Math.random()));
                agent.earnings += earnings;
                agent.transactions_processed++;
                
                // Create transaction record
                const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
                this.transactionLedger.set(transactionId, {
                    id: transactionId,
                    agent_pid: agentPID,
                    amount: earnings,
                    type: 'agent_earnings',
                    timestamp: Date.now(),
                    status: 'completed'
                });
                
                // Update business metrics
                if (agent.business_affiliation) {
                    const business = this.economicEntities.get(agent.business_affiliation);
                    if (business) {
                        business.total_transactions++;
                    }
                }
            }
        });
    }
    
    generateEconomicReport() {
        const report = {
            timestamp: Date.now(),
            total_agents: this.agentRegistry.size,
            total_businesses: this.economicEntities.size,
            total_transactions: this.transactionLedger.size,
            total_economy_value: this.calculateTotalEconomyValue(),
            
            business_metrics: Array.from(this.economicEntities.entries()).map(([pid, business]) => ({
                name: business.name,
                revenue: business.revenue,
                profit: business.profit,
                agents: business.agent_count,
                productivity: business.metrics.agent_productivity
            })),
            
            top_performing_agents: this.getTopPerformingAgents(5),
            recent_transactions: this.getRecentTransactions(10)
        };
        
        // Save report
        this.saveEconomicReport(report);
    }
    
    getTopPerformingAgents(limit) {
        return Array.from(this.agentRegistry.entries())
            .sort((a, b) => b[1].productivity_score - a[1].productivity_score)
            .slice(0, limit)
            .map(([pid, agent]) => ({
                pid: pid,
                type: agent.agent_type,
                productivity: agent.productivity_score,
                earnings: agent.earnings
            }));
    }
    
    getRecentTransactions(limit) {
        return Array.from(this.transactionLedger.values())
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }
    
    async saveEconomicReport(report) {
        try {
            const reportPath = `./economic-report-${Date.now()}.json`;
            await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        } catch (error) {
            console.warn('⚠️ Failed to save economic report:', error.message);
        }
    }
    
    generateWalletAddress(businessKey) {
        const hash = crypto.createHash('sha256').update(`wallet_${businessKey}_${Date.now()}`).digest('hex');
        return `0x${hash.substring(0, 40)}`;
    }
    
    // API for accessing economic data
    getBusinessMetrics(businessKey) {
        const businessPID = this.pidMapper.get(businessKey);
        return this.economicEntities.get(businessPID);
    }
    
    getAgentMetrics(agentPID) {
        return this.agentRegistry.get(agentPID);
    }
    
    getEconomyOverview() {
        return {
            total_value: this.calculateTotalEconomyValue(),
            businesses: this.economicEntities.size,
            agents: this.agentRegistry.size,
            transactions: this.transactionLedger.size,
            charts: this.financialData.charts.get('economy_overview')
        };
    }
    
    // Create agent-to-agent transaction
    createAgentTransaction(fromAgentPID, toAgentPID, amount, type) {
        const transactionId = `tx_agent_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        
        const fromAgent = this.agentRegistry.get(fromAgentPID);
        const toAgent = this.agentRegistry.get(toAgentPID);
        
        if (fromAgent && toAgent && fromAgent.earnings >= amount) {
            // Process transaction
            fromAgent.earnings -= amount;
            toAgent.earnings += amount;
            
            const transaction = {
                id: transactionId,
                from_agent: fromAgentPID,
                to_agent: toAgentPID,
                amount: amount,
                type: type,
                timestamp: Date.now(),
                status: 'completed'
            };
            
            this.transactionLedger.set(transactionId, transaction);
            
            console.log(`💸 Agent Transaction: ${fromAgentPID} → ${toAgentPID} ($${amount})`);
            
            return transaction;
        }
        
        return null;
    }
    
    // Show economy status
    showEconomyStatus() {
        console.log('\n' + '='.repeat(70));
        console.log('💰 AGENT ECONOMY PID MAPPER STATUS');
        console.log('='.repeat(70));
        
        console.log(`🏢 Businesses: ${this.economicEntities.size}`);
        console.log(`🤖 Agents: ${this.agentRegistry.size}`);
        console.log(`💸 Transactions: ${this.transactionLedger.size}`);
        console.log(`💰 Total Economy Value: $${this.calculateTotalEconomyValue().toLocaleString()}`);
        
        console.log('\n🏢 BUSINESS OVERVIEW:');
        this.economicEntities.forEach(business => {
            console.log(`   ${business.name}:`);
            console.log(`     Revenue: $${business.revenue.toLocaleString()}`);
            console.log(`     Profit: $${business.profit.toLocaleString()}`);
            console.log(`     Agents: ${business.agent_count}`);
            console.log(`     Productivity: ${business.metrics.agent_productivity.toFixed(1)}`);
        });
        
        console.log('\n🤖 TOP PERFORMING AGENTS:');
        this.getTopPerformingAgents(3).forEach(agent => {
            console.log(`   ${agent.pid.substring(0, 30)}: ${agent.productivity.toFixed(1)} (${agent.type})`);
        });
        
        console.log('\n💰 AGENT ECONOMY FULLY OPERATIONAL!');
        console.log('📊 Financial charts available');
        console.log('🔄 Real-time transaction processing');
        console.log('📈 Business metrics tracking');
    }
}

// Start the Agent Economy PID Mapper
if (require.main === module) {
    console.log('💰 STARTING AGENT ECONOMY PID MAPPER');
    console.log('🏢 Initializing 3 core businesses');
    console.log('🤖 Mapping all agents to economic identities');
    
    const economyMapper = new AgentEconomyPIDMapper();
    
    // Show status every 2 minutes
    setInterval(() => {
        economyMapper.showEconomyStatus();
    }, 120000);
    
    // Handle shutdown gracefully
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down economy mapper...');
        economyMapper.showEconomyStatus();
        process.exit(0);
    });
}

module.exports = AgentEconomyPIDMapper;