#!/usr/bin/env node

/**
 * 🌍 UNIFIED 1000-PORT WORLD DEMO
 * 
 * Demonstrates the complete educational gaming platform:
 * - 1000 interconnected worlds
 * - Universal entity system
 * - Text-to-card generation
 * - Game mechanics with injuries
 * - MEV-style opportunities
 */

const UnifiedPortRegistry = require('./unified-port-registry');
const EducationalGameWorlds = require('./educational-game-worlds');
const UniversalEntityRegistry = require('./universal-entity-registry');
const TextToCardGenerator = require('./text-to-card-generator');

async function runDemo() {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║        🌍 UNIFIED 1000-PORT EDUCATIONAL GAMING PLATFORM 🌍      ║
╠══════════════════════════════════════════════════════════════╣
║  Transform text → cards → MVPs across 1000 game worlds        ║
║  Learn programming, security, economics through gaming         ║
║  Discover hidden opportunities, avoid ethical injuries         ║
╚══════════════════════════════════════════════════════════════╝
    `);
    
    // Initialize all systems
    console.log('\n🚀 INITIALIZING SYSTEMS...\n');
    
    const entityRegistry = new UniversalEntityRegistry();
    const portRegistry = new UnifiedPortRegistry();
    const gameWorlds = new EducationalGameWorlds(portRegistry);
    const cardGenerator = new TextToCardGenerator(entityRegistry);
    
    // Wait for initialization
    await new Promise(resolve => portRegistry.once('registry:ready', resolve));
    await new Promise(resolve => gameWorlds.once('game:ready', resolve));
    
    console.log('\n✅ All systems initialized!\n');
    
    // Demo 1: Create player and explore worlds
    console.log('═══════════════════════════════════════════════════════');
    console.log('DEMO 1: PLAYER JOURNEY THROUGH WORLDS');
    console.log('═══════════════════════════════════════════════════════\n');
    
    const player = await gameWorlds.createPlayer('demo-player', 'Alice');
    console.log(`Created player: ${player.username} (Level ${player.level})`);
    
    // Enter Foundation World
    console.log('\n🌍 Entering Foundation World 1000...');
    const entry1 = await gameWorlds.enterWorld(player.id, 1000);
    console.log(`  Topic: ${entry1.world.topic}`);
    console.log(`  Skills: ${entry1.world.skills.join(', ')}`);
    console.log(`  Available actions: ${entry1.availableActions.join(', ')}`);
    
    // Complete a lesson
    console.log('\n📚 Completing a lesson...');
    const lesson = await gameWorlds.completeLesson(player.id, 'hello-world-lesson');
    console.log(`  ✅ Gained ${lesson.xpGained} XP and ${lesson.coinsGained} coins`);
    
    // Demo 2: Generate cards from lesson content
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('DEMO 2: TEXT TO CARD GENERATION');
    console.log('═══════════════════════════════════════════════════════\n');
    
    const lessonText = `
        Hello World is the traditional first program written when learning a new programming language.
        It demonstrates basic syntax and output capabilities. In Python: print("Hello, World!")
    `;
    
    const lessonCard = await cardGenerator.generateCard(lessonText);
    console.log('Generated lesson card:');
    console.log(`  Name: ${lessonCard.name}`);
    console.log(`  Type: ${lessonCard.type} (${lessonCard.rarity})`);
    console.log(`  Value: ${lessonCard.baseValue} coins`);
    console.log(`  Abilities: ${lessonCard.abilities.join(', ') || 'None'}`);
    
    // Demo 3: Economic world with MEV opportunities
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('DEMO 3: ECONOMIC WORLDS & MEV OPPORTUNITIES');
    console.log('═══════════════════════════════════════════════════════\n');
    
    // Jump to economic world (normally would require progression)
    console.log('🌍 Entering Economic World 8000...');
    const entry2 = await gameWorlds.enterWorld(player.id, 8000);
    console.log(`  Topic: ${entry2.world.topic}`);
    console.log(`  Hidden opportunities: ${entry2.opportunities} available`);
    
    // Simulate discovering an opportunity
    if (entry2.opportunities > 0) {
        console.log('\n💎 Attempting to discover hidden opportunity...');
        try {
            const discovery = await gameWorlds.discoverOpportunity(
                player.id, 
                'OPP-8000-0' // Would normally be discovered through gameplay
            );
            console.log(`  ✅ Discovered ${discovery.opportunity.size} opportunity!`);
            console.log(`  Rewards: ${discovery.rewards.xp} XP, ${discovery.rewards.coins} coins`);
        } catch (error) {
            console.log(`  ❌ ${error.message}`);
        }
    }
    
    // Demo 4: Injury system for violations
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('DEMO 4: ETHICAL VIOLATIONS & INJURY SYSTEM');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log('⚠️ Simulating rate limit violation...');
    const injury = await gameWorlds.applyInjury(player.id, 'rate-limit-violation', {
        reason: 'Too many API calls',
        world: 8000
    });
    
    console.log(`  🤕 Injury applied: ${injury.type}`);
    console.log(`  Severity: ${injury.severity}`);
    console.log(`  XP Lost: ${injury.xpLost}`);
    console.log(`  Duration: ${Math.ceil((injury.expiresAt - Date.now()) / 60000)} minutes`);
    
    // Try to enter another world while injured
    console.log('\n🚫 Attempting to enter world while injured...');
    try {
        await gameWorlds.enterWorld(player.id, 8001);
    } catch (error) {
        console.log(`  ❌ ${error.message}`);
    }
    
    // Demo 5: Cross-world card collection
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('DEMO 5: DOCUMENT TO CARD COLLECTION');
    console.log('═══════════════════════════════════════════════════════\n');
    
    const educationalDoc = `
        Web Security Fundamentals
        
        Cross-Site Scripting (XSS) occurs when malicious scripts are injected into trusted websites.
        
        SQL Injection allows attackers to interfere with database queries.
        
        Authentication ensures users are who they claim to be.
        
        Encryption protects data from unauthorized access.
    `;
    
    const securityCollection = await cardGenerator.generateCollectionFromDocument(
        educationalDoc,
        { collectionName: 'Security Basics' }
    );
    
    console.log(`Generated collection: ${securityCollection.name}`);
    console.log(`  Cards: ${securityCollection.cards.length}`);
    console.log(`  Total value: ${securityCollection.totalValue} coins`);
    console.log('\nCards in collection:');
    securityCollection.cards.forEach(card => {
        console.log(`  - ${card.name} (${card.rarity}, ${card.baseValue} coins)`);
    });
    
    // Demo 6: Entity relationships
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('DEMO 6: UNIVERSAL ENTITY TRACKING');
    console.log('═══════════════════════════════════════════════════════\n');
    
    // Create relationships between entities
    const playerEntity = entityRegistry.registerEntity('player', player.id, {
        name: player.username,
        tags: ['demo', 'beginner']
    });
    
    const worldEntity = entityRegistry.registerEntity('world', '8000', {
        name: 'Market Making World',
        tags: ['economic', 'advanced']
    });
    
    // Player visited world
    entityRegistry.createRelationship(
        playerEntity.universalId,
        worldEntity.universalId,
        'member'
    );
    
    // Card unlocked by player
    if (lessonCard.universalId) {
        entityRegistry.createRelationship(
            lessonCard.universalId,
            playerEntity.universalId,
            'owner'
        );
    }
    
    // Show entity connections
    console.log('Entity Network:');
    const relationships = entityRegistry.getRelationships(playerEntity.universalId, {
        includeEntities: true
    });
    
    relationships.forEach(rel => {
        console.log(`  ${rel.fromEntity.name} -[${rel.type}]-> ${rel.toEntity.name}`);
    });
    
    // Demo 7: System statistics
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('DEMO 7: PLATFORM STATISTICS');
    console.log('═══════════════════════════════════════════════════════\n');
    
    const registryOverview = portRegistry.getRegistryOverview();
    console.log('🌍 World Statistics:');
    console.log(`  Total worlds: ${registryOverview.totalWorlds}`);
    console.log(`  Active players: ${registryOverview.activePlayers}`);
    console.log('\n  Worlds by category:');
    Object.entries(registryOverview.categories).forEach(([cat, stats]) => {
        console.log(`    ${stats.name}: ${stats.worldCount} worlds`);
    });
    
    const playerStats = gameWorlds.getPlayerStats(player.id);
    console.log('\n👤 Player Statistics:');
    console.log(`  Level: ${playerStats.basic.level}`);
    console.log(`  XP: ${playerStats.basic.xp}`);
    console.log(`  Coins: ${playerStats.basic.coins}`);
    console.log(`  Worlds visited: ${playerStats.progress.worldsVisited}`);
    console.log(`  Achievements: ${playerStats.progress.achievements}`);
    
    const cardStats = cardGenerator.getStatistics();
    console.log('\n🃏 Card Generation Statistics:');
    console.log(`  Total generated: ${cardStats.totalGenerated}`);
    console.log(`  Unique cards: ${cardStats.uniqueCards}`);
    console.log(`  Total value: ${cardStats.totalValue} coins`);
    console.log(`  Average value: ${Math.floor(cardStats.averageValue)} coins`);
    
    const entityStats = entityRegistry.getStatistics();
    console.log('\n🏷️ Entity Registry Statistics:');
    console.log(`  Total entities: ${entityStats.totalEntities}`);
    console.log(`  Total relationships: ${entityStats.totalRelationships}`);
    console.log(`  Total discoveries: ${entityStats.totalDiscoveries}`);
    
    // Summary
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🎯 DEMO COMPLETE!');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log('Key Features Demonstrated:');
    console.log('  ✅ 1000 interconnected educational game worlds');
    console.log('  ✅ Port-based world navigation (1000-9999)');
    console.log('  ✅ Text-to-card generation with rarity system');
    console.log('  ✅ Game mechanics with XP, coins, and achievements');
    console.log('  ✅ Injury system for ethical violations');
    console.log('  ✅ MEV-style hidden opportunities');
    console.log('  ✅ Universal entity registry with relationships');
    console.log('  ✅ Document-to-collection transformation');
    
    console.log('\n🚀 Next Steps:');
    console.log('  1. Add WebSocket interface for real-time gameplay');
    console.log('  2. Implement visual card rendering');
    console.log('  3. Create web dashboard for monitoring');
    console.log('  4. Add more world content and challenges');
    console.log('  5. Implement trading and marketplace');
    console.log('  6. Add multiplayer features');
}

// Run the demo
runDemo().catch(console.error);