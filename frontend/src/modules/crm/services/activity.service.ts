/**
 * Activity Service
 *
 * Serviço para gerenciar atividades (tarefas, ligações, reuniões, emails)
 * relacionadas a contatos e deals no CRM.
 */

import api, { extractData } from '../../../core/utils/api';
import type { PaginatedResult, PaginationParams } from '../../../core/types';

export type ActivityType = 'task' | 'call' | 'meeting' | 'email';
export type ActivityPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ActivityStatus = 'todo' | 'in_progress' | 'done' | 'cancelled';
export type RecurringFrequency = 'daily' | 'weekly' | 'monthly';

export interface RecurringSettings {
  frequency: RecurringFrequency;
  interval: number;
  endDate?: string;
}

export interface Activity {
  id: string;
  type: ActivityType;
  subject: string;
  description?: string;
  dueDate?: string;
  duration?: number; // em minutos
  priority: ActivityPriority;
  status: ActivityStatus;
  contactId?: string;
  dealId?: string;
  assignedToId: string;
  location?: string;
  reminder?: number; // minutos antes
  recurring?: RecurringSettings;
  companyId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
  contact?: {
    id: string;
    name: string;
  };
  deal?: {
    id: string;
    title: string;
  };
  createdBy?: {
    id: string;
    name: string;
  };
  notes?: ActivityNote[];
  reminders?: ActivityReminder[];
}

export interface ActivityNote {
  id: string;
  activityId: string;
  content: string;
  createdById: string;
  createdAt: string;
  createdBy?: {
    id: string;
    name: string;
  };
}

export interface ActivityReminder {
  id: string;
  activityId: string;
  reminderDate: string;
  sent: boolean;
  createdAt: string;
}

export interface CreateActivityRequest {
  type: ActivityType;
  subject: string;
  description?: string;
  dueDate?: string;
  duration?: number;
  priority?: ActivityPriority;
  status?: ActivityStatus;
  contactId?: string;
  dealId?: string;
  assignedToId: string;
  location?: string;
  reminder?: number;
  recurring?: RecurringSettings;
}

export interface UpdateActivityRequest {
  type?: ActivityType;
  subject?: string;
  description?: string;
  dueDate?: string;
  duration?: number;
  priority?: ActivityPriority;
  status?: ActivityStatus;
  contactId?: string;
  dealId?: string;
  assignedToId?: string;
  location?: string;
  reminder?: number;
  recurring?: RecurringSettings;
}

export interface ActivityFilters {
  type?: ActivityType;
  status?: ActivityStatus;
  priority?: ActivityPriority;
  assignedToId?: string;
  contactId?: string;
  dealId?: string;
  startDate?: string;
  endDate?: string;
}

export interface ActivityStats {
  total: number;
  byStatus: {
    todo: number;
    inProgress: number;
    done: number;
  };
  overdue: number;
  byType: Array<{
    type: ActivityType;
    _count: number;
  }>;
}

/**
 * Cria uma nova atividade
 */
export const createActivity = async (
  data: CreateActivityRequest
): Promise<Activity> => {
  const response = await api.post('/crm/activities', data);
  return extractData(response);
};

/**
 * Lista atividades com filtros e paginação
 */
export const getActivities = async (
  params?: PaginationParams & ActivityFilters
): Promise<PaginatedResult<Activity>> => {
  const response = await api.get('/crm/activities', { params });
  const result = extractData(response);

  return {
    data: Array.isArray(result.data) ? result.data : result,
    pagination: result.pagination,
  };
};

/**
 * Busca uma atividade por ID
 */
export const getActivityById = async (id: string): Promise<Activity> => {
  const response = await api.get(`/crm/activities/${id}`);
  return extractData(response);
};

/**
 * Atualiza uma atividade
 */
export const updateActivity = async (
  id: string,
  data: UpdateActivityRequest
): Promise<Activity> => {
  const response = await api.patch(`/crm/activities/${id}`, data);
  return extractData(response);
};

/**
 * Deleta uma atividade
 */
export const deleteActivity = async (id: string): Promise<void> => {
  await api.delete(`/crm/activities/${id}`);
};

/**
 * Adiciona uma nota a uma atividade
 */
export const addActivityNote = async (
  activityId: string,
  content: string
): Promise<ActivityNote> => {
  const response = await api.post(`/crm/activities/${activityId}/notes`, {
    content,
  });
  return extractData(response);
};

/**
 * Obtém atividades do calendário por mês
 */
export const getCalendarActivities = async (
  year: number,
  month: number
): Promise<Record<string, Activity[]>> => {
  const response = await api.get(
    `/crm/activities/calendar/${year}/${month}`
  );
  return extractData(response);
};

/**
 * Obtém atividades atrasadas
 */
export const getOverdueActivities = async (): Promise<Activity[]> => {
  const response = await api.get('/crm/activities/overdue');
  return extractData(response);
};

/**
 * Obtém estatísticas de atividades
 */
export const getActivityStats = async (): Promise<ActivityStats> => {
  const response = await api.get('/crm/activities/stats');
  return extractData(response);
};

export default {
  createActivity,
  getActivities,
  getActivityById,
  updateActivity,
  deleteActivity,
  addActivityNote,
  getCalendarActivities,
  getOverdueActivities,
  getActivityStats,
};
