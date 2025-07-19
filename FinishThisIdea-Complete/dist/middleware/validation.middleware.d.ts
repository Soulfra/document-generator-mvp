import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
interface ValidationOptions {
    body?: Joi.ObjectSchema;
    query?: Joi.ObjectSchema;
    params?: Joi.ObjectSchema;
    headers?: Joi.ObjectSchema;
    sanitize?: boolean;
    stripUnknown?: boolean;
    allowUnknown?: boolean;
}
export declare const commonSchemas: {
    uuid: Joi.StringSchema<string>;
    email: Joi.StringSchema<string>;
    password: Joi.StringSchema<string>;
    url: Joi.StringSchema<string>;
    filename: Joi.StringSchema<string>;
    positiveInteger: Joi.NumberSchema<number>;
    nonNegativeInteger: Joi.NumberSchema<number>;
    percentage: Joi.NumberSchema<number>;
    shortText: Joi.StringSchema<string>;
    mediumText: Joi.StringSchema<string>;
    longText: Joi.StringSchema<string>;
    platformTokens: Joi.NumberSchema<number>;
    trustTier: Joi.StringSchema<string>;
    jobStatus: Joi.StringSchema<string>;
    paymentStatus: Joi.StringSchema<string>;
    fileUpload: Joi.ObjectSchema<any>;
    pagination: Joi.ObjectSchema<any>;
    dateRange: Joi.ObjectSchema<any>;
};
export declare const sanitizers: {
    sanitizeHTML: (input: string) => string;
    sanitizeSQL: (input: string) => string;
    sanitizeXSS: (input: string) => string;
    trim: (input: string) => string;
    toLowerCase: (input: string) => string;
    sanitizeFilePath: (input: string) => string;
    sanitizeSearch: (input: string) => string;
};
export declare function validate(options: ValidationOptions): (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const validationSchemas: {
    login: {
        body: Joi.ObjectSchema<any>;
    };
    register: {
        body: Joi.ObjectSchema<any>;
    };
    createJob: {
        body: Joi.ObjectSchema<any>;
    };
    getJobs: {
        query: Joi.ObjectSchema<any>;
    };
    createPayment: {
        body: Joi.ObjectSchema<any>;
    };
    uploadFile: {
        body: Joi.ObjectSchema<any>;
    };
    createProfile: {
        body: Joi.ObjectSchema<any>;
    };
    updateUser: {
        body: Joi.ObjectSchema<any>;
    };
    createShowcase: {
        body: Joi.ObjectSchema<any>;
    };
    createAgent: {
        body: Joi.ObjectSchema<any>;
    };
    uuidParam: {
        params: Joi.ObjectSchema<any>;
    };
    slugParam: {
        params: Joi.ObjectSchema<any>;
    };
};
export declare const validators: {
    validateUUID: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    validateSlug: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    validatePagination: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    validateLogin: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    validateRegister: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    validateCreateJob: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    validateGetJobs: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    validateCreatePayment: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    validateUploadFile: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    validateUpdateUser: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    validateCreateShowcase: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    validateCreateAgent: (req: Request, res: Response, next: NextFunction) => Promise<void>;
};
export declare function securityValidation(): (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export default validate;
//# sourceMappingURL=validation.middleware.d.ts.map