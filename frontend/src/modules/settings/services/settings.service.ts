/**
 * Configurações Service
 */

import api, { extractData } from '../../../core/utils/api';
import { Settings, CreateSettingsRequest, UpdateSettingsRequest } from '../types';
import { PaginatedResult, PaginationParams } from '../../../core/types';

export const getAll = async (params?: PaginationParams): Promise<PaginatedResult<Settings>> => {
  const response = await api.get('/settings', { params });
  return extractData(response);
};

export const getById = async (id: string): Promise<Settings> => {
  const response = await api.get(`/settings/${id}`);
  return extractData(response);
};

export const create = async (data: CreateSettingsRequest): Promise<Settings> => {
  const response = await api.post('/settings', data);
  return extractData(response);
};

export const update = async (id: string, data: UpdateSettingsRequest): Promise<Settings> => {
  const response = await api.put(`/settings/${id}`, data);
  return extractData(response);
};

export const remove = async (id: string): Promise<void> => {
  await api.delete(`/settings/${id}`);
};
