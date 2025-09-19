# Git Workflow - OSS/Private Data Separation

## 🌐 OSS Branch (Public)
```bash
git checkout oss-release
./deploy-oss.sh
git push origin oss-release
```

**Contains:**
- Agent processing logic (kisuke, conductor, tunnel, vibevault)
- Template systems
- Container orchestration
- Public APIs
- Documentation

**Does NOT contain:**
- User data
- Session management
- Payment tracking
- Private keys

## 🔒 Private Branch (Internal)
```bash
git checkout private-data  
./deploy-private.sh
git push private-remote private-data
```

**Contains:**
- User data handling
- Session isolation
- Payment attribution
- API keys/secrets
- Production configs

## 🔧 Development Workflow

### Daily Development
```bash
git checkout main
./start-development.sh
```

### Before Public Release
```bash
./deploy-oss.sh
git checkout oss-release
git push origin oss-release
```

### Before Private Deployment  
```bash
./deploy-private.sh
git checkout private-data
git push private-remote private-data
```

## 🔗 Symlink Management

Symlinks connect OSS and private components without mixing code:

- `symlinks/kisuke-agent` → OSS agent processing
- `symlinks/flask-api` → Bridge between OSS/private
- `symlinks/*-templates` → Template access
- `private-components/` → Never in OSS branch

## 💰 Data Stream Attribution

User data stays in private components, but when big tech APIs are used:
1. Flask backend tracks usage
2. Attribution logged to private branch
3. Payment calculations in private-components/
4. OSS components never see user data

## 🚀 Deployment Targets

- **Development**: `./start-development.sh`
- **Production**: `./start-production.sh`  
- **OSS Release**: GitHub/public repos
- **Private Deploy**: Internal servers only
