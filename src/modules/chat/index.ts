import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { Server as SocketIOServer } from 'socket.io';
import { EventBus } from '../../core/event-bus';
import { ModuleDefinition } from '../../core/types';
import { setupChatSockets } from './sockets';
import * as routes from './routes';

function setupRoutes(app: Express, prisma: PrismaClient) {
  const base = '/api/v1/chat';
  Object.values(routes).forEach(fn => fn(app, prisma, base));
}

export const chatModule: ModuleDefinition = {
  name: 'chat',
  version: '1.0.0',
  provides: ['chat', 'realtime'],
  routes: (ctx) => setupRoutes(ctx.app, ctx.prisma),
  sockets: (ctx) => {
    if (ctx.io) {
      setupChatSockets(ctx.io, ctx.prisma, ctx.eventBus);
    }
  },
};
