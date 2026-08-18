import { Request, Response, NextFunction } from 'express';

/**
 * Global async error-handling middleware.
 * Any unhandled errors thrown by controllers land here.
 */
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction): void {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[ERROR] ${statusCode} — ${message}`, err.stack || '');

  res.status(statusCode).json({
    success: false,
    error: message,
  });
}

/**
 * Wraps an async route handler so thrown errors are forwarded to Express error middleware.
 */
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
