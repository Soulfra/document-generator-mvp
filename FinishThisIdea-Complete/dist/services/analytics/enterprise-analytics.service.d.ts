import { EventEmitter } from 'events';
interface AnalyticsMetrics {
    system: {
        uptime: number;
        throughput: number;
        errorRate: number;
        responseTime: number;
        concurrentUsers: number;
        systemLoad: number;
    };
    business: {
        totalRevenue: number;
        monthlyGrowth: number;
        churnRate: number;
        ltv: number;
        conversionRate: number;
        activeSubscriptions: number;
    };
    product: {
        projectsProcessed: number;
        codeAnalyzed: number;
        implementationsCompleted: number;
        avgImplementationTime: number;
        userSatisfaction: number;
        featureAdoption: number;
        supportTickets: number;
    };
    github: {
        reposAnalyzed: number;
        issuesResolved: number;
        pullRequestsMerged: number;
        bountyPayouts: number;
        avgResolutionTime: number;
        contributorCount: number;
    };
    ai: {
        totalQueries: number;
        avgResponseTime: number;
        modelUsage: Record<string, number>;
        tokenConsumption: number;
        errorRate: number;
        userSatisfaction: number;
    };
}
export declare class EnterpriseAnalyticsService extends EventEmitter {
    private port;
    private server;
    private prisma;
    private metricsService;
    private metrics;
    private revenues;
    private users;
    private githubMetrics;
    private bounties;
    private dataStreams;
    private updateInterval;
    private industries;
    constructor();
    start(): Promise<void>;
    private initializeMetrics;
    private startDataCollection;
    private updateMetrics;
    private startWebDashboard;
    private serveDashboard;
    private generateDashboardHTML;
    private serveMetrics;
    getMetrics(): AnalyticsMetrics;
    private handleExport;
    private exportToPDF;
    private exportToCSV;
    private serveIndustryMetrics;
    private serveRealTimeData;
    private startRealTimeUpdates;
    private getActiveAlerts;
    private fetchSystemMetrics;
    private fetchBusinessMetrics;
    private fetchProductMetrics;
    private fetchAIMetrics;
    private parseRequestBody;
    stop(): Promise<void>;
    generateExecutiveSummary(): Promise<string>;
}
export {};
//# sourceMappingURL=enterprise-analytics.service.d.ts.map