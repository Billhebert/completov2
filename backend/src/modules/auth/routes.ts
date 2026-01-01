// src/modules/auth/routes.ts
import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthService } from './service';
import { validate } from '../../core/middleware/validate';
import { authenticate } from '../../core/middleware/auth';
import { authLimiter } from '../../core/middleware/rate-limit';
import {
  loginSchema,
  registerSchema,
  refreshTokenSchema,
  setup2FASchema,
  verify2FASchema,
  disable2FASchema,
} from './schemas';

export function setupAuthRoutes(app: Express, prisma: PrismaClient) {
  const service = new AuthService(prisma);
  const baseUrl = '/api/v1/auth';

  /**
   * POST /api/v1/auth/login
   * Login with email/password (+ optional 2FA)
   */
  app.post(
    `${baseUrl}/login`,
    authLimiter,
    validate(loginSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { email, password, code2FA } = req.body;
        const result = await service.login(email, password, code2FA);
        res.json({ success: true, data: result });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * POST /api/v1/auth/register
   * Register new company + admin user
   */
  app.post(
    `${baseUrl}/register`,
    authLimiter,
    validate(registerSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const result = await service.register(req.body);
        res.status(201).json({ success: true, data: result });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * POST /api/v1/auth/refresh
   * Refresh access token
   */
  app.post(
    `${baseUrl}/refresh`,
    validate(refreshTokenSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { refreshToken } = req.body;
        const result = await service.refreshToken(refreshToken);
        res.json({ success: true, data: result });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * GET /api/v1/auth/me
   * Get current user info
   */
  app.get(
    `${baseUrl}/me`,
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const user = await service.getMe(req.user!.id);
        res.json({ success: true, data: user });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * POST /api/v1/auth/2fa/setup
   * Setup 2FA (returns QR code)
   */
  app.post(
    `${baseUrl}/2fa/setup`,
    authenticate,
    validate(setup2FASchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { password } = req.body;
        const result = await service.setup2FA(req.user!.id, password);
        res.json({ success: true, data: result });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * POST /api/v1/auth/2fa/verify
   * Verify 2FA token and enable it
   */
  app.post(
    `${baseUrl}/2fa/verify`,
    authenticate,
    validate(verify2FASchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { token } = req.body;
        const result = await service.verify2FA(req.user!.id, token);
        res.json({ success: true, data: result });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * POST /api/v1/auth/2fa/disable
   * Disable 2FA
   */
  app.post(
    `${baseUrl}/2fa/disable`,
    authenticate,
    validate(disable2FASchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { password, token } = req.body;
        const result = await service.disable2FA(req.user!.id, password, token);
        res.json({ success: true, data: result });
      } catch (error) {
        next(error);
      }
    }
  );

  /**
   * POST /api/v1/auth/logout
   * Logout (client-side token removal)
   */
  app.post(
    `${baseUrl}/logout`,
    authenticate,
    (req: Request, res: Response) => {
      // In a stateless JWT system, logout is handled client-side
      // Optionally: implement token blacklist in Redis
      res.json({ success: true, message: 'Logged out successfully' });
    }
  );
}
