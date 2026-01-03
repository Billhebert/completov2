// src/modules/sync/connectors/chatwoot.ts
import { BaseConnector, SyncResult } from './base.connector';
import axios, { AxiosInstance } from 'axios';
import { logger } from '../../../core/logger';

/**
 * Chatwoot Connector
 * Docs: https://www.chatwoot.com/docs/product/channels/api/client-apis
 */
export class ChatwootConnector extends BaseConnector {
  private api: AxiosInstance;
  private accountId: string;

  get providerName() {
    return 'chatwoot';
  }

  constructor(prisma: any, companyId: string, config: any) {
    super(prisma, companyId, config);

    this.accountId = config.accountId;
    this.api = axios.create({
      baseURL: config.apiUrl || 'https://app.chatwoot.com',
      headers: {
        'api_access_token': config.apiKey,
        'Content-Type': 'application/json',
      },
    });
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.api.get(`/api/v1/accounts/${this.accountId}/contacts`);
      return true;
    } catch (error) {
      logger.error({ error }, 'Chatwoot connection test failed');
      return false;
    }
  }

  async pullEntities(entityType: string): Promise<SyncResult> {
    const result: SyncResult = { created: 0, updated: 0, skipped: 0, errors: 0, errorMessages: [] };

    switch (entityType) {
      case 'contacts':
        return this.pullContacts(result);
      case 'conversations':
        return this.pullConversations(result);
      default:
        return result;
    }
  }

  /**
   * Pull contacts from Chatwoot
   */
  private async pullContacts(result: SyncResult): Promise<SyncResult> {
    try {
      const response = await this.api.get(`/api/v1/accounts/${this.accountId}/contacts`, {
        params: { page: 1, per_page: 100 },
      });

      const contacts = response.data.payload || [];

      for (const cwContact of contacts) {
        try {
          // Fingerprint baseado nos dados principais
          const fingerprint = this.calculateFingerprint({
            email: cwContact.email,
            name: cwContact.name,
            phone: cwContact.phone_number,
          });

          // Verificar se já existe mapeamento
          const existing = await this.getMappedEntity('contacts', cwContact.id.toString());

          if (existing) {
            // Verificar se houve mudança
            if (existing.fingerprint === fingerprint) {
              result.skipped++;
              continue;
            }

            // Atualizar contato existente
            await this.prisma.contact.update({
              where: { id: existing.internalId },
              data: {
                name: cwContact.name || existing.internalId,
                email: cwContact.email,
                phone: cwContact.phone_number,
                customFields: {
                  chatwoot_id: cwContact.id,
                  chatwoot_identifier: cwContact.identifier,
                  chatwoot_thumbnail: cwContact.thumbnail,
                  chatwoot_additional_attributes: cwContact.additional_attributes || {},
                },
              },
            });

            await this.mapEntity('contacts', cwContact.id.toString(), existing.internalId, fingerprint);
            result.updated++;
          } else {
            // Criar novo contato
            const contact = await this.prisma.contact.create({
              data: {
                companyId: this.companyId,
                name: cwContact.name || cwContact.email || `Contact ${cwContact.id}`,
                email: cwContact.email,
                phone: cwContact.phone_number,
                tags: [], // Chatwoot usa labels, mapear se necessário
                customFields: {
                  chatwoot_id: cwContact.id,
                  chatwoot_identifier: cwContact.identifier,
                  chatwoot_thumbnail: cwContact.thumbnail,
                  chatwoot_additional_attributes: cwContact.additional_attributes || {},
                },
                leadSource: 'chatwoot',
              },
            });

            await this.mapEntity('contacts', cwContact.id.toString(), contact.id, fingerprint);
            result.created++;
          }
        } catch (error: any) {
          result.errors++;
          result.errorMessages?.push(`Contact ${cwContact.id}: ${error.message}`);
          logger.error({ error, contactId: cwContact.id }, 'Failed to sync Chatwoot contact');
        }
      }
    } catch (error: any) {
      logger.error({ error }, 'Failed to pull Chatwoot contacts');
      result.errors++;
      result.errorMessages?.push(error.message);
    }

    return result;
  }

  /**
   * Pull conversations from Chatwoot
   */
  private async pullConversations(result: SyncResult): Promise<SyncResult> {
    try {
      const response = await this.api.get(`/api/v1/accounts/${this.accountId}/conversations`, {
        params: { status: 'all', page: 1 },
      });

      const conversations = response.data.data.payload || [];

      for (const cwConversation of conversations) {
        try {
          const fingerprint = this.calculateFingerprint({
            id: cwConversation.id,
            status: cwConversation.status,
            messages_count: cwConversation.messages_count,
          });

          const existing = await this.getMappedEntity('conversations', cwConversation.id.toString());

          // Buscar ou criar contato primeiro
          let contactId: string | null = null;
          if (cwConversation.meta?.sender) {
            const contactMapping = await this.getMappedEntity(
              'contacts',
              cwConversation.meta.sender.id.toString()
            );
            contactId = contactMapping?.internalId || null;
          }

          if (existing) {
            if (existing.fingerprint === fingerprint) {
              result.skipped++;
              continue;
            }

            // Atualizar conversa
            await this.prisma.conversation.update({
              where: { id: existing.internalId },
              data: {
                status: this.mapConversationStatus(cwConversation.status),
                metadata: {
                  chatwoot_id: cwConversation.id,
                  chatwoot_inbox_id: cwConversation.inbox_id,
                  chatwoot_messages_count: cwConversation.messages_count,
                  chatwoot_labels: cwConversation.labels || [],
                },
              },
            });

            await this.mapEntity('conversations', cwConversation.id.toString(), existing.internalId, fingerprint);
            result.updated++;
          } else {
            // Criar nova conversa
            const conversation = await this.prisma.conversation.create({
              data: {
                companyId: this.companyId,
                channel: 'chatwoot',
                status: this.mapConversationStatus(cwConversation.status),
                metadata: {
                  chatwoot_id: cwConversation.id,
                  chatwoot_inbox_id: cwConversation.inbox_id,
                  chatwoot_messages_count: cwConversation.messages_count,
                  chatwoot_labels: cwConversation.labels || [],
                },
              },
            });

            await this.mapEntity('conversations', cwConversation.id.toString(), conversation.id, fingerprint);
            result.created++;
          }
        } catch (error: any) {
          result.errors++;
          result.errorMessages?.push(`Conversation ${cwConversation.id}: ${error.message}`);
          logger.error({ error, conversationId: cwConversation.id }, 'Failed to sync Chatwoot conversation');
        }
      }
    } catch (error: any) {
      logger.error({ error }, 'Failed to pull Chatwoot conversations');
      result.errors++;
      result.errorMessages?.push(error.message);
    }

    return result;
  }

  /**
   * Push entities to Chatwoot
   */
  async pushEntities(entityType: string): Promise<SyncResult> {
    const result: SyncResult = { created: 0, updated: 0, skipped: 0, errors: 0 };

    if (entityType === 'contacts') {
      return this.pushContacts(result);
    }

    return result;
  }

  /**
   * Push contacts to Chatwoot
   */
  private async pushContacts(result: SyncResult): Promise<SyncResult> {
    try {
      const contacts = await this.prisma.contact.findMany({
        where: { companyId: this.companyId },
        take: 100,
      });

      for (const contact of contacts) {
        try {
          const mapping = await this.getMappedEntity('contacts', contact.id);

          const payload = {
            name: contact.name,
            email: contact.email,
            phone_number: contact.phone,
            additional_attributes: {
              company_name: contact.companyName,
              position: contact.position,
              ...(contact.customFields as Record<string, any> || {}),
            },
          };

          if (mapping) {
            // Atualizar no Chatwoot
            await this.api.put(
              `/api/v1/accounts/${this.accountId}/contacts/${mapping.externalId}`,
              payload
            );
            result.updated++;
          } else {
            // Criar no Chatwoot
            const response = await this.api.post(
              `/api/v1/accounts/${this.accountId}/contacts`,
              payload
            );

            const chatwootContactId = response.data.payload?.contact?.id;
            if (chatwootContactId) {
              await this.mapEntity('contacts', chatwootContactId.toString(), contact.id);
              result.created++;
            }
          }
        } catch (error: any) {
          result.errors++;
          result.errorMessages?.push(`Contact ${contact.id}: ${error.message}`);
          logger.error({ error, contactId: contact.id }, 'Failed to push contact to Chatwoot');
        }
      }
    } catch (error: any) {
      logger.error({ error }, 'Failed to push contacts to Chatwoot');
      result.errors++;
      result.errorMessages?.push(error.message);
    }

    return result;
  }

  /**
   * Map Chatwoot conversation status to internal status
   */
  private mapConversationStatus(chatwootStatus: string): string {
    const statusMap: Record<string, string> = {
      'open': 'active',
      'pending': 'active',
      'resolved': 'completed',
      'snoozed': 'snoozed',
    };
    return statusMap[chatwootStatus] || 'active';
  }

  /**
   * Webhook handler for Chatwoot events
   */
  async handleWebhook(event: any): Promise<void> {
    try {
      const eventType = event.event;

      switch (eventType) {
        case 'message_created':
          await this.handleMessageCreated(event);
          break;
        case 'conversation_created':
        case 'conversation_updated':
          await this.handleConversationEvent(event);
          break;
        case 'contact_created':
        case 'contact_updated':
          await this.handleContactEvent(event);
          break;
        default:
          logger.debug({ eventType }, 'Unhandled Chatwoot webhook event');
      }
    } catch (error) {
      logger.error({ error, event }, 'Failed to handle Chatwoot webhook');
      throw error;
    }
  }

  private async handleMessageCreated(event: any): Promise<void> {
    const message = event.message;
    const conversationId = event.conversation?.id;

    if (!conversationId) return;

    // Buscar mapeamento da conversa
    const conversationMapping = await this.getMappedEntity(
      'conversations',
      conversationId.toString()
    );

    if (conversationMapping) {
      // Criar mensagem no sistema
      await this.prisma.message.create({
        data: {
          companyId: this.companyId,
          conversationId: conversationMapping.internalId,
          content: message.content,
          messageType: this.mapMessageType(message.message_type),
          senderId: message.sender?.id?.toString() || 'system',
          authorId: message.sender?.id?.toString() || 'system',
          metadata: {
            chatwoot_id: message.id,
            chatwoot_inbox_id: event.inbox?.id,
            chatwoot_private: message.private,
          },
        },
      });
    }
  }

  private async handleConversationEvent(event: any): Promise<void> {
    // Sync single conversation
    const result: SyncResult = { created: 0, updated: 0, skipped: 0, errors: 0 };
    // Implementation similar to pullConversations but for single conversation
  }

  private async handleContactEvent(event: any): Promise<void> {
    // Sync single contact
    const result: SyncResult = { created: 0, updated: 0, skipped: 0, errors: 0 };
    // Implementation similar to pullContacts but for single contact
  }

  private mapMessageType(chatwootType: number): string {
    // Chatwoot message types: 0 = incoming, 1 = outgoing, 2 = activity
    const typeMap: Record<number, string> = {
      0: 'text',
      1: 'text',
      2: 'system',
    };
    return typeMap[chatwootType] || 'text';
  }
}
