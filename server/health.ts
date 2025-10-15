import { Request, Response } from 'express';
import { db, checkDatabaseHealth } from './db';
import { isStripeEnabled } from './stripe';
import { isGeminiEnabled } from './gemini';
import { redisManager } from './redis';
import { jobQueue } from './jobs/JobQueue';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    database: CheckResult;
    cache: CheckResult;
    api: CheckResult;
    queue: CheckResult;
  };
  version?: string;
  uptime: number;
}

interface CheckResult {
  status: 'up' | 'down' | 'degraded';
  responseTime: number;
  message?: string;
  details?: Record<string, any>;
}

interface ReadinessStatus {
  status: 'ready' | 'not ready';
  timestamp: string;
  checks: {
    database: CheckResult;
    cache: CheckResult;
  };
}

interface LivenessStatus {
  status: 'alive';
  timestamp: string;
  uptime: number;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
}

/**
 * Overall health check endpoint
 * Returns comprehensive health status of all system components
 * Requirement 10.1: Overall application health status
 */
export async function healthCheck(req: Request, res: Response) {
  const startTime = Date.now();
  const timeout = 2000; // 2 second timeout (Requirement 10.4)

  try {
    // Run all health checks with timeout
    const healthPromise = performHealthChecks();
    const timeoutPromise = new Promise<HealthStatus>((_, reject) => 
      setTimeout(() => reject(new Error('Health check timeout')), timeout)
    );

    const health = await Promise.race([healthPromise, timeoutPromise]);

    // Ensure total response time is within 2 seconds (Requirement 10.8)
    const totalTime = Date.now() - startTime;
    if (totalTime > 2000) {
      console.warn(`Health check took ${totalTime}ms, exceeding 2 second limit`);
    }

    // Set HTTP status based on health (Requirement 10.1)
    const httpStatus = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 200 : 503;

    res.status(httpStatus).json(health);
  } catch (error) {
    // If health check times out or fails, return unhealthy status
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: { status: 'down', responseTime: 0, message: 'Health check timeout' },
        cache: { status: 'down', responseTime: 0, message: 'Health check timeout' },
        api: { status: 'down', responseTime: 0, message: 'Health check timeout' },
        queue: { status: 'down', responseTime: 0, message: 'Health check timeout' },
      },
      uptime: process.uptime(),
    });
  }
}

/**
 * Perform all health checks
 */
async function performHealthChecks(): Promise<HealthStatus> {
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: { status: 'down', responseTime: 0 },
      cache: { status: 'down', responseTime: 0 },
      api: { status: 'down', responseTime: 0 },
      queue: { status: 'down', responseTime: 0 },
    },
    uptime: process.uptime(),
  };

  // Check database (Requirement 10.4)
  health.checks.database = await checkDatabase();
  
  // Check Redis cache (Requirement 10.5)
  health.checks.cache = await checkRedis();
  
  // Check API health (Requirement 10.6)
  health.checks.api = await checkAPI();
  
  // Check job queue (Requirement 10.7)
  health.checks.queue = await checkJobQueue();

  // Determine overall health status
  const checks = Object.values(health.checks);
  const hasDown = checks.some(check => check.status === 'down');
  const hasDegraded = checks.some(check => check.status === 'degraded');

  if (hasDown) {
    health.status = 'unhealthy';
  } else if (hasDegraded) {
    health.status = 'degraded';
  }

  return health;
}

/**
 * Check database connectivity
 * Requirement 10.4: Database connectivity check
 * Requirement 2.3: Verify database connectivity via health checks
 */
async function checkDatabase(): Promise<CheckResult> {
  try {
    const health = await checkDatabaseHealth();
    
    if (health.status === 'unhealthy') {
      return {
        status: 'down',
        responseTime: health.responseTime,
        message: health.details || 'Database connection failed',
      };
    }
    
    return {
      status: health.responseTime < 100 ? 'up' : 'degraded',
      responseTime: health.responseTime,
      message: health.responseTime >= 100 ? 'High database latency' : undefined,
      details: health.poolStats,
    };
  } catch (error: any) {
    return {
      status: 'down',
      responseTime: 0,
      message: error.message || 'Database connection failed',
    };
  }
}

/**
 * Check Redis connectivity
 * Requirement 10.5: Redis connectivity check
 * Requirement 3.4: Update health check to report Redis status without failing
 */
async function checkRedis(): Promise<CheckResult> {
  try {
    if (!redisManager.isRedisEnabled()) {
      return {
        status: 'up',
        responseTime: 0,
        message: 'Redis is disabled (using fallback mechanisms)',
        details: {
          enabled: false,
          fallback: 'memory/postgresql',
        },
      };
    }
    
    const healthStatus = await redisManager.getHealthStatus();
    
    // If Redis is down, report as degraded but not down
    // This allows the application to continue with fallback mechanisms
    if (healthStatus.status === 'down') {
      return {
        status: 'degraded',
        responseTime: healthStatus.responseTime,
        message: `Redis unavailable (using fallback): ${healthStatus.message || 'Connection failed'}`,
        details: {
          enabled: true,
          connected: false,
          fallback: 'memory/postgresql',
        },
      };
    }
    
    return {
      ...healthStatus,
      details: {
        enabled: true,
        connected: true,
        fallback: 'none',
      },
    };
  } catch (error: any) {
    // Redis check failure should not fail the health check
    return {
      status: 'degraded',
      responseTime: 0,
      message: `Redis check failed (using fallback): ${error.message || 'Unknown error'}`,
      details: {
        enabled: true,
        connected: false,
        fallback: 'memory/postgresql',
      },
    };
  }
}

/**
 * Check API health (external dependencies)
 * Requirement 10.6: API health check
 */
async function checkAPI(): Promise<CheckResult> {
  const startTime = Date.now();
  const details: Record<string, any> = {};

  // Check if critical API dependencies are configured
  const geminiEnabled = isGeminiEnabled();
  const stripeEnabled = isStripeEnabled();

  details.gemini = geminiEnabled ? 'enabled' : 'disabled';
  details.stripe = stripeEnabled ? 'enabled' : 'disabled';

  const responseTime = Date.now() - startTime;

  // API is considered healthy if at least Gemini is enabled (core functionality)
  if (!geminiEnabled) {
    return {
      status: 'degraded',
      responseTime,
      message: 'Gemini AI service not configured',
      details,
    };
  }

  return {
    status: 'up',
    responseTime,
    details,
  };
}

/**
 * Check job queue health
 * Requirement 10.7: Job queue health check
 */
async function checkJobQueue(): Promise<CheckResult> {
  const startTime = Date.now();
  
  try {
    // Check if job queue is initialized and get stats
    const stats = await jobQueue.getStats();
    const responseTime = Date.now() - startTime;

    // Check for concerning queue conditions
    const totalJobs = stats.waiting + stats.active + stats.delayed;
    const failedRatio = stats.failed / (stats.completed + stats.failed || 1);

    let status: 'up' | 'degraded' | 'down' = 'up';
    let message: string | undefined;

    // Queue is degraded if there are too many waiting jobs or high failure rate
    if (totalJobs > 1000) {
      status = 'degraded';
      message = `High queue depth: ${totalJobs} jobs`;
    } else if (failedRatio > 0.1) {
      status = 'degraded';
      message = `High failure rate: ${(failedRatio * 100).toFixed(1)}%`;
    }

    return {
      status,
      responseTime,
      message,
      details: stats,
    };
  } catch (error: any) {
    return {
      status: 'down',
      responseTime: Date.now() - startTime,
      message: error.message || 'Job queue check failed',
    };
  }
}

/**
 * Readiness check endpoint
 * Verifies that the application is ready to accept traffic
 * Requirement 10.2: Readiness checks
 * Requirement 10.7: Readiness checks fail until all services are initialized
 */
export async function readinessCheck(req: Request, res: Response) {
  const startTime = Date.now();
  const timeout = 2000; // 2 second timeout (Requirement 10.4)

  try {
    // Run readiness checks with timeout
    const readinessPromise = performReadinessChecks();
    const timeoutPromise = new Promise<ReadinessStatus>((_, reject) => 
      setTimeout(() => reject(new Error('Readiness check timeout')), timeout)
    );

    const readiness = await Promise.race([readinessPromise, timeoutPromise]);

    // Ensure total response time is within 2 seconds (Requirement 10.8)
    const totalTime = Date.now() - startTime;
    if (totalTime > 2000) {
      console.warn(`Readiness check took ${totalTime}ms, exceeding 2 second limit`);
    }

    const httpStatus = readiness.status === 'ready' ? 200 : 503;
    res.status(httpStatus).json(readiness);
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: { status: 'down', responseTime: 0, message: 'Readiness check timeout' },
        cache: { status: 'down', responseTime: 0, message: 'Readiness check timeout' },
      },
    });
  }
}

/**
 * Perform readiness checks
 * Requirement 3.4: Redis status should not fail readiness check
 */
async function performReadinessChecks(): Promise<ReadinessStatus> {
  const readiness: ReadinessStatus = {
    status: 'ready',
    timestamp: new Date().toISOString(),
    checks: {
      database: { status: 'down', responseTime: 0 },
      cache: { status: 'down', responseTime: 0 },
    },
  };

  // Check essential services
  readiness.checks.database = await checkDatabase();
  readiness.checks.cache = await checkRedis();

  // Application is ready if database is up
  // Cache (Redis) is optional - application can run with fallback mechanisms
  const isReady = readiness.checks.database.status === 'up';

  readiness.status = isReady ? 'ready' : 'not ready';

  return readiness;
}

/**
 * Liveness check endpoint
 * Confirms that the application process is responsive
 * Requirement 10.3: Liveness checks
 */
export async function livenessCheck(req: Request, res: Response) {
  // Simple liveness check - just return OK if the process is running
  // This should be very fast and not depend on external services
  const memUsage = process.memoryUsage();
  
  const liveness: LivenessStatus = {
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memoryUsage: {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      external: Math.round(memUsage.external / 1024 / 1024), // MB
      rss: Math.round(memUsage.rss / 1024 / 1024), // MB
    },
  };

  res.status(200).json(liveness);
}