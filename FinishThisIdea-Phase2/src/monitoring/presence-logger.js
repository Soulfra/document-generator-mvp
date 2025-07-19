#!/usr/bin/env node

/**
 * PRESENCE LOGGER AGENT
 * Tracks user presence, interactions, and system events
 * Adapted from Soulfra PresenceLoggerAgent.js for FinishThisIdea platform
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { logger } = require('../utils/logger');
const { prisma } = require('../utils/database');

class PresenceLogger {
    constructor() {
        this.logsPath = path.join(__dirname, '../../logs/presence');
        this.sessionsPath = path.join(__dirname, '../../logs/sessions');
        this.interactionsPath = path.join(__dirname, '../../logs/interactions');
        
        this.ensureDirectories();
        this.activeSessionsMap = new Map();
        this.interactionBuffer = [];
        
        // Flush interactions to database every 30 seconds
        setInterval(() => this.flushInteractions(), 30000);
    }
    
    ensureDirectories() {
        [this.logsPath, this.sessionsPath, this.interactionsPath].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }
    
    generateSessionHash(input) {
        const timestamp = Date.now();
        const sessionData = `${input}_${timestamp}_${Math.random()}`;
        return crypto.createHash('sha256').update(sessionData).digest('hex').substring(0, 12);
    }
    
    async logUserPresence(eventType, data = {}) {
        const sessionId = data.sessionId || this.generateSessionHash(data.userId || 'anonymous');
        const timestamp = new Date().toISOString();
        
        const presenceEvent = {
            sessionId,
            timestamp,
            eventType, // 'login', 'upload', 'payment', 'download', 'logout', 'error'
            userId: data.userId || 'anonymous',
            userAgent: data.userAgent,
            ipAddress: data.ipAddress ? this.obfuscateIP(data.ipAddress) : null,
            metadata: {
                ...data.metadata,
                platform: 'FinishThisIdea',
                version: '2.0.0'
            }
        };
        
        // Store in memory buffer
        this.interactionBuffer.push(presenceEvent);
        
        // Update active sessions
        if (eventType === 'login' || eventType === 'upload') {
            this.activeSessionsMap.set(sessionId, {
                ...presenceEvent,
                lastActivity: timestamp
            });
        } else if (eventType === 'logout') {
            this.activeSessionsMap.delete(sessionId);
        }
        
        // Log to file immediately for critical events
        if (['error', 'payment', 'security'].includes(eventType)) {
            await this.writeToFile(presenceEvent);
        }
        
        logger.info('User presence logged', { 
            eventType, 
            sessionId, 
            userId: data.userId 
        });
        
        return sessionId;
    }
    
    async logFileUpload(uploadData) {
        return await this.logUserPresence('upload', {
            ...uploadData,
            metadata: {
                fileName: uploadData.fileName,
                fileSize: uploadData.fileSize,
                fileType: uploadData.fileType,
                uploadId: uploadData.uploadId,
                s3Key: uploadData.s3Key
            }
        });
    }
    
    async logPaymentEvent(paymentData) {
        return await this.logUserPresence('payment', {
            ...paymentData,
            metadata: {
                amount: paymentData.amount,
                currency: paymentData.currency,
                paymentMethod: paymentData.paymentMethod,
                stripeSessionId: paymentData.stripeSessionId,
                serviceType: paymentData.serviceType,
                bundleId: paymentData.bundleId
            }
        });
    }
    
    async logJobProcessing(jobData) {
        return await this.logUserPresence('processing', {
            ...jobData,
            metadata: {
                jobId: jobData.jobId,
                jobType: jobData.jobType,
                status: jobData.status,
                processingTime: jobData.processingTime,
                errorMessage: jobData.errorMessage
            }
        });
    }
    
    async logSecurityEvent(securityData) {
        return await this.logUserPresence('security', {
            ...securityData,
            metadata: {
                eventType: securityData.eventType,
                threatLevel: securityData.threatLevel || 'low',
                details: securityData.details,
                blocked: securityData.blocked || false
            }
        });
    }
    
    async logAPICall(apiData) {
        return await this.logUserPresence('api_call', {
            ...apiData,
            metadata: {
                endpoint: apiData.endpoint,
                method: apiData.method,
                statusCode: apiData.statusCode,
                responseTime: apiData.responseTime,
                userAgent: apiData.userAgent
            }
        });
    }
    
    obfuscateIP(ip) {
        // Hash IP for privacy while maintaining uniqueness
        return crypto.createHash('md5').update(ip + 'finishthisidea_salt').digest('hex').substring(0, 8);
    }
    
    async writeToFile(event) {
        const fileName = `presence_${new Date().toISOString().split('T')[0]}.jsonl`;
        const filePath = path.join(this.logsPath, fileName);
        
        try {
            await fs.promises.appendFile(filePath, JSON.stringify(event) + '\\n');
        } catch (error) {
            logger.error('Failed to write presence log to file', { error, event });
        }
    }
    
    async flushInteractions() {
        if (this.interactionBuffer.length === 0) return;
        
        const events = [...this.interactionBuffer];
        this.interactionBuffer = [];
        
        try {
            // Write to database for analytics
            for (const event of events) {
                await prisma.userInteraction.create({
                    data: {
                        sessionId: event.sessionId,
                        eventType: event.eventType,
                        userId: event.userId !== 'anonymous' ? event.userId : null,
                        metadata: event.metadata,
                        timestamp: new Date(event.timestamp),
                        ipHash: event.ipAddress
                    }
                }).catch(error => {
                    // Silently fail if table doesn't exist yet
                    if (!error.message.includes('relation "UserInteraction" does not exist')) {
                        logger.error('Failed to store interaction in database', { error });
                    }
                });
            }
            
            // Also write to daily log file
            const fileName = `interactions_${new Date().toISOString().split('T')[0]}.jsonl`;
            const filePath = path.join(this.interactionsPath, fileName);
            
            const logData = events.map(e => JSON.stringify(e)).join('\\n') + '\\n';
            await fs.promises.appendFile(filePath, logData);
            
            logger.info('Flushed interactions to storage', { count: events.length });
            
        } catch (error) {
            logger.error('Failed to flush interactions', { error, count: events.length });
            // Put events back in buffer to retry
            this.interactionBuffer.unshift(...events);
        }
    }
    
    getActiveSessions() {
        // Clean up old sessions (> 30 minutes inactive)
        const cutoff = new Date(Date.now() - 30 * 60 * 1000);
        for (const [sessionId, session] of this.activeSessionsMap.entries()) {
            if (new Date(session.lastActivity) < cutoff) {
                this.activeSessionsMap.delete(sessionId);
            }
        }
        
        return Array.from(this.activeSessionsMap.values());
    }
    
    async getAnalytics(timeframe = '24h') {
        try {
            let timeFilter;
            switch (timeframe) {
                case '1h':
                    timeFilter = new Date(Date.now() - 60 * 60 * 1000);
                    break;
                case '24h':
                    timeFilter = new Date(Date.now() - 24 * 60 * 60 * 1000);
                    break;
                case '7d':
                    timeFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    timeFilter = new Date(Date.now() - 24 * 60 * 60 * 1000);
            }
            
            const interactions = await prisma.userInteraction.findMany({
                where: {
                    timestamp: {
                        gte: timeFilter
                    }
                },
                orderBy: {
                    timestamp: 'desc'
                }
            }).catch(() => []);
            
            // Analyze interaction patterns
            const analytics = {
                totalInteractions: interactions.length,
                uniqueSessions: new Set(interactions.map(i => i.sessionId)).size,
                eventTypes: {},
                hourlyDistribution: {},
                userJourney: this.analyzeUserJourney(interactions),
                activeSessions: this.getActiveSessions().length
            };
            
            // Count event types
            interactions.forEach(interaction => {
                analytics.eventTypes[interaction.eventType] = 
                    (analytics.eventTypes[interaction.eventType] || 0) + 1;
                
                const hour = new Date(interaction.timestamp).getHours();
                analytics.hourlyDistribution[hour] = 
                    (analytics.hourlyDistribution[hour] || 0) + 1;
            });
            
            return analytics;
            
        } catch (error) {
            logger.error('Failed to get presence analytics', { error });
            return { error: 'Failed to retrieve analytics' };
        }
    }
    
    analyzeUserJourney(interactions) {
        const journeys = {};
        
        interactions.forEach(interaction => {
            const sessionId = interaction.sessionId;
            if (!journeys[sessionId]) {
                journeys[sessionId] = [];
            }
            journeys[sessionId].push({
                event: interaction.eventType,
                timestamp: interaction.timestamp,
                metadata: interaction.metadata
            });
        });
        
        // Analyze common paths
        const commonPaths = {};
        Object.values(journeys).forEach(journey => {
            const path = journey.map(j => j.event).join(' → ');
            commonPaths[path] = (commonPaths[path] || 0) + 1;
        });
        
        return {
            totalJourneys: Object.keys(journeys).length,
            averageSteps: Object.values(journeys).reduce((sum, j) => sum + j.length, 0) / Object.keys(journeys).length,
            commonPaths: Object.entries(commonPaths)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10)
                .map(([path, count]) => ({ path, count }))
        };
    }
    
    async cleanup() {
        // Flush any remaining interactions
        await this.flushInteractions();
        
        // Clean up old log files (keep last 30 days)
        const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        for (const dir of [this.logsPath, this.interactionsPath, this.sessionsPath]) {
            try {
                const files = await fs.promises.readdir(dir);
                for (const file of files) {
                    const filePath = path.join(dir, file);
                    const stats = await fs.promises.stat(filePath);
                    if (stats.mtime < cutoff) {
                        await fs.promises.unlink(filePath);
                        logger.info('Cleaned up old log file', { file });
                    }
                }
            } catch (error) {
                logger.error('Failed to cleanup log files', { error, dir });
            }
        }
    }
}

// Singleton instance
const presenceLogger = new PresenceLogger();

// Cleanup on process exit
process.on('SIGTERM', () => presenceLogger.cleanup());
process.on('SIGINT', () => presenceLogger.cleanup());

module.exports = { presenceLogger, PresenceLogger };