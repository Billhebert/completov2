/**
 * API Keys Service
 */

import api, { extractData } from '../../../core/utils/api';
import { Apikeys, CreateApikeysRequest, UpdateApikeysRequest } from '../types';
import { PaginatedResult, PaginationParams } from '../../../core/types';

export const getAll = async (params?: PaginationParams): Promise<PaginatedResult<Apikeys>> => {
  const response = await api.get('/apikeys', { params });
  return extractData(response);
};

export const getById = async (id: string): Promise<Apikeys> => {
  const response = await api.get(`/apikeys/${id}`);
  return extractData(response);
};

export const create = async (data: CreateApikeysRequest): Promise<Apikeys> => {
  const response = await api.post('/apikeys', data);
  return extractData(response);
};

export const update = async (id: string, data: UpdateApikeysRequest): Promise<Apikeys> => {
  const response = await api.put(`/apikeys/${id}`, data);
  return extractData(response);
};

export const remove = async (id: string): Promise<void> => {
  await api.delete(`/apikeys/${id}`);
};
