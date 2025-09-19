#!/bin/bash

echo "🌐 LAUNCHING SOULFRA UNDERGROUND INTERNET"
echo "========================================"
echo "Voice + $1 + Trust = New Internet"
echo ""

# Create necessary directories
mkdir -p logs
mkdir -p data/voices
mkdir -p data/ideas

# Kill any existing services
echo "🧹 Cleaning up old processes..."
lsof -ti:3333 | xargs kill -9 2>/dev/null
lsof -ti:3334 | xargs kill -9 2>/dev/null
lsof -ti:3335 | xargs kill -9 2>/dev/null

# Start core services
echo ""
echo "🚀 Starting SOULFRA services..."

# 1. Main SOULFRA MVP
echo "Starting SOULFRA MVP (port 3333)..."
node build-soulfra-mvp.js > logs/soulfra-mvp.log 2>&1 &
sleep 2

# 2. QR Voice Login System
echo "Starting QR Voice Login (port 3334)..."
node soulfra-qr-voice-login.js > logs/soulfra-qr.log 2>&1 &
sleep 2

# 3. Idea Matcher
echo "Starting Idea Matcher..."
node soulfra-idea-matcher.js > logs/idea-matcher.log 2>&1 &

# 4. Check if Ollama is running for AI
if command -v ollama &> /dev/null; then
    if ! curl -s http://localhost:11434/api/tags > /dev/null; then
        echo "Starting Ollama for local AI..."
        ollama serve > logs/ollama.log 2>&1 &
        sleep 3
    fi
    echo "✅ Local AI ready (Ollama)"
else
    echo "⚠️  Ollama not found - will use cloud AI"
fi

# Wait for services
sleep 3

# Create unified interface
cat > soulfra-homepage.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>SOULFRA - The Underground Internet</title>
    <style>
        body {
            background: #000;
            color: #0f0;
            font-family: 'Courier New', monospace;
            margin: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        .container {
            text-align: center;
            max-width: 600px;
            padding: 40px;
        }
        .ascii-logo {
            font-size: 12px;
            color: #0f0;
            text-shadow: 0 0 10px #0f0;
            margin-bottom: 30px;
        }
        .qr-container {
            background: white;
            padding: 20px;
            display: inline-block;
            margin: 20px 0;
            border-radius: 10px;
        }
        .enter-button {
            background: #111;
            border: 2px solid #0f0;
            color: #0f0;
            padding: 20px 40px;
            font-size: 18px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            margin: 20px;
            transition: all 0.3s;
        }
        .enter-button:hover {
            background: #0f0;
            color: #000;
            box-shadow: 0 0 20px #0f0;
        }
        .tagline {
            color: #ff0;
            font-size: 20px;
            margin: 20px 0;
        }
        .features {
            text-align: left;
            margin: 30px auto;
            padding: 20px;
            border: 1px solid #0f0;
        }
        pre { margin: 0; }
    </style>
</head>
<body>
    <div class="container">
        <pre class="ascii-logo">
███████╗ ██████╗ ██╗   ██╗██╗     ███████╗██████╗  █████╗ 
██╔════╝██╔═══██╗██║   ██║██║     ██╔════╝██╔══██╗██╔══██╗
███████╗██║   ██║██║   ██║██║     █████╗  ██████╔╝███████║
╚════██║██║   ██║██║   ██║██║     ██╔══╝  ██╔══██╗██╔══██║
███████║╚██████╔╝╚██████╔╝███████╗██║     ██║  ██║██║  ██║
╚══════╝ ╚═════╝  ╚═════╝ ╚══════╝╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝
        </pre>
        
        <div class="tagline">Voice + $1 + Trust = New Internet</div>
        
        <div class="qr-container">
            <div id="qr-code">Loading QR Code...</div>
        </div>
        
        <a href="/voice-auth/demo" class="enter-button">
            🎤 ENTER WITH VOICE
        </a>
        
        <div class="features">
            <h3>🍪 Why SOULFRA?</h3>
            <ul>
                <li>See what Cookie Monster tracks (they make $575/year from YOU)</li>
                <li>Your voice is your identity (no passwords)</li>
                <li>$1 proves you're human (no bots)</li>
                <li>Find people building similar ideas</li>
                <li>AI assistant that's YOURS</li>
                <li>D2JSP-style economy that works</li>
            </ul>
        </div>
        
        <p style="color:#666;">
            Like D2JSP but for everything.<br>
            Like Tor but friendly.<br>
            Like Facebook but you own it.
        </p>
    </div>
    
    <script>
        // Generate QR code
        fetch('/api/qr-login')
            .then(r => r.json())
            .then(data => {
                if (data.qrCode) {
                    document.getElementById('qr-code').innerHTML = 
                        '<img src="' + data.qrCode + '" alt="QR Login">';
                }
            })
            .catch(() => {
                document.getElementById('qr-code').textContent = 
                    'QR service starting...';
            });
    </script>
</body>
</html>
EOF

echo ""
echo "✅ SOULFRA UNDERGROUND LAUNCHED!"
echo "================================"
echo ""
echo "🌐 Main Interface: http://localhost:3333"
echo "🎤 Voice Login: http://localhost:3334"
echo "💡 Open soulfra-homepage.html for the full experience"
echo ""
echo "📊 Services Running:"
echo "- SOULFRA MVP (Forums, Credits, Trading)"
echo "- QR Voice Login (Cookie Monster tracking)"
echo "- Idea Matcher (Find collaborators)"
echo "- Local AI (if Ollama installed)"
echo ""
echo "🎮 The Underground Internet Features:"
echo "1. Voice is your login (no passwords)"
echo "2. $1 entry fee (proves you're human)"
echo "3. Cookie Monster shows tracking (hilarious + educational)"
echo "4. Match with people building similar ideas"
echo "5. Your AI follows you everywhere"
echo "6. Credits like D2JSP forum gold"
echo "7. Friends verify friends (web of trust)"
echo ""
echo "🚀 This is the internet WE wanted."
echo ""
echo "Press Ctrl+C to shutdown the underground"

# Keep running
wait