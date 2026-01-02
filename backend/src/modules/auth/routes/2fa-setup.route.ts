/**
 * Auth - Setup 2FA Route
 * POST /api/v1/auth/2fa/setup
 * Setup Two-Factor Authentication (returns QR code)
 */

import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../service';
import { authenticate } from '../../../core/middleware/auth';
import { validate } from '../../../core/middleware/validate';
import { setup2FASchema } from '../schemas';

export function setup2FASetupRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  const service = new AuthService(prisma);

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
}
