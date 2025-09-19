/**
 * Stripe Custom Token Integration System
 * Tier 3 Production Payment Processing
 * Supports custom tokens for AI exploration features
 */

class StripeTokenIntegration {
    constructor() {
        this.stripe = null;
        this.isProduction = false;
        this.userId = this.generateUserId();
        this.tokenBalance = this.loadTokenBalance();
        
        // Token pricing (in cents)
        this.tokenRates = {
            // AI Explorer Features
            ai_spawn: 10,              // $0.10 per AI explorer spawn
            world_generation: 50,      // $0.50 per document scan & world generation
            premium_scan: 100,         // $1.00 for high-quality laser scanning
            collaboration_mode: 200,   // $2.00 for AI collaboration features
            
            // Visual & Experience Features
            cinematic_mode: 500,       // $5.00 for movie-like camera controls
            premium_themes: 200,       // $2.00 for gold/premium visual themes
            laser_effects: 150,        // $1.50 for enhanced laser beam effects
            
            // Document Processing
            ocr_processing: 100,       // $1.00 per document OCR processing
            ai_analysis: 200,          // $2.00 for AI document analysis
            world_customization: 300,  // $3.00 for custom world editing
            
            // Subscription Features
            monthly_premium: 999,      // $9.99/month premium subscription
            annual_premium: 9999,      // $99.99/year premium subscription
            enterprise: 29999          // $299.99/year enterprise features
        };
        
        // Feature access levels
        this.featureAccess = {
            free: ['ai_spawn', 'world_generation'],
            premium: ['ai_spawn', 'world_generation', 'premium_scan', 'premium_themes', 'laser_effects'],
            enterprise: Object.keys(this.tokenRates)
        };
        
        this.init();
    }
    
    async init() {
        try {
            // Initialize Stripe (use test key for development)
            this.stripe = Stripe(this.isProduction ? 
                'pk_live_...' : // Production key
                'pk_test_51234567890abcdef' // Test key placeholder
            );
            
            // Load existing payment methods
            await this.loadPaymentMethods();
            
            // Update UI
            this.updateTokenDisplay();
            
            console.log('💳 Stripe Token Integration initialized');
            console.log('🪙 Current token balance:', this.tokenBalance);
            
        } catch (error) {
            console.error('Failed to initialize Stripe:', error);
            this.showError('Payment system unavailable');
        }
    }
    
    generateUserId() {
        // Generate anonymous but persistent user ID
        let userId = localStorage.getItem('ai_explorer_user_id');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('ai_explorer_user_id', userId);
        }
        return userId;
    }
    
    loadTokenBalance() {
        const saved = localStorage.getItem('ai_explorer_tokens');
        return saved ? parseInt(saved) : 100; // Start with 100 free tokens
    }
    
    saveTokenBalance() {
        localStorage.setItem('ai_explorer_tokens', this.tokenBalance.toString());
        this.updateTokenDisplay();
    }
    
    async loadPaymentMethods() {
        // Load saved payment methods from localStorage (in production, use secure backend)
        const saved = localStorage.getItem('ai_explorer_payment_methods');
        this.paymentMethods = saved ? JSON.parse(saved) : [];
    }
    
    // Token Purchase Methods
    async purchaseTokens(tokenType, quantity = 1, options = {}) {
        const cost = this.tokenRates[tokenType] * quantity;
        
        if (!cost) {
            throw new Error(`Unknown token type: ${tokenType}`);
        }
        
        try {
            // Check if user has sufficient balance for small purchases
            if (cost <= 100 && this.tokenBalance >= cost) {
                return this.deductTokens(tokenType, quantity);
            }
            
            // For larger purchases or insufficient balance, process payment
            const paymentIntent = await this.createPaymentIntent(tokenType, quantity, cost);
            const result = await this.confirmPayment(paymentIntent);
            
            if (result.success) {
                this.addTokens(cost);
                return this.deductTokens(tokenType, quantity);
            } else {
                throw new Error('Payment failed: ' + result.error);
            }
            
        } catch (error) {
            console.error('Token purchase failed:', error);
            throw error;
        }
    }
    
    async createPaymentIntent(tokenType, quantity, amount) {
        // In production, this would call your backend API
        // For demo purposes, we'll simulate the payment intent
        
        return {
            id: 'pi_' + Date.now(),
            client_secret: 'pi_' + Date.now() + '_secret_' + Math.random().toString(36),
            amount: amount,
            currency: 'usd',
            metadata: {
                user_id: this.userId,
                token_type: tokenType,
                quantity: quantity,
                tier: '3'
            }
        };
    }
    
    async confirmPayment(paymentIntent) {
        try {
            // Simulate payment confirmation
            // In production, use Stripe's confirmCardPayment method
            
            const result = await this.simulatePaymentConfirmation(paymentIntent);
            
            if (result.success) {
                // Record successful payment
                this.recordPayment(paymentIntent);
                this.showSuccess(`Payment of $${(paymentIntent.amount / 100).toFixed(2)} successful!`);
            }
            
            return result;
            
        } catch (error) {
            this.showError('Payment confirmation failed: ' + error.message);
            return { success: false, error: error.message };
        }
    }
    
    async simulatePaymentConfirmation(paymentIntent) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 95% success rate for demo
        const success = Math.random() > 0.05;
        
        return {
            success: success,
            paymentIntent: success ? paymentIntent : null,
            error: success ? null : 'Card declined'
        };
    }
    
    recordPayment(paymentIntent) {
        const payment = {
            id: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            metadata: paymentIntent.metadata,
            timestamp: new Date().toISOString(),
            status: 'succeeded'
        };
        
        // Save to localStorage (in production, save to secure backend)
        const payments = JSON.parse(localStorage.getItem('ai_explorer_payments') || '[]');
        payments.push(payment);
        localStorage.setItem('ai_explorer_payments', JSON.stringify(payments));
    }
    
    // Token Management
    addTokens(amount) {
        this.tokenBalance += amount;
        this.saveTokenBalance();
        console.log(`Added ${amount} tokens. New balance: ${this.tokenBalance}`);
    }
    
    deductTokens(tokenType, quantity = 1) {
        const cost = this.tokenRates[tokenType] * quantity;
        
        if (this.tokenBalance < cost) {
            throw new Error(`Insufficient tokens. Need ${cost}, have ${this.tokenBalance}`);
        }
        
        this.tokenBalance -= cost;
        this.saveTokenBalance();
        
        console.log(`Used ${cost} tokens for ${tokenType} x${quantity}. Remaining: ${this.tokenBalance}`);
        
        return {
            success: true,
            tokenType: tokenType,
            quantity: quantity,
            cost: cost,
            remainingBalance: this.tokenBalance
        };
    }
    
    canAfford(tokenType, quantity = 1) {
        const cost = this.tokenRates[tokenType] * quantity;
        return this.tokenBalance >= cost;
    }
    
    // Subscription Management
    async createSubscription(plan) {
        if (!['monthly_premium', 'annual_premium', 'enterprise'].includes(plan)) {
            throw new Error('Invalid subscription plan');
        }
        
        try {
            const amount = this.tokenRates[plan];
            const paymentIntent = await this.createPaymentIntent(plan, 1, amount);
            const result = await this.confirmPayment(paymentIntent);
            
            if (result.success) {
                // Activate subscription
                this.activateSubscription(plan);
                return { success: true, plan: plan };
            } else {
                throw new Error('Subscription payment failed');
            }
            
        } catch (error) {
            console.error('Subscription creation failed:', error);
            throw error;
        }
    }
    
    activateSubscription(plan) {
        const subscription = {
            plan: plan,
            activated: new Date().toISOString(),
            expires: this.calculateExpiration(plan),
            status: 'active'
        };
        
        localStorage.setItem('ai_explorer_subscription', JSON.stringify(subscription));
        
        // Grant premium tokens based on plan
        if (plan === 'monthly_premium') {
            this.addTokens(1000); // 1000 tokens per month
        } else if (plan === 'annual_premium') {
            this.addTokens(15000); // 15000 tokens per year (25% bonus)
        } else if (plan === 'enterprise') {
            this.addTokens(50000); // 50000 tokens per year
        }
        
        this.showSuccess(`${plan.replace('_', ' ')} subscription activated!`);
    }
    
    calculateExpiration(plan) {
        const now = new Date();
        if (plan.includes('monthly')) {
            now.setMonth(now.getMonth() + 1);
        } else if (plan.includes('annual') || plan.includes('enterprise')) {
            now.setFullYear(now.getFullYear() + 1);
        }
        return now.toISOString();
    }
    
    getSubscriptionStatus() {
        const saved = localStorage.getItem('ai_explorer_subscription');
        if (!saved) return null;
        
        const subscription = JSON.parse(saved);
        const now = new Date();
        const expires = new Date(subscription.expires);
        
        if (now > expires) {
            // Subscription expired
            localStorage.removeItem('ai_explorer_subscription');
            return null;
        }
        
        return subscription;
    }
    
    // Feature Access Control
    hasFeatureAccess(feature) {
        const subscription = this.getSubscriptionStatus();
        
        if (subscription) {
            const plan = subscription.plan;
            if (plan === 'enterprise') return true;
            if (plan.includes('premium') && this.featureAccess.premium.includes(feature)) return true;
        }
        
        // Check free tier access
        return this.featureAccess.free.includes(feature);
    }
    
    async requestFeatureAccess(feature, quantity = 1) {
        // Check if user has subscription access
        if (this.hasFeatureAccess(feature)) {
            return { success: true, method: 'subscription' };
        }
        
        // Check if user can afford with tokens
        if (this.canAfford(feature, quantity)) {
            try {
                const result = await this.purchaseTokens(feature, quantity);
                return { success: true, method: 'tokens', ...result };
            } catch (error) {
                return { success: false, error: error.message };
            }
        }
        
        // Need to purchase tokens or upgrade subscription
        return { 
            success: false, 
            error: 'Insufficient access',
            options: {
                purchaseTokens: this.tokenRates[feature] * quantity,
                upgradeSubscription: 'premium'
            }
        };
    }
    
    // UI Integration Methods
    updateTokenDisplay() {
        const displays = document.querySelectorAll('.token-balance');
        displays.forEach(display => {
            display.textContent = this.tokenBalance.toLocaleString();
        });
        
        const subscription = this.getSubscriptionStatus();
        const statusDisplays = document.querySelectorAll('.subscription-status');
        statusDisplays.forEach(display => {
            display.textContent = subscription ? 
                subscription.plan.replace('_', ' ').toUpperCase() : 'FREE';
        });
    }
    
    createTokenUI() {
        const tokenUI = document.createElement('div');
        tokenUI.className = 'token-ui';
        tokenUI.innerHTML = `
            <div class="token-display">
                <span class="token-icon">🪙</span>
                <span class="token-balance">${this.tokenBalance}</span>
                <button class="buy-tokens-btn" onclick="stripeIntegration.showTokenPurchase()">
                    💳 Buy Tokens
                </button>
            </div>
            <div class="subscription-display">
                <span class="subscription-status">${this.getSubscriptionStatus()?.plan || 'FREE'}</span>
                <button class="upgrade-btn" onclick="stripeIntegration.showSubscriptionOptions()">
                    ⭐ Upgrade
                </button>
            </div>
        `;
        
        return tokenUI;
    }
    
    showTokenPurchase() {
        const modal = this.createModal('Purchase Tokens', this.createTokenPurchaseUI());
        document.body.appendChild(modal);
    }
    
    createTokenPurchaseUI() {
        return `
            <div class="token-purchase-options">
                <div class="purchase-option" onclick="stripeIntegration.buyTokenPackage(1000, 999)">
                    <h3>Starter Pack</h3>
                    <div class="token-amount">1,000 tokens</div>
                    <div class="token-price">$9.99</div>
                </div>
                <div class="purchase-option popular" onclick="stripeIntegration.buyTokenPackage(5000, 3999)">
                    <h3>Popular Pack</h3>
                    <div class="token-amount">5,000 tokens</div>
                    <div class="token-price">$39.99</div>
                    <div class="savings">20% savings!</div>
                </div>
                <div class="purchase-option" onclick="stripeIntegration.buyTokenPackage(15000, 9999)">
                    <h3>Premium Pack</h3>
                    <div class="token-amount">15,000 tokens</div>
                    <div class="token-price">$99.99</div>
                    <div class="savings">33% savings!</div>
                </div>
            </div>
        `;
    }
    
    async buyTokenPackage(tokens, price) {
        try {
            this.showLoading('Processing payment...');
            
            const paymentIntent = await this.createPaymentIntent('token_package', 1, price);
            const result = await this.confirmPayment(paymentIntent);
            
            if (result.success) {
                this.addTokens(tokens);
                this.closeModal();
                this.showSuccess(`Successfully purchased ${tokens.toLocaleString()} tokens!`);
            } else {
                this.showError('Payment failed. Please try again.');
            }
        } catch (error) {
            this.showError('Purchase failed: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }
    
    showSubscriptionOptions() {
        const modal = this.createModal('Subscription Plans', this.createSubscriptionUI());
        document.body.appendChild(modal);
    }
    
    createSubscriptionUI() {
        return `
            <div class="subscription-options">
                <div class="subscription-option" onclick="stripeIntegration.subscribe('monthly_premium')">
                    <h3>Premium Monthly</h3>
                    <div class="sub-price">$9.99/month</div>
                    <ul>
                        <li>1,000 tokens/month</li>
                        <li>Premium themes</li>
                        <li>Enhanced scanning</li>
                        <li>Priority support</li>
                    </ul>
                </div>
                <div class="subscription-option popular" onclick="stripeIntegration.subscribe('annual_premium')">
                    <h3>Premium Annual</h3>
                    <div class="sub-price">$99.99/year</div>
                    <div class="savings">2 months free!</div>
                    <ul>
                        <li>15,000 tokens/year</li>
                        <li>All premium features</li>
                        <li>Cinematic mode</li>
                        <li>Advanced AI collaboration</li>
                    </ul>
                </div>
                <div class="subscription-option" onclick="stripeIntegration.subscribe('enterprise')">
                    <h3>Enterprise</h3>
                    <div class="sub-price">$299.99/year</div>
                    <ul>
                        <li>50,000 tokens/year</li>
                        <li>All features unlocked</li>
                        <li>API access</li>
                        <li>Dedicated support</li>
                        <li>Custom integrations</li>
                    </ul>
                </div>
            </div>
        `;
    }
    
    async subscribe(plan) {
        try {
            this.showLoading('Setting up subscription...');
            await this.createSubscription(plan);
            this.closeModal();
        } catch (error) {
            this.showError('Subscription failed: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }
    
    // UI Helper Methods
    createModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'payment-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${title}</h2>
                    <button class="close-btn" onclick="stripeIntegration.closeModal()">×</button>
                </div>
                <div class="modal-body">${content}</div>
            </div>
        `;
        return modal;
    }
    
    closeModal() {
        const modal = document.querySelector('.payment-modal');
        if (modal) modal.remove();
    }
    
    showSuccess(message) {
        this.showNotification(message, 'success');
    }
    
    showError(message) {
        this.showNotification(message, 'error');
    }
    
    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    showLoading(message) {
        const loading = document.createElement('div');
        loading.className = 'loading-overlay';
        loading.innerHTML = `
            <div class="loading-content">
                <div class="spinner"></div>
                <div class="loading-text">${message}</div>
            </div>
        `;
        loading.id = 'loading-overlay';
        document.body.appendChild(loading);
    }
    
    hideLoading() {
        const loading = document.getElementById('loading-overlay');
        if (loading) loading.remove();
    }
    
    // Analytics and Reporting
    getUsageStats() {
        const payments = JSON.parse(localStorage.getItem('ai_explorer_payments') || '[]');
        const totalSpent = payments.reduce((sum, payment) => sum + payment.amount, 0);
        
        return {
            totalTokensPurchased: payments.length,
            totalSpent: totalSpent / 100, // Convert from cents
            currentBalance: this.tokenBalance,
            subscription: this.getSubscriptionStatus(),
            recentPayments: payments.slice(-5)
        };
    }
    
    // Export configuration for deployment
    getDeploymentConfig() {
        return {
            environment: this.isProduction ? 'production' : 'development',
            webhookEndpoints: [
                '/api/stripe/webhooks/payment-success',
                '/api/stripe/webhooks/subscription-update',
                '/api/stripe/webhooks/payment-failed'
            ],
            requiredEnvVars: [
                'STRIPE_PUBLISHABLE_KEY',
                'STRIPE_SECRET_KEY',
                'STRIPE_WEBHOOK_SECRET'
            ],
            tokenRates: this.tokenRates,
            featureAccess: this.featureAccess
        };
    }
}

// CSS for Stripe Integration UI
const stripeCSS = `
<style>
    .token-ui {
        position: fixed;
        top: 20px;
        right: 300px;
        display: flex;
        gap: 15px;
        z-index: 2000;
        font-family: 'Orbitron', monospace;
    }
    
    .token-display, .subscription-display {
        background: linear-gradient(135deg, #1a1a1a, #2a2a0a);
        border: 2px solid var(--gold-primary);
        border-radius: 12px;
        padding: 10px 15px;
        display: flex;
        align-items: center;
        gap: 10px;
        backdrop-filter: blur(10px);
    }
    
    .token-icon {
        font-size: 1.2rem;
    }
    
    .token-balance {
        color: var(--gold-primary);
        font-weight: bold;
        font-size: 1.1rem;
    }
    
    .buy-tokens-btn, .upgrade-btn {
        background: linear-gradient(45deg, var(--gold-primary), var(--gold-accent));
        border: none;
        border-radius: 8px;
        padding: 8px 12px;
        font-size: 0.9rem;
        font-weight: bold;
        color: #000;
        cursor: pointer;
        transition: all 0.3s;
        font-family: 'Orbitron', monospace;
    }
    
    .buy-tokens-btn:hover, .upgrade-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 0 15px rgba(255, 215, 0, 0.6);
    }
    
    .subscription-status {
        color: var(--cyber-green);
        font-weight: bold;
        font-size: 0.9rem;
    }
    
    .payment-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 3000;
        backdrop-filter: blur(10px);
    }
    
    .modal-content {
        background: linear-gradient(135deg, #1a1a1a, #2a2a0a);
        border: 2px solid var(--gold-primary);
        border-radius: 20px;
        max-width: 800px;
        width: 90%;
        max-height: 80%;
        overflow-y: auto;
    }
    
    .modal-header {
        padding: 20px;
        border-bottom: 1px solid var(--gold-dark);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .modal-header h2 {
        color: var(--gold-primary);
        margin: 0;
    }
    
    .close-btn {
        background: none;
        border: none;
        color: var(--gold-primary);
        font-size: 1.5rem;
        cursor: pointer;
        padding: 5px;
        border-radius: 50%;
        width: 35px;
        height: 35px;
    }
    
    .close-btn:hover {
        background: rgba(255, 215, 0, 0.2);
    }
    
    .modal-body {
        padding: 20px;
    }
    
    .token-purchase-options, .subscription-options {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
    }
    
    .purchase-option, .subscription-option {
        background: linear-gradient(135deg, #2a2a2a, #1a1a1a);
        border: 2px solid var(--gold-dark);
        border-radius: 15px;
        padding: 20px;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s;
        position: relative;
    }
    
    .purchase-option:hover, .subscription-option:hover {
        border-color: var(--gold-primary);
        transform: translateY(-5px);
        box-shadow: 0 0 25px rgba(255, 215, 0, 0.3);
    }
    
    .purchase-option.popular, .subscription-option.popular {
        border-color: var(--cyber-green);
        position: relative;
    }
    
    .purchase-option.popular::before, .subscription-option.popular::before {
        content: "POPULAR";
        position: absolute;
        top: -10px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--cyber-green);
        color: #000;
        padding: 5px 15px;
        border-radius: 15px;
        font-size: 0.8rem;
        font-weight: bold;
    }
    
    .purchase-option h3, .subscription-option h3 {
        color: var(--gold-primary);
        margin-bottom: 15px;
    }
    
    .token-amount, .sub-price {
        font-size: 1.3rem;
        font-weight: bold;
        color: var(--gold-light);
        margin-bottom: 10px;
    }
    
    .token-price {
        font-size: 1.5rem;
        font-weight: bold;
        color: var(--cyber-green);
    }
    
    .savings {
        color: var(--cyber-green);
        font-size: 0.9rem;
        font-weight: bold;
        margin-top: 5px;
    }
    
    .subscription-option ul {
        list-style: none;
        padding: 0;
        margin-top: 15px;
    }
    
    .subscription-option li {
        color: var(--gold-light);
        margin: 8px 0;
        font-size: 0.9rem;
    }
    
    .subscription-option li::before {
        content: "✓ ";
        color: var(--cyber-green);
        font-weight: bold;
    }
    
    .notification {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%) translateY(-50px);
        background: linear-gradient(135deg, #1a1a1a, #2a2a0a);
        border: 2px solid var(--gold-primary);
        border-radius: 12px;
        padding: 15px 25px;
        color: var(--gold-light);
        z-index: 4000;
        opacity: 0;
        transition: all 0.3s;
        font-family: 'Orbitron', monospace;
    }
    
    .notification.show {
        opacity: 1;
        transform: translateX(-50%) translateY(0);
    }
    
    .notification.success {
        border-color: var(--cyber-green);
    }
    
    .notification.error {
        border-color: var(--cyber-pink);
    }
    
    .loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 5000;
        backdrop-filter: blur(10px);
    }
    
    .loading-content {
        text-align: center;
        color: var(--gold-primary);
    }
    
    .spinner {
        width: 50px;
        height: 50px;
        border: 3px solid var(--gold-dark);
        border-top: 3px solid var(--gold-primary);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 20px auto;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .loading-text {
        font-family: 'Orbitron', monospace;
        font-size: 1.1rem;
    }
</style>
`;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StripeTokenIntegration;
} else if (typeof window !== 'undefined') {
    window.StripeTokenIntegration = StripeTokenIntegration;
    
    // Inject CSS
    document.head.insertAdjacentHTML('beforeend', stripeCSS);
    
    // Initialize global instance
    window.stripeIntegration = new StripeTokenIntegration();
}

console.log('💳 Stripe Token Integration loaded');
console.log('🪙 Custom token system ready for Tier 3 deployment');