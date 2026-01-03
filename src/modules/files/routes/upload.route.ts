import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, validateBody } from '../../../core/middleware';
import { getStorageService } from '../../../core/storage';
import { auditLogger } from '../../../core/audit/audit-logger';
import { successResponse, errorResponse } from '../../../core/utils/api-response';
import {
  validateUploadedFile,
  generateSafeFilename,
  FILE_UPLOAD_CONFIG
} from '../../../core/utils/file-validator';
import { uploadFileSchema } from '../validation';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: FILE_UPLOAD_CONFIG.MAX_FILE_SIZE,
    files: 1,
  },
});

export function setupFilesUploadRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  const storage = getStorageService();

  app.post(
    `${baseUrl}/upload`,
    authenticate,
    tenantIsolation,
    upload.single('file'),
    validateBody(uploadFileSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.file) {
          return res.status(400).json({
            success: false,
            error: { message: 'No file provided' },
          });
        }

        // Comprehensive file validation
        const validationResult = validateUploadedFile(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype
        );

        if (!validationResult.valid) {
          // Audit log failed upload attempt
          await auditLogger.log({
            action: 'file.upload.rejected',
            userId: req.user!.id,
            companyId: req.companyId!,
            resourceType: 'file',
            resourceId: 'rejected',
            details: {
              filename: req.file.originalname,
              mimeType: req.file.mimetype,
              size: req.file.size,
              errors: validationResult.errors,
              warnings: validationResult.warnings,
            },
          });

          return res.status(400).json({
            success: false,
            error: {
              message: 'File validation failed',
              details: validationResult.errors,
            },
          });
        }

        const { entityType, entityId } = req.body;

        // Generate safe filename
        const safeFilename = generateSafeFilename(req.file.originalname);

        // Upload to storage
        const objectName = await storage.upload(
          req.file.buffer,
          safeFilename,
          req.file.mimetype,
          entityType || 'general'
        );

        // Save file metadata to database
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

        // Audit log successful upload
        await auditLogger.log({
          action: 'file.upload',
          userId: req.user!.id,
          companyId: req.companyId!,
          resourceType: 'file',
          resourceId: file.id,
          details: {
            filename: file.filename,
            mimeType: file.mimeType,
            size: file.size,
            entityType,
            entityId,
            warnings: validationResult.warnings,
          },
        });

        return successResponse(res, file, {
          statusCode: 201,
          requestId: req.id,
        });
      } catch (error) {
        next(error);
      }
    }
  );
}
