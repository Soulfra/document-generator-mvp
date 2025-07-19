"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReferralCode = generateReferralCode;
exports.isValidReferralCode = isValidReferralCode;
exports.calculateTokenReward = calculateTokenReward;
exports.calculateDividendPayout = calculateDividendPayout;
exports.validateShowcaseData = validateShowcaseData;
exports.calculateShowcaseMetrics = calculateShowcaseMetrics;
exports.generateShareUrl = generateShareUrl;
exports.generateQRCodeDataURL = generateQRCodeDataURL;
exports.calculateViralityScore = calculateViralityScore;
exports.calculateUserViralityScore = calculateUserViralityScore;
exports.formatCurrency = formatCurrency;
exports.formatNumber = formatNumber;
exports.logViralEvent = logViralEvent;
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("../../../utils/logger");
function generateReferralCode(userId, displayName) {
    const base = displayName ?
        displayName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 6) :
        userId.substring(0, 6);
    const randomSuffix = crypto_1.default.randomBytes(3).toString('hex').toUpperCase();
    return `${base}${randomSuffix}`.toUpperCase();
}
function isValidReferralCode(code) {
    return /^[A-Z0-9]{6,12}$/.test(code);
}
function calculateTokenReward(actionType, metadata = {}) {
    const baseRewards = {
        signup: 50,
        referral: 25,
        showcase: 10,
        collaboration: 100,
        upload: 1
    };
    let reward = baseRewards[actionType] || 0;
    const tierMultipliers = {
        'free': 1.0,
        'paid': 1.2,
        'enterprise': 1.5
    };
    const multiplier = tierMultipliers[metadata.userTier] || 1.0;
    reward *= multiplier;
    switch (actionType) {
        case 'collaboration':
            if (metadata.collaborators && metadata.collaborators > 2) {
                reward += (metadata.collaborators - 2) * 20;
            }
            break;
        case 'showcase':
            if (metadata.showcaseViews && metadata.showcaseViews > 100) {
                reward += Math.min(metadata.showcaseViews / 10, 50);
            }
            break;
        case 'upload':
            if (metadata.revenueGenerated && metadata.revenueGenerated > 0) {
                reward += Math.floor(metadata.revenueGenerated);
            }
            break;
    }
    return Math.floor(reward);
}
function calculateDividendPayout(userTokens, totalTokens, totalDividendPool) {
    if (totalTokens === 0 || userTokens === 0)
        return 0;
    const userShare = userTokens / totalTokens;
    const payout = totalDividendPool * userShare;
    return payout >= 0.01 ? payout : 0;
}
function validateShowcaseData(showcase) {
    const errors = [];
    if (!showcase.title || showcase.title.length < 5 || showcase.title.length > 100) {
        errors.push('Title must be between 5 and 100 characters');
    }
    if (!showcase.description || showcase.description.length < 10 || showcase.description.length > 500) {
        errors.push('Description must be between 10 and 500 characters');
    }
    if (!showcase.beforeCode || showcase.beforeCode.length < 10) {
        errors.push('Before code must be at least 10 characters');
    }
    if (!showcase.afterCode || showcase.afterCode.length < 10) {
        errors.push('After code must be at least 10 characters');
    }
    if (showcase.beforeCode === showcase.afterCode) {
        errors.push('Before and after code must be different');
    }
    if (!showcase.technologies || showcase.technologies.length === 0) {
        errors.push('At least one technology must be specified');
    }
    return { valid: errors.length === 0, errors };
}
function calculateShowcaseMetrics(beforeCode, afterCode) {
    const beforeLines = beforeCode.split('\n').filter(line => line.trim()).length;
    const afterLines = afterCode.split('\n').filter(line => line.trim()).length;
    const linesReduced = beforeLines - afterLines;
    const complexity = Math.min(100, Math.max(0, 60 + (linesReduced > 0 ? Math.min(linesReduced * 2, 30) : -10)));
    const performance = Math.min(100, Math.max(0, 65 + (countPerformanceImprovements(beforeCode, afterCode) * 10)));
    const security = Math.min(100, Math.max(0, 70 + (countSecurityImprovements(beforeCode, afterCode) * 15)));
    const maintainability = Math.min(100, Math.max(0, 75 + (linesReduced > 0 ? 15 : 0) + (countCleanCodePractices(afterCode) * 5)));
    return {
        complexity,
        performance,
        security,
        maintainability,
        linesReduced: Math.max(0, linesReduced)
    };
}
function generateShareUrl(showcaseId, baseUrl = '') {
    const base = baseUrl || process.env.APP_URL || 'https://finishthisidea.com';
    return `${base}/showcase/${showcaseId}`;
}
function generateQRCodeDataURL(url) {
    const mockQRData = `data:image/svg+xml;base64,${Buffer.from(`<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="white"/>
      <text x="100" y="100" text-anchor="middle" font-family="monospace" font-size="12">${url.substring(0, 20)}</text>
    </svg>`).toString('base64')}`;
    return mockQRData;
}
function calculateViralityScore(shareMetrics) {
    const { views, likes, shares, forks } = shareMetrics;
    const score = (Math.min(views / 1000, 1) * 20 +
        Math.min(likes / 100, 1) * 30 +
        Math.min(shares / 50, 1) * 40 +
        Math.min(forks / 20, 1) * 10);
    return Math.round(Math.min(score, 100));
}
function calculateUserViralityScore(userStats) {
    const { showcasesCreated, totalViews, totalShares, referralsGenerated, collaborationsCompleted } = userStats;
    const score = (Math.min(showcasesCreated / 10, 1) * 20 +
        Math.min(totalViews / 10000, 1) * 25 +
        Math.min(totalShares / 500, 1) * 25 +
        Math.min(referralsGenerated / 20, 1) * 20 +
        Math.min(collaborationsCompleted / 10, 1) * 10);
    return Math.round(Math.min(score, 100));
}
function countPerformanceImprovements(beforeCode, afterCode) {
    let improvements = 0;
    const performancePatterns = [
        /async\/await/g,
        /Promise\.all/g,
        /\.map\(/g,
        /\.filter\(/g,
        /const\s+/g
    ];
    performancePatterns.forEach(pattern => {
        const beforeMatches = (beforeCode.match(pattern) || []).length;
        const afterMatches = (afterCode.match(pattern) || []).length;
        if (afterMatches > beforeMatches)
            improvements++;
    });
    return improvements;
}
function countSecurityImprovements(beforeCode, afterCode) {
    let improvements = 0;
    const securityPatterns = [
        /sanitize|escape|validate/gi,
        /try\s*{/g,
        /catch\s*\(/g
    ];
    securityPatterns.forEach(pattern => {
        const beforeMatches = (beforeCode.match(pattern) || []).length;
        const afterMatches = (afterCode.match(pattern) || []).length;
        if (afterMatches > beforeMatches)
            improvements++;
    });
    return improvements;
}
function countCleanCodePractices(code) {
    let practices = 0;
    const cleanCodePatterns = [
        /\/\*\*.*?\*\//gs,
        /\/\/.*$/gm,
        /function\s+\w+/g,
        /const\s+\w+/g
    ];
    cleanCodePatterns.forEach(pattern => {
        if (pattern.test(code))
            practices++;
    });
    return practices;
}
function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}
function logViralEvent(eventType, userId, metadata = {}) {
    logger_1.logger.info('Viral event logged', {
        event: eventType,
        userId,
        timestamp: new Date().toISOString(),
        ...metadata
    });
}
//# sourceMappingURL=viral-utils.js.map