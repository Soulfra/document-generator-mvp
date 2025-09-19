#!/bin/bash

# 🛡️ TOR BRIDGE SAFE INITIALIZATION SCRIPT 🛡️
# Ensures all directories exist with sound feedback
# Prevents ENOENT errors by creating structure first

echo "🎹 Tor Bridge Safe Initialization"
echo "================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Not in Document-Generator root directory${NC}"
    echo "Please run from: /Users/matthewmauer/Desktop/Document-Generator/"
    exit 1
fi

echo -e "${YELLOW}📁 Step 1: Creating directory structure with touch feedback...${NC}"
node tor-bridge-touch-sound-system.js init

echo -e "\n${YELLOW}🎵 Step 2: Testing sound feedback system...${NC}"
echo "You should hear different tones for each operation:"
node tor-bridge-touch-sound-system.js test-sounds

echo -e "\n${YELLOW}📝 Step 3: Creating essential files...${NC}"

# Create essential files with touch command
FILES_TO_CREATE=(
    "tor-bridge/configs/tor-bridge.conf"
    "tor-bridge/configs/dns-resolver.conf"
    "tor-bridge/configs/proxy-settings.json"
    "tor-bridge/logs/initialization.log"
    "tor-bridge/checkpoints/.gitkeep"
    "tor-bridge/backups/.gitkeep"
    "tor-bridge/translations/.gitkeep"
    "tor-bridge/sounds/.gitkeep"
)

for file in "${FILES_TO_CREATE[@]}"; do
    echo -e "${GREEN}✋ Touching: $file${NC}"
    node tor-bridge-touch-sound-system.js touch "$file" "# Created by safe-init"
done

echo -e "\n${YELLOW}🔒 Step 4: Setting permissions...${NC}"

# Set executable permissions for scripts
EXECUTABLE_FILES=(
    "tor-bridge-backup-manifest.js"
    "tor-bridge-touch-sound-system.js"
    "tor-bridge-piano-key-mapper.js"
)

for file in "${EXECUTABLE_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}🔒 chmod +x: $file${NC}"
        chmod +x "$file"
        node tor-bridge-touch-sound-system.js chmod "$file" 755
    fi
done

echo -e "\n${YELLOW}🔍 Step 5: Verifying structure...${NC}"

# Verify all directories exist
REQUIRED_DIRS=(
    "tor-bridge"
    "tor-bridge/checkpoints"
    "tor-bridge/backups"
    "tor-bridge/logs"
    "tor-bridge/sounds"
    "tor-bridge/translations"
    "tor-bridge/configs"
)

ALL_GOOD=true
for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✅ $dir/${NC}"
    else
        echo -e "${RED}❌ Missing: $dir${NC}"
        ALL_GOOD=false
    fi
done

echo -e "\n${YELLOW}🎹 Step 6: Creating piano key mapping visualization...${NC}"

# Create a simple HTML file showing the piano mapping
cat > tor-bridge/piano-key-map.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Tor Bridge Piano Key Map</title>
    <style>
        body { font-family: monospace; background: #1a1a1a; color: #fff; padding: 20px; }
        .key { display: inline-block; margin: 2px; padding: 5px 10px; border: 1px solid #444; }
        .white-key { background: #fff; color: #000; }
        .black-key { background: #000; color: #fff; }
        .operation { margin: 10px 0; padding: 10px; background: #2a2a2a; }
        .key-label { font-size: 12px; }
        h2 { color: #4CAF50; }
    </style>
</head>
<body>
    <h1>🎹 Tor Bridge Piano Key Mapping</h1>
    <p>Each network operation has a unique piano key sound!</p>
    
    <h2>Network Layer (Octave 2)</h2>
    <div class="operation">
        <span class="key white-key">C2</span> DNS Query<br>
        <span class="key white-key">D2</span> DNS Resolve<br>
        <span class="key white-key">E2</span> DNS-over-HTTPS<br>
        <span class="key white-key">F2</span> DNS Leak Check
    </div>
    
    <h2>Tor Operations (Octave 3)</h2>
    <div class="operation">
        <span class="key white-key">C3</span> Tor Start<br>
        <span class="key white-key">E3</span> Tor Connect<br>
        <span class="key white-key">G3</span> Circuit Build<br>
        <span class="key white-key">C4</span><span class="key white-key">E4</span><span class="key white-key">G4</span> Circuit Ready (Chord)
    </div>
    
    <h2>Security (Black Keys)</h2>
    <div class="operation">
        <span class="key black-key">C#4</span> XSS Detected<br>
        <span class="key black-key">D#4</span> XSS Blocked<br>
        <span class="key black-key">F#4</span> SSL Verify<br>
        <span class="key black-key">G#4</span> Cert Pinning
    </div>
    
    <h2>Success Chords</h2>
    <div class="operation">
        <span class="key white-key">C4</span><span class="key white-key">E4</span><span class="key white-key">G4</span><span class="key white-key">C5</span> Full Connection!<br>
        <span class="key white-key">F3</span><span class="key white-key">A3</span><span class="key white-key">C4</span><span class="key white-key">F4</span> Secure Tunnel<br>
        <span class="key white-key">G3</span><span class="key white-key">B3</span><span class="key white-key">D4</span><span class="key white-key">G4</span> Bridge Ready!
    </div>
</body>
</html>
EOF

echo -e "${GREEN}✅ Created piano key visualization at: tor-bridge/piano-key-map.html${NC}"

# Final status
echo -e "\n${YELLOW}📊 Initialization Summary:${NC}"
if [ "$ALL_GOOD" = true ]; then
    echo -e "${GREEN}✅ All directories created successfully!${NC}"
    echo -e "${GREEN}✅ Touch/sound system ready!${NC}"
    echo -e "${GREEN}✅ Piano key mapping complete!${NC}"
    echo -e "\n${GREEN}🎉 Tor Bridge safe initialization complete!${NC}"
    echo -e "\nYou can now proceed without ENOENT errors."
else
    echo -e "${RED}❌ Some directories are missing. Please check and re-run.${NC}"
    exit 1
fi

echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Run: node tor-bridge-backup-manifest.js"
echo "2. Set up dynamic ports with: node tor-bridge-port-allocator.js"
echo "3. Test connections with: node tor-bridge-connection-tester.js"
echo ""
echo "Each operation will have unique sound feedback! 🎹"