// web/src/types/webhooks.ts
export interface EventDefinition {
  id: string;
  companyId: string;
  name: string;
  category: string;
  description?: string;
  schema?: any;
  isSystem: boolean;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookEndpoint {
  id: string;
  companyId: string;
  name: string;
  url: string;
  secret?: string;
  events: string[];
  headers?: Record<string, string>;
  timeout: number;
  retryConfig?: {
    maxRetries: number;
    backoff: 'exponential' | 'linear' | 'fixed';
  };
  isActive: boolean;
  description?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    deliveries: number;
  };
}

export interface WebhookDelivery {
  id: string;
  endpointId: string;
  eventName: string;
  eventId: string;
  payload: any;
  request: any;
  response?: any;
  statusCode?: number;
  success: boolean;
  error?: string;
  attemptNumber: number;
  nextRetryAt?: string;
  deliveredAt?: string;
  createdAt: string;
  endpoint?: {
    name: string;
    url: string;
  };
}

export interface CreateEventDefinition {
  name: string;
  category: string;
  description?: string;
  schema?: any;
}

export interface CreateWebhookEndpoint {
  name: string;
  url: string;
  events: string[];
  headers?: Record<string, string>;
  timeout?: number;
  retryConfig?: {
    maxRetries: number;
    backoff: 'exponential' | 'linear' | 'fixed';
  };
  description?: string;
}
