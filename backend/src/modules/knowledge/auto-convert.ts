// src/modules/knowledge/auto-convert.ts
import { PrismaClient } from '@prisma/client';
import { EventBus, Events } from '../../core/event-bus';

/**
 * Automatic Entity-to-Zettel Conversion Service
 *
 * Listens to business events and automatically converts entities to zettels
 * Everything in the system becomes a zettel for complete knowledge graph
 */
export class AutoConvertService {
  constructor(
    private prisma: PrismaClient,
    private eventBus: EventBus
  ) {
    this.setupEventListeners();
  }

  /**
   * Normaliza tags para Prisma:
   * - remove null/undefined
   * - remove strings vazias
   * - trim
   * - garante apenas strings
   * - remove duplicadas mantendo ordem
   */
  private normalizeTags(input: unknown[]): string[] {
    const cleaned = input
      .filter((t) => typeof t === 'string')
      .map((t) => (t as string).trim())
      .filter((t) => t.length > 0);

    return Array.from(new Set(cleaned));
  }

  /**
   * Como seu schema NÃO tem isCompanyWide, usamos visibility.
   * Se no seu schema visibility tiver valores diferentes, ajuste aqui.
   */
  private companyVisibility(): string {
    return 'company';
  }

  private setupEventListeners() {
    // Convert Deals to Zettels
    this.eventBus.on(Events.DEAL_CREATED, async (event: any) => {
      try {
        await this.convertDealToZettel(event);
      } catch (error) {
        console.error('Failed to convert deal to zettel:', error);
      }
    });

    this.eventBus.on(Events.DEAL_WON, async (event: any) => {
      try {
        await this.updateDealZettel(event, 'Deal Won! 🎉');
      } catch (error) {
        console.error('Failed to update deal zettel:', error);
      }
    });

    // Convert Important Messages to Zettels
    this.eventBus.on(Events.CHAT_MESSAGE_SENT, async (event: any) => {
      try {
        if (event?.data?.isImportant || event?.data?.shouldArchive) {
          await this.convertMessageToZettel(event);
        }
      } catch (error) {
        console.error('Failed to convert message to zettel:', error);
      }
    });

    // Convert Contacts to Zettels
    this.eventBus.on(Events.CONTACT_CREATED, async (event: any) => {
      try {
        await this.convertContactToZettel(event);
      } catch (error) {
        console.error('Failed to convert contact to zettel:', error);
      }
    });
  }

  private async convertDealToZettel(event: any) {
    const { data, companyId, userId } = event;

    // Check if zettel already exists
    const existingZettel = await this.prisma.knowledgeNode.findFirst({
      where: {
        companyId,
        metadata: {
          path: ['sourceEntityId'],
          equals: data.dealId,
        } as any,
      },
    });

    if (existingZettel) {
      console.log('Deal zettel already exists, skipping');
      return;
    }

    // Get deal details
    const deal = await this.prisma.deal.findUnique({
      where: { id: data.dealId },
      include: {
        contact: true,
        owner: true,
        products: true,
      },
    });

    if (!deal) return;

    const content = `
## Deal: ${data.dealTitle || deal.title}

**Status:** ${deal.stage}
**Valor:** R$ ${Number((deal as any).value || 0).toLocaleString('pt-BR')}
**Contato:** ${(deal as any).contact?.name || 'N/A'}
**Responsável:** ${(deal as any).owner?.name || 'N/A'}

### Produtos/Serviços:
${
  (deal as any).products?.length
    ? (deal as any).products
        .map((p: any) => `- ${p.productName} (${p.quantity}x R$ ${p.unitPrice})`)
        .join('\n')
    : 'Nenhum produto especificado'
}

### Data de Criação:
${deal.createdAt.toLocaleDateString('pt-BR')}

### Data Esperada de Fechamento:
${
  (deal as any).expectedCloseDate
    ? new Date((deal as any).expectedCloseDate).toLocaleDateString('pt-BR')
    : 'Não definida'
}

### Observações:
${(deal as any).notes || 'Sem observações'}
    `.trim();

    const tags = this.normalizeTags([
      'deal',
      'vendas',
      (deal as any).stage,
      (deal as any).contact?.companyName,
    ]);

    const node = await this.prisma.knowledgeNode.create({
      data: {
        title: `Deal: ${data.dealTitle || deal.title}`,
        content,
        nodeType: 'deal',
        tags,
        companyId,
        createdById: userId || (deal as any).ownerId,
        visibility: this.companyVisibility(),
        importanceScore: Number((deal as any).value || 0) > 10000 ? 0.8 : 0.6,
        metadata: {
          sourceEntityType: 'deal',
          sourceEntityId: data.dealId,
          autoConverted: true,
          convertedAt: new Date().toISOString(),
        } as any,
      },
    });

    await this.indexInRAG(node);
    console.log(`✅ Deal converted to zettel: ${node.id}`);
  }

  private async updateDealZettel(event: any, statusUpdate: string) {
    const { data, companyId } = event;

    const zettel = await this.prisma.knowledgeNode.findFirst({
      where: {
        companyId,
        metadata: {
          path: ['sourceEntityId'],
          equals: data.dealId,
        } as any,
      },
    });

    if (!zettel) return;

    const updatedContent =
      `${zettel.content}\n\n### Update: ${new Date().toLocaleDateString('pt-BR')}\n` +
      `${statusUpdate}\nValor: R$ ${data.value?.toLocaleString?.('pt-BR') || 'N/A'}`;

    const updated = await this.prisma.knowledgeNode.update({
      where: { id: zettel.id },
      data: {
        content: updatedContent,
        importanceScore: 0.9,
        tags: this.normalizeTags([...(zettel.tags || []), 'won', 'closed']),
      },
    });

    await this.indexInRAG(updated);
    console.log(`✅ Deal zettel updated: ${updated.id}`);
  }

  private async convertMessageToZettel(event: any) {
    const { data, companyId, userId } = event;

    const message = await this.prisma.message.findUnique({
      where: { id: data.messageId },
      include: {
        author: true,
        channel: true,
      },
    });

    if (!message) return;

    const authorName = (message as any).author?.name || 'Desconhecido';
    const channelName = (message as any).channel?.name || 'Mensagem Direta';
    const channelType = (message as any).channel?.type || 'direct';

    const content = `
## Mensagem Importante

**De:** ${authorName}
**Canal:** ${channelName}
**Data:** ${message.createdAt.toLocaleDateString('pt-BR')} ${message.createdAt.toLocaleTimeString('pt-BR')}

### Conteúdo:
${(message as any).content}

### Contexto:
${data.context || 'Mensagem marcada como importante para arquivo'}
    `.trim();

    const node = await this.prisma.knowledgeNode.create({
      data: {
        title: `Mensagem: ${channelName} - ${authorName}`,
        content,
        nodeType: 'message',
        tags: this.normalizeTags(['message', 'chat', channelType]),
        companyId,
        createdById: userId || (message as any).authorId,
        visibility: (channelType === 'public') ? this.companyVisibility() : 'private',
        ownerId: (channelType === 'private') ? (message as any).authorId : null,
        importanceScore: 0.7,
        metadata: {
          sourceEntityType: 'message',
          sourceEntityId: data.messageId,
          autoConverted: true,
          convertedAt: new Date().toISOString(),
        } as any,
      },
    });

    await this.indexInRAG(node);
    console.log(`✅ Message converted to zettel: ${node.id}`);
  }

  private async convertContactToZettel(event: any) {
    const { data, companyId, userId } = event;

    // ✅ Evita duplicar zettel do contato
    const existing = await this.prisma.knowledgeNode.findFirst({
      where: {
        companyId,
        metadata: {
          path: ['sourceEntityId'],
          equals: data.contactId,
        } as any,
      },
    });

    if (existing) {
      console.log('Contact zettel already exists, skipping');
      return;
    }

    const contact = await this.prisma.contact.findUnique({
      where: { id: data.contactId },
      include: {
        deals: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
        interactions: {
          take: 5,
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!contact) return;

    const contactName = (contact as any).name || data?.name || 'Contato';
    const contactTags = Array.isArray((contact as any).tags) ? (contact as any).tags : [];

    const content = `
## Contato: ${contactName}

**Email:** ${(contact as any).email || 'N/A'}
**Telefone:** ${(contact as any).phone || 'N/A'}
**Empresa:** ${(contact as any).companyName || 'N/A'}
**Cargo:** ${(contact as any).position || 'N/A'}
**Website:** ${(contact as any).website || 'N/A'}
**Status:** ${(contact as any).leadStatus ?? 'N/A'}

### Tags:
${contactTags.length ? contactTags.join(', ') : 'Sem tags'}

### Deals Recentes:
${
  (contact as any).deals?.length
    ? (contact as any).deals
        .map((d: any) => `- ${d.title} (${d.stage}) - R$ ${d.value}`)
        .join('\n')
    : 'Nenhum deal'
}

### Interações Recentes:
${
  (contact as any).interactions?.length
    ? (contact as any).interactions
        .map((i: any) => {
          const subject = i.subject || (i.content ? String(i.content).substring(0, 50) : '');
          return `- ${i.type}: ${subject || 'Sem assunto'}`;
        })
        .join('\n')
    : 'Nenhuma interação'
}

### Observações:
Contato adicionado em ${contact.createdAt.toLocaleDateString('pt-BR')}
    `.trim();

    const tags = this.normalizeTags([
      'contact',
      'crm',
      (contact as any).leadStatus,
      ...contactTags,
    ]);

    const leadStatus = String((contact as any).leadStatus || '').toLowerCase();
    const importanceScore =
      leadStatus === 'customer' ? 0.85 :
      leadStatus === 'prospect' ? 0.7 :
      leadStatus === 'lead' ? 0.55 :
      0.4;

    const node = await this.prisma.knowledgeNode.create({
      data: {
        title: `Contato: ${contactName} - ${(contact as any).companyName || 'Individual'}`,
        content,
        nodeType: 'reference',
        tags,
        companyId,
        createdById: userId,
        visibility: this.companyVisibility(),
        importanceScore,
        metadata: {
          sourceEntityType: 'contact',
          sourceEntityId: data.contactId,
          autoConverted: true,
          convertedAt: new Date().toISOString(),
        } as any,
      },
    });

    await this.indexInRAG(node);
    console.log(`✅ Contact converted to zettel: ${node.id}`);
  }

  private async indexInRAG(node: any) {
    try {
      const { getAIService } = await import('../../core/ai/ai.service');
      const aiService = getAIService(this.prisma);

      const embedding = await aiService.generateEmbedding(
        `${node.title}\n\n${node.content}\n\nTags: ${(node.tags || []).join(', ')}`
      );

      await this.prisma.embedding.upsert({
        where: { nodeId: node.id },
        update: { embedding },
        create: {
          companyId: node.companyId,
          nodeId: node.id,
          model: 'text-embedding-ada-002',
          embedding,
        },
      });

      console.log(`✅ Indexed in RAG: ${node.id}`);
    } catch (error) {
      console.error('Failed to index in RAG:', error);
    }
  }
}

// Singleton instance
let autoConvertService: AutoConvertService | null = null;

export function initializeAutoConvert(prisma: PrismaClient, eventBus: EventBus) {
  if (!autoConvertService) {
    autoConvertService = new AutoConvertService(prisma, eventBus);
    console.log('✅ Auto-convert service initialized');
  }
  return autoConvertService;
}

export function getAutoConvertService() {
  if (!autoConvertService) {
    throw new Error('AutoConvertService not initialized. Call initializeAutoConvert first.');
  }
  return autoConvertService;
}
