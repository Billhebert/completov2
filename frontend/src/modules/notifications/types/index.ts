/**
 * Notificações Module Types
 */

export interface Notifications {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CreateNotificationsRequest {
  name: string;
  description?: string;
}

export interface UpdateNotificationsRequest {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive';
}
