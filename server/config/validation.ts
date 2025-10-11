import { log } from "../vite";

interface ConfigValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface FeatureConfig {
  name: string;
  enabled: boolean;
  requiredVars: string[];
  optionalVars: string[];
}

/**
 * Validates required environment variables on startup
 */
export function validateConfiguration(): ConfigValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Core required variables
  const coreRequired = [
    'DATABASE_URL',
    'SESSION_SECRET',
    'SESSION_ENCRYPTION_KEY',
  ];

  // Check core requirements
  for (const varName of coreRequired) {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  }

  // Validate session secrets are not default values
  if (process.env.SESSION_SECRET?.includes('dev_') || 
      process.env.SESSION_SECRET === 'your_session_secret_here_change_in_production') {
    if (process.env.NODE_ENV === 'production') {
      errors.push('SESSION_SECRET must be changed from default value in production');
    } else {
      warnings.push('SESSION_SECRET is using default value. Change for production.');
    }
  }

  if (process.env.SESSION_ENCRYPTION_KEY?.includes('dev_') || 
      process.env.SESSION_ENCRYPTION_KEY === 'your_64_char_hex_encryption_key_here_change_in_production') {
    if (process.env.NODE_ENV === 'production') {
      errors.push('SESSION_ENCRYPTION_KEY must be changed from default value in production');
    } else {
      warnings.push('SESSION_ENCRYPTION_KEY is using default value. Change for production.');
    }
  }

  // Feature-specific validation
  const features: FeatureConfig[] = [
    {
      name: 'Password Authentication',
      enabled: true,
      requiredVars: ['BCRYPT_ROUNDS'],
      optionalVars: [],
    },
    {
      name: 'OAuth (Stack Auth)',
      enabled: !!(process.env.NEXT_PUBLIC_STACK_PROJECT_ID),
      requiredVars: [
        'NEXT_PUBLIC_STACK_PROJECT_ID',
        'NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY',
        'STACK_SECRET_SERVER_KEY',
      ],
      optionalVars: [],
    },
    {
      name: 'Email Service (Password Reset)',
      enabled: !!(process.env.RESEND_API_KEY),
      requiredVars: ['RESEND_API_KEY', 'EMAIL_FROM', 'PASSWORD_RESET_URL'],
      optionalVars: ['EMAIL_FROM_NAME'],
    },
    {
      name: 'Rate Limiting',
      enabled: true,
      requiredVars: ['RATE_LIMIT_STORAGE'],
      optionalVars: [
        'RATE_LIMIT_REDIS_URL',
        'RATE_LIMIT_AUTH_LOGIN_LIMIT',
        'RATE_LIMIT_AUTH_SIGNUP_LIMIT',
        'RATE_LIMIT_AUTH_RESET_LIMIT',
      ],
    },
    {
      name: 'HTTPS Enforcement',
      enabled: process.env.FORCE_HTTPS === 'true',
      requiredVars: [],
      optionalVars: ['HSTS_MAX_AGE', 'HSTS_INCLUDE_SUBDOMAINS'],
    },
    {
      name: 'Redis Sessions',
      enabled: process.env.USE_REDIS_SESSIONS === 'true',
      requiredVars: ['REDIS_URL'],
      optionalVars: ['REDIS_KEY_PREFIX'],
    },
  ];

  // Validate each feature
  for (const feature of features) {
    if (feature.enabled) {
      for (const varName of feature.requiredVars) {
        if (!process.env[varName]) {
          errors.push(`${feature.name} is enabled but missing required variable: ${varName}`);
        }
      }
    } else {
      // Check if feature could be enabled
      const hasAllRequired = feature.requiredVars.every(v => process.env[v]);
      if (hasAllRequired && feature.requiredVars.length > 0) {
        warnings.push(`${feature.name} is not enabled but all required variables are set`);
      }
    }
  }

  // Validate BCRYPT_ROUNDS
  const bcryptRounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
  if (isNaN(bcryptRounds) || bcryptRounds < 10 || bcryptRounds > 15) {
    warnings.push('BCRYPT_ROUNDS should be between 10 and 15 (default: 12)');
  }

  // Validate rate limit storage
  const rateLimitStorage = process.env.RATE_LIMIT_STORAGE;
  if (rateLimitStorage && !['memory', 'redis', 'postgres'].includes(rateLimitStorage)) {
    errors.push('RATE_LIMIT_STORAGE must be one of: memory, redis, postgres');
  }

  if (rateLimitStorage === 'redis' && !process.env.RATE_LIMIT_REDIS_URL) {
    errors.push('RATE_LIMIT_STORAGE is set to redis but RATE_LIMIT_REDIS_URL is not configured');
  }

  // Production-specific validations
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.FORCE_HTTPS || process.env.FORCE_HTTPS !== 'true') {
      warnings.push('FORCE_HTTPS should be enabled in production');
    }

    if (!process.env.RESEND_API_KEY) {
      warnings.push('Email service (RESEND_API_KEY) is not configured. Password reset will not work.');
    }

    if (process.env.RATE_LIMIT_STORAGE === 'memory') {
      warnings.push('Using memory-based rate limiting in production. Consider using Redis for multi-instance deployments.');
    }

    if (!process.env.USE_REDIS_SESSIONS || process.env.USE_REDIS_SESSIONS !== 'true') {
      warnings.push('Redis sessions are not enabled. Consider enabling for multi-instance deployments.');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Logs configuration summary on startup
 */
export function logConfigurationSummary(): void {
  const features = {
    'Password Authentication': true,
    'OAuth (Stack Auth)': !!(process.env.NEXT_PUBLIC_STACK_PROJECT_ID),
    'Email Service': !!(process.env.RESEND_API_KEY),
    'Rate Limiting': true,
    'HTTPS Enforcement': process.env.FORCE_HTTPS === 'true',
    'Redis Sessions': process.env.USE_REDIS_SESSIONS === 'true',
    'Redis Cache': process.env.CACHE_TYPE === 'redis',
    'Security Headers': process.env.SECURITY_HEADERS_ENABLED !== 'false',
    'Session Regeneration': process.env.SESSION_REGENERATE_ON_LOGIN !== 'false',
    'Session Metadata Tracking': process.env.SESSION_TRACK_METADATA !== 'false',
  };

  log('\n' + '='.repeat(60));
  log('🔐 AUTHENTICATION & SECURITY CONFIGURATION');
  log('='.repeat(60));
  log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  log(`Port: ${process.env.PORT || 5000}`);
  log('');
  log('Features:');
  
  for (const [feature, enabled] of Object.entries(features)) {
    const status = enabled ? '✅ Enabled' : '❌ Disabled';
    log(`  ${feature.padEnd(30)} ${status}`);
  }

  log('');
  log('Rate Limiting:');
  log(`  Storage: ${process.env.RATE_LIMIT_STORAGE || 'memory'}`);
  log(`  Login attempts: ${process.env.RATE_LIMIT_AUTH_LOGIN_LIMIT || 5} per ${(parseInt(process.env.RATE_LIMIT_AUTH_LOGIN_WINDOW || '900000') / 60000).toFixed(0)} minutes`);
  log(`  Password reset: ${process.env.RATE_LIMIT_AUTH_RESET_LIMIT || 3} per hour`);
  
  log('');
  log('Session Configuration:');
  log(`  Storage: ${process.env.USE_REDIS_SESSIONS === 'true' ? 'Redis' : 'PostgreSQL'}`);
  log(`  Timeout: ${(parseInt(process.env.SESSION_TIMEOUT || '604800000') / 86400000).toFixed(0)} days`);
  log(`  Regenerate on login: ${process.env.SESSION_REGENERATE_ON_LOGIN !== 'false' ? 'Yes' : 'No'}`);

  log('='.repeat(60) + '\n');
}

/**
 * Implements graceful degradation for optional features
 */
export function getFeatureStatus() {
  return {
    oauth: {
      enabled: !!(process.env.NEXT_PUBLIC_STACK_PROJECT_ID && 
                  process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY && 
                  process.env.STACK_SECRET_SERVER_KEY),
      providers: {
        google: !!(process.env.NEXT_PUBLIC_STACK_PROJECT_ID),
        github: !!(process.env.NEXT_PUBLIC_STACK_PROJECT_ID),
      },
    },
    passwordReset: {
      enabled: !!(process.env.RESEND_API_KEY),
      emailService: process.env.RESEND_API_KEY ? 'resend' : 'none',
    },
    rateLimiting: {
      enabled: true,
      storage: process.env.RATE_LIMIT_STORAGE || 'memory',
      redis: !!(process.env.RATE_LIMIT_REDIS_URL),
    },
    https: {
      enabled: process.env.FORCE_HTTPS === 'true',
      hsts: process.env.FORCE_HTTPS === 'true',
    },
    sessions: {
      redis: process.env.USE_REDIS_SESSIONS === 'true',
      regeneration: process.env.SESSION_REGENERATE_ON_LOGIN !== 'false',
      metadataTracking: process.env.SESSION_TRACK_METADATA !== 'false',
    },
    security: {
      headers: process.env.SECURITY_HEADERS_ENABLED !== 'false',
      csp: process.env.CSP_ENABLED !== 'false',
    },
  };
}

/**
 * Validates and initializes configuration on startup
 * Throws error if critical configuration is missing
 */
export function initializeConfiguration(): void {
  const result = validateConfiguration();

  if (result.errors.length > 0) {
    log('\n❌ CONFIGURATION ERRORS:\n');
    result.errors.forEach(error => log(`  • ${error}`));
    log('\nPlease fix the above errors before starting the application.\n');
    throw new Error('Configuration validation failed');
  }

  if (result.warnings.length > 0) {
    log('\n⚠️  CONFIGURATION WARNINGS:\n');
    result.warnings.forEach(warning => log(`  • ${warning}`));
    log('');
  }

  logConfigurationSummary();
}
