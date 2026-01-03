// src/core/middleware/api-version.ts
import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

/**
 * API Versioning middleware
 * Supports multiple versioning strategies:
 * - URL path versioning (e.g., /api/v1/...)
 * - Header versioning (e.g., Accept: application/vnd.api.v1+json)
 * - Custom header (e.g., API-Version: 1)
 */

export const API_VERSIONS = {
  V1: 'v1',
  V2: 'v2',
} as const;

export type ApiVersion = typeof API_VERSIONS[keyof typeof API_VERSIONS];

/**
 * Current API version (from environment or default)
 */
export const CURRENT_API_VERSION: ApiVersion = (env.API_VERSION as ApiVersion) || API_VERSIONS.V1;

/**
 * Deprecated API versions with sunset dates
 */
export const DEPRECATED_VERSIONS: Partial<Record<ApiVersion, Date>> = {
  // Example: v1 will be sunset on a specific date
  // [API_VERSIONS.V1]: new Date('2026-12-31'),
};

/**
 * Add API version headers to response
 */
export function addVersionHeaders(version: ApiVersion = CURRENT_API_VERSION) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Set current API version header
    res.setHeader('API-Version', version);
    res.setHeader('X-API-Version', version);

    // Add latest version header
    res.setHeader('X-API-Latest-Version', CURRENT_API_VERSION);

    // Add deprecation warning if applicable
    const sunsetDate = DEPRECATED_VERSIONS[version];
    if (sunsetDate) {
      res.setHeader('Deprecation', 'true');
      res.setHeader('Sunset', sunsetDate.toUTCString());
      res.setHeader(
        'Link',
        `</api/${CURRENT_API_VERSION}/docs>; rel="alternate"; title="Latest API Version"`
      );
    }

    next();
  };
}

/**
 * Parse API version from request
 * Checks multiple sources in order of preference:
 * 1. URL path (/api/v1/...)
 * 2. Custom header (API-Version)
 * 3. Accept header (application/vnd.api.v1+json)
 */
export function parseApiVersion(req: Request): ApiVersion {
  // 1. Check URL path
  const pathMatch = req.path.match(/\/api\/(v\d+)\//);
  if (pathMatch) {
    return pathMatch[1] as ApiVersion;
  }

  // 2. Check custom header
  const headerVersion = req.headers['api-version'] as string;
  if (headerVersion) {
    return headerVersion as ApiVersion;
  }

  // 3. Check Accept header
  const acceptHeader = req.headers['accept'];
  if (acceptHeader) {
    const acceptMatch = acceptHeader.match(/application\/vnd\.api\.(v\d+)\+json/);
    if (acceptMatch) {
      return acceptMatch[1] as ApiVersion;
    }
  }

  // Default to current version
  return CURRENT_API_VERSION;
}

/**
 * Validate API version and add headers
 */
export function apiVersion(req: Request, res: Response, next: NextFunction) {
  const version = parseApiVersion(req);

  // Validate version exists
  const validVersions = Object.values(API_VERSIONS);
  if (!validVersions.includes(version)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_API_VERSION',
        message: `Invalid API version: ${version}`,
        validVersions,
      },
    });
  }

  // Attach version to request for downstream use
  (req as any).apiVersion = version;

  // Add version headers
  addVersionHeaders(version)(req, res, next);
}

/**
 * Require specific API version
 */
export function requireVersion(requiredVersion: ApiVersion) {
  return (req: Request, res: Response, next: NextFunction) => {
    const version = parseApiVersion(req);

    if (version !== requiredVersion) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'WRONG_API_VERSION',
          message: `This endpoint requires API version ${requiredVersion}`,
          currentVersion: version,
        },
      });
    }

    next();
  };
}

/**
 * Deprecate an endpoint with migration info
 */
export function deprecateEndpoint(options: {
  sunsetDate?: Date;
  alternativeEndpoint?: string;
  message?: string;
}) {
  const { sunsetDate, alternativeEndpoint, message } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Add deprecation headers
    res.setHeader('Deprecation', 'true');

    if (sunsetDate) {
      res.setHeader('Sunset', sunsetDate.toUTCString());
    }

    if (alternativeEndpoint) {
      res.setHeader('Link', `<${alternativeEndpoint}>; rel="alternate"`);
    }

    // Add warning header with message
    const warningMessage =
      message ||
      `This endpoint is deprecated${sunsetDate ? ` and will be removed on ${sunsetDate.toDateString()}` : ''}`;

    res.setHeader('Warning', `299 - "${warningMessage}"`);

    next();
  };
}

/**
 * API version compatibility check
 */
export function checkVersionCompatibility(
  minVersion: ApiVersion,
  maxVersion?: ApiVersion
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const version = parseApiVersion(req);

    const versionNumber = parseInt(version.replace('v', ''));
    const minVersionNumber = parseInt(minVersion.replace('v', ''));
    const maxVersionNumber = maxVersion ? parseInt(maxVersion.replace('v', '')) : Infinity;

    if (versionNumber < minVersionNumber || versionNumber > maxVersionNumber) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INCOMPATIBLE_API_VERSION',
          message: `This endpoint requires API version between ${minVersion} and ${maxVersion || 'latest'}`,
          currentVersion: version,
        },
      });
    }

    next();
  };
}

/**
 * Migration guide middleware
 * Returns migration information for deprecated versions
 */
export function migrationGuide(req: Request, res: Response, next: NextFunction) {
  const version = parseApiVersion(req);
  const sunsetDate = DEPRECATED_VERSIONS[version];

  if (sunsetDate) {
    // Attach migration info to response
    const originalJson = res.json.bind(res);
    res.json = function (body: any) {
      const enhancedBody = {
        ...body,
        _migration: {
          deprecated: true,
          currentVersion: version,
          latestVersion: CURRENT_API_VERSION,
          sunsetDate: sunsetDate.toISOString(),
          migrationGuide: `/api/${CURRENT_API_VERSION}/docs/migration`,
        },
      };
      return originalJson(enhancedBody);
    };
  }

  next();
}
