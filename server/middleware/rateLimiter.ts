import { Request, Response, NextFunction } from 'express';

// Rate limit storage interface
export interface RateLimitStorage {
  increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }>;
  get(key: string): Promise<{ count: number; resetTime: number } | null>;
  reset(key: string): Promise<void>;
  cleanup(): Promise<void>;
}

// Subscription tiers for rate limiting
export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

// Rate limit configuration by tier
export interface TierLimits {
  free: { limit: number; window: number };
  pro: { limit: number; window: number };
  enterprise: { limit: number; window: number };
}

export interface RateLimitOptions {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: Request) => string; // Function to generate rate limit key
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  storage?: RateLimitStorage; // Custom storage backend
  tierLimits?: TierLimits; // Tier-based limits
  message?: string; // Custom error message
}

// Helper to get user tier from request
function getUserTier(req: Request): SubscriptionTier {
  const user = (req as any).user;
  return user?.subscriptionTier || 'free';
}

// Helper to get tier-specific limits
function getTierLimit(tierLimits: TierLimits | undefined, tier: SubscriptionTier): { limit: number; window: number } | null {
  if (!tierLimits) return null;
  return tierLimits[tier];
}

export function createRateLimit(options: RateLimitOptions) {
  const {
    windowMs,
    maxRequests,
    keyGenerator = (req) => req.ip || 'unknown',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    storage,
    tierLimits,
    message = 'Too many requests, please try again later',
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = keyGenerator(req);
      const now = Date.now();

      // Determine limits based on tier if configured
      let effectiveLimit = maxRequests;
      let effectiveWindow = windowMs;
      
      if (tierLimits) {
        const tier = getUserTier(req);
        const tierLimit = getTierLimit(tierLimits, tier);
        
        if (tierLimit) {
          effectiveLimit = tierLimit.limit;
          effectiveWindow = tierLimit.window;
          
          // Enterprise tier gets unlimited access
          if (tier === 'enterprise' && tierLimit.limit === -1) {
            return next();
          }
        }
      }

      // Use storage backend if provided, otherwise use in-memory
      let limitData: { count: number; resetTime: number };
      
      if (storage) {
        limitData = await storage.increment(key, effectiveWindow);
      } else {
        // Fallback to in-memory storage (legacy behavior)
        const windowStart = now - effectiveWindow;
        
        if (!store[key] || store[key].resetTime < windowStart) {
          store[key] = {
            count: 1,
            resetTime: now + effectiveWindow,
          };
        } else {
          store[key].count++;
        }
        
        limitData = store[key];
      }

      // Check if limit exceeded
      if (limitData.count > effectiveLimit) {
        const retryAfter = Math.ceil((limitData.resetTime - now) / 1000);
        const exceedBy = limitData.count - effectiveLimit;
        
        // Log rate limit violation for security monitoring
        const violation: RateLimitViolation = {
          key,
          limit: effectiveLimit,
          count: limitData.count,
          exceedBy,
          ip: req.ip || 'unknown',
          path: req.path,
          method: req.method,
          userAgent: req.get('user-agent'),
          timestamp: new Date().toISOString(),
        };
        
        logRateLimitViolation(violation);
        console.warn('Rate limit exceeded:', violation);
        
        // Implement progressive delay for repeated failures
        // Add a small delay that increases with each violation
        const progressiveDelay = Math.min(exceedBy * 100, 2000); // Max 2 seconds
        await new Promise(resolve => setTimeout(resolve, progressiveDelay));
        
        res.set({
          'X-RateLimit-Limit': effectiveLimit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(limitData.resetTime).toISOString(),
          'Retry-After': retryAfter.toString(),
        });
        
        return res.status(429).json({
          error: 'RATE_LIMIT_EXCEEDED',
          message,
          retryAfter,
          limit: effectiveLimit,
          resetAt: new Date(limitData.resetTime).toISOString(),
        });
      }

      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': effectiveLimit.toString(),
        'X-RateLimit-Remaining': Math.max(0, effectiveLimit - limitData.count).toString(),
        'X-RateLimit-Reset': new Date(limitData.resetTime).toISOString(),
      });

      // Handle response to potentially skip counting
      if (skipSuccessfulRequests || skipFailedRequests) {
        const originalSend = res.send;
        res.send = function(body) {
          const statusCode = res.statusCode;
          
          // Decrement counter if we should skip this request
          if (
            (skipSuccessfulRequests && statusCode >= 200 && statusCode < 300) ||
            (skipFailedRequests && statusCode >= 400)
          ) {
            if (storage) {
              // For storage backends, we'd need to implement decrement
              // For now, we'll skip this optimization
            } else if (store[key]) {
              store[key].count--;
            }
          }
          
          return originalSend.call(this, body);
        };
      }

      next();
    } catch (error) {
      console.error('Rate limiter error:', error);
      // On error, allow the request through but log it
      next();
    }
  };
}

// In-memory store for legacy support
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Track rate limit violations for security monitoring
interface RateLimitViolation {
  key: string;
  limit: number;
  count: number;
  exceedBy: number;
  ip: string;
  path: string;
  method: string;
  userAgent?: string;
  timestamp: string;
}

const violations: RateLimitViolation[] = [];
const MAX_VIOLATIONS_STORED = 1000;

export function logRateLimitViolation(violation: RateLimitViolation): void {
  violations.push(violation);
  
  // Keep only the most recent violations
  if (violations.length > MAX_VIOLATIONS_STORED) {
    violations.shift();
  }
}

export function getRateLimitViolations(limit = 100): RateLimitViolation[] {
  return violations.slice(-limit);
}

export function clearRateLimitViolations(): void {
  violations.length = 0;
}

// Predefined rate limiters

// Authentication rate limiter - IP-based for login/signup
export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts per 15 minutes
  keyGenerator: (req) => `auth:${req.ip || 'unknown'}`,
  message: 'Too many authentication attempts. Please try again later.',
});

// Password reset rate limiter - email-based
export const resetRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3, // 3 reset requests per hour
  keyGenerator: (req) => {
    const email = req.body?.email || 'unknown';
    return `reset:${email}`;
  },
  message: 'Too many password reset requests. Please try again later.',
});

// API rate limiter with tier support - user-based
export const apiRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 100, // Default for free tier
  keyGenerator: (req) => {
    const user = (req as any).user;
    return `api:${user?.claims?.sub || req.ip || 'unknown'}`;
  },
  tierLimits: {
    free: { limit: 100, window: 60 * 60 * 1000 }, // 100 per hour
    pro: { limit: 1000, window: 60 * 60 * 1000 }, // 1000 per hour
    enterprise: { limit: -1, window: 0 }, // unlimited
  },
  message: 'API rate limit exceeded. Please upgrade your plan for higher limits.',
});

// Analysis rate limiter with tier support
export const analysisRateLimit = createRateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  maxRequests: 10, // Default for free tier
  keyGenerator: (req) => {
    const user = (req as any).user;
    return `analysis:${user?.claims?.sub || req.ip || 'unknown'}`;
  },
  tierLimits: {
    free: { limit: 10, window: 24 * 60 * 60 * 1000 }, // 10 per day
    pro: { limit: 100, window: 24 * 60 * 60 * 1000 }, // 100 per day
    enterprise: { limit: -1, window: 0 }, // unlimited
  },
  message: 'Analysis limit exceeded. Please upgrade your plan for more analyses.',
});

// Search rate limiter
export const searchRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // 30 searches per minute
  keyGenerator: (req) => {
    const user = (req as any).user;
    return `search:${user?.claims?.sub || req.ip || 'unknown'}`;
  },
});

// General API rate limiter (legacy)
export const generalApiRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 requests per minute
});