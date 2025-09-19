#!/usr/bin/env node

/**
 * 🌐 Voice Portal Bridge
 * 
 * Connects the portal with the voice authentication system
 * Handles authentication flow between services
 */

// Use built-in fetch for Node 18+ or fallback
const fetch = globalThis.fetch || require('node-fetch').default;

class VoicePortalBridge {
    constructor(voiceAuthPort = 9700, portalPort = 3333) {
        this.voiceAuthPort = voiceAuthPort;
        this.portalPort = portalPort;
        this.voiceAuthUrl = `http://localhost:${voiceAuthPort}`;
        this.portalUrl = `http://localhost:${portalPort}`;
        
        console.log('🌉 Voice Portal Bridge initialized');
        console.log(`   Voice Auth: ${this.voiceAuthUrl}`);
        console.log(`   Portal: ${this.portalUrl}`);
    }
    
    // Check if voice auth system is ready
    async checkVoiceAuthHealth() {
        try {
            const response = await fetch(`${this.voiceAuthUrl}/api/voice/status/test`);
            return response.ok;
        } catch (error) {
            return false;
        }
    }
    
    // Create a voice authentication session
    async initiateVoiceAuth(userId) {
        try {
            // Generate QR code for voice auth
            const qrResponse = await fetch(`${this.voiceAuthUrl}/api/qr/generate-login`);
            const qrData = await qrResponse.json();
            
            return {
                success: true,
                sessionId: qrData.sessionId,
                qrCode: qrData.qrCode,
                voiceAuthUrl: this.voiceAuthUrl,
                expiresIn: qrData.expiresIn || '5 minutes'
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Verify voice + QR authentication
    async verifyVoiceAuth(sessionId, voiceData) {
        try {
            // Check QR session status
            const qrResponse = await fetch(`${this.voiceAuthUrl}/api/qr/session/${sessionId}`);
            const qrStatus = await qrResponse.json();
            
            if (!qrStatus.qrValid) {
                return {
                    success: false,
                    error: 'Invalid or expired QR session'
                };
            }
            
            // Verify voice if provided
            let voiceVerified = false;
            if (voiceData) {
                const voiceResponse = await fetch(`${this.voiceAuthUrl}/api/voice/verify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: sessionId, // Use session ID as user ID for demo
                        voiceData: voiceData
                    })
                });
                
                const voiceResult = await voiceResponse.json();
                voiceVerified = voiceResult.success;
            }
            
            // Combined authentication
            if (qrStatus.qrValid && voiceVerified) {
                return {
                    success: true,
                    authenticated: true,
                    sessionToken: sessionId,
                    userId: sessionId,
                    voiceVerified: true,
                    qrVerified: true,
                    message: 'Voice + QR authentication successful'
                };
            } else {
                return {
                    success: false,
                    error: 'Both voice and QR verification required',
                    voiceVerified,
                    qrVerified: qrStatus.qrValid
                };
            }
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Get authentication status
    async getAuthStatus(sessionId) {
        try {
            const response = await fetch(`${this.voiceAuthUrl}/api/auth/status/${sessionId}`);
            return await response.json();
        } catch (error) {
            return {
                authenticated: false,
                error: error.message
            };
        }
    }
    
    // Create a voice profile
    async createVoiceProfile(userId, voiceData) {
        try {
            const response = await fetch(`${this.voiceAuthUrl}/api/voice/create-profile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    voiceData
                })
            });
            
            return await response.json();
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Generate authentication URL for portal redirect
    generateAuthUrl(callbackUrl) {
        const params = new URLSearchParams({
            callback: callbackUrl || `${this.portalUrl}/portal/auth/voice-callback`,
            portal: 'true'
        });
        
        return `${this.voiceAuthUrl}?${params.toString()}`;
    }
    
    // Handle portal authentication flow
    async handlePortalAuth(req, res) {
        const { action } = req.body;
        
        switch (action) {
            case 'initiate':
                const sessionData = await this.initiateVoiceAuth(req.body.userId);
                res.json(sessionData);
                break;
                
            case 'verify':
                const verifyResult = await this.verifyVoiceAuth(
                    req.body.sessionId,
                    req.body.voiceData
                );
                res.json(verifyResult);
                break;
                
            case 'status':
                const status = await this.getAuthStatus(req.body.sessionId);
                res.json(status);
                break;
                
            default:
                res.status(400).json({ error: 'Invalid action' });
        }
    }
}

// Export for use in other modules
module.exports = VoicePortalBridge;

// CLI usage
if (require.main === module) {
    const bridge = new VoicePortalBridge();
    
    // Test the bridge
    (async () => {
        console.log('🧪 Testing Voice Portal Bridge...');
        
        const isHealthy = await bridge.checkVoiceAuthHealth();
        console.log(`   Voice Auth Health: ${isHealthy ? '✅ Ready' : '❌ Not available'}`);
        
        if (isHealthy) {
            console.log('   🌉 Bridge is ready to handle authentication flows');
            console.log('   📝 Use this bridge in your portal server');
        }
    })();
}