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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorDatabaseService = exports.LocalVectorProvider = exports.PineconeProvider = exports.VectorDatabaseProvider = void 0;
const events_1 = require("events");
const logger_1 = require("../../utils/logger");
const crypto_1 = __importDefault(require("crypto"));
class VectorDatabaseProvider extends events_1.EventEmitter {
    config;
    initialized = false;
    constructor(config) {
        super();
        this.config = config;
    }
    isInitialized() {
        return this.initialized;
    }
}
exports.VectorDatabaseProvider = VectorDatabaseProvider;
class PineconeProvider extends VectorDatabaseProvider {
    pinecone;
    index;
    async initialize() {
        try {
            const { Pinecone } = await Promise.resolve().then(() => __importStar(require('@pinecone-database/pinecone')));
            this.pinecone = new Pinecone({
                apiKey: this.config.apiKey,
                environment: this.config.environment || 'us-west1-gcp'
            });
            if (this.config.indexName) {
                this.index = this.pinecone.index(this.config.indexName);
            }
            this.initialized = true;
            logger_1.logger.info('Pinecone vector database initialized', {
                indexName: this.config.indexName,
                environment: this.config.environment
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize Pinecone', error);
            throw error;
        }
    }
    async createIndex(indexName, dimensions) {
        await this.pinecone.createIndex({
            name: indexName,
            dimension: dimensions,
            metric: this.config.metric || 'cosine',
            spec: {
                serverless: {
                    cloud: 'aws',
                    region: 'us-west-2'
                }
            }
        });
        this.config.indexName = indexName;
        this.index = this.pinecone.index(indexName);
    }
    async upsert(documents) {
        if (!this.index)
            throw new Error('Index not initialized');
        const vectors = documents.map(doc => ({
            id: doc.id,
            values: doc.embedding,
            metadata: {
                content: doc.content,
                ...doc.metadata
            }
        }));
        await this.index.upsert(vectors);
    }
    async search(options) {
        if (!this.index)
            throw new Error('Index not initialized');
        const queryEmbedding = await this.generateEmbedding(options.query);
        const response = await this.index.query({
            vector: queryEmbedding,
            topK: options.topK || 10,
            filter: options.filter,
            includeMetadata: true,
            includeValues: options.includeValues || false
        });
        return response.matches.map((match) => ({
            id: match.id,
            content: match.metadata.content,
            metadata: match.metadata,
            embedding: match.values,
            score: match.score
        }));
    }
    async delete(ids) {
        if (!this.index)
            throw new Error('Index not initialized');
        await this.index.delete(ids);
    }
    async deleteIndex(indexName) {
        await this.pinecone.deleteIndex(indexName);
    }
    async getStats() {
        if (!this.index)
            throw new Error('Index not initialized');
        const stats = await this.index.describeIndexStats();
        return {
            totalVectors: stats.totalVectorCount || 0,
            indexSize: stats.indexFullness || 0,
            dimensions: this.config.dimensions || 1536,
            memoryUsage: 0,
            queriesPerSecond: 0,
            averageLatency: 0
        };
    }
    async shutdown() {
        this.initialized = false;
        logger_1.logger.info('Pinecone provider shut down');
    }
    async generateEmbedding(text) {
        const mockEmbedding = new Array(this.config.dimensions || 1536).fill(0).map(() => Math.random() - 0.5);
        return mockEmbedding;
    }
}
exports.PineconeProvider = PineconeProvider;
class LocalVectorProvider extends VectorDatabaseProvider {
    vectors = new Map();
    embeddings = new Map();
    async initialize() {
        this.initialized = true;
        logger_1.logger.info('Local vector database initialized');
    }
    async createIndex(indexName, dimensions) {
        this.config.indexName = indexName;
        this.config.dimensions = dimensions;
        logger_1.logger.info('Local vector index created', { indexName, dimensions });
    }
    async upsert(documents) {
        for (const doc of documents) {
            this.vectors.set(doc.id, doc);
            if (doc.embedding) {
                this.embeddings.set(doc.id, doc.embedding);
            }
            else {
                const embedding = await this.generateEmbedding(doc.content);
                this.embeddings.set(doc.id, embedding);
                doc.embedding = embedding;
            }
        }
    }
    async search(options) {
        const queryEmbedding = await this.generateEmbedding(options.query);
        const results = [];
        for (const [id, doc] of this.vectors.entries()) {
            if (options.filter) {
                let matches = true;
                for (const [key, value] of Object.entries(options.filter)) {
                    if (doc.metadata[key] !== value) {
                        matches = false;
                        break;
                    }
                }
                if (!matches)
                    continue;
            }
            const embedding = this.embeddings.get(id);
            if (embedding) {
                const score = this.cosineSimilarity(queryEmbedding, embedding);
                if (!options.threshold || score >= options.threshold) {
                    results.push({ doc: { ...doc, score }, score });
                }
            }
        }
        results.sort((a, b) => b.score - a.score);
        return results.slice(0, options.topK || 10).map(r => r.doc);
    }
    async delete(ids) {
        for (const id of ids) {
            this.vectors.delete(id);
            this.embeddings.delete(id);
        }
    }
    async deleteIndex(indexName) {
        this.vectors.clear();
        this.embeddings.clear();
        logger_1.logger.info('Local vector index deleted', { indexName });
    }
    async getStats() {
        return {
            totalVectors: this.vectors.size,
            indexSize: this.vectors.size * (this.config.dimensions || 1536) * 4,
            dimensions: this.config.dimensions || 1536,
            memoryUsage: process.memoryUsage().heapUsed,
            queriesPerSecond: 0,
            averageLatency: 0
        };
    }
    async shutdown() {
        this.vectors.clear();
        this.embeddings.clear();
        this.initialized = false;
        logger_1.logger.info('Local vector provider shut down');
    }
    async generateEmbedding(text) {
        const hash = crypto_1.default.createHash('md5').update(text).digest('hex');
        const embedding = new Array(this.config.dimensions || 1536);
        for (let i = 0; i < embedding.length; i++) {
            const char = hash[i % hash.length];
            embedding[i] = (parseInt(char, 16) / 15) - 0.5;
        }
        return embedding;
    }
    cosineSimilarity(a, b) {
        if (a.length !== b.length)
            return 0;
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}
exports.LocalVectorProvider = LocalVectorProvider;
class VectorDatabaseService extends events_1.EventEmitter {
    provider;
    config;
    stats = {
        totalQueries: 0,
        totalDocuments: 0,
        averageQueryTime: 0,
        lastQueryTime: 0
    };
    constructor(config) {
        super();
        this.config = config;
        this.provider = this.createProvider(config);
    }
    createProvider(config) {
        switch (config.provider) {
            case 'pinecone':
                return new PineconeProvider(config);
            case 'local':
                return new LocalVectorProvider(config);
            default:
                logger_1.logger.warn(`Vector provider ${config.provider} not implemented, using local provider`);
                return new LocalVectorProvider(config);
        }
    }
    async initialize() {
        try {
            await this.provider.initialize();
            if (!this.config.indexName) {
                const indexName = `finishthisidea-${Date.now()}`;
                await this.provider.createIndex(indexName, this.config.dimensions || 1536);
                this.config.indexName = indexName;
            }
            this.emit('initialized', { provider: this.config.provider });
            logger_1.logger.info('Vector database service initialized', {
                provider: this.config.provider,
                indexName: this.config.indexName
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize vector database service', error);
            throw error;
        }
    }
    async storeConversation(userId, sessionId, messages, tenantId) {
        const documents = messages.map((message, index) => ({
            id: `conv-${sessionId}-${index}-${Date.now()}`,
            content: message.content,
            metadata: {
                timestamp: Date.now(),
                userId,
                tenantId,
                sessionId,
                type: 'conversation',
                source: 'chat',
                role: message.role,
                messageIndex: index,
                importance: message.role === 'user' ? 0.8 : 0.6
            }
        }));
        await this.provider.upsert(documents);
        this.stats.totalDocuments += documents.length;
        this.emit('conversation-stored', {
            sessionId,
            userId,
            messageCount: messages.length
        });
    }
    async storeKnowledge(content, metadata) {
        const documentId = `knowledge-${crypto_1.default.randomUUID()}`;
        const document = {
            id: documentId,
            content,
            metadata: {
                timestamp: Date.now(),
                type: 'knowledge',
                importance: 0.9,
                ...metadata
            }
        };
        await this.provider.upsert([document]);
        this.stats.totalDocuments++;
        this.emit('knowledge-stored', { documentId, source: metadata.source });
        return documentId;
    }
    async storeAgentMemory(agentId, content, context) {
        const document = {
            id: `agent-memory-${agentId}-${Date.now()}`,
            content,
            metadata: {
                timestamp: Date.now(),
                type: 'agent_memory',
                source: 'agent',
                agentId,
                importance: 0.7,
                ...context
            }
        };
        await this.provider.upsert([document]);
        this.stats.totalDocuments++;
        this.emit('agent-memory-stored', { agentId, action: context.action });
    }
    async getRelevantContext(query, options = {}) {
        const startTime = Date.now();
        const context = {
            conversationHistory: [],
            relevantKnowledge: [],
            agentMemories: [],
            totalRelevance: 0
        };
        const searchPromises = [];
        if (options.includeConversations !== false) {
            const conversationFilter = { type: 'conversation' };
            if (options.userId)
                conversationFilter.userId = options.userId;
            if (options.tenantId)
                conversationFilter.tenantId = options.tenantId;
            if (options.sessionId)
                conversationFilter.sessionId = options.sessionId;
            searchPromises.push(this.provider.search({
                query,
                filter: conversationFilter,
                topK: Math.floor((options.maxResults || 20) * 0.4),
                threshold: 0.7
            }));
        }
        else {
            searchPromises.push(Promise.resolve([]));
        }
        if (options.includeKnowledge !== false) {
            const knowledgeFilter = { type: 'knowledge' };
            if (options.tenantId)
                knowledgeFilter.tenantId = options.tenantId;
            searchPromises.push(this.provider.search({
                query,
                filter: knowledgeFilter,
                topK: Math.floor((options.maxResults || 20) * 0.4),
                threshold: 0.6
            }));
        }
        else {
            searchPromises.push(Promise.resolve([]));
        }
        if (options.includeAgentMemories !== false) {
            const agentFilter = { type: 'agent_memory' };
            if (options.userId)
                agentFilter.userId = options.userId;
            if (options.tenantId)
                agentFilter.tenantId = options.tenantId;
            searchPromises.push(this.provider.search({
                query,
                filter: agentFilter,
                topK: Math.floor((options.maxResults || 20) * 0.2),
                threshold: 0.5
            }));
        }
        else {
            searchPromises.push(Promise.resolve([]));
        }
        const [conversations, knowledge, agentMemories] = await Promise.all(searchPromises);
        context.conversationHistory = conversations;
        context.relevantKnowledge = knowledge;
        context.agentMemories = agentMemories;
        const allDocuments = [...conversations, ...knowledge, ...agentMemories];
        context.totalRelevance = allDocuments.reduce((sum, doc) => sum + (doc.score || 0), 0) / allDocuments.length;
        const queryTime = Date.now() - startTime;
        this.stats.totalQueries++;
        this.stats.averageQueryTime = (this.stats.averageQueryTime * (this.stats.totalQueries - 1) + queryTime) / this.stats.totalQueries;
        this.stats.lastQueryTime = queryTime;
        this.emit('context-retrieved', {
            query,
            resultsCount: allDocuments.length,
            relevance: context.totalRelevance,
            queryTime
        });
        return context;
    }
    async deleteUserData(userId, tenantId) {
        this.emit('user-data-deletion-requested', { userId, tenantId });
        logger_1.logger.info('User data deletion requested', { userId, tenantId });
    }
    async getStatistics() {
        const providerStats = await this.provider.getStats();
        return {
            ...providerStats,
            serviceStats: { ...this.stats }
        };
    }
    async shutdown() {
        await this.provider.shutdown();
        this.emit('shutdown');
        logger_1.logger.info('Vector database service shut down');
    }
}
exports.VectorDatabaseService = VectorDatabaseService;
//# sourceMappingURL=vector-database.service.js.map