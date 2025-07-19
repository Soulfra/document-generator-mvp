import winston from 'winston';
export declare const logger: winston.Logger;
export declare const stream: {
    write: (message: string) => void;
};
export declare const logError: (message: string, error: Error, meta?: Record<string, any>) => void;
export declare const logInfo: (message: string, meta?: Record<string, any>) => void;
export declare const logDebug: (message: string, meta?: Record<string, any>) => void;
export declare const logWarn: (message: string, meta?: Record<string, any>) => void;
//# sourceMappingURL=logger.d.ts.map