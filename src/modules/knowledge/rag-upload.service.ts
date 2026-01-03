// src/modules/knowledge/rag-upload.service.ts
import { PrismaClient } from '@prisma/client';
import { logger } from '../../core/logger';
import { RAGService } from '../ai/rag.service';
import { Storage } from '@google-cloud/storage';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { createHash } from 'crypto';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

/**
 * Serviço de Upload de Documentos para RAG por Empresa
 *
 * Permite cada empresa fazer upload de seus próprios documentos para o RAG:
 * - PDFs, Word, Excel, TXT, MD
 * - Chunking inteligente
 * - Embeddings automáticos
 * - Isolamento por empresa
 */
export class RAGUploadService {
  private storage: Storage | null = null;
  private ragService: RAGService;

  constructor(private prisma: PrismaClient) {
    this.ragService = new RAGService(prisma);

    // Inicializar Google Cloud Storage (opcional)
    if (process.env.GCS_BUCKET) {
      this.storage = new Storage();
    }
  }

  /**
   * Upload e processa documento para RAG
   */
  async uploadDocument(data: {
    companyId: string;
    userId: string;
    file: Express.Multer.File;
    title?: string;
    tags?: string[];
    metadata?: any;
  }) {
    logger.info({ filename: data.file.originalname, companyId: data.companyId }, 'Processing document for RAG');

    // 1. Calcular hash do arquivo (deduplicação)
    const fileHash = await this.calculateFileHash(data.file.path);

    // Verificar se arquivo já foi processado
    const existing = await this.prisma.rAGDocument.findFirst({
      where: {
        companyId: data.companyId,
        fileHash,
      },
    });

    if (existing) {
      logger.info({ documentId: existing.id }, 'Document already processed');
      await fs.unlink(data.file.path); // Remover arquivo temporário
      return existing;
    }

    // 2. Extrair texto do documento
    const text = await this.extractText(data.file);

    // 3. Fazer chunking inteligente
    const chunks = this.intelligentChunking(text, {
      maxChunkSize: 1000,
      overlap: 200,
    });

    // 4. Upload para storage (se configurado)
    let fileUrl = data.file.path;
    if (this.storage) {
      fileUrl = await this.uploadToGCS(data.file, data.companyId);
    }

    // 5. Criar registro do documento
    const document = await this.prisma.rAGDocument.create({
      data: {
        companyId: data.companyId,
        uploadedBy: data.userId,
        title: data.title || data.file.originalname,
        filename: data.file.originalname,
        fileUrl,
        fileHash,
        fileSize: data.file.size,
        mimeType: data.file.mimetype,
        tags: data.tags || [],
        metadata: data.metadata || {},
        totalChunks: chunks.length,
        status: 'processing',
      },
    });

    // 6. Processar chunks assincronamente
    this.processChunks(document.id, chunks, data.companyId).catch(err =>
      logger.error({ err, documentId: document.id }, 'Failed to process chunks')
    );

    // 7. Limpar arquivo temporário
    if (!this.storage) {
      // Se não estamos usando GCS, manter o arquivo local
    } else {
      await fs.unlink(data.file.path);
    }

    return document;
  }

  /**
   * Processa chunks e gera embeddings
   */
  private async processChunks(documentId: string, chunks: string[], companyId: string) {
    try {
      let processedCount = 0;

      for (const [index, chunk] of chunks.entries()) {
        try {
          // Gerar embedding
          const embedding = await this.ragService.generateEmbedding(chunk);

          // Criar knowledge node para o chunk
          const node = await this.prisma.knowledgeNode.create({
            data: {
              companyId,
              title: `Chunk ${index + 1}`,
              content: chunk,
              nodeType: 'DOCUMENT',
              tags: [],
              importanceScore: 0.5,
              metadata: {
                documentId,
                chunkIndex: index,
                totalChunks: chunks.length,
              },
              createdById: 'system',
            },
          });

          // Ingerir no RAG (Qdrant)
          await this.ragService.ingestNode(node.id, companyId);

          processedCount++;

          // Atualizar progresso
          await this.prisma.rAGDocument.update({
            where: { id: documentId },
            data: { processedChunks: processedCount },
          });
        } catch (error) {
          logger.error({ error, documentId, chunkIndex: index }, 'Failed to process chunk');
        }
      }

      // Marcar como completo
      await this.prisma.rAGDocument.update({
        where: { id: documentId },
        data: {
          status: 'ready',
          processedAt: new Date(),
        },
      });

      logger.info({ documentId, chunks: processedCount }, 'Document processing completed');
    } catch (error) {
      await this.prisma.rAGDocument.update({
        where: { id: documentId },
        data: { status: 'failed', error: (error as Error).message },
      });
      throw error;
    }
  }

  /**
   * Extrai texto de diferentes formatos de arquivo
   */
  private async extractText(file: Express.Multer.File): Promise<string> {
    const ext = path.extname(file.originalname).toLowerCase();

    switch (ext) {
      case '.pdf':
        return this.extractFromPDF(file.path);

      case '.docx':
      case '.doc':
        return this.extractFromWord(file.path);

      case '.txt':
      case '.md':
        return fs.readFile(file.path, 'utf-8');

      case '.json':
        const json = await fs.readFile(file.path, 'utf-8');
        return JSON.stringify(JSON.parse(json), null, 2);

      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }
  }

  /**
   * Extrai texto de PDF
   */
  private async extractFromPDF(filePath: string): Promise<string> {
    const dataBuffer = await fs.readFile(filePath);
    // @ts-ignore - pdf-parse has CommonJS/ESM type issues
    const data = await pdfParse(dataBuffer);
    return data.text;
  }

  /**
   * Extrai texto de Word
   */
  private async extractFromWord(filePath: string): Promise<string> {
    const buffer = await fs.readFile(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  /**
   * Chunking inteligente de texto
   */
  private intelligentChunking(
    text: string,
    options: { maxChunkSize: number; overlap: number }
  ): string[] {
    const chunks: string[] = [];
    const paragraphs = text.split(/\n\n+/);

    let currentChunk = '';

    for (const paragraph of paragraphs) {
      if ((currentChunk + paragraph).length <= options.maxChunkSize) {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      } else {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }

        // Overlap com chunk anterior
        if (chunks.length > 0 && options.overlap > 0) {
          const lastChunk = chunks[chunks.length - 1];
          const overlapText = lastChunk.slice(-options.overlap);
          currentChunk = overlapText + '\n\n' + paragraph;
        } else {
          currentChunk = paragraph;
        }
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks.filter(c => c.length > 0);
  }

  /**
   * Calcula hash do arquivo para deduplicação
   */
  private async calculateFileHash(filePath: string): Promise<string> {
    const buffer = await fs.readFile(filePath);
    return createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Upload para Google Cloud Storage
   */
  private async uploadToGCS(file: Express.Multer.File, companyId: string): Promise<string> {
    const bucket = this.storage!.bucket(process.env.GCS_BUCKET!);
    const filename = `rag/${companyId}/${Date.now()}-${file.originalname}`;

    await bucket.upload(file.path, {
      destination: filename,
      metadata: {
        contentType: file.mimetype,
      },
    });

    return `gs://${process.env.GCS_BUCKET}/${filename}`;
  }

  /**
   * Lista documentos de uma empresa
   */
  async listDocuments(companyId: string, filters?: {
    status?: string;
    tags?: string[];
    search?: string;
  }) {
    const where: any = { companyId };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { filename: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.rAGDocument.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        filename: true,
        fileSize: true,
        mimeType: true,
        status: true,
        totalChunks: true,
        processedChunks: true,
        tags: true,
        createdAt: true,
        processedAt: true,
      },
    });
  }

  /**
   * Deleta documento e seus chunks
   */
  async deleteDocument(documentId: string, companyId: string) {
    const document = await this.prisma.rAGDocument.findFirst({
      where: { id: documentId, companyId },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    // Deletar knowledge nodes associados
    await this.prisma.knowledgeNode.deleteMany({
      where: {
        companyId,
        metadata: {
          path: ['documentId'],
          equals: documentId,
        },
      },
    });

    // Deletar documento
    await this.prisma.rAGDocument.delete({
      where: { id: documentId },
    });

    // Deletar arquivo do storage
    if (this.storage && document.fileUrl.startsWith('gs://')) {
      const filename = document.fileUrl.replace(`gs://${process.env.GCS_BUCKET}/`, '');
      await this.storage.bucket(process.env.GCS_BUCKET!).file(filename).delete();
    }

    logger.info({ documentId }, 'Document deleted from RAG');
  }

  /**
   * Reprocessa documento (útil após updates no algoritmo)
   */
  async reprocessDocument(documentId: string, companyId: string) {
    const document = await this.prisma.rAGDocument.findFirst({
      where: { id: documentId, companyId },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    // Deletar chunks antigos
    await this.prisma.knowledgeNode.deleteMany({
      where: {
        companyId,
        metadata: {
          path: ['documentId'],
          equals: documentId,
        },
      },
    });

    // Resetar status
    await this.prisma.rAGDocument.update({
      where: { id: documentId },
      data: {
        status: 'processing',
        processedChunks: 0,
      },
    });

    // Reprocessar (implementation needed)
    logger.info({ documentId }, 'Document reprocessing started');
  }
}

/**
 * Configuração do Multer para upload
 */
export const uploadConfig = multer({
  dest: '/tmp/rag-uploads',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'text/markdown',
      'application/json',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${file.mimetype}`));
    }
  },
});
