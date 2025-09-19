# API Keys Setup Guide

This guide helps you obtain and configure API keys for Document Generator services.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [AI Services](#ai-services)
  - [OpenAI](#openai)
  - [Anthropic Claude](#anthropic-claude)
  - [Google AI](#google-ai)
  - [Local AI (Ollama)](#local-ai-ollama)
- [Payment Processing](#payment-processing)
  - [Stripe](#stripe)
- [Storage Services](#storage-services)
  - [AWS S3](#aws-s3)
  - [MinIO](#minio)
- [Other Services](#other-services)
- [Security Best Practices](#security-best-practices)

## 🚀 Quick Start

1. **Copy environment template**
   ```bash
   cp .env.example .env
   ```

2. **Run interactive setup**
   ```bash
   node install.js
   # OR
   ./setup-document-generator.sh
   ```

3. **Add keys manually** (if needed)
   ```bash
   # Edit .env file
   nano .env
   
   # Or use vault manager
   node vault-manager.js store-key openai_key "sk-..."
   ```

## 🤖 AI Services

### OpenAI

**Get your API key**: https://platform.openai.com/api-keys

1. Create an OpenAI account
2. Go to API Keys section
3. Click "Create new secret key"
4. Copy the key (starts with `sk-proj-`)
5. Add to `.env`:
   ```env
   OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

**Pricing**: 
- GPT-4: $0.03/1K tokens
- GPT-3.5-turbo: $0.002/1K tokens
- Free tier: $5 credit for new accounts

### Anthropic Claude

**Get your API key**: https://console.anthropic.com/settings/keys

1. Create an Anthropic account
2. Navigate to API Keys
3. Generate new key
4. Copy the key (starts with `sk-ant-api03-`)
5. Add to `.env`:
   ```env
   ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

**Pricing**:
- Claude 3 Opus: $0.015/1K tokens
- Claude 3 Sonnet: $0.003/1K tokens
- Free tier: Limited free usage

### Google AI

**Get your API key**: https://makersuite.google.com/app/apikey

1. Sign in with Google account
2. Create new API key
3. Enable necessary APIs
4. Copy the key (starts with `AIzaSy`)
5. Add to `.env`:
   ```env
   GOOGLE_AI_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

**Pricing**:
- Gemini Pro: Free tier available
- Rate limits apply

### Local AI (Ollama)

**Free and runs locally** - No API key required!

1. **Install Ollama**: https://ollama.ai
   ```bash
   # macOS
   brew install ollama
   
   # Linux
   curl -fsSL https://ollama.ai/install.sh | sh
   
   # Windows
   # Download from https://ollama.ai/download
   ```

2. **Pull models**:
   ```bash
   ollama pull codellama:7b
   ollama pull mistral
   ollama pull llama2
   ```

3. **Configure in .env**:
   ```env
   ENABLE_LOCAL_AI=true
   OLLAMA_HOST=http://localhost:11434
   ```

## 💳 Payment Processing

### Stripe

**Get your API keys**: https://dashboard.stripe.com/apikeys

1. Create Stripe account
2. Toggle "Test mode" for development
3. Copy keys from Dashboard → Developers → API keys
4. Add to `.env`:
   ```env
   # Test keys (for development)
   STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   
   # Production keys (keep secure!)
   # STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

5. **Webhook Secret** (for events):
   - Go to Webhooks section
   - Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
   - Copy webhook signing secret
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

**Testing**:
- Use test card: `4242 4242 4242 4242`
- Any future expiry date
- Any CVC

## 🗄️ Storage Services

### AWS S3

**Get credentials**: https://console.aws.amazon.com/iam/

1. Create AWS account
2. Create IAM user with S3 access
3. Generate access keys
4. Create S3 bucket
5. Add to `.env`:
   ```env
   AWS_ACCESS_KEY_ID=AKIAxxxxxxxxxxxxxxxxx
   AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   AWS_REGION=us-east-1
   AWS_S3_BUCKET=document-generator-prod
   ```

### MinIO (Local S3)

**Default credentials** (for development):
```env
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin123
S3_BUCKET=document-generator
```

**Production setup**:
1. Change default credentials
2. Enable HTTPS
3. Configure proper access policies

## 🔧 Other Services

### Email (SMTP)

**Gmail App Password**:
1. Enable 2FA on Google account
2. Go to: https://myaccount.google.com/apppasswords
3. Generate app-specific password
4. Add to `.env`:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-specific-password
   ```

### Email (Resend)

**Get API key**: https://resend.com/api-keys

1. Create Resend account
2. Verify domain
3. Generate API key
4. Add to `.env`:
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### GitHub OAuth

**Create OAuth App**: https://github.com/settings/applications/new

1. Application name: `Document Generator`
2. Homepage URL: `https://yourdomain.com`
3. Callback URL: `https://yourdomain.com/auth/github/callback`
4. Copy Client ID and Secret
5. Add to `.env`:
   ```env
   GITHUB_CLIENT_ID=Iv1.xxxxxxxxxxxxxxxx
   GITHUB_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

### Google OAuth

**Create OAuth Credentials**: https://console.cloud.google.com/apis/credentials

1. Create new project
2. Enable Google+ API
3. Create OAuth 2.0 credentials
4. Add authorized redirect URIs
5. Copy credentials:
   ```env
   GOOGLE_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

## 🔐 Security Best Practices

### 1. Never Commit Keys
```bash
# Ensure .env is in .gitignore
echo ".env" >> .gitignore
git rm --cached .env  # If accidentally committed
```

### 2. Use Vault for Production
```bash
# Encrypt sensitive keys
node vault-manager.js store-key stripe_live_key "sk_live_..."

# Encrypt entire .env file
node vault-manager.js encrypt-env
```

### 3. Rotate Keys Regularly
- Set calendar reminders
- Use key versioning
- Update keys without downtime

### 4. Limit Key Permissions
- Create keys with minimal required permissions
- Use separate keys for development/production
- Monitor key usage

### 5. Environment-Specific Keys
```env
# Development
STRIPE_SECRET_KEY=sk_test_...

# Production (use vault)
# STRIPE_SECRET_KEY=<encrypted>
```

## 🧪 Testing Without Keys

You can test basic functionality without API keys:

```env
# Enable mock services
USE_MOCK_AI=true
USE_MOCK_PAYMENTS=true
USE_MOCK_EMAIL=true

# Use local AI only
ENABLE_LOCAL_AI=true
ENABLE_CLOUD_AI=false
```

## 🚨 Troubleshooting

### Invalid API Key Errors
```bash
# Validate keys
node scripts/validate-env.js

# Test specific service
curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models
```

### Rate Limiting
- Start with free tiers
- Monitor usage in provider dashboards
- Implement caching to reduce API calls
- Use local AI for development

### Key Rotation Process
1. Generate new key in provider dashboard
2. Update in vault: `node vault-manager.js store-key service_key "new_key"`
3. Deploy update
4. Revoke old key

## 📚 Additional Resources

- [OpenAI Pricing](https://openai.com/pricing)
- [Anthropic Pricing](https://www.anthropic.com/pricing)
- [Stripe Testing](https://stripe.com/docs/testing)
- [AWS Free Tier](https://aws.amazon.com/free/)

## 🤝 Need Help?

- Check provider documentation
- Join our Discord: [discord.gg/docgen](https://discord.gg/docgen)
- Create an issue: [GitHub Issues](https://github.com/yourusername/document-generator/issues)

---

**Remember**: Keep your API keys secure and never share them publicly!