#!/usr/bin/env node

/**
 * UNIFIED AUTHENTICATION SERVER
 * 
 * One-click OAuth login for multiple services
 * Like Xbox Live or Battle.net - just click and login!
 */

const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class UnifiedAuthServer {
    constructor(options = {}) {
        this.app = express();
        this.port = options.port || 3340;
        this.wsPort = options.wsPort || 3341;
        
        // Database path
        this.dbPath = path.join(options.vaultPath || '.vault', 'unified-accounts.json');
        this.accounts = new Map();
        
        // OAuth configurations
        this.oauthConfig = {
            github: {
                clientID: process.env.GITHUB_CLIENT_ID || 'your-github-client-id',
                clientSecret: process.env.GITHUB_CLIENT_SECRET || 'your-github-client-secret',
                callbackURL: `http://localhost:${this.port}/auth/github/callback`
            },
            google: {
                clientID: process.env.GOOGLE_CLIENT_ID || 'your-google-client-id',
                clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret',
                callbackURL: `http://localhost:${this.port}/auth/google/callback`
            },
            // Gaming platforms can be added here
            xbox: {
                clientID: process.env.XBOX_CLIENT_ID || 'your-xbox-client-id',
                clientSecret: process.env.XBOX_CLIENT_SECRET || 'your-xbox-client-secret',
                callbackURL: `http://localhost:${this.port}/auth/xbox/callback`
            }
        };
        
        // Session configuration
        this.sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
        
        console.log('🔐 Unified Authentication Server initializing...');
        this.initialize();
    }
    
    async initialize() {
        await this.loadAccounts();
        await this.setupExpress();
        await this.setupPassport();
        await this.setupRoutes();
        
        this.server = this.app.listen(this.port, () => {
            console.log(`✨ Unified Auth Server running on http://localhost:${this.port}`);
            console.log('🎮 Ready for one-click login!');
        });
    }
    
    async loadAccounts() {
        try {
            const data = await fs.readFile(this.dbPath, 'utf8');
            const accounts = JSON.parse(data);
            accounts.forEach(acc => this.accounts.set(acc.id, acc));
            console.log(`📚 Loaded ${this.accounts.size} accounts`);
        } catch {
            console.log('📚 Starting with fresh account database');
        }
    }
    
    async saveAccounts() {
        const accounts = Array.from(this.accounts.values());
        await fs.mkdir(path.dirname(this.dbPath), { recursive: true });
        await fs.writeFile(this.dbPath, JSON.stringify(accounts, null, 2));
    }
    
    async setupExpress() {
        // Middleware
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(express.static('public'));
        
        // Session
        this.app.use(session({
            secret: this.sessionSecret,
            resave: false,
            saveUninitialized: false,
            cookie: {
                secure: false, // Set true in production with HTTPS
                httpOnly: true,
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            }
        }));
        
        // Passport
        this.app.use(passport.initialize());
        this.app.use(passport.session());
    }
    
    async setupPassport() {
        // Serialization
        passport.serializeUser((user, done) => {
            done(null, user.id);
        });
        
        passport.deserializeUser((id, done) => {
            const user = this.accounts.get(id);
            done(null, user);
        });
        
        // GitHub Strategy
        if (this.oauthConfig.github.clientID !== 'your-github-client-id') {
            passport.use(new GitHubStrategy({
                ...this.oauthConfig.github,
                scope: ['user:email', 'repo']
            }, this.handleOAuthCallback.bind(this, 'github')));
        }
        
        // Google Strategy
        if (this.oauthConfig.google.clientID !== 'your-google-client-id') {
            passport.use(new GoogleStrategy({
                ...this.oauthConfig.google,
                scope: ['profile', 'email']
            }, this.handleOAuthCallback.bind(this, 'google')));
        }
        
        // Add more strategies for gaming platforms as needed
    }
    
    async handleOAuthCallback(provider, accessToken, refreshToken, profile, done) {
        try {
            // Find or create user
            let user = this.findUserByProvider(provider, profile.id);
            
            if (!user) {
                // Create new unified account
                user = {
                    id: crypto.randomUUID(),
                    email: profile.emails?.[0]?.value || `${profile.id}@${provider}.local`,
                    displayName: profile.displayName || profile.username,
                    avatar: profile.photos?.[0]?.value,
                    createdAt: new Date(),
                    connectedAccounts: {},
                    settings: {
                        theme: 'dark',
                        notifications: true
                    }
                };
            }
            
            // Update connected account
            user.connectedAccounts[provider] = {
                id: profile.id,
                username: profile.username || profile.displayName,
                accessToken: this.encryptToken(accessToken),
                refreshToken: refreshToken ? this.encryptToken(refreshToken) : null,
                profile: {
                    displayName: profile.displayName,
                    email: profile.emails?.[0]?.value,
                    avatar: profile.photos?.[0]?.value
                },
                connectedAt: new Date()
            };
            
            // Save user
            this.accounts.set(user.id, user);
            await this.saveAccounts();
            
            done(null, user);
            
        } catch (error) {
            done(error);
        }
    }
    
    findUserByProvider(provider, providerId) {
        for (const [_, user] of this.accounts) {
            if (user.connectedAccounts[provider]?.id === providerId) {
                return user;
            }
        }
        return null;
    }
    
    async setupRoutes() {
        // Main login page
        this.app.get('/', this.serveLoginPage.bind(this));
        
        // OAuth routes
        this.app.get('/auth/github', passport.authenticate('github'));
        this.app.get('/auth/github/callback', 
            passport.authenticate('github', { failureRedirect: '/login' }),
            (req, res) => res.redirect('/dashboard')
        );
        
        this.app.get('/auth/google', passport.authenticate('google'));
        this.app.get('/auth/google/callback',
            passport.authenticate('google', { failureRedirect: '/login' }),
            (req, res) => res.redirect('/dashboard')
        );
        
        // Dashboard
        this.app.get('/dashboard', this.ensureAuthenticated, this.serveDashboard.bind(this));
        
        // API endpoints
        this.app.get('/api/user', this.ensureAuthenticated, (req, res) => {
            res.json(req.user);
        });
        
        this.app.post('/api/link-account/:provider', this.ensureAuthenticated, (req, res) => {
            // Redirect to OAuth flow for linking
            res.redirect(`/auth/${req.params.provider}`);
        });
        
        this.app.post('/api/unlink-account/:provider', this.ensureAuthenticated, async (req, res) => {
            const user = req.user;
            delete user.connectedAccounts[req.params.provider];
            await this.saveAccounts();
            res.json({ success: true });
        });
        
        // Logout
        this.app.get('/logout', (req, res) => {
            req.logout(() => {
                res.redirect('/');
            });
        });
        
        // Integration endpoints for other services
        this.app.get('/api/github/token', this.ensureAuthenticated, (req, res) => {
            const githubAccount = req.user.connectedAccounts.github;
            if (!githubAccount) {
                return res.status(404).json({ error: 'GitHub not connected' });
            }
            
            // Return decrypted token for internal use
            res.json({
                token: this.decryptToken(githubAccount.accessToken),
                username: githubAccount.username
            });
        });
    }
    
    ensureAuthenticated(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        res.redirect('/');
    }
    
    serveLoginPage(req, res) {
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SoulFra Login - One Account, Everything Connected</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
        }
        
        .login-container {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 3rem;
            width: 90%;
            max-width: 400px;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        
        .logo {
            font-size: 3rem;
            margin-bottom: 1rem;
        }
        
        h1 {
            font-size: 2rem;
            margin-bottom: 0.5rem;
            font-weight: 700;
        }
        
        .tagline {
            font-size: 1rem;
            opacity: 0.8;
            margin-bottom: 2rem;
        }
        
        .login-buttons {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }
        
        .login-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 1rem;
            padding: 1rem 2rem;
            border-radius: 10px;
            border: none;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            color: #fff;
        }
        
        .login-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        }
        
        .login-btn.github {
            background: linear-gradient(135deg, #24292e, #40454a);
        }
        
        .login-btn.google {
            background: linear-gradient(135deg, #4285f4, #5b9aff);
        }
        
        .login-btn.xbox {
            background: linear-gradient(135deg, #107c10, #3fa835);
        }
        
        .login-btn.roblox {
            background: linear-gradient(135deg, #e2231a, #ff4040);
        }
        
        .login-btn.minecraft {
            background: linear-gradient(135deg, #62c66a, #7dd085);
        }
        
        .login-btn.email {
            background: linear-gradient(135deg, #6c757d, #8a939b);
        }
        
        .icon {
            width: 24px;
            height: 24px;
        }
        
        .divider {
            margin: 2rem 0;
            font-size: 0.9rem;
            opacity: 0.7;
        }
        
        .features {
            display: flex;
            justify-content: space-around;
            margin-top: 3rem;
            flex-wrap: wrap;
            gap: 1rem;
        }
        
        .feature {
            opacity: 0.7;
            font-size: 0.85rem;
        }
        
        @media (max-width: 480px) {
            .login-container {
                padding: 2rem 1.5rem;
            }
            
            h1 {
                font-size: 1.5rem;
            }
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="logo">🚀</div>
        <h1>Welcome to SoulFra</h1>
        <p class="tagline">One account, everything connected</p>
        
        <div class="login-buttons">
            <a href="/auth/github" class="login-btn github">
                <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/>
                </svg>
                Login with GitHub
            </a>
            
            <a href="/auth/google" class="login-btn google">
                <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Login with Google
            </a>
            
            <div class="divider">— Gaming Accounts —</div>
            
            <button class="login-btn xbox" onclick="alert('Xbox integration coming soon!')">
                <svg class="icon" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4.102 21.033C6.211 22.881 8.977 24 12 24c3.026 0 5.789-1.119 7.902-2.967 1.877-1.912-4.316-8.709-7.902-11.417-3.582 2.708-9.779 9.505-7.898 11.417zm11.16-14.406c2.5 2.961 7.484 10.313 6.076 12.912C23.002 17.48 24 14.861 24 12.004c0-3.34-1.365-6.362-3.57-8.536 0 0-.027-.022-.082-.042-.063-.022-.152-.045-.281-.045-.592 0-1.985.434-4.805 3.246zM3.654 3.426c-.057.02-.082.041-.086.042C1.365 5.642 0 8.664 0 12.004c0 2.854.998 5.473 2.661 7.533-1.401-2.605 3.579-9.951 6.08-12.91-2.82-2.813-4.216-3.245-4.806-3.245-.131 0-.218.023-.281.046v-.002zM12 3.551S9.055 1.828 6.755 1.746c-.903-.033-1.454.295-1.521.339C7.379.646 9.659 0 11.984 0H12c2.334 0 4.605.646 6.766 2.085-.068-.046-.615-.372-1.52-.339C14.946 1.828 12 3.545 12 3.545v.006z"/>
                </svg>
                Login with Xbox
            </button>
            
            <button class="login-btn roblox" onclick="alert('Roblox integration coming soon!')">
                <span style="font-size: 24px; font-weight: bold;">R</span>
                Login with Roblox
            </button>
            
            <button class="login-btn minecraft" onclick="alert('Minecraft integration coming soon!')">
                <span style="font-size: 24px;">⛏️</span>
                Login with Minecraft
            </button>
            
            <div class="divider">— or —</div>
            
            <button class="login-btn email" onclick="alert('Email signup coming soon!')">
                <span style="font-size: 24px;">📧</span>
                Sign up with Email
            </button>
        </div>
        
        <div class="features">
            <div class="feature">🔒 Secure</div>
            <div class="feature">🎮 Multi-Platform</div>
            <div class="feature">🚀 Fast</div>
        </div>
    </div>
</body>
</html>
        `;
        
        res.send(html);
    }
    
    serveDashboard(req, res) {
        const user = req.user;
        const connectedServices = Object.keys(user.connectedAccounts);
        
        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SoulFra Dashboard - ${user.displayName}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #f0f2f5;
            min-height: 100vh;
        }
        
        .header {
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: white;
            padding: 2rem;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        .header-content {
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .user-info {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        
        .avatar {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
        }
        
        .container {
            max-width: 1200px;
            margin: 2rem auto;
            padding: 0 1rem;
        }
        
        .welcome {
            background: white;
            padding: 2rem;
            border-radius: 10px;
            margin-bottom: 2rem;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }
        
        h1 { font-size: 2rem; margin-bottom: 1rem; }
        h2 { font-size: 1.5rem; margin-bottom: 1rem; color: #333; }
        
        .services-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        
        .service-card {
            background: white;
            padding: 2rem;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
            text-align: center;
            transition: transform 0.3s ease;
        }
        
        .service-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
        }
        
        .service-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
        }
        
        .service-status {
            display: inline-block;
            padding: 0.25rem 1rem;
            border-radius: 20px;
            font-size: 0.85rem;
            margin-bottom: 1rem;
        }
        
        .connected {
            background: #d4edda;
            color: #155724;
        }
        
        .not-connected {
            background: #f8d7da;
            color: #721c24;
        }
        
        .btn {
            display: inline-block;
            padding: 0.75rem 1.5rem;
            border-radius: 5px;
            text-decoration: none;
            font-weight: 600;
            transition: opacity 0.3s ease;
        }
        
        .btn:hover {
            opacity: 0.8;
        }
        
        .btn-primary {
            background: #2a5298;
            color: white;
        }
        
        .btn-danger {
            background: #dc3545;
            color: white;
        }
        
        .btn-success {
            background: #28a745;
            color: white;
        }
        
        .logout-btn {
            background: transparent;
            color: white;
            border: 2px solid white;
            padding: 0.5rem 1rem;
            border-radius: 5px;
            text-decoration: none;
            transition: all 0.3s ease;
        }
        
        .logout-btn:hover {
            background: white;
            color: #2a5298;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-content">
            <div class="user-info">
                <div class="avatar">
                    ${user.avatar ? `<img src="${user.avatar}" alt="Avatar" style="width:100%;height:100%;border-radius:50%;">` : '👤'}
                </div>
                <div>
                    <h3>${user.displayName}</h3>
                    <p style="opacity: 0.8;">${user.email}</p>
                </div>
            </div>
            <a href="/logout" class="logout-btn">Logout</a>
        </div>
    </div>
    
    <div class="container">
        <div class="welcome">
            <h1>Welcome to your SoulFra Dashboard!</h1>
            <p>Manage all your connected accounts and services in one place.</p>
        </div>
        
        <h2>Connected Services</h2>
        <div class="services-grid">
            <!-- GitHub -->
            <div class="service-card">
                <div class="service-icon">🐙</div>
                <h3>GitHub</h3>
                ${connectedServices.includes('github') ? `
                    <div class="service-status connected">✓ Connected</div>
                    <p style="margin: 1rem 0;">@${user.connectedAccounts.github.username}</p>
                    <a href="#" class="btn btn-danger" onclick="unlinkAccount('github')">Disconnect</a>
                ` : `
                    <div class="service-status not-connected">Not Connected</div>
                    <p style="margin: 1rem 0;">Connect to use Git features</p>
                    <a href="/auth/github" class="btn btn-primary">Connect GitHub</a>
                `}
            </div>
            
            <!-- Google -->
            <div class="service-card">
                <div class="service-icon">🔵</div>
                <h3>Google</h3>
                ${connectedServices.includes('google') ? `
                    <div class="service-status connected">✓ Connected</div>
                    <p style="margin: 1rem 0;">${user.connectedAccounts.google.profile.email}</p>
                    <a href="#" class="btn btn-danger" onclick="unlinkAccount('google')">Disconnect</a>
                ` : `
                    <div class="service-status not-connected">Not Connected</div>
                    <p style="margin: 1rem 0;">Connect for Google services</p>
                    <a href="/auth/google" class="btn btn-primary">Connect Google</a>
                `}
            </div>
            
            <!-- Xbox -->
            <div class="service-card">
                <div class="service-icon">🎮</div>
                <h3>Xbox Live</h3>
                <div class="service-status not-connected">Coming Soon</div>
                <p style="margin: 1rem 0;">Xbox integration in development</p>
                <button class="btn btn-primary" disabled>Connect Xbox</button>
            </div>
            
            <!-- Roblox -->
            <div class="service-card">
                <div class="service-icon" style="color: #e2231a;">R</div>
                <h3>Roblox</h3>
                <div class="service-status not-connected">Coming Soon</div>
                <p style="margin: 1rem 0;">Roblox integration in development</p>
                <button class="btn btn-primary" disabled>Connect Roblox</button>
            </div>
            
            <!-- Minecraft -->
            <div class="service-card">
                <div class="service-icon">⛏️</div>
                <h3>Minecraft</h3>
                <div class="service-status not-connected">Coming Soon</div>
                <p style="margin: 1rem 0;">Minecraft integration in development</p>
                <button class="btn btn-primary" disabled>Connect Minecraft</button>
            </div>
            
            <!-- More Services -->
            <div class="service-card" style="background: #f8f9fa;">
                <div class="service-icon">➕</div>
                <h3>More Coming Soon</h3>
                <p style="margin: 1rem 0;">Steam, Discord, Twitch, and more!</p>
            </div>
        </div>
        
        <div style="background: white; padding: 2rem; border-radius: 10px; margin-top: 2rem;">
            <h2>Quick Actions</h2>
            <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 1rem;">
                ${connectedServices.includes('github') ? 
                    '<a href="http://localhost:3337" class="btn btn-success">Open GitHub Desktop</a>' : ''
                }
                <a href="#" class="btn btn-primary">Account Settings</a>
                <a href="#" class="btn btn-primary">Privacy Settings</a>
            </div>
        </div>
    </div>
    
    <script>
        async function unlinkAccount(provider) {
            if (!confirm(\`Are you sure you want to disconnect \${provider}?\`)) return;
            
            const response = await fetch(\`/api/unlink-account/\${provider}\`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            
            if (response.ok) {
                location.reload();
            }
        }
    </script>
</body>
</html>
        `;
        
        res.send(html);
    }
    
    // Token encryption (basic - use proper encryption in production)
    encryptToken(token) {
        const cipher = crypto.createCipher('aes-256-cbc', this.sessionSecret);
        let encrypted = cipher.update(token, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }
    
    decryptToken(encryptedToken) {
        const decipher = crypto.createDecipher('aes-256-cbc', this.sessionSecret);
        let decrypted = decipher.update(encryptedToken, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
}

// Export for integration
module.exports = UnifiedAuthServer;

// Run standalone
if (require.main === module) {
    const server = new UnifiedAuthServer();
    
    console.log('\n📝 To set up OAuth:');
    console.log('1. Create OAuth apps at:');
    console.log('   - GitHub: https://github.com/settings/developers');
    console.log('   - Google: https://console.cloud.google.com');
    console.log('\n2. Set environment variables:');
    console.log('   export GITHUB_CLIENT_ID=your-github-client-id');
    console.log('   export GITHUB_CLIENT_SECRET=your-github-client-secret');
    console.log('   export GOOGLE_CLIENT_ID=your-google-client-id');
    console.log('   export GOOGLE_CLIENT_SECRET=your-google-client-secret');
    console.log('\n3. Add callback URLs:');
    console.log('   - GitHub: http://localhost:3340/auth/github/callback');
    console.log('   - Google: http://localhost:3340/auth/google/callback');
}