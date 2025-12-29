// src/modules/omnichannel/whatsapp.service.ts
import { PrismaClient } from '@prisma/client';
import axios, { AxiosInstance } from 'axios';
import { logger } from '../../core/logger';
import { EventBus, Events } from '../../core/event-bus';

export class WhatsAppService {
  private api: AxiosInstance;

  constructor(
    private prisma: PrismaClient,
    private eventBus: EventBus,
    private apiUrl: string,
    private apiKey: string
  ) {
    this.api = axios.create({
      baseURL: apiUrl,
      headers: {
        'apikey': apiKey,
      },
    });
  }

  /**
   * Create WhatsApp instance
   */
  async createInstance(companyId: string, data: {
    name: string;
    instanceName: string;
    webhookUrl?: string;
  }) {
    try {
      // Create in Evolution API
      const response = await this.api.post('/instance/create', {
        instanceName: data.instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
      });

      // Save to database
      const account = await this.prisma.whatsAppAccount.create({
        data: {
          companyId,
          name: data.name,
          instanceName: data.instanceName,
          apiUrl: this.apiUrl,
          apiKey: this.apiKey,
          webhookUrl: data.webhookUrl || '',
          status: 'disconnected',
        },
      });

      logger.info({ accountId: account.id, instanceName: data.instanceName }, 'WhatsApp instance created');

      return account;
    } catch (error: any) {
      logger.error({ error }, 'Failed to create WhatsApp instance');
      throw error;
    }
  }

  /**
   * Get QR Code for connection
   */
  async getQRCode(accountId: string) {
    const account = await this.prisma.whatsAppAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) throw new Error('Account not found');

    try {
      const response = await this.api.get(`/instance/connect/${account.instanceName}`);
      
      // Update QR code in database
      await this.prisma.whatsAppAccount.update({
        where: { id: accountId },
        data: {
          qrCode: response.data.qrcode?.base64 || null,
        },
      });

      return response.data.qrcode;
    } catch (error: any) {
      logger.error({ error, accountId }, 'Failed to get QR code');
      throw error;
    }
  }

  /**
   * Send message
   */
  async sendMessage(accountId: string, data: {
    phoneNumber: string;
    message: string;
    mediaUrl?: string;
  }) {
    const account = await this.prisma.whatsAppAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) throw new Error('Account not found');

    try {
      const payload: any = {
        number: data.phoneNumber.replace(/\D/g, ''),
        options: {
          delay: 1200,
        },
      };

      if (data.mediaUrl) {
        payload.mediaMessage = {
          mediaUrl: data.mediaUrl,
        };
      } else {
        payload.textMessage = {
          text: data.message,
        };
      }

      const response = await this.api.post(
        `/message/sendText/${account.instanceName}`,
        payload
      );

      // Find or create contact
      let contact = await this.prisma.whatsAppContact.findUnique({
        where: {
          accountId_phoneNumber: {
            accountId: account.id,
            phoneNumber: data.phoneNumber,
          },
        },
      });

      if (!contact) {
        contact = await this.prisma.whatsAppContact.create({
          data: {
            accountId: account.id,
            phoneNumber: data.phoneNumber,
            isGroup: false,
          },
        });
      }

      // Find or create conversation
      let conversation = await this.prisma.whatsAppConversation.findUnique({
        where: {
          accountId_contactId: {
            accountId: account.id,
            contactId: contact.id,
          },
        },
      });

      if (!conversation) {
        conversation = await this.prisma.whatsAppConversation.create({
          data: {
            accountId: account.id,
            contactId: contact.id,
            lastMessageAt: new Date(),
          },
        });
      }

      // Save message
      const message = await this.prisma.whatsAppMessage.create({
        data: {
          conversationId: conversation.id,
          contactId: contact.id,
          externalId: response.data.key?.id || `msg_${Date.now()}`,
          direction: 'outgoing',
          type: data.mediaUrl ? 'media' : 'text',
          content: data.message,
          mediaUrl: data.mediaUrl,
          status: 'sent',
          timestamp: new Date(),
        },
      });

      logger.info({ messageId: message.id, accountId }, 'WhatsApp message sent');

      return message;
    } catch (error: any) {
      logger.error({ error, accountId }, 'Failed to send WhatsApp message');
      throw error;
    }
  }

  /**
   * Process incoming webhook
   */
  async processWebhook(event: any, accountId: string) {
    try {
      const account = await this.prisma.whatsAppAccount.findUnique({
        where: { id: accountId },
      });

      if (!account) {
        logger.warn({ accountId }, 'Account not found for webhook');
        return;
      }

      switch (event.event) {
        case 'connection.update':
          await this.handleConnectionUpdate(account, event.data);
          break;

        case 'messages.upsert':
          await this.handleIncomingMessage(account, event.data);
          break;

        case 'messages.update':
          await this.handleMessageUpdate(account, event.data);
          break;

        default:
          logger.debug({ event: event.event }, 'Unhandled webhook event');
      }
    } catch (error) {
      logger.error({ error, accountId }, 'Failed to process webhook');
    }
  }

  private async handleConnectionUpdate(account: any, data: any) {
    const status = data.state === 'open' ? 'connected' : 'disconnected';

    await this.prisma.whatsAppAccount.update({
      where: { id: account.id },
      data: {
        status,
        lastConnectedAt: status === 'connected' ? new Date() : account.lastConnectedAt,
        qrCode: status === 'connected' ? null : account.qrCode,
      },
    });

    logger.info({ accountId: account.id, status }, 'WhatsApp connection updated');
  }

  private async handleIncomingMessage(account: any, data: any) {
    const message = data.messages?.[0];
    if (!message || message.key.fromMe) return;

    const phoneNumber = message.key.remoteJid.replace('@s.whatsapp.net', '');

    // Find or create contact
    let contact = await this.prisma.whatsAppContact.findUnique({
      where: {
        accountId_phoneNumber: {
          accountId: account.id,
          phoneNumber,
        },
      },
    });

    if (!contact) {
      contact = await this.prisma.whatsAppContact.create({
        data: {
          accountId: account.id,
          phoneNumber,
          name: message.pushName || null,
          isGroup: message.key.remoteJid.includes('@g.us'),
        },
      });
    }

    // Find or create conversation
    let conversation = await this.prisma.whatsAppConversation.findUnique({
      where: {
        accountId_contactId: {
          accountId: account.id,
          contactId: contact.id,
        },
      },
    });

    if (!conversation) {
      conversation = await this.prisma.whatsAppConversation.create({
        data: {
          accountId: account.id,
          contactId: contact.id,
          lastMessageAt: new Date(),
          unreadCount: 1,
        },
      });
    } else {
      await this.prisma.whatsAppConversation.update({
        where: { id: conversation.id },
        data: {
          lastMessageAt: new Date(),
          unreadCount: { increment: 1 },
        },
      });
    }

    // Save message
    const content = message.message?.conversation || 
                   message.message?.extendedTextMessage?.text ||
                   message.message?.imageMessage?.caption ||
                   message.message?.videoMessage?.caption ||
                   '';

    const savedMessage = await this.prisma.whatsAppMessage.create({
      data: {
        conversationId: conversation.id,
        contactId: contact.id,
        externalId: message.key.id,
        direction: 'incoming',
        type: this.getMessageType(message.message),
        content,
        mediaUrl: message.message?.imageMessage?.url || message.message?.videoMessage?.url || null,
        status: 'received',
        timestamp: new Date(message.messageTimestamp * 1000),
        metadata: message,
      },
    });

    // Publish event
    await this.eventBus.publish(Events.OMNICHANNEL_MESSAGE_RECEIVED, {
      type: Events.OMNICHANNEL_MESSAGE_RECEIVED,
      version: 'v1',
      timestamp: new Date(),
      companyId: account.companyId,
      userId: null,
      data: {
        channel: 'whatsapp',
        messageId: savedMessage.id,
        conversationId: conversation.id,
        phoneNumber,
        content,
      },
    });

    logger.info({ messageId: savedMessage.id, conversationId: conversation.id }, 'WhatsApp message received');
  }

  private async handleMessageUpdate(account: any, data: any) {
    // Handle message status updates (delivered, read, etc.)
    logger.debug({ data }, 'Message update received');
  }

  private getMessageType(message: any): string {
    if (message.conversation) return 'text';
    if (message.imageMessage) return 'image';
    if (message.videoMessage) return 'video';
    if (message.audioMessage) return 'audio';
    if (message.documentMessage) return 'document';
    if (message.contactMessage) return 'contact';
    if (message.locationMessage) return 'location';
    return 'unknown';
  }

  /**
   * Get instance info
   */
  async getInstanceInfo(accountId: string) {
    const account = await this.prisma.whatsAppAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) throw new Error('Account not found');

    try {
      const response = await this.api.get(`/instance/connectionState/${account.instanceName}`);
      return response.data;
    } catch (error: any) {
      logger.error({ error, accountId }, 'Failed to get instance info');
      throw error;
    }
  }

  /**
   * Logout instance
   */
  async logout(accountId: string) {
    const account = await this.prisma.whatsAppAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) throw new Error('Account not found');

    try {
      await this.api.delete(`/instance/logout/${account.instanceName}`);

      await this.prisma.whatsAppAccount.update({
        where: { id: accountId },
        data: {
          status: 'disconnected',
          qrCode: null,
        },
      });

      logger.info({ accountId }, 'WhatsApp instance logged out');
    } catch (error: any) {
      logger.error({ error, accountId }, 'Failed to logout WhatsApp instance');
      throw error;
    }
  }
}
