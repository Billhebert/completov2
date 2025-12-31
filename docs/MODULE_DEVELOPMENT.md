# Module Development Guide

## Table of Contents
1. [Introduction](#introduction)
2. [Module Structure](#module-structure)
3. [Step-by-Step Guide](#step-by-step-guide)
4. [Backend Development](#backend-development)
5. [Frontend Development](#frontend-development)
6. [Database Schema](#database-schema)
7. [Event Bus Integration](#event-bus-integration)
8. [Testing](#testing)
9. [Best Practices](#best-practices)
10. [Examples](#examples)

---

## Introduction

This guide will walk you through creating a new module in the Completo V2 platform. Modules are self-contained features that integrate with the existing system through standardized patterns.

### What is a Module?

A module is a feature set that includes:
- **Backend API**: Express routes and business logic
- **Database Models**: Prisma schema definitions
- **Frontend UI**: React components and state management
- **Event Handlers**: Integration with the Event Bus
- **Tests**: Unit and integration tests

### Prerequisites

Before creating a module, you should be familiar with:
- TypeScript
- Express.js (backend)
- React (frontend)
- Prisma ORM (database)
- Zustand (state management)

---

## Module Structure

### Backend Structure

```
/src/modules/<module-name>/
├── index.ts           # Main router and API endpoints
├── handlers.ts        # Business logic (optional)
├── validators.ts      # Input validation schemas (optional)
├── events.ts          # Event Bus listeners (optional)
├── types.ts           # TypeScript types (optional)
└── README.md          # Module documentation (optional)
```

### Frontend Structure

```
/web/src/
├── pages/
│   └── <ModuleName>Page.tsx       # Main page component
├── components/
│   └── <module-name>/             # Module-specific components
│       ├── <Component1>.tsx
│       └── <Component2>.tsx
├── store/
│   └── <moduleName>Store.ts       # Zustand store
├── types/
│   └── <moduleName>.ts            # TypeScript interfaces
└── services/
    └── api.ts                     # Add API methods here
```

### Database Structure

```
/prisma/schema.prisma
# Add your models in the appropriate section
```

---

## Step-by-Step Guide

### Step 1: Define the Feature

Before writing code, clearly define:
1. **Purpose**: What problem does this module solve?
2. **User Stories**: Who will use it and how?
3. **Data Model**: What data needs to be stored?
4. **Access Control**: Who can access what?
5. **Integration**: How does it interact with other modules?

### Example Planning Document

```markdown
# Module: Task Management

## Purpose
Allow users to create, assign, and track tasks within their company.

## User Stories
- As a manager, I want to create tasks and assign them to employees
- As an employee, I want to view my assigned tasks and mark them complete
- As a company, I want to see task completion metrics

## Data Model
- Task: title, description, status, priority, assignee, dueDate
- TaskComment: user, text, timestamp
- TaskAttachment: file URL, uploadedBy

## Access Control
- Managers can create and assign tasks
- Employees can view assigned tasks and update status
- Admins can view all company tasks

## Integration
- Emit events when tasks are created/completed
- Integrate with Zettels for task-related knowledge
- Send notifications for task assignments
```

### Step 2: Create Database Schema

Add your models to `/prisma/schema.prisma`:

```prisma
// Task Management Module
model Task {
  id          String   @id @default(uuid())
  title       String
  description String   @db.Text
  status      String   @default("pending") // pending, in_progress, completed, cancelled
  priority    String   @default("medium") // low, medium, high, urgent
  dueDate     DateTime?

  companyId   String
  company     Company  @relation(fields: [companyId], references: [id])

  assigneeId  String?
  assignee    Employee? @relation("TaskAssignee", fields: [assigneeId], references: [id])

  createdBy   String
  creator     Employee  @relation("TaskCreator", fields: [createdBy], references: [id])

  comments    TaskComment[]
  attachments TaskAttachment[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?

  @@index([companyId])
  @@index([assigneeId])
  @@index([status])
  @@index([companyId, status])
}

model TaskComment {
  id        String   @id @default(uuid())
  text      String   @db.Text

  taskId    String
  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)

  employeeId String
  employee  Employee @relation(fields: [employeeId], references: [id])

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([taskId])
}

model TaskAttachment {
  id        String   @id @default(uuid())
  filename  String
  url       String
  fileType  String
  fileSize  Int

  taskId    String
  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)

  uploadedBy String
  uploader  Employee @relation(fields: [uploadedBy], references: [id])

  createdAt DateTime @default(now())

  @@index([taskId])
}
```

### Step 3: Run Database Migration

```bash
# Create migration
npx prisma migrate dev --name add_task_management_module

# Generate Prisma Client
npx prisma generate
```

### Step 4: Create Backend API

Create `/src/modules/tasks/index.ts`:

```typescript
import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../core/middleware/auth';
import { eventBus } from '../../core/events/EventBus';
import prisma from '../../core/database/client';
import logger from '../../core/logger';

const router = Router();

// Type definitions
interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    companyId: string;
    role: string;
  };
}

// Middleware to check role
const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

// GET /api/v1/tasks - List all tasks
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { status, assigneeId, priority, page = '1', limit = '10' } = req.query;

    // Build where clause
    const where: any = { companyId: user.companyId, deletedAt: null };

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = assigneeId;

    // Pagination
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Fetch data
    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          assignee: {
            select: { id: true, name: true, email: true },
          },
          creator: {
            select: { id: true, name: true, email: true },
          },
          _count: {
            select: { comments: true, attachments: true },
          },
        },
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.task.count({ where }),
    ]);

    res.json({
      success: true,
      data: tasks,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    logger.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET /api/v1/tasks/:id - Get single task
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const task = await prisma.task.findFirst({
      where: {
        id,
        companyId: user.companyId,
        deletedAt: null,
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
        comments: {
          include: {
            employee: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        attachments: {
          include: {
            uploader: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ success: true, data: task });
  } catch (error) {
    logger.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// POST /api/v1/tasks - Create task
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { title, description, assigneeId, priority, dueDate, status } = req.body;

    // Validation
    if (!title || title.length < 3) {
      return res.status(400).json({ error: 'Title must be at least 3 characters' });
    }

    // Create task
    const task = await prisma.task.create({
      data: {
        title,
        description,
        assigneeId,
        priority: priority || 'medium',
        dueDate: dueDate ? new Date(dueDate) : null,
        status: status || 'pending',
        companyId: user.companyId,
        createdBy: user.id,
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Emit event
    eventBus.emit('tasks.task.created', {
      taskId: task.id,
      companyId: task.companyId,
      assigneeId: task.assigneeId,
      createdBy: user.id,
    });

    logger.info(`Task created: ${task.id}`);
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    logger.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PATCH /api/v1/tasks/:id - Update task
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const updates = req.body;

    // Check if task exists and user has permission
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        companyId: user.companyId,
        deletedAt: null,
      },
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Update task
    const task = await prisma.task.update({
      where: { id },
      data: updates,
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Emit event
    eventBus.emit('tasks.task.updated', {
      taskId: task.id,
      companyId: task.companyId,
      updates,
      updatedBy: user.id,
    });

    res.json({ success: true, data: task });
  } catch (error) {
    logger.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/v1/tasks/:id - Delete task (soft delete)
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    // Check if task exists and user has permission
    const existingTask = await prisma.task.findFirst({
      where: {
        id,
        companyId: user.companyId,
        deletedAt: null,
      },
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Soft delete
    await prisma.task.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Emit event
    eventBus.emit('tasks.task.deleted', {
      taskId: id,
      companyId: user.companyId,
      deletedBy: user.id,
    });

    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    logger.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// POST /api/v1/tasks/:id/comments - Add comment
router.post('/:id/comments', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    // Check if task exists
    const task = await prisma.task.findFirst({
      where: {
        id,
        companyId: user.companyId,
        deletedAt: null,
      },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Create comment
    const comment = await prisma.taskComment.create({
      data: {
        text,
        taskId: id,
        employeeId: user.id,
      },
      include: {
        employee: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Emit event
    eventBus.emit('tasks.comment.created', {
      commentId: comment.id,
      taskId: id,
      employeeId: user.id,
    });

    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    logger.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

export default router;
```

### Step 5: Register the Router

In `/src/server.ts`, add:

```typescript
import tasksRouter from './modules/tasks';

// ... other imports and setup ...

app.use('/api/v1/tasks', tasksRouter);
```

### Step 6: Create Frontend Types

Create `/web/src/types/tasks.ts`:

```typescript
export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string | null;
  companyId: string;
  assigneeId: string | null;
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
  createdBy: string;
  creator: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  _count?: {
    comments: number;
    attachments: number;
  };
}

export interface TaskComment {
  id: string;
  text: string;
  taskId: string;
  employeeId: string;
  employee: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description: string;
  assigneeId?: string;
  priority?: string;
  dueDate?: string;
  status?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  assigneeId?: string;
  priority?: string;
  dueDate?: string;
  status?: string;
}
```

### Step 7: Add API Methods

In `/web/src/services/api.ts`, add:

```typescript
// Tasks
async getTasks(params?: {
  status?: string;
  assigneeId?: string;
  priority?: string;
  page?: number;
  limit?: number;
}) {
  return this.client.get('/tasks', { params });
}

async getTask(id: string) {
  return this.client.get(`/tasks/${id}`);
}

async createTask(data: CreateTaskInput) {
  return this.client.post('/tasks', data);
}

async updateTask(id: string, data: UpdateTaskInput) {
  return this.client.patch(`/tasks/${id}`, data);
}

async deleteTask(id: string) {
  return this.client.delete(`/tasks/${id}`);
}

async addTaskComment(taskId: string, text: string) {
  return this.client.post(`/tasks/${taskId}/comments`, { text });
}
```

### Step 8: Create Zustand Store

Create `/web/src/store/tasksStore.ts`:

```typescript
import { create } from 'zustand';
import api from '../services/api';
import { Task, CreateTaskInput, UpdateTaskInput } from '../types/tasks';

interface TasksState {
  tasks: Task[];
  currentTask: Task | null;
  loading: boolean;
  error: string | null;

  fetchTasks: (params?: any) => Promise<void>;
  fetchTask: (id: string) => Promise<void>;
  createTask: (data: CreateTaskInput) => Promise<Task>;
  updateTask: (id: string, data: UpdateTaskInput) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addComment: (taskId: string, text: string) => Promise<void>;
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  currentTask: null,
  loading: false,
  error: null,

  fetchTasks: async (params) => {
    set({ loading: true, error: null });
    try {
      const response = await api.getTasks(params);
      set({ tasks: response.data.data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchTask: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await api.getTask(id);
      set({ currentTask: response.data.data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  createTask: async (data) => {
    try {
      const response = await api.createTask(data);
      const newTask = response.data.data;

      // Optimistic update
      set((state) => ({
        tasks: [newTask, ...state.tasks],
      }));

      return newTask;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  updateTask: async (id, data) => {
    try {
      const response = await api.updateTask(id, data);
      const updatedTask = response.data.data;

      // Optimistic update
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
        currentTask: state.currentTask?.id === id ? updatedTask : state.currentTask,
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  deleteTask: async (id) => {
    try {
      await api.deleteTask(id);

      // Optimistic update
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id),
        currentTask: state.currentTask?.id === id ? null : state.currentTask,
      }));
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  addComment: async (taskId, text) => {
    try {
      await api.addTaskComment(taskId, text);

      // Refresh current task to get new comment
      if (get().currentTask?.id === taskId) {
        await get().fetchTask(taskId);
      }
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },
}));
```

### Step 9: Create React Page Component

Create `/web/src/pages/TasksPage.tsx`:

```typescript
import React, { useEffect, useState } from 'react';
import { useTasksStore } from '../store/tasksStore';
import { CreateTaskInput } from '../types/tasks';

const TasksPage: React.FC = () => {
  const {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
  } = useTasksStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState<CreateTaskInput>({
    title: '',
    description: '',
    priority: 'medium',
    status: 'pending',
  });

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createTask(formData);
      setShowCreateModal(false);
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        status: 'pending',
      });
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await updateTask(id, { status });
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(id);
      } catch (error) {
        console.error('Failed to delete task:', error);
      }
    }
  };

  if (loading) return <div>Loading tasks...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="tasks-page">
      <div className="header">
        <h1>Tasks</h1>
        <button onClick={() => setShowCreateModal(true)}>
          Create Task
        </button>
      </div>

      <div className="tasks-list">
        {tasks.map((task) => (
          <div key={task.id} className="task-card">
            <div className="task-header">
              <h3>{task.title}</h3>
              <span className={`priority ${task.priority}`}>
                {task.priority}
              </span>
            </div>
            <p>{task.description}</p>
            <div className="task-meta">
              <span>Status: {task.status}</span>
              {task.assignee && <span>Assigned to: {task.assignee.name}</span>}
              {task.dueDate && <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>}
            </div>
            <div className="task-actions">
              <button onClick={() => handleUpdateStatus(task.id, 'in_progress')}>
                Start
              </button>
              <button onClick={() => handleUpdateStatus(task.id, 'completed')}>
                Complete
              </button>
              <button onClick={() => handleDeleteTask(task.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {showCreateModal && (
        <div className="modal">
          <div className="modal-content">
            <h2>Create New Task</h2>
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value })
                  }
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div className="form-actions">
                <button type="submit">Create</button>
                <button type="button" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksPage;
```

### Step 10: Add Route

In `/web/src/App.tsx`, add the route:

```typescript
import TasksPage from './pages/TasksPage';

// In your Routes component
<Route path="/tasks" element={<TasksPage />} />
```

### Step 11: Add Event Listeners (Optional)

Create `/src/modules/tasks/events.ts`:

```typescript
import { eventBus } from '../../core/events/EventBus';
import logger from '../../core/logger';
import prisma from '../../core/database/client';

export function registerTaskEvents() {
  // When task is created, notify assignee
  eventBus.on('tasks.task.created', async (data) => {
    logger.info('Task created event:', data);

    if (data.assigneeId) {
      // Send notification to assignee
      // (implement notification logic here)
      logger.info(`Notifying user ${data.assigneeId} about new task`);
    }
  });

  // When task status changes
  eventBus.on('tasks.task.updated', async (data) => {
    logger.info('Task updated event:', data);

    if (data.updates.status === 'completed') {
      // Task completed, notify creator
      const task = await prisma.task.findUnique({
        where: { id: data.taskId },
        include: { creator: true },
      });

      if (task) {
        logger.info(`Notifying creator ${task.createdBy} that task is completed`);
      }
    }
  });

  // When comment is added
  eventBus.on('tasks.comment.created', async (data) => {
    logger.info('Comment created event:', data);

    const task = await prisma.task.findUnique({
      where: { id: data.taskId },
      include: { assignee: true, creator: true },
    });

    if (task) {
      // Notify task participants
      logger.info('Notifying task participants about new comment');
    }
  });
}
```

Register events in `/src/server.ts`:

```typescript
import { registerTaskEvents } from './modules/tasks/events';

// After other event registrations
registerTaskEvents();
```

---

## Backend Development

### Best Practices

#### 1. Always Validate Input

```typescript
// Bad - No validation
const task = await prisma.task.create({ data: req.body });

// Good - Validate before creating
if (!title || title.length < 3) {
  return res.status(400).json({ error: 'Title must be at least 3 characters' });
}

if (!['low', 'medium', 'high', 'urgent'].includes(priority)) {
  return res.status(400).json({ error: 'Invalid priority' });
}

const task = await prisma.task.create({
  data: { title, description, priority, ... },
});
```

#### 2. Use TypeScript Types

```typescript
interface AuthRequest extends Request {
  user?: {
    id: string;
    companyId: string;
    role: string;
  };
}

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  const user = req.user!; // TypeScript knows user exists after authenticate
  // ...
});
```

#### 3. Handle Errors Properly

```typescript
try {
  const task = await prisma.task.findUnique({ where: { id } });

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  res.json({ success: true, data: task });
} catch (error) {
  logger.error('Error fetching task:', error);
  res.status(500).json({ error: 'Internal server error' });
}
```

#### 4. Use Multi-Tenant Filtering

```typescript
// Always filter by companyId
const tasks = await prisma.task.findMany({
  where: {
    companyId: user.companyId, // IMPORTANT!
    status: 'open',
  },
});
```

#### 5. Implement Pagination

```typescript
const page = parseInt(req.query.page as string) || 1;
const limit = parseInt(req.query.limit as string) || 10;
const skip = (page - 1) * limit;

const [data, total] = await Promise.all([
  prisma.task.findMany({ where, skip, take: limit }),
  prisma.task.count({ where }),
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

---

## Frontend Development

### Best Practices

#### 1. Use Zustand for State Management

```typescript
// Good - Centralized state management
const { tasks, loading, createTask } = useTasksStore();

// Bad - Local state for API data
const [tasks, setTasks] = useState([]);
```

#### 2. Implement Optimistic Updates

```typescript
createTask: async (data) => {
  const response = await api.createTask(data);
  const newTask = response.data.data;

  // Update UI immediately
  set((state) => ({
    tasks: [newTask, ...state.tasks],
  }));

  return newTask;
}
```

#### 3. Handle Loading and Error States

```typescript
if (loading) return <div>Loading...</div>;
if (error) return <div>Error: {error}</div>;

return <div>{/* Render content */}</div>;
```

#### 4. Use TypeScript Interfaces

```typescript
interface TaskCardProps {
  task: Task;
  onUpdate: (id: string, data: UpdateTaskInput) => void;
  onDelete: (id: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onUpdate, onDelete }) => {
  // ...
};
```

---

## Testing

### Backend Tests

Create `/src/modules/tasks/__tests__/tasks.test.ts`:

```typescript
import request from 'supertest';
import app from '../../../server';
import prisma from '../../../core/database/client';

describe('Tasks API', () => {
  let authToken: string;
  let userId: string;
  let companyId: string;

  beforeAll(async () => {
    // Setup: Create test user and login
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'testpassword',
      });

    authToken = response.body.data.token;
    userId = response.body.data.user.id;
    companyId = response.body.data.user.companyId;
  });

  describe('POST /api/v1/tasks', () => {
    it('should create a task', async () => {
      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Task',
          description: 'Test Description',
          priority: 'high',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Task');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Missing title',
        });

      expect(response.status).toBe(400);
    });
  });

  afterAll(async () => {
    // Cleanup: Delete test data
    await prisma.task.deleteMany({ where: { companyId } });
    await prisma.$disconnect();
  });
});
```

### Frontend Tests

Create `/web/src/components/__tests__/TaskCard.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import TaskCard from '../tasks/TaskCard';

describe('TaskCard', () => {
  const mockTask = {
    id: '1',
    title: 'Test Task',
    description: 'Test Description',
    status: 'pending',
    priority: 'high',
    createdAt: '2025-01-01T00:00:00Z',
  };

  it('renders task details', () => {
    render(<TaskCard task={mockTask} onUpdate={jest.fn()} onDelete={jest.fn()} />);

    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('calls onDelete when delete button is clicked', () => {
    const onDelete = jest.fn();
    render(<TaskCard task={mockTask} onUpdate={jest.fn()} onDelete={onDelete} />);

    fireEvent.click(screen.getByText('Delete'));

    expect(onDelete).toHaveBeenCalledWith('1');
  });
});
```

---

## Best Practices

### Security

1. **Always authenticate requests** that access user data
2. **Filter by companyId** to ensure multi-tenant isolation
3. **Validate all inputs** before processing
4. **Use parameterized queries** (Prisma does this automatically)
5. **Implement role-based access control** for sensitive operations
6. **Sanitize user input** before rendering in the frontend

### Performance

1. **Use pagination** for large datasets
2. **Include only necessary fields** with Prisma's `select`
3. **Use indexes** on frequently queried fields
4. **Implement caching** for frequently accessed data
5. **Optimize database queries** (avoid N+1 problems)

### Code Quality

1. **Use TypeScript** for type safety
2. **Write tests** for critical functionality
3. **Log important events** for debugging
4. **Handle errors gracefully** with proper error messages
5. **Document complex logic** with comments
6. **Follow consistent naming conventions**

### Maintainability

1. **Keep functions small** and focused
2. **Extract reusable logic** into separate functions
3. **Use environment variables** for configuration
4. **Version your API** (`/api/v1/...`)
5. **Write README** for each module
6. **Keep dependencies up to date**

---

## Examples

### Example 1: Simple CRUD Module

See the Task Management module above for a complete CRUD example.

### Example 2: Module with File Upload

```typescript
// In routes
router.post('/upload', authenticate, upload.single('file'), async (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Process file
  const fileUrl = await uploadToStorage(file);

  res.json({ success: true, data: { url: fileUrl } });
});
```

### Example 3: Module with Real-Time Updates

```typescript
// In backend
import { io } from '../../sockets';

eventBus.on('tasks.task.created', (data) => {
  io.to(`company:${data.companyId}`).emit('task.created', data);
});

// In frontend
import { socketService } from '../services/socket';

useEffect(() => {
  socketService.on('task.created', (data) => {
    fetchTasks(); // Refresh task list
  });

  return () => {
    socketService.disconnect();
  };
}, []);
```

---

## Conclusion

You now have a complete guide to creating new modules in Completo V2. Follow these patterns and best practices to ensure consistency and maintainability across the platform.

For questions or support, refer to:
- [Architecture Documentation](./ARCHITECTURE.md)
- [API Documentation](./API_DOCS.md)
- [Database Schema Documentation](./DATABASE_SCHEMA.md)
