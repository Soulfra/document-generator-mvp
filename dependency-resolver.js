/**
 * 🧩 Dependency Resolver
 * Creates optimal learning paths by resolving chapter dependencies and prerequisites
 * Builds a dependency graph and generates personalized learning sequences
 */

const crypto = require('crypto');
const { EventEmitter } = require('events');

class DependencyResolver extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.options = {
            allowCircularDependencies: options.allowCircularDependencies || false,
            adaptivePathGeneration: options.adaptivePathGeneration !== false,
            skillBasedOrdering: options.skillBasedOrdering !== false,
            difficultyProgression: options.difficultyProgression !== false,
            prerequisiteEnforcement: options.prerequisiteEnforcement !== false,
            ...options
        };
        
        // Dependency graph
        this.dependencyGraph = new Map();
        this.chapters = new Map();
        this.skillPrerequisites = new Map();
        
        // Learning path cache
        this.pathCache = new Map();
        
        // Skill progression definitions
        this.skillProgressions = {
            // Technical Skills Progression
            data_analysis: {
                levels: [
                    { level: 1, name: 'Basic Data Reading', prerequisites: [] },
                    { level: 2, name: 'Pattern Recognition', prerequisites: ['basic_data_reading'] },
                    { level: 3, name: 'Statistical Analysis', prerequisites: ['pattern_recognition'] },
                    { level: 4, name: 'Predictive Modeling', prerequisites: ['statistical_analysis'] },
                    { level: 5, name: 'Data Orchestration', prerequisites: ['predictive_modeling', 'systems_thinking'] }
                ]
            },
            
            systems_thinking: {
                levels: [
                    { level: 1, name: 'Component Identification', prerequisites: [] },
                    { level: 2, name: 'Relationship Mapping', prerequisites: ['component_identification'] },
                    { level: 3, name: 'System Modeling', prerequisites: ['relationship_mapping'] },
                    { level: 4, name: 'System Optimization', prerequisites: ['system_modeling'] },
                    { level: 5, name: 'Complex System Design', prerequisites: ['system_optimization', 'technical_architecture'] }
                ]
            },
            
            technical_architecture: {
                levels: [
                    { level: 1, name: 'Basic Components', prerequisites: [] },
                    { level: 2, name: 'Interface Design', prerequisites: ['basic_components', 'systems_thinking'] },
                    { level: 3, name: 'System Integration', prerequisites: ['interface_design'] },
                    { level: 4, name: 'Scalability Planning', prerequisites: ['system_integration'] },
                    { level: 5, name: 'Architecture Mastery', prerequisites: ['scalability_planning', 'optimization_thinking'] }
                ]
            },
            
            integration_thinking: {
                levels: [
                    { level: 1, name: 'Basic Combination', prerequisites: [] },
                    { level: 2, name: 'Element Synthesis', prerequisites: ['basic_combination', 'pattern_recognition'] },
                    { level: 3, name: 'Complex Integration', prerequisites: ['element_synthesis'] },
                    { level: 4, name: 'Meta Integration', prerequisites: ['complex_integration', 'systems_thinking'] },
                    { level: 5, name: 'Transcendent Integration', prerequisites: ['meta_integration'] }
                ]
            },
            
            pattern_recognition: {
                levels: [
                    { level: 1, name: 'Simple Patterns', prerequisites: [] },
                    { level: 2, name: 'Sequence Recognition', prerequisites: ['simple_patterns'] },
                    { level: 3, name: 'Complex Patterns', prerequisites: ['sequence_recognition'] },
                    { level: 4, name: 'Meta Patterns', prerequisites: ['complex_patterns'] },
                    { level: 5, name: 'Intuitive Recognition', prerequisites: ['meta_patterns'] }
                ]
            },
            
            historical_understanding: {
                levels: [
                    { level: 1, name: 'Timeline Awareness', prerequisites: [] },
                    { level: 2, name: 'Cultural Context', prerequisites: ['timeline_awareness'] },
                    { level: 3, name: 'Pattern Across Time', prerequisites: ['cultural_context', 'pattern_recognition'] },
                    { level: 4, name: 'Historical Analysis', prerequisites: ['pattern_across_time'] },
                    { level: 5, name: 'Temporal Mastery', prerequisites: ['historical_analysis'] }
                ]
            }
        };
        
        // Dependency types and their strengths
        this.dependencyTypes = {
            hard_prerequisite: {
                strength: 1.0,
                blocking: true,
                description: 'Must be completed before starting'
            },
            soft_prerequisite: {
                strength: 0.8,
                blocking: false,
                description: 'Recommended to complete first'
            },
            skill_prerequisite: {
                strength: 0.9,
                blocking: true,
                description: 'Required skill level must be achieved'
            },
            conceptual_prerequisite: {
                strength: 0.7,
                blocking: false,
                description: 'Understanding this concept helps'
            },
            sequence_preference: {
                strength: 0.5,
                blocking: false,
                description: 'Better if taken in order'
            }
        };
    }
    
    /**
     * Build dependency graph from chapter data
     */
    buildDependencyGraph(chapters) {
        console.log('🧩 Building dependency graph...');
        
        this.chapters.clear();
        this.dependencyGraph.clear();
        this.skillPrerequisites.clear();
        
        // Store chapters
        for (const chapter of chapters) {
            this.chapters.set(chapter.id, chapter);
            this.dependencyGraph.set(chapter.id, {
                chapter,
                dependencies: [],
                dependents: [],
                skillRequirements: chapter.metadata?.skills || [],
                difficulty: chapter.metadata?.difficulty || 'medium',
                estimatedTime: this.parseEstimatedTime(chapter.metadata?.estimatedTime),
                readinessScore: chapter.readyForGameConversion?.score || 0
            });
        }
        
        // Analyze dependencies
        this.analyzeDependencies(chapters);
        
        // Build skill prerequisites
        this.buildSkillPrerequisites(chapters);
        
        // Validate graph
        this.validateDependencyGraph();
        
        console.log(`✅ Dependency graph built with ${this.chapters.size} chapters`);
        
        return {
            chapters: this.chapters.size,
            dependencies: this.countTotalDependencies(),
            skills: this.skillPrerequisites.size,
            cycles: this.detectCircularDependencies()
        };
    }
    
    /**
     * Analyze dependencies between chapters
     */
    analyzeDependencies(chapters) {
        for (const chapter of chapters) {
            const node = this.dependencyGraph.get(chapter.id);
            
            // Explicit prerequisites from metadata
            if (chapter.metadata?.prerequisites) {
                for (const prereq of chapter.metadata.prerequisites) {
                    this.addDependency(chapter.id, prereq, 'hard_prerequisite');
                }
            }
            
            // Chapter number based dependencies (sequential)
            if (chapter.metadata?.chapterNumber) {
                const prevChapterNum = chapter.metadata.chapterNumber - 1;
                const prevChapter = chapters.find(c => c.metadata?.chapterNumber === prevChapterNum);
                
                if (prevChapter) {
                    this.addDependency(chapter.id, prevChapter.id, 'sequence_preference');
                }
            }
            
            // Skill-based dependencies
            const skillRequirements = chapter.metadata?.skills || [];
            for (const skill of skillRequirements) {
                this.analyzeSkillDependencies(chapter.id, skill, chapters);
            }
            
            // Difficulty-based soft dependencies
            this.analyzeDifficultyDependencies(chapter.id, chapter.metadata?.difficulty, chapters);
            
            // Content-based dependencies (from discovery system)
            if (chapter.dependencies) {
                for (const dep of chapter.dependencies) {
                    if (dep.targetChapterId) {
                        const depType = dep.confidence > 0.8 ? 'soft_prerequisite' : 'conceptual_prerequisite';
                        this.addDependency(chapter.id, dep.targetChapterId, depType);
                    }
                }
            }
        }
    }
    
    /**
     * Add dependency between chapters
     */
    addDependency(chapterId, prerequisiteId, dependencyType = 'soft_prerequisite') {
        const chapter = this.dependencyGraph.get(chapterId);
        const prerequisite = this.dependencyGraph.get(prerequisiteId);
        
        if (!chapter || !prerequisite) {
            // Try to find by title or other identifier
            const prereqByTitle = this.findChapterByTitle(prerequisiteId);
            if (!prereqByTitle) {
                console.warn(`⚠️ Prerequisite not found: ${prerequisiteId}`);
                return false;
            }
            prerequisiteId = prereqByTitle.id;
            prerequisite = this.dependencyGraph.get(prerequisiteId);
        }
        
        // Check if dependency already exists
        const existingDep = chapter.dependencies.find(dep => dep.prerequisiteId === prerequisiteId);
        if (existingDep) {
            // Update with stronger dependency type if needed
            const existingStrength = this.dependencyTypes[existingDep.type].strength;
            const newStrength = this.dependencyTypes[dependencyType].strength;
            
            if (newStrength > existingStrength) {
                existingDep.type = dependencyType;
                existingDep.strength = newStrength;
            }
            return true;
        }
        
        // Add new dependency
        const dependency = {
            prerequisiteId,
            type: dependencyType,
            strength: this.dependencyTypes[dependencyType].strength,
            blocking: this.dependencyTypes[dependencyType].blocking,
            description: this.dependencyTypes[dependencyType].description
        };
        
        chapter.dependencies.push(dependency);
        prerequisite.dependents.push({
            chapterId,
            type: dependencyType,
            strength: dependency.strength
        });
        
        return true;
    }
    
    /**
     * Analyze skill-based dependencies
     */
    analyzeSkillDependencies(chapterId, skill, chapters) {
        const skillProgression = this.skillProgressions[skill];
        if (!skillProgression) return;
        
        // Find chapters that teach prerequisite skills
        for (const chapter of chapters) {
            if (chapter.id === chapterId) continue;
            
            const chapterSkills = chapter.metadata?.skills || [];
            const hasPrerequisiteSkill = skillProgression.levels.some(level => 
                level.prerequisites.some(prereq => 
                    chapterSkills.some(chapterSkill => 
                        chapterSkill.replace('_', ' ').toLowerCase().includes(prereq.replace('_', ' ').toLowerCase())
                    )
                )
            );
            
            if (hasPrerequisiteSkill) {
                this.addDependency(chapterId, chapter.id, 'skill_prerequisite');
            }
        }
    }
    
    /**
     * Analyze difficulty-based dependencies
     */
    analyzeDifficultyDependencies(chapterId, difficulty, chapters) {
        if (difficulty === 'easy') return; // No dependencies for easy chapters
        
        const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
        const currentDifficultyLevel = difficultyOrder[difficulty] || 2;
        
        // Find easier chapters that might be prerequisites
        for (const chapter of chapters) {
            if (chapter.id === chapterId) continue;
            
            const chapterDifficulty = chapter.metadata?.difficulty || 'medium';
            const chapterDifficultyLevel = difficultyOrder[chapterDifficulty] || 2;
            
            if (chapterDifficultyLevel < currentDifficultyLevel) {
                // Check if they share skills or topics
                const currentSkills = this.dependencyGraph.get(chapterId)?.skillRequirements || [];
                const chapterSkills = chapter.metadata?.skills || [];
                
                const sharedSkills = currentSkills.filter(skill => chapterSkills.includes(skill));
                
                if (sharedSkills.length > 0) {
                    this.addDependency(chapterId, chapter.id, 'conceptual_prerequisite');
                }
            }
        }
    }
    
    /**
     * Build skill prerequisites map
     */
    buildSkillPrerequisites(chapters) {
        for (const [skillId, progression] of Object.entries(this.skillProgressions)) {
            const skillChapters = chapters.filter(chapter => 
                (chapter.metadata?.skills || []).includes(skillId)
            );
            
            if (skillChapters.length > 0) {
                this.skillPrerequisites.set(skillId, {
                    progression,
                    chapters: skillChapters.map(c => c.id),
                    recommendedOrder: this.generateSkillOrder(skillChapters, progression)
                });
            }
        }
    }
    
    /**
     * Generate recommended order for skill-specific chapters
     */
    generateSkillOrder(chapters, progression) {
        return chapters
            .map(chapter => ({
                id: chapter.id,
                difficulty: chapter.metadata?.difficulty || 'medium',
                estimatedTime: this.parseEstimatedTime(chapter.metadata?.estimatedTime),
                readinessScore: chapter.readyForGameConversion?.score || 0
            }))
            .sort((a, b) => {
                // Sort by difficulty, then by readiness score
                const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
                const aDiff = difficultyOrder[a.difficulty] || 2;
                const bDiff = difficultyOrder[b.difficulty] || 2;
                
                if (aDiff !== bDiff) return aDiff - bDiff;
                return b.readinessScore - a.readinessScore;
            })
            .map(chapter => chapter.id);
    }
    
    /**
     * Validate dependency graph for issues
     */
    validateDependencyGraph() {
        const issues = [];
        
        // Check for circular dependencies
        const cycles = this.detectCircularDependencies();
        if (cycles.length > 0) {
            issues.push({
                type: 'circular_dependencies',
                count: cycles.length,
                cycles: cycles
            });
        }
        
        // Check for orphaned chapters (no path to them)
        const orphans = this.findOrphanedChapters();
        if (orphans.length > 0) {
            issues.push({
                type: 'orphaned_chapters',
                count: orphans.length,
                chapters: orphans
            });
        }
        
        // Check for chapters with too many dependencies
        const overloaded = this.findOverloadedChapters();
        if (overloaded.length > 0) {
            issues.push({
                type: 'overloaded_chapters',
                count: overloaded.length,
                chapters: overloaded
            });
        }
        
        if (issues.length > 0) {
            console.warn('⚠️ Dependency graph validation issues:', issues);
            this.emit('validation_issues', issues);
        } else {
            console.log('✅ Dependency graph validation passed');
        }
        
        return issues;
    }
    
    /**
     * Detect circular dependencies using DFS
     */
    detectCircularDependencies() {
        const visited = new Set();
        const recursionStack = new Set();
        const cycles = [];
        
        for (const chapterId of this.dependencyGraph.keys()) {
            if (!visited.has(chapterId)) {
                const cycle = this.dfsDetectCycle(chapterId, visited, recursionStack, []);
                if (cycle.length > 0) {
                    cycles.push(cycle);
                }
            }
        }
        
        return cycles;
    }
    
    /**
     * DFS helper for cycle detection
     */
    dfsDetectCycle(chapterId, visited, recursionStack, path) {
        visited.add(chapterId);
        recursionStack.add(chapterId);
        path.push(chapterId);
        
        const node = this.dependencyGraph.get(chapterId);
        
        for (const dependency of node.dependencies) {
            const prerequisiteId = dependency.prerequisiteId;
            
            if (!visited.has(prerequisiteId)) {
                const cycle = this.dfsDetectCycle(prerequisiteId, visited, recursionStack, path.slice());
                if (cycle.length > 0) return cycle;
            } else if (recursionStack.has(prerequisiteId)) {
                // Found cycle
                const cycleStart = path.indexOf(prerequisiteId);
                return path.slice(cycleStart).concat([prerequisiteId]);
            }
        }
        
        recursionStack.delete(chapterId);
        return [];
    }
    
    /**
     * Find chapters with no incoming dependencies
     */
    findOrphanedChapters() {
        const orphans = [];
        
        for (const [chapterId, node] of this.dependencyGraph) {
            if (node.dependencies.length === 0 && node.dependents.length === 0) {
                orphans.push({
                    id: chapterId,
                    title: node.chapter.content?.title || 'Untitled'
                });
            }
        }
        
        return orphans;
    }
    
    /**
     * Find chapters with excessive dependencies
     */
    findOverloadedChapters() {
        const overloaded = [];
        const maxDependencies = 5; // Arbitrary threshold
        
        for (const [chapterId, node] of this.dependencyGraph) {
            if (node.dependencies.length > maxDependencies) {
                overloaded.push({
                    id: chapterId,
                    title: node.chapter.content?.title || 'Untitled',
                    dependencyCount: node.dependencies.length
                });
            }
        }
        
        return overloaded;
    }
    
    /**
     * Generate optimal learning path for a learner
     */
    generateLearningPath(learnerProfile = {}) {
        const cacheKey = this.generateCacheKey(learnerProfile);
        
        // Check cache first
        if (this.pathCache.has(cacheKey)) {
            console.log('📋 Using cached learning path');
            return this.pathCache.get(cacheKey);
        }
        
        console.log('📋 Generating personalized learning path...');
        
        const path = {
            id: crypto.randomUUID(),
            learnerProfile,
            sequence: [],
            totalEstimatedTime: 0,
            difficultyProgression: [],
            skillProgression: {},
            milestones: [],
            alternatives: []
        };
        
        // Start with topological sort for basic ordering
        const baseOrder = this.topologicalSort();
        
        // Apply learner-specific optimizations
        const optimizedOrder = this.optimizeForLearner(baseOrder, learnerProfile);
        
        // Generate detailed sequence
        path.sequence = this.generateDetailedSequence(optimizedOrder, learnerProfile);
        
        // Calculate metadata
        path.totalEstimatedTime = this.calculateTotalTime(path.sequence);
        path.difficultyProgression = this.analyzeDifficultyProgression(path.sequence);
        path.skillProgression = this.analyzeSkillProgression(path.sequence);
        path.milestones = this.identifyMilestones(path.sequence);
        path.alternatives = this.generateAlternatives(optimizedOrder, learnerProfile);
        
        // Cache the result
        this.pathCache.set(cacheKey, path);
        
        console.log(`✅ Learning path generated: ${path.sequence.length} chapters, ${path.totalEstimatedTime} minutes`);
        this.emit('path_generated', path);
        
        return path;
    }
    
    /**
     * Topological sort of dependency graph
     */
    topologicalSort() {
        const inDegree = new Map();
        const queue = [];
        const result = [];
        
        // Initialize in-degree count
        for (const chapterId of this.dependencyGraph.keys()) {
            inDegree.set(chapterId, 0);
        }
        
        // Calculate in-degrees
        for (const [chapterId, node] of this.dependencyGraph) {
            for (const dependency of node.dependencies) {
                if (dependency.blocking) { // Only count blocking dependencies
                    const current = inDegree.get(chapterId) || 0;
                    inDegree.set(chapterId, current + 1);
                }
            }
        }
        
        // Find chapters with no prerequisites
        for (const [chapterId, degree] of inDegree) {
            if (degree === 0) {
                queue.push(chapterId);
            }
        }
        
        // Process queue
        while (queue.length > 0) {
            const chapterId = queue.shift();
            result.push(chapterId);
            
            const node = this.dependencyGraph.get(chapterId);
            
            for (const dependent of node.dependents) {
                if (this.dependencyGraph.get(dependent.chapterId).dependencies.find(d => d.prerequisiteId === chapterId)?.blocking) {
                    const newDegree = inDegree.get(dependent.chapterId) - 1;
                    inDegree.set(dependent.chapterId, newDegree);
                    
                    if (newDegree === 0) {
                        queue.push(dependent.chapterId);
                    }
                }
            }
        }
        
        // Check if all chapters are included (no cycles)
        if (result.length !== this.dependencyGraph.size) {
            console.warn('⚠️ Topological sort incomplete - possible cycles detected');
        }
        
        return result;
    }
    
    /**
     * Optimize order for specific learner
     */
    optimizeForLearner(baseOrder, learnerProfile) {
        let optimizedOrder = [...baseOrder];
        
        // Apply learner preferences
        if (learnerProfile.preferredDifficulty) {
            optimizedOrder = this.optimizeForDifficulty(optimizedOrder, learnerProfile.preferredDifficulty);
        }
        
        if (learnerProfile.skillFocus) {
            optimizedOrder = this.optimizeForSkills(optimizedOrder, learnerProfile.skillFocus);
        }
        
        if (learnerProfile.timeConstraints) {
            optimizedOrder = this.optimizeForTime(optimizedOrder, learnerProfile.timeConstraints);
        }
        
        if (learnerProfile.learningStyle) {
            optimizedOrder = this.optimizeForLearningStyle(optimizedOrder, learnerProfile.learningStyle);
        }
        
        return optimizedOrder;
    }
    
    /**
     * Generate detailed sequence with metadata
     */
    generateDetailedSequence(order, learnerProfile) {
        return order.map((chapterId, index) => {
            const node = this.dependencyGraph.get(chapterId);
            const chapter = node.chapter;
            
            return {
                id: chapterId,
                position: index + 1,
                title: chapter.content?.title || 'Untitled',
                difficulty: node.difficulty,
                estimatedTime: node.estimatedTime,
                skills: node.skillRequirements,
                prerequisites: node.dependencies.filter(dep => dep.blocking).map(dep => dep.prerequisiteId),
                softPrerequisites: node.dependencies.filter(dep => !dep.blocking).map(dep => dep.prerequisiteId),
                readinessScore: node.readinessScore,
                gameConversionReady: chapter.readyForGameConversion?.ready || false,
                personalizedNotes: this.generatePersonalizedNotes(node, learnerProfile)
            };
        });
    }
    
    /**
     * Generate cache key for learner profile
     */
    generateCacheKey(learnerProfile) {
        const keyData = {
            difficulty: learnerProfile.preferredDifficulty || 'any',
            skills: learnerProfile.skillFocus || [],
            time: learnerProfile.timeConstraints || 'flexible',
            style: learnerProfile.learningStyle || 'mixed'
        };
        
        return crypto.createHash('md5').update(JSON.stringify(keyData)).digest('hex');
    }
    
    // Helper methods for optimization
    optimizeForDifficulty(order, preferredDifficulty) {
        if (preferredDifficulty === 'gradual') {
            return order.sort((a, b) => {
                const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
                const aDiff = difficultyOrder[this.dependencyGraph.get(a).difficulty] || 2;
                const bDiff = difficultyOrder[this.dependencyGraph.get(b).difficulty] || 2;
                return aDiff - bDiff;
            });
        }
        return order;
    }
    
    optimizeForSkills(order, skillFocus) {
        return order.sort((a, b) => {
            const aSkills = this.dependencyGraph.get(a).skillRequirements;
            const bSkills = this.dependencyGraph.get(b).skillRequirements;
            
            const aMatch = aSkills.filter(skill => skillFocus.includes(skill)).length;
            const bMatch = bSkills.filter(skill => skillFocus.includes(skill)).length;
            
            return bMatch - aMatch; // Higher skill match first
        });
    }
    
    optimizeForTime(order, timeConstraints) {
        if (timeConstraints.maxSessionTime) {
            // Group chapters by session time
            return order.sort((a, b) => {
                const aTime = this.dependencyGraph.get(a).estimatedTime;
                const bTime = this.dependencyGraph.get(b).estimatedTime;
                return aTime - bTime;
            });
        }
        return order;
    }
    
    optimizeForLearningStyle(order, learningStyle) {
        // Could be extended to reorder based on content types, interactivity, etc.
        return order;
    }
    
    generatePersonalizedNotes(node, learnerProfile) {
        const notes = [];
        
        if (node.difficulty === 'hard' && learnerProfile.preferredDifficulty === 'gradual') {
            notes.push('Consider reviewing prerequisites before starting');
        }
        
        if (node.skillRequirements.some(skill => learnerProfile.skillFocus?.includes(skill))) {
            notes.push('Aligns with your skill focus areas');
        }
        
        if (!node.chapter.readyForGameConversion?.ready) {
            notes.push('Note: This chapter may need additional structure for game conversion');
        }
        
        return notes;
    }
    
    // Utility methods
    parseEstimatedTime(timeString) {
        if (!timeString) return 30; // Default 30 minutes
        
        const match = timeString.match(/(\d+)/);
        return match ? parseInt(match[1]) : 30;
    }
    
    findChapterByTitle(title) {
        for (const chapter of this.chapters.values()) {
            if (chapter.content?.title?.toLowerCase().includes(title.toLowerCase())) {
                return chapter;
            }
        }
        return null;
    }
    
    countTotalDependencies() {
        let count = 0;
        for (const node of this.dependencyGraph.values()) {
            count += node.dependencies.length;
        }
        return count;
    }
    
    calculateTotalTime(sequence) {
        return sequence.reduce((total, chapter) => total + chapter.estimatedTime, 0);
    }
    
    analyzeDifficultyProgression(sequence) {
        return sequence.map(chapter => chapter.difficulty);
    }
    
    analyzeSkillProgression(sequence) {
        const skillsEncountered = {};
        
        for (const chapter of sequence) {
            for (const skill of chapter.skills) {
                if (!skillsEncountered[skill]) {
                    skillsEncountered[skill] = [];
                }
                skillsEncountered[skill].push(chapter.position);
            }
        }
        
        return skillsEncountered;
    }
    
    identifyMilestones(sequence) {
        const milestones = [];
        let skillCount = 0;
        
        for (const chapter of sequence) {
            skillCount += chapter.skills.length;
            
            // Every 3 chapters or after significant skill accumulation
            if (chapter.position % 3 === 0 || skillCount >= 5) {
                milestones.push({
                    position: chapter.position,
                    chapterId: chapter.id,
                    description: `Milestone: ${skillCount} skills learned`,
                    skillsAcquired: skillCount
                });
                skillCount = 0;
            }
        }
        
        return milestones;
    }
    
    generateAlternatives(order, learnerProfile) {
        // Could generate alternative paths based on different optimization criteria
        return [
            {
                name: 'Speed-focused path',
                description: 'Prioritizes shorter chapters for quick progress'
            },
            {
                name: 'Skill-focused path',
                description: 'Groups chapters by skill development'
            },
            {
                name: 'Difficulty-balanced path',
                description: 'Alternates between easy and challenging content'
            }
        ];
    }
}

module.exports = DependencyResolver;

// Example usage
if (require.main === module) {
    const resolver = new DependencyResolver({
        adaptivePathGeneration: true,
        skillBasedOrdering: true,
        difficultyProgression: true
    });
    
    // Example chapters (would come from Chapter Discovery System)
    const exampleChapters = [
        {
            id: 'chapter_1',
            content: { title: 'Introduction to Data' },
            metadata: { chapterNumber: 1, difficulty: 'easy', skills: ['pattern_recognition'], estimatedTime: '20 minutes' },
            readyForGameConversion: { ready: true, score: 8 }
        },
        {
            id: 'chapter_2',
            content: { title: 'Systems Thinking Basics' },
            metadata: { chapterNumber: 2, difficulty: 'medium', skills: ['systems_thinking'], estimatedTime: '30 minutes' },
            readyForGameConversion: { ready: true, score: 7 }
        },
        {
            id: 'chapter_3',
            content: { title: 'Advanced Integration' },
            metadata: { chapterNumber: 3, difficulty: 'hard', skills: ['integration_thinking', 'systems_thinking'], estimatedTime: '45 minutes', prerequisites: ['chapter_1', 'chapter_2'] },
            readyForGameConversion: { ready: false, score: 5 }
        }
    ];
    
    // Build dependency graph
    const graphResult = resolver.buildDependencyGraph(exampleChapters);
    console.log('📊 Dependency Graph:', graphResult);
    
    // Generate learning path
    const learnerProfile = {
        preferredDifficulty: 'gradual',
        skillFocus: ['systems_thinking', 'integration_thinking'],
        timeConstraints: { maxSessionTime: 60 },
        learningStyle: 'interactive'
    };
    
    const learningPath = resolver.generateLearningPath(learnerProfile);
    console.log('📋 Generated Learning Path:');
    console.log(`Total time: ${learningPath.totalEstimatedTime} minutes`);
    console.log('Sequence:');
    learningPath.sequence.forEach(chapter => {
        console.log(`  ${chapter.position}. ${chapter.title} (${chapter.difficulty}, ${chapter.estimatedTime}min)`);
    });
}