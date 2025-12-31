/**
 * Parcerias Service
 */

import api, { extractData } from '../../../core/utils/api';
import { Partnerships, CreatePartnershipsRequest, UpdatePartnershipsRequest } from '../types';
import { PaginatedResult, PaginationParams } from '../../../core/types';

export const getAll = async (params?: PaginationParams): Promise<PaginatedResult<Partnerships>> => {
  const response = await api.get('/partnerships', { params });
  return extractData(response);
};

export const getById = async (id: string): Promise<Partnerships> => {
  const response = await api.get(`/partnerships/${id}`);
  return extractData(response);
};

export const create = async (data: CreatePartnershipsRequest): Promise<Partnerships> => {
  const response = await api.post('/partnerships', data);
  return extractData(response);
};

export const update = async (id: string, data: UpdatePartnershipsRequest): Promise<Partnerships> => {
  const response = await api.put(`/partnerships/${id}`, data);
  return extractData(response);
};

export const remove = async (id: string): Promise<void> => {
  await api.delete(`/partnerships/${id}`);
};
