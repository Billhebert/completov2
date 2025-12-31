/**
 * MCP Service
 */

import api, { extractData } from '../../../core/utils/api';
import { Mcp, CreateMcpRequest, UpdateMcpRequest } from '../types';
import { PaginatedResult, PaginationParams } from '../../../core/types';

export const getAll = async (params?: PaginationParams): Promise<PaginatedResult<Mcp>> => {
  const response = await api.get('/mcp', { params });
  return extractData(response);
};

export const getById = async (id: string): Promise<Mcp> => {
  const response = await api.get(`/mcp/${id}`);
  return extractData(response);
};

export const create = async (data: CreateMcpRequest): Promise<Mcp> => {
  const response = await api.post('/mcp', data);
  return extractData(response);
};

export const update = async (id: string, data: UpdateMcpRequest): Promise<Mcp> => {
  const response = await api.put(`/mcp/${id}`, data);
  return extractData(response);
};

export const remove = async (id: string): Promise<void> => {
  await api.delete(`/mcp/${id}`);
};
