import { Request, Response, NextFunction } from 'express';
export interface CompressionOptions {
    level?: number;
    threshold?: number;
    filter?: (req: Request, res: Response) => boolean;
    chunkSize?: number;
    windowBits?: number;
    memLevel?: number;
}
export declare function smartCompression(options?: CompressionOptions): import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare function adaptiveCompression(): (req: Request, res: Response, next: NextFunction) => void;
export declare function monitoredCompression(options?: CompressionOptions): (req: Request, res: Response, next: NextFunction) => void;
export declare function brotliCompression(): (req: Request, res: Response, next: NextFunction) => void;
export declare function responseSizeOptimizer(): (req: Request, res: Response, next: NextFunction) => void;
export declare function contentTypeCompression(): (req: Request, res: Response, next: NextFunction) => void;
export declare const defaultCompression: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const apiCompression: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const staticCompression: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
//# sourceMappingURL=compression.middleware.d.ts.map