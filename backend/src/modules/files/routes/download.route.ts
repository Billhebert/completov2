import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';
import { getStorageService } from '../../../core/storage';

export function setupFilesDownloadRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  const storage = getStorageService();

  app.get(`${baseUrl}/:id/download`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const file = await prisma.file.findFirst({
        where: { id: req.params.id, companyId: req.companyId! },
      });

      if (!file) {
        return res.status(404).json({ success: false, error: { message: 'File not found' } });
      }

      const buffer = await storage.download(file.objectName);

      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  });
}
