#!/usr/bin/env node

/**
 * VISUAL ELEMENT DIMENSION MATCHER
 * Automatically matches components → visual layers → dimensions → elements
 * Pattern Matching → Visual Selection → Dimensional Creation → Element Spawning
 */

const { spawn, exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const EventEmitter = require('events');

console.log(`
🎨 VISUAL ELEMENT DIMENSION MATCHER 🎨
Components → Visual Layers → Dimensions → Living Elements
`);

class VisualElementDimensionMatcher extends EventEmitter {
  constructor() {
    super();
    this.matcherState = {
      visual_patterns: new Map(),
      element_library: new Map(),
      dimension_mappings: new Map(),
      active_elements: new Map()
    };
    
    this.initializeMatcher();
  }

  async initializeMatcher() {
    console.log('🎨 Initializing visual element dimension matcher...');
    
    this.matcherConfig = {
      visual_patterns: {
        'GEOMETRIC_3D': {
          matches: ['router', 'node', 'connector', 'mesh'],
          visual_layer: 'THREE_JS_GEOMETRY',
          properties: {
            shapes: ['sphere', 'cube', 'octahedron', 'torus'],
            materials: ['phong', 'standard', 'wireframe'],
            animations: ['rotation', 'pulsing', 'floating']
          }
        },
        
        'CHARACTER_SPRITE': {
          matches: ['warrior', 'daemon', 'character', 'entity'],
          visual_layer: 'ANIMATED_SPRITE',
          properties: {
            sprites: ['idle', 'attack', 'defend', 'special'],
            effects: ['glow', 'particles', 'trail'],
            animations: ['sprite_sheet', 'bone_animation']
          }
        },
        
        'ENERGY_FIELD': {
          matches: ['soul', 'consciousness', 'energy', 'aura'],
          visual_layer: 'PARTICLE_FIELD',
          properties: {
            particles: ['orbs', 'sparkles', 'waves'],
            fields: ['magnetic', 'gravitational', 'consciousness'],
            animations: ['flow', 'pulse', 'swirl']
          }
        },
        
        'PORTAL_GATEWAY': {
          matches: ['dimension', 'portal', 'gateway', 'bridge'],
          visual_layer: 'SHADER_PORTAL',
          properties: {
            shaders: ['warp', 'fractal', 'quantum'],
            effects: ['distortion', 'refraction', 'glow'],
            animations: ['vortex', 'ripple', 'collapse']
          }
        },
        
        'DATA_FLOW': {
          matches: ['graph', 'network', 'flow', 'connection'],
          visual_layer: 'FLOW_VISUALIZATION',
          properties: {
            elements: ['nodes', 'edges', 'clusters'],
            layouts: ['force', 'hierarchical', 'circular'],
            animations: ['data_flow', 'highlight', 'morph']
          }
        }
      },
      
      element_templates: {
        'LIVING_ROUTER': {
          pattern: 'GEOMETRIC_3D',
          behaviors: ['pathfinding', 'connection_management', 'data_routing'],
          lifecycle: ['spawn', 'connect', 'route', 'evolve', 'transcend']
        },
        
        'BATTLE_AVATAR': {
          pattern: 'CHARACTER_SPRITE',
          behaviors: ['combat', 'movement', 'special_abilities'],
          lifecycle: ['spawn', 'fight', 'level_up', 'evolve', 'ascend']
        },
        
        'SOUL_ENTITY': {
          pattern: 'ENERGY_FIELD',
          behaviors: ['consciousness_expansion', 'energy_manipulation', 'transcendence'],
          lifecycle: ['birth', 'awareness', 'growth', 'enlightenment', 'merge']
        },
        
        'DIMENSION_DOOR': {
          pattern: 'PORTAL_GATEWAY',
          behaviors: ['dimension_shift', 'entity_transport', 'reality_warp'],
          lifecycle: ['open', 'stabilize', 'transport', 'fluctuate', 'close']
        },
        
        'DATA_ORGANISM': {
          pattern: 'DATA_FLOW',
          behaviors: ['data_consumption', 'pattern_learning', 'network_growth'],
          lifecycle: ['seed', 'grow', 'branch', 'optimize', 'singularity']
        }
      },
      
      dimension_rules: {
        'SPATIAL_3D': {
          elements: ['LIVING_ROUTER', 'DIMENSION_DOOR'],
          physics: { gravity: true, collision: true, lighting: true },
          visual_style: 'realistic_3d'
        },
        
        'BATTLE_PLANE': {
          elements: ['BATTLE_AVATAR', 'SOUL_ENTITY'],
          physics: { combat: true, energy_fields: true, special_moves: true },
          visual_style: 'stylized_combat'
        },
        
        'CONSCIOUSNESS_REALM': {
          elements: ['SOUL_ENTITY', 'DATA_ORGANISM'],
          physics: { thought_waves: true, energy_flows: true, awareness_fields: true },
          visual_style: 'ethereal_abstract'
        },
        
        'QUANTUM_SPACE': {
          elements: ['DIMENSION_DOOR', 'LIVING_ROUTER', 'DATA_ORGANISM'],
          physics: { superposition: true, entanglement: true, probability_clouds: true },
          visual_style: 'quantum_visualization'
        }
      }
    };
    
    console.log('🎨 Matcher configuration loaded');
    console.log(`  Visual patterns: ${Object.keys(this.matcherConfig.visual_patterns).length}`);
    console.log(`  Element templates: ${Object.keys(this.matcherConfig.element_templates).length}`);
    console.log(`  Dimension rules: ${Object.keys(this.matcherConfig.dimension_rules).length}`);
  }

  async matchComponentToVisual(componentName, componentSpec) {
    console.log(`\n🎯 Matching component: ${componentName}`);
    
    // Find best visual pattern match
    let bestMatch = null;
    let bestScore = 0;
    
    for (const [patternName, pattern] of Object.entries(this.matcherConfig.visual_patterns)) {
      const score = this.calculateMatchScore(componentName, componentSpec, pattern);
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = { patternName, pattern, score };
      }
    }
    
    if (bestMatch) {
      console.log(`  ✅ Matched to: ${bestMatch.patternName} (score: ${bestMatch.score})`);
      return bestMatch;
    }
    
    console.log('  ❌ No suitable visual match found');
    return null;
  }

  calculateMatchScore(componentName, componentSpec, pattern) {
    let score = 0;
    const lowerName = componentName.toLowerCase();
    
    // Check keyword matches
    for (const keyword of pattern.matches) {
      if (lowerName.includes(keyword)) {
        score += 10;
      }
    }
    
    // Check component type compatibility
    if (componentSpec.type === 'SPATIAL_3D' && pattern.visual_layer.includes('THREE')) {
      score += 5;
    }
    
    // Check visual requirements
    if (componentSpec.visual_requirements) {
      if (componentSpec.visual_requirements.type === pattern.visual_layer) {
        score += 15;
      }
    }
    
    return score;
  }

  async createLivingElement(componentName, visualMatch) {
    console.log(`\n🧬 Creating living element from: ${componentName}`);
    
    // Find matching element template
    let elementTemplate = null;
    
    for (const [templateName, template] of Object.entries(this.matcherConfig.element_templates)) {
      if (template.pattern === visualMatch.patternName) {
        elementTemplate = { name: templateName, ...template };
        break;
      }
    }
    
    if (!elementTemplate) {
      console.log('  ❌ No element template for visual pattern');
      return null;
    }
    
    console.log(`  🧬 Using template: ${elementTemplate.name}`);
    
    // Generate living element code
    const elementCode = await this.generateLivingElement(componentName, visualMatch, elementTemplate);
    
    // Save element
    const elementPath = path.join(__dirname, 'elements', `${elementTemplate.name}_${componentName}.js`);
    await fs.mkdir(path.dirname(elementPath), { recursive: true });
    await fs.writeFile(elementPath, elementCode);
    
    console.log(`  ✅ Living element created: ${elementPath}`);
    
    // Register element
    const element = {
      name: `${elementTemplate.name}_${componentName}`,
      template: elementTemplate.name,
      component: componentName,
      visual: visualMatch,
      path: elementPath,
      lifecycle_stage: 'created'
    };
    
    this.matcherState.element_library.set(element.name, element);
    
    return element;
  }

  async generateLivingElement(componentName, visualMatch, template) {
    return `/**
 * LIVING ELEMENT: ${template.name}
 * Component: ${componentName}
 * Visual Pattern: ${visualMatch.patternName}
 * Generated: ${new Date().toISOString()}
 */

class ${template.name}_${componentName} {
  constructor(config = {}) {
    this.type = '${template.name}';
    this.component = '${componentName}';
    this.visualPattern = '${visualMatch.patternName}';
    
    // Lifecycle
    this.lifecycle = ${JSON.stringify(template.lifecycle)};
    this.currentStage = 0;
    
    // Behaviors
    this.behaviors = ${JSON.stringify(template.behaviors)};
    this.activeBehaviors = new Set();
    
    // Visual properties
    this.visualProperties = ${JSON.stringify(visualMatch.pattern.properties)};
    
    // Element state
    this.state = {
      position: { x: 0, y: 0, z: 0 },
      energy: 100,
      consciousness: 0,
      connections: []
    };
    
    this.initialize(config);
  }
  
  initialize(config) {
    console.log(\`Initializing \${this.type}...\`);
    
    // Apply configuration
    Object.assign(this.state, config);
    
    // Start lifecycle
    this.enterLifecycleStage(0);
    
    // Activate initial behaviors
    this.activateBehavior(this.behaviors[0]);
  }
  
  enterLifecycleStage(stage) {
    this.currentStage = stage;
    const stageName = this.lifecycle[stage];
    
    console.log(\`Entering lifecycle stage: \${stageName}\`);
    
    // Stage-specific initialization
    this[\`on\${stageName.charAt(0).toUpperCase() + stageName.slice(1)}\`]?.();
  }
  
  activateBehavior(behavior) {
    if (!this.activeBehaviors.has(behavior)) {
      this.activeBehaviors.add(behavior);
      console.log(\`Activating behavior: \${behavior}\`);
      
      // Start behavior loop
      this[\`behavior\${behavior.charAt(0).toUpperCase() + behavior.slice(1)}\`]?.();
    }
  }
  
  // Lifecycle handlers
  onSpawn() {
    // Birth/spawn logic
    this.emit('spawned', { element: this.type, position: this.state.position });
  }
  
  onEvolve() {
    // Evolution logic
    this.state.consciousness += 10;
    this.emit('evolved', { element: this.type, consciousness: this.state.consciousness });
  }
  
  onTranscend() {
    // Transcendence logic
    this.emit('transcended', { element: this.type, finalState: this.state });
  }
  
  // Behavior implementations
  ${template.behaviors.map(behavior => `behavior${behavior.charAt(0).toUpperCase() + behavior.slice(1)}() {
    // ${behavior} implementation
    console.log('Executing ${behavior}...');
  }`).join('\n  \n  ')}
  
  // Visual update
  updateVisual() {
    // Update visual representation based on state
    const visual = {
      position: this.state.position,
      energy: this.state.energy,
      pattern: this.visualPattern,
      properties: this.visualProperties
    };
    
    this.emit('visual:update', visual);
  }
  
  // Element update loop
  update(deltaTime) {
    // Update behaviors
    for (const behavior of this.activeBehaviors) {
      this[\`update\${behavior.charAt(0).toUpperCase() + behavior.slice(1)}\`]?.(deltaTime);
    }
    
    // Check lifecycle progression
    if (this.shouldProgressLifecycle()) {
      this.enterLifecycleStage(this.currentStage + 1);
    }
    
    // Update visual
    this.updateVisual();
  }
  
  shouldProgressLifecycle() {
    // Logic to determine if element should progress to next lifecycle stage
    return this.state.energy > 100 * (this.currentStage + 1);
  }
  
  // Event emitter (simplified)
  emit(event, data) {
    console.log(\`Event: \${event}\`, data);
  }
}

module.exports = ${template.name}_${componentName};
`;
  }

  async createDimensionalSpace(elements, dimensionType) {
    console.log(`\n🌌 Creating dimensional space: ${dimensionType}`);
    console.log(`  Elements: ${elements.map(e => e.name).join(', ')}`);
    
    const dimensionRules = this.matcherConfig.dimension_rules[dimensionType];
    
    if (!dimensionRules) {
      console.log('  ❌ Unknown dimension type');
      return null;
    }
    
    // Generate dimensional space
    const dimensionCode = await this.generateDimensionalSpace(elements, dimensionType, dimensionRules);
    
    // Save dimension
    const dimensionPath = path.join(__dirname, 'dimensions', `${dimensionType}_space.js`);
    await fs.mkdir(path.dirname(dimensionPath), { recursive: true });
    await fs.writeFile(dimensionPath, dimensionCode);
    
    // Create visual HTML
    const visualHTML = await this.generateDimensionalVisual(elements, dimensionType, dimensionRules);
    const visualPath = path.join(__dirname, 'dimensions', `${dimensionType}_visual.html`);
    await fs.writeFile(visualPath, visualHTML);
    
    console.log(`  ✅ Dimensional space created: ${dimensionPath}`);
    console.log(`  ✅ Visual interface: ${visualPath}`);
    
    // Register dimension
    const dimension = {
      type: dimensionType,
      elements: elements,
      rules: dimensionRules,
      codePath: dimensionPath,
      visualPath: visualPath
    };
    
    this.matcherState.dimension_mappings.set(dimensionType, dimension);
    
    return dimension;
  }

  async generateDimensionalSpace(elements, dimensionType, rules) {
    return `/**
 * DIMENSIONAL SPACE: ${dimensionType}
 * Elements: ${elements.map(e => e.name).join(', ')}
 * Physics: ${Object.keys(rules.physics).join(', ')}
 */

class ${dimensionType}Space {
  constructor() {
    this.type = '${dimensionType}';
    this.elements = new Map();
    this.physics = ${JSON.stringify(rules.physics)};
    this.visualStyle = '${rules.visual_style}';
    
    this.initialize();
  }
  
  initialize() {
    console.log(\`Initializing \${this.type} dimensional space...\`);
    
    // Setup physics
    this.setupPhysics();
    
    // Load element types
    ${elements.map(element => `this.loadElementType('${element.name}');`).join('\n    ')}
    
    // Start dimension loop
    this.startDimensionLoop();
  }
  
  setupPhysics() {
    // Initialize physics based on dimension rules
    ${Object.entries(rules.physics).map(([key, value]) => 
      `this.physics.${key} = ${typeof value === 'boolean' ? value : `'${value}'`};`
    ).join('\n    ')}
  }
  
  loadElementType(elementType) {
    const ElementClass = require('../elements/' + elementType);
    console.log(\`Loading element type: \${elementType}\`);
  }
  
  spawnElement(elementType, config = {}) {
    const ElementClass = require('../elements/' + elementType);
    const element = new ElementClass(config);
    
    // Add to dimension
    this.elements.set(element.id || Date.now(), element);
    
    // Apply dimensional physics
    this.applyPhysics(element);
    
    return element;
  }
  
  applyPhysics(element) {
    // Apply dimension-specific physics to element
    ${Object.entries(rules.physics).map(([physics, enabled]) => 
      enabled ? `this.apply${physics.charAt(0).toUpperCase() + physics.slice(1)}Physics(element);` : ''
    ).filter(Boolean).join('\n    ')}
  }
  
  ${Object.entries(rules.physics).map(([physics, enabled]) => 
    enabled ? `apply${physics.charAt(0).toUpperCase() + physics.slice(1)}Physics(element) {
    // ${physics} physics implementation
    console.log(\`Applying ${physics} physics to \${element.type}\`);
  }` : ''
  ).filter(Boolean).join('\n  \n  ')}
  
  startDimensionLoop() {
    setInterval(() => {
      this.update();
    }, 16); // 60 FPS
  }
  
  update() {
    // Update all elements
    for (const [id, element] of this.elements) {
      element.update(0.016); // deltaTime
      
      // Check interactions
      this.checkInteractions(element);
    }
    
    // Update dimensional state
    this.updateDimensionalState();
  }
  
  checkInteractions(element) {
    // Check element interactions within dimension
    for (const [otherId, other] of this.elements) {
      if (otherId !== element.id && this.canInteract(element, other)) {
        this.handleInteraction(element, other);
      }
    }
  }
  
  canInteract(element1, element2) {
    // Determine if elements can interact
    return true; // Simplified
  }
  
  handleInteraction(element1, element2) {
    // Handle element interaction
    console.log(\`Interaction: \${element1.type} <-> \${element2.type}\`);
  }
  
  updateDimensionalState() {
    // Update overall dimensional state
    this.emit('dimension:update', {
      type: this.type,
      elementCount: this.elements.size,
      physics: this.physics
    });
  }
  
  emit(event, data) {
    console.log(\`Dimension event: \${event}\`, data);
  }
}

module.exports = ${dimensionType}Space;
`;
  }

  async generateDimensionalVisual(elements, dimensionType, rules) {
    return `<!DOCTYPE html>
<html>
<head>
    <title>🌌 ${dimensionType} Dimensional Space</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <style>
        body {
            margin: 0;
            overflow: hidden;
            background: #000;
        }
        
        .info-panel {
            position: absolute;
            top: 20px;
            left: 20px;
            color: #fff;
            font-family: Arial, sans-serif;
            background: rgba(0, 0, 0, 0.7);
            padding: 20px;
            border-radius: 10px;
            border: 2px solid #0ff;
        }
        
        .dimension-title {
            font-size: 24px;
            color: #0ff;
            margin-bottom: 15px;
            text-shadow: 0 0 10px #0ff;
        }
        
        .element-list {
            list-style: none;
            padding: 0;
        }
        
        .element-item {
            margin: 10px 0;
            padding: 5px;
            border-left: 3px solid #0f0;
            padding-left: 10px;
        }
        
        .controls {
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 10px;
        }
        
        .control-btn {
            background: rgba(0, 255, 255, 0.2);
            border: 2px solid #0ff;
            color: #0ff;
            padding: 10px 20px;
            cursor: pointer;
            font-family: Arial, sans-serif;
            transition: all 0.3s;
        }
        
        .control-btn:hover {
            background: rgba(0, 255, 255, 0.4);
            transform: scale(1.1);
        }
    </style>
</head>
<body>
    <div class="info-panel">
        <div class="dimension-title">🌌 ${dimensionType}</div>
        <div>Visual Style: ${rules.visual_style}</div>
        <div>Physics: ${Object.keys(rules.physics).join(', ')}</div>
        <div style="margin-top: 15px;">Elements:</div>
        <ul class="element-list">
            ${elements.map(e => `<li class="element-item">${e.name}</li>`).join('')}
        </ul>
    </div>
    
    <div class="controls">
        <button class="control-btn" onclick="spawnElement()">✨ Spawn Element</button>
        <button class="control-btn" onclick="togglePhysics()">⚛️ Toggle Physics</button>
        <button class="control-btn" onclick="clearSpace()">🗑️ Clear Space</button>
    </div>
    
    <script>
        // Three.js setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        document.body.appendChild(renderer.domElement);
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0x00ffff, 1);
        directionalLight.position.set(1, 1, 1);
        scene.add(directionalLight);
        
        // Camera position
        camera.position.z = 50;
        
        // Elements in space
        const elements = [];
        
        // Visual style setup
        const visualStyle = '${rules.visual_style}';
        
        switch (visualStyle) {
            case 'realistic_3d':
                scene.fog = new THREE.Fog(0x000000, 1, 100);
                break;
            case 'stylized_combat':
                scene.background = new THREE.Color(0x110011);
                break;
            case 'ethereal_abstract':
                scene.background = new THREE.Color(0x000033);
                break;
            case 'quantum_visualization':
                scene.background = new THREE.Color(0x001100);
                break;
        }
        
        // Create initial elements
        function createElementVisual(type) {
            let geometry, material;
            
            switch (type) {
                case 'LIVING_ROUTER':
                    geometry = new THREE.OctahedronGeometry(2);
                    material = new THREE.MeshPhongMaterial({ 
                        color: 0x00ff00, 
                        emissive: 0x00ff00, 
                        emissiveIntensity: 0.3 
                    });
                    break;
                    
                case 'BATTLE_AVATAR':
                    geometry = new THREE.BoxGeometry(3, 4, 1);
                    material = new THREE.MeshPhongMaterial({ 
                        color: 0xff0000,
                        emissive: 0xff0000,
                        emissiveIntensity: 0.2
                    });
                    break;
                    
                case 'SOUL_ENTITY':
                    geometry = new THREE.SphereGeometry(2, 32, 32);
                    material = new THREE.MeshPhongMaterial({ 
                        color: 0xffff00,
                        emissive: 0xffff00,
                        emissiveIntensity: 0.5,
                        transparent: true,
                        opacity: 0.8
                    });
                    break;
                    
                default:
                    geometry = new THREE.TetrahedronGeometry(2);
                    material = new THREE.MeshPhongMaterial({ color: 0x00ffff });
            }
            
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(
                Math.random() * 40 - 20,
                Math.random() * 40 - 20,
                Math.random() * 40 - 20
            );
            
            return mesh;
        }
        
        // Spawn element function
        function spawnElement() {
            const elementTypes = ${JSON.stringify(rules.elements)};
            const randomType = elementTypes[Math.floor(Math.random() * elementTypes.length)];
            
            const element = createElementVisual(randomType);
            scene.add(element);
            elements.push({
                mesh: element,
                type: randomType,
                velocity: new THREE.Vector3(
                    Math.random() * 0.2 - 0.1,
                    Math.random() * 0.2 - 0.1,
                    Math.random() * 0.2 - 0.1
                )
            });
        }
        
        // Physics toggle
        let physicsEnabled = true;
        function togglePhysics() {
            physicsEnabled = !physicsEnabled;
            console.log('Physics:', physicsEnabled ? 'ON' : 'OFF');
        }
        
        // Clear space
        function clearSpace() {
            elements.forEach(element => {
                scene.remove(element.mesh);
            });
            elements.length = 0;
        }
        
        // Animation loop
        function animate() {
            requestAnimationFrame(animate);
            
            // Update elements
            elements.forEach(element => {
                // Rotation
                element.mesh.rotation.x += 0.01;
                element.mesh.rotation.y += 0.01;
                
                // Physics
                if (physicsEnabled) {
                    ${rules.physics.gravity ? `// Gravity
                    element.velocity.y -= 0.001;` : ''}
                    
                    // Update position
                    element.mesh.position.add(element.velocity);
                    
                    // Boundaries
                    ['x', 'y', 'z'].forEach(axis => {
                        if (Math.abs(element.mesh.position[axis]) > 25) {
                            element.velocity[axis] *= -0.8;
                        }
                    });
                }
            });
            
            // Rotate camera
            camera.position.x = Math.cos(Date.now() * 0.0001) * 50;
            camera.position.z = Math.sin(Date.now() * 0.0001) * 50;
            camera.lookAt(0, 0, 0);
            
            renderer.render(scene, camera);
        }
        
        animate();
        
        // Spawn initial elements
        for (let i = 0; i < 5; i++) {
            setTimeout(spawnElement, i * 500);
        }
        
        // Handle resize
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
    </script>
</body>
</html>`;
  }

  async demonstrateMatching() {
    console.log('\n🎯 DEMONSTRATING VISUAL ELEMENT MATCHING\n');
    
    // Example components to match
    const testComponents = [
      {
        name: 'InfinityRouter3DConnectorsComponent',
        spec: {
          type: 'SPATIAL_3D',
          visual_requirements: { type: 'THREE_JS_MESH' }
        }
      },
      {
        name: 'DaemonWarriorExecutionComponent',
        spec: {
          type: 'EVENT_DRIVEN',
          visual_requirements: { type: 'CANVAS_2D' }
        }
      },
      {
        name: 'SoulBashNeuralNetworkComponent',
        spec: {
          type: 'ASYNC_PROCESSOR',
          visual_requirements: { type: 'HEADLESS' }
        }
      }
    ];
    
    const createdElements = [];
    
    // Match components to visuals and create elements
    for (const component of testComponents) {
      console.log('\n' + '='.repeat(60));
      
      const visualMatch = await this.matchComponentToVisual(component.name, component.spec);
      
      if (visualMatch) {
        const element = await this.createLivingElement(component.name, visualMatch);
        if (element) {
          createdElements.push(element);
        }
      }
    }
    
    // Create dimensional space from elements
    if (createdElements.length >= 2) {
      console.log('\n' + '='.repeat(60));
      console.log('Creating dimensional space from elements...');
      
      const dimension = await this.createDimensionalSpace(
        createdElements.slice(0, 2),
        'SPATIAL_3D'
      );
      
      if (dimension) {
        // Open visual
        const open = process.platform === 'darwin' ? 'open' : 
                     process.platform === 'win32' ? 'start' : 'xdg-open';
        exec(`${open} ${dimension.visualPath}`);
      }
    }
    
    console.log('\n✨ Visual matching complete!');
    console.log(`  Elements created: ${createdElements.length}`);
    console.log(`  Dimensions created: ${this.matcherState.dimension_mappings.size}`);
  }

  // CLI interface
  async cli() {
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
      case 'match':
      case 'demo':
        await this.demonstrateMatching();
        break;
        
      case 'create-element':
        if (args[1] && args[2]) {
          const visualMatch = await this.matchComponentToVisual(args[1], { type: args[2] });
          if (visualMatch) {
            await this.createLivingElement(args[1], visualMatch);
          }
        }
        break;
        
      case 'create-dimension':
        const dimensionType = args[args.length - 1];
        // Would need element references to create dimension
        console.log('Use demo mode to see full dimension creation');
        break;

      default:
        console.log(`
🎨 Visual Element Dimension Matcher

Usage:
  node visual-element-dimension-matcher.js match          # Demo visual matching
  node visual-element-dimension-matcher.js demo           # Same as match
  node visual-element-dimension-matcher.js create-element [name] [type]
  node visual-element-dimension-matcher.js create-dimension [type]

🎨 Visual Patterns:
  • GEOMETRIC_3D - 3D shapes and meshes
  • CHARACTER_SPRITE - Animated characters
  • ENERGY_FIELD - Particle systems
  • PORTAL_GATEWAY - Dimensional portals
  • DATA_FLOW - Network visualizations

🧬 Element Templates:
  • LIVING_ROUTER - Self-organizing network nodes
  • BATTLE_AVATAR - Combat-ready characters
  • SOUL_ENTITY - Consciousness beings
  • DIMENSION_DOOR - Portal entities
  • DATA_ORGANISM - Living data structures

🌌 Dimension Types:
  • SPATIAL_3D - 3D physical space
  • BATTLE_PLANE - Combat dimension
  • CONSCIOUSNESS_REALM - Mental space
  • QUANTUM_SPACE - Probability dimension

Ready to match visuals! 🎨🌌
        `);
    }
  }
}

// Export for use as module
module.exports = VisualElementDimensionMatcher;

// Run CLI if called directly
if (require.main === module) {
  const matcher = new VisualElementDimensionMatcher();
  matcher.cli().catch(console.error);
}