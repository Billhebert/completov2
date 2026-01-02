/**
 * Auth - Disable 2FA Route
 * POST /api/v1/auth/2fa/disable
 * Disable Two-Factor Authentication
 */

import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../service';
import { authenticate } from '../../../core/middleware/auth';
import { validate } from '../../../core/middleware/validate';
import { disable2FASchema } from '../schemas';

export function setup2FADisableRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  const service = new AuthService(prisma);

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
}
