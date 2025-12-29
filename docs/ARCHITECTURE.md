# OMNI Platform - Architecture

## Overview

OMNI Platform is a **modular, multi-tenant enterprise platform** built with a pluggable architecture that allows features to be enabled/disabled per tenant.

## Core Principles

1. **Modularity**: Each feature is a self-contained module
2. **Multi-tenancy**: Complete data isolation between companies
3. **Event-Driven**: Modules communicate via EventBus
4. **Type-Safe**: 100% TypeScript with strict mode
5. **Production-Ready**: Health checks, metrics, logging, error handling

## Architecture Layers

```
┌─────────────────────────────────────────┐
│           API Layer (Express)            │
│  /api/v1/auth, /api/v1/crm, etc.        │
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│         Module System (Pluggable)        │
│  Auth, Chat, CRM, ERP, Knowledge, AI... │
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│           Core Services                  │
│  EventBus, Logger, Config, Middleware    │
└─────────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────────┐
│         Data Layer (Prisma ORM)          │
│  PostgreSQL + Redis + Qdrant + MinIO     │
└─────────────────────────────────────────┘
```

## Module Structure

Each module follows this structure:

```
src/modules/<module-name>/
├── index.ts          # ModuleDefinition export
├── routes.ts         # Express routes
├── service.ts        # Business logic
├── schemas.ts        # Zod validation
└── README.md         # Module documentation
```

## Key Components

### 1. Module Loader
Dynamically loads and manages modules based on configuration.

### 2. Event Bus
Redis-backed pub/sub for inter-module communication.

### 3. Middleware Stack
- Authentication (JWT + 2FA)
- Tenant Isolation
- RBAC (Role-Based Access Control)
- Validation (Zod)
- Rate Limiting (Redis)
- Error Handling

### 4. Database
- **Prisma ORM**: Type-safe database access
- **Multi-tenant**: `companyId` in all tables
- **Migrations**: Versioned schema changes

## Security

- JWT tokens with refresh mechanism
- TOTP-based 2FA
- CORS and Helmet protection
- Rate limiting per IP/user
- Input validation on 100% of routes
- Tenant data isolation

## Scalability

- Horizontal scaling via Redis event bus
- Stateless design
- Queue-based async processing (BullMQ)
- Caching layer (Redis)
- CDN-ready static assets

## Observability

- Structured logging (Pino)
- Health checks (/healthz, /readyz)
- Metrics endpoint (/metrics)
- Error tracking (Sentry)
- Request tracing

## Deployment

- Docker Compose for local development
- Production-ready with Kubernetes support
- Environment-based configuration
- Zero-downtime migrations

