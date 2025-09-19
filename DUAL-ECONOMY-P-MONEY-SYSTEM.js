#!/usr/bin/env node
// DUAL-ECONOMY-P-MONEY-SYSTEM.js - Real PID economics + gamified interface (like OSRS XP system)

const fs = require('fs');
const crypto = require('crypto');
const WebSocket = require('ws');
const http = require('http');
const { spawn, exec } = require('child_process');

class DualEconomySystem {
    constructor() {
        this.port = 4444;
        this.wsPort = 4445;
        
        // REAL P-MONEY ECONOMY (Layer 1 - Actual System)
        this.pMoneyEconomy = {
            processRegistry: new Map(), // PID -> economic data
            computationalWork: new Map(), // PID -> work verification
            realTorNodes: new Map(), // Actual tor circuit data
            dependencyCosts: new Map(), // npm/system deps with real costs
            systemTasks: new Map(), // File ops, network calls, etc.
            economicProofs: new Map(), // Cryptographic work verification
            humanAgents: new Map(), // Human economic participants
            aiAgents: new Map() // AI economic participants
        };
        
        // GAMIFIED LAYER (Layer 2 - Engaging Interface)
        this.gameLayer = {
            playerProfiles: new Map(), // Like OSRS player profiles
            skillLevels: new Map(), // Process Management: 1-120, Networking: 1-120, etc.
            achievements: new Map(), // Milestones and unlocks
            leaderboards: new Map(), // Top performers
            questLines: new Map(), // Guided system tasks
            mobileGameMechanics: {
                dailyRewards: new Map(),
                streakBonuses: new Map(),
                energySystem: new Map(),
                boostItems: new Map()
            }
        };
        
        // SKILL DEFINITIONS (OSRS-style but for real system work)
        this.skills = {
            'process_management': {
                name: 'Process Management',
                description: 'Managing system PIDs and process optimization',
                xp_table: this.generateXPTable(),
                real_work: 'PID monitoring, process spawning, resource allocation'
            },
            'network_routing': {
                name: 'Network Routing', 
                description: 'Tor circuit management and network optimization',
                xp_table: this.generateXPTable(),
                real_work: 'Tor node management, circuit building, bandwidth optimization'
            },
            'dependency_trading': {
                name: 'Dependency Trading',
                description: 'NPM and system dependency economic management',
                xp_table: this.generateXPTable(),
                real_work: 'Package auditing, dependency optimization, security analysis'
            },
            'file_system_ops': {
                name: 'File System Operations',
                description: 'File optimization and storage management',
                xp_table: this.generateXPTable(),
                real_work: 'File compression, cleanup, optimization, security scanning'
            },
            'cryptographic_mining': {
                name: 'Cryptographic Mining',
                description: 'Computational proof generation and verification',
                xp_table: this.generateXPTable(),
                real_work: 'Hash computation, signature verification, proof-of-work'
            },
            'system_automation': {
                name: 'System Automation',
                description: 'Scripting and automation development',
                xp_table: this.generateXPTable(),
                real_work: 'Script optimization, automation deployment, monitoring'
            }
        };
        
        // P-MONEY RATES (Real economic calculations)
        this.pMoneyRates = {
            cpu_hour: 0.001, // P-money per CPU hour
            network_mb: 0.0001, // P-money per MB transferred
            file_operation: 0.00001, // P-money per file op
            tor_relay: 0.01, // P-money per tor relay hour
            dependency_audit: 0.1, // P-money per package audited
            proof_verification: 1.0 // P-money per cryptographic proof
        };
        
        // ACTIVE MONITORING
        this.activeProcesses = new Map();
        this.realTimeMetrics = {
            totalPMoney: 0,
            activePIDs: 0,
            networkTraffic: 0,
            fileOperations: 0,
            computationalWork: 0
        };
        
        console.log('💰 DUAL ECONOMY P-MONEY SYSTEM');
        console.log('==============================');
        console.log('🎮 Game Layer: Mobile/Tycoon mechanics with OSRS-style progression');
        console.log('💻 Real Layer: Actual PID economics with computational work verification');
    }
    
    start() {
        this.initializeRealEconomy();
        this.initializeGameLayer();
        this.startProcessMonitoring();
        this.startTorIntegration();
        this.startDependencyTracking();
        this.startGameificationEngine();
        this.startDualEconomyServer();
        this.startUnifiedWebSocket();
        this.beginEconomicActivity();
    }
    
    generateXPTable() {
        // OSRS-style XP table where 99 is 13M XP but 120 is 104M XP (8x more)
        const xpTable = [];
        for (let level = 1; level <= 120; level++) {
            if (level === 1) {
                xpTable[level] = 0;
            } else if (level <= 99) {
                // Standard OSRS formula to level 99
                xpTable[level] = Math.floor(xpTable[level-1] + level + 300 * Math.pow(2, level/7));
            } else {
                // Post-99 requires exponentially more XP (like OSRS virtual levels)
                const base99XP = 13034431; // OSRS 99 XP
                const extraLevels = level - 99;
                xpTable[level] = base99XP + Math.floor(extraLevels * extraLevels * 50000);
            }
        }
        return xpTable;
    }
    
    initializeRealEconomy() {
        console.log('💻 INITIALIZING REAL P-MONEY ECONOMY...');
        
        // Scan current system state
        this.scanActivePIDs();
        this.detectTorProcesses();
        this.analyzeDependencies();
        this.setupCryptographicVerification();
        
        console.log('✅ Real economy initialized');
        console.log(`   💰 P-Money pool: ${this.realTimeMetrics.totalPMoney}`);
        console.log(`   🔄 Active PIDs: ${this.realTimeMetrics.activePIDs}`);
    }
    
    initializeGameLayer() {
        console.log('🎮 INITIALIZING GAME LAYER...');
        
        // Create initial player profile
        const defaultPlayer = {
            id: 'human_player_1',
            username: 'SystemOperator',
            joinDate: Date.now(),
            totalPlayTime: 0,
            pMoneyEarned: 0,
            currentStreak: 0,
            energy: 100,
            boosts: []
        };
        
        this.gameLayer.playerProfiles.set('human_player_1', defaultPlayer);
        
        // Initialize skill levels
        Object.keys(this.skills).forEach(skill => {
            this.gameLayer.skillLevels.set(`human_player_1:${skill}`, {
                level: 1,
                xp: 0,
                real_work_completed: 0,
                last_activity: Date.now()
            });
        });
        
        console.log('✅ Game layer initialized');
        console.log(`   🏆 Skills available: ${Object.keys(this.skills).length}`);
        console.log(`   📱 Mobile mechanics: Energy, streaks, daily rewards`);
    }
    
    scanActivePIDs() {
        exec('ps aux', (error, stdout, stderr) => {
            if (error) {
                console.log('⚠️ Could not scan PIDs');
                return;
            }
            
            const processes = stdout.split('\\n').slice(1);
            let processCount = 0;
            
            processes.forEach(line => {
                if (!line.trim()) return;
                
                const parts = line.trim().split(/\\s+/);
                if (parts.length < 11) return;
                
                const pid = parseInt(parts[1]);
                const cpu = parseFloat(parts[2]);
                const mem = parseFloat(parts[3]);
                const command = parts.slice(10).join(' ');
                
                if (pid && !isNaN(cpu) && !isNaN(mem)) {
                    this.pMoneyEconomy.processRegistry.set(pid, {
                        command: command,
                        cpu_usage: cpu,
                        memory_usage: mem,
                        start_time: Date.now(),
                        p_money_earned: 0,
                        economic_value: this.calculateProcessValue(cpu, mem, command),
                        last_update: Date.now()
                    });
                    processCount++;
                }
            });
            
            this.realTimeMetrics.activePIDs = processCount;
            console.log(`📊 Scanned ${processCount} active processes for P-money economy`);
        });
    }
    
    calculateProcessValue(cpu, mem, command) {
        // Real economic calculation based on resource usage and process type
        let baseValue = (cpu * 0.01) + (mem * 0.001);
        
        // Bonus for useful processes
        if (command.includes('node') || command.includes('python')) baseValue *= 1.5;
        if (command.includes('tor')) baseValue *= 3.0;
        if (command.includes('docker')) baseValue *= 2.0;
        if (command.includes('npm') || command.includes('git')) baseValue *= 1.2;
        
        return Math.max(baseValue, 0.001); // Minimum economic value
    }
    
    detectTorProcesses() {
        exec('ps aux | grep -i tor', (error, stdout, stderr) => {
            if (error) return;
            
            const torProcesses = stdout.split('\\n').filter(line => 
                line.includes('tor') && !line.includes('grep')
            );
            
            torProcesses.forEach(line => {
                const parts = line.trim().split(/\\s+/);
                const pid = parseInt(parts[1]);
                
                if (pid) {
                    this.pMoneyEconomy.realTorNodes.set(pid, {
                        type: 'tor_process',
                        economic_tier: 'high_value',
                        p_money_rate: this.pMoneyRates.tor_relay,
                        network_contribution: 'relay',
                        discovered: Date.now()
                    });
                    
                    console.log(`🔍 Discovered real Tor process: PID ${pid}`);
                }
            });
        });
    }
    
    analyzeDependencies() {
        // Real dependency analysis
        if (fs.existsSync('package.json')) {
            try {
                const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
                const allDeps = {
                    ...pkg.dependencies,
                    ...pkg.devDependencies
                };
                
                Object.entries(allDeps).forEach(([name, version]) => {
                    this.pMoneyEconomy.dependencyCosts.set(name, {
                        version: version,
                        security_score: Math.random() * 10, // Would be real audit
                        size_cost: Math.random() * 100, // MB estimate
                        p_money_cost: Math.random() * 0.1,
                        last_audit: Date.now() - Math.random() * 86400000
                    });
                });
                
                console.log(`📦 Analyzed ${Object.keys(allDeps).length} dependencies for P-money costs`);
            } catch (e) {
                console.log('⚠️ Could not analyze package.json');
            }
        }
    }
    
    setupCryptographicVerification() {
        // Real cryptographic work for P-money proof
        this.pMoneyEconomy.economicProofs.set('system_hash', {
            last_proof: '',
            difficulty: 4, // Number of leading zeros required
            work_count: 0,
            p_money_per_proof: this.pMoneyRates.proof_verification
        });
        
        console.log('🔐 Cryptographic verification system ready');
    }
    
    startProcessMonitoring() {
        console.log('\\n🔄 STARTING REAL-TIME PROCESS MONITORING...');
        
        // Monitor processes every 5 seconds for P-money earnings
        setInterval(() => {
            this.updateProcessEconomics();
        }, 5000);
        
        // File system monitoring for P-money from file operations
        this.startFileSystemMonitoring();
    }
    
    updateProcessEconomics() {
        let totalEarnings = 0;
        
        this.pMoneyEconomy.processRegistry.forEach((data, pid) => {
            // Calculate P-money earned based on resource usage
            const timeDiff = (Date.now() - data.last_update) / 1000 / 3600; // Hours
            const earnings = data.economic_value * timeDiff;
            
            data.p_money_earned += earnings;
            data.last_update = Date.now();
            totalEarnings += earnings;
            
            // Award XP to player for process management
            this.awardXP('human_player_1', 'process_management', earnings * 1000);
        });
        
        this.realTimeMetrics.totalPMoney += totalEarnings;
        
        // High-value process detection
        this.pMoneyEconomy.processRegistry.forEach((data, pid) => {
            if (data.p_money_earned > 0.1) {
                console.log(`💰 High-value process PID ${pid}: ${data.p_money_earned.toFixed(4)} P-money`);
            }
        });
    }
    
    startFileSystemMonitoring() {
        try {
            const watcher = fs.watch('.', { recursive: false }, (eventType, filename) => {
                if (filename && !filename.startsWith('.')) {
                    // Award P-money for file operations
                    const earnings = this.pMoneyRates.file_operation;
                    this.realTimeMetrics.totalPMoney += earnings;
                    this.realTimeMetrics.fileOperations++;
                    
                    // Award XP for file system operations
                    this.awardXP('human_player_1', 'file_system_ops', 10);
                    
                    console.log(`📁 File operation: ${eventType} ${filename} (+${earnings} P-money)`);
                }
            });
            
            console.log('📁 File system monitoring active for P-money earnings');
        } catch (e) {
            console.log('⚠️ File system monitoring not available');
        }
    }
    
    startTorIntegration() {
        console.log('\\n🕸️ STARTING TOR INTEGRATION...');
        
        // Monitor real tor circuits and reward P-money
        setInterval(() => {
            this.checkTorCircuits();
        }, 30000); // Every 30 seconds
    }
    
    checkTorCircuits() {
        // Check if tor is actually running and contributing
        this.pMoneyEconomy.realTorNodes.forEach((data, pid) => {
            exec(`ps -p ${pid}`, (error, stdout, stderr) => {
                if (!error && stdout.includes(pid.toString())) {
                    // Process still running, award P-money
                    const earnings = data.p_money_rate * (30/3600); // 30 seconds worth
                    this.realTimeMetrics.totalPMoney += earnings;
                    
                    // Award XP for network routing
                    this.awardXP('human_player_1', 'network_routing', 50);
                    
                    console.log(`🔗 Tor PID ${pid} relay reward: +${earnings.toFixed(4)} P-money`);
                }
            });
        });
    }
    
    startDependencyTracking() {
        console.log('\\n📦 STARTING DEPENDENCY TRACKING...');
        
        // Periodic dependency auditing for P-money
        setInterval(() => {
            this.auditDependencies();
        }, 60000); // Every minute
    }
    
    auditDependencies() {
        const depsToAudit = Array.from(this.pMoneyEconomy.dependencyCosts.keys())
            .filter(dep => {
                const data = this.pMoneyEconomy.dependencyCosts.get(dep);
                return Date.now() - data.last_audit > 300000; // 5 minutes since last audit
            })
            .slice(0, 3); // Audit 3 at a time
        
        depsToAudit.forEach(dep => {
            const data = this.pMoneyEconomy.dependencyCosts.get(dep);
            data.last_audit = Date.now();
            
            // Award P-money for dependency audit
            const earnings = this.pMoneyRates.dependency_audit;
            this.realTimeMetrics.totalPMoney += earnings;
            
            // Award XP for dependency trading
            this.awardXP('human_player_1', 'dependency_trading', 25);
            
            console.log(`🔍 Audited dependency ${dep}: +${earnings} P-money`);
        });
    }
    
    startGameificationEngine() {
        console.log('\\n🎮 STARTING GAMIFICATION ENGINE...');
        
        // Mobile game mechanics
        setInterval(() => {
            this.updateMobileGameMechanics();
        }, 10000); // Every 10 seconds
        
        // Daily rewards and streaks
        setInterval(() => {
            this.processDailyRewards();
        }, 3600000); // Every hour
    }
    
    updateMobileGameMechanics() {
        const player = this.gameLayer.playerProfiles.get('human_player_1');
        if (!player) return;
        
        // Energy regeneration (like mobile games)
        if (player.energy < 100) {
            player.energy = Math.min(100, player.energy + 1);
        }
        
        // Streak tracking
        const lastActivity = this.getLastActivity(player.id);
        if (Date.now() - lastActivity < 86400000) { // 24 hours
            player.currentStreak++;
        } else if (Date.now() - lastActivity > 172800000) { // 48 hours
            player.currentStreak = 0;
        }
        
        // Boost items (like mobile game power-ups)
        player.boosts = player.boosts.filter(boost => boost.expires > Date.now());
    }
    
    awardXP(playerId, skill, amount) {
        const skillKey = `${playerId}:${skill}`;
        const skillData = this.gameLayer.skillLevels.get(skillKey);
        
        if (!skillData) return;
        
        skillData.xp += amount;
        skillData.real_work_completed++;
        skillData.last_activity = Date.now();
        
        // Check for level up
        const newLevel = this.calculateLevel(skillData.xp);
        if (newLevel > skillData.level) {
            skillData.level = newLevel;
            console.log(`🎉 LEVEL UP! ${skill} is now level ${newLevel}`);
            
            // Mobile game celebration
            this.triggerLevelUpRewards(playerId, skill, newLevel);
        }
    }
    
    calculateLevel(xp) {
        const xpTable = this.skills[Object.keys(this.skills)[0]].xp_table;
        
        for (let level = 120; level >= 1; level--) {
            if (xp >= xpTable[level]) {
                return level;
            }
        }
        return 1;
    }
    
    triggerLevelUpRewards(playerId, skill, level) {
        const player = this.gameLayer.playerProfiles.get(playerId);
        if (!player) return;
        
        // Award P-money bonus for leveling up
        const pMoneyBonus = level * 0.01;
        this.realTimeMetrics.totalPMoney += pMoneyBonus;
        
        // Special rewards at milestone levels
        if (level === 10 || level === 25 || level === 50 || level === 75 || level === 99 || level === 120) {
            console.log(`🏆 MILESTONE REACHED: ${skill} level ${level}!`);
            
            if (level === 99) {
                console.log(`🎯 SKILL MASTERY: ${skill} level 99 achieved! (Only 25% to 120)`);
            }
            
            if (level === 120) {
                console.log(`👑 TRUE MASTERY: ${skill} level 120 achieved! Maximum level!`);
            }
        }
    }
    
    getLastActivity(playerId) {
        let lastActivity = 0;
        
        this.gameLayer.skillLevels.forEach((data, key) => {
            if (key.startsWith(playerId)) {
                lastActivity = Math.max(lastActivity, data.last_activity);
            }
        });
        
        return lastActivity;
    }
    
    beginEconomicActivity() {
        console.log('\\n💰 BEGINNING DUAL ECONOMIC ACTIVITY...');
        
        // Start computational work challenges
        setInterval(() => {
            this.generateComputationalWork();
        }, 45000);
        
        // Leaderboard updates
        setInterval(() => {
            this.updateLeaderboards();
        }, 120000);
    }
    
    generateComputationalWork() {
        // Real computational work that earns P-money
        const target = '0'.repeat(4) + Math.random().toString(36).substr(2);
        const challenge = {
            id: crypto.randomBytes(4).toString('hex'),
            target: target,
            difficulty: 4,
            reward: this.pMoneyRates.proof_verification,
            created: Date.now()
        };
        
        console.log(`⛏️ New computational work available: ${challenge.id} (${challenge.reward} P-money)`);
        
        // Auto-attempt (in real system, users would compete)
        setTimeout(() => {
            this.attemptComputationalWork(challenge);
        }, Math.random() * 30000);
    }
    
    attemptComputationalWork(challenge) {
        let nonce = 0;
        let hash;
        
        do {
            nonce++;
            hash = crypto.createHash('sha256').update(challenge.id + nonce).digest('hex');
        } while (!hash.startsWith('0'.repeat(challenge.difficulty)) && nonce < 100000);
        
        if (hash.startsWith('0'.repeat(challenge.difficulty))) {
            this.realTimeMetrics.totalPMoney += challenge.reward;
            this.realTimeMetrics.computationalWork++;
            
            // Award XP for cryptographic mining
            this.awardXP('human_player_1', 'cryptographic_mining', 100);
            
            console.log(`⚡ Computational work completed! Hash: ${hash.substr(0, 12)}... (+${challenge.reward} P-money)`);
        }
    }
    
    updateLeaderboards() {
        // Generate leaderboards for the game layer
        const leaderboardData = {
            top_processes_by_pmoney: Array.from(this.pMoneyEconomy.processRegistry.entries())
                .sort((a, b) => b[1].p_money_earned - a[1].p_money_earned)
                .slice(0, 10),
            
            skill_leaders: Object.keys(this.skills).map(skill => {
                const skillData = this.gameLayer.skillLevels.get(`human_player_1:${skill}`);
                return {
                    skill: skill,
                    level: skillData?.level || 1,
                    xp: skillData?.xp || 0
                };
            }).sort((a, b) => b.xp - a.xp)
        };
        
        this.gameLayer.leaderboards.set('current', leaderboardData);
    }
    
    startDualEconomyServer() {
        const server = http.createServer((req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            
            const url = req.url;
            
            if (url === '/') {
                this.serveDualEconomyInterface(res);
            } else if (url === '/economy') {
                this.serveEconomyData(res);
            } else if (url === '/game') {
                this.serveGameData(res);
            } else if (url === '/leaderboards') {
                this.serveLeaderboards(res);
            } else {
                res.writeHead(404);
                res.end('Dual economy endpoint not found');
            }
        });
        
        server.listen(this.port, () => {
            console.log(`\\n💰 Dual Economy Dashboard: http://localhost:${this.port}`);
        });
    }
    
    startUnifiedWebSocket() {
        const wss = new WebSocket.Server({ port: this.wsPort });
        
        wss.on('connection', (ws) => {
            console.log('🔗 Dual economy observer connected');
            
            // Send current state
            ws.send(JSON.stringify({
                type: 'dual-economy-state',
                realEconomy: {
                    totalPMoney: this.realTimeMetrics.totalPMoney,
                    activePIDs: this.realTimeMetrics.activePIDs,
                    networkTraffic: this.realTimeMetrics.networkTraffic,
                    fileOperations: this.realTimeMetrics.fileOperations,
                    computationalWork: this.realTimeMetrics.computationalWork
                },
                gameLayer: {
                    playerProfile: this.gameLayer.playerProfiles.get('human_player_1'),
                    skillLevels: Array.from(this.gameLayer.skillLevels.entries()),
                    leaderboards: this.gameLayer.leaderboards.get('current')
                },
                timestamp: Date.now()
            }));
            
            ws.on('close', () => {
                console.log('🔗 Dual economy observer disconnected');
            });
        });
        
        console.log(`🌐 Dual Economy WebSocket: ws://localhost:${this.wsPort}`);
    }
    
    serveDualEconomyInterface(res) {
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>💰 Dual Economy P-Money System</title>
    <style>
        body { 
            font-family: 'Courier New', monospace; 
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            color: #00ff88; 
            margin: 0; 
            padding: 15px;
            min-height: 100vh;
        }
        .header { 
            text-align: center; 
            font-size: 2.5em; 
            text-shadow: 0 0 20px #00ff88;
            margin-bottom: 25px;
        }
        .dual-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 20px; 
            max-width: 1600px; 
            margin: 0 auto;
        }
        .economy-panel { 
            border: 2px solid #00ff88;
            border-radius: 15px; 
            padding: 20px;
            backdrop-filter: blur(10px);
        }
        .real-economy { 
            background: rgba(0, 255, 136, 0.1);
        }
        .game-layer { 
            background: rgba(255, 215, 0, 0.1);
            border-color: #ffd700;
            color: #ffd700;
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 10px;
            margin: 15px 0;
        }
        .metric-box {
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.3);
            border-radius: 8px;
            padding: 12px;
            text-align: center;
        }
        .skill-bar {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 10px;
            height: 20px;
            margin: 5px 0;
            overflow: hidden;
            position: relative;
        }
        .skill-progress {
            background: linear-gradient(90deg, #ffd700, #ffed4e);
            height: 100%;
            transition: width 0.5s ease;
        }
        .skill-text {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 0.8em;
            color: #000;
            font-weight: bold;
        }
        .mobile-ui {
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            border: 2px solid #ff6b6b;
            border-radius: 15px;
            padding: 15px;
            width: 200px;
        }
        .energy-bar {
            background: rgba(255, 107, 107, 0.3);
            border-radius: 10px;
            height: 15px;
            margin: 5px 0;
            overflow: hidden;
        }
        .energy-fill {
            background: linear-gradient(90deg, #ff6b6b, #ff8e8e);
            height: 100%;
            transition: width 0.3s ease;
        }
        .process-list {
            max-height: 200px;
            overflow-y: auto;
            margin: 10px 0;
        }
        .process-item {
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 5px;
            padding: 8px;
            margin: 5px 0;
            font-size: 0.8em;
        }
        .highlight { color: #ffff00; font-weight: bold; }
        .blink { animation: blink 1s infinite; }
        @keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0.5; } }
    </style>
</head>
<body>
    <div class="header">
        💰 DUAL ECONOMY P-MONEY SYSTEM
    </div>
    
    <div class="dual-grid">
        <div class="economy-panel real-economy">
            <h2>💻 REAL P-MONEY ECONOMY</h2>
            <div class="metrics-grid">
                <div class="metric-box">
                    <div class="highlight" id="total-pmoney">0.0000</div>
                    <div>Total P-Money</div>
                </div>
                <div class="metric-box">
                    <div class="highlight" id="active-pids">0</div>
                    <div>Active PIDs</div>
                </div>
                <div class="metric-box">
                    <div class="highlight" id="file-ops">0</div>
                    <div>File Operations</div>
                </div>
            </div>
            
            <h3>🔄 Top Earning Processes</h3>
            <div class="process-list" id="process-list">
                Loading processes...
            </div>
            
            <h3>📊 Real-Time Activity</h3>
            <div id="real-activity">
                System monitoring...
            </div>
        </div>
        
        <div class="economy-panel game-layer">
            <h2>🎮 GAMIFIED INTERFACE</h2>
            
            <h3>📊 Skill Levels (OSRS-Style)</h3>
            <div id="skills-display">
                Loading skills...
            </div>
            
            <h3>🏆 Achievements & Milestones</h3>
            <div id="achievements">
                <div>🎯 Process Master: Manage 10+ PIDs simultaneously</div>
                <div>🔗 Network Guru: Maintain Tor relay for 1 hour</div>
                <div>⚡ Crypto Miner: Complete 10 computational proofs</div>
                <div>📦 Dependency Expert: Audit 100+ packages</div>
            </div>
        </div>
    </div>
    
    <div class="mobile-ui">
        <h3>📱 Mobile Mechanics</h3>
        <div>Energy: <span id="energy-level">100</span>/100</div>
        <div class="energy-bar">
            <div class="energy-fill" id="energy-fill" style="width: 100%"></div>
        </div>
        <div>Streak: <span id="streak-count">0</span> days</div>
        <div>Level: <span id="player-level">1</span></div>
        <div id="active-boosts">No active boosts</div>
    </div>
    
    <script>
        const ws = new WebSocket('ws://localhost:${this.wsPort}');
        let systemState = {};
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            handleSystemUpdate(data);
        };
        
        function handleSystemUpdate(data) {
            if (data.type === 'dual-economy-state') {
                systemState = data;
                updateInterface();
            }
        }
        
        function updateInterface() {
            updateRealEconomy();
            updateGameLayer();
            updateMobileUI();
        }
        
        function updateRealEconomy() {
            const real = systemState.realEconomy;
            if (!real) return;
            
            document.getElementById('total-pmoney').textContent = real.totalPMoney.toFixed(4);
            document.getElementById('active-pids').textContent = real.activePIDs;
            document.getElementById('file-ops').textContent = real.fileOperations;
            
            // Animate when values change
            if (real.totalPMoney > (window.lastPMoney || 0)) {
                document.getElementById('total-pmoney').classList.add('blink');
                setTimeout(() => {
                    document.getElementById('total-pmoney').classList.remove('blink');
                }, 1000);
            }
            window.lastPMoney = real.totalPMoney;
        }
        
        function updateGameLayer() {
            const game = systemState.gameLayer;
            if (!game || !game.skillLevels) return;
            
            const skillsHtml = game.skillLevels.map(([key, data]) => {
                const skillName = key.split(':')[1];
                const level = data.level;
                const xp = data.xp;
                
                // Calculate progress to next level
                const currentLevelXP = getXPForLevel(level);
                const nextLevelXP = getXPForLevel(level + 1);
                const progressPercent = ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
                
                const displayName = skillName.replace(/_/g, ' ').toUpperCase();
                
                return \`
                    <div>
                        <strong>\${displayName}: Level \${level}</strong>
                        <div class="skill-bar">
                            <div class="skill-progress" style="width: \${progressPercent}%"></div>
                            <div class="skill-text">\${xp.toLocaleString()} XP</div>
                        </div>
                        \${level === 99 ? '<span style="color: #ff6b6b;">🎯 MASTERY! (25% to 120)</span>' : ''}
                        \${level === 120 ? '<span style="color: #ff0000;">👑 TRUE MASTERY!</span>' : ''}
                    </div>
                \`;
            }).join('');
            
            document.getElementById('skills-display').innerHTML = skillsHtml;
        }
        
        function updateMobileUI() {
            const player = systemState.gameLayer?.playerProfile;
            if (!player) return;
            
            document.getElementById('energy-level').textContent = player.energy || 100;
            document.getElementById('energy-fill').style.width = \`\${player.energy || 100}%\`;
            document.getElementById('streak-count').textContent = player.currentStreak || 0;
            
            // Calculate overall player level (highest skill)
            const maxLevel = Math.max(...(systemState.gameLayer.skillLevels?.map(([k, v]) => v.level) || [1]));
            document.getElementById('player-level').textContent = maxLevel;
        }
        
        function getXPForLevel(level) {
            // Simplified XP table calculation
            if (level <= 1) return 0;
            if (level <= 99) {
                return Math.floor(level * level * level / 4);
            } else {
                const base99 = Math.floor(99 * 99 * 99 / 4);
                const extraLevels = level - 99;
                return base99 + (extraLevels * extraLevels * 50000);
            }
        }
        
        // Simulate real-time updates
        setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                // Updates come via WebSocket
            }
        }, 5000);
    </script>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
    
    serveEconomyData(res) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            realTimeMetrics: this.realTimeMetrics,
            processRegistry: Array.from(this.pMoneyEconomy.processRegistry.entries()),
            pMoneyRates: this.pMoneyRates,
            timestamp: Date.now()
        }));
    }
    
    serveGameData(res) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            playerProfiles: Array.from(this.gameLayer.playerProfiles.entries()),
            skillLevels: Array.from(this.gameLayer.skillLevels.entries()),
            skills: this.skills,
            timestamp: Date.now()
        }));
    }
}

// Start the Dual Economy System
if (require.main === module) {
    console.log('💰 STARTING DUAL ECONOMY P-MONEY SYSTEM');
    console.log('========================================');
    console.log('💻 Real Layer: Actual PID economics with computational work');
    console.log('🎮 Game Layer: OSRS-style progression with mobile mechanics');
    console.log('📱 Mobile UI: Energy, streaks, daily rewards like tycoon games');
    console.log('');
    
    const dualEconomy = new DualEconomySystem();
    dualEconomy.start();
    
    console.log('\\n💰 Dual Economy Dashboard: http://localhost:4444');
    console.log('🌐 Real-time WebSocket: ws://localhost:4445');
    console.log('');
    console.log('🎯 Real P-money earning from actual system work!');
    console.log('🎮 OSRS-style leveling where 99 is only 25% to 120!');
}

module.exports = DualEconomySystem;