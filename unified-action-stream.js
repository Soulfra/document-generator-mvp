#!/usr/bin/env node

/**
 * UNIFIED ACTION STREAM PROCESSOR
 * 
 * Master coordinator that combines chat, actions, movements, and zone transitions
 * into a single verifiable stream with Excel export capabilities and real-time filtering.
 * 
 * Integrates:
 * - chat-action-stream-integrator.js (chat and basic actions)
 * - game-action-tracker.js (detailed game actions and movements)  
 * - position-cache-manager.js (zone transitions and logout state)
 * - text-rendering-layer.js (1337 speak and alternative viewing modes)
 * - ticker-tape-logger (verification and audit trail)
 */

const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx'); // For actual Excel export

// Import our components
const ChatActionStreamIntegrator = require('./chat-action-stream-integrator.js');
const GameActionTracker = require('./game-action-tracker.js');
const PositionCacheManager = require('./position-cache-manager.js');
const TextRenderingLayer = require('./text-rendering-layer.js');

class UnifiedActionStream extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Stream processing
            enableUnifiedStream: true,
            enableRealTimeFiltering: true,
            enableExcelExport: true,
            enableStreamVerification: true,
            
            // Export configuration
            autoExportInterval: 600000, // 10 minutes
            exportFormats: ['xlsx', 'csv', 'json'],
            exportDirectory: './exports/unified',
            maxExportSize: 100000, // Max events per export
            
            // Stream filtering
            enableSmartFiltering: true,
            filterDuplicates: true,
            filterMicroActions: true,
            priorityThreshold: 'low', // Minimum priority to include
            
            // Performance settings
            streamBufferSize: 5000,
            flushInterval: 10000, // 10 seconds
            memoryLimit: 100 * 1024 * 1024, // 100MB
            
            // Text rendering settings
            defaultRenderMode: 'standard',
            allowUserModes: true,
            enableBulkRendering: true,
            
            // Verification settings
            enableIntegrityChecks: true,
            generateChecksums: true,
            auditTrailEnabled: true,
            
            ...config
        };
        
        // Initialize core components
        this.chatStreamIntegrator = new ChatActionStreamIntegrator({
            enableChatCapture: true,
            enableActionCapture: true,
            enableMovementCapture: true,
            enableZoneTracking: true,
            enableTextRendering: this.config.enableBulkRendering,
            websocketPort: 8083 // Different port to avoid conflicts
        });
        
        this.gameActionTracker = new GameActionTracker({
            enableMovementTracking: true,
            enableSkillTracking: true,
            enableCombatTracking: true,
            enableItemTracking: true,
            enableUITracking: !this.config.filterMicroActions,
            movementPrecision: 'high'
        });
        
        this.positionCacheManager = new PositionCacheManager({
            maxCacheSize: 20000,
            cleanupInterval: 300000,
            persistenceEnabled: true,
            storageDirectory: './cache/unified-positions'
        });
        
        this.textRenderer = new TextRenderingLayer();
        
        // Stream processing state
        this.streamState = {
            sessionId: uuidv4(),
            startTime: Date.now(),
            isActive: false,
            
            // Stream buffers
            unifiedBuffer: [],
            chatBuffer: [],
            actionBuffer: [],
            movementBuffer: [],
            zoneBuffer: [],
            
            // Processing statistics
            totalEvents: 0,
            eventsPerSecond: 0,
            filteredEvents: 0,
            exportedEvents: 0,
            
            // User tracking
            activeUsers: new Map(),
            userSessions: new Map(),
            
            // Export tracking
            lastExport: null,
            exportCount: 0,
            currentExportSize: 0
        };
        
        // Event filters
        this.eventFilters = new Map();
        this.setupDefaultFilters();
        
        // Export queue
        this.exportQueue = [];
        this.exportTimer = null;
        this.flushTimer = null;
        
        // Event correlation
        this.correlationMap = new Map(); // Correlate related events
        this.sequenceTracker = new Map(); // Track event sequences
        
        console.log('🌊 Unified Action Stream Processor initialized');
        console.log(`📊 Export formats: ${this.config.exportFormats.join(', ')}`);
    }

    /**
     * Initialize the unified stream processor
     */
    async initialize() {
        try {
            // Initialize all components
            await this.chatStreamIntegrator.initialize();
            await this.gameActionTracker.startTracking();
            await this.positionCacheManager.initialize();
            
            // Setup event handlers
            this.setupEventHandlers();
            
            // Start timers
            this.startProcessingTimers();
            
            // Create export directory
            this.ensureExportDirectory();
            
            this.streamState.isActive = true;
            
            console.log('✅ Unified Action Stream Processor ready');
            this.emit('initialized', this.getStreamStatus());
            
        } catch (error) {
            console.error('❌ Failed to initialize stream processor:', error);
            throw error;
        }
    }

    /**
     * Process and unify all incoming events
     */
    async processUnifiedEvent(eventData, source) {
        try {
            // Create unified event record
            const unifiedEvent = await this.createUnifiedEvent(eventData, source);
            
            // Apply filters
            if (this.config.enableSmartFiltering && !this.passesFilters(unifiedEvent)) {
                this.streamState.filteredEvents++;
                return null;
            }
            
            // Apply text rendering if needed
            if (this.config.enableBulkRendering && this.hasTextContent(unifiedEvent)) {
                await this.applyTextRendering(unifiedEvent);
            }
            
            // Add to unified buffer
            this.streamState.unifiedBuffer.push(unifiedEvent);
            this.streamState.totalEvents++;
            
            // Update user tracking
            this.updateUserTracking(unifiedEvent);
            
            // Handle correlations
            this.handleEventCorrelation(unifiedEvent);
            
            // Check for export trigger
            if (this.shouldTriggerExport()) {
                await this.triggerExport();
            }
            
            // Emit unified event
            this.emit('unified_event', unifiedEvent);
            
            return unifiedEvent.id;
            
        } catch (error) {
            console.error('Error processing unified event:', error);
            return null;
        }
    }

    /**
     * Export unified stream data to Excel
     */
    async exportToExcel(options = {}) {
        try {
            const exportOptions = {
                format: 'xlsx',
                timeRange: null,
                includeMetadata: true,
                separateSheets: true,
                renderMode: 'all',
                ...options
            };
            
            // Collect events for export
            const events = this.collectEventsForExport(exportOptions);
            
            if (events.length === 0) {
                console.warn('⚠️ No events to export');
                return null;
            }
            
            // Generate Excel workbook
            const workbook = await this.generateExcelWorkbook(events, exportOptions);
            
            // Generate filename
            const filename = this.generateExportFilename(exportOptions.format);
            const filepath = path.join(this.config.exportDirectory, filename);
            
            // Write workbook
            XLSX.writeFile(workbook, filepath);
            
            // Update export tracking
            this.streamState.exportedEvents += events.length;
            this.streamState.lastExport = Date.now();
            this.streamState.exportCount++;
            
            // Log export
            console.log(`📁 Exported ${events.length} events to ${filename}`);
            
            const exportResult = {
                filename,
                filepath,
                eventCount: events.length,
                fileSize: fs.statSync(filepath).size,
                format: exportOptions.format,
                timestamp: Date.now()
            };
            
            this.emit('export_completed', exportResult);
            return exportResult;
            
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            throw error;
        }
    }

    /**
     * Generate comprehensive Excel workbook with multiple sheets
     */
    async generateExcelWorkbook(events, options) {
        const workbook = XLSX.utils.book_new();
        
        // Main events sheet
        const eventsSheet = this.generateEventsSheet(events);
        XLSX.utils.book_append_sheet(workbook, eventsSheet, 'Events');
        
        if (options.separateSheets) {
            // Chat events sheet
            const chatEvents = events.filter(e => e.type === 'chat');
            if (chatEvents.length > 0) {
                const chatSheet = this.generateChatSheet(chatEvents);
                XLSX.utils.book_append_sheet(workbook, chatSheet, 'Chat');
            }
            
            // Action events sheet
            const actionEvents = events.filter(e => e.type === 'action');
            if (actionEvents.length > 0) {
                const actionSheet = this.generateActionSheet(actionEvents);
                XLSX.utils.book_append_sheet(workbook, actionSheet, 'Actions');
            }
            
            // Movement events sheet
            const movementEvents = events.filter(e => e.type === 'movement');
            if (movementEvents.length > 0) {
                const movementSheet = this.generateMovementSheet(movementEvents);
                XLSX.utils.book_append_sheet(workbook, movementSheet, 'Movement');
            }
            
            // Zone transition sheet
            const zoneEvents = events.filter(e => e.type === 'zone_transition');
            if (zoneEvents.length > 0) {
                const zoneSheet = this.generateZoneSheet(zoneEvents);
                XLSX.utils.book_append_sheet(workbook, zoneSheet, 'Zones');
            }
        }
        
        if (options.includeMetadata) {
            // Statistics sheet
            const statsSheet = this.generateStatisticsSheet(events);
            XLSX.utils.book_append_sheet(workbook, statsSheet, 'Statistics');
            
            // User summary sheet
            const userSheet = this.generateUserSummarySheet(events);
            XLSX.utils.book_append_sheet(workbook, userSheet, 'Users');
        }
        
        return workbook;
    }

    /**
     * Generate main events sheet
     */
    generateEventsSheet(events) {
        const headers = [
            'Timestamp', 'Event ID', 'Type', 'User ID', 'Action', 
            'Original Text', 'Rendered Text', 'Render Mode', 
            'Zone', 'Position X', 'Position Y', 'Position Z',
            'Success', 'Duration', 'Importance', 'Source',
            'Correlation ID', 'Session ID', 'Checksum'
        ];
        
        const rows = events.map(event => [
            new Date(event.timestamp).toISOString(),
            event.id,
            event.type,
            event.userId || '',
            event.action || '',
            event.originalText || '',
            event.renderedText || '',
            event.renderMode || '',
            event.zoneContext?.zone || '',
            event.position?.x || '',
            event.position?.y || '',
            event.position?.z || '',
            event.success !== undefined ? event.success : '',
            event.duration || '',
            event.importance || '',
            event.source || '',
            event.correlationId || '',
            event.sessionId || '',
            event.checksum || ''
        ]);
        
        return XLSX.utils.aoa_to_sheet([headers, ...rows]);
    }

    /**
     * Generate chat-specific sheet
     */
    generateChatSheet(chatEvents) {
        const headers = [
            'Timestamp', 'User ID', 'Username', 'Channel', 
            'Original Message', 'Rendered Message', 'Render Mode',
            'Zone', 'Word Count', 'Has Emojis', 'Has URLs'
        ];
        
        const rows = chatEvents.map(event => [
            new Date(event.timestamp).toISOString(),
            event.userId || '',
            event.username || '',
            event.channel || '',
            event.originalText || '',
            event.renderedText || '',
            event.renderMode || '',
            event.zoneContext?.zone || '',
            event.metadata?.wordCount || '',
            event.metadata?.hasEmojis || false,
            event.metadata?.hasUrls || false
        ]);
        
        return XLSX.utils.aoa_to_sheet([headers, ...rows]);
    }

    /**
     * Generate action-specific sheet
     */
    generateActionSheet(actionEvents) {
        const headers = [
            'Timestamp', 'User ID', 'Action Type', 'Target', 
            'Skill Used', 'Item Used', 'Damage', 'Experience',
            'Success', 'Duration', 'Zone', 'Position X', 'Position Y'
        ];
        
        const rows = actionEvents.map(event => [
            new Date(event.timestamp).toISOString(),
            event.userId || '',
            event.action || '',
            event.target || '',
            event.gameData?.skillUsed || '',
            event.gameData?.itemUsed || '',
            event.gameData?.damage || '',
            event.gameData?.experience || '',
            event.success !== undefined ? event.success : '',
            event.duration || '',
            event.zoneContext?.zone || '',
            event.position?.x || '',
            event.position?.y || ''
        ]);
        
        return XLSX.utils.aoa_to_sheet([headers, ...rows]);
    }

    /**
     * Generate movement-specific sheet
     */
    generateMovementSheet(movementEvents) {
        const headers = [
            'Timestamp', 'User ID', 'From X', 'From Y', 'From Z',
            'To X', 'To Y', 'To Z', 'Distance', 'Speed', 
            'Movement Type', 'Duration', 'Zone', 'Path Optimal'
        ];
        
        const rows = movementEvents.map(event => [
            new Date(event.timestamp).toISOString(),
            event.userId || '',
            event.fromPosition?.x || '',
            event.fromPosition?.y || '',
            event.fromPosition?.z || '',
            event.toPosition?.x || '',
            event.toPosition?.y || '',
            event.toPosition?.z || '',
            event.distance || '',
            event.speed || '',
            event.movementType || '',
            event.duration || '',
            event.zoneContext?.zone || '',
            event.metadata?.pathOptimal || false
        ]);
        
        return XLSX.utils.aoa_to_sheet([headers, ...rows]);
    }

    /**
     * Generate zone transition sheet
     */
    generateZoneSheet(zoneEvents) {
        const headers = [
            'Timestamp', 'User ID', 'From Zone', 'To Zone',
            'Exit X', 'Exit Y', 'Entry X', 'Entry Y',
            'Transition Type', 'Load Time', 'Reason'
        ];
        
        const rows = zoneEvents.map(event => [
            new Date(event.timestamp).toISOString(),
            event.userId || '',
            event.fromZone || '',
            event.toZone || '',
            event.exitPosition?.x || '',
            event.exitPosition?.y || '',
            event.entryPosition?.x || '',
            event.entryPosition?.y || '',
            event.transitionType || '',
            event.metadata?.loadTime || '',
            event.reason || ''
        ]);
        
        return XLSX.utils.aoa_to_sheet([headers, ...rows]);
    }

    /**
     * Generate statistics sheet
     */
    generateStatisticsSheet(events) {
        const stats = this.calculateEventStatistics(events);
        
        const data = [
            ['Metric', 'Value'],
            ['Total Events', events.length],
            ['Export Timestamp', new Date().toISOString()],
            ['Session ID', this.streamState.sessionId],
            ['Time Range Start', new Date(Math.min(...events.map(e => e.timestamp))).toISOString()],
            ['Time Range End', new Date(Math.max(...events.map(e => e.timestamp))).toISOString()],
            ['Unique Users', stats.uniqueUsers],
            ['Chat Messages', stats.chatCount],
            ['Actions', stats.actionCount],
            ['Movements', stats.movementCount],
            ['Zone Transitions', stats.zoneCount],
            ['Success Rate', `${(stats.successRate * 100).toFixed(1)}%`],
            ['Average Duration', `${stats.averageDuration.toFixed(2)}ms`]
        ];
        
        return XLSX.utils.aoa_to_sheet(data);
    }

    /**
     * Generate user summary sheet
     */
    generateUserSummarySheet(events) {
        const userStats = this.calculateUserStatistics(events);
        
        const headers = [
            'User ID', 'Total Events', 'Chat Messages', 'Actions', 
            'Movements', 'Zone Transitions', 'Session Duration', 
            'Most Used Zone', 'Success Rate'
        ];
        
        const rows = Object.entries(userStats).map(([userId, stats]) => [
            userId,
            stats.totalEvents,
            stats.chatCount,
            stats.actionCount,
            stats.movementCount,
            stats.zoneCount,
            stats.sessionDuration,
            stats.mostUsedZone,
            `${(stats.successRate * 100).toFixed(1)}%`
        ]);
        
        return XLSX.utils.aoa_to_sheet([headers, ...rows]);
    }

    /**
     * Apply real-time filters to events
     */
    addEventFilter(name, filterFunction) {
        this.eventFilters.set(name, filterFunction);
        console.log(`🔍 Added event filter: ${name}`);
    }

    /**
     * Remove event filter
     */
    removeEventFilter(name) {
        const removed = this.eventFilters.delete(name);
        if (removed) {
            console.log(`🗑️ Removed event filter: ${name}`);
        }
        return removed;
    }

    /**
     * Get real-time stream statistics
     */
    getStreamStatus() {
        const uptime = Date.now() - this.streamState.startTime;
        const eventsPerSecond = this.streamState.totalEvents / (uptime / 1000);
        
        return {
            sessionId: this.streamState.sessionId,
            isActive: this.streamState.isActive,
            uptime,
            
            // Event statistics
            totalEvents: this.streamState.totalEvents,
            eventsPerSecond: eventsPerSecond.toFixed(2),
            filteredEvents: this.streamState.filteredEvents,
            exportedEvents: this.streamState.exportedEvents,
            
            // Buffer status
            unifiedBufferSize: this.streamState.unifiedBuffer.length,
            chatBufferSize: this.streamState.chatBuffer.length,
            actionBufferSize: this.streamState.actionBuffer.length,
            movementBufferSize: this.streamState.movementBuffer.length,
            
            // User tracking
            activeUsers: this.streamState.activeUsers.size,
            totalUserSessions: this.streamState.userSessions.size,
            
            // Export status
            lastExport: this.streamState.lastExport,
            exportCount: this.streamState.exportCount,
            exportQueueSize: this.exportQueue.length,
            
            // Component status
            chatIntegratorActive: true, // Would check actual status
            gameTrackerActive: true,
            cacheManagerActive: true,
            
            // Memory usage
            memoryUsage: process.memoryUsage()
        };
    }

    // Helper methods...

    async createUnifiedEvent(eventData, source) {
        const unifiedEvent = {
            id: uuidv4(),
            timestamp: Date.now(),
            nanoTimestamp: process.hrtime.bigint(),
            source,
            type: eventData.type,
            
            // Unified fields
            userId: eventData.userId,
            action: eventData.action,
            success: eventData.success,
            duration: eventData.duration,
            importance: eventData.importance || 'medium',
            
            // Position data
            position: eventData.position,
            zoneContext: eventData.zoneContext,
            
            // Text content
            originalText: eventData.original || eventData.originalDescription || '',
            renderedText: '', // Will be filled by text rendering
            renderMode: 'standard',
            
            // Game-specific data
            gameData: eventData.gameData || {},
            
            // Metadata
            sessionId: this.streamState.sessionId,
            correlationId: eventData.correlationId,
            metadata: eventData.metadata || {},
            
            // Verification
            checksum: this.generateEventChecksum(eventData)
        };
        
        return unifiedEvent;
    }

    async applyTextRendering(event) {
        if (event.originalText) {
            const renderMode = this.getUserRenderMode(event.userId);
            const rendered = this.textRenderer.render(event.originalText, renderMode);
            
            event.renderedText = rendered.rendered;
            event.renderMode = rendered.mode;
        }
    }

    passesFilters(event) {
        for (const [name, filterFunction] of this.eventFilters.entries()) {
            if (!filterFunction(event)) {
                return false;
            }
        }
        return true;
    }

    hasTextContent(event) {
        return event.originalText && event.originalText.length > 0;
    }

    setupDefaultFilters() {
        // Filter out micro-actions if enabled
        if (this.config.filterMicroActions) {
            this.addEventFilter('micro_actions', (event) => {
                const microActions = ['hover', 'mouse_move', 'scroll', 'focus', 'blur'];
                return !microActions.includes(event.action);
            });
        }
        
        // Filter duplicates if enabled
        if (this.config.filterDuplicates) {
            const recentEvents = new Set();
            this.addEventFilter('duplicates', (event) => {
                const key = `${event.userId}_${event.type}_${event.action}_${event.timestamp}`;
                if (recentEvents.has(key)) {
                    return false;
                }
                recentEvents.add(key);
                
                // Clean old keys periodically
                if (recentEvents.size > 1000) {
                    recentEvents.clear();
                }
                
                return true;
            });
        }
        
        // Priority threshold filter
        const priorityLevels = ['critical', 'high', 'medium', 'low', 'trace'];
        const thresholdIndex = priorityLevels.indexOf(this.config.priorityThreshold);
        
        this.addEventFilter('priority', (event) => {
            const eventIndex = priorityLevels.indexOf(event.importance);
            return eventIndex <= thresholdIndex;
        });
    }

    setupEventHandlers() {
        // Chat stream events
        this.chatStreamIntegrator.on('chat_captured', (event) => {
            this.processUnifiedEvent(event, 'chat_stream');
        });
        
        this.chatStreamIntegrator.on('action_captured', (event) => {
            this.processUnifiedEvent(event, 'chat_stream');
        });
        
        this.chatStreamIntegrator.on('movement_captured', (event) => {
            this.processUnifiedEvent(event, 'chat_stream');
        });
        
        this.chatStreamIntegrator.on('zone_transition_captured', (event) => {
            this.processUnifiedEvent(event, 'chat_stream');
        });
        
        // Game action tracker events
        this.gameActionTracker.on('action_tracked', (event) => {
            this.processUnifiedEvent(event, 'game_tracker');
        });
        
        this.gameActionTracker.on('movement_tracked', (event) => {
            this.processUnifiedEvent(event, 'game_tracker');
        });
        
        // Position cache events
        this.positionCacheManager.on('position_cached', (event) => {
            this.processUnifiedEvent(event.position, 'position_cache');
        });
    }

    updateUserTracking(event) {
        if (event.userId) {
            // Update active user tracking
            this.streamState.activeUsers.set(event.userId, {
                lastActivity: Date.now(),
                eventCount: (this.streamState.activeUsers.get(event.userId)?.eventCount || 0) + 1
            });
            
            // Update session tracking
            if (!this.streamState.userSessions.has(event.userId)) {
                this.streamState.userSessions.set(event.userId, {
                    sessionStart: Date.now(),
                    eventCount: 0,
                    zones: new Set()
                });
            }
            
            const session = this.streamState.userSessions.get(event.userId);
            session.eventCount++;
            if (event.zoneContext?.zone) {
                session.zones.add(event.zoneContext.zone);
            }
        }
    }

    handleEventCorrelation(event) {
        // Simple correlation based on time proximity and user
        const correlationWindow = 5000; // 5 seconds
        const now = Date.now();
        
        // Find related events
        const relatedEvents = this.streamState.unifiedBuffer
            .filter(e => 
                e.userId === event.userId &&
                Math.abs(e.timestamp - event.timestamp) < correlationWindow &&
                e.id !== event.id
            )
            .slice(-5); // Last 5 related events
        
        if (relatedEvents.length > 0) {
            event.correlationId = relatedEvents[0].correlationId || uuidv4();
            
            // Update correlation for related events
            relatedEvents.forEach(e => {
                if (!e.correlationId) {
                    e.correlationId = event.correlationId;
                }
            });
        }
    }

    shouldTriggerExport() {
        const bufferSize = this.streamState.unifiedBuffer.length;
        const timeSinceLastExport = Date.now() - (this.streamState.lastExport || 0);
        
        return bufferSize >= this.config.maxExportSize ||
               timeSinceLastExport >= this.config.autoExportInterval;
    }

    async triggerExport() {
        if (this.exportQueue.length === 0) {
            this.exportQueue.push({ 
                timestamp: Date.now(),
                events: [...this.streamState.unifiedBuffer]
            });
            
            // Process export queue
            setImmediate(() => this.processExportQueue());
        }
    }

    async processExportQueue() {
        while (this.exportQueue.length > 0) {
            const exportJob = this.exportQueue.shift();
            
            try {
                await this.exportToExcel({
                    format: 'xlsx',
                    events: exportJob.events
                });
            } catch (error) {
                console.error('Export job failed:', error);
            }
        }
    }

    collectEventsForExport(options) {
        let events = [...this.streamState.unifiedBuffer];
        
        // Apply time range filter
        if (options.timeRange) {
            events = events.filter(e => 
                e.timestamp >= options.timeRange.start &&
                e.timestamp <= options.timeRange.end
            );
        }
        
        // Apply render mode filter
        if (options.renderMode && options.renderMode !== 'all') {
            events = events.filter(e => e.renderMode === options.renderMode);
        }
        
        // Sort by timestamp
        events.sort((a, b) => a.timestamp - b.timestamp);
        
        return events;
    }

    calculateEventStatistics(events) {
        const uniqueUsers = new Set(events.map(e => e.userId)).size;
        const chatCount = events.filter(e => e.type === 'chat').length;
        const actionCount = events.filter(e => e.type === 'action').length;
        const movementCount = events.filter(e => e.type === 'movement').length;
        const zoneCount = events.filter(e => e.type === 'zone_transition').length;
        
        const successfulEvents = events.filter(e => e.success === true).length;
        const successRate = events.length > 0 ? successfulEvents / events.length : 0;
        
        const durations = events.filter(e => e.duration).map(e => e.duration);
        const averageDuration = durations.length > 0 
            ? durations.reduce((a, b) => a + b, 0) / durations.length 
            : 0;
        
        return {
            uniqueUsers,
            chatCount,
            actionCount,
            movementCount,
            zoneCount,
            successRate,
            averageDuration
        };
    }

    calculateUserStatistics(events) {
        const userStats = {};
        
        for (const event of events) {
            if (!event.userId) continue;
            
            if (!userStats[event.userId]) {
                userStats[event.userId] = {
                    totalEvents: 0,
                    chatCount: 0,
                    actionCount: 0,
                    movementCount: 0,
                    zoneCount: 0,
                    sessionDuration: 0,
                    zones: new Set(),
                    successCount: 0
                };
            }
            
            const stats = userStats[event.userId];
            stats.totalEvents++;
            
            if (event.type === 'chat') stats.chatCount++;
            if (event.type === 'action') stats.actionCount++;
            if (event.type === 'movement') stats.movementCount++;
            if (event.type === 'zone_transition') stats.zoneCount++;
            if (event.success === true) stats.successCount++;
            if (event.zoneContext?.zone) stats.zones.add(event.zoneContext.zone);
        }
        
        // Calculate derived statistics
        for (const stats of Object.values(userStats)) {
            stats.successRate = stats.totalEvents > 0 ? stats.successCount / stats.totalEvents : 0;
            stats.mostUsedZone = stats.zones.size > 0 ? [...stats.zones][0] : 'unknown';
        }
        
        return userStats;
    }

    generateEventChecksum(eventData) {
        if (!this.config.generateChecksums) return null;
        
        const crypto = require('crypto');
        const checkData = JSON.stringify({
            timestamp: eventData.timestamp,
            type: eventData.type,
            userId: eventData.userId,
            action: eventData.action
        });
        
        return crypto.createHash('md5').update(checkData).digest('hex').substring(0, 8);
    }

    generateExportFilename(format) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const sessionId = this.streamState.sessionId.slice(0, 8);
        return `unified-stream-${sessionId}-${timestamp}.${format}`;
    }

    getUserRenderMode(userId) {
        // Get user's preferred render mode
        return this.config.defaultRenderMode;
    }

    ensureExportDirectory() {
        if (!fs.existsSync(this.config.exportDirectory)) {
            fs.mkdirSync(this.config.exportDirectory, { recursive: true });
        }
    }

    startProcessingTimers() {
        // Auto-export timer
        if (this.config.autoExportInterval > 0) {
            this.exportTimer = setInterval(() => {
                this.triggerExport();
            }, this.config.autoExportInterval);
        }
        
        // Buffer flush timer
        this.flushTimer = setInterval(() => {
            this.flushBuffers();
        }, this.config.flushInterval);
    }

    flushBuffers() {
        // Trim buffers to prevent memory issues
        const maxSize = this.config.streamBufferSize;
        
        if (this.streamState.unifiedBuffer.length > maxSize) {
            const excess = this.streamState.unifiedBuffer.length - maxSize;
            this.streamState.unifiedBuffer.splice(0, excess);
        }
    }

    /**
     * Stop the unified stream processor
     */
    async stop() {
        try {
            this.streamState.isActive = false;
            
            // Clear timers
            if (this.exportTimer) {
                clearInterval(this.exportTimer);
                this.exportTimer = null;
            }
            
            if (this.flushTimer) {
                clearInterval(this.flushTimer);
                this.flushTimer = null;
            }
            
            // Final export
            if (this.config.enableExcelExport) {
                await this.exportToExcel({ format: 'xlsx' });
            }
            
            // Stop components
            await this.chatStreamIntegrator.close();
            await this.gameActionTracker.stopTracking();
            await this.positionCacheManager.close();
            
            const finalStats = this.getStreamStatus();
            
            console.log('⏹️ Unified Action Stream Processor stopped');
            this.emit('stopped', finalStats);
            
            return finalStats;
            
        } catch (error) {
            console.error('Error stopping stream processor:', error);
            throw error;
        }
    }
}

module.exports = UnifiedActionStream;

// CLI interface for testing
if (require.main === module) {
    const unifiedStream = new UnifiedActionStream({
        autoExportInterval: 30000, // 30 seconds for demo
        exportFormats: ['xlsx', 'csv']
    });
    
    async function demo() {
        try {
            await unifiedStream.initialize();
            
            // Simulate some events
            console.log('🎮 Simulating game events...');
            
            // Wait a moment then export
            setTimeout(async () => {
                const exportResult = await unifiedStream.exportToExcel({
                    format: 'xlsx',
                    separateSheets: true,
                    includeMetadata: true
                });
                
                console.log('✅ Demo export completed:', exportResult.filename);
                console.log('📊 Stream status:');
                console.log(JSON.stringify(unifiedStream.getStreamStatus(), null, 2));
                
            }, 5000);
            
        } catch (error) {
            console.error('Demo error:', error);
        }
    }
    
    demo();
}

console.log('🌊 Unified Action Stream Processor ready');