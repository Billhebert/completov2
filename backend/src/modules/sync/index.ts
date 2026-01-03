// src/modules/sync/index.ts
import { ModuleDefinition } from '../../core/types';
import { setupSyncRoutes } from './routes';

export const syncModule: ModuleDefinition = {
  name: 'sync',
  version: '1.0.0',
  provides: ['integrations', 'sync'],
  routes: (ctx) => setupSyncRoutes(ctx.app, ctx.prisma, '/api/v1/sync'),
};

export { RDStationConnector } from './connectors/rdstation.connector';
export { ChatwootConnector } from './connectors/chatwoot';

