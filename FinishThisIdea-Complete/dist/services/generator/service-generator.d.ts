interface ServiceConfig {
    name: string;
    displayName: string;
    description: string;
    type: 'api' | 'worker' | 'analyzer' | 'generator';
    pricing: {
        tier: 'basic' | 'standard' | 'premium';
        price: number;
        currency: string;
    };
    features: string[];
    dependencies?: string[];
    envVars?: Record<string, string>;
    routes?: RouteConfig[];
    workers?: WorkerConfig[];
}
interface RouteConfig {
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    path: string;
    handler: string;
    middleware?: string[];
    rateLimit?: number;
}
interface WorkerConfig {
    name: string;
    schedule?: string;
    concurrency?: number;
    handler: string;
}
export declare class ServiceGenerator {
    private templatesDir;
    private outputDir;
    private templates;
    constructor();
    private loadTemplates;
    private registerHelpers;
    generateService(config: ServiceConfig): Promise<{
        success: boolean;
        servicePath: string;
        dockerImage?: string;
        apiEndpoints?: string[];
    }>;
    private generateMainService;
    private generateControllers;
    private generateRoutes;
    private generateWorkers;
    private generateTypes;
    private generatePackageJson;
    private generateDockerFiles;
    private generateDocumentation;
    private generateTests;
    private generateEnvironmentFile;
    private initializeGit;
    private installDependencies;
    private buildDockerImage;
    private generatePort;
    private extractApiEndpoints;
    getAvailableTemplates(): Promise<{
        name: string;
        description: string;
        price: number;
        features: string[];
    }[]>;
}
export {};
//# sourceMappingURL=service-generator.d.ts.map