import { EventEmitter } from 'events';
export interface DashboardConfig {
    serviceUrl?: string;
    autoStart?: boolean;
    soulfraPath?: string;
    port?: number;
    enableExports?: boolean;
    enableRealTime?: boolean;
}
export interface DashboardMetrics {
    revenue: {
        totalRevenue: number;
        monthlyRecurringRevenue: number;
        averageRevenuePerUser: number;
        revenueGrowth: number;
        customerLifetimeValue: number;
    };
    users: {
        totalUsers: number;
        activeUsers: number;
        newUsers: number;
        churnRate: number;
        engagementScore: number;
    };
    performance: {
        timeSavings: number;
        productivityGain: number;
        automationRate: number;
        errorReduction: number;
        roiScore: number;
    };
    platform: {
        uptime: number;
        responseTime: number;
        throughput: number;
        errorRate: number;
        resourceUtilization: number;
    };
    business: {
        customerSatisfaction: number;
        supportTickets: number;
        featureUsage: Record<string, number>;
        conversionRate: number;
        marketShare: number;
    };
}
export interface DepartmentView {
    department: 'executive' | 'hr' | 'it' | 'finance' | 'operations' | 'sales' | 'marketing';
    metrics: Record<string, any>;
    kpis: Array<{
        name: string;
        value: number;
        target: number;
        trend: 'up' | 'down' | 'stable';
        status: 'good' | 'warning' | 'critical';
    }>;
    alerts: Array<{
        id: string;
        type: 'info' | 'warning' | 'error' | 'critical';
        message: string;
        timestamp: Date;
        actionRequired?: string;
    }>;
    insights: Array<{
        type: 'trend' | 'anomaly' | 'opportunity' | 'recommendation';
        title: string;
        description: string;
        impact: 'low' | 'medium' | 'high';
        actionable: boolean;
        suggestedActions?: string[];
    }>;
}
export interface IndustryDashboard {
    industry: 'healthcare' | 'fintech' | 'education' | 'gaming' | 'ecommerce' | 'manufacturing' | 'government';
    metrics: DashboardMetrics;
    industrySpecific: Record<string, any>;
    benchmarks: Record<string, number>;
    compliance: {
        frameworks: string[];
        scores: Record<string, number>;
        auditStatus: string;
    };
}
export interface RealtimeData {
    timestamp: Date;
    activeUsers: number;
    systemLoad: number;
    transactionsPerSecond: number;
    revenue: number;
    alerts: number;
    events: Array<{
        type: string;
        description: string;
        timestamp: Date;
        severity?: 'low' | 'medium' | 'high';
    }>;
}
export interface DashboardExport {
    type: 'pdf' | 'powerpoint' | 'excel' | 'csv';
    title: string;
    timeRange: {
        start: Date;
        end: Date;
    };
    sections: string[];
    includeCharts: boolean;
    includeData: boolean;
    customBranding?: {
        logo: string;
        colors: string[];
        companyName: string;
    };
}
export interface PredictiveAnalytics {
    category: 'revenue' | 'users' | 'performance' | 'market';
    predictions: Array<{
        metric: string;
        currentValue: number;
        predictedValue: number;
        confidence: number;
        timeframe: string;
        factors: string[];
    }>;
    scenarios: Array<{
        name: string;
        description: string;
        impact: Record<string, number>;
        probability: number;
    }>;
    recommendations: Array<{
        action: string;
        expectedImpact: string;
        priority: 'low' | 'medium' | 'high';
        timeline: string;
    }>;
}
export interface CustomWidget {
    id: string;
    name: string;
    type: 'chart' | 'metric' | 'table' | 'gauge' | 'map' | 'timeline';
    config: {
        dataSource: string;
        visualization: Record<string, any>;
        filters: Record<string, any>;
        refreshInterval: number;
    };
    permissions: {
        viewRoles: string[];
        editRoles: string[];
    };
}
export declare class EnterpriseDashboardIntegration extends EventEmitter {
    private config;
    private apiClient?;
    private dashboardProcess?;
    private initialized;
    private currentPort?;
    private realtimeConnection?;
    constructor(config?: DashboardConfig);
    initialize(): Promise<void>;
    private startDashboardService;
    private waitForDashboardService;
    private checkDashboardService;
    private setupApiClient;
    private setupRealtimeConnection;
    getDashboardMetrics(timeRange?: {
        start: Date;
        end: Date;
    }): Promise<DashboardMetrics>;
    getDepartmentView(department: DepartmentView['department'], tenantId?: string): Promise<DepartmentView>;
    getIndustryDashboard(industry: IndustryDashboard['industry'], tenantId?: string): Promise<IndustryDashboard>;
    getRealtimeData(): Promise<RealtimeData>;
    getPredictiveAnalytics(category: PredictiveAnalytics['category'], timeframe?: string): Promise<PredictiveAnalytics>;
    generateInsights(dataPoints: string[], timeRange?: {
        start: Date;
        end: Date;
    }): Promise<Array<{
        type: 'trend' | 'anomaly' | 'opportunity' | 'recommendation';
        title: string;
        description: string;
        confidence: number;
        impact: 'low' | 'medium' | 'high';
        actionable: boolean;
    }>>;
    runBusinessIntelligence(query: {
        metrics: string[];
        filters: Record<string, any>;
        groupBy?: string[];
        timeRange?: {
            start: Date;
            end: Date;
        };
    }): Promise<{
        data: Array<Record<string, any>>;
        summary: Record<string, number>;
        insights: string[];
    }>;
    createCustomWidget(widget: Omit<CustomWidget, 'id'>): Promise<CustomWidget>;
    updateCustomWidget(widgetId: string, updates: Partial<CustomWidget>): Promise<CustomWidget>;
    getCustomWidgets(userId?: string): Promise<CustomWidget[]>;
    deleteCustomWidget(widgetId: string): Promise<void>;
    exportDashboard(exportConfig: DashboardExport): Promise<{
        exportId: string;
        downloadUrl: string;
        expiresAt: Date;
    }>;
    getExportStatus(exportId: string): Promise<{
        status: 'pending' | 'processing' | 'completed' | 'failed';
        progress: number;
        downloadUrl?: string;
        error?: string;
    }>;
    scheduleReport(schedule: {
        name: string;
        dashboard: string;
        format: 'pdf' | 'excel';
        frequency: 'daily' | 'weekly' | 'monthly';
        recipients: string[];
        timeRange: 'last7days' | 'last30days' | 'lastQuarter';
    }): Promise<{
        scheduleId: string;
        nextRun: Date;
    }>;
    createAlert(alert: {
        name: string;
        metric: string;
        condition: 'above' | 'below' | 'equals';
        threshold: number;
        recipients: string[];
        channels: ('email' | 'slack' | 'webhook')[];
    }): Promise<{
        alertId: string;
        status: 'active' | 'inactive';
    }>;
    getActiveAlerts(): Promise<Array<{
        id: string;
        name: string;
        metric: string;
        currentValue: number;
        threshold: number;
        status: 'triggered' | 'resolved';
        triggeredAt: Date;
    }>>;
    getSystemPerformance(): Promise<{
        uptime: number;
        responseTime: number;
        throughput: number;
        errorRate: number;
        resourceUsage: {
            cpu: number;
            memory: number;
            storage: number;
            network: number;
        };
        bottlenecks: Array<{
            component: string;
            severity: 'low' | 'medium' | 'high';
            description: string;
            recommendation: string;
        }>;
    }>;
    getBusinessMetrics(department?: string): Promise<{
        revenue: Record<string, number>;
        customers: Record<string, number>;
        operations: Record<string, number>;
        satisfaction: Record<string, number>;
    }>;
    checkHealth(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        version: string;
        uptime: number;
        features: string[];
        realtime: boolean;
        exports: boolean;
    }>;
    shutdown(): Promise<void>;
    isInitialized(): boolean;
    hasRealtimeConnection(): boolean;
    getConfig(): DashboardConfig;
}
export declare const enterpriseDashboard: EnterpriseDashboardIntegration;
//# sourceMappingURL=enterprise-dashboard.integration.d.ts.map