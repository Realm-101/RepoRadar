import { createAdapter } from '@socket.io/redis-adapter';
import { redisManager } from './redis';
import { logger } from './instanceId';

/**
 * WebSocket Redis Adapter
 * Enables WebSocket communication across multiple instances
 */

export async function createWebSocketAdapter() {
  try {
    const useRedis = process.env.USE_REDIS_SESSIONS === 'true';
    
    if (!useRedis) {
      logger.info('WebSocket: Using in-memory adapter (Redis disabled)');
      return null;
    }

    logger.info('WebSocket: Initializing Redis adapter');
    
    // Get Redis client
    const pubClient = await redisManager.getClient();
    
    // Create separate subscriber client
    const subClient = pubClient.duplicate();
    await subClient.connect();
    
    // Create Redis adapter
    const adapter = createAdapter(pubClient, subClient);
    
    logger.info('WebSocket: Redis adapter initialized');
    
    return adapter;
  } catch (error) {
    logger.error('WebSocket: Failed to initialize Redis adapter', error);
    logger.info('WebSocket: Falling back to in-memory adapter');
    return null;
  }
}

/**
 * Close WebSocket adapter connections
 */
export async function closeWebSocketAdapter(adapter: any): Promise<void> {
  if (!adapter) {
    return;
  }

  try {
    logger.info('WebSocket: Closing Redis adapter');
    // The adapter will be closed when Redis connections are closed
    logger.info('WebSocket: Redis adapter closed');
  } catch (error) {
    logger.error('WebSocket: Error closing Redis adapter', error);
  }
}
