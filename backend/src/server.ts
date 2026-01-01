// src/server.ts
import { createApp } from './app';
import { env } from './core/config/env';
import { logger } from './core/logger';

async function startServer() {
  try {
    logger.info('🚀 Starting OMNI Platform...');
    
    const { httpServer, prisma } = await createApp();

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received, starting graceful shutdown...`);
      
      httpServer.close(async () => {
        logger.info('HTTP server closed');
        
        await prisma.$disconnect();
        logger.info('Database disconnected');
        
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Start server
    httpServer.listen(env.PORT, () => {
      logger.info({
        port: env.PORT,
        env: env.NODE_ENV,
        apiVersion: env.API_VERSION,
      }, '✅ Server is running');
      
      logger.info(`📡 API: http://localhost:${env.PORT}/api/${env.API_VERSION}`);
      logger.info(`🔌 WebSocket: http://localhost:${env.PORT}/ws`);
      logger.info(`💚 Health: http://localhost:${env.PORT}/healthz`);
    });

  } catch (error) {
    logger.error({ error }, '❌ Failed to start server');
    process.exit(1);
  }
}

// Start the server
startServer();
