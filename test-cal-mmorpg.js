#!/usr/bin/env node

/**
 * TEST CAL MMORPG SYSTEM
 * Demonstrates the unified "inside out and outside in and middle out" architecture
 */

const CALUnifiedMMORPG = require('./cal-mmorpg-unified-system');
const VehicleShipSystem = require('./cal-vehicle-ship-system');
const UnixSuperuserSystem = require('./cal-unix-superuser-system');

async function testMMORPG() {
    console.log('🎮 Testing CAL MMORPG Unified System...\n');
    
    // Initialize systems
    const mmorpg = new CALUnifiedMMORPG();
    const vehicleSystem = new VehicleShipSystem();
    const unixSystem = new UnixSuperuserSystem();
    
    // Integrate vehicle system with MMORPG
    mmorpg.vehicleSystem = vehicleSystem;
    mmorpg.unixSystem = unixSystem;
    
    // Test vehicle spawning
    console.log('🚗 Testing Vehicle System:');
    const sportsCar = vehicleSystem.spawnVehicle('sportscar', 'land', {
        x: 100, y: 0, z: 100
    });
    console.log(`- Spawned ${sportsCar.name} at (100, 0, 100)`);
    
    const helicopter = vehicleSystem.spawnVehicle('helicopter', 'air', {
        x: 200, y: 50, z: 200
    });
    console.log(`- Spawned ${helicopter.name} at (200, 50, 200)`);
    
    const timeMachine = vehicleSystem.spawnVehicle('timeMachine', 'special', {
        x: 88, y: 0, z: 88
    });
    console.log(`- Spawned ${timeMachine.name} at (88, 0, 88)`);
    
    // Test Unix system
    console.log('\n💻 Testing Unix Superuser System:');
    const sessionId = unixSystem.createSession('test-player-123');
    console.log(`- Created session: ${sessionId}`);
    
    // Execute some commands
    const commands = [
        'whoami',
        'pwd',
        'ls /',
        'cd /game',
        'ls',
        'ps',
        'grep reality',
        'cat /proc/cpuinfo',
        'echo "test" > /dev/game'
    ];
    
    for (const cmd of commands) {
        const result = await unixSystem.executeCommand(sessionId, cmd);
        console.log(`\n$ ${cmd}`);
        if (result.output) {
            console.log(result.output);
        } else if (result.error) {
            console.log(`Error: ${result.error}`);
        }
    }
    
    // Test cheatcodes
    console.log('\n🎮 Testing Cheatcodes:');
    const cheats = ['HESOYAM', 'CAL_OMNISCIENCE'];
    
    for (const cheat of cheats) {
        const result = await unixSystem.executeCommand(sessionId, cheat);
        console.log(`- ${cheat}: ${result.output || result.error}`);
    }
    
    // Test MMORPG architecture
    console.log('\n🌐 MMORPG Architecture:');
    console.log('- Inside-Out:', mmorpg.architecture.insideOut.layers.join(' → '));
    console.log('- Outside-In:', mmorpg.architecture.outsideIn.layers.join(' → '));
    console.log('- Middle-Out:', mmorpg.architecture.middleOut.expansion.join(', '));
    
    // Test game worlds
    console.log('\n🗺️ Available Game Worlds:');
    Object.entries(mmorpg.gameWorlds).forEach(([key, world]) => {
        console.log(`- ${world.name} (${world.type})`);
        console.log(`  Features: ${world.features.join(', ')}`);
    });
    
    // Demonstrate vehicle physics update
    console.log('\n⚙️ Testing Vehicle Physics:');
    sportsCar.engineOn = true;
    sportsCar.acceleration = { x: 10, y: 0, z: 0 };
    
    // Simulate 5 physics updates
    for (let i = 0; i < 5; i++) {
        vehicleSystem.updatePhysics(sportsCar.id, 0.1); // 100ms delta
        const speed = Math.sqrt(
            sportsCar.velocity.x ** 2 + sportsCar.velocity.z ** 2
        );
        console.log(`- Update ${i + 1}: Position (${sportsCar.position.x.toFixed(1)}, ${sportsCar.position.z.toFixed(1)}), Speed: ${speed.toFixed(1)}`);
    }
    
    // Test special vehicle condition (time travel at 88mph)
    console.log('\n⚡ Testing Time Machine:');
    timeMachine.engineOn = true;
    timeMachine.velocity = { x: 40, y: 0, z: 0 }; // ~89.4 mph
    
    vehicleSystem.on('special_condition_met', (data) => {
        console.log(`- Special condition met: ${data.condition} for ${data.vehicle.name}!`);
    });
    
    vehicleSystem.checkSpecialConditions(timeMachine);
    
    // Test Unix process management
    console.log('\n🔧 Testing Process Management:');
    const newPid = unixSystem.spawnProcess('test-game', 'test-player-123');
    console.log(`- Spawned process with PID: ${newPid}`);
    
    const psResult = await unixSystem.executeCommand(sessionId, 'ps');
    console.log('- Current processes:');
    console.log(psResult.output);
    
    // Demonstrate the unified system
    console.log('\n✨ Unified System Integration:');
    console.log('- CAL MMORPG: Active');
    console.log('- Vehicle System: ' + vehicleSystem.activeVehicles.size + ' vehicles');
    console.log('- Unix System: ' + unixSystem.sessions.size + ' sessions');
    console.log('- Architecture: Inside-Out ↔ Outside-In ↔ Middle-Out');
    
    console.log('\n🎮 CAL MMORPG System Test Complete!');
    console.log('The system is ready for "ships and vehicles and all types of stuff from like gta and gaming"!');
}

// Run the test
testMMORPG().catch(console.error);