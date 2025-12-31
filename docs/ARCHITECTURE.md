# Completo V2 - Technical Architecture

## Table of Contents
1. [Technology Stack](#technology-stack)
2. [System Architecture](#system-architecture)
3. [Module System Design](#module-system-design)
4. [Database Architecture](#database-architecture)
5. [API Design Patterns](#api-design-patterns)
6. [Security Architecture](#security-architecture)
7. [Real-Time Communication](#real-time-communication)
8. [Event-Driven Architecture](#event-driven-architecture)
9. [State Management](#state-management)
10. [Scalability & Performance](#scalability--performance)

---

## Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.x
- **Language**: TypeScript 5.x
- **ORM**: Prisma 5.x
- **Database**: PostgreSQL 14+
- **Authentication**: JWT (jsonwebtoken)
- **Real-Time**: Socket.IO 4.x
- **Validation**: Zod (schema validation)
- **Logging**: Winston
- **Process Management**: PM2 (production)

### Frontend
- **Framework**: React 18.x
- **Language**: TypeScript 5.x
- **Build Tool**: Vite 5.x
- **Routing**: React Router v6
- **State Management**: Zustand 4.x
- **UI Library**: Custom components with Lucide React icons
- **HTTP Client**: Axios 1.x
- **Styling**: CSS Modules / Tailwind CSS

### DevOps & Infrastructure
- **Version Control**: Git
- **Package Manager**: npm
- **Environment Management**: dotenv
- **Database Migrations**: Prisma Migrate
- **API Documentation**: This documentation suite

---

## System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Web Browser │  │ Mobile App   │  │  Public API  │     │
│  │   (React)    │  │  (Future)    │  │   Clients    │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          └──────────────────┴──────────────────┘
                             │
                    ┌────────▼─────────┐
                    │   Load Balancer  │
                    │   (Future/Nginx) │
                    └────────┬─────────┘
                             │
          ┌──────────────────┴──────────────────┐
          │                                     │
┌─────────▼─────────┐              ┌───────────▼──────────┐
│  HTTP API Server  │              │  WebSocket Server    │
│   (Express.js)    │◄────────────►│    (Socket.IO)       │
└─────────┬─────────┘              └───────────┬──────────┘
          │                                    │
          │         ┌──────────────────────────┘
          │         │
┌─────────▼─────────▼──────────────────────────────────────┐
│              Application Layer (Modules)                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ Zettels  │ │   Jobs   │ │ Services │ │   CMMS   │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │Webhooks  │ │   FSM    │ │   MCP    │ │Companies │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │   Auth   │ │Employees │ │Partnerships│ Settings │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
└───────────────────────┬──────────────────────────────────┘
                        │
          ┌─────────────┴─────────────┐
          │                           │
┌─────────▼─────────┐      ┌─────────▼─────────┐
│   Event Bus       │      │  Core Services    │
│  (Event-Driven)   │      │  - Logger         │
│                   │      │  - Middleware     │
└───────────────────┘      │  - Validators     │
                           └───────────────────┘
                                     │
                        ┌────────────▼────────────┐
                        │   Data Access Layer     │
                        │   (Prisma ORM)          │
                        └────────────┬────────────┘
                                     │
                        ┌────────────▼────────────┐
                        │   PostgreSQL Database   │
                        │   - Multi-tenant data   │
                        │   - JSONB fields        │
                        │   - Full-text search    │
                        └─────────────────────────┘
```

### Layered Architecture

#### 1. Presentation Layer (Frontend)
- **Responsibility**: User interface, user interactions, client-side validation
- **Components**: React pages, components, Zustand stores
- **Communication**: REST API calls via Axios, WebSocket connections

#### 2. API Layer (Backend)
- **Responsibility**: Request handling, routing, response formatting
- **Components**: Express routers, middleware, controllers
- **Communication**: HTTP/HTTPS, WebSocket

#### 3. Business Logic Layer (Modules)
- **Responsibility**: Core business rules, workflows, validations
- **Components**: Module handlers, service functions, event emitters
- **Communication**: Function calls, Event Bus

#### 4. Data Access Layer
- **Responsibility**: Database operations, query optimization
- **Components**: Prisma Client, model definitions
- **Communication**: SQL via Prisma

#### 5. Database Layer
- **Responsibility**: Data persistence, integrity, relationships
- **Components**: PostgreSQL tables, indexes, constraints
- **Communication**: TCP/IP

---

## Module System Design

### Module Structure

Each module follows a consistent structure:

```
/src/modules/<module-name>/
├── index.ts          # Main router and API endpoints
├── handlers.ts       # Business logic handlers (optional)
├── validators.ts     # Input validation schemas (optional)
├── types.ts          # TypeScript types (optional)
└── README.md         # Module documentation (optional)
```

### Module Pattern

```typescript
// /src/modules/example/index.ts
import { Router, Request, Response } from 'express';
import { authenticate } from '../../core/middleware/auth';
import { eventBus } from '../../core/events/EventBus';
import prisma from '../../core/database/client';
import logger from '../../core/logger';

const router = Router();

// Public endpoint (no auth)
router.get('/public', async (req: Request, res: Response) => {
  try {
    // Business logic
    const data = await prisma.exampleModel.findMany();

    res.json({ success: true, data });
  } catch (error) {
    logger.error('Error in public endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Protected endpoint (requires auth)
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    // Validate input
    const { field1, field2 } = req.body;

    // Business logic
    const created = await prisma.exampleModel.create({
      data: {
        field1,
        field2,
        companyId: user.companyId,
        createdBy: user.id,
      },
    });

    // Emit event
    eventBus.emit('example.created', {
      exampleId: created.id,
      companyId: user.companyId,
    });

    res.status(201).json({ success: true, data: created });
  } catch (error) {
    logger.error('Error creating example:', error);
    res.status(500).json({ error: 'Failed to create example' });
  }
});

export default router;
```

### Module Registration

```typescript
// /src/server.ts
import exampleRouter from './modules/example';

app.use('/api/v1/examples', exampleRouter);
```

### Module Communication

Modules communicate through:

1. **Direct API Calls**: Frontend calls backend endpoints
2. **Event Bus**: Inter-module communication via events
3. **Database**: Shared data access via Prisma

#### Event Bus Pattern

```typescript
// Emit event
eventBus.emit('job.created', {
  jobId: job.id,
  companyId: job.companyId,
  types: job.types,
});

// Listen to event
eventBus.on('job.created', async (data) => {
  // Send notifications to eligible employees
  await sendJobNotifications(data.jobId, data.companyId, data.types);
});
```

---

## Database Architecture

### Multi-Tenancy Strategy

**Approach**: Shared Database, Shared Schema with `companyId` filtering

```typescript
// All queries automatically filter by company
const jobs = await prisma.job.findMany({
  where: {
    companyId: user.companyId, // Multi-tenant isolation
    status: 'open',
  },
});
```

### Data Isolation Levels

| Model | Isolation | Reasoning |
|-------|-----------|-----------|
| Company | Global | One record per company |
| Employee | Company-level | Employees belong to companies |
| Zettel | User/Company | Knowledge can be personal or company-wide |
| Job | Company-level | Jobs belong to companies (visibility controlled separately) |
| Service | Company-level | Services belong to companies |
| Partnership | Global | Relationships between companies |
| Asset (CMMS) | Company-level | Physical assets belong to companies |
| Webhook | Company-level | Integrations are company-specific |

### Key Design Patterns

#### 1. Soft Deletes
```prisma
model Job {
  id        String    @id @default(uuid())
  deletedAt DateTime?
  // ...
}
```

#### 2. Audit Fields
```prisma
model Job {
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String
  updatedBy String?
  // ...
}
```

#### 3. JSONB for Flexible Data
```prisma
model Zettel {
  content Json  // Structured knowledge content
  metadata Json? // Flexible metadata
}
```

#### 4. Array Fields
```prisma
model Job {
  types String[] // ["public", "internal", "partners"]
  // Allows multi-type jobs
}
```

### Indexes Strategy

```prisma
model Job {
  @@index([companyId])
  @@index([status])
  @@index([companyId, status])
  @@index([types]) // GIN index for array fields
}
```

### Relationships

#### One-to-Many
```prisma
model Company {
  id        String     @id @default(uuid())
  employees Employee[]
  jobs      Job[]
}

model Job {
  id        String  @id @default(uuid())
  companyId String
  company   Company @relation(fields: [companyId], references: [id])
}
```

#### Many-to-Many (Self-Referencing)
```prisma
model Partnership {
  id         String  @id @default(uuid())
  companyAId String
  companyBId String
  companyA   Company @relation("CompanyAPartnerships", fields: [companyAId], references: [id])
  companyB   Company @relation("CompanyBPartnerships", fields: [companyBId], references: [id])
}
```

#### One-to-One
```prisma
model SystemSettings {
  id String @id @default(uuid())
  // Only one record exists
}
```

---

## API Design Patterns

### RESTful Conventions

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/v1/jobs` | List jobs | Optional |
| GET | `/api/v1/jobs/:id` | Get single job | Optional |
| POST | `/api/v1/jobs` | Create job | Yes |
| PATCH | `/api/v1/jobs/:id` | Update job | Yes |
| DELETE | `/api/v1/jobs/:id` | Delete job | Yes |
| POST | `/api/v1/jobs/:id/apply` | Apply to job | Yes |

### Request/Response Format

#### Success Response (200/201)
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "field": "value"
  },
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10
  }
}
```

#### Error Response (400/401/403/404/500)
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": []
}
```

### Pagination

```typescript
// Query parameters
?page=1&limit=10&sortBy=createdAt&sortOrder=desc

// Implementation
const page = parseInt(req.query.page as string) || 1;
const limit = parseInt(req.query.limit as string) || 10;
const skip = (page - 1) * limit;

const [data, total] = await Promise.all([
  prisma.job.findMany({
    where,
    skip,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
  }),
  prisma.job.count({ where }),
]);

res.json({
  success: true,
  data,
  meta: {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  },
});
```

### Filtering

```typescript
// Query parameters
?status=open&types=public&search=developer

// Implementation
const where: any = { companyId: user.companyId };

if (req.query.status) {
  where.status = req.query.status;
}

if (req.query.types) {
  where.types = { has: req.query.types };
}

if (req.query.search) {
  where.OR = [
    { title: { contains: req.query.search, mode: 'insensitive' } },
    { description: { contains: req.query.search, mode: 'insensitive' } },
  ];
}
```

### Optional Authentication Pattern

```typescript
// Middleware that works with or without token
const optionalAuth = (req: any, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (token) {
    // If token present, validate it
    return authenticate(req, res, next);
  }

  // If no token, continue without user
  next();
};

// Usage
router.get('/jobs', optionalAuth, async (req: Request, res: Response) => {
  const user = (req as any).user;

  if (user) {
    // Authenticated - show personalized results
  } else {
    // Unauthenticated - show public results only
  }
});
```

---

## Security Architecture

### Authentication Flow

```
┌─────────┐                                    ┌─────────┐
│ Client  │                                    │ Server  │
└────┬────┘                                    └────┬────┘
     │                                              │
     │  POST /api/v1/auth/login                    │
     │  { email, password }                        │
     ├─────────────────────────────────────────────►│
     │                                              │
     │                                              │ Validate credentials
     │                                              │ Generate JWT token
     │                                              │
     │  200 OK                                      │
     │  { token, user }                             │
     │◄─────────────────────────────────────────────┤
     │                                              │
     │  Store token in memory/localStorage          │
     │                                              │
     │  GET /api/v1/jobs                            │
     │  Authorization: Bearer <token>               │
     ├─────────────────────────────────────────────►│
     │                                              │
     │                                              │ Verify JWT
     │                                              │ Decode user info
     │                                              │ Execute request
     │                                              │
     │  200 OK                                      │
     │  { data: [...] }                             │
     │◄─────────────────────────────────────────────┤
     │                                              │
```

### JWT Token Structure

```typescript
// Token payload
{
  id: "user-uuid",
  email: "user@example.com",
  companyId: "company-uuid",
  role: "cliente",
  iat: 1234567890,
  exp: 1234571490
}
```

### Authorization Middleware

```typescript
// /src/core/middleware/auth.ts
export const authenticate = (req: any, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

### Role-Based Access Control (RBAC)

#### Role Hierarchy
```
DEV > admin > admin_empresa > cliente
```

#### Permission Matrix

| Feature | DEV | admin | admin_empresa | cliente |
|---------|-----|-------|---------------|---------|
| View all companies | ✓ | ✓ | ✗ | ✗ |
| View own company | ✓ | ✓ | ✓ | ✓ |
| Manage company settings | ✓ | ✓ | ✓ | ✗ |
| View all Zettels (any company) | ✓ | ✓ | ✗ | ✗ |
| View company Zettels | ✓ | ✓ | ✓ | ✓ |
| Create/edit own Zettels | ✓ | ✓ | ✓ | ✓ |
| Configure service fees | ✓ | ✓ | ✗ | ✗ |
| Create jobs | ✓ | ✓ | ✓ | ✗ |
| Apply to jobs | ✓ | ✓ | ✓ | ✓ |
| Create services | ✓ | ✓ | ✓ | ✗ |
| Accept service proposals | ✓ | ✓ | ✓ | ✗ |
| Manage partnerships | ✓ | ✓ | ✓ | ✗ |

#### Role Check Middleware

```typescript
export const requireRole = (allowedRoles: string[]) => {
  return (req: any, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Usage
router.get('/admin/stats', authenticate, requireRole(['DEV', 'admin']), handler);
```

### Partnership-Based Access Control

```typescript
// Helper function to get partner company IDs
export async function getPartnerCompanyIds(companyId: string): Promise<string[]> {
  const partnerships = await prisma.partnership.findMany({
    where: {
      OR: [
        { companyAId: companyId, status: 'active' },
        { companyBId: companyId, status: 'active' },
      ],
    },
  });

  return partnerships.map((p) =>
    p.companyAId === companyId ? p.companyBId : p.companyAId
  );
}

// Usage in access control
const partnerCompanyIds = await getPartnerCompanyIds(user.companyId);

const accessibleJobs = await prisma.job.findMany({
  where: {
    OR: [
      { types: { has: 'public' } },
      { types: { has: 'internal' }, companyId: user.companyId },
      { types: { has: 'partners' }, companyId: { in: partnerCompanyIds } },
    ],
  },
});
```

### Input Validation

```typescript
// Using Zod for schema validation
import { z } from 'zod';

const createJobSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10),
  types: z.array(z.enum(['public', 'internal', 'partners'])).min(1),
  isSpecialized: z.boolean(),
  requiredSkills: z.array(z.string()).optional(),
  vacancies: z.number().int().positive(),
});

// In route handler
try {
  const validated = createJobSchema.parse(req.body);
  // Use validated data
} catch (error) {
  return res.status(400).json({ error: 'Validation failed', details: error });
}
```

### SQL Injection Prevention

Prisma ORM automatically prevents SQL injection by using parameterized queries:

```typescript
// Safe - Prisma parameterizes this
const user = await prisma.employee.findUnique({
  where: { email: req.body.email },
});

// Never use raw SQL unless absolutely necessary
// If you must, use parameterized queries:
const result = await prisma.$queryRaw`
  SELECT * FROM employees WHERE email = ${email}
`;
```

### XSS Prevention

```typescript
// Frontend - sanitize user input before rendering
import DOMPurify from 'dompurify';

const cleanContent = DOMPurify.sanitize(userContent);
```

---

## Real-Time Communication

### WebSocket Architecture

```typescript
// /src/sockets/index.ts
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

export function initializeSocket(httpServer: any) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ['GET', 'POST'],
    },
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      socket.data.user = decoded;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    const user = socket.data.user;

    // Join company room
    socket.join(`company:${user.companyId}`);

    // Join user room
    socket.join(`user:${user.id}`);

    console.log(`User ${user.id} connected to company ${user.companyId}`);

    socket.on('disconnect', () => {
      console.log(`User ${user.id} disconnected`);
    });
  });

  return io;
}
```

### Real-Time Events

```typescript
// Emit to specific company
io.to(`company:${companyId}`).emit('job.created', {
  jobId: job.id,
  title: job.title,
});

// Emit to specific user
io.to(`user:${userId}`).emit('application.reviewed', {
  jobId: job.id,
  status: 'accepted',
});

// Emit to all partners
partnerCompanyIds.forEach((partnerId) => {
  io.to(`company:${partnerId}`).emit('partner.job.created', {
    jobId: job.id,
    companyName: company.name,
  });
});
```

### Frontend Socket Client

```typescript
// /web/src/services/socket.ts
import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;

  connect(token: string) {
    this.socket = io(import.meta.env.VITE_API_URL, {
      auth: { token },
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
  }

  on(event: string, callback: (...args: any[]) => void) {
    this.socket?.on(event, callback);
  }

  emit(event: string, data: any) {
    this.socket?.emit(event, data);
  }

  disconnect() {
    this.socket?.disconnect();
  }
}

export const socketService = new SocketService();
```

---

## Event-Driven Architecture

### Event Bus Implementation

```typescript
// /src/core/events/EventBus.ts
import { EventEmitter } from 'events';
import logger from '../logger';

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50); // Increase limit for multiple modules
  }

  emit(event: string, data: any): boolean {
    logger.info(`Event emitted: ${event}`, { data });
    return super.emit(event, data);
  }

  on(event: string, listener: (...args: any[]) => void): this {
    logger.info(`Listener registered for event: ${event}`);
    return super.on(event, listener);
  }
}

export const eventBus = new EventBus();
```

### Event Naming Convention

```
<module>.<entity>.<action>

Examples:
- jobs.job.created
- jobs.application.submitted
- services.proposal.accepted
- partnerships.invite.sent
- zettels.zettel.updated
```

### Event Listeners

```typescript
// /src/modules/jobs/events.ts
import { eventBus } from '../../core/events/EventBus';
import logger from '../../core/logger';

export function registerJobEvents() {
  eventBus.on('jobs.job.created', async (data) => {
    logger.info('Job created, sending notifications', data);
    // Send notifications to eligible employees
    await notifyEligibleEmployees(data.jobId, data.companyId, data.types);
  });

  eventBus.on('jobs.application.submitted', async (data) => {
    logger.info('Application submitted, notifying HR', data);
    // Notify HR team
    await notifyHRTeam(data.applicationId, data.jobId);
  });
}

// Register on server startup
// /src/server.ts
import { registerJobEvents } from './modules/jobs/events';

registerJobEvents();
```

---

## State Management

### Zustand Store Pattern

```typescript
// /web/src/store/exampleStore.ts
import { create } from 'zustand';
import api from '../services/api';

interface ExampleState {
  items: any[];
  loading: boolean;
  error: string | null;

  fetchItems: () => Promise<void>;
  createItem: (data: any) => Promise<void>;
  updateItem: (id: string, data: any) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

export const useExampleStore = create<ExampleState>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  fetchItems: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.getItems();
      set({ items: response.data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createItem: async (data) => {
    try {
      const response = await api.createItem(data);

      // Optimistic update
      set((state) => ({
        items: [...state.items, response.data],
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  updateItem: async (id, data) => {
    try {
      const response = await api.updateItem(id, data);

      // Optimistic update
      set((state) => ({
        items: state.items.map((item) =>
          item.id === id ? response.data : item
        ),
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  deleteItem: async (id) => {
    try {
      await api.deleteItem(id);

      // Optimistic update
      set((state) => ({
        items: state.items.filter((item) => item.id !== id),
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },
}));
```

### Usage in Components

```typescript
import { useExampleStore } from '../store/exampleStore';

function ExampleComponent() {
  const { items, loading, error, fetchItems, createItem } = useExampleStore();

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleCreate = async () => {
    try {
      await createItem({ name: 'New Item' });
    } catch (error) {
      console.error('Failed to create item:', error);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {items.map((item) => (
        <div key={item.id}>{item.name}</div>
      ))}
      <button onClick={handleCreate}>Create Item</button>
    </div>
  );
}
```

---

## Scalability & Performance

### Database Optimization

#### Connection Pooling
```typescript
// Prisma automatically manages connection pooling
// Configure in .env
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=20"
```

#### Query Optimization
```typescript
// Include related data in single query (avoid N+1)
const jobs = await prisma.job.findMany({
  include: {
    company: true,
    applications: {
      include: {
        employee: true,
      },
    },
  },
});

// Select only needed fields
const jobs = await prisma.job.findMany({
  select: {
    id: true,
    title: true,
    createdAt: true,
  },
});

// Use pagination
const jobs = await prisma.job.findMany({
  skip: (page - 1) * limit,
  take: limit,
});
```

#### Indexing Strategy
```prisma
model Job {
  @@index([companyId])
  @@index([status])
  @@index([companyId, status])
  @@index([types]) // For array fields
  @@fulltext([title, description]) // Full-text search
}
```

### Caching Strategy

```typescript
// In-memory cache for frequently accessed data
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes

// Cache system settings
async function getSystemSettings() {
  const cached = cache.get('system-settings');
  if (cached) return cached;

  const settings = await prisma.systemSettings.findFirst();
  cache.set('system-settings', settings);

  return settings;
}

// Invalidate cache on update
async function updateSystemSettings(data: any) {
  const updated = await prisma.systemSettings.update({ where: { id }, data });
  cache.del('system-settings');
  return updated;
}
```

### Load Balancing

```nginx
# /etc/nginx/sites-available/completo
upstream backend {
  server localhost:3000 weight=3;
  server localhost:3001 weight=2;
  server localhost:3002 weight=1;
}

server {
  listen 80;
  server_name completo.example.com;

  location /api/ {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }

  location / {
    root /var/www/completo/web/dist;
    try_files $uri $uri/ /index.html;
  }
}
```

### Horizontal Scaling

```bash
# PM2 cluster mode
pm2 start src/server.js -i max --name completo-api

# Or use ecosystem file
# ecosystem.config.js
module.exports = {
  apps: [{
    name: 'completo-api',
    script: './src/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
    },
  }],
};
```

### WebSocket Scaling

For horizontal scaling with Socket.IO, use Redis adapter:

```typescript
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: 'redis://localhost:6379' });
const subClient = pubClient.duplicate();

await Promise.all([pubClient.connect(), subClient.connect()]);

const io = new Server(httpServer);
io.adapter(createAdapter(pubClient, subClient));
```

### Performance Monitoring

```typescript
// Request timing middleware
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} - ${duration}ms`);

    if (duration > 1000) {
      logger.warn(`Slow request: ${req.method} ${req.path} - ${duration}ms`);
    }
  });

  next();
});
```

---

## Deployment Architecture

### Environment Configuration

```bash
# .env.production
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@db-host:5432/completo_prod
JWT_SECRET=<strong-secret-key>
FRONTEND_URL=https://completo.example.com
REDIS_URL=redis://redis-host:6379
LOG_LEVEL=info
```

### Database Migrations

```bash
# Run migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

### Build Process

```bash
# Backend
npm run build

# Frontend
cd web
npm run build
```

### Process Management

```bash
# Start with PM2
pm2 start ecosystem.config.js

# Monitor
pm2 monit

# Logs
pm2 logs completo-api

# Restart
pm2 restart completo-api

# Stop
pm2 stop completo-api
```

---

## Monitoring & Logging

### Logging Strategy

```typescript
// /src/core/logger.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

export default logger;
```

### Health Check Endpoint

```typescript
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: 'Database connection failed',
    });
  }
});
```

---

## Conclusion

This architecture provides:
- **Scalability**: Horizontal and vertical scaling capabilities
- **Security**: Multi-layered security with RBAC and multi-tenancy
- **Maintainability**: Modular design with clear separation of concerns
- **Performance**: Optimized queries, caching, and connection pooling
- **Reliability**: Event-driven architecture with real-time capabilities
- **Flexibility**: Easy to extend with new modules and features

For adding new modules, see [MODULE_DEVELOPMENT.md](./MODULE_DEVELOPMENT.md).
