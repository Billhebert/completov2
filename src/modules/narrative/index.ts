import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { OpenAI } from 'openai';
import { logger } from '@core/logger';

const router = Router();
const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * POST /api/v1/narrative/generate
 * Gerar narrativa a partir de zettels
 */
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.user!;
    const { type, entityId, startDate, endDate, format } = req.body;

    // Validações
    if (!type || !format) {
      return res.status(400).json({ error: 'type and format are required' });
    }

    // 1. Coletar evidências (zettels)
    const where: any = { companyId, deletedAt: null };

    if (entityId) {
      where.entities = { path: ['contactId'], equals: entityId };
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const evidences = await prisma.knowledgeNode.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      take: 100
    });

    if (evidences.length === 0) {
      return res.status(404).json({ error: 'No evidence found for narrative' });
    }

    // 2. Gerar narrativa com LLM
    const narrative = await generateNarrative(evidences, format, type);

    // 3. Adicionar referências
    const sources = evidences.map(e => ({
      nodeId: e.id,
      title: e.title,
      type: e.nodeType
    }));

    res.json({
      title: `Narrativa: ${type}`,
      content: narrative,
      sources,
      generatedAt: new Date()
    });

  } catch (error: any) {
    logger.error('Error generating narrative', { error });
    res.status(500).json({ error: 'Failed to generate narrative' });
  }
});

/**
 * Gera narrativa usando LLM
 */
async function generateNarrative(evidences: any[], format: string, type: string): Promise<string> {
  const evidencesSummary = evidences.map(e =>
    `[${e.nodeType}] ${e.title} (${new Date(e.createdAt).toISOString().split('T')[0]})\n${e.content.substring(0, 300)}`
  ).join('\n\n---\n\n');

  const prompts: Record<string, string> = {
    summary: `Crie um resumo executivo conciso baseado nas evidências abaixo. Foque no que é essencial.`,
    timeline: `Crie uma linha do tempo cronológica dos eventos principais baseado nas evidências.`,
    lessons: `Extraia e organize as principais lições aprendidas das evidências.`,
    risks: `Identifique e liste os principais riscos e decisões críticas das evidências.`
  };

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4',
      messages: [
        {
          role: 'system',
          content: prompts[format] || prompts.summary
        },
        {
          role: 'user',
          content: `Evidências:\n\n${evidencesSummary}`
        }
      ],
      temperature: 0.7
    });

    return response.choices[0]?.message?.content || 'Sem conteúdo gerado';

  } catch (error) {
    logger.error('Failed to generate narrative with LLM', { error });
    return '# Narrativa\n\n_Erro ao gerar conteúdo_';
  }
}

export default router;
