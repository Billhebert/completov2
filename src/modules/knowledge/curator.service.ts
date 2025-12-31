import { PrismaClient } from '@prisma/client';
import { logger } from '@core/logger';
import { eventBus } from '@core/event-bus';
import { OpenAI } from 'openai';

const prisma = new PrismaClient();

/**
 * CuratorService - Auto-criação e auto-linking de Zettels
 *
 * Transforma eventos do sistema em conhecimento estruturado:
 * - Conversas -> Zettel.CLIENT + Zettel.NEGOTIATION
 * - Mensagens -> Zettel.TASK (compromissos)
 * - Deals fechados -> Zettel.LEARNING
 * - Interações -> Atualiza Zettels existentes
 */
export class CuratorService {
  private openai: OpenAI;

  constructor(openaiClient?: OpenAI) {
    this.openai = openaiClient || new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  /**
   * Handler: conversation.created
   */
  async onConversationCreated(data: any) {
    try {
      const { conversation, companyId } = data;
      logger.info({ conversationId: conversation.id }, 'Curator: conversation.created');

      // 1. Criar/Atualizar Zettel.CLIENT
      const clientZettel = await this.createOrUpdateClientZettel({
        companyId,
        contactName: conversation.contactName,
        contactEmail: conversation.contactEmail,
        contactPhone: conversation.contactPhone,
        sourceType: 'conversation',
        sourceId: conversation.id,
        createdById: conversation.userId || await this.getSystemUserId(companyId)
      });

      // 2. Criar Zettel.NEGOTIATION
      const negotiationZettel = await this.createNegotiationZettel({
        companyId,
        contactName: conversation.contactName,
        conversationId: conversation.id,
        sourceType: 'conversation',
        sourceId: conversation.id,
        createdById: conversation.userId || await this.getSystemUserId(companyId),
        linkedTo: [clientZettel.id]
      });

      logger.info({
        clientZettelId: clientZettel.id,
        negotiationZettelId: negotiationZettel.id
      }, 'Curator: Zettels created');

    } catch (error) {
      logger.error({ error, data }, 'Curator: onConversationCreated failed');
    }
  }

  /**
   * Handler: message.received
   */
  async onMessageReceived(data: any) {
    try {
      const { message, conversation, companyId } = data;
      logger.info({ messageId: message.id }, 'Curator: message.received');

      // 1. Buscar Zettel.NEGOTIATION relacionado à conversa
      const negotiationZettel = await this.findZettelBySource('conversation', conversation.id, 'NEGOTIATION');

      if (negotiationZettel) {
        // 2. Atualizar com resumo da mensagem
        await this.updateNegotiationWithMessage(negotiationZettel.id, message);
      }

      // 3. Detectar compromissos/tarefas usando LLM
      const detectedCommitments = await this.detectCommitments(message.content);

      for (const commitment of detectedCommitments) {
        await this.createTaskZettel({
          companyId,
          title: commitment.title,
          content: commitment.description,
          dueDate: commitment.dueDate,
          priority: commitment.priority,
          sourceType: 'message',
          sourceId: message.id,
          assigneeId: conversation.assignedToId,
          createdById: await this.getSystemUserId(companyId),
          linkedTo: negotiationZettel ? [negotiationZettel.id] : []
        });
      }

    } catch (error) {
      logger.error({ error, data }, 'Curator: onMessageReceived failed');
    }
  }

  /**
   * Handler: deal.stage_changed
   */
  async onDealStageChanged(data: any) {
    try {
      const { deal, oldStage, newStage, companyId } = data;
      logger.info({ dealId: deal.id, oldStage, newStage }, 'Curator: deal.stage_changed');

      // Buscar/criar Zettel.NEGOTIATION do deal
      let negotiationZettel = await this.findZettelBySource('deal', deal.id, 'NEGOTIATION');

      if (!negotiationZettel) {
        negotiationZettel = await this.createNegotiationZettelFromDeal(deal, companyId);
      }

      // Atualizar com mudança de stage
      const updatedContent = `${negotiationZettel.content}\n\n## Stage Update (${new Date().toISOString()})\nMudou de **${oldStage}** para **${newStage}**`;

      await prisma.knowledgeNode.update({
        where: { id: negotiationZettel.id },
        data: { content: updatedContent }
      });

    } catch (error) {
      logger.error({ error, data }, 'Curator: onDealStageChanged failed');
    }
  }

  /**
   * Handler: deal.won ou deal.lost
   */
  async onDealClosed(data: any) {
    try {
      const { deal, result, companyId } = data; // result: 'WON' ou 'LOST'
      logger.info({ dealId: deal.id, result }, 'Curator: deal.closed');

      // Gerar Zettel.LEARNING com IA
      const learningContent = await this.generateLearningFromDeal(deal, result);

      const learningZettel = await prisma.knowledgeNode.create({
        data: {
          companyId,
          title: `Lições - ${deal.title} (${result})`,
          content: learningContent,
          nodeType: 'LEARNING',
          sourceType: 'deal',
          sourceId: deal.id,
          createdById: await this.getSystemUserId(companyId),
          visibility: 'COMPANY',
          truthStatus: 'ACTIVE',
          freshnessScore: 1.0,
          tags: [result, 'lessons-learned', deal.stage]
        }
      });

      // Linkar com Zettel.NEGOTIATION
      const negotiationZettel = await this.findZettelBySource('deal', deal.id, 'NEGOTIATION');
      if (negotiationZettel) {
        await this.createLink(learningZettel.id, negotiationZettel.id, 'RELATES', companyId);
      }

      logger.info({ zettelId: learningZettel.id }, 'Curator: Learning zettel created');

    } catch (error) {
      logger.error({ error, data }, 'Curator: onDealClosed failed');
    }
  }

  /**
   * Handler: interaction.created
   */
  async onInteractionCreated(data: any) {
    try {
      const { interaction, companyId } = data;
      logger.info({ interactionId: interaction.id }, 'Curator: interaction.created');

      // Se tem contactId, atualizar Zettel.CLIENT
      if (interaction.contactId) {
        const contact = await prisma.contact.findUnique({ where: { id: interaction.contactId } });
        if (contact) {
          await this.createOrUpdateClientZettel({
            companyId,
            contactName: contact.name,
            contactEmail: contact.email || undefined,
            contactPhone: contact.phone || undefined,
            sourceType: 'interaction',
            sourceId: interaction.id,
            createdById: interaction.userId
          });
        }
      }

      // Se tem dealId, atualizar Zettel.NEGOTIATION
      if (interaction.dealId) {
        const negotiationZettel = await this.findZettelBySource('deal', interaction.dealId, 'NEGOTIATION');
        if (negotiationZettel) {
          const updatedContent = `${negotiationZettel.content}\n\n## Interação (${interaction.type}) - ${new Date(interaction.timestamp).toISOString()}\n${interaction.content}`;

          await prisma.knowledgeNode.update({
            where: { id: negotiationZettel.id },
            data: { content: updatedContent }
          });
        }
      }

    } catch (error) {
      logger.error({ error, data }, 'Curator: onInteractionCreated failed');
    }
  }

  // ============================================
  // HELPERS - Criação de Zettels
  // ============================================

  private async createOrUpdateClientZettel(params: {
    companyId: string;
    contactName: string;
    contactEmail?: string;
    contactPhone?: string;
    sourceType: string;
    sourceId: string;
    createdById: string;
  }) {
    // Verificar se já existe Zettel.CLIENT para este contato
    const existing = await prisma.knowledgeNode.findFirst({
      where: {
        companyId: params.companyId,
        nodeType: 'CLIENT',
        title: params.contactName
      }
    });

    if (existing) {
      // Apenas atualiza lastContactedAt
      return await prisma.knowledgeNode.update({
        where: { id: existing.id },
        data: { updatedAt: new Date() }
      });
    }

    // Criar novo
    return await prisma.knowledgeNode.create({
      data: {
        companyId: params.companyId,
        title: `Cliente: ${params.contactName}`,
        content: `# Perfil do Cliente\n\n**Nome:** ${params.contactName}\n**Email:** ${params.contactEmail || 'N/A'}\n**Telefone:** ${params.contactPhone || 'N/A'}\n\n## Histórico de Interações\n_Será atualizado automaticamente_`,
        nodeType: 'CLIENT',
        sourceType: params.sourceType,
        sourceId: params.sourceId,
        createdById: params.createdById,
        visibility: 'COMPANY',
        truthStatus: 'ACTIVE',
        freshnessScore: 1.0,
        tags: ['client', 'auto-created']
      }
    });
  }

  private async createNegotiationZettel(params: {
    companyId: string;
    contactName: string;
    conversationId: string;
    sourceType: string;
    sourceId: string;
    createdById: string;
    linkedTo: string[];
  }) {
    const zettel = await prisma.knowledgeNode.create({
      data: {
        companyId: params.companyId,
        title: `Negociação - ${params.contactName} - ${new Date().toISOString().split('T')[0]}`,
        content: `# Negociação com ${params.contactName}\n\n## Contexto\nIniciada via conversa #${params.conversationId}\n\n## Resumo\n_Será atualizado automaticamente conforme mensagens_\n\n## Objeções Detectadas\n\n## Próximos Passos\n\n## Risco\n`,
        nodeType: 'NEGOTIATION',
        sourceType: params.sourceType,
        sourceId: params.sourceId,
        createdById: params.createdById,
        visibility: 'COMPANY',
        truthStatus: 'ACTIVE',
        freshnessScore: 1.0,
        tags: ['negotiation', 'auto-created']
      }
    });

    // Criar links
    for (const targetId of params.linkedTo) {
      await this.createLink(zettel.id, targetId, 'RELATES', params.companyId);
    }

    return zettel;
  }

  private async createNegotiationZettelFromDeal(deal: any, companyId: string) {
    const contact = await prisma.contact.findUnique({ where: { id: deal.contactId } });

    return await prisma.knowledgeNode.create({
      data: {
        companyId,
        title: `Negociação - ${deal.title}`,
        content: `# ${deal.title}\n\n**Valor:** ${deal.value} ${deal.currency}\n**Stage:** ${deal.stage}\n**Probabilidade:** ${deal.probability || 'N/A'}%\n\n## Histórico\n_Atualizações automáticas_`,
        nodeType: 'NEGOTIATION',
        sourceType: 'deal',
        sourceId: deal.id,
        createdById: deal.ownerId,
        visibility: 'COMPANY',
        truthStatus: 'ACTIVE',
        freshnessScore: 1.0,
        entities: { dealId: deal.id, contactId: deal.contactId },
        tags: ['negotiation', 'auto-created', deal.stage]
      }
    });
  }

  private async createTaskZettel(params: {
    companyId: string;
    title: string;
    content: string;
    dueDate?: Date;
    priority: string;
    sourceType: string;
    sourceId: string;
    assigneeId?: string;
    createdById: string;
    linkedTo: string[];
  }) {
    const zettel = await prisma.knowledgeNode.create({
      data: {
        companyId: params.companyId,
        title: params.title,
        content: params.content,
        nodeType: 'TASK',
        sourceType: params.sourceType,
        sourceId: params.sourceId,
        assigneeId: params.assigneeId,
        dueDate: params.dueDate,
        priority: params.priority,
        createdById: params.createdById,
        visibility: 'TEAM',
        truthStatus: 'ACTIVE',
        tags: ['task', 'auto-created', params.priority.toLowerCase()]
      }
    });

    // Criar reminder automático
    if (params.assigneeId && params.dueDate) {
      await prisma.reminder.create({
        data: {
          companyId: params.companyId,
          nodeId: zettel.id,
          userId: params.assigneeId,
          type: 'TASK_DUE',
          scheduledFor: new Date(params.dueDate.getTime() - 24 * 60 * 60 * 1000), // 1 dia antes
          message: `Lembrete: ${params.title} vence amanhã`,
          status: 'PENDING'
        }
      });
    }

    // Criar links
    for (const targetId of params.linkedTo) {
      await this.createLink(zettel.id, targetId, 'DEPENDS_ON', params.companyId);
    }

    return zettel;
  }

  // ============================================
  // HELPERS - IA
  // ============================================

  private async detectCommitments(messageContent: string): Promise<any[]> {
    try {
      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Você é um assistente que detecta compromissos e tarefas em mensagens. Retorne JSON array com: {title, description, dueDate (ISO string ou null), priority (LOW/MEDIUM/HIGH)}. Se não houver compromissos, retorne [].`
          },
          {
            role: 'user',
            content: messageContent
          }
        ],
        temperature: 0.3
      });

      const content = response.choices[0]?.message?.content;
      if (!content) return [];

      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : [];

    } catch (error) {
      logger.error({ error }, 'Failed to detect commitments');
      return [];
    }
  }

  private async generateLearningFromDeal(deal: any, result: string): Promise<string> {
    try {
      // Buscar interações relacionadas
      const interactions = await prisma.interaction.findMany({
        where: { dealId: deal.id },
        orderBy: { timestamp: 'asc' }
      });

      const interactionsSummary = interactions.map(i =>
        `- ${i.type} (${new Date(i.timestamp).toISOString()}): ${i.content.substring(0, 200)}`
      ).join('\n');

      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Você é um especialista em vendas. Gere um resumo de lições aprendidas de um deal ${result === 'WON' ? 'ganho' : 'perdido'}. Inclua: o que funcionou, o que não funcionou, recomendações para o futuro.`
          },
          {
            role: 'user',
            content: `Deal: ${deal.title}\nValor: ${deal.value}\nRazão: ${result === 'WON' ? deal.wonReason : deal.lostReason}\n\nInterações:\n${interactionsSummary}`
          }
        ],
        temperature: 0.7
      });

      return response.choices[0]?.message?.content || 'Sem conteúdo gerado';

    } catch (error) {
      logger.error({ error }, 'Failed to generate learning');
      return `# Lições Aprendidas\n\n_Erro ao gerar conteúdo automaticamente. Deal ${result}._`;
    }
  }

  private async updateNegotiationWithMessage(zettelId: string, message: any) {
    const zettel = await prisma.knowledgeNode.findUnique({ where: { id: zettelId } });
    if (!zettel) return;

    const updatedContent = `${zettel.content}\n\n## Mensagem (${new Date(message.timestamp || new Date()).toISOString()})\n${message.content.substring(0, 500)}`;

    await prisma.knowledgeNode.update({
      where: { id: zettelId },
      data: { content: updatedContent, updatedAt: new Date() }
    });
  }

  // ============================================
  // HELPERS - Utilidades
  // ============================================

  private async findZettelBySource(sourceType: string, sourceId: string, nodeType?: string) {
    return await prisma.knowledgeNode.findFirst({
      where: {
        sourceType,
        sourceId,
        nodeType: nodeType || undefined,
        deletedAt: null
      }
    });
  }

  private async createLink(sourceId: string, targetId: string, linkType: string, companyId: string) {
    try {
      await prisma.knowledgeLink.create({
        data: {
          companyId,
          sourceId,
          targetId,
          linkType,
          strength: 1.0
        }
      });
    } catch (error) {
      // Ignora se link já existe
      if (!(error as any).code?.includes('unique')) {
        logger.error({ error }, 'Failed to create link');
      }
    }
  }

  private async getSystemUserId(companyId: string): Promise<string> {
    // Busca primeiro admin da empresa (fallback)
    const admin = await prisma.user.findFirst({
      where: { companyId, role: 'company_admin' }
    });
    return admin?.id || 'system';
  }
}

export const curatorService = new CuratorService();
