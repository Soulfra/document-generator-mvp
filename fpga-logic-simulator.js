/**
 * 🔲 FPGA Logic Simulator
 * Simulates and visualizes FPGA logic blocks and routing
 */

import * as THREE from 'three';

export class FPGALogicSimulator {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.scene.add(this.group);
        
        this.blocks = new Map();
        this.routing = [];
        this.signals = new Map();
        this.visible = false;
        
        // FPGA block types
        this.blockTypes = {
            logic: {
                color: 0x0066cc,
                emissive: 0x003366,
                size: [10, 8, 10],
                pins: 4
            },
            memory: {
                color: 0xcc6600,
                emissive: 0x663300,
                size: [15, 10, 15],
                pins: 8
            },
            dsp: {
                color: 0xcc00cc,
                emissive: 0x660066,
                size: [20, 12, 20],
                pins: 12
            },
            io: {
                color: 0x00cc00,
                emissive: 0x006600,
                size: [8, 6, 8],
                pins: 2
            }
        };
        
        // Logic functions
        this.logicFunctions = {
            AND: (a, b) => a && b,
            OR: (a, b) => a || b,
            XOR: (a, b) => a !== b,
            NOT: (a) => !a,
            NAND: (a, b) => !(a && b),
            NOR: (a, b) => !(a || b)
        };
        
        // Simulation state
        this.simulationRunning = false;
        this.clockSignal = false;
        this.clockSpeed = 1000; // Hz
        
        this.group.visible = false;
    }
    
    createFPGALayout(config) {
        this.clear();
        
        // Create FPGA grid
        this.createGrid(config.dimensions);
        
        // Create logic blocks
        config.blocks.forEach((blockData, index) => {
            this.createBlock(blockData, index);
        });
        
        // Create routing
        config.routing.forEach((routeData, index) => {
            this.createRoute(routeData, index);
        });
        
        // Initialize signals
        this.initializeSignals();
    }
    
    createGrid(dimensions) {
        const cellSize = 20;
        const width = dimensions.x * cellSize;
        const height = dimensions.y * cellSize;
        
        // Create base grid
        const gridGeometry = new THREE.PlaneGeometry(width, height, dimensions.x, dimensions.y);
        const gridMaterial = new THREE.MeshPhongMaterial({
            color: 0x001122,
            emissive: 0x000511,
            emissiveIntensity: 0.2,
            wireframe: true
        });
        
        const grid = new THREE.Mesh(gridGeometry, gridMaterial);
        grid.rotation.x = -Math.PI / 2;
        grid.position.y = -5;
        
        this.group.add(grid);
        
        // Add grid lines
        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0x004488,
            transparent: true,
            opacity: 0.5
        });
        
        // Vertical lines
        for (let i = 0; i <= dimensions.x; i++) {
            const points = [
                new THREE.Vector3(i * cellSize - width / 2, -4.9, -height / 2),
                new THREE.Vector3(i * cellSize - width / 2, -4.9, height / 2)
            ];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, lineMaterial);
            this.group.add(line);
        }
        
        // Horizontal lines
        for (let j = 0; j <= dimensions.y; j++) {
            const points = [
                new THREE.Vector3(-width / 2, -4.9, j * cellSize - height / 2),
                new THREE.Vector3(width / 2, -4.9, j * cellSize - height / 2)
            ];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, lineMaterial);
            this.group.add(line);
        }
    }
    
    createBlock(blockData, index) {
        const config = this.blockTypes[blockData.type];
        if (!config) return;
        
        // Create block mesh
        const geometry = new THREE.BoxGeometry(...config.size);
        const material = new THREE.MeshPhongMaterial({
            color: config.color,
            emissive: config.emissive,
            emissiveIntensity: 0.3,
            metalness: 0.7,
            roughness: 0.3
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        
        // Position on grid
        const cellSize = 20;
        mesh.position.set(
            (blockData.position[0] - 5) * cellSize,
            config.size[1] / 2,
            (blockData.position[1] - 5) * cellSize
        );
        
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Add block details
        this.addBlockDetails(mesh, blockData);
        
        // Store block
        const block = {
            mesh,
            data: blockData,
            inputs: new Map(),
            outputs: new Map(),
            state: false
        };
        
        this.blocks.set(index, block);
        this.group.add(mesh);
        
        // Add function label
        if (blockData.function) {
            this.addFunctionLabel(mesh, blockData.function);
        }
    }
    
    addBlockDetails(mesh, blockData) {
        const config = this.blockTypes[blockData.type];
        
        // Add pins
        const pinGeometry = new THREE.CylinderGeometry(0.5, 0.5, 2);
        const pinMaterial = new THREE.MeshPhongMaterial({
            color: 0xffdd00,
            metalness: 0.9,
            roughness: 0.1
        });
        
        // Input pins (left side)
        for (let i = 0; i < config.pins / 2; i++) {
            const pin = new THREE.Mesh(pinGeometry, pinMaterial);
            pin.position.set(
                -config.size[0] / 2,
                -config.size[1] / 2 + 2 + i * 3,
                0
            );
            pin.rotation.z = Math.PI / 2;
            mesh.add(pin);
        }
        
        // Output pins (right side)
        for (let i = 0; i < config.pins / 2; i++) {
            const pin = new THREE.Mesh(pinGeometry, pinMaterial);
            pin.position.set(
                config.size[0] / 2,
                -config.size[1] / 2 + 2 + i * 3,
                0
            );
            pin.rotation.z = Math.PI / 2;
            mesh.add(pin);
        }
        
        // Add status LED
        const ledGeometry = new THREE.SphereGeometry(1, 8, 6);
        const ledMaterial = new THREE.MeshPhongMaterial({
            color: 0xff0000,
            emissive: 0xff0000,
            emissiveIntensity: 0
        });
        
        const led = new THREE.Mesh(ledGeometry, ledMaterial);
        led.position.y = config.size[1] / 2 + 2;
        led.name = 'statusLED';
        mesh.add(led);
    }
    
    addFunctionLabel(mesh, functionName) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 64;
        const context = canvas.getContext('2d');
        
        context.fillStyle = 'white';
        context.font = 'bold 24px monospace';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(functionName, 64, 32);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true
        });
        
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(20, 10, 1);
        sprite.position.y = 10;
        
        mesh.add(sprite);
    }
    
    createRoute(routeData, index) {
        const cellSize = 20;
        const fromPos = new THREE.Vector3(
            (routeData.from[0] - 5) * cellSize,
            2,
            (routeData.from[1] - 5) * cellSize
        );
        const toPos = new THREE.Vector3(
            (routeData.to[0] - 5) * cellSize,
            2,
            (routeData.to[1] - 5) * cellSize
        );
        
        // Create routing wire with Manhattan routing
        const points = this.getManhattanPath(fromPos, toPos);
        
        const curve = new THREE.CatmullRomCurve3(points);
        const tubeGeometry = new THREE.TubeGeometry(curve, 20, 0.5, 8, false);
        const tubeMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 0.1,
            metalness: 0.8,
            roughness: 0.2
        });
        
        const wire = new THREE.Mesh(tubeGeometry, tubeMaterial);
        wire.castShadow = true;
        
        this.routing.push({
            mesh: wire,
            data: routeData,
            signal: false
        });
        
        this.group.add(wire);
    }
    
    getManhattanPath(from, to) {
        const points = [from.clone()];
        
        // Manhattan routing (right angles only)
        const mid1 = new THREE.Vector3(
            from.x,
            from.y,
            from.z + (to.z - from.z) / 2
        );
        const mid2 = new THREE.Vector3(
            to.x,
            to.y,
            from.z + (to.z - from.z) / 2
        );
        
        points.push(mid1, mid2, to.clone());
        
        return points;
    }
    
    initializeSignals() {
        // Initialize block states
        this.blocks.forEach((block) => {
            if (block.data.type === 'io' && block.data.direction === 'input') {
                block.state = Math.random() > 0.5;
                this.updateBlockVisual(block);
            }
        });
    }
    
    startSimulation() {
        this.simulationRunning = true;
        this.simulateTick();
    }
    
    stopSimulation() {
        this.simulationRunning = false;
    }
    
    simulateTick() {
        if (!this.simulationRunning) return;
        
        // Toggle clock
        this.clockSignal = !this.clockSignal;
        
        // Propagate signals through blocks
        this.blocks.forEach((block) => {
            if (block.data.type === 'logic' && block.data.function) {
                this.evaluateLogicBlock(block);
            } else if (block.data.type === 'memory') {
                this.evaluateMemoryBlock(block);
            } else if (block.data.type === 'dsp') {
                this.evaluateDSPBlock(block);
            }
        });
        
        // Update routing visuals
        this.updateRoutingVisuals();
        
        // Schedule next tick
        setTimeout(() => this.simulateTick(), 1000 / this.clockSpeed);
    }
    
    evaluateLogicBlock(block) {
        const func = this.logicFunctions[block.data.function];
        if (!func) return;
        
        // Get inputs (simplified - just use block state)
        const inputs = [];
        this.routing.forEach((route) => {
            if (route.data.to[0] === block.data.position[0] &&
                route.data.to[1] === block.data.position[1]) {
                inputs.push(route.signal);
            }
        });
        
        // Apply logic function
        let output = false;
        if (inputs.length >= 2) {
            output = func(inputs[0], inputs[1]);
        } else if (inputs.length === 1) {
            output = func(inputs[0]);
        }
        
        block.state = output;
        this.updateBlockVisual(block);
        
        // Propagate output
        this.routing.forEach((route) => {
            if (route.data.from[0] === block.data.position[0] &&
                route.data.from[1] === block.data.position[1]) {
                route.signal = output;
            }
        });
    }
    
    evaluateMemoryBlock(block) {
        // Simple memory simulation - stores state
        if (this.clockSignal) {
            // Read/write on clock edge
            block.state = !block.state; // Toggle for demo
            this.updateBlockVisual(block);
        }
    }
    
    evaluateDSPBlock(block) {
        // DSP simulation - process signals
        block.state = this.clockSignal;
        this.updateBlockVisual(block);
    }
    
    updateBlockVisual(block) {
        const led = block.mesh.getObjectByName('statusLED');
        if (led) {
            led.material.emissiveIntensity = block.state ? 1 : 0;
            led.material.color.setHex(block.state ? 0x00ff00 : 0xff0000);
        }
        
        // Update block glow
        block.mesh.material.emissiveIntensity = block.state ? 0.5 : 0.3;
    }
    
    updateRoutingVisuals() {
        this.routing.forEach((route) => {
            // Update wire color based on signal
            route.mesh.material.emissive.setHex(route.signal ? 0x00ff00 : 0x0000ff);
            route.mesh.material.emissiveIntensity = route.signal ? 0.4 : 0.1;
        });
    }
    
    transformToGameMechanics(progress) {
        this.blocks.forEach((block) => {
            const mesh = block.mesh;
            
            // Transform blocks into game mechanics
            if (block.data.type === 'logic') {
                // Logic gates become puzzle elements
                mesh.rotation.y += progress * Math.PI / 4;
                mesh.scale.setScalar(1 + progress * 0.5);
            } else if (block.data.type === 'memory') {
                // Memory blocks become collectibles
                const bounce = Math.sin(Date.now() * 0.003) * 5 * progress;
                mesh.position.y = block.mesh.geometry.parameters.height / 2 + bounce;
            } else if (block.data.type === 'dsp') {
                // DSP blocks become power-ups
                mesh.rotation.z = progress * Math.PI / 6;
                mesh.material.emissiveIntensity = 0.3 + progress * 0.4;
            }
            
            // Add game colors
            const hue = (Date.now() * 0.0001 + block.data.position[0] * 0.1) % 1;
            const gameColor = new THREE.Color();
            gameColor.setHSL(hue, 0.8, 0.5);
            mesh.material.color.lerp(gameColor, progress * 0.5);
        });
        
        // Transform routing into energy streams
        this.routing.forEach((route, index) => {
            const flow = Math.sin(Date.now() * 0.005 + index) * 0.5 + 0.5;
            route.mesh.scale.setScalar(1 + progress * flow);
            route.mesh.material.emissiveIntensity = 0.1 + progress * 0.5 * flow;
        });
    }
    
    update(deltaTime, elapsedTime) {
        if (!this.visible) return;
        
        // Animate blocks
        this.blocks.forEach((block) => {
            if (block.data.type === 'io') {
                // Pulse I/O blocks
                const pulse = Math.sin(elapsedTime * 4) * 0.1 + 0.9;
                block.mesh.scale.setScalar(pulse);
            }
        });
        
        // Animate signal flow
        this.routing.forEach((route, index) => {
            if (route.signal) {
                // Signal flowing animation
                const flow = (elapsedTime * 2 + index) % 1;
                route.mesh.material.emissiveIntensity = 0.2 + flow * 0.3;
            }
        });
    }
    
    fadeIn(progress) {
        this.group.visible = true;
        this.visible = true;
        
        // Fade in all elements
        this.group.traverse((child) => {
            if (child.material) {
                child.material.opacity = child.material.opacity || 1;
                child.material.transparent = true;
                child.material.opacity *= progress;
            }
        });
    }
    
    clear() {
        this.group.clear();
        this.blocks.clear();
        this.routing = [];
        this.signals.clear();
    }
    
    hide() {
        this.visible = false;
        this.group.visible = false;
        this.stopSimulation();
    }
    
    show() {
        this.visible = true;
        this.group.visible = true;
    }
    
    isVisible() {
        return this.visible;
    }
}