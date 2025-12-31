/**
 * Automações Service
 */

import api, { extractData } from '../../../core/utils/api';
import { Automations, CreateAutomationsRequest, UpdateAutomationsRequest } from '../types';
import { PaginatedResult, PaginationParams } from '../../../core/types';

export const getAll = async (params?: PaginationParams): Promise<PaginatedResult<Automations>> => {
  const response = await api.get('/automations', { params });
  return extractData(response);
};

export const getById = async (id: string): Promise<Automations> => {
  const response = await api.get(`/automations/${id}`);
  return extractData(response);
};

export const create = async (data: CreateAutomationsRequest): Promise<Automations> => {
  const response = await api.post('/automations', data);
  return extractData(response);
};

export const update = async (id: string, data: UpdateAutomationsRequest): Promise<Automations> => {
  const response = await api.put(`/automations/${id}`, data);
  return extractData(response);
};

export const remove = async (id: string): Promise<void> => {
  await api.delete(`/automations/${id}`);
};
