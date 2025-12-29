// src/modules/webhooks/service.ts
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { logger } from '../../core/logger';
import crypto from 'crypto';

export class WebhookService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Send webhook
   */
  async send(
    companyId: string,
    event: string,
    payload: any
  ): Promise<void> {
    // Find all webhook subscriptions for this event
    const subscriptions = await this.prisma.webhookSubscription.findMany({
      where: {
        companyId,
        events: { has: event },
        active: true,
      },
    });

    for (const subscription of subscriptions) {
      await this.sendToEndpoint(subscription, event, payload);
    }
  }

  private async sendToEndpoint(
    subscription: any,
    event: string,
    payload: any
  ): Promise<void> {
    const deliveryId = crypto.randomBytes(16).toString('hex');
    const timestamp = new Date().toISOString();

    const body = {
      id: deliveryId,
      event,
      timestamp,
      data: payload,
    };

    // Generate signature
    const signature = this.generateSignature(
      JSON.stringify(body),
      subscription.secret
    );

    try {
      const response = await axios.post(subscription.url, body, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Id': deliveryId,
          'X-Webhook-Timestamp': timestamp,
        },
        timeout: 30000,
      });

      // Log successful delivery
      await this.prisma.webhookDelivery.create({
        data: {
          subscriptionId: subscription.id,
          deliveryId,
          event,
          payload: body,
          statusCode: response.status,
          responseBody: response.data,
          success: true,
          attemptNumber: 1,
        },
      });

      logger.info(
        { subscriptionId: subscription.id, event, deliveryId },
        'Webhook delivered successfully'
      );
    } catch (error: any) {
      // Log failed delivery
      await this.prisma.webhookDelivery.create({
        data: {
          subscriptionId: subscription.id,
          deliveryId,
          event,
          payload: body,
          statusCode: error.response?.status || 0,
          responseBody: error.response?.data || error.message,
          error: error.message,
          success: false,
          attemptNumber: 1,
        },
      });

      logger.error(
        { error, subscriptionId: subscription.id, event, deliveryId },
        'Webhook delivery failed'
      );

      // Schedule retry
      await this.scheduleRetry(subscription, event, payload, 1);
    }
  }

  private async scheduleRetry(
    subscription: any,
    event: string,
    payload: any,
    attemptNumber: number
  ): Promise<void> {
    // Exponential backoff: 1min, 5min, 15min, 1h, 6h
    const delays = [60, 300, 900, 3600, 21600];
    
    if (attemptNumber > 5) {
      logger.warn(
        { subscriptionId: subscription.id, event },
        'Max retry attempts reached'
      );
      return;
    }

    const delaySeconds = delays[attemptNumber - 1] || delays[delays.length - 1];

    setTimeout(async () => {
      await this.retryDelivery(subscription, event, payload, attemptNumber + 1);
    }, delaySeconds * 1000);
  }

  private async retryDelivery(
    subscription: any,
    event: string,
    payload: any,
    attemptNumber: number
  ): Promise<void> {
    const deliveryId = crypto.randomBytes(16).toString('hex');
    const timestamp = new Date().toISOString();

    const body = {
      id: deliveryId,
      event,
      timestamp,
      data: payload,
      retry: attemptNumber,
    };

    const signature = this.generateSignature(
      JSON.stringify(body),
      subscription.secret
    );

    try {
      const response = await axios.post(subscription.url, body, {
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Id': deliveryId,
          'X-Webhook-Timestamp': timestamp,
          'X-Webhook-Retry': attemptNumber.toString(),
        },
        timeout: 30000,
      });

      await this.prisma.webhookDelivery.create({
        data: {
          subscriptionId: subscription.id,
          deliveryId,
          event,
          payload: body,
          statusCode: response.status,
          responseBody: response.data,
          success: true,
          attemptNumber,
        },
      });

      logger.info(
        { subscriptionId: subscription.id, event, deliveryId, attemptNumber },
        'Webhook retry succeeded'
      );
    } catch (error: any) {
      await this.prisma.webhookDelivery.create({
        data: {
          subscriptionId: subscription.id,
          deliveryId,
          event,
          payload: body,
          statusCode: error.response?.status || 0,
          responseBody: error.response?.data || error.message,
          error: error.message,
          success: false,
          attemptNumber,
        },
      });

      logger.error(
        { error, subscriptionId: subscription.id, attemptNumber },
        'Webhook retry failed'
      );

      // Schedule next retry
      await this.scheduleRetry(subscription, event, payload, attemptNumber);
    }
  }

  private generateSignature(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }
}
