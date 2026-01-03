import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';
import { getStorageService } from '../../../core/storage';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

export function setupFilesAvatarRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  const storage = getStorageService();

  app.post(`${baseUrl}/avatar`, authenticate, tenantIsolation, upload.single('avatar'), async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, error: { message: 'No file provided' } });
      }

      const objectName = await storage.upload(req.file.buffer, req.file.originalname, req.file.mimetype, 'avatars');

      await prisma.user.update({
        where: { id: req.user!.id },
        data: { avatar: objectName },
      });

      const url = await storage.getUrl(objectName);
      res.json({ success: true, data: { avatar: objectName, url } });
    } catch (error) {
      next(error);
    }
  });
}
