export interface ServiceRequest {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    path: string;
    data?: any;
    headers?: Record<string, string>;
    timeout?: number;
}
export interface ServiceResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    statusCode: number;
    headers: Record<string, string>;
    responseTime: number;
}
export interface CircuitBreakerState {
    failures: number;
    lastFailureTime: number;
    state: 'closed' | 'open' | 'half-open';
    nextAttempt: number;
}
export declare class ServiceClient {
    private circuitBreakers;
    private readonly MAX_FAILURES;
    private readonly RECOVERY_TIMEOUT;
    private readonly DEFAULT_TIMEOUT;
    constructor();
    private initializeCircuitBreakers;
    request<T = any>(serviceName: string, request: ServiceRequest): Promise<ServiceResponse<T>>;
    get<T = any>(serviceName: string, path: string, headers?: Record<string, string>): Promise<ServiceResponse<T>>;
    post<T = any>(serviceName: string, path: string, data?: any, headers?: Record<string, string>): Promise<ServiceResponse<T>>;
    put<T = any>(serviceName: string, path: string, data?: any, headers?: Record<string, string>): Promise<ServiceResponse<T>>;
    delete<T = any>(serviceName: string, path: string, headers?: Record<string, string>): Promise<ServiceResponse<T>>;
    private makeRequestWithRetry;
    private canMakeRequest;
    private recordSuccess;
    private recordFailure;
    private getAuthHeaders;
    getCircuitBreakerStatus(): Record<string, CircuitBreakerState>;
    resetCircuitBreaker(serviceName: string): void;
}
export declare const serviceClient: ServiceClient;
//# sourceMappingURL=service-client.d.ts.map