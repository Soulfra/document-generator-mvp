# Unified Port Mapping for Document Generator

## 🚨 Current Issues Identified

### Port Conflicts:
- **3000**: Template Processor (main) vs Template Processor (SAAS)
- **3001**: AI API (main) vs AI API (SAAS)  
- **3002**: Analytics (main) vs Analytics (SAAS)
- **8080**: Platform Hub (main) vs Platform Hub (SAAS)
- **5432, 6379, 9000**: Infrastructure conflicts

### Networking Issues:
- .env file uses `localhost:5432` but Docker containers need `postgres:5432`
- Same for Redis: `localhost:6379` → `redis:6379`
- Same for MinIO: `localhost:9000` → `minio:9000`

## 🎯 Unified Port Allocation

### Infrastructure Services (Common)
- **PostgreSQL**: 5432 (internal: postgres:5432)
- **Redis**: 6379 (internal: redis:6379)
- **MinIO**: 9000, 9001 (internal: minio:9000)
- **Ollama**: 11434 (internal: ollama:11434)

### Main Document Generator Services
- **Flask Backend**: 5000
- **Template Processor**: 3000
- **AI API (CAL Compare)**: 3001
- **Analytics Service**: 3002
- **Platform Hub**: 8080
- **WebSocket**: 8081
- **Master Controller**: 9999

### SAAS Extended Services (Non-conflicting ports)
- **Foundational Persistence**: 3005
- **Device Mesh**: 3006, 3007
- **Authentication Service**: 3008
- **Extended Template Processor**: 3010 (was 3000)
- **Extended AI API**: 3011 (was 3001)
- **Extended Analytics**: 3012 (was 3002)
- **Extended Platform**: 8082 (was 8080)
- **Gaming Services**: 8900, 8901
- **Mesh Network**: 4200, 4201, 4202

### API Gateway Integration
- **Primary Gateway**: 8888 (unified-api-gateway.js)
- **Empire Bridge**: 3333
- **Unified Dashboard**: 4444

## 🔧 Fix Actions Required

1. **Update SAAS docker-compose.yml** to use non-conflicting ports
2. **Update .env files** to use Docker service names instead of localhost
3. **Update API routers** to use unified port mapping
4. **Test service-to-service communication**