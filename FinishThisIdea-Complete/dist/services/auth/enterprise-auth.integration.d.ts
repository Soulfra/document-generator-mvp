import { EventEmitter } from 'events';
export interface AuthConfig {
    authServiceUrl?: string;
    autoStart?: boolean;
    soulfraPath?: string;
    port?: number;
    jwtSecret?: string;
    encryptionKey?: string;
    complianceMode?: 'standard' | 'soc2' | 'hipaa' | 'gdpr';
}
export interface User {
    id: string;
    email: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    organization?: string;
    team?: string;
    roles: string[];
    permissions: string[];
    mfaEnabled: boolean;
    lastLogin?: Date;
    status: 'active' | 'inactive' | 'suspended' | 'pending';
    metadata?: Record<string, any>;
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: 'Bearer';
    scope?: string[];
}
export interface LoginRequest {
    email: string;
    password: string;
    mfaCode?: string;
    rememberMe?: boolean;
    organizationDomain?: string;
}
export interface SSORequest {
    provider: 'google' | 'github' | 'azure' | 'saml';
    assertion?: string;
    code?: string;
    state?: string;
    organizationDomain?: string;
}
export interface MFASetupRequest {
    userId: string;
    method: 'sms' | 'authenticator' | 'email';
    phoneNumber?: string;
    email?: string;
}
export interface OrganizationConfig {
    id: string;
    name: string;
    domain: string;
    ssoEnabled: boolean;
    ssoProvider?: string;
    mfaRequired: boolean;
    passwordPolicy: {
        minLength: number;
        requireUppercase: boolean;
        requireLowercase: boolean;
        requireNumbers: boolean;
        requireSpecialChars: boolean;
        maxAge?: number;
    };
    sessionTimeout: number;
    complianceFramework: string[];
}
export interface AuditLog {
    id: string;
    userId: string;
    action: string;
    resource: string;
    timestamp: Date;
    ipAddress: string;
    userAgent: string;
    result: 'success' | 'failure';
    details?: Record<string, any>;
}
export interface SecurityMetrics {
    activeUsers: number;
    failedLogins: number;
    successfulLogins: number;
    mfaAdoption: number;
    ssoUsage: number;
    complianceScore: number;
    threatDetections: number;
    lastAudit: Date;
}
export declare class EnterpriseAuthIntegration extends EventEmitter {
    private config;
    private apiClient?;
    private authProcess?;
    private initialized;
    private currentPort?;
    constructor(config?: AuthConfig);
    initialize(): Promise<void>;
    private startAuthService;
    private waitForAuthService;
    private checkAuthService;
    private setupApiClient;
    login(request: LoginRequest): Promise<{
        user: User;
        tokens: AuthTokens;
    }>;
    logout(token: string): Promise<void>;
    refreshToken(refreshToken: string): Promise<AuthTokens>;
    verifyToken(token: string): Promise<User>;
    initiateSSO(provider: string, organizationDomain?: string): Promise<{
        redirectUrl: string;
        state: string;
    }>;
    processSSOCallback(request: SSORequest): Promise<{
        user: User;
        tokens: AuthTokens;
    }>;
    setupMFA(request: MFASetupRequest): Promise<{
        secret?: string;
        qrCode?: string;
        backupCodes: string[];
    }>;
    verifyMFA(userId: string, code: string): Promise<boolean>;
    disableMFA(userId: string, confirmationCode: string): Promise<void>;
    createOrganization(config: Partial<OrganizationConfig>): Promise<OrganizationConfig>;
    updateOrganization(id: string, config: Partial<OrganizationConfig>): Promise<OrganizationConfig>;
    getOrganization(id: string): Promise<OrganizationConfig>;
    createUser(userData: Partial<User>): Promise<User>;
    updateUser(id: string, userData: Partial<User>): Promise<User>;
    getUser(id: string): Promise<User>;
    listUsers(organizationId?: string, teamId?: string): Promise<User[]>;
    getAuditLogs(options?: {
        userId?: string;
        action?: string;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
    }): Promise<AuditLog[]>;
    getSecurityMetrics(organizationId?: string): Promise<SecurityMetrics>;
    runComplianceCheck(framework: string): Promise<{
        framework: string;
        score: number;
        findings: Array<{
            control: string;
            status: 'compliant' | 'non-compliant' | 'not-applicable';
            details: string;
        }>;
        lastCheck: Date;
    }>;
    checkHealth(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        version: string;
        uptime: number;
        features: string[];
    }>;
    shutdown(): Promise<void>;
    isInitialized(): boolean;
    getConfig(): AuthConfig;
}
export declare const enterpriseAuth: EnterpriseAuthIntegration;
//# sourceMappingURL=enterprise-auth.integration.d.ts.map