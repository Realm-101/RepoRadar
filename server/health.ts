import { Request, Response } from 'express';
import { db } from './db';
import { isStripeEnabled } from './stripe';
import { isGeminiEnabled } from './gemini';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: ServiceHealth;
    stripe: ServiceHealth;
    gemini: ServiceHealth;
  };
  version?: string;
  uptime: number;
}

interface ServiceHealth {
  status: 'up' | 'down' | 'disabled';
  responseTime?: number;
  error?: string;
}

export async function healthCheck(req: Request, res: Response) {
  const startTime = Date.now();
  const health: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: { status: 'down' },
      stripe: { status: 'disabled' },
      gemini: { status: 'disabled' },
    },
    uptime: process.uptime(),
  };

  // Check database
  try {
    const dbStart = Date.now();
    await db.execute('SELECT 1');
    health.services.database = {
      status: 'up',
      responseTime: Date.now() - dbStart,
    };
  } catch (error: any) {
    health.services.database = {
      status: 'down',
      error: error.message,
    };
    health.status = 'unhealthy';
  }

  // Check Stripe
  if (isStripeEnabled()) {
    health.services.stripe = { status: 'up' };
  }

  // Check Gemini
  if (isGeminiEnabled()) {
    health.services.gemini = { status: 'up' };
  } else {
    health.status = health.status === 'healthy' ? 'degraded' : health.status;
  }

  // Set HTTP status based on health
  const httpStatus = health.status === 'healthy' ? 200 : 
                    health.status === 'degraded' ? 200 : 503;

  res.status(httpStatus).json(health);
}

export async function readinessCheck(req: Request, res: Response) {
  try {
    // Check if essential services are ready
    await db.execute('SELECT 1');
    res.status(200).json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not ready', error: 'Database not available' });
  }
}

export async function livenessCheck(req: Request, res: Response) {
  // Simple liveness check - just return OK if the process is running
  res.status(200).json({ 
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}