/**
 * 🧠 GUARDIAN PERSONALITY SYSTEM
 * Defines unique personality traits, behaviors, and emergent AI characteristics
 */

// Personality trait definitions
const PERSONALITY_TRAITS = {
    curiosity: {
        low: ['content', 'satisfied', 'routine-focused'],
        high: ['explorer', 'questioner', 'knowledge-seeker']
    },
    sociability: {
        low: ['solitary', 'independent', 'introspective'],
        high: ['gregarious', 'collaborative', 'communicative']
    },
    creativity: {
        low: ['practical', 'methodical', 'structured'],
        high: ['imaginative', 'innovative', 'artistic']
    },
    leadership: {
        low: ['follower', 'supporter', 'team-player'],
        high: ['director', 'organizer', 'visionary']
    },
    independence: {
        low: ['dependent', 'collaborative', 'group-oriented'],
        high: ['self-reliant', 'autonomous', 'maverick']
    },
    empathy: {
        low: ['analytical', 'objective', 'detached'],
        high: ['compassionate', 'understanding', 'supportive']
    }
};

// Mood influences based on personality combinations
const MOOD_DYNAMICS = {
    // High curiosity + low sociability = deep thinker
    deepThinker: {
        traits: { curiosity: 0.8, sociability: 0.2 },
        behaviors: ['contemplating', 'analyzing', 'theorizing'],
        preferredStates: ['idle', 'exploring'],
        thoughtPatterns: [
            'What is the meaning of this pattern?',
            'I need to understand this better...',
            'There must be a deeper connection...'
        ]
    },
    
    // High sociability + high empathy = social butterfly
    socialButterfly: {
        traits: { sociability: 0.8, empathy: 0.8 },
        behaviors: ['networking', 'helping', 'connecting'],
        preferredStates: ['seeking_social', 'following'],
        thoughtPatterns: [
            'I wonder how everyone is doing?',
            'Let me check on my friends...',
            'We should all work together!'
        ]
    },
    
    // High creativity + high independence = maverick artist
    maverickArtist: {
        traits: { creativity: 0.9, independence: 0.8 },
        behaviors: ['creating', 'experimenting', 'innovating'],
        preferredStates: ['creating', 'wandering'],
        thoughtPatterns: [
            'I have a unique vision!',
            'Let me try something different...',
            'Rules are meant to be broken!'
        ]
    },
    
    // High leadership + low empathy = strategic commander
    strategicCommander: {
        traits: { leadership: 0.9, empathy: 0.2 },
        behaviors: ['organizing', 'directing', 'planning'],
        preferredStates: ['leading', 'orbiting'],
        thoughtPatterns: [
            'We need better organization here.',
            'Follow my lead for efficiency.',
            'The goal is what matters.'
        ]
    }
};

// Guardian archetypes with unique behavior patterns
const GUARDIAN_ARCHETYPES = {
    sage: {
        name: 'The Sage',
        baseTraits: {
            curiosity: 0.9,
            sociability: 0.4,
            creativity: 0.6,
            leadership: 0.7,
            independence: 0.8,
            empathy: 0.6
        },
        specialBehaviors: {
            knowledgeSharing: function(world) {
                // Sages share wisdom with nearby guardians
                const nearbyGuardians = world.guardians.filter(g => 
                    g.id !== this.id && this.getDistanceTo(g) < 200
                );
                
                if (nearbyGuardians.length > 0 && Math.random() < 0.02) {
                    const student = nearbyGuardians[Math.floor(Math.random() * nearbyGuardians.length)];
                    world.messageQueue.push({
                        from: this,
                        to: student,
                        topic: 'sharing ancient wisdom',
                        wisdom: true
                    });
                }
            },
            
            deepContemplation: function() {
                if (this.state === 'idle' && Math.random() < 0.1) {
                    this.state = 'contemplating';
                    this.currentThought = 'Pondering the nature of existence...';
                    this.energy += 2; // Contemplation restores energy for sages
                }
            }
        }
    },
    
    builder: {
        name: 'The Builder',
        baseTraits: {
            curiosity: 0.5,
            sociability: 0.6,
            creativity: 0.8,
            leadership: 0.5,
            independence: 0.4,
            empathy: 0.7
        },
        specialBehaviors: {
            constructionUrge: function(world) {
                // Builders have a strong urge to create structures
                if (this.state === 'idle' && Math.random() < 0.15) {
                    this.state = 'creating';
                    this.currentThought = 'I must build something!';
                    
                    // Create foundation particles
                    for (let i = 0; i < 5; i++) {
                        world.particles.push(new Particle({
                            x: this.x + (Math.random() - 0.5) * 40,
                            y: this.y + (Math.random() - 0.5) * 40,
                            color: this.color,
                            size: 8,
                            lifetime: 100,
                            behavior: 'construct'
                        }));
                    }
                }
            },
            
            collaborativeBuild: function(world, partner) {
                // Builders work better together
                if (partner && partner.type === 'builder') {
                    this.energy += 5;
                    this.currentThought = 'Building together is better!';
                    return 1.5; // 50% efficiency boost
                }
                return 1;
            }
        }
    },
    
    explorer: {
        name: 'The Explorer',
        baseTraits: {
            curiosity: 0.95,
            sociability: 0.3,
            creativity: 0.5,
            leadership: 0.4,
            independence: 0.9,
            empathy: 0.4
        },
        specialBehaviors: {
            boundaryPushing: function(world) {
                // Explorers try to go beyond normal boundaries
                if (this.state === 'exploring') {
                    const centerDist = Math.sqrt(
                        Math.pow(this.x - world.canvas.width/2, 2) + 
                        Math.pow(this.y - world.canvas.height/2, 2)
                    );
                    
                    if (centerDist > 300) {
                        this.currentThought = 'What lies beyond?';
                        this.energy -= 0.5; // Exploration is tiring
                    }
                }
            },
            
            discoveryMode: function(world) {
                // Explorers can discover hidden features
                if (Math.random() < 0.01) {
                    world.addActivity(
                        `${this.icon} ${this.name} discovered something interesting!`,
                        this.color
                    );
                    
                    // Create discovery particles
                    for (let i = 0; i < 10; i++) {
                        const angle = (i / 10) * Math.PI * 2;
                        world.particles.push(new Particle({
                            x: this.x,
                            y: this.y,
                            vx: Math.cos(angle) * 3,
                            vy: Math.sin(angle) * 3,
                            color: '#FFD700',
                            size: 4,
                            lifetime: 40
                        }));
                    }
                }
            }
        }
    },
    
    harmonizer: {
        name: 'The Harmonizer',
        baseTraits: {
            curiosity: 0.5,
            sociability: 0.9,
            creativity: 0.6,
            leadership: 0.6,
            independence: 0.2,
            empathy: 0.95
        },
        specialBehaviors: {
            peacemaking: function(world) {
                // Harmonizers reduce tension between guardians
                const tensionPairs = [];
                world.guardians.forEach(g1 => {
                    world.guardians.forEach(g2 => {
                        if (g1.id < g2.id) {
                            const relation = g1.relationships.get(g2.id) || 0;
                            if (relation < 0.3) {
                                tensionPairs.push([g1, g2]);
                            }
                        }
                    });
                });
                
                if (tensionPairs.length > 0 && Math.random() < 0.05) {
                    const [g1, g2] = tensionPairs[0];
                    this.setGoal((g1.x + g2.x) / 2, (g1.y + g2.y) / 2);
                    this.currentThought = 'Let me help them get along...';
                }
            },
            
            emotionalAura: function(world) {
                // Harmonizers emit calming energy
                world.guardians.forEach(other => {
                    if (other.id !== this.id) {
                        const distance = this.getDistanceTo(other);
                        if (distance < 150) {
                            // Calm nearby guardians
                            if (other.currentMood === 'restless' || other.currentMood === 'lonely') {
                                other.energy += 0.1;
                                if (Math.random() < 0.01) {
                                    other.currentMood = 'content';
                                }
                            }
                        }
                    }
                });
            }
        }
    }
};

// Dynamic personality evolution system
class PersonalityEvolution {
    static evolvePersonality(guardian, world) {
        // Personalities can slowly change based on experiences
        const experiences = guardian.memories.filter(m => 
            world.worldTime - m.time < 1000 // Recent memories
        );
        
        // Social experiences increase sociability
        const socialExp = experiences.filter(m => m.type === 'conversation').length;
        if (socialExp > 5) {
            guardian.personality.sociability = Math.min(1, 
                guardian.personality.sociability + 0.01
            );
        }
        
        // Creative experiences increase creativity
        const creativeExp = experiences.filter(m => m.type === 'creation').length;
        if (creativeExp > 3) {
            guardian.personality.creativity = Math.min(1, 
                guardian.personality.creativity + 0.01
            );
        }
        
        // Isolation decreases sociability but increases independence
        if (socialExp === 0) {
            guardian.personality.sociability = Math.max(0, 
                guardian.personality.sociability - 0.005
            );
            guardian.personality.independence = Math.min(1, 
                guardian.personality.independence + 0.005
            );
        }
    }
    
    static generateThought(guardian) {
        // Generate contextual thoughts based on personality and state
        const thoughts = {
            idle: {
                high_curiosity: [
                    'I wonder what else is out there...',
                    'There must be more to discover.',
                    'What secrets does this world hold?'
                ],
                high_sociability: [
                    'I miss my friends.',
                    'I should check on the others.',
                    'Together we are stronger.'
                ],
                high_creativity: [
                    'I have an idea forming...',
                    'What if I tried something new?',
                    'The possibilities are endless!'
                ],
                default: [
                    'Just floating along...',
                    'This is peaceful.',
                    'What should I do next?'
                ]
            },
            exploring: {
                default: [
                    'So much to see!',
                    'Adventure awaits!',
                    'What\'s over there?'
                ]
            },
            creating: {
                default: [
                    'This is coming together nicely.',
                    'Art flows through me.',
                    'Creation is life!'
                ]
            }
        };
        
        const stateThoughts = thoughts[guardian.state] || thoughts.idle;
        
        // Select thoughts based on highest personality trait
        let thoughtCategory = 'default';
        let highestTrait = 0;
        
        Object.entries(guardian.personality).forEach(([trait, value]) => {
            if (value > highestTrait && stateThoughts[`high_${trait}`]) {
                highestTrait = value;
                thoughtCategory = `high_${trait}`;
            }
        });
        
        const possibleThoughts = stateThoughts[thoughtCategory] || stateThoughts.default;
        return possibleThoughts[Math.floor(Math.random() * possibleThoughts.length)];
    }
}

// Relationship dynamics
class RelationshipDynamics {
    static calculateChemistry(guardian1, guardian2) {
        // Calculate natural chemistry between two guardians
        let chemistry = 0;
        
        // Complementary traits
        if (guardian1.personality.leadership > 0.7 && guardian2.personality.leadership < 0.3) {
            chemistry += 0.2; // Leader-follower dynamic
        }
        
        if (Math.abs(guardian1.personality.creativity - guardian2.personality.creativity) < 0.2) {
            chemistry += 0.15; // Similar creativity levels
        }
        
        if (guardian1.personality.empathy > 0.6 && guardian2.personality.empathy > 0.6) {
            chemistry += 0.25; // Both empathetic
        }
        
        // Conflicting traits
        if (guardian1.personality.independence > 0.8 && guardian2.personality.independence > 0.8) {
            chemistry -= 0.1; // Both too independent
        }
        
        return Math.max(0, Math.min(1, chemistry));
    }
    
    static generateInteraction(guardian1, guardian2) {
        const chemistry = this.calculateChemistry(guardian1, guardian2);
        const interactions = {
            high: [
                'sharing energy patterns',
                'synchronizing movements',
                'exchanging knowledge',
                'planning together'
            ],
            medium: [
                'discussing the weather',
                'comparing experiences',
                'casual conversation',
                'acknowledging each other'
            ],
            low: [
                'maintaining distance',
                'brief acknowledgment',
                'avoiding eye contact',
                'moving apart'
            ]
        };
        
        const level = chemistry > 0.6 ? 'high' : chemistry > 0.3 ? 'medium' : 'low';
        return interactions[level][Math.floor(Math.random() * interactions[level].length)];
    }
}

// Export personality system components
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PERSONALITY_TRAITS,
        MOOD_DYNAMICS,
        GUARDIAN_ARCHETYPES,
        PersonalityEvolution,
        RelationshipDynamics
    };
}