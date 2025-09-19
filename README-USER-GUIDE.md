# 🚀 Document Generator - User Guide

Transform any document into a working web application in minutes!

## 📋 Quick Start

### Option 1: Double-Click to Start (Easiest)
1. **On Mac/Linux**: Double-click `start-app.sh`
2. **On Windows**: Double-click `start-app.bat`
3. Your browser will open automatically to the app

### Option 2: Manual Start
1. Open Terminal/Command Prompt in this folder
2. Run: `npm start`
3. Open your browser to: http://localhost:3000

## 🔧 First Time Setup

The first time you run the app, it will ask you:

1. **GitHub OAuth Setup** (Optional but recommended)
   - This lets you import documents from your GitHub repositories
   - You'll need to create a free GitHub OAuth App (we'll guide you!)

2. **AI Services** (Optional)
   - For advanced AI features, you can add API keys later
   - The app works fine without them for basic document processing

## 🎯 How to Use

### Step 1: Sign in with GitHub
- Click "Sign in with GitHub" on the homepage
- This connects to your GitHub repositories

### Step 2: Select a Repository  
- Choose a repository that contains documents (README, specs, etc.)
- Or create a new repository for your generated app

### Step 3: Generate Your MVP
- The app will scan your documents
- Pick a template that matches your project
- Generate a complete web application!

## 📁 What Documents Work?

The app can transform any of these into working apps:
- **Business Plans** → SaaS Platforms
- **API Specifications** → REST Services  
- **Chat Logs** → Chat Applications
- **Requirements Docs** → Custom Apps
- **README files** → Documentation Sites
- **Any text document** → Relevant web app

## 🔒 GitHub OAuth Setup (If You Want It)

1. Go to: https://github.com/settings/developers
2. Click "New OAuth App"
3. Fill in:
   - **Application name**: Document Generator
   - **Homepage URL**: http://localhost:3000
   - **Authorization callback URL**: http://localhost:3000/auth/github/callback
4. Copy your Client ID and Client Secret
5. Enter them when the app asks during first run

## ❓ Troubleshooting

### "Node.js not found"
- Install Node.js from: https://nodejs.org/
- Choose the LTS (recommended) version

### "Port 3000 already in use"
- Close any other apps using port 3000
- Or change the port in the .env file: `PORT=3001`

### GitHub login not working
- Make sure you set up the OAuth App correctly
- Check that the callback URL exactly matches
- Try refreshing the page

### App won't load documents
- Make sure your GitHub repository is accessible
- Check that you have the right permissions
- Try with a public repository first

## 🆘 Need Help?

### Documentation
- Visit: http://localhost:3000/docs/ (when app is running)
- Complete API documentation and examples

### Support
- Open an issue on our GitHub repository
- Check the troubleshooting section in the docs

## 🎉 What You Get

When you generate an MVP, you'll get:
- ✅ Complete, working web application
- ✅ All source code (HTML, CSS, JavaScript)
- ✅ Docker container for easy deployment  
- ✅ Documentation and setup instructions
- ✅ Ready to deploy to Vercel, Railway, or your own server

## 🚀 Advanced Features

- **Real-time generation progress** - See your app being built
- **Multiple templates** - SaaS, API service, e-commerce, etc.
- **GitHub integration** - Push generated code to new repositories
- **AI enhancement** - Optional AI services for better results
- **Custom templates** - Create your own templates

---

**Ready to turn your ideas into reality? Let's build something awesome! 🚀**