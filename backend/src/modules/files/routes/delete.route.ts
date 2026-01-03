import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';
import { getStorageService } from '../../../core/storage';

export function setupFilesDeleteRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  const storage = getStorageService();

  app.delete(`${baseUrl}/:id`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const file = await prisma.file.findFirst({
        where: { id: req.params.id, companyId: req.companyId! },
      });

      if (!file) {
        return res.status(404).json({ success: false, error: { message: 'File not found' } });
      }

      await storage.delete(file.objectName);
      await prisma.file.delete({ where: { id: file.id } });

      res.json({ success: true, message: 'File deleted' });
    } catch (error) {
      next(error);
    }
  });
}
