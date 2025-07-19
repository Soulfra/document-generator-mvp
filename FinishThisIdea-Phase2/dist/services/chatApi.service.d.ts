export interface ChatApiConfig {
    [key: string]: any;
}
export interface ChatApiResult {
    outputFileUrl: string;
    metadata: any;
    processingCost: number;
}
/**
 * Chat Api Service
 * Price: $4.5
 * CHAT API GATEWAY - Routes all chat requests to appropriate services
 */
export declare function processChatApi(jobId: string, config: ChatApiConfig, progressCallback?: (progress: number) => void): Promise<ChatApiResult>;
//# sourceMappingURL=chatApi.service.d.ts.map