/**
 * Sincronização Service
 */

import api, { extractData } from '../../../core/utils/api';
import { Sync, CreateSyncRequest, UpdateSyncRequest } from '../types';
import { PaginatedResult, PaginationParams } from '../../../core/types';

export const getAll = async (params?: PaginationParams): Promise<PaginatedResult<Sync>> => {
  const response = await api.get('/sync', { params });
  return extractData(response);
};

export const getById = async (id: string): Promise<Sync> => {
  const response = await api.get(`/sync/${id}`);
  return extractData(response);
};

export const create = async (data: CreateSyncRequest): Promise<Sync> => {
  const response = await api.post('/sync', data);
  return extractData(response);
};

export const update = async (id: string, data: UpdateSyncRequest): Promise<Sync> => {
  const response = await api.put(`/sync/${id}`, data);
  return extractData(response);
};

export const remove = async (id: string): Promise<void> => {
  await api.delete(`/sync/${id}`);
};
