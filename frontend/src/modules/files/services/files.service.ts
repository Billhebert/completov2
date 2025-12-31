/**
 * Arquivos Service
 */

import api, { extractData } from '../../../core/utils/api';
import { Files, CreateFilesRequest, UpdateFilesRequest } from '../types';
import { PaginatedResult, PaginationParams } from '../../../core/types';

export const getAll = async (params?: PaginationParams): Promise<PaginatedResult<Files>> => {
  const response = await api.get('/files', { params });
  return extractData(response);
};

export const getById = async (id: string): Promise<Files> => {
  const response = await api.get(`/files/${id}`);
  return extractData(response);
};

export const create = async (data: CreateFilesRequest): Promise<Files> => {
  const response = await api.post('/files', data);
  return extractData(response);
};

export const update = async (id: string, data: UpdateFilesRequest): Promise<Files> => {
  const response = await api.put(`/files/${id}`, data);
  return extractData(response);
};

export const remove = async (id: string): Promise<void> => {
  await api.delete(`/files/${id}`);
};
