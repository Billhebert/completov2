/**
 * Auditoria Service
 */

import api, { extractData } from '../../../core/utils/api';
import { Audit, CreateAuditRequest, UpdateAuditRequest } from '../types';
import { PaginatedResult, PaginationParams } from '../../../core/types';

export const getAll = async (params?: PaginationParams): Promise<PaginatedResult<Audit>> => {
  const response = await api.get('/audit', { params });
  return extractData(response);
};

export const getById = async (id: string): Promise<Audit> => {
  const response = await api.get(`/audit/${id}`);
  return extractData(response);
};

export const create = async (data: CreateAuditRequest): Promise<Audit> => {
  const response = await api.post('/audit', data);
  return extractData(response);
};

export const update = async (id: string, data: UpdateAuditRequest): Promise<Audit> => {
  const response = await api.put(`/audit/${id}`, data);
  return extractData(response);
};

export const remove = async (id: string): Promise<void> => {
  await api.delete(`/audit/${id}`);
};
