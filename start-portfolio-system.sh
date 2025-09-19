#!/bin/bash

# 🎵🪢 Professional Portfolio System Startup Script
# Integrates authentication, music knot theory, and client management

echo "🎵🪢 Starting Professional Portfolio System..."
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js first.${NC}"
    exit 1
fi

# Check if PostgreSQL is running
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL CLI not found. Make sure PostgreSQL is installed and running.${NC}"
else
    echo -e "${GREEN}✅ PostgreSQL CLI found${NC}"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Installing Node.js dependencies...${NC}"
    npm install express cors pg bcryptjs jsonwebtoken express-rate-limit express-validator
fi

# Check if database exists and create if needed
echo -e "${BLUE}🗄️  Setting up database...${NC}"

# Create database if it doesn't exist (requires PostgreSQL to be running)
if command -v createdb &> /dev/null; then
    createdb portfolio_platform 2>/dev/null && echo -e "${GREEN}✅ Database 'portfolio_platform' created${NC}" || echo -e "${YELLOW}⚠️  Database 'portfolio_platform' already exists or couldn't be created${NC}"
fi

# Run database schema (if database is available)
if command -v psql &> /dev/null; then
    echo -e "${BLUE}📊 Setting up database schema...${NC}"
    psql -d portfolio_platform -f database-schema.sql 2>/dev/null && echo -e "${GREEN}✅ Database schema applied${NC}" || echo -e "${YELLOW}⚠️  Database schema setup failed or already exists${NC}"
fi

# Create environment file if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "${BLUE}⚙️  Creating environment configuration...${NC}"
    cat > .env << EOF
# Professional Portfolio Environment Configuration
NODE_ENV=development
PORT=3001

# Database Configuration
DATABASE_URL=postgresql://localhost:5432/portfolio_platform

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# LinkedIn OAuth (configure when ready)
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
LINKEDIN_REDIRECT_URI=http://localhost:3001/auth/linkedin/callback

# Email Configuration (for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Analytics
ANALYTICS_ENABLED=true

# Music Knot Theory
MUSIC_KNOTS_ENABLED=true
DEFAULT_TEMPO=120
DEFAULT_SCALE=major
EOF
    echo -e "${GREEN}✅ Environment file created (.env)${NC}"
    echo -e "${YELLOW}⚠️  Please update .env file with your actual configuration values${NC}"
fi

# Start the backend server
echo -e "${BLUE}🚀 Starting Portfolio Backend Server...${NC}"
echo -e "${GREEN}🎼 Features enabled:${NC}"
echo -e "   • JWT Authentication"
echo -e "   • Music Knot Theory Integration" 
echo -e "   • Client Management"
echo -e "   • Analytics Tracking"
echo -e "   • LinkedIn Integration (placeholder)"

# Check if portfolio-backend.js exists
if [ ! -f "portfolio-backend.js" ]; then
    echo -e "${RED}❌ portfolio-backend.js not found${NC}"
    exit 1
fi

# Start the server
echo -e "\n${GREEN}🎵🪢 Starting Professional Portfolio Backend...${NC}"
echo -e "${BLUE}📍 Backend will run on: http://localhost:3001${NC}"
echo -e "${BLUE}📍 Frontend available at: professional-portfolio.html${NC}"
echo -e "${BLUE}📍 Database: PostgreSQL (portfolio_platform)${NC}"
echo ""

# Show available endpoints
echo -e "${YELLOW}Available API Endpoints:${NC}"
echo -e "• GET  /health                     - Health check"
echo -e "• POST /auth/login                 - User login"
echo -e "• POST /auth/register              - User registration"
echo -e "• GET  /api/v1/portfolio           - Public portfolio"
echo -e "• GET  /api/v1/portfolio/skills    - Skills with music mappings"
echo -e "• POST /api/v1/music/generate      - Generate music from skills"
echo -e "• POST /api/v1/analytics/event     - Track portfolio interactions"
echo -e "• GET  /api/v1/clients             - Client management (admin)"
echo ""

# Start with error handling
node portfolio-backend.js || {
    echo -e "${RED}❌ Failed to start portfolio backend${NC}"
    echo -e "${YELLOW}💡 Troubleshooting tips:${NC}"
    echo -e "   1. Make sure PostgreSQL is running: brew services start postgresql"
    echo -e "   2. Check if database exists: psql -l | grep portfolio_platform"
    echo -e "   3. Install dependencies: npm install"
    echo -e "   4. Check .env configuration"
    echo -e "   5. View logs above for specific error details"
    exit 1
}