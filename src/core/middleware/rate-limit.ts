// src/core/middleware/rate-limit.ts
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import Redis from 'ioredis';
import { TooManyRequestsError } from '../errors';
import { env } from '../config/env';

// Redis store for distributed rate limiting
class RedisStore {
  private client: Redis;
  private prefix: string;

  constructor(client: Redis, prefix = 'rl:') {
    this.client = client;
    this.prefix = prefix;
  }

  async increment(key: string): Promise<{ totalHits: number; resetTime: Date }> {
    const fullKey = `${this.prefix}${key}`;
    const now = Date.now();
    const windowMs = env.RATE_LIMIT_WINDOW_MS;
    const resetTime = new Date(now + windowMs);

    const multi = this.client.multi();
    multi.incr(fullKey);
    multi.pexpire(fullKey, windowMs);

    const results = await multi.exec();
    const totalHits = (results?.[0]?.[1] as number) || 1;

    return { totalHits, resetTime };
  }

  async decrement(key: string): Promise<void> {
    const fullKey = `${this.prefix}${key}`;
    await this.client.decr(fullKey);
  }

  async resetKey(key: string): Promise<void> {
    const fullKey = `${this.prefix}${key}`;
    await this.client.del(fullKey);
  }
}

// Create rate limiter instance
export function createRateLimiter(options: {
  windowMs?: number;
  max?: number;
  message?: string;
  keyGenerator?: (req: any) => string;
}) {

  const {
    windowMs = env.RATE_LIMIT_WINDOW_MS,
    max = env.RATE_LIMIT_MAX,
    message = 'Too many requests, please try again later',
    // ✅ default seguro para IPv6
    keyGenerator = (req) => ipKeyGenerator(req),
  } = options;

  let redisClient: Redis | undefined;

  try {
    redisClient = new Redis(env.REDIS_URL, {
      retryStrategy: () => null,
      enableOfflineQueue: false,
    });
  } catch {
    // Fall back to memory store if Redis is unavailable
  }

  return rateLimit({
    windowMs,
    limit: max, // ✅ express-rate-limit v7 usa "limit" (max ainda funciona em algumas versões, mas aqui garantimos)
    message,
    keyGenerator,
    handler: () => {
      throw new TooManyRequestsError(message);
    },
    skip: () => env.NODE_ENV === 'test',
    ...(redisClient && {
      store: new RedisStore(redisClient) as any, // (se TS reclamar, tipamos depois)
    }),
  });
}

// Pre-configured rate limiters
export const apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many API requests from this IP',
});

export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts',
  // ✅ email + ip normalizado (evita bypass IPv6)
  keyGenerator: (req) => `${String(req.body?.email ?? 'unknown').toLowerCase()}:${ipKeyGenerator(req)}`,
});

export const strictLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Rate limit exceeded',
});
