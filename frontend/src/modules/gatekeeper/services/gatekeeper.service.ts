/**
 * Gatekeeper Service
 */

import api, { extractData } from '../../../core/utils/api';
import { Gatekeeper, CreateGatekeeperRequest, UpdateGatekeeperRequest } from '../types';
import { PaginatedResult, PaginationParams } from '../../../core/types';

export const getAll = async (params?: PaginationParams): Promise<PaginatedResult<Gatekeeper>> => {
  const response = await api.get('/gatekeeper', { params });
  return extractData(response);
};

export const getById = async (id: string): Promise<Gatekeeper> => {
  const response = await api.get(`/gatekeeper/${id}`);
  return extractData(response);
};

export const create = async (data: CreateGatekeeperRequest): Promise<Gatekeeper> => {
  const response = await api.post('/gatekeeper', data);
  return extractData(response);
};

export const update = async (id: string, data: UpdateGatekeeperRequest): Promise<Gatekeeper> => {
  const response = await api.put(`/gatekeeper/${id}`, data);
  return extractData(response);
};

export const remove = async (id: string): Promise<void> => {
  await api.delete(`/gatekeeper/${id}`);
};
