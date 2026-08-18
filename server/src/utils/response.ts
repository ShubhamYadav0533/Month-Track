import { Response } from 'express';

/**
 * Send a consistent success response.
 */
export function sendSuccess(res: Response, data: Record<string, any> = {}, statusCode = 200): void {
  res.status(statusCode).json({ success: true, ...data });
}

/**
 * Send a consistent error response.
 */
export function sendError(res: Response, message: string, statusCode = 500): void {
  res.status(statusCode).json({ success: false, error: message });
}
