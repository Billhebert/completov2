/**
 * Webhooks Service
 */

import api, { extractData } from '../../../core/utils/api';
import { Webhooks, CreateWebhooksRequest, UpdateWebhooksRequest } from '../types';
import { PaginatedResult, PaginationParams } from '../../../core/types';

export const getAll = async (params?: PaginationParams): Promise<PaginatedResult<Webhooks>> => {
  const response = await api.get('/webhooks', { params });
  return extractData(response);
};

export const getById = async (id: string): Promise<Webhooks> => {
  const response = await api.get(`/webhooks/${id}`);
  return extractData(response);
};

export const create = async (data: CreateWebhooksRequest): Promise<Webhooks> => {
  const response = await api.post('/webhooks', data);
  return extractData(response);
};

export const update = async (id: string, data: UpdateWebhooksRequest): Promise<Webhooks> => {
  const response = await api.put(`/webhooks/${id}`, data);
  return extractData(response);
};

export const remove = async (id: string): Promise<void> => {
  await api.delete(`/webhooks/${id}`);
};
