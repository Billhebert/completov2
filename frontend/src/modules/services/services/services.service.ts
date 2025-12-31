/**
 * Serviços Service
 */

import api, { extractData } from '../../../core/utils/api';
import { Services, CreateServicesRequest, UpdateServicesRequest } from '../types';
import { PaginatedResult, PaginationParams } from '../../../core/types';

export const getAll = async (params?: PaginationParams): Promise<PaginatedResult<Services>> => {
  const response = await api.get('/services', { params });
  return extractData(response);
};

export const getById = async (id: string): Promise<Services> => {
  const response = await api.get(`/services/${id}`);
  return extractData(response);
};

export const create = async (data: CreateServicesRequest): Promise<Services> => {
  const response = await api.post('/services', data);
  return extractData(response);
};

export const update = async (id: string, data: UpdateServicesRequest): Promise<Services> => {
  const response = await api.put(`/services/${id}`, data);
  return extractData(response);
};

export const remove = async (id: string): Promise<void> => {
  await api.delete(`/services/${id}`);
};
