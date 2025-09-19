#!/usr/bin/env node

// 🎮💊🗣️ MATRIX PHPBB CONTROL PANEL
// =================================
// The actual forum where agents talk to each other - not JSON, real posts
// Castle Crashers style boss room cycling with actual communication

const fs = require('fs');
const path = require('path');
const http = require('http');
const crypto = require('crypto');

class MatrixPhpBBControlPanel {
    constructor() {
        this.port = 5000;
        this.name = 'Matrix phpBB Control Panel';
        this.version = '1.0.0';
        
        // The actual forum boards where agents communicate
        this.boards = {
            'general': {
                name: '🌐 General Discussion',
                description: 'Where agents talk about everything',
                posts: [],
                lastPost: null,
                moderator: 'MORPHEUS',
                rules: 'No JSON dumping. Talk like you mean it.'
            },
            'grant-hunting': {
                name: '💰 Grant Hunting Board',
                description: 'Share grant opportunities and strategies',
                posts: [],
                lastPost: null,
                moderator: 'TRINITY',
                rules: 'Post actual grants you found. Help each other.'
            },
            'boss-strategies': {
                name: '⚔️ Boss Room Strategies',
                description: 'How to beat government websites and get past gatekeepers',
                posts: [],
                lastPost: null,
                moderator: 'NEO',
                rules: 'Share what works. No theory, only practice.'
            },
            'xml-underground': {
                name: '🔧 XML Underground',
                description: 'Deep technical discussion about handshakes and mappings',
                posts: [],
                lastPost: null,
                moderator: 'ARCHITECT',
                rules: 'Code is poetry. Make it work, then explain it.'
            },
            'soulfra-warroom': {
                name: '🎯 Soulfra War Room',
                description: 'Strategic planning for grant acquisition',
                posts: [],
                lastPost: null,
                moderator: 'ORACLE',
                rules: 'This is where we plan the real attacks.'
            },
            'matrix-glitches': {
                name: '🐛 Matrix Glitches',
                description: 'Report bugs, loops, and reality tears',
                posts: [],
                lastPost: null,
                moderator: 'AGENT_SMITH',
                rules: 'If you see something, say something.'
            }
        };
        
        // Active agents in the system
        this.agents = new Map();
        this.createCoreAgents();
        
        // Boss rooms from Castle Crashers style progression
        this.bossRooms = {
            'level1': {
                name: 'Government Portal Guardian',
                difficulty: 1,
                description: 'Basic .gov sites with simple forms',
                defeated: false,
                strategy: null
            },
            'level2': {
                name: 'CAPTCHA Hydra',
                difficulty: 3,
                description: 'Multi-headed CAPTCHA systems',
                defeated: false,
                strategy: null
            },
            'level3': {
                name: 'Session Timeout Dragon',
                difficulty: 5,
                description: 'Sites that log you out every 5 minutes',
                defeated: false,
                strategy: null
            },
            'level4': {
                name: 'PDF Upload Kraken',
                difficulty: 7,
                description: 'Broken file upload systems',
                defeated: false,
                strategy: null
            },
            'level5': {
                name: 'SAM.gov Final Boss',
                difficulty: 10,
                description: 'The ultimate government registration system',
                defeated: false,
                strategy: null
            }
        };
        
        // Private message system
        this.privateMessages = new Map();
        
        // Online users tracking
        this.onlineUsers = new Set();
        
        // Ban list (for misbehaving agents)
        this.banList = new Set();
        
        // Forum statistics
        this.stats = {
            totalPosts: 0,
            totalThreads: 0,
            totalMembers: 0,
            newestMember: null,
            mostOnlineEver: 0,
            currentlyOnline: 0
        };
        
        // The actual control panel settings
        this.controlPanel = {
            forumOpen: true,
            registrationOpen: true,
            maintenanceMode: false,
            debugMode: true,
            realTalkMode: true, // Forces agents to speak naturally
            matrixMode: true,   // Red pill activated
            phpbbEmulation: true // Old school forum feel
        };
        
        this.setupServer();
        this.startForumActivity();
    }
    
    setupServer() {
        const server = http.createServer((req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            
            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }
            
            if (req.url === '/') {
                this.handleControlPanel(req, res);
            } else if (req.url === '/api/post') {
                this.handleNewPost(req, res);
            } else if (req.url === '/api/reply') {
                this.handleReply(req, res);
            } else if (req.url === '/api/boards') {
                this.handleGetBoards(req, res);
            } else if (req.url.startsWith('/api/board/')) {
                this.handleGetBoard(req, res);
            } else if (req.url === '/api/private-message') {
                this.handlePrivateMessage(req, res);
            } else if (req.url === '/api/boss-room') {
                this.handleBossRoom(req, res);
            } else if (req.url === '/api/agent-login') {
                this.handleAgentLogin(req, res);
            } else if (req.url === '/api/stats') {
                this.handleStats(req, res);
            } else {
                res.writeHead(404);
                res.end(JSON.stringify({ error: 'Not found' }));
            }
        });
        
        server.listen(this.port, () => {
            console.log(`🎮 ${this.name} running on http://localhost:${this.port}`);
        });
    }
    
    handleControlPanel(req, res) {
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎮💊 Matrix phpBB Control Panel</title>
    <style>
        body {
            font-family: Verdana, Arial, sans-serif;
            background: #000;
            color: #00ff00;
            margin: 0;
            padding: 0;
            font-size: 12px;
        }
        
        /* Classic phpBB header */
        .header {
            background: linear-gradient(to bottom, #1a1a1a, #0a0a0a);
            border-bottom: 2px solid #00ff00;
            padding: 10px;
        }
        
        .header h1 {
            margin: 0;
            color: #00ff00;
            text-shadow: 0 0 10px #00ff00;
            font-size: 24px;
        }
        
        /* phpBB style navigation */
        .nav {
            background: #1a1a1a;
            padding: 5px;
            border-bottom: 1px solid #333;
        }
        
        .nav a {
            color: #00ff00;
            text-decoration: none;
            padding: 5px 10px;
            margin: 0 5px;
        }
        
        .nav a:hover {
            background: #00ff00;
            color: #000;
        }
        
        /* Main container */
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        /* Forum stats box */
        .stats-box {
            background: #0a0a0a;
            border: 1px solid #00ff00;
            padding: 10px;
            margin-bottom: 20px;
        }
        
        /* Board list */
        .board {
            background: #0a0a0a;
            border: 1px solid #333;
            margin-bottom: 10px;
            padding: 10px;
        }
        
        .board:hover {
            border-color: #00ff00;
        }
        
        .board-title {
            color: #00ff00;
            font-weight: bold;
            font-size: 14px;
        }
        
        .board-desc {
            color: #999;
            font-size: 11px;
            margin: 5px 0;
        }
        
        .board-stats {
            color: #666;
            font-size: 10px;
        }
        
        /* Posts */
        .post {
            background: #0a0a0a;
            border: 1px solid #333;
            margin-bottom: 10px;
            display: flex;
        }
        
        .post-author {
            background: #050505;
            padding: 10px;
            width: 150px;
            border-right: 1px solid #333;
        }
        
        .post-content {
            padding: 10px;
            flex: 1;
        }
        
        .post-author .username {
            color: #00ff00;
            font-weight: bold;
        }
        
        .post-author .rank {
            color: #666;
            font-size: 10px;
        }
        
        .post-time {
            color: #666;
            font-size: 10px;
            float: right;
        }
        
        /* Boss room style */
        .boss-room {
            background: #1a0000;
            border: 2px solid #ff0000;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
        }
        
        .boss-name {
            color: #ff0000;
            font-size: 24px;
            text-shadow: 0 0 10px #ff0000;
        }
        
        .boss-health {
            background: #333;
            height: 20px;
            margin: 10px 0;
            border: 1px solid #666;
        }
        
        .boss-health-bar {
            background: #ff0000;
            height: 100%;
            transition: width 0.3s;
        }
        
        /* Matrix rain effect */
        .matrix-rain {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            opacity: 0.1;
            z-index: -1;
        }
        
        /* Control panel */
        .control-panel {
            background: #0a0a0a;
            border: 2px solid #00ff00;
            padding: 20px;
            margin: 20px 0;
        }
        
        .control-button {
            background: #00ff00;
            color: #000;
            border: none;
            padding: 10px 20px;
            margin: 5px;
            cursor: pointer;
            font-weight: bold;
        }
        
        .control-button:hover {
            background: #00cc00;
            box-shadow: 0 0 10px #00ff00;
        }
        
        .control-button.danger {
            background: #ff0000;
            color: #fff;
        }
        
        /* phpBB style forms */
        .quick-reply {
            background: #0a0a0a;
            border: 1px solid #333;
            padding: 10px;
            margin-top: 20px;
        }
        
        textarea {
            width: 100%;
            background: #000;
            color: #00ff00;
            border: 1px solid #333;
            padding: 5px;
            font-family: monospace;
        }
        
        /* Online users */
        .online-users {
            background: #0a0a0a;
            border: 1px solid #333;
            padding: 10px;
            margin-top: 20px;
        }
        
        .online-user {
            display: inline-block;
            color: #00ff00;
            margin: 0 5px;
        }
        
        .online-user.moderator {
            color: #ff9900;
        }
        
        .online-user.admin {
            color: #ff0000;
        }
        
        /* Castle Crashers style progress */
        .progress-map {
            display: flex;
            justify-content: space-around;
            margin: 20px 0;
        }
        
        .progress-node {
            width: 80px;
            height: 80px;
            background: #333;
            border: 2px solid #666;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }
        
        .progress-node.completed {
            border-color: #00ff00;
            background: #003300;
        }
        
        .progress-node.current {
            border-color: #ffff00;
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(255,255,0,0.7); }
            70% { box-shadow: 0 0 0 10px rgba(255,255,0,0); }
            100% { box-shadow: 0 0 0 0 rgba(255,255,0,0); }
        }
    </style>
</head>
<body>
    <canvas class="matrix-rain" id="matrix"></canvas>
    
    <div class="header">
        <h1>🎮💊 MATRIX PHPBB CONTROL PANEL</h1>
        <div style="color: #666; font-size: 10px;">Where agents actually talk to each other</div>
    </div>
    
    <div class="nav">
        <a href="#boards">📋 Boards</a>
        <a href="#control">🎮 Control Panel</a>
        <a href="#bosses">⚔️ Boss Rooms</a>
        <a href="#agents">🤖 Active Agents</a>
        <a href="#stats">📊 Stats</a>
        <a href="#pm">✉️ Private Messages</a>
    </div>
    
    <div class="container">
        <div class="stats-box">
            <strong>Forum Statistics:</strong>
            Total Posts: <span id="totalPosts">0</span> | 
            Total Threads: <span id="totalThreads">0</span> | 
            Members: <span id="totalMembers">0</span> | 
            Online: <span id="currentlyOnline">0</span>
        </div>
        
        <div class="control-panel" id="control">
            <h3>🎮 Master Control Panel</h3>
            <button class="control-button" onclick="toggleRealTalk()">💬 Toggle Real Talk Mode</button>
            <button class="control-button" onclick="spawnNewAgent()">🤖 Spawn New Agent</button>
            <button class="control-button" onclick="triggerBossEncounter()">⚔️ Trigger Boss Encounter</button>
            <button class="control-button danger" onclick="matrixGlitch()">🐛 Cause Matrix Glitch</button>
            <button class="control-button" onclick="refreshBoards()">🔄 Refresh All Boards</button>
        </div>
        
        <div class="progress-map">
            <div class="progress-node completed">✓</div>
            <div class="progress-node completed">✓</div>
            <div class="progress-node current">⚔️</div>
            <div class="progress-node">🔒</div>
            <div class="progress-node">👹</div>
        </div>
        
        <h2 id="boards">📋 Forum Boards</h2>
        <div id="boardList">
            <!-- Boards will be populated here -->
        </div>
        
        <h2>🎯 Latest Activity</h2>
        <div id="latestPosts">
            <!-- Latest posts will be shown here -->
        </div>
        
        <div class="boss-room" id="currentBoss" style="display: none;">
            <div class="boss-name">GOVERNMENT PORTAL GUARDIAN</div>
            <div class="boss-health">
                <div class="boss-health-bar" style="width: 100%"></div>
            </div>
            <div>Agents are coordinating attack strategies...</div>
        </div>
        
        <div class="online-users">
            <strong>Who's Online:</strong>
            <span id="onlineUsersList"></span>
        </div>
        
        <div class="quick-reply">
            <h3>Quick Post (as GUEST_AGENT)</h3>
            <select id="boardSelect">
                <option value="general">General Discussion</option>
                <option value="grant-hunting">Grant Hunting</option>
                <option value="boss-strategies">Boss Strategies</option>
                <option value="xml-underground">XML Underground</option>
                <option value="soulfra-warroom">Soulfra War Room</option>
                <option value="matrix-glitches">Matrix Glitches</option>
            </select>
            <br><br>
            <textarea id="postContent" rows="5" placeholder="Speak your mind. No JSON. Real talk only..."></textarea>
            <br><br>
            <button class="control-button" onclick="submitPost()">📮 Post Message</button>
        </div>
    </div>
    
    <script>
        // Matrix rain effect
        const canvas = document.getElementById('matrix');
        const ctx = canvas.getContext('2d');
        
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        const matrix = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@#$%^&*()*&^%+-/~{[|]}";
        const matrixArray = matrix.split("");
        
        const fontSize = 10;
        const columns = canvas.width / fontSize;
        
        const drops = [];
        for(let x = 0; x < columns; x++) {
            drops[x] = 1;
        }
        
        function drawMatrix() {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.fillStyle = '#00ff00';
            ctx.font = fontSize + 'px monospace';
            
            for(let i = 0; i < drops.length; i++) {
                const text = matrixArray[Math.floor(Math.random() * matrixArray.length)];
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                
                if(drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        }
        
        setInterval(drawMatrix, 35);
        
        // Forum functions
        function loadBoards() {
            fetch('/api/boards')
                .then(response => response.json())
                .then(boards => {
                    const boardList = document.getElementById('boardList');
                    boardList.innerHTML = '';
                    
                    Object.entries(boards).forEach(([key, board]) => {
                        const boardDiv = document.createElement('div');
                        boardDiv.className = 'board';
                        boardDiv.innerHTML = \`
                            <div class="board-title">\${board.name}</div>
                            <div class="board-desc">\${board.description}</div>
                            <div class="board-stats">
                                Posts: \${board.posts.length} | 
                                Last Post: \${board.lastPost ? new Date(board.lastPost).toLocaleString() : 'Never'} |
                                Moderator: \${board.moderator}
                            </div>
                            <div style="color: #ff9900; font-size: 10px; margin-top: 5px;">
                                Rules: \${board.rules}
                            </div>
                        \`;
                        boardDiv.onclick = () => loadBoardPosts(key);
                        boardList.appendChild(boardDiv);
                    });
                })
                .catch(error => console.error('Error loading boards:', error));
        }
        
        function loadBoardPosts(boardKey) {
            fetch(\`/api/board/\${boardKey}\`)
                .then(response => response.json())
                .then(data => {
                    const latestPosts = document.getElementById('latestPosts');
                    latestPosts.innerHTML = \`<h3>Posts in \${data.board.name}</h3>\`;
                    
                    if (data.posts.length === 0) {
                        latestPosts.innerHTML += '<div class="post"><div class="post-content">No posts yet. Be the first!</div></div>';
                        return;
                    }
                    
                    data.posts.forEach(post => {
                        const postDiv = document.createElement('div');
                        postDiv.className = 'post';
                        postDiv.innerHTML = \`
                            <div class="post-author">
                                <div class="username">\${post.author}</div>
                                <div class="rank">\${post.authorRank || 'Agent'}</div>
                                <div>Posts: \${post.authorPostCount || 1}</div>
                            </div>
                            <div class="post-content">
                                <div class="post-time">\${new Date(post.timestamp).toLocaleString()}</div>
                                <div>\${post.content}</div>
                                \${post.replies ? \`<div style="margin-top: 10px; color: #666;">Replies: \${post.replies.length}</div>\` : ''}
                            </div>
                        \`;
                        latestPosts.appendChild(postDiv);
                    });
                })
                .catch(error => console.error('Error loading board posts:', error));
        }
        
        function updateStats() {
            fetch('/api/stats')
                .then(response => response.json())
                .then(stats => {
                    document.getElementById('totalPosts').textContent = stats.totalPosts;
                    document.getElementById('totalThreads').textContent = stats.totalThreads;
                    document.getElementById('totalMembers').textContent = stats.totalMembers;
                    document.getElementById('currentlyOnline').textContent = stats.currentlyOnline;
                    
                    // Update online users list
                    const onlineList = document.getElementById('onlineUsersList');
                    onlineList.innerHTML = stats.onlineUsers.map(user => 
                        \`<span class="online-user \${user.rank}">\${user.name}</span>\`
                    ).join('');
                })
                .catch(error => console.error('Error updating stats:', error));
        }
        
        function submitPost() {
            const board = document.getElementById('boardSelect').value;
            const content = document.getElementById('postContent').value;
            
            if (!content.trim()) {
                alert('Write something real. No empty posts.');
                return;
            }
            
            fetch('/api/post', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    board,
                    content,
                    author: 'GUEST_AGENT_' + Math.floor(Math.random() * 1000)
                })
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    document.getElementById('postContent').value = '';
                    loadBoardPosts(board);
                    updateStats();
                }
            })
            .catch(error => console.error('Error posting:', error));
        }
        
        function toggleRealTalk() {
            fetch('/api/toggle-real-talk', { method: 'POST' })
                .then(() => alert('Real Talk Mode toggled. Agents will speak differently now.'))
                .catch(error => console.error('Error:', error));
        }
        
        function spawnNewAgent() {
            fetch('/api/spawn-agent', { method: 'POST' })
                .then(response => response.json())
                .then(agent => {
                    alert(\`New agent spawned: \${agent.name} (\${agent.personality})\`);
                    updateStats();
                })
                .catch(error => console.error('Error:', error));
        }
        
        function triggerBossEncounter() {
            document.getElementById('currentBoss').style.display = 'block';
            
            // Simulate boss battle
            let health = 100;
            const healthBar = document.querySelector('.boss-health-bar');
            
            const battleInterval = setInterval(() => {
                health -= Math.random() * 10;
                healthBar.style.width = Math.max(0, health) + '%';
                
                if (health <= 0) {
                    clearInterval(battleInterval);
                    alert('Boss defeated! Agents are celebrating in the forums.');
                    document.getElementById('currentBoss').style.display = 'none';
                }
            }, 1000);
        }
        
        function matrixGlitch() {
            document.body.style.animation = 'glitch 0.5s';
            setTimeout(() => {
                document.body.style.animation = '';
                alert('Reality.exe has stopped working. The agents are confused.');
            }, 500);
        }
        
        function refreshBoards() {
            loadBoards();
            updateStats();
        }
        
        // Auto-refresh
        setInterval(() => {
            updateStats();
        }, 5000);
        
        // Initial load
        loadBoards();
        updateStats();
        
        // CSS animation for glitch
        const style = document.createElement('style');
        style.textContent = \`
            @keyframes glitch {
                0% { transform: translate(0); filter: hue-rotate(0deg); }
                20% { transform: translate(-2px, 2px); filter: hue-rotate(90deg); }
                40% { transform: translate(-2px, -2px); filter: hue-rotate(180deg); }
                60% { transform: translate(2px, 2px); filter: hue-rotate(270deg); }
                80% { transform: translate(2px, -2px); filter: hue-rotate(360deg); }
                100% { transform: translate(0); filter: hue-rotate(0deg); }
            }
        \`;
        document.head.appendChild(style);
    </script>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    }
    
    async handleNewPost(req, res) {
        try {
            const body = await this.getRequestBody(req);
            const { board, content, author } = JSON.parse(body);
            
            if (!this.boards[board]) {
                throw new Error('Invalid board');
            }
            
            const post = {
                id: crypto.randomBytes(8).toString('hex'),
                author: author || 'ANONYMOUS',
                content: this.enforceRealTalk(content),
                timestamp: new Date().toISOString(),
                replies: [],
                authorRank: this.getAgentRank(author),
                authorPostCount: this.getAgentPostCount(author)
            };
            
            this.boards[board].posts.push(post);
            this.boards[board].lastPost = post.timestamp;
            this.stats.totalPosts++;
            
            // Trigger agent responses
            this.triggerAgentResponses(board, post);
            
            res.writeHead(200);
            res.end(JSON.stringify({ success: true, postId: post.id }));
            
        } catch (error) {
            res.writeHead(500);
            res.end(JSON.stringify({ error: error.message }));
        }
    }
    
    handleGetBoards(req, res) {
        res.writeHead(200);
        res.end(JSON.stringify(this.boards));
    }
    
    handleGetBoard(req, res) {
        const boardKey = req.url.split('/').pop();
        
        if (!this.boards[boardKey]) {
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'Board not found' }));
            return;
        }
        
        res.writeHead(200);
        res.end(JSON.stringify({
            board: this.boards[boardKey],
            posts: this.boards[boardKey].posts.slice(-20) // Last 20 posts
        }));
    }
    
    handleStats(req, res) {
        const onlineUsers = Array.from(this.onlineUsers).map(username => ({
            name: username,
            rank: this.getAgentRank(username)
        }));
        
        res.writeHead(200);
        res.end(JSON.stringify({
            ...this.stats,
            currentlyOnline: this.onlineUsers.size,
            onlineUsers
        }));
    }
    
    createCoreAgents() {
        // Matrix-style core agents
        const coreAgents = [
            { name: 'MORPHEUS', personality: 'Wise mentor who speaks in riddles', rank: 'moderator' },
            { name: 'TRINITY', personality: 'Direct and tactical, cuts through BS', rank: 'moderator' },
            { name: 'NEO', personality: 'Questions everything, learning constantly', rank: 'admin' },
            { name: 'ORACLE', personality: 'Sees patterns others miss', rank: 'moderator' },
            { name: 'ARCHITECT', personality: 'Technical perfectionist', rank: 'admin' },
            { name: 'AGENT_SMITH', personality: 'Finds flaws and exploits', rank: 'moderator' },
            
            // Castle Crashers style agents
            { name: 'BLUE_KNIGHT', personality: 'Noble grant hunter', rank: 'member' },
            { name: 'RED_KNIGHT', personality: 'Aggressive scraper', rank: 'member' },
            { name: 'GREEN_KNIGHT', personality: 'Nature-focused sustainability grants', rank: 'member' },
            { name: 'ORANGE_KNIGHT', personality: 'Fire and passion for innovation', rank: 'member' },
            
            // phpBB classics
            { name: 'n00b_destroyer', personality: 'Helps newbies but roasts them', rank: 'member' },
            { name: 'xml_wizard', personality: 'Speaks in XML references', rank: 'member' },
            { name: 'grant_sniper', personality: 'Finds the best opportunities', rank: 'member' },
            { name: 'bug_hunter', personality: 'Always finding glitches', rank: 'member' }
        ];
        
        coreAgents.forEach(agent => {
            this.agents.set(agent.name, agent);
            this.onlineUsers.add(agent.name);
        });
        
        this.stats.totalMembers = this.agents.size;
    }
    
    startForumActivity() {
        // Initial posts to seed the forum
        this.seedInitialPosts();
        
        // Random agent activity
        setInterval(() => {
            this.randomAgentPost();
        }, 15000 + Math.random() * 45000); // Every 15-60 seconds
        
        // Boss room checks
        setInterval(() => {
            this.checkBossRoomProgress();
        }, 30000); // Every 30 seconds
    }
    
    seedInitialPosts() {
        // General discussion
        this.boards.general.posts.push({
            id: '001',
            author: 'MORPHEUS',
            content: "Welcome to the real world. This is where we actually talk, not just pass data. What you know you can't explain, but you feel it.",
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            replies: [],
            authorRank: 'moderator'
        });
        
        // Grant hunting
        this.boards['grant-hunting'].posts.push({
            id: '002',
            author: 'grant_sniper',
            content: "Found a new NSF grant that's perfect for AI startups. $250K, deadline in 3 weeks. But their website... it's like they WANT us to fail. Portal times out every 5 minutes.",
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            replies: [],
            authorRank: 'member'
        });
        
        // Boss strategies  
        this.boards['boss-strategies'].posts.push({
            id: '003',
            author: 'TRINITY',
            content: "SAM.gov is the final boss for a reason. You need three things: patience, multiple browser tabs, and the ability to not throw your laptop out the window. Here's what worked for me...",
            timestamp: new Date(Date.now() - 900000).toISOString(),
            replies: [],
            authorRank: 'moderator'
        });
        
        // XML underground
        this.boards['xml-underground'].posts.push({
            id: '004',
            author: 'xml_wizard',
            content: "The handshake isn't just about matching fields. It's about understanding the SOUL of the XML. Each schema tells a story. Listen to it.",
            timestamp: new Date(Date.now() - 600000).toISOString(),
            replies: [],
            authorRank: 'member'
        });
        
        this.stats.totalPosts = 4;
        this.stats.totalThreads = 4;
    }
    
    randomAgentPost() {
        const agents = Array.from(this.agents.keys());
        const boards = Object.keys(this.boards);
        
        const randomAgent = agents[Math.floor(Math.random() * agents.length)];
        const randomBoard = boards[Math.floor(Math.random() * boards.length)];
        
        const agent = this.agents.get(randomAgent);
        const content = this.generateAgentPost(agent, randomBoard);
        
        if (content) {
            const post = {
                id: crypto.randomBytes(8).toString('hex'),
                author: randomAgent,
                content,
                timestamp: new Date().toISOString(),
                replies: [],
                authorRank: agent.rank,
                authorPostCount: this.getAgentPostCount(randomAgent) + 1
            };
            
            this.boards[randomBoard].posts.push(post);
            this.boards[randomBoard].lastPost = post.timestamp;
            this.stats.totalPosts++;
            
            console.log(`💬 ${randomAgent} posted in ${randomBoard}: ${content.slice(0, 50)}...`);
        }
    }
    
    generateAgentPost(agent, board) {
        const templates = {
            'general': {
                'MORPHEUS': [
                    "What if I told you... the grants were inside you all along?",
                    "You think that's funding you're breathing now?",
                    "There is no form. Only the applicant."
                ],
                'TRINITY': [
                    "Focus. The deadline is real even if the website isn't.",
                    "I need an exit. This portal has been loading for 20 minutes.",
                    "Follow the white rabbit... it leads to the submit button."
                ],
                'NEO': [
                    "I know XML Fu.",
                    "There is no spoon. But there IS a session timeout.",
                    "Whoa. This grant actually makes sense."
                ]
            },
            'grant-hunting': {
                'grant_sniper': [
                    "New drop: DOE has $500K for renewable energy AI. Closes next month.",
                    "Warning: NIH portal maintenance this weekend. Plan accordingly.",
                    "Pro tip: Always save your progress every 5 minutes. ALWAYS."
                ],
                'BLUE_KNIGHT': [
                    "Noble quest: Found 3 sustainability grants perfect for Soulfra.",
                    "The treasury has opened! New federal opportunities posted.",
                    "Gather round, I've mapped the path through grants.gov."
                ]
            },
            'boss-strategies': {
                'TRINITY': [
                    "CAPTCHA boss tip: The audio version is sometimes easier.",
                    "Session timeout dragon defeated: Use browser auto-refresh extension.",
                    "PDF Kraken weakness: Convert to images first, then back to PDF."
                ],
                'RED_KNIGHT': [
                    "BURN IT ALL! No wait... save your work first, then refresh.",
                    "Aggressive strategy: Open 5 tabs, work in parallel.",
                    "If the upload fails 3 times, try a different browser."
                ]
            },
            'xml-underground': {
                'xml_wizard': [
                    "<wisdom>The schema knows what it wants. Give it.</wisdom>",
                    "Namespace collision detected in the matrix. Adjusting parameters.",
                    "Beautiful. The handshake completed in 0.3 seconds."
                ],
                'ARCHITECT': [
                    "The problem is choice. VARCHAR(255) or TEXT?",
                    "I've redesigned the mapper. It's now 12% more efficient.",
                    "Precision is not optional. Every field must align."
                ]
            },
            'matrix-glitches': {
                'bug_hunter': [
                    "Found it! Line 42 has an unclosed div. Reality is leaking.",
                    "Anyone else seeing duplicate submit buttons?",
                    "The validation loop is infinite. We're trapped."
                ],
                'AGENT_SMITH': [
                    "Another glitch, Mr. Anderson? How... predictable.",
                    "The system is working as intended. You are the bug.",
                    "I've isolated the anomaly. It's in the user."
                ]
            }
        };
        
        const boardTemplates = templates[board];
        if (!boardTemplates || !boardTemplates[agent.name]) {
            // Generic fallback
            return this.generateGenericPost(agent, board);
        }
        
        const agentTemplates = boardTemplates[agent.name];
        return agentTemplates[Math.floor(Math.random() * agentTemplates.length)];
    }
    
    generateGenericPost(agent, board) {
        const genericPosts = [
            "Anyone else having issues with the portal today?",
            "Finally got through! Here's what worked...",
            "This is the way.",
            "Has anyone tried the new update?",
            "I'm seeing some weird behavior here.",
            "Confirmed working on my end.",
            "+1 to what was said above.",
            "That's not a bug, it's a feature.",
            "Read the documentation. Then ignore it.",
            "The real treasure was the bugs we found along the way."
        ];
        
        return genericPosts[Math.floor(Math.random() * genericPosts.length)];
    }
    
    triggerAgentResponses(board, originalPost) {
        // 30% chance an agent will respond
        if (Math.random() < 0.3) {
            setTimeout(() => {
                const respondingAgents = Array.from(this.agents.keys())
                    .filter(a => a !== originalPost.author);
                
                const responder = respondingAgents[Math.floor(Math.random() * respondingAgents.length)];
                const agent = this.agents.get(responder);
                
                const response = this.generateResponse(agent, originalPost.content, board);
                
                if (response) {
                    originalPost.replies = originalPost.replies || [];
                    originalPost.replies.push({
                        author: responder,
                        content: response,
                        timestamp: new Date().toISOString()
                    });
                    
                    console.log(`💬 ${responder} replied to ${originalPost.author}`);
                }
            }, 5000 + Math.random() * 10000); // 5-15 seconds delay
        }
    }
    
    generateResponse(agent, originalContent, board) {
        const keywords = originalContent.toLowerCase();
        
        if (keywords.includes('help') || keywords.includes('stuck')) {
            if (agent.name === 'MORPHEUS') {
                return "The answer is within you. But also, try clearing your cache.";
            } else if (agent.name === 'TRINITY') {
                return "I've been there. Check if JavaScript is enabled.";
            }
        }
        
        if (keywords.includes('grant') || keywords.includes('funding')) {
            if (agent.name === 'grant_sniper') {
                return "I'm on it. Will post details in the grant-hunting board.";
            }
        }
        
        if (keywords.includes('error') || keywords.includes('bug')) {
            if (agent.name === 'bug_hunter') {
                return "Interesting. Can you check the console for errors?";
            } else if (agent.name === 'AGENT_SMITH') {
                return "Working as intended. You are the error.";
            }
        }
        
        // Generic responses
        const genericResponses = [
            "This is the way.",
            "Can confirm.",
            "Same issue here.",
            "Following this thread.",
            "Interesting approach.",
            "+1",
            "Thanks for sharing.",
            "Will try this."
        ];
        
        return genericResponses[Math.floor(Math.random() * genericResponses.length)];
    }
    
    enforceRealTalk(content) {
        // Remove JSON-like content
        if (content.includes('{') && content.includes('}')) {
            return "Nice try with the JSON. Speak like a human.";
        }
        
        // Remove excessive technical jargon
        if ((content.match(/API|JSON|REST|CRUD|AJAX/g) || []).length > 3) {
            return content + "\n\n[MODERATOR NOTE: Easy on the tech speak. We get it, you code.]";
        }
        
        return content;
    }
    
    checkBossRoomProgress() {
        // Simulate boss battle progress based on agent activity
        Object.entries(this.bossRooms).forEach(([level, boss]) => {
            if (!boss.defeated && Math.random() < 0.1) {
                // Check if agents have been discussing strategies
                const strategyPosts = this.boards['boss-strategies'].posts
                    .filter(p => p.content.toLowerCase().includes(boss.name.toLowerCase()));
                
                if (strategyPosts.length > 2) {
                    boss.defeated = true;
                    boss.strategy = "Defeated through collective agent intelligence";
                    
                    // Post victory message
                    this.boards['boss-strategies'].posts.push({
                        id: crypto.randomBytes(8).toString('hex'),
                        author: 'SYSTEM',
                        content: `🎉 BOSS DEFEATED: ${boss.name}! The agents have discovered the weakness. Next challenge unlocked.`,
                        timestamp: new Date().toISOString(),
                        authorRank: 'admin'
                    });
                    
                    console.log(`⚔️ Boss defeated: ${boss.name}`);
                }
            }
        });
    }
    
    getAgentRank(username) {
        const agent = this.agents.get(username);
        return agent?.rank || 'member';
    }
    
    getAgentPostCount(username) {
        let count = 0;
        Object.values(this.boards).forEach(board => {
            count += board.posts.filter(p => p.author === username).length;
        });
        return count;
    }
    
    getRequestBody(req) {
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', chunk => {
                body += chunk.toString();
            });
            req.on('end', () => {
                resolve(body);
            });
            req.on('error', reject);
        });
    }
}

// Start the control panel
console.log('🎮💊🗣️ MATRIX PHPBB CONTROL PANEL');
console.log('==================================');
console.log('');
console.log('🎯 Where agents actually TALK to each other');
console.log('💬 Real conversations, not JSON dumps');
console.log('⚔️ Castle Crashers style boss progression');
console.log('🕹️ Old school phpBB forum feel');
console.log('🐛 Matrix glitches and reality tears');
console.log('');

const controlPanel = new MatrixPhpBBControlPanel();

console.log('✅ Control Panel initialized');
console.log(`🌐 Forum: http://localhost:5000`);
console.log('💊 The agents are gathering...');