#!/usr/bin/env node
// GAME-CHARACTER-INTEGRATION.js - Integrate photo characters into game worlds

// WebSocket client for game integration
class GameCharacterIntegration {
    constructor(gameType, gamePort) {
        this.gameType = gameType;
        this.gamePort = gamePort;
        this.character = null;
        this.ws = null;
        this.characterMesh = null;
        
        this.connectToCharacterSystem();
    }

    connectToCharacterSystem() {
        try {
            this.ws = new WebSocket('ws://localhost:9001');
            
            this.ws.onopen = () => {
                console.log(`🎮 ${this.gameType} connected to character system`);
                this.requestCurrentCharacter();
            };

            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleCharacterMessage(data);
            };

            this.ws.onclose = () => {
                console.log(`🔌 ${this.gameType} disconnected from character system`);
                // Auto-reconnect after 5 seconds
                setTimeout(() => this.connectToCharacterSystem(), 5000);
            };

            this.ws.onerror = (error) => {
                console.error(`❌ ${this.gameType} WebSocket error:`, error);
            };

        } catch (error) {
            console.error(`❌ Failed to connect to character system:`, error);
            // Retry connection
            setTimeout(() => this.connectToCharacterSystem(), 5000);
        }
    }

    requestCurrentCharacter() {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'request_character',
                game: this.gameType
            }));
        }
    }

    handleCharacterMessage(data) {
        switch (data.type) {
            case 'character_update':
                this.updateCharacter(data.character);
                break;
            case 'character_position_update':
                this.updateCharacterPosition(data.position);
                break;
        }
    }

    updateCharacter(character) {
        this.character = character;
        console.log(`👤 Character updated in ${this.gameType}:`, character.name);
        
        // Spawn or update character in the specific game
        switch (this.gameType) {
            case 'voxel':
                this.spawnInVoxelWorld(character);
                break;
            case 'economic':
                this.spawnInEconomicEngine(character);
                break;
            case 'arena':
                this.spawnInAIArena(character);
                break;
        }
    }

    // Voxel World Integration
    spawnInVoxelWorld(character) {
        if (typeof THREE === 'undefined') {
            console.log('⏳ Waiting for THREE.js to load...');
            setTimeout(() => this.spawnInVoxelWorld(character), 1000);
            return;
        }

        console.log('🌀 Spawning character in Voxel World');

        // Remove existing character if present
        if (this.characterMesh && scene) {
            scene.remove(this.characterMesh);
        }

        // Create character based on photo analysis
        const characterGroup = new THREE.Group();
        
        // Head
        const headGeometry = new THREE.BoxGeometry(2, 2, 2);
        const headMaterial = new THREE.MeshPhongMaterial({
            color: character.appearance.colors.primary,
            emissive: character.appearance.colors.primary,
            emissiveIntensity: 0.1
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(0, 3, 0);
        characterGroup.add(head);

        // Body
        const bodyGeometry = new THREE.BoxGeometry(2, 3, 1);
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: character.appearance.colors.secondary
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.set(0, 0, 0);
        characterGroup.add(body);

        // Arms
        const armGeometry = new THREE.BoxGeometry(0.5, 2, 0.5);
        const armMaterial = new THREE.MeshPhongMaterial({
            color: character.appearance.colors.primary
        });
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(-1.5, 0.5, 0);
        characterGroup.add(leftArm);

        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(1.5, 0.5, 0);
        characterGroup.add(rightArm);

        // Legs
        const legGeometry = new THREE.BoxGeometry(0.5, 2, 0.5);
        const legMaterial = new THREE.MeshPhongMaterial({
            color: character.appearance.colors.secondary
        });
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(-0.5, -2.5, 0);
        characterGroup.add(leftLeg);

        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(0.5, -2.5, 0);
        characterGroup.add(rightLeg);

        // Character name tag
        const nameTexture = this.createTextTexture(character.name);
        const nameGeometry = new THREE.PlaneGeometry(4, 1);
        const nameMaterial = new THREE.MeshBasicMaterial({
            map: nameTexture,
            transparent: true
        });
        const nameTag = new THREE.Mesh(nameGeometry, nameMaterial);
        nameTag.position.set(0, 5, 0);
        nameTag.lookAt(camera.position);
        characterGroup.add(nameTag);

        // Position character
        if (character.position && character.position.world === 'voxel_world') {
            characterGroup.position.set(
                character.position.x || 0,
                character.position.y || 0,
                character.position.z || 0
            );
        } else {
            characterGroup.position.set(0, 10, 0);
        }

        // Add to scene
        if (scene) {
            scene.add(characterGroup);
            this.characterMesh = characterGroup;

            // Add character controls
            this.setupCharacterControls(characterGroup);

            console.log('✅ Character spawned in Voxel World');
        }
    }

    // Economic Engine Integration (Babylon.js)
    spawnInEconomicEngine(character) {
        if (typeof BABYLON === 'undefined') {
            console.log('⏳ Waiting for Babylon.js to load...');
            setTimeout(() => this.spawnInEconomicEngine(character), 1000);
            return;
        }

        console.log('💰 Spawning character in Economic Engine');

        // Remove existing character
        if (this.characterMesh && scene) {
            this.characterMesh.dispose();
        }

        // Create character representation as economic agent
        const characterSphere = BABYLON.MeshBuilder.CreateSphere("playerCharacter", {
            diameter: 3,
            segments: 32
        }, scene);

        // Character material based on photo colors
        const characterMaterial = new BABYLON.PBRMaterial("characterMaterial", scene);
        characterMaterial.baseColor = BABYLON.Color3.FromHexString(character.appearance.colors.primary);
        characterMaterial.emissiveColor = BABYLON.Color3.FromHexString(character.appearance.colors.primary).scale(0.2);
        characterMaterial.metallicFactor = 0.6;
        characterMaterial.roughnessFactor = 0.4;
        
        characterSphere.material = characterMaterial;

        // Position near center
        characterSphere.position = new BABYLON.Vector3(0, 8, 0);

        // Add to shadow casting
        if (shadowGenerator) {
            shadowGenerator.addShadowCaster(characterSphere);
        }

        // Character particle system
        const particleSystem = new BABYLON.ParticleSystem("characterParticles", 100, scene);
        particleSystem.particleTexture = new BABYLON.Texture("https://www.babylonjs-playground.com/textures/flare.png", scene);
        particleSystem.emitter = characterSphere;
        
        particleSystem.color1 = BABYLON.Color4.FromHexString(character.appearance.colors.primary + "FF");
        particleSystem.color2 = BABYLON.Color4.FromHexString(character.appearance.colors.secondary + "FF");
        particleSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0);
        
        particleSystem.minSize = 0.1;
        particleSystem.maxSize = 0.3;
        particleSystem.minLifeTime = 0.5;
        particleSystem.maxLifeTime = 2.0;
        particleSystem.emitRate = 20;
        
        particleSystem.start();

        // Character info UI
        const characterUI = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("characterUI");
        
        const characterPanel = new BABYLON.GUI.Rectangle("characterPanel");
        characterPanel.widthInPixels = 300;
        characterPanel.heightInPixels = 150;
        characterPanel.cornerRadius = 10;
        characterPanel.color = "white";
        characterPanel.thickness = 2;
        characterPanel.background = "rgba(0, 0, 0, 0.8)";
        characterPanel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        characterPanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        characterPanel.leftInPixels = 20;
        characterPanel.topInPixels = 20;
        characterUI.addControl(characterPanel);

        const characterText = new BABYLON.GUI.TextBlock();
        characterText.text = `👤 ${character.name}\nLevel: ${character.stats.level}\nBalance: $${character.game_data.economic_engine?.balance || 1000}\nStyle: ${character.analysis.style_category}`;
        characterText.color = "white";
        characterText.fontSize = 14;
        characterPanel.addControl(characterText);

        this.characterMesh = characterSphere;

        console.log('✅ Character spawned in Economic Engine');
    }

    // AI Arena Integration
    spawnInAIArena(character) {
        console.log('🤖 Registering character in AI Arena');

        // Create AI fighter based on character
        const fighterData = {
            name: character.name,
            ownerId: 'photo_character',
            fightingStyle: this.mapCharacterToFightingStyle(character),
            powerLevel: character.stats.level * 10 + character.stats.intelligence,
            specialAbilities: this.generateAbilitiesFromCharacter(character),
            stats: {
                attack: character.stats.creativity,
                defense: character.stats.intelligence,
                speed: Math.floor(Math.random() * 30) + 40,
                intelligence: character.stats.intelligence,
                creativity: character.stats.creativity
            },
            appearance: character.appearance
        };

        // Send to AI Arena service
        if (typeof fetch !== 'undefined') {
            fetch('http://localhost:3001/api/arena/create-fighter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fighterData)
            }).then(response => response.json())
              .then(result => {
                  if (result.success) {
                      console.log('✅ Character fighter created in AI Arena:', result.fighter.id);
                  }
              }).catch(error => {
                  console.error('❌ Failed to create arena fighter:', error);
              });
        }
    }

    mapCharacterToFightingStyle(character) {
        const styleMap = {
            'human': 'analytical_decimation',
            'robot': 'neural_blitz',  
            'fantasy': 'chaos_algorithms'
        };
        return styleMap[character.analysis.style_category] || 'pattern_disruption';
    }

    generateAbilitiesFromCharacter(character) {
        const abilities = [];
        
        if (character.stats.creativity > 70) abilities.push('creative_burst');
        if (character.stats.intelligence > 70) abilities.push('neural_spike');
        if (character.analysis.style_category === 'robot') abilities.push('logic_bomb');
        if (character.analysis.style_category === 'fantasy') abilities.push('magic_surge');
        
        return abilities.length > 0 ? abilities : ['basic_attack'];
    }

    createTextTexture(text) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 128;
        
        context.fillStyle = 'rgba(0, 0, 0, 0.8)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.fillStyle = 'white';
        context.font = '48px Arial';
        context.textAlign = 'center';
        context.fillText(text, canvas.width / 2, canvas.height / 2 + 16);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    setupCharacterControls(characterMesh) {
        // Basic WASD controls for character movement
        const keys = {};
        
        document.addEventListener('keydown', (event) => {
            keys[event.code] = true;
        });
        
        document.addEventListener('keyup', (event) => {
            keys[event.code] = false;
        });

        // Character movement update loop
        const updateCharacterMovement = () => {
            if (!characterMesh) return;

            const speed = 0.5;
            let moved = false;

            if (keys['KeyW'] || keys['ArrowUp']) {
                characterMesh.position.z -= speed;
                moved = true;
            }
            if (keys['KeyS'] || keys['ArrowDown']) {
                characterMesh.position.z += speed;
                moved = true;
            }
            if (keys['KeyA'] || keys['ArrowLeft']) {
                characterMesh.position.x -= speed;
                moved = true;
            }
            if (keys['KeyD'] || keys['ArrowRight']) {
                characterMesh.position.x += speed;
                moved = true;
            }

            // Update character position in save system
            if (moved && this.character) {
                this.character.position = {
                    world: this.gameType + '_world',
                    x: characterMesh.position.x,
                    y: characterMesh.position.y,
                    z: characterMesh.position.z
                };

                // Broadcast position update
                if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify({
                        type: 'update_character_position',
                        position: this.character.position
                    }));
                }
            }

            requestAnimationFrame(updateCharacterMovement);
        };

        updateCharacterMovement();
    }

    updateCharacterPosition(position) {
        if (this.characterMesh && position) {
            this.characterMesh.position.set(
                position.x || this.characterMesh.position.x,
                position.y || this.characterMesh.position.y,
                position.z || this.characterMesh.position.z
            );
        }
    }
}

// Auto-integration script that games can include
(function() {
    // Detect game type based on current page
    let gameType = 'unknown';
    
    if (window.location.port === '8892' || document.title.includes('Voxel')) {
        gameType = 'voxel';
    } else if (window.location.port === '8893' || document.title.includes('Economic')) {
        gameType = 'economic';
    } else if (window.location.port === '3001' || document.title.includes('Arena')) {
        gameType = 'arena';
    }

    if (gameType !== 'unknown') {
        console.log(`🎮 Initializing character integration for ${gameType} game`);
        
        // Wait for game to load, then integrate character system
        window.addEventListener('load', () => {
            setTimeout(() => {
                window.gameCharacterIntegration = new GameCharacterIntegration(gameType, window.location.port);
            }, 2000);
        });
    }
})();

// Export for use in Electron and Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameCharacterIntegration;
}

console.log('🎮 Game Character Integration loaded');
console.log('Features:');
console.log('  ✅ Voxel World character spawning');
console.log('  ✅ Economic Engine agent integration');  
console.log('  ✅ AI Arena fighter creation');
console.log('  ✅ Cross-game character persistence');
console.log('  ✅ Real-time character synchronization');
console.log('  ✅ WASD character controls');
console.log('  ✅ Character save file integration');