import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { gracefulShutdown } from "./gracefulShutdown";
import { instanceId, logger } from "./instanceId";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add instance ID to all responses for debugging
app.use((req, res, next) => {
  res.setHeader('X-Instance-Id', instanceId.getId());
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, unknown> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Log instance startup
  logger.info('Starting application instance', instanceId.getMetadata());

  const server = await registerRoutes(app);

  // Import and use the enhanced error handler
  const { createErrorHandler } = await import("./utils/errorHandler");
  app.use(createErrorHandler());

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    logger.info(`Server listening on port ${port}`);
    log(`serving on port ${port}`);
  });

  // Initialize graceful shutdown handler
  gracefulShutdown.initialize(server, {
    timeout: 30000, // 30 seconds
    logger: (message: string) => logger.info(message),
  });

  logger.info('Application instance ready');
})();
