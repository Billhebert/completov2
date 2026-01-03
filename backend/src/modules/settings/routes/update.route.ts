/**
 * Settings - Update Route
 * PUT /api/v1/settings
 * Update system settings (admin only)
 */

import { Express, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../../core/logger';
import { authenticate } from '../../../core/middleware/auth';

export function setupSettingsUpdateRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.put(`${baseUrl}`, authenticate, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;

      if (!['DEV', 'admin'].includes(user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const { serviceFeePercentage, minServiceFee, maxServiceFee, currency, metadata } = req.body;

      if (serviceFeePercentage !== undefined) {
        if (serviceFeePercentage < 0 || serviceFeePercentage > 100) {
          return res.status(400).json({ error: 'Service fee percentage must be between 0 and 100' });
        }
      }

      if (minServiceFee !== undefined && minServiceFee < 0) {
        return res.status(400).json({ error: 'Minimum service fee must be non-negative' });
      }

      if (maxServiceFee !== undefined && maxServiceFee !== null) {
        if (maxServiceFee < 0) {
          return res.status(400).json({ error: 'Maximum service fee must be non-negative' });
        }
        if (minServiceFee !== undefined && maxServiceFee < minServiceFee) {
          return res.status(400).json({ error: 'Maximum service fee must be greater than minimum' });
        }
      }

      const currentSettings = await prisma.systemSettings.findFirst({
        orderBy: { createdAt: 'desc' },
      });

      let settings;

      if (currentSettings) {
        settings = await prisma.systemSettings.update({
          where: { id: currentSettings.id },
          data: { serviceFeePercentage, minServiceFee, maxServiceFee, currency, metadata },
        });
      } else {
        settings = await prisma.systemSettings.create({
          data: {
            serviceFeePercentage: serviceFeePercentage ?? 10.0,
            minServiceFee: minServiceFee ?? 5.0,
            maxServiceFee,
            currency: currency ?? 'BRL',
            metadata,
          },
        });
      }

      logger.info({ userId: user.id }, 'System settings updated');
      res.json(settings);
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error updating system settings');
      res.status(500).json({ error: 'Failed to update system settings' });
    }
  });
}
