import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { EventBus } from '../../core/event-bus';
import * as routes from './routes';

function setupRoutes(app: Express, prisma: PrismaClient, eventBus: EventBus) {
  const base = '/api/v1/gatekeeper';
  Object.values(routes).forEach(fn => fn(app, prisma, base));
}

export default setupRoutes;
