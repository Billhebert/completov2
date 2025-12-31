/**
 * ERP Service
 */

import api, { extractData } from '../../../core/utils/api';
import { Erp, CreateErpRequest, UpdateErpRequest } from '../types';
import { PaginatedResult, PaginationParams } from '../../../core/types';

export const getAll = async (params?: PaginationParams): Promise<PaginatedResult<Erp>> => {
  const response = await api.get('/erp', { params });
  return extractData(response);
};

export const getById = async (id: string): Promise<Erp> => {
  const response = await api.get(`/erp/${id}`);
  return extractData(response);
};

export const create = async (data: CreateErpRequest): Promise<Erp> => {
  const response = await api.post('/erp', data);
  return extractData(response);
};

export const update = async (id: string, data: UpdateErpRequest): Promise<Erp> => {
  const response = await api.put(`/erp/${id}`, data);
  return extractData(response);
};

export const remove = async (id: string): Promise<void> => {
  await api.delete(`/erp/${id}`);
};
