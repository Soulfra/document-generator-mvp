#!/bin/bash

# 🚀 START EVERYTHING - One Command to Rule Them All
# 
# This script launches the complete Document Generator platform:
# - Docker infrastructure (databases, AI, services)
# - Gaming interfaces with visual ships
# - Voice chat and collaboration systems
# - Document processing with AI orchestration
# - Real-time MVP generation dashboard

set -e

echo "🚀 DOCUMENT GENERATOR PLATFORM - MASTER LAUNCHER"
echo "================================================="
echo "🎯 Mission: Transform documents into working MVPs with AI + Gaming UI"
echo "🎮 Features: 3D ships, multiplayer chat, voice collaboration, real-time generation"
echo ""

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: docker-compose.yml not found"
    echo "Please run this script from the Document-Generator directory"
    exit 1
fi

# Check if Docker is running
echo "🐳 Checking Docker..."
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

echo "✅ Docker is running"

# Check if Node.js is installed
echo "🟢 Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js and try again."
    exit 1
fi

echo "✅ Node.js is available: $(node --version)"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
fi

# Make sure the launcher script is executable
chmod +x MASTER-UNIFIED-LAUNCHER.js

echo ""
echo "🚀 LAUNCHING COMPLETE PLATFORM..."
echo "================================="

# Option 1: Use the unified launcher (recommended)
echo "Starting unified master launcher..."
node MASTER-UNIFIED-LAUNCHER.js &
LAUNCHER_PID=$!

echo ""
echo "✅ PLATFORM LAUNCHED SUCCESSFULLY!"
echo ""
echo "🎯 PRIMARY ACCESS POINTS:"
echo "========================"
echo "🎛️  Master Dashboard: http://localhost:9999"
echo "📄 Document Generator: http://localhost:8889"
echo "🎮 Gaming Economy: http://localhost:9706 (Visual Ships)"
echo "📊 Charting Engine: http://localhost:9705 (Real-time Charts)"
echo "🗣️  Voice Chat: http://localhost:9707 (Multiplayer Voice)"
echo "🤝 Collaboration: http://localhost:9708 (Team Workspace)"
echo ""
echo "🏢 CORE PLATFORM SERVICES:"
echo "=========================="
echo "🔧 Template Processor: http://localhost:3000"
echo "🤖 AI API Service: http://localhost:3001"
echo "📈 Analytics: http://localhost:3002"
echo "🏛️  Platform Hub: http://localhost:8080"
echo "🤖 Ollama AI: http://localhost:11434"
echo ""
echo "🎮 GAMING INTERFACES:"
echo "===================="
echo "🌐 3D API World: http://localhost:9000/api-world"
echo "🤖 AI Game World: http://localhost:9000/ai-world"
echo "🌫️  Fog of War Explorer: http://localhost:9000/fog-war"
echo "🌌 Gaming Universe: http://localhost:9000/universe"
echo ""
echo "💡 QUICK START GUIDE:"
echo "==================="
echo "1. Open Master Dashboard: http://localhost:9999"
echo "2. Upload your business documents (PDF, Word, etc.)"
echo "3. Watch AI analyze and generate MVP components"
echo "4. Join voice chat for team collaboration"
echo "5. View visual ships and real-time progress"
echo "6. Deploy generated MVPs with one click"
echo ""
echo "🎮 GAMING FEATURES:"
echo "=================="
echo "• Visual ships representing AI agents"
echo "• Real-time multiplayer collaboration"
echo "• Voice chat with spatial audio"
echo "• 3D visualization of document processing"
echo "• Gaming economy with tokens and rewards"
echo ""
echo "🤖 AI CAPABILITIES:"
echo "=================="
echo "• Local AI with Ollama (free, private)"
echo "• Fallback to cloud AI (OpenAI, Anthropic)"
echo "• Document analysis and MVP generation"
echo "• Code generation with multiple frameworks"
echo "• Real-time collaboration assistance"
echo ""

# Function to open all interfaces (macOS)
open_interfaces() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "🖥️  Opening key interfaces..."
        sleep 5  # Wait for services to start
        
        # Open master dashboard first
        open "http://localhost:9999" 2>/dev/null || true
        sleep 2
        
        # Open document generator
        open "http://localhost:8889" 2>/dev/null || true
        sleep 2
        
        # Open 3D game world
        open "http://localhost:9000/api-world" 2>/dev/null || true
        sleep 2
        
        echo "✅ Interfaces opened in your default browser"
    else
        echo "💡 Manual step: Open http://localhost:9999 in your browser"
    fi
}

# Ask if user wants to open interfaces automatically
echo ""
read -p "🖥️  Would you like to automatically open the interfaces in your browser? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    open_interfaces &
fi

echo ""
echo "⚡ PLATFORM IS NOW RUNNING!"
echo "=========================="
echo "📊 Monitor logs and system status in the terminal"
echo "🔗 Access all features through the Master Dashboard"
echo "💬 Join voice chat to collaborate with your team"
echo "🎮 Enjoy the visual gaming interfaces!"
echo ""
echo "🛑 TO STOP THE PLATFORM:"
echo "========================"
echo "Press Ctrl+C to stop all services gracefully"
echo "Or run: docker-compose down"
echo ""

# Function to handle cleanup
cleanup() {
    echo ""
    echo "🛑 Shutting down platform..."
    
    # Kill the launcher process
    if [ ! -z "$LAUNCHER_PID" ]; then
        kill $LAUNCHER_PID 2>/dev/null || true
    fi
    
    # Stop Docker services
    echo "🐳 Stopping Docker services..."
    docker-compose down
    
    echo "✅ Platform stopped successfully"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for launcher process
if [ ! -z "$LAUNCHER_PID" ]; then
    wait $LAUNCHER_PID
fi