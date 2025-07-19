import Stripe from 'stripe';
export interface PricingTier {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    description: string;
    features: string[];
    limits: {
        filesPerMonth: number;
        fileSizeLimit: number;
        agentsAllowed: number;
        collaborationsPerMonth: number;
        showcasesPerMonth: number;
        apiCallsPerMonth: number;
        supportLevel: 'community' | 'email' | 'priority' | 'white-glove';
    };
    viralBenefits: {
        tokenMultiplier: number;
        referralBonus: number;
        dividendRate: number;
        earlyAccess: boolean;
    };
    stripeProductId?: string;
    stripePriceId?: string;
}
export declare const PRICING_TIERS: Record<string, PricingTier>;
export declare class PricingService {
    getRecommendedTier(userId: string): Promise<string>;
    calculateSavings(fromTier: string, toTier: string, monthlyUsage: number): number;
    getPricingDisplay(userId?: string): Promise<{
        tiers: PricingTier[];
        recommended?: string;
        savings?: Record<string, number>;
        currentTier?: string;
    }>;
}
export interface CheckoutSessionOptions {
    jobId?: string;
    tierId: string;
    userId?: string;
    successUrl?: string;
    cancelUrl?: string;
    metadata?: Record<string, string>;
}
export declare function createTieredCheckoutSession(options: CheckoutSessionOptions): Promise<{
    sessionId: string;
    url: string;
    tierId: string;
    price: number;
}>;
export declare function handleTieredCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void>;
export declare const pricingService: PricingService;
export declare function createCheckoutSession(jobId: string): Promise<{
    sessionId: string;
    url: string;
    jobId: string;
}>;
//# sourceMappingURL=pricing.service.d.ts.map