# 🚨 Simple Chaos Monitor - Quick Start

**Lightweight chaos monitoring without runtime overhead - Cloudflare ready!**

## 🚀 Instant Start

```bash
npm run simple-chaos
# Opens http://localhost:3338
```

## 📊 What You Get

- **Lightweight monitoring** - No heavy processing
- **Real-time status** - Updates every 3 seconds
- **External alerts** - Discord/Telegram webhooks
- **OBS integration** - Text files for streaming
- **Cloudflare ready** - Deploy as Worker

## 🎮 Quick Commands

```bash
# Start monitoring
npm run simple-chaos

# Increase chaos manually
npm run simple-bash

# Wake up Cal
npm run simple-wake

# Reset everything  
npm run simple-reset

# Check status
npm run simple-status
```

## 📱 Discord Alerts Setup

1. Create Discord webhook in your server
2. Add to `.env` file:
   ```
   WEBHOOK_URL="https://discord.com/api/webhooks/your_webhook_here"
   ```
3. Restart monitor - alerts sent when chaos > 50

## 📺 OBS Integration

### Simple Text Source
1. Add "Text (GDI+)" source in OBS
2. Check "Read from file" 
3. Point to: `chaos-status.txt`
4. Set refresh: 2 seconds

### Browser Source
1. Add "Browser" source
2. URL: `http://localhost:3338`
3. Size: 800x600

## 📄 Files Created

- `chaos-status.txt` - Simple text for OBS: "CHAOS: 50 | MEM: 120MB | CAL: awake"
- `chaos-data.json` - Full JSON data for tools
- `chaos-alert.json` - Latest alert info

## 🌐 Cloudflare Deployment

```bash
# Run setup first
./setup-external-alerts.sh

# Deploy to Cloudflare Workers
wrangler deploy cloudflare-worker.js
```

## 🔧 Runtime Optimizations

- **No heavy loops** - Simple 3-second intervals
- **Minimal memory** - <50MB typical usage  
- **File-based** - External tools read simple files
- **Webhook alerts** - External services handle notifications
- **Lightweight HTML** - Simple interface, no frameworks

## 🎯 Perfect For

- **Stream overlays** - OBS text sources
- **Discord bots** - Webhook alerts  
- **Telegram monitoring** - Bot notifications
- **Cloudflare Workers** - Edge deployment
- **CI/CD pipelines** - Status monitoring

## 💡 Advanced Usage

### Multiple Monitors
```bash
# Run on different ports
PORT=3339 npm run simple-chaos
PORT=3340 npm run simple-chaos
```

### Webhook Testing
```bash
node test-alerts.js
```

### Custom Thresholds
Edit `simple-chaos-monitor.js`:
```javascript
if (memUsage > 100) this.chaosLevel += 5;  // Memory threshold
if (this.chaosLevel > 50) this.sendAlert(); // Chaos threshold
```

## 🚨 Why This Solves Runtime Issues

✅ **Minimal processing** - No complex visualizations  
✅ **File-based output** - External tools handle heavy lifting  
✅ **Simple intervals** - 3-second checks vs continuous monitoring  
✅ **Webhook offloading** - Discord/Telegram handle alerts  
✅ **Static files** - OBS reads simple text files  
✅ **Worker ready** - Deploys to Cloudflare edge  

## 📡 Integration Examples

### Discord Alert
```
🚨 Chaos Alert: Chaos level: 75, Memory: 150.2MB
```

### OBS Text Display  
```
CHAOS: 75 | MEM: 150.2MB | CAL: awake
```

### Telegram Bot
```
🚨 System Alert
Chaos: 75
Memory: 150.2MB
Time: 14:30:25
```

---

**Simple, lightweight, and runtime-friendly! 🚀**

No more hitting limits - just pure monitoring efficiency.