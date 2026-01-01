/**
 * Contact Service
 * Serviço para gestão de contatos
 */

import api, { extractData } from '../../../core/utils/api';
import { Contact, CreateContactRequest, UpdateContactRequest, ContactFilters } from '../types';
import { PaginatedResult, PaginationParams } from '../../../core/types';

export const getContacts = async (
  params?: PaginationParams & ContactFilters
): Promise<PaginatedResult<Contact>> => {
  const response = await api.get('/crm/contacts', { params });
  return extractData(response);
};

export const getContactById = async (id: string): Promise<Contact> => {
  const response = await api.get(`/crm/contacts/${id}`);
  return extractData(response);
};

export const createContact = async (data: CreateContactRequest): Promise<Contact> => {
  const response = await api.post('/crm/contacts', data);
  return extractData(response);
};

export const updateContact = async (
  id: string,
  data: UpdateContactRequest
): Promise<Contact> => {
  const response = await api.put(`/crm/contacts/${id}`, data);
  return extractData(response);
};

export const deleteContact = async (id: string): Promise<void> => {
  await api.delete(`/crm/contacts/${id}`);
};

export const bulkDelete = async (ids: string[]): Promise<void> => {
  await api.post('/crm/contacts/bulk-delete', { ids });
};
