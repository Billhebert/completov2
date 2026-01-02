// src/modules/crm/services/deal-health-rules.service.ts
import api from "../../../core/utils/api";

export type DealHealthType = "NO_ACTIVITY" | "OVERDUE";

export type DealHealthRule = {
  id: string;
  companyId: string;
  pipelineId: string | null;
  type: DealHealthType;
  name: string;
  days: number;
  color: string;
  priority: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateDealHealthRule = {
  pipelineId?: string | null;
  type: DealHealthType;
  name: string;
  days: number;
  color: string;
  priority?: number;
  isActive?: boolean;
};

export type UpdateDealHealthRule = Partial<CreateDealHealthRule>;

export async function listRules(pipelineId?: string): Promise<DealHealthRule[]> {
  const res = await api.get("/crm/deal-health-rules", { params: pipelineId ? { pipelineId } : undefined });
  return (res.data?.data ?? []) as DealHealthRule[];
}

export async function createRule(input: CreateDealHealthRule): Promise<DealHealthRule> {
  const res = await api.post("/crm/deal-health-rules", input);
  return res.data?.data as DealHealthRule;
}

export async function updateRule(id: string, input: UpdateDealHealthRule): Promise<DealHealthRule> {
  const res = await api.put(`/crm/deal-health-rules/${id}`, input);
  return res.data?.data as DealHealthRule;
}

export async function deleteRule(id: string): Promise<void> {
  await api.delete(`/crm/deal-health-rules/${id}`);
}
