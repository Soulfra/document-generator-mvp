#!/usr/bin/env node

const express = require('express');
const WebSocket = require('ws');

class RetroPuzzleSolver {
    constructor() {
        this.app = express();
        this.port = 8082;
        this.wsPort = 8083;
        
        // Game-style system mapping - like Sonic rings or Minesweeper grid
        this.gameGrid = {
            // Row 1: Foundation Layer (like Sonic's ring patterns)
            A1: { name: 'Soulfra Engine', port: 7881, type: 'foundation', unlocks: ['B1', 'A2'] },
            A2: { name: 'Web3 World', port: 7880, type: 'foundation', unlocks: ['B2', 'A3'] },
            A3: { name: 'Whisper Bridge', port: 7908, type: 'bridge', unlocks: ['B3'] },
            
            // Row 2: Intelligence Layer (like power-ups)
            B1: { name: 'Language AI', port: 7900, type: 'intelligence', unlocks: ['C1'] },
            B2: { name: 'Emoji Transform', port: 7902, type: 'intelligence', unlocks: ['C2'] },
            B3: { name: 'Tutorial Guide', port: 7892, type: 'guide', unlocks: ['C3'] },
            
            // Row 3: Control Layer (like boss battles)
            C1: { name: 'Dungeon Master', port: 7904, type: 'controller', unlocks: ['FINAL'] },
            C2: { name: 'Agent Network', port: 7906, type: 'controller', unlocks: ['FINAL'] },
            C3: { name: 'Master Control', port: 8000, type: 'master', unlocks: ['VICTORY'] }
        };
        
        // Game state - like Minesweeper flags
        this.gameState = {
            discovered: new Set(),
            active: new Set(),
            unlocked: new Set(['A1', 'A2', 'A3']), // Starting positions
            sequence: [],
            score: 0,
            level: 1,
            combo: 0
        };
        
        // Puzzle patterns - like Sonic bonus stage patterns
        this.puzzlePatterns = {
            'sonic_ring': ['A1', 'A2', 'A3'], // Linear foundation
            'minesweeper_corner': ['A1', 'B1', 'C1'], // L-shape activation
            'power_sequence': ['A2', 'B2', 'C2'], // Diagonal power
            'master_unlock': ['C1', 'C2', 'C3'] // Final sequence
        };
        
        this.setupRoutes();
        this.setupWebSocket();
        this.startGameEngine();
    }
    
    setupRoutes() {
        this.app.use(express.static('public'));
        
        this.app.get('/', (req, res) => {
            res.send(this.generateGameInterface());
        });
        
        // Game move endpoint
        this.app.post('/api/move/:position', (req, res) => {
            const result = this.makeMove(req.params.position);
            res.json(result);
        });
        
        // Check puzzle solution
        this.app.post('/api/solve-pattern/:pattern', (req, res) => {
            const result = this.solvePuzzlePattern(req.params.pattern);
            res.json(result);
        });
        
        // Get hint like game guides
        this.app.get('/api/hint', (req, res) => {
            const hint = this.getGameHint();
            res.json(hint);
        });
        
        // Auto-solve like cheat codes
        this.app.post('/api/cheat/auto-solve', (req, res) => {
            const result = this.autoSolve();
            res.json(result);
        });
    }
    
    setupWebSocket() {
        this.wss = new WebSocket.Server({ port: this.wsPort });
        
        this.wss.on('connection', (ws) => {
            console.log('🎮 Player connected to puzzle game');
            
            // Send initial game state
            ws.send(JSON.stringify({
                type: 'game_state',
                data: this.getGameState()
            }));
            
            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleGameAction(data, ws);
                } catch (error) {
                    ws.send(JSON.stringify({ type: 'error', error: error.message }));
                }
            });
        });
    }
    
    makeMove(position) {
        if (!this.gameState.unlocked.has(position)) {
            return {
                success: false,
                message: 'Position locked - need to unlock prerequisites first',
                hint: this.getUnlockHint(position)
            };
        }
        
        const cell = this.gameGrid[position];
        if (!cell) {
            return { success: false, message: 'Invalid position' };
        }
        
        // Try to activate the system
        const activated = this.activateSystem(cell);
        
        if (activated) {
            this.gameState.active.add(position);
            this.gameState.discovered.add(position);
            this.gameState.sequence.push(position);
            
            // Unlock connected cells
            cell.unlocks.forEach(unlock => {
                this.gameState.unlocked.add(unlock);
            });
            
            // Update score and combo
            this.gameState.combo++;
            this.gameState.score += this.gameState.combo * 100;
            
            // Check for pattern completion
            const patterns = this.checkPatternCompletion();
            
            this.broadcastGameState();
            
            return {
                success: true,
                cell: cell,
                unlocked: cell.unlocks,
                score: this.gameState.score,
                combo: this.gameState.combo,
                patterns: patterns,
                nextMoves: this.getNextMoves()
            };
        } else {
            this.gameState.combo = 0; // Break combo on failure
            return {
                success: false,
                message: `Failed to activate ${cell.name} - system not responding`,
                hint: 'Try starting prerequisite systems first'
            };
        }
    }
    
    activateSystem(cell) {
        // Mock system activation - in real version would start actual services
        console.log(`🎯 Activating ${cell.name} on port ${cell.port}`);
        
        // Simulate success based on dependencies
        const prereqs = this.getPrerequisites(cell);
        const prereqsMet = prereqs.every(p => this.gameState.active.has(p));
        
        return Math.random() > 0.3 && prereqsMet; // 70% success if prereqs met
    }
    
    getPrerequisites(cell) {
        // Define dependency chains like game unlock requirements
        const dependencies = {
            'Language AI': ['Soulfra Engine'],
            'Emoji Transform': ['Web3 World'],
            'Tutorial Guide': ['Whisper Bridge'],
            'Dungeon Master': ['Language AI', 'Emoji Transform'],
            'Agent Network': ['Language AI', 'Tutorial Guide'],
            'Master Control': ['Dungeon Master', 'Agent Network']
        };
        
        const deps = dependencies[cell.name] || [];
        return Object.keys(this.gameGrid)
            .filter(pos => deps.includes(this.gameGrid[pos].name));
    }
    
    solvePuzzlePattern(patternName) {
        const pattern = this.puzzlePatterns[patternName];
        if (!pattern) {
            return { success: false, message: 'Unknown pattern' };
        }
        
        // Execute pattern sequence
        const results = [];
        let success = true;
        
        for (const position of pattern) {
            const result = this.makeMove(position);
            results.push(result);
            if (!result.success) {
                success = false;
                break;
            }
        }
        
        if (success) {
            this.gameState.score += 1000; // Bonus for pattern completion
            return {
                success: true,
                message: `Pattern '${patternName}' completed!`,
                bonus: 1000,
                results: results
            };
        } else {
            return {
                success: false,
                message: `Pattern '${patternName}' failed`,
                results: results
            };
        }
    }
    
    getGameHint() {
        const hints = [
            "🎯 Start with foundation systems (A row) like collecting rings in order",
            "⚡ Build combos by activating connected systems quickly",
            "🔓 Some systems unlock others - check the connection lines",
            "🎮 Try the 'sonic_ring' pattern for a good start",
            "💡 Master Control is the final boss - need C1 and C2 first",
            "🔥 Higher combos = more points, but one failure breaks the chain"
        ];
        
        return {
            hint: hints[Math.floor(Math.random() * hints.length)],
            nextBestMove: this.getNextBestMove(),
            availableMoves: Array.from(this.gameState.unlocked).filter(p => !this.gameState.active.has(p))
        };
    }
    
    getNextBestMove() {
        // Game AI suggests best next move like hint systems
        const available = Array.from(this.gameState.unlocked)
            .filter(p => !this.gameState.active.has(p));
        
        // Prioritize foundation systems first
        const foundation = available.filter(p => this.gameGrid[p]?.type === 'foundation');
        if (foundation.length > 0) return foundation[0];
        
        // Then intelligence systems
        const intel = available.filter(p => this.gameGrid[p]?.type === 'intelligence');
        if (intel.length > 0) return intel[0];
        
        // Finally controllers
        return available[0];
    }
    
    autoSolve() {
        // Cheat code - solve entire puzzle automatically
        const sequence = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3'];
        const results = [];
        
        for (const pos of sequence) {
            if (!this.gameState.active.has(pos)) {
                const result = this.makeMove(pos);
                results.push(result);
                
                // Small delay to show progression
                if (result.success) {
                    console.log(`✅ Auto-activated ${this.gameGrid[pos].name}`);
                }
            }
        }
        
        return {
            success: true,
            message: 'AUTO-SOLVE ACTIVATED! All systems unlocked!',
            sequence: sequence,
            results: results,
            finalScore: this.gameState.score
        };
    }
    
    checkPatternCompletion() {
        const completed = [];
        
        for (const [name, pattern] of Object.entries(this.puzzlePatterns)) {
            const isComplete = pattern.every(pos => this.gameState.active.has(pos));
            if (isComplete && !this.gameState.completedPatterns?.has(name)) {
                completed.push(name);
                if (!this.gameState.completedPatterns) {
                    this.gameState.completedPatterns = new Set();
                }
                this.gameState.completedPatterns.add(name);
            }
        }
        
        return completed;
    }
    
    getGameState() {
        return {
            grid: this.gameGrid,
            state: {
                discovered: Array.from(this.gameState.discovered),
                active: Array.from(this.gameState.active),
                unlocked: Array.from(this.gameState.unlocked),
                sequence: this.gameState.sequence,
                score: this.gameState.score,
                level: this.gameState.level,
                combo: this.gameState.combo
            },
            patterns: this.puzzlePatterns,
            completedPatterns: Array.from(this.gameState.completedPatterns || [])
        };
    }
    
    broadcastGameState() {
        const state = {
            type: 'game_state_update',
            data: this.getGameState()
        };
        
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(state));
            }
        });
    }
    
    startGameEngine() {
        // Game loop - check for victory conditions, update scores, etc.
        setInterval(() => {
            this.updateGameLogic();
        }, 5000);
    }
    
    updateGameLogic() {
        // Check victory condition
        if (this.gameState.active.size >= 8) {
            this.gameState.level = 'COMPLETE';
            console.log('🎉 PUZZLE SOLVED! All systems active!');
        }
        
        // Decay combo if no recent activity
        if (Date.now() - (this.lastMove || 0) > 30000) {
            this.gameState.combo = Math.max(0, this.gameState.combo - 1);
        }
    }
    
    generateGameInterface() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>🎮 Retro System Puzzle Solver</title>
    <style>
        body { 
            font-family: 'Courier New', monospace; 
            background: linear-gradient(45deg, #001122, #000000, #002211);
            color: #00ff00; 
            margin: 0; 
            padding: 20px;
            min-height: 100vh;
        }
        .game-container { 
            max-width: 1200px; 
            margin: 0 auto; 
            background: rgba(0, 20, 0, 0.9);
            border: 3px solid #00ff00;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 0 30px #00ff00;
        }
        .game-header {
            text-align: center;
            font-size: 24px;
            margin-bottom: 30px;
            padding: 20px;
            background: linear-gradient(90deg, #001100, #003300, #001100);
            border: 2px solid #00ff00;
            border-radius: 10px;
            animation: glow 2s ease-in-out infinite alternate;
        }
        @keyframes glow {
            from { box-shadow: 0 0 20px #00ff00; }
            to { box-shadow: 0 0 40px #ffff00; }
        }
        .game-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin: 30px 0;
            padding: 20px;
            background: rgba(0, 0, 0, 0.7);
            border-radius: 10px;
        }
        .grid-cell {
            aspect-ratio: 1;
            border: 2px solid #444;
            background: rgba(20, 20, 20, 0.8);
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
            padding: 10px;
            text-align: center;
        }
        .grid-cell.unlocked {
            border-color: #00aa00;
            background: rgba(0, 50, 0, 0.3);
        }
        .grid-cell.active {
            border-color: #00ff00;
            background: rgba(0, 100, 0, 0.5);
            box-shadow: 0 0 15px #00ff00;
            animation: pulse 1s ease-in-out infinite alternate;
        }
        .grid-cell.locked {
            border-color: #666;
            background: rgba(50, 50, 50, 0.3);
            cursor: not-allowed;
            opacity: 0.5;
        }
        @keyframes pulse {
            from { transform: scale(1); }
            to { transform: scale(1.05); }
        }
        .grid-cell:hover.unlocked {
            border-color: #ffff00;
            transform: scale(1.1);
        }
        .cell-label {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 5px;
        }
        .cell-name {
            font-size: 11px;
            text-align: center;
            line-height: 1.2;
        }
        .cell-port {
            font-size: 9px;
            color: #888;
            margin-top: 5px;
        }
        .game-controls {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin: 20px 0;
        }
        .control-btn {
            background: linear-gradient(135deg, #004400, #006600);
            color: #fff;
            border: 2px solid #00aa00;
            padding: 12px 20px;
            border-radius: 8px;
            cursor: pointer;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            transition: all 0.3s ease;
        }
        .control-btn:hover {
            background: linear-gradient(135deg, #006600, #008800);
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 255, 0, 0.3);
        }
        .pattern-buttons {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            margin: 15px 0;
        }
        .pattern-btn {
            background: #333;
            color: #00ff00;
            border: 1px solid #00aa00;
            padding: 8px 15px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.3s ease;
        }
        .pattern-btn:hover {
            background: #00aa00;
            color: #000;
        }
        .pattern-btn.completed {
            background: #ffaa00;
            color: #000;
            border-color: #ffaa00;
        }
        .score-display {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin: 20px 0;
        }
        .score-item {
            text-align: center;
            padding: 15px;
            background: rgba(0, 50, 0, 0.5);
            border: 1px solid #00aa00;
            border-radius: 8px;
        }
        .score-value {
            font-size: 24px;
            font-weight: bold;
            color: #ffff00;
        }
        .hint-display {
            background: rgba(0, 0, 100, 0.3);
            border: 1px solid #0088ff;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
        }
        .game-log {
            background: #000;
            border: 1px solid #00aa00;
            border-radius: 8px;
            padding: 15px;
            max-height: 200px;
            overflow-y: auto;
            font-size: 12px;
            margin: 20px 0;
        }
        .connection-line {
            position: absolute;
            background: #00aa00;
            height: 2px;
            opacity: 0.6;
            pointer-events: none;
        }
    </style>
</head>
<body>
    <div class="game-container">
        <div class="game-header">
            🎮 RETRO SYSTEM PUZZLE SOLVER 🎮<br>
            <small>Like Minesweeper + Sonic - Figure out the sequence!</small>
        </div>
        
        <div class="score-display">
            <div class="score-item">
                <div class="score-value" id="scoreValue">0</div>
                <div>SCORE</div>
            </div>
            <div class="score-item">
                <div class="score-value" id="comboValue">0</div>
                <div>COMBO</div>
            </div>
            <div class="score-item">
                <div class="score-value" id="activeCount">0</div>
                <div>ACTIVE</div>
            </div>
            <div class="score-item">
                <div class="score-value" id="levelValue">1</div>
                <div>LEVEL</div>
            </div>
        </div>
        
        <div class="game-grid" id="gameGrid">
            <!-- Grid cells will be generated here -->
        </div>
        
        <div class="hint-display" id="hintDisplay">
            💡 Click on unlocked (green) cells to activate systems. Some systems unlock others!
        </div>
        
        <div>
            <h3>🎯 Pattern Challenges</h3>
            <div class="pattern-buttons">
                <button class="pattern-btn" onclick="solvePattern('sonic_ring')">🔵 Sonic Ring</button>
                <button class="pattern-btn" onclick="solvePattern('minesweeper_corner')">💣 Minesweeper</button>
                <button class="pattern-btn" onclick="solvePattern('power_sequence')">⚡ Power Chain</button>
                <button class="pattern-btn" onclick="solvePattern('master_unlock')">👑 Master Key</button>
            </div>
        </div>
        
        <div class="game-controls">
            <button class="control-btn" onclick="getHint()">💡 GET HINT</button>
            <button class="control-btn" onclick="resetGame()">🔄 RESET PUZZLE</button>
            <button class="control-btn" onclick="autoSolve()">🎯 AUTO-SOLVE</button>
            <button class="control-btn" onclick="showConnections()">🔗 SHOW PATHS</button>
        </div>
        
        <div class="game-log" id="gameLog">
            <div style="color: #00ff00;">🎮 Game initialized. Start with foundation systems (Row A)!</div>
        </div>
    </div>
    
    <script>
        let ws;
        let gameState = null;
        
        function connectWebSocket() {
            ws = new WebSocket('ws://localhost:8083');
            
            ws.onopen = () => {
                console.log('Connected to puzzle game');
                addToLog('🔌 Connected to game server');
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                handleGameMessage(data);
            };
            
            ws.onclose = () => {
                addToLog('❌ Lost connection to game server');
                setTimeout(connectWebSocket, 3000);
            };
        }
        
        function handleGameMessage(data) {
            switch (data.type) {
                case 'game_state':
                case 'game_state_update':
                    gameState = data.data;
                    updateGameDisplay();
                    break;
            }
        }
        
        function updateGameDisplay() {
            if (!gameState) return;
            
            // Update scores
            document.getElementById('scoreValue').textContent = gameState.state.score;
            document.getElementById('comboValue').textContent = gameState.state.combo;
            document.getElementById('activeCount').textContent = gameState.state.active.length;
            document.getElementById('levelValue').textContent = gameState.state.level;
            
            // Update grid
            updateGrid();
            
            // Update pattern buttons
            updatePatternButtons();
        }
        
        function updateGrid() {
            const grid = document.getElementById('gameGrid');
            grid.innerHTML = '';
            
            const positions = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3'];
            
            positions.forEach(pos => {
                const cell = gameState.grid[pos];
                const cellElement = document.createElement('div');
                cellElement.className = 'grid-cell';
                cellElement.id = pos;
                
                // Determine cell state
                if (gameState.state.active.includes(pos)) {
                    cellElement.classList.add('active');
                } else if (gameState.state.unlocked.includes(pos)) {
                    cellElement.classList.add('unlocked');
                } else {
                    cellElement.classList.add('locked');
                }
                
                cellElement.innerHTML = \`
                    <div class="cell-label">\${pos}</div>
                    <div class="cell-name">\${cell.name}</div>
                    <div class="cell-port">:\${cell.port}</div>
                \`;
                
                if (gameState.state.unlocked.includes(pos) && !gameState.state.active.includes(pos)) {
                    cellElement.onclick = () => makeMove(pos);
                }
                
                grid.appendChild(cellElement);
            });
        }
        
        function updatePatternButtons() {
            const buttons = document.querySelectorAll('.pattern-btn');
            buttons.forEach(btn => {
                const pattern = btn.onclick.toString().match(/'([^']+)'/)[1];
                if (gameState.completedPatterns.includes(pattern)) {
                    btn.classList.add('completed');
                }
            });
        }
        
        async function makeMove(position) {
            try {
                const response = await fetch(\`/api/move/\${position}\`, { method: 'POST' });
                const result = await response.json();
                
                if (result.success) {
                    addToLog(\`✅ Activated \${result.cell.name} - Score: \${result.score} (Combo: \${result.combo})\`);
                    if (result.unlocked.length > 0) {
                        addToLog(\`🔓 Unlocked: \${result.unlocked.join(', ')}\`);
                    }
                } else {
                    addToLog(\`❌ \${result.message}\`);
                    if (result.hint) {
                        addToLog(\`💡 Hint: \${result.hint}\`);
                    }
                }
            } catch (error) {
                addToLog(\`❌ Error: \${error.message}\`);
            }
        }
        
        async function solvePattern(pattern) {
            try {
                const response = await fetch(\`/api/solve-pattern/\${pattern}\`, { method: 'POST' });
                const result = await response.json();
                
                if (result.success) {
                    addToLog(\`🎉 Pattern '\${pattern}' completed! Bonus: \${result.bonus}\`);
                } else {
                    addToLog(\`❌ Pattern '\${pattern}' failed\`);
                }
            } catch (error) {
                addToLog(\`❌ Error: \${error.message}\`);
            }
        }
        
        async function getHint() {
            try {
                const response = await fetch('/api/hint');
                const hint = await response.json();
                
                document.getElementById('hintDisplay').innerHTML = \`
                    💡 \${hint.hint}<br>
                    🎯 Next best move: \${hint.nextBestMove}<br>
                    🔓 Available: \${hint.availableMoves.join(', ')}
                \`;
            } catch (error) {
                addToLog(\`❌ Error getting hint: \${error.message}\`);
            }
        }
        
        async function autoSolve() {
            if (confirm('Use auto-solve cheat code? This will complete the entire puzzle!')) {
                try {
                    const response = await fetch('/api/cheat/auto-solve', { method: 'POST' });
                    const result = await response.json();
                    
                    addToLog('🎯 AUTO-SOLVE ACTIVATED!');
                    addToLog(\`🎉 Final Score: \${result.finalScore}\`);
                } catch (error) {
                    addToLog(\`❌ Auto-solve error: \${error.message}\`);
                }
            }
        }
        
        function resetGame() {
            if (confirm('Reset the entire puzzle game?')) {
                location.reload();
            }
        }
        
        function showConnections() {
            addToLog('🔗 Connection paths shown in grid layout');
            // Could add visual connection lines here
        }
        
        function addToLog(message) {
            const log = document.getElementById('gameLog');
            const timestamp = new Date().toLocaleTimeString();
            const line = \`[\${timestamp}] \${message}\`;
            
            log.innerHTML = line + '<br>' + log.innerHTML;
            
            // Keep only last 20 lines
            const lines = log.innerHTML.split('<br>');
            if (lines.length > 20) {
                log.innerHTML = lines.slice(0, 20).join('<br>');
            }
        }
        
        // Initialize
        connectWebSocket();
    </script>
</body>
</html>
        `;
    }
    
    start() {
        this.app.listen(this.port, () => {
            console.log('🎮 Retro Puzzle Solver running on http://localhost:' + this.port);
            console.log('🔌 Game WebSocket running on ws://localhost:' + this.wsPort);
            console.log('🎯 PUZZLE GAME READY - Solve the system sequence!');
            console.log('💡 Like Minesweeper + Sonic - figure out the right order!');
        });
    }
}

// Start the puzzle game
const puzzleGame = new RetroPuzzleSolver();
puzzleGame.start();