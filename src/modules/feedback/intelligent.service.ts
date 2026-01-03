// src/modules/feedback/intelligent.service.ts
import { PrismaClient } from '@prisma/client';
import { logger } from '../../core/logger';
import axios from 'axios';
import { env } from '../../core/config/env';

/**
 * Sistema de Feedback Inteligente
 *
 * Aprende com as ações dos usuários e melhora o sistema continuamente:
 * - Aprende padrões de deduplicação
 * - Aprende preferências de merge
 * - Sugere automações
 * - Feedback preditivo
 */
export class IntelligentFeedbackService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Registra feedback de uma ação do usuário
   */
  async recordFeedback(data: {
    companyId: string;
    userId: string;
    action: string;
    entityType: string;
    entityId: string;
    context: any;
    result: 'success' | 'error' | 'skipped';
    metadata?: any;
  }) {
    const feedback = await this.prisma.intelligentFeedback.create({
      data: {
        companyId: data.companyId,
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        context: data.context,
        result: data.result,
        metadata: data.metadata || {},
        timestamp: new Date(),
      },
    });

    // Processar feedback assincronamente
    this.processFeedback(feedback).catch(err =>
      logger.error({ err }, 'Failed to process feedback')
    );

    return feedback;
  }

  /**
   * Processa feedback e atualiza modelos de aprendizado
   */
  private async processFeedback(feedback: any) {
    // 1. Atualizar estatísticas
    await this.updateStats(feedback);

    // 2. Detectar padrões
    await this.detectPatterns(feedback);

    // 3. Sugerir automações
    await this.suggestAutomations(feedback);

    // 4. Treinar modelo de ML (se aplicável)
    await this.updateMLModel(feedback);
  }

  /**
   * Atualiza estatísticas de uso
   */
  private async updateStats(feedback: any) {
    await this.prisma.feedbackStats.upsert({
      where: {
        companyId_action_entityType: {
          companyId: feedback.companyId,
          action: feedback.action,
          entityType: feedback.entityType,
        },
      },
      create: {
        companyId: feedback.companyId,
        action: feedback.action,
        entityType: feedback.entityType,
        totalCount: 1,
        successCount: feedback.result === 'success' ? 1 : 0,
        errorCount: feedback.result === 'error' ? 1 : 0,
        skippedCount: feedback.result === 'skipped' ? 1 : 0,
      },
      update: {
        totalCount: { increment: 1 },
        successCount: feedback.result === 'success' ? { increment: 1 } : undefined,
        errorCount: feedback.result === 'error' ? { increment: 1 } : undefined,
        skippedCount: feedback.result === 'skipped' ? { increment: 1 } : undefined,
        lastOccurrence: new Date(),
      },
    });
  }

  /**
   * Detecta padrões recorrentes
   */
  private async detectPatterns(feedback: any) {
    // Buscar feedbacks similares recentes
    const similar = await this.prisma.intelligentFeedback.findMany({
      where: {
        companyId: feedback.companyId,
        action: feedback.action,
        entityType: feedback.entityType,
        timestamp: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Últimos 7 dias
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    // Se >= 80% dos feedbacks são success, sugerir automação
    const successRate = similar.filter(f => f.result === 'success').length / similar.length;

    if (similar.length >= 20 && successRate >= 0.8) {
      await this.createAutomationSuggestion({
        companyId: feedback.companyId,
        action: feedback.action,
        entityType: feedback.entityType,
        confidence: successRate,
        reason: `${similar.length} similar actions with ${(successRate * 100).toFixed(0)}% success rate`,
      });
    }
  }

  /**
   * Sugere automações baseado em padrões
   */
  private async suggestAutomations(feedback: any) {
    const patterns = await this.findActionPatterns(feedback.companyId, feedback.userId);

    for (const pattern of patterns) {
      if (pattern.frequency >= 10 && pattern.consistency >= 0.9) {
        await this.createAutomationSuggestion({
          companyId: feedback.companyId,
          action: pattern.action,
          entityType: pattern.entityType,
          confidence: pattern.consistency,
          reason: `Pattern detected: ${pattern.frequency} times with ${(pattern.consistency * 100).toFixed(0)}% consistency`,
          suggestedRule: {
            trigger: pattern.trigger,
            conditions: pattern.conditions,
            actions: pattern.actions,
          },
        });
      }
    }
  }

  /**
   * Encontra padrões de ação do usuário
   */
  private async findActionPatterns(companyId: string, userId: string) {
    const feedbacks = await this.prisma.intelligentFeedback.findMany({
      where: { companyId, userId },
      orderBy: { timestamp: 'desc' },
      take: 500,
    });

    const patterns: Map<string, any> = new Map();

    feedbacks.forEach(fb => {
      const key = `${fb.action}:${fb.entityType}`;
      if (!patterns.has(key)) {
        patterns.set(key, {
          action: fb.action,
          entityType: fb.entityType,
          frequency: 0,
          successes: 0,
          trigger: this.extractTrigger(fb),
          conditions: this.extractConditions(fb),
          actions: this.extractActions(fb),
        });
      }

      const pattern = patterns.get(key)!;
      pattern.frequency++;
      if (fb.result === 'success') pattern.successes++;
      pattern.consistency = pattern.successes / pattern.frequency;
    });

    return Array.from(patterns.values());
  }

  /**
   * Atualiza modelo de ML (futuro)
   */
  private async updateMLModel(feedback: any) {
    // TODO: Integrar com modelo de ML real
    // Por enquanto, apenas salva dados para treinamento futuro
    await this.prisma.mLTrainingData.create({
      data: {
        companyId: feedback.companyId,
        dataType: 'feedback',
        features: {
          action: feedback.action,
          entityType: feedback.entityType,
          context: feedback.context,
        },
        label: feedback.result,
        timestamp: new Date(),
      },
    });
  }

  /**
   * Cria sugestão de automação
   */
  private async createAutomationSuggestion(data: {
    companyId: string;
    action: string;
    entityType: string;
    confidence: number;
    reason: string;
    suggestedRule?: any;
  }) {
    // Verificar se já existe sugestão similar
    const existing = await this.prisma.automationSuggestion.findFirst({
      where: {
        companyId: data.companyId,
        action: data.action,
        entityType: data.entityType,
        status: 'pending',
      },
    });

    if (existing) return; // Não duplicar sugestões

    await this.prisma.automationSuggestion.create({
      data: {
        companyId: data.companyId,
        action: data.action,
        entityType: data.entityType,
        confidence: data.confidence,
        reason: data.reason,
        suggestedRule: data.suggestedRule || {},
        status: 'pending',
      },
    });

    logger.info({ ...data }, 'Automation suggestion created');
  }

  /**
   * Obtém sugestões de automação para uma empresa
   */
  async getAutomationSuggestions(companyId: string) {
    return this.prisma.automationSuggestion.findMany({
      where: { companyId, status: 'pending' },
      orderBy: { confidence: 'desc' },
    });
  }

  /**
   * Aceita/rejeita sugestão de automação
   */
  async handleSuggestion(suggestionId: string, action: 'accept' | 'reject') {
    const suggestion = await this.prisma.automationSuggestion.update({
      where: { id: suggestionId },
      data: {
        status: action === 'accept' ? 'accepted' : 'rejected',
        reviewedAt: new Date(),
      },
    });

    if (action === 'accept') {
      // Criar automação real
      await this.prisma.workflow.create({
        data: {
          companyId: suggestion.companyId,
          name: `Auto: ${suggestion.action} ${suggestion.entityType}`,
          description: suggestion.reason,
          definition: suggestion.suggestedRule || {},
          status: 'ACTIVE',
          createdBy: 'system',
        },
      });
    }

    return suggestion;
  }

  /**
   * Gera insights baseado em feedbacks
   */
  async generateInsights(companyId: string) {
    const stats = await this.prisma.feedbackStats.findMany({
      where: { companyId },
      orderBy: { totalCount: 'desc' },
      take: 10,
    });

    const insights = [];

    for (const stat of stats) {
      const successRate = stat.successCount / stat.totalCount;
      const errorRate = stat.errorCount / stat.totalCount;

      if (errorRate > 0.3) {
        insights.push({
          type: 'warning',
          message: `High error rate (${(errorRate * 100).toFixed(0)}%) for ${stat.action} on ${stat.entityType}`,
          recommendation: 'Review process and provide additional training',
          priority: 'high',
        });
      }

      if (successRate > 0.9 && stat.totalCount > 50) {
        insights.push({
          type: 'suggestion',
          message: `${stat.action} on ${stat.entityType} is highly consistent`,
          recommendation: 'Consider automating this action',
          priority: 'medium',
        });
      }
    }

    // Usar IA para insights adicionais
    if (env.OPENAI_API_KEY) {
      const aiInsights = await this.generateAIInsights(companyId, stats);
      insights.push(...aiInsights);
    }

    return insights;
  }

  /**
   * Gera insights usando IA
   */
  private async generateAIInsights(companyId: string, stats: any[]) {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a business intelligence analyst. Analyze usage patterns and provide actionable insights.',
            },
            {
              role: 'user',
              content: `Analyze these usage statistics and provide 3-5 insights:\n\n${JSON.stringify(stats, null, 2)}`,
            },
          ],
        },
        {
          headers: {
            'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const aiResponse = response.data.choices[0].message.content;
      return [
        {
          type: 'ai-insight',
          message: aiResponse,
          priority: 'low',
        },
      ];
    } catch (error) {
      logger.error({ error }, 'Failed to generate AI insights');
      return [];
    }
  }

  // Utilitários para extrair informações de contexto
  private extractTrigger(feedback: any) {
    return feedback.context?.trigger || feedback.action;
  }

  private extractConditions(feedback: any) {
    return feedback.context?.conditions || [];
  }

  private extractActions(feedback: any) {
    return feedback.context?.actions || [];
  }
}
