#!/usr/bin/env node

/**
 * Stream Coordination Server - Video Feed Management
 * 
 * Coordinates live video streams from multiple visual systems:
 * - 3D Game World (actually-working-3d-game.html)
 * - 4D Vector World (LIVE-4D-VECTORIZED-WORLD.html) 
 * - Agent Network (agent-streaming-network.html)
 * - Unity Engine (WebSocket stream from Unity)
 * 
 * Provides real-time coordination between streaming sources and dashboard
 */

const WebSocket = require('ws');
const express = require('express');
const path = require('path');
const fs = require('fs');

class StreamCoordinationServer {
    constructor() {
        this.app = express();
        this.server = null;
        this.wss = null;
        
        // Stream state management
        this.streams = {
            '3d': { 
                active: false, 
                fps: 60, 
                port: 8080,
                type: 'html_canvas',
                clients: new Set(),
                lastFrame: Date.now()
            },
            '4d': { 
                active: false, 
                fps: 30, 
                port: 8081,
                type: 'html_canvas', 
                clients: new Set(),
                lastFrame: Date.now()
            },
            'network': { 
                active: false, 
                fps: 45, 
                port: 8082,
                type: 'html_canvas',
                clients: new Set(),
                lastFrame: Date.now()
            },
            'unity': { 
                active: false, 
                fps: 120, 
                port: 9085,
                type: 'unity_direct',
                clients: new Set(),
                lastFrame: Date.now()
            }
        };
        
        this.dashboards = new Set();
        this.recordings = new Map();
        
        this.setupExpress();
        this.setupWebSocket();
    }
    
    setupExpress() {
        this.app.use(express.static('.'));
        this.app.use(express.json());
        
        // Stream status API
        this.app.get('/api/streams/status', (req, res) => {
            const status = {};
            Object.keys(this.streams).forEach(streamId => {
                status[streamId] = {
                    active: this.streams[streamId].active,
                    fps: this.streams[streamId].fps,
                    clients: this.streams[streamId].clients.size,
                    type: this.streams[streamId].type
                };
            });
            
            res.json({
                success: true,
                streams: status,
                dashboards: this.dashboards.size,
                recordings: this.recordings.size
            });
        });
        
        // Stream control API
        this.app.post('/api/streams/:streamId/control', (req, res) => {
            const { streamId } = req.params;
            const { action } = req.body;
            
            if (!this.streams[streamId]) {
                return res.status(404).json({ error: 'Stream not found' });
            }
            
            switch(action) {
                case 'start':
                    this.startStream(streamId);
                    break;
                case 'stop':
                    this.stopStream(streamId);
                    break;
                case 'record':
                    this.startRecording(streamId);
                    break;
                case 'stop_record':
                    this.stopRecording(streamId);
                    break;
                default:
                    return res.status(400).json({ error: 'Invalid action' });
            }
            
            res.json({ success: true, action, streamId });
        });
        
        // Dashboard health check
        this.app.get('/api/health', (req, res) => {
            res.json({
                status: 'healthy',
                uptime: process.uptime(),
                streams: Object.keys(this.streams).length,
                dashboards: this.dashboards.size
            });
        });
    }
    
    setupWebSocket() {
        this.server = require('http').createServer(this.app);
        this.wss = new WebSocket.Server({ 
            server: this.server,
            port: 8999
        });
        
        this.wss.on('connection', (ws, req) => {
            console.log('🔗 New WebSocket connection from', req.socket.remoteAddress);
            
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.handleWebSocketMessage(ws, message);
                } catch (error) {
                    console.error('❌ Invalid WebSocket message:', error);
                }
            });
            
            ws.on('close', () => {
                this.handleClientDisconnect(ws);
            });
            
            // Send welcome message
            ws.send(JSON.stringify({
                type: 'connection_established',
                timestamp: Date.now(),
                availableStreams: Object.keys(this.streams)
            }));
        });
    }
    
    handleWebSocketMessage(ws, message) {
        switch(message.type) {
            case 'register_dashboard':
                this.registerDashboard(ws, message);
                break;
                
            case 'register_stream_source':
                this.registerStreamSource(ws, message);
                break;
                
            case 'unity_frame':
                this.handleUnityFrame(ws, message);
                break;
                
            case 'canvas_frame':
                this.handleCanvasFrame(ws, message);
                break;
                
            case 'stream_control':
                this.handleStreamControl(ws, message);
                break;
                
            default:
                console.log('⚠️ Unknown message type:', message.type);
        }
    }
    
    registerDashboard(ws, message) {
        ws.isDashboard = true;
        ws.subscribedFeeds = message.feeds || [];
        this.dashboards.add(ws);
        
        console.log(`📺 Dashboard registered, subscribed to: ${ws.subscribedFeeds.join(', ')}`);
        
        // Send current stream status
        ws.send(JSON.stringify({
            type: 'stream_status_update',
            streams: this.streams
        }));
    }
    
    registerStreamSource(ws, message) {
        const { streamId, type } = message;
        
        if (this.streams[streamId]) {
            ws.streamId = streamId;
            ws.isStreamSource = true;
            this.streams[streamId].clients.add(ws);
            this.streams[streamId].active = true;
            
            console.log(`🎥 Stream source registered: ${streamId} (${type})`);
            
            // Notify dashboards
            this.broadcastToDashboards({
                type: 'stream_update',
                streamId,
                status: 'streaming',
                fps: this.streams[streamId].fps
            });
        }
    }
    
    handleUnityFrame(ws, message) {
        const streamId = 'unity';
        this.streams[streamId].lastFrame = Date.now();
        
        // Forward Unity frame to dashboards
        this.broadcastToDashboards({
            type: 'unity_frame',
            streamId,
            frameData: message.frameData,
            timestamp: Date.now()
        });
    }
    
    handleCanvasFrame(ws, message) {
        const { streamId, frameData } = message;
        
        if (this.streams[streamId]) {
            this.streams[streamId].lastFrame = Date.now();
            
            // Forward canvas frame to dashboards
            this.broadcastToDashboards({
                type: 'canvas_frame',
                streamId,
                frameData,
                timestamp: Date.now()
            });
        }
    }
    
    handleStreamControl(ws, message) {
        const { streamId, action } = message;
        
        switch(action) {
            case 'start_recording':
                this.startRecording(streamId);
                break;
            case 'stop_recording':
                this.stopRecording(streamId);
                break;
            case 'screenshot':
                this.takeScreenshot(streamId);
                break;
        }
    }
    
    startStream(streamId) {
        if (this.streams[streamId]) {
            this.streams[streamId].active = true;
            console.log(`▶️ Stream started: ${streamId}`);
            
            this.broadcastToDashboards({
                type: 'stream_update',
                streamId,
                status: 'streaming'
            });
        }
    }
    
    stopStream(streamId) {
        if (this.streams[streamId]) {
            this.streams[streamId].active = false;
            console.log(`⏹️ Stream stopped: ${streamId}`);
            
            this.broadcastToDashboards({
                type: 'stream_update',
                streamId,
                status: 'offline'
            });
        }
    }
    
    startRecording(streamId) {
        if (!this.recordings.has(streamId)) {
            this.recordings.set(streamId, {
                startTime: Date.now(),
                frames: [],
                active: true
            });
            
            console.log(`🔴 Recording started: ${streamId}`);
            
            this.broadcastToDashboards({
                type: 'recording_started',
                streamId
            });
        }
    }
    
    stopRecording(streamId) {
        if (this.recordings.has(streamId)) {
            const recording = this.recordings.get(streamId);
            recording.active = false;
            recording.endTime = Date.now();
            
            console.log(`⏹️ Recording stopped: ${streamId}, duration: ${recording.endTime - recording.startTime}ms`);
            
            // Save recording (in real implementation)
            this.saveRecording(streamId, recording);
            
            this.broadcastToDashboards({
                type: 'recording_stopped',
                streamId,
                duration: recording.endTime - recording.startTime
            });
        }
    }
    
    takeScreenshot(streamId) {
        console.log(`📸 Screenshot requested: ${streamId}`);
        
        // In real implementation, capture current frame
        const filename = `screenshot-${streamId}-${Date.now()}.png`;
        
        this.broadcastToDashboards({
            type: 'screenshot_taken',
            streamId,
            filename
        });
    }
    
    saveRecording(streamId, recording) {
        // In real implementation, encode frames to video file
        const filename = `recording-${streamId}-${recording.startTime}.mp4`;
        console.log(`💾 Saving recording: ${filename}`);
    }
    
    broadcastToDashboards(message) {
        this.dashboards.forEach(dashboard => {
            if (dashboard.readyState === WebSocket.OPEN) {
                dashboard.send(JSON.stringify(message));
            }
        });
    }
    
    handleClientDisconnect(ws) {
        if (ws.isDashboard) {
            this.dashboards.delete(ws);
            console.log('📺 Dashboard disconnected');
        }
        
        if (ws.isStreamSource && ws.streamId) {
            const streamId = ws.streamId;
            this.streams[streamId].clients.delete(ws);
            
            if (this.streams[streamId].clients.size === 0) {
                this.streams[streamId].active = false;
                console.log(`📡 Stream source disconnected: ${streamId}`);
                
                this.broadcastToDashboards({
                    type: 'stream_update',
                    streamId,
                    status: 'offline'
                });
            }
        }
    }
    
    // Health monitoring
    startHealthMonitoring() {
        setInterval(() => {
            const now = Date.now();
            
            // Check for stale streams
            Object.keys(this.streams).forEach(streamId => {
                const stream = this.streams[streamId];
                const timeSinceLastFrame = now - stream.lastFrame;
                
                if (stream.active && timeSinceLastFrame > 5000) {
                    console.log(`⚠️ Stream ${streamId} appears stale (${timeSinceLastFrame}ms since last frame)`);
                    
                    this.broadcastToDashboards({
                        type: 'stream_update',
                        streamId,
                        status: 'warning',
                        message: 'Stream appears stale'
                    });
                }
            });
            
            // Broadcast health stats
            this.broadcastToDashboards({
                type: 'health_update',
                activeStreams: Object.values(this.streams).filter(s => s.active).length,
                totalDashboards: this.dashboards.size,
                activeRecordings: this.recordings.size,
                uptime: process.uptime()
            });
            
        }, 2000);
    }
    
    start(port = 8999) {
        this.server.listen(port, () => {
            console.log(`🎥 Stream Coordination Server running on port ${port}`);
            console.log(`📺 Dashboard: http://localhost:${port}/live-video-streaming-dashboard.html`);
            console.log(`🔗 WebSocket: ws://localhost:${port}`);
            console.log('');
            console.log('Available video feeds:');
            Object.keys(this.streams).forEach(streamId => {
                const stream = this.streams[streamId];
                console.log(`  📹 ${streamId}: ${stream.type} @ ${stream.fps} FPS (Port ${stream.port})`);
            });
            
            this.startHealthMonitoring();
        });
    }
}

// Unity WebSocket bridge
class UnityStreamBridge {
    constructor(coordinationServer) {
        this.coordination = coordinationServer;
        this.unityWS = null;
        this.connectToUnity();
    }
    
    connectToUnity() {
        try {
            // Connect to Unity game engine
            this.unityWS = new WebSocket('ws://localhost:9085');
            
            this.unityWS.onopen = () => {
                console.log('🎯 Connected to Unity Engine');
                this.coordination.streams.unity.active = true;
                
                // Request Unity to start streaming
                this.unityWS.send(JSON.stringify({
                    type: 'start_streaming',
                    targetFPS: 120,
                    quality: 'high'
                }));
            };
            
            this.unityWS.onmessage = (event) => {
                const data = JSON.parse(event.data);
                
                if (data.type === 'frame') {
                    // Forward Unity frame to coordination server
                    this.coordination.broadcastToDashboards({
                        type: 'unity_frame',
                        streamId: 'unity',
                        frameData: data.frameData,
                        timestamp: Date.now()
                    });
                    
                    this.coordination.streams.unity.lastFrame = Date.now();
                }
            };
            
            this.unityWS.onerror = (error) => {
                console.log('⚠️ Unity WebSocket error, will retry...');
                setTimeout(() => this.connectToUnity(), 5000);
            };
            
            this.unityWS.onclose = () => {
                console.log('🔌 Unity connection closed, retrying...');
                this.coordination.streams.unity.active = false;
                setTimeout(() => this.connectToUnity(), 5000);
            };
            
        } catch (error) {
            console.log('⚠️ Unity not available, will retry in 10 seconds');
            setTimeout(() => this.connectToUnity(), 10000);
        }
    }
}

// Canvas capture helper for HTML-based streams
class CanvasStreamCapture {
    constructor(coordinationServer) {
        this.coordination = coordinationServer;
        this.captureIntervals = new Map();
    }
    
    startCapturingHTMLStreams() {
        // Monitor HTML-based streams for canvas content
        // This would integrate with the actual HTML systems
        
        const htmlStreams = ['3d', '4d', 'network'];
        
        htmlStreams.forEach(streamId => {
            // Simulate canvas frame capture
            const interval = setInterval(() => {
                if (this.coordination.streams[streamId].active) {
                    // In real implementation, this would capture actual canvas data
                    const mockFrameData = {
                        timestamp: Date.now(),
                        width: 1920,
                        height: 1080,
                        data: `mock_frame_${streamId}_${Date.now()}`
                    };
                    
                    this.coordination.broadcastToDashboards({
                        type: 'canvas_frame',
                        streamId,
                        frameData: mockFrameData,
                        timestamp: Date.now()
                    });
                    
                    this.coordination.streams[streamId].lastFrame = Date.now();
                }
            }, 1000 / this.coordination.streams[streamId].fps);
            
            this.captureIntervals.set(streamId, interval);
        });
        
        console.log('📹 Canvas capture system initialized for HTML streams');
    }
    
    stopCapturing() {
        this.captureIntervals.forEach(interval => clearInterval(interval));
        this.captureIntervals.clear();
    }
}

// Auto-start server if run directly
if (require.main === module) {
    const coordinationServer = new StreamCoordinationServer();
    const unityBridge = new UnityStreamBridge(coordinationServer);
    const canvasCapture = new CanvasStreamCapture(coordinationServer);
    
    coordinationServer.start(8999);
    
    // Start HTML stream capture after a delay
    setTimeout(() => {
        canvasCapture.startCapturingHTMLStreams();
    }, 2000);
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down Stream Coordination Server...');
        canvasCapture.stopCapturing();
        process.exit(0);
    });
}

module.exports = { StreamCoordinationServer, UnityStreamBridge, CanvasStreamCapture };