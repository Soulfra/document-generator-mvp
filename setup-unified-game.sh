#!/bin/bash

# UNIFIED GAME SETUP SCRIPT
# One-command setup that ensures everything is ready

echo "🎮 UNIFIED GAME SETUP"
echo "===================="
echo "Setting up everything needed for the game to run properly"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check Node.js
echo "🔍 Checking Node.js..."
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✅ Node.js installed: ${NODE_VERSION}${NC}"
else
    echo -e "${RED}❌ Node.js not installed${NC}"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check npm
echo ""
echo "🔍 Checking npm..."
if command -v npm >/dev/null 2>&1; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✅ npm installed: ${NPM_VERSION}${NC}"
else
    echo -e "${RED}❌ npm not installed${NC}"
    exit 1
fi

# Check PostgreSQL
echo ""
echo "🔍 Checking PostgreSQL..."
if command -v psql >/dev/null 2>&1; then
    PSQL_VERSION=$(psql --version | head -n 1)
    echo -e "${GREEN}✅ PostgreSQL installed: ${PSQL_VERSION}${NC}"
else
    echo -e "${RED}❌ PostgreSQL not installed${NC}"
    echo "Please install PostgreSQL:"
    echo "  macOS: brew install postgresql"
    echo "  Linux: sudo apt-get install postgresql"
    exit 1
fi

# Start PostgreSQL if not running
echo ""
echo "🔍 Checking PostgreSQL service..."
if pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ PostgreSQL is running${NC}"
else
    echo -e "${YELLOW}⚠️  PostgreSQL is not running, attempting to start...${NC}"
    
    # Try to start PostgreSQL
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        brew services start postgresql 2>/dev/null || {
            echo -e "${RED}❌ Failed to start PostgreSQL${NC}"
            echo "Try: brew services start postgresql"
            exit 1
        }
    else
        # Linux
        sudo systemctl start postgresql 2>/dev/null || {
            echo -e "${RED}❌ Failed to start PostgreSQL${NC}"
            echo "Try: sudo systemctl start postgresql"
            exit 1
        }
    fi
    
    # Wait for PostgreSQL to start
    sleep 3
    
    if pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL started successfully${NC}"
    else
        echo -e "${RED}❌ PostgreSQL failed to start${NC}"
        exit 1
    fi
fi

# Create database user if needed
echo ""
echo "🔍 Checking database user..."
if psql -U postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='postgres'" 2>/dev/null | grep -q 1; then
    echo -e "${GREEN}✅ Database user 'postgres' exists${NC}"
else
    echo -e "${YELLOW}⚠️  Creating database user 'postgres'...${NC}"
    createuser -s postgres 2>/dev/null || {
        echo -e "${YELLOW}Note: May need sudo to create user${NC}"
    }
fi

# Create database
echo ""
echo "🔍 Checking database..."
if psql -h localhost -p 5432 -U postgres -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw document_generator_game; then
    echo -e "${GREEN}✅ Database 'document_generator_game' exists${NC}"
else
    echo -e "${YELLOW}⚠️  Creating database 'document_generator_game'...${NC}"
    createdb -h localhost -p 5432 -U postgres document_generator_game 2>/dev/null || {
        # Try with psql if createdb fails
        psql -U postgres -c "CREATE DATABASE document_generator_game;" 2>/dev/null || {
            echo -e "${RED}❌ Failed to create database${NC}"
            echo "Try manually:"
            echo "  psql -U postgres"
            echo "  CREATE DATABASE document_generator_game;"
            echo "  \\q"
            exit 1
        }
    }
    echo -e "${GREEN}✅ Database created successfully${NC}"
fi

# Install npm dependencies
echo ""
echo "📦 Installing npm dependencies..."
if [ -f "package.json" ]; then
    # Check if node_modules exists and is recent
    if [ -d "node_modules" ] && [ -f "node_modules/.package-lock.json" ]; then
        echo -e "${YELLOW}Dependencies already installed, checking...${NC}"
        npm list ws pg express >/dev/null 2>&1 || {
            echo -e "${YELLOW}Some dependencies missing, reinstalling...${NC}"
            npm install
        }
    else
        npm install
    fi
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${YELLOW}⚠️  No package.json found, checking individual dependencies...${NC}"
    
    # Check required modules
    MISSING_DEPS=()
    
    node -e "require('ws')" 2>/dev/null || MISSING_DEPS+=("ws")
    node -e "require('pg')" 2>/dev/null || MISSING_DEPS+=("pg")
    node -e "require('express')" 2>/dev/null || MISSING_DEPS+=("express")
    
    if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
        echo -e "${YELLOW}Installing missing dependencies: ${MISSING_DEPS[*]}${NC}"
        npm install ${MISSING_DEPS[*]}
    else
        echo -e "${GREEN}✅ All required dependencies are installed${NC}"
    fi
fi

# Create necessary directories
echo ""
echo "📁 Creating necessary directories..."
mkdir -p logs
echo -e "${GREEN}✅ Directories created${NC}"

# Check for required files
echo ""
echo "🔍 Checking required files..."
REQUIRED_FILES=(
    "unified-game-server.js"
    "unified-game-client.js"
    "unified-game-client.html"
    "launch-unified-game.sh"
)

MISSING_FILES=()
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ Found: $file${NC}"
    else
        echo -e "${RED}❌ Missing: $file${NC}"
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo -e "${RED}❌ Some required files are missing${NC}"
    echo "Please ensure all game files are present"
    exit 1
fi

# Make scripts executable
echo ""
echo "🔧 Making scripts executable..."
chmod +x launch-unified-game.sh
chmod +x setup-unified-game.sh
echo -e "${GREEN}✅ Scripts are executable${NC}"

# Test database connection
echo ""
echo "🔍 Testing database connection..."
node -e "
const { Pool } = require('pg');
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'document_generator_game',
    user: 'postgres',
    password: 'postgres'
});

pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Database connection test failed:', err.message);
        process.exit(1);
    } else {
        console.log('✅ Database connection successful:', res.rows[0].now);
        pool.end();
    }
});
" || {
    echo -e "${RED}❌ Database connection test failed${NC}"
    exit 1
}

# Summary
echo ""
echo "=================================="
echo -e "${GREEN}✅ SETUP COMPLETE!${NC}"
echo "=================================="
echo ""
echo "Everything is ready! You can now run:"
echo -e "${BLUE}./launch-unified-game.sh${NC}"
echo ""
echo "System Status:"
echo "  • Node.js: ✅ Installed"
echo "  • PostgreSQL: ✅ Running"
echo "  • Database: ✅ Created"
echo "  • Dependencies: ✅ Installed"
echo "  • Files: ✅ Present"
echo ""
echo "🎮 Happy gaming!"