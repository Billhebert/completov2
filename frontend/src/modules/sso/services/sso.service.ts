/**
 * SSO Service
 */

import api, { extractData } from '../../../core/utils/api';
import { Sso, CreateSsoRequest, UpdateSsoRequest } from '../types';
import { PaginatedResult, PaginationParams } from '../../../core/types';

export const getAll = async (params?: PaginationParams): Promise<PaginatedResult<Sso>> => {
  const response = await api.get('/sso', { params });
  return extractData(response);
};

export const getById = async (id: string): Promise<Sso> => {
  const response = await api.get(`/sso/${id}`);
  return extractData(response);
};

export const create = async (data: CreateSsoRequest): Promise<Sso> => {
  const response = await api.post('/sso', data);
  return extractData(response);
};

export const update = async (id: string, data: UpdateSsoRequest): Promise<Sso> => {
  const response = await api.put(`/sso/${id}`, data);
  return extractData(response);
};

export const remove = async (id: string): Promise<void> => {
  await api.delete(`/sso/${id}`);
};
