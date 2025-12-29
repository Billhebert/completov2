// src/core/metrics/index.ts
import { Counter, Histogram, Gauge, register } from 'prom-client';
import { Request, Response, NextFunction } from 'express';

// HTTP Metrics
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.015, 0.05, 0.1, 0.5, 1, 5],
});

// Database Metrics
export const dbQueriesTotal = new Counter({
  name: 'db_queries_total',
  help: 'Total number of database queries',
  labelNames: ['operation', 'model'],
});

export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Database query duration in seconds',
  labelNames: ['operation', 'model'],
  buckets: [0.001, 0.005, 0.015, 0.05, 0.1, 0.5, 1],
});

// WebSocket Metrics
export const wsConnectionsActive = new Gauge({
  name: 'ws_connections_active',
  help: 'Number of active WebSocket connections',
  labelNames: ['namespace'],
});

export const wsMessagesTotal = new Counter({
  name: 'ws_messages_total',
  help: 'Total number of WebSocket messages',
  labelNames: ['event', 'direction'],
});

// Business Metrics
export const usersActive = new Gauge({
  name: 'users_active',
  help: 'Number of active users',
  labelNames: ['companyId'],
});

export const messagesTotal = new Counter({
  name: 'messages_total',
  help: 'Total number of messages sent',
  labelNames: ['companyId', 'channel_type'],
});

export const dealsTotal = new Counter({
  name: 'deals_total',
  help: 'Total number of deals',
  labelNames: ['companyId', 'stage'],
});

export const dealValue = new Histogram({
  name: 'deal_value',
  help: 'Deal value distribution',
  labelNames: ['companyId', 'stage'],
  buckets: [100, 500, 1000, 5000, 10000, 50000, 100000],
});

// Queue Metrics
export const queueJobsTotal = new Counter({
  name: 'queue_jobs_total',
  help: 'Total number of queue jobs',
  labelNames: ['queue', 'status'],
});

export const queueJobDuration = new Histogram({
  name: 'queue_job_duration_seconds',
  help: 'Queue job processing duration',
  labelNames: ['queue'],
  buckets: [0.1, 0.5, 1, 5, 10, 30, 60],
});

// Event Bus Metrics
export const eventsPublished = new Counter({
  name: 'events_published_total',
  help: 'Total number of events published',
  labelNames: ['event_type'],
});

export const eventsConsumed = new Counter({
  name: 'events_consumed_total',
  help: 'Total number of events consumed',
  labelNames: ['event_type', 'handler'],
});

// Cache Metrics
export const cacheHitsTotal = new Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_type'],
});

export const cacheMissesTotal = new Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_type'],
});

// Module Metrics
export const modulesEnabled = new Gauge({
  name: 'modules_enabled',
  help: 'Number of enabled modules',
  labelNames: ['companyId'],
});

// Error Metrics
export const errorsTotal = new Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'module'],
});

/**
 * Middleware to track HTTP metrics
 */
export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path || 'unknown';
    const statusCode = res.statusCode.toString();

    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: statusCode,
    });

    httpRequestDuration.observe(
      {
        method: req.method,
        route,
        status_code: statusCode,
      },
      duration
    );
  });

  next();
}

/**
 * Get Prometheus metrics
 */
export function getMetrics(): Promise<string> {
  return register.metrics();
}

/**
 * Reset all metrics (useful for testing)
 */
export function resetMetrics() {
  register.clear();
}
