# 🚀 Document Generator MVP - Complete System

Transform any document into a working MVP in under 30 minutes using AI-powered code generation, template matching, and automated deployment.

## 🌟 What's New

### 🪢 Music Knot Framework
- **Mathematical Music**: Skills and interactions generate music through knot theory
- **Web Audio API**: Real-time synthesis and playback
- **Knot Transformations**: Reidemeister moves create musical transitions

### 🌐 SoulFra Universal Auth
- **Unified Login**: All social providers wrapped into one interface
- **Cal Cookie Monster**: Earns cookies for facilitating successful logins
- **GitHub Primary**: GitHub serves as both hosting AND admin interface

### ☎️ Dialog Phone Mirror Game
- **Split Screen**: First-person hands view + mirror reflection
- **Interactive Story**: Phone calls create knot patterns through dialog choices
- **Creative Tools**: Draw knots, export to Inkscape, save to Obsidian

## 🎯 Quick Start

```bash
# Clone the repository
git clone https://github.com/Soulfra/document-generator-mvp.git
cd document-generator-mvp

# Install dependencies
npm install

# Start everything (auth server + main app)
npm run start-all

# Or run in demo mode
npm run demo
```

## 🏗️ Core Components

### Main Interface (`index.html`)
- Document upload and processing
- Feature grid with all available tools
- Real-time WebSocket updates
- Cal character integration

### Professional Portfolio (`professional-portfolio.html`)
- LinkedIn-ready professional interface
- Music Knot skill demonstrations
- Admin dashboard for content management
- Client review system

### SoulFra Auth System (`soulfra-auth-server.js`)
- Express server on port 3001
- OAuth providers: GitHub, LinkedIn, Google
- Cal Cookie Monster rewards
- Session management

### Music Knot Framework (`music-knot-web.js`)
- Knot theory → music mapping
- Real-time audio synthesis
- Skill-based music generation
- Visual knot representations

### Dialog Game Interface (`dialog-game-interface.html`)
- Phone/mirror split-screen view
- Dialog tree navigation
- Drawing canvas integration
- Export to creative tools

## 🔧 Configuration

### Environment Variables (.env)
```bash
# Auth providers
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_secret
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_secret

# Database
DATABASE_URL=postgresql://localhost:5432/portfolio

# Ports
PORT=8080
AUTH_PORT=3001
```

### Available Scripts
- `npm run auth-server` - Start SoulFra auth server
- `npm run start` - Start main application
- `npm run start-all` - Start everything
- `npm run build` - Build for production
- `npm run demo` - Demo mode with static server

## 📋 Features

### ✅ Completed
- [x] Professional portfolio reskin
- [x] SoulFra universal auth wrapper
- [x] Cal Cookie Monster integration
- [x] Music Knot Framework (Web Audio)
- [x] Dialog phone mirror game
- [x] Creative tools (draw, export, save)
- [x] GitHub-powered admin system
- [x] LinkedIn profile sync
- [x] Build system for all file types

### 🚧 In Progress
- [ ] OAuth provider configuration
- [ ] Cal character animations
- [ ] Advanced knot visualizations

## 🎮 How to Play Dialog Game

1. Click "Dialog Phone Mirror" from main interface
2. Answer the ringing phone by clicking 📞
3. Make dialog choices to create knot patterns
4. Use creative tools:
   - ✏️ **Pen**: Draw knots directly
   - 🎨 **Inkscape**: Export as SVG
   - 📝 **Obsidian**: Save session notes
   - 📷 **Camera**: Capture physical drawings

## 🎵 Music Knot Patterns

Each skill maps to a unique knot type and musical mode:
- **JavaScript** → Trefoil knot (Lydian mode)
- **Python** → Figure-eight knot (Dorian mode)
- **React** → Square knot (Major mode)
- **Node.js** → Granny knot (Minor mode)
- **AI/ML** → Torus knot (Phrygian mode)

## 🐛 Troubleshooting

### Auth Server Issues
```bash
# Check if port 3001 is available
lsof -i :3001

# Run auth server directly
node soulfra-auth-server.js
```

### Audio Not Playing
- Click anywhere on the page to enable audio context
- Check browser permissions for audio playback
- Ensure Web Audio API is supported

### Drawing Canvas Not Appearing
- Enable drawing mode with pen tool (✏️)
- Check browser permissions for canvas access
- Try refreshing the page

## 📚 Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│  Auth Server    │────▶│  Music Knot     │
│  (Portfolio)    │     │  (Port 3001)    │     │  (Web Audio)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                       │
         └───────────────────────┴───────────────────────┘
                                 │
                        ┌─────────────────┐
                        │  Cal Cookie     │
                        │   Monster 🍪    │
                        └─────────────────┘
```

## 🔗 Links

- **Live Demo**: https://soulfra.github.io/document-generator-mvp
- **Documentation**: See `/docs` folder
- **Issues**: https://github.com/Soulfra/document-generator-mvp/issues

## 📄 License

MIT License - See LICENSE file

## 🙏 Credits

- Music Knot Framework inspired by mathematical knot theory
- Cal Cookie Monster concept from the original vision
- Dialog game mechanics inspired by interactive fiction
- Built with ❤️ by the Document Generator team

---

**Remember**: The goal is to make MVP creation as simple as uploading a document. Every decision should reduce friction and time-to-MVP.

*Last Updated: 2025-06-29*