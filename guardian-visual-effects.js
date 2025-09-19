/**
 * ✨ GUARDIAN VISUAL EFFECTS ENGINE
 * Advanced particle systems, glowing effects, and construction visualizations
 */

// Particle system for visual effects
class Particle {
    constructor(config) {
        this.x = config.x;
        this.y = config.y;
        this.vx = config.vx || 0;
        this.vy = config.vy || 0;
        this.ax = config.ax || 0;
        this.ay = config.ay || 0;
        this.color = config.color || '#FFFFFF';
        this.size = config.size || 3;
        this.lifetime = config.lifetime || 60;
        this.maxLifetime = this.lifetime;
        this.behavior = config.behavior || 'default';
        this.alpha = 1;
        this.rotation = 0;
        this.rotationSpeed = config.rotationSpeed || 0;
        this.trail = [];
        this.glowIntensity = config.glowIntensity || 1;
    }
    
    update() {
        // Apply physics
        this.vx += this.ax;
        this.vy += this.ay;
        this.x += this.vx;
        this.y += this.vy;
        
        // Update rotation
        this.rotation += this.rotationSpeed;
        
        // Special behaviors
        switch (this.behavior) {
            case 'spiral':
                const angle = (this.maxLifetime - this.lifetime) * 0.1;
                this.vx += Math.cos(angle) * 0.2;
                this.vy += Math.sin(angle) * 0.2;
                break;
                
            case 'construct':
                // Construction particles float upward and grow
                this.vy -= 0.1;
                this.size += 0.1;
                this.rotationSpeed = 0.1;
                break;
                
            case 'energy':
                // Energy particles pulse and orbit
                this.glowIntensity = 1 + Math.sin(this.lifetime * 0.2) * 0.5;
                break;
                
            case 'explosion':
                // Explosion particles slow down over time
                this.vx *= 0.95;
                this.vy *= 0.95;
                break;
        }
        
        // Update alpha based on lifetime
        this.alpha = this.lifetime / this.maxLifetime;
        
        // Decrease lifetime
        this.lifetime--;
        
        // Add to trail for certain behaviors
        if (this.behavior === 'energy' || this.behavior === 'spiral') {
            this.trail.push({ x: this.x, y: this.y, alpha: this.alpha * 0.5 });
            if (this.trail.length > 10) {
                this.trail.shift();
            }
        }
    }
    
    render(ctx) {
        ctx.save();
        
        // Draw trail if exists
        if (this.trail.length > 0) {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = this.size * 0.5;
            ctx.beginPath();
            this.trail.forEach((point, i) => {
                ctx.globalAlpha = point.alpha * (i / this.trail.length);
                if (i === 0) {
                    ctx.moveTo(point.x, point.y);
                } else {
                    ctx.lineTo(point.x, point.y);
                }
            });
            ctx.stroke();
        }
        
        // Set particle properties
        ctx.globalAlpha = this.alpha;
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Draw glow effect
        if (this.glowIntensity > 0) {
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size * 3);
            gradient.addColorStop(0, this.color);
            gradient.addColorStop(0.5, this.color + '40');
            gradient.addColorStop(1, this.color + '00');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, this.size * 3 * this.glowIntensity, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw particle core
        ctx.fillStyle = this.color;
        
        switch (this.behavior) {
            case 'construct':
                // Draw as a glowing cube
                ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
                ctx.strokeStyle = '#FFFFFF';
                ctx.lineWidth = 1;
                ctx.strokeRect(-this.size/2, -this.size/2, this.size, this.size);
                break;
                
            case 'energy':
                // Draw as a star
                this.drawStar(ctx, 0, 0, this.size, this.size/2, 4);
                break;
                
            default:
                // Draw as circle
                ctx.beginPath();
                ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                ctx.fill();
        }
        
        ctx.restore();
    }
    
    drawStar(ctx, cx, cy, outerRadius, innerRadius, points) {
        let angle = -Math.PI / 2;
        const step = Math.PI / points;
        
        ctx.beginPath();
        ctx.moveTo(cx, cy - outerRadius);
        
        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            ctx.lineTo(
                cx + Math.cos(angle) * radius,
                cy + Math.sin(angle) * radius
            );
            angle += step;
        }
        
        ctx.closePath();
        ctx.fill();
    }
}

// Construction object for building visualizations
class Construction {
    constructor(config) {
        this.x = config.x;
        this.y = config.y;
        this.builders = config.builders || [];
        this.type = config.type || 'energyCube';
        this.color = config.color || '#00FFFF';
        this.progress = 0;
        this.size = 0;
        this.targetSize = 50;
        this.stability = 100;
        this.isComplete = false;
        this.particles = [];
        this.glowPhase = 0;
        this.layers = [];
    }
    
    update() {
        if (!this.isComplete) {
            // Building progress
            this.progress += 0.5;
            this.size = (this.progress / 100) * this.targetSize;
            
            // Add construction particles
            if (Math.random() < 0.3) {
                this.particles.push(new Particle({
                    x: this.x + (Math.random() - 0.5) * this.size,
                    y: this.y + this.size/2,
                    vy: -1,
                    color: this.color,
                    size: 3,
                    lifetime: 30,
                    behavior: 'construct'
                }));
            }
            
            // Check completion
            if (this.progress >= 100) {
                this.isComplete = true;
                this.createCompletionEffect();
            }
        } else {
            // Pulse when complete
            this.glowPhase += 0.05;
            this.stability -= 0.1;
        }
        
        // Update particles
        this.particles = this.particles.filter(p => {
            p.update();
            return p.lifetime > 0;
        });
        
        // Update layers for complex constructions
        if (this.type === 'energyCube' && !this.isComplete) {
            const layerCount = Math.floor(this.progress / 20);
            while (this.layers.length < layerCount) {
                this.layers.push({
                    size: this.size * 0.8,
                    rotation: Math.random() * Math.PI * 2,
                    rotationSpeed: (Math.random() - 0.5) * 0.02
                });
            }
        }
        
        // Update layer rotations
        this.layers.forEach(layer => {
            layer.rotation += layer.rotationSpeed;
        });
    }
    
    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Render particles
        this.particles.forEach(p => p.render(ctx));
        
        // Render construction based on type
        switch (this.type) {
            case 'energyCube':
                this.renderEnergyCube(ctx);
                break;
            case 'portal':
                this.renderPortal(ctx);
                break;
            case 'beacon':
                this.renderBeacon(ctx);
                break;
            default:
                this.renderGenericConstruction(ctx);
        }
        
        // Render completion glow
        if (this.isComplete) {
            const glowSize = this.size + Math.sin(this.glowPhase) * 10;
            const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize);
            gradient.addColorStop(0, this.color + '40');
            gradient.addColorStop(1, this.color + '00');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    renderEnergyCube(ctx) {
        // Main cube structure
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        
        // Draw layers
        this.layers.forEach((layer, i) => {
            ctx.save();
            ctx.rotate(layer.rotation);
            ctx.globalAlpha = 0.5 + (i / this.layers.length) * 0.5;
            
            const layerSize = layer.size * (1 - i * 0.15);
            ctx.strokeRect(-layerSize/2, -layerSize/2, layerSize, layerSize);
            
            // Energy lines
            ctx.beginPath();
            for (let j = 0; j < 4; j++) {
                const angle = (Math.PI / 2) * j + layer.rotation;
                ctx.moveTo(0, 0);
                ctx.lineTo(
                    Math.cos(angle) * layerSize * 0.7,
                    Math.sin(angle) * layerSize * 0.7
                );
            }
            ctx.stroke();
            
            ctx.restore();
        });
        
        // Central core
        if (this.progress > 50) {
            const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size * 0.3);
            coreGradient.addColorStop(0, '#FFFFFF');
            coreGradient.addColorStop(0.5, this.color);
            coreGradient.addColorStop(1, this.color + '00');
            
            ctx.fillStyle = coreGradient;
            ctx.beginPath();
            ctx.arc(0, 0, this.size * 0.3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Outer frame
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.globalAlpha = 1;
        ctx.strokeRect(-this.size/2, -this.size/2, this.size, this.size);
        
        // Corner connectors
        const cornerSize = this.size * 0.1;
        ctx.fillStyle = this.color;
        [-1, 1].forEach(dx => {
            [-1, 1].forEach(dy => {
                ctx.fillRect(
                    dx * this.size/2 - cornerSize/2,
                    dy * this.size/2 - cornerSize/2,
                    cornerSize,
                    cornerSize
                );
            });
        });
    }
    
    renderPortal(ctx) {
        // Swirling portal effect
        const rings = Math.floor(this.progress / 10);
        
        for (let i = 0; i < rings; i++) {
            ctx.save();
            ctx.rotate(this.glowPhase + i * 0.5);
            ctx.globalAlpha = 0.3 + (i / rings) * 0.7;
            
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, this.size * (0.5 + i * 0.1), 0, Math.PI * 2);
            ctx.stroke();
            
            // Energy wisps
            for (let j = 0; j < 3; j++) {
                const angle = (Math.PI * 2 / 3) * j;
                ctx.beginPath();
                ctx.moveTo(
                    Math.cos(angle) * this.size * 0.3,
                    Math.sin(angle) * this.size * 0.3
                );
                ctx.quadraticCurveTo(
                    Math.cos(angle + 0.5) * this.size * 0.5,
                    Math.sin(angle + 0.5) * this.size * 0.5,
                    Math.cos(angle + 1) * this.size * 0.7,
                    Math.sin(angle + 1) * this.size * 0.7
                );
                ctx.stroke();
            }
            
            ctx.restore();
        }
    }
    
    renderBeacon(ctx) {
        // Beacon light beam
        const beamHeight = this.size * 3;
        const beamWidth = this.size * 0.5;
        
        // Light beam gradient
        const beamGradient = ctx.createLinearGradient(0, 0, 0, -beamHeight);
        beamGradient.addColorStop(0, this.color);
        beamGradient.addColorStop(0.5, this.color + '80');
        beamGradient.addColorStop(1, this.color + '00');
        
        ctx.fillStyle = beamGradient;
        ctx.beginPath();
        ctx.moveTo(-beamWidth/2, 0);
        ctx.lineTo(-beamWidth * 0.2, -beamHeight);
        ctx.lineTo(beamWidth * 0.2, -beamHeight);
        ctx.lineTo(beamWidth/2, 0);
        ctx.closePath();
        ctx.fill();
        
        // Base structure
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size/2, 0, this.size, this.size/3);
        
        // Rotating top
        ctx.save();
        ctx.rotate(this.glowPhase * 2);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 / 6) * i;
            ctx.lineTo(
                Math.cos(angle) * this.size * 0.4,
                Math.sin(angle) * this.size * 0.4 - this.size * 0.2
            );
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }
    
    renderGenericConstruction(ctx) {
        // Simple growing structure
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.8;
        ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
        
        // Progress indicator
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(0, 0, this.size * 0.6, -Math.PI/2, -Math.PI/2 + (this.progress/100) * Math.PI * 2);
        ctx.stroke();
    }
    
    createCompletionEffect() {
        // Explosion of particles on completion
        for (let i = 0; i < 30; i++) {
            const angle = (Math.PI * 2 / 30) * i;
            const speed = 2 + Math.random() * 3;
            
            this.particles.push(new Particle({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: this.color,
                size: 5,
                lifetime: 60,
                behavior: 'explosion',
                glowIntensity: 2
            }));
        }
    }
}

// Visual effect generators
class VisualEffectGenerator {
    static createEnergyBurst(x, y, color, particleCount = 20) {
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 / particleCount) * i + Math.random() * 0.5;
            const speed = 2 + Math.random() * 3;
            
            particles.push(new Particle({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: color,
                size: 3 + Math.random() * 3,
                lifetime: 40 + Math.random() * 20,
                behavior: 'explosion',
                glowIntensity: 1.5
            }));
        }
        
        return particles;
    }
    
    static createSpiralEffect(x, y, color, duration = 100) {
        const particles = [];
        const spiralCount = 3;
        
        for (let spiral = 0; spiral < spiralCount; spiral++) {
            for (let i = 0; i < duration; i += 5) {
                const angle = (spiral * Math.PI * 2 / spiralCount) + (i * 0.1);
                const radius = i * 0.5;
                
                particles.push(new Particle({
                    x: x + Math.cos(angle) * radius,
                    y: y + Math.sin(angle) * radius,
                    vx: 0,
                    vy: -0.5,
                    color: color,
                    size: 4 - (i / duration) * 3,
                    lifetime: duration - i,
                    behavior: 'spiral',
                    glowIntensity: 1
                }));
            }
        }
        
        return particles;
    }
    
    static createDataStream(startX, startY, endX, endY, color) {
        const particles = [];
        const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        const steps = Math.floor(distance / 10);
        
        for (let i = 0; i < steps; i++) {
            const t = i / steps;
            const delay = i * 2;
            
            particles.push(new DataStreamParticle({
                x: startX,
                y: startY,
                targetX: startX + (endX - startX) * t,
                targetY: startY + (endY - startY) * t,
                color: color,
                size: 3,
                lifetime: 30 + delay,
                delay: delay
            }));
        }
        
        return particles;
    }
    
    static createAura(x, y, radius, color, intensity = 1) {
        const particles = [];
        const particleCount = Math.floor(radius * 0.5);
        
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * radius;
            
            particles.push(new Particle({
                x: x + Math.cos(angle) * r,
                y: y + Math.sin(angle) * r,
                vx: (Math.random() - 0.5) * 0.5,
                vy: -Math.random() * 0.5,
                color: color,
                size: 1 + Math.random() * 2,
                lifetime: 60 + Math.random() * 60,
                behavior: 'energy',
                glowIntensity: intensity
            }));
        }
        
        return particles;
    }
    
    static createBuildingBlocks(x, y, color, blockCount = 10) {
        const blocks = [];
        
        for (let i = 0; i < blockCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 20 + Math.random() * 30;
            
            blocks.push(new BuildingBlock({
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                targetX: x + (Math.random() - 0.5) * 40,
                targetY: y + (Math.random() - 0.5) * 40,
                color: color,
                size: 5 + Math.random() * 10
            }));
        }
        
        return blocks;
    }
}

// Special particle types
class DataStreamParticle extends Particle {
    constructor(config) {
        super(config);
        this.targetX = config.targetX;
        this.targetY = config.targetY;
        this.delay = config.delay || 0;
        this.active = false;
    }
    
    update() {
        if (this.delay > 0) {
            this.delay--;
            return;
        }
        
        this.active = true;
        
        // Move towards target
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 2) {
            this.x += (dx / distance) * 5;
            this.y += (dy / distance) * 5;
        } else {
            this.lifetime = 0;
        }
        
        // Update alpha
        this.alpha = this.lifetime / this.maxLifetime;
        this.lifetime--;
    }
    
    render(ctx) {
        if (!this.active) return;
        super.render(ctx);
    }
}

class BuildingBlock {
    constructor(config) {
        this.x = config.x;
        this.y = config.y;
        this.targetX = config.targetX;
        this.targetY = config.targetY;
        this.color = config.color;
        this.size = config.size;
        this.rotation = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 0.1;
        this.settled = false;
        this.glowIntensity = 1;
    }
    
    update() {
        if (!this.settled) {
            // Float towards target position
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 2) {
                this.x += dx * 0.1;
                this.y += dy * 0.1;
                this.rotation += this.rotationSpeed;
            } else {
                this.settled = true;
                this.glowIntensity = 2;
            }
        } else {
            // Gentle floating when settled
            this.y += Math.sin(Date.now() * 0.001) * 0.1;
            this.rotation += this.rotationSpeed * 0.1;
        }
    }
    
    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Glow effect
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size * 2);
        gradient.addColorStop(0, this.color + '60');
        gradient.addColorStop(1, this.color + '00');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(-this.size * 2, -this.size * 2, this.size * 4, this.size * 4);
        
        // Main block
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
        
        // Inner detail
        ctx.fillStyle = '#FFFFFF40';
        ctx.fillRect(-this.size/4, -this.size/4, this.size/2, this.size/2);
        
        // Edge highlights
        ctx.strokeStyle = '#FFFFFF60';
        ctx.lineWidth = 1;
        ctx.strokeRect(-this.size/2, -this.size/2, this.size, this.size);
        
        ctx.restore();
    }
}

// Advanced visual effects
class AdvancedEffects {
    static drawGlowingCube(ctx, x, y, size, color, rotation = 0, glowIntensity = 1) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        
        // Multi-layer glow
        for (let i = 3; i > 0; i--) {
            const glowSize = size * (1 + i * 0.5);
            const alpha = (0.2 / i) * glowIntensity;
            
            ctx.fillStyle = color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
            ctx.fillRect(-glowSize/2, -glowSize/2, glowSize, glowSize);
        }
        
        // Main cube with gradient
        const gradient = ctx.createLinearGradient(-size/2, -size/2, size/2, size/2);
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.5, '#FFFFFF');
        gradient.addColorStop(1, color);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(-size/2, -size/2, size, size);
        
        // 3D effect - top face
        ctx.fillStyle = color + '80';
        ctx.beginPath();
        ctx.moveTo(-size/2, -size/2);
        ctx.lineTo(0, -size * 0.7);
        ctx.lineTo(size/2, -size/2);
        ctx.lineTo(0, -size * 0.3);
        ctx.closePath();
        ctx.fill();
        
        // 3D effect - side face
        ctx.fillStyle = color + '60';
        ctx.beginPath();
        ctx.moveTo(size/2, -size/2);
        ctx.lineTo(size * 0.7, 0);
        ctx.lineTo(size/2, size/2);
        ctx.lineTo(size/2, -size/2);
        ctx.closePath();
        ctx.fill();
        
        // Inner light
        const innerGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size/2);
        innerGradient.addColorStop(0, '#FFFFFF60');
        innerGradient.addColorStop(1, '#FFFFFF00');
        ctx.fillStyle = innerGradient;
        ctx.fillRect(-size/2, -size/2, size, size);
        
        ctx.restore();
    }
    
    static drawEnergyField(ctx, x, y, radius, color, time) {
        ctx.save();
        ctx.translate(x, y);
        
        // Multiple rotating layers
        for (let layer = 0; layer < 3; layer++) {
            ctx.save();
            ctx.rotate(time * (0.01 + layer * 0.005) * (layer % 2 === 0 ? 1 : -1));
            ctx.globalAlpha = 0.3 - layer * 0.1;
            
            // Energy rings
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI * 2 / 6) * i;
                const r = radius * (0.5 + layer * 0.2);
                
                ctx.beginPath();
                ctx.arc(
                    Math.cos(angle) * r * 0.3,
                    Math.sin(angle) * r * 0.3,
                    r * 0.5,
                    0,
                    Math.PI * 2
                );
                ctx.stroke();
            }
            
            ctx.restore();
        }
        
        // Central core
        const coreGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 0.3);
        coreGradient.addColorStop(0, '#FFFFFF');
        coreGradient.addColorStop(0.5, color);
        coreGradient.addColorStop(1, color + '00');
        
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    static drawLightning(ctx, x1, y1, x2, y2, color, branches = 5) {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        
        // Main bolt
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        
        const segments = 10;
        let lastX = x1;
        let lastY = y1;
        
        for (let i = 1; i <= segments; i++) {
            const t = i / segments;
            const x = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 20;
            const y = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 20;
            
            ctx.lineTo(x, y);
            
            // Random branches
            if (Math.random() < 0.3 && branches > 0) {
                ctx.stroke();
                this.drawLightning(
                    ctx,
                    lastX,
                    lastY,
                    lastX + (Math.random() - 0.5) * 50,
                    lastY + Math.random() * 30,
                    color,
                    0
                );
                ctx.beginPath();
                ctx.moveTo(x, y);
            }
            
            lastX = x;
            lastY = y;
        }
        
        ctx.stroke();
        
        // Glow effect
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.5;
        ctx.stroke();
        
        ctx.restore();
    }
}

// Export for use in guardian world
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Particle,
        Construction,
        VisualEffectGenerator,
        DataStreamParticle,
        BuildingBlock,
        AdvancedEffects
    };
}