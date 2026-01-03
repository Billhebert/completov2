// src/core/middleware/etag.ts
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

/**
 * ETag middleware for HTTP caching
 * Generates ETags based on response body and supports conditional requests
 *
 * Usage:
 * - Automatically generates ETag header for GET responses
 * - Supports If-None-Match header for 304 Not Modified responses
 * - Reduces bandwidth usage by avoiding unchanged content transmission
 */

/**
 * Generate ETag from content
 */
function generateETag(content: string | Buffer): string {
  const hash = crypto
    .createHash('sha256')
    .update(content)
    .digest('base64')
    .substring(0, 27); // RFC 7232 recommends quoted string

  return `"${hash}"`;
}

/**
 * Check if ETags match
 */
function matchesETag(requestETag: string | undefined, responseETag: string): boolean {
  if (!requestETag) return false;

  // Handle multiple ETags in If-None-Match header
  const etags = requestETag.split(',').map(tag => tag.trim());

  // Check for * (matches any)
  if (etags.includes('*')) return true;

  // Check for exact match
  return etags.includes(responseETag);
}

/**
 * ETag middleware
 * Automatically adds ETag headers and handles conditional requests
 */
export function etag(options: { weak?: boolean } = {}) {
  const { weak = false } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Only apply to GET and HEAD requests
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return next();
    }

    // Store original res.json to intercept response
    const originalJson = res.json.bind(res);

    // Override res.json to add ETag
    res.json = function (body: any) {
      // Convert body to string for hash generation
      const content = JSON.stringify(body);

      // Generate ETag
      const etagValue = generateETag(content);
      const etagHeader = weak ? `W/${etagValue}` : etagValue;

      // Set ETag header
      res.setHeader('ETag', etagHeader);

      // Check If-None-Match header for conditional request
      const ifNoneMatch = req.headers['if-none-match'];

      if (matchesETag(ifNoneMatch, etagValue)) {
        // Content hasn't changed, return 304 Not Modified
        res.removeHeader('Content-Type');
        res.removeHeader('Content-Length');
        return res.status(304).end();
      }

      // Content has changed or no If-None-Match header, return full response
      return originalJson(body);
    };

    next();
  };
}

/**
 * Weak ETag middleware (recommended for dynamic content)
 * Weak ETags indicate semantic equivalence rather than byte-for-byte equality
 */
export const weakETag = etag({ weak: true });

/**
 * Strong ETag middleware (for static/immutable content)
 * Strong ETags indicate exact byte-for-byte equality
 */
export const strongETag = etag({ weak: false });

/**
 * Cache-Control middleware
 * Sets appropriate Cache-Control headers
 */
export function cacheControl(options: {
  maxAge?: number;
  sMaxAge?: number;
  private?: boolean;
  noStore?: boolean;
  noCache?: boolean;
  mustRevalidate?: boolean;
} = {}) {
  const {
    maxAge,
    sMaxAge,
    private: isPrivate = false,
    noStore = false,
    noCache = false,
    mustRevalidate = false,
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const directives: string[] = [];

    if (noStore) {
      directives.push('no-store');
    }

    if (noCache) {
      directives.push('no-cache');
    }

    if (isPrivate) {
      directives.push('private');
    } else {
      directives.push('public');
    }

    if (maxAge !== undefined) {
      directives.push(`max-age=${maxAge}`);
    }

    if (sMaxAge !== undefined) {
      directives.push(`s-maxage=${sMaxAge}`);
    }

    if (mustRevalidate) {
      directives.push('must-revalidate');
    }

    if (directives.length > 0) {
      res.setHeader('Cache-Control', directives.join(', '));
    }

    next();
  };
}

/**
 * Common cache control presets
 */

// No caching (for sensitive/dynamic data)
export const noCache = cacheControl({
  noStore: true,
  noCache: true,
  private: true,
});

// Short cache (5 minutes) for frequently changing data
export const shortCache = cacheControl({
  maxAge: 300, // 5 minutes
  private: true,
  mustRevalidate: true,
});

// Medium cache (1 hour) for semi-static data
export const mediumCache = cacheControl({
  maxAge: 3600, // 1 hour
  sMaxAge: 3600,
  mustRevalidate: true,
});

// Long cache (1 day) for static data
export const longCache = cacheControl({
  maxAge: 86400, // 1 day
  sMaxAge: 86400,
});

// Immutable cache (1 year) for versioned static assets
export const immutableCache = cacheControl({
  maxAge: 31536000, // 1 year
  immutable: true,
} as any);

/**
 * Last-Modified middleware
 * Sets Last-Modified header based on resource timestamp
 */
export function lastModified(getTimestamp: (req: Request) => Date | undefined) {
  return (req: Request, res: Response, next: NextFunction) => {
    const timestamp = getTimestamp(req);

    if (timestamp) {
      const lastModifiedDate = timestamp.toUTCString();
      res.setHeader('Last-Modified', lastModifiedDate);

      // Check If-Modified-Since header
      const ifModifiedSince = req.headers['if-modified-since'];
      if (ifModifiedSince) {
        const requestDate = new Date(ifModifiedSince);
        if (timestamp <= requestDate) {
          // Not modified, return 304
          return res.status(304).end();
        }
      }
    }

    next();
  };
}
