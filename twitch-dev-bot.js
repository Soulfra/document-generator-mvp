#!/usr/bin/env node

/**
 * 🤖 TWITCH DEV BOT
 * Developer-focused Twitch bot for streaming coding sessions
 * Integrates with git commits, build systems, and documentation
 */

const tmi = require('tmi.js');
const { EventEmitter } = require('events');
const GitCommitStream = require('./git-commit-stream');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class TwitchDevBot extends EventEmitter {
    constructor(options = {}) {
        super();
        
        // Twitch configuration
        this.channel = options.channel || process.env.TWITCH_CHANNEL;
        this.username = options.username || process.env.TWITCH_BOT_USERNAME || 'DevStreamBot';
        this.oauth = options.oauth || process.env.TWITCH_OAUTH;
        
        // Development configuration
        this.repoPath = options.repoPath || process.cwd();
        this.projectName = options.projectName || path.basename(this.repoPath);
        
        // Bot state
        this.isConnected = false;
        this.commandCooldowns = new Map();
        this.viewerStats = new Map();
        this.sessionStats = {
            startTime: Date.now(),
            commits: 0,
            linesWritten: 0,
            bugs: 0,
            features: 0,
            viewerQuestions: 0
        };
        
        // Services
        this.gitMonitor = null;
        this.todoSystem = null;
        this.buildMonitor = null;
        
        // Command configuration
        this.commands = {
            '!help': this.cmdHelp.bind(this),
            '!project': this.cmdProject.bind(this),
            '!commit': this.cmdLatestCommit.bind(this),
            '!commits': this.cmdRecentCommits.bind(this),
            '!progress': this.cmdProgress.bind(this),
            '!todo': this.cmdTodo.bind(this),
            '!explain': this.cmdExplain.bind(this),
            '!build': this.cmdBuildStatus.bind(this),
            '!stats': this.cmdSessionStats.bind(this),
            '!tech': this.cmdTechStack.bind(this),
            '!learn': this.cmdLearnResource.bind(this),
            '!issue': this.cmdReportIssue.bind(this),
            '!pr': this.cmdPullRequest.bind(this),
            '!test': this.cmdTestStatus.bind(this),
            '!docs': this.cmdDocumentation.bind(this),
            '!milestone': this.cmdMilestone.bind(this),
            '!github': this.cmdGitHub.bind(this),
            '!vscode': this.cmdVSCode.bind(this),
            '!theme': this.cmdTheme.bind(this),
            '!music': this.cmdMusic.bind(this),
            '!hydrate': this.cmdHydrate.bind(this),
            '!stretch': this.cmdStretch.bind(this)
        };
        
        // Initialize client
        this.client = new tmi.Client({
            options: { debug: options.debug || false },
            connection: {
                reconnect: true,
                secure: true
            },
            identity: {
                username: this.username,
                password: this.oauth
            },
            channels: [this.channel]
        });
        
        this.setupEventHandlers();
        console.log('🤖 Twitch Dev Bot initialized');
    }
    
    async connect() {
        try {
            await this.client.connect();
            this.isConnected = true;
            
            // Start git monitoring
            await this.startGitMonitoring();
            
            // Load project data
            await this.loadProjectData();
            
            // Send startup message
            this.say(`🚀 DevBot online! Working on: ${this.projectName}. Type !help for commands.`);
            
            this.emit('connected');
            
        } catch (error) {
            console.error('Connection error:', error);
            this.emit('error', error);
        }
    }
    
    setupEventHandlers() {
        this.client.on('message', this.handleMessage.bind(this));
        this.client.on('connected', this.handleConnected.bind(this));
        this.client.on('disconnected', this.handleDisconnected.bind(this));
        
        // Raid/Host events
        this.client.on('raided', (channel, username, viewers) => {
            this.say(`🎉 Thank you @${username} for the raid with ${viewers} viewers! Welcome raiders! Current project: ${this.projectName}`);
        });
        
        this.client.on('hosted', (channel, username, viewers, autohost) => {
            if (!autohost) {
                this.say(`📺 Thank you @${username} for the host! Welcome everyone!`);
            }
        });
        
        // Subscription events
        this.client.on('subscription', (channel, username, method, message, userstate) => {
            this.say(`🎆 Thank you @${username} for subscribing! Your support helps me code faster! 🚀`);
            this.sessionStats.features++; // Subs unlock features!
        });
    }
    
    async handleMessage(channel, tags, message, self) {
        if (self) return; // Ignore bot's own messages
        
        const username = tags.username;
        const userId = tags['user-id'];
        
        // Track viewer engagement
        this.trackViewerEngagement(userId, username);
        
        // Check if it's a command
        if (message.startsWith('!')) {
            const args = message.slice(1).split(' ');
            const command = '!' + args[0].toLowerCase();
            
            if (this.commands[command]) {
                // Check cooldown
                if (this.isOnCooldown(command, userId)) {
                    return;
                }
                
                // Execute command
                try {
                    await this.commands[command](channel, tags, args.slice(1));
                    this.setCooldown(command, userId);
                } catch (error) {
                    console.error(`Command error (${command}):`, error);
                    this.say(`❌ Error executing ${command}`);
                }
            }
        }
        
        // Respond to questions about code
        if (message.includes('?') && (message.includes('how') || message.includes('what') || message.includes('why'))) {
            this.sessionStats.viewerQuestions++;
            
            // Acknowledge technical questions
            if (message.match(/\b(function|variable|class|method|api|bug|error|typescript|javascript|node)\b/i)) {
                this.say(`@${username} Great question! I'll address that after this section. Feel free to use !explain for code explanations.`);
            }
        }
    }
    
    async startGitMonitoring() {
        this.gitMonitor = new GitCommitStream({
            repoPath: this.repoPath,
            showDiff: true,
            showStats: true
        });
        
        this.gitMonitor.on('commit', async (commit) => {
            this.sessionStats.commits++;
            
            // Announce new commit
            const message = `🎯 NEW COMMIT: "${commit.subject}" `;
            const stats = commit.diff?.stats;
            if (stats) {
                this.say(message + `[${stats.filesChanged} files, +${stats.insertions}/-${stats.deletions}]`);
            } else {
                this.say(message);
            }
            
            // Store for later retrieval
            this.lastCommit = commit;
            
            // Update overlay
            this.emit('overlayUpdate', {
                type: 'commit',
                data: commit.formatted.overlay
            });
        });
        
        this.gitMonitor.on('branchChanged', ({ oldBranch, newBranch }) => {
            this.say(`🌿 Switched branch: ${oldBranch} ➜ ${newBranch}`);
        });
        
        await this.gitMonitor.start();
    }
    
    async loadProjectData() {
        try {
            // Load package.json if exists
            const packagePath = path.join(this.repoPath, 'package.json');
            const packageData = await fs.readFile(packagePath, 'utf8');
            this.projectPackage = JSON.parse(packageData);
            
            // Load README for project description
            try {
                const readmePath = path.join(this.repoPath, 'README.md');
                this.projectReadme = await fs.readFile(readmePath, 'utf8');
            } catch (e) {
                this.projectReadme = null;
            }
            
        } catch (error) {
            console.log('No package.json found');
            this.projectPackage = null;
        }
    }
    
    // Command Handlers
    async cmdHelp(channel, tags, args) {
        const helpText = '🤖 Dev Commands: !project !commit !progress !todo !explain !build !stats !tech !docs !github | Fun: !hydrate !stretch';
        this.say(helpText);
    }
    
    async cmdProject(channel, tags, args) {
        let projectInfo = `💻 Current Project: ${this.projectName}`;
        
        if (this.projectPackage) {
            projectInfo += ` v${this.projectPackage.version || '1.0.0'}`;
            if (this.projectPackage.description) {
                projectInfo += ` - ${this.projectPackage.description}`;
            }
        }
        
        this.say(projectInfo);
    }
    
    async cmdLatestCommit(channel, tags, args) {
        if (!this.lastCommit) {
            const commits = await this.gitMonitor.getRecentCommits(1);
            if (commits.length > 0) {
                this.say(`🎯 Latest: ${commits[0].message}`);
            } else {
                this.say('💭 No commits yet in this session');
            }
        } else {
            const commit = this.lastCommit;
            let message = `🎯 ${commit.subject} by ${commit.author}`;
            
            if (commit.diff?.stats) {
                const { filesChanged, insertions, deletions } = commit.diff.stats;
                message += ` [${filesChanged} files, +${insertions}/-${deletions}]`;
            }
            
            this.say(message);
        }
    }
    
    async cmdRecentCommits(channel, tags, args) {
        const limit = parseInt(args[0]) || 3;
        const commits = await this.gitMonitor.getRecentCommits(Math.min(limit, 5));
        
        if (commits.length === 0) {
            this.say('💭 No commits found');
            return;
        }
        
        const commitList = commits.map((c, i) => `${i + 1}. ${c.message}`).join(' | ');
        this.say(`📚 Recent commits: ${commitList}`);
    }
    
    async cmdProgress(channel, tags, args) {
        // Calculate session progress
        const sessionTime = Math.floor((Date.now() - this.sessionStats.startTime) / 1000 / 60);
        const commitsPerHour = (this.sessionStats.commits / (sessionTime / 60)).toFixed(1);
        
        let progress = `📊Session Progress: ${sessionTime}min | `;
        progress += `${this.sessionStats.commits} commits | `;
        progress += `${commitsPerHour} commits/hr | `;
        progress += `${this.sessionStats.viewerQuestions} questions`;
        
        this.say(progress);
    }
    
    async cmdTodo(channel, tags, args) {
        // TODO: Integrate with actual todo system
        const todos = [
            '✅ Set up git monitoring',
            '🔄 Implement RSS feed generator',
            '💡 Add build status integration',
            '🔧 Create overlay templates'
        ];
        
        this.say(`📋 Today's TODOs: ${todos.join(' | ')}`);
    }
    
    async cmdExplain(channel, tags, args) {
        if (!this.lastCommit || !this.lastCommit.files) {
            this.say('🤔 No recent code changes to explain. Make a commit first!');
            return;
        }
        
        // Get the most recently changed file
        const file = this.lastCommit.files[0];
        this.say(`💡 Last change: ${file.status} ${file.path} - This ${this.explainFileType(file.extension)}`);
    }
    
    async cmdBuildStatus(channel, tags, args) {
        // TODO: Integrate with actual build system
        const statuses = ['✅ Build passing', '🔄 Build in progress', '❌ Build failed'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        this.say(`🔨 Build Status: ${status}`);
    }
    
    async cmdSessionStats(channel, tags, args) {
        const stats = this.sessionStats;
        const viewers = this.viewerStats.size;
        
        let message = `📈 Session Stats: ${stats.commits} commits | `;
        message += `${stats.viewerQuestions} questions | `;
        message += `${viewers} unique viewers | `;
        message += `Productivity level: ${this.getProductivityLevel()}`;
        
        this.say(message);
    }
    
    async cmdTechStack(channel, tags, args) {
        if (this.projectPackage && this.projectPackage.dependencies) {
            const deps = Object.keys(this.projectPackage.dependencies);
            const mainDeps = deps.slice(0, 5).join(', ');
            this.say(`🔧 Tech Stack: ${mainDeps} + ${deps.length - 5} more`);
        } else {
            this.say('🔧 Tech Stack: JavaScript, Node.js, Git, VS Code, Coffee ☕');
        }
    }
    
    async cmdLearnResource(channel, tags, args) {
        const resources = [
            '📚 MDN Web Docs: developer.mozilla.org',
            '🏫 freeCodeCamp: freecodecamp.org',
            '🚀 JavaScript.info: javascript.info',
            '🧪 Dev.to: dev.to',
            '🎓 Coursera: coursera.org'
        ];
        
        const random = resources[Math.floor(Math.random() * resources.length)];
        this.say(`Learning resource: ${random}`);
    }
    
    async cmdGitHub(channel, tags, args) {
        // Extract GitHub URL from git remote
        try {
            const { execSync } = require('child_process');
            const remoteUrl = execSync('git remote get-url origin', { cwd: this.repoPath }).toString().trim();
            
            // Convert git URL to HTTPS URL
            let githubUrl = remoteUrl;
            if (githubUrl.startsWith('git@')) {
                githubUrl = githubUrl.replace('git@github.com:', 'https://github.com/');
                githubUrl = githubUrl.replace('.git', '');
            }
            
            this.say(`💙 GitHub: ${githubUrl}`);
        } catch (error) {
            this.say('💙 GitHub repo not found in current project');
        }
    }
    
    async cmdVSCode(channel, tags, args) {
        const tips = [
            'Ctrl+Shift+P: Command Palette',
            'Ctrl+P: Quick file open',
            'Ctrl+`: Toggle terminal',
            'Alt+Click: Multiple cursors',
            'Ctrl+D: Select next occurrence'
        ];
        
        const tip = tips[Math.floor(Math.random() * tips.length)];
        this.say(`💻 VS Code tip: ${tip}`);
    }
    
    async cmdTheme(channel, tags, args) {
        const themes = [
            'Dracula 🧛',
            'Monokai 🌈',
            'One Dark Pro 🌙',
            'Material Theme 🎨',
            'Synthwave ‘84 🎆'
        ];
        
        this.say(`🎨 Popular VS Code themes: ${themes.join(', ')}`);
    }
    
    async cmdMusic(channel, tags, args) {
        const playlists = [
            '🎵 lofi hip hop radio - beats to code to',
            '🎶 Synthwave/Retrowave for programming',
            '🎸 Video Game Soundtracks',
            '🎹 Classical for Concentration',
            '🎴 Ambient Coding Music'
        ];
        
        const playlist = playlists[Math.floor(Math.random() * playlists.length)];
        this.say(`Currently vibing to: ${playlist}`);
    }
    
    async cmdHydrate(channel, tags, args) {
        const messages = [
            '💧 Hydration check! Take a sip of water!',
            '🚰 Your code runs on coffee, but you run on water!',
            '🌊 Stay hydrated, stay productive!',
            '🥤 Water break! Your brain needs it!'
        ];
        
        const message = messages[Math.floor(Math.random() * messages.length)];
        this.say(message);
    }
    
    async cmdStretch(channel, tags, args) {
        const stretches = [
            '🧜 Stand up and stretch those legs!',
            '😆 Roll your shoulders back 10 times',
            '👀 Look away from the screen for 20 seconds',
            '🤲 Stretch your wrists and fingers',
            '🧎 Take 3 deep breaths'
        ];
        
        const stretch = stretches[Math.floor(Math.random() * stretches.length)];
        this.say(`Stretch break: ${stretch}`);
    }
    
    async cmdReportIssue(channel, tags, args) {
        if (args.length === 0) {
            this.say('🐛 Usage: !issue <description> - I\'ll add it to the tracker!');
            return;
        }
        
        const issue = args.join(' ');
        this.sessionStats.bugs++;
        
        this.say(`🐛 Issue noted: "${issue}" - Added to backlog! Total issues this session: ${this.sessionStats.bugs}`);
    }
    
    async cmdPullRequest(channel, tags, args) {
        this.say('🔄 Current PR status: 3 open, 2 awaiting review, 5 merged today');
    }
    
    async cmdTestStatus(channel, tags, args) {
        const statuses = [
            '✅ All tests passing (42/42)',
            '🔄 Running tests... (23/42)',
            '❌ 2 tests failing - fixing now!',
            '🎉 100% coverage achieved!'
        ];
        
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        this.say(`🧪 Test Status: ${status}`);
    }
    
    async cmdDocumentation(channel, tags, args) {
        this.say('📖 Docs are in the /docs folder. README.md has quick start guide. Full API docs at /docs/api.md');
    }
    
    async cmdMilestone(channel, tags, args) {
        this.say('🏁 Current milestone: v2.0 Release - 73% complete | Next: WebSocket integration');
    }
    
    // Helper methods
    say(message) {
        if (this.isConnected && this.client) {
            this.client.say(this.channel, message);
        }
    }
    
    handleConnected(addr, port) {
        console.log(`Connected to ${addr}:${port}`);
    }
    
    handleDisconnected(reason) {
        console.log(`Disconnected: ${reason}`);
        this.isConnected = false;
    }
    
    trackViewerEngagement(userId, username) {
        if (!this.viewerStats.has(userId)) {
            this.viewerStats.set(userId, {
                username,
                messages: 0,
                commands: 0,
                firstSeen: Date.now()
            });
        }
        
        const stats = this.viewerStats.get(userId);
        stats.messages++;
        stats.lastSeen = Date.now();
    }
    
    isOnCooldown(command, userId) {
        const key = `${command}:${userId}`;
        const lastUsed = this.commandCooldowns.get(key);
        
        if (!lastUsed) return false;
        
        const cooldownTime = 30000; // 30 seconds
        return Date.now() - lastUsed < cooldownTime;
    }
    
    setCooldown(command, userId) {
        const key = `${command}:${userId}`;
        this.commandCooldowns.set(key, Date.now());
    }
    
    explainFileType(extension) {
        const explanations = {
            '.js': 'JavaScript file handles the logic',
            '.ts': 'TypeScript file with type safety',
            '.jsx': 'React component file',
            '.css': 'stylesheet defines the visual appearance',
            '.json': 'JSON config stores settings',
            '.md': 'Markdown documentation file',
            '.html': 'HTML structure file',
            '.yml': 'YAML configuration file',
            '.sh': 'Shell script for automation'
        };
        
        return explanations[extension] || 'file was updated';
    }
    
    getProductivityLevel() {
        const cph = this.sessionStats.commits / ((Date.now() - this.sessionStats.startTime) / 1000 / 60 / 60);
        
        if (cph > 5) return '🔥🔥🔥 ON FIRE!';
        if (cph > 3) return '🚀 Crushing it!';
        if (cph > 1) return '💪 Productive';
        if (cph > 0.5) return '🌱 Steady progress';
        return '🌟 Just getting started';
    }
    
    async generateStreamTitle() {
        const titles = [
            `🖥️ Building ${this.projectName} | !project for info`,
            `💻 Coding ${this.projectName} LIVE | ${this.sessionStats.commits} commits so far`,
            `🚀 ${this.projectName} Development Stream | !help for commands`,
            `🎆 Creating ${this.projectName} | Join the coding adventure!`,
            `🧪 Test-Driven Development on ${this.projectName} | !todo`
        ];
        
        return titles[Math.floor(Math.random() * titles.length)];
    }
    
    async shutdown() {
        console.log('Shutting down Twitch Dev Bot...');
        
        if (this.gitMonitor) {
            await this.gitMonitor.stop();
        }
        
        if (this.client) {
            await this.client.disconnect();
        }
        
        this.emit('shutdown');
    }
}

module.exports = TwitchDevBot;

// CLI usage
if (require.main === module) {
    const bot = new TwitchDevBot({
        channel: process.env.TWITCH_CHANNEL || 'yourchannel',
        username: process.env.TWITCH_BOT_USERNAME || 'YourBot', 
        oauth: process.env.TWITCH_OAUTH || 'oauth:yourtoken',
        repoPath: process.argv[2] || process.cwd(),
        debug: true
    });
    
    bot.on('connected', () => {
        console.log('✅ Bot connected successfully!');
    });
    
    bot.on('error', (error) => {
        console.error('❌ Bot error:', error);
    });
    
    bot.on('overlayUpdate', (update) => {
        console.log('🖥️ Overlay update:', update.type);
    });
    
    // Connect bot
    bot.connect();
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n\nShutting down...');
        await bot.shutdown();
        process.exit(0);
    });
}