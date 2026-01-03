// src/modules/omnichannel/index.ts
import { ModuleDefinition } from '../../core/types';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { EventBus } from '../../core/event-bus';
import * as routes from './routes';

function setupRoutes(app: Express, prisma: PrismaClient, eventBus: EventBus) {
  const base = '/api/v1/omnichannel';

  // WhatsApp account routes
  routes.setupOmnichannelAccountsListRoute(app, prisma, base);
  routes.setupOmnichannelAccountsCreateRoute(app, prisma, base, eventBus);
  routes.setupOmnichannelQrcodeRoute(app, prisma, base, eventBus);
  routes.setupOmnichannelSendMessageRoute(app, prisma, base, eventBus);
  routes.setupOmnichannelAccountStatusRoute(app, prisma, base, eventBus);
  routes.setupOmnichannelAccountDisconnectRoute(app, prisma, base, eventBus);
  routes.setupOmnichannelAccountDeleteRoute(app, prisma, base, eventBus);

  // Webhook route
  routes.setupOmnichannelWebhookRoute(app, prisma, base, eventBus);

  // Conversation routes
  routes.setupOmnichannelConversationsListRoute(app, prisma, base);
  routes.setupOmnichannelConversationsCreateRoute(app, prisma, base);
  routes.setupOmnichannelConversationsGetRoute(app, prisma, base);
  routes.setupOmnichannelConversationsUpdateRoute(app, prisma, base);
}

export const omnichannelModule: ModuleDefinition = {
  name: 'omnichannel',
  version: '1.0.0',
  provides: ['whatsapp', 'conversations'],
  routes: (ctx) => setupRoutes(ctx.app, ctx.prisma, ctx.eventBus),
};
