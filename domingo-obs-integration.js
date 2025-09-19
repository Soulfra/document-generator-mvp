#!/usr/bin/env node

/**
 * Domingo OBS Integration - Virtual Streamer Setup
 * 
 * Connects Domingo virtual character to OBS for Twitch/YouTube streaming
 * Features:
 * - Real-time screen capture integration
 * - Chat interaction with database logging
 * - Purple eye activity detection
 * - Token collection and organization
 * - Mirror loop prevention
 */

const WebSocket = require('ws');
const express = require('express');
const fs = require('fs');
const path = require('path');

class DomingoOBSIntegration {
    constructor() {
        this.app = express();
        this.server = null;
        this.wss = null;
        
        // Domingo state
        this.domingoState = {
            activity: 0.5,
            currentTask: 'Initializing Virtual Streamer',
            progress: 0,
            isTyping: false,
            mouseActive: false,
            eyeGlow: 0.3,
            position: { x: 0, y: 1.7, z: 0 },
            lookDirection: { x: 0, y: 0, z: -1 }
        };
        
        // Stream management
        this.streams = {
            character: { active: false, viewers: 0 },
            unityMonitor: { active: false, content: null },
            codeMonitor: { active: false, content: null },
            chatOverlay: { active: true, messages: [] }
        };
        
        // Token collection
        this.tokens = [];
        this.tokenTypes = {
            code: { color: '#00ff00', value: 10 },
            llm_response: { color: '#ff6600', value: 25 },
            chat_insight: { color: '#0066ff', value: 5 },
            milestone: { color: '#ff0066', value: 100 },
            collaboration: { color: '#8a2be2', value: 50 }
        };
        
        // Mirror loop detection
        this.mirrorProtection = {
            enabled: true,
            detectionHistory: [],
            maxSimilarity: 0.95,
            cooldownTime: 5000,
            lastCooldown: 0
        };
        
        // Chat database
        this.chatHistory = [];
        this.llmConversations = [];
        
        this.setupExpress();
        this.setupWebSocket();
        this.setupScreenCapture();
    }
    
    setupExpress() {
        this.app.use(express.static('.'));
        this.app.use(express.json());
        
        // OBS browser source endpoint
        this.app.get('/obs/domingo-scene', (req, res) => {
            res.sendFile(path.join(__dirname, 'domingo-virtual-streamer.html'));
        });
        
        // Stream status API for OBS
        this.app.get('/api/domingo/status', (req, res) => {
            res.json({
                success: true,
                domingo: this.domingoState,
                streams: this.streams,
                tokens: this.tokens.length,
                chatMessages: this.chatHistory.length,
                mirrorSafe: this.isMirrorSafe()
            });
        });
        
        // Chat webhook for Twitch integration
        this.app.post('/api/domingo/chat', (req, res) => {
            const { username, message, platform } = req.body;
            
            this.processChatMessage({
                username,
                message,
                platform: platform || 'twitch',
                timestamp: Date.now()
            });
            
            res.json({ success: true, processed: true });
        });
        
        // Task update API
        this.app.post('/api/domingo/task', (req, res) => {
            const { task, progress, activity } = req.body;
            
            this.updateDomingoTask(task, progress, activity);
            
            res.json({ success: true, updated: true });
        });
        
        // Screen content API
        this.app.post('/api/domingo/screen', (req, res) => {
            const { monitor, content, screenshot } = req.body;
            
            this.updateMonitorContent(monitor, content, screenshot);
            
            res.json({ success: true, updated: true });
        });
        
        // Token collection API
        this.app.post('/api/domingo/token', (req, res) => {
            const { type, value, metadata } = req.body;
            
            const token = this.collectToken(type, value, metadata);
            
            res.json({ 
                success: true, 
                token,
                totalTokens: this.tokens.length 
            });
        });
    }
    
    setupWebSocket() {
        this.server = require('http').createServer(this.app);
        this.wss = new WebSocket.Server({ 
            server: this.server,
            port: 7777 
        });
        
        this.wss.on('connection', (ws, req) => {
            console.log('🔗 New connection to Domingo OBS Integration');
            
            ws.on('message', (data) => {
                try {
                    const message = JSON.parse(data);
                    this.handleWebSocketMessage(ws, message);
                } catch (error) {
                    console.error('❌ Invalid message:', error);
                }
            });
            
            // Send current state
            ws.send(JSON.stringify({
                type: 'domingo_state',
                state: this.domingoState,
                streams: this.streams,
                tokens: this.tokens.slice(-10) // Last 10 tokens
            }));
        });
    }
    
    setupScreenCapture() {
        // Monitor system activity for purple eye glow
        setInterval(() => {
            this.detectSystemActivity();
        }, 1000);
        
        // Simulate typing/mouse activity
        setInterval(() => {
            this.simulateUserActivity();
        }, 2000);
        
        // Check for mirror loops
        setInterval(() => {
            this.checkMirrorLoops();
        }, 500);
    }
    
    handleWebSocketMessage(ws, message) {
        switch(message.type) {
            case 'register_obs_source':
                ws.isOBSSource = true;
                console.log('📺 OBS source registered');
                break;
                
            case 'register_unity_monitor':
                ws.isUnityMonitor = true;
                console.log('🎯 Unity monitor registered');
                break;
                
            case 'register_chat_client':
                ws.isChatClient = true;
                console.log('💬 Chat client registered');
                break;
                
            case 'unity_screen_update':
                this.handleUnityScreenUpdate(message);
                break;
                
            case 'activity_detected':
                this.handleActivityDetection(message);
                break;
                
            case 'chat_message':
                this.processChatMessage(message);
                break;
        }
    }
    
    detectSystemActivity() {
        // Check various system indicators
        const indicators = {
            cpu: this.getCPUActivity(),
            network: this.getNetworkActivity(),
            fileSystem: this.getFileSystemActivity(),
            userInput: this.getUserInputActivity()
        };
        
        // Calculate overall activity level
        const activityValues = Object.values(indicators);
        const avgActivity = activityValues.reduce((a, b) => a + b, 0) / activityValues.length;
        
        this.domingoState.activity = avgActivity;
        this.domingoState.eyeGlow = 0.3 + (avgActivity * 0.7);
        
        // Broadcast activity update
        this.broadcastToDashboards({
            type: 'activity_update',
            activity: avgActivity,
            indicators,
            eyeGlow: this.domingoState.eyeGlow
        });
    }
    
    getCPUActivity() {
        // Simulate CPU monitoring
        const usage = process.cpuUsage();
        return Math.min(1.0, (usage.user + usage.system) / 1000000); // Rough approximation
    }
    
    getNetworkActivity() {
        // Monitor WebSocket connections
        return Math.min(1.0, this.wss.clients.size / 10);
    }
    
    getFileSystemActivity() {
        // Monitor file changes (simplified)
        return Math.random() * 0.5; // Placeholder
    }
    
    getUserInputActivity() {
        // Detect typing/mouse activity
        return this.domingoState.isTyping ? 0.8 : 0.2;
    }
    
    simulateUserActivity() {
        // Simulate realistic work patterns
        const activities = ['typing', 'thinking', 'reading', 'mouse', 'idle'];
        const randomActivity = activities[Math.floor(Math.random() * activities.length)];
        
        switch(randomActivity) {
            case 'typing':
                this.domingoState.isTyping = true;
                this.domingoState.mouseActive = false;
                setTimeout(() => {
                    this.domingoState.isTyping = false;
                }, 2000 + Math.random() * 3000);
                break;
                
            case 'mouse':
                this.domingoState.mouseActive = true;
                setTimeout(() => {
                    this.domingoState.mouseActive = false;
                }, 1000 + Math.random() * 2000);
                break;
                
            case 'thinking':
                // Look away from screen
                this.domingoState.lookDirection = { x: 0.3, y: 0.1, z: -1 };
                setTimeout(() => {
                    this.domingoState.lookDirection = { x: 0, y: 0, z: -1 };
                }, 3000);
                break;
        }
        
        // Broadcast activity
        this.broadcastToDashboards({
            type: 'domingo_animation_update',
            state: this.domingoState
        });
    }
    
    processChatMessage(chatData) {
        const { username, message, platform, timestamp } = chatData;
        
        // Add to chat history
        this.chatHistory.push({
            id: Date.now(),
            username,
            message,
            platform: platform || 'twitch',
            timestamp: timestamp || Date.now(),
            responded: false
        });
        
        // Store in database (would be real database in production)
        this.saveChatToDatabase(chatData);
        
        // Generate AI response
        this.generateDomingoResponse(message, username);
        
        // Check if message triggers token collection
        this.checkForTokenTriggers(message, username);
        
        // Broadcast chat update
        this.broadcastToDashboards({
            type: 'chat_update',
            message: chatData,
            totalMessages: this.chatHistory.length
        });
        
        console.log(`💬 Chat processed: ${username}: ${message}`);
    }
    
    generateDomingoResponse(message, username) {
        // Simulate AI thinking time
        const thinkingTime = 1000 + Math.random() * 3000;
        
        setTimeout(() => {
            // Look toward chat area
            this.domingoState.lookDirection = { x: 0.8, y: 0.2, z: -0.5 };
            
            // Generate contextual response
            const responses = this.getContextualResponses(message, username);
            const response = responses[Math.floor(Math.random() * responses.length)];
            
            // Add to LLM conversation log
            this.llmConversations.push({
                input: message,
                output: response,
                username,
                timestamp: Date.now(),
                context: this.domingoState.currentTask
            });
            
            // Broadcast response
            this.broadcastToDashboards({
                type: 'domingo_response',
                response,
                username,
                originalMessage: message
            });
            
            // Look back at screen after responding
            setTimeout(() => {
                this.domingoState.lookDirection = { x: 0, y: 0, z: -1 };
            }, 2000);
            
        }, thinkingTime);
    }
    
    getContextualResponses(message, username) {
        const currentTask = this.domingoState.currentTask.toLowerCase();
        
        if (message.toLowerCase().includes('code') || message.toLowerCase().includes('programming')) {
            return [
                `🤖 Hey ${username}! I'm working on ${currentTask} right now. Watch my screen!`,
                `🤖 Great question ${username}! Let me show you the code I'm writing...`,
                `🤖 ${username}, check out this function I just completed! *types faster*`
            ];
        }
        
        if (message.toLowerCase().includes('unity') || message.toLowerCase().includes('3d')) {
            return [
                `🤖 Unity is so powerful ${username}! Watch my right monitor for the 3D scene.`,
                `🤖 I love working in Unity! Currently building ${currentTask}.`,
                `🤖 ${username}, you can see the Unity editor on my second monitor!`
            ];
        }
        
        if (message.toLowerCase().includes('eye') || message.toLowerCase().includes('purple')) {
            return [
                `🤖 The purple glow shows my system activity level! Brighter = more coding.`,
                `🤖 When I'm really focused, my eye glows bright purple! 👁️💜`,
                `🤖 That's my concentration indicator ${username}! Programming mode activated!`
            ];
        }
        
        return [
            `🤖 Thanks for watching ${username}! Currently: ${this.domingoState.currentTask}`,
            `🤖 Interesting point ${username}! Let me think about that... *head turn*`,
            `🤖 Great to have you here ${username}! Hope you enjoy the coding session!`
        ];
    }
    
    collectToken(type, value, metadata = {}) {
        const token = {
            id: Date.now(),
            type: type || 'generic',
            value: value || 'Collected Item',
            color: this.tokenTypes[type]?.color || '#888888',
            points: this.tokenTypes[type]?.value || 1,
            metadata,
            timestamp: Date.now(),
            source: metadata.source || 'manual'
        };
        
        this.tokens.push(token);
        
        // Visual celebration
        this.celebrateTokenCollection(token);
        
        // Broadcast token collection
        this.broadcastToDashboards({
            type: 'token_collected',
            token,
            totalTokens: this.tokens.length,
            totalValue: this.tokens.reduce((sum, t) => sum + t.points, 0)
        });
        
        console.log(`🎁 Token collected: ${token.value} (${token.points} points)`);
        return token;
    }
    
    celebrateTokenCollection(token) {
        // Domingo looks toward token collection area
        this.domingoState.lookDirection = { x: 0.7, y: 0.3, z: 0.5 };
        
        // Increase eye glow temporarily
        const originalGlow = this.domingoState.eyeGlow;
        this.domingoState.eyeGlow = 1.0;
        
        setTimeout(() => {
            this.domingoState.eyeGlow = originalGlow;
            this.domingoState.lookDirection = { x: 0, y: 0, z: -1 };
        }, 2000);
    }
    
    checkForTokenTriggers(message, username) {
        const msg = message.toLowerCase();
        
        // Code-related messages
        if (msg.includes('function') || msg.includes('class') || msg.includes('variable')) {
            this.collectToken('code', `Code insight from ${username}`, { 
                source: 'chat',
                trigger: message 
            });
        }
        
        // LLM collaboration mentions
        if (msg.includes('llm') || msg.includes('ai') || msg.includes('gpt') || msg.includes('claude')) {
            this.collectToken('llm_response', `AI discussion with ${username}`, { 
                source: 'chat',
                trigger: message 
            });
        }
        
        // Insightful comments
        if (msg.includes('why') || msg.includes('how') || msg.includes('explain')) {
            this.collectToken('chat_insight', `Question from ${username}`, { 
                source: 'chat',
                trigger: message 
            });
        }
    }
    
    updateDomingoTask(task, progress, activity) {
        this.domingoState.currentTask = task || this.domingoState.currentTask;
        this.domingoState.progress = progress || this.domingoState.progress;
        
        if (activity !== undefined) {
            this.domingoState.activity = Math.max(0, Math.min(1, activity));
            this.domingoState.eyeGlow = 0.3 + (this.domingoState.activity * 0.7);
        }
        
        // Check for milestone tokens
        if (progress && progress % 25 === 0) {
            this.collectToken('milestone', `${progress}% Complete: ${task}`, {
                source: 'system',
                progress
            });
        }
        
        console.log(`📋 Task updated: ${task} (${progress}%)`);
    }
    
    updateMonitorContent(monitor, content, screenshot) {
        if (monitor === 'unity') {
            this.streams.unityMonitor.content = content;
            this.streams.unityMonitor.active = true;
        } else if (monitor === 'code') {
            this.streams.codeMonitor.content = content;
            this.streams.codeMonitor.active = true;
        }
        
        // Broadcast screen update
        this.broadcastToDashboards({
            type: 'monitor_update',
            monitor,
            content: content ? content.substring(0, 200) : null, // Truncate for transport
            screenshot: screenshot || null
        });
    }
    
    checkMirrorLoops() {
        if (!this.mirrorProtection.enabled) return;
        
        const now = Date.now();
        
        // Check if we're in cooldown
        if (now - this.mirrorProtection.lastCooldown < this.mirrorProtection.cooldownTime) {
            return;
        }
        
        // Analyze recent activity patterns
        const recentHistory = this.mirrorProtection.detectionHistory
            .filter(h => now - h.timestamp < 10000); // Last 10 seconds
        
        if (recentHistory.length > 20) {
            // Check for repetitive patterns
            const similarity = this.calculatePatternSimilarity(recentHistory);
            
            if (similarity > this.mirrorProtection.maxSimilarity) {
                this.triggerMirrorLoopProtection();
            }
        }
        
        // Add current state to history
        this.mirrorProtection.detectionHistory.push({
            activity: this.domingoState.activity,
            isTyping: this.domingoState.isTyping,
            eyeGlow: this.domingoState.eyeGlow,
            timestamp: now
        });
        
        // Keep history size manageable
        if (this.mirrorProtection.detectionHistory.length > 100) {
            this.mirrorProtection.detectionHistory = 
                this.mirrorProtection.detectionHistory.slice(-50);
        }
    }
    
    calculatePatternSimilarity(history) {
        if (history.length < 5) return 0;
        
        // Simple similarity check - are we doing the same thing repeatedly?
        const recent = history.slice(-5);
        const typingCount = recent.filter(h => h.isTyping).length;
        const activityVariance = this.calculateVariance(recent.map(h => h.activity));
        
        // High similarity = low variance + repetitive actions
        return typingCount > 4 ? (1 - activityVariance) : activityVariance;
    }
    
    calculateVariance(values) {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
    }
    
    triggerMirrorLoopProtection() {
        console.log('🔄 Mirror loop detected - entering chill mode');
        
        this.mirrorProtection.lastCooldown = Date.now();
        
        // Reduce all activity
        this.domingoState.activity = 0.2;
        this.domingoState.isTyping = false;
        this.domingoState.mouseActive = false;
        this.domingoState.eyeGlow = 0.1;
        
        // Broadcast mirror loop warning
        this.broadcastToDashboards({
            type: 'mirror_loop_detected',
            message: 'Domingo is chilling out to prevent feedback loops',
            duration: this.mirrorProtection.cooldownTime
        });
        
        // Gradually return to normal activity
        setTimeout(() => {
            this.domingoState.activity = 0.5;
            this.domingoState.eyeGlow = 0.4;
            
            this.broadcastToDashboards({
                type: 'mirror_loop_resolved',
                message: 'Domingo is back to normal activity'
            });
        }, this.mirrorProtection.cooldownTime);
    }
    
    handleUnityScreenUpdate(message) {
        const { screenshot, metadata } = message;
        
        this.updateMonitorContent('unity', 'Unity Scene Update', screenshot);
        
        // If Unity is doing something interesting, increase activity
        if (metadata?.interactionDetected) {
            this.domingoState.activity = Math.min(1.0, this.domingoState.activity + 0.2);
        }
    }
    
    handleActivityDetection(message) {
        const { source, level, details } = message;
        
        // Update activity based on source
        switch(source) {
            case 'keyboard':
                this.domingoState.isTyping = level > 0.5;
                break;
            case 'mouse':
                this.domingoState.mouseActive = level > 0.3;
                break;
            case 'system':
                this.domingoState.activity = level;
                break;
        }
    }
    
    saveChatToDatabase(chatData) {
        // In production, this would save to actual database
        const dbEntry = {
            ...chatData,
            processed: true,
            domingoResponse: null, // Will be filled when response is generated
            tokenTriggered: false,
            sessionId: this.getSessionId()
        };
        
        // Simulate database save
        console.log('💾 Chat saved to database:', dbEntry.username);
    }
    
    getSessionId() {
        // Generate session ID based on current time
        const now = new Date();
        return `domingo-stream-${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}-${now.getHours()}${now.getMinutes()}`;
    }
    
    broadcastToDashboards(message) {
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    timestamp: Date.now(),
                    ...message
                }));
            }
        });
    }
    
    isMirrorSafe() {
        const now = Date.now();
        return now - this.mirrorProtection.lastCooldown > this.mirrorProtection.cooldownTime;
    }
    
    // OBS Scene configuration
    generateOBSSceneConfig() {
        return {
            sceneName: "Domingo Virtual Streamer",
            sources: [
                {
                    name: "Domingo Character",
                    type: "browser_source",
                    url: `http://localhost:7777/obs/domingo-scene`,
                    width: 1920,
                    height: 1080,
                    fps: 30
                },
                {
                    name: "Unity Monitor Feed",
                    type: "window_capture",
                    window: "Unity Editor",
                    crop: { top: 100, bottom: 100, left: 200, right: 200 }
                },
                {
                    name: "Code Monitor Feed", 
                    type: "window_capture",
                    window: "VS Code",
                    crop: { top: 50, bottom: 50, left: 100, right: 100 }
                },
                {
                    name: "Chat Overlay",
                    type: "text_source",
                    font: "Courier New",
                    color: "#00ff00",
                    background: "rgba(0,0,0,0.8)"
                }
            ],
            filters: [
                {
                    name: "Mirror Loop Detection",
                    type: "custom_filter",
                    enabled: true
                }
            ]
        };
    }
    
    start(port = 7777) {
        this.server.listen(port, () => {
            console.log(`🎥 Domingo OBS Integration running on port ${port}`);
            console.log(`📺 OBS Browser Source: http://localhost:${port}/obs/domingo-scene`);
            console.log(`🔗 WebSocket: ws://localhost:${port}`);
            console.log('');
            console.log('🎬 Virtual Streamer Features:');
            console.log('  • 3D Domingo character at computer desk');
            console.log('  • Purple eye glow based on system activity');
            console.log('  • Real-time typing/mouse animations');
            console.log('  • Unity/code monitor integration');
            console.log('  • Live chat with AI responses');
            console.log('  • Token collection gamification');
            console.log('  • Mirror loop prevention');
            console.log('');
            console.log('🔴 Ready for OBS streaming to Twitch/YouTube!');
            
            // Save OBS config
            const obsConfig = this.generateOBSSceneConfig();
            fs.writeFileSync('domingo-obs-scene.json', JSON.stringify(obsConfig, null, 2));
            console.log('💾 OBS scene config saved: domingo-obs-scene.json');
        });
    }
}

// Auto-start if run directly
if (require.main === module) {
    const domingoOBS = new DomingoOBSIntegration();
    domingoOBS.start(7777);
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down Domingo OBS Integration...');
        process.exit(0);
    });
}

module.exports = { DomingoOBSIntegration };