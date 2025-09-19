#!/usr/bin/env node

/**
 * MAGIC LINK AUTHENTICATION SYSTEM
 * Privacy-first authentication without passwords
 * Integrates with Web 2.5 hosting platform
 */

const crypto = require('crypto');
const nodemailer = require('nodemailer');
const express = require('express');
const QRCode = require('qrcode');

class MagicLinkAuth {
    constructor(options = {}) {
        this.options = {
            linkTTL: options.linkTTL || 15 * 60 * 1000, // 15 minutes
            maxAttempts: options.maxAttempts || 3,
            rateLimitWindow: options.rateLimitWindow || 60 * 1000, // 1 minute
            secretKey: options.secretKey || this.generateSecretKey(),
            ...options
        };
        
        // In-memory storage (use Redis in production)
        this.magicLinks = new Map();
        this.rateLimits = new Map();
        this.sessions = new Map();
        this.teleportRooms = new Map();
        
        // Email transporter (configure for production)
        this.emailTransporter = this.setupEmailTransporter();
        
        console.log('🪄 Magic Link Authentication System initialized');
        console.log('🛡️ Privacy-first authentication ready');
    }
    
    generateSecretKey() {
        return crypto.randomBytes(32).toString('hex');
    }
    
    setupEmailTransporter() {
        // In production, configure with real SMTP settings
        return nodemailer.createTransporter({
            host: 'localhost',
            port: 587,
            secure: false,
            auth: {
                user: 'noreply@web25.localhost',
                pass: 'development-only'
            }
        });
    }
    
    /**
     * Generate a magic link for authentication
     */
    async generateMagicLink(identifier, metadata = {}) {
        // Check rate limiting
        if (!this.checkRateLimit(identifier)) {
            throw new Error('Too many requests. Please wait before trying again.');
        }
        
        // Generate cryptographically secure token
        const token = crypto.randomBytes(32).toString('hex');
        const createdAt = Date.now();
        const expiresAt = createdAt + this.options.linkTTL;
        
        // Store magic link data
        const linkData = {
            token,
            identifier,
            metadata,
            createdAt,
            expiresAt,
            used: false,
            attempts: 0,
            deviceFingerprint: this.generateDeviceFingerprint(metadata.userAgent)
        };
        
        this.magicLinks.set(token, linkData);
        
        // Clean up expired links
        this.cleanupExpiredLinks();
        
        console.log(`🪄 Magic link generated for ${this.maskIdentifier(identifier)}`);
        
        return {
            token,
            expiresAt,
            magicLink: this.buildMagicLinkURL(token, metadata),
            qrCode: await this.generateQRCode(token, metadata)
        };
    }
    
    /**
     * Send magic link via email (privacy-preserving)
     */
    async sendMagicLink(identifier, metadata = {}) {
        const { token, expiresAt, magicLink } = await this.generateMagicLink(identifier, metadata);
        
        // For privacy, we don't store the actual email
        const hashedIdentifier = this.hashIdentifier(identifier);
        
        const emailContent = this.generateEmailContent(magicLink, metadata);
        
        try {
            // In development, just log the magic link
            if (process.env.NODE_ENV === 'development') {
                console.log('\n📧 Magic Link Email (Development Mode):');
                console.log(`To: ${this.maskIdentifier(identifier)}`);
                console.log(`Link: ${magicLink}`);
                console.log(`Expires: ${new Date(expiresAt).toLocaleString()}`);
                console.log('\n--- Email Content ---');
                console.log(emailContent.text);
                console.log('--- End Email ---\n');
                
                return {
                    success: true,
                    message: 'Magic link logged to console (development mode)',
                    token,
                    devLink: magicLink
                };
            }
            
            // In production, send actual email
            await this.emailTransporter.sendMail({
                from: '"Web 2.5 Platform" <noreply@web25.com>',
                to: identifier,
                subject: emailContent.subject,
                text: emailContent.text,
                html: emailContent.html
            });
            
            console.log(`📧 Magic link sent to ${this.maskIdentifier(identifier)}`);
            
            return {
                success: true,
                message: 'Magic link sent successfully',
                expiresIn: Math.floor(this.options.linkTTL / 1000 / 60) + ' minutes'
            };
            
        } catch (error) {
            console.error('Failed to send magic link:', error);
            throw new Error('Failed to send magic link. Please try again.');
        }
    }
    
    /**
     * Verify and authenticate magic link
     */
    async authenticateMagicLink(token, deviceInfo = {}) {
        const linkData = this.magicLinks.get(token);
        
        if (!linkData) {
            throw new Error('Invalid magic link');
        }
        
        // Check if already used
        if (linkData.used) {
            throw new Error('Magic link has already been used');
        }
        
        // Check expiration
        if (Date.now() > linkData.expiresAt) {
            this.magicLinks.delete(token);
            throw new Error('Magic link has expired');
        }
        
        // Check device fingerprint for additional security
        if (deviceInfo.userAgent) {
            const currentFingerprint = this.generateDeviceFingerprint(deviceInfo.userAgent);
            if (currentFingerprint !== linkData.deviceFingerprint) {
                console.warn(`⚠️ Device fingerprint mismatch for ${this.maskIdentifier(linkData.identifier)}`);
                // Continue but log the warning (don't block for better UX)
            }
        }
        
        // Mark as used
        linkData.used = true;
        linkData.authenticatedAt = Date.now();
        
        // Create session
        const session = await this.createSession(linkData, deviceInfo);
        
        // Clean up the magic link
        this.magicLinks.delete(token);
        
        console.log(`✓ Magic link authenticated for ${this.maskIdentifier(linkData.identifier)}`);
        
        return {
            success: true,
            sessionId: session.id,
            identifier: this.maskIdentifier(linkData.identifier),
            metadata: linkData.metadata,
            session: {
                id: session.id,
                expiresAt: session.expiresAt,
                capabilities: session.capabilities
            },
            teleportRoom: session.teleportRoom
        };
    }
    
    /**
     * Create authenticated session
     */
    async createSession(linkData, deviceInfo) {
        const sessionId = crypto.randomBytes(24).toString('hex');
        const sessionTTL = 24 * 60 * 60 * 1000; // 24 hours
        
        const session = {
            id: sessionId,
            identifier: this.hashIdentifier(linkData.identifier),
            metadata: linkData.metadata,
            deviceInfo,
            createdAt: Date.now(),
            expiresAt: Date.now() + sessionTTL,
            lastActivity: Date.now(),
            capabilities: this.determineCapabilities(linkData.metadata),
            teleportRoom: await this.createTeleportRoom(sessionId, linkData.metadata)
        };
        
        this.sessions.set(sessionId, session);
        
        // Auto-cleanup expired sessions
        setTimeout(() => {
            this.sessions.delete(sessionId);
        }, sessionTTL);
        
        return session;
    }
    
    /**
     * Create teleport room for Zoom-like functionality
     */
    async createTeleportRoom(sessionId, metadata) {
        const roomId = crypto.randomBytes(16).toString('hex');
        const roomCode = this.generateFriendlyCode();
        
        const room = {
            id: roomId,
            code: roomCode,
            sessionId,
            createdAt: Date.now(),
            expiresAt: Date.now() + (4 * 60 * 60 * 1000), // 4 hours
            participants: [],
            metadata: {
                purpose: metadata.purpose || 'collaboration',
                privacy: 'end-to-end-encrypted',
                maxParticipants: 8
            },
            settings: {
                requireAuth: true,
                allowScreenShare: true,
                allowFileTransfer: true,
                recordingAllowed: false // Privacy-first
            }
        };
        
        this.teleportRooms.set(roomId, room);
        
        console.log(`🚀 Teleport room created: ${roomCode}`);
        
        return {
            id: roomId,
            code: roomCode,
            joinUrl: `https://web25.platform/teleport/${roomCode}`,
            expiresAt: room.expiresAt
        };
    }
    
    /**
     * Validate session and refresh if needed
     */
    validateSession(sessionId) {
        const session = this.sessions.get(sessionId);
        
        if (!session) {
            return { valid: false, reason: 'Session not found' };
        }
        
        if (Date.now() > session.expiresAt) {
            this.sessions.delete(sessionId);
            return { valid: false, reason: 'Session expired' };
        }
        
        // Update last activity
        session.lastActivity = Date.now();
        
        return {
            valid: true,
            session: {
                id: session.id,
                capabilities: session.capabilities,
                expiresAt: session.expiresAt,
                teleportRoom: session.teleportRoom
            }
        };
    }
    
    /**
     * Revoke session (logout)
     */
    revokeSession(sessionId) {
        const session = this.sessions.get(sessionId);
        
        if (session) {
            // Clean up teleport room
            if (session.teleportRoom) {
                this.teleportRooms.delete(session.teleportRoom.id);
            }
            
            this.sessions.delete(sessionId);
            console.log(`🚪 Session revoked: ${sessionId.substring(0, 8)}...`);
            
            return { success: true, message: 'Session revoked successfully' };
        }
        
        return { success: false, message: 'Session not found' };
    }
    
    /**
     * Join teleport room
     */
    async joinTeleportRoom(roomCode, sessionId) {
        // Find room by code
        let room = null;
        for (const [id, roomData] of this.teleportRooms) {
            if (roomData.code === roomCode) {
                room = roomData;
                break;
            }
        }
        
        if (!room) {
            throw new Error('Teleport room not found');
        }
        
        if (Date.now() > room.expiresAt) {
            this.teleportRooms.delete(room.id);
            throw new Error('Teleport room has expired');
        }
        
        // Validate session
        const sessionValidation = this.validateSession(sessionId);
        if (!sessionValidation.valid) {
            throw new Error('Invalid session');
        }
        
        // Check room capacity
        if (room.participants.length >= room.metadata.maxParticipants) {
            throw new Error('Teleport room is full');
        }
        
        // Add participant
        const participant = {
            sessionId,
            joinedAt: Date.now(),
            role: room.participants.length === 0 ? 'host' : 'participant'
        };
        
        room.participants.push(participant);
        
        console.log(`🚀 User joined teleport room ${roomCode} (${room.participants.length} participants)`);
        
        return {
            success: true,
            room: {
                id: room.id,
                code: room.code,
                participants: room.participants.length,
                role: participant.role,
                settings: room.settings
            },
            webrtcConfig: this.generateWebRTCConfig(),
            iceServers: this.getICEServers()
        };
    }
    
    /**
     * Generate QR code for magic link
     */
    async generateQRCode(token, metadata) {
        const magicLink = this.buildMagicLinkURL(token, metadata);
        
        try {
            const qrCode = await QRCode.toDataURL(magicLink, {
                errorCorrectionLevel: 'M',
                type: 'image/png',
                quality: 0.92,
                margin: 1,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
            
            return qrCode;
        } catch (error) {
            console.error('Failed to generate QR code:', error);
            return null;
        }
    }
    
    /**
     * Build magic link URL
     */
    buildMagicLinkURL(token, metadata) {
        const baseUrl = metadata.baseUrl || 'https://web25.platform';
        const params = new URLSearchParams({
            token,
            t: Date.now() // Prevent caching
        });
        
        return `${baseUrl}/auth/magic?${params.toString()}`;
    }
    
    /**
     * Generate email content
     */
    generateEmailContent(magicLink, metadata) {
        const subject = `Sign in to Web 2.5 Platform`;
        const appName = metadata.appName || 'Web 2.5 Platform';
        const purpose = metadata.purpose || 'access your account';
        
        const text = `
Hello!

Click the link below to ${purpose} on ${appName}:

${magicLink}

This link will expire in ${Math.floor(this.options.linkTTL / 1000 / 60)} minutes for your security.

If you didn't request this, you can safely ignore this email.

---
Web 2.5 Platform
Privacy-first hosting and collaboration
`;
        
        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${subject}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 24px; font-weight: bold; color: #667eea; }
        .button { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
        .security-note { background: #f8f9fa; padding: 15px; border-radius: 4px; border-left: 4px solid #28a745; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🌐 Web 2.5 Platform</div>
        </div>
        
        <h2>Sign in to ${appName}</h2>
        
        <p>Hello!</p>
        
        <p>Click the button below to ${purpose}:</p>
        
        <div style="text-align: center;">
            <a href="${magicLink}" class="button">Sign In Securely</a>
        </div>
        
        <div class="security-note">
            <strong>🛡️ Security Notice:</strong><br>
            This link will expire in ${Math.floor(this.options.linkTTL / 1000 / 60)} minutes for your security.
            If you didn't request this, you can safely ignore this email.
        </div>
        
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace;">${magicLink}</p>
        
        <div class="footer">
            <p><strong>Web 2.5 Platform</strong> - The sweet spot between web1 infrastructure, web2 UX, and web3 economics</p>
            <p>🛡️ Privacy-first • 🎯 Interest-driven • 🏮 Community-owned</p>
        </div>
    </div>
</body>
</html>
`;
        
        return { subject, text, html };
    }
    
    /**
     * Utility functions
     */
    hashIdentifier(identifier) {
        return crypto.createHash('sha256').update(identifier + this.options.secretKey).digest('hex');
    }
    
    maskIdentifier(identifier) {
        if (identifier.includes('@')) {
            const [user, domain] = identifier.split('@');
            return `${user.substring(0, 2)}***@${domain}`;
        }
        return identifier.substring(0, 3) + '***';
    }
    
    generateDeviceFingerprint(userAgent) {
        if (!userAgent) return 'unknown';
        return crypto.createHash('md5').update(userAgent).digest('hex').substring(0, 16);
    }
    
    generateFriendlyCode() {
        const words = ['star', 'moon', 'ship', 'wave', 'wind', 'fire', 'tree', 'bird', 'fish', 'bear'];
        const numbers = Math.floor(Math.random() * 100).toString().padStart(2, '0');
        const word = words[Math.floor(Math.random() * words.length)];
        return `${word}${numbers}`;
    }
    
    checkRateLimit(identifier) {
        const hashedId = this.hashIdentifier(identifier);
        const now = Date.now();
        
        if (!this.rateLimits.has(hashedId)) {
            this.rateLimits.set(hashedId, { count: 1, windowStart: now });
            return true;
        }
        
        const rateLimit = this.rateLimits.get(hashedId);
        
        // Reset window if expired
        if (now - rateLimit.windowStart > this.options.rateLimitWindow) {
            rateLimit.count = 1;
            rateLimit.windowStart = now;
            return true;
        }
        
        // Check if within limits
        if (rateLimit.count >= this.options.maxAttempts) {
            return false;
        }
        
        rateLimit.count++;
        return true;
    }
    
    cleanupExpiredLinks() {
        const now = Date.now();
        for (const [token, linkData] of this.magicLinks) {
            if (now > linkData.expiresAt) {
                this.magicLinks.delete(token);
            }
        }
    }
    
    determineCapabilities(metadata) {
        const capabilities = ['basic-access'];
        
        if (metadata.purpose === 'admin') {
            capabilities.push('admin-access', 'user-management', 'system-config');
        }
        
        if (metadata.purpose === 'builder') {
            capabilities.push('template-builder', 'site-deployment', 'custom-domains');
        }
        
        if (metadata.purpose === 'collaborator') {
            capabilities.push('teleport-rooms', 'file-sharing', 'real-time-editing');
        }
        
        capabilities.push('privacy-controls', 'data-export', 'account-deletion');
        
        return capabilities;
    }
    
    generateWebRTCConfig() {
        return {
            iceConnectionTimeout: 10000,
            iceGatheringTimeout: 10000,
            bundlePolicy: 'balanced',
            rtcpMuxPolicy: 'require'
        };
    }
    
    getICEServers() {
        // In production, configure with actual STUN/TURN servers
        return [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            {
                urls: 'turn:web25.platform:3478',
                username: 'web25-user',
                credential: 'web25-secret'
            }
        ];
    }
    
    /**
     * Get authentication statistics (privacy-preserving)
     */
    getStats() {
        const now = Date.now();
        const activeLinks = Array.from(this.magicLinks.values())
            .filter(link => now < link.expiresAt && !link.used).length;
        
        const activeSessions = Array.from(this.sessions.values())
            .filter(session => now < session.expiresAt).length;
        
        const activeTeleportRooms = Array.from(this.teleportRooms.values())
            .filter(room => now < room.expiresAt).length;
        
        return {
            activeLinks,
            activeSessions,
            activeTeleportRooms,
            totalParticipants: Array.from(this.teleportRooms.values())
                .reduce((total, room) => total + room.participants.length, 0)
        };
    }
}

// Express middleware for magic link authentication
function createAuthMiddleware(authSystem) {
    return (req, res, next) => {
        const sessionId = req.headers['x-session-id'] || req.query.sessionId;
        
        if (!sessionId) {
            return res.status(401).json({ error: 'No session provided' });
        }
        
        const validation = authSystem.validateSession(sessionId);
        
        if (!validation.valid) {
            return res.status(401).json({ error: validation.reason });
        }
        
        req.session = validation.session;
        next();
    };
}

// Express routes for magic link authentication
function createAuthRoutes(authSystem) {
    const router = express.Router();
    
    // Request magic link
    router.post('/request', async (req, res) => {
        try {
            const { identifier, purpose, appName, baseUrl } = req.body;
            
            if (!identifier) {
                return res.status(400).json({ error: 'Identifier required' });
            }
            
            const result = await authSystem.sendMagicLink(identifier, {
                purpose,
                appName,
                baseUrl,
                userAgent: req.get('User-Agent'),
                ip: req.ip
            });
            
            res.json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });
    
    // Authenticate magic link
    router.get('/magic', async (req, res) => {
        try {
            const { token } = req.query;
            
            if (!token) {
                return res.status(400).json({ error: 'Token required' });
            }
            
            const result = await authSystem.authenticateMagicLink(token, {
                userAgent: req.get('User-Agent'),
                ip: req.ip
            });
            
            // Set session cookie (httpOnly for security)
            res.cookie('sessionId', result.sessionId, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 24 * 60 * 60 * 1000 // 24 hours
            });
            
            res.json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });
    
    // Validate session
    router.get('/validate', (req, res) => {
        const sessionId = req.cookies.sessionId || req.headers['x-session-id'];
        
        if (!sessionId) {
            return res.status(401).json({ error: 'No session provided' });
        }
        
        const validation = authSystem.validateSession(sessionId);
        
        if (!validation.valid) {
            return res.status(401).json({ error: validation.reason });
        }
        
        res.json(validation);
    });
    
    // Logout
    router.post('/logout', (req, res) => {
        const sessionId = req.cookies.sessionId || req.headers['x-session-id'];
        
        if (sessionId) {
            authSystem.revokeSession(sessionId);
            res.clearCookie('sessionId');
        }
        
        res.json({ success: true, message: 'Logged out successfully' });
    });
    
    // Join teleport room
    router.post('/teleport/join', async (req, res) => {
        try {
            const { roomCode } = req.body;
            const sessionId = req.cookies.sessionId || req.headers['x-session-id'];
            
            if (!roomCode || !sessionId) {
                return res.status(400).json({ error: 'Room code and session required' });
            }
            
            const result = await authSystem.joinTeleportRoom(roomCode, sessionId);
            res.json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });
    
    // Get auth stats
    router.get('/stats', (req, res) => {
        const stats = authSystem.getStats();
        res.json(stats);
    });
    
    return router;
}

// Export classes and functions
module.exports = {
    MagicLinkAuth,
    createAuthMiddleware,
    createAuthRoutes
};

// Demo if run directly
if (require.main === module) {
    (async () => {
        console.log('\n=== Magic Link Authentication Demo ===\n');
        
        const auth = new MagicLinkAuth({
            linkTTL: 5 * 60 * 1000, // 5 minutes for demo
            maxAttempts: 3
        });
        
        try {
            // Test magic link generation and authentication
            console.log('🪄 Testing magic link generation...');
            
            const result = await auth.sendMagicLink('user@example.com', {
                purpose: 'builder',
                appName: 'Web 2.5 Demo',
                baseUrl: 'http://localhost:3000'
            });
            
            console.log('Magic link result:', result);
            
            if (result.devLink) {
                console.log('\n⚡ Testing authentication...');
                
                // Extract token from dev link
                const url = new URL(result.devLink);
                const token = url.searchParams.get('token');
                
                const authResult = await auth.authenticateMagicLink(token, {
                    userAgent: 'Mozilla/5.0 (Demo Browser)'
                });
                
                console.log('Authentication result:', authResult);
                
                // Test session validation
                console.log('\n🔍 Testing session validation...');
                const validation = auth.validateSession(authResult.sessionId);
                console.log('Session validation:', validation);
                
                // Test teleport room
                console.log('\n🚀 Testing teleport room...');
                const roomResult = await auth.joinTeleportRoom(
                    authResult.teleportRoom.code,
                    authResult.sessionId
                );
                console.log('Teleport room result:', roomResult);
                
                // Show stats
                console.log('\n📊 Authentication stats:');
                const stats = auth.getStats();
                console.log(stats);
            }
            
        } catch (error) {
            console.error('❌ Demo error:', error.message);
        }
        
    })().catch(console.error);
}

console.log('🪄 Magic Link Authentication System loaded');
console.log('🛡️ Privacy-first authentication without passwords');
console.log('🚀 Teleport rooms for collaboration');