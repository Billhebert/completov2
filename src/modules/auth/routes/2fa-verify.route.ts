/**
 * Auth - Verify 2FA Route
 * POST /api/v1/auth/2fa/verify
 * Verify 2FA token and enable Two-Factor Authentication
 */

import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../service';
import { authenticate } from '../../../core/middleware/auth';
import { validate } from '../../../core/middleware/validate';
import { verify2FASchema } from '../schemas';

export function setup2FAVerifyRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  const service = new AuthService(prisma);

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
}
