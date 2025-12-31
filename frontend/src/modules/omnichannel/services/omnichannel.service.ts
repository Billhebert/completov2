/**
 * Omnichannel Service
 */

import api, { extractData } from '../../../core/utils/api';
import { Omnichannel, CreateOmnichannelRequest, UpdateOmnichannelRequest } from '../types';
import { PaginatedResult, PaginationParams } from '../../../core/types';

export const getAll = async (params?: PaginationParams): Promise<PaginatedResult<Omnichannel>> => {
  const response = await api.get('/omnichannel', { params });
  return extractData(response);
};

export const getById = async (id: string): Promise<Omnichannel> => {
  const response = await api.get(`/omnichannel/${id}`);
  return extractData(response);
};

export const create = async (data: CreateOmnichannelRequest): Promise<Omnichannel> => {
  const response = await api.post('/omnichannel', data);
  return extractData(response);
};

export const update = async (id: string, data: UpdateOmnichannelRequest): Promise<Omnichannel> => {
  const response = await api.put(`/omnichannel/${id}`, data);
  return extractData(response);
};

export const remove = async (id: string): Promise<void> => {
  await api.delete(`/omnichannel/${id}`);
};
