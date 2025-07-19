interface LogContext {
    service: string;
    jobId?: string;
    userId?: string;
    sessionId?: string;
    operation?: string;
    metadata?: Record<string, any>;
}
export declare class PlatformLoggerService {
    private logger;
    private errorLogsPath;
    private performanceLogsPath;
    private metricsBuffer;
    private errorBuffer;
    private flushInterval;
    constructor();
    private initializeDirectories;
    private setupLogger;
    logError(error: Error | any, context: LogContext, recovery?: {
        attempted: boolean;
        successful: boolean;
        strategy: string;
    }): Promise<void>;
    logWarning(message: string, context: LogContext): Promise<void>;
    logInfo(message: string, context: LogContext): void;
    trackPerformance(operation: string, duration: number, context?: LogContext): Promise<void>;
    getHealthStatus(): Promise<any>;
    getErrorAnalytics(timeRange?: string): Promise<any>;
    private startMetricsCollection;
    private flushBuffers;
    private cacheError;
    private isCriticalError;
    private alertCriticalError;
    private getCriticalErrorCount;
    createServiceLogger(service: string, defaultContext?: Partial<LogContext>): {
        info: (message: string, context?: Partial<LogContext>) => void;
        warn: (message: string, context?: Partial<LogContext>) => void;
        error: (error: Error | any, context?: Partial<LogContext>, recovery?: any) => void;
        track: (operation: string, duration: number, context?: Partial<LogContext>) => void;
    };
}
export declare const platformLogger: PlatformLoggerService;
export {};
//# sourceMappingURL=platform-logger.service.d.ts.map