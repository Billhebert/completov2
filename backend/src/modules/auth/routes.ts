/**
 * Auth Routes - Index
 * Centralized route registration for Auth module
 *
 * This file imports and registers all individual auth routes.
 * Each route is in its own file for maximum modularity.
 */

import { Express } from 'express';
import { PrismaClient } from '@prisma/client';

// Import individual route setup functions
import { setupLoginRoute } from './routes/login.route';
import { setupRegisterRoute } from './routes/register.route';
import { setupRefreshRoute } from './routes/refresh.route';
import { setupMeRoute } from './routes/me.route';
import { setup2FASetupRoute } from './routes/2fa-setup.route';
import { setup2FAVerifyRoute } from './routes/2fa-verify.route';
import { setup2FADisableRoute } from './routes/2fa-disable.route';
import { setupLogoutRoute } from './routes/logout.route';

/**
 * Setup all auth routes
 * @param app - Express application
 * @param prisma - Prisma client
 */
export function setupAuthRoutes(app: Express, prisma: PrismaClient) {
  const baseUrl = '/api/v1/auth';

  // Public routes
  setupLoginRoute(app, prisma, baseUrl);
  setupRegisterRoute(app, prisma, baseUrl);
  setupRefreshRoute(app, prisma, baseUrl);

  // Protected routes
  setupMeRoute(app, prisma, baseUrl);
  setupLogoutRoute(app, prisma, baseUrl);

  // 2FA routes
  setup2FASetupRoute(app, prisma, baseUrl);
  setup2FAVerifyRoute(app, prisma, baseUrl);
  setup2FADisableRoute(app, prisma, baseUrl);
}

/**
 * Route Summary:
 *
 * PUBLIC ROUTES:
 * - POST   /api/v1/auth/login          - Login with email/password + optional 2FA
 * - POST   /api/v1/auth/register       - Register new company + admin user
 * - POST   /api/v1/auth/refresh        - Refresh access token
 *
 * PROTECTED ROUTES:
 * - GET    /api/v1/auth/me             - Get current user info
 * - POST   /api/v1/auth/logout         - Logout (client-side token removal)
 *
 * 2FA ROUTES (Protected):
 * - POST   /api/v1/auth/2fa/setup      - Setup 2FA (returns QR code)
 * - POST   /api/v1/auth/2fa/verify     - Verify 2FA token and enable
 * - POST   /api/v1/auth/2fa/disable    - Disable 2FA
 */
