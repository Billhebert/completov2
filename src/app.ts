// src/app.ts
import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';
import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { env } from './core/config/env';
import { logger, createRequestLogger } from './core/logger';
import {
  errorHandler,
  notFoundHandler,
  apiLimiter,
} from './core/middleware';
import { getEventBus } from './core/event-bus';
import { ModuleLoader } from './core/modules/module-loader';

// Import modules
import { authModule } from './modules/auth';
import { chatModule } from './modules/chat';
import { notificationsModule } from './modules/notifications';
import { crmModule } from './modules/crm';
import { erpModule } from './modules/erp';
import { knowledgeModule } from './modules/knowledge';
import { aiModule } from './modules/ai';
import { omnichannelModule } from './modules/omnichannel';
import { syncModule } from './modules/sync';
import { learningModule } from './modules/learning';
import { analyticsModule } from './modules/analytics';
import { filesModule } from './modules/files';
import { webhooksModule } from './modules/webhooks';
import { apikeysModule } from './modules/apikeys';
import { emailTemplatesModule } from './modules/email-templates';
import { searchModule } from './modules/search';
import { ssoModule } from './modules/sso';
import { auditModule } from './modules/audit';
import { gatekeeperModule } from './modules/gatekeeper/module';
import { automationsModule } from './modules/automations/module';
import { narrativeModule } from './modules/narrative/module';
import { simulationModule } from './modules/simulation/module';
import { peopleGrowthModule } from './modules/people-growth';
import { startWorkers } from './workers';
import { i18nMiddleware } from './core/i18n';
import { timezoneMiddleware } from './core/timezone';
import { metricsMiddleware } from './core/metrics';
import { initializeSystem } from './core/init';
import { setupAdditionalRoutes } from './api/rest-routes';

export interface AppContext {
  app: Express;
  httpServer: HTTPServer;
  io: SocketIOServer;
  prisma: PrismaClient;
  moduleLoader: ModuleLoader;
}

export async function createApp(): Promise<AppContext> {
  const app = express();

  // ==============================================
  // MIDDLEWARE SETUP
  // ==============================================

  // Security
  app.use(helmet({
    contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
  }));

  // CORS
  app.use(cors({
    origin: env.NODE_ENV === 'production'
      ? ['https://yourdomain.com'] // Configure your domains
      : '*',
    credentials: true,
  }));

  // Body parsing
  app.use(express.json({ limit: `${env.MAX_FILE_SIZE_MB}mb` }));
  app.use(express.urlencoded({ extended: true, limit: `${env.MAX_FILE_SIZE_MB}mb` }));

  // Request logging
  app.use(createRequestLogger());

  // Internationalization
  app.use(i18nMiddleware);

  // Timezone handling
  app.use(timezoneMiddleware);

  // Metrics
  app.use(metricsMiddleware);

  // Rate limiting
  app.use('/api', apiLimiter);

  // ==============================================
  // DATABASE
  // ==============================================

  const prisma = new PrismaClient({
    log: env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn']
      : ['error'],
  });

  // Test database connection
  try {
    await prisma.$connect();
    logger.info('✅ Database connected');
  } catch (error) {
    logger.error({ error }, '❌ Failed to connect to database');
    throw error;
  }

  // ==============================================
  // HTTP SERVER & SOCKET.IO
  // ==============================================

  const httpServer = new HTTPServer(app);
  
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.NODE_ENV === 'production'
        ? ['https://yourdomain.com']
        : '*',
      credentials: true,
    },
    path: '/ws',
  });

  logger.info('✅ Socket.IO initialized');

  // ==============================================
  // EVENT BUS
  // ==============================================

  const eventBus = getEventBus();
  logger.info('✅ EventBus initialized');

  // ==============================================
  // MODULE SYSTEM
  // ==============================================

  const moduleLoader = new ModuleLoader(app, prisma, eventBus, env, io);

  // Register all modules
  moduleLoader.register(authModule);
  moduleLoader.register(chatModule);
  moduleLoader.register(notificationsModule);
  moduleLoader.register(crmModule);
  moduleLoader.register(erpModule);
  moduleLoader.register(knowledgeModule);
  moduleLoader.register(aiModule);
  moduleLoader.register(omnichannelModule);
  moduleLoader.register(syncModule);
  moduleLoader.register(learningModule);
  moduleLoader.register(analyticsModule);
  moduleLoader.register(filesModule);
  moduleLoader.register(webhooksModule);
  moduleLoader.register(apikeysModule);
  moduleLoader.register(emailTemplatesModule);
  moduleLoader.register(searchModule);
  moduleLoader.register(ssoModule);
  moduleLoader.register(auditModule);
  moduleLoader.register(gatekeeperModule);
  moduleLoader.register(automationsModule);
  moduleLoader.register(narrativeModule);
  moduleLoader.register(simulationModule);
  moduleLoader.register(peopleGrowthModule);

  // Enable modules (could be loaded from database per tenant)
  const enabledModules = [
    'auth',
    'notifications',
    'chat',
    'omnichannel',
    'crm',
    'erp',
    'knowledge',
    'ai',
    'sync',
    'learning',
    'analytics',
    'files',
    'webhooks',
    'apikeys',
    'email-templates',
    'search',
    'sso',
    'audit',
    'gatekeeper',
    'automations',
    'narrative',
    'simulation',
    'people-growth',
  ];

  await moduleLoader.enableModules(enabledModules);

  // Initialize system (event handlers, cron jobs)
  await initializeSystem();

  // Setup additional REST routes
  setupAdditionalRoutes(app, prisma);

  logger.info(
    { modules: moduleLoader.getEnabledModules() },
    '✅ Modules enabled'
  );

  // ==============================================
  // WORKERS
  // ==============================================
  
  if (env.NODE_ENV !== 'test') {
    startWorkers(prisma);
    logger.info('✅ Background workers started');
  }

  // ==============================================
  // HEALTH CHECKS
  // ==============================================

  app.get('/healthz', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.get('/readyz', async (req, res) => {
    try {
      // Check database
      await prisma.$queryRaw`SELECT 1`;

      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        checks: {
          database: 'ok',
          modules: moduleLoader.getEnabledModules(),
        },
      });
    } catch (error) {
      logger.error({ error }, 'Readiness check failed');
      res.status(503).json({
        status: 'not ready',
        error: 'Service dependencies unavailable',
      });
    }
  });

  // Prometheus metrics endpoint
  app.get('/metrics', async (req, res) => {
    try {
      const { getMetrics } = await import('./core/metrics');
      res.set('Content-Type', 'text/plain; version=0.0.4');
      res.end(await getMetrics());
    } catch (error) {
      logger.error({ error }, 'Failed to get metrics');
      res.status(500).end('Error getting metrics');
    }
  });

  // ==============================================
  // ERROR HANDLING
  // ==============================================

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  return {
    app,
    httpServer,
    io,
    prisma,
    moduleLoader,
  };
}
