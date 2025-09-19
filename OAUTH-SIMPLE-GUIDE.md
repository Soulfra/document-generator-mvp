# 🚀 Simple OAuth Setup Guide

## What is OAuth?

Think of OAuth like a hotel keycard system:
- Instead of giving your master key (password) to every service
- You give them a temporary keycard (OAuth token) that only opens certain doors
- You can revoke the keycard anytime without changing your master key

## 🎯 Quick Start (Just GitHub)

### Step 1: Start the Simplified Auth Server
```bash
node unified-auth-server-simplified.js
```

### Step 2: Visit the Setup Wizard
Open http://localhost:3340/setup in your browser

### Step 3: Set Up GitHub (Easiest)
1. Click on "GitHub" in the setup wizard
2. Follow the step-by-step instructions shown
3. Add your credentials to `.env` file:
   ```
   GITHUB_CLIENT_ID=your-actual-client-id
   GITHUB_CLIENT_SECRET=your-actual-secret
   ```
4. Restart the server

That's it! GitHub login now works.

## 📋 Understanding the System

### Provider Configuration
All OAuth providers are configured in `oauth-providers.config.js`:
- ✅ `enabled: true` - Provider is active
- ❌ `enabled: false` - Provider is hidden
- 🔜 `comingSoon: true` - Shows as "Coming Soon"

### Development Mode
When `NODE_ENV=development` (default):
- Shows all providers (even unconfigured ones)
- Provides a "Quick Login" option for testing
- Shows helpful setup instructions
- Redirects to setup wizard if OAuth isn't configured

### Categories of Providers

#### 🔧 Developer Platforms
- **GitHub** - For code repositories and developer tools
- **GitLab** - Alternative to GitHub (coming soon)

#### 🌐 General Platforms  
- **Google** - Most users have this
- **Microsoft** - Windows/Office users

#### 🎮 Gaming Platforms
- **Xbox Live** - Microsoft gaming
- **Steam** - PC gaming platform
- **Discord** - Gaming communities
- **Roblox** - Kids/teens gaming
- **Minecraft** - Via Microsoft account

#### 💼 Business Platforms
- **Teams** - Microsoft Teams for businesses
- **Slack** - Team communication

## 🔐 Security Notes

1. **Never commit real credentials** - Use `.env` files
2. **Use HTTPS in production** - OAuth requires secure connections
3. **Rotate secrets regularly** - Change them every few months
4. **Limit scopes** - Only request permissions you need

## 🛠️ Troubleshooting

### "Provider not configured" error
- Check if credentials are in `.env` file
- Make sure you restarted the server after adding credentials
- Verify the callback URL matches exactly

### "Invalid redirect URI" error
- OAuth providers must have exact callback URL
- For GitHub: `http://localhost:3340/auth/github/callback`
- For Google: `http://localhost:3340/auth/google/callback`

### Can't see login buttons
- Check `oauth-providers.config.js` - is provider enabled?
- In production mode, only enabled providers with credentials show up
- Use development mode to see all options

## 📝 Adding New Providers

1. Edit `oauth-providers.config.js`
2. Set `enabled: true` for desired provider
3. Get OAuth credentials from provider's developer portal
4. Add to `.env` file
5. Restart server

## 🎨 Customization

### Change Provider Order
Edit the order in `oauth-providers.config.js`

### Add Custom Branding
Modify the styles in `unified-auth-server-simplified.js`

### Add New Categories
Add new category names in the config file

## 🚀 What's Next?

1. **Start Simple** - Just use GitHub and Google first
2. **Add Gaming Later** - Xbox/Steam when you need them
3. **Enterprise Last** - Teams/Slack require more setup

Remember: You don't need ALL providers. Start with 1-2 that your users actually use!