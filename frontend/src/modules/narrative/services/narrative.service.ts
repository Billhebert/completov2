/**
 * Narrativas IA Service
 */

import api, { extractData } from '../../../core/utils/api';
import { Narrative, CreateNarrativeRequest, UpdateNarrativeRequest } from '../types';
import { PaginatedResult, PaginationParams } from '../../../core/types';

export const getAll = async (params?: PaginationParams): Promise<PaginatedResult<Narrative>> => {
  const response = await api.get('/narrative', { params });
  return extractData(response);
};

export const getById = async (id: string): Promise<Narrative> => {
  const response = await api.get(`/narrative/${id}`);
  return extractData(response);
};

export const create = async (data: CreateNarrativeRequest): Promise<Narrative> => {
  const response = await api.post('/narrative', data);
  return extractData(response);
};

export const update = async (id: string, data: UpdateNarrativeRequest): Promise<Narrative> => {
  const response = await api.put(`/narrative/${id}`, data);
  return extractData(response);
};

export const remove = async (id: string): Promise<void> => {
  await api.delete(`/narrative/${id}`);
};
