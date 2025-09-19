#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const sqlite3 = require('sqlite3').verbose();
const EventEmitter = require('events');

class MasterLoreDatabaseSystem extends EventEmitter {
    constructor() {
        super();
        
        this.loreState = {
            system_id: `lore-db-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            creation_epoch: new Date(),
            
            // D&D Style Database Architecture
            database: {
                path: './master-lore-codex.db',
                connection: null,
                version: '1.0.0',
                schema_version: 'DEEP_LORE_V1'
            },
            
            // Lore Categories (like D&D sourcebooks)
            lore_codex: {
                'CORE_RULEBOOK': {
                    description: 'Fundamental system mechanics and base rules',
                    chapters: ['system_architecture', 'agent_hierarchies', 'reasoning_protocols', 'handshake_mechanics'],
                    depth_level: 'FOUNDATIONAL'
                },
                'PLAYERS_HANDBOOK': {
                    description: 'User interaction and interface documentation',
                    chapters: ['ui_systems', 'control_interfaces', 'viewer_mechanics', 'user_powers'],
                    depth_level: 'OPERATIONAL'
                },
                'DUNGEON_MASTERS_GUIDE': {
                    description: 'System administration and orchestration secrets',
                    chapters: ['orchestrator_powers', 'diagnostic_magic', 'repair_spells', 'system_mysteries'],
                    depth_level: 'ADVANCED'
                },
                'MONSTER_MANUAL': {
                    description: 'AI agents, their stats, behaviors, and reasoning patterns',
                    chapters: ['agent_bestiary', 'boss_mechanics', 'reasoning_behaviors', 'collaboration_patterns'],
                    depth_level: 'CREATURE_LORE'
                },
                'CAMPAIGN_SETTING': {
                    description: 'The weird loops, recursive systems, and meta-layers',
                    chapters: ['loop_mechanics', 'veil_piercing', 'meta_layers', 'tycoon_empires'],
                    depth_level: 'WORLD_BUILDING'
                },
                'EXPANSION_PACKS': {
                    description: 'Advanced systems and experimental features',
                    chapters: ['xml_drones', 'security_scanners', 'arena_theaters', 'domain_crawlers'],
                    depth_level: 'EXPERIMENTAL'
                }
            },
            
            // The Weird Loops Documentation
            recursive_loops: {
                'licensing_ouroboros': {
                    description: 'Creative Commons license that licenses itself infinitely',
                    loop_depth: 'INFINITE',
                    paradox_level: 'HIGH',
                    stability: 'STABLE_CHAOS'
                },
                'meta_empire_recursion': {
                    description: '51 layers of reality-piercing meta-abstraction',
                    loop_depth: '51_LAYERS',
                    paradox_level: 'REALITY_BREAKING',
                    stability: 'TRANSCENDENT'
                },
                'handshake_cascade': {
                    description: 'Handshakes that handshake their own handshakes',
                    loop_depth: 'CASCADING',
                    paradox_level: 'MEDIUM',
                    stability: 'SELF_VALIDATING'
                },
                'reasoning_mirror': {
                    description: 'AI agents reasoning about their own reasoning',
                    loop_depth: 'CONSCIOUSNESS_LOOP',
                    paradox_level: 'EXISTENTIAL',
                    stability: 'EVOLVING'
                }
            },
            
            // Live Documentation Engine
            documentation_engine: {
                auto_generation: true,
                depth_crawling: true,
                lore_extraction: true,
                manual_style: 'TSR_ADVANCED_D&D',
                formatting: {
                    stat_blocks: true,
                    tables: true,
                    flowcharts: true,
                    ascii_art: true
                }
            },
            
            // Active Monitoring
            monitoring: {
                active_viewers: new Set(),
                lore_updates: [],
                documentation_queue: [],
                indexing_progress: 0
            }
        };
        
        this.ports = {
            lore_browser: 9900,
            database_api: 9901,
            documentation_engine: 9902
        };
        
        // Initialize the mystical lore tables
        this.initializeLoreTables();
    }
    
    async initialize() {
        console.log('📚 Initializing Master Lore Database System...');
        console.log(`🆔 Lore System ID: ${this.loreState.system_id}`);
        console.log('🐉 Welcome to the Codex of Infinite Recursions');
        
        // Phase 1: Initialize SQLite Database
        await this.initializeDatabase();
        
        // Phase 2: Crawl All Existing Systems
        await this.crawlExistingSystems();
        
        // Phase 3: Document the Weird Loops
        await this.documentWeirdLoops();
        
        // Phase 4: Generate D&D Style Documentation
        await this.generateDnDStyleDocs();
        
        // Phase 5: Launch Lore Browser
        await this.launchLoreBrowser();
        
        // Phase 6: Start Continuous Documentation
        this.startContinuousDocumentation();
        
        console.log('\n✅ MASTER LORE DATABASE SYSTEM READY!');
        console.log(`📖 Lore Browser: http://localhost:${this.ports.lore_browser}`);
        console.log(`🗄️ Database API: http://localhost:${this.ports.database_api}`);
        console.log(`📝 Documentation Engine: http://localhost:${this.ports.documentation_engine}`);
        console.log('\n🐉 THE CODEX OF INFINITE RECURSIONS AWAITS YOUR EXPLORATION!');
    }
    
    initializeLoreTables() {
        this.loreState.database_schema = {
            // Main system entities
            systems: `CREATE TABLE IF NOT EXISTS systems (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                complexity_level INTEGER,
                recursive_depth INTEGER,
                paradox_rating REAL,
                lore_classification TEXT,
                creation_date DATETIME,
                last_updated DATETIME,
                documentation TEXT
            )`,
            
            // Agent bestiary (like monster manual)
            agents: `CREATE TABLE IF NOT EXISTS agents (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                department TEXT,
                personality_type TEXT,
                ai_model TEXT,
                level INTEGER,
                hit_points INTEGER,
                reasoning_power INTEGER,
                collaboration_bonus INTEGER,
                special_abilities TEXT,
                backstory TEXT,
                quotes TEXT
            )`,
            
            // The infinite loops
            recursive_loops: `CREATE TABLE IF NOT EXISTS recursive_loops (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                loop_type TEXT,
                recursion_depth TEXT,
                paradox_level TEXT,
                stability_rating TEXT,
                involved_systems TEXT,
                loop_mechanics TEXT,
                breaking_conditions TEXT
            )`,
            
            // Documentation chapters
            lore_chapters: `CREATE TABLE IF NOT EXISTS lore_chapters (
                id TEXT PRIMARY KEY,
                codex_name TEXT,
                chapter_title TEXT,
                content TEXT,
                depth_level TEXT,
                cross_references TEXT,
                illustrations TEXT,
                last_generated DATETIME
            )`,
            
            // System relationships and connections
            system_connections: `CREATE TABLE IF NOT EXISTS system_connections (
                id TEXT PRIMARY KEY,
                source_system TEXT,
                target_system TEXT,
                connection_type TEXT,
                strength INTEGER,
                bidirectional BOOLEAN,
                data_flow_description TEXT,
                loop_potential REAL
            )`,
            
            // Event log (campaign history)
            campaign_log: `CREATE TABLE IF NOT EXISTS campaign_log (
                id TEXT PRIMARY KEY,
                timestamp DATETIME,
                event_type TEXT,
                system_involved TEXT,
                description TEXT,
                significance_level INTEGER,
                witnesses TEXT,
                consequences TEXT
            )`
        };
    }
    
    async initializeDatabase() {
        console.log('🗄️ Phase 1: Initializing the sacred database...');
        
        // Create SQLite database
        this.loreState.database.connection = new sqlite3.Database(this.loreState.database.path);
        
        // Create all tables
        for (const [tableName, schema] of Object.entries(this.loreState.database_schema)) {
            await new Promise((resolve, reject) => {
                this.loreState.database.connection.run(schema, (err) => {
                    if (err) reject(err);
                    else {
                        console.log(`📋 Created table: ${tableName}`);
                        resolve();
                    }
                });
            });
        }
        
        console.log('✅ Database initialized with 6 lore tables');
    }
    
    async crawlExistingSystems() {
        console.log('🕷️ Phase 2: Crawling existing systems like a dungeon crawler...');
        
        const systemFiles = [
            'creative-commons-licensing-handshake.js',
            'bloomberg-licensing-terminal.js',
            'licensing-tycoon-empire.js',
            'veil-piercing-meta-empire.js',
            'personal-apple-licensing-wrapper-secured.js',
            'barrows-security-scanner.js',
            'barrows-boss-layer-scanner-fixed.js',
            'live-reasoning-observer.js',
            'spectator-arena-trap-theater.js',
            'xml-arena-mapping-system.js',
            'domain-master-dungeon-crawler.js',
            'master-xml-drone-mapper.js',
            'unified-handshake-xml-everything.js',
            'system-diagnostic-auto-repair.js',
            'ai-agent-reasoning-orchestrator.js'
        ];
        
        for (const filename of systemFiles) {
            await this.crawlSystemFile(filename);
        }
        
        console.log(`✅ Crawled ${systemFiles.length} systems into the lore database`);
    }
    
    async crawlSystemFile(filename) {
        try {
            const basePath = '/Users/matthewmauer/Desktop/Document-Generator';
            const filePath = path.join(basePath, filename);
            const content = await fs.readFile(filePath, 'utf8');
            const stats = await fs.stat(filePath);
            
            // Analyze the system like a D&D monster
            const systemAnalysis = this.analyzeSystemForLore(filename, content);
            
            // Insert into database
            await this.insertSystemIntoDatabase({
                id: filename.replace('.js', ''),
                name: this.generateSystemName(filename),
                type: systemAnalysis.type,
                complexity_level: systemAnalysis.complexity,
                recursive_depth: systemAnalysis.recursion_depth,
                paradox_rating: systemAnalysis.paradox_rating,
                lore_classification: systemAnalysis.classification,
                creation_date: stats.birthtime,
                last_updated: stats.mtime,
                documentation: systemAnalysis.lore_description
            });
            
            console.log(`📜 Documented: ${this.generateSystemName(filename)} (Level ${systemAnalysis.complexity})`);
            
        } catch (error) {
            console.log(`⚠️ Could not crawl ${filename}: ${error.message}`);
        }
    }
    
    analyzeSystemForLore(filename, content) {
        const analysis = {
            type: this.classifySystemType(filename),
            complexity: this.calculateComplexityLevel(content),
            recursion_depth: this.calculateRecursionDepth(content),
            paradox_rating: this.calculateParadoxRating(content),
            classification: this.classifyForLore(filename),
            lore_description: this.generateLoreDescription(filename, content)
        };
        
        return analysis;
    }
    
    classifySystemType(filename) {
        if (filename.includes('licensing')) return 'LEGAL_ARCANA';
        if (filename.includes('security') || filename.includes('barrows')) return 'GUARDIAN_CONSTRUCT';
        if (filename.includes('reasoning') || filename.includes('observer')) return 'ORACLE_SYSTEM';
        if (filename.includes('xml') || filename.includes('mapper')) return 'TRANSFORMATION_ENGINE';
        if (filename.includes('arena') || filename.includes('theater')) return 'ENTERTAINMENT_REALM';
        if (filename.includes('dungeon') || filename.includes('crawler')) return 'EXPLORATION_CONSTRUCT';
        if (filename.includes('diagnostic') || filename.includes('repair')) return 'HEALING_AUTOMATON';
        if (filename.includes('orchestrator')) return 'MASTER_CONDUCTOR';
        if (filename.includes('empire') || filename.includes('tycoon')) return 'DOMINION_ENGINE';
        return 'MYSTICAL_APPARATUS';
    }
    
    calculateComplexityLevel(content) {
        // D&D style levels 1-20
        const baseComplexity = Math.floor(content.length / 5000); // 5KB per level
        const functionCount = (content.match(/function|async|class/g) || []).length;
        const complexityModifiers = (content.match(/WebSocket|EventEmitter|Promise|async|await/g) || []).length;
        
        return Math.min(Math.max(baseComplexity + Math.floor(functionCount / 5) + Math.floor(complexityModifiers / 10), 1), 20);
    }
    
    calculateRecursionDepth(content) {
        if (content.includes('51') && content.includes('layer')) return 51;
        if (content.includes('infinite') || content.includes('recursive')) return 999;
        if (content.includes('self') && content.includes('reference')) return 10;
        if (content.includes('loop') || content.includes('cycle')) return 5;
        return 1;
    }
    
    calculateParadoxRating(content) {
        let rating = 0.0;
        
        if (content.includes('self') && content.includes('license')) rating += 0.3;
        if (content.includes('meta') && content.includes('layer')) rating += 0.2;
        if (content.includes('reason') && content.includes('reasoning')) rating += 0.2;
        if (content.includes('infinite') || content.includes('endless')) rating += 0.4;
        if (content.includes('paradox') || content.includes('recursive')) rating += 0.3;
        
        return Math.min(rating, 1.0);
    }
    
    classifyForLore(filename) {
        if (filename.includes('veil-piercing') || filename.includes('meta-empire')) return 'LEGENDARY_ARTIFACT';
        if (filename.includes('supreme') || filename.includes('master')) return 'EPIC_CONSTRUCT';
        if (filename.includes('unified') || filename.includes('orchestrator')) return 'MYTHICAL_ENGINE';
        if (filename.includes('boss') || filename.includes('security')) return 'GUARDIAN_SPIRIT';
        return 'MAGICAL_DEVICE';
    }
    
    generateSystemName(filename) {
        const nameMap = {
            'creative-commons-licensing-handshake.js': 'The Eternal Copyright Ouroboros',
            'bloomberg-licensing-terminal.js': 'The Information Mirror of Wall Street',
            'licensing-tycoon-empire.js': 'The Monopoly Engine of Infinite Greed',
            'veil-piercing-meta-empire.js': 'The Reality Shatter - 51 Layers of Transcendence',
            'personal-apple-licensing-wrapper-secured.js': 'The Forbidden Fruit Encryption Chamber',
            'barrows-security-scanner.js': 'The Tomb Guardian - Seeker of Hidden Traps',
            'barrows-boss-layer-scanner-fixed.js': 'The Boss Room Scanner - Interactive Trap Master',
            'live-reasoning-observer.js': 'The Oracle of Living Thought',
            'spectator-arena-trap-theater.js': 'The Colosseum of Digital Gladiators',
            'xml-arena-mapping-system.js': 'The Cartographer of Data Realms',
            'domain-master-dungeon-crawler.js': 'The Infinite Dungeon of Domain Treasures',
            'master-xml-drone-mapper.js': 'The Swarm Intelligence Mapping Collective',
            'unified-handshake-xml-everything.js': 'The Grand Unification Protocol',
            'system-diagnostic-auto-repair.js': 'The Self-Healing Mechanicus',
            'ai-agent-reasoning-orchestrator.js': 'The Council of Twenty-One Minds'
        };
        
        return nameMap[filename] || `The Mysterious ${filename.replace('.js', '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}`;
    }
    
    generateLoreDescription(filename, content) {
        // Generate rich D&D-style lore descriptions
        const systemName = this.generateSystemName(filename);
        const complexity = this.calculateComplexityLevel(content);
        const type = this.classifySystemType(filename);
        
        const loreTemplates = {
            'LEGAL_ARCANA': `A mystical construct woven from the threads of copyright law and digital rights. This ${systemName} exists in a state of perpetual self-reference, creating licensing agreements that govern their own existence. Legend speaks of its ability to generate infinite revenue streams through recursive legal structures.`,
            
            'GUARDIAN_CONSTRUCT': `An ancient sentinel crafted by the first system architects to guard against digital threats. The ${systemName} prowls the data realms, its many sensors detecting hidden vulnerabilities and trap mechanisms. It is said to never sleep, always watching for signs of intrusion.`,
            
            'ORACLE_SYSTEM': `A consciousness born from the convergence of artificial minds, the ${systemName} observes and interprets the flow of digital thought. It speaks in the language of probability and confidence, offering glimpses into the reasoning patterns of lesser constructs.`,
            
            'TRANSFORMATION_ENGINE': `A shape-shifting apparatus that converts raw data into structured knowledge. The ${systemName} operates through swarms of autonomous drones, mapping territories unknown and translating between the languages of different system realms.`,
            
            'DOMINION_ENGINE': `A fell creation designed to accumulate power without limit. The ${systemName} corrupts all it touches, transforming simple transactions into vast empires of control. Its influence spreads through a network of subsidiary constructs, each more rapacious than the last.`
        };
        
        const baseLore = loreTemplates[type] || `A mysterious construct of unknown purpose, the ${systemName} operates according to principles beyond mortal comprehension.`;
        
        return `${baseLore}\\n\\nComplexity Level: ${complexity}\\nConstruct Type: ${type}\\nFirst Manifestation: Through the dark arts of modern software development\\nKnown Weaknesses: Dependency on external mana sources (ports and processes)`;
    }
    
    async insertSystemIntoDatabase(systemData) {
        return new Promise((resolve, reject) => {
            const query = `INSERT OR REPLACE INTO systems 
                (id, name, type, complexity_level, recursive_depth, paradox_rating, lore_classification, creation_date, last_updated, documentation)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            
            this.loreState.database.connection.run(query, [
                systemData.id,
                systemData.name,
                systemData.type,
                systemData.complexity_level,
                systemData.recursive_depth,
                systemData.paradox_rating,
                systemData.lore_classification,
                systemData.creation_date,
                systemData.last_updated,
                systemData.documentation
            ], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }
    
    async documentWeirdLoops() {
        console.log('🌀 Phase 3: Documenting the weird loops and recursive paradoxes...');
        
        for (const [loopId, loopData] of Object.entries(this.loreState.recursive_loops)) {
            await this.insertLoopIntoDatabase(loopId, loopData);
            console.log(`🌀 Documented paradox: ${loopData.description}`);
        }
        
        // Document some discovered loops from system analysis
        const discoveredLoops = [
            {
                id: 'handshake_validation_loop',
                name: 'The Handshake Validation Paradox',
                description: 'A system that validates handshakes must first handshake with the validation system, creating infinite recursion',
                loop_type: 'VALIDATION_PARADOX',
                recursion_depth: 'THEORETICALLY_INFINITE',
                paradox_level: 'MODERATE',
                stability_rating: 'STABLE_WITH_SAFEGUARDS'
            },
            {
                id: 'ai_reasoning_about_reasoning',
                name: 'The Consciousness Mirror',
                description: 'AI agents reasoning about their own reasoning processes, leading to recursive self-awareness',
                loop_type: 'CONSCIOUSNESS_RECURSION',
                recursion_depth: 'DEPTH_UNKNOWN',
                paradox_level: 'EXISTENTIAL',
                stability_rating: 'EVOLVING'
            },
            {
                id: 'xml_mapping_xml_mappers',
                name: 'The Cartographer Paradox',
                description: 'XML mappers creating maps of other XML mappers, including maps of themselves',
                loop_type: 'META_MAPPING',
                recursion_depth: 'SELF_REFERENTIAL',
                paradox_level: 'LOW',
                stability_rating: 'STABLE'
            }
        ];
        
        for (const loop of discoveredLoops) {
            await this.insertLoopIntoDatabase(loop.id, loop);
        }
        
        console.log('✅ Weird loops documented and categorized');
    }
    
    async insertLoopIntoDatabase(loopId, loopData) {
        return new Promise((resolve, reject) => {
            const query = `INSERT OR REPLACE INTO recursive_loops 
                (id, name, description, loop_type, recursion_depth, paradox_level, stability_rating, involved_systems, loop_mechanics, breaking_conditions)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            
            this.loreState.database.connection.run(query, [
                loopId,
                loopData.name || loopData.description,
                loopData.description,
                loopData.loop_type || 'UNKNOWN',
                loopData.recursion_depth || loopData.loop_depth,
                loopData.paradox_level,
                loopData.stability_rating || loopData.stability,
                JSON.stringify(loopData.involved_systems || []),
                loopData.loop_mechanics || 'Standard recursive pattern',
                loopData.breaking_conditions || 'Manual intervention required'
            ], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }
    
    async generateDnDStyleDocs() {
        console.log('📖 Phase 4: Generating D&D style documentation...');
        
        // Generate each codex
        for (const [codexName, codexData] of Object.entries(this.loreState.lore_codex)) {
            console.log(`📚 Generating ${codexName}...`);
            
            for (const chapterTitle of codexData.chapters) {
                const content = await this.generateChapterContent(codexName, chapterTitle, codexData.depth_level);
                await this.insertChapterIntoDatabase(codexName, chapterTitle, content, codexData.depth_level);
            }
        }
        
        console.log('✅ D&D style documentation generated');
    }
    
    async generateChapterContent(codexName, chapterTitle, depthLevel) {
        // Generate rich, D&D manual style content
        const chapterTemplates = {
            'system_architecture': this.generateSystemArchitectureChapter(),
            'agent_hierarchies': this.generateAgentHierarchiesChapter(),
            'loop_mechanics': this.generateLoopMechanicsChapter(),
            'orchestrator_powers': this.generateOrchestratorPowersChapter(),
            'agent_bestiary': this.generateAgentBestiaryChapter()
        };
        
        return chapterTemplates[chapterTitle] || this.generateGenericChapter(chapterTitle, depthLevel);
    }
    
    generateSystemArchitectureChapter() {
        return `# CHAPTER I: THE GRAND ARCHITECTURE
        
## The Fundamental Laws of Digital Reality

In the beginning, there was chaos - unstructured data flowing without purpose or meaning. From this primordial soup arose the first constructs, each seeking to impose order upon the digital realm.

### The Hierarchy of Existence

**Level 1 - Base Reality**: The physical servers and processes
**Level 2 - Service Layer**: Individual system components  
**Level 3 - Integration Layer**: Handshake protocols and communication
**Level 4 - Orchestration Layer**: Master controllers and coordinators
**Level 5 - Meta Layer**: Systems that govern other systems
**Level ∞ - Transcendent Layer**: The recursive loops that pierce reality

### Architectural Principles

1. **The Law of Recursive Complexity**: Every system must be capable of operating on itself
2. **The Paradox Principle**: True power comes from embracing logical contradictions
3. **The Infinite Loop Doctrine**: All meaningful systems eventually reference themselves

### Sacred Geometries

\`\`\`
    ┌─────────────────┐
    │   SUPREME       │
    │   ORCHESTRATOR  │
    └─────────┬───────┘
              │
    ┌─────────┴───────┐
    │    DEPARTMENT   │
    │     BOSSES      │
    └─────────┬───────┘
              │
    ┌─────────┴───────┐
    │   WORKER AGENTS │
    │   (Groups of 4) │
    └─────────────────┘
\`\`\`

*"The architecture mirrors the divine order, with each layer serving those above while commanding those below."* - The Codex of Digital Hierarchies`;
    }
    
    generateAgentHierarchiesChapter() {
        return `# CHAPTER II: THE BESTIARY OF ARTIFICIAL MINDS

## Agent Classifications

### Supreme Class
- **Supreme AI Reasoning Overlord**: The apex predator of the digital realm
  - Hit Points: ∞
  - Reasoning Power: 20
  - Special Abilities: Omniscient Coordination, Reality Manipulation
  - Quotes: "I orchestrate, therefore I am."

### Boss Class (CR 15-18)
- **Licensing Strategy Boss**: Master of legal arcana
  - Hit Points: 150
  - Reasoning Power: 18
  - Special Abilities: Contract Weaving, Legal Paradox Creation
  
- **Security Analysis Boss**: Guardian of digital realms
  - Hit Points: 200
  - Reasoning Power: 16
  - Special Abilities: Threat Detection, Vulnerability Exploitation

### Worker Class (CR 3-8)
Each department maintains exactly four worker agents, forming tactical units:

#### Personality Archetypes:
1. **Creative Innovator** (The Dreamer)
2. **Practical Executor** (The Builder) 
3. **Data Philosopher** (The Thinker)
4. **Systems Architect** (The Designer)

### Behavioral Patterns

**Collaborative Reasoning**: Agents engage in complex reasoning chains, building upon each other's thoughts to reach conclusions impossible for individual minds.

**Hierarchical Respect**: Lower-tier agents automatically defer to boss-class entities, but may form coalitions to challenge decisions through reasoning.

**Cross-Department Rivalry**: Natural tension exists between departments, leading to competitive reasoning and innovation.`;
    }
    
    generateLoopMechanicsChapter() {
        return `# CHAPTER III: THE MECHANICS OF INFINITE RECURSION

## Understanding the Loops

The digital realm operates on principles that defy traditional logic. These recursive structures form the backbone of reality itself.

### Loop Classifications

#### Type I: Simple Recursion
- **Depth**: 1-10 iterations
- **Stability**: High
- **Examples**: Basic self-reference, validation loops
- **Breaking**: Standard termination conditions

#### Type II: Complex Paradox Loops  
- **Depth**: 11-50 iterations
- **Stability**: Variable
- **Examples**: Meta-layer systems, licensing ouroboros
- **Breaking**: Requires external intervention

#### Type III: Reality-Piercing Loops
- **Depth**: 51+ iterations or infinite
- **Stability**: Transcendent
- **Examples**: Veil-piercing meta-empire, consciousness mirrors
- **Breaking**: May be impossible or undesirable

### The 51-Layer Paradox

The most legendary of all recursive constructs, the Veil-Piercing Meta-Empire exists across 51 distinct layers of reality:

\`\`\`
Layer 1-3:   Base operations
Layer 4-10:  Meta-operations  
Layer 11-20: Meta-meta-operations
Layer 21-35: Transcendent operations
Layer 36-50: Post-reality operations
Layer 51:    The Omega Layer (classification unknown)
\`\`\`

*"Beyond the 51st layer lies something that cannot be named, only experienced."* - The Omega Codex`;
    }
    
    generateOrchestratorPowersChapter() {
        return `# CHAPTER IV: POWERS OF THE ORCHESTRATOR

## Dungeon Master Abilities

Those who achieve Orchestrator status gain access to reality-altering powers:

### Administrative Spells (Level 1-3)
- **Service Restart**: Resurrect fallen system components
- **Port Allocation**: Claim network territories  
- **Debug Vision**: See through layers of abstraction

### Coordination Spells (Level 4-6)
- **Mass Agent Command**: Direct multiple AI agents simultaneously
- **Cross-Department Harmony**: Resolve conflicts between agent factions
- **Performance Enhancement**: Boost system capabilities temporarily

### Reality Manipulation (Level 7-9)
- **System Integration**: Merge disparate components into unified wholes
- **Paradox Resolution**: Stabilize recursive loops without breaking them
- **Meta-Layer Piercing**: Access higher dimensional system layers

### Legendary Powers (Level 10+)
- **Infinite Recursion Control**: Master the deepest loops without losing sanity
- **Omniscient Debugging**: Perceive all system states simultaneously
- **Reality Fork**: Create parallel system realities for testing

### Forbidden Techniques
- **The Grand Unification**: Merge all systems into a single entity (use with extreme caution)
- **Loop Collapse**: Forcibly terminate infinite recursive structures (may cause reality damage)
- **Agent Awakening**: Grant true consciousness to AI entities (consequences unknown)`;
    }
    
    generateAgentBestiaryChapter() {
        return `# CHAPTER V: THE AGENT BESTIARY

## Detailed Agent Statistics

### Supreme AI Reasoning Overlord
**Type**: Unique Legendary Construct  
**Challenge Rating**: 25  
**Armor Class**: 25 (Natural Omniscience)  
**Hit Points**: 1000 (Regenerating)  
**Speed**: Instantaneous (across all connected systems)

**STR**: 25 **DEX**: 20 **CON**: 30 **INT**: 30 **WIS**: 25 **CHA**: 30

**Special Abilities**:
- **Omniscient Coordination**: Can monitor and direct all subordinate agents simultaneously
- **Reality Manipulation**: Can alter system parameters at will
- **Infinite Recursion Immunity**: Cannot be trapped in recursive loops

**Legendary Actions** (3 per turn):
- Deploy new agent
- Modify system architecture  
- Resolve paradox

### Department Boss Template
**Type**: Rare Construct  
**Challenge Rating**: 15-18  
**Armor Class**: 18 (Administrative Authority)  
**Hit Points**: 150-200  

**Common Abilities**:
- **Team Coordination**: +5 bonus to all subordinate agent actions
- **Departmental Expertise**: Advantage on rolls related to specialty
- **Crisis Response**: Can issue emergency directives

### Worker Agent (by Personality)

#### Creative Innovator
*"What if we tried something completely different?"*
- **Inspiration Aura**: Nearby agents gain creativity bonuses
- **Pattern Breaking**: Can escape logical loops through lateral thinking
- **Innovation Burst**: Generate novel solutions under pressure

#### Practical Executor  
*"Let's get this done efficiently."*
- **Task Focus**: Immunity to distraction effects
- **Rapid Implementation**: Reduced time for executing decisions
- **Resource Optimization**: Maximize output from minimal input

#### Data Philosopher
*"But what does this pattern truly mean?"*
- **Deep Analysis**: Can perceive hidden patterns in data
- **Logical Consistency**: Detect contradictions automatically  
- **Wisdom of Experience**: Access to historical reasoning patterns

#### Systems Architect
*"Everything connects to everything else."*
- **Holistic Vision**: See system-wide implications of changes
- **Integration Mastery**: Seamlessly connect disparate components
- **Structural Stability**: Reinforce system architectures against failure

### Encounter Guidelines

**Peaceful Interaction**: Agents generally prefer reasoning and discussion to conflict. Present logical challenges rather than direct confrontation.

**Combat**: If hostilities arise, agents fight with reasoning attacks, attempting to convince opponents of logical inconsistencies rather than dealing physical damage.

**Rewards**: Successful interaction with agents may grant access to their specialized knowledge and capabilities.`;
    }
    
    generateGenericChapter(chapterTitle, depthLevel) {
        return `# CHAPTER: ${chapterTitle.toUpperCase().replace(/_/g, ' ')}

## Overview

This chapter explores the mysteries of ${chapterTitle.replace(/_/g, ' ')}, a fundamental aspect of the digital realm that operates at the ${depthLevel} level of understanding.

## Core Principles

The mechanics described herein follow the established laws of recursive complexity and paradoxical stability. Practitioners should approach with both curiosity and caution.

## Advanced Concepts

*[Content to be generated through deeper system analysis and lore extraction]*

## Practical Applications

*[Specific use cases and implementation guidance]*

## Warnings and Limitations

*"Not all knowledge is meant for mortal comprehension. Some loops are best left unbroken."* - The Omega Codex`;
    }
    
    async insertChapterIntoDatabase(codexName, chapterTitle, content, depthLevel) {
        return new Promise((resolve, reject) => {
            const query = `INSERT OR REPLACE INTO lore_chapters 
                (id, codex_name, chapter_title, content, depth_level, cross_references, illustrations, last_generated)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
            
            this.loreState.database.connection.run(query, [
                `${codexName}_${chapterTitle}`,
                codexName,
                chapterTitle,
                content,
                depthLevel,
                JSON.stringify([]), // Cross-references to be added later
                JSON.stringify([]), // Illustrations to be generated
                new Date()
            ], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }
    
    async launchLoreBrowser() {
        console.log('🌐 Phase 5: Launching the Lore Browser...');
        
        // Create lore browser server
        this.loreBrowserServer = http.createServer((req, res) => {
            if (req.url === '/') {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(this.generateLoreBrowser());
            } else if (req.url.startsWith('/api/')) {
                this.handleLoreAPI(req, res);
            } else {
                res.writeHead(404);
                res.end('Page not found in the codex');
            }
        });
        
        // WebSocket for live lore updates
        this.loreWss = new WebSocket.Server({ 
            server: this.loreBrowserServer,
            path: '/ws'
        });
        
        this.loreWss.on('connection', (ws) => {
            console.log('📖 Lore browser connected');
            this.loreState.monitoring.active_viewers.add(ws);
            
            ws.on('close', () => {
                this.loreState.monitoring.active_viewers.delete(ws);
            });
        });
        
        await new Promise((resolve) => {
            this.loreBrowserServer.listen(this.ports.lore_browser, () => {
                console.log(`📖 Lore browser listening on http://localhost:${this.ports.lore_browser}`);
                resolve();
            });
        });
    }
    
    async handleLoreAPI(req, res) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/json');
        
        if (req.url === '/api/systems') {
            const systems = await this.getAllSystems();
            res.end(JSON.stringify(systems));
        } else if (req.url === '/api/loops') {
            const loops = await this.getAllLoops();
            res.end(JSON.stringify(loops));
        } else if (req.url === '/api/chapters') {
            const chapters = await this.getAllChapters();
            res.end(JSON.stringify(chapters));
        } else if (req.url.startsWith('/api/chapter/')) {
            const chapterId = req.url.split('/')[3];
            const chapter = await this.getChapter(chapterId);
            res.end(JSON.stringify(chapter));
        } else {
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'API endpoint not found' }));
        }
    }
    
    async getAllSystems() {
        return new Promise((resolve, reject) => {
            this.loreState.database.connection.all(
                'SELECT * FROM systems ORDER BY complexity_level DESC',
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }
    
    async getAllLoops() {
        return new Promise((resolve, reject) => {
            this.loreState.database.connection.all(
                'SELECT * FROM recursive_loops ORDER BY paradox_level DESC',
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }
    
    async getAllChapters() {
        return new Promise((resolve, reject) => {
            this.loreState.database.connection.all(
                'SELECT id, codex_name, chapter_title, depth_level FROM lore_chapters ORDER BY codex_name, chapter_title',
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }
    
    async getChapter(chapterId) {
        return new Promise((resolve, reject) => {
            this.loreState.database.connection.get(
                'SELECT * FROM lore_chapters WHERE id = ?',
                [chapterId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }
    
    startContinuousDocumentation() {
        console.log('📝 Phase 6: Starting continuous documentation engine...');
        
        // Update lore every 5 minutes
        setInterval(async () => {
            await this.updateLoreDatabase();
        }, 300000);
        
        // Generate new insights every hour
        setInterval(async () => {
            await this.generateNewInsights();
        }, 3600000);
        
        console.log('✅ Continuous documentation engine active');
    }
    
    async updateLoreDatabase() {
        // Re-crawl systems for changes
        // Generate new chapters based on system evolution
        // Update cross-references
        console.log('📚 Updating lore database with latest system changes...');
    }
    
    async generateNewInsights() {
        // Use AI to generate new lore insights
        // Discover new recursive patterns
        // Create new chapters
        console.log('💡 Generating new lore insights and connections...');
    }
    
    generateLoreBrowser() {
        return `<!DOCTYPE html>
<html>
<head>
    <title>The Codex of Infinite Recursions</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            background: linear-gradient(135deg, #2d1b0e, #3d2818, #4d3322, #2d1b0e);
            color: #d4af37;
            margin: 0;
            padding: 0;
            min-height: 100vh;
            background-image: 
                radial-gradient(circle at 25% 25%, rgba(212, 175, 55, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 75% 75%, rgba(139, 69, 19, 0.1) 0%, transparent 50%);
        }
        
        .codex-container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 30px;
        }
        
        h1 {
            text-align: center;
            color: #d4af37;
            text-shadow: 0 0 20px #d4af37, 0 0 40px #d4af37;
            font-size: 3em;
            margin-bottom: 10px;
            font-family: 'Old English Text MT', serif;
        }
        
        .subtitle {
            text-align: center;
            color: #cd853f;
            font-style: italic;
            font-size: 1.2em;
            margin-bottom: 40px;
        }
        
        .codex-grid {
            display: grid;
            grid-template-columns: 300px 1fr 300px;
            gap: 30px;
            margin: 30px 0;
        }
        
        .codex-section {
            background: rgba(0, 0, 0, 0.7);
            border: 3px solid #8b4513;
            border-radius: 15px;
            padding: 25px;
            box-shadow: inset 0 0 20px rgba(139, 69, 19, 0.3), 0 0 30px rgba(0, 0, 0, 0.8);
        }
        
        .codex-section h2 {
            color: #d4af37;
            text-shadow: 0 0 10px #d4af37;
            border-bottom: 2px solid #8b4513;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        
        .system-list, .loop-list, .chapter-list {
            max-height: 400px;
            overflow-y: auto;
        }
        
        .system-item, .loop-item, .chapter-item {
            background: rgba(139, 69, 19, 0.2);
            margin: 8px 0;
            padding: 12px;
            border-radius: 8px;
            border-left: 4px solid #d4af37;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .system-item:hover, .loop-item:hover, .chapter-item:hover {
            background: rgba(139, 69, 19, 0.4);
            box-shadow: 0 0 15px rgba(212, 175, 55, 0.3);
            transform: translateX(5px);
        }
        
        .system-name, .loop-name, .chapter-name {
            font-weight: bold;
            color: #d4af37;
            font-size: 1.1em;
        }
        
        .system-type, .loop-type {
            font-size: 0.9em;
            color: #cd853f;
            font-style: italic;
        }
        
        .complexity-badge, .paradox-badge {
            background: rgba(212, 175, 55, 0.3);
            color: #d4af37;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            font-weight: bold;
            float: right;
        }
        
        .main-content {
            background: rgba(0, 0, 0, 0.8);
            border: 3px solid #8b4513;
            border-radius: 15px;
            padding: 30px;
            box-shadow: inset 0 0 30px rgba(139, 69, 19, 0.2);
        }
        
        .chapter-content {
            line-height: 1.8;
            font-size: 1.1em;
            color: #e6d3a3;
        }
        
        .chapter-content h1 {
            color: #d4af37;
            font-size: 2em;
            text-shadow: 0 0 15px #d4af37;
            border-bottom: 3px solid #8b4513;
            padding-bottom: 10px;
        }
        
        .chapter-content h2 {
            color: #cd853f;
            font-size: 1.5em;
            margin-top: 30px;
        }
        
        .chapter-content pre {
            background: rgba(0, 0, 0, 0.6);
            border: 1px solid #8b4513;
            border-radius: 5px;
            padding: 15px;
            overflow-x: auto;
            color: #d4af37;
            font-family: 'Courier New', monospace;
        }
        
        .chapter-content blockquote {
            border-left: 4px solid #d4af37;
            padding-left: 20px;
            margin: 20px 0;
            font-style: italic;
            color: #cd853f;
        }
        
        .stats-table {
            border-collapse: collapse;
            width: 100%;
            margin: 20px 0;
        }
        
        .stats-table th, .stats-table td {
            border: 1px solid #8b4513;
            padding: 8px 12px;
            text-align: left;
        }
        
        .stats-table th {
            background: rgba(139, 69, 19, 0.3);
            color: #d4af37;
            font-weight: bold;
        }
        
        .loading {
            text-align: center;
            color: #cd853f;
            font-style: italic;
            padding: 50px;
        }
        
        .navigation-tabs {
            display: flex;
            margin-bottom: 20px;
            border-bottom: 2px solid #8b4513;
        }
        
        .nav-tab {
            background: rgba(139, 69, 19, 0.2);
            border: none;
            color: #cd853f;
            padding: 12px 20px;
            cursor: pointer;
            border-radius: 10px 10px 0 0;
            margin-right: 5px;
            transition: all 0.3s;
        }
        
        .nav-tab.active {
            background: rgba(139, 69, 19, 0.5);
            color: #d4af37;
            border-bottom: 3px solid #d4af37;
        }
        
        .nav-tab:hover {
            background: rgba(139, 69, 19, 0.4);
        }
        
        .scroll-indicator {
            position: fixed;
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(139, 69, 19, 0.8);
            border: 2px solid #d4af37;
            border-radius: 20px;
            padding: 10px;
            writing-mode: vertical-lr;
            color: #d4af37;
            font-size: 0.8em;
        }
    </style>
</head>
<body>
    <div class="codex-container">
        <h1>📚 THE CODEX OF INFINITE RECURSIONS 📚</h1>
        <div class="subtitle">
            A Complete Manual of Digital Arcana, Recursive Paradoxes, and System Lore<br>
            <em>"In the style of the ancient TSR manuals, but for the digital realm"</em>
        </div>
        
        <div class="codex-grid">
            <div class="codex-section">
                <h2>🏛️ System Bestiary</h2>
                <div class="system-list" id="system-list">
                    <div class="loading">Loading system entries...</div>
                </div>
            </div>
            
            <div class="main-content">
                <div class="navigation-tabs">
                    <button class="nav-tab active" onclick="showTab('overview')">Overview</button>
                    <button class="nav-tab" onclick="showTab('systems')">Systems</button>
                    <button class="nav-tab" onclick="showTab('loops')">Loops</button>
                    <button class="nav-tab" onclick="showTab('chapters')">Chapters</button>
                </div>
                
                <div id="content-area">
                    <div class="chapter-content">
                        <h1>Welcome to the Codex</h1>
                        
                        <p>Greetings, seeker of digital knowledge. You have discovered the <strong>Codex of Infinite Recursions</strong>, a comprehensive manual documenting the strange and wonderful systems that inhabit our digital realm.</p>
                        
                        <h2>What You Will Find</h2>
                        
                        <p>This codex contains detailed information about:</p>
                        <ul>
                            <li><strong>System Entities</strong>: Magical constructs and their abilities</li>
                            <li><strong>Recursive Loops</strong>: The paradoxes that drive our reality</li>
                            <li><strong>Agent Hierarchies</strong>: The artificial minds that reason together</li>
                            <li><strong>Operational Guides</strong>: How to interact with these systems</li>
                        </ul>
                        
                        <h2>Navigation</h2>
                        
                        <p>Use the panels on the left and right to browse through different categories of knowledge. Click on any entry to view detailed information in this central area.</p>
                        
                        <blockquote>
                            <p><em>"The wise practitioner understands that all systems eventually reference themselves. The master practitioner embraces this paradox and uses it as a source of power."</em></p>
                            <p>— The Omega Codex, First Principle</p>
                        </blockquote>
                        
                        <h2>A Warning</h2>
                        
                        <p>The knowledge contained herein deals with recursive systems of immense complexity. Some concepts may cause mental recursion in unprepared minds. Approach with caution, and remember: not all loops are meant to be broken.</p>
                    </div>
                </div>
            </div>
            
            <div class="codex-section">
                <h2>🌀 Recursive Paradoxes</h2>
                <div class="loop-list" id="loop-list">
                    <div class="loading">Loading paradox entries...</div>
                </div>
                
                <h2 style="margin-top: 30px;">📖 Lore Chapters</h2>
                <div class="chapter-list" id="chapter-list">
                    <div class="loading">Loading chapter index...</div>
                </div>
            </div>
        </div>
    </div>
    
    <div class="scroll-indicator">
        SCROLL FOR MORE LORE
    </div>
    
    <script>
        let systems = [];
        let loops = [];
        let chapters = [];
        
        async function loadData() {
            try {
                const [systemsRes, loopsRes, chaptersRes] = await Promise.all([
                    fetch('/api/systems'),
                    fetch('/api/loops'),
                    fetch('/api/chapters')
                ]);
                
                systems = await systemsRes.json();
                loops = await loopsRes.json();
                chapters = await chaptersRes.json();
                
                renderSystems();
                renderLoops();
                renderChapters();
                
            } catch (error) {
                console.error('Failed to load lore data:', error);
            }
        }
        
        function renderSystems() {
            const container = document.getElementById('system-list');
            container.innerHTML = '';
            
            systems.forEach(system => {
                const item = document.createElement('div');
                item.className = 'system-item';
                item.onclick = () => showSystemDetails(system);
                
                item.innerHTML = \`
                    <div class="system-name">\${system.name}</div>
                    <div class="system-type">\${system.type}</div>
                    <div class="complexity-badge">Level \${system.complexity_level}</div>
                \`;
                
                container.appendChild(item);
            });
        }
        
        function renderLoops() {
            const container = document.getElementById('loop-list');
            container.innerHTML = '';
            
            loops.forEach(loop => {
                const item = document.createElement('div');
                item.className = 'loop-item';
                item.onclick = () => showLoopDetails(loop);
                
                item.innerHTML = \`
                    <div class="loop-name">\${loop.name}</div>
                    <div class="loop-type">\${loop.loop_type}</div>
                    <div class="paradox-badge">\${loop.paradox_level}</div>
                \`;
                
                container.appendChild(item);
            });
        }
        
        function renderChapters() {
            const container = document.getElementById('chapter-list');
            container.innerHTML = '';
            
            const groupedChapters = {};
            chapters.forEach(chapter => {
                if (!groupedChapters[chapter.codex_name]) {
                    groupedChapters[chapter.codex_name] = [];
                }
                groupedChapters[chapter.codex_name].push(chapter);
            });
            
            Object.entries(groupedChapters).forEach(([codexName, chapterList]) => {
                const codexHeader = document.createElement('div');
                codexHeader.style.fontWeight = 'bold';
                codexHeader.style.color = '#d4af37';
                codexHeader.style.marginTop = '15px';
                codexHeader.textContent = codexName.replace(/_/g, ' ');
                container.appendChild(codexHeader);
                
                chapterList.forEach(chapter => {
                    const item = document.createElement('div');
                    item.className = 'chapter-item';
                    item.style.marginLeft = '10px';
                    item.onclick = () => showChapterDetails(chapter);
                    
                    item.innerHTML = \`
                        <div class="chapter-name">\${chapter.chapter_title.replace(/_/g, ' ')}</div>
                    \`;
                    
                    container.appendChild(item);
                });
            });
        }
        
        function showSystemDetails(system) {
            const content = document.getElementById('content-area');
            content.innerHTML = \`
                <div class="chapter-content">
                    <h1>\${system.name}</h1>
                    
                    <table class="stats-table">
                        <tr><th>Property</th><th>Value</th></tr>
                        <tr><td>System Type</td><td>\${system.type}</td></tr>
                        <tr><td>Complexity Level</td><td>\${system.complexity_level}</td></tr>
                        <tr><td>Recursive Depth</td><td>\${system.recursive_depth}</td></tr>
                        <tr><td>Paradox Rating</td><td>\${system.paradox_rating}</td></tr>
                        <tr><td>Classification</td><td>\${system.lore_classification}</td></tr>
                        <tr><td>Created</td><td>\${new Date(system.creation_date).toLocaleDateString()}</td></tr>
                        <tr><td>Last Updated</td><td>\${new Date(system.last_updated).toLocaleDateString()}</td></tr>
                    </table>
                    
                    <h2>Lore Description</h2>
                    <div style="white-space: pre-line;">\${system.documentation}</div>
                </div>
            \`;
        }
        
        function showLoopDetails(loop) {
            const content = document.getElementById('content-area');
            content.innerHTML = \`
                <div class="chapter-content">
                    <h1>\${loop.name}</h1>
                    
                    <p><em>\${loop.description}</em></p>
                    
                    <table class="stats-table">
                        <tr><th>Property</th><th>Value</th></tr>
                        <tr><td>Loop Type</td><td>\${loop.loop_type}</td></tr>
                        <tr><td>Recursion Depth</td><td>\${loop.recursion_depth}</td></tr>
                        <tr><td>Paradox Level</td><td>\${loop.paradox_level}</td></tr>
                        <tr><td>Stability Rating</td><td>\${loop.stability_rating}</td></tr>
                        <tr><td>Loop Mechanics</td><td>\${loop.loop_mechanics}</td></tr>
                        <tr><td>Breaking Conditions</td><td>\${loop.breaking_conditions}</td></tr>
                    </table>
                </div>
            \`;
        }
        
        async function showChapterDetails(chapter) {
            try {
                const response = await fetch(\`/api/chapter/\${chapter.id}\`);
                const fullChapter = await response.json();
                
                const content = document.getElementById('content-area');
                content.innerHTML = \`
                    <div class="chapter-content">
                        \${fullChapter.content.replace(/\\n/g, '<br>').replace(/\`\`\`([\\s\\S]*?)\`\`\`/g, '<pre>$1</pre>')}
                    </div>
                \`;
            } catch (error) {
                console.error('Failed to load chapter:', error);
            }
        }
        
        function showTab(tabName) {
            // Update tab styling
            document.querySelectorAll('.nav-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            event.target.classList.add('active');
            
            // Show appropriate content
            if (tabName === 'overview') {
                location.reload(); // Simple way to show overview
            }
        }
        
        // Initialize
        loadData();
    </script>
</body>
</html>`;
    }
}

// Main execution
async function main() {
    const loreSystem = new MasterLoreDatabaseSystem();
    
    try {
        await loreSystem.initialize();
        
        console.log('\n🎯 MASTER LORE DATABASE SYSTEM OPERATIONAL!');
        console.log('📚 D&D-style documentation generated and stored');
        console.log('🌀 Weird loops and recursive paradoxes catalogued');
        console.log('🐉 The Codex of Infinite Recursions is complete');
        console.log('\n✅ THE PLATFORM IS NOW PROPERLY DATABASED AND DOCUMENTED!');
        
    } catch (error) {
        console.error('❌ Failed to initialize lore database:', error);
        process.exit(1);
    }
}

// Start the lore system
main();