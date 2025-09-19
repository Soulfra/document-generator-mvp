#!/usr/bin/env node

/**
 * CAL VEHICLE & SHIP SYSTEM
 * Advanced vehicle physics and ship management for the MMORPG
 * Includes land, air, water, and special dimensional vehicles
 */

const EventEmitter = require('events');
const crypto = require('crypto');

class VehicleShipSystem extends EventEmitter {
    constructor() {
        super();
        
        // Vehicle categories with detailed physics
        this.vehicleTypes = {
            land: {
                motorcycle: {
                    name: 'Sport Bike',
                    speed: { max: 180, acceleration: 15, brake: 20 },
                    handling: { turnRate: 8, grip: 0.7, drift: 0.3 },
                    armor: 10,
                    seats: 2,
                    special: ['wheelie', 'stoppie'],
                    physics: 'wheeled'
                },
                
                sedan: {
                    name: 'Family Sedan',
                    speed: { max: 120, acceleration: 8, brake: 12 },
                    handling: { turnRate: 5, grip: 0.8, drift: 0.2 },
                    armor: 50,
                    seats: 4,
                    trunk: 100, // Storage capacity
                    physics: 'wheeled'
                },
                
                sportscar: {
                    name: 'Supercar',
                    speed: { max: 220, acceleration: 12, brake: 18 },
                    handling: { turnRate: 7, grip: 0.9, drift: 0.4 },
                    armor: 30,
                    seats: 2,
                    special: ['nitro', 'hydraulics'],
                    physics: 'wheeled'
                },
                
                truck: {
                    name: 'Monster Truck',
                    speed: { max: 80, acceleration: 5, brake: 8 },
                    handling: { turnRate: 3, grip: 0.6, drift: 0.1 },
                    armor: 100,
                    seats: 2,
                    special: ['crush', 'rampage'],
                    physics: 'wheeled'
                },
                
                tank: {
                    name: 'Battle Tank',
                    speed: { max: 40, acceleration: 2, brake: 5 },
                    handling: { turnRate: 2, grip: 1.0, drift: 0 },
                    armor: 500,
                    seats: 3,
                    weapons: ['cannon', 'machine_gun'],
                    physics: 'tracked'
                }
            },
            
            air: {
                helicopter: {
                    name: 'Attack Helicopter',
                    speed: { max: 150, acceleration: 8, brake: 10 },
                    handling: { turnRate: 6, pitch: 5, roll: 4 },
                    altitude: { min: 0, max: 5000, climb: 10 },
                    armor: 40,
                    seats: 4,
                    weapons: ['missiles', 'minigun'],
                    physics: 'rotor'
                },
                
                jet: {
                    name: 'Fighter Jet',
                    speed: { max: 400, acceleration: 20, brake: 15 },
                    handling: { turnRate: 10, pitch: 12, roll: 15 },
                    altitude: { min: 100, max: 15000, climb: 50 },
                    armor: 60,
                    seats: 2,
                    weapons: ['missiles', 'cannon'],
                    special: ['afterburner', 'barrel_roll'],
                    physics: 'jet'
                },
                
                jetpack: {
                    name: 'Personal Jetpack',
                    speed: { max: 60, acceleration: 10, brake: 12 },
                    handling: { turnRate: 12, pitch: 10, roll: 8 },
                    altitude: { min: 0, max: 1000, climb: 15 },
                    armor: 5,
                    seats: 1,
                    fuel: 100, // Limited fuel
                    physics: 'thrust'
                },
                
                spaceship: {
                    name: 'Quantum Spaceship',
                    speed: { max: 1000, acceleration: 30, brake: 25 },
                    handling: { turnRate: 5, pitch: 5, roll: 5 },
                    altitude: { min: 0, max: Infinity, climb: 100 },
                    armor: 200,
                    seats: 6,
                    special: ['warp_drive', 'shields', 'quantum_leap'],
                    physics: 'quantum'
                }
            },
            
            water: {
                jetski: {
                    name: 'Racing Jetski',
                    speed: { max: 80, acceleration: 12, brake: 15 },
                    handling: { turnRate: 10, stability: 0.6 },
                    armor: 10,
                    seats: 2,
                    special: ['jump', 'turbo'],
                    physics: 'hydroplane'
                },
                
                speedboat: {
                    name: 'Speed Boat',
                    speed: { max: 100, acceleration: 10, brake: 12 },
                    handling: { turnRate: 7, stability: 0.7 },
                    armor: 30,
                    seats: 6,
                    storage: 50,
                    physics: 'displacement'
                },
                
                yacht: {
                    name: 'Luxury Yacht',
                    speed: { max: 40, acceleration: 3, brake: 5 },
                    handling: { turnRate: 2, stability: 0.9 },
                    armor: 80,
                    seats: 20,
                    special: ['party_mode', 'helipad'],
                    luxury: true,
                    physics: 'displacement'
                },
                
                submarine: {
                    name: 'Stealth Submarine',
                    speed: { max: 40, acceleration: 4, brake: 6 },
                    handling: { turnRate: 3, pitch: 4, stability: 1.0 },
                    depth: { min: -1000, max: 0, dive: 5 },
                    armor: 150,
                    seats: 4,
                    weapons: ['torpedoes'],
                    special: ['sonar', 'stealth'],
                    physics: 'submersible'
                }
            },
            
            special: {
                timeMachine: {
                    name: 'DeLorean Time Machine',
                    speed: { max: 88, acceleration: 10, brake: 12 },
                    handling: { turnRate: 6, grip: 0.7 },
                    armor: 50,
                    seats: 2,
                    special: ['time_travel', 'hover_mode'],
                    requirement: 'speed >= 88mph',
                    physics: 'temporal'
                },
                
                teleporter: {
                    name: 'Quantum Teleporter',
                    speed: { max: 0, acceleration: Infinity, brake: Infinity },
                    range: 1000,
                    armor: 100,
                    seats: 1,
                    special: ['instant_travel', 'phase_shift'],
                    cooldown: 30,
                    physics: 'quantum'
                },
                
                mindShip: {
                    name: 'Consciousness Vessel',
                    speed: { max: 'thought', acceleration: 'instant' },
                    dimensions: ['physical', 'astral', 'mental'],
                    armor: Infinity,
                    seats: 'all_connected_minds',
                    special: ['collective_consciousness', 'reality_bend'],
                    physics: 'metaphysical'
                },
                
                calMobile: {
                    name: 'CAL Integration Vehicle',
                    speed: { max: 'variable', acceleration: 'adaptive' },
                    ai: true,
                    learning: true,
                    armor: 'regenerative',
                    seats: 'dynamic',
                    special: ['ai_assist', 'predictive_driving', 'quantum_navigation'],
                    physics: 'hybrid'
                }
            }
        };
        
        // Active vehicles in the world
        this.activeVehicles = new Map();
        
        // Physics engine settings
        this.physics = {
            gravity: 9.81,
            airResistance: 0.02,
            waterResistance: 0.1,
            friction: {
                road: 0.8,
                dirt: 0.6,
                ice: 0.2,
                water: 0.1
            }
        };
        
        // Damage system
        this.damageTypes = {
            collision: { multiplier: 1.0 },
            explosion: { multiplier: 2.0 },
            bullet: { multiplier: 0.5 },
            environmental: { multiplier: 0.3 }
        };
    }
    
    /**
     * Spawn a new vehicle in the world
     */
    spawnVehicle(type, category, position, options = {}) {
        const vehicleTemplate = this.vehicleTypes[category]?.[type];
        if (!vehicleTemplate) {
            throw new Error(`Unknown vehicle: ${category}/${type}`);
        }
        
        const vehicleId = crypto.randomBytes(16).toString('hex');
        const vehicle = {
            id: vehicleId,
            type,
            category,
            ...JSON.parse(JSON.stringify(vehicleTemplate)), // Deep clone
            position: { ...position },
            rotation: { yaw: 0, pitch: 0, roll: 0 },
            velocity: { x: 0, y: 0, z: 0 },
            acceleration: { x: 0, y: 0, z: 0 },
            health: 100,
            fuel: 100,
            passengers: new Map(),
            driver: null,
            engineOn: false,
            locked: options.locked || false,
            owner: options.owner || null,
            customization: options.customization || {},
            damage: {
                engine: 0,
                body: 0,
                wheels: 0,
                windows: 0
            },
            state: 'idle',
            spawnTime: Date.now()
        };
        
        // Special vehicle properties
        if (vehicle.physics === 'quantum') {
            vehicle.quantumState = 'collapsed';
            vehicle.entanglement = null;
        }
        
        if (vehicle.ai) {
            vehicle.aiState = {
                mode: 'passive',
                target: null,
                learning: []
            };
        }
        
        this.activeVehicles.set(vehicleId, vehicle);
        this.emit('vehicle_spawned', vehicle);
        
        return vehicle;
    }
    
    /**
     * Player enters vehicle
     */
    enterVehicle(playerId, vehicleId, seat = 'driver') {
        const vehicle = this.activeVehicles.get(vehicleId);
        if (!vehicle) return { success: false, message: 'Vehicle not found' };
        
        // Check if vehicle is locked
        if (vehicle.locked && vehicle.owner !== playerId) {
            return { success: false, message: 'Vehicle is locked' };
        }
        
        // Check seat availability
        if (seat === 'driver' && vehicle.driver) {
            return { success: false, message: 'Driver seat occupied' };
        }
        
        if (vehicle.passengers.size >= vehicle.seats) {
            return { success: false, message: 'Vehicle is full' };
        }
        
        // Enter vehicle
        if (seat === 'driver') {
            vehicle.driver = playerId;
        }
        vehicle.passengers.set(playerId, { seat, enteredAt: Date.now() });
        
        this.emit('player_entered_vehicle', { playerId, vehicle, seat });
        
        return { success: true, vehicle };
    }
    
    /**
     * Player exits vehicle
     */
    exitVehicle(playerId, vehicleId) {
        const vehicle = this.activeVehicles.get(vehicleId);
        if (!vehicle) return { success: false };
        
        if (vehicle.driver === playerId) {
            vehicle.driver = null;
            vehicle.engineOn = false;
        }
        
        vehicle.passengers.delete(playerId);
        
        this.emit('player_exited_vehicle', { playerId, vehicleId });
        
        return { success: true };
    }
    
    /**
     * Update vehicle physics
     */
    updatePhysics(vehicleId, deltaTime) {
        const vehicle = this.activeVehicles.get(vehicleId);
        if (!vehicle || !vehicle.engineOn) return;
        
        // Apply physics based on vehicle type
        switch (vehicle.physics) {
            case 'wheeled':
            case 'tracked':
                this.updateGroundVehicle(vehicle, deltaTime);
                break;
                
            case 'rotor':
            case 'jet':
            case 'thrust':
                this.updateAirVehicle(vehicle, deltaTime);
                break;
                
            case 'hydroplane':
            case 'displacement':
            case 'submersible':
                this.updateWaterVehicle(vehicle, deltaTime);
                break;
                
            case 'quantum':
            case 'temporal':
            case 'metaphysical':
                this.updateSpecialVehicle(vehicle, deltaTime);
                break;
        }
        
        // Update fuel consumption
        if (vehicle.fuel !== undefined && vehicle.engineOn) {
            vehicle.fuel = Math.max(0, vehicle.fuel - (deltaTime * 0.1));
            if (vehicle.fuel === 0) {
                vehicle.engineOn = false;
                this.emit('vehicle_out_of_fuel', vehicle);
            }
        }
        
        // Check for special conditions
        this.checkSpecialConditions(vehicle);
    }
    
    updateGroundVehicle(vehicle, deltaTime) {
        // Apply acceleration
        if (vehicle.acceleration.x !== 0 || vehicle.acceleration.z !== 0) {
            const accelMagnitude = Math.sqrt(
                vehicle.acceleration.x ** 2 + vehicle.acceleration.z ** 2
            );
            
            // Limit to max acceleration
            const maxAccel = vehicle.speed.acceleration;
            if (accelMagnitude > maxAccel) {
                const scale = maxAccel / accelMagnitude;
                vehicle.acceleration.x *= scale;
                vehicle.acceleration.z *= scale;
            }
            
            // Apply acceleration to velocity
            vehicle.velocity.x += vehicle.acceleration.x * deltaTime;
            vehicle.velocity.z += vehicle.acceleration.z * deltaTime;
        }
        
        // Apply friction
        const friction = this.physics.friction.road * (1 - vehicle.damage.wheels / 100);
        vehicle.velocity.x *= (1 - friction * deltaTime);
        vehicle.velocity.z *= (1 - friction * deltaTime);
        
        // Limit to max speed
        const speed = Math.sqrt(vehicle.velocity.x ** 2 + vehicle.velocity.z ** 2);
        const maxSpeed = vehicle.speed.max * (1 - vehicle.damage.engine / 200);
        
        if (speed > maxSpeed) {
            const scale = maxSpeed / speed;
            vehicle.velocity.x *= scale;
            vehicle.velocity.z *= scale;
        }
        
        // Update position
        vehicle.position.x += vehicle.velocity.x * deltaTime;
        vehicle.position.z += vehicle.velocity.z * deltaTime;
        
        // Handle turning
        if (Math.abs(vehicle.velocity.x) > 0.1 || Math.abs(vehicle.velocity.z) > 0.1) {
            const turnInput = vehicle.turnInput || 0;
            vehicle.rotation.yaw += turnInput * vehicle.handling.turnRate * deltaTime;
        }
    }
    
    updateAirVehicle(vehicle, deltaTime) {
        // Apply thrust
        if (vehicle.engineOn) {
            const thrust = vehicle.speed.acceleration;
            vehicle.acceleration.x = Math.sin(vehicle.rotation.yaw) * thrust;
            vehicle.acceleration.z = Math.cos(vehicle.rotation.yaw) * thrust;
            
            // Vertical thrust for helicopters
            if (vehicle.physics === 'rotor') {
                vehicle.acceleration.y = vehicle.throttle * vehicle.altitude.climb;
            }
        }
        
        // Apply gravity
        if (vehicle.position.y > 0) {
            vehicle.acceleration.y -= this.physics.gravity;
        }
        
        // Apply air resistance
        vehicle.velocity.x *= (1 - this.physics.airResistance * deltaTime);
        vehicle.velocity.y *= (1 - this.physics.airResistance * deltaTime);
        vehicle.velocity.z *= (1 - this.physics.airResistance * deltaTime);
        
        // Update velocity and position
        vehicle.velocity.x += vehicle.acceleration.x * deltaTime;
        vehicle.velocity.y += vehicle.acceleration.y * deltaTime;
        vehicle.velocity.z += vehicle.acceleration.z * deltaTime;
        
        vehicle.position.x += vehicle.velocity.x * deltaTime;
        vehicle.position.y += vehicle.velocity.y * deltaTime;
        vehicle.position.z += vehicle.velocity.z * deltaTime;
        
        // Altitude limits
        vehicle.position.y = Math.max(0, Math.min(vehicle.altitude.max, vehicle.position.y));
    }
    
    updateWaterVehicle(vehicle, deltaTime) {
        // Buoyancy and water physics
        const waterLevel = 0; // Sea level
        
        if (vehicle.physics === 'submersible') {
            // Submarine can go below water
            const diveRate = vehicle.diveInput || 0;
            vehicle.velocity.y = diveRate * vehicle.depth.dive;
            
            vehicle.position.y = Math.max(
                vehicle.depth.min,
                Math.min(waterLevel, vehicle.position.y + vehicle.velocity.y * deltaTime)
            );
        } else {
            // Surface vehicles stay at water level
            vehicle.position.y = waterLevel;
        }
        
        // Water resistance
        vehicle.velocity.x *= (1 - this.physics.waterResistance * deltaTime);
        vehicle.velocity.z *= (1 - this.physics.waterResistance * deltaTime);
        
        // Apply thrust
        if (vehicle.engineOn) {
            const thrust = vehicle.speed.acceleration;
            vehicle.velocity.x += Math.sin(vehicle.rotation.yaw) * thrust * deltaTime;
            vehicle.velocity.z += Math.cos(vehicle.rotation.yaw) * thrust * deltaTime;
        }
        
        // Update position
        vehicle.position.x += vehicle.velocity.x * deltaTime;
        vehicle.position.z += vehicle.velocity.z * deltaTime;
    }
    
    updateSpecialVehicle(vehicle, deltaTime) {
        switch (vehicle.type) {
            case 'timeMachine':
                // Check for time travel activation
                const speed = Math.sqrt(
                    vehicle.velocity.x ** 2 + vehicle.velocity.z ** 2
                ) * 2.237; // Convert to mph
                
                if (speed >= 88 && !vehicle.timeTraveling) {
                    vehicle.timeTraveling = true;
                    this.emit('time_travel_activated', vehicle);
                }
                break;
                
            case 'teleporter':
                // Instant position change
                if (vehicle.teleportTarget) {
                    vehicle.position = { ...vehicle.teleportTarget };
                    vehicle.teleportTarget = null;
                    vehicle.lastTeleport = Date.now();
                    this.emit('teleport_complete', vehicle);
                }
                break;
                
            case 'mindShip':
                // Consciousness-based movement
                if (vehicle.thoughtDestination) {
                    // Smooth interpolation to thought destination
                    const dx = vehicle.thoughtDestination.x - vehicle.position.x;
                    const dz = vehicle.thoughtDestination.z - vehicle.position.z;
                    const distance = Math.sqrt(dx * dx + dz * dz);
                    
                    if (distance > 1) {
                        vehicle.position.x += (dx / distance) * 10 * deltaTime;
                        vehicle.position.z += (dz / distance) * 10 * deltaTime;
                    }
                }
                break;
                
            case 'calMobile':
                // AI-driven adaptive physics
                if (vehicle.aiState.mode === 'active') {
                    this.updateAIVehicle(vehicle, deltaTime);
                }
                break;
        }
    }
    
    updateAIVehicle(vehicle, deltaTime) {
        // CAL's adaptive driving
        if (vehicle.aiState.target) {
            const target = vehicle.aiState.target;
            const dx = target.x - vehicle.position.x;
            const dz = target.z - vehicle.position.z;
            
            // Calculate optimal path
            const targetAngle = Math.atan2(dx, dz);
            let angleDiff = targetAngle - vehicle.rotation.yaw;
            
            // Normalize angle
            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
            
            // Smooth turning
            vehicle.rotation.yaw += angleDiff * 0.1;
            
            // Adaptive speed based on conditions
            const distance = Math.sqrt(dx * dx + dz * dz);
            const targetSpeed = Math.min(vehicle.speed.max, distance * 2);
            
            // Learn from driving patterns
            vehicle.aiState.learning.push({
                conditions: { distance, angle: angleDiff },
                action: { speed: targetSpeed, turn: angleDiff * 0.1 },
                timestamp: Date.now()
            });
            
            // Keep learning history manageable
            if (vehicle.aiState.learning.length > 1000) {
                vehicle.aiState.learning.shift();
            }
        }
    }
    
    /**
     * Apply damage to vehicle
     */
    applyDamage(vehicleId, amount, type = 'collision', part = 'body') {
        const vehicle = this.activeVehicles.get(vehicleId);
        if (!vehicle) return;
        
        const damageMultiplier = this.damageTypes[type]?.multiplier || 1.0;
        const finalDamage = amount * damageMultiplier;
        
        // Apply damage to specific part
        if (vehicle.damage[part] !== undefined) {
            vehicle.damage[part] = Math.min(100, vehicle.damage[part] + finalDamage);
        }
        
        // Overall health
        vehicle.health = Math.max(0, vehicle.health - finalDamage);
        
        // Check if vehicle is destroyed
        if (vehicle.health === 0) {
            vehicle.state = 'destroyed';
            vehicle.engineOn = false;
            this.emit('vehicle_destroyed', vehicle);
            
            // Eject all passengers
            vehicle.passengers.forEach((passenger, playerId) => {
                this.exitVehicle(playerId, vehicleId);
            });
        }
        
        this.emit('vehicle_damaged', { vehicle, damage: finalDamage, type, part });
    }
    
    /**
     * Repair vehicle
     */
    repairVehicle(vehicleId, amount = 100) {
        const vehicle = this.activeVehicles.get(vehicleId);
        if (!vehicle || vehicle.state === 'destroyed') return;
        
        // Repair health
        vehicle.health = Math.min(100, vehicle.health + amount);
        
        // Repair parts proportionally
        const repairRatio = amount / 100;
        Object.keys(vehicle.damage).forEach(part => {
            vehicle.damage[part] = Math.max(0, vehicle.damage[part] - (100 * repairRatio));
        });
        
        // Restore functionality
        if (vehicle.health > 0 && vehicle.state === 'damaged') {
            vehicle.state = 'operational';
        }
        
        this.emit('vehicle_repaired', vehicle);
    }
    
    /**
     * Refuel vehicle
     */
    refuelVehicle(vehicleId, amount = 100) {
        const vehicle = this.activeVehicles.get(vehicleId);
        if (!vehicle || vehicle.fuel === undefined) return;
        
        vehicle.fuel = Math.min(100, vehicle.fuel + amount);
        this.emit('vehicle_refueled', vehicle);
    }
    
    /**
     * Check special conditions (e.g., time travel)
     */
    checkSpecialConditions(vehicle) {
        // Time machine at 88mph
        if (vehicle.type === 'timeMachine' && vehicle.requirement) {
            const speed = Math.sqrt(
                vehicle.velocity.x ** 2 + vehicle.velocity.z ** 2
            ) * 2.237; // Convert to mph
            
            // Safely check speed requirement without eval
            if (vehicle.requirement === 'speed >= 88mph' && speed >= 88) {
                this.emit('special_condition_met', { vehicle, condition: 'time_travel' });
            }
        }
        
        // Quantum entanglement
        if (vehicle.physics === 'quantum' && vehicle.quantumState === 'entangled') {
            // Sync with entangled vehicle
            const entangled = this.activeVehicles.get(vehicle.entanglement);
            if (entangled) {
                // Quantum correlation effects
                vehicle.position.y = entangled.position.y;
            }
        }
    }
    
    /**
     * Get vehicle info
     */
    getVehicleInfo(vehicleId) {
        const vehicle = this.activeVehicles.get(vehicleId);
        if (!vehicle) return null;
        
        return {
            id: vehicle.id,
            type: vehicle.type,
            category: vehicle.category,
            name: vehicle.name,
            position: vehicle.position,
            rotation: vehicle.rotation,
            velocity: vehicle.velocity,
            speed: Math.sqrt(vehicle.velocity.x ** 2 + vehicle.velocity.z ** 2),
            health: vehicle.health,
            fuel: vehicle.fuel,
            damage: vehicle.damage,
            passengers: Array.from(vehicle.passengers.keys()),
            driver: vehicle.driver,
            state: vehicle.state,
            special: vehicle.special || []
        };
    }
    
    /**
     * List all vehicles in area
     */
    getVehiclesInArea(center, radius) {
        const vehicles = [];
        
        this.activeVehicles.forEach(vehicle => {
            const dx = vehicle.position.x - center.x;
            const dz = vehicle.position.z - center.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance <= radius) {
                vehicles.push(this.getVehicleInfo(vehicle.id));
            }
        });
        
        return vehicles;
    }
    
    /**
     * Cleanup destroyed vehicles
     */
    cleanupVehicles() {
        const now = Date.now();
        const despawnTime = 5 * 60 * 1000; // 5 minutes
        
        this.activeVehicles.forEach((vehicle, id) => {
            if (vehicle.state === 'destroyed' && 
                now - vehicle.destroyedAt > despawnTime) {
                this.activeVehicles.delete(id);
                this.emit('vehicle_despawned', id);
            }
        });
    }
}

module.exports = VehicleShipSystem;