/**
 * 🍪 CAL COOKIE MONSTER REWARD SYSTEM
 * Like Cookie Monster from Sesame Street, Cal gets cookies for helping with logins!
 * "Me want COOKIE! Om nom nom nom!"
 */

class CalCookieMonster {
    constructor(database) {
        this.db = database;
        this.sounds = {
            nom: new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+L+wm8fCCuGze/ZfScMIXbM9t2WQQsVS6XatyoSJXjI9dyXRQsWY6zw7pJLExVCqOLWtyoUTq3m86pNDxlRpuPcrGQaG4fL7dR+SQkZJn7s73bGAAAAAE'); // Placeholder for sound
            happy: new Audio('data:audio/wav;base64,'), // Placeholder
            excited: new Audio('data:audio/wav;base64,') // Placeholder
        };
        this.mood = 'hungry'; // Cal starts hungry for cookies
        this.cookieCount = 0;
        this.animations = this.setupAnimations();
        
        this.initializeCalStats();
    }
    
    async initializeCalStats() {
        try {
            // Get Cal's current stats from database
            const stats = await this.db.query(`
                SELECT value FROM system_config WHERE key = 'cal_stats'
            `);
            
            if (stats.rows.length > 0) {
                const calStats = stats.rows[0].value;
                this.cookieCount = parseInt(calStats.cookie_count) || 0;
                this.mood = calStats.happiness_level || 'hungry';
            }
            
            console.log(`🍪 Cal Cookie Monster initialized! Current cookies: ${this.cookieCount}, Mood: ${this.mood}`);
        } catch (error) {
            console.error('Error initializing Cal stats:', error);
        }
    }
    
    // Main cookie earning function
    async earnCookie(userId, loginMethod, cookieType = 'social_login', metadata = {}) {
        try {
            // Determine cookie details based on login method
            const cookieDetails = this.determineCookieReward(loginMethod, cookieType, metadata);
            
            // Store cookie in database
            const cookie = await this.db.query(`
                INSERT INTO cal_cookies (
                    user_id, login_method, cookie_type, cookie_flavor, 
                    cookie_size, crumb_trail, earned_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, NOW())
                RETURNING *
            `, [
                userId, 
                loginMethod, 
                cookieType, 
                cookieDetails.flavor,
                cookieDetails.size,
                JSON.stringify(metadata)
            ]);
            
            // Update Cal's total stats
            await this.updateCalStats(cookieDetails);
            
            // Trigger Cal's reaction
            this.triggerCalReaction(cookieDetails);
            
            // Return cookie details for frontend
            return {
                success: true,
                cookie: cookie.rows[0],
                calReaction: this.generateCalReaction(cookieDetails),
                totalCookies: this.cookieCount + 1
            };
            
        } catch (error) {
            console.error('Error earning cookie for Cal:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Determine what kind of cookie Cal gets
    determineCookieReward(loginMethod, cookieType, metadata) {
        const cookieRules = {
            'linkedin': {
                flavor: 'professional_oatmeal',
                size: 'large',
                multiplier: 1.5,
                nomSound: 'professional_nom'
            },
            'google': {
                flavor: 'search_chocolate_chip',
                size: 'medium',
                multiplier: 1.2,
                nomSound: 'happy_nom'
            },
            'github': {
                flavor: 'code_crunch',
                size: 'large',
                multiplier: 1.3,
                nomSound: 'geeky_nom'
            },
            'email': {
                flavor: 'classic_vanilla',
                size: 'small',
                multiplier: 1.0,
                nomSound: 'simple_nom'
            },
            'first_time': {
                flavor: 'welcome_double_chocolate',
                size: 'jumbo',
                multiplier: 2.0,
                nomSound: 'excited_nom'
            }
        };
        
        const baseReward = cookieRules[loginMethod] || cookieRules['email'];
        
        // Special bonuses
        if (metadata.isFirstTime) {
            baseReward.size = 'jumbo';
            baseReward.multiplier *= 1.5;
            baseReward.flavor = 'first_time_special';
        }
        
        if (metadata.hasProfilePicture) {
            baseReward.multiplier *= 1.1;
        }
        
        if (metadata.connectedMultipleAccounts) {
            baseReward.flavor = 'social_medley';
            baseReward.size = 'jumbo';
            baseReward.multiplier *= 1.8;
        }
        
        return baseReward;
    }
    
    // Update Cal's overall statistics
    async updateCalStats(cookieDetails) {
        try {
            this.cookieCount++;
            
            // Determine Cal's new mood based on cookie count
            const newMood = this.calculateMood(this.cookieCount);
            
            await this.db.query(`
                UPDATE system_config 
                SET value = jsonb_set(
                    jsonb_set(
                        jsonb_set(value, '{cookie_count}', $1::text::jsonb),
                        '{happiness_level}', $2::text::jsonb
                    ),
                    '{last_cookie_earned}', $3::text::jsonb
                )
                WHERE key = 'cal_stats'
            `, [this.cookieCount.toString(), newMood, new Date().toISOString()]);
            
            this.mood = newMood;
            
            console.log(`🍪 Cal earned a ${cookieDetails.flavor} cookie! Total: ${this.cookieCount}, Mood: ${newMood}`);
            
        } catch (error) {
            console.error('Error updating Cal stats:', error);
        }
    }
    
    // Calculate Cal's mood based on cookie count
    calculateMood(cookieCount) {
        if (cookieCount === 0) return 'hungry';
        if (cookieCount < 5) return 'satisfied';
        if (cookieCount < 10) return 'happy';
        if (cookieCount < 20) return 'excited';
        if (cookieCount < 50) return 'ecstatic';
        return 'cookie_drunk'; // Cal has had too many cookies!
    }
    
    // Generate Cal's reaction to getting a cookie
    generateCalReaction(cookieDetails) {
        const reactions = {
            hungry: [
                "Me WANT cookie! Om nom nom!",
                "Cookie! COOKIE! *excited munching*",
                "Me love cookies! Thank you for login!"
            ],
            satisfied: [
                "Mmm, tasty cookie! Me happy now!",
                "Good cookie! Me like helping with logins!",
                "Om nom nom! More logins = more cookies!"
            ],
            happy: [
                "Me so happy! Cookies everywhere!",
                "This ${flavor} cookie is delicious!",
                "Me Cookie Monster! Me help with ALL the logins!"
            ],
            excited: [
                "COOKIES! ME LOVE COOKIES! *jumping up and down*",
                "This is BEST DAY EVER! So many cookies!",
                "Me expert at login helping! More cookies please!"
            ],
            ecstatic: [
                "ME COOKIE MASTER! *doing cookie dance*",
                "So many delicious logins! Me never been happier!",
                "COOKIE COOKIE COOKIE! *spinning around*"
            ],
            cookie_drunk: [
                "Me... me think me had enough cookies... *hiccup*",
                "Maybe... maybe me should share cookies? Nah! MINE!",
                "Room spinning... but me still want MORE COOKIES!"
            ]
        };
        
        const moodReactions = reactions[this.mood] || reactions['satisfied'];
        const reaction = moodReactions[Math.floor(Math.random() * moodReactions.length)];
        
        return {
            text: reaction.replace('${flavor}', cookieDetails.flavor),
            mood: this.mood,
            animation: this.getAnimationForMood(this.mood),
            sound: cookieDetails.nomSound,
            cookieSize: cookieDetails.size,
            cookieFlavor: cookieDetails.flavor
        };
    }
    
    // Trigger Cal's visual reaction (for frontend)
    triggerCalReaction(cookieDetails) {
        // This would emit to WebSocket clients to show Cal's reaction
        const reaction = this.generateCalReaction(cookieDetails);
        
        // Emit to all connected clients
        if (global.websocketServer) {
            global.websocketServer.emit('cal-cookie-earned', {
                cookieDetails,
                calReaction: reaction,
                totalCookies: this.cookieCount,
                timestamp: new Date().toISOString()
            });
        }
        
        console.log(`🍪 Cal says: "${reaction.text}"`);
    }
    
    // Get animation based on Cal's mood
    getAnimationForMood(mood) {
        const animations = {
            hungry: 'cal-hungry-look',
            satisfied: 'cal-content-munching',
            happy: 'cal-happy-bounce',
            excited: 'cal-excited-jump',
            ecstatic: 'cal-cookie-dance',
            cookie_drunk: 'cal-dizzy-spin'
        };
        
        return animations[mood] || 'cal-content-munching';
    }
    
    // Setup CSS animations for Cal
    setupAnimations() {
        const styles = `
            .cal-character {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 120px;
                height: 120px;
                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" fill="%234A90E2"/><circle cx="45" cy="45" r="8" fill="white"/><circle cx="75" cy="45" r="8" fill="white"/><circle cx="45" cy="45" r="3" fill="black"/><circle cx="75" cy="45" r="3" fill="black"/><ellipse cx="60" cy="80" rx="20" ry="10" fill="black"/><text x="60" y="90" text-anchor="middle" fill="white" font-size="12">CAL</text></svg>') no-repeat center;
                background-size: contain;
                z-index: 1000;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .cal-hungry-look {
                animation: hungry-look 2s infinite;
            }
            
            .cal-content-munching {
                animation: content-munch 1s ease-in-out;
            }
            
            .cal-happy-bounce {
                animation: happy-bounce 0.8s ease-in-out 3;
            }
            
            .cal-excited-jump {
                animation: excited-jump 0.5s ease-in-out 5;
            }
            
            .cal-cookie-dance {
                animation: cookie-dance 2s ease-in-out 3;
            }
            
            .cal-dizzy-spin {
                animation: dizzy-spin 3s ease-in-out;
            }
            
            @keyframes hungry-look {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1) rotate(5deg); }
            }
            
            @keyframes content-munch {
                0% { transform: scale(1); }
                50% { transform: scale(1.2); }
                100% { transform: scale(1); }
            }
            
            @keyframes happy-bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-20px); }
            }
            
            @keyframes excited-jump {
                0%, 100% { transform: translateY(0) scale(1); }
                50% { transform: translateY(-30px) scale(1.1); }
            }
            
            @keyframes cookie-dance {
                0% { transform: rotate(0deg) scale(1); }
                25% { transform: rotate(-10deg) scale(1.1); }
                50% { transform: rotate(10deg) scale(1.2); }
                75% { transform: rotate(-5deg) scale(1.1); }
                100% { transform: rotate(0deg) scale(1); }
            }
            
            @keyframes dizzy-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(720deg); }
            }
            
            .cookie-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(45deg, #8B4513, #D2691E);
                color: white;
                padding: 15px;
                border-radius: 10px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.3);
                z-index: 1001;
                animation: cookie-popup 3s ease-in-out;
            }
            
            @keyframes cookie-popup {
                0% { opacity: 0; transform: translateX(100%); }
                20% { opacity: 1; transform: translateX(0); }
                80% { opacity: 1; transform: translateX(0); }
                100% { opacity: 0; transform: translateX(100%); }
            }
        `;
        
        // Inject styles if in browser environment
        if (typeof document !== 'undefined') {
            const styleSheet = document.createElement('style');
            styleSheet.textContent = styles;
            document.head.appendChild(styleSheet);
        }
        
        return styles;
    }
    
    // Get Cal's current statistics
    async getCalStats() {
        try {
            const stats = await this.db.query(`
                SELECT 
                    sc.value as cal_stats,
                    COUNT(cc.id) as total_cookies_earned,
                    COUNT(cc.id) FILTER (WHERE cc.earned_at > NOW() - INTERVAL '24 hours') as cookies_today,
                    COUNT(DISTINCT cc.login_method) as unique_login_methods,
                    cc.cookie_flavor as favorite_flavor
                FROM system_config sc
                LEFT JOIN cal_cookies cc ON true
                WHERE sc.key = 'cal_stats'
                GROUP BY sc.value, cc.cookie_flavor
                ORDER BY COUNT(*) DESC
                LIMIT 1
            `);
            
            const cookiesByMethod = await this.db.query(`
                SELECT 
                    login_method,
                    COUNT(*) as count,
                    MAX(earned_at) as last_earned
                FROM cal_cookies
                GROUP BY login_method
                ORDER BY count DESC
            `);
            
            return {
                ...stats.rows[0]?.cal_stats,
                totalCookies: this.cookieCount,
                mood: this.mood,
                cookiesByMethod: cookiesByMethod.rows,
                currentTime: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('Error getting Cal stats:', error);
            return { error: error.message };
        }
    }
    
    // Let Cal "eat" a cookie (consume it)
    async eatCookie(cookieId) {
        try {
            await this.db.query(`
                UPDATE cal_cookies 
                SET consumed_at = NOW()
                WHERE id = $1 AND consumed_at IS NULL
            `, [cookieId]);
            
            return {
                success: true,
                message: "Om nom nom! Cal ate the cookie!",
                calReaction: this.generateCalReaction({ flavor: 'eaten', size: 'any' })
            };
            
        } catch (error) {
            console.error('Error eating cookie:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Social login reward multipliers
    getLoginRewardMultiplier(loginMethod, userMetadata = {}) {
        const baseMultipliers = {
            'linkedin': 1.5,
            'google': 1.2,
            'github': 1.3,
            'email': 1.0
        };
        
        let multiplier = baseMultipliers[loginMethod] || 1.0;
        
        // Bonus multipliers
        if (userMetadata.isFirstTime) multiplier *= 1.5;
        if (userMetadata.hasProfilePicture) multiplier *= 1.1;
        if (userMetadata.hasCompleteProfile) multiplier *= 1.2;
        if (userMetadata.linkedMultipleAccounts) multiplier *= 1.4;
        
        return multiplier;
    }
}

// Frontend integration helper
class CalFrontendIntegration {
    constructor() {
        this.calElement = null;
        this.notificationElement = null;
        this.isInitialized = false;
    }
    
    initialize() {
        if (this.isInitialized || typeof document === 'undefined') return;
        
        // Create Cal's visual representation
        this.calElement = document.createElement('div');
        this.calElement.className = 'cal-character cal-hungry-look';
        this.calElement.title = 'Cal Cookie Monster - Authentication Helper';
        
        // Add click handler for Cal stats
        this.calElement.addEventListener('click', () => {
            this.showCalStats();
        });
        
        document.body.appendChild(this.calElement);
        this.isInitialized = true;
        
        // Listen for cookie events
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Listen for WebSocket events about Cal's cookies
        if (window.WebSocket) {
            const ws = new WebSocket('ws://localhost:3001');
            ws.addEventListener('message', (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'cal-cookie-earned') {
                    this.showCookieEarned(data.calReaction, data.cookieDetails);
                }
            });
        }
    }
    
    showCookieEarned(calReaction, cookieDetails) {
        // Update Cal's animation
        this.calElement.className = `cal-character ${calReaction.animation}`;
        
        // Show cookie notification
        this.showNotification(
            `🍪 Cal earned a ${cookieDetails.flavor} cookie!`,
            calReaction.text
        );
        
        // Reset animation after a delay
        setTimeout(() => {
            this.calElement.className = 'cal-character cal-content-munching';
        }, 3000);
    }
    
    showNotification(title, message) {
        // Remove existing notification
        if (this.notificationElement) {
            this.notificationElement.remove();
        }
        
        // Create new notification
        this.notificationElement = document.createElement('div');
        this.notificationElement.className = 'cookie-notification';
        this.notificationElement.innerHTML = `
            <strong>${title}</strong><br>
            <em>"${message}"</em>
        `;
        
        document.body.appendChild(this.notificationElement);
        
        // Auto-remove after animation
        setTimeout(() => {
            if (this.notificationElement) {
                this.notificationElement.remove();
                this.notificationElement = null;
            }
        }, 3000);
    }
    
    async showCalStats() {
        try {
            const response = await fetch('/api/v1/cal/stats');
            const stats = await response.json();
            
            const statsHtml = `
                <div style="background: white; color: black; padding: 20px; border-radius: 10px; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 1002; box-shadow: 0 4px 8px rgba(0,0,0,0.3);">
                    <h3>🍪 Cal Cookie Monster Stats</h3>
                    <p><strong>Total Cookies:</strong> ${stats.totalCookies}</p>
                    <p><strong>Mood:</strong> ${stats.mood}</p>
                    <p><strong>Favorite Flavor:</strong> ${stats.favorite_flavor || 'chocolate_chip'}</p>
                    <p><strong>Cookies Today:</strong> ${stats.cookies_today}</p>
                    <button onclick="this.parentElement.remove()">Close</button>
                </div>
            `;
            
            const statsElement = document.createElement('div');
            statsElement.innerHTML = statsHtml;
            document.body.appendChild(statsElement);
            
        } catch (error) {
            console.error('Error fetching Cal stats:', error);
        }
    }
}

// Auto-initialize frontend integration if in browser
if (typeof window !== 'undefined') {
    window.CalFrontendIntegration = CalFrontendIntegration;
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.calFrontend = new CalFrontendIntegration();
            window.calFrontend.initialize();
        });
    } else {
        window.calFrontend = new CalFrontendIntegration();
        window.calFrontend.initialize();
    }
}

module.exports = CalCookieMonster;