#!/usr/bin/env node

/**
 * SIMPLE SPRITE SERVER - Actually Works!
 * 
 * This server ACTUALLY generates images and saves them to disk.
 * No more fake paths or metadata-only responses.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const https = require('https');
require('dotenv').config();

class SimpleSpriteServer {
    constructor() {
        this.app = express();
        this.port = process.env.SPRITE_PORT || 3006;
        
        console.log('🎨 Simple Sprite Server starting...');
        console.log(`🔑 API Keys: OpenAI=${!!process.env.OPENAI_API_KEY}, Anthropic=${!!process.env.ANTHROPIC_API_KEY}`);
        
        this.setupServer();
    }
    
    setupServer() {
        // Middleware
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.static('.'));
        
        // Serve generated sprites
        this.app.use('/generated_sprites', express.static('generated_sprites'));
        
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                server: 'simple-sprite-server',
                timestamp: new Date().toISOString()
            });
        });
        
        // REAL sprite generation endpoint
        this.app.post('/api/generate-sprite', async (req, res) => {
            try {
                console.log('🎯 Sprite generation request:', req.body);
                const result = await this.generateRealSprite(req.body);
                res.json(result);
            } catch (error) {
                console.error('❌ Generation failed:', error);
                res.status(500).json({ 
                    success: false, 
                    error: error.message,
                    fallback: this.getFallbackSprite(req.body)
                });
            }
        });
        
        // Test endpoint
        this.app.get('/test', async (req, res) => {
            try {
                const result = await this.generateRealSprite({
                    prompt: 'pixel art grim reaper husky mascot'
                });
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }
    
    async generateRealSprite(request) {
        const prompt = request.prompt || request.userInput || 'pixel art sprite character';
        console.log(`🎨 Generating sprite for: "${prompt}"`);
        
        // Try OpenAI DALL-E first
        if (process.env.OPENAI_API_KEY) {
            try {
                const dalleResult = await this.generateWithDALLE(prompt);
                if (dalleResult.success) {
                    return dalleResult;
                }
            } catch (error) {
                console.error('DALL-E failed:', error.message);
            }
        }
        
        // Fallback to deterministic sprite generation
        console.log('📐 Using deterministic sprite generation...');
        return await this.generateDeterministicSprite(prompt);
    }
    
    async generateWithDALLE(prompt) {
        console.log('🤖 Calling OpenAI DALL-E 3...');
        
        const enhancedPrompt = `${prompt}, pixel art style, 16-bit gaming aesthetic, clear sprite design, vibrant colors, transparent background`;
        
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'api.openai.com',
                path: '/v1/images/generations',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
                }
            };
            
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', async () => {
                    try {
                        const result = JSON.parse(data);
                        
                        if (result.data && result.data[0]) {
                            const imageUrl = result.data[0].url;
                            console.log('✅ DALL-E generated image:', imageUrl);
                            
                            // Download and save the image
                            const savedPath = await this.downloadAndSaveImage(imageUrl, prompt);
                            
                            resolve({
                                success: true,
                                service: 'dall-e-3',
                                imageUrl: imageUrl,
                                localPath: savedPath,
                                webPath: `/generated_sprites/${path.basename(savedPath)}`,
                                prompt: enhancedPrompt,
                                cost: 0.04 // DALL-E 3 standard pricing
                            });
                        } else {
                            reject(new Error('No image data in response'));
                        }
                    } catch (error) {
                        reject(error);
                    }
                });
            });
            
            req.on('error', reject);
            req.write(JSON.stringify({
                model: "dall-e-3",
                prompt: enhancedPrompt,
                n: 1,
                size: "1024x1024",
                quality: "standard"
            }));
            req.end();
        });
    }
    
    async downloadAndSaveImage(imageUrl, prompt) {
        console.log('📥 Downloading image...');
        
        return new Promise((resolve, reject) => {
            https.get(imageUrl, async (response) => {
                if (response.statusCode !== 200) {
                    reject(new Error(`Download failed: ${response.statusCode}`));
                    return;
                }
                
                const chunks = [];
                response.on('data', chunk => chunks.push(chunk));
                response.on('end', async () => {
                    try {
                        const buffer = Buffer.concat(chunks);
                        
                        // Generate filename
                        const timestamp = Date.now();
                        const safePrompt = prompt.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
                        const filename = `sprite_${timestamp}_${safePrompt}.png`;
                        const filepath = path.join('generated_sprites', filename);
                        
                        // Save to disk
                        await fs.writeFile(filepath, buffer);
                        console.log(`💾 Saved sprite to: ${filepath}`);
                        
                        resolve(filepath);
                    } catch (error) {
                        reject(error);
                    }
                });
                response.on('error', reject);
            });
        });
    }
    
    async generateDeterministicSprite(prompt) {
        // Create a simple SVG sprite based on the prompt
        const hash = this.hashString(prompt);
        const colors = this.getColorsFromHash(hash);
        
        const svg = `
        <svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
            <rect width="128" height="128" fill="${colors.background}"/>
            <circle cx="64" cy="40" r="25" fill="${colors.primary}"/>
            <rect x="50" y="60" width="28" height="40" fill="${colors.primary}"/>
            <rect x="40" y="65" width="10" height="25" fill="${colors.secondary}"/>
            <rect x="78" y="65" width="10" height="25" fill="${colors.secondary}"/>
            <text x="64" y="120" text-anchor="middle" fill="${colors.text}" font-size="10">
                ${prompt.substring(0, 15)}
            </text>
        </svg>`;
        
        // Save SVG as file
        const timestamp = Date.now();
        const filename = `deterministic_${timestamp}.svg`;
        const filepath = path.join('generated_sprites', filename);
        
        await fs.writeFile(filepath, svg);
        
        return {
            success: true,
            service: 'deterministic',
            localPath: filepath,
            webPath: `/generated_sprites/${filename}`,
            prompt: prompt,
            cost: 0,
            colors: colors,
            type: 'svg'
        };
    }
    
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }
    
    getColorsFromHash(hash) {
        const hue1 = hash % 360;
        const hue2 = (hash * 137) % 360;
        
        return {
            primary: `hsl(${hue1}, 70%, 50%)`,
            secondary: `hsl(${hue2}, 60%, 40%)`,
            background: `hsl(${(hash * 73) % 360}, 20%, 90%)`,
            text: '#333'
        };
    }
    
    getFallbackSprite(request) {
        return {
            success: false,
            service: 'fallback',
            webPath: '/placeholder-sprite.png',
            prompt: request.prompt || request.userInput,
            message: 'Using fallback sprite'
        };
    }
    
    start() {
        this.app.listen(this.port, () => {
            console.log(`🚀 Simple Sprite Server running on http://localhost:${this.port}`);
            console.log(`🧪 Test endpoint: http://localhost:${this.port}/test`);
            console.log(`💚 Health check: http://localhost:${this.port}/health`);
            console.log('✅ REAL sprite generation active!');
        });
    }
}

// Start the server
const server = new SimpleSpriteServer();
server.start();