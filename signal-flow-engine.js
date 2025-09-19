/**
 * ⚡ Signal Flow Engine
 * Manages and visualizes signal/data flow through hardware components
 */

import * as THREE from 'three';

export class SignalFlowEngine {
    constructor(scene, lights) {
        this.scene = scene;
        this.lights = lights;
        this.group = new THREE.Group();
        this.scene.add(this.group);
        
        this.particles = [];
        this.signals = [];
        this.flows = new Map();
        
        // Signal configurations
        this.signalConfig = {
            network: {
                color: 0x00ffff,
                speed: 50,
                size: 2,
                trail: true
            },
            pcb: {
                color: 0xffaa00,
                speed: 30,
                size: 1.5,
                trail: true
            },
            fpga: {
                color: 0x00ff00,
                speed: 100,
                size: 1,
                trail: false
            },
            game: {
                color: 0xff00ff,
                speed: 40,
                size: 3,
                trail: true
            }
        };
        
        // Particle system
        this.initParticleSystem();
        
        // Signal state
        this.powerLevel = 1.0;
        this.signalStrength = 1.0;
    }
    
    initParticleSystem() {
        // Create particle geometry
        const particleCount = 1000;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = 0;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = 0;
            
            colors[i * 3] = 1;
            colors[i * 3 + 1] = 1;
            colors[i * 3 + 2] = 1;
            
            sizes[i] = 0;
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Particle material with custom shader
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                pixelRatio: { value: window.devicePixelRatio }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                uniform float pixelRatio;
                
                void main() {
                    vColor = color;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * pixelRatio * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                uniform float time;
                
                void main() {
                    vec2 center = gl_PointCoord - vec2(0.5);
                    float dist = length(center);
                    
                    if (dist > 0.5) discard;
                    
                    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
                    alpha *= 0.8 + 0.2 * sin(time * 3.0);
                    
                    gl_FragColor = vec4(vColor, alpha);
                }
            `,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            transparent: true,
            vertexColors: true
        });
        
        this.particleSystem = new THREE.Points(geometry, material);
        this.group.add(this.particleSystem);
        
        // Initialize particle pool
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                index: i,
                active: false,
                position: new THREE.Vector3(),
                velocity: new THREE.Vector3(),
                target: null,
                path: [],
                pathIndex: 0,
                life: 0,
                maxLife: 100,
                color: new THREE.Color(),
                size: 1,
                type: 'network'
            });
        }
    }
    
    startNetworkFlow(topology) {
        // Clear existing flows
        this.clearFlows();
        
        // Create flows between connected nodes
        topology.connections.forEach((conn) => {
            const flow = {
                from: conn.from,
                to: conn.to,
                path: this.generateNetworkPath(conn),
                type: 'network',
                active: true,
                particles: []
            };
            
            this.flows.set(`${conn.from}-${conn.to}`, flow);
            
            // Start particle emission
            this.startParticleEmission(flow);
        });
    }
    
    generateNetworkPath(connection) {
        // For network, path is direct line between nodes
        // In real implementation, would calculate from actual node positions
        const path = [];
        const steps = 50;
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            path.push(new THREE.Vector3(
                Math.random() * 200 - 100,
                20 + Math.sin(t * Math.PI) * 10,
                Math.random() * 200 - 100
            ));
        }
        
        return path;
    }
    
    startPCBFlow(layout) {
        this.clearFlows();
        
        // Create flows along traces
        layout.traces.forEach((trace, index) => {
            const flow = {
                from: trace.from,
                to: trace.to,
                path: this.generatePCBPath(trace),
                type: 'pcb',
                active: true,
                particles: []
            };
            
            this.flows.set(`trace-${index}`, flow);
            this.startParticleEmission(flow);
        });
    }
    
    generatePCBPath(trace) {
        const path = [];
        const steps = 30;
        
        const start = new THREE.Vector3(trace.from[0], 2, trace.from[1]);
        const end = new THREE.Vector3(trace.to[0], 2, trace.to[1]);
        
        // Create path with PCB routing style
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            
            if (t < 0.3) {
                // First segment - straight from start
                path.push(new THREE.Vector3(
                    start.x,
                    2,
                    start.z + (end.z - start.z) * (t / 0.3) * 0.3
                ));
            } else if (t < 0.7) {
                // Middle segment - diagonal
                const localT = (t - 0.3) / 0.4;
                path.push(new THREE.Vector3(
                    start.x + (end.x - start.x) * localT,
                    2,
                    start.z + (end.z - start.z) * 0.3 + (end.z - start.z) * 0.4 * localT
                ));
            } else {
                // Final segment - straight to end
                const localT = (t - 0.7) / 0.3;
                path.push(new THREE.Vector3(
                    end.x,
                    2,
                    start.z + (end.z - start.z) * 0.7 + (end.z - start.z) * 0.3 * localT
                ));
            }
        }
        
        return path;
    }
    
    startFPGAFlow(config) {
        this.clearFlows();
        
        // Create flows along routing channels
        config.routing.forEach((route, index) => {
            const flow = {
                from: route.from,
                to: route.to,
                path: this.generateFPGAPath(route),
                type: 'fpga',
                active: true,
                particles: []
            };
            
            this.flows.set(`route-${index}`, flow);
            this.startParticleEmission(flow);
        });
    }
    
    generateFPGAPath(route) {
        const path = [];
        const steps = 40;
        const cellSize = 20;
        
        const start = new THREE.Vector3(
            (route.from[0] - 5) * cellSize,
            2,
            (route.from[1] - 5) * cellSize
        );
        const end = new THREE.Vector3(
            (route.to[0] - 5) * cellSize,
            2,
            (route.to[1] - 5) * cellSize
        );
        
        // Manhattan routing for FPGA
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            
            if (t < 0.5) {
                // Move horizontally first
                path.push(new THREE.Vector3(
                    start.x + (end.x - start.x) * (t * 2),
                    2,
                    start.z
                ));
            } else {
                // Then move vertically
                path.push(new THREE.Vector3(
                    end.x,
                    2,
                    start.z + (end.z - start.z) * ((t - 0.5) * 2)
                ));
            }
        }
        
        return path;
    }
    
    startParticleEmission(flow) {
        const config = this.signalConfig[flow.type];
        
        setInterval(() => {
            if (!flow.active) return;
            
            const particle = this.getInactiveParticle();
            if (!particle) return;
            
            // Initialize particle
            particle.active = true;
            particle.type = flow.type;
            particle.path = flow.path;
            particle.pathIndex = 0;
            particle.life = 0;
            particle.maxLife = flow.path.length;
            particle.color.setHex(config.color);
            particle.size = config.size * this.signalStrength;
            
            if (flow.path.length > 0) {
                particle.position.copy(flow.path[0]);
            }
            
            flow.particles.push(particle);
        }, 100 / this.powerLevel);
    }
    
    getInactiveParticle() {
        return this.particles.find(p => !p.active);
    }
    
    enhanceForGame(progress) {
        // Transform signals into game particles
        this.particles.forEach((particle) => {
            if (particle.active) {
                // Increase size for game visibility
                particle.size *= (1 + progress);
                
                // Add rainbow colors
                const hue = (Date.now() * 0.001 + particle.index * 0.01) % 1;
                particle.color.setHSL(hue, 1, 0.5 + progress * 0.3);
                
                // Add vertical oscillation
                particle.position.y += Math.sin(Date.now() * 0.005 + particle.index) * progress * 2;
            }
        });
    }
    
    update(deltaTime, elapsedTime) {
        // Update shader uniforms
        this.particleSystem.material.uniforms.time.value = elapsedTime;
        
        // Update particles
        const positions = this.particleSystem.geometry.attributes.position.array;
        const colors = this.particleSystem.geometry.attributes.color.array;
        const sizes = this.particleSystem.geometry.attributes.size.array;
        
        this.particles.forEach((particle) => {
            if (!particle.active) return;
            
            // Move along path
            if (particle.path && particle.pathIndex < particle.path.length - 1) {
                particle.pathIndex += deltaTime * this.signalConfig[particle.type].speed * this.powerLevel;
                
                const index = Math.floor(particle.pathIndex);
                const t = particle.pathIndex - index;
                
                if (index < particle.path.length - 1) {
                    // Interpolate between path points
                    particle.position.lerpVectors(
                        particle.path[index],
                        particle.path[index + 1],
                        t
                    );
                }
            }
            
            // Update life
            particle.life += deltaTime;
            
            // Check if particle should die
            if (particle.pathIndex >= particle.path.length - 1 || particle.life > particle.maxLife) {
                particle.active = false;
                particle.size = 0;
            }
            
            // Update buffer data
            const i = particle.index;
            positions[i * 3] = particle.position.x;
            positions[i * 3 + 1] = particle.position.y;
            positions[i * 3 + 2] = particle.position.z;
            
            colors[i * 3] = particle.color.r;
            colors[i * 3 + 1] = particle.color.g;
            colors[i * 3 + 2] = particle.color.b;
            
            sizes[i] = particle.active ? particle.size : 0;
        });
        
        // Update geometry
        this.particleSystem.geometry.attributes.position.needsUpdate = true;
        this.particleSystem.geometry.attributes.color.needsUpdate = true;
        this.particleSystem.geometry.attributes.size.needsUpdate = true;
        
        // Update signal lights
        this.updateSignalLights();
    }
    
    updateSignalLights() {
        let lightIndex = 0;
        
        this.flows.forEach((flow) => {
            if (lightIndex >= this.lights.length) return;
            
            // Position lights at active particle positions
            flow.particles.forEach((particle) => {
                if (particle.active && lightIndex < this.lights.length) {
                    const light = this.lights[lightIndex];
                    light.position.copy(particle.position);
                    light.color.copy(particle.color);
                    light.intensity = particle.size * 0.5 * this.signalStrength;
                    lightIndex++;
                }
            });
        });
        
        // Turn off unused lights
        for (let i = lightIndex; i < this.lights.length; i++) {
            this.lights[i].intensity = 0;
        }
    }
    
    clearFlows() {
        this.flows.clear();
        this.particles.forEach(p => {
            p.active = false;
            p.size = 0;
        });
    }
    
    setPowerLevel(level) {
        this.powerLevel = Math.max(0.1, Math.min(2, level));
    }
    
    setSignalStrength(strength) {
        this.signalStrength = Math.max(0.1, Math.min(2, strength));
    }
}