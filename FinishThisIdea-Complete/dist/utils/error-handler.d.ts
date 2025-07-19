import { Request, Response, NextFunction } from 'express';
import { AppError } from './errors';
export declare function withErrorHandling<T extends any[], R>(fn: (...args: T) => Promise<R>, context: string, timeout?: number): (...args: T) => Promise<R>;
export declare function withRetry<T>(operation: () => Promise<T>, options?: {
    maxRetries?: number;
    delay?: number;
    backoffMultiplier?: number;
    retryOn?: (error: any) => boolean;
    context?: string;
}): Promise<T>;
export declare class CircuitBreaker {
    private threshold;
    private resetTimeout;
    private failures;
    private lastFailTime;
    private state;
    constructor(threshold?: number, resetTimeout?: number);
    execute<T>(operation: () => Promise<T>, context?: string): Promise<T>;
    private recordFailure;
    private reset;
    getState(): {
        state: string;
        failures: number;
        lastFailTime: number;
    };
}
export declare function errorHandler(error: any, req: Request, res: Response, next: NextFunction): void;
export declare function isOperationalError(error: any): error is AppError;
export declare function setupGlobalErrorHandlers(): void;
export declare const llmCircuitBreaker: CircuitBreaker;
export declare const s3CircuitBreaker: CircuitBreaker;
export declare const stripeCircuitBreaker: CircuitBreaker;
export declare const redisCircuitBreaker: CircuitBreaker;
export { AppError as DocumentationError, ValidationError, TimeoutError, ExternalServiceError as LLMError, } from './errors';
//# sourceMappingURL=error-handler.d.ts.map