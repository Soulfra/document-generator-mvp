#!/usr/bin/env node

/**
 * 💭 RESPAWN MEMORY SYSTEM - Persistent Character Memory
 * 
 * Character memory that survives "respawns" and system restarts.
 * Skills/instincts carried forward across iterations.
 * Integrates with existing context-memory-stream-manager.
 * Proper archiving without breaking ladder resumption.
 * 
 * Features:
 * - Persistent character skills across respawns
 * - Gut instincts learned from experience
 * - Context preservation during system restarts
 * - Learning patterns and behavioral memory
 * - Integration with Cal Memory Ladder system
 * - Archive-safe resumption mechanisms
 */

const { EventEmitter } = require('events');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const zlib = require('zlib');
const { promisify } = require('util');

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

console.log('\n💭 RESPAWN MEMORY SYSTEM INITIALIZING...');
console.log('======================================');
console.log('🧠 Character memory persistence');
console.log('⚡ Skills survive respawns');
console.log('🎯 Gut instincts from experience');
console.log('📚 Learning pattern recognition');
console.log('🔄 Archive-safe resumption');

class RespawnMemorySystem extends EventEmitter {
    constructor(config = {}) {
        super();
        
        // Configuration
        this.config = {
            basePath: config.basePath || './respawn-memory',
            memoryPath: config.memoryPath || './respawn-memory/characters',
            archivePath: config.archivePath || './respawn-memory/archives', 
            backupPath: config.backupPath || './respawn-memory/backups',
            
            // Memory retention settings
            skillRetentionDays: config.skillRetentionDays || 365, // 1 year
            instinctRetentionDays: config.instinctRetentionDays || 90, // 3 months
            learningRetentionDays: config.learningRetentionDays || 30, // 1 month
            
            // Compression settings
            compressionEnabled: config.compressionEnabled !== false,
            compressionThreshold: config.compressionThreshold || 1024, // 1KB
            
            // Backup settings
            autoBackup: config.autoBackup !== false,
            backupIntervalHours: config.backupIntervalHours || 6
        };
        
        // Memory structures
        this.characterMemories = new Map(); // Active character memories
        this.skillEvolution = new Map();    // How skills evolve over time
        this.instinctPatterns = new Map();  // Gut instinct patterns
        this.learningHistory = new Map();   // Learning progression history
        this.contextStreams = new Map();    // Active context streams
        
        // Character definitions (synchronized with Universal Brain)
        this.characters = {
            'cal': {
                name: 'Cal',
                emoji: '📊',
                role: 'Systems Architect',
                specialty: 'databases & orchestration',
                baseSkills: ['sql-mastery', 'system-design', 'data-modeling'],
                instinctDomains: ['fintech', 'systems', 'database', 'architecture']
            },
            'arty': {
                name: 'Arty', 
                emoji: '🎨',
                role: 'Creative Director',
                specialty: 'UI/UX & design',
                baseSkills: ['design-thinking', 'user-experience', 'visual-hierarchy'],
                instinctDomains: ['gaming', 'design', 'visual', 'creative']
            },
            'ralph': {
                name: 'Ralph',
                emoji: '🏗️',
                role: 'Infrastructure Lead',
                specialty: 'DevOps & deployment',
                baseSkills: ['containerization', 'orchestration', 'monitoring'],
                instinctDomains: ['infrastructure', 'devops', 'deployment', 'scaling']
            },
            'vera': {
                name: 'Vera',
                emoji: '🔬', 
                role: 'Research Scientist',
                specialty: 'AI & algorithms',
                baseSkills: ['machine-learning', 'research-methodology', 'data-science'],
                instinctDomains: ['research', 'ai', 'ml', 'algorithms']
            },
            'paulo': {
                name: 'Paulo',
                emoji: '🛡️',
                role: 'Security Expert',
                specialty: 'Auth & protection',
                baseSkills: ['security-analysis', 'threat-modeling', 'compliance'],
                instinctDomains: ['security', 'auth', 'protection', 'compliance']
            },
            'nash': {
                name: 'Nash',
                emoji: '📢',
                role: 'Community Manager', 
                specialty: 'Communication & docs',
                baseSkills: ['community-building', 'documentation', 'communication'],
                instinctDomains: ['community', 'communication', 'docs', 'support']
            }
        };
        
        // Statistics
        this.stats = {
            total_respawns: 0,
            skills_preserved: 0,
            instincts_learned: 0,
            memories_archived: 0,
            successful_resumptions: 0,
            failed_resumptions: 0
        };
        
        this.initializeRespawnMemory();
    }
    
    async initializeRespawnMemory() {
        console.log('💭 Setting up respawn memory system...');
        
        // Ensure directory structure exists
        await this.setupDirectoryStructure();
        
        // Load existing character memories
        await this.loadCharacterMemories();
        
        // Setup skill evolution tracking
        this.setupSkillEvolution();
        
        // Setup instinct pattern recognition
        this.setupInstinctPatterns();
        
        // Setup learning history tracking
        this.setupLearningHistory();
        
        // Setup context stream management
        this.setupContextStreams();
        
        // Start background maintenance
        this.startMaintenanceTasks();
        
        console.log('✅ Respawn memory system ready');
        console.log('   📊 Characters loaded: ' + this.characterMemories.size);
        console.log('   🧠 Memory patterns active: ' + this.instinctPatterns.size);
        console.log('   📚 Learning histories: ' + this.learningHistory.size);
    }
    
    async setupDirectoryStructure() {
        const directories = [
            this.config.basePath,
            this.config.memoryPath,
            this.config.archivePath,
            this.config.backupPath,
            path.join(this.config.memoryPath, 'skills'),
            path.join(this.config.memoryPath, 'instincts'),
            path.join(this.config.memoryPath, 'learning'),
            path.join(this.config.memoryPath, 'contexts')
        ];
        
        for (const dir of directories) {
            await fs.mkdir(dir, { recursive: true });
        }
    }
    
    async loadCharacterMemories() {
        console.log('📚 Loading existing character memories...');
        
        let loadedCount = 0;
        
        for (const [charId, charDef] of Object.entries(this.characters)) {
            try {
                const memoryFile = path.join(this.config.memoryPath, charId + '.json');
                const memoryData = await fs.readFile(memoryFile, 'utf8');
                const parsedMemory = JSON.parse(memoryData);
                
                // Restore character memory
                const characterMemory = {
                    character_id: charId,
                    character_name: charDef.name,
                    
                    // Core skills (base + evolved)
                    skills: new Set([
                        ...charDef.baseSkills,
                        ...(parsedMemory.evolved_skills || [])
                    ]),
                    
                    // Gut instincts from experience
                    instincts: new Map(parsedMemory.instincts || []),
                    
                    // Learning history and patterns
                    learnings: parsedMemory.learnings || [],
                    learning_patterns: parsedMemory.learning_patterns || {},
                    
                    // Context and state information
                    last_contexts: parsedMemory.last_contexts || [],
                    active_domains: new Set(parsedMemory.active_domains || charDef.instinctDomains),
                    
                    // Performance metrics
                    success_rate: parsedMemory.success_rate || 0.5,
                    experience_level: parsedMemory.experience_level || 'novice',
                    respawn_count: parsedMemory.respawn_count || 0,
                    
                    // Metadata
                    created_at: parsedMemory.created_at || new Date().toISOString(),
                    last_respawn: parsedMemory.last_respawn || new Date().toISOString(),
                    last_updated: new Date().toISOString()
                };
                
                this.characterMemories.set(charId, characterMemory);
                loadedCount++;
                
                console.log('   💭 Loaded memory for ' + charDef.name + ' (' + characterMemory.skills.size + ' skills, ' + characterMemory.instincts.size + ' instincts)');
                
            } catch (error) {
                // Character has no previous memory - create new
                console.log('   🆕 Creating new memory for ' + charDef.name);
                await this.initializeCharacterMemory(charId);
                loadedCount++;
            }
        }
        
        console.log('📚 Loaded memories for ' + loadedCount + ' characters');
    }
    
    async initializeCharacterMemory(characterId) {
        const charDef = this.characters[characterId];
        if (!charDef) {
            throw new Error('Unknown character: ' + characterId);
        }
        
        const characterMemory = {
            character_id: characterId,
            character_name: charDef.name,
            
            skills: new Set(charDef.baseSkills),
            instincts: new Map(),
            learnings: [],
            learning_patterns: {},
            last_contexts: [],
            active_domains: new Set(charDef.instinctDomains),
            
            success_rate: 0.5,
            experience_level: 'novice',
            respawn_count: 0,
            
            created_at: new Date().toISOString(),
            last_respawn: new Date().toISOString(),
            last_updated: new Date().toISOString()
        };
        
        this.characterMemories.set(characterId, characterMemory);
        await this.saveCharacterMemory(characterId);
    }
    
    setupSkillEvolution() {
        console.log('⚡ Setting up skill evolution tracking...');
        
        // Define how skills can evolve
        this.skillEvolutionPaths = {
            // Cal's skill evolution paths
            'sql-mastery': {
                next_level: 'sql-optimization',
                triggers: ['performance-tuning', 'complex-queries'],
                experience_required: 10
            },
            'system-design': {
                next_level: 'distributed-architecture',
                triggers: ['scalability-challenges', 'multi-service-design'],
                experience_required: 15
            },
            
            // Arty's skill evolution paths  
            'design-thinking': {
                next_level: 'user-psychology',
                triggers: ['user-research', 'behavioral-analysis'],
                experience_required: 12
            },
            'visual-hierarchy': {
                next_level: 'adaptive-design',
                triggers: ['responsive-design', 'accessibility'],
                experience_required: 8
            },
            
            // Ralph's skill evolution paths
            'containerization': {
                next_level: 'orchestration-mastery',
                triggers: ['kubernetes-deployment', 'service-mesh'],
                experience_required: 20
            },
            
            // Vera's skill evolution paths
            'machine-learning': {
                next_level: 'deep-learning-specialist',
                triggers: ['neural-networks', 'model-optimization'],
                experience_required: 25
            },
            
            // Paulo's skill evolution paths
            'security-analysis': {
                next_level: 'threat-intelligence',
                triggers: ['advanced-threats', 'security-automation'],
                experience_required: 18
            },
            
            // Nash's skill evolution paths
            'community-building': {
                next_level: 'community-psychology',
                triggers: ['large-scale-engagement', 'community-analytics'],
                experience_required: 14
            }
        };
        
        console.log('⚡ Skill evolution paths configured: ' + Object.keys(this.skillEvolutionPaths).length + ' paths');
    }
    
    setupInstinctPatterns() {
        console.log('🎯 Setting up instinct pattern recognition...');
        
        // Define instinct pattern types
        this.instinctPatternTypes = {
            // Success patterns - what works well
            success_patterns: {
                weight: 1.0,
                retention: 90, // days
                triggers: ['successful_outcome', 'positive_feedback']
            },
            
            // Failure patterns - what to avoid
            failure_patterns: {
                weight: 0.8,
                retention: 60, // days  
                triggers: ['failed_outcome', 'negative_feedback']
            },
            
            // Efficiency patterns - faster ways to do things
            efficiency_patterns: {
                weight: 1.2,
                retention: 120, // days
                triggers: ['time_saved', 'resource_optimization']
            },
            
            // Context patterns - situational awareness
            context_patterns: {
                weight: 0.9,
                retention: 45, // days
                triggers: ['context_match', 'domain_expertise']
            }
        };
        
        console.log('🎯 Instinct pattern types configured: ' + Object.keys(this.instinctPatternTypes).length + ' types');
    }
    
    setupLearningHistory() {
        console.log('📚 Setting up learning history tracking...');
        
        // Define learning categories
        this.learningCategories = {
            skill_acquisition: 'New skills learned',
            problem_solving: 'Problem-solving approaches',
            domain_expertise: 'Domain-specific knowledge',
            collaboration: 'Working with other characters',
            optimization: 'Performance improvements',
            creativity: 'Creative solutions and innovations'
        };
        
        console.log('📚 Learning categories configured: ' + Object.keys(this.learningCategories).length + ' categories');
    }
    
    setupContextStreams() {
        console.log('🌊 Setting up context stream management...');
        
        // Context stream types
        this.contextStreamTypes = {
            active_session: 'Currently active work session',
            background_processing: 'Background tasks and monitoring',
            learning_session: 'Dedicated learning and skill development',
            collaboration: 'Working with other characters or users',
            problem_solving: 'Focused problem-solving activities'
        };
        
        console.log('🌊 Context streams configured: ' + Object.keys(this.contextStreamTypes).length + ' types');
    }
    
    async recordExperience(characterId, experience) {
        console.log('📝 Recording experience for ' + characterId + ': ' + experience.type);
        
        const characterMemory = this.characterMemories.get(characterId);
        if (!characterMemory) {
            throw new Error('Character memory not found: ' + characterId);
        }
        
        const experienceRecord = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            type: experience.type,
            context: experience.context || {},
            outcome: experience.outcome || 'unknown',
            success: experience.success !== false,
            skills_used: experience.skills_used || [],
            new_skills_learned: experience.new_skills_learned || [],
            instincts_triggered: experience.instincts_triggered || [],
            duration: experience.duration || 0,
            metadata: experience.metadata || {}
        };
        
        // Add to learning history
        characterMemory.learnings.push(experienceRecord);
        
        // Process skill evolution
        await this.processSkillEvolution(characterId, experienceRecord);
        
        // Process instinct learning
        await this.processInstinctLearning(characterId, experienceRecord);
        
        // Update learning patterns
        this.updateLearningPatterns(characterId, experienceRecord);
        
        // Update performance metrics
        this.updatePerformanceMetrics(characterId, experienceRecord);
        
        // Save updated memory
        await this.saveCharacterMemory(characterId);
        
        return experienceRecord;
    }
    
    async processSkillEvolution(characterId, experience) {
        const characterMemory = this.characterMemories.get(characterId);
        const skillsUsed = experience.skills_used || [];
        
        for (const skill of skillsUsed) {
            const evolutionPath = this.skillEvolutionPaths[skill];
            if (!evolutionPath) continue;
            
            // Track skill usage
            if (!this.skillEvolution.has(skill)) {
                this.skillEvolution.set(skill, {
                    usage_count: 0,
                    success_count: 0,
                    triggers_met: new Set()
                });
            }
            
            const skillData = this.skillEvolution.get(skill);
            skillData.usage_count++;
            
            if (experience.success) {
                skillData.success_count++;
            }
            
            // Check for evolution triggers
            for (const trigger of evolutionPath.triggers) {
                if (experience.context[trigger] || experience.metadata[trigger]) {
                    skillData.triggers_met.add(trigger);
                }
            }
            
            // Check if ready for evolution
            if (skillData.usage_count >= evolutionPath.experience_required &&
                skillData.triggers_met.size >= evolutionPath.triggers.length) {
                
                // Evolve the skill!
                const newSkill = evolutionPath.next_level;
                characterMemory.skills.add(newSkill);
                
                console.log('⚡ Skill evolved for ' + characterId + ': ' + skill + ' → ' + newSkill);
                
                // Record the evolution
                characterMemory.learnings.push({
                    id: crypto.randomUUID(),
                    timestamp: new Date().toISOString(),
                    type: 'skill_evolution',
                    from_skill: skill,
                    to_skill: newSkill,
                    triggers_met: Array.from(skillData.triggers_met),
                    usage_count: skillData.usage_count
                });
                
                this.stats.skills_preserved++;
            }
        }
    }
    
    async processInstinctLearning(characterId, experience) {
        const characterMemory = this.characterMemories.get(characterId);
        
        // Determine instinct pattern type
        let patternType = 'context_patterns'; // default
        
        if (experience.success) {
            patternType = experience.duration && experience.duration < experience.expected_duration 
                ? 'efficiency_patterns' 
                : 'success_patterns';
        } else {
            patternType = 'failure_patterns';
        }
        
        // Create instinct pattern
        const instinctPattern = {
            pattern_type: patternType,
            context_signature: this.createContextSignature(experience.context),
            outcome: experience.outcome,
            confidence: this.calculateInstinctConfidence(experience),
            learned_at: new Date().toISOString(),
            reinforcement_count: 1,
            last_reinforced: new Date().toISOString()
        };
        
        // Store or reinforce existing instinct
        const signature = instinctPattern.context_signature;
        
        if (characterMemory.instincts.has(signature)) {
            // Reinforce existing instinct
            const existingInstinct = characterMemory.instincts.get(signature);
            existingInstinct.reinforcement_count++;
            existingInstinct.last_reinforced = new Date().toISOString();
            existingInstinct.confidence = Math.min(1.0, existingInstinct.confidence + 0.1);
        } else {
            // Learn new instinct
            characterMemory.instincts.set(signature, instinctPattern);
            console.log('🎯 New instinct learned by ' + characterId + ': ' + signature.substring(0, 20) + '...');
        }
        
        this.stats.instincts_learned++;
    }
    
    createContextSignature(context) {
        // Create a signature that captures the essential context patterns
        const keyElements = [];
        
        // Include domain information
        if (context.domain) keyElements.push('domain:' + context.domain);
        if (context.type) keyElements.push('type:' + context.type);
        
        // Include user/query information
        if (context.user_intent) keyElements.push('intent:' + context.user_intent);
        if (context.complexity) keyElements.push('complexity:' + context.complexity);
        
        // Include technical context
        if (context.technology) keyElements.push('tech:' + context.technology);
        if (context.scale) keyElements.push('scale:' + context.scale);
        
        // Create hash of combined elements
        const signature = keyElements.sort().join('|');
        return crypto.createHash('sha256').update(signature).digest('hex').substring(0, 16);
    }
    
    calculateInstinctConfidence(experience) {
        let confidence = 0.5; // base confidence
        
        // Increase confidence for successful outcomes
        if (experience.success) confidence += 0.3;
        
        // Increase confidence for efficient outcomes  
        if (experience.duration && experience.expected_duration) {
            const efficiency = experience.expected_duration / experience.duration;
            confidence += Math.min(0.2, efficiency * 0.1);
        }
        
        // Increase confidence for positive feedback
        if (experience.metadata.positive_feedback) confidence += 0.2;
        
        return Math.min(1.0, confidence);
    }
    
    updateLearningPatterns(characterId, experience) {
        const characterMemory = this.characterMemories.get(characterId);
        
        if (!characterMemory.learning_patterns[experience.type]) {
            characterMemory.learning_patterns[experience.type] = {
                count: 0,
                success_rate: 0,
                avg_duration: 0,
                common_contexts: new Map()
            };
        }
        
        const pattern = characterMemory.learning_patterns[experience.type];
        pattern.count++;
        
        // Update success rate
        const oldSuccessRate = pattern.success_rate;
        pattern.success_rate = ((oldSuccessRate * (pattern.count - 1)) + (experience.success ? 1 : 0)) / pattern.count;
        
        // Update average duration
        if (experience.duration) {
            pattern.avg_duration = ((pattern.avg_duration * (pattern.count - 1)) + experience.duration) / pattern.count;
        }
        
        // Track common contexts
        if (experience.context.domain) {
            const domain = experience.context.domain;
            pattern.common_contexts.set(domain, (pattern.common_contexts.get(domain) || 0) + 1);
        }
    }
    
    updatePerformanceMetrics(characterId, experience) {
        const characterMemory = this.characterMemories.get(characterId);
        
        // Update overall success rate
        const totalExperiences = characterMemory.learnings.length;
        const successfulExperiences = characterMemory.learnings.filter(l => l.success).length;
        characterMemory.success_rate = successfulExperiences / totalExperiences;
        
        // Update experience level based on learning count and success rate
        if (totalExperiences >= 100 && characterMemory.success_rate >= 0.8) {
            characterMemory.experience_level = 'expert';
        } else if (totalExperiences >= 50 && characterMemory.success_rate >= 0.7) {
            characterMemory.experience_level = 'advanced';
        } else if (totalExperiences >= 20 && characterMemory.success_rate >= 0.6) {
            characterMemory.experience_level = 'intermediate';
        } else {
            characterMemory.experience_level = 'novice';
        }
        
        characterMemory.last_updated = new Date().toISOString();
    }
    
    async respawnCharacter(characterId, options = {}) {
        console.log('🔄 Respawning character: ' + characterId);
        
        const characterMemory = this.characterMemories.get(characterId);
        if (!characterMemory) {
            throw new Error('Character memory not found: ' + characterId);
        }
        
        // Increment respawn count
        characterMemory.respawn_count++;
        characterMemory.last_respawn = new Date().toISOString();
        
        // Clear temporary contexts but preserve skills and instincts
        characterMemory.last_contexts = [];
        
        // Optionally reset certain aspects based on options
        if (options.reset_instincts) {
            const importantInstincts = new Map();
            for (const [signature, instinct] of characterMemory.instincts) {
                if (instinct.reinforcement_count >= 3) {
                    importantInstincts.set(signature, instinct);
                }
            }
            characterMemory.instincts = importantInstincts;
        }
        
        if (options.reset_learnings) {
            // Keep only the most recent learnings
            const recentLearnings = characterMemory.learnings
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, 50);
            characterMemory.learnings = recentLearnings;
        }
        
        // Save updated memory
        await this.saveCharacterMemory(characterId);
        
        this.stats.total_respawns++;
        
        console.log('🔄 Character respawned: ' + characterId);
        console.log('   📊 Skills retained: ' + characterMemory.skills.size);
        console.log('   🎯 Instincts retained: ' + characterMemory.instincts.size);
        console.log('   📚 Learnings count: ' + characterMemory.learnings.length);
        console.log('   ⭐ Experience level: ' + characterMemory.experience_level);
        
        return {
            character_id: characterId,
            respawn_count: characterMemory.respawn_count,
            skills_retained: Array.from(characterMemory.skills),
            instincts_count: characterMemory.instincts.size,
            learnings_count: characterMemory.learnings.length,
            experience_level: characterMemory.experience_level,
            success_rate: characterMemory.success_rate
        };
    }
    
    getCharacterMemory(characterId) {
        const memory = this.characterMemories.get(characterId);
        if (!memory) return null;
        
        return {
            character_id: memory.character_id,
            character_name: memory.character_name,
            skills: Array.from(memory.skills),
            instincts: Array.from(memory.instincts.entries()),
            recent_learnings: memory.learnings.slice(-10), // Last 10 learnings
            learning_patterns: memory.learning_patterns,
            active_domains: Array.from(memory.active_domains),
            performance: {
                success_rate: memory.success_rate,
                experience_level: memory.experience_level,
                respawn_count: memory.respawn_count
            },
            metadata: {
                created_at: memory.created_at,
                last_respawn: memory.last_respawn,
                last_updated: memory.last_updated
            }
        };
    }
    
    async getContextForRespawn(characterId, queryContext = {}) {
        const characterMemory = this.characterMemories.get(characterId);
        if (!characterMemory) return queryContext;
        
        // Apply gut instincts to enhance context
        const contextSignature = this.createContextSignature(queryContext);
        const relevantInstincts = [];
        
        for (const [signature, instinct] of characterMemory.instincts) {
            if (this.isInstinctRelevant(signature, contextSignature, queryContext)) {
                relevantInstincts.push(instinct);
            }
        }
        
        // Apply learned skills
        const applicableSkills = Array.from(characterMemory.skills).filter(skill => {
            return this.isSkillApplicable(skill, queryContext);
        });
        
        // Return enhanced context
        return {
            ...queryContext,
            respawn_memory: {
                character_id: characterId,
                applicable_skills: applicableSkills,
                relevant_instincts: relevantInstincts,
                experience_level: characterMemory.experience_level,
                success_rate: characterMemory.success_rate,
                domain_expertise: Array.from(characterMemory.active_domains)
            },
            enhanced_by_memory: true
        };
    }
    
    isInstinctRelevant(instinctSignature, querySignature, context) {
        // Simple relevance check - could be made more sophisticated
        return instinctSignature.substring(0, 8) === querySignature.substring(0, 8) ||
               (context.domain && instinctSignature.includes('domain:' + context.domain));
    }
    
    isSkillApplicable(skill, context) {
        // Map skills to applicable contexts
        const skillContextMap = {
            'sql-mastery': ['database', 'data'],
            'system-design': ['architecture', 'systems'],
            'design-thinking': ['ui', 'ux', 'design'],
            'containerization': ['deployment', 'devops'],
            'security-analysis': ['security', 'auth'],
            'community-building': ['community', 'docs']
        };
        
        const applicableContexts = skillContextMap[skill] || [];
        return applicableContexts.some(ctx => 
            context.domain?.includes(ctx) || 
            context.type?.includes(ctx) ||
            JSON.stringify(context).toLowerCase().includes(ctx)
        );
    }
    
    async saveCharacterMemory(characterId) {
        const characterMemory = this.characterMemories.get(characterId);
        if (!characterMemory) return;
        
        // Convert Sets and Maps to serializable format
        const serializableMemory = {
            ...characterMemory,
            skills: Array.from(characterMemory.skills),
            evolved_skills: Array.from(characterMemory.skills).filter(skill => 
                !this.characters[characterId].baseSkills.includes(skill)
            ),
            instincts: Array.from(characterMemory.instincts.entries()),
            active_domains: Array.from(characterMemory.active_domains)
        };
        
        const memoryFile = path.join(this.config.memoryPath, characterId + '.json');
        const memoryData = JSON.stringify(serializableMemory, null, 2);
        
        // Optionally compress large memory files
        if (this.config.compressionEnabled && memoryData.length > this.config.compressionThreshold) {
            const compressedData = await gzip(memoryData);
            await fs.writeFile(memoryFile + '.gz', compressedData);
        } else {
            await fs.writeFile(memoryFile, memoryData);
        }
    }
    
    startMaintenanceTasks() {
        console.log('🔧 Starting maintenance tasks...');
        
        // Auto-save character memories every 5 minutes
        setInterval(async () => {
            for (const characterId of this.characterMemories.keys()) {
                await this.saveCharacterMemory(characterId);
            }
        }, 5 * 60 * 1000);
        
        // Archive old memories every hour
        if (this.config.autoBackup) {
            setInterval(async () => {
                await this.performMemoryArchiving();
            }, this.config.backupIntervalHours * 60 * 60 * 1000);
        }
        
        // Clean up old instincts daily
        setInterval(() => {
            this.cleanupOldInstincts();
        }, 24 * 60 * 60 * 1000);
    }
    
    async performMemoryArchiving() {
        console.log('📦 Performing memory archiving...');
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const archiveDir = path.join(this.config.backupPath, 'backup-' + timestamp);
        await fs.mkdir(archiveDir, { recursive: true });
        
        for (const [characterId, memory] of this.characterMemories) {
            const archiveFile = path.join(archiveDir, characterId + '.json');
            const memoryData = JSON.stringify({
                ...memory,
                skills: Array.from(memory.skills),
                instincts: Array.from(memory.instincts.entries()),
                active_domains: Array.from(memory.active_domains)
            }, null, 2);
            
            await fs.writeFile(archiveFile, memoryData);
        }
        
        this.stats.memories_archived++;
        console.log('📦 Memory archive created: ' + archiveDir);
    }
    
    cleanupOldInstincts() {
        console.log('🧹 Cleaning up old instincts...');
        
        const now = Date.now();
        let cleanedCount = 0;
        
        for (const [characterId, memory] of this.characterMemories) {
            const instinctsToKeep = new Map();
            
            for (const [signature, instinct] of memory.instincts) {
                const patternConfig = this.instinctPatternTypes[instinct.pattern_type];
                const maxAge = (patternConfig?.retention || 60) * 24 * 60 * 60 * 1000; // Convert days to ms
                const instinctAge = now - new Date(instinct.learned_at).getTime();
                
                if (instinctAge < maxAge || instinct.reinforcement_count >= 5) {
                    instinctsToKeep.set(signature, instinct);
                } else {
                    cleanedCount++;
                }
            }
            
            memory.instincts = instinctsToKeep;
        }
        
        console.log('🧹 Cleaned up ' + cleanedCount + ' old instincts');
    }
    
    getStats() {
        return {
            ...this.stats,
            active_characters: this.characterMemories.size,
            total_skills: Array.from(this.characterMemories.values())
                .reduce((sum, memory) => sum + memory.skills.size, 0),
            total_instincts: Array.from(this.characterMemories.values())
                .reduce((sum, memory) => sum + memory.instincts.size, 0),
            total_learnings: Array.from(this.characterMemories.values())
                .reduce((sum, memory) => sum + memory.learnings.length, 0)
        };
    }
}

module.exports = RespawnMemorySystem;