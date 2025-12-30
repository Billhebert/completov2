import { PrismaClient } from '@prisma/client';
import { logger } from '@core/logger';
import { OpenAI } from 'openai';
import cron from 'node-cron';

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * TruthLayerService - Gerencia fonte da verdade e detecta conflitos
 */
export class TruthLayerService {
  /**
   * Detecta conflitos entre zettels similares
   */
  async detectConflicts(nodeId: string): Promise<void> {
    try {
      const node = await prisma.knowledgeNode.findUnique({ where: { id: nodeId } });
      if (!node) return;

      // Buscar nodes similares (mesmo tipo, tags similares, entidades)
      const similarNodes = await this.findSimilarNodes(node);

      for (const otherNode of similarNodes) {
        // Usar LLM para detectar contradição
        const hasConflict = await this.aiDetectConflict(node.content, otherNode.content);

        if (hasConflict) {
          // Marcar ambos como CONFLICTING
          await Promise.all([
            prisma.knowledgeNode.update({
              where: { id: node.id },
              data: { truthStatus: 'CONFLICTING' }
            }),
            prisma.knowledgeNode.update({
              where: { id: otherNode.id },
              data: { truthStatus: 'CONFLICTING' }
            })
          ]);

          // Criar reminder para resolver
          await prisma.reminder.create({
            data: {
              companyId: node.companyId,
              nodeId: node.id,
              userId: node.createdById,
              type: 'REVIEW_REQUIRED',
              scheduledFor: new Date(),
              message: `Conflito detectado: "${node.title}" vs "${otherNode.title}" - revisão necessária`,
              metadata: { conflictingNodeId: otherNode.id }
            }
          });

          logger.info('[TruthLayer] Conflict detected', {
            nodeId: node.id,
            conflictingWith: otherNode.id
          });
        }
      }
    } catch (error) {
      logger.error('[TruthLayer] detectConflicts failed', { error, nodeId });
    }
  }

  /**
   * Calcula freshness score (decay ao longo do tempo)
   */
  async calculateFreshnessScore(nodeId: string): Promise<number> {
    const node = await prisma.knowledgeNode.findUnique({ where: { id: nodeId } });
    if (!node) return 0;

    const daysSinceUpdate = Math.floor(
      (Date.now() - node.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Decay exponencial (half-life de 30 dias)
    const freshness = Math.exp(-daysSinceUpdate / 30);

    await prisma.knowledgeNode.update({
      where: { id: nodeId },
      data: { freshnessScore: freshness }
    });

    return freshness;
  }

  /**
   * Resolve conflito escolhendo fonte da verdade
   */
  async resolveConflict(winnerNodeId: string, loserNodeId: string, rationale: string): Promise<void> {
    await Promise.all([
      prisma.knowledgeNode.update({
        where: { id: winnerNodeId },
        data: { truthStatus: 'SOURCE_OF_TRUTH' }
      }),
      prisma.knowledgeNode.update({
        where: { id: loserNodeId },
        data: { truthStatus: 'OUTDATED' }
      })
    ]);

    logger.info('[TruthLayer] Conflict resolved', { winnerNodeId, loserNodeId, rationale });
  }

  // ============================================
  // HELPERS
  // ============================================

  private async findSimilarNodes(node: any) {
    return await prisma.knowledgeNode.findMany({
      where: {
        companyId: node.companyId,
        id: { not: node.id },
        nodeType: node.nodeType,
        deletedAt: null,
        OR: [
          { tags: { hasSome: node.tags } },
          { title: { contains: node.title.split(' ')[0] } }
        ]
      },
      take: 5
    });
  }

  private async aiDetectConflict(content1: string, content2: string): Promise<boolean> {
    try {
      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Você detecta contradições entre textos. Retorne apenas "true" se houver contradição clara, ou "false" caso contrário.'
          },
          {
            role: 'user',
            content: `Texto 1:\n${content1.substring(0, 500)}\n\nTexto 2:\n${content2.substring(0, 500)}\n\nHá contradição?`
          }
        ],
        temperature: 0.1
      });

      const result = response.choices[0]?.message?.content?.trim().toLowerCase();
      return result === 'true';

    } catch (error) {
      logger.error('[TruthLayer] AI conflict detection failed', { error });
      return false;
    }
  }
}

/**
 * Cron Job - Atualizar freshness scores diariamente
 */
export function startTruthLayerCron() {
  const truthLayer = new TruthLayerService();

  cron.schedule('0 2 * * *', async () => {
    logger.info('[CRON] TruthLayer: Starting freshness update...');

    try {
      const nodes = await prisma.knowledgeNode.findMany({
        where: {
          deletedAt: null,
          truthStatus: { in: ['ACTIVE', 'SOURCE_OF_TRUTH'] }
        },
        select: { id: true, updatedAt: true, createdById: true, companyId: true }
      });

      for (const node of nodes) {
        const freshness = await truthLayer.calculateFreshnessScore(node.id);

        // Se muito desatualizado e é SOURCE_OF_TRUTH, criar reminder
        if (freshness < 0.2) {
          await prisma.reminder.create({
            data: {
              companyId: node.companyId,
              nodeId: node.id,
              userId: node.createdById,
              type: 'REVIEW_REQUIRED',
              scheduledFor: new Date(),
              message: 'Conhecimento desatualizado - revisão recomendada',
              status: 'PENDING'
            }
          });
        }
      }

      logger.info(`[CRON] TruthLayer: Updated ${nodes.length} nodes`);

    } catch (error) {
      logger.error('[CRON] TruthLayer: Failed', { error });
    }
  });

  logger.info('[CRON] TruthLayer cron started (daily at 02:00)');
}

export const truthLayerService = new TruthLayerService();
