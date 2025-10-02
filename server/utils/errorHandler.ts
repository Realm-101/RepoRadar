import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class ValidationError extends Error {
  statusCode = 400;
  isOperational = true;

  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  statusCode = 404;
  isOperational = true;

  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error {
  statusCode = 401;
  isOperational = true;

  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class RateLimitError extends Error {
  statusCode = 429;
  isOperational = true;

  constructor(message: string = 'Too many requests') {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class ServiceUnavailableError extends Error {
  statusCode = 503;
  isOperational = true;

  constructor(message: string = 'Service temporarily unavailable') {
    super(message);
    this.name = 'ServiceUnavailableError';
  }
}

export function createErrorHandler() {
  return (err: AppError, req: Request, res: Response, next: NextFunction) => {
    // Log error details
    console.error('Error occurred:', {
      name: err.name,
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    const statusCode = err.statusCode || 500;
    const message = err.isOperational || isDevelopment 
      ? err.message 
      : 'Internal server error';

    // Send error response
    res.status(statusCode).json({
      error: {
        message,
        ...(isDevelopment && {
          stack: err.stack,
          name: err.name,
        }),
      },
    });
  };
}

export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function validateRequired(fields: Record<string, any>, requiredFields: string[]) {
  const missing = requiredFields.filter(field => !fields[field]);
  if (missing.length > 0) {
    throw new ValidationError(`Missing required fields: ${missing.join(', ')}`);
  }
}

export function handleDatabaseError(error: any): AppError {
  // Handle common database errors
  if (error.code === '23505') { // Unique constraint violation
    return new ValidationError('Resource already exists');
  }
  
  if (error.code === '23503') { // Foreign key constraint violation
    return new ValidationError('Referenced resource does not exist');
  }
  
  if (error.code === '23502') { // Not null constraint violation
    return new ValidationError('Required field is missing');
  }

  // Default to internal server error
  const dbError = new Error('Database operation failed') as AppError;
  dbError.statusCode = 500;
  dbError.isOperational = false;
  return dbError;
}

export function handleExternalServiceError(serviceName: string, error: any): AppError {
  console.error(`${serviceName} service error:`, error);
  
  if (error.response?.status === 404) {
    return new NotFoundError(`Resource not found in ${serviceName}`);
  }
  
  if (error.response?.status === 401 || error.response?.status === 403) {
    return new ServiceUnavailableError(`${serviceName} authentication failed`);
  }
  
  if (error.response?.status === 429) {
    return new RateLimitError(`${serviceName} rate limit exceeded`);
  }

  return new ServiceUnavailableError(`${serviceName} is temporarily unavailable`);
}