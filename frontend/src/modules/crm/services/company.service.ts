// src/modules/crm/services/company.service.ts
import api, { extractData } from '../../../core/utils/api';
import type { Company, CompanyFilters } from '../types';

type PaginationParams = {
  page?: number;
  limit?: number;
};

type PaginatedResponse<T> = {
  data: T[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

export const getCompanies = async (
  params?: PaginationParams & CompanyFilters
): Promise<PaginatedResponse<Company>> => {
  try {
    const response = await api.get('/crm/companies', { params });
    return extractData(response);
  } catch (err: any) {
    // fallback seguro para rota inexistente
    if (err?.response?.status === 404) {
      return {
        data: [],
        pagination: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 50,
          total: 0,
          pages: 0,
        },
      };
    }
    throw err;
  }
};

export const createCompany = async (payload: Partial<Company>) => {
  const response = await api.post('/crm/companies', payload);
  return extractData(response);
};

export const updateCompany = async (id: string, payload: Partial<Company>) => {
  // Backend usa PUT para atualizar companies
  const response = await api.put(`/crm/companies/${id}`, payload);
  return extractData(response);
};

export const deleteCompany = async (id: string) => {
  const response = await api.delete(`/crm/companies/${id}`);
  return extractData(response);
};
