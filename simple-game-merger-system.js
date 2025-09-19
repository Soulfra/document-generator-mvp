#!/usr/bin/env node
// SIMPLE-GAME-MERGER-SYSTEM.js - Auto-merge different games with RuneScape simplicity
// "70% of your magic defense is your magic level" - Direct correlations, no complexity

const fs = require('fs');
const path = require('path');

class SimpleGameMergerSystem {
    constructor() {
        this.port = 7777; // Lucky sevens for simple success
        
        // RUNESCAPE PRINCIPLE: Direct stat correlations
        // Magic Defense = 70% of Magic Level + 30% of Defense Level
        this.statCorrelations = {
            // Combat Triangle: Melee > Ranged > Magic > Melee
            'magic_defense': { 'magic_level': 0.7, 'defense_level': 0.3 },
            'ranged_defense': { 'ranged_level': 0.7, 'defense_level': 0.3 },
            'melee_defense': { 'attack_level': 0.4, 'defense_level': 0.6 },
            
            // Skill correlations (direct and simple)
            'max_hit': { 'strength_level': 0.8, 'weapon_bonus': 0.2 },
            'accuracy': { 'attack_level': 0.9, 'weapon_accuracy': 0.1 },
            'hitpoints': { 'constitution_level': 1.0 }, // 1:1 ratio
            
            // Economy correlations
            'trading_value': { 'merchant_level': 0.6, 'charisma': 0.4 },
            'crafting_speed': { 'crafting_level': 0.8, 'dexterity': 0.2 },
            'magic_damage': { 'magic_level': 0.9, 'intelligence': 0.1 }
        };
        
        // GAME LANGUAGE MAPPINGS - Auto-detect and convert
        this.languageMappings = {
            // RuneScape (Original reference)
            'runescape': {
                stats: ['attack', 'strength', 'defense', 'magic', 'ranged', 'prayer'],
                currency: 'gp',
                max_level: 99,
                xp_formula: (level) => Math.floor(level ** 2 * 75 / 4)
            },
            
            // World of Warcraft
            'wow': {
                stats: ['strength', 'agility', 'intellect', 'stamina', 'spirit'],
                currency: 'gold',
                max_level: 80,
                xp_formula: (level) => level * 1000 // Simplified
            },
            
            // Diablo
            'diablo': {
                stats: ['strength', 'dexterity', 'vitality', 'energy'],
                currency: 'gold',
                max_level: 100,
                xp_formula: (level) => level ** 3
            },
            
            // Final Fantasy
            'ff': {
                stats: ['str', 'dex', 'int', 'wis', 'con', 'cha'],
                currency: 'gil',
                max_level: 50,
                xp_formula: (level) => level ** 2 * 100
            },
            
            // Pokemon
            'pokemon': {
                stats: ['hp', 'attack', 'defense', 'special_attack', 'special_defense', 'speed'],
                currency: 'pokedollars',
                max_level: 100,
                xp_formula: (level) => level ** 3
            },
            
            // Minecraft
            'minecraft': {
                stats: ['health', 'hunger', 'experience', 'armor'],
                currency: 'emeralds',
                max_level: 30, // Enchanting limit
                xp_formula: (level) => level ** 2 + 6 * level
            }
        };
        
        // UNIVERSAL STAT TRANSLATION TABLE
        // Convert any game's stats to RuneScape equivalent
        this.universalStats = {
            // Health/Life
            'hp': 'hitpoints',
            'health': 'hitpoints',
            'life': 'hitpoints',
            'vitality': 'hitpoints',
            'stamina': 'hitpoints',
            'constitution': 'hitpoints',
            
            // Physical Attack
            'str': 'strength',
            'attack': 'attack',
            'melee': 'attack',
            'physical': 'attack',
            
            // Physical Defense
            'def': 'defense',
            'armor': 'defense',
            'toughness': 'defense',
            'resistance': 'defense',
            
            // Magic
            'int': 'magic',
            'intellect': 'magic',
            'mana': 'magic',
            'wisdom': 'magic',
            'special_attack': 'magic',
            
            // Ranged
            'dex': 'ranged',
            'dexterity': 'ranged',
            'agility': 'ranged',
            'speed': 'ranged',
            'special_defense': 'ranged',
            
            // Support
            'cha': 'prayer',
            'charisma': 'prayer',
            'spirit': 'prayer',
            'luck': 'prayer'
        };
        
        // MERGE RULES - Simple and predictable
        this.mergeRules = [
            {
                name: 'stat_correlation',
                description: 'Stats automatically correlate like RuneScape',
                apply: (playerA, playerB) => {
                    const merged = {};
                    
                    // Get all unique stat names
                    const allStats = new Set([
                        ...Object.keys(playerA.stats || {}),
                        ...Object.keys(playerB.stats || {})
                    ]);
                    
                    // Merge each stat using correlations
                    for (const stat of allStats) {
                        const valueA = playerA.stats[stat] || 0;
                        const valueB = playerB.stats[stat] || 0;
                        
                        // Simple average with 70/30 split (like RS magic defense)
                        merged[stat] = Math.floor(valueA * 0.7 + valueB * 0.3);
                    }
                    
                    return { stats: merged };
                }
            },
            
            {
                name: 'currency_conversion',
                description: 'Auto-convert currencies using exchange rates',
                apply: (playerA, playerB) => {
                    // Simple 1:1 conversion for now (can be enhanced)
                    const totalWealth = (playerA.currency_amount || 0) + (playerB.currency_amount || 0);
                    return { currency_amount: totalWealth };
                }
            },
            
            {
                name: 'level_averaging',
                description: 'Average levels with bias toward higher level',
                apply: (playerA, playerB) => {
                    const levelA = playerA.level || 1;
                    const levelB = playerB.level || 1;
                    
                    // Bias toward higher level (70% higher, 30% lower)
                    const higher = Math.max(levelA, levelB);
                    const lower = Math.min(levelA, levelB);
                    
                    return { level: Math.floor(higher * 0.7 + lower * 0.3) };
                }
            }
        ];
        
        console.log('🎮 SIMPLE GAME MERGER SYSTEM');
        console.log('============================');
        console.log('🔀 Auto-merge different games with RuneScape simplicity');
        console.log('📊 70% correlations = predictable results');
        console.log('🚀 No complexity, just math');
    }
    
    // MAIN MERGER FUNCTION - Just works like RuneScape
    mergeGames(gameDataA, gameDataB) {
        console.log('\n🔄 MERGING GAMES...');
        console.log('==================');
        
        // Step 1: Auto-detect game languages
        const languageA = this.detectGameLanguage(gameDataA);
        const languageB = this.detectGameLanguage(gameDataB);
        
        console.log(`🎯 Detected: ${languageA} + ${languageB}`);
        
        // Step 2: Normalize to universal stats
        const normalizedA = this.normalizeToUniversal(gameDataA, languageA);
        const normalizedB = this.normalizeToUniversal(gameDataB, languageB);
        
        console.log('🔄 Normalized to universal format');
        
        // Step 3: Apply merge rules (simple correlations)
        let merged = {};
        
        for (const rule of this.mergeRules) {
            const result = rule.apply(normalizedA, normalizedB);
            merged = { ...merged, ...result };
            console.log(`✅ Applied ${rule.name}`);
        }
        
        // Step 4: Calculate derived stats using correlations
        merged = this.calculateDerivedStats(merged);
        
        console.log('🎉 MERGE COMPLETE!');
        console.log('==================');
        console.log('Final merged character:', JSON.stringify(merged, null, 2));
        
        return merged;
    }
    
    // AUTO-DETECT GAME LANGUAGE (like file type detection)
    detectGameLanguage(gameData) {
        if (!gameData || typeof gameData !== 'object') {
            return 'unknown';
        }
        
        // Check for distinctive stat names
        const stats = gameData.stats || gameData;
        const statNames = Object.keys(stats);
        
        // RuneScape detection
        if (statNames.some(s => ['attack', 'strength', 'defense', 'magic', 'ranged', 'prayer'].includes(s))) {
            return 'runescape';
        }
        
        // WoW detection
        if (statNames.some(s => ['intellect', 'stamina', 'spirit'].includes(s))) {
            return 'wow';
        }
        
        // Diablo detection
        if (statNames.some(s => ['vitality', 'energy'].includes(s)) && statNames.includes('strength')) {
            return 'diablo';
        }
        
        // Pokemon detection
        if (statNames.some(s => ['special_attack', 'special_defense'].includes(s))) {
            return 'pokemon';
        }
        
        // Minecraft detection
        if (statNames.some(s => ['hunger', 'experience'].includes(s))) {
            return 'minecraft';
        }
        
        // Default to generic RPG
        return 'generic';
    }
    
    // NORMALIZE TO UNIVERSAL STATS (like RuneScape's base system)
    normalizeToUniversal(gameData, language) {
        const normalized = {
            stats: {},
            level: gameData.level || 1,
            currency_amount: gameData.currency_amount || gameData.gold || gameData.gp || 0,
            game_origin: language
        };
        
        // Convert stats to universal format
        const originalStats = gameData.stats || gameData;
        
        for (const [originalStat, value] of Object.entries(originalStats)) {
            if (typeof value === 'number') {
                // Map to universal stat name
                const universalStat = this.universalStats[originalStat.toLowerCase()] || originalStat;
                normalized.stats[universalStat] = value;
            }
        }
        
        return normalized;
    }
    
    // CALCULATE DERIVED STATS (like RuneScape's combat formulas)
    calculateDerivedStats(baseStats) {
        const derived = { ...baseStats };
        
        // Apply stat correlations
        for (const [derivedStat, correlations] of Object.entries(this.statCorrelations)) {
            let value = 0;
            let hasAllStats = true;
            
            // Check if we have all required stats
            for (const requiredStat of Object.keys(correlations)) {
                if (!baseStats.stats[requiredStat]) {
                    hasAllStats = false;
                    break;
                }
            }
            
            // Calculate derived stat if possible
            if (hasAllStats) {
                for (const [stat, correlation] of Object.entries(correlations)) {
                    value += baseStats.stats[stat] * correlation;
                }
                
                derived.stats[derivedStat] = Math.floor(value);
            }
        }
        
        // Calculate combat level (RuneScape formula simplified)
        const stats = derived.stats;
        const attack = stats.attack || stats.melee_defense || 1;
        const strength = stats.strength || stats.max_hit || 1;
        const defense = stats.defense || 1;
        const magic = stats.magic || stats.magic_defense || 1;
        const ranged = stats.ranged || stats.ranged_defense || 1;
        const prayer = stats.prayer || 1;
        
        derived.combat_level = Math.floor(
            (attack + defense + strength + prayer / 2) * 0.325 +
            Math.max(magic, ranged) * 0.325
        );
        
        return derived;
    }
    
    // QUICK MERGE - One function to rule them all
    quickMerge(characterA, characterB) {
        console.log('\n⚡ QUICK MERGE - RuneScape Style');
        console.log('=================================');
        
        // Just like RuneScape: 70% primary stat, 30% secondary
        const merged = {};
        
        // Handle stats
        merged.stats = {};
        const allStats = new Set([
            ...Object.keys(characterA.stats || {}),
            ...Object.keys(characterB.stats || {})
        ]);
        
        for (const stat of allStats) {
            const a = characterA.stats?.[stat] || 0;
            const b = characterB.stats?.[stat] || 0;
            
            // Higher stat gets 70% weight (like magic defense formula)
            if (a >= b) {
                merged.stats[stat] = Math.floor(a * 0.7 + b * 0.3);
            } else {
                merged.stats[stat] = Math.floor(b * 0.7 + a * 0.3);
            }
        }
        
        // Handle other properties with same principle
        merged.level = Math.floor(
            Math.max(characterA.level || 1, characterB.level || 1) * 0.7 +
            Math.min(characterA.level || 1, characterB.level || 1) * 0.3
        );
        
        merged.name = `${characterA.name || 'Player1'}_${characterB.name || 'Player2'}`;
        
        console.log('✅ Merged using 70/30 rule');
        return merged;
    }
    
    // TEST WITH DIFFERENT GAME EXAMPLES
    runTests() {
        console.log('\n🧪 RUNNING MERGER TESTS');
        console.log('========================');
        
        // Test 1: RuneScape + WoW
        const rsChar = {
            name: 'Zezima',
            stats: { attack: 99, strength: 99, defense: 99, magic: 99, ranged: 99 },
            level: 126
        };
        
        const wowChar = {
            name: 'Leeroy',
            stats: { strength: 800, agility: 600, intellect: 400, stamina: 1000 },
            level: 80
        };
        
        console.log('\n📋 Test 1: RuneScape + WoW');
        const merged1 = this.quickMerge(rsChar, wowChar);
        
        // Test 2: Pokemon + Minecraft
        const pokemonChar = {
            name: 'Ash',
            stats: { hp: 100, attack: 80, defense: 70, special_attack: 90, speed: 85 },
            level: 50
        };
        
        const mcChar = {
            name: 'Steve',
            stats: { health: 20, armor: 15, experience: 30, hunger: 20 },
            level: 25
        };
        
        console.log('\n📋 Test 2: Pokemon + Minecraft');
        const merged2 = this.quickMerge(pokemonChar, mcChar);
        
        return { merged1, merged2 };
    }
    
    // START SERVER for live merging
    start() {
        const http = require('http');
        
        const server = http.createServer((req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            
            if (req.url === '/') {
                this.serveInterface(res);
            } else if (req.url === '/api/merge' && req.method === 'POST') {
                this.handleMergeRequest(req, res);
            } else if (req.url === '/api/test') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                const results = this.runTests();
                res.end(JSON.stringify(results, null, 2));
            } else {
                res.writeHead(404);
                res.end('Not found');
            }
        });
        
        server.listen(this.port);
        console.log(`\n🚀 Simple Game Merger: http://localhost:${this.port}`);
        console.log('📊 70/30 rule applies to everything');
        console.log('⚡ Just works like RuneScape formulas');
    }
    
    handleMergeRequest(req, res) {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const merged = this.quickMerge(data.characterA, data.characterB);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, merged }, null, 2));
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: error.message }));
            }
        });
    }
    
    serveInterface(res) {
        const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>🎮 Simple Game Merger</title>
    <style>
        body {
            font-family: 'Courier New', monospace;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            color: #ffffff;
            margin: 0;
            padding: 20px;
            min-height: 100vh;
        }
        
        .header {
            text-align: center;
            font-size: 3em;
            color: #00ff00;
            text-shadow: 0 0 20px #00ff00;
            margin-bottom: 30px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .principle-box {
            background: rgba(0, 255, 0, 0.1);
            border: 2px solid #00ff00;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
        }
        
        .merge-section {
            display: grid;
            grid-template-columns: 1fr 150px 1fr;
            gap: 20px;
            margin: 30px 0;
        }
        
        .character-box {
            background: rgba(0, 0, 0, 0.5);
            border: 2px solid #ffffff;
            border-radius: 10px;
            padding: 20px;
        }
        
        .merge-arrow {
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 3em;
            color: #ffff00;
        }
        
        textarea {
            width: 100%;
            height: 200px;
            background: rgba(0, 0, 0, 0.7);
            color: #00ff00;
            border: 1px solid #00ff00;
            border-radius: 5px;
            padding: 10px;
            font-family: 'Courier New', monospace;
            resize: vertical;
        }
        
        button {
            background: linear-gradient(135deg, #00ff00 0%, #00cc00 100%);
            color: #000000;
            border: none;
            padding: 15px 30px;
            border-radius: 5px;
            font-size: 1.2em;
            font-weight: bold;
            cursor: pointer;
            margin: 10px 5px;
        }
        
        button:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 255, 0, 0.3);
        }
        
        .result-box {
            background: rgba(255, 255, 0, 0.1);
            border: 2px solid #ffff00;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .formula-box {
            background: rgba(0, 0, 0, 0.8);
            border: 1px solid #00ff00;
            border-radius: 5px;
            padding: 15px;
            margin: 10px 0;
            font-family: 'Courier New', monospace;
        }
        
        .test-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        
        .test-card {
            background: rgba(0, 0, 0, 0.5);
            border: 1px solid #ffffff;
            border-radius: 10px;
            padding: 15px;
        }
    </style>
</head>
<body>
    <div class="header">
        🎮 SIMPLE GAME MERGER
    </div>
    
    <div class="container">
        <div class="principle-box">
            <h2 style="color: #ffff00; margin-top: 0;">RuneScape Principle</h2>
            <div class="formula-box">
                Magic Defense = 70% × Magic Level + 30% × Defense Level
            </div>
            <p>Every merge follows this simple 70/30 rule. No complexity, just math that works.</p>
        </div>
        
        <div class="merge-section">
            <div class="character-box">
                <h3 style="color: #00ff00;">Character A</h3>
                <textarea id="charA" placeholder='{"name": "Zezima", "stats": {"attack": 99, "strength": 99, "defense": 99}, "level": 126}'></textarea>
            </div>
            
            <div class="merge-arrow">
                🔀
            </div>
            
            <div class="character-box">
                <h3 style="color: #00ff00;">Character B</h3>
                <textarea id="charB" placeholder='{"name": "Leeroy", "stats": {"strength": 800, "intellect": 400}, "level": 80}'></textarea>
            </div>
        </div>
        
        <div style="text-align: center;">
            <button onclick="mergeCharacters()">🚀 MERGE NOW</button>
            <button onclick="runTests()">🧪 RUN TESTS</button>
            <button onclick="showExamples()">📋 EXAMPLES</button>
        </div>
        
        <div id="result" class="result-box" style="display: none;">
            <h3 style="color: #ffff00; margin-top: 0;">Merged Character</h3>
            <pre id="resultText"></pre>
        </div>
        
        <div class="principle-box">
            <h3 style="color: #ffff00;">How It Works</h3>
            <div class="test-grid">
                <div class="test-card">
                    <h4 style="color: #00ff00;">1. Auto-Detect Language</h4>
                    <p>System recognizes RuneScape, WoW, Pokemon, Minecraft, etc. automatically</p>
                </div>
                <div class="test-card">
                    <h4 style="color: #00ff00;">2. Normalize Stats</h4>
                    <p>Convert all stats to universal format (str→strength, int→magic)</p>
                </div>
                <div class="test-card">
                    <h4 style="color: #00ff00;">3. Apply 70/30 Rule</h4>
                    <p>Higher stat gets 70% weight, lower gets 30% (like RS formulas)</p>
                </div>
                <div class="test-card">
                    <h4 style="color: #00ff00;">4. Calculate Derived</h4>
                    <p>Auto-generate combat level, defense values, etc.</p>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        async function mergeCharacters() {
            const charA = document.getElementById('charA').value;
            const charB = document.getElementById('charB').value;
            
            try {
                const a = JSON.parse(charA || '{}');
                const b = JSON.parse(charB || '{}');
                
                const response = await fetch('/api/merge', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ characterA: a, characterB: b })
                });
                
                const result = await response.json();
                
                document.getElementById('result').style.display = 'block';
                document.getElementById('resultText').textContent = JSON.stringify(result.merged, null, 2);
            } catch (error) {
                alert('Error: ' + error.message);
            }
        }
        
        async function runTests() {
            const response = await fetch('/api/test');
            const results = await response.json();
            
            document.getElementById('result').style.display = 'block';
            document.getElementById('resultText').textContent = JSON.stringify(results, null, 2);
        }
        
        function showExamples() {
            const examples = {
                runescape: {
                    name: 'Zezima',
                    stats: { attack: 99, strength: 99, defense: 99, magic: 99, ranged: 99 },
                    level: 126
                },
                wow: {
                    name: 'Leeroy',
                    stats: { strength: 800, agility: 600, intellect: 400, stamina: 1000 },
                    level: 80
                },
                pokemon: {
                    name: 'Pikachu',
                    stats: { hp: 100, attack: 80, defense: 70, special_attack: 90, speed: 85 },
                    level: 50
                },
                minecraft: {
                    name: 'Steve',
                    stats: { health: 20, armor: 15, experience: 30, hunger: 20 },
                    level: 25
                }
            };
            
            document.getElementById('charA').value = JSON.stringify(examples.runescape, null, 2);
            document.getElementById('charB').value = JSON.stringify(examples.wow, null, 2);
        }
        
        // Load default examples on page load
        window.onload = showExamples;
    </script>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
}

// START THE SYSTEM
if (require.main === module) {
    console.log('🎮 STARTING SIMPLE GAME MERGER SYSTEM');
    console.log('======================================');
    console.log('📊 Using RuneScape\'s 70/30 principle');
    console.log('⚡ No complexity, just predictable math');
    console.log('🔀 Auto-merge any game characters');
    console.log('');
    
    const merger = new SimpleGameMergerSystem();
    
    // Run tests first
    console.log('\n🧪 Running initial tests...');
    merger.runTests();
    
    // Start server
    merger.start();
}

module.exports = SimpleGameMergerSystem;