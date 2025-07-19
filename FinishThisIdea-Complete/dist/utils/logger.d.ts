import winston from 'winston';
export declare const logger: winston.Logger;
export declare const stream: {
    write: (message: string) => void;
};
export declare const logError: (message: string, error: Error | any, meta?: Record<string, any>) => void;
export declare const logInfo: (message: string, meta?: Record<string, any>) => void;
export declare const logDebug: (message: string, meta?: Record<string, any>) => void;
export declare const logWarn: (message: string, meta?: Record<string, any>) => void;
export declare const logSecurity: (event: string, meta?: Record<string, any>) => void;
export declare const logAuth: (event: string, userId?: string, meta?: Record<string, any>) => void;
export declare const logPayment: (event: string, userId?: string, amount?: number, meta?: Record<string, any>) => void;
export declare const logRequest: (method: string, path: string, statusCode: number, responseTime: number, userId?: string, meta?: Record<string, any>) => void;
export declare const logPerformance: (operation: string, duration: number, meta?: Record<string, any>) => void;
export declare const logMetric: (metric: string, value: number, unit?: string, meta?: Record<string, any>) => void;
export default logger;
//# sourceMappingURL=logger.d.ts.map