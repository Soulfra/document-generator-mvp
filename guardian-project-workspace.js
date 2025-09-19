/**
 * 💼 GUARDIAN PROJECT WORKSPACE
 * Collaborative workspace for guardians to work on projects together
 */

class GuardianProjectWorkspace {
    constructor() {
        this.projects = new Map();
        this.activeProject = null;
        this.fileSystem = new Map();
        this.collaborativeSessions = new Map();
        this.buildQueue = [];
        this.testResults = new Map();
        
        // Workspace configuration
        this.config = {
            maxFilesPerProject: 1000,
            maxFileSize: 1048576, // 1MB
            autoSaveInterval: 30000, // 30 seconds
            supportedLanguages: ['javascript', 'typescript', 'python', 'html', 'css', 'json', 'markdown']
        };
        
        // Code editor state
        this.editorState = {
            currentFile: null,
            content: '',
            language: 'javascript',
            cursors: new Map(), // Track guardian cursors
            selections: new Map(),
            version: 0
        };
        
        console.log('💼 Guardian Project Workspace initialized');
    }
    
    createProject(name, description, guardians = []) {
        const projectId = `PROJ-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        
        const project = {
            id: projectId,
            name,
            description,
            createdAt: Date.now(),
            modifiedAt: Date.now(),
            guardians: guardians,
            structure: {
                folders: {
                    src: { files: [], folders: {} },
                    tests: { files: [], folders: {} },
                    docs: { files: [], folders: {} }
                },
                files: ['README.md', 'package.json', '.gitignore']
            },
            status: 'active',
            tasks: [],
            builds: [],
            deployments: []
        };
        
        this.projects.set(projectId, project);
        
        // Initialize default files
        this.createFile(projectId, 'README.md', `# ${name}\n\n${description}\n\n## Getting Started\n\nThis project was created by Guardian AI collaboration.`);
        this.createFile(projectId, 'package.json', JSON.stringify({
            name: name.toLowerCase().replace(/\s+/g, '-'),
            version: '0.1.0',
            description: description,
            main: 'src/index.js',
            scripts: {
                start: 'node src/index.js',
                test: 'jest',
                build: 'webpack'
            }
        }, null, 2));
        this.createFile(projectId, '.gitignore', 'node_modules/\n.env\ndist/\n*.log');
        
        this.emit('projectCreated', project);
        
        return project;
    }
    
    loadProject(projectId) {
        const project = this.projects.get(projectId);
        if (!project) {
            throw new Error(`Project ${projectId} not found`);
        }
        
        this.activeProject = project;
        this.emit('projectLoaded', project);
        
        return project;
    }
    
    createFile(projectId, path, content = '') {
        const fileKey = `${projectId}:${path}`;
        
        const file = {
            path,
            content,
            language: this.detectLanguage(path),
            createdAt: Date.now(),
            modifiedAt: Date.now(),
            size: new Blob([content]).size,
            version: 1,
            history: [{
                version: 1,
                content,
                timestamp: Date.now(),
                author: 'system'
            }]
        };
        
        this.fileSystem.set(fileKey, file);
        
        // Update project structure
        const project = this.projects.get(projectId);
        if (project) {
            this.updateProjectStructure(project, path, 'add');
            project.modifiedAt = Date.now();
        }
        
        this.emit('fileCreated', { projectId, file });
        
        return file;
    }
    
    updateFile(projectId, path, content, author) {
        const fileKey = `${projectId}:${path}`;
        const file = this.fileSystem.get(fileKey);
        
        if (!file) {
            return this.createFile(projectId, path, content);
        }
        
        file.content = content;
        file.modifiedAt = Date.now();
        file.size = new Blob([content]).size;
        file.version++;
        
        // Add to history
        file.history.push({
            version: file.version,
            content,
            timestamp: Date.now(),
            author: author || 'unknown'
        });
        
        // Limit history
        if (file.history.length > 50) {
            file.history.shift();
        }
        
        this.emit('fileUpdated', { projectId, file, author });
        
        return file;
    }
    
    deleteFile(projectId, path) {
        const fileKey = `${projectId}:${path}`;
        const file = this.fileSystem.get(fileKey);
        
        if (!file) {
            throw new Error(`File ${path} not found`);
        }
        
        this.fileSystem.delete(fileKey);
        
        // Update project structure
        const project = this.projects.get(projectId);
        if (project) {
            this.updateProjectStructure(project, path, 'remove');
            project.modifiedAt = Date.now();
        }
        
        this.emit('fileDeleted', { projectId, path });
    }
    
    getFile(projectId, path) {
        const fileKey = `${projectId}:${path}`;
        return this.fileSystem.get(fileKey);
    }
    
    getProjectFiles(projectId) {
        const files = [];
        const prefix = `${projectId}:`;
        
        for (const [key, file] of this.fileSystem) {
            if (key.startsWith(prefix)) {
                files.push(file);
            }
        }
        
        return files;
    }
    
    detectLanguage(path) {
        const ext = path.split('.').pop().toLowerCase();
        const languageMap = {
            js: 'javascript',
            jsx: 'javascript',
            ts: 'typescript',
            tsx: 'typescript',
            py: 'python',
            html: 'html',
            css: 'css',
            json: 'json',
            md: 'markdown',
            yml: 'yaml',
            yaml: 'yaml'
        };
        
        return languageMap[ext] || 'text';
    }
    
    updateProjectStructure(project, path, action) {
        const parts = path.split('/');
        const fileName = parts.pop();
        
        let current = project.structure;
        
        // Navigate to the correct folder
        for (const folder of parts) {
            if (!current.folders[folder]) {
                if (action === 'add') {
                    current.folders[folder] = { files: [], folders: {} };
                } else {
                    return;
                }
            }
            current = current.folders[folder];
        }
        
        // Update files list
        if (action === 'add' && !current.files.includes(fileName)) {
            current.files.push(fileName);
        } else if (action === 'remove') {
            const index = current.files.indexOf(fileName);
            if (index > -1) {
                current.files.splice(index, 1);
            }
        }
    }
    
    // Collaborative editing
    startCollaboration(projectId, guardians) {
        const sessionId = `COLLAB-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        
        const session = {
            id: sessionId,
            projectId,
            participants: guardians,
            startTime: Date.now(),
            activeFile: null,
            changes: [],
            chat: []
        };
        
        this.collaborativeSessions.set(sessionId, session);
        
        this.emit('collaborationStarted', session);
        
        return session;
    }
    
    updateCursor(sessionId, guardianId, position) {
        this.editorState.cursors.set(guardianId, {
            line: position.line,
            column: position.column,
            timestamp: Date.now()
        });
        
        this.emit('cursorUpdated', { sessionId, guardianId, position });
    }
    
    updateSelection(sessionId, guardianId, selection) {
        this.editorState.selections.set(guardianId, {
            start: selection.start,
            end: selection.end,
            timestamp: Date.now()
        });
        
        this.emit('selectionUpdated', { sessionId, guardianId, selection });
    }
    
    // Build and test
    async buildProject(projectId, guardian) {
        const project = this.projects.get(projectId);
        if (!project) {
            throw new Error(`Project ${projectId} not found`);
        }
        
        const buildId = `BUILD-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        
        const build = {
            id: buildId,
            projectId,
            initiatedBy: guardian.id,
            startTime: Date.now(),
            status: 'running',
            logs: [],
            artifacts: []
        };
        
        this.buildQueue.push(build);
        project.builds.push(buildId);
        
        this.emit('buildStarted', build);
        
        // Simulate build process
        setTimeout(() => {
            build.status = Math.random() > 0.2 ? 'success' : 'failed';
            build.endTime = Date.now();
            build.logs.push('Installing dependencies...');
            build.logs.push('Compiling source files...');
            
            if (build.status === 'success') {
                build.logs.push('Build completed successfully!');
                build.artifacts.push({
                    name: 'dist.zip',
                    size: 1024 * 512,
                    path: `/builds/${buildId}/dist.zip`
                });
            } else {
                build.logs.push('ERROR: Build failed - syntax error in src/index.js');
            }
            
            this.emit('buildCompleted', build);
        }, 3000 + Math.random() * 3000);
        
        return build;
    }
    
    async runTests(projectId, guardian) {
        const project = this.projects.get(projectId);
        if (!project) {
            throw new Error(`Project ${projectId} not found`);
        }
        
        const testRunId = `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        
        const testRun = {
            id: testRunId,
            projectId,
            runBy: guardian.id,
            startTime: Date.now(),
            status: 'running',
            results: {
                total: 0,
                passed: 0,
                failed: 0,
                skipped: 0
            },
            coverage: {
                statements: 0,
                branches: 0,
                functions: 0,
                lines: 0
            }
        };
        
        this.testResults.set(testRunId, testRun);
        
        this.emit('testsStarted', testRun);
        
        // Simulate test execution
        setTimeout(() => {
            const total = Math.floor(Math.random() * 50) + 10;
            const failed = Math.floor(Math.random() * 5);
            
            testRun.status = failed === 0 ? 'passed' : 'failed';
            testRun.endTime = Date.now();
            testRun.results = {
                total,
                passed: total - failed,
                failed,
                skipped: 0
            };
            testRun.coverage = {
                statements: 75 + Math.random() * 20,
                branches: 70 + Math.random() * 20,
                functions: 80 + Math.random() * 15,
                lines: 75 + Math.random() * 20
            };
            
            this.emit('testsCompleted', testRun);
        }, 2000 + Math.random() * 3000);
        
        return testRun;
    }
    
    // Task management
    createTask(projectId, task) {
        const project = this.projects.get(projectId);
        if (!project) {
            throw new Error(`Project ${projectId} not found`);
        }
        
        const taskId = `TASK-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        
        const taskRecord = {
            id: taskId,
            ...task,
            createdAt: Date.now(),
            status: 'todo',
            assignee: task.assignee || null,
            completed: false
        };
        
        project.tasks.push(taskRecord);
        
        this.emit('taskCreated', { projectId, task: taskRecord });
        
        return taskRecord;
    }
    
    updateTask(projectId, taskId, updates) {
        const project = this.projects.get(projectId);
        if (!project) {
            throw new Error(`Project ${projectId} not found`);
        }
        
        const task = project.tasks.find(t => t.id === taskId);
        if (!task) {
            throw new Error(`Task ${taskId} not found`);
        }
        
        Object.assign(task, updates);
        task.modifiedAt = Date.now();
        
        this.emit('taskUpdated', { projectId, task });
        
        return task;
    }
    
    assignTask(projectId, taskId, guardianId) {
        return this.updateTask(projectId, taskId, { 
            assignee: guardianId,
            status: 'in-progress'
        });
    }
    
    completeTask(projectId, taskId) {
        return this.updateTask(projectId, taskId, {
            status: 'done',
            completed: true,
            completedAt: Date.now()
        });
    }
    
    // Project statistics
    getProjectStats(projectId) {
        const project = this.projects.get(projectId);
        if (!project) return null;
        
        const files = this.getProjectFiles(projectId);
        const totalSize = files.reduce((sum, file) => sum + file.size, 0);
        const languages = {};
        
        files.forEach(file => {
            languages[file.language] = (languages[file.language] || 0) + 1;
        });
        
        const tasks = project.tasks;
        const taskStats = {
            total: tasks.length,
            todo: tasks.filter(t => t.status === 'todo').length,
            inProgress: tasks.filter(t => t.status === 'in-progress').length,
            done: tasks.filter(t => t.status === 'done').length
        };
        
        return {
            files: files.length,
            totalSize,
            languages,
            tasks: taskStats,
            builds: project.builds.length,
            lastModified: project.modifiedAt,
            guardians: project.guardians.length
        };
    }
    
    // Export project
    exportProject(projectId) {
        const project = this.projects.get(projectId);
        if (!project) return null;
        
        const files = this.getProjectFiles(projectId);
        const fileContents = {};
        
        files.forEach(file => {
            fileContents[file.path] = file.content;
        });
        
        return {
            project: {
                name: project.name,
                description: project.description,
                createdAt: project.createdAt,
                structure: project.structure
            },
            files: fileContents,
            tasks: project.tasks,
            exportedAt: Date.now()
        };
    }
    
    // Event emitter
    emit(event, data) {
        window.dispatchEvent(new CustomEvent(`workspace:${event}`, { detail: data }));
    }
}

// Export for use in guardian world
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GuardianProjectWorkspace;
}