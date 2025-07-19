import { Request, Response, NextFunction } from 'express';
import { trustTierService, TrustTier } from '../services/trust/trust-tier.service';
interface TrustTierOptions {
    feature?: keyof ReturnType<typeof trustTierService.getTierFeatures>;
    minTier?: TrustTier;
    checkValue?: (req: Request) => any;
}
export declare function trustTierCheck(options?: TrustTierOptions): (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare function trustTierRateLimit(): (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare function trustTierFileValidation(): (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
declare global {
    namespace Express {
        interface Request {
            trustTier?: TrustTier;
            trustFeatures?: ReturnType<typeof trustTierService.getTierFeatures>;
            trustMetrics?: Awaited<ReturnType<typeof trustTierService.getUserTrustMetrics>>;
        }
    }
}
export {};
//# sourceMappingURL=trust-tier.middleware.d.ts.map