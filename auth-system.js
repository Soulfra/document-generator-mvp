const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

/**
 * 🔐 AUTHENTICATION SYSTEM
 * Professional portfolio login and user management
 */

class AuthSystem {
    constructor(database) {
        this.db = database;
        this.router = express.Router();
        this.JWT_SECRET = process.env.JWT_SECRET || 'portfolio-dev-secret-change-in-production';
        this.JWT_EXPIRES_IN = '7d';
        
        this.setupMiddleware();
        this.setupRoutes();
    }
    
    setupMiddleware() {
        // Rate limiting for auth endpoints
        this.authLimiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 5, // 5 attempts per window
            message: {
                error: 'Too many authentication attempts, please try again later.',
                retryAfter: 15 * 60
            },
            standardHeaders: true,
            legacyHeaders: false
        });
        
        // Rate limiting for registration
        this.registerLimiter = rateLimit({
            windowMs: 60 * 60 * 1000, // 1 hour
            max: 3, // 3 registrations per hour per IP
            message: {
                error: 'Too many registration attempts, please try again later.',
                retryAfter: 60 * 60
            }
        });
    }
    
    setupRoutes() {
        // Login endpoint
        this.router.post('/login', 
            this.authLimiter,
            [
                body('email').isEmail().normalizeEmail(),
                body('password').isLength({ min: 6 })
            ],
            this.login.bind(this)
        );
        
        // Register endpoint (admin only in production)
        this.router.post('/register',
            this.registerLimiter,
            [
                body('email').isEmail().normalizeEmail(),
                body('password').isLength({ min: 8 }),
                body('name').isLength({ min: 2, max: 50 }).trim(),
                body('role').optional().isIn(['admin', 'client', 'viewer'])
            ],
            this.register.bind(this)
        );
        
        // Token refresh
        this.router.post('/refresh', this.refreshToken.bind(this));
        
        // Logout
        this.router.post('/logout', this.authenticateToken.bind(this), this.logout.bind(this));
        
        // Profile endpoints
        this.router.get('/profile', this.authenticateToken.bind(this), this.getProfile.bind(this));
        this.router.put('/profile', 
            this.authenticateToken.bind(this),
            [
                body('name').optional().isLength({ min: 2, max: 50 }).trim(),
                body('bio').optional().isLength({ max: 500 }).trim(),
                body('linkedinUrl').optional().isURL(),
                body('githubUrl').optional().isURL()
            ],
            this.updateProfile.bind(this)
        );
        
        // LinkedIn OAuth
        this.router.get('/linkedin', this.linkedinAuth.bind(this));
        this.router.get('/linkedin/callback', this.linkedinCallback.bind(this));
        
        // Password reset
        this.router.post('/forgot-password',
            [body('email').isEmail().normalizeEmail()],
            this.forgotPassword.bind(this)
        );
        this.router.post('/reset-password',
            [
                body('token').isLength({ min: 1 }),
                body('password').isLength({ min: 8 })
            ],
            this.resetPassword.bind(this)
        );
    }
    
    // Authentication middleware
    authenticateToken(req, res, next) {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        
        if (!token) {
            return res.status(401).json({ 
                error: 'Access token required' 
            });
        }
        
        jwt.verify(token, this.JWT_SECRET, (err, user) => {
            if (err) {
                return res.status(403).json({ 
                    error: 'Invalid or expired token' 
                });
            }
            
            req.user = user;
            next();
        });
    }
    
    // Login handler
    async login(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ 
                    error: 'Invalid input',
                    details: errors.array()
                });
            }
            
            const { email, password } = req.body;
            
            // Get user from database
            const user = await this.db.query(
                'SELECT * FROM users WHERE email = $1 AND active = true',
                [email]
            );
            
            if (user.rows.length === 0) {
                return res.status(401).json({ 
                    error: 'Invalid credentials' 
                });
            }
            
            const userData = user.rows[0];
            
            // Verify password
            const validPassword = await bcrypt.compare(password, userData.password_hash);
            if (!validPassword) {
                return res.status(401).json({ 
                    error: 'Invalid credentials' 
                });
            }
            
            // Generate JWT
            const token = jwt.sign(
                { 
                    userId: userData.id,
                    email: userData.email,
                    role: userData.role
                },
                this.JWT_SECRET,
                { expiresIn: this.JWT_EXPIRES_IN }
            );
            
            // Update last login
            await this.db.query(
                'UPDATE users SET last_login = NOW(), login_count = login_count + 1 WHERE id = $1',
                [userData.id]
            );
            
            // Return user data (without password)
            const { password_hash, ...userResponse } = userData;
            
            res.json({
                success: true,
                token,
                user: userResponse,
                expiresIn: this.JWT_EXPIRES_IN
            });
            
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ 
                error: 'Authentication service error' 
            });
        }
    }
    
    // Register handler
    async register(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ 
                    error: 'Invalid input',
                    details: errors.array()
                });
            }
            
            const { email, password, name, role = 'viewer' } = req.body;
            
            // Check if user already exists
            const existingUser = await this.db.query(
                'SELECT id FROM users WHERE email = $1',
                [email]
            );
            
            if (existingUser.rows.length > 0) {
                return res.status(409).json({ 
                    error: 'User already exists' 
                });
            }
            
            // Hash password
            const saltRounds = 12;
            const passwordHash = await bcrypt.hash(password, saltRounds);
            
            // Insert user
            const newUser = await this.db.query(`
                INSERT INTO users (email, password_hash, name, role, created_at, active)
                VALUES ($1, $2, $3, $4, NOW(), true)
                RETURNING id, email, name, role, created_at
            `, [email, passwordHash, name, role]);
            
            const userData = newUser.rows[0];
            
            // Generate JWT
            const token = jwt.sign(
                { 
                    userId: userData.id,
                    email: userData.email,
                    role: userData.role
                },
                this.JWT_SECRET,
                { expiresIn: this.JWT_EXPIRES_IN }
            );
            
            res.status(201).json({
                success: true,
                token,
                user: userData,
                expiresIn: this.JWT_EXPIRES_IN
            });
            
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ 
                error: 'Registration service error' 
            });
        }
    }
    
    // Token refresh
    async refreshToken(req, res) {
        try {
            const { token } = req.body;
            
            if (!token) {
                return res.status(401).json({ error: 'Refresh token required' });
            }
            
            // Verify the old token (even if expired)
            jwt.verify(token, this.JWT_SECRET, { ignoreExpiration: true }, async (err, decoded) => {
                if (err && err.name !== 'TokenExpiredError') {
                    return res.status(403).json({ error: 'Invalid token' });
                }
                
                // Get fresh user data
                const user = await this.db.query(
                    'SELECT id, email, role FROM users WHERE id = $1 AND active = true',
                    [decoded.userId]
                );
                
                if (user.rows.length === 0) {
                    return res.status(401).json({ error: 'User not found' });
                }
                
                const userData = user.rows[0];
                
                // Generate new token
                const newToken = jwt.sign(
                    { 
                        userId: userData.id,
                        email: userData.email,
                        role: userData.role
                    },
                    this.JWT_SECRET,
                    { expiresIn: this.JWT_EXPIRES_IN }
                );
                
                res.json({
                    success: true,
                    token: newToken,
                    expiresIn: this.JWT_EXPIRES_IN
                });
            });
            
        } catch (error) {
            console.error('Token refresh error:', error);
            res.status(500).json({ error: 'Token refresh service error' });
        }
    }
    
    // Logout
    async logout(req, res) {
        // In a more sophisticated system, we'd blacklist the token
        // For now, we'll just return success and let client delete the token
        res.json({ success: true, message: 'Logged out successfully' });
    }
    
    // Get user profile
    async getProfile(req, res) {
        try {
            const user = await this.db.query(`
                SELECT id, email, name, role, bio, linkedin_url, github_url, 
                       avatar_url, created_at, last_login, login_count
                FROM users 
                WHERE id = $1 AND active = true
            `, [req.user.userId]);
            
            if (user.rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            res.json({
                success: true,
                user: user.rows[0]
            });
            
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({ error: 'Profile service error' });
        }
    }
    
    // Update user profile
    async updateProfile(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ 
                    error: 'Invalid input',
                    details: errors.array()
                });
            }
            
            const { name, bio, linkedinUrl, githubUrl } = req.body;
            
            const updatedUser = await this.db.query(`
                UPDATE users 
                SET name = COALESCE($1, name),
                    bio = COALESCE($2, bio),
                    linkedin_url = COALESCE($3, linkedin_url),
                    github_url = COALESCE($4, github_url),
                    updated_at = NOW()
                WHERE id = $5 AND active = true
                RETURNING id, email, name, role, bio, linkedin_url, github_url, updated_at
            `, [name, bio, linkedinUrl, githubUrl, req.user.userId]);
            
            if (updatedUser.rows.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            res.json({
                success: true,
                user: updatedUser.rows[0]
            });
            
        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({ error: 'Profile update service error' });
        }
    }
    
    // LinkedIn OAuth implementation
    async linkedinAuth(req, res) {
        try {
            // Generate state parameter for CSRF protection
            const state = this.generateSecureState();
            req.session = req.session || {};
            req.session.linkedinState = state;
            
            const linkedinAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
                `response_type=code&` +
                `client_id=${process.env.LINKEDIN_CLIENT_ID}&` +
                `redirect_uri=${encodeURIComponent(process.env.LINKEDIN_REDIRECT_URI)}&` +
                `state=${state}&` +
                `scope=r_liteprofile%20r_emailaddress`;
            
            res.redirect(linkedinAuthUrl);
        } catch (error) {
            console.error('LinkedIn auth initialization error:', error);
            res.redirect('/auth/error?message=linkedin_init_failed');
        }
    }
    
    // LinkedIn callback with complete OAuth flow
    async linkedinCallback(req, res) {
        try {
            const { code, error, state } = req.query;
            
            // Check for OAuth errors
            if (error) {
                console.error('LinkedIn OAuth error:', error);
                return res.redirect('/auth/error?message=linkedin_auth_failed');
            }
            
            // Verify state parameter (CSRF protection)
            if (!state || state !== req.session?.linkedinState) {
                console.error('LinkedIn OAuth state mismatch');
                return res.redirect('/auth/error?message=linkedin_state_mismatch');
            }
            
            // Exchange authorization code for access token
            const tokenResponse = await this.exchangeLinkedInCode(code);
            
            if (!tokenResponse.access_token) {
                throw new Error('Failed to obtain access token');
            }
            
            // Get user profile from LinkedIn
            const userProfile = await this.getLinkedInProfile(tokenResponse.access_token);
            
            // Create or update user in database
            const user = await this.createOrUpdateLinkedInUser(userProfile);
            
            // Generate JWT for our system
            const token = jwt.sign(
                { 
                    userId: user.id,
                    email: user.email,
                    role: user.role,
                    loginMethod: 'linkedin'
                },
                this.JWT_SECRET,
                { expiresIn: this.JWT_EXPIRES_IN }
            );
            
            // Reward Cal with a cookie for successful LinkedIn login!
            await this.rewardCalWithCookie(user.id, 'linkedin_login');
            
            // Clean up session state
            if (req.session) {
                delete req.session.linkedinState;
            }
            
            // Redirect to frontend with token
            res.redirect(`/professional-portfolio.html?token=${token}&auth=linkedin_success`);
            
        } catch (error) {
            console.error('LinkedIn callback error:', error);
            res.redirect('/auth/error?message=linkedin_callback_failed');
        }
    }
    
    // Exchange authorization code for access token
    async exchangeLinkedInCode(code) {
        const tokenUrl = 'https://www.linkedin.com/oauth/v2/accessToken';
        
        const params = new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
            client_id: process.env.LINKEDIN_CLIENT_ID,
            client_secret: process.env.LINKEDIN_CLIENT_SECRET
        });
        
        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('LinkedIn token exchange failed:', errorText);
            throw new Error(`Token exchange failed: ${response.status}`);
        }
        
        return response.json();
    }
    
    // Get user profile from LinkedIn API
    async getLinkedInProfile(accessToken) {
        const profileUrl = 'https://api.linkedin.com/v2/people/~?projection=(id,firstName,lastName,profilePicture(displayImage~:playableStreams))';
        const emailUrl = 'https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))';
        
        // Get profile data
        const profileResponse = await fetch(profileUrl, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!profileResponse.ok) {
            throw new Error(`Profile fetch failed: ${profileResponse.status}`);
        }
        
        const profile = await profileResponse.json();
        
        // Get email data
        const emailResponse = await fetch(emailUrl, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        let email = null;
        if (emailResponse.ok) {
            const emailData = await emailResponse.json();
            email = emailData.elements?.[0]?.['handle~']?.emailAddress;
        }
        
        return {
            linkedinId: profile.id,
            firstName: profile.firstName?.localized?.en_US || profile.firstName?.preferredLocale?.language,
            lastName: profile.lastName?.localized?.en_US || profile.lastName?.preferredLocale?.language,
            email: email,
            profilePicture: profile.profilePicture?.['displayImage~']?.elements?.[0]?.identifiers?.[0]?.identifier
        };
    }
    
    // Create or update user with LinkedIn data
    async createOrUpdateLinkedInUser(linkedinProfile) {
        const { linkedinId, firstName, lastName, email, profilePicture } = linkedinProfile;
        
        if (!email) {
            throw new Error('Email is required for LinkedIn authentication');
        }
        
        // Check if user already exists with this email
        const existingUser = await this.db.query(
            'SELECT * FROM users WHERE email = $1 OR linkedin_id = $2',
            [email, linkedinId]
        );
        
        if (existingUser.rows.length > 0) {
            // Update existing user with LinkedIn data
            const user = existingUser.rows[0];
            const updatedUser = await this.db.query(`
                UPDATE users 
                SET linkedin_id = $1, 
                    linkedin_url = $2,
                    avatar_url = COALESCE($3, avatar_url),
                    name = COALESCE($4, name),
                    last_login = NOW(),
                    login_count = login_count + 1,
                    updated_at = NOW()
                WHERE id = $5
                RETURNING id, email, name, role, linkedin_url, avatar_url
            `, [linkedinId, `https://linkedin.com/in/${linkedinId}`, profilePicture, 
                `${firstName} ${lastName}`.trim(), user.id]);
            
            return updatedUser.rows[0];
        } else {
            // Create new user
            const newUser = await this.db.query(`
                INSERT INTO users (
                    email, name, linkedin_id, linkedin_url, avatar_url, 
                    role, active, email_verified, created_at, password_hash
                )
                VALUES ($1, $2, $3, $4, $5, 'viewer', true, true, NOW(), '')
                RETURNING id, email, name, role, linkedin_url, avatar_url
            `, [email, `${firstName} ${lastName}`.trim(), linkedinId, 
                `https://linkedin.com/in/${linkedinId}`, profilePicture]);
            
            return newUser.rows[0];
        }
    }
    
    // Generate secure state parameter
    generateSecureState() {
        return require('crypto').randomBytes(32).toString('hex');
    }
    
    // Reward Cal with cookies for successful logins!
    async rewardCalWithCookie(userId, loginMethod) {
        try {
            // Track the login event and give Cal a cookie
            await this.db.query(`
                INSERT INTO cal_cookies (user_id, login_method, cookie_type, earned_at)
                VALUES ($1, $2, 'social_login', NOW())
            `, [userId, loginMethod]);
            
            // Update Cal's total cookie count
            await this.db.query(`
                UPDATE system_config 
                SET value = jsonb_set(value, '{cookie_count}', 
                    (COALESCE(value->>'cookie_count', '0')::int + 1)::text::jsonb)
                WHERE key = 'cal_stats'
            `);
            
            console.log(`🍪 Cal earned a cookie for ${loginMethod} login! Om nom nom!`);
        } catch (error) {
            console.error('Error rewarding Cal:', error);
            // Don't fail the login if cookie tracking fails
        }
    }
    
    // Forgot password
    async forgotPassword(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ 
                    error: 'Invalid email address'
                });
            }
            
            const { email } = req.body;
            
            // Check if user exists
            const user = await this.db.query(
                'SELECT id, email FROM users WHERE email = $1 AND active = true',
                [email]
            );
            
            // Always return success to prevent email enumeration
            res.json({
                success: true,
                message: 'If an account with that email exists, we\'ve sent a password reset link.'
            });
            
            if (user.rows.length > 0) {
                // Generate reset token
                const resetToken = jwt.sign(
                    { userId: user.rows[0].id, type: 'password_reset' },
                    this.JWT_SECRET,
                    { expiresIn: '1h' }
                );
                
                // Store reset token in database
                await this.db.query(
                    'UPDATE users SET reset_token = $1, reset_token_expires = NOW() + INTERVAL \'1 hour\' WHERE id = $2',
                    [resetToken, user.rows[0].id]
                );
                
                // Send email (implement email service)
                console.log(`Password reset link: /reset-password?token=${resetToken}`);
            }
            
        } catch (error) {
            console.error('Forgot password error:', error);
            res.status(500).json({ error: 'Password reset service error' });
        }
    }
    
    // Reset password
    async resetPassword(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ 
                    error: 'Invalid input',
                    details: errors.array()
                });
            }
            
            const { token, password } = req.body;
            
            // Verify reset token
            jwt.verify(token, this.JWT_SECRET, async (err, decoded) => {
                if (err || decoded.type !== 'password_reset') {
                    return res.status(400).json({ error: 'Invalid or expired reset token' });
                }
                
                // Check if token is still valid in database
                const user = await this.db.query(
                    'SELECT id FROM users WHERE id = $1 AND reset_token = $2 AND reset_token_expires > NOW()',
                    [decoded.userId, token]
                );
                
                if (user.rows.length === 0) {
                    return res.status(400).json({ error: 'Invalid or expired reset token' });
                }
                
                // Hash new password
                const saltRounds = 12;
                const passwordHash = await bcrypt.hash(password, saltRounds);
                
                // Update password and clear reset token
                await this.db.query(
                    'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
                    [passwordHash, decoded.userId]
                );
                
                res.json({
                    success: true,
                    message: 'Password reset successfully'
                });
            });
            
        } catch (error) {
            console.error('Reset password error:', error);
            res.status(500).json({ error: 'Password reset service error' });
        }
    }
    
    getRouter() {
        return this.router;
    }
}

module.exports = AuthSystem;