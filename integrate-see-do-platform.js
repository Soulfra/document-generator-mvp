#!/usr/bin/env node

/**
 * 🔗 SEE & DO PLATFORM INTEGRATION
 * Hooks everything into unified-game-node with existing auth
 */

const UnifiedSeeDooPlatform = require('./unified-see-do-platform');

// Integration into unified-game-node.js
// Add this to the constructor:
/*
    // Initialize See & Do Platform
    this.seeDooPlatform = new UnifiedSeeDooPlatform(this);
*/

// Add these routes to handleRequest:
/*
    } else if (path === '/platform') {
        this.servePlatform(res);
    } else if (path === '/search') {
        this.serveOnionSearch(res);
*/

// Add these API endpoints to handleAPI:
/*
    } else if (path.startsWith('/api/platform/')) {
        this.handlePlatformAPI(req, res, path);
*/

// Add these methods to UnifiedGameNode class:
const platformMethods = {
    servePlatform(res) {
        const html = this.seeDooPlatform.getUnifiedInterface();
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    },
    
    serveOnionSearch(res) {
        const html = `<!DOCTYPE html>
<html>
<head>
    <title>🧅 Onion Search Game</title>
    <style>
        body {
            background: linear-gradient(135deg, #2c3e50, #34495e);
            color: #fff;
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
        }
        .search-container {
            max-width: 800px;
            margin: 50px auto;
            text-align: center;
        }
        .search-box {
            width: 100%;
            padding: 20px;
            font-size: 20px;
            border-radius: 50px;
            border: none;
            background: rgba(255,255,255,0.1);
            color: #fff;
            backdrop-filter: blur(10px);
        }
        .search-box::placeholder {
            color: rgba(255,255,255,0.5);
        }
        .search-btn {
            margin-top: 20px;
            padding: 15px 50px;
            font-size: 18px;
            background: linear-gradient(45deg, #e74c3c, #c0392b);
            color: #fff;
            border: none;
            border-radius: 30px;
            cursor: pointer;
        }
        .layers {
            margin-top: 40px;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
        }
        .layer {
            background: rgba(255,255,255,0.1);
            padding: 20px;
            border-radius: 10px;
            opacity: 0.5;
        }
        .layer.unlocked {
            opacity: 1;
            cursor: pointer;
        }
        .layer h3 {
            margin: 0 0 10px 0;
            color: #e74c3c;
        }
        .results {
            margin-top: 40px;
            text-align: left;
        }
        .result {
            background: rgba(255,255,255,0.1);
            padding: 15px;
            margin: 10px 0;
            border-radius: 10px;
        }
        .puzzle {
            background: rgba(231,76,60,0.2);
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
        }
        h1 { text-align: center; font-size: 3em; }
    </style>
</head>
<body>
    <div class="search-container">
        <h1>🧅 Onion Search Game</h1>
        <p>Search the layers of the web. Solve puzzles. Find hidden connections.</p>
        
        <input type="text" class="search-box" id="searchQuery" 
               placeholder="Enter your search query..." 
               onkeypress="if(event.key==='Enter') search()">
        <br>
        <button class="search-btn" onclick="search()">🔍 SEARCH</button>
        
        <div class="layers">
            <div class="layer unlocked" data-layer="surface">
                <h3>Surface Web</h3>
                <p>Level 0 • Unlocked</p>
            </div>
            <div class="layer" data-layer="shallow">
                <h3>Shallow Web</h3>
                <p>Level 10 • Locked</p>
            </div>
            <div class="layer" data-layer="deep">
                <h3>Deep Web</h3>
                <p>Level 50 • Locked</p>
            </div>
            <div class="layer" data-layer="torrent">
                <h3>Torrent Layer</h3>
                <p>Level 100 • Locked</p>
            </div>
            <div class="layer" data-layer="wormhole">
                <h3>Wormhole Layer</h3>
                <p>Level 500 • Locked</p>
            </div>
            <div class="layer" data-layer="core">
                <h3>The Core</h3>
                <p>Level 1000 • Locked</p>
            </div>
        </div>
        
        <div id="results" class="results"></div>
    </div>
    
    <script>
        let currentUser = {
            id: 'guest_' + Date.now(),
            level: 1,
            layer: 'surface'
        };
        
        async function search() {
            const query = document.getElementById('searchQuery').value;
            if (!query) return;
            
            const resultsDiv = document.getElementById('results');
            resultsDiv.innerHTML = '<p>Searching...</p>';
            
            try {
                const response = await fetch('/api/platform/do/search_web', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: currentUser.id,
                        params: { query: query }
                    })
                });
                
                const data = await response.json();
                displayResults(data.results);
                
            } catch (error) {
                resultsDiv.innerHTML = '<p>Search failed: ' + error.message + '</p>';
            }
        }
        
        function displayResults(results) {
            const resultsDiv = document.getElementById('results');
            let html = '<h2>Search Results</h2>';
            
            // Surface results
            if (results.surface_results && results.surface_results.length > 0) {
                html += '<h3>Surface Web Results</h3>';
                results.surface_results.forEach(result => {
                    html += \`<div class="result">
                        <h4>\${result.title}</h4>
                        <p>\${result.snippet}</p>
                        <small>\${result.url} • \${result.technology}</small>
                    </div>\`;
                });
            }
            
            // Layer-specific results
            if (results.layer_results && results.layer_results.length > 0) {
                html += '<h3>' + results.layer + ' Layer Results</h3>';
                results.layer_results.forEach(result => {
                    html += \`<div class="result">
                        <h4>\${result.title}</h4>
                        <p>Type: \${result.type} • Value: \${result.value}</p>
                    </div>\`;
                });
            }
            
            // Puzzles
            if (results.puzzles && results.puzzles.length > 0) {
                html += '<h3>Puzzles Found</h3>';
                results.puzzles.forEach(puzzle => {
                    html += \`<div class="puzzle">
                        🧩 \${puzzle.hint} (Difficulty: \${puzzle.difficulty})
                        <button onclick="solvePuzzle('\${puzzle.type}')">Solve</button>
                    </div>\`;
                });
            }
            
            // Rewards
            if (results.rewards) {
                html += \`<p>🎉 Earned \${results.rewards.xp} XP and \${results.rewards.coins} coins!</p>\`;
            }
            
            resultsDiv.innerHTML = html;
        }
        
        function solvePuzzle(type) {
            const solution = prompt('Enter your solution:');
            if (!solution) return;
            
            fetch('/api/platform/do/solve_puzzle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: currentUser.id,
                    params: {
                        puzzleType: type,
                        solution: { input: solution, answer: solution }
                    }
                })
            }).then(r => r.json()).then(data => {
                if (data.success) {
                    alert('Correct! +' + data.reward + ' XP');
                } else {
                    alert('Try again!');
                }
            });
        }
    </script>
</body>
</html>`;
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
    },
    
    async handlePlatformAPI(req, res, path) {
        const urlParts = path.split('/');
        const endpoint = urlParts[3]; // /api/platform/[endpoint]
        
        try {
            if (endpoint === 'dashboard') {
                // Get user dashboard
                const authHeader = req.headers.authorization;
                const token = authHeader?.split(' ')[1];
                
                const dashboard = await this.seeDooPlatform.getUserDashboard(
                    req.userId || 'guest',
                    token
                );
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(dashboard));
                
            } else if (endpoint === 'do' && urlParts[4]) {
                // Execute action
                const actionId = urlParts[4];
                let body = '';
                
                req.on('data', chunk => body += chunk);
                req.on('end', async () => {
                    const data = JSON.parse(body);
                    const result = await this.seeDooPlatform.doList[actionId].handler(
                        data.userId,
                        data.params
                    );
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(result));
                });
                
            } else {
                res.writeHead(404);
                res.end('Platform endpoint not found');
            }
        } catch (error) {
            console.error('Platform API error:', error);
            res.writeHead(500);
            res.end(JSON.stringify({ error: error.message }));
        }
    }
};

// Quick test script
async function testSeeDooPlatform() {
    console.log('👁️✅ TESTING SEE & DO PLATFORM');
    console.log('==============================\n');
    
    // Mock unified game node
    const mockGameNode = {
        enterpriseAuditor: { services: {} },
        urlBattle: { startBattle: async () => ({ id: 'battle_123', result: 'victory' }) },
        dataReversal: { startReversalBattle: async () => ({ id: 'reversal_123' }) },
        financialAnalyzer: { analyzeTransactionHistory: async () => ({ id: 'analysis_123' }) },
        achievements: { getPlayerAchievements: async () => [] }
    };
    
    const platform = new UnifiedSeeDooPlatform(mockGameNode);
    
    // Test creating a user
    const user = await platform.onionSearch.createUser('testuser', {
        search_style: 'explorer',
        ui_theme: 'dark'
    });
    console.log('✅ Created user:', user.username);
    
    // Test search
    const searchResult = await platform.doOnionSearch(user.id, {
        query: 'hidden secrets'
    });
    console.log('🔍 Search completed:', searchResult.results.query);
    console.log('   Layer:', searchResult.results.layer);
    console.log('   XP gained:', searchResult.xp_gained);
    
    // Test dashboard
    const dashboard = await platform.getUserDashboard(user.id, null);
    console.log('\n📊 User Dashboard:');
    console.log('   Available services:', dashboard.available.length);
    console.log('   Available actions:', dashboard.actions.length);
    
    console.log('\n✅ Platform test complete!');
    console.log('🌐 Ready to integrate into unified-game-node.js');
}

// Export integration instructions
module.exports = {
    platformMethods,
    integrationSteps: `
1. Add to unified-game-node.js constructor:
   this.seeDooPlatform = new UnifiedSeeDooPlatform(this);

2. Add routes in handleRequest:
   } else if (path === '/platform') {
       this.servePlatform(res);
   } else if (path === '/search') {
       this.serveOnionSearch(res);

3. Add API handler:
   } else if (path.startsWith('/api/platform/')) {
       this.handlePlatformAPI(req, res, path);

4. Add the methods from platformMethods object

5. Update console logs to show new endpoints:
   • Platform Hub: http://localhost:8090/platform
   • Onion Search: http://localhost:8090/search
`,
    testSeeDooPlatform
};

// Run test if executed directly
if (require.main === module) {
    testSeeDooPlatform().catch(console.error);
}