/**
 * Crescimento Pessoal Service
 */

import api, { extractData } from '../../../core/utils/api';
import { PeopleGrowth, CreatePeopleGrowthRequest, UpdatePeopleGrowthRequest } from '../types';
import { PaginatedResult, PaginationParams } from '../../../core/types';

export const getAll = async (params?: PaginationParams): Promise<PaginatedResult<PeopleGrowth>> => {
  const response = await api.get('/people-growth', { params });
  return extractData(response);
};

export const getById = async (id: string): Promise<PeopleGrowth> => {
  const response = await api.get(`/people-growth/${id}`);
  return extractData(response);
};

export const create = async (data: CreatePeopleGrowthRequest): Promise<PeopleGrowth> => {
  const response = await api.post('/people-growth', data);
  return extractData(response);
};

export const update = async (id: string, data: UpdatePeopleGrowthRequest): Promise<PeopleGrowth> => {
  const response = await api.put(`/people-growth/${id}`, data);
  return extractData(response);
};

export const remove = async (id: string): Promise<void> => {
  await api.delete(`/people-growth/${id}`);
};
