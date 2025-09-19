#!/usr/bin/env node

/**
 * THEMED EMPIRE API
 * Backend for the themed empire launcher
 */

const express = require('express');
const ThemedGameGenerator = require('./themed-game-generator');
const ThemedEmpireSystemTester = require('./test-themed-empire-systems');

const app = express();
app.use(express.json());
app.use(express.static('.'));

const gameGenerator = new ThemedGameGenerator();
const systemTester = new ThemedEmpireSystemTester();

// Serve the launcher
app.get('/themed-launcher', (req, res) => {
  res.sendFile(__dirname + '/themed-empire-launcher.html');
});

// Generate themed game
app.post('/generate-themed-game', async (req, res) => {
  try {
    const { theme, userInput } = req.body;
    
    console.log(`🎮 Generating ${theme} game...`);
    const game = await gameGenerator.generateFromTheme(theme, userInput);
    
    res.json({
      success: true,
      game: game,
      message: `Successfully generated ${game.name}`
    });
  } catch (error) {
    console.error('Game generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Discover empire systems
app.get('/api/empire/discover', async (req, res) => {
  try {
    console.log('🔍 Discovering themed empire systems...');
    
    const systems = await systemTester.discoverThemedSystems();
    const totalSystems = systemTester.generateEmpireReport();
    const connectedSystems = await systemTester.testSystemConnectivity();
    
    res.json({
      success: true,
      discovered: systems,
      stats: {
        totalSystems,
        connectedSystems,
        categories: Object.keys(systems).length
      }
    });
  } catch (error) {
    console.error('Discovery error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get available themes
app.get('/api/themes', async (req, res) => {
  try {
    await gameGenerator.listAvailableThemes();
    
    const themes = {
      'cannabis-tycoon': {
        name: 'Cannabis Tycoon Empire',
        description: 'Build dispensaries and manage cannabis business',
        icon: '🌿',
        available: true,
        empireFile: './depths-civilization-tycoon.js'
      },
      'space-exploration': {
        name: 'Space Exploration',
        description: 'Command starships and explore the galaxy',
        icon: '🚀',
        available: true,
        empireFile: './starship-glass-observer.js'
      },
      'galactic-federation': {
        name: 'Galactic Federation',
        description: 'Manage diplomatic relations across the galaxy',
        icon: '🌌',
        available: true,
        empireFile: './GALACTIC-FEDERATION-TERMINAL.js'
      },
      'civilization-builder': {
        name: 'Civilization Builder',
        description: 'Build and manage great civilizations',
        icon: '🏛️',
        available: true,
        empireFile: './AI-CIVILIZATION-BUILDER.html'
      },
      'enterprise-command': {
        name: 'Enterprise Command',
        description: 'Command the USS Enterprise and crew',
        icon: '🖖',
        available: true,
        empireFile: './ENTERPRISE-INTEGRATION-SYSTEM.js'
      }
    };
    
    res.json({
      success: true,
      themes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test specific themed system
app.get('/api/empire/test/:theme', async (req, res) => {
  try {
    const { theme } = req.params;
    const testInput = `Create a ${theme} game with advanced features`;
    
    const game = await gameGenerator.generateFromTheme(theme, testInput);
    
    res.json({
      success: true,
      theme,
      testResult: game,
      message: `${theme} system test successful`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Empire system health check
app.get('/api/empire/health', async (req, res) => {
  try {
    // Check if empire files exist
    const fs = require('fs').promises;
    const empireFiles = [
      './depths-civilization-tycoon.js',
      './starship-glass-observer.js',
      './GALACTIC-FEDERATION-TERMINAL.js',
      './AI-CIVILIZATION-BUILDER.html',
      './ENTERPRISE-INTEGRATION-SYSTEM.js'
    ];
    
    const healthChecks = await Promise.all(
      empireFiles.map(async (file) => {
        try {
          await fs.access(file);
          const stats = await fs.stat(file);
          return {
            file,
            status: 'healthy',
            size: stats.size,
            modified: stats.mtime
          };
        } catch (error) {
          return {
            file,
            status: 'missing',
            error: error.message
          };
        }
      })
    );
    
    const healthyCount = healthChecks.filter(check => check.status === 'healthy').length;
    const healthPercentage = (healthyCount / empireFiles.length) * 100;
    
    res.json({
      success: true,
      health: {
        percentage: healthPercentage,
        healthy: healthyCount,
        total: empireFiles.length,
        checks: healthChecks
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get empire stats
app.get('/api/empire/stats', async (req, res) => {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    
    // Count all JavaScript and HTML files (empire systems)
    let totalFiles = 0;
    let empireSize = 0;
    
    const countFiles = async (dir) => {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
          
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            if (dir.split('/').length < 3) {
              await countFiles(fullPath);
            }
          } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.html'))) {
            totalFiles++;
            try {
              const stats = await fs.stat(fullPath);
              empireSize += stats.size;
            } catch {}
          }
        }
      } catch {}
    };
    
    await countFiles('.');
    
    res.json({
      success: true,
      stats: {
        totalFiles,
        empireSize,
        empireSizeMB: Math.round(empireSize / 1024 / 1024 * 100) / 100,
        themed_systems: {
          cannabis_tycoon: 42,
          space_empire: 400,
          federation: 50,
          civilization: 30,
          gaming_platforms: 25
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Launch the themed empire API
const PORT = process.env.THEMED_PORT || 5555;

app.listen(PORT, () => {
  console.log(`🏛️ THEMED EMPIRE API LAUNCHED`);
  console.log(`📡 Listening on: http://localhost:${PORT}`);
  console.log(`🎮 Launcher: http://localhost:${PORT}/themed-launcher`);
  console.log(`🔍 Discovery: http://localhost:${PORT}/api/empire/discover`);
  console.log(`🌐 Themes: http://localhost:${PORT}/api/themes`);
  console.log(`📊 Stats: http://localhost:${PORT}/api/empire/stats`);
  console.log(`💚 Health: http://localhost:${PORT}/api/empire/health`);
});

module.exports = app;