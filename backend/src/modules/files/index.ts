// src/modules/files/index.ts
import { ModuleDefinition } from '../../core/types';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../core/middleware';
import { getStorageService } from '../../core/storage';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Allow images, PDFs, docs
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
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

function setupRoutes(app: Express, prisma: PrismaClient) {
  const base = '/api/v1/files';
  const storage = getStorageService();

  // Upload file
  app.post(
    `${base}/upload`,
    authenticate,
    tenantIsolation,
    upload.single('file'),
    async (req, res, next) => {
      try {
        if (!req.file) {
          return res.status(400).json({
            success: false,
            error: { message: 'No file provided' },
          });
        }

        const { entityType, entityId } = req.body;

        // Upload to MinIO
        const objectName = await storage.upload(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype,
          entityType || 'general'
        );

        // Save metadata to database
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
    }
  );

  // List files
  app.get(`${base}`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const { entityType, entityId } = req.query;

      const files = await prisma.file.findMany({
        where: {
          companyId: req.companyId!,
          ...(entityType && { entityType: entityType as string }),
          ...(entityId && { entityId: entityId as string }),
        },
        include: {
          uploadedBy: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ success: true, data: files });
    } catch (error) {
      next(error);
    }
  });

  // Get file URL
  app.get(`${base}/:id/url`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const file = await prisma.file.findFirst({
        where: {
          id: req.params.id,
          companyId: req.companyId!,
        },
      });

      if (!file) {
        return res.status(404).json({
          success: false,
          error: { message: 'File not found' },
        });
      }

      const url = await storage.getUrl(file.objectName);

      res.json({ success: true, data: { url, expiresIn: 3600 } });
    } catch (error) {
      next(error);
    }
  });

  // Download file
  app.get(`${base}/:id/download`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const file = await prisma.file.findFirst({
        where: {
          id: req.params.id,
          companyId: req.companyId!,
        },
      });

      if (!file) {
        return res.status(404).json({
          success: false,
          error: { message: 'File not found' },
        });
      }

      const buffer = await storage.download(file.objectName);

      res.setHeader('Content-Type', file.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  });

  // Delete file
  app.delete(`${base}/:id`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const file = await prisma.file.findFirst({
        where: {
          id: req.params.id,
          companyId: req.companyId!,
        },
      });

      if (!file) {
        return res.status(404).json({
          success: false,
          error: { message: 'File not found' },
        });
      }

      // Delete from MinIO
      await storage.delete(file.objectName);

      // Delete from database
      await prisma.file.delete({ where: { id: file.id } });

      res.json({ success: true, message: 'File deleted' });
    } catch (error) {
      next(error);
    }
  });

  // Upload avatar
  app.post(
    `${base}/avatar`,
    authenticate,
    tenantIsolation,
    upload.single('avatar'),
    async (req, res, next) => {
      try {
        if (!req.file) {
          return res.status(400).json({
            success: false,
            error: { message: 'No file provided' },
          });
        }

        // Upload to MinIO
        const objectName = await storage.upload(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype,
          'avatars'
        );

        // Update user
        await prisma.user.update({
          where: { id: req.user!.id },
          data: { avatar: objectName },
        });

        const url = await storage.getUrl(objectName);

        res.json({ success: true, data: { avatar: objectName, url } });
      } catch (error) {
        next(error);
      }
    }
  );
}

export const filesModule: ModuleDefinition = {
  name: 'files',
  version: '1.0.0',
  provides: ['storage', 'uploads'],
  routes: (ctx) => setupRoutes(ctx.app, ctx.prisma),
};
