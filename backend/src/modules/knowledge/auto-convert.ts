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
        // Only convert messages marked as important or from certain channels
        if (event.data.isImportant || event.data.shouldArchive) {
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

    // You can add more event listeners for other entities
    // Examples: MEETING_COMPLETED, TASK_CREATED, etc.
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

    // Create zettel content
    const content = `
## Deal: ${data.dealTitle || deal.title}

**Status:** ${deal.stage}
**Valor:** R$ ${deal.value.toLocaleString('pt-BR')}
**Contato:** ${deal.contact?.name || 'N/A'}
**Responsável:** ${deal.owner?.name || 'N/A'}

### Produtos/Serviços:
${deal.products?.map(p => `- ${p.productName} (${p.quantity}x R$ ${p.unitPrice})`).join('\n') || 'Nenhum produto especificado'}

### Data de Criação:
${deal.createdAt.toLocaleDateString('pt-BR')}

### Data Esperada de Fechamento:
${deal.expectedCloseDate ? new Date(deal.expectedCloseDate).toLocaleDateString('pt-BR') : 'Não definida'}

### Observações:
${deal.notes || 'Sem observações'}
    `.trim();

    // Create zettel
    const node = await this.prisma.knowledgeNode.create({
      data: {
        title: `Deal: ${data.dealTitle || deal.title}`,
        content,
        nodeType: 'deal',
        tags: ['deal', 'vendas', deal.stage, deal.contact?.companyName || ''].filter(Boolean),
        companyId,
        createdById: userId || deal.ownerId,
        isCompanyWide: true, // Deals are company-wide by default
        importanceScore: deal.value > 10000 ? 0.8 : 0.6, // Higher score for bigger deals
        metadata: {
          sourceEntityType: 'deal',
          sourceEntityId: data.dealId,
          autoConverted: true,
          convertedAt: new Date().toISOString(),
        } as any,
      },
    });

    // Auto-index in RAG
    await this.indexInRAG(node);

    console.log(`✅ Deal converted to zettel: ${node.id}`);
  }

  private async updateDealZettel(event: any, statusUpdate: string) {
    const { data, companyId } = event;

    // Find existing zettel
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

    // Update zettel with new status
    const updatedContent = `${zettel.content}\n\n### Update: ${new Date().toLocaleDateString('pt-BR')}\n${statusUpdate}\nValor: R$ ${data.value?.toLocaleString('pt-BR') || 'N/A'}`;

    const updated = await this.prisma.knowledgeNode.update({
      where: { id: zettel.id },
      data: {
        content: updatedContent,
        importanceScore: 0.9, // Increase importance when deal is won
        tags: [...new Set([...zettel.tags, 'won', 'closed'])],
      },
    });

    // Update RAG index
    await this.indexInRAG(updated);

    console.log(`✅ Deal zettel updated: ${updated.id}`);
  }

  private async convertMessageToZettel(event: any) {
    const { data, companyId, userId } = event;

    // Get message details
    const message = await this.prisma.message.findUnique({
      where: { id: data.messageId },
      include: {
        author: true,
        channel: true,
      },
    });

    if (!message) return;

    const content = `
## Mensagem Importante

**De:** ${message.author.name}
**Canal:** ${message.channel?.name || 'Mensagem Direta'}
**Data:** ${message.createdAt.toLocaleDateString('pt-BR')} ${message.createdAt.toLocaleTimeString('pt-BR')}

### Conteúdo:
${message.content}

### Contexto:
${data.context || 'Mensagem marcada como importante para arquivo'}
    `.trim();

    const node = await this.prisma.knowledgeNode.create({
      data: {
        title: `Mensagem: ${message.channel?.name || 'DM'} - ${message.author.name}`,
        content,
        nodeType: 'message',
        tags: ['message', 'chat', message.channel?.type || 'direct'],
        companyId,
        createdById: userId || message.authorId,
        isCompanyWide: message.channel?.type === 'public', // Public channel = company-wide
        ownerId: message.channel?.type === 'private' ? message.authorId : null,
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

    // Get contact details
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

    const content = `
## Contato: ${data.name}

**Email:** ${contact.email || 'N/A'}
**Telefone:** ${contact.phone || 'N/A'}
**Empresa:** ${contact.companyName || 'N/A'}
**Cargo:** ${contact.position || 'N/A'}
**Website:** ${contact.website || 'N/A'}
**Status:** ${contact.leadStatus}

### Tags:
${contact.tags.join(', ') || 'Sem tags'}

### Deals Recentes:
${contact.deals?.map(d => `- ${d.title} (${d.stage}) - R$ ${d.value}`).join('\n') || 'Nenhum deal'}

### Interações Recentes:
${contact.interactions?.map(i => `- ${i.type}: ${i.subject || i.content.substring(0, 50)}`).join('\n') || 'Nenhuma interação'}

### Observações:
Contato adicionado em ${contact.createdAt.toLocaleDateString('pt-BR')}
    `.trim();

    const node = await this.prisma.knowledgeNode.create({
      data: {
        title: `Contato: ${data.name} - ${contact.companyName || 'Individual'}`,
        content,
        nodeType: 'reference',
        tags: ['contact', 'crm', contact.leadStatus, ...(contact.tags || [])],
        companyId,
        createdById: userId,
        isCompanyWide: true, // Contacts are company-wide
        importanceScore: contact.leadStatus === 'qualified' ? 0.8 : 0.5,
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
        `${node.title}\n\n${node.content}\n\nTags: ${node.tags.join(', ')}`
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
