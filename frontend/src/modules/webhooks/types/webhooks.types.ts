/**
 * Webhooks Types
 * Tipos para gestão de webhooks
 */

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  secret?: string;
  headers?: Record<string, string>;
  retryConfig: {
    maxRetries: number;
    retryDelay: number;
  };
  lastTriggeredAt?: string;
  successCount: number;
  failureCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookLog {
  id: string;
  webhookId: string;
  event: string;
  payload: Record<string, unknown>;
  response?: {
    status: number;
    body: string;
    headers: Record<string, string>;
  };
  success: boolean;
  error?: string;
  attempts: number;
  triggeredAt: string;
}

export interface CreateWebhookRequest {
  name: string;
  url: string;
  events: string[];
  secret?: string;
  headers?: Record<string, string>;
}

export interface UpdateWebhookRequest {
  name?: string;
  url?: string;
  events?: string[];
  isActive?: boolean;
  secret?: string;
  headers?: Record<string, string>;
}
