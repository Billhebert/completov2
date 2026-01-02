// src/modules/crm/services/deal-health.service.ts
import api from "../../../core/utils/api";

export type DealHealth = {
  ruleId: string;
  type: "NO_ACTIVITY" | "OVERDUE";
  name: string;
  color: string;
  days: number;
  threshold: number;
  priority: number;
} | null;

export type DealHealthMetrics = {
  lastInteractionAt: string | null;
  daysWithoutActivity: number | null;
  expectedCloseDate: string | null;
  overdueDays: number;
};

export type DealWithHealth = {
  id: string;
  title: string;
  value: number;
  currency: string;
  stage: string;
  pipelineId?: string | null;
  stageId?: string | null;

  contact?: { id: string; name: string } | null;
  pipeline?: { id: string; name: string } | null;
  stageRef?: { id: string; name: string; order: number } | null;

  interactions?: Array<{ id: string; timestamp: string; type: string; subject?: string | null }>;

  health: DealHealth;
  metrics: DealHealthMetrics;
};

export async function getDealsHealth(params?: {
  pipelineId?: string;
  includeClosed?: boolean;
}): Promise<{ deals: DealWithHealth[]; summary: any; rulesUsed: any[] }> {
  const res = await api.get("/crm/deals/health", {
    params: {
      pipelineId: params?.pipelineId,
      includeClosed: params?.includeClosed ? 1 : undefined,
    },
  });

  return {
    deals: (res.data?.data ?? []) as DealWithHealth[],
    summary: res.data?.summary ?? {},
    rulesUsed: res.data?.rulesUsed ?? [],
  };
}
