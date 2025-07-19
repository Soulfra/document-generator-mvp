interface BackupOptions {
    includeMetadata?: boolean;
    compress?: boolean;
    encrypt?: boolean;
    retentionDays?: number;
}
interface BackupResult {
    backupId: string;
    backupUrl: string;
    size: number;
    checksum: string;
    createdAt: Date;
    expiresAt: Date;
}
export declare class CleanupBackupService {
    private backupPath;
    private defaultRetentionDays;
    constructor();
    private initializeBackupDirectory;
    createBackup(jobId: string, sourceDir: string, options?: BackupOptions): Promise<BackupResult>;
    restoreBackup(backupId: string, targetDir: string): Promise<void>;
    listBackups(jobId: string): Promise<any[]>;
    private createBackupMetadata;
    private createArchive;
    private extractArchive;
    private calculateChecksum;
    private calculateBufferChecksum;
    private getAllFiles;
    private storeBackupRecord;
    private getBackupRecord;
    private downloadBackup;
    cleanupExpiredBackups(): Promise<number>;
}
export declare const cleanupBackup: CleanupBackupService;
export {};
//# sourceMappingURL=cleanup-backup.service.d.ts.map