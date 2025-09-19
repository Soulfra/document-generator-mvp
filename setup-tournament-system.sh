#!/bin/bash

# TOURNAMENT AI SYSTEM SETUP
# Complete setup script for tournament-style AI processing

echo "🏆 Tournament AI System Setup"
echo "============================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DB_NAME="${DB_NAME:-economic_engine}"
DB_USER="${DB_USER:-root}"
DB_PASS="${DB_PASS:-}"
DB_HOST="${DB_HOST:-localhost}"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check MySQL connection
check_mysql() {
    echo -e "${BLUE}Checking MySQL connection...${NC}"
    if mysql -h"$DB_HOST" -u"$DB_USER" ${DB_PASS:+-p"$DB_PASS"} -e "SELECT 1" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ MySQL connection successful${NC}"
        return 0
    else
        echo -e "${RED}❌ MySQL connection failed${NC}"
        return 1
    fi
}

# Function to check if database exists
check_database() {
    echo -e "${BLUE}Checking database '$DB_NAME'...${NC}"
    if mysql -h"$DB_HOST" -u"$DB_USER" ${DB_PASS:+-p"$DB_PASS"} -e "USE $DB_NAME" 2>/dev/null; then
        echo -e "${GREEN}✅ Database exists${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  Database does not exist${NC}"
        return 1
    fi
}

# Function to create database if needed
create_database() {
    echo -e "${BLUE}Creating database '$DB_NAME'...${NC}"
    if mysql -h"$DB_HOST" -u"$DB_USER" ${DB_PASS:+-p"$DB_PASS"} -e "CREATE DATABASE IF NOT EXISTS $DB_NAME"; then
        echo -e "${GREEN}✅ Database created${NC}"
        return 0
    else
        echo -e "${RED}❌ Failed to create database${NC}"
        return 1
    fi
}

# Function to run SQL file
run_sql_file() {
    local sql_file=$1
    local description=$2
    
    echo -e "${BLUE}Running $description...${NC}"
    
    if [ ! -f "$sql_file" ]; then
        echo -e "${RED}❌ File not found: $sql_file${NC}"
        return 1
    fi
    
    if mysql -h"$DB_HOST" -u"$DB_USER" ${DB_PASS:+-p"$DB_PASS"} "$DB_NAME" < "$sql_file" 2>/dev/null; then
        echo -e "${GREEN}✅ $description completed${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  $description had warnings (may be normal)${NC}"
        return 0
    fi
}

# Function to install npm packages
install_npm_packages() {
    echo -e "${BLUE}Checking npm packages...${NC}"
    
    local packages=("mysql2" "express" "cors" "chalk" "boxen" "cli-table3")
    local missing_packages=()
    
    for package in "${packages[@]}"; do
        if ! npm list "$package" >/dev/null 2>&1; then
            missing_packages+=("$package")
        fi
    done
    
    if [ ${#missing_packages[@]} -gt 0 ]; then
        echo -e "${YELLOW}Installing missing packages: ${missing_packages[*]}${NC}"
        npm install "${missing_packages[@]}"
    else
        echo -e "${GREEN}✅ All npm packages installed${NC}"
    fi
}

# Main setup process
main() {
    echo ""
    echo "Starting setup process..."
    echo ""
    
    # Step 1: Check prerequisites
    echo "Step 1: Checking prerequisites"
    echo "------------------------------"
    
    if ! command_exists mysql; then
        echo -e "${RED}❌ MySQL client not found. Please install MySQL.${NC}"
        exit 1
    fi
    
    if ! command_exists node; then
        echo -e "${RED}❌ Node.js not found. Please install Node.js.${NC}"
        exit 1
    fi
    
    if ! command_exists npm; then
        echo -e "${RED}❌ npm not found. Please install npm.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All prerequisites found${NC}"
    echo ""
    
    # Step 2: Database setup
    echo "Step 2: Database Setup"
    echo "----------------------"
    
    if ! check_mysql; then
        echo -e "${RED}Please check your MySQL credentials and try again.${NC}"
        exit 1
    fi
    
    if ! check_database; then
        create_database
    fi
    
    # Step 3: Run SQL schemas
    echo ""
    echo "Step 3: Creating Database Tables"
    echo "--------------------------------"
    
    # Check if character tables exist first
    if ! mysql -h"$DB_HOST" -u"$DB_USER" ${DB_PASS:+-p"$DB_PASS"} "$DB_NAME" -e "SELECT 1 FROM characters LIMIT 1" 2>/dev/null; then
        echo -e "${YELLOW}⚠️  Character tables not found. Please run your main database setup first.${NC}"
        echo -e "${YELLOW}    Looking for: character-dialogue-tables.sql${NC}"
        
        if [ -f "character-dialogue-tables.sql" ]; then
            run_sql_file "character-dialogue-tables.sql" "Character dialogue tables"
        fi
    else
        echo -e "${GREEN}✅ Character tables already exist${NC}"
    fi
    
    # Run tournament tables
    if [ -f "tournament-tables.sql" ]; then
        run_sql_file "tournament-tables.sql" "Tournament system tables"
    else
        echo -e "${RED}❌ tournament-tables.sql not found${NC}"
        exit 1
    fi
    
    # Step 4: Install npm packages
    echo ""
    echo "Step 4: Installing NPM Packages"
    echo "-------------------------------"
    
    install_npm_packages
    
    # Step 5: Validate setup
    echo ""
    echo "Step 5: Validating Setup"
    echo "------------------------"
    
    if [ -f "tournament-results-validator.js" ]; then
        echo -e "${BLUE}Running validation tests...${NC}"
        node tournament-results-validator.js
    else
        echo -e "${YELLOW}⚠️  Validator not found, skipping validation${NC}"
    fi
    
    # Step 6: Create test character if needed
    echo ""
    echo "Step 6: Creating Test Data"
    echo "--------------------------"
    
    echo -e "${BLUE}Creating test character...${NC}"
    mysql -h"$DB_HOST" -u"$DB_USER" ${DB_PASS:+-p"$DB_PASS"} "$DB_NAME" <<EOF
INSERT INTO characters (character_name, genetic_hash, lineage, generation, quality_score, stats, traits)
VALUES (
    'Tournament Test Champion',
    'TOURNAMENT-TEST-HASH-001',
    'test-warrior',
    1,
    0.85,
    '{"strength": 10, "intelligence": 8, "agility": 7, "wisdom": 9}',
    '{"brave": true, "analytical": true}'
)
ON DUPLICATE KEY UPDATE
    quality_score = 0.85,
    stats = '{"strength": 10, "intelligence": 8, "agility": 7, "wisdom": 9}';
EOF
    
    echo -e "${GREEN}✅ Test character ready${NC}"
    
    # Step 7: Display next steps
    echo ""
    echo -e "${GREEN}🎉 Setup Complete!${NC}"
    echo ""
    echo "Next Steps:"
    echo "-----------"
    echo "1. Run integration test:"
    echo "   ${BLUE}node tournament-integration-test.js${NC}"
    echo ""
    echo "2. Run visual demo:"
    echo "   ${BLUE}node tournament-demo.js${NC}"
    echo ""
    echo "3. Start Claude API with tournament support:"
    echo "   ${BLUE}node tournament-claude-integration.js${NC}"
    echo ""
    echo "4. Query via API:"
    echo "   ${BLUE}curl -X POST http://localhost:42006/api/claude/tournament \\
     -H 'Content-Type: application/json' \\
     -H 'X-API-Key: your-api-key' \\
     -d '{
       \"query\": \"What is the best approach to solve complex problems?\",
       \"characterId\": 1
     }'${NC}"
    echo ""
    
    # Create a quick start script
    cat > start-tournament-system.sh << 'SCRIPT'
#!/bin/bash
echo "🏆 Starting Tournament AI System..."

# Start Claude API with tournament integration
echo "Starting enhanced Claude API..."
node tournament-claude-integration.js &
CLAUDE_PID=$!

echo "Claude API started with PID: $CLAUDE_PID"
echo ""
echo "System ready! Press Ctrl+C to stop."
echo ""
echo "Test endpoints:"
echo "- http://localhost:42006/api/claude/tournament"
echo "- http://localhost:42006/api/claude/docs"

# Wait for interrupt
trap "kill $CLAUDE_PID; exit" INT
wait
SCRIPT
    
    chmod +x start-tournament-system.sh
    echo -e "${GREEN}Created start-tournament-system.sh for easy startup${NC}"
}

# Run main setup
main