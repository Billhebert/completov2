// src/core/event-bus/index.ts
import { EventEmitter } from 'events';
import Redis from 'ioredis';
import { logger } from '../logger';
import { env } from '../config/env';
import { BaseEvent } from '../types';

export interface EventHandler<T = any> {
  (event: T): void | Promise<void>;
}

export class EventBus {
  private emitter: EventEmitter;
  private redis?: Redis;
  private subscriber?: Redis;
  private isDistributed: boolean;

  constructor(redisUrl?: string) {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(100); // Increase for many modules
    
    this.isDistributed = !!redisUrl;
    
    if (redisUrl) {
      this.setupRedis(redisUrl);
    }
  }

  private setupRedis(url: string) {
    try {
      this.redis = new Redis(url, {
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
      });
      
      this.subscriber = new Redis(url);
      
      this.subscriber.on('message', (channel, message) => {
        try {
          const event = JSON.parse(message);
          this.emitter.emit(channel, event);
        } catch (error) {
          logger.error({ error, channel, message }, 'Failed to parse Redis event');
        }
      });
      
      logger.info('EventBus: Connected to Redis (distributed mode)');
    } catch (error) {
      logger.warn({ error }, 'EventBus: Failed to connect to Redis, using in-memory mode');
      this.isDistributed = false;
    }
  }

  /**
   * Publish an event
   */
  async publish<T extends BaseEvent>(eventType: string, event: T): Promise<void> {
    const eventData = {
      ...event,
      type: eventType,
      timestamp: event.timestamp || new Date(),
    };

    // Emit locally
    this.emitter.emit(eventType, eventData);

    // Publish to Redis if distributed
    if (this.isDistributed && this.redis) {
      try {
        await this.redis.publish(eventType, JSON.stringify(eventData));
      } catch (error) {
        logger.error({ error, eventType }, 'Failed to publish event to Redis');
      }
    }

    logger.debug({ eventType, companyId: event.companyId }, 'Event published');
  }

  /**
   * Alias for publish (for backwards compatibility)
   */
  async emit<T extends BaseEvent>(eventType: string, event: T): Promise<void> {
    return this.publish(eventType, event);
  }

  /**
   * Subscribe to an event
   */
  on<T = any>(eventType: string, handler: EventHandler<T>): void {
    this.emitter.on(eventType, handler);

    // Subscribe to Redis channel if distributed
    if (this.isDistributed && this.subscriber) {
      this.subscriber.subscribe(eventType).catch((error) => {
        logger.error({ error, eventType }, 'Failed to subscribe to Redis channel');
      });
    }
  }

  /**
   * Subscribe once to an event
   */
  once<T = any>(eventType: string, handler: EventHandler<T>): void {
    this.emitter.once(eventType, handler);
  }

  /**
   * Unsubscribe from an event
   */
  off<T = any>(eventType: string, handler: EventHandler<T>): void {
    this.emitter.off(eventType, handler);
  }

  /**
   * Wait for an event with timeout
   */
  async waitFor<T = any>(
    eventType: string,
    predicate?: (event: T) => boolean,
    timeout = 30000
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.off(eventType, handler);
        reject(new Error(`Timeout waiting for event: ${eventType}`));
      }, timeout);

      const handler = (event: T) => {
        if (!predicate || predicate(event)) {
          clearTimeout(timer);
          this.off(eventType, handler);
          resolve(event);
        }
      };

      this.on(eventType, handler);
    });
  }

  /**
   * Close connections
   */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
    if (this.subscriber) {
      await this.subscriber.quit();
    }
    this.emitter.removeAllListeners();
  }
}

// Singleton instance
let eventBusInstance: EventBus | null = null;

export function getEventBus(): EventBus {
  if (!eventBusInstance) {
    const redisUrl = env.NODE_ENV === 'test' ? undefined : env.REDIS_URL;
    eventBusInstance = new EventBus(redisUrl);
  }
  return eventBusInstance;
}

// Export singleton instance (alias)
export const eventBus = getEventBus();

// Event type constants
export const Events = {
  // Chat
  CHAT_MESSAGE_SENT: 'chat.message.sent.v1',
  CHAT_MESSAGE_EDITED: 'chat.message.edited.v1',
  CHAT_MESSAGE_DELETED: 'chat.message.deleted.v1',
  CHAT_USER_TYPING: 'chat.user.typing.v1',

  // Presence
  USER_ONLINE: 'presence.user.online.v1',
  USER_OFFLINE: 'presence.user.offline.v1',
  USER_TYPING: 'presence.user.typing.v1',

  // Omnichannel
  OMNI_MESSAGE_RECEIVED: 'omni.message.received.v1',
  OMNI_MESSAGE_SENT: 'omni.message.sent.v1',
  OMNI_CONVERSATION_ASSIGNED: 'omni.conversation.assigned.v1',
  OMNI_CONVERSATION_CLOSED: 'omni.conversation.closed.v1',

  // Notifications
  NOTIFICATION_CREATED: 'notifications.new.v1',
  NOTIFICATION_READ: 'notifications.read.v1',

  // CRM
  CONTACT_CREATED: 'crm.contact.created.v1',
  CONTACT_UPDATED: 'crm.contact.updated.v1',
  DEAL_CREATED: 'crm.deal.created.v1',
  DEAL_UPDATED: 'crm.deal.updated.v1',
  DEAL_WON: 'crm.deal.won.v1',
  DEAL_LOST: 'crm.deal.lost.v1',

  // Sync
  SYNC_STARTED: 'sync.started.v1',
  SYNC_COMPLETED: 'sync.completed.v1',
  SYNC_FAILED: 'sync.failed.v1',

  // Knowledge
  KNOWLEDGE_NODE_CREATED: 'knowledge.node.created.v1',
  KNOWLEDGE_NODE_UPDATED: 'knowledge.node.updated.v1',
  KNOWLEDGE_LINK_CREATED: 'knowledge.link.created.v1',
  KNOWLEDGE_INGESTED: 'knowledge.ingested.v1',

  // AI
  AI_QUERY_PROCESSED: 'ai.query.processed.v1',
  RAG_SEARCH_COMPLETED: 'ai.rag.search.completed.v1',

  // Learning
  LEARNING_ENROLLED: 'learning.enrolled.v1',
  LEARNING_PROGRESS: 'learning.progress.v1',
  LEARNING_COMPLETED: 'learning.completed.v1',

  // Auth
  USER_LOGGED_IN: 'auth.user.logged_in.v1',
  USER_LOGGED_OUT: 'auth.user.logged_out.v1',
  USER_REGISTERED: 'auth.user.registered.v1',
  TWO_FA_ENABLED: 'auth.2fa.enabled.v1',

  // Files
  FILE_UPLOADED: 'file.uploaded.v1',
  FILE_DELETED: 'file.deleted.v1',

  // Webhooks
  WEBHOOK_CREATED: 'webhook.created.v1',
  WEBHOOK_DELIVERED: 'webhook.delivered.v1',
  WEBHOOK_FAILED: 'webhook.failed.v1',

  // API Keys
  API_KEY_CREATED: 'apikey.created.v1',
  API_KEY_REVOKED: 'apikey.revoked.v1',

  // Audit
  AUDIT_ENTRY_CREATED: 'audit.entry.created.v1',
} as const;

