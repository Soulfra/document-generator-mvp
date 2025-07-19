"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupMemory = exports.CleanupMemoryService = void 0;
const database_1 = require("../../utils/database");
const logger_1 = require("../../utils/logger");
const ioredis_1 = __importDefault(require("ioredis"));
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const redis = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379');
class CleanupMemoryService {
    thoughtLogPath;
    maxThoughtsInMemory = 100;
    preferencesCacheTime = 7 * 24 * 60 * 60;
    constructor() {
        this.thoughtLogPath = path_1.default.join(process.cwd(), 'logs', 'cleanup-thoughts');
        this.initializeThoughtLog();
    }
    async initializeThoughtLog() {
        try {
            await promises_1.default.mkdir(this.thoughtLogPath, { recursive: true });
        }
        catch (error) {
            logger_1.logger.error('Failed to create thought log directory', error);
        }
    }
    async logThought(thought) {
        const fullThought = {
            id: `thought-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            jobId: thought.jobId || 'unknown',
            sessionId: thought.sessionId || 'unknown',
            userId: thought.userId,
            eventType: thought.eventType || 'analysis',
            reasoning: {
                intent: 'analyzing code patterns',
                confidence: 0.8,
                decisionPath: [],
                alternativesConsidered: [],
                ...thought.reasoning
            },
            analysis: {
                detectedPatterns: [],
                codeStyle: {},
                problemsFound: [],
                suggestedFixes: [],
                ...thought.analysis
            },
            userContext: {
                previousJobs: 0,
                successRate: 1.0,
                trustLevel: 0.5,
                ...thought.userContext
            },
            systemState: {
                processingTimeMs: 0,
                filesAnalyzed: 0,
                aiProvider: 'ollama',
                memoryUsageMb: process.memoryUsage().heapUsed / 1024 / 1024,
                ...thought.systemState
            },
            learning: {
                newPatterns: [],
                improvementNotes: [],
                ...thought.learning
            }
        };
        await this.persistThought(fullThought);
        await this.cacheThought(fullThought);
        if (thought.eventType === 'error' || thought.reasoning?.confidence && thought.reasoning.confidence < 0.5) {
            logger_1.logger.info('Cleanup significant thought', {
                eventType: fullThought.eventType,
                intent: fullThought.reasoning.intent,
                jobId: fullThought.jobId
            });
        }
        return fullThought;
    }
    async logAnalysisThought(jobId, sessionId, analysis) {
        const detectedPatterns = this.detectCodePatterns(analysis);
        return this.logThought({
            jobId,
            sessionId,
            eventType: 'analysis',
            reasoning: {
                intent: 'Analyzing code structure and patterns',
                confidence: 0.85,
                decisionPath: [
                    'Scanned file structure',
                    'Detected programming languages',
                    'Analyzed code patterns',
                    'Identified improvement opportunities'
                ],
                alternativesConsidered: []
            },
            analysis: {
                detectedPatterns,
                codeStyle: analysis.style || {},
                problemsFound: analysis.issues || [],
                suggestedFixes: analysis.suggestions || []
            },
            systemState: {
                filesAnalyzed: analysis.totalFiles,
                processingTimeMs: Date.now() - analysis.startTime,
                aiProvider: 'ollama',
                memoryUsageMb: process.memoryUsage().heapUsed / 1024 / 1024
            }
        });
    }
    async logCleanupDecision(jobId, sessionId, decision) {
        return this.logThought({
            jobId,
            sessionId,
            eventType: 'decision',
            reasoning: {
                intent: 'Deciding cleanup strategy based on analysis',
                confidence: decision.confidence || 0.8,
                decisionPath: decision.steps || [],
                alternativesConsidered: decision.alternatives || []
            },
            analysis: {
                detectedPatterns: decision.patterns || [],
                codeStyle: decision.targetStyle || {},
                problemsFound: decision.issues || [],
                suggestedFixes: decision.fixes || []
            },
            learning: {
                newPatterns: decision.newPatterns || [],
                improvementNotes: [
                    'Applied user preferences',
                    'Optimized for code maintainability'
                ]
            }
        });
    }
    async saveUserPreferences(jobId, sessionId, userId) {
        try {
            const job = await database_1.prisma.job.findUnique({
                where: { id: jobId },
                include: { analysisResult: true }
            });
            if (!job || !job.analysisResult)
                return;
            const preferences = {
                userId,
                sessionId,
                preferences: {
                    keepPatterns: [],
                    removePatterns: ['node_modules', 'dist', 'build', '.git'],
                    organizationStyle: 'standard',
                    indentationPreference: 'spaces',
                    indentSize: 2,
                    lineEnding: 'lf',
                    preserveComments: true,
                    generateDocs: false
                },
                confidence: 0.8
            };
            const key = userId ? `prefs:user:${userId}` : `prefs:session:${sessionId}`;
            await redis.setex(key, this.preferencesCacheTime, JSON.stringify(preferences));
            if (userId) {
                await database_1.prisma.user.update({
                    where: { id: userId },
                    data: {
                        metadata: {
                            cleanupPreferences: preferences.preferences
                        }
                    }
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Failed to save user preferences', { error, jobId });
        }
    }
    async getUserPreferences(sessionId, userId) {
        try {
            if (userId) {
                const userKey = `prefs:user:${userId}`;
                const userPrefs = await redis.get(userKey);
                if (userPrefs) {
                    return JSON.parse(userPrefs);
                }
            }
            const sessionKey = `prefs:session:${sessionId}`;
            const sessionPrefs = await redis.get(sessionKey);
            if (sessionPrefs) {
                return JSON.parse(sessionPrefs);
            }
            return null;
        }
        catch (error) {
            logger_1.logger.error('Failed to get user preferences', { error, sessionId, userId });
            return null;
        }
    }
    async getCleanupInsights(userId) {
        try {
            const thoughts = await this.getRecentThoughts(userId, 50);
            const insights = {
                totalCleanups: thoughts.length,
                preferredPatterns: this.extractPreferredPatterns(thoughts),
                commonIssues: this.extractCommonIssues(thoughts),
                averageConfidence: this.calculateAverageConfidence(thoughts),
                successRate: this.calculateSuccessRate(thoughts),
                recommendations: this.generateRecommendations(thoughts)
            };
            return insights;
        }
        catch (error) {
            logger_1.logger.error('Failed to get cleanup insights', { error, userId });
            return null;
        }
    }
    async persistThought(thought) {
        try {
            const date = new Date();
            const filename = `cleanup-thoughts-${date.toISOString().split('T')[0]}.jsonl`;
            const filepath = path_1.default.join(this.thoughtLogPath, filename);
            await promises_1.default.appendFile(filepath, JSON.stringify(thought) + '\n');
        }
        catch (error) {
            logger_1.logger.error('Failed to persist cleanup thought', error);
        }
    }
    async cacheThought(thought) {
        try {
            const jobKey = `cleanup:thoughts:job:${thought.jobId}`;
            await redis.lpush(jobKey, JSON.stringify(thought));
            await redis.ltrim(jobKey, 0, this.maxThoughtsInMemory - 1);
            await redis.expire(jobKey, 604800);
            if (thought.userId) {
                const userKey = `cleanup:thoughts:user:${thought.userId}`;
                await redis.lpush(userKey, JSON.stringify(thought));
                await redis.ltrim(userKey, 0, this.maxThoughtsInMemory - 1);
                await redis.expire(userKey, 2592000);
            }
            await redis.xadd('cleanup:thought-stream', '*', 'job_id', thought.jobId, 'event_type', thought.eventType, 'timestamp', thought.timestamp, 'thought', JSON.stringify(thought));
        }
        catch (error) {
            logger_1.logger.error('Failed to cache cleanup thought', error);
        }
    }
    async getRecentThoughts(identifier, limit = 10) {
        try {
            const userKey = `cleanup:thoughts:user:${identifier}`;
            const jobKey = `cleanup:thoughts:job:${identifier}`;
            let thoughts = await redis.lrange(userKey, 0, limit - 1);
            if (thoughts.length === 0) {
                thoughts = await redis.lrange(jobKey, 0, limit - 1);
            }
            return thoughts.map(t => JSON.parse(t));
        }
        catch (error) {
            logger_1.logger.error('Failed to retrieve cleanup thoughts', error);
            return [];
        }
    }
    detectCodePatterns(analysis) {
        const patterns = [];
        if (analysis.languages) {
            Object.entries(analysis.languages).forEach(([lang, count]) => {
                if (count > 5) {
                    patterns.push(`heavy_${lang}_usage`);
                }
            });
        }
        if (analysis.structure) {
            if (analysis.structure.includes('src/'))
                patterns.push('uses_src_folder');
            if (analysis.structure.includes('test/') || analysis.structure.includes('tests/')) {
                patterns.push('has_tests');
            }
            if (analysis.structure.includes('docs/'))
                patterns.push('has_documentation');
        }
        if (analysis.fileTypes) {
            if (analysis.fileTypes['.ts'] > 0)
                patterns.push('typescript_project');
            if (analysis.fileTypes['.jsx'] > 0 || analysis.fileTypes['.tsx'] > 0) {
                patterns.push('react_project');
            }
        }
        return patterns;
    }
    extractPreferredPatterns(thoughts) {
        const patterns = {};
        thoughts.forEach(thought => {
            thought.analysis.detectedPatterns.forEach(pattern => {
                patterns[pattern] = (patterns[pattern] || 0) + 1;
            });
        });
        return patterns;
    }
    extractCommonIssues(thoughts) {
        const issues = {};
        thoughts.forEach(thought => {
            thought.analysis.problemsFound.forEach(problem => {
                issues[problem] = (issues[problem] || 0) + 1;
            });
        });
        return issues;
    }
    calculateAverageConfidence(thoughts) {
        if (thoughts.length === 0)
            return 0;
        const totalConfidence = thoughts.reduce((sum, thought) => {
            return sum + thought.reasoning.confidence;
        }, 0);
        return totalConfidence / thoughts.length;
    }
    calculateSuccessRate(thoughts) {
        if (thoughts.length === 0)
            return 1;
        const errors = thoughts.filter(t => t.eventType === 'error').length;
        return 1 - (errors / thoughts.length);
    }
    generateRecommendations(thoughts) {
        const recommendations = [];
        const avgConfidence = this.calculateAverageConfidence(thoughts);
        if (avgConfidence < 0.7) {
            recommendations.push('Consider providing more specific cleanup instructions');
        }
        const commonIssues = this.extractCommonIssues(thoughts);
        if (commonIssues['unused_imports'] > 3) {
            recommendations.push('Your code often has unused imports - consider using an import cleaner');
        }
        if (commonIssues['inconsistent_indentation'] > 3) {
            recommendations.push('Your code has inconsistent indentation - consider using a formatter');
        }
        return recommendations;
    }
}
exports.CleanupMemoryService = CleanupMemoryService;
exports.cleanupMemory = new CleanupMemoryService();
//# sourceMappingURL=cleanup-memory.service.js.map