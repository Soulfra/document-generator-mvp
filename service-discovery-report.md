
# Document Generator Service Discovery Report

**Generated**: 9/15/2025, 12:13:35 PM

## 🚀 Services Overview

### Detected Services: 11
- **.env.ai-services** (ai-service) - Ports: [3000, 11434, 11434]
- **.env.bridge.example** (integration-gateway) - Ports: [9997, 9995, 9999, 9998, 9994]
- **server.js** (template-processor) - Ports: [3000, 3001, 3001, 3001, 3001, 3001, 3001, 3001, 3001, 3001, 3001, 3001, 3001, 3001, 3001, 3001, 3001, 3001, 3001, 3001]
- **ai-api-client.js** (ai-service) - Ports: []
- **ai-api.js** (ai-service) - Ports: [3001, 9999]
- **api-scraper-system.js** (api-service) - Ports: [3013, 3010, 3005, 3012]
- **Dockerfile.ai-api** (ai-service) - Ports: [3001]
- **bridge.log** (integration-gateway) - Ports: [8080, 8081, 5555, 8080, 8080, 8081, 5555]
- **docker-compose.ai-api.yml** (ai-service) - Ports: [3001, 3001, 11434, 3001, 11434, 5432, 6379, 8889, 8889]
- **brand-consultation-api.js** (api-service) - Ports: [3000]
- **mvp-generation-api.js** (api-service) - Ports: [3000]

### Port Status
- Port 3000: **CLOSED** (MCP Template Processor)
- Port 3001: **CLOSED** (AI API Service)
- Port 3002: **OPEN** (Analytics Service)
- Port 3003: **OPEN** (Unknown Service (Port 3003))
- Port 4000: **CLOSED** (Unified Bridge API)
- Port 4001: **CLOSED** (Unified Bridge WebSocket)
- Port 3004: **CLOSED** (Unknown Service (Port 3004))
- Port 4002: **CLOSED** (Unknown Service (Port 4002))
- Port 5432: **OPEN** (PostgreSQL)
- Port 5000: **OPEN** (Flask Backend)
- Port 6379: **CLOSED** (Redis)
- Port 8080: **CLOSED** (Platform Hub)
- Port 8090: **CLOSED** (Character Movement)
- Port 8091: **CLOSED** (Widget Integration)
- Port 8081: **CLOSED** (Unknown Service (Port 8081))
- Port 9000: **CLOSED** (MinIO Storage)
- Port 9001: **CLOSED** (MinIO Console)
- Port 9706: **CLOSED** (Unknown Service (Port 9706))
- Port 9998: **CLOSED** (Unknown Service (Port 9998))
- Port 9800: **CLOSED** (Unknown Service (Port 9800))
- Port 9999: **CLOSED** (Unknown Service (Port 9999))
- Port 11434: **CLOSED** (Ollama Local AI)

### Running Processes: 9
- /bin/zsh -c -l source /Users/matthewmauer/.claude/shell-snapshots/snapshot-zsh-1757451337535-9r2p7n.sh && eval 'node quick-service-discovery.js' \< /dev/null && pwd -P >| /var/folders/1b/0kss4v7j58b89zqv0f533py40000gn/T/claude-c168-cwd (node)
- /Users/matthewmauer/.nvm/versions/node/v18.20.8/bin/node --require /Users/matthewmauer/Desktop/Document-Generator/proptech-vc-demo/node_modules/tsx/dist/preflight.cjs --import file:///Users/matthewmauer/Desktop/Document-Generator/proptech-vc-demo/node_modules/tsx/dist/loader.mjs src/server.ts (node)
- node quick-service-discovery.js (node)
- node test-json-bus.js (node)
- node /Users/matthewmauer/Desktop/Document-Generator/proptech-vc-demo/node_modules/.bin/tsx watch src/server.ts (node)

## 📁 Configuration Files

- **package.json** - npm-config (2.4KB)
- **docker-compose.yml** - docker-config (32.9KB)
- **.env** - environment (1.3KB)
- **.env.example** - environment (11.6KB)
- **README.md** - documentation (6.0KB)
- **index.js** - javascript (11.9KB)
- **server.js** - javascript (27.8KB)

## 📚 Key Documents

- **5WH-INTEGRATION-README.md** in /. (10.3KB)
- **AI-ORCHESTRATION-PERSONALIZATION-README.md** in /. (8.1KB)
- **AI-REASONING-GAME-README.md** in /. (4.6KB)
- **README.md** in /mcp (10.2KB)
- **DOT-COLLAR-SYSTEM-README.md** in /FinishThisIdea (7.3KB)
- **DYNAMIC-MENU-README.md** in /FinishThisIdea (5.3KB)
- **README-DESKTOP.md** in /FinishThisIdea (1.8KB)
- **README.md** in /FinishThisIdea-Complete (17.3KB)

## ⚠️ Issues Found



## 💡 Recommendations

- **start-services**: Found 11 potential services. Consider starting core services.
  Action: Run docker-compose up -d or start individual services

- **organize-docs**: Found 8 documentation files that could be organized
  Action: Create a documentation index and cleanup scattered README files

---
*Quick discovery completed in seconds instead of hours!*
