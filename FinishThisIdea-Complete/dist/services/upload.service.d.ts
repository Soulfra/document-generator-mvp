export interface UploadResult {
    jobId: string;
    uploadUrl: string;
    originalFileName: string;
    fileSize: number;
    expiresAt: Date;
}
export declare function uploadFile(file: Express.Multer.File, options?: {
    profileId?: string;
}): Promise<UploadResult>;
//# sourceMappingURL=upload.service.d.ts.map