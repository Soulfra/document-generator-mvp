#!/bin/bash

# 🚀 LAUNCH REAL TRADING SYSTEM
# Starts all components with REAL data flowing between them

echo "🚀 LAUNCHING REAL TRADING SYSTEM..."
echo "📊 No more fake data - everything is LIVE!"
echo ""

# Function to check if port is in use
check_port() {
    lsof -i :$1 > /dev/null 2>&1
    return $?
}

# Kill any existing processes on our ports
echo "🧹 Cleaning up existing processes..."
for port in 3335 3336 8888 9600 9601 47003; do
    if check_port $port; then
        echo "   Killing process on port $port..."
        lsof -ti :$port | xargs kill -9 2>/dev/null || true
    fi
done

sleep 2

# Start services in order
echo ""
echo "📡 Starting Real-Time Data Oracle..."
node real-time-data-oracle.js &
ORACLE_PID=$!
sleep 3

echo "📊 Starting Real-Time Ticker Tape..."
node real-time-ticker-tape.js &
TICKER_PID=$!
sleep 2

echo "💹 Starting Crypto Data Aggregator..."
node crypto-data-aggregator.js &
CRYPTO_PID=$!
sleep 2

echo "🏪 Starting Grand Exchange with Real Data..."
node grand-exchange-real-data.js &
EXCHANGE_PID=$!
sleep 2

echo "📋 Starting Ticker Tape Logger..."
node ticker-tape-logger.js &
LOGGER_PID=$!
sleep 2

echo "🔥 Starting Real Data Feeder..."
node real-data-feeder.js &
FEEDER_PID=$!

echo ""
echo "✅ ALL SYSTEMS LAUNCHED!"
echo ""
echo "🌐 Access Points:"
echo "   📊 Ticker Tape Display: http://localhost:3335"
echo "   🏪 Grand Exchange: http://localhost:9600"
echo "   📋 Ticker Logger: http://localhost:8888"
echo "   💹 Crypto Aggregator: ws://localhost:47003"
echo ""
echo "📡 WebSocket Connections:"
echo "   Ticker Tape WS: ws://localhost:3336"
echo "   Grand Exchange WS: ws://localhost:9601"
echo ""
echo "💰 Real Data Sources:"
echo "   - CoinGecko (primary)"
echo "   - Binance Public API"
echo "   - CryptoCompare"
echo "   - Kraken Public API"
echo "   - ESPN API (sports)"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down all services..."
    kill $ORACLE_PID $TICKER_PID $CRYPTO_PID $EXCHANGE_PID $LOGGER_PID $FEEDER_PID 2>/dev/null
    echo "✅ All services stopped"
    exit 0
}

# Set trap for cleanup
trap cleanup INT TERM

# Keep script running
while true; do
    sleep 1
    
    # Check if processes are still running
    if ! kill -0 $ORACLE_PID 2>/dev/null; then
        echo "⚠️  Data Oracle crashed, restarting..."
        node real-time-data-oracle.js &
        ORACLE_PID=$!
    fi
    
    if ! kill -0 $TICKER_PID 2>/dev/null; then
        echo "⚠️  Ticker Tape crashed, restarting..."
        node real-time-ticker-tape.js &
        TICKER_PID=$!
    fi
    
    if ! kill -0 $EXCHANGE_PID 2>/dev/null; then
        echo "⚠️  Grand Exchange crashed, restarting..."
        node grand-exchange-real-data.js &
        EXCHANGE_PID=$!
    fi
done