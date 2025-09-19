// Minimal Charting Game Engine Service  
const express = require('express');
const app = express();
const port = 9705;

app.use(express.json());

// Game state
let gameState = {
    teams: {
        saveOrSink: { score: 0, wins: 0, strategy: 'defensive' },
        dealOrDelete: { score: 0, wins: 0, strategy: 'aggressive' }
    },
    market_conditions: 'calm',
    active_games: 0
};

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'charting-engine' });
});

// Get game status
app.get('/api/shiprekt/status', (req, res) => {
    res.json({
        current_game: null,
        team_scores: gameState.teams,
        market_conditions: gameState.market_conditions,
        active_players: 0,
        trinity_teams: {
            saveOrSink: {
                name: 'SaveOrSink',
                color: '#00ff88',
                philosophy: 'Conservative analysis, risk management',
                mascot: '🛟',
                ...gameState.teams.saveOrSink
            },
            dealOrDelete: {
                name: 'DealOrDelete',
                color: '#ff6666', 
                philosophy: 'Aggressive trading, high risk/reward',
                mascot: '⚔️',
                ...gameState.teams.dealOrDelete
            }
        }
    });
});

// Get team stats
app.get('/api/shiprekt/teams', (req, res) => {
    const totalGames = gameState.teams.saveOrSink.wins + gameState.teams.dealOrDelete.wins;
    
    res.json({
        saveOrSink: {
            ...gameState.teams.saveOrSink,
            win_rate: totalGames > 0 ? (gameState.teams.saveOrSink.wins / totalGames * 100).toFixed(1) : '0.0'
        },
        dealOrDelete: {
            ...gameState.teams.dealOrDelete,
            win_rate: totalGames > 0 ? (gameState.teams.dealOrDelete.wins / totalGames * 100).toFixed(1) : '0.0'
        },
        total_games: totalGames
    });
});

// Get market charts (mock data)
app.get('/api/shiprekt/charts', (req, res) => {
    const mockCharts = [
        {
            symbol: 'DGAI/USD',
            price: 0.85 + (Math.random() - 0.5) * 0.1,
            change: (Math.random() - 0.5) * 0.05,
            volume: Math.random() * 1000000,
            timestamp: Date.now()
        },
        {
            symbol: 'BTC/USD', 
            price: 65000 + (Math.random() - 0.5) * 5000,
            change: (Math.random() - 0.5) * 0.03,
            volume: Math.random() * 50000000,
            timestamp: Date.now()
        },
        {
            symbol: 'ETH/USD',
            price: 3200 + (Math.random() - 0.5) * 300,
            change: (Math.random() - 0.5) * 0.04,
            volume: Math.random() * 20000000,
            timestamp: Date.now()
        }
    ];
    
    res.json(mockCharts);
});

// Trinity analysis
app.post('/api/shiprekt/trinity/analyze', (req, res) => {
    const { chartData, gameContext } = req.body;
    
    // Mock trinity analysis
    const saveConfidence = Math.random() * 0.4 + 0.3; // 0.3-0.7
    const deleteConfidence = Math.random() * 0.4 + 0.3; // 0.3-0.7
    const marketDirection = Math.random() > 0.5 ? 'up' : 'down';
    
    const analysis = {
        save_analysis: {
            team: 'saveOrSink',
            confidence: saveConfidence,
            decision: saveConfidence > 0.6 ? 'safe_entry' : 'wait_and_see',
            reasoning: 'Conservative approach based on support levels'
        },
        delete_analysis: {
            team: 'dealOrDelete', 
            confidence: deleteConfidence,
            decision: deleteConfidence > 0.6 ? 'aggressive_entry' : 'take_profit',
            reasoning: 'Momentum signals suggest volatility opportunity'
        },
        rekt_decision: {
            market_verdict: marketDirection === 'up' ? 'bullish_confirmation' : 'bearish_pressure',
            winning_team: saveConfidence > deleteConfidence ? 'saveOrSink' : 'dealOrDelete',
            confidence: Math.abs(saveConfidence - deleteConfidence),
            reasoning: `Market showing ${marketDirection}ward movement`
        },
        trinity_consensus: {
            overall_consensus: (saveConfidence + deleteConfidence) / 2,
            trinity_decision: saveConfidence > deleteConfidence ? 'conservative_wins' : 'aggressive_wins',
            philosophy: 'Trinity reveals market truth through opposing forces'
        },
        timestamp: Date.now()
    };
    
    console.log(`🔱 Trinity analysis: ${analysis.trinity_consensus.trinity_decision}`);
    
    res.json(analysis);
});

// Create game
app.post('/api/shiprekt/game/create', (req, res) => {
    const { gameMode, players } = req.body;
    const gameId = Math.random().toString(36).substr(2, 9);
    
    console.log(`🎮 Game created: ${gameMode} with ${players?.length || 0} players`);
    
    res.json({
        game_id: gameId,
        success: true,
        mode: gameMode,
        players: players?.length || 0
    });
});

// Start game
app.post('/api/shiprekt/game/:gameId/start', (req, res) => {
    const { gameId } = req.params;
    
    gameState.active_games++;
    
    console.log(`🚀 Game started: ${gameId}`);
    
    res.json({
        game_id: gameId,
        status: 'active',
        start_time: Date.now(),
        teams: gameState.teams
    });
});

// Simulate market events
setInterval(() => {
    const events = ['volatility_spike', 'trend_reversal', 'breakout_confirmed', 'calm_seas'];
    const event = events[Math.floor(Math.random() * events.length)];
    gameState.market_conditions = event;
    
    console.log(`🌊 Market Event: ${event}`);
}, 30000);

app.listen(port, () => {
    console.log(`📊 Charting Engine service running on port ${port}`);
    console.log(`⚔️ SaveOrSink vs DealOrDelete trinity system ready!`);
});