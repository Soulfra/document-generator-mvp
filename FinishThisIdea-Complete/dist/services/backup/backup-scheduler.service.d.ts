export interface BackupSchedule {
    id: string;
    name: string;
    type: 'database' | 'files' | 'redis' | 'full';
    schedule: string;
    enabled: boolean;
    retentionDays: number;
    lastRun?: Date;
    nextRun?: Date;
    metadata?: Record<string, any>;
}
export interface BackupJob {
    scheduleId: string;
    type: string;
    startedAt: Date;
    completedAt?: Date;
    status: 'pending' | 'running' | 'completed' | 'failed';
    result?: any;
    error?: string;
}
export declare class BackupSchedulerService {
    private static instance;
    private schedules;
    private backupQueue;
    private isInitialized;
    private defaultSchedules;
    constructor();
    static getInstance(): BackupSchedulerService;
    initialize(): Promise<void>;
    scheduleBackup(schedule: BackupSchedule): Promise<void>;
    private executeBackup;
    private setupQueueHandlers;
    private backupDatabase;
    private backupFiles;
    private backupRedis;
    private backupFull;
    private storeBackupMetadata;
    private updateJobStatus;
    private loadSchedules;
    private updateSchedule;
    private getNextRunTime;
    private cleanupExpiredBackups;
    private deleteFromS3;
    triggerBackup(type: string): Promise<any>;
    getBackupStatus(): Promise<any>;
    restoreFromBackup(backupId: string, type: string): Promise<void>;
}
export declare const backupScheduler: BackupSchedulerService;
//# sourceMappingURL=backup-scheduler.service.d.ts.map