/**
 * Auth - Refresh Token Route
 * POST /api/v1/auth/refresh
 * Refresh access token using refresh token
 */

import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../service';
import { validate } from '../../../core/middleware/validate';
import { refreshTokenSchema } from '../schemas';

export function setupRefreshRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  const service = new AuthService(prisma);

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
}
