#!/usr/bin/env node

/**
 * ⚔️ FACTION RESOURCE ALLOCATOR
 * Manages resources across domains/factions with territory control and accent-based communication
 * Handles resource wars, diplomatic negotiations, and cross-faction trading
 */

import { EventEmitter } from 'events';
import { WebSocket } from 'ws';
import fetch from 'node-fetch';
import { createHash } from 'crypto';

class FactionResourceAllocator extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            maxResourcesPerFaction: config.maxResourcesPerFaction || 10000,
            diplomacyEnabled: config.diplomacyEnabled !== false,
            tradeEnabled: config.tradeEnabled !== false,
            territoryWarEnabled: config.territoryWarEnabled !== false,
            resourceDecayRate: config.resourceDecayRate || 0.01, // 1% per hour
            ...config
        };
        
        // Faction definitions with accents and personalities
        this.factions = new Map([
            ['tech', {
                name: 'Tech Collective',
                accent: 'silicon_valley',
                language: 'technical',
                personality: 'innovative',
                resources: { compute: 500, storage: 1000, bandwidth: 800, ai_models: 50 },
                territory: ['api.tech', 'dev.zone', 'ai.lab'],
                reputation: 0.8,
                allies: ['neutral'],
                enemies: ['traditional'],
                specialties: ['ai_development', 'cloud_computing', 'automation'],
                communication_style: {
                    greeting: 'sys.hello()',
                    agreement: 'ACK',
                    disagreement: 'ERROR 403',
                    negotiation: 'optimizing parameters...'
                }
            }],
            ['creative', {
                name: 'Creative Guild',
                accent: 'artistic',
                language: 'expressive',
                personality: 'imaginative',
                resources: { inspiration: 800, talent: 600, media: 400, platforms: 30 },
                territory: ['art.world', 'media.hub', 'design.space'],
                reputation: 0.7,
                allies: ['neutral'],
                enemies: ['corporate'],
                specialties: ['content_creation', 'design', 'storytelling'],
                communication_style: {
                    greeting: '✨ Greetings, fellow creator! ✨',
                    agreement: 'That resonates beautifully!',
                    disagreement: 'That lacks creative vision...',
                    negotiation: 'Let\'s paint a better picture...'
                }
            }],
            ['corporate', {
                name: 'Corporate Empire',
                accent: 'business',
                language: 'professional',
                personality: 'strategic',
                resources: { capital: 10000, workforce: 1500, infrastructure: 800, licenses: 100 },
                territory: ['biz.central', 'corp.net', 'finance.hub'],
                reputation: 0.6,
                allies: ['traditional'],
                enemies: ['creative'],
                specialties: ['resource_optimization', 'scaling', 'monetization'],
                communication_style: {
                    greeting: 'Good day. How may we optimize our synergies?',
                    agreement: 'That aligns with our strategic objectives.',
                    disagreement: 'That proposal lacks ROI justification.',
                    negotiation: 'Let\'s discuss the bottom line impact...'
                }
            }],
            ['traditional', {
                name: 'Traditional Order',
                accent: 'formal',
                language: 'classical',
                personality: 'conservative',
                resources: { heritage: 1200, wisdom: 900, stability: 1000, legacy_systems: 80 },
                territory: ['old.world', 'heritage.net', 'classic.domain'],
                reputation: 0.5,
                allies: ['corporate'],
                enemies: ['tech'],
                specialties: ['stability', 'proven_methods', 'risk_management'],
                communication_style: {
                    greeting: 'Honorable greetings, esteemed colleague.',
                    agreement: 'Indeed, this approach has proven merit.',
                    disagreement: 'Such innovations carry unacceptable risk.',
                    negotiation: 'Perhaps we might consider time-tested alternatives...'
                }
            }],
            ['neutral', {
                name: 'Neutral Federation',
                accent: 'diplomatic',
                language: 'balanced',
                personality: 'mediating',
                resources: { diplomacy: 800, mediation: 600, trade: 1000, information: 700 },
                territory: ['neutral.zone', 'trade.hub', 'embassy.net'],
                reputation: 0.9,
                allies: ['tech', 'creative'],
                enemies: [],
                specialties: ['negotiation', 'information_brokerage', 'conflict_resolution'],
                communication_style: {
                    greeting: 'Welcome, friend. How may we find common ground?',
                    agreement: 'This benefits all parties involved.',
                    disagreement: 'Perhaps we can find a middle path.',
                    negotiation: 'Let us seek a solution that serves everyone...'
                }
            }]
        ]);
        
        // Resource types and their properties
        this.resourceTypes = new Map([
            ['compute', { transferable: true, decayRate: 0.005, value: 10 }],
            ['storage', { transferable: true, decayRate: 0.001, value: 5 }],
            ['bandwidth', { transferable: true, decayRate: 0.01, value: 3 }],
            ['capital', { transferable: true, decayRate: 0.002, value: 1 }],
            ['talent', { transferable: false, decayRate: 0.02, value: 50 }],
            ['inspiration', { transferable: false, decayRate: 0.05, value: 20 }],
            ['wisdom', { transferable: false, decayRate: 0.001, value: 30 }],
            ['diplomacy', { transferable: false, decayRate: 0.01, value: 25 }]
        ]);
        
        // Territory control and conflicts
        this.territories = new Map();
        this.activeConflicts = new Map();
        this.tradeAgreements = new Map();
        this.diplomacyLog = [];
        
        // Resource allocation history
        this.allocationHistory = [];
        this.transferHistory = [];
        
        // Market dynamics
        this.resourceMarket = {
            prices: new Map(),
            supply: new Map(),
            demand: new Map(),
            trends: new Map()
        };
        
        // Initialize system
        this.init();
    }
    
    async init() {
        console.log('⚔️ Initializing Faction Resource Allocator...');
        
        // Initialize territories
        this.initializeTerritories();
        
        // Initialize resource market
        this.initializeMarket();
        
        // Start periodic processes
        this.startPeriodicProcesses();
        
        // Connect to other systems
        await this.connectSystems();
        
        console.log('✅ Faction Resource Allocator ready');
        this.displayFactionStatus();
    }
    
    initializeTerritories() {
        for (const [factionId, faction] of this.factions) {
            for (const territory of faction.territory) {
                this.territories.set(territory, {
                    controller: factionId,
                    contested: false,
                    resources: this.generateTerritoryResources(territory),
                    defense: Math.random() * 100 + 50,
                    population: Math.floor(Math.random() * 1000) + 100
                });
            }
        }
    }
    
    initializeMarket() {
        for (const [resourceType, properties] of this.resourceTypes) {
            this.resourceMarket.prices.set(resourceType, properties.value);
            this.resourceMarket.supply.set(resourceType, this.calculateTotalSupply(resourceType));
            this.resourceMarket.demand.set(resourceType, Math.floor(Math.random() * 1000) + 500);
            this.resourceMarket.trends.set(resourceType, 'stable');
        }
    }
    
    startPeriodicProcesses() {
        // Resource decay
        setInterval(() => {
            this.processResourceDecay();
        }, 60000); // Every minute
        
        // Market updates
        setInterval(() => {
            this.updateMarket();
        }, 30000); // Every 30 seconds
        
        // Territory management
        setInterval(() => {
            this.processTerritoryEvents();
        }, 120000); // Every 2 minutes
        
        // Diplomatic updates
        setInterval(() => {
            this.processDiplomacy();
        }, 180000); // Every 3 minutes
    }
    
    async connectSystems() {
        // Connect to Executive OS for decision integration
        try {
            this.executiveConnection = new WebSocket('ws://localhost:9001');
            this.executiveConnection.on('open', () => {
                console.log('🔗 Connected to Executive OS');
            });
        } catch (error) {
            console.warn('⚠️ Executive OS not available');
        }
        
        // Connect to REST API for resource queries
        this.restAPI = {
            baseUrl: 'http://localhost:8200',
            updateFactionResources: async (factionId, resources) => {
                try {
                    await fetch(`${this.restAPI.baseUrl}/api/factions/${factionId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ resources })
                    });
                } catch (error) {
                    console.error('Failed to update faction resources:', error);
                }
            }
        };
    }
    
    // Resource allocation methods
    
    async allocateResources(request) {
        const {
            fromFaction,
            toFaction,
            resourceType,
            amount,
            reason = 'manual_allocation',
            priority = 'normal'
        } = request;
        
        console.log(`💰 Resource allocation request: ${amount} ${resourceType} from ${fromFaction} to ${toFaction}`);
        
        // Validate request
        const validation = this.validateAllocation(request);
        if (!validation.valid) {
            throw new Error(validation.error);
        }
        
        // Check if resource is transferable
        const resourceProps = this.resourceTypes.get(resourceType);
        if (!resourceProps.transferable) {
            throw new Error(`Resource type ${resourceType} is not transferable`);
        }
        
        // Check faction relationships
        const relationship = this.getFactionRelationship(fromFaction, toFaction);
        if (relationship === 'enemy' && !request.forced) {
            throw new Error('Cannot allocate resources to enemy faction without forced override');
        }
        
        // Calculate costs and fees
        const costs = this.calculateTransferCosts(request, relationship);
        
        // Execute transfer
        const transfer = await this.executeTransfer(request, costs);
        
        // Log allocation
        this.allocationHistory.push({
            id: transfer.id,
            ...request,
            costs,
            timestamp: new Date(),
            status: 'completed'
        });
        
        // Update faction relationships
        this.updateRelationshipFromTransfer(fromFaction, toFaction, amount, resourceType);
        
        // Emit event
        this.emit('resource:allocated', transfer);
        
        // Send diplomatic message
        this.sendDiplomaticMessage(fromFaction, toFaction, 'resource_transfer', {
            resourceType,
            amount,
            message: this.generateTransferMessage(fromFaction, toFaction, resourceType, amount)
        });
        
        return transfer;
    }
    
    async requestResources(request) {
        const {
            requestingFaction,
            targetFaction,
            resourceType,
            amount,
            offer = {},
            urgency = 'normal',
            justification = 'operational_needs'
        } = request;
        
        console.log(`🤝 Resource request: ${requestingFaction} requests ${amount} ${resourceType} from ${targetFaction}`);
        
        // Check faction relationships
        const relationship = this.getFactionRelationship(requestingFaction, targetFaction);
        
        // Calculate likelihood of acceptance
        const acceptanceProbability = this.calculateAcceptanceProbability(request, relationship);
        
        // Generate response based on faction personality
        const response = await this.generateFactionResponse(targetFaction, request, acceptanceProbability);
        
        // Log diplomatic interaction
        this.diplomacyLog.push({
            type: 'resource_request',
            from: requestingFaction,
            to: targetFaction,
            request,
            response,
            timestamp: new Date()
        });
        
        // Execute if accepted
        if (response.accepted) {
            const allocation = await this.allocateResources({
                fromFaction: targetFaction,
                toFaction: requestingFaction,
                resourceType,
                amount: response.amount || amount,
                reason: 'diplomatic_agreement'
            });
            
            response.transfer = allocation;
        }
        
        this.emit('resource:requested', { request, response });
        
        return response;
    }
    
    async tradeResources(trade) {
        const {
            faction1,
            faction2,
            offer1, // { resourceType, amount }
            offer2, // { resourceType, amount }
            terms = {}
        } = trade;
        
        console.log(`🔄 Trade proposal: ${faction1} offers ${offer1.amount} ${offer1.resourceType} for ${offer2.amount} ${offer2.resourceType} from ${faction2}`);
        
        // Validate trade
        const validation = this.validateTrade(trade);
        if (!validation.valid) {
            throw new Error(validation.error);
        }
        
        // Calculate trade value
        const tradeValue = this.calculateTradeValue(offer1, offer2);
        
        // Check if trade is beneficial for both parties
        const faction1Benefit = this.calculateTradeBenefit(faction1, offer1, offer2);
        const faction2Benefit = this.calculateTradeBenefit(faction2, offer2, offer1);
        
        // Execute trade if both parties benefit
        if (faction1Benefit > 0 && faction2Benefit > 0) {
            const tradeId = `trade_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
            
            // Transfer resources
            await Promise.all([
                this.allocateResources({
                    fromFaction: faction1,
                    toFaction: faction2,
                    resourceType: offer1.resourceType,
                    amount: offer1.amount,
                    reason: `trade_${tradeId}`
                }),
                this.allocateResources({
                    fromFaction: faction2,
                    toFaction: faction1,
                    resourceType: offer2.resourceType,
                    amount: offer2.amount,
                    reason: `trade_${tradeId}`
                })
            ]);
            
            // Log trade
            this.transferHistory.push({
                id: tradeId,
                type: 'trade',
                ...trade,
                tradeValue,
                faction1Benefit,
                faction2Benefit,
                timestamp: new Date(),
                status: 'completed'
            });
            
            // Update relationships
            this.updateRelationshipFromTrade(faction1, faction2);
            
            this.emit('resource:traded', { tradeId, trade, tradeValue });
            
            return {
                success: true,
                tradeId,
                tradeValue,
                benefits: { [faction1]: faction1Benefit, [faction2]: faction2Benefit }
            };
        } else {
            return {
                success: false,
                reason: 'Trade not beneficial for one or both parties',
                benefits: { [faction1]: faction1Benefit, [faction2]: faction2Benefit }
            };
        }
    }
    
    // Territory management
    
    async contestTerritory(request) {
        const {
            attackingFaction,
            defendingFaction,
            territory,
            force = 100,
            strategy = 'direct_assault'
        } = request;
        
        console.log(`⚔️ Territory conflict: ${attackingFaction} attacks ${territory} controlled by ${defendingFaction}`);
        
        if (!this.config.territoryWarEnabled) {
            throw new Error('Territory wars are disabled');
        }
        
        const territoryData = this.territories.get(territory);
        if (!territoryData) {
            throw new Error('Territory not found');
        }
        
        if (territoryData.controller !== defendingFaction) {
            throw new Error('Defending faction does not control this territory');
        }
        
        // Calculate battle outcome
        const battleResult = this.resolveBattle(request, territoryData);
        
        // Update territory control
        if (battleResult.victory) {
            territoryData.controller = attackingFaction;
            territoryData.defense = battleResult.newDefense;
            
            // Update faction territories
            const attackingFactionData = this.factions.get(attackingFaction);
            const defendingFactionData = this.factions.get(defendingFaction);
            
            attackingFactionData.territory.push(territory);
            defendingFactionData.territory = defendingFactionData.territory.filter(t => t !== territory);
            
            console.log(`🏴 ${attackingFaction} has conquered ${territory}!`);
        } else {
            territoryData.defense += battleResult.defenseBonus;
            console.log(`🛡️ ${defendingFaction} successfully defended ${territory}`);
        }
        
        // Update faction relationships
        this.updateRelationshipFromConflict(attackingFaction, defendingFaction, battleResult.victory);
        
        // Log conflict
        const conflict = {
            id: `conflict_${Date.now()}`,
            type: 'territory_contest',
            ...request,
            result: battleResult,
            timestamp: new Date()
        };
        
        this.activeConflicts.set(conflict.id, conflict);
        
        this.emit('territory:contested', conflict);
        
        return conflict;
    }
    
    resolveBattle(request, territoryData) {
        const { attackingFaction, force, strategy } = request;
        
        const attackingFactionData = this.factions.get(attackingFaction);
        
        // Calculate attacking power
        let attackPower = force;
        
        // Strategy modifiers
        const strategyModifiers = {
            direct_assault: { power: 1.0, risk: 0.8 },
            stealth_infiltration: { power: 0.7, risk: 0.3 },
            siege_warfare: { power: 1.2, risk: 0.6 },
            diplomatic_pressure: { power: 0.5, risk: 0.1 }
        };
        
        const modifier = strategyModifiers[strategy] || strategyModifiers.direct_assault;
        attackPower *= modifier.power;
        
        // Faction speciality bonuses
        if (attackingFactionData.specialties.includes('automation') && strategy === 'direct_assault') {
            attackPower *= 1.3;
        }
        
        // Random factor
        const randomFactor = 0.7 + Math.random() * 0.6; // 0.7 to 1.3
        attackPower *= randomFactor;
        
        // Determine victory
        const victory = attackPower > territoryData.defense;
        
        // Calculate losses and gains
        const attackerLosses = Math.floor(force * modifier.risk * (victory ? 0.3 : 0.7));
        const defenderLosses = Math.floor(territoryData.defense * 0.4);
        
        return {
            victory,
            attackPower,
            defense: territoryData.defense,
            attackerLosses,
            defenderLosses,
            newDefense: victory ? Math.max(50, territoryData.defense - defenderLosses) : territoryData.defense + 20,
            defenseBonus: victory ? 0 : 30
        };
    }
    
    // Diplomatic methods
    
    async proposeDiplomaticAgreement(proposal) {
        const {
            proposingFaction,
            targetFaction,
            type, // 'alliance', 'trade_agreement', 'non_aggression', 'resource_sharing'
            terms,
            duration = '1_year'
        } = proposal;
        
        console.log(`🤝 Diplomatic proposal: ${proposingFaction} proposes ${type} with ${targetFaction}`);
        
        // Check current relationship
        const currentRelationship = this.getFactionRelationship(proposingFaction, targetFaction);
        
        // Calculate acceptance probability
        const acceptance = this.calculateDiplomaticAcceptance(proposal, currentRelationship);
        
        // Generate response
        const response = await this.generateDiplomaticResponse(targetFaction, proposal, acceptance);
        
        // Log diplomatic interaction
        this.diplomacyLog.push({
            type: 'diplomatic_proposal',
            from: proposingFaction,
            to: targetFaction,
            proposal,
            response,
            timestamp: new Date()
        });
        
        // Execute agreement if accepted
        if (response.accepted) {
            await this.executeDiplomaticAgreement(proposal, response);
        }
        
        this.emit('diplomacy:proposed', { proposal, response });
        
        return response;
    }
    
    async executeDiplomaticAgreement(proposal, response) {
        const agreementId = `agreement_${Date.now()}`;
        
        const agreement = {
            id: agreementId,
            ...proposal,
            ...response,
            startDate: new Date(),
            endDate: this.calculateEndDate(proposal.duration),
            status: 'active'
        };
        
        // Update faction relationships
        this.updateRelationshipFromAgreement(proposal.proposingFaction, proposal.targetFaction, proposal.type);
        
        // Store agreement
        this.tradeAgreements.set(agreementId, agreement);
        
        console.log(`📜 Diplomatic agreement executed: ${agreement.id}`);
        
        return agreement;
    }
    
    // Resource market methods
    
    updateMarket() {
        for (const [resourceType, _] of this.resourceTypes) {
            // Update supply based on faction production
            const supply = this.calculateTotalSupply(resourceType);
            this.resourceMarket.supply.set(resourceType, supply);
            
            // Update demand based on faction needs
            const demand = this.calculateTotalDemand(resourceType);
            this.resourceMarket.demand.set(resourceType, demand);
            
            // Update price based on supply/demand
            const currentPrice = this.resourceMarket.prices.get(resourceType);
            const supplyDemandRatio = supply / demand;
            
            let newPrice = currentPrice;
            if (supplyDemandRatio < 0.8) {
                newPrice *= 1.05; // Increase price if demand exceeds supply
            } else if (supplyDemandRatio > 1.2) {
                newPrice *= 0.95; // Decrease price if supply exceeds demand
            }
            
            this.resourceMarket.prices.set(resourceType, Math.max(1, newPrice));
            
            // Update trend
            const priceChange = (newPrice - currentPrice) / currentPrice;
            let trend = 'stable';
            if (priceChange > 0.02) trend = 'rising';
            else if (priceChange < -0.02) trend = 'falling';
            
            this.resourceMarket.trends.set(resourceType, trend);
        }
    }
    
    getMarketData() {
        const marketData = {};
        
        for (const [resourceType, _] of this.resourceTypes) {
            marketData[resourceType] = {
                price: this.resourceMarket.prices.get(resourceType),
                supply: this.resourceMarket.supply.get(resourceType),
                demand: this.resourceMarket.demand.get(resourceType),
                trend: this.resourceMarket.trends.get(resourceType)
            };
        }
        
        return marketData;
    }
    
    // Communication methods with accent support
    
    generateTransferMessage(fromFaction, toFaction, resourceType, amount) {
        const fromFactionData = this.factions.get(fromFaction);
        const style = fromFactionData.communication_style;
        
        const messages = {
            tech: `transfer_complete(${resourceType}, ${amount}, ${toFaction}); // Enjoy the upgrade!`,
            creative: `🎁 Sharing ${amount} units of ${resourceType} with you! May it inspire great things! ✨`,
            corporate: `As per our agreement, ${amount} ${resourceType} units have been transferred to optimize your operations.`,
            traditional: `In accordance with time-honored protocols, we hereby transfer ${amount} ${resourceType} units to your stewardship.`,
            neutral: `${amount} ${resourceType} units have been transferred as part of our mutual cooperation agreement.`
        };
        
        return messages[fromFaction] || `Transferred ${amount} ${resourceType} to ${toFaction}`;
    }
    
    generateFactionResponse(faction, request, acceptanceProbability) {
        const factionData = this.factions.get(faction);
        const style = factionData.communication_style;
        
        const willAccept = Math.random() < acceptanceProbability;
        
        if (willAccept) {
            const responses = {
                tech: `return { status: 'APPROVED', message: 'Resource allocation optimized successfully' };`,
                creative: `${style.agreement} This collaboration will create beautiful possibilities! 🌟`,
                corporate: `${style.agreement} The resource transfer has been approved with standard terms.`,
                traditional: `${style.agreement} Your request shall be honored according to established procedures.`,
                neutral: `${style.agreement} We are pleased to support this mutually beneficial arrangement.`
            };
            
            return {
                accepted: true,
                message: responses[faction] || style.agreement,
                amount: request.amount,
                conditions: this.generateAcceptanceConditions(faction, request)
            };
        } else {
            const rejections = {
                tech: `throw new Error('Insufficient resources or suboptimal allocation strategy');`,
                creative: `${style.disagreement} Perhaps we could explore more inspiring alternatives?`,
                corporate: `${style.disagreement} Current resource allocation priorities prevent this transfer.`,
                traditional: `${style.disagreement} We must decline this request at present.`,
                neutral: `We regret that current circumstances prevent us from fulfilling this request.`
            };
            
            return {
                accepted: false,
                message: rejections[faction] || style.disagreement,
                reason: this.generateRejectionReason(faction, request),
                alternative: this.suggestAlternative(faction, request)
            };
        }
    }
    
    generateDiplomaticResponse(faction, proposal, acceptance) {
        const factionData = this.factions.get(faction);
        const willAccept = Math.random() < acceptance.probability;
        
        if (willAccept) {
            return {
                accepted: true,
                message: `${factionData.communication_style.agreement} We accept this proposal.`,
                modifiedTerms: acceptance.suggestedModifications || {},
                conditions: this.generateDiplomaticConditions(faction, proposal)
            };
        } else {
            return {
                accepted: false,
                message: `${factionData.communication_style.disagreement} We cannot accept this proposal.`,
                reason: acceptance.rejectionReason,
                counterProposal: this.generateCounterProposal(faction, proposal)
            };
        }
    }
    
    // Calculation methods
    
    validateAllocation(request) {
        const { fromFaction, toFaction, resourceType, amount } = request;
        
        // Check if factions exist
        if (!this.factions.has(fromFaction)) {
            return { valid: false, error: `Source faction ${fromFaction} not found` };
        }
        
        if (!this.factions.has(toFaction)) {
            return { valid: false, error: `Target faction ${toFaction} not found` };
        }
        
        // Check if resource type exists
        if (!this.resourceTypes.has(resourceType)) {
            return { valid: false, error: `Resource type ${resourceType} not found` };
        }
        
        // Check if source faction has enough resources
        const sourceFaction = this.factions.get(fromFaction);
        const currentAmount = sourceFaction.resources[resourceType] || 0;
        
        if (currentAmount < amount) {
            return { valid: false, error: `Insufficient ${resourceType} resources. Available: ${currentAmount}, Requested: ${amount}` };
        }
        
        // Check transfer limits
        const maxTransfer = this.config.maxResourcesPerFaction * 0.1; // Max 10% of limit per transfer
        if (amount > maxTransfer) {
            return { valid: false, error: `Transfer amount exceeds maximum limit of ${maxTransfer}` };
        }
        
        return { valid: true };
    }
    
    calculateTransferCosts(request, relationship) {
        const { resourceType, amount } = request;
        const resourceProps = this.resourceTypes.get(resourceType);
        
        let baseCost = amount * resourceProps.value * 0.05; // 5% base transaction cost
        
        // Relationship modifier
        const relationshipModifiers = {
            ally: 0.5,
            neutral: 1.0,
            enemy: 2.0
        };
        
        baseCost *= relationshipModifiers[relationship] || 1.0;
        
        // Market conditions
        const trend = this.resourceMarket.trends.get(resourceType);
        if (trend === 'rising') baseCost *= 1.2;
        else if (trend === 'falling') baseCost *= 0.8;
        
        return {
            base: baseCost,
            transaction: baseCost * 0.1,
            relationship: baseCost * (relationshipModifiers[relationship] - 1),
            total: baseCost * 1.1
        };
    }
    
    async executeTransfer(request, costs) {
        const { fromFaction, toFaction, resourceType, amount } = request;
        
        const transferId = `transfer_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        
        // Update faction resources
        const sourceFaction = this.factions.get(fromFaction);
        const targetFaction = this.factions.get(toFaction);
        
        sourceFaction.resources[resourceType] -= amount;
        
        if (!targetFaction.resources[resourceType]) {
            targetFaction.resources[resourceType] = 0;
        }
        targetFaction.resources[resourceType] += amount;
        
        // Deduct costs from source faction
        if (!sourceFaction.resources.capital) {
            sourceFaction.resources.capital = 0;
        }
        sourceFaction.resources.capital -= costs.total;
        
        // Update external systems
        if (this.restAPI) {
            await this.restAPI.updateFactionResources(fromFaction, sourceFaction.resources);
            await this.restAPI.updateFactionResources(toFaction, targetFaction.resources);
        }
        
        return {
            id: transferId,
            ...request,
            costs,
            timestamp: new Date(),
            status: 'completed'
        };
    }
    
    getFactionRelationship(faction1, faction2) {
        const faction1Data = this.factions.get(faction1);
        if (!faction1Data) return 'neutral';
        
        if (faction1Data.allies.includes(faction2)) return 'ally';
        if (faction1Data.enemies.includes(faction2)) return 'enemy';
        return 'neutral';
    }
    
    calculateAcceptanceProbability(request, relationship) {
        let probability = 0.5; // Base probability
        
        // Relationship modifier
        const relationshipModifiers = {
            ally: 0.3,
            neutral: 0.0,
            enemy: -0.4
        };
        
        probability += relationshipModifiers[relationship];
        
        // Urgency modifier
        const urgencyModifiers = {
            low: -0.1,
            normal: 0.0,
            high: 0.2,
            critical: 0.4
        };
        
        probability += urgencyModifiers[request.urgency];
        
        // Offer modifier
        if (request.offer && Object.keys(request.offer).length > 0) {
            probability += 0.2;
        }
        
        // Resource scarcity modifier
        const targetFaction = this.factions.get(request.targetFaction);
        const resourceAmount = targetFaction.resources[request.resourceType] || 0;
        const resourceCapacity = this.config.maxResourcesPerFaction;
        
        if (resourceAmount / resourceCapacity < 0.3) {
            probability -= 0.3; // Less likely to give away scarce resources
        }
        
        return Math.max(0.1, Math.min(0.9, probability));
    }
    
    calculateTradeValue(offer1, offer2) {
        const price1 = this.resourceMarket.prices.get(offer1.resourceType) || 1;
        const price2 = this.resourceMarket.prices.get(offer2.resourceType) || 1;
        
        const value1 = offer1.amount * price1;
        const value2 = offer2.amount * price2;
        
        return {
            offer1Value: value1,
            offer2Value: value2,
            ratio: value1 / value2,
            fairTrade: Math.abs(value1 - value2) < Math.max(value1, value2) * 0.1
        };
    }
    
    calculateTradeBenefit(faction, giving, receiving) {
        const givingPrice = this.resourceMarket.prices.get(giving.resourceType) || 1;
        const receivingPrice = this.resourceMarket.prices.get(receiving.resourceType) || 1;
        
        const factionData = this.factions.get(faction);
        
        // Calculate current need for each resource
        const givingNeed = this.calculateResourceNeed(faction, giving.resourceType);
        const receivingNeed = this.calculateResourceNeed(faction, receiving.resourceType);
        
        // Calculate net benefit
        const cost = giving.amount * givingPrice * givingNeed;
        const benefit = receiving.amount * receivingPrice * receivingNeed;
        
        return benefit - cost;
    }
    
    calculateResourceNeed(faction, resourceType) {
        const factionData = this.factions.get(faction);
        const currentAmount = factionData.resources[resourceType] || 0;
        const capacity = this.config.maxResourcesPerFaction;
        
        // Higher need when resource is scarce
        const scarcity = 1 - (currentAmount / capacity);
        
        // Faction specialty modifier
        let specialtyMultiplier = 1.0;
        if (factionData.specialties.some(spec => spec.includes(resourceType))) {
            specialtyMultiplier = 1.5;
        }
        
        return scarcity * specialtyMultiplier;
    }
    
    calculateDiplomaticAcceptance(proposal, currentRelationship) {
        let probability = 0.5;
        
        // Relationship modifier
        if (currentRelationship === 'ally') probability += 0.3;
        else if (currentRelationship === 'enemy') probability -= 0.4;
        
        // Proposal type modifier
        const typeModifiers = {
            alliance: 0.1,
            trade_agreement: 0.2,
            non_aggression: 0.3,
            resource_sharing: 0.0
        };
        
        probability += typeModifiers[proposal.type] || 0;
        
        // Terms favorability
        if (proposal.terms && proposal.terms.favorability) {
            probability += proposal.terms.favorability - 0.5;
        }
        
        return {
            probability: Math.max(0.1, Math.min(0.9, probability)),
            rejectionReason: probability < 0.3 ? 'Terms not favorable' : null,
            suggestedModifications: probability < 0.6 ? this.generateModifications(proposal) : null
        };
    }
    
    // Periodic processes
    
    processResourceDecay() {
        for (const [factionId, faction] of this.factions) {
            for (const [resourceType, amount] of Object.entries(faction.resources)) {
                const resourceProps = this.resourceTypes.get(resourceType);
                if (resourceProps && amount > 0) {
                    const decay = amount * resourceProps.decayRate * this.config.resourceDecayRate;
                    faction.resources[resourceType] = Math.max(0, amount - decay);
                }
            }
        }
    }
    
    processTerritoryEvents() {
        // Random territory events
        const territories = Array.from(this.territories.keys());
        const randomTerritory = territories[Math.floor(Math.random() * territories.length)];
        const territoryData = this.territories.get(randomTerritory);
        
        if (Math.random() < 0.1) { // 10% chance per interval
            const eventTypes = ['resource_discovery', 'natural_disaster', 'population_growth', 'defense_upgrade'];
            const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
            
            this.processTerritoryEvent(randomTerritory, territoryData, eventType);
        }
    }
    
    processTerritoryEvent(territory, territoryData, eventType) {
        const controllingFaction = this.factions.get(territoryData.controller);
        
        switch (eventType) {
            case 'resource_discovery':
                const resourceTypes = Array.from(this.resourceTypes.keys());
                const discoveredResource = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
                const amount = Math.floor(Math.random() * 100) + 50;
                
                if (!controllingFaction.resources[discoveredResource]) {
                    controllingFaction.resources[discoveredResource] = 0;
                }
                controllingFaction.resources[discoveredResource] += amount;
                
                console.log(`💎 ${territory}: Discovered ${amount} ${discoveredResource} for ${territoryData.controller}`);
                break;
                
            case 'natural_disaster':
                const resourceType = Object.keys(controllingFaction.resources)[Math.floor(Math.random() * Object.keys(controllingFaction.resources).length)];
                const loss = Math.floor(controllingFaction.resources[resourceType] * 0.1);
                
                controllingFaction.resources[resourceType] -= loss;
                territoryData.defense -= 10;
                
                console.log(`🌪️ ${territory}: Natural disaster causes loss of ${loss} ${resourceType}`);
                break;
                
            case 'population_growth':
                territoryData.population += Math.floor(Math.random() * 50) + 10;
                territoryData.defense += 5;
                
                console.log(`👥 ${territory}: Population growth increases defense`);
                break;
                
            case 'defense_upgrade':
                territoryData.defense += Math.floor(Math.random() * 20) + 10;
                
                console.log(`🛡️ ${territory}: Defense systems upgraded`);
                break;
        }
        
        this.emit('territory:event', { territory, eventType, territoryData });
    }
    
    processDiplomacy() {
        // Process active agreements
        for (const [agreementId, agreement] of this.tradeAgreements) {
            if (agreement.endDate < new Date()) {
                agreement.status = 'expired';
                console.log(`📜 Agreement ${agreementId} has expired`);
                this.emit('diplomacy:expired', agreement);
            }
        }
        
        // Random diplomatic events
        if (Math.random() < 0.05) { // 5% chance per interval
            this.generateRandomDiplomaticEvent();
        }
    }
    
    generateRandomDiplomaticEvent() {
        const factions = Array.from(this.factions.keys());
        const faction1 = factions[Math.floor(Math.random() * factions.length)];
        let faction2 = factions[Math.floor(Math.random() * factions.length)];
        
        while (faction2 === faction1) {
            faction2 = factions[Math.floor(Math.random() * factions.length)];
        }
        
        const events = ['border_dispute', 'trade_opportunity', 'cultural_exchange', 'technology_sharing'];
        const eventType = events[Math.floor(Math.random() * events.length)];
        
        this.processDiplomaticEvent(faction1, faction2, eventType);
    }
    
    processDiplomaticEvent(faction1, faction2, eventType) {
        const relationship = this.getFactionRelationship(faction1, faction2);
        
        switch (eventType) {
            case 'border_dispute':
                if (relationship === 'enemy') {
                    console.log(`⚔️ Border dispute escalates between ${faction1} and ${faction2}`);
                    this.updateFactionRelationship(faction1, faction2, -0.1);
                }
                break;
                
            case 'trade_opportunity':
                if (relationship !== 'enemy') {
                    console.log(`🤝 Trade opportunity emerges between ${faction1} and ${faction2}`);
                    this.updateFactionRelationship(faction1, faction2, 0.05);
                }
                break;
                
            case 'cultural_exchange':
                console.log(`🎭 Cultural exchange between ${faction1} and ${faction2}`);
                this.updateFactionRelationship(faction1, faction2, 0.02);
                break;
                
            case 'technology_sharing':
                if (relationship === 'ally') {
                    console.log(`🔬 Technology sharing between ${faction1} and ${faction2}`);
                    this.updateFactionRelationship(faction1, faction2, 0.1);
                }
                break;
        }
        
        this.emit('diplomacy:event', { faction1, faction2, eventType, relationship });
    }
    
    // Utility methods
    
    generateTerritoryResources(territory) {
        const resources = {};
        const resourceTypes = Array.from(this.resourceTypes.keys());
        
        // Generate 2-4 random resource types for each territory
        const numResources = Math.floor(Math.random() * 3) + 2;
        
        for (let i = 0; i < numResources; i++) {
            const resourceType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
            const amount = Math.floor(Math.random() * 200) + 50;
            resources[resourceType] = amount;
        }
        
        return resources;
    }
    
    calculateTotalSupply(resourceType) {
        let total = 0;
        for (const [factionId, faction] of this.factions) {
            total += faction.resources[resourceType] || 0;
        }
        return total;
    }
    
    calculateTotalDemand(resourceType) {
        // Simplified demand calculation
        let total = 0;
        for (const [factionId, faction] of this.factions) {
            const need = this.calculateResourceNeed(factionId, resourceType);
            total += need * 1000; // Scale factor
        }
        return total;
    }
    
    updateRelationshipFromTransfer(fromFaction, toFaction, amount, resourceType) {
        const resourceValue = this.resourceMarket.prices.get(resourceType) * amount;
        const relationshipImpact = Math.min(0.05, resourceValue / 10000);
        
        this.updateFactionRelationship(fromFaction, toFaction, relationshipImpact);
    }
    
    updateRelationshipFromTrade(faction1, faction2) {
        this.updateFactionRelationship(faction1, faction2, 0.02);
    }
    
    updateRelationshipFromConflict(attacker, defender, attackerWon) {
        const impact = attackerWon ? -0.2 : -0.1;
        this.updateFactionRelationship(attacker, defender, impact);
    }
    
    updateRelationshipFromAgreement(faction1, faction2, agreementType) {
        const impacts = {
            alliance: 0.3,
            trade_agreement: 0.1,
            non_aggression: 0.05,
            resource_sharing: 0.15
        };
        
        const impact = impacts[agreementType] || 0.05;
        this.updateFactionRelationship(faction1, faction2, impact);
    }
    
    updateFactionRelationship(faction1, faction2, change) {
        const faction1Data = this.factions.get(faction1);
        const faction2Data = this.factions.get(faction2);
        
        // Update reputation
        faction1Data.reputation = Math.max(0, Math.min(1, faction1Data.reputation + change));
        faction2Data.reputation = Math.max(0, Math.min(1, faction2Data.reputation + change));
        
        // Update ally/enemy status based on relationship changes
        if (change > 0.2 && !faction1Data.allies.includes(faction2)) {
            faction1Data.allies.push(faction2);
            faction2Data.allies.push(faction1);
            
            // Remove from enemies if present
            faction1Data.enemies = faction1Data.enemies.filter(f => f !== faction2);
            faction2Data.enemies = faction2Data.enemies.filter(f => f !== faction1);
            
            console.log(`🤝 ${faction1} and ${faction2} are now allies`);
        } else if (change < -0.3 && !faction1Data.enemies.includes(faction2)) {
            faction1Data.enemies.push(faction2);
            faction2Data.enemies.push(faction1);
            
            // Remove from allies if present
            faction1Data.allies = faction1Data.allies.filter(f => f !== faction2);
            faction2Data.allies = faction2Data.allies.filter(f => f !== faction1);
            
            console.log(`⚔️ ${faction1} and ${faction2} are now enemies`);
        }
    }
    
    calculateEndDate(duration) {
        const durations = {
            '1_month': 30 * 24 * 60 * 60 * 1000,
            '3_months': 90 * 24 * 60 * 60 * 1000,
            '6_months': 180 * 24 * 60 * 60 * 1000,
            '1_year': 365 * 24 * 60 * 60 * 1000,
            '2_years': 730 * 24 * 60 * 60 * 1000
        };
        
        const durationMs = durations[duration] || durations['1_year'];
        return new Date(Date.now() + durationMs);
    }
    
    generateAcceptanceConditions(faction, request) {
        const conditions = [];
        
        if (request.urgency === 'critical') {
            conditions.push('Emergency protocols activated');
        }
        
        if (request.amount > 100) {
            conditions.push('Staged delivery over time');
        }
        
        return conditions;
    }
    
    generateRejectionReason(faction, request) {
        const reasons = [
            'Current resource allocation priorities',
            'Insufficient strategic benefit',
            'Faction security concerns',
            'Market timing not optimal'
        ];
        
        return reasons[Math.floor(Math.random() * reasons.length)];
    }
    
    suggestAlternative(faction, request) {
        return {
            resourceType: request.resourceType,
            amount: Math.floor(request.amount * 0.5),
            conditions: ['Reduced amount available immediately'],
            futureAvailability: 'Full amount may be available next quarter'
        };
    }
    
    generateDiplomaticConditions(faction, proposal) {
        const conditions = [];
        
        if (proposal.type === 'alliance') {
            conditions.push('Military cooperation clause');
            conditions.push('Shared intelligence agreement');
        } else if (proposal.type === 'trade_agreement') {
            conditions.push('Most favored nation status');
            conditions.push('Regular trade volume commitments');
        }
        
        return conditions;
    }
    
    generateCounterProposal(faction, proposal) {
        return {
            type: proposal.type,
            modifiedTerms: {
                duration: '6_months', // Shorter duration
                scope: 'limited', // Limited scope
                review_period: '3_months' // Regular review
            },
            additionalRequirements: ['Performance monitoring', 'Dispute resolution mechanism']
        };
    }
    
    generateModifications(proposal) {
        return {
            terms: {
                favorability: Math.min(0.8, (proposal.terms?.favorability || 0.5) + 0.1)
            },
            additionalBenefits: ['Technology sharing', 'Cultural exchange']
        };
    }
    
    validateTrade(trade) {
        const { faction1, faction2, offer1, offer2 } = trade;
        
        // Check if both factions exist
        if (!this.factions.has(faction1) || !this.factions.has(faction2)) {
            return { valid: false, error: 'One or both factions not found' };
        }
        
        // Check if both factions have the resources they're offering
        const faction1Data = this.factions.get(faction1);
        const faction2Data = this.factions.get(faction2);
        
        const faction1Amount = faction1Data.resources[offer1.resourceType] || 0;
        const faction2Amount = faction2Data.resources[offer2.resourceType] || 0;
        
        if (faction1Amount < offer1.amount) {
            return { valid: false, error: `${faction1} has insufficient ${offer1.resourceType}` };
        }
        
        if (faction2Amount < offer2.amount) {
            return { valid: false, error: `${faction2} has insufficient ${offer2.resourceType}` };
        }
        
        return { valid: true };
    }
    
    // Public API methods
    
    getFactionStatus(factionId) {
        const faction = this.factions.get(factionId);
        if (!faction) return null;
        
        return {
            ...faction,
            territories: faction.territory.map(t => ({
                name: t,
                ...this.territories.get(t)
            })),
            marketPosition: this.calculateMarketPosition(factionId),
            diplomaticStatus: this.getDiplomaticStatus(factionId)
        };
    }
    
    calculateMarketPosition(factionId) {
        const faction = this.factions.get(factionId);
        let totalValue = 0;
        
        for (const [resourceType, amount] of Object.entries(faction.resources)) {
            const price = this.resourceMarket.prices.get(resourceType) || 1;
            totalValue += amount * price;
        }
        
        return {
            totalValue,
            resourceDiversity: Object.keys(faction.resources).length,
            territoryCount: faction.territory.length
        };
    }
    
    getDiplomaticStatus(factionId) {
        const faction = this.factions.get(factionId);
        
        return {
            allies: faction.allies,
            enemies: faction.enemies,
            reputation: faction.reputation,
            activeAgreements: Array.from(this.tradeAgreements.values())
                .filter(a => a.proposingFaction === factionId || a.targetFaction === factionId)
                .length
        };
    }
    
    displayFactionStatus() {
        console.log('\n⚔️ Faction Status Report');
        console.log('========================');
        
        for (const [factionId, faction] of this.factions) {
            console.log(`\n${faction.name} (${factionId}):`);
            console.log(`  Accent: ${faction.accent} | Reputation: ${(faction.reputation * 100).toFixed(1)}%`);
            console.log(`  Territories: ${faction.territory.join(', ')}`);
            console.log(`  Resources: ${Object.entries(faction.resources).map(([type, amount]) => `${type}:${amount}`).join(', ')}`);
            console.log(`  Allies: ${faction.allies.join(', ') || 'None'} | Enemies: ${faction.enemies.join(', ') || 'None'}`);
        }
        
        console.log('\n💰 Resource Market:');
        for (const [resourceType, price] of this.resourceMarket.prices) {
            const trend = this.resourceMarket.trends.get(resourceType);
            console.log(`  ${resourceType}: $${price.toFixed(2)} (${trend})`);
        }
    }
    
    getSystemStatus() {
        return {
            factions: this.factions.size,
            territories: this.territories.size,
            activeConflicts: this.activeConflicts.size,
            activeAgreements: this.tradeAgreements.size,
            totalAllocations: this.allocationHistory.length,
            totalTrades: this.transferHistory.filter(t => t.type === 'trade').length,
            diplomacyEvents: this.diplomacyLog.length,
            marketData: this.getMarketData()
        };
    }
}

// Export for use
export default FactionResourceAllocator;

// Start if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const allocator = new FactionResourceAllocator();
    
    // Example operations
    setTimeout(async () => {
        console.log('\n🧪 Testing faction operations...');
        
        // Test resource allocation
        try {
            const allocation = await allocator.allocateResources({
                fromFaction: 'tech',
                toFaction: 'creative',
                resourceType: 'compute',
                amount: 50,
                reason: 'collaboration_project'
            });
            console.log('✅ Resource allocation successful:', allocation.id);
        } catch (error) {
            console.error('❌ Allocation failed:', error.message);
        }
        
        // Test trade
        try {
            const trade = await allocator.tradeResources({
                faction1: 'corporate',
                faction2: 'neutral',
                offer1: { resourceType: 'capital', amount: 1000 },
                offer2: { resourceType: 'diplomacy', amount: 100 }
            });
            console.log('✅ Trade completed:', trade.success);
        } catch (error) {
            console.error('❌ Trade failed:', error.message);
        }
        
        // Test diplomatic proposal
        try {
            const diplomacy = await allocator.proposeDiplomaticAgreement({
                proposingFaction: 'tech',
                targetFaction: 'creative',
                type: 'alliance',
                terms: { favorability: 0.7 },
                duration: '1_year'
            });
            console.log('✅ Diplomatic proposal:', diplomacy.accepted ? 'ACCEPTED' : 'REJECTED');
        } catch (error) {
            console.error('❌ Diplomacy failed:', error.message);
        }
        
        console.log('\n📊 Final system status:');
        console.log(allocator.getSystemStatus());
        
    }, 3000);
}