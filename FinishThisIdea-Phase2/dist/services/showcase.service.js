"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showcaseService = void 0;
const logger_1 = require("../utils/logger");
const presence_logger_1 = require("../monitoring/presence-logger");
const treasury_service_1 = require("./treasury.service");
const qr_auth_service_1 = require("./qr-auth.service");
const uuid_1 = require("uuid");
/**
 * Project Showcase Service - Create shareable before/after transformations
 * Drives viral growth through QR code sharing of impressive code improvements
 */
class ShowcaseService {
    constructor() {
        this.showcases = new Map();
    }
    /**
     * Create a new project showcase from transformation results
     */
    async createShowcase(userId, title, description, beforeCode, afterCode, technologies = [], metadata = {}) {
        try {
            const showcaseId = `showcase-${(0, uuid_1.v4)()}`;
            // Analyze code improvements
            const improvements = await this.analyzeImprovements(beforeCode, afterCode);
            const metrics = await this.calculateMetrics(beforeCode, afterCode);
            // Generate QR code and share URL
            const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:3002'}/showcase/${showcaseId}`;
            const qrCode = await qr_auth_service_1.qrAuthService.generateQRCode(`showcase_${showcaseId}`, {
                type: 'showcase',
                showcaseId,
                shareUrl,
                userId
            });
            const showcase = {
                id: showcaseId,
                userId,
                title,
                description,
                beforeCode,
                afterCode,
                improvements,
                technologies,
                metrics,
                shareMetrics: {
                    views: 0,
                    likes: 0,
                    shares: 0,
                    forks: 0
                },
                qrCode: qrCode.qrDataURL,
                shareUrl,
                isPublic: true,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            this.showcases.set(showcaseId, showcase);
            // Award tokens for creating showcase (viral growth incentive)
            const improvementScore = this.calculateImprovementScore(metrics);
            const tokenReward = Math.floor(improvementScore * 10); // Up to 100 tokens for perfect improvements
            await treasury_service_1.treasuryService.awardAchievementTokens(userId, 'showcase_created', tokenReward);
            // Log showcase creation
            await presence_logger_1.presenceLogger.logUserPresence('showcase_created', {
                userId,
                sessionId: 'system',
                metadata: {
                    showcaseId,
                    title,
                    improvementScore,
                    tokenReward,
                    technologies,
                    ...metadata
                }
            });
            logger_1.logger.info('Project showcase created', {
                showcaseId,
                userId,
                title,
                improvementScore,
                tokenReward
            });
            return showcase;
        }
        catch (error) {
            logger_1.logger.error('Error creating showcase', { error: error.message, userId, title });
            throw error;
        }
    }
    /**
     * Get showcase by ID (increments view count)
     */
    async getShowcase(showcaseId, viewerId) {
        try {
            const showcase = this.showcases.get(showcaseId);
            if (!showcase) {
                return null;
            }
            // Increment view count
            showcase.shareMetrics.views++;
            showcase.updatedAt = new Date();
            // Award view tokens to showcase creator (viral growth reward)
            if (viewerId && viewerId !== showcase.userId) {
                await treasury_service_1.treasuryService.awardAchievementTokens(showcase.userId, 'showcase_viewed', 2);
                // Award viewer tokens for engagement
                await treasury_service_1.treasuryService.awardAchievementTokens(viewerId, 'showcase_engagement', 1);
            }
            // Log view event
            await presence_logger_1.presenceLogger.logUserPresence('showcase_viewed', {
                userId: viewerId || 'anonymous',
                sessionId: 'system',
                metadata: {
                    showcaseId,
                    creatorId: showcase.userId,
                    totalViews: showcase.shareMetrics.views
                }
            });
            return showcase;
        }
        catch (error) {
            logger_1.logger.error('Error getting showcase', { error: error.message, showcaseId });
            throw error;
        }
    }
    /**
     * Share showcase (via QR code scan or direct link)
     */
    async shareShowcase(showcaseId, sharerId, shareMethod = 'link') {
        try {
            const showcase = this.showcases.get(showcaseId);
            if (!showcase) {
                throw new Error('Showcase not found');
            }
            showcase.shareMetrics.shares++;
            showcase.updatedAt = new Date();
            // Award share tokens to creator (viral growth multiplier)
            const shareReward = shareMethod === 'qr' ? 10 : shareMethod === 'social' ? 5 : 3;
            await treasury_service_1.treasuryService.awardAchievementTokens(showcase.userId, 'showcase_shared', shareReward);
            // Award sharer tokens for spreading the word
            if (sharerId && sharerId !== showcase.userId) {
                await treasury_service_1.treasuryService.awardAchievementTokens(sharerId, 'showcase_sharing', shareReward);
            }
            // Bonus rewards for viral milestones
            if (showcase.shareMetrics.shares % 10 === 0) {
                const milestoneBonus = Math.floor(showcase.shareMetrics.shares / 10) * 50;
                await treasury_service_1.treasuryService.awardAchievementTokens(showcase.userId, 'viral_milestone', milestoneBonus);
            }
            // Log share event
            await presence_logger_1.presenceLogger.logUserPresence('showcase_shared', {
                userId: sharerId || 'anonymous',
                sessionId: 'system',
                metadata: {
                    showcaseId,
                    creatorId: showcase.userId,
                    shareMethod,
                    totalShares: showcase.shareMetrics.shares,
                    shareReward
                }
            });
            logger_1.logger.info('Showcase shared', {
                showcaseId,
                sharerId,
                shareMethod,
                totalShares: showcase.shareMetrics.shares,
                shareReward
            });
        }
        catch (error) {
            logger_1.logger.error('Error sharing showcase', { error: error.message, showcaseId });
            throw error;
        }
    }
    /**
     * Like a showcase
     */
    async likeShowcase(showcaseId, userId) {
        try {
            const showcase = this.showcases.get(showcaseId);
            if (!showcase) {
                throw new Error('Showcase not found');
            }
            showcase.shareMetrics.likes++;
            showcase.updatedAt = new Date();
            // Award like tokens
            await treasury_service_1.treasuryService.awardAchievementTokens(showcase.userId, 'showcase_liked', 1);
            await treasury_service_1.treasuryService.awardAchievementTokens(userId, 'showcase_liking', 1);
            // Log like event
            await presence_logger_1.presenceLogger.logUserPresence('showcase_liked', {
                userId,
                sessionId: 'system',
                metadata: {
                    showcaseId,
                    creatorId: showcase.userId,
                    totalLikes: showcase.shareMetrics.likes
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Error liking showcase', { error: error.message, showcaseId, userId });
            throw error;
        }
    }
    /**
     * Get user's showcases
     */
    getUserShowcases(userId) {
        return Array.from(this.showcases.values())
            .filter(showcase => showcase.userId === userId)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    /**
     * Get public showcases (trending/popular)
     */
    getPublicShowcases(limit = 20, sortBy = 'popular') {
        const publicShowcases = Array.from(this.showcases.values())
            .filter(showcase => showcase.isPublic);
        switch (sortBy) {
            case 'recent':
                return publicShowcases
                    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                    .slice(0, limit);
            case 'viral':
                return publicShowcases
                    .sort((a, b) => (b.shareMetrics.shares * 2 + b.shareMetrics.views) - (a.shareMetrics.shares * 2 + a.shareMetrics.views))
                    .slice(0, limit);
            case 'popular':
            default:
                return publicShowcases
                    .sort((a, b) => (b.shareMetrics.likes + b.shareMetrics.views + b.shareMetrics.shares) - (a.shareMetrics.likes + a.shareMetrics.views + a.shareMetrics.shares))
                    .slice(0, limit);
        }
    }
    /**
     * Get showcase analytics for dashboard
     */
    async getShowcaseAnalytics() {
        try {
            const allShowcases = Array.from(this.showcases.values());
            const totalShowcases = allShowcases.length;
            const totalViews = allShowcases.reduce((sum, s) => sum + s.shareMetrics.views, 0);
            const totalShares = allShowcases.reduce((sum, s) => sum + s.shareMetrics.shares, 0);
            const avgImprovementScore = allShowcases.length > 0
                ? allShowcases.reduce((sum, s) => sum + this.calculateImprovementScore(s.metrics), 0) / allShowcases.length
                : 0;
            // Count technologies
            const techCounts = new Map();
            allShowcases.forEach(showcase => {
                showcase.technologies.forEach(tech => {
                    techCounts.set(tech, (techCounts.get(tech) || 0) + 1);
                });
            });
            const topTechnologies = Array.from(techCounts.entries())
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 10);
            // Calculate virality score (shares per showcase)
            const viralityScore = totalShowcases > 0 ? totalShares / totalShowcases : 0;
            return {
                totalShowcases,
                totalViews,
                totalShares,
                avgImprovementScore: Math.round(avgImprovementScore * 100) / 100,
                topTechnologies,
                viralityScore: Math.round(viralityScore * 100) / 100
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting showcase analytics', { error: error.message });
            return {
                totalShowcases: 0,
                totalViews: 0,
                totalShares: 0,
                avgImprovementScore: 0,
                topTechnologies: [],
                viralityScore: 0
            };
        }
    }
    /**
     * Analyze code improvements between before and after
     */
    async analyzeImprovements(beforeCode, afterCode) {
        const improvements = [];
        // Simple heuristic analysis (would use LLM in production)
        const beforeLines = beforeCode.split('\n').filter(line => line.trim().length > 0);
        const afterLines = afterCode.split('\n').filter(line => line.trim().length > 0);
        if (afterLines.length < beforeLines.length) {
            const reduction = beforeLines.length - afterLines.length;
            improvements.push(`Reduced code by ${reduction} lines (${Math.round((reduction / beforeLines.length) * 100)}%)`);
        }
        // Check for common improvements
        if (beforeCode.includes('var ') && !afterCode.includes('var ')) {
            improvements.push('Converted var to let/const for better scoping');
        }
        if (beforeCode.includes('function(') && afterCode.includes('=>')) {
            improvements.push('Modernized to arrow functions');
        }
        if (beforeCode.includes('== ') && afterCode.includes('=== ')) {
            improvements.push('Improved type safety with strict equality');
        }
        if (!beforeCode.includes('async') && afterCode.includes('async')) {
            improvements.push('Added async/await for better asynchronous handling');
        }
        if (!beforeCode.includes('try') && afterCode.includes('try')) {
            improvements.push('Added error handling with try/catch');
        }
        if (improvements.length === 0) {
            improvements.push('Code structure and readability improvements');
        }
        return improvements;
    }
    /**
     * Calculate improvement metrics
     */
    async calculateMetrics(beforeCode, afterCode) {
        const beforeLines = beforeCode.split('\n').filter(line => line.trim().length > 0);
        const afterLines = afterCode.split('\n').filter(line => line.trim().length > 0);
        const linesReduced = Math.max(0, beforeLines.length - afterLines.length);
        // Simple scoring based on code patterns (would use actual analysis tools in production)
        const complexity = this.scoreComplexity(afterCode);
        const performance = this.scorePerformance(beforeCode, afterCode);
        const security = this.scoreSecurity(afterCode);
        const maintainability = this.scoreMaintainability(afterCode);
        return {
            linesReduced,
            complexity,
            performance,
            security,
            maintainability
        };
    }
    scoreComplexity(code) {
        // Lower complexity is better (inverted score)
        let score = 100;
        const patterns = [
            /nested.*{.*{.*{/g, // Deep nesting
            /if.*if.*if/g, // Multiple conditions
            /for.*for.*for/g, // Nested loops
        ];
        patterns.forEach(pattern => {
            const matches = code.match(pattern);
            if (matches)
                score -= matches.length * 10;
        });
        return Math.max(0, Math.min(100, score));
    }
    scorePerformance(beforeCode, afterCode) {
        let score = 70; // Base score
        // Performance improvements
        if (beforeCode.includes('for(') && afterCode.includes('.forEach('))
            score += 10;
        if (beforeCode.includes('innerHTML') && afterCode.includes('textContent'))
            score += 10;
        if (!beforeCode.includes('const') && afterCode.includes('const'))
            score += 5;
        if (afterCode.includes('async/await'))
            score += 10;
        if (afterCode.includes('Promise.all'))
            score += 15;
        return Math.min(100, score);
    }
    scoreSecurity(code) {
        let score = 80; // Base score
        // Security patterns
        if (code.includes('innerHTML'))
            score -= 20;
        if (code.includes('eval('))
            score -= 30;
        if (code.includes('document.write'))
            score -= 25;
        if (code.includes('setTimeout') && code.includes('string'))
            score -= 15;
        // Positive patterns
        if (code.includes('textContent'))
            score += 10;
        if (code.includes('sanitize'))
            score += 15;
        if (code.includes('validation'))
            score += 10;
        return Math.max(0, Math.min(100, score));
    }
    scoreMaintainability(code) {
        let score = 75; // Base score
        // Maintainability factors
        const lines = code.split('\n');
        const avgLineLength = lines.reduce((sum, line) => sum + line.length, 0) / lines.length;
        if (avgLineLength < 80)
            score += 10;
        if (avgLineLength > 120)
            score -= 10;
        // Good patterns
        if (code.includes('//') || code.includes('/*'))
            score += 10; // Comments
        if (code.includes('function ') || code.includes('const '))
            score += 5; // Clear declarations
        if (code.includes('try') && code.includes('catch'))
            score += 10; // Error handling
        return Math.max(0, Math.min(100, score));
    }
    /**
     * Calculate overall improvement score
     */
    calculateImprovementScore(metrics) {
        return (metrics.complexity + metrics.performance + metrics.security + metrics.maintainability) / 4 / 100;
    }
}
exports.showcaseService = new ShowcaseService();
//# sourceMappingURL=showcase.service.js.map