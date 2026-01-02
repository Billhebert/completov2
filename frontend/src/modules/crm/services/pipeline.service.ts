// src/modules/crm/services/pipeline.service.ts
import api from "../../../core/utils/api";

export type CrmStage = {
  id: string;
  pipelineId: string;
  name: string;
  order: number;
  isWon: boolean;
  isLost: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CrmPipeline = {
  id: string;
  companyId: string;
  name: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  stages: CrmStage[];
  _count?: { deals: number };
};

function unwrapArray<T>(resp: any): T[] {
  const d = resp?.data;
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.data)) return d.data;
  if (Array.isArray(d?.data?.data)) return d.data.data;
  return [];
}

function unwrapObject<T>(resp: any): T {
  const d = resp?.data;
  return (d?.data ?? d) as T;
}

export async function listPipelines(): Promise<CrmPipeline[]> {
  const resp = await api.get("/crm/pipelines");
  return unwrapArray<CrmPipeline>(resp);
}

export async function createPipeline(payload: {
  name: string;
  isDefault?: boolean;
  stages?: Array<{ name: string; order: number; isWon?: boolean; isLost?: boolean }>;
}): Promise<CrmPipeline> {
  const resp = await api.post("/crm/pipelines", payload);
  return unwrapObject<CrmPipeline>(resp);
}

export async function updatePipeline(
  id: string,
  payload: { name?: string; isDefault?: boolean }
): Promise<CrmPipeline> {
  const resp = await api.put(`/crm/pipelines/${id}`, payload);
  return unwrapObject<CrmPipeline>(resp);
}

export async function deletePipeline(id: string): Promise<void> {
  await api.delete(`/crm/pipelines/${id}`);
}

export async function createStage(
  pipelineId: string,
  payload: { name: string; order: number; isWon?: boolean; isLost?: boolean }
): Promise<CrmStage> {
  const resp = await api.post(`/crm/pipelines/${pipelineId}/stages`, payload);
  return unwrapObject<CrmStage>(resp);
}

export async function updateStage(
  pipelineId: string,
  stageId: string,
  payload: { name?: string; order?: number; isWon?: boolean; isLost?: boolean }
): Promise<CrmStage> {
  const resp = await api.put(`/crm/pipelines/${pipelineId}/stages/${stageId}`, payload);
  return unwrapObject<CrmStage>(resp);
}

export async function deleteStage(pipelineId: string, stageId: string): Promise<void> {
  await api.delete(`/crm/pipelines/${pipelineId}/stages/${stageId}`);
}

// ✅ REORDER (payload compatível)
export async function reorderStages(pipelineId: string, stageIds: string[]): Promise<void> {
  await api.put(`/crm/pipelines/${pipelineId}/stages/reorder`, {
    orderedStageIds: stageIds,
  });
}
