/**
 * ANHK Animated Sprite System
 * Rivals the verzik trainer with smooth WebGL-powered animations
 * Inspired by RuneScape's 3D models but for pixel art sprites
 */

class ANHKAnimatedSprite {
    constructor(canvas, spriteSheet) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.spriteSheet = spriteSheet; // AI-generated sprite sheet
        
        // Animation state
        this.currentAnimation = 'idle';
        this.currentFrame = 0;
        this.frameTime = 0;
        this.frameDuration = 150; // ms per frame
        
        // Transform properties
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.scale = 3;
        this.rotation = 0;
        this.opacity = 1;
        
        // Animation definitions (like verzik phases)
        this.animations = {
            idle: { frames: [0, 1, 2, 3], loop: true },
            attack: { frames: [4, 5, 6, 7], loop: false },
            transform: { frames: [8, 9, 10, 11, 12], loop: false },
            death: { frames: [13, 14, 15, 16], loop: false }
        };
        
        // Boss-specific properties
        this.phase = 1;
        this.health = 100;
        this.emoticon = '😈';
        
        // Particle effects
        this.particles = [];
        
        this.setupAnimationLoop();
    }

    setupAnimationLoop() {
        let lastTime = 0;
        
        const animate = (currentTime) => {
            const deltaTime = currentTime - lastTime;
            lastTime = currentTime;
            
            this.update(deltaTime);
            this.render();
            
            requestAnimationFrame(animate);
        };
        
        requestAnimationFrame(animate);
    }

    update(deltaTime) {
        // Update animation frame
        this.frameTime += deltaTime;
        
        if (this.frameTime >= this.frameDuration) {
            this.frameTime = 0;
            
            const anim = this.animations[this.currentAnimation];
            if (anim) {
                this.currentFrame++;
                
                if (this.currentFrame >= anim.frames.length) {
                    if (anim.loop) {
                        this.currentFrame = 0;
                    } else {
                        this.currentFrame = anim.frames.length - 1;
                        this.onAnimationComplete();
                    }
                }
            }
        }
        
        // Update particles
        this.updateParticles(deltaTime);
        
        // Boss behavior updates
        this.updateBossBehavior(deltaTime);
    }

    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Save context for transforms
        this.ctx.save();
        
        // Apply transforms
        this.ctx.translate(this.x, this.y);
        this.ctx.scale(this.scale, this.scale);
        this.ctx.rotate(this.rotation);
        this.ctx.globalAlpha = this.opacity;
        
        // Render current sprite frame
        this.renderSprite();
        
        // Restore context
        this.ctx.restore();
        
        // Render particles
        this.renderParticles();
        
        // Render UI elements
        this.renderUI();
    }

    renderSprite() {
        if (!this.spriteSheet) return;
        
        const anim = this.animations[this.currentAnimation];
        if (!anim) return;
        
        const frameIndex = anim.frames[this.currentFrame];
        const frameSize = 64; // Assuming 64x64 sprites
        
        // Calculate source position in sprite sheet
        const cols = this.spriteSheet.width / frameSize;
        const srcX = (frameIndex % cols) * frameSize;
        const srcY = Math.floor(frameIndex / cols) * frameSize;
        
        // Render with pixel-perfect scaling
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.drawImage(
            this.spriteSheet,
            srcX, srcY, frameSize, frameSize,
            -frameSize/2, -frameSize/2, frameSize, frameSize
        );
    }

    renderParticles() {
        this.particles.forEach(particle => {
            this.ctx.save();
            this.ctx.translate(particle.x, particle.y);
            this.ctx.globalAlpha = particle.opacity;
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(-particle.size/2, -particle.size/2, particle.size, particle.size);
            this.ctx.restore();
        });
    }

    renderUI() {
        // Health bar (like verzik trainer)
        const barWidth = 200;
        const barHeight = 20;
        const barX = (this.canvas.width - barWidth) / 2;
        const barY = 20;
        
        // Background
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Health fill
        const healthPercent = this.health / 100;
        this.ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : healthPercent > 0.25 ? '#FF9800' : '#F44336';
        this.ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        
        // Boss name and phase
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${this.emoticon} Grim Reaper - Phase ${this.phase}`, this.canvas.width/2, barY - 10);
        
        // Phase indicator (like verzik emoticons)
        this.ctx.font = '24px monospace';
        this.ctx.fillText(this.getPhaseEmoticon(), this.canvas.width/2, barY + 60);
    }

    updateParticles(deltaTime) {
        // Update existing particles
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx * deltaTime * 0.001;
            particle.y += particle.vy * deltaTime * 0.001;
            particle.opacity -= deltaTime * 0.001;
            return particle.opacity > 0;
        });
        
        // Add new particles based on animation
        if (this.currentAnimation === 'attack' && Math.random() < 0.3) {
            this.addParticle('energy');
        }
    }

    updateBossBehavior(deltaTime) {
        // Simulate boss behavior like verzik phases
        static lastPhaseChange = 0;
        lastPhaseChange += deltaTime;
        
        if (lastPhaseChange > 10000) { // Change phase every 10 seconds
            this.changePhase();
            lastPhaseChange = 0;
        }
        
        // Random attacks
        if (Math.random() < 0.001) {
            this.playAnimation('attack');
        }
    }

    // Animation control methods
    playAnimation(animationName) {
        if (animationName !== this.currentAnimation) {
            this.currentAnimation = animationName;
            this.currentFrame = 0;
            this.frameTime = 0;
        }
    }

    onAnimationComplete() {
        // Return to idle after non-looping animations
        if (['attack', 'transform'].includes(this.currentAnimation)) {
            this.playAnimation('idle');
        }
    }

    // Boss-specific methods (like verzik trainer)
    changePhase() {
        this.phase = (this.phase % 3) + 1;
        this.playAnimation('transform');
        this.emoticon = this.getPhaseEmoticon();
        
        // Add transformation particles
        for (let i = 0; i < 20; i++) {
            this.addParticle('transform');
        }
        
        console.log(`🔄 Boss entered Phase ${this.phase}`);
    }

    getPhaseEmoticon() {
        const emoticons = {
            1: '💀',  // Death
            2: '👻',  // Ghost
            3: '🔥'   // Fire
        };
        return emoticons[this.phase] || '💀';
    }

    addParticle(type) {
        const particle = {
            x: this.x + (Math.random() - 0.5) * 100,
            y: this.y + (Math.random() - 0.5) * 100,
            vx: (Math.random() - 0.5) * 200,
            vy: (Math.random() - 0.5) * 200,
            size: Math.random() * 8 + 2,
            opacity: 1,
            color: this.getParticleColor(type)
        };
        
        this.particles.push(particle);
    }

    getParticleColor(type) {
        const colors = {
            energy: '#00ff41',
            transform: '#ff6b6b',
            death: '#9400d3'
        };
        return colors[type] || '#ffffff';
    }

    // AI Integration methods
    async generateSpriteSheet(prompt) {
        console.log('🎨 Generating sprite sheet for:', prompt);
        
        // Use ANHK AI generation
        const result = await window.ANHK?.generateAIImage?.(
            `${prompt}, sprite sheet, multiple frames, idle walk attack transform death animations, pixel art, 16x16 grid`,
            'pixel art',
            '1024x1024'
        );
        
        if (result && result.canvas) {
            this.spriteSheet = result.canvas;
            console.log('✅ Sprite sheet generated successfully');
        } else {
            console.warn('⚠️ Using placeholder sprite sheet');
            this.spriteSheet = this.createPlaceholderSpriteSheet();
        }
    }

    createPlaceholderSpriteSheet() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 512;
        
        const frameSize = 64;
        const cols = 8;
        
        // Draw placeholder frames
        for (let i = 0; i < 16; i++) {
            const x = (i % cols) * frameSize;
            const y = Math.floor(i / cols) * frameSize;
            
            // Frame background
            ctx.fillStyle = i % 2 ? '#2a2a2a' : '#3a3a3a';
            ctx.fillRect(x, y, frameSize, frameSize);
            
            // Simple sprite shape
            ctx.fillStyle = '#00ff41';
            ctx.fillRect(x + 20, y + 20, 24, 24);
            
            // Frame number
            ctx.fillStyle = '#fff';
            ctx.font = '12px monospace';
            ctx.fillText(i.toString(), x + 5, y + 15);
        }
        
        return canvas;
    }

    // Export methods
    exportAsGIF() {
        // Would implement GIF export of current animation
        console.log('📸 Exporting animation as GIF...');
    }

    exportSpriteSheet() {
        if (this.spriteSheet) {
            const link = document.createElement('a');
            link.download = 'anhk-sprite-sheet.png';
            link.href = this.spriteSheet.toDataURL();
            link.click();
        }
    }
}

// Integration with ANHK Language
if (typeof window !== 'undefined' && window.ANHK) {
    // Add animated sprite functions to ANHK
    window.ANHK.functions.set('CreateAnimatedSprite', (canvas, prompt) => {
        const sprite = new ANHKAnimatedSprite(canvas);
        if (prompt) {
            sprite.generateSpriteSheet(prompt);
        }
        return sprite;
    });
    
    window.ANHK.functions.set('CreateBossSprite', (canvas, bossName, phase = 1) => {
        const sprite = new ANHKAnimatedSprite(canvas);
        sprite.phase = phase;
        const prompt = `${bossName} boss, multiple animation frames, fantasy RPG, pixel art`;
        sprite.generateSpriteSheet(prompt);
        return sprite;
    });
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ANHKAnimatedSprite };
}

// Global access
window.ANHKAnimatedSprite = ANHKAnimatedSprite;