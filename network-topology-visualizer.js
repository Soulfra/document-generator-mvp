/**
 * 🌐 Network Topology Visualizer
 * Renders network nodes and connections as 3D interactive elements
 */

import * as THREE from 'three';

export class NetworkTopologyVisualizer {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.scene.add(this.group);
        
        this.nodes = new Map();
        this.connections = new Map();
        this.visible = true;
        
        // Node type configurations
        this.nodeConfigs = {
            router: {
                geometry: () => new THREE.OctahedronGeometry(8),
                material: { color: 0x0088ff, emissive: 0x004488 },
                icon: '🔄'
            },
            switch: {
                geometry: () => new THREE.BoxGeometry(12, 6, 12),
                material: { color: 0x00ff88, emissive: 0x008844 },
                icon: '🔀'
            },
            server: {
                geometry: () => new THREE.BoxGeometry(8, 16, 8),
                material: { color: 0xff8800, emissive: 0x884400 },
                icon: '🖥️'
            },
            firewall: {
                geometry: () => new THREE.ConeGeometry(10, 15, 4),
                material: { color: 0xff0000, emissive: 0x880000 },
                icon: '🛡️'
            },
            cloud: {
                geometry: () => new THREE.SphereGeometry(15, 16, 12),
                material: { color: 0xffffff, emissive: 0x444444 },
                icon: '☁️'
            }
        };
    }
    
    createTopology(topology) {
        // Clear existing topology
        this.clear();
        
        // Create nodes
        topology.nodes.forEach(nodeData => {
            this.createNode(nodeData);
        });
        
        // Create connections
        topology.connections.forEach(connData => {
            this.createConnection(connData);
        });
        
        // Animate entrance
        this.animateEntrance();
    }
    
    createNode(nodeData) {
        const config = this.nodeConfigs[nodeData.type] || this.nodeConfigs.server;
        
        // Create mesh
        const geometry = config.geometry();
        const material = new THREE.MeshPhongMaterial({
            color: config.material.color,
            emissive: config.material.emissive,
            emissiveIntensity: 0.3,
            metalness: 0.8,
            roughness: 0.2
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(...nodeData.position);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Add user data
        mesh.userData = {
            type: 'network-node',
            nodeType: nodeData.type,
            id: nodeData.id,
            name: nodeData.name
        };
        
        // Create label
        const label = this.createLabel(nodeData.name, config.icon);
        label.position.set(0, 15, 0);
        mesh.add(label);
        
        // Add hover effect
        mesh.scale.set(0, 0, 0);
        
        // Store reference
        this.nodes.set(nodeData.id, {
            mesh,
            data: nodeData,
            connections: []
        });
        
        this.group.add(mesh);
    }
    
    createLabel(text, icon) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const context = canvas.getContext('2d');
        
        // Background
        context.fillStyle = 'rgba(0, 0, 0, 0.8)';
        context.roundRect(0, 0, 256, 64, 10);
        context.fill();
        
        // Text
        context.font = '24px Arial';
        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(icon + ' ' + text, 128, 32);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true
        });
        
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(40, 10, 1);
        
        return sprite;
    }
    
    createConnection(connData) {
        const fromNode = this.nodes.get(connData.from);
        const toNode = this.nodes.get(connData.to);
        
        if (!fromNode || !toNode) return;
        
        // Create connection line
        const points = [
            fromNode.mesh.position,
            toNode.mesh.position
        ];
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: 0x00ffff,
            linewidth: connData.bandwidth / 100,
            transparent: true,
            opacity: 0.6
        });
        
        const line = new THREE.Line(geometry, material);
        
        // Create data flow tube
        const curve = new THREE.CatmullRomCurve3(points);
        const tubeGeometry = new THREE.TubeGeometry(curve, 20, 1, 8, false);
        const tubeMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 0.1,
            transparent: true,
            opacity: 0.3
        });
        
        const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
        tube.castShadow = true;
        
        // Store connection
        const connection = {
            line,
            tube,
            data: connData,
            from: fromNode,
            to: toNode
        };
        
        this.connections.set(`${connData.from}-${connData.to}`, connection);
        
        fromNode.connections.push(connection);
        toNode.connections.push(connection);
        
        this.group.add(line);
        this.group.add(tube);
    }
    
    animateEntrance() {
        let delay = 0;
        
        // Animate nodes
        this.nodes.forEach((node) => {
            setTimeout(() => {
                this.animateScale(node.mesh, { x: 1, y: 1, z: 1 }, 500);
            }, delay);
            delay += 100;
        });
        
        // Animate connections
        setTimeout(() => {
            this.connections.forEach((conn) => {
                conn.line.material.opacity = 0;
                conn.tube.material.opacity = 0;
                
                this.animateOpacity(conn.line.material, 0.6, 500);
                this.animateOpacity(conn.tube.material, 0.3, 500);
            });
        }, delay);
    }
    
    animateScale(object, target, duration) {
        const start = {
            x: object.scale.x,
            y: object.scale.y,
            z: object.scale.z
        };
        
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = this.easeOutElastic(progress);
            
            object.scale.x = start.x + (target.x - start.x) * eased;
            object.scale.y = start.y + (target.y - start.y) * eased;
            object.scale.z = start.z + (target.z - start.z) * eased;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    animateOpacity(material, target, duration) {
        const start = material.opacity;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            material.opacity = start + (target - start) * progress;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }
    
    morphToPCB(progress) {
        const pcbY = 5; // Flatten to PCB height
        
        this.nodes.forEach((node) => {
            // Morph position
            const targetY = pcbY;
            node.mesh.position.y = node.data.position[1] * (1 - progress) + targetY * progress;
            
            // Morph shape
            const scale = 1 - progress * 0.5;
            node.mesh.scale.setScalar(scale);
            
            // Change color
            const color = new THREE.Color();
            color.lerpColors(
                new THREE.Color(this.nodeConfigs[node.data.type].material.color),
                new THREE.Color(0x444444),
                progress
            );
            node.mesh.material.color = color;
        });
        
        // Morph connections into traces
        this.connections.forEach((conn) => {
            conn.tube.material.opacity = 0.3 * (1 - progress);
            conn.line.material.color.lerpColors(
                new THREE.Color(0x00ffff),
                new THREE.Color(0xffaa00),
                progress
            );
        });
    }
    
    transformToGamePlatforms(progress) {
        this.nodes.forEach((node, id) => {
            const mesh = node.mesh;
            
            // Transform into floating platforms
            const platformScale = 2 + progress;
            mesh.scale.setScalar(platformScale);
            
            // Add floating animation
            const floatHeight = Math.sin(Date.now() * 0.001 + id.charCodeAt(0)) * 5 * progress;
            mesh.position.y = node.data.position[1] + floatHeight;
            
            // Add rotation
            mesh.rotation.y += progress * 0.01;
            
            // Change to game colors
            const gameColor = new THREE.Color();
            gameColor.setHSL(
                (Date.now() * 0.0001 + id.charCodeAt(0) * 0.1) % 1,
                0.8,
                0.5
            );
            
            mesh.material.color.lerp(gameColor, progress * 0.5);
            mesh.material.emissiveIntensity = 0.3 + progress * 0.3;
        });
    }
    
    update(deltaTime, elapsedTime) {
        if (!this.visible) return;
        
        // Animate nodes
        this.nodes.forEach((node, id) => {
            const mesh = node.mesh;
            
            // Subtle rotation
            mesh.rotation.y += deltaTime * 0.1;
            
            // Pulsing effect
            const pulse = Math.sin(elapsedTime * 2 + id.charCodeAt(0)) * 0.05 + 1;
            mesh.scale.setScalar(pulse);
        });
        
        // Animate connections
        this.connections.forEach((conn) => {
            // Pulse opacity
            const pulse = Math.sin(elapsedTime * 3) * 0.1 + 0.3;
            conn.tube.material.opacity = pulse;
        });
    }
    
    clear() {
        this.nodes.forEach((node) => {
            this.group.remove(node.mesh);
        });
        
        this.connections.forEach((conn) => {
            this.group.remove(conn.line);
            this.group.remove(conn.tube);
        });
        
        this.nodes.clear();
        this.connections.clear();
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
    
    easeOutElastic(x) {
        const c4 = (2 * Math.PI) / 3;
        return x === 0 ? 0 : x === 1 ? 1 :
            Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
    }
}