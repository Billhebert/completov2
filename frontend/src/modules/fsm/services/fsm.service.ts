/**
 * Field Service Management (FSM) Service
 *
 * This module provides a rich client for the Field Service
 * Management subsystem.  The initial scaffold only exposed a few
 * operations and left complex workflows as TODOs.  The backend
 * already implements a comprehensive FSM API supporting technician
 * management, work order lifecycles, task checklists and time
 * tracking (see `backend/src/modules/fsm/index.ts`).
 *
 * The functions below wrap those REST endpoints and perform minimal
 * client‑side validation.  They return typed results derived from
 * common entities such as `ServiceOrder` and `FieldTechnician`.  In
 * addition to the existing list/create operations, this service
 * exposes helpers for updating locations, managing work orders,
 * starting and completing orders, handling tasks and checklists and
 * recording time entries.  Consumers can build powerful scheduling
 * and dispatch UIs on top of these primitives.
 */

import api, { extractData } from '../../../core/utils/api';
import type {
  ServiceOrder,
  FieldTechnician,
  WorkOrder,
  WorkOrderTask,
  WorkOrderChecklist,
  WorkOrderTimeEntry,
} from '../types';

import type { PaginatedResult, PaginationParams } from '../../../core/types';

/**
 * List technicians currently active for the tenant.  Returns basic
 * information including skills, status, rating and last known
 * location.  Use this to populate technician pickers or to display
 * technician rosters on dispatch boards.
 */
export async function getTechnicians(): Promise<FieldTechnician[]> {
  const response = await api.get('/fsm/technicians');
  return extractData(response);
}

/**
 * Create a new field technician.  Requires the user to have
 * appropriate permissions.  The caller must specify a `userId` for
 * the underlying user account.  Skills, certifications and
 * availability are optional.
 */
export async function createTechnician(data: {
  userId: string;
  skills?: string[];
  certifications?: string[];
  availability?: Record<string, any>;
}): Promise<FieldTechnician> {
  const response = await api.post('/fsm/technicians', data);
  return extractData(response);
}

/**
 * Update the last known location of a technician.  Coordinates must
 * be provided as `{ lat: number, lng: number }`.  Clients may call
 * this periodically (e.g., when the mobile app records GPS updates).
 */
export async function updateTechnicianLocation(technicianId: string, location: { lat: number; lng: number }): Promise<FieldTechnician> {
  const response = await api.patch(`/fsm/technicians/${technicianId}/location`, { location });
  return extractData(response);
}

/**
 * List work orders for the current tenant.  Supports filtering by
 * status (e.g., `pending`, `in_progress`, `completed`), assigned
 * technician and priority.  Results are ordered by priority and
 * scheduled start time by default.
 */
export async function getWorkOrders(params: {
  status?: string;
  technicianId?: string;
  priority?: string;
} = {}): Promise<WorkOrder[]> {
  const response = await api.get('/fsm/workorders', { params });
  return extractData(response);
}

/**
 * Create a new work order.  The backend expects a detailed payload
 * describing the job, including title, description, type, customer
 * and asset references, scheduling data and parts required.  Only
 * users with the `workorder:create` permission may call this.
 */
export async function createWorkOrder(data: Omit<WorkOrder, 'id' | 'companyId' | 'createdBy'>): Promise<WorkOrder> {
  const response = await api.post('/fsm/workorders', data);
  return extractData(response);
}

/**
 * Update an existing work order.  Accepts a partial payload of
 * fields to modify.  Fields not provided will remain unchanged.
 */
export async function updateWorkOrder(id: string, data: Partial<WorkOrder>): Promise<WorkOrder> {
  const response = await api.patch(`/fsm/workorders/${id}`, data);
  return extractData(response);
}

/**
 * Start a work order.  Typically invoked by a technician in the field
 * when they arrive on site.  The backend marks the order as
 * `in_progress` and records the actual start timestamp.
 */
export async function startWorkOrder(id: string): Promise<WorkOrder> {
  const response = await api.post(`/fsm/workorders/${id}/start`);
  return extractData(response);
}

/**
 * Complete a work order.  The payload may include a digital
 * signature and customer feedback.  The backend marks the order as
 * `completed` and records the actual end timestamp.
 */
export async function completeWorkOrder(id: string, data: { signature?: string; feedback?: string }): Promise<WorkOrder> {
  const response = await api.post(`/fsm/workorders/${id}/complete`, data);
  return extractData(response);
}

/**
 * Add a new task to a work order.  Tasks represent discrete pieces
 * of work that need to be performed as part of the order.  The
 * caller may specify the order index to control ordering in the
 * checklist.
 */
export async function addTask(workOrderId: string, data: { title: string; description?: string; order?: number }): Promise<WorkOrderTask> {
  const response = await api.post(`/fsm/workorders/${workOrderId}/tasks`, data);
  return extractData(response);
}

/**
 * Mark a task as complete.  The backend records the completion
 * timestamp and the ID of the user performing the action.
 */
export async function completeTask(taskId: string): Promise<WorkOrderTask> {
  const response = await api.patch(`/fsm/tasks/${taskId}/complete`);
  return extractData(response);
}

/**
 * Add a checklist item to a work order.  Checklist items are simple
 * yes/no items that technicians must acknowledge.  They can be used
 * for safety checks or procedural reminders.
 */
export async function addChecklistItem(workOrderId: string, data: { item: string; order?: number }): Promise<WorkOrderChecklist> {
  const response = await api.post(`/fsm/workorders/${workOrderId}/checklist`, data);
  return extractData(response);
}

/**
 * Start a new time entry for a work order.  Time entries allow
 * technicians to record time spent on various tasks or segments of
 * the order.  The description may be used to capture context
 * (e.g., "Travel", "Maintenance", etc.).
 */
export async function startTimeEntry(workOrderId: string, description?: string): Promise<WorkOrderTimeEntry> {
  const response = await api.post(`/fsm/workorders/${workOrderId}/time`, { description });
  return extractData(response);
}

/**
 * Stop an existing time entry.  Calculates the duration based on the
 * recorded start time and the current timestamp.  Returns the
 * updated time entry with `endTime` and `duration` fields populated.
 */
export async function stopTimeEntry(timeEntryId: string): Promise<WorkOrderTimeEntry> {
  const response = await api.patch(`/fsm/time/${timeEntryId}/stop`);
  return extractData(response);
}

/**
 * List service orders (legacy alias).  This function wraps
 * `getWorkOrders` for backwards compatibility with older code.  Use
 * `getWorkOrders` instead for new implementations.
 */
export async function getServiceOrders(params?: PaginationParams): Promise<PaginatedResult<ServiceOrder>> {
  const response = await api.get('/fsm/service-orders', { params });
  return extractData(response);
}

/**
 * Create a service order (legacy alias).  Provided for API
 * compatibility with the original scaffold.  Use `createWorkOrder`
 * instead for new implementations.  The data model of a service
 * order is equivalent to a work order in the new schema.
 */
export async function createServiceOrder(data: Partial<ServiceOrder>): Promise<ServiceOrder> {
  const response = await api.post('/fsm/service-orders', data);
  return extractData(response);
}