/**
 * Auth - Logout Route
 * POST /api/v1/auth/logout
 * Logout (client-side token removal)
 */

import { Express, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../core/middleware/auth';

export function setupLogoutRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
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
