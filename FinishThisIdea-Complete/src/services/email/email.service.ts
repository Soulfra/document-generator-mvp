/**
 * EMAIL SERVICE
 * 
 * Handles all email communications including:
 * - Transactional emails (payment confirmations, notifications)
 * - Marketing emails (announcements, newsletters)
 * - User lifecycle emails (welcome, onboarding, re-engagement)
 */

import sgMail from '@sendgrid/mail';
import { logger } from '../../utils/logger';
import { prisma } from '../../utils/database';
import { presenceLogger } from '../../monitoring/presence-logger';
import { renderEmailTemplate } from './templates/renderer';
import { EmailTemplate, EmailOptions, EmailStatus } from './types';

export class EmailService {
  private isInitialized = false;
  private fromEmail: string;
  private fromName: string;
  private replyToEmail: string;
  private isDevelopment: boolean;

  constructor() {
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@finishthisidea.com';
    this.fromName = process.env.EMAIL_FROM_NAME || 'FinishThisIdea';
    this.replyToEmail = process.env.EMAIL_REPLY_TO || 'support@finishthisidea.com';
    this.isDevelopment = process.env.NODE_ENV !== 'production';
  }

  /**
   * Initialize the email service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    const apiKey = process.env.SENDGRID_API_KEY;
    
    if (!apiKey) {
      logger.warn('SendGrid API key not found. Email service will log emails instead of sending.');
      this.isInitialized = true;
      return;
    }

    try {
      sgMail.setApiKey(apiKey);
      
      // Test the API key by verifying sender
      if (!this.isDevelopment) {
        await sgMail.send({
          to: this.fromEmail,
          from: this.fromEmail,
          subject: 'Email Service Test',
          text: 'Email service initialized successfully',
          mailSettings: {
            sandboxMode: {
              enable: true // Don't actually send in test
            }
          }
        });
      }

      this.isInitialized = true;
      logger.info('Email service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize email service', { error });
      throw error;
    }
  }

  /**
   * Send a single email
   */
  async sendEmail(options: EmailOptions): Promise<string> {
    try {
      // Initialize if not already done
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Render the template
      const { html, text, subject } = await renderEmailTemplate(
        options.template,
        options.data
      );

      // Prepare email data
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

      // Add attachments if any
      if (options.attachments) {
        (emailData as any).attachments = options.attachments;
      }

      // Send email or log in development
      let messageId: string;
      
      if (this.isDevelopment || !process.env.SENDGRID_API_KEY) {
        // Log email in development
        logger.info('Email (dev mode)', {
          to: options.to,
          template: options.template,
          subject: emailData.subject,
          preview: text.substring(0, 100)
        });
        messageId = `dev-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      } else {
        // Send via SendGrid
        const [response] = await sgMail.send(emailData);
        messageId = response.headers['x-message-id'] || `sg-${Date.now()}`;
      }

      // Log email sent
      await this.logEmailSent({
        messageId,
        to: options.to,
        template: options.template,
        userId: options.userId,
        status: 'sent'
      });

      return messageId;

    } catch (error) {
      logger.error('Failed to send email', {
        error,
        template: options.template,
        to: options.to
      });

      // Log failed email
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

  /**
   * Send bulk emails
   */
  async sendBulkEmails(
    template: EmailTemplate,
    recipients: Array<{ email: string; data: any; userId?: string }>
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    // Process in batches to avoid rate limits
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
        } catch (error) {
          failed++;
          logger.error('Bulk email failed', {
            email: recipient.email,
            template,
            error: error.message
          });
        }
      });

      await Promise.all(promises);
      
      // Small delay between batches
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    logger.info('Bulk email completed', {
      template,
      total: recipients.length,
      sent,
      failed
    });

    return { sent, failed };
  }

  /**
   * Email templates
   */
  
  async sendWelcomeEmail(userId: string, email: string, name?: string): Promise<void> {
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

  async sendPaymentConfirmationEmail(
    userId: string,
    email: string,
    data: {
      amount: number;
      tier: string;
      jobId?: string;
      receiptUrl?: string;
    }
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      template: 'payment-confirmation',
      data: {
        amount: (data.amount / 100).toFixed(2), // Convert cents to dollars
        tier: data.tier,
        jobId: data.jobId,
        receiptUrl: data.receiptUrl,
        dashboardUrl: `${process.env.FRONTEND_URL}/dashboard`
      },
      userId
    });
  }

  async sendJobCompletedEmail(
    userId: string,
    email: string,
    data: {
      jobId: string;
      jobType: string;
      downloadUrl: string;
    }
  ): Promise<void> {
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

  async sendApiKeyGeneratedEmail(
    userId: string,
    email: string,
    data: {
      tier: string;
      keyPreview: string;
      docsUrl: string;
    }
  ): Promise<void> {
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

  async sendAchievementUnlockedEmail(
    userId: string,
    email: string,
    data: {
      achievementName: string;
      achievementDescription: string;
      tokensEarned: number;
      totalTokens: number;
    }
  ): Promise<void> {
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

  async sendReferralSuccessEmail(
    userId: string,
    email: string,
    data: {
      referredUserName: string;
      tokensEarned: number;
      totalReferrals: number;
    }
  ): Promise<void> {
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

  /**
   * Unsubscribe handling
   */
  async unsubscribeUser(userId: string, category: string): Promise<void> {
    try {
      // Update user preferences in database
      await prisma.user.update({
        where: { id: userId },
        data: {
          emailPreferences: {
            ...(await this.getUserEmailPreferences(userId)),
            [category]: false
          }
        }
      });

      logger.info('User unsubscribed from email category', { userId, category });
    } catch (error) {
      logger.error('Failed to unsubscribe user', { error, userId, category });
      throw error;
    }
  }

  /**
   * Get user email preferences
   */
  async getUserEmailPreferences(userId: string): Promise<Record<string, boolean>> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { emailPreferences: true }
    });

    return (user?.emailPreferences as Record<string, boolean>) || {
      transactional: true,
      marketing: true,
      achievements: true,
      weekly_digest: true
    };
  }

  /**
   * Check if user should receive email of certain category
   */
  async shouldSendEmail(userId: string, category: string): Promise<boolean> {
    const preferences = await this.getUserEmailPreferences(userId);
    
    // Always send transactional emails
    if (category === 'transactional') return true;
    
    return preferences[category] !== false;
  }

  /**
   * Log email activity
   */
  private async logEmailSent(data: {
    messageId: string;
    to: string;
    template: string;
    userId?: string;
    status: EmailStatus;
    error?: string;
  }): Promise<void> {
    try {
      // Log to presence logger for analytics
      await presenceLogger.logUserPresence('email_sent', {
        userId: data.userId || 'anonymous',
        metadata: {
          messageId: data.messageId,
          to: data.to,
          template: data.template,
          status: data.status,
          error: data.error
        }
      });

      // Could also store in database for email history
      // await prisma.emailLog.create({ data: { ... } });
      
    } catch (error) {
      logger.error('Failed to log email activity', { error, data });
    }
  }

  /**
   * Handle SendGrid webhooks
   */
  async handleWebhook(events: any[]): Promise<void> {
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
      } catch (error) {
        logger.error('Failed to process email webhook event', { error, event });
      }
    }
  }

  private async handleEmailDelivered(event: any): Promise<void> {
    logger.info('Email delivered', {
      messageId: event.sg_message_id,
      email: event.email
    });
  }

  private async handleEmailOpened(event: any): Promise<void> {
    await presenceLogger.logUserPresence('email_opened', {
      userId: event.userId || 'anonymous',
      metadata: {
        messageId: event.sg_message_id,
        template: event.template
      }
    });
  }

  private async handleEmailClicked(event: any): Promise<void> {
    await presenceLogger.logUserPresence('email_clicked', {
      userId: event.userId || 'anonymous',
      metadata: {
        messageId: event.sg_message_id,
        template: event.template,
        url: event.url
      }
    });
  }

  private async handleEmailBounced(event: any): Promise<void> {
    logger.warn('Email bounced', {
      email: event.email,
      reason: event.reason,
      type: event.type
    });

    // Mark email as invalid in database
    // await prisma.user.update({ where: { email: event.email }, data: { emailValid: false } });
  }

  private async handleSpamReport(event: any): Promise<void> {
    logger.warn('Email marked as spam', {
      email: event.email,
      messageId: event.sg_message_id
    });

    // Unsubscribe user from all emails
    if (event.userId) {
      await this.unsubscribeUser(event.userId, 'all');
    }
  }

  private async handleUnsubscribe(event: any): Promise<void> {
    if (event.userId) {
      await this.unsubscribeUser(event.userId, event.asm_group_id || 'marketing');
    }
  }
}

// Singleton instance
export const emailService = new EmailService();