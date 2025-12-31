/**
 * Simulações Service
 */

import api, { extractData } from '../../../core/utils/api';
import { Simulation, CreateSimulationRequest, UpdateSimulationRequest } from '../types';
import { PaginatedResult, PaginationParams } from '../../../core/types';

export const getAll = async (params?: PaginationParams): Promise<PaginatedResult<Simulation>> => {
  const response = await api.get('/simulation', { params });
  return extractData(response);
};

export const getById = async (id: string): Promise<Simulation> => {
  const response = await api.get(`/simulation/${id}`);
  return extractData(response);
};

export const create = async (data: CreateSimulationRequest): Promise<Simulation> => {
  const response = await api.post('/simulation', data);
  return extractData(response);
};

export const update = async (id: string, data: UpdateSimulationRequest): Promise<Simulation> => {
  const response = await api.put(`/simulation/${id}`, data);
  return extractData(response);
};

export const remove = async (id: string): Promise<void> => {
  await api.delete(`/simulation/${id}`);
};
