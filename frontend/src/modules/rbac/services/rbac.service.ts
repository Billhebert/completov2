/**
 * RBAC Service
 */

import api, { extractData } from '../../../core/utils/api';
import { Rbac, CreateRbacRequest, UpdateRbacRequest } from '../types';
import { PaginatedResult, PaginationParams } from '../../../core/types';

export const getAll = async (params?: PaginationParams): Promise<PaginatedResult<Rbac>> => {
  const response = await api.get('/rbac', { params });
  return extractData(response);
};

export const getById = async (id: string): Promise<Rbac> => {
  const response = await api.get(`/rbac/${id}`);
  return extractData(response);
};

export const create = async (data: CreateRbacRequest): Promise<Rbac> => {
  const response = await api.post('/rbac', data);
  return extractData(response);
};

export const update = async (id: string, data: UpdateRbacRequest): Promise<Rbac> => {
  const response = await api.put(`/rbac/${id}`, data);
  return extractData(response);
};

export const remove = async (id: string): Promise<void> => {
  await api.delete(`/rbac/${id}`);
};
