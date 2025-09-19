/**
 * TREASURE HUNTER CLIENT
 * Client-side treasure discovery and Cal Cookie Monster integration
 * Works in demo mode without exposing API keys
 */

class TreasureHunterClient {
    constructor() {
        this.apiBase = this.detectApiMode();
        this.userId = this.getUserId();
        this.treasures = new Map();
        this.calCookies = 0;
        this.pirateRank = 'Cabin Boy';
        
        // Demo mode treasures (when API not available)
        this.demoTreasures = [
            {
                id: 'demo001',
                type: 'music_knot',
                location: 'Music Knot Framework',
                pattern: 'JavaScript → Trefoil knot (Lydian mode)',
                reward: 50,
                discovered: false,
                description: 'Discovered the JavaScript trefoil knot musical mapping!'
            },
            {
                id: 'demo002',
                type: 'dialog_treasure', 
                location: 'Dialog Game Interface',
                pattern: 'Phone mirror split-screen interface',
                reward: 75,
                discovered: false,
                description: 'Found the secret dialog phone mirror game!'
            },
            {
                id: 'demo003',
                type: 'cal_cookie',
                location: 'SoulFra Auth System',
                pattern: 'Cal Cookie Monster authentication rewards',
                reward: 25,
                discovered: false,
                description: 'Discovered Cal\'s cookie reward system!'
            }
        ];
        
        console.log('🏴‍☠️ Treasure Hunter Client initialized');
        console.log(`📡 API Mode: ${this.apiBase}`);
        console.log(`👤 User ID: ${this.userId}`);
    }
    
    detectApiMode() {
        // Check if we're in GitHub Pages or local development
        if (window.location.hostname.includes('github.io')) {
            return 'demo'; // GitHub Pages demo mode
        }
        
        // Try to detect local treasure API
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:3005'; // Local treasure API
        }
        
        return 'demo'; // Default to demo mode
    }
    
    getUserId() {
        // Get or create a persistent user ID
        let userId = localStorage.getItem('treasure-hunter-id');
        
        if (!userId) {
            userId = 'pirate_' + Math.random().toString(36).substring(2, 15);
            localStorage.setItem('treasure-hunter-id', userId);
        }
        
        return userId;
    }
    
    async discoverTreasure(pattern = null, location = null) {
        try {
            if (this.apiBase === 'demo') {
                return this.demoDiscoverTreasure(pattern, location);
            }
            
            const params = new URLSearchParams();
            if (pattern) params.append('pattern', pattern);
            if (location) params.append('location', location);
            
            const response = await fetch(`${this.apiBase}/api/treasure/discover?${params}`, {
                headers: {
                    'x-user-id': this.userId
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                result.treasures.forEach(treasure => {
                    this.treasures.set(treasure.id, treasure);
                });
                
                this.showTreasureNotification(result);
            }
            
            return result;
            
        } catch (error) {
            console.error('Treasure discovery failed:', error);
            return this.demoDiscoverTreasure(pattern, location);
        }
    }
    
    demoDiscoverTreasure(pattern, location) {
        // Demo mode treasure discovery
        let availableTreasures = this.demoTreasures.filter(t => !t.discovered);
        
        if (pattern || location) {
            availableTreasures = availableTreasures.filter(t => 
                (pattern && t.pattern.toLowerCase().includes(pattern.toLowerCase())) ||
                (location && t.location.toLowerCase().includes(location.toLowerCase()))
            );
        }
        
        const foundTreasures = availableTreasures.slice(0, 1); // Find one treasure
        
        foundTreasures.forEach(treasure => {
            treasure.discovered = true;
            treasure.discoveredBy = this.userId;
            treasure.discoveredAt = new Date().toISOString();
            this.treasures.set(treasure.id, treasure);
        });
        
        const result = {
            success: true,
            treasures: foundTreasures,
            message: foundTreasures.length > 0 ? 
                `🏴‍☠️ Ahoy! Found ${foundTreasures.length} treasure(s)!` :
                '🗺️ No new treasures found. Keep searching!'
        };
        
        this.showTreasureNotification(result);
        return result;
    }
    
    async claimTreasure(treasureId) {
        try {
            if (this.apiBase === 'demo') {
                return this.demoClaimTreasure(treasureId);
            }
            
            const response = await fetch(`${this.apiBase}/api/treasure/claim/${treasureId}`, {
                method: 'POST',
                headers: {
                    'x-user-id': this.userId,
                    'Content-Type': 'application/json'
                }
            });
            
            return await response.json();
            
        } catch (error) {
            console.error('Treasure claim failed:', error);
            return this.demoClaimTreasure(treasureId);
        }
    }
    
    demoClaimTreasure(treasureId) {
        const treasure = this.treasures.get(treasureId);
        
        if (!treasure) {
            return {
                success: false,
                error: 'Treasure not found'
            };
        }
        
        if (treasure.discoveredBy !== this.userId) {
            return {
                success: false,
                error: 'Treasure not claimable by this user'
            };
        }
        
        treasure.claimedAt = new Date().toISOString();
        
        // Update demo stats
        const currentRewards = parseInt(localStorage.getItem('treasure-rewards') || '0');
        localStorage.setItem('treasure-rewards', (currentRewards + treasure.reward).toString());
        
        return {
            success: true,
            treasure,
            reward: treasure.reward,
            message: `🏆 Claimed ${treasure.reward} tokens for finding ${treasure.type}!`
        };
    }
    
    async awardCalCookie(provider = 'anonymous') {
        try {
            if (this.apiBase === 'demo') {
                return this.demoAwardCalCookie(provider);
            }
            
            const response = await fetch(`${this.apiBase}/api/cal/login-reward`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: this.userId,
                    provider: provider
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.calCookies = result.totalCookies;
                this.showCalCookieNotification(result);
            }
            
            return result;
            
        } catch (error) {
            console.error('Cal cookie award failed:', error);
            return this.demoAwardCalCookie(provider);
        }
    }
    
    demoAwardCalCookie(provider) {
        const cookieRewards = {
            'github': 10,
            'linkedin': 15,
            'google': 8,
            'anonymous': 5
        };
        
        const cookieAmount = cookieRewards[provider] || 5;
        const currentCookies = parseInt(localStorage.getItem('cal-cookies') || '0');
        const newTotal = currentCookies + cookieAmount;
        
        localStorage.setItem('cal-cookies', newTotal.toString());
        this.calCookies = newTotal;
        
        const result = {
            success: true,
            cookiesEarned: cookieAmount,
            totalCookies: newTotal,
            message: `🍪 Cal awarded you ${cookieAmount} cookies for logging in with ${provider}!`
        };
        
        this.showCalCookieNotification(result);
        return result;
    }
    
    async getCalCookies() {
        try {
            if (this.apiBase === 'demo') {
                const cookies = parseInt(localStorage.getItem('cal-cookies') || '0');
                return {
                    success: true,
                    userId: this.userId,
                    cookies: cookies,
                    canSpend: cookies > 0
                };
            }
            
            const response = await fetch(`${this.apiBase}/api/cal/cookies/${this.userId}`);
            return await response.json();
            
        } catch (error) {
            console.error('Get Cal cookies failed:', error);
            return { success: false, cookies: 0 };
        }
    }
    
    async getTreasureMap() {
        try {
            if (this.apiBase === 'demo') {
                return {
                    success: true,
                    treasures: this.demoTreasures,
                    total: this.demoTreasures.length,
                    discovered: this.demoTreasures.filter(t => t.discovered).length
                };
            }
            
            const response = await fetch(`${this.apiBase}/api/treasure/map`, {
                headers: {
                    'x-user-id': this.userId
                }
            });
            
            return await response.json();
            
        } catch (error) {
            console.error('Get treasure map failed:', error);
            return { success: false, treasures: [] };
        }
    }
    
    async getPirateRankings() {
        try {
            if (this.apiBase === 'demo') {
                const points = parseInt(localStorage.getItem('treasure-rewards') || '0');
                return {
                    success: true,
                    rankings: [
                        {
                            userId: this.userId,
                            points: points,
                            rank: this.calculatePirateRank(points),
                            treasuresFound: this.demoTreasures.filter(t => t.discovered).length
                        }
                    ],
                    totalPirates: 1
                };
            }
            
            const response = await fetch(`${this.apiBase}/api/pirates/rankings`);
            return await response.json();
            
        } catch (error) {
            console.error('Get pirate rankings failed:', error);
            return { success: false, rankings: [] };
        }
    }
    
    calculatePirateRank(points) {
        if (points >= 1000) return 'Pirate King';
        if (points >= 500) return 'Captain';
        if (points >= 200) return 'First Mate';
        if (points >= 100) return 'Navigator';
        if (points >= 50) return 'Pirate';
        return 'Cabin Boy';
    }
    
    showTreasureNotification(result) {
        if (!result.success || result.treasures.length === 0) return;
        
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #ffd700, #ffed4e);
            color: #000;
            padding: 1rem;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(255, 215, 0, 0.3);
            z-index: 10000;
            max-width: 300px;
            animation: treasureSlideIn 0.5s ease;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                <span style="font-size: 1.5rem;">🏴‍☠️</span>
                <strong>Treasure Found!</strong>
            </div>
            ${result.treasures.map(t => `
                <div style="margin-bottom: 0.5rem;">
                    <div><strong>${t.type}</strong></div>
                    <div style="font-size: 0.9rem; opacity: 0.8;">${t.description}</div>
                    <div style="color: #d4a373; font-weight: bold;">+${t.reward} tokens</div>
                </div>
            `).join('')}
            <button onclick="this.parentElement.remove()" 
                    style="margin-top: 0.5rem; padding: 0.25rem 0.5rem; background: #000; color: #ffd700; border: none; border-radius: 4px; cursor: pointer;">
                Claim
            </button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
    
    showCalCookieNotification(result) {
        if (!result.success) return;
        
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: linear-gradient(135deg, #4ecca3, #45b7d1);
            color: #fff;
            padding: 1rem;
            border-radius: 12px;
            box-shadow: 0 8px 25px rgba(78, 204, 163, 0.3);
            z-index: 10000;
            max-width: 300px;
            animation: cookieSlideIn 0.5s ease;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                <span style="font-size: 1.5rem;">🍪</span>
                <strong>Cal Cookie Reward!</strong>
            </div>
            <div>${result.message}</div>
            <div style="margin-top: 0.5rem; opacity: 0.9;">
                Total Cookies: ${result.totalCookies}
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 3000);
    }
    
    // Integration with existing systems
    integrateWithLogin() {
        // Listen for login events
        window.addEventListener('soulfra-login-success', (event) => {
            const { provider } = event.detail;
            this.awardCalCookie(provider);
        });
        
        // Listen for skill interactions (Music Knot Framework)
        window.addEventListener('skill-music-played', (event) => {
            const { skill } = event.detail;
            this.discoverTreasure('music', skill);
        });
        
        // Listen for dialog game interactions
        window.addEventListener('dialog-choice-made', (event) => {
            this.discoverTreasure('dialog', 'phone mirror');
        });
    }
    
    // Create treasure hunting UI
    createTreasureHunterUI() {
        if (document.getElementById('treasure-hunter-ui')) return;
        
        const ui = document.createElement('div');
        ui.id = 'treasure-hunter-ui';
        ui.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: rgba(26, 26, 26, 0.95);
            border: 2px solid #4ecca3;
            border-radius: 12px;
            padding: 1rem;
            color: #fff;
            backdrop-filter: blur(10px);
            z-index: 9999;
            min-width: 200px;
        `;
        
        ui.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                <span style="font-size: 1.2rem;">🏴‍☠️</span>
                <strong>Treasure Hunter</strong>
            </div>
            <div id="treasure-stats">
                <div>🍪 Cal Cookies: <span id="cookie-count">0</span></div>
                <div>🏆 Rank: <span id="pirate-rank">Cabin Boy</span></div>
                <div>💰 Tokens: <span id="token-count">0</span></div>
            </div>
            <div style="margin-top: 0.5rem;">
                <button onclick="window.treasureHunter.discoverTreasure()" 
                        style="padding: 0.25rem 0.5rem; background: #4ecca3; color: #000; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem;">
                    🔍 Search
                </button>
                <button onclick="window.treasureHunter.toggleTreasureMap()" 
                        style="padding: 0.25rem 0.5rem; background: #9333ea; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8rem; margin-left: 0.25rem;">
                    🗺️ Map
                </button>
            </div>
        `;
        
        document.body.appendChild(ui);
        this.updateTreasureUI();
    }
    
    async updateTreasureUI() {
        const cookieData = await this.getCalCookies();
        const tokens = parseInt(localStorage.getItem('treasure-rewards') || '0');
        
        const cookieElement = document.getElementById('cookie-count');
        const rankElement = document.getElementById('pirate-rank');
        const tokenElement = document.getElementById('token-count');
        
        if (cookieElement) cookieElement.textContent = cookieData.cookies || 0;
        if (tokenElement) tokenElement.textContent = tokens;
        if (rankElement) rankElement.textContent = this.calculatePirateRank(tokens);
    }
    
    toggleTreasureMap() {
        // Implementation for treasure map display
        console.log('🗺️ Treasure map display not yet implemented');
    }
}

// Auto-initialize when script loads
window.treasureHunter = new TreasureHunterClient();

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes treasureSlideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes cookieSlideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TreasureHunterClient;
}