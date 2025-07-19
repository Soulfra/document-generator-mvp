"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = exports.EmailService = void 0;
const mail_1 = __importDefault(require("@sendgrid/mail"));
const logger_1 = require("../../utils/logger");
const database_1 = require("../../utils/database");
const presence_logger_1 = require("../../monitoring/presence-logger");
const renderer_1 = require("./templates/renderer");
class EmailService {
    isInitialized = false;
    fromEmail;
    fromName;
    replyToEmail;
    isDevelopment;
    constructor() {
        this.fromEmail = process.env.EMAIL_FROM || 'noreply@finishthisidea.com';
        this.fromName = process.env.EMAIL_FROM_NAME || 'FinishThisIdea';
        this.replyToEmail = process.env.EMAIL_REPLY_TO || 'support@finishthisidea.com';
        this.isDevelopment = process.env.NODE_ENV !== 'production';
    }
    async initialize() {
        if (this.isInitialized)
            return;
        const apiKey = process.env.SENDGRID_API_KEY;
        if (!apiKey) {
            logger_1.logger.warn('SendGrid API key not found. Email service will log emails instead of sending.');
            this.isInitialized = true;
            return;
        }
        try {
            mail_1.default.setApiKey(apiKey);
            if (!this.isDevelopment) {
                await mail_1.default.send({
                    to: this.fromEmail,
                    from: this.fromEmail,
                    subject: 'Email Service Test',
                    text: 'Email service initialized successfully',
                    mailSettings: {
                        sandboxMode: {
                            enable: true
                        }
                    }
                });
            }
            this.isInitialized = true;
            logger_1.logger.info('Email service initialized successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize email service', { error });
            throw error;
        }
    }
    async sendEmail(options) {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }
            const { html, text, subject } = await (0, renderer_1.renderEmailTemplate)(options.template, options.data);
            const emailData = {
                to: options.to,
                from: {
                    email: this.fromEmail,
                    name: this.fromName
                },
                replyTo: this.replyToEmail,
                subject: options.subject || subject,
                text,
                html,
                categories: [options.template, 'finishthisidea'],
                customArgs: {
                    userId: options.userId || 'anonymous',
                    template: options.template
                }
            };
            if (options.attachments) {
                emailData.attachments = options.attachments;
            }
            let messageId;
            if (this.isDevelopment || !process.env.SENDGRID_API_KEY) {
                logger_1.logger.info('Email (dev mode)', {
                    to: options.to,
                    template: options.template,
                    subject: emailData.subject,
                    preview: text.substring(0, 100)
                });
                messageId = `dev-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            }
            else {
                const [response] = await mail_1.default.send(emailData);
                messageId = response.headers['x-message-id'] || `sg-${Date.now()}`;
            }
            await this.logEmailSent({
                messageId,
                to: options.to,
                template: options.template,
                userId: options.userId,
                status: 'sent'
            });
            return messageId;
        }
        catch (error) {
            logger_1.logger.error('Failed to send email', {
                error,
                template: options.template,
                to: options.to
            });
            await this.logEmailSent({
                messageId: `failed-${Date.now()}`,
                to: options.to,
                template: options.template,
                userId: options.userId,
                status: 'failed',
                error: error.message
            });
            throw error;
        }
    }
    async sendBulkEmails(template, recipients) {
        let sent = 0;
        let failed = 0;
        const batchSize = 100;
        for (let i = 0; i < recipients.length; i += batchSize) {
            const batch = recipients.slice(i, i + batchSize);
            const promises = batch.map(async (recipient) => {
                try {
                    await this.sendEmail({
                        to: recipient.email,
                        template,
                        data: recipient.data,
                        userId: recipient.userId
                    });
                    sent++;
                }
                catch (error) {
                    failed++;
                    logger_1.logger.error('Bulk email failed', {
                        email: recipient.email,
                        template,
                        error: error.message
                    });
                }
            });
            await Promise.all(promises);
            if (i + batchSize < recipients.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        logger_1.logger.info('Bulk email completed', {
            template,
            total: recipients.length,
            sent,
            failed
        });
        return { sent, failed };
    }
    async sendWelcomeEmail(userId, email, name) {
        await this.sendEmail({
            to: email,
            template: 'welcome',
            data: {
                name: name || 'Developer',
                loginUrl: `${process.env.FRONTEND_URL}/login`,
                dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`
            },
            userId
        });
    }
    async sendPaymentConfirmationEmail(userId, email, data) {
        await this.sendEmail({
            to: email,
            template: 'payment-confirmation',
            data: {
                amount: (data.amount / 100).toFixed(2),
                tier: data.tier,
                jobId: data.jobId,
                receiptUrl: data.receiptUrl,
                dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`
            },
            userId
        });
    }
    async sendJobCompletedEmail(userId, email, data) {
        await this.sendEmail({
            to: email,
            template: 'job-completed',
            data: {
                jobId: data.jobId,
                jobType: data.jobType,
                downloadUrl: data.downloadUrl,
                expiresIn: '7 days'
            },
            userId
        });
    }
    async sendApiKeyGeneratedEmail(userId, email, data) {
        await this.sendEmail({
            to: email,
            template: 'api-key-generated',
            data: {
                tier: data.tier,
                keyPreview: data.keyPreview,
                docsUrl: data.docsUrl || `${process.env.FRONTEND_URL}/docs/api`,
                dashboardUrl: `${process.env.FRONTEND_URL}/dashboard/api-keys`
            },
            userId
        });
    }
    async sendAchievementUnlockedEmail(userId, email, data) {
        await this.sendEmail({
            to: email,
            template: 'achievement-unlocked',
            data: {
                achievementName: data.achievementName,
                achievementDescription: data.achievementDescription,
                tokensEarned: data.tokensEarned,
                totalTokens: data.totalTokens,
                achievementsUrl: `${process.env.FRONTEND_URL}/achievements`
            },
            userId
        });
    }
    async sendReferralSuccessEmail(userId, email, data) {
        await this.sendEmail({
            to: email,
            template: 'referral-success',
            data: {
                referredUserName: data.referredUserName,
                tokensEarned: data.tokensEarned,
                totalReferrals: data.totalReferrals,
                referralUrl: `${process.env.FRONTEND_URL}/referrals`
            },
            userId
        });
    }
    async unsubscribeUser(userId, category) {
        try {
            await database_1.prisma.user.update({
                where: { id: userId },
                data: {
                    emailPreferences: {
                        ...(await this.getUserEmailPreferences(userId)),
                        [category]: false
                    }
                }
            });
            logger_1.logger.info('User unsubscribed from email category', { userId, category });
        }
        catch (error) {
            logger_1.logger.error('Failed to unsubscribe user', { error, userId, category });
            throw error;
        }
    }
    async getUserEmailPreferences(userId) {
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId },
            select: { emailPreferences: true }
        });
        return user?.emailPreferences || {
            transactional: true,
            marketing: true,
            achievements: true,
            weekly_digest: true
        };
    }
    async shouldSendEmail(userId, category) {
        const preferences = await this.getUserEmailPreferences(userId);
        if (category === 'transactional')
            return true;
        return preferences[category] !== false;
    }
    async logEmailSent(data) {
        try {
            await presence_logger_1.presenceLogger.logUserPresence('email_sent', {
                userId: data.userId || 'anonymous',
                metadata: {
                    messageId: data.messageId,
                    to: data.to,
                    template: data.template,
                    status: data.status,
                    error: data.error
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to log email activity', { error, data });
        }
    }
    async handleWebhook(events) {
        for (const event of events) {
            try {
                switch (event.event) {
                    case 'delivered':
                        await this.handleEmailDelivered(event);
                        break;
                    case 'open':
                        await this.handleEmailOpened(event);
                        break;
                    case 'click':
                        await this.handleEmailClicked(event);
                        break;
                    case 'bounce':
                    case 'dropped':
                        await this.handleEmailBounced(event);
                        break;
                    case 'spamreport':
                        await this.handleSpamReport(event);
                        break;
                    case 'unsubscribe':
                        await this.handleUnsubscribe(event);
                        break;
                }
            }
            catch (error) {
                logger_1.logger.error('Failed to process email webhook event', { error, event });
            }
        }
    }
    async handleEmailDelivered(event) {
        logger_1.logger.info('Email delivered', {
            messageId: event.sg_message_id,
            email: event.email
        });
    }
    async handleEmailOpened(event) {
        await presence_logger_1.presenceLogger.logUserPresence('email_opened', {
            userId: event.userId || 'anonymous',
            metadata: {
                messageId: event.sg_message_id,
                template: event.template
            }
        });
    }
    async handleEmailClicked(event) {
        await presence_logger_1.presenceLogger.logUserPresence('email_clicked', {
            userId: event.userId || 'anonymous',
            metadata: {
                messageId: event.sg_message_id,
                template: event.template,
                url: event.url
            }
        });
    }
    async handleEmailBounced(event) {
        logger_1.logger.warn('Email bounced', {
            email: event.email,
            reason: event.reason,
            type: event.type
        });
    }
    async handleSpamReport(event) {
        logger_1.logger.warn('Email marked as spam', {
            email: event.email,
            messageId: event.sg_message_id
        });
        if (event.userId) {
            await this.unsubscribeUser(event.userId, 'all');
        }
    }
    async handleUnsubscribe(event) {
        if (event.userId) {
            await this.unsubscribeUser(event.userId, event.asm_group_id || 'marketing');
        }
    }
}
exports.EmailService = EmailService;
exports.emailService = new EmailService();
//# sourceMappingURL=email.service.js.map