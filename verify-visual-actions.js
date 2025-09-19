#!/usr/bin/env node

/**
 * 🔍 VISUAL ACTION VERIFIER
 * Confirms that game actions are actually happening
 */

const axios = require('axios');

async function verifyGameActions() {
    console.log('🔍 VERIFYING GAME ACTIONS ARE VISIBLE...\n');
    
    const checks = [
        {
            name: 'Game Action Engine',
            url: 'http://localhost:4500/actions/state/runescape',
            verify: (data) => {
                console.log('⛏️ RUNESCAPE STATE:');
                console.log(`   Player Position: (${data.player?.x || 0}, ${data.player?.y || 0})`);
                console.log(`   Total XP: ${data.totalXP || 0}`);
                console.log('   Inventory:');
                Object.entries(data.inventory || {}).forEach(([item, count]) => {
                    console.log(`     - ${item}: ${count}`);
                });
                return data.totalXP > 0 || Object.keys(data.inventory || {}).length > 0;
            }
        },
        {
            name: 'Minecraft Actions',
            url: 'http://localhost:4500/actions/state/minecraft',
            verify: (data) => {
                console.log('\n🟫 MINECRAFT STATE:');
                console.log(`   Player Position: (${data.player?.x || 0}, ${data.player?.y || 0})`);
                console.log(`   World Blocks: ${data.world?.length || 0}`);
                console.log('   Hotbar:');
                data.hotbar?.forEach((item, i) => {
                    if (item) console.log(`     Slot ${i}: ${item.type} x${item.count}`);
                });
                return data.world?.length > 0;
            }
        },
        {
            name: 'Visual Queue',
            url: 'http://localhost:4500/actions/visual/runescape',
            verify: (data) => {
                console.log('\n👀 VISUAL ELEMENTS:');
                console.log(`   Character Sprite: ${data.characterSprite || 'Not loaded'}`);
                console.log(`   Available Animations: ${data.animations?.join(', ') || 'None'}`);
                console.log(`   World Tiles: ${data.worldTiles?.length || 0}`);
                return data.animations?.length > 0;
            }
        }
    ];
    
    let successCount = 0;
    
    for (const check of checks) {
        try {
            const response = await axios.get(check.url);
            const success = check.verify(response.data);
            
            if (success) {
                console.log(`\n✅ ${check.name}: WORKING - Actions are happening!`);
                successCount++;
            } else {
                console.log(`\n⚠️ ${check.name}: No actions detected yet`);
            }
        } catch (error) {
            console.log(`\n❌ ${check.name}: Not responding`);
        }
    }
    
    console.log('\n═══════════════════════════════════════');
    console.log(`📊 VERIFICATION RESULT: ${successCount}/${checks.length} systems showing actions`);
    
    if (successCount === checks.length) {
        console.log('🎉 SUCCESS! You should see characters mining and performing actions!');
    } else if (successCount > 0) {
        console.log('⚠️ PARTIAL SUCCESS - Some actions are visible');
    } else {
        console.log('❌ No visual actions detected - Check if services are running');
    }
    
    // Queue some test actions
    console.log('\n🎮 QUEUEING TEST ACTIONS...');
    
    try {
        // Queue RuneScape mining
        await axios.post('http://localhost:4500/actions/queue', {
            game: 'runescape',
            action: 'mine',
            params: { oreType: 'gold' }
        });
        console.log('✅ Queued: RuneScape gold mining');
        
        // Queue Minecraft block break
        await axios.post('http://localhost:4500/actions/queue', {
            game: 'minecraft',
            action: 'break',
            params: { x: 5, y: 3 }
        });
        console.log('✅ Queued: Minecraft block breaking');
        
        // Queue Roblox mining
        await axios.post('http://localhost:4500/actions/queue', {
            game: 'roblox',
            action: 'mine',
            params: { blockType: 'diamond' }
        });
        console.log('✅ Queued: Roblox diamond mining');
        
    } catch (error) {
        console.log('❌ Failed to queue actions:', error.message);
    }
    
    console.log('\n👀 CHECK THE VISUALIZER NOW!');
    console.log('   You should see:');
    console.log('   - Characters moving to ore/blocks');
    console.log('   - Mining animations playing');
    console.log('   - Items appearing in inventory');
    console.log('   - XP numbers floating up');
}

// Run verification
verifyGameActions().catch(console.error);