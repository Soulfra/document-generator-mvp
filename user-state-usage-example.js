#!/usr/bin/env node
const { loadUserState } = require('./user-state-loader');

/**
 * 🎯 SIMPLE USAGE EXAMPLE
 * 
 * This is exactly what you asked for: "load a file or path and return a state from the userid or login"
 * 
 * Key features:
 * - Simple API: loadUserState(identifier)
 * - Never crashes the system 
 * - Always returns user state (cached if needed)
 * - Works with any identifier type
 * - Steam Deck / AMD GPU compatible
 */

async function simpleExample() {
    console.log('🎯 Simple User State Loading Example');
    console.log('====================================');
    
    try {
        // The simplest possible usage - exactly what you need
        console.log('Loading user state for "cal_pirate"...');
        const userState = await loadUserState('cal_pirate');
        
        console.log('✅ User loaded successfully!');
        console.log('Username:', userState.username);
        console.log('Level:', userState.level);
        console.log('Status:', userState.status);
        console.log('Games:', userState.games);
        console.log('Load time:', userState._loadTime + 'ms');
        console.log('Source:', userState._source);
        
        // That's it! No complexity, no crashes, just works.
        console.log('\n🎉 Simple and bulletproof!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Real-world integration example
class GameLauncher {
    async authenticateUser(identifier) {
        // This is all you need - one line!
        const user = await loadUserState(identifier);
        
        // Always returns valid user state, never crashes
        if (user.status === 'active') {
            console.log(`🎮 Welcome back, ${user.username}!`);
            console.log(`🏆 Level ${user.level} | Games: ${user.games.length}`);
            return user;
        } else {
            console.log(`👋 Hello ${user.username}, please sign in`);
            return user;
        }
    }
    
    async startGame(userId, gameName) {
        const user = await loadUserState(userId);
        
        if (user.games.includes(gameName)) {
            console.log(`🚀 Launching ${gameName} for ${user.username}`);
            return { success: true, user };
        } else {
            console.log(`🔒 ${gameName} not unlocked for ${user.username}`);
            return { success: false, user };
        }
    }
}

// Express.js middleware example
function createUserMiddleware() {
    return async (req, res, next) => {
        try {
            // Get user from any source - token, session, etc.
            const identifier = req.headers.authorization || req.session?.userId || req.query.user;
            
            // This never fails, always returns user state
            req.user = await loadUserState(identifier);
            next();
        } catch (error) {
            // Even if this somehow fails, we still get empty user state
            req.user = { status: 'guest', username: 'anonymous' };
            next();
        }
    };
}

// Usage in API routes
async function apiExample() {
    const express = require('express');
    const app = express();
    
    // Add the middleware
    app.use(createUserMiddleware());
    
    // Any route now has req.user available
    app.get('/api/profile', async (req, res) => {
        res.json({
            username: req.user.username,
            level: req.user.level,
            status: req.user.status,
            loadTime: req.user._loadTime
        });
    });
    
    console.log('🌐 API server ready with bulletproof user loading');
}

// CLI demonstration
if (require.main === module) {
    const command = process.argv[2] || 'simple';
    
    switch (command) {
        case 'simple':
            simpleExample();
            break;
        case 'game':
            const launcher = new GameLauncher();
            launcher.authenticateUser('cal_pirate');
            break;
        case 'api':
            apiExample();
            break;
        default:
            console.log('Usage: node user-state-usage-example.js [simple|game|api]');
    }
}

module.exports = {
    GameLauncher,
    createUserMiddleware,
    simpleExample
};