#!/usr/bin/env node

/**
 * GAME ACTION TRACKER
 * 
 * Comprehensive tracking system for all in-game actions, movements, and position changes.
 * Integrates with the Chat Action Stream Integrator to provide complete gameplay logging.
 * 
 * Features:
 * - Real-time movement tracking with position caching
 * - Skill usage and combat action logging
 * - Item interactions and inventory changes
 * - UI interactions and menu navigation
 * - Performance metrics and timing analysis
 * - Excel-compatible tabular output format
 */

const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

class GameActionTracker extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Tracking configuration
            enableMovementTracking: true,
            enableSkillTracking: true,
            enableCombatTracking: true,
            enableItemTracking: true,
            enableUITracking: true,
            enablePerformanceTracking: true,
            
            // Movement settings
            movementPrecision: 'high', // high, medium, low
            minMovementDistance: 1, // Minimum distance to log
            maxMovementHistory: 1000,
            enablePathOptimization: true,
            
            // Action settings
            trackMicroActions: false, // Track very small actions like mouse moves
            actionBatchSize: 50,
            actionFlushInterval: 5000, // ms
            
            // Performance settings
            enableTimingAnalysis: true,
            performanceBufferSize: 500,
            enableMemoryTracking: true,
            
            // Export settings
            autoSaveInterval: 300000, // 5 minutes
            compressionEnabled: true,
            
            ...config
        };
        
        // Action type definitions
        this.actionTypes = {
            // Movement actions
            movement: {
                walk: { importance: 'low', trackPath: true },
                run: { importance: 'medium', trackPath: true },
                teleport: { importance: 'high', trackPath: false },
                jump: { importance: 'medium', trackPath: true },
                climb: { importance: 'medium', trackPath: true },
                swim: { importance: 'medium', trackPath: true },
                fly: { importance: 'high', trackPath: true }
            },
            
            // Combat actions
            combat: {
                attack: { importance: 'high', trackTarget: true, trackDamage: true },
                block: { importance: 'medium', trackDamage: true },
                dodge: { importance: 'medium', trackTiming: true },
                cast_spell: { importance: 'high', trackMana: true, trackTarget: true },
                use_skill: { importance: 'high', trackCooldown: true },
                heal: { importance: 'high', trackAmount: true },
                buff: { importance: 'medium', trackDuration: true },
                debuff: { importance: 'medium', trackDuration: true }
            },
            
            // Item actions
            items: {
                pickup: { importance: 'medium', trackItem: true, trackValue: true },
                drop: { importance: 'low', trackItem: true },
                equip: { importance: 'high', trackItem: true, trackStats: true },
                unequip: { importance: 'medium', trackItem: true },
                use: { importance: 'medium', trackItem: true, trackConsumption: true },
                trade: { importance: 'high', trackItem: true, trackValue: true, trackPlayer: true },
                craft: { importance: 'high', trackRecipe: true, trackMaterials: true },
                enchant: { importance: 'high', trackItem: true, trackResult: true }
            },
            
            // UI actions  
            ui: {
                menu_open: { importance: 'low', trackMenu: true },
                menu_close: { importance: 'low', trackMenu: true },
                button_click: { importance: 'low', trackButton: true },
                tab_switch: { importance: 'low', trackTab: true },
                dialog_open: { importance: 'medium', trackDialog: true },
                dialog_close: { importance: 'low', trackDialog: true },
                settings_change: { importance: 'medium', trackSetting: true, trackValue: true }
            },
            
            // Social actions
            social: {
                party_join: { importance: 'high', trackPlayers: true },
                party_leave: { importance: 'medium', trackPlayers: true },
                guild_join: { importance: 'high', trackGuild: true },
                guild_leave: { importance: 'medium', trackGuild: true },
                friend_add: { importance: 'medium', trackPlayer: true },
                friend_remove: { importance: 'low', trackPlayer: true },
                whisper: { importance: 'medium', trackPlayer: true, trackMessage: true }
            }
        };
        
        // Tracking state
        this.trackingState = {
            sessionId: uuidv4(),
            startTime: Date.now(),
            isActive: false,
            
            // Action buffers
            actionBuffer: [],
            movementBuffer: [],
            performanceBuffer: [],
            
            // Current state
            currentPosition: { x: 0, y: 0, z: 0 },
            currentZone: 'unknown',
            currentCharacter: null,
            
            // Statistics
            totalActions: 0,
            totalMovement: 0,
            totalDistance: 0,
            sessionDuration: 0,
            
            // Performance metrics
            averageActionTime: 0,
            memoryUsage: 0,
            cpuUsage: 0
        };
        
        // Position tracking
        this.positionHistory = [];
        this.pathOptimizer = new PathOptimizer();
        this.movementAnalyzer = new MovementAnalyzer();
        
        // Performance tracking
        this.performanceMonitor = new PerformanceMonitor();
        this.timingAnalyzer = new TimingAnalyzer();
        
        // Auto-save timer
        this.autoSaveTimer = null;
        
        console.log('🎮 Game Action Tracker initialized');
        console.log(`📊 Tracking ${Object.keys(this.actionTypes).length} action categories`);
    }

    /**
     * Start tracking game actions
     */
    async startTracking(characterData = {}) {
        try {
            this.trackingState.isActive = true;
            this.trackingState.startTime = Date.now();
            this.trackingState.currentCharacter = characterData;
            
            // Initialize position
            if (characterData.position) {
                this.updatePosition(characterData.position, 'session_start');
            }
            
            // Start auto-save timer
            this.startAutoSave();
            
            // Start performance monitoring
            if (this.config.enablePerformanceTracking) {
                this.performanceMonitor.start();
            }
            
            // Log session start
            await this.trackAction({
                type: 'session',
                action: 'tracking_started',
                details: {
                    sessionId: this.trackingState.sessionId,
                    character: characterData,
                    config: this.config
                }
            });
            
            console.log('✅ Game action tracking started');
            this.emit('tracking_started', this.trackingState);
            
        } catch (error) {
            console.error('❌ Failed to start tracking:', error);
            throw error;
        }
    }

    /**
     * Track a game action
     */
    async trackAction(actionData) {
        if (!this.trackingState.isActive) {
            console.warn('⚠️ Tracking not active, ignoring action');
            return null;
        }
        
        try {
            const startTime = process.hrtime.bigint();
            
            // Create action record
            const action = this.createActionRecord(actionData, startTime);
            
            // Add to buffer
            this.trackingState.actionBuffer.push(action);
            this.trackingState.totalActions++;
            
            // Update position if movement action
            if (this.isMovementAction(action)) {
                await this.processMovementAction(action);
            }
            
            // Update performance metrics
            if (this.config.enablePerformanceTracking) {
                this.updatePerformanceMetrics(action, startTime);
            }
            
            // Flush buffer if needed
            if (this.shouldFlushBuffer()) {
                await this.flushActionBuffer();
            }
            
            // Emit action event
            this.emit('action_tracked', action);
            
            return action.id;
            
        } catch (error) {
            console.error('Error tracking action:', error);
            this.emit('tracking_error', { error, actionData });
            return null;
        }
    }

    /**
     * Track movement with path optimization
     */
    async trackMovement(movementData) {
        try {
            const previousPosition = { ...this.trackingState.currentPosition };
            const newPosition = movementData.position;
            
            // Calculate movement metrics
            const distance = this.calculateDistance(previousPosition, newPosition);
            const duration = movementData.duration || 0;
            const speed = duration > 0 ? distance / duration : 0;
            
            // Skip if movement too small
            if (distance < this.config.minMovementDistance) {
                return null;
            }
            
            // Create movement record
            const movement = {
                id: uuidv4(),
                timestamp: Date.now(),
                fromPosition: previousPosition,
                toPosition: newPosition,
                distance,
                duration,
                speed,
                movementType: movementData.type || 'walk',
                terrainType: movementData.terrain || 'normal',
                obstacles: movementData.obstacles || [],
                
                // Path analysis
                pathOptimal: this.pathOptimizer.isOptimal(previousPosition, newPosition),
                pathDeviation: this.pathOptimizer.calculateDeviation(previousPosition, newPosition),
                
                // Performance metrics
                smoothness: this.movementAnalyzer.calculateSmoothness(movementData.path),
                efficiency: this.movementAnalyzer.calculateEfficiency(previousPosition, newPosition, movementData.path),
                
                metadata: {
                    sessionId: this.trackingState.sessionId,
                    zone: this.trackingState.currentZone,
                    character: this.trackingState.currentCharacter?.name
                }
            };
            
            // Update position
            this.updatePosition(newPosition, movementData.type);
            
            // Add to movement buffer
            this.trackingState.movementBuffer.push(movement);
            this.trackingState.totalMovement++;
            this.trackingState.totalDistance += distance;
            
            // Trim movement history
            this.trimMovementHistory();
            
            this.emit('movement_tracked', movement);
            return movement.id;
            
        } catch (error) {
            console.error('Error tracking movement:', error);
            return null;
        }
    }

    /**
     * Track skill usage with timing analysis
     */
    async trackSkillUsage(skillData) {
        try {
            const skill = {
                id: uuidv4(),
                timestamp: Date.now(),
                skillName: skillData.name,
                skillLevel: skillData.level,
                skillType: skillData.type, // combat, crafting, magic, etc.
                
                // Usage details
                target: skillData.target,
                cost: skillData.cost, // mana, stamina, etc.
                cooldown: skillData.cooldown,
                castTime: skillData.castTime,
                
                // Results
                success: skillData.success !== false,
                damage: skillData.damage,
                healing: skillData.healing,
                experience: skillData.experience,
                effects: skillData.effects || [],
                
                // Timing analysis
                reactionTime: skillData.reactionTime,
                accuracy: skillData.accuracy,
                timing: this.timingAnalyzer.analyzeSkillTiming(skillData),
                
                // Context
                position: { ...this.trackingState.currentPosition },
                zone: this.trackingState.currentZone,
                
                metadata: {
                    sessionId: this.trackingState.sessionId,
                    character: this.trackingState.currentCharacter?.name,
                    skillRotation: this.getRecentSkills(5)
                }
            };
            
            // Track as action
            await this.trackAction({
                type: 'skill',
                action: 'skill_used',
                details: skill
            });
            
            this.emit('skill_tracked', skill);
            return skill.id;
            
        } catch (error) {
            console.error('Error tracking skill usage:', error);
            return null;
        }
    }

    /**
     * Track item interactions
     */
    async trackItemInteraction(itemData) {
        try {
            const interaction = {
                id: uuidv4(),
                timestamp: Date.now(),
                interactionType: itemData.type, // pickup, drop, use, equip, etc.
                
                // Item details
                item: {
                    name: itemData.item.name,
                    type: itemData.item.type,
                    rarity: itemData.item.rarity,
                    value: itemData.item.value,
                    quantity: itemData.item.quantity || 1
                },
                
                // Interaction details
                fromContainer: itemData.fromContainer, // inventory, ground, chest, etc.
                toContainer: itemData.toContainer,
                position: { ...this.trackingState.currentPosition },
                
                // Results
                success: itemData.success !== false,
                newStats: itemData.newStats, // if equipping
                inventoryChange: itemData.inventoryChange,
                
                // Context
                zone: this.trackingState.currentZone,
                inventoryState: itemData.inventoryState,
                
                metadata: {
                    sessionId: this.trackingState.sessionId,
                    character: this.trackingState.currentCharacter?.name,
                    recentItems: this.getRecentItemInteractions(10)
                }
            };
            
            // Track as action
            await this.trackAction({
                type: 'item',
                action: itemData.type,
                details: interaction
            });
            
            this.emit('item_interaction_tracked', interaction);
            return interaction.id;
            
        } catch (error) {
            console.error('Error tracking item interaction:', error);
            return null;
        }
    }

    /**
     * Track UI interactions
     */
    async trackUIInteraction(uiData) {
        try {
            const interaction = {
                id: uuidv4(),
                timestamp: Date.now(),
                uiType: uiData.type, // menu, button, dialog, etc.
                uiElement: uiData.element,
                action: uiData.action, // click, hover, drag, etc.
                
                // UI details
                elementId: uiData.elementId,
                elementText: uiData.elementText,
                elementPosition: uiData.elementPosition,
                
                // Interaction details
                mousePosition: uiData.mousePosition,
                keyPressed: uiData.keyPressed,
                modifiers: uiData.modifiers, // ctrl, shift, alt
                
                // Results
                navigationTo: uiData.navigationTo,
                stateChange: uiData.stateChange,
                
                // Performance
                responseTime: uiData.responseTime,
                renderTime: uiData.renderTime,
                
                metadata: {
                    sessionId: this.trackingState.sessionId,
                    character: this.trackingState.currentCharacter?.name,
                    currentScreen: uiData.currentScreen,
                    recentUI: this.getRecentUIInteractions(5)
                }
            };
            
            // Only track if not micro-action or micro-actions enabled
            if (this.config.trackMicroActions || !this.isMicroAction(interaction)) {
                await this.trackAction({
                    type: 'ui',
                    action: uiData.action,
                    details: interaction
                });
                
                this.emit('ui_interaction_tracked', interaction);
                return interaction.id;
            }
            
            return null;
            
        } catch (error) {
            console.error('Error tracking UI interaction:', error);
            return null;
        }
    }

    /**
     * Generate Excel-compatible tabular report
     */
    async generateReport(options = {}) {
        try {
            const reportData = {
                sessionInfo: this.getSessionInfo(),
                summary: this.generateSummary(),
                actionBreakdown: this.generateActionBreakdown(),
                movementAnalysis: this.generateMovementAnalysis(),
                performanceMetrics: this.generatePerformanceMetrics(),
                timelineData: this.generateTimelineData(options.timeRange),
                exportFormat: options.format || 'csv'
            };
            
            // Generate tabular data
            const tabularData = this.generateTabularData(reportData);
            
            // Export to file
            const filename = this.generateReportFilename(options.format || 'csv');
            const filepath = await this.exportTabularData(tabularData, filename, options.format || 'csv');
            
            this.emit('report_generated', { filepath, reportData });
            return { filepath, reportData };
            
        } catch (error) {
            console.error('Error generating report:', error);
            throw error;
        }
    }

    /**
     * Get real-time tracking statistics
     */
    getTrackingStatistics() {
        const currentTime = Date.now();
        const sessionDuration = currentTime - this.trackingState.startTime;
        
        return {
            sessionId: this.trackingState.sessionId,
            isActive: this.trackingState.isActive,
            sessionDuration,
            
            // Action statistics
            totalActions: this.trackingState.totalActions,
            actionsPerMinute: this.calculateActionsPerMinute(),
            actionBufferSize: this.trackingState.actionBuffer.length,
            
            // Movement statistics
            totalMovement: this.trackingState.totalMovement,
            totalDistance: this.trackingState.totalDistance,
            averageSpeed: this.calculateAverageSpeed(),
            currentPosition: this.trackingState.currentPosition,
            currentZone: this.trackingState.currentZone,
            
            // Performance statistics
            averageActionTime: this.trackingState.averageActionTime,
            memoryUsage: this.trackingState.memoryUsage,
            cpuUsage: this.trackingState.cpuUsage,
            
            // Efficiency metrics
            pathEfficiency: this.calculatePathEfficiency(),
            actionEfficiency: this.calculateActionEfficiency(),
            
            // Character info
            character: this.trackingState.currentCharacter
        };
    }

    // Helper methods and utilities...

    createActionRecord(actionData, startTime) {
        return {
            id: uuidv4(),
            timestamp: Date.now(),
            nanoTimestamp: startTime,
            sessionId: this.trackingState.sessionId,
            
            // Action classification
            type: actionData.type,
            action: actionData.action,
            category: this.getActionCategory(actionData.type, actionData.action),
            importance: this.getActionImportance(actionData.type, actionData.action),
            
            // Action details
            details: actionData.details || {},
            target: actionData.target,
            result: actionData.result,
            success: actionData.success !== false,
            
            // Context
            position: { ...this.trackingState.currentPosition },
            zone: this.trackingState.currentZone,
            character: this.trackingState.currentCharacter?.name,
            
            // Performance
            duration: actionData.duration,
            reactionTime: actionData.reactionTime,
            
            // Metadata
            tags: actionData.tags || [],
            metadata: actionData.metadata || {}
        };
    }

    updatePosition(newPosition, movementType = 'unknown') {
        const previousPosition = { ...this.trackingState.currentPosition };
        this.trackingState.currentPosition = { ...newPosition };
        
        // Add to position history
        this.positionHistory.push({
            timestamp: Date.now(),
            position: { ...newPosition },
            movementType,
            previousPosition
        });
        
        // Trim position history
        if (this.positionHistory.length > this.config.maxMovementHistory) {
            this.positionHistory.shift();
        }
    }

    calculateDistance(pos1, pos2) {
        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        const dz = (pos2.z || 0) - (pos1.z || 0);
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    isMovementAction(action) {
        return action.type === 'movement' || 
               (action.type === 'action' && this.actionTypes.movement[action.action]);
    }

    async processMovementAction(action) {
        if (action.details.position) {
            await this.trackMovement({
                position: action.details.position,
                type: action.action,
                duration: action.duration
            });
        }
    }

    shouldFlushBuffer() {
        return this.trackingState.actionBuffer.length >= this.config.actionBatchSize;
    }

    async flushActionBuffer() {
        if (this.trackingState.actionBuffer.length === 0) return;
        
        const actions = [...this.trackingState.actionBuffer];
        this.trackingState.actionBuffer = [];
        
        // Process batch
        this.emit('action_batch_flushed', actions);
        
        // Could save to database or file here
        return actions;
    }

    trimMovementHistory() {
        if (this.trackingState.movementBuffer.length > this.config.maxMovementHistory) {
            this.trackingState.movementBuffer.splice(0, 
                this.trackingState.movementBuffer.length - this.config.maxMovementHistory
            );
        }
    }

    getActionCategory(type, action) {
        return this.actionTypes[type]?.[action]?.category || 'general';
    }

    getActionImportance(type, action) {
        return this.actionTypes[type]?.[action]?.importance || 'medium';
    }

    updatePerformanceMetrics(action, startTime) {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1_000_000; // Convert to milliseconds
        
        // Update average action time
        const totalDuration = this.trackingState.averageActionTime * (this.trackingState.totalActions - 1) + duration;
        this.trackingState.averageActionTime = totalDuration / this.trackingState.totalActions;
        
        // Update memory usage
        const memUsage = process.memoryUsage();
        this.trackingState.memoryUsage = memUsage.heapUsed;
        
        // Add to performance buffer
        this.trackingState.performanceBuffer.push({
            timestamp: Date.now(),
            actionId: action.id,
            duration,
            memoryUsage: memUsage.heapUsed,
            actionType: action.type
        });
        
        // Trim performance buffer
        if (this.trackingState.performanceBuffer.length > this.config.performanceBufferSize) {
            this.trackingState.performanceBuffer.shift();
        }
    }

    isMicroAction(interaction) {
        const microActions = ['hover', 'mouse_move', 'scroll', 'focus', 'blur'];
        return microActions.includes(interaction.action);
    }

    getRecentSkills(count) {
        return this.trackingState.actionBuffer
            .filter(action => action.type === 'skill')
            .slice(-count)
            .map(action => action.details.skillName);
    }

    getRecentItemInteractions(count) {
        return this.trackingState.actionBuffer
            .filter(action => action.type === 'item')
            .slice(-count)
            .map(action => ({
                type: action.action,
                item: action.details.item.name
            }));
    }

    getRecentUIInteractions(count) {
        return this.trackingState.actionBuffer
            .filter(action => action.type === 'ui')
            .slice(-count)
            .map(action => action.details.uiElement);
    }

    calculateActionsPerMinute() {
        const sessionDuration = Date.now() - this.trackingState.startTime;
        const minutes = sessionDuration / 60000;
        return minutes > 0 ? this.trackingState.totalActions / minutes : 0;
    }

    calculateAverageSpeed() {
        const sessionDuration = Date.now() - this.trackingState.startTime;
        const seconds = sessionDuration / 1000;
        return seconds > 0 ? this.trackingState.totalDistance / seconds : 0;
    }

    calculatePathEfficiency() {
        if (this.positionHistory.length < 2) return 1;
        
        // Calculate efficiency based on path vs straight line distance
        let totalPath = 0;
        let totalStraight = 0;
        
        for (let i = 1; i < this.positionHistory.length; i++) {
            const prev = this.positionHistory[i - 1].position;
            const curr = this.positionHistory[i].position;
            totalPath += this.calculateDistance(prev, curr);
        }
        
        if (this.positionHistory.length > 1) {
            const first = this.positionHistory[0].position;
            const last = this.positionHistory[this.positionHistory.length - 1].position;
            totalStraight = this.calculateDistance(first, last);
        }
        
        return totalStraight > 0 ? totalStraight / totalPath : 1;
    }

    calculateActionEfficiency() {
        // Calculate success rate of actions
        const successfulActions = this.trackingState.actionBuffer
            .filter(action => action.success).length;
        
        return this.trackingState.totalActions > 0 
            ? successfulActions / this.trackingState.totalActions 
            : 1;
    }

    getSessionInfo() {
        return {
            sessionId: this.trackingState.sessionId,
            startTime: new Date(this.trackingState.startTime).toISOString(),
            duration: Date.now() - this.trackingState.startTime,
            character: this.trackingState.currentCharacter,
            zone: this.trackingState.currentZone
        };
    }

    generateSummary() {
        return {
            totalActions: this.trackingState.totalActions,
            totalMovement: this.trackingState.totalMovement,
            totalDistance: this.trackingState.totalDistance,
            averageSpeed: this.calculateAverageSpeed(),
            pathEfficiency: this.calculatePathEfficiency(),
            actionEfficiency: this.calculateActionEfficiency(),
            actionsPerMinute: this.calculateActionsPerMinute()
        };
    }

    generateActionBreakdown() {
        const breakdown = {};
        
        this.trackingState.actionBuffer.forEach(action => {
            const key = `${action.type}_${action.action}`;
            if (!breakdown[key]) {
                breakdown[key] = {
                    count: 0,
                    successCount: 0,
                    totalDuration: 0,
                    averageDuration: 0
                };
            }
            
            breakdown[key].count++;
            if (action.success) breakdown[key].successCount++;
            if (action.duration) breakdown[key].totalDuration += action.duration;
        });
        
        // Calculate averages
        Object.values(breakdown).forEach(stats => {
            stats.successRate = stats.count > 0 ? stats.successCount / stats.count : 0;
            stats.averageDuration = stats.count > 0 ? stats.totalDuration / stats.count : 0;
        });
        
        return breakdown;
    }

    generateMovementAnalysis() {
        return {
            totalDistance: this.trackingState.totalDistance,
            averageSpeed: this.calculateAverageSpeed(),
            pathEfficiency: this.calculatePathEfficiency(),
            movementTypes: this.getMovementTypeBreakdown(),
            zones: this.getZoneMovementBreakdown()
        };
    }

    generatePerformanceMetrics() {
        return {
            averageActionTime: this.trackingState.averageActionTime,
            memoryUsage: this.trackingState.memoryUsage,
            cpuUsage: this.trackingState.cpuUsage,
            performanceHistory: this.trackingState.performanceBuffer.slice(-100)
        };
    }

    generateTimelineData(timeRange) {
        let events = [...this.trackingState.actionBuffer];
        
        if (timeRange) {
            events = events.filter(event => 
                event.timestamp >= timeRange.start && 
                event.timestamp <= timeRange.end
            );
        }
        
        return events.sort((a, b) => a.timestamp - b.timestamp);
    }

    generateTabularData(reportData) {
        const rows = [];
        
        // Add header row
        rows.push([
            'Timestamp', 'Type', 'Action', 'Success', 'Duration', 
            'Position X', 'Position Y', 'Position Z', 'Zone', 
            'Target', 'Result', 'Importance', 'Character'
        ]);
        
        // Add data rows
        reportData.timelineData.forEach(action => {
            rows.push([
                new Date(action.timestamp).toISOString(),
                action.type,
                action.action,
                action.success,
                action.duration || '',
                action.position.x,
                action.position.y,
                action.position.z,
                action.zone,
                action.target || '',
                action.result || '',
                action.importance,
                action.character || ''
            ]);
        });
        
        return rows;
    }

    generateReportFilename(format) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const sessionId = this.trackingState.sessionId.slice(0, 8);
        return `game-action-report-${sessionId}-${timestamp}.${format}`;
    }

    async exportTabularData(data, filename, format) {
        const exportDir = path.join(process.cwd(), 'exports');
        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir, { recursive: true });
        }
        
        const filepath = path.join(exportDir, filename);
        
        if (format === 'csv') {
            const csvContent = data.map(row => 
                row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
            ).join('\n');
            
            fs.writeFileSync(filepath, csvContent);
        } else {
            // JSON format
            fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
        }
        
        return filepath;
    }

    getMovementTypeBreakdown() {
        const breakdown = {};
        this.trackingState.movementBuffer.forEach(movement => {
            const type = movement.movementType;
            if (!breakdown[type]) {
                breakdown[type] = { count: 0, totalDistance: 0 };
            }
            breakdown[type].count++;
            breakdown[type].totalDistance += movement.distance;
        });
        return breakdown;
    }

    getZoneMovementBreakdown() {
        const breakdown = {};
        this.positionHistory.forEach(entry => {
            // Would need zone detection logic
            const zone = 'unknown'; // Placeholder
            if (!breakdown[zone]) {
                breakdown[zone] = { count: 0 };
            }
            breakdown[zone].count++;
        });
        return breakdown;
    }

    startAutoSave() {
        this.autoSaveTimer = setInterval(async () => {
            try {
                await this.generateReport({ format: 'csv' });
            } catch (error) {
                console.error('Auto-save failed:', error);
            }
        }, this.config.autoSaveInterval);
    }

    /**
     * Stop tracking and cleanup
     */
    async stopTracking() {
        try {
            this.trackingState.isActive = false;
            
            // Clear auto-save timer
            if (this.autoSaveTimer) {
                clearInterval(this.autoSaveTimer);
                this.autoSaveTimer = null;
            }
            
            // Stop performance monitoring
            if (this.performanceMonitor) {
                this.performanceMonitor.stop();
            }
            
            // Flush remaining actions
            await this.flushActionBuffer();
            
            // Generate final report
            const finalReport = await this.generateReport({ format: 'csv' });
            
            // Log session end
            await this.trackAction({
                type: 'session',
                action: 'tracking_stopped',
                details: {
                    sessionId: this.trackingState.sessionId,
                    finalStats: this.getTrackingStatistics(),
                    finalReport: finalReport.filepath
                }
            });
            
            console.log('⏹️ Game action tracking stopped');
            this.emit('tracking_stopped', finalReport);
            
            return finalReport;
            
        } catch (error) {
            console.error('Error stopping tracking:', error);
            throw error;
        }
    }
}

// Helper classes
class PathOptimizer {
    isOptimal(start, end, path = null) {
        // Simple heuristic - could be enhanced with A* or similar
        return true;
    }
    
    calculateDeviation(start, end, path = null) {
        // Calculate how much the path deviates from optimal
        return 0;
    }
}

class MovementAnalyzer {
    calculateSmoothness(path) {
        // Analyze path smoothness
        return 1;
    }
    
    calculateEfficiency(start, end, path) {
        // Calculate movement efficiency
        return 1;
    }
}

class PerformanceMonitor {
    start() {
        console.log('📊 Performance monitoring started');
    }
    
    stop() {
        console.log('📊 Performance monitoring stopped');
    }
}

class TimingAnalyzer {
    analyzeSkillTiming(skillData) {
        return {
            optimal: true,
            deviation: 0,
            efficiency: 1
        };
    }
}

module.exports = GameActionTracker;

// CLI interface for testing
if (require.main === module) {
    const tracker = new GameActionTracker();
    
    async function demo() {
        try {
            await tracker.startTracking({
                name: 'TestCharacter',
                level: 10,
                position: { x: 0, y: 0, z: 0 }
            });
            
            // Demo various actions
            await tracker.trackMovement({
                position: { x: 10, y: 5, z: 0 },
                type: 'walk',
                duration: 2000
            });
            
            await tracker.trackSkillUsage({
                name: 'fireball',
                level: 5,
                type: 'magic',
                target: 'orc',
                cost: 30,
                damage: 45,
                success: true
            });
            
            await tracker.trackItemInteraction({
                type: 'pickup',
                item: {
                    name: 'health_potion',
                    type: 'consumable',
                    rarity: 'common',
                    value: 10
                },
                fromContainer: 'ground'
            });
            
            await tracker.trackUIInteraction({
                type: 'button',
                action: 'click',
                element: 'inventory_button',
                responseTime: 50
            });
            
            // Show statistics
            console.log('\n📊 Tracking Statistics:');
            console.log(JSON.stringify(tracker.getTrackingStatistics(), null, 2));
            
            // Generate report
            const report = await tracker.generateReport({ format: 'csv' });
            console.log(`\n📁 Report generated: ${report.filepath}`);
            
        } catch (error) {
            console.error('Demo error:', error);
        }
    }
    
    demo();
}

console.log('🎮 Game Action Tracker ready');