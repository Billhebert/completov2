/**
 * Auth - Get Current User Route
 * GET /api/v1/auth/me
 * Get authenticated user information
 */

import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../service';
import { authenticate } from '../../../core/middleware/auth';

export function setupMeRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  const service = new AuthService(prisma);

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
}
