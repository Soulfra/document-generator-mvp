import { Request, Response, NextFunction } from 'express';

// More flexible AsyncHandler type that allows various return types
export type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void | Response | any>;

export const asyncHandler = (fn: AsyncHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Export the type for use in other files
export { AsyncHandler as AsyncHandlerType };