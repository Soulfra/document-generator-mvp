/**
 * 🔌 PCB Layout Renderer
 * Renders printed circuit board layouts with components and traces
 */

import * as THREE from 'three';

export class PCBLayoutRenderer {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.scene.add(this.group);
        
        this.board = null;
        this.components = new Map();
        this.traces = [];
        this.visible = false;
        
        // Component configurations
        this.componentConfigs = {
            cpu: {
                color: 0x333333,
                metallic: true,
                height: 3,
                createGeometry: (size) => new THREE.BoxGeometry(size[0], 3, size[1])
            },
            memory: {
                color: 0x222222,
                metallic: true,
                height: 2,
                createGeometry: (size) => new THREE.BoxGeometry(size[0], 2, size[1])
            },
            capacitor: {
                color: 0x4444ff,
                metallic: false,
                height: 4,
                createGeometry: (size) => new THREE.CylinderGeometry(size[0] / 2, size[0] / 2, 4)
            },
            resistor: {
                color: 0x8b4513,
                metallic: false,
                height: 1,
                createGeometry: (size) => new THREE.BoxGeometry(size[0], 1, size[1])
            },
            connector: {
                color: 0xaaaaaa,
                metallic: true,
                height: 5,
                createGeometry: (size) => new THREE.BoxGeometry(size[0], 5, size[1])
            }
        };
        
        this.group.visible = false;
    }
    
    createPCBLayout(layout) {
        this.clear();
        
        // Create PCB board
        this.createBoard(layout.board);
        
        // Create components
        layout.components.forEach((compData, index) => {
            this.createComponent(compData, index);
        });
        
        // Create traces
        layout.traces.forEach((traceData, index) => {
            this.createTrace(traceData, index);
        });
        
        // Create solder mask pattern
        this.createSolderMask();
        
        // Add silk screen labels
        this.addSilkScreen();
    }
    
    createBoard(boardData) {
        // Main board
        const boardGeometry = new THREE.BoxGeometry(
            boardData.width,
            2,
            boardData.height
        );
        
        const boardMaterial = new THREE.MeshPhongMaterial({
            color: boardData.color || 0x1a4d1a,
            metalness: 0.3,
            roughness: 0.7
        });
        
        this.board = new THREE.Mesh(boardGeometry, boardMaterial);
        this.board.position.y = -1;
        this.board.receiveShadow = true;
        this.board.castShadow = true;
        
        // Add copper layer texture
        const copperLayer = new THREE.Mesh(
            new THREE.BoxGeometry(boardData.width - 2, 0.1, boardData.height - 2),
            new THREE.MeshPhongMaterial({
                color: 0xb87333,
                metalness: 0.9,
                roughness: 0.2,
                emissive: 0xb87333,
                emissiveIntensity: 0.1
            })
        );
        copperLayer.position.y = 1.1;
        this.board.add(copperLayer);
        
        this.group.add(this.board);
        
        // Add mounting holes
        this.addMountingHoles(boardData);
    }
    
    addMountingHoles(boardData) {
        const holePositions = [
            [-boardData.width / 2 + 10, -boardData.height / 2 + 10],
            [boardData.width / 2 - 10, -boardData.height / 2 + 10],
            [-boardData.width / 2 + 10, boardData.height / 2 - 10],
            [boardData.width / 2 - 10, boardData.height / 2 - 10]
        ];
        
        holePositions.forEach(pos => {
            const hole = new THREE.Mesh(
                new THREE.CylinderGeometry(3, 3, 3),
                new THREE.MeshPhongMaterial({
                    color: 0x444444,
                    metalness: 0.9
                })
            );
            hole.position.set(pos[0], 1, pos[1]);
            hole.rotation.x = Math.PI / 2;
            this.board.add(hole);
        });
    }
    
    createComponent(compData, index) {
        const config = this.componentConfigs[compData.type];
        if (!config) return;
        
        // Create component mesh
        const geometry = config.createGeometry(compData.size);
        const material = new THREE.MeshPhongMaterial({
            color: config.color,
            metalness: config.metallic ? 0.8 : 0.2,
            roughness: config.metallic ? 0.2 : 0.6,
            emissive: config.color,
            emissiveIntensity: 0.1
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(compData.position[0], config.height / 2 + 2, compData.position[1]);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Add user data
        mesh.userData = {
            type: 'pcb-component',
            componentType: compData.type,
            index: index
        };
        
        // Add pins if specified
        if (compData.pins) {
            this.addPins(mesh, compData);
        }
        
        // Add component label
        this.addComponentLabel(mesh, compData.type.toUpperCase());
        
        this.components.set(index, {
            mesh,
            data: compData
        });
        
        this.group.add(mesh);
    }
    
    addPins(component, compData) {
        const pinGeometry = new THREE.CylinderGeometry(0.5, 0.5, 5);
        const pinMaterial = new THREE.MeshPhongMaterial({
            color: 0xcccccc,
            metalness: 0.9,
            roughness: 0.1
        });
        
        if (compData.pins && compData.pins > 0) {
            const pinsPerSide = Math.ceil(compData.pins / 4);
            const spacing = compData.size[0] / (pinsPerSide + 1);
            
            for (let i = 0; i < pinsPerSide; i++) {
                // Top row
                const pin1 = new THREE.Mesh(pinGeometry, pinMaterial);
                pin1.position.set(
                    -compData.size[0] / 2 + spacing * (i + 1),
                    -2,
                    compData.size[1] / 2
                );
                component.add(pin1);
                
                // Bottom row
                const pin2 = new THREE.Mesh(pinGeometry, pinMaterial);
                pin2.position.set(
                    -compData.size[0] / 2 + spacing * (i + 1),
                    -2,
                    -compData.size[1] / 2
                );
                component.add(pin2);
            }
        }
    }
    
    addComponentLabel(component, label) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 32;
        const context = canvas.getContext('2d');
        
        context.fillStyle = 'white';
        context.font = '20px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(label, 64, 16);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true
        });
        
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(20, 5, 1);
        sprite.position.y = 5;
        
        component.add(sprite);
    }
    
    createTrace(traceData, index) {
        const points = [];
        
        // Create path from start to end
        const start = new THREE.Vector3(traceData.from[0], 0.2, traceData.from[1]);
        const end = new THREE.Vector3(traceData.to[0], 0.2, traceData.to[1]);
        
        // Add intermediate points for more realistic routing
        const mid1 = new THREE.Vector3(
            start.x,
            0.2,
            start.z + (end.z - start.z) * 0.3
        );
        const mid2 = new THREE.Vector3(
            end.x,
            0.2,
            start.z + (end.z - start.z) * 0.7
        );
        
        points.push(start, mid1, mid2, end);
        
        // Create trace geometry
        const curve = new THREE.CatmullRomCurve3(points);
        const tubeGeometry = new THREE.TubeGeometry(
            curve,
            20,
            traceData.width || 0.5,
            8,
            false
        );
        
        const traceMaterial = new THREE.MeshPhongMaterial({
            color: 0xffaa00,
            metalness: 0.9,
            roughness: 0.1,
            emissive: 0xff6600,
            emissiveIntensity: 0.2
        });
        
        const trace = new THREE.Mesh(tubeGeometry, traceMaterial);
        trace.castShadow = true;
        
        // Different layer heights
        if (traceData.layer === 1) {
            trace.position.y = -0.5;
            trace.material.color.setHex(0x00aaff);
        }
        
        this.traces.push({
            mesh: trace,
            data: traceData
        });
        
        this.group.add(trace);
    }
    
    createSolderMask() {
        // Create solder mask pattern
        const maskGeometry = new THREE.PlaneGeometry(200, 150, 50, 50);
        const maskMaterial = new THREE.MeshPhongMaterial({
            color: 0x0a3d0a,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        
        const mask = new THREE.Mesh(maskGeometry, maskMaterial);
        mask.rotation.x = -Math.PI / 2;
        mask.position.y = 1.2;
        
        // Add holes for components
        // In a real implementation, this would cut out areas for pads
        
        this.group.add(mask);
    }
    
    addSilkScreen() {
        // Add PCB markings and labels
        const canvas = document.createElement('canvas');
        canvas.width = 1024;
        canvas.height = 768;
        const context = canvas.getContext('2d');
        
        // Draw silk screen elements
        context.strokeStyle = 'white';
        context.lineWidth = 2;
        context.font = '24px Arial';
        context.fillStyle = 'white';
        
        // Board name
        context.fillText('HARDWARE RENDERER v1.0', 50, 50);
        
        // Component outlines and labels
        context.strokeRect(400, 300, 200, 200); // CPU outline
        context.fillText('CPU', 480, 400);
        
        // Create texture
        const texture = new THREE.CanvasTexture(canvas);
        const silkMaterial = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true,
            opacity: 0.7
        });
        
        const silkScreen = new THREE.Mesh(
            new THREE.PlaneGeometry(200, 150),
            silkMaterial
        );
        silkScreen.rotation.x = -Math.PI / 2;
        silkScreen.position.y = 1.3;
        
        this.group.add(silkScreen);
    }
    
    morphToFPGA(progress) {
        // Morph components into FPGA blocks
        this.components.forEach((comp) => {
            const mesh = comp.mesh;
            
            // Change shape towards cubes
            const targetScale = 1 + progress * 0.5;
            mesh.scale.y = targetScale;
            
            // Change color to FPGA block colors
            const fpgaColor = new THREE.Color(0x0066cc);
            mesh.material.color.lerp(fpgaColor, progress);
            
            // Add grid snapping effect
            const gridSize = 20;
            const snappedX = Math.round(mesh.position.x / gridSize) * gridSize;
            const snappedZ = Math.round(mesh.position.z / gridSize) * gridSize;
            
            mesh.position.x = mesh.position.x * (1 - progress) + snappedX * progress;
            mesh.position.z = mesh.position.z * (1 - progress) + snappedZ * progress;
        });
        
        // Transform traces into routing channels
        this.traces.forEach((trace) => {
            trace.mesh.material.opacity = 1 - progress * 0.5;
            trace.mesh.material.emissiveIntensity = 0.2 + progress * 0.3;
        });
    }
    
    transformToEnergyPaths(progress) {
        // Transform traces into glowing energy paths
        this.traces.forEach((trace, index) => {
            const mesh = trace.mesh;
            
            // Enhance glow
            mesh.material.emissiveIntensity = 0.2 + progress * 0.8;
            
            // Add pulsing
            const pulse = Math.sin(Date.now() * 0.003 + index) * 0.5 + 0.5;
            mesh.material.emissive.setHSL(
                0.1 + pulse * 0.2,
                1,
                0.5
            );
            
            // Increase trace width
            mesh.scale.setScalar(1 + progress * pulse);
        });
        
        // Transform components into energy nodes
        this.components.forEach((comp) => {
            const mesh = comp.mesh;
            
            // Add glow
            mesh.material.emissiveIntensity = progress * 0.5;
            
            // Float components
            mesh.position.y += Math.sin(Date.now() * 0.002) * progress * 2;
        });
    }
    
    update(deltaTime, elapsedTime) {
        if (!this.visible) return;
        
        // Animate traces with energy flow
        this.traces.forEach((trace, index) => {
            // Pulsing glow
            const pulse = Math.sin(elapsedTime * 2 + index) * 0.2 + 0.8;
            trace.mesh.material.emissiveIntensity = 0.2 * pulse;
        });
        
        // Animate components
        this.components.forEach((comp) => {
            // Heat simulation
            if (comp.data.type === 'cpu') {
                const heat = Math.sin(elapsedTime * 3) * 0.1 + 0.9;
                comp.mesh.material.emissive.setRGB(heat, heat * 0.3, 0);
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
        this.components.clear();
        this.traces = [];
        this.board = null;
    }
    
    hide() {
        this.visible = false;
        this.group.visible = false;
    }
    
    show() {
        this.visible = true;
        this.group.visible = true;
    }
    
    isVisible() {
        return this.visible;
    }
}