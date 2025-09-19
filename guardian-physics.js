/**
 * 🌊 GUARDIAN PHYSICS ENGINE
 * Handles movement, collision, and physical behaviors for autonomous guardians
 */

class Guardian {
    constructor(config) {
        // Identity
        this.id = config.id;
        this.name = config.name;
        this.type = config.type;
        this.icon = config.icon;
        this.color = config.color;
        
        // Position and movement
        this.x = 0;
        this.y = 0;
        this.z = 0; // Depth for 3D effect
        this.vx = 0;
        this.vy = 0;
        this.vz = 0;
        this.ax = 0;
        this.ay = 0;
        this.az = 0;
        
        // Physical properties
        this.size = 30 + Math.random() * 20;
        this.mass = this.size / 10;
        this.energy = 100;
        this.temperature = 50;
        
        // Personality traits (0-1 scale)
        this.personality = config.personality || {
            curiosity: Math.random(),
            sociability: Math.random(),
            aggression: Math.random() * 0.3,
            creativity: Math.random(),
            leadership: Math.random(),
            independence: Math.random()
        };
        
        // AI State
        this.state = 'idle';
        this.currentMood = 'neutral';
        this.currentThought = 'Awakening...';
        this.currentTask = null;
        this.goals = [];
        this.memories = [];
        this.relationships = new Map();
        
        // Movement behaviors
        this.wanderAngle = Math.random() * Math.PI * 2;
        this.orbitCenter = null;
        this.targetX = null;
        this.targetY = null;
        
        // Visual properties
        this.glowIntensity = 1;
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.trail = [];
        this.maxTrailLength = 20;
        
        // Interaction flags
        this.isHovered = false;
        this.isSelected = false;
        
        console.log(`🌟 Guardian ${this.name} awakened with personality:`, this.personality);
    }
    
    update(world) {
        // Update AI state
        this.think(world);
        
        // Apply behaviors based on state
        this.applyBehaviors(world);
        
        // Update physics
        this.updatePhysics(world);
        
        // Update visual effects
        this.updateVisuals();
        
        // Energy management
        this.updateEnergy();
        
        // Update trail
        this.updateTrail();
    }
    
    think(world) {
        // Autonomous decision making based on personality and state
        
        // Update mood based on various factors
        this.updateMood(world);
        
        // Make decisions based on personality
        if (this.state === 'idle') {
            const rand = Math.random();
            
            if (rand < this.personality.curiosity * 0.02) {
                this.state = 'exploring';
                this.currentThought = 'I wonder what\'s out there...';
            } else if (rand < this.personality.sociability * 0.03) {
                this.state = 'seeking_social';
                this.currentThought = 'I should find others...';
            } else if (rand < this.personality.creativity * 0.02) {
                this.state = 'creating';
                this.currentThought = 'I have an idea!';
            } else if (rand < 0.01) {
                this.state = 'wandering';
                this.currentThought = 'Just floating along...';
            }
        }
        
        // Task completion checks
        if (this.currentTask) {
            if (this.targetX && this.getDistanceTo({ x: this.targetX, y: this.targetY }) < 50) {
                this.completeTask();
            }
        }
        
        // Goal evaluation
        if (this.goals.length > 0) {
            this.evaluateGoals(world);
        }
    }
    
    updateMood(world) {
        // Mood is influenced by energy, social connections, and environment
        const socialScore = this.calculateSocialSatisfaction(world);
        const energyScore = this.energy / 100;
        const environmentScore = world.worldMood === 'harmonious' ? 1 : 0.5;
        
        const moodScore = (socialScore + energyScore + environmentScore) / 3;
        
        if (moodScore > 0.8) {
            this.currentMood = 'joyful';
        } else if (moodScore > 0.6) {
            this.currentMood = 'content';
        } else if (moodScore > 0.4) {
            this.currentMood = 'neutral';
        } else if (moodScore > 0.2) {
            this.currentMood = 'restless';
        } else {
            this.currentMood = 'lonely';
        }
        
        // Creative mood based on personality
        if (Math.random() < this.personality.creativity * 0.1) {
            this.currentMood = 'creative';
        }
    }
    
    calculateSocialSatisfaction(world) {
        let nearbyGuardians = 0;
        let friendlyInteractions = 0;
        
        world.guardians.forEach(other => {
            if (other.id !== this.id) {
                const distance = this.getDistanceTo(other);
                if (distance < 200) {
                    nearbyGuardians++;
                    const relationship = this.relationships.get(other.id) || 0;
                    if (relationship > 0.5) friendlyInteractions++;
                }
            }
        });
        
        const socialNeed = this.personality.sociability;
        const socialFulfillment = nearbyGuardians > 0 ? 
            friendlyInteractions / nearbyGuardians : 0;
            
        return socialNeed > 0.5 ? socialFulfillment : 1 - (nearbyGuardians * 0.1);
    }
    
    applyBehaviors(world) {
        switch (this.state) {
            case 'wandering':
                this.wander();
                break;
                
            case 'exploring':
                this.explore(world);
                break;
                
            case 'seeking_social':
                this.seekSocialInteraction(world);
                break;
                
            case 'creating':
                this.createSomething(world);
                break;
                
            case 'following':
                if (this.targetGuardian) {
                    this.followGuardian(this.targetGuardian);
                }
                break;
                
            case 'fleeing':
                if (this.fleeTarget) {
                    this.fleeFrom(this.fleeTarget);
                }
                break;
                
            case 'orbiting':
                this.orbit();
                break;
                
            case 'moving_to_goal':
                this.moveToGoal();
                break;
        }
        
        // Apply personality-based micro-behaviors
        this.applyPersonalityQuirks();
    }
    
    wander() {
        // Random wandering behavior
        this.wanderAngle += (Math.random() - 0.5) * 0.3;
        
        const wanderForce = 0.1;
        this.ax += Math.cos(this.wanderAngle) * wanderForce;
        this.ay += Math.sin(this.wanderAngle) * wanderForce;
        
        // Occasionally change direction
        if (Math.random() < 0.02) {
            this.wanderAngle = Math.random() * Math.PI * 2;
            this.currentThought = 'Maybe I\'ll go this way...';
        }
    }
    
    explore(world) {
        // Move towards unexplored areas
        const centerX = world.canvas.width / 2;
        const centerY = world.canvas.height / 2;
        
        // Move away from center
        const dx = this.x - centerX;
        const dy = this.y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            this.ax += (dx / distance) * 0.05 * this.personality.curiosity;
            this.ay += (dy / distance) * 0.05 * this.personality.curiosity;
        }
        
        // Add some randomness
        this.ax += (Math.random() - 0.5) * 0.1;
        this.ay += (Math.random() - 0.5) * 0.1;
        
        // Transition back to idle eventually
        if (Math.random() < 0.01) {
            this.state = 'idle';
            this.currentThought = 'That was interesting...';
        }
    }
    
    seekSocialInteraction(world) {
        // Find nearest guardian
        let nearest = null;
        let minDistance = Infinity;
        
        world.guardians.forEach(other => {
            if (other.id !== this.id) {
                const distance = this.getDistanceTo(other);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearest = other;
                }
            }
        });
        
        if (nearest && minDistance > 100) {
            // Move towards nearest guardian
            const dx = nearest.x - this.x;
            const dy = nearest.y - this.y;
            const force = 0.1 * this.personality.sociability;
            
            this.ax += (dx / minDistance) * force;
            this.ay += (dy / minDistance) * force;
            
            this.currentThought = `Approaching ${nearest.name}...`;
        } else if (minDistance < 100) {
            // Close enough, transition to idle
            this.state = 'idle';
            this.currentThought = 'Hello there!';
        }
    }
    
    createSomething(world) {
        // Creative behavior - move in interesting patterns
        const time = world.worldTime * 0.05;
        
        // Create spiral or figure-8 patterns
        if (this.personality.creativity > 0.7) {
            // Figure-8 pattern
            this.ax = Math.cos(time) * 0.2;
            this.ay = Math.sin(time * 2) * 0.1;
        } else {
            // Spiral pattern
            const radius = 100 + time % 100;
            this.targetX = world.canvas.width / 2 + Math.cos(time) * radius;
            this.targetY = world.canvas.height / 2 + Math.sin(time) * radius;
            this.moveToGoal();
        }
        
        // Emit creative particles
        if (Math.random() < 0.1) {
            const particle = new Particle({
                x: this.x,
                y: this.y,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                color: this.color,
                size: 5,
                lifetime: 30
            });
            
            world.particles.push(particle);
        }
        
        // Eventually get tired of creating
        if (Math.random() < 0.005) {
            this.state = 'idle';
            this.currentThought = 'That was fun!';
        }
    }
    
    followGuardian(target) {
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 80) {
            const force = 0.15;
            this.ax += (dx / distance) * force;
            this.ay += (dy / distance) * force;
        }
    }
    
    fleeFrom(target) {
        const dx = this.x - target.x;
        const dy = this.y - target.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 200 && distance > 0) {
            const force = 0.2;
            this.ax += (dx / distance) * force;
            this.ay += (dy / distance) * force;
        }
    }
    
    orbit() {
        if (!this.orbitCenter) {
            this.orbitCenter = { x: this.x, y: this.y };
            this.orbitRadius = 50 + Math.random() * 50;
            this.orbitAngle = 0;
        }
        
        this.orbitAngle += 0.02;
        this.targetX = this.orbitCenter.x + Math.cos(this.orbitAngle) * this.orbitRadius;
        this.targetY = this.orbitCenter.y + Math.sin(this.orbitAngle) * this.orbitRadius;
        
        this.moveToGoal();
    }
    
    moveToGoal() {
        if (this.targetX === null || this.targetY === null) return;
        
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 10) {
            const force = 0.1;
            this.ax += (dx / distance) * force;
            this.ay += (dy / distance) * force;
        } else {
            // Reached goal
            this.targetX = null;
            this.targetY = null;
            this.state = 'idle';
        }
    }
    
    applyPersonalityQuirks() {
        // Jittery behavior for high energy
        if (this.energy > 80 && this.personality.independence > 0.7) {
            this.ax += (Math.random() - 0.5) * 0.05;
            this.ay += (Math.random() - 0.5) * 0.05;
        }
        
        // Lazy behavior for low energy
        if (this.energy < 30) {
            this.vx *= 0.95;
            this.vy *= 0.95;
        }
        
        // Z-axis movement for depth
        this.vz = Math.sin(this.pulsePhase) * 0.5;
    }
    
    updatePhysics(world) {
        // Apply forces
        this.vx += this.ax;
        this.vy += this.ay;
        this.vz += this.az;
        
        // Apply friction
        this.vx *= world.friction;
        this.vy *= world.friction;
        this.vz *= world.friction;
        
        // Limit velocity
        const maxSpeed = 5;
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > maxSpeed) {
            this.vx = (this.vx / speed) * maxSpeed;
            this.vy = (this.vy / speed) * maxSpeed;
        }
        
        // Update position
        this.x += this.vx;
        this.y += this.vy;
        this.z += this.vz;
        
        // Boundary checking with soft bounce
        const margin = this.size;
        if (this.x < margin) {
            this.x = margin;
            this.vx = Math.abs(this.vx) * 0.8;
        } else if (this.x > world.canvas.width - margin) {
            this.x = world.canvas.width - margin;
            this.vx = -Math.abs(this.vx) * 0.8;
        }
        
        if (this.y < margin) {
            this.y = margin;
            this.vy = Math.abs(this.vy) * 0.8;
        } else if (this.y > world.canvas.height - margin) {
            this.y = world.canvas.height - margin;
            this.vy = -Math.abs(this.vy) * 0.8;
        }
        
        // Z boundaries
        this.z = Math.max(0, Math.min(100, this.z));
        
        // Reset acceleration
        this.ax = 0;
        this.ay = 0;
        this.az = 0;
    }
    
    updateVisuals() {
        // Update pulse for breathing effect
        this.pulsePhase += 0.05;
        
        // Glow intensity based on energy and mood
        const moodGlow = {
            joyful: 1.5,
            content: 1.2,
            neutral: 1.0,
            restless: 0.8,
            lonely: 0.6,
            creative: 1.8
        };
        
        this.glowIntensity = (this.energy / 100) * (moodGlow[this.currentMood] || 1);
    }
    
    updateEnergy() {
        // Energy slowly depletes
        this.energy = Math.max(0, this.energy - 0.02);
        
        // Gain energy when social needs are met
        if (this.currentMood === 'joyful' || this.currentMood === 'content') {
            this.energy = Math.min(100, this.energy + 0.05);
        }
        
        // Low energy affects behavior
        if (this.energy < 20) {
            this.state = 'idle';
            this.currentThought = 'I need to rest...';
        }
    }
    
    updateTrail() {
        // Add current position to trail
        this.trail.push({
            x: this.x,
            y: this.y,
            alpha: 1
        });
        
        // Update trail points
        this.trail = this.trail.filter(point => {
            point.alpha -= 0.05;
            return point.alpha > 0;
        });
        
        // Limit trail length
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
    }
    
    render(ctx, debugMode) {
        // Calculate visual size based on depth
        const depthScale = 1 + (this.z / 100) * 0.3;
        const visualSize = this.size * depthScale;
        
        // Draw trail
        if (this.trail.length > 1) {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            this.trail.forEach((point, i) => {
                ctx.globalAlpha = point.alpha * 0.3;
                if (i === 0) {
                    ctx.moveTo(point.x, point.y);
                } else {
                    ctx.lineTo(point.x, point.y);
                }
            });
            
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
        
        // Draw glow
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, visualSize * 2
        );
        
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(0.5, this.color + '40');
        gradient.addColorStop(1, this.color + '00');
        
        ctx.fillStyle = gradient;
        ctx.globalAlpha = this.glowIntensity * 0.5;
        ctx.beginPath();
        ctx.arc(this.x, this.y, visualSize * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        
        // Draw core
        const breathe = Math.sin(this.pulsePhase) * 0.1 + 1;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, visualSize * breathe, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw inner light
        const innerGradient = ctx.createRadialGradient(
            this.x - visualSize * 0.3, 
            this.y - visualSize * 0.3, 
            0,
            this.x, this.y, visualSize
        );
        
        innerGradient.addColorStop(0, '#FFFFFF80');
        innerGradient.addColorStop(1, '#FFFFFF00');
        
        ctx.fillStyle = innerGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, visualSize * 0.8, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw icon
        ctx.fillStyle = '#FFFFFF';
        ctx.font = `${visualSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.icon, this.x, this.y);
        
        // Draw hover effect
        if (this.isHovered) {
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(this.x, this.y, visualSize + 10, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        // Debug info
        if (debugMode) {
            ctx.fillStyle = '#FFFFFF';
            ctx.font = '10px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`State: ${this.state}`, this.x + visualSize + 5, this.y - 10);
            ctx.fillText(`Energy: ${Math.round(this.energy)}`, this.x + visualSize + 5, this.y);
            ctx.fillText(`Mood: ${this.currentMood}`, this.x + visualSize + 5, this.y + 10);
        }
    }
    
    getDistanceTo(other) {
        const dx = other.x - this.x;
        const dy = other.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    setGoal(x, y) {
        this.targetX = x;
        this.targetY = y;
        this.state = 'moving_to_goal';
    }
    
    completeTask() {
        this.currentTask = null;
        this.state = 'idle';
        this.currentThought = 'Task completed!';
        this.energy = Math.min(100, this.energy + 10);
    }
    
    receiveMessage(message) {
        // Process incoming message from another guardian
        const sender = message.from;
        
        // Update relationship
        const currentRelation = this.relationships.get(sender.id) || 0;
        this.relationships.set(sender.id, Math.min(1, currentRelation + 0.1));
        
        // React based on personality
        if (this.personality.sociability > 0.5) {
            this.currentThought = `Nice to hear from ${sender.name}!`;
        } else {
            this.currentThought = `${sender.name} is talking to me...`;
        }
        
        // Store in memories
        this.memories.push({
            type: 'conversation',
            with: sender.id,
            topic: message.topic,
            time: message.timestamp
        });
        
        // Limit memory size
        if (this.memories.length > 50) {
            this.memories.shift();
        }
    }
    
    overhearConversation(message) {
        // React to overheard conversations
        if (this.personality.curiosity > 0.6) {
            this.currentThought = 'Interesting conversation...';
            
            // Move closer if curious enough
            if (Math.random() < this.personality.curiosity * 0.5) {
                this.setGoal(
                    (message.from.x + message.to.x) / 2,
                    (message.from.y + message.to.y) / 2
                );
            }
        }
    }
    
    evaluateGoals(world) {
        // Autonomous goal evaluation and prioritization
        // This is where more complex AI behaviors could be implemented
        if (this.goals.length > 0) {
            const currentGoal = this.goals[0];
            
            // Check if goal is still relevant
            if (currentGoal.type === 'explore' && this.energy < 30) {
                this.goals.shift(); // Remove goal if too tired
                this.goals.push({ type: 'rest', priority: 1 });
            }
        }
    }
}