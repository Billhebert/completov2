// src/modules/crm/services/deal.service.ts
/**
 * Deal Service (sem auto-criação de contato)
 * - Resolve contactName -> contactId (somente busca)
 * - Se não achar, lança erro amigável (não dispara 409 no backend)
 * - Envia payload “limpo” (reduz 422)
 * - ✅ Suporta pipelineId e stageId
 * - ✅ updateDealStage compatível: stage(string) OU stageId(uuid)
 */

import api from '../../../core/utils/api';
import type { Deal, CreateDealRequest, UpdateDealRequest, DealFilters } from '../types';
import type { PaginatedResult, PaginationParams } from '../../../core/types';

import * as contactService from './contact.service';
import * as companyService from './company.service';

type AnyObj = Record<string, any>;

const normalizeString = (v: any): string | undefined => {
  if (typeof v !== 'string') return undefined;
  const s = v.trim();
  return s.length ? s : undefined;
};

const normalizeNumber = (v: any): number | undefined => {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
};

const normalizeDateToISO = (v: any): string | undefined => {
  const s = normalizeString(v);
  if (!s) return undefined;

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date(`${s}T00:00:00.000Z`);
    return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
  }

  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
};

const isUUID = (v: any) =>
  typeof v === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

async function resolveContactIdFromName(name: string): Promise<string | undefined> {
  const key = name.trim().toLowerCase();
  if (!key) return undefined;

  const res = await contactService.getContacts({ page: 1, limit: 20, search: name } as any);
  const list = Array.isArray(res?.data) ? res.data : [];

  const exact = list.find((c: any) => String(c?.name ?? '').trim().toLowerCase() === key);
  const chosen = exact ?? list[0];
  const id = normalizeString(chosen?.id);

  return id;
}

async function resolveCompanyIdFromName(name: string): Promise<string | undefined> {
  const key = name.trim().toLowerCase();
  if (!key) return undefined;

  const res = await companyService.getCompanies({ page: 1, limit: 20, search: name } as any);
  const list = Array.isArray((res as any)?.data) ? (res as any).data : [];

  const exact = list.find((c: any) => String(c?.name ?? '').trim().toLowerCase() === key);
  const chosen = exact ?? list[0];
  const id = normalizeString(chosen?.id);

  return id;
}

async function normalizeCreatePayload(input: AnyObj): Promise<CreateDealRequest & AnyObj> {
  const title = normalizeString(input?.title);
  const value = normalizeNumber(input?.value);

  const stage = normalizeString(input?.stage) as any;
  const probability = normalizeNumber(input?.probability);
  const expectedCloseDate = normalizeDateToISO(input?.expectedCloseDate);

  let contactId = normalizeString(input?.contactId);
  let companyId = normalizeString(input?.companyId);

  const contactName = normalizeString(input?.contactName);
  const companyName = normalizeString(input?.companyName);

  // ✅ pipeline/stageId (novos)
  const pipelineId = normalizeString(input?.pipelineId);
  const stageId = normalizeString(input?.stageId);

  if (!contactId && contactName) {
    contactId = await resolveContactIdFromName(contactName);
  }

  if (!companyId && companyName) {
    companyId = await resolveCompanyIdFromName(companyName);
  }

  if (!contactId) {
    throw new Error(
      'Contato é obrigatório. Crie o contato primeiro (CRM > Contatos) e depois selecione/insira o nome corretamente.'
    );
  }

  const payload: CreateDealRequest & AnyObj = {
    title: title ?? '',
    value: value ?? 0,
    contactId,
  };

  if (stage) payload.stage = stage;
  if (typeof probability === 'number') payload.probability = probability;
  if (expectedCloseDate) payload.expectedCloseDate = expectedCloseDate;
  if (companyId) payload.companyId = companyId as any;

  // ✅ adiciona sem quebrar types
  if (pipelineId) payload.pipelineId = pipelineId;
  if (stageId) payload.stageId = stageId;

  return payload;
}

async function normalizeUpdatePayload(input: AnyObj): Promise<UpdateDealRequest & AnyObj> {
  const out: UpdateDealRequest & AnyObj = {};

  const title = normalizeString(input?.title);
  const value = normalizeNumber(input?.value);
  const stage = normalizeString(input?.stage);
  const probability = normalizeNumber(input?.probability);
  const expectedCloseDate = normalizeDateToISO(input?.expectedCloseDate);

  let contactId = normalizeString(input?.contactId);
  let companyId = normalizeString(input?.companyId);

  const contactName = normalizeString(input?.contactName);
  const companyName = normalizeString(input?.companyName);

  const pipelineId = normalizeString(input?.pipelineId);
  const stageId = normalizeString(input?.stageId);

  if (!contactId && contactName) {
    contactId = await resolveContactIdFromName(contactName);
  }
  if (!companyId && companyName) {
    companyId = await resolveCompanyIdFromName(companyName);
  }

  if (title) out.title = title;
  if (typeof value === 'number') out.value = value;
  if (stage) out.stage = stage as any;
  if (typeof probability === 'number') out.probability = probability;
  if (expectedCloseDate) out.expectedCloseDate = expectedCloseDate;
  if (contactId) out.contactId = contactId;
  if (companyId) out.companyId = companyId as any;

  // ✅ adiciona sem quebrar types
  if (pipelineId) out.pipelineId = pipelineId;
  if (stageId) out.stageId = stageId;

  return out;
}

const toArray = <T>(v: any): T[] => (Array.isArray(v) ? v : []);

const normalizePaginated = <T>(payload: AnyObj): PaginatedResult<T> => {
  const directData = [
    ...toArray<T>(payload?.data),
    ...toArray<T>(payload?.items),
    ...toArray<T>(payload?.deals),
  ];

  const nested = payload?.result ?? payload?.data?.result ?? payload?.data ?? payload?.payload ?? null;

  const nestedData = [
    ...toArray<T>(nested?.data),
    ...toArray<T>(nested?.items),
    ...toArray<T>(nested?.deals),
  ];

  const data = directData.length ? directData : nestedData;

  const pagination =
    payload?.pagination ??
    payload?.meta ??
    nested?.pagination ??
    nested?.meta ??
    payload?.data?.pagination ??
    payload?.data?.meta ??
    undefined;

  return { data, pagination } as PaginatedResult<T>;
};

export const getDeals = async (
  params?: PaginationParams & DealFilters
): Promise<PaginatedResult<Deal>> => {
  const response = await api.get('/crm/deals', { params });
  return normalizePaginated<Deal>(response.data);
};

export const createDeal = async (input: AnyObj): Promise<Deal> => {
  const payload = await normalizeCreatePayload(input);
  const response = await api.post('/crm/deals', payload);
  const raw = response.data?.data ?? response.data?.deal ?? response.data;
  return raw as Deal;
};

export const updateDeal = async (id: string, input: AnyObj): Promise<Deal> => {
  const payload = await normalizeUpdatePayload(input);
  const response = await api.put(`/crm/deals/${id}`, payload);
  const raw = response.data?.data ?? response.data?.deal ?? response.data;
  return raw as Deal;
};

export const deleteDeal = async (id: string): Promise<void> => {
  await api.delete(`/crm/deals/${id}`);
};

/**
 * ✅ Compatível com os dois modelos:
 * - Se receber UUID -> envia { stageId }
 * - Se receber string comum -> envia { stage }
 */
export const updateDealStage = async (id: string, stageOrStageId: string): Promise<Deal> => {
  const body = isUUID(stageOrStageId)
    ? { stageId: stageOrStageId }
    : { stage: stageOrStageId };

  const response = await api.patch(`/crm/deals/${id}/stage`, body);
  const raw = response.data?.data ?? response.data?.deal ?? response.data;
  return raw as Deal;
};
