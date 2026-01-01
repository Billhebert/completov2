import type {
  ActivityItem,
  AnalyticsDashboard,
  CLVResult,
  CohortResult,
  ChurnResult,
  CustomReport,
  Funnel,
  FunnelAnalysis,
  PipelineMetric,
  ReportExecutionResult,
  TimeSeriesPoint,
  TopContact,
} from '../types/analytics.types';

/**
 * IMPORTANTE:
 * - Por padrão, seguimos o backend em /analytics/...
 * - Se seu core estiver em /api/v1/analytics, troque o BASE_URL aqui.
 */
const BASE_URL = '/analytics';

type ApiEnvelope<T> = { success: true; data: T } | { success: false; error?: { message?: string } };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });

  const json = (await res.json().catch(() => ({}))) as ApiEnvelope<T> | any;

  if (!res.ok || json?.success === false) {
    const msg = json?.error?.message || `Erro HTTP ${res.status}`;
    throw new Error(msg);
  }

  // Se seu backend não envelopa (sem {success,data}), cai no raw:
  return (json?.data ?? json) as T;
}

/* =========================
   CORE
========================= */
export async function getDashboard(): Promise<AnalyticsDashboard> {
  return request<AnalyticsDashboard>('/dashboard');
}

export async function getTimeSeries(metric: string, params?: { startDate?: string; endDate?: string }) {
  const qs = new URLSearchParams({ metric });
  if (params?.startDate) qs.set('startDate', params.startDate);
  if (params?.endDate) qs.set('endDate', params.endDate);
  return request<TimeSeriesPoint[]>(`/timeseries?${qs.toString()}`);
}

export async function getPipeline(): Promise<PipelineMetric[]> {
  return request<PipelineMetric[]>('/pipeline');
}

export async function getTopContacts(limit = 10): Promise<TopContact[]> {
  return request<TopContact[]>(`/top-contacts?limit=${encodeURIComponent(limit)}`);
}

export async function getActivity(days = 30): Promise<ActivityItem[]> {
  return request<ActivityItem[]>(`/activity?days=${encodeURIComponent(days)}`);
}

export function exportCsvUrl(type: 'contacts' | 'deals') {
  return `${BASE_URL}/export/${type}`;
}

/* =========================
   ADVANCED (rotas do seu advanced.ts)
========================= */
export async function listReports(): Promise<CustomReport[]> {
  return request<CustomReport[]>('/reports');
}

export async function createReport(payload: Partial<CustomReport>): Promise<CustomReport> {
  return request<CustomReport>('/reports', { method: 'POST', body: JSON.stringify(payload) });
}

export async function executeReport(id: string): Promise<ReportExecutionResult> {
  return request<ReportExecutionResult>(`/reports/${encodeURIComponent(id)}/execute`);
}

export function exportReportPdfUrl(id: string) {
  return `${BASE_URL}/reports/${encodeURIComponent(id)}/export/pdf`;
}

export function exportReportExcelUrl(id: string) {
  return `${BASE_URL}/reports/${encodeURIComponent(id)}/export/excel`;
}

export async function scheduleReport(id: string, payload: any): Promise<{ ok: true } | any> {
  return request(`/reports/${encodeURIComponent(id)}/schedule`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createFunnel(payload: any): Promise<Funnel> {
  return request<Funnel>('/funnels', { method: 'POST', body: JSON.stringify(payload) });
}

export async function analyzeFunnel(id: string): Promise<FunnelAnalysis> {
  return request<FunnelAnalysis>(`/funnels/${encodeURIComponent(id)}/analyze`);
}

export async function getCohorts(params?: Record<string, string>): Promise<CohortResult> {
  const qs = new URLSearchParams(params || {});
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return request<CohortResult>(`/cohorts${suffix}`);
}

export async function getChurn(params?: Record<string, string>): Promise<ChurnResult> {
  const qs = new URLSearchParams(params || {});
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return request<ChurnResult>(`/churn${suffix}`);
}

export async function getCLV(params?: Record<string, string>): Promise<CLVResult> {
  const qs = new URLSearchParams(params || {});
  const suffix = qs.toString() ? `?${qs.toString()}` : '';
  return request<CLVResult>(`/clv${suffix}`);
}
