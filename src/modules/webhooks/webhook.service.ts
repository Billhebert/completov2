// src/modules/webhooks/webhook.service.ts
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import axios from 'axios';
import { logger } from '../../core/logger';

/**
 * Sistema de Webhooks com Retry e HMAC Signature
 *
 * Permite aos clientes configurarem webhooks para receber eventos
 * em tempo real quando ações acontecem no sistema.
 */
export class WebhookService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Emitir um evento que dispara webhooks
   */
  async emitEvent(params: {
    companyId: string;
    eventName: string;
    payload: any;
    source?: string;
  }): Promise<void> {
    const { companyId, eventName, payload, source } = params;

    try {
      // Buscar webhooks que escutam este evento
      const endpoints = await this.prisma.webhookEndpoint.findMany({
        where: {
          companyId,
          isActive: true,
          events: {
            has: eventName,
          },
        },
      });

      if (endpoints.length === 0) {
        logger.debug({ companyId, eventName }, 'No webhook endpoints configured for event');
        return;
      }

      // Disparar webhooks em paralelo
      await Promise.all(
        endpoints.map((endpoint) =>
          this.deliverWebhook({
            endpointId: endpoint.id,
            eventName,
            payload,
            companyId,
          })
        )
      );

      logger.info({ companyId, eventName, endpoints: endpoints.length }, 'Event dispatched to webhooks');
    } catch (error) {
      logger.error({ error, companyId, eventName }, 'Error emitting webhook event');
    }
  }

  /**
   * Entregar webhook para um endpoint específico
   */
  private async deliverWebhook(params: {
    endpointId: string;
    eventName: string;
    payload: any;
    companyId: string;
    attemptNumber?: number;
  }): Promise<void> {
    const { endpointId, eventName, payload, companyId, attemptNumber = 1 } = params;

    try {
      const endpoint = await this.prisma.webhookEndpoint.findUnique({
        where: { id: endpointId },
      });

      if (!endpoint) {
        logger.warn({ endpointId }, 'Webhook endpoint not found');
        return;
      }

      // Preparar payload
      const webhookPayload = {
        event: eventName,
        timestamp: new Date().toISOString(),
        data: payload,
      };

      // Gerar assinatura HMAC
      const signature = this.generateSignature(
        JSON.stringify(webhookPayload),
        endpoint.secret
      );

      // Preparar headers
      const headers = {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': eventName,
        'X-Webhook-Delivery-Id': crypto.randomUUID(),
        ...(endpoint.headers as object || {}),
      };

      const eventId = crypto.randomUUID();
      const startTime = Date.now();

      try {
        // Enviar requisição
        const response = await axios.post(endpoint.url, webhookPayload, {
          headers,
          timeout: endpoint.timeout,
        });

        const duration = Date.now() - startTime;

        // Log de sucesso
        await this.prisma.webhookDeliveryLog.create({
          data: {
            endpointId,
            eventName,
            eventId,
            payload: webhookPayload,
            request: { headers, url: endpoint.url },
            response: {
              status: response.status,
              headers: response.headers,
              body: response.data,
              duration,
            },
            statusCode: response.status,
            success: true,
            attemptNumber,
            deliveredAt: new Date(),
          },
        });

        logger.info(
          { endpointId, eventName, statusCode: response.status, duration },
          'Webhook delivered successfully'
        );
      } catch (error: any) {
        const duration = Date.now() - startTime;

        // Log de falha
        const deliveryLog = await this.prisma.webhookDeliveryLog.create({
          data: {
            endpointId,
            eventName,
            eventId,
            payload: webhookPayload,
            request: { headers, url: endpoint.url },
            response: error.response
              ? {
                  status: error.response.status,
                  headers: error.response.headers,
                  body: error.response.data,
                  duration,
                }
              : undefined,
            statusCode: error.response?.status,
            success: false,
            error: error.message,
            attemptNumber,
          },
        });

        // Retry logic
        const retryConfig = (endpoint.retryConfig as any) || { maxRetries: 3, backoff: 'exponential' };

        if (attemptNumber < retryConfig.maxRetries) {
          const delay = this.calculateBackoff(attemptNumber, retryConfig.backoff);

          // Agendar retry
          await this.prisma.webhookDeliveryLog.update({
            where: { id: deliveryLog.id },
            data: {
              nextRetryAt: new Date(Date.now() + delay),
            },
          });

          logger.warn(
            { endpointId, eventName, attemptNumber, nextRetryIn: delay },
            'Webhook delivery failed, will retry'
          );

          // Executar retry após delay
          setTimeout(() => {
            this.deliverWebhook({
              ...params,
              attemptNumber: attemptNumber + 1,
            });
          }, delay);
        } else {
          logger.error(
            { endpointId, eventName, attemptNumber },
            'Webhook delivery failed after max retries'
          );
        }
      }
    } catch (error) {
      logger.error({ error, endpointId, eventName }, 'Error delivering webhook');
    }
  }

  /**
   * Gera assinatura HMAC SHA-256
   */
  private generateSignature(payload: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Calcula tempo de backoff para retry
   */
  private calculateBackoff(attemptNumber: number, strategy: string): number {
    if (strategy === 'exponential') {
      // 2^n * 1000ms (1s, 2s, 4s, 8s...)
      return Math.pow(2, attemptNumber) * 1000;
    } else if (strategy === 'linear') {
      // n * 5000ms (5s, 10s, 15s...)
      return attemptNumber * 5000;
    } else {
      // Fixo em 30s
      return 30000;
    }
  }

  /**
   * Verificar assinatura de webhook recebido
   */
  verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Processar retries pendentes
   * Deve ser executado por um cron job
   */
  async processRetries(): Promise<void> {
    const pendingRetries = await this.prisma.webhookDeliveryLog.findMany({
      where: {
        success: false,
        nextRetryAt: {
          lte: new Date(),
          not: null,
        },
      },
      include: {
        endpoint: true,
      },
      take: 100,
    });

    for (const retry of pendingRetries) {
      await this.deliverWebhook({
        endpointId: retry.endpointId,
        eventName: retry.eventName,
        payload: (retry.payload as any).data,
        companyId: retry.endpoint.companyId,
        attemptNumber: retry.attemptNumber + 1,
      });
    }

    logger.info({ count: pendingRetries.length }, 'Processed webhook retries');
  }
}
