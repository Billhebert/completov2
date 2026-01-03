import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';
import { getStorageService } from '../../../core/storage';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

export function setupFilesUploadRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  const storage = getStorageService();

  app.post(`${baseUrl}/upload`, authenticate, tenantIsolation, upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: { message: 'No file provided' } });
      }

      const { entityType, entityId } = req.body;
      const objectName = await storage.upload(req.file.buffer, req.file.originalname, req.file.mimetype, entityType || 'general');

      const file = await prisma.file.create({
        data: {
          companyId: req.companyId!,
          uploadedById: req.user!.id,
          filename: req.file.originalname,
          objectName,
          mimeType: req.file.mimetype,
          size: req.file.size,
          entityType,
          entityId,
        },
      });

      res.status(201).json({ success: true, data: file });
    } catch (error) {
      next(error);
    }
  });
}
