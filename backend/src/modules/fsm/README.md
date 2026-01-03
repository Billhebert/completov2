# 🚐 FSM Module

Field Service Management for technician scheduling, work order management, and mobile field operations.

## Overview

The FSM module provides:
- **Technician Management**: Track technicians, specializations, and availability
- **Work Order Management**: Create, assign, and complete field service jobs
- **Task Tracking**: Break down work orders into manageable tasks
- **Time Tracking**: Monitor technician time on-site and activities
- **Quality Assurance**: Checklists and completion verification
- **Mobile Operations**: Support for field-based work

## API Routes (13 total)

### Technician Management (3 routes)

#### 1. List Technicians
Get all field technicians with optional filtering.

```http
GET /api/v1/fsm/technicians?page=1&limit=20&availability=available
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `availability` (optional): available, on-site, unavailable
- `specialization` (optional): Filter by specialization

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "John Smith",
      "email": "john.smith@company.com",
      "phone": "+1-555-0123",
      "specializations": ["electrical", "hvac", "plumbing"],
      "certifications": ["EPA", "HVAC_CERT"],
      "availability": "available",
      "serviceArea": "North Region",
      "totalJobs": 145,
      "averageRating": 4.8,
      "createdAt": "2024-01-15T00:00:00Z"
    }
  ],
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 20,
    "totalPages": 2
  }
}
```

#### 2. Get Technician Details
Get detailed information about a specific technician.

```http
GET /api/v1/fsm/technicians/:technicianId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "John Smith",
    "email": "john.smith@company.com",
    "phone": "+1-555-0123",
    "specializations": ["electrical", "hvac", "plumbing"],
    "certifications": ["EPA", "HVAC_CERT"],
    "availability": "available",
    "serviceArea": "North Region",
    "totalJobs": 145,
    "averageRating": 4.8,
    "completedThisMonth": 12,
    "currentLocation": {
      "latitude": 40.7128,
      "longitude": -74.0060,
      "lastUpdated": "2025-01-03T10:30:00Z"
    },
    "activeJobs": 3,
    "createdAt": "2024-01-15T00:00:00Z"
  }
}
```

#### 3. Create Technician
Create a new technician record.

```http
POST /api/v1/fsm/technicians
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Smith",
  "email": "john.smith@company.com",
  "phone": "+1-555-0123",
  "specializations": ["electrical", "hvac", "plumbing"],
  "certifications": ["EPA", "HVAC_CERT"],
  "availability": "available",
  "serviceArea": "North Region"
}
```

**Specializations:**
- `electrical`, `hvac`, `plumbing`, `mechanical`, `gas`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "John Smith",
    ...
  }
}
```

### Work Order Management (5 routes)

#### 4. List Work Orders
Get all work orders with optional filtering.

```http
GET /api/v1/fsm/work-orders?status=open&page=1&limit=20&priority=high
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `status` (optional): open, in-progress, completed, cancelled
- `priority` (optional): low, medium, high, urgent
- `technicianId` (optional): Filter by assigned technician

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "customerId": "uuid",
      "title": "HVAC System Inspection",
      "description": "Annual HVAC system inspection and maintenance",
      "priority": "high",
      "status": "open",
      "scheduledDate": "2025-01-10T09:00:00Z",
      "estimatedDuration": 2,
      "serviceType": "preventive",
      "address": "123 Main St, City, State 12345",
      "assignedTechnician": {
        "id": "uuid",
        "name": "John Smith"
      },
      "requiredSkills": ["hvac", "electrical"],
      "createdAt": "2025-01-03T00:00:00Z"
    }
  ],
  "meta": {
    "total": 120,
    "page": 1,
    "limit": 20,
    "totalPages": 6
  }
}
```

#### 5. Get Work Order Details
Get detailed information about a work order.

```http
GET /api/v1/fsm/work-orders/:workOrderId
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "customerId": "uuid",
    "customer": {
      "name": "ABC Corp",
      "phone": "+1-555-1234",
      "address": "123 Main St"
    },
    "title": "HVAC System Inspection",
    "description": "Annual HVAC system inspection and maintenance",
    "priority": "high",
    "status": "in-progress",
    "scheduledDate": "2025-01-10T09:00:00Z",
    "estimatedDuration": 2,
    "actualDuration": 1.5,
    "serviceType": "preventive",
    "address": "123 Main St, City, State 12345",
    "assignedTechnician": {
      "id": "uuid",
      "name": "John Smith",
      "email": "john.smith@company.com"
    },
    "requiredSkills": ["hvac", "electrical"],
    "tasks": [
      {
        "id": "uuid",
        "title": "Replace air filter",
        "completed": true,
        "completedAt": "2025-01-10T09:30:00Z"
      }
    ],
    "checklist": [
      {
        "item": "Verify circuit breakers",
        "checked": true,
        "category": "safety"
      }
    ],
    "timeEntries": [
      {
        "date": "2025-01-10",
        "startTime": "09:00:00",
        "endTime": "10:30:00",
        "duration": "1h 30m"
      }
    ],
    "partsUsed": [
      {
        "name": "Air Filter",
        "quantity": 2,
        "cost": 45.00
      }
    ],
    "createdAt": "2025-01-03T00:00:00Z"
  }
}
```

#### 6. Create Work Order
Create a new work order.

```http
POST /api/v1/fsm/work-orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "customerId": "customer-uuid",
  "title": "HVAC System Inspection",
  "description": "Annual HVAC system inspection and maintenance",
  "priority": "high",
  "scheduledDate": "2025-01-10T09:00:00Z",
  "estimatedDuration": 2,
  "serviceType": "preventive",
  "address": "123 Main St, City, State 12345",
  "requiredSkills": ["hvac", "electrical"]
}
```

**Status Values:**
- `open`, `in-progress`, `completed`, `cancelled`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "customerId": "customer-uuid",
    ...
  }
}
```

#### 7. Start Work Order
Begin work on a scheduled order.

```http
POST /api/v1/fsm/work-orders/:workOrderId/start
Authorization: Bearer <token>
Content-Type: application/json

{
  "technicianId": "technician-uuid",
  "notes": "Arrived on site, beginning inspection"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "in-progress",
    "startedAt": "2025-01-10T09:00:00Z",
    "assignedTechnician": {
      "id": "uuid",
      "name": "John Smith"
    }
  }
}
```

#### 8. Complete Work Order
Mark work order as completed.

```http
POST /api/v1/fsm/work-orders/:workOrderId/complete
Authorization: Bearer <token>
Content-Type: application/json

{
  "notes": "System operating normally, replaced filters",
  "partsUsed": [{"partId": "part-uuid", "quantity": 2}],
  "hoursSpent": 1.5,
  "completionStatus": "completed"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "completed",
    "completedAt": "2025-01-10T10:30:00Z",
    "actualDuration": 1.5,
    "finalNotes": "System operating normally, replaced filters"
  }
}
```

### Task Management (2 routes)

#### 9. Add Task to Work Order
Create a subtask for a work order.

```http
POST /api/v1/fsm/work-orders/:workOrderId/tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Replace air filter",
  "description": "Replace dirty air filter with new one",
  "estimatedDuration": 0.5,
  "required": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "workOrderId": "uuid",
    "title": "Replace air filter",
    "completed": false,
    "createdAt": "2025-01-10T09:00:00Z"
  }
}
```

#### 10. Mark Task Complete
Complete a specific task.

```http
POST /api/v1/fsm/work-orders/:workOrderId/tasks/:taskId/complete
Authorization: Bearer <token>
Content-Type: application/json

{
  "notes": "Completed successfully"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "completed": true,
    "completedAt": "2025-01-10T09:30:00Z"
  }
}
```

### Time Tracking (2 routes)

#### 11. Start Time Entry
Begin tracking time for a work order.

```http
POST /api/v1/fsm/work-orders/:workOrderId/time-tracking/start
Authorization: Bearer <token>
Content-Type: application/json

{
  "technicianId": "technician-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "entryId": "uuid",
    "workOrderId": "uuid",
    "startedAt": "2025-01-10T09:00:00Z"
  }
}
```

#### 12. Stop Time Entry
End time tracking for current activity.

```http
POST /api/v1/fsm/work-orders/:workOrderId/time-tracking/stop
Authorization: Bearer <token>
Content-Type: application/json

{
  "notes": "Task completed successfully"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "entryId": "uuid",
    "duration": "1h 30m",
    "stoppedAt": "2025-01-10T10:30:00Z"
  }
}
```

### Quality Assurance (1 route)

#### 13. Add Checklist Item
Add quality assurance checklist item.

```http
POST /api/v1/fsm/work-orders/:workOrderId/checklist
Authorization: Bearer <token>
Content-Type: application/json

{
  "item": "Verify circuit breakers",
  "required": true,
  "category": "safety"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "workOrderId": "uuid",
    "item": "Verify circuit breakers",
    "checked": false,
    "category": "safety"
  }
}
```

## Database Models

- `FieldTechnician` - Technician profiles
- `WorkOrder` - Service jobs
- `WorkOrderTask` - Task breakdown
- `WorkOrderTimeEntry` - Time tracking
- `WorkOrderChecklist` - QA items
- `Customer` - Customer information

## Testing

See `teste.http` for complete testing examples.

## Error Handling

```json
{
  "success": false,
  "error": "Work order not found",
  "code": "WORK_ORDER_NOT_FOUND"
}
```

Common errors:
- `TECHNICIAN_NOT_FOUND`
- `WORK_ORDER_NOT_FOUND`
- `TASK_NOT_FOUND`
- `UNAUTHORIZED`
- `TECHNICIAN_NOT_AVAILABLE`

## Version

v1.0.0

## Last Updated

January 3, 2026
