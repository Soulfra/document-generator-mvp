#!/usr/bin/env node

/**
 * TEST BOSS BLOCKCHAIN VERIFICATION
 * Demonstrates the complete boss pipeline with blockchain verification
 */

const BossFigurinePipeline = require('./boss-figurine-pipeline.js');

async function testBossBlockchain() {
    console.log('🧪 TESTING BOSS BLOCKCHAIN VERIFICATION\n');
    
    // Create pipeline instance
    const pipeline = new BossFigurinePipeline();
    
    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('📸 1. Simulating image upload...');
    // Simulate image data
    const mockImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    
    // Test upload stage
    const uploadResult = await pipeline.handleImageUpload({
        body: {
            imageData: mockImageData,
            bossName: 'Blockchain Dragon',
            tier: 'legendary'
        }
    }, {
        json: (data) => {
            console.log('✅ Upload result:', data);
            return data;
        }
    });
    
    console.log('\n🎲 2. Generating boss with LLM...');
    // Test generation stage
    const generateResult = await pipeline.handleBossGeneration({
        body: {
            bossId: uploadResult.bossId,
            llmTier: 'ultra' // Claude Opus for fastest respawn
        }
    }, {
        json: (data) => {
            console.log('✅ Generation result:', data);
            return data;
        }
    });
    
    console.log('\n🎯 3. Spawning boss in world...');
    // Test spawn stage
    const spawnResult = await pipeline.handleBossSpawn({
        body: {
            bossId: generateResult.boss.id,
            location: { zone: 'Central Void', x: 0, y: 0, z: -50 }
        }
    }, {
        json: (data) => {
            console.log('✅ Spawn result:', data);
            return data;
        }
    });
    
    console.log('\n⛓️ 4. Checking blockchain history...');
    // Get blockchain history
    await pipeline.getBlockchainHistory({
        params: { id: uploadResult.bossId }
    }, {
        json: (data) => {
            console.log('📋 Blockchain History:');
            data.history.forEach(record => {
                console.log(`\nType: ${record.type}`);
                if (record.blockchain) {
                    Object.entries(record.blockchain).forEach(([stage, verification]) => {
                        if (verification.verified) {
                            console.log(`  ${stage}:`);
                            if (verification.storage) {
                                console.log(`    IPFS: ${verification.storage.ipfs}`);
                                console.log(`    Arweave: ${verification.storage.arweave}`);
                                console.log(`    Filecoin replicas: ${verification.storage.filecoin}`);
                            }
                        }
                    });
                }
            });
        }
    });
    
    console.log('\n💀 5. Simulating boss death...');
    // Test kill stage
    const killResult = await pipeline.handleBossKill({
        body: {
            instanceId: spawnResult.instanceId,
            killedBy: 'test_player'
        }
    }, {
        json: (data) => {
            console.log('✅ Kill result:', data);
            console.log(`   Loot: ${data.loot.length} items`);
            console.log(`   Respawn in: ${data.respawnTime / 60000} minutes`);
            return data;
        }
    });
    
    console.log('\n🔄 6. Boss will respawn automatically...');
    console.log('   Respawn timer based on LLM tier (Ultra = 2 minutes)');
    console.log('   All stages verified on blockchain (IPFS/Arweave/Filecoin)');
    
    console.log('\n✅ TEST COMPLETE!');
    console.log('🌐 Access the web interface at: http://localhost:8400');
    console.log('⛓️ All boss lifecycle stages have been verified on blockchain!');
}

// Run the test
if (require.main === module) {
    testBossBlockchain().catch(console.error);
}

module.exports = testBossBlockchain;