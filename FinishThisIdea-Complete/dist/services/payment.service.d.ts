export interface CheckoutSession {
    sessionId: string;
    url: string;
    jobId: string;
}
export interface StripeSessionConfig {
    jobId: string;
    amount: number;
    currency: string;
    description: string;
}
export declare function createStripeSession(config: StripeSessionConfig): Promise<{
    id: string;
    url: string;
}>;
export declare function createCheckoutSession(jobId: string): Promise<CheckoutSession>;
export declare function handleWebhook(body: Buffer, signature: string): Promise<void>;
//# sourceMappingURL=payment.service.d.ts.map