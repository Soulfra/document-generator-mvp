#!/bin/bash
# PORTABLE-GAMING-PACKAGE.sh - Create portable gaming system package

set -e

echo "🎮 CREATING PORTABLE GAMING PACKAGE"
echo "=================================="

# Package name and version
PACKAGE_NAME="LocalGamingServer"
VERSION="1.0.0"
BUILD_DATE=$(date +%Y%m%d-%H%M%S)
PACKAGE_DIR="portable-gaming-${BUILD_DATE}"

# Create package directory
mkdir -p "${PACKAGE_DIR}"
cd "${PACKAGE_DIR}"

echo "📦 Setting up package structure..."

# Create directory structure
mkdir -p {bin,lib,config,data,logs,games,certificates}

# Copy main server files
echo "📄 Copying server files..."
cp ../LOCAL-PC-GAMING-SERVER.js bin/
cp ../babylon-economic-engine.html games/
cp ../FinishThisIdea/voxel-shadow-wormhole-engine.js games/

# Create package.json for dependencies
cat > package.json << EOF
{
    "name": "local-gaming-server",
    "version": "${VERSION}",
    "description": "Portable Local Gaming Server with Biometric Authentication",
    "main": "bin/LOCAL-PC-GAMING-SERVER.js",
    "scripts": {
        "start": "node bin/LOCAL-PC-GAMING-SERVER.js",
        "install-deps": "npm install",
        "setup": "./setup.sh",
        "run-offline": "./run-offline.sh"
    },
    "dependencies": {
        "express": "^4.18.2",
        "ws": "^8.14.2",
        "crypto": "^1.0.1"
    },
    "engines": {
        "node": ">=16.0.0"
    },
    "keywords": ["gaming", "biometric", "local", "portable", "offline"],
    "author": "FinishThisIdea Gaming System",
    "license": "MIT"
}
EOF

# Create setup script
cat > setup.sh << 'EOF'
#!/bin/bash
# Setup script for portable gaming server

echo "🚀 SETTING UP PORTABLE GAMING SERVER"
echo "=================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Please install Node.js from: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16 or higher required"
    echo "Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create SSL certificates for local HTTPS
echo "🔐 Creating SSL certificates..."
mkdir -p certificates

# Generate self-signed certificate
openssl req -x509 -newkey rsa:2048 -keyout certificates/key.pem -out certificates/cert.pem -days 365 -nodes -subj "/C=US/ST=Local/L=Gaming/O=LocalGamingServer/CN=localhost" 2>/dev/null || echo "OpenSSL not available, using HTTP mode"

# Set permissions
chmod +x run-offline.sh
chmod +x bin/LOCAL-PC-GAMING-SERVER.js

# Create data directories
mkdir -p data/{users,games,biometrics,network}

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎮 To start the gaming server:"
echo "   ./run-offline.sh"
echo ""
echo "🌐 Dashboard will be available at:"
echo "   http://localhost:8900"
echo ""
echo "🔒 Features ready:"
echo "   - Biometric fingerprint authentication"
echo "   - Voice pattern verification"
echo "   - Network device discovery"
echo "   - Cable/wireless linking"
echo "   - Offline gaming"
EOF

# Create run script
cat > run-offline.sh << 'EOF'
#!/bin/bash
# Run portable gaming server in offline mode

echo "🎮 STARTING PORTABLE GAMING SERVER"
echo "================================"

# Check if setup was completed
if [ ! -f "node_modules/.package-lock.json" ] && [ ! -f "package-lock.json" ]; then
    echo "⚠️  Setup not completed. Running setup first..."
    ./setup.sh
fi

# Set environment for offline mode
export NODE_ENV=production
export OFFLINE_MODE=true
export BIOMETRIC_MODE=true
export SECURITY_LEVEL=MAXIMUM

# Display system information
echo "💻 System Information:"
echo "   Hostname: $(hostname)"
echo "   Platform: $(uname -s)"
echo "   Architecture: $(uname -m)"
echo "   Node.js: $(node -v 2>/dev/null || echo 'Not installed')"
echo "   Memory: $(free -h 2>/dev/null | grep Mem | awk '{print $2}' 2>/dev/null || echo 'Unknown')"
echo ""

# Check for network interfaces
echo "🌐 Network Interfaces:"
if command -v ip &> /dev/null; then
    ip addr show | grep "inet " | grep -v "127.0.0.1" | awk '{print "   " $2}' || echo "   No external interfaces"
elif command -v ifconfig &> /dev/null; then
    ifconfig | grep "inet " | grep -v "127.0.0.1" | awk '{print "   " $2}' || echo "   No external interfaces"
else
    echo "   Network tools not available"
fi
echo ""

# Start the gaming server
echo "🚀 Starting gaming server..."
echo "   Dashboard: http://localhost:8900"
echo "   WebSocket: ws://localhost:8901"
echo ""
echo "📱 Ready for demonstration:"
echo "   - Touch screen for fingerprint auth"
echo "   - Voice commands for verification"
echo "   - Cable linking to other devices"
echo "   - Fully offline operation"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start server with error handling
node bin/LOCAL-PC-GAMING-SERVER.js 2>&1 | tee logs/server-$(date +%Y%m%d-%H%M%S).log
EOF

# Create Windows batch file
cat > run-offline.bat << 'EOF'
@echo off
echo 🎮 STARTING PORTABLE GAMING SERVER
echo ================================

REM Check if Node.js is available
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

REM Set environment for offline mode
set NODE_ENV=production
set OFFLINE_MODE=true
set BIOMETRIC_MODE=true
set SECURITY_LEVEL=MAXIMUM

echo 💻 System Information:
echo    Hostname: %COMPUTERNAME%
echo    Platform: Windows
echo    Node.js: 
node --version

echo.
echo 🚀 Starting gaming server...
echo    Dashboard: http://localhost:8900
echo    WebSocket: ws://localhost:8901
echo.
echo 📱 Ready for demonstration:
echo    - Touch screen for fingerprint auth
echo    - Voice commands for verification
echo    - Cable linking to other devices
echo    - Fully offline operation
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start server
node bin/LOCAL-PC-GAMING-SERVER.js 2>&1 | tee logs/server-%date:~-4,4%%date:~-10,2%%date:~-7,2%-%time:~0,2%%time:~3,2%%time:~6,2%.log
EOF

# Create deployment guide
cat > DEPLOYMENT-GUIDE.md << 'EOF'
# 🎮 Portable Gaming Server - Deployment Guide

## 📦 Package Contents

- `bin/` - Server executables
- `games/` - Game files and engines
- `config/` - Configuration files
- `data/` - User data and game saves
- `logs/` - Server logs
- `certificates/` - SSL certificates
- `setup.sh` - Setup script (Linux/Mac)
- `run-offline.sh` - Start script (Linux/Mac)
- `run-offline.bat` - Start script (Windows)

## 🚀 Quick Start

### Linux/Mac:
```bash
chmod +x setup.sh run-offline.sh
./setup.sh
./run-offline.sh
```

### Windows:
```cmd
run-offline.bat
```

## 🔧 Hardware Requirements

### Minimum:
- CPU: Dual-core 1.5GHz
- RAM: 2GB
- Storage: 1GB free space
- Network: WiFi or Ethernet
- Input: Touch screen (for biometrics) or mouse/keyboard

### Recommended:
- CPU: Quad-core 2.0GHz+
- RAM: 4GB+
- Storage: 2GB+ free space
- GPU: Integrated graphics or better
- Network: Gigabit Ethernet for cable linking
- Input: Touch screen with fingerprint sensor

## 📱 Supported Devices

### Desktop Computers:
- Windows 10/11
- macOS 10.15+
- Linux (Ubuntu, Debian, CentOS, etc.)

### Single Board Computers:
- Raspberry Pi 4 (4GB+ RAM recommended)
- NVIDIA Jetson Nano
- Intel NUC
- BeagleBone Black

### Portable Devices:
- Tablets with Node.js support
- Chromebooks (Developer mode)
- Gaming handhelds (Steam Deck, etc.)

## 🔐 Biometric Setup

### Fingerprint Authentication:
1. Requires HTTPS or localhost
2. Uses WebAuthn API
3. Stores encrypted fingerprint hashes locally
4. No cloud dependencies

### Voice Verification:
1. Requires microphone access
2. Records 3-second voice samples
3. Creates voice pattern hash
4. Local processing only

## 🌐 Network Linking

### Cable Linking (Game Boy Style):
- Direct Ethernet connection between devices
- Automatic discovery and pairing
- Low latency gaming
- No internet required

### Wireless Linking:
- Local WiFi network discovery
- Device-to-device communication
- Automatic port scanning
- Secure token exchange

## 🎮 Available Games

1. **Voxel Wormhole Engine** (Port 8892)
   - 3D voxel worlds with shadow dimensions
   - Layer separation visualization
   - Interactive wormhole creation

2. **Economic Engine** (Port 8893)
   - Babylon.js 3D economic visualization
   - AI agent trading simulation
   - Real-time cost tracking

3. **AI Arena** (Port 3001)
   - AI fighter battles
   - Tournament system
   - Betting and economics

4. **Document Engine**
   - Transform documents into games
   - Template matching system
   - MVP generation

## 🔒 Security Features

- **Offline First**: No cloud dependencies
- **Local Authentication**: Biometric data never leaves device
- **Encrypted Storage**: All user data encrypted at rest
- **Secure Communication**: HTTPS/WSS for all connections
- **Zero Trust**: Every action requires authentication

## 📋 Demonstration Checklist

### Pre-Demo Setup:
- [ ] Device powered and connected
- [ ] Gaming server running
- [ ] Network adapter configured
- [ ] Touch screen calibrated
- [ ] Microphone tested

### Live Demo Steps:
1. **Show Offline Operation**
   - Display "OFFLINE SECURE" indicator
   - Show local-only networking

2. **Biometric Authentication**
   - Register fingerprint on touch screen
   - Demonstrate voice verification
   - Show secure token generation

3. **Game Launching**
   - Launch games with authenticated access
   - Show real-time 3D rendering
   - Demonstrate touch/voice controls

4. **Network Linking**
   - Scan for other gaming devices
   - Create cable or wireless link
   - Show multiplayer functionality

5. **Security Features**
   - Show encrypted data storage
   - Demonstrate session management
   - Display authentication logs

## 🛠️ Troubleshooting

### Server Won't Start:
- Check Node.js installation: `node --version`
- Verify ports 8900/8901 are available
- Check logs in `logs/` directory

### Biometric Auth Fails:
- Ensure HTTPS is enabled
- Check browser WebAuthn support
- Verify microphone permissions

### Network Discovery Issues:
- Check firewall settings
- Verify network connectivity
- Try different port ranges

### Performance Issues:
- Close unnecessary applications
- Increase available RAM
- Use wired network connection

## 📞 Support

For technical support or questions:
- Check logs in `logs/` directory
- Review error messages in console
- Test with minimal configuration

## 🔄 Updates

To update the gaming server:
1. Backup `data/` directory
2. Replace server files
3. Run `./setup.sh` again
4. Restart server

---

**Ready for portable gaming demonstrations anywhere!** 🎮
EOF

# Create README for the package
cat > README.md << 'EOF'
# 🎮 Portable Gaming Server

A fully offline, biometrically secured gaming platform that can run on any PC, tablet, or single-board computer.

## ⚡ Quick Start

```bash
./setup.sh     # One-time setup
./run-offline.sh   # Start gaming server
```

Visit: http://localhost:8900

## 🔥 Features

- 🔒 **Offline Security**: Biometric fingerprint + voice verification
- 🎮 **Multi-Game Platform**: Voxel worlds, AI battles, economic simulation
- 🔗 **Device Linking**: Cable and wireless connections (Game Boy style)
- 📱 **Touch Interface**: Optimized for tablets and touch screens
- 🚀 **Portable**: Runs anywhere Node.js is supported

## 🎯 Uses

- **Gaming Demonstrations**: In-person showcases with biometric security
- **Local Tournaments**: Link multiple devices for competitions
- **Offline Gaming**: No internet required after setup
- **Educational**: Learn game development and networking
- **Development**: Platform for building new games

## 🔐 Security

- All authentication happens locally
- Biometric data never leaves your device
- Encrypted local storage
- Zero cloud dependencies

Perfect for secure, portable gaming anywhere! 🚀
EOF

# Make scripts executable
chmod +x setup.sh run-offline.sh

# Create logs directory
mkdir -p logs

echo "✅ Package structure created"

# Create tarball for distribution
cd ..
tar -czf "${PACKAGE_DIR}.tar.gz" "${PACKAGE_DIR}"

echo ""
echo "🎉 PORTABLE GAMING PACKAGE CREATED!"
echo "================================="
echo "📦 Package: ${PACKAGE_DIR}.tar.gz"
echo "📁 Directory: ${PACKAGE_DIR}/"
echo ""
echo "🚀 To deploy on any PC:"
echo "   1. Extract: tar -xzf ${PACKAGE_DIR}.tar.gz"
echo "   2. Setup: cd ${PACKAGE_DIR} && ./setup.sh"
echo "   3. Run: ./run-offline.sh"
echo ""
echo "🔒 Features included:"
echo "   ✅ Biometric fingerprint authentication"
echo "   ✅ Voice pattern verification"
echo "   ✅ Offline-first architecture"
echo "   ✅ Cable linking (Game Boy style)"
echo "   ✅ Multi-game platform"
echo "   ✅ Touch screen optimized"
echo "   ✅ Portable demonstration ready"
echo ""
echo "📱 Perfect for in-person gaming demos!"
echo "   - Touch screen for biometric auth"
echo "   - Voice commands for verification"
echo "   - Cable or wireless device linking"
echo "   - Fully offline operation"
echo ""
echo "🎮 Ready to game anywhere!"