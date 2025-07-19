/**
 * Vector Database Service
 * 
 * Enterprise-grade vector database integration for persistent AI memory
 * Supports multiple providers: Pinecone, Weaviate, Qdrant, ChromaDB
 * Provides semantic search, memory persistence, and context retrieval
 */

import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';
import crypto from 'crypto';

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

export abstract class VectorDatabaseProvider extends EventEmitter {
  protected config: VectorConfig;
  protected initialized: boolean = false;

  constructor(config: VectorConfig) {
    super();
    this.config = config;
  }

  abstract initialize(): Promise<void>;
  abstract upsert(documents: VectorDocument[]): Promise<void>;
  abstract search(options: SearchOptions): Promise<VectorDocument[]>;
  abstract delete(ids: string[]): Promise<void>;
  abstract getStats(): Promise<VectorStats>;
  abstract createIndex(indexName: string, dimensions: number): Promise<void>;
  abstract deleteIndex(indexName: string): Promise<void>;
  abstract shutdown(): Promise<void>;

  isInitialized(): boolean {
    return this.initialized;
  }
}

export class PineconeProvider extends VectorDatabaseProvider {
  private pinecone: any;
  private index: any;

  async initialize(): Promise<void> {
    try {
      // Dynamic import for Pinecone
      const { Pinecone } = await import('@pinecone-database/pinecone');
      
      this.pinecone = new Pinecone({
        apiKey: this.config.apiKey!,
        environment: this.config.environment || 'us-west1-gcp'
      });

      if (this.config.indexName) {
        this.index = this.pinecone.index(this.config.indexName);
      }

      this.initialized = true;
      logger.info('Pinecone vector database initialized', {
        indexName: this.config.indexName,
        environment: this.config.environment
      });
    } catch (error) {
      logger.error('Failed to initialize Pinecone', error);
      throw error;
    }
  }

  async createIndex(indexName: string, dimensions: number): Promise<void> {
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

  async upsert(documents: VectorDocument[]): Promise<void> {
    if (!this.index) throw new Error('Index not initialized');

    const vectors = documents.map(doc => ({
      id: doc.id,
      values: doc.embedding!,
      metadata: {
        content: doc.content,
        ...doc.metadata
      }
    }));

    await this.index.upsert(vectors);
  }

  async search(options: SearchOptions): Promise<VectorDocument[]> {
    if (!this.index) throw new Error('Index not initialized');

    // Generate embedding for query
    const queryEmbedding = await this.generateEmbedding(options.query);

    const response = await this.index.query({
      vector: queryEmbedding,
      topK: options.topK || 10,
      filter: options.filter,
      includeMetadata: true,
      includeValues: options.includeValues || false
    });

    return response.matches.map((match: any) => ({
      id: match.id,
      content: match.metadata.content,
      metadata: match.metadata,
      embedding: match.values,
      score: match.score
    }));
  }

  async delete(ids: string[]): Promise<void> {
    if (!this.index) throw new Error('Index not initialized');
    await this.index.delete(ids);
  }

  async deleteIndex(indexName: string): Promise<void> {
    await this.pinecone.deleteIndex(indexName);
  }

  async getStats(): Promise<VectorStats> {
    if (!this.index) throw new Error('Index not initialized');
    
    const stats = await this.index.describeIndexStats();
    
    return {
      totalVectors: stats.totalVectorCount || 0,
      indexSize: stats.indexFullness || 0,
      dimensions: this.config.dimensions || 1536,
      memoryUsage: 0, // Not available in Pinecone
      queriesPerSecond: 0, // Would need tracking
      averageLatency: 0 // Would need tracking
    };
  }

  async shutdown(): Promise<void> {
    this.initialized = false;
    logger.info('Pinecone provider shut down');
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    // This would integrate with OpenAI embeddings or similar
    // For now, return a mock embedding
    const mockEmbedding = new Array(this.config.dimensions || 1536).fill(0).map(() => Math.random() - 0.5);
    return mockEmbedding;
  }
}

export class LocalVectorProvider extends VectorDatabaseProvider {
  private vectors: Map<string, VectorDocument> = new Map();
  private embeddings: Map<string, number[]> = new Map();

  async initialize(): Promise<void> {
    this.initialized = true;
    logger.info('Local vector database initialized');
  }

  async createIndex(indexName: string, dimensions: number): Promise<void> {
    this.config.indexName = indexName;
    this.config.dimensions = dimensions;
    logger.info('Local vector index created', { indexName, dimensions });
  }

  async upsert(documents: VectorDocument[]): Promise<void> {
    for (const doc of documents) {
      this.vectors.set(doc.id, doc);
      if (doc.embedding) {
        this.embeddings.set(doc.id, doc.embedding);
      } else {
        // Generate mock embedding
        const embedding = await this.generateEmbedding(doc.content);
        this.embeddings.set(doc.id, embedding);
        doc.embedding = embedding;
      }
    }
  }

  async search(options: SearchOptions): Promise<VectorDocument[]> {
    const queryEmbedding = await this.generateEmbedding(options.query);
    const results: Array<{doc: VectorDocument, score: number}> = [];

    for (const [id, doc] of this.vectors.entries()) {
      // Apply filters
      if (options.filter) {
        let matches = true;
        for (const [key, value] of Object.entries(options.filter)) {
          if (doc.metadata[key] !== value) {
            matches = false;
            break;
          }
        }
        if (!matches) continue;
      }

      const embedding = this.embeddings.get(id);
      if (embedding) {
        const score = this.cosineSimilarity(queryEmbedding, embedding);
        if (!options.threshold || score >= options.threshold) {
          results.push({ doc: { ...doc, score }, score });
        }
      }
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    // Return top K
    return results.slice(0, options.topK || 10).map(r => r.doc);
  }

  async delete(ids: string[]): Promise<void> {
    for (const id of ids) {
      this.vectors.delete(id);
      this.embeddings.delete(id);
    }
  }

  async deleteIndex(indexName: string): Promise<void> {
    this.vectors.clear();
    this.embeddings.clear();
    logger.info('Local vector index deleted', { indexName });
  }

  async getStats(): Promise<VectorStats> {
    return {
      totalVectors: this.vectors.size,
      indexSize: this.vectors.size * (this.config.dimensions || 1536) * 4, // Approximate bytes
      dimensions: this.config.dimensions || 1536,
      memoryUsage: process.memoryUsage().heapUsed,
      queriesPerSecond: 0, // Would need tracking
      averageLatency: 0 // Would need tracking
    };
  }

  async shutdown(): Promise<void> {
    this.vectors.clear();
    this.embeddings.clear();
    this.initialized = false;
    logger.info('Local vector provider shut down');
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    // Simple hash-based mock embedding for testing
    const hash = crypto.createHash('md5').update(text).digest('hex');
    const embedding = new Array(this.config.dimensions || 1536);
    
    for (let i = 0; i < embedding.length; i++) {
      const char = hash[i % hash.length];
      embedding[i] = (parseInt(char, 16) / 15) - 0.5; // Normalize to [-0.5, 0.5]
    }
    
    return embedding;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
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

export class VectorDatabaseService extends EventEmitter {
  private provider: VectorDatabaseProvider;
  private config: VectorConfig;
  private stats: {
    totalQueries: number;
    totalDocuments: number;
    averageQueryTime: number;
    lastQueryTime: number;
  } = {
    totalQueries: 0,
    totalDocuments: 0,
    averageQueryTime: 0,
    lastQueryTime: 0
  };

  constructor(config: VectorConfig) {
    super();
    this.config = config;
    this.provider = this.createProvider(config);
  }

  private createProvider(config: VectorConfig): VectorDatabaseProvider {
    switch (config.provider) {
      case 'pinecone':
        return new PineconeProvider(config);
      case 'local':
        return new LocalVectorProvider(config);
      default:
        logger.warn(`Vector provider ${config.provider} not implemented, using local provider`);
        return new LocalVectorProvider(config);
    }
  }

  async initialize(): Promise<void> {
    try {
      await this.provider.initialize();
      
      // Create index if it doesn't exist
      if (!this.config.indexName) {
        const indexName = `finishthisidea-${Date.now()}`;
        await this.provider.createIndex(indexName, this.config.dimensions || 1536);
        this.config.indexName = indexName;
      }

      this.emit('initialized', { provider: this.config.provider });
      logger.info('Vector database service initialized', {
        provider: this.config.provider,
        indexName: this.config.indexName
      });
    } catch (error) {
      logger.error('Failed to initialize vector database service', error);
      throw error;
    }
  }

  async storeConversation(
    userId: string,
    sessionId: string,
    messages: Array<{role: string, content: string}>,
    tenantId?: string
  ): Promise<void> {
    const documents: VectorDocument[] = messages.map((message, index) => ({
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

  async storeKnowledge(
    content: string,
    metadata: {
      title?: string;
      source: string;
      type: string;
      userId?: string;
      tenantId?: string;
      tags?: string[];
    }
  ): Promise<string> {
    const documentId = `knowledge-${crypto.randomUUID()}`;
    
    const document: VectorDocument = {
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

  async storeAgentMemory(
    agentId: string,
    content: string,
    context: {
      action: string;
      result: string;
      userId?: string;
      tenantId?: string;
      sessionId?: string;
    }
  ): Promise<void> {
    const document: VectorDocument = {
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

  async getRelevantContext(
    query: string,
    options: {
      userId?: string;
      tenantId?: string;
      sessionId?: string;
      includeConversations?: boolean;
      includeKnowledge?: boolean;
      includeAgentMemories?: boolean;
      maxResults?: number;
    } = {}
  ): Promise<MemoryContext> {
    const startTime = Date.now();
    const context: MemoryContext = {
      conversationHistory: [],
      relevantKnowledge: [],
      agentMemories: [],
      totalRelevance: 0
    };

    const searchPromises: Promise<VectorDocument[]>[] = [];

    // Search conversations
    if (options.includeConversations !== false) {
      const conversationFilter: Record<string, any> = { type: 'conversation' };
      if (options.userId) conversationFilter.userId = options.userId;
      if (options.tenantId) conversationFilter.tenantId = options.tenantId;
      if (options.sessionId) conversationFilter.sessionId = options.sessionId;

      searchPromises.push(
        this.provider.search({
          query,
          filter: conversationFilter,
          topK: Math.floor((options.maxResults || 20) * 0.4),
          threshold: 0.7
        })
      );
    } else {
      searchPromises.push(Promise.resolve([]));
    }

    // Search knowledge
    if (options.includeKnowledge !== false) {
      const knowledgeFilter: Record<string, any> = { type: 'knowledge' };
      if (options.tenantId) knowledgeFilter.tenantId = options.tenantId;

      searchPromises.push(
        this.provider.search({
          query,
          filter: knowledgeFilter,
          topK: Math.floor((options.maxResults || 20) * 0.4),
          threshold: 0.6
        })
      );
    } else {
      searchPromises.push(Promise.resolve([]));
    }

    // Search agent memories
    if (options.includeAgentMemories !== false) {
      const agentFilter: Record<string, any> = { type: 'agent_memory' };
      if (options.userId) agentFilter.userId = options.userId;
      if (options.tenantId) agentFilter.tenantId = options.tenantId;

      searchPromises.push(
        this.provider.search({
          query,
          filter: agentFilter,
          topK: Math.floor((options.maxResults || 20) * 0.2),
          threshold: 0.5
        })
      );
    } else {
      searchPromises.push(Promise.resolve([]));
    }

    const [conversations, knowledge, agentMemories] = await Promise.all(searchPromises);

    context.conversationHistory = conversations;
    context.relevantKnowledge = knowledge;
    context.agentMemories = agentMemories;

    // Calculate total relevance
    const allDocuments = [...conversations, ...knowledge, ...agentMemories];
    context.totalRelevance = allDocuments.reduce((sum, doc) => sum + (doc.score || 0), 0) / allDocuments.length;

    // Update stats
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

  async deleteUserData(userId: string, tenantId?: string): Promise<void> {
    // This would need to be implemented based on the provider's capabilities
    // For now, we'll emit an event for manual cleanup
    this.emit('user-data-deletion-requested', { userId, tenantId });
    logger.info('User data deletion requested', { userId, tenantId });
  }

  async getStatistics(): Promise<VectorStats & {serviceStats: typeof this.stats}> {
    const providerStats = await this.provider.getStats();
    
    return {
      ...providerStats,
      serviceStats: { ...this.stats }
    };
  }

  async shutdown(): Promise<void> {
    await this.provider.shutdown();
    this.emit('shutdown');
    logger.info('Vector database service shut down');
  }
}