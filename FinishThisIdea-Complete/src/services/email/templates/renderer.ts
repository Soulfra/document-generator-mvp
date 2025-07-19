/**
 * EMAIL TEMPLATE RENDERER
 * 
 * Renders email templates with data interpolation
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as handlebars from 'handlebars';
import { EmailTemplate, EmailTemplateData } from '../types';
import { logger } from '../../../utils/logger';

// Cache compiled templates
const templateCache = new Map<string, HandlebarsTemplateDelegate>();

// Register Handlebars helpers
handlebars.registerHelper('formatCurrency', (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
});

handlebars.registerHelper('formatDate', (date: Date | string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

handlebars.registerHelper('formatNumber', (num: number) => {
  return new Intl.NumberFormat('en-US').format(num);
});

handlebars.registerHelper('pluralize', (count: number, singular: string, plural?: string) => {
  return count === 1 ? singular : (plural || `${singular}s`);
});

/**
 * Load and compile template
 */
async function loadTemplate(templateName: string): Promise<HandlebarsTemplateDelegate> {
  const cached = templateCache.get(templateName);
  if (cached) return cached;

  try {
    const templatePath = path.join(__dirname, `${templateName}.hbs`);
    const templateContent = await fs.readFile(templatePath, 'utf-8');
    
    const compiled = handlebars.compile(templateContent);
    templateCache.set(templateName, compiled);
    
    return compiled;
  } catch (error) {
    logger.error('Failed to load email template', { templateName, error });
    throw new Error(`Email template not found: ${templateName}`);
  }
}

/**
 * Get template metadata
 */
async function getTemplateMetadata(template: EmailTemplate): Promise<Record<string, string>> {
  const metadata: Record<string, Record<string, string>> = {
    welcome: {
      subject: 'Welcome to FinishThisIdea! 🚀',
      preheader: 'Get started with your first code cleanup'
    },
    'payment-confirmation': {
      subject: 'Payment Confirmed - Thank You!',
      preheader: 'Your payment has been processed successfully'
    },
    'job-completed': {
      subject: 'Your Code is Ready! ✨',
      preheader: 'Your cleanup job has been completed'
    },
    'api-key-generated': {
      subject: 'API Key Generated Successfully',
      preheader: 'Your new API key is ready to use'
    },
    'achievement-unlocked': {
      subject: 'Achievement Unlocked! 🏆',
      preheader: 'You\'ve earned a new achievement'
    },
    'referral-success': {
      subject: 'Referral Bonus Earned! 💰',
      preheader: 'Your referral has signed up'
    },
    'password-reset': {
      subject: 'Reset Your Password',
      preheader: 'Reset your FinishThisIdea password'
    },
    'tier-upgrade': {
      subject: 'Welcome to {{tier}} Tier! 🎉',
      preheader: 'Your account has been upgraded'
    },
    'weekly-digest': {
      subject: 'Your Weekly FinishThisIdea Update 📊',
      preheader: 'See what you accomplished this week'
    },
    'announcement': {
      subject: '{{subject}}',
      preheader: '{{preheader}}'
    }
  };

  return metadata[template] || {
    subject: 'FinishThisIdea Update',
    preheader: 'Important information about your account'
  };
}

/**
 * Render email template with data
 */
export async function renderEmailTemplate(
  template: EmailTemplate,
  data: Record<string, any>
): Promise<EmailTemplateData> {
  try {
    // Load base layout
    const layout = await loadTemplate('layout');
    
    // Load specific template
    const contentTemplate = await loadTemplate(template);
    
    // Get template metadata
    const metadata = await getTemplateMetadata(template);
    
    // Common data for all templates
    const commonData = {
      ...data,
      year: new Date().getFullYear(),
      companyName: 'FinishThisIdea',
      companyAddress: '123 Developer Lane, Code City, CA 94000',
      unsubscribeUrl: `${process.env.FRONTEND_URL}/unsubscribe?userId=${data.userId || ''}&template=${template}`,
      privacyUrl: `${process.env.FRONTEND_URL}/privacy`,
      termsUrl: `${process.env.FRONTEND_URL}/terms`,
      supportEmail: process.env.EMAIL_REPLY_TO || 'support@finishthisidea.com',
      logoUrl: `${process.env.FRONTEND_URL}/logo.png`,
      preheader: handlebars.compile(metadata.preheader)(data),
      isDevelopment: process.env.NODE_ENV !== 'production'
    };

    // Render content
    const content = contentTemplate(commonData);
    
    // Render full HTML with layout
    const html = layout({
      ...commonData,
      content,
      subject: handlebars.compile(metadata.subject)(data)
    });

    // Generate plain text version
    const text = generatePlainText(html);

    return {
      subject: handlebars.compile(metadata.subject)(data),
      html,
      text
    };

  } catch (error) {
    logger.error('Failed to render email template', { template, error });
    
    // Fallback to basic template
    return {
      subject: 'FinishThisIdea Notification',
      html: `<p>We tried to send you an email but encountered an error. Please contact support.</p>`,
      text: 'We tried to send you an email but encountered an error. Please contact support.'
    };
  }
}

/**
 * Generate plain text version from HTML
 */
function generatePlainText(html: string): string {
  return html
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Replace multiple spaces with single space
    .replace(/\s+/g, ' ')
    // Replace &nbsp; with space
    .replace(/&nbsp;/g, ' ')
    // Decode HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Remove extra whitespace
    .trim()
    // Add line breaks for readability
    .replace(/\. /g, '.\n')
    .replace(/! /g, '!\n')
    .replace(/\? /g, '?\n');
}

/**
 * Precompile all templates on startup
 */
export async function precompileTemplates(): Promise<void> {
  const templates: EmailTemplate[] = [
    'welcome',
    'payment-confirmation',
    'job-completed',
    'api-key-generated',
    'achievement-unlocked',
    'referral-success',
    'password-reset',
    'tier-upgrade',
    'weekly-digest',
    'announcement'
  ];

  logger.info('Precompiling email templates...');

  for (const template of templates) {
    try {
      await loadTemplate(template);
    } catch (error) {
      logger.warn(`Failed to precompile template: ${template}`, { error });
    }
  }

  // Also precompile layout
  try {
    await loadTemplate('layout');
  } catch (error) {
    logger.error('Failed to precompile layout template', { error });
  }

  logger.info(`Email templates precompiled: ${templateCache.size}`);
}