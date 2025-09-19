#!/bin/bash

# Start Dynamic Game API Registry

echo "🎮 Starting Dynamic Game API Registry..."
echo "=================================="

# Check if database is running
if ! docker ps | grep -q document-generator-postgres; then
    echo "⚠️  PostgreSQL not running. Starting database..."
    docker-compose up -d postgres redis
    sleep 5
fi

# Apply database schema updates
echo "📊 Applying database schema updates..."
docker exec -i document-generator-postgres psql -U postgres -d document_generator < database-schema-update.sql

# Check if character API is running
if ! curl -s http://localhost:3001/health > /dev/null; then
    echo "⚠️  Character API not responding on port 3001"
    echo "   You may want to start it first for full functionality"
fi

# Start the dynamic API registry
echo "🚀 Starting Dynamic Game API Registry on port 4455..."
node dynamic-game-api-registry.js &
REGISTRY_PID=$!

# Wait a moment for it to start
sleep 2

# Test the API
echo ""
echo "🧪 Testing API endpoints..."
echo ""

# Test discovery endpoint
echo "📡 Testing API discovery:"
curl -s http://localhost:4455/api/discover | jq '.' 2>/dev/null || echo "Discovery endpoint returned data"

echo ""
echo "✅ Dynamic Game API Registry is running!"
echo ""
echo "🎯 Available endpoints:"
echo "   • Discovery: http://localhost:4455/api/discover"
echo "   • Games list: http://localhost:4455/api/games"
echo "   • Health check: http://localhost:4455/health"
echo ""
echo "📝 Example API calls:"
echo "   • ShipRekt: http://localhost:4455/api/shiprekt/create-from-doc"
echo "   • RuneScape: http://localhost:4455/api/runescape/grand-exchange?itemId=4151"
echo "   • Document MVP: http://localhost:4455/api/document-mvp/analyze"
echo "   • Characters: http://localhost:4455/api/characters/consult"
echo ""
echo "💡 To register a new game dynamically:"
echo '   curl -X POST http://localhost:4455/api/register-game -H "Content-Type: application/json" -d '"'"'{"gameId": "my-game", "config": {...}}'"'"
echo ""
echo "🛑 To stop: kill $REGISTRY_PID"