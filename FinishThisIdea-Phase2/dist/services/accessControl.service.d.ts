export interface AccessControlConfig {
    [key: string]: any;
}
export interface AccessControlResult {
    outputFileUrl: string;
    metadata: any;
    processingCost: number;
}
/**
 * Access Control Service
 * Price: $2.5
 * FILE READ RULE - Ensure all files are read before writing
 */
export declare function processAccessControl(jobId: string, config: AccessControlConfig, progressCallback?: (progress: number) => void): Promise<AccessControlResult>;
//# sourceMappingURL=accessControl.service.d.ts.map