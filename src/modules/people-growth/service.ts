import { PrismaClient } from '@prisma/client';
import { logger } from '@core/logger';
import { OpenAI } from 'openai';

const prisma = new PrismaClient();

export interface GapDetectionResult {
  skillId?: string;
  domain: 'COMMERCIAL' | 'TECHNICAL' | 'MANAGEMENT' | 'SOFT_SKILLS';
  gap: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  evidence: any[];
}

/**
 * PeopleGrowthService - Detecta e gerencia gaps de desenvolvimento
 */
export class PeopleGrowthService {
  private openai: OpenAI;

  constructor(openaiClient?: OpenAI) {
    this.openai = openaiClient || new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  /**
   * Detecta gaps a partir de uma interação
   */
  async detectGapsFromInteraction(interactionId: string): Promise<GapDetectionResult[]> {
    try {
      const interaction = await prisma.interaction.findUnique({
        where: { id: interactionId },
        include: {
          user: true,
          contact: true,
          deal: true
        }
      });

      if (!interaction) {
        return [];
      }

      // Usar LLM para analisar a interação
      const analysis = await this.aiAnalyzeInteraction(interaction);

      if (!analysis || analysis.gaps.length === 0) {
        return [];
      }

      const gaps: GapDetectionResult[] = [];

      for (const gapData of analysis.gaps) {
        // Verificar se gap já existe
        const existing = await prisma.employeeGap.findFirst({
          where: {
            employeeId: interaction.userId,
            domain: gapData.domain,
            status: { in: ['OPEN', 'IN_PROGRESS'] },
            gap: { contains: gapData.gap.substring(0, 50) }
          }
        });

        if (existing) {
          // Apenas adiciona evidência
          await prisma.employeeGap.update({
            where: { id: existing.id },
            data: {
              evidence: {
                push: {
                  interactionId,
                  type: 'interaction',
                  timestamp: new Date()
                }
              }
            }
          });
        } else {
          // Cria novo gap
          await prisma.employeeGap.create({
            data: {
              companyId: interaction.companyId,
              employeeId: interaction.userId,
              domain: gapData.domain,
              gap: gapData.gap,
              severity: gapData.severity,
              evidence: [
                {
                  interactionId,
                  type: 'interaction',
                  timestamp: new Date()
                }
              ]
            }
          });

          gaps.push(gapData);
        }
      }

      logger.info({
        interactionId,
        gapsCount: gaps.length
      }, 'Gaps detected from interaction');

      return gaps;

    } catch (error) {
      logger.error({ error, interactionId }, 'Failed to detect gaps from interaction');
      return [];
    }
  }

  /**
   * Detecta gaps a partir de uma simulação
   */
  async detectGapsFromSimulation(sessionId: string, evaluation: any): Promise<void> {
    try {
      const session = await prisma.simulationSession.findUnique({
        where: { id: sessionId },
        include: { scenario: true }
      });

      if (!session || !evaluation.gaps || evaluation.gaps.length === 0) {
        return;
      }

      for (const gapData of evaluation.gaps) {
        await prisma.employeeGap.create({
          data: {
            companyId: session.scenario.companyId,
            employeeId: session.userId,
            domain: gapData.domain || 'SOFT_SKILLS',
            gap: gapData.description,
            severity: gapData.severity || 'MEDIUM',
            evidence: [
              {
                sessionId,
                type: 'simulation',
                score: evaluation.score,
                timestamp: new Date()
              }
            ]
          }
        });
      }

      logger.info({
        sessionId,
        gapsCount: evaluation.gaps.length
      }, 'Gaps created from simulation');

    } catch (error) {
      logger.error({ error, sessionId }, 'Failed to create gaps from simulation');
    }
  }

  /**
   * Sugere learning path para um gap
   */
  async suggestLearningPath(gapId: string): Promise<any[]> {
    try {
      const gap = await prisma.employeeGap.findUnique({
        where: { id: gapId }
      });

      if (!gap) {
        return [];
      }

      // Buscar learning paths relevantes
      const paths = await prisma.learningPath.findMany({
        where: {
          companyId: gap.companyId,
          category: gap.domain
        },
        include: {
          items: true
        },
        take: 5
      });

      return paths;

    } catch (error) {
      logger.error({ error, gapId }, 'Failed to suggest learning path');
      return [];
    }
  }

  /**
   * Fecha um gap (quando completado)
   */
  async closeGap(gapId: string, userId: string): Promise<void> {
    const gap = await prisma.employeeGap.findFirst({
      where: { id: gapId, employeeId: userId }
    });

    if (!gap) {
      throw new Error('Gap not found');
    }

    await prisma.employeeGap.update({
      where: { id: gapId },
      data: {
        status: 'CLOSED',
        closedAt: new Date()
      }
    });

    logger.info({ gapId, userId }, 'Gap closed');
  }

  /**
   * Analisa interação com IA
   */
  private async aiAnalyzeInteraction(interaction: any): Promise<any> {
    try {
      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Você é um especialista em análise de competências. Analise a interação abaixo e identifique gaps de habilidade.

Retorne JSON:
{
  "gaps": [
    {
      "domain": "COMMERCIAL|TECHNICAL|MANAGEMENT|SOFT_SKILLS",
      "gap": "Descrição clara do gap",
      "severity": "LOW|MEDIUM|HIGH|CRITICAL",
      "recommendation": "O que fazer para melhorar"
    }
  ],
  "strengths": ["..."],
  "overall_quality": 0-10
}

Se não houver gaps, retorne {"gaps": []}.`
          },
          {
            role: 'user',
            content: `Tipo: ${interaction.type}
Conteúdo: ${interaction.content}
Resultado: ${interaction.sentiment || 'N/A'}
Duração: ${interaction.duration || 'N/A'} minutos`
          }
        ],
        temperature: 0.3
      });

      const content = response.choices[0]?.message?.content;
      return content ? JSON.parse(content) : { gaps: [] };

    } catch (error) {
      logger.error({ error }, 'AI analysis failed');
      return { gaps: [] };
    }
  }

  /**
   * Gera relatório de gaps de um time
   */
  async getTeamGapsReport(companyId: string, teamId?: string): Promise<any> {
    const where: any = {
      companyId,
      status: { in: ['OPEN', 'IN_PROGRESS'] }
    };

    const gaps = await prisma.employeeGap.findMany({
      where,
      include: {
        employee: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Agrupar por domínio
    const byDomain = gaps.reduce((acc: any, gap) => {
      if (!acc[gap.domain]) {
        acc[gap.domain] = [];
      }
      acc[gap.domain].push(gap);
      return acc;
    }, {});

    // Agrupar por severidade
    const bySeverity = gaps.reduce((acc: any, gap) => {
      if (!acc[gap.severity]) {
        acc[gap.severity] = 0;
      }
      acc[gap.severity]++;
      return acc;
    }, {});

    return {
      total: gaps.length,
      byDomain,
      bySeverity,
      topGaps: gaps.slice(0, 10)
    };
  }
}

export const peopleGrowthService = new PeopleGrowthService();
