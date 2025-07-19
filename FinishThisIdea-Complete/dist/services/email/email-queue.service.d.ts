import Bull from 'bull';
import { EmailOptions } from './email.service';
export interface EmailJobData extends EmailOptions {
    priority?: number;
    attempts?: number;
    delay?: number;
    removeOnComplete?: boolean;
    removeOnFail?: boolean;
}
export declare class EmailQueueService {
    private queue;
    private emailService;
    private metricsService;
    constructor();
    private setupQueueHandlers;
    private setupQueueEvents;
    queueEmail(emailData: EmailJobData): Promise<Bull.Job<EmailJobData>>;
    queueBatch(emails: EmailJobData[]): Promise<Bull.Job>;
    queuePriorityEmail(emailData: EmailJobData): Promise<Bull.Job<EmailJobData>>;
    queueDelayedEmail(emailData: EmailJobData, delayMs: number): Promise<Bull.Job<EmailJobData>>;
    queueWelcomeSequence(userId: string, email: string, name: string): Promise<void>;
    getQueueStats(): Promise<{
        waiting: number;
        active: number;
        completed: number;
        failed: number;
        delayed: number;
        paused: boolean;
    }>;
    cleanQueue(): Promise<void>;
    pause(): Promise<void>;
    resume(): Promise<void>;
    close(): Promise<void>;
    retryJob(jobId: string): Promise<void>;
    removeJob(jobId: string): Promise<void>;
}
//# sourceMappingURL=email-queue.service.d.ts.map