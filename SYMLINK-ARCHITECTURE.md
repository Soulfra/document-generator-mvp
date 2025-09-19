# 🔗 Symlink Architecture Documentation

## Overview

The symlink system ensures that all components of the Economic Engine platform are properly connected and accessible across different deployment environments. This creates a unified structure that works seamlessly from development to production.

## Why Symlinks?

1. **Single Source of Truth** - One codebase, multiple deployment targets
2. **Zero Duplication** - No copying files, just linking
3. **Instant Updates** - Changes propagate immediately
4. **Environment Flexibility** - Different configs for different environments
5. **Deployment Simplicity** - Clean deployment structure

## 🏗️ Symlink Structure

```
Document-Generator/                    # Source Directory
├── server.js
├── slam-it-all-together.js
├── ai-economy-runtime.js
└── .deployments/                     # Deployment Directory (symlinked)
    ├── index.js                      # Unified entry point
    ├── economic-engine/
    │   └── server.js -> ../../server.js
    ├── slam-layer/
    │   └── server.js -> ../../slam-it-all-together.js
    ├── services/
    │   ├── ai-economy/
    │   │   └── index.js -> ../../../ai-economy-runtime.js
    │   ├── real-data/
    │   │   └── index.js -> ../../../real-data-hooks-layer.js
    │   ├── flags/
    │   │   └── index.js -> ../../../flag-tag-system.js
    │   └── differential/
    │       └── index.js -> ../../../deployment-differential-layer.js
    ├── platforms/
    │   ├── electron/ -> ../../electron-app/
    │   ├── chrome/ -> ../../chrome-extension/
    │   └── pwa/
    │       ├── manifest.json -> ../../../manifest.json
    │       └── sw.js -> ../../../sw.js
    ├── scripts/
    │   ├── test-everything.js -> ../../test-everything.js
    │   ├── init-database.js -> ../../init-database.js
    │   └── combo-bash-everything.sh -> ../../combo-bash-everything.sh
    └── node_modules -> ../node_modules
```

## 🔧 Symlink Management

### Create All Symlinks
```bash
./scripts/symlink-everything.sh
```

This script:
1. Creates deployment directory structure
2. Links all core services
3. Links service dependencies
4. Links frontend assets
5. Links multi-platform builds
6. Creates symlink registry
7. Generates symlink map

### Check Symlink Status
```bash
./scripts/symlink-status.sh
```

Output:
```
🔗 SYMLINK STATUS REPORT
=======================

Timestamp                | Status | Description
------------------------|--------|-------------
2025-01-20T10:30:00Z    | ✅ OK  | Economic Engine Server
2025-01-20T10:30:01Z    | ✅ OK  | Slam Integration Layer
2025-01-20T10:30:02Z    | ✅ OK  | AI Economy Runtime
...

Total symlinks: 42
```

### Repair Broken Symlinks
```bash
./scripts/symlink-repair.sh
```

Automatically fixes any broken symlinks in the registry.

## 📊 Symlink Registry

The system maintains a registry at `.symlinks/registry.log`:

```
timestamp|source|target|description
2025-01-20T10:30:00Z|/path/to/server.js|/path/to/.deployments/economic-engine/server.js|Economic Engine Server
```

And a JSON map at `.symlinks/map.json`:

```json
{
  "created": "2025-01-20T10:30:00Z",
  "base_directory": "/Users/matthewmauer/Desktop/Document-Generator",
  "deployment_directory": "/Users/matthewmauer/Desktop/Document-Generator/.deployments",
  "symlinks": {
    "core_services": {
      "economic_engine": ".deployments/economic-engine/server.js",
      "slam_layer": ".deployments/slam-layer/server.js"
    }
  }
}
```

## 🚀 Deployment Benefits

### 1. Clean Deployment Structure
The `.deployments` directory provides a clean, organized structure perfect for:
- Docker builds
- Cloud deployments
- CI/CD pipelines

### 2. Environment Isolation
Different deployment targets can have different configurations:
```bash
# Development
ln -sf config/dev.env .deployments/config/.env

# Production
ln -sf config/prod.env .deployments/config/.env
```

### 3. Platform-Specific Builds
Each platform gets its own symlinked directory:
- `/platforms/electron/` - Desktop app
- `/platforms/chrome/` - Browser extension
- `/platforms/pwa/` - Progressive Web App

### 4. Service Modularity
Services are organized and can be deployed independently:
- `/services/ai-economy/`
- `/services/real-data/`
- `/services/flags/`

## 🔍 Verification

### Complete System Verification
```bash
./scripts/verify-everything.sh
```

This checks:
- ✅ All required files exist
- ✅ All symlinks are valid
- ✅ Services can start
- ✅ Ports are available
- ✅ Configuration is valid
- ✅ Git repository status

### Verification Report
After running verification, check `verification-report.json`:

```json
{
  "timestamp": "2025-01-20T10:30:00Z",
  "summary": {
    "passed": 45,
    "failed": 0,
    "warnings": 2,
    "success_rate": 100
  },
  "ready_for_deployment": true
}
```

## 🎯 Use Cases

### 1. Local Development
```bash
# Work in source directory
cd /path/to/Document-Generator
npm start
```

### 2. Docker Deployment
```dockerfile
# Use deployment directory
COPY .deployments /app
WORKDIR /app
CMD ["node", "index.js"]
```

### 3. Cloud Deployment
```bash
# Deploy only the .deployments directory
rsync -av .deployments/ server:/var/app/
```

### 4. Multi-Service Deployment
```bash
# Start specific service
SERVICE=ai-economy node .deployments/index.js
```

## 🛡️ Best Practices

1. **Always use symlink scripts** - Don't create symlinks manually
2. **Check status regularly** - Run `symlink-status.sh` before deployment
3. **Repair when needed** - Run `symlink-repair.sh` if issues arise
4. **Version control symlink map** - Commit `.symlinks/map.json`
5. **Don't symlink secrets** - Keep `.env` files separate

## 🔄 Workflow Integration

The symlink system integrates with the automated workflow:

1. **Development** - Work in source directory
2. **Testing** - Tests run against source
3. **Build** - Symlinks created for deployment
4. **Deploy** - Only `.deployments` directory deployed
5. **Production** - Clean, organized structure

## 📈 Benefits Summary

- **Zero Copy Deployment** - No file duplication
- **Instant Updates** - Changes reflected immediately
- **Clean Structure** - Organized deployment layout
- **Multi-Platform** - Same source, multiple targets
- **Easy Rollback** - Just update symlinks
- **Performance** - No overhead, just pointers

---

**The symlink architecture ensures everything is connected, organized, and ready for any deployment scenario!** 🚀