/**
 * Intercom Help Desk Integration Service
 * Customer support and ticketing system integration
 */

import axios, { AxiosInstance } from 'axios';
import { logger } from '../../utils/logger';
import redis from '../../config/redis';

export interface IntercomUser {
  id?: string;
  user_id?: string;
  email?: string;
  name?: string;
  phone?: string;
  created_at?: number;
  custom_attributes?: Record<string, any>;
  tags?: string[];
  companies?: any[];
}

export interface IntercomConversation {
  id?: string;
  type: 'user' | 'admin';
  admin_assignee_id?: string;
  assignee?: any;
  conversation_message?: {
    type: 'comment' | 'note';
    body: string;
    message_type: 'email' | 'chat';
  };
  custom_attributes?: Record<string, any>;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface SupportTicket {
  id?: string;
  userId: string;
  email: string;
  subject: string;
  description: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: string;
  status: 'open' | 'pending' | 'resolved' | 'closed';
  attachments?: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt?: Date;
}

export class IntercomService {
  private static instance: IntercomService;
  private client: AxiosInstance | null = null;
  private accessToken: string | null = null;
  private enabled: boolean = false;

  constructor() {
    this.accessToken = process.env.INTERCOM_ACCESS_TOKEN || null;
    this.enabled = !!this.accessToken;
    
    if (this.enabled) {
      this.initializeClient();
    }
  }

  public static getInstance(): IntercomService {
    if (!IntercomService.instance) {
      IntercomService.instance = new IntercomService();
    }
    return IntercomService.instance;
  }

  /**
   * Initialize Intercom API client
   */
  private initializeClient(): void {
    this.client = axios.create({
      baseURL: 'https://api.intercom.io',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    // Add request/response interceptors for logging
    this.client.interceptors.request.use(
      (config) => {
        logger.debug('Intercom API request', {
          method: config.method,
          url: config.url,
          data: config.data
        });
        return config;
      },
      (error) => {
        logger.error('Intercom API request error', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        logger.debug('Intercom API response', {
          status: response.status,
          data: response.data
        });
        return response;
      },
      (error) => {
        logger.error('Intercom API response error', {
          status: error.response?.status,
          data: error.response?.data
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Create or update user in Intercom
   */
  public async createOrUpdateUser(userData: IntercomUser): Promise<IntercomUser | null> {
    if (!this.enabled || !this.client) {
      logger.warn('Intercom not enabled, storing user locally');
      return this.storeUserLocally(userData);
    }

    try {
      const response = await this.client.post('/users', userData);
      
      // Cache user data
      if (userData.email) {
        await redis.setex(
          `intercom:user:${userData.email}`,
          3600,
          JSON.stringify(response.data)
        );
      }

      logger.info('User created/updated in Intercom', {
        userId: response.data.id,
        email: userData.email
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to create/update Intercom user', error);
      return this.storeUserLocally(userData);
    }
  }

  /**
   * Create support ticket
   */
  public async createTicket(ticketData: SupportTicket): Promise<string | null> {
    if (!this.enabled || !this.client) {
      return this.createLocalTicket(ticketData);
    }

    try {
      // First ensure user exists
      await this.createOrUpdateUser({
        email: ticketData.email,
        user_id: ticketData.userId
      });

      // Create conversation
      const conversationData: IntercomConversation = {
        type: 'user',
        conversation_message: {
          type: 'comment',
          body: `Subject: ${ticketData.subject}\n\n${ticketData.description}`,
          message_type: 'email'
        },
        custom_attributes: {
          priority: ticketData.priority,
          category: ticketData.category,
          ...ticketData.metadata
        },
        tags: [ticketData.category, ticketData.priority]
      };

      const response = await this.client.post('/conversations', conversationData);
      
      const conversationId = response.data.id;
      
      // Store ticket mapping
      await redis.setex(
        `intercom:ticket:${conversationId}`,
        86400 * 7, // 7 days
        JSON.stringify(ticketData)
      );

      logger.info('Support ticket created in Intercom', {
        conversationId,
        subject: ticketData.subject,
        priority: ticketData.priority
      });

      return conversationId;
    } catch (error) {
      logger.error('Failed to create Intercom conversation', error);
      return this.createLocalTicket(ticketData);
    }
  }

  /**
   * Update ticket
   */
  public async updateTicket(
    ticketId: string,
    update: {
      status?: SupportTicket['status'];
      priority?: SupportTicket['priority'];
      note?: string;
      tags?: string[];
    }
  ): Promise<boolean> {
    if (!this.enabled || !this.client) {
      return this.updateLocalTicket(ticketId, update);
    }

    try {
      // Add note to conversation if provided
      if (update.note) {
        await this.client.post(`/conversations/${ticketId}/reply`, {
          type: 'admin',
          message_type: 'note',
          body: update.note
        });
      }

      // Update conversation attributes
      if (update.status || update.priority || update.tags) {
        const updateData: any = {};
        
        if (update.status) {
          updateData.state = update.status === 'closed' ? 'closed' : 'open';
        }
        
        if (update.priority) {
          updateData.custom_attributes = { priority: update.priority };
        }
        
        if (update.tags) {
          updateData.tags = { add: update.tags };
        }

        await this.client.put(`/conversations/${ticketId}`, updateData);
      }

      logger.info('Ticket updated in Intercom', { ticketId, update });
      return true;
    } catch (error) {
      logger.error('Failed to update Intercom conversation', error);
      return this.updateLocalTicket(ticketId, update);
    }
  }

  /**
   * Get ticket by ID
   */
  public async getTicket(ticketId: string): Promise<any | null> {
    if (!this.enabled || !this.client) {
      return this.getLocalTicket(ticketId);
    }

    try {
      const response = await this.client.get(`/conversations/${ticketId}`);
      return response.data;
    } catch (error) {
      logger.error('Failed to get Intercom conversation', error);
      return this.getLocalTicket(ticketId);
    }
  }

  /**
   * Search tickets by user
   */
  public async getUserTickets(email: string): Promise<any[]> {
    if (!this.enabled || !this.client) {
      return this.getUserTicketsLocal(email);
    }

    try {
      const response = await this.client.get('/conversations', {
        params: {
          type: 'user',
          intercom_user_id: email
        }
      });

      return response.data.conversations || [];
    } catch (error) {
      logger.error('Failed to get user conversations from Intercom', error);
      return this.getUserTicketsLocal(email);
    }
  }

  /**
   * Add note to ticket
   */
  public async addNote(ticketId: string, note: string, isPublic: boolean = false): Promise<boolean> {
    if (!this.enabled || !this.client) {
      return this.addLocalNote(ticketId, note);
    }

    try {
      await this.client.post(`/conversations/${ticketId}/reply`, {
        type: 'admin',
        message_type: isPublic ? 'comment' : 'note',
        body: note
      });

      logger.info('Note added to Intercom conversation', { ticketId });
      return true;
    } catch (error) {
      logger.error('Failed to add note to Intercom conversation', error);
      return this.addLocalNote(ticketId, note);
    }
  }

  /**
   * Get Intercom widget settings for frontend
   */
  public getWidgetSettings(): any {
    if (!this.enabled) {
      return null;
    }

    return {
      app_id: process.env.INTERCOM_APP_ID,
      enabled: true,
      widget: {
        activator: '#intercom-launcher',
        alignment: 'right',
        horizontal_padding: 20,
        vertical_padding: 20
      }
    };
  }

  // Fallback methods for local storage when Intercom is not available

  private async storeUserLocally(userData: IntercomUser): Promise<IntercomUser> {
    const userId = userData.user_id || userData.email || Date.now().toString();
    const user = {
      id: userId,
      ...userData,
      created_at: Date.now()
    };

    await redis.setex(
      `helpdesk:user:${userId}`,
      86400,
      JSON.stringify(user)
    );

    return user;
  }

  private async createLocalTicket(ticketData: SupportTicket): Promise<string> {
    const ticketId = `local-${Date.now()}`;
    const ticket = {
      ...ticketData,
      id: ticketId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await redis.setex(
      `helpdesk:ticket:${ticketId}`,
      86400 * 7,
      JSON.stringify(ticket)
    );

    // Add to user's tickets
    await redis.sadd(`helpdesk:user:${ticketData.email}:tickets`, ticketId);

    logger.info('Local support ticket created', { ticketId, subject: ticketData.subject });
    return ticketId;
  }

  private async updateLocalTicket(
    ticketId: string,
    update: any
  ): Promise<boolean> {
    try {
      const ticketData = await redis.get(`helpdesk:ticket:${ticketId}`);
      if (!ticketData) return false;

      const ticket = JSON.parse(ticketData);
      Object.assign(ticket, update, { updatedAt: new Date() });

      await redis.setex(
        `helpdesk:ticket:${ticketId}`,
        86400 * 7,
        JSON.stringify(ticket)
      );

      return true;
    } catch (error) {
      logger.error('Failed to update local ticket', error);
      return false;
    }
  }

  private async getLocalTicket(ticketId: string): Promise<any | null> {
    try {
      const ticketData = await redis.get(`helpdesk:ticket:${ticketId}`);
      return ticketData ? JSON.parse(ticketData) : null;
    } catch (error) {
      logger.error('Failed to get local ticket', error);
      return null;
    }
  }

  private async getUserTicketsLocal(email: string): Promise<any[]> {
    try {
      const ticketIds = await redis.smembers(`helpdesk:user:${email}:tickets`);
      const tickets = [];

      for (const ticketId of ticketIds) {
        const ticket = await this.getLocalTicket(ticketId);
        if (ticket) tickets.push(ticket);
      }

      return tickets.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      logger.error('Failed to get user tickets locally', error);
      return [];
    }
  }

  private async addLocalNote(ticketId: string, note: string): Promise<boolean> {
    try {
      const noteData = {
        id: `note-${Date.now()}`,
        ticketId,
        note,
        createdAt: new Date(),
        author: 'system'
      };

      await redis.lpush(
        `helpdesk:ticket:${ticketId}:notes`,
        JSON.stringify(noteData)
      );

      return true;
    } catch (error) {
      logger.error('Failed to add local note', error);
      return false;
    }
  }

  /**
   * Test Intercom connection
   */
  public async testConnection(): Promise<boolean> {
    if (!this.enabled || !this.client) {
      logger.warn('Intercom not configured');
      return false;
    }

    try {
      await this.client.get('/me');
      logger.info('Intercom connection test successful');
      return true;
    } catch (error) {
      logger.error('Intercom connection test failed', error);
      return false;
    }
  }

  /**
   * Get service status
   */
  public getStatus(): {
    enabled: boolean;
    configured: boolean;
    connected?: boolean;
  } {
    return {
      enabled: this.enabled,
      configured: !!this.accessToken,
    };
  }
}

// Export singleton instance
export const intercomService = IntercomService.getInstance();