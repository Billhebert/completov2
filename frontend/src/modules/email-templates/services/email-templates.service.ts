/**
 * Templates de Email Service
 */

import api, { extractData } from '../../../core/utils/api';
import { EmailTemplates, CreateEmailTemplatesRequest, UpdateEmailTemplatesRequest } from '../types';
import { PaginatedResult, PaginationParams } from '../../../core/types';

export const getAll = async (params?: PaginationParams): Promise<PaginatedResult<EmailTemplates>> => {
  const response = await api.get('/email-templates', { params });
  return extractData(response);
};

export const getById = async (id: string): Promise<EmailTemplates> => {
  const response = await api.get(`/email-templates/${id}`);
  return extractData(response);
};

export const create = async (data: CreateEmailTemplatesRequest): Promise<EmailTemplates> => {
  const response = await api.post('/email-templates', data);
  return extractData(response);
};

export const update = async (id: string, data: UpdateEmailTemplatesRequest): Promise<EmailTemplates> => {
  const response = await api.put(`/email-templates/${id}`, data);
  return extractData(response);
};

export const remove = async (id: string): Promise<void> => {
  await api.delete(`/email-templates/${id}`);
};
