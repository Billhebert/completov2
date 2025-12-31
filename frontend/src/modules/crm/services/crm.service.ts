/**
 * CRM Service
 */

import api, { extractData } from '../../../core/utils/api';
import { Crm, CreateCrmRequest, UpdateCrmRequest } from '../types';
import { PaginatedResult, PaginationParams } from '../../../core/types';

export const getAll = async (params?: PaginationParams): Promise<PaginatedResult<Crm>> => {
  const response = await api.get('/crm', { params });
  return extractData(response);
};

export const getById = async (id: string): Promise<Crm> => {
  const response = await api.get(`/crm/${id}`);
  return extractData(response);
};

export const create = async (data: CreateCrmRequest): Promise<Crm> => {
  const response = await api.post('/crm', data);
  return extractData(response);
};

export const update = async (id: string, data: UpdateCrmRequest): Promise<Crm> => {
  const response = await api.put(`/crm/${id}`, data);
  return extractData(response);
};

export const remove = async (id: string): Promise<void> => {
  await api.delete(`/crm/${id}`);
};
