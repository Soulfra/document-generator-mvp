import axios from 'axios';
import { authService } from './auth.service';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export interface Agent {
  id: string;
  name: string;
  description: string;
  price: number;
  downloads: number;
  rating: number | null;
  creatorId: string;
  creator?: {
    id: string;
    email?: string;
    displayName?: string;
  };
  agentCard: {
    category: string;
    tags: string[];
    inputTypes: string[];
    outputTypes: string[];
  };
  remixedFromId?: string;
  createdAt: string;
}

export interface AgentPurchase {
  id: string;
  agentId: string;
  userId: string;
  purchasedAt: string;
  price: number;
}

export interface MarketplaceStatus {
  total_revenue: number;
  active_agents: number;
  leagues_running: number;
  gigs_posted: number;
  total_customers: number;
  agent_exports: number;
  platform_forks: number;
}

class MarketplaceService {
  private getHeaders() {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async browseAgents(params?: {
    category?: string;
    search?: string;
    sort?: string;
    page?: number;
    limit?: number;
  }): Promise<Agent[]> {
    try {
      const response = await axios.get(`${API_URL}/api/marketplace/agents`, {
        params,
        headers: this.getHeaders(),
      });
      return response.data.agents;
    } catch (error) {
      console.error('Error browsing agents:', error);
      throw error;
    }
  }

  async getAgent(agentId: string): Promise<Agent> {
    try {
      const response = await axios.get(`${API_URL}/api/marketplace/agents/${agentId}`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error getting agent:', error);
      throw error;
    }
  }

  async purchaseAgent(agentId: string): Promise<{ success: boolean; purchase: AgentPurchase }> {
    try {
      const response = await axios.post(
        `${API_URL}/api/marketplace/agents/${agentId}/purchase`,
        {},
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error purchasing agent:', error);
      throw error;
    }
  }

  async getUserPurchases(): Promise<AgentPurchase[]> {
    try {
      const response = await axios.get(`${API_URL}/api/marketplace/purchases`, {
        headers: this.getHeaders(),
      });
      return response.data.purchases;
    } catch (error) {
      console.error('Error getting user purchases:', error);
      throw error;
    }
  }

  async getUserAgents(): Promise<Agent[]> {
    try {
      const response = await axios.get(`${API_URL}/api/marketplace/my-agents`, {
        headers: this.getHeaders(),
      });
      return response.data.agents;
    } catch (error) {
      console.error('Error getting user agents:', error);
      throw error;
    }
  }

  async getMarketplaceStatus(): Promise<MarketplaceStatus> {
    try {
      const response = await axios.get(`${API_URL}/api/marketplace/status`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error getting marketplace status:', error);
      throw error;
    }
  }

  async rateAgent(agentId: string, rating: number): Promise<{ success: boolean }> {
    try {
      const response = await axios.post(
        `${API_URL}/api/marketplace/agents/${agentId}/rate`,
        { rating },
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error rating agent:', error);
      throw error;
    }
  }

  async exportAgent(agentId: string, exportType: string): Promise<{
    success: boolean;
    export_id: string;
    download_url: string;
    vibe_spent: number;
    expires_in: string;
  }> {
    try {
      const response = await axios.post(
        `${API_URL}/api/marketplace/agents/${agentId}/export`,
        { exportType },
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error exporting agent:', error);
      throw error;
    }
  }

  async downloadAgentExport(agentId: string, exportType: string): Promise<Blob> {
    try {
      const response = await axios.get(
        `${API_URL}/api/marketplace/download/${agentId}/${exportType}`,
        {
          headers: this.getHeaders(),
          responseType: 'blob',
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error downloading agent export:', error);
      throw error;
    }
  }

  async remixAgent(agentId: string): Promise<Agent> {
    try {
      const response = await axios.post(
        `${API_URL}/api/marketplace/agents/${agentId}/remix`,
        {},
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error remixing agent:', error);
      throw error;
    }
  }

  async executeAgent(agentId: string, input: any): Promise<any> {
    try {
      const response = await axios.post(
        `${API_URL}/api/marketplace/agents/${agentId}/execute`,
        { input },
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error executing agent:', error);
      throw error;
    }
  }

  async getVibeBalance(): Promise<{ balance: number; soulbound_tokens: number }> {
    try {
      const response = await axios.get(`${API_URL}/api/marketplace/vibe/balance`, {
        headers: this.getHeaders(),
      });
      return response.data;
    } catch (error) {
      console.error('Error getting VIBE balance:', error);
      throw error;
    }
  }

  async purchaseVibe(amount: number): Promise<{
    success: boolean;
    vibe_purchased: number;
    usd_spent: number;
    balance: number;
  }> {
    try {
      const response = await axios.post(
        `${API_URL}/api/marketplace/vibe/purchase`,
        { amount },
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error) {
      console.error('Error purchasing VIBE:', error);
      throw error;
    }
  }
}

export const marketplaceService = new MarketplaceService();