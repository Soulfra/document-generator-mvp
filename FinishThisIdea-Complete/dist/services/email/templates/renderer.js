"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderEmailTemplate = renderEmailTemplate;
exports.precompileTemplates = precompileTemplates;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const handlebars = __importStar(require("handlebars"));
const logger_1 = require("../../../utils/logger");
const templateCache = new Map();
handlebars.registerHelper('formatCurrency', (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
});
handlebars.registerHelper('formatDate', (date) => {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
});
handlebars.registerHelper('formatNumber', (num) => {
    return new Intl.NumberFormat('en-US').format(num);
});
handlebars.registerHelper('pluralize', (count, singular, plural) => {
    return count === 1 ? singular : (plural || `${singular}s`);
});
async function loadTemplate(templateName) {
    const cached = templateCache.get(templateName);
    if (cached)
        return cached;
    try {
        const templatePath = path.join(__dirname, `${templateName}.hbs`);
        const templateContent = await fs.readFile(templatePath, 'utf-8');
        const compiled = handlebars.compile(templateContent);
        templateCache.set(templateName, compiled);
        return compiled;
    }
    catch (error) {
        logger_1.logger.error('Failed to load email template', { templateName, error });
        throw new Error(`Email template not found: ${templateName}`);
    }
}
async function getTemplateMetadata(template) {
    const metadata = {
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
async function renderEmailTemplate(template, data) {
    try {
        const layout = await loadTemplate('layout');
        const contentTemplate = await loadTemplate(template);
        const metadata = await getTemplateMetadata(template);
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
        const content = contentTemplate(commonData);
        const html = layout({
            ...commonData,
            content,
            subject: handlebars.compile(metadata.subject)(data)
        });
        const text = generatePlainText(html);
        return {
            subject: handlebars.compile(metadata.subject)(data),
            html,
            text
        };
    }
    catch (error) {
        logger_1.logger.error('Failed to render email template', { template, error });
        return {
            subject: 'FinishThisIdea Notification',
            html: `<p>We tried to send you an email but encountered an error. Please contact support.</p>`,
            text: 'We tried to send you an email but encountered an error. Please contact support.'
        };
    }
}
function generatePlainText(html) {
    return html
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim()
        .replace(/\. /g, '.\n')
        .replace(/! /g, '!\n')
        .replace(/\? /g, '?\n');
}
async function precompileTemplates() {
    const templates = [
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
    logger_1.logger.info('Precompiling email templates...');
    for (const template of templates) {
        try {
            await loadTemplate(template);
        }
        catch (error) {
            logger_1.logger.warn(`Failed to precompile template: ${template}`, { error });
        }
    }
    try {
        await loadTemplate('layout');
    }
    catch (error) {
        logger_1.logger.error('Failed to precompile layout template', { error });
    }
    logger_1.logger.info(`Email templates precompiled: ${templateCache.size}`);
}
//# sourceMappingURL=renderer.js.map