#!/bin/bash

# 🎬 DIAMOND LAYER TRAILER CREATOR
# One command to generate your cinematic trailer

echo "🎬 DIAMOND LAYER TRAILER CREATOR"
echo "==============================="
echo ""

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ FFmpeg is required but not installed."
    echo ""
    echo "To install FFmpeg:"
    echo "  Mac:     brew install ffmpeg"
    echo "  Ubuntu:  sudo apt install ffmpeg"
    echo "  Windows: Download from https://ffmpeg.org"
    echo ""
    exit 1
fi

# Menu
echo "Choose trailer generation method:"
echo ""
echo "1. 🎥 Quick Preview (GIF only, low quality)"
echo "2. 🎬 Standard Trailer (MP4 + GIF, medium quality)"
echo "3. 🏆 Professional Trailer (All formats, high quality)"
echo "4. 👁️  View Trailer in Browser Only"
echo "5. 🎵 Generate with Sound (requires additional setup)"
echo ""
read -p "Select option (1-5): " choice

case $choice in
    1)
        echo ""
        echo "🎥 Generating quick preview..."
        node record-diamond-trailer.js --quality low --format gif --fps 15
        ;;
    2)
        echo ""
        echo "🎬 Generating standard trailer..."
        node record-diamond-trailer.js --quality medium --format mp4,gif
        ;;
    3)
        echo ""
        echo "🏆 Generating professional trailer..."
        node record-diamond-trailer.js --quality high --format mp4,gif,webm
        ;;
    4)
        echo ""
        echo "👁️  Opening trailer in browser..."
        echo "   Starting local server..."
        python3 -m http.server 8889 > /dev/null 2>&1 &
        SERVER_PID=$!
        sleep 2
        echo "   Opening browser..."
        open "http://localhost:8889/diamond-layer-cinematic-trailer.html" || \
        xdg-open "http://localhost:8889/diamond-layer-cinematic-trailer.html" 2>/dev/null || \
        echo "   Please open: http://localhost:8889/diamond-layer-cinematic-trailer.html"
        echo ""
        echo "Press Ctrl+C to stop the server"
        wait $SERVER_PID
        ;;
    5)
        echo ""
        echo "🎵 Sound generation requires additional setup..."
        echo ""
        echo "To add sound:"
        echo "1. Start the movie sound effects service:"
        echo "   node MOVIE-STYLE-SOUND-EFFECTS.js"
        echo ""
        echo "2. Record with audio capture enabled"
        echo "3. Use ffmpeg to merge audio and video"
        echo ""
        echo "Coming soon: Automated sound integration!"
        ;;
    *)
        echo "Invalid option"
        exit 1
        ;;
esac

# Show results
if [ -d "trailer-output" ] && [ "$choice" != "4" ]; then
    echo ""
    echo "📁 Output files:"
    ls -la trailer-output/diamond-layer-trailer.* 2>/dev/null | grep -v palette
    
    echo ""
    echo "✅ Trailer generation complete!"
    echo ""
    echo "🎯 Next steps:"
    echo "   - View your trailer: open trailer-output/"
    echo "   - Share the GIF on social media"
    echo "   - Upload MP4 to YouTube/Vimeo"
    echo "   - Embed in your documentation"
    echo ""
    echo "💎 Your Diamond Layer system is ready to show the world!"
fi