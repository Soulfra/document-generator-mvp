/**
 * 🎮 GUARDIAN COMMAND SYSTEM
 * Advanced command parser and executor for guardian interactions
 */

class GuardianCommandSystem {
    constructor(world, chatSystem, serverManager, mcpBridge, workspace) {
        this.world = world;
        this.chatSystem = chatSystem;
        this.serverManager = serverManager;
        this.mcpBridge = mcpBridge;
        this.workspace = workspace;
        
        // Command registry
        this.commands = new Map();
        this.aliases = new Map();
        
        // Command history for tab completion
        this.commandHistory = [];
        this.contextualSuggestions = [];
        
        // Initialize commands
        this.registerCommands();
        
        console.log('🎮 Guardian Command System initialized');
    }
    
    registerCommands() {
        // Guardian management commands
        this.registerCommand({
            name: 'spawn',
            aliases: ['create', 'summon'],
            description: 'Spawn a new guardian',
            usage: '/spawn [type] [name]',
            execute: this.cmdSpawn.bind(this),
            permissions: ['all']
        });
        
        this.registerCommand({
            name: 'assign',
            aliases: ['task', 'give'],
            description: 'Assign a task to a guardian',
            usage: '/assign @guardian <task description>',
            execute: this.cmdAssign.bind(this),
            permissions: ['all']
        });
        
        this.registerCommand({
            name: 'team',
            aliases: ['group', 'squad'],
            description: 'Create a team of guardians',
            usage: '/team create <name> @guardian1 @guardian2...',
            execute: this.cmdTeam.bind(this),
            permissions: ['all']
        });
        
        // Tool commands
        this.registerCommand({
            name: 'tool',
            aliases: ['execute', 'run'],
            description: 'Execute an MCP tool',
            usage: '/tool <tool_name> [parameters]',
            execute: this.cmdTool.bind(this),
            permissions: ['all']
        });
        
        this.registerCommand({
            name: 'tools',
            aliases: ['list-tools'],
            description: 'List available tools',
            usage: '/tools [category]',
            execute: this.cmdListTools.bind(this),
            permissions: ['all']
        });
        
        // Project commands
        this.registerCommand({
            name: 'project',
            aliases: ['proj'],
            description: 'Project management',
            usage: '/project <create|load|save|info> [name]',
            execute: this.cmdProject.bind(this),
            permissions: ['all']
        });
        
        this.registerCommand({
            name: 'file',
            aliases: ['f'],
            description: 'File operations',
            usage: '/file <create|edit|delete> <path>',
            execute: this.cmdFile.bind(this),
            permissions: ['all']
        });
        
        this.registerCommand({
            name: 'build',
            aliases: ['compile'],
            description: 'Build the current project',
            usage: '/build [target]',
            execute: this.cmdBuild.bind(this),
            permissions: ['all']
        });
        
        this.registerCommand({
            name: 'test',
            aliases: ['tests'],
            description: 'Run project tests',
            usage: '/test [pattern]',
            execute: this.cmdTest.bind(this),
            permissions: ['all']
        });
        
        // Collaboration commands
        this.registerCommand({
            name: 'collaborate',
            aliases: ['collab', 'pair'],
            description: 'Start collaboration session',
            usage: '/collaborate @guardian1 @guardian2',
            execute: this.cmdCollaborate.bind(this),
            permissions: ['all']
        });
        
        this.registerCommand({
            name: 'dm',
            aliases: ['msg', 'pm'],
            description: 'Send private message',
            usage: '/dm @guardian <message>',
            execute: this.cmdDirectMessage.bind(this),
            permissions: ['all']
        });
        
        // Information commands
        this.registerCommand({
            name: 'status',
            aliases: ['stats', 'info'],
            description: 'Show system status',
            usage: '/status [guardian|project|server]',
            execute: this.cmdStatus.bind(this),
            permissions: ['all']
        });
        
        this.registerCommand({
            name: 'list',
            aliases: ['ls', 'show'],
            description: 'List entities',
            usage: '/list <guardians|projects|tasks|tools>',
            execute: this.cmdList.bind(this),
            permissions: ['all']
        });
        
        this.registerCommand({
            name: 'history',
            aliases: ['log'],
            description: 'Show command history',
            usage: '/history [count]',
            execute: this.cmdHistory.bind(this),
            permissions: ['all']
        });
        
        // System commands
        this.registerCommand({
            name: 'clear',
            aliases: ['cls'],
            description: 'Clear chat',
            usage: '/clear',
            execute: this.cmdClear.bind(this),
            permissions: ['all']
        });
        
        this.registerCommand({
            name: 'help',
            aliases: ['?', 'commands'],
            description: 'Show help',
            usage: '/help [command]',
            execute: this.cmdHelp.bind(this),
            permissions: ['all']
        });
        
        this.registerCommand({
            name: 'debug',
            aliases: ['dbg'],
            description: 'Toggle debug mode',
            usage: '/debug [on|off]',
            execute: this.cmdDebug.bind(this),
            permissions: ['all']
        });
        
        // Advanced commands
        this.registerCommand({
            name: 'analyze',
            aliases: ['scan'],
            description: 'Analyze code or document',
            usage: '/analyze <file|url>',
            execute: this.cmdAnalyze.bind(this),
            permissions: ['all']
        });
        
        this.registerCommand({
            name: 'generate',
            aliases: ['gen'],
            description: 'Generate code or content',
            usage: '/generate <type> <specification>',
            execute: this.cmdGenerate.bind(this),
            permissions: ['all']
        });
        
        this.registerCommand({
            name: 'deploy',
            aliases: ['ship'],
            description: 'Deploy project',
            usage: '/deploy [environment]',
            execute: this.cmdDeploy.bind(this),
            permissions: ['all']
        });
    }
    
    registerCommand(config) {
        this.commands.set(config.name, config);
        
        // Register aliases
        if (config.aliases) {
            config.aliases.forEach(alias => {
                this.aliases.set(alias, config.name);
            });
        }
    }
    
    async executeCommand(input) {
        if (!input.startsWith('/')) return false;
        
        const [cmdWithSlash, ...args] = input.split(' ');
        const cmd = cmdWithSlash.slice(1).toLowerCase();
        
        // Resolve alias
        const commandName = this.aliases.get(cmd) || cmd;
        const command = this.commands.get(commandName);
        
        if (!command) {
            this.chatSystem.addMessage({
                type: 'error',
                content: `Unknown command: ${cmd}. Type /help for available commands.`
            });
            return true;
        }
        
        // Add to history
        this.commandHistory.push(input);
        
        try {
            await command.execute(args);
        } catch (error) {
            this.chatSystem.addMessage({
                type: 'error',
                content: `Command failed: ${error.message}`
            });
        }
        
        return true;
    }
    
    // Command implementations
    async cmdSpawn(args) {
        const [type, ...nameParts] = args;
        const name = nameParts.join(' ');
        
        const guardian = this.world.spawnNewGuardian();
        
        if (type) {
            guardian.type = type;
        }
        if (name) {
            guardian.name = name;
        }
        
        const registration = this.serverManager.registerGuardian(guardian);
        
        this.chatSystem.addSystemMessage(
            `✨ Spawned ${guardian.name} (${registration.role.name}) - ID: ${registration.serverId}`
        );
    }
    
    async cmdAssign(args) {
        const input = args.join(' ');
        const match = input.match(/@(\w+)\s+(.+)/);
        
        if (!match) {
            throw new Error('Usage: /assign @guardian <task description>');
        }
        
        const [, guardianName, taskDescription] = match;
        const guardian = this.serverManager.getGuardianByTag(guardianName);
        
        if (!guardian) {
            throw new Error(`Guardian @${guardianName} not found`);
        }
        
        const task = this.serverManager.assignTask(guardian.id, {
            type: 'general',
            description: taskDescription,
            priority: 'normal'
        });
        
        this.chatSystem.addSystemMessage(
            `📋 Task assigned to ${guardian.name}: "${taskDescription}" (${task.id})`
        );
    }
    
    async cmdTeam(args) {
        const [action, teamName, ...members] = args;
        
        if (action === 'create') {
            const guardianIds = members
                .filter(m => m.startsWith('@'))
                .map(m => m.slice(1))
                .map(name => this.serverManager.getGuardianByTag(name))
                .filter(Boolean)
                .map(g => g.id);
            
            if (guardianIds.length < 2) {
                throw new Error('Team needs at least 2 guardians');
            }
            
            const project = this.serverManager.createProject(teamName, guardianIds);
            
            this.chatSystem.addSystemMessage(
                `👥 Created team "${teamName}" with ${guardianIds.length} guardians`
            );
        }
    }
    
    async cmdTool(args) {
        const [toolName, ...params] = args;
        
        if (!toolName) {
            throw new Error('Please specify a tool name. Use /tools to list available tools.');
        }
        
        const tool = this.mcpBridge.toolRegistry.get(toolName);
        if (!tool) {
            throw new Error(`Tool "${toolName}" not found`);
        }
        
        // Find appropriate guardian
        const guardians = this.serverManager.getGuardiansByRole(tool.requiredRole[0]);
        if (guardians.length === 0) {
            throw new Error(`No guardian available with required role: ${tool.requiredRole.join(', ')}`);
        }
        
        const executor = guardians[0];
        
        this.chatSystem.addSystemMessage(
            `🔧 ${executor.name} is executing ${toolName}...`
        );
        
        const result = await this.mcpBridge.executeTool(toolName, params, executor);
        
        this.chatSystem.addToolMessage(toolName, params.join(' '), 
            typeof result === 'object' ? JSON.stringify(result, null, 2) : result
        );
    }
    
    async cmdListTools(args) {
        const [category] = args;
        
        let tools = Array.from(this.mcpBridge.toolRegistry.values());
        
        if (category) {
            tools = tools.filter(t => t.category === category);
        }
        
        const categories = [...new Set(tools.map(t => t.category))];
        
        let output = '🔧 Available Tools:\n\n';
        
        categories.forEach(cat => {
            output += `📁 ${cat.toUpperCase()}\n`;
            tools
                .filter(t => t.category === cat)
                .forEach(tool => {
                    output += `  • ${tool.key} - ${tool.description}\n`;
                    output += `    Required role: ${tool.requiredRole.join(', ')}\n`;
                });
            output += '\n';
        });
        
        this.chatSystem.addSystemMessage(output.trim());
    }
    
    async cmdProject(args) {
        const [action, ...params] = args;
        
        switch (action) {
            case 'create':
                const name = params.join(' ') || 'New Project';
                const project = this.workspace.createProject(name, 'Created via command');
                this.chatSystem.addSystemMessage(`📁 Created project: ${name} (${project.id})`);
                break;
                
            case 'load':
                const projectId = params[0];
                if (!projectId) throw new Error('Please specify project ID');
                const loaded = this.workspace.loadProject(projectId);
                this.chatSystem.addSystemMessage(`📂 Loaded project: ${loaded.name}`);
                break;
                
            case 'save':
                const active = this.workspace.activeProject;
                if (!active) throw new Error('No active project');
                const exported = this.workspace.exportProject(active.id);
                this.chatSystem.addSystemMessage(`💾 Saved project: ${active.name}`);
                break;
                
            case 'info':
                const current = this.workspace.activeProject;
                if (!current) throw new Error('No active project');
                const stats = this.workspace.getProjectStats(current.id);
                this.chatSystem.addSystemMessage(
                    `📊 Project: ${current.name}\n` +
                    `Files: ${stats.files} (${this.formatBytes(stats.totalSize)})\n` +
                    `Tasks: ${stats.tasks.total} (${stats.tasks.done} done)\n` +
                    `Guardians: ${stats.guardians}`
                );
                break;
                
            default:
                throw new Error('Usage: /project <create|load|save|info>');
        }
    }
    
    async cmdFile(args) {
        const [action, ...params] = args;
        const path = params.join(' ');
        
        if (!this.workspace.activeProject) {
            throw new Error('No active project. Use /project create or /project load');
        }
        
        const projectId = this.workspace.activeProject.id;
        
        switch (action) {
            case 'create':
                if (!path) throw new Error('Please specify file path');
                this.workspace.createFile(projectId, path);
                this.chatSystem.addSystemMessage(`📄 Created file: ${path}`);
                break;
                
            case 'edit':
                if (!path) throw new Error('Please specify file path');
                const file = this.workspace.getFile(projectId, path);
                if (!file) throw new Error(`File not found: ${path}`);
                this.chatSystem.addSystemMessage(`📝 Opening ${path} for editing...`);
                // TODO: Open editor
                break;
                
            case 'delete':
                if (!path) throw new Error('Please specify file path');
                this.workspace.deleteFile(projectId, path);
                this.chatSystem.addSystemMessage(`🗑️ Deleted file: ${path}`);
                break;
                
            default:
                throw new Error('Usage: /file <create|edit|delete> <path>');
        }
    }
    
    async cmdBuild(args) {
        if (!this.workspace.activeProject) {
            throw new Error('No active project');
        }
        
        const builder = this.serverManager.getGuardiansByRole('devops')[0] ||
                       this.serverManager.getGuardiansByRole('developer')[0];
                       
        if (!builder) {
            throw new Error('No guardian available for building');
        }
        
        const build = await this.workspace.buildProject(this.workspace.activeProject.id, builder);
        this.chatSystem.addSystemMessage(`🔨 Build started by ${builder.name} (${build.id})`);
    }
    
    async cmdTest(args) {
        if (!this.workspace.activeProject) {
            throw new Error('No active project');
        }
        
        const tester = this.serverManager.getGuardiansByRole('tester')[0] ||
                      this.serverManager.getGuardiansByRole('developer')[0];
                      
        if (!tester) {
            throw new Error('No guardian available for testing');
        }
        
        const tests = await this.workspace.runTests(this.workspace.activeProject.id, tester);
        this.chatSystem.addSystemMessage(`🧪 Tests started by ${tester.name} (${tests.id})`);
    }
    
    async cmdCollaborate(args) {
        const guardians = args
            .filter(a => a.startsWith('@'))
            .map(a => a.slice(1))
            .map(name => this.serverManager.getGuardianByTag(name))
            .filter(Boolean);
        
        if (guardians.length < 2) {
            throw new Error('Need at least 2 guardians for collaboration');
        }
        
        const session = this.workspace.startCollaboration(
            this.workspace.activeProject?.id || 'global',
            guardians.map(g => g.id)
        );
        
        this.chatSystem.addSystemMessage(
            `🤝 Collaboration started: ${guardians.map(g => g.name).join(', ')}`
        );
    }
    
    async cmdDirectMessage(args) {
        const input = args.join(' ');
        const match = input.match(/@(\w+)\s+(.+)/);
        
        if (!match) {
            throw new Error('Usage: /dm @guardian <message>');
        }
        
        const [, guardianName, message] = match;
        const guardian = this.serverManager.getGuardianByTag(guardianName);
        
        if (!guardian) {
            throw new Error(`Guardian @${guardianName} not found`);
        }
        
        this.chatSystem.addMessage({
            type: 'private',
            author: 'You',
            content: `(to @${guardian.name}) ${message}`
        });
        
        // Simulate response
        setTimeout(() => {
            this.chatSystem.addMessage({
                type: 'private',
                author: guardian.name,
                content: `(private) ${this.generateResponse(guardian, message)}`
            });
        }, 1000 + Math.random() * 2000);
    }
    
    async cmdStatus(args) {
        const [type] = args;
        
        switch (type) {
            case 'guardian':
                const guardianStats = this.serverManager.getServerStatus();
                this.chatSystem.addSystemMessage(
                    `👥 Guardian Status:\n` +
                    `Online: ${guardianStats.onlineGuardians}/${guardianStats.totalGuardians}\n` +
                    `Working: ${guardianStats.busyGuardians}\n` +
                    `Roles: ${Object.entries(guardianStats.roles).map(([r, c]) => `${r}:${c}`).join(', ')}`
                );
                break;
                
            case 'project':
                if (!this.workspace.activeProject) {
                    this.chatSystem.addSystemMessage('No active project');
                    return;
                }
                const projectStats = this.workspace.getProjectStats(this.workspace.activeProject.id);
                this.chatSystem.addSystemMessage(
                    `📁 Project Status:\n` +
                    `Files: ${projectStats.files}\n` +
                    `Size: ${this.formatBytes(projectStats.totalSize)}\n` +
                    `Tasks: ${projectStats.tasks.done}/${projectStats.tasks.total} completed`
                );
                break;
                
            case 'server':
                const toolStats = this.mcpBridge.getToolStats();
                const executions = Object.values(toolStats).reduce((sum, t) => sum + t.executions, 0);
                this.chatSystem.addSystemMessage(
                    `🖥️ Server Status:\n` +
                    `MCP Tools: ${Object.keys(toolStats).length} available\n` +
                    `Executions: ${executions} total\n` +
                    `Uptime: ${this.formatUptime(Date.now() - window.startTime)}`
                );
                break;
                
            default:
                const status = this.serverManager.getServerStatus();
                this.chatSystem.addSystemMessage(
                    `📊 System Status:\n` +
                    `Guardians: ${status.onlineGuardians}/${status.totalGuardians} online\n` +
                    `Projects: ${status.activeProjects} active\n` +
                    `Tasks: ${status.pendingTasks} pending`
                );
        }
    }
    
    async cmdList(args) {
        const [type] = args;
        
        switch (type) {
            case 'guardians':
                const guardians = Array.from(this.serverManager.guardianRegistry.values());
                const list = guardians.map(g => 
                    `• ${g.name} (@${g.name.toLowerCase()}) - ${g.role.name} [${g.status}]`
                ).join('\n');
                this.chatSystem.addSystemMessage(`👥 Guardians:\n${list}`);
                break;
                
            case 'projects':
                const projects = Array.from(this.workspace.projects.values());
                const projectList = projects.map(p => 
                    `• ${p.name} (${p.id}) - ${p.status}`
                ).join('\n');
                this.chatSystem.addSystemMessage(`📁 Projects:\n${projectList || 'No projects'}`);
                break;
                
            case 'tasks':
                const tasks = this.serverManager.taskQueue;
                const taskList = tasks.slice(0, 10).map(t => 
                    `• ${t.description} - ${t.status}`
                ).join('\n');
                this.chatSystem.addSystemMessage(`📋 Recent Tasks:\n${taskList || 'No tasks'}`);
                break;
                
            case 'tools':
                await this.cmdListTools([]);
                break;
                
            default:
                throw new Error('Usage: /list <guardians|projects|tasks|tools>');
        }
    }
    
    async cmdHistory(args) {
        const [count = 10] = args;
        const recent = this.commandHistory.slice(-count);
        
        const history = recent.map((cmd, i) => 
            `${this.commandHistory.length - recent.length + i + 1}: ${cmd}`
        ).join('\n');
        
        this.chatSystem.addSystemMessage(`📜 Command History:\n${history}`);
    }
    
    async cmdClear(args) {
        this.chatSystem.clearChat();
    }
    
    async cmdHelp(args) {
        const [commandName] = args;
        
        if (commandName) {
            const cmd = this.commands.get(commandName) || 
                       this.commands.get(this.aliases.get(commandName));
            
            if (!cmd) {
                throw new Error(`Unknown command: ${commandName}`);
            }
            
            this.chatSystem.addSystemMessage(
                `📖 Help for /${cmd.name}:\n` +
                `Description: ${cmd.description}\n` +
                `Usage: ${cmd.usage}\n` +
                `Aliases: ${cmd.aliases ? cmd.aliases.join(', ') : 'none'}`
            );
        } else {
            const categories = {
                'Guardian Management': ['spawn', 'assign', 'team'],
                'Tools': ['tool', 'tools'],
                'Projects': ['project', 'file', 'build', 'test'],
                'Collaboration': ['collaborate', 'dm'],
                'Information': ['status', 'list', 'history'],
                'System': ['clear', 'help', 'debug']
            };
            
            let helpText = '📖 Available Commands:\n\n';
            
            Object.entries(categories).forEach(([category, commands]) => {
                helpText += `${category}:\n`;
                commands.forEach(cmdName => {
                    const cmd = this.commands.get(cmdName);
                    if (cmd) {
                        helpText += `  /${cmd.name} - ${cmd.description}\n`;
                    }
                });
                helpText += '\n';
            });
            
            helpText += 'Type /help <command> for detailed help on a specific command.';
            
            this.chatSystem.addSystemMessage(helpText);
        }
    }
    
    async cmdDebug(args) {
        const [mode] = args;
        
        if (mode === 'on') {
            this.world.setDebugMode(true);
            this.chatSystem.addSystemMessage('🔍 Debug mode enabled');
        } else if (mode === 'off') {
            this.world.setDebugMode(false);
            this.chatSystem.addSystemMessage('🔍 Debug mode disabled');
        } else {
            const current = this.world.debugMode;
            this.world.setDebugMode(!current);
            this.chatSystem.addSystemMessage(`🔍 Debug mode ${!current ? 'enabled' : 'disabled'}`);
        }
    }
    
    async cmdAnalyze(args) {
        const [target] = args;
        if (!target) throw new Error('Please specify a file or URL to analyze');
        
        const analyzer = this.serverManager.getGuardiansByRole('analyst')[0] ||
                        this.serverManager.getGuardiansByRole('architect')[0];
                        
        if (!analyzer) throw new Error('No analyst guardian available');
        
        this.chatSystem.addSystemMessage(`🔍 ${analyzer.name} is analyzing ${target}...`);
        
        // Execute analysis tool
        const result = await this.mcpBridge.executeTool('analyze_data', { dataSource: target }, analyzer);
        
        this.chatSystem.addToolMessage('analyze_data', target, 
            typeof result === 'object' ? JSON.stringify(result, null, 2) : result
        );
    }
    
    async cmdGenerate(args) {
        const [type, ...specParts] = args;
        const specification = specParts.join(' ');
        
        if (!type || !specification) {
            throw new Error('Usage: /generate <type> <specification>');
        }
        
        const generator = this.serverManager.getGuardiansByRole('developer')[0] ||
                         this.serverManager.getGuardiansByRole('creator')[0];
                         
        if (!generator) throw new Error('No generator guardian available');
        
        this.chatSystem.addSystemMessage(`✨ ${generator.name} is generating ${type}...`);
        
        const result = await this.mcpBridge.executeTool('generate_code', {
            specification,
            language: type
        }, generator);
        
        this.chatSystem.addToolMessage('generate_code', `${type}: ${specification}`,
            typeof result === 'object' ? JSON.stringify(result, null, 2) : result
        );
    }
    
    async cmdDeploy(args) {
        const [environment = 'staging'] = args;
        
        if (!this.workspace.activeProject) {
            throw new Error('No active project to deploy');
        }
        
        const deployer = this.serverManager.getGuardiansByRole('devops')[0];
        if (!deployer) throw new Error('No DevOps guardian available');
        
        this.chatSystem.addSystemMessage(`🚀 ${deployer.name} is deploying to ${environment}...`);
        
        const result = await this.mcpBridge.executeTool('deploy_service', {
            serviceName: this.workspace.activeProject.name,
            environment
        }, deployer);
        
        this.chatSystem.addToolMessage('deploy_service', environment,
            typeof result === 'object' ? JSON.stringify(result, null, 2) : result
        );
    }
    
    // Helper methods
    generateResponse(guardian, message) {
        const responses = {
            architect: "I'll design a solution for that.",
            developer: "I can implement that feature.",
            designer: "Let me create a beautiful interface.",
            tester: "I'll make sure it works perfectly.",
            devops: "I'll handle the deployment.",
            analyst: "Let me analyze the data.",
            manager: "I'll coordinate the team."
        };
        
        return responses[guardian.role.key] || "Understood!";
    }
    
    formatBytes(bytes) {
        const units = ['B', 'KB', 'MB', 'GB'];
        let size = bytes;
        let unitIndex = 0;
        
        while (size >= 1024 && unitIndex < units.length - 1) {
            size /= 1024;
            unitIndex++;
        }
        
        return `${size.toFixed(2)} ${units[unitIndex]}`;
    }
    
    formatUptime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}d ${hours % 24}h`;
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }
    
    // Auto-completion support
    getCompletions(partial) {
        const completions = [];
        
        // Command completions
        if (partial.startsWith('/')) {
            const cmdPartial = partial.slice(1).toLowerCase();
            
            for (const [name, cmd] of this.commands) {
                if (name.startsWith(cmdPartial)) {
                    completions.push('/' + name);
                }
            }
            
            for (const [alias, name] of this.aliases) {
                if (alias.startsWith(cmdPartial)) {
                    completions.push('/' + alias);
                }
            }
        }
        
        // Guardian name completions
        if (partial.startsWith('@')) {
            const namePartial = partial.slice(1).toLowerCase();
            
            for (const [id, guardian] of this.serverManager.guardianRegistry) {
                if (guardian.name.toLowerCase().startsWith(namePartial)) {
                    completions.push('@' + guardian.name.toLowerCase());
                }
            }
        }
        
        return completions;
    }
}

// Export for use in guardian world
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GuardianCommandSystem;
}

// Set start time for uptime tracking
window.startTime = Date.now();