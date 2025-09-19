#!/bin/bash

# 🐛🔗 LAUNCH CENTIPEDE OS SYSTEM
# ==============================
# Snake/Line-based OS with ZK Proofs, Blamechain & Voxel MCP

echo "🐛🔗 CENTIPEDE OS SYSTEM"
echo "======================="
echo ""
echo "🧠 Snake/Line Architecture with Advanced Features:"
echo "   • Segmented OS architecture (each segment = mini-OS)"
echo "   • Zero-Knowledge proofs for all operations"
echo "   • Blamechain for accountability tracking"
echo "   • MCP Voxel system (64x64x64) for context storage"
echo "   • Photography processing pipeline"
echo "   • Google Drive integration (simulated)"
echo ""

# Check if port 2222 is available
if lsof -Pi :2222 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 2222 is already in use. Stopping existing service..."
    kill $(lsof -t -i:2222) 2>/dev/null || true
    sleep 2
fi

echo "🐛 CENTIPEDE ARCHITECTURE:"
echo "   • Head Segment: Decision making processor"
echo "   • Neck Segment: Data flow connector"
echo "   • Memory Segments: Short & long-term storage"
echo "   • I/O Segments: Input/output interfaces"
echo "   • Voxel Processor: MCP context handling"
echo "   • ZK Validator: Proof validation"
echo "   • Blame Recorder: Blockchain accountability"
echo "   • Tail Segment: System cleanup"
echo ""

echo "🔐 ZERO-KNOWLEDGE FEATURES:"
echo "   • Segment integrity proofs"
echo "   • Data flow verification"
echo "   • Context re-read validation"
echo "   • Automatic proof generation"
echo ""

echo "⛓️ BLAMECHAIN SYSTEM:"
echo "   • Genesis block initialization"
echo "   • Transaction recording for all operations"
echo "   • Proof-of-work mining (difficulty: 4)"
echo "   • Accountability for every segment action"
echo ""

echo "📦 MCP VOXEL SYSTEM:"
echo "   • 64³ voxel space for context storage"
echo "   • Context re-read capability with memory"
echo "   • Special context voxels for different data types"
echo "   • Active voxel tracking"
echo ""

echo "☁️ CLOUD INTEGRATION:"
echo "   • Google Drive file caching"
echo "   • Automatic sync capabilities"
echo "   • Cloud storage connections"
echo ""

echo "📸 PHOTOGRAPHY SYSTEM:"
echo "   • Line-based photo processing"
echo "   • Multi-stage pipeline (capture → enhance → analyze → store → blame)"
echo "   • Segment-based photo handling"
echo ""

echo "🚀 Launching Centipede OS..."
node centipede-os-system.js &
CENTIPEDE_PID=$!

# Wait for startup
sleep 3

# Check if system started successfully
if ps -p $CENTIPEDE_PID > /dev/null; then
    echo ""
    echo "✅ Centipede OS started successfully!"
    echo ""
    echo "🐛 CENTIPEDE INTERFACE: http://localhost:2222"
    echo ""
    echo "🎯 INTERACTIVE FEATURES:"
    echo "   • Click segments to process data through them"
    echo "   • Watch real-time ZK proof generation"
    echo "   • See blamechain blocks being mined"
    echo "   • Observe voxel context updates"
    echo "   • Grow the centipede by adding new segments"
    echo ""
    echo "📊 API ENDPOINTS:"
    echo "   • /api/segments - View all segments"
    echo "   • /api/voxels - MCP voxel status"
    echo "   • /api/blamechain - Blockchain state"
    echo "   • /api/photography - Photo processing"
    echo "   • /api/process/[segment] - Process data through segment"
    echo "   • /api/reread/[context] - Re-read context from voxels"
    echo "   • /api/grow - Add new segment to centipede"
    echo ""
    echo "🧬 GROWING CAPABILITY:"
    echo "   • Centipede can grow infinitely"
    echo "   • Each new segment adds functionality"
    echo "   • Dynamic architecture expansion"
    echo "   • All growth recorded on blamechain"
    echo ""
    echo "💡 ZK PROOF CIRCUITS:"
    echo "   • Segment Integrity (1000 constraints)"
    echo "   • Data Flow Validation (2000 constraints)"
    echo "   • Context Re-read (1500 constraints)"
    echo ""
    
    # Try to open browser
    if command -v open >/dev/null 2>&1; then
        echo "🌐 Opening Centipede OS interface..."
        open http://localhost:2222
    elif command -v xdg-open >/dev/null 2>&1; then
        echo "🌐 Opening Centipede OS interface..."
        xdg-open http://localhost:2222
    else
        echo "📱 Manually visit: http://localhost:2222"
    fi
    
    echo ""
    echo "⏹️  To stop: kill $CENTIPEDE_PID"
    echo ""
    echo "🐛 The Centipede OS is alive and growing..."
    echo ""
    
    # Keep script running
    echo "🔄 Centipede OS running... Press Ctrl+C to stop"
    trap "echo ''; echo '🐛 Stopping the Centipede...'; kill $CENTIPEDE_PID; exit 0" INT
    
    # Monitor the process
    while ps -p $CENTIPEDE_PID > /dev/null; do
        sleep 5
    done
    
    echo "❌ Centipede OS stopped"
else
    echo "❌ Failed to launch Centipede OS"
    exit 1
fi