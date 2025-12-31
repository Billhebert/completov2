/**
 * Chat Service
 */

import api, { extractData } from '../../../core/utils/api';
import { Chat, CreateChatRequest, UpdateChatRequest } from '../types';
import { PaginatedResult, PaginationParams } from '../../../core/types';

export const getAll = async (params?: PaginationParams): Promise<PaginatedResult<Chat>> => {
  const response = await api.get('/chat', { params });
  return extractData(response);
};

export const getById = async (id: string): Promise<Chat> => {
  const response = await api.get(`/chat/${id}`);
  return extractData(response);
};

export const create = async (data: CreateChatRequest): Promise<Chat> => {
  const response = await api.post('/chat', data);
  return extractData(response);
};

export const update = async (id: string, data: UpdateChatRequest): Promise<Chat> => {
  const response = await api.put(`/chat/${id}`, data);
  return extractData(response);
};

export const remove = async (id: string): Promise<void> => {
  await api.delete(`/chat/${id}`);
};
