import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: Request) => string; // Function to generate rate limit key
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export function createRateLimit(options: RateLimitOptions) {
  const {
    windowMs,
    maxRequests,
    keyGenerator = (req) => req.ip || 'unknown',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean up old entries
    Object.keys(store).forEach(storeKey => {
      if (store[storeKey].resetTime < windowStart) {
        delete store[storeKey];
      }
    });

    // Initialize or get current count
    if (!store[key] || store[key].resetTime < windowStart) {
      store[key] = {
        count: 0,
        resetTime: now + windowMs,
      };
    }

    // Check if limit exceeded
    if (store[key].count >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((store[key].resetTime - now) / 1000),
      });
    }

    // Increment counter
    store[key].count++;

    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': maxRequests.toString(),
      'X-RateLimit-Remaining': Math.max(0, maxRequests - store[key].count).toString(),
      'X-RateLimit-Reset': new Date(store[key].resetTime).toISOString(),
    });

    // Handle response to potentially skip counting
    const originalSend = res.send;
    res.send = function(body) {
      const statusCode = res.statusCode;
      
      // Decrement counter if we should skip this request
      if (
        (skipSuccessfulRequests && statusCode >= 200 && statusCode < 300) ||
        (skipFailedRequests && statusCode >= 400)
      ) {
        store[key].count--;
      }
      
      return originalSend.call(this, body);
    };

    next();
  };
}

// Predefined rate limiters
export const analysisRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10, // 10 analyses per 15 minutes for unauthenticated users
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise IP
    const user = (req as any).user;
    return user?.claims?.sub || req.ip || 'unknown';
  },
});

export const searchRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // 30 searches per minute
});

export const generalApiRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 requests per minute
});