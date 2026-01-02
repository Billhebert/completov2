/**
 * Auth - Login Route
 * POST /api/v1/auth/login
 * Login with email/password + optional 2FA
 */

import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../service';
import { validate } from '../../../core/middleware/validate';
import { authLimiter } from '../../../core/middleware/rate-limit';
import { loginSchema } from '../schemas';

export function setupLoginRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  const service = new AuthService(prisma);

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
}
