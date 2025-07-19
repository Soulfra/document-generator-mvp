import * as Sentry from '@sentry/node';
export declare function initializeSentry(): void;
export declare class SentryUtils {
    static captureException(error: Error, context?: Record<string, any>): string;
    static captureMessage(message: string, level?: Sentry.SeverityLevel, context?: Record<string, any>): string;
    static setUser(user: {
        id?: string;
        email?: string;
        username?: string;
        tier?: string;
    }): void;
    static addBreadcrumb(message: string, category: string, data?: Record<string, any>): void;
    static startTransaction(name: string, operation: string): Sentry.Transaction;
    static trackLLMCall<T>(provider: string, operation: string, fn: () => Promise<T>, context?: Record<string, any>): Promise<T>;
    static trackDatabaseOperation<T>(operation: string, table: string, fn: () => Promise<T>): Promise<T>;
    static trackExternalCall<T>(service: string, operation: string, fn: () => Promise<T>, url?: string): Promise<T>;
}
export declare function setupSentryFingerprinting(): void;
export declare function closeSentry(): Promise<boolean>;
export declare function getSentryHealth(): {
    status: string;
    configured: boolean;
    environment: string;
};
export default Sentry;
//# sourceMappingURL=sentry.d.ts.map