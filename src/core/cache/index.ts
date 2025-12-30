// src/core/cache/index.ts
import Redis from 'ioredis';
import { env } from '../config/env';
import { logger } from '../logger';

export class CacheService {
  private client: Redis;

  constructor(redisUrl?: string) {
    this.client = new Redis(redisUrl || env.REDIS_URL, {
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    this.client.on('error', (error) => {
      logger.error({ error }, 'Redis cache error');
    });

    this.client.on('connect', () => {
      logger.info('Cache service connected to Redis');
    });
  }

  /**
   * Get cached value
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error({ error, key }, 'Cache get failed');
      return null;
    }
  }

  /**
   * Set cached value
   */
  async set(key: string, value: any, ttlSeconds = 3600): Promise<void> {
    try {
      await this.client.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      logger.error({ error, key }, 'Cache set failed');
    }
  }

  /**
   * Delete cached value
   */
  async delete(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      logger.error({ error, key }, 'Cache delete failed');
    }
  }

  /**
   * Delete multiple keys by pattern
   */
  async deletePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
      }
    } catch (error) {
      logger.error({ error, pattern }, 'Cache delete pattern failed');
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error({ error, key }, 'Cache exists check failed');
      return false;
    }
  }

  /**
   * Increment value
   */
  async increment(key: string, amount = 1): Promise<number> {
    try {
      return await this.client.incrby(key, amount);
    } catch (error) {
      logger.error({ error, key }, 'Cache increment failed');
      return 0;
    }
  }

  /**
   * Set with expiry (milliseconds)
   */
  async setWithExpiry(key: string, value: any, ttlMs: number): Promise<void> {
    try {
      await this.client.psetex(key, ttlMs, JSON.stringify(value));
    } catch (error) {
      logger.error({ error, key }, 'Cache setWithExpiry failed');
    }
  }

  /**
   * Get or set (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds = 3600
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Not in cache, compute value
    const value = await factory();

    // Store in cache
    await this.set(key, value, ttlSeconds);

    return value;
  }

  /**
   * Cache decorator for methods
   */
  cacheDecorator(ttlSeconds = 3600) {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
      const originalMethod = descriptor.value;

      descriptor.value = async function (this: any, ...args: any[]) {
        const cacheKey = `cache:${target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`;

        if (this.cache) {
          const cached = await this.cache.get(cacheKey);
          if (cached !== null) {
            return cached;
          }
        }

        const result = await originalMethod.apply(this, args);

        if (this.cache) {
          await this.cache.set(cacheKey, result, ttlSeconds);
        }

        return result;
      };

      return descriptor;
    };
  }

  /**
   * Clear all cache
   */
  async flush(): Promise<void> {
    try {
      await this.client.flushdb();
      logger.info('Cache flushed');
    } catch (error) {
      logger.error({ error }, 'Cache flush failed');
    }
  }

  /**
   * Get cache stats
   */
  async getStats(): Promise<any> {
    try {
      const info = await this.client.info('stats');
      return info;
    } catch (error) {
      logger.error({ error }, 'Failed to get cache stats');
      return null;
    }
  }
}

// Singleton
let cacheService: CacheService | null = null;

export function getCacheService(): CacheService {
  if (!cacheService) {
    cacheService = new CacheService();
  }
  return cacheService;
}

// Cache middleware for Express
export function cacheMiddleware(ttlSeconds = 60) {
  const cache = getCacheService();

  return async (req: any, res: any, next: any) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = `http:${req.originalUrl || req.url}:${req.companyId || 'public'}`;

    try {
      const cached = await cache.get(key);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(cached);
      }

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache response
      res.json = function (data: any) {
        cache.set(key, data, ttlSeconds);
        res.setHeader('X-Cache', 'MISS');
        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error({ error }, 'Cache middleware error');
      next();
    }
  };
}
