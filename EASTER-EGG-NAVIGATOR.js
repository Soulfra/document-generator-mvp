#!/usr/bin/env node

/**
 * 🍳 EASTER EGG NAVIGATOR
 * Status tracking breadcrumbs for database-readable navigation
 * 
 * This system creates "easter eggs" - status indicators and breadcrumbs that help
 * both users and the database understand "where we are" in the overall system.
 * 
 * 🎯 EASTER EGG TYPES:
 * - 🍳 Status Breadcrumbs: Track current system state and position
 * - 🗺️ Navigation Markers: Visual indicators for system orientation  
 * - 📊 Database Beacons: Machine-readable status for DB understanding
 * - 🎮 Progress Indicators: Show completion and advancement states
 * - 🔄 Flow Trackers: Monitor movement through system components
 * 
 * 🎮 FEATURES:
 * - Database-readable status tracking
 * - Visual navigation breadcrumbs
 * - Ring-aware position tracking
 * - Component completion indicators
 * - Flow state monitoring
 * - Auto-cleanup and maintenance
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const EventEmitter = require('events');
const RedisCharacterStream = require('./redis-character-stream');

class EasterEggNavigator extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.config = {
            // Easter Egg Settings
            easterEggBasePath: options.easterEggBasePath || './easter-eggs',
            breadcrumbRetention: options.breadcrumbRetention || 1000,
            maxBreadcrumbAge: options.maxBreadcrumbAge || 24 * 60 * 60 * 1000, // 24 hours
            
            // Database Integration
            enableDatabaseBeacons: options.enableDatabaseBeacons !== false,
            beaconUpdateInterval: options.beaconUpdateInterval || 5000,
            dbReadableFormat: options.dbReadableFormat !== false,
            
            // Visual Navigation
            enableVisualMarkers: options.enableVisualMarkers !== false,
            visualUpdateInterval: options.visualUpdateInterval || 2000,
            markerStyles: options.markerStyles || 'unicode',
            
            // Ring Integration
            ringAwareTracking: options.ringAwareTracking !== false,
            trackRingTransitions: options.trackRingTransitions !== false,
            ringMappings: {
                '-1': 'FOUNDATION',
                '0': 'MATHEMATICAL_CORE',
                '1': 'CORE_USER_DATA', 
                '2': 'GAME_MECHANICS',
                '3': 'VISUAL_RENDERING',
                '4': 'EXTRACTION_MODULAR',
                '5': 'BROADCAST_LAYER',
                '6': 'META_ORCHESTRATION'
            },
            
            // Flow Tracking
            enableFlowTracking: options.enableFlowTracking !== false,
            flowTrackingDepth: options.flowTrackingDepth || 10,
            trackComponentTransitions: options.trackComponentTransitions !== false
        };
        
        // Navigation State Management - memory optimized
        this.navigationState = {
            // Current Position Tracking
            currentPosition: {
                ring: null,
                component: null,
                circle: null,
                subcomponent: null,
                timestamp: Date.now()
            },
            
            // Breadcrumb Trail (limited size)
            breadcrumbTrail: [],
            navigationHistory: [],
            
            // Easter Egg Registry (memory limited)
            activeEasterEggs: new Map(),
            easterEggsByType: new Map(),
            easterEggsByRing: new Map(),
            
            // Database Beacons (use WeakMap for auto cleanup)
            databaseBeacons: new WeakMap(),
            beaconHistory: [],
            
            // Visual Markers (limited retention)
            visualMarkers: new Map(),
            markerPositions: new WeakMap(),
            
            // Flow Tracking (limited history)
            flowStates: new Map(),
            transitions: [],
            
            // Memory limits
            maxActiveEggs: 100,
            maxBeaconHistory: 50,
            maxTransitions: 100,
            
            // Status Indicators
            systemStatus: 'operational',
            componentStatuses: new Map(),
            ringStatuses: new Map()
        };
        
        // Easter Egg Templates for different purposes
        this.easterEggTemplates = {
            // Status Breadcrumbs
            POSITION_MARKER: {
                icon: '📍',
                type: 'position',
                category: 'breadcrumb',
                dbReadable: true,
                persistent: true,
                description: 'Current position in system hierarchy'
            },
            PROGRESS_INDICATOR: {
                icon: '📊',
                type: 'progress',
                category: 'status',
                dbReadable: true,
                persistent: true,
                description: 'Component completion progress'
            },
            FLOW_TRACKER: {
                icon: '🔄',
                type: 'flow',
                category: 'movement',
                dbReadable: true,
                persistent: false,
                description: 'Flow state and direction'
            },
            
            // Navigation Markers
            RING_TRANSITION: {
                icon: '🎯',
                type: 'transition',
                category: 'navigation',
                dbReadable: true,
                persistent: true,
                description: 'Ring-to-ring movement'
            },
            COMPONENT_ENTRY: {
                icon: '🚪',
                type: 'entry',
                category: 'navigation',
                dbReadable: true,
                persistent: false,
                description: 'Component entry point'
            },
            CIRCLE_POSITION: {
                icon: '⭕',
                type: 'circle',
                category: 'navigation',
                dbReadable: true,
                persistent: true,
                description: 'Position within symlink circle'
            },
            
            // Database Beacons
            DB_BEACON: {
                icon: '📡',
                type: 'beacon',
                category: 'database',
                dbReadable: true,
                persistent: true,
                description: 'Database status beacon'
            },
            HEALTH_BEACON: {
                icon: '💚',
                type: 'health',
                category: 'database',
                dbReadable: true,
                persistent: true,
                description: 'System health indicator'
            },
            
            // Achievement Markers
            MILESTONE_REACHED: {
                icon: '🏆',
                type: 'milestone',
                category: 'achievement',
                dbReadable: true,
                persistent: true,
                description: 'Major milestone completion'
            },
            CIRCLE_COMPLETED: {
                icon: '✅',
                type: 'completion',
                category: 'achievement',
                dbReadable: true,
                persistent: true,
                description: 'Symlink circle completion'
            },
            
            // Error/Warning Indicators
            WARNING_MARKER: {
                icon: '⚠️',
                type: 'warning',
                category: 'alert',
                dbReadable: true,
                persistent: true,
                description: 'System warning or issue'
            },
            ERROR_BEACON: {
                icon: '🚨',
                type: 'error',
                category: 'alert',
                dbReadable: true,
                persistent: true,
                description: 'System error indicator'
            }
        };
        
        // Database Beacon Schemas for structured status
        this.beaconSchemas = {
            SYSTEM_STATUS: {
                fields: ['timestamp', 'ring', 'component', 'status', 'health', 'completion'],
                format: 'json',
                updateFrequency: 'high'
            },
            NAVIGATION_STATE: {
                fields: ['timestamp', 'currentRing', 'currentComponent', 'previousRing', 'flowDirection'],
                format: 'json',
                updateFrequency: 'medium'
            },
            PROGRESS_METRICS: {
                fields: ['timestamp', 'componentsCompleted', 'circlesActive', 'overallProgress'],
                format: 'json',
                updateFrequency: 'low'
            },
            FLOW_ANALYTICS: {
                fields: ['timestamp', 'flowType', 'flowDirection', 'flowSpeed', 'participants'],
                format: 'json',
                updateFrequency: 'high'
            }
        };
        
        // Initialize Redis streaming
        this.redisStream = new RedisCharacterStream();
        
        console.log('🍳 EASTER EGG NAVIGATOR INITIALIZED');
        console.log('=================================');
        console.log('📍 Position tracking breadcrumbs active');
        console.log('📊 Database-readable status beacons enabled');
        console.log('🎯 Ring-aware navigation tracking online');
        console.log('🔄 Flow state monitoring active');
        console.log('🗺️ Visual navigation markers ready');
        console.log('🌊 Redis streaming enabled');
    }
    
    /**
     * 🍳 Place easter egg breadcrumb for navigation
     */
    async placeEasterEgg(type, data, location = null) {
        const template = this.easterEggTemplates[type];
        if (!template) {
            throw new Error(`Unknown easter egg type: ${type}`);
        }
        
        console.log(`🍳 Placing easter egg: ${template.icon} ${type}`);
        
        try {
            // Generate easter egg
            const easterEgg = {
                id: this.generateEasterEggId(type, data),
                type: type,
                template: template,
                icon: template.icon,
                category: template.category,
                data: data,
                location: location || this.calculateOptimalLocation(type, data),
                timestamp: Date.now(),
                ring: this.getCurrentRing(),
                component: this.getCurrentComponent(),
                dbReadable: template.dbReadable,
                persistent: template.persistent,
                metadata: {
                    breadcrumbIndex: this.navigationState.breadcrumbTrail.length,
                    navigationDepth: this.calculateNavigationDepth(),
                    flowContext: this.getCurrentFlowContext(),
                    ringTransition: this.detectRingTransition(data)
                }
            };
            
            // Store easter egg
            this.navigationState.activeEasterEggs.set(easterEgg.id, easterEgg);
            
            // Organize by type and ring
            if (!this.navigationState.easterEggsByType.has(type)) {
                this.navigationState.easterEggsByType.set(type, new Set());
            }
            this.navigationState.easterEggsByType.get(type).add(easterEgg.id);
            
            if (easterEgg.ring !== null) {
                if (!this.navigationState.easterEggsByRing.has(easterEgg.ring)) {
                    this.navigationState.easterEggsByRing.set(easterEgg.ring, new Set());
                }
                this.navigationState.easterEggsByRing.get(easterEgg.ring).add(easterEgg.id);
            }
            
            // Add to breadcrumb trail
            this.navigationState.breadcrumbTrail.unshift(easterEgg);
            this.maintainBreadcrumbRetention();
            
            // Create physical easter egg file for database reading
            if (template.dbReadable) {
                await this.createDatabaseReadableFile(easterEgg);
            }
            
            // Stream easter egg to Redis
            await this.redisStream.streamEasterEgg(easterEgg, 'public');
            
            // Create visual marker if enabled
            if (this.config.enableVisualMarkers) {
                await this.createVisualMarker(easterEgg);
            }
            
            // Update database beacon if applicable
            if (this.config.enableDatabaseBeacons) {
                await this.updateDatabaseBeacon(easterEgg);
            }
            
            // Emit easter egg placement event
            this.emit('easterEggPlaced', {
                easterEgg: easterEgg,
                navigationContext: this.getNavigationContext()
            });
            
            console.log(`✅ Easter egg placed: ${easterEgg.id}`);
            console.log(`   Location: ${easterEgg.location}`);
            console.log(`   Ring: ${easterEgg.ring || 'unassigned'}`);
            console.log(`   DB Readable: ${easterEgg.dbReadable}`);
            
            return easterEgg;
            
        } catch (error) {
            console.error(`❌ Failed to place easter egg:`, error);
            throw error;
        }
    }
    
    /**
     * 📍 Update current position in system
     */
    async updatePosition(ring, component, circle = null, subcomponent = null) {
        console.log(`📍 Updating position: Ring ${ring} → ${component}`);
        
        const previousPosition = { ...this.navigationState.currentPosition };
        
        // Update current position
        this.navigationState.currentPosition = {
            ring: ring,
            component: component,
            circle: circle,
            subcomponent: subcomponent,
            timestamp: Date.now()
        };
        
        // Add to navigation history
        this.navigationState.navigationHistory.unshift({
            from: previousPosition,
            to: this.navigationState.currentPosition,
            timestamp: Date.now(),
            transitionType: this.detectTransitionType(previousPosition, this.navigationState.currentPosition)
        });
        
        // Place position marker easter egg
        await this.placeEasterEgg('POSITION_MARKER', {
            ring: ring,
            component: component,
            circle: circle,
            subcomponent: subcomponent,
            previous: previousPosition
        });
        
        // Place ring transition marker if needed
        if (previousPosition.ring !== null && previousPosition.ring !== ring) {
            await this.placeEasterEgg('RING_TRANSITION', {
                fromRing: previousPosition.ring,
                toRing: ring,
                fromComponent: previousPosition.component,
                toComponent: component
            });
        }
        
        // Update component entry marker
        if (previousPosition.component !== component) {
            await this.placeEasterEgg('COMPONENT_ENTRY', {
                component: component,
                ring: ring,
                entryTime: Date.now()
            });
        }
        
        // Emit position update event
        this.emit('positionUpdated', {
            previous: previousPosition,
            current: this.navigationState.currentPosition,
            transitionType: this.detectTransitionType(previousPosition, this.navigationState.currentPosition)
        });
        
        return this.navigationState.currentPosition;
    }
    
    /**
     * 📊 Update progress indicator
     */
    async updateProgress(component, progress, milestone = null) {
        console.log(`📊 Updating progress: ${component} → ${(progress * 100).toFixed(1)}%`);
        
        // Update component status
        this.navigationState.componentStatuses.set(component, {
            progress: progress,
            milestone: milestone,
            updated: Date.now()
        });
        
        // Place progress indicator easter egg
        await this.placeEasterEgg('PROGRESS_INDICATOR', {
            component: component,
            progress: progress,
            milestone: milestone,
            ring: this.getCurrentRing()
        });
        
        // Place milestone marker if reached
        if (milestone) {
            await this.placeEasterEgg('MILESTONE_REACHED', {
                component: component,
                milestone: milestone,
                progress: progress
            });
        }
        
        // Emit progress update event
        this.emit('progressUpdated', {
            component: component,
            progress: progress,
            milestone: milestone
        });
        
        return progress;
    }
    
    /**
     * 🔄 Track flow state and movement
     */
    async trackFlow(flowType, flowData, direction = 'forward') {
        console.log(`🔄 Tracking flow: ${flowType} (${direction})`);
        
        const flowState = {
            id: this.generateFlowId(flowType, flowData),
            type: flowType,
            direction: direction,
            data: flowData,
            started: Date.now(),
            ring: this.getCurrentRing(),
            component: this.getCurrentComponent(),
            status: 'active'
        };
        
        // Store flow state
        this.navigationState.flowStates.set(flowState.id, flowState);
        
        // Place flow tracker easter egg
        await this.placeEasterEgg('FLOW_TRACKER', {
            flowId: flowState.id,
            flowType: flowType,
            direction: direction,
            data: flowData
        });
        
        // Track transition
        this.navigationState.transitions.push({
            flowId: flowState.id,
            timestamp: Date.now(),
            type: flowType,
            direction: direction
        });
        
        // Emit flow tracking event
        this.emit('flowTracked', flowState);
        
        return flowState;
    }
    
    /**
     * 📡 Create database beacon for status monitoring
     */
    async createDatabaseBeacon(beaconType, data) {
        const schema = this.beaconSchemas[beaconType];
        if (!schema) {
            throw new Error(`Unknown beacon type: ${beaconType}`);
        }
        
        console.log(`📡 Creating database beacon: ${beaconType}`);
        
        const beacon = {
            id: this.generateBeaconId(beaconType),
            type: beaconType,
            schema: schema,
            data: data,
            timestamp: Date.now(),
            ring: this.getCurrentRing(),
            component: this.getCurrentComponent(),
            format: schema.format,
            updateFrequency: schema.updateFrequency
        };
        
        // Structure data according to schema
        beacon.structuredData = this.structureBeaconData(data, schema);
        
        // Store beacon
        this.navigationState.databaseBeacons.set(beacon.id, beacon);
        
        // Add to beacon history
        this.navigationState.beaconHistory.unshift(beacon);
        this.maintainBeaconHistory();
        
        // Create physical beacon file
        await this.createPhysicalBeacon(beacon);
        
        // Place DB beacon easter egg
        await this.placeEasterEgg('DB_BEACON', {
            beaconId: beacon.id,
            beaconType: beaconType,
            data: beacon.structuredData
        });
        
        // Emit beacon creation event
        this.emit('databaseBeaconCreated', beacon);
        
        return beacon;
    }
    
    /**
     * 🗺️ Get navigation context for current position
     */
    getNavigationContext() {
        const context = {
            // Current Position
            currentPosition: { ...this.navigationState.currentPosition },
            
            // Breadcrumb Trail (last 10)
            breadcrumbs: this.navigationState.breadcrumbTrail.slice(0, 10).map(egg => ({
                id: egg.id,
                type: egg.type,
                icon: egg.icon,
                timestamp: egg.timestamp,
                ring: egg.ring,
                component: egg.component
            })),
            
            // Navigation History (last 5 transitions)
            recentTransitions: this.navigationState.navigationHistory.slice(0, 5),
            
            // Active Flows
            activeFlows: Array.from(this.navigationState.flowStates.values())
                .filter(flow => flow.status === 'active')
                .map(flow => ({
                    id: flow.id,
                    type: flow.type,
                    direction: flow.direction,
                    started: flow.started
                })),
            
            // System Status
            systemStatus: this.navigationState.systemStatus,
            ringStatuses: Object.fromEntries(this.navigationState.ringStatuses),
            
            // Statistics
            statistics: {
                totalEasterEggs: this.navigationState.activeEasterEggs.size,
                breadcrumbCount: this.navigationState.breadcrumbTrail.length,
                activeFlows: this.navigationState.flowStates.size,
                databaseBeacons: this.navigationState.databaseBeacons.size
            },
            
            // Database Readability
            dbReadableEggs: this.getDBReadableEasterEggs(),
            latestBeacons: this.getLatestBeacons(5),
            
            timestamp: Date.now()
        };
        
        return context;
    }
    
    /**
     * 📊 Get easter eggs organized for database consumption
     */
    getDBReadableEasterEggs() {
        const dbEggs = [];
        
        for (const easterEgg of this.navigationState.activeEasterEggs.values()) {
            if (easterEgg.dbReadable) {
                dbEggs.push({
                    id: easterEgg.id,
                    type: easterEgg.type,
                    category: easterEgg.category,
                    ring: easterEgg.ring,
                    component: easterEgg.component,
                    timestamp: easterEgg.timestamp,
                    location: easterEgg.location,
                    data: easterEgg.data,
                    metadata: easterEgg.metadata
                });
            }
        }
        
        return dbEggs.sort((a, b) => b.timestamp - a.timestamp);
    }
    
    /**
     * 🧹 Clean up old easter eggs and maintain system
     */
    async cleanupEasterEggs() {
        console.log('🧹 Cleaning up old easter eggs...');
        
        let cleaned = 0;
        const now = Date.now();
        
        for (const [eggId, easterEgg] of this.navigationState.activeEasterEggs) {
            const age = now - easterEgg.timestamp;
            
            // Remove non-persistent eggs older than max age
            if (!easterEgg.persistent && age > this.config.maxBreadcrumbAge) {
                await this.removeEasterEgg(eggId);
                cleaned++;
            }
        }
        
        // Maintain breadcrumb retention
        this.maintainBreadcrumbRetention();
        
        // Clean up old visual markers
        if (this.config.enableVisualMarkers) {
            await this.cleanupVisualMarkers();
        }
        
        console.log(`✅ Cleaned up ${cleaned} old easter eggs`);
        
        // Emit cleanup event
        this.emit('easterEggsCleanedUp', { cleaned: cleaned });
        
        return cleaned;
    }
    
    // Helper Methods and Utilities
    
    generateEasterEggId(type, data) {
        const hash = crypto.createHash('md5')
            .update(`${type}-${JSON.stringify(data)}-${Date.now()}`)
            .digest('hex')
            .substring(0, 8);
        return `egg_${type.toLowerCase()}_${hash}`;
    }
    
    generateFlowId(flowType, flowData) {
        return `flow_${flowType}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }
    
    generateBeaconId(beaconType) {
        return `beacon_${beaconType}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }
    
    calculateOptimalLocation(type, data) {
        const ring = this.getCurrentRing();
        const component = this.getCurrentComponent();
        
        if (ring !== null && component) {
            return path.join(this.config.easterEggBasePath, `ring-${ring}`, component, type.toLowerCase());
        }
        
        return path.join(this.config.easterEggBasePath, 'general', type.toLowerCase());
    }
    
    getCurrentRing() {
        return this.navigationState.currentPosition.ring;
    }
    
    getCurrentComponent() {
        return this.navigationState.currentPosition.component;
    }
    
    calculateNavigationDepth() {
        return this.navigationState.breadcrumbTrail.length;
    }
    
    getCurrentFlowContext() {
        const activeFlows = Array.from(this.navigationState.flowStates.values())
            .filter(flow => flow.status === 'active');
        
        return {
            activeFlowCount: activeFlows.length,
            flowTypes: activeFlows.map(flow => flow.type),
            lastTransition: this.navigationState.transitions[0] || null
        };
    }
    
    detectRingTransition(data) {
        const currentRing = this.getCurrentRing();
        if (data.fromRing !== undefined && data.toRing !== undefined) {
            return {
                occurred: data.fromRing !== data.toRing,
                from: data.fromRing,
                to: data.toRing
            };
        }
        return { occurred: false };
    }
    
    detectTransitionType(from, to) {
        if (from.ring !== to.ring) return 'ring_transition';
        if (from.component !== to.component) return 'component_transition';
        if (from.circle !== to.circle) return 'circle_transition';
        return 'position_update';
    }
    
    maintainBreadcrumbRetention() {
        if (this.navigationState.breadcrumbTrail.length > this.config.breadcrumbRetention) {
            this.navigationState.breadcrumbTrail = this.navigationState.breadcrumbTrail
                .slice(0, this.config.breadcrumbRetention);
        }
        
        // Also check active easter eggs limit
        if (this.navigationState.activeEasterEggs.size > this.navigationState.maxActiveEggs) {
            const eggs = Array.from(this.navigationState.activeEasterEggs.entries())
                .sort(([,a], [,b]) => a.timestamp - b.timestamp);
            const toDelete = eggs.slice(0, eggs.length - this.navigationState.maxActiveEggs);
            toDelete.forEach(([id]) => this.removeEasterEgg(id));
        }
        
        // Limit transitions
        if (this.navigationState.transitions.length > this.navigationState.maxTransitions) {
            this.navigationState.transitions = this.navigationState.transitions
                .slice(-this.navigationState.maxTransitions);
        }
    }
    
    maintainBeaconHistory() {
        if (this.navigationState.beaconHistory.length > 100) {
            this.navigationState.beaconHistory = this.navigationState.beaconHistory.slice(0, 100);
        }
    }
    
    structureBeaconData(data, schema) {
        const structured = {};
        for (const field of schema.fields) {
            structured[field] = data[field] || null;
        }
        return structured;
    }
    
    async createDatabaseReadableFile(easterEgg) {
        const filePath = path.join(easterEgg.location, `${easterEgg.id}.json`);
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        
        const dbData = {
            id: easterEgg.id,
            type: easterEgg.type,
            category: easterEgg.category,
            timestamp: easterEgg.timestamp,
            ring: easterEgg.ring,
            component: easterEgg.component,
            data: easterEgg.data,
            metadata: easterEgg.metadata,
            dbSchema: 'easter_egg_v1'
        };
        
        // Use streaming write to prevent memory buildup
        const writeStream = require('fs').createWriteStream(filePath);
        writeStream.write(JSON.stringify(dbData, null, 2));
        writeStream.end();
        
        return new Promise((resolve, reject) => {
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
        });
    }
    
    async createVisualMarker(easterEgg) {
        const marker = {
            id: easterEgg.id,
            icon: easterEgg.icon,
            position: this.calculateMarkerPosition(easterEgg),
            timestamp: easterEgg.timestamp
        };
        
        this.navigationState.visualMarkers.set(easterEgg.id, marker);
    }
    
    async createPhysicalBeacon(beacon) {
        const filePath = path.join(this.config.easterEggBasePath, 'beacons', `${beacon.id}.json`);
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        
        // Use streaming write for better memory usage
        const writeStream = require('fs').createWriteStream(filePath);
        writeStream.write(JSON.stringify(beacon.structuredData, null, 2));
        writeStream.end();
        
        return new Promise((resolve, reject) => {
            writeStream.on('finish', resolve);
            writeStream.on('error', reject);
        });
    }
    
    calculateMarkerPosition(easterEgg) {
        return {
            x: Math.random() * 100,
            y: Math.random() * 100,
            ring: easterEgg.ring
        };
    }
    
    async updateDatabaseBeacon(easterEgg) {
        if (easterEgg.category === 'database') {
            await this.createDatabaseBeacon('SYSTEM_STATUS', {
                timestamp: Date.now(),
                ring: easterEgg.ring,
                component: easterEgg.component,
                status: 'active',
                health: 0.95,
                completion: 0.8
            });
        }
    }
    
    getLatestBeacons(count) {
        return this.navigationState.beaconHistory
            .slice(0, count)
            .map(beacon => ({
                id: beacon.id,
                type: beacon.type,
                timestamp: beacon.timestamp,
                data: beacon.structuredData
            }));
    }
    
    async removeEasterEgg(eggId) {
        const easterEgg = this.navigationState.activeEasterEggs.get(eggId);
        if (easterEgg) {
            // Remove from active eggs
            this.navigationState.activeEasterEggs.delete(eggId);
            
            // Remove from type and ring maps
            if (this.navigationState.easterEggsByType.has(easterEgg.type)) {
                this.navigationState.easterEggsByType.get(easterEgg.type).delete(eggId);
            }
            
            if (easterEgg.ring && this.navigationState.easterEggsByRing.has(easterEgg.ring)) {
                this.navigationState.easterEggsByRing.get(easterEgg.ring).delete(eggId);
            }
            
            // Remove visual marker
            this.navigationState.visualMarkers.delete(eggId);
        }
    }
    
    async cleanupVisualMarkers() {
        // Clean up old visual markers
        const now = Date.now();
        for (const [markerId, marker] of this.navigationState.visualMarkers) {
            if (now - marker.timestamp > this.config.maxBreadcrumbAge) {
                this.navigationState.visualMarkers.delete(markerId);
            }
        }
    }
}

// Export for use
module.exports = EasterEggNavigator;

// Demo mode
if (require.main === module) {
    console.log('🍳 EASTER EGG NAVIGATOR - DEMO MODE');
    console.log('==================================\n');
    
    const navigator = new EasterEggNavigator({
        easterEggBasePath: './demo-easter-eggs',
        breadcrumbRetention: 50,
        enableDatabaseBeacons: true,
        enableVisualMarkers: true
    });
    
    // Demo: Navigate through system and place easter eggs
    console.log('🍳 Demo navigation with easter egg placement...\n');
    
    // Demo 1: Initial position
    console.log('1. Setting initial position:');
    navigator.updatePosition(6, 'META_ORCHESTRATOR').then(() => {
        console.log('✅ Position set in Ring 6');
    });
    
    // Demo 2: Update progress
    setTimeout(() => {
        console.log('\n2. Updating component progress:');
        navigator.updateProgress('META_ORCHESTRATOR', 0.75, 'initialization_complete').then(() => {
            console.log('✅ Progress updated to 75%');
        });
    }, 1000);
    
    // Demo 3: Track flow
    setTimeout(() => {
        console.log('\n3. Tracking system flow:');
        navigator.trackFlow('HIERARCHICAL_FLOW', {
            from: 'ring_6',
            to: 'ring_0',
            operation: 'transform_code'
        }, 'downward').then(() => {
            console.log('✅ Flow tracking activated');
        });
    }, 2000);
    
    // Demo 4: Ring transition
    setTimeout(() => {
        console.log('\n4. Transitioning to Ring 5:');
        navigator.updatePosition(5, 'SYMBOL_ORCHESTRATOR', 'main_circle').then(() => {
            console.log('✅ Ring transition completed');
        });
    }, 3000);
    
    // Demo 5: Create database beacon
    setTimeout(() => {
        console.log('\n5. Creating database beacon:');
        navigator.createDatabaseBeacon('SYSTEM_STATUS', {
            timestamp: Date.now(),
            ring: 5,
            component: 'SYMBOL_ORCHESTRATOR',
            status: 'operational',
            health: 0.98,
            completion: 0.85
        }).then(() => {
            console.log('✅ Database beacon created');
        });
    }, 4000);
    
    // Demo 6: Show navigation context
    setTimeout(() => {
        console.log('\n📊 Navigation Context Summary:');
        const context = navigator.getNavigationContext();
        
        console.log(`   Current Position: Ring ${context.currentPosition.ring} → ${context.currentPosition.component}`);
        console.log(`   Breadcrumbs: ${context.breadcrumbs.length} placed`);
        console.log(`   Recent Transitions: ${context.recentTransitions.length}`);
        console.log(`   Active Flows: ${context.activeFlows.length}`);
        console.log(`   DB Readable Eggs: ${context.dbReadableEggs.length}`);
        console.log(`   Database Beacons: ${context.statistics.databaseBeacons}`);
        
        console.log('\n🍳 Easter Egg Navigator Demo Complete!');
        console.log('     Status tracking breadcrumbs deployed ✅');
        console.log('     Database-readable navigation active ✅');
        console.log('     Ring-aware position tracking online ✅');
        console.log('     Flow state monitoring operational ✅');
        console.log('     System ready for navigation! 🗺️');
    }, 5000);
}