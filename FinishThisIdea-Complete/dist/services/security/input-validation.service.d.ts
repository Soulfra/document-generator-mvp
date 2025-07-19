import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
export interface ValidationConfig {
    enableXSSProtection: boolean;
    enableSQLInjectionDetection: boolean;
    enableFilePathTraversal: boolean;
    enableNoScriptTags: boolean;
    maxStringLength: number;
    allowedTags: string[];
    allowedAttributes: string[];
}
export declare class InputValidationService {
    private static instance;
    private config;
    private sqlInjectionPatterns;
    private pathTraversalPatterns;
    private xssPatterns;
    constructor(config?: Partial<ValidationConfig>);
    static getInstance(config?: Partial<ValidationConfig>): InputValidationService;
    sanitizeHTML(input: string): string;
    detectSQLInjection(input: string): boolean;
    detectPathTraversal(input: string): boolean;
    detectXSS(input: string): boolean;
    validateInput(input: any, type?: 'string' | 'number' | 'email' | 'url' | 'html'): {
        isValid: boolean;
        sanitized: any;
        threats: string[];
    };
    middleware(options?: {
        validateBody?: boolean;
        validateQuery?: boolean;
        validateParams?: boolean;
        allowedFields?: string[];
        requiredFields?: string[];
    }): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    private validateObject;
    createSecureSchema(schema: Joi.ObjectSchema): Joi.ObjectSchema;
}
export declare const inputValidationService: InputValidationService;
//# sourceMappingURL=input-validation.service.d.ts.map