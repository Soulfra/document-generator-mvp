# 🚀 Document Generator - Quick Reference

## 📊 Current Status
- **Size**: 27GB (was 42GB - saved 15GB!)
- **Services**: All critical services running
- **AI**: Using free Ollama (no API keys needed)

## 🎯 Quick Commands

### Start Everything
```bash
# Terminal 1 - Ollama (if not running)
ollama serve

# Terminal 2 - AI API Service (if not running)
node services/real-ai-api.js

# Terminal 3 - Main system
npm start
```

### Test It Works
```bash
# Run test suite
node test-core-services.js

# Quick API test
curl http://localhost:3001/health
```

### Access Points
- **Template Processor**: http://localhost:3000
- **AI API Docs**: http://localhost:3001
- **Document Generator**: http://localhost:4000

## 💰 For Sales Demos

### Option 1: Simple Document Test
```bash
curl -X POST http://localhost:3001/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"content": "Build a task management app", "type": "business_plan"}'
```

### Option 2: Web Interface
1. Open http://localhost:3000
2. Click "Template Demo"
3. Upload any document
4. Show the generated MVP

## 🔧 Common Issues

### "Max listeners exceeded"
Already fixed! Added `process.setMaxListeners(50)` to services.

### "API key not found"
System uses free Ollama by default. To add cloud APIs, see `API_KEYS_SETUP.md`.

### "Service not running"
Check with `node test-core-services.js` and start missing services.

## 📁 What We Did
1. ✅ Removed 15GB of duplicate node_modules
2. ✅ Fixed max listeners errors
3. ✅ Kept ALL code and templates
4. ✅ Preserved modular structure
5. ✅ System ready for sales!

---
**Remember**: Don't delete any more directories without checking symlinks first!
The gaming/blockchain code provides compute infrastructure - keep it!