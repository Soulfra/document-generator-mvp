# 🔑 API Keys Setup Instructions

## Current Status
Your `.env` file is using placeholder/empty values for API keys. To get the AI features working, you need to add real keys.

## 🚨 Quick Fix - Add Your Keys

Edit the `.env` file and replace these lines:

```bash
# BEFORE (current):
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY:-}
OPENAI_API_KEY=${OPENAI_API_KEY:-}

# AFTER (with your real keys):
ANTHROPIC_API_KEY=sk-ant-your-real-anthropic-key-here
OPENAI_API_KEY=sk-your-real-openai-key-here
```

## 🔗 Where to Get API Keys

### OpenAI (GPT-4)
1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key starting with `sk-`
4. Add to `.env` file

### Anthropic (Claude)
1. Go to https://console.anthropic.com/
2. Navigate to API Keys section
3. Create a new key
4. Copy the key starting with `sk-ant-`
5. Add to `.env` file

### DeepSeek (Optional - Cheaper Alternative)
1. Go to https://platform.deepseek.com/
2. Create account and get API key
3. Add as `DEEPSEEK_API_KEY=your-key`

## 💡 Using Environment Variables (Alternative)

Instead of editing `.env`, you can set them in your terminal:

```bash
export ANTHROPIC_API_KEY="sk-ant-your-key"
export OPENAI_API_KEY="sk-your-key"
```

## 🏃 Testing Your Keys

After adding keys, test with:

```bash
# Test the AI service
curl http://localhost:3001/api/test

# Or check cal-compare
node FinishThisIdea/ai-os-clean/cal-compare-complete.js
```

## 💰 Cost Management Tips

1. **Start with Ollama** (free local AI)
2. **Use DeepSeek** for cheaper cloud option
3. **OpenAI/Anthropic** only for complex tasks
4. Monitor usage in your provider dashboards

## ⚠️ Security Notes

- Never commit `.env` with real keys to git
- Keep `.env` in `.gitignore`
- Use environment variables in production
- Rotate keys regularly

---

**Remember**: The system will try Ollama first (free), then fall back to cloud APIs only if needed!