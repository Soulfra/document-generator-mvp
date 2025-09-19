# CLAUDE.deathtodata.md - Deathtodata Search Engine Memory

This file provides context and memory for Claude about the deathtodata search engine system.

## 🎯 Core Concept

Deathtodata is a search engine where:
- **Every search becomes a boss battle** with raid mechanics
- **Crawlers/centipedes ARE the users** - they have agency and participate
- **Movement from center** - character stays in center, world moves
- **BPM = risk/reward/death chance** - like Infernal Cape mechanics
- **Compression/decompression** throughout the system

## 🔧 System Architecture

### Core Components
1. **deathtodata-search-boss-connector.js** - Main orchestrator (port 3456)
2. **deathtodata-bpm-risk-reward.js** - BPM system (port 7777)  
3. **deathtodata-character-forums.js** - Character forums (port 5001)
4. **deathtodata-unified-search-raid.html** - 3D interface
5. **deathtodata-service-registry.js** - Service discovery/health

### Integration Points
- **boss-figurine-pipeline.js** - Raid mechanics (upload→voxelize→spawn→attack)
- **npc-gaming-layer.js** - Crawler/centipede management
- **emoji-color-code-transformer.js** - Query encoding for speed
- **matrix-phpbb-control-panel.js** - Forum integration

## 🎮 Raid Mechanics

### Search Process (5 phases like Chambers of Xeric):
1. **Reconnaissance** - Initial search analysis
2. **Torrent Layer** - Deep web crawl  
3. **Wormhole Analysis** - Link analysis
4. **Anomaly Detection** - Pattern finding
5. **AI Collaboration** - Get AI insights

### BPM System:
- **60-80 BPM**: Safe Zone (1x risk/reward)
- **81-120 BPM**: Moderate Risk (1.5x risk/reward)
- **121-160 BPM**: Danger Zone (2x risk/reward)
- **161-180 BPM**: Extreme Risk (2.5x risk/reward)
- **181-200 BPM**: Infernal Mode (3x risk/reward, high death chance)

## 🔧 Port Assignments (Fixed Conflicts)

- **3456**: Main search engine
- **5001**: Character forums (was 5000, conflicted with Matrix phpBB)
- **7777**: BPM system
- **8889**: NPC layer (was 8888, conflicted with Crypto Vault)
- **9998**: Service registry API

## 🚀 Usage

### Launch System:
```bash
./launch-deathtodata-unified.sh
```

### Search Interface:
Open `deathtodata-unified-search-raid.html` for 3D character-centered interface

### Monitor Services:
- Service registry: http://localhost:9998
- Main discovery: http://localhost:9999
- Forums: http://localhost:5001

## 🧠 Key Insights

1. **Crawlers have agency** - they're not just tools, they ARE the users
2. **Everything is a game** - search, forums, documentation, even service discovery
3. **Character-centered view** - world moves around character, not vice versa
4. **Speed = risk = reward** - faster operations mean higher stakes
5. **Raid patterns everywhere** - applies to search, games, economics, documentation

## 📚 Documentation

All components are marked complete and have auto-generated documentation in:
- `docs/generated/deathtodata/components/` - Component docs
- `docs/generated/deathtodata/apis/` - API documentation  
- `docs/generated/deathtodata/reasoning/` - Implementation reasoning

## 🔍 Service Discovery

Registered with existing service discovery systems:
- SERVICE-DISCOVERY-ENGINE.js
- unified-service-registry.js
- COMPONENT-DISCOVERY-ENGINE.js
- SYSTEM-INDEX-MAPPER.js

All deathtodata components are discoverable and health-monitored.

---
*This memory file helps Claude understand the deathtodata system architecture and patterns.*
*Last updated: 2025-08-11T14:07:21.031Z*
