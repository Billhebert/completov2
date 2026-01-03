import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, adminOnly } from '../../../core/middleware';

export function setupDeduplicationRollbackRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(`${baseUrl}/rollback/:mergeId`, authenticate, tenantIsolation, adminOnly, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const merge = await prisma.mergeHistory.findFirst({
        where: {
          id: req.params.mergeId,
          companyId: req.companyId!,
        },
      });

      if (!merge) {
        return res.status(404).json({ success: false, error: { message: 'Merge not found' } });
      }

      // Restaurar entidade merged (recreate since we use hard delete)
      if (merge.entityType === 'contact') {
        const contactData = merge.mergedData as any;
        await prisma.contact.create({
          data: {
            id: merge.mergedId,
            companyId: req.companyId!,
            name: contactData.name || 'Unknown',
            email: contactData.email,
            phone: contactData.phone,
            companyName: contactData.companyName,
            position: contactData.position,
            tags: contactData.tags || [],
            customFields: contactData.customFields || {},
            leadScore: contactData.leadScore || 0,
            leadSource: contactData.leadSource,
          },
        });
      }

      res.json({ success: true, message: 'Merge rolled back' });
    } catch (error) {
      next(error);
    }
  });
}
