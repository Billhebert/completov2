/**
 * IA Service
 */

import api, { extractData } from '../../../core/utils/api';
import { Ai, CreateAiRequest, UpdateAiRequest } from '../types';
import { PaginatedResult, PaginationParams } from '../../../core/types';

export const getAll = async (params?: PaginationParams): Promise<PaginatedResult<Ai>> => {
  const response = await api.get('/ai', { params });
  return extractData(response);
};

export const getById = async (id: string): Promise<Ai> => {
  const response = await api.get(`/ai/${id}`);
  return extractData(response);
};

export const create = async (data: CreateAiRequest): Promise<Ai> => {
  const response = await api.post('/ai', data);
  return extractData(response);
};

export const update = async (id: string, data: UpdateAiRequest): Promise<Ai> => {
  const response = await api.put(`/ai/${id}`, data);
  return extractData(response);
};

export const remove = async (id: string): Promise<void> => {
  await api.delete(`/ai/${id}`);
};
