import type { Server } from 'http';

/**
 * Graceful Shutdown Handler
 * Handles clean shutdown of the application with connection draining
 */

interface ShutdownOptions {
  timeout?: number; // Maximum time to wait for connections to close (ms)
  logger?: (message: string) => void;
}

class GracefulShutdownHandler {
  private isShuttingDown = false;
  private activeConnections = new Set<any>();
  private server: Server | null = null;

  /**
   * Initialize graceful shutdown handler
   */
  initialize(server: Server, options: ShutdownOptions = {}): void {
    this.server = server;
    const timeout = options.timeout || 30000; // 30 seconds default
    const logger = options.logger || console.log;

    // Track active connections
    server.on('connection', (connection) => {
      this.activeConnections.add(connection);
      
      connection.on('close', () => {
        this.activeConnections.delete(connection);
      });
    });

    // Handle shutdown signals
    const shutdown = async (signal: string) => {
      if (this.isShuttingDown) {
        logger(`Already shutting down, ignoring ${signal}`);
        return;
      }

      this.isShuttingDown = true;
      logger(`Received ${signal}, starting graceful shutdown...`);

      // Stop accepting new connections
      server.close(() => {
        logger('HTTP server closed');
      });

      // Set timeout for forced shutdown
      const forceShutdownTimer = setTimeout(() => {
        logger(`Shutdown timeout reached (${timeout}ms), forcing shutdown`);
        this.forceShutdown();
        process.exit(1);
      }, timeout);

      try {
        // Drain connections
        await this.drainConnections(logger);

        // Close Redis connection
        await this.closeRedis(logger);

        // Close job queue
        await this.closeJobQueue(logger);

        clearTimeout(forceShutdownTimer);
        logger('Graceful shutdown complete');
        process.exit(0);
      } catch (error) {
        logger(`Error during shutdown: ${error}`);
        clearTimeout(forceShutdownTimer);
        this.forceShutdown();
        process.exit(1);
      }
    };

    // Register signal handlers
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logger(`Uncaught exception: ${error}`);
      shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason) => {
      logger(`Unhandled rejection: ${reason}`);
      shutdown('unhandledRejection');
    });
  }

  /**
   * Drain active connections
   */
  private async drainConnections(logger: (message: string) => void): Promise<void> {
    if (this.activeConnections.size === 0) {
      logger('No active connections to drain');
      return;
    }

    logger(`Draining ${this.activeConnections.size} active connections...`);

    // Wait for connections to close naturally
    const maxWait = 10000; // 10 seconds
    const startTime = Date.now();

    while (this.activeConnections.size > 0 && Date.now() - startTime < maxWait) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (this.activeConnections.size > 0) {
      logger(`${this.activeConnections.size} connections still active, closing forcefully`);
      this.activeConnections.forEach(connection => {
        try {
          connection.destroy();
        } catch (error) {
          // Ignore errors during force close
        }
      });
    }

    logger('Connection draining complete');
  }

  /**
   * Close Redis connection
   */
  private async closeRedis(logger: (message: string) => void): Promise<void> {
    try {
      logger('Closing Redis connection...');
      const { redisManager } = await import('./redis');
      await redisManager.disconnect();
      logger('Redis connection closed');
    } catch (error) {
      logger(`Error closing Redis: ${error}`);
      throw error;
    }
  }

  /**
   * Close job queue
   */
  private async closeJobQueue(logger: (message: string) => void): Promise<void> {
    try {
      logger('Closing job queue...');
      const { jobQueue } = await import('./jobs');
      await jobQueue.close();
      logger('Job queue closed');
    } catch (error) {
      logger(`Error closing job queue: ${error}`);
      throw error;
    }
  }

  /**
   * Force shutdown by destroying all connections
   */
  private forceShutdown(): void {
    this.activeConnections.forEach(connection => {
      try {
        connection.destroy();
      } catch (error) {
        // Ignore errors during force close
      }
    });
  }

  /**
   * Check if shutdown is in progress
   */
  isShutdownInProgress(): boolean {
    return this.isShuttingDown;
  }
}

// Export singleton instance
export const gracefulShutdown = new GracefulShutdownHandler();
