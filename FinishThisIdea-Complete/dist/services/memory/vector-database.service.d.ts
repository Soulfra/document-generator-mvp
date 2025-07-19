import { EventEmitter } from 'events';
export interface VectorConfig {
    provider: 'pinecone' | 'weaviate' | 'qdrant' | 'chroma' | 'local';
    apiKey?: string;
    endpoint?: string;
    indexName?: string;
    dimensions?: number;
    metric?: 'cosine' | 'euclidean' | 'dotproduct';
    replicas?: number;
    environment?: string;
}
export interface VectorDocument {
    id: string;
    content: string;
    metadata: {
        timestamp: number;
        userId?: string;
        tenantId?: string;
        sessionId?: string;
        type: 'conversation' | 'knowledge' | 'context' | 'agent_memory';
        source: string;
        importance?: number;
        tags?: string[];
        [key: string]: any;
    };
    embedding?: number[];
    score?: number;
}
export interface SearchOptions {
    query: string;
    filter?: Record<string, any>;
    topK?: number;
    threshold?: number;
    includeMetadata?: boolean;
    includeValues?: boolean;
    namespace?: string;
}
export interface MemoryContext {
    conversationHistory: VectorDocument[];
    relevantKnowledge: VectorDocument[];
    agentMemories: VectorDocument[];
    totalRelevance: number;
}
export interface VectorStats {
    totalVectors: number;
    indexSize: number;
    dimensions: number;
    memoryUsage: number;
    queriesPerSecond: number;
    averageLatency: number;
}
export declare abstract class VectorDatabaseProvider extends EventEmitter {
    protected config: VectorConfig;
    protected initialized: boolean;
    constructor(config: VectorConfig);
    abstract initialize(): Promise<void>;
    abstract upsert(documents: VectorDocument[]): Promise<void>;
    abstract search(options: SearchOptions): Promise<VectorDocument[]>;
    abstract delete(ids: string[]): Promise<void>;
    abstract getStats(): Promise<VectorStats>;
    abstract createIndex(indexName: string, dimensions: number): Promise<void>;
    abstract deleteIndex(indexName: string): Promise<void>;
    abstract shutdown(): Promise<void>;
    isInitialized(): boolean;
}
export declare class PineconeProvider extends VectorDatabaseProvider {
    private pinecone;
    private index;
    initialize(): Promise<void>;
    createIndex(indexName: string, dimensions: number): Promise<void>;
    upsert(documents: VectorDocument[]): Promise<void>;
    search(options: SearchOptions): Promise<VectorDocument[]>;
    delete(ids: string[]): Promise<void>;
    deleteIndex(indexName: string): Promise<void>;
    getStats(): Promise<VectorStats>;
    shutdown(): Promise<void>;
    private generateEmbedding;
}
export declare class LocalVectorProvider extends VectorDatabaseProvider {
    private vectors;
    private embeddings;
    initialize(): Promise<void>;
    createIndex(indexName: string, dimensions: number): Promise<void>;
    upsert(documents: VectorDocument[]): Promise<void>;
    search(options: SearchOptions): Promise<VectorDocument[]>;
    delete(ids: string[]): Promise<void>;
    deleteIndex(indexName: string): Promise<void>;
    getStats(): Promise<VectorStats>;
    shutdown(): Promise<void>;
    private generateEmbedding;
    private cosineSimilarity;
}
export declare class VectorDatabaseService extends EventEmitter {
    private provider;
    private config;
    private stats;
    constructor(config: VectorConfig);
    private createProvider;
    initialize(): Promise<void>;
    storeConversation(userId: string, sessionId: string, messages: Array<{
        role: string;
        content: string;
    }>, tenantId?: string): Promise<void>;
    storeKnowledge(content: string, metadata: {
        title?: string;
        source: string;
        type: string;
        userId?: string;
        tenantId?: string;
        tags?: string[];
    }): Promise<string>;
    storeAgentMemory(agentId: string, content: string, context: {
        action: string;
        result: string;
        userId?: string;
        tenantId?: string;
        sessionId?: string;
    }): Promise<void>;
    getRelevantContext(query: string, options?: {
        userId?: string;
        tenantId?: string;
        sessionId?: string;
        includeConversations?: boolean;
        includeKnowledge?: boolean;
        includeAgentMemories?: boolean;
        maxResults?: number;
    }): Promise<MemoryContext>;
    deleteUserData(userId: string, tenantId?: string): Promise<void>;
    getStatistics(): Promise<VectorStats & {
        serviceStats: typeof this.stats;
    }>;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=vector-database.service.d.ts.map