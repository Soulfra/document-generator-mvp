# 🎯 Customer Setup Guide - Document Generator

## For Non-Developers: How to Use Your Own API Keys

This guide explains how customers can easily set up the Document Generator system with their own AI API keys, even if they're not developers.

## 🚀 Quick Start Options

### Option 1: Visual Setup Wizard (Recommended)
```bash
# Start the setup wizard
./docgen onboard
```
Then open your browser to: **http://localhost:3010**

### Option 2: Quick CLI Tool (For API Keys Only)
```bash
# Just update API keys without full wizard
node update-api-keys.js
```

## 📋 What You'll Need

### Option 1: Free Local AI Only (No Keys Needed)
- **Cost**: $0/month
- **Performance**: Good for basic tasks
- **Setup**: Zero configuration needed

### Option 2: Budget Cloud AI (~$1-5/month)
- **DeepSeek API Key**: Get at https://platform.deepseek.com/
- **Performance**: Better than free, very affordable
- **Best for**: Small businesses

### Option 3: Premium Cloud AI (~$10-50/month)
- **OpenAI API Key**: Get at https://platform.openai.com/api-keys
- **Anthropic API Key**: Get at https://console.anthropic.com/
- **Performance**: Best quality for complex tasks
- **Best for**: Professional/enterprise use

## 🔧 Step-by-Step Setup

### Step 1: Get Your API Keys (Optional)

#### OpenAI (GPT-4)
1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key (starts with `sk-`)
4. Save it somewhere safe

#### Anthropic (Claude)
1. Go to https://console.anthropic.com/
2. Navigate to "API Keys"
3. Create a new key
4. Copy the key (starts with `sk-ant-`)
5. Save it somewhere safe

#### DeepSeek (Budget Option)
1. Go to https://platform.deepseek.com/
2. Create account and get API key
3. Copy the key
4. Save it somewhere safe

### Step 2: Run the Setup Wizard

```bash
# Start the setup wizard
./docgen onboard
```

### Step 3: Follow the Web Interface

1. **Browser opens automatically** to http://localhost:3010
2. **Step 1**: Read the welcome message
3. **Step 2**: Enter your API keys (or skip for free local AI)
4. **Step 3**: Generate your configuration
5. **Step 4**: Launch the system
6. **Step 5**: Success! Your system is ready

### Step 4: Access Your System

After setup, you can access:
- **Main Dashboard**: http://localhost:8080
- **Business Accounting**: http://localhost:3013
- **API Documentation**: http://localhost:3001/docs

## 💰 Cost Breakdown

### Free Tier (Local AI Only)
- **Monthly Cost**: $0
- **Processing Speed**: Good
- **Capabilities**: Basic document processing, simple AI tasks
- **Best For**: Personal use, testing

### Budget Tier (DeepSeek)
- **Monthly Cost**: $1-5
- **Processing Speed**: Fast
- **Capabilities**: Advanced document processing, good AI reasoning
- **Best For**: Small businesses, regular use

### Professional Tier (OpenAI + Anthropic)
- **Monthly Cost**: $10-50
- **Processing Speed**: Very fast
- **Capabilities**: Best AI reasoning, complex document analysis
- **Best For**: Professional services, high volume

## 🛡️ Security & Privacy

### Your API Keys Are Safe
- **Stored locally only** - Never sent to our servers
- **Encrypted configuration** - Keys are encrypted in your .env file
- **You control the data** - All processing happens on your machine or your chosen AI provider

### Data Privacy
- **No data collection** - We don't collect your documents or API usage
- **Local processing** - Documents processed on your machine
- **Your accounts** - You pay your AI providers directly

## 🚨 Troubleshooting

### "API Key Invalid" Error
1. **Check the format**: 
   - OpenAI keys start with `sk-`
   - Anthropic keys start with `sk-ant-`
2. **Copy the entire key** - Make sure no spaces or missing characters
3. **Check your account** - Ensure you have credits in your AI provider account

### System Won't Start
1. **Check Docker**: Make sure Docker is running
2. **Check ports**: Ensure ports 3000, 3010, 8080 aren't in use
3. **Restart setup**: Run `./docgen onboard` again

### Getting Help
1. **Check logs**: Look for error messages in the terminal
2. **Run health check**: `./docgen status`
3. **Restart system**: `./docgen stop` then `./docgen start`

## 🎯 What Happens After Setup?

### Your System Includes:
- **Document Generator**: Transform any document into working software
- **Business Accounting**: QuickBooks-style accounting with crypto support
- **AI-Powered Analysis**: Intelligent document processing
- **Real-time Monitoring**: See what's happening as it processes
- **Cost Tracking**: Monitor your AI usage and costs

### Quick Commands:
```bash
# Check system status
./docgen status

# Start/stop the system
./docgen start
./docgen stop

# Run verification tests
./docgen test verify

# Generate handoff package
./docgen handoff generate

# Open setup wizard again
./docgen onboard
```

## 🎉 Success! Now What?

After successful setup:

1. **Process your first document**: Upload a business plan or specification
2. **Set up accounting**: Configure your business information
3. **Monitor usage**: Check your AI provider dashboards for usage
4. **Scale up**: Add more API keys as your usage grows

## 📞 Support

### Self-Service Resources:
- **System Status**: `./docgen status`
- **Health Check**: `./docgen health`
- **Documentation**: See CLAUDE.md files in project
- **Examples**: Check the examples/ directory

### System Architecture:
- **Local First**: Everything works offline with local AI
- **Cloud Enhanced**: Add cloud AI for better performance
- **Cost Optimized**: System tries free local AI first, then your cloud keys
- **Fully Integrated**: All components work together seamlessly

---

**Remember**: You're in complete control. Your API keys, your data, your costs. The system just makes it easy to use your own AI accounts effectively.

*Last Updated: August 1, 2025*