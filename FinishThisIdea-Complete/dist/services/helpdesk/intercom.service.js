"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.intercomService = exports.IntercomService = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../../utils/logger");
const redis_1 = __importDefault(require("../../config/redis"));
class IntercomService {
    static instance;
    client = null;
    accessToken = null;
    enabled = false;
    constructor() {
        this.accessToken = process.env.INTERCOM_ACCESS_TOKEN || null;
        this.enabled = !!this.accessToken;
        if (this.enabled) {
            this.initializeClient();
        }
    }
    static getInstance() {
        if (!IntercomService.instance) {
            IntercomService.instance = new IntercomService();
        }
        return IntercomService.instance;
    }
    initializeClient() {
        this.client = axios_1.default.create({
            baseURL: 'https://api.intercom.io',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });
        this.client.interceptors.request.use((config) => {
            logger_1.logger.debug('Intercom API request', {
                method: config.method,
                url: config.url,
                data: config.data
            });
            return config;
        }, (error) => {
            logger_1.logger.error('Intercom API request error', error);
            return Promise.reject(error);
        });
        this.client.interceptors.response.use((response) => {
            logger_1.logger.debug('Intercom API response', {
                status: response.status,
                data: response.data
            });
            return response;
        }, (error) => {
            logger_1.logger.error('Intercom API response error', {
                status: error.response?.status,
                data: error.response?.data
            });
            return Promise.reject(error);
        });
    }
    async createOrUpdateUser(userData) {
        if (!this.enabled || !this.client) {
            logger_1.logger.warn('Intercom not enabled, storing user locally');
            return this.storeUserLocally(userData);
        }
        try {
            const response = await this.client.post('/users', userData);
            if (userData.email) {
                await redis_1.default.setex(`intercom:user:${userData.email}`, 3600, JSON.stringify(response.data));
            }
            logger_1.logger.info('User created/updated in Intercom', {
                userId: response.data.id,
                email: userData.email
            });
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('Failed to create/update Intercom user', error);
            return this.storeUserLocally(userData);
        }
    }
    async createTicket(ticketData) {
        if (!this.enabled || !this.client) {
            return this.createLocalTicket(ticketData);
        }
        try {
            await this.createOrUpdateUser({
                email: ticketData.email,
                user_id: ticketData.userId
            });
            const conversationData = {
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
            await redis_1.default.setex(`intercom:ticket:${conversationId}`, 86400 * 7, JSON.stringify(ticketData));
            logger_1.logger.info('Support ticket created in Intercom', {
                conversationId,
                subject: ticketData.subject,
                priority: ticketData.priority
            });
            return conversationId;
        }
        catch (error) {
            logger_1.logger.error('Failed to create Intercom conversation', error);
            return this.createLocalTicket(ticketData);
        }
    }
    async updateTicket(ticketId, update) {
        if (!this.enabled || !this.client) {
            return this.updateLocalTicket(ticketId, update);
        }
        try {
            if (update.note) {
                await this.client.post(`/conversations/${ticketId}/reply`, {
                    type: 'admin',
                    message_type: 'note',
                    body: update.note
                });
            }
            if (update.status || update.priority || update.tags) {
                const updateData = {};
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
            logger_1.logger.info('Ticket updated in Intercom', { ticketId, update });
            return true;
        }
        catch (error) {
            logger_1.logger.error('Failed to update Intercom conversation', error);
            return this.updateLocalTicket(ticketId, update);
        }
    }
    async getTicket(ticketId) {
        if (!this.enabled || !this.client) {
            return this.getLocalTicket(ticketId);
        }
        try {
            const response = await this.client.get(`/conversations/${ticketId}`);
            return response.data;
        }
        catch (error) {
            logger_1.logger.error('Failed to get Intercom conversation', error);
            return this.getLocalTicket(ticketId);
        }
    }
    async getUserTickets(email) {
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
        }
        catch (error) {
            logger_1.logger.error('Failed to get user conversations from Intercom', error);
            return this.getUserTicketsLocal(email);
        }
    }
    async addNote(ticketId, note, isPublic = false) {
        if (!this.enabled || !this.client) {
            return this.addLocalNote(ticketId, note);
        }
        try {
            await this.client.post(`/conversations/${ticketId}/reply`, {
                type: 'admin',
                message_type: isPublic ? 'comment' : 'note',
                body: note
            });
            logger_1.logger.info('Note added to Intercom conversation', { ticketId });
            return true;
        }
        catch (error) {
            logger_1.logger.error('Failed to add note to Intercom conversation', error);
            return this.addLocalNote(ticketId, note);
        }
    }
    getWidgetSettings() {
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
    async storeUserLocally(userData) {
        const userId = userData.user_id || userData.email || Date.now().toString();
        const user = {
            id: userId,
            ...userData,
            created_at: Date.now()
        };
        await redis_1.default.setex(`helpdesk:user:${userId}`, 86400, JSON.stringify(user));
        return user;
    }
    async createLocalTicket(ticketData) {
        const ticketId = `local-${Date.now()}`;
        const ticket = {
            ...ticketData,
            id: ticketId,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        await redis_1.default.setex(`helpdesk:ticket:${ticketId}`, 86400 * 7, JSON.stringify(ticket));
        await redis_1.default.sadd(`helpdesk:user:${ticketData.email}:tickets`, ticketId);
        logger_1.logger.info('Local support ticket created', { ticketId, subject: ticketData.subject });
        return ticketId;
    }
    async updateLocalTicket(ticketId, update) {
        try {
            const ticketData = await redis_1.default.get(`helpdesk:ticket:${ticketId}`);
            if (!ticketData)
                return false;
            const ticket = JSON.parse(ticketData);
            Object.assign(ticket, update, { updatedAt: new Date() });
            await redis_1.default.setex(`helpdesk:ticket:${ticketId}`, 86400 * 7, JSON.stringify(ticket));
            return true;
        }
        catch (error) {
            logger_1.logger.error('Failed to update local ticket', error);
            return false;
        }
    }
    async getLocalTicket(ticketId) {
        try {
            const ticketData = await redis_1.default.get(`helpdesk:ticket:${ticketId}`);
            return ticketData ? JSON.parse(ticketData) : null;
        }
        catch (error) {
            logger_1.logger.error('Failed to get local ticket', error);
            return null;
        }
    }
    async getUserTicketsLocal(email) {
        try {
            const ticketIds = await redis_1.default.smembers(`helpdesk:user:${email}:tickets`);
            const tickets = [];
            for (const ticketId of ticketIds) {
                const ticket = await this.getLocalTicket(ticketId);
                if (ticket)
                    tickets.push(ticket);
            }
            return tickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        catch (error) {
            logger_1.logger.error('Failed to get user tickets locally', error);
            return [];
        }
    }
    async addLocalNote(ticketId, note) {
        try {
            const noteData = {
                id: `note-${Date.now()}`,
                ticketId,
                note,
                createdAt: new Date(),
                author: 'system'
            };
            await redis_1.default.lpush(`helpdesk:ticket:${ticketId}:notes`, JSON.stringify(noteData));
            return true;
        }
        catch (error) {
            logger_1.logger.error('Failed to add local note', error);
            return false;
        }
    }
    async testConnection() {
        if (!this.enabled || !this.client) {
            logger_1.logger.warn('Intercom not configured');
            return false;
        }
        try {
            await this.client.get('/me');
            logger_1.logger.info('Intercom connection test successful');
            return true;
        }
        catch (error) {
            logger_1.logger.error('Intercom connection test failed', error);
            return false;
        }
    }
    getStatus() {
        return {
            enabled: this.enabled,
            configured: !!this.accessToken,
        };
    }
}
exports.IntercomService = IntercomService;
exports.intercomService = IntercomService.getInstance();
//# sourceMappingURL=intercom.service.js.map