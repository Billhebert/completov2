/**
 * Settings - Get Route
 * GET /api/v1/settings
 * Get current system settings (admin only)
 */

import { Express, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../../core/logger';
import { authenticate } from '../../../core/middleware/auth';

export function setupSettingsGetRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}`, authenticate, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;

      if (!['DEV', 'admin'].includes(user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const settings = await prisma.systemSettings.findFirst({
        orderBy: { createdAt: 'desc' },
      });

      if (!settings) {
        return res.json({
          serviceFeePercentage: 10.0,
          minServiceFee: 5.0,
          maxServiceFee: null,
          currency: 'BRL',
          metadata: null,
        });
      }

      logger.info({ userId: user.id }, 'System settings retrieved');
      res.json(settings);
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error getting system settings');
      res.status(500).json({ error: 'Failed to get system settings' });
    }
  });
}
