export interface TracingConfig {
    serviceName: string;
    serviceVersion: string;
    environment: string;
    jaegerEndpoint?: string;
    jaegerAgentHost?: string;
    jaegerAgentPort?: number;
    enableConsoleExporter?: boolean;
    enableAutoInstrumentation?: boolean;
    samplingRate?: number;
}
export declare class OpenTelemetryService {
    private static instance;
    private sdk?;
    private tracer;
    private config;
    constructor(config?: Partial<TracingConfig>);
    static getInstance(config?: Partial<TracingConfig>): OpenTelemetryService;
    initialize(): Promise<void>;
    createSpan(name: string, options?: any): any;
    traceAsync<T>(name: string, operation: () => Promise<T>, attributes?: Record<string, any>): Promise<T>;
    trace<T>(name: string, operation: () => T, attributes?: Record<string, any>): T;
    addEvent(name: string, attributes?: Record<string, any>): void;
    setAttributes(attributes: Record<string, any>): void;
    getCurrentTraceId(): string | undefined;
    createTraceContext(): Record<string, string>;
    expressMiddleware(): (req: any, res: any, next: any) => void;
    shutdown(): Promise<void>;
}
export declare function Trace(spanName?: string): (target: any, propertyName: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function TraceClass(className?: string): (constructor: Function) => void;
export declare function createChildSpan(name: string, attributes?: Record<string, any>): any;
export declare function withTracing<T>(name: string, fn: () => Promise<T>, attributes?: Record<string, any>): Promise<T>;
export declare const telemetry: OpenTelemetryService;
//# sourceMappingURL=opentelemetry.service.d.ts.map