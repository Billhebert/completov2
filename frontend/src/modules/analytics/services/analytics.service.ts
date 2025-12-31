/**
 * Analytics Service
 */

import api, { extractData } from '../../../core/utils/api';
import { Analytics, CreateAnalyticsRequest, UpdateAnalyticsRequest } from '../types';
import { PaginatedResult, PaginationParams } from '../../../core/types';

export const getAll = async (params?: PaginationParams): Promise<PaginatedResult<Analytics>> => {
  const response = await api.get('/analytics', { params });
  return extractData(response);
};

export const getById = async (id: string): Promise<Analytics> => {
  const response = await api.get(`/analytics/${id}`);
  return extractData(response);
};

export const create = async (data: CreateAnalyticsRequest): Promise<Analytics> => {
  const response = await api.post('/analytics', data);
  return extractData(response);
};

export const update = async (id: string, data: UpdateAnalyticsRequest): Promise<Analytics> => {
  const response = await api.put(`/analytics/${id}`, data);
  return extractData(response);
};

export const remove = async (id: string): Promise<void> => {
  await api.delete(`/analytics/${id}`);
};
