# 🚀 FLASHPAD BROWSER QUICK START GUIDE

## 🎯 What is FlashPad Browser?

FlashPad Browser is a stealth work environment disguised as an old Flash game that functions as a complete browser/OS with:
- Unified login system across all websites
- Tor integration for privacy
- Workplace monitoring evasion
- ThinkPad/Lenovo-style interface
- Yellow-themed behavioral analysis

## 📋 Prerequisites

Before running the setup, ensure you have:
- Node.js v18+ installed
- Docker and Docker Compose installed
- Git installed
- At least 2GB of free disk space

## 🔧 Quick Setup

### Option 1: Automatic Setup (Recommended)
```bash
# Run the setup script
./setup-flashpad-browser.sh

# Navigate to the created directory
cd flashpad-browser

# Start the browser
npm start
```

### Option 2: Manual Setup
```bash
# Create directory
mkdir flashpad-browser
cd flashpad-browser

# Copy components manually
cp ../AUTH-FOUNDATION-SYSTEM.js src/auth/
cp ../AMERICAN-HACKER-BOOT-SEQUENCE-FIXED.html public/boot.html
cp ../FLASHPAD-BROWSER-VISUAL-MOCKUP.html public/index.html

# Install dependencies
npm install

# Setup database
node scripts/setup-database.js

# Start services
npm start
```

## 🎮 Using FlashPad Browser

### Access Points
- **Boot Sequence**: http://localhost:3000
- **FlashPad Game**: http://localhost:3000/flashpad
- **Auth System**: http://localhost:8888
- **Dashboard**: http://localhost:8888/dashboard

### Default Credentials
- Username: `matthewmauer`
- Password: `dashboard123`

### Keyboard Shortcuts
- `Ctrl+Shift+B` - Toggle browser mode (reveal hidden browser)
- `Ctrl+Shift+M` - Toggle navigation menu
- `Escape` - Hide all overlays
- `F` - Trigger fireworks (in boot sequence)
- `A` - Play anthem (in boot sequence)

## 🏗️ Architecture

```
FlashPad Browser
├── Boot Sequence (AMERICAN-HACKER-BOOT-SEQUENCE)
│   └── Stages: White → Black → Purple → Hacker
├── Auth System (AUTH-FOUNDATION-SYSTEM)
│   ├── JWT Authentication
│   ├── SQLite Database
│   └── WebSocket (8889)
├── Flash Game Interface
│   ├── Stealth workplace monitoring
│   └── Memory games with AI
├── Hidden Browser
│   ├── Tor integration
│   ├── Unified login
│   └── Multi-site access
└── Visual Effects
    ├── Rainbow gradients
    ├── Yellow indicators (HOLLOWTOWN)
    └── Animations (pulse, glow, shake)
```

## 🔌 Connected Systems

The browser connects to these boards/systems:
1. **Tycoon Board** (7090) - Business simulation
2. **Gacha Board** (7300) - Token rewards system
3. **Debug Game** (8500) - Development tools
4. **Knowledge Graph** (9700) - Learning system
5. **Massive Graph** (9800) - 459-tier architecture
6. **BlameChain** (6600) - Accountability blockchain

## 🛠️ Development

### Running in Development Mode
```bash
cd flashpad-browser
npm run dev  # Uses nodemon for auto-reload
```

### Running with Electron
```bash
cd flashpad-browser
npm run electron  # Opens as desktop app
```

### Running with Docker
```bash
cd flashpad-browser
docker-compose up -d  # Runs all services
```

## 📊 Monitoring

### Check System Status
```bash
curl http://localhost:3000/api/status
```

### View Auth System Logs
```bash
tail -f flashpad-browser/auth-foundation.log
```

### Monitor WebSocket Activity
Connect to `ws://localhost:8889` to see real-time updates

## 🎨 Customization

### Change Theme Colors
Edit `flashpad-browser/public/css/theme.css`:
```css
:root {
  --primary-color: #00ff41;    /* Green */
  --secondary-color: #ffdd00;  /* Yellow */
  --accent-color: #8a2be2;     /* Purple */
}
```

### Add New Games
Place game files in `flashpad-browser/src/games/` and register in main.js

### Modify Boot Sequence
Edit `flashpad-browser/public/boot.html` to customize startup

## 🐛 Troubleshooting

### Auth System Won't Start
```bash
# Check if port 8888 is in use
lsof -i :8888

# Kill existing process if needed
kill -9 <PID>
```

### Database Errors
```bash
# Reset database
rm flashpad-browser/databases/*.db
node flashpad-browser/scripts/setup-database.js
```

### Tor Connection Issues
```bash
# Check Tor status
curl --socks5 localhost:9050 https://check.torproject.org/api/ip
```

## 🔒 Security Notes

1. **Stealth Mode**: The Flash game interface hides the browser functionality
2. **Tor Integration**: All browser traffic can be routed through Tor
3. **Unified Auth**: Single login for all connected systems
4. **Behavioral Monitoring**: HOLLOWTOWN yellowbook spec for AI analysis

## 📚 Further Documentation

- [Integration Map](./FLASHPAD-BROWSER-INTEGRATION-MAP.md)
- [Visual Mockup](./FLASHPAD-BROWSER-VISUAL-MOCKUP.html)
- [XML Schema Connections](./XML-SCHEMA-CONNECTION-MAP.md)
- [Build From Scratch Guide](./BUILD-FROM-SCRATCH-README.md)

## 🎯 Next Steps

1. Run the setup script
2. Start the browser
3. Access the boot sequence
4. Login with default credentials
5. Explore the Flash game interface
6. Use keyboard shortcuts to reveal hidden features

## 💡 Tips

- Keep the Flash game visible when others are around
- Use Ctrl+Shift+B to quickly toggle browser mode
- The yellow indicator shows when behavioral monitoring is active
- All your work is saved across sessions
- Connect additional services using the port mappings

---

**Remember**: This is a stealth work environment. To others, it looks like you're playing an old Flash game!