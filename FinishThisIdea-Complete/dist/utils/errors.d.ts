export declare class AppError extends Error {
    readonly statusCode: number;
    readonly isOperational: boolean;
    readonly code?: string;
    readonly details?: any;
    constructor(message: string, statusCode: number, code?: string, details?: any, isOperational?: boolean);
}
export declare class ValidationError extends AppError {
    constructor(message: string, details?: any);
}
export declare class AuthenticationError extends AppError {
    constructor(message?: string, details?: any);
}
export declare class ForbiddenError extends AppError {
    constructor(message?: string, details?: any);
}
export declare class NotFoundError extends AppError {
    constructor(message?: string, details?: any);
}
export declare class ConflictError extends AppError {
    constructor(message: string, details?: any);
}
export declare class RateLimitError extends AppError {
    constructor(message?: string, details?: any);
}
export declare class ExternalServiceError extends AppError {
    constructor(message: string, service?: string);
}
export declare class PaymentError extends AppError {
    constructor(message: string);
}
export declare class ProcessingError extends AppError {
    constructor(message: string, details?: any);
}
export declare class FileProcessingError extends AppError {
    constructor(message: string, details?: any);
}
export declare class TimeoutError extends AppError {
    constructor(operation: string, timeout: number);
}
export declare class ResourceLimitError extends AppError {
    constructor(resource: string, limit: number, actual: number);
}
export declare class DatabaseError extends AppError {
    constructor(message: string, details?: any);
}
export declare class SecurityError extends AppError {
    constructor(message: string, details?: any);
}
export interface ErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: any;
    };
    requestId?: string;
}
export declare function formatErrorResponse(error: AppError, requestId?: string): ErrorResponse;
export declare function isError(error: unknown): error is Error;
export declare function isAppError(error: unknown): error is AppError;
export declare function getErrorMessage(error: unknown): string;
export declare function toAppError(error: unknown): AppError;
export declare function handleError(error: unknown): AppError;
//# sourceMappingURL=errors.d.ts.map