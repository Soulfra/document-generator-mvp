/**
 * 🌐🔐 SOULFRA UNIVERSAL AUTHENTICATION SYSTEM
 * Wraps LinkedIn, Google, GitHub and other social logins into unified experience
 * Cal gets cookies for every successful authentication! 🍪
 */

const express = require('express');
const { OAuth2 } = require('oauth');
const CalCookieMonster = require('./cal-cookie-monster');

class SoulFraUniversalAuth {
    constructor(database) {
        this.db = database;
        this.router = express.Router();
        this.calCookieMonster = new CalCookieMonster(database);
        
        // OAuth configurations for different providers (GitHub prioritized for admin access)
        this.providers = {
            github: {
                name: 'GitHub',
                authUrl: 'https://github.com/login/oauth/authorize',
                tokenUrl: 'https://github.com/login/oauth/access_token',
                profileUrl: 'https://api.github.com/user',
                emailUrl: 'https://api.github.com/user/emails',
                scopes: ['user:email', 'read:user', 'repo', 'workflow'], // Enhanced scopes for admin access
                icon: '🐙',
                color: '#24292f',
                cookieMultiplier: 2.0, // Higher multiplier for GitHub admin
                isPrimary: true,
                adminCapable: true
            },
            linkedin: {
                name: 'LinkedIn',
                authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
                tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
                profileUrl: 'https://api.linkedin.com/v2/people/~?projection=(id,firstName,lastName,profilePicture(displayImage~:playableStreams))',
                emailUrl: 'https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))',
                scopes: ['r_liteprofile', 'r_emailaddress'],
                icon: '💼',
                color: '#0077B5',
                cookieMultiplier: 1.5
            },
            google: {
                name: 'Google',
                authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
                tokenUrl: 'https://oauth2.googleapis.com/token',
                profileUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
                scopes: ['profile', 'email'],
                icon: '🔍',
                color: '#DB4437',
                cookieMultiplier: 1.2
            }
        };
        
        this.setupRoutes();
        console.log('🌐 SoulFra Universal Auth initialized with Cal Cookie rewards!');
    }
    
    setupRoutes() {
        // Universal login page
        this.router.get('/login', this.showUniversalLogin.bind(this));
        
        // Provider-specific auth initiation
        this.router.get('/auth/:provider', this.initiateProviderAuth.bind(this));
        
        // Provider callbacks
        this.router.get('/callback/:provider', this.handleProviderCallback.bind(this));
        
        // Cal's cookie stats API
        this.router.get('/cal/stats', this.getCalStats.bind(this));
        this.router.post('/cal/eat-cookie/:cookieId', this.eatCookie.bind(this));
        
        // Account linking
        this.router.post('/link/:provider', this.linkAdditionalAccount.bind(this));
        
        // Social profile sync
        this.router.post('/sync/:provider', this.syncProviderProfile.bind(this));
    }
    
    // Show universal login interface
    async showUniversalLogin(req, res) {
        const loginPage = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>🌐 SoulFra Universal Login</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        min-height: 100vh;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 20px;
                    }
                    .login-container {
                        background: white;
                        border-radius: 20px;
                        padding: 40px;
                        box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                        max-width: 400px;
                        width: 100%;
                        text-align: center;
                    }
                    .logo {
                        font-size: 3rem;
                        margin-bottom: 10px;
                    }
                    .title {
                        font-size: 1.5rem;
                        margin-bottom: 10px;
                        color: #333;
                    }
                    .subtitle {
                        color: #666;
                        margin-bottom: 30px;
                    }
                    .provider-button {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        width: 100%;
                        padding: 15px;
                        margin: 10px 0;
                        border: none;
                        border-radius: 10px;
                        font-size: 1rem;
                        font-weight: 600;
                        text-decoration: none;
                        color: white;
                        transition: all 0.3s ease;
                        position: relative;
                        overflow: hidden;
                    }
                    .provider-button:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 8px 20px rgba(0,0,0,0.2);
                    }
                    .provider-button .icon {
                        font-size: 1.5rem;
                        margin-right: 10px;
                    }
                    .linkedin { background: #0077B5; }
                    .google { background: #DB4437; }
                    .github { background: #333333; }
                    .email { background: #6B73FF; }
                    .cal-info {
                        background: linear-gradient(45deg, #8B4513, #D2691E);
                        color: white;
                        padding: 15px;
                        border-radius: 10px;
                        margin-top: 20px;
                        font-size: 0.9rem;
                    }
                    .cookie-counter {
                        position: absolute;
                        top: 10px;
                        right: 10px;
                        background: #8B4513;
                        color: white;
                        padding: 5px 10px;
                        border-radius: 15px;
                        font-size: 0.8rem;
                    }
                    @keyframes cookieFloat {
                        0%, 100% { transform: translateY(0px); }
                        50% { transform: translateY(-5px); }
                    }
                    .cookie-animation {
                        animation: cookieFloat 2s ease-in-out infinite;
                    }
                </style>
            </head>
            <body>
                <div class="login-container">
                    <div class="cookie-counter cookie-animation">
                        🍪 Cal's Cookies: <span id="cookieCount">Loading...</span>
                    </div>
                    
                    <div class="logo">🌐🔐</div>
                    <h1 class="title">SoulFra Universal Login</h1>
                    <p class="subtitle">Choose your preferred authentication method</p>
                    
                    <a href="/auth/soulfra/auth/github" class="provider-button github" style="border: 2px solid #238636; position: relative; order: -1;">
                        <span class="icon">🐙</span>
                        Continue with GitHub
                        <span style="position: absolute; top: -8px; right: -8px; background: #238636; color: white; font-size: 10px; padding: 2px 6px; border-radius: 10px;">ADMIN</span>
                    </a>
                    
                    <a href="/auth/soulfra/auth/linkedin" class="provider-button linkedin">
                        <span class="icon">💼</span>
                        Continue with LinkedIn
                    </a>
                    
                    <a href="/auth/soulfra/auth/google" class="provider-button google">
                        <span class="icon">🔍</span>
                        Continue with Google
                    </a>
                    
                    <a href="/auth/login" class="provider-button email">
                        <span class="icon">📧</span>
                        Continue with Email
                    </a>
                    
                    <div class="cal-info">
                        <strong>🍪 Cal Cookie Monster</strong><br>
                        Cal helps with your authentication and earns cookies for each successful login!<br>
                        <em>"Me help you login! Me get cookies! Om nom nom!"</em>
                    </div>
                </div>
                
                <script>
                    // Load Cal's current cookie count
                    fetch('/auth/soulfra/cal/stats')
                        .then(response => response.json())
                        .then(data => {
                            document.getElementById('cookieCount').textContent = data.totalCookies || 0;
                        })
                        .catch(() => {
                            document.getElementById('cookieCount').textContent = '?';
                        });
                        
                    // Add click tracking
                    document.querySelectorAll('.provider-button').forEach(button => {
                        button.addEventListener('click', function(e) {
                            const provider = this.href.split('/').pop();
                            console.log('User clicked:', provider);
                            
                            // Show loading state
                            this.innerHTML = '<span class="icon">⏳</span> Connecting...';
                            this.style.pointerEvents = 'none';
                        });
                    });
                </script>
            </body>
            </html>
        `;
        
        res.send(loginPage);
    }
    
    // Initiate OAuth flow for specific provider
    async initiateProviderAuth(req, res) {
        const { provider } = req.params;
        const providerConfig = this.providers[provider];
        
        if (!providerConfig) {
            return res.status(400).json({ error: `Unsupported provider: ${provider}` });
        }
        
        try {
            // Generate state parameter for CSRF protection
            const state = this.generateSecureState();
            req.session = req.session || {};
            req.session[`${provider}_state`] = state;
            req.session[`${provider}_start_time`] = Date.now();
            
            // Build OAuth URL
            const authParams = new URLSearchParams({
                response_type: 'code',
                client_id: process.env[`${provider.toUpperCase()}_CLIENT_ID`],
                redirect_uri: `${process.env.BASE_URL}/auth/soulfra/callback/${provider}`,
                scope: providerConfig.scopes.join(' '),
                state: state
            });
            
            const authUrl = `${providerConfig.authUrl}?${authParams}`;
            
            console.log(`🔐 Initiating ${providerConfig.name} OAuth for Cal's cookies...`);
            res.redirect(authUrl);
            
        } catch (error) {
            console.error(`Error initiating ${provider} auth:`, error);
            res.redirect('/auth/soulfra/login?error=auth_init_failed');
        }
    }
    
    // Handle OAuth callbacks from providers
    async handleProviderCallback(req, res) {
        const { provider } = req.params;
        const { code, error, state } = req.query;
        const providerConfig = this.providers[provider];
        
        if (!providerConfig) {
            return res.redirect('/auth/soulfra/login?error=unsupported_provider');
        }
        
        try {
            // Check for OAuth errors
            if (error) {
                console.error(`${provider} OAuth error:`, error);
                return res.redirect(`/auth/soulfra/login?error=${provider}_auth_failed`);
            }
            
            // Verify state parameter (CSRF protection)
            const expectedState = req.session?.[`${provider}_state`];
            if (!state || state !== expectedState) {
                console.error(`${provider} OAuth state mismatch`);
                return res.redirect('/auth/soulfra/login?error=state_mismatch');
            }
            
            // Calculate authentication time for Cal's cookie bonus
            const startTime = req.session?.[`${provider}_start_time`] || Date.now();
            const authDuration = Date.now() - startTime;
            
            // Exchange code for access token
            const tokenData = await this.exchangeCodeForToken(provider, code);
            
            // Get user profile from provider
            const userProfile = await this.getUserProfile(provider, tokenData.access_token);
            
            // Determine if this is a first-time user for bonus cookies
            const isFirstTime = await this.isFirstTimeUser(userProfile.email);
            
            // Create or update user in database
            const user = await this.createOrUpdateUser(provider, userProfile, tokenData);
            
            // Generate JWT for our system
            const jwt = require('jsonwebtoken');
            const token = jwt.sign(
                { 
                    userId: user.id,
                    email: user.email,
                    role: user.role,
                    loginMethod: provider,
                    socialProvider: provider
                },
                process.env.JWT_SECRET || 'fallback-secret',
                { expiresIn: '7d' }
            );
            
            // 🍪 REWARD CAL WITH COOKIES! 🍪
            const cookieMetadata = {
                isFirstTime,
                hasProfilePicture: !!userProfile.avatar,
                authDuration,
                provider: provider,
                userAgent: req.get('User-Agent')
            };
            
            const cookieReward = await this.calCookieMonster.earnCookie(
                user.id, 
                provider, 
                'social_login', 
                cookieMetadata
            );
            
            // Clean up session
            if (req.session) {
                delete req.session[`${provider}_state`];
                delete req.session[`${provider}_start_time`];
            }
            
            // Redirect to portfolio with success
            const redirectUrl = `/professional-portfolio.html?token=${token}&auth=${provider}_success&cookies=${cookieReward.totalCookies}`;
            res.redirect(redirectUrl);
            
            console.log(`🎉 ${providerConfig.name} login successful! Cal earned cookies: ${JSON.stringify(cookieReward)}`);
            
        } catch (error) {
            console.error(`${provider} callback error:`, error);
            res.redirect(`/auth/soulfra/login?error=${provider}_callback_failed`);
        }
    }
    
    // Exchange authorization code for access token
    async exchangeCodeForToken(provider, code) {
        const providerConfig = this.providers[provider];
        
        const tokenParams = {
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: `${process.env.BASE_URL}/auth/soulfra/callback/${provider}`,
            client_id: process.env[`${provider.toUpperCase()}_CLIENT_ID`],
            client_secret: process.env[`${provider.toUpperCase()}_CLIENT_SECRET`]
        };
        
        const response = await fetch(providerConfig.tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            body: new URLSearchParams(tokenParams)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Token exchange failed for ${provider}: ${response.status} - ${errorText}`);
        }
        
        return response.json();
    }
    
    // Get user profile from provider API
    async getUserProfile(provider, accessToken) {
        const providerConfig = this.providers[provider];
        
        // Get basic profile
        const profileResponse = await fetch(providerConfig.profileUrl, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json'
            }
        });
        
        if (!profileResponse.ok) {
            throw new Error(`Profile fetch failed for ${provider}: ${profileResponse.status}`);
        }
        
        const profile = await profileResponse.json();
        
        // Get email if separate endpoint
        let email = profile.email;
        if (!email && providerConfig.emailUrl) {
            try {
                const emailResponse = await fetch(providerConfig.emailUrl, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Accept': 'application/json'
                    }
                });
                
                if (emailResponse.ok) {
                    const emailData = await emailResponse.json();
                    email = this.extractEmailFromResponse(provider, emailData);
                }
            } catch (emailError) {
                console.warn(`Could not fetch email for ${provider}:`, emailError);
            }
        }
        
        // Normalize profile data across providers
        return this.normalizeProfileData(provider, profile, email);
    }
    
    // Normalize profile data structure across different providers
    normalizeProfileData(provider, profile, email) {
        switch (provider) {
            case 'linkedin':
                return {
                    providerId: profile.id,
                    email: email,
                    name: `${profile.firstName?.localized?.en_US || ''} ${profile.lastName?.localized?.en_US || ''}`.trim(),
                    avatar: profile.profilePicture?.['displayImage~']?.elements?.[0]?.identifiers?.[0]?.identifier,
                    profileUrl: `https://linkedin.com/in/${profile.id}`
                };
                
            case 'google':
                return {
                    providerId: profile.id,
                    email: profile.email,
                    name: profile.name,
                    avatar: profile.picture,
                    profileUrl: profile.link
                };
                
            case 'github':
                return {
                    providerId: profile.id.toString(),
                    email: email || profile.email,
                    name: profile.name || profile.login,
                    avatar: profile.avatar_url,
                    profileUrl: profile.html_url
                };
                
            default:
                return {
                    providerId: profile.id?.toString(),
                    email: email,
                    name: profile.name || profile.login || 'Unknown',
                    avatar: profile.avatar_url || profile.picture,
                    profileUrl: profile.html_url || profile.link
                };
        }
    }
    
    // Extract email from provider-specific response format
    extractEmailFromResponse(provider, emailData) {
        switch (provider) {
            case 'linkedin':
                return emailData.elements?.[0]?.['handle~']?.emailAddress;
            case 'github':
                const primaryEmail = emailData.find(e => e.primary && e.verified);
                return primaryEmail?.email || emailData[0]?.email;
            default:
                return emailData.email;
        }
    }
    
    // Check if this is a first-time user (for cookie bonuses)
    async isFirstTimeUser(email) {
        try {
            const existing = await this.db.query(
                'SELECT id FROM users WHERE email = $1',
                [email]
            );
            return existing.rows.length === 0;
        } catch (error) {
            console.error('Error checking first-time user:', error);
            return false;
        }
    }
    
    // Create or update user with social login data
    async createOrUpdateUser(provider, profile, tokenData) {
        const { providerId, email, name, avatar, profileUrl } = profile;
        
        if (!email) {
            throw new Error(`Email is required for ${provider} authentication`);
        }
        
        // Check if user exists
        const existing = await this.db.query(
            'SELECT * FROM users WHERE email = $1 OR ' + provider + '_id = $2',
            [email, providerId]
        );
        
        if (existing.rows.length > 0) {
            // Update existing user
            const user = existing.rows[0];
            const updated = await this.db.query(`
                UPDATE users 
                SET ${provider}_id = $1,
                    ${provider}_url = $2,
                    avatar_url = COALESCE($3, avatar_url),
                    name = COALESCE($4, name),
                    preferred_login_method = $5,
                    last_login = NOW(),
                    login_count = login_count + 1,
                    updated_at = NOW()
                WHERE id = $6
                RETURNING *
            `, [providerId, profileUrl, avatar, name, provider, user.id]);
            
            return updated.rows[0];
        } else {
            // Create new user
            const newUser = await this.db.query(`
                INSERT INTO users (
                    email, name, ${provider}_id, ${provider}_url, avatar_url,
                    role, active, email_verified, preferred_login_method,
                    created_at, password_hash
                )
                VALUES ($1, $2, $3, $4, $5, 'viewer', true, true, $6, NOW(), '')
                RETURNING *
            `, [email, name, providerId, profileUrl, avatar, provider]);
            
            return newUser.rows[0];
        }
    }
    
    // Get Cal's cookie statistics
    async getCalStats(req, res) {
        try {
            const stats = await this.calCookieMonster.getCalStats();
            res.json(stats);
        } catch (error) {
            console.error('Error getting Cal stats:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    // Let Cal eat a cookie
    async eatCookie(req, res) {
        try {
            const { cookieId } = req.params;
            const result = await this.calCookieMonster.eatCookie(cookieId);
            res.json(result);
        } catch (error) {
            console.error('Error eating cookie:', error);
            res.status(500).json({ error: error.message });
        }
    }
    
    // Generate secure state parameter
    generateSecureState() {
        return require('crypto').randomBytes(32).toString('hex');
    }
    
    // Get the Express router
    getRouter() {
        return this.router;
    }
}

module.exports = SoulFraUniversalAuth;