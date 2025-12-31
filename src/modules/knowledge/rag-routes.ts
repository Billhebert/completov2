// src/modules/knowledge/rag-routes.ts
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../core/middleware';
import { RAGUploadService, uploadConfig } from './rag-upload.service';

export function setupRAGRoutes(app: Express, prisma: PrismaClient) {
  const base = '/api/v1/knowledge/rag';
  const ragUpload = new RAGUploadService(prisma);

  // Upload documento para RAG
  app.post(
    `${base}/upload`,
    authenticate,
    tenantIsolation,
    uploadConfig.single('file'),
    async (req, res, next) => {
      try {
        if (!req.file) {
          return res.status(400).json({
            success: false,
            error: { message: 'No file provided' },
          });
        }

        const document = await ragUpload.uploadDocument({
          companyId: req.companyId!,
          userId: req.user!.id,
          file: req.file,
          title: req.body.title,
          tags: req.body.tags ? JSON.parse(req.body.tags) : [],
          metadata: req.body.metadata ? JSON.parse(req.body.metadata) : {},
        });

        res.json({
          success: true,
          data: document,
          message: 'Document uploaded and processing started',
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // Listar documentos
  app.get(`${base}/documents`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const documents = await ragUpload.listDocuments(req.companyId!, {
        status: req.query.status as string,
        tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
        search: req.query.search as string,
      });

      res.json({ success: true, data: documents });
    } catch (error) {
      next(error);
    }
  });

  // Ver detalhes de um documento
  app.get(`${base}/documents/:id`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const document = await prisma.rAGDocument.findFirst({
        where: {
          id: req.params.id,
          companyId: req.companyId!,
        },
      });

      if (!document) {
        return res.status(404).json({
          success: false,
          error: { message: 'Document not found' },
        });
      }

      res.json({ success: true, data: document });
    } catch (error) {
      next(error);
    }
  });

  // Deletar documento
  app.delete(`${base}/documents/:id`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      await ragUpload.deleteDocument(req.params.id, req.companyId!);

      res.json({
        success: true,
        message: 'Document deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  });

  // Reprocessar documento
  app.post(`${base}/documents/:id/reprocess`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      await ragUpload.reprocessDocument(req.params.id, req.companyId!);

      res.json({
        success: true,
        message: 'Document reprocessing started',
      });
    } catch (error) {
      next(error);
    }
  });

  // Upload em lote (múltiplos arquivos)
  app.post(
    `${base}/upload-batch`,
    authenticate,
    tenantIsolation,
    uploadConfig.array('files', 10),
    async (req, res, next) => {
      try {
        const files = req.files as Express.Multer.File[];

        if (!files || files.length === 0) {
          return res.status(400).json({
            success: false,
            error: { message: 'No files provided' },
          });
        }

        const results = await Promise.all(
          files.map(file =>
            ragUpload.uploadDocument({
              companyId: req.companyId!,
              userId: req.user!.id,
              file,
              tags: req.body.tags ? JSON.parse(req.body.tags) : [],
              metadata: req.body.metadata ? JSON.parse(req.body.metadata) : {},
            })
          )
        );

        res.json({
          success: true,
          data: {
            uploaded: results.length,
            documents: results,
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // Estatísticas de uso do RAG
  app.get(`${base}/stats`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const stats = await prisma.rAGDocument.groupBy({
        by: ['status'],
        where: { companyId: req.companyId! },
        _count: true,
        _sum: {
          fileSize: true,
          totalChunks: true,
        },
      });

      const totalDocuments = await prisma.rAGDocument.count({
        where: { companyId: req.companyId! },
      });

      res.json({
        success: true,
        data: {
          totalDocuments,
          byStatus: stats,
        },
      });
    } catch (error) {
      next(error);
    }
  });
}
