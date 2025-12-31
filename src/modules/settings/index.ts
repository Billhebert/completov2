// src/modules/settings/index.ts
import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../core/logger';
import { authenticate } from '../../core/middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Alias for consistency
const authenticateToken = authenticate;

// ============================================
// SYSTEM SETTINGS
// ============================================

// GET /api/v1/settings - Get current system settings (DEV/admin only)
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    // Only DEV and admin can access system settings
    if (!['DEV', 'admin'].includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const settings = await prisma.systemSettings.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!settings) {
      // Return default settings if none exist
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

// PUT /api/v1/settings - Update system settings (DEV/admin only)
router.put('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    // Only DEV and admin can update system settings
    if (!['DEV', 'admin'].includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const {
      serviceFeePercentage,
      minServiceFee,
      maxServiceFee,
      currency,
      metadata,
    } = req.body;

    // Validate fee percentage
    if (serviceFeePercentage !== undefined) {
      if (serviceFeePercentage < 0 || serviceFeePercentage > 100) {
        return res.status(400).json({ error: 'Service fee percentage must be between 0 and 100' });
      }
    }

    // Validate min fee
    if (minServiceFee !== undefined && minServiceFee < 0) {
      return res.status(400).json({ error: 'Minimum service fee must be non-negative' });
    }

    // Validate max fee
    if (maxServiceFee !== undefined && maxServiceFee !== null) {
      if (maxServiceFee < 0) {
        return res.status(400).json({ error: 'Maximum service fee must be non-negative' });
      }
      if (minServiceFee !== undefined && maxServiceFee < minServiceFee) {
        return res.status(400).json({ error: 'Maximum service fee must be greater than minimum' });
      }
    }

    // Get current settings
    const currentSettings = await prisma.systemSettings.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    let settings;

    if (currentSettings) {
      // Update existing settings
      settings = await prisma.systemSettings.update({
        where: { id: currentSettings.id },
        data: {
          serviceFeePercentage,
          minServiceFee,
          maxServiceFee,
          currency,
          metadata,
          updatedBy: user.id,
        },
      });
    } else {
      // Create new settings
      settings = await prisma.systemSettings.create({
        data: {
          serviceFeePercentage: serviceFeePercentage || 10.0,
          minServiceFee: minServiceFee || 5.0,
          maxServiceFee,
          currency: currency || 'BRL',
          metadata,
          updatedBy: user.id,
        },
      });
    }

    logger.info({ userId: user.id, settingsId: settings.id }, 'System settings updated');
    res.json(settings);
  } catch (error: any) {
    logger.error({ error: error.message }, 'Error updating system settings');
    res.status(500).json({ error: 'Failed to update system settings' });
  }
});

// GET /api/v1/settings/history - Get settings history (DEV/admin only)
router.get('/history', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    // Only DEV and admin can access system settings
    if (!['DEV', 'admin'].includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { page = 1, pageSize = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(pageSize);
    const take = Number(pageSize);

    const [history, total] = await Promise.all([
      prisma.systemSettings.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.systemSettings.count(),
    ]);

    logger.info({ userId: user.id, count: history.length }, 'Settings history retrieved');

    res.json({
      data: history,
      total,
      page: Number(page),
      pageSize: take,
      totalPages: Math.ceil(total / take),
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Error getting settings history');
    res.status(500).json({ error: 'Failed to get settings history' });
  }
});

export default router;
