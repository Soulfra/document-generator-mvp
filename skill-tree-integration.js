#!/usr/bin/env node

/**
 * 🌿 SKILL TREE INTEGRATION
 * 
 * Manages skill progression through gravitational particle capture
 * Creates branching skill paths that unlock as particles reach critical mass
 */

class SkillTreeIntegration {
    constructor(config = {}) {
        this.config = {
            // Skill tree structure
            skills: {
                frontend: {
                    name: 'Frontend Development',
                    description: 'User interface and experience mastery',
                    icon: '🎨',
                    color: '#61dafb',
                    basePosition: { x: -200, y: 0, z: 0 },
                    branches: {
                        react: {
                            name: 'React Mastery',
                            description: 'Component-based UI development',
                            prerequisites: ['frontend'],
                            unlockThreshold: 100,
                            branches: {
                                hooks: 'Advanced Hooks',
                                context: 'Context & State Management',
                                performance: 'Performance Optimization'
                            }
                        },
                        vue: {
                            name: 'Vue.js Expertise',
                            description: 'Progressive framework mastery',
                            prerequisites: ['frontend'],
                            unlockThreshold: 80
                        },
                        css: {
                            name: 'CSS Artistry',
                            description: 'Advanced styling and animations',
                            prerequisites: ['frontend'],
                            unlockThreshold: 60,
                            branches: {
                                animations: 'CSS Animations',
                                grid: 'CSS Grid Mastery',
                                scss: 'SCSS/SASS Expertise'
                            }
                        }
                    }
                },
                
                backend: {
                    name: 'Backend Development',
                    description: 'Server-side architecture and data management',
                    icon: '🔧',
                    color: '#68a063',
                    basePosition: { x: 200, y: 0, z: 0 },
                    branches: {
                        nodejs: {
                            name: 'Node.js Mastery',
                            description: 'JavaScript server development',
                            prerequisites: ['backend'],
                            unlockThreshold: 120,
                            branches: {
                                express: 'Express.js Expert',
                                async: 'Async Programming',
                                performance: 'Node.js Optimization'
                            }
                        },
                        databases: {
                            name: 'Database Architecture',
                            description: 'Data modeling and optimization',
                            prerequisites: ['backend'],
                            unlockThreshold: 150,
                            branches: {
                                sql: 'SQL Mastery',
                                nosql: 'NoSQL Expertise',
                                optimization: 'Query Optimization'
                            }
                        },
                        api: {
                            name: 'API Design',
                            description: 'RESTful and GraphQL APIs',
                            prerequisites: ['backend'],
                            unlockThreshold: 90
                        }
                    }
                },
                
                devops: {
                    name: 'DevOps Engineering',
                    description: 'Infrastructure and deployment automation',
                    icon: '☁️',
                    color: '#326ce5',
                    basePosition: { x: 0, y: -200, z: 0 },
                    branches: {
                        docker: {
                            name: 'Containerization',
                            description: 'Docker and container orchestration',
                            prerequisites: ['devops'],
                            unlockThreshold: 100,
                            branches: {
                                kubernetes: 'Kubernetes Expert',
                                swarm: 'Docker Swarm',
                                security: 'Container Security'
                            }
                        },
                        ci_cd: {
                            name: 'CI/CD Pipelines',
                            description: 'Automated deployment workflows',
                            prerequisites: ['devops'],
                            unlockThreshold: 80
                        },
                        monitoring: {
                            name: 'System Monitoring',
                            description: 'Observability and alerting',
                            prerequisites: ['devops'],
                            unlockThreshold: 70
                        }
                    }
                },
                
                ai: {
                    name: 'AI & Machine Learning',
                    description: 'Artificial intelligence and data science',
                    icon: '🤖',
                    color: '#ff6b6b',
                    basePosition: { x: 0, y: 200, z: 0 },
                    branches: {
                        ml: {
                            name: 'Machine Learning',
                            description: 'Statistical learning algorithms',
                            prerequisites: ['ai'],
                            unlockThreshold: 200,
                            branches: {
                                supervised: 'Supervised Learning',
                                unsupervised: 'Unsupervised Learning',
                                reinforcement: 'Reinforcement Learning'
                            }
                        },
                        nlp: {
                            name: 'Natural Language Processing',
                            description: 'Text analysis and generation',
                            prerequisites: ['ai'],
                            unlockThreshold: 180
                        },
                        cv: {
                            name: 'Computer Vision',
                            description: 'Image and video analysis',
                            prerequisites: ['ai'],
                            unlockThreshold: 160
                        }
                    }
                }
            },
            
            // Progression settings
            progression: {
                baseExperience: 100,
                branchMultiplier: 1.5,
                masteryThreshold: 1000,
                particleValueMultiplier: 1.0,
                crossSkillBonus: 0.2
            },
            
            // Visual settings
            visualization: {
                branchDistance: 150,
                branchHeight: 50,
                connectionOpacity: 0.6,
                unlockAnimation: true,
                particleAttraction: true
            },
            
            ...config
        };
        
        // Current skill states
        this.skillStates = new Map();
        this.unlockedBranches = new Set();
        this.skillProgress = new Map();
        this.achievements = [];
        
        // Particle capture tracking
        this.particleCaptures = new Map();
        this.recentCaptures = [];
        
        // Gravity well configurations
        this.gravityWells = new Map();
        
        // Event tracking
        this.eventHandlers = new Map();
        
        this.initializeSkillTree();
        
        console.log('🌿 Skill Tree Integration initialized');
        console.log(`📊 Skills defined: ${Object.keys(this.config.skills).length}`);
        console.log(`🎯 Total branches: ${this.countTotalBranches()}`);
    }
    
    initializeSkillTree() {
        // Initialize skill states
        for (const [skillId, skill] of Object.entries(this.config.skills)) {
            this.skillStates.set(skillId, {
                id: skillId,
                name: skill.name,
                level: 0,
                experience: 0,
                unlocked: true,
                progress: 0,
                particlesCaptured: 0,
                lastActivity: Date.now(),
                branches: new Map()
            });
            
            // Initialize skill progress tracking
            this.skillProgress.set(skillId, {
                totalExperience: 0,
                sessionsActive: 0,
                averageParticlesPerMinute: 0,
                peakActivity: 0
            });
            
            // Initialize gravity well
            this.gravityWells.set(skillId, {
                id: skillId,
                position: { ...skill.basePosition },
                mass: 300,
                color: skill.color,
                particleCount: 0,
                density: 0,
                influence: this.calculateInfluenceRadius(300),
                branches: [],
                masteryLevel: 0
            });
            
            // Initialize branches
            if (skill.branches) {
                this.initializeBranches(skillId, skill.branches);
            }
        }
    }
    
    initializeBranches(parentSkillId, branches) {
        const parentState = this.skillStates.get(parentSkillId);
        
        for (const [branchId, branchConfig] of Object.entries(branches)) {
            const fullBranchId = `${parentSkillId}.${branchId}`;
            
            // Handle string branches (simple unlocks)
            if (typeof branchConfig === 'string') {
                parentState.branches.set(branchId, {
                    id: fullBranchId,
                    name: branchConfig,
                    unlocked: false,
                    unlockThreshold: 50,
                    experience: 0,
                    level: 0
                });
                continue;
            }
            
            // Handle complex branch objects
            parentState.branches.set(branchId, {
                id: fullBranchId,
                name: branchConfig.name,
                description: branchConfig.description || '',
                unlocked: false,
                unlockThreshold: branchConfig.unlockThreshold || 100,
                experience: 0,
                level: 0,
                prerequisites: branchConfig.prerequisites || [parentSkillId],
                subbranches: new Map()
            });
            
            // Initialize sub-branches recursively
            if (branchConfig.branches) {
                const branch = parentState.branches.get(branchId);
                for (const [subId, subConfig] of Object.entries(branchConfig.branches)) {
                    branch.subbranches.set(subId, {
                        id: `${fullBranchId}.${subId}`,
                        name: typeof subConfig === 'string' ? subConfig : subConfig.name,
                        unlocked: false,
                        unlockThreshold: 25,
                        experience: 0,
                        level: 0
                    });
                }
            }
        }
    }
    
    calculateInfluenceRadius(mass) {
        return Math.sqrt(mass) * 8;
    }
    
    countTotalBranches() {
        let count = 0;
        for (const skill of Object.values(this.config.skills)) {
            if (skill.branches) {
                count += Object.keys(skill.branches).length;
                
                // Count sub-branches
                for (const branch of Object.values(skill.branches)) {
                    if (typeof branch === 'object' && branch.branches) {
                        count += Object.keys(branch.branches).length;
                    }
                }
            }
        }
        return count;
    }
    
    /**
     * Process particle capture by skill area
     */
    captureParticle(skillId, particle, gravityWell) {
        const skillState = this.skillStates.get(skillId);
        if (!skillState) return;
        
        // Calculate experience from particle
        const experience = this.calculateParticleExperience(particle);
        
        // Add experience to skill
        this.addExperience(skillId, experience, particle);
        
        // Update gravity well density
        if (gravityWell) {
            gravityWell.particleCount++;
            gravityWell.density += particle.mass / gravityWell.mass;
        }
        
        // Track capture
        this.trackParticleCapture(skillId, particle, experience);
        
        // Check for level ups and unlocks
        this.checkProgressionTriggers(skillId);
        
        // Emit capture event
        this.emit('particle_captured', {
            skillId,
            particle,
            experience,
            skillState: { ...skillState }
        });
    }
    
    calculateParticleExperience(particle) {
        const baseValues = {
            skill: 10,
            experience: 15,
            achievement: 50,
            mastery: 100,
            hawking_radiation: 5
        };
        
        const baseValue = baseValues[particle.type] || 10;
        const massMultiplier = Math.log(particle.mass + 1) + 1;
        const ageMultiplier = Math.min(2, (particle.age / particle.lifespan) + 0.5);
        const velocityMultiplier = Math.min(1.5, particle.speed / 50 + 0.5);
        
        return Math.floor(
            baseValue * 
            massMultiplier * 
            ageMultiplier * 
            velocityMultiplier * 
            this.config.progression.particleValueMultiplier
        );
    }
    
    addExperience(skillId, experience, source = null) {
        const skillState = this.skillStates.get(skillId);
        if (!skillState) return;
        
        const oldLevel = skillState.level;
        
        // Add experience
        skillState.experience += experience;
        skillState.lastActivity = Date.now();
        
        // Update progress tracking
        const progress = this.skillProgress.get(skillId);
        progress.totalExperience += experience;
        
        // Calculate new level
        const newLevel = this.calculateLevel(skillState.experience);
        
        if (newLevel > oldLevel) {
            skillState.level = newLevel;
            this.handleLevelUp(skillId, oldLevel, newLevel);
        }
        
        // Update progress percentage
        skillState.progress = this.calculateProgressToNextLevel(skillState.experience);
        
        // Check for cross-skill bonuses
        this.applyCrossSkillBonuses(skillId, experience);
    }
    
    calculateLevel(experience) {
        // Exponential leveling: level = floor(sqrt(experience / baseExperience))
        return Math.floor(Math.sqrt(experience / this.config.progression.baseExperience));
    }
    
    calculateProgressToNextLevel(experience) {
        const currentLevel = this.calculateLevel(experience);
        const currentLevelXP = Math.pow(currentLevel, 2) * this.config.progression.baseExperience;
        const nextLevelXP = Math.pow(currentLevel + 1, 2) * this.config.progression.baseExperience;
        
        return (experience - currentLevelXP) / (nextLevelXP - currentLevelXP);
    }
    
    handleLevelUp(skillId, oldLevel, newLevel) {
        console.log(`🎉 Level up: ${skillId} ${oldLevel} → ${newLevel}`);
        
        const skillState = this.skillStates.get(skillId);
        
        // Award achievement
        this.awardAchievement({
            type: 'level_up',
            skillId,
            level: newLevel,
            timestamp: Date.now()
        });
        
        // Check for milestone rewards
        this.checkMilestoneRewards(skillId, newLevel);
        
        // Emit level up event
        this.emit('level_up', {
            skillId,
            oldLevel,
            newLevel,
            skillState: { ...skillState }
        });
    }
    
    checkMilestoneRewards(skillId, level) {
        const milestones = [5, 10, 25, 50, 100];
        
        if (milestones.includes(level)) {
            this.awardAchievement({
                type: 'milestone',
                skillId,
                level,
                milestone: level,
                timestamp: Date.now()
            });
            
            // Increase gravity well influence
            const gravityWell = this.gravityWells.get(skillId);
            if (gravityWell) {
                gravityWell.mass *= 1.1;
                gravityWell.influence = this.calculateInfluenceRadius(gravityWell.mass);
            }
        }
    }
    
    applyCrossSkillBonuses(skillId, experience) {
        const bonus = experience * this.config.progression.crossSkillBonus;
        
        // Find related skills and give small bonuses
        const relatedSkills = this.findRelatedSkills(skillId);
        
        for (const relatedSkillId of relatedSkills) {
            const relatedState = this.skillStates.get(relatedSkillId);
            if (relatedState) {
                relatedState.experience += bonus;
                relatedState.progress = this.calculateProgressToNextLevel(relatedState.experience);
            }
        }
    }
    
    findRelatedSkills(skillId) {
        // Define skill relationships
        const relationships = {
            frontend: ['devops'],
            backend: ['devops', 'ai'],
            devops: ['frontend', 'backend'],
            ai: ['backend']
        };
        
        return relationships[skillId] || [];
    }
    
    trackParticleCapture(skillId, particle, experience) {
        // Track recent captures for analysis
        this.recentCaptures.push({
            skillId,
            particleType: particle.type,
            experience,
            timestamp: Date.now()
        });
        
        // Limit recent captures to last 100
        if (this.recentCaptures.length > 100) {
            this.recentCaptures.shift();
        }
        
        // Update capture statistics
        const captureKey = `${skillId}.${particle.type}`;
        if (!this.particleCaptures.has(captureKey)) {
            this.particleCaptures.set(captureKey, {
                count: 0,
                totalExperience: 0,
                averageExperience: 0,
                lastCapture: Date.now()
            });
        }
        
        const captureData = this.particleCaptures.get(captureKey);
        captureData.count++;
        captureData.totalExperience += experience;
        captureData.averageExperience = captureData.totalExperience / captureData.count;
        captureData.lastCapture = Date.now();
    }
    
    checkProgressionTriggers(skillId) {
        const skillState = this.skillStates.get(skillId);
        if (!skillState) return;
        
        // Check branch unlocks
        for (const [branchId, branch] of skillState.branches) {
            if (!branch.unlocked && skillState.experience >= branch.unlockThreshold) {
                this.unlockBranch(skillId, branchId);
            }
        }
        
        // Check mastery threshold
        if (skillState.experience >= this.config.progression.masteryThreshold && 
            !skillState.mastered) {
            this.achieveMastery(skillId);
        }
    }
    
    unlockBranch(skillId, branchId) {
        const skillState = this.skillStates.get(skillId);
        const branch = skillState.branches.get(branchId);
        
        if (!branch || branch.unlocked) return;
        
        branch.unlocked = true;
        this.unlockedBranches.add(`${skillId}.${branchId}`);
        
        // Create gravity well for branch
        this.createBranchGravityWell(skillId, branchId, branch);
        
        console.log(`🌿 Branch unlocked: ${skillId}.${branchId} - ${branch.name}`);
        
        // Award achievement
        this.awardAchievement({
            type: 'branch_unlock',
            skillId,
            branchId,
            branchName: branch.name,
            timestamp: Date.now()
        });
        
        // Emit unlock event
        this.emit('branch_unlocked', {
            skillId,
            branchId,
            branch: { ...branch },
            skillState: { ...skillState }
        });
    }
    
    createBranchGravityWell(skillId, branchId, branch) {
        const parentWell = this.gravityWells.get(skillId);
        if (!parentWell) return;
        
        const branchAngle = (parentWell.branches.length * Math.PI * 2) / 6; // Up to 6 branches
        const branchDistance = this.config.visualization.branchDistance;
        const branchHeight = this.config.visualization.branchHeight;
        
        const branchWell = {
            id: `${skillId}.${branchId}`,
            parentSkill: skillId,
            position: {
                x: parentWell.position.x + Math.cos(branchAngle) * branchDistance,
                y: parentWell.position.y + Math.sin(branchAngle) * branchDistance,
                z: parentWell.position.z + (Math.random() - 0.5) * branchHeight
            },
            mass: parentWell.mass * 0.4,
            color: parentWell.color,
            particleCount: 0,
            density: 0,
            influence: this.calculateInfluenceRadius(parentWell.mass * 0.4),
            branches: [],
            masteryLevel: 0,
            branchType: 'skill_branch'
        };
        
        parentWell.branches.push(branchWell);
        this.gravityWells.set(branchWell.id, branchWell);
    }
    
    achieveMastery(skillId) {
        const skillState = this.skillStates.get(skillId);
        if (!skillState) return;
        
        skillState.mastered = true;
        skillState.masteryAchievedAt = Date.now();
        
        console.log(`🏆 MASTERY ACHIEVED: ${skillId}!`);
        
        // Major achievement
        this.awardAchievement({
            type: 'mastery',
            skillId,
            skillName: skillState.name,
            level: skillState.level,
            experience: skillState.experience,
            timestamp: Date.now()
        });
        
        // Unlock mastery bonuses
        this.unlockMasteryBonuses(skillId);
        
        // Emit mastery event
        this.emit('mastery_achieved', {
            skillId,
            skillState: { ...skillState }
        });
    }
    
    unlockMasteryBonuses(skillId) {
        // Increase all related skill progression rates
        const relatedSkills = this.findRelatedSkills(skillId);
        
        for (const relatedSkillId of relatedSkills) {
            const relatedWell = this.gravityWells.get(relatedSkillId);
            if (relatedWell) {
                relatedWell.mass *= 1.2; // Increase attraction
                relatedWell.influence = this.calculateInfluenceRadius(relatedWell.mass);
            }
        }
        
        // Increase base experience multiplier
        this.config.progression.particleValueMultiplier *= 1.1;
    }
    
    awardAchievement(achievement) {
        achievement.id = `achievement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.achievements.push(achievement);
        
        console.log(`🏆 Achievement: ${achievement.type} - ${achievement.skillId || 'global'}`);
        
        this.emit('achievement_earned', achievement);
    }
    
    /**
     * Get skill progression data for visualization
     */
    getSkillVisualization() {
        const skillViz = [];
        
        for (const [skillId, skillState] of this.skillStates) {
            const gravityWell = this.gravityWells.get(skillId);
            const skillConfig = this.config.skills[skillId];
            
            const skillData = {
                id: skillId,
                name: skillState.name,
                level: skillState.level,
                experience: skillState.experience,
                progress: skillState.progress,
                mastered: skillState.mastered || false,
                icon: skillConfig.icon,
                color: skillConfig.color,
                position: gravityWell?.position || skillConfig.basePosition,
                gravityWell: gravityWell ? {
                    mass: gravityWell.mass,
                    influence: gravityWell.influence,
                    density: gravityWell.density,
                    particleCount: gravityWell.particleCount
                } : null,
                branches: []
            };
            
            // Add branch data
            for (const [branchId, branch] of skillState.branches) {
                const branchWell = this.gravityWells.get(`${skillId}.${branchId}`);
                
                skillData.branches.push({
                    id: branchId,
                    name: branch.name,
                    description: branch.description || '',
                    unlocked: branch.unlocked,
                    level: branch.level,
                    experience: branch.experience,
                    unlockThreshold: branch.unlockThreshold,
                    position: branchWell?.position,
                    subbranches: Array.from(branch.subbranches?.values() || [])
                });
            }
            
            skillViz.push(skillData);
        }
        
        return skillViz;
    }
    
    /**
     * Get current statistics
     */
    getStatistics() {
        const stats = {
            totalSkills: this.skillStates.size,
            totalBranches: this.unlockedBranches.size,
            totalAchievements: this.achievements.length,
            masteredSkills: 0,
            totalExperience: 0,
            averageLevel: 0,
            skillBreakdown: {},
            recentActivity: this.recentCaptures.slice(-10),
            topPerformers: []
        };
        
        const levels = [];
        
        for (const [skillId, skillState] of this.skillStates) {
            if (skillState.mastered) stats.masteredSkills++;
            
            stats.totalExperience += skillState.experience;
            levels.push(skillState.level);
            
            stats.skillBreakdown[skillId] = {
                level: skillState.level,
                experience: skillState.experience,
                progress: skillState.progress,
                particlesCaptured: skillState.particlesCaptured,
                branches: skillState.branches.size
            };
        }
        
        stats.averageLevel = levels.length > 0 ? 
            levels.reduce((a, b) => a + b, 0) / levels.length : 0;
        
        // Calculate top performers
        stats.topPerformers = Array.from(this.skillStates.entries())
            .sort(([,a], [,b]) => b.experience - a.experience)
            .slice(0, 3)
            .map(([skillId, skillState]) => ({
                skillId,
                experience: skillState.experience,
                level: skillState.level
            }));
        
        return stats;
    }
    
    /**
     * Event system
     */
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event).push(handler);
    }
    
    emit(event, data) {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            handlers.forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`Event handler error for ${event}:`, error);
                }
            });
        }
    }
    
    /**
     * Get all gravity wells for physics system
     */
    getGravityWells() {
        return Array.from(this.gravityWells.values());
    }
    
    /**
     * Update gravity well from physics system
     */
    updateGravityWell(wellId, updates) {
        const well = this.gravityWells.get(wellId);
        if (well) {
            Object.assign(well, updates);
        }
    }
    
    /**
     * Reset skill tree (for testing)
     */
    reset() {
        this.skillStates.clear();
        this.unlockedBranches.clear();
        this.skillProgress.clear();
        this.achievements.length = 0;
        this.particleCaptures.clear();
        this.recentCaptures.length = 0;
        this.gravityWells.clear();
        
        this.initializeSkillTree();
        
        console.log('🔄 Skill tree reset');
    }
    
    /**
     * Save progress to localStorage (browser) or file (Node.js)
     */
    saveProgress() {
        const saveData = {
            skillStates: Array.from(this.skillStates.entries()),
            unlockedBranches: Array.from(this.unlockedBranches),
            skillProgress: Array.from(this.skillProgress.entries()),
            achievements: this.achievements,
            timestamp: Date.now()
        };
        
        // In browser environment
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('skillTreeProgress', JSON.stringify(saveData));
        }
        
        return saveData;
    }
    
    /**
     * Load progress from storage
     */
    loadProgress(saveData = null) {
        if (!saveData && typeof localStorage !== 'undefined') {
            const saved = localStorage.getItem('skillTreeProgress');
            if (saved) {
                saveData = JSON.parse(saved);
            }
        }
        
        if (!saveData) return false;
        
        try {
            // Restore skill states
            this.skillStates = new Map(saveData.skillStates);
            this.unlockedBranches = new Set(saveData.unlockedBranches);
            this.skillProgress = new Map(saveData.skillProgress);
            this.achievements = saveData.achievements || [];
            
            console.log('📥 Skill tree progress loaded');
            return true;
        } catch (error) {
            console.error('Failed to load progress:', error);
            return false;
        }
    }
}

module.exports = SkillTreeIntegration;

// Example usage
if (require.main === module) {
    console.log('🌿 Skill Tree Integration Test');
    
    const skillTree = new SkillTreeIntegration();
    
    // Set up event listeners
    skillTree.on('particle_captured', (data) => {
        console.log(`Particle captured: ${data.skillId} +${data.experience}XP`);
    });
    
    skillTree.on('level_up', (data) => {
        console.log(`LEVEL UP: ${data.skillId} reached level ${data.newLevel}!`);
    });
    
    skillTree.on('branch_unlocked', (data) => {
        console.log(`Branch unlocked: ${data.skillId}.${data.branchId}`);
    });
    
    skillTree.on('mastery_achieved', (data) => {
        console.log(`MASTERY: ${data.skillId} achieved mastery!`);
    });
    
    // Simulate particle captures
    console.log('\nSimulating particle captures...');
    
    const mockParticle = {
        type: 'skill',
        mass: 2,
        age: 15000,
        lifespan: 30000,
        speed: 25
    };
    
    // Capture particles for different skills
    for (let i = 0; i < 20; i++) {
        const skills = ['frontend', 'backend', 'ai', 'devops'];
        const skillId = skills[i % skills.length];
        
        skillTree.captureParticle(skillId, {
            ...mockParticle,
            mass: Math.random() * 3 + 1,
            speed: Math.random() * 50 + 10
        });
    }
    
    // Display results
    console.log('\nFinal Statistics:');
    console.log(JSON.stringify(skillTree.getStatistics(), null, 2));
    
    console.log('\nSkill Visualization:');
    const viz = skillTree.getSkillVisualization();
    viz.forEach(skill => {
        console.log(`${skill.icon} ${skill.name}: Level ${skill.level} (${skill.experience}XP)`);
        skill.branches.forEach(branch => {
            console.log(`  └─ ${branch.name}: ${branch.unlocked ? 'Unlocked' : 'Locked'}`);
        });
    });
}