/**
 * 🏷️ GUARDIAN SERVER MANAGER
 * Manages guardian tagging, roles, and server-like capabilities
 */

class GuardianServerManager {
    constructor() {
        this.guardianRegistry = new Map();
        this.roleDefinitions = this.initializeRoles();
        this.skillTags = this.initializeSkillTags();
        this.permissions = this.initializePermissions();
        this.activeProjects = new Map();
        this.taskQueue = [];
        
        // Server configuration
        this.serverConfig = {
            maxGuardiansPerProject: 5,
            maxConcurrentTasks: 3,
            taskTimeout: 300000, // 5 minutes
            heartbeatInterval: 30000 // 30 seconds
        };
        
        console.log('🏷️ Guardian Server Manager initialized');
    }
    
    initializeRoles() {
        return {
            architect: {
                name: 'System Architect',
                icon: '🏛️',
                color: '#9B59B6',
                capabilities: ['design', 'planning', 'review'],
                toolAccess: ['process_document', 'generate_architecture', 'review_code'],
                description: 'Designs system architecture and makes high-level decisions'
            },
            developer: {
                name: 'Developer',
                icon: '💻',
                color: '#3498DB',
                capabilities: ['coding', 'testing', 'debugging'],
                toolAccess: ['generate_code', 'run_tests', 'debug', 'git_operations'],
                description: 'Writes code and implements features'
            },
            designer: {
                name: 'UI/UX Designer',
                icon: '🎨',
                color: '#E74C3C',
                capabilities: ['design', 'prototyping', 'user_research'],
                toolAccess: ['generate_ui', 'create_mockup', 'analyze_ux'],
                description: 'Creates user interfaces and experiences'
            },
            tester: {
                name: 'QA Engineer',
                icon: '🧪',
                color: '#2ECC71',
                capabilities: ['testing', 'quality_assurance', 'bug_tracking'],
                toolAccess: ['run_tests', 'generate_test_cases', 'analyze_coverage'],
                description: 'Ensures quality and finds bugs'
            },
            devops: {
                name: 'DevOps Engineer',
                icon: '🚀',
                color: '#F39C12',
                capabilities: ['deployment', 'infrastructure', 'monitoring'],
                toolAccess: ['deploy_service', 'monitor_system', 'configure_ci'],
                description: 'Manages deployment and infrastructure'
            },
            analyst: {
                name: 'Data Analyst',
                icon: '📊',
                color: '#1ABC9C',
                capabilities: ['analysis', 'reporting', 'visualization'],
                toolAccess: ['analyze_data', 'generate_report', 'create_visualization'],
                description: 'Analyzes data and provides insights'
            },
            manager: {
                name: 'Project Manager',
                icon: '📋',
                color: '#95A5A6',
                capabilities: ['planning', 'coordination', 'reporting'],
                toolAccess: ['create_task', 'update_status', 'generate_report'],
                description: 'Manages projects and coordinates team'
            }
        };
    }
    
    initializeSkillTags() {
        return {
            // Technical skills
            frontend: { name: 'Frontend', icon: '🎨', category: 'technical' },
            backend: { name: 'Backend', icon: '⚙️', category: 'technical' },
            database: { name: 'Database', icon: '🗄️', category: 'technical' },
            api: { name: 'API Development', icon: '🔌', category: 'technical' },
            mobile: { name: 'Mobile', icon: '📱', category: 'technical' },
            cloud: { name: 'Cloud', icon: '☁️', category: 'technical' },
            ai: { name: 'AI/ML', icon: '🤖', category: 'technical' },
            blockchain: { name: 'Blockchain', icon: '⛓️', category: 'technical' },
            
            // Languages
            javascript: { name: 'JavaScript', icon: '🟨', category: 'language' },
            python: { name: 'Python', icon: '🐍', category: 'language' },
            typescript: { name: 'TypeScript', icon: '🔷', category: 'language' },
            rust: { name: 'Rust', icon: '🦀', category: 'language' },
            go: { name: 'Go', icon: '🐹', category: 'language' },
            
            // Frameworks
            react: { name: 'React', icon: '⚛️', category: 'framework' },
            vue: { name: 'Vue', icon: '💚', category: 'framework' },
            angular: { name: 'Angular', icon: '🔺', category: 'framework' },
            node: { name: 'Node.js', icon: '📗', category: 'framework' },
            django: { name: 'Django', icon: '🎸', category: 'framework' },
            
            // Soft skills
            communication: { name: 'Communication', icon: '💬', category: 'soft' },
            leadership: { name: 'Leadership', icon: '👑', category: 'soft' },
            problemSolving: { name: 'Problem Solving', icon: '🧩', category: 'soft' },
            creativity: { name: 'Creativity', icon: '✨', category: 'soft' }
        };
    }
    
    initializePermissions() {
        return {
            createProject: ['architect', 'manager'],
            deployProduction: ['devops', 'architect'],
            mergeCode: ['developer', 'architect'],
            assignTasks: ['manager', 'architect'],
            modifyInfrastructure: ['devops'],
            accessSensitiveData: ['architect', 'devops', 'manager'],
            approveDesigns: ['designer', 'architect'],
            runTests: ['tester', 'developer', 'devops']
        };
    }
    
    registerGuardian(guardian) {
        const serverId = this.generateServerId(guardian.id);
        
        const registration = {
            id: guardian.id,
            serverId: serverId,
            name: guardian.name,
            type: guardian.type,
            role: this.assignRole(guardian),
            skills: this.assignSkills(guardian),
            status: 'idle',
            currentTask: null,
            projectAccess: [],
            stats: {
                tasksCompleted: 0,
                successRate: 100,
                averageResponseTime: 0,
                specializations: []
            },
            presence: {
                online: true,
                lastSeen: Date.now(),
                activity: 'Just joined'
            }
        };
        
        this.guardianRegistry.set(guardian.id, registration);
        
        console.log(`🏷️ Registered guardian: ${guardian.name} as ${registration.role.name} (${serverId})`);
        
        return registration;
    }
    
    generateServerId(guardianId) {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `GDN-${timestamp}-${random}`.toUpperCase();
    }
    
    assignRole(guardian) {
        // Assign role based on guardian type and personality
        const roleMap = {
            analyzer: 'architect',
            learner: 'developer',
            creator: 'designer',
            scanner: 'tester',
            explorer: 'analyst',
            builder: 'developer',
            harmonizer: 'manager'
        };
        
        const roleKey = roleMap[guardian.type] || 'developer';
        return { key: roleKey, ...this.roleDefinitions[roleKey] };
    }
    
    assignSkills(guardian) {
        const skills = [];
        
        // Assign skills based on personality and type
        if (guardian.personality.creativity > 0.7) {
            skills.push('frontend', 'design', 'creativity');
        }
        if (guardian.personality.curiosity > 0.7) {
            skills.push('ai', 'problemSolving');
        }
        if (guardian.personality.leadership > 0.7) {
            skills.push('leadership', 'communication');
        }
        
        // Type-specific skills
        const typeSkills = {
            analyzer: ['backend', 'database', 'python'],
            learner: ['javascript', 'react', 'node'],
            creator: ['frontend', 'vue', 'design'],
            scanner: ['testing', 'security', 'api'],
            builder: ['backend', 'rust', 'cloud']
        };
        
        if (typeSkills[guardian.type]) {
            skills.push(...typeSkills[guardian.type]);
        }
        
        // Ensure unique skills
        return [...new Set(skills)];
    }
    
    updateGuardianStatus(guardianId, status, details = {}) {
        const guardian = this.guardianRegistry.get(guardianId);
        if (!guardian) return;
        
        guardian.status = status;
        guardian.presence.lastSeen = Date.now();
        guardian.presence.activity = details.activity || status;
        
        if (details.task) {
            guardian.currentTask = details.task;
        }
        
        this.emit('guardianStatusUpdate', { guardianId, status, details });
    }
    
    assignTask(guardianId, task) {
        const guardian = this.guardianRegistry.get(guardianId);
        if (!guardian) {
            throw new Error(`Guardian ${guardianId} not found`);
        }
        
        // Check if guardian has permission for this task type
        if (!this.canPerformTask(guardian, task)) {
            throw new Error(`Guardian ${guardian.name} doesn't have permission for ${task.type}`);
        }
        
        // Check if guardian is available
        if (guardian.status !== 'idle' && guardian.status !== 'available') {
            throw new Error(`Guardian ${guardian.name} is ${guardian.status}`);
        }
        
        const taskRecord = {
            id: `TASK-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            guardianId: guardianId,
            type: task.type,
            description: task.description,
            priority: task.priority || 'normal',
            assignedAt: Date.now(),
            deadline: task.deadline || Date.now() + this.serverConfig.taskTimeout,
            status: 'assigned',
            result: null
        };
        
        guardian.currentTask = taskRecord;
        guardian.status = 'working';
        
        this.taskQueue.push(taskRecord);
        
        this.emit('taskAssigned', { guardian, task: taskRecord });
        
        return taskRecord;
    }
    
    canPerformTask(guardian, task) {
        // Check role-based permissions
        const rolePermissions = guardian.role.capabilities;
        
        // Check if task type matches guardian capabilities
        if (task.requiresPermission) {
            const allowedRoles = this.permissions[task.requiresPermission] || [];
            return allowedRoles.includes(guardian.role.key);
        }
        
        // Check tool access
        if (task.requiresTool) {
            return guardian.role.toolAccess.includes(task.requiresTool);
        }
        
        // Default: check if capability matches
        return rolePermissions.some(cap => 
            task.type.toLowerCase().includes(cap) || 
            cap.includes(task.type.toLowerCase())
        );
    }
    
    getGuardianByTag(tag) {
        // Support multiple tag formats
        if (tag.startsWith('@')) {
            tag = tag.slice(1);
        }
        
        // Search by name
        for (const [id, guardian] of this.guardianRegistry) {
            if (guardian.name.toLowerCase() === tag.toLowerCase()) {
                return guardian;
            }
        }
        
        // Search by server ID
        for (const [id, guardian] of this.guardianRegistry) {
            if (guardian.serverId === tag) {
                return guardian;
            }
        }
        
        // Search by skill
        for (const [id, guardian] of this.guardianRegistry) {
            if (guardian.skills.includes(tag)) {
                return guardian;
            }
        }
        
        return null;
    }
    
    getGuardiansByRole(role) {
        const guardians = [];
        for (const [id, guardian] of this.guardianRegistry) {
            if (guardian.role.key === role) {
                guardians.push(guardian);
            }
        }
        return guardians;
    }
    
    getGuardiansBySkill(skill) {
        const guardians = [];
        for (const [id, guardian] of this.guardianRegistry) {
            if (guardian.skills.includes(skill)) {
                guardians.push(guardian);
            }
        }
        return guardians;
    }
    
    getAvailableGuardians() {
        const available = [];
        for (const [id, guardian] of this.guardianRegistry) {
            if (guardian.status === 'idle' || guardian.status === 'available') {
                available.push(guardian);
            }
        }
        return available;
    }
    
    createProject(projectName, guardianIds) {
        const projectId = `PROJ-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        
        const project = {
            id: projectId,
            name: projectName,
            createdAt: Date.now(),
            members: guardianIds,
            status: 'active',
            tasks: [],
            channels: {
                general: [],
                dev: [],
                design: []
            }
        };
        
        this.activeProjects.set(projectId, project);
        
        // Grant project access to guardians
        guardianIds.forEach(gId => {
            const guardian = this.guardianRegistry.get(gId);
            if (guardian) {
                guardian.projectAccess.push(projectId);
            }
        });
        
        this.emit('projectCreated', project);
        
        return project;
    }
    
    getGuardianStats(guardianId) {
        const guardian = this.guardianRegistry.get(guardianId);
        if (!guardian) return null;
        
        return {
            ...guardian.stats,
            role: guardian.role,
            skills: guardian.skills.map(s => ({
                key: s,
                ...this.skillTags[s]
            })),
            currentStatus: guardian.status,
            currentTask: guardian.currentTask,
            projects: guardian.projectAccess.map(pId => 
                this.activeProjects.get(pId)
            ).filter(Boolean)
        };
    }
    
    updateHeartbeat(guardianId) {
        const guardian = this.guardianRegistry.get(guardianId);
        if (guardian) {
            guardian.presence.lastSeen = Date.now();
            guardian.presence.online = true;
        }
    }
    
    checkGuardianHealth() {
        const now = Date.now();
        const offlineThreshold = this.serverConfig.heartbeatInterval * 2;
        
        for (const [id, guardian] of this.guardianRegistry) {
            if (now - guardian.presence.lastSeen > offlineThreshold) {
                guardian.presence.online = false;
                this.emit('guardianOffline', guardian);
            }
        }
    }
    
    completeTask(guardianId, taskId, result) {
        const guardian = this.guardianRegistry.get(guardianId);
        if (!guardian || !guardian.currentTask || guardian.currentTask.id !== taskId) {
            throw new Error('Invalid task completion request');
        }
        
        const task = guardian.currentTask;
        task.status = 'completed';
        task.completedAt = Date.now();
        task.result = result;
        
        // Update guardian stats
        guardian.stats.tasksCompleted++;
        const responseTime = task.completedAt - task.assignedAt;
        guardian.stats.averageResponseTime = 
            (guardian.stats.averageResponseTime * (guardian.stats.tasksCompleted - 1) + responseTime) / 
            guardian.stats.tasksCompleted;
        
        // Clear current task
        guardian.currentTask = null;
        guardian.status = 'idle';
        
        this.emit('taskCompleted', { guardian, task });
        
        return task;
    }
    
    // Event emitter functionality
    emit(event, data) {
        window.dispatchEvent(new CustomEvent(`guardian:${event}`, { detail: data }));
    }
    
    getServerStatus() {
        const totalGuardians = this.guardianRegistry.size;
        const onlineGuardians = Array.from(this.guardianRegistry.values())
            .filter(g => g.presence.online).length;
        const busyGuardians = Array.from(this.guardianRegistry.values())
            .filter(g => g.status === 'working').length;
        const activeProjects = this.activeProjects.size;
        const pendingTasks = this.taskQueue.filter(t => t.status === 'assigned').length;
        
        return {
            totalGuardians,
            onlineGuardians,
            busyGuardians,
            activeProjects,
            pendingTasks,
            roles: this.getRoleDistribution(),
            skills: this.getSkillDistribution()
        };
    }
    
    getRoleDistribution() {
        const distribution = {};
        for (const [id, guardian] of this.guardianRegistry) {
            const role = guardian.role.key;
            distribution[role] = (distribution[role] || 0) + 1;
        }
        return distribution;
    }
    
    getSkillDistribution() {
        const distribution = {};
        for (const [id, guardian] of this.guardianRegistry) {
            guardian.skills.forEach(skill => {
                distribution[skill] = (distribution[skill] || 0) + 1;
            });
        }
        return distribution;
    }
}

// Export for use in guardian world
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GuardianServerManager;
}
// Export for browser
if (typeof window \!== 'undefined') {
    window.GuardianServerManager = GuardianServerManager;
}
