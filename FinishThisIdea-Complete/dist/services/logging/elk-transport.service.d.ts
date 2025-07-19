import winston from 'winston';
import Transport from 'winston-transport';
export interface ELKTransportOptions extends Transport.TransportStreamOptions {
    logstashHost?: string;
    logstashPort?: number;
    elasticsearchHost?: string;
    elasticsearchPort?: number;
    indexPrefix?: string;
    messageType?: string;
    includeMetadata?: boolean;
    flushInterval?: number;
    maxBatchSize?: number;
}
export declare class ELKTransport extends Transport {
    private options;
    private logBuffer;
    private flushTimer?;
    private logstashUrl;
    private elasticsearchUrl;
    constructor(options?: ELKTransportOptions);
    log(info: any, callback: Function): void;
    private formatLogEntry;
    private startFlushTimer;
    private flush;
    private bulkInsertToElasticsearch;
    close(): void;
}
export declare function createELKLogger(options?: ELKTransportOptions): winston.Logger;
export declare class LogAnalyzer {
    private elasticsearchUrl;
    constructor();
    searchLogs(query: any, index?: string): Promise<any>;
    getErrorTrends(timeRange?: string): Promise<any>;
    getSlowRequests(threshold?: number): Promise<any>;
    getUserActivity(userId: string, days?: number): Promise<any>;
    getSecurityEvents(hours?: number): Promise<any>;
}
export declare const elkLogger: winston.Logger;
export declare const logAnalyzer: LogAnalyzer;
//# sourceMappingURL=elk-transport.service.d.ts.map