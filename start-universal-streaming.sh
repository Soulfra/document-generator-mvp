#!/bin/bash

# START UNIVERSAL STREAMING INTERFACE
# Cross-device control system that works like a "new type of discord bot"

echo "🌐 Starting Universal Streaming Interface..."

# Set environment variables
export NODE_ENV="${NODE_ENV:-development}"
export DB_HOST="${DB_HOST:-localhost}"
export DB_USER="${DB_USER:-root}"
export DB_PASSWORD="${DB_PASSWORD:-}"
export DB_NAME="${DB_NAME:-economic_engine}"

echo "📊 Database: $DB_HOST/$DB_NAME"
echo "🖥️ Device: $(hostname) ($(uname -s))"

# Check dependencies
echo "🔍 Checking dependencies..."

# Check database connection
node -e "
const mysql = require('mysql2');
const connection = mysql.createConnection({
    host: '$DB_HOST',
    user: '$DB_USER',
    password: '$DB_PASSWORD',
    database: '$DB_NAME'
});
connection.connect((err) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        process.exit(1);
    } else {
        console.log('✅ Database connection successful');
        connection.end();
    }
});
" || {
    echo "❌ Database connection failed"
    exit 1
}

# Check required Node.js modules
echo "📦 Checking Node.js modules..."
node -e "
const modules = ['express', 'ws', 'mysql2', 'crypto'];
modules.forEach(mod => {
    try {
        require(mod);
        console.log(\`✅ \${mod}\`);
    } catch (err) {
        console.error(\`❌ \${mod} - Please run: npm install \${mod}\`);
        process.exit(1);
    }
});
" || {
    echo "❌ Missing Node.js modules"
    echo "📦 Run: npm install express ws mysql2"
    exit 1
}

# Check system capabilities
echo "🔍 Detecting device capabilities..."
DEVICE_TYPE="unknown"
SCREEN_CAP=false
VOICE_CAP=false

case "$(uname -s)" in
    Darwin)
        DEVICE_TYPE="desktop"
        if command -v screencapture >/dev/null 2>&1; then
            SCREEN_CAP=true
            echo "✅ Screen capture available (screencapture)"
        fi
        VOICE_CAP=true
        ;;
    Linux)
        if [ -n "$DISPLAY" ]; then
            DEVICE_TYPE="desktop"
            if command -v scrot >/dev/null 2>&1; then
                SCREEN_CAP=true
                echo "✅ Screen capture available (scrot)"
            elif command -v gnome-screenshot >/dev/null 2>&1; then
                SCREEN_CAP=true
                echo "✅ Screen capture available (gnome-screenshot)"
            fi
        else
            DEVICE_TYPE="server"
            echo "⚠️ No display detected (server mode)"
        fi
        VOICE_CAP=true
        ;;
    MINGW*|MSYS*|CYGWIN*)
        DEVICE_TYPE="desktop"
        SCREEN_CAP=true
        VOICE_CAP=true
        echo "✅ Windows detected - full capabilities assumed"
        ;;
esac

echo "🖥️ Device type: $DEVICE_TYPE"
echo "📺 Screen capture: $SCREEN_CAP"
echo "🎤 Voice support: $VOICE_CAP"

# Start the streaming interface
echo "🚀 Starting Universal Streaming Interface..."
echo "📊 Control Panel: http://localhost:42016/control-panel"
echo "🔌 WebSocket: ws://localhost:42017"
echo "📱 Device Registration: Automatic"
echo ""
echo "💡 Features:"
echo "   • Cross-device command execution"
echo "   • Voice command processing"
echo "   • Screen streaming and capture"
echo "   • Remote input control"
echo "   • Real-time device discovery"
echo ""
echo "🗣️ Voice Commands:"
echo "   • 'Take a screenshot'"
echo "   • 'Type hello world'"
echo "   • 'Open google.com'"
echo "   • 'Run ls -la'"
echo ""

# Create logs directory
mkdir -p logs

# Start with auto-restart on failure
while true; do
    echo "▶️ Starting universal streaming interface (PID: $$)..."
    node universal-streaming-interface.js 2>&1 | tee logs/streaming-$(date +%Y%m%d-%H%M%S).log
    
    exit_code=$?
    if [ $exit_code -eq 0 ]; then
        echo "✅ Universal streaming interface shut down gracefully"
        break
    else
        echo "❌ Universal streaming interface crashed (exit code: $exit_code)"
        echo "🔄 Restarting in 5 seconds..."
        sleep 5
    fi
done