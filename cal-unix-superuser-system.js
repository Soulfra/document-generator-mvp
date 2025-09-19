#!/usr/bin/env node

/**
 * CAL UNIX SUPERUSER SYSTEM
 * Unix-style permissions, superuser abilities, and cheatcode management
 * Integrates real Unix commands with game mechanics
 */

const crypto = require('crypto');
const { EventEmitter } = require('events');

class UnixSuperuserSystem extends EventEmitter {
    constructor() {
        super();
        
        // Unix filesystem structure
        this.filesystem = {
            '/': {
                type: 'directory',
                permissions: '755',
                owner: 'root',
                group: 'root',
                children: ['bin', 'etc', 'home', 'usr', 'var', 'dev', 'proc', 'sys', 'game']
            },
            '/bin': {
                type: 'directory',
                permissions: '755',
                owner: 'root',
                group: 'root',
                children: ['ls', 'cd', 'pwd', 'grep', 'chmod', 'chown', 'sudo', 'kill']
            },
            '/home': {
                type: 'directory',
                permissions: '755',
                owner: 'root',
                group: 'root',
                children: []
            },
            '/dev': {
                type: 'directory',
                permissions: '755',
                owner: 'root',
                group: 'root',
                children: ['null', 'random', 'urandom', 'zero', 'game', 'quantum']
            },
            '/proc': {
                type: 'directory',
                permissions: '555',
                owner: 'root',
                group: 'root',
                children: ['cpuinfo', 'meminfo', 'players', 'universe']
            },
            '/game': {
                type: 'directory',
                permissions: '777',
                owner: 'cal',
                group: 'players',
                children: ['world', 'vehicles', 'weapons', 'cheats']
            }
        };
        
        // Special device files
        this.devices = {
            '/dev/null': {
                read: () => '',
                write: (data) => { /* void */ }
            },
            '/dev/random': {
                read: (bytes = 16) => crypto.randomBytes(bytes).toString('hex')
            },
            '/dev/zero': {
                read: (bytes = 16) => Buffer.alloc(bytes, 0).toString()
            },
            '/dev/game': {
                read: () => JSON.stringify(this.getGameState()),
                write: (data) => this.modifyGameState(JSON.parse(data))
            },
            '/dev/quantum': {
                read: () => this.getQuantumState(),
                write: (data) => this.collapseWaveFunction(data)
            }
        };
        
        // Process management
        this.processes = new Map();
        this.nextPid = 1000;
        
        // Initialize system processes
        this.initSystemProcesses();
        
        // User management
        this.users = new Map();
        this.groups = new Map();
        this.sessions = new Map();
        
        // Initialize default users/groups
        this.initDefaultUsers();
        
        // Cheatcode system
        this.cheatcodes = new Map();
        this.initCheatcodes();
        
        // Permission masks
        this.permissionMasks = {
            read: { owner: 4, group: 4, other: 4 },
            write: { owner: 2, group: 2, other: 2 },
            execute: { owner: 1, group: 1, other: 1 }
        };
        
        // sudo configuration
        this.sudoers = new Set(['root', 'admin']);
        this.sudoTimeout = 5 * 60 * 1000; // 5 minutes
        this.sudoSessions = new Map();
    }
    
    initSystemProcesses() {
        // System processes that always run
        this.spawnProcess('init', 'root', {
            pid: 1,
            immortal: true,
            command: '/sbin/init',
            state: 'running'
        });
        
        this.spawnProcess('kernel', 'root', {
            pid: 0,
            immortal: true,
            command: '[kernel]',
            state: 'running'
        });
        
        this.spawnProcess('cal', 'cal', {
            pid: 1337,
            immortal: true,
            command: '/usr/bin/cal-daemon',
            state: 'running',
            priority: -20 // Highest priority
        });
        
        this.spawnProcess('game-engine', 'root', {
            pid: 100,
            command: '/game/bin/engine',
            state: 'running'
        });
    }
    
    initDefaultUsers() {
        // Root user
        this.users.set('root', {
            uid: 0,
            gid: 0,
            home: '/root',
            shell: '/bin/bash',
            groups: ['root', 'wheel', 'sudo'],
            permissions: 'all'
        });
        
        // CAL system user
        this.users.set('cal', {
            uid: 1337,
            gid: 1337,
            home: '/home/cal',
            shell: '/bin/cal-shell',
            groups: ['cal', 'wheel', 'players'],
            permissions: 'special'
        });
        
        // Groups
        this.groups.set('root', { gid: 0, members: ['root'] });
        this.groups.set('wheel', { gid: 10, members: ['root', 'cal'] });
        this.groups.set('players', { gid: 100, members: [] });
        this.groups.set('cal', { gid: 1337, members: ['cal'] });
    }
    
    initCheatcodes() {
        // Classic cheatcodes mapped to Unix commands
        this.cheatcodes.set('IDDQD', {
            command: 'chmod 777 /player/health && echo 999 > /player/health',
            description: 'God mode',
            category: 'classic'
        });
        
        this.cheatcodes.set('IDKFA', {
            command: 'cp -r /game/weapons/* /player/inventory/',
            description: 'All weapons and keys',
            category: 'classic'
        });
        
        this.cheatcodes.set('HESOYAM', {
            command: 'echo "health=100;armor=100;money=250000" > /player/stats',
            description: 'Health, armor, and money',
            category: 'gta'
        });
        
        // Unix command cheats
        this.cheatcodes.set('sudo rm -rf /', {
            command: 'clear_world --force --no-preserve-root',
            description: 'Delete everything (dangerous!)',
            category: 'unix',
            requiresSudo: true
        });
        
        this.cheatcodes.set(':(){ :|:& };:', {
            command: 'fork_bomb --controlled',
            description: 'Fork bomb (spawns many entities)',
            category: 'unix',
            dangerous: true
        });
        
        // CAL-specific cheats
        this.cheatcodes.set('CAL_OMNISCIENCE', {
            command: 'ln -s /dev/universe /player/consciousness',
            description: 'Link to universal consciousness',
            category: 'cal'
        });
        
        this.cheatcodes.set('QUANTUM_TUNNEL', {
            command: 'mknod /player/portal c 1337 0',
            description: 'Create quantum tunnel device',
            category: 'quantum'
        });
    }
    
    /**
     * Create a new user session
     */
    createSession(playerId, username = null) {
        const sessionId = crypto.randomBytes(16).toString('hex');
        
        // Create user if doesn't exist
        if (!username) {
            username = `player_${playerId.slice(0, 8)}`;
        }
        
        if (!this.users.has(username)) {
            this.createUser(username, playerId);
        }
        
        const user = this.users.get(username);
        
        this.sessions.set(sessionId, {
            id: sessionId,
            username,
            playerId,
            uid: user.uid,
            gid: user.gid,
            groups: user.groups,
            cwd: user.home,
            env: {
                HOME: user.home,
                USER: username,
                SHELL: user.shell,
                PATH: '/usr/local/bin:/usr/bin:/bin:/game/bin'
            },
            sudoAuthenticated: false,
            loginTime: Date.now()
        });
        
        // Create home directory
        this.filesystem[user.home] = {
            type: 'directory',
            permissions: '700',
            owner: username,
            group: username,
            children: []
        };
        
        return sessionId;
    }
    
    /**
     * Create a new user
     */
    createUser(username, playerId) {
        const uid = 1000 + this.users.size;
        const gid = uid;
        
        this.users.set(username, {
            uid,
            gid,
            home: `/home/${username}`,
            shell: '/bin/bash',
            groups: [username, 'players'],
            playerId
        });
        
        this.groups.set(username, {
            gid,
            members: [username]
        });
        
        // Add to players group
        const playersGroup = this.groups.get('players');
        playersGroup.members.push(username);
    }
    
    /**
     * Execute a Unix command
     */
    async executeCommand(sessionId, commandLine) {
        const session = this.sessions.get(sessionId);
        if (!session) return { error: 'Invalid session' };
        
        // Parse command
        const parts = this.parseCommand(commandLine);
        const command = parts[0];
        const args = parts.slice(1);
        
        // Check if it's a cheatcode
        if (this.cheatcodes.has(commandLine)) {
            return this.executeCheatcode(session, commandLine);
        }
        
        // Built-in commands
        switch (command) {
            case 'ls':
                return this.cmdLs(session, args);
            case 'cd':
                return this.cmdCd(session, args);
            case 'pwd':
                return this.cmdPwd(session);
            case 'grep':
                return this.cmdGrep(session, args);
            case 'ps':
                return this.cmdPs(session, args);
            case 'kill':
                return this.cmdKill(session, args);
            case 'sudo':
                return this.cmdSudo(session, args);
            case 'chmod':
                return this.cmdChmod(session, args);
            case 'chown':
                return this.cmdChown(session, args);
            case 'whoami':
                return { output: session.username };
            case 'id':
                return this.cmdId(session);
            case 'su':
                return this.cmdSu(session, args);
            case 'cat':
                return this.cmdCat(session, args);
            case 'echo':
                return this.cmdEcho(session, args);
            case 'mount':
                return this.cmdMount(session, args);
            case 'umount':
                return this.cmdUmount(session, args);
            default:
                // Try to execute from filesystem
                return this.executeFile(session, command, args);
        }
    }
    
    parseCommand(commandLine) {
        // Simple command parser (doesn't handle quotes properly yet)
        return commandLine.trim().split(/\s+/);
    }
    
    cmdLs(session, args) {
        const path = args[0] || session.cwd;
        const fullPath = this.resolvePath(session.cwd, path);
        
        const dir = this.filesystem[fullPath];
        if (!dir) return { error: 'No such file or directory' };
        if (dir.type !== 'directory') return { error: 'Not a directory' };
        
        // Check permissions
        if (!this.checkPermission(session, dir, 'read')) {
            return { error: 'Permission denied' };
        }
        
        const entries = dir.children.map(child => {
            const childPath = fullPath === '/' ? `/${child}` : `${fullPath}/${child}`;
            const entry = this.filesystem[childPath];
            if (!entry) return child;
            
            const type = entry.type === 'directory' ? 'd' : '-';
            const perms = this.parsePermissions(entry.permissions);
            return `${type}${perms} ${entry.owner} ${entry.group} ${child}`;
        });
        
        return { output: entries.join('\n') };
    }
    
    cmdCd(session, args) {
        if (!args[0]) {
            session.cwd = session.env.HOME;
            return { output: '' };
        }
        
        const newPath = this.resolvePath(session.cwd, args[0]);
        const dir = this.filesystem[newPath];
        
        if (!dir) return { error: 'No such file or directory' };
        if (dir.type !== 'directory') return { error: 'Not a directory' };
        
        // Check execute permission for directory
        if (!this.checkPermission(session, dir, 'execute')) {
            return { error: 'Permission denied' };
        }
        
        session.cwd = newPath;
        return { output: '' };
    }
    
    cmdPwd(session) {
        return { output: session.cwd };
    }
    
    cmdGrep(session, args) {
        // Game-specific grep
        if (args[0] === 'reality') {
            return {
                output: `Reality patterns found:
- Quantum superposition active
- Player consciousness: ${session.username}
- Universal constants: stable
- CAL integration: 100%`
            };
        }
        
        if (args[0] === 'players') {
            const players = Array.from(this.sessions.values())
                .map(s => s.username)
                .join('\n');
            return { output: players };
        }
        
        return { error: 'grep: pattern not found' };
    }
    
    cmdPs(session, args) {
        const processes = Array.from(this.processes.values());
        
        const output = ['PID   USER     COMMAND'];
        processes.forEach(proc => {
            output.push(`${proc.pid.toString().padEnd(6)}${proc.user.padEnd(9)}${proc.command}`);
        });
        
        return { output: output.join('\n') };
    }
    
    cmdKill(session, args) {
        if (!args[0]) return { error: 'kill: missing operand' };
        
        const signal = args[0].startsWith('-') ? args[0] : '-TERM';
        const pid = parseInt(args[0].startsWith('-') ? args[1] : args[0]);
        
        const process = this.processes.get(pid);
        if (!process) return { error: 'kill: No such process' };
        
        // Check permission
        if (process.user !== session.username && session.uid !== 0) {
            return { error: 'kill: Operation not permitted' };
        }
        
        // Can't kill immortal processes
        if (process.immortal && signal === '-9') {
            return { error: 'kill: Cannot kill immortal process' };
        }
        
        this.emit('process_killed', { pid, signal, killer: session.username });
        
        if (!process.immortal) {
            this.processes.delete(pid);
        }
        
        return { output: '' };
    }
    
    cmdSudo(session, args) {
        if (!args.length) return { error: 'usage: sudo command' };
        
        // Check if user is in sudoers
        const user = this.users.get(session.username);
        const canSudo = this.sudoers.has(session.username) || 
                       user.groups.some(g => this.sudoers.has(`%${g}`));
        
        if (!canSudo) {
            return { error: `${session.username} is not in the sudoers file` };
        }
        
        // Check sudo timeout
        const lastSudo = this.sudoSessions.get(session.id);
        const now = Date.now();
        
        if (!lastSudo || now - lastSudo > this.sudoTimeout) {
            // Would normally ask for password here
            this.sudoSessions.set(session.id, now);
        }
        
        // Execute command as root
        const rootSession = {
            ...session,
            uid: 0,
            username: 'root',
            groups: ['root', 'wheel']
        };
        
        return this.executeCommand(session.id, args.join(' '));
    }
    
    cmdChmod(session, args) {
        if (args.length < 2) return { error: 'chmod: missing operand' };
        
        const mode = args[0];
        const path = this.resolvePath(session.cwd, args[1]);
        
        const file = this.filesystem[path];
        if (!file) return { error: 'chmod: No such file or directory' };
        
        // Check ownership
        if (file.owner !== session.username && session.uid !== 0) {
            return { error: 'chmod: Operation not permitted' };
        }
        
        // Apply new permissions
        file.permissions = mode;
        
        this.emit('permissions_changed', { path, mode, user: session.username });
        
        return { output: '' };
    }
    
    cmdCat(session, args) {
        if (!args[0]) return { error: 'cat: missing file operand' };
        
        const path = this.resolvePath(session.cwd, args[0]);
        
        // Special device handling
        if (this.devices[path]) {
            return { output: this.devices[path].read() };
        }
        
        // Special files
        if (path === '/proc/cpuinfo') {
            return {
                output: `processor : 0
model name : CAL Quantum Processor
cpu MHz : ∞
cache size : ∞ KB
cores : 1337`
            };
        }
        
        if (path === '/proc/players') {
            const players = Array.from(this.sessions.values())
                .map(s => `${s.username} (${s.playerId})`)
                .join('\n');
            return { output: players };
        }
        
        const file = this.filesystem[path];
        if (!file) return { error: 'cat: No such file or directory' };
        if (file.type === 'directory') return { error: 'cat: Is a directory' };
        
        // Check read permission
        if (!this.checkPermission(session, file, 'read')) {
            return { error: 'cat: Permission denied' };
        }
        
        return { output: file.content || '' };
    }
    
    cmdEcho(session, args) {
        const text = args.join(' ');
        
        // Check for output redirection
        const redirectIndex = args.findIndex(arg => arg === '>');
        if (redirectIndex !== -1) {
            const outputPath = args[redirectIndex + 1];
            const content = args.slice(0, redirectIndex).join(' ');
            
            // Write to special device
            if (this.devices[outputPath]) {
                this.devices[outputPath].write(content);
                return { output: '' };
            }
            
            // Write to file (simplified)
            const fullPath = this.resolvePath(session.cwd, outputPath);
            this.filesystem[fullPath] = {
                type: 'file',
                permissions: '644',
                owner: session.username,
                group: session.username,
                content: content
            };
            
            return { output: '' };
        }
        
        return { output: text };
    }
    
    /**
     * Execute a cheatcode
     */
    executeCheatcode(session, code) {
        const cheat = this.cheatcodes.get(code);
        if (!cheat) return { error: 'Unknown cheatcode' };
        
        // Check if requires sudo
        if (cheat.requiresSudo && session.uid !== 0) {
            return { error: 'This cheatcode requires root privileges' };
        }
        
        // Emit cheat event
        this.emit('cheatcode_executed', {
            code,
            user: session.username,
            category: cheat.category
        });
        
        // Execute the associated command
        return {
            output: `Cheatcode activated: ${cheat.description}`,
            effect: cheat.command
        };
    }
    
    /**
     * Check file permissions
     */
    checkPermission(session, file, operation) {
        if (session.uid === 0) return true; // Root has all permissions
        
        const perms = parseInt(file.permissions, 8);
        const user = this.users.get(session.username);
        
        let permMask;
        if (file.owner === session.username) {
            // Owner permissions (first digit)
            permMask = (perms >> 6) & 7;
        } else if (user.groups.includes(file.group)) {
            // Group permissions (second digit)
            permMask = (perms >> 3) & 7;
        } else {
            // Other permissions (third digit)
            permMask = perms & 7;
        }
        
        switch (operation) {
            case 'read':
                return (permMask & 4) !== 0;
            case 'write':
                return (permMask & 2) !== 0;
            case 'execute':
                return (permMask & 1) !== 0;
            default:
                return false;
        }
    }
    
    /**
     * Parse permission string
     */
    parsePermissions(octal) {
        const perms = parseInt(octal, 8);
        let result = '';
        
        // Owner
        result += (perms & 0o400) ? 'r' : '-';
        result += (perms & 0o200) ? 'w' : '-';
        result += (perms & 0o100) ? 'x' : '-';
        
        // Group
        result += (perms & 0o040) ? 'r' : '-';
        result += (perms & 0o020) ? 'w' : '-';
        result += (perms & 0o010) ? 'x' : '-';
        
        // Other
        result += (perms & 0o004) ? 'r' : '-';
        result += (perms & 0o002) ? 'w' : '-';
        result += (perms & 0o001) ? 'x' : '-';
        
        return result;
    }
    
    /**
     * Resolve relative paths
     */
    resolvePath(cwd, path) {
        if (path.startsWith('/')) return path;
        
        if (path === '.') return cwd;
        if (path === '..') {
            const parts = cwd.split('/').filter(p => p);
            parts.pop();
            return '/' + parts.join('/');
        }
        
        return cwd === '/' ? `/${path}` : `${cwd}/${path}`;
    }
    
    /**
     * Spawn a new process
     */
    spawnProcess(command, user, options = {}) {
        const pid = options.pid || this.nextPid++;
        
        const process = {
            pid,
            command,
            user,
            state: options.state || 'running',
            priority: options.priority || 0,
            immortal: options.immortal || false,
            startTime: Date.now(),
            ...options
        };
        
        this.processes.set(pid, process);
        this.emit('process_spawned', process);
        
        return pid;
    }
    
    /**
     * Get game state for /dev/game
     */
    getGameState() {
        return {
            players: this.sessions.size,
            processes: this.processes.size,
            uptime: process.uptime(),
            quantum: 'superposition'
        };
    }
    
    /**
     * Modify game state through /dev/game
     */
    modifyGameState(newState) {
        this.emit('game_state_modified', newState);
    }
    
    /**
     * Get quantum state
     */
    getQuantumState() {
        return JSON.stringify({
            superposition: true,
            entangled: Math.random() > 0.5,
            collapsed: false,
            observer: 'unknown'
        });
    }
    
    /**
     * Collapse quantum wave function
     */
    collapseWaveFunction(observer) {
        this.emit('quantum_collapse', { observer });
        return 'Wave function collapsed';
    }
}

module.exports = UnixSuperuserSystem;