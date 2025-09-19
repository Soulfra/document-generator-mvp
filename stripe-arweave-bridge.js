/**
 * Stripe-Arweave Payment Bridge
 * 
 * Connects Stripe payment processing with Arweave wallet authentication
 * and permanent storage, enabling premium features and subscriptions.
 */

class StripeArweaveBridge {
    constructor(config = {}) {
        this.config = {
            stripe: {
                publishableKey: config.stripe?.publishableKey || process.env.STRIPE_PUBLISHABLE_KEY,
                secretKey: config.stripe?.secretKey || process.env.STRIPE_SECRET_KEY,
                webhookSecret: config.stripe?.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET
            },
            pricing: {
                premium: {
                    monthly: 'price_premium_monthly_id',
                    yearly: 'price_premium_yearly_id',
                    amount: 29.99 // Monthly in USD
                },
                founder: {
                    lifetime: 'price_founder_lifetime_id', 
                    amount: 299.99 // One-time in USD
                },
                credits: {
                    small: { id: 'price_credits_small', amount: 9.99, credits: 100 },
                    medium: { id: 'price_credits_medium', amount: 24.99, credits: 300 },
                    large: { id: 'price_credits_large', amount: 49.99, credits: 750 }
                }
            },
            features: {
                premium: [
                    'unlimited_job_applications',
                    'advanced_ai_models',
                    'priority_processing',
                    'custom_templates',
                    'analytics_dashboard'
                ],
                founder: [
                    'all_premium_features',
                    'early_access',
                    'direct_support',
                    'custom_integrations',
                    'revenue_sharing'
                ]
            },
            ...config
        };

        // Payment state
        this.stripe = null;
        this.isInitialized = false;
        this.customerData = null;
        this.subscriptions = [];
        this.paymentHistory = [];

        this.init();
    }

    async init() {
        console.log('💳 Stripe-Arweave Bridge initializing...');

        try {
            // Initialize Stripe client-side
            if (window.Stripe && this.config.stripe.publishableKey) {
                this.stripe = Stripe(this.config.stripe.publishableKey);
                console.log('✅ Stripe client initialized');
            } else {
                console.warn('⚠️ Stripe not available - loading from CDN...');
                await this.loadStripeSDK();
            }

            // Set up event listeners
            this.setupEventListeners();

            // Connect with existing systems
            this.connectToArweaveAuth();
            this.connectToCalCharacter();

            this.isInitialized = true;
            console.log('✅ Stripe-Arweave Bridge ready');

        } catch (error) {
            console.error('❌ Bridge initialization failed:', error);
            throw error;
        }
    }

    async loadStripeSDK() {
        return new Promise((resolve, reject) => {
            if (window.Stripe) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://js.stripe.com/v3/';
            script.async = true;
            
            script.onload = () => {
                this.stripe = Stripe(this.config.stripe.publishableKey);
                resolve();
            };
            
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    setupEventListeners() {
        // Listen for Arweave authentication events
        window.addEventListener('arweave-auth', (event) => {
            this.handleAuthEvent(event.detail);
        });

        // Listen for Cal character premium requests
        window.addEventListener('cal-premium-request', (event) => {
            this.handlePremiumRequest(event.detail);
        });

        // Listen for payment completion events
        window.addEventListener('stripe-payment-complete', (event) => {
            this.handlePaymentComplete(event.detail);
        });
    }

    connectToArweaveAuth() {
        // Listen for wallet authentication
        if (window.arweaveAuth) {
            const authStatus = window.arweaveAuth.getAuthStatus();
            if (authStatus.isAuthenticated) {
                this.loadCustomerData(authStatus.walletAddress);
            }
        }
    }

    connectToCalCharacter() {
        // Enhance Cal character with payment capabilities
        if (window.calCharacter) {
            // Add payment-related questions to Cal
            const paymentQuestions = [
                "Ready to unlock premium features? I can help you choose the right plan.",
                "I've noticed you're using free tier. Want to see what premium unlocks?",
                "Your Arweave wallet is perfect for our premium blockchain features.",
                "Founder tier gets you early access to everything. Interested?"
            ];

            // Add payment methods to Cal
            if (window.calCharacter.personalities) {
                Object.values(window.calCharacter.personalities).forEach(personality => {
                    personality.questions.push(...paymentQuestions);
                });
            }
        }
    }

    async handleAuthEvent(authDetail) {
        const { type, address, authenticated } = authDetail;

        switch (type) {
            case 'authenticated':
                await this.loadCustomerData(address);
                break;
            case 'disconnected':
                this.clearCustomerData();
                break;
        }
    }

    async loadCustomerData(walletAddress) {
        try {
            console.log('💳 Loading customer data for wallet:', walletAddress);

            // Try to load from Arweave first
            const arweaveData = await this.loadPaymentDataFromArweave(walletAddress);
            
            if (arweaveData) {
                this.customerData = arweaveData;
                this.subscriptions = arweaveData.subscriptions || [];
                this.paymentHistory = arweaveData.paymentHistory || [];
            } else {
                // Create new customer profile
                this.customerData = {
                    walletAddress,
                    stripeCustomerId: null,
                    tier: 'free',
                    credits: 10, // Free tier credits
                    subscriptions: [],
                    paymentHistory: [],
                    createdAt: Date.now()
                };
            }

            // Update user profile with payment data
            if (window.arweaveAuth && window.arweaveAuth.userProfile) {
                window.arweaveAuth.userProfile.tier = this.customerData.tier;
                window.arweaveAuth.userProfile.credits = this.customerData.credits;
            }

            console.log('📊 Customer data loaded:', this.customerData.tier);

        } catch (error) {
            console.error('Failed to load customer data:', error);
        }
    }

    async loadPaymentDataFromArweave(walletAddress) {
        try {
            if (!window.arweaveAuth) return null;

            // Use the existing Arweave auth system to load payment data
            const paymentData = await window.arweaveAuth.loadFromArweave('payment_data');
            return paymentData;

        } catch (error) {
            console.error('Failed to load payment data from Arweave:', error);
            return null;
        }
    }

    async savePaymentDataToArweave() {
        try {
            if (!window.arweaveAuth || !this.customerData) return;

            const paymentData = {
                ...this.customerData,
                lastUpdated: Date.now(),
                version: '1.0'
            };

            await window.arweaveAuth.saveToArweave('payment_data', paymentData);
            console.log('💾 Payment data saved to Arweave');

        } catch (error) {
            console.error('Failed to save payment data to Arweave:', error);
        }
    }

    // Premium subscription management
    async createPremiumSubscription(plan = 'monthly') {
        try {
            if (!this.isInitialized) throw new Error('Stripe not initialized');
            if (!this.customerData) throw new Error('Customer data not loaded');

            const priceId = this.config.pricing.premium[plan];
            if (!priceId) throw new Error('Invalid plan selected');

            // Create Stripe checkout session
            const sessionData = await this.createCheckoutSession({
                priceId,
                mode: 'subscription',
                successUrl: `${window.location.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
                cancelUrl: `${window.location.origin}/payment-cancelled`,
                customerEmail: null, // We'll use wallet address
                metadata: {
                    walletAddress: this.customerData.walletAddress,
                    plan: plan,
                    tier: 'premium'
                }
            });

            // Redirect to Stripe Checkout
            const { error } = await this.stripe.redirectToCheckout({
                sessionId: sessionData.sessionId
            });

            if (error) {
                throw error;
            }

        } catch (error) {
            console.error('Failed to create premium subscription:', error);
            this.showPaymentError(error.message);
        }
    }

    async purchaseFounderTier() {
        try {
            if (!this.isInitialized) throw new Error('Stripe not initialized');
            if (!this.customerData) throw new Error('Customer data not loaded');

            const priceId = this.config.pricing.founder.lifetime;

            const sessionData = await this.createCheckoutSession({
                priceId,
                mode: 'payment', // One-time payment
                successUrl: `${window.location.origin}/founder-welcome?session_id={CHECKOUT_SESSION_ID}`,
                cancelUrl: `${window.location.origin}/payment-cancelled`,
                metadata: {
                    walletAddress: this.customerData.walletAddress,
                    tier: 'founder',
                    lifetime: true
                }
            });

            const { error } = await this.stripe.redirectToCheckout({
                sessionId: sessionData.sessionId
            });

            if (error) {
                throw error;
            }

        } catch (error) {
            console.error('Failed to purchase founder tier:', error);
            this.showPaymentError(error.message);
        }
    }

    async purchaseCredits(package = 'small') {
        try {
            if (!this.isInitialized) throw new Error('Stripe not initialized');
            if (!this.customerData) throw new Error('Customer data not loaded');

            const creditPackage = this.config.pricing.credits[package];
            if (!creditPackage) throw new Error('Invalid credit package');

            const sessionData = await this.createCheckoutSession({
                priceId: creditPackage.id,
                mode: 'payment',
                successUrl: `${window.location.origin}/credits-added?session_id={CHECKOUT_SESSION_ID}`,
                cancelUrl: `${window.location.origin}/payment-cancelled`,
                metadata: {
                    walletAddress: this.customerData.walletAddress,
                    credits: creditPackage.credits,
                    package: package
                }
            });

            const { error } = await this.stripe.redirectToCheckout({
                sessionId: sessionData.sessionId
            });

            if (error) {
                throw error;
            }

        } catch (error) {
            console.error('Failed to purchase credits:', error);
            this.showPaymentError(error.message);
        }
    }

    async createCheckoutSession(sessionConfig) {
        // In a real implementation, this would call your backend API
        // For now, we'll simulate the session creation
        
        const response = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Wallet-Address': this.customerData?.walletAddress
            },
            body: JSON.stringify(sessionConfig)
        });

        if (!response.ok) {
            // Fallback for demo mode
            console.log('🎮 Demo mode - simulating checkout session');
            return {
                sessionId: 'demo_session_' + Date.now()
            };
        }

        return await response.json();
    }

    async handlePaymentComplete(paymentDetail) {
        try {
            const { sessionId, type } = paymentDetail;

            // Verify payment with backend
            const verification = await this.verifyPayment(sessionId);
            
            if (verification.success) {
                // Update customer data based on payment type
                switch (type) {
                    case 'premium_subscription':
                        this.customerData.tier = 'premium';
                        this.customerData.credits = -1; // Unlimited
                        break;
                    
                    case 'founder_tier':
                        this.customerData.tier = 'founder';
                        this.customerData.credits = -1; // Unlimited
                        break;
                    
                    case 'credits':
                        this.customerData.credits += verification.credits;
                        break;
                }

                // Add to payment history
                this.paymentHistory.push({
                    sessionId,
                    type,
                    amount: verification.amount,
                    timestamp: Date.now(),
                    verified: true
                });

                // Save to Arweave
                await this.savePaymentDataToArweave();

                // Update Arweave auth profile
                if (window.arweaveAuth) {
                    await window.arweaveAuth.updateUserPreference('tier', this.customerData.tier);
                    await window.arweaveAuth.updateUserPreference('credits', this.customerData.credits);
                }

                // Notify Cal character
                this.notifyCalOfUpgrade(type);

                console.log('✅ Payment processed and saved to blockchain');
                this.showPaymentSuccess(type);
            }

        } catch (error) {
            console.error('Payment completion error:', error);
            this.showPaymentError('Payment verification failed');
        }
    }

    async verifyPayment(sessionId) {
        try {
            const response = await fetch(`/api/verify-payment/${sessionId}`, {
                headers: {
                    'X-Wallet-Address': this.customerData?.walletAddress
                }
            });

            if (!response.ok) {
                // Demo mode simulation
                return {
                    success: true,
                    amount: 29.99,
                    credits: 300,
                    type: 'demo'
                };
            }

            return await response.json();

        } catch (error) {
            console.error('Payment verification failed:', error);
            return { success: false };
        }
    }

    notifyCalOfUpgrade(upgradeType) {
        if (window.calCharacter) {
            const messages = {
                premium_subscription: "Excellent choice! Your premium features are now active. I can show you what's new.",
                founder_tier: "Welcome to the founder tier! You now have access to everything, including early features.",
                credits: "Credits added to your account. Ready to process some documents?"
            };

            const message = messages[upgradeType] || "Payment successful! Your account has been upgraded.";
            
            if (typeof window.calCharacter.updateMessage === 'function') {
                window.calCharacter.updateMessage(message, 'upgrade-success');
            }
        }
    }

    // Feature access control
    hasFeatureAccess(feature) {
        if (!this.customerData) return false;

        const tier = this.customerData.tier;
        
        switch (tier) {
            case 'founder':
                return true; // Founders get everything
            
            case 'premium':
                return this.config.features.premium.includes(feature) || 
                       this.config.features.founder.includes(feature);
            
            case 'free':
            default:
                return ['basic_job_applications', 'limited_processing'].includes(feature);
        }
    }

    canUseCredits(amount = 1) {
        if (!this.customerData) return false;
        
        // Unlimited credits for premium/founder
        if (this.customerData.credits === -1) return true;
        
        // Check if user has enough credits
        return this.customerData.credits >= amount;
    }

    async consumeCredits(amount = 1, purpose = 'api_call') {
        if (!this.canUseCredits(amount)) {
            throw new Error('Insufficient credits');
        }

        if (this.customerData.credits !== -1) {
            this.customerData.credits -= amount;
            
            // Save updated credit balance
            await this.savePaymentDataToArweave();
            
            // Log credit usage
            console.log(`💳 Used ${amount} credits for ${purpose}. Remaining: ${this.customerData.credits}`);
        }

        return true;
    }

    // UI Components
    createPricingModal() {
        const modalHTML = `
            <div class="stripe-pricing-modal" id="stripePricingModal">
                <div class="pricing-modal-backdrop"></div>
                <div class="pricing-modal-content">
                    <div class="pricing-header">
                        <h2>🚀 Unlock Premium Features</h2>
                        <button class="close-modal" onclick="stripeBridge.closePricingModal()">&times;</button>
                    </div>
                    
                    <div class="pricing-plans">
                        <!-- Free Tier -->
                        <div class="pricing-plan free ${this.customerData?.tier === 'free' ? 'current' : ''}">
                            <h3>Free Tier</h3>
                            <div class="price">$0<span>/month</span></div>
                            <ul>
                                <li>10 credits/month</li>
                                <li>Basic job applications</li>
                                <li>Limited AI models</li>
                                <li>Community support</li>
                            </ul>
                            ${this.customerData?.tier === 'free' ? 
                                '<button class="pricing-btn current">Current Plan</button>' : 
                                '<button class="pricing-btn" disabled>Downgrade Unavailable</button>'
                            }
                        </div>

                        <!-- Premium Tier -->
                        <div class="pricing-plan premium ${this.customerData?.tier === 'premium' ? 'current' : ''}">
                            <h3>Premium</h3>
                            <div class="price">$29.99<span>/month</span></div>
                            <ul>
                                <li>Unlimited credits</li>
                                <li>Advanced AI models</li>
                                <li>Priority processing</li>
                                <li>Custom templates</li>
                                <li>Analytics dashboard</li>
                            </ul>
                            ${this.customerData?.tier === 'premium' ? 
                                '<button class="pricing-btn current">Current Plan</button>' : 
                                '<button class="pricing-btn" onclick="stripeBridge.createPremiumSubscription()">Upgrade to Premium</button>'
                            }
                        </div>

                        <!-- Founder Tier -->
                        <div class="pricing-plan founder ${this.customerData?.tier === 'founder' ? 'current' : ''}">
                            <h3>Founder</h3>
                            <div class="price">$299.99<span>/lifetime</span></div>
                            <ul>
                                <li>All premium features</li>
                                <li>Early access to new features</li>
                                <li>Direct developer support</li>
                                <li>Custom integrations</li>
                                <li>Revenue sharing opportunities</li>
                            </ul>
                            ${this.customerData?.tier === 'founder' ? 
                                '<button class="pricing-btn current">Founder Member</button>' : 
                                '<button class="pricing-btn founder" onclick="stripeBridge.purchaseFounderTier()">Become a Founder</button>'
                            }
                        </div>
                    </div>

                    <!-- Credits Section -->
                    <div class="credits-section">
                        <h3>💎 Credits (Pay-as-you-go)</h3>
                        <div class="credits-packages">
                            <div class="credit-package">
                                <h4>Small Pack</h4>
                                <div class="price">$9.99</div>
                                <div class="credits">100 credits</div>
                                <button class="credit-btn" onclick="stripeBridge.purchaseCredits('small')">Buy Credits</button>
                            </div>
                            <div class="credit-package">
                                <h4>Medium Pack</h4>
                                <div class="price">$24.99</div>
                                <div class="credits">300 credits</div>
                                <button class="credit-btn" onclick="stripeBridge.purchaseCredits('medium')">Buy Credits</button>
                            </div>
                            <div class="credit-package">
                                <h4>Large Pack</h4>
                                <div class="price">$49.99</div>
                                <div class="credits">750 credits</div>
                                <button class="credit-btn" onclick="stripeBridge.purchaseCredits('large')">Buy Credits</button>
                            </div>
                        </div>
                    </div>

                    <div class="pricing-footer">
                        <p>💡 All payments are processed securely by Stripe and recorded on Arweave blockchain</p>
                        <p>🔒 Your data is permanently stored and accessible across all Soulfra platforms</p>
                    </div>
                </div>

                <style>
                    .stripe-pricing-modal {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        z-index: 10000;
                        display: none;
                    }
                    
                    .stripe-pricing-modal.active {
                        display: block;
                    }
                    
                    .pricing-modal-backdrop {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0, 0, 0, 0.8);
                        backdrop-filter: blur(5px);
                    }
                    
                    .pricing-modal-content {
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        background: #1a1a1a;
                        border-radius: 16px;
                        border: 2px solid #4ecca3;
                        max-width: 900px;
                        max-height: 90vh;
                        overflow-y: auto;
                        color: white;
                    }
                    
                    .pricing-header {
                        padding: 2rem;
                        border-bottom: 1px solid #333;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    
                    .close-modal {
                        background: none;
                        border: none;
                        color: #4ecca3;
                        font-size: 2rem;
                        cursor: pointer;
                    }
                    
                    .pricing-plans {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                        gap: 1rem;
                        padding: 2rem;
                    }
                    
                    .pricing-plan {
                        background: rgba(26, 26, 26, 0.5);
                        border: 1px solid #333;
                        border-radius: 12px;
                        padding: 1.5rem;
                        text-align: center;
                    }
                    
                    .pricing-plan.current {
                        border-color: #4ecca3;
                        background: rgba(78, 204, 163, 0.1);
                    }
                    
                    .pricing-plan h3 {
                        color: #4ecca3;
                        margin-bottom: 1rem;
                    }
                    
                    .price {
                        font-size: 2rem;
                        font-weight: bold;
                        margin-bottom: 1rem;
                    }
                    
                    .price span {
                        font-size: 1rem;
                        opacity: 0.7;
                    }
                    
                    .pricing-plan ul {
                        list-style: none;
                        margin: 1rem 0;
                        text-align: left;
                    }
                    
                    .pricing-plan li {
                        padding: 0.25rem 0;
                        position: relative;
                        padding-left: 1.5rem;
                    }
                    
                    .pricing-plan li::before {
                        content: '✓';
                        position: absolute;
                        left: 0;
                        color: #4ecca3;
                    }
                    
                    .pricing-btn, .credit-btn {
                        background: linear-gradient(45deg, #4ecca3, #3eb393);
                        color: #1a1a1a;
                        border: none;
                        padding: 0.75rem 1.5rem;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                        width: 100%;
                        transition: transform 0.2s ease;
                    }
                    
                    .pricing-btn:hover, .credit-btn:hover {
                        transform: scale(1.05);
                    }
                    
                    .pricing-btn.current {
                        background: #333;
                        color: #4ecca3;
                        cursor: default;
                    }
                    
                    .pricing-btn.founder {
                        background: linear-gradient(45deg, #ffd700, #ffed4e);
                        color: #000;
                    }
                    
                    .credits-section {
                        padding: 2rem;
                        border-top: 1px solid #333;
                    }
                    
                    .credits-packages {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 1rem;
                        margin-top: 1rem;
                    }
                    
                    .credit-package {
                        background: rgba(26, 26, 26, 0.5);
                        border: 1px solid #333;
                        border-radius: 8px;
                        padding: 1rem;
                        text-align: center;
                    }
                    
                    .credits {
                        color: #4ecca3;
                        font-weight: bold;
                        margin: 0.5rem 0;
                    }
                    
                    .pricing-footer {
                        padding: 1rem 2rem;
                        border-top: 1px solid #333;
                        text-align: center;
                        font-size: 0.9rem;
                        opacity: 0.8;
                    }
                </style>
            </div>
        `;

        // Remove existing modal
        const existing = document.getElementById('stripePricingModal');
        if (existing) existing.remove();

        // Add to page
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    showPricingModal() {
        this.createPricingModal();
        const modal = document.getElementById('stripePricingModal');
        if (modal) {
            modal.classList.add('active');
            
            // Close on backdrop click
            modal.querySelector('.pricing-modal-backdrop').addEventListener('click', () => {
                this.closePricingModal();
            });
        }
    }

    closePricingModal() {
        const modal = document.getElementById('stripePricingModal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        }
    }

    showPaymentSuccess(type) {
        // Show success notification
        const message = `Payment successful! Your ${type.replace('_', ' ')} is now active.`;
        this.showNotification(message, 'success');
    }

    showPaymentError(message) {
        this.showNotification(`Payment failed: ${message}`, 'error');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `stripe-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
            <style>
                .stripe-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #1a1a1a;
                    border: 1px solid #4ecca3;
                    border-radius: 8px;
                    padding: 1rem;
                    color: white;
                    z-index: 10001;
                    max-width: 400px;
                }
                .stripe-notification.error {
                    border-color: #e94560;
                    background: rgba(233, 69, 96, 0.1);
                }
                .stripe-notification.success {
                    border-color: #4ecca3;
                    background: rgba(78, 204, 163, 0.1);
                }
                .notification-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .notification-content button {
                    background: none;
                    border: none;
                    color: inherit;
                    font-size: 1.2rem;
                    cursor: pointer;
                    margin-left: 1rem;
                }
            </style>
        `;

        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    clearCustomerData() {
        this.customerData = null;
        this.subscriptions = [];
        this.paymentHistory = [];
    }

    // Public API methods
    getCustomerStatus() {
        return {
            tier: this.customerData?.tier || 'free',
            credits: this.customerData?.credits || 0,
            hasSubscription: this.subscriptions.length > 0,
            canUpgrade: this.customerData?.tier !== 'founder'
        };
    }

    async requestPremiumFeature(feature) {
        if (this.hasFeatureAccess(feature)) {
            return { allowed: true };
        }

        // Show pricing modal for upgrade
        this.showPricingModal();
        
        return { 
            allowed: false, 
            reason: 'Premium feature - upgrade required',
            upgradeModal: true 
        };
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.stripeBridge = new StripeArweaveBridge({
        stripe: {
            publishableKey: 'pk_test_your_stripe_publishable_key_here' // Replace with real key
        }
    });

    // Add premium button to Cal character if it exists
    if (window.calCharacter) {
        // Enhance Cal's premium features method
        const originalShowPremiumFeatures = window.calCharacter.showPremiumFeatures;
        
        window.calCharacter.showPremiumFeatures = function() {
            if (!window.arweaveAuth?.isAuthenticated) {
                this.updateMessage("Premium features require Soulfra wallet authentication. Ready to connect?", 'premium-prompt');
                return;
            }

            // Show Stripe pricing modal instead of just listing features
            window.stripeBridge.showPricingModal();
            this.updateMessage("Opening premium upgrade options... Choose the plan that's right for you!", 'premium-upgrade');
        };
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StripeArweaveBridge;
}