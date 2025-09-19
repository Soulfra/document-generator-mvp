# 🪞📐 Origami System - Dual-Mirror Bot Detection

Complete dual-mirror origami system with real-time WebSocket broadcasting and harmonic bot detection.

## 🎯 System Overview

The Origami System processes data through dual observation channels (user-agent and admin-agent) that fold and unfold data like origami. Bot patterns lose harmonic coherence during folding, while natural human patterns preserve their harmonic signatures.

```
Data Input → Dual Mirrors → Origami Folding → Harmonic Analysis → Bot Detection → Real-time Broadcast
     ↓           ↓              ↓                 ↓                ↓                ↓
  Chat/Text   User Agent    Multi-fold        Pattern          Bot Score      WebSocket
  Messages    Admin Agent   Compression       Breakdown        0.0 - 1.0      Live Alerts
```

## 🚀 Quick Start

### 1. Launch Complete System
```bash
node launch-origami-system.js
```

This starts:
- WebSocket broadcaster (port 8081)
- Dual-mirror origami processor
- Harmonic bot detection
- Grand Exchange chat simulation

### 2. Open Live Monitor
Open `origami-websocket-client-demo.html` in your browser to see real-time:
- Bot detection alerts
- Origami folding states
- Harmonic analysis
- Grand Exchange chat monitoring

### 3. Connect Your Own Client
```javascript
const ws = new WebSocket('ws://localhost:8081');

// Subscribe to bot alerts
ws.send(JSON.stringify({
    type: 'subscribe',
    channels: ['bot:detected', 'origami:folded']
}));

// Join Grand Exchange monitoring room
ws.send(JSON.stringify({
    type: 'join:room', 
    room: 'grand_exchange'
}));

// Send data for analysis
ws.send(JSON.stringify({
    type: 'data:stream',
    data: {
        content: 'buy gold cheap click here now',
        source: 'chat'
    }
}));
```

## 📊 Core Components

### 1. Multi-Fold Bitmap Compressor (`multi-fold-bitmap-compressor.js`)
- Original origami folding system
- FOLD_2X, FOLD_4X compression levels
- HARMONIC, FINANCIAL, WAVE_MAX, AVERAGE fold patterns
- COBOL financial encoding

### 2. Dual-Mirror Origami Processor (`dual-mirror-origami-processor.js`)
- User Agent Mirror (HARMONIC folding, visual perspective)
- Admin Agent Mirror (FINANCIAL folding, security perspective)
- Cross-validation between mirrors
- Origami state tracking (fold/unfold operations)

### 3. Harmonic Pattern Bot Detector (`harmonic-pattern-bot-detector.js`)
- Harmonic signature analysis
- Pattern breakdown detection
- Bot probability calculation (0.0 - 1.0)
- Real-time learning and adaptation

### 4. WebSocket Broadcaster (`origami-websocket-broadcaster.js`)
- Real-time event broadcasting
- Client subscription management
- Room-based messaging
- Grand Exchange chat integration

### 5. Visual Monitor (`origami-websocket-client-demo.html`)
- Live bot detection dashboard
- Origami state visualization
- Statistics tracking
- Interactive controls

## 🤖 Bot Detection Logic

The system identifies bots through harmonic pattern degradation:

### Natural Human Patterns:
- ✅ Preserve harmonics during folding
- ✅ Natural variation in timing/content
- ✅ Emotional content indicators
- ✅ Organic flow patterns

### Bot Patterns:
- ❌ Harmonic breakdown during folding
- ❌ Excessive regularity/repetition
- ❌ Mechanical timing patterns
- ❌ Low entropy/information content

### Detection Thresholds:
- `< 0.4` - Natural (human-like)
- `0.4 - 0.7` - Suspicious (requires investigation)
- `> 0.7` - Bot (high confidence)

## 🎮 Grand Exchange Integration

The system monitors Grand Exchange chat and broadcasts detected patterns:

```javascript
// Detected bot in Grand Exchange
{
    type: 'game:bot_detected',
    player: 'GoldSeller123',
    message: 'cheap gold cheap gold visit website.com',
    probability: 0.89,
    reasons: ['excessive_repetition', 'artificial_regularity'],
    timestamp: 1641234567890
}
```

This enables real-time bot detection overlay in gaming interfaces.

## 📡 WebSocket API

### Subscription Channels:
- `bot:detected` - Bot detection alerts
- `origami:folded` - Origami state changes
- `origami:unfolded` - Unfolding operations
- `harmonic:analysis` - Harmonic pattern analysis
- `pattern:suspicious` - Suspicious pattern warnings
- `game:chat` - Game chat analysis

### Room Management:
- `grand_exchange` - OSRS Grand Exchange monitoring
- `custom_rooms` - User-defined monitoring spaces

### Message Types:
```javascript
// Subscribe to channels
{ type: 'subscribe', channels: ['bot:detected'] }

// Join monitoring room
{ type: 'join:room', room: 'grand_exchange' }

// Send data for analysis
{ type: 'data:stream', data: { content: 'text', source: 'chat' } }

// Authentication
{ type: 'authenticate', credentials: { token: 'xxx' } }
```

## 🔧 Configuration

### Origami Processor Config:
```javascript
const processor = new DualMirrorOrigamiProcessor({
    enableHarmonicAnalysis: true,
    enableBotDetection: true,
    foldingThreshold: 0.85,
    harmonicTolerance: 0.1
});
```

### Bot Detector Config:
```javascript
const detector = new HarmonicPatternBotDetector({
    botConfidenceThreshold: 0.8,
    enableRealTimeAlert: true,
    enableAdaptiveLearning: true
});
```

### WebSocket Broadcaster Config:
```javascript
const broadcaster = new OrigamiWebSocketBroadcaster({
    port: 8081,
    enableBotAlerts: true,
    enableGameIntegration: true,
    maxClients: 100
});
```

## 📈 Performance Stats

The system tracks:
- Connected clients
- Messages sent/received
- Data streams processed
- Bots detected
- Origami states tracked
- Memory usage
- Uptime

## 🔍 Example Use Cases

### 1. OSRS Bot Detection
Monitor Grand Exchange for gold sellers and spam bots with real-time alerts.

### 2. Chat Moderation
Detect automated spam in chat systems through harmonic pattern analysis.

### 3. Content Analysis
Identify AI-generated vs human-written content through folding degradation.

### 4. Security Monitoring
Cross-validate suspicious activities through dual-mirror observation.

## 🛠️ Development

### Adding Custom Fold Patterns:
```javascript
// In multi-fold-bitmap-compressor.js
const patterns = {
    'CUSTOM': [
        { level: 'FOLD_2X', customRule: true }
    ]
};
```

### Custom Bot Detection Rules:
```javascript
// In harmonic-pattern-bot-detector.js
if (harmonicFeatures.customMetric > threshold) {
    breakdown.unnatural_patterns.push('custom_pattern');
}
```

### New WebSocket Events:
```javascript
// In origami-websocket-broadcaster.js
this.broadcast({
    type: 'custom:event',
    data: customData
}, 'custom:subscription');
```

## 🎯 Future Enhancements

- Machine learning integration
- Additional folding algorithms
- Blockchain verification
- Mobile app integration
- API rate limiting
- Authentication system
- Data persistence
- Advanced visualization

---

**Key Insight**: The "origami" concept treats data transformation as folding paper - natural patterns maintain their structure, while artificial patterns break down when folded and unfolded. This creates a novel approach to bot detection through geometric data analysis.

**Usage**: `node launch-origami-system.js` → Open `origami-websocket-client-demo.html` → Watch live bot detection!