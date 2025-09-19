#!/usr/bin/env node

/**
 * 🌍 UNIFIED 1000-PORT WORLD QUICK DEMO
 * 
 * A faster demo that shows key concepts without generating all 9000 worlds
 */

const crypto = require('crypto');

// Simplified port registry for demo
class QuickPortRegistry {
    constructor() {
        this.portWorlds = new Map();
        this.worldCategories = {
            foundation: { range: [1000, 1999], name: 'Foundation Worlds' },
            intermediate: { range: [2000, 2999], name: 'Intermediate Worlds' },
            advanced: { range: [3000, 3999], name: 'Advanced Worlds' },
            economic: { range: [8000, 8999], name: 'Economic Worlds' },
            nexus: { range: [9999, 9999], name: 'The Nexus' }
        };
        
        // Only generate a few key worlds for demo
        this.generateDemoWorlds();
    }
    
    generateDemoWorlds() {
        const demoWorlds = [
            { port: 1000, name: 'Hello World Haven', topic: 'Basic Programming' },
            { port: 2000, name: 'Web Scraping Ethics Realm', topic: 'Ethical Data Collection' },
            { port: 3000, name: 'MEV Discovery Domain', topic: 'Market Inefficiencies' },
            { port: 8000, name: 'Market Making Metropolis', topic: 'Trading Strategies' },
            { port: 9999, name: 'The Nexus', topic: 'Universal Knowledge Hub' }
        ];
        
        demoWorlds.forEach(world => {
            this.portWorlds.set(world.port, world);
        });
    }
    
    getWorld(port) {
        return this.portWorlds.get(port);
    }
}

// Simplified card generator
class QuickCardGenerator {
    generateCard(text) {
        const hash = crypto.createHash('sha256').update(text).digest('hex');
        const rarityRoll = parseInt(hash.substring(0, 2), 16) / 255;
        
        let rarity = 'common';
        if (rarityRoll > 0.95) rarity = 'legendary';
        else if (rarityRoll > 0.85) rarity = 'epic';
        else if (rarityRoll > 0.70) rarity = 'rare';
        else if (rarityRoll > 0.40) rarity = 'uncommon';
        
        const cardTypes = ['spell', 'creature', 'artifact', 'concept'];
        const type = cardTypes[parseInt(hash.substring(2, 4), 16) % cardTypes.length];
        
        return {
            id: `CARD-${hash.substring(0, 8).toUpperCase()}`,
            name: this.generateName(text),
            type,
            rarity,
            value: { common: 10, uncommon: 25, rare: 100, epic: 500, legendary: 2500 }[rarity],
            description: text.substring(0, 100) + '...',
            universalId: `204-${hash.substring(0, 8).toUpperCase()}-${hash.charCodeAt(0) % 10}`
        };
    }
    
    generateName(text) {
        const words = text.split(/\s+/).filter(w => w.length > 4);
        const keyword = words[0] || 'Mystic';
        const nouns = ['Codex', 'Algorithm', 'Protocol', 'Matrix', 'Cipher'];
        return `${keyword} ${nouns[text.length % nouns.length]}`;
    }
}

async function runQuickDemo() {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║     🌍 UNIFIED 1000-PORT WORLD PLATFORM - QUICK DEMO 🌍       ║
╚══════════════════════════════════════════════════════════════╝
    `);
    
    const portRegistry = new QuickPortRegistry();
    const cardGenerator = new QuickCardGenerator();
    
    // Demo 1: Port to World Mapping
    console.log('\n📍 DEMO 1: PORT → WORLD MAPPING');
    console.log('════════════════════════════════\n');
    
    console.log('Sample port mappings:');
    [1000, 2000, 3000, 8000, 9999].forEach(port => {
        const world = portRegistry.getWorld(port);
        console.log(`  Port ${port} → ${world.name} (${world.topic})`);
    });
    
    // Demo 2: Text to Card
    console.log('\n🃏 DEMO 2: TEXT → CARD GENERATION');
    console.log('══════════════════════════════════\n');
    
    const sampleTexts = [
        'A powerful algorithm that optimizes database queries using machine learning',
        'An ancient firewall technique passed down through generations of hackers',
        'The secret to finding market inefficiencies before anyone else'
    ];
    
    console.log('Generating cards from text:');
    sampleTexts.forEach(text => {
        const card = cardGenerator.generateCard(text);
        console.log(`\n📝 "${text.substring(0, 50)}..."`);
        console.log(`  → ${card.rarity.toUpperCase()} ${card.type}: ${card.name}`);
        console.log(`  → Value: ${card.value} coins`);
        console.log(`  → Universal ID: ${card.universalId}`);
    });
    
    // Demo 3: Educational Progression
    console.log('\n🎓 DEMO 3: EDUCATIONAL PROGRESSION');
    console.log('═══════════════════════════════════\n');
    
    console.log('Learning Path:');
    console.log('  1. Start at Port 1000 (Foundation)');
    console.log('     → Learn: Basic Programming');
    console.log('     → Unlock: Variables, Functions, Loops');
    console.log('  2. Progress to Port 2000 (Intermediate)');
    console.log('     → Learn: Web Scraping Ethics');
    console.log('     → Unlock: API Access, Rate Limiting');
    console.log('  3. Advanced to Port 3000 (Advanced)');
    console.log('     → Learn: MEV Discovery');
    console.log('     → Unlock: Market Analysis, Arbitrage');
    console.log('  4. Master at Port 8000 (Economic)');
    console.log('     → Learn: Market Making');
    console.log('     → Unlock: Trading Strategies');
    console.log('  5. Transcend at Port 9999 (Nexus)');
    console.log('     → Access: All Knowledge');
    console.log('     → Become: Master Teacher');
    
    // Demo 4: Injury System
    console.log('\n🤕 DEMO 4: INJURY/PENALTY SYSTEM');
    console.log('═════════════════════════════════\n');
    
    const violations = [
        { type: 'rate-limit-violation', penalty: '5 min timeout, -10 XP' },
        { type: 'unethical-scraping', penalty: '15 min timeout, -50 XP' },
        { type: 'copyright-violation', penalty: '15 min timeout, -50 XP' },
        { type: 'cheating', penalty: '24 hour ban, -1000 XP' }
    ];
    
    console.log('Ethical Violations & Penalties:');
    violations.forEach(v => {
        console.log(`  ⚠️ ${v.type}: ${v.penalty}`);
    });
    
    // Demo 5: MEV Opportunities
    console.log('\n💎 DEMO 5: MEV-STYLE OPPORTUNITIES');
    console.log('═══════════════════════════════════\n');
    
    console.log('Hidden opportunities appear randomly in Economic Worlds:');
    console.log('  🔍 Small: 100 XP + 100 coins (common)');
    console.log('  💎 Medium: 2000 XP + 500 coins (uncommon)');
    console.log('  🏆 Large: 10000 XP + 2500 coins (rare)');
    console.log('  ⭐ Legendary: 50000 XP + 10000 coins (ultra-rare)');
    console.log('\n  → Time-sensitive: 5 minute windows');
    console.log('  → First discoverer gets full rewards');
    console.log('  → Teaches real market analysis skills');
    
    // Demo 6: Universal IDs
    console.log('\n🏷️ DEMO 6: UNIVERSAL ENTITY IDS');
    console.log('═════════════════════════════════\n');
    
    console.log('Every entity gets a UPC-style universal ID:');
    console.log('  Format: PREFIX-HASH-CHECKSUM\n');
    
    const examples = [
        { type: 'Player', prefix: '100', example: '100-A3F2B891-7' },
        { type: 'World', prefix: '001', example: '001-FF00AA12-3' },
        { type: 'Card', prefix: '204', example: '204-DEADBEEF-9' },
        { type: 'Opportunity', prefix: '403', example: '403-MEV00001-5' },
        { type: 'Achievement', prefix: '203', example: '203-MASTER01-2' }
    ];
    
    examples.forEach(ex => {
        console.log(`  ${ex.type}: ${ex.example}`);
    });
    
    // Demo 7: The Vision
    console.log('\n🚀 DEMO 7: THE COMPLETE VISION');
    console.log('═══════════════════════════════\n');
    
    console.log('1000 Ports = 1000 Worlds = 1000 Learning Experiences\n');
    
    console.log('Players journey through worlds:');
    console.log('  → Complete lessons to earn XP');
    console.log('  → Generate cards from learned content');
    console.log('  → Discover hidden MEV opportunities');
    console.log('  → Avoid ethical violations (injuries)');
    console.log('  → Trade cards with other players');
    console.log('  → Build MVPs from card collections');
    console.log('  → Teach others to earn bonus XP');
    console.log('  → Master all 1000 worlds');
    
    console.log('\nEvery action tracked with Universal IDs');
    console.log('Every relationship mapped and valued');
    console.log('Every discovery rewarded appropriately');
    
    console.log('\n✨ The Result:');
    console.log('  A massive multiplayer educational game');
    console.log('  Where learning = playing = earning');
    console.log('  And knowledge becomes tradeable assets');
    
    // Summary
    console.log('\n═══════════════════════════════════════════');
    console.log('📊 SYSTEM CAPABILITIES');
    console.log('═══════════════════════════════════════════\n');
    
    console.log('✅ Port Registry: Maps 1000-9999 to game worlds');
    console.log('✅ Card Generator: Converts any text to trading cards');
    console.log('✅ Game Engine: XP, coins, achievements, injuries');
    console.log('✅ Entity Registry: Universal IDs for everything');
    console.log('✅ MEV System: Hidden time-sensitive opportunities');
    console.log('✅ Educational: Learn real skills through gaming');
    console.log('✅ Economic: Trade knowledge as digital assets');
    
    console.log('\n🎯 Ready to scale from 1 to 1000 worlds!');
    console.log('🌍 Each world = unique educational experience');
    console.log('🃏 Each lesson = collectible trading card');
    console.log('💰 Each skill = valuable game asset');
}

// Run the quick demo
runQuickDemo().catch(console.error);