import { EventEmitter } from 'events';
export interface SoulframMemoryConfig {
    apiUrl?: string;
    autoStart?: boolean;
    pythonPath?: string;
    soulfraPath?: string;
    port?: number;
}
export interface Memory {
    id?: number;
    title?: string;
    content: string;
    type?: 'text' | 'url' | 'code' | 'image' | 'conversation' | 'knowledge' | 'agent_memory';
    collection?: string;
    tags?: string[];
    metadata?: {
        userId?: string;
        tenantId?: string;
        sessionId?: string;
        agentId?: string;
        importance?: number;
        source?: string;
        timestamp?: number;
        [key: string]: any;
    };
}
export interface MemoryResponse extends Memory {
    id: number;
    created_at: string;
    updated_at: string;
    content_hash: string;
    personality_insights?: {
        mood: string;
        energy_level: string;
        topics: string[];
        sentiment_score: number;
    };
}
export interface PersonalityAnalysis {
    text_length: number;
    insights: {
        mood: string;
        energy_level: string;
        topics: string[];
        sentiment_score: number;
    };
}
export interface Collection {
    name: string;
    count: number;
}
export interface SearchOptions {
    collection?: string;
    type?: string;
    search?: string;
    limit?: number;
    offset?: number;
    userId?: string;
    tenantId?: string;
}
export interface MemoryContext {
    conversationHistory: MemoryResponse[];
    relevantKnowledge: MemoryResponse[];
    agentMemories: MemoryResponse[];
    totalRelevance: number;
    personality_summary?: PersonalityAnalysis;
}
export declare class SoulframMemoryIntegration extends EventEmitter {
    private config;
    private apiClient;
    private memoryProcess?;
    private initialized;
    constructor(config?: SoulframMemoryConfig);
    initialize(): Promise<void>;
    private startMemoryService;
    private waitForService;
    checkHealth(): Promise<boolean>;
    storeMemory(memory: Memory): Promise<MemoryResponse>;
    getMemory(id: number): Promise<MemoryResponse>;
    searchMemories(options?: SearchOptions): Promise<MemoryResponse[]>;
    updateMemory(id: number, memory: Memory): Promise<MemoryResponse>;
    deleteMemory(id: number): Promise<void>;
    storeConversation(userId: string, sessionId: string, messages: Array<{
        role: string;
        content: string;
    }>, tenantId?: string): Promise<MemoryResponse[]>;
    storeKnowledge(content: string, metadata: {
        title?: string;
        source: string;
        type: string;
        userId?: string;
        tenantId?: string;
        tags?: string[];
    }): Promise<MemoryResponse>;
    storeAgentMemory(agentId: string, content: string, context: {
        action: string;
        result: string;
        userId?: string;
        tenantId?: string;
        sessionId?: string;
    }): Promise<MemoryResponse>;
    getRelevantContext(query: string, options?: {
        userId?: string;
        tenantId?: string;
        sessionId?: string;
        includeConversations?: boolean;
        includeKnowledge?: boolean;
        includeAgentMemories?: boolean;
        maxResults?: number;
    }): Promise<MemoryContext>;
    getCollections(): Promise<Collection[]>;
    analyzePersonality(text: string): Promise<PersonalityAnalysis>;
    getUserMemoryStats(userId: string, tenantId?: string): Promise<{
        totalMemories: number;
        conversationCount: number;
        knowledgeCount: number;
        agentMemoryCount: number;
        collections: Collection[];
        averageSentiment: number;
        dominantMood: string;
    }>;
    deleteUserData(userId: string, tenantId?: string): Promise<void>;
    shutdown(): Promise<void>;
    isInitialized(): boolean;
    getConfig(): SoulframMemoryConfig;
}
export declare const soulframMemory: SoulframMemoryIntegration;
//# sourceMappingURL=soulfra-memory.integration.d.ts.map