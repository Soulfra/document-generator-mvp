/**
 * Document Monster Generator
 * Creates voxel-based monsters and sprites from scanned document content
 * Integrates with reasoning agents for dynamic combat encounters
 */

class DocumentMonsterGenerator {
    constructor() {
        this.monsterTypes = new Map();
        this.activeMonsters = new Map();
        this.spawnQueue = [];
        this.documentAnalyzer = new DocumentAnalyzer();
        this.voxelEngine = new VoxelEngine();
        
        // Monster type classifications based on document content
        this.monsterClassifications = {
            legal: {
                contract: { boss: '⚖️', name: 'Contract Golem', threat: 'high', voxelColor: '#FF4444' },
                privacy: { boss: '👁️', name: 'Privacy Wraith', threat: 'medium', voxelColor: '#8A2BE2' },
                terms: { boss: '📜', name: 'Terms Specter', threat: 'low', voxelColor: '#FFD700' },
                liability: { boss: '🛡️', name: 'Liability Beast', threat: 'high', voxelColor: '#FF6600' }
            },
            
            technical: {
                api: { boss: '🔧', name: 'API Sentinel', threat: 'medium', voxelColor: '#00FFFF' },
                database: { boss: '🗃️', name: 'Data Guardian', threat: 'high', voxelColor: '#00FF88' },
                security: { boss: '🔒', name: 'Security Daemon', threat: 'high', voxelColor: '#FF0080' },
                bug: { boss: '🐛', name: 'Code Crawler', threat: 'low', voxelColor: '#FF44FF' }
            },
            
            business: {
                revenue: { boss: '💰', name: 'Revenue Dragon', threat: 'high', voxelColor: '#FFD700' },
                competition: { boss: '⚔️', name: 'Market Rival', threat: 'medium', voxelColor: '#FF4444' },
                customer: { boss: '👥', name: 'User Feedback Swarm', threat: 'low', voxelColor: '#44FF44' },
                strategy: { boss: '🎯', name: 'Strategy Sphinx', threat: 'medium', voxelColor: '#8A2BE2' }
            },
            
            academic: {
                research: { boss: '🔬', name: 'Research Titan', threat: 'medium', voxelColor: '#00FFFF' },
                thesis: { boss: '📚', name: 'Thesis Behemoth', threat: 'high', voxelColor: '#FFD700' },
                citation: { boss: '📝', name: 'Citation Spider', threat: 'low', voxelColor: '#FF69B4' },
                methodology: { boss: '⚗️', name: 'Method Golem', threat: 'medium', voxelColor: '#00FF88' }
            }
        };
        
        this.init();
    }
    
    init() {
        console.log('👾 Document Monster Generator initialized');
        console.log('🎯 Ready to spawn monsters from document content');
    }
    
    async analyzeDocumentAndSpawnMonsters(documentContent, scannerPosition) {
        console.log('📄 Analyzing document for monster spawning...');
        
        try {
            // Analyze document content
            const analysis = await this.documentAnalyzer.analyze(documentContent);
            
            // Generate monsters based on analysis
            const monsters = this.generateMonstersFromAnalysis(analysis, scannerPosition);
            
            // Spawn monsters in the world
            for (const monster of monsters) {
                await this.spawnMonster(monster);
            }
            
            return {
                success: true,
                monstersSpawned: monsters.length,
                monsters: monsters,
                analysis: analysis
            };
            
        } catch (error) {
            console.error('❌ Monster generation failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    generateMonstersFromAnalysis(analysis, basePosition) {
        const monsters = [];
        
        // Extract key concepts and their threat levels
        const concepts = this.extractConcepts(analysis);
        
        concepts.forEach((concept, index) => {
            const monsterData = this.conceptToMonster(concept, index);
            
            if (monsterData) {
                // Position monsters around the scanner position
                const angle = (index / concepts.length) * Math.PI * 2;
                const distance = 50 + (Math.random() * 100);
                
                const monster = {
                    id: `monster_${Date.now()}_${index}`,
                    ...monsterData,
                    position: {
                        x: basePosition.x + Math.cos(angle) * distance,
                        y: basePosition.y + Math.sin(angle) * distance,
                        z: basePosition.z + (Math.random() * 20 - 10)
                    },
                    spawnTime: Date.now(),
                    concept: concept,
                    health: this.calculateMonsterHealth(concept),
                    abilities: this.generateMonsterAbilities(concept)
                };
                
                monsters.push(monster);
            }
        });
        
        return monsters;
    }
    
    extractConcepts(analysis) {
        const concepts = [];
        
        // Extract from different sections of the document
        if (analysis.keywords) {
            concepts.push(...analysis.keywords.map(keyword => ({
                text: keyword,
                type: 'keyword',
                importance: 1,
                section: 'general'
            })));
        }
        
        if (analysis.entities) {
            concepts.push(...analysis.entities.map(entity => ({
                text: entity.text,
                type: entity.type,
                importance: entity.confidence || 1,
                section: 'entities'
            })));
        }
        
        if (analysis.sections) {
            analysis.sections.forEach(section => {
                concepts.push({
                    text: section.title || section.content.substring(0, 50),
                    type: 'section',
                    importance: section.importance || 1,
                    section: section.type || 'content'
                });
            });
        }
        
        // Sort by importance and limit to prevent spawn flooding
        return concepts
            .sort((a, b) => b.importance - a.importance)
            .slice(0, 8); // Max 8 monsters per document
    }
    
    conceptToMonster(concept, index) {
        // Determine monster category based on concept content
        const category = this.classifyConcept(concept.text);
        
        if (!category) return null;
        
        const monsterTemplate = this.monsterClassifications[category.type][category.subtype];
        
        if (!monsterTemplate) return null;
        
        return {
            ...monsterTemplate,
            size: this.calculateMonsterSize(concept.importance),
            aggressiveness: this.calculateAggressiveness(concept, category),
            vulnerabilities: this.generateVulnerabilities(category),
            drops: this.generateDrops(concept, category),
            behaviorPattern: this.generateBehaviorPattern(category, concept)
        };
    }
    
    classifyConcept(text) {
        const lowerText = text.toLowerCase();
        
        // Legal document patterns
        if (lowerText.match(/contract|agreement|terms|legal|liability|clause/)) {
            if (lowerText.includes('contract')) return { type: 'legal', subtype: 'contract' };
            if (lowerText.includes('privacy')) return { type: 'legal', subtype: 'privacy' };
            if (lowerText.includes('liability')) return { type: 'legal', subtype: 'liability' };
            return { type: 'legal', subtype: 'terms' };
        }
        
        // Technical document patterns
        if (lowerText.match(/api|endpoint|database|security|bug|code|system/)) {
            if (lowerText.includes('api')) return { type: 'technical', subtype: 'api' };
            if (lowerText.includes('database')) return { type: 'technical', subtype: 'database' };
            if (lowerText.includes('security')) return { type: 'technical', subtype: 'security' };
            return { type: 'technical', subtype: 'bug' };
        }
        
        // Business document patterns
        if (lowerText.match(/revenue|profit|market|customer|strategy|business/)) {
            if (lowerText.includes('revenue')) return { type: 'business', subtype: 'revenue' };
            if (lowerText.includes('competition')) return { type: 'business', subtype: 'competition' };
            if (lowerText.includes('customer')) return { type: 'business', subtype: 'customer' };
            return { type: 'business', subtype: 'strategy' };
        }
        
        // Academic document patterns
        if (lowerText.match(/research|thesis|study|methodology|citation|academic/)) {
            if (lowerText.includes('research')) return { type: 'academic', subtype: 'research' };
            if (lowerText.includes('thesis')) return { type: 'academic', subtype: 'thesis' };
            if (lowerText.includes('citation')) return { type: 'academic', subtype: 'citation' };
            return { type: 'academic', subtype: 'methodology' };
        }
        
        return null;
    }
    
    calculateMonsterSize(importance) {
        return Math.max(1, Math.min(5, Math.floor(importance * 3)));
    }
    
    calculateAggressiveness(concept, category) {
        const baseAggression = {
            legal: 0.8,
            technical: 0.6,
            business: 0.7,
            academic: 0.4
        };
        
        return baseAggression[category.type] * (0.5 + concept.importance * 0.5);
    }
    
    calculateMonsterHealth(concept) {
        return Math.floor(50 + (concept.importance * 150));
    }
    
    generateVulnerabilities(category) {
        const vulnerabilities = {
            legal: ['negotiation', 'alternative_clauses', 'legal_precedent'],
            technical: ['debugging', 'testing', 'documentation'],
            business: ['market_research', 'user_feedback', 'competitive_analysis'],
            academic: ['peer_review', 'methodology_critique', 'source_verification']
        };
        
        return vulnerabilities[category.type] || ['general_analysis'];
    }
    
    generateDrops(concept, category) {
        const baseDrop = {
            experience: Math.floor(10 + concept.importance * 40),
            knowledge_points: Math.floor(5 + concept.importance * 15),
            document_fragments: Math.floor(1 + concept.importance * 3)
        };
        
        // Category-specific drops
        const categoryDrops = {
            legal: { legal_expertise: Math.floor(concept.importance * 10) },
            technical: { code_snippets: Math.floor(concept.importance * 5) },
            business: { market_insights: Math.floor(concept.importance * 8) },
            academic: { research_citations: Math.floor(concept.importance * 6) }
        };
        
        return {
            ...baseDrop,
            ...categoryDrops[category.type]
        };
    }
    
    generateBehaviorPattern(category, concept) {
        const patterns = {
            legal: {
                movement: 'territorial',
                attack: 'clause_strike',
                defense: 'legal_shield',
                special: 'contract_bind'
            },
            technical: {
                movement: 'systematic',
                attack: 'code_injection',
                defense: 'firewall',
                special: 'system_crash'
            },
            business: {
                movement: 'aggressive',
                attack: 'market_pressure',
                defense: 'competitive_advantage',
                special: 'hostile_takeover'
            },
            academic: {
                movement: 'methodical',
                attack: 'peer_review',
                defense: 'citation_shield',
                special: 'knowledge_overwhelm'
            }
        };
        
        return patterns[category.type] || patterns.technical;
    }
    
    generateMonsterAbilities(concept) {
        const abilities = [];
        
        // Base abilities for all monsters
        abilities.push('basic_attack', 'basic_defense');
        
        // Importance-based abilities
        if (concept.importance > 0.7) {
            abilities.push('special_attack', 'regeneration');
        }
        
        if (concept.importance > 0.9) {
            abilities.push('ultimate_ability', 'boss_mechanics');
        }
        
        return abilities;
    }
    
    async spawnMonster(monsterData) {
        console.log(`👾 Spawning monster: ${monsterData.name} at position`, monsterData.position);
        
        try {
            // Create voxel representation
            const voxelModel = await this.voxelEngine.createMonster(monsterData);
            
            // Add to active monsters
            const monster = {
                ...monsterData,
                voxelModel: voxelModel,
                currentHealth: monsterData.health,
                state: 'idle',
                target: null,
                lastAction: Date.now(),
                effects: []
            };
            
            this.activeMonsters.set(monster.id, monster);
            
            // Trigger spawn effects
            this.createSpawnEffect(monster);
            
            console.log(`✅ Monster spawned successfully: ${monster.name}`);
            
            return monster;
            
        } catch (error) {
            console.error(`❌ Failed to spawn monster ${monsterData.name}:`, error);
            throw error;
        }
    }
    
    createSpawnEffect(monster) {
        // Create visual spawn effect
        this.voxelEngine.createParticleEffect({
            type: 'spawn',
            position: monster.position,
            color: monster.voxelColor,
            duration: 2000,
            intensity: monster.size
        });
        
        // Play spawn sound
        this.playSpawnSound(monster);
    }
    
    playSpawnSound(monster) {
        // Generate procedural spawn sound based on monster type
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Frequency based on monster threat level
        const threatFrequencies = {
            low: 200,
            medium: 150,
            high: 100
        };
        
        oscillator.frequency.setValueAtTime(threatFrequencies[monster.threat], audioContext.currentTime);
        oscillator.type = 'sawtooth';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5);
    }
    
    updateMonsters(deltaTime, reasoningAgents) {
        for (const [monsterId, monster] of this.activeMonsters) {
            this.updateMonsterBehavior(monster, deltaTime, reasoningAgents);
            this.updateMonsterVisuals(monster, deltaTime);
            
            // Remove dead monsters
            if (monster.currentHealth <= 0) {
                this.despawnMonster(monsterId);
            }
        }
    }
    
    updateMonsterBehavior(monster, deltaTime, reasoningAgents) {
        const timeSinceLastAction = Date.now() - monster.lastAction;
        
        // Find nearest reasoning agent
        const nearestAgent = this.findNearestAgent(monster, reasoningAgents);
        
        if (nearestAgent && this.getDistance(monster.position, nearestAgent.position) < 100) {
            // Engage in combat
            monster.state = 'combat';
            monster.target = nearestAgent;
            this.engageCombat(monster, nearestAgent);
        } else {
            // Patrol behavior
            monster.state = 'patrol';
            this.updatePatrolBehavior(monster, deltaTime);
        }
        
        monster.lastAction = Date.now();
    }
    
    findNearestAgent(monster, agents) {
        let nearest = null;
        let minDistance = Infinity;
        
        for (const agent of agents) {
            const distance = this.getDistance(monster.position, agent.position);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = agent;
            }
        }
        
        return nearest;
    }
    
    getDistance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        const dz = pos1.z - pos2.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    
    engageCombat(monster, agent) {
        console.log(`⚔️ ${monster.name} engaging ${agent.lineage} agent in combat!`);
        
        // Monster attack logic based on behavior pattern
        const damage = this.calculateDamage(monster, agent);
        
        // Apply damage to agent
        if (agent.takeDamage) {
            agent.takeDamage(damage);
        }
        
        // Create combat effects
        this.createCombatEffect(monster, agent, damage);
    }
    
    calculateDamage(monster, agent) {
        const baseDamage = 10 + (monster.size * 5);
        const aggressivenessMultiplier = 1 + monster.aggressiveness;
        
        // Agent defensive modifiers
        const defenseModifier = this.getAgentDefenseModifier(agent, monster);
        
        return Math.floor(baseDamage * aggressivenessMultiplier * defenseModifier);
    }
    
    getAgentDefenseModifier(agent, monster) {
        // Different agent lineages have different strengths against monster types
        const lineageEffectiveness = {
            warrior: { legal: 1.2, technical: 0.8, business: 1.0, academic: 0.9 },
            scholar: { legal: 0.9, technical: 1.3, business: 1.1, academic: 1.4 },
            rogue: { legal: 1.1, technical: 1.0, business: 1.3, academic: 0.8 },
            mage: { legal: 0.8, technical: 1.1, business: 0.9, academic: 1.2 }
        };
        
        const monsterCategory = this.getMonsterCategory(monster);
        return lineageEffectiveness[agent.lineage]?.[monsterCategory] || 1.0;
    }
    
    getMonsterCategory(monster) {
        // Extract category from monster classification
        for (const [category, types] of Object.entries(this.monsterClassifications)) {
            for (const [type, data] of Object.entries(types)) {
                if (data.name === monster.name) {
                    return category;
                }
            }
        }
        return 'technical'; // default
    }
    
    createCombatEffect(monster, agent, damage) {
        const effectPosition = {
            x: (monster.position.x + agent.position.x) / 2,
            y: (monster.position.y + agent.position.y) / 2,
            z: (monster.position.z + agent.position.z) / 2
        };
        
        this.voxelEngine.createParticleEffect({
            type: 'combat',
            position: effectPosition,
            color: '#FF4444',
            duration: 1000,
            intensity: damage / 10
        });
    }
    
    updatePatrolBehavior(monster, deltaTime) {
        // Simple patrol movement
        const speed = 20; // units per second
        const distance = speed * (deltaTime / 1000);
        
        // Random movement with tendency to return to spawn point
        const angle = Math.random() * Math.PI * 2;
        monster.position.x += Math.cos(angle) * distance;
        monster.position.y += Math.sin(angle) * distance;
    }
    
    updateMonsterVisuals(monster, deltaTime) {
        // Update voxel model position and effects
        if (monster.voxelModel) {
            this.voxelEngine.updateModel(monster.voxelModel, {
                position: monster.position,
                health: monster.currentHealth / monster.health,
                state: monster.state
            });
        }
    }
    
    despawnMonster(monsterId) {
        const monster = this.activeMonsters.get(monsterId);
        if (!monster) return;
        
        console.log(`💀 Despawning monster: ${monster.name}`);
        
        // Create despawn effect
        this.voxelEngine.createParticleEffect({
            type: 'despawn',
            position: monster.position,
            color: monster.voxelColor,
            duration: 1500
        });
        
        // Drop loot
        this.createLootDrop(monster);
        
        // Remove from active monsters
        this.activeMonsters.delete(monsterId);
        
        // Clean up voxel model
        if (monster.voxelModel) {
            this.voxelEngine.destroyModel(monster.voxelModel);
        }
    }
    
    createLootDrop(monster) {
        console.log(`💎 Creating loot drop from ${monster.name}:`, monster.drops);
        
        // Create visual loot drop
        this.voxelEngine.createLootDrop({
            position: monster.position,
            items: monster.drops,
            color: '#FFD700'
        });
    }
    
    getActiveMonsters() {
        return Array.from(this.activeMonsters.values());
    }
    
    getMonsterById(id) {
        return this.activeMonsters.get(id);
    }
    
    clearAllMonsters() {
        for (const monsterId of this.activeMonsters.keys()) {
            this.despawnMonster(monsterId);
        }
    }
}

// Voxel Engine for 3D Monster Representation
class VoxelEngine {
    constructor() {
        this.scene = null;
        this.models = new Map();
        this.effectsQueue = [];
    }
    
    async createMonster(monsterData) {
        console.log(`🎨 Creating voxel model for ${monsterData.name}`);
        
        // Generate voxel structure based on monster properties
        const voxelStructure = this.generateVoxelStructure(monsterData);
        
        // Create 3D model
        const model = {
            id: monsterData.id,
            voxels: voxelStructure,
            color: monsterData.voxelColor,
            size: monsterData.size,
            position: monsterData.position
        };
        
        this.models.set(monsterData.id, model);
        return model;
    }
    
    generateVoxelStructure(monsterData) {
        const size = monsterData.size;
        const structure = [];
        
        // Generate basic monster shape based on threat level
        const dimensions = {
            width: size * 2,
            height: size * 3,
            depth: size * 2
        };
        
        // Create voxel pattern
        for (let x = 0; x < dimensions.width; x++) {
            for (let y = 0; y < dimensions.height; y++) {
                for (let z = 0; z < dimensions.depth; z++) {
                    // Simple humanoid shape
                    if (this.shouldPlaceVoxel(x, y, z, dimensions, monsterData)) {
                        structure.push({ x, y, z });
                    }
                }
            }
        }
        
        return structure;
    }
    
    shouldPlaceVoxel(x, y, z, dimensions, monsterData) {
        const centerX = dimensions.width / 2;
        const centerZ = dimensions.depth / 2;
        
        // Head
        if (y >= dimensions.height - 2) {
            return Math.abs(x - centerX) <= 1 && Math.abs(z - centerZ) <= 1;
        }
        
        // Body
        if (y >= dimensions.height / 2) {
            return Math.abs(x - centerX) <= 1 && Math.abs(z - centerZ) <= 1;
        }
        
        // Legs
        if (y < dimensions.height / 2) {
            return (Math.abs(x - centerX + 0.5) <= 0.5 || Math.abs(x - centerX - 0.5) <= 0.5) && 
                   Math.abs(z - centerZ) <= 0.5;
        }
        
        return false;
    }
    
    updateModel(model, updates) {
        if (!model) return;
        
        Object.assign(model, updates);
        
        // Update visual representation based on state
        if (updates.health !== undefined) {
            // Color shift based on health
            const healthPercent = updates.health;
            model.color = this.interpolateColor('#FF0000', model.color, healthPercent);
        }
    }
    
    createParticleEffect(config) {
        console.log(`✨ Creating particle effect: ${config.type}`);
        
        this.effectsQueue.push({
            ...config,
            startTime: Date.now()
        });
        
        // Clean up old effects
        this.cleanupEffects();
    }
    
    createLootDrop(config) {
        console.log(`💰 Creating loot drop at`, config.position);
        
        this.createParticleEffect({
            type: 'loot',
            position: config.position,
            color: '#FFD700',
            duration: 5000
        });
    }
    
    interpolateColor(color1, color2, factor) {
        // Simple color interpolation
        return factor > 0.5 ? color2 : color1;
    }
    
    cleanupEffects() {
        const now = Date.now();
        this.effectsQueue = this.effectsQueue.filter(effect => {
            return (now - effect.startTime) < effect.duration;
        });
    }
    
    destroyModel(model) {
        if (model && model.id) {
            this.models.delete(model.id);
        }
    }
}

// Document Analyzer for Monster Generation
class DocumentAnalyzer {
    constructor() {
        this.analysisMethods = new Map();
        this.setupAnalysisMethods();
    }
    
    setupAnalysisMethods() {
        this.analysisMethods.set('keyword_extraction', this.extractKeywords.bind(this));
        this.analysisMethods.set('entity_recognition', this.recognizeEntities.bind(this));
        this.analysisMethods.set('section_analysis', this.analyzeSections.bind(this));
        this.analysisMethods.set('sentiment_analysis', this.analyzeSentiment.bind(this));
    }
    
    async analyze(documentContent) {
        console.log('🔍 Analyzing document content...');
        
        const analysis = {
            timestamp: Date.now(),
            content_length: documentContent.length,
            keywords: [],
            entities: [],
            sections: [],
            sentiment: {},
            complexity: 'medium'
        };
        
        try {
            // Run all analysis methods
            analysis.keywords = await this.extractKeywords(documentContent);
            analysis.entities = await this.recognizeEntities(documentContent);
            analysis.sections = await this.analyzeSections(documentContent);
            analysis.sentiment = await this.analyzeSentiment(documentContent);
            analysis.complexity = this.calculateComplexity(analysis);
            
            console.log('✅ Document analysis complete:', analysis);
            return analysis;
            
        } catch (error) {
            console.error('❌ Document analysis failed:', error);
            throw error;
        }
    }
    
    async extractKeywords(content) {
        // Simple keyword extraction using frequency analysis
        const words = content.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 3);
        
        const frequency = {};
        words.forEach(word => {
            frequency[word] = (frequency[word] || 0) + 1;
        });
        
        // Return top keywords
        return Object.entries(frequency)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([word, count]) => word);
    }
    
    async recognizeEntities(content) {
        // Simple entity recognition patterns
        const entities = [];
        
        // Email patterns
        const emails = content.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g);
        if (emails) {
            entities.push(...emails.map(email => ({ text: email, type: 'email', confidence: 0.9 })));
        }
        
        // Date patterns
        const dates = content.match(/\b\d{1,2}\/\d{1,2}\/\d{4}\b/g);
        if (dates) {
            entities.push(...dates.map(date => ({ text: date, type: 'date', confidence: 0.8 })));
        }
        
        // Currency patterns
        const currency = content.match(/\$[\d,]+\.?\d*/g);
        if (currency) {
            entities.push(...currency.map(amount => ({ text: amount, type: 'currency', confidence: 0.9 })));
        }
        
        return entities;
    }
    
    async analyzeSections(content) {
        // Split content into sections based on headers
        const sections = [];
        const lines = content.split('\n');
        
        let currentSection = null;
        
        lines.forEach((line, index) => {
            const trimmedLine = line.trim();
            
            // Detect headers (lines that are short and followed by longer content)
            if (trimmedLine.length > 0 && trimmedLine.length < 100) {
                if (currentSection) {
                    sections.push(currentSection);
                }
                
                currentSection = {
                    title: trimmedLine,
                    content: '',
                    startLine: index,
                    importance: 1
                };
            } else if (currentSection) {
                currentSection.content += line + '\n';
            }
        });
        
        // Add the last section
        if (currentSection) {
            sections.push(currentSection);
        }
        
        // Calculate importance based on section length and keywords
        sections.forEach(section => {
            section.importance = Math.min(1, section.content.length / 1000);
        });
        
        return sections;
    }
    
    async analyzeSentiment(content) {
        // Simple sentiment analysis based on keyword patterns
        const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'perfect'];
        const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'wrong', 'error'];
        
        const words = content.toLowerCase().split(/\s+/);
        
        let positiveCount = 0;
        let negativeCount = 0;
        
        words.forEach(word => {
            if (positiveWords.includes(word)) positiveCount++;
            if (negativeWords.includes(word)) negativeCount++;
        });
        
        const total = positiveCount + negativeCount;
        
        return {
            positive: total > 0 ? positiveCount / total : 0.5,
            negative: total > 0 ? negativeCount / total : 0.5,
            neutral: total > 0 ? 1 - (positiveCount + negativeCount) / words.length : 0.5
        };
    }
    
    calculateComplexity(analysis) {
        let complexity = 0;
        
        // Factor in content length
        complexity += Math.min(1, analysis.content_length / 5000) * 0.3;
        
        // Factor in keyword diversity
        complexity += Math.min(1, analysis.keywords.length / 20) * 0.3;
        
        // Factor in entity count
        complexity += Math.min(1, analysis.entities.length / 10) * 0.2;
        
        // Factor in section count
        complexity += Math.min(1, analysis.sections.length / 5) * 0.2;
        
        if (complexity < 0.3) return 'simple';
        if (complexity < 0.7) return 'medium';
        return 'complex';
    }
}

// Export for use in main system
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DocumentMonsterGenerator, VoxelEngine, DocumentAnalyzer };
}

console.log('👾 Document Monster Generator loaded');
console.log('🎯 Ready to transform documents into interactive combat encounters');