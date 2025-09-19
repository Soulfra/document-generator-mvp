#!/bin/bash
echo "🔥 Starting Document Generator - Development Mode"
echo "================================================"

# Ensure symlinks are set up
./setup-template-symlinks.sh

# Start Flask backend
echo "🚀 Starting Flask backend..."
cd flask-backend
python3 app.py &
FLASK_PID=$!
cd ..

# Start OSS services
echo "🤖 Starting OSS agent services..."
node universal-data-aggregator.js &
node crypto-data-aggregator.js &
node differential-game-extractor.js &

# Start Electron interface
echo "🖥️ Starting Electron interface..."
npm run electron-simple &

echo ""
echo "✅ Development environment started"
echo "🔗 Flask API: http://localhost:5000"
echo "🖥️ Electron: Running with working interface"
echo "📊 WebSocket services: 47003, 47004, 48000"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap 'kill $FLASK_PID; pkill -f "node.*aggregator"; pkill -f electron; echo "🛑 All services stopped"' INT
wait
