import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';
import { getStorageService } from '../../../core/storage';

export function setupFilesGetUrlRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  const storage = getStorageService();

  app.get(`${baseUrl}/:id/url`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const file = await prisma.file.findFirst({
        where: { id: req.params.id, companyId: req.companyId! },
      });

      if (!file) {
        return res.status(404).json({ success: false, error: { message: 'File not found' } });
      }

      const url = await storage.getUrl(file.objectName);
      res.json({ success: true, data: { url, expiresIn: 3600 } });
    } catch (error) {
      next(error);
    }
  });
}
