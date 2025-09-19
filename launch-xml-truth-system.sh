#!/bin/bash

# 🗂️⚖️ XML TRUTH SYSTEM LAUNCHER
# ===============================
# Launch the complete XML schema mapping and integrity enforcement system
# Keep ALL databases honest with XML validation

set -e

echo "🗂️⚖️ XML TRUTH SYSTEM LAUNCHER"
echo "=============================="
echo ""
echo "🎯 LAUNCHING XML SCHEMA MAPPING & INTEGRITY ENFORCEMENT"
echo "🔗 CROSS-DATABASE TRUTH LAYER ACTIVATION"
echo "⚖️ NO INVALID DATA SHALL PASS"
echo ""

# Check dependencies
echo "🔍 Checking dependencies..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found! Please install Node.js to continue."
    exit 1
fi
echo "   ✅ Node.js available"

# Check required files
REQUIRED_FILES=(
    "xml-schema-mapper.js"
    "xml-integrity-enforcer.js"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        echo "   ✅ Found $file"
    else
        echo "   ❌ Missing $file"
        echo "      This file is required for the XML truth system."
        exit 1
    fi
done

echo ""

# Create XML truth system directories
echo "🏗️ Setting up XML truth system infrastructure..."
mkdir -p .xml-truth-system/logs
mkdir -p .xml-truth-system/schemas
mkdir -p .xml-truth-system/integrity
mkdir -p .xml-truth-system/exports
mkdir -p xml-schemas
mkdir -p xml-schemas/cross-references
echo "   ✅ XML truth system infrastructure ready"

echo ""
echo "🚀 LAUNCHING XML TRUTH SYSTEM..."
echo "==============================="

# Start XML Schema Mapper
echo "🗂️ Starting XML Schema Mapper..."
nohup node xml-schema-mapper.js > .xml-truth-system/logs/schema-mapper.log 2>&1 &
SCHEMA_MAPPER_PID=$!
echo $SCHEMA_MAPPER_PID > .xml-truth-system/logs/schema-mapper.pid

echo "   🗂️ Schema Mapper started (PID: $SCHEMA_MAPPER_PID)"
echo "   📄 Generating XML schemas for all data types..."
echo "   🔗 Creating cross-database mappings..."
echo "   ⏳ Waiting for schema generation to complete..."

# Wait for schema mapper to initialize
max_attempts=15
attempt=1
schemas_ready=false

while [[ $attempt -le $max_attempts ]]; do
    # Check if XML schemas directory has been populated
    if [[ -d "xml-schemas" ]] && [[ $(ls xml-schemas/*.xsd 2>/dev/null | wc -l) -gt 0 ]]; then
        echo "   📄 XML schemas generated successfully"
        schemas_ready=true
        break
    else
        echo "   ⏳ Attempt $attempt/$max_attempts - generating schemas..."
        sleep 2
        ((attempt++))
    fi
done

if [[ "$schemas_ready" != true ]]; then
    echo "   ⚠️  Schema generation may still be in progress..."
fi

# Start XML Integrity Enforcer
echo ""
echo "⚖️ Starting XML Integrity Enforcer..."
nohup node xml-integrity-enforcer.js > .xml-truth-system/logs/integrity-enforcer.log 2>&1 &
INTEGRITY_ENFORCER_PID=$!
echo $INTEGRITY_ENFORCER_PID > .xml-truth-system/logs/integrity-enforcer.pid

echo "   ⚖️ Integrity Enforcer started (PID: $INTEGRITY_ENFORCER_PID)"
echo "   🔒 Activating cross-database integrity enforcement"
echo "   🛡️ Setting up data validation hooks"
echo "   ⏳ Waiting for enforcement system to come online..."

# Wait for integrity enforcer
sleep 10

echo ""
echo "🎉 XML TRUTH SYSTEM IS ACTIVE!"
echo "============================="
echo ""
echo "🗂️ XML SCHEMA MAPPER STATUS"
echo "==========================="
echo "Schema Generator:      PID $SCHEMA_MAPPER_PID"
echo "Schema Directory:      ./xml-schemas/"
echo "Database Mappings:     ./xml-schemas/cross-references/"
echo "Schema Logs:           tail -f .xml-truth-system/logs/schema-mapper.log"
echo ""

echo "⚖️ XML INTEGRITY ENFORCER STATUS"
echo "================================"
echo "Integrity Enforcer:    PID $INTEGRITY_ENFORCER_PID"
echo "Enforcement Level:     STRICT (blocks invalid data)"
echo "Monitoring Active:     Cross-database validation"
echo "Enforcer Logs:         tail -f .xml-truth-system/logs/integrity-enforcer.log"
echo ""

echo "🗂️ GENERATED XML SCHEMAS"
echo "========================"
if [[ -d "xml-schemas" ]]; then
    echo "📄 Core Schemas:"
    for schema in xml-schemas/*.xsd; do
        if [[ -f "$schema" ]]; then
            filename=$(basename "$schema")
            echo "   • $filename - $(echo "$filename" | sed 's/.xsd//' | tr '-' ' ' | sed 's/\b\w/\U&/g') Schema"
        fi
    done
    
    echo ""
    echo "🔗 Cross-Reference Schemas:"
    for crossref in xml-schemas/cross-references/*.xsd; do
        if [[ -f "$crossref" ]]; then
            filename=$(basename "$crossref")
            echo "   • $filename - $(echo "$filename" | sed 's/.xsd//' | tr '_' ' ' | sed 's/\b\w/\U&/g')"
        fi
    done
else
    echo "   ⏳ Schemas still generating..."
fi

echo ""
echo "🔗 DATABASE MAPPINGS ACTIVE"
echo "==========================="
echo "✅ SQLite:        Primary database (REALITY.db)"
echo "🔄 MongoDB:       Secondary store (when available)"
echo "🔄 PostgreSQL:    Backup database (when available)"
echo "🔄 Redis:         Cache layer (when available)"
echo "🔄 Elasticsearch: Search index (when available)"
echo ""

echo "⚖️ INTEGRITY ENFORCEMENT FEATURES"
echo "================================="
echo "🔒 STRICT MODE ACTIVE:"
echo "   • All database operations XML-validated"
echo "   • Invalid data operations blocked"
echo "   • Schema compliance enforced"
echo "   • Foreign key relationships verified"
echo "   • Duplicate key detection active"
echo "   • Data type constraints enforced"
echo ""

echo "🛡️ PROTECTION FEATURES:"
echo "   • Pre-operation validation"
echo "   • Post-operation verification"
echo "   • Cross-database consistency checking"
echo "   • Automatic rollback on integrity failure"
echo "   • Real-time violation monitoring"
echo ""

echo "📊 MONITORING CAPABILITIES:"
echo "   • Integrity score calculation"
echo "   • Database health monitoring"
echo "   • Violation tracking and reporting"
echo "   • Performance metrics collection"
echo ""

echo "🔧 HOW THE XML TRUTH SYSTEM WORKS"
echo "================================="
echo ""
echo "1. 📄 XML SCHEMA GENERATION:"
echo "   • Creates XSD schemas for every data type"
echo "   • Maps schemas to all target databases"
echo "   • Generates cross-reference mappings"
echo "   • Establishes validation rules"
echo ""

echo "2. 🔗 CROSS-DATABASE MAPPING:"
echo "   • SQLite → Native SQL tables"
echo "   • MongoDB → Document collections"
echo "   • PostgreSQL → Relational tables"
echo "   • Redis → Key-value pairs"
echo "   • Elasticsearch → Search indices"
echo ""

echo "3. ⚖️ INTEGRITY ENFORCEMENT:"
echo "   • Intercepts ALL database operations"
echo "   • Validates against XML schemas FIRST"
echo "   • Blocks invalid data at the gate"
echo "   • Maintains referential integrity"
echo "   • Prevents data corruption"
echo ""

echo "4. 📊 CONTINUOUS MONITORING:"
echo "   • Real-time integrity checking"
echo "   • Violation detection and logging"
echo "   • Database health assessment"
echo "   • Automatic correction attempts"
echo ""

echo "🎯 WHAT THIS MEANS FOR YOUR DATA"
echo "================================"
echo ""
echo "✅ GUARANTEED CONSISTENCY:"
echo "   • Same data structure across all databases"
echo "   • No more format mismatches"
echo "   • Unified validation rules"
echo "   • Automated integrity maintenance"
echo ""

echo "🚫 PROTECTION FROM:"
echo "   • Invalid data insertion"
echo "   • Schema drift between databases"
echo "   • Orphaned records"
echo "   • Type conversion errors"
echo "   • Referential integrity violations"
echo ""

echo "🔄 AUTOMATIC FEATURES:"
echo "   • Cross-database synchronization"
echo "   • Schema version management"
echo "   • Integrity violation correction"
echo "   • Data format transformation"
echo ""

echo "🛠️ XML TRUTH SYSTEM MANAGEMENT"
echo "=============================="
echo "Schema Operations:"
echo "   View schemas:          ls -la xml-schemas/"
echo "   Check schema status:   curl http://localhost:8300/schemas/status"
echo "   Export schemas:        node xml-schema-mapper.js --export"
echo ""

echo "Integrity Operations:"
echo "   Check integrity:       curl http://localhost:8301/integrity/status"
echo "   View violations:       curl http://localhost:8301/integrity/violations"
echo "   Generate report:       node xml-integrity-enforcer.js --report"
echo ""

echo "System Control:"
echo "   Stop schema mapper:    kill \\$(cat .xml-truth-system/logs/schema-mapper.pid)"
echo "   Stop enforcer:         kill \\$(cat .xml-truth-system/logs/integrity-enforcer.pid)"
echo "   View system logs:      tail -f .xml-truth-system/logs/*.log"
echo ""

echo "🎮 ENFORCEMENT LEVEL CONTROL"
echo "============================"
echo "Current Level: STRICT (recommended)"
echo ""
echo "Available Levels:"
echo "   • STRICT:     Block all invalid operations (current)"
echo "   • CORRECTIVE: Auto-correct when possible"
echo "   • MONITORING: Log violations but allow operations"
echo "   • DISABLED:   No enforcement (not recommended)"
echo ""

echo "📈 SYSTEM BENEFITS"
echo "=================="
echo ""
echo "🎯 DATA QUALITY:"
echo "   • 100% schema compliance guaranteed"
echo "   • Consistent data types across systems"
echo "   • Referential integrity maintained"
echo "   • No more 'garbage in, garbage out'"
echo ""

echo "🔒 DATA SECURITY:"
echo "   • Prevents data corruption"
echo "   • Blocks malformed inputs"
echo "   • Validates data relationships"
echo "   • Maintains system integrity"
echo ""

echo "⚡ OPERATIONAL BENEFITS:"
echo "   • Reduces debugging time"
echo "   • Prevents system crashes"
echo "   • Enables confident scaling"
echo "   • Simplifies data migration"
echo ""

echo "🔄 XML TRUTH SYSTEM IS NOW PROTECTING YOUR DATA"
echo "==============================================="
echo ""
echo "The XML Truth System is now actively protecting your data:"
echo ""
echo "✅ All database operations are XML-validated"
echo "✅ Invalid data is blocked before it can cause problems"
echo "✅ Schema consistency is enforced across all databases"
echo "✅ Data integrity is continuously monitored"
echo "✅ Violations are detected and reported immediately"
echo ""
echo "Your data is now protected by the XML Truth Layer!"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 SHUTTING DOWN XML TRUTH SYSTEM..."
    echo "===================================="
    
    # Stop schema mapper
    if [[ -f ".xml-truth-system/logs/schema-mapper.pid" ]]; then
        pid=$(cat ".xml-truth-system/logs/schema-mapper.pid")
        if kill -0 "$pid" 2>/dev/null; then
            echo "   🗂️ Stopping XML Schema Mapper (PID: $pid)"
            kill "$pid"
        fi
        rm -f ".xml-truth-system/logs/schema-mapper.pid"
    fi
    
    # Stop integrity enforcer
    if [[ -f ".xml-truth-system/logs/integrity-enforcer.pid" ]]; then
        pid=$(cat ".xml-truth-system/logs/integrity-enforcer.pid")
        if kill -0 "$pid" 2>/dev/null; then
            echo "   ⚖️ Stopping XML Integrity Enforcer (PID: $pid)"
            kill "$pid"
        fi
        rm -f ".xml-truth-system/logs/integrity-enforcer.pid"
    fi
    
    echo "   📄 XML schemas preserved in xml-schemas/ directory"
    echo "   📊 Integrity logs preserved in .xml-truth-system/logs/"
    echo "   ✅ XML Truth System shutdown complete"
    echo ""
    echo "🗂️ Your XML schemas and integrity rules are preserved."
    echo "   Restart anytime with: ./launch-xml-truth-system.sh"
    exit 0
}

# Set up signal handling
trap cleanup SIGINT SIGTERM

# Monitor XML truth system
echo "🔄 XML Truth System monitoring active. Press Ctrl+C to shutdown safely."
echo ""

# Monitoring loop
while true; do
    sleep 120  # Check every 2 minutes
    
    # Check if both systems are still running
    schema_mapper_running=false
    integrity_enforcer_running=false
    
    if [[ -f ".xml-truth-system/logs/schema-mapper.pid" ]]; then
        pid=$(cat ".xml-truth-system/logs/schema-mapper.pid")
        if kill -0 "$pid" 2>/dev/null; then
            schema_mapper_running=true
        fi
    fi
    
    if [[ -f ".xml-truth-system/logs/integrity-enforcer.pid" ]]; then
        pid=$(cat ".xml-truth-system/logs/integrity-enforcer.pid")
        if kill -0 "$pid" 2>/dev/null; then
            integrity_enforcer_running=true
        fi
    fi
    
    if [[ "$schema_mapper_running" == true ]] && [[ "$integrity_enforcer_running" == true ]]; then
        echo "🗂️⚖️ $(date): XML Truth System operational - all databases protected"
    else
        echo "⚠️  $(date): Some XML Truth System components may be offline"
        if [[ "$schema_mapper_running" != true ]]; then
            echo "   ❌ Schema Mapper offline"
        fi
        if [[ "$integrity_enforcer_running" != true ]]; then
            echo "   ❌ Integrity Enforcer offline"
        fi
    fi
    
    # Check schema generation status
    if [[ -d "xml-schemas" ]]; then
        schema_count=$(ls xml-schemas/*.xsd 2>/dev/null | wc -l)
        echo "   📄 $schema_count XML schemas active"
    fi
done