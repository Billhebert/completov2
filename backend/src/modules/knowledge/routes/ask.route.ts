import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';
import { cosineSimilarity } from '../helpers/cosine-similarity';

export function setupKnowledgeAskRoute(
  app: Express,
  prisma: PrismaClient,
  baseUrl: string
) {
  // AI-powered question answering using RAG
  app.post(`${baseUrl}/ask`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const { question, maxContext = 5 } = req.body;

      if (!question) {
        return res.status(400).json({
          success: false,
          error: { message: 'Question is required' }
        });
      }

      const userRole = (req.user as any)?.role;
      const isDev = userRole === 'dev';
      const isAdminGeral = userRole === 'admin_geral';

      // Get relevant context using semantic search
      const { getAIService } = await import('../../../core/ai/ai.service');
      const aiService = getAIService(prisma);

      const queryEmbedding = await aiService.generateEmbedding(question);

      // Get embeddings
      const embeddings = await prisma.embedding.findMany({
        where: isDev || isAdminGeral ? {} : {
          companyId: req.companyId!,
        },
        include: {
          node: {
            where: {
              deletedAt: null,
              ...(isDev || isAdminGeral ? {} : {
                OR: [
                  { isCompanyWide: true },
                  { ownerId: req.user!.id },
                ],
              }),
            },
          },
        },
        take: 500,
      });

      // Find most relevant nodes
      const relevantNodes = embeddings
        .filter(e => e.node)
        .map(e => ({
          node: e.node!,
          similarity: cosineSimilarity(queryEmbedding, e.embedding as number[]),
        }))
        .filter(r => r.similarity >= 0.6)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, maxContext);

      if (relevantNodes.length === 0) {
        return res.json({
          success: true,
          data: {
            answer: 'Não encontrei informações relevantes na base de conhecimento para responder essa pergunta.',
            sources: [],
            confidence: 'low',
          },
        });
      }

      // Build context from relevant nodes
      const context = relevantNodes
        .map((r, i) => `[${i + 1}] ${r.node.title}\n${r.node.content.substring(0, 500)}...\n`)
        .join('\n\n');

      // Ask AI with context
      const prompt = `
Baseado nas seguintes informações da base de conhecimento:

${context}

Pergunta: ${question}

Forneça uma resposta detalhada e precisa em português (pt-BR), citando as fontes relevantes quando apropriado.
      `;

      const aiResponse = await aiService.complete({
        prompt,
        systemMessage: 'Você é um assistente que responde perguntas baseado em uma base de conhecimento. Seja preciso e cite as fontes.',
        temperature: 0.7,
      });

      res.json({
        success: true,
        data: {
          answer: aiResponse.content,
          sources: relevantNodes.map(r => ({
            id: r.node.id,
            title: r.node.title,
            type: r.node.nodeType,
            relevance: r.similarity,
          })),
          confidence: relevantNodes[0].similarity > 0.8 ? 'high' :
                     relevantNodes[0].similarity > 0.6 ? 'medium' : 'low',
          model: aiResponse.model,
          provider: aiResponse.provider,
        },
      });
    } catch (error) {
      next(error);
    }
  });
}
