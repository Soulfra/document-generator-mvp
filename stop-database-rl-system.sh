#!/bin/bash

# STOP DATABASE-ENABLED REINFORCEMENT LEARNING SYSTEM

echo "🛑 Stopping Database-Enabled Reinforcement Learning System..."
echo "================================================="

# Stop processes using saved PIDs
if [ -f .carrot_db_pid ]; then
    CARROT_PID=$(cat .carrot_db_pid)
    if ps -p $CARROT_PID > /dev/null 2>&1; then
        echo "🥕 Stopping Carrot System (PID: $CARROT_PID)..."
        kill $CARROT_PID
        rm .carrot_db_pid
    else
        echo "⚠️  Carrot System not running"
        rm .carrot_db_pid
    fi
else
    echo "⚠️  No Carrot System PID file found"
fi

if [ -f .chain_db_pid ]; then
    CHAIN_PID=$(cat .chain_db_pid)
    if ps -p $CHAIN_PID > /dev/null 2>&1; then
        echo "🔗 Stopping Learning Chain (PID: $CHAIN_PID)..."
        kill $CHAIN_PID
        rm .chain_db_pid
    else
        echo "⚠️  Learning Chain not running"
        rm .chain_db_pid
    fi
else
    echo "⚠️  No Learning Chain PID file found"
fi

if [ -f .verifier_pid ]; then
    VERIFIER_PID=$(cat .verifier_pid)
    if ps -p $VERIFIER_PID > /dev/null 2>&1; then
        echo "🔍 Stopping Database Verifier (PID: $VERIFIER_PID)..."
        kill $VERIFIER_PID
        rm .verifier_pid
    else
        echo "⚠️  Database Verifier not running"
        rm .verifier_pid
    fi
else
    echo "⚠️  No Database Verifier PID file found"
fi

# Also kill by name as backup
echo ""
echo "🔄 Ensuring all RL processes are stopped..."
pkill -f "carrot-reinforcement-learning" || true
pkill -f "learning-chain-coordinator" || true
pkill -f "rl-database-verifier" || true

sleep 2

# Verify all stopped
echo ""
echo "🔍 Verifying all systems are stopped..."

if ! curl -s http://localhost:9900/health > /dev/null 2>&1; then
    echo "✅ Carrot System: STOPPED"
else
    echo "⚠️  Carrot System: Still running on port 9900"
fi

if ! curl -s http://localhost:9800/health > /dev/null 2>&1; then
    echo "✅ Learning Chain: STOPPED"
else
    echo "⚠️  Learning Chain: Still running on port 9800"
fi

if ! curl -s http://localhost:9901/ > /dev/null 2>&1; then
    echo "✅ Database Verifier: STOPPED"
else
    echo "⚠️  Database Verifier: Still running on port 9901"
fi

echo ""
echo "✅ Database-Enabled RL System stopped"
echo ""
echo "💡 Note: All learning data is preserved in PostgreSQL"
echo "   To view stored data:"
echo "   psql -U postgres -d document_generator"
echo "   \\dt rl_*  -- List all RL tables"
echo "   SELECT COUNT(*) FROM rl_metrics;  -- Check metrics"
echo ""
echo "🚀 To restart: ./start-database-rl-system.sh"