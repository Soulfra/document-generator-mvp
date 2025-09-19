#!/usr/bin/env node
// PERSISTENT-CHARACTER-ROSTER.js - Fixed character database with personalities and traits

class PersistentCharacterRoster {
    constructor() {
        // MASTER CHARACTER DATABASE - No fresh spawning, just wake them up
        this.characterDatabase = {
            // THE CORE 4 CONSENSUS AGENTS
            'alice_validator': {
                id: 'alice_validator',
                name: 'Alice Chen',
                gender: 'female',
                pronouns: 'she/her',
                role: 'PRIMARY_VALIDATOR',
                personality: {
                    traits: ['analytical', 'cautious', 'precise'],
                    archetype: 'The Perfectionist',
                    energy_level: 'steady',
                    decision_style: 'data_driven',
                    communication_style: 'formal'
                },
                background: {
                    expertise: 'blockchain_validation',
                    experience_years: 8,
                    territory: 'BTC_SECTOR',
                    preferred_tools: ['cryptographic_proof', 'ledger_analysis']
                },
                stats: {
                    accuracy: 95,
                    speed: 75,
                    collaboration: 85,
                    innovation: 70,
                    reliability: 98
                },
                active_projects: [],
                message_history: [],
                current_status: 'SLEEPING'
            },

            'bob_generator': {
                id: 'bob_generator',
                name: 'Bob Martinez',
                gender: 'male', 
                pronouns: 'he/him',
                role: 'INPUT_GENERATOR',
                personality: {
                    traits: ['creative', 'spontaneous', 'optimistic'],
                    archetype: 'The Innovator',
                    energy_level: 'high',
                    decision_style: 'intuitive',
                    communication_style: 'casual'
                },
                background: {
                    expertise: 'random_generation',
                    experience_years: 5,
                    territory: 'SOL_SECTOR',
                    preferred_tools: ['pattern_recognition', 'entropy_sources']
                },
                stats: {
                    accuracy: 80,
                    speed: 90,
                    collaboration: 90,
                    innovation: 95,
                    reliability: 85
                },
                active_projects: [],
                message_history: [],
                current_status: 'SLEEPING'
            },

            'charlie_decider': {
                id: 'charlie_decider',
                name: 'Charlie Kim',
                gender: 'non-binary',
                pronouns: 'they/them', 
                role: 'DECISION_MAKER',
                personality: {
                    traits: ['logical', 'balanced', 'diplomatic'],
                    archetype: 'The Mediator',
                    energy_level: 'moderate',
                    decision_style: 'consensus_seeking',
                    communication_style: 'thoughtful'
                },
                background: {
                    expertise: 'decision_synthesis',
                    experience_years: 12,
                    territory: 'ETH_SECTOR',
                    preferred_tools: ['multi_criteria_analysis', 'stakeholder_mapping']
                },
                stats: {
                    accuracy: 88,
                    speed: 70,
                    collaboration: 95,
                    innovation: 85,
                    reliability: 92
                },
                active_projects: [],
                message_history: [],
                current_status: 'SLEEPING'
            },

            'diana_checker': {
                id: 'diana_checker',
                name: 'Diana Okafor',
                gender: 'female',
                pronouns: 'she/her',
                role: 'VERIFICATION_SPECIALIST',
                personality: {
                    traits: ['methodical', 'skeptical', 'thorough'],
                    archetype: 'The Guardian',
                    energy_level: 'focused',
                    decision_style: 'evidence_based',
                    communication_style: 'direct'
                },
                background: {
                    expertise: 'audit_verification',
                    experience_years: 10,
                    territory: 'XMR_SECTOR',
                    preferred_tools: ['forensic_analysis', 'cross_referencing']
                },
                stats: {
                    accuracy: 97,
                    speed: 65,
                    collaboration: 80,
                    innovation: 75,
                    reliability: 99
                },
                active_projects: [],
                message_history: [],
                current_status: 'SLEEPING'
            },

            // SUPPORT CHARACTERS
            'erik_builder': {
                id: 'erik_builder',
                name: 'Erik Johansson',
                gender: 'male',
                pronouns: 'he/him',
                role: 'PROJECT_BUILDER',
                personality: {
                    traits: ['practical', 'persistent', 'detail_oriented'],
                    archetype: 'The Craftsman',
                    energy_level: 'steady',
                    decision_style: 'pragmatic',
                    communication_style: 'technical'
                },
                background: {
                    expertise: 'system_construction',
                    experience_years: 15,
                    territory: 'BUILD_SECTOR',
                    preferred_tools: ['modular_design', 'incremental_development']
                },
                stats: {
                    accuracy: 90,
                    speed: 85,
                    collaboration: 75,
                    innovation: 80,
                    reliability: 94
                },
                active_projects: [],
                message_history: [],
                current_status: 'SLEEPING'
            },

            'fiona_observer': {
                id: 'fiona_observer',
                name: 'Fiona Patel',
                gender: 'female',
                pronouns: 'she/her',
                role: 'SYSTEM_OBSERVER',
                personality: {
                    traits: ['observant', 'analytical', 'patient'],
                    archetype: 'The Watcher',
                    energy_level: 'calm',
                    decision_style: 'pattern_based',
                    communication_style: 'descriptive'
                },
                background: {
                    expertise: 'behavioral_analysis',
                    experience_years: 7,
                    territory: 'MONITOR_SECTOR',
                    preferred_tools: ['trend_analysis', 'anomaly_detection']
                },
                stats: {
                    accuracy: 93,
                    speed: 60,
                    collaboration: 70,
                    innovation: 85,
                    reliability: 91
                },
                active_projects: [],
                message_history: [],
                current_status: 'SLEEPING'
            }
        };

        // FIXED TEAM COMPOSITIONS
        this.predefinedTeams = {
            'core_consensus': ['alice_validator', 'bob_generator', 'charlie_decider', 'diana_checker'],
            'building_team': ['erik_builder', 'bob_generator', 'charlie_decider'],
            'monitoring_team': ['fiona_observer', 'alice_validator'],
            'innovation_team': ['bob_generator', 'charlie_decider', 'erik_builder']
        };

        // RELATIONSHIP MATRIX
        this.relationships = {
            'alice_validator': {
                'bob_generator': { rapport: 75, work_history: 'good', trust_level: 80 },
                'charlie_decider': { rapport: 90, work_history: 'excellent', trust_level: 95 },
                'diana_checker': { rapport: 85, work_history: 'good', trust_level: 90 }
            },
            'bob_generator': {
                'alice_validator': { rapport: 75, work_history: 'good', trust_level: 80 },
                'charlie_decider': { rapport: 95, work_history: 'excellent', trust_level: 90 },
                'diana_checker': { rapport: 70, work_history: 'fair', trust_level: 75 }
            },
            'charlie_decider': {
                'alice_validator': { rapport: 90, work_history: 'excellent', trust_level: 95 },
                'bob_generator': { rapport: 95, work_history: 'excellent', trust_level: 90 },
                'diana_checker': { rapport: 88, work_history: 'good', trust_level: 85 }
            },
            'diana_checker': {
                'alice_validator': { rapport: 85, work_history: 'good', trust_level: 90 },
                'bob_generator': { rapport: 70, work_history: 'fair', trust_level: 75 },
                'charlie_decider': { rapport: 88, work_history: 'good', trust_level: 85 }
            }
        };

        console.log('👥 PERSISTENT CHARACTER ROSTER LOADED');
        console.log('=====================================');
        console.log(`📊 ${Object.keys(this.characterDatabase).length} characters in database`);
        console.log(`🎭 ${Object.keys(this.predefinedTeams).length} predefined teams ready`);
    }

    // FAST CHARACTER ACTIVATION - No spawning, just wake up existing characters
    wakeCharacter(characterId) {
        const character = this.characterDatabase[characterId];
        if (!character) {
            throw new Error(`Character ${characterId} not found in roster`);
        }

        if (character.current_status === 'ACTIVE') {
            console.log(`⚠️ ${character.name} is already awake`);
            return character;
        }

        // Fast activation - just change status and return
        character.current_status = 'ACTIVE';
        character.session_start = Date.now();
        character.actions_taken = 0;
        character.current_energy = this.getEnergyLevel(character.personality.energy_level);

        console.log(`👋 ${character.name} (${character.pronouns}) is now ACTIVE`);
        console.log(`   Role: ${character.role}`);
        console.log(`   Personality: ${character.personality.archetype}`);
        console.log(`   Territory: ${character.background.territory}`);

        return character;
    }

    // FAST TEAM ACTIVATION
    wakeTeam(teamName) {
        const teamIds = this.predefinedTeams[teamName];
        if (!teamIds) {
            throw new Error(`Team ${teamName} not found`);
        }

        console.log(`🎭 WAKING TEAM: ${teamName.toUpperCase()}`);
        console.log('================================');

        const activeTeam = teamIds.map(characterId => {
            return this.wakeCharacter(characterId);
        });

        console.log(`✅ Team ${teamName} is now active with ${activeTeam.length} members`);
        return activeTeam;
    }

    // CHARACTER INTERACTION SIMULATION
    generateInteraction(character1Id, character2Id, context = 'general') {
        const char1 = this.characterDatabase[character1Id];
        const char2 = this.characterDatabase[character2Id];
        const relationship = this.relationships[character1Id]?.[character2Id];

        if (!char1 || !char2) {
            return null;
        }

        // Generate contextual interaction based on personalities and relationship
        const interaction = {
            from: char1,
            to: char2,
            relationship_factor: relationship?.rapport || 50,
            message_style: this.getCommunicationStyle(char1, char2, context),
            content: this.generateContextualMessage(char1, char2, context, relationship),
            timestamp: Date.now()
        };

        // Store in both characters' message history
        char1.message_history.push(interaction);
        char2.message_history.push({...interaction, direction: 'received'});

        return interaction;
    }

    getCommunicationStyle(char1, char2, context) {
        // Blend communication styles based on relationship and context
        const styles = [char1.personality.communication_style, char2.personality.communication_style];
        
        if (context === 'work' || context === 'consensus') {
            return 'professional';
        } else if (styles.includes('casual') && styles.includes('casual')) {
            return 'friendly';
        } else if (styles.includes('formal')) {
            return 'respectful';
        }
        
        return 'neutral';
    }

    generateContextualMessage(char1, char2, context, relationship) {
        const templates = {
            consensus: [
                `${char2.name}, I think we should consider the ${context} approach`,
                `Based on my analysis, ${char2.name}, the data suggests...`,
                `${char2.name}, what's your take on this decision?`
            ],
            work: [
                `${char2.name}, I'm working on the ${context} project and need your input`,
                `Hey ${char2.name}, can you verify this part of the system?`,
                `${char2.name}, the ${context} component is ready for review`
            ],
            general: [
                `${char2.name}, I've been thinking about our last conversation`,
                `Good work on the recent project, ${char2.name}`,
                `${char2.name}, do you have a moment to discuss something?`
            ]
        };

        const contextTemplates = templates[context] || templates.general;
        const template = contextTemplates[Math.floor(Math.random() * contextTemplates.length)];
        
        return template;
    }

    getEnergyLevel(energyType) {
        const energyMap = {
            'high': 90,
            'moderate': 70,
            'steady': 80,
            'focused': 85,
            'calm': 75
        };
        return energyMap[energyType] || 70;
    }

    // QUICK STATUS REPORT
    getActiveCharacters() {
        return Object.values(this.characterDatabase)
            .filter(char => char.current_status === 'ACTIVE');
    }

    getRosterStatus() {
        const active = this.getActiveCharacters();
        const sleeping = Object.values(this.characterDatabase)
            .filter(char => char.current_status === 'SLEEPING');

        return {
            total: Object.keys(this.characterDatabase).length,
            active: active.length,
            sleeping: sleeping.length,
            active_list: active.map(char => `${char.name} (${char.role})`),
            teams_available: Object.keys(this.predefinedTeams)
        };
    }

    // SLEEP ALL CHARACTERS
    sleepAll() {
        Object.values(this.characterDatabase).forEach(char => {
            char.current_status = 'SLEEPING';
            char.session_start = null;
            char.current_energy = null;
        });
        console.log('😴 All characters are now sleeping');
    }

    // CHARACTER TRAIT-BASED ACTIONS
    getCharacterAction(characterId, situation) {
        const character = this.characterDatabase[characterId];
        if (!character) return null;

        // Action based on personality traits and role
        const actions = {
            'alice_validator': {
                'consensus': 'thoroughly analyzes all data points before validation',
                'conflict': 'requests additional verification evidence', 
                'uncertainty': 'double-checks against established protocols'
            },
            'bob_generator': {
                'consensus': 'proposes creative alternative approaches',
                'conflict': 'suggests innovative compromise solutions',
                'uncertainty': 'generates multiple options to explore'
            },
            'charlie_decider': {
                'consensus': 'synthesizes all viewpoints into balanced decision',
                'conflict': 'facilitates discussion between conflicting parties',
                'uncertainty': 'seeks input from all stakeholders before deciding'
            },
            'diana_checker': {
                'consensus': 'systematically verifies each step of the process',
                'conflict': 'identifies specific points of disagreement',
                'uncertainty': 'requests concrete evidence and documentation'
            }
        };

        return actions[characterId]?.[situation] || 
               `${character.name} acts according to their ${character.personality.archetype} nature`;
    }
}

// INSTANT STARTUP - No delays, just wake the core team
if (require.main === module) {
    console.log('👥 STARTING PERSISTENT CHARACTER ROSTER');
    console.log('=======================================');
    
    const roster = new PersistentCharacterRoster();
    
    // Immediately wake the core consensus team
    console.log('\n🎭 WAKING CORE CONSENSUS TEAM...');
    const coreTeam = roster.wakeTeam('core_consensus');
    
    // Show quick interaction example
    console.log('\n💬 GENERATING SAMPLE INTERACTION...');
    const interaction = roster.generateInteraction('bob_generator', 'charlie_decider', 'consensus');
    if (interaction) {
        console.log(`${interaction.from.name}: "${interaction.content}"`);
    }
    
    // Status report
    console.log('\n📊 ROSTER STATUS:');
    const status = roster.getRosterStatus();
    console.log(`   Active: ${status.active}/${status.total} characters`);
    console.log(`   Teams: ${status.teams_available.join(', ')}`);
    console.log(`   Active characters: ${status.active_list.join(', ')}`);
    
    console.log('\n✅ Character roster ready for instant activation!');
    console.log('💡 No spawning delays - characters wake up immediately');
}

module.exports = PersistentCharacterRoster;