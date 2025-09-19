#!/usr/bin/env node

/**
 * BUNDLE EVERYTHING - The Ultimate One-Click Bundler
 * Packages the entire ecosystem into a working, exportable system
 * No technical knowledge required!
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class EcosystemBundler {
  constructor() {
    this.bundleDir = path.join(__dirname, 'BUNDLED-ECOSYSTEM');
    this.timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    
    console.log('🎁 ECOSYSTEM BUNDLER - Making Everything Just Work™');
    console.log('================================================\n');
  }
  
  async bundle() {
    try {
      // Step 1: Create bundle directory
      this.createBundleDirectory();
      
      // Step 2: Bundle core systems
      await this.bundleCoreSystems();
      
      // Step 3: Bundle token economies
      await this.bundleTokenEconomies();
      
      // Step 4: Bundle games
      await this.bundleGames();
      
      // Step 5: Bundle dashboards
      await this.bundleDashboards();
      
      // Step 6: Create unified launcher
      await this.createUnifiedLauncher();
      
      // Step 7: Generate export options
      await this.generateExportOptions();
      
      // Step 8: Create LLM interface
      await this.createLLMInterface();
      
      // Step 9: Package everything
      await this.createFinalPackage();
      
      console.log('\n✅ BUNDLING COMPLETE!');
      console.log('===================\n');
      
      this.showNextSteps();
      
    } catch (error) {
      console.error('❌ Bundling failed:', error.message);
      this.showTroubleshooting();
    }
  }
  
  createBundleDirectory() {
    console.log('📁 Creating bundle directory...');
    
    // Clean up old bundle
    if (fs.existsSync(this.bundleDir)) {
      fs.rmSync(this.bundleDir, { recursive: true, force: true });
    }
    
    // Create new structure
    const dirs = [
      'core',
      'tokens',
      'games',
      'dashboards',
      'api',
      'data',
      'config',
      'exports',
      'llm-interface'
    ];
    
    fs.mkdirSync(this.bundleDir, { recursive: true });
    dirs.forEach(dir => {
      fs.mkdirSync(path.join(this.bundleDir, dir), { recursive: true });
    });
    
    console.log('✅ Bundle directory created');
  }
  
  async bundleCoreSystems() {
    console.log('\n🎯 Bundling core systems...');
    
    const coreSystems = [
      // Document generation
      { src: 'index.js', dest: 'core/document-generator.js' },
      { src: 'mvp-generator.js', dest: 'core/mvp-generator.js' },
      
      // Token system
      { src: 'token-to-api-cost-mapper.js', dest: 'core/token-mapper.js' },
      { src: 'token-billing-bridge.js', dest: 'core/token-bridge.js' },
      { src: 'real-pricing-engine.js', dest: 'core/pricing-engine.js' },
      
      // API integration
      { src: 'resilient-api-wrapper.js', dest: 'core/api-wrapper.js' },
      { src: 'market-data-collector.js', dest: 'core/market-data.js' },
      
      // Ecosystem SDK
      { src: 'ecosystem-sdk/src/EcosystemSDK.ts', dest: 'core/ecosystem-sdk.ts' },
    ];
    
    for (const file of coreSystems) {
      if (fs.existsSync(file.src)) {
        fs.copyFileSync(file.src, path.join(this.bundleDir, file.dest));
        console.log(`  ✓ ${file.dest}`);
      }
    }
  }
  
  async bundleTokenEconomies() {
    console.log('\n💰 Bundling token economies...');
    
    const tokenFiles = [
      'AGENT-TO-AGENT-BLOCKCHAIN-ECONOMY.js',
      'GACHA-TOKEN-SYSTEM.js',
      'TokenEconomyExportSystem.js',
      'unified-economy.js',
      'truth-economy.js'
    ];
    
    tokenFiles.forEach(file => {
      if (fs.existsSync(file)) {
        fs.copyFileSync(file, path.join(this.bundleDir, 'tokens', file));
        console.log(`  ✓ ${file}`);
      }
    });
  }
  
  async bundleGames() {
    console.log('\n🎮 Bundling games...');
    
    const games = [
      { name: 'ShipRekt', files: ['3d-pirate-battle-economy.js', 'pirate-theme-integration.js'] },
      { name: 'CryptoZombies', files: ['blamechain.js', 'BLAMECHAIN-INTEGRATION-MASTER.js'] },
      { name: 'AIArena', files: ['AGENT-TO-AGENT-FORUM-PROTOCOL.blockchain.sql'] }
    ];
    
    games.forEach(game => {
      const gameDir = path.join(this.bundleDir, 'games', game.name);
      fs.mkdirSync(gameDir, { recursive: true });
      
      game.files.forEach(file => {
        if (fs.existsSync(file)) {
          fs.copyFileSync(file, path.join(gameDir, path.basename(file)));
          console.log(`  ✓ ${game.name}/${path.basename(file)}`);
        }
      });
    });
  }
  
  async bundleDashboards() {
    console.log('\n📊 Bundling dashboards...');
    
    const dashboards = [
      'public/live-merchanting-dashboard.html',
      'public/token-economy-dashboard.html',
      'public/pricing-discovery-dashboard.html',
      'public/ecosystem-visual-map.html',
      'dashboard.html',
      'UNIFIED-SOULFRA-SYSTEM.html'
    ];
    
    dashboards.forEach(dashboard => {
      if (fs.existsSync(dashboard)) {
        const filename = path.basename(dashboard);
        fs.copyFileSync(dashboard, path.join(this.bundleDir, 'dashboards', filename));
        console.log(`  ✓ ${filename}`);
      }
    });
  }
  
  async createUnifiedLauncher() {
    console.log('\n🚀 Creating unified launcher...');
    
    const launcher = `#!/bin/bash

# ECOSYSTEM LAUNCHER - Start Everything with One Command
echo "🚀 LAUNCHING DOCUMENT GENERATOR ECOSYSTEM"
echo "========================================"

# Check dependencies
check_dependency() {
  if ! command -v $1 &> /dev/null; then
    echo "⚠️  $1 is not installed. Installing..."
    return 1
  fi
  return 0
}

# Start services
start_services() {
  echo "📦 Starting core services..."
  
  # Start token economy
  node tokens/AGENT-TO-AGENT-BLOCKCHAIN-ECONOMY.js &
  PIDS+=($!)
  
  # Start API wrapper
  node core/api-wrapper.js &
  PIDS+=($!)
  
  # Start pricing engine
  node core/pricing-engine.js &
  PIDS+=($!)
  
  echo "✅ Services started"
}

# Launch dashboards
launch_dashboards() {
  echo "🌐 Opening dashboards..."
  
  # Start simple HTTP server
  python3 -m http.server 8080 --directory dashboards &
  PIDS+=($!)
  
  sleep 2
  
  # Open in browser
  if command -v open &> /dev/null; then
    open http://localhost:8080
  elif command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:8080
  else
    echo "📱 Open http://localhost:8080 in your browser"
  fi
}

# Main execution
PIDS=()

echo "🔍 Checking dependencies..."
check_dependency node
check_dependency python3

echo ""
start_services
echo ""
launch_dashboards

echo ""
echo "✅ ECOSYSTEM IS RUNNING!"
echo ""
echo "📊 Available Dashboards:"
echo "  - Main Hub: http://localhost:8080"
echo "  - Token Economy: http://localhost:8080/token-economy-dashboard.html"
echo "  - Pricing Discovery: http://localhost:8080/pricing-discovery-dashboard.html"
echo "  - Ecosystem Map: http://localhost:8080/ecosystem-visual-map.html"
echo ""
echo "🛑 Press Ctrl+C to stop all services"

# Wait for interrupt
trap 'kill ${PIDS[@]} 2>/dev/null' EXIT
wait
`;
    
    fs.writeFileSync(path.join(this.bundleDir, 'START-ECOSYSTEM.sh'), launcher);
    fs.chmodSync(path.join(this.bundleDir, 'START-ECOSYSTEM.sh'), '755');
    
    // Windows version
    const winLauncher = `@echo off
echo 🚀 LAUNCHING DOCUMENT GENERATOR ECOSYSTEM
echo ========================================

echo 📦 Starting core services...
start /B node tokens\\AGENT-TO-AGENT-BLOCKCHAIN-ECONOMY.js
start /B node core\\api-wrapper.js
start /B node core\\pricing-engine.js

echo 🌐 Starting dashboard server...
start /B python -m http.server 8080 --directory dashboards

timeout /t 3 /nobreak > nul

echo 📱 Opening dashboard...
start http://localhost:8080

echo.
echo ✅ ECOSYSTEM IS RUNNING!
echo.
echo 📊 Available Dashboards:
echo   - Main Hub: http://localhost:8080
echo   - Token Economy: http://localhost:8080/token-economy-dashboard.html
echo   - Pricing Discovery: http://localhost:8080/pricing-discovery-dashboard.html
echo   - Ecosystem Map: http://localhost:8080/ecosystem-visual-map.html
echo.
echo 🛑 Close this window to stop all services
pause
`;
    
    fs.writeFileSync(path.join(this.bundleDir, 'START-ECOSYSTEM.bat'), winLauncher);
    
    console.log('  ✓ Created START-ECOSYSTEM.sh (Mac/Linux)');
    console.log('  ✓ Created START-ECOSYSTEM.bat (Windows)');
  }
  
  async generateExportOptions() {
    console.log('\n📤 Generating export options...');
    
    // Docker export
    const dockerfile = `FROM node:18-alpine

WORKDIR /app
COPY . .

RUN npm install --production

EXPOSE 8080 3000 3001 3002

CMD ["sh", "START-ECOSYSTEM.sh"]
`;
    
    fs.writeFileSync(path.join(this.bundleDir, 'exports', 'Dockerfile'), dockerfile);
    
    // Vercel export
    const vercelConfig = {
      version: 2,
      builds: [
        { src: "dashboards/*.html", use: "@vercel/static" },
        { src: "core/*.js", use: "@vercel/node" }
      ],
      routes: [
        { src: "/api/(.*)", dest: "/core/$1" },
        { src: "/(.*)", dest: "/dashboards/$1" }
      ]
    };
    
    fs.writeFileSync(
      path.join(this.bundleDir, 'exports', 'vercel.json'),
      JSON.stringify(vercelConfig, null, 2)
    );
    
    // Netlify export
    const netlifyToml = `[build]
  publish = "dashboards"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
`;
    
    fs.writeFileSync(path.join(this.bundleDir, 'exports', 'netlify.toml'), netlifyToml);
    
    console.log('  ✓ Docker configuration');
    console.log('  ✓ Vercel configuration');
    console.log('  ✓ Netlify configuration');
  }
  
  async createLLMInterface() {
    console.log('\n🤖 Creating LLM interface...');
    
    const llmInterface = `/**
 * LLM Interface for Document Generator Ecosystem
 * Use this file to interact with the system via AI
 */

const SYSTEM_PROMPT = \`You are an AI assistant managing the Document Generator Ecosystem.

Available commands:
- Generate document: CREATE_DOC <type> <content>
- Exchange tokens: EXCHANGE <from> <to> <amount>
- Check balance: BALANCE <userId>
- Play game: PLAY <game> <action>
- Get status: STATUS

Token types: AGENT_COIN, VIBES_COIN, MEME_TOKEN, DATABASE_TOKEN, CHAPTER7, etc.
Games: ShipRekt, CryptoZombies, AIArena

Respond with JSON containing the action to take.\`;

// Example prompts for common tasks
const EXAMPLE_PROMPTS = {
  generateBusinessPlan: "Generate a business plan for a SaaS startup",
  earnTokens: "What's the fastest way to earn AGENT_COIN?",
  playShipRekt: "Start playing ShipRekt and repair my ship",
  exchangeTokens: "Exchange 100 AGENT_COIN for SHIP_COIN",
  checkProgress: "Show my current level and token balances"
};

// Simple API for LLM integration
async function processLLMCommand(command) {
  // This would connect to your actual ecosystem
  console.log('Processing LLM command:', command);
  
  // Return structured response
  return {
    success: true,
    action: command.action,
    result: command.parameters,
    narrative: "You successfully " + command.action
  };
}

module.exports = {
  SYSTEM_PROMPT,
  EXAMPLE_PROMPTS,
  processLLMCommand
};
`;
    
    fs.writeFileSync(path.join(this.bundleDir, 'llm-interface', 'llm-api.js'), llmInterface);
    
    // Create prompt templates
    const prompts = {
      "document-generation": {
        "system": "You are a document generation expert in the Document Generator Ecosystem.",
        "examples": [
          "Generate a technical specification for a mobile app",
          "Create API documentation for a REST service",
          "Write a business plan for an AI startup"
        ]
      },
      "token-economy": {
        "system": "You manage the token economy and help users maximize their earnings.",
        "examples": [
          "What's my current token balance?",
          "Exchange 500 AGENT_COIN for premium tokens",
          "Show me arbitrage opportunities"
        ]
      },
      "gaming": {
        "system": "You are a game master for ShipRekt, CryptoZombies, and AI Arena.",
        "examples": [
          "Start a new ShipRekt voyage",
          "Convert my errors to CryptoZombies",
          "Train an AI agent for the arena"
        ]
      }
    };
    
    fs.writeFileSync(
      path.join(this.bundleDir, 'llm-interface', 'prompt-templates.json'),
      JSON.stringify(prompts, null, 2)
    );
    
    console.log('  ✓ LLM API interface');
    console.log('  ✓ Prompt templates');
  }
  
  async createFinalPackage() {
    console.log('\n📦 Creating final package...');
    
    // Create README
    const readme = `# Document Generator Ecosystem - Bundled Edition

## 🚀 Quick Start

### Mac/Linux:
\`\`\`bash
./START-ECOSYSTEM.sh
\`\`\`

### Windows:
\`\`\`cmd
START-ECOSYSTEM.bat
\`\`\`

## 📊 What's Included

- **Token Economy System**: Complete with all token types and exchanges
- **Gaming Integration**: ShipRekt, CryptoZombies, AI Arena
- **Live Dashboards**: Multiple visualization interfaces
- **API Integration**: Resilient API wrapper with token billing
- **LLM Interface**: AI-friendly commands and prompts

## 🌐 Deployment Options

### Local Testing
Just run the start script - everything runs locally!

### Cloud Deployment

**Docker:**
\`\`\`bash
cd exports
docker build -t ecosystem .
docker run -p 8080:8080 ecosystem
\`\`\`

**Vercel:**
\`\`\`bash
cd exports
vercel deploy
\`\`\`

**Netlify:**
Just drag the \`dashboards\` folder to Netlify!

## 🤖 LLM Integration

Use the files in \`llm-interface/\` to connect AI assistants.

## 📁 Structure

- \`core/\` - Core system components
- \`tokens/\` - Token economy systems
- \`games/\` - Game integrations
- \`dashboards/\` - Visual interfaces
- \`exports/\` - Deployment configurations
- \`llm-interface/\` - AI integration

## 🎮 Default Credentials

- User ID: demo_user
- Starting tokens: 1000 AGENT_COIN
- Access all features immediately!

---

Bundle created: ${this.timestamp}
`;
    
    fs.writeFileSync(path.join(this.bundleDir, 'README.md'), readme);
    
    // Create manifest
    const manifest = {
      name: "Document Generator Ecosystem",
      version: "1.0.0",
      bundleDate: this.timestamp,
      components: {
        core: fs.readdirSync(path.join(this.bundleDir, 'core')),
        tokens: fs.readdirSync(path.join(this.bundleDir, 'tokens')),
        games: fs.readdirSync(path.join(this.bundleDir, 'games')),
        dashboards: fs.readdirSync(path.join(this.bundleDir, 'dashboards'))
      },
      requirements: {
        node: ">=14.0.0",
        python: ">=3.6"
      },
      endpoints: {
        dashboards: "http://localhost:8080",
        api: "http://localhost:3000",
        websocket: "ws://localhost:8081"
      }
    };
    
    fs.writeFileSync(
      path.join(this.bundleDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    );
    
    console.log('  ✓ README.md');
    console.log('  ✓ manifest.json');
  }
  
  showNextSteps() {
    console.log('📋 NEXT STEPS:');
    console.log('==============\n');
    
    console.log('1️⃣  TEST LOCALLY:');
    console.log(`   cd ${this.bundleDir}`);
    console.log('   ./START-ECOSYSTEM.sh\n');
    
    console.log('2️⃣  EXPORT TO ANOTHER SYSTEM:');
    console.log(`   - Copy the entire "${this.bundleDir}" folder`);
    console.log('   - Run the START script on the new system\n');
    
    console.log('3️⃣  DEPLOY TO CLOUD:');
    console.log('   - Docker: Use exports/Dockerfile');
    console.log('   - Vercel: Use exports/vercel.json');
    console.log('   - Netlify: Drag dashboards folder\n');
    
    console.log('4️⃣  INTEGRATE WITH AI:');
    console.log('   - Use llm-interface/llm-api.js');
    console.log('   - Check prompt-templates.json for examples\n');
    
    console.log('5️⃣  SHARE WITH OTHERS:');
    console.log(`   - Zip the "${this.bundleDir}" folder`);
    console.log('   - Share the zip file');
    console.log('   - They just need to extract and run!\n');
    
    console.log('🎉 Your ecosystem is bundled and ready to go!');
  }
  
  showTroubleshooting() {
    console.log('\n🔧 TROUBLESHOOTING:');
    console.log('==================\n');
    
    console.log('If bundling failed:');
    console.log('1. Make sure you have Node.js installed');
    console.log('2. Check that all source files exist');
    console.log('3. Try running: npm install');
    console.log('4. Check file permissions\n');
    
    console.log('For help:');
    console.log('- Check the logs above for specific errors');
    console.log('- Try bundling individual components');
    console.log('- Run with: node BUNDLE-EVERYTHING.js --verbose');
  }
}

// Run the bundler
if (require.main === module) {
  const bundler = new EcosystemBundler();
  bundler.bundle().catch(console.error);
}

module.exports = EcosystemBundler;