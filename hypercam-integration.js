#!/usr/bin/env node

/**
 * HyperCam Integration Module
 * Provides recording, watermarking, and effects for the multiplayer arena
 */

class HyperCamIntegration {
    constructor() {
        this.isRecording = false;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.stream = null;
        this.canvas = null;
        this.recordingStartTime = null;
        
        // Recording settings
        this.settings = {
            quality: 'medium',
            watermark: true,
            effects: true,
            audioEnabled: true,
            frameRate: 30,
            bitrate: 5000000 // 5 Mbps
        };
        
        // Watermark styles
        this.watermarkStyles = {
            classic: {
                text: 'HYPERCAM 2 - UNREGISTERED',
                font: 'bold 16px Arial',
                color: '#00ff00',
                position: { x: 10, y: 30 },
                background: 'rgba(0, 0, 0, 0.7)'
            },
            modern: {
                text: 'HYPERCAM ARENA - RECORDING',
                font: 'bold 14px Courier New',
                color: '#ff0000',
                position: { x: 10, y: 25 },
                background: 'rgba(0, 0, 0, 0.8)',
                pulse: true
            },
            stealth: {
                text: '•REC',
                font: '12px monospace',
                color: '#ff4444',
                position: { x: 10, y: 20 },
                background: 'transparent',
                blink: true
            }
        };
        
        this.currentWatermarkStyle = 'modern';
        
        // Recording metadata
        this.metadata = {
            gameEvents: [],
            playerStats: {},
            highlights: [],
            chatMessages: []
        };
        
        // Effects and overlays
        this.overlays = {
            scanlines: false,
            vhs: false,
            glitch: false,
            timestamp: true,
            stats: true
        };
        
        console.log('🎥 HyperCam Integration initialized');
    }
    
    // Initialize recording on a canvas
    async initializeRecording(canvas) {
        this.canvas = canvas;
        
        // Check for recording capabilities
        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
            throw new Error('Screen recording not supported in this browser');
        }
        
        return true;
    }
    
    // Start recording
    async startRecording(options = {}) {
        try {
            console.log('🎬 Starting HyperCam recording...');
            
            // Merge options with settings
            Object.assign(this.settings, options);
            
            // Get screen capture stream
            const constraints = {
                video: {
                    frameRate: this.settings.frameRate,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: this.settings.audioEnabled
            };
            
            this.stream = await navigator.mediaDevices.getDisplayMedia(constraints);
            
            // If canvas recording, create composite stream
            if (this.canvas) {
                this.stream = await this.createCompositeStream();
            }
            
            // Setup MediaRecorder
            const recorderOptions = {
                mimeType: 'video/webm;codecs=vp8,opus',
                videoBitsPerSecond: this.settings.bitrate
            };
            
            this.mediaRecorder = new MediaRecorder(this.stream, recorderOptions);
            
            // Setup event handlers
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = () => {
                this.processRecording();
            };
            
            this.mediaRecorder.onerror = (event) => {
                console.error('Recording error:', event.error);
                this.stopRecording();
            };
            
            // Start recording
            this.mediaRecorder.start(100); // Capture every 100ms
            this.isRecording = true;
            this.recordingStartTime = Date.now();
            
            // Apply visual effects
            if (this.settings.effects) {
                this.startVisualEffects();
            }
            
            // Start metadata collection
            this.startMetadataCollection();
            
            console.log('✅ Recording started successfully');
            
            return true;
            
        } catch (error) {
            console.error('❌ Failed to start recording:', error);
            throw error;
        }
    }
    
    // Create composite stream with overlays
    async createCompositeStream() {
        // Create offscreen canvas for compositing
        const compositeCanvas = document.createElement('canvas');
        compositeCanvas.width = this.canvas.width;
        compositeCanvas.height = this.canvas.height;
        const ctx = compositeCanvas.getContext('2d');
        
        // Capture composite canvas stream
        const canvasStream = compositeCanvas.captureStream(this.settings.frameRate);
        
        // Animation loop for composite
        const renderComposite = () => {
            if (!this.isRecording) return;
            
            // Draw game canvas
            ctx.drawImage(this.canvas, 0, 0);
            
            // Apply overlays
            this.applyOverlays(ctx);
            
            requestAnimationFrame(renderComposite);
        };
        
        renderComposite();
        
        // Combine with audio if available
        if (this.stream.getAudioTracks().length > 0) {
            canvasStream.addTrack(this.stream.getAudioTracks()[0]);
        }
        
        return canvasStream;
    }
    
    // Apply visual overlays
    applyOverlays(ctx) {
        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        
        // Watermark
        if (this.settings.watermark) {
            this.drawWatermark(ctx);
        }
        
        // Timestamp
        if (this.overlays.timestamp) {
            this.drawTimestamp(ctx);
        }
        
        // Stats overlay
        if (this.overlays.stats && this.metadata.playerStats) {
            this.drawStats(ctx);
        }
        
        // Visual effects
        if (this.overlays.scanlines) {
            this.drawScanlines(ctx, width, height);
        }
        
        if (this.overlays.vhs) {
            this.drawVHSEffect(ctx, width, height);
        }
        
        if (this.overlays.glitch && Math.random() < 0.01) {
            this.drawGlitchEffect(ctx, width, height);
        }
    }
    
    // Draw watermark
    drawWatermark(ctx) {
        const style = this.watermarkStyles[this.currentWatermarkStyle];
        
        ctx.save();
        
        // Background
        if (style.background !== 'transparent') {
            ctx.fillStyle = style.background;
            const metrics = ctx.measureText(style.text);
            ctx.fillRect(
                style.position.x - 5,
                style.position.y - 20,
                metrics.width + 10,
                25
            );
        }
        
        // Text
        ctx.font = style.font;
        ctx.fillStyle = style.color;
        
        // Effects
        if (style.pulse) {
            ctx.globalAlpha = 0.7 + Math.sin(Date.now() / 500) * 0.3;
        }
        
        if (style.blink && Math.floor(Date.now() / 1000) % 2 === 0) {
            ctx.globalAlpha = 0;
        }
        
        ctx.fillText(style.text, style.position.x, style.position.y);
        
        ctx.restore();
    }
    
    // Draw timestamp
    drawTimestamp(ctx) {
        const elapsed = Date.now() - this.recordingStartTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        const timestamp = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        ctx.save();
        ctx.font = 'bold 18px monospace';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(ctx.canvas.width - 80, 10, 70, 30);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(timestamp, ctx.canvas.width - 75, 30);
        ctx.restore();
    }
    
    // Draw stats overlay
    drawStats(ctx) {
        const stats = this.metadata.playerStats;
        
        ctx.save();
        ctx.font = '12px monospace';
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, ctx.canvas.height - 100, 150, 90);
        
        ctx.fillStyle = '#00ff00';
        let y = ctx.canvas.height - 80;
        
        if (stats.kills !== undefined) {
            ctx.fillText(`Kills: ${stats.kills}`, 15, y);
            y += 15;
        }
        
        if (stats.deaths !== undefined) {
            ctx.fillText(`Deaths: ${stats.deaths}`, 15, y);
            y += 15;
        }
        
        if (stats.score !== undefined) {
            ctx.fillText(`Score: ${stats.score}`, 15, y);
            y += 15;
        }
        
        if (stats.combo !== undefined && stats.combo > 0) {
            ctx.fillStyle = '#ffff00';
            ctx.fillText(`COMBO x${stats.combo}!`, 15, y);
        }
        
        ctx.restore();
    }
    
    // Draw scanlines effect
    drawScanlines(ctx, width, height) {
        ctx.save();
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = '#000000';
        
        for (let y = 0; y < height; y += 4) {
            ctx.fillRect(0, y, width, 2);
        }
        
        ctx.restore();
    }
    
    // Draw VHS effect
    drawVHSEffect(ctx, width, height) {
        ctx.save();
        
        // Color distortion
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = `rgba(${255 * Math.random()}, 0, ${255 * Math.random()}, 0.02)`;
        ctx.fillRect(0, 0, width, height);
        
        // Tracking lines
        const offset = Math.sin(Date.now() / 100) * 5;
        ctx.globalAlpha = 0.05;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, height / 2 + offset, width, 2);
        
        ctx.restore();
    }
    
    // Draw glitch effect
    drawGlitchEffect(ctx, width, height) {
        ctx.save();
        
        // Random horizontal displacement
        const sliceHeight = 10;
        const displacement = Math.random() * 20 - 10;
        const y = Math.floor(Math.random() * height / sliceHeight) * sliceHeight;
        
        const imageData = ctx.getImageData(0, y, width, sliceHeight);
        ctx.putImageData(imageData, displacement, y);
        
        // Color channel shift
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = `rgba(${Math.random() * 255}, 0, ${Math.random() * 255}, 0.1)`;
        ctx.fillRect(0, y, width, sliceHeight);
        
        ctx.restore();
    }
    
    // Start visual effects
    startVisualEffects() {
        // Randomly enable effects for variety
        this.overlays.scanlines = Math.random() > 0.5;
        this.overlays.vhs = Math.random() > 0.7;
        this.overlays.glitch = Math.random() > 0.8;
    }
    
    // Start metadata collection
    startMetadataCollection() {
        this.metadata = {
            gameEvents: [],
            playerStats: {},
            highlights: [],
            chatMessages: [],
            startTime: Date.now()
        };
    }
    
    // Stop recording
    stopRecording() {
        if (!this.isRecording) return;
        
        console.log('⏹️ Stopping recording...');
        
        this.isRecording = false;
        
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
        
        // Save metadata
        this.metadata.endTime = Date.now();
        this.metadata.duration = this.metadata.endTime - this.metadata.startTime;
    }
    
    // Process recorded video
    async processRecording() {
        console.log('🎞️ Processing recording...');
        
        // Create video blob
        const videoBlob = new Blob(this.recordedChunks, { type: 'video/webm' });
        const videoURL = URL.createObjectURL(videoBlob);
        
        // Generate thumbnail
        const thumbnail = await this.generateThumbnail(videoBlob);
        
        // Create recording package
        const recordingPackage = {
            video: videoURL,
            thumbnail,
            metadata: this.metadata,
            duration: this.metadata.duration,
            size: videoBlob.size,
            timestamp: new Date().toISOString()
        };
        
        console.log('✅ Recording processed successfully');
        
        return recordingPackage;
    }
    
    // Generate video thumbnail
    async generateThumbnail(videoBlob) {
        return new Promise((resolve) => {
            const video = document.createElement('video');
            video.src = URL.createObjectURL(videoBlob);
            
            video.onloadedmetadata = () => {
                video.currentTime = video.duration / 2; // Middle frame
            };
            
            video.onseeked = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 320;
                canvas.height = 180;
                const ctx = canvas.getContext('2d');
                
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                // Add thumbnail overlay
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.fillRect(0, 0, canvas.width, 30);
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 14px Arial';
                ctx.fillText('HYPERCAM RECORDING', 10, 20);
                
                canvas.toBlob((blob) => {
                    resolve(URL.createObjectURL(blob));
                }, 'image/jpeg', 0.8);
            };
        });
    }
    
    // Add game event to metadata
    addGameEvent(event) {
        if (this.isRecording) {
            this.metadata.gameEvents.push({
                ...event,
                timestamp: Date.now() - this.recordingStartTime
            });
            
            // Check for highlights
            this.checkForHighlight(event);
        }
    }
    
    // Update player stats
    updatePlayerStats(stats) {
        if (this.isRecording) {
            this.metadata.playerStats = { ...stats };
        }
    }
    
    // Add chat message
    addChatMessage(message) {
        if (this.isRecording) {
            this.metadata.chatMessages.push({
                ...message,
                timestamp: Date.now() - this.recordingStartTime
            });
        }
    }
    
    // Check for highlight moments
    checkForHighlight(event) {
        const highlightTypes = {
            multikill: (e) => e.type === 'kill' && e.combo >= 3,
            firstblood: (e) => e.type === 'kill' && e.isFirstKill,
            comeback: (e) => e.type === 'kill' && e.wasLosing,
            clutch: (e) => e.type === 'kill' && e.healthRemaining < 20,
            longshot: (e) => e.type === 'kill' && e.distance > 500
        };
        
        Object.entries(highlightTypes).forEach(([type, check]) => {
            if (check(event)) {
                this.metadata.highlights.push({
                    type,
                    event,
                    timestamp: Date.now() - this.recordingStartTime
                });
            }
        });
    }
    
    // Generate highlight reel
    async generateHighlightReel(recordingPackage) {
        console.log('🌟 Generating highlight reel...');
        
        const highlights = recordingPackage.metadata.highlights
            .sort((a, b) => b.event.score || 0 - a.event.score || 0)
            .slice(0, 5); // Top 5 moments
        
        return {
            highlights,
            duration: highlights.reduce((sum, h) => sum + 3000, 0), // 3 seconds per highlight
            thumbnail: recordingPackage.thumbnail
        };
    }
    
    // Export recording with metadata
    async exportRecording(recordingPackage, filename = 'hypercam-recording') {
        // Download video
        const videoLink = document.createElement('a');
        videoLink.href = recordingPackage.video;
        videoLink.download = `${filename}.webm`;
        videoLink.click();
        
        // Download metadata
        const metadataBlob = new Blob([JSON.stringify(recordingPackage.metadata, null, 2)], {
            type: 'application/json'
        });
        const metadataLink = document.createElement('a');
        metadataLink.href = URL.createObjectURL(metadataBlob);
        metadataLink.download = `${filename}-metadata.json`;
        metadataLink.click();
        
        console.log('✅ Recording exported successfully');
    }
    
    // Get recording status
    getStatus() {
        return {
            isRecording: this.isRecording,
            duration: this.isRecording ? Date.now() - this.recordingStartTime : 0,
            settings: this.settings,
            overlays: this.overlays,
            chunksRecorded: this.recordedChunks.length
        };
    }
    
    // Change watermark style
    setWatermarkStyle(style) {
        if (this.watermarkStyles[style]) {
            this.currentWatermarkStyle = style;
        }
    }
    
    // Toggle overlay
    toggleOverlay(overlayName, enabled) {
        if (this.overlays.hasOwnProperty(overlayName)) {
            this.overlays[overlayName] = enabled;
        }
    }
}

// Export for use in browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HyperCamIntegration;
} else if (typeof window !== 'undefined') {
    window.HyperCamIntegration = HyperCamIntegration;
}