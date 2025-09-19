#!/usr/bin/env node

/**
 * CANVAS PARENT-CHILD ARCHITECTURE FOR CROSS-DEVICE SYNC
 * 
 * Implements a sophisticated canvas synchronization system that allows
 * seamless interaction between desktop (parent) and mobile (child) devices.
 * 
 * Features:
 * - Real-time bidirectional sync
 * - Parent-child hierarchy with delegation
 * - Conflict resolution
 * - State persistence
 * - Touch/mouse gesture translation
 * - Canvas element state management
 */

const EventEmitter = require('events');
const WebSocket = require('ws');
const crypto = require('crypto');

class CanvasParentChildSync extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.wsPort = options.wsPort || 3335;
        this.wss = null;
        
        // Canvas architecture
        this.parentDevices = new Map(); // Desktop devices (parents)
        this.childDevices = new Map();  // Mobile devices (children)
        this.deviceConnections = new Map(); // WebSocket connections
        this.deviceHierarchy = new Map(); // Parent-child relationships
        
        // Canvas state management
        this.canvasStates = new Map(); // sessionId -> CanvasState
        this.canvasHistory = new Map(); // sessionId -> State history
        this.canvasElements = new Map(); // sessionId -> Elements
        this.canvasLocks = new Map();   // sessionId -> Lock info
        
        // Sync configuration
        this.syncConfig = {
            maxHistorySteps: 100,
            conflictResolution: 'parent-wins', // parent-wins, merge, queue
            syncDelayMs: 16, // ~60fps
            batchUpdates: true,
            persistState: true
        };
        
        // Performance tracking
        this.syncMetrics = {
            messagesPerSecond: 0,
            averageLatency: 0,
            lastSyncTimes: [],
            conflictsResolved: 0
        };
        
        console.log('🎨 Canvas Parent-Child Sync Architecture initialized');
        this.startWebSocketServer();
    }
    
    async startWebSocketServer() {
        this.wss = new WebSocket.Server({ 
            port: this.wsPort,
            perMessageDeflate: true // Compress messages for better performance
        });
        
        this.wss.on('connection', (ws, req) => {
            this.handleNewConnection(ws, req);
        });
        
        // Performance monitoring
        setInterval(() => {
            this.updateSyncMetrics();
        }, 1000);
        
        console.log(`✅ Canvas sync server listening on port ${this.wsPort}`);
    }
    
    handleNewConnection(ws, req) {
        const deviceId = req.headers['x-device-id'] || crypto.randomUUID();
        const deviceType = req.headers['x-device-type'] || 'unknown';
        const sessionId = req.headers['x-session-id'] || crypto.randomUUID();
        
        console.log(`🎨 Canvas device connected: ${deviceType} (${deviceId})`);
        
        // Store connection
        const connection = {
            ws,
            deviceId,
            deviceType,
            sessionId,
            connectionId: crypto.randomUUID(),
            connectedAt: new Date(),
            lastActivity: new Date(),
            isParent: deviceType === 'desktop',
            isChild: deviceType === 'mobile'
        };
        
        this.deviceConnections.set(connection.connectionId, connection);
        
        // Set up device hierarchy
        if (connection.isParent) {
            this.registerParentDevice(connection);
        } else if (connection.isChild) {
            this.registerChildDevice(connection);
        }
        
        // Set up message handling
        ws.on('message', (data) => {
            this.handleCanvasMessage(connection, data);
        });
        
        ws.on('close', () => {
            this.handleDeviceDisconnection(connection);
        });
        
        ws.on('pong', () => {
            connection.lastActivity = new Date();
        });
        
        // Send initial state
        this.sendInitialCanvasState(connection);
        
        // Start heartbeat
        this.startHeartbeat(connection);
    }
    
    registerParentDevice(connection) {
        const { sessionId, deviceId } = connection;
        
        this.parentDevices.set(deviceId, {
            ...connection,
            children: new Set(),
            canvasCapabilities: {
                precision: 'high',
                inputMethods: ['mouse', 'keyboard', 'stylus'],
                resolution: { width: 1920, height: 1080 }, // Default, will be updated
                renderingPower: 'high'
            }
        });
        
        // Initialize canvas state for this parent
        if (!this.canvasStates.has(sessionId)) {
            this.initializeCanvasState(sessionId, connection);
        }
        
        // Notify parent of role
        connection.ws.send(JSON.stringify({
            type: 'role-assignment',
            role: 'parent',
            capabilities: this.parentDevices.get(deviceId).canvasCapabilities,
            sessionId
        }));
        
        console.log(`🖥️ Parent device registered: ${deviceId}`);
    }
    
    registerChildDevice(connection) {
        const { sessionId, deviceId } = connection;
        
        this.childDevices.set(deviceId, {
            ...connection,
            parent: null,
            canvasCapabilities: {
                precision: 'medium',
                inputMethods: ['touch', 'accelerometer', 'voice'],
                resolution: { width: 390, height: 844 }, // Default mobile, will be updated
                renderingPower: 'medium'
            }
        });
        
        // Find and assign to parent
        const parentConnection = this.findParentForSession(sessionId);
        if (parentConnection) {
            this.establishParentChildRelationship(parentConnection, connection);
        }
        
        // Notify child of role
        connection.ws.send(JSON.stringify({
            type: 'role-assignment',
            role: 'child',
            capabilities: this.childDevices.get(deviceId).canvasCapabilities,
            sessionId,
            parentId: parentConnection?.deviceId
        }));
        
        console.log(`📱 Child device registered: ${deviceId}`);
    }
    
    establishParentChildRelationship(parentConnection, childConnection) {
        const parentDevice = this.parentDevices.get(parentConnection.deviceId);
        const childDevice = this.childDevices.get(childConnection.deviceId);
        
        if (!parentDevice || !childDevice) return;
        
        // Set up relationship
        parentDevice.children.add(childConnection.deviceId);
        childDevice.parent = parentConnection.deviceId;
        
        this.deviceHierarchy.set(childConnection.deviceId, parentConnection.deviceId);
        
        // Notify both devices
        parentConnection.ws.send(JSON.stringify({
            type: 'child-connected',
            childId: childConnection.deviceId,
            childCapabilities: childDevice.canvasCapabilities
        }));
        
        childConnection.ws.send(JSON.stringify({
            type: 'parent-connected',
            parentId: parentConnection.deviceId,
            parentCapabilities: parentDevice.canvasCapabilities
        }));
        
        console.log(`🔗 Parent-child relationship established: ${parentConnection.deviceId} ↔ ${childConnection.deviceId}`);
    }
    
    initializeCanvasState(sessionId, connection) {
        const canvasState = {
            sessionId,
            createdAt: new Date(),
            lastModified: new Date(),
            version: 1,
            
            // Canvas properties
            dimensions: {
                width: 1200,
                height: 800,
                scale: 1.0
            },
            
            // Canvas elements
            elements: new Map(),
            layers: [],
            
            // Interaction state
            activeTools: new Map(), // deviceId -> tool state
            cursors: new Map(),     // deviceId -> cursor position
            selections: new Map(),  // deviceId -> selected elements
            
            // Collaborative state
            locks: new Map(),       // elementId -> deviceId that has lock
            permissions: new Map(), // deviceId -> permission level
            
            // History for undo/redo
            history: [],
            historyIndex: -1
        };
        
        this.canvasStates.set(sessionId, canvasState);
        this.canvasHistory.set(sessionId, []);
        this.canvasElements.set(sessionId, new Map());
        
        console.log(`🎨 Canvas state initialized for session: ${sessionId}`);
    }
    
    handleCanvasMessage(connection, data) {
        try {
            const message = JSON.parse(data.toString());
            const { type, sessionId } = message;
            
            // Update activity
            connection.lastActivity = new Date();
            
            // Route message based on type
            switch (type) {
                case 'canvas-action':
                    this.handleCanvasAction(connection, message);
                    break;
                case 'cursor-move':
                    this.handleCursorMove(connection, message);
                    break;
                case 'element-update':
                    this.handleElementUpdate(connection, message);
                    break;
                case 'tool-select':
                    this.handleToolSelect(connection, message);
                    break;
                case 'canvas-resize':
                    this.handleCanvasResize(connection, message);
                    break;
                case 'gesture-input':
                    this.handleGestureInput(connection, message);
                    break;
                case 'sync-request':
                    this.handleSyncRequest(connection, message);
                    break;
                default:
                    console.warn(`Unknown canvas message type: ${type}`);
            }
            
        } catch (error) {
            console.error('Canvas message handling error:', error);
        }
    }
    
    handleCanvasAction(connection, message) {
        const { sessionId, action, data } = message;
        const canvasState = this.canvasStates.get(sessionId);
        
        if (!canvasState) return;
        
        // Check permissions
        if (!this.hasPermission(connection, action)) {
            this.sendPermissionError(connection, action);
            return;
        }
        
        // Process action based on type
        let result;
        switch (action.type) {
            case 'draw':
                result = this.processDrawAction(canvasState, connection, action);
                break;
            case 'move':
                result = this.processMoveAction(canvasState, connection, action);
                break;
            case 'select':
                result = this.processSelectAction(canvasState, connection, action);
                break;
            case 'delete':
                result = this.processDeleteAction(canvasState, connection, action);
                break;
            case 'create':
                result = this.processCreateAction(canvasState, connection, action);
                break;
            default:
                console.warn(`Unknown canvas action: ${action.type}`);
                return;
        }
        
        if (result.success) {
            // Update canvas state
            this.updateCanvasState(canvasState, result.changes);
            
            // Sync to other devices
            this.syncToDevices(sessionId, {
                type: 'canvas-update',
                changes: result.changes,
                source: connection.deviceId,
                timestamp: new Date()
            }, connection.connectionId);
            
            // Add to history
            this.addToHistory(sessionId, result.changes);
        }
    }
    
    processDrawAction(canvasState, connection, action) {
        const { points, tool, style } = action.data;
        
        // Create new stroke element
        const elementId = crypto.randomUUID();
        const element = {
            id: elementId,
            type: 'stroke',
            points: this.normalizePoints(points, connection),
            tool,
            style: { ...style, deviceId: connection.deviceId },
            createdAt: new Date(),
            createdBy: connection.deviceId
        };
        
        canvasState.elements.set(elementId, element);
        
        return {
            success: true,
            changes: {
                type: 'element-added',
                element,
                timestamp: new Date()
            }
        };
    }
    
    processMoveAction(canvasState, connection, action) {
        const { elementIds, delta } = action.data;
        const changes = [];
        
        for (const elementId of elementIds) {
            const element = canvasState.elements.get(elementId);
            if (!element) continue;
            
            // Check if element is locked by another device
            if (this.isElementLocked(elementId, connection.deviceId, canvasState)) {
                continue;
            }
            
            // Apply movement
            this.applyMovement(element, delta, connection);
            
            changes.push({
                type: 'element-moved',
                elementId,
                delta: this.normalizeMovement(delta, connection),
                timestamp: new Date()
            });
        }
        
        return {
            success: true,
            changes: {
                type: 'batch-update',
                changes,
                timestamp: new Date()
            }
        };
    }
    
    handleCursorMove(connection, message) {
        const { sessionId, position } = message;
        const canvasState = this.canvasStates.get(sessionId);
        
        if (!canvasState) return;
        
        // Update cursor position
        const normalizedPosition = this.normalizePosition(position, connection);
        canvasState.cursors.set(connection.deviceId, {
            position: normalizedPosition,
            timestamp: new Date(),
            deviceType: connection.deviceType
        });
        
        // Sync cursor to other devices
        this.syncToDevices(sessionId, {
            type: 'cursor-update',
            deviceId: connection.deviceId,
            position: normalizedPosition,
            deviceType: connection.deviceType
        }, connection.connectionId);
    }
    
    handleGestureInput(connection, message) {
        const { sessionId, gesture } = message;
        
        // Translate mobile gestures to canvas actions
        let canvasAction;
        switch (gesture.type) {
            case 'pinch':
                canvasAction = this.translatePinchToZoom(gesture, connection);
                break;
            case 'swipe':
                canvasAction = this.translateSwipeToPan(gesture, connection);
                break;
            case 'tap':
                canvasAction = this.translateTapToClick(gesture, connection);
                break;
            case 'long-press':
                canvasAction = this.translateLongPressToRightClick(gesture, connection);
                break;
        }
        
        if (canvasAction) {
            this.handleCanvasAction(connection, {
                sessionId,
                action: canvasAction,
                data: gesture.data
            });
        }
    }
    
    normalizePoints(points, connection) {
        // Normalize points based on device capabilities and canvas dimensions
        const deviceCapabilities = this.getDeviceCapabilities(connection);
        const canvasState = this.canvasStates.get(connection.sessionId);
        
        return points.map(point => ({
            x: (point.x / deviceCapabilities.resolution.width) * canvasState.dimensions.width,
            y: (point.y / deviceCapabilities.resolution.height) * canvasState.dimensions.height,
            pressure: point.pressure || 1.0,
            timestamp: point.timestamp || Date.now()
        }));
    }
    
    normalizePosition(position, connection) {
        const deviceCapabilities = this.getDeviceCapabilities(connection);
        const canvasState = this.canvasStates.get(connection.sessionId);
        
        return {
            x: (position.x / deviceCapabilities.resolution.width) * canvasState.dimensions.width,
            y: (position.y / deviceCapabilities.resolution.height) * canvasState.dimensions.height
        };
    }
    
    syncToDevices(sessionId, message, excludeConnectionId) {
        const connectionsToSync = [];
        
        // Find all connections for this session
        this.deviceConnections.forEach((connection, connectionId) => {
            if (connection.sessionId === sessionId && connectionId !== excludeConnectionId) {
                connectionsToSync.push(connection);
            }
        });
        
        // Apply device-specific transformations and send
        connectionsToSync.forEach(connection => {
            const transformedMessage = this.transformMessageForDevice(message, connection);
            this.sendToDevice(connection, transformedMessage);
        });
        
        // Update metrics
        this.syncMetrics.messagesPerSecond++;
    }
    
    transformMessageForDevice(message, targetConnection) {
        // Transform message based on target device capabilities
        const transformed = { ...message };
        
        // Adjust for device screen size and capabilities
        if (message.type === 'canvas-update' && message.changes) {
            transformed.changes = this.transformChangesForDevice(message.changes, targetConnection);
        }
        
        if (message.type === 'cursor-update' && message.position) {
            transformed.position = this.transformPositionForDevice(message.position, targetConnection);
        }
        
        return transformed;
    }
    
    transformChangesForDevice(changes, targetConnection) {
        const targetCapabilities = this.getDeviceCapabilities(targetConnection);
        const canvasState = this.canvasStates.get(targetConnection.sessionId);
        
        // Scale positions and dimensions for target device
        if (changes.element && changes.element.points) {
            changes.element.points = changes.element.points.map(point => ({
                ...point,
                x: (point.x / canvasState.dimensions.width) * targetCapabilities.resolution.width,
                y: (point.y / canvasState.dimensions.height) * targetCapabilities.resolution.height
            }));
        }
        
        return changes;
    }
    
    sendToDevice(connection, message) {
        if (connection.ws.readyState === WebSocket.OPEN) {
            const startTime = Date.now();
            
            connection.ws.send(JSON.stringify({
                ...message,
                syncId: crypto.randomUUID(),
                timestamp: new Date()
            }), (error) => {
                if (!error) {
                    const latency = Date.now() - startTime;
                    this.updateLatencyMetrics(latency);
                }
            });
        }
    }
    
    sendInitialCanvasState(connection) {
        const canvasState = this.canvasStates.get(connection.sessionId);
        
        if (canvasState) {
            // Send current canvas state
            const initialState = {
                type: 'canvas-init',
                sessionId: connection.sessionId,
                dimensions: canvasState.dimensions,
                elements: Array.from(canvasState.elements.values()),
                cursors: Object.fromEntries(canvasState.cursors.entries()),
                activeTools: Object.fromEntries(canvasState.activeTools.entries())
            };
            
            this.sendToDevice(connection, initialState);
        }
    }
    
    getDeviceCapabilities(connection) {
        if (connection.isParent) {
            return this.parentDevices.get(connection.deviceId)?.canvasCapabilities;
        } else if (connection.isChild) {
            return this.childDevices.get(connection.deviceId)?.canvasCapabilities;
        }
        
        return {
            precision: 'medium',
            inputMethods: ['mouse'],
            resolution: { width: 1024, height: 768 },
            renderingPower: 'medium'
        };
    }
    
    hasPermission(connection, action) {
        const canvasState = this.canvasStates.get(connection.sessionId);
        if (!canvasState) return false;
        
        const permission = canvasState.permissions.get(connection.deviceId) || 'read-write';
        
        // Parent devices typically have full permissions
        if (connection.isParent) {
            return true;
        }
        
        // Check specific permissions for child devices
        switch (action.type) {
            case 'draw':
            case 'create':
                return permission.includes('write');
            case 'delete':
                return permission.includes('delete');
            case 'move':
            case 'select':
                return permission.includes('write');
            default:
                return permission.includes('read');
        }
    }
    
    isElementLocked(elementId, deviceId, canvasState) {
        const lock = canvasState.locks.get(elementId);
        return lock && lock.deviceId !== deviceId && !this.hasLockExpired(lock);
    }
    
    hasLockExpired(lock) {
        const expirationTime = lock.timestamp.getTime() + (lock.durationMs || 5000);
        return Date.now() > expirationTime;
    }
    
    addToHistory(sessionId, changes) {
        const history = this.canvasHistory.get(sessionId);
        if (!history) return;
        
        history.push({
            changes,
            timestamp: new Date(),
            sessionId
        });
        
        // Limit history size
        if (history.length > this.syncConfig.maxHistorySteps) {
            history.shift();
        }
    }
    
    updateSyncMetrics() {
        const now = Date.now();
        this.syncMetrics.lastSyncTimes.push(now);
        
        // Keep only last 60 seconds of data
        this.syncMetrics.lastSyncTimes = this.syncMetrics.lastSyncTimes.filter(
            time => now - time < 60000
        );
        
        // Calculate messages per second
        this.syncMetrics.messagesPerSecond = this.syncMetrics.lastSyncTimes.length / 60;
    }
    
    updateLatencyMetrics(latency) {
        const metrics = this.syncMetrics;
        metrics.averageLatency = (metrics.averageLatency * 0.9) + (latency * 0.1);
    }
    
    startHeartbeat(connection) {
        const heartbeatInterval = setInterval(() => {
            if (connection.ws.readyState === WebSocket.OPEN) {
                connection.ws.ping();
            } else {
                clearInterval(heartbeatInterval);
            }
        }, 30000); // 30 second heartbeat
    }
    
    handleDeviceDisconnection(connection) {
        console.log(`🎨 Canvas device disconnected: ${connection.deviceType} (${connection.deviceId})`);
        
        // Clean up device registration
        if (connection.isParent) {
            this.parentDevices.delete(connection.deviceId);
        } else if (connection.isChild) {
            this.childDevices.delete(connection.deviceId);
        }
        
        // Clean up connections
        this.deviceConnections.delete(connection.connectionId);
        
        // Clean up hierarchy
        this.deviceHierarchy.delete(connection.deviceId);
        
        // Notify other devices in session
        this.notifyDeviceDisconnection(connection);
    }
    
    notifyDeviceDisconnection(disconnectedConnection) {
        const sessionDevices = Array.from(this.deviceConnections.values())
            .filter(conn => conn.sessionId === disconnectedConnection.sessionId);
        
        sessionDevices.forEach(connection => {
            this.sendToDevice(connection, {
                type: 'device-disconnected',
                deviceId: disconnectedConnection.deviceId,
                deviceType: disconnectedConnection.deviceType,
                timestamp: new Date()
            });
        });
    }
    
    findParentForSession(sessionId) {
        return Array.from(this.deviceConnections.values())
            .find(conn => conn.sessionId === sessionId && conn.isParent);
    }
    
    // Gesture translation methods
    translatePinchToZoom(gesture, connection) {
        return {
            type: 'zoom',
            data: {
                center: this.normalizePosition(gesture.center, connection),
                scale: gesture.scale,
                delta: gesture.delta
            }
        };
    }
    
    translateSwipeToPan(gesture, connection) {
        return {
            type: 'pan',
            data: {
                delta: {
                    x: gesture.deltaX,
                    y: gesture.deltaY
                },
                velocity: gesture.velocity
            }
        };
    }
    
    translateTapToClick(gesture, connection) {
        return {
            type: 'select',
            data: {
                position: this.normalizePosition(gesture.position, connection),
                modifiers: []
            }
        };
    }
    
    translateLongPressToRightClick(gesture, connection) {
        return {
            type: 'context-menu',
            data: {
                position: this.normalizePosition(gesture.position, connection)
            }
        };
    }
    
    // Public API methods
    getSessionInfo(sessionId) {
        const canvasState = this.canvasStates.get(sessionId);
        if (!canvasState) return null;
        
        const sessionDevices = Array.from(this.deviceConnections.values())
            .filter(conn => conn.sessionId === sessionId);
        
        return {
            sessionId,
            canvasState: {
                dimensions: canvasState.dimensions,
                elementCount: canvasState.elements.size,
                version: canvasState.version
            },
            devices: sessionDevices.map(conn => ({
                deviceId: conn.deviceId,
                deviceType: conn.deviceType,
                isParent: conn.isParent,
                isChild: conn.isChild,
                connectedAt: conn.connectedAt,
                lastActivity: conn.lastActivity
            })),
            hierarchy: this.getSessionHierarchy(sessionId),
            metrics: this.getSessionMetrics(sessionId)
        };
    }
    
    getSessionHierarchy(sessionId) {
        const sessionDevices = Array.from(this.deviceConnections.values())
            .filter(conn => conn.sessionId === sessionId);
        
        const hierarchy = {};
        sessionDevices.forEach(conn => {
            if (conn.isParent) {
                const parentDevice = this.parentDevices.get(conn.deviceId);
                hierarchy[conn.deviceId] = {
                    type: 'parent',
                    children: Array.from(parentDevice?.children || [])
                };
            }
        });
        
        return hierarchy;
    }
    
    getSessionMetrics(sessionId) {
        return {
            messagesPerSecond: this.syncMetrics.messagesPerSecond,
            averageLatency: this.syncMetrics.averageLatency,
            conflictsResolved: this.syncMetrics.conflictsResolved
        };
    }
    
    // Cleanup
    async shutdown() {
        console.log('🛑 Shutting down Canvas Parent-Child Sync...');
        
        if (this.wss) {
            this.wss.close();
        }
        
        // Clear all state
        this.parentDevices.clear();
        this.childDevices.clear();
        this.deviceConnections.clear();
        this.deviceHierarchy.clear();
        this.canvasStates.clear();
        this.canvasHistory.clear();
        this.canvasElements.clear();
        this.canvasLocks.clear();
        
        console.log('✅ Canvas sync shutdown complete');
    }
}

// Export for use in other modules
module.exports = CanvasParentChildSync;

// Start standalone if run directly
if (require.main === module) {
    const canvasSync = new CanvasParentChildSync({
        wsPort: process.env.CANVAS_WS_PORT || 3335
    });
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        await canvasSync.shutdown();
        process.exit(0);
    });
    
    console.log('🎨 Canvas Parent-Child Sync running standalone');
    console.log('   WebSocket: ws://localhost:3335');
    console.log('   Ready for parent-child canvas connections!');
}