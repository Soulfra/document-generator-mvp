#!/bin/bash

# 🕵️📊 LAUNCH MYSTERY TERMINAL SYSTEM
# ===================================
# Bloomberg Terminal meets Hardy Boys/Scooby Doo investigations

echo "🕵️📊 MYSTERY TERMINAL SYSTEM"
echo "============================"
echo ""
echo "📊 Bloomberg-Style Terminal Features:"
echo "   • Real-time financial data streaming"
echo "   • Multi-asset class monitoring (Equities, Crypto, FX, Bonds)"
echo "   • Professional terminal interface"
echo "   • News feed integration"
echo "   • Anomaly detection and alerting"
echo ""

# Check if port 6666 is available
if lsof -Pi :6666 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 6666 is already in use. Stopping existing service..."
    kill $(lsof -t -i:6666) 2>/dev/null || true
    sleep 2
fi

echo "🕵️ Hardy Boys/Scooby Doo Investigation Features:"
echo "   • Automatic mystery generation from data anomalies"
echo "   • AI detective team with specialized skills"
echo "   • XML-structured case narratives"
echo "   • Clue generation and correlation"
echo "   • Story-driven financial investigations"
echo ""

echo "👥 DETECTIVE TEAM:"
echo "   • Frank Hardy: Market Analysis Specialist (80% confidence)"
echo "   • Joe Hardy: Technical Pattern Expert (70% confidence)"
echo "   • Nancy Drew: Forensic Accounting Master (90% confidence)"
echo "   • Shaggy: Crypto Anomaly Sniffer (60% confidence)"
echo "   • Velma: Data Correlation Genius (95% confidence)"
echo "   • Scooby: Blockchain Transaction Tracker (85% confidence)"
echo ""

echo "🔍 INVESTIGATION TOOLS:"
echo "   • Financial Magnifying Glass - Deep data analysis"
echo "   • Pattern Detective Scanner - Technical pattern recognition"
echo "   • Correlation Sherlock Engine - Multi-asset correlation"
echo "   • Anomaly Scanner - Unusual activity detection"
echo "   • Social Sentiment Sniffer - Social media manipulation"
echo "   • Blockchain Tracker - Crypto transaction tracing"
echo ""

echo "🎭 MYSTERY TYPES:"
echo "   • Pump-and-dump schemes"
echo "   • Insider trading investigations"
echo "   • Market manipulation campaigns"
echo "   • Crypto whale activities"
echo "   • DeFi protocol exploits"
echo "   • Social media coordinated attacks"
echo "   • Options flow anomalies"
echo "   • Earnings leak investigations"
echo ""

echo "📖 STORYTELLING ENGINE:"
echo "   • Hardy Boys style market investigations"
echo "   • Scooby Doo crypto mystery adventures"
echo "   • Nancy Drew forensic accounting cases"
echo "   • XML-structured narrative generation"
echo "   • Plot templates for different mystery types"
echo ""

echo "🚀 Launching Mystery Terminal System..."
node mystery-terminal-system.js &
MYSTERY_PID=$!

# Wait for startup
sleep 3

# Check if system started successfully
if ps -p $MYSTERY_PID > /dev/null; then
    echo ""
    echo "✅ Mystery Terminal System started successfully!"
    echo ""
    echo "🕵️ TERMINAL INTERFACE: http://localhost:6666"
    echo ""
    echo "📊 BLOOMBERG-STYLE LAYOUT:"
    echo "   • Left Panel: Real-time data streams (equities, crypto, news)"
    echo "   • Center Panel: Professional terminal with investigation output"
    echo "   • Right Panel: Active mystery cases and clues"
    echo "   • Bottom Ticker: Live market data and mystery alerts"
    echo "   • Top Status Bar: System status and active case count"
    echo ""
    echo "🎯 HOW MYSTERIES ARE GENERATED:"
    echo "   1. System monitors real-time data for anomalies"
    echo "   2. When suspicious activity detected → Mystery created"
    echo "   3. AI assigns appropriate investigators based on specialty"
    echo "   4. Investigators generate clues using their tools"
    echo "   5. Story narrative develops as investigation progresses"
    echo ""
    echo "🔍 INVESTIGATION WORKFLOW:"
    echo "   • Volume spikes → 'Case of the Mysterious Trading'"
    echo "   • Whale movements → 'Crypto Mystery Adventure'"
    echo "   • Social campaigns → 'The Social Media Manipulation Scheme'"
    echo "   • Options flow → 'Mystery of the Insider Information'"
    echo ""
    echo "📊 DATA SOURCES (Simulated):"
    echo "   • Equity prices and volumes"
    echo "   • Cryptocurrency whale alerts"
    echo "   • Options flow data"
    echo "   • Social media sentiment"
    echo "   • News feed integration"
    echo "   • Blockchain transaction monitoring"
    echo ""
    echo "🎮 INTERACTIVE FEATURES:"
    echo "   • Click mystery cases to expand investigations"
    echo "   • Watch investigators work in real-time"
    echo "   • Follow clue discovery and correlation"
    echo "   • Read story narratives as they develop"
    echo "   • Monitor data streams for new anomalies"
    echo ""
    
    # Try to open browser
    if command -v open >/dev/null 2>&1; then
        echo "🌐 Opening mystery terminal interface..."
        open http://localhost:6666
    elif command -v xdg-open >/dev/null 2>&1; then
        echo "🌐 Opening mystery terminal interface..."
        xdg-open http://localhost:6666
    else
        echo "📱 Manually visit: http://localhost:6666"
    fi
    
    echo ""
    echo "⏹️  To stop: kill $MYSTERY_PID"
    echo ""
    echo "🕵️ The financial mysteries await investigation..."
    echo ""
    
    # Keep script running
    echo "🔄 Mystery terminal running... Press Ctrl+C to stop"
    trap "echo ''; echo '🕵️ Closing the mystery terminal...'; kill $MYSTERY_PID; exit 0" INT
    
    # Monitor the process
    while ps -p $MYSTERY_PID > /dev/null; do
        sleep 5
    done
    
    echo "❌ Mystery terminal system stopped"
else
    echo "❌ Failed to launch Mystery Terminal System"
    exit 1
fi