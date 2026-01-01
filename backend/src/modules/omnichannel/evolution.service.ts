// src/modules/omnichannel/evolution.service.ts
import axios, { AxiosInstance } from 'axios';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../core/logger';
import { EventBus, Events } from '../../core/event-bus';

export class EvolutionAPIService {
  private client: AxiosInstance;

  constructor(
    private prisma: PrismaClient,
    private eventBus: EventBus
  ) {
    this.client = axios.create({
      timeout: 30000,
    });
  }

  /**
   * Initialize WhatsApp instance
   */
  async initInstance(accountId: string) {
    const account = await this.prisma.whatsAppAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) throw new Error('Account not found');

    try {
      const response = await this.client.post(
        `${account.apiUrl}/instance/create`,
        {
          instanceName: account.instanceName,
          qrcode: true,
          webhook: account.webhookUrl,
        },
        {
          headers: { apikey: account.apiKey },
        }
      );

      await this.prisma.whatsAppAccount.update({
        where: { id: accountId },
        data: { status: 'connecting' },
      });

      logger.info({ accountId, instanceName: account.instanceName }, 'Instance created');

      return response.data;
    } catch (error: any) {
      logger.error({ accountId, error }, 'Failed to create instance');
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
      const response = await this.client.get(
        `${account.apiUrl}/instance/qrcode/${account.instanceName}`,
        {
          headers: { apikey: account.apiKey },
        }
      );

      const qrCode = response.data.base64 || response.data.qrcode;

      await this.prisma.whatsAppAccount.update({
        where: { id: accountId },
        data: { qrCode },
      });

      return { qrCode };
    } catch (error: any) {
      logger.error({ accountId, error }, 'Failed to get QR code');
      throw error;
    }
  }

  /**
   * Send text message
   */
  async sendMessage(accountId: string, to: string, text: string) {
    const account = await this.prisma.whatsAppAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) throw new Error('Account not found');

    try {
      const response = await this.client.post(
        `${account.apiUrl}/message/sendText/${account.instanceName}`,
        {
          number: to,
          text,
        },
        {
          headers: { apikey: account.apiKey },
        }
      );

      logger.info({ accountId, to }, 'Message sent');

      return response.data;
    } catch (error: any) {
      logger.error({ accountId, to, error }, 'Failed to send message');
      throw error;
    }
  }

  /**
   * Send media message
   */
  async sendMedia(accountId: string, to: string, mediaUrl: string, caption?: string) {
    const account = await this.prisma.whatsAppAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) throw new Error('Account not found');

    try {
      const response = await this.client.post(
        `${account.apiUrl}/message/sendMedia/${account.instanceName}`,
        {
          number: to,
          mediaurl: mediaUrl,
          caption,
        },
        {
          headers: { apikey: account.apiKey },
        }
      );

      logger.info({ accountId, to }, 'Media sent');

      return response.data;
    } catch (error: any) {
      logger.error({ accountId, to, error }, 'Failed to send media');
      throw error;
    }
  }

  /**
   * Handle incoming webhook
   */
  async handleWebhook(payload: any) {
    try {
      const { event, instance, data } = payload;

      logger.info({ event, instance }, 'Webhook received');

      switch (event) {
        case 'messages.upsert':
          await this.handleIncomingMessage(instance, data);
          break;

        case 'connection.update':
          await this.handleConnectionUpdate(instance, data);
          break;

        case 'qrcode.updated':
          await this.handleQRCodeUpdate(instance, data);
          break;

        default:
          logger.debug({ event }, 'Unhandled webhook event');
      }
    } catch (error) {
      logger.error({ error, payload }, 'Webhook processing failed');
      throw error;
    }
  }

  private async handleIncomingMessage(instanceName: string, data: any) {
    const message = data.messages?.[0];
    if (!message) return;

    // Find account
    const account = await this.prisma.whatsAppAccount.findFirst({
      where: { instanceName },
    });

    if (!account) {
      logger.warn({ instanceName }, 'Account not found for instance');
      return;
    }

    // Get or create contact
    const phoneNumber = message.key.remoteJid.replace('@s.whatsapp.net', '');
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
          name: message.pushName || phoneNumber,
        },
      });
    }

    // Get or create conversation
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
        },
      });
    }

    // Create message
    await this.prisma.whatsAppMessage.create({
      data: {
        conversationId: conversation.id,
        contactId: contact.id,
        externalId: message.key.id,
        direction: message.key.fromMe ? 'outbound' : 'inbound',
        type: message.messageType || 'text',
        content: message.message?.conversation || message.message?.extendedTextMessage?.text,
        status: 'received',
        timestamp: new Date(message.messageTimestamp * 1000),
        metadata: message,
      },
    });

    // Update conversation
    await this.prisma.whatsAppConversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        unreadCount: { increment: message.key.fromMe ? 0 : 1 },
      },
    });

    // Publish event
    await this.eventBus.publish(Events.OMNI_MESSAGE_RECEIVED, {
      type: Events.OMNI_MESSAGE_RECEIVED,
      version: 'v1',
      timestamp: new Date(),
      companyId: account.companyId,
      data: {
        accountId: account.id,
        conversationId: conversation.id,
        contactId: contact.id,
        phoneNumber,
        content: message.message?.conversation,
      },
    });

    logger.info({ conversationId: conversation.id }, 'Message processed');
  }

  private async handleConnectionUpdate(instanceName: string, data: any) {
    const { connection, qr } = data;

    const account = await this.prisma.whatsAppAccount.findFirst({
      where: { instanceName },
    });

    if (!account) return;

    let status = account.status;

    if (connection === 'open') {
      status = 'connected';
      await this.prisma.whatsAppAccount.update({
        where: { id: account.id },
        data: { status, lastConnectedAt: new Date() },
      });
    } else if (connection === 'close') {
      status = 'disconnected';
      await this.prisma.whatsAppAccount.update({
        where: { id: account.id },
        data: { status },
      });
    }

    logger.info({ instanceName, status }, 'Connection status updated');
  }

  private async handleQRCodeUpdate(instanceName: string, data: any) {
    const { qr } = data;

    await this.prisma.whatsAppAccount.updateMany({
      where: { instanceName },
      data: { qrCode: qr },
    });

    logger.info({ instanceName }, 'QR code updated');
  }

  /**
   * Get instance status
   */
  async getInstanceStatus(accountId: string) {
    const account = await this.prisma.whatsAppAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) throw new Error('Account not found');

    try {
      const response = await this.client.get(
        `${account.apiUrl}/instance/connectionState/${account.instanceName}`,
        {
          headers: { apikey: account.apiKey },
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error({ accountId, error }, 'Failed to get instance status');
      throw error;
    }
  }

  /**
   * Disconnect instance
   */
  async disconnectInstance(accountId: string) {
    const account = await this.prisma.whatsAppAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) throw new Error('Account not found');

    try {
      await this.client.delete(
        `${account.apiUrl}/instance/logout/${account.instanceName}`,
        {
          headers: { apikey: account.apiKey },
        }
      );

      await this.prisma.whatsAppAccount.update({
        where: { id: accountId },
        data: { status: 'disconnected' },
      });

      logger.info({ accountId }, 'Instance disconnected');
    } catch (error: any) {
      logger.error({ accountId, error }, 'Failed to disconnect instance');
      throw error;
    }
  }
}
