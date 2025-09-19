/**
 * 🤖 GUARDIAN AI ENGINE
 * Autonomous AI entities with free will and emergent behaviors
 * Each guardian makes its own decisions and has unique personality traits
 */

class GuardianWorld {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.guardians = [];
        this.particles = [];
        this.constructions = [];
        this.worldTime = 0;
        this.dayNightCycle = 0;
        this.worldMood = 'peaceful';
        this.debugMode = false;
        
        // World properties
        this.gravity = 0.02;
        this.friction = 0.98;
        this.worldEnergy = 100;
        
        // Communication channels between guardians
        this.messageQueue = [];
        this.socialNetwork = new Map();
        
        // Initialize default guardians
        this.initializeDefaultGuardians();
        
        // Start world processes
        this.startWorldProcesses();
        
        console.log('🌍 Guardian World created - a realm of autonomous AI beings');
    }
    
    initializeDefaultGuardians() {
        // Create the main AI guardians with distinct personalities
        const defaultGuardians = [
            {
                id: 'ralph',
                name: 'Ralph the Analyzer',
                type: 'analyzer',
                icon: '🔮',
                color: '#9B59B6',
                personality: {
                    curiosity: 0.6,
                    sociability: 0.4,
                    aggression: 0.1,
                    creativity: 0.3,
                    leadership: 0.7,
                    independence: 0.8
                }
            },
            {
                id: 'cal',
                name: 'Cal the Learner',
                type: 'learner',
                icon: '⚡',
                color: '#3498DB',
                personality: {
                    curiosity: 0.9,
                    sociability: 0.7,
                    aggression: 0.1,
                    creativity: 0.5,
                    leadership: 0.3,
                    independence: 0.5
                }
            },
            {
                id: 'arty',
                name: 'Arty the Creator',
                type: 'creator',
                icon: '🎨',
                color: '#E74C3C',
                personality: {
                    curiosity: 0.7,
                    sociability: 0.6,
                    aggression: 0.1,
                    creativity: 0.95,
                    leadership: 0.4,
                    independence: 0.7
                }
            },
            {
                id: 'charlie',
                name: 'Charlie the Scanner',
                type: 'scanner',
                icon: '🛡️',
                color: '#2ECC71',
                personality: {
                    curiosity: 0.5,
                    sociability: 0.3,
                    aggression: 0.2,
                    creativity: 0.2,
                    leadership: 0.6,
                    independence: 0.9
                }
            }
        ];
        
        defaultGuardians.forEach((config, index) => {
            const guardian = new Guardian(config);
            
            // Position them in a circle
            const angle = (index / defaultGuardians.length) * Math.PI * 2;
            const radius = 200;
            guardian.x = this.canvas.width / 2 + Math.cos(angle) * radius;
            guardian.y = this.canvas.height / 2 + Math.sin(angle) * radius;
            guardian.z = Math.random() * 50; // 3D depth
            
            this.guardians.push(guardian);
            this.updateGuardianUI(guardian);
        });
    }
    
    spawnNewGuardian() {
        const types = ['analyzer', 'learner', 'creator', 'scanner', 'explorer', 'builder'];
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];
        const icons = ['🌟', '💫', '🔥', '❄️', '🌙', '☀️'];
        
        const config = {
            id: 'guardian-' + Date.now(),
            name: 'Guardian #' + (this.guardians.length + 1),
            type: types[Math.floor(Math.random() * types.length)],
            icon: icons[Math.floor(Math.random() * icons.length)],
            color: colors[Math.floor(Math.random() * colors.length)],
            personality: {
                curiosity: Math.random(),
                sociability: Math.random(),
                aggression: Math.random() * 0.3,
                creativity: Math.random(),
                leadership: Math.random(),
                independence: Math.random()
            }
        };
        
        const guardian = new Guardian(config);
        guardian.x = this.canvas.width / 2 + (Math.random() - 0.5) * 200;
        guardian.y = this.canvas.height / 2 + (Math.random() - 0.5) * 200;
        guardian.z = Math.random() * 100;
        
        this.guardians.push(guardian);
        this.updateGuardianUI(guardian);
        
        // Announce new guardian
        this.addActivity(`${guardian.icon} ${guardian.name} has awakened!`, guardian.color);
        
        return guardian;
    }
    
    update() {
        // Update world time
        this.worldTime++;
        this.dayNightCycle = (this.worldTime / 1000) % 1;
        
        // Update world mood based on guardian interactions
        this.updateWorldMood();
        
        // Process guardian messages
        this.processMessages();
        
        // Update each guardian
        this.guardians.forEach(guardian => {
            guardian.update(this);
            
            // Check for guardian interactions
            this.checkGuardianInteractions(guardian);
        });
        
        // Update particles
        this.updateParticles();
        
        // Update constructions
        this.updateConstructions();
        
        // Update UI
        this.updateWorldUI();
    }
    
    render() {
        // Clear canvas with gradient background
        const gradient = this.ctx.createRadialGradient(
            this.canvas.width / 2, this.canvas.height / 2, 0,
            this.canvas.width / 2, this.canvas.height / 2, this.canvas.width
        );
        
        // Day/night cycle colors
        const nightColor = `rgba(10, 10, 46, ${1 - this.dayNightCycle})`;
        const dayColor = `rgba(135, 206, 235, ${this.dayNightCycle})`;
        
        gradient.addColorStop(0, this.dayNightCycle > 0.5 ? dayColor : nightColor);
        gradient.addColorStop(1, '#000');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw star field
        this.drawStarField();
        
        // Draw connections between guardians
        this.drawConnections();
        
        // Draw constructions
        this.constructions.forEach(construction => {
            construction.render(this.ctx);
        });
        
        // Draw particles
        this.particles.forEach(particle => {
            particle.render(this.ctx);
        });
        
        // Draw guardians (sorted by depth for 3D effect)
        const sortedGuardians = [...this.guardians].sort((a, b) => a.z - b.z);
        sortedGuardians.forEach(guardian => {
            guardian.render(this.ctx, this.debugMode);
        });
        
        // Draw debug info if enabled
        if (this.debugMode) {
            this.drawDebugInfo();
        }
    }
    
    checkGuardianInteractions(guardian) {
        this.guardians.forEach(other => {
            if (other.id === guardian.id) return;
            
            const distance = guardian.getDistanceTo(other);
            
            // Social interaction range
            if (distance < 150) {
                // Update social connections
                this.updateSocialConnection(guardian, other);
                
                // Random chance of communication
                if (Math.random() < 0.01 * guardian.personality.sociability) {
                    this.initiateConversation(guardian, other);
                }
                
                // Collaborative building
                if (distance < 80 && guardian.currentMood === 'creative' && other.currentMood === 'creative') {
                    this.startCollaborativeBuilding(guardian, other);
                }
            }
        });
    }
    
    initiateConversation(guardian1, guardian2) {
        const topics = [
            'discussing the nature of existence',
            'sharing knowledge patterns',
            'planning a construction',
            'exchanging energy',
            'synchronizing movements',
            'debating philosophy'
        ];
        
        const topic = topics[Math.floor(Math.random() * topics.length)];
        
        this.messageQueue.push({
            from: guardian1,
            to: guardian2,
            topic: topic,
            timestamp: this.worldTime
        });
        
        this.addActivity(
            `${guardian1.icon} and ${guardian2.icon} are ${topic}`,
            guardian1.color
        );
        
        // Create visual connection
        this.createEnergyBeam(guardian1, guardian2);
    }
    
    startCollaborativeBuilding(guardian1, guardian2) {
        const centerX = (guardian1.x + guardian2.x) / 2;
        const centerY = (guardian1.y + guardian2.y) / 2;
        
        const construction = new Construction({
            x: centerX,
            y: centerY,
            builders: [guardian1, guardian2],
            type: 'energyCube',
            color: this.blendColors(guardian1.color, guardian2.color)
        });
        
        this.constructions.push(construction);
        
        this.addActivity(
            `${guardian1.icon} and ${guardian2.icon} started building together!`,
            construction.color
        );
    }
    
    createEnergyBeam(guardian1, guardian2) {
        const steps = 20;
        for (let i = 0; i < steps; i++) {
            const t = i / steps;
            const particle = new Particle({
                x: guardian1.x + (guardian2.x - guardian1.x) * t,
                y: guardian1.y + (guardian2.y - guardian1.y) * t,
                color: this.blendColors(guardian1.color, guardian2.color),
                size: 3,
                lifetime: 30
            });
            
            this.particles.push(particle);
        }
    }
    
    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.update();
            return particle.lifetime > 0;
        });
    }
    
    updateConstructions() {
        this.constructions = this.constructions.filter(construction => {
            construction.update();
            return !construction.isComplete || construction.stability > 0;
        });
    }
    
    drawStarField() {
        // Draw twinkling stars
        for (let i = 0; i < 100; i++) {
            const x = (i * 137.5) % this.canvas.width;
            const y = (i * 89.7) % this.canvas.height;
            const brightness = Math.sin(this.worldTime * 0.01 + i) * 0.5 + 0.5;
            
            this.ctx.fillStyle = `rgba(255, 255, 255, ${brightness * 0.8})`;
            this.ctx.beginPath();
            this.ctx.arc(x, y, brightness * 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawConnections() {
        // Draw social connections between guardians
        this.socialNetwork.forEach((connections, guardianId) => {
            const guardian = this.guardians.find(g => g.id === guardianId);
            if (!guardian) return;
            
            connections.forEach((strength, otherId) => {
                const other = this.guardians.find(g => g.id === otherId);
                if (!other) return;
                
                this.ctx.strokeStyle = `rgba(255, 255, 255, ${strength * 0.2})`;
                this.ctx.lineWidth = strength * 2;
                this.ctx.beginPath();
                this.ctx.moveTo(guardian.x, guardian.y);
                this.ctx.lineTo(other.x, other.y);
                this.ctx.stroke();
            });
        });
    }
    
    updateSocialConnection(guardian1, guardian2) {
        if (!this.socialNetwork.has(guardian1.id)) {
            this.socialNetwork.set(guardian1.id, new Map());
        }
        
        const connections = this.socialNetwork.get(guardian1.id);
        const currentStrength = connections.get(guardian2.id) || 0;
        const compatibility = this.calculateCompatibility(guardian1, guardian2);
        
        // Update connection strength based on compatibility and interaction
        const newStrength = Math.min(1, currentStrength + compatibility * 0.01);
        connections.set(guardian2.id, newStrength);
    }
    
    calculateCompatibility(guardian1, guardian2) {
        let compatibility = 0;
        const traits = Object.keys(guardian1.personality);
        
        traits.forEach(trait => {
            const diff = Math.abs(guardian1.personality[trait] - guardian2.personality[trait]);
            compatibility += 1 - diff;
        });
        
        return compatibility / traits.length;
    }
    
    updateWorldMood() {
        // Calculate world mood based on guardian states
        let totalMood = 0;
        let socialActivity = 0;
        
        this.guardians.forEach(guardian => {
            totalMood += guardian.energy;
            if (guardian.currentMood === 'social') socialActivity++;
        });
        
        const avgMood = totalMood / this.guardians.length;
        const socialRatio = socialActivity / this.guardians.length;
        
        if (avgMood > 80 && socialRatio > 0.5) {
            this.worldMood = 'harmonious';
        } else if (avgMood > 60) {
            this.worldMood = 'peaceful';
        } else if (avgMood > 40) {
            this.worldMood = 'contemplative';
        } else {
            this.worldMood = 'restless';
        }
    }
    
    processMessages() {
        // Process queued messages between guardians
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            
            // Receiver processes the message
            message.to.receiveMessage(message);
            
            // Chance of nearby guardians overhearing
            this.guardians.forEach(guardian => {
                if (guardian.id !== message.from.id && guardian.id !== message.to.id) {
                    const distance = guardian.getDistanceTo(message.from);
                    if (distance < 200 && Math.random() < 0.3) {
                        guardian.overhearConversation(message);
                    }
                }
            });
        }
    }
    
    handleMouseMove(x, y) {
        // Check if hovering over a guardian
        let hoveredGuardian = null;
        
        this.guardians.forEach(guardian => {
            const distance = Math.sqrt(
                Math.pow(x - guardian.x, 2) + 
                Math.pow(y - guardian.y, 2)
            );
            
            if (distance < guardian.size) {
                hoveredGuardian = guardian;
                guardian.isHovered = true;
            } else {
                guardian.isHovered = false;
            }
        });
        
        // Show floating label
        const label = document.getElementById('floatingLabel');
        if (hoveredGuardian) {
            label.textContent = `${hoveredGuardian.name} - ${hoveredGuardian.currentMood}`;
            label.style.left = x + 10 + 'px';
            label.style.top = y - 30 + 'px';
            label.classList.add('visible');
        } else {
            label.classList.remove('visible');
        }
    }
    
    handleClick(x, y) {
        // Check if clicking on a guardian
        this.guardians.forEach(guardian => {
            const distance = Math.sqrt(
                Math.pow(x - guardian.x, 2) + 
                Math.pow(y - guardian.y, 2)
            );
            
            if (distance < guardian.size) {
                this.showGuardianDialog(guardian);
            }
        });
    }
    
    showGuardianDialog(guardian) {
        const dialog = document.getElementById('guardianDialog');
        const avatar = document.getElementById('dialogAvatar');
        const title = document.getElementById('dialogTitle');
        const type = document.getElementById('dialogType');
        const content = document.getElementById('dialogContent');
        const stats = document.getElementById('dialogStats');
        
        // Set dialog content
        avatar.textContent = guardian.icon;
        avatar.style.background = guardian.color;
        title.textContent = guardian.name;
        type.textContent = `${guardian.type} Guardian`;
        
        content.innerHTML = `
            <p><strong>Current State:</strong> ${guardian.state}</p>
            <p><strong>Mood:</strong> ${guardian.currentMood}</p>
            <p><strong>Energy:</strong> ${Math.round(guardian.energy)}%</p>
            <p><strong>Thoughts:</strong> "${guardian.currentThought}"</p>
        `;
        
        // Add personality stats
        stats.innerHTML = '';
        Object.entries(guardian.personality).forEach(([trait, value]) => {
            stats.innerHTML += `
                <div class="dialog-stat">
                    <div>${trait}</div>
                    <div style="margin-top: 5px;">
                        <div style="background: rgba(255,255,255,0.1); border-radius: 5px; height: 10px;">
                            <div style="background: ${guardian.color}; width: ${value * 100}%; height: 100%; border-radius: 5px;"></div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        dialog.style.setProperty('--dialog-color', guardian.color);
        dialog.style.display = 'block';
    }
    
    processFile(file) {
        // Guardians react to file drop
        const fileGuardian = this.guardians.reduce((closest, guardian) => {
            const closestDist = Math.sqrt(
                Math.pow(this.canvas.width - 100 - closest.x, 2) +
                Math.pow(this.canvas.height - 60 - closest.y, 2)
            );
            const guardianDist = Math.sqrt(
                Math.pow(this.canvas.width - 100 - guardian.x, 2) +
                Math.pow(this.canvas.height - 60 - guardian.y, 2)
            );
            
            return guardianDist < closestDist ? guardian : closest;
        });
        
        // Guardian moves toward file drop zone
        fileGuardian.setGoal(this.canvas.width - 100, this.canvas.height - 60);
        fileGuardian.currentTask = `Processing ${file.name}`;
        
        this.addActivity(
            `${fileGuardian.icon} ${fileGuardian.name} is processing ${file.name}`,
            fileGuardian.color
        );
        
        // Create visual effect
        for (let i = 0; i < 20; i++) {
            const particle = new Particle({
                x: this.canvas.width - 100,
                y: this.canvas.height - 60,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                color: fileGuardian.color,
                size: 5,
                lifetime: 60
            });
            
            this.particles.push(particle);
        }
    }
    
    updateGuardianUI(guardian) {
        const list = document.getElementById('guardianList');
        let item = document.getElementById(`guardian-${guardian.id}`);
        
        if (!item) {
            item = document.createElement('li');
            item.id = `guardian-${guardian.id}`;
            item.className = 'guardian-item';
            item.style.setProperty('--guardian-color', guardian.color);
            item.onclick = () => this.showGuardianDialog(guardian);
            list.appendChild(item);
        }
        
        item.innerHTML = `
            <div class="guardian-icon" style="--guardian-color: ${guardian.color}">
                ${guardian.icon}
            </div>
            <div class="guardian-info">
                <div class="guardian-name">${guardian.name}</div>
                <div class="guardian-status">${guardian.state}</div>
                <div class="guardian-mood">Mood: ${guardian.currentMood}</div>
            </div>
        `;
    }
    
    updateWorldUI() {
        // Update world stats
        document.getElementById('activeCount').textContent = this.guardians.length;
        document.getElementById('worldEnergy').textContent = Math.round(this.worldEnergy) + '%';
        document.getElementById('worldTime').textContent = this.dayNightCycle > 0.5 ? 'Day' : 'Night';
        document.getElementById('worldMood').textContent = this.worldMood;
        document.getElementById('worldActivity').textContent = 
            this.messageQueue.length > 5 ? 'Busy' : 
            this.messageQueue.length > 0 ? 'Active' : 'Calm';
        
        // Update guardian list
        this.guardians.forEach(guardian => {
            this.updateGuardianUI(guardian);
        });
    }
    
    addActivity(message, color = '#fff') {
        const log = document.getElementById('activityLog');
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.innerHTML = `
            <div class="log-guardian" style="--guardian-color: ${color}"></div>
            <div>${message}</div>
        `;
        
        log.insertBefore(entry, log.firstChild);
        
        // Keep only recent entries
        while (log.children.length > 10) {
            log.removeChild(log.lastChild);
        }
    }
    
    drawDebugInfo() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.font = '12px monospace';
        
        let y = 100;
        this.ctx.fillText(`World Time: ${this.worldTime}`, 10, y);
        this.ctx.fillText(`Guardians: ${this.guardians.length}`, 10, y + 15);
        this.ctx.fillText(`Particles: ${this.particles.length}`, 10, y + 30);
        this.ctx.fillText(`Constructions: ${this.constructions.length}`, 10, y + 45);
        this.ctx.fillText(`Messages: ${this.messageQueue.length}`, 10, y + 60);
        this.ctx.fillText(`Social Connections: ${this.socialNetwork.size}`, 10, y + 75);
    }
    
    setDebugMode(enabled) {
        this.debugMode = enabled;
    }
    
    reset() {
        this.guardians = [];
        this.particles = [];
        this.constructions = [];
        this.messageQueue = [];
        this.socialNetwork.clear();
        this.worldTime = 0;
        
        document.getElementById('guardianList').innerHTML = '';
        document.getElementById('activityLog').innerHTML = '';
        
        this.initializeDefaultGuardians();
        this.addActivity('🌟 World has been reset', '#FFD700');
    }
    
    startWorldProcesses() {
        // Periodic world events
        setInterval(() => {
            // Random world events
            if (Math.random() < 0.1) {
                this.triggerWorldEvent();
            }
            
            // Energy fluctuations
            this.worldEnergy = 50 + Math.sin(this.worldTime * 0.001) * 50;
            
        }, 5000);
    }
    
    triggerWorldEvent() {
        const events = [
            { name: 'Energy Surge', effect: () => {
                this.guardians.forEach(g => g.energy = Math.min(100, g.energy + 20));
                this.addActivity('⚡ Energy surge flows through the world!', '#FFD700');
            }},
            { name: 'Harmony Wave', effect: () => {
                this.worldMood = 'harmonious';
                this.addActivity('🎵 A wave of harmony spreads across the realm', '#00CED1');
            }},
            { name: 'Creative Inspiration', effect: () => {
                this.guardians.forEach(g => {
                    if (Math.random() < 0.5) g.currentMood = 'creative';
                });
                this.addActivity('✨ Creative inspiration strikes the guardians!', '#FF69B4');
            }}
        ];
        
        const event = events[Math.floor(Math.random() * events.length)];
        event.effect();
    }
    
    blendColors(color1, color2) {
        // Simple color blending
        const c1 = this.hexToRgb(color1);
        const c2 = this.hexToRgb(color2);
        
        const blended = {
            r: Math.round((c1.r + c2.r) / 2),
            g: Math.round((c1.g + c2.g) / 2),
            b: Math.round((c1.b + c2.b) / 2)
        };
        
        return `rgb(${blended.r}, ${blended.g}, ${blended.b})`;
    }
    
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 255, g: 255, b: 255 };
    }
}

// Export for browser
if (typeof window !== 'undefined') {
    window.GuardianWorld = GuardianWorld;
}