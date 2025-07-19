import { Request, Response, NextFunction } from 'express';
export type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void | Response | any>;
export declare const asyncHandler: (fn: AsyncHandler) => (req: Request, res: Response, next: NextFunction) => void;
export { AsyncHandler as AsyncHandlerType };
//# sourceMappingURL=async-handler.d.ts.map