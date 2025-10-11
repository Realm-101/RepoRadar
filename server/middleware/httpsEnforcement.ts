import { Request, Response, NextFunction } from 'express';

/**
 * HTTPS Enforcement Middleware
 * 
 * Redirects HTTP requests to HTTPS in production environments.
 * Skips redirect in development for local testing.
 */

/**
 * Middleware to enforce HTTPS connections in production
 */
export function enforceHTTPS(req: Request, res: Response, next: NextFunction): void {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Skip HTTPS enforcement in development
  if (!isProduction) {
    return next();
  }

  // Check if request is already HTTPS
  const isSecure = req.secure || 
                   req.headers['x-forwarded-proto'] === 'https' ||
                   req.protocol === 'https';

  if (!isSecure) {
    // Construct HTTPS URL
    const httpsUrl = `https://${req.hostname}${req.url}`;
    
    // Log the redirect for monitoring
    console.log(`HTTPS Redirect: ${req.method} ${req.url} -> ${httpsUrl}`);
    
    // 301 Permanent Redirect to HTTPS
    return res.redirect(301, httpsUrl);
  }

  next();
}

/**
 * Security Headers Middleware
 * 
 * Adds security-related HTTP headers to all responses.
 */
export function setSecurityHeaders(req: Request, res: Response, next: NextFunction): void {
  const isProduction = process.env.NODE_ENV === 'production';

  // Strict-Transport-Security (HSTS)
  // Tells browsers to only use HTTPS for future requests
  if (isProduction) {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  // X-Content-Type-Options
  // Prevents MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // X-Frame-Options
  // Prevents clickjacking attacks
  res.setHeader('X-Frame-Options', 'DENY');

  // X-XSS-Protection
  // Enables browser XSS protection (legacy browsers)
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Content-Security-Policy
  // Restricts resource loading to prevent XSS and other attacks
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://accounts.google.com https://apis.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.github.com https://accounts.google.com https://oauth2.googleapis.com",
    "frame-src 'self' https://accounts.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ];

  // In development, allow more permissive CSP for hot reload
  if (!isProduction) {
    cspDirectives[1] = "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://accounts.google.com https://apis.google.com";
    cspDirectives[3] = "connect-src 'self' ws: wss: https://api.github.com https://accounts.google.com https://oauth2.googleapis.com";
    // Remove upgrade-insecure-requests in development
    cspDirectives.pop();
  }

  res.setHeader('Content-Security-Policy', cspDirectives.join('; '));

  // Referrer-Policy
  // Controls how much referrer information is sent
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions-Policy (formerly Feature-Policy)
  // Controls which browser features can be used
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=()'
  );

  next();
}
