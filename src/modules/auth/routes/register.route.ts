/**
 * Auth - Register Route
 * POST /api/v1/auth/register
 * Register new company + admin user
 */

import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthService } from '../service';
import { validate } from '../../../core/middleware/validate';
import { authLimiter } from '../../../core/middleware/rate-limit';
import { registerSchema } from '../schemas';

export function setupRegisterRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  const service = new AuthService(prisma);

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
}
