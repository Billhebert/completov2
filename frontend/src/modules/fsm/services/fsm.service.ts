/**
 * Field Service Service
 */

import api, { extractData } from '../../../core/utils/api';
import { Fsm, CreateFsmRequest, UpdateFsmRequest } from '../types';
import { PaginatedResult, PaginationParams } from '../../../core/types';

export const getAll = async (params?: PaginationParams): Promise<PaginatedResult<Fsm>> => {
  const response = await api.get('/fsm', { params });
  return extractData(response);
};

export const getById = async (id: string): Promise<Fsm> => {
  const response = await api.get(`/fsm/${id}`);
  return extractData(response);
};

export const create = async (data: CreateFsmRequest): Promise<Fsm> => {
  const response = await api.post('/fsm', data);
  return extractData(response);
};

export const update = async (id: string, data: UpdateFsmRequest): Promise<Fsm> => {
  const response = await api.put(`/fsm/${id}`, data);
  return extractData(response);
};

export const remove = async (id: string): Promise<void> => {
  await api.delete(`/fsm/${id}`);
};
