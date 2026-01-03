// src/core/logger/index.ts
import pino from 'pino';
import { env } from '../config/env';

const isDevelopment = env.NODE_ENV === 'development';

export const logger = pino({
  level: env.NODE_ENV === 'test' ? 'silent' : 'info',
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  base: {
    env: env.NODE_ENV,
  },
});

export type Logger = typeof logger;

// Helper function to create child logger with context
export function createLogger(context: Record<string, any>) {
  return logger.child(context);
}

// Request logger middleware
export function createRequestLogger() {
  return (req: any, res: any, next: any) => {
    const startTime = Date.now();
    const requestId = req.headers['x-request-id'] || generateRequestId();
    
    req.log = logger.child({
      requestId,
      companyId: req.user?.companyId,
      userId: req.user?.id,
    });
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      req.log.info({
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
      }, 'Request completed');
    });
    
    next();
  };
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
