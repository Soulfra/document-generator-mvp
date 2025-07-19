"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.soulframMemory = exports.SoulframMemoryIntegration = void 0;
const events_1 = require("events");
const logger_1 = require("../../utils/logger");
const axios_1 = __importDefault(require("axios"));
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
class SoulframMemoryIntegration extends events_1.EventEmitter {
    config;
    apiClient;
    memoryProcess;
    initialized = false;
    constructor(config = {}) {
        super();
        this.config = {
            apiUrl: config.apiUrl || 'http://localhost:8000',
            autoStart: config.autoStart !== false,
            pythonPath: config.pythonPath || 'python3',
            soulfraPath: config.soulfraPath || '/Users/matthewmauer/Desktop/Soulfra-AgentZero/Founder-Bootstrap/Blank-Kernel/SOULFRA-CONSOLIDATED-2025/SOULFRA-MEMORY',
            port: config.port || 8000,
            ...config
        };
        this.apiClient = axios_1.default.create({
            baseURL: this.config.apiUrl,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'FinishThisIdea-Platform/1.0'
            }
        });
        this.apiClient.interceptors.request.use((config) => {
            logger_1.logger.debug('SOULFRA-MEMORY API request', {
                method: config.method,
                url: config.url,
                data: config.data ? JSON.stringify(config.data).substring(0, 200) : undefined
            });
            return config;
        }, (error) => {
            logger_1.logger.error('SOULFRA-MEMORY API request error', error);
            return Promise.reject(error);
        });
        this.apiClient.interceptors.response.use((response) => {
            logger_1.logger.debug('SOULFRA-MEMORY API response', {
                status: response.status,
                url: response.config.url
            });
            return response;
        }, (error) => {
            logger_1.logger.error('SOULFRA-MEMORY API error', {
                status: error.response?.status,
                url: error.config?.url,
                message: error.message
            });
            return Promise.reject(error);
        });
    }
    async initialize() {
        try {
            await this.checkHealth();
            logger_1.logger.info('Connected to existing SOULFRA-MEMORY instance');
        }
        catch (error) {
            if (this.config.autoStart) {
                logger_1.logger.info('SOULFRA-MEMORY not running, starting new instance...');
                await this.startMemoryService();
                await this.waitForService();
            }
            else {
                throw new Error('SOULFRA-MEMORY service not available and autoStart is disabled');
            }
        }
        this.initialized = true;
        this.emit('initialized');
        logger_1.logger.info('SOULFRA-MEMORY integration initialized', {
            apiUrl: this.config.apiUrl,
            autoStarted: !!this.memoryProcess
        });
    }
    async startMemoryService() {
        if (!this.config.soulfraPath) {
            throw new Error('SOULFRA path not configured');
        }
        const mainPyPath = path_1.default.join(this.config.soulfraPath, 'api', 'main.py');
        this.memoryProcess = (0, child_process_1.spawn)(this.config.pythonPath, [mainPyPath], {
            cwd: this.config.soulfraPath,
            stdio: ['pipe', 'pipe', 'pipe'],
            env: {
                ...process.env,
                PYTHONPATH: this.config.soulfraPath,
                PORT: this.config.port.toString()
            }
        });
        this.memoryProcess.stdout?.on('data', (data) => {
            const output = data.toString();
            logger_1.logger.debug('SOULFRA-MEMORY stdout:', output);
            if (output.includes('Memory API initialized')) {
                this.emit('service-ready');
            }
        });
        this.memoryProcess.stderr?.on('data', (data) => {
            const error = data.toString();
            logger_1.logger.warn('SOULFRA-MEMORY stderr:', error);
        });
        this.memoryProcess.on('exit', (code) => {
            logger_1.logger.info('SOULFRA-MEMORY process exited', { code });
            this.memoryProcess = undefined;
            this.emit('service-stopped', { code });
        });
        this.memoryProcess.on('error', (error) => {
            logger_1.logger.error('SOULFRA-MEMORY process error', error);
            this.emit('service-error', error);
        });
    }
    async waitForService() {
        const maxWait = 30000;
        const interval = 1000;
        let waited = 0;
        while (waited < maxWait) {
            try {
                await this.checkHealth();
                return;
            }
            catch (error) {
                await new Promise(resolve => setTimeout(resolve, interval));
                waited += interval;
            }
        }
        throw new Error('SOULFRA-MEMORY service failed to start within timeout');
    }
    async checkHealth() {
        const response = await this.apiClient.get('/');
        return response.data.name === 'SOULFRA Memory API';
    }
    async storeMemory(memory) {
        const enhancedMemory = {
            ...memory,
            metadata: {
                timestamp: Date.now(),
                source: 'finishthisidea-platform',
                ...memory.metadata
            }
        };
        const response = await this.apiClient.post('/memories', enhancedMemory);
        const storedMemory = response.data;
        this.emit('memory-stored', {
            id: storedMemory.id,
            type: storedMemory.type,
            collection: storedMemory.collection,
            userId: memory.metadata?.userId,
            tenantId: memory.metadata?.tenantId
        });
        return storedMemory;
    }
    async getMemory(id) {
        const response = await this.apiClient.get(`/memories/${id}`);
        return response.data;
    }
    async searchMemories(options = {}) {
        const params = {};
        if (options.collection)
            params.collection = options.collection;
        if (options.type)
            params.type = options.type;
        if (options.search)
            params.search = options.search;
        if (options.limit)
            params.limit = options.limit;
        if (options.offset)
            params.offset = options.offset;
        const response = await this.apiClient.get('/memories', { params });
        let memories = response.data;
        if (options.userId || options.tenantId) {
            memories = memories.filter(memory => {
                if (options.userId && memory.metadata?.userId !== options.userId)
                    return false;
                if (options.tenantId && memory.metadata?.tenantId !== options.tenantId)
                    return false;
                return true;
            });
        }
        return memories;
    }
    async updateMemory(id, memory) {
        const response = await this.apiClient.put(`/memories/${id}`, memory);
        this.emit('memory-updated', {
            id,
            type: memory.type,
            userId: memory.metadata?.userId,
            tenantId: memory.metadata?.tenantId
        });
        return response.data;
    }
    async deleteMemory(id) {
        await this.apiClient.delete(`/memories/${id}`);
        this.emit('memory-deleted', { id });
    }
    async storeConversation(userId, sessionId, messages, tenantId) {
        const memories = [];
        for (const [index, message] of messages.entries()) {
            const memory = await this.storeMemory({
                title: `Conversation ${sessionId} - ${message.role} ${index + 1}`,
                content: message.content,
                type: 'conversation',
                collection: `conversation-${sessionId}`,
                tags: ['conversation', message.role, sessionId],
                metadata: {
                    userId,
                    tenantId,
                    sessionId,
                    role: message.role,
                    messageIndex: index,
                    importance: message.role === 'user' ? 0.8 : 0.6,
                    source: 'chat-interface'
                }
            });
            memories.push(memory);
        }
        this.emit('conversation-stored', {
            sessionId,
            userId,
            tenantId,
            messageCount: messages.length
        });
        return memories;
    }
    async storeKnowledge(content, metadata) {
        return await this.storeMemory({
            title: metadata.title,
            content,
            type: 'knowledge',
            collection: 'knowledge-base',
            tags: ['knowledge', ...(metadata.tags || [])],
            metadata: {
                importance: 0.9,
                source: metadata.source,
                ...metadata
            }
        });
    }
    async storeAgentMemory(agentId, content, context) {
        return await this.storeMemory({
            title: `Agent ${agentId} - ${context.action}`,
            content,
            type: 'agent_memory',
            collection: `agent-${agentId}`,
            tags: ['agent', agentId, context.action],
            metadata: {
                agentId,
                importance: 0.7,
                source: 'agent-system',
                ...context
            }
        });
    }
    async getRelevantContext(query, options = {}) {
        const context = {
            conversationHistory: [],
            relevantKnowledge: [],
            agentMemories: [],
            totalRelevance: 0
        };
        const searchPromises = [];
        if (options.includeConversations !== false) {
            searchPromises.push(this.searchMemories({
                type: 'conversation',
                search: query,
                userId: options.userId,
                tenantId: options.tenantId,
                limit: Math.floor((options.maxResults || 20) * 0.4)
            }));
        }
        else {
            searchPromises.push(Promise.resolve([]));
        }
        if (options.includeKnowledge !== false) {
            searchPromises.push(this.searchMemories({
                type: 'knowledge',
                search: query,
                tenantId: options.tenantId,
                limit: Math.floor((options.maxResults || 20) * 0.4)
            }));
        }
        else {
            searchPromises.push(Promise.resolve([]));
        }
        if (options.includeAgentMemories !== false) {
            searchPromises.push(this.searchMemories({
                type: 'agent_memory',
                search: query,
                userId: options.userId,
                tenantId: options.tenantId,
                limit: Math.floor((options.maxResults || 20) * 0.2)
            }));
        }
        else {
            searchPromises.push(Promise.resolve([]));
        }
        const [conversations, knowledge, agentMemories] = await Promise.all(searchPromises);
        context.conversationHistory = conversations;
        context.relevantKnowledge = knowledge;
        context.agentMemories = agentMemories;
        const allMemories = [...conversations, ...knowledge, ...agentMemories];
        if (allMemories.length > 0) {
            context.totalRelevance = allMemories.reduce((sum, memory) => {
                const contentMatch = memory.content.toLowerCase().includes(query.toLowerCase()) ? 1 : 0.5;
                const importance = memory.metadata?.importance || 0.5;
                return sum + (contentMatch * importance);
            }, 0) / allMemories.length;
        }
        try {
            context.personality_summary = await this.analyzePersonality(query);
        }
        catch (error) {
            logger_1.logger.warn('Failed to get personality analysis', error);
        }
        this.emit('context-retrieved', {
            query,
            resultsCount: allMemories.length,
            relevance: context.totalRelevance,
            userId: options.userId,
            tenantId: options.tenantId
        });
        return context;
    }
    async getCollections() {
        const response = await this.apiClient.get('/collections');
        return response.data;
    }
    async analyzePersonality(text) {
        const response = await this.apiClient.post('/analyze', { text });
        return response.data;
    }
    async getUserMemoryStats(userId, tenantId) {
        const memories = await this.searchMemories({
            userId,
            tenantId,
            limit: 1000
        });
        const stats = {
            totalMemories: memories.length,
            conversationCount: memories.filter(m => m.type === 'conversation').length,
            knowledgeCount: memories.filter(m => m.type === 'knowledge').length,
            agentMemoryCount: memories.filter(m => m.type === 'agent_memory').length,
            collections: [],
            averageSentiment: 0,
            dominantMood: 'neutral'
        };
        if (memories.length > 0) {
            const memoriesWithInsights = memories.filter(m => m.personality_insights);
            if (memoriesWithInsights.length > 0) {
                stats.averageSentiment = memoriesWithInsights.reduce((sum, m) => sum + (m.personality_insights?.sentiment_score || 0.5), 0) / memoriesWithInsights.length;
                const moodCounts = {};
                memoriesWithInsights.forEach(m => {
                    const mood = m.personality_insights?.mood || 'neutral';
                    moodCounts[mood] = (moodCounts[mood] || 0) + 1;
                });
                stats.dominantMood = Object.entries(moodCounts)
                    .sort(([, a], [, b]) => b - a)[0]?.[0] || 'neutral';
            }
        }
        const allCollections = await this.getCollections();
        stats.collections = allCollections;
        return stats;
    }
    async deleteUserData(userId, tenantId) {
        const memories = await this.searchMemories({
            userId,
            tenantId,
            limit: 10000
        });
        const batchSize = 50;
        for (let i = 0; i < memories.length; i += batchSize) {
            const batch = memories.slice(i, i + batchSize);
            await Promise.all(batch.map(memory => this.deleteMemory(memory.id)));
        }
        this.emit('user-data-deleted', { userId, tenantId, deletedCount: memories.length });
        logger_1.logger.info('User data deleted from SOULFRA-MEMORY', {
            userId,
            tenantId,
            deletedCount: memories.length
        });
    }
    async shutdown() {
        if (this.memoryProcess) {
            this.memoryProcess.kill('SIGTERM');
            await new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    this.memoryProcess?.kill('SIGKILL');
                    resolve();
                }, 5000);
                this.memoryProcess?.on('exit', () => {
                    clearTimeout(timeout);
                    resolve();
                });
            });
        }
        this.initialized = false;
        this.emit('shutdown');
        logger_1.logger.info('SOULFRA-MEMORY integration shut down');
    }
    isInitialized() {
        return this.initialized;
    }
    getConfig() {
        return { ...this.config };
    }
}
exports.SoulframMemoryIntegration = SoulframMemoryIntegration;
exports.soulframMemory = new SoulframMemoryIntegration({
    autoStart: true,
    soulfraPath: process.env.SOULFRA_PATH || '/Users/matthewmauer/Desktop/Soulfra-AgentZero/Founder-Bootstrap/Blank-Kernel/SOULFRA-CONSOLIDATED-2025/SOULFRA-MEMORY'
});
//# sourceMappingURL=soulfra-memory.integration.js.map