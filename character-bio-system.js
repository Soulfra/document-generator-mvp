#!/usr/bin/env node

/**
 * CHARACTER BIO SYSTEM
 * Generates, manages, and evolves character biographies based on world experiences
 * Tracks character development, achievements, and story arcs across worlds
 */

const EventEmitter = require('events');
const fs = require('fs').promises;
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

class CharacterBioSystem extends EventEmitter {
    constructor() {
        super();
        
        this.bioDatabase = new Map(); // character_id -> bio data
        this.storyTemplates = new Map();
        this.personalityArchetypes = new Map();
        this.bioGenerationRules = new Map();
        
        this.config = {
            bioUpdateFrequency: 24 * 60 * 60 * 1000, // 24 hours
            maxBioLength: 2000,
            storyArcDepth: 5, // Number of significant events to track
            personalityEvolutionRate: 0.01,
            memoryImportanceThreshold: 0.7
        };
        
        this.initialize();
    }
    
    async initialize() {
        console.log('📚 Initializing Character Bio System...');
        
        await this.setupDatabase();
        await this.loadStoryTemplates();
        await this.loadPersonalityArchetypes();
        await this.setupBioGenerationRules();
        this.startBioEvolutionEngine();
        
        console.log('✅ Character Bio System initialized');
        this.emit('bio_system:ready');
    }
    
    async setupDatabase() {
        this.db = new sqlite3.Database('character_bios.db');
        
        const schemas = [
            `CREATE TABLE IF NOT EXISTS character_biographies (
                character_id TEXT PRIMARY KEY,
                full_name TEXT,
                display_name TEXT,
                title TEXT,
                age INTEGER,
                origin_world TEXT,
                current_residence TEXT,
                occupation TEXT,
                biography TEXT,
                personality_summary TEXT,
                key_traits JSON,
                backstory TEXT,
                goals JSON,
                fears JSON,
                secrets JSON,
                catchphrase TEXT,
                voice_style TEXT,
                appearance_description TEXT,
                signature_items JSON,
                bio_version INTEGER DEFAULT 1,
                last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS character_story_arcs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                character_id TEXT NOT NULL,
                arc_name TEXT NOT NULL,
                arc_type TEXT DEFAULT 'personal_growth',
                description TEXT,
                start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                estimated_end_date TIMESTAMP,
                actual_end_date TIMESTAMP,
                current_chapter INTEGER DEFAULT 1,
                total_chapters INTEGER DEFAULT 5,
                status TEXT DEFAULT 'active',
                world_context TEXT,
                key_events JSON,
                character_growth JSON,
                FOREIGN KEY (character_id) REFERENCES character_biographies(character_id)
            )`,
            
            `CREATE TABLE IF NOT EXISTS character_achievements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                character_id TEXT NOT NULL,
                achievement_type TEXT NOT NULL,
                achievement_name TEXT NOT NULL,
                description TEXT,
                world_earned TEXT,
                zone_earned TEXT,
                difficulty_level INTEGER DEFAULT 1,
                rarity TEXT DEFAULT 'common',
                earned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                witnesses JSON,
                celebration_level INTEGER DEFAULT 1,
                FOREIGN KEY (character_id) REFERENCES character_biographies(character_id)
            )`,
            
            `CREATE TABLE IF NOT EXISTS character_relationships_bio (
                character_id TEXT NOT NULL,
                relationship_target TEXT NOT NULL,
                relationship_description TEXT,
                significance_to_story TEXT,
                relationship_history TEXT,
                current_status TEXT,
                emotional_impact REAL DEFAULT 0.0,
                story_importance INTEGER DEFAULT 1,
                PRIMARY KEY (character_id, relationship_target),
                FOREIGN KEY (character_id) REFERENCES character_biographies(character_id)
            )`,
            
            `CREATE TABLE IF NOT EXISTS character_evolution_log (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                character_id TEXT NOT NULL,
                evolution_type TEXT NOT NULL,
                old_value TEXT,
                new_value TEXT,
                reason TEXT,
                world_context TEXT,
                evolution_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (character_id) REFERENCES character_biographies(character_id)
            )`,
            
            `CREATE TABLE IF NOT EXISTS bio_generation_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                character_id TEXT NOT NULL,
                generation_type TEXT NOT NULL,
                input_data JSON,
                generated_content TEXT,
                generation_quality REAL,
                used_templates JSON,
                generation_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (character_id) REFERENCES character_biographies(character_id)
            )`
        ];
        
        for (const schema of schemas) {
            await this.dbRun(schema);
        }
    }
    
    async loadStoryTemplates() {
        this.storyTemplates = new Map([
            ['hero_journey', {
                name: 'The Hero\'s Journey',
                stages: [
                    'ordinary_world',
                    'call_to_adventure',
                    'refusal_of_call',
                    'meeting_mentor',
                    'crossing_threshold',
                    'tests_and_trials',
                    'revelation',
                    'transformation',
                    'return_home'
                ],
                arcTypes: ['warrior', 'mage', 'explorer', 'guardian'],
                templates: {
                    opening: "In the {origin_world}, {character_name} lived an ordinary life as a {occupation}...",
                    call: "Everything changed when {inciting_incident} occurred...",
                    journey: "Through trials in {world_names}, {character_name} discovered {key_learning}...",
                    growth: "These experiences transformed {character_name} from {old_trait} to {new_trait}..."
                }
            }],
            
            ['slice_of_life', {
                name: 'Slice of Life',
                stages: [
                    'daily_routine',
                    'small_challenges',
                    'character_moments',
                    'relationship_building',
                    'personal_growth',
                    'seasonal_changes'
                ],
                arcTypes: ['everyman', 'caregiver', 'innocent', 'sage'],
                templates: {
                    opening: "{character_name} enjoys the simple pleasures of life in {home_world}...",
                    daily: "Each day brings small joys and gentle challenges...",
                    relationships: "Through conversations and shared experiences with {friends}, {character_name} learns...",
                    growth: "While dramatic adventures may not define their story, {character_name} finds meaning in..."
                }
            }],
            
            ['rags_to_riches', {
                name: 'Rags to Riches',
                stages: [
                    'humble_beginnings',
                    'initial_struggle',
                    'opportunity_appears',
                    'hard_work_pays_off',
                    'first_success',
                    'setbacks',
                    'final_triumph',
                    'wisdom_gained'
                ],
                arcTypes: ['creator', 'ruler', 'magician'],
                templates: {
                    opening: "{character_name} started with nothing in {origin_world}, working as {humble_job}...",
                    struggle: "Despite facing {obstacles}, they never gave up on their dream of {goal}...",
                    success: "Through determination and help from {allies}, {character_name} achieved {achievement}...",
                    wisdom: "Success taught {character_name} that {life_lesson}..."
                }
            }],
            
            ['mystery_solver', {
                name: 'Mystery and Discovery',
                stages: [
                    'discovery_of_mystery',
                    'initial_investigation',
                    'gathering_clues',
                    'false_leads',
                    'breakthrough',
                    'confrontation',
                    'resolution',
                    'new_understanding'
                ],
                arcTypes: ['investigator', 'sage', 'explorer'],
                templates: {
                    opening: "{character_name} stumbled upon a mystery in {discovery_world}...",
                    investigation: "Using their skills in {specialty}, they began to uncover {clues}...",
                    breakthrough: "The truth was more complex than expected: {revelation}...",
                    resolution: "Solving this mystery changed how {character_name} views {worldview_change}..."
                }
            }],
            
            ['mentor_figure', {
                name: 'The Mentor\'s Path',
                stages: [
                    'mastery_achieved',
                    'desire_to_teach',
                    'first_student',
                    'teaching_challenges',
                    'student_growth',
                    'mentor_learning',
                    'legacy_building'
                ],
                arcTypes: ['sage', 'caregiver', 'ruler'],
                templates: {
                    opening: "Having mastered {expertise} in {world_names}, {character_name} felt called to teach...",
                    teaching: "Guiding {students} through {challenges} reminded {character_name} of {own_journey}...",
                    legacy: "{character_name}'s greatest achievement isn't personal success, but the growth of {student_count} students..."
                }
            }]
        ]);
    }
    
    async loadPersonalityArchetypes() {
        this.personalityArchetypes = new Map([
            ['the_innocent', {
                traits: ['optimistic', 'trusting', 'sincere', 'hopeful'],
                motivations: ['happiness', 'peace', 'simple_pleasures'],
                fears: ['punishment', 'doing_wrong', 'corruption'],
                speaking_style: 'warm and genuine',
                growth_direction: 'learning wisdom while keeping wonder',
                common_goals: ['help_others', 'find_belonging', 'stay_true']
            }],
            
            ['the_explorer', {
                traits: ['curious', 'independent', 'adventurous', 'restless'],
                motivations: ['freedom', 'discovery', 'new_experiences'],
                fears: ['being_trapped', 'conformity', 'emptiness'],
                speaking_style: 'enthusiastic and descriptive',
                growth_direction: 'finding purpose in wandering',
                common_goals: ['see_all_worlds', 'understand_mysteries', 'break_boundaries']
            }],
            
            ['the_creator', {
                traits: ['imaginative', 'innovative', 'perfectionist', 'expressive'],
                motivations: ['creation', 'beauty', 'self_expression'],
                fears: ['mediocrity', 'chaos', 'uninspired_work'],
                speaking_style: 'passionate and visual',
                growth_direction: 'balancing vision with execution',
                common_goals: ['create_masterpiece', 'inspire_others', 'leave_legacy']
            }],
            
            ['the_caregiver', {
                traits: ['nurturing', 'empathetic', 'generous', 'protective'],
                motivations: ['helping_others', 'preventing_harm', 'creating_harmony'],
                fears: ['selfishness', 'abandonment', 'seeing_others_suffer'],
                speaking_style: 'warm and supportive',
                growth_direction: 'learning to care for self too',
                common_goals: ['protect_loved_ones', 'heal_world', 'build_community']
            }],
            
            ['the_sage', {
                traits: ['wise', 'contemplative', 'analytical', 'patient'],
                motivations: ['understanding', 'truth', 'knowledge'],
                fears: ['ignorance', 'deception', 'being_wrong'],
                speaking_style: 'thoughtful and precise',
                growth_direction: 'applying wisdom practically',
                common_goals: ['seek_truth', 'share_knowledge', 'solve_problems']
            }],
            
            ['the_rebel', {
                traits: ['revolutionary', 'independent', 'passionate', 'defiant'],
                motivations: ['freedom', 'change', 'breaking_rules'],
                fears: ['powerlessness', 'conformity', 'stagnation'],
                speaking_style: 'direct and challenging',
                growth_direction: 'constructive rather than destructive change',
                common_goals: ['overthrow_tyranny', 'liberate_others', 'prove_point']
            }],
            
            ['the_magician', {
                traits: ['visionary', 'charismatic', 'transformative', 'powerful'],
                motivations: ['transformation', 'making_dreams_real', 'understanding_universe'],
                fears: ['inability_to_help', 'unintended_consequences', 'corruption'],
                speaking_style: 'inspiring and mysterious',
                growth_direction: 'using power responsibly',
                common_goals: ['master_abilities', 'help_others_transform', 'reshape_reality']
            }]
        ]);
    }
    
    async setupBioGenerationRules() {
        this.bioGenerationRules = new Map([
            ['name_generation', {
                patterns: {
                    human_western: ['First Last', 'First Middle Last', 'First "Nickname" Last'],
                    human_eastern: ['Family Given', 'Family-Given'],
                    fantasy: ['First Epithet', 'First of Place', 'First the Descriptor'],
                    tech: ['First.exe', 'First_Version', 'First-Model-Number'],
                    mysterious: ['The Descriptor', 'Descriptor One', 'Name-That-Isn\'t-Real']
                },
                elements: {
                    descriptors: ['Swift', 'Wise', 'Bold', 'Gentle', 'Fierce', 'Clever', 'Kind', 'Brilliant'],
                    epithets: ['Wanderer', 'Seeker', 'Builder', 'Guardian', 'Dreamweaver', 'Truthfinder'],
                    places: ['Tokyo', 'the_North', 'the_Academy', 'the_Underground', 'the_Stars']
                }
            }],
            
            ['backstory_elements', {
                origins: [
                    'orphaned_young', 'noble_family', 'merchant_class', 'scholarly_background',
                    'artistic_family', 'military_tradition', 'mystical_lineage', 'tech_innovators',
                    'refugees', 'immigrants', 'indigenous_people', 'time_travelers'
                ],
                formative_events: [
                    'discovery_of_talent', 'loss_of_loved_one', 'betrayal_by_friend', 'moment_of_courage',
                    'failure_that_taught_lesson', 'unexpected_kindness', 'revelation_about_world',
                    'meeting_mentor', 'surviving_disaster', 'finding_purpose'
                ],
                turning_points: [
                    'left_home', 'chose_different_path', 'stood_up_for_beliefs', 'made_sacrifice',
                    'discovered_truth', 'found_love', 'lost_everything', 'gained_power',
                    'learned_humility', 'embraced_destiny'
                ]
            }],
            
            ['relationship_dynamics', {
                family_relationships: [
                    'devoted_to_parents', 'estranged_from_family', 'protective_of_siblings',
                    'living_up_to_legacy', 'breaking_family_tradition', 'searching_for_family',
                    'adopted_found_family', 'complicated_inheritance'
                ],
                friendship_patterns: [
                    'loyal_to_few', 'makes_friends_easily', 'prefers_solitude', 'builds_communities',
                    'attracts_outcasts', 'bridges_different_groups', 'mentors_younger_people',
                    'learns_from_everyone'
                ],
                romantic_inclinations: [
                    'hopeless_romantic', 'practical_about_love', 'afraid_of_commitment',
                    'believes_in_soulmates', 'values_friendship_first', 'complicated_past_love',
                    'focused_on_goals_over_romance', 'finds_love_in_unexpected_places'
                ]
            }]
        ]);
    }
    
    async generateCharacterBio(characterId, baseData = {}) {
        console.log(`📝 Generating bio for character: ${characterId}`);
        
        // Determine archetype based on existing character data or generate one
        const archetype = baseData.archetype || this.selectArchetype(baseData);
        const storyTemplate = baseData.storyTemplate || this.selectStoryTemplate(archetype);
        
        // Generate basic information
        const bioData = {
            character_id: characterId,
            full_name: baseData.fullName || this.generateName(baseData.nameStyle || 'human_western'),
            display_name: baseData.displayName || baseData.name || characterId,
            title: this.generateTitle(archetype),
            age: baseData.age || this.generateAge(archetype),
            origin_world: baseData.originWorld || 'earth',
            current_residence: baseData.currentWorld || baseData.originWorld || 'earth',
            occupation: this.generateOccupation(archetype),
            personality_summary: this.generatePersonalitySummary(archetype),
            key_traits: this.generateTraits(archetype),
            goals: this.generateGoals(archetype),
            fears: this.generateFears(archetype),
            secrets: this.generateSecrets(archetype),
            catchphrase: baseData.catchphrase || this.generateCatchphrase(archetype),
            voice_style: this.generateVoiceStyle(archetype),
            appearance_description: this.generateAppearance(baseData),
            signature_items: this.generateSignatureItems(archetype)
        };
        
        // Generate backstory using story template
        bioData.backstory = await this.generateBackstory(bioData, storyTemplate, archetype);
        
        // Generate main biography text
        bioData.biography = await this.generateBiographyText(bioData, storyTemplate);
        
        // Save to database
        await this.saveBioToDatabase(bioData);
        
        // Cache in memory
        this.bioDatabase.set(characterId, bioData);
        
        // Start initial story arc
        await this.createStoryArc(characterId, 'origin_story', storyTemplate);
        
        this.emit('bio:generated', { characterId, bioData });
        
        console.log(`✅ Generated biography for ${bioData.display_name}`);
        return bioData;
    }
    
    selectArchetype(baseData) {
        // Use existing personality traits if available
        if (baseData.traits && baseData.traits.length > 0) {
            for (const [archetypeName, archetypeData] of this.personalityArchetypes) {
                const matchingTraits = baseData.traits.filter(trait => 
                    archetypeData.traits.includes(trait)
                ).length;
                
                if (matchingTraits >= 2) {
                    return archetypeName;
                }
            }
        }
        
        // Default to random archetype
        const archetypes = Array.from(this.personalityArchetypes.keys());
        return archetypes[Math.floor(Math.random() * archetypes.length)];
    }
    
    selectStoryTemplate(archetype) {
        const archetypeData = this.personalityArchetypes.get(archetype);
        
        // Map archetypes to preferred story templates
        const templatePreferences = {
            'the_innocent': ['slice_of_life', 'hero_journey'],
            'the_explorer': ['hero_journey', 'mystery_solver'],
            'the_creator': ['rags_to_riches', 'slice_of_life'],
            'the_caregiver': ['mentor_figure', 'slice_of_life'],
            'the_sage': ['mentor_figure', 'mystery_solver'],
            'the_rebel': ['hero_journey', 'rags_to_riches'],
            'the_magician': ['hero_journey', 'mystery_solver']
        };
        
        const preferences = templatePreferences[archetype] || ['slice_of_life'];
        return preferences[Math.floor(Math.random() * preferences.length)];
    }
    
    generateName(style) {
        const patterns = this.bioGenerationRules.get('name_generation').patterns[style];
        const pattern = patterns[Math.floor(Math.random() * patterns.length)];
        
        const firstNames = ['Alex', 'Sam', 'Jordan', 'Casey', 'Riley', 'Taylor', 'Morgan', 'Avery'];
        const lastNames = ['Smith', 'Johnson', 'Chen', 'Patel', 'Kim', 'Rodriguez', 'O\'Brien', 'Nakamura'];
        const nicknames = ['Spark', 'Echo', 'Pixel', 'Nova', 'Sage', 'Quest', 'Drift', 'Flux'];
        
        let name = pattern;
        name = name.replace('First', firstNames[Math.floor(Math.random() * firstNames.length)]);
        name = name.replace('Last', lastNames[Math.floor(Math.random() * lastNames.length)]);
        name = name.replace('Nickname', nicknames[Math.floor(Math.random() * nicknames.length)]);
        
        return name;
    }
    
    generateTitle(archetype) {
        const titles = {
            'the_innocent': ['The Hopeful', 'The Pure Heart', 'The Bright Soul'],
            'the_explorer': ['The Wanderer', 'The Seeker', 'The Pathfinder'],
            'the_creator': ['The Innovator', 'The Artisan', 'The Visionary'],
            'the_caregiver': ['The Guardian', 'The Healer', 'The Protector'],
            'the_sage': ['The Wise', 'The Scholar', 'The Truth-Seeker'],
            'the_rebel': ['The Revolutionary', 'The Free Spirit', 'The Challenger'],
            'the_magician': ['The Transformer', 'The Reality Shaper', 'The Mystic']
        };
        
        const archetypeTitles = titles[archetype] || ['The Unique One'];
        return archetypeTitles[Math.floor(Math.random() * archetypeTitles.length)];
    }
    
    generateAge(archetype) {
        // Different archetypes tend toward different age ranges
        const ageRanges = {
            'the_innocent': [16, 25],
            'the_explorer': [20, 35],
            'the_creator': [25, 45],
            'the_caregiver': [30, 50],
            'the_sage': [40, 70],
            'the_rebel': [18, 30],
            'the_magician': [25, 60]
        };
        
        const [min, max] = ageRanges[archetype] || [20, 40];
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    generateOccupation(archetype) {
        const occupations = {
            'the_innocent': ['Student', 'Helper', 'Apprentice', 'Volunteer'],
            'the_explorer': ['Travel Guide', 'Researcher', 'Scout', 'Journalist'],
            'the_creator': ['Artist', 'Inventor', 'Designer', 'Architect'],
            'the_caregiver': ['Teacher', 'Healer', 'Counselor', 'Community Organizer'],
            'the_sage': ['Scholar', 'Advisor', 'Librarian', 'Philosopher'],
            'the_rebel': ['Activist', 'Revolutionary', 'Independent Worker', 'Reformer'],
            'the_magician': ['Consultant', 'Entrepreneur', 'Innovator', 'Change Agent']
        };
        
        const archetypeOccupations = occupations[archetype] || ['Professional'];
        return archetypeOccupations[Math.floor(Math.random() * archetypeOccupations.length)];
    }
    
    generatePersonalitySummary(archetype) {
        const archetypeData = this.personalityArchetypes.get(archetype);
        const traits = archetypeData.traits.slice(0, 3); // Take first 3 traits
        
        return `A ${traits.join(', ')} individual who ${archetypeData.growth_direction}. 
                Known for their ${archetypeData.speaking_style} communication style.`;
    }
    
    generateTraits(archetype) {
        const archetypeData = this.personalityArchetypes.get(archetype);
        return [...archetypeData.traits];
    }
    
    generateGoals(archetype) {
        const archetypeData = this.personalityArchetypes.get(archetype);
        return [...archetypeData.common_goals];
    }
    
    generateFears(archetype) {
        const archetypeData = this.personalityArchetypes.get(archetype);
        return [...archetypeData.fears];
    }
    
    generateSecrets(archetype) {
        const secrets = [
            'Has a hidden talent they\'re embarrassed about',
            'Carries a memento from their past',
            'Dreams of a completely different life',
            'Made a promise they\'re struggling to keep',
            'Knows something that would change everything',
            'Has feelings they haven\'t expressed',
            'Regrets a choice from their youth',
            'Possesses an item of mysterious origin'
        ];
        
        // Return 1-2 random secrets
        const numSecrets = Math.random() > 0.5 ? 2 : 1;
        const selectedSecrets = [];
        
        for (let i = 0; i < numSecrets; i++) {
            const secret = secrets[Math.floor(Math.random() * secrets.length)];
            if (!selectedSecrets.includes(secret)) {
                selectedSecrets.push(secret);
            }
        }
        
        return selectedSecrets;
    }
    
    generateCatchphrase(archetype) {
        const catchphrases = {
            'the_innocent': [
                'There\'s always hope!',
                'Everything happens for a reason!',
                'Let\'s look on the bright side!'
            ],
            'the_explorer': [
                'Adventure awaits!',
                'There\'s always another path!',
                'What\'s over that hill?'
            ],
            'the_creator': [
                'Imagine the possibilities!',
                'Art is life!',
                'There\'s beauty in everything!'
            ],
            'the_caregiver': [
                'We\'re all in this together!',
                'How can I help?',
                'Everyone deserves kindness!'
            ],
            'the_sage': [
                'Knowledge is the greatest treasure!',
                'Understanding brings peace!',
                'The truth will set us free!'
            ],
            'the_rebel': [
                'Rules are meant to be challenged!',
                'Change starts with us!',
                'Freedom isn\'t free!'
            ],
            'the_magician': [
                'Anything is possible!',
                'Transform your reality!',
                'Magic is just science we don\'t understand yet!'
            ]
        };
        
        const phrases = catchphrases[archetype] || ['Let\'s make a difference!'];
        return phrases[Math.floor(Math.random() * phrases.length)];
    }
    
    generateVoiceStyle(archetype) {
        const styles = {
            'the_innocent': 'warm and genuine',
            'the_explorer': 'enthusiastic and descriptive',
            'the_creator': 'passionate and visual',
            'the_caregiver': 'supportive and empathetic',
            'the_sage': 'thoughtful and precise',
            'the_rebel': 'direct and challenging',
            'the_magician': 'inspiring and mysterious'
        };
        
        return styles[archetype] || 'friendly and approachable';
    }
    
    generateAppearance(baseData) {
        const appearances = [
            'tall and graceful with kind eyes',
            'compact and energetic with quick movements',
            'average height with an intense gaze',
            'striking presence with confident posture',
            'gentle appearance with a warm smile',
            'distinctive style that reflects their personality',
            'practical clothing suited to their activities',
            'unique accessories that tell their story'
        ];
        
        return baseData.appearance || appearances[Math.floor(Math.random() * appearances.length)];
    }
    
    generateSignatureItems(archetype) {
        const items = {
            'the_innocent': ['lucky charm', 'family photo', 'handwritten letter'],
            'the_explorer': ['worn map', 'compass', 'travel journal'],
            'the_creator': ['favorite brush', 'sketch pad', 'unusual tool'],
            'the_caregiver': ['first aid kit', 'comfort item', 'shared photo'],
            'the_sage': ['ancient book', 'reading glasses', 'wise quote'],
            'the_rebel': ['protest pin', 'manifesto', 'symbol of resistance'],
            'the_magician': ['mysterious pendant', 'unusual device', 'transformation tool']
        };
        
        const archetypeItems = items[archetype] || ['meaningful object'];
        const numItems = Math.floor(Math.random() * 2) + 1; // 1-2 items
        
        return archetypeItems.slice(0, numItems);
    }
    
    async generateBackstory(bioData, storyTemplate, archetype) {
        const template = this.storyTemplates.get(storyTemplate);
        const backstoryElements = this.bioGenerationRules.get('backstory_elements');
        
        // Select elements for backstory
        const origin = backstoryElements.origins[Math.floor(Math.random() * backstoryElements.origins.length)];
        const formativeEvent = backstoryElements.formative_events[Math.floor(Math.random() * backstoryElements.formative_events.length)];
        const turningPoint = backstoryElements.turning_points[Math.floor(Math.random() * backstoryElements.turning_points.length)];
        
        const backstory = `
            Born into ${origin.replace('_', ' ')}, ${bioData.display_name} experienced ${formativeEvent.replace('_', ' ')} 
            during their youth in ${bioData.origin_world}. This shaped their ${archetype.replace('the_', '')} nature.
            
            The turning point came when they ${turningPoint.replace('_', ' ')}, leading them to become 
            ${bioData.occupation.toLowerCase()}. Their goal of ${bioData.goals[0]?.replace('_', ' ')} drives 
            everything they do, while their fear of ${bioData.fears[0]?.replace('_', ' ')} keeps them grounded.
        `.trim().replace(/\s+/g, ' ');
        
        return backstory;
    }
    
    async generateBiographyText(bioData, storyTemplate) {
        const template = this.storyTemplates.get(storyTemplate);
        
        let biography = `${bioData.display_name}, known as "${bioData.title}", is a ${bioData.age}-year-old 
        ${bioData.occupation.toLowerCase()} from ${bioData.origin_world}. `;
        
        biography += bioData.backstory + '\n\n';
        
        biography += `Personality-wise, ${bioData.display_name} is ${bioData.key_traits.slice(0, 3).join(', ')}. 
        Their speaking style is ${bioData.voice_style}, and they're often heard saying "${bioData.catchphrase}" `;
        
        if (bioData.signature_items.length > 0) {
            biography += `They're never seen without their ${bioData.signature_items.join(' and ')}, which 
            ${bioData.signature_items.length === 1 ? 'holds' : 'hold'} special meaning in their story. `;
        }
        
        // Add goals and aspirations
        biography += `Currently, ${bioData.display_name} is focused on ${bioData.goals.slice(0, 2).join(' and ')}.`;
        
        return biography;
    }
    
    async saveBioToDatabase(bioData) {
        await this.dbRun(`
            INSERT OR REPLACE INTO character_biographies 
            (character_id, full_name, display_name, title, age, origin_world, current_residence,
             occupation, biography, personality_summary, key_traits, backstory, goals, fears, 
             secrets, catchphrase, voice_style, appearance_description, signature_items)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            bioData.character_id, bioData.full_name, bioData.display_name, bioData.title,
            bioData.age, bioData.origin_world, bioData.current_residence, bioData.occupation,
            bioData.biography, bioData.personality_summary, JSON.stringify(bioData.key_traits),
            bioData.backstory, JSON.stringify(bioData.goals), JSON.stringify(bioData.fears),
            JSON.stringify(bioData.secrets), bioData.catchphrase, bioData.voice_style,
            bioData.appearance_description, JSON.stringify(bioData.signature_items)
        ]);
    }
    
    async createStoryArc(characterId, arcName, arcType) {
        const template = this.storyTemplates.get(arcType);
        const stages = template?.stages || ['beginning', 'middle', 'end'];
        
        await this.dbRun(`
            INSERT INTO character_story_arcs 
            (character_id, arc_name, arc_type, description, total_chapters, key_events)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            characterId, arcName, arcType, 
            `The ${arcName.replace('_', ' ')} story arc following the ${arcType.replace('_', ' ')} template`,
            stages.length, JSON.stringify([])
        ]);
        
        this.emit('story_arc:created', { characterId, arcName, arcType });
    }
    
    async updateBioFromExperience(characterId, experience) {
        const bio = await this.getCharacterBio(characterId);
        if (!bio) return;
        
        let bioChanged = false;
        const updates = {};
        
        // Update based on experience type
        switch (experience.type) {
            case 'achievement':
                await this.addAchievement(characterId, experience);
                bioChanged = true;
                break;
                
            case 'relationship_formed':
                await this.updateRelationshipBio(characterId, experience);
                bioChanged = true;
                break;
                
            case 'world_visit':
                if (!bio.current_residence === experience.world) {
                    updates.current_residence = experience.world;
                    bioChanged = true;
                }
                break;
                
            case 'skill_gained':
                // Update occupation if skill is significant
                if (experience.skill_level > 50) {
                    const newOccupation = this.deriveOccupationFromSkill(experience.skill_name);
                    if (newOccupation !== bio.occupation) {
                        updates.occupation = newOccupation;
                        bioChanged = true;
                    }
                }
                break;
                
            case 'personality_change':
                if (this.isSignificantPersonalityChange(experience)) {
                    await this.evolvePersonality(characterId, experience);
                    bioChanged = true;
                }
                break;
        }
        
        if (bioChanged) {
            // Update biography text
            if (Object.keys(updates).length > 0) {
                const updatedBio = { ...bio, ...updates };
                updates.biography = await this.regenerateBiographySection(updatedBio, experience);
            }
            
            // Save updates
            if (Object.keys(updates).length > 0) {
                await this.updateBioDatabase(characterId, updates);
            }
            
            // Log evolution
            await this.logBioEvolution(characterId, experience, updates);
            
            this.emit('bio:updated', { characterId, experience, updates });
        }
    }
    
    async addAchievement(characterId, achievement) {
        await this.dbRun(`
            INSERT INTO character_achievements
            (character_id, achievement_type, achievement_name, description, world_earned, 
             zone_earned, difficulty_level, rarity, witnesses)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            characterId, achievement.achievement_type, achievement.name, achievement.description,
            achievement.world, achievement.zone, achievement.difficulty || 1, 
            achievement.rarity || 'common', JSON.stringify(achievement.witnesses || [])
        ]);
        
        console.log(`🏆 Added achievement for ${characterId}: ${achievement.name}`);
    }
    
    async updateRelationshipBio(characterId, relationship) {
        await this.dbRun(`
            INSERT OR REPLACE INTO character_relationships_bio
            (character_id, relationship_target, relationship_description, significance_to_story,
             current_status, emotional_impact, story_importance)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            characterId, relationship.target, relationship.description,
            relationship.significance || 'New relationship', relationship.status || 'active',
            relationship.emotional_impact || 0.0, relationship.importance || 1
        ]);
    }
    
    deriveOccupationFromSkill(skillName) {
        const skillToOccupation = {
            'programming': 'Software Developer',
            'art': 'Artist',
            'music': 'Musician',
            'combat': 'Guardian',
            'magic': 'Mage',
            'crafting': 'Artisan',
            'leadership': 'Leader',
            'healing': 'Healer',
            'teaching': 'Teacher',
            'exploration': 'Explorer'
        };
        
        return skillToOccupation[skillName.toLowerCase()] || 'Specialist';
    }
    
    isSignificantPersonalityChange(experience) {
        return experience.trait_change && Math.abs(experience.trait_change.value) > 0.3;
    }
    
    async evolvePersonality(characterId, experience) {
        const bio = await this.getCharacterBio(characterId);
        const currentTraits = bio.key_traits || [];
        
        // Add new trait if not present
        if (experience.new_trait && !currentTraits.includes(experience.new_trait)) {
            currentTraits.push(experience.new_trait);
            
            // Keep only top 6 traits
            if (currentTraits.length > 6) {
                currentTraits.splice(0, 1);
            }
            
            await this.updateBioDatabase(characterId, { key_traits: JSON.stringify(currentTraits) });
        }
    }
    
    async regenerateBiographySection(bio, experience) {
        // Add new information to biography
        let updatedBio = bio.biography;
        
        if (experience.type === 'achievement') {
            updatedBio += `\n\nRecently, ${bio.display_name} achieved ${experience.name}, 
                          demonstrating their ${experience.trait_shown || 'determination'}.`;
        }
        
        if (experience.type === 'world_visit') {
            updatedBio += `\n\nTheir travels to ${experience.world} have broadened their perspective 
                          and added to their growing wisdom.`;
        }
        
        return updatedBio;
    }
    
    async updateBioDatabase(characterId, updates) {
        const updatePairs = Object.entries(updates).map(([key, value]) => {
            const dbValue = typeof value === 'object' ? JSON.stringify(value) : value;
            return `${key} = ?`;
        });
        
        const updateValues = Object.values(updates).map(value => 
            typeof value === 'object' ? JSON.stringify(value) : value
        );
        
        await this.dbRun(`
            UPDATE character_biographies 
            SET ${updatePairs.join(', ')}, last_updated = CURRENT_TIMESTAMP
            WHERE character_id = ?
        `, [...updateValues, characterId]);
    }
    
    async logBioEvolution(characterId, experience, updates) {
        for (const [field, newValue] of Object.entries(updates)) {
            await this.dbRun(`
                INSERT INTO character_evolution_log
                (character_id, evolution_type, new_value, reason, world_context)
                VALUES (?, ?, ?, ?, ?)
            `, [
                characterId, field, 
                typeof newValue === 'object' ? JSON.stringify(newValue) : newValue,
                `Experience: ${experience.type}`, experience.world || 'unknown'
            ]);
        }
    }
    
    async getCharacterBio(characterId) {
        // Check memory cache first
        if (this.bioDatabase.has(characterId)) {
            return this.bioDatabase.get(characterId);
        }
        
        // Load from database
        const bio = await this.dbGet(`
            SELECT * FROM character_biographies WHERE character_id = ?
        `, [characterId]);
        
        if (bio) {
            // Parse JSON fields
            bio.key_traits = JSON.parse(bio.key_traits || '[]');
            bio.goals = JSON.parse(bio.goals || '[]');
            bio.fears = JSON.parse(bio.fears || '[]');
            bio.secrets = JSON.parse(bio.secrets || '[]');
            bio.signature_items = JSON.parse(bio.signature_items || '[]');
            
            // Cache in memory
            this.bioDatabase.set(characterId, bio);
        }
        
        return bio;
    }
    
    async getCharacterStoryArcs(characterId) {
        return await this.dbAll(`
            SELECT * FROM character_story_arcs 
            WHERE character_id = ? 
            ORDER BY start_date DESC
        `, [characterId]);
    }
    
    async getCharacterAchievements(characterId) {
        return await this.dbAll(`
            SELECT * FROM character_achievements 
            WHERE character_id = ? 
            ORDER BY earned_date DESC
        `, [characterId]);
    }
    
    async getCharacterRelationships(characterId) {
        return await this.dbAll(`
            SELECT * FROM character_relationships_bio 
            WHERE character_id = ? 
            ORDER BY story_importance DESC
        `, [characterId]);
    }
    
    startBioEvolutionEngine() {
        console.log('🔄 Starting bio evolution engine...');
        
        // Periodic bio updates based on character activity
        setInterval(async () => {
            // This would integrate with character activity monitoring
            // For now, it's a placeholder for the evolution system
        }, this.config.bioUpdateFrequency);
        
        console.log('✅ Bio evolution engine started');
    }
    
    // Utility methods
    dbRun(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve(this);
            });
        });
    }
    
    dbGet(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }
    
    dbAll(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
}

// Export and demo
module.exports = CharacterBioSystem;

if (require.main === module) {
    const bioSystem = new CharacterBioSystem();
    
    bioSystem.on('bio_system:ready', async () => {
        console.log('\n📚 CHARACTER BIO SYSTEM DEMO\n');
        
        // Generate a demo character bio
        const demoCharacter = await bioSystem.generateCharacterBio('demo_alice', {
            name: 'Alice',
            archetype: 'the_explorer',
            age: 25,
            originWorld: 'earth',
            traits: ['curious', 'adventurous', 'friendly']
        });
        
        console.log('📝 Generated Character Bio:');
        console.log(`Name: ${demoCharacter.full_name}`);
        console.log(`Title: ${demoCharacter.title}`);
        console.log(`Age: ${demoCharacter.age}`);
        console.log(`Occupation: ${demoCharacter.occupation}`);
        console.log(`Catchphrase: "${demoCharacter.catchphrase}"`);
        console.log(`\nBiography:\n${demoCharacter.biography}`);
        
        // Simulate an experience update
        setTimeout(async () => {
            console.log('\n🎯 Simulating character achievement...');
            
            await bioSystem.updateBioFromExperience('demo_alice', {
                type: 'achievement',
                achievement_type: 'exploration',
                name: 'First World Visitor',
                description: 'Visited their first alternate world',
                world: 'fantasy_realm',
                difficulty: 3,
                rarity: 'uncommon'
            });
            
            console.log('✅ Character bio updated with new achievement!');
        }, 3000);
    });
}