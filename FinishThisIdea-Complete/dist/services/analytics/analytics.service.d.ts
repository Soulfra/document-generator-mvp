export interface AnalyticsEvent {
    userId?: string;
    sessionId?: string;
    event: string;
    properties?: Record<string, any>;
    timestamp?: Date;
    ip?: string;
    userAgent?: string;
}
export interface UserProfile {
    userId: string;
    email?: string;
    name?: string;
    tier?: string;
    registrationDate?: Date;
    lastActive?: Date;
    totalJobs?: number;
    totalCreditsUsed?: number;
    properties?: Record<string, any>;
}
export interface SessionData {
    sessionId: string;
    userId?: string;
    startTime: Date;
    endTime?: Date;
    duration?: number;
    pageViews: number;
    events: AnalyticsEvent[];
    deviceInfo?: {
        userAgent: string;
        ip: string;
        country?: string;
        browser?: string;
        os?: string;
    };
}
export declare class AnalyticsService {
    private mixpanelClient?;
    private segmentClient?;
    private posthogClient?;
    private redisService;
    private isEnabled;
    constructor();
    private initialize;
    track(event: AnalyticsEvent): Promise<void>;
    identify(profile: UserProfile): Promise<void>;
    startSession(sessionData: Partial<SessionData>): Promise<string>;
    endSession(sessionId: string): Promise<void>;
    getSession(sessionId: string): Promise<SessionData | null>;
    trackPageView(userId: string, sessionId: string, page: string, properties?: Record<string, any>): Promise<void>;
    trackJobCreated(userId: string, jobData: any): Promise<void>;
    trackJobCompleted(userId: string, jobData: any): Promise<void>;
    trackFileUploaded(userId: string, uploadData: any): Promise<void>;
    trackCreditsPurchased(userId: string, purchaseData: any): Promise<void>;
    trackUserRegistered(userId: string, registrationData: any): Promise<void>;
    trackFeatureUsed(userId: string, feature: string, properties?: Record<string, any>): Promise<void>;
    getRealtimeStats(): Promise<any>;
    private enrichEvent;
    private storeEventInRedis;
    private getActiveUsersCount;
    private getActiveSessionsCount;
    private getRecentEvents;
    private getTopEvents;
    shutdown(): Promise<void>;
}
export declare const analyticsService: AnalyticsService;
//# sourceMappingURL=analytics.service.d.ts.map