# 🎯 Aggro/Security Range Systems: Bitmap-Based Awareness

## 🎮 Gaming-Inspired Security Model

The Document Generator uses MMORPG-style aggro detection and security ranges to manage user interactions, access control, and spatial awareness. This creates a natural, intuitive security model based on proximity and visual range.

## 🔍 Range Types & Calculations

### Core Range Definitions
```javascript
const RangeTypes = {
    DETECTION: {
        description: 'Can sense entity presence (fog of war visibility)',
        baseRange: 100,
        purpose: 'Awareness, notifications, presence detection',
        color: '#ffff0040'  // Yellow with transparency
    },
    
    INTERACTION: {
        description: 'Can communicate/exchange data', 
        baseRange: 75,
        purpose: 'Chat, file sharing, collaboration',
        color: '#00ff0040'  // Green with transparency
    },
    
    EXECUTION: {
        description: 'Can trigger actions (attack/cast abilities)',
        baseRange: 50,
        purpose: 'Admin actions, direct commands, modifications',
        color: '#ff000040'  // Red with transparency
    },
    
    INFLUENCE: {
        description: 'Passive effects (like auras or buffs)',
        baseRange: 25,
        purpose: 'Status effects, environmental changes',
        color: '#8000ff40'  // Purple with transparency
    }
};
```

### Range Calculation Formula
```javascript
const calculateRange = (entityLevel, entityType, rangeType, modifiers = {}) => {
    const baseRange = RangeTypes[rangeType].baseRange;
    
    // Entity type multipliers (bigger entities have bigger ranges)
    const typeMultipliers = {
        'npc': 1.0,        // Basic users
        'player': 1.5,     // Regular users
        'moderator': 2.0,  // Moderators  
        'admin': 3.0,      // Administrators
        'guardian': 2.5,   // Security bots
        'boss': 4.0,       // Special entities
        'system': 5.0      // System processes
    };
    
    // Level scaling (every 10 levels = +50% range)
    const levelMultiplier = 1 + (entityLevel / 10) * 0.5;
    
    // Environmental modifiers
    const environmentModifier = modifiers.environment || 1.0;
    const stealthModifier = modifiers.stealth || 1.0;
    const alertModifier = modifiers.alertLevel || 1.0;
    
    const calculatedRange = baseRange 
        * typeMultipliers[entityType] 
        * levelMultiplier 
        * environmentModifier 
        * stealthModifier 
        * alertModifier;
    
    return Math.floor(calculatedRange);
};
```

## 🗺️ Bitmap-Based Awareness System

### N64-Style Fog Rendering
```javascript
const BitmapAwareness = {
    // Generate awareness bitmap for an entity (like N64 fog of war)
    generateAwarenessBitmap: (entity, gridSize = 16) => {
        const bitmap = [];
        const centerX = gridSize / 2;
        const centerY = gridSize / 2;
        
        for (let y = 0; y < gridSize; y++) {
            let row = '';
            for (let x = 0; x < gridSize; x++) {
                const distance = Math.sqrt(
                    Math.pow(x - centerX, 2) + 
                    Math.pow(y - centerY, 2)
                );
                
                const normalizedDistance = distance / (gridSize / 2);
                const awareness = this.calculateAwareness(entity, normalizedDistance);
                
                row += this.awarenessToSymbol(awareness);
            }
            bitmap.push(row);
        }
        
        return bitmap.join('\n');
    },
    
    // Calculate awareness level based on distance
    calculateAwareness: (entity, normalizedDistance) => {
        const ranges = entity.ranges;
        
        if (normalizedDistance <= ranges.influence / ranges.detection) {
            return 1.0;  // Full awareness (can affect)
        } else if (normalizedDistance <= ranges.execution / ranges.detection) {
            return 0.8;  // High awareness (can act on)
        } else if (normalizedDistance <= ranges.interaction / ranges.detection) {
            return 0.6;  // Medium awareness (can communicate)
        } else if (normalizedDistance <= 1.0) {
            return 0.4;  // Low awareness (can detect)
        } else {
            return 0.0;  // No awareness (outside range)
        }
    },
    
    // Convert awareness level to visual symbol
    awarenessToSymbol: (awareness) => {
        if (awareness >= 1.0) return '█';      // Full visibility
        if (awareness >= 0.8) return '▓';      // High visibility
        if (awareness >= 0.6) return '▒';      // Medium visibility
        if (awareness >= 0.4) return '░';      // Low visibility
        return ' ';                             // No visibility
    }
};
```

### Bitmap Visualization Example
```javascript
// Example bitmap for admin-level entity
const adminBitmap = `
    ░░░░░░░░░░░░░░░░
    ░░░▒▒▒▒▒▒▒▒░░░░
    ░░▒▒▓▓▓▓▓▓▒▒░░░
    ░▒▒▓▓██████▓▓▒▒░
    ░▒▓▓████████▓▓▒░
    ░▒▓████████████▓▒░
    ░▒▓████████████▓▒░
    ░▒▓▓██████▓▓▒░
    ░▒▒▓▓▓▓▓▓▒▒░░░
    ░░▒▒▒▒▒▒▒▒░░░░
    ░░░░░░░░░░░░░░░░
`;

// Legend:
// █ = Influence range (can modify environment)
// ▓ = Execution range (can perform admin actions) 
// ▒ = Interaction range (can communicate)
// ░ = Detection range (can observe)
//   = Outside all ranges
```

## 🛡️ Security Integration with Color System

### Color-Based Range Modifiers
```javascript
const colorSecurityModifiers = {
    // Green users (online, trusted) have normal ranges
    '#00FF00': {
        rangeMultiplier: 1.0,
        stealthFactor: 0.0,
        threatLevel: 0.1,
        trustLevel: 0.9
    },
    
    // Yellow users (away, caution) have reduced ranges
    '#FFFF00': {
        rangeMultiplier: 0.8,
        stealthFactor: 0.2,
        threatLevel: 0.3,
        trustLevel: 0.7
    },
    
    // Red users (offline/flagged) have minimal ranges
    '#FF0000': {
        rangeMultiplier: 0.5,
        stealthFactor: 0.1,
        threatLevel: 0.9,
        trustLevel: 0.1
    },
    
    // Blue users (new) have limited ranges
    '#0000FF': {
        rangeMultiplier: 0.6,
        stealthFactor: 0.0,
        threatLevel: 0.2,
        trustLevel: 0.5
    },
    
    // Purple users (premium) have enhanced ranges
    '#800080': {
        rangeMultiplier: 1.5,
        stealthFactor: 0.7,
        threatLevel: 0.0,
        trustLevel: 1.0
    },
    
    // Black users (epoch/admin) have maximum ranges and stealth
    '#000000': {
        rangeMultiplier: 3.0,
        stealthFactor: 1.0,
        threatLevel: 0.0,
        trustLevel: 1.0
    }
};

// Apply color modifiers to range calculations
const applyColorModifiers = (baseRanges, userColor) => {
    const modifiers = colorSecurityModifiers[userColor];
    
    return {
        detection: Math.floor(baseRanges.detection * modifiers.rangeMultiplier),
        interaction: Math.floor(baseRanges.interaction * modifiers.rangeMultiplier),
        execution: Math.floor(baseRanges.execution * modifiers.rangeMultiplier),
        influence: Math.floor(baseRanges.influence * modifiers.rangeMultiplier),
        stealth: modifiers.stealthFactor,
        threat: modifiers.threatLevel
    };
};
```

## 🔍 Range Overlap Detection

### Intersection Calculations
```javascript
const RangeOverlapDetector = {
    // Check if two entities' ranges overlap
    checkOverlap: (entity1, entity2, rangeType) => {
        const distance = this.calculateDistance(entity1.position, entity2.position);
        const entity1Range = entity1.ranges[rangeType];
        const entity2Range = entity2.ranges[rangeType];
        
        // Account for stealth (reduces effective detection)
        const stealthAdjustedRange1 = entity1Range * (1 - entity2.stealth);
        const stealthAdjustedRange2 = entity2Range * (1 - entity1.stealth);
        
        return {
            overlaps: distance <= (stealthAdjustedRange1 + stealthAdjustedRange2),
            distance: distance,
            overlapAmount: Math.max(0, (stealthAdjustedRange1 + stealthAdjustedRange2) - distance),
            canDetect: {
                entity1CanDetectEntity2: distance <= stealthAdjustedRange1,
                entity2CanDetectEntity1: distance <= stealthAdjustedRange2
            }
        };
    },
    
    // Find all entities within range of a target entity
    getEntitiesInRange: (targetEntity, entities, rangeType) => {
        return entities
            .filter(entity => entity.id !== targetEntity.id)
            .map(entity => ({
                entity: entity,
                overlap: this.checkOverlap(targetEntity, entity, rangeType)
            }))
            .filter(result => result.overlap.overlaps)
            .sort((a, b) => a.overlap.distance - b.overlap.distance);
    },
    
    // Calculate 3D distance between entities
    calculateDistance: (pos1, pos2) => {
        return Math.sqrt(
            Math.pow(pos2.x - pos1.x, 2) +
            Math.pow(pos2.y - pos1.y, 2) +
            Math.pow(pos2.z - pos1.z, 2)
        );
    }
};
```

## 🚨 Security Event System

### Range-Based Security Events
```javascript
const SecurityEventSystem = {
    // Monitor range interactions for security events
    monitorRangeInteractions: () => {
        setInterval(() => {
            const allEntities = spatial.getAllEntities();
            
            allEntities.forEach(entity => {
                // Check for unauthorized access attempts
                this.checkUnauthorizedAccess(entity, allEntities);
                
                // Check for suspicious clustering
                this.checkSuspiciousClustering(entity, allEntities);
                
                // Check for stealth violations
                this.checkStealthViolations(entity, allEntities);
            });
        }, 1000);  // Check every second
    },
    
    // Detect unauthorized access attempts
    checkUnauthorizedAccess: (entity, allEntities) => {
        const entitiesInExecutionRange = RangeOverlapDetector.getEntitiesInRange(
            entity, allEntities, 'execution'
        );
        
        entitiesInExecutionRange.forEach(({ entity: target }) => {
            if (entity.trustLevel < 0.5 && target.type === 'admin') {
                this.triggerSecurityAlert({
                    type: 'UNAUTHORIZED_ACCESS_ATTEMPT',
                    attacker: entity,
                    target: target,
                    distance: RangeOverlapDetector.calculateDistance(
                        entity.position, target.position
                    ),
                    severity: 'HIGH'
                });
            }
        });
    },
    
    // Detect suspicious entity clustering
    checkSuspiciousClustering: (entity, allEntities) => {
        const nearbyEntities = RangeOverlapDetector.getEntitiesInRange(
            entity, allEntities, 'detection'
        );
        
        if (nearbyEntities.length > 10 && entity.trustLevel < 0.3) {
            this.triggerSecurityAlert({
                type: 'SUSPICIOUS_CLUSTERING',
                entity: entity,
                clusterSize: nearbyEntities.length,
                severity: 'MEDIUM'
            });
        }
    },
    
    // Trigger security alerts
    triggerSecurityAlert: (alert) => {
        console.warn('🚨 SECURITY ALERT:', alert);
        
        // Log to audit trail
        auditMachine.recordSecurityEvent(alert);
        
        // Notify administrators
        const admins = spatial.getEntitiesByType('admin');
        admins.forEach(admin => {
            this.sendAlert(admin.id, alert);
        });
        
        // Automatic response based on severity
        if (alert.severity === 'HIGH') {
            this.quarantineEntity(alert.attacker || alert.entity);
        }
    },
    
    // Quarantine suspicious entities
    quarantineEntity: (entity) => {
        // Reduce all ranges to minimum
        entity.ranges = {
            detection: 10,
            interaction: 5,
            execution: 0,
            influence: 0
        };
        
        // Move to quarantine zone
        spatial.updateEntityPosition(entity.id, { x: -1000, y: -1000, z: -1000 });
        
        // Set red color status
        colorSystem.updateUserColor(entity.id, '#FF0000');
        
        console.log(`🔒 Entity ${entity.id} quarantined due to security violation`);
    }
};
```

## 🎯 Range-Based Access Control

### Permission System Integration
```javascript
const RangeBasedPermissions = {
    // Check if entity can perform action based on range and permissions
    checkPermission: (actor, target, action, requiredRange = 'interaction') => {
        // 1. Check if target is in range
        const overlap = RangeOverlapDetector.checkOverlap(actor, target, requiredRange);
        if (!overlap.canDetect.entity1CanDetectEntity2) {
            return {
                allowed: false,
                reason: 'TARGET_OUT_OF_RANGE',
                requiredRange: actor.ranges[requiredRange],
                actualDistance: overlap.distance
            };
        }
        
        // 2. Check color-based permissions
        const colorPermissions = this.getColorPermissions(actor.color);
        if (!colorPermissions.includes(action)) {
            return {
                allowed: false,
                reason: 'INSUFFICIENT_COLOR_PERMISSIONS',
                requiredColor: this.getRequiredColorForAction(action),
                actualColor: actor.color
            };
        }
        
        // 3. Check trust level
        const requiredTrust = this.getRequiredTrustForAction(action);
        if (actor.trustLevel < requiredTrust) {
            return {
                allowed: false,
                reason: 'INSUFFICIENT_TRUST_LEVEL',
                requiredTrust: requiredTrust,
                actualTrust: actor.trustLevel
            };
        }
        
        return { allowed: true };
    },
    
    // Get permissions based on color status
    getColorPermissions: (color) => {
        const permissions = {
            '#000000': ['admin', 'moderate', 'chat', 'view'],  // Epoch/Admin
            '#800080': ['moderate', 'chat', 'view'],           // Purple/Premium
            '#00FF00': ['chat', 'view'],                       // Green/Online
            '#FFFF00': ['chat', 'view'],                       // Yellow/Away
            '#0000FF': ['view'],                               // Blue/New
            '#FF0000': []                                      // Red/Banned
        };
        
        return permissions[color] || [];
    },
    
    // Action execution with range validation
    executeRangeBasedAction: async (actor, target, action, data = {}) => {
        const permission = this.checkPermission(actor, target, action);
        
        if (!permission.allowed) {
            throw new Error(`Action denied: ${permission.reason}`);
        }
        
        // Log the action for audit trail
        auditMachine.recordAction({
            actor: actor.id,
            target: target.id,
            action: action,
            data: data,
            range: RangeOverlapDetector.calculateDistance(actor.position, target.position),
            timestamp: Date.now()
        });
        
        // Execute the action
        return await this.performAction(action, actor, target, data);
    }
};
```

## 🎮 Visual Range Indicators

### 3D Range Visualization
```javascript
const RangeVisualization = {
    // Render range circles around entities
    renderEntityRanges: (entity, scene) => {
        const rangeGroup = new THREE.Group();
        
        Object.entries(entity.ranges).forEach(([rangeType, range]) => {
            if (range > 0) {
                const geometry = new THREE.RingGeometry(range - 2, range, 32);
                const material = new THREE.MeshBasicMaterial({
                    color: RangeTypes[rangeType.toUpperCase()].color,
                    transparent: true,
                    opacity: 0.3,
                    side: THREE.DoubleSide
                });
                
                const rangeMesh = new THREE.Mesh(geometry, material);
                rangeMesh.rotation.x = -Math.PI / 2;  // Lay flat
                rangeMesh.position.y = 1;  // Slightly above ground
                
                rangeGroup.add(rangeMesh);
            }
        });
        
        rangeGroup.position.copy(entity.position);
        scene.add(rangeGroup);
        
        return rangeGroup;
    },
    
    // Show range overlap visualization
    visualizeRangeOverlaps: (entity1, entity2, scene) => {
        const overlapResults = {};
        
        Object.keys(RangeTypes).forEach(rangeType => {
            const overlap = RangeOverlapDetector.checkOverlap(
                entity1, entity2, rangeType.toLowerCase()
            );
            
            if (overlap.overlaps) {
                // Create visual connection line
                const geometry = new THREE.BufferGeometry().setFromPoints([
                    new THREE.Vector3(entity1.position.x, entity1.position.y + 5, entity1.position.z),
                    new THREE.Vector3(entity2.position.x, entity2.position.y + 5, entity2.position.z)
                ]);
                
                const material = new THREE.LineBasicMaterial({
                    color: RangeTypes[rangeType].color,
                    linewidth: Math.max(1, overlap.overlapAmount / 10)
                });
                
                const line = new THREE.Line(geometry, material);
                scene.add(line);
                
                overlapResults[rangeType] = line;
            }
        });
        
        return overlapResults;
    },
    
    // Create bitmap texture for entity awareness
    createAwarenessBitmap: (entity) => {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        const bitmap = BitmapAwareness.generateAwarenessBitmap(entity, 8);
        const lines = bitmap.split('\n');
        
        lines.forEach((line, y) => {
            for (let x = 0; x < line.length; x++) {
                const char = line[x];
                let alpha = 0;
                
                switch (char) {
                    case '█': alpha = 1.0; break;
                    case '▓': alpha = 0.8; break;
                    case '▒': alpha = 0.6; break;
                    case '░': alpha = 0.4; break;
                    default: alpha = 0.0; break;
                }
                
                ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
                ctx.fillRect(x * 8, y * 8, 8, 8);
            }
        });
        
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }
};
```

## 🔧 Configuration & Tuning

### Range System Configuration
```javascript
const RangeSystemConfig = {
    // Global range modifiers
    globalModifiers: {
        rangeScale: 1.0,          // Scale all ranges uniformly
        stealthEffectiveness: 1.0, // How much stealth affects detection
        alertLevelMultiplier: 1.0, // Security alert range multiplier
        environmentalFactor: 1.0   // Environmental range modifier
    },
    
    // Zone-specific range modifiers
    zoneModifiers: {
        'safe-zone': { rangeMultiplier: 1.0, alertLevel: 0.1 },
        'pvp-zone': { rangeMultiplier: 1.5, alertLevel: 0.9 },
        'admin-zone': { rangeMultiplier: 2.0, alertLevel: 0.0 },
        'quarantine-zone': { rangeMultiplier: 0.2, alertLevel: 1.0 }
    },
    
    // Update configuration in real-time
    updateConfig: (newConfig) => {
        Object.assign(this.globalModifiers, newConfig);
        
        // Recalculate all entity ranges
        const allEntities = spatial.getAllEntities();
        allEntities.forEach(entity => {
            entity.ranges = this.recalculateRanges(entity);
        });
    }
};
```

---

**The aggro/security range system creates an intuitive, gaming-inspired security model where proximity determines permissions, visibility controls access, and spatial relationships drive security decisions. This transforms abstract security concepts into tangible, visual game mechanics.**