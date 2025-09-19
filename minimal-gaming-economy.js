// Minimal Gaming Economy Service
const express = require('express');
const app = express();
const port = 9706;

app.use(express.json());

// In-memory storage
const players = new Map();
const economyStats = {
    total_tokens_distributed: 0,
    total_games_played: 0,
    active_players: 0
};

// Tier system
const tiers = {
    shipwreck: { name: 'Shipwreck', level: 0, points_required: 0, multiplier: 0.8 },
    sailor: { name: 'Sailor', level: 1, points_required: 5000, multiplier: 1.0 },
    navigator: { name: 'Navigator', level: 2, points_required: 15000, multiplier: 1.2 },
    captain: { name: 'Captain', level: 3, points_required: 50000, multiplier: 1.5 },
    admiral: { name: 'Admiral', level: 4, points_required: 150000, multiplier: 2.0 },
    legend: { name: 'Sea Legend', level: 5, points_required: 500000, multiplier: 3.0 }
};

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'gaming-economy' });
});

// Get economy overview
app.get('/api/gaming-economy/overview', (req, res) => {
    res.json({
        economy_stats: economyStats,
        total_players: players.size,
        tiers: Object.keys(tiers).length
    });
});

// Register player
app.post('/api/gaming-economy/player/register', (req, res) => {
    const { playerId, teamPreference } = req.body;
    
    const player = {
        id: playerId,
        team_preference: teamPreference,
        total_points: 0,
        current_tier: 'shipwreck',
        total_tokens_earned: 0,
        games_played: 0,
        games_won: 0,
        created_at: Date.now()
    };
    
    players.set(playerId, player);
    economyStats.active_players = players.size;
    
    console.log(`👤 Player registered: ${playerId} (${teamPreference})`);
    res.json(player);
});

// Update player stats
app.post('/api/gaming-economy/player/:playerId/update', (req, res) => {
    const { playerId } = req.params;
    const { gameResult } = req.body;
    
    let player = players.get(playerId);
    if (!player) {
        // Create if doesn't exist
        player = {
            id: playerId,
            team_preference: 'saveOrSink',
            total_points: 0,
            current_tier: 'shipwreck',
            total_tokens_earned: 0,
            games_played: 0,
            games_won: 0,
            created_at: Date.now()
        };
        players.set(playerId, player);
    }
    
    // Update stats
    player.games_played++;
    if (gameResult.won) {
        player.games_won++;
    }
    
    // Calculate tokens earned
    const baseTokens = gameResult.dgai_earned || (gameResult.won ? 1000 : 100);
    const tierMultiplier = tiers[player.current_tier].multiplier;
    const tokensEarned = Math.floor(baseTokens * tierMultiplier);
    
    player.total_tokens_earned += tokensEarned;
    player.total_points += gameResult.score || tokensEarned;
    
    // Check for tier progression
    const currentTierData = tiers[player.current_tier];
    const tierKeys = Object.keys(tiers);
    const currentIndex = tierKeys.indexOf(player.current_tier);
    
    if (currentIndex < tierKeys.length - 1) {
        const nextTierKey = tierKeys[currentIndex + 1];
        const nextTier = tiers[nextTierKey];
        
        if (player.total_points >= nextTier.points_required) {
            player.current_tier = nextTierKey;
            console.log(`🎉 Player promoted: ${playerId} → ${nextTier.name}`);
        }
    }
    
    // Update global stats
    economyStats.total_tokens_distributed += tokensEarned;
    economyStats.total_games_played++;
    
    console.log(`💰 Player rewarded: ${playerId} (+${tokensEarned} DGAI)`);
    
    res.json({
        tokens_earned: tokensEarned,
        new_total: player.total_tokens_earned,
        current_tier: player.current_tier,
        tier_progress: calculateTierProgress(player)
    });
});

// Get player stats
app.get('/api/gaming-economy/player/:playerId', (req, res) => {
    const { playerId } = req.params;
    const player = players.get(playerId);
    
    if (player) {
        res.json({
            ...player,
            tier_info: tiers[player.current_tier],
            tier_progress: calculateTierProgress(player)
        });
    } else {
        res.status(404).json({ error: 'Player not found' });
    }
});

// Get leaderboard
app.get('/api/gaming-economy/leaderboard', (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    
    const leaderboard = Array.from(players.values())
        .sort((a, b) => b.total_tokens_earned - a.total_tokens_earned)
        .slice(0, limit)
        .map((player, index) => ({
            rank: index + 1,
            player_id: player.id,
            team: player.team_preference,
            tier: player.current_tier,
            tokens: player.total_tokens_earned,
            games_played: player.games_played,
            win_rate: player.games_played > 0 ? (player.games_won / player.games_played * 100).toFixed(1) : '0.0'
        }));
    
    res.json(leaderboard);
});

// Get tiers info
app.get('/api/gaming-economy/tiers', (req, res) => {
    res.json({
        tiers: tiers,
        total_players: players.size,
        distribution: calculateTierDistribution()
    });
});

function calculateTierProgress(player) {
    const tierKeys = Object.keys(tiers);
    const currentIndex = tierKeys.indexOf(player.current_tier);
    
    if (currentIndex >= tierKeys.length - 1) {
        return { progress: 1.0, next_tier: null };
    }
    
    const currentTier = tiers[player.current_tier];
    const nextTierKey = tierKeys[currentIndex + 1];
    const nextTier = tiers[nextTierKey];
    
    const progress = Math.min(1, (player.total_points - currentTier.points_required) / 
                             (nextTier.points_required - currentTier.points_required));
    
    return {
        progress: Math.max(0, progress),
        next_tier: nextTierKey,
        points_needed: Math.max(0, nextTier.points_required - player.total_points)
    };
}

function calculateTierDistribution() {
    const distribution = {};
    Object.keys(tiers).forEach(tier => distribution[tier] = 0);
    
    for (const player of players.values()) {
        distribution[player.current_tier]++;
    }
    
    return distribution;
}

app.listen(port, () => {
    console.log(`💰 Gaming Economy service running on port ${port}`);
    console.log(`🎮 Ready to track DGAI rewards and tier progression!`);
});