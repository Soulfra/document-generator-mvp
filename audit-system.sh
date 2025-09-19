#!/bin/bash

# SYSTEM AUDIT SCRIPT
# Comprehensive inventory of the AI Operating System
# No more winging it - document everything systematically

echo "🔍 SYSTEM AUDIT STARTING..."
echo "=========================================="
echo ""

# Create audit directory
mkdir -p audit-results
cd audit-results

echo "📋 Phase 1: Service Discovery"
echo "------------------------------"

# Find all running services
echo "🔍 Active Services:"
lsof -i -P -n | grep LISTEN > active-services.txt
cat active-services.txt
echo ""

# Find all JavaScript services
echo "🔍 JavaScript Services:"
find .. -name "*.js" -path "*/services/*" -o -name "*server*.js" -o -name "*service*.js" | head -20 > js-services.txt
cat js-services.txt
echo ""

# Find all main entry points
echo "🔍 Main Entry Points:"
find .. -name "package.json" -exec grep -l "\"main\":" {} \; | head -10 > main-entries.txt
find .. -name "*.js" -exec grep -l "app.listen\|server.listen" {} \; | head -10 >> main-entries.txt
cat main-entries.txt
echo ""

echo "📋 Phase 2: Database Discovery"
echo "-------------------------------"

# Find all databases
echo "🔍 Database Files:"
find .. -name "*.db" -o -name "*.sqlite" -o -name "*.sqlite3" > database-files.txt
cat database-files.txt
echo ""

# Find database schemas
echo "🔍 Database Schemas:"
find .. -name "*.sql" -o -name "*schema*" -o -name "*migration*" > database-schemas.txt
cat database-schemas.txt
echo ""

# Find database connections
echo "🔍 Database Connection Code:"
grep -r "new Database\|sqlite3\|better-sqlite3\|pg\|mysql" .. --include="*.js" | head -10 > db-connections.txt
cat db-connections.txt
echo ""

echo "📋 Phase 3: Authentication Systems"
echo "-----------------------------------"

# Find auth systems
echo "🔍 Auth Systems:"
find .. -name "*auth*" -type f > auth-files.txt
grep -r "login\|session\|jwt\|token" .. --include="*.js" | head -10 > auth-code.txt
cat auth-files.txt
echo ""

echo "📋 Phase 4: Character/Agent Systems"
echo "------------------------------------"

# Find character profiles
echo "🔍 Character Systems:"
find .. -name "*character*" -o -name "*agent*" -o -name "*cal*" -o -name "*soulfra*" | head -15 > character-files.txt
cat character-files.txt
echo ""

# Find toolsets/weapons
echo "🔍 Toolsets/Weapons:"
grep -r "toolset\|weapon\|tool" .. --include="*.js" | head -10 > toolsets.txt
cat toolsets.txt
echo ""

echo "📋 Phase 5: Frontend/Dashboard Systems"
echo "---------------------------------------"

# Find HTML interfaces
echo "🔍 HTML Dashboards:"
find .. -name "*.html" | grep -E "dashboard|interface|control|panel|game" | head -10 > dashboards.txt
cat dashboards.txt
echo ""

# Find gaming layer
echo "🔍 Gaming Layer:"
find .. -name "*game*" -o -name "*gaming*" -o -name "*3d*" -o -name "*runelite*" | head -10 > gaming-files.txt
cat gaming-files.txt
echo ""

echo "📋 Phase 6: Integration Points"
echo "-------------------------------"

# Find API endpoints
echo "🔍 API Endpoints:"
grep -r "app\\.get\|app\\.post\|app\\.put\|app\\.delete" .. --include="*.js" | head -15 > api-endpoints.txt
cat api-endpoints.txt
echo ""

# Find port configurations
echo "🔍 Port Configurations:"
grep -r "PORT\|listen.*[0-9]" .. --include="*.js" | head -10 > port-configs.txt
cat port-configs.txt
echo ""

echo "📋 Phase 7: Configuration Files"
echo "--------------------------------"

# Find config files
echo "🔍 Configuration Files:"
find .. -name ".env*" -o -name "config*" -o -name "docker-compose*" > config-files.txt
cat config-files.txt
echo ""

# Find package.json files with scripts
echo "🔍 NPM Scripts:"
find .. -name "package.json" -exec grep -l "scripts" {} \; | head -5 > npm-scripts.txt
cat npm-scripts.txt
echo ""

echo "📋 Phase 8: Chrome Extension/Mobile"
echo "------------------------------------"

# Find chrome extension
echo "🔍 Chrome Extension:"
find .. -name "manifest.json" -o -name "*extension*" -o -name "*chrome*" | head -5 > chrome-extension.txt
cat chrome-extension.txt
echo ""

# Find mobile/PWA
echo "🔍 Mobile/PWA:"
find .. -name "*mobile*" -o -name "*pwa*" -o -name "*electron*" | head -10 > mobile-pwa.txt
cat mobile-pwa.txt
echo ""

echo "📋 Phase 9: Documentation Existing"
echo "-----------------------------------"

# Find existing documentation
echo "🔍 Existing Documentation:"
find .. -name "*.md" | grep -E -v "node_modules|\.git" | head -15 > existing-docs.txt
cat existing-docs.txt
echo ""

echo "📋 Phase 10: System Summary"
echo "----------------------------"

# Count everything
echo "🔍 System Scale:"
echo "JavaScript files: $(find .. -name "*.js" | wc -l)"
echo "HTML files: $(find .. -name "*.html" | wc -l)"
echo "Database files: $(cat database-files.txt | wc -l)"
echo "Config files: $(cat config-files.txt | wc -l)"
echo "Active services: $(cat active-services.txt | wc -l)"
echo ""

echo "✅ AUDIT COMPLETE"
echo "=================="
echo "📁 Results saved in: audit-results/"
echo "📋 Next: Review results and create architecture map"
echo ""

# Create summary report
cat > AUDIT_SUMMARY.md << 'EOF'
# AI Operating System - Audit Summary

## System Scale
- JavaScript Services: Found in js-services.txt
- Active Services: Found in active-services.txt  
- Databases: Found in database-files.txt
- Authentication: Found in auth-files.txt
- Characters/Agents: Found in character-files.txt
- Dashboards: Found in dashboards.txt
- Gaming Layer: Found in gaming-files.txt
- API Endpoints: Found in api-endpoints.txt
- Configuration: Found in config-files.txt

## Integration Analysis
- Port Configurations: Found in port-configs.txt
- Database Connections: Found in db-connections.txt
- Auth Systems: Found in auth-code.txt
- Toolsets: Found in toolsets.txt

## Next Steps
1. Review all discovered components
2. Map intended vs actual connections
3. Identify broken integration points
4. Build system bus to connect everything
EOF

echo "📄 Summary report created: AUDIT_SUMMARY.md"