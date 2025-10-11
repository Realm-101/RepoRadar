# Rate Limiting Configuration Guide

This guide explains how to configure and customize rate limiting in RepoRadar to protect against abuse and ensure fair usage.

## Overview

RepoRadar implements comprehensive rate limiting across authentication endpoints, API calls, and analysis requests. Rate limiting helps prevent:

- Brute force attacks on login endpoints
- Password reset abuse
- API abuse and excessive usage
- Resource exhaustion

## Rate Limiting Storage Options

RepoRadar supports three storage backends for rate limiting:

### 1. Memory Storage (Default)
- **Best for**: Single-instance deployments, development
- **Pros**: Fast, no external dependencies
- **Cons**: Not shared across instances, lost on restart

### 2. Redis Storage
- **Best for**: Multi-instance deployments, production
- **Pros**: Shared across instances, persistent, fast
- **Cons**: Requires Redis server

### 3. PostgreSQL Storage
- **Best for**: Fallback when Redis is unavailable
- **Pros**: Uses existing database, persistent
- **Cons**: Slower than memory/Redis

## Configuration

### Basic Configuration

Add to your `.env` file:

```bash
# Rate Limiting Storage
RATE_LIMIT_STORAGE=memory
```

Options: `memory`, `redis`, or `postgres`

### Redis Configuration

For multi-instance deployments, use Redis:

```bash
RATE_LIMIT_STORAGE=redis
RATE_LIMIT_REDIS_URL=redis://localhost:6379
```

Or with authentication:

```bash
RATE_LIMIT_STORAGE=redis
RATE_LIMIT_REDIS_URL=redis://username:password@host:6379
```

### Authentication Rate Limits

Configure limits for authentication endpoints:

```bash
# Login Attempts
RATE_LIMIT_AUTH_LOGIN_LIMIT=5
RATE_LIMIT_AUTH_LOGIN_WINDOW=900000        # 15 minutes in ms

# Signup Attempts
RATE_LIMIT_AUTH_SIGNUP_LIMIT=3
RATE_LIMIT_AUTH_SIGNUP_WINDOW=3600000      # 1 hour in ms

# Password Reset Attempts
RATE_LIMIT_AUTH_RESET_LIMIT=3
RATE_LIMIT_AUTH_RESET_WINDOW=3600000       # 1 hour in ms
```

### API Rate Limits

Configure limits based on subscription tier:

```bash
# Free Tier
RATE_LIMIT_API_FREE_LIMIT=100
RATE_LIMIT_API_FREE_WINDOW=3600000         # 1 hour in ms

# Pro Tier
RATE_LIMIT_API_PRO_LIMIT=1000
RATE_LIMIT_API_PRO_WINDOW=3600000          # 1 hour in ms
```

### Analysis Rate Limits

Configure limits for repository analysis:

```bash
# Free Tier
RATE_LIMIT_ANALYSIS_FREE_LIMIT=10
RATE_LIMIT_ANALYSIS_FREE_WINDOW=86400000   # 24 hours in ms

# Pro Tier
RATE_LIMIT_ANALYSIS_PRO_LIMIT=100
RATE_LIMIT_ANALYSIS_PRO_WINDOW=86400000    # 24 hours in ms
```

## Rate Limit Tiers

### Authentication Endpoints

| Endpoint | Limit | Window | Identifier |
|----------|-------|--------|------------|
| POST /api/auth/login | 5 | 15 min | IP Address |
| POST /api/auth/signup | 3 | 1 hour | IP Address |
| POST /api/auth/forgot-password | 3 | 1 hour | Email |
| POST /api/auth/reset-password | 3 | 1 hour | Token |

### API Endpoints

| Tier | Limit | Window | Identifier |
|------|-------|--------|------------|
| Free | 100 | 1 hour | User ID |
| Pro | 1,000 | 1 hour | User ID |
| Enterprise | Custom | Custom | User ID |

### Analysis Endpoints

| Tier | Limit | Window | Identifier |
|------|-------|--------|------------|
| Free | 10 | 24 hours | User ID |
| Pro | 100 | 24 hours | User ID |
| Enterprise | Custom | Custom | User ID |

## Response Headers

When rate limiting is active, responses include these headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

- **X-RateLimit-Limit**: Maximum requests allowed
- **X-RateLimit-Remaining**: Requests remaining in current window
- **X-RateLimit-Reset**: Unix timestamp when limit resets

## Error Responses

When rate limit is exceeded:

```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded. Please try again later.",
  "retryAfter": 900
}
```

HTTP Status: `429 Too Many Requests`

## Deployment Scenarios

### Single Instance (Development)

```bash
RATE_LIMIT_STORAGE=memory
```

Simple and fast, no external dependencies needed.

### Multi-Instance (Production)

```bash
RATE_LIMIT_STORAGE=redis
RATE_LIMIT_REDIS_URL=redis://your-redis-host:6379
```

Shared rate limiting across all instances.

### High Availability

```bash
RATE_LIMIT_STORAGE=redis
RATE_LIMIT_REDIS_URL=redis://primary:6379,redis://replica:6379
```

Use Redis Sentinel or Cluster for high availability.

## Monitoring

### Check Rate Limit Status

Monitor rate limiting in your application:

```typescript
// Get current rate limit status
const status = await rateLimiter.check('user:123', 'api');

console.log({
  limit: status.limit,
  remaining: status.remaining,
  reset: new Date(status.reset)
});
```

### Logging

Rate limit violations are logged:

```
[WARN] Rate limit exceeded: user=123, endpoint=/api/analyze, ip=192.168.1.1
```

### Metrics

Track rate limiting metrics:

- Total requests
- Rate limited requests
- Rate limit hit rate
- Top rate limited users/IPs

## Customization

### Custom Rate Limits

To add custom rate limits for specific endpoints:

```typescript
// server/middleware/rateLimiter.ts

export const customRateLimits = {
  '/api/custom-endpoint': {
    limit: 50,
    window: 3600000, // 1 hour
    identifier: 'user'
  }
};
```

### Whitelist IPs

To whitelist specific IP addresses:

```bash
RATE_LIMIT_WHITELIST=127.0.0.1,10.0.0.0/8
```

### Custom Identifiers

Rate limiting can use different identifiers:

- **IP Address**: For anonymous requests
- **User ID**: For authenticated requests
- **API Key**: For API access
- **Email**: For password reset

## Troubleshooting

### Rate Limits Not Working

**Problem**: Rate limits are not being enforced.

**Solution**:
- Check that rate limiting middleware is enabled
- Verify storage backend is configured correctly
- Check Redis connection if using Redis storage
- Review server logs for errors

### Redis Connection Issues

**Problem**: Cannot connect to Redis for rate limiting.

**Solution**:
- Verify Redis URL is correct
- Check Redis server is running
- Test connection with redis-cli
- Falls back to memory storage automatically

### Rate Limits Too Strict

**Problem**: Legitimate users are being rate limited.

**Solution**:
- Increase limits in environment variables
- Adjust time windows
- Consider whitelisting trusted IPs
- Review rate limit logs to identify patterns

### Rate Limits Too Lenient

**Problem**: Abuse is still occurring despite rate limiting.

**Solution**:
- Decrease limits
- Shorten time windows
- Add additional rate limiting layers
- Implement CAPTCHA for suspicious activity

## Security Considerations

### Distributed Attacks

Rate limiting by IP can be bypassed with distributed attacks:

- Use multiple identifiers (IP + User Agent)
- Implement CAPTCHA after threshold
- Monitor for suspicious patterns
- Use Web Application Firewall (WAF)

### Account Enumeration

Rate limiting helps prevent account enumeration:

- Limit login attempts per IP
- Limit password reset requests per email
- Use consistent error messages
- Add delays to responses

### API Key Security

For API access:

- Rate limit by API key
- Rotate keys regularly
- Monitor usage patterns
- Revoke suspicious keys

## Performance Impact

### Memory Storage

- **Overhead**: Minimal (~1ms per request)
- **Memory**: ~1KB per tracked identifier
- **Cleanup**: Automatic expiration

### Redis Storage

- **Overhead**: Low (~2-5ms per request)
- **Network**: Minimal (single Redis command)
- **Scalability**: Excellent

### PostgreSQL Storage

- **Overhead**: Moderate (~10-20ms per request)
- **Database**: Uses existing connection pool
- **Scalability**: Good

## Best Practices

1. **Use Redis in Production**: For multi-instance deployments
2. **Monitor Rate Limits**: Track violations and adjust limits
3. **Whitelist Trusted IPs**: For internal services and monitoring
4. **Layer Rate Limits**: Combine IP and user-based limits
5. **Provide Clear Errors**: Help users understand why they're limited
6. **Log Violations**: For security monitoring and analysis
7. **Test Limits**: Verify rate limiting works as expected
8. **Document Limits**: Make limits clear in API documentation

## Next Steps

- [OAuth Setup Guide](OAUTH_SETUP.md) - Configure social login
- [Email Service Guide](EMAIL_SERVICE.md) - Configure password reset
- [Security Best Practices](SECURITY_BEST_PRACTICES.md) - Production security checklist
