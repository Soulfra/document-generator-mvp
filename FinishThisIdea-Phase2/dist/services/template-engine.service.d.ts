export interface ServiceTemplate {
    name: string;
    version: string;
    description: string;
    author: string;
    category: string;
    service: {
        type: string;
        pricing: {
            model: 'fixed' | 'usage' | 'subscription';
            base: number;
            usage?: {
                metric: string;
                rate: number;
            };
            subscription?: {
                monthly: number;
                annual: number;
            };
        };
        sla: {
            processingTime: number;
            accuracy: number;
            uptime: number;
        };
    };
    infrastructure: any;
    ai: any;
    deployment: any;
    monitoring: any;
    security: any;
    testing: any;
    documentation: any;
}
export interface ServiceGenerationConfig {
    templateName: string;
    serviceName: string;
    description: string;
    author: string;
    category: string;
    pricing: {
        model: 'fixed' | 'usage' | 'subscription';
        basePrice: number;
    };
    features: string[];
    ai: {
        useOllama: boolean;
        useOpenAI: boolean;
        useAnthropic: boolean;
        models: string[];
    };
    deployment: {
        platform: 'railway' | 'vercel' | 'docker';
        autoScaling: boolean;
    };
}
export declare class TemplateEngine {
    private templateDir;
    private outputDir;
    constructor(templateDir?: string, outputDir?: string);
    generateService(config: ServiceGenerationConfig): Promise<{
        servicePath: string;
        generatedFiles: string[];
    }>;
    private loadTemplate;
    private processTemplate;
    private generateServiceStructure;
    private generateServiceFiles;
    private generatePackageJson;
    private generateTsConfig;
    private generatePrismaSchema;
    private generateEnvExample;
    private generateServerCode;
    private generateServiceCode;
    private generateRouteCode;
    private generateJobCode;
    private generateDockerCompose;
    private generateReadme;
    private registerHelpers;
}
//# sourceMappingURL=template-engine.service.d.ts.map