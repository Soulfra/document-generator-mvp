#!/bin/bash

# 🎤 START VOICE + PORTAL AUTHENTICATION SYSTEM
# Launches both the voice authentication system and the portal
# No face tracking or surveillance - voice authentication only!

echo "🎤 Starting Voice + Portal Authentication System"
echo "==============================================="
echo "🚫 NO FACE TRACKING OR BIOMETRIC SURVEILLANCE"
echo "✅ Voice-first privacy authentication"
echo "✅ Offline QR verification"
echo "✅ Non-technical user portal"
echo ""

# No database required for simple demo version
echo "📋 Using in-memory storage (no database required)"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install express ws crypto qrcode pg multer
fi

# Start the voice authentication system in background
echo "🎤 Starting Simple Voice + QR Authentication System (port 9700)..."
node simple-voice-auth.js &
VOICE_AUTH_PID=$!
sleep 3

# Start the portal server  
echo "🌐 Starting Portal Server (port 3333)..."
PORT=3333 node portal-server.js &
PORTAL_PID=$!
sleep 2

echo ""
echo "🚀 SYSTEM READY!"
echo "==============="
echo ""
echo "Non-technical users can now:"
echo "1. Visit: http://localhost:3333/portal"
echo "2. Click '🎤 Sign in with Voice + QR'"
echo "3. Complete voice + QR authentication"
echo "4. Upload documents and create apps!"
echo ""
echo "Voice Auth Dashboard: http://localhost:9700"
echo "Portal Interface: http://localhost:3333/portal"
echo ""
echo "🔐 PRIVACY FEATURES:"
echo "• No face recognition or biometrics"
echo "• Voice authentication only"
echo "• Offline QR verification"
echo "• Anti-AI voice detection"
echo "• End-to-end encryption"
echo ""
echo "Press Ctrl+C to stop both services"

# Wait for interrupt
trap 'kill $VOICE_AUTH_PID $PORTAL_PID; echo "🛑 Services stopped"; exit 0' INT
wait