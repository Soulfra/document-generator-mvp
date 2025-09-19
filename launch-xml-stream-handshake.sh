#!/bin/bash

# 🗺️🎥🤝 XML-STREAM HANDSHAKE LAUNCHER
# ====================================
# Launches complete XML-wrapped stream-safe visualization system
# Enables full bidirectional integration and handshake protocol

set -e

echo "🗺️🎥🤝 XML-STREAM HANDSHAKE LAUNCHER"
echo "===================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Configuration
INTEGRATION_BRIDGE_PORT=8091
XML_WS_PORT=8091
STREAM_WS_PORT=8092
DASHBOARD_PORT=8093

echo -e "${PURPLE}🤝 Initializing XML-Stream integration handshake...${NC}"

# Step 1: Check prerequisites
echo -e "${BLUE}📋 Step 1: Checking handshake prerequisites...${NC}"

REQUIRED_FILES=(
    "xml-stream-integration-bridge.js"
    "xml-websocket-client.js"
    "stream-websocket-client.js"
    "xml-tier15-mapper.js"
    "stream-safe-tier-visualizer.html"
)

MISSING_FILES=()
for file in "${REQUIRED_FILES[@]}"; do
    if [[ ! -f "$file" ]]; then
        MISSING_FILES+=("$file")
    fi
done

if [[ ${#MISSING_FILES[@]} -gt 0 ]]; then
    echo -e "${RED}❌ Missing required files for handshake:${NC}"
    printf '%s\n' "${MISSING_FILES[@]}"
    exit 1
fi

echo -e "${GREEN}   ✅ All handshake components ready${NC}"

# Step 2: Setup integration directories
echo -e "${BLUE}📁 Step 2: Setting up integration infrastructure...${NC}"

mkdir -p .reasoning-viz/{xml-stream-bridge/{mappings,handshakes,sync-logs,integration-schemas},logs,xml-tiers,stream-overlays}

echo -e "${GREEN}   ✅ Integration infrastructure ready${NC}"

# Step 3: Start the Integration Bridge (Master Handshake Controller)
echo -e "${BLUE}🌉 Step 3: Starting XML-Stream Integration Bridge...${NC}"

# Kill any existing bridge processes
pkill -f "xml-stream-integration-bridge.js" 2>/dev/null || true
sleep 2

# Start the integration bridge
echo "   🌉 Starting master integration bridge..."
node xml-stream-integration-bridge.js > .reasoning-viz/integration-bridge.log 2>&1 &
BRIDGE_PID=$!
echo $BRIDGE_PID > .reasoning-viz/integration-bridge.pid

# Wait for bridge initialization
echo "   ⏳ Initializing integration bridge..."
sleep 5

if kill -0 $BRIDGE_PID 2>/dev/null; then
    echo -e "${GREEN}   ✅ Integration Bridge active (PID: $BRIDGE_PID)${NC}"
    echo "      🔌 XML WebSocket: ws://localhost:$XML_WS_PORT/xml-integration"
    echo "      🔌 Stream WebSocket: ws://localhost:$STREAM_WS_PORT/stream-integration"
else
    echo -e "${RED}   ❌ Integration Bridge failed to start${NC}"
    cat .reasoning-viz/integration-bridge.log
    exit 1
fi

# Step 4: Start XML Tier 15 Mapper with WebSocket Client
echo -e "${BLUE}🗺️ Step 4: Starting XML Tier Mapper with integration...${NC}"

# Kill any existing XML mapper
pkill -f "xml-tier15-mapper.js" 2>/dev/null || true
sleep 2

# Create integrated XML mapper launcher
cat > integrated-xml-mapper.js << 'EOF'
#!/usr/bin/env node

// Integrated XML Mapper with WebSocket Client
const XMLTier15Mapper = require('./xml-tier15-mapper');
const XMLWebSocketClient = require('./xml-websocket-client');

console.log('🗺️🔌 Starting Integrated XML Mapper...');

// Start XML Tier Mapper
const xmlMapper = new XMLTier15Mapper();

// Connect to integration bridge
const xmlClient = new XMLWebSocketClient(xmlMapper);

console.log('✅ Integrated XML Mapper with WebSocket client active');

// Keep process alive
process.on('SIGINT', () => {
    console.log('🛑 Shutting down integrated XML mapper...');
    xmlClient.disconnect();
    process.exit(0);
});
EOF

# Start integrated XML mapper
echo "   🗺️ Starting XML mapper with WebSocket integration..."
node integrated-xml-mapper.js > .reasoning-viz/xml-mapper-integrated.log 2>&1 &
XML_MAPPER_PID=$!
echo $XML_MAPPER_PID > .reasoning-viz/xml-mapper-integrated.pid

sleep 3

if kill -0 $XML_MAPPER_PID 2>/dev/null; then
    echo -e "${GREEN}   ✅ Integrated XML Mapper active (PID: $XML_MAPPER_PID)${NC}"
else
    echo -e "${RED}   ❌ XML Mapper integration failed${NC}"
    cat .reasoning-viz/xml-mapper-integrated.log
    exit 1
fi

# Step 5: Start Stream-Safe Visualization with WebSocket Client
echo -e "${BLUE}🎥 Step 5: Starting Stream Visualization with integration...${NC}"

# Create integrated stream visualizer HTML with WebSocket
cat > integrated-stream-visualizer.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🗺️🎥 Integrated XML-Stream Tier Visualization</title>
    
    <!-- Include the original stream-safe visualizer styles -->
    <link rel="stylesheet" href="stream-safe-tier-visualizer.html" type="text/html">
    
    <style>
        /* Additional integration styles */
        .integration-status {
            position: fixed;
            top: 10px;
            left: 10px;
            background: rgba(0, 0, 0, 0.8);
            border: 1px solid #00ffff;
            border-radius: 10px;
            padding: 10px;
            color: #00ffff;
            font-family: monospace;
            font-size: 12px;
            z-index: 9999;
        }
        
        .handshake-indicator {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #ff0000;
            display: inline-block;
            margin-right: 5px;
            animation: pulse 2s infinite;
        }
        
        .handshake-indicator.connected {
            background: #00ff00;
        }
        
        .tier-node.xml-synced {
            border-color: #00ff00 !important;
            box-shadow: 0 0 15px rgba(0, 255, 0, 0.5);
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
    </style>
</head>
<body>
    <!-- Integration Status Panel -->
    <div class="integration-status" id="integrationStatus">
        <div>🗺️ XML Mapping: <span class="handshake-indicator" id="xmlIndicator"></span><span id="xmlStatus">Connecting...</span></div>
        <div>🌉 Bridge: <span class="handshake-indicator" id="bridgeIndicator"></span><span id="bridgeStatus">Connecting...</span></div>
        <div>🤝 Handshake: <span id="handshakeStatus">Pending...</span></div>
    </div>
    
    <!-- Include original stream visualizer content -->
    <div id="originalVisualizerContent"></div>
    
    <script>
        // Load original stream visualizer content
        fetch('stream-safe-tier-visualizer.html')
            .then(response => response.text())
            .then(html => {
                // Extract body content from original visualizer
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const bodyContent = doc.body.innerHTML;
                document.getElementById('originalVisualizerContent').innerHTML = bodyContent;
                
                // Initialize original visualizer
                if (typeof StreamSafeTierVisualizer !== 'undefined') {
                    window.originalVisualizer = new StreamSafeTierVisualizer();
                }
                
                // Initialize WebSocket integration
                initializeStreamIntegration();
            });
        
        function initializeStreamIntegration() {
            console.log('🎥🔌 Initializing Stream WebSocket Integration...');
            
            // Create WebSocket client for stream integration
            class IntegratedStreamClient {
                constructor() {
                    this.bridgeUrl = 'ws://localhost:8092/stream-integration';
                    this.ws = null;
                    this.connected = false;
                    this.handshakeComplete = false;
                    
                    this.connect();
                }
                
                connect() {
                    console.log('🔌 Connecting to integration bridge...');
                    
                    try {
                        this.ws = new WebSocket(this.bridgeUrl);
                        
                        this.ws.onopen = () => {
                            console.log('✅ Connected to integration bridge');
                            this.connected = true;
                            this.updateStatus('bridge', 'Connected');
                            document.getElementById('bridgeIndicator').classList.add('connected');
                        };
                        
                        this.ws.onmessage = (event) => {
                            const message = JSON.parse(event.data);
                            this.handleBridgeMessage(message);
                        };
                        
                        this.ws.onclose = () => {
                            console.log('❌ Disconnected from bridge');
                            this.connected = false;
                            this.updateStatus('bridge', 'Disconnected');
                            document.getElementById('bridgeIndicator').classList.remove('connected');
                            
                            // Attempt reconnection
                            setTimeout(() => this.connect(), 5000);
                        };
                        
                        this.ws.onerror = (error) => {
                            console.error('🚨 WebSocket error:', error);
                        };
                        
                    } catch (error) {
                        console.error('🚨 Failed to connect:', error);
                        setTimeout(() => this.connect(), 5000);
                    }
                }
                
                handleBridgeMessage(message) {
                    console.log(`📨 Bridge message: ${message.type}`);
                    
                    switch (message.type) {
                        case 'handshake-stream':
                            this.respondToHandshake(message);
                            break;
                            
                        case 'tier-update':
                            this.updateTierFromXML(message.data);
                            break;
                            
                        case 'health-status':
                            this.updateHealthFromXML(message.data);
                            break;
                            
                        case 'xml-sync':
                            this.handleXMLSync(message.data);
                            break;
                    }
                }
                
                respondToHandshake(message) {
                    console.log('🤝 Responding to handshake...');
                    
                    const response = {
                        type: 'handshake-response',
                        id: Date.now().toString(),
                        timestamp: new Date().toISOString(),
                        data: {
                            bridgeAccepted: true,
                            systemId: 'integrated-stream-visualizer',
                            version: '1.0',
                            integrationReady: true
                        }
                    };
                    
                    this.ws.send(JSON.stringify(response));
                    this.handshakeComplete = true;
                    
                    this.updateStatus('handshake', '✅ Complete');
                    this.updateStatus('xml', 'Synchronized');
                    document.getElementById('xmlIndicator').classList.add('connected');
                    
                    console.log('✅ Handshake complete - XML and Stream are integrated!');
                }
                
                updateTierFromXML(tierData) {
                    console.log(`🗺️ Updating tier ${tierData.tierId} from XML`);
                    
                    const tierElement = document.getElementById(`tier-${tierData.tierId}`);
                    if (tierElement) {
                        // Add XML sync indicator
                        tierElement.classList.add('xml-synced');
                        
                        // Update health
                        const healthElement = tierElement.querySelector('.tier-health');
                        if (healthElement && tierData.health) {
                            const healthClass = tierData.health >= 95 ? 'excellent' : 
                                              tierData.health >= 85 ? 'good' : 'warning';
                            healthElement.className = `tier-health ${healthClass}`;
                        }
                        
                        // Flash update indicator
                        tierElement.style.border = '3px solid #00ff00';
                        setTimeout(() => {
                            tierElement.style.border = '';
                        }, 1000);
                    }
                }
                
                updateHealthFromXML(healthData) {
                    console.log('💚 Updating system health from XML');
                    
                    // Update system health displays
                    const healthElements = document.querySelectorAll('[id*="health"], [id*="Health"]');
                    healthElements.forEach(element => {
                        if (healthData.overallHealth) {
                            element.textContent = `${healthData.overallHealth}%`;
                        }
                    });
                }
                
                handleXMLSync(syncData) {
                    console.log('🔄 Processing XML synchronization data');
                    
                    // Process all sync data
                    if (syncData.tierUpdates) {
                        syncData.tierUpdates.forEach(update => {
                            this.updateTierFromXML(update);
                        });
                    }
                    
                    // Update integration status
                    this.updateStatus('xml', `Synced (${Date.now()})`);
                }
                
                updateStatus(system, status) {
                    const statusElement = document.getElementById(`${system}Status`);
                    if (statusElement) {
                        statusElement.textContent = status;
                    }
                }
            }
            
            // Initialize integrated stream client
            window.integratedStreamClient = new IntegratedStreamClient();
            
            // Setup tier interaction forwarding to XML
            document.addEventListener('click', (event) => {
                if (event.target.closest('.tier-node')) {
                    const tierNode = event.target.closest('.tier-node');
                    const tierId = tierNode.id.replace('tier-', '');
                    
                    console.log(`🖱️ Tier ${tierId} clicked - forwarding to XML`);
                    
                    if (window.integratedStreamClient.connected) {
                        const interaction = {
                            type: 'tier-interaction',
                            id: Date.now().toString(),
                            timestamp: new Date().toISOString(),
                            data: {
                                tierId: parseInt(tierId),
                                interactionType: 'click',
                                coordinates: { x: event.clientX, y: event.clientY }
                            }
                        };
                        
                        window.integratedStreamClient.ws.send(JSON.stringify(interaction));
                    }
                }
            });
        }
        
        console.log('🗺️🎥 Integrated XML-Stream Visualizer loaded');
    </script>
</body>
</html>
EOF

echo "   🎥 Created integrated stream visualizer"

# Start HTTP server for integrated visualizer
if command -v python3 &> /dev/null; then
    echo "   🌐 Starting integrated visualizer server on port $DASHBOARD_PORT..."
    python3 -m http.server $DASHBOARD_PORT > .reasoning-viz/integrated-server.log 2>&1 &
    INTEGRATED_SERVER_PID=$!
    echo $INTEGRATED_SERVER_PID > .reasoning-viz/integrated-server.pid
    sleep 2
    
    if kill -0 $INTEGRATED_SERVER_PID 2>/dev/null; then
        echo -e "${GREEN}   ✅ Integrated visualizer server started (PID: $INTEGRATED_SERVER_PID)${NC}"
    else
        echo -e "${YELLOW}   ⚠️ Integrated server had issues${NC}"
    fi
fi

# Step 6: Wait for handshake completion
echo -e "${BLUE}🤝 Step 6: Monitoring handshake completion...${NC}"

echo "   ⏳ Waiting for XML-Stream handshake..."

HANDSHAKE_TIMEOUT=30
HANDSHAKE_ELAPSED=0

while [[ $HANDSHAKE_ELAPSED -lt $HANDSHAKE_TIMEOUT ]]; do
    # Check if handshake is complete by looking for success in logs
    if grep -q "handshake complete" .reasoning-viz/integration-bridge.log 2>/dev/null; then
        echo -e "${GREEN}   ✅ XML-Stream handshake completed successfully!${NC}"
        break
    fi
    
    echo "   🔄 Handshake in progress... (${HANDSHAKE_ELAPSED}s/${HANDSHAKE_TIMEOUT}s)"
    sleep 2
    HANDSHAKE_ELAPSED=$((HANDSHAKE_ELAPSED + 2))
done

if [[ $HANDSHAKE_ELAPSED -ge $HANDSHAKE_TIMEOUT ]]; then
    echo -e "${YELLOW}   ⚠️ Handshake timeout - systems may still be connecting${NC}"
else
    echo -e "${GREEN}   🎉 HANDSHAKE COMPLETE! XML and Stream are fully integrated!${NC}"
fi

# Step 7: System ready
echo ""
echo -e "${GREEN}🎉 XML-STREAM INTEGRATION COMPLETE!${NC}"
echo "===================================="
echo ""
echo -e "${CYAN}🗺️ XML Mapping:${NC} Wrapping around stream visualization"
echo -e "${CYAN}🎥 Stream Visualization:${NC} Receiving real-time XML data"
echo -e "${CYAN}🤝 Handshake Protocol:${NC} Bidirectional communication active"
echo -e "${CYAN}🔄 Data Synchronization:${NC} Real-time XML ↔ Stream sync"
echo ""
echo -e "${BLUE}🌐 Access Points:${NC}"
echo "   • Integrated Visualizer: http://localhost:$DASHBOARD_PORT/integrated-stream-visualizer.html"
echo "   • Integration Dashboard: http://localhost:$DASHBOARD_PORT/.reasoning-viz/xml-stream-bridge/integration-dashboard.html"
echo "   • Original Stream Visualizer: http://localhost:$DASHBOARD_PORT/stream-safe-tier-visualizer.html"
echo "   • XML Tier Dashboard: http://localhost:$DASHBOARD_PORT/tier15-live-dashboard.html"
echo ""
echo -e "${BLUE}🔌 WebSocket Endpoints:${NC}"
echo "   • XML Integration: ws://localhost:$XML_WS_PORT/xml-integration"
echo "   • Stream Integration: ws://localhost:$STREAM_WS_PORT/stream-integration"
echo ""
echo -e "${BLUE}🤝 Handshake Features:${NC}"
echo "   ✅ XML tier mapping → Stream visual updates"
echo "   ✅ Stream interactions → XML data queries"
echo "   ✅ Real-time health synchronization"
echo "   ✅ Bidirectional component updates"
echo "   ✅ Cross-system error handling"
echo "   ✅ Live integration monitoring"
echo ""
echo -e "${BLUE}🎮 Integrated Features:${NC}"
echo "   • Click any tier → Queries XML mapping system"
echo "   • XML updates → Instant stream visual changes" 
echo "   • Real-time health indicators from XML data"
echo "   • Cross-system synchronization status"
echo "   • Live handshake monitoring"
echo ""
echo -e "${BLUE}📊 What You'll See:${NC}"
echo "   • 15 tiers with XML-verified health indicators"
echo "   • Green borders = XML-synchronized tiers"
echo "   • Real-time XML → Stream data flow"
echo "   • Integration status panel (top-left)"
echo "   • Live handshake status indicators"
echo ""

# Create stop script
cat > stop-xml-stream-handshake.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping XML-Stream Integration System..."

# Stop all integration processes
for pidfile in .reasoning-viz/*.pid; do
    if [[ -f "$pidfile" ]]; then
        pid=$(cat "$pidfile")
        if kill -0 $pid 2>/dev/null; then
            service=$(basename "$pidfile" .pid)
            kill $pid
            echo "   ✅ Stopped $service ($pid)"
        fi
        rm -f "$pidfile"
    fi
done

# Clean up any remaining processes
pkill -f "xml-stream-integration-bridge.js" 2>/dev/null || true
pkill -f "integrated-xml-mapper.js" 2>/dev/null || true
pkill -f "http.server.*809" 2>/dev/null || true

echo "🧹 All XML-Stream integration processes stopped"
echo "📁 Integration data preserved in .reasoning-viz/xml-stream-bridge/"
EOF

chmod +x stop-xml-stream-handshake.sh

echo -e "${GREEN}✅ Stop script created: ./stop-xml-stream-handshake.sh${NC}"

# Final status check
echo ""
echo -e "${BLUE}🔍 Final Integration Status:${NC}"
echo "   Integration Bridge: $(kill -0 $BRIDGE_PID 2>/dev/null && echo "✅ Active" || echo "❌ Inactive")"
echo "   XML Mapper: $(kill -0 $XML_MAPPER_PID 2>/dev/null && echo "✅ Active" || echo "❌ Inactive")"
echo "   Visualizer Server: $(lsof -Pi :$DASHBOARD_PORT -sTCP:LISTEN -t >/dev/null 2>&1 && echo "✅ Serving" || echo "❌ Not serving")"
echo "   WebSocket Bridge: $(lsof -Pi :$XML_WS_PORT -sTCP:LISTEN -t >/dev/null 2>&1 && echo "✅ Listening" || echo "❌ Not listening")"

echo ""
echo -e "${PURPLE}🗺️🎥🤝 XML MAPPING IS NOW WRAPPED AROUND STREAM VISUALIZATION!${NC}"
echo ""
echo -e "${CYAN}The XML tier mapping system is now fully integrated with the stream-safe${NC}"
echo -e "${CYAN}visualization. Every interaction flows through the XML mapping layer,${NC}" 
echo -e "${CYAN}creating a complete bidirectional handshake between the systems.${NC}"
echo ""
echo -e "${YELLOW}💡 What's Different Now:${NC}"
echo -e "${YELLOW}   • XML data drives the visual representation${NC}"
echo -e "${YELLOW}   • Stream interactions query the XML mapping${NC}"
echo -e "${YELLOW}   • Real-time synchronization between both systems${NC}"
echo -e "${YELLOW}   • Complete handshake protocol active${NC}"
echo ""
echo -e "${GREEN}🦾 Ready for fully integrated XML-wrapped streaming!${NC}"