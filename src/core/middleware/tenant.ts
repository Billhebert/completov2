// src/core/middleware/tenant.ts
import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../errors';

/**
 * Ensure user can only access their own company data
 * This middleware MUST be used after authenticate()
 */
export function tenantIsolation(req: Request, res: Response, next: NextFunction) {
  if (!req.user || !req.companyId) {
    return next(new UnauthorizedError('Authentication required'));
  }

  // Store companyId for use in repositories/services
  req.companyId = req.user.companyId;

  next();
}

/**
 * Validate that a resource belongs to the user's company
 */
export function validateTenantAccess(
  getCompanyId: (req: Request) => string | Promise<string>
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.companyId) {
        return next(new UnauthorizedError('Authentication required'));
      }

      const resourceCompanyId = await getCompanyId(req);

      if (resourceCompanyId !== req.companyId) {
        return next(
          new ForbiddenError('Access denied: resource belongs to another company')
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
