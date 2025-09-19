#!/usr/bin/env node

/**
 * 🎮 INTEGRATED GAME SERVER
 * Combines all gaming engines into one unified platform
 * - Classic games (Minesweeper, Chess, etc.)
 * - Study games from documents
 * - D2JSP-style inventory system
 * - Eyeball tracking for learning
 */

const http = require('http');
const WebSocket = require('ws');
const { EventEmitter } = require('events');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class IntegratedGameServer extends EventEmitter {
    constructor() {
        super();
        
        this.port = 9600;
        this.games = new Map();
        this.players = new Map();
        this.studyMaterials = new Map();
        
        // Game engines
        this.classicGames = new ClassicGamesEngine();
        this.studyGames = new StudyGamesEngine();
        this.d2jspEngine = new D2JSPEngine();
        this.eyeballEngine = new EyeballLearningEngine();
        
        console.log('🎮 INTEGRATED GAME SERVER INITIALIZING...');
        console.log('🕹️ Classic games engine loading...');
        console.log('📚 Study games engine loading...');
        console.log('🎒 D2JSP inventory system loading...');
        console.log('👁️ Eyeball learning engine loading...');
    }
    
    async initialize() {
        // Create HTTP server
        this.server = http.createServer((req, res) => {
            this.handleRequest(req, res);
        });
        
        // Create WebSocket server
        this.wss = new WebSocket.Server({ server: this.server });
        
        this.wss.on('connection', (ws, req) => {
            this.handleWebSocket(ws, req);
        });
        
        // Start server
        await new Promise((resolve) => {
            this.server.listen(this.port, () => {
                console.log(`🎮 Game Server running on http://localhost:${this.port}`);
                resolve();
            });
        });
        
        // Initialize game engines
        await this.classicGames.initialize();
        await this.studyGames.initialize();
        await this.d2jspEngine.initialize();
        await this.eyeballEngine.initialize();
        
        console.log('✨ INTEGRATED GAME SERVER READY! ✨');
        return true;
    }
    
    handleRequest(req, res) {
        const url = new URL(req.url, `http://${req.headers.host}`);
        
        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }
        
        // Route requests
        switch (url.pathname) {
            case '/api/games':
                this.serveGameList(res);
                break;
            case '/api/player':
                this.servePlayerData(req, res);
                break;
            case '/api/study/upload':
                if (req.method === 'POST') {
                    this.handleStudyUpload(req, res);
                }
                break;
            case '/api/game/start':
                if (req.method === 'POST') {
                    this.handleGameStart(req, res);
                }
                break;
            case '/api/game/action':
                if (req.method === 'POST') {
                    this.handleGameAction(req, res);
                }
                break;
            default:
                res.writeHead(404);
                res.end('Not found');
        }
    }
    
    handleWebSocket(ws, req) {
        const playerId = crypto.randomUUID();
        
        const player = {
            id: playerId,
            ws: ws,
            currentGame: null,
            coins: 1000,
            inventory: [],
            stats: {
                gamesPlayed: 0,
                studyTime: 0,
                accuracy: 0
            }
        };
        
        this.players.set(playerId, player);
        
        // Send welcome message
        ws.send(JSON.stringify({
            type: 'welcome',
            playerId: playerId,
            coins: player.coins
        }));
        
        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message);
                this.handlePlayerMessage(player, data);
            } catch (error) {
                console.error('WebSocket message error:', error);
            }
        });
        
        ws.on('close', () => {
            this.players.delete(playerId);
            
            // Clean up any active games
            if (player.currentGame) {
                this.games.delete(player.currentGame);
            }
        });
    }
    
    async handlePlayerMessage(player, data) {
        switch (data.type) {
            case 'startGame':
                await this.startGame(player, data.gameType);
                break;
            case 'gameAction':
                await this.processGameAction(player, data.action);
                break;
            case 'studyUpload':
                await this.processStudyMaterial(player, data.content, data.type);
                break;
            case 'eyeballTrack':
                await this.processEyeballTracking(player, data.tracking);
                break;
        }
    }
    
    async startGame(player, gameType) {
        const gameId = crypto.randomUUID();
        
        let gameInstance;
        switch (gameType) {
            case 'minesweeper':
                gameInstance = this.classicGames.createMinesweeper();
                break;
            case 'chess':
                gameInstance = this.classicGames.createChess();
                break;
            case 'flashcards':
                gameInstance = this.studyGames.createFlashcards(player.studyMaterials);
                break;
            case 'quiz':
                gameInstance = this.studyGames.createQuizGame(player.studyMaterials);
                break;
            case 'docgame':
                gameInstance = this.studyGames.createDocumentGame(player.studyMaterials);
                break;
            case 'eyetrack':
                gameInstance = this.eyeballEngine.createEyeTrackingGame();
                break;
            case 'd2jsp':
                gameInstance = this.d2jspEngine.createInventoryGame(player);
                break;
            default:
                player.ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Unknown game type'
                }));
                return;
        }
        
        gameInstance.id = gameId;
        gameInstance.playerId = player.id;
        
        this.games.set(gameId, gameInstance);
        player.currentGame = gameId;
        
        player.ws.send(JSON.stringify({
            type: 'gameStarted',
            gameId: gameId,
            gameType: gameType,
            gameState: gameInstance.getState()
        }));
    }
    
    async processGameAction(player, action) {
        if (!player.currentGame) {
            player.ws.send(JSON.stringify({
                type: 'error',
                message: 'No active game'
            }));
            return;
        }
        
        const game = this.games.get(player.currentGame);
        if (!game) return;
        
        const result = await game.processAction(action);
        
        // Update player stats
        if (result.completed) {
            player.stats.gamesPlayed++;
            
            if (result.won) {
                player.coins += result.reward || 0;
            }
            
            // Clean up game
            this.games.delete(player.currentGame);
            player.currentGame = null;
        }
        
        player.ws.send(JSON.stringify({
            type: 'gameUpdate',
            gameState: game.getState(),
            result: result
        }));
    }
    
    async processStudyMaterial(player, content, type = 'text') {
        try {
            // Process the document content into study concepts
            const processedConcepts = await this.studyGames.processDocument(content, type);
            
            // Store processed material for the player
            if (!player.studyMaterials) {
                player.studyMaterials = [];
            }
            
            const materialId = crypto.randomUUID();
            const studyMaterial = {
                id: materialId,
                type: type,
                content: processedConcepts,
                uploadedAt: Date.now(),
                processed: true
            };
            
            player.studyMaterials.push(studyMaterial);
            
            // Send confirmation to player
            player.ws.send(JSON.stringify({
                type: 'studyMaterialProcessed',
                materialId: materialId,
                conceptsExtracted: processedConcepts.length,
                availableGameTypes: ['flashcards', 'quiz', 'docgame'],
                subjects: [...new Set(processedConcepts.map(c => c.subject).filter(Boolean))],
                summary: {
                    definitions: processedConcepts.filter(c => c.type === 'definition').length,
                    formulas: processedConcepts.filter(c => c.type === 'formula').length,
                    problems: processedConcepts.filter(c => c.type === 'problem').length,
                    concepts: processedConcepts.filter(c => c.type === 'conceptual').length
                }
            }));
            
            console.log(`📚 Processed study material for player ${player.id}: ${processedConcepts.length} concepts`);
            
        } catch (error) {
            console.error('Error processing study material:', error);
            player.ws.send(JSON.stringify({
                type: 'error',
                message: 'Failed to process study material',
                details: error.message
            }));
        }
    }
    
    async processEyeballTracking(player, trackingData) {
        // Handle eyeball tracking for visual learning games
        try {
            const eyeTrackingResult = await this.eyeballEngine.processTracking(trackingData);
            
            player.ws.send(JSON.stringify({
                type: 'eyeTrackingProcessed',
                result: eyeTrackingResult
            }));
            
        } catch (error) {
            console.error('Error processing eye tracking:', error);
        }
    }
    
    async handleStudyUpload(req, res) {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const materialId = crypto.randomUUID();
                
                // Process document into study material
                const processed = await this.studyGames.processDocument(data.content, data.type);
                
                this.studyMaterials.set(materialId, {
                    id: materialId,
                    type: data.type,
                    content: processed,
                    created: Date.now()
                });
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    materialId: materialId,
                    gameTypes: ['flashcards', 'quiz', 'matching']
                }));
                
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: error.message }));
            }
        });
    }
    
    serveGameList(res) {
        const games = [
            // Classic Games
            {
                id: 'minesweeper',
                name: 'Crypto Sweeper',
                category: 'classic',
                description: 'Find hidden treasures',
                icon: '💣',
                reward: 50
            },
            {
                id: 'chess',
                name: 'Battle Chess',
                category: 'classic',
                description: 'Strategic warfare',
                icon: '♟️',
                reward: 100
            },
            {
                id: 'geowars',
                name: 'Neon Wars',
                category: 'classic',
                description: 'Geometry shooter',
                icon: '🌟',
                reward: 10
            },
            
            // Study Games
            {
                id: 'flashcards',
                name: 'Memory Match',
                category: 'study',
                description: 'Test your knowledge',
                icon: '🎴',
                reward: 20
            },
            {
                id: 'quiz',
                name: 'Speed Quiz',
                category: 'study',
                description: 'Quick-fire questions',
                icon: '❓',
                reward: 25
            },
            
            // Document Games
            {
                id: 'docgame',
                name: 'Doc Explorer',
                category: 'document',
                description: 'Turn docs into games',
                icon: '📄',
                reward: 30
            },
            
            // Eyeball Games
            {
                id: 'eyetrack',
                name: 'Focus Master',
                category: 'eyeball',
                description: 'Eye tracking study',
                icon: '👁️',
                reward: 40
            },
            
            // D2JSP Games
            {
                id: 'd2jsp',
                name: 'Inventory Quest',
                category: 'd2jsp',
                description: 'Manage your loot',
                icon: '🎒',
                reward: 60
            }
        ];
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(games));
    }
}

// Classic Games Engine
class ClassicGamesEngine {
    async initialize() {
        console.log('🕹️ Classic games ready');
    }
    
    createMinesweeper() {
        const gridSize = 8;
        const mineCount = 10;
        const grid = [];
        
        // Initialize grid
        for (let i = 0; i < gridSize * gridSize; i++) {
            grid.push({
                isMine: false,
                isRevealed: false,
                isFlagged: false,
                neighborMines: 0
            });
        }
        
        // Place mines
        let placed = 0;
        while (placed < mineCount) {
            const index = Math.floor(Math.random() * grid.length);
            if (!grid[index].isMine) {
                grid[index].isMine = true;
                placed++;
            }
        }
        
        // Calculate neighbors
        for (let i = 0; i < grid.length; i++) {
            if (!grid[i].isMine) {
                grid[i].neighborMines = this.countNeighborMines(i, gridSize, grid);
            }
        }
        
        return {
            type: 'minesweeper',
            grid: grid,
            gridSize: gridSize,
            minesRemaining: mineCount,
            startTime: Date.now(),
            
            processAction(action) {
                if (action.type === 'reveal') {
                    const cell = this.grid[action.index];
                    if (cell.isRevealed || cell.isFlagged) return {};
                    
                    cell.isRevealed = true;
                    
                    if (cell.isMine) {
                        return { completed: true, won: false };
                    }
                    
                    // Check win
                    const unrevealed = this.grid.filter(c => !c.isRevealed && !c.isMine).length;
                    if (unrevealed === 0) {
                        const time = Math.floor((Date.now() - this.startTime) / 1000);
                        return { completed: true, won: true, reward: 50, time: time };
                    }
                    
                    return { success: true };
                    
                } else if (action.type === 'flag') {
                    const cell = this.grid[action.index];
                    if (!cell.isRevealed) {
                        cell.isFlagged = !cell.isFlagged;
                    }
                    return { success: true };
                }
            },
            
            getState() {
                return {
                    grid: this.grid.map((cell, index) => ({
                        index: index,
                        isRevealed: cell.isRevealed,
                        isFlagged: cell.isFlagged,
                        value: cell.isRevealed ? (cell.isMine ? '💣' : cell.neighborMines || '') : ''
                    })),
                    gridSize: this.gridSize
                };
            }
        };
    }
    
    countNeighborMines(index, gridSize, grid) {
        let count = 0;
        const row = Math.floor(index / gridSize);
        const col = index % gridSize;
        
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                
                const newRow = row + dr;
                const newCol = col + dc;
                
                if (newRow >= 0 && newRow < gridSize && newCol >= 0 && newCol < gridSize) {
                    const neighborIndex = newRow * gridSize + newCol;
                    if (grid[neighborIndex].isMine) count++;
                }
            }
        }
        
        return count;
    }
    
    createChess() {
        // Simplified chess implementation
        return {
            type: 'chess',
            board: this.initializeChessBoard(),
            currentPlayer: 'white',
            
            processAction(action) {
                // Chess move logic here
                return { success: true };
            },
            
            getState() {
                return {
                    board: this.board,
                    currentPlayer: this.currentPlayer
                };
            }
        };
    }
    
    initializeChessBoard() {
        // Standard chess starting position
        return [
            ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'],
            ['♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟'],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            [null, null, null, null, null, null, null, null],
            ['♙', '♙', '♙', '♙', '♙', '♙', '♙', '♙'],
            ['♖', '♘', '♗', '♕', '♔', '♗', '♘', '♖']
        ];
    }
}

// Study Games Engine
class StudyGamesEngine {
    async initialize() {
        console.log('📚 Study games ready');
    }
    
    async processDocument(content, type) {
        // Enhanced document processing for MCAT/LSAT study materials
        const concepts = [];
        
        if (type === 'text' || type === 'pdf' || type === 'screenshot') {
            // Pattern matchers for different question types
            const patterns = {
                // MCAT patterns
                mcatBiology: /(?:enzyme|protein|cell|membrane|DNA|RNA|ATP|metabolism|respiration)/i,
                mcatChemistry: /(?:mole|equilibrium|acid|base|pH|reaction|oxidation|reduction)/i,
                mcatPhysics: /(?:force|velocity|acceleration|energy|momentum|wave|electric|magnetic)/i,
                mcatPsychology: /(?:behavior|cognition|memory|perception|personality|social|development)/i,
                
                // LSAT patterns
                lsatLogic: /(?:if.*then|therefore|because|since|although|however|must|cannot)/i,
                lsatReading: /(?:author|passage|main idea|purpose|implies|suggests|infer)/i,
                lsatArgument: /(?:conclusion|premise|assumption|strengthen|weaken|flaw)/i,
                
                // Question patterns
                directQuestion: /(.+)\?/g,
                definition: /(?:what is|define|meaning of)\s+([^.?]+)/gi,
                comparison: /(?:difference between|compare|contrast)\s+([^.?]+)/gi,
                listType: /(?:list|name|identify|enumerate)\s+([^.?]+)/gi
            };
            
            // Process content line by line for better extraction
            const lines = content.split(/\n+/);
            let currentTopic = null;
            let questionBuffer = [];
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                
                // Detect topic headers
                if (line.match(/^(Chapter|Section|Topic|Unit)\s+\d+:?\s*(.+)/i)) {
                    currentTopic = RegExp.$2;
                    continue;
                }
                
                // Extract Q&A from definition formats
                const defMatch = line.match(/^(.+?):\s*(.+)$/);
                if (defMatch && defMatch[2].length > 10) {
                    concepts.push({
                        question: `What is ${defMatch[1]}?`,
                        answer: defMatch[2],
                        topic: currentTopic,
                        type: 'definition'
                    });
                    continue;
                }
                
                // Extract direct questions and their answers
                if (line.endsWith('?')) {
                    questionBuffer = [line];
                    // Look for answer in next few lines
                    for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
                        const potentialAnswer = lines[j].trim();
                        if (potentialAnswer && !potentialAnswer.endsWith('?')) {
                            concepts.push({
                                question: line,
                                answer: potentialAnswer,
                                topic: currentTopic,
                                type: 'direct'
                            });
                            i = j; // Skip processed lines
                            break;
                        }
                    }
                    continue;
                }
                
                // Extract fact-based content for flashcards
                if (line.length > 30 && line.length < 300) {
                    // Check for MCAT content
                    for (const [subject, pattern] of Object.entries(patterns)) {
                        if (subject.startsWith('mcat') && pattern.test(line)) {
                            const keyTerms = line.match(pattern);
                            if (keyTerms) {
                                concepts.push({
                                    question: `Explain: ${keyTerms[0]} in the context of "${this.extractContext(line, keyTerms[0])}"`,
                                    answer: line,
                                    topic: currentTopic || subject.replace('mcat', ''),
                                    type: 'conceptual',
                                    subject: subject
                                });
                            }
                        }
                    }
                    
                    // Check for LSAT content
                    if (patterns.lsatLogic.test(line)) {
                        concepts.push({
                            question: 'Analyze the logical structure of this statement:',
                            answer: line,
                            topic: currentTopic || 'Logic',
                            type: 'analytical',
                            subject: 'lsat'
                        });
                    }
                }
                
                // Extract numbered or bulleted lists
                if (line.match(/^(\d+\.|[•\-\*])\s+(.+)/)) {
                    const listItem = RegExp.$2;
                    if (i > 0 && lines[i-1].match(/(.+):$/)) {
                        const listTitle = RegExp.$1;
                        concepts.push({
                            question: `List item under "${listTitle}"?`,
                            answer: listItem,
                            topic: currentTopic,
                            type: 'list'
                        });
                    }
                }
            }
            
            // Process any formulas or equations
            const formulaPattern = /([A-Za-z]+)\s*=\s*(.+)/g;
            let formulaMatch;
            while ((formulaMatch = formulaPattern.exec(content)) !== null) {
                concepts.push({
                    question: `What is the formula for ${formulaMatch[1]}?`,
                    answer: formulaMatch[0],
                    topic: currentTopic || 'Formulas',
                    type: 'formula'
                });
            }
            
            // Add practice problem detection
            const problemPattern = /(?:Example|Problem|Question)\s*\d*:?\s*(.+?)(?:Solution|Answer):?\s*(.+?)(?=Example|Problem|Question|\n\n|$)/gis;
            let problemMatch;
            while ((problemMatch = problemPattern.exec(content)) !== null) {
                concepts.push({
                    question: problemMatch[1].trim(),
                    answer: problemMatch[2].trim(),
                    topic: currentTopic || 'Practice Problems',
                    type: 'problem'
                });
            }
        }
        
        // Process screenshots specifically
        if (type === 'screenshot') {
            // Add screenshot-specific processing
            concepts.push({
                question: 'Identify the key concepts in this screenshot',
                answer: 'Visual analysis required - use eyeball tracking',
                topic: 'Visual Learning',
                type: 'visual',
                requiresEyeTracking: true
            });
        }
        
        // Remove duplicates and ensure quality
        const uniqueConcepts = this.deduplicateConcepts(concepts);
        const qualityConcepts = uniqueConcepts.filter(c => 
            c.question.length > 10 && 
            c.answer.length > 5 &&
            c.question !== c.answer
        );
        
        console.log(`📚 Processed document: extracted ${qualityConcepts.length} study concepts`);
        return qualityConcepts;
    }
    
    extractKeyPhrase(sentence) {
        // Simple key phrase extraction
        const words = sentence.split(/\s+/);
        const importantWords = words.filter(w => w.length > 4);
        return importantWords.slice(0, 3).join(' ');
    }
    
    extractContext(text, term) {
        // Extract surrounding context for a term
        const index = text.toLowerCase().indexOf(term.toLowerCase());
        if (index === -1) return text.slice(0, 50) + '...';
        
        const start = Math.max(0, index - 20);
        const end = Math.min(text.length, index + term.length + 20);
        
        let context = text.slice(start, end);
        if (start > 0) context = '...' + context;
        if (end < text.length) context = context + '...';
        
        return context;
    }
    
    deduplicateConcepts(concepts) {
        // Remove duplicate concepts based on question similarity
        const seen = new Set();
        const unique = [];
        
        for (const concept of concepts) {
            const key = concept.question.toLowerCase().replace(/[^\w\s]/g, '');
            if (!seen.has(key)) {
                seen.add(key);
                unique.push(concept);
            }
        }
        
        return unique;
    }
    
    calculateDifficulty(concept) {
        // Calculate difficulty based on various factors
        let difficulty = 1;
        
        // Length-based difficulty
        if (concept.answer.length > 100) difficulty += 1;
        if (concept.question.length > 50) difficulty += 0.5;
        
        // Type-based difficulty
        const difficultyMap = {
            'definition': 1,
            'formula': 2,
            'problem': 3,
            'analytical': 3,
            'conceptual': 2.5,
            'visual': 2
        };
        
        difficulty += difficultyMap[concept.type] || 1;
        
        // Subject-based difficulty
        if (concept.subject && concept.subject.includes('mcat')) difficulty += 1;
        if (concept.subject === 'lsat') difficulty += 1.5;
        
        return Math.min(5, difficulty); // Cap at 5
    }
    
    shuffleWithDistribution(cards) {
        // Shuffle while maintaining subject distribution
        const subjects = [...new Set(cards.map(c => c.subject))];
        const result = [];
        const subjectCards = {};
        
        // Group by subject
        subjects.forEach(subject => {
            subjectCards[subject] = cards.filter(c => c.subject === subject);
        });
        
        // Interleave subjects
        let maxLength = Math.max(...Object.values(subjectCards).map(arr => arr.length));
        
        for (let i = 0; i < maxLength; i++) {
            subjects.forEach(subject => {
                if (subjectCards[subject][i]) {
                    result.push(subjectCards[subject][i]);
                }
            });
        }
        
        return result;
    }
    
    createFlashcards(studyMaterials = []) {
        // Default flashcards if no materials
        const defaultCards = [
            { question: "What is the powerhouse of the cell?", answer: "Mitochondria", type: "definition", subject: "biology" },
            { question: "What is DNA?", answer: "Deoxyribonucleic acid", type: "definition", subject: "biology" },
            { question: "What is the speed of light?", answer: "299,792,458 m/s", type: "formula", subject: "physics" }
        ];
        
        // Process study materials to create subject-categorized cards
        let cards = [];
        if (studyMaterials.length > 0) {
            // Organize by subject and type for adaptive learning
            const subjectGroups = {};
            
            studyMaterials.forEach(material => {
                if (material.content && Array.isArray(material.content)) {
                    material.content.forEach(concept => {
                        const subject = concept.subject || concept.topic || 'general';
                        if (!subjectGroups[subject]) {
                            subjectGroups[subject] = [];
                        }
                        
                        subjectGroups[subject].push({
                            question: concept.question,
                            answer: concept.answer,
                            type: concept.type || 'general',
                            subject: subject,
                            topic: concept.topic,
                            difficulty: this.calculateDifficulty(concept),
                            requiresEyeTracking: concept.requiresEyeTracking || false
                        });
                    });
                }
            });
            
            // Create balanced deck with all subjects
            for (const [subject, concepts] of Object.entries(subjectGroups)) {
                // Sort by difficulty for progressive learning
                concepts.sort((a, b) => a.difficulty - b.difficulty);
                cards.push(...concepts);
            }
            
            // Shuffle cards while maintaining some subject distribution
            cards = this.shuffleWithDistribution(cards);
        } else {
            cards = defaultCards;
        }
        
        return {
            type: 'flashcards',
            cards: cards,
            currentCard: 0,
            score: 0,
            streak: 0,
            performance: {
                correct: 0,
                total: 0,
                bySubject: {},
                timePerCard: []
            },
            startTime: Date.now(),
            
            processAction(action) {
                if (action.type === 'answer') {
                    const card = this.cards[this.currentCard];
                    const isCorrect = this.checkAnswer(action.answer, card.answer, card.type);
                    const timeSpent = Date.now() - (action.startTime || this.startTime);
                    
                    // Track performance
                    this.performance.total++;
                    this.performance.timePerCard.push(timeSpent);
                    
                    if (!this.performance.bySubject[card.subject]) {
                        this.performance.bySubject[card.subject] = { correct: 0, total: 0 };
                    }
                    this.performance.bySubject[card.subject].total++;
                    
                    if (isCorrect) {
                        this.performance.correct++;
                        this.performance.bySubject[card.subject].correct++;
                        this.streak++;
                        
                        // Dynamic scoring based on difficulty and time
                        let points = Math.max(10, 30 - Math.floor(timeSpent / 1000));
                        points *= card.difficulty || 1;
                        
                        // Streak bonus
                        if (this.streak >= 3) points *= 1.2;
                        if (this.streak >= 5) points *= 1.5;
                        
                        this.score += Math.floor(points);
                    } else {
                        this.streak = 0;
                    }
                    
                    this.currentCard++;
                    
                    if (this.currentCard >= this.cards.length) {
                        const accuracy = (this.performance.correct / this.performance.total) * 100;
                        const avgTime = this.performance.timePerCard.reduce((a, b) => a + b, 0) / this.performance.timePerCard.length;
                        
                        return {
                            completed: true,
                            won: accuracy >= 70,
                            reward: Math.floor(this.score / 10),
                            finalStats: {
                                accuracy: Math.round(accuracy),
                                avgTimePerCard: Math.round(avgTime / 1000),
                                totalTime: Math.round((Date.now() - this.startTime) / 1000),
                                subjectBreakdown: this.performance.bySubject,
                                maxStreak: this.streak
                            }
                        };
                    }
                    
                    return { 
                        correct: isCorrect, 
                        score: this.score,
                        streak: this.streak,
                        timeSpent: Math.round(timeSpent / 1000),
                        feedback: this.getFeedback(isCorrect, card)
                    };
                }
                
                if (action.type === 'hint') {
                    const card = this.cards[this.currentCard];
                    return {
                        hint: this.generateHint(card),
                        penaltyApplied: true
                    };
                }
                
                if (action.type === 'skip') {
                    this.currentCard++;
                    this.streak = 0;
                    
                    if (this.currentCard >= this.cards.length) {
                        return { completed: true, won: false };
                    }
                    
                    return { skipped: true };
                }
            },
            
            checkAnswer(userAnswer, correctAnswer, cardType) {
                const userLower = userAnswer.toLowerCase().trim();
                const correctLower = correctAnswer.toLowerCase().trim();
                
                // Exact match
                if (userLower === correctLower) return true;
                
                // Flexible matching based on card type
                if (cardType === 'formula') {
                    // Remove spaces and check mathematical expressions
                    return userLower.replace(/\s/g, '') === correctLower.replace(/\s/g, '');
                }
                
                if (cardType === 'definition') {
                    // Check if user answer contains key terms
                    const keyWords = correctLower.split(/\s+/).filter(w => w.length > 3);
                    const userWords = userLower.split(/\s+/);
                    
                    const matchedWords = keyWords.filter(word => 
                        userWords.some(userWord => 
                            userWord.includes(word) || word.includes(userWord)
                        )
                    );
                    
                    return matchedWords.length >= Math.ceil(keyWords.length * 0.6);
                }
                
                // Partial match for other types
                const similarity = this.calculateSimilarity(userLower, correctLower);
                return similarity > 0.7;
            },
            
            calculateSimilarity(str1, str2) {
                const longer = str1.length > str2.length ? str1 : str2;
                const shorter = str1.length > str2.length ? str2 : str1;
                
                const editDistance = this.levenshteinDistance(longer, shorter);
                return (longer.length - editDistance) / longer.length;
            },
            
            levenshteinDistance(str1, str2) {
                const matrix = [];
                
                for (let i = 0; i <= str2.length; i++) {
                    matrix[i] = [i];
                }
                
                for (let j = 0; j <= str1.length; j++) {
                    matrix[0][j] = j;
                }
                
                for (let i = 1; i <= str2.length; i++) {
                    for (let j = 1; j <= str1.length; j++) {
                        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                            matrix[i][j] = matrix[i - 1][j - 1];
                        } else {
                            matrix[i][j] = Math.min(
                                matrix[i - 1][j - 1] + 1,
                                matrix[i][j - 1] + 1,
                                matrix[i - 1][j] + 1
                            );
                        }
                    }
                }
                
                return matrix[str2.length][str1.length];
            },
            
            generateHint(card) {
                if (card.type === 'definition') {
                    const words = card.answer.split(' ');
                    return `Hint: Answer starts with "${words[0]}" and has ${words.length} words`;
                }
                
                if (card.type === 'formula') {
                    return `Hint: This is a mathematical formula with variables`;
                }
                
                return `Hint: Think about ${card.subject || 'the topic'} and ${card.topic || 'key concepts'}`;
            },
            
            getFeedback(isCorrect, card) {
                if (isCorrect) {
                    const messages = [
                        'Excellent! 🎉',
                        'Correct! Well done! ✅',
                        'Perfect! Keep it up! ⭐',
                        'Outstanding! 🏆'
                    ];
                    return messages[Math.floor(Math.random() * messages.length)];
                } else {
                    return `The correct answer was: ${card.answer}. ${card.topic ? `This relates to ${card.topic}.` : ''}`;
                }
            },
            
            getState() {
                const card = this.cards[this.currentCard];
                return {
                    card: {
                        ...card,
                        progress: Math.round(((this.currentCard) / this.cards.length) * 100)
                    },
                    cardNumber: this.currentCard + 1,
                    totalCards: this.cards.length,
                    score: this.score,
                    streak: this.streak,
                    accuracy: this.performance.total > 0 ? 
                        Math.round((this.performance.correct / this.performance.total) * 100) : 0,
                    subjectProgress: this.getSubjectProgress()
                };
            },
            
            getSubjectProgress() {
                const progress = {};
                Object.keys(this.performance.bySubject).forEach(subject => {
                    const stats = this.performance.bySubject[subject];
                    progress[subject] = {
                        accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
                        completed: stats.total
                    };
                });
                return progress;
            }
        };
    }
    
    createDocumentGame(materials) {
        return {
            type: 'docgame',
            materials: materials,
            
            processAction(action) {
                // Document game logic
                return { success: true };
            },
            
            getState() {
                return {
                    materials: this.materials
                };
            }
        };
    }
    
    createQuizGame(studyMaterials = []) {
        // Enhanced quiz game for MCAT/LSAT with multiple choice questions
        const questions = this.generateQuizQuestions(studyMaterials);
        
        return {
            type: 'quiz',
            questions: questions,
            currentQuestion: 0,
            score: 0,
            timeLimit: 120, // 2 minutes per question
            performance: {
                correct: 0,
                total: 0,
                bySubject: {},
                timeSpent: []
            },
            
            processAction(action) {
                if (action.type === 'answer') {
                    const question = this.questions[this.currentQuestion];
                    const isCorrect = action.selectedOption === question.correctOption;
                    const timeSpent = action.timeSpent || 0;
                    
                    this.performance.total++;
                    this.performance.timeSpent.push(timeSpent);
                    
                    if (!this.performance.bySubject[question.subject]) {
                        this.performance.bySubject[question.subject] = { correct: 0, total: 0 };
                    }
                    this.performance.bySubject[question.subject].total++;
                    
                    if (isCorrect) {
                        this.performance.correct++;
                        this.performance.bySubject[question.subject].correct++;
                        
                        // Time-based scoring
                        let points = Math.max(10, 50 - Math.floor(timeSpent / 2));
                        points *= question.difficulty || 1;
                        this.score += points;
                    }
                    
                    this.currentQuestion++;
                    
                    if (this.currentQuestion >= this.questions.length) {
                        return {
                            completed: true,
                            won: (this.performance.correct / this.performance.total) >= 0.7,
                            reward: Math.floor(this.score / 10),
                            finalStats: {
                                accuracy: Math.round((this.performance.correct / this.performance.total) * 100),
                                totalTime: this.performance.timeSpent.reduce((a, b) => a + b, 0),
                                subjectBreakdown: this.performance.bySubject
                            }
                        };
                    }
                    
                    return {
                        correct: isCorrect,
                        explanation: question.explanation,
                        score: this.score
                    };
                }
            },
            
            getState() {
                return {
                    question: this.questions[this.currentQuestion],
                    questionNumber: this.currentQuestion + 1,
                    totalQuestions: this.questions.length,
                    score: this.score,
                    timeLimit: this.timeLimit
                };
            }
        };
    }
    
    generateQuizQuestions(studyMaterials) {
        const questions = [];
        
        // Default MCAT/LSAT sample questions
        const sampleQuestions = [
            {
                question: "Which organelle is responsible for cellular respiration?",
                options: ["Nucleus", "Mitochondria", "Ribosome", "Endoplasmic Reticulum"],
                correctOption: 1,
                explanation: "Mitochondria are the powerhouses of the cell, responsible for cellular respiration and ATP production.",
                subject: "Biology",
                difficulty: 1
            },
            {
                question: "If all roses are flowers, and some flowers are red, which statement must be true?",
                options: [
                    "All roses are red",
                    "Some roses are red", 
                    "No roses are red",
                    "Some flowers are roses"
                ],
                correctOption: 3,
                explanation: "From the given premises, we can only conclude that some flowers are roses, not anything about the color of roses.",
                subject: "Logic",
                difficulty: 2
            }
        ];
        
        if (studyMaterials.length > 0) {
            // Generate questions from study materials
            studyMaterials.forEach(material => {
                if (material.content && Array.isArray(material.content)) {
                    material.content.forEach(concept => {
                        if (concept.type === 'definition' || concept.type === 'conceptual') {
                            const mcq = this.convertToMultipleChoice(concept);
                            if (mcq) questions.push(mcq);
                        }
                    });
                }
            });
        }
        
        // Ensure we have enough questions
        while (questions.length < 10) {
            questions.push(...sampleQuestions);
        }
        
        return questions.slice(0, 20); // Limit to 20 questions
    }
    
    convertToMultipleChoice(concept) {
        if (!concept.answer || concept.answer.length < 5) return null;
        
        // Create distractors (wrong answers)
        const correctAnswer = concept.answer;
        const distractors = this.generateDistractors(correctAnswer, concept.subject);
        
        if (distractors.length < 3) return null;
        
        // Randomize option positions
        const options = [correctAnswer, ...distractors].slice(0, 4);
        const correctIndex = Math.floor(Math.random() * options.length);
        
        // Move correct answer to random position
        [options[0], options[correctIndex]] = [options[correctIndex], options[0]];
        
        return {
            question: concept.question,
            options: options,
            correctOption: correctIndex,
            explanation: `The correct answer is "${correctAnswer}". ${concept.topic ? `This concept relates to ${concept.topic}.` : ''}`,
            subject: concept.subject || 'General',
            difficulty: concept.difficulty || 1
        };
    }
    
    generateDistractors(correctAnswer, subject) {
        // Generate plausible wrong answers based on subject
        const distractors = [];
        
        if (subject && subject.includes('biology')) {
            const bioTerms = ['nucleus', 'cytoplasm', 'ribosomes', 'lysosomes', 'golgi apparatus', 'chloroplasts'];
            distractors.push(...bioTerms.filter(term => !correctAnswer.toLowerCase().includes(term)));
        } else if (subject && subject.includes('chemistry')) {
            const chemTerms = ['ionic bond', 'covalent bond', 'hydrogen bond', 'van der waals', 'metallic bond'];
            distractors.push(...chemTerms.filter(term => !correctAnswer.toLowerCase().includes(term)));
        } else if (subject && subject.includes('physics')) {
            const physicsTerms = ['kinetic energy', 'potential energy', 'momentum', 'acceleration', 'velocity'];
            distractors.push(...physicsTerms.filter(term => !correctAnswer.toLowerCase().includes(term)));
        } else {
            // Generic distractors
            const genericTerms = ['option A', 'option B', 'option C', 'alternative answer'];
            distractors.push(...genericTerms);
        }
        
        return distractors.slice(0, 3);
    }
}

// D2JSP Engine
class D2JSPEngine {
    async initialize() {
        console.log('🎒 D2JSP inventory system ready');
    }
    
    createInventoryGame(player) {
        return {
            type: 'd2jsp',
            inventory: player.inventory || [],
            gold: player.coins,
            
            processAction(action) {
                if (action.type === 'drag') {
                    // Handle drag and drop
                    return { success: true };
                }
            },
            
            getState() {
                return {
                    inventory: this.inventory,
                    gold: this.gold
                };
            }
        };
    }
}

// Eyeball Learning Engine
class EyeballLearningEngine {
    async initialize() {
        console.log('👁️ Eyeball learning engine ready');
    }
    
    async processTracking(trackingData) {
        // Process eyeball tracking data for learning analytics
        const { x, y, timestamp, focusTime, scanPattern } = trackingData;
        
        // Analyze gaze patterns for learning insights
        const insights = {
            focusPoints: this.identifyFocusPoints(x, y, focusTime),
            readingPattern: this.analyzeReadingPattern(scanPattern),
            attentionLevel: this.calculateAttentionLevel(focusTime),
            comprehensionIndicators: this.getComprehensionIndicators(trackingData)
        };
        
        return {
            processed: true,
            insights: insights,
            score: Math.floor(insights.attentionLevel * 10),
            feedback: this.generateTrackingFeedback(insights)
        };
    }
    
    identifyFocusPoints(x, y, focusTime) {
        // Identify areas of high focus
        return {
            primaryFocus: { x, y },
            dwellTime: focusTime,
            intensity: Math.min(100, focusTime / 10)
        };
    }
    
    analyzeReadingPattern(scanPattern) {
        if (!scanPattern || scanPattern.length < 2) {
            return { pattern: 'insufficient_data', efficiency: 0 };
        }
        
        // Analyze if scanning follows typical reading patterns
        const isLinear = this.isLinearReading(scanPattern);
        const hasBacktracking = this.hasBacktracking(scanPattern);
        
        return {
            pattern: isLinear ? 'linear' : 'scattered',
            efficiency: isLinear ? 80 : 40,
            backtracking: hasBacktracking
        };
    }
    
    isLinearReading(pattern) {
        // Check if eye movement follows left-to-right, top-to-bottom pattern
        for (let i = 1; i < pattern.length; i++) {
            const prev = pattern[i - 1];
            const curr = pattern[i];
            
            // Simple heuristic: y should generally increase or stay same, x varies
            if (curr.y < prev.y - 50) return false; // Too much upward movement
        }
        return true;
    }
    
    hasBacktracking(pattern) {
        // Detect if user goes back to re-read content
        let backtrackCount = 0;
        for (let i = 2; i < pattern.length; i++) {
            const prev2 = pattern[i - 2];
            const curr = pattern[i];
            
            const distance = Math.sqrt(
                Math.pow(curr.x - prev2.x, 2) + Math.pow(curr.y - prev2.y, 2)
            );
            
            if (distance < 100) backtrackCount++; // Close to previous position
        }
        
        return backtrackCount > pattern.length * 0.1; // More than 10% backtracking
    }
    
    calculateAttentionLevel(focusTime) {
        // Calculate attention level based on focus duration
        const optimalFocusTime = 2000; // 2 seconds optimal
        
        if (focusTime < 500) return 0.2; // Too quick, likely skimming
        if (focusTime > 10000) return 0.5; // Too long, possibly confused
        
        // Gaussian-like curve with peak at optimal time
        const ratio = focusTime / optimalFocusTime;
        return Math.exp(-Math.pow(ratio - 1, 2) / 0.5);
    }
    
    getComprehensionIndicators(trackingData) {
        // Derive comprehension indicators from tracking data
        return {
            engagement: trackingData.focusTime > 1000 ? 'high' : 'low',
            difficulty: trackingData.scanPattern?.length > 10 ? 'high' : 'moderate',
            confidence: this.calculateAttentionLevel(trackingData.focusTime) > 0.7 ? 'confident' : 'uncertain'
        };
    }
    
    generateTrackingFeedback(insights) {
        let feedback = [];
        
        if (insights.attentionLevel > 0.8) {
            feedback.push("Excellent focus! Your attention level is optimal for learning.");
        } else if (insights.attentionLevel > 0.5) {
            feedback.push("Good attention. Try to maintain focus for slightly longer periods.");
        } else {
            feedback.push("Consider slowing down and focusing more on key concepts.");
        }
        
        if (insights.readingPattern.pattern === 'linear') {
            feedback.push("Your reading pattern is efficient and systematic.");
        } else {
            feedback.push("Try following a more linear reading pattern for better comprehension.");
        }
        
        if (insights.readingPattern.backtracking) {
            feedback.push("Some backtracking detected - this is normal for complex material.");
        }
        
        return feedback.join(" ");
    }
    
    createEyeTrackingGame() {
        return {
            type: 'eyetrack',
            targets: [],
            score: 0,
            startTime: Date.now(),
            
            processAction(action) {
                if (action.type === 'track') {
                    // Process eye tracking data
                    this.score += 5;
                    
                    if (this.score >= 100) {
                        return {
                            completed: true,
                            won: true,
                            reward: 40
                        };
                    }
                    
                    return { score: this.score };
                }
            },
            
            getState() {
                return {
                    score: this.score,
                    timeElapsed: Date.now() - this.startTime
                };
            }
        };
    }
}

// Main execution
async function main() {
    console.log('🎮🎯 LAUNCHING INTEGRATED GAME SERVER!');
    console.log('=====================================\n');
    
    const server = new IntegratedGameServer();
    await server.initialize();
    
    console.log('\n🎮 Available Games:');
    console.log('   🕹️ Classic: Minesweeper, Chess, Geometry Wars');
    console.log('   📚 Study: Flashcards, Quiz, Word Hunt');
    console.log('   📄 Document: Convert any doc to game');
    console.log('   👁️ Eyeball: Focus tracking, Visual memory');
    console.log('   🎒 D2JSP: Inventory management, Trading');
    
    console.log('\n🌐 API Endpoints:');
    console.log('   GET  /api/games - List all games');
    console.log('   POST /api/study/upload - Upload study material');
    console.log('   POST /api/game/start - Start a game');
    console.log('   POST /api/game/action - Game action');
    console.log('   WS   ws://localhost:9600 - Real-time gameplay');
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { IntegratedGameServer, ClassicGamesEngine, StudyGamesEngine, D2JSPEngine, EyeballLearningEngine };