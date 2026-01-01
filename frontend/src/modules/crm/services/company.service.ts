/**
 * Company Service
 * Serviço para gestão de empresas
 */

import api, { extractData } from '../../../core/utils/api';
import { Company, CreateCompanyRequest, UpdateCompanyRequest, CompanyFilters } from '../types';
import { PaginatedResult, PaginationParams } from '../../../core/types';

export const getCompanies = async (
  params?: PaginationParams & CompanyFilters
): Promise<PaginatedResult<Company>> => {
  const response = await api.get('/crm/companies', { params });
  return extractData(response);
};

export const getCompanyById = async (id: string): Promise<Company> => {
  const response = await api.get(`/crm/companies/${id}`);
  return extractData(response);
};

export const createCompany = async (data: CreateCompanyRequest): Promise<Company> => {
  const response = await api.post('/crm/companies', data);
  return extractData(response);
};

export const updateCompany = async (
  id: string,
  data: UpdateCompanyRequest
): Promise<Company> => {
  const response = await api.put(`/crm/companies/${id}`, data);
  return extractData(response);
};

export const deleteCompany = async (id: string): Promise<void> => {
  await api.delete(`/crm/companies/${id}`);
};

export const bulkDelete = async (ids: string[]): Promise<void> => {
  await api.post('/crm/companies/bulk-delete', { ids });
};
