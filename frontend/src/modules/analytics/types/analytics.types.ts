export type AnalyticsDashboard = {
  users: { total: number; active: number };
  crm: {
    contacts: number;
    deals: { total: number; won: number; lost: number; winRate: number };
    revenue: number;
  };
  communication: { messages: number };
  knowledge: { nodes: number };
};

export type PipelineMetric = { stage: string; count: number; value: number };

export type TopContact = {
  id: string;
  name: string;
  email: string | null;
  interactionCount: number;
  dealCount: number;
  totalRevenue: number;
};

export type ActivityItem = {
  id: string;
  name: string;
  createdAt: string;
  actor?: { id: string; name: string; email?: string } | null;
  data?: any;
};

export type TimeSeriesPoint = { date: string; data: any };

// ========== ADVANCED ==========
export type CustomReport = {
  id: string;
  name: string;
  description?: string | null;
  dataSource: 'deals' | 'contacts' | 'interactions' | 'invoices' | 'users';
  metrics: Array<{ field: string; aggregation: string; label?: string }>;
  dimensions?: string[];
  filters?: any;
  dateRange?: { field?: string; start?: string; end?: string } | null;
  createdAt: string;
  createdBy?: { id: string; name: string } | null;
};

export type ReportExecutionResult = {
  columns: Array<{ key: string; label: string }>;
  rows: Array<Record<string, any>>;
  summary?: Record<string, any>;
};

export type Funnel = {
  id: string;
  name: string;
  stages: Array<{ name: string; filter: any }>;
  timeWindow: number;
  createdAt: string;
};

export type FunnelAnalysis = {
  funnelId: string;
  stages: Array<{
    stage: string;
    entered: number;
    converted: number;
    conversionRate: number;
  }>;
};

export type CohortResult = {
  cohorts: Array<{ cohort: string; size: number; retention: number[] }>;
};

export type ChurnResult = {
  periodDays: number;
  churnRate: number;
  churned: number;
  active: number;
};

export type CLVResult = {
  averageClv: number;
  bySegment?: Array<{ segment: string; clv: number }>;
};
