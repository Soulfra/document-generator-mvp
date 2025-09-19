#!/bin/bash
# 🎮 FLASHPAD BROWSER SETUP SCRIPT
# Sets up the complete stealth Flash game browser/OS clone
# Following BUILD-FROM-SCRATCH instructions

echo "🎮 FLASHPAD BROWSER SETUP - Stealth Work Environment"
echo "=================================================="
echo ""

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js v18+${NC}"
    exit 1
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker${NC}"
    exit 1
fi

# Check Git
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git is not installed. Please install Git${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites met${NC}"
echo ""

# STEP 1: INITIAL SETUP
echo -e "${YELLOW}STEP 1: Initial Setup${NC}"
echo "Creating project structure..."

# Ensure we're in the right directory
cd ~/Desktop/Document-Generator || exit 1

# Create necessary directories
mkdir -p flashpad-browser/{src,public,config,scripts,services}
mkdir -p flashpad-browser/src/{auth,browser,games,xml,visual}
mkdir -p flashpad-browser/public/{assets,sounds,images,css,js}
mkdir -p flashpad-browser/config/{xml,sql,env}

echo -e "${GREEN}✅ Directory structure created${NC}"

# STEP 2: COPY EXISTING COMPONENTS
echo ""
echo -e "${YELLOW}STEP 2: Integrating Existing Components${NC}"

# Copy AUTH-FOUNDATION-SYSTEM
echo "Copying AUTH-FOUNDATION-SYSTEM..."
cp AUTH-FOUNDATION-SYSTEM.js flashpad-browser/src/auth/
cp -r database/migrations flashpad-browser/config/sql/ 2>/dev/null || true

# Copy Boot Sequence
echo "Copying American Hacker Boot Sequence..."
cp AMERICAN-HACKER-BOOT-SEQUENCE-FIXED.html flashpad-browser/public/boot.html

# Copy Electron Launcher
echo "Copying Electron Google Tor Launcher..."
cp electron-google-tor-test-launcher.js flashpad-browser/src/browser/

# Copy Visual Mockup
echo "Copying Visual Mockup..."
cp FLASHPAD-BROWSER-VISUAL-MOCKUP.html flashpad-browser/public/index.html

# Copy XML Schemas
echo "Copying XML Specifications..."
cp HIERARCHICAL-SYSTEM-XML-MAPPING.xml flashpad-browser/config/xml/
cp HOLLOWTOWN-YELLOWBOOK-SPECIFICATION.xml flashpad-browser/config/xml/

# Copy SQL Schemas
echo "Copying Database Schemas..."
cp sql/unified-schema.sql flashpad-browser/config/sql/

# Copy Workplace Monitoring Games
echo "Copying Stealth Workplace Systems..."
cp workplace-memory-game-anomaly-detector.js flashpad-browser/src/games/
cp ai-orchestrated-hook-flash-yaml-multiverse.js flashpad-browser/src/games/

echo -e "${GREEN}✅ Existing components integrated${NC}"

# STEP 3: CREATE PACKAGE.JSON
echo ""
echo -e "${YELLOW}STEP 3: Creating package.json${NC}"

cat > flashpad-browser/package.json << 'EOF'
{
  "name": "flashpad-browser",
  "version": "1.0.0",
  "description": "Stealth Flash Game Browser/OS Clone",
  "main": "src/main.js",
  "scripts": {
    "start": "node src/main.js",
    "electron": "electron src/browser/electron-main.js",
    "auth": "node src/auth/AUTH-FOUNDATION-SYSTEM.js",
    "dev": "nodemon src/main.js",
    "build": "npm run build:css && npm run build:js",
    "build:css": "echo 'CSS build complete'",
    "build:js": "echo 'JS build complete'",
    "test": "jest",
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "setup:db": "node scripts/setup-database.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "ws": "^8.13.0",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "dotenv": "^16.0.3",
    "sqlite3": "^5.1.6",
    "jsonwebtoken": "^9.0.0",
    "bcrypt": "^5.1.0",
    "uuid": "^9.0.0",
    "qrcode": "^1.5.1",
    "xml2js": "^0.6.0",
    "node-fetch": "^3.3.1"
  },
  "devDependencies": {
    "electron": "^25.0.0",
    "jest": "^29.5.0",
    "nodemon": "^2.0.22"
  },
  "keywords": ["flashpad", "browser", "stealth", "game"],
  "author": "FlashPad Team",
  "license": "MIT"
}
EOF

echo -e "${GREEN}✅ package.json created${NC}"

# STEP 4: CREATE MAIN ENTRY POINT
echo ""
echo -e "${YELLOW}STEP 4: Creating Main Entry Point${NC}"

cat > flashpad-browser/src/main.js << 'EOF'
#!/usr/bin/env node

/**
 * FLASHPAD BROWSER - Main Entry Point
 * Orchestrates all services and systems
 */

const express = require('express');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

class FlashPadBrowser {
    constructor() {
        this.app = express();
        this.port = 3000;
        this.services = new Map();
        
        console.log(`
╔═══════════════════════════════════════╗
║      FLASHPAD BROWSER v1.0.0          ║
║   Stealth Work Environment Active     ║
╚═══════════════════════════════════════╝
        `);
        
        this.initialize();
    }
    
    async initialize() {
        // Set up Express
        this.app.use(express.static(path.join(__dirname, '../public')));
        this.app.use(express.json());
        
        // Start services
        await this.startServices();
        
        // Set up routes
        this.setupRoutes();
        
        // Start main server
        this.app.listen(this.port, () => {
            console.log(`🎮 FlashPad Browser running at http://localhost:${this.port}`);
            console.log(`🔐 Auth System at http://localhost:8888`);
            console.log(`🌐 Press Ctrl+C to stop all services`);
        });
    }
    
    async startServices() {
        console.log('Starting services...');
        
        // Start AUTH-FOUNDATION-SYSTEM
        const authProcess = spawn('node', [
            path.join(__dirname, 'auth/AUTH-FOUNDATION-SYSTEM.js')
        ], { stdio: 'inherit' });
        
        this.services.set('auth', authProcess);
        
        // Give auth system time to start
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('✅ All services started');
    }
    
    setupRoutes() {
        // Main route serves the boot sequence
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, '../public/boot.html'));
        });
        
        // FlashPad game interface
        this.app.get('/flashpad', (req, res) => {
            res.sendFile(path.join(__dirname, '../public/index.html'));
        });
        
        // API endpoints
        this.app.get('/api/status', (req, res) => {
            res.json({
                status: 'online',
                services: {
                    auth: this.services.has('auth') ? 'running' : 'stopped',
                    tor: 'simulated',
                    flash: 'enabled'
                },
                uptime: process.uptime()
            });
        });
    }
    
    // Cleanup on exit
    cleanup() {
        console.log('\nShutting down services...');
        this.services.forEach((process, name) => {
            console.log(`Stopping ${name}...`);
            process.kill();
        });
        process.exit(0);
    }
}

// Start the browser
const browser = new FlashPadBrowser();

// Handle shutdown
process.on('SIGINT', () => browser.cleanup());
process.on('SIGTERM', () => browser.cleanup());
EOF

echo -e "${GREEN}✅ Main entry point created${NC}"

# STEP 5: CREATE ELECTRON WRAPPER
echo ""
echo -e "${YELLOW}STEP 5: Creating Electron Wrapper${NC}"

cat > flashpad-browser/src/browser/electron-main.js << 'EOF'
const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');

class FlashPadElectron {
    constructor() {
        this.mainWindow = null;
        this.torEnabled = false;
        
        app.whenReady().then(() => this.createWindow());
        app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') app.quit();
        });
    }
    
    createWindow() {
        this.mainWindow = new BrowserWindow({
            width: 1400,
            height: 900,
            title: 'FlashPad Browser - Stealth Edition',
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'preload.js')
            },
            icon: path.join(__dirname, '../../public/images/flashpad-icon.png')
        });
        
        // Load the boot sequence
        this.mainWindow.loadFile(path.join(__dirname, '../../public/boot.html'));
        
        // Set up IPC handlers
        this.setupIPC();
    }
    
    setupIPC() {
        ipcMain.handle('enable-tor', async () => {
            // Simulate Tor connection
            this.torEnabled = true;
            return { success: true, message: 'Tor connection established' };
        });
        
        ipcMain.handle('get-system-status', async () => {
            return {
                tor: this.torEnabled,
                auth: true, // Assuming auth is running
                flash: true
            };
        });
    }
}

// Start Electron app
new FlashPadElectron();
EOF

echo -e "${GREEN}✅ Electron wrapper created${NC}"

# STEP 6: CREATE DATABASE SETUP SCRIPT
echo ""
echo -e "${YELLOW}STEP 6: Creating Database Setup Script${NC}"

cat > flashpad-browser/scripts/setup-database.js << 'EOF'
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

console.log('Setting up FlashPad Browser database...');

// Create databases directory
const dbDir = path.join(__dirname, '../databases');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir);
}

// Initialize main database
const db = new sqlite3.Database(path.join(dbDir, 'flashpad.db'));

// Read and execute unified schema
const schemaPath = path.join(__dirname, '../config/sql/unified-schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

// SQLite doesn't support some PostgreSQL features, so we need to adapt
const sqliteSchema = schema
    .replace(/UUID/g, 'TEXT')
    .replace(/gen_random_uuid\(\)/g, "hex(randomblob(16))")
    .replace(/JSONB/g, 'TEXT')
    .replace(/CREATE EXTENSION.*?;/g, '')
    .replace(/~\*/g, 'LIKE');

db.exec(sqliteSchema, (err) => {
    if (err) {
        console.error('Error creating schema:', err);
    } else {
        console.log('✅ Database schema created successfully');
    }
    db.close();
});
EOF

echo -e "${GREEN}✅ Database setup script created${NC}"

# STEP 7: CREATE DOCKER COMPOSE
echo ""
echo -e "${YELLOW}STEP 7: Creating Docker Compose Configuration${NC}"

cat > flashpad-browser/docker-compose.yml << 'EOF'
version: '3.8'

services:
  flashpad-browser:
    build: .
    ports:
      - "3000:3000"      # Main browser
      - "8888:8888"      # Auth system
      - "8889:8889"      # WebSocket
    environment:
      - NODE_ENV=production
      - AUTH_PORT=8888
      - WS_PORT=8889
    volumes:
      - ./databases:/app/databases
      - ./logs:/app/logs
    restart: unless-stopped

  tor-proxy:
    image: dperson/torproxy
    ports:
      - "9050:9050"      # SOCKS5
      - "9051:9051"      # Control port
    restart: unless-stopped

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    restart: unless-stopped
EOF

echo -e "${GREEN}✅ Docker compose configuration created${NC}"

# STEP 8: CREATE DOCKERFILE
echo ""
echo -e "${YELLOW}STEP 8: Creating Dockerfile${NC}"

cat > flashpad-browser/Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create necessary directories
RUN mkdir -p databases logs

# Expose ports
EXPOSE 3000 8888 8889

# Start the application
CMD ["npm", "start"]
EOF

echo -e "${GREEN}✅ Dockerfile created${NC}"

# STEP 9: CREATE ENV FILE
echo ""
echo -e "${YELLOW}STEP 9: Creating Environment Configuration${NC}"

cat > flashpad-browser/.env.example << 'EOF'
# FlashPad Browser Configuration
NODE_ENV=development
PORT=3000

# Auth System
AUTH_PORT=8888
WS_PORT=8889
JWT_SECRET=your-secret-key-here

# Tor Configuration
TOR_ENABLED=true
TOR_PORT=9050
TOR_CONTROL_PORT=9051

# Database
DB_PATH=./databases/flashpad.db

# Features
STEALTH_MODE=true
FLASH_GAME_ENABLED=true
YELLOW_THEME=true
EOF

cp flashpad-browser/.env.example flashpad-browser/.env
echo -e "${GREEN}✅ Environment configuration created${NC}"

# STEP 10: INSTALL DEPENDENCIES
echo ""
echo -e "${YELLOW}STEP 10: Installing Dependencies${NC}"

cd flashpad-browser
npm install

echo -e "${GREEN}✅ Dependencies installed${NC}"

# STEP 11: SETUP DATABASE
echo ""
echo -e "${YELLOW}STEP 11: Setting up Database${NC}"

node scripts/setup-database.js

echo -e "${GREEN}✅ Database setup complete${NC}"

# FINAL MESSAGE
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ FLASHPAD BROWSER SETUP COMPLETE!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""
echo "To start FlashPad Browser:"
echo ""
echo "  1. Development mode:"
echo "     cd flashpad-browser"
echo "     npm start"
echo ""
echo "  2. Electron mode:"
echo "     cd flashpad-browser"
echo "     npm run electron"
echo ""
echo "  3. Docker mode:"
echo "     cd flashpad-browser"
echo "     docker-compose up"
echo ""
echo "Access points:"
echo "  - Main Browser: http://localhost:3000"
echo "  - Auth System: http://localhost:8888"
echo "  - Boot Sequence: http://localhost:3000/"
echo "  - FlashPad Game: http://localhost:3000/flashpad"
echo ""
echo "Keyboard shortcuts:"
echo "  - Ctrl+Shift+B: Toggle browser mode"
echo "  - Ctrl+Shift+M: Toggle menu"
echo "  - Escape: Hide all overlays"
echo ""
echo -e "${YELLOW}Happy stealth browsing! 🎮${NC}"