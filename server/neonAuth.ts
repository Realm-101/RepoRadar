import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import session from 'express-session';
import { storage } from './storage';
import { createSessionStore, getSessionConfig } from './sessionStore.js';
import connectPg from 'connect-pg-simple';
import { neonConfig, Pool } from '@neondatabase/serverless';
import ws from 'ws';

// Configure Neon to use WebSockets for better connection handling
neonConfig.webSocketConstructor = ws;

// Neon Auth configuration
const NEON_AUTH_CONFIG = {
  projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID,
  publishableKey: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY,
  secretKey: process.env.STACK_SECRET_SERVER_KEY,
};

// Validate required environment variables
if (!NEON_AUTH_CONFIG.projectId || !NEON_AUTH_CONFIG.publishableKey || !NEON_AUTH_CONFIG.secretKey) {
  console.warn('Neon Auth environment variables not configured. Please set up Neon Auth in your Neon Console.');
}

export async function getSession() {
  const useRedis = process.env.USE_REDIS_SESSIONS === 'true';

  if (useRedis) {
    // Use Redis session store with encryption
    const store = await createSessionStore();
    return session(getSessionConfig(store));
  }

  // Fallback to PostgreSQL session store using Neon's serverless driver
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week

  // Create a connection pool using Neon's serverless driver
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    pool: pool as any, // Type assertion needed for compatibility
    createTableIfMissing: false, // We already created the table
    ttl: sessionTtl / 1000, // TTL in seconds
    tableName: "sessions",
  });

  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: express.Express) {
  app.set("trust proxy", 1);
  const sessionMiddleware = await getSession();
  app.use(sessionMiddleware);

  // Test route to verify auth routes are working
  app.get("/auth/test", (req, res) => {
    console.log('Auth test route hit!');
    res.json({ message: "Auth routes are working!", timestamp: new Date().toISOString() });
  });

  // Neon Auth routes
  app.get("/api/auth/user", async (req, res) => {
    try {
      // Check if user is stored in session
      const sessionUser = (req.session as any).user;

      if (sessionUser) {
        res.json({
          authenticated: true,
          user: sessionUser
        });
      } else {
        res.status(401).json({
          authenticated: false,
          message: "Not authenticated"
        });
      }
    } catch (error) {
      console.error('Auth check error:', error);
      res.status(401).json({
        authenticated: false,
        message: "Authentication check failed"
      });
    }
  });

  // Auth callback route for handling Stack Auth redirects
  app.get("/auth/callback", async (req, res) => {
    console.log('Auth callback route hit!', req.query);
    try {
      // This would be where Stack Auth redirects after successful authentication
      // For now, we'll redirect to home page
      // In a full implementation, you'd verify the auth code/token here

      const { code, state, demo } = req.query;

      console.log('Auth callback - code:', code, 'state:', state, 'demo:', demo);

      if (code || demo) {
        // TODO: Exchange code for user info with Stack Auth API
        // For now, we'll create a mock user for demonstration
        const mockUser = {
          id: 'demo-user-' + Date.now(),
          email: 'demo@example.com',
          name: 'Demo User',
          profileImageUrl: '',
        };

        console.log('Creating mock user:', mockUser);

        // Store user in session
        (req.session as any).user = mockUser;

        // Try to sync user to database, but don't fail if it doesn't work
        try {
          await storage.upsertUser({
            id: mockUser.id,
            email: mockUser.email,
            firstName: mockUser.name.split(' ')[0] || '',
            lastName: mockUser.name.split(' ').slice(1).join(' ') || '',
            profileImageUrl: mockUser.profileImageUrl || '',
          });
          console.log('User synced to database');
        } catch (dbError) {
          console.warn('Failed to sync user to database (continuing anyway):', dbError);
        }

        await new Promise((resolve, reject) => {
          req.session.save((err) => {
            if (err) reject(err);
            else resolve(undefined);
          });
        });

        console.log('User saved to session');
      }

      // Redirect to home page
      console.log('Redirecting to home page');
      res.redirect('/');
    } catch (error) {
      console.error('Auth callback error:', error);
      res.redirect('/?error=auth_failed');
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.clearCookie('connect.sid');
      res.json({ success: true });
    });
  });
}

export const isAuthenticated: express.RequestHandler = async (req, res, next) => {
  try {
    // Check session for authenticated user
    const sessionUser = (req.session as any).user;

    if (sessionUser) {
      // Add user to request for compatibility with existing code
      (req as any).user = {
        claims: {
          sub: sessionUser.id,
          email: sessionUser.email,
          first_name: sessionUser.name?.split(' ')[0] || '',
          last_name: sessionUser.name?.split(' ').slice(1).join(' ') || '',
          profile_image_url: sessionUser.profileImageUrl || '',
        }
      };
      return next();
    }

    // No authenticated user found
    return res.status(401).json({ message: "Unauthorized" });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: "Unauthorized" });
  }
};