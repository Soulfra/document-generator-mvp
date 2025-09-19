/**
 * 🎉✨💫 Stream Emoji Reactions System
 * Floating emoji particles that react to stream content and user interactions
 * Where Emotions Float Free™
 */

class StreamEmojiReactions {
    constructor() {
        this.activeParticles = new Map();
        this.reactionQueues = new Map();
        this.particlePool = [];
        this.maxParticles = 100;
        this.particleId = 0;
        
        // Domain-specific emoji sets
        this.domainEmojis = {
            red: {
                name: 'Gaming',
                base: ['🎮', '🕹️', '👾', '🎯', '🏆'],
                excited: ['🔥', '💥', '⚡', '🚀', '💫'],
                calm: ['✨', '🌟', '💎', '🎲', '🃏'],
                victory: ['🏅', '🥇', '🎊', '🎉', '🎆']
            },
            orange: {
                name: 'Brand',
                base: ['🎨', '🖼️', '🎪', '🎭', '🎬'],
                excited: ['✨', '💡', '🌟', '🔮', '💎'],
                calm: ['🎯', '📊', '📈', '💼', '🏢'],
                creative: ['🎨', '🌈', '🎆', '✏️', '🖌️']
            },
            yellow: {
                name: '3D',
                base: ['🎪', '🎠', '🎢', '🎡', '🏗️'],
                excited: ['🌟', '💫', '✨', '🌠', '🎆'],
                calm: ['🏛️', '🗿', '🏰', '🏟️', '🎪'],
                depth: ['🔮', '💠', '🔷', '🔶', '🟦']
            },
            green: {
                name: 'Character',
                base: ['👤', '🧑', '👥', '🦸', '🧙'],
                excited: ['💚', '🌿', '🍀', '🌱', '🌳'],
                calm: ['🧘', '🎭', '🎨', '🖼️', '🎪'],
                social: ['🤝', '👫', '👬', '👭', '🫂']
            },
            white: {
                name: 'Central',
                base: ['⭐', '🌟', '✨', '💫', '🌠'],
                excited: ['🎆', '🎇', '✨', '💥', '🌟'],
                calm: ['☁️', '🌫️', '🌬️', '❄️', '🏔️'],
                pure: ['🤍', '🕊️', '🦢', '🏳️', '📜']
            },
            blue: {
                name: 'Crypto',
                base: ['💰', '🪙', '💎', '💸', '🏦'],
                excited: ['📈', '🚀', '💹', '⚡', '🔥'],
                calm: ['💙', '🧊', '🌊', '💧', '🏔️'],
                blockchain: ['🔗', '⛓️', '🔐', '🗝️', '🔒']
            },
            indigo: {
                name: 'AI',
                base: ['🤖', '🧠', '💭', '🔬', '🔭'],
                excited: ['⚡', '💥', '🌟', '✨', '🎆'],
                calm: ['🔮', '💜', '🟣', '🟪', '🌌'],
                thinking: ['💭', '🤔', '💡', '🧩', '📊']
            },
            violet: {
                name: 'Business',
                base: ['💼', '📊', '📈', '🏢', '💰'],
                excited: ['🚀', '💥', '⭐', '🎯', '💡'],
                calm: ['💜', '🟣', '🔮', '🌆', '🏙️'],
                success: ['🏆', '🥇', '🎉', '🍾', '🎊']
            },
            black: {
                name: 'System',
                base: ['⚙️', '🔧', '🔩', '🖥️', '💻'],
                excited: ['⚡', '💥', '🔥', '🌟', '✨'],
                calm: ['🖤', '⚫', '◼️', '▪️', '🎱'],
                tech: ['🔌', '🔋', '📡', '🛰️', '🌐']
            }
        };

        // Interaction reactions
        this.interactionReactions = {
            hover: ['✨', '🌟', '💫'],
            click: ['💥', '⚡', '🎯'],
            focus: ['👁️', '🔍', '🎯'],
            scroll: ['🌊', '🌀', '➰'],
            swipe: ['💨', '🌪️', '〰️']
        };

        // Particle physics settings
        this.physics = {
            gravity: 0.1,
            friction: 0.98,
            windX: 0.02,
            windVariance: 0.1,
            buoyancy: -0.2,
            rotationSpeed: 0.05
        };

        this.init();
    }

    init() {
        console.log('🎉 Initializing Stream Emoji Reactions...');
        
        // Create particle container
        this.createParticleContainer();
        
        // Initialize particle pool
        this.initializeParticlePool();
        
        // Setup interaction listeners
        this.setupInteractionListeners();
        
        // Start animation loop
        this.startAnimationLoop();
        
        // Listen for character behavior updates
        this.listenForBehaviorUpdates();
        
        console.log('✅ Emoji reactions ready to fly!');
    }

    createParticleContainer() {
        this.container = document.createElement('div');
        this.container.id = 'emoji-particle-container';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
            overflow: hidden;
        `;
        
        document.body.appendChild(this.container);
    }

    initializeParticlePool() {
        // Pre-create particles for performance
        for (let i = 0; i < this.maxParticles; i++) {
            const particle = this.createParticle();
            particle.style.display = 'none';
            this.particlePool.push(particle);
        }
    }

    createParticle() {
        const particle = document.createElement('div');
        particle.className = 'emoji-particle';
        particle.style.cssText = `
            position: absolute;
            font-size: 24px;
            user-select: none;
            pointer-events: none;
            will-change: transform;
            transition: opacity 0.3s ease;
        `;
        
        this.container.appendChild(particle);
        return particle;
    }

    getParticle() {
        // Get from pool or create new
        let particle = this.particlePool.find(p => p.style.display === 'none');
        
        if (!particle && this.container.children.length < this.maxParticles) {
            particle = this.createParticle();
            this.particlePool.push(particle);
        }
        
        return particle;
    }

    releaseParticle(particle) {
        particle.style.display = 'none';
        particle.style.opacity = '0';
        
        // Reset any custom styles
        particle.style.transform = '';
        particle.classList.remove('emoji-glow', 'emoji-pulse', 'emoji-spin');
    }

    emitEmoji(options) {
        const {
            emoji,
            x,
            y,
            domain = null,
            velocity = { x: 0, y: -2 },
            lifespan = 3000,
            size = 24,
            animation = 'float'
        } = options;

        const particle = this.getParticle();
        if (!particle) return;

        const id = this.particleId++;
        
        const particleData = {
            id,
            element: particle,
            emoji,
            position: { x, y },
            velocity,
            acceleration: { x: 0, y: 0 },
            rotation: 0,
            opacity: 1,
            scale: 1,
            lifespan,
            maxLife: lifespan,
            born: Date.now(),
            domain,
            animation
        };

        // Set initial state
        particle.textContent = emoji;
        particle.style.display = 'block';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.fontSize = size + 'px';
        particle.style.opacity = '1';
        particle.style.transform = `scale(${particleData.scale}) rotate(${particleData.rotation}deg)`;

        // Add animation class
        this.applyAnimation(particle, animation);

        // Store particle data
        this.activeParticles.set(id, particleData);

        return id;
    }

    applyAnimation(particle, animation) {
        particle.classList.remove('emoji-glow', 'emoji-pulse', 'emoji-spin', 'emoji-shake');
        
        switch (animation) {
            case 'glow':
                particle.classList.add('emoji-glow');
                break;
            case 'pulse':
                particle.classList.add('emoji-pulse');
                break;
            case 'spin':
                particle.classList.add('emoji-spin');
                break;
            case 'shake':
                particle.classList.add('emoji-shake');
                break;
        }
    }

    emitBurst(options) {
        const {
            x,
            y,
            count = 5,
            emojis,
            spread = 50,
            domain = null,
            animation = 'float'
        } = options;

        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = 2 + Math.random() * 2;
            
            this.emitEmoji({
                emoji: emojis[Math.floor(Math.random() * emojis.length)],
                x: x + Math.cos(angle) * spread * 0.2,
                y: y + Math.sin(angle) * spread * 0.2,
                velocity: {
                    x: Math.cos(angle) * speed,
                    y: Math.sin(angle) * speed - 2
                },
                domain,
                animation,
                size: 18 + Math.random() * 12
            });
        }
    }

    updateParticles() {
        const now = Date.now();
        
        this.activeParticles.forEach((particle, id) => {
            const age = now - particle.born;
            const lifeRatio = age / particle.maxLife;
            
            if (age > particle.lifespan) {
                // Remove dead particles
                this.releaseParticle(particle.element);
                this.activeParticles.delete(id);
                return;
            }

            // Update physics
            this.updateParticlePhysics(particle, lifeRatio);
            
            // Update visual state
            this.updateParticleVisuals(particle, lifeRatio);
        });
    }

    updateParticlePhysics(particle, lifeRatio) {
        // Apply forces
        particle.acceleration.y = this.physics.gravity;
        particle.acceleration.x = this.physics.windX + (Math.random() - 0.5) * this.physics.windVariance;
        
        // Buoyancy increases over time
        particle.acceleration.y += this.physics.buoyancy * lifeRatio;
        
        // Update velocity
        particle.velocity.x += particle.acceleration.x;
        particle.velocity.y += particle.acceleration.y;
        
        // Apply friction
        particle.velocity.x *= this.physics.friction;
        particle.velocity.y *= this.physics.friction;
        
        // Update position
        particle.position.x += particle.velocity.x;
        particle.position.y += particle.velocity.y;
        
        // Update rotation
        particle.rotation += this.physics.rotationSpeed * particle.velocity.x;
    }

    updateParticleVisuals(particle, lifeRatio) {
        const element = particle.element;
        
        // Fade out in last 20% of life
        if (lifeRatio > 0.8) {
            particle.opacity = 1 - ((lifeRatio - 0.8) / 0.2);
        }
        
        // Scale based on life
        particle.scale = 1 + Math.sin(lifeRatio * Math.PI) * 0.2;
        
        // Apply transforms
        element.style.transform = `
            translate(${particle.position.x}px, ${particle.position.y}px)
            scale(${particle.scale})
            rotate(${particle.rotation}deg)
        `;
        element.style.opacity = particle.opacity;
    }

    setupInteractionListeners() {
        // Hover reactions
        document.addEventListener('mouseover', (e) => {
            const streamBox = e.target.closest('.stream-box');
            if (streamBox) {
                const domain = streamBox.dataset.domain;
                const rect = streamBox.getBoundingClientRect();
                
                this.triggerDomainReaction(domain, 'hover', {
                    x: rect.left + rect.width / 2,
                    y: rect.top
                });
            }
        });

        // Click reactions
        document.addEventListener('click', (e) => {
            const streamBox = e.target.closest('.stream-box');
            if (streamBox) {
                const domain = streamBox.dataset.domain;
                const rect = e.target.getBoundingClientRect();
                
                this.triggerDomainReaction(domain, 'click', {
                    x: e.clientX,
                    y: e.clientY
                });
            }
        });

        // Stream focus reactions
        document.addEventListener('focusStream', (e) => {
            const { domain } = e.detail;
            const streamBox = document.querySelector(`[data-domain="${domain}"]`);
            
            if (streamBox) {
                const rect = streamBox.getBoundingClientRect();
                this.triggerDomainReaction(domain, 'focus', {
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2
                });
            }
        });
    }

    triggerDomainReaction(domain, interaction, position) {
        const domainEmojis = this.domainEmojis[domain];
        if (!domainEmojis) return;

        let emojis;
        let animation = 'float';
        let count = 3;

        switch (interaction) {
            case 'hover':
                emojis = domainEmojis.calm;
                animation = 'glow';
                count = 2;
                break;
            case 'click':
                emojis = domainEmojis.excited;
                animation = 'pulse';
                count = 5;
                break;
            case 'focus':
                emojis = domainEmojis.base;
                animation = 'spin';
                count = 8;
                break;
            default:
                emojis = domainEmojis.base;
        }

        this.emitBurst({
            x: position.x,
            y: position.y,
            count,
            emojis,
            domain,
            animation,
            spread: 30
        });
    }

    listenForBehaviorUpdates() {
        // Listen for character behavior changes
        document.addEventListener('behaviorChange', (e) => {
            const { type, value } = e.detail;
            
            if (type === 'attention') {
                this.adjustReactionIntensity(value);
            }
        });

        // Listen for character updates
        document.addEventListener('characterUpdate', (e) => {
            const { domain, character } = e.detail;
            
            if (character.behaviorModifiers) {
                this.updateDomainReactions(domain, character.behaviorModifiers);
            }
        });
    }

    adjustReactionIntensity(attentionPattern) {
        switch (attentionPattern) {
            case 'hyperfocus':
                this.physics.gravity = 0.05;
                this.physics.windX = 0.01;
                break;
            case 'scattered':
                this.physics.gravity = 0.2;
                this.physics.windX = 0.1;
                break;
            case 'fidgety':
                this.physics.gravity = 0.15;
                this.physics.windX = 0.05;
                this.physics.windVariance = 0.2;
                break;
            default:
                this.physics.gravity = 0.1;
                this.physics.windX = 0.02;
        }
    }

    updateDomainReactions(domain, modifiers) {
        // Queue automatic reactions based on character state
        if (modifiers.particleCount > 0 && Math.random() < modifiers.restlessness) {
            const streamBox = document.querySelector(`[data-domain="${domain}"]`);
            if (streamBox) {
                const rect = streamBox.getBoundingClientRect();
                const domainEmojis = this.domainEmojis[domain];
                
                this.emitEmoji({
                    emoji: domainEmojis.base[Math.floor(Math.random() * domainEmojis.base.length)],
                    x: rect.left + Math.random() * rect.width,
                    y: rect.top + rect.height,
                    velocity: {
                        x: (Math.random() - 0.5) * 2,
                        y: -1 - Math.random() * 2
                    },
                    domain,
                    animation: 'glow',
                    size: 16 + modifiers.particleCount
                });
            }
        }
    }

    startAnimationLoop() {
        const animate = () => {
            this.updateParticles();
            requestAnimationFrame(animate);
        };
        
        requestAnimationFrame(animate);
    }

    // Public API
    celebrate(domain) {
        const streamBox = document.querySelector(`[data-domain="${domain}"]`);
        if (!streamBox) return;

        const rect = streamBox.getBoundingClientRect();
        const domainEmojis = this.domainEmojis[domain];

        // Big celebration burst
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                this.emitBurst({
                    x: rect.left + rect.width / 2 + (Math.random() - 0.5) * 100,
                    y: rect.top + rect.height / 2,
                    count: 10,
                    emojis: [...domainEmojis.excited, ...domainEmojis.victory || []],
                    domain,
                    animation: 'spin',
                    spread: 100
                });
            }, i * 200);
        }
    }

    rain(emojis, intensity = 'medium') {
        const speeds = { light: 5000, medium: 2000, heavy: 500 };
        const interval = speeds[intensity] || 2000;

        const rainInterval = setInterval(() => {
            this.emitEmoji({
                emoji: emojis[Math.floor(Math.random() * emojis.length)],
                x: Math.random() * window.innerWidth,
                y: -50,
                velocity: {
                    x: (Math.random() - 0.5) * 0.5,
                    y: 2 + Math.random() * 2
                },
                lifespan: 10000,
                animation: 'glow'
            });
        }, interval / 10);

        // Return stop function
        return () => clearInterval(rainInterval);
    }

    clear() {
        this.activeParticles.forEach((particle) => {
            this.releaseParticle(particle.element);
        });
        this.activeParticles.clear();
    }

    destroy() {
        this.clear();
        this.container.remove();
    }
}

// Add required CSS animations
const style = document.createElement('style');
style.textContent = `
    .emoji-glow {
        filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.8));
    }
    
    .emoji-pulse {
        animation: emojiPulse 1s ease-in-out infinite;
    }
    
    .emoji-spin {
        animation: emojiSpin 2s linear infinite;
    }
    
    .emoji-shake {
        animation: emojiShake 0.5s ease-in-out infinite;
    }
    
    @keyframes emojiPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.2); }
    }
    
    @keyframes emojiSpin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    
    @keyframes emojiShake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StreamEmojiReactions;
} else {
    window.StreamEmojiReactions = StreamEmojiReactions;
}

console.log('🎉✨💫 Stream Emoji Reactions loaded - Let the emotions fly!');