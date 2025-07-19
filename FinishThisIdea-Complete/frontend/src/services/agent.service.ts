import axios from 'axios';
import { authService } from './auth.service';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export interface CreateAgentRequest {
  name: string;
  description: string;
  sourceCode: string;
  price?: number;
  agentCard: {
    category: string;
    tags: string[];
    inputTypes: string[];
    outputTypes: string[];
  };
  manifest?: {
    version: string;
    runtime: string;
    entryPoint: string;
    dependencies?: Record<string, string>;
  };
  remixedFromId?: string;
}

export interface AgentResponse {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  price: number;
  sourceCode: string;
  agentCard: any;
  manifest: any;
  downloads: number;
  rating: number | null;
  remixedFromId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentExecution {
  id: string;
  agentId: string;
  userId: string;
  input: any;
  output: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
  startedAt: string;
  completedAt?: string;
  duration?: number;
}

class AgentService {
  private getHeaders() {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async createAgent(data: CreateAgentRequest): Promise<AgentResponse> {
    try {
      const response = await axios.post(`${API_URL}/api/marketplace/agents`, data, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error creating agent:', error);
      throw error;
    }
  }

  async updateAgent(agentId: string, data: Partial<CreateAgentRequest>): Promise<AgentResponse> {
    try {
      const response = await axios.put(`${API_URL}/api/marketplace/agents/${agentId}`, data, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error updating agent:', error);
      throw error;
    }
  }

  async deleteAgent(agentId: string): Promise<{ success: boolean }> {
    try {
      const response = await axios.delete(`${API_URL}/api/marketplace/agents/${agentId}`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting agent:', error);
      throw error;
    }
  }

  async testAgent(agentId: string, testInput: any): Promise<{
    success: boolean;
    output: any;
    executionTime: number;
    error?: string;
  }> {
    try {
      const response = await axios.post(
        `${API_URL}/api/marketplace/agents/${agentId}/test`,
        { input: testInput },
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error testing agent:', error);
      throw error;
    }
  }

  async getAgentExecutions(agentId: string): Promise<AgentExecution[]> {
    try {
      const response = await axios.get(`${API_URL}/api/marketplace/agents/${agentId}/executions`, {
        headers: this.getHeaders(),
      });
      return response.data.executions;
    } catch (error) {
      console.error('Error getting agent executions:', error);
      throw error;
    }
  }

  async getAgentStats(agentId: string): Promise<{
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
    lastExecuted?: string;
    revenue: number;
    uniqueUsers: number;
  }> {
    try {
      const response = await axios.get(`${API_URL}/api/marketplace/agents/${agentId}/stats`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error getting agent stats:', error);
      throw error;
    }
  }

  async validateAgentCode(code: string): Promise<{
    valid: boolean;
    errors?: string[];
    warnings?: string[];
  }> {
    try {
      const response = await axios.post(
        `${API_URL}/api/marketplace/validate-code`,
        { code },
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error validating agent code:', error);
      throw error;
    }
  }

  async forkAgent(agentId: string, modifications?: {
    name?: string;
    description?: string;
    sourceCode?: string;
  }): Promise<AgentResponse> {
    try {
      const response = await axios.post(
        `${API_URL}/api/marketplace/agents/${agentId}/fork`,
        modifications || {},
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error forking agent:', error);
      throw error;
    }
  }

  async getAgentVersionHistory(agentId: string): Promise<{
    versions: Array<{
      id: string;
      version: string;
      changes: string;
      createdAt: string;
    }>;
  }> {
    try {
      const response = await axios.get(`${API_URL}/api/marketplace/agents/${agentId}/versions`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error getting agent version history:', error);
      throw error;
    }
  }

  async publishAgent(agentId: string, publishSettings: {
    visibility: 'public' | 'private' | 'unlisted';
    description?: string;
    tags?: string[];
  }): Promise<{ success: boolean }> {
    try {
      const response = await axios.post(
        `${API_URL}/api/marketplace/agents/${agentId}/publish`,
        publishSettings,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error publishing agent:', error);
      throw error;
    }
  }
}

export const agentService = new AgentService();