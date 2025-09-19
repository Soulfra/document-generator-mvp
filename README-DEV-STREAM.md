# 🎬 Dev Stream Twitch Bot & RSS System

A comprehensive development streaming system that integrates git commits, Twitch chat, RSS feeds, and OBS overlays for an interactive coding experience.

## 🎆 Features

### Git Integration
- 🔍 Real-time commit monitoring
- 🌿 Branch change detection
- 📊 Commit statistics and diffs
- 📡 Automatic RSS feed generation

### Twitch Bot
- 🤖 Interactive chat commands
- 🎯 Commit announcements
- 📋 TODO tracking
- 📚 Code explanations
- 💧 Hydration reminders
- 🧜 Stretch reminders

### RSS/Atom/JSON Feeds
- 📡 Multiple feed formats
- 🔄 Auto-generation on commits
- 🎨 Rich content formatting
- 📤 Cross-platform distribution

### OBS Overlays
- 🖥️ Live commit notifications
- 📈 Real-time statistics
- 🎨 Customizable styling
- 🔌 WebSocket updates

### Cross-Platform Integration
- 💬 Discord webhooks
- 📢 Slack notifications
- 🌐 Web dashboard
- 📡 API endpoints

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install tmi.js express ws chokidar xmlbuilder2 axios
```

### 2. Configure Environment
```bash
cp .env.devstream.example .env
# Edit .env with your settings
```

### 3. Launch the System
```bash
# Make the script executable
chmod +x start-dev-stream.sh

# Start with default settings
./start-dev-stream.sh

# Or specify project name and path
./start-dev-stream.sh "My Cool Project" /path/to/repo
```

## 🔧 Configuration

### Required Environment Variables
```env
# Twitch Bot (for Twitch integration)
TWITCH_CHANNEL=yourchannel
TWITCH_BOT_USERNAME=YourBot
TWITCH_OAUTH=oauth:token

# RSS Feed Info
RSS_AUTHOR=Your Name
RSS_EMAIL=you@example.com
RSS_SITE_URL=https://yoursite.com
```

### Optional Integrations
```env
# Discord/Slack Webhooks
DISCORD_WEBHOOK=https://discord.com/api/webhooks/...
SLACK_WEBHOOK=https://hooks.slack.com/services/...
```

## 🤖 Twitch Bot Commands

| Command | Description | Example |
|---------|-------------|----------|
| `!help` | Show available commands | `!help` |
| `!project` | Display current project info | `!project` |
| `!commit` | Show latest commit | `!commit` |
| `!commits` | Show recent commits | `!commits 5` |
| `!progress` | Session statistics | `!progress` |
| `!todo` | Current TODO list | `!todo` |
| `!explain` | Explain recent code changes | `!explain` |
| `!build` | Build status | `!build` |
| `!stats` | Detailed session stats | `!stats` |
| `!tech` | Tech stack info | `!tech` |
| `!learn` | Learning resources | `!learn` |
| `!github` | GitHub repository link | `!github` |
| `!vscode` | VS Code tips | `!vscode` |
| `!theme` | Popular VS Code themes | `!theme` |
| `!music` | Coding music suggestions | `!music` |
| `!hydrate` | Hydration reminder | `!hydrate` |
| `!stretch` | Stretch reminder | `!stretch` |

## 🌐 Web Dashboard

Access the dashboard at: `http://localhost:8890`

### Dashboard Features
- Real-time session statistics
- Recent event timeline
- Manual controls
- RSS feed links
- OBS overlay URLs

## 🖥️ OBS Integration

### Adding Overlays
1. In OBS, add a **Browser Source**
2. Set the URL to one of:
   - Commit overlay: `http://localhost:8890/overlay/commit`
   - Stats overlay: `http://localhost:8890/overlay/stats`
3. Set dimensions:
   - Commit: 800x300
   - Stats: 300x150
4. Check "Shutdown source when not visible"

## 📡 RSS Feeds

Feeds are automatically generated at:
- RSS 2.0: `http://localhost:8890/feeds/devlog.xml`
- Atom 1.0: `http://localhost:8890/feeds/devlog.atom`
- JSON Feed: `http://localhost:8890/feeds/devlog.json`

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/status` | GET | System status |
| `/api/events` | GET | Recent events |
| `/api/stats` | GET | Session statistics |
| `/api/announce` | POST | Send announcement |

## 🎨 Customization

### Modify Overlay Styles
Edit the overlay HTML generation in `dev-stream-orchestrator.js`:
- `generateCommitOverlay()` - Commit notification style
- `generateStatsOverlay()` - Statistics display style

### Add Custom Commands
Extend the Twitch bot in `twitch-dev-bot.js`:
```javascript
this.commands['!mycommand'] = this.cmdMyCommand.bind(this);

async cmdMyCommand(channel, tags, args) {
    this.say('My custom response!');
}
```

### Custom RSS Templates
Add new templates in `devlog-rss-generator.js`:
```javascript
this.templates.myevent = this.myEventTemplate.bind(this);

async myEventTemplate(data) {
    return {
        title: `My Event: ${data.name}`,
        description: `<p>${data.details}</p>`,
        categories: ['custom']
    };
}
```

## 🔍 Troubleshooting

### Twitch Bot Not Connecting
1. Verify OAuth token is correct (get from https://twitchapps.com/tmi/)
2. Check channel name (lowercase, no #)
3. Ensure bot account has access to channel

### Git Commits Not Detected
1. Ensure you're in a git repository
2. Check file permissions on .git directory
3. Verify branch name matches configuration

### RSS Feeds Not Generating
1. Check `feeds/` directory exists and is writable
2. Look for errors in console output
3. Manually trigger generation from dashboard

## 📝 Example Workflow

1. **Start streaming**
   ```bash
   ./start-dev-stream.sh "Building Todo App"
   ```

2. **Add OBS overlays**
   - Add commit overlay to show new commits
   - Add stats overlay for productivity tracking

3. **Code and commit**
   ```bash
   git add .
   git commit -m "feat: Add user authentication"
   ```

4. **Bot announces in chat**
   > 🎯 NEW COMMIT: "feat: Add user authentication" [3 files, +45/-12]

5. **Viewers interact**
   - Viewer: `!explain`
   - Bot: `💡 Last change: added auth.js - This JavaScript file handles the logic`

6. **RSS feeds update automatically**
   - New commit appears in RSS readers
   - Discord/Slack get notified

## 📦 Architecture

```
┌───────────────────────┐
│ Dev Stream Orchestrator │
└────────┬──────────────┘
         │
    ┌────┼───────────────────────┐
    │                             │
┌───┴─────┐  ┌────────────┐  ┌───┴─────────┐
│ Git      │  │ Twitch Bot │  │ RSS Generator│
│ Monitor  │  │            │  │              │
└─────────┘  └────────────┘  └─────────────┘
     │              │                  │
     └─────────────┼──────────────────┘
                    │
              ┌─────┴──────┐
              │ Web Server  │
              │ & WebSocket │
              └─────────────┘
                    │
       ┌────────────┼────────────┐  
       │            │            │
  ┌────┴────┐  ┌───┴───┐  ┌────┴───┐
  │Dashboard│  │Overlays│  │Webhooks│
  └─────────┘  └────────┘  └────────┘
```

## 📝 License

MIT License - Feel free to use and modify!

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 💙 Credits

Built with love for the dev streaming community!