import { OpenAI } from 'openai';
import { logger } from '../../../core/logger';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateNarrative(
  evidences: any[],
  format: string,
  type: string
): Promise<string> {
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
    logger.error({ error }, 'Failed to generate narrative with LLM');
    return '# Narrativa\n\n_Erro ao gerar conteúdo_';
  }
}
