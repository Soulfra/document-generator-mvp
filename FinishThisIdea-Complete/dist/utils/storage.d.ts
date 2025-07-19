export declare function uploadToS3(buffer: Buffer, key: string, contentType?: string): Promise<string>;
export declare function downloadFromS3(url: string): Promise<Buffer>;
export declare function generatePresignedUrl(key: string, expiresIn?: number): Promise<string>;
export declare function generateUploadUrl(key: string, contentType: string, expiresIn?: number): Promise<string>;
//# sourceMappingURL=storage.d.ts.map