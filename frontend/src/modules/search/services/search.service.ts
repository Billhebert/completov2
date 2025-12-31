/**
 * Busca Global Service
 */

import api, { extractData } from '../../../core/utils/api';
import { Search, CreateSearchRequest, UpdateSearchRequest } from '../types';
import { PaginatedResult, PaginationParams } from '../../../core/types';

export const getAll = async (params?: PaginationParams): Promise<PaginatedResult<Search>> => {
  const response = await api.get('/search', { params });
  return extractData(response);
};

export const getById = async (id: string): Promise<Search> => {
  const response = await api.get(`/search/${id}`);
  return extractData(response);
};

export const create = async (data: CreateSearchRequest): Promise<Search> => {
  const response = await api.post('/search', data);
  return extractData(response);
};

export const update = async (id: string, data: UpdateSearchRequest): Promise<Search> => {
  const response = await api.put(`/search/${id}`, data);
  return extractData(response);
};

export const remove = async (id: string): Promise<void> => {
  await api.delete(`/search/${id}`);
};
