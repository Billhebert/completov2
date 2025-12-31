/**
 * Aprendizado Service
 */

import api, { extractData } from '../../../core/utils/api';
import { Learning, CreateLearningRequest, UpdateLearningRequest } from '../types';
import { PaginatedResult, PaginationParams } from '../../../core/types';

export const getAll = async (params?: PaginationParams): Promise<PaginatedResult<Learning>> => {
  const response = await api.get('/learning', { params });
  return extractData(response);
};

export const getById = async (id: string): Promise<Learning> => {
  const response = await api.get(`/learning/${id}`);
  return extractData(response);
};

export const create = async (data: CreateLearningRequest): Promise<Learning> => {
  const response = await api.post('/learning', data);
  return extractData(response);
};

export const update = async (id: string, data: UpdateLearningRequest): Promise<Learning> => {
  const response = await api.put(`/learning/${id}`, data);
  return extractData(response);
};

export const remove = async (id: string): Promise<void> => {
  await api.delete(`/learning/${id}`);
};
