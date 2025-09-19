#!/usr/bin/env node

/**
 * NPC LOGISTICS MONITORING SYSTEM
 * 
 * Mirrors petroleum logistics systems but for gaming assets!
 * Just like oil companies track crude from wellhead to gas pump,
 * we track virtual assets from creation to player inventory.
 * 
 * The petroleum parallel:
 * - Upstream (Exploration/Production) = Game Development/Asset Creation
 * - Midstream (Transportation/Storage) = CDN/Server Infrastructure  
 * - Downstream (Refining/Retail) = Player Distribution/Monetization
 * 
 * "From pixels to players" - like "from wellhead to gas tank"
 */

const EventEmitter = require('events');
const WebSocket = require('ws');
const crypto = require('crypto');

class NPCLogisticsMonitor extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            // Pipeline network configuration
            pipelines: {
                capacity: 1000000, // Items per hour
                pressure: 100, // Network load percentage
                temperature: 'optimal' // System health
            },
            
            // Storage facilities (like tank farms)
            storage: {
                primaryCapacity: 50000000, // Total item storage
                bufferCapacity: 10000000, // Emergency overflow
                strategicReserve: 5000000 // Like SPR for gaming
            },
            
            // Refinery operations (item processing)
            refineries: {
                lootBoxRefinery: {
                    capacity: 10000, // Boxes per hour
                    yield: {
                        common: 0.75,
                        rare: 0.20,
                        epic: 0.04,
                        legendary: 0.01
                    }
                },
                currencyRefinery: {
                    capacity: 1000000, // Currency units per hour
                    exchangeRates: {
                        gold_to_gems: 100,
                        gems_to_premium: 10
                    }
                }
            },
            
            // Transport modes
            transport: {
                fiber: { speed: 'instant', capacity: 'unlimited', cost: 'high' },
                cdn: { speed: 'fast', capacity: 'high', cost: 'medium' },
                p2p: { speed: 'variable', capacity: 'medium', cost: 'low' }
            },
            
            // Monitoring intervals
            sampleRate: 1000, // 1 second
            reportingInterval: 60000, // 1 minute
            
            ...options
        };
        
        // Asset tracking systems
        this.assets = {
            upstream: new Map(), // Created assets
            midstream: new Map(), // In transit
            downstream: new Map(), // Delivered to players
            inventory: new Map() // Current locations
        };
        
        // Pipeline network
        this.pipelines = new Map();
        
        // Storage facilities
        this.storageFacilities = new Map();
        
        // Logistics metrics
        this.metrics = {
            totalAssetsCreated: 0,
            totalAssetsDelivered: 0,
            totalAssetsInTransit: 0,
            totalAssetsStored: 0,
            
            // Flow rates (like barrel/day)
            flowRates: {
                creation: 0,
                transportation: 0,
                delivery: 0
            },
            
            // Efficiency metrics
            efficiency: {
                pipelineUtilization: 0,
                storageUtilization: 0,
                deliverySuccess: 1.0
            },
            
            // Economic metrics
            economics: {
                transportCosts: 0,
                storageCosts: 0,
                processingCosts: 0,
                revenue: 0
            }
        };
        
        // Real-time monitoring
        this.monitoring = {
            alerts: [],
            anomalies: [],
            bottlenecks: [],
            leaks: [] // Lost assets!
        };
        
        // Initialize systems
        this.initialize();
    }
    
    /**
     * Initialize the logistics monitoring system
     */
    async initialize() {
        console.log('🚚 NPC LOGISTICS MONITORING SYSTEM');
        console.log('==================================');
        console.log('Tracking virtual assets from creation to consumption');
        console.log('');
        console.log('🏭 Upstream: Asset Creation & Development');
        console.log('🚢 Midstream: Transportation & Storage');
        console.log('⛽ Downstream: Distribution & Monetization');
        console.log('');
        
        // Create main pipelines
        this.createPipelineNetwork();
        
        // Initialize storage facilities
        this.initializeStorage();
        
        // Start monitoring
        this.startMonitoring();
        
        // Connect to other systems
        await this.connectToSystems();
        
        this.emit('logistics_ready', {
            pipelines: this.pipelines.size,
            storage: this.storageFacilities.size,
            capacity: this.calculateTotalCapacity()
        });
    }
    
    /**
     * Create the pipeline network
     */
    createPipelineNetwork() {
        // Main asset pipelines (like oil pipelines)
        const pipelines = [
            {
                id: 'keystone-xl-items',
                name: 'Keystone XL Items Pipeline',
                route: 'developers->cdn->players',
                capacity: 500000,
                length: 'transcontinental',
                status: 'operational'
            },
            {
                id: 'nord-stream-skins',
                name: 'Nord Stream Skins Pipeline',
                route: 'artists->processing->marketplace',
                capacity: 300000,
                length: 'regional',
                status: 'operational'
            },
            {
                id: 'trans-mountain-currency',
                name: 'Trans Mountain Currency Pipeline',
                route: 'economy->exchange->wallets',
                capacity: 1000000,
                length: 'international',
                status: 'operational'
            },
            {
                id: 'colonial-lootbox',
                name: 'Colonial Lootbox Pipeline',
                route: 'rng->refinery->inventory',
                capacity: 200000,
                length: 'local',
                status: 'operational'
            }
        ];
        
        pipelines.forEach(pipeline => {
            this.pipelines.set(pipeline.id, {
                ...pipeline,
                currentFlow: 0,
                pressure: 0,
                temperature: 'normal',
                lastMaintenance: new Date().toISOString(),
                incidents: []
            });
        });
        
        console.log(`🚰 Created ${this.pipelines.size} asset pipelines`);
    }
    
    /**
     * Initialize storage facilities
     */
    initializeStorage() {
        // Storage tanks (like Cushing, OK for gaming)
        const facilities = [
            {
                id: 'cushing-items-hub',
                name: 'Cushing Items Storage Hub',
                type: 'strategic',
                capacity: 10000000,
                location: 'central-servers',
                contents: new Map()
            },
            {
                id: 'rotterdam-skins-terminal',
                name: 'Rotterdam Skins Terminal',
                type: 'commercial',
                capacity: 5000000,
                location: 'eu-servers',
                contents: new Map()
            },
            {
                id: 'singapore-currency-vault',
                name: 'Singapore Currency Vault',
                type: 'financial',
                capacity: 100000000,
                location: 'asia-servers',
                contents: new Map()
            },
            {
                id: 'henry-hub-loot-depot',
                name: 'Henry Hub Loot Depot',
                type: 'distribution',
                capacity: 3000000,
                location: 'us-servers',
                contents: new Map()
            }
        ];
        
        facilities.forEach(facility => {
            this.storageFacilities.set(facility.id, {
                ...facility,
                currentInventory: 0,
                utilization: 0,
                turnoverRate: 0,
                lastAudit: new Date().toISOString()
            });
        });
        
        console.log(`🏗️ Initialized ${this.storageFacilities.size} storage facilities`);
    }
    
    /**
     * Start real-time monitoring
     */
    startMonitoring() {
        // Monitor pipeline flows
        setInterval(() => {
            this.monitorPipelines();
        }, this.config.sampleRate);
        
        // Generate reports
        setInterval(() => {
            this.generateLogisticsReport();
        }, this.config.reportingInterval);
        
        // Check for anomalies
        setInterval(() => {
            this.detectAnomalies();
        }, 5000);
        
        console.log('📊 Real-time monitoring activated');
    }
    
    /**
     * Track asset creation (upstream)
     */
    createAsset(assetData) {
        const asset = {
            id: crypto.randomUUID(),
            type: assetData.type,
            rarity: assetData.rarity || 'common',
            value: assetData.value || 1,
            created: new Date().toISOString(),
            creator: assetData.creator,
            status: 'created',
            location: 'upstream',
            trackingHistory: []
        };
        
        this.assets.upstream.set(asset.id, asset);
        this.metrics.totalAssetsCreated++;
        
        // Log creation
        asset.trackingHistory.push({
            timestamp: new Date().toISOString(),
            event: 'created',
            location: 'development',
            details: `Asset created by ${asset.creator}`
        });
        
        this.emit('asset_created', asset);
        
        // Queue for transportation
        this.queueForTransport(asset);
        
        return asset;
    }
    
    /**
     * Queue asset for transportation
     */
    queueForTransport(asset) {
        // Select appropriate pipeline
        const pipeline = this.selectPipeline(asset);
        
        if (pipeline) {
            // Move to midstream
            this.assets.upstream.delete(asset.id);
            this.assets.midstream.set(asset.id, asset);
            
            asset.status = 'in_transit';
            asset.location = 'midstream';
            asset.pipeline = pipeline.id;
            
            asset.trackingHistory.push({
                timestamp: new Date().toISOString(),
                event: 'entered_pipeline',
                location: pipeline.name,
                details: `Entered ${pipeline.name} for transport`
            });
            
            // Update pipeline metrics
            pipeline.currentFlow++;
            pipeline.pressure = (pipeline.currentFlow / pipeline.capacity) * 100;
            
            // Simulate transport time
            const transportTime = this.calculateTransportTime(asset, pipeline);
            setTimeout(() => {
                this.completeTransport(asset, pipeline);
            }, transportTime);
        } else {
            // No available pipeline, store temporarily
            this.storeAsset(asset);
        }
    }
    
    /**
     * Select appropriate pipeline for asset
     */
    selectPipeline(asset) {
        // Find pipeline with capacity
        let selectedPipeline = null;
        let lowestUtilization = 100;
        
        for (const [id, pipeline] of this.pipelines) {
            const utilization = (pipeline.currentFlow / pipeline.capacity) * 100;
            
            if (utilization < 90 && utilization < lowestUtilization) {
                selectedPipeline = pipeline;
                lowestUtilization = utilization;
            }
        }
        
        return selectedPipeline;
    }
    
    /**
     * Calculate transport time
     */
    calculateTransportTime(asset, pipeline) {
        // Base time depends on pipeline length
        let baseTime = 5000; // 5 seconds base
        
        if (pipeline.length === 'transcontinental') baseTime = 10000;
        else if (pipeline.length === 'international') baseTime = 15000;
        
        // Adjust for pipeline pressure
        const pressureMultiplier = 1 + (pipeline.pressure / 200);
        
        // High-value items get priority
        const priorityMultiplier = asset.rarity === 'legendary' ? 0.5 : 1;
        
        return baseTime * pressureMultiplier * priorityMultiplier;
    }
    
    /**
     * Complete asset transport
     */
    completeTransport(asset, pipeline) {
        // Move to downstream
        this.assets.midstream.delete(asset.id);
        this.assets.downstream.set(asset.id, asset);
        
        asset.status = 'delivered';
        asset.location = 'downstream';
        
        asset.trackingHistory.push({
            timestamp: new Date().toISOString(),
            event: 'exited_pipeline',
            location: pipeline.name,
            details: 'Ready for distribution'
        });
        
        // Update pipeline metrics
        pipeline.currentFlow--;
        pipeline.pressure = (pipeline.currentFlow / pipeline.capacity) * 100;
        
        // Update delivery metrics
        this.metrics.totalAssetsDelivered++;
        
        this.emit('asset_delivered', asset);
        
        // Process for final delivery
        this.processForDelivery(asset);
    }
    
    /**
     * Store asset in facility
     */
    storeAsset(asset, facilityId = null) {
        // Select storage facility
        const facility = facilityId ? 
            this.storageFacilities.get(facilityId) :
            this.selectStorageFacility(asset);
        
        if (facility && facility.currentInventory < facility.capacity) {
            facility.contents.set(asset.id, asset);
            facility.currentInventory++;
            facility.utilization = (facility.currentInventory / facility.capacity) * 100;
            
            asset.status = 'stored';
            asset.location = facility.id;
            
            asset.trackingHistory.push({
                timestamp: new Date().toISOString(),
                event: 'stored',
                location: facility.name,
                details: `Stored in ${facility.name}`
            });
            
            this.metrics.totalAssetsStored++;
            
            this.emit('asset_stored', { asset, facility });
        } else {
            // Storage full - alert!
            this.monitoring.alerts.push({
                type: 'storage_full',
                severity: 'high',
                message: 'All storage facilities at capacity',
                timestamp: new Date().toISOString()
            });
        }
    }
    
    /**
     * Select appropriate storage facility
     */
    selectStorageFacility(asset) {
        let selectedFacility = null;
        let lowestUtilization = 100;
        
        for (const [id, facility] of this.storageFacilities) {
            if (facility.utilization < lowestUtilization) {
                selectedFacility = facility;
                lowestUtilization = facility.utilization;
            }
        }
        
        return selectedFacility;
    }
    
    /**
     * Process asset for final delivery
     */
    processForDelivery(asset) {
        // Simulate processing (like refining)
        if (asset.type === 'lootbox') {
            this.refineLootbox(asset);
        } else if (asset.type === 'currency') {
            this.processCurrency(asset);
        } else {
            this.deliverToPlayer(asset);
        }
    }
    
    /**
     * Refine lootbox (like oil refining)
     */
    refineLootbox(lootbox) {
        const refinery = this.config.refineries.lootBoxRefinery;
        const contents = [];
        
        // Generate contents based on yield rates
        const roll = Math.random();
        let rarity;
        
        if (roll < refinery.yield.legendary) rarity = 'legendary';
        else if (roll < refinery.yield.legendary + refinery.yield.epic) rarity = 'epic';
        else if (roll < refinery.yield.legendary + refinery.yield.epic + refinery.yield.rare) rarity = 'rare';
        else rarity = 'common';
        
        // Create refined items
        const itemCount = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < itemCount; i++) {
            const item = this.createAsset({
                type: 'item',
                rarity: rarity,
                value: this.calculateItemValue(rarity),
                creator: 'lootbox_refinery'
            });
            contents.push(item);
        }
        
        lootbox.refinedContents = contents;
        lootbox.trackingHistory.push({
            timestamp: new Date().toISOString(),
            event: 'refined',
            location: 'lootbox_refinery',
            details: `Refined into ${contents.length} items`
        });
        
        this.emit('lootbox_refined', { lootbox, contents });
    }
    
    /**
     * Calculate item value based on rarity
     */
    calculateItemValue(rarity) {
        const values = {
            common: 1,
            rare: 10,
            epic: 100,
            legendary: 1000
        };
        return values[rarity] || 1;
    }
    
    /**
     * Process currency exchange
     */
    processCurrency(currency) {
        const refinery = this.config.refineries.currencyRefinery;
        
        // Apply exchange rates
        if (currency.fromType && currency.toType) {
            const rate = refinery.exchangeRates[`${currency.fromType}_to_${currency.toType}`];
            if (rate) {
                currency.convertedAmount = currency.amount * rate;
                currency.trackingHistory.push({
                    timestamp: new Date().toISOString(),
                    event: 'exchanged',
                    location: 'currency_refinery',
                    details: `Exchanged ${currency.amount} ${currency.fromType} to ${currency.convertedAmount} ${currency.toType}`
                });
            }
        }
        
        this.deliverToPlayer(currency);
    }
    
    /**
     * Deliver asset to player
     */
    deliverToPlayer(asset, playerId = null) {
        asset.status = 'delivered';
        asset.deliveredTo = playerId || 'player_' + Math.floor(Math.random() * 10000);
        asset.deliveredAt = new Date().toISOString();
        
        asset.trackingHistory.push({
            timestamp: asset.deliveredAt,
            event: 'delivered',
            location: 'player_inventory',
            details: `Delivered to ${asset.deliveredTo}`
        });
        
        // Update inventory tracking
        if (!this.assets.inventory.has(asset.deliveredTo)) {
            this.assets.inventory.set(asset.deliveredTo, []);
        }
        this.assets.inventory.get(asset.deliveredTo).push(asset);
        
        // Calculate transport costs
        const transportCost = this.calculateTransportCost(asset);
        this.metrics.economics.transportCosts += transportCost;
        
        // Generate revenue
        const revenue = asset.value * 1.5; // 50% markup
        this.metrics.economics.revenue += revenue;
        
        this.emit('asset_delivered_to_player', {
            asset,
            playerId: asset.deliveredTo,
            transportCost,
            revenue
        });
    }
    
    /**
     * Calculate transport cost
     */
    calculateTransportCost(asset) {
        // Cost based on distance and value
        const baseCost = 0.1;
        const valueFactor = Math.log10(asset.value + 1);
        const distanceFactor = asset.trackingHistory.length * 0.05;
        
        return baseCost * valueFactor * distanceFactor;
    }
    
    /**
     * Monitor pipeline health
     */
    monitorPipelines() {
        for (const [id, pipeline] of this.pipelines) {
            // Check for over-pressure
            if (pipeline.pressure > 80) {
                pipeline.temperature = 'hot';
                
                if (pipeline.pressure > 90) {
                    this.monitoring.alerts.push({
                        type: 'pipeline_pressure',
                        severity: 'critical',
                        pipeline: pipeline.name,
                        pressure: pipeline.pressure,
                        timestamp: new Date().toISOString()
                    });
                }
            } else {
                pipeline.temperature = 'normal';
            }
            
            // Update flow metrics
            this.metrics.flowRates.transportation = 
                Array.from(this.pipelines.values())
                    .reduce((sum, p) => sum + p.currentFlow, 0);
        }
        
        // Update utilization
        const totalCapacity = Array.from(this.pipelines.values())
            .reduce((sum, p) => sum + p.capacity, 0);
        this.metrics.efficiency.pipelineUtilization = 
            this.metrics.flowRates.transportation / totalCapacity;
    }
    
    /**
     * Detect anomalies in logistics
     */
    detectAnomalies() {
        // Check for asset leaks (lost in transit)
        const expectedInTransit = this.assets.midstream.size;
        const actualDelivered = this.metrics.totalAssetsDelivered;
        const created = this.metrics.totalAssetsCreated;
        
        const lossRate = 1 - (actualDelivered / (created - expectedInTransit));
        
        if (lossRate > 0.01) { // More than 1% loss
            this.monitoring.anomalies.push({
                type: 'asset_leak',
                severity: 'medium',
                lossRate: lossRate,
                timestamp: new Date().toISOString()
            });
        }
        
        // Check for bottlenecks
        for (const [id, pipeline] of this.pipelines) {
            if (pipeline.pressure > 95) {
                this.monitoring.bottlenecks.push({
                    location: pipeline.name,
                    severity: 'high',
                    utilization: pipeline.pressure,
                    timestamp: new Date().toISOString()
                });
            }
        }
    }
    
    /**
     * Generate logistics report
     */
    generateLogisticsReport() {
        const report = {
            timestamp: new Date().toISOString(),
            overview: {
                assetsCreated: this.metrics.totalAssetsCreated,
                assetsDelivered: this.metrics.totalAssetsDelivered,
                assetsInTransit: this.assets.midstream.size,
                assetsStored: this.metrics.totalAssetsStored
            },
            flowRates: { ...this.metrics.flowRates },
            efficiency: { ...this.metrics.efficiency },
            economics: { ...this.metrics.economics },
            alerts: this.monitoring.alerts.slice(-10),
            pipelines: Array.from(this.pipelines.values()).map(p => ({
                name: p.name,
                utilization: p.pressure,
                flow: p.currentFlow,
                status: p.temperature
            })),
            storage: Array.from(this.storageFacilities.values()).map(f => ({
                name: f.name,
                utilization: f.utilization,
                inventory: f.currentInventory
            }))
        };
        
        this.emit('logistics_report', report);
        
        // Clear old alerts
        if (this.monitoring.alerts.length > 100) {
            this.monitoring.alerts = this.monitoring.alerts.slice(-50);
        }
        
        return report;
    }
    
    /**
     * Connect to other systems
     */
    async connectToSystems() {
        // Connect to Gaming Standards Institute
        try {
            console.log('🔌 Connecting to Gaming Standards Institute...');
            // This would connect to GSI API endpoints
            this.emit('connected_to_gsi');
        } catch (error) {
            console.warn('⚠️ Could not connect to GSI');
        }
        
        // Connect to responsible gaming monitor
        try {
            console.log('🔌 Connecting to Responsible Gaming Monitor...');
            // Track high-value deliveries to problem gamblers
            this.on('asset_delivered_to_player', (data) => {
                if (data.asset.value > 100) {
                    this.emit('high_value_delivery', data);
                }
            });
        } catch (error) {
            console.warn('⚠️ Could not connect to gaming monitor');
        }
    }
    
    /**
     * Calculate total system capacity
     */
    calculateTotalCapacity() {
        const pipelineCapacity = Array.from(this.pipelines.values())
            .reduce((sum, p) => sum + p.capacity, 0);
        const storageCapacity = Array.from(this.storageFacilities.values())
            .reduce((sum, f) => sum + f.capacity, 0);
        
        return {
            pipeline: pipelineCapacity,
            storage: storageCapacity,
            total: pipelineCapacity + storageCapacity
        };
    }
    
    /**
     * Emergency shutdown (like pipeline shutdown)
     */
    emergencyShutdown(reason) {
        console.log(`🚨 EMERGENCY SHUTDOWN: ${reason}`);
        
        // Stop all pipelines
        for (const [id, pipeline] of this.pipelines) {
            pipeline.status = 'shutdown';
            pipeline.currentFlow = 0;
            pipeline.pressure = 0;
        }
        
        // Alert all connected systems
        this.emit('emergency_shutdown', {
            reason,
            timestamp: new Date().toISOString(),
            assetsInTransit: this.assets.midstream.size
        });
        
        // Move all in-transit assets to storage
        for (const [id, asset] of this.assets.midstream) {
            this.storeAsset(asset);
        }
    }
}

module.exports = NPCLogisticsMonitor;

// If run directly, start the monitor
if (require.main === module) {
    const monitor = new NPCLogisticsMonitor();
    
    // Simulate asset creation
    console.log('\n📦 Starting logistics simulation...\n');
    
    // Create various assets
    const assetTypes = [
        { type: 'item', rarity: 'common', value: 1 },
        { type: 'item', rarity: 'rare', value: 10 },
        { type: 'skin', rarity: 'epic', value: 50 },
        { type: 'lootbox', rarity: 'common', value: 5 },
        { type: 'currency', amount: 100, fromType: 'gold', toType: 'gems' }
    ];
    
    // Generate assets periodically
    setInterval(() => {
        const assetType = assetTypes[Math.floor(Math.random() * assetTypes.length)];
        monitor.createAsset({
            ...assetType,
            creator: 'game_server_' + Math.floor(Math.random() * 10)
        });
    }, 2000);
    
    // Show periodic reports
    setInterval(() => {
        const report = monitor.generateLogisticsReport();
        console.log('\n📊 LOGISTICS STATUS REPORT');
        console.log('========================');
        console.log(`Assets Created: ${report.overview.assetsCreated}`);
        console.log(`Assets Delivered: ${report.overview.assetsDelivered}`);
        console.log(`Assets In Transit: ${report.overview.assetsInTransit}`);
        console.log(`Assets Stored: ${report.overview.assetsStored}`);
        console.log('\nPipeline Status:');
        report.pipelines.forEach(p => {
            console.log(`  ${p.name}: ${p.utilization.toFixed(1)}% utilized, ${p.flow} items flowing`);
        });
        console.log('\nEconomics:');
        console.log(`  Transport Costs: $${report.economics.transportCosts.toFixed(2)}`);
        console.log(`  Revenue: $${report.economics.revenue.toFixed(2)}`);
        console.log(`  Profit Margin: ${((report.economics.revenue - report.economics.transportCosts) / report.economics.revenue * 100).toFixed(1)}%`);
        
        if (report.alerts.length > 0) {
            console.log('\n⚠️ ALERTS:');
            report.alerts.slice(-3).forEach(alert => {
                console.log(`  [${alert.severity.toUpperCase()}] ${alert.type}: ${alert.message || alert.pipeline || 'Check system'}`);
            });
        }
    }, 30000);
    
    // Handle shutdown
    process.on('SIGINT', () => {
        monitor.emergencyShutdown('User requested shutdown');
        process.exit(0);
    });
}