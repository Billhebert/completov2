import { PrismaClient } from '@prisma/client';
import { logger } from '../../../core/logger';

export async function createLearningZettel(
  session: any,
  evaluation: any,
  prisma: PrismaClient
): Promise<void> {
  try {
    await prisma.knowledgeNode.create({
      data: {
        companyId: session.scenario.companyId,
        title: `Simulação: ${session.scenario.title}`,
        content: `# Simulação - ${session.scenario.title}

## Resultado
**Score:** ${evaluation.score}/100
**Data:** ${session.finishedAt?.toISOString().split('T')[0]}

## Pontos Fortes
${evaluation.strengths?.map((s: string) => `- ${s}`).join('\n') || 'N/A'}

## Pontos de Melhoria
${evaluation.improvements?.map((i: string) => `- ${i}`).join('\n') || 'N/A'}

## Feedback
${evaluation.feedback}`,
        nodeType: 'LEARNING',
        createdById: session.userId,
        visibility: 'PRIVATE',
        tags: ['simulation', session.scenario.type, `score-${Math.floor(evaluation.score / 10) * 10}`]
      }
    });
  } catch (error) {
    logger.error({ error }, 'Failed to create learning zettel');
  }
}
