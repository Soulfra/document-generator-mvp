#!/usr/bin/env node

/**
 * 🎮 HollowTown Avatar Processor
 * 
 * Transforms selfies into Hollow Knight / Silksong style game characters
 * Integrates with existing SELFIE-TO-PIXEL-CHARACTER-SYSTEM.js
 * 
 * Features:
 * - Real-time image processing with style filters
 * - Character class-based transformations
 * - 3D voxel model generation for Godot
 * - Achievement-based unlocks
 */

const express = require('express');
const sharp = require('sharp');
const { createCanvas, loadImage } = require('canvas');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class HollowTownAvatarProcessor {
    constructor() {
        this.config = {
            // Style configurations for different avatar types
            styles: {
                'hollow-knight': {
                    name: 'Hollow Knight',
                    colors: {
                        primary: '#1a0033',
                        secondary: '#9b59b6',
                        accent: '#e8d5ff',
                        shadow: '#0a0a0a'
                    },
                    features: {
                        eyeStyle: 'void',
                        bodyShape: 'bug-like',
                        armor: 'chitin',
                        glow: 'soul-energy'
                    }
                },
                'silksong': {
                    name: 'Silksong',
                    colors: {
                        primary: '#8b0000',
                        secondary: '#ff6b6b',
                        accent: '#ffd93d',
                        shadow: '#2c0000'
                    },
                    features: {
                        eyeStyle: 'compound',
                        bodyShape: 'agile',
                        armor: 'silk-weave',
                        glow: 'thread-magic'
                    }
                },
                'cyberpunk': {
                    name: 'Cyberpunk Knight',
                    colors: {
                        primary: '#0f0f23',
                        secondary: '#00ffff',
                        accent: '#ff00ff',
                        shadow: '#000000'
                    },
                    features: {
                        eyeStyle: 'visor',
                        bodyShape: 'augmented',
                        armor: 'neon-tech',
                        glow: 'circuit-pulse'
                    }
                },
                'pixel-art': {
                    name: 'Classic Pixel',
                    colors: {
                        primary: '#2c3e50',
                        secondary: '#3498db',
                        accent: '#ecf0f1',
                        shadow: '#000000'
                    },
                    features: {
                        eyeStyle: 'dots',
                        bodyShape: 'blocky',
                        armor: '8-bit',
                        glow: 'pixel-sparkle'
                    }
                }
            },
            
            // Character classes affect abilities and appearance
            classes: {
                'fullstack': {
                    name: 'Code Weaver',
                    modifiers: {
                        armor: 1.2,
                        magic: 1.5,
                        agility: 1.0,
                        wisdom: 1.3
                    },
                    abilities: ['debug-vision', 'async-dash', 'promise-shield']
                },
                'frontend': {
                    name: 'Style Mage',
                    modifiers: {
                        armor: 0.8,
                        magic: 2.0,
                        agility: 1.5,
                        wisdom: 1.0
                    },
                    abilities: ['css-transform', 'react-teleport', 'animation-burst']
                },
                'backend': {
                    name: 'Data Knight',
                    modifiers: {
                        armor: 2.0,
                        magic: 0.8,
                        agility: 0.7,
                        wisdom: 1.5
                    },
                    abilities: ['sql-fortress', 'cache-slam', 'load-balance']
                },
                'devops': {
                    name: 'System Ranger',
                    modifiers: {
                        armor: 1.5,
                        magic: 1.0,
                        agility: 1.8,
                        wisdom: 1.2
                    },
                    abilities: ['container-swarm', 'pipeline-rush', 'monitor-pulse']
                }
            },
            
            // Processing settings
            processing: {
                targetSize: 256,
                pixelSize: 4,
                colorPalette: 16,
                edgeThreshold: 0.3,
                glowIntensity: 0.6
            }
        };
        
        // Cache for processed avatars
        this.avatarCache = new Map();
    }
    
    /**
     * Process a selfie into a game character avatar
     */
    async processAvatar(imageData, style, className) {
        const startTime = Date.now();
        const avatarId = this.generateAvatarId(imageData);
        
        // Check cache first
        if (this.avatarCache.has(avatarId)) {
            return this.avatarCache.get(avatarId);
        }
        
        try {
            // Decode base64 image
            const imageBuffer = Buffer.from(imageData.split(',')[1], 'base64');
            
            // Load and preprocess image
            let processed = await sharp(imageBuffer)
                .resize(this.config.processing.targetSize, this.config.processing.targetSize, {
                    fit: 'cover',
                    position: 'centre'
                })
                .toBuffer();
            
            // Apply style-specific transformations
            processed = await this.applyStyleTransformation(processed, style);
            
            // Generate character features
            const features = await this.extractCharacterFeatures(processed);
            
            // Create game character sprite
            const characterSprite = await this.generateCharacterSprite(features, style, className);
            
            // Generate 3D voxel data for Godot
            const voxelData = await this.generateVoxelData(characterSprite, style);
            
            // Create avatar metadata
            const avatarData = {
                id: avatarId,
                style: style,
                class: className,
                features: features,
                sprite: characterSprite,
                voxelData: voxelData,
                stats: this.calculateCharacterStats(features, className),
                abilities: this.config.classes[className]?.abilities || [],
                createdAt: new Date().toISOString(),
                processingTime: Date.now() - startTime
            };
            
            // Cache the result
            this.avatarCache.set(avatarId, avatarData);
            
            // Clean old cache entries
            if (this.avatarCache.size > 100) {
                const firstKey = this.avatarCache.keys().next().value;
                this.avatarCache.delete(firstKey);
            }
            
            return avatarData;
            
        } catch (error) {
            console.error('Avatar processing error:', error);
            throw new Error('Failed to process avatar: ' + error.message);
        }
    }
    
    /**
     * Apply style-specific image transformations
     */
    async applyStyleTransformation(imageBuffer, style) {
        const styleConfig = this.config.styles[style];
        if (!styleConfig) {
            throw new Error('Invalid style: ' + style);
        }
        
        // Create sharp instance
        let image = sharp(imageBuffer);
        
        // Apply style-specific filters
        switch (style) {
            case 'hollow-knight':
                // Dark, mysterious, void-touched
                image = image
                    .modulate({
                        brightness: 0.7,
                        saturation: 0.5,
                        hue: 280
                    })
                    .gamma(1.2)
                    .normalise();
                break;
                
            case 'silksong':
                // Warm, vibrant, silk-like
                image = image
                    .modulate({
                        brightness: 1.1,
                        saturation: 1.3,
                        hue: 20
                    })
                    .sharpen()
                    .normalise();
                break;
                
            case 'cyberpunk':
                // Neon, high contrast, digital
                image = image
                    .modulate({
                        brightness: 0.9,
                        saturation: 1.5,
                        lightness: 10
                    })
                    .sharpen({ sigma: 2 })
                    .normalise();
                break;
                
            case 'pixel-art':
                // Simplified, reduced colors
                image = image
                    .modulate({
                        brightness: 1.0,
                        saturation: 0.8
                    })
                    .median(3); // Reduce noise
                break;
        }
        
        // Convert to pixelated style
        const metadata = await image.metadata();
        const pixelSize = this.config.processing.pixelSize;
        const smallSize = Math.floor(metadata.width / pixelSize);
        
        return await image
            .resize(smallSize, smallSize, {
                kernel: sharp.kernel.nearest
            })
            .resize(metadata.width, metadata.height, {
                kernel: sharp.kernel.nearest
            })
            .toBuffer();
    }
    
    /**
     * Extract character features from processed image
     */
    async extractCharacterFeatures(imageBuffer) {
        const image = await loadImage(imageBuffer);
        const canvas = createCanvas(image.width, image.height);
        const ctx = canvas.getContext('2d');
        
        ctx.drawImage(image, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Analyze image for key features
        const features = {
            facePosition: this.detectFaceRegion(imageData),
            dominantColors: this.extractDominantColors(imageData),
            edgeMap: this.detectEdges(imageData),
            luminanceProfile: this.analyzeLuminance(imageData),
            symmetryScore: this.calculateSymmetry(imageData)
        };
        
        return features;
    }
    
    /**
     * Generate the final character sprite
     */
    async generateCharacterSprite(features, style, className) {
        const canvas = createCanvas(256, 256);
        const ctx = canvas.getContext('2d');
        
        const styleConfig = this.config.styles[style];
        const classConfig = this.config.classes[className];
        
        // Clear canvas with transparent background
        ctx.clearRect(0, 0, 256, 256);
        
        // Draw character silhouette
        this.drawCharacterSilhouette(ctx, features, styleConfig);
        
        // Add style-specific details
        this.addStyleDetails(ctx, features, styleConfig);
        
        // Add class-specific elements
        this.addClassElements(ctx, classConfig, styleConfig);
        
        // Apply glow effect
        this.applyGlowEffect(ctx, styleConfig);
        
        // Convert to base64
        return canvas.toDataURL('image/png');
    }
    
    /**
     * Generate 3D voxel data for Godot integration
     */
    async generateVoxelData(sprite, style) {
        // Simplified voxel generation
        // In production, this would create actual 3D voxel data
        return {
            dimensions: { x: 16, y: 32, z: 16 },
            voxels: [], // Would contain actual voxel positions and colors
            palette: this.config.styles[style].colors,
            animations: {
                idle: { frames: 4, speed: 0.5 },
                walk: { frames: 8, speed: 1.0 },
                attack: { frames: 6, speed: 1.5 },
                special: { frames: 10, speed: 1.2 }
            }
        };
    }
    
    /**
     * Calculate character stats based on features and class
     */
    calculateCharacterStats(features, className) {
        const baseStats = {
            health: 100,
            mana: 100,
            attack: 10,
            defense: 10,
            speed: 10,
            wisdom: 10
        };
        
        const classModifiers = this.config.classes[className]?.modifiers || {};
        
        // Apply class modifiers
        return {
            health: Math.round(baseStats.health * (classModifiers.armor || 1)),
            mana: Math.round(baseStats.mana * (classModifiers.magic || 1)),
            attack: Math.round(baseStats.attack * (classModifiers.agility || 1)),
            defense: Math.round(baseStats.defense * (classModifiers.armor || 1)),
            speed: Math.round(baseStats.speed * (classModifiers.agility || 1)),
            wisdom: Math.round(baseStats.wisdom * (classModifiers.wisdom || 1))
        };
    }
    
    // Helper methods for feature detection
    detectFaceRegion(imageData) {
        // Simplified face detection - finds the brightest region in upper half
        const width = imageData.width;
        const height = imageData.height;
        const halfHeight = Math.floor(height / 2);
        
        let maxBrightness = 0;
        let centerX = width / 2;
        let centerY = height / 4;
        
        // This would use proper face detection in production
        return { x: centerX, y: centerY, radius: width / 4 };
    }
    
    extractDominantColors(imageData) {
        // Simplified color extraction
        const colors = new Map();
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = Math.floor(data[i] / 32) * 32;
            const g = Math.floor(data[i + 1] / 32) * 32;
            const b = Math.floor(data[i + 2] / 32) * 32;
            const key = `${r},${g},${b}`;
            
            colors.set(key, (colors.get(key) || 0) + 1);
        }
        
        // Get top 5 colors
        return Array.from(colors.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([color]) => color.split(',').map(Number));
    }
    
    detectEdges(imageData) {
        // Simplified edge detection
        return {
            strength: 0.5,
            map: [] // Would contain actual edge data
        };
    }
    
    analyzeLuminance(imageData) {
        const data = imageData.data;
        let totalLuminance = 0;
        
        for (let i = 0; i < data.length; i += 4) {
            const luminance = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            totalLuminance += luminance;
        }
        
        return totalLuminance / (data.length / 4) / 255;
    }
    
    calculateSymmetry(imageData) {
        // Simplified symmetry calculation
        return 0.8; // Would do actual symmetry analysis
    }
    
    // Drawing helper methods
    drawCharacterSilhouette(ctx, features, styleConfig) {
        const centerX = 128;
        const centerY = 128;
        
        ctx.fillStyle = styleConfig.colors.primary;
        ctx.beginPath();
        
        // Draw bug-like body shape
        ctx.ellipse(centerX, centerY + 20, 40, 60, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw head
        ctx.beginPath();
        ctx.arc(centerX, centerY - 30, 35, 0, Math.PI * 2);
        ctx.fill();
    }
    
    addStyleDetails(ctx, features, styleConfig) {
        const centerX = 128;
        const centerY = 128;
        
        // Add eyes based on style
        ctx.fillStyle = styleConfig.colors.accent;
        switch (styleConfig.features.eyeStyle) {
            case 'void':
                // Hollow Knight style void eyes
                ctx.beginPath();
                ctx.arc(centerX - 15, centerY - 30, 8, 0, Math.PI * 2);
                ctx.arc(centerX + 15, centerY - 30, 8, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'compound':
                // Silksong style compound eyes
                for (let i = 0; i < 6; i++) {
                    const angle = (i / 6) * Math.PI;
                    const x = centerX - 15 + Math.cos(angle) * 5;
                    const y = centerY - 30 + Math.sin(angle) * 5;
                    ctx.beginPath();
                    ctx.arc(x, y, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
        }
    }
    
    addClassElements(ctx, classConfig, styleConfig) {
        // Add class-specific decorations
        ctx.strokeStyle = styleConfig.colors.secondary;
        ctx.lineWidth = 2;
        
        // Draw class symbol
        ctx.save();
        ctx.translate(128, 180);
        ctx.font = '20px monospace';
        ctx.fillStyle = styleConfig.colors.accent;
        ctx.textAlign = 'center';
        
        const symbols = {
            'Code Weaver': '{ }',
            'Style Mage': '✨',
            'Data Knight': '🛡️',
            'System Ranger': '⚡'
        };
        
        ctx.fillText(symbols[classConfig.name] || '?', 0, 0);
        ctx.restore();
    }
    
    applyGlowEffect(ctx, styleConfig) {
        // Add glow effect around character
        ctx.shadowColor = styleConfig.colors.accent;
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Redraw silhouette with glow
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = styleConfig.colors.accent;
        ctx.beginPath();
        ctx.arc(128, 128, 80, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
    
    generateAvatarId(imageData) {
        return crypto
            .createHash('sha256')
            .update(imageData)
            .digest('hex')
            .substring(0, 16);
    }
}

// Export for use in backend
module.exports = HollowTownAvatarProcessor;

// If run directly, start as service
if (require.main === module) {
    const processor = new HollowTownAvatarProcessor();
    console.log('🎮 HollowTown Avatar Processor initialized');
    console.log('📸 Ready to transform selfies into game characters!');
}