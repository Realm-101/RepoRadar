import express, { type Express, type Request, type Response, type NextFunction } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";
import compression from "compression";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

/**
 * Configure compression middleware with environment-based settings
 */
function configureCompression() {
  const compressionEnabled = process.env.COMPRESSION_ENABLED !== 'false';
  const compressionThreshold = parseInt(process.env.COMPRESSION_THRESHOLD || '1024', 10);
  const compressionLevel = parseInt(process.env.COMPRESSION_LEVEL || '6', 10);
  const excludeContentTypes = (process.env.COMPRESSION_EXCLUDE_CONTENT_TYPES || 'image/*,video/*,audio/*')
    .split(',')
    .map(type => type.trim());

  if (!compressionEnabled) {
    return (_req: Request, _res: Response, next: NextFunction) => next();
  }

  return compression({
    threshold: compressionThreshold,
    level: compressionLevel,
    filter: (req: Request, res: Response) => {
      // Don't compress if explicitly disabled
      if (req.headers['x-no-compression']) {
        return false;
      }

      // Check if content type should be excluded
      const contentType = res.getHeader('Content-Type') as string;
      if (contentType) {
        for (const excludeType of excludeContentTypes) {
          const pattern = excludeType.replace('*', '.*');
          if (new RegExp(pattern).test(contentType)) {
            return false;
          }
        }
      }

      // Use default compression filter
      return compression.filter(req, res);
    },
  });
}

/**
 * Set cache headers based on file type
 */
function setCacheHeaders(res: Response, filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  
  // Immutable assets with content hashes (JS, CSS with hashes)
  if (/\.(js|css)$/.test(ext) && /\.[a-f0-9]{8,}\.(js|css)$/.test(filePath)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return;
  }

  // Static assets with moderate caching
  if (/\.(jpg|jpeg|png|gif|svg|webp|ico|woff|woff2|ttf|eot)$/.test(ext)) {
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
    return;
  }

  // JavaScript and CSS without hashes
  if (/\.(js|css)$/.test(ext)) {
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour
    return;
  }

  // HTML files - short cache with revalidation
  if (/\.html$/.test(ext)) {
    res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate'); // 1 hour
    return;
  }

  // Default - no cache for other files
  res.setHeader('Cache-Control', 'no-cache');
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Apply compression middleware
  app.use(configureCompression());

  // Serve static files with custom cache headers
  app.use(express.static(distPath, {
    etag: true,
    lastModified: true,
    setHeaders: (res: Response, filePath: string) => {
      setCacheHeaders(res, filePath);
    },
  }));

  // SPA fallback - serve index.html for all non-API routes
  // This ensures client-side routing works correctly
  app.use("*", (req: Request, res: Response) => {
    // Don't serve index.html for API routes
    if (req.originalUrl.startsWith('/api')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }

    // Set cache headers for index.html
    setCacheHeaders(res, 'index.html');
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
