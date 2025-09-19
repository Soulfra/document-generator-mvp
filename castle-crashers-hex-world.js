#!/usr/bin/env node

/**
 * 🏰 CASTLE CRASHERS HEX WORLD
 * Multi-ring character system integrated with hex world
 * Shows evolved characters in their ring-based positions
 */

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { EvolutionManager, CharacterTeam } = require('./multi-ring-character-evolution');

class CastleCrashersHexWorld {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.wss = new WebSocket.Server({ server: this.server });
        this.port = 8302;
        
        // Character system
        this.evolutionManager = new EvolutionManager();
        this.teams = new Map();
        this.activeCharacters = new Map();
        
        // Ring-based positioning
        this.ringPositions = {
            0: [{ q: 0, r: 0, s: 0 }], // Center - BlameChain Core
            1: [ // Inner ring - Mid-tier evolutions
                { q: 2, r: -1, s: -1 }, // Angel
                { q: 1, r: -2, s: 1 },  // Zombie
                { q: -1, r: -1, s: 2 }, // Demon
                { q: -2, r: 1, s: 1 },  // Mutant
                { q: -1, r: 2, s: -1 }, // Dragon
                { q: 1, r: 1, s: -2 }   // Mecha
            ],
            2: [ // Outer ring - End-tier transformations
                { q: 4, r: -2, s: -2 }, // Seraph (Angel evolution)
                { q: 2, r: -4, s: 2 },  // Lich (Zombie evolution)
                { q: -2, r: -2, s: 4 }, // Archfiend (Demon evolution)
                { q: -4, r: 2, s: 2 },  // Apex Mutant (Mutant evolution)
                { q: -2, r: 4, s: -2 }, // Ancient Dragon (Dragon evolution)
                { q: 2, r: 2, s: -4 }   // Cyber Overlord (Mecha evolution)
            ]
        };
        
        // Evolution mapping for Ring 2 positioning
        this.ring2EvolutionMap = {
            'seraph': 0,        // Position 0 in Ring 2
            'lich': 1,          // Position 1 in Ring 2
            'archfiend': 2,     // Position 2 in Ring 2
            'apex_mutant': 3,   // Position 3 in Ring 2
            'ancient_dragon': 4, // Position 4 in Ring 2
            'cyber_overlord': 5  // Position 5 in Ring 2
        };
        
        console.log('🏰 Castle Crashers Hex World initializing...');
        this.init();
    }
    
    init() {
        this.app.use(express.json());
        
        // Main game interface
        this.app.get('/', (req, res) => {
            res.send(this.getGameInterface());
        });
        
        // Character creation
        this.app.post('/api/create-character', (req, res) => {
            const { playerId, playerName } = req.body;
            const character = this.evolutionManager.createCharacter(playerId);
            character.playerName = playerName || `Player ${playerId}`;
            
            // Place at center (Ring 0)
            character.position = this.ringPositions[0][0];
            this.activeCharacters.set(playerId, character);
            
            this.broadcast({
                type: 'character_created',
                character: this.serializeCharacter(character, playerId)
            });
            
            res.json({ success: true, character: this.serializeCharacter(character, playerId) });
        });
        
        // Evolution request
        this.app.post('/api/evolve-character', (req, res) => {
            const { playerId, evolutionType } = req.body;
            
            try {
                const evolved = this.evolutionManager.evolveCharacter(playerId, evolutionType);
                if (evolved) {
                    // Move to appropriate ring position
                    const ringPosition = this.getRingPosition(evolved, evolutionType);
                    evolved.position = ringPosition;
                    
                    this.activeCharacters.set(playerId, evolved);
                    
                    this.broadcast({
                        type: 'character_evolved',
                        playerId,
                        character: this.serializeCharacter(evolved, playerId),
                        evolutionType
                    });
                    
                    res.json({ success: true, character: this.serializeCharacter(evolved, playerId) });
                } else {
                    res.status(400).json({ error: 'Evolution failed' });
                }
            } catch (error) {
                res.status(400).json({ error: error.message });
            }
        });
        
        // Team creation
        this.app.post('/api/create-team', (req, res) => {
            const { teamId, playerIds } = req.body;
            const team = new CharacterTeam(4);
            
            playerIds.forEach(playerId => {
                const character = this.activeCharacters.get(playerId);
                if (character) {
                    team.addPlayer(playerId, character);
                }
            });
            
            this.teams.set(teamId, team);
            
            this.broadcast({
                type: 'team_formed',
                teamId,
                players: playerIds
            });
            
            res.json({ success: true, teamId });
        });
        
        this.setupWebSocket();
        
        this.server.listen(this.port, () => {
            console.log(`\n🏰 CASTLE CRASHERS HEX WORLD: http://localhost:${this.port}`);
            console.log('🎮 Multi-ring character evolution system active!');
            console.log('\n🏆 FEATURES:');
            console.log('   👑 Ring 0: BlameChain Core (center)');
            console.log('   ⚔️ Ring 1: 6 Mid-tier evolutions');
            console.log('   🔥 Ring 2: 6 End-tier transformations'); 
            console.log('   🤝 4-player co-op teams');
            console.log('   🎨 Kingdom Authority color coding');
        });
    }
    
    getRingPosition(character, evolutionType) {
        const ringPositions = this.ringPositions[character.ring];
        
        if (character.ring === 1) {
            // Map Ring 1 evolution types to ring positions
            const evolutionOrder = ['angel', 'zombie', 'demon', 'mutant', 'dragon', 'mecha'];
            const index = evolutionOrder.indexOf(evolutionType);
            return ringPositions[index] || ringPositions[0];
        } else if (character.ring === 2) {
            // Map Ring 2 evolution types to ring positions
            const index = this.ring2EvolutionMap[evolutionType];
            return ringPositions[index] || ringPositions[0];
        }
        
        return ringPositions[0] || { q: 0, r: 0, s: 0 };
    }
    
    serializeCharacter(character, playerId) {
        return {
            id: character.id,
            playerId,
            playerName: character.playerName,
            name: character.name,
            ring: character.ring,
            level: character.level,
            experience: character.experience,
            position: character.position,
            stats: character.stats,
            colorScheme: character.colorScheme,
            abilities: character.abilities || [],
            element: character.element || 'Neutral'
        };
    }
    
    setupWebSocket() {
        this.wss.on('connection', (ws) => {
            console.log('🎮 Player connected to Castle Crashers world');
            
            // Send current state
            ws.send(JSON.stringify({
                type: 'world_state',
                characters: Array.from(this.activeCharacters.entries()).map(([playerId, char]) => 
                    this.serializeCharacter(char, playerId)
                ),
                teams: Array.from(this.teams.entries()).map(([teamId, team]) => ({
                    teamId,
                    players: Array.from(team.players.keys())
                }))
            }));
            
            ws.on('message', (message) => {
                const data = JSON.parse(message);
                this.handlePlayerCommand(data, ws);
            });
        });
    }
    
    handlePlayerCommand(data, ws) {
        switch (data.type) {
            case 'use_ability':
                this.handleAbilityUse(data.playerId, data.abilityName, data.targets);
                break;
                
            case 'move_character':
                this.handleCharacterMovement(data.playerId, data.newPosition);
                break;
                
            case 'team_combo':
                this.handleTeamCombo(data.teamId, data.comboName, data.targets);
                break;
        }
    }
    
    handleAbilityUse(playerId, abilityName, targets) {
        const character = this.activeCharacters.get(playerId);
        if (!character || !character.abilities.includes(abilityName)) return;
        
        console.log(`✨ ${character.name} uses ${abilityName}`);
        
        // Execute ability based on character type
        let result = null;
        switch (abilityName) {
            case 'divine_judgment':
                if (character.divineJudgment) {
                    result = character.divineJudgment(targets[0]);
                }
                break;
            case 'zombie_hunt':
                if (character.zombieHunt) {
                    result = character.zombieHunt();
                }
                break;
            case 'dragon_breath':
                if (character.dragonBreath) {
                    result = character.dragonBreath(targets);
                }
                break;
        }
        
        this.broadcast({
            type: 'ability_used',
            playerId,
            abilityName,
            targets,
            result
        });
    }
    
    handleCharacterMovement(playerId, newPosition) {
        const character = this.activeCharacters.get(playerId);
        if (!character) return;
        
        // Validate movement based on ring
        if (this.isValidRingMovement(character, newPosition)) {
            character.position = newPosition;
            
            this.broadcast({
                type: 'character_moved',
                playerId,
                position: newPosition
            });
        }
    }
    
    isValidRingMovement(character, newPosition) {
        // Characters can only move within their ring or adjacent rings
        const distance = Math.abs(newPosition.q) + Math.abs(newPosition.r) + Math.abs(newPosition.s);
        const maxDistance = character.ring === 0 ? 2 : character.ring * 2 + 2;
        
        return distance <= maxDistance;
    }
    
    handleTeamCombo(teamId, comboName, targets) {
        const team = this.teams.get(teamId);
        if (!team) return;
        
        console.log(`⚡ Team ${teamId} executing combo: ${comboName}`);
        
        team.executeTeamCombo(comboName, targets);
        
        this.broadcast({
            type: 'team_combo_executed',
            teamId,
            comboName,
            targets
        });
    }
    
    broadcast(data) {
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    }
    
    getGameInterface() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>🏰 Castle Crashers Hex World</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Courier New', monospace;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: #fff;
            overflow: hidden;
        }
        
        #game-container {
            width: 100vw;
            height: 100vh;
            position: relative;
        }
        
        #canvas {
            width: 100%;
            height: 100%;
            display: block;
        }
        
        #ui-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
        }
        
        #character-panel {
            position: absolute;
            top: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #FFD700;
            border-radius: 10px;
            padding: 20px;
            min-width: 300px;
            pointer-events: all;
        }
        
        .character-info {
            margin-bottom: 15px;
        }
        
        .character-name {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .character-stats {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin: 10px 0;
        }
        
        .stat {
            background: rgba(255, 255, 255, 0.1);
            padding: 5px;
            border-radius: 3px;
            font-size: 12px;
        }
        
        .abilities {
            margin: 15px 0;
        }
        
        .ability-btn {
            background: linear-gradient(45deg, #FF6B6B, #4ECDC4);
            border: none;
            color: white;
            padding: 8px 16px;
            margin: 3px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
            font-weight: bold;
        }
        
        .ability-btn:hover {
            transform: scale(1.05);
        }
        
        #evolution-panel {
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #00FF00;
            border-radius: 10px;
            padding: 20px;
            min-width: 250px;
            pointer-events: all;
        }
        
        .evolution-btn {
            background: linear-gradient(45deg, #FFD700, #FFA500);
            border: none;
            color: #000;
            padding: 10px 20px;
            margin: 5px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            width: 100%;
        }
        
        .evolution-btn:hover {
            background: linear-gradient(45deg, #FFA500, #FFD700);
        }
        
        .evolution-btn:disabled {
            background: #666;
            color: #999;
            cursor: not-allowed;
        }
        
        #team-panel {
            position: absolute;
            bottom: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #FF4500;
            border-radius: 10px;
            padding: 15px;
            pointer-events: all;
        }
        
        .team-member {
            display: inline-block;
            margin: 5px;
            padding: 5px 10px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 5px;
            font-size: 12px;
        }
        
        #controls {
            position: absolute;
            bottom: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #8A2BE2;
            border-radius: 10px;
            padding: 15px;
            pointer-events: all;
        }
        
        .control-btn {
            background: linear-gradient(45deg, #8A2BE2, #9370DB);
            border: none;
            color: white;
            padding: 10px 15px;
            margin: 3px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
        }
        
        .ring-label {
            position: absolute;
            font-size: 16px;
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
            pointer-events: none;
        }
        
        .evolution-effect {
            position: absolute;
            animation: evolutionPulse 2s ease-in-out;
            pointer-events: none;
        }
        
        @keyframes evolutionPulse {
            0% { transform: scale(1); opacity: 0; }
            50% { transform: scale(2); opacity: 1; }
            100% { transform: scale(3); opacity: 0; }
        }
        
        .character-type-angel { color: #FFD700; }
        .character-type-zombie { color: #228B22; }
        .character-type-demon { color: #8B0000; }
        .character-type-mutant { color: #32CD32; }
        .character-type-dragon { color: #FF4500; }
        .character-type-mecha { color: #C0C0C0; }
    </style>
</head>
<body>
    <div id="game-container">
        <canvas id="canvas"></canvas>
        
        <div id="ui-overlay">
            <div id="character-panel">
                <h3>🏰 Character Status</h3>
                <div id="character-info">
                    <div class="character-name">No Character</div>
                    <div class="character-stats"></div>
                    <div class="abilities"></div>
                </div>
            </div>
            
            <div id="evolution-panel">
                <h3>⚡ Evolution Tree</h3>
                <div id="evolution-options">
                    <button class="evolution-btn" onclick="createCharacter()">Create Character</button>
                </div>
            </div>
            
            <div id="team-panel">
                <h3>🤝 Team Status</h3>
                <div id="team-members">No team formed</div>
            </div>
            
            <div id="controls">
                <button class="control-btn" onclick="simulateEvolution()">Simulate Evolution</button>
                <button class="control-btn" onclick="formTeam()">Form Team</button>
                <button class="control-btn" onclick="resetWorld()">Reset World</button>
            </div>
        </div>
    </div>
    
    <script>
        let ws;
        let currentCharacter = null;
        let playerId = 'player_' + Math.random().toString(36).substr(2, 9);
        let characters = new Map();
        
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        
        function init() {
            resizeCanvas();
            connectWebSocket();
            animate();
        }
        
        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        
        function connectWebSocket() {
            ws = new WebSocket(\`ws://\${window.location.host}\`);
            
            ws.onopen = () => {
                console.log('Connected to Castle Crashers world');
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleServerMessage(data);
            };
        }
        
        function handleServerMessage(data) {
            switch (data.type) {
                case 'world_state':
                    data.characters.forEach(char => {
                        characters.set(char.playerId, char);
                        if (char.playerId === playerId) {
                            currentCharacter = char;
                            updateCharacterPanel();
                        }
                    });
                    break;
                    
                case 'character_created':
                    if (data.character.playerId === playerId) {
                        currentCharacter = data.character;
                        updateCharacterPanel();
                    }
                    characters.set(data.character.playerId, data.character);
                    break;
                    
                case 'character_evolved':
                    if (data.playerId === playerId) {
                        currentCharacter = data.character;
                        updateCharacterPanel();
                        showEvolutionEffect(data.character.position);
                    }
                    characters.set(data.playerId, data.character);
                    break;
                    
                case 'ability_used':
                    showAbilityEffect(data.playerId, data.abilityName);
                    break;
            }
        }
        
        function drawHexGrid() {
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const hexSize = 30;
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            
            // Draw rings
            for (let ring = 0; ring <= 2; ring++) {
                const radius = ring * hexSize * 2;
                
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                ctx.stroke();
                
                // Ring labels
                ctx.fillStyle = '#FFD700';
                ctx.font = '14px Courier New';
                ctx.textAlign = 'center';
                ctx.fillText(\`Ring \${ring}\`, centerX, centerY - radius - 10);
            }
        }
        
        function drawCharacters() {
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const hexSize = 30;
            
            characters.forEach(char => {
                const x = centerX + char.position.q * hexSize * 1.5;
                const y = centerY + (char.position.r + char.position.q * 0.5) * hexSize * Math.sqrt(3);
                
                // Character circle
                const color = char.colorScheme ? char.colorScheme.primary : '#FFFFFF';
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(x, y, 15, 0, Math.PI * 2);
                ctx.fill();
                
                // Character border
                ctx.strokeStyle = char.colorScheme ? char.colorScheme.accent : '#FFFFFF';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // Character name
                ctx.fillStyle = '#FFFFFF';
                ctx.font = '12px Courier New';
                ctx.textAlign = 'center';
                ctx.fillText(char.name.substring(0, 10), x, y - 25);
                
                // Level indicator
                ctx.font = '10px Courier New';
                ctx.fillText(\`Lv.\${char.level}\`, x, y + 30);
                
                // Ring indicator
                if (char.ring > 0) {
                    ctx.fillStyle = char.ring === 1 ? '#00FF00' : '#FF4500';
                    ctx.fillText(\`Ring \${char.ring}\`, x, y + 40);
                }
            });
        }
        
        function updateCharacterPanel() {
            if (!currentCharacter) return;
            
            const infoDiv = document.getElementById('character-info');
            
            let statsHtml = '';
            Object.entries(currentCharacter.stats).forEach(([stat, value]) => {
                statsHtml += \`<div class="stat">\${stat}: \${value}</div>\`;
            });
            
            let abilitiesHtml = '';
            if (currentCharacter.abilities) {
                currentCharacter.abilities.forEach(ability => {
                    abilitiesHtml += \`<button class="ability-btn" onclick="useAbility('\${ability}')">\${ability}</button>\`;
                });
            }
            
            infoDiv.innerHTML = \`
                <div class="character-name character-type-\${currentCharacter.name.toLowerCase().split(' ')[0]}">
                    \${currentCharacter.name}
                </div>
                <div>Ring: \${currentCharacter.ring} | Level: \${currentCharacter.level}</div>
                <div>Element: \${currentCharacter.element || 'Neutral'}</div>
                <div class="character-stats">\${statsHtml}</div>
                <div class="abilities">\${abilitiesHtml}</div>
            \`;
            
            updateEvolutionPanel();
        }
        
        function updateEvolutionPanel() {
            const panel = document.getElementById('evolution-options');
            
            if (!currentCharacter) {
                panel.innerHTML = '<button class="evolution-btn" onclick="createCharacter()">Create Character</button>';
                return;
            }
            
            if (currentCharacter.ring === 0) {
                // Show mid-tier evolutions
                const evolutions = ['angel', 'zombie', 'demon', 'mutant', 'dragon', 'mecha'];
                let html = '';
                
                evolutions.forEach(evo => {
                    html += \`<button class="evolution-btn" onclick="evolveCharacter('\${evo}')">\${evo.toUpperCase()}</button>\`;
                });
                
                panel.innerHTML = html;
            } else if (currentCharacter.ring === 1) {
                // Show end-tier evolution based on character type
                const endTierEvolutions = {
                    'Angel of Accountability': 'seraph',
                    'Zombie Detective': 'lich', 
                    'Demon of Retribution': 'archfiend',
                    'Mutant Adapter': 'apex_mutant',
                    'Dragon Sovereign': 'ancient_dragon',
                    'Mecha Regulator': 'cyber_overlord'
                };
                
                const endTier = endTierEvolutions[currentCharacter.name] || 'ultimate';
                const displayName = endTier.split('_').map(word => 
                    word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                
                panel.innerHTML = \`<button class="evolution-btn" onclick="evolveCharacter('\${endTier}')">🔥 \${displayName}</button>\`;
            } else {
                panel.innerHTML = '<div>🏆 Maximum Evolution Reached!</div>';
            }
        }
        
        function createCharacter() {
            const playerName = prompt('Enter your character name:') || 'Hero';
            
            fetch('/api/create-character', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId, playerName })
            });
        }
        
        function evolveCharacter(evolutionType) {
            fetch('/api/evolve-character', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playerId, evolutionType })
            });
        }
        
        function useAbility(abilityName) {
            if (ws && currentCharacter) {
                ws.send(JSON.stringify({
                    type: 'use_ability',
                    playerId,
                    abilityName,
                    targets: ['target1'] // Simplified targeting
                }));
            }
        }
        
        function simulateEvolution() {
            if (currentCharacter) {
                // Boost stats to meet evolution requirements
                currentCharacter.stats.karma = 500;
                currentCharacter.stats.accountability = 150;
                alert('Stats boosted! You can now evolve!');
                updateCharacterPanel();
            }
        }
        
        function formTeam() {
            alert('Team formation coming soon!');
        }
        
        function resetWorld() {
            location.reload();
        }
        
        function showEvolutionEffect(position) {
            const effect = document.createElement('div');
            effect.className = 'evolution-effect';
            effect.innerHTML = '✨ EVOLUTION! ✨';
            effect.style.left = '50%';
            effect.style.top = '50%';
            document.body.appendChild(effect);
            
            setTimeout(() => effect.remove(), 2000);
        }
        
        function showAbilityEffect(playerId, abilityName) {
            console.log(\`\${playerId} used \${abilityName}\`);
            // Add visual effects here
        }
        
        function animate() {
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            drawHexGrid();
            drawCharacters();
            
            requestAnimationFrame(animate);
        }
        
        window.addEventListener('resize', resizeCanvas);
        init();
    </script>
</body>
</html>`;
    }
}

// Start the Castle Crashers Hex World
new CastleCrashersHexWorld();