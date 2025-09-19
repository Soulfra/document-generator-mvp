#!/usr/bin/env node

/**
 * Auto Setup - Configures everything automatically
 * No technical knowledge required!
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const crypto = require('crypto');

const execAsync = promisify(exec);

// Pretty console output
const colors = {
    green: '\x1b[32m',
    blue: '\x1b[34m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    reset: '\x1b[0m'
};

const log = {
    info: (msg) => console.log(`${colors.blue}ℹ${colors.reset}  ${msg}`),
    success: (msg) => console.log(`${colors.green}✓${colors.reset}  ${msg}`),
    warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset}  ${msg}`),
    error: (msg) => console.log(`${colors.red}✗${colors.reset}  ${msg}`)
};

class AutoSetup {
    async run() {
        console.log('\n🎯 Auto-Setup Starting...\n');
        
        try {
            // 1. Check system
            await this.checkSystem();
            
            // 2. Create directories
            await this.createDirectories();
            
            // 3. Setup environment
            await this.setupEnvironment();
            
            // 4. Install dependencies
            await this.installDependencies();
            
            // 5. Setup database
            await this.setupDatabase();
            
            // 6. Configure AI
            await this.configureAI();
            
            // 7. Create shortcuts
            await this.createShortcuts();
            
            console.log('\n✨ Setup Complete! Everything is ready!\n');
            console.log('Run: ./start-everything.sh\n');
            
        } catch (error) {
            log.error(`Setup failed: ${error.message}`);
            console.log('\nDon\'t worry! Try running: ./start-everything.sh\n');
        }
    }
    
    async checkSystem() {
        log.info('Checking system requirements...');
        
        // Check Node.js
        try {
            const { stdout } = await execAsync('node --version');
            const version = stdout.trim();
            log.success(`Node.js ${version} found`);
        } catch {
            throw new Error('Node.js not found. Please install from https://nodejs.org');
        }
        
        // Check npm
        try {
            const { stdout } = await execAsync('npm --version');
            log.success(`npm v${stdout.trim()} found`);
        } catch {
            throw new Error('npm not found');
        }
        
        // Check for optional tools
        try {
            await execAsync('docker --version');
            log.success('Docker found (optional features available)');
        } catch {
            log.warning('Docker not found (some features limited)');
        }
    }
    
    async createDirectories() {
        log.info('Creating project structure...');
        
        const dirs = [
            'data',
            'logs',
            'uploads',
            'outputs',
            'templates/custom',
            'public/simple-ui',
            'public/assets',
            'public/preview',
            'help-system',
            '.env-backups'
        ];
        
        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true }).catch(() => {});
        }
        
        log.success('Directory structure created');
    }
    
    async setupEnvironment() {
        log.info('Setting up environment...');
        
        const envPath = '.env';
        const envExamplePath = '.env.example';
        
        // Backup existing .env
        try {
            await fs.access(envPath);
            const timestamp = new Date().toISOString().replace(/:/g, '-');
            await fs.copyFile(envPath, `.env-backups/.env.${timestamp}`);
            log.success('Existing .env backed up');
        } catch {
            // No existing .env
        }
        
        // Create new .env with smart defaults
        const envContent = `# Auto-generated configuration
# Generated: ${new Date().toISOString()}

# Server Configuration
PORT=3000
NODE_ENV=production
SESSION_SECRET=${crypto.randomBytes(32).toString('hex')}

# AI Configuration
AI_MODE=auto
ENABLE_LOCAL_AI=true
OLLAMA_BASE_URL=http://localhost:11434

# Optional Cloud AI Keys (add your own if needed)
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...
# GOOGLE_AI_API_KEY=...

# Database
DATABASE_URL=sqlite://./data/app.db
REDIS_URL=redis://localhost:6379

# Features
ENABLE_MAGIC_MODE=true
ENABLE_AUTO_FIX=true
ENABLE_VOICE_INPUT=false
FREE_AI_CREDITS=1000
MAX_UPLOAD_SIZE=50MB

# Security
ENABLE_HTTPS=false
CORS_ORIGIN=*

# Monitoring
ENABLE_ANALYTICS=false
ERROR_REPORTING=minimal

# User Experience
DEFAULT_THEME=light
LANGUAGE=en
TIMEZONE=auto
`;
        
        await fs.writeFile(envPath, envContent);
        log.success('Environment configured');
    }
    
    async installDependencies() {
        log.info('Installing dependencies...');
        
        // Check if node_modules exists
        try {
            await fs.access('node_modules');
            log.success('Dependencies already installed');
            return;
        } catch {
            // Need to install
        }
        
        // Install with progress
        try {
            await execAsync('npm install --no-audit --no-fund --silent', {
                stdio: 'pipe'
            });
            log.success('Dependencies installed');
        } catch (error) {
            log.warning('Some packages failed, trying with --force...');
            await execAsync('npm install --force --no-audit --no-fund --silent');
            log.success('Dependencies installed (forced)');
        }
    }
    
    async setupDatabase() {
        log.info('Setting up database...');
        
        // Create SQLite database
        const dbPath = 'data/app.db';
        
        // Initialize with schema
        const schema = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ai_credits INTEGER DEFAULT 1000,
    preferences TEXT
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'website',
    data TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

-- Templates table
CREATE TABLE IF NOT EXISTS templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT,
    description TEXT,
    template_data TEXT,
    usage_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default templates
INSERT OR IGNORE INTO templates (name, category, description) VALUES
('Modern Website', 'website', 'Beautiful responsive website template'),
('E-commerce Store', 'website', 'Online store with shopping cart'),
('Blog Platform', 'website', 'Content management system'),
('Landing Page', 'website', 'High-converting landing page'),
('Web App', 'app', 'Interactive web application'),
('Dashboard', 'app', 'Analytics dashboard template');
`;
        
        // Create database file if needed
        try {
            const sqlite3 = require('sqlite3').verbose();
            const db = new sqlite3.Database(dbPath);
            
            await new Promise((resolve, reject) => {
                db.exec(schema, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            db.close();
            log.success('Database created and initialized');
        } catch (error) {
            log.warning('SQLite setup skipped (will create on first use)');
        }
    }
    
    async configureAI() {
        log.info('Configuring AI services...');
        
        // Check for Ollama
        try {
            const response = await fetch('http://localhost:11434/api/tags');
            if (response.ok) {
                log.success('Ollama detected - local AI available');
                
                // Try to pull a model
                log.info('Downloading AI model (this may take a few minutes)...');
                try {
                    await execAsync('ollama pull llama2:latest');
                    log.success('AI model ready');
                } catch {
                    log.warning('Could not download model (will download on first use)');
                }
            }
        } catch {
            log.warning('Ollama not running - will use cloud AI');
            
            // Create Ollama installation guide
            const ollamaGuide = `# Installing Ollama (Optional - for free local AI)

1. Visit: https://ollama.ai
2. Download for your system
3. Install like any other app
4. Run: ollama pull llama2

This enables free, private AI processing!
`;
            await fs.writeFile('OLLAMA_SETUP.md', ollamaGuide);
        }
    }
    
    async createShortcuts() {
        log.info('Creating desktop shortcuts...');
        
        // Create start script if it doesn't exist
        if (!await this.fileExists('start-everything.sh')) {
            await fs.writeFile('start-everything.sh', '#!/bin/bash\nnode integrated-launcher.js', {
                mode: 0o755
            });
        }
        
        // Platform-specific shortcuts
        const platform = process.platform;
        
        if (platform === 'darwin') {
            // macOS .command file
            const shortcut = `#!/bin/bash
cd "${process.cwd()}"
./start-everything.sh
`;
            await fs.writeFile('Start AI Builder.command', shortcut, { mode: 0o755 });
            log.success('Created macOS shortcut: Start AI Builder.command');
            
        } else if (platform === 'win32') {
            // Windows .bat file
            const shortcut = `@echo off
cd /d "${process.cwd()}"
start-everything.sh
`;
            await fs.writeFile('Start AI Builder.bat', shortcut);
            log.success('Created Windows shortcut: Start AI Builder.bat');
            
        } else {
            // Linux .desktop file
            const shortcut = `[Desktop Entry]
Name=AI Builder
Comment=Build apps with AI
Exec=${process.cwd()}/start-everything.sh
Icon=${process.cwd()}/public/assets/icon.png
Terminal=true
Type=Application
Categories=Development;
`;
            await fs.writeFile('ai-builder.desktop', shortcut);
            log.success('Created Linux shortcut: ai-builder.desktop');
        }
    }
    
    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }
}

// Run if called directly
if (require.main === module) {
    const setup = new AutoSetup();
    setup.run();
}

module.exports = AutoSetup;