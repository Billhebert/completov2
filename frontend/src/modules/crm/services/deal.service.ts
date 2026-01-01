/**
 * Deal Service
 * Serviço para gestão de negociações
 */

import api, { extractData } from '../../../core/utils/api';
import { Deal, CreateDealRequest, UpdateDealRequest, DealFilters } from '../types';
import { PaginatedResult, PaginationParams } from '../../../core/types';

export const getDeals = async (
  params?: PaginationParams & DealFilters
): Promise<PaginatedResult<Deal>> => {
  const response = await api.get('/crm/deals', { params });
  return extractData(response);
};

export const getDealById = async (id: string): Promise<Deal> => {
  const response = await api.get(`/crm/deals/${id}`);
  return extractData(response);
};

export const createDeal = async (data: CreateDealRequest): Promise<Deal> => {
  const response = await api.post('/crm/deals', data);
  return extractData(response);
};

export const updateDeal = async (id: string, data: UpdateDealRequest): Promise<Deal> => {
  const response = await api.put(`/crm/deals/${id}`, data);
  return extractData(response);
};

export const deleteDeal = async (id: string): Promise<void> => {
  await api.delete(`/crm/deals/${id}`);
};

export const bulkDelete = async (ids: string[]): Promise<void> => {
  await api.post('/crm/deals/bulk-delete', { ids });
};

export const updateStage = async (id: string, stage: string): Promise<Deal> => {
  const response = await api.patch(`/crm/deals/${id}/stage`, { stage });
  return extractData(response);
};
