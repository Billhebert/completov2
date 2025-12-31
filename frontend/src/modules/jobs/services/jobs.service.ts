/**
 * Vagas Service
 */

import api, { extractData } from '../../../core/utils/api';
import { Jobs, CreateJobsRequest, UpdateJobsRequest } from '../types';
import { PaginatedResult, PaginationParams } from '../../../core/types';

export const getAll = async (params?: PaginationParams): Promise<PaginatedResult<Jobs>> => {
  const response = await api.get('/jobs', { params });
  return extractData(response);
};

export const getById = async (id: string): Promise<Jobs> => {
  const response = await api.get(`/jobs/${id}`);
  return extractData(response);
};

export const create = async (data: CreateJobsRequest): Promise<Jobs> => {
  const response = await api.post('/jobs', data);
  return extractData(response);
};

export const update = async (id: string, data: UpdateJobsRequest): Promise<Jobs> => {
  const response = await api.put(`/jobs/${id}`, data);
  return extractData(response);
};

export const remove = async (id: string): Promise<void> => {
  await api.delete(`/jobs/${id}`);
};
