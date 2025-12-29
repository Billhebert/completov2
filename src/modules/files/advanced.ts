// src/modules/files/advanced.ts
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, requirePermission, Permission, validateBody } from '../../core/middleware';
import { EventBus, Events } from '../../core/event-bus';
import { z } from 'zod';

const folderSchema = z.object({
  name: z.string(),
  parentId: z.string().optional(),
});

const fileShareSchema = z.object({
  userIds: z.array(z.string()),
  permission: z.enum(['view', 'edit', 'admin']),
  expiresAt: z.string().optional(),
});

const fileCommentSchema = z.object({
  content: z.string(),
  mentions: z.array(z.string()).optional(),
});

export function setupAdvancedFilesRoutes(router: Router, prisma: PrismaClient, eventBus: EventBus) {
  
  // ===== FOLDERS =====

  // Create folder
  router.post('/folders',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_CREATE),
    validateBody(folderSchema),
    async (req, res, next) => {
      try {
        const folder = await prisma.folder.create({
          data: {
            ...req.body,
            companyId: req.companyId!,
            createdById: req.user!.id,
          },
        });

        res.status(201).json({ success: true, data: folder });
      } catch (error) {
        next(error);
      }
    }
  );

  // List folders
  router.get('/folders',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_READ),
    async (req, res, next) => {
      try {
        const { parentId } = req.query;

        const where: any = { companyId: req.companyId! };
        if (parentId) {
          where.parentId = parentId;
        } else {
          where.parentId = null; // Root folders
        }

        const folders = await prisma.folder.findMany({
          where,
          include: {
            createdBy: { select: { id: true, name: true } },
            _count: { select: { files: true, children: true } },
          },
          orderBy: { name: 'asc' },
        });

        res.json({ success: true, data: folders });
      } catch (error) {
        next(error);
      }
    }
  );

  // Move folder
  router.patch('/folders/:id/move',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_UPDATE),
    validateBody(z.object({ parentId: z.string().nullable() })),
    async (req, res, next) => {
      try {
        const folder = await prisma.folder.update({
          where: { id: req.params.id },
          data: { parentId: req.body.parentId },
        });

        res.json({ success: true, data: folder });
      } catch (error) {
        next(error);
      }
    }
  );

  // Delete folder (move to trash)
  router.delete('/folders/:id',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_DELETE),
    async (req, res, next) => {
      try {
        await prisma.folder.update({
          where: { id: req.params.id },
          data: {
            deleted: true,
            deletedAt: new Date(),
            deletedById: req.user!.id,
          },
        });

        res.json({ success: true, message: 'Folder moved to trash' });
      } catch (error) {
        next(error);
      }
    }
  );

  // ===== FILE VERSIONING =====

  // Upload new version
  router.post('/files/:id/versions',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_UPDATE),
    async (req, res, next) => {
      try {
        const { fileUrl, filename, size, mimeType, changeNote } = req.body;

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

        // Get current version number
        const latestVersion = await prisma.fileVersion.findFirst({
          where: { fileId: file.id },
          orderBy: { version: 'desc' },
        });

        const newVersionNumber = (latestVersion?.version || 0) + 1;

        // Create version
        const version = await prisma.fileVersion.create({
          data: {
            fileId: file.id,
            version: newVersionNumber,
            fileUrl,
            filename,
            size,
            mimeType,
            changeNote,
            createdById: req.user!.id,
          },
        });

        // Update file
        await prisma.file.update({
          where: { id: file.id },
          data: {
            fileUrl,
            filename,
            size,
            mimeType,
            currentVersion: newVersionNumber,
          },
        });

        res.status(201).json({ success: true, data: version });
      } catch (error) {
        next(error);
      }
    }
  );

  // List versions
  router.get('/files/:id/versions',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_READ),
    async (req, res, next) => {
      try {
        const versions = await prisma.fileVersion.findMany({
          where: { fileId: req.params.id },
          include: {
            createdBy: { select: { id: true, name: true } },
          },
          orderBy: { version: 'desc' },
        });

        res.json({ success: true, data: versions });
      } catch (error) {
        next(error);
      }
    }
  );

  // Restore version
  router.post('/files/:id/versions/:versionId/restore',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_UPDATE),
    async (req, res, next) => {
      try {
        const version = await prisma.fileVersion.findFirst({
          where: {
            id: req.params.versionId,
            fileId: req.params.id,
          },
        });

        if (!version) {
          return res.status(404).json({
            success: false,
            error: { message: 'Version not found' },
          });
        }

        // Update file to this version
        await prisma.file.update({
          where: { id: req.params.id },
          data: {
            fileUrl: version.fileUrl,
            filename: version.filename,
            size: version.size,
            mimeType: version.mimeType,
            currentVersion: version.version,
          },
        });

        res.json({ success: true, message: 'Version restored' });
      } catch (error) {
        next(error);
      }
    }
  );

  // ===== FILE PREVIEW =====

  // Generate preview
  router.get('/files/:id/preview',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_READ),
    async (req, res, next) => {
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

        // Check if preview exists
        let preview = await prisma.filePreview.findFirst({
          where: { fileId: file.id },
        });

        if (!preview) {
          // Generate preview (simplified - in production use actual preview generation)
          let previewType = 'none';
          let previewUrl = null;

          if (file.mimeType.startsWith('image/')) {
            previewType = 'image';
            previewUrl = file.fileUrl; // Use original for images
          } else if (file.mimeType === 'application/pdf') {
            previewType = 'pdf';
            previewUrl = file.fileUrl; // PDF viewer URL
          } else if (file.mimeType.startsWith('text/')) {
            previewType = 'text';
            previewUrl = file.fileUrl;
          }

          preview = await prisma.filePreview.create({
            data: {
              fileId: file.id,
              previewType,
              previewUrl,
              thumbnailUrl: previewUrl, // Simplified
            },
          });
        }

        res.json({ success: true, data: preview });
      } catch (error) {
        next(error);
      }
    }
  );

  // ===== FILE COMMENTS =====

  // Add comment
  router.post('/files/:id/comments',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_CREATE),
    validateBody(fileCommentSchema),
    async (req, res, next) => {
      try {
        const { content, mentions } = req.body;

        const comment = await prisma.fileComment.create({
          data: {
            fileId: req.params.id,
            content,
            mentions: mentions || [],
            createdById: req.user!.id,
          },
          include: {
            createdBy: { select: { id: true, name: true, avatar: true } },
          },
        });

        // Notify mentioned users
        if (mentions && mentions.length > 0) {
          for (const userId of mentions) {
            await eventBus.publish(Events.FILE_COMMENT_MENTION, {
              type: Events.FILE_COMMENT_MENTION,
              version: 'v1',
              timestamp: new Date(),
              companyId: req.companyId!,
              userId,
              data: { commentId: comment.id, fileId: req.params.id },
            });
          }
        }

        res.status(201).json({ success: true, data: comment });
      } catch (error) {
        next(error);
      }
    }
  );

  // List comments
  router.get('/files/:id/comments',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_READ),
    async (req, res, next) => {
      try {
        const comments = await prisma.fileComment.findMany({
          where: { fileId: req.params.id },
          include: {
            createdBy: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { createdAt: 'desc' },
        });

        res.json({ success: true, data: comments });
      } catch (error) {
        next(error);
      }
    }
  );

  // ===== TRASH & RECYCLE BIN =====

  // Move file to trash
  router.delete('/files/:id',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_DELETE),
    async (req, res, next) => {
      try {
        await prisma.file.update({
          where: { id: req.params.id },
          data: {
            deleted: true,
            deletedAt: new Date(),
            deletedById: req.user!.id,
          },
        });

        res.json({ success: true, message: 'File moved to trash' });
      } catch (error) {
        next(error);
      }
    }
  );

  // List trash
  router.get('/trash',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_READ),
    async (req, res, next) => {
      try {
        const [files, folders] = await Promise.all([
          prisma.file.findMany({
            where: {
              companyId: req.companyId!,
              deleted: true,
            },
            include: {
              deletedBy: { select: { id: true, name: true } },
            },
            orderBy: { deletedAt: 'desc' },
          }),
          prisma.folder.findMany({
            where: {
              companyId: req.companyId!,
              deleted: true,
            },
            include: {
              deletedBy: { select: { id: true, name: true } },
            },
            orderBy: { deletedAt: 'desc' },
          }),
        ]);

        res.json({
          success: true,
          data: {
            files,
            folders,
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // Restore from trash
  router.post('/trash/restore/:type/:id',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_UPDATE),
    async (req, res, next) => {
      try {
        const { type, id } = req.params;

        if (type === 'file') {
          await prisma.file.update({
            where: { id },
            data: {
              deleted: false,
              deletedAt: null,
              deletedById: null,
            },
          });
        } else if (type === 'folder') {
          await prisma.folder.update({
            where: { id },
            data: {
              deleted: false,
              deletedAt: null,
              deletedById: null,
            },
          });
        }

        res.json({ success: true, message: `${type} restored from trash` });
      } catch (error) {
        next(error);
      }
    }
  );

  // Permanently delete
  router.delete('/trash/:type/:id',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_DELETE),
    async (req, res, next) => {
      try {
        const { type, id } = req.params;

        if (type === 'file') {
          await prisma.file.delete({ where: { id } });
        } else if (type === 'folder') {
          await prisma.folder.delete({ where: { id } });
        }

        res.json({ success: true, message: `${type} permanently deleted` });
      } catch (error) {
        next(error);
      }
    }
  );

  // Auto-purge trash (cron job endpoint)
  router.post('/trash/auto-purge',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_DELETE),
    async (req, res, next) => {
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [filesDeleted, foldersDeleted] = await Promise.all([
          prisma.file.deleteMany({
            where: {
              companyId: req.companyId!,
              deleted: true,
              deletedAt: { lt: thirtyDaysAgo },
            },
          }),
          prisma.folder.deleteMany({
            where: {
              companyId: req.companyId!,
              deleted: true,
              deletedAt: { lt: thirtyDaysAgo },
            },
          }),
        ]);

        res.json({
          success: true,
          data: {
            filesDeleted: filesDeleted.count,
            foldersDeleted: foldersDeleted.count,
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // ===== FILE SHARING =====

  // Share file
  router.post('/files/:id/share',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_UPDATE),
    validateBody(fileShareSchema),
    async (req, res, next) => {
      try {
        const { userIds, permission, expiresAt } = req.body;

        const shares = await Promise.all(
          userIds.map(userId =>
            prisma.fileShare.create({
              data: {
                fileId: req.params.id,
                userId,
                permission,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                sharedById: req.user!.id,
              },
            })
          )
        );

        res.status(201).json({ success: true, data: shares });
      } catch (error) {
        next(error);
      }
    }
  );

  // List file shares
  router.get('/files/:id/shares',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_READ),
    async (req, res, next) => {
      try {
        const shares = await prisma.fileShare.findMany({
          where: { fileId: req.params.id },
          include: {
            user: { select: { id: true, name: true, email: true, avatar: true } },
            sharedBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        });

        res.json({ success: true, data: shares });
      } catch (error) {
        next(error);
      }
    }
  );

  // Revoke share
  router.delete('/files/:fileId/shares/:shareId',
    authenticate,
    tenantIsolation,
    requirePermission(Permission.USER_UPDATE),
    async (req, res, next) => {
      try {
        await prisma.fileShare.delete({
          where: { id: req.params.shareId },
        });

        res.json({ success: true, message: 'Share revoked' });
      } catch (error) {
        next(error);
      }
    }
  );
}
