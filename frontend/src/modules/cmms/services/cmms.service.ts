/**
 * CMMS Service
 */

import api, { extractData } from '../../../core/utils/api';
import { Cmms, CreateCmmsRequest, UpdateCmmsRequest } from '../types';
import { PaginatedResult, PaginationParams } from '../../../core/types';

export const getAll = async (params?: PaginationParams): Promise<PaginatedResult<Cmms>> => {
  const response = await api.get('/cmms', { params });
  return extractData(response);
};

export const getById = async (id: string): Promise<Cmms> => {
  const response = await api.get(`/cmms/${id}`);
  return extractData(response);
};

export const create = async (data: CreateCmmsRequest): Promise<Cmms> => {
  const response = await api.post('/cmms', data);
  return extractData(response);
};

export const update = async (id: string, data: UpdateCmmsRequest): Promise<Cmms> => {
  const response = await api.put(`/cmms/${id}`, data);
  return extractData(response);
};

export const remove = async (id: string): Promise<void> => {
  await api.delete(`/cmms/${id}`);
};
