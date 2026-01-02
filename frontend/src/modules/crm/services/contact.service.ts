/**
 * Contact Service (alinhado com o backend)
 */

import api from "../../../core/utils/api";
import {
  Contact,
  CreateContactRequest,
  UpdateContactRequest,
  ContactFilters,
} from "../types";
import { PaginatedResult, PaginationParams } from "../../../core/types";

type AnyObj = Record<string, any>;

function toArray<T>(value: any): T[] {
  if (Array.isArray(value)) return value;
  return [];
}

function normalizePaginated<T>(payload: AnyObj): PaginatedResult<T> {
  // formatos aceitos:
  // 1) { data: [...], pagination: {...} }
  // 2) { items: [...], pagination: {...} }
  // 3) { contacts: [...], pagination: {...} }
  // 4) { result: { data: [...], pagination: {...} } }
  // 5) { data: { data: [...], pagination: {...} } }

  const directData =
    toArray<T>(payload?.data) ||
    toArray<T>(payload?.items) ||
    toArray<T>(payload?.contacts);

  const nested =
    payload?.result ??
    payload?.data?.result ??
    payload?.data ??
    payload?.payload ??
    null;

  const nestedData =
    toArray<T>(nested?.data) ||
    toArray<T>(nested?.items) ||
    toArray<T>(nested?.contacts);

  const data = directData.length ? directData : nestedData;

  const pagination =
    payload?.pagination ??
    payload?.meta ??
    nested?.pagination ??
    nested?.meta ??
    payload?.data?.pagination ??
    payload?.data?.meta ??
    undefined;

  return {
    data,
    pagination,
  } as PaginatedResult<T>;
}

function sanitizeContact(raw: any): Contact {
  const tags = Array.isArray(raw?.tags)
    ? raw.tags.filter((t: any) => typeof t === "string" && t.trim().length > 0)
    : null;

  return {
    ...raw,
    tags,
    // compat extra (se vier count com outro nome)
    dealsCount:
      typeof raw?.dealsCount === "number"
        ? raw.dealsCount
        : typeof raw?._aggr_count_deals === "number"
          ? raw._aggr_count_deals
          : undefined,
    interactionsCount:
      typeof raw?.interactionsCount === "number"
        ? raw.interactionsCount
        : typeof raw?._aggr_count_interactions === "number"
          ? raw._aggr_count_interactions
          : undefined,
  } as Contact;
}

export const getContacts = async (
  params?: PaginationParams & ContactFilters
): Promise<PaginatedResult<Contact>> => {
  const response = await api.get("/crm/contacts", { params });

  // axios: response.data = payload
  const normalized = normalizePaginated<Contact>(response.data);
  return {
    ...normalized,
    data: normalized.data.map(sanitizeContact),
  };
};

export const getContactById = async (id: string): Promise<Contact> => {
  const response = await api.get(`/crm/contacts/${id}`);
  const payload = response.data;

  // suportar {data: {...}} e retorno direto
  const raw = payload?.data ?? payload?.contact ?? payload;
  return sanitizeContact(raw);
};

export const createContact = async (
  data: CreateContactRequest
): Promise<Contact> => {
  const response = await api.post("/crm/contacts", data);
  const payload = response.data;
  const raw = payload?.data ?? payload?.contact ?? payload;
  return sanitizeContact(raw);
};

export const updateContact = async (
  id: string,
  data: UpdateContactRequest
): Promise<Contact> => {
  const response = await api.patch(`/crm/contacts/${id}`, data);
  const payload = response.data;
  const raw = payload?.data ?? payload?.contact ?? payload;
  return sanitizeContact(raw);
};

export const deleteContact = async (id: string): Promise<void> => {
  await api.delete(`/crm/contacts/${id}`);
};

export const bulkDelete = async (ids: string[]): Promise<void> => {
  await api.post("/crm/contacts/bulk-delete", { ids });
};
