import { EmailTemplate, EmailOptions } from './types';
export declare class EmailService {
    private isInitialized;
    private fromEmail;
    private fromName;
    private replyToEmail;
    private isDevelopment;
    constructor();
    initialize(): Promise<void>;
    sendEmail(options: EmailOptions): Promise<string>;
    sendBulkEmails(template: EmailTemplate, recipients: Array<{
        email: string;
        data: any;
        userId?: string;
    }>): Promise<{
        sent: number;
        failed: number;
    }>;
    sendWelcomeEmail(userId: string, email: string, name?: string): Promise<void>;
    sendPaymentConfirmationEmail(userId: string, email: string, data: {
        amount: number;
        tier: string;
        jobId?: string;
        receiptUrl?: string;
    }): Promise<void>;
    sendJobCompletedEmail(userId: string, email: string, data: {
        jobId: string;
        jobType: string;
        downloadUrl: string;
    }): Promise<void>;
    sendApiKeyGeneratedEmail(userId: string, email: string, data: {
        tier: string;
        keyPreview: string;
        docsUrl: string;
    }): Promise<void>;
    sendAchievementUnlockedEmail(userId: string, email: string, data: {
        achievementName: string;
        achievementDescription: string;
        tokensEarned: number;
        totalTokens: number;
    }): Promise<void>;
    sendReferralSuccessEmail(userId: string, email: string, data: {
        referredUserName: string;
        tokensEarned: number;
        totalReferrals: number;
    }): Promise<void>;
    unsubscribeUser(userId: string, category: string): Promise<void>;
    getUserEmailPreferences(userId: string): Promise<Record<string, boolean>>;
    shouldSendEmail(userId: string, category: string): Promise<boolean>;
    private logEmailSent;
    handleWebhook(events: any[]): Promise<void>;
    private handleEmailDelivered;
    private handleEmailOpened;
    private handleEmailClicked;
    private handleEmailBounced;
    private handleSpamReport;
    private handleUnsubscribe;
}
export declare const emailService: EmailService;
//# sourceMappingURL=email.service.d.ts.map