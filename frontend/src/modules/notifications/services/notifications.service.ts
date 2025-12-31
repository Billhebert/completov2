/**
 * Notificações Service
 */

import api, { extractData } from '../../../core/utils/api';
import { Notifications, CreateNotificationsRequest, UpdateNotificationsRequest } from '../types';
import { PaginatedResult, PaginationParams } from '../../../core/types';

export const getAll = async (params?: PaginationParams): Promise<PaginatedResult<Notifications>> => {
  const response = await api.get('/notifications', { params });
  return extractData(response);
};

export const getById = async (id: string): Promise<Notifications> => {
  const response = await api.get(`/notifications/${id}`);
  return extractData(response);
};

export const create = async (data: CreateNotificationsRequest): Promise<Notifications> => {
  const response = await api.post('/notifications', data);
  return extractData(response);
};

export const update = async (id: string, data: UpdateNotificationsRequest): Promise<Notifications> => {
  const response = await api.put(`/notifications/${id}`, data);
  return extractData(response);
};

export const remove = async (id: string): Promise<void> => {
  await api.delete(`/notifications/${id}`);
};
