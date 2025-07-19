/**
 * EMAIL SERVICE TYPES
 */

export type EmailTemplate = 
  | 'welcome'
  | 'payment-confirmation'
  | 'job-completed'
  | 'api-key-generated'
  | 'achievement-unlocked'
  | 'referral-success'
  | 'password-reset'
  | 'tier-upgrade'
  | 'weekly-digest'
  | 'announcement';

export type EmailStatus = 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed';

export interface EmailOptions {
  to: string;
  template: EmailTemplate;
  data: Record<string, any>;
  subject?: string; // Override template subject
  userId?: string;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  content: string; // Base64 encoded content
  filename: string;
  type?: string;
  disposition?: 'attachment' | 'inline';
  contentId?: string;
}

export interface EmailTemplateData {
  subject: string;
  html: string;
  text: string;
}

export interface EmailLog {
  id: string;
  messageId: string;
  to: string;
  template: EmailTemplate;
  subject: string;
  status: EmailStatus;
  userId?: string;
  sentAt: Date;
  deliveredAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  bouncedAt?: Date;
  error?: string;
  metadata?: Record<string, any>;
}

export interface EmailPreferences {
  transactional: boolean;
  marketing: boolean;
  achievements: boolean;
  weekly_digest: boolean;
  announcements: boolean;
}