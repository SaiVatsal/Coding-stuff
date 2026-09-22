import type { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * Global error handler middleware.
 * Returns friendly JSON error messages and logs unexpected errors.
 */
export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational
    ? err.message
    : 'An unexpected error occurred. Please try again.';

  if (!err.isOperational) {
    console.error('[Unhandled Error]', err);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
  });
}

/**
 * Creates an operational error with a status code.
 */
export function createError(message: string, statusCode: number = 400): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
}
