/**
 * SOULFRA-MEMORY Integration Service
 * 
 * Bridges our platform with the existing SOULFRA-MEMORY system
 * Adds enterprise features: multi-tenancy, vector embeddings, advanced search
 */

import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';
import axios, { AxiosInstance } from 'axios';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';

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

export class SoulframMemoryIntegration extends EventEmitter {
  private config: SoulframMemoryConfig;
  private apiClient: AxiosInstance;
  private memoryProcess?: ChildProcess;
  private initialized: boolean = false;

  constructor(config: SoulframMemoryConfig = {}) {
    super();
    
    this.config = {
      apiUrl: config.apiUrl || 'http://localhost:8000',
      autoStart: config.autoStart !== false,
      pythonPath: config.pythonPath || 'python3',
      soulfraPath: config.soulfraPath || '/Users/matthewmauer/Desktop/Soulfra-AgentZero/Founder-Bootstrap/Blank-Kernel/SOULFRA-CONSOLIDATED-2025/SOULFRA-MEMORY',
      port: config.port || 8000,
      ...config
    };

    this.apiClient = axios.create({
      baseURL: this.config.apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FinishThisIdea-Platform/1.0'
      }
    });

    // Add request/response interceptors for logging
    this.apiClient.interceptors.request.use(
      (config) => {
        logger.debug('SOULFRA-MEMORY API request', { 
          method: config.method, 
          url: config.url,
          data: config.data ? JSON.stringify(config.data).substring(0, 200) : undefined
        });
        return config;
      },
      (error) => {
        logger.error('SOULFRA-MEMORY API request error', error);
        return Promise.reject(error);
      }
    );

    this.apiClient.interceptors.response.use(
      (response) => {
        logger.debug('SOULFRA-MEMORY API response', { 
          status: response.status,
          url: response.config.url 
        });
        return response;
      },
      (error) => {
        logger.error('SOULFRA-MEMORY API error', {
          status: error.response?.status,
          url: error.config?.url,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }

  async initialize(): Promise<void> {
    try {
      // Try to connect to existing API
      await this.checkHealth();
      logger.info('Connected to existing SOULFRA-MEMORY instance');
      
    } catch (error) {
      if (this.config.autoStart) {
        logger.info('SOULFRA-MEMORY not running, starting new instance...');
        await this.startMemoryService();
        
        // Wait for service to be ready
        await this.waitForService();
      } else {
        throw new Error('SOULFRA-MEMORY service not available and autoStart is disabled');
      }
    }

    this.initialized = true;
    this.emit('initialized');
    logger.info('SOULFRA-MEMORY integration initialized', {
      apiUrl: this.config.apiUrl,
      autoStarted: !!this.memoryProcess
    });
  }

  private async startMemoryService(): Promise<void> {
    if (!this.config.soulfraPath) {
      throw new Error('SOULFRA path not configured');
    }

    const mainPyPath = path.join(this.config.soulfraPath, 'api', 'main.py');
    
    this.memoryProcess = spawn(this.config.pythonPath!, [mainPyPath], {
      cwd: this.config.soulfraPath,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        PYTHONPATH: this.config.soulfraPath,
        PORT: this.config.port!.toString()
      }
    });

    this.memoryProcess.stdout?.on('data', (data) => {
      const output = data.toString();
      logger.debug('SOULFRA-MEMORY stdout:', output);
      
      if (output.includes('Memory API initialized')) {
        this.emit('service-ready');
      }
    });

    this.memoryProcess.stderr?.on('data', (data) => {
      const error = data.toString();
      logger.warn('SOULFRA-MEMORY stderr:', error);
    });

    this.memoryProcess.on('exit', (code) => {
      logger.info('SOULFRA-MEMORY process exited', { code });
      this.memoryProcess = undefined;
      this.emit('service-stopped', { code });
    });

    this.memoryProcess.on('error', (error) => {
      logger.error('SOULFRA-MEMORY process error', error);
      this.emit('service-error', error);
    });
  }

  private async waitForService(): Promise<void> {
    const maxWait = 30000; // 30 seconds
    const interval = 1000; // 1 second
    let waited = 0;

    while (waited < maxWait) {
      try {
        await this.checkHealth();
        return;
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, interval));
        waited += interval;
      }
    }

    throw new Error('SOULFRA-MEMORY service failed to start within timeout');
  }

  async checkHealth(): Promise<boolean> {
    const response = await this.apiClient.get('/');
    return response.data.name === 'SOULFRA Memory API';
  }

  // Core Memory Operations

  async storeMemory(memory: Memory): Promise<MemoryResponse> {
    // Add enterprise metadata
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

  async getMemory(id: number): Promise<MemoryResponse> {
    const response = await this.apiClient.get(`/memories/${id}`);
    return response.data;
  }

  async searchMemories(options: SearchOptions = {}): Promise<MemoryResponse[]> {
    // Build query parameters
    const params: any = {};
    
    if (options.collection) params.collection = options.collection;
    if (options.type) params.type = options.type;
    if (options.search) params.search = options.search;
    if (options.limit) params.limit = options.limit;
    if (options.offset) params.offset = options.offset;

    const response = await this.apiClient.get('/memories', { params });
    let memories: MemoryResponse[] = response.data;

    // Apply enterprise filters (userId, tenantId)
    if (options.userId || options.tenantId) {
      memories = memories.filter(memory => {
        if (options.userId && memory.metadata?.userId !== options.userId) return false;
        if (options.tenantId && memory.metadata?.tenantId !== options.tenantId) return false;
        return true;
      });
    }

    return memories;
  }

  async updateMemory(id: number, memory: Memory): Promise<MemoryResponse> {
    const response = await this.apiClient.put(`/memories/${id}`, memory);
    
    this.emit('memory-updated', {
      id,
      type: memory.type,
      userId: memory.metadata?.userId,
      tenantId: memory.metadata?.tenantId
    });

    return response.data;
  }

  async deleteMemory(id: number): Promise<void> {
    await this.apiClient.delete(`/memories/${id}`);
    this.emit('memory-deleted', { id });
  }

  // Enterprise Features

  async storeConversation(
    userId: string,
    sessionId: string,
    messages: Array<{role: string, content: string}>,
    tenantId?: string
  ): Promise<MemoryResponse[]> {
    const memories: MemoryResponse[] = [];

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
  ): Promise<MemoryResponse> {
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
  ): Promise<MemoryResponse> {
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
    const context: MemoryContext = {
      conversationHistory: [],
      relevantKnowledge: [],
      agentMemories: [],
      totalRelevance: 0
    };

    const searchPromises: Promise<MemoryResponse[]>[] = [];

    // Search conversations
    if (options.includeConversations !== false) {
      searchPromises.push(
        this.searchMemories({
          type: 'conversation',
          search: query,
          userId: options.userId,
          tenantId: options.tenantId,
          limit: Math.floor((options.maxResults || 20) * 0.4)
        })
      );
    } else {
      searchPromises.push(Promise.resolve([]));
    }

    // Search knowledge
    if (options.includeKnowledge !== false) {
      searchPromises.push(
        this.searchMemories({
          type: 'knowledge',
          search: query,
          tenantId: options.tenantId,
          limit: Math.floor((options.maxResults || 20) * 0.4)
        })
      );
    } else {
      searchPromises.push(Promise.resolve([]));
    }

    // Search agent memories
    if (options.includeAgentMemories !== false) {
      searchPromises.push(
        this.searchMemories({
          type: 'agent_memory',
          search: query,
          userId: options.userId,
          tenantId: options.tenantId,
          limit: Math.floor((options.maxResults || 20) * 0.2)
        })
      );
    } else {
      searchPromises.push(Promise.resolve([]));
    }

    const [conversations, knowledge, agentMemories] = await Promise.all(searchPromises);

    context.conversationHistory = conversations;
    context.relevantKnowledge = knowledge;
    context.agentMemories = agentMemories;

    // Calculate relevance (simplified scoring)
    const allMemories = [...conversations, ...knowledge, ...agentMemories];
    if (allMemories.length > 0) {
      context.totalRelevance = allMemories.reduce((sum, memory) => {
        // Simple relevance based on content match and importance
        const contentMatch = memory.content.toLowerCase().includes(query.toLowerCase()) ? 1 : 0.5;
        const importance = memory.metadata?.importance || 0.5;
        return sum + (contentMatch * importance);
      }, 0) / allMemories.length;
    }

    // Get personality analysis for the query
    try {
      context.personality_summary = await this.analyzePersonality(query);
    } catch (error) {
      logger.warn('Failed to get personality analysis', error);
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

  // Utility Methods

  async getCollections(): Promise<Collection[]> {
    const response = await this.apiClient.get('/collections');
    return response.data;
  }

  async analyzePersonality(text: string): Promise<PersonalityAnalysis> {
    const response = await this.apiClient.post('/analyze', { text });
    return response.data;
  }

  async getUserMemoryStats(userId: string, tenantId?: string): Promise<{
    totalMemories: number;
    conversationCount: number;
    knowledgeCount: number;
    agentMemoryCount: number;
    collections: Collection[];
    averageSentiment: number;
    dominantMood: string;
  }> {
    // Get all user memories
    const memories = await this.searchMemories({
      userId,
      tenantId,
      limit: 1000 // Get a large sample
    });

    const stats = {
      totalMemories: memories.length,
      conversationCount: memories.filter(m => m.type === 'conversation').length,
      knowledgeCount: memories.filter(m => m.type === 'knowledge').length,
      agentMemoryCount: memories.filter(m => m.type === 'agent_memory').length,
      collections: [] as Collection[],
      averageSentiment: 0,
      dominantMood: 'neutral'
    };

    // Calculate sentiment and mood
    if (memories.length > 0) {
      const memoriesWithInsights = memories.filter(m => m.personality_insights);
      
      if (memoriesWithInsights.length > 0) {
        stats.averageSentiment = memoriesWithInsights.reduce(
          (sum, m) => sum + (m.personality_insights?.sentiment_score || 0.5), 0
        ) / memoriesWithInsights.length;

        // Find dominant mood
        const moodCounts: Record<string, number> = {};
        memoriesWithInsights.forEach(m => {
          const mood = m.personality_insights?.mood || 'neutral';
          moodCounts[mood] = (moodCounts[mood] || 0) + 1;
        });
        
        stats.dominantMood = Object.entries(moodCounts)
          .sort(([,a], [,b]) => b - a)[0]?.[0] || 'neutral';
      }
    }

    // Get collection stats
    const allCollections = await this.getCollections();
    stats.collections = allCollections;

    return stats;
  }

  async deleteUserData(userId: string, tenantId?: string): Promise<void> {
    // Get all user memories
    const memories = await this.searchMemories({
      userId,
      tenantId,
      limit: 10000 // Get all
    });

    // Delete in batches
    const batchSize = 50;
    for (let i = 0; i < memories.length; i += batchSize) {
      const batch = memories.slice(i, i + batchSize);
      await Promise.all(batch.map(memory => this.deleteMemory(memory.id)));
    }

    this.emit('user-data-deleted', { userId, tenantId, deletedCount: memories.length });
    logger.info('User data deleted from SOULFRA-MEMORY', { 
      userId, 
      tenantId, 
      deletedCount: memories.length 
    });
  }

  async shutdown(): Promise<void> {
    if (this.memoryProcess) {
      this.memoryProcess.kill('SIGTERM');
      
      // Wait for graceful shutdown
      await new Promise<void>((resolve) => {
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
    logger.info('SOULFRA-MEMORY integration shut down');
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getConfig(): SoulframMemoryConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const soulframMemory = new SoulframMemoryIntegration({
  autoStart: true,
  soulfraPath: process.env.SOULFRA_PATH || '/Users/matthewmauer/Desktop/Soulfra-AgentZero/Founder-Bootstrap/Blank-Kernel/SOULFRA-CONSOLIDATED-2025/SOULFRA-MEMORY'
});