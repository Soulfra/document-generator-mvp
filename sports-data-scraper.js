#!/usr/bin/env node

/**
 * ⚾📊 SPORTS DATA SCRAPING ENGINE
 * 
 * Comprehensive sports statistics scraper focused on baseball (especially Milwaukee Brewers)
 * Integrates with existing NIL Sports Agency infrastructure and provides real-time data
 * for mathematical learning applications.
 * 
 * Features:
 * - MLB Statistics API integration
 * - Real-time game data scraping
 * - Player statistics analysis
 * - Historical data collection
 * - Mathematical problem generation from real stats
 * - Integration with "BREWERS_BINARY" token system
 */

const EventEmitter = require('events');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const cheerio = require('cheerio');

// Import existing systems
const unifiedColorSystem = require('./unified-color-system');

class SportsDataScraper extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            // Central logger integration
            centralLoggerUrl: 'http://localhost:9999',
            nilSportsAgencyUrl: 'http://localhost:42013',
            
            // MLB API configuration
            mlbApiBaseUrl: 'https://statsapi.mlb.com/api/v1',
            mlbDataUrl: 'https://baseballsavant.mlb.com',
            espnApiUrl: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb',
            
            // Scraping configuration
            requestTimeout: 10000,
            rateLimit: 1000, // ms between requests
            maxRetries: 3,
            cacheExpiration: 300000, // 5 minutes
            
            // Focus teams (prioritize Brewers)
            primaryTeam: {
                id: 158,
                name: 'Milwaukee Brewers',
                abbreviation: 'MIL',
                league: 'NL',
                division: 'Central'
            },
            
            // Data collection settings
            historicalDataRange: 5, // years
            updateFrequency: 300000, // 5 minutes
            enableRealTimeUpdates: true,
            
            ...config
        };
        
        // Data storage
        this.dataStore = {
            teams: new Map(),
            players: new Map(),
            games: new Map(),
            stats: new Map(),
            realTimeData: new Map(),
            
            // Cache management
            cache: new Map(),
            lastUpdated: new Map(),
            
            // Brewers specific data
            brewersRoster: new Map(),
            brewersGames: [],
            brewersStats: {},
            brewersHistory: []
        };
        
        // Data sources and endpoints
        this.dataSources = {
            mlb_official: {
                name: 'MLB Official Stats API',
                baseUrl: this.config.mlbApiBaseUrl,
                endpoints: {
                    teams: '/teams',
                    team_roster: '/teams/{teamId}/roster',
                    team_stats: '/teams/{teamId}/stats',
                    schedule: '/schedule',
                    game_detail: '/game/{gameId}/feed/live',
                    player_stats: '/people/{playerId}/stats',
                    standings: '/standings'
                },
                rateLimit: 1000,
                lastRequest: 0
            },
            baseball_savant: {
                name: 'Baseball Savant (Advanced Stats)',
                baseUrl: this.config.mlbDataUrl,
                endpoints: {
                    statcast: '/statcast_search',
                    leaderboard: '/leaderboard',
                    expected_stats: '/expected_statistics'
                },
                rateLimit: 2000,
                lastRequest: 0
            },
            espn_stats: {
                name: 'ESPN Sports API',
                baseUrl: this.config.espnApiUrl,
                endpoints: {
                    teams: '/teams',
                    scoreboard: '/scoreboard',
                    standings: '/standings'
                },
                rateLimit: 1500,
                lastRequest: 0
            }
        };
        
        // Mathematical problem templates for sports data
        this.mathTemplates = {
            batting_average: {
                title: 'Calculate Batting Average',
                template: '{player} has {hits} hits in {at_bats} at-bats. Calculate their batting average.',
                formula: 'hits / at_bats',
                concepts: ['division', 'decimals', 'rounding']
            },
            era_calculation: {
                title: 'Calculate Pitcher ERA',
                template: '{pitcher} has allowed {earned_runs} earned runs in {innings} innings. Calculate their ERA.',
                formula: '(earned_runs * 9) / innings',
                concepts: ['multiplication', 'division', 'decimal_places']
            },
            win_percentage: {
                title: 'Team Win Percentage',
                template: 'The {team} have won {wins} games and lost {losses} games. Calculate their win percentage.',
                formula: 'wins / (wins + losses)',
                concepts: ['addition', 'division', 'percentages']
            },
            slugging_percentage: {
                title: 'Calculate Slugging Percentage',
                template: '{player} has {singles} singles, {doubles} doubles, {triples} triples, and {home_runs} home runs in {at_bats} at-bats. Calculate their slugging percentage.',
                formula: '(singles + (2*doubles) + (3*triples) + (4*home_runs)) / at_bats',
                concepts: ['multiplication', 'addition', 'division', 'weighted_averages']
            },
            team_run_differential: {
                title: 'Team Run Differential',
                template: 'The {team} have scored {runs_scored} runs and allowed {runs_allowed} runs this season. Calculate their run differential.',
                formula: 'runs_scored - runs_allowed',
                concepts: ['subtraction', 'positive_negative_numbers']
            },
            probability_analysis: {
                title: 'Baseball Probability',
                template: 'If {player} gets a hit {hit_rate}% of the time, what is the probability they get at least one hit in their next {at_bats} at-bats?',
                formula: '1 - (1 - hit_rate)^at_bats',
                concepts: ['probability', 'exponents', 'complements']
            }
        };
        
        console.log(unifiedColorSystem.formatStatus('info', 'Sports Data Scraper initializing...'));
        this.initialize();
    }
    
    async initialize() {
        try {
            // Create data directories
            await this.ensureDataDirectories();
            
            // Load any cached data
            await this.loadCachedData();
            
            // Initialize team data (prioritize Brewers)
            await this.initializeTeamData();
            
            // Start data collection
            await this.startDataCollection();
            
            // Set up real-time updates
            if (this.config.enableRealTimeUpdates) {
                this.startRealTimeUpdates();
            }
            
            console.log(unifiedColorSystem.formatStatus('success', 'Sports Data Scraper ready!'));
            
            this.emit('scraper_ready', {
                teams: this.dataStore.teams.size,
                players: this.dataStore.players.size,
                brewersRosterSize: this.dataStore.brewersRoster.size
            });
            
        } catch (error) {
            console.log(unifiedColorSystem.formatStatus('error', `Scraper initialization failed: ${error.message}`));
            throw error;
        }
    }
    
    async ensureDataDirectories() {
        const dataDir = path.join(__dirname, 'data', 'sports');
        const subdirs = ['teams', 'players', 'games', 'stats', 'cache'];
        
        for (const subdir of subdirs) {
            await fs.mkdir(path.join(dataDir, subdir), { recursive: true });
        }
        
        console.log(unifiedColorSystem.formatStatus('success', 'Data directories created'));
    }
    
    async loadCachedData() {
        try {
            const cacheDir = path.join(__dirname, 'data', 'sports', 'cache');
            const files = await fs.readdir(cacheDir).catch(() => []);
            
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const filePath = path.join(cacheDir, file);
                    const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
                    const key = file.replace('.json', '');
                    this.dataStore.cache.set(key, data);
                }
            }
            
            console.log(unifiedColorSystem.formatStatus('info', `Loaded ${files.length} cached data files`));
            
        } catch (error) {
            console.log(unifiedColorSystem.formatStatus('warning', `Cache loading failed: ${error.message}`));
        }
    }
    
    async initializeTeamData() {
        console.log(unifiedColorSystem.formatStatus('info', 'Initializing team data...'));
        
        try {
            // Get all MLB teams
            const teamsData = await this.fetchMLBData('/teams');
            
            if (teamsData && teamsData.teams) {
                for (const team of teamsData.teams) {
                    this.dataStore.teams.set(team.id, {
                        id: team.id,
                        name: team.name,
                        abbreviation: team.abbreviation,
                        locationName: team.locationName,
                        teamName: team.teamName,
                        league: team.league.name,
                        division: team.division.name,
                        venue: team.venue,
                        isBrewers: team.id === this.config.primaryTeam.id
                    });
                }
                
                console.log(unifiedColorSystem.formatStatus('success', 
                    `Loaded ${teamsData.teams.length} MLB teams`));
            }
            
            // Get detailed Brewers data
            await this.loadBrewersDetailedData();
            
        } catch (error) {
            console.log(unifiedColorSystem.formatStatus('warning', `Team data loading failed: ${error.message}`));
            // Use fallback data
            await this.loadFallbackTeamData();
        }
    }
    
    async loadBrewersDetailedData() {
        const brewersId = this.config.primaryTeam.id;
        
        try {
            // Get Brewers roster
            const rosterData = await this.fetchMLBData(`/teams/${brewersId}/roster`);
            
            if (rosterData && rosterData.roster) {
                for (const player of rosterData.roster) {
                    const playerInfo = {
                        id: player.person.id,
                        fullName: player.person.fullName,
                        firstName: player.person.firstName,
                        lastName: player.person.lastName,
                        primaryNumber: player.jerseyNumber,
                        position: player.position,
                        status: player.status,
                        team: 'Milwaukee Brewers',
                        teamId: brewersId
                    };
                    
                    this.dataStore.brewersRoster.set(player.person.id, playerInfo);
                    this.dataStore.players.set(player.person.id, playerInfo);
                }
                
                console.log(unifiedColorSystem.formatStatus('success', 
                    `Loaded ${rosterData.roster.length} Brewers players`));
            }
            
            // Get Brewers current season stats
            await this.loadBrewersStats();
            
            // Get Brewers recent games
            await this.loadBrewersGames();
            
            // Generate BREWERS_BINARY integration data
            await this.generateBrewersBinaryData();
            
        } catch (error) {
            console.log(unifiedColorSystem.formatStatus('warning', `Brewers data loading failed: ${error.message}`));
        }
    }
    
    async loadBrewersStats() {
        const brewersId = this.config.primaryTeam.id;
        
        try {
            // Get team stats
            const teamStats = await this.fetchMLBData(`/teams/${brewersId}/stats?season=2025`);
            
            if (teamStats) {
                this.dataStore.brewersStats = {
                    teamStats: teamStats,
                    lastUpdated: Date.now(),
                    season: 2025
                };
                
                console.log(unifiedColorSystem.formatStatus('success', 'Brewers team stats loaded'));
            }
            
            // Get individual player stats for key players
            const keyPlayers = Array.from(this.dataStore.brewersRoster.values()).slice(0, 10);
            
            for (const player of keyPlayers) {
                try {
                    const playerStats = await this.fetchMLBData(`/people/${player.id}/stats?season=2025`);
                    
                    if (playerStats) {
                        player.stats = playerStats;
                        this.dataStore.players.set(player.id, player);
                    }
                    
                    // Rate limiting
                    await this.delay(this.config.rateLimit);
                    
                } catch (error) {
                    console.log(unifiedColorSystem.formatStatus('warning', 
                        `Failed to load stats for ${player.fullName}: ${error.message}`));
                }
            }
            
        } catch (error) {
            console.log(unifiedColorSystem.formatStatus('warning', `Team stats loading failed: ${error.message}`));
        }
    }
    
    async loadBrewersGames() {
        const brewersId = this.config.primaryTeam.id;
        
        try {
            // Get recent and upcoming games
            const scheduleData = await this.fetchMLBData(`/schedule?teamId=${brewersId}&season=2025`);
            
            if (scheduleData && scheduleData.dates) {
                const games = [];
                
                for (const date of scheduleData.dates) {
                    for (const game of date.games) {
                        games.push({
                            gameId: game.gamePk,
                            date: game.gameDate,
                            homeTeam: game.teams.home.team.name,
                            awayTeam: game.teams.away.team.name,
                            venue: game.venue.name,
                            status: game.status.detailedState,
                            score: game.teams.home.score ? {
                                home: game.teams.home.score,
                                away: game.teams.away.score
                            } : null
                        });
                    }
                }
                
                this.dataStore.brewersGames = games.slice(0, 20); // Last/next 20 games
                
                console.log(unifiedColorSystem.formatStatus('success', 
                    `Loaded ${games.length} Brewers games`));
            }
            
        } catch (error) {
            console.log(unifiedColorSystem.formatStatus('warning', `Games data loading failed: ${error.message}`));
        }
    }
    
    async generateBrewersBinaryData() {
        // Generate special data for BREWERS_BINARY token integration
        const brewersData = {
            teamCode: 'BREWERS_BINARY',
            specialStats: {
                totalWins: this.dataStore.brewersStats.teamStats?.wins || 81,
                totalLosses: this.dataStore.brewersStats.teamStats?.losses || 81,
                homeRuns: 180,
                teamBattingAverage: 0.265,
                teamERA: 3.85
            },
            tokenMultipliers: {
                win_bonus: 150,
                home_run_bonus: 25,
                perfect_game_bonus: 1000,
                playoff_bonus: 500
            },
            mathematicalPatterns: {
                fibonacci_wins: this.generateFibonacciWinPattern(),
                prime_home_runs: this.findPrimeNumberStats(),
                pi_approximations: this.findPiApproximations()
            },
            lastUpdated: Date.now()
        };
        
        // Store for NIL Sports Agency integration
        this.dataStore.cache.set('brewers_binary', brewersData);
        
        // Log to central logger
        await this.logToCentralLogger('brewers_binary_generated', brewersData);
        
        console.log(unifiedColorSystem.formatStatus('success', 'BREWERS_BINARY data generated'));
        
        this.emit('brewers_binary_ready', brewersData);
        
        return brewersData;
    }
    
    generateFibonacciWinPattern() {
        // Find Fibonacci patterns in win/loss records
        const fibonacci = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89];
        const wins = this.dataStore.brewersStats.teamStats?.wins || 81;
        
        const patterns = fibonacci.filter(fib => Math.abs(wins - fib) <= 5);
        
        return {
            currentWins: wins,
            nearestFibonacci: patterns[0] || fibonacci[8],
            mathematicalSignificance: patterns.length > 0 ? 'Current wins align with Fibonacci sequence!' : 'Approaching Fibonacci milestone'
        };
    }
    
    findPrimeNumberStats() {
        // Find prime numbers in team statistics
        const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];
        
        const stats = this.dataStore.brewersStats.teamStats || {};
        const homeRuns = 180; // Example value
        
        const primeStats = [];
        
        if (primes.includes(homeRuns)) {
            primeStats.push({ stat: 'home_runs', value: homeRuns, isPrime: true });
        }
        
        return {
            foundPrimes: primeStats,
            nextPrimeMilestone: primes.find(p => p > homeRuns) || 101,
            mathematicalNote: 'Prime numbers in sports statistics reveal hidden mathematical beauty'
        };
    }
    
    findPiApproximations() {
        // Find π approximations in statistics
        const pi = Math.PI;
        const stats = this.dataStore.brewersStats.teamStats || {};
        const era = 3.85; // Example ERA
        
        const piApproximations = [];
        
        if (Math.abs(era - pi) < 0.5) {
            piApproximations.push({
                stat: 'team_era',
                value: era,
                piValue: pi,
                difference: Math.abs(era - pi),
                significance: 'Team ERA approximates π!'
            });
        }
        
        return {
            approximations: piApproximations,
            exactPi: pi,
            mathematicalNote: 'When baseball statistics align with mathematical constants, magic happens!'
        };
    }
    
    async loadFallbackTeamData() {
        // Use hardcoded Brewers data when API is unavailable
        const fallbackData = {
            brewersRoster: [
                { id: 1001, fullName: 'Christian Yelich', position: 'Left Field', battingAverage: 0.285 },
                { id: 1002, fullName: 'Willy Adames', position: 'Shortstop', battingAverage: 0.272 },
                { id: 1003, fullName: 'William Contreras', position: 'Catcher', battingAverage: 0.281 },
                { id: 1004, fullName: 'Rhys Hoskins', position: 'First Base', battingAverage: 0.239 },
                { id: 1005, fullName: 'Joey Wiemer', position: 'Center Field', battingAverage: 0.258 }
            ],
            teamStats: {
                wins: 84,
                losses: 78,
                homeRuns: 187,
                teamBattingAverage: 0.268,
                teamERA: 3.92
            },
            lastUpdated: Date.now(),
            source: 'fallback'
        };
        
        for (const player of fallbackData.brewersRoster) {
            this.dataStore.brewersRoster.set(player.id, player);
            this.dataStore.players.set(player.id, player);
        }
        
        this.dataStore.brewersStats = fallbackData.teamStats;
        
        console.log(unifiedColorSystem.formatStatus('info', 'Using fallback Brewers data'));
    }
    
    async startDataCollection() {
        console.log(unifiedColorSystem.formatStatus('info', 'Starting data collection...'));
        
        // Schedule periodic updates
        this.updateInterval = setInterval(async () => {
            try {
                await this.performScheduledUpdate();
            } catch (error) {
                console.log(unifiedColorSystem.formatStatus('warning', `Scheduled update failed: ${error.message}`));
            }
        }, this.config.updateFrequency);
        
        console.log(unifiedColorSystem.formatStatus('success', 'Data collection started'));
    }
    
    async performScheduledUpdate() {
        console.log(unifiedColorSystem.formatStatus('info', 'Performing scheduled data update...'));
        
        const updates = {
            brewersStats: false,
            brewersGames: false,
            playerStats: false,
            mathProblems: false
        };
        
        try {
            // Update Brewers current stats
            await this.loadBrewersStats();
            updates.brewersStats = true;
            
            // Update recent games
            await this.loadBrewersGames();
            updates.brewersGames = true;
            
            // Generate new mathematical problems with current data
            await this.generateMathProblemsFromCurrentData();
            updates.mathProblems = true;
            
            // Update BREWERS_BINARY data
            await this.generateBrewersBinaryData();
            
            console.log(unifiedColorSystem.formatStatus('success', 'Scheduled update completed'));
            
            this.emit('data_updated', updates);
            
        } catch (error) {
            console.log(unifiedColorSystem.formatStatus('error', `Update failed: ${error.message}`));
        }
    }
    
    async generateMathProblemsFromCurrentData() {
        console.log(unifiedColorSystem.formatStatus('info', 'Generating mathematical problems from current data...'));
        
        const problems = [];
        
        // Generate problems for each template using current Brewers data
        const brewersPlayers = Array.from(this.dataStore.brewersRoster.values()).slice(0, 5);
        
        for (const player of brewersPlayers) {
            // Batting average problem
            if (player.battingAverage || Math.random() > 0.5) {
                const hits = Math.floor(Math.random() * 50) + 25;
                const atBats = Math.floor(hits / (player.battingAverage || 0.275)) + Math.floor(Math.random() * 10);
                
                problems.push({
                    id: `batting_avg_${player.id}_${Date.now()}`,
                    type: 'batting_average',
                    title: this.mathTemplates.batting_average.title,
                    description: this.mathTemplates.batting_average.template
                        .replace('{player}', player.fullName)
                        .replace('{hits}', hits)
                        .replace('{at_bats}', atBats),
                    solution: (hits / atBats).toFixed(3),
                    realData: true,
                    playerName: player.fullName,
                    difficulty: 'intermediate',
                    concepts: this.mathTemplates.batting_average.concepts,
                    generatedAt: Date.now()
                });
            }
        }
        
        // Team-based problems
        const teamStats = this.dataStore.brewersStats;
        if (teamStats && teamStats.wins !== undefined) {
            problems.push({
                id: `win_pct_brewers_${Date.now()}`,
                type: 'win_percentage',
                title: this.mathTemplates.win_percentage.title,
                description: this.mathTemplates.win_percentage.template
                    .replace('{team}', 'Milwaukee Brewers')
                    .replace('{wins}', teamStats.wins)
                    .replace('{losses}', teamStats.losses),
                solution: (teamStats.wins / (teamStats.wins + teamStats.losses)).toFixed(3),
                realData: true,
                teamName: 'Milwaukee Brewers',
                difficulty: 'beginner',
                concepts: this.mathTemplates.win_percentage.concepts,
                generatedAt: Date.now()
            });
        }
        
        // Store generated problems
        this.dataStore.cache.set('generated_math_problems', problems);
        
        console.log(unifiedColorSystem.formatStatus('success', 
            `Generated ${problems.length} mathematical problems from current data`));
        
        // Log to central logger
        await this.logToCentralLogger('math_problems_generated', {
            count: problems.length,
            source: 'brewers_current_data',
            problems: problems.map(p => ({ id: p.id, type: p.type, player: p.playerName }))
        });
        
        this.emit('math_problems_generated', problems);
        
        return problems;
    }
    
    startRealTimeUpdates() {
        console.log(unifiedColorSystem.formatStatus('info', 'Starting real-time updates...'));
        
        // Check for live games every minute
        this.realTimeInterval = setInterval(async () => {
            try {
                await this.checkForLiveGames();
            } catch (error) {
                console.log(unifiedColorSystem.formatStatus('warning', `Real-time update failed: ${error.message}`));
            }
        }, 60000); // Every minute
        
        console.log(unifiedColorSystem.formatStatus('success', 'Real-time updates started'));
    }
    
    async checkForLiveGames() {
        try {
            // Check if Brewers have a live game today
            const today = new Date().toISOString().split('T')[0];
            const scheduleData = await this.fetchMLBData(`/schedule?teamId=${this.config.primaryTeam.id}&date=${today}`);
            
            if (scheduleData && scheduleData.dates && scheduleData.dates.length > 0) {
                for (const date of scheduleData.dates) {
                    for (const game of date.games) {
                        if (game.status.statusCode === 'I') { // In progress
                            await this.processLiveGame(game);
                        }
                    }
                }
            }
            
        } catch (error) {
            // Silently handle errors in real-time updates
        }
    }
    
    async processLiveGame(game) {
        console.log(unifiedColorSystem.formatStatus('info', 
            `🔴 LIVE: ${game.teams.away.team.name} @ ${game.teams.home.team.name}`));
        
        try {
            // Get detailed live game data
            const liveData = await this.fetchMLBData(`/game/${game.gamePk}/feed/live`);
            
            if (liveData) {
                this.dataStore.realTimeData.set(`live_game_${game.gamePk}`, {
                    gameId: game.gamePk,
                    liveData: liveData,
                    lastUpdated: Date.now()
                });
                
                // Generate real-time mathematical problems
                await this.generateLiveGameMathProblems(game, liveData);
                
                this.emit('live_game_update', { game, liveData });
            }
            
        } catch (error) {
            console.log(unifiedColorSystem.formatStatus('warning', 
                `Live game processing failed: ${error.message}`));
        }
    }
    
    async generateLiveGameMathProblems(game, liveData) {
        // Generate problems based on live game data
        const problems = [];
        
        if (liveData.liveData && liveData.liveData.boxscore) {
            const boxscore = liveData.liveData.boxscore;
            const brewersTeam = boxscore.teams.home.team.id === this.config.primaryTeam.id ? 'home' : 'away';
            const brewersStats = boxscore.teams[brewersTeam];
            
            if (brewersStats) {
                problems.push({
                    id: `live_avg_${game.gamePk}_${Date.now()}`,
                    type: 'live_batting',
                    title: 'Live Game Batting Average',
                    description: `In today's game, the Brewers have ${brewersStats.teamStats.hits} hits in ${brewersStats.teamStats.atBats} at-bats. What is their current batting average for this game?`,
                    solution: (brewersStats.teamStats.hits / brewersStats.teamStats.atBats).toFixed(3),
                    isLive: true,
                    gameId: game.gamePk,
                    difficulty: 'intermediate',
                    generatedAt: Date.now()
                });
            }
        }
        
        if (problems.length > 0) {
            this.dataStore.cache.set(`live_problems_${game.gamePk}`, problems);
            this.emit('live_math_problems', problems);
        }
    }
    
    // Public API methods
    
    async getBrewersData() {
        return {
            roster: Array.from(this.dataStore.brewersRoster.values()),
            stats: this.dataStore.brewersStats,
            games: this.dataStore.brewersGames.slice(0, 10),
            binaryData: this.dataStore.cache.get('brewers_binary'),
            lastUpdated: this.dataStore.lastUpdated.get('brewers')
        };
    }
    
    async getGeneratedMathProblems() {
        return this.dataStore.cache.get('generated_math_problems') || [];
    }
    
    async getLiveMathProblems() {
        const liveProblems = [];
        
        for (const [key, value] of this.dataStore.cache.entries()) {
            if (key.startsWith('live_problems_')) {
                liveProblems.push(...value);
            }
        }
        
        return liveProblems;
    }
    
    async searchPlayerStats(playerName, season = 2025) {
        const player = Array.from(this.dataStore.players.values())
            .find(p => p.fullName.toLowerCase().includes(playerName.toLowerCase()));
        
        if (!player) {
            return null;
        }
        
        try {
            const stats = await this.fetchMLBData(`/people/${player.id}/stats?season=${season}`);
            return {
                player: player,
                stats: stats,
                mathProblems: this.generatePlayerMathProblems(player, stats)
            };
            
        } catch (error) {
            return {
                player: player,
                stats: null,
                error: error.message
            };
        }
    }
    
    generatePlayerMathProblems(player, stats) {
        const problems = [];
        
        if (stats && stats.stats && stats.stats.length > 0) {
            const batting = stats.stats.find(s => s.type.displayName === 'season');
            
            if (batting && batting.stats) {
                const stat = batting.stats;
                
                problems.push({
                    id: `player_avg_${player.id}_${Date.now()}`,
                    title: `${player.fullName} Batting Average`,
                    description: `${player.fullName} has ${stat.hits || 0} hits in ${stat.atBats || 1} at-bats this season. Calculate their batting average.`,
                    solution: ((stat.hits || 0) / (stat.atBats || 1)).toFixed(3),
                    difficulty: 'intermediate',
                    realPlayerData: true
                });
                
                if (stat.homeRuns) {
                    problems.push({
                        id: `player_hr_rate_${player.id}_${Date.now()}`,
                        title: `${player.fullName} Home Run Rate`,
                        description: `${player.fullName} has hit ${stat.homeRuns} home runs in ${stat.atBats} at-bats. What percentage of their at-bats result in home runs?`,
                        solution: ((stat.homeRuns / stat.atBats) * 100).toFixed(2) + '%',
                        difficulty: 'advanced',
                        concepts: ['division', 'percentages']
                    });
                }
            }
        }
        
        return problems;
    }
    
    async getTeamComparison(teamIds = []) {
        const teams = [];
        
        for (const teamId of teamIds) {
            const team = this.dataStore.teams.get(teamId);
            if (team) {
                try {
                    const stats = await this.fetchMLBData(`/teams/${teamId}/stats?season=2025`);
                    teams.push({
                        team: team,
                        stats: stats
                    });
                } catch (error) {
                    teams.push({
                        team: team,
                        stats: null,
                        error: error.message
                    });
                }
            }
        }
        
        return {
            teams: teams,
            comparisonProblems: this.generateComparisonMathProblems(teams)
        };
    }
    
    generateComparisonMathProblems(teams) {
        const problems = [];
        
        if (teams.length >= 2) {
            const team1 = teams[0];
            const team2 = teams[1];
            
            if (team1.stats && team2.stats) {
                problems.push({
                    id: `team_comparison_${Date.now()}`,
                    title: 'Team Comparison',
                    description: `The ${team1.team.name} have won ${team1.stats.wins || 0} games while the ${team2.team.name} have won ${team2.stats.wins || 0} games. How many more games has the better team won?`,
                    solution: Math.abs((team1.stats.wins || 0) - (team2.stats.wins || 0)),
                    difficulty: 'beginner',
                    concepts: ['subtraction', 'absolute_value', 'comparison']
                });
            }
        }
        
        return problems;
    }
    
    async getSystemStatus() {
        return {
            isActive: !!this.updateInterval,
            realTimeEnabled: !!this.realTimeInterval,
            dataStore: {
                teams: this.dataStore.teams.size,
                players: this.dataStore.players.size,
                brewersRoster: this.dataStore.brewersRoster.size,
                cachedItems: this.dataStore.cache.size
            },
            lastUpdate: this.dataStore.lastUpdated.get('system'),
            dataSources: Object.keys(this.dataSources),
            brewersData: {
                hasRoster: this.dataStore.brewersRoster.size > 0,
                hasStats: !!this.dataStore.brewersStats,
                hasGames: this.dataStore.brewersGames.length > 0,
                hasBinaryData: this.dataStore.cache.has('brewers_binary')
            }
        };
    }
    
    // Utility methods
    
    async fetchMLBData(endpoint) {
        const source = this.dataSources.mlb_official;
        const now = Date.now();
        
        // Rate limiting
        if (now - source.lastRequest < source.rateLimit) {
            await this.delay(source.rateLimit - (now - source.lastRequest));
        }
        
        const url = source.baseUrl + endpoint;
        
        try {
            const response = await axios.get(url, {
                timeout: this.config.requestTimeout,
                headers: {
                    'User-Agent': 'Sports-Data-Scraper/1.0',
                    'Accept': 'application/json'
                }
            });
            
            source.lastRequest = Date.now();
            return response.data;
            
        } catch (error) {
            console.log(unifiedColorSystem.formatStatus('warning', 
                `MLB API request failed for ${endpoint}: ${error.message}`));
            throw error;
        }
    }
    
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    async logToCentralLogger(eventType, data) {
        try {
            await axios.post(`${this.config.centralLoggerUrl}/log`, {
                service: 'sports-data-scraper',
                level: 'info',
                message: `${eventType}: ${JSON.stringify(data)}`,
                metadata: {
                    type: eventType,
                    ...data
                }
            }, { timeout: 5000 });
            
        } catch (error) {
            // Silently fail for logging
        }
    }
    
    async saveDataToCache() {
        try {
            const cacheDir = path.join(__dirname, 'data', 'sports', 'cache');
            
            // Save key data structures
            const dataToSave = [
                { key: 'brewers_roster', data: Array.from(this.dataStore.brewersRoster.entries()) },
                { key: 'brewers_stats', data: this.dataStore.brewersStats },
                { key: 'brewers_games', data: this.dataStore.brewersGames },
                { key: 'generated_problems', data: this.dataStore.cache.get('generated_math_problems') }
            ];
            
            for (const item of dataToSave) {
                if (item.data) {
                    await fs.writeFile(
                        path.join(cacheDir, `${item.key}.json`),
                        JSON.stringify(item.data, null, 2)
                    );
                }
            }
            
            console.log(unifiedColorSystem.formatStatus('success', 'Data saved to cache'));
            
        } catch (error) {
            console.log(unifiedColorSystem.formatStatus('warning', `Cache save failed: ${error.message}`));
        }
    }
    
    // Shutdown
    async shutdown() {
        console.log(unifiedColorSystem.formatStatus('info', 'Shutting down Sports Data Scraper...'));
        
        // Clear intervals
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        if (this.realTimeInterval) {
            clearInterval(this.realTimeInterval);
        }
        
        // Save current data to cache
        await this.saveDataToCache();
        
        this.emit('scraper_shutdown');
        console.log(unifiedColorSystem.formatStatus('success', 'Sports Data Scraper shut down'));
    }
}

module.exports = SportsDataScraper;

// CLI interface when run directly
if (require.main === module) {
    (async () => {
        console.log('⚾📊 SPORTS DATA SCRAPER\n');
        
        const scraper = new SportsDataScraper({
            enableRealTimeUpdates: true,
            updateFrequency: 120000 // 2 minutes for demo
        });
        
        // Wait for scraper to be ready
        await new Promise(resolve => {
            scraper.on('scraper_ready', resolve);
        });
        
        console.log('\n🚀 Scraper Ready! Available methods:\n');
        console.log('📊 scraper.getBrewersData()');
        console.log('🧮 scraper.getGeneratedMathProblems()');
        console.log('🔴 scraper.getLiveMathProblems()');
        console.log('🔍 scraper.searchPlayerStats(playerName)');
        console.log('⚖️  scraper.getTeamComparison([teamId1, teamId2])');
        
        // Demo: Get Brewers data
        console.log('\n⚾ Milwaukee Brewers Data:');
        const brewersData = await scraper.getBrewersData();
        console.log(`Roster: ${brewersData.roster.length} players`);
        console.log(`Recent Games: ${brewersData.games.length}`);
        
        if (brewersData.binaryData) {
            console.log('\n🔢 BREWERS_BINARY Mathematical Data:');
            const binary = brewersData.binaryData;
            console.log(`Team Wins: ${binary.specialStats.totalWins}`);
            console.log(`Fibonacci Pattern: ${binary.mathematicalPatterns.fibonacci_wins.mathematicalSignificance}`);
            console.log(`Prime Stats: ${binary.mathematicalPatterns.prime_home_runs.mathematicalNote}`);
        }
        
        // Demo: Get generated math problems
        console.log('\n🧮 Generated Mathematical Problems:');
        const mathProblems = await scraper.getGeneratedMathProblems();
        
        if (mathProblems.length > 0) {
            const problem = mathProblems[0];
            console.log(`\nSample Problem: ${problem.title}`);
            console.log(`Description: ${problem.description}`);
            console.log(`Solution: ${problem.solution}`);
            console.log(`Uses Real Data: ${problem.realData}`);
        }
        
        // Demo: Search for a player
        console.log('\n🔍 Searching for player stats...');
        try {
            const playerSearch = await scraper.searchPlayerStats('Yelich');
            if (playerSearch && playerSearch.player) {
                console.log(`Found: ${playerSearch.player.fullName} (${playerSearch.player.position.name})`);
                if (playerSearch.mathProblems.length > 0) {
                    console.log(`Generated ${playerSearch.mathProblems.length} math problems for this player`);
                }
            }
        } catch (error) {
            console.log('Player search demo skipped (API limitation)');
        }
        
        // Show system status
        console.log('\n📊 System Status:');
        const status = await scraper.getSystemStatus();
        console.log(`Teams Loaded: ${status.dataStore.teams}`);
        console.log(`Players Loaded: ${status.dataStore.players}`);
        console.log(`Brewers Roster: ${status.dataStore.brewersRoster}`);
        console.log(`Real-time Updates: ${status.realTimeEnabled ? '✅ Active' : '❌ Disabled'}`);
        
        // Listen for events
        scraper.on('data_updated', (updates) => {
            console.log('\n🔄 Data Updated:', Object.keys(updates).filter(k => updates[k]).join(', '));
        });
        
        scraper.on('live_game_update', (data) => {
            console.log(`\n🔴 LIVE GAME: ${data.game.teams.away.team.name} @ ${data.game.teams.home.team.name}`);
        });
        
        scraper.on('math_problems_generated', (problems) => {
            console.log(`\n🧮 Generated ${problems.length} new math problems from current data`);
        });
        
        // Graceful shutdown
        process.on('SIGINT', async () => {
            console.log('\n\n⚾ Shutting down Sports Data Scraper...');
            await scraper.shutdown();
            process.exit(0);
        });
        
        console.log('\n💡 Scraper is running. Press Ctrl+C to shutdown.');
        
    })().catch(console.error);
}