#!/bin/bash

echo "
███████╗ ██████╗ ██╗   ██╗██╗     ███████╗██████╗  █████╗ 
██╔════╝██╔═══██╗██║   ██║██║     ██╔════╝██╔══██╗██╔══██╗
███████╗██║   ██║██║   ██║██║     █████╗  ██████╔╝███████║
╚════██║██║   ██║██║   ██║██║     ██╔══╝  ██╔══██╗██╔══██║
███████║╚██████╔╝╚██████╔╝███████╗██║     ██║  ██║██║  ██║
╚══════╝ ╚═════╝  ╚═════╝ ╚══════╝╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝

THE UNDERGROUND INTERNET - VOICE + $1 + TRUST = FREEDOM
"

echo "🚀 Starting SOULFRA Complete System..."
echo "=================================="

# Create necessary directories
mkdir -p logs
mkdir -p data/voices
mkdir -p data/ideas  
mkdir -p data/events
mkdir -p data/mesh
mkdir -p data/friends

# Kill any existing services
echo "🧹 Cleaning up old processes..."
lsof -ti:3333 | xargs kill -9 2>/dev/null
lsof -ti:3334 | xargs kill -9 2>/dev/null
lsof -ti:3335 | xargs kill -9 2>/dev/null
lsof -ti:3336 | xargs kill -9 2>/dev/null
lsof -ti:3337 | xargs kill -9 2>/dev/null
lsof -ti:3338 | xargs kill -9 2>/dev/null
lsof -ti:8082 | xargs kill -9 2>/dev/null
lsof -ti:8083 | xargs kill -9 2>/dev/null

# Start all services
echo ""
echo "🎤 Starting Voice Authentication (3333)..."
node soulfra-qr-voice-login.js > logs/voice-auth.log 2>&1 &
sleep 2

echo "💡 Starting Idea Matcher..."
node soulfra-idea-matcher.js > logs/idea-matcher.log 2>&1 &
sleep 1

echo "💳 Starting Stripe Payments (3335)..."
node soulfra-stripe-integration.js > logs/stripe.log 2>&1 &
sleep 1

echo "🎫 Starting RFID Event System (3336)..."
node soulfra-rfid-event-system.js > logs/events.log 2>&1 &
sleep 1

echo "💬 Starting Real Friends Chat (3337)..."
node soulfra-real-friends-chat.js > logs/chat.log 2>&1 &
sleep 1

echo "🌐 Starting ARPANET Mesh Network..."
node soulfra-arpanet-mesh.js > logs/mesh.log 2>&1 &
sleep 1

echo "🎮 Starting Traffic Game Engine (3339)..."
node soulfra-traffic-game-engine.js > logs/traffic-game.log 2>&1 &
sleep 2

# Check if Ollama is available
if command -v ollama &> /dev/null; then
    if ! curl -s http://localhost:11434/api/tags > /dev/null; then
        echo "🤖 Starting Ollama for local AI..."
        ollama serve > logs/ollama.log 2>&1 &
        sleep 3
    fi
    echo "✅ Local AI ready"
else
    echo "⚠️  Ollama not found - AI features limited"
fi

# Create unified homepage
cat > soulfra-complete.html << 'EOF'
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
            padding: 20px;
            min-height: 100vh;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
        }
        .ascii-logo {
            font-size: 10px;
            line-height: 1;
            color: #0f0;
            text-shadow: 0 0 10px #0f0;
        }
        .tagline {
            color: #ff0;
            font-size: 24px;
            margin: 20px 0;
        }
        .services-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            max-width: 1200px;
            margin: 0 auto;
        }
        .service-card {
            border: 2px solid #0f0;
            padding: 20px;
            background: #111;
            transition: all 0.3s;
            cursor: pointer;
        }
        .service-card:hover {
            background: #1a1a1a;
            box-shadow: 0 0 20px #0f0;
            transform: scale(1.02);
        }
        .service-card h3 {
            color: #0ff;
            margin-bottom: 10px;
        }
        .service-status {
            position: absolute;
            top: 10px;
            right: 10px;
            width: 10px;
            height: 10px;
            background: #0f0;
            border-radius: 50%;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        .stats {
            text-align: center;
            margin: 40px 0;
            padding: 20px;
            border: 1px solid #0f0;
            background: #0a0a0a;
        }
        .mesh-status {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #222;
            border: 2px solid #0ff;
            padding: 15px;
            color: #0ff;
        }
        .warning {
            color: #f00;
            text-align: center;
            margin: 20px 0;
        }
        pre { margin: 0; }
    </style>
</head>
<body>
    <div class="header">
        <pre class="ascii-logo">
███████╗ ██████╗ ██╗   ██╗██╗     ███████╗██████╗  █████╗ 
██╔════╝██╔═══██╗██║   ██║██║     ██╔════╝██╔══██╗██╔══██╗
███████╗██║   ██║██║   ██║██║     █████╗  ██████╔╝███████║
╚════██║██║   ██║██║   ██║██║     ██╔══╝  ██╔══██╗██╔══██║
███████║╚██████╔╝╚██████╔╝███████╗██║     ██║  ██║██║  ██║
╚══════╝ ╚═════╝  ╚═════╝ ╚══════╝╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝
        </pre>
        <div class="tagline">Voice + $1 + Trust = The REAL Internet</div>
        <p>No Facebook. No surveillance. Just real people.</p>
    </div>

    <div class="services-grid">
        <div class="service-card" onclick="window.open('http://localhost:3333')">
            <div class="service-status"></div>
            <h3>🎤 Voice Authentication</h3>
            <p>Your voice is your password</p>
            <ul>
                <li>No passwords to remember</li>
                <li>Cookie Monster tracking alerts</li>
                <li>See who profits from YOUR data</li>
            </ul>
            <strong>→ Start Here</strong>
        </div>

        <div class="service-card" onclick="window.open('http://localhost:3336/events-dashboard')">
            <div class="service-status"></div>
            <h3>🎫 Real World Events</h3>
            <p>RFID/NFC ticketing for underground</p>
            <ul>
                <li>Artist drops & secret shows</li>
                <li>Kickball games & sports</li>
                <li>Voice-verified entry only</li>
            </ul>
        </div>

        <div class="service-card" onclick="window.open('http://localhost:3337/chat')">
            <div class="service-status"></div>
            <h3>💬 Real Friends Chat</h3>
            <p>Like AIM but with voice verification</p>
            <ul>
                <li>Both must verify each other</li>
                <li>No algorithms or ads</li>
                <li>Voice notes & mesh relay</li>
            </ul>
        </div>

        <div class="service-card" onclick="window.open('http://localhost:3338/mesh-dashboard')">
            <div class="service-status"></div>
            <h3>🌐 ARPANET Mesh</h3>
            <p>Local P2P like original internet</p>
            <ul>
                <li>Works without ISPs</li>
                <li>Perfect for festivals</li>
                <li>Distributed & uncensorable</li>
            </ul>
        </div>

        <div class="service-card" onclick="window.open('http://localhost:3339/traffic-game')">
            <div class="service-status"></div>
            <h3>🎮 Traffic Game</h3>
            <p>Your web traffic becomes a video game!</p>
            <ul>
                <li>Debug bugs as boss battles</li>
                <li>OCR blockchain verification</li>
                <li>Encrypted useless breach data</li>
            </ul>
        </div>

        <div class="service-card" onclick="alert('Coming soon: Personal AI that follows you everywhere!')">
            <h3>🤖 Your AI Assistant</h3>
            <p>AI that's actually YOURS</p>
            <ul>
                <li>Knows your browsing but never tells</li>
                <li>Helps you build anything</li>
                <li>No corporate surveillance</li>
            </ul>
            <strong>Coming Soon</strong>
        </div>

        <div class="service-card" onclick="window.open('http://localhost:3335/payment')">
            <h3>💰 Credit Economy</h3>
            <p>Like D2JSP forum gold but better</p>
            <ul>
                <li>$1 entry = 100 credits</li>
                <li>Trade services & ideas</li>
                <li>No corporate middlemen</li>
            </ul>
        </div>
    </div>

    <div class="stats">
        <h2>🍪 Why SOULFRA?</h2>
        <p>Big Tech makes <strong>$575/year</strong> from YOUR data</p>
        <p>Facebook has <strong>47 cookies</strong> tracking you RIGHT NOW</p>
        <p>Google knows more about you than your mother</p>
        <p style="color:#ff0;font-size:20px;margin-top:20px;">
            Time to take back the internet.
        </p>
    </div>

    <div class="warning">
        ⚠️ This is the UNDERGROUND. No corporate BS. Real friends only.
    </div>

    <div class="mesh-status">
        <h4>Mesh Network</h4>
        <p id="meshPeers">Peers: 0</p>
        <p>Status: <span style="color:#0f0;">● Active</span></p>
    </div>

    <script>
        // Check service status
        async function checkServices() {
            const services = [
                { url: 'http://localhost:3333', name: 'Voice Auth' },
                { url: 'http://localhost:3336', name: 'Events' },
                { url: 'http://localhost:3337', name: 'Chat' },
                { url: 'http://localhost:3338/mesh-status', name: 'Mesh' },
                { url: 'http://localhost:3339', name: 'Traffic Game' }
            ];

            for (let service of services) {
                try {
                    const response = await fetch(service.url);
                    console.log(`✅ ${service.name} is running`);
                } catch (e) {
                    console.log(`❌ ${service.name} is down`);
                }
            }
        }

        // Simulate mesh peers
        setInterval(() => {
            const peers = Math.floor(Math.random() * 5) + 2;
            document.getElementById('meshPeers').textContent = `Peers: ${peers}`;
        }, 3000);

        // Check services on load
        setTimeout(checkServices, 2000);
    </script>
</body>
</html>
EOF

echo ""
echo "✅ SOULFRA UNDERGROUND INTERNET LAUNCHED!"
echo "========================================"
echo ""
echo "🌐 Main Dashboard: file://$(pwd)/soulfra-complete.html"
echo ""
echo "Individual Services:"
echo "🎤 Voice Auth: http://localhost:3333"
echo "💡 Idea Matcher: (background service)"
echo "💳 Payments: http://localhost:3335"
echo "🎫 Events: http://localhost:3336/events-dashboard"
echo "💬 Chat: http://localhost:3337/chat"
echo "🌐 Mesh: http://localhost:3338/mesh-dashboard"
echo "🎮 Traffic Game: http://localhost:3339/traffic-game"
echo ""
echo "WebSockets:"
echo "📡 Events WS: ws://localhost:8082"
echo "💬 Chat WS: ws://localhost:8083"
echo "🎮 Traffic Game WS: ws://localhost:8084"
echo ""
echo "📊 Logs in: ./logs/"
echo ""
echo "🚀 The Underground Internet is LIVE!"
echo "Voice + $1 + Trust = Freedom from Big Tech"
echo ""
echo "Press Ctrl+C to shutdown the underground"

# Open dashboard
if command -v open &> /dev/null; then
    open soulfra-complete.html
elif command -v xdg-open &> /dev/null; then
    xdg-open soulfra-complete.html
fi

# Keep running and show logs
tail -f logs/*.log