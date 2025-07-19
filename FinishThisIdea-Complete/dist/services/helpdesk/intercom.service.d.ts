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
export declare class IntercomService {
    private static instance;
    private client;
    private accessToken;
    private enabled;
    constructor();
    static getInstance(): IntercomService;
    private initializeClient;
    createOrUpdateUser(userData: IntercomUser): Promise<IntercomUser | null>;
    createTicket(ticketData: SupportTicket): Promise<string | null>;
    updateTicket(ticketId: string, update: {
        status?: SupportTicket['status'];
        priority?: SupportTicket['priority'];
        note?: string;
        tags?: string[];
    }): Promise<boolean>;
    getTicket(ticketId: string): Promise<any | null>;
    getUserTickets(email: string): Promise<any[]>;
    addNote(ticketId: string, note: string, isPublic?: boolean): Promise<boolean>;
    getWidgetSettings(): any;
    private storeUserLocally;
    private createLocalTicket;
    private updateLocalTicket;
    private getLocalTicket;
    private getUserTicketsLocal;
    private addLocalNote;
    testConnection(): Promise<boolean>;
    getStatus(): {
        enabled: boolean;
        configured: boolean;
        connected?: boolean;
    };
}
export declare const intercomService: IntercomService;
//# sourceMappingURL=intercom.service.d.ts.map