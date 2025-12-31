/**
 * Base de Conhecimento Service
 */

import api, { extractData } from '../../../core/utils/api';
import { Knowledge, CreateKnowledgeRequest, UpdateKnowledgeRequest } from '../types';
import { PaginatedResult, PaginationParams } from '../../../core/types';

export const getAll = async (params?: PaginationParams): Promise<PaginatedResult<Knowledge>> => {
  const response = await api.get('/knowledge', { params });
  return extractData(response);
};

export const getById = async (id: string): Promise<Knowledge> => {
  const response = await api.get(`/knowledge/${id}`);
  return extractData(response);
};

export const create = async (data: CreateKnowledgeRequest): Promise<Knowledge> => {
  const response = await api.post('/knowledge', data);
  return extractData(response);
};

export const update = async (id: string, data: UpdateKnowledgeRequest): Promise<Knowledge> => {
  const response = await api.put(`/knowledge/${id}`, data);
  return extractData(response);
};

export const remove = async (id: string): Promise<void> => {
  await api.delete(`/knowledge/${id}`);
};
