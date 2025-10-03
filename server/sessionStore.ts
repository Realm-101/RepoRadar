import session from 'express-session';
import RedisStore from 'connect-redis';
import { redisManager } from './redis.js';
import crypto from 'crypto';

/**
 * Session configuration with Redis store
 */

// Encryption key for session data (should be in environment variable)
const ENCRYPTION_KEY = process.env.SESSION_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const ENCRYPTION_ALGORITHM = 'aes-256-gcm';

/**
 * Encrypt session data
 */
function encryptSessionData(data: string): string {
  try {
    const iv = crypto.randomBytes(16);
    const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex');
    const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Return iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Session encryption error:', error);
    throw new Error('Failed to encrypt session data');
  }
}

/**
 * Decrypt session data
 */
function decryptSessionData(encryptedData: string): string {
  try {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const [ivHex, authTagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const key = Buffer.from(ENCRYPTION_KEY.slice(0, 64), 'hex');
    
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Session decryption error:', error);
    throw new Error('Failed to decrypt session data');
  }
}

/**
 * Create session store with Redis backend
 */
export async function createSessionStore(): Promise<session.Store> {
  const useRedis = process.env.USE_REDIS_SESSIONS === 'true';
  
  if (!useRedis) {
    console.log('Session Store: Using memory store (Redis disabled)');
    // Use memory store as fallback
    const MemoryStore = (await import('memorystore')).default;
    const MemoryStoreSession = MemoryStore(session);
    return new MemoryStoreSession({
      checkPeriod: 86400000, // 24 hours
    });
  }

  try {
    console.log('Session Store: Initializing Redis store');
    // Add timeout to Redis connection attempt
    const redisClient = await Promise.race([
      redisManager.getClient(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Redis connection timeout')), 3000)
      )
    ]) as any;
    
    // Create Redis store with encryption
    const store = new RedisStore({
      client: redisClient,
      prefix: 'sess:',
      ttl: 86400, // 24 hours in seconds
      disableTouch: false,
      
      // Custom serializer with encryption
      serializer: {
        parse: (data: string) => {
          try {
            const decrypted = decryptSessionData(data);
            return JSON.parse(decrypted);
          } catch (error) {
            console.error('Session parse error:', error);
            return {};
          }
        },
        stringify: (data: any) => {
          try {
            const json = JSON.stringify(data);
            return encryptSessionData(json);
          } catch (error) {
            console.error('Session stringify error:', error);
            return '';
          }
        },
      },
    });

    console.log('Session Store: Redis store initialized');
    return store;
  } catch (error) {
    console.error('Session Store: Failed to initialize Redis store, falling back to memory store', error);
    
    // Fallback to memory store
    const MemoryStore = (await import('memorystore')).default;
    const MemoryStoreSession = MemoryStore(session);
    return new MemoryStoreSession({
      checkPeriod: 86400000, // 24 hours
    });
  }
}

/**
 * Get session middleware configuration
 */
export function getSessionConfig(store: session.Store): session.SessionOptions {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    store,
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    name: 'reporadar.sid',
    cookie: {
      secure: isProduction, // HTTPS only in production
      httpOnly: true, // Prevent XSS
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax', // CSRF protection
    },
    rolling: true, // Reset expiration on each request
  };
}

/**
 * Session data interface
 */
export interface SessionData {
  userId?: string;
  createdAt: Date;
  lastAccessedAt: Date;
  data: Record<string, any>;
}

/**
 * Extend express-session types
 */
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    createdAt?: Date;
    lastAccessedAt?: Date;
    data?: Record<string, any>;
  }
}
