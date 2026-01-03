import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, validateBody } from '../../../core/middleware';
import { z } from 'zod';

const feedbackSchema = z.object({
  detectionId: z.string(),
  action: z.enum(['accept', 'reject', 'ignore']),
});

export function setupDeduplicationFeedbackRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(`${baseUrl}/feedback`, authenticate, tenantIsolation, validateBody(feedbackSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { detectionId, action } = req.body;

      await prisma.duplicateDetection.update({
        where: { id: detectionId },
        data: {
          status: action === 'accept' ? 'merged' : action === 'reject' ? 'rejected' : 'ignored',
          reviewedAt: new Date(),
          reviewedBy: req.user!.id,
        },
      });

      res.json({ success: true, message: 'Feedback saved' });
    } catch (error) {
      next(error);
    }
  });
}
