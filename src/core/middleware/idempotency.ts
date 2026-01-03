// src/core/middleware/idempotency.ts
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { BadRequestError } from '../errors';
import { env } from '../config/env';

/**
 * Idempotency result storage
 * In production, use Redis for distributed systems and TTL support
 */
interface IdempotencyRecord {
  statusCode: number;
  headers: Record<string, string>;
  body: any;
  createdAt: number;
}

class IdempotencyStore {
  private store: Map<string, IdempotencyRecord> = new Map();
  private readonly TTL = 24 * 60 * 60 * 1000; // 24 hours

  async get(key: string): Promise<IdempotencyRecord | null> {
    const record = this.store.get(key);

    if (!record) {
      return null;
    }

    // Check if expired
    if (Date.now() - record.createdAt > this.TTL) {
      this.store.delete(key);
      return null;
    }

    return record;
  }

  async set(key: string, record: IdempotencyRecord): Promise<void> {
    this.store.set(key, record);

    // Cleanup old entries periodically
    this.cleanup();
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now - record.createdAt > this.TTL) {
        this.store.delete(key);
      }
    }
  }
}

const idempotencyStore = new IdempotencyStore();

/**
 * Generate idempotency key from request
 */
function generateIdempotencyKey(req: Request, idempotencyKey: string): string {
  const userId = req.user?.id || 'anonymous';
  const companyId = req.companyId || 'no-company';

  // Include user, company, and idempotency key for isolation
  return crypto
    .createHash('sha256')
    .update(`${userId}:${companyId}:${idempotencyKey}`)
    .digest('hex');
}

/**
 * Idempotency middleware for POST/PATCH routes
 *
 * Usage:
 * - Client must send Idempotency-Key header with unique value (UUID recommended)
 * - If duplicate request detected within TTL, returns cached response
 * - If request fails, idempotency key is cleared for retry
 *
 * Example:
 *   app.post('/api/v1/crm/deals', idempotency, handler)
 */
export function idempotency(options: { required?: boolean } = {}) {
  const { required = true } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip for GET, HEAD, OPTIONS (safe methods)
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    // Skip in test environment
    if (env.NODE_ENV === 'test') {
      return next();
    }

    // Get idempotency key from header
    const idempotencyKey = req.headers['idempotency-key'] as string;

    // If no key provided
    if (!idempotencyKey) {
      if (required) {
        throw new BadRequestError(
          'Idempotency-Key header is required for this operation'
        );
      }
      return next();
    }

    // Validate key format (should be UUID or similar)
    if (!/^[a-zA-Z0-9\-_]{16,128}$/.test(idempotencyKey)) {
      throw new BadRequestError(
        'Idempotency-Key must be 16-128 alphanumeric characters'
      );
    }

    // Generate storage key
    const storageKey = generateIdempotencyKey(req, idempotencyKey);

    try {
      // Check if we have a cached response
      const cached = await idempotencyStore.get(storageKey);

      if (cached) {
        // Return cached response
        res.status(cached.statusCode);

        // Set cached headers
        Object.entries(cached.headers).forEach(([key, value]) => {
          res.setHeader(key, value);
        });

        // Add idempotency header to indicate cached response
        res.setHeader('X-Idempotent-Replayed', 'true');

        return res.json(cached.body);
      }

      // Store original res.json to intercept response
      const originalJson = res.json.bind(res);

      // Override res.json to cache successful responses
      res.json = function (body: any) {
        // Only cache successful responses (2xx)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const record: IdempotencyRecord = {
            statusCode: res.statusCode,
            headers: {
              'content-type': res.getHeader('content-type') as string,
            },
            body,
            createdAt: Date.now(),
          };

          // Store asynchronously (don't block response)
          idempotencyStore.set(storageKey, record).catch(err => {
            console.error('Failed to store idempotency record:', err);
          });
        }

        // Call original json method
        return originalJson(body);
      };

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Idempotency middleware that's required for all requests
 */
export const requireIdempotency = idempotency({ required: true });

/**
 * Idempotency middleware that's optional (recommended for backward compatibility)
 */
export const optionalIdempotency = idempotency({ required: false });

/**
 * Clear idempotency cache for a specific key (useful for testing or manual intervention)
 */
export async function clearIdempotencyKey(
  userId: string,
  companyId: string,
  idempotencyKey: string
): Promise<void> {
  const storageKey = crypto
    .createHash('sha256')
    .update(`${userId}:${companyId}:${idempotencyKey}`)
    .digest('hex');

  await idempotencyStore.delete(storageKey);
}
