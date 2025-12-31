/**
 * Deduplicação IA Service
 */

import api, { extractData } from '../../../core/utils/api';
import { Deduplication, CreateDeduplicationRequest, UpdateDeduplicationRequest } from '../types';
import { PaginatedResult, PaginationParams } from '../../../core/types';

export const getAll = async (params?: PaginationParams): Promise<PaginatedResult<Deduplication>> => {
  const response = await api.get('/deduplication', { params });
  return extractData(response);
};

export const getById = async (id: string): Promise<Deduplication> => {
  const response = await api.get(`/deduplication/${id}`);
  return extractData(response);
};

export const create = async (data: CreateDeduplicationRequest): Promise<Deduplication> => {
  const response = await api.post('/deduplication', data);
  return extractData(response);
};

export const update = async (id: string, data: UpdateDeduplicationRequest): Promise<Deduplication> => {
  const response = await api.put(`/deduplication/${id}`, data);
  return extractData(response);
};

export const remove = async (id: string): Promise<void> => {
  await api.delete(`/deduplication/${id}`);
};
