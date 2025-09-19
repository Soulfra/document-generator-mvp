#!/bin/bash

# 🎨 LAUNCH CANVAS SYSTEM
# Starts all services needed for visual canvas interpreter

echo "🎨 Starting Visual Canvas Interpreter System..."
echo "=============================================="

# Check if deployment service is running
if ! curl -s http://localhost:3005/health > /dev/null 2>&1; then
    echo "🚀 Starting deployment service..."
    node cal-real-deployment.js &
    DEPLOY_PID=$!
    sleep 3
else
    echo "✅ Deployment service already running"
fi

# Check if document processor is running  
if ! curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "📄 Starting document processor..."
    cd FinishThisIdea && node simp-tag.js &
    SIMP_PID=$!
    cd ..
    sleep 3
else
    echo "✅ Document processor already running"
fi

# Start the visual canvas interpreter
echo "🎨 Starting Visual Canvas Interpreter on port 3008..."
node visual-canvas-interpreter.js &
CANVAS_PID=$!

# Wait a moment for everything to start
sleep 5

# Check all services
echo ""
echo "🔍 Checking service status..."
echo "================================"

if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Document Processor: http://localhost:3000 - RUNNING"
else
    echo "❌ Document Processor: http://localhost:3000 - FAILED"
fi

if curl -s http://localhost:3005 > /dev/null 2>&1; then
    echo "✅ Deployment Service: http://localhost:3005 - RUNNING"
else
    echo "❌ Deployment Service: http://localhost:3005 - FAILED"
fi

if curl -s http://localhost:3008 > /dev/null 2>&1; then
    echo "✅ Canvas Interpreter: http://localhost:3008 - RUNNING"
else
    echo "❌ Canvas Interpreter: http://localhost:3008 - FAILED"
fi

echo ""
echo "🚀 VISUAL CANVAS SYSTEM READY!"
echo "=============================="
echo "🎨 Canvas Interface: http://localhost:3008"
echo "📄 Document Processor: http://localhost:3000"  
echo "🚀 Deployment Service: http://localhost:3005"
echo ""
echo "✨ Features Available:"
echo "   • Draw business ideas on canvas"
echo "   • AI interprets sketches into UI elements"
echo "   • Color-coded highlighting for actions/functions"
echo "   • Real-time template suggestions"
echo "   • One-click whitelabel website generation"
echo "   • Deploy to real URLs in under 30 seconds"
echo ""
echo "🎯 Ready to turn your sketches into working websites!"
echo ""
echo "Press Ctrl+C to stop all services"

# Keep script running and handle cleanup
trap 'echo ""; echo "🛑 Shutting down services..."; kill $CANVAS_PID 2>/dev/null; kill $DEPLOY_PID 2>/dev/null; kill $SIMP_PID 2>/dev/null; exit' INT

# Wait for user interrupt
wait