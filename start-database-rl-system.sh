#!/bin/bash

# START DATABASE-ENABLED REINFORCEMENT LEARNING SYSTEM
# This script launches the complete daisychain learning system with database persistence

echo "🚀 Starting Database-Enabled Reinforcement Learning System..."
echo "================================================="

# Check if PostgreSQL is running
echo "🔍 Checking PostgreSQL..."
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "❌ PostgreSQL is not running!"
    echo "Please start PostgreSQL first:"
    echo "  macOS: brew services start postgresql"
    echo "  Linux: sudo systemctl start postgresql"
    exit 1
fi
echo "✅ PostgreSQL is running"

# Check if database exists
echo "🔍 Checking database..."
if ! psql -U postgres -lqt | cut -d \| -f 1 | grep -qw document_generator; then
    echo "❌ Database 'document_generator' does not exist!"
    echo "Please create it: createdb -U postgres document_generator"
    exit 1
fi
echo "✅ Database exists"

# Initialize RL tables if needed
echo "🗄️ Initializing RL database tables..."
node init-rl-database.js
if [ $? -ne 0 ]; then
    echo "⚠️  Database initialization had issues, but continuing..."
fi

# Kill any existing RL processes
echo "🔄 Stopping any existing RL processes..."
pkill -f "carrot-reinforcement-learning" || true
pkill -f "learning-chain-coordinator" || true
pkill -f "rl-database-verifier" || true
sleep 2

# Start the database-enabled systems
echo ""
echo "🥕 Starting Carrot Reinforcement Learning System (DB)..."
node carrot-reinforcement-learning-db.js > logs/carrot-db-$(date +%Y%m%d-%H%M%S).log 2>&1 &
CARROT_PID=$!
echo "   Started with PID: $CARROT_PID"
echo "   Dashboard: http://localhost:9900/dashboard"
sleep 3

echo ""
echo "🔗 Starting Learning Chain Coordinator (DB)..."
node learning-chain-coordinator-db.js > logs/learning-chain-db-$(date +%Y%m%d-%H%M%S).log 2>&1 &
CHAIN_PID=$!
echo "   Started with PID: $CHAIN_PID"
echo "   Dashboard: http://localhost:9800/dashboard"
sleep 3

echo ""
echo "🔍 Starting Database Verifier..."
node rl-database-verifier.js > logs/verifier-$(date +%Y%m%d-%H%M%S).log 2>&1 &
VERIFIER_PID=$!
echo "   Started with PID: $VERIFIER_PID"
echo "   Dashboard: http://localhost:9901/dashboard"
sleep 2

# Save PIDs for shutdown
echo $CARROT_PID > .carrot_db_pid
echo $CHAIN_PID > .chain_db_pid
echo $VERIFIER_PID > .verifier_pid

# Verify systems are running
echo ""
echo "🔍 Verifying all systems are running..."
sleep 3

FAILURES=0

# Check Carrot System
if curl -s http://localhost:9900/health > /dev/null; then
    echo "✅ Carrot System: RUNNING"
else
    echo "❌ Carrot System: FAILED TO START"
    FAILURES=$((FAILURES + 1))
fi

# Check Learning Chain
if curl -s http://localhost:9800/health > /dev/null; then
    echo "✅ Learning Chain: RUNNING"
else
    echo "❌ Learning Chain: FAILED TO START"
    FAILURES=$((FAILURES + 1))
fi

# Check Verifier
if curl -s http://localhost:9901/ > /dev/null; then
    echo "✅ Database Verifier: RUNNING"
else
    echo "❌ Database Verifier: FAILED TO START"
    FAILURES=$((FAILURES + 1))
fi

if [ $FAILURES -eq 0 ]; then
    echo ""
    echo "🎉 All systems started successfully!"
    echo ""
    echo "📊 Access Points:"
    echo "   • Carrot Dashboard: http://localhost:9900/dashboard"
    echo "   • Learning Chain: http://localhost:9800/dashboard"
    echo "   • Database Verifier: http://localhost:9901/dashboard"
    echo ""
    echo "🔍 Verification Endpoints:"
    echo "   • Verify Carrot System: http://localhost:9900/api/verify"
    echo "   • Verify Learning Chain: http://localhost:9800/api/verify"
    echo "   • Full Verification: http://localhost:9901/"
    echo ""
    echo "📈 View logs:"
    echo "   • Carrot: tail -f logs/carrot-db-*.log"
    echo "   • Chain: tail -f logs/learning-chain-db-*.log"
    echo "   • Verifier: tail -f logs/verifier-*.log"
    echo ""
    echo "🛑 To stop all systems: ./stop-database-rl-system.sh"
    echo ""
    echo "💡 The systems are now:"
    echo "   • Monitoring performance"
    echo "   • Distributing carrots for good behavior"
    echo "   • Learning patterns"
    echo "   • Building correlations"
    echo "   • Storing everything in PostgreSQL"
    echo ""
    echo "✅ DATABASE-ENABLED REINFORCEMENT LEARNING IS ACTIVE!"
else
    echo ""
    echo "❌ Some systems failed to start. Check the logs for errors."
    echo "   Logs are in the ./logs directory"
    exit 1
fi