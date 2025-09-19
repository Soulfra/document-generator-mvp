#!/usr/bin/env node

/**
 * WebRTC Stream Bridge - Peer-to-Peer Video Streaming
 * 
 * Enables direct WebRTC connections between visual systems and dashboards
 * for high-quality, low-latency video streaming of:
 * - 3D game worlds with spinning elements
 * - Unity/Godot engine output 
 * - Canvas animations and visualizations
 * - Real-time dashboard feeds
 */

const express = require('express');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');

class WebRTCStreamBridge {
    constructor() {
        this.app = express();
        this.server = null;
        this.wss = null;
        
        // WebRTC peer connections
        this.peers = new Map();
        this.streamSources = new Map();
        this.dashboards = new Map();
        
        // Stream routing table
        this.streamRoutes = {
            '3d-game': { 
                source: 'html_canvas', 
                url: '/actually-working-3d-game.html',
                description: 'Spinning collectibles, animated NPCs'
            },
            '4d-vector': { 
                source: 'html_canvas', 
                url: '/LIVE-4D-VECTORIZED-WORLD.html',
                description: 'THE BUTTON, pulsing matrix grid'
            },
            'agent-network': { 
                source: 'html_canvas', 
                url: '/agent-streaming-network.html',
                description: 'Battle.net style network viz'
            },
            'unity-engine': { 
                source: 'unity_direct', 
                port: 9085,
                description: 'Professional game engine rendering'
            },
            'godot-engine': { 
                source: 'godot_direct', 
                port: 9090,
                description: 'Godot engine 3D output'
            }
        };
        
        this.setupExpress();
        this.setupWebSocket();
        this.setupSignalingServer();
    }
    
    setupExpress() {
        this.app.use(express.static('.'));
        this.app.use(express.json());
        
        // WebRTC signaling API
        this.app.post('/api/webrtc/offer', (req, res) => {
            const { streamId, offer, peerId } = req.body;
            
            // Route offer to appropriate stream source
            const source = this.streamSources.get(streamId);
            if (source && source.ws.readyState === WebSocket.OPEN) {
                source.ws.send(JSON.stringify({
                    type: 'webrtc_offer',
                    offer,
                    peerId,
                    streamId
                }));
                
                res.json({ success: true });
            } else {
                res.status(404).json({ error: 'Stream source not available' });
            }
        });
        
        // ICE candidate exchange
        this.app.post('/api/webrtc/ice', (req, res) => {
            const { streamId, candidate, peerId } = req.body;
            
            // Forward ICE candidate
            this.broadcastToStream(streamId, {
                type: 'ice_candidate',
                candidate,
                peerId
            });
            
            res.json({ success: true });
        });
        
        // Stream discovery
        this.app.get('/api/streams/available', (req, res) => {
            const available = {};
            
            Object.keys(this.streamRoutes).forEach(streamId => {
                const route = this.streamRoutes[streamId];
                const source = this.streamSources.get(streamId);
                
                available[streamId] = {
                    ...route,
                    online: source ? source.connected : false,
                    viewers: this.getViewerCount(streamId)
                };
            });
            
            res.json({
                success: true,
                streams: available,
                totalSources: this.streamSources.size,
                totalViewers: this.dashboards.size
            });
        });
    }
    
    setupWebSocket() {
        this.server = require('http').createServer(this.app);
        this.wss = new WebSocket.Server({ 
            server: this.server,
            port: 9999 
        });
        
        this.wss.on('connection', (ws, req) => {
            const clientId = uuidv4();
            ws.clientId = clientId;
            
            console.log(`🔗 WebRTC client connected: ${clientId}`);
            
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.handleSignalingMessage(ws, message);
                } catch (error) {
                    console.error('❌ Invalid signaling message:', error);
                }
            });
            
            ws.on('close', () => {
                this.handleClientDisconnect(ws);
            });
        });
    }
    
    setupSignalingServer() {
        // WebRTC signaling coordination
        console.log('📡 WebRTC Signaling Server initialized');
    }
    
    handleSignalingMessage(ws, message) {
        switch(message.type) {
            case 'register_stream_source':
                this.registerStreamSource(ws, message);
                break;
                
            case 'register_dashboard':
                this.registerDashboard(ws, message);
                break;
                
            case 'webrtc_offer':
                this.forwardOffer(ws, message);
                break;
                
            case 'webrtc_answer':
                this.forwardAnswer(ws, message);
                break;
                
            case 'ice_candidate':
                this.forwardICECandidate(ws, message);
                break;
                
            case 'canvas_stream_ready':
                this.handleCanvasStreamReady(ws, message);
                break;
                
            default:
                console.log('⚠️ Unknown signaling message:', message.type);
        }
    }
    
    registerStreamSource(ws, message) {
        const { streamId, sourceType } = message;
        
        ws.isStreamSource = true;
        ws.streamId = streamId;
        
        this.streamSources.set(streamId, {
            ws,
            sourceType,
            connected: true,
            lastSeen: Date.now()
        });
        
        console.log(`📹 Stream source registered: ${streamId} (${sourceType})`);
        
        // Notify dashboards about new stream
        this.broadcastToDashboards({
            type: 'stream_available',
            streamId,
            sourceType,
            description: this.streamRoutes[streamId]?.description || 'Unknown stream'
        });
    }
    
    registerDashboard(ws, message) {
        const { dashboardId, requestedStreams } = message;
        
        ws.isDashboard = true;
        ws.dashboardId = dashboardId;
        ws.requestedStreams = requestedStreams || [];
        
        this.dashboards.set(dashboardId, {
            ws,
            requestedStreams,
            connected: true,
            lastSeen: Date.now()
        });
        
        console.log(`📺 Dashboard registered: ${dashboardId}, wants: ${requestedStreams.join(', ')}`);
        
        // Send available streams to dashboard
        ws.send(JSON.stringify({
            type: 'available_streams',
            streams: Object.keys(this.streamRoutes)
        }));
    }
    
    forwardOffer(ws, message) {
        const { targetPeer, offer, streamId } = message;
        
        // Forward WebRTC offer to target peer
        const target = this.findPeer(targetPeer);
        if (target) {
            target.send(JSON.stringify({
                type: 'webrtc_offer',
                offer,
                fromPeer: ws.clientId,
                streamId
            }));
        }
    }
    
    forwardAnswer(ws, message) {
        const { targetPeer, answer, streamId } = message;
        
        // Forward WebRTC answer to target peer
        const target = this.findPeer(targetPeer);
        if (target) {
            target.send(JSON.stringify({
                type: 'webrtc_answer',
                answer,
                fromPeer: ws.clientId,
                streamId
            }));
        }
    }
    
    forwardICECandidate(ws, message) {
        const { targetPeer, candidate, streamId } = message;
        
        // Forward ICE candidate to target peer
        const target = this.findPeer(targetPeer);
        if (target) {
            target.send(JSON.stringify({
                type: 'ice_candidate',
                candidate,
                fromPeer: ws.clientId,
                streamId
            }));
        }
    }
    
    handleCanvasStreamReady(ws, message) {
        const { streamId, canvasData } = message;
        
        console.log(`🎨 Canvas stream ready: ${streamId}`);
        
        // Notify dashboards that canvas stream is available
        this.broadcastToDashboards({
            type: 'canvas_stream_ready',
            streamId,
            sourceId: ws.clientId
        });
    }
    
    findPeer(peerId) {
        // Search in stream sources
        for (const [streamId, source] of this.streamSources) {
            if (source.ws.clientId === peerId) {
                return source.ws;
            }
        }
        
        // Search in dashboards
        for (const [dashboardId, dashboard] of this.dashboards) {
            if (dashboard.ws.clientId === peerId) {
                return dashboard.ws;
            }
        }
        
        return null;
    }
    
    broadcastToDashboards(message) {
        this.dashboards.forEach((dashboard, dashboardId) => {
            if (dashboard.ws.readyState === WebSocket.OPEN) {
                dashboard.ws.send(JSON.stringify(message));
            }
        });
    }
    
    broadcastToStream(streamId, message) {
        const source = this.streamSources.get(streamId);
        if (source && source.ws.readyState === WebSocket.OPEN) {
            source.ws.send(JSON.stringify(message));
        }
    }
    
    getViewerCount(streamId) {
        let count = 0;
        this.dashboards.forEach(dashboard => {
            if (dashboard.requestedStreams.includes(streamId)) {
                count++;
            }
        });
        return count;
    }
    
    handleClientDisconnect(ws) {
        if (ws.isStreamSource && ws.streamId) {
            this.streamSources.delete(ws.streamId);
            console.log(`📹 Stream source disconnected: ${ws.streamId}`);
            
            // Notify dashboards
            this.broadcastToDashboards({
                type: 'stream_unavailable',
                streamId: ws.streamId
            });
        }
        
        if (ws.isDashboard && ws.dashboardId) {
            this.dashboards.delete(ws.dashboardId);
            console.log(`📺 Dashboard disconnected: ${ws.dashboardId}`);
        }
    }
    
    // Statistics and monitoring
    getStats() {
        return {
            streamSources: this.streamSources.size,
            dashboards: this.dashboards.size,
            availableStreams: Object.keys(this.streamRoutes).length,
            uptime: process.uptime()
        };
    }
    
    start(port = 9999) {
        this.server.listen(port, () => {
            console.log(`🌐 WebRTC Stream Bridge running on port ${port}`);
            console.log(`📡 Signaling Server: ws://localhost:${port}`);
            console.log('');
            console.log('📹 Available video streams:');
            Object.keys(this.streamRoutes).forEach(streamId => {
                const route = this.streamRoutes[streamId];
                console.log(`  • ${streamId}: ${route.description} (${route.source})`);
            });
            console.log('');
            console.log('🎥 Integration points:');
            console.log('  • HTML Canvas: captureStream() API');
            console.log('  • Unity Engine: WebSocket @ port 9085');
            console.log('  • Godot Engine: WebSocket @ port 9090');
            console.log('  • Dashboard: live-video-streaming-dashboard.html');
        });
    }
}

// Canvas Stream Helper - Client-side integration
const CanvasStreamHelper = {
    // Initialize canvas streaming for HTML pages
    initCanvasStreaming: function(streamId, canvasElement) {
        if (!canvasElement || !canvasElement.captureStream) {
            console.error('Canvas streaming not supported');
            return null;
        }
        
        // Create media stream from canvas
        const stream = canvasElement.captureStream(30); // 30 FPS
        
        // Connect to WebRTC bridge
        const ws = new WebSocket('ws://localhost:9999');
        
        ws.onopen = () => {
            // Register as stream source
            ws.send(JSON.stringify({
                type: 'register_stream_source',
                streamId,
                sourceType: 'html_canvas'
            }));
        };
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'webrtc_offer') {
                this.handleWebRTCOffer(stream, ws, data);
            }
        };
        
        return { stream, ws };
    },
    
    // Handle WebRTC offer from dashboard
    handleWebRTCOffer: function(mediaStream, ws, data) {
        const peerConnection = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });
        
        // Add stream to peer connection
        mediaStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, mediaStream);
        });
        
        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                ws.send(JSON.stringify({
                    type: 'ice_candidate',
                    candidate: event.candidate,
                    targetPeer: data.fromPeer,
                    streamId: data.streamId
                }));
            }
        };
        
        // Set remote offer and create answer
        peerConnection.setRemoteDescription(data.offer)
            .then(() => peerConnection.createAnswer())
            .then(answer => {
                peerConnection.setLocalDescription(answer);
                
                ws.send(JSON.stringify({
                    type: 'webrtc_answer',
                    answer,
                    targetPeer: data.fromPeer,
                    streamId: data.streamId
                }));
            })
            .catch(error => {
                console.error('WebRTC answer error:', error);
            });
    }
};

// Unity Integration Helper
class UnityWebRTCIntegration {
    constructor(bridgeServer) {
        this.bridge = bridgeServer;
        this.unityWS = null;
        this.peerConnections = new Map();
        
        this.connectToUnity();
    }
    
    connectToUnity() {
        try {
            this.unityWS = new WebSocket('ws://localhost:9085');
            
            this.unityWS.onopen = () => {
                console.log('🎯 Unity WebRTC integration established');
                
                // Register Unity as stream source
                this.registerWithBridge();
                
                // Request Unity to enable WebRTC streaming
                this.unityWS.send(JSON.stringify({
                    type: 'enable_webrtc_streaming',
                    targetFPS: 120,
                    quality: 'ultra',
                    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
                }));
            };
            
            this.unityWS.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleUnityMessage(data);
            };
            
            this.unityWS.onerror = () => {
                console.log('⚠️ Unity WebRTC integration error');
            };
            
        } catch (error) {
            console.log('⚠️ Unity not available for WebRTC streaming');
        }
    }
    
    registerWithBridge() {
        // Connect to the bridge server
        const bridgeWS = new WebSocket('ws://localhost:9999');
        
        bridgeWS.onopen = () => {
            bridgeWS.send(JSON.stringify({
                type: 'register_stream_source',
                streamId: 'unity-engine',
                sourceType: 'unity_webrtc'
            }));
        };
        
        bridgeWS.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            if (data.type === 'webrtc_offer') {
                this.handleDashboardOffer(data);
            }
        };
        
        this.bridgeWS = bridgeWS;
    }
    
    handleUnityMessage(data) {
        switch(data.type) {
            case 'webrtc_offer':
                // Unity created an offer for streaming
                this.forwardUnityOffer(data);
                break;
                
            case 'webrtc_answer':
                // Unity answered a dashboard offer
                this.forwardUnityAnswer(data);
                break;
                
            case 'ice_candidate':
                // Unity sent ICE candidate
                this.forwardUnityICE(data);
                break;
                
            case 'stream_ready':
                console.log('🎯 Unity stream ready for WebRTC connections');
                break;
        }
    }
    
    handleDashboardOffer(data) {
        // Forward dashboard offer to Unity
        if (this.unityWS && this.unityWS.readyState === WebSocket.OPEN) {
            this.unityWS.send(JSON.stringify({
                type: 'webrtc_offer_from_dashboard',
                offer: data.offer,
                peerId: data.fromPeer
            }));
        }
    }
    
    forwardUnityOffer(data) {
        // Forward Unity offer to bridge
        if (this.bridgeWS && this.bridgeWS.readyState === WebSocket.OPEN) {
            this.bridgeWS.send(JSON.stringify({
                type: 'webrtc_offer',
                offer: data.offer,
                streamId: 'unity-engine',
                targetPeer: data.targetPeer
            }));
        }
    }
    
    forwardUnityAnswer(data) {
        // Forward Unity answer to bridge
        if (this.bridgeWS && this.bridgeWS.readyState === WebSocket.OPEN) {
            this.bridgeWS.send(JSON.stringify({
                type: 'webrtc_answer',
                answer: data.answer,
                streamId: 'unity-engine',
                targetPeer: data.targetPeer
            }));
        }
    }
    
    forwardUnityICE(data) {
        // Forward Unity ICE candidate to bridge
        if (this.bridgeWS && this.bridgeWS.readyState === WebSocket.OPEN) {
            this.bridgeWS.send(JSON.stringify({
                type: 'ice_candidate',
                candidate: data.candidate,
                streamId: 'unity-engine',
                targetPeer: data.targetPeer
            }));
        }
    }
}

// HTML Canvas Stream Injector
const HTMLCanvasStreamInjector = `
// Inject this script into HTML pages to enable WebRTC streaming
(function() {
    console.log('🎨 Initializing Canvas WebRTC Streaming');
    
    // Find all canvas elements
    const canvases = document.querySelectorAll('canvas');
    
    canvases.forEach((canvas, index) => {
        if (canvas.getContext) {
            // Enable streaming for this canvas
            const streamId = canvas.id || 'canvas-' + index;
            
            // Create media stream
            if (canvas.captureStream) {
                const stream = canvas.captureStream(30);
                
                // Connect to WebRTC bridge
                const ws = new WebSocket('ws://localhost:9999');
                
                ws.onopen = () => {
                    ws.send(JSON.stringify({
                        type: 'register_stream_source',
                        streamId,
                        sourceType: 'html_canvas'
                    }));
                    
                    console.log('📹 Canvas stream registered:', streamId);
                };
                
                ws.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    
                    if (data.type === 'webrtc_offer') {
                        handleWebRTCOffer(stream, ws, data);
                    }
                };
            }
        }
    });
    
    function handleWebRTCOffer(mediaStream, ws, data) {
        const peerConnection = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });
        
        // Add stream to peer connection
        mediaStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, mediaStream);
        });
        
        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                ws.send(JSON.stringify({
                    type: 'ice_candidate',
                    candidate: event.candidate,
                    targetPeer: data.fromPeer,
                    streamId: data.streamId
                }));
            }
        };
        
        // Create answer
        peerConnection.setRemoteDescription(data.offer)
            .then(() => peerConnection.createAnswer())
            .then(answer => {
                peerConnection.setLocalDescription(answer);
                
                ws.send(JSON.stringify({
                    type: 'webrtc_answer',
                    answer,
                    targetPeer: data.fromPeer,
                    streamId: data.streamId
                }));
            });
    }
})();
`;

// Auto-start server if run directly
if (require.main === module) {
    const bridge = new WebRTCStreamBridge();
    const unityIntegration = new UnityWebRTCIntegration(bridge);
    
    bridge.start(9999);
    
    // Write canvas injection script for HTML pages
    require('fs').writeFileSync(
        'canvas-webrtc-injector.js', 
        HTMLCanvasStreamInjector
    );
    
    console.log('💾 Canvas WebRTC injector script saved');
    console.log('');
    console.log('🚀 WebRTC Stream Bridge Ready!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Open live-video-streaming-dashboard.html');
    console.log('2. Start Unity with WebRTC enabled');
    console.log('3. Open 3D game worlds to begin streaming');
    console.log('4. Enjoy live video feeds of spinning emojis! 🎥');
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down WebRTC Stream Bridge...');
        process.exit(0);
    });
}

module.exports = { WebRTCStreamBridge, UnityWebRTCIntegration, CanvasStreamHelper };